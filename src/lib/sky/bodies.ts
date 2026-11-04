/**
 * The sky's long-lived bodies; so far the comet. A comet is not a transient. It hangs on the sky, so the camera moves it
 * as it moves the faint stars, and it drifts on its own as a comet does, slowly, a day a minute, as a function of the
 * drift clock, so it stops whenever the drift does. It fades in over seconds instead of lighting up, and it stays until
 * the page scrolls from where it began to show, the sky is paused or resized, copy comes near it or it has glided off
 * the right edge. Then it is gone for the page view. It never lights the copy: it shows only where its whole box keeps
 * clear of every quiet zone's reach. This module is its model, pure functions over a body's state: where it hangs and
 * drifts, its fades, the box test and its start rule. What it looks like and how fast it drifts (the light of its head,
 * tails and knots, its size and box, the pace of its drift) is comet.ts's: skyAssets paints the comet's bitmap from it, and
 * this module reads its box and its pace. The worker keeps the state and feeds the functions what it knows, and renderSky
 * draws what they return. It imports only types from transients.ts.
 */

import { driftAt, type Vec } from './camera'
import { nearness } from './catalog'
import { cometDrift, cometKnots, cometShape, type CometKnot, type CometShape } from './comet'
import { COMET, LAYERS, LEAN, MAGNITUDE, METEOR, SCENE, SCROLL_CANCEL, TRANSIENTS } from './config'
import type { Point } from './meteors'
import { easeEnded, easing, fadeOutAt } from './pacing'
import type { SkyRect } from './protocol'
import { ZONE_REACH, zoneReaches } from './quietIndex'
import type { Random } from './random'
import { scrollKept, smoothstep, type QuietBlend } from './scene'
import type { LaunchGate, SkyField } from './transients'

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
	/** How far its own drift carries it in a second of drift clock (CSS px): the pace of the sky window it was placed in (cometDrift), the pace its path was swept at. Set once it shows. */
	drift: Vec
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
		drift: { x: 0, y: 0 },
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
 * plus its own drift at the pace `drift` gives (cometDrift). Both are functions of the drift clock, so the whole path is
 * known when the comet starts.
 */
function cometPath(drift: Vec, clock: number, life: number): Point[] {
	const from = driftAt(clock, { x: 0, y: 0 })
	const now: Vec = { x: 0, y: 0 }
	const path: Point[] = []
	for (let t = 0; t <= life; t += PATH_STEP) {
		driftAt(clock + t, now)
		path.push({ x: drift.x * t - BODY_NEARNESS * (now.x - from.x), y: drift.y * t - BODY_NEARNESS * (now.y - from.y) })
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
	const path = cometPath(cometDrift(width, height), clock, life)
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
	const field = gate.field()
	const placed = placeComet(field, step.clock)
	if (!placed) {
		body.nextAt = gate.sinceReveal + COMET.retry
		return false
	}
	body.status = 'showing'
	body.shape = placed.shape
	body.drift = cometDrift(field.width, field.height)
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
	const x = body.x - BODY_NEARNESS * frame.offset.x + body.drift.x * flown
	const y = body.y - BODY_NEARNESS * frame.offset.y + body.drift.y * flown
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
