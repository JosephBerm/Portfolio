import { mixRgb, parseHexColor } from '@/lib/sky/color'
import { HAZE_MAX_PIXELS } from '@/lib/sky/config'
import { BEACONS, BOAT, CLOUDS, RAMP, SKYLINE, STAGE, SUN, WATER, WING } from '@/lib/sky/miamiConfig'
import { srgbToLinear } from '@/lib/sky/miamiRamp'
import { CROWNS, EDGE_LEFT, EDGE_RIGHT, NEAR_TOWERS } from '@/lib/sky/miamiSkyline'
import { placeBanks, rampFor, type MiamiStage, type PlacedBank, type RailSide } from '@/lib/sky/miamiStage'
import { columnReach, waterRows, type WaterRow } from '@/lib/sky/miamiWater'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { hashCell, mulberry32 } from '@/lib/sky/random'
import { smoothstep } from '@/lib/sky/scene'
import { toBitmap } from './skyAssets'

/** A bitmap and the size it covers on the canvas, in CSS px: a bitmap baked at device resolution says how big that is. */
export interface MiamiImage {
	image: ImageBitmap
	width: number
	height: number
}

/** The sky's bitmap and where it stands. */
export interface MiamiSky {
	image: ImageBitmap
	/** The height above the page's end (px) of the image's top row. */
	zTop: number
	/** The CSS px the image covers, from `zTop` down; the image may hold fewer pixel rows than this on a very large screen. */
	rows: number
}

/** One side's wing, a dark panel for the rail's copy to sit on. */
export interface MiamiWing {
	/** The panel's alpha only, in the wing color: `feather` rows that ease in from nothing, then one row of full strength to stretch down the screen. */
	image: ImageBitmap
	/** Pixel rows of the top feather, which are the rows of the image above its last. */
	feather: number
}

/** A cloud and where it stands: a bank with a flat bottom, or a long thin streak. */
export interface MiamiCloud extends MiamiImage {
	/** The height above the page's end of the bottom edge of the image. */
	z: number
	/** Its center at clock 0, and its pace to the right (px a second), as the stage placed it. */
	x: number
	drift: number
}

/** The sun's disc, baked at device resolution, and the halo's light, baked in CSS px; each is centered on the sun. */
export interface MiamiSun {
	disc: MiamiImage
	halo: MiamiImage
}

/** A beacon's place: x from the canvas's left edge, and its height above the waterline, CSS px. */
export interface MiamiBeacon {
	x: number
	z: number
}

/** The near city: one band along the waterline, at device resolution, with the beacons' places on it. */
export interface MiamiNear extends MiamiImage {
	beacons: readonly MiamiBeacon[]
}

/** The water: the base picture the strips are cut from, the rows they are cut in, and the two ripple layers. */
export interface MiamiWater {
	/** The base, in CSS px, `WATER.strips.margin` wider each side than the canvas and `STAGE.water.overscan` deeper than the page's end. */
	base: MiamiImage
	/** The strips, from the waterline down: their places and heights are in device px at the build's pixel ratio. */
	rows: readonly WaterRow[]
	/** The ripple layers' tiles, one CSS px a pixel, from the waterline to the page's end, wrapping at the sides. */
	ripples: readonly [ImageBitmap, ImageBitmap]
	tileWidth: number
}

/** The glitter's dashes: one cell a depth class, from the horizon to the viewer, at device resolution. */
export interface MiamiGlitter {
	atlas: ImageBitmap
	cellWidth: number
	cellHeight: number
	classes: number
}

/** The boat: its hull and reflection, whose foot lies `foot` CSS px below the image's top, and its wake, whose apex (where the bow's place is) lies at `apex` px from its top left. */
export interface MiamiBoat {
	hull: MiamiImage
	foot: number
	wake: MiamiImage
	apex: { x: number; y: number }
}

/** Everything the scene draws from, built for one stage at one pixel ratio and closed together. */
export interface MiamiAssets {
	/** The pixel ratio the device-resolution bitmaps (wings, sun, city, glitter, boat) were built at; the rest are built in CSS px. */
	dpr: number
	sky: MiamiSky
	/** A side with no rail copy has no wing. */
	wings: { left: MiamiWing | null; right: MiamiWing | null }
	/** Streaks first, then banks. */
	clouds: readonly MiamiCloud[]
	sun: MiamiSun
	/** The far city; none where the contrast preference leaves it out. */
	far: MiamiImage | null
	near: MiamiNear
	beacon: MiamiImage
	water: MiamiWater
	glitter: MiamiGlitter
	/** None where the boat is left out. */
	boat: MiamiBoat | null
}

/** A baked picture before it becomes a bitmap, and the CSS px it will cover. */
interface Baked {
	pixels: ImageData
	width: number
	height: number
}

/** Rows of the sky's bitmap below the waterline: the water draws over them, so rounding never opens a gap at the water's edge. */
const SKY_BELOW = 4

/** Rows of the sky's bitmap above where the ramp reaches navy, so its top row is navy and joins the page with no seam. */
const SKY_ABOVE = 8

/** Rows from the bitmap's top over which the dither fades in, so the very top row stays exactly navy. */
const DITHER_TAPER = 8

/** Pixels of the sky baked between two returns of the generator: a fraction of a millisecond when warm, so a slice of the build ends close to its budget even on a slow device. */
const BATCH_PIXELS = 8192

/** Pixels of a plain conversion between two returns: a copy is cheaper than the bake's float work. */
const COPY_PIXELS = 131072

/** Pixels of the water's base baked between two returns: a pixel of it costs about a fifth of a pixel of the sky, so a batch is still under a millisecond. */
const WATER_BATCH_PIXELS = 32768

/** Columns of ripple dashes (each a sine and a power) a field draws between two returns: about a millisecond. */
const LENS_PIXELS = 24000

/** Towers drawn between two returns. */
const TOWERS_PER_STEP = 12

/** Screens narrower than this get the narrow wing feather; the wide one would darken a third of the screen. */
const WIDE_WING_MIN_WIDTH = 1024

/** Steps of the lookup that encodes linear light as sRGB, and of the noise lookup. */
const ENCODE_STEPS = 4096
const NOISE_SIZE = 4096

/** The bloom and the hairline are left out of rows where they add less than this much linear light, under a thousandth of a level. */
const NEGLIGIBLE = 1e-6

/** How many of the hairline's widths its Gaussian reaches before it adds less than NEGLIGIBLE. */
const HAIRLINE_SPAN = 4

/** Seed of the dither's noise. */
const NOISE_SEED = 0x6e6f6973

/** Screens at least this wide close the frame with solid tower clusters at both edges, over this share of the width on the left and on the right. */
const EDGE_MIN_WIDTH = 768
const EDGE_SHARE = { left: 0.085, right: 0.1 } as const

/** How far above the waterline the near city's band reaches, in drawing units: the tallest crown, a crane's boom and the palm tops all fit. */
const CITY_TOP_UNITS = 150

/** The far layer's towers stay clear of this share of the width at each edge, where the near clusters stand. */
const FAR_EDGE_CLEAR = 0.12

/** The far towers lie across the same span of drawing units as the near ones. */
const FAR_SPAN = [-2300, 1500] as const

/** The glitter's depth classes, from the horizon to the viewer: each has its own color and a dash of its own size. */
const GLITTER_CLASSES = 8

/** sRGB (0-255) of each linear light 0-1 in ENCODE_STEPS steps, with one more entry to interpolate toward. Built on first use, so a visit that never bakes the sky never builds it. */
let encodeSamples: Float32Array | null = null

/** Triangular noise in (-1, 1), the sum of two uniform draws less 1: one level of dither either way. Built on first use. */
let noiseSamples: Float32Array | null = null

function encoding(): Float32Array {
	if (!encodeSamples) {
		const samples = new Float32Array(ENCODE_STEPS + 2)
		for (let i = 0; i < samples.length; i++) {
			const light = Math.min(1, i / ENCODE_STEPS)
			samples[i] = 255 * (light <= 0.0031308 ? 12.92 * light : 1.055 * light ** (1 / 2.4) - 0.055)
		}
		encodeSamples = samples
	}
	return encodeSamples
}

function grain(): Float32Array {
	if (!noiseSamples) {
		const random = mulberry32(NOISE_SEED)
		const samples = new Float32Array(NOISE_SIZE)
		for (let i = 0; i < samples.length; i++) samples[i] = random() + random() - 1
		noiseSamples = samples
	}
	return noiseSamples
}

/** Linear light (0-1) as sRGB (0-255), by interpolating the lookup, which is exact to a few thousandths of a level. */
function encode(samples: Float32Array, light: number): number {
	const x = light <= 0 ? 0 : light >= 1 ? ENCODE_STEPS : light * ENCODE_STEPS
	const index = x | 0
	const low = samples[index] ?? 0
	return low + ((samples[index + 1] ?? low) - low) * (x - index)
}

/** A color of the scene's palette as 0-255 channels. */
function hexRgb(hex: string): Rgb {
	const rgb = parseHexColor(hex)
	if (!rgb) throw new Error(`Unreadable color: ${hex}`)
	return rgb
}

/** A hex color in linear light. */
function linearColor(hex: string): [number, number, number] {
	const rgb = hexRgb(hex)
	return [srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2])]
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Backing-store pixels for a CSS length (never zero), as the worker sizes its canvas. */
function deviceSize(css: number, dpr: number): number {
	return Math.max(1, Math.round(css * dpr))
}

/** How near x is to the sun's column: 1 on it, falling as a Gaussian of the width the sky's own warmth toward the sun uses. */
function sunNearness(stage: MiamiStage, x: number): number {
	const sigma = RAMP.bend.sigma[stage.narrow ? 'narrow' : 'wide'] * stage.width
	return Math.exp(-(((x - stage.sunX) / sigma) ** 2))
}

/** The sky's pixels and the rows they cover. */
interface SkyPixels {
	pixels: ImageData
	zTop: number
	rows: number
}

/**
 * Bakes the sky in float, a batch of rows at a time, returning after each. For each pixel the ramp is read at its place on
 * the sky: the warm band's height t (arced by the limb's curve, and pushed warmer toward the sun), the edges are darkened,
 * the sun's bloom and the limb's hairline are added in linear light, and the sum is encoded as sRGB with a little noise
 * before it is rounded, so the 8-bit gradients never band. Below the limb's hairline a row's brightest pixel is on the
 * sun's column, which is why fitting the ramp to the copy's ceiling there bounds the whole row. The bitmap is in CSS px, or
 * smaller on a screen so large that it would pass HAZE_MAX_PIXELS, and is drawn without smoothing so the dither stays whole.
 */
function* bakeSky(stage: MiamiStage, navy: Rgb): Generator<void, SkyPixels, undefined> {
	const { width: W, height: H, zWater, warm, sunX, sunZ } = stage
	const byWidth = stage.narrow ? 'narrow' : 'wide'
	const lut = rampFor(navy)
	const zTop = stage.zReach + SKY_ABOVE
	const rows = Math.ceil(zTop - (zWater - SKY_BELOW))
	const downscale = Math.min(1, Math.sqrt(HAZE_MAX_PIXELS / (W * rows)))
	const w = Math.max(1, Math.round(W * downscale))
	const h = Math.max(1, Math.round(rows * downscale))
	const scaleX = w / W
	const scaleY = h / rows
	const pixels = new ImageData(w, h)
	const data = pixels.data
	const encoded = encoding()
	const noise = grain()

	// The ramp with its last sample repeated, so a sample's neighbor above always exists
	const last = lut.size - 1
	const ramp = new Float32Array((lut.size + 1) * 3)
	ramp.set(lut.rgb)
	ramp.set(lut.rgb.subarray(last * 3), lut.size * 3)
	const toSample = last / lut.topT

	const { a, b, c } = RAMP.bend
	const { limb, edge } = RAMP
	const sagitta = Math.min(limb.sagitta.height * H, limb.sagitta.width * W)
	const arcShare = sagitta / warm
	const hairSpan = HAIRLINE_SPAN * limb.hairlineWidth
	const glow = stage.more ? RAMP.moreGlow : 1
	const nearAmp = RAMP.bloom.near * glow
	const farAmp = RAMP.bloom.far * glow
	const nearScale = 1 / (RAMP.bloom.nearWidth * warm) ** 2
	const farScale = 1 / (RAMP.bloom.farWidth * warm) ** 2
	// The bloom's color: the base mixed toward the whiter one in linear light
	const bloomBase = linearColor(RAMP.bloom.color)
	const bloomWhite = linearColor(RAMP.bloom.whiter)
	const bloomR = bloomBase[0] + (bloomWhite[0] - bloomBase[0]) * RAMP.bloom.whiterShare
	const bloomG = bloomBase[1] + (bloomWhite[1] - bloomBase[1]) * RAMP.bloom.whiterShare
	const bloomB = bloomBase[2] + (bloomWhite[2] - bloomBase[2]) * RAMP.bloom.whiterShare
	const [limbR, limbG, limbB] = linearColor(limb.color)

	// What depends on the column alone
	const sigma = RAMP.bend.sigma[byWidth] * W
	const reach = edge.reach[byWidth] * W
	const arch = new Float32Array(w)
	const bend = new Float32Array(w)
	const warmer = new Float32Array(w)
	const darkening = new Float32Array(w)
	const nearX = new Float32Array(w)
	const farX = new Float32Array(w)
	for (let i = 0; i < w; i++) {
		const x = (i + 0.5) / scaleX
		const toSun = x - sunX
		const g = Math.exp(-((toSun / sigma) ** 2))
		const u = (2 * x) / W - 1
		arch[i] = u * u
		bend[i] = 1 / (a + b * g)
		warmer[i] = c * (1 - g)
		darkening[i] = (1 - edge.keep) * (1 - smoothstep(0, reach, Math.min(x, W - x)))
		const stretched = (toSun / RAMP.bloom.xStretch) ** 2
		nearX[i] = Math.exp(-stretched * nearScale)
		farX[i] = Math.exp(-stretched * farScale)
	}

	const rowsPerBatch = Math.max(1, Math.floor(BATCH_PIXELS / w))
	for (let start = 0; start < h; start += rowsPerBatch) {
		const stop = Math.min(h, start + rowsPerBatch)
		for (let j = start; j < stop; j++) {
			const z = zTop - (j + 0.5) / scaleY
			const t = (z - zWater) / warm
			const arc = arcShare * smoothstep(limb.fromT, limb.fullT, t)
			// The darkening toward the sides is strongest at the horizon and gone higher up
			const gone = 1 - smoothstep(0, edge.goneT, t)
			const dz2 = (z - sunZ) * (z - sunZ)
			const nearZ = nearAmp * Math.exp(-dz2 * nearScale)
			const farZ = farAmp * Math.exp(-dz2 * farScale)
			const bloomed = nearZ + farZ > NEGLIGIBLE
			// A hairline of strength 0 adds nothing, so its rows are not even looked for
			const hairy = limb.hairline > 0 && t + arc > limb.hairlineT - hairSpan && t < limb.hairlineT + hairSpan
			// The noise is read from a different place in each row, so no two rows share a pattern
			let n = Math.imul(j + 1, 0x9e3779b1) >>> 20
			const taper = Math.min(1, j / DITHER_TAPER)
			let k = j * w * 4
			for (let i = 0; i < w; i++) {
				const tc = t + arc * (arch[i] ?? 0)
				// Where on the ramp: the isoline's height, pushed warmer toward the sun; a place below the horizon reads the warmest sample
				const place = (tc * (bend[i] ?? 1) + (warmer[i] ?? 0)) * toSample
				const f = place < 0 ? 0 : place > last ? last : place
				const sample = f | 0
				const share = f - sample
				const p = sample * 3
				let r = ramp[p] ?? 0
				let g = ramp[p + 1] ?? 0
				let blue = ramp[p + 2] ?? 0
				r += ((ramp[p + 3] ?? r) - r) * share
				g += ((ramp[p + 4] ?? g) - g) * share
				blue += ((ramp[p + 5] ?? blue) - blue) * share
				if (gone > 0) {
					const keep = 1 - (darkening[i] ?? 0) * gone
					r *= keep
					g *= keep
					blue *= keep
				}
				if (bloomed) {
					const light = nearZ * (nearX[i] ?? 0) + farZ * (farX[i] ?? 0)
					r += bloomR * light
					g += bloomG * light
					blue += bloomB * light
				}
				if (hairy) {
					const away = (tc - limb.hairlineT) / limb.hairlineWidth
					const line = limb.hairline * Math.exp(-away * away)
					r += limbR * line
					g += limbG * line
					blue += limbB * line
				}
				data[k] = encode(encoded, r) + (noise[n & (NOISE_SIZE - 1)] ?? 0) * taper
				data[k + 1] = encode(encoded, g) + (noise[(n + 1365) & (NOISE_SIZE - 1)] ?? 0) * taper
				data[k + 2] = encode(encoded, blue) + (noise[(n + 2730) & (NOISE_SIZE - 1)] ?? 0) * taper
				data[k + 3] = 255
				n++
				k += 4
			}
		}
		yield
	}
	return { pixels, zTop, rows }
}

/**
 * One wing's alpha. The wing is full from the screen's edge to `past` px beyond the rail's inner edge, which is the
 * padding the sky keeps around copy, then feathers out over the feather's width, and eases in from nothing at its top. The
 * image is the feather rows plus one row of full strength, which the draw stretches down the screen, so it stays small.
 */
function bakeWing(stage: MiamiStage, side: RailSide, left: boolean, dpr: number): { pixels: ImageData; feather: number } {
	const { share, min } = stage.width < WIDE_WING_MIN_WIDTH ? WING.feather.tablet : WING.feather
	const spread = Math.max(min, share * stage.width)
	// Distances from the screen's edge on this side, in CSS px
	const solid = (left ? side.edge : stage.width - side.edge) + WING.past
	const extent = Math.min(stage.width, Math.max(1, solid + spread))
	const w = Math.max(1, Math.ceil(extent * dpr))
	const feather = Math.max(1, Math.round(WING.topFeather * dpr))
	const alpha = stage.more ? WING.moreAlpha : WING.alpha
	const color = parseHexColor(WING.color)
	if (!color) throw new Error(`Unreadable color: ${WING.color}`)
	const across = new Float32Array(w)
	for (let i = 0; i < w; i++) {
		const distance = (left ? i + 0.5 : w - i - 0.5) / dpr
		across[i] = alpha * (1 - smoothstep(solid, solid + spread, distance))
	}
	const pixels = new ImageData(w, feather + 1)
	const { data } = pixels
	for (let j = 0; j <= feather; j++) {
		const down = j === feather ? 1 : smoothstep(0, feather, j + 0.5)
		for (let i = 0; i < w; i++) {
			const k = (j * w + i) * 4
			data[k] = color[0]
			data[k + 1] = color[1]
			data[k + 2] = color[2]
			data[k + 3] = Math.round(255 * (across[i] ?? 0) * down)
		}
	}
	return { pixels, feather }
}

// ---- Coverage: silhouettes are drawn as 0-255 masks (device px, or CSS px for the far layer) and then given a color

/** Adds `amount` (0-1) of coverage to the pixel at `k`, as the union of what is there and what is added. */
function cover(mask: Uint8Array, k: number, amount: number): void {
	const old = mask[k] ?? 0
	mask[k] = Math.round(255 - (255 - old) * (1 - amount))
}

/** Fills whole pixels [x0, x1) by [y0, y1), clipped to the mask. */
function fillBox(mask: Uint8Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number): void {
	const from = Math.max(0, Math.round(x0))
	const to = Math.min(width, Math.round(x1))
	if (to <= from) return
	for (let j = Math.max(0, Math.round(y0)); j < Math.min(height, Math.round(y1)); j++) mask.fill(255, j * width + from, j * width + to)
}

/** Sub-scanlines a polygon's coverage is sampled with a row at: four steps of a quarter pixel give 16 levels of edge. */
const SUBSAMPLES = 4

/** Fills a polygon (x, y pairs, any orientation) with antialiased edges: each pixel gets its share of area. */
function fillPolygon(mask: Uint8Array, width: number, height: number, points: readonly number[]): void {
	const count = points.length >> 1
	if (count < 3) return
	const at = (k: number) => points[k] ?? 0
	let minX = Infinity
	let maxX = -Infinity
	let minY = Infinity
	let maxY = -Infinity
	for (let i = 0; i < count; i++) {
		minX = Math.min(minX, at(2 * i))
		maxX = Math.max(maxX, at(2 * i))
		minY = Math.min(minY, at(2 * i + 1))
		maxY = Math.max(maxY, at(2 * i + 1))
	}
	const x0 = Math.max(0, Math.floor(minX))
	const x1 = Math.min(width, Math.ceil(maxX))
	const y0 = Math.max(0, Math.floor(minY))
	const y1 = Math.min(height, Math.ceil(maxY))
	if (x1 <= x0 || y1 <= y0) return
	const row = new Float32Array(x1 - x0)
	const hits: number[] = []
	for (let j = y0; j < y1; j++) {
		// Only the span the polygon touches in this row is summed and cleared, so a long thin line costs its length, not its box
		let first = x1
		let last = x0
		for (let s = 0; s < SUBSAMPLES; s++) {
			const y = j + (s + 0.5) / SUBSAMPLES
			hits.length = 0
			for (let i = 0; i < count; i++) {
				const next = (i + 1) % count
				const ay = at(2 * i + 1)
				const by = at(2 * next + 1)
				if (ay <= y !== by <= y) hits.push(at(2 * i) + ((y - ay) * (at(2 * next) - at(2 * i))) / (by - ay))
			}
			hits.sort((p, q) => p - q)
			for (let pair = 0; pair + 1 < hits.length; pair += 2) {
				const from = Math.max(x0, hits[pair] ?? 0)
				const to = Math.min(x1, hits[pair + 1] ?? 0)
				if (to <= from) continue
				first = Math.min(first, Math.floor(from))
				last = Math.max(last, Math.ceil(to))
				for (let i = Math.floor(from); i < Math.ceil(to); i++) row[i - x0] = (row[i - x0] ?? 0) + (Math.min(to, i + 1) - Math.max(from, i)) / SUBSAMPLES
			}
		}
		for (let i = first; i < last; i++) {
			const share = row[i - x0] ?? 0
			if (share > 0) cover(mask, j * width + i, Math.min(1, share))
			row[i - x0] = 0
		}
	}
}

/** Strokes a straight line of `thickness` px as a quad, with antialiased edges. */
function strokeLine(mask: Uint8Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number, thickness: number): void {
	const length = Math.hypot(x1 - x0, y1 - y0)
	if (length === 0) return
	const nx = ((y1 - y0) / length) * (thickness / 2)
	const ny = (-(x1 - x0) / length) * (thickness / 2)
	fillPolygon(mask, width, height, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny])
}

/** Strokes a chain of segments (x, y pairs) of `thickness` px, each a quad: a joint shows no gap at these widths. */
function strokePath(mask: Uint8Array, width: number, height: number, points: readonly number[], thickness: number): void {
	for (let i = 0; i + 3 < points.length; i += 2) strokeLine(mask, width, height, points[i] ?? 0, points[i + 1] ?? 0, points[i + 2] ?? 0, points[i + 3] ?? 0, thickness)
}

/** Adds the exact area a box covers of each pixel it touches (the box may start and end between pixels), as a union with what is there. */
function coverBox(mask: Float32Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number): void {
	for (let j = Math.max(0, Math.floor(y0)); j < Math.min(height, Math.ceil(y1)); j++) {
		const rowShare = Math.min(y1, j + 1) - Math.max(y0, j)
		for (let i = Math.max(0, Math.floor(x0)); i < Math.min(width, Math.ceil(x1)); i++) {
			const k = j * width + i
			mask[k] = 1 - (1 - (mask[k] ?? 0)) * (1 - rowShare * (Math.min(x1, i + 1) - Math.max(x0, i)))
		}
	}
}

/** A mask's pixels in one flat color, the mask as alpha. A generator, so a large one is converted a batch of rows at a time. */
function* silhouette(mask: Uint8Array, width: number, height: number, color: Rgb): Generator<void, ImageData, undefined> {
	const pixels = new ImageData(width, height)
	const { data } = pixels
	const rowsPerBatch = Math.max(1, Math.floor(COPY_PIXELS / width))
	for (let start = 0; start < height; start += rowsPerBatch) {
		const stop = Math.min(height, start + rowsPerBatch)
		for (let k = start * width, p = k * 4; k < stop * width; k++, p += 4) {
			data[p] = color[0]
			data[p + 1] = color[1]
			data[p + 2] = color[2]
			data[p + 3] = mask[k] ?? 0
		}
		yield
	}
	return pixels
}

// ---- Value noise, for the clouds

/** Smooth value noise in [0, 1] along one axis: random values at whole steps of `spacing`, eased between. */
function valueNoise(x: number, spacing: number, seed: number): number {
	const t = x / spacing
	const i = Math.floor(t)
	const f = t - i
	const a = hashCell(i, 0, seed) / 4294967296
	const b = hashCell(i + 1, 0, seed) / 4294967296
	return a + (b - a) * f * f * (3 - 2 * f)
}

// ---- Clouds

/** Share of a bank's height, from its bottom, that its warm underside covers. */
const UNDERSIDE = 0.42

/** Rim thickness at the bank's lowest edge, CSS px. */
const RIM = 1.6

/**
 * A bank as float alpha in CSS px: a flat bottom and a lumpy top (octaves of noise stretched along x), its top color above
 * and a broad warm underside below, shifting from the sun's side to the far side, and on the bank nearest the sun a thin rim
 * of light on the very lowest edge. Under a top edge softened by at most `shape.blur` px and a crisper bottom.
 */
function bakeBank(stage: MiamiStage, bank: PlacedBank, high: boolean): Baked {
	const width = Math.max(8, Math.round(bank.width * stage.width))
	const height = Math.ceil(bank.height) + 2
	const { shape, top, topHigh, under, rim } = CLOUDS
	const spacing = Math.max(10, shape.stretch * bank.height * 0.7)
	// Where this bank's left edge stands on the canvas at clock 0, for the colors that follow the sun
	const left = bank.x * stage.width - width / 2
	const profile = new Float32Array(width)
	for (let i = 0; i < width; i++) {
		let sum = 0
		let amplitude = 1
		let total = 0
		for (let octave = 0; octave < shape.octaves; octave++) {
			sum += amplitude * valueNoise(i + 0.5, spacing / 2 ** octave, bank.seed + octave)
			total += amplitude
			amplitude *= 0.6
		}
		const u = (i + 0.5) / width
		const ends = Math.min(smoothstep(0, 0.16, u), smoothstep(1, 0.84, u))
		// The contrast of the lumps is stretched, so tops have peaks and hollows rather than one long swell
		profile[i] = (bank.height - 1) * (0.18 + 0.82 * smoothstep(0.2, 0.8, sum / total)) * ends ** 0.7
	}
	const topColor = hexRgb(high ? topHigh : top)
	const nearUnder = hexRgb(under.near)
	const farUnder = hexRgb(under.far)
	const nearRim = hexRgb(rim.near)
	const farRim = hexRgb(rim.far)
	const pixels = new ImageData(width, height)
	const { data } = pixels
	for (let i = 0; i < width; i++) {
		const sunward = sunNearness(stage, left + i + 0.5)
		const underside = mixRgb(farUnder, nearUnder, sunward)
		const edge = mixRgb(farRim, nearRim, sunward)
		const tall = profile[i] ?? 0
		for (let j = 0; j < height; j++) {
			// Height of this pixel's center above the bank's flat bottom
			const up = height - j - 0.5
			const coverTop = clamp01((tall - up) / shape.blur + 0.5)
			const coverBottom = clamp01(up + 0.5)
			const alpha = coverTop * coverBottom
			if (alpha <= 0) continue
			const warmth = 1 - smoothstep(0, UNDERSIDE, up / Math.max(1, tall))
			let color = mixRgb(topColor, underside, warmth)
			if (bank.rim && !stage.more) color = mixRgb(color, edge, 0.85 * (1 - clamp01(up / RIM)))
			const k = (j * width + i) * 4
			data[k] = color[0]
			data[k + 1] = color[1]
			data[k + 2] = color[2]
			data[k + 3] = Math.round(255 * alpha)
		}
	}
	return { pixels, width, height }
}

/** A long thin streak as float alpha: a lens, tapering to nothing at its ends and across, darker than the sky behind; below the copy it gains a soft warm underside. */
function bakeStreak(stage: MiamiStage, streak: (typeof CLOUDS.streaks)[number], warm: boolean): Baked {
	const width = Math.max(8, Math.round(streak.width * stage.width))
	const height = Math.ceil(streak.height) + 4
	const color = hexRgb(streak.color)
	const left = streak.x * stage.width - width / 2
	const nearUnder = hexRgb(CLOUDS.under.near)
	const farUnder = hexRgb(CLOUDS.under.far)
	const pixels = new ImageData(width, height)
	const { data } = pixels
	for (let i = 0; i < width; i++) {
		const along = Math.sin((Math.PI * (i + 0.5)) / width) ** 0.9
		const underside = mixRgb(farUnder, nearUnder, sunNearness(stage, left + i + 0.5))
		for (let j = 0; j < height; j++) {
			const across = (j + 0.5 - height / 2) / (streak.height / 2)
			const alpha = streak.alpha * along * (1 - smoothstep(0.35, 1, Math.abs(across)))
			if (alpha <= 0) continue
			const lit = warm ? mixRgb(color, underside, 0.6 * smoothstep(0, 1, across)) : color
			const k = (j * width + i) * 4
			data[k] = lit[0]
			data[k + 1] = lit[1]
			data[k + 2] = lit[2]
			data[k + 3] = Math.round(255 * alpha)
		}
	}
	return { pixels, width, height }
}

/** The clouds: the streaks (their heights at their t of the warm band), then the banks the stage places. A streak above the copy floor is left out under the contrast preference. */
function* bakeClouds(stage: MiamiStage, own: (pixels: ImageData) => ImageBitmap): Generator<void, MiamiCloud[], undefined> {
	const clouds: MiamiCloud[] = []
	for (const streak of CLOUDS.streaks) {
		const center = stage.zWater + streak.t * stage.warmArt
		// A streak that reaches above the copy floor carries no warm edge, and has no place at all where nothing is darker than the sky
		const aboveFloor = center + streak.height / 2 > stage.zCopyFloor
		if (aboveFloor && stage.more) continue
		const baked = bakeStreak(stage, streak, !aboveFloor)
		clouds.push({ image: own(baked.pixels), width: baked.width, height: baked.height, z: center - baked.height / 2, x: streak.x, drift: streak.drift })
		yield
	}
	for (const bank of placeBanks(stage)) {
		const baked = bakeBank(stage, bank, bank.bottom >= stage.zWater + 1.6 * stage.tallest)
		clouds.push({ image: own(baked.pixels), width: baked.width, height: baked.height, z: bank.bottom, x: bank.x, drift: bank.drift })
		yield
	}
	return clouds
}

// ---- Sun

/** The disc: a crisp ellipse (a little wider than tall) in a gradient from its core to its rim, at device resolution, with a soft edge one CSS px wide. */
function bakeDisc(stage: MiamiStage, dpr: number): Baked {
	const rx = stage.sunR * dpr
	const ry = stage.sunR * SUN.oblate * dpr
	const width = Math.ceil(2 * rx) + 4
	const height = Math.ceil(2 * ry) + 4
	const core = hexRgb(SUN.core)
	const rim = hexRgb(SUN.rim)
	const pixels = new ImageData(width, height)
	const { data } = pixels
	for (let j = 0; j < height; j++) {
		for (let i = 0; i < width; i++) {
			const dx = i + 0.5 - width / 2
			const dy = j + 0.5 - height / 2
			const r = Math.hypot(dx / rx, dy / ry)
			// How far inside the edge along the ray from the center, in device px
			const inside = r === 0 ? Math.min(rx, ry) : (Math.hypot(dx, dy) * (1 - r)) / r
			const alpha = smoothstep(-dpr / 2, dpr / 2, inside)
			if (alpha <= 0) continue
			const color = mixRgb(core, rim, clamp01(r) ** 2)
			const k = (j * width + i) * 4
			data[k] = color[0]
			data[k + 1] = color[1]
			data[k + 2] = color[2]
			data[k + 3] = Math.round(255 * alpha)
		}
	}
	return { pixels, width: width / dpr, height: height / dpr }
}

/**
 * The halo: light to add around the sun, in the bloom's color, as a picture on black (drawn additively, black adds nothing):
 * a tight glow that falls off with distance, stretched 1.5 times wider than tall, and cut to nothing at its reach. In CSS px,
 * since it is soft and the draw scales it.
 */
function bakeHalo(stage: MiamiStage): Baked {
	const radius = stage.sunR
	const reach = SUN.haloReach * radius
	const width = Math.ceil(2 * 1.5 * reach) + 2
	const height = Math.ceil(2 * reach) + 2
	const encoded = encoding()
	const base = linearColor(RAMP.bloom.color)
	const white = linearColor(RAMP.bloom.whiter)
	const bloom = base.map((channel, k) => encode(encoded, channel + ((white[k] ?? channel) - channel) * RAMP.bloom.whiterShare))
	const strength = stage.more ? RAMP.moreGlow : 1
	const cut = Math.exp(-SUN.haloReach / 0.6)
	const pixels = new ImageData(width, height)
	const { data } = pixels
	for (let j = 0; j < height; j++) {
		for (let i = 0; i < width; i++) {
			const rho = Math.hypot((i + 0.5 - width / 2) / 1.5, j + 0.5 - height / 2)
			const light = strength * 0.7 * Math.max(0, Math.exp(-rho / (0.6 * radius)) - cut)
			const k = (j * width + i) * 4
			data[k] = (bloom[0] ?? 0) * light
			data[k + 1] = (bloom[1] ?? 0) * light
			data[k + 2] = (bloom[2] ?? 0) * light
			data[k + 3] = 255
		}
	}
	return { pixels, width, height }
}

// ---- The city

/** A tower in CSS px: left and right edges from the canvas's left, its body's height above the waterline, and its crown. */
interface Tower {
	left: number
	right: number
	height: number
	crown: number
	seed: number
}

/** How far a crown rises above its tower's body, as a share of the body's height. */
function crownRise(crown: number, height: number): number {
	switch (CROWNS[crown]) {
		case 'box':
			return 0.035 * height
		case 'setback':
			return 0.12 * height
		case 'mast':
			return 0.14 * height
		case 'arc':
			return 0.139 * height
		case 'angle':
			return 0.1 * height
		default:
			return 0
	}
}

/** A small palm on the low base: where it stands (x from the canvas's left, in CSS px), how high its crown is above the waterline and how wide. */
interface Palm {
	x: number
	top: number
	radius: number
	seed: number
}

/** Everything the city is made of for one stage, in CSS px, before any of it is drawn. */
interface Skyline {
	/** The near towers in view: the panorama's, and the edge clusters that replace what stands under them. */
	towers: Tower[]
	/** The far towers (none where the far layer is left out). */
	far: Tower[]
	/** The low base's top above the waterline, for each CSS px column. */
	base: Float32Array
	palms: Palm[]
	/** Each crane's left leg, x from the canvas's left. */
	cranes: number[]
}

/** The low base's profile in drawing units across the panorama: a seeded mix of low roofs, which are flat, and tree canopy, which swells and falls. One level a unit, 0 to 1 of the base's height. */
function baseLevels(): Float32Array {
	const random = mulberry32(SKYLINE.base.seed)
	const levels = new Float32Array(FAR_SPAN[1] - FAR_SPAN[0] + 200)
	let at = 0
	while (at < levels.length) {
		const roof = random() < 0.6
		const run = Math.round(roof ? 8 + random() * 18 : 8 + random() * 8)
		const level = roof ? 0.7 + random() * 0.24 : 0.82 + random() * 0.16
		for (let n = 0; n < run && at + n < levels.length; n++) levels[at + n] = roof ? level : lerp(0.72, level, Math.sin((Math.PI * (n + 0.5)) / run))
		at += run
	}
	return levels
}

/** Plans the city for a stage: positions only, so the water can read the skyline's height before anything is drawn. */
function planSkyline(stage: MiamiStage): Skyline {
	const { width: W, unit, sunX, sunR, tallest } = stage
	const byWidth = stage.narrow ? 'narrow' : 'wide'
	const edges = W >= EDGE_MIN_WIDTH
	const closed = { left: edges ? EDGE_SHARE.left * W : 0, right: edges ? EDGE_SHARE.right * W : 0 }

	const towers: Tower[] = []
	NEAR_TOWERS.forEach(([x, width, height, crown], index) => {
		const left = sunX + x * unit
		const right = left + width * unit
		const middle = (left + right) / 2
		if (right < 0 || left > W || middle < closed.left || middle > W - closed.right) return
		towers.push({ left, right, height: height * unit, crown, seed: hashCell(index, 0, SKYLINE.base.seed) })
	})
	// The clusters at the edges, from the screen's edge inward, touching: each tower stands where the one before it ends
	const cluster = (list: readonly (readonly [number, number, number, number])[], reach: number, mirror: boolean): void => {
		for (const [x, width, height, crown] of list) {
			if (x * unit >= reach) break
			const near = x * unit
			const far = (x + width) * unit
			towers.push({ left: mirror ? W - far : near, right: mirror ? W - near : far, height: height * unit, crown, seed: hashCell(x, height, SKYLINE.base.seed) })
		}
	}
	cluster(EDGE_LEFT, closed.left, false)
	cluster(EDGE_RIGHT, closed.right, true)

	// The far towers: independent of the near ones so they show through their gaps, clear of the sun's gap and of the edges
	const far: Tower[] = []
	if (!stage.more) {
		const random = mulberry32(SKYLINE.far.seed)
		const gap = SKYLINE.sunGap.radii[byWidth] * sunR
		const mid = lerp(SKYLINE.far.low, SKYLINE.far.high, 0.5)
		let x: number = FAR_SPAN[0]
		let index = 0
		while (x < FAR_SPAN[1]) {
			// Every draw is made whether the tower stays or not, so the ones that stay don't depend on the screen
			const width = lerp(SKYLINE.far.width[0], SKYLINE.far.width[1], random())
			const share = random() < 0.65 ? lerp(SKYLINE.far.low, mid, random()) : lerp(mid, SKYLINE.far.high, random())
			const boxed = random() < 0.15
			const left = sunX + x * unit
			const right = left + width * unit
			const middle = (left + right) / 2
			if (right > 0 && left < W && Math.abs(middle - sunX) > gap + (width * unit) / 2 && middle > FAR_EDGE_CLEAR * W && middle < (1 - FAR_EDGE_CLEAR) * W) {
				far.push({ left, right, height: share * tallest, crown: boxed ? 1 : 0, seed: hashCell(index, 1, SKYLINE.far.seed) })
			}
			x += width + lerp(SKYLINE.far.gap[0], SKYLINE.far.gap[1], random())
			index++
		}
	}

	// The low base: continuous, its top flat at its gap height in the sun's gap and a mix of roofs and canopy elsewhere
	const levels = baseLevels()
	const baseHeight = SKYLINE.base.share[byWidth] * tallest
	const gapHalf = SKYLINE.sunGap.radii[byWidth] * sunR
	const base = new Float32Array(Math.ceil(W) + 1)
	for (let x = 0; x < base.length; x++) {
		const level = levels[Math.min(levels.length - 1, Math.max(0, Math.round((x - sunX) / unit) - FAR_SPAN[0]))] ?? 0.6
		const inGap = 1 - smoothstep(0, 14, Math.abs(x - sunX) - gapHalf)
		base[x] = baseHeight * lerp(level, SKYLINE.base.gapShare, inGap)
	}

	// A small palm top about every `palmEvery` px: its crown sits on the base's top or a little above it
	const palms: Palm[] = []
	const planter = mulberry32(SKYLINE.base.seed ^ 0x70616c6d)
	for (let x = planter() * SKYLINE.base.palmEvery; x < W; x += SKYLINE.base.palmEvery * (0.6 + 0.8 * planter())) {
		const radius = 6 + planter() * 4
		const lift = 26 + planter() * 10
		const seed = Math.floor(planter() * 4294967296)
		if (Math.abs(x - sunX) < gapHalf * 1.2) continue
		palms.push({ x, top: Math.max(lift, (base[Math.round(x)] ?? 0) + 1), radius, seed })
	}

	const cranes =
		SKYLINE.cranes.enabled && W >= SKYLINE.cranes.minWidth && stage.height >= SKYLINE.cranes.minHeight ? SKYLINE.cranes.at.map((at) => sunX + at * unit) : []
	return { towers, far, base, palms, cranes }
}

/** One tower, drawn into a mask whose bottom is the waterline (rows from the top; `x0` to `x1` and the body's `top` are in whole device px). */
function drawTower(mask: Uint8Array, width: number, height: number, tower: Tower, x0: number, x1: number, top: number, dpr: number): void {
	const body = x1 - x0
	const rise = height - top
	const roll = (salt: number) => hashCell(tower.seed, salt, 0x63726f77) / 4294967296
	switch (CROWNS[tower.crown]) {
		case 'round': {
			// One top corner is curved, the other square
			const r = body * 0.32
			const right = roll(1) < 0.5
			const points: number[] = []
			points.push(x0, height, x0, right ? top : top + r)
			if (!right) for (let a = 0; a <= 8; a++) points.push(x0 + r - r * Math.cos((Math.PI / 2) * (a / 8)), top + r - r * Math.sin((Math.PI / 2) * (a / 8)))
			if (right) for (let a = 0; a <= 8; a++) points.push(x1 - r + r * Math.sin((Math.PI / 2) * (a / 8)), top + r - r * Math.cos((Math.PI / 2) * (a / 8)))
			points.push(x1, right ? top + r : top, x1, height)
			fillPolygon(mask, width, height, points)
			return
		}
		case 'box': {
			fillBox(mask, width, height, x0, top, x1, height)
			const w = body * (0.3 + 0.25 * roll(1))
			const at = x0 + (body - w) * roll(2)
			fillBox(mask, width, height, at, top - 0.035 * rise, at + w, top)
			return
		}
		case 'setback': {
			fillBox(mask, width, height, x0, top, x1, height)
			fillBox(mask, width, height, x0 + body * 0.16, top - 0.07 * rise, x1 - body * 0.16, top)
			fillBox(mask, width, height, x0 + body * 0.32, top - 0.12 * rise, x1 - body * 0.32, top)
			return
		}
		case 'mast': {
			fillBox(mask, width, height, x0, top, x1, height)
			const w = Math.max(2, Math.round(dpr))
			const at = Math.round((x0 + x1 - w) / 2)
			fillBox(mask, width, height, at, top - 0.14 * rise, at + w, top)
			return
		}
		case 'arc': {
			// Three receding tiers, each the top half of a flattened ellipse
			fillBox(mask, width, height, x0, top, x1, height)
			;[1, 0.72, 0.44].forEach((share, tier) => {
				const middle = (x0 + x1) / 2
				const rx = (body / 2) * share
				const ry = rise * 0.055
				const y = top - tier * rise * 0.042
				const points: number[] = []
				for (let a = 0; a <= 12; a++) points.push(middle - rx * Math.cos((Math.PI * a) / 12), y - ry * Math.sin((Math.PI * a) / 12))
				fillPolygon(mask, width, height, points)
			})
			return
		}
		case 'angle': {
			fillBox(mask, width, height, x0, top, x1, height)
			fillPolygon(mask, width, height, [x0, top, x1, top, x1, top - 0.1 * rise])
			return
		}
		default:
			fillBox(mask, width, height, x0, top, x1, height)
	}
}

/** A port crane, standing on the waterline with its left leg at `x`, about `apex` tall to the top of its A-frame, its boom raised toward the left: legs, a tie beam, a girder with its machinery house, the A-frame, the boom and two stays. Line weights are 3, 2 and 1 CSS px. */
function drawCrane(mask: Uint8Array, width: number, height: number, x: number, apex: number, dpr: number): void {
	const heavy = 3 * dpr
	const middle = 2 * dpr
	const light = Math.max(1, dpr)
	const base = height
	const girder = base - apex * 0.62
	const top = base - apex
	const x1 = x
	const x2 = x + apex * 0.36
	const center = (x1 + x2) / 2
	// legs, slightly inclined in, and the tie beam
	strokeLine(mask, width, height, x1, base, x1 + apex * 0.03, girder, heavy)
	strokeLine(mask, width, height, x2, base, x2 - apex * 0.03, girder, heavy)
	strokeLine(mask, width, height, x1 + apex * 0.012, base - apex * 0.26, x2 - apex * 0.012, base - apex * 0.26, middle)
	// the girder runs back landside past the right leg, a little past the left toward the bay, with its machinery house hung under it
	const land = x2 + apex * 0.34
	strokeLine(mask, width, height, x1 - apex * 0.06, girder, land, girder, heavy)
	fillBox(mask, width, height, center - apex * 0.14, girder, center + apex * 0.02, girder + apex * 0.08)
	// the A-frame
	strokeLine(mask, width, height, x1 + apex * 0.03, girder, center, top, middle)
	strokeLine(mask, width, height, x2 - apex * 0.03, girder, center, top, middle)
	// the boom, hinged on the left leg and raised toward the bay at about 70 degrees to a tip about 1.3 times the apex, and the stays
	const hingeX = x1 + apex * 0.03
	const tipX = hingeX - apex * 0.27
	const tipY = girder - apex * 0.68
	strokeLine(mask, width, height, hingeX, girder, tipX, tipY, middle)
	strokeLine(mask, width, height, center, top, hingeX + (tipX - hingeX) * 0.72, girder + (tipY - girder) * 0.72, light)
	strokeLine(mask, width, height, center, top, land, girder, light)
}

/** A palm's top on the low base: a thin trunk and a small crown of curved leaves, in device px. */
function drawPalmTop(mask: Uint8Array, width: number, height: number, palm: Palm, x: number, baseY: number, topY: number, dpr: number): void {
	const roll = (salt: number) => hashCell(palm.seed, salt, 0x70616c6d) / 4294967296
	const line = Math.max(1, dpr)
	const tipX = x + roll(0) * 2 * dpr
	strokeLine(mask, width, height, x, baseY, tipX, topY, line)
	const radius = palm.radius * dpr
	for (let leaf = 0; leaf < 9; leaf++) {
		const angle = ((-100 + leaf * 25 + (roll(leaf + 1) * 12 - 6)) * Math.PI) / 180
		const length = radius * (0.75 + 0.25 * roll(leaf + 20))
		const points: number[] = []
		for (let step = 0; step <= 6; step++) {
			const s = step / 6
			points.push(tipX + length * s * Math.sin(angle), topY - length * s * Math.cos(angle) + 0.55 * length * s * s)
		}
		strokePath(mask, width, height, points, line)
	}
}

/**
 * The near city as one band along the waterline, at device resolution: every tower with its crown, with rect edges snapped to
 * whole device pixels, the cranes, the low base with its palm tops, and the clusters at the edges, all in the near color.
 * Returns the band, with the beacons' places on it.
 */
function* bakeNear(stage: MiamiStage, skyline: Skyline, dpr: number): Generator<void, { pixels: ImageData; width: number; height: number; beacons: MiamiBeacon[] }, undefined> {
	const width = deviceSize(stage.width, dpr)
	const heightCss = Math.ceil(Math.max(CITY_TOP_UNITS * stage.unit, 60)) + 2
	const height = Math.ceil(heightCss * dpr)
	const mask = new Uint8Array(width * height)

	// The low base: how many whole device rows each column rises, and the share of the row above it that its top edge covers
	const whole = new Int32Array(width)
	const edge = new Uint8Array(width)
	let tallestBase = 0
	for (let x = 0; x < width; x++) {
		const at = (x + 0.5) / dpr
		const i = Math.min(skyline.base.length - 2, Math.floor(at))
		const rise = lerp(skyline.base[i] ?? 0, skyline.base[i + 1] ?? 0, at - i) * dpr
		whole[x] = Math.min(height, Math.floor(rise))
		edge[x] = Math.round(255 * (rise - Math.floor(rise)))
		tallestBase = Math.max(tallestBase, whole[x] ?? 0)
	}
	// Row by row from the waterline up, so the writes run along the mask
	for (let row = 0; row <= tallestBase; row++) {
		const at = (height - 1 - row) * width
		if (height - 1 - row < 0) break
		for (let x = 0; x < width; x++) {
			const rises = whole[x] ?? 0
			if (row < rises) mask[at + x] = 255
			else if (row === rises) mask[at + x] = edge[x] ?? 0
		}
	}
	yield

	// The towers, with rect edges on whole device px
	let drawn = 0
	for (const tower of skyline.towers) {
		const x0 = Math.round(tower.left * dpr)
		const x1 = Math.max(x0 + 1, Math.round(tower.right * dpr))
		const top = height - Math.round(tower.height * dpr)
		drawTower(mask, width, height, tower, x0, x1, top, dpr)
		if (++drawn % TOWERS_PER_STEP === 0) yield
	}
	yield

	for (const crane of skyline.cranes) drawCrane(mask, width, height, crane * dpr, SKYLINE.cranes.apex * stage.unit * dpr, dpr)
	for (const palm of skyline.palms) {
		const baseTop = skyline.base[Math.min(skyline.base.length - 1, Math.round(palm.x))] ?? 0
		drawPalmTop(mask, width, height, palm, palm.x * dpr, height - baseTop * dpr, height - palm.top * dpr, dpr)
	}
	yield

	// Beacons: the tallest few towers in view that stand clear of the sun, each at the top of its crown
	const beacons: MiamiBeacon[] = []
	if (BEACONS.enabled) {
		const count = BEACONS.count[stage.narrow ? 'narrow' : 'wide']
		const candidates = skyline.towers
			.filter((tower) => {
				const middle = (tower.left + tower.right) / 2
				return middle > 0 && middle < stage.width && Math.abs(middle - stage.sunX) >= 90 && tower.height >= stage.tallest * 0.86
			})
			.sort((p, q) => q.height - p.height || p.left - q.left)
		for (const tower of candidates.slice(0, count)) beacons.push({ x: (tower.left + tower.right) / 2, z: tower.height + crownRise(tower.crown, tower.height) })
	}

	const pixels = yield* silhouette(mask, width, height, hexRgb(SKYLINE.near))
	return { pixels, width, height, beacons }
}

/** The sky's color at a place (x from the canvas's left, z above the page's end), read from the baked sky. */
function skyColorAt(sky: SkyPixels, stage: MiamiStage, x: number, z: number): Rgb {
	const { pixels } = sky
	const i = Math.min(pixels.width - 1, Math.max(0, Math.floor((x / stage.width) * pixels.width)))
	const j = Math.min(pixels.height - 1, Math.max(0, Math.floor(((sky.zTop - z) / sky.rows) * pixels.height)))
	const k = (j * pixels.width + i) * 4
	return [pixels.data[k] ?? 0, pixels.data[k + 1] ?? 0, pixels.data[k + 2] ?? 0]
}

/**
 * The far city: a second row of towers behind the near ones, so they show through its gaps, in a vertical gradient from a
 * darker top to a hazier base that warms toward the sun, with a band of the local sky's color over its feet. It is baked at
 * half the device resolution (one pixel a CSS px at 2x, at most) and upscaled when drawn, so its edges are soft.
 */
function* bakeFar(stage: MiamiStage, skyline: Skyline, sky: SkyPixels, dpr: number): Generator<void, { pixels: ImageData; scale: number; width: number; height: number }, undefined> {
	const scale = Math.min(1, dpr / 2)
	const width = Math.max(1, Math.ceil(stage.width * scale))
	const heightCss = Math.ceil(stage.tallest * SKYLINE.far.high * 1.08) + 2
	const height = Math.max(1, Math.ceil(heightCss * scale))
	const coverage = new Float32Array(width * height)
	for (const tower of skyline.far) {
		const top = heightCss - tower.height
		coverBox(coverage, width, height, tower.left * scale, top * scale, tower.right * scale, heightCss * scale)
		if (tower.crown === 1) {
			const w = (tower.right - tower.left) * (0.3 + 0.25 * (hashCell(tower.seed, 0, 1) / 4294967296))
			const at = tower.left + (tower.right - tower.left - w) * (hashCell(tower.seed, 1, 1) / 4294967296)
			coverBox(coverage, width, height, at * scale, (top - 0.035 * tower.height) * scale, (at + w) * scale, top * scale)
		}
	}
	yield
	const { far } = SKYLINE
	const topColor = hexRgb(far.top)
	const baseColor = hexRgb(far.base)
	const sunColor = hexRgb(far.sunColor)
	const reach = far.high * stage.tallest
	const pixels = new ImageData(width, height)
	const { data } = pixels
	const rowsPerBatch = Math.max(1, Math.floor(COPY_PIXELS / width))
	for (let start = 0; start < height; start += rowsPerBatch) {
		for (let j = start; j < Math.min(height, start + rowsPerBatch); j++) {
			// Height of this row above the waterline, CSS px
			const z = (height - j - 0.5) / scale
			const haze = SKYLINE.haze.alpha * (1 - smoothstep(0, SKYLINE.haze.height, z))
			const gradient = mixRgb(baseColor, topColor, clamp01(z / reach))
			for (let i = 0; i < width; i++) {
				const share = coverage[j * width + i] ?? 0
				if (share <= 0) continue
				const x = (i + 0.5) / scale
				let color = mixRgb(gradient, sunColor, far.sunMix * sunNearness(stage, x))
				if (haze > 0) color = mixRgb(color, skyColorAt(sky, stage, x, stage.zWater + z), haze)
				const k = (j * width + i) * 4
				data[k] = color[0]
				data[k + 1] = color[1]
				data[k + 2] = color[2]
				data[k + 3] = Math.round(255 * share)
			}
		}
		yield
	}
	return { pixels, scale, width, height }
}

/** A small soft red dot for a beacon, at device resolution: a solid core with a soft edge, as alpha in the beacon's color. */
function bakeBeacon(dpr: number): Baked {
	const core = (BEACONS.size * dpr) / 2
	const size = 2 * Math.ceil(core * 3) + 1
	const color = hexRgb(BEACONS.color)
	const pixels = new ImageData(size, size)
	const { data } = pixels
	for (let j = 0; j < size; j++) {
		for (let i = 0; i < size; i++) {
			const r = Math.hypot(i + 0.5 - size / 2, j + 0.5 - size / 2)
			const k = (j * size + i) * 4
			data[k] = color[0]
			data[k + 1] = color[1]
			data[k + 2] = color[2]
			data[k + 3] = Math.round(255 * (1 - smoothstep(core * 0.6, core * 1.9, r)))
		}
	}
	return { pixels, width: size / dpr, height: size / dpr }
}

// ---- Water

/** The stops of a color ramp in linear light. */
type LinearStops = readonly { at: number; rgb: readonly [number, number, number] }[]

function linearStops(stops: readonly (readonly [number, string])[]): LinearStops {
	return stops.map(([at, hex]) => ({ at, rgb: linearColor(hex) }))
}

/** The ramp's color at `at`, in linear light, mixing the two stops it falls between (the end stops beyond them). */
function stopsAt(stops: LinearStops, at: number, out: Float32Array, k: number): void {
	let before = stops[0]
	for (const stop of stops) {
		if (at <= stop.at) {
			const span = stop.at - (before?.at ?? 0)
			const t = span > 0 ? (at - (before?.at ?? 0)) / span : 1
			for (let c = 0; c < 3; c++) out[k + c] = lerp(before?.rgb[c] ?? 0, stop.rgb[c] ?? 0, t)
			return
		}
		before = stop
	}
	for (let c = 0; c < 3; c++) out[k + c] = before?.rgb[c] ?? 0
}

/** The water's palette: direction B's where the page's text is promoted and the contrast preference is off, else A's. */
function waterPalette(stage: MiamiStage): typeof WATER.stops.B | typeof WATER.stops.A {
	return STAGE.direction === 'B' && !stage.more ? WATER.stops.B : WATER.stops.A
}

/** The most luminance a row of the water at this height may have: the footer's cap at and below its copy, easing out to none over the feather above it. */
function luminanceCap(stage: MiamiStage, z: number): number {
	const cap = stage.more ? WATER.footerCap.more : STAGE.direction === 'B' ? WATER.footerCap.B : WATER.footerCap.A
	const from = stage.zFooterTop + WATER.capGap
	return cap + (1 - cap) * smoothstep(from, from + WATER.capFeather, z)
}

/**
 * A field of lens-shaped dashes as 0-255 coverage, one CSS px a pixel, laid out in the water's perspective: rows grow with
 * depth, and so do the dashes, which are crowded into patches by a slow noise along each row. A dash is short and broken
 * and swells then tapers along its length. It wraps at the sides, so the field tiles.
 */
function* lensField(width: number, rows: number, zWater: number, seed: number, share: (depth: number) => number): Generator<void, Uint8Array, undefined> {
	const field = new Uint8Array(width * rows)
	const random = mulberry32(seed)
	// Columns of dashes drawn since the last return: a field of a large screen holds millions of pixels, so it returns now and then
	let written = 0
	const { rowHeight, dash, jitter } = WATER.ripple
	const span = 96
	const knots = Float32Array.from({ length: Math.ceil(width / span) + 3 }, () => random())
	const patch = (x: number) => {
		const t = x / span
		const i = Math.floor(t)
		const f = t - i
		const a = knots[i] ?? 0.5
		const b = knots[i + 1] ?? 0.5
		return a + (b - a) * f * f * (3 - 2 * f)
	}
	for (let y = 0; y < rows; ) {
		const depth = Math.min(1, (y + 0.5) / zWater)
		const high = Math.max(1, Math.round(lerp(rowHeight[0], rowHeight[1], depth)))
		const long = lerp(dash[0], dash[1], depth)
		const crowd = share(depth)
		for (let x = random() * long - long; x < width; ) {
			const length = long * (1 + jitter * (2 * random() - 1))
			const local = Math.min(0.85, Math.max(0.04, crowd * (0.2 + 1.6 * patch(Math.max(0, x)))))
			for (let i = Math.floor(x); i < Math.ceil(x + length); i++) {
				const along = (i + 0.5 - x) / length
				if (along <= 0 || along >= 1) continue
				const value = Math.round(255 * Math.sin(Math.PI * along) ** 0.6)
				const column = ((i % width) + width) % width
				for (let j = y; j < Math.min(rows, y + high); j++) field[j * width + column] = Math.max(field[j * width + column] ?? 0, value)
				written++
			}
			x += length + ((length * (1 - local)) / local) * (0.4 + 1.2 * random())
		}
		y += high
		if (written >= LENS_PIXELS) {
			written = 0
			yield
		}
	}
	return field
}

/** The skyline's height above the waterline at each column of the water's base (CSS px, the margin included), for the reflection: the tallest of the base, the near towers and the far ones, smoothed over 2 px. */
function skylineProfile(skyline: Skyline, width: number, margin: number): Float32Array {
	const raw = new Float32Array(width)
	for (let i = 0; i < width; i++) raw[i] = skyline.base[Math.min(skyline.base.length - 1, Math.max(0, i - margin))] ?? 0
	for (const tower of [...skyline.towers, ...skyline.far]) {
		const top = tower.height + crownRise(tower.crown, tower.height)
		for (let i = Math.max(0, Math.floor(tower.left) + margin); i < Math.min(width, Math.ceil(tower.right) + margin); i++) raw[i] = Math.max(raw[i] ?? 0, top)
	}
	const smooth = new Float32Array(width)
	for (let i = 0; i < width; i++) {
		let sum = 0
		let count = 0
		for (let d = -2; d <= 2; d++) {
			sum += raw[Math.min(width - 1, Math.max(0, i + d))] ?? 0
			count++
		}
		smooth[i] = sum / count
	}
	return smooth
}

/**
 * The water's base picture, in float and a batch of rows at a time: for each row below the waterline the body's color, darker
 * toward the viewer, with the dark troughs of the ripples baked in, the sun's glow column widening toward the viewer, the
 * skyline's dark reflection under every tower and a hot sliver along the waterline, all capped in luminance for every row at or
 * below the footer. Rows past the page's end repeat the last, for a pull past it.
 */
function* bakeWaterBase(stage: MiamiStage, skyline: Skyline): Generator<void, { pixels: ImageData; width: number; height: number }, undefined> {
	const { width: W, zWater, sunX, sunR } = stage
	const margin = WATER.strips.margin
	const width = Math.ceil(W) + 2 * margin
	const height = Math.ceil(zWater + STAGE.water.overscan)
	const pixels = new ImageData(width, height)
	const { data } = pixels
	const encoded = encoding()
	const noise = grain()
	const palette = waterPalette(stage)
	const bodyStops = linearStops(palette.body)
	const troughStops = linearStops(palette.trough)
	const troughs = yield* lensField(width, height, zWater, WATER.ripple.seed ^ 0x74726f75, () => WATER.ripple.troughShare)
	yield
	const profile = skylineProfile(skyline, width, margin)
	yield
	let tallestProfile = 0
	for (const h of profile) tallestProfile = Math.max(tallestProfile, h)
	const baseHeight = SKYLINE.base.share[stage.narrow ? 'narrow' : 'wide'] * stage.tallest
	const glow = linearColor(WATER.glow.color)
	const core = linearColor(WATER.reflection.core)
	const sliver = linearColor(WATER.sliver.color)
	const { reflection } = WATER
	const body = new Float32Array(3)
	const trough = new Float32Array(3)

	const rowsPerBatch = Math.max(1, Math.floor(WATER_BATCH_PIXELS / width))
	for (let start = 0; start < height; start += rowsPerBatch) {
		for (let j = start; j < Math.min(height, start + rowsPerBatch); j++) {
			const p = j + 0.5
			const depth = Math.min(1, p / zWater)
			const z = zWater - p
			stopsAt(bodyStops, depth, body, 0)
			stopsAt(troughStops, depth, trough, 0)
			const dim = 1 - WATER.darken.amount * smoothstep(WATER.darken.from, 1, depth)
			const bodyR = (body[0] ?? 0) * dim
			const bodyG = (body[1] ?? 0) * dim
			const bodyB = (body[2] ?? 0) * dim
			const cap = luminanceCap(stage, z)
			const glowLight = WATER.glow.strength * (1 - smoothstep(WATER.glow.fade[0], WATER.glow.fade[1], depth)) ** WATER.glow.fade[2]
			const reachPx = columnReach(depth, sunR)
			const reflects = p < reflection.to * tallestProfile
			const slivered = p < WATER.sliver.height
			let n = Math.imul(j + 1, 0x9e3779b1) >>> 20
			let k = j * width * 4
			for (let i = 0; i < width; i++) {
				let r = bodyR
				let g = bodyG
				let b = bodyB
				const m = troughs[j * width + i] ?? 0
				if (m > 0) {
					const a = (WATER.ripple.troughAlpha * m) / 255
					r += ((trough[0] ?? 0) - r) * a
					g += ((trough[1] ?? 0) - g) * a
					b += ((trough[2] ?? 0) - b) * a
				}
				const x = i - margin + 0.5
				const across = (x - sunX) / reachPx
				if (glowLight > 0 && across * across < 9) {
					const light = glowLight * Math.exp(-across * across)
					r += glow[0] * light
					g += glow[1] * light
					b += glow[2] * light
				}
				const h = profile[i] ?? 0
				if (reflects && h > 0) {
					const q = p / h
					if (q < reflection.to) {
						const a = reflection.strength * (1 - smoothstep(reflection.from, reflection.to, q))
						r += (core[0] - r) * a
						g += (core[1] - g) * a
						b += (core[2] - b) * a
					}
				}
				if (slivered) {
					// Strongest near the sun, and broken wherever a tower's reflection stands
					const near = 0.25 + 0.75 * Math.exp(-(((x - sunX) / (sunR * 8)) ** 2))
					const open = 1 - 0.85 * smoothstep(1.3 * baseHeight, 2 * baseHeight, h)
					const a = 0.9 * near * open * (1 - p / WATER.sliver.height)
					r += (sliver[0] - r) * a
					g += (sliver[1] - g) * a
					b += (sliver[2] - b) * a
				}
				const light = 0.2126 * r + 0.7152 * g + 0.0722 * b
				if (light > cap) {
					const scale = cap / light
					r *= scale
					g *= scale
					b *= scale
				}
				data[k] = encode(encoded, r) + (noise[n & (NOISE_SIZE - 1)] ?? 0)
				data[k + 1] = encode(encoded, g) + (noise[(n + 1365) & (NOISE_SIZE - 1)] ?? 0)
				data[k + 2] = encode(encoded, b) + (noise[(n + 2730) & (NOISE_SIZE - 1)] ?? 0)
				data[k + 3] = 255
				n++
				k += 4
			}
		}
		yield
	}
	return { pixels, width, height }
}

/**
 * One ripple layer's tile: crests as lens-shaped dashes, one CSS px a pixel, from the waterline to the page's end, in the
 * crest color of their depth and the crest alpha. A crest's luminance is capped by the same cap the water is, so composited
 * over the water it never passes it (mixing in sRGB can't exceed the brighter of the two in linear light).
 */
function* bakeRippleTile(stage: MiamiStage, width: number, seed: number): Generator<void, ImageData, undefined> {
	const rows = Math.ceil(stage.zWater)
	const field = yield* lensField(width, rows, stage.zWater, seed, (depth) => lerp(WATER.ripple.crestShare[0], WATER.ripple.crestShare[1], depth))
	const stops = linearStops(waterPalette(stage).crest)
	const encoded = encoding()
	const color = new Float32Array(3)
	const pixels = new ImageData(width, rows)
	const { data } = pixels
	const rowsPerBatch = Math.max(1, Math.floor(COPY_PIXELS / width))
	for (let start = 0; start < rows; start += rowsPerBatch) {
		for (let j = start; j < Math.min(rows, start + rowsPerBatch); j++) {
			const p = j + 0.5
			stopsAt(stops, Math.min(1, p / stage.zWater), color, 0)
			const light = 0.2126 * (color[0] ?? 0) + 0.7152 * (color[1] ?? 0) + 0.0722 * (color[2] ?? 0)
			const cap = luminanceCap(stage, stage.zWater - p)
			const scale = light > cap ? cap / light : 1
			const r = Math.round(encode(encoded, (color[0] ?? 0) * scale))
			const g = Math.round(encode(encoded, (color[1] ?? 0) * scale))
			const b = Math.round(encode(encoded, (color[2] ?? 0) * scale))
			for (let i = 0; i < width; i++) {
				const k = (j * width + i) * 4
				data[k] = r
				data[k + 1] = g
				data[k + 2] = b
				data[k + 3] = Math.round(((field[j * width + i] ?? 0) * WATER.ripple.crestAlpha))
			}
		}
		yield
	}
	return pixels
}

/** The glitter's dashes: one cell for each depth class, each a Gaussian dash on black in that depth's color, at device resolution. The draw scales a cell to a dash's size. */
function bakeGlitter(dpr: number): { pixels: ImageData; cellWidth: number; cellHeight: number } {
	const cellWidth = Math.ceil(WATER.glitter.width[1] * dpr)
	const cellHeight = Math.max(3, Math.ceil(WATER.glitter.height[1] * dpr) + 2)
	const colors = WATER.glitter.colors.map(([at, hex]) => ({ at, rgb: hexRgb(hex) }))
	const pixels = new ImageData(cellWidth, cellHeight * GLITTER_CLASSES)
	const { data } = pixels
	const cut = Math.exp(-4.5)
	// A Gaussian that reaches exactly 0 at the cell's edge, so no dash shows a box
	const taper = (u: number) => Math.max(0, Math.exp(-4.5 * u * u) - cut) / (1 - cut)
	for (let c = 0; c < GLITTER_CLASSES; c++) {
		const depth = (c + 0.5) / GLITTER_CLASSES
		let color: Rgb = colors[colors.length - 1]?.rgb ?? [255, 255, 255]
		for (let s = 1; s < colors.length; s++) {
			const to = colors[s]
			const from = colors[s - 1]
			if (to && from && depth <= to.at) {
				color = mixRgb(from.rgb, to.rgb, (depth - from.at) / (to.at - from.at))
				break
			}
		}
		for (let j = 0; j < cellHeight; j++) {
			for (let i = 0; i < cellWidth; i++) {
				const level = taper(((i + 0.5) / cellWidth) * 2 - 1) * taper(((j + 0.5) / cellHeight) * 2 - 1)
				const k = ((c * cellHeight + j) * cellWidth + i) * 4
				data[k] = color[0] * level
				data[k + 1] = color[1] * level
				data[k + 2] = color[2] * level
				data[k + 3] = 255
			}
		}
	}
	return { pixels, cellWidth, cellHeight }
}

// ---- The boat

/** A hull, cabin and mast in the near color, with a dark reflection under it, at device resolution, the bow to the right; and the V of its wake. */
function bakeBoat(stage: MiamiStage, dpr: number): { hull: Baked & { foot: number }; wake: Baked & { apexX: number; apexY: number } } {
	const length = stage.boatLength * dpr
	const margin = 2
	const above = Math.ceil(Math.max(0.17, BOAT.mast) * length) + margin
	const below = Math.ceil(BOAT.reflection * dpr) + margin
	const width = Math.ceil(1.1 * length) + 2 * margin
	const height = above + below
	const middle = width / 2
	const mask = new Uint8Array(width * height)
	const point = (share: readonly [number, number]): [number, number] => [middle + share[0] * length, above - share[1] * length]
	const polygon = (shares: readonly (readonly [number, number])[]) => fillPolygon(mask, width, height, shares.flatMap((share) => point(share)))
	polygon(BOAT.hull)
	polygon(BOAT.cabin)
	// The mast stands on the cabin's roof, a hair's breadth wide
	const cabinTop = Math.max(...BOAT.cabin.map((share) => share[1]))
	const mastX = middle + 0.02 * length
	strokeLine(mask, width, height, mastX, above - cabinTop * length, mastX, above - BOAT.mast * length, Math.max(1, dpr))
	const pixels = new ImageData(width, height)
	const { data } = pixels
	const color = hexRgb(SKYLINE.near)
	const reflect = BOAT.reflection * dpr
	for (let j = 0; j < height; j++) {
		for (let i = 0; i < width; i++) {
			let alpha = (mask[j * width + i] ?? 0) / 255
			if (j >= above) {
				// Under the foot: the silhouette flipped, fading out over the reflection's depth
				const mirrored = above - (j - above) - 1
				alpha = mirrored >= 0 ? ((mask[mirrored * width + i] ?? 0) / 255) * 0.55 * (1 - (j - above) / reflect) ** 1.2 : 0
			}
			const k = (j * width + i) * 4
			data[k] = color[0]
			data[k + 1] = color[1]
			data[k + 2] = color[2]
			data[k + 3] = Math.round(255 * Math.max(0, alpha))
		}
	}

	// The wake: two thin lines from the bow, opening behind at the half angle and fading out over their length
	const reach = BOAT.wake.lengths * length
	const spread = reach * Math.tan((BOAT.wake.halfAngle * Math.PI) / 180)
	const wakeWidth = Math.ceil(reach) + 2 * margin
	const wakeHeight = Math.ceil(2 * spread) + 2 * margin + 2
	const lines = new Uint8Array(wakeWidth * wakeHeight)
	const apexX = wakeWidth - margin
	const apexY = wakeHeight / 2
	strokeLine(lines, wakeWidth, wakeHeight, apexX, apexY, apexX - reach, apexY - spread, Math.max(1, dpr))
	strokeLine(lines, wakeWidth, wakeHeight, apexX, apexY, apexX - reach, apexY + spread, Math.max(1, dpr))
	const tint = hexRgb(BOAT.wake.color)
	const light = new ImageData(wakeWidth, wakeHeight)
	for (let j = 0; j < wakeHeight; j++) {
		for (let i = 0; i < wakeWidth; i++) {
			const along = clamp01((apexX - i) / reach)
			const level = ((lines[j * wakeWidth + i] ?? 0) / 255) * BOAT.wake.alpha * (1 - along)
			const k = (j * wakeWidth + i) * 4
			light.data[k] = tint[0] * level
			light.data[k + 1] = tint[1] * level
			light.data[k + 2] = tint[2] * level
			light.data[k + 3] = 255
		}
	}
	return { hull: { pixels, width, height, foot: above }, wake: { pixels: light, width: wakeWidth, height: wakeHeight, apexX, apexY } }
}

/**
 * Builds everything the scene draws from, for `stage` at pixel ratio `dpr`, as a generator: it returns after each batch of
 * rows so the caller can spread the build over several ticks, and it ends with the assets. `return(null)` ends it early, and
 * whether it is abandoned or throws, the bitmaps made so far are closed.
 */
export function* buildMiamiAssets(stage: MiamiStage, dpr: number, tokens: SkyTokens): Generator<void, MiamiAssets | null, undefined> {
	const made: ImageBitmap[] = []
	const own = (pixels: ImageData): ImageBitmap => {
		const bitmap = toBitmap(pixels)
		made.push(bitmap)
		return bitmap
	}
	try {
		let baked: SkyPixels | null = yield* bakeSky(stage, tokens.navy)
		const sky: MiamiSky = { image: own(baked.pixels), zTop: baked.zTop, rows: baked.rows }
		yield
		let left: MiamiWing | null = null
		let right: MiamiWing | null = null
		if (stage.rail.left) {
			const wing = bakeWing(stage, stage.rail.left, true, dpr)
			left = { image: own(wing.pixels), feather: wing.feather }
		}
		if (stage.rail.right) {
			const wing = bakeWing(stage, stage.rail.right, false, dpr)
			right = { image: own(wing.pixels), feather: wing.feather }
		}
		yield

		const clouds = yield* bakeClouds(stage, own)
		const skyline = planSkyline(stage)
		const disc = bakeDisc(stage, dpr)
		const halo = bakeHalo(stage)
		const dot = bakeBeacon(dpr)
		const sun: MiamiSun = { disc: { image: own(disc.pixels), width: disc.width, height: disc.height }, halo: { image: own(halo.pixels), width: halo.width, height: halo.height } }
		const beacon: MiamiImage = { image: own(dot.pixels), width: dot.width, height: dot.height }
		yield

		const nearBaked = yield* bakeNear(stage, skyline, dpr)
		const near: MiamiNear = { image: own(nearBaked.pixels), width: nearBaked.width / dpr, height: nearBaked.height / dpr, beacons: nearBaked.beacons }
		yield
		let far: MiamiImage | null = null
		if (!stage.more) {
			const farBaked = yield* bakeFar(stage, skyline, baked, dpr)
			far = { image: own(farBaked.pixels), width: farBaked.width / farBaked.scale, height: farBaked.height / farBaked.scale }
		}
		// The sky's pixels are not needed again
		baked = null
		yield

		const base = yield* bakeWaterBase(stage, skyline)
		const baseImage: MiamiImage = { image: own(base.pixels), width: base.width, height: base.height }
		yield
		const tileWidth = Math.round(Math.min(WATER.ripple.tileMax, Math.max(WATER.ripple.tileMin[stage.narrow ? 'narrow' : 'wide'], stage.width + 32)))
		const firstRipple = yield* bakeRippleTile(stage, tileWidth, WATER.ripple.seed)
		const crestA = own(firstRipple)
		const secondRipple = yield* bakeRippleTile(stage, tileWidth, WATER.ripple.seed ^ 0x5b5b5b5b)
		const crestB = own(secondRipple)
		const water: MiamiWater = { base: baseImage, rows: waterRows(Math.round(stage.zWater * dpr)), ripples: [crestA, crestB], tileWidth }
		yield

		const dashes = bakeGlitter(dpr)
		const glitter: MiamiGlitter = { atlas: own(dashes.pixels), cellWidth: dashes.cellWidth, cellHeight: dashes.cellHeight, classes: GLITTER_CLASSES }
		yield
		let boat: MiamiBoat | null = null
		if (BOAT.enabled) {
			const drawn = bakeBoat(stage, dpr)
			boat = {
				hull: { image: own(drawn.hull.pixels), width: drawn.hull.width / dpr, height: drawn.hull.height / dpr },
				foot: drawn.hull.foot / dpr,
				wake: { image: own(drawn.wake.pixels), width: drawn.wake.width / dpr, height: drawn.wake.height / dpr },
				apex: { x: drawn.wake.apexX / dpr, y: drawn.wake.apexY / dpr },
			}
		}

		const assets: MiamiAssets = { dpr, sky, wings: { left, right }, clouds, sun, far, near, beacon, water, glitter, boat }
		// The assets own the bitmaps now
		made.length = 0
		return assets
	} finally {
		for (const bitmap of made) bitmap.close()
	}
}

/** Closes every bitmap of a build the scene is done with. */
export function closeMiamiAssets(assets: MiamiAssets): void {
	assets.sky.image.close()
	assets.wings.left?.image.close()
	assets.wings.right?.image.close()
	for (const cloud of assets.clouds) cloud.image.close()
	assets.sun.disc.image.close()
	assets.sun.halo.image.close()
	assets.far?.image.close()
	assets.near.image.close()
	assets.beacon.image.close()
	assets.water.base.image.close()
	for (const tile of assets.water.ripples) tile.close()
	assets.glitter.atlas.close()
	assets.boat?.hull.image.close()
	assets.boat?.wake.image.close()
}
