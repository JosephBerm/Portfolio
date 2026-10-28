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
 * Leaning toward the pointer (mice and pens on hover-capable screens, the hero, full motion): the camera moves up to
 * `reach` CSS px (at nearness 1) toward a pointer at the viewport's edge, through critically damped springs of `omega`
 * rad/s (95% in 1.2 s), so the stars slide away from it, the brightest farthest (19 px) and the faint majority about
 * 3.5 px: the same law as scrolling, so the depth order never changes. Like the drift, it keeps still on a
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
 * Scroll narrative: the full sky in the hero, a dimmer and calmer sky while reading (no twinkle, the drift at about a
 * third), and a bookend near the end of the page. Levels blend continuously with scroll, so the narrative needs no
 * clock of its own. Star levels are per layer: while reading the brighter layers dim most, so no star behind body copy
 * reads as punctuation. `drift` scales the drift clock's rate (DRIFT); `lean` scales the pointer lean (LEAN), which
 * only the hero has.
 */
export const SCENE = {
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1, lean: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35, lean: 0 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8, lean: 0 },
	/** Viewport heights scrolled where the hero starts and finishes giving way to reading. */
	heroFadeFrom: 0.5,
	heroFadeTo: 1.3,
	/** Viewport heights left to scroll where the end bookend starts and is complete. */
	endFadeFrom: 0.85,
	endFadeTo: 0.15,
	/** Transients launch over the hero only while no more than this many viewport heights are scrolled. */
	heroLaunchMaxScroll: 0.4,
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
	/** Fades (dusk, scrolling under reduced motion, the motion level easing, the stars a quality step thins out). */
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
 * number, so every drawn frame stays up for the same number of display refreshes; a lower need must last
 * `slowDownAfter` seconds before the clock slows down. The drift and the pointer lean draw at most `narrowMaxFps` on
 * narrow screens (phone GPUs pay most for a full-screen frame) and `slowMaxFps` after the first adaptive step; a
 * software-rasterized canvas may spend `softwareShare` of a core on them and keeps a still sky below `minFps`. The
 * refresh interval is the median of the last `refreshSamples` frame intervals; a median within `unalignedToleranceMs`
 * of `unalignedIntervalMs` is WebKit's fixed 15 ms worker clock, not the display, so uncapped motion draws every frame
 * there and capped drift every few. A requested animation frame that hasn't come `watchdogMs` after the request (while
 * visible) is served by a timer; after `watchdogStrikes` misses in a row, frames come from a `fallbackFps` timer, which
 * asks for one animation frame every `reprobeMs` and goes back to them when one arrives (a GPU restart or a restored
 * context); the strikes also reset when the context is restored or the tab is shown.
 */
export const PACING = {
	stepDevicePx: 0.5,
	minFps: 20,
	slowDownAfter: 0.5,
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
 * Every short-lived sky event (so far, shooting stars): at most `maxLife` seconds from first light to last, wake, train
 * and fades included (WCAG 2.2.2's 5 s, per animation); onsets at least `minOnsetGap` seconds apart, since a motion onset
 * draws the eye; one of each kind at a time; on narrow screens at most `narrowLimit` per visit. Only one transient at a
 * time may plan its light onto quiet copy (it holds the ink lease: each rect's INK_BUDGET counts one transient plus the
 * haze), and none may do so until `crossingCooldown` seconds after the page reveal and after the last lease began, so copy
 * crossings stay rare (0, since shooting stars already come at least 30 s apart). A pause fades every transient out over
 * `cancelFade` seconds, through scrollKept, which also takes it away as the page scrolls from its launch (SCROLL_CANCEL).
 * A plan that finds no room waits `retry` seconds; after `maxFailedPlans` in a row the kind waits for a new layout. A held
 * launch looks again after `recheck` seconds; a launch waits `scrollQuiet` seconds after scrolling stops, and after a
 * return (tab, idle, full motion) nothing launches for `afterReturn` seconds.
 */
export const TRANSIENTS = {
	maxLife: 5,
	minOnsetGap: 3,
	narrowLimit: 2,
	crossingCooldown: 0,
	cancelFade: 0.2,
	retry: [5, 9],
	maxFailedPlans: 3,
	recheck: 1,
	scrollQuiet: 1.2,
	afterReturn: 3,
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
 * and slow.
 */
export const RADIANTS = {
	showerShare: 0.4,
	showerScatter: 1.5,
	sporadicSources: 3,
	sporadicScatter: 15,
	climbDegrees: 15,
	climbShare: 0.6,
	onScreen: 0.15,
	onScreenTop: 0.45,
	nearRadiant: 10,
	nearRadiantPath: 40,
} as const

/** The color a shooting star's wake cools to: warm (sodium, iron), white, or mint (magnesium, oxygen 557.7 nm). */
export type WakeColor = 'warm' | 'white' | 'mint'

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's center (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** Wake color the head cools to (named apart from Meteor.wake, the afterglow time constant). */
	wakeColor: WakeColor
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast). The sporadic sources map onto them:
 * helion and antihelion about 30 km/s, toroidal 35 to 40, apex about 60. Fast meteors cool to mint (magnesium 517 nm,
 * oxygen 557.7 nm) and alone may leave a train; slow ones glow warm (sodium 589 nm, iron); medium ones stay white.
 */
export const SPEED_CLASSES = {
	slow: { angular: 9, duration: [1.1, 1.4], wakeColor: 'warm', train: false },
	medium: { angular: 14, duration: [0.8, 1.1], wakeColor: 'white', train: false },
	fast: { angular: 22, duration: [0.55, 0.8], wakeColor: 'mint', train: true },
} as const satisfies Record<string, SpeedClass>

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
 * Shooting stars: where they start, the layout guards, their length, drag, wake, flares and trains. Directions, speeds
 * and brightness come from the visit's sky (RADIANTS, SPEED_CLASSES, METEOR_BRIGHTNESS). Each lights up and peaks in
 * clear sky and may glide on behind quiet copy, veiled to what the copy can take (METEOR_VEIL, INK_BUDGET). Its layout
 * guards keep every transient below the navbar (`top`), inside the edges (`edgeMargin`) and clear of the bottom corners
 * (`maxEndY`), and a shooting star also clear of the side rails (planMeteor's `clearOf`).
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
	/** Path length range (px; the fallback pass accepts `fallbackScale` times the shortest); the longest is also at most `pathShare` of the longer viewport side. */
	path: [160, 640],
	pathShare: 0.36,
	/** Narrow screens: paths at least `narrowMinPath` px (`fallbackScale` times that on the fallback pass) and at most `narrowMaxPathShare` of the width. */
	narrowMinPath: 110,
	narrowMaxPathShare: 0.55,
	/** Atmospheric drag: by the end of the flight the speed falls to 1 - 3 × drag of the entry speed (0.06: 82%). */
	drag: 0.06,
	/** Wake afterglow (s): each point of the path dims to 1/e this long after the head passes; drawn for `wakeSpan` of these. */
	wake: 0.13,
	wakeSpan: 3,
	/** Fireballs (rare, long flights only): longer, slower and brighter, with more drag and a longer wake, warm unless fast (mint). */
	fireballChance: 0.08,
	fireballDuration: [1.8, 2.5],
	fireballSpeedScale: 0.6,
	fireballDrag: 0.15,
	fireballWake: 0.18,
	/** A late flare on some flights. */
	flareChance: 0.12,
	/** A faint persistent train behind some fireballs and fast flights (SPEED_CLASSES' `train`). */
	trainChance: 0.15,
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
 * cools from white to its tint over `coolBy` of its length, and its far half thins to `tailKeep` at the end. Each wake
 * takes its speed class's color: fast ones cool to --color-green mixed `mintToWhite` toward --color-white, medium ones
 * stay white, and slow ones warm to palette index `fireballTint` (pale yellow), as fireballs do unless they are fast.
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
