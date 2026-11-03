/** The law for the gap between short-lived events: a leaf every kind's module can import without importing the scheduler. */

import { TRANSIENTS, type GapLaw } from './config'
import type { Random } from './random'

/**
 * Seconds until a kind's next launch: one law for every clock, stretched on long visits (TRANSIENTS.longVisit). Before
 * the stretch the mean is floor + mean × (1 - e^(-(cap - floor) / mean)).
 */
export function nextGap(random: Random, law: GapLaw, sinceReveal: number): number {
	const { from, scale, max } = TRANSIENTS.longVisit
	const stretch = Math.min(max, 1 + Math.max(0, sinceReveal - from) / scale)
	return Math.min(law.cap, law.floor - law.mean * Math.log(1 - random())) * stretch
}
