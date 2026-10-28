/**
 * Tunables for the home page night sky, read by the sky worker. Lengths are CSS px unless a name says device px,
 * times are seconds unless a name ends in Ms or _MS, frequencies are Hz and alphas run 0-1.
 * Main-thread values (pixel-ratio caps, quiet selectors, the settle delay) live in src/components/sky/mountSky.ts, and
 * the WCAG thresholds in src/lib/sky/color.ts, so the page bundle never pulls in this module.
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
 * No layer keeps light on the copy itself (`inkKeep` 0), so no star adds to the white a shooting star may put there
 * (INK_BUDGET). Mid and near must keep none: STAR_INK_PEAK covers far stars only.
 */
export const LAYERS = {
	far: { magnitude: [4.5, 6], parallax: 0.02, twinkleShare: 0.1, twinkleSigma: [0.06, 0.12], twinkleHz: [0.08, 0.2], quietKeep: 1, inkKeep: 0 },
	mid: { magnitude: [2.5, 4.5], parallax: 0.04, twinkleShare: 0.35, twinkleSigma: [0.08, 0.16], twinkleHz: [0.1, 0.26], quietKeep: 0.6, inkKeep: 0 },
	near: { magnitude: [-0.5, 2.5], parallax: 0.07, twinkleShare: 1, twinkleSigma: [0.12, 0.22], twinkleHz: [0.12, 0.32], quietKeep: 0, inkKeep: 0 },
} as const satisfies Record<SkyLayer, LayerConfig>

/**
 * The most white the brightest far star adds on the copy itself, at a twinkle peak: its alpha (0.386) times the most
 * twinkle lifts it (1.538), 0.593 rounded up to 0.6, times `LAYERS.far.inkKeep`. It is 0 while far stars keep nothing
 * on the copy. INK_BUDGET leaves room for it, because a far star and a shooting star can share one pixel: at an
 * `inkKeep` of 0.1 it is 0.06 and takes about 0.054 off every budget under the ceiling (all of body text's, about a
 * third of the tagline's and the rails').
 */
export const STAR_INK_PEAK = 0.6 * LAYERS.far.inkKeep

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
 * Sub-pixel positions per device pixel and axis in the star atlas (4, like Skia's glyph cache): a moving star is drawn
 * from the sprite pre-rendered at its nearest quarter-pixel phase, placed at a whole device pixel, so it glides without
 * blurring or pulsing and lands within 1/8 px of its true place. Phase 0 is the resting sprite; 1 rounds every star to
 * whole pixels.
 */
export const STAR_PHASES = 4

/**
 * Behind quiet copy: padding around each rect, the distance over which the effect fades out, and the seconds a new
 * measurement takes to take effect (the copy appearing, an entrance settling, a resize), so stars near the copy fade
 * instead of changing in one frame (a shooting star follows transientQuietFactor, in scene.ts).
 */
export const QUIET = { padding: 32, feather: 40, ease: 0.6 } as const

/**
 * How far quiet copy dims things: padding plus feather from a measured text rect (px). Past it every quiet factor is 1.
 * From a padded zone, which is what the zone helpers in scene.ts take, it is QUIET.feather alone.
 */
export const QUIET_REACH = QUIET.padding + QUIET.feather

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
 * slate body text keeps more than 5:1. INK_BUDGET.hazeReserve holds back what it adds under the copy: re-measure that
 * and raise the reserve before brightening a pool, HAZE_NARROW_SCALE or HAZE_TOP_FADE.
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

/** Delay after the last resize before the haze is rebuilt, and between checks while the quiet zones still ease (ms); until then the old one is stretched. */
export const HAZE_REBUILD_MS = 200

/** No contrast preference: stars, haze and shooting stars as designed. `meteorInk` scales the INK_BUDGET of every rect. */
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
 * clear sky and may glide on behind quiet copy, veiled to what the copy can take (METEOR_VEIL, INK_BUDGET).
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
	/** Candidate paths tried per radiant for long flights, and again for the fallback; an aimed launch (METEOR_PASS) tries up to as many again. */
	attempts: 160,
	/** Fresh radiants tried per launch when the current one yields no long flight, before any shorter one; narrow screens try one, so theirs stay rare. */
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
 * White light (0-1 of --color-white, added over navy) the sky may put on the copy itself, per quiet rect. WCAG 2.2 AA
 * (1.4.3) asks 4.5:1 of text and 3:1 of large text, and the main thread measures what each rect's own color and size can
 * take: its `headroom` (slate body text 0.08, the 75 px tagline 0.19, the name 0.40, green text 0.33, the rails 0.19). The
 * budget is that headroom less what may already be added there (`hazeReserve` for the haze, up to 0.023 of white under the
 * tagline at 1366x768, and STAR_INK_PEAK for the brightest far star on the same pixel), times `safety` for rounding and
 * resampling, and at most `ceiling`, so a shooting star is a glimmer behind any copy, never a streak that competes with
 * it. That leaves slate body text about 0.05, the tagline and the rails about 0.15 and the name and green text the ceiling.
 */
export const INK_BUDGET = { ceiling: 0.2, safety: 0.9, hazeReserve: 0.025 } as const

/**
 * A shooting star near quiet copy. A path is planned so that the head stays in clear sky through `clearUntil` of the
 * flight (the light peaks at 0.45, so it lights up and peaks there) and never brightens again once dimmed (`rise` of
 * slack, in light-curve units), checked at `samples` points; fireballs, flares and trains stay in clear sky. It does not
 * fade out at the edge of the copy: where the veil dims a head that adds `edgeBright` or more of white (0-1 of
 * --color-white, unveiled) to `edgeKept` (0-1) or less of its light, the head must then show on the copy (METEOR_PASS
 * `glimmer` for `dwell`), or the path is dropped, so a bright star never dissolves just short of the text. Within QUIET's
 * padding and feather it keeps `quietKeep` of its light at the padded edge and, on the copy itself, the share that fits
 * the copy's INK_BUDGET, measured at every point it draws and the same for all of it, so it dims as a whole, keeps its
 * shape and glides on behind the copy at a steady, faint level until its own light dies. Copy with no budget left, or
 * prefers-contrast: more (which scales every budget by 0), gets nothing on it, so a bright head stays clear of it.
 */
export const METEOR_VEIL = { quietKeep: 0.3, clearUntil: 0.47, rise: 0.01, samples: 64, edgeBright: 0.3, edgeKept: 0.5 } as const

/**
 * Passes behind copy: `share` of the launches whose first fit is a plain flight (not a fireball, flare or train, which
 * need clear sky, so the aim never thins them) are traded for a flight whose head spends at least `dwell` of the flight
 * (progress units, about 0.1 s) inside a text rect adding at least `visible` of white there; where no such flight fits,
 * the first fit flies. `visible` 0.12 (R+G+B 87 of 726, +28 levels a channel) is where a streak starts to read on a dark
 * sky: the budgets of the tagline, the name and green text allow it and slate body text's does not (INK_BUDGET), so the
 * aim never counts a pass behind a paragraph. `glimmer` 0.041 of white (R+G+B 30 of 726, +10 levels a channel) is the
 * faintest light that still shows on the copy; METEOR_VEIL uses it.
 */
export const METEOR_PASS = { share: 0.4, visible: 0.12, dwell: 0.1, glimmer: 0.041 } as const

/**
 * A moving transient launched with the page at one scroll offset is dimmed once the page has scrolled `from` px from
 * there and gone at `to` px: the copy under it is no longer the copy it was planned around (the veil knows only quiet
 * copy). Position-driven, so even a jump of a screen takes it away at once (see scrollKept).
 */
export const SCROLL_CANCEL = { from: 12, to: 24 } as const

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
