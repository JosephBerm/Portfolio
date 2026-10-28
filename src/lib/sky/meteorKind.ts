/**
 * The shooting stars as a kind of transient: what they remember between launches, how a launch is planned and how they
 * are timed. This module imports only types from transients.ts, which reads its spec when it loads.
 */

import { METEOR, METEOR_KINDS, METEOR_RATE } from './config'
import { nextGap } from './gaps'
import { meteorLifetime, meteorMoving, planMeteor, type Meteor, type PlanOptions } from './meteors'
import { pickVisitSky, visitSteer, type VisitSky } from './radiants'
import { between } from './random'
import type { PlanContext, TransientSpec } from './transients'

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
 * A plan for one launch of the shooting stars: a fireball when one is due, else an ordinary shooting star. On a wide
 * screen a fireball is due once METEOR_KINDS.fireball.after seconds have passed since the reveal and `spacing` since the
 * last one, at `chance` odds per launch. It is tried in clear sky and on long flights only, because a shorter pass would
 * fly an ordinary flight in its place, and a try that finds no path keeps the visit's sky. Then the launch plans an
 * ordinary shooting star, long flights on every steer before any short one.
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
	forget: (visit) => {
		visit.meteor.sky = null
	},
}
