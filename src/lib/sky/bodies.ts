/**
 * The sky's long-lived bodies; so far the static comet. A comet is not a transient. It hangs on the sky, so the camera
 * moves it as it moves the faint stars and it never moves on its own; it fades in over seconds instead of lighting up,
 * and it stays until the page scrolls from where it began to show, the sky is paused or resized, or copy comes near it.
 * Then it is gone for the page view. It never lights the copy: it shows only where its whole box keeps clear of every
 * quiet zone's reach. This module is its model, pure functions over a body's state: where it hangs, its fades, the box
 * test and its start rule. The worker keeps the state and feeds them what it knows, and renderSky draws what they
 * return. It imports only types from transients.ts.
 */

import { DRIFT_REACH, type Vec } from './camera'
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

/** Segments the dust tail's spine is drawn in. */
const DUST_STEPS = 12

/** How the dust tail widens along its length: its width grows as the share of the length to this power, so it fans out near the tip. */
const DUST_WIDEN = 0.85

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
 * How far the camera can carry something of BODY_NEARNESS from where it starts to show (CSS px, on either axis): the
 * drift as far as it reaches from any start (DRIFT_REACH) and the pointer's lean from one edge of the window to the
 * other (twice LEAN.reach), times how much of the camera's motion the body shows. The comet's box grown by it, on every
 * side, is the room the camera can take it through, which must hold nothing it may not meet.
 */
export const BODY_REACH = BODY_NEARNESS * (DRIFT_REACH + 2 * LEAN.reach)

/** A box in CSS px. */
interface Box {
	left: number
	top: number
	right: number
	bottom: number
}

/** The straight ion tail: the unit direction it points in from the nucleus, its length, and its width at the nucleus and at the tip. */
export interface IonTail {
	dirX: number
	dirY: number
	length: number
	head: number
	tip: number
}

/** One sample of the dust tail's spine: its place relative to the nucleus, the unit normal to the spine there and half the tail's width. */
export interface DustPoint {
	x: number
	y: number
	nx: number
	ny: number
	half: number
}

/** The comet's parts relative to its nucleus (CSS px, y down), for one size of sky window. */
export interface CometShape {
	/** Radius of the coma's glow. */
	coma: number
	ion: IonTail
	/** The dust tail's spine from the nucleus outward, bending away from the ion tail. */
	dust: readonly DustPoint[]
	/** The box around everything drawn, which the placement and the clear-of-copy test use. */
	box: Box
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
	/** Where its nucleus hangs on the sky (CSS px): the place it was put on screen plus its nearness times the camera's offset then. Set once it shows. */
	x: number
	y: number
	/** Its parts, laid out for the sky window it was placed in; null until it shows. */
	shape: CometShape | null
	/** When it began to show, on the twinkle clock. */
	startedAt: number
	/** scrollY when it began to show: the page may scroll SCROLL_CANCEL.to px from there before it is gone. */
	launchScrollY: number
	/** When copy first came within reach of its box (worker clock); it fades out over TRANSIENTS.cancelFade from then. Null while its box has been clear. */
	boxFailedAt: number | null
	/** When the sky was paused or turned to reduced motion (worker clock): it fades out over TRANSIENTS.cancelFade. Null while it hasn't been. */
	pausedAt: number | null
}

/** A body that has not been revealed yet: nothing drawn, and its start rule waits for the first delay. */
export function createSkyBody(): SkyBody {
	return { status: 'waiting', planned: false, nextAt: COMET.firstDelay, x: 0, y: 0, shape: null, startedAt: 0, launchScrollY: 0, boxFailedAt: null, pausedAt: null }
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

/** Grows `box` to hold the point (x, y). */
function include(box: Box, x: number, y: number): void {
	box.left = Math.min(box.left, x)
	box.top = Math.min(box.top, y)
	box.right = Math.max(box.right, x)
	box.bottom = Math.max(box.bottom, y)
}

/** Heading (radians) of the dust tail a share `along` (0 to 1) of the way to its tip: it starts beside the ion tail and bends away from it. */
function dustHeading(along: number): number {
	return (COMET.angle + COMET.dust.start + COMET.dust.curve * along) * DEG
}

/** The dust tail's spine for a window of `unit` CSS px a degree, widening toward the tip. */
function dustSpine(unit: number): DustPoint[] {
	const spine: DustPoint[] = []
	const step = (COMET.dust.length * unit) / DUST_STEPS
	let x = 0
	let y = 0
	for (let i = 0; i <= DUST_STEPS; i++) {
		const along = i / DUST_STEPS
		const heading = dustHeading(along)
		const width = COMET.dust.width[0] + (COMET.dust.width[1] - COMET.dust.width[0]) * along ** DUST_WIDEN
		spine.push({ x, y, nx: -Math.sin(heading), ny: Math.cos(heading), half: (width * unit) / 2 })
		// Each step goes the way the spine heads halfway along it
		const mid = dustHeading((i + 0.5) / DUST_STEPS)
		x += step * Math.cos(mid)
		y += step * Math.sin(mid)
	}
	return spine
}

/** The comet laid out for a screen of this size: its parts scale with the sky window (SKY_WINDOW), so it looks the same size on the sky at any screen size. */
export function cometShape(width: number, height: number): CometShape {
	const unit = (skyWindow(width, height).focal * Math.PI) / 180
	const angle = COMET.angle * DEG
	const ion: IonTail = {
		dirX: Math.cos(angle),
		dirY: Math.sin(angle),
		length: COMET.ion.length * unit,
		head: COMET.ion.width[0] * unit,
		tip: COMET.ion.width[1] * unit,
	}
	const coma = COMET.coma.radius * unit
	const dust = dustSpine(unit)
	const box: Box = { left: -coma, top: -coma, right: coma, bottom: coma }
	// The ion tail is a quad from its width at the nucleus to its width at the tip
	const normalX = -ion.dirY
	const normalY = ion.dirX
	for (const [along, half] of [[0, ion.head / 2], [ion.length, ion.tip / 2]] as const) {
		include(box, ion.dirX * along + normalX * half, ion.dirY * along + normalY * half)
		include(box, ion.dirX * along - normalX * half, ion.dirY * along - normalY * half)
	}
	for (const point of dust) {
		include(box, point.x + point.nx * point.half, point.y + point.ny * point.half)
		include(box, point.x - point.nx * point.half, point.y - point.ny * point.half)
	}
	return { coma, ion, dust, box }
}

/** The line a zone's reach above About's header row (CSS px from the top of the screen) once the page has scrolled as far as a comet can still show; findPlace keeps the comet's box BODY_REACH above it. */
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

/**
 * Where the comet's nucleus goes on screen, or null when no place fits. The comet's box grown by BODY_REACH on every
 * side is everywhere the camera's drift and lean can carry it, so that grown box must keep clear of the reach of every
 * zone of the field (the padded hero, Contact and footer copy and the side rails), stay inside the screen
 * (METEOR.edgeMargin), and lie below the navbar (METEOR.top) and above About's header row, copy the zones know nothing
 * of. The camera alone then never brings the comet to copy; only a new layout or the page's scroll can. A window with no
 * such place has no comet. Of the places on a COMET.step grid that fit, it takes the one nearest COMET.anchor.
 */
export function findPlace(field: SkyField, shape: CometShape): Point | null {
	const { width, height } = field
	const { left, top, right, bottom } = shape.box
	const y0 = METEOR.top + BODY_REACH - top
	const y1 = lowestBox(width, height) - BODY_REACH - bottom
	if (y1 < y0) return null
	// Only the zones that can reach a box anywhere in the search area matter
	const zones = field.quiet.filter((zone) => zoneReaches(zone, -BODY_REACH, y0 + top - BODY_REACH, width + BODY_REACH, y1 + bottom + BODY_REACH))
	const anchorX = COMET.anchor[0] * width
	const anchorY = COMET.anchor[1] * height
	const x0 = METEOR.edgeMargin + BODY_REACH - left
	const x1 = width - METEOR.edgeMargin - BODY_REACH - right
	let best: Point | null = null
	let nearest = Infinity
	for (let y = y0; y <= y1; y += COMET.step) {
		for (let x = x0; x <= x1; x += COMET.step) {
			const distance = Math.hypot(x - anchorX, y - anchorY)
			if (distance >= nearest) continue
			if (clearOfZones(zones, x + left - BODY_REACH, y + top - BODY_REACH, x + right + BODY_REACH, y + bottom + BODY_REACH)) {
				best = { x, y }
				nearest = distance
			}
		}
	}
	return best
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
 * fits: it takes the scroll where it starts as the page's scroll cancel measures from it, and hangs where the camera's
 * offset puts that place on screen now; if none fits it waits COMET.retry seconds. Returns whether the sky changed or a
 * fade has just run out, so the worker draws a frame.
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
	const shape = cometShape(field.width, field.height)
	const place = findPlace(field, shape)
	if (!place) {
		body.nextAt = gate.sinceReveal + COMET.retry
		return false
	}
	body.status = 'showing'
	body.shape = shape
	body.x = place.x + BODY_NEARNESS * step.offset.x
	body.y = place.y + BODY_NEARNESS * step.offset.y
	body.startedAt = step.twinkleTime
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

/** What the worker knows at a drawn frame, for the body's view: the clocks, the scroll, the camera and the zones on screen. */
export interface BodyFrame {
	/** Seconds on the worker clock. */
	time: number
	/** Seconds on the clock that leaves out the time the tab was hidden. */
	twinkleTime: number
	scrollY: number
	/** The camera's offset (CSS px at nearness 1). */
	offset: Vec
	/** The zones on screen as the frame draws them; the box answers to `to` and a waiting layout's `next`. */
	quiet: QuietBlend
}

/** The comet at one drawn frame: where its nucleus is on screen and how much of its light shows. */
export interface CometView {
	x: number
	y: number
	/** The light it shows, 0 to 1: its fade-in times the share the scroll and the fades leave. */
	light: number
	shape: CometShape
}

/**
 * The comet as one drawn frame shows it, or null when none shows. Its box is tested against the zones the frame answers
 * to (the layout it is easing to and one waiting), whose copy and the comet both move, and the first time copy comes
 * within reach it starts to fade out and is gone for good.
 */
export function bodyView(body: SkyBody, frame: BodyFrame): CometView | null {
	const { shape } = body
	if (body.status !== 'showing' || !shape) return null
	const x = body.x - BODY_NEARNESS * frame.offset.x
	const y = body.y - BODY_NEARNESS * frame.offset.y
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
	return { x, y, light: smoothstep(0, COMET.fadeIn, frame.twinkleTime - body.startedAt) * kept, shape }
}
