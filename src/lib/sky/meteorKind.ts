/**
 * The shooting stars as kinds of transient, over the hero and as farewell meteors at the foot of the page: what they
 * remember between launches, how a launch is planned and how they are timed. This module imports only types from
 * transients.ts, which reads their specs when it loads.
 */

import { FAREWELL, METEOR, METEOR_BRIGHTNESS, METEOR_KINDS, METEOR_RATE, RADIANTS, SPEED_CLASSES, TRANSIENTS } from './config'
import { nextGap } from './gaps'
import { meteorLifetime, meteorMoving, meteorSpan, planMeteor, startArea, type Meteor, type PlanOptions, type Steer } from './meteors'
import type { SkyRect } from './protocol'
import { ZONE_REACH } from './quietIndex'
import { drawSpectrum, pickVisitSky, pointNearRadiant, radiantOver, showerRadiantAt, skyWindow, swarmPiece, visitSteer, type SteerOptions, type VisitSky } from './radiants'
import { between, gaussian, type Random } from './random'
import { quietAt } from './scene'
import type { PlanContext, SkyField, TransientSpec } from './transients'

/**
 * What the shooting stars remember between launches: the visit's sky, the shower and the sporadic sources they come
 * from, so a visit's flights share them, and how soon each kind of shooting star apart from the ordinary may be decided
 * again. A launch allowed near copy that finds no room clears the sky, and so does a resize, which changes the layout the
 * flights fit; nothing clears the kinds' clocks within a page view.
 */
export interface MeteorMemory {
	sky: VisitSky | null
	/** Per kind in METEOR_KINDS, the earliest second (on the worker clock) the next may be decided: when the last one launched plus the spacing drawn for it; -Infinity before the first. */
	from: Record<keyof typeof METEOR_KINDS, number>
}

/** The shooting stars' memory at the start of a visit: nothing remembered yet. */
export function createMeteorMemory(): MeteorMemory {
	return { sky: null, from: { fireball: -Infinity, flash: -Infinity, burst: -Infinity, grazer: -Infinity } }
}

/**
 * A plan for one launch. The visit's sky is picked when there is none, and a steer from it gives the launch its source
 * and scatter. The steers are drawn first, the first and then METEOR.radiantTries fresh ones (one on narrow screens), each
 * a new source and scatter; long flights come first on every steer, and a shorter fallback on the same steers only when
 * none has room for a long one. The planner is told how much light the contrast preference leaves a shooting star on
 * copy, whether the plan may pass near copy at all, and to keep clear of the side rails (the field's `pinned` zones, which
 * a `clearOf` in `options` adds to). Returns null when nothing fits, and then drops the visit's sky, unless the plan was
 * kept in clear sky (the context's `nearCopy` is false): clear sky alone failing says nothing about the sky. `options`
 * adds to every planner call, and its `flights: 'long'` leaves out the shorter fallback, which a fireball's try needs:
 * the fallback would fly an ordinary short flight in its place.
 */
export function planMeteorTransient(context: PlanContext, options: Omit<PlanOptions, 'steer' | 'nearCopy' | 'ink'> = {}): Meteor | null {
	const { random, now, field, visit, nearCopy, ink, narrow } = context
	const { flights = 'both' } = options
	const clearOf = options.clearOf ? [...field.pinned, ...options.clearOf] : field.pinned
	const memory = visit.meteor
	const sky = memory.sky ?? pickVisitSky(random, field)
	memory.sky = sky
	const steers = Array.from({ length: 1 + (narrow ? 1 : METEOR.radiantTries) }, () => visitSteer(random, sky))
	for (const pass of ['long', 'short'] as const) {
		if (flights !== 'both' && flights !== pass) continue
		for (const steer of steers) {
			const plan = planMeteor(random, field, now, { ...options, steer, flights: pass, ink, nearCopy, clearOf })
			if (plan) return plan
		}
	}
	if (nearCopy) memory.sky = null
	return null
}

/** Whether a point lies inside the screen's guards for where a transient may start: METEOR's edge margin and top, and the height under METEOR.maxEndY. */
function insideGuards(field: SkyField, x: number, y: number): boolean {
	return x >= METEOR.edgeMargin && x <= field.width - METEOR.edgeMargin && y >= METEOR.top && y <= field.height * METEOR.maxEndY
}

/** Points tried near the radiant for a flash before the launch goes without one. */
const FLASH_TRIES = 20

/**
 * A plan for a point flash: a meteor coming straight at the viewer, which shows as a point near the shower radiant with
 * no length and no movement, and brightens and fades in METEOR_KINDS.flash.duration s. It needs the radiant on screen
 * and a point within METEOR_KINDS.flash.radius degrees of it that lies inside the screen's guards (METEOR's edge margin
 * and top, and the height under METEOR.maxEndY) and in clear sky, past the reach of every padded quiet rect, so it takes
 * no ink lease and a layout that moves copy under it takes its light away (CLEAR_SKY_KEEPS). It has the shower's
 * spectrum, as it is a meteor of the stream. Returns null when the radiant is off screen or no point fits.
 */
export function planFlash(context: PlanContext): Meteor | null {
	const { random, now, field, visit } = context
	const { duration, peak, radius } = METEOR_KINDS.flash
	const sky = visit.meteor.sky
	if (sky === null) return null
	for (let tries = 0; tries < FLASH_TRIES; tries++) {
		const point = pointNearRadiant(random, sky, radius)
		if (point === null) return null
		if (!insideGuards(field, point.x, point.y)) continue
		if (quietAt(field.quiet, point.x, point.y) > 0) continue
		return {
			startX: point.x,
			startY: point.y,
			// A point does not travel: the direction is only there to be a unit vector
			dirX: 0,
			dirY: 1,
			length: 0,
			drag: 0,
			speed: 0,
			duration: between(random, duration[0], duration[1]),
			peak: between(random, peak[0], peak[1]),
			wake: 0,
			spectrum: sky.showerSpectrum,
			fireball: false,
			flare: false,
			train: false,
			nearCopy: false,
			startedAt: now,
			variant: 'flash',
		}
	}
	return null
}

/** Swarm centers tried on each of a burst's two passes, the shower's radiant and a radiant of its own. */
const SWARM_TRIES = 12

/** Places drawn for each piece of a swarm before the burst goes without it. */
const PIECE_TRIES = 12

/**
 * One flight of a swarm from exactly (`x`, `y`) on the course in `options` (the swarm's radiant, speed class and spectrum,
 * and the piece's own peak and flight time), in clear sky and clear of the side rails: a long flight where one fits there,
 * else a short one. It has no flare and no train. Null when no path fits from there.
 */
function planPiece(context: PlanContext, sky: VisitSky, x: number, y: number, options: SteerOptions): Meteor | null {
	const { random, now, field, ink } = context
	// A swarm flies like a shower (it never climbs), and its pieces near the radiant are short
	const steer = visitSteer(random, sky, { shower: true, minPath: RADIANTS.nearRadiantPath, ...options })
	const plan = planMeteor(random, field, now, { steer, ink, nearCopy: false, clearOf: field.pinned, starts: { x0: x, x1: x, y0: y, y1: y }, attempts: 1 })
	return plan && { ...plan, flare: false, train: false, variant: 'burst' }
}

/**
 * One try at a swarm of up to `count` pieces (METEOR_KINDS.burst): a center inside the guards, in the clear sky of the
 * start area, a radiant for it (the visit's shower's, or with `own` one of the swarm's own) and the lead there, then each
 * other piece where the swarm's spread puts it. A place outside the guards or the swarm's time window, or within `laneGap`
 * of another piece's path, is drawn again, up to PIECE_TRIES times, and the piece is left out when none fits. One
 * spectrum serves the whole swarm. Empty when the center gives no radiant or no lead. A piece's `startedAt` is its
 * arrival, not yet gathered into pulses.
 */
function planSwarm(context: PlanContext, sky: VisitSky, own: boolean, count: number): Meteor[] {
	const { random, now, field } = context
	const { across, delay, lastOnset, radiantDistance, slowest, heading, speed: ownSpeed, leadPeak, leadFlight, leadWake, rankPower, faintest, flight, laneGap } = METEOR_KINDS.burst
	const { x0, x1, y0, y1 } = startArea(field)
	const center = { x: between(random, x0, x1), y: Math.max(METEOR.top, between(random, y0, y1)) }
	if (!insideGuards(field, center.x, center.y) || quietAt(field.quiet, center.x, center.y) > 0) return []
	const radiant = own ? radiantOver(random, sky.window, center, radiantDistance, heading) : showerRadiantAt(sky, center, radiantDistance, slowest)
	if (radiant === null) return []
	const speed = own ? ownSpeed : sky.shower.speed
	const spectrum = own ? drawSpectrum(random, SPEED_CLASSES[speed].spectra) : sky.showerSpectrum
	const course = { radiant, speed, spectrum }
	const [shortest, longest] = SPEED_CLASSES[speed].duration
	const meanFlight = (shortest + longest) / 2
	const brightest = between(random, leadPeak[0], leadPeak[1])
	const leadTime = meanFlight * leadFlight
	const lead = planPiece(context, sky, center.x, center.y, { ...course, peak: brightest, duration: [leadTime, leadTime] })
	if (lead === null) return []
	const pieces: Meteor[] = [{ ...lead, wake: leadWake, train: SPEED_CLASSES[speed].train && random() < METEOR.trainChance }]
	const width = between(random, across[0], across[1])
	const meanDelay = between(random, delay[0], delay[1])
	for (let rank = 2; rank <= count; rank++) {
		const peak = Math.max(faintest, brightest * rank ** -rankPower)
		const time = meanFlight * (flight[0] + ((flight[1] - flight[0]) * (peak - faintest)) / (brightest - faintest))
		for (let tries = 0; tries < PIECE_TRIES; tries++) {
			// Behind the front by an exponential delay (log of 1 - random() is finite, as in gaussian)
			const offset = { east: gaussian(random) * width, north: gaussian(random) * width, behind: -meanDelay * Math.log(1 - random()) }
			const place = swarmPiece(sky.window, radiant, speed, center, offset)
			if (place === null || place.delay > lastOnset || place.delay < -lastOnset / 2 || !insideGuards(field, place.x, place.y)) continue
			// A start within `laneGap` of another's line would put two pieces on nearly one path: the fan only widens downstream, so this is the closest they come
			if (pieces.some((other) => Math.abs((place.x - other.startX) * other.dirY - (place.y - other.startY) * other.dirX) < laneGap)) continue
			const piece = planPiece(context, sky, place.x, place.y, { ...course, peak, duration: [time, time] })
			if (piece === null) continue
			pieces.push({ ...piece, startedAt: now + place.delay })
			break
		}
	}
	return pieces
}

/**
 * The burst of a swarm's pieces: they light in pulses from `now`, the earliest arrival first (METEOR_KINDS.burst). A piece
 * that would end later than TRANSIENTS.maxLife from the first light is left out, with all that come after it.
 */
function gatherPulses(context: PlanContext, pieces: readonly Meteor[]): Meteor | null {
	const { random, now } = context
	const { pulseGap, pulseMax } = METEOR_KINDS.burst
	const arrivals = [...pieces].sort((a, b) => a.startedAt - b.startedAt)
	const first = arrivals[0]?.startedAt ?? now
	// The open pulse: when it began (s after the first arrival), how many pieces share it and the least gap before the next
	let pulseAt = 0
	let inPulse = 0
	let gap = between(random, pulseGap[0], pulseGap[1])
	let burst: Meteor | null = null
	for (const piece of arrivals) {
		const arrival = piece.startedAt - first
		// A piece opens the next pulse when the open one is full or its gap has run out, and never sooner than that gap
		if (inPulse >= pulseMax || arrival >= pulseAt + gap) {
			pulseAt = Math.max(arrival, pulseAt + gap)
			inPulse = 0
			gap = between(random, pulseGap[0], pulseGap[1])
		}
		inPulse++
		const timed: Meteor = { ...piece, startedAt: now + pulseAt }
		const grown: Meteor = burst === null ? timed : { ...burst, followers: [...(burst.followers ?? []), timed] }
		if (meteorLifetime(grown) > TRANSIENTS.maxLife) break
		burst = grown
	}
	return burst
}

/**
 * A plan for a burst, a meteor cluster (METEOR_KINDS.burst): up to SWARM_TRIES swarms on the visit's shower radiant,
 * stopping at one with all its pieces, and where the fullest has fewer than `least` up to as many on a radiant of their
 * own (the shower's radiant seldom lies at the right distance, and a cluster needs no shower). The fullest flies,
 * gathered into pulses; under `least` pieces is no burst. Every piece is planned in clear sky (the planner's `nearCopy`
 * false) and clear of the side rails, so a burst never takes the ink lease. The visit's sky is picked when there is none,
 * and a failure leaves it, since clear sky alone failing says nothing about it.
 */
export function planBurst(context: PlanContext): Meteor | null {
	const { random, field, visit } = context
	const { members, least } = METEOR_KINDS.burst
	const memory = visit.meteor
	const sky = memory.sky ?? pickVisitSky(random, field)
	memory.sky = sky
	const count = members[0] + Math.floor(random() * (members[1] - members[0] + 1))
	let fullest: Meteor[] = []
	for (const own of [false, true]) {
		for (let tries = 0; tries < SWARM_TRIES && fullest.length < count; tries++) {
			const pieces = planSwarm(context, sky, own, count)
			if (pieces.length > fullest.length) fullest = pieces
		}
		if (fullest.length >= least) break
	}
	if (fullest.length < least) return null
	const burst = gatherPulses(context, fullest)
	return burst !== null && 1 + (burst.followers?.length ?? 0) >= least ? burst : null
}

/** Radians per degree. */
const DEG = Math.PI / 180

/**
 * A plan for an earthgrazer: a long, slow, warm shooting star within METEOR_KINDS.grazer.tilt degrees of horizontal that
 * crosses at least `widthShare` of the screen's width. Each start the planner draws gets a heading to the left or the
 * right, whichever leaves room for the least path (either, if both do), a speed in `angular` °/s of the sky window drawn
 * fast enough for the least path to fit in the longest `duration`, and a duration from the least that makes the path long
 * enough up to the longest. The planner flies it in clear sky (`nearCopy` false) and clear of the side rails, on long
 * flights only, and the earthgrazer has no flare or train and the wake METEOR.grazerWake. The planner's longest path for
 * ordinary flights does not bind it: its length is its speed times its duration, and that is wider than 640 px on the
 * widest screens. It takes the sodium-enhanced spectrum, as slow meteors do, and is of the slow speed class. Returns null
 * when no band of clear sky is long enough, and then leaves the visit's sky as it was.
 */
export function planGrazer(context: PlanContext): Meteor | null {
	const { random, now, field, ink } = context
	const { widthShare, tilt, angular, duration } = METEOR_KINDS.grazer
	const { focal } = skyWindow(field.width, field.height)
	const minPath = widthShare * field.width
	const slowest = Math.max(angular[0] * DEG * focal, minPath / duration[1])
	const fastest = angular[1] * DEG * focal
	if (slowest > fastest) return null
	const steer: Steer = (random, start) => {
		const left = start.x - minPath >= METEOR.edgeMargin
		const right = start.x + minPath <= field.width - METEOR.edgeMargin
		if (!left && !right) return null
		const heading = between(random, -tilt, tilt) * DEG
		const speed = between(random, slowest, fastest)
		return {
			dirX: (left && (!right || random() < 0.5) ? -1 : 1) * Math.cos(heading),
			dirY: Math.sin(heading),
			speed,
			duration: [Math.max(duration[0], minPath / speed), duration[1]],
			pathShare: Infinity,
			minPath,
			peak: between(random, METEOR_BRIGHTNESS.normal[0], METEOR_BRIGHTNESS.normal[1]),
			spectrum: 'naEnhanced',
			train: false,
			speedClass: 'slow',
		}
	}
	const plan = planMeteor(random, field, now, { steer, flights: 'long', ink, nearCopy: false, clearOf: field.pinned })
	return plan && { ...plan, wake: METEOR.grazerWake, flare: false, train: false, variant: 'grazer' }
}

/** A kind of shooting star apart from the ordinary: a key of METEOR_KINDS. */
type KindName = keyof typeof METEOR_KINDS

/** The kinds in the order the decision step walks them: METEOR_KINDS lists them so, fireballs first. */
const KIND_ORDER = Object.keys(METEOR_KINDS) as KindName[]

/** What a launch needs for a kind to be open to it, beyond METEOR_KINDS: a flash needs the shower radiant on screen, an earthgrazer a screen wide enough. */
const NEEDS: Record<KindName, (context: PlanContext) => boolean> = {
	fireball: () => true,
	flash: (context) => (context.visit.meteor.sky?.showerOnScreen ?? null) !== null,
	burst: () => true,
	grazer: (context) => context.field.width >= METEOR_KINDS.grazer.minWidth,
}

/**
 * How each kind plans its launch. A fireball is tried in clear sky and on long flights only: a shorter pass would fly an
 * ordinary flight in its place.
 */
const TRY: Record<KindName, (context: PlanContext) => Meteor | null> = {
	fireball: (context) => planMeteorTransient({ ...context, nearCopy: false }, { fireball: true, flights: 'long' }),
	flash: planFlash,
	burst: planBurst,
	grazer: planGrazer,
}

/** The seconds a kind keeps off the launches after one of its own: its spacing, drawn from the range if it is one. */
function drawSpacing(random: Random, spacing: number | readonly [number, number]): number {
	return typeof spacing === 'number' ? spacing : between(random, spacing[0], spacing[1])
}

/**
 * A plan for one launch of the shooting stars: a kind of METEOR_KINDS when one is decided and fits, else an ordinary
 * shooting star. A kind is open to the launch on a wide screen, once its `after` seconds have passed since the reveal and
 * the spacing drawn after the last of its kind has run out, and when it has what it needs (a flash, the radiant on
 * screen; an earthgrazer, a screen at least METEOR_KINDS.grazer.minWidth px wide); a kind whose `chance` is 0 is never
 * open. The launch draws one number and gives it to the first open kind, in METEOR_KINDS' order, whose slice of the odds
 * it falls in, each slice as wide as the kind's `chance`; a launch with no open kind draws none. A try that finds no path
 * keeps the visit's sky and starts no spacing. When none was decided or none fits, the launch plans an ordinary shooting
 * star, long flights on every steer before any short one. A kind that flies draws the spacing until the next of its kind
 * may be decided.
 */
function planMeteorLaunch(context: PlanContext): Meteor | null {
	const { random, now, narrow, sinceReveal, visit } = context
	const memory = visit.meteor
	const open = narrow ? [] : KIND_ORDER.filter((name) => METEOR_KINDS[name].chance > 0 && sinceReveal >= METEOR_KINDS[name].after && now >= memory.from[name] && NEEDS[name](context))
	if (open.length > 0) {
		let roll = random()
		for (const name of open) {
			const { chance, spacing } = METEOR_KINDS[name]
			if (roll < chance) {
				const meteor = TRY[name](context)
				if (meteor) {
					memory.from[name] = now + drawSpacing(random, spacing)
					return meteor
				}
				break
			}
			roll -= chance
		}
	}
	return planMeteorTransient(context)
}

/** The shooting stars' timing and planning. */
export const METEOR_SPEC: TransientSpec<'meteor'> = {
	firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
	nextAfter: (meteor, random, sinceReveal, narrow) => meteorSpan(meteor) + nextGap(random, narrow ? METEOR_RATE.narrow : METEOR_RATE.hero, sinceReveal),
	plan: planMeteorLaunch,
	lifetime: meteorLifetime,
	moving: meteorMoving,
	nearCopy: (meteor) => meteor.nearCopy || (meteor.followers?.some((follower) => follower.nearCopy) ?? false),
	clearSky: (meteor) => meteor.variant !== undefined || meteor.fireball,
	lastOnset: (meteor) => (meteor.followers?.at(-1)?.startedAt ?? meteor.startedAt) - meteor.startedAt,
	lease: true,
	phones: true,
	scene: 'hero',
	forget: (visit) => {
		visit.meteor.sky = null
	},
}

/**
 * The top of the highest padded zone of the page's flow that is on screen (CSS px; above the screen where that zone is cut
 * off by it), or null while none is. The field's `pinned` zones are the very objects `quiet` holds for the side rails, so
 * every other zone in `quiet` is copy in the page's flow.
 */
function flowEdge(field: SkyField): number | null {
	let edge: number | null = null
	for (const zone of field.quiet) {
		if (zone.y >= field.height || zone.y + zone.height <= 0 || field.pinned.includes(zone)) continue
		edge = edge === null ? zone.y : Math.min(edge, zone.y)
	}
	return edge
}

/**
 * Whether the screen leaves room for a farewell meteor: some copy of the page's flow is on screen, and its top lies above the
 * line paths must end above (METEOR.maxEndY). A farewell meteor flies below that top, so with the top at or below the line
 * none could end above it. On a tall screen Contact sits low even at the foot of the page, and there is no room.
 */
export function farewellRoom(field: SkyField): boolean {
	const edge = flowEdge(field)
	return edge !== null && edge < METEOR.maxEndY * field.height
}

/**
 * A plan for one farewell meteor: a shooting star planned like any other (planMeteorTransient), but only in the sky below
 * the top of the highest copy of the page's flow on screen (flowEdge). The page above Contact has copy that carries no
 * quiet rect, which the veil knows nothing of: the starts are drawn from that edge down to the bottom of the screen, and
 * the sky above it is kept clear, so no path rises above the edge. Null when no copy of the flow is on screen.
 */
export function planFarewell(context: PlanContext): Meteor | null {
	const { field } = context
	const edge = flowEdge(field)
	if (edge === null) return null
	// The planner keeps every path QUIET.feather (ZONE_REACH) away from a rect, so one ending that far above the edge leaves the paths at the edge or below it;
	// a screen high, it covers all the sky above the edge that is on screen, whatever the edge
	const above: SkyRect = { x: 0, y: edge - ZONE_REACH - field.height, width: field.width, height: field.height, headroom: 0 }
	return planMeteorTransient(context, { clearOf: [above], starts: { ...startArea(field), y0: edge, y1: field.height } })
}

/**
 * The farewell meteors' timing and planning: shooting stars at the foot of the page, around Contact and the footer. They keep
 * a clock of their own, from the reveal and after each flight (FAREWELL.gap), at most FAREWELL.limit a visit, and wait for a
 * screen that leaves room.
 */
export const FAREWELL_SPEC: TransientSpec<'farewell'> = {
	firstDelay: (random) => nextGap(random, FAREWELL.gap, 0),
	nextAfter: (meteor, random, sinceReveal) => meteor.duration + nextGap(random, FAREWELL.gap, sinceReveal),
	plan: planFarewell,
	lifetime: meteorLifetime,
	moving: meteorMoving,
	nearCopy: (meteor) => meteor.nearCopy,
	lease: true,
	phones: true,
	scene: 'end',
	room: farewellRoom,
	limit: FAREWELL.limit,
}
