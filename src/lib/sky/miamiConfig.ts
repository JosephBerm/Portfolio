/**
 * Tunables for the landing scene at the foot of the home page, a sunset over a bay drawn in the sky worker. Lengths are
 * CSS px unless a name says device px, times are seconds, a "share" is a fraction of the canvas width or height as
 * named, and alphas run 0-1. A height above the page's end is written z, and t is a height above the waterline in
 * warm-band heights: 0 at the waterline, 1 at the warm band's top. Colors are constants; only the sky ramp's last stop
 * reads a theme color (the navy token, at run time), so the sky joins the page with no seam. The shared sky's own
 * tunables stay in config.ts, which the scene only reads.
 */

/**
 * The descent: how the shared sky gives way to the scene as the page's end comes up. `descent` (SceneLevels) runs from 0,
 * where the first faint indigo reaches the bottom of the screen, to 1, where the warm band's top does. From
 * `eventStop` on no shooting star or satellite launches, so nothing flies over the bright sky. Between the two `starMix`
 * levels the star levels (per layer) and the drift's rate mix from the scene's own to `stars` and `drift`: the nearer,
 * brighter layers keep the most, so bright stars are the last to go out (`near` between 0.3 and 0.4, `drift` between 0.3
 * and 0.7). The haze is gone at `hazeOut[1]`, well before the warm band shows. Between the `inkOut` levels the share of
 * each copy rect's ink budget that a transient may keep falls from 1 to 0, because a rect's headroom assumes a navy
 * ground and the sky behind the copy stops being navy.
 */
export const DESCENT = {
	eventStop: 0.9,
	stars: { far: 0.15, mid: 0.3, near: 0.4 },
	drift: 0.5,
	starMix: [0.2, 0.95],
	hazeOut: [0.1, 0.75],
	inkOut: [0.02, 0.1],
} as const

/**
 * The stage: where everything stands, measured from the copy's own rects.
 * - `direction`: the page's text colors. 'B' has Contact's paragraph and the footer one step brighter, so the water can
 *   glow copper to the bottom of the screen; 'A' changes no color, so the sky behind the paragraph stays plum-navy and the
 *   water goes dark toward the viewer; 'A+' brightens the paragraph only. The sky uses A's stops only for 'A', and the
 *   water and the footer's cap use B's only for 'B'. It is typed as the union, because a bare 'B' under `as const` makes
 *   every comparison with it a type error.
 * - `copySearchPx`: how far above the landing a quiet rect still counts as Contact's copy.
 * - `water`: the waterline's height as a share of the canvas height by width class (0.22 to 0.27), its least gap above
 *   the footer's first line by the footer's own layout (a footer taller than `phoneFooterZ` above the page's end is the
 *   phone layout, with its row of icons, which runs to 767 px wide), and the rows of water kept below the page's end for
 *   a pull past it.
 * - `tallest`: the tallest near tower, a share of the canvas height clamped to `min` and `max`; `unit` is that height in
 *   the skyline's drawing units.
 * - `horizonRate` and `palmRate`: px the horizon group (sun, city, water, boat) and the foreground (key, palms) move per
 *   px of scroll under full motion, against the page's 1 (0.55 to 0.7, and 1 to 1.15). `rateEase` is the seconds the two
 *   take to settle when the motion changes (1.5 to 2).
 * - `drop`: how far the near and far towers sink behind the water while the page is still coming down, as a share of the
 *   tallest tower (0 to 0.35); they rise to their full height as the page lands.
 * - `farFade`: the far city's colors are hazy and light, made for the sky behind it where it lands. While the page comes down
 *   the horizon group climbs against the page-locked sky, into rows that are darker than they are, and there it would show as
 *   lighter than its sky. It fades out as that climb grows from the first to the second share of the warm band's height.
 * - `copyClear` and `copyClearMin`: the clearance kept between the lowest copy's bottom and bright clouds, and the least it
 *   falls to where the banks need the room.
 * - `bakeAhead`: canvas heights of scroll before the scene shows at which its bitmaps start to build.
 * - `loadAhead`: the same for the scene's art, the code that bakes and draws it, which is a chunk of its own: from there it
 *   loads at a calm, settled moment, or when the bake is due or the scene is needed if none comes first.
 * - `buildSliceMs`: the most of a tick the build may take. `starveTicks`: ticks in a row whose earlier work has already
 *   spent the whole slice before the build is reached, after which one piece of it is built anyway, so a rebuild whose
 *   old bitmaps are still on screen can't wait forever behind work that never lets up. `jumpEase`: the seconds the scene
 *   takes to ease in after a jump straight to the page's end. `rebuildTolerancePx`: how far a measure may move before the
 *   bitmaps are rebuilt.
 */
export const STAGE = {
	direction: 'B' as 'B' | 'A' | 'A+',
	copySearchPx: 1000,
	water: { share: { wide: 0.24, narrow: 0.265 }, gap: { wide: 78, narrow: 48 }, phoneFooterZ: 100, overscan: 180 },
	tallest: { share: { wide: 0.142, narrow: 0.145 }, min: 96, max: 160, unit: 128 },
	horizonRate: 0.6,
	palmRate: 1.15,
	rateEase: 2,
	drop: { near: 0.28, far: 0.14 },
	farFade: [0.08, 0.17],
	copyClear: 68,
	copyClearMin: 16,
	bakeAhead: 1.2,
	loadAhead: 2,
	buildSliceMs: 8,
	starveTicks: 4,
	jumpEase: 0.5,
	rebuildTolerancePx: 4,
} as const

/**
 * The sky's color ramp and what is added to it, as functions of t.
 * - `lutSize`: how many samples the ramp is cut into for lookup.
 * - `margin`: the share of a copy rect's luminance ceiling that the sky is fitted to, which leaves room for the glow on the
 *   sun's column: the Contact paragraph lands at 5.0:1, not 4.5:1.
 * - `eventFloorT`, `starOutT`, `starFullT`: t levels. No event flies below the first and no star shows below the second;
 *   stars are at full strength from the third up, which is at or above `limb.hairlineT`, so no full-strength star sits under
 *   the limb's line.
 * - `stops`: the ramp's [t, color] stops for each direction; 'navy' is the theme's navy token.
 * - `bend`: the sky is warmest toward the sun. A color's place on the ramp is t divided by `a + b g`, plus `c (1 - g)`,
 *   where g falls from 1 on the sun's column over `sigma` of the width (by width class).
 * - `edge`: the sky darkens toward the sides, most at the horizon: it keeps `keep` of its light at the very edge, easing to
 *   all of it over `reach` of the width (by width class), and the darkening is gone by t = `goneT`.
 * - `bloom`: the glow around the sun, added to the sky. A near and a far term, each with a strength and a width as a
 *   share of the warm band's height, stretched `xStretch` times wider than tall, in `color` mixed `whiterShare` of the way
 *   toward `whiter`.
 * - `limb`: the Earth's edge seen from space. The ramp's isolines arc by a sagitta of the lesser of `sagitta.height` of the
 *   canvas height and `sagitta.width` of its width, flat below t = `fromT` and fully arced from `fullT`. A hairline of
 *   `color` at strength `hairline` lies about t = `hairlineT`, `hairlineWidth` wide in t. It is off (0): at 0.08 it was a
 *   band 30 to 70 px tall and nearly twice as bright as the sky on both sides, so it read as a floating ring, not as the
 *   Earth's edge.
 * - `moreGlow`: the share of the bloom kept under prefers-contrast: more.
 */
export const RAMP = {
	lutSize: 1024,
	margin: 0.82,
	eventFloorT: 1.15,
	starOutT: 1.15,
	starFullT: 2.25,
	stops: {
		B: [[0, '#F98F1E'], [0.08, '#F47C12'], [0.2, '#EC6809'], [0.32, '#DB570F'], [0.44, '#BE4A22'], [0.56, '#A5452A'], [0.68, '#8A412E'], [0.8, '#713F36'], [0.9, '#5F3D3D'], [1, '#4E3642'], [1.18, '#382B46'], [1.4, '#26224A'], [1.7, '#181D42'], [2.1, '#0F1B37'], [2.6, 'navy']],
		A: [[0, '#F98F1E'], [0.08, '#F47C12'], [0.2, '#EC6809'], [0.32, '#DB570F'], [0.44, '#BE4A22'], [0.56, '#A5432A'], [0.68, '#843A36'], [0.8, '#5F3239'], [0.9, '#452A3B'], [1, '#33233C'], [1.3, '#231F40'], [1.7, '#151C3B'], [2.2, '#0D1A33'], [2.8, 'navy']],
	},
	bend: { sigma: { wide: 0.46, narrow: 0.62 }, a: 0.66, b: 0.34, c: 0.2 },
	edge: { keep: 0.5, reach: { wide: 0.14, narrow: 0.07 }, goneT: 1.3 },
	bloom: { near: 0.42, nearWidth: 0.12, far: 0.18, farWidth: 0.3, xStretch: 2.3, color: '#FFB347', whiter: '#FFE7A8', whiterShare: 0.28 },
	limb: { sagitta: { height: 0.12, width: 0.04 }, fromT: 1.2, fullT: 2, hairline: 0, hairlineT: 2.25, hairlineWidth: 0.05, color: '#3A5AA0' },
	moreGlow: 0.7,
} as const

/**
 * The sun: a small hard disc that touches down in a gap of the skyline, with a halo around it.
 * - `x`: its column as a share of the width, by width class.
 * - `rise`: the disc's center above the low base in its gap, in radii; with `oblate`, the lowest quarter or so stays
 *   behind the base.
 * - `radius`: px on narrow screens; otherwise a share of the canvas height, clamped to `min` and `max`.
 * - `oblate`: the disc's height as a share of its width. `core` and `rim`: the disc's gradient.
 * - `haloReach`: radii at which the halo is cut to black. `fade`: the share of the sun's gate at which it is fully shown
 *   (0.5 to 0.75). `gateMargin`: px kept between its light and the lowest copy. `wrap`: the strength of the light it
 *   wraps around silhouettes beside it (0.2 to 0.4). `breath`: the share by which the halo breathes, and its period.
 */
export const SUN = {
	x: { wide: 0.645, narrow: 0.62 },
	rise: 0.45,
	radius: { narrow: 15, share: 0.02, min: 18, max: 26 },
	oblate: 0.9,
	core: '#FFFBDB',
	rim: '#FFC85C',
	haloReach: 3,
	fade: 0.5,
	gateMargin: 16,
	wrap: 0.3,
	breath: { amount: 0.03, period: 18 },
} as const

/**
 * Clouds, all locked to the page. `streaks` are thin, long bands at a t of the warm band: `x` is the center at clock 0 and
 * `width` the length, both as shares of the canvas width, `height` and `alpha` the band's, and `drift` the px a second it
 * moves in the default weather's wind; a cloud rides the air's clock (`SceneWind.airClock`), faster in a stronger wind and
 * the other way in a wind from the right. `banks` are the heavy clouds with flat bottoms, by width class: `above` is the
 * bottom's height above the waterline in tallest towers (the top is that plus `height` px), `x` and `width` as for the
 * streaks. `shape` makes a bank's top: noise stretched `stretch`:1 horizontally, `octaves` of it, and a top edge blurred
 * by at most `blur` px. The stretch is
 * long and the edge soft because short lumps with a crisp edge read as a mountain range, not as cloud, and for the same
 * reason the banks are low. `place` settles banks that don't fit: one shrinks to at least `minHeight` px before it is
 * dropped, a bank moved down to fit sits a seeded `offset` px lower where the room allows, and tops stay at least `topGap`
 * apart, so they never align. The tallest bank of a class stays at least twice `minHeight`: it sets the clearance under the
 * copy, so where a screen has little room the banks share a room no taller than it, and a room under two banks' worth holds
 * none. `top` and `topHigh` color a bank's top (lower and higher banks), `under` its underside on the sun's side (`near`)
 * and away from it (`far`), as light as the sky just below the bank so that it reads as lit from below and not as haze, and
 * `rim` the 1 to 2 px of light on the lowest edge of the bank nearest the sun. Under prefers-contrast: more the sky below a
 * bank is nearly navy, so a bank has neither: either would glow against it.
 */
export const CLOUDS = {
	streaks: [
		{ t: 0.13, x: 0.3, color: '#A8501C', width: 0.7, height: 8, drift: 0.8, alpha: 0.55 },
		{ t: 0.3, x: 0.86, color: '#8E3F20', width: 0.4, height: 10, drift: 1, alpha: 0.5 },
		{ t: 0.52, x: 0.4, color: '#6E3424', width: 0.6, height: 14, drift: 1.6, alpha: 0.45 },
		{ t: 0.78, x: 0.86, color: '#3F2A30', width: 0.22, height: 6, drift: 2.2, alpha: 0.35 },
	],
	banks: {
		wide: [
			{ above: 1.3, x: 0.44, width: 0.2, height: 30, drift: 0.5 },
			{ above: 1.2, x: 0.86, width: 0.18, height: 26, drift: 0.4 },
			{ above: 1.95, x: 0.74, width: 0.24, height: 46, drift: 0.9 },
			{ above: 2.5, x: 0.3, width: 0.18, height: 26, drift: 1.2 },
		],
		narrow: [
			{ above: 1.3, x: 0.3, width: 0.36, height: 22, drift: 0.4 },
			{ above: 1.95, x: 0.76, width: 0.36, height: 40, drift: 0.7 },
		],
	},
	shape: { stretch: 5.5, octaves: 3, blur: 3 },
	place: { minHeight: 18, offset: [10, 40], topGap: 12 },
	top: '#3B251E',
	topHigh: '#3F2A2C',
	under: { near: '#D8642E', far: '#A2462C' },
	rim: { near: '#FFA03A', far: '#CF5147' },
} as const

/**
 * The skyline, one flat dark color against the glowing sky.
 * - `near`: the color of every near silhouette (towers, cranes, the low base, the key and palms, the boat).
 * - `far`: a second layer of seeded towers behind the near ones, between `low` and `high` of the tallest tower's height,
 *   with `width` and `gap` ranges in drawing units, in a gradient from `top` to `base` that mixes up to `sunMix` toward
 *   `sunColor` near the sun.
 * - `base`: the low base along the water, its height a share of the tallest tower by width class (at most 0.3 of it on
 *   phones, where a taller one is a black shelf with bumps of canopy under stubby towers) and `gapShare` of that in the
 *   sun's gap, with a small palm top about every `palmEvery` px.
 * - `sunGap`: the room around the sun kept free of towers: `radii` (by width class) for the far layer and the low base,
 *   which are built per stage. `nearUnits`, in drawing units, is the rule the fixed near-tower list keeps (it knows no
 *   viewport): no near tower closer to the sun than that. Nothing reads it at run time.
 * - `haze`: a band of the local sky's color over the far layer's feet, `height` px at `alpha`.
 * - `cranes`: the port cranes, shown from `minWidth` px wide and `minHeight` px tall, at their three positions `at`,
 *   relative to the sun's gap in drawing units; `apex` is the height of a crane's A-frame in units. `window` is the x range
 *   in the same units that they stand in and the near-tower list keeps clear of towers (the far layer shows there). Like
 *   `nearUnits` it is a rule that the data (`at` and the list) must keep, and is not read at run time.
 */
export const SKYLINE = {
	near: '#120A0E',
	far: { top: '#4A2A2A', base: '#8A4A30', sunMix: 0.34, sunColor: '#F4851F', low: 0.36, high: 0.84, width: [11, 20], gap: [6, 34], seed: 0x4d49414d },
	base: { share: { wide: 0.25, narrow: 0.3 }, gapShare: 0.67, palmEvery: 70, seed: 0x42415345 },
	sunGap: { radii: { wide: 3, narrow: 2 }, nearUnits: 72 },
	haze: { height: 30, alpha: 0.3 },
	cranes: { enabled: true, minWidth: 1100, minHeight: 500, window: [-538, -337], at: [-517, -459, -401], apex: 100 },
} as const

/**
 * The small red beacons on the tallest towers: how many by width class, their color and size (px), the seconds of one
 * pulse (a range, so no two match), the peak alpha, and the steady alpha when the scene holds still.
 */
export const BEACONS = { enabled: true, count: { wide: 3, narrow: 2 }, color: '#FF4A3A', size: 1.5, period: [3, 4], peak: 0.7, still: 0.35 } as const

/**
 * The water. `stops` are [d, color] ramps down the water (d is 0 at the waterline and 1 at the page's end) for the body,
 * the crests and the troughs, by direction; `darken` pulls the body darker toward the viewer. `footerCap` is the most
 * luminance any row at or below the footer may have before the dither, which can add one level to a channel (about 0.003
 * of luminance at 0.125 and 0.001 at 0.02), by direction and under prefers-contrast: more, held over `capGap` px and
 * eased out over `capFeather`. The sun's column comes on over the `capFade` px above that hold (fewer where the waterline
 * is nearer, so on a phone it fades from the waterline down), because a column lit down to the footer would be flattened
 * by the cap into a bright box ending in a hard step; under prefers-contrast: more, where the cap is far below the water's
 * own light, each row eases up from the cap over the same px for the same reason. `glow` is the sun's column on the water,
 * `reflection` the skyline's dark reflection and `sliver` the thin line of light at the waterline. `strips` slice the
 * water into rows a device px tall growing by `growth` per row, with `margin` px to spare at the sides. `waves` are the
 * row shifts' sines: period, rows per cycle and share. `shiftX` and `shiftRow` are how far a row slides sideways and
 * vertically (px) at the default weather's sea, which scales them (`SceneWind.sea`, up to `miamiWater.ts`'s `ROUGHEST`),
 * `stillClock` the frozen time of the still pose. `ripple` and `glitter` shape the lens dashes of the
 * crests and the glints: sizes in px, lives in seconds, `count` by width class (and `low` for the slowest tier), the glint
 * width's half at most 24 px, which the quiet padding around copy covers. The ripples' `bands` each trade the light of their
 * two layers over a life of their own, and two neighbouring bands hand their crests over across `reach` px either side of
 * the edge between them, so the edge is no line across the water when they stand at different points of their lives.
 */
export const WATER = {
	stops: {
		B: {
			body: [[0, '#8F4A22'], [0.2, '#A74F29'], [0.6, '#96431D'], [1, '#7A3717']],
			crest: [[0, '#F2A24A'], [0.2, '#E0793F'], [0.6, '#C56A3E'], [1, '#A4552F']],
			trough: [[0, '#4A1C0D'], [0.6, '#5C1903'], [1, '#3A1208']],
		},
		A: {
			body: [[0, '#8F4A22'], [0.22, '#8A4020'], [0.55, '#4E2422'], [1, '#2A1826']],
			crest: [[0, '#F2A24A'], [0.22, '#E0793F'], [0.55, '#A84E2A'], [1, '#6E3226']],
			trough: [[0, '#4A1C0D'], [0.55, '#2C1218'], [1, '#1C0E18']],
		},
	},
	darken: { amount: 0.24, from: 0.45 },
	footerCap: { B: 0.125, A: 0.052, more: 0.02 },
	capGap: 24,
	capFeather: 40,
	capFade: 100,
	glow: { strength: 0.55, reach: [1.5, 4.2, 0.85], fade: [0.04, 0.95, 0.9], color: '#FFBE66' },
	reflection: { core: '#2A120C', strength: 0.55, from: 0.36, to: 0.58 },
	sliver: { color: '#F7A23F', height: 2.5 },
	strips: { firstDevicePx: 1, growth: 1.05, margin: 16 },
	waves: [{ period: 4.3, rows: 17, share: 0.5 }, { period: 3.1, rows: 11, share: 0.3 }, { period: 2.2, rows: 7, share: 0.2 }],
	shiftX: { top: 0.5, atHalf: 8 },
	shiftRow: { top: 1, bottom: 10, power: 1.2 },
	stillClock: 7.3,
	ripple: {
		bands: [0.06, 0.14, 0.24, 0.36, 0.5, 0.66, 0.82, 1],
		rowHeight: [1, 3], dash: [5, 35], jitter: 0.4, crestShare: [0.52, 0.22], crestAlpha: 0.85, troughShare: 0.25, troughAlpha: 0.55,
		drift: [1, 7], crestBRate: 0.55, life: [3, 5], stillAlpha: 0.62,
		tileMin: { wide: 1024, narrow: 512 }, tileMax: 2048, seed: 0x52495050, reach: 8,
	},
	glitter: {
		count: { wide: 120, narrow: 50, low: 30 }, width: [6, 40], height: [1, 3], life: [0.9, 1.6], peak: 0.9,
		colors: [[0, '#FFE3A6'], [0.3, '#FFBE66'], [0.7, '#F08F3F'], [1, '#C7622E']], seed: 0x474c4954,
	},
} as const

/**
 * The boat that crosses the water now and then: its length by the footer's layout (as the water's gap), `depth` px below
 * the waterline, its speed (px a second) and start (a share of the width) by width class, and the seconds it waits
 * out of sight before it returns. The scene's clock stands still while its moving parts are off screen, so `startX` is where
 * a visitor first finds the boat: a phone's is a third of the way across, in open water and clear of the left palm's trunk
 * (its wake can still run behind the trunk there), where nearer the edge the boat would stand against the trunk and its
 * wake would cross it. `bob` is how far (`px` and `pitch`, at the default weather's sea, which scales both up to
 * `miamiWater.ts`'s `ROUGHEST`) and how fast it rocks; `wake` is the V behind it (half angle in degrees, lengths
 * of boat it reaches, alpha and color) and `reflection` the px of its dark reflection. The hull and cabin are outlines with
 * x and height as shares of the length, up from the hull's foot, bow to the right; `mast` is the mast's height as a share
 * of the length.
 */
export const BOAT = {
	enabled: true,
	length: { wide: 58, narrow: 46 },
	depth: 24,
	speed: { wide: 8.5, narrow: 6 },
	startX: { wide: 0.42, narrow: 0.32 },
	pause: 90,
	bob: { px: 0.6, period: 3.5, pitch: 0.4 },
	wake: { halfAngle: 8.5, lengths: 3, alpha: 0.8, color: '#FFB066' },
	reflection: 8,
	hull: [[-0.5, 0.07], [0.52, 0.11], [0.42, -0.02], [-0.42, -0.03]],
	cabin: [[-0.24, 0.07], [-0.15, 0.17], [0.16, 0.17], [0.28, 0.09]],
	mast: 0.26,
} as const

/**
 * The low dark key the palms grow from, in the bottom corners: its height as a share of the canvas height and its reach
 * as a share of the width, by width class and side, and the seed of its irregular top.
 */
export const KEY = { wide: { left: [0.062, 0.26], right: [0.04, 0.09] }, narrow: { left: [0.052, 0.27] }, seed: 0x4b4559 } as const

/**
 * The palms. `wide` and `narrow` list one palm per entry: `crown` is [share of the width, t above the waterline] where the
 * fronds spring from, `base` the trunk's foot as a share of the width, `bow` how far the trunk bows (px), `trunk` its
 * width at the foot and the crown, `frond` the frond length, `fronds` how many, `set` which sprite set draws them and
 * `minWidth` the narrowest screen that shows the palm. `height` is the palm's real height in metres, from which the wind's
 * physics follows: how fast its trunk sways, and with its trunk's px, how big a metre is there, so where it stands and how long
 * its fronds are. The wide palms stand at one depth, so their heights keep them at one px per metre between them: a palm moved or
 * resized takes a height that keeps it so. `scale` multiplies the wide sizes by the canvas height over `per`,
 * clamped to `min` and `max`. Under `shortHeight` px tall only the shorter entry (the second of `wide`) shows. A frond is
 * at least `frondFromTrunk` of its trunk's length, and a crown lies at least `onScreen` of a frond's length below the top
 * of the canvas.
 *
 * `layout` is how a crown is put together. Its fronds gather into `clusters` clumps (the fewest and the most): the space
 * between two neighbors strays from even by `jitter`, and the space between two clumps is `clump` times as wide as one inside
 * a clump, so the crown is a burst with sky between its clumps and not an even fan. The wind streams the fronds that point
 * nearest to level: downwind they run `stream` longer and flatter, upwind shorter and fuller. The oldest fronds, which hang,
 * are `aged` shorter. `knot` is the radius of the knot at the crown as a share of a frond's length. Behind the fronds stands
 * a back layer of short, heavy fronds: how many (`count`), their `length` as a share of a frond's and their `weight` against
 * a frond's. Two hang around the trunk's top and the rest stand in the widest gaps between the fronds in front, which makes
 * the heart solid.
 *
 * `frond` is how one frond is drawn. It fans `spread` degrees either side of straight up; its length is a seeded share
 * (`length`) of the palm's, longer toward the sides by `shape`, and its droop follows `droop`, one of `variants` baked shapes.
 * `hinge` splits it into an inner and an outer sprite. `midrib` (px), `core` and `hub` give it body: the midrib's width, the
 * solid band under it and the broad foot, the last two as shares of the frond's length. Each side carries `leaflets` of
 * them, from `leafFrom` of the way along the frond, up to `leafLength` of its length at `leafAngle` degrees off the midrib
 * (at its foot and at its tip), sagging by `leafSag`, `leafWidth` px at the root and the tip.
 */
export const PALMS = {
	wide: [
		{ crown: [0.058, 0.62], base: 0.075, bow: 34, trunk: [18, 10], frond: 172, fronds: 11, set: 'large', minWidth: 0, height: 14 },
		{ crown: [0.172, 0.34], base: 0.15, bow: -14, trunk: [16, 9], frond: 128, fronds: 11, set: 'small', minWidth: 0, height: 11 },
		{ crown: [0.978, 0.32], base: 0.962, bow: 12, trunk: [14, 8], frond: 104, fronds: 10, set: 'small', minWidth: 1100, height: 10.5 },
	],
	narrow: [{ crown: [0.085, 0.52], base: 0.03, bow: -18, trunk: [13, 7.5], frond: 100, fronds: 11, set: 'large', minWidth: 0, height: 12 }],
	scale: { per: 900, min: 0.82, max: 1.25 },
	shortHeight: 500,
	frondFromTrunk: 0.3,
	onScreen: 0.8,
	layout: { clusters: [2, 3], jitter: 0.5, clump: 3.9, back: { count: [5, 6], length: 0.5, weight: 1.4 }, stream: 0.28, aged: 0.22, knot: 0.15 },
	frond: {
		spread: 124, length: [0.86, 1.06], shape: [0.66, 0.42, 1.3], droop: [0.24, 0.4, 1.3, 0.04],
		variants: 5, hinge: 0.48, midrib: 2, core: 0.05, hub: 0.15, leafLength: 0.17, leafAngle: [30, 48], leafSag: 0.5, leafWidth: [2.4, 1.6],
		leaflets: 34, leafFrom: 0.15,
	},
	seed: 0x50414c4d,
} as const

/**
 * The wind and how a tree answers it (miamiWind.ts, its gusts in miamiGusts.ts); WEATHER says which wind blows. The push is the
 * wind's drag on a crown, 1 at the default weather's mean wind `reference` (m/s): it grows as the wind to `push.power` (drag grows
 * as its square, and a crown that streamlines takes less: a Vogel number near -0.7), and gusts and eddies fade out below
 * `push.calm` m/s. All the wind does besides its mean grows with the weather's turbulence (SceneWind.turbulence), and is as listed
 * here at the default weather's. Between gusts the push wanders with the rest level, `rest` (gust levels; the push is a level over
 * `stillGust`), on three bands of the air's turbulence near `wander` seconds of the air's clock. Each `gust.every` seconds of the
 * air's clock hold one gust or none (`share` of them hold one), at a place, with a hold and a `push` drawn from a hash of the cell's
 * index, so the gusts never come round again. A gust rises over `rise`, holds and falls over `fall` seconds as it passes at the
 * reference wind, longer in a lighter wind and shorter in a stronger one, since the air carries it past faster (down to the lightest
 * wind that brings one, `push.calm`). Its push differs along its path by up to `vary` of it, over `reach` m, and it travels at
 * `pace` times the wind, so neighbouring trees feel each gust at a moment and a strength of their own. The gusts, the wander and the
 * `eddies` are frozen in the air: each reaches a tree when the air carrying it does (miamiWeather.ts's air clock), and a wind that
 * turns round brings new air. The eddies are bands at the reference wind's frequencies, from `hz` up, each about `waves.step` times
 * the last, with amplitudes as the frequency to the -1/3 (the inertial range); one longer than `coherent` m reaches every tree in
 * turn, a shorter one reaches each tree as its own, and one shorter than `crown` m reaches each frond as its own and `flap` times as
 * strong, while the trunk feels `crownShare` of it. Each band's frequency is moved by up to `waves.jitter` of it either way by a hash,
 * so no two keep a simple ratio, and its size and phase drift at random along the air, between points `waves.cycles` of its own
 * periods apart and at least `waves.least` seconds of the air's clock, so a trunk has time to follow each. The bands reach a tree at
 * the wind's pace, so a mode answers one only well away from its own frequency: not at all within `resonance.near` times it either way,
 * and in full beyond `resonance.far` times it. Near its own frequency a mode answers the air as a damped oscillator answers a
 * continuous spectrum, with a narrowband swing at that frequency whatever the wind: its size is the spectrum's at the frequency the
 * wind carries past it at that pace (the bands' amplitudes at the -1/3 power, with `crownShare` and `flap` easing to 1 between
 * `crown` and `coherent` m of an eddy's length), times the oscillator's resonant gain and `resonance.gain`; its size and phase drift
 * at random between points `resonance.span` of its decay times apart, drawn from hashes of its tree and of which air it is, never
 * from the air's clock.
 * A `trunk` is a damped oscillator of `hz` at `atHeight` m tall, going as the height's inverse
 * square (a palm's trunk keeps one diameter as it grows), within `range`, damped `zeta` plus `zetaPerWind` per m/s of wind; its
 * crown stands `lean` of its px height downwind per unit of push, turns with its tip by `tipSlope` of its offset over its height,
 * and a point lower down moves by its share of the height to `power`. A `frond` is a damped oscillator of `hz` at `atLength` m long,
 * going as the length's inverse, `spread` either way by seed, within `range`, damped as the trunk; it leans `lean` degrees at a push
 * of 1, saturating as it streamlines (`saturation`), its own motion scaled by how it hangs (`upper`, `side`, `hanging`) and by
 * `windward` on the upwind side; its outer half answers `lag` radians later at `outerShare` of it and bends further only past the
 * default's wind (`beyond`). A palm whose fronds are longer than `fullLength` px moves by that much less. A tree's natural
 * frequencies follow its size alone: the wind sets how hard and when it is pushed, and how soon its swings die out (which
 * slows a gust's ring by at most 2.2% for a trunk and 6.3% for a frond at `WEATHER.strongest`), never the natural pace
 * it sways at. `flutter` is the outer half's shear, at most `most` px, on seeded periods of the scene's clock: it grows as the push
 * squared at first, and is half of `most` where that square is `half`.
 */
export const WIND = {
	reference: 5,
	push: { power: 1.3, calm: 1.2 },
	rest: [0.22, 0.36],
	wander: 40,
	stillGust: 0.3,
	gust: { every: 13, share: 0.6, rise: 1.4, hold: [0.5, 1.2], fall: 4, push: [0.55, 0.95], vary: 0.25, reach: [150, 400], pace: [0.85, 1.15], seed: 0x47555354 },
	eddies: { hz: 0.07, count: 7, coherent: 18, crown: 8, crownShare: 0.4, flap: 2 },
	waves: { step: 1.6, jitter: 0.08, cycles: 3, least: 80 },
	resonance: { gain: 1, span: 1.5, near: 2.5, far: 3.5 },
	trunk: { lean: 0.0064, hz: 0.25, atHeight: 12, range: [0.12, 0.45], zeta: 0.05, zetaPerWind: 0.008, tipSlope: 4 / 3, power: 1.8 },
	frond: {
		lean: 9.5, saturation: 0.6, beyond: 0.25, hz: 0.6, atLength: 4, spread: 0.1, range: [0.3, 1.6], zeta: 0.15, zetaPerWind: 0.01,
		upper: [0.5, 0.85], side: [0.75, 1.3], hanging: [0.95, 1.65], windward: 0.35, lag: 0.8, outerShare: 0.7, fullLength: 172,
	},
	flutter: { period: [0.7, 1.2], most: 4, half: 15 },
} as const

/**
 * The weather: one for the whole scene (miamiWeather.ts eases it on the scene's clock, miamiWind.ts makes its wind). A weather is
 * how strong the wind is, `strength` (its mean at the palms' crowns, m/s, at most `strongest`), and which way it blows, `direction`
 * (1 toward the right, -1 toward the left); all else follows from those two. How gusty it is follows from its strength: the eddies'
 * share of the mean wind is `turbulence.strong` plus `turbulence.light` m/s over the wind, at most `turbulence.most` (a light wind
 * meanders by a few tenths of a m/s whatever its mean, and a strong one's eddies grow with it), times a preset's `gustiness` where
 * one is set. How rough the sea is follows from it too, by Cox and Munk's law: its slopes' variance is `sea.calm` plus
 * `sea.perWind` per m/s of wind. Where the water meets copy, miamiWater.ts bounds what it takes from that. A visit starts in
 * `start`. 'breeze' is the scene as designed: its still pose is the art-directed frame; 'storm' blows at `strongest`, the most the
 * knob takes.
 */
export const WEATHER = {
	start: 'breeze',
	strongest: 20,
	turbulence: { strong: 0.09, light: 0.15, most: 0.3 },
	sea: { calm: 0.003, perWind: 0.00512 },
	presets: {
		calm: { strength: 1.5, direction: 1 },
		breeze: { strength: 5, direction: 1 },
		fresh: { strength: 8.5, direction: 1 },
		gale: { strength: 14, direction: 1 },
		storm: { strength: 20, direction: 1 },
	},
} as const

/**
 * Frames a second the scene's ambient motion draws: `fps` normally, `narrowFps` on phones, `slowFps` once adaptive quality
 * or the scene's own tier has stepped down. `softwareCost` is how many sky frames one scene frame costs on a
 * software-rasterized canvas, which decides when the scene holds still there.
 */
export const SCENE_PACING = { fps: 30, narrowFps: 30, slowFps: 20, softwareCost: 3 } as const

/**
 * The wings: the scene's light falling off toward the screen's edge under each side rail, so the rail's copy keeps its
 * contrast over anything the scene puts behind it, the boat's wake included.
 *
 * Above the water a wing is a field full behind the rail's copy and all the way down from it, to `past` px beyond its
 * inner edge and from the sky's padding above its highest line down to the screen's foot, that fades out across the
 * screen over `feather` (a share of the width, at least `min` px) and up it over `top` of the height: the scene darkening
 * toward the screen's lower corner, with no edge below the copy to stand on open sky. It is `color`, raised to the page's
 * navy in any channel the navy is lighter in, drawn with the darken blend from the baked sky's top down: it takes each
 * channel's light toward that color's and never under it, so the night sky and the near towers stay as they are and no
 * smooth darkening over flat navy can show bands. `color` is the navy with its red raised to its green, so a warm cloud or
 * band keeps its red over its green as it dims and never turns green. The field is only as strong as the brightest sky or
 * cloud that can stand behind the copy at that scroll needs to stay under the copy's ceiling, with the ramp's margin (the
 * sky the towers stand in front of needs none): the rails' copy is body text, whose headroom the page measures at
 * `contrast.measured`:1, and under prefers-contrast: more it keeps `contrast.more`:1. So it is faint where that ground is
 * dark and gone where it is navy. Each height's need is softened over `soften` px, and the sky within `soft` px of where it
 * shows behind the copy (above or below the copy's rows, or behind the water or the towers under them) counts for less the
 * farther it stands: the field comes on before the sky that needs it shows, and changes by at most 1.5 / `soft` of its
 * most per px of scroll, so it never steps.
 *
 * From the water's top down to the screen's foot it is `waterColor` at `alpha` (`moreAlpha` under more), which holds the
 * copy over the brightest thing in the water, the wake over a crest, and fades across over `waterFeather`; it comes on
 * over the last `waterOn` px of the waterline's climb to the copy's last line, full from there, and its top is the
 * water's, under the low base's dark band.
 *
 * A side's wing may show from as far above its `need` as either part comes on (the stage's WING_LEAD), and is gone `ease`
 * px of scroll above that. `scale` is the CSS px a pixel of its baked fields covers: they are smooth, and drawn smoothed.
 */
export const WING = {
	color: '#19192F',
	waterColor: '#120A0E',
	alpha: 0.78,
	moreAlpha: 0.92,
	past: 8,
	ease: 120,
	feather: { share: 0.22, min: 220 },
	waterFeather: { share: 0.3, min: 280 },
	top: 0.45,
	soften: 120,
	soft: 160,
	waterOn: 160,
	scale: 4,
	contrast: { measured: 4.5, more: 7 },
} as const
