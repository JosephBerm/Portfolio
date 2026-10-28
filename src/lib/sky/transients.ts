import type { MeteorMemory } from './meteorKind'
import type { Meteor, MeteorField } from './meteors'
import type { Random } from './random'

/** The model behind each kind: what its planner returns and its drawing reads. */
export interface TransientBodies {
	meteor: Meteor
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in the order the scheduler checks them for a launch. */
export const TRANSIENT_KINDS = ['meteor'] as const satisfies readonly TransientKind[]

/** Where transients may fly: the viewport and the padded quiet rects on screen (CSS px), the field every kind plans in. */
export type SkyField = MeteorField

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

/** Whether and where transients may launch now; the worker refills one reused gate every tick. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches). */
	allowed: boolean
	/** No scroll for TRANSIENTS.scrollQuiet seconds. */
	settled: boolean
	/** A narrow screen (the worker's narrowScreen): phones keep their own limit, TRANSIENTS.narrowLimit. */
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
