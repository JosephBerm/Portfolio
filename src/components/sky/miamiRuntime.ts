import { ADAPT, DRIFT, HAZE_REBUILD_MS, PACING, SCENE } from '@/lib/sky/config'
import { SCENE_PACING, STAGE } from '@/lib/sky/miamiConfig'
import { descentWindow as descentWindowOf, sameStage, stageFrom, viewAt, type MiamiStage, type MiamiView } from '@/lib/sky/miamiStage'
import { driftCap, easeAt, easeEnded, easing, fadeOutAt, type Ease } from '@/lib/sky/pacing'
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
	/** `performance.now()` when the tick that makes this step began: a build slice ends `STAGE.buildSliceMs` after it, so what the tick did before the step is taken from the slice. */
	tickStart: number
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
	/** Seconds of ambient motion the scene has run: everything that moves on its own is a function of it, so a scene that stops stands where it is and goes on from there. */
	clock: number
	/** How much of its ambient motion the scene shows, 0 to 1: the presence and motion level, and 0 on a canvas too slow to run it. At 0 it rests in its still pose. */
	level: number
	/** How far the scene has stepped down for a slow canvas: 0, 1 or 2. A narrow screen starts at 1. */
	tier: 0 | 1 | 2
	/** How far the scene has eased in after a jump to the page's end, 0 to 1. */
	fade: number
	/** How much of the light the last step down took away still shows: 1 as the step is taken, then falling to 0 over ADAPT.thinFade, and 0 at all other times. */
	thin: number
	/** A draw threw: the next step ends the scene, and the plain sky replaces the half-drawn frame. */
	failed: boolean
}

/**
 * The landing scene's state in the sky worker: the stage measured from the page's layout, and what hangs on it. A stage
 * exists only where the page has a landing and Contact's copy above it, so everywhere else the sky is exactly the shared
 * sky's. The scene never takes the stars down with it: a stage that can't be measured, a build that throws or a draw that
 * throws leaves the plain sky for the rest of the visit.
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
	/** Advances the clock and the build. True when a frame must draw (a build finished, an ease ended, the scene failed). */
	step(input: MiamiStep): boolean
	/** Demand for this moment (reused object). */
	demand(input: MiamiStep): MiamiDemand
	/** Null while the scene is off screen, unbuilt or failed. */
	frame(input: MiamiStep): MiamiFrame | null
	/**
	 * What the scene's own draws took (ms) in a frame drawn with the scene on screen. Slow frames add up as the sky's do (more
	 * than ADAPT.slowFrameMs, net of fast ones, ADAPT.slowFrames times), and each time they do the scene steps down one
	 * tier, never back up: it draws less light, then fewer frames. It never touches adaptive quality, which steps the stars.
	 */
	noteSceneMs(milliseconds: number): void
	/**
	 * The scene is on screen on a canvas too slow to run it (a scene frame costs about SCENE_PACING.softwareCost sky frames,
	 * and the canvas can't draw that many at PACING.minFps), so it holds still: nothing else of the sky may ask for frames
	 * there, or each would draw the scene's whole ground again for nothing.
	 */
	stillOnScreen(scrollY: number, documentHeight: number, softwareFps: number): boolean
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

type Tier = 0 | 1 | 2

/** Whether a canvas is too slow to run the scene: one scene frame costs about SCENE_PACING.softwareCost sky frames, and it must really stand still there. */
const isStill = (softwareFps: number): boolean => softwareFps / SCENE_PACING.softwareCost < PACING.minFps

/** The lift below which the scene's own motion is on screen: the horizon group moves against the page from the waterline's entry, and the warm band carries the clouds. */
const movesBelow = (stage: MiamiStage): number => Math.max(stage.zWarmTop, stage.horizonEnter)

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
	/** Ticks in a row that had spent the slice before the build was reached, for the build under way (STAGE.starveTicks). */
	let starved = 0
	/** `setSize` was told a pixel ratio other than the one of the bitmaps; cleared when a build starts, which reads the worker's ratio. */
	let dprStale = false
	/** When (worker-clock ms) the stage or the pixel ratio last changed enough to need new bitmaps. */
	let changedAt = -Infinity
	/** When (s) the ease in after a jump to the page's end began; null for none. */
	let easeSince: number | null = null
	/** The clock (s) of the last frame handed to a draw. */
	let shownAt = -Infinity
	/**
	 * How much the horizon and the foreground move against the page: 1 under full motion and 0 under reduced, easing over
	 * STAGE.rateEase from where it stood whenever the motion changes, so a Pause or a Play with the page standing still
	 * settles the picture instead of throwing it. Null until the first step seeds it at its motion's own value, so a page
	 * loaded part way down doesn't slide.
	 */
	let rate: Ease | null = null
	/**
	 * Seconds of ambient motion the scene has run. It advances only while the scene's moving parts are on screen, by the
	 * level times the time since the last step (at most DRIFT.maxStep of it, so a stalled frame or a tab that has just come
	 * back never jumps the water), which is why a pause, an idle stretch, a hidden tab and a stretch scrolled away from the
	 * water all leave it where it was.
	 */
	let clock = 0
	/** When (worker-clock ms) the last step ran; null before the first. */
	let steppedAt: number | null = null
	/** The scene's own slow frames, net of fast ones, and the steps down they have made: 0 to 2, one way, apart from adaptive quality's. */
	let sceneSlow = 0
	let sceneTier = 0
	/** The tier the last call used, to see a step up; null before the first, which only seeds it. */
	let seenTier: Tier | null = null
	/** When (s) the last step up began, which the light it takes away fades from; null where none has. */
	let thinSince: number | null = null

	const view: MiamiView = {
		end: 0,
		lift: 0,
		horizonY: 0,
		nearDrop: 0,
		farDrop: 0,
		farAlpha: 0,
		palmShift: 0,
		sunAlpha: 0,
		haloScale: 0,
		glitterOpen: 0,
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

	/** The motion share at this step, 0 to 1: the first step seeds it, and a change of motion eases it from the value it has. */
	const motionShare = (input: MiamiStep): number => {
		const t = input.now / 1000
		const goal = input.motionFull ? 1 : 0
		if (rate === null) rate = { from: goal, to: goal, since: -Infinity }
		else if (rate.to !== goal) rate = { from: easeAt(rate, STAGE.rateEase, t), to: goal, since: t }
		return easeAt(rate, STAGE.rateEase, t)
	}

	/**
	 * The tier at this step: how far the scene has stepped down, which is the stricter of adaptive quality's steps and the scene's
	 * own, and never above the last; a narrow screen starts at the second. A step up starts the fade of the light it takes away.
	 * A fall (a resize across the narrow limit) starts none, because adding light needs no fade, and the first call only seeds it.
	 */
	const tierOf = (input: MiamiStep): Tier => {
		const tier = Math.min(2, Math.max(input.quality, sceneTier, input.narrow ? 1 : 0)) as Tier
		if (seenTier !== null && tier > seenTier) thinSince = input.now / 1000
		else if (seenTier !== null && tier < seenTier) thinSince = null
		seenTier = tier
		return tier
	}

	/** How much of the light the last step up took away still shows at `t` (s): 1 as it is taken, 0 once it has faded and while no step has been. */
	const thinAt = (t: number): number => (thinSince === null ? 0 : fadeOutAt(thinSince, ADAPT.thinFade, t))

	/** Ends a build under way, closing the bitmaps it had made so far. */
	const abort = (): void => {
		starved = 0
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

	/**
	 * Runs the build until the worker clock reaches `deadline` (ms), or to its end with Infinity; the assets once it is done,
	 * else null. The clock is read before each piece, so a slice runs over its deadline by at most the piece that began before
	 * it, and a tick that spent its budget before the build was reached builds nothing. That would starve a rebuild behind work
	 * that spends the budget every tick, with the old bitmaps on screen and fade frames asking for more, so after
	 * STAGE.starveTicks such ticks in a row one piece is built anyway: a slow build, but one that finishes.
	 */
	const advance = (current: Building, deadline: number): MiamiAssets | null => {
		let pieces = 0
		for (;;) {
			if (performance.now() >= deadline) {
				if (pieces > 0 || ++starved < STAGE.starveTicks) {
					if (pieces > 0) starved = 0
					return null
				}
				starved = 0
			}
			const result = current.generator.next()
			pieces++
			if (result.done) {
				starved = 0
				if (!result.value) throw new RangeError('The scene build ended without assets')
				return result.value
			}
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
			motionShare(input)
			tierOf(input)
			const elapsed = steppedAt === null ? 0 : Math.min(DRIFT.maxStep, Math.max(0, (input.now - steppedAt) / 1000))
			steppedAt = input.now
			if (failed) return false
			// A draw threw part way: the plain sky replaces the half-drawn frame
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
			const lift = Math.max(0, input.documentHeight - input.scrollY - size.height)
			// What moves of its own runs only while its moving parts are on screen, and not at all on a canvas too slow for it
			if (lift < movesBelow(current) && !isStill(input.softwareFps)) clock += input.level * elapsed
			try {
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
					// With nothing built yet, a scene that shows now can't wait for slices. Any other slice counts from the start of the tick, so the work the tick did first shortens it
					const urgent = needed && !baked
					const assets = advance(building, urgent ? Infinity : input.tickStart + STAGE.buildSliceMs)
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
			// The horizon's own ease has run out: if the scene was on screen for it, one more frame shows where it ended. So has the fade of the light
			// a step down took away: a worker about to sleep would otherwise keep showing it part way
			if (lift < current.zShow) {
				const t = input.now / 1000
				if (easeEnded(rate?.since ?? null, STAGE.rateEase, t, shownAt) || easeEnded(thinSince, ADAPT.thinFade, t, shownAt)) redraw = true
			}
			return redraw
		},
		demand(input) {
			motionShare(input)
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
			const still = isStill(input.softwareFps)
			// Ambient motion asks for frames only while it shows: its moving parts on screen, full motion and a visitor who is here, on a canvas that can afford it.
			// A step down, adaptive quality's or the scene's own, takes the pace from SCENE_PACING.fps (SCENE_PACING.narrowFps on a narrow screen) to its slowFps
			if (lift < movesBelow(stage) && input.ambientOn && !still) {
				demanded.fps = Math.max(input.quality, sceneTier) > 0 ? SCENE_PACING.slowFps : input.narrow ? SCENE_PACING.narrowFps : SCENE_PACING.fps
			}
			// The drift's caps, and a third of what a software canvas can draw, since a scene frame costs about that many sky frames there
			demanded.cap = Math.min(driftCap(input.narrow, input.quality > 0, input.softwareFps), input.softwareFps / SCENE_PACING.softwareCost)
			// The horizon slides to its new pace over a couple of seconds, and a page standing still draws nothing unless asked: a landed scene moves with nothing to ease.
			// The glide asks for frames on display refreshes, at the scene's own pace at least, so it lands on them and steps no more than it must
			if (lift > 0 && lift < stage.zShow && easing(rate?.since ?? null, STAGE.rateEase, input.now / 1000)) {
				demanded.easing = true
				if (!still) demanded.fps = Math.max(demanded.fps, SCENE_PACING.fps)
			}
			// The light a step down took away fades out over a second of frames, whatever else has gone still
			if (lift < stage.zShow && easing(thinSince, ADAPT.thinFade, input.now / 1000)) demanded.easing = true
			return demanded
		},
		frame(input) {
			const share = motionShare(input)
			if (!stage || !baked) return null
			viewAt(baked.key.stage, input.scrollY, input.documentHeight, share, view)
			if (!view.onScreen) return null
			const tier = tierOf(input)
			shownAt = input.now / 1000
			const fade = easeSince === null ? 1 : smoothstep(0, STAGE.jumpEase, shownAt - easeSince)
			shown ??= { stage: baked.key.stage, view, assets: baked.assets, clock, level: 0, tier, fade, thin: 0, failed: false }
			shown.stage = baked.key.stage
			shown.assets = baked.assets
			shown.fade = fade
			shown.clock = clock
			shown.level = isStill(input.softwareFps) ? 0 : input.level
			shown.tier = tier
			shown.thin = thinAt(shownAt)
			return shown
		},
		noteSceneMs(milliseconds) {
			// Adaptive quality's law, on the scene's own time: slow frames net of fast ones, one step down at a time, never back up
			sceneSlow = milliseconds > ADAPT.slowFrameMs ? sceneSlow + 1 : Math.max(0, sceneSlow - 1)
			if (sceneSlow < ADAPT.slowFrames || sceneTier >= 2) return
			sceneTier++
			sceneSlow = 0
		},
		stillOnScreen(scrollY, documentHeight, softwareFps) {
			if (!stage || !size || !isStill(softwareFps)) return false
			return Math.max(0, documentHeight - scrollY - size.height) < stage.zShow
		},
	}
}
