import { NEBULA } from '@/lib/sky/config'
import { createNebula, type NebulaField } from '@/lib/sky/nebula'
import { hazeAverage, hazeTimes, type HazeTimes } from '@/lib/sky/pacing'
import type { SkyTokens } from '@/lib/sky/protocol'
import { toBitmap } from './bitmap'

/** A float state of the field and the clock it shows; NaN while empty or being built. */
interface FieldState {
	clock: number
	light: Float32Array
}

/**
 * The nebula as the worker runs it: the field's float states, evaluated a slice of a tick at a time, and the compositions
 * that mix two of them into the bitmap drawSky blits a screen's worth of, from the row the scroll has carried the gas up
 * to. It holds the time-sliced state; skyAssets.ts keeps building immutable bitmaps, and pacing.ts keeps the rule for when
 * each of them happens (hazeTimes).
 */
export interface HazeRuntime {
	field: NebulaField
	/** One pixel a node: a composition's bytes go in here, then are scaled up into `scratch`. */
	low: OffscreenCanvas
	lowContext: OffscreenCanvasRenderingContext2D
	image: ImageData
	/** The composition, at the bitmap's size: its bitmap is handed on whole (transferToImageBitmap) and it starts over. */
	scratch: OffscreenCanvas
	scratchContext: OffscreenCanvasRenderingContext2D
	/** The fixed grain, added over every composition. */
	grain: ImageBitmap
	/** Three: the two a composition mixes and the one after them. */
	states: readonly FieldState[]
	/** The state under evaluation, the clock it is for, its next piece, and the JS spent on it so far (ms). */
	building: FieldState | null
	buildingClock: number
	nextPiece: number
	builtMs: number
	/** The clock last composed and the clock at the last call; NaN at first. */
	composedAt: number
	clockSeen: number
	/** Moving averages (hazeAverage) of what an evaluation and a composition cost, ms. */
	fieldMs: number
	composeMs: number
	/** hazeTimes' answer (reused). */
	times: HazeTimes
}

/**
 * The nebula for a size: its tables, its grain and three empty states, ready for a first composition. Null where a 2D
 * context isn't to be had, so the sky goes on without it.
 */
export function createHaze(width: number, height: number, tokens: SkyTokens): HazeRuntime | null {
	const field = createNebula(width, height, tokens)
	const low = new OffscreenCanvas(field.columns, field.rows)
	const lowContext = low.getContext('2d', { alpha: false })
	const scratch = new OffscreenCanvas(field.width, field.height)
	const scratchContext = scratch.getContext('2d', { alpha: false })
	if (!lowContext || !scratchContext) return null
	const image = new ImageData(field.columns, field.rows)
	const pixels = new ImageData(field.width, field.height)
	field.grain(pixels.data)
	const nodes = field.columns * field.rows * 3
	return {
		field,
		low,
		lowContext,
		image,
		scratch,
		scratchContext,
		grain: toBitmap(pixels),
		states: Array.from({ length: 3 }, () => ({ clock: NaN, light: new Float32Array(nodes) })),
		building: null,
		buildingClock: NaN,
		nextPiece: 0,
		builtMs: 0,
		composedAt: NaN,
		clockSeen: NaN,
		fieldMs: 0,
		composeMs: 0,
		times: { step: 0, every: 0, shown: 0, from: 0, to: 0, next: 0 },
	}
}

/** The state that shows `clock`, if any. */
function stateAt(haze: HazeRuntime, clock: number): FieldState | undefined {
	const { states } = haze
	for (let i = 0; i < states.length; i++) {
		const state = states[i]
		if (state && state.clock === clock) return state
	}
	return undefined
}

/** A state a new evaluation may overwrite: one showing neither clock a composition mixes. A composition holds two of the three. */
function spareState(haze: HazeRuntime): FieldState {
	const { states, times } = haze
	for (let i = 0; i < states.length; i++) {
		const state = states[i]
		if (state && state.clock !== times.from && state.clock !== times.to) return state
	}
	throw new Error('The nebula has no state to evaluate into')
}

/** Starts evaluating the field at `clock` into a spare state, dropping any evaluation under way. */
function startBuild(haze: HazeRuntime, clock: number): FieldState {
	const state = spareState(haze)
	state.clock = NaN
	haze.field.begin(clock, state.light)
	haze.building = state
	haze.buildingClock = clock
	haze.nextPiece = 0
	haze.builtMs = 0
	return state
}

/** Ends the evaluation under way: its state now shows its clock, and what it cost feeds the average. One ending for the slices and for a composition that needs the state now. */
function endBuild(haze: HazeRuntime, state: FieldState): void {
	state.clock = haze.buildingClock
	haze.building = null
	haze.fieldMs = hazeAverage(haze.fieldMs, haze.builtMs, NEBULA.motion.fieldRise)
}

/** Runs the next piece of the evaluation under way, and ends the evaluation after the last. */
function runPiece(haze: HazeRuntime, state: FieldState): void {
	const before = performance.now()
	haze.field.piece(haze.nextPiece)
	haze.nextPiece++
	haze.builtMs += performance.now() - before
	if (haze.nextPiece >= haze.field.pieces) endBuild(haze, state)
}

/**
 * The state that shows `clock`. If none does yet, finishes its evaluation now: the one under way when it is for this
 * clock, otherwise a new one.
 */
function settle(haze: HazeRuntime, clock: number): FieldState {
	const held = stateAt(haze, clock)
	if (held) return held
	const before = performance.now()
	const state = haze.building && haze.buildingClock === clock ? haze.building : startBuild(haze, clock)
	while (haze.nextPiece < haze.field.pieces) {
		haze.field.piece(haze.nextPiece)
		haze.nextPiece++
	}
	haze.builtMs += performance.now() - before
	endBuild(haze, state)
	return state
}

/**
 * One composition at the clock `times` gives: the two field states mixed, their bytes scaled up, the fixed grain added.
 * Every composition feeds `composeMs`, a rebuild's first one too, and the sample covers the transfer, because on a software
 * canvas that is where the raster lands and the cadence has to see it.
 */
function compose(haze: HazeRuntime): ImageBitmap {
	const { field, image, low, lowContext, scratch, scratchContext, grain, times } = haze
	// A state is missing only after a jump, a change of cadence or a return from level 0, or while one is still being evaluated
	const from = settle(haze, times.from)
	const to = settle(haze, times.to)
	const started = performance.now()
	field.bytes(from.light, to.light, Math.max(0, (times.shown - times.from) / times.every), image.data)
	lowContext.putImageData(image, 0, 0)
	// Smoothed, and opaque over more than the canvas, so it covers everything; the grain then lands pixel for pixel
	scratchContext.globalCompositeOperation = 'source-over'
	scratchContext.imageSmoothingEnabled = true
	scratchContext.drawImage(low, 0, 0, field.columns * field.spacing * field.scale, field.rows * field.spacing * field.scale)
	scratchContext.globalCompositeOperation = 'lighter'
	scratchContext.imageSmoothingEnabled = false
	scratchContext.drawImage(grain, 0, 0)
	const bitmap = scratch.transferToImageBitmap()
	haze.composedAt = times.shown
	haze.composeMs = hazeAverage(haze.composeMs, performance.now() - started, NEBULA.motion.composeRise)
	return bitmap
}

/**
 * One tick of the nebula at drift-clock `clock` (`slowed`: after the first quality step). The field's evaluation starts no
 * new piece once NEBULA.motion.sliceMs of JS has passed, so a tick can run one piece past it; then, if the clock has
 * reached a later step than the last composition, a composition gives the new bitmap; otherwise null, and the picture
 * stands.
 *
 * Only a clock that moved starts an evaluation or composes, because `shown` hangs on `step`, and `step` can change while
 * the clock stands still: a quality step during a scroll under pause, or a composition's own sample. An evaluation under
 * way still finishes on later ticks. Returning from level 0 with a moved clock composes, because nothing called this
 * meanwhile and `clockSeen` is behind; with an unmoved clock the bitmap is already right. `<=` holds the picture when a
 * longer step puts `shown` behind `composedAt`, so the picture never goes back in time.
 */
export function advanceHaze(haze: HazeRuntime, clock: number, slowed: boolean): ImageBitmap | null {
	const started = performance.now()
	const times = hazeTimes(clock, haze.composeMs, haze.fieldMs, slowed, haze.times)
	const moved = clock !== haze.clockSeen
	if (moved) {
		haze.clockSeen = clock
		if (!haze.building) {
			// The state a composition would need first: the one before the clock, the one after it, then the one after that
			if (!stateAt(haze, times.from)) startBuild(haze, times.from)
			else if (!stateAt(haze, times.to)) startBuild(haze, times.to)
			else if (!stateAt(haze, times.next)) startBuild(haze, times.next)
		}
	}
	while (haze.building && performance.now() - started < NEBULA.motion.sliceMs) runPiece(haze, haze.building)
	if (!moved || times.shown <= haze.composedAt) return null
	return compose(haze)
}

/**
 * Composes at `clock` whatever the last composition was, for a rebuild. It takes `slowed` as the next tick will, so the
 * first picture is at the cadence that tick uses, and it sets `clockSeen`, so a rebuild under pause doesn't compose again
 * on the next tick.
 */
export function composeHaze(haze: HazeRuntime, clock: number, slowed = false): ImageBitmap {
	hazeTimes(clock, haze.composeMs, haze.fieldMs, slowed, haze.times)
	haze.clockSeen = clock
	return compose(haze)
}

/** Lets go of the grain and sets both canvases to 0 x 0, so a rebuild frees their memory at once. The caller closes the bitmap it holds. */
export function closeHaze(haze: HazeRuntime): void {
	haze.grain.close()
	haze.low.width = 0
	haze.low.height = 0
	haze.scratch.width = 0
	haze.scratch.height = 0
}
