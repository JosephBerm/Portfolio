import { descentWindow as descentWindowOf, stageFrom, type MiamiStage } from '@/lib/sky/miamiStage'
import type { LandingRect, SkyRect, SkyTokens } from '@/lib/sky/protocol'
import type { DescentWindow } from '@/lib/sky/scene'

/** What the worker knows of the page's layout, as its last `layout` message said. */
export interface MiamiLayout {
	documentHeight: number
	landing: LandingRect | null
	quiet: readonly SkyRect[]
	pinned: readonly SkyRect[]
}

/** What the worker tells the scene at each tick (filled into one reused object, so a tick makes no garbage). */
export interface MiamiStep {
	/** Worker-clock milliseconds. */
	now: number
	scrollY: number
	documentHeight: number
	/** The worker's pixel ratio. */
	dpr: number
	/** Adaptive quality's step so far: 0, 1 or 2. */
	quality: number
	narrow: boolean
	/** Frames a second a software-rasterized canvas can afford; Infinity for a GPU canvas. */
	softwareFps: number
	/** How much ambient motion there is: the presence gate's level times the motion level, 0 to 1. */
	level: number
	/** The motion is 'full', not paused or reduced. */
	motionFull: boolean
	/** Ambient motion is wanted: full motion and a visitor who is still here. */
	ambientOn: boolean
	/** The quiet zones are still easing toward a new layout. */
	quietEasing: boolean
}

/** What the scene asks of the frame clock for this moment (a reused object). */
export interface MiamiDemand {
	/** Frames a second its ambient motion wants; 0 for none. */
	fps: number
	/** Most frames a second it may draw. */
	cap: number
	/** Its silhouettes are on screen. */
	onScreen: boolean
	/** An ease is running: fade frames. */
	easing: boolean
	/** The bitmaps are out of date or being built, and the frame that shows them is still to come. */
	rebuilding: boolean
}

/** What the scene's draws read (a reused object). */
export interface MiamiFrame {
	stage: MiamiStage
	clock: number
	level: number
	tier: 0 | 1 | 2
	fade: number
	thin: number
	failed: boolean
}

/**
 * The landing scene's state in the sky worker: the stage measured from the page's layout, and what hangs on it. A stage
 * exists only where the page has a landing and Contact's copy above it, so everywhere else the sky is exactly the shared
 * sky's. The scene never takes the stars down with it: a stage that can't be measured leaves today's sky for the rest of
 * the visit.
 */
export interface MiamiRuntime {
	/** The current stage, for descentWindow and eventFloorY; null with none, and once the scene has failed on this visit. */
	readonly stage: MiamiStage | null
	setTokens(tokens: SkyTokens): void
	setLayout(layout: MiamiLayout): void
	/** The canvas size (CSS px) and the worker's pixel ratio after the canvas was sized. */
	setSize(width: number, height: number, dpr: number): void
	/** The contrast preference (prefers-contrast: more). */
	setContrast(more: boolean): void
	/** Forgets what was built from the stage, as a lost GPU context requires. */
	dropAssets(): void
	/** Where the descent runs, for sceneAt; null with no stage. The same object until the stage changes. */
	descentWindow(): DescentWindow | null
	/** Advances the clock and the build. True when a frame must draw (a build finished, an ease ended, the scene failed). */
	step(input: MiamiStep): boolean
	/** Demand for this moment (reused object). */
	demand(input: MiamiStep): MiamiDemand
	/** Null while the scene is off screen, unbuilt or failed. */
	frame(input: MiamiStep): MiamiFrame | null
}

/** The demand of a scene that draws nothing. */
const NO_DEMAND: MiamiDemand = { fps: 0, cap: Infinity, onScreen: false, easing: false, rebuilding: false }

/** The runtime for one worker: its pieces arrive by message, in any order, and the stage follows whatever it has. */
export function createMiamiRuntime(): MiamiRuntime {
	let tokens: SkyTokens | null = null
	let more = false
	let size: { width: number; height: number } | null = null
	let layout: MiamiLayout | null = null
	let stage: MiamiStage | null = null
	let descent: DescentWindow | null = null
	let failed = false

	/** Measures the stage again from what the runtime knows; null until it knows a size, the tokens and a layout. */
	const restage = (): void => {
		if (failed) return
		try {
			stage =
				tokens && size && layout
					? stageFrom({ width: size.width, height: size.height, documentHeight: layout.documentHeight, landing: layout.landing, quiet: layout.quiet, pinned: layout.pinned, tokens, more })
					: null
		} catch {
			// An uncaught throw would reach the worker's error event, and the page would lose its whole sky
			failed = true
			stage = null
		}
		descent = stage ? descentWindowOf(stage) : null
	}

	return {
		get stage() {
			return stage
		},
		setTokens(next) {
			tokens = next
			restage()
		},
		setLayout(next) {
			layout = next
			restage()
		},
		setSize(width, height, _dpr) {
			size = { width, height }
			restage()
		},
		setContrast(next) {
			more = next
			restage()
		},
		dropAssets() {
			// The stage owns no bitmaps, so a lost context leaves nothing to drop
		},
		descentWindow: () => descent,
		step: (_input) => false,
		demand: (_input) => NO_DEMAND,
		frame: (_input) => null,
	}
}
