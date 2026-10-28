import { FRAME, PACING } from './config'

/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Drawn frames per second: 0 for none, Infinity for every display refresh. */
	fps: number
	/** Something moves: frames must be animation frames, so each one lands on a display refresh. */
	vsync: boolean
	/** At most this many frames per second while this is the strictest demand; Infinity for none. */
	cap: number
}

/** Nothing to draw. */
export const NO_FRAMES: FrameDemand = { fps: 0, vsync: false, cap: Infinity }

/** Every display refresh: a flying shooting star, scrolling under full motion. */
export const EVERY_FRAME: FrameDemand = { fps: Infinity, vsync: true, cap: Infinity }

/** Slow changes that don't move (the dusk, a lingering train, the quiet ease, scrolling under reduced motion). */
export const FADE_FRAMES: FrameDemand = { fps: FRAME.fadeFps, vsync: false, cap: Infinity }

/**
 * The strictest of several demands: the most frames, on animation frames if any of them moves, within the tightest cap
 * unless one asks for every refresh (a flying shooting star, scrolling). A demand with no cap never lifts another's.
 */
export function combineDemands(...demands: FrameDemand[]): FrameDemand {
	let fps = 0
	let vsync = false
	let cap = Infinity
	for (const demand of demands) {
		if (demand.fps <= 0) continue
		fps = Math.max(fps, demand.fps)
		cap = Math.min(cap, demand.cap)
		if (demand.vsync) vsync = true
	}
	if (fps === 0) return NO_FRAMES
	return { fps, vsync, cap: fps === Infinity ? Infinity : cap }
}

/**
 * Frames per second for something moving `devicePxPerSecond`: at most PACING.stepDevicePx per frame, and never under
 * PACING.minFps, even at speed 0, since a motion that has just started still needs frames.
 */
export function motionFps(devicePxPerSecond: number): number {
	return Math.max(PACING.minFps, devicePxPerSecond / PACING.stepDevicePx)
}

/** What the frame clock needs to know now: the worker fills it from its own state at each frame decision (reused, no garbage). */
export interface FrameState {
	/** A context, the tab visible, motion not 'off' and the dusk begun; otherwise nothing draws. */
	live: boolean
	/** Scrolled within FRAME.scrollSettleMs. */
	scrolling: boolean
	/** Full motion: scrolling then moves the stars (every refresh); otherwise it only fades them. */
	full: boolean
	/** Every frame while a shooting star flies, fade frames while its train lingers. */
	transientDemand: FrameDemand
	/** The camera moves: the stars follow the page or glide to rest after it stops. */
	cameraActive: boolean
	/** Device px/s of the nearest star at the camera's speed. */
	cameraSpeed: number
	/** Most frames per second the camera's motion may draw; Infinity for none. */
	cameraCap: number
	/** A slow change runs: the dusk or the quiet ease. */
	fading: boolean
	/** Twinkle's timer rate while it may change (full motion, the visitor not idle and a twinkling scene), else 0. */
	twinkleFps: number
}

/** The strictest demand of every part of the sky this tick. */
export function frameDemand(state: FrameState): FrameDemand {
	if (!state.live) return NO_FRAMES
	return combineDemands(
		state.transientDemand,
		state.scrolling ? (state.full ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		state.cameraActive ? { fps: motionFps(state.cameraSpeed), vsync: true, cap: state.cameraCap } : NO_FRAMES,
		state.fading ? FADE_FRAMES : NO_FRAMES,
		state.twinkleFps > 0 ? { fps: state.twinkleFps, vsync: false, cap: Infinity } : NO_FRAMES
	)
}

/** Draw on every k-th refresh: the largest k that still gives `fps`, and at least the k that keeps under `cap`. */
export function refreshDivisor(refreshHz: number, fps: number, cap: number): number {
	return Math.max(Math.floor(refreshHz / fps), Math.ceil(refreshHz / cap), 1)
}

/** The divisor in use, and since when (worker-clock ms) a larger one has been enough. */
export interface Divisor {
	k: number
	slowerSince: number | null
}

/** Moves the divisor toward `wanted`: down at once (more frames), up only after PACING.slowDownAfter s of lower need. */
export function stepDivisor(divisor: Divisor, wanted: number, now: number): number {
	if (wanted <= divisor.k) {
		divisor.k = wanted
		divisor.slowerSince = null
	} else if (divisor.slowerSince === null) {
		divisor.slowerSince = now
	} else if (now - divisor.slowerSince >= PACING.slowDownAfter * 1000) {
		divisor.k = wanted
		divisor.slowerSince = null
	}
	return divisor.k
}

/**
 * Whether a wake-up at `now` (ms) draws for `demand`: every animation frame at k = 1 (even just after a timer drew, so
 * motion starts on the next refresh), otherwise one once k - 1/2 refreshes have passed since the last drawn frame; a timer
 * once its interval has (4 ms early is fine: timers fire a little early or late).
 */
export function frameDue(demand: FrameDemand, now: number, lastDrawAt: number, k: number, interval: number): boolean {
	if (demand.fps <= 0) return false
	if (demand.vsync) return k <= 1 || now - lastDrawAt >= (k - 0.5) * interval
	return now - lastDrawAt >= 1000 / demand.fps - 4
}

/** The display's refresh interval, measured from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes: 1000 / 60 until measured. */
	readonly interval: number
	/** The frames come from a fixed timer, not the display (WebKit's 15 ms worker clock). */
	readonly unaligned: boolean
	/** Adds an animation-frame timestamp (ms). */
	sample(timestamp: number): void
	/** Forgets the last timestamp after a pause (hidden, asleep), so the gap isn't taken for a refresh. */
	pause(): void
}

/** The median of a short list (never empty where it is called). */
function median(values: readonly number[]): number {
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[sorted.length >> 1] ?? 0
}

/** Appends `value` to `list`, keeping the last PACING.refreshSamples. */
function remember(list: number[], value: number): void {
	list.push(value)
	if (list.length > PACING.refreshSamples) list.shift()
}

/**
 * A refresh estimate: the median of the last PACING.refreshSamples intervals. Intervals over 1.5 times the estimate are
 * dropped frames and ignored, unless PACING.refreshSamples of them come in a row: then the display really is slower
 * (Energy Saver's 30 Hz, say) and their median becomes the estimate.
 */
export function createRefreshEstimate(): RefreshEstimate {
	const accepted: number[] = []
	const rejected: number[] = []
	let last: number | null = null
	let interval = 1000 / 60
	return {
		get interval() {
			return interval
		},
		get unaligned() {
			return Math.abs(interval - PACING.unalignedIntervalMs) <= PACING.unalignedToleranceMs
		},
		sample(timestamp) {
			const delta = last === null ? 0 : timestamp - last
			last = timestamp
			if (delta <= 0) return
			if (delta < interval * 1.5) {
				rejected.length = 0
				remember(accepted, delta)
				interval = median(accepted)
				return
			}
			// A run of long intervals is a slower display, not dropped frames
			remember(rejected, delta)
			if (rejected.length < PACING.refreshSamples) return
			accepted.length = 0
			accepted.push(...rejected)
			rejected.length = 0
			interval = median(accepted)
		},
		pause() {
			last = null
		},
	}
}
