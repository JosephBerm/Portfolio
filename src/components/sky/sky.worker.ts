/**
 * Sky worker: owns the transferred canvas and draws the night sky off the main thread. It only draws while something
 * changes. A sky that only changes brightness draws from timers: 15 fps for twinkle, 30 fps for fades (the dusk, a
 * lingering train). Anything that moves draws on animation frames: every one while a shooting star flies or the page
 * scrolls, and every k-th one (PACING; every one while a glide is fast) while the stars drift or glide to rest after
 * the page stops. A missing or stalled animation-frame clock is answered by a watchdog and then a 60 Hz timer. Hidden
 * tabs, paused or reduced motion, and visits with no input for a while sleep, the last once the drift and twinkle have
 * eased out. Reading no longer sleeps: the stars still drift there, slowly.
 */

import {
	cameraOffset,
	cameraSpeed,
	createCamera,
	driftRate,
	driftTarget,
	driftWanted,
	forgetStep,
	resumeCamera,
	stepCamera,
	type CameraInput,
	type DriftGate,
	type Vec,
} from '@/lib/sky/camera'
import { densityKeep } from '@/lib/sky/catalog'
import { ADAPT, CONTRAST_MORE, CONTRAST_NORMAL, DEPTH, FRAME, HAZE_REBUILD_MS, METEOR, NARROW_MAX_WIDTH, PACING, QUIET } from '@/lib/sky/config'
import { meteorLifetime, meteorMoving, nextMeteorGap, pickRadiant, planMeteor, type Meteor, type MeteorField, type Point } from '@/lib/sky/meteors'
import {
	createRefreshEstimate,
	driftCap,
	easeAt,
	easeEnded,
	easing,
	EVERY_FRAME,
	FADE_FRAMES,
	fadeOutAt,
	frameDemand,
	frameDue,
	NO_FRAMES,
	refreshDivisor,
	stepDivisor,
	type Divisor,
	type Ease,
	type FrameDemand,
	type FrameState,
} from '@/lib/sky/pacing'
import { createPresence, isIdle, notePresence, presenceLevel } from '@/lib/sky/presence'
import type { SkyMainMessage, SkyMotion, SkyRect, SkyTokens, SkyWorkerMessage } from '@/lib/sky/protocol'
import { between } from '@/lib/sky/random'
import { emergenceDone, hazeEmergence, sameRects, sceneAt, screenQuietZones, scrollKept, smoothstep, type QuietBlend, type SceneLevels } from '@/lib/sky/scene'
import { createStarField, drawMeteor, drawSky, type SkyAssets, type SkyFrame } from './renderSky'
import { buildHaze, buildStarAtlas, starPalette } from './skyAssets'

/** The parts of DedicatedWorkerGlobalScope the sky uses (the project's TypeScript lib is DOM only). */
interface SkyWorkerScope {
	postMessage(message: SkyWorkerMessage): void
	addEventListener(type: 'message', listener: (event: MessageEvent<SkyMainMessage>) => void): void
	/** Not every worker has the animation-frame pair: where it is missing, a timer stands in for the display. */
	requestAnimationFrame?(callback: (time: number) => void): number
	cancelAnimationFrame?(handle: number): void
}

type LayoutMessage = Extract<SkyMainMessage, { type: 'layout' }>

const scope = self as unknown as SkyWorkerScope
const field = createStarField()
/** Shooting stars vary per visit; the star catalog itself is seeded and fixed. */
const random = Math.random

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let assets: SkyAssets | null = null
let tokens: SkyTokens | null = null

let width = 0
let height = 0
let dpr = 1
let motion: SkyMotion = 'full'
let visible = true
let contrastMore = false
let scrollY = 0
let parallaxScroll = 0
let documentHeight = 0
let quiet: readonly SkyRect[] = []
let pinned: readonly SkyRect[] = []
// The rects a new layout eases in from (none before the first)
let quietBefore: readonly SkyRect[] = []
let pinnedBefore: readonly SkyRect[] = []
// The newest layout that arrived while an ease was running, applied when it ends
let pendingLayout: LayoutMessage | null = null

// Milliseconds on the worker clock
let lastScrollAt = -Infinity
let lastDrawAt = -Infinity
let hiddenAt: number | null = null
// Seconds on the worker clock
let exitAt: number | null = null
let revealAt: number | null = null
let layoutAt: number | null = null
let nextMeteorAt = Infinity
/** Seconds the tab has spent hidden, each stretch added when it is shown again: the twinkle's clock leaves them out. */
let hiddenTotal = 0

let meteor: Meteor | null = null
// The scroll offset the shooting star launched at (SCROLL_CANCEL)
let launchScrollY = 0
let radiant: Point | null = null
let launched = 0
let failedPlans = 0

/** Whether the visitor seems to be here. Scroll, visibility and motion messages can reach it before init, so it exists from the start; init begins it afresh. */
let presence = createPresence(0)

/** The camera every star is drawn through; init puts it on the restored scroll. */
let camera = createCamera(0)
/** The camera's offset for the frame being drawn (reused). */
const offset: Vec = { x: 0, y: 0 }
/** What the camera follows on its next step (reused, so a step makes no garbage). */
const cameraInput: CameraInput = { time: 0, scroll: 0, viewportHeight: 0, follow: false, drift: 0 }
/** Whether the camera moved on its last step: it then needs motion frames, and stopping draws one last frame. */
let cameraMoving = false
/** Motion has been full at some point in this page view: until then stars sit at whole device pixels, so a sky that has never moved draws crisp points. */
let skyMoved = false
/**
 * How much of its motion the sky has: 1 under full motion, 0 otherwise. When the motion changes (the pause control, a
 * reduced-motion switch) the level eases over FRAME.motionEase from where it was, so neither the twinkle nor the drift
 * stops or starts in one frame. `since` is on the worker clock (s); a load starts at rest on its motion's level.
 */
let motionLevel: Ease = { from: 1, to: 1, since: -Infinity }
/** A narrow screen (NARROW_MAX_WIDTH), set in resize: the drift runs slower and draws fewer frames there. */
let narrowScreen = false
/** Frames a second a software-rasterized canvas can afford at PACING.softwareShare of a core, measured by probeRaster; Infinity for a GPU canvas. */
let softwareFps = Infinity
/** What the drift and the twinkle depend on right now, filled by gather (reused, so a frame decision makes no garbage). */
const driftGate: DriftGate = { allowed: false, dusk: 0, on: false, level: 0, scene: 0, narrow: false }

let quality = 0
let slowFrames = 0
/** When (s on the worker clock) the first quality step began thinning the stars out, which then fade over ADAPT.thinFade; null before it. */
let thinnedAt: number | null = null
/** The pending animation frame request; null when there is none (a request id can be 0). */
let rafId: number | null = null
/** The pending frame timer: a fade or twinkle frame, the next shooting star, or where animation frames fail, any frame. */
let timerId: ReturnType<typeof setTimeout> | undefined
let hazeTimer: ReturnType<typeof setTimeout> | undefined
let needsDraw = false
let ready = false

/** Whether animation frames can be relied on. False where the worker has none and after repeated stalls: a 60 Hz timer then stands in for the display. */
let rafWorks = typeof scope.requestAnimationFrame === 'function'
/** Requested animation frames in a row that didn't come in time. */
let strikes = 0
/** Serves a requested animation frame that doesn't come. */
let watchdogId: ReturnType<typeof setTimeout> | undefined
/** The animation frame asked for to find out whether the display's clock is back, and when (ms) one was last asked for. */
let probeId: number | null = null
let probedAt = -Infinity
/** The display's refresh interval, measured from the animation frames' timestamps. */
const refresh = createRefreshEstimate()
/** How many display refreshes pass per drawn frame while something moves. */
const divisor: Divisor = { k: 1, slowerSince: null }

/** Backing-store pixels for a CSS length (never zero). */
function deviceSize(cssSize: number, ratio: number): number {
	return Math.max(1, Math.round(cssSize * ratio))
}

/** The contrast preference's levels: stars, haze and the share of each copy's budget a shooting star may light. */
function contrastLevels(): typeof CONTRAST_NORMAL | typeof CONTRAST_MORE {
	return contrastMore ? CONTRAST_MORE : CONTRAST_NORMAL
}

/**
 * Gathers the gates for `now`: the drift's, and the ambient flag and level the twinkle shares with it (one presence
 * gate for all ambient motion). Everything that reads them calls it first (tick before it steps the camera, demandNow
 * at every frame decision, frameAt for the twinkle), so a message that wakes a sleeping worker is judged on fresh
 * gates; for one `now` it gives the same values.
 */
function gather(now: number, scene: SceneLevels): void {
	const t = now / 1000
	driftGate.allowed = exitAt !== null && softwareFps >= PACING.minFps
	driftGate.dusk = exitAt === null ? 0 : t - exitAt
	driftGate.on = motion === 'full' && !isIdle(presence, now)
	driftGate.level = presenceLevel(presence, now) * easeAt(motionLevel, FRAME.motionEase, t)
	driftGate.scene = scene.drift
	driftGate.narrow = narrowScreen
}

/** Twinkle strength right now: the scene's, times the ambient level gather found (presence and the motion level together). */
function twinkleLevel(scene: SceneLevels): number {
	return scene.twinkle * driftGate.level
}

/** The next shooting star waits at least METEOR.afterReturn once the visitor is back (a tab, an idle stretch, full motion). */
function holdMeteors(now: number): void {
	if (revealAt !== null) nextMeteorAt = Math.max(nextMeteorAt, now / 1000 + METEOR.afterReturn)
}

/** Records input of any kind; back from an idle stretch, no shooting star straight away. */
function noteInput(now: number): void {
	if (notePresence(presence, now)) holdMeteors(now)
}

/** True at time t (s) while the quiet zones still ease toward the layout applied at `layoutAt` (QUIET.ease long). */
function quietEasing(t: number): boolean {
	return layoutAt !== null && t - layoutAt < QUIET.ease
}

/** What the frame clock sees now (reused). */
const frameState: FrameState = {
	live: false,
	scrolling: false,
	full: false,
	transientDemand: NO_FRAMES,
	cameraActive: false,
	cameraSpeed: 0,
	cameraCap: Infinity,
	fading: false,
	twinkleFps: 0,
}

/**
 * The strictest demand of every part of the sky right now. It gathers the gates and reads the worker's state afresh at
 * every frame decision, so a message that wakes a sleeping worker is judged on this moment, not on what the last frame
 * saw.
 */
function demandNow(now: number, scene: SceneLevels): FrameDemand {
	const t = now / 1000
	gather(now, scene)
	const wanted = driftWanted(driftGate)
	frameState.live = ctx !== null && visible && motion !== 'off' && exitAt !== null
	frameState.scrolling = now - lastScrollAt < FRAME.scrollSettleMs
	frameState.full = motion === 'full'
	frameState.transientDemand = meteor ? (meteorMoving(meteor, t) ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES
	// The stars keep gliding to rest after the page stops scrolling, and the drift asks for frames from the moment it
	// heads up, when its eased rate is still 0: a sleeping worker would never wake for it
	frameState.cameraActive = cameraMoving || wanted
	frameState.cameraSpeed = DEPTH.maxNearness * cameraSpeed(camera, wanted ? driftTarget(driftGate) : 0) * dpr
	frameState.cameraCap = wanted ? driftCap(narrowScreen, quality > 0, softwareFps) : Infinity
	// The dusk, copy that has just appeared or moved, the motion level easing and the thinned stars fading change slowly
	frameState.fading =
		(exitAt !== null && !emergenceDone(t - exitAt)) ||
		quietEasing(t) ||
		easing(motionLevel.since, FRAME.motionEase, t) ||
		easing(thinnedAt, ADAPT.thinFade, t)
	// Decided by where the twinkle is heading, not its level: waking from idle, it eases in from 0
	frameState.twinkleFps = driftGate.on && scene.twinkle > 0 ? (quality > 0 ? FRAME.slowTwinkleFps : FRAME.twinkleFps) : 0
	return frameDemand(frameState)
}

/** Drops any pending animation frame, watchdog or timer, and forgets the last refresh, so the gap before the next one isn't taken for a refresh interval. */
function cancelFrames(): void {
	if (rafId !== null) scope.cancelAnimationFrame?.(rafId)
	clearTimeout(timerId)
	clearTimeout(watchdogId)
	rafId = null
	timerId = undefined
	watchdogId = undefined
	refresh.pause()
}

/** True when a shooting star may launch at all right now (its own timing aside). */
function meteorsAllowed(now: number): boolean {
	return motion === 'full' && visible && revealAt !== null && !isIdle(presence, now) && sceneAt(scrollY, height, documentHeight).meteors
}

/**
 * Arranges the next wake-up for the strictest demand of the sky right now. Moving things (a shooting star, scrolling, the
 * drift, the stars gliding to rest) wake on animation frames, in step with the display, and tick draws on every k-th of
 * them. Slow changes (twinkle, fades) draw from a timer: no vsync subscription, so the worker sleeps between frames.
 * With nothing to draw, one timer is left for a change a message has just made or the next shooting star. A frame
 * already pending is left alone.
 */
function schedule(now: number): void {
	if (rafId !== null || !ctx || !visible) return
	clearTimeout(timerId)
	timerId = undefined
	const demand = demandNow(now, sceneAt(scrollY, height, documentHeight))
	if (demand.vsync) {
		requestFrame(now, demand)
		return
	}
	// Nothing moves: a later stretch of motion starts its wait for a lower need afresh, not from this one's
	divisor.slowerSince = null
	if (demand.fps <= 0) {
		// Asleep: the gap before the next animation frame is not a refresh interval
		refresh.pause()
		if (needsDraw && motion !== 'off') timerId = setTimeout(onTimer, 0)
		// Asleep in the hero (an idle twinkle, say): wake only for the next shooting star
		else if (Number.isFinite(nextMeteorAt) && meteorsAllowed(now)) timerId = setTimeout(onTimer, Math.max(0, nextMeteorAt * 1000 - now))
		return
	}
	timerId = setTimeout(onTimer, needsDraw ? 0 : Math.max(0, lastDrawAt + 1000 / demand.fps - now))
}

/**
 * Asks for the next wake-up of a moving sky: an animation frame, and a watchdog that serves it from a timer if it never
 * comes. Where animation frames can't be relied on, a 60 Hz timer stands in for the display instead. That timer is armed
 * against the last drawn frame, not from now: schedule runs after every message, and a timer re-armed from each would be
 * pushed back for as long as messages keep coming. It waits the divisor in use, or fewer refreshes if `demand` now needs
 * fewer (a scroll message since the last tick, say). In that mode one animation frame is also asked for every
 * PACING.reprobeMs, to find out whether the display's clock is back.
 */
function requestFrame(now: number, demand: FrameDemand): void {
	if (rafWorks) {
		clearTimeout(watchdogId)
		rafId = scope.requestAnimationFrame?.(onFrame) ?? null
		watchdogId = setTimeout(onStalled, PACING.watchdogMs)
		return
	}
	const k = Math.min(divisor.k, refreshDivisor(PACING.fallbackFps, demand.fps, demand.cap))
	timerId = setTimeout(onTimer, needsDraw ? 0 : Math.max(0, lastDrawAt + (k * 1000) / PACING.fallbackFps - now))
	if (now - probedAt < PACING.reprobeMs) return
	probedAt = now
	if (probeId !== null) scope.cancelAnimationFrame?.(probeId)
	probeId = scope.requestAnimationFrame?.(onProbe) ?? null
}

/** Timer-driven frame (fades, twinkle, a due shooting star, or any frame where animation frames can't be relied on). */
function onTimer(): void {
	timerId = undefined
	tick(performance.now())
}

/** Animation-frame-driven frame (a flying shooting star, scrolling, the drift, the stars gliding to rest): the display's own clock, so it also times the refresh. */
function onFrame(time: number): void {
	clearTimeout(watchdogId)
	watchdogId = undefined
	rafId = null
	strikes = 0
	refresh.sample(time)
	tick(time)
}

/**
 * A requested animation frame didn't come in time: a timer serves this frame instead. After PACING.watchdogStrikes misses
 * in a row animation frames are no longer relied on, until a probe finds the display's clock back.
 */
function onStalled(): void {
	watchdogId = undefined
	if (rafId !== null) scope.cancelAnimationFrame?.(rafId)
	rafId = null
	strikes++
	if (strikes >= PACING.watchdogStrikes) rafWorks = false
	tick(performance.now())
}

/** The probe's animation frame came: the display's clock works again. */
function onProbe(): void {
	probeId = null
	rafWorks = true
	strikes = 0
}

/**
 * The display's clock may be back (the tab was shown, the GPU context restored): count misses afresh, and where a timer
 * stands in for the clock, ask for an animation frame at the next chance instead of at the next probe.
 */
function recheckFrames(): void {
	strikes = 0
	probedAt = -Infinity
}

/**
 * One wake-up: update the shooting star, gather the gates and step the camera, draw if due, then schedule the next
 * wake-up. Moving things draw on every k-th display refresh, so each drawn frame stays up for the same time.
 */
function tick(now: number): void {
	updateMeteor(now)
	settleQuiet(now)
	const scene = sceneAt(scrollY, height, documentHeight)
	gather(now, scene)
	// Fade frames come 1/FRAME.fadeFps s apart, so the motion ease and the thin fade end between two of them: the last
	// frame shown still carries a trace of twinkle or of the thinned stars. One more frame shows the resting sky, which is
	// what stays on screen.
	const drawnAt = lastDrawAt / 1000
	if (easeEnded(motionLevel.since, FRAME.motionEase, now / 1000, drawnAt) || easeEnded(thinnedAt, ADAPT.thinFade, now / 1000, drawnAt)) needsDraw = true
	updateCamera(now)
	const demand = demandNow(now, scene)
	// Without the display's clock a 60 Hz timer stands in for it. WebKit's worker clock is a fixed 15 ms timer, not the
	// display: each of its ticks is a frame, divided only by a demand's cap
	const interval = rafWorks ? refresh.interval : 1000 / PACING.fallbackFps
	const fps = rafWorks && refresh.unaligned ? Infinity : demand.fps
	const k = demand.vsync ? stepDivisor(divisor, refreshDivisor(1000 / interval, fps, demand.cap), now) : 1
	if (needsDraw || frameDue(demand, now, lastDrawAt, k, interval)) draw(now)
	schedule(now)
}

/** Retires a finished or canceled shooting star and launches the next one when it is due and the moment allows. */
function updateMeteor(now: number): void {
	const t = now / 1000
	if (meteor) {
		// Scrolling away from where it launched takes it away: it would pass over copy the veil doesn't know (SCROLL_CANCEL)
		if (t - meteor.startedAt <= meteorLifetime(meteor) && scrollKept(launchScrollY, scrollY) > 0) return
		meteor = null
		needsDraw = true
	}
	if (revealAt === null || t < nextMeteorAt) return
	const narrow = width <= NARROW_MAX_WIDTH
	if (!meteorsAllowed(now) || now - lastScrollAt < FRAME.meteorScrollQuietMs || (narrow && launched >= METEOR.narrowLimit)) {
		nextMeteorAt = t + METEOR.recheck
		return
	}
	const plan = planLaunch({ width, height, quiet: screenQuietZones(quiet, scrollY, pinned) }, narrow, t)
	if (!plan) {
		failedPlans++
		// No room around the copy (a phone held sideways, say): stop trying until the layout changes
		nextMeteorAt = failedPlans >= METEOR.maxFailedPlans ? Infinity : t + between(random, METEOR.retry[0], METEOR.retry[1])
		return
	}
	failedPlans = 0
	meteor = plan
	launchScrollY = scrollY
	launched++
	nextMeteorAt = t + plan.duration + nextMeteorGap(random, t - revealAt)
}

/**
 * A plan for one launch. The radiant in hand is kept while it yields long flights, so shooting stars share a direction;
 * when it doesn't, fresh ones are tried. Long flights come first on every radiant, and a shorter fallback only when none
 * has room for a long one. The planner is told how much light the contrast preference leaves a shooting star on copy.
 * Returns null (and drops the radiant) when nothing fits.
 */
function planLaunch(meteorField: MeteorField, narrow: boolean, t: number): Meteor | null {
	const radiants = radiant ? [radiant] : []
	while (radiants.length < (radiant ? 1 : 0) + (narrow ? 1 : METEOR.radiantTries)) radiants.push(pickRadiant(random, meteorField.width, meteorField.height))
	const { meteorInk: ink } = contrastLevels()
	for (const flights of ['long', 'short'] as const) {
		for (const candidate of radiants) {
			const plan = planMeteor(random, meteorField, candidate, t, { flights, ink })
			if (plan) {
				radiant = candidate
				return plan
			}
		}
	}
	radiant = null
	return null
}

/** The quiet zones on screen at time t (s): the previous layout's easing into the current one's over QUIET.ease, and the waiting layout's, if one is. */
function quietBlend(t: number): QuietBlend {
	const level = layoutAt === null ? 1 : smoothstep(0, QUIET.ease, t - layoutAt)
	return {
		from: level < 1 ? screenQuietZones(quietBefore, scrollY, pinnedBefore) : [],
		to: screenQuietZones(quiet, scrollY, pinned),
		level,
		next: pendingLayout ? screenQuietZones(pendingLayout.quiet, scrollY, pendingLayout.pinned) : undefined,
	}
}

/**
 * Starts easing toward new rects: the ones on screen now become `from`, so a layout never changes the zones in one
 * frame. A layout that arrives mid-ease waits for it to end (the newest wins), because starting from the previous target
 * would jump every star by what the running ease had not yet shown; a shooting star keeps clear of the waiting one
 * meanwhile (QuietBlend.next). Any layout still waiting is older than this one, so it is dropped here: applied later, it
 * would put the zones back on a stale layout for good.
 */
function applyLayout(message: LayoutMessage, now: number): void {
	quietBefore = quiet
	pinnedBefore = pinned
	quiet = message.quiet
	pinned = message.pinned
	layoutAt = now / 1000
	pendingLayout = null
}

/**
 * Applies a waiting layout once the running ease is over, and asks for one more frame once the quiet ease has run out,
 * if the last one drawn still showed it part way. Fade frames come 1/FRAME.fadeFps s apart, so the ease ends between two
 * of them, and a worker about to sleep (reduced motion, reading) would keep the older state.
 */
function settleQuiet(now: number): void {
	const t = now / 1000
	if (layoutAt === null || quietEasing(t)) return
	if (pendingLayout) {
		applyLayout(pendingLayout, now)
		needsDraw = true
	} else if (lastDrawAt / 1000 - layoutAt < QUIET.ease) needsDraw = true
}

/** Steps the camera while the tab is visible, the drift at the rate gather found; when it comes to rest, one more frame draws the resting sky. */
function updateCamera(now: number): void {
	if (!visible) return
	cameraInput.time = now / 1000
	cameraInput.scroll = parallaxScroll
	cameraInput.viewportHeight = height
	cameraInput.follow = motion === 'full'
	cameraInput.drift = driftRate(driftGate)
	const moving = stepCamera(camera, cameraInput)
	if (cameraMoving && !moving) needsDraw = true
	cameraMoving = moving
}

/**
 * Everything drawSky and drawMeteor need to draw the sky at time `now` (ms) onto `target`. It gathers the gates first:
 * the twinkle reads the ambient level, and frames are also drawn outside a frame decision (a resize, a quality step),
 * where a sky that slept would otherwise show a stale twinkle.
 */
function frameAt(now: number, target: OffscreenCanvas): SkyFrame {
	const t = now / 1000
	const scene = sceneAt(scrollY, height, documentHeight)
	gather(now, scene)
	const dusk = exitAt === null ? -1 : t - exitAt
	const contrast = contrastLevels()
	const density = densityKeep(width, height)
	const thinLevel = fadeOutAt(thinnedAt, ADAPT.thinFade, t)
	return {
		time: t,
		twinkleTime: t - hiddenTotal,
		width,
		height,
		dpr,
		deviceWidth: target.width,
		deviceHeight: target.height,
		offset: cameraOffset(camera, offset),
		// The stars a quality step thins out stay in the draw until they have faded away
		keep: quality > 0 && thinLevel <= 0 ? density * ADAPT.thinning : density,
		thinFrom: quality > 0 ? density * ADAPT.thinning : Infinity,
		thinLevel,
		layers: { far: scene.stars.far * contrast.stars, mid: scene.stars.mid * contrast.stars, near: scene.stars.near * contrast.stars },
		dusk: emergenceDone(dusk) ? Infinity : dusk,
		twinkle: twinkleLevel(scene),
		haze: scene.haze * contrast.haze * hazeEmergence(dusk),
		quiet: quietBlend(t),
		meteorInk: contrast.meteorInk,
		snap: !skyMoved,
	}
}

/** Draws the whole sky for time `now` (ms); the first frame tells the page the canvas is ready. */
function draw(now: number): void {
	if (!ctx || !canvas || !assets) return
	const started = performance.now()
	const frame = frameAt(now, canvas)
	drawSky(ctx, assets, field, frame)
	if (meteor) drawMeteor(ctx, assets, meteor, frame, scrollKept(launchScrollY, scrollY))
	lastDrawAt = now
	needsDraw = false
	if (!ready) {
		ready = true
		scope.postMessage({ type: 'ready' })
	}
	adapt(performance.now() - started, now)
}

/** Counts slow frames (JS over ADAPT.slowFrameMs) net of fast ones and steps quality down once they pile up. */
function adapt(milliseconds: number, now: number): void {
	slowFrames = milliseconds > ADAPT.slowFrameMs ? slowFrames + 1 : Math.max(0, slowFrames - 1)
	if (slowFrames >= ADAPT.slowFrames) stepDown(now)
}

/**
 * One quality step down, never back up: step 1 draws fewer stars (the thinned ones fade out), twinkles slower and caps
 * the drift's frames, step 2 also draws at CSS resolution. The layout is unchanged, so the shooting star, the radiant
 * and the haze stay.
 */
function stepDown(now: number): void {
	if (quality >= 2) return
	quality++
	slowFrames = 0
	if (quality === 1) thinnedAt = now / 1000
	if (quality < 2 || dpr <= 1) return
	sizeCanvas(1)
	// Resizing cleared the canvas: redraw in this task so no blank frame reaches the screen
	draw(now)
}

/**
 * Software canvases (Chromium without a GPU, for one) rasterize after the draw calls return, where adapt() can't see
 * the cost. Rasterize one full sky off screen and time it: a slow one starts the sky at the lowest quality, and its
 * cost decides how many frames a second the drift can afford (PACING.softwareShare of a core).
 */
function probeRaster(now: number): void {
	if (!canvas || !assets) return
	const probe = new OffscreenCanvas(canvas.width, canvas.height)
	const probeCtx = probe.getContext('2d', { alpha: false })
	if (!probeCtx) return
	drawSky(probeCtx, assets, field, { ...frameAt(now, probe), dusk: Infinity, haze: 1 })
	const started = performance.now()
	// A GPU canvas only queues the work here; a software one rasterizes the whole frame
	probe.transferToImageBitmap().close()
	const rasterMs = performance.now() - started
	const limit = Math.max(ADAPT.rasterMinMs, (ADAPT.rasterMsPerMp * probe.width * probe.height) / 1e6)
	if (rasterMs <= limit) return
	const probedDpr = dpr
	while (quality < 2) stepDown(now)
	// The probe drew at the device ratio, and the sky now draws at CSS resolution: each frame costs that share of it
	softwareFps = Math.floor((PACING.softwareShare * 1000) / (rasterMs * (dpr / probedDpr) ** 2))
}

/** Builds the sprite atlas and the haze for the current size and ratio, closing the old bitmaps. */
function rebuildAssets(): void {
	if (!tokens) return
	assets?.atlas.image.close()
	assets?.haze?.close()
	assets = { atlas: buildStarAtlas(dpr, tokens), haze: buildHaze(width, height, tokens), palette: starPalette(tokens), tokens }
}

/**
 * Rebuilds the haze for the settled size and redraws. It stalls the worker for more than a frame, so it waits for the
 * quiet zones to stop easing: a gap in the middle of that ease would show as a step in the stars near the copy.
 */
function rebuildHaze(): void {
	if (quietEasing(performance.now() / 1000)) {
		hazeTimer = setTimeout(rebuildHaze, HAZE_REBUILD_MS)
		return
	}
	hazeTimer = undefined
	if (assets && tokens) {
		assets.haze?.close()
		assets.haze = buildHaze(width, height, tokens)
	}
	needsDraw = true
	schedule(performance.now())
}

/** A new layout may have room for shooting stars again. */
function retryMeteors(now: number): void {
	if (failedPlans < METEOR.maxFailedPlans || revealAt === null) return
	failedPlans = 0
	nextMeteorAt = now / 1000 + between(random, METEOR.retry[0], METEOR.retry[1])
}

/** Sizes the backing store for the CSS size at `ratio`, rebuilding the atlas if the ratio changed. Clears the canvas. */
function sizeCanvas(ratio: number): void {
	const ratioChanged = ratio !== dpr
	dpr = ratio
	if (!canvas || !tokens) return
	canvas.width = deviceSize(width, dpr)
	canvas.height = deviceSize(height, dpr)
	if (!assets) rebuildAssets()
	else if (ratioChanged) {
		assets.atlas.image.close()
		assets.atlas = buildStarAtlas(dpr, tokens)
	}
}

/** Applies a new canvas size or pixel ratio and redraws at once. */
function resize(nextWidth: number, nextHeight: number, nextDpr: number, now: number): void {
	const sizeChanged = nextWidth !== width || nextHeight !== height
	const hadAssets = assets !== null
	width = nextWidth
	height = nextHeight
	narrowScreen = nextWidth <= NARROW_MAX_WIDTH
	// The old path was planned for the old layout
	radiant = null
	meteor = null
	retryMeteors(now)
	// After the second quality step, CSS resolution at most (a zoomed-out page is already below it)
	sizeCanvas(quality >= 2 ? Math.min(1, nextDpr) : nextDpr)
	// The haze follows the CSS size only, and it is smooth: keep stretching the old one until the size settles
	if (hadAssets && sizeChanged) {
		clearTimeout(hazeTimer)
		hazeTimer = setTimeout(rebuildHaze, HAZE_REBUILD_MS)
	}
	// Resizing cleared the canvas: redraw in this task so no blank frame reaches the screen
	draw(now)
}

/** The loader has started to lift: the stars come out, brightest first. */
function emerge(now: number): void {
	if (exitAt === null) exitAt = now / 1000
	needsDraw = true
}

/** The page is showing: start the shooting-star clock (the first one waits for the hero entrance to settle). */
function reveal(now: number): void {
	emerge(now)
	if (revealAt !== null) return
	revealAt = now / 1000
	nextMeteorAt = revealAt + between(random, METEOR.firstDelay[0], METEOR.firstDelay[1])
}

scope.addEventListener('message', (event) => {
	const message = event.data
	const now = performance.now()
	switch (message.type) {
		case 'init': {
			canvas = message.canvas
			ctx = canvas.getContext('2d', { alpha: false })
			if (!ctx) {
				scope.postMessage({ type: 'error', message: 'No 2D context for the sky canvas' })
				return
			}
			// A lost GPU context drops the canvas contents and bitmaps: rebuild and redraw once it is back
			canvas.addEventListener('contextrestored', () => {
				rebuildAssets()
				needsDraw = true
				// A GPU restart may be what stalled the display's clock
				recheckFrames()
				schedule(performance.now())
			})
			tokens = message.tokens
			motion = message.motion
			visible = message.visible
			// A page opened in a background tab keeps its dusk until it is shown
			if (!visible) hiddenAt = now
			contrastMore = message.contrastMore
			scrollY = parallaxScroll = message.scrollY
			camera = createCamera(message.scrollY)
			skyMoved = message.motion === 'full'
			// A load rests on its motion's level, so nothing eases at start
			const level = message.motion === 'full' ? 1 : 0
			motionLevel = { from: level, to: level, since: -Infinity }
			presence = createPresence(now)
			if (message.emerging) emerge(now)
			if (message.revealed) reveal(now)
			resize(message.width, message.height, message.dpr, now)
			probeRaster(now)
			break
		}
		case 'resize':
			resize(message.width, message.height, message.dpr, now)
			break
		case 'emerge':
			emerge(now)
			break
		case 'reveal':
			reveal(now)
			break
		case 'motion': {
			// Only a real change starts an ease, so a repeated message can't restart one
			if (message.motion === motion) break
			// Eases from the level on screen, so a change mid-ease never jumps. A hidden tab shows the level it had when it was
			// hidden, not one an earlier ease has run out to unseen: a pause and a play that cancel out while it is hidden then
			// leave nothing to ease when it is shown
			const t = now / 1000
			const shown = hiddenAt === null ? t : hiddenAt / 1000
			motionLevel = { from: easeAt(motionLevel, FRAME.motionEase, shown), to: message.motion === 'full' ? 1 : 0, since: t }
			if (message.motion === 'full') {
				skyMoved = true
				// A switch to full motion in a shown tab means the visitor is here, whether they pressed Play on this page or in
				// another tab or turned a setting off, even after a long idle stretch. A hidden tab notes it when it is shown.
				if (visible) noteInput(now)
				// Back to full motion: no shooting star straight away
				holdMeteors(now)
				// The sky keeps its place and follows the scroll from here, instead of leaping to wherever the page has scrolled to
				parallaxScroll = scrollY
				resumeCamera(camera, scrollY)
			}
			motion = message.motion
			if (motion !== 'full') meteor = null
			needsDraw = true
			break
		}
		case 'visible':
			visible = message.visible
			if (!visible) {
				cancelFrames()
				forgetStep(camera)
				meteor = null
				hiddenAt = now
				return
			}
			if (hiddenAt !== null) {
				// The stretch just ended is measured once, for the twinkle's clock, the dusk's, the motion ease's and the idle clock's
				hiddenTotal += (now - hiddenAt) / 1000
				// The dusk clock stops while the tab is hidden: it resumes where it was, or starts if it began while hidden
				if (exitAt !== null) exitAt = now / 1000 - Math.max(0, hiddenAt / 1000 - exitAt)
				// So does the motion ease: one that began while hidden starts now, instead of running out unseen and jumping every
				// star's twinkle in the first frame back. An ease that never ran (since -Infinity) stays that way.
				motionLevel.since = now / 1000 - Math.max(0, hiddenAt / 1000 - motionLevel.since)
				// And the idle clock: time spent hidden is not time without input, so a tab hidden for longer than the idle sleep
				// shows the twinkle it had, instead of one that has idled out and drops to rest in the first frame back. A visitor
				// who was already asleep still eases in from 0, and one who has never been away (wokeAt -Infinity) stays that way.
				presence.lastInputAt = now - Math.max(0, hiddenAt - presence.lastInputAt)
				presence.wokeAt = now - Math.max(0, hiddenAt - presence.wokeAt)
				hiddenAt = null
			}
			// Misses from before the tab was hidden say nothing about the display now
			recheckFrames()
			noteInput(now)
			holdMeteors(now)
			needsDraw = true
			break
		case 'contrast':
			contrastMore = message.more
			needsDraw = true
			break
		case 'scroll':
			scrollY = message.y
			if (motion === 'full') parallaxScroll = message.y
			lastScrollAt = now
			noteInput(now)
			// A running loop paces scroll redraws itself; a sleeping worker draws one now
			if (!rafId && timerId === undefined) needsDraw = true
			break
		case 'layout': {
			documentHeight = message.documentHeight
			// Copy that appears or moves (the reveal, an entrance settling, a reflow) eases in over QUIET.ease, so the stars
			// near it fade instead of changing in one frame. A change mid-ease waits for the ease to end.
			const latest = pendingLayout ?? { quiet, pinned }
			if (!sameRects(message.quiet, latest.quiet) || !sameRects(message.pinned, latest.pinned)) {
				if (quietEasing(now / 1000)) pendingLayout = message
				else applyLayout(message, now)
			}
			retryMeteors(now)
			needsDraw = true
			break
		}
		case 'activity':
			// The schedule below judges this moment's presence, so a sky that slept restarts its frames at once
			noteInput(now)
			break
	}
	schedule(now)
})
