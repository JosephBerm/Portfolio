/**
 * The shooting stars as kinds of transient, over the hero and as farewell meteors at the foot of the page: what they
 * remember between launches, how a launch is planned and how they are timed. This module imports only types from
 * transients.ts, which reads their specs when it loads.
 */

import { FAREWELL, METEOR, METEOR_KINDS, METEOR_RATE } from './config'
import { nextGap } from './gaps'
import { meteorLifetime, meteorMoving, planMeteor, startArea, type Meteor, type PlanOptions } from './meteors'
import type { SkyRect } from './protocol'
import { ZONE_REACH } from './quietIndex'
import { pickVisitSky, visitSteer, type VisitSky } from './radiants'
import { between } from './random'
import type { PlanContext, SkyField, TransientSpec } from './transients'

/**
 * What the shooting stars remember between launches: the visit's sky, the shower and the sporadic sources they come
 * from, so a visit's flights share them, and when the last fireball flew. A launch allowed near copy that finds no room
 * clears the sky, and so does a resize, which changes the layout the flights fit; nothing clears the last fireball's
 * time within a page view.
 */
export interface MeteorMemory {
	sky: VisitSky | null
	/** When the last fireball launched (s on the worker clock); -Infinity before the first. */
	lastFireballAt: number
}

/** The shooting stars' memory at the start of a visit: nothing remembered yet. */
export function createMeteorMemory(): MeteorMemory {
	return { sky: null, lastFireballAt: -Infinity }
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

/**
 * A plan for one launch of the shooting stars: a fireball when one is decided and fits, else an ordinary shooting star.
 * On a wide screen, once METEOR_KINDS.fireball.after seconds have passed since the reveal and `spacing` since the last
 * fireball, each launch decides on one at `chance` odds; no other launch draws them. A decided fireball is tried in
 * clear sky and on long flights only, because a shorter pass would fly an ordinary flight in its place, and a try that
 * finds no path keeps the visit's sky. When none was decided or none fits, the launch plans an ordinary shooting star,
 * long flights on every steer before any short one.
 */
function planMeteorLaunch(context: PlanContext): Meteor | null {
	const { random, now, narrow, sinceReveal, visit } = context
	const { chance, spacing, after } = METEOR_KINDS.fireball
	const memory = visit.meteor
	if (!narrow && sinceReveal >= after && now - memory.lastFireballAt >= spacing && random() < chance) {
		const fireball = planMeteorTransient({ ...context, nearCopy: false }, { fireball: true, flights: 'long' })
		if (fireball) {
			memory.lastFireballAt = now
			return fireball
		}
	}
	return planMeteorTransient(context)
}

/** The shooting stars' timing and planning. */
export const METEOR_SPEC: TransientSpec<'meteor'> = {
	firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
	nextAfter: (meteor, random, sinceReveal, narrow) => meteor.duration + nextGap(random, narrow ? METEOR_RATE.narrow : METEOR_RATE.hero, sinceReveal),
	plan: planMeteorLaunch,
	lifetime: meteorLifetime,
	moving: meteorMoving,
	nearCopy: (meteor) => meteor.nearCopy,
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
