/**
 * The shooting stars as a kind of transient: what they remember between launches, how a launch is planned and how they
 * are timed. This module imports only types from transients.ts, which reads its spec when it loads.
 */

import { METEOR } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, pickRadiant, planMeteor, type Meteor, type Point } from './meteors'
import { between } from './random'
import type { PlanContext, TransientSpec } from './transients'

/**
 * What the shooting stars remember between launches: the radiant they share while it yields long flights. A launch
 * allowed near copy that finds no room clears it, and so does a resize, which changes the layout the flights fit.
 */
export interface MeteorMemory {
	radiant: Point | null
}

/** The shooting stars' memory at the start of a visit: nothing remembered yet. */
export function createMeteorMemory(): MeteorMemory {
	return { radiant: null }
}

/**
 * A plan for one launch. The radiant in hand is kept while it yields long flights, so shooting stars share a direction;
 * when it doesn't, fresh ones are tried. The fresh radiants are drawn first (METEOR.radiantTries of them, one on narrow
 * screens), then long flights come first on every radiant, and a shorter fallback only when none has room for a long one.
 * The planner is told how much light the contrast preference leaves a shooting star on copy, and whether the plan may
 * pass near copy at all. Returns null when nothing fits, and then drops the radiant, unless the plan was kept in clear
 * sky (the context's `nearCopy` is false): clear sky alone failing says nothing about the radiant.
 */
export function planMeteorTransient(context: PlanContext): Meteor | null {
	const { random, now, field, visit, nearCopy, ink, narrow } = context
	const memory = visit.meteor
	const radiants = memory.radiant ? [memory.radiant] : []
	while (radiants.length < (memory.radiant ? 1 : 0) + (narrow ? 1 : METEOR.radiantTries)) radiants.push(pickRadiant(random, field.width, field.height))
	for (const flights of ['long', 'short'] as const) {
		for (const candidate of radiants) {
			const plan = planMeteor(random, field, candidate, now, { flights, ink, nearCopy })
			if (plan) {
				memory.radiant = candidate
				return plan
			}
		}
	}
	if (nearCopy) memory.radiant = null
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
		visit.meteor.radiant = null
	},
}
