/**
 * The sky's short-lived events (transients; so far, shooting stars) and the scheduler that launches, retires and cancels
 * them. This module knows no kind: each kind's module exports a spec and imports only types from here, so every spec
 * exists by the time the registry below reads it.
 */

import { TRANSIENTS } from './config'
import { METEOR_SPEC, createMeteorMemory, type MeteorMemory } from './meteorKind'
import type { Meteor, MeteorField } from './meteors'
import { EVERY_FRAME, FADE_FRAMES, NO_FRAMES, fadeOutAt, type FrameDemand } from './pacing'
import type { SkyRect } from './protocol'
import { between, type Random } from './random'
import { scrollKept } from './scene'

/** The model behind each kind: what its planner returns and its drawing reads. */
export interface TransientBodies {
	meteor: Meteor
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in the order the scheduler checks them for a launch. */
export const TRANSIENT_KINDS = ['meteor'] as const satisfies readonly TransientKind[]

/** Where transients may fly: the viewport and the padded quiet rects on screen (CSS px), the field every kind plans in. */
export interface SkyField extends MeteorField {
	/**
	 * The padded zones of copy pinned to the screen (the side rails), which shooting stars keep clear of (planMeteor's
	 * clearOf): the very objects `quiet` holds for the rails, so `quiet` without them is the copy in the page's flow.
	 */
	pinned: readonly SkyRect[]
}

/** What the scheduler tracks for a transient of kind K. Times are seconds on the worker clock. */
export interface TransientEnvelope<K extends TransientKind> {
	kind: K
	body: TransientBodies[K]
	startedAt: number
	/** First light to last (s), wake, train and fades included; set once at launch from the kind's spec, and never over TRANSIENTS.maxLife: the scheduler rejects longer plans. */
	lifetime: number
	/** Its body reported that its light may reach quiet copy, so it holds the ink lease until it retires. */
	nearCopy: boolean
	/** It never takes the ink lease, so it was planned in clear sky only. */
	clearSky: boolean
	/** scrollY at launch: the scroll cancel measures from here. */
	launchScrollY: number
	/** When the pause (or reduced motion) cancelled it: it fades out over TRANSIENTS.cancelFade. Null while it runs its course. */
	cancelledAt: number | null
}

/** A transient in the sky: its kind's body plus what the scheduler tracks for every kind. */
export type Transient = { [K in TransientKind]: TransientEnvelope<K> }[TransientKind]

/** What a visit remembers between launches, one entry per kind family, each owned by its module. A hidden tab and a layout keep it; a resize calls each spec's forget. */
export interface VisitMemory {
	meteor: MeteorMemory
}

/** What a planner gets: the moment, the field, the visit's memory, and whether its light may reach quiet copy. */
export interface PlanContext {
	random: Random
	/** Worker-clock seconds: the transient's start. */
	now: number
	field: SkyField
	visit: VisitMemory
	/** The ink lease is free and the crossing cooldown is over, so the plan may pass near quiet copy (planMeteor's nearCopy option); false keeps it in clear sky. */
	nearCopy: boolean
	/** Share of each rect's ink budget a transient may keep on the copy (the contrast preference's meteorInk): planMeteor's ink option. */
	ink: number
	/** A narrow screen (phones). */
	narrow: boolean
	/** Seconds since the reveal: a kind may wait for the visit to settle (fireballs wait METEOR_KINDS.fireball.after). */
	sinceReveal: number
}

/** How one kind is timed and planned; each kind's module exports one. Drawing lives with the canvas code (drawTransient). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before this kind's first attempt. */
	firstDelay(random: Random): number
	/** Seconds after a launch until the next attempt: the body's own time, then the kind's gap (stretched on long visits). */
	nextAfter(body: TransientBodies[K], random: Random, sinceReveal: number, narrow: boolean): number
	/** A body for this moment, or null when nothing fits (checked against what quiet copy can take when context.nearCopy lets it reach copy). */
	plan(context: PlanContext): TransientBodies[K] | null
	/** First light to last (s). */
	lifetime(body: TransientBodies[K]): number
	/** True while it moves on screen: it needs every animation frame. */
	moving(body: TransientBodies[K], now: number): boolean
	/** Its light may reach quiet copy, so it holds the ink lease: the body's own report (Meteor.nearCopy), never a copy of the context. */
	nearCopy(body: TransientBodies[K]): boolean
	/** This kind may take the ink lease; false plans in clear sky only. */
	lease: boolean
	/** It may launch on narrow screens (phones). */
	phones: boolean
	/** The viewport changed: forget this kind's part of the visit's memory. */
	forget?(visit: VisitMemory): void
}

/** Every kind's spec: a kind without one fails to compile. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = { meteor: METEOR_SPEC }

/** Whether and where transients may launch now; the worker refills one reused gate every tick. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches). */
	allowed: boolean
	/** No scroll for TRANSIENTS.scrollQuiet seconds. */
	settled: boolean
	/** A narrow screen (the worker's narrowScreen): phones keep their own limit, TRANSIENTS.narrowLimit, and their own gaps. */
	narrow: boolean
	/** Seconds since the reveal. */
	sinceReveal: number
	/** The page scroll now (px): a launch records it, and the scroll cancel measures from it. */
	scrollY: number
	/** The field to plan in, built afresh on each call, so the launch step builds it once, only for a due kind it may plan. */
	field(): SkyField
	/** The contrast preference's meteorInk (the worker's contrastLevels()): PlanContext.ink. */
	ink: number
}

/** The scheduler's state: what flies, and when each kind tries next. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	/** Plans in a row that found no room, per kind; at TRANSIENTS.maxFailedPlans the kind waits for a new layout. */
	failedPlans: Record<TransientKind, number>
	/** Launches this visit (narrow screens stop at TRANSIENTS.narrowLimit). */
	launched: number
	/** Last onset of any kind (s): onsets stay TRANSIENTS.minOnsetGap apart. */
	lastOnsetAt: number
	/** Before this (s) every plan stays in clear sky: the crossing cooldown after the reveal and after the last lease began. */
	crossingAfter: number
	visit: VisitMemory
}

/** An empty schedule; each family's memory comes from its own module (createMeteorMemory), so this one never changes with it. */
export function createTransientSchedule(): TransientSchedule {
	return {
		active: [],
		nextAt: { meteor: Infinity },
		failedPlans: { meteor: 0 },
		launched: 0,
		lastOnsetAt: -Infinity,
		crossingAfter: Infinity,
		visit: { meteor: createMeteorMemory() },
	}
}

/** Starts each kind's clock at the reveal with its own first delay, and the crossing cooldown (crossingAfter = now + TRANSIENTS.crossingCooldown). */
export function revealTransients(schedule: TransientSchedule, random: Random, now: number): void {
	for (const kind of TRANSIENT_KINDS) schedule.nextAt[kind] = now + SPECS[kind].firstDelay(random)
	schedule.crossingAfter = now + TRANSIENTS.crossingCooldown
}

/** No launch for TRANSIENTS.afterReturn s after the visitor is back (to the tab, from idle, to full motion). `now` in seconds. */
export function holdTransients(schedule: TransientSchedule, now: number): void {
	for (const kind of TRANSIENT_KINDS) schedule.nextAt[kind] = Math.max(schedule.nextAt[kind], now + TRANSIENTS.afterReturn)
}

/**
 * Share of its light a transient keeps: the scroll cancel (scrollKept) from its launch scroll, with the pause fade (over
 * TRANSIENTS.cancelFade once cancelled) as scrollKept's own `fade`. The scheduler retires it at 0, and the worker draws it
 * with this as drawMeteor's `fade`.
 */
export function transientFade(transient: Transient, now: number, scrollY: number): number {
	return scrollKept(transient.launchScrollY, scrollY, fadeOutAt(transient.cancelledAt, TRANSIENTS.cancelFade, now))
}

/** An active transient holds the ink lease: its light may reach quiet copy. */
export function leaseHeld(schedule: TransientSchedule): boolean {
	return schedule.active.some((transient) => transient.nearCopy)
}

/** The ink lease is free: nobody holds it, and the crossing cooldown is over. */
export function inkLeaseFree(schedule: TransientSchedule, now: number): boolean {
	return now >= schedule.crossingAfter && !leaseHeld(schedule)
}

/**
 * Removes what has run its course or kept no light, at the earlier of its lifetime and the tick its kept light
 * (transientFade) reaches 0, so a cancel never extends a life. Scrolling away from where a transient launched takes it
 * away, because it would pass over copy it was not planned around; that follows the page's scroll position, so even a
 * one-step jump retires it at once. Returns whether any went.
 */
function retire(schedule: TransientSchedule, now: number, scrollY: number): boolean {
	const { active } = schedule
	let kept = 0
	for (const transient of active) {
		if (now - transient.startedAt <= transient.lifetime && transientFade(transient, now, scrollY) > 0) active[kept++] = transient
	}
	const retired = kept < active.length
	active.length = kept
	return retired
}

/** Whether this tick's launch of `kind` is held back: the moment doesn't allow it, or a rule of the kind or the visit keeps it. */
function heldBack(schedule: TransientSchedule, kind: TransientKind, now: number, gate: LaunchGate): boolean {
	return (
		!gate.allowed ||
		!gate.settled ||
		(gate.narrow && (!SPECS[kind].phones || schedule.launched >= TRANSIENTS.narrowLimit)) ||
		now - schedule.lastOnsetAt < TRANSIENTS.minOnsetGap ||
		schedule.active.some((transient) => transient.kind === kind)
	)
}

/**
 * Plans one launch of `kind` and, when it fits, puts it in the sky. A call into a spec goes through a function generic in
 * the kind, because TypeScript can't relate a union of transients to a union of specs. Returns true when one launched.
 */
function launchKind<K extends TransientKind>(schedule: TransientSchedule, random: Random, now: number, kind: K, gate: LaunchGate): boolean {
	const spec: TransientSpec<K> = SPECS[kind]
	// Near copy only for a kind that may take the lease, while nobody holds it and the cooldown is over
	const nearCopy = spec.lease && inkLeaseFree(schedule, now)
	const body = spec.plan({ random, now, field: gate.field(), visit: schedule.visit, nearCopy, ink: gate.ink, narrow: gate.narrow, sinceReveal: gate.sinceReveal })
	if (body === null && !nearCopy) {
		// Clear sky alone failing shows no lack of room, and on a phone counting it could stop shooting stars for the visit
		schedule.nextAt[kind] = now + between(random, ...TRANSIENTS.retry)
		return false
	}
	const lifetime = body === null ? 0 : spec.lifetime(body)
	const reachesCopy = body !== null && spec.nearCopy(body)
	// A plan that outlives TRANSIENTS.maxLife, or reaches copy it was told to keep clear of, is a failed plan whatever the planner did
	if (body === null || lifetime > TRANSIENTS.maxLife || (reachesCopy && !nearCopy)) {
		const failed = schedule.failedPlans[kind] + 1
		schedule.failedPlans[kind] = failed
		// No room around the copy (a phone held sideways, say): stop trying until the layout changes
		schedule.nextAt[kind] = failed >= TRANSIENTS.maxFailedPlans ? Infinity : now + between(random, ...TRANSIENTS.retry)
		return false
	}
	const envelope: TransientEnvelope<K> = {
		kind,
		body,
		startedAt: now,
		lifetime,
		nearCopy: reachesCopy,
		clearSky: !spec.lease,
		launchScrollY: gate.scrollY,
		cancelledAt: null,
	}
	// The one cast: the envelope is of the kind it was planned for, and the union of envelopes is what the schedule holds
	schedule.active.push(envelope as Transient)
	schedule.lastOnsetAt = now
	schedule.failedPlans[kind] = 0
	schedule.launched++
	if (reachesCopy) schedule.crossingAfter = now + TRANSIENTS.crossingCooldown
	// Gaps count from the end of the body's own time, so a kind never overlaps itself
	schedule.nextAt[kind] = now + spec.nextAfter(body, random, gate.sinceReveal, gate.narrow)
	return true
}

/**
 * One tick: retires what has finished or kept no light (transientFade), then launches each kind that is due and allowed.
 * Returns true when anything changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: Random, now: number, gate: LaunchGate): boolean {
	let changed = retire(schedule, now, gate.scrollY)
	for (const kind of TRANSIENT_KINDS) {
		if (now < schedule.nextAt[kind]) continue
		if (heldBack(schedule, kind, now, gate)) {
			schedule.nextAt[kind] = now + TRANSIENTS.recheck
			continue
		}
		if (launchKind(schedule, random, now, kind, gate)) changed = true
	}
	return changed
}

/** Fades every active transient out over TRANSIENTS.cancelFade (pause, reduced motion). */
export function cancelTransients(schedule: TransientSchedule, now: number): void {
	for (const transient of schedule.active) transient.cancelledAt ??= now
}

/** Removes every active transient at once (hidden tab: nobody sees them; resize: their paths were planned for the old layout); the visit's memory stays. */
export function dropTransients(schedule: TransientSchedule): void {
	schedule.active.length = 0
}

/**
 * A new layout may have room again: kinds stopped after TRANSIENTS.maxFailedPlans failures retry after TRANSIENTS.retry.
 * The worker calls it when a layout arrives and when the viewport changes. `now` in seconds.
 */
export function retryTransients(schedule: TransientSchedule, random: Random, now: number): void {
	for (const kind of TRANSIENT_KINDS) {
		if (schedule.failedPlans[kind] < TRANSIENTS.maxFailedPlans) continue
		schedule.failedPlans[kind] = 0
		schedule.nextAt[kind] = now + between(random, ...TRANSIENTS.retry)
	}
}

/** The viewport changed: every spec forgets its part of the visit's memory (the shooting stars' sky). A layout doesn't call it: layouts also arrive for harmless re-measures. */
export function forgetVisitSky(schedule: TransientSchedule): void {
	for (const kind of TRANSIENT_KINDS) SPECS[kind].forget?.(schedule.visit)
}

/** Whether a transient is still moving on screen, through its kind's spec. */
function movingOf<K extends TransientKind>(transient: TransientEnvelope<K>, now: number): boolean {
	return SPECS[transient.kind].moving(transient.body, now)
}

/** Every animation frame while one moves (cancel fades included), fade frames while one lingers (a train), else none. */
export function transientDemand(schedule: TransientSchedule, now: number): FrameDemand {
	let demand = NO_FRAMES
	for (const transient of schedule.active) {
		if (transient.cancelledAt !== null || movingOf(transient, now)) return EVERY_FRAME
		demand = FADE_FRAMES
	}
	return demand
}

/** The earliest next attempt of any kind (s), for the one timer a sleeping worker keeps. */
export function nextLaunchAt(schedule: TransientSchedule): number {
	let earliest = Infinity
	for (const kind of TRANSIENT_KINDS) earliest = Math.min(earliest, schedule.nextAt[kind])
	return earliest
}
