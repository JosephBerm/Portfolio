import { parseHexColor } from '@/lib/sky/color'
import { HAZE_MAX_PIXELS } from '@/lib/sky/config'
import { RAMP, STAGE, WATER, WING } from '@/lib/sky/miamiConfig'
import { srgbToLinear } from '@/lib/sky/miamiRamp'
import { rampFor, type MiamiStage, type RailSide } from '@/lib/sky/miamiStage'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { mulberry32 } from '@/lib/sky/random'
import { smoothstep } from '@/lib/sky/scene'
import { toBitmap } from './skyAssets'

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

/** Everything the scene draws from, built for one stage at one pixel ratio and closed together. */
export interface MiamiAssets {
	/** The pixel ratio the wings were built at; the sky is built in CSS px. */
	dpr: number
	sky: MiamiSky
	/** A side with no rail copy has no wing. */
	wings: { left: MiamiWing | null; right: MiamiWing | null }
	/** The flat color below the waterline, a CSS color. */
	water: string
}

/** Rows of the sky's bitmap below the waterline: the water draws over them, so rounding never opens a gap at the water's edge. */
const SKY_BELOW = 4

/** Rows of the sky's bitmap above where the ramp reaches navy, so its top row is navy and joins the page with no seam. */
const SKY_ABOVE = 8

/** Rows from the bitmap's top over which the dither fades in, so the very top row stays exactly navy. */
const DITHER_TAPER = 8

/** Pixels of the sky baked between two returns of the generator: a fraction of a millisecond when warm, so a slice of the build ends close to its budget even on a slow device. */
const BATCH_PIXELS = 8192

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

/** A hex color in linear light. */
function linearColor(hex: string): [number, number, number] {
	const rgb = parseHexColor(hex)
	if (!rgb) throw new Error(`Unreadable color: ${hex}`)
	return [srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2])]
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
			const hairy = t + arc > limb.hairlineT - hairSpan && t < limb.hairlineT + hairSpan
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

/** The flat color below the waterline: the last body color of the water's palette in use, which the footer's copy reads well on. */
function flatWater(stage: MiamiStage): string {
	const palette = STAGE.direction === 'B' && !stage.more ? WATER.stops.B : WATER.stops.A
	const last = palette.body.at(-1)
	if (!last) throw new RangeError('The water has no body color')
	return last[1]
}

/**
 * Builds everything the scene draws from, for `stage` at pixel ratio `dpr`, as a generator: it returns after each batch of
 * rows so the caller can spread the build over several ticks, and it ends with the assets. `return(null)` ends it early, and
 * whether it is abandoned or throws, the bitmaps made so far are closed.
 */
export function* buildMiamiAssets(stage: MiamiStage, dpr: number, tokens: SkyTokens): Generator<void, MiamiAssets | null, undefined> {
	let skyImage: ImageBitmap | null = null
	let leftImage: ImageBitmap | null = null
	let rightImage: ImageBitmap | null = null
	try {
		const baked = yield* bakeSky(stage, tokens.navy)
		skyImage = toBitmap(baked.pixels)
		yield
		let left: MiamiWing | null = null
		let right: MiamiWing | null = null
		if (stage.rail.left) {
			const wing = bakeWing(stage, stage.rail.left, true, dpr)
			leftImage = toBitmap(wing.pixels)
			left = { image: leftImage, feather: wing.feather }
		}
		if (stage.rail.right) {
			const wing = bakeWing(stage, stage.rail.right, false, dpr)
			rightImage = toBitmap(wing.pixels)
			right = { image: rightImage, feather: wing.feather }
		}
		const assets: MiamiAssets = { dpr, sky: { image: skyImage, zTop: baked.zTop, rows: baked.rows }, wings: { left, right }, water: flatWater(stage) }
		// The assets own the bitmaps now
		skyImage = leftImage = rightImage = null
		return assets
	} finally {
		skyImage?.close()
		leftImage?.close()
		rightImage?.close()
	}
}

/** Closes every bitmap of a build the scene is done with. */
export function closeMiamiAssets(assets: MiamiAssets): void {
	assets.sky.image.close()
	assets.wings.left?.image.close()
	assets.wings.right?.image.close()
}
