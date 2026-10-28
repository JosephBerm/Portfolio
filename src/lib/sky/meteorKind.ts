/**
 * The shooting stars as a kind of transient: what they remember between launches, how a launch is planned and how they
 * are timed. This module imports only types from transients.ts, which reads its spec when it loads.
 */

import { METEOR } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, planMeteor, type Meteor } from './meteors'
import { pickVisitSky, visitSteer, type VisitSky } from './radiants'
import { between } from './random'
import type { PlanContext, TransientSpec } from './transients'

/**
 * What the shooting stars remember between launches: the visit's sky, the shower and the sporadic sources they come
 * from, so a visit's flights share them. A launch allowed near copy that finds no room clears it, and so does a resize,
 * which changes the layout the flights fit.
 */
export interface MeteorMemory {
	sky: VisitSky | null
}

/** The shooting stars' memory at the start of a visit: nothing remembered yet. */
export function createMeteorMemory(): MeteorMemory {
	return { sky: null }
}

/**
 * A plan for one launch. The visit's sky is picked when there is none, and a steer from it gives the launch its source
 * and scatter. The steers are drawn first, the first and then METEOR.radiantTries fresh ones (one on narrow screens), each
 * a new source and scatter; long flights come first on every steer, and a shorter fallback on the same steers only when
 * none has room for a long one. The planner is told how much light the contrast preference leaves a shooting star on
 * copy, whether the plan may pass near copy at all, and to keep clear of the side rails (the field's `pinned` zones).
 * Returns null when nothing fits, and then drops the visit's sky, unless the plan was kept in clear sky (the context's
 * `nearCopy` is false): clear sky alone failing says nothing about the sky.
 */
export function planMeteorTransient(context: PlanContext): Meteor | null {
	const { random, now, field, visit, nearCopy, ink, narrow } = context
	const memory = visit.meteor
	const sky = memory.sky ?? pickVisitSky(random, field)
	memory.sky = sky
	const steers = Array.from({ length: 1 + (narrow ? 1 : METEOR.radiantTries) }, () => visitSteer(random, sky))
	for (const flights of ['long', 'short'] as const) {
		for (const steer of steers) {
			const plan = planMeteor(random, field, now, { steer, flights, ink, nearCopy, clearOf: field.pinned })
			if (plan) return plan
		}
	}
	if (nearCopy) memory.sky = null
	return null
}

/** The shooting stars' timing and planning. */
export const METEOR_SPEC: TransientSpec<'meteor'> = {
	firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
	nextAfter: (meteor, random, sinceReveal) => meteor.duration + nextMeteorGap(random, sinceReveal),
	plan: planMeteorTransient,
	lifetime: meteorLifetime,
	moving: meteorMoving,
	nearCopy: (meteor) => meteor.nearCopy,
	lease: true,
	phones: true,
	forget: (visit) => {
		visit.meteor.sky = null
	},
}
