import { FRAME } from './config'
import { smoothstep } from './scene'

/** Whether the visitor seems to be here: their last input and their last return from an idle stretch (worker-clock ms). */
export interface Presence {
	lastInputAt: number
	wokeAt: number
}

/** A visitor who has just arrived. */
export function createPresence(now: number): Presence {
	return { lastInputAt: now, wokeAt: -Infinity }
}

/** No input (scroll, pointer, keys, focus, a return to the tab) for FRAME.idleSleepMs. */
export function isIdle(presence: Presence, now: number): boolean {
	return now - presence.lastInputAt > FRAME.idleSleepMs
}

/**
 * Records input. Back during the idle fade-out, ambient motion eases back in from where it was; after a full idle stretch,
 * from nothing. Returns true when the visitor was away, so the worker holds the next launch back.
 */
export function notePresence(presence: Presence, now: number): boolean {
	const since = now - presence.lastInputAt
	if (since > FRAME.idleSleepMs - FRAME.idleFadeMs) presence.wokeAt = now - Math.max(0, FRAME.idleSleepMs - since)
	const wasIdle = isIdle(presence, now)
	presence.lastInputAt = now
	return wasIdle
}

/** 0 to 1: the share of ambient motion presence allows, easing out before the idle sleep and in after a return. */
export function presenceLevel(presence: Presence, now: number): number {
	const fadingOut = smoothstep(FRAME.idleSleepMs - FRAME.idleFadeMs, FRAME.idleSleepMs, now - presence.lastInputAt)
	return (1 - fadingOut) * smoothstep(0, FRAME.idleFadeMs, now - presence.wokeAt)
}
