/**
 * The sky's long-lived bodies; so far the comet. A comet is not a transient. It hangs on the sky, so the camera moves it
 * as it moves the faint stars, and it drifts on its own as a comet does, slowly, a day a minute, as a function of the
 * drift clock, so it stops whenever the drift does. A pause, or reduced motion turned on in mid-visit, holds it lit and
 * still where it is, and Play goes on from there. It fades in over seconds instead of lighting up, and it stays, through
 * scrolling too, until the sky is resized, copy or the landing scene's band comes near it or it has glided off the right
 * edge, and later comes back where the sky then has room. It never lights the copy: it shows only where its whole box keeps
 * clear of every zone's reach. This module is its model, pure functions over a body's state: where it hangs and drifts, its
 * fades, the box test and its start rule. What it looks like and how fast it drifts (the light of its head, tails and
 * knots, its size and box, the pace of its drift) is comet.ts's: skyAssets paints the comet's bitmap from it, and this
 * module reads its box and its pace. The worker keeps the state and feeds the functions what it knows, and renderSky draws
 * what they return. It imports only types from transients.ts.
 */

import { driftAt, type Vec } from './camera'
import { nearness } from './catalog'
import { cometDrift, cometKnots, cometShape, type CometKnot, type CometShape } from './comet'
import { COMET, LAYERS, LEAN, MAGNITUDE, METEOR, TRANSIENTS } from './config'
import type { Point } from './meteors'
import { DESCENT } from './miamiConfig'
import { easeEnded, easing, fadeOutAt } from './pacing'
import type { SkyRect } from './protocol'
import { ZONE_REACH, zoneReaches } from './quietIndex'
import type { Random } from './random'
import { smoothstep, type QuietBlend } from './scene'
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
export type BodyStatus = 'waiting' | 'showing'

/** A long-lived body hung in the sky. Times are seconds; the fade-in runs on the clock that leaves out hidden time. */
export interface SkyBody {
	status: BodyStatus
	/** This visit hangs one: the draw made at the reveal. */
	planned: boolean
	/** Seconds after the reveal before its start rule is next looked at: the first delay, then a wait after no place fit or after it left. */
	nextAt: number
	/** Where its nucleus hangs on the sky (CSS px) before its own drift: the place it was put on screen plus its nearness times the camera's offset then. Set once it shows. */
	x: number
	y: number
	/** Its size and extent, laid out for the sky window it was placed in; null until it shows. */
	shape: CometShape | null
	/** How far its own drift carries it in a second of drift clock (CSS px): the pace of the sky window it was placed in (cometDrift), the pace its path was swept at. Set once it shows. */
	drift: Vec
	/** When its fade-in began, on the twinkle clock: moved on by the length of each hold, so the fade-in stands still through it. */
	startedAt: number
	/** The drift clock (Camera.clock, s) when it began to show: its own drift is what it has run since. */
	startClock: number
	/** Its knots, rewritten for every frame it shows (reused, so a frame makes no garbage). */
	knots: CometKnot[]
	/** When copy or the landing scene's band first came within reach of its box, or the box passed the right edge (worker clock); it fades out over TRANSIENTS.cancelFade from then. Null while neither has happened. */
	boxFailedAt: number | null
	/** When the sky was paused or turned to reduced motion, on the twinkle clock: its fade-in stands at that moment until Play. Null under full motion. */
	heldAt: number | null
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
		boxFailedAt: null,
		heldAt: null,
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

/**
 * Whether the comet may start to show: it is planned for this visit and still waiting, the launch gate allows it (full
 * motion with the visitor here), the page's reading copy is known, since it will stay through scrolling, the page has been
 * still for a while, the screen is wide, its first delay (or its wait after no place fit or after it left) is over, and no
 * shooting star holds the ink lease. It keeps the sky's one bright moment near the copy to a shooting star's, so it starts
 * only while none does, and none takes the lease while it shows (LaunchGate.bodyShowing).
 */
export function bodyMayStart(body: SkyBody, gate: LaunchGate, leaseHeld: boolean): boolean {
	return body.status === 'waiting' && body.planned && gate.allowed && gate.readingKnown && gate.still && !gate.narrow && gate.sinceReveal >= body.nextAt && !leaseHeld
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
 * Samples of the path that blockedPlaces takes as one run. The nucleus moves a few px between samples, so over a run it
 * moves far less than the width of any zone's reach and a few steps of the grid in y at most. A shorter run leaves fewer
 * places to the test and costs more rectangles.
 */
const RUN = 8

/**
 * What blockedPlaces keeps inside every edge of what it blocks (CSS px): far over the rounding in the sums findPlace's
 * test makes and far under a step of the grid, so a place it blocks is blocked in those sums too, and a place that lies
 * within the slack of an edge is left to the test.
 */
const EDGE_SLACK = 1e-6

/** How far the nucleus gets from where it started over a stretch of its path, each way on each axis (CSS px). */
interface Span {
	minX: number
	maxX: number
	minY: number
	maxY: number
}

/** The span of the samples of `path` from `from` up to, but not including, `to`. */
function spanOf(path: readonly Point[], from: number, to: number): Span {
	const span: Span = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
	for (const step of path.slice(from, to)) {
		span.minX = Math.min(span.minX, step.x)
		span.maxX = Math.max(span.maxX, step.x)
		span.minY = Math.min(span.minY, step.y)
		span.maxY = Math.max(span.maxY, step.y)
	}
	return span
}

/**
 * The places of a grid where a comet's box surely does not keep clear, as a count per place (above 0 where it does not),
 * read at row × stride + column. The grid is `columns` by `rows`: the x of each column and the y of each row, a
 * COMET.step apart. At one sample of the path a zone blocks the places whose box, grown by `margin`, comes within
 * ZONE_REACH of it (zoneReaches): a rectangle of the grid, and at the next sample the same rectangle a few px over. A
 * place in a row that the rectangles of all of a run's samples hold, and in a column that the rectangle of one of them
 * holds, is blocked, since at that sample the box is within reach. The samples of a run are closer in x than a rectangle
 * is wide, so those columns are one stretch, and each zone and run adds one rectangle of places by its four corners (+1
 * or -1 at each, summed after, so it costs the same however many places it holds). A place the path blocks may be
 * missing (one in a row that only some samples of a run block), but none is counted that it does not block.
 */
function blockedPlaces(zones: readonly SkyRect[], path: readonly Point[], box: CometShape['box'], margin: number, columns: readonly number[], rows: readonly number[]): { counts: Int32Array; stride: number } {
	// One more column and row than the grid, for the corners just past it
	const stride = columns.length + 1
	const counts = new Int32Array(stride * (rows.length + 1))
	const add = (row: number, column: number, change: number) => {
		const at = row * stride + column
		counts[at] = (counts[at] ?? 0) + change
	}
	const x0 = columns[0] ?? 0
	const y0 = rows[0] ?? 0
	const runs: Span[] = []
	for (let from = 0; from < path.length; from += RUN) runs.push(spanOf(path, from, from + RUN))
	for (const zone of zones) {
		const wide = zone.width + 2 * ZONE_REACH + box.right - box.left + 2 * margin
		for (const run of runs) {
			// One stretch of columns needs the samples closer than a rectangle is wide; half of that leaves room to spare
			if (run.maxX - run.minX > wide / 2) continue
			const fromX = zone.x - ZONE_REACH - box.right - margin - run.maxX + EDGE_SLACK
			const toX = zone.x + zone.width + ZONE_REACH - box.left + margin - run.minX - EDGE_SLACK
			const fromY = zone.y - ZONE_REACH - box.bottom - margin - run.minY + EDGE_SLACK
			const toY = zone.y + zone.height + ZONE_REACH - box.top + margin - run.maxY - EDGE_SLACK
			const firstColumn = Math.max(0, Math.ceil((fromX - x0) / COMET.step))
			const lastColumn = Math.min(columns.length - 1, Math.floor((toX - x0) / COMET.step))
			const firstRow = Math.max(0, Math.ceil((fromY - y0) / COMET.step))
			const lastRow = Math.min(rows.length - 1, Math.floor((toY - y0) / COMET.step))
			if (firstColumn > lastColumn || firstRow > lastRow) continue
			add(firstRow, firstColumn, 1)
			add(firstRow, lastColumn + 1, -1)
			add(lastRow + 1, firstColumn, -1)
			add(lastRow + 1, lastColumn + 1, 1)
		}
	}
	// Sum the corners, so each place counts the rectangles that hold it
	for (let row = 0; row < rows.length; row++) {
		let along = 0
		for (let column = 0; column < columns.length; column++) {
			const at = row * stride + column
			along += counts[at] ?? 0
			counts[at] = along + (row > 0 ? (counts[at - stride] ?? 0) : 0)
		}
	}
	return { counts, stride }
}

/**
 * Where the comet's nucleus goes on screen, or null when no place fits, for a comet that starts at drift clock `clock`
 * and keeps clear for `life` seconds of it. Its path is known (cometPath), so its box is swept along it, grown by
 * COMET.clearance and the pointer's lean (LEAN_REACH, either way), and at every sample must keep clear of the reach of
 * all copy (the field's `clearSky`) and lie on screen, below the navbar (METEOR.top) and over its foot, with its head
 * inside the sides (METEOR.edgeMargin). The box may overflow the right edge, where no copy lies, which is how the comet
 * leaves. A screen with no such place has no comet for now. Of the places on a COMET.step grid that fit, it takes the one
 * nearest COMET.anchor, and the first of them (rows from the top, each from the left) where two are as near.
 *
 * A field may hold hundreds of zones, a grid thousands of places and a path dozens of samples, so a place is not tried
 * against all of them. The screen's edge, the navbar and the foot are settled for every place at once from the samples
 * that go farthest each way, zones that reach no box of the sweep are left out, the places that surely stay blocked are
 * mapped (blockedPlaces) and skipped, and each place left is tried zone by zone, a zone sample by sample only where it
 * reaches the box that holds the whole sweep there.
 */
export function findPlace(field: SkyField, shape: CometShape, clock: number, life: number): Point | null {
	const { width, height } = field
	const { left, top, right, bottom } = shape.box
	const margin = COMET.clearance + LEAN_REACH
	const lowest = height - METEOR.edgeMargin
	const y0 = METEOR.top + margin - top
	const y1 = lowest - margin - bottom
	if (y1 < y0) return null
	const path = cometPath(cometDrift(width, height), clock, life)
	const travel = spanOf(path, 0, path.length)
	const anchorX = COMET.anchor[0] * width
	const anchorY = COMET.anchor[1] * height
	const x0 = METEOR.edgeMargin - left
	const x1 = width - METEOR.edgeMargin
	// A sum never falls when an addend rises, so the sample that goes farthest each way decides for all of them: the head
	// is inside the right edge, and the box below the navbar and above the foot, at every sample if it is at that one.
	// The columns and rows that fail are no place at all
	const columns: number[] = []
	for (let x = x0; x <= x1 && x + travel.maxX <= x1; x += COMET.step) columns.push(x)
	const rows: number[] = []
	for (let y = y0; y <= y1 && y + travel.maxY + bottom + margin <= lowest; y += COMET.step) {
		if (y + travel.minY + top - margin >= METEOR.top) rows.push(y)
	}
	// A zone that reaches no box of the sweep takes no part, nor does one below the foot
	const zones = field.clearSky.filter((zone) => zoneReaches(zone, x0 + travel.minX + left - margin, y0 + travel.minY + top - margin, x1 + travel.maxX + right + margin, lowest))
	const { counts, stride } = blockedPlaces(zones, path, shape.box, margin, columns, rows)
	const staysClear = (x: number, y: number) => {
		for (const zone of zones) {
			if (!zoneReaches(zone, x + travel.minX + left - margin, y + travel.minY + top - margin, x + travel.maxX + right + margin, y + travel.maxY + bottom + margin)) continue
			for (const step of path) {
				const px = x + step.x
				const py = y + step.y
				if (zoneReaches(zone, px + left - margin, py + top - margin, px + right + margin, py + bottom + margin)) return false
			}
		}
		return true
	}
	let best: Point | null = null
	let nearest = Infinity
	for (let row = 0; row < rows.length; row++) {
		for (let column = 0; column < columns.length; column++) {
			if ((counts[row * stride + column] ?? 0) > 0) continue
			const x = columns[column] ?? 0
			const y = rows[row] ?? 0
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

/**
 * The share of its light the comet's box [x0, x1] × [y0, y1] keeps for `zones`: all of it while each zone is over
 * COMET.clearance px past its reach, easing to none at the reach, the same distance zoneReaches reads. One bitmap cannot be
 * dimmed part by part, and this needs no clock: copy nearing the box dims all of the comet by where that copy is now, as fast
 * as the page moves, and gives the light back if the page moves away. A place's path keeps that clearance only on the page
 * as it stood at the start and for the life it was swept for: past those the comet's own motion can bring it near copy too,
 * and it dims the same way.
 */
function boxKept(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): number {
	let kept = 1
	for (const zone of zones) {
		const gap = Math.max(zone.x - x1, x0 - zone.x - zone.width, zone.y - y1, y0 - zone.y - zone.height)
		if (gap < ZONE_REACH + COMET.clearance) kept = Math.min(kept, smoothstep(ZONE_REACH, ZONE_REACH + COMET.clearance, gap))
	}
	return kept
}

/** The share of its light the box's fade leaves a showing body; at 0 it leaves the sky. */
function bodyKept(body: SkyBody, time: number): number {
	return fadeOutAt(body.boxFailedAt, TRANSIENTS.cancelFade, time)
}

/** A showing body leaves the sky until COMET.again seconds from now. */
function leaveSky(body: SkyBody, sinceReveal: number): void {
	body.status = 'waiting'
	body.nextAt = sinceReveal + COMET.again
	body.boxFailedAt = null
}

/** What the worker knows at a tick, for the body's step: the launch gate (whether it may start, and its field), the lease, the clocks and the camera. */
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

/** Whether a fade of a showing body has just run out while the last frame drawn still showed it part way: one more frame shows its end. A held body's fade-in stands still, so it runs out only after Play. */
function fadeEnded(body: SkyBody, step: BodyStep): boolean {
	return (body.heldAt === null && easeEnded(body.startedAt, COMET.fadeIn, step.twinkleTime, step.twinkleDrawnAt)) || easeEnded(body.boxFailedAt, TRANSIENTS.cancelFade, step.time, step.drawnAt)
}

/**
 * One tick. A showing body that has kept no light leaves the sky. A waiting one starts if its rule allows and a place
 * fits for the drift clock now, and hangs where the camera's offset puts that place on screen now; if none fits it waits
 * COMET.retry seconds, and then tries from a new drift clock, so along a new path. Returns whether the sky changed or a
 * fade has just run out, so the worker draws a frame.
 */
export function updateBody(body: SkyBody, step: BodyStep): boolean {
	const { gate } = step
	if (body.status === 'showing') {
		if (bodyKept(body, step.time) > 0) return fadeEnded(body, step)
		leaveSky(body, gate.sinceReveal)
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
	return true
}

/**
 * The sky is paused or turned to reduced motion: a showing body stays lit and still where it is. Its own drift and its
 * knots are functions of the drift clock, which stops, so only its fade-in needs a hold: it stands where `twinkleTime`
 * (s on the twinkle clock, where the sky was last on screen) puts it, instead of running on unseen and showing more of
 * its light, or all of it, at Play.
 */
export function holdBody(body: SkyBody, twinkleTime: number): void {
	if (body.status === 'showing') body.heldAt ??= twinkleTime
}

/** Motion is full again: the fade-in goes on from where it stood, as if the hold had taken no time (its start moves on by the length of the hold). */
export function releaseBody(body: SkyBody, twinkleTime: number): void {
	if (body.heldAt === null) return
	body.startedAt += twinkleTime - body.heldAt
	body.heldAt = null
}

/** The viewport changed: its place was for the old one, so a showing body leaves the sky. A waiting one is placed afresh when it starts. */
export function dropBody(body: SkyBody, sinceReveal: number): void {
	if (body.status === 'showing') leaveSky(body, sinceReveal)
}

/**
 * True while a showing body's fade-in or a fade-out of it runs: fade frames show it. A held body asks for none: it is lit
 * and still. Nor does one the sky's descent has washed out (`descent` from DESCENT.starMix[1] on, as bodyView reads it):
 * none of it shows.
 */
export function bodyFading(body: SkyBody, time: number, twinkleTime: number, descent = 0): boolean {
	return body.status === 'showing' && descent < DESCENT.starMix[1] && ((body.heldAt === null && easing(body.startedAt, COMET.fadeIn, twinkleTime)) || easing(body.boxFailedAt, TRANSIENTS.cancelFade, time))
}

/** What the worker knows at a drawn frame, for the body's view: the clocks, the camera, the screen and the zones on screen. */
export interface BodyFrame {
	/** Seconds on the worker clock. */
	time: number
	/** Seconds on the clock that leaves out the time the tab was hidden. */
	twinkleTime: number
	/** The camera's offset (CSS px at nearness 1). */
	offset: Vec
	/** The drift clock (Camera.clock, s). */
	clock: number
	/** The screen's width (CSS px). */
	width: number
	/** The zones on screen as the frame draws them; the box answers to `to` and a waiting layout's `next`. */
	quiet: QuietBlend
	/** Reading copy near the screen, and the landing scene's band where the page has one; the box answers to them too. */
	reading: readonly SkyRect[]
}

/** The comet at one drawn frame: where its nucleus is on screen, how much of its light shows and where its knots are. */
export interface CometView {
	x: number
	y: number
	/**
	 * The light it shows, 0 to 1: its fade-in times the share its fade, the copy or the landing scene's band near its box
	 * and the sky's descent to that scene leave.
	 */
	light: number
	shape: CometShape
	/** The ion tail's knots relative to the nucleus: the body's own reused list, rewritten by each view. */
	knots: readonly CometKnot[]
}

/**
 * The comet as one drawn frame shows it, or null when none shows. It hangs where the camera carries it and drifts on its
 * own: the drift clock's time since it began to show, times its pace. While the sky is held the camera and the drift
 * clock stand still, so it does too, and its fade-in is read at the moment of the hold. None of it shows once its whole box
 * is past the right edge, where no copy lies. Its box is tested against the zones the frame answers to (the layout it is
 * easing to, one waiting, and reading copy with the landing scene's band), whose copy and the comet both move, held or not:
 * copy or the band nearing it dims all of it by where it is (boxKept), and the first time either comes within reach, or the
 * box is past the edge, its fade starts and it leaves the sky when that has run out (updateBody). As the sky comes down to
 * the landing scene (`descent`, SceneLevels.descent, 0 with no scene) all of it washes out with the stars, over their dusk
 * (DESCENT.starMix) and on to none, while the stars keep a share of their light (DESCENT.stars).
 */
export function bodyView(body: SkyBody, frame: BodyFrame, descent = 0): CometView | null {
	const { shape } = body
	if (body.status !== 'showing' || !shape) return null
	const flown = frame.clock - body.startClock
	const x = body.x - BODY_NEARNESS * frame.offset.x + body.drift.x * flown
	const y = body.y - BODY_NEARNESS * frame.offset.y + body.drift.y * flown
	if (x + shape.box.left >= frame.width) {
		body.boxFailedAt ??= frame.time
		return null
	}
	const { left, top, right, bottom } = shape.box
	const keptBy = (zones: readonly SkyRect[]) => boxKept(zones, x + left, y + top, x + right, y + bottom)
	const clear = Math.min(keptBy(frame.quiet.to), keptBy(frame.reading), frame.quiet.next ? keptBy(frame.quiet.next) : 1)
	if (clear <= 0) body.boxFailedAt ??= frame.time
	const kept = bodyKept(body, frame.time)
	if (kept <= 0) return null
	cometKnots(frame.clock, shape.unit, body.knots)
	// The stars' own dusk (sceneAt)
	const dusk = smoothstep(DESCENT.starMix[0], DESCENT.starMix[1], descent)
	return { x, y, light: smoothstep(0, COMET.fadeIn, (body.heldAt ?? frame.twinkleTime) - body.startedAt) * (1 - dusk) * kept * clear, shape, knots: body.knots }
}
