/**
 * P0 spike worker (PLAN 9.2). Throwaway: never merged, never shipped. It owns a transferred OffscreenCanvas and draws
 * synthetic content with the plan's counts and sizes (4.6, 4.8, 5.7): a baked sky bitmap, 2 city bands, the water base
 * through strips, ripple bands, glitter dashes, frond sprites with setTransform, trunk and key fills. It is paced the
 * way the real sky is on WebKit: the page relays its animation frames as ticks, and the worker draws every k-th one
 * (30 fps, or 20), or every one for FRAME.scrollSettleMs after a scroll.
 *
 * Copied, not imported (the spike edits and depends on no existing file): probeRaster, toBitmap, the refresh estimate
 * and refreshDivisor from src/components/sky and src/lib/sky; the sky and water bake loops from the plan's
 * review/bake-bench-opt.mjs, rewritten in TypeScript.
 */

export type Load = 'phone' | 'desktop'

export interface Config {
	load: Load
	/** The whole draw list twice per frame, to see the headroom above the plan's loads. */
	double: boolean
	fps: 30 | 20
	strips: boolean
	ripple: boolean
	glitter: boolean
	fronds: boolean
	/** getImageData(0, 0, 1, 1) after every 30th drawn frame (spike only). */
	readback: boolean
}

/** Percentiles of the samples in the last WINDOW_MS. */
export interface Pct {
	n: number
	p50: number
	p95: number
	max: number
}

/** Steady frames or scroll frames: counts since the last config change, percentiles over its last 30 s. */
export interface Kind {
	frames: number
	drops: number
	js: Pct
	interval: Pct
}

/** Draw calls of the last frame, by group (a doubled load counts both passes). */
export interface DrawCounts {
	navy: number
	sky: number
	city: number
	strips: number
	ripple: number
	glitter: number
	fronds: number
	fills: number
	other: number
	total: number
}

/** master's probeRaster, run once at load. */
export interface ProbeInfo {
	rasterMs: number
	limitMs: number
	megapixels: number
	stars: number
	tripped: boolean
	/** Infinity until the probe trips. */
	softwareFps: number
	/** SCENE_PACING.softwareCost: the scene is still when softwareFps / 3 is under PACING.minFps. */
	sceneStill: boolean
}

/** One real sky and water bake at canvas size (ms), each through the zeroing toBitmap. */
export interface BakeInfo {
	load: Load
	skyW: number
	skyH: number
	waterW: number
	waterH: number
	skyMs: number
	skyBitmapMs: number
	waterMs: number
	waterBitmapMs: number
	/** Everything else the load needs: ripple tiles, glitter, fronds, cities. */
	otherMs: number
}

export interface BootMessage {
	type: 'boot'
	probe: ProbeInfo
	bake: BakeInfo
	/** Smallest step of performance.now() in this worker (ms). */
	timerRes: number
	canvasW: number
	canvasH: number
}

export interface StatsMessage {
	type: 'stats'
	config: Config
	/** Seconds since the last config change. */
	sinceS: number
	/** The display's refresh as the median of the last 16 tick intervals (master's estimate), and as a rate. */
	intervalMs: number
	hz: number
	/** Ticks per drawn frame in use, and what master's refreshDivisor(hz, fps, fps) would say. */
	divisor: number
	masterDivisor: number
	queued: number
	steady: Kind
	scroll: Kind
	flush: Pct
	counts: DrawCounts
	bake: BakeInfo
	stripRows: number
	copies: number
}

export type WorkerMessage = BootMessage | StatsMessage | { type: 'error'; message: string }

export type MainMessage =
	| { type: 'init'; canvas: OffscreenCanvas; width: number; height: number; dpr: number; config: Config; visible: boolean }
	| { type: 'resize'; width: number; height: number; dpr: number }
	| { type: 'config'; config: Config }
	| { type: 'scroll'; y: number }
	| { type: 'tick' }
	| { type: 'visible'; visible: boolean }

/** The parts of DedicatedWorkerGlobalScope the spike uses (the project's TypeScript lib is DOM only). */
interface SpikeScope {
	postMessage(message: WorkerMessage): void
	addEventListener(type: 'message', listener: (event: MessageEvent<MainMessage>) => void): void
}

const scope = self as unknown as SpikeScope

// ---------------------------------------------------------------------------------------------------------------------
// Constants: copies from src/lib/sky/config.ts and the plan (5.1, 5.7)
// ---------------------------------------------------------------------------------------------------------------------

/** ADAPT.rasterMsPerMp and rasterMinMs, PACING.softwareShare, minFps, refreshSamples and relayQueuedMs. */
const RASTER = { msPerMp: 1, minMs: 4, softwareShare: 0.08, minFps: 20 } as const
const REFRESH_SAMPLES = 16
const RELAY_QUEUED_MS = 1
/** SCENE_PACING.softwareCost. */
const SCENE_SOFTWARE_COST = 3
/** FRAME.scrollSettleMs: scrolling counts as active this long after the last scroll message. */
const SCROLL_SETTLE_MS = 180
const NARROW_MAX_WIDTH = 640
const STARS_PER_MP = 230
const NARROW_DENSITY_BOOST = 1.3
const MAX_STARS = 1400

/** Rolling window of the HUD's percentiles (ms). */
const WINDOW_MS = 30_000
/** Every this many drawn frames: the flush probe. */
const FLUSH_EVERY = 30

const NAVY = '#0a192f'
const NEAR = '#120A0E'
const WATER_FLOOR = '#7A3717'

/** WATER.strips.margin: the base is this much wider on each side (CSS px). */
const STRIP_MARGIN = 16
/** STAGE.water.overscan: the base reaches this far below the waterline (CSS px). */
const WATER_OVERSCAN = 180
/** WATER.ripple.bands: the d at which each of the 8 bands ends. */
const RIPPLE_STOPS = [0.06, 0.14, 0.24, 0.36, 0.5, 0.66, 0.82, 1] as const
const RIPPLE_LAYERS = 2
const RIPPLE_CREST_ALPHA = 0.85
const RIPPLE_CREST_B_RATE = 0.55
const GLITTER_PEAK = 0.9
/** WATER.glitter.life: the shortest and longest slot life (s). */
const GLITTER_LIFE = [0.9, 1.6] as const
/** The frond's inner sprite ends at this share of its length (PALMS.frond.hinge). */
const HINGE = 0.48
/** PALMS.frond.spread: degrees either side of up. */
const FROND_SPREAD = 122

const TAU = Math.PI * 2
const DEG = Math.PI / 180

interface PalmSpec {
	/** Crown x as a share of W, and its height above the waterline as a share of H. */
	crownX: number
	crownZ: number
	baseX: number
	bow: number
	trunk: readonly [number, number]
	/** Frond length (CSS px) and how many fronds (two sprites each); `back` rigid short fronds (one sprite each). */
	frond: number
	fronds: number
	back: number
	set: number
}

interface LoadSpec {
	/** Strips over this many device rows of water (5.7). */
	strips: number
	deviceRows: number
	glints: number
	/** Frond sprite draws in all (4.8). */
	sprites: number
	trunkSamples: number
	/** Key mound: height share of H and reach share of W (KEY). */
	key: readonly [number, number]
	/** Which palms share a trunk fill; with the key's, the fills of 4.8. */
	trunkFills: readonly (readonly number[])[]
	/** One entry per frond-sprite set (CSS px of its longest frond). */
	sets: readonly number[]
	palms: readonly PalmSpec[]
}

/** The two loads of PLAN 9.2. Ripple is 32 draws on both (2 layers x 8 bands x 2 copies). */
const LOADS: Record<Load, LoadSpec> = {
	phone: {
		strips: 65,
		deviceRows: 452,
		glints: 50,
		sprites: 30,
		trunkSamples: 8,
		key: [0.052, 0.27],
		trunkFills: [[0]],
		sets: [137],
		palms: [{ crownX: 0.085, crownZ: 0.52 * 0.42, baseX: 0.03, bow: -18, trunk: [13, 7.5], frond: 137, fronds: 12, back: 6, set: 0 }],
	},
	desktop: {
		strips: 64,
		deviceRows: 432,
		glints: 120,
		sprites: 96,
		trunkSamples: 12,
		key: [0.062, 0.26],
		trunkFills: [[0], [1, 2]],
		sets: [172, 128],
		palms: [
			{ crownX: 0.058, crownZ: 0.62 * 0.42, baseX: 0.075, bow: 34, trunk: [18, 10], frond: 172, fronds: 13, back: 8, set: 0 },
			{ crownX: 0.172, crownZ: 0.34 * 0.42, baseX: 0.15, bow: -14, trunk: [16, 9], frond: 128, fronds: 12, back: 8, set: 1 },
			{ crownX: 0.978, crownZ: 0.32 * 0.42, baseX: 0.962, bow: 12, trunk: [14, 8], frond: 104, fronds: 11, back: 8, set: 1 },
		],
	},
}

// ---------------------------------------------------------------------------------------------------------------------
// Small math
// ---------------------------------------------------------------------------------------------------------------------

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

function smoothstep(a: number, b: number, x: number): number {
	const t = clamp((x - a) / (b - a), 0, 1)
	return t * t * (3 - 2 * t)
}

function mulberry32(seed: number): () => number {
	let s = seed | 0
	return () => {
		s = (s + 0x6d2b79f5) | 0
		let t = Math.imul(s ^ (s >>> 15), 1 | s)
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** A 32-bit integer hash, for the glitter's per-life positions. */
function hash32(value: number): number {
	let x = value | 0
	x = Math.imul(x ^ (x >>> 16), 0x7feb352d)
	x = Math.imul(x ^ (x >>> 15), 0x846ca68b)
	return (x ^ (x >>> 16)) >>> 0
}

type Vec3 = [number, number, number]

const hex = (h: string): Vec3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]

/** sRGB 0-255 to linear light 0-1. */
const lin = (c: number): number => {
	const v = Math.max(0, c) / 255
	return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const linHex = (h: string): Vec3 => {
	const c = hex(h)
	return [lin(c[0]), lin(c[1]), lin(c[2])]
}

function toOk(c: Vec3): Vec3 {
	const r = lin(c[0])
	const g = lin(c[1])
	const b = lin(c[2])
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
	return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}

function fromOk(o: Vec3): Vec3 {
	const l = (o[0] + 0.3963377774 * o[1] + 0.2158037573 * o[2]) ** 3
	const m = (o[0] - 0.1055613458 * o[1] - 0.0638541728 * o[2]) ** 3
	const s = (o[0] - 0.0894841775 * o[1] - 1.291485548 * o[2]) ** 3
	return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}

interface Stop {
	t: number
	ok: Vec3
}

/** RAMP.stops.B, the sky's colors from the horizon (t 0) to navy (t 2.6). */
const STOPS: readonly Stop[] = (
	[
		[0, '#F98F1E'],
		[0.08, '#F47C12'],
		[0.2, '#EC6809'],
		[0.32, '#DB570F'],
		[0.44, '#BE4A22'],
		[0.56, '#A5452A'],
		[0.68, '#8A412E'],
		[0.8, '#713F36'],
		[0.9, '#5F3D3D'],
		[1, '#4E3642'],
		[1.18, '#382B46'],
		[1.4, '#26224A'],
		[1.7, '#181D42'],
		[2.1, '#0F1B37'],
		[2.6, '#0A192F'],
	] as const
).map(([t, h]) => ({ t, ok: toOk(hex(h)) }))

const stopAt = (i: number): Stop => STOPS[clamp(i, 0, STOPS.length - 1)] as Stop

/** Linear-light color at t: Hermite on Oklab through every stop, Catmull-Rom tangents on nonuniform t. */
function ramp(tIn: number): Vec3 {
	const t = clamp(tIn, 0, 2.6)
	let i = 1
	while (i < STOPS.length - 1 && t > stopAt(i).t) i++
	const p1 = stopAt(i - 1)
	const p2 = stopAt(i)
	const p0 = stopAt(Math.max(0, i - 2))
	const p3 = stopAt(Math.min(STOPS.length - 1, i + 1))
	const h = p2.t - p1.t
	const u = (t - p1.t) / h
	const u2 = u * u
	const u3 = u2 * u
	const out: Vec3 = [0, 0, 0]
	for (const k of [0, 1, 2] as const) {
		const m1 = ((p2.ok[k] - p0.ok[k]) / (p2.t - p0.t)) * h
		const m2 = ((p3.ok[k] - p1.ok[k]) / (p3.t - p1.t)) * h
		out[k] = (2 * u3 - 3 * u2 + 1) * p1.ok[k] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2.ok[k] + (u3 - u2) * m2
	}
	return fromOk(out)
}

/** A shared 4096-entry TPDF noise table, and linear-to-sRGB through a table (the bake's inner loops use both). */
const NOISE = new Float32Array(4096)
const ENC = new Float32Array(4097)
{
	const rng = mulberry32(12345)
	for (let i = 0; i < NOISE.length; i++) NOISE[i] = rng() + rng() - 1
	for (let i = 0; i <= 4096; i++) {
		const l = i / 4096
		ENC[i] = 255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055)
	}
}
const enc = (l: number): number => ENC[l <= 0 ? 0 : l >= 1 ? 4096 : (l * 4096) | 0] as number

// ---------------------------------------------------------------------------------------------------------------------
// Bitmaps: toBitmap is master's (skyAssets.ts:58) with the zeroing PLAN 4.7 adds
// ---------------------------------------------------------------------------------------------------------------------

function context2d(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
	const context = canvas.getContext('2d')
	// A silent null here would give an empty bitmap and a spike that measures nothing
	if (!context) throw new Error('2D context refused (canvas limit?)')
	return context
}

/** Uploads pixels once as an immutable bitmap (synchronous; works in workers), then zeroes its canvas. */
function toBitmap(pixels: ImageData): ImageBitmap {
	const canvas = new OffscreenCanvas(pixels.width, pixels.height)
	context2d(canvas).putImageData(pixels, 0, 0)
	const bitmap = canvas.transferToImageBitmap()
	canvas.width = canvas.height = 0
	return bitmap
}

/** A bitmap from drawing calls. */
function paint(w: number, h: number, draw: (c: OffscreenCanvasRenderingContext2D) => void): ImageBitmap {
	const canvas = new OffscreenCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)))
	draw(context2d(canvas))
	const bitmap = canvas.transferToImageBitmap()
	canvas.width = canvas.height = 0
	return bitmap
}

interface Pixels {
	data: Uint8ClampedArray<ArrayBuffer>
	width: number
	height: number
}

const toImage = (p: Pixels): ImageData => new ImageData(p.data, p.width, p.height)

// ---------------------------------------------------------------------------------------------------------------------
// The sky and water bakes (PLAN 5.2 and 5.7, from review/bake-bench-opt.mjs)
// ---------------------------------------------------------------------------------------------------------------------

/** One sky: CSS px, the rows from 4 px under the waterline to the ramp's navy top. */
function bakeSky(W: number, zWater: number, warm: number, H: number, sunX: number, sunZ: number): Pixels {
	const narrow = W <= NARROW_MAX_WIDTH
	const zBottom = zWater - 4
	const zTop = zWater + 2.6 * warm + 8
	const rows = Math.ceil(zTop - zBottom)
	const lutSize = 1024
	const lut = new Float32Array(lutSize * 3)
	for (let i = 0; i < lutSize; i++) {
		const col = ramp((i / (lutSize - 1)) * 2.6)
		lut[i * 3] = col[0]
		lut[i * 3 + 1] = col[1]
		lut[i * 3 + 2] = col[2]
	}
	const sigma = narrow ? 0.62 : 0.46
	const a = 0.66
	const b = 0.34
	const c = 0.2
	const g = new Float32Array(W)
	const u2 = new Float32Array(W)
	const edge = new Float32Array(W)
	const dx2 = new Float32Array(W)
	const nx = new Float32Array(W)
	const fx = new Float32Array(W)
	const reach = narrow ? 0.07 : 0.14
	const nearW = (0.12 * warm) ** 2
	const farW = (0.3 * warm) ** 2
	for (let x = 0; x < W; x++) {
		const px = x + 0.5
		g[x] = Math.exp(-(((px - sunX) / (sigma * W)) ** 2))
		const u = (2 * px) / W - 1
		u2[x] = u * u
		edge[x] = 0.5 + 0.5 * smoothstep(0, reach * W, Math.min(px, W - px))
		dx2[x] = ((px - sunX) / 2.3) ** 2
		nx[x] = Math.exp(-(dx2[x] as number) / nearW)
		fx[x] = Math.exp(-(dx2[x] as number) / farW)
	}
	const bloomC = linHex('#FFB347')
	const limbC = linHex('#3A5AA0')
	const data = new Uint8ClampedArray(W * rows * 4)
	let n = 0
	for (let j = 0; j < rows; j++) {
		const z = zTop - j - 0.5
		const t = (z - zWater) / warm
		const sag = ((0.12 * H) / warm) * smoothstep(1.2, 2, t)
		const gone = 1 - smoothstep(0, 1.3, t)
		const dz2 = (z - sunZ) ** 2
		const taper = Math.min(1, j / 8)
		const nz = Math.exp(-dz2 / nearW)
		const fz = Math.exp(-dz2 / farW)
		const hairRow = t + sag > 2.05 && t < 2.45
		let k = j * W * 4
		for (let x = 0; x < W; x++) {
			const gx = g[x] as number
			const tc = t + sag * (u2[x] as number)
			const te = tc / (a + b * gx) + c * (1 - gx)
			// Rows under the waterline have t < 0: the plan's ramp clamps there, and so must the table index
			const f = clamp(te / 2.6, 0, 1) * (lutSize - 1)
			const i0 = f | 0
			const i1 = i0 < lutSize - 1 ? i0 + 1 : i0
			const w = f - i0
			const m = 1 - (1 - (edge[x] as number)) * gone
			const l0 = i0 * 3
			const l1 = i1 * 3
			let r = ((lut[l0] as number) + ((lut[l1] as number) - (lut[l0] as number)) * w) * m
			let gr = ((lut[l0 + 1] as number) + ((lut[l1 + 1] as number) - (lut[l0 + 1] as number)) * w) * m
			let bl = ((lut[l0 + 2] as number) + ((lut[l1 + 2] as number) - (lut[l0 + 2] as number)) * w) * m
			const bloom = 0.42 * (nx[x] as number) * nz + 0.18 * (fx[x] as number) * fz
			r += bloomC[0] * bloom
			gr += bloomC[1] * bloom
			bl += bloomC[2] * bloom
			if (hairRow) {
				const hd = (tc - 2.25) / 0.05
				const hair = 0.08 * Math.exp(-hd * hd)
				r += limbC[0] * hair
				gr += limbC[1] * hair
				bl += limbC[2] * hair
			}
			data[k] = enc(r) + (NOISE[n++ & 4095] as number) * taper
			data[k + 1] = enc(gr) + (NOISE[(n + 1365) & 4095] as number) * taper
			data[k + 2] = enc(bl) + (NOISE[(n + 2730) & 4095] as number) * taper
			data[k + 3] = 255
			k += 4
		}
	}
	return { data, width: W, height: rows }
}

/** The water base: CSS px, STRIP_MARGIN wider each side, WATER_OVERSCAN deeper than the waterline's depth. */
function bakeWater(W: number, zWater: number, sunX: number, R: number): Pixels {
	const w = W + 2 * STRIP_MARGIN
	const rows = zWater + WATER_OVERSCAN
	const data = new Uint8ClampedArray(w * rows * 4)
	const body = (
		[
			[0, '#8F4A22'],
			[0.2, '#A74F29'],
			[0.6, '#96431D'],
			[1, '#7A3717'],
		] as const
	).map(([t, h]) => ({ t, c: linHex(h) }))
	const bodyAt = (d: number): Vec3 => {
		let i = 1
		while (i < body.length - 1 && d > (body[i] as { t: number }).t) i++
		const p = body[i - 1] as { t: number; c: Vec3 }
		const q = body[i] as { t: number; c: Vec3 }
		const u = (d - p.t) / (q.t - p.t)
		return [lerp(p.c[0], q.c[0], u), lerp(p.c[1], q.c[1], u), lerp(p.c[2], q.c[2], u)]
	}
	const glowC = linHex('#FFBE66')
	const core = linHex('#2A120C')
	const sliver = linHex('#F7A23F')
	const hAt = new Float32Array(w)
	const hr = mulberry32(7)
	let cur = 100
	for (let x = 0; x < w; x++) {
		if (x % 18 === 0) cur = 60 + hr() * 68
		hAt[x] = cur
	}
	let n = 0
	for (let p = 0; p < rows; p++) {
		const d = Math.min(1, p / zWater)
		const c0 = bodyAt(d)
		const dark = 1 - 0.24 * smoothstep(0.45, 1, d)
		const fade = (1 - smoothstep(0.04, 0.95, d)) ** 0.9
		const halfW = R * (1.5 + 4.2 * d ** 0.85)
		const z = zWater - p
		const cap = z <= 75 + 24 ? 0.125 : 0.125 + (1 - 0.125) * smoothstep(0, 40, z - 99)
		let k = p * w * 4
		for (let x = 0; x < w; x++) {
			const e = (x - STRIP_MARGIN + 0.5 - sunX) / halfW
			const glow = 0.55 * fade * Math.exp(-e * e)
			let r = c0[0] * dark + glowC[0] * glow
			let g = c0[1] * dark + glowC[1] * glow
			let b = c0[2] * dark + glowC[2] * glow
			const m = 0.86 * (1 - smoothstep(0.36, 0.58, (p + 0.5) / (hAt[x] as number)))
			r += (core[0] - r) * m
			g += (core[1] - g) * m
			b += (core[2] - b) * m
			if (p < 3) {
				const s = Math.exp(-(((x - STRIP_MARGIN - sunX) / (R * 6)) ** 2))
				r += (sliver[0] - r) * s
				g += (sliver[1] - g) * s
				b += (sliver[2] - b) * s
			}
			const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
			if (L > cap) {
				const q = cap / L
				r *= q
				g *= q
				b *= q
			}
			data[k] = enc(r) + (NOISE[n++ & 4095] as number)
			data[k + 1] = enc(g) + (NOISE[(n + 1365) & 4095] as number)
			data[k + 2] = enc(b) + (NOISE[(n + 2730) & 4095] as number)
			data[k + 3] = 255
			k += 4
		}
	}
	return { data, width: w, height: rows }
}

/** A ripple tile of lens-shaped crest dashes (5.7): `band` rows, wrapping horizontally. */
function bakeRippleTile(tileW: number, band: number, seed: number): Pixels {
	const data = new Uint8ClampedArray(tileW * band * 4)
	const r = mulberry32(seed)
	// Low-frequency cluster noise over the tile (value noise, 64 x 16 px cells)
	const cw = Math.ceil(tileW / 64) + 2
	const ch = Math.ceil(band / 16) + 2
	const cells = new Float32Array(cw * ch)
	for (let i = 0; i < cells.length; i++) cells[i] = r()
	const stops = (
		[
			[0, '#F2A24A'],
			[0.2, '#E0793F'],
			[0.6, '#C56A3E'],
			[1, '#A4552F'],
		] as const
	).map(([t, h]) => ({ t, c: linHex(h) }))
	const colorAt = (d: number): Vec3 => {
		let i = 1
		while (i < stops.length - 1 && d > (stops[i] as { t: number }).t) i++
		const p = stops[i - 1] as { t: number; c: Vec3 }
		const q = stops[i] as { t: number; c: Vec3 }
		const u = (d - p.t) / (q.t - p.t)
		return [lerp(p.c[0], q.c[0], u), lerp(p.c[1], q.c[1], u), lerp(p.c[2], q.c[2], u)]
	}
	const cell = (ix: number, iy: number): number => cells[iy * cw + ix] as number
	let y = 0
	while (y < band) {
		const d = y / band
		const rowH = Math.max(1, Math.round(1 + 2 * d))
		const dash = 5 + 30 * d
		const share = 0.52 + (0.22 - 0.52) * d
		const col = colorAt(d)
		const R = enc(col[0])
		const G = enc(col[1])
		const B = enc(col[2])
		let x = (r() * dash) | 0
		while (x < tileW) {
			const len = Math.max(2, Math.round(dash * (1 - 0.4 + 0.8 * r())))
			const nx = x / 64
			const ny = y / 16
			const ix = nx | 0
			const iy = ny | 0
			const fx = nx - ix
			const fy = ny - iy
			const v00 = cell(ix, iy)
			const v10 = cell(ix + 1, iy)
			const v01 = cell(ix, iy + 1)
			const v11 = cell(ix + 1, iy + 1)
			const cluster = v00 + (v10 - v00) * fx + (v01 - v00) * fy + (v00 - v10 - v01 + v11) * fx * fy
			if (cluster < share * 1.4) {
				for (let i = 0; i < len; i++) {
					const s = (i + 0.5) / len
					const alpha = Math.sin(Math.PI * s) ** 0.6 * 255
					const px = (x + i) % tileW
					for (let h = 0; h < rowH && y + h < band; h++) {
						const k = ((y + h) * tileW + px) * 4
						data[k] = R
						data[k + 1] = G
						data[k + 2] = B
						data[k + 3] = alpha
					}
				}
			}
			x += len + Math.round(len * (1 / share - 1) * 0.5 * (0.5 + r()))
		}
		y += rowH + Math.round(r())
	}
	return { data, width: tileW, height: band }
}

// ---------------------------------------------------------------------------------------------------------------------
// Synthetic art: cities, glitter dashes, frond sprites
// ---------------------------------------------------------------------------------------------------------------------

/** Near city (5.5's rules in miniature): groups of 2 or 3 towers, slender or slab, a low base under them. Device px. */
function bakeNearCity(dw: number, bandH: number, unit: number): ImageBitmap {
	const rnd = mulberry32(0x4d49414d)
	return paint(dw, bandH, (c) => {
		c.fillStyle = NEAR
		c.fillRect(0, Math.round(bandH * 0.64), dw, bandH)
		let x = -rnd() * 20 * unit
		while (x < dw) {
			const groupSize = 2 + (rnd() < 0.5 ? 1 : 0)
			for (let g = 0; g < groupSize; g++) {
				const w = (rnd() < 0.2 ? 28 + 12 * rnd() : 13 + 11 * rnd()) * unit
				const r = rnd()
				const share = r < 0.3 ? 0.86 + 0.14 * rnd() : r < 0.7 ? 0.62 + 0.12 * rnd() : 0.5 + 0.1 * rnd()
				const h = share * bandH
				c.fillRect(Math.round(x), Math.round(bandH - h), Math.round(w), Math.ceil(h))
				// A small roof box on some of them
				if (rnd() < 0.15) c.fillRect(Math.round(x + w * 0.3), Math.round(bandH - h - 0.04 * bandH), Math.round(w * 0.4), Math.ceil(0.04 * bandH) + 1)
				x += w + (4 + 10 * rnd()) * unit
			}
			x += (16 + 28 * rnd()) * unit
		}
	})
}

/** Far city: shorter towers in a warm vertical gradient, CSS px (drawn upscaled). */
function bakeFarCity(w: number, h: number, unit: number): ImageBitmap {
	const rnd = mulberry32(0x4d494152)
	return paint(w, h, (c) => {
		const gradient = c.createLinearGradient(0, 0, 0, h)
		gradient.addColorStop(0, '#4A2A2A')
		gradient.addColorStop(1, '#8A4A30')
		c.fillStyle = gradient
		let x = -rnd() * 10 * unit
		while (x < w) {
			const tw = (11 + 9 * rnd()) * unit
			const th = (0.36 + 0.48 * rnd()) * h
			c.fillRect(Math.round(x), Math.round(h - th), Math.round(tw), Math.ceil(th))
			x += tw + (6 + 28 * rnd()) * unit
		}
	})
}

interface Dash {
	y: number
	w: number
	h: number
}

/** WATER.glitter's atlas: 4 horizontal Gaussian dashes, black as nothing, for 'lighter'. Device px. */
function bakeGlitterAtlas(dpr: number): { atlas: ImageBitmap; dashes: Dash[] } {
	const sizes = [
		[6, 1],
		[14, 1.5],
		[26, 2],
		[40, 3],
	] as const
	const dashes: Dash[] = []
	let y = 0
	let widest = 0
	for (const [wCss, hCss] of sizes) {
		const w = Math.ceil(wCss * dpr) + 2
		const h = Math.ceil(hCss * dpr) + 2
		dashes.push({ y, w, h })
		y += h + 1
		widest = Math.max(widest, w)
	}
	const data = new Uint8ClampedArray(widest * y * 4)
	for (let i = 0; i < data.length; i += 4) data[i + 3] = 255
	for (const dash of dashes) {
		const sx = dash.w / 4
		const sy = Math.max(0.6, dash.h / 3)
		for (let yy = 0; yy < dash.h; yy++) {
			for (let xx = 0; xx < dash.w; xx++) {
				const gx = (xx + 0.5 - dash.w / 2) / sx
				const gy = (yy + 0.5 - dash.h / 2) / sy
				const v = Math.exp(-(gx * gx + gy * gy) / 2)
				const k = ((dash.y + yy) * widest + xx) * 4
				data[k] = 255 * v
				data[k + 1] = 214 * v
				data[k + 2] = 140 * v
			}
		}
	}
	return { atlas: toBitmap(new ImageData(data, widest, y)), dashes }
}

interface Sprite {
	bitmap: ImageBitmap
	/** Where the sprite's origin (the frond's base, or its hinge) sits in the bitmap. */
	ox: number
	oy: number
}

interface FrondSet {
	inner: Sprite[]
	outer: Sprite[]
	/** The back layer: a whole frond at half length, one rigid sprite. */
	rigid: Sprite[]
	hingeX: number[]
	hingeY: number[]
}

/** The longest leaflet, as a share of the frond's length. */
const LEAF = 0.2
const LEAF_ANGLE = 40 * DEG
const LEAF_SAG = 0.5

/** Paints a frond pointing +x from the origin, with `droop` sag, between `sa` and `sb` of its length: midrib and leaflets, one fill. */
function paintFrond(c: OffscreenCanvasRenderingContext2D, L: number, droop: number, sa: number, sb: number, dpr: number): void {
	c.fillStyle = NEAR
	c.beginPath()
	const half = 1.1 * dpr
	const steps = 12
	for (let i = 0; i <= steps; i++) {
		const s = lerp(sa, sb, i / steps)
		c.lineTo(s * L, droop * s * s * L - half)
	}
	for (let i = steps; i >= 0; i--) {
		const s = lerp(sa, sb, i / steps)
		c.lineTo(s * L, droop * s * s * L + half)
	}
	c.closePath()
	for (let s = Math.max(0.05, sa - 0.04); s <= Math.min(1, sb + 0.04); s += 0.032) {
		const px = s * L
		const py = droop * s * s * L
		const tangent = Math.atan2(2 * droop * s, 1)
		const len = LEAF * L * Math.sin(Math.PI * s ** 0.7) + 2
		const base = ((2.4 - 0.9 * s) * dpr) / 2
		const bx = Math.cos(tangent) * base
		const by = Math.sin(tangent) * base
		for (const side of [-1, 1]) {
			const angle = tangent + side * LEAF_ANGLE
			// Every triangle winds the same way as the midrib, so the nonzero fill unites them instead of cancelling where they overlap
			c.moveTo(px + side * bx, py + side * by)
			c.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len + (LEAF_SAG * len * len) / L)
			c.lineTo(px - side * bx, py - side * by)
			c.closePath()
		}
	}
	c.fill()
}

/** One sprite of a frond: the part between `s0` and `s1`, with its origin at `originS`. */
function bakeFrondPart(L: number, droop: number, s0: number, s1: number, originS: number, dpr: number): Sprite {
	const overlap = Math.ceil(3 * dpr)
	const pad = 2
	const leafMax = LEAF * L * 1.1 + LEAF_SAG * LEAF * LEAF * L * 1.2 + 4
	const x0 = s0 * L - overlap
	const x1 = s1 * L + overlap
	const top = droop * s0 * s0 * L - leafMax
	const bottom = droop * s1 * s1 * L + leafMax
	const tx = pad - x0
	const ty = pad - top
	const bitmap = paint(x1 - x0 + 2 * pad, bottom - top + 2 * pad, (c) => {
		c.translate(tx, ty)
		paintFrond(c, L, droop, s0, s1, dpr)
	})
	return { bitmap, ox: originS * L + tx, oy: droop * originS * originS * L + ty }
}

/** 5 droop variants of a frond of `lengthCss`, as inner, outer and rigid sprites at device px. */
function bakeFrondSet(lengthCss: number, dpr: number): FrondSet {
	const L = Math.round(lengthCss * dpr)
	const set: FrondSet = { inner: [], outer: [], rigid: [], hingeX: [], hingeY: [] }
	for (let v = 0; v < 5; v++) {
		const droop = 0.26 + 0.46 * (v / 4) ** 1.25
		set.inner.push(bakeFrondPart(L, droop, 0, HINGE, 0, dpr))
		set.outer.push(bakeFrondPart(L, droop, HINGE, 1, HINGE, dpr))
		set.rigid.push(bakeFrondPart(L / 2, droop, 0, 1, 0, dpr))
		set.hingeX.push(HINGE * L)
		set.hingeY.push(droop * HINGE * HINGE * L)
	}
	return set
}

// ---------------------------------------------------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------------------------------------------------

/** A frond or back frond: static parameters, the draw adds the wind. */
interface Frond {
	/** True for a left-pointing frond (mirrored sprite). */
	left: boolean
	/** Degrees from up. */
	beta: number
	variant: number
	scale: number
	period: number
	phase: number
	/** Degrees of sway. */
	amp: number
	bend: number
}

interface Palm {
	spec: PalmSpec
	fronds: Frond[]
	back: Frond[]
	period: number
	phase: number
}

interface Assets {
	load: Load
	spec: LoadSpec
	width: number
	height: number
	dpr: number
	/** The waterline's depth in CSS px as the bakes saw it, and in device rows as the strips cover it. */
	zWater: number
	rowsDev: number
	sunX: number
	sunR: number
	sky: ImageBitmap
	skyRows: number
	water: ImageBitmap
	waterH: number
	crest: [ImageBitmap, ImageBitmap]
	tileW: number
	band: number
	copies: number
	atlas: ImageBitmap
	dashes: Dash[]
	nearCity: ImageBitmap
	nearH: number
	farCity: ImageBitmap
	farH: number
	stripH: Int32Array
	stripY: Int32Array
	stripD: Float32Array
	glintPhase: Float32Array
	glintLife: Float32Array
	keyTop: Float32Array
	sets: FrondSet[]
	palms: Palm[]
	bake: BakeInfo
}

/** Integer device-row heights of `count` strips growing about 5% a row from 1 px, adding up to `total` (5.7's waterRows). */
function waterRows(total: number, count: number): Int32Array {
	let lo = 1.000001
	let hi = 1.6
	for (let i = 0; i < 80; i++) {
		const mid = (lo + hi) / 2
		if ((mid ** count - 1) / (mid - 1) < total) lo = mid
		else hi = mid
	}
	const growth = (lo + hi) / 2
	const heights = new Int32Array(count)
	let cum = 0
	let prev = 0
	for (let i = 0; i < count; i++) {
		cum += growth ** i
		const edge = i === count - 1 ? total : Math.round(cum)
		heights[i] = Math.max(1, edge - prev)
		prev = edge
	}
	return heights
}

function buildPalms(spec: LoadSpec): Palm[] {
	return spec.palms.map((palm, index) => {
		const rnd = mulberry32(0x50414c4d + index * 7919)
		const frond = (beta: number): Frond => {
			const rel = Math.min(1, Math.abs(beta) / FROND_SPREAD)
			// PALMS.frond: length x seeded(0.86-1.06) x (0.72 + 0.34 x min(1, rel x 1.4)); the back layer's sprites are baked at half length
			const length = (0.86 + 0.2 * rnd()) * (0.72 + 0.34 * Math.min(1, rel * 1.4))
			return {
				left: beta < 0,
				beta: Math.abs(beta),
				variant: Math.min(4, Math.round(rel * 4)),
				// Sprites are baked for the set's longest frond: this palm's own is shorter in the small set
				scale: (length * palm.frond) / (spec.sets[palm.set] as number),
				period: 2.6 + 1.8 * rnd(),
				phase: TAU * rnd(),
				amp: (rel < 0.34 ? 2 : rel < 0.67 ? 3.2 : 4.7) * 0.8,
				bend: 0.14 + 0.2 * rel,
			}
		}
		const fronds: Frond[] = []
		for (let i = 0; i < palm.fronds; i++) {
			const even = FROND_SPREAD * (2 * ((i + 0.5) / palm.fronds) - 1)
			fronds.push(frond(even + (rnd() - 0.5) * ((2 * FROND_SPREAD) / palm.fronds) * 0.5))
		}
		const back: Frond[] = []
		for (let i = 0; i < palm.back; i++) back.push(frond(80 * (2 * ((i + 0.5) / palm.back) - 1) + (rnd() - 0.5) * 10))
		return { spec: palm, fronds, back, period: 7 + 2.5 * rnd(), phase: TAU * rnd() }
	})
}

function closeAssets(a: Assets): void {
	a.sky.close()
	a.water.close()
	a.crest[0].close()
	a.crest[1].close()
	a.atlas.close()
	a.nearCity.close()
	a.farCity.close()
	for (const set of a.sets) for (const sprites of [set.inner, set.outer, set.rigid]) for (const sprite of sprites) sprite.bitmap.close()
}

/** Everything one load needs at the current canvas size. The sky and water bakes are timed apart from the rest. */
function buildAssets(load: Load): Assets {
	const spec = LOADS[load]
	const W = width
	const H = height
	const narrow = W <= NARROW_MAX_WIDTH
	const rowsDev = spec.deviceRows
	const zWater = Math.max(8, Math.round(rowsDev / dpr))
	const warm = H * (narrow ? 0.4378 : 0.4822)
	const sunX = (narrow ? 0.62 : 0.645) * W
	const sunZ = zWater + (narrow ? 25 : 30)
	const sunR = narrow ? 15 : 18

	const t0 = performance.now()
	const skyPixels = bakeSky(W, zWater, warm, H, sunX, sunZ)
	const t1 = performance.now()
	const sky = toBitmap(toImage(skyPixels))
	const t2 = performance.now()
	const waterPixels = bakeWater(W, zWater, sunX, sunR)
	const t3 = performance.now()
	const water = toBitmap(toImage(waterPixels))
	const t4 = performance.now()

	const tileW = clamp(W + 2 * STRIP_MARGIN, narrow ? 512 : 1024, 2048)
	const crest: [ImageBitmap, ImageBitmap] = [toBitmap(toImage(bakeRippleTile(tileW, zWater, 11))), toBitmap(toImage(bakeRippleTile(tileW, zWater, 12)))]
	const { atlas, dashes } = bakeGlitterAtlas(dpr)
	const tallest = clamp(0.145 * H, 96, 160)
	const unit = tallest / 128
	const nearH = Math.ceil(tallest * dpr)
	const farH = Math.ceil(0.84 * tallest)
	const nearCity = bakeNearCity(Math.round(W * dpr), nearH, unit * dpr)
	const farCity = bakeFarCity(Math.ceil(W), farH, unit)
	const sets = spec.sets.map((length) => bakeFrondSet(length, dpr))
	const t5 = performance.now()

	const stripH = waterRows(rowsDev, spec.strips)
	const stripY = new Int32Array(spec.strips)
	const stripD = new Float32Array(spec.strips)
	let y = 0
	for (let i = 0; i < spec.strips; i++) {
		const h = stripH[i] as number
		stripY[i] = y
		stripD[i] = (y + h / 2) / rowsDev
		y += h
	}
	const rnd = mulberry32(0x474c4954)
	const glintPhase = new Float32Array(spec.glints)
	const glintLife = new Float32Array(spec.glints)
	for (let i = 0; i < spec.glints; i++) {
		glintPhase[i] = rnd()
		glintLife[i] = lerp(GLITTER_LIFE[0], GLITTER_LIFE[1], rnd())
	}
	// The key mound's irregular top, as heights above the page end (device px)
	const keyTop = new Float32Array(25)
	const kr = mulberry32(0x4b4559)
	for (let i = 0; i < keyTop.length; i++) keyTop[i] = (1 - (i / (keyTop.length - 1)) ** 2.2) * (0.8 + 0.2 * kr())

	return {
		load,
		spec,
		width: W,
		height: H,
		dpr,
		zWater,
		rowsDev,
		sunX,
		sunR,
		sky,
		skyRows: skyPixels.height,
		water,
		waterH: waterPixels.height,
		crest,
		tileW,
		band: zWater,
		copies: Math.ceil(W / tileW) + 1,
		atlas,
		dashes,
		nearCity,
		nearH,
		farCity,
		farH,
		stripH,
		stripY,
		stripD,
		glintPhase,
		glintLife,
		keyTop,
		sets,
		palms: buildPalms(spec),
		bake: {
			load,
			skyW: skyPixels.width,
			skyH: skyPixels.height,
			waterW: waterPixels.width,
			waterH: waterPixels.height,
			skyMs: t1 - t0,
			skyBitmapMs: t2 - t1,
			waterMs: t3 - t2,
			waterBitmapMs: t4 - t3,
			otherMs: t5 - t4,
		},
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Pacing: copies of createRefreshEstimate and refreshDivisor (src/lib/sky/pacing.ts)
// ---------------------------------------------------------------------------------------------------------------------

/** The median of a short list, sorted into `buffer` (reused). */
function median(values: readonly number[], buffer: Float64Array): number {
	for (let i = 0; i < values.length; i++) {
		const value = values[i] as number
		let j = i
		while (j > 0 && (buffer[j - 1] as number) > value) {
			buffer[j] = buffer[j - 1] as number
			j--
		}
		buffer[j] = value
	}
	return buffer[values.length >> 1] as number
}

function remember(list: number[], value: number): void {
	list.push(value)
	if (list.length > REFRESH_SAMPLES) list.shift()
}

interface RefreshEstimate {
	readonly interval: number
	sample(timestamp: number): void
	pause(): void
}

/** The display's refresh interval from frame timestamps: the median of the last 16 intervals; a run of 16 long ones is a slower display. */
function createRefreshEstimate(): RefreshEstimate {
	const accepted: number[] = []
	const rejected: number[] = []
	const sorted = new Float64Array(REFRESH_SAMPLES)
	let last: number | null = null
	let interval = 1000 / 60
	return {
		get interval() {
			return interval
		},
		sample(timestamp) {
			const delta = last === null ? 0 : timestamp - last
			last = timestamp
			if (delta <= 0) return
			if (delta < interval * 1.5) {
				rejected.length = 0
				remember(accepted, delta)
				interval = median(accepted, sorted)
				return
			}
			remember(rejected, delta)
			if (rejected.length < REFRESH_SAMPLES) return
			accepted.length = 0
			accepted.push(...rejected)
			rejected.length = 0
			interval = median(accepted, sorted)
		},
		pause() {
			last = null
		},
	}
}

/** Draw on every k-th refresh: the largest k that still gives `fps`, and at least the k that keeps under `cap`. */
function refreshDivisor(refreshHz: number, fps: number, cap: number): number {
	return Math.max(Math.floor(refreshHz / fps + 1e-9), Math.ceil(refreshHz / cap - 1e-9), 1)
}

// ---------------------------------------------------------------------------------------------------------------------
// Samples: ring buffers of timestamped values, summarized over WINDOW_MS
// ---------------------------------------------------------------------------------------------------------------------

interface Samples {
	t: Float64Array
	v: Float32Array
	head: number
	size: number
}

const makeSamples = (capacity: number): Samples => ({ t: new Float64Array(capacity), v: new Float32Array(capacity), head: 0, size: 0 })

function pushSample(s: Samples, t: number, v: number): void {
	s.t[s.head] = t
	s.v[s.head] = v
	s.head = (s.head + 1) % s.t.length
	if (s.size < s.t.length) s.size++
}

const clearSamples = (s: Samples): void => {
	s.head = 0
	s.size = 0
}

/** Scratch for sorting, larger than any ring. */
const scratch = new Float32Array(8192)

function summarize(s: Samples, now: number): Pct {
	const capacity = s.t.length
	let n = 0
	for (let k = 1; k <= s.size; k++) {
		const i = (s.head - k + capacity) % capacity
		if (now - (s.t[i] as number) > WINDOW_MS) break
		scratch[n++] = s.v[i] as number
	}
	if (n === 0) return { n: 0, p50: 0, p95: 0, max: 0 }
	const sorted = scratch.subarray(0, n).sort()
	return { n, p50: sorted[Math.ceil(0.5 * n) - 1] as number, p95: sorted[Math.ceil(0.95 * n) - 1] as number, max: sorted[n - 1] as number }
}

interface Bucket {
	frames: number
	drops: number
	js: Samples
	interval: Samples
}

const makeBucket = (capacity: number): Bucket => ({ frames: 0, drops: 0, js: makeSamples(capacity), interval: makeSamples(capacity) })

// ---------------------------------------------------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------------------------------------------------

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let config: Config = { load: 'phone', double: false, fps: 30, strips: true, ripple: true, glitter: true, fronds: true, readback: true }
let width = 0
let height = 0
let dpr = 1
let scrollY = 0
let visible = true
let ready = false
let assets: Assets | null = null
const cache = new Map<Load, Assets>()
let bootProbe: ProbeInfo | null = null
let timerRes = 0
let statsTimer: ReturnType<typeof setInterval> | undefined

const refresh = createRefreshEstimate()
let lastScrollAt = -Infinity
let lastDrawAt = -Infinity
let tickDoneAt = -Infinity
let queuedSkips = 0
let steadyDivisor = 2
let masterDivisor = 2
let frameNo = 0
let resetAt = 0
let prevDrawAt: number | null = null
let prevScrolling = false

const steady = makeBucket(2048)
const scrolled = makeBucket(4096)
const flushed = makeSamples(256)
const counts: DrawCounts = { navy: 0, sky: 0, city: 0, strips: 0, ripple: 0, glitter: 0, fronds: 0, fills: 0, other: 0, total: 0 }

function resetStats(): void {
	for (const bucket of [steady, scrolled]) {
		bucket.frames = 0
		bucket.drops = 0
		clearSamples(bucket.js)
		clearSamples(bucket.interval)
	}
	clearSamples(flushed)
	queuedSkips = 0
	frameNo = 0
	prevDrawAt = null
	resetAt = performance.now()
}

const post = (message: WorkerMessage): void => scope.postMessage(message)

// ---------------------------------------------------------------------------------------------------------------------
// probeRaster: master's (sky.worker.ts:670) over a stand-in sky of the same shape
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Master draws drawSky here: the navy fill, the haze drawImage (nearest neighbor, 'lighter') and one drawImage per
 * star, about STARS_PER_MP x 1.3 on a phone. This draws the same passes with stand-in bitmaps; only the figures that
 * decide whether a canvas is software-rasterized, the two full-screen passes, matter.
 */
function drawProbeSky(p: OffscreenCanvasRenderingContext2D, pw: number, ph: number): number {
	const haze = paint(Math.ceil(width / 2), Math.ceil(height / 2), (c) => {
		const gradient = c.createRadialGradient(width * 0.2, height * 0.1, 0, width * 0.2, height * 0.1, Math.max(width, height) * 0.4)
		gradient.addColorStop(0, 'rgba(60, 40, 120, 0.2)')
		gradient.addColorStop(1, 'rgba(60, 40, 120, 0)')
		c.fillStyle = gradient
		c.fillRect(0, 0, width, height)
	})
	const dot = new Uint8ClampedArray(7 * 7 * 4)
	for (let y = 0; y < 7; y++) {
		for (let x = 0; x < 7; x++) {
			const v = 255 * Math.exp(-((x - 3) ** 2 + (y - 3) ** 2) / 2)
			const k = (y * 7 + x) * 4
			dot[k] = v
			dot[k + 1] = v
			dot[k + 2] = v
			dot[k + 3] = 255
		}
	}
	const star = toBitmap(new ImageData(dot, 7, 7))
	p.globalCompositeOperation = 'source-over'
	p.globalAlpha = 1
	p.fillStyle = NAVY
	p.fillRect(0, 0, pw, ph)
	p.globalCompositeOperation = 'lighter'
	p.imageSmoothingEnabled = false
	p.drawImage(haze, 0, 0, pw, ph)
	p.imageSmoothingEnabled = true
	const stars = Math.min(MAX_STARS, Math.round(((width * height) / 1e6) * STARS_PER_MP * (width <= NARROW_MAX_WIDTH ? NARROW_DENSITY_BOOST : 1)))
	const rnd = mulberry32(99)
	for (let i = 0; i < stars; i++) {
		p.globalAlpha = 0.25 + 0.6 * rnd()
		p.drawImage(star, 0, 0, 7, 7, Math.floor(rnd() * (pw - 7)), Math.floor(rnd() * (ph - 7)), 7, 7)
	}
	p.globalAlpha = 1
	haze.close()
	star.close()
	return stars
}

/**
 * A software canvas rasterizes after the draw calls return, where the JS timer can't see the cost. Rasterize one full
 * sky off screen and time it: a slow one is `tripped`, and its cost decides how many frames a second the drift can
 * afford (PACING.softwareShare of a core). Master then steps quality down to its CSS-resolution second step; here
 * that is only the ratio it would draw at.
 */
function probeRaster(): ProbeInfo {
	if (!canvas) throw new Error('probeRaster before init')
	const probe = new OffscreenCanvas(canvas.width, canvas.height)
	const probeCtx = probe.getContext('2d', { alpha: false })
	if (!probeCtx) throw new Error('No 2D context for the probe canvas')
	const stars = drawProbeSky(probeCtx, probe.width, probe.height)
	const started = performance.now()
	// A GPU canvas only queues the work here; a software one rasterizes the whole frame
	probe.transferToImageBitmap().close()
	const rasterMs = performance.now() - started
	const megapixels = (probe.width * probe.height) / 1e6
	probe.width = probe.height = 0
	const limitMs = Math.max(RASTER.minMs, RASTER.msPerMp * megapixels)
	if (rasterMs <= limitMs) return { rasterMs, limitMs, megapixels, stars, tripped: false, softwareFps: Infinity, sceneStill: false }
	// The probe drew at the device ratio, and the sky would now draw at CSS resolution: each frame costs that share of it
	const ratioAfter = dpr > 1 ? 1 : dpr
	const softwareFps = Math.floor((RASTER.softwareShare * 1000) / (rasterMs * (ratioAfter / dpr) ** 2))
	return { rasterMs, limitMs, megapixels, stars, tripped: true, softwareFps, sceneStill: softwareFps / SCENE_SOFTWARE_COST < RASTER.minFps }
}

/** The smallest step of performance.now() (ms): Safari rounds it to 1 ms outside cross-origin isolation. */
function measureTimerRes(): number {
	let res = Infinity
	let last = performance.now()
	const stop = last + 30
	for (let steps = 0; steps < 6 && last < stop; ) {
		const t = performance.now()
		if (t > last) {
			res = Math.min(res, t - last)
			last = t
			steps++
		}
	}
	return res
}

// ---------------------------------------------------------------------------------------------------------------------
// The frame
// ---------------------------------------------------------------------------------------------------------------------

/** The scene rises with the page: a triangle wave of the scroll, at 0.6 px per scroll px (the horizon group's rate), 12% of H at most. */
function riseDev(a: Assets): number {
	const span = 0.12 * a.height
	const u = (scrollY * 0.6) / span
	const phase = ((u % 2) + 2) % 2
	return Math.round((phase < 1 ? phase : 2 - phase) * span * a.dpr)
}

/** Appends a trunk's tapered polygon (a quadratic Bezier, `samples` segments) to the current path. */
function traceTrunk(c: OffscreenCanvasRenderingContext2D, a: Assets, palm: Palm, horizonY: number, E: number, clock: number, edge: Float32Array): void {
	const d = a.dpr
	const dw = Math.round(a.width * d)
	const n = a.spec.trunkSamples
	const sway = 0.006 * palm.spec.crownZ * a.height * Math.sin((TAU * clock) / palm.period + palm.phase)
	const x0 = palm.spec.baseX * dw
	const y0 = E + 40 * d
	const x2 = palm.spec.crownX * dw + sway * d
	const y2 = horizonY - palm.spec.crownZ * a.height * d
	const cx = (x0 + x2) / 2 + palm.spec.bow * d
	const cy = (y0 + y2) / 2
	for (let k = 0; k <= n; k++) {
		const s = k / n
		const u = 1 - s
		const bx = u * u * x0 + 2 * u * s * cx + s * s * x2
		const by = u * u * y0 + 2 * u * s * cy + s * s * y2
		let tx = 2 * u * (cx - x0) + 2 * s * (x2 - cx)
		let ty = 2 * u * (cy - y0) + 2 * s * (y2 - cy)
		const len = Math.hypot(tx, ty) || 1
		tx /= len
		ty /= len
		const half = (lerp(palm.spec.trunk[0], palm.spec.trunk[1], s ** 0.8) * d) / 2
		const lx = bx - ty * half
		const ly = by + tx * half
		edge[k * 2] = bx + ty * half
		edge[k * 2 + 1] = by - tx * half
		if (k === 0) c.moveTo(lx, ly)
		else c.lineTo(lx, ly)
	}
	for (let k = n; k >= 0; k--) c.lineTo(edge[k * 2] as number, edge[k * 2 + 1] as number)
	c.closePath()
}

const trunkEdge = new Float32Array(64)

/** Draws one frame at `clock` seconds and counts its draw calls into `counts`. */
function renderFrame(c: OffscreenCanvasRenderingContext2D, a: Assets, cfg: Config, clock: number): void {
	const d = a.dpr
	const dw = c.canvas.width
	const dh = c.canvas.height
	const rowsDev = a.rowsDev
	const E = dh - riseDev(a)
	const horizonY = E - rowsDev
	const passes = cfg.double ? 2 : 1
	counts.navy = counts.sky = counts.city = counts.strips = counts.ripple = counts.glitter = counts.fronds = counts.fills = counts.other = 0

	c.setTransform(1, 0, 0, 1, 0, 0)
	c.globalAlpha = 1
	c.globalCompositeOperation = 'source-over'
	c.imageSmoothingEnabled = true
	c.fillStyle = NAVY
	c.fillRect(0, 0, dw, dh)
	counts.navy++

	for (let pass = 0; pass < passes; pass++) {
		const tt = clock + pass * 1.7

		// 1. Sky: the visible rows of the baked bitmap, nearest neighbor, down to 2 CSS px under the waterline
		const bottomDev = horizonY + 4 * d
		const j0 = Math.max(0, Math.ceil(a.skyRows - bottomDev / d))
		const j1 = a.skyRows - 2
		c.imageSmoothingEnabled = false
		if (j1 > j0) c.drawImage(a.sky, 0, j0, a.width, j1 - j0, 0, bottomDev - (a.skyRows - j0) * d, dw, (j1 - j0) * d)
		c.imageSmoothingEnabled = true
		counts.sky++

		// 2. Far city, then near city (the 2 city bands)
		c.drawImage(a.farCity, 0, 0, a.farCity.width, a.farCity.height, 0, horizonY + 2 * d - a.farH * d, dw, a.farH * d)
		c.drawImage(a.nearCity, 0, horizonY + 2 * d - a.nearH)
		counts.city += 2

		// 3. Water below the bitmap's reach is more water
		if (E < dh) {
			c.fillStyle = WATER_FLOOR
			c.fillRect(0, E, dw, dh - E)
			counts.other++
		}

		// 4. Water base: one drawImage per strip, each with its own wave offset, or one for the whole body when strips are off
		if (cfg.strips) {
			const n = a.stripH.length
			for (let i = 0; i < n; i++) {
				const dd = a.stripD[i] as number
				const h = a.stripH[i] as number
				const y = a.stripY[i] as number
				const p0 = TAU * (tt / 4.3 + i / 17) + 0.9
				const p1 = TAU * (tt / 3.1 + i / 11) + 2.6
				const p2 = TAU * (tt / 2.2 + i / 7) + 4.4
				// wave and wave2 share their phases a quarter turn apart: sin and cos
				const dx = lerp(0.5, 8, Math.min(1, dd / 0.5)) * (0.5 * Math.sin(p0) + 0.3 * Math.sin(p1) + 0.2 * Math.sin(p2))
				const dy = (1 + 9 * dd ** 1.2) * (0.5 * Math.cos(p0) + 0.3 * Math.cos(p1) + 0.2 * Math.cos(p2))
				const sh = h / d
				// The base starts at the waterline with nothing above it: a negative source row would paint nothing
				const sy = clamp(y / d + dy, 0, a.waterH - sh)
				c.drawImage(a.water, STRIP_MARGIN + dx, sy, a.width, sh, 0, horizonY + y, dw, h)
			}
			counts.strips += n
		} else {
			c.drawImage(a.water, STRIP_MARGIN, 0, a.width, rowsDev / d, 0, horizonY, dw, rowsDev)
			counts.strips++
		}

		// 5. Ripples: crest A and B, 8 bands each, `copies` copies a band, crossfading over their life
		if (cfg.ripple) {
			for (let layer = 0; layer < RIPPLE_LAYERS; layer++) {
				const tile = a.crest[layer] as ImageBitmap
				const rate = layer === 0 ? 1 : RIPPLE_CREST_B_RATE
				for (let b = 0; b < RIPPLE_STOPS.length; b++) {
					const d0 = b === 0 ? 0 : (RIPPLE_STOPS[b - 1] as number)
					const d1 = RIPPLE_STOPS[b] as number
					const mid = (d0 + d1) / 2
					const offset = (lerp(1, 7, mid) * rate * tt) % a.tileW
					const life = lerp(3, 5, mid)
					const fade = 0.5 + 0.5 * Math.sin(TAU * (tt / life + b * 0.173))
					c.globalAlpha = RIPPLE_CREST_ALPHA * (layer === 0 ? fade : 1 - fade)
					const destY = horizonY + Math.round(d0 * rowsDev)
					const destH = horizonY + Math.round(d1 * rowsDev) - destY
					for (let copy = 0; copy < a.copies; copy++) {
						c.drawImage(tile, 0, d0 * a.band, a.tileW, (d1 - d0) * a.band, Math.round((copy * a.tileW - offset) * d), destY, a.tileW * d, destH)
					}
					counts.ripple += a.copies
				}
			}
			c.globalAlpha = 1
		}

		// 6. Glitter: one dash a slot, position from a hash of (slot, life index), 'lighter'
		if (cfg.glitter) {
			c.globalCompositeOperation = 'lighter'
			const n = a.spec.glints
			for (let s = 0; s < n; s++) {
				const t = tt / (a.glintLife[s] as number) + (a.glintPhase[s] as number)
				const index = Math.floor(t)
				const frac = t - index
				const key = Math.imul(s + 1, 73856093) ^ Math.imul(index + pass * 977, 19349663)
				const u1 = hash32(key) / 4294967296
				const u2 = hash32(key ^ 0x9e3779b9) / 4294967296
				const u3 = hash32(key + 0x85ebca6b) / 4294967296
				const dd = u1 ** 1.6
				const halfW = a.sunR * (1.5 + 4.2 * dd ** 0.85)
				const gauss = Math.sqrt(-2 * Math.log(Math.max(u2, 1e-6))) * Math.cos(TAU * u3)
				const x = (a.sunX + clamp(gauss * 0.45, -1, 1) * halfW) * d
				const y = horizonY + 1 + dd * (rowsDev - 3)
				const sine = Math.sin(Math.PI * frac)
				c.globalAlpha = GLITTER_PEAK * sine * sine * (1 - smoothstep(0.04, 0.95, dd)) ** 0.9
				const dash = a.dashes[Math.min(3, (dd * 2.4 + u3 * 1.6) | 0)] as Dash
				c.drawImage(a.atlas, 0, dash.y, dash.w, dash.h, x - dash.w / 2, y - dash.h / 2, dash.w, dash.h)
			}
			counts.glitter += n
			c.globalCompositeOperation = 'source-over'
			c.globalAlpha = 1
		}

		// 7. The key and the trunks: fills
		c.fillStyle = NEAR
		const [keyH, keyReach] = a.spec.key
		const reach = keyReach * dw
		const top = keyH * a.height * d
		c.beginPath()
		c.moveTo(0, dh)
		for (let i = 0; i < a.keyTop.length; i++) c.lineTo((i / (a.keyTop.length - 1)) * reach, E - (a.keyTop[i] as number) * top)
		c.lineTo(reach, dh)
		c.closePath()
		c.fill()
		counts.fills++
		for (const group of a.spec.trunkFills) {
			c.beginPath()
			for (const index of group) {
				const palm = a.palms[index]
				if (palm) traceTrunk(c, a, palm, horizonY, E, tt, trunkEdge)
			}
			c.fill()
			counts.fills++
		}

		// 8. Fronds: inner and outer sprites, each its own setTransform, after the back layer's rigid ones
		if (cfg.fronds) {
			for (const palm of a.palms) {
				const set = a.sets[palm.spec.set] as FrondSet
				const sway = 0.006 * palm.spec.crownZ * a.height * Math.sin((TAU * tt) / palm.period + palm.phase)
				const cx = palm.spec.crownX * dw + sway * d
				const cy = horizonY - palm.spec.crownZ * a.height * d
				for (const frond of palm.back) {
					const [ma, mb, mc, md] = frondMatrix(frond, tt)
					const sprite = set.rigid[frond.variant] as Sprite
					c.setTransform(ma, mb, mc, md, cx, cy)
					c.drawImage(sprite.bitmap, -sprite.ox, -sprite.oy)
					counts.fronds++
				}
				for (const frond of palm.fronds) {
					const [ma, mb, mc, md] = frondMatrix(frond, tt)
					const inner = set.inner[frond.variant] as Sprite
					c.setTransform(ma, mb, mc, md, cx, cy)
					c.drawImage(inner.bitmap, -inner.ox, -inner.oy)
					// The outer sprite hangs from the hinge, bent by `delta`, a wind-lagged sway on top of the frond's own bend
					const delta = frond.bend + 0.75 * frond.amp * DEG * Math.sin((TAU * tt) / frond.period + frond.phase - 0.8)
					const cd = Math.cos(delta)
					const sd = Math.sin(delta)
					const hx = set.hingeX[frond.variant] as number
					const hy = set.hingeY[frond.variant] as number
					const outer = set.outer[frond.variant] as Sprite
					c.setTransform(ma * cd + mc * sd, mb * cd + md * sd, -ma * sd + mc * cd, -mb * sd + md * cd, ma * hx + mc * hy + cx, mb * hx + md * hy + cy)
					c.drawImage(outer.bitmap, -outer.ox, -outer.oy)
					counts.fronds += 2
				}
			}
			c.setTransform(1, 0, 0, 1, 0, 0)
		}
	}
	counts.total = counts.navy + counts.sky + counts.city + counts.strips + counts.ripple + counts.glitter + counts.fronds + counts.fills + counts.other
}

const frondOut: [number, number, number, number] = [1, 0, 0, 1]

/** The 2x2 part of a frond's transform at `t`: R(phi) times the scale, mirrored for the left-pointing ones. */
function frondMatrix(frond: Frond, t: number): [number, number, number, number] {
	const sway = frond.amp * DEG * Math.sin((TAU * t) / frond.period + frond.phase)
	const beta = frond.beta * DEG
	const phi = frond.left ? Math.PI / 2 - beta - sway : -Math.PI / 2 + beta + sway
	const cs = Math.cos(phi) * frond.scale
	const sn = Math.sin(phi) * frond.scale
	if (frond.left) {
		frondOut[0] = -cs
		frondOut[1] = -sn
		frondOut[2] = -sn
		frondOut[3] = cs
	} else {
		frondOut[0] = cs
		frondOut[1] = sn
		frondOut[2] = -sn
		frondOut[3] = cs
	}
	return frondOut
}

// ---------------------------------------------------------------------------------------------------------------------
// Frames: the tick, the draw, the HUD's numbers
// ---------------------------------------------------------------------------------------------------------------------

function draw(now: number, scrolling: boolean, k: number, interval: number): void {
	if (!ctx || !assets) return
	const started = performance.now()
	renderFrame(ctx, assets, config, now / 1000)
	const js = performance.now() - started
	lastDrawAt = now
	frameNo++
	const bucket = scrolling ? scrolled : steady
	bucket.frames++
	pushSample(bucket.js, now, js)
	// An interval across a change of mode, a config change or a hidden stretch says nothing about either
	if (prevDrawAt !== null && prevScrolling === scrolling) {
		const gap = now - prevDrawAt
		pushSample(bucket.interval, now, gap)
		// A frame is dropped when its interval runs a quarter over the frame period (k refreshes, or one while scrolling)
		const period = k * interval
		if (gap > 1.25 * period) bucket.drops += Math.max(1, Math.round(gap / period) - 1)
	}
	prevDrawAt = now
	prevScrolling = scrolling
	// The flush: getImageData waits for the GPU process to finish what this frame queued
	if (config.readback && frameNo % FLUSH_EVERY === 0) {
		const flushStarted = performance.now()
		ctx.getImageData(0, 0, 1, 1)
		pushSample(flushed, now, performance.now() - flushStarted)
	}
}

/**
 * One relayed frame, as master's onRelayTick and tick take it: a tick handled the moment the last one was done with
 * waited in the queue while that one ran over a refresh, and draws nothing; otherwise it draws once the frame period
 * less half a refresh has passed since the last drawn frame (master's frameDue, k - 1/2 refreshes), or at once while
 * scrolling.
 *
 * One difference, on purpose: master divides the refresh by `refreshDivisor`, which floors hz / fps. Safari rounds
 * performance.now() to 1 ms, so the median of 16 tick intervals at 60 Hz comes out 17 ms (58.8 Hz) and floors to a
 * divisor of 1: 60 fps asked for 30. Here the period is in milliseconds and the refresh only sets the half-refresh
 * slack, so a 16 or 17 ms estimate draws every 2nd tick all the same. `masterDivisor` is what refreshDivisor would say
 * with the scene's cap (fps), shown on the HUD to compare.
 */
function onTick(): void {
	if (!ready || !visible) return
	const now = performance.now()
	const queued = now - tickDoneAt <= RELAY_QUEUED_MS
	tickDoneAt = now
	if (queued) {
		queuedSkips++
		return
	}
	refresh.sample(now)
	const interval = refresh.interval
	const period = 1000 / config.fps
	steadyDivisor = Math.max(1, Math.round(period / interval))
	masterDivisor = refreshDivisor(1000 / interval, config.fps, config.fps)
	const scrolling = now - lastScrollAt < SCROLL_SETTLE_MS
	if (scrolling || now - lastDrawAt >= period - 0.5 * interval) draw(now, scrolling, scrolling ? 1 : steadyDivisor, interval)
	tickDoneAt = performance.now()
}

function kindOf(bucket: Bucket, now: number): Kind {
	return { frames: bucket.frames, drops: bucket.drops, js: summarize(bucket.js, now), interval: summarize(bucket.interval, now) }
}

function postStats(): void {
	if (!ready || !assets) return
	const now = performance.now()
	post({
		type: 'stats',
		config,
		sinceS: (now - resetAt) / 1000,
		hz: 1000 / refresh.interval,
		intervalMs: refresh.interval,
		divisor: steadyDivisor,
		masterDivisor,
		queued: queuedSkips,
		steady: kindOf(steady, now),
		scroll: kindOf(scrolled, now),
		flush: summarize(flushed, now),
		counts: { ...counts },
		bake: assets.bake,
		stripRows: assets.rowsDev,
		copies: assets.copies,
	})
}

// ---------------------------------------------------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------------------------------------------------

/** Sizes the backing store for the CSS size at `ratio`. Clears the canvas. */
function sizeCanvas(w: number, h: number, ratio: number): void {
	width = w
	height = h
	dpr = ratio
	if (!canvas) return
	canvas.width = Math.max(1, Math.round(w * ratio))
	canvas.height = Math.max(1, Math.round(h * ratio))
}

/** Assets for `load` at the current size: cached, so switching back and forth bakes each once. */
function assetsFor(load: Load): Assets {
	const known = cache.get(load)
	if (known) return known
	const built = buildAssets(load)
	cache.set(load, built)
	return built
}

function dropAssets(): void {
	for (const known of cache.values()) closeAssets(known)
	cache.clear()
	assets = null
}

function init(message: Extract<MainMessage, { type: 'init' }>): void {
	canvas = message.canvas
	const context = canvas.getContext('2d', { alpha: false })
	if (!context) throw new Error('No 2D context for the spike canvas')
	ctx = context
	config = message.config
	visible = message.visible
	timerRes = measureTimerRes()
	sizeCanvas(message.width, message.height, message.dpr)
	// The probe first, as master runs it: after the first sizing, before anything but the sky exists
	bootProbe = probeRaster()
	assets = assetsFor(config.load)
	resetStats()
	ready = true
	post({ type: 'boot', probe: bootProbe, bake: assets.bake, timerRes, canvasW: canvas.width, canvasH: canvas.height })
	statsTimer = setInterval(postStats, 1000)
}

function applyConfig(next: Config): void {
	const loadChanged = next.load !== config.load
	config = next
	if (loadChanged && ready) assets = assetsFor(config.load)
	resetStats()
}

function resize(w: number, h: number, ratio: number): void {
	if (w === width && h === height && ratio === dpr) return
	sizeCanvas(w, h, ratio)
	if (!ready) return
	dropAssets()
	assets = assetsFor(config.load)
	resetStats()
}

function handle(message: MainMessage): void {
	switch (message.type) {
		case 'init':
			init(message)
			break
		case 'resize':
			resize(message.width, message.height, message.dpr)
			break
		case 'config':
			applyConfig(message.config)
			break
		case 'scroll':
			scrollY = message.y
			lastScrollAt = performance.now()
			break
		case 'tick':
			onTick()
			break
		case 'visible':
			visible = message.visible
			// The gap before the next frame is not a refresh interval, nor a frame interval
			refresh.pause()
			prevDrawAt = null
			tickDoneAt = -Infinity
			break
		default: {
			const unhandled: never = message
			return unhandled
		}
	}
}

scope.addEventListener('message', (event) => {
	try {
		handle(event.data)
	} catch (error) {
		ready = false
		clearInterval(statsTimer)
		post({ type: 'error', message: error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error) })
	}
})
