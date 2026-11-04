/**
 * Tunables for the home page night sky, read by the sky worker. Lengths are CSS px unless a name says device px,
 * times are seconds unless a name ends in Ms or _MS, frequencies are Hz and alphas run 0-1.
 * Main-thread values (pixel-ratio caps, quiet selectors, the settle delay) live in src/components/sky/mountSky.ts, and
 * the WCAG thresholds in src/lib/sky/color.ts, so the page bundle never pulls in this module.
 */

import type { ColorStops } from './color'
import type { Rgb } from './protocol'

/** Depth layers, faintest first (also the drawing order). Each is a magnitude band of one star population. */
export const SKY_LAYERS = ['far', 'mid', 'near'] as const

/** One of the three depth layers. */
export type SkyLayer = (typeof SKY_LAYERS)[number]

/**
 * Catalog seed: every visitor sees the same reviewed sky. Changing it, or any value that shapes the catalog
 * (density, magnitudes, layers, cell size, the planet), recomposes the sky, so review it again.
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

/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen (CAMERA): 1 at
 * magnitude `reference`, the near band's mean. Identical lamps would give q = 10^(-0.2 (m - reference)), the
 * inverse-square law; `compression` keeps about 70% of that depth range, as STAR_ALPHA keeps a 400:1 flux range as 5:1,
 * so the faintest stars still move (q 0.24) and the brightest never race (at most `maxNearness`, from magnitude 0.11
 * up). The bands' mean shares of the scroll come out at 0.0205, 0.0350 and 0.0717 (far, mid, near), within 12.5% of the
 * reviewed 0.02, 0.04 and 0.07. No random draw depends on it, so retuning it never moves a star while the camera rests.
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const

/**
 * The one camera the sky is seen through, in CSS px for a star of nearness 1: every star appears at its place on the
 * sky minus its nearness (DEPTH) times the camera, whatever moves it (the scroll, the drift, a pointer lean), so nearer
 * stars always move more and the depth cues never disagree. Scrolling moves the camera `scrollParallax` of the scroll,
 * the near band's reviewed parallax, through a critically damped spring of `scrollOmega` rad/s: when the page stops,
 * the stars glide on and settle (95% in 0.47 s, 99% in 0.66 s, never overshooting after a scroll that moves one way;
 * Motion's spring with bounce 0 and visualDuration 0.52 s). Scrolling at 1000 px/s, the near stars trail by about 14
 * px. The spring never trails the scroll by more than `maxLag` viewport heights, held there as a spring trailing
 * steadily at that distance, so a fling or a smooth-scrolled jump (the navbar's section links, and Home and End in most
 * desktop browsers) leaves the brightest stars at most about 25 px to glide on a 900 px screen. A jump of more than
 * `snapViewports` viewport heights in one step (an instant scrollTo, say) snaps instead of sweeping the sky; 0 always
 * snaps, which follows the scroll exactly. A spring with less than `restPx` CSS px of motion left (at nearness 1)
 * settles on its target and stops asking for frames.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, maxLag: 0.25, snapViewports: 1, restPx: 0.01 } as const

/** One circle of the drift. */
interface Epicycle {
	/** Frequency as a multiple of the main circle's; negative turns the other way. */
	ratio: number
	/** Speed as a share of DRIFT.speed. */
	share: number
	/** Starting angle (radians). */
	phase: number
}

interface DriftConfig {
	speed: number
	period: number
	epicycles: readonly Epicycle[]
	narrowRate: number
	ease: number
	maxStep: number
}

/**
 * The floating drift, in CSS px for a star of nearness 1: epicycles, a main circle turning once every `period` seconds
 * with smaller circles riding on it at irrational frequency ratios (the golden ratio and 1 + √2, to three decimals). Each
 * circle moves at share × `speed`, so the speed stays within `speed` × 0.58 to 1.42 (never stops, never races), the
 * heading turns 2° a second on average and at most 4.3°, and the path repeats only after 25 hours. On a laptop (about 1.3
 * arcmin per CSS px) the near stars float at about 4 arcmin/s and the faint ones at about 1, three times and once the
 * slowest motion people notice, so the faint majority reads as still. These phases start the first minute drifting
 * right, within 30° of level for 53 of its 60 seconds; the path stays within 68.4 s × `speed` of its start (205 px at
 * nearness 1), so offsets stay small and nothing wraps. The path is a pure function of a drift clock that runs at the
 * scene's drift × presence × the motion level, `narrowRate` on narrow screens (their CSS px look about 1.35 times
 * bigger), easing in over `ease` seconds from the dusk, so the stars come out already moving; one step advances the clock
 * by at most `maxStep` seconds, so a stalled frame or a returning tab never jumps the sky.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.7 },
		{ ratio: -1.618, share: 0.3, phase: 0 },
		{ ratio: 2.414, share: 0.12, phase: 2.09 },
	],
	narrowRate: 0.6,
	ease: 3,
	maxStep: 0.1,
} as const satisfies DriftConfig

/**
 * Leaning toward the pointer (mice and pens on hover-capable screens, full motion, the whole page): the camera moves
 * up to `reach` CSS px (at nearness 1) toward a pointer at the viewport's edge, through critically damped springs of
 * `omega` rad/s (95% in 1.2 s), so the stars slide away from it, the brightest farthest (19 px) and the faint majority
 * about 3.5 px: the same law as scrolling, so the depth order never changes. Like the drift, it keeps still on a
 * software-rasterized canvas too slow for PACING.minFps. iOS's own motion effects use about ±10 points; 7 is a calmer
 * setting.
 */
export const LEAN = { reach: 12, omega: 4 } as const

interface LayerConfig {
	/** Magnitude band [brightest, faintest). */
	magnitude: readonly [number, number]
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
 * The three depth layers: magnitude bands, twinkle and how much light each keeps behind quiet copy. How far each star
 * moves comes from its magnitude (DEPTH). No layer keeps light on the copy itself (`inkKeep` 0), so no star adds to the
 * white a shooting star may put there (INK_BUDGET). Mid and near must keep none: STAR_INK_PEAK covers far stars only.
 */
export const LAYERS = {
	far: { magnitude: [4.5, 6], twinkleShare: 0.1, twinkleSigma: [0.06, 0.12], twinkleHz: [0.08, 0.2], quietKeep: 1, inkKeep: 0 },
	mid: { magnitude: [2.5, 4.5], twinkleShare: 0.35, twinkleSigma: [0.08, 0.16], twinkleHz: [0.1, 0.26], quietKeep: 0.6, inkKeep: 0 },
	near: { magnitude: [-0.5, 2.5], twinkleShare: 1, twinkleSigma: [0.12, 0.22], twinkleHz: [0.12, 0.32], quietKeep: 0, inkKeep: 0 },
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

/**
 * Point-spread shapes, faintest first: Gaussian core sigma and an optional faint halo (sigma, peak relative to the core).
 * A star's magnitude picks one of the first six (SHAPE_BREAKS); the last, with a core a little wider than any star's, is
 * the planet's.
 */
export const STAR_SHAPES = [
	{ core: 0.36, halo: 0, haloPeak: 0 },
	{ core: 0.42, halo: 0, haloPeak: 0 },
	{ core: 0.5, halo: 0, haloPeak: 0 },
	{ core: 0.6, halo: 0, haloPeak: 0 },
	{ core: 0.72, halo: 2.2, haloPeak: 0.07 },
	{ core: 0.85, halo: 2.8, haloPeak: 0.12 },
	{ core: 1.05, halo: 2.8, haloPeak: 0.12 },
] as const

/** Magnitudes where the next, brighter shape starts. */
export const SHAPE_BREAKS = [4.5, 3.5, 2.5, 1.5, 0.5] as const

/**
 * The planet: one steady, warm point in the near layer, as bright as a star can be (the alpha and the nearness of
 * magnitude `magnitude`), with no twinkle and a core a little wider than any star's (`shape`) in a pale yellow (`tint`).
 * In every other way it is a star of the catalog: it sits at one place (`x`, `y`: CSS px on the near layer's plane, the
 * viewport's top-left at scroll 0, so the same on every screen), moves with the camera by its nearness like the
 * brightest stars, comes out first with the dusk, is never thinned, is drawn under reduced motion and gives way to quiet
 * copy through the near layer's keeps. The place is empty sky: the hero's upper right on laptop windows, above its copy
 * on wider ones. At rest it lies 86 px (a 1280 x 720 window) to 298 px (2560 x 1440) clear of every quiet zone's reach,
 * and through the first minute, carried by the drift with the lean at its edge, it stays clear of that reach on every
 * window from 1280 px wide up and on screen on those from 1366 px (on a 1280 px one it slips past the right edge just
 * after the minute for about 12 s, or from about 55 s for about half a minute with the pointer at the far left). Later
 * the drift can carry it near the copy, where it fades out and back like any near star. On a 1024 px window it lies
 * near the right edge and the drift soon carries it off the screen; a phone's copy fills the screen and the planet lies
 * beyond its edge.
 */
export const PLANET = { x: 1000, y: 170, magnitude: MAGNITUDE.brightest, tint: 5, shape: 6 } as const

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
 * Scroll narrative: the full sky in the hero, a dimmer and calmer sky while reading (no twinkle, the drift at about a
 * third), and a bookend near the end of the page. Levels blend continuously with scroll, so the narrative needs no
 * clock of its own. Star levels are per layer: while reading the brighter layers dim most, so no star behind body copy
 * reads as punctuation. `drift` scales the drift clock's rate (DRIFT); `lean` scales the pointer lean (LEAN), which
 * every scene has in full.
 */
export const SCENE = {
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1, lean: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35, lean: 1 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8, lean: 1 },
	/** Viewport heights scrolled where the hero starts and finishes giving way to reading. */
	heroFadeFrom: 0.5,
	heroFadeTo: 1.3,
	/** Viewport heights left to scroll where the end bookend starts and is complete. */
	endFadeFrom: 0.85,
	endFadeTo: 0.15,
	/** Shooting stars and satellites launch over the hero only while no more than this many viewport heights are scrolled. */
	heroLaunchMaxScroll: 0.4,
	/** Farewell meteors launch at the end bookend once its level (0 to 1) reaches this. */
	endLaunchLevel: 0.9,
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

/**
 * Frame pacing. Twinkle is slow, so 15 fps reads smooth. Anything that moves draws on animation frames paced by PACING;
 * these timers serve a sky that only changes brightness.
 */
export const FRAME = {
	twinkleFps: 15,
	/** Twinkle rate after the adaptive step-down. */
	slowTwinkleFps: 10,
	/** Fades (dusk, scrolling under reduced motion, the motion level easing, the stars a quality step thins out, the comet fading in or out). */
	fadeFps: 30,
	/** Scrolling counts as active this long after the last scroll message. */
	scrollSettleMs: 180,
	/**
	 * With no input (scroll, pointer, keys, focus, Play, a return to the tab) for this long ambient motion eases out,
	 * nothing new launches and the worker sleeps until the visitor is back.
	 */
	idleSleepMs: 90_000,
	/** Ambient motion fades out and back in around the idle sleep. */
	idleFadeMs: 4000,
	/**
	 * Seconds over which motion stops or starts again (the pause control, a reduced-motion switch): ambient motion eases
	 * out or in, so nothing stops or starts in one frame, and even the brightest star at its peak speed moves only about
	 * 1 px after a pause.
	 */
	motionEase: 0.3,
} as const

/**
 * Frame pacing for moving stars (FRAME keeps the timers for a sky that only changes brightness). A moving star steps at
 * most `stepDevicePx` per drawn frame (two quarter-pixel phases, under a third of the smallest star's width) where the
 * display's refresh rate allows it, and never draws below `minFps`. Motion draws on animation frames divided by a whole
 * number, so every drawn frame stays up for the same number of display refreshes, and a need may fall short of its rate by
 * a factor of `refreshSlack`, because a worker's 0.1 ms timestamps read a 60 Hz display as 59.88 Hz, which must divide as
 * 60 does; a lower need must last `slowDownAfter` seconds before the clock slows down. The drift and the pointer lean draw
 * at most `narrowMaxFps` on narrow screens (phone GPUs pay most for a full-screen frame) and `slowMaxFps` after the first
 * adaptive step; a software-rasterized canvas may spend `softwareShare` of a core on them and keeps a still sky below `minFps`.
 * The refresh interval is the median of the last `refreshSamples` frame intervals; a median within `unalignedToleranceMs`
 * of `unalignedIntervalMs` is WebKit's fixed 15 ms worker clock, not the display, so while something moves the main
 * thread relays the page's own animation frames to the worker, which divides them like a display's. A requested
 * animation frame that hasn't come `watchdogMs` after the request (while visible) is served by a timer; after
 * `watchdogStrikes` misses in a row, frames come from a `fallbackFps` timer, which asks for one animation frame every
 * `reprobeMs` and goes back to them when one arrives (a GPU restart or a restored context); the strikes also reset when
 * the context is restored or the tab is shown. Relayed frames fall back the same way and go back to the next one that
 * comes. A relayed frame handled within `relayQueuedMs` of the worker finishing the last one waited in its queue while
 * that one ran over a refresh, and draws nothing, so a worker slower than the page never falls behind it.
 */
export const PACING = {
	stepDevicePx: 0.5,
	minFps: 20,
	slowDownAfter: 0.5,
	refreshSlack: 1.01,
	narrowMaxFps: 30,
	slowMaxFps: 30,
	softwareShare: 0.08,
	refreshSamples: 16,
	unalignedIntervalMs: 15,
	unalignedToleranceMs: 0.4,
	watchdogMs: 250,
	watchdogStrikes: 3,
	fallbackFps: 60,
	reprobeMs: 5000,
	relayQueuedMs: 1,
} as const

/**
 * Adaptive quality: after `slowFrames` more slow frames (JS over `slowFrameMs`) than fast ones, draw `thinning` of the
 * stars, twinkle slower and cap the drift and the pointer lean at PACING.slowMaxFps; the stars step 1 thins out fade
 * over `thinFade` seconds, since a moving sky that lost a fifth of its stars in one frame would read as a glitch. A
 * second step drops to CSS resolution. A software-rasterized canvas, whose cost lands after the draw calls return where
 * frame timing can't see it, is found at start-up instead: one full frame rasterized off screen in more than
 * `rasterMsPerMp` per device megapixel (and more than `rasterMinMs`) starts at the second step.
 */
export const ADAPT = { slowFrameMs: 4, slowFrames: 30, thinning: 0.8, thinFade: 1, rasterMsPerMp: 1, rasterMinMs: 4 } as const

/**
 * Every short-lived sky event (shooting stars, satellites): at most `maxLife` seconds from first light to last, wake, train
 * and fades included (WCAG 2.2.2's 5 s, per animation); onsets at least `minOnsetGap` seconds apart, since a motion onset
 * draws the eye; one of each kind at a time; on narrow screens at most `narrowLimit` per visit. Only one transient at a
 * time may plan its light onto quiet copy (it holds the ink lease: each rect's INK_BUDGET counts one transient plus the
 * haze), and none may do so until `crossingCooldown` seconds after the page reveal and after the last lease began, so copy
 * crossings stay rare: the cooldown is set to the shortest multiple of 5 s that keeps the crossings a minute over a
 * visit's first two minutes at or below what shooting stars 30 to 75 s apart made on every captured hero layout,
 * measured with the kinds of shooting star that fly in clear sky at their odds (each flies in place of an ordinary launch,
 * so fewer launches cross the copy) and without satellites, which only make crossings fewer, so it holds whether or not
 * they fly. A pause fades every transient out over `cancelFade` seconds, through scrollKept, which also takes it away as
 * the page scrolls from its launch (SCROLL_CANCEL). A plan that finds no room waits `retry` seconds; after `maxFailedPlans`
 * in a row the kind waits for a new layout. A held launch looks again after `recheck` seconds; a launch waits `scrollQuiet`
 * seconds after scrolling stops, and after a return (tab, idle, full motion) nothing launches for `afterReturn` seconds.
 * From `longVisit.from` seconds after the reveal every gap stretches by 1 + (t - from) / `longVisit.scale`, at most
 * `longVisit.max` times (half the rate at 6 minutes, a third at 10), so a long visit never turns into a screensaver.
 */
export const TRANSIENTS = {
	maxLife: 5,
	minOnsetGap: 3,
	narrowLimit: 6,
	crossingCooldown: 30,
	cancelFade: 0.2,
	retry: [5, 9],
	maxFailedPlans: 3,
	recheck: 1,
	scrollQuiet: 1.2,
	afterReturn: 3,
	longVisit: { from: 120, scale: 240, max: 3 },
} as const

/**
 * The screen as a window on the sky, for the geometry of the transients crossing it: its longer side spans `fov`
 * degrees and its center looks `elevation` degrees above a horizon just below the screen, so a 16:10 window spans about
 * 18° at its bottom corners to 60° at the top of its center (twinkle already grows toward the bottom,
 * TWINKLE_HORIZON_GAIN). A speed of 0.2 long sides a second is 12°/s here, a medium meteor (IMO: 3 to 25°/s). Shooting
 * stars glow about `meteorHeightKm` km up over a planet of radius `earthRadiusKm` km, so lower in the window they are
 * farther away: slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeightKm: 100, earthRadiusKm: 6371 } as const

/**
 * Where a visit's shooting stars come from. One shower radiant sends `showerShare` of them, scattered about it with a
 * standard deviation of `showerScatter` degrees; the rest come from `sporadicSources` broad sporadic sources (helion,
 * antihelion, apex and toroidal), one per speed class, each scattering `sporadicScatter` degrees (one standard
 * deviation). Elevations follow real rates (hourly rate ∝ sin h, so the density is sin h cos h) and azimuths are
 * uniform: about 3 in 4 fall, 1 in 7 cross sideways and 1 in 8 climb before the climb guard. A path climbing more than
 * `climbDegrees` comes only from a sporadic source and spans at most `climbShare` of the longest path, and no path ends
 * under the navbar. On `onScreen` of wide-screen visits the shower radiant sits on screen, in clear sky in the top
 * `onScreenTop` of the height (on no other visit, and never on narrow screens, where only stubs would fit around it);
 * within `nearRadiant` degrees of it a shower path may be as short as `nearRadiantPath` px, since meteors there are short
 * and slow. A stream shares a parent body and a speed, so its meteors look alike: a shower flight takes the visit's
 * shower spectrum (VisitSky.showerSpectrum) with odds `showerKeeps` and otherwise draws its spectrum from its speed
 * class like any other flight, which stands for the spread inside one stream; a burst's members and a point flash always
 * take it.
 */
export const RADIANTS = {
	showerShare: 0.4,
	showerScatter: 1.5,
	showerKeeps: 0.8,
	sporadicSources: 3,
	sporadicScatter: 15,
	climbDegrees: 15,
	climbShare: 0.6,
	onScreen: 0.15,
	onScreenTop: 0.45,
	nearRadiant: 10,
	nearRadiantPath: 40,
} as const

/** The odds of each spectrum (METEOR_SPECTRA) in a draw: shares that add up to 1. */
export type SpectrumOdds = { readonly [K in SpectrumName]?: number }

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's center (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** The odds of each spectrum for a flight of this class. */
	spectra: SpectrumOdds
	/** The odds of each spectrum for the visit's shower, when the shower is of this class (VisitSky.showerSpectrum). */
	showerSpectra: SpectrumOdds
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast). The sporadic sources map onto them:
 * helion and antihelion about 30 km/s, toroidal 35 to 40, apex about 60. A flight draws its spectrum (METEOR_SPECTRA)
 * from its class's `spectra`. Sodium's line takes less energy to excite than magnesium's, so the slower a meteor, the
 * more of its light is sodium's: the odds run from the teal and green spectra of the fast class through the
 * yellow-green and amber ones to the orange of sodium-rich meteors, which a fast flight never draws, since the effect
 * stops above about 40 km/s. Every class keeps some white flights (`plain`) and some blue ones (iron). The odds are design
 * values, anchored on the shares of the spectral classes, not on any published share of the colors people report. The
 * visit's shower draws its one spectrum from its class's `showerSpectra` (VisitSky.showerSpectrum), as a stream takes
 * its look from its parent body: slow showers are Taurid-like, medium ones Geminid-like and fast ones Perseid-like. Fast
 * meteors alone may leave a train. A flight lasts `duration` seconds, 0.74 s on average, under twice the 0.4 s or so an
 * ordinary meteor lasts, so it is quick and still easy to follow.
 */
export const SPEED_CLASSES = {
	slow: {
		angular: 9,
		duration: [0.85, 1.15],
		spectra: { normalSlow: 0.35, naEnhanced: 0.3, naRich: 0.15, plain: 0.1, blue: 0.05, normal: 0.05 },
		showerSpectra: { normalSlow: 0.5, naEnhanced: 0.5 },
		train: false,
	},
	medium: {
		angular: 14,
		duration: [0.6, 0.85],
		spectra: { normal: 0.4, naPoor: 0.2, normalSlow: 0.15, plain: 0.15, blue: 0.1 },
		showerSpectra: { naPoor: 0.5, normal: 0.5 },
		train: false,
	},
	fast: {
		angular: 22,
		duration: [0.4, 0.6],
		spectra: { normal: 0.4, naPoor: 0.3, plain: 0.15, blue: 0.15 },
		showerSpectra: { normal: 0.65, naPoor: 0.35 },
		train: true,
	},
} as const satisfies Record<string, SpeedClass>

/** The name of a speed class. */
export type SpeedClassName = keyof typeof SPEED_CLASSES

/** Poisson arrivals with a refractory floor and a cap: floor + Exp(mean), at most cap. */
export interface GapLaw {
	/** Shortest gap (s). */
	floor: number
	/** Mean of the exponential part added to the floor (s). */
	mean: number
	/** Longest gap (s). */
	cap: number
}

/**
 * How often shooting stars launch. A dark rural site sees 1 to 3 sporadic meteors an hour in the evening and 4 to 10
 * before dawn (AMS), and a screen-sized window holds about 29% of an observer's field (IMO): a real window shows one
 * every 25 to 100 minutes, or one every 2 to 4 at a Perseid or Geminid peak. The hero runs about 120 times a dawn sky's
 * rate (500 times an evening's, 10 to 20 times a shower peak's), a time-lapse of a strong shower night: gaps after each
 * flight follow `hero` (floor 4 s plus an exponential 8 s, at most 30 s: 11.7 s on average, about 4.7 a minute) or
 * `narrow` on phones (21 s on average), stretched on long visits (TRANSIENTS.longVisit).
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	narrow: { floor: 8, mean: 14, cap: 45 },
} as const satisfies Record<string, GapLaw>

/**
 * Brightness: real counts are dominated by faint meteors (each brighter magnitude has 1/r as many, r about 2.2 to 2.6);
 * the hero keeps only `faintShare` of ordinary flights faint, peaking within `faint`, so most stay easy to see, and the
 * rest peak within `normal`. Lower in the window a meteor is farther away and dims by the square of its distance over the
 * distance at the top of the spawn area (so none ever brightens past `normal`), never below `rangeFloor` of its peak. On
 * average they peak at about 0.5, about 1 in 8 under 0.3; raise `normal` and `rangeFloor` if they read too faint: the
 * renderer fits any peak to each copy's INK_BUDGET (METEOR_VEIL). Fireballs peak at 1 and stay in clear sky.
 */
export const METEOR_BRIGHTNESS = { faintShare: 0.3, faint: [0.3, 0.5], normal: [0.6, 0.85], rangeFloor: 0.6 } as const

/**
 * Kinds of shooting star apart from the ordinary: odds per launch (`chance`), least seconds between two of a kind
 * (`spacing`: a number, or a range drawn afresh after each one) and the earliest second after the reveal (`after`). A kind
 * is open to a launch on wide screens only, once `after` has passed and its spacing has run out. A launch draws one number
 * and gives it to the first open kind, in the order listed here, whose slice of the odds it falls in, so each kind's share
 * of the launches is its own `chance`; where that kind finds no path, an ordinary shooting star flies instead. They are
 * listed by their odds, the highest first: fireballs, flashes, bursts, earthgrazers; the odds add up to less than 1, so
 * the order changes no kind's share.
 */
export const METEOR_KINDS = {
	/**
	 * Fireballs (brighter than Venus) stay in clear sky, last `duration` s at METEOR.fireballSpeedScale of the normal speed,
	 * and with a 2.4 s train stay under 5 s. The real sky shows about one fireball per 100 to 200 meteors; this sky shows
	 * them far more often by design, about one every 90 s over a visit's first 5 minutes and one every 110 s over the next
	 * 5. The spacing is a range, drawn afresh after each fireball and kept in the visit's memory, so no two come closer
	 * than its low end and the gaps vary; `chance` is high because launches come further apart as a visit goes on
	 * (TRANSIENTS.longVisit), and with fewer launches to decide on, lower odds would leave more than 2 minutes between
	 * fireballs.
	 */
	fireball: { chance: 0.55, spacing: [50, 85], after: 20, duration: [1.8, 2.5] },
	/**
	 * Point flashes: a meteor coming straight at the viewer shows as a point at the shower radiant, with no length and no
	 * movement, that brightens and fades in `duration` s at a `peak` of at most 0.7. They need the radiant on screen (on
	 * RADIANTS.onScreen of wide-screen visits) and fly within `radius` degrees of it, in clear sky, and never take the
	 * ink lease.
	 */
	flash: { chance: 0.2, spacing: 60, after: 30, duration: [0.3, 0.5], peak: [0.45, 0.7], radius: 1 },
	/**
	 * Bursts: `members` faint shooting stars from the shower radiant, one after another `stagger` s apart (so no more than
	 * 3 flashes a second), the whole burst at most TRANSIENTS.maxLife from first light to last: a member that would end
	 * later is left out, and fewer than the least `members` is no burst. Every member flies in clear sky, so a burst never
	 * takes the ink lease, and none has a flare or a train.
	 */
	burst: { chance: 0.05, spacing: 90, after: 45, members: [2, 4], stagger: [0.35, 1.2] },
	/**
	 * Earthgrazers: a long, slow, warm shooting star skimming the sky within `tilt` degrees of horizontal, as a meteor
	 * entering at a shallow angle does. It runs at `angular` °/s of the sky window (SKY_WINDOW) for `duration` s, with the
	 * wake of a fireball (about 4 s in all), across at least `widthShare` of the screen's width: about 20° of the window,
	 * since 4 to 6°/s for 2.5 to 3.5 s spans 21° at most, so a larger share could never fit. It flies in clear sky, so it
	 * never takes the ink lease, and is skipped silently where no band of clear sky is long enough. Screens narrower than
	 * `minWidth` px have none.
	 */
	grazer: { chance: 0.025, spacing: 180, after: 60, minWidth: 1280, widthShare: 0.3, tilt: 12, angular: [4, 6], duration: [2.5, 3.5] },
} as const

/**
 * Shooting stars: where they start, the layout guards, their length, drag, wake, flares and trains. Directions, speeds
 * and brightness come from the visit's sky (RADIANTS, SPEED_CLASSES, METEOR_BRIGHTNESS) and rates from METEOR_RATE. Each
 * lights up and peaks in clear sky and may glide on behind quiet copy, veiled to what the copy can take (METEOR_VEIL,
 * INK_BUDGET). Its layout guards keep every transient below the navbar (`top`), inside the edges (`edgeMargin`) and clear
 * of the bottom corners (`maxEndY`), and a shooting star also clear of the side rails (planMeteor's `clearOf`).
 */
export const METEOR = {
	/** Seconds after the page reveal before the first one, once the hero entrance and side rails have settled. */
	firstDelay: [4.5, 7],
	/** Candidate start points tried per steer for long flights, and again for the fallback; a launch traded for a pass behind copy (METEOR_PASS) tries up to as many again. */
	attempts: 160,
	/** Fresh steers (a new source and scatter from the visit's sky) tried per launch when the first yields no long flight, before any shorter one; narrow screens try one. */
	radiantTries: 3,
	/** Start area as viewport fractions; y also stays below `top`. */
	spawnX: [0.45, 0.985],
	spawnY: [0, 0.5],
	/** Paths end above this share of the height, clear of the bottom corners; planMeteor's `clearOf` keeps them off the side rails' copy. */
	maxEndY: 0.72,
	/** Clearance below the top edge (under the 100px navbar) and inside the screen edges. */
	top: 110,
	edgeMargin: 12,
	/**
	 * Speeds and durations come from SPEED_CLASSES, and each flight's speed spreads by `speedJitter`; where no long
	 * flight fits (a short laptop window, a phone), the fallback pass flies its class's durations times `fallbackScale`.
	 */
	speedJitter: [0.88, 1.12],
	fallbackScale: 0.64,
	/**
	 * Path length range (px; the fallback pass accepts `fallbackScale` times the shortest); the longest is also at most
	 * `pathShare` of the longer viewport side. A path is a speed times a flight time, and a small window's speeds are slow
	 * (SKY_WINDOW), so the shortest is what such a window can still reach in SPEED_CLASSES' durations. At 135 px the planner
	 * finds a path for 73% of its launch attempts on a 740 x 360 phone held sideways and 99% on 1024 x 768; at 160 px, 31%
	 * and 97%. Three plans in a row that find no room stop the shooting stars until the next layout
	 * (TRANSIENTS.maxFailedPlans), which with the page held still 160 px does within two minutes on 6 visits in 10 on that
	 * phone and 135 px on 1 in 20.
	 */
	path: [135, 640],
	pathShare: 0.36,
	/** Narrow screens: paths at least `narrowMinPath` px (`fallbackScale` times that on the fallback pass) and at most `narrowMaxPathShare` of the width. */
	narrowMinPath: 110,
	narrowMaxPathShare: 0.55,
	/** Atmospheric drag: by the end of the flight the speed falls to 1 - 3 × drag of the entry speed (0.06: 82%). */
	drag: 0.06,
	/** Wake afterglow (s): each point of the path dims to 1/e this long after the head passes; drawn for `wakeSpan` of these. */
	wake: 0.13,
	wakeSpan: 3,
	/** Fireballs (long flights only; METEOR_KINDS.fireball has their odds and timing): longer, slower and brighter, with more drag and a longer wake. */
	fireballSpeedScale: 0.6,
	fireballDrag: 0.15,
	fireballWake: 0.18,
	/** A late flare on some flights. */
	flareChance: 0.12,
	/** A faint persistent train behind some fireballs and fast flights (SPEED_CLASSES' `train`). */
	trainChance: 0.15,
} as const

/**
 * Farewell meteors: up to `limit` shooting stars a visit around Contact and the footer, once the end bookend is complete
 * enough (SCENE.endLaunchLevel), on their own clock: the first attempt `gap` after the reveal and the next after each
 * flight (GapLaw, stretched on long visits: floor 8 s plus an exponential 14 s, at most 45 s, so 21 s on average). They
 * fly only in the sky below the top of the highest copy of the page's flow that is on screen, because the page above
 * Contact has copy the sky knows nothing of (it carries no data-sky-quiet), and may glide on behind Contact and the
 * footer like any shooting star (METEOR_VEIL). On a screen that leaves no room for a path there (it must end above
 * METEOR.maxEndY), a launch holds until the page scrolls to one that does.
 */
export const FAREWELL = { gap: { floor: 8, mean: 14, cap: 45 }, limit: 2 } as const

/**
 * Satellites: steady points lit by a Sun below the horizon (no twinkle, no wake, never blinking), gliding in a straight
 * line at constant speed, as NASA describes the space station. Real low orbits cross about 1°/s overhead, about 0.5°/s
 * at the window's 40° center and 0.1 to 0.3°/s low in the sky; these run `angular` °/s of the sky window (SKY_WINDOW),
 * 2 to 5 times faster at the center, so a whole pass stays within `life` seconds (WCAG 2.2.2's 5 s). A pass crosses the
 * edge of Earth's shadow at most once, as a real one does: at dusk (`shadowShare` of passes) it slides in lit from
 * beyond a side and fades into the shadow over `fadeOut` s, turning from palette index `tint` to the orange
 * `shadowColor` over the `warmLead` s before the fade, at its full brightness, so it is plainly orange when it starts to
 * dim and goes out orange, as real ones redden; at dawn it fades in over `fadeIn` s as it leaves the shadow and glides
 * out through a side, without warming. It is deliberately brighter than any star, as the space station outshines every
 * star when it passes, so that a visitor notices it: `alpha` is its brightness while lit, and the center of its dot adds
 * `gain` times that, clipped at full light, so the dimmest pass adds 0.875, over the brightest star's 0.78, and a pass of
 * 0.8 or more saturates its core. The dot (`dot`, CSS px) is a bright core of Gaussian sigma `core` (the brightest
 * stars' is 0.85) and a faint glow of `glow` times the core's peak at Gaussian sigma `glowSigma`, both lowered so that
 * the dot ends in nothing at `radius`: still one small point. Clear sky only (every point clear of every padded quiet
 * rect's reach, ZONE_REACH), never within `minTilt` degrees of vertical (a vertical glide reads as scrolling), one at a
 * time, wide screens only, on their own clock: the first attempt `first` after the reveal and then `gap` after each
 * pass (GapLaw: 24 s and 36 s on average, the gaps stretched on long visits), so 93% of visits get a first pass within
 * 45 s and a visit's first 5 minutes hold about 6.6 passes, about 45 s apart. Up to `attempts` candidate passes per
 * launch.
 */
export const SATELLITE = {
	first: { floor: 12, mean: 12, cap: 90 },
	gap: { floor: 18, mean: 18, cap: 90 },
	angular: [1.2, 2.5],
	alpha: [0.7, 0.95],
	life: 4.8,
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
	warmLead: 1.2,
	tint: 4,
	shadowColor: [255, 130, 20],
	dot: { radius: 4.5, core: 1.2, glow: 0.2, glowSigma: 2.4, gain: 1.25 },
	minTilt: 20,
	attempts: 40,
} as const

/**
 * Quiet keeps for transients that never take the ink lease: a point of light drawn with them, sampled at its center and
 * at most QUIET.padding in radius, keeps none inside a padded quiet rect, even mid-ease or when a layout changes under
 * it, so it never shares a contrast budget with the one that holds the lease. Not a look setting: both stay 0 whatever
 * the star layers' keeps become.
 */
export const CLEAR_SKY_KEEPS = { quietKeep: 0, inkKeep: 0 } as const

/**
 * The static comet, the sky's one long-lived body: a mint coma around a pseudo-nucleus, a curved pale dust tail and a
 * faint straight blue-white ion tail, never a green tail. It hangs in the upper right of the hero as far away as the
 * faint majority of stars, so the camera moves it as it moves them (DEPTH) and it never moves on its own. It is
 * pictured to scale with the sky window (SKY_WINDOW): the coma radius, the tails' lengths and widths are degrees of it,
 * and the tails point `angle` degrees clockwise from the right (up is -90), the dust tail starting `dust.start` degrees
 * further round and bending `dust.curve` degrees over its length (negative is anticlockwise). The alphas are each
 * part's peak light, all at the nucleus, where they add: together they stay at most 0.6, under the brightest stars, and
 * fall to 0 at the tails' tips. `tint` picks a star palette color. The coma is --color-green mixed `coma.mint`
 * toward --color-white. It is drawn on `chance` of wide-screen visits, from `firstDelay` seconds after the reveal (the
 * hero's entrance, the rails and the copy's measurement have settled), fading in over `fadeIn` seconds so nothing
 * starts. Where it hangs is the nearest place to `anchor`, the nucleus as shares of the width and height, on a grid of
 * `step` px where its box, grown by as far as the camera can carry it (the drift and the lean, times its nearness),
 * keeps clear of every quiet zone's reach, stays inside the screen and lies below the navbar (METEOR.top) and above
 * About's header row, copy the zones know nothing of; a window with no such place has no comet. About's header row lies
 * below the hero by the offset of the last `aboutRow` entry whose width the screen reaches (SECTION_SHELL's top padding
 * plus .section-header's 10 px top margin, at Tailwind's md and lg breakpoints), and the box must stay clear of it when
 * the page has scrolled as far as a comet can still show. Where no place fits it looks again after `retry` seconds. It
 * is gone for the page view when the page scrolls from where it began to show (SCROLL_CANCEL), when the sky is paused
 * or resized, or when copy comes within reach of its box.
 */
export const COMET = {
	chance: 0.11,
	firstDelay: 8,
	retry: 5,
	fadeIn: 10,
	anchor: [0.8, 0.3],
	step: 8,
	aboutRow: [
		[0, 70],
		[768, 90],
		[1024, 110],
	],
	angle: -68,
	nucleus: { alpha: 0.25, tint: 4, shape: 4 },
	coma: { radius: 0.5, alpha: 0.16, mint: 0.3 },
	ion: { length: 6.5, width: [0.11, 0.04], alpha: 0.08, tint: 2 },
	dust: { length: 4.2, start: -8, curve: -52, width: [0.15, 1], alpha: 0.11, tint: 4 },
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
 * the head width to the tail width, with a soft pass `softWidth` times wider at `softAlpha`. An ordinary meteor is thin,
 * as it looks to the eye: a point with a halo too faint to read as a disc, trailing a hair of wake, and the soft pass is
 * what lets a tint read on a line that fine. From the head the wake cools from white to its tint over `coolBy` of its
 * length, so the first fifth stays white-hot and the rest carries the color, and its far half thins to `tailKeep` at the
 * end. The tint is the wake color of the flight's spectrum (METEOR_SPECTRA), as much of it as the meteor's brightness
 * shows (METEOR_CHROMA).
 */
export const METEOR_LOOK = {
	core: 0.62,
	glow: 2.2,
	glowAlpha: 0.16,
	fireballGlow: 1.6,
	wakeWidth: [1.15, 0.3],
	softWidth: 2.8,
	softAlpha: 0.22,
	wakeStops: 9,
	coolBy: 0.2,
	tailKeep: 0.7,
} as const

/** The train of a spectrum with no sodium to the fore: oxygen's green first, then sodium and iron oxide (`plain` and `normal` share it). */
const OXYGEN_TRAIN = [
	[0, [150, 245, 130]],
	[0.6, [195, 215, 120]],
	[1, [225, 195, 125]],
] as const

/** What the light of one spectrum looks like. */
interface MeteorSpectrum {
	/** The color the wake cools to, mixed from the theme's white by METEOR_CHROMA; null leaves it white. */
	wake: Rgb | null
	/** The color of the glow round the head (METEOR_SHEATH), mixed the same way; null draws none. */
	sheath: Rgb | null
	/** The persistent train's color by share of TRAIN.life since the flight ended. */
	train: ColorStops
}

/**
 * The colors a shooting star's light takes, by what it is made of and how fast it flies. Meteor light is a few hundred
 * emission lines, not a glowing body with a temperature: sodium (589 nm, orange-yellow), magnesium (518 nm, teal-green),
 * iron (526 to 545 nm, green) and, high up, oxygen (557.7 nm, green). Sodium's line takes 2.1 eV to excite and
 * magnesium's 5.1 eV, so a slow meteor of ordinary composition glows sodium-yellow and a fast one green; composition adds
 * teal where a stream has lost its sodium, amber where it is rich in it and blue for iron. The keys name a mix of lines
 * and speed, not a claim about one meteor: broadband color cannot tell the spectral classes apart, iron aside. Each has
 * the color its wake cools to (`wake`), the color of the glow round the head (`sheath`) and the color of its persistent
 * train as it ages (`train`: oxygen first where the flight was fast and high, sodium and iron oxide after). `plain` is
 * the eye's white, where the lines blend: a wake that stays white and no sheath.
 */
export const METEOR_SPECTRA = {
	/** The eye's white. */
	plain: { wake: null, sheath: null, train: OXYGEN_TRAIN },
	/** Sodium-poor or sodium-free, or fast with a strong second spectrum: magnesium's teal. */
	naPoor: {
		wake: [85, 250, 195],
		sheath: [40, 250, 180],
		train: [
			[0, [140, 250, 125]],
			[0.6, [150, 220, 125]],
			[1, [190, 205, 120]],
		],
	},
	/** Chondritic, medium to fast (about 35 km/s): green. */
	normal: { wake: [150, 250, 150], sheath: [110, 250, 125], train: OXYGEN_TRAIN },
	/** Chondritic and slower (25 to 30 km/s): sodium turns the green yellow. */
	normalSlow: {
		wake: [235, 240, 105],
		sheath: [225, 240, 80],
		train: [
			[0, [235, 225, 110]],
			[1, [230, 165, 100]],
		],
	},
	/** Slow (15 to 25 km/s) or sodium-enhanced: amber. */
	naEnhanced: {
		wake: [255, 195, 65],
		sheath: [255, 190, 50],
		train: [
			[0, [255, 180, 90]],
			[1, [225, 135, 90]],
		],
	},
	/** Very slow (under 15 km/s) or sodium-rich: orange. */
	naRich: {
		wake: [255, 145, 40],
		sheath: [255, 135, 30],
		train: [
			[0, [255, 160, 80]],
			[1, [210, 120, 85]],
		],
	},
	/** Iron's lines alone, or fast and hot: blue. */
	blue: {
		wake: [110, 205, 255],
		sheath: [80, 185, 255],
		train: [
			[0, [170, 230, 190]],
			[1, [210, 175, 130]],
		],
	},
} as const satisfies Record<string, MeteorSpectrum>

/** A key of METEOR_SPECTRA. */
export type SpectrumName = keyof typeof METEOR_SPECTRA

/**
 * How much of its spectrum's color a shooting star shows, by its peak brightness: the eye sees color only in bright
 * light and reads a faint meteor as white. The share runs from `floor` at a peak of `from` and below to `ceiling` at
 * `to` and above, along a smoothstep (meteorChroma), and mixes the wake's tint and the sheath's color from the theme's
 * white.
 */
export const METEOR_CHROMA = { floor: 0.3, ceiling: 0.95, from: 0.22, to: 0.6 } as const

/**
 * The sheath: a glow in the spectrum's color round a shooting star's head. A bright head saturates the eye's cones, so
 * the head's own sprite stays white and the color shows in the light around it. A radial gradient of `radius` CSS px at
 * `alpha` times the meteor's chroma and its light now, whose `stops` are [share of the radius, share of that alpha]. It
 * is drawn with CLEAR_SKY_KEEPS at the head's center, so it fades out as the head nears copy and is gone once the head
 * is inside a padded quiet rect: its radius is under QUIET.padding, so none of it reaches the copy itself, and the
 * veil's budgets don't count it.
 */
export const METEOR_SHEATH = {
	radius: 11,
	alpha: 0.6,
	stops: [
		[0, 1],
		[0.18, 0.72],
		[0.38, 0.36],
		[0.6, 0.13],
		[0.8, 0.035],
		[1, 0],
	],
} as const

/**
 * Persistent train: a faint line along the path, in the colors of its spectrum (METEOR_SPECTRA), that starts to brighten
 * `onset` of the way through the flight (time constant `rise`), lingers and fades (`decay`), widening from `width[0]`
 * to `width[1]` over `widen` seconds after the flight. At its `peak` a hue reads on navy (a train at 0.12 reads gray
 * whatever its color). Gone `life` seconds after the flight, easing out over the last `fadeOut` seconds, so a fireball
 * and its train last under 5 s (WCAG 2.2.2).
 */
export const TRAIN = { peak: 0.18, onset: 0.3, rise: 0.15, decay: 1.3, life: 2.4, fadeOut: 0.8, width: [1, 3], widen: 2 } as const
