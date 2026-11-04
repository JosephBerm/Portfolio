/**
 * The sky's long-lived bodies; so far the comet. A comet is not a transient. It hangs on the sky, so the camera moves it
 * as it moves the faint stars, and it drifts on its own as a comet does, slowly, a day a minute, as a function of the
 * drift clock, so it stops whenever the drift does. It fades in over seconds instead of lighting up, and it stays until
 * the page scrolls from where it began to show, the sky is paused or resized, copy comes near it or it has glided off
 * the right edge. Then it is gone for the page view. It never lights the copy: it shows only where its whole box keeps
 * clear of every quiet zone's reach. This module is its model, pure functions over a body's state: where it hangs and
 * drifts, the light of its head, tails and knots, its fades, the box test and its start rule. The worker keeps the state
 * and feeds them what it knows, and renderSky draws what they return. It imports only types from transients.ts.
 */

import { driftAt, type Vec } from './camera'
import { nearness } from './catalog'
import { COMET, LAYERS, LEAN, MAGNITUDE, METEOR, SCENE, SCROLL_CANCEL, TRANSIENTS } from './config'
import type { Point } from './meteors'
import { easeEnded, easing, fadeOutAt } from './pacing'
import type { SkyRect } from './protocol'
import { ZONE_REACH, zoneReaches } from './quietIndex'
import { skyWindow } from './radiants'
import type { Random } from './random'
import { scrollKept, smoothstep, type QuietBlend } from './scene'
import type { LaunchGate, SkyField } from './transients'

/** Radians per degree. */
const DEG = Math.PI / 180

/**
 * Nearness of a body that hangs among the faint majority of stars, the mean of the far band's (0.293): stars of a
 * magnitude are 10^(slope m) times as many, and each is as near as its magnitude says (DEPTH).
 */
export const BODY_NEARNESS = farBandNearness()

/** The mean nearness of the far band's stars, weighting each magnitude of the band by how many stars it holds. */
function farBandNearness(): number {
	const [from, to] = LAYERS.far.magnitude
	const slices = 256
	let sum = 0
	let weight = 0
	for (let i = 0; i < slices; i++) {
		const m = from + ((i + 0.5) / slices) * (to - from)
		const share = 10 ** (MAGNITUDE.slope * m)
		sum += share * nearness(m)
		weight += share
	}
	return sum / weight
}

/**
 * How far the pointer's lean carries something of BODY_NEARNESS either way (CSS px, on either axis): LEAN.reach times how
 * much of the camera's motion the body shows. The pointer is not known when a comet's path is swept, so the sweep allows
 * for this much and COMET.clearance covers what a swing of the pointer across the window adds.
 */
const LEAN_REACH = BODY_NEARNESS * LEAN.reach

/** A box in CSS px. */
interface Box {
	left: number
	top: number
	right: number
	bottom: number
}

/** The light of the comet's parts at one place: what each adds (0 to 1 of its tint), and the share of the coma's light that is mint. */
export interface CometLight {
	coma: number
	mint: number
	dust: number
	ion: number
}

/** The unit vector the ion tail's axis points along on screen (y down). */
const AXIS = { x: Math.cos(COMET.angle * DEG), y: Math.sin(COMET.angle * DEG) }

/** The ion tail's rays with the cosine and sine of their angle off the axis, and the unit vector each points along on screen: the axis turned clockwise by that angle. */
const ION_RAYS = COMET.ion.rays.map(({ off, share }) => {
	const cos = Math.cos(off * DEG)
	const sin = Math.sin(off * DEG)
	return { share, cos, sin, dirX: AXIS.x * cos - AXIS.y * sin, dirY: AXIS.y * cos + AXIS.x * sin }
})

/** How much of the ion tail's light is left `distance` degrees down a ray: it falls as 1 / (1 + distance / scale). */
function ionFalloff(distance: number): number {
	return (1 + distance / COMET.ion.scale) ** -1
}

/** How much of the ion tail's light its end leaves at `distance` degrees: all of it until `fadeFrom` of the length, easing to none at the length. */
function ionFade(distance: number): number {
	return 1 - smoothstep(COMET.ion.fadeFrom * COMET.ion.length, COMET.ion.length, distance)
}

/** The width of the ion tail's rays `distance` degrees down a ray (one standard deviation, degrees): `width[0]`, widening by `width[1]` a degree. */
function ionWidth(distance: number): number {
	return COMET.ion.width[0] + COMET.ion.width[1] * distance
}

/**
 * The comet's light at a point `xi` degrees along the axis its tails point along, away from the Sun, and `eta` degrees
 * across it toward the side the dust tail bends to, written to `out`. It is the one place the look's math lives, read by
 * both the scan for the comet's box and the painter of its bitmap.
 */
export function cometLight(xi: number, eta: number, out: CometLight): void {
	const { coma, dust, ion } = COMET
	const rho = Math.hypot(xi, eta)
	// The coma: light falling as 1/rho from a softened core, cut off at its radius, over a broad halo
	out.coma =
		rho < 2 * coma.radius
			? (coma.peak / (1 + rho / coma.core)) * Math.exp(-((rho / coma.radius) ** 2)) + coma.halo * Math.exp(-((rho / coma.haloRadius) ** 2))
			: 0
	out.mint = smoothstep(coma.mintFrom, coma.mintTo, rho)
	// The dust tail: every grain size lags the axis as the 1.5 power of the distance along it, so the ridge does, in a fan from a parabolic cap
	out.dust = 0
	if (xi > -2.2 * dust.cap && xi < dust.length) {
		const bend = Math.max(0, xi / dust.length) ** 1.5
		const capWidth = Math.sqrt(4 * dust.cap * Math.max(xi + dust.cap, 1e-6))
		// Across the ridge: a sharp edge on the side toward the ion tail (negative), a diffuse one on the other
		const delta = eta - dust.lag * dust.length * bend
		const width = delta < 0 ? capWidth * dust.convex : (capWidth + dust.spread * dust.length * bend) * dust.concave
		const along =
			(xi > 0 ? (1 + xi / dust.scale) ** -dust.power : 1) *
			(1 - smoothstep(dust.fadeFrom * dust.length, dust.length, xi)) *
			smoothstep(-1.6 * dust.cap, 0, xi) *
			(dust.headKeep + (1 - dust.headKeep) * smoothstep(0, dust.headTo, xi))
		out.dust = dust.peak * along * Math.exp(-((delta / width) ** 2))
	}
	// The ion tail: narrow rays from the head, widening downstream
	out.ion = 0
	for (const ray of ION_RAYS) {
		const distance = xi * ray.cos - eta * ray.sin
		if (distance <= 0 || distance >= ion.length) continue
		const across = eta * ray.cos + xi * ray.sin
		out.ion +=
			ion.peak *
			ray.share *
			ionFalloff(distance) *
			ionFade(distance) *
			Math.exp(-((across / ionWidth(distance)) ** 2)) *
			smoothstep(0, 0.4, distance)
	}
}

/** cometLight at the screen point `x` degrees right of the nucleus and `y` below it. */
export function cometLightAt(x: number, y: number, out: CometLight): void {
	cometLight(x * AXIS.x + y * AXIS.y, x * AXIS.y - y * AXIS.x, out)
}

/** One knot gliding outward along the ion tail: its place from the nucleus (CSS px), the unit vector of its ray, its light (0 to 1 of the knot sprite's) and its standard deviation along the ray and across it (CSS px). */
export interface CometKnot {
	x: number
	y: number
	dirX: number
	dirY: number
	light: number
	long: number
	wide: number
}

/** The golden ratio's fractional part: knots that far apart in phase never bunch up, however many there are. */
const KNOT_PHASE = 0.618034

/**
 * Writes where each of the ion tail's knots is at drift-clock time `clock` (s), for a window of `unit` CSS px a degree. A
 * knot is born near the head every COMET.knots.period s, glides outward faster and faster along one of the first rays,
 * fades in as it is born and out well before the tail's end, and has a brightness of its own (0.6 to 1 of the peak). It
 * is a pure function of the clock, so a pause freezes it and a returning tab never jumps it, and it neither breathes nor
 * twinkles: only the stars do.
 */
export function cometKnots(clock: number, unit: number, knots: CometKnot[]): void {
	const config = COMET.knots
	for (const [n, knot] of knots.entries()) {
		const ray = ION_RAYS[n % config.rays]
		if (!ray) continue
		const tau = (clock / config.period + n * KNOT_PHASE) % 1
		const age = tau * config.period
		const distance = config.from + config.v0 * age + 0.5 * config.accel * age * age
		knot.x = ray.dirX * distance * unit
		knot.y = ray.dirY * distance * unit
		knot.dirX = ray.dirX
		knot.dirY = ray.dirY
		knot.light =
			config.peak *
			smoothstep(0, 0.1, tau) *
			(1 - smoothstep(0.62, 1, tau)) *
			(0.6 + 0.4 * Math.sin(n * 12.9898) ** 2) *
			ionFalloff(distance) *
			ionFade(distance)
		knot.long = config.long * unit * (1 + distance / config.stretch)
		knot.wide = config.wide * ionWidth(distance) * unit
	}
}

/** The least light that shows on the sky: one level of 255. */
const SEEN = 1 / 255

/** The step of the scan for the comet's extent, and the margin the box keeps around what shows (degrees). */
const SCAN_STEP = 0.25

/** What shows of the comet in degrees of the sky window from its nucleus, on screen axes (y down): a box around all of it and the place each tail shows farthest. */
interface CometExtent {
	box: Box
	dustTip: Point
	ionTip: Point
}

/** The comet's extent, found on first use: a visit with no comet never scans. */
let extent: CometExtent | null = null

/**
 * Where the comet's light shows, by scanning cometLight over a square that holds its longest reach: the box around every
 * place whose light adds to at least one level, padded by a step, and the farthest place each of the dust and the ion
 * tail shows at. It follows the config, so a changed tail or angle never leaves a stale box.
 */
function cometExtent(): CometExtent {
	if (extent) return extent
	const { dust, ion } = COMET
	const reach = Math.ceil(Math.max(ion.length, Math.hypot(dust.length, dust.lag * dust.length)))
	const light: CometLight = { coma: 0, mint: 0, dust: 0, ion: 0 }
	const box: Box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
	const dustTip = { x: 0, y: 0 }
	const ionTip = { x: 0, y: 0 }
	let dustFar = 0
	let ionFar = 0
	for (let y = -reach; y <= reach; y += SCAN_STEP) {
		for (let x = -reach; x <= reach; x += SCAN_STEP) {
			cometLightAt(x, y, light)
			const far = Math.hypot(x, y)
			if (light.dust >= SEEN && far > dustFar) {
				dustFar = far
				dustTip.x = x
				dustTip.y = y
			}
			if (light.ion >= SEEN && far > ionFar) {
				ionFar = far
				ionTip.x = x
				ionTip.y = y
			}
			if (light.coma + light.dust + light.ion < SEEN) continue
			box.left = Math.min(box.left, x)
			box.top = Math.min(box.top, y)
			box.right = Math.max(box.right, x)
			box.bottom = Math.max(box.bottom, y)
		}
	}
	extent = { box: { left: box.left - SCAN_STEP, top: box.top - SCAN_STEP, right: box.right + SCAN_STEP, bottom: box.bottom + SCAN_STEP }, dustTip, ionTip }
	return extent
}

/** The comet's size and extent relative to its nucleus (CSS px, y down), for one size of sky window. */
export interface CometShape {
	/** CSS px a degree of the sky window spans: the art and the box are drawn at this scale. */
	unit: number
	/** The box around everything that shows, which the placement and the clear-of-copy test use. */
	box: Box
	/** Where each tail shows farthest from the nucleus: with the nucleus, the places that copy coming near dims all of the comet from. */
	dustTip: Point
	ionTip: Point
	/** How far its own drift carries it in a second of drift clock (CSS px): the sky window's pace, which does not shrink with the comet. */
	driftX: number
	driftY: number
}

/** Where a body is in its life. */
export type BodyStatus = 'waiting' | 'showing' | 'gone'

/** A long-lived body hung in the sky. Times are seconds; the fade-in runs on the clock that leaves out hidden time. */
export interface SkyBody {
	status: BodyStatus
	/** This visit hangs one: the draw made at the reveal. */
	planned: boolean
	/** Seconds after the reveal before its start rule is next looked at: the first delay, then a wait after no place fit. */
	nextAt: number
	/** Where its nucleus hangs on the sky (CSS px) before its own drift: the place it was put on screen plus its nearness times the camera's offset then. Set once it shows. */
	x: number
	y: number
	/** Its size and extent, laid out for the sky window it was placed in; null until it shows. */
	shape: CometShape | null
	/** When it began to show, on the twinkle clock. */
	startedAt: number
	/** The drift clock (Camera.clock, s) when it began to show: its own drift is what it has run since. */
	startClock: number
	/** Its knots, rewritten for every frame it shows (reused, so a frame makes no garbage). */
	knots: CometKnot[]
	/** scrollY when it began to show: the page may scroll SCROLL_CANCEL.to px from there before it is gone. */
	launchScrollY: number
	/** When copy first came within reach of its box (worker clock); it fades out over TRANSIENTS.cancelFade from then. Null while its box has been clear. */
	boxFailedAt: number | null
	/** When the sky was paused or turned to reduced motion (worker clock): it fades out over TRANSIENTS.cancelFade. Null while it hasn't been. */
	pausedAt: number | null
}

/** A body that has not been revealed yet: nothing drawn, and its start rule waits for the first delay. */
export function createSkyBody(): SkyBody {
	return {
		status: 'waiting',
		planned: false,
		nextAt: COMET.firstDelay,
		x: 0,
		y: 0,
		shape: null,
		startedAt: 0,
		startClock: 0,
		knots: Array.from({ length: COMET.knots.count }, () => ({ x: 0, y: 0, dirX: 0, dirY: 0, light: 0, long: 0, wide: 0 })),
		launchScrollY: 0,
		boxFailedAt: null,
		pausedAt: null,
	}
}

/** The page is revealed: the visit draws whether it hangs a comet (COMET.chance). */
export function revealBody(body: SkyBody, random: Random): void {
	body.planned = random() < COMET.chance
}

/** Whether the body shows. The launch gate reports it, so no shooting star is planned near the copy while it does. */
export function bodyShowing(body: SkyBody): boolean {
	return body.status === 'showing'
}

/** Whether the launch gate is in the scene the comet shows in, the hero. */
function inHero(gate: LaunchGate): boolean {
	return gate.allowed && gate.scene === 'hero'
}

/**
 * Whether the comet may start to show: it is planned for this visit and still waiting, the sky is in the hero under full
 * motion with the visitor here, the page has been still for a while, the screen is wide, its first delay (or its wait
 * after no place fit) is over, and no shooting star holds the ink lease. It keeps the sky's one bright moment near the
 * copy to a shooting star's, so it starts only while none does, and none takes the lease while it shows (LaunchGate.bodyShowing).
 */
export function bodyMayStart(body: SkyBody, gate: LaunchGate, leaseHeld: boolean): boolean {
	return body.status === 'waiting' && body.planned && inHero(gate) && gate.settled && !gate.narrow && gate.sinceReveal >= body.nextAt && !leaseHeld
}

/**
 * The comet laid out for a screen of this size: its parts scale with the sky window (SKY_WINDOW), so it looks the same
 * size on the sky at any screen size, times `size`, the share of its full size a window with too little room for all of it
 * gives it. Its own drift keeps the window's pace, whatever its size. The box is rounded out to whole CSS px, so the
 * pixels of the comet's art line up with the screen's and fall the same way about the nucleus in every window, which is
 * what its brightest pixel depends on.
 */
export function cometShape(width: number, height: number, size = 1): CometShape {
	const windowUnit = (skyWindow(width, height).focal * Math.PI) / 180
	const unit = windowUnit * size
	const { box, dustTip, ionTip } = cometExtent()
	const pace = COMET.drift.speed * windowUnit
	const heading = COMET.drift.heading * DEG
	return {
		unit,
		box: { left: Math.floor(box.left * unit), top: Math.floor(box.top * unit), right: Math.ceil(box.right * unit), bottom: Math.ceil(box.bottom * unit) },
		dustTip: { x: dustTip.x * unit, y: dustTip.y * unit },
		ionTip: { x: ionTip.x * unit, y: ionTip.y * unit },
		driftX: Math.cos(heading) * pace,
		driftY: Math.sin(heading) * pace,
	}
}

/** The line a zone's reach above About's header row (CSS px from the top of the screen) once the page has scrolled as far as a comet can still show; findPlace keeps the comet's box above it along its whole path. */
function lowestBox(width: number, height: number): number {
	let below = 0
	for (const [from, offset] of COMET.aboutRow) if (width >= from) below = offset
	return height * (1 - SCENE.heroLaunchMaxScroll) + below - SCROLL_CANCEL.to - ZONE_REACH
}

/** Whether the box [x0, x1] × [y0, y1] keeps out of the reach of every zone. */
function clearOfZones(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): boolean {
	for (const zone of zones) if (zoneReaches(zone, x0, y0, x1, y1)) return false
	return true
}

/** Seconds of drift clock between the samples of a comet's path: in that time it moves a few px, far less than COMET.clearance. */
const PATH_STEP = 2

/**
 * Where the comet's nucleus is, relative to where it started, every PATH_STEP seconds of drift clock from `clock` for
 * `life` seconds (the first sample is the start): the camera law, BODY_NEARNESS times the drift's change, the other way,
 * plus its own drift. Both are functions of the drift clock, so the whole path is known when the comet starts.
 */
function cometPath(shape: CometShape, clock: number, life: number): Point[] {
	const from = driftAt(clock, { x: 0, y: 0 })
	const now: Vec = { x: 0, y: 0 }
	const path: Point[] = []
	for (let t = 0; t <= life; t += PATH_STEP) {
		driftAt(clock + t, now)
		path.push({ x: shape.driftX * t - BODY_NEARNESS * (now.x - from.x), y: shape.driftY * t - BODY_NEARNESS * (now.y - from.y) })
	}
	return path
}

/**
 * Where the comet's nucleus goes on screen, or null when no place fits, for a comet that starts at drift clock `clock`
 * and keeps clear for `life` seconds of it. Its path is known (cometPath), so its box is swept along it, grown by
 * COMET.clearance and the pointer's lean (LEAN_REACH, either way), and at every sample must keep clear of the reach of
 * every zone of the field (the padded hero, Contact and footer copy and the side rails), lie below the navbar
 * (METEOR.top) and above About's header row, copy the zones know nothing of, and keep its head inside the screen
 * (METEOR.edgeMargin). The box may overflow the right edge, where no copy lies, which is how the comet leaves. Of the
 * places on a COMET.step grid that fit, it takes the one nearest COMET.anchor.
 */
export function findPlace(field: SkyField, shape: CometShape, clock: number, life: number): Point | null {
	const { width, height } = field
	const { left, top, right, bottom } = shape.box
	const margin = COMET.clearance + LEAN_REACH
	const lowest = lowestBox(width, height)
	const y0 = METEOR.top + margin - top
	const y1 = lowest - margin - bottom
	if (y1 < y0) return null
	const path = cometPath(shape, clock, life)
	// A zone below the line of About's row reaches no box above it
	const zones = field.quiet.filter((zone) => zone.y - ZONE_REACH <= lowest)
	const anchorX = COMET.anchor[0] * width
	const anchorY = COMET.anchor[1] * height
	const x0 = METEOR.edgeMargin - left
	const x1 = width - METEOR.edgeMargin
	const staysClear = (x: number, y: number) =>
		path.every((step) => {
			const px = x + step.x
			const py = y + step.y
			if (px > x1 || py + top - margin < METEOR.top || py + bottom + margin > lowest) return false
			return clearOfZones(zones, px + left - margin, py + top - margin, px + right + margin, py + bottom + margin)
		})
	let best: Point | null = null
	let nearest = Infinity
	for (let y = y0; y <= y1; y += COMET.step) {
		for (let x = x0; x <= x1; x += COMET.step) {
			const distance = Math.hypot(x - anchorX, y - anchorY)
			if (distance >= nearest) continue
			if (staysClear(x, y)) {
				best = { x, y }
				nearest = distance
			}
		}
	}
	return best
}

/**
 * The size and place of a comet that starts at drift clock `clock`, or null when none fits. It takes the largest of
 * COMET.sizes whose path stays clear for COMET.life[0] seconds and, only where none does, the largest that stays clear for
 * COMET.life[1], so a comet that is seen for a while is never traded for a larger one that is soon gone.
 */
function placeComet(field: SkyField, clock: number): { shape: CometShape; place: Point } | null {
	for (const life of COMET.life) {
		for (const size of COMET.sizes) {
			const shape = cometShape(field.width, field.height, size)
			const place = findPlace(field, shape, clock, life)
			if (place) return { shape, place }
		}
	}
	return null
}

/** The share of its light the page's scroll and the fades of the box and the pause leave a showing body (scrollKept); 0 means it is gone. */
function bodyKept(body: SkyBody, time: number, scrollY: number): number {
	return scrollKept(body.launchScrollY, scrollY, fadeOutAt(body.boxFailedAt, TRANSIENTS.cancelFade, time) * fadeOutAt(body.pausedAt, TRANSIENTS.cancelFade, time))
}

/** What the worker knows at a tick, for the body's step: the launch gate (its scroll and its field), the lease, the clocks and the camera. */
export interface BodyStep {
	gate: LaunchGate
	/** An active transient holds the ink lease. */
	leaseHeld: boolean
	/** Seconds on the worker clock. */
	time: number
	/** Seconds on the clock that leaves out the time the tab was hidden. */
	twinkleTime: number
	/** When the last frame was drawn, on each of the two clocks. */
	drawnAt: number
	twinkleDrawnAt: number
	/** The camera's offset now (CSS px at nearness 1). */
	offset: Vec
	/** The drift clock now (Camera.clock, s). */
	clock: number
}

/** Whether a fade of a showing body has just run out while the last frame drawn still showed it part way: one more frame shows its end. */
function fadeEnded(body: SkyBody, step: BodyStep): boolean {
	return (
		easeEnded(body.startedAt, COMET.fadeIn, step.twinkleTime, step.twinkleDrawnAt) ||
		easeEnded(body.boxFailedAt, TRANSIENTS.cancelFade, step.time, step.drawnAt) ||
		easeEnded(body.pausedAt, TRANSIENTS.cancelFade, step.time, step.drawnAt)
	)
}

/**
 * One tick. A showing body that has kept no light is gone for good. A waiting one starts if its rule allows and a place
 * fits for the drift clock now: it takes the scroll where it starts as the page's scroll cancel measures from it, and
 * hangs where the camera's offset puts that place on screen now; if none fits it waits COMET.retry seconds, and then
 * tries from a new drift clock, so along a new path. Returns whether the sky changed or a fade has just run out, so the
 * worker draws a frame.
 */
export function updateBody(body: SkyBody, step: BodyStep): boolean {
	const { gate } = step
	if (body.status === 'showing') {
		if (bodyKept(body, step.time, gate.scrollY) > 0) return fadeEnded(body, step)
		body.status = 'gone'
		return true
	}
	if (!bodyMayStart(body, gate, step.leaseHeld)) return false
	const placed = placeComet(gate.field(), step.clock)
	if (!placed) {
		body.nextAt = gate.sinceReveal + COMET.retry
		return false
	}
	body.status = 'showing'
	body.shape = placed.shape
	body.x = placed.place.x + BODY_NEARNESS * step.offset.x
	body.y = placed.place.y + BODY_NEARNESS * step.offset.y
	body.startedAt = step.twinkleTime
	body.startClock = step.clock
	body.launchScrollY = gate.scrollY
	return true
}

/** The sky is paused or turned to reduced motion: a showing body fades out over TRANSIENTS.cancelFade and is gone. */
export function cancelBody(body: SkyBody, time: number): void {
	if (body.status === 'showing') body.pausedAt ??= time
}

/** The viewport changed: its place and its distance from About's header row were for the old one, so a showing body is gone. A waiting one is placed afresh when it starts. */
export function dropBody(body: SkyBody): void {
	if (body.status === 'showing') body.status = 'gone'
}

/** True while a showing body's fade-in or a fade-out of it runs: fade frames show it. */
export function bodyFading(body: SkyBody, time: number, twinkleTime: number): boolean {
	return (
		body.status === 'showing' &&
		(easing(body.startedAt, COMET.fadeIn, twinkleTime) || easing(body.boxFailedAt, TRANSIENTS.cancelFade, time) || easing(body.pausedAt, TRANSIENTS.cancelFade, time))
	)
}

/** What the worker knows at a drawn frame, for the body's view: the clocks, the scroll, the camera, the screen and the zones on screen. */
export interface BodyFrame {
	/** Seconds on the worker clock. */
	time: number
	/** Seconds on the clock that leaves out the time the tab was hidden. */
	twinkleTime: number
	scrollY: number
	/** The camera's offset (CSS px at nearness 1). */
	offset: Vec
	/** The drift clock (Camera.clock, s). */
	clock: number
	/** The screen's width (CSS px). */
	width: number
	/** The zones on screen as the frame draws them; the box answers to `to` and a waiting layout's `next`. */
	quiet: QuietBlend
}

/** The comet at one drawn frame: where its nucleus is on screen, how much of its light shows and where its knots are. */
export interface CometView {
	x: number
	y: number
	/** The light it shows, 0 to 1: its fade-in times the share the scroll and the fades leave. */
	light: number
	shape: CometShape
	/** The ion tail's knots relative to the nucleus: the body's own reused list, rewritten by each view. */
	knots: readonly CometKnot[]
}

/**
 * The comet as one drawn frame shows it, or null when none shows. It hangs where the camera carries it and drifts on its
 * own: the drift clock's time since it began to show, times its pace. It is gone once its whole box is past the right
 * edge, where no copy lies. Its box is tested against the zones the frame answers to (the layout it is easing to and one
 * waiting), whose copy and the comet both move, and the first time copy comes within reach it starts to fade out and is
 * gone for good.
 */
export function bodyView(body: SkyBody, frame: BodyFrame): CometView | null {
	const { shape } = body
	if (body.status !== 'showing' || !shape) return null
	const flown = frame.clock - body.startClock
	const x = body.x - BODY_NEARNESS * frame.offset.x + shape.driftX * flown
	const y = body.y - BODY_NEARNESS * frame.offset.y + shape.driftY * flown
	if (x + shape.box.left >= frame.width) {
		body.status = 'gone'
		return null
	}
	if (body.boxFailedAt === null) {
		const { left, top, right, bottom } = shape.box
		const x0 = x + left
		const y0 = y + top
		const x1 = x + right
		const y1 = y + bottom
		if (!clearOfZones(frame.quiet.to, x0, y0, x1, y1) || (frame.quiet.next && !clearOfZones(frame.quiet.next, x0, y0, x1, y1))) body.boxFailedAt = frame.time
	}
	const kept = bodyKept(body, frame.time, frame.scrollY)
	if (kept <= 0) {
		body.status = 'gone'
		return null
	}
	cometKnots(frame.clock, shape.unit, body.knots)
	return { x, y, light: smoothstep(0, COMET.fadeIn, frame.twinkleTime - body.startedAt) * kept, shape, knots: body.knots }
}
