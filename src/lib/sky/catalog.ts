import {
	CELL_SIZE,
	COLOR_GROUPS,
	DEPTH,
	EMERGENCE,
	LAYERS,
	MAGNITUDE,
	MAX_STARS,
	NARROW_DENSITY_BOOST,
	NARROW_MAX_WIDTH,
	SHAPE_BREAKS,
	SKY_LAYERS,
	SKY_SEED,
	STAR_ALPHA,
	STARS_PER_MP,
	TINT_BREAKS,
	TWINKLE_HARMONICS,
	type SkyLayer,
} from './config'
import { between, hashCell, mulberry32 } from './random'

/** Slow log-normal twinkle: three incommensurate sines with per-star phases, never a shared clock. */
export interface Twinkle {
	sigma: number
	/** Angular frequencies (rad/s) and phases (rad). */
	w1: number
	w2: number
	w3: number
	p1: number
	p2: number
	p3: number
}

/** One star on its layer's plane. Position is CSS px from the sky origin (the viewport's top-left at scroll 0). */
export interface Star {
	x: number
	y: number
	/** Alpha from the star's magnitude, before scene, dusk, quiet and twinkle factors. */
	alpha: number
	/** Nearness from the magnitude (DEPTH): the share of the camera's motion this star shows. Costs no random draw. */
	q: number
	/** Index into STAR_SHAPES. */
	shape: number
	/** Palette index: 0 is --color-white, 1-7 are STAR_TINTS. */
	tint: number
	/** Thinning key in [0, 1): the star is drawn while keep < densityKeep(). */
	keep: number
	/** Seconds after the loader starts lifting before this star begins to come out (brighter stars first). */
	delay: number
	twinkle: Twinkle | null
}

const { brightest, faintest, slope } = MAGNITUDE
const cumulativeAtBrightest = 10 ** (slope * brightest)
const cumulativeSpan = 10 ** (slope * faintest) - cumulativeAtBrightest

/** Share of all stars brighter than magnitude m (the cumulative distribution N(<m) proportional to 10^(slope × m)). */
function cumulative(m: number): number {
	return (10 ** (slope * m) - cumulativeAtBrightest) / cumulativeSpan
}

/** Inverse of `cumulative`: the magnitude at cumulative share u. */
function magnitudeAt(u: number): number {
	return Math.log10(u * cumulativeSpan + cumulativeAtBrightest) / slope
}

/** Expected stars per cell for each layer, generated at the narrow-screen density and thinned on wider screens. */
const STARS_PER_CELL = Object.fromEntries(
	SKY_LAYERS.map((layer) => {
		const [from, to] = LAYERS[layer].magnitude
		const share = cumulative(to) - cumulative(from)
		return [layer, ((STARS_PER_MP * NARROW_DENSITY_BOOST * CELL_SIZE * CELL_SIZE) / 1e6) * share]
	})
) as Record<SkyLayer, number>

/** Sum of the color-group weights, for a weighted pick. */
const GROUP_TOTAL = COLOR_GROUPS.reduce((sum, group) => sum + group.weight, 0)

/** Seed salt per layer, so the layers' cells hold different stars. Changing it recomposes the sky (see SKY_SEED). */
const LAYER_SALT: Record<SkyLayer, number> = { far: 1, mid: 2, near: 3 }

/** Alpha for a magnitude (see STAR_ALPHA). */
export function magnitudeAlpha(m: number): number {
	const t = Math.min(1, Math.max(0, (m - brightest) / (faintest - brightest)))
	return STAR_ALPHA.peak * (1 - STAR_ALPHA.drop * t ** STAR_ALPHA.power)
}

/** Nearness q of a star of magnitude m: its share of the camera's motion (DEPTH). Brighter is nearer, at most DEPTH.maxNearness. */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Each layer's nearness range [faintest, brightest], from its magnitude band, for culling its cells against the camera. */
export const LAYER_NEARNESS = Object.fromEntries(
	SKY_LAYERS.map((layer) => {
		const [from, to] = LAYERS[layer].magnitude
		return [layer, [nearness(to), nearness(from)] as const]
	})
) as Record<SkyLayer, readonly [number, number]>

/**
 * Share of the catalog drawn for a viewport: all of it on narrow screens, 1 / NARROW_DENSITY_BOOST on wider ones,
 * thinned evenly past MAX_STARS. Thinning by each star's fixed key keeps the same stars from frame to frame.
 */
export function densityKeep(width: number, height: number): number {
	const narrow = width <= NARROW_MAX_WIDTH
	const keep = narrow ? 1 : 1 / NARROW_DENSITY_BOOST
	const expected = ((width * height) / 1e6) * STARS_PER_MP * (narrow ? NARROW_DENSITY_BOOST : 1)
	return expected > MAX_STARS ? (keep * MAX_STARS) / expected : keep
}

/** Knuth's Poisson sampler; fine for the small means used per cell. */
function poisson(random: () => number, mean: number): number {
	const limit = Math.exp(-mean)
	let count = 0
	let product = random()
	while (product > limit) {
		count++
		product *= random()
	}
	return count
}

/** Palette index for a star: a weighted B-V group from `pick` (0-1), then the group's tint for the star's brightness. */
function tintFor(pick: number, m: number): number {
	let rest = pick * GROUP_TOTAL
	let group: (typeof COLOR_GROUPS)[number] = COLOR_GROUPS[0]
	for (const candidate of COLOR_GROUPS) {
		group = candidate
		rest -= candidate.weight
		if (rest < 0) break
	}
	return m < TINT_BREAKS.bright ? group.bright : m < TINT_BREAKS.mid ? group.mid : group.faint
}

/** Index into STAR_SHAPES: brighter stars get wider cores and, at the top, a faint halo. */
function shapeFor(m: number): number {
	let shape = 0
	for (const edge of SHAPE_BREAKS) if (m < edge) shape++
	return shape
}

/**
 * The stars in one cell of a layer's infinite plane. Deterministic: the same cell always yields the same stars,
 * so the sky never reshuffles on resize, scroll or remount. Every star consumes the same number of random draws,
 * so retuning twinkle or tints never moves a star.
 */
export function cellStars(layer: SkyLayer, cx: number, cy: number): Star[] {
	const random = mulberry32(hashCell(cx, cy, SKY_SEED ^ LAYER_SALT[layer]))
	const config = LAYERS[layer]
	const [from, to] = config.magnitude
	const uFrom = cumulative(from)
	const uTo = cumulative(to)
	const count = poisson(random, STARS_PER_CELL[layer])
	const stars: Star[] = []
	for (let i = 0; i < count; i++) {
		const x = (cx + random()) * CELL_SIZE
		const y = (cy + random()) * CELL_SIZE
		const m = magnitudeAt(between(random, uFrom, uTo))
		const tintPick = random()
		const keep = random()
		const twinkles = random() < config.twinkleShare
		const w1 = 2 * Math.PI * between(random, config.twinkleHz[0], config.twinkleHz[1])
		const sigma = between(random, config.twinkleSigma[0], config.twinkleSigma[1])
		const p1 = random() * 2 * Math.PI
		const p2 = random() * 2 * Math.PI
		const p3 = random() * 2 * Math.PI
		stars.push({
			x,
			y,
			alpha: magnitudeAlpha(m),
			q: nearness(m),
			shape: shapeFor(m),
			tint: tintFor(tintPick, m),
			keep,
			delay: Math.min(EMERGENCE.maxDelay, Math.max(0, (m - EMERGENCE.from) * EMERGENCE.perMagnitude)),
			twinkle: twinkles
				? { sigma, w1, w2: w1 * TWINKLE_HARMONICS.ratio2, w3: w1 * TWINKLE_HARMONICS.ratio3, p1, p2, p3 }
				: null,
		})
	}
	return stars
}

/** Unit-variance twinkle noise at time t (s): smooth, non-repeating and different for every star. */
export function twinkleNoise(twinkle: Twinkle, t: number): number {
	const { weight2, weight3, norm } = TWINKLE_HARMONICS
	return (
		(Math.sin(twinkle.w1 * t + twinkle.p1) +
			weight2 * Math.sin(twinkle.w2 * t + twinkle.p2) +
			weight3 * Math.sin(twinkle.w3 * t + twinkle.p3)) /
		norm
	)
}
