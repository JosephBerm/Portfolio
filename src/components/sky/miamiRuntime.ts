import { HAZE_REBUILD_MS, SCENE } from '@/lib/sky/config'
import { STAGE } from '@/lib/sky/miamiConfig'
import { descentWindow as descentWindowOf, sameStage, stageFrom, viewAt, type MiamiStage, type MiamiView } from '@/lib/sky/miamiStage'
import type { LandingRect, SkyRect, SkyTokens } from '@/lib/sky/protocol'
import { smoothstep, type DescentWindow } from '@/lib/sky/scene'
import { buildMiamiAssets, closeMiamiAssets, type MiamiAssets } from './miamiAssets'

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

/**
 * What the scene's draws read (a reused object). `stage` is the one the bitmaps were built for, which trails the page's
 * layout while they rebuild, and `assets.dpr` is the pixel ratio they were built at.
 */
export interface MiamiFrame {
	stage: MiamiStage
	view: MiamiView
	assets: MiamiAssets
	/** Seconds of ambient motion the scene has run. */
	clock: number
	/** How much of its ambient motion the scene shows, 0 to 1. */
	level: number
	/** How much the scene has stepped down for a slow canvas. */
	tier: 0 | 1 | 2
	/** How far the scene has eased in after a jump to the page's end, 0 to 1. */
	fade: number
	/** How much of the light a step down takes away the scene still shows, 1 before any step. */
	thin: number
	/** A draw threw: the next step ends the scene, and the plain sky replaces the half-drawn frame. */
	failed: boolean
}

/**
 * The landing scene's state in the sky worker: the stage measured from the page's layout, and what hangs on it. A stage
 * exists only where the page has a landing and Contact's copy above it, so everywhere else the sky is exactly the shared
 * sky's. The scene never takes the stars down with it: a stage that can't be measured, a build that throws or a draw that
 * throws leaves today's sky for the rest of the visit.
 */
export interface MiamiRuntime {
	/** The current stage, for descentWindow and eventFloorY; null with none, and once the scene has failed on this visit. */
	readonly stage: MiamiStage | null
	setTokens(tokens: SkyTokens): void
	setLayout(layout: MiamiLayout): void
	/** The canvas size (CSS px) and the worker's pixel ratio after the canvas was sized. A ratio that differs from the one the bitmaps were built at marks them out of date. */
	setSize(width: number, height: number, dpr: number): void
	/** The contrast preference (prefers-contrast: more). */
	setContrast(more: boolean): void
	/** Forgets what was built from the stage, as a lost GPU context requires; the next step builds it again. */
	dropAssets(): void
	/** Where the descent runs, for sceneAt; null with no stage. The same object until the stage changes. */
	descentWindow(): DescentWindow | null
	/** Advances the build. True when a frame must draw (a build finished, an ease ended, the scene failed). */
	step(input: MiamiStep): boolean
	/** Demand for this moment (reused object). */
	demand(input: MiamiStep): MiamiDemand
	/** Null while the scene is off screen, unbuilt or failed. */
	frame(input: MiamiStep): MiamiFrame | null
}

/** What a set of bitmaps was built from; a bake is out of date once the runtime's own differ. */
interface BakeKey {
	stage: MiamiStage
	/** The worker's pixel ratio when the build started. */
	dpr: number
	/** The theme's navy, which the sky's last color joins. */
	navy: string
}

/** Bitmaps on screen. */
interface Baked {
	key: BakeKey
	assets: MiamiAssets
}

/** A build under way, and the key it was started with. */
interface Building {
	key: BakeKey
	generator: Generator<void, MiamiAssets | null, undefined>
}

/** The demand of a scene that draws nothing. */
const NO_DEMAND: MiamiDemand = { fps: 0, cap: Infinity, onScreen: false, easing: false, rebuilding: false }

/** The runtime for one worker: its pieces arrive by message, in any order, and the stage follows whatever it has. */
export function createMiamiRuntime(): MiamiRuntime {
	let tokens: SkyTokens | null = null
	/** The navy token as a key, kept so a step makes no garbage. */
	let navy = ''
	let more = false
	let size: { width: number; height: number } | null = null
	let layout: MiamiLayout | null = null
	let stage: MiamiStage | null = null
	let descent: DescentWindow | null = null
	let failed = false

	/** The bitmaps in use. Every draw reads the stage they were built for, so a layout that moves under them never leaves a gap. */
	let baked: Baked | null = null
	let building: Building | null = null
	/** `setSize` was told a pixel ratio other than the one of the bitmaps; cleared when a build starts, which reads the worker's ratio. */
	let dprStale = false
	/** When (worker-clock ms) the stage or the pixel ratio last changed enough to need new bitmaps. */
	let changedAt = -Infinity
	/** When (s) the ease in after a jump to the page's end began; null for none. */
	let easeSince: number | null = null
	/** The clock (s) of the last frame handed to a draw. */
	let shownAt = -Infinity

	const view: MiamiView = {
		end: 0,
		lift: 0,
		horizonY: 0,
		palmShift: 0,
		wingLeft: 0,
		wingRight: 0,
		wingTopLeft: 0,
		wingTopRight: 0,
		onScreen: false,
		moving: false,
	}
	/** The frame the draws read; made on the first scene frame, and kept so a draw's `failed` outlives the next call. */
	let shown: MiamiFrame | null = null
	const demanded: MiamiDemand = { ...NO_DEMAND }

	/** Whether a build made for `key` no longer fits what the runtime knows now. */
	const outOfDate = (key: BakeKey): boolean => stage === null || !sameStage(key.stage, stage) || key.navy !== navy || dprStale

	/** Ends a build under way, closing the bitmaps it had made so far. */
	const abort = (): void => {
		if (!building) return
		building.generator.return(null)
		building = null
	}

	/** Ends any build and closes what is built. */
	const release = (): void => {
		abort()
		if (baked) {
			closeMiamiAssets(baked.assets)
			baked = null
		}
		easeSince = null
	}

	/** The scene is over for this visit: an uncaught throw would reach the worker's error event, and the page would lose its whole sky. */
	const fail = (): void => {
		failed = true
		stage = null
		descent = null
		release()
	}

	/** Measures the stage again from what the runtime knows; null until it knows a size, the tokens and a layout. */
	const restage = (): void => {
		if (failed) return
		const before = stage
		try {
			stage =
				tokens && size && layout
					? stageFrom({ width: size.width, height: size.height, documentHeight: layout.documentHeight, landing: layout.landing, quiet: layout.quiet, pinned: layout.pinned, tokens, more })
					: null
		} catch {
			fail()
			return
		}
		descent = stage ? descentWindowOf(stage) : null
		if (before === null ? stage !== null : stage === null || !sameStage(before, stage)) changedAt = performance.now()
	}

	/** Runs the build for up to `budget` ms, or to its end with Infinity; the assets once it is done, else null. */
	const advance = (current: Building, budget: number): MiamiAssets | null => {
		const until = performance.now() + budget
		for (;;) {
			const result = current.generator.next()
			if (result.done) {
				if (!result.value) throw new RangeError('The scene build ended without assets')
				return result.value
			}
			if (performance.now() >= until) return null
		}
	}

	return {
		get stage() {
			return stage
		},
		setTokens(next) {
			tokens = next
			navy = next.navy.join(',')
			restage()
		},
		setLayout(next) {
			layout = next
			restage()
		},
		setSize(width, height, dpr) {
			size = { width, height }
			// A quality step changes the worker's ratio without telling us, so only a size message can mark the bitmaps out of date
			const builtAt = building?.key.dpr ?? baked?.key.dpr
			if (builtAt !== undefined && dpr !== builtAt) {
				dprStale = true
				changedAt = performance.now()
			}
			restage()
		},
		setContrast(next) {
			more = next
			restage()
		},
		dropAssets() {
			release()
		},
		descentWindow: () => descent,
		step(input) {
			if (failed) return false
			// A draw threw part way: today's sky replaces the half-drawn frame
			if (shown?.failed) {
				fail()
				return true
			}
			const current = stage
			if (!current || !tokens || !size) {
				// No scene any more (the landing went, or the page is no taller than the canvas): nothing stays built
				release()
				return false
			}
			let redraw = false
			try {
				const lift = Math.max(0, input.documentHeight - input.scrollY - size.height)
				// The scene shows now, and a bake not ready for it must be finished at once
				const needed = lift < current.zShow
				// The bake starts ahead of the scene, but not inside the hero
				const ahead = lift < current.zShow + STAGE.bakeAhead * size.height && input.scrollY >= SCENE.heroFadeTo * size.height
				// A rebuild waits for the page to settle, as the haze does
				const settled = input.now - changedAt >= HAZE_REBUILD_MS && !input.quietEasing
				// A stale build is never finished
				if (building && outOfDate(building.key)) abort()
				if (!building && (!baked || outOfDate(baked.key)) && (needed ? !baked || settled : ahead && settled)) {
					dprStale = false
					building = { key: { stage: current, dpr: input.dpr, navy }, generator: buildMiamiAssets(current, input.dpr, tokens) }
				}
				if (building) {
					// With nothing built yet, a scene that shows now can't wait for slices
					const urgent = needed && !baked
					const assets = advance(building, urgent ? Infinity : STAGE.buildSliceMs)
					if (assets) {
						const previous = baked
						baked = { key: building.key, assets }
						building = null
						if (previous) closeMiamiAssets(previous.assets)
						redraw = true
						// Eased in from the time the build ended: the tick's own time is from before it, and a long build would show the scene whole in one frame
						if (urgent) easeSince = performance.now() / 1000
					}
				}
			} catch {
				fail()
				return true
			}
			if (easeSince !== null && input.now / 1000 - easeSince >= STAGE.jumpEase) {
				// The last frame drawn may still show the ease part way: one more shows its end
				if (shownAt - easeSince < STAGE.jumpEase) redraw = true
				easeSince = null
			}
			return redraw
		},
		demand(input) {
			demanded.fps = 0
			demanded.cap = Infinity
			demanded.onScreen = false
			demanded.rebuilding = false
			demanded.easing = easeSince !== null
			if (!stage || !size) return demanded
			const lift = Math.max(0, input.documentHeight - input.scrollY - size.height)
			demanded.onScreen = lift < Math.max(stage.zWater + stage.warmArt, stage.horizonEnter)
			// Frames until the bitmaps for what shows are in place, even when the worker would sleep, or they would wait for the next input
			demanded.rebuilding = lift < stage.zShow && (building !== null || !baked || outOfDate(baked.key))
			return demanded
		},
		frame(input) {
			if (!stage || !baked) return null
			viewAt(baked.key.stage, input.scrollY, input.documentHeight, input.motionFull ? 1 : 0, view)
			if (!view.onScreen) return null
			shownAt = input.now / 1000
			const fade = easeSince === null ? 1 : smoothstep(0, STAGE.jumpEase, shownAt - easeSince)
			// The scene holds still: no clock runs, nothing moves in the wind or the water, it is on its first tier and nothing is thinned out
			shown ??= { stage: baked.key.stage, view, assets: baked.assets, clock: 0, level: 0, tier: 0, fade, thin: 1, failed: false }
			shown.stage = baked.key.stage
			shown.assets = baked.assets
			shown.fade = fade
			return shown
		},
	}
}
