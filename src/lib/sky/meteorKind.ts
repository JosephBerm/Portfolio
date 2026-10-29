/**
 * The shooting stars as kinds of transient, over the hero and as farewell meteors at the foot of the page: what they
 * remember between launches, how a launch is planned and how they are timed. This module imports only types from
 * transients.ts, which reads their specs when it loads.
 */

import { FAREWELL, METEOR, METEOR_KINDS, METEOR_RATE, TRANSIENTS } from './config'
import { nextGap } from './gaps'
import { meteorLifetime, meteorMoving, meteorSpan, planMeteor, startArea, type Meteor, type PlanOptions } from './meteors'
import type { SkyRect } from './protocol'
import { ZONE_REACH } from './quietIndex'
import { pickVisitSky, pointNearRadiant, visitSteer, type VisitSky } from './radiants'
import { between, type Random } from './random'
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
	return { sky: null, from: { fireball: -Infinity, flash: -Infinity, burst: -Infinity } }
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

/** Points tried near the radiant for a flash before the launch goes without one. */
const FLASH_TRIES = 20

/**
 * A plan for a point flash: a meteor coming straight at the viewer, which shows as a point near the shower radiant with
 * no length and no movement, and brightens and fades in METEOR_KINDS.flash.duration s. It needs the radiant on screen
 * and a point within METEOR_KINDS.flash.radius degrees of it that lies inside the screen's guards (METEOR's edge margin
 * and top, and the height under METEOR.maxEndY) and in clear sky, past the reach of every padded quiet rect, so it takes
 * no ink lease and a layout that moves copy under it takes its light away (CLEAR_SKY_KEEPS). Returns null when the
 * radiant is off screen or no point fits.
 */
export function planFlash(context: PlanContext): Meteor | null {
	const { random, now, field, visit } = context
	const { duration, peak, radius } = METEOR_KINDS.flash
	const sky = visit.meteor.sky
	if (sky === null) return null
	for (let tries = 0; tries < FLASH_TRIES; tries++) {
		const point = pointNearRadiant(random, sky, radius)
		if (point === null) return null
		if (point.x < METEOR.edgeMargin || point.x > field.width - METEOR.edgeMargin || point.y < METEOR.top || point.y > field.height * METEOR.maxEndY) continue
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
			wakeColor: 'white',
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

/**
 * A plan for a burst: METEOR_KINDS.burst.members faint shooting stars from the shower radiant, the first at `now` and each
 * later one a stagger after the one before. Every member is planned in clear sky (the planner's `nearCopy` false) and
 * clear of the side rails, from a fresh steer of the shower, long flights on up to METEOR.radiantTries + 1 steers before
 * a shorter one, and has no flare and no train. A member that would end after TRANSIENTS.maxLife from the first light,
 * or that finds no path, ends the burst, so the whole burst never outlasts the limit; fewer than the least members is no
 * burst. The visit's sky is picked when there is none, and a failure leaves it, since clear sky alone failing says
 * nothing about it.
 */
export function planBurst(context: PlanContext): Meteor | null {
	const { random, now, field, visit } = context
	const { members, stagger } = METEOR_KINDS.burst
	const memory = visit.meteor
	const sky = memory.sky ?? pickVisitSky(random, field)
	memory.sky = sky
	const count = members[0] + Math.floor(random() * (members[1] - members[0] + 1))
	let burst: Meteor | null = null
	let startedAt = now
	for (let member = 0; member < count; member++) {
		if (member > 0) startedAt += between(random, stagger[0], stagger[1])
		const planned = planMember(random, context, sky)
		if (planned === null) break
		const timed: Meteor = { ...planned, flare: false, train: false, startedAt, variant: 'burst' }
		const grown: Meteor = burst === null ? timed : { ...burst, followers: [...(burst.followers ?? []), timed] }
		if (meteorLifetime(grown) > TRANSIENTS.maxLife) break
		burst = grown
	}
	return burst !== null && 1 + (burst.followers?.length ?? 0) >= members[0] ? burst : null
}

/** One member of a burst: a faint flight from the shower in clear sky, long before short, on fresh steers. */
function planMember(random: Random, context: PlanContext, sky: VisitSky): Meteor | null {
	const { now, field, ink } = context
	for (const flights of ['long', 'short'] as const) {
		for (let tries = 0; tries < 1 + METEOR.radiantTries; tries++) {
			const steer = visitSteer(random, sky, { shower: true, faint: true })
			const plan = planMeteor(random, field, now, { steer, flights, ink, nearCopy: false, clearOf: field.pinned })
			if (plan) return plan
		}
	}
	return null
}

/** A kind of shooting star apart from the ordinary: a key of METEOR_KINDS. */
type KindName = keyof typeof METEOR_KINDS

/** The kinds in the order the decision step walks them: METEOR_KINDS lists them so, fireballs first. */
const KIND_ORDER = Object.keys(METEOR_KINDS) as KindName[]

/** What a launch needs for a kind to be open to it, beyond METEOR_KINDS: a flash needs the shower radiant on screen. */
const NEEDS: Record<KindName, (context: PlanContext) => boolean> = {
	fireball: () => true,
	flash: (context) => (context.visit.meteor.sky?.showerOnScreen ?? null) !== null,
	burst: () => true,
}

/**
 * How each kind plans its launch. A fireball is tried in clear sky and on long flights only: a shorter pass would fly an
 * ordinary flight in its place.
 */
const TRY: Record<KindName, (context: PlanContext) => Meteor | null> = {
	fireball: (context) => planMeteorTransient({ ...context, nearCopy: false }, { fireball: true, flights: 'long' }),
	flash: planFlash,
	burst: planBurst,
}

/** The seconds a kind keeps off the launches after one of its own: its spacing, drawn from the range if it is one. */
function drawSpacing(random: Random, spacing: number | readonly [number, number]): number {
	return typeof spacing === 'number' ? spacing : between(random, spacing[0], spacing[1])
}

/**
 * A plan for one launch of the shooting stars: a kind of METEOR_KINDS when one is decided and fits, else an ordinary
 * shooting star. A kind is open to the launch on a wide screen, once its `after` seconds have passed since the reveal and
 * the spacing drawn after the last of its kind has run out, and when it has what it needs (a flash, the radiant on
 * screen); a kind whose `chance` is 0 is never open. The launch draws one number and gives it to the first open kind, in
 * METEOR_KINDS' order, whose slice of the odds it falls in, each slice as wide as the kind's `chance`; a launch with no
 * open kind draws none. A try that finds no path keeps the visit's sky and starts no spacing. When none was decided or
 * none fits, the launch plans an ordinary shooting star, long flights on every steer before any short one. A kind that
 * flies draws the spacing until the next of its kind may be decided.
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
	nearCopy: (meteor) => meteor.nearCopy,
	clearSky: (meteor) => meteor.variant !== undefined,
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
