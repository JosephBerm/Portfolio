/**
 * The sky's short-lived events (transients: shooting stars and satellites) and the scheduler that launches, retires and
 * cancels them. This module knows no kind: each kind's module exports a spec and imports only types from here, so every
 * spec exists by the time the registry below reads it.
 */

import { TRANSIENTS } from './config'
import { METEOR_SPEC, createMeteorMemory, type MeteorMemory } from './meteorKind'
import type { Meteor, MeteorField } from './meteors'
import { EVERY_FRAME, FADE_FRAMES, NO_FRAMES, fadeOutAt, type FrameDemand } from './pacing'
import type { SkyRect } from './protocol'
import { zoneReaches } from './quietIndex'
import { between, type Random } from './random'
import { SATELLITE_SPEC, type SatellitePass } from './satellites'
import { readingPadding, screenQuietZones, screenReadingZones, scrollKept, type LaunchScene } from './scene'

/** The model behind each kind: what its planner returns and its drawing reads. */
export interface TransientBodies {
	meteor: Meteor
	satellite: SatellitePass
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in the order the scheduler checks them for a launch (shooting stars first: they are the most frequent). */
export const TRANSIENT_KINDS = ['meteor', 'satellite'] as const satisfies readonly TransientKind[]

/** Where transients may fly: the viewport and the padded zones of copy on screen (CSS px), the field every kind plans in. */
export interface SkyField extends MeteorField {
	/** What no shooting star comes within QUIET.feather of, wherever else it may go (planMeteor's clearOf): the side rails and reading copy. */
	noFly: readonly SkyRect[]
	/** All copy, quiet and reading: what a plan that stays in clear sky keeps out of reach of. */
	clearSky: readonly SkyRect[]
}

/** What the field is built from: the screen, the scroll and the copy as the last layout measured it (document coordinates, `pinned` screen coordinates). */
export interface FieldInput {
	width: number
	height: number
	narrow: boolean
	scrollY: number
	quiet: readonly SkyRect[]
	pinned: readonly SkyRect[]
	reading: readonly SkyRect[]
}

/**
 * The field every kind plans in now. Every planner keeps within the screen's height, and only a satellite's line (one
 * end just beyond a side) and the comet's box (it may overflow the right edge) go past a side, where no copy lies, so
 * only the zones that can touch the screen matter.
 */
export function skyField(input: FieldInput): SkyField {
	const { width, height, narrow, scrollY } = input
	const rails = screenQuietZones([], scrollY, input.pinned)
	const quiet = [...screenQuietZones(input.quiet, scrollY).filter((zone) => zoneReaches(zone, 0, 0, width, height)), ...rails]
	const reading = screenReadingZones(input.reading, scrollY, height, readingPadding(narrow))
	return { width, height, quiet, noFly: [...rails, ...reading], clearSky: [...quiet, ...reading] }
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
	/** It never takes the ink lease: planned in clear sky only, and drawn with CLEAR_SKY_KEEPS. */
	clearSky: boolean
	/** The scroll cancel takes it (scrollKept): it holds the ink lease or lingers (TransientSpec.lingers), or the sky knows no reading copy. Anything else answers only to the copy or the landing scene's band under it. */
	scrollBound: boolean
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
	/** The ink lease is free, the crossing cooldown is over, the page is still, nothing else is in the sky and no comet shows, so the plan may pass near quiet copy (planMeteor's nearCopy option); false keeps it in clear sky. */
	nearCopy: boolean
	/** The page is still (LaunchGate.still): only then may a shooting star leave a train, which any scroll takes. */
	still: boolean
	/** Share of each rect's ink budget a transient may keep on the copy (the contrast preference's meteorInk times the descent's inkShare): planMeteor's ink option. */
	ink: number
	/** A narrow screen (phones). */
	narrow: boolean
	/** Seconds since the reveal: a kind may wait for the visit to settle (each of METEOR_KINDS waits its `after`). */
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
	/** This body never takes the ink lease although its kind may (a shooting star variant): it is planned in clear sky and drawn with CLEAR_SKY_KEEPS, as a kind with `lease` false is. Absent for a kind whose bodies may all take it. */
	clearSky?(body: TransientBodies[K]): boolean
	/** It leaves a long faint line, whose light copy could come to lie on between the few places the line is measured, so a scroll takes it. Absent: it leaves no such line. */
	lingers?(body: TransientBodies[K]): boolean
	/** Seconds from the launch to the body's last onset, for a body whose light starts more than once (a burst's later members), so other launches keep TRANSIENTS.minOnsetGap from that onset too. Absent: 0. */
	lastOnset?(body: TransientBodies[K]): number
	/** This kind may take the ink lease; false (satellites) plans in clear sky only and draws with CLEAR_SKY_KEEPS. */
	lease: boolean
	/** It may launch on narrow screens (phones). */
	phones: boolean
	/** The launch scene it flies in (SceneLevels.launchScene): over the hero or at the end bookend. */
	scene: LaunchScene
	/** The viewport changed: forget this kind's part of the visit's memory. */
	forget?(visit: VisitMemory): void
}

/** Every kind's spec: a kind without one fails to compile. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = { meteor: METEOR_SPEC, satellite: SATELLITE_SPEC }

/** Whether and where transients may launch now; the worker refills one reused gate every tick. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and in a launch scene (SceneLevels.launchScene). */
	allowed: boolean
	/** The launch scene now (SceneLevels.launchScene), which each kind's own `scene` must match. */
	scene: LaunchScene | null
	/** No scroll step over TRANSIENTS.calmStep px for TRANSIENTS.scrollQuiet seconds. */
	calm: boolean
	/** No scroll at all for TRANSIENTS.scrollQuiet seconds: what must stay where its plan saw the copy may start now. */
	still: boolean
	/**
	 * The page's reading copy has been measured. Until it has, or where a walk finds none, the sky can't tell what a flight may
	 * come to lie on, so the scroll cancel takes every flight.
	 */
	readingKnown: boolean
	/** A narrow screen (the worker's narrowScreen): phones keep their own limit, TRANSIENTS.narrowLimit, and their own gaps. */
	narrow: boolean
	/** Seconds since the reveal. */
	sinceReveal: number
	/** The page scroll now (px): a launch records it, and a scroll cancel measures from it. */
	scrollY: number
	/** The field to plan in, built afresh on each call, so the launch step builds it once, only for a due kind it may plan. */
	field(): SkyField
	/** The contrast preference's meteorInk (the worker's contrastLevels()) times the descent's inkShare (SceneLevels): PlanContext.ink. */
	ink: number
	/** The comet (bodies.ts) is showing: no shooting star is planned near the copy meanwhile, so the comet never shares the sky with the lease's bright moment. */
	bodyShowing: boolean
}

/** The scheduler's state: what flies, and when each kind tries next. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	/** Launches this visit (narrow screens stop at TRANSIENTS.narrowLimit). */
	launched: number
	/** Last onset of any kind (s), a body's later onsets included (TransientSpec.lastOnset), so it can lie ahead of now: onsets stay TRANSIENTS.minOnsetGap apart. */
	lastOnsetAt: number
	/** Before this (s) every plan stays in clear sky: the crossing cooldown after the reveal and after the last lease began. */
	crossingAfter: number
	visit: VisitMemory
}

/** An empty schedule; each family's memory comes from its own module (createMeteorMemory), so this one never changes with it. */
export function createTransientSchedule(): TransientSchedule {
	return {
		active: [],
		nextAt: { meteor: Infinity, satellite: Infinity },
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
 * Share of its light a transient keeps: the pause fade (over TRANSIENTS.cancelFade once cancelled) and, for one the scroll
 * cancel takes (scrollBound), scrollKept from its launch scroll with the pause fade as its own `fade`. Anything else keeps
 * flying while the page scrolls: whatever copy, or the landing scene's band, comes under it takes its light where it draws
 * (transientQuietFactor with CLEAR_SKY_KEEPS, flightKept). The scheduler retires it at 0, and the worker draws it with this
 * as drawTransient's `fade`.
 */
export function transientFade(transient: Transient, now: number, scrollY: number): number {
	const fade = fadeOutAt(transient.cancelledAt, TRANSIENTS.cancelFade, now)
	return transient.scrollBound ? scrollKept(transient.launchScrollY, scrollY, fade) : fade
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
 * (transientFade) reaches 0, so a cancel never extends a life. Returns whether any went.
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

/**
 * Whether this tick's launch of `kind` is held back: the moment doesn't allow it, or a rule of the kind or the visit keeps
 * it. One rule keeps the sky's bright moment single: a kind that never takes the ink lease (a satellite) waits while a
 * transient that holds it flies, and launchKind plans a transient that may take it in clear sky while any other flies or
 * the comet shows. A kind flies only in its own launch scene.
 */
function heldBack(schedule: TransientSchedule, kind: TransientKind, now: number, gate: LaunchGate): boolean {
	const spec = SPECS[kind]
	return (
		!gate.allowed ||
		!gate.calm ||
		(gate.narrow && (!spec.phones || schedule.launched >= TRANSIENTS.narrowLimit)) ||
		now - schedule.lastOnsetAt < TRANSIENTS.minOnsetGap ||
		schedule.active.some((transient) => transient.kind === kind) ||
		(!spec.lease && leaseHeld(schedule)) ||
		gate.scene !== spec.scene
	)
}

/**
 * Plans one launch of `kind` in `field` and, when it fits, puts it in the sky. A call into a spec goes through a function
 * generic in the kind, because TypeScript can't relate a union of transients to a union of specs. Returns true when one
 * launched.
 */
function launchKind<K extends TransientKind>(schedule: TransientSchedule, random: Random, now: number, kind: K, gate: LaunchGate, field: SkyField): boolean {
	const spec: TransientSpec<K> = SPECS[kind]
	// Near copy only for a kind that may take the lease, while nobody holds it, the cooldown is over, the page is still, nothing else is in the sky and no comet shows, so a satellite or the comet and a shooting star near the copy are never up together
	const nearCopy = spec.lease && gate.still && inkLeaseFree(schedule, now) && schedule.active.length === 0 && !gate.bodyShowing
	const body = spec.plan({ random, now, field, visit: schedule.visit, nearCopy, still: gate.still, ink: gate.ink, narrow: gate.narrow, sinceReveal: gate.sinceReveal })
	const lifetime = body === null ? 0 : spec.lifetime(body)
	const reachesCopy = body !== null && spec.nearCopy(body)
	// It never takes the ink lease: its kind never does, or the kind marks this body as one that doesn't
	const clearSky = !spec.lease || (body !== null && spec.clearSky?.(body) === true)
	// Nothing fits, or a plan outlives TRANSIENTS.maxLife or reaches copy it was told to keep clear of or may never reach,
	// whatever the planner did: the room moves with the scroll, which posts no layout to try again on, so the kind only waits
	if (body === null || lifetime > TRANSIENTS.maxLife || (reachesCopy && (!nearCopy || clearSky))) {
		schedule.nextAt[kind] = now + between(random, ...TRANSIENTS.retry)
		return false
	}
	const envelope: TransientEnvelope<K> = {
		kind,
		body,
		startedAt: now,
		lifetime,
		nearCopy: reachesCopy,
		clearSky,
		scrollBound: !gate.readingKnown || reachesCopy || spec.lingers?.(body) === true,
		launchScrollY: gate.scrollY,
		cancelledAt: null,
	}
	// The one cast: the envelope is of the kind it was planned for, and the union of envelopes is what the schedule holds
	schedule.active.push(envelope as Transient)
	schedule.lastOnsetAt = now + (spec.lastOnset?.(body) ?? 0)
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
		if (launchKind(schedule, random, now, kind, gate, gate.field())) changed = true
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
