import type { Point } from './meteors'

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
