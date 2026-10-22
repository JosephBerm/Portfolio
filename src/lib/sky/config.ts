/**
 * Tunables for the home page night sky, read by the sky worker. Lengths are CSS px unless a name says device px,
 * times are seconds unless a name ends in Ms or _MS, frequencies are Hz and alphas run 0-1.
 * Main-thread values (pixel-ratio caps, quiet selectors, the settle delay) live in src/components/sky/mountSky.ts,
 * so the page bundle never pulls in this module.
 */

import type { Rgb } from './protocol'

/** Depth layers, faintest first (also the drawing order). Each is a magnitude band of one star population. */
export const SKY_LAYERS = ['far', 'mid', 'near'] as const

/** One of the three depth layers. */
export type SkyLayer = (typeof SKY_LAYERS)[number]

/**
 * Catalog seed: every visitor sees the same reviewed sky. Changing it, or any value that shapes the catalog
 * (density, magnitudes, layers, cell size), recomposes the sky, so review it again.
 */
export const SKY_SEED = 0x5ca1ab1e

/** Stars per CSS megapixel on wide screens. A naked-eye sky holds about 210 per megapixel at an 80° field of view. */
export const STARS_PER_MP = 230

/** Most stars drawn in one frame (4K and ultrawide); denser screens thin evenly. */
export const MAX_STARS = 1400

/** Screens at most this wide count as narrow (phones): the whole catalog, fainter haze, shorter shooting stars. */
export const NARROW_MAX_WIDTH = 640

/** Narrow screens draw this many times the desktop density, so a phone sky isn't sparse behind the copy. */
export const NARROW_DENSITY_BOOST = 1.3

/** Side of the square generation cells. Stars depend only on their cell's hash, so resizing never moves one. */
export const CELL_SIZE = 256

/**
 * Apparent magnitudes: each fainter magnitude holds 10^slope (about 2.3x) more stars, so most stars are faint.
 * Slightly flatter than the real sky (about 0.48), so a laptop screen still gets a dozen or so bright stars.
 */
export const MAGNITUDE = { brightest: -0.5, faintest: 6, slope: 0.36 } as const

/**
 * Alpha by magnitude: `peak` for the brightest star, falling along a power curve to peak × (1 - drop) for the
 * faintest (near stars 0.62-0.78, mid 0.39-0.62, far 0.16-0.39). `peak` is also the ceiling twinkle can't pass.
 * Stars add their light ('lighter'), which lands brighter than the same alpha blended normally: at 0.78 the
 * warm-white tint is about 12.2:1 on navy and --color-white 11.8:1, level with the name heading (12.2:1), so no
 * star outshines the copy.
 */
export const STAR_ALPHA = { peak: 0.78, drop: 0.8, power: 1.75 } as const

/** Below this alpha a star isn't drawn this frame. */
export const MIN_STAR_ALPHA = 0.004

interface LayerConfig {
	/** Magnitude band [brightest, faintest). */
	magnitude: readonly [number, number]
	/** Share of the page scroll the layer follows, upward with the content; nearer layers follow more. */
	parallax: number
	/** Share of the layer's stars that twinkle. */
	twinkleShare: number
	/** Log-normal twinkle strength (sigma) range. */
	twinkleSigma: readonly [number, number]
	/** Base twinkle frequency range; two faster, weaker harmonics derive from it. */
	twinkleHz: readonly [number, number]
	/** Alpha a star keeps behind quiet copy (1 = unaffected). */
	quietKeep: number
	/** Alpha a star keeps on quiet copy itself (inside a text or control rect, before its padding): no dot in a word gap. */
	inkKeep: number
}

/**
 * The three depth layers: magnitude bands, scroll parallax, twinkle and how much light each keeps behind quiet copy.
 * On the copy itself the brightest far star, at a twinkle peak, adds at most 0.39 × 1.54 × 0.1 = 0.06 of white, so slate
 * body text keeps 4.5:1 there.
 */
export const LAYERS = {
	far: { magnitude: [4.5, 6], parallax: 0.02, twinkleShare: 0.1, twinkleSigma: [0.06, 0.12], twinkleHz: [0.08, 0.2], quietKeep: 1, inkKeep: 0.1 },
	mid: { magnitude: [2.5, 4.5], parallax: 0.04, twinkleShare: 0.35, twinkleSigma: [0.08, 0.16], twinkleHz: [0.1, 0.26], quietKeep: 0.6, inkKeep: 0 },
	near: { magnitude: [-0.5, 2.5], parallax: 0.07, twinkleShare: 1, twinkleSigma: [0.12, 0.22], twinkleHz: [0.12, 0.32], quietKeep: 0, inkKeep: 0 },
} as const satisfies Record<SkyLayer, LayerConfig>

/** Twinkle harmonics: incommensurate ratios and weights, so no star repeats a pattern or pulses in step with another. `norm` makes the sum unit-variance. */
export const TWINKLE_HARMONICS = { ratio2: 1.618, ratio3: 2.414, weight2: 0.7, weight3: 0.45, norm: 0.92 } as const

/** Twinkle grows toward the bottom of the screen, as near the horizon: sigma × (1 + gain × (y / height)²). */
export const TWINKLE_HORIZON_GAIN = 0.6

/**
 * Pale stellar tints (Mitchell Charity's blackbody table, pulled toward the theme white). Palette index 0 is the
 * theme's --color-white, read at mount; these are indices 1-7. Only bright stars use the stronger tints, because
 * faint starlight reads colorless.
 */
export const STAR_TINTS: readonly Rgb[] = [
	[214, 226, 255], // 1 cool white, A type
	[198, 212, 255], // 2 blue white, B type, mid brightness
	[182, 202, 255], // 3 pale blue, B type, bright only
	[255, 244, 234], // 4 warm white, F and G types
	[255, 230, 200], // 5 pale yellow, K type
	[255, 214, 170], // 6 pale orange, K type, bright only
	[255, 202, 146], // 7 light orange, M giant, bright only
]

/** B-V color groups (weights from the Yale Bright Star Catalogue) and the palette index each uses when faint, mid and bright. */
export const COLOR_GROUPS = [
	{ weight: 0.2, faint: 0, mid: 2, bright: 3 },
	{ weight: 0.26, faint: 0, mid: 1, bright: 1 },
	{ weight: 0.12, faint: 0, mid: 4, bright: 4 },
	{ weight: 0.23, faint: 4, mid: 4, bright: 5 },
	{ weight: 0.14, faint: 4, mid: 5, bright: 6 },
	{ weight: 0.05, faint: 4, mid: 5, bright: 7 },
] as const

/** A star uses its group's mid tint below magnitude `mid` and its bright tint below `bright`. */
export const TINT_BREAKS = { mid: 3.5, bright: 1.5 } as const

/** Point-spread shapes, faintest first: Gaussian core sigma and an optional faint halo (sigma, peak relative to the core). */
export const STAR_SHAPES = [
	{ core: 0.36, halo: 0, haloPeak: 0 },
	{ core: 0.42, halo: 0, haloPeak: 0 },
	{ core: 0.5, halo: 0, haloPeak: 0 },
	{ core: 0.6, halo: 0, haloPeak: 0 },
	{ core: 0.72, halo: 2.2, haloPeak: 0.07 },
	{ core: 0.85, halo: 2.8, haloPeak: 0.12 },
] as const

/** Magnitudes where the next, brighter shape starts. */
export const SHAPE_BREAKS = [4.5, 3.5, 2.5, 1.5, 0.5] as const

/** Smallest core sigma in device px: smaller points alias into squares and shimmer when they move. */
export const MIN_CORE_SIGMA_DEVICE_PX = 0.7

/**
 * Behind quiet copy: padding around each rect, the distance over which the effect fades out, and the seconds a new
 * measurement takes to take effect (the copy appearing, an entrance settling, a resize), so stars and shooting stars
 * near the copy fade instead of changing in one frame.
 */
export const QUIET = { padding: 32, feather: 40, ease: 0.6 } as const

/**
 * Scroll narrative: the full sky in the hero, a dimmer and still sky while reading, and a bookend near the end of
 * the page. Levels blend continuously with scroll, so the narrative needs no clock of its own. Star levels are per
 * layer: while reading the brighter layers dim most, so no star behind body copy reads as punctuation.
 */
export const SCENE = {
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8 },
	/** Viewport heights scrolled where the hero starts and finishes giving way to reading. */
	heroFadeFrom: 0.5,
	heroFadeTo: 1.3,
	/** Viewport heights left to scroll where the end bookend starts and is complete. */
	endFadeFrom: 0.85,
	endFadeTo: 0.15,
	/** Shooting stars only while no more than this many viewport heights are scrolled. */
	heroMeteorMaxScroll: 0.4,
} as const

/**
 * Dusk, counted from the moment the loader starts lifting: a star of magnitude m starts fading in after
 * (m - from) × perMagnitude seconds (at most maxDelay) and takes `fade` seconds, so the brightest come out first.
 * The haze fades in over the `haze` window.
 */
export const EMERGENCE = { from: 1, perMagnitude: 0.26, maxDelay: 1.4, fade: 0.7, haze: [0.5, 2.3] } as const

interface HazePool {
	/** Center as viewport fractions. */
	x: number
	y: number
	/** Radius as a fraction of the longer viewport side (the Gaussian's sigma is half of it). */
	radius: number
	color: 'card2' | 'card3'
	/** Alpha of the token color added over navy at the center. */
	peak: number
}

/**
 * Haze: soft light in the card-2 and card-3 hues (the gradient cards and the /links orbs), in the empty upper right
 * with a fainter counter-pool at the lower left. Behind the hero copy it stays well under --color-light-navy, so
 * slate body text keeps more than 5:1.
 */
export const HAZE_POOLS = [
	{ x: 0.8, y: 0.2, radius: 0.42, color: 'card2', peak: 0.05 },
	{ x: 0.9, y: 0.06, radius: 0.26, color: 'card3', peak: 0.06 },
	{ x: 0.04, y: 1.02, radius: 0.36, color: 'card3', peak: 0.03 },
] as const satisfies readonly HazePool[]

/** No haze under the glass navbar (70-100px tall): it eases in slowly between these heights, so it reads as a soft glow with no seam at the navbar's edge. */
export const HAZE_TOP_FADE = [70, 420] as const

/** Narrow screens: the hero copy fills the screen, so the haze is fainter. */
export const HAZE_NARROW_SCALE = 0.6

/** Largest haze buffer (px); the haze is smooth, so it is computed at CSS resolution or less and scaled up. */
export const HAZE_MAX_PIXELS = 2_100_000

/** Delay after the last resize before the haze is rebuilt (ms); until then the old one is stretched. */
export const HAZE_REBUILD_MS = 200

/** No contrast preference: stars, haze and shooting stars as designed. `meteorInk` scales METEOR_VEIL.inkKeep. */
export const CONTRAST_NORMAL = { stars: 1, haze: 1, meteorInk: 1 } as const

/** prefers-contrast: more drops the haze, dims the stars and leaves no shooting-star light on the copy itself. */
export const CONTRAST_MORE = { stars: 0.7, haze: 0, meteorInk: 0 } as const

/** Frame pacing. Twinkle is slow, so 15 fps reads smooth; shooting stars and scrolling draw on every animation frame. */
export const FRAME = {
	twinkleFps: 15,
	/** Twinkle rate after the adaptive step-down. */
	slowTwinkleFps: 10,
	/** Fades (dusk, scrolling under reduced motion). */
	fadeFps: 30,
	/** Scrolling counts as active this long after the last scroll message. */
	scrollSettleMs: 180,
	/** Shooting stars wait this long after scrolling stops. */
	meteorScrollQuietMs: 1200,
	/** With no scroll for this long the twinkle eases out, shooting stars pause and the worker sleeps until the next scroll. */
	idleSleepMs: 90_000,
	/** Twinkle fade out and back in around the idle sleep. */
	idleFadeMs: 4000,
} as const

/**
 * Adaptive quality: after `slowFrames` more slow frames (JS over `slowFrameMs`) than fast ones, draw `thinning` of the
 * stars and twinkle slower; a second step drops to CSS resolution. A software-rasterized canvas, whose cost lands after
 * the draw calls return where frame timing can't see it, is found at start-up instead: one full frame rasterized off
 * screen in more than `rasterMsPerMp` per device megapixel (and more than `rasterMinMs`) starts at the second step.
 */
export const ADAPT = { slowFrameMs: 4, slowFrames: 30, thinning: 0.8, rasterMsPerMp: 1, rasterMinMs: 4 } as const

/**
 * Shooting stars: rare and small, falling from one radiant beyond the top-right corner. Each lights up and peaks in
 * clear sky and may burn out behind quiet copy, veiled (METEOR_VEIL).
 */
export const METEOR = {
	/** Seconds after the page reveal before the first one, once the hero entrance and side rails have settled. */
	firstDelay: [4.5, 7],
	/** Later gaps (s): at least `gapMin` plus an exponential extra with mean `gapMeanExtra`, at most `gapMax` (never more than two a minute). */
	gapMin: 30,
	gapMeanExtra: 12,
	gapMax: 75,
	/** After `slowAfter` seconds on the page gaps stretch by `slowFactor`, so the sky never turns into a screensaver. */
	slowAfter: 180,
	slowFactor: 1.5,
	/** Retry delay (s) when no path fits around the copy, and failed plans before waiting for a new layout. */
	retry: [5, 9],
	maxFailedPlans: 3,
	/** Seconds until the next check when a due shooting star is held back (scrolling, idle, past the hero, the narrow-screen limit). */
	recheck: 1,
	/** Candidate paths tried per radiant for long flights, and again for the fallback. */
	attempts: 160,
	/** Fresh radiants tried per launch when the current one leaves no path; narrow screens try one, so theirs stay rare. */
	radiantTries: 3,
	/** Earliest launch after the tab becomes visible again (s). */
	afterReturn: 3,
	/** Path angle below horizontal (degrees), traveling right to left. */
	angle: [18, 42],
	/** Radiant as multiples of the viewport (x beyond the right edge, y above the top) and per-meteor jitter (degrees). */
	radiantX: [1.5, 2.2],
	radiantY: [0.15, 0.45],
	radiantJitter: 4,
	/** Start area as viewport fractions; y also stays below `top`. */
	spawnX: [0.45, 0.985],
	spawnY: [0, 0.5],
	/** Paths end above this share of the height, clear of the fixed side rails in the bottom corners. */
	maxEndY: 0.72,
	/** Clearance below the top edge (under the 100px navbar) and inside the screen edges. */
	top: 110,
	edgeMargin: 12,
	/**
	 * Normal flights: duration (s), long enough to follow by eye, and shorter ones where no long flight fits (a short
	 * laptop window, a phone held sideways); nominal speed as a share of the longer viewport side per second, clamped
	 * (px/s), and its per-flight spread.
	 */
	duration: [0.9, 1.4],
	fallbackDuration: [0.65, 0.9],
	speedShare: 0.2,
	speed: [240, 460],
	speedJitter: [0.88, 1.12],
	/** Path length range (px); the longest is also at most `pathShare` of the longer viewport side. */
	path: [160, 640],
	pathShare: 0.36,
	/** Narrow screens: slower flights and their fallback, at least `narrowMinPath` px and at most `narrowMaxPathShare` of the width, `narrowLimit` per visit. */
	narrowDuration: [0.75, 1.05],
	narrowFallbackDuration: [0.6, 0.8],
	narrowSpeed: [200, 300],
	narrowMinPath: 110,
	narrowMaxPathShare: 0.55,
	narrowLimit: 2,
	/** Peak brightness of normal flights; fireballs peak at 1. */
	peak: [0.75, 0.9],
	/** Atmospheric drag: by the end of the flight the speed falls to 1 - 3 × drag of the entry speed (0.06: 82%). */
	drag: 0.06,
	/** Wake afterglow (s): each point of the path dims to 1/e this long after the head passes; drawn for `wakeSpan` of these. */
	wake: 0.13,
	wakeSpan: 3,
	/** Fireballs (rare, long flights only): longer, slower and brighter, with more drag, a longer wake and a warm tint. */
	fireballChance: 0.08,
	fireballDuration: [1.8, 2.5],
	fireballSpeedScale: 0.6,
	fireballDrag: 0.15,
	fireballWake: 0.18,
	/** A late flare on some flights. */
	flareChance: 0.12,
	/** A faint persistent train behind some fireballs and flights at least `trainSpeedShare` of the nominal speed (the faster half). */
	trainChance: 0.15,
	trainSpeedShare: 1,
} as const

/**
 * A shooting star passing behind quiet copy, which it may do only while burning out. Within QUIET's padding and
 * feather it keeps `quietKeep` of its light at the padded edge and `inkKeep` on the copy itself, measured at every
 * point it draws; its glow and soft pass are halos and keep the square, so no light spills onto the letters. A path is
 * planned only if the head stays in clear sky through `clearUntil` of the flight (so at least 77% of its light is drawn
 * there), reaches the copy itself no earlier than `inkFrom` and never brightens again once dimmed (`rise` of slack, in
 * light-curve units), checked at `samples` points; fireballs, flares and trains stay in clear sky. On the copy it then
 * adds at most 0.9 × 0.585 × (2 × 0.05 + 0.52 × 0.05²) ≈ 0.053 of white, so slate body text keeps 4.5:1.
 */
export const METEOR_VEIL = { quietKeep: 0.3, inkKeep: 0.05, clearUntil: 0.65, inkFrom: 0.75, rise: 0.01, samples: 64 } as const

/**
 * Light curve over flight progress p: sin(π × p^skew)^sharpness peaks near 45% (a quick ignition, a gentle burn-out); a
 * flare adds a late spike, and from `flareGlowFrom` a flaring head's glow is `flareGlow` times brighter. A flare is
 * planned only if the head stays in clear sky until `flareClearWidths` flare widths (`flareWidth`, in progress units)
 * past `flareAt`, so through p = 0.93.
 */
export const METEOR_LIGHT = { skew: 0.868, sharpness: 1.2, flare: 0.55, flareAt: 0.86, flareWidth: 0.035, flareClearWidths: 2, flareGlow: 1.3, flareGlowFrom: 0.8 } as const

/**
 * How a shooting star is drawn: head core and glow sigma, glow alpha (bigger for fireballs); the wake tapers from
 * the head width to the tail width, with a soft pass `softWidth` times wider at `softAlpha`. From the head the wake
 * cools from white to its tint over `coolBy` of its length, and its far half thins to `tailKeep` at the end. Normal
 * wakes cool to --color-green mixed `mintToWhite` toward --color-white; fireballs warm to palette index `fireballTint`
 * (pale yellow).
 */
export const METEOR_LOOK = {
	core: 0.8,
	glow: 3,
	glowAlpha: 0.3,
	fireballGlow: 1.6,
	wakeWidth: [1.7, 0.35],
	softWidth: 3.2,
	softAlpha: 0.22,
	wakeStops: 9,
	coolBy: 0.625,
	tailKeep: 0.7,
	mintToWhite: 0.55,
	fireballTint: 5,
} as const

/**
 * Persistent train: a faint mint line along the path that starts to brighten `onset` of the way through the flight
 * (time constant `rise`), lingers and fades (`decay`), widening from `width[0]` to `width[1]` over `widen` seconds after
 * the flight. Gone `life` seconds after the flight, easing out over the last `fadeOut` seconds, so a fireball and its
 * train last under 5 s (WCAG 2.2.2).
 */
export const TRAIN = { peak: 0.12, onset: 0.3, rise: 0.15, decay: 1.3, life: 2.4, fadeOut: 0.8, width: [1, 3], widen: 2, mintToWhite: 0.45 } as const
