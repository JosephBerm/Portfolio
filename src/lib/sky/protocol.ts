/** Types shared by the home sky's main-thread controller and its worker. Types only: nothing here runs. */

/** An sRGB color as 0-255 channels. */
export type Rgb = readonly [number, number, number]

/** Theme colors the sky draws with. Read from the globals.css tokens at mount, so nothing is mirrored in TypeScript. */
export interface SkyTokens {
	navy: Rgb
	white: Rgb
	green: Rgb
	card2: Rgb
	card3: Rgb
}

/**
 * A rectangle in CSS px. Quiet rects travel in document coordinates (the worker subtracts the scroll offset), except
 * pinned ones (copy in fixed elements such as the side rails), which are in screen coordinates.
 */
export interface SkyRect {
	x: number
	y: number
	width: number
	height: number
}

/**
 * How much the sky may change on its own:
 * - `full`: twinkle, scroll parallax and shooting stars
 * - `reduced`: prefers-reduced-motion, so fades and brightness only
 * - `off`: forced colors hide the sky, so nothing is drawn
 */
export type SkyMotion = 'full' | 'reduced' | 'off'

/** Main thread to sky worker. Sizes are CSS px; `dpr` is already capped. */
export type SkyMainMessage =
	| {
			type: 'init'
			canvas: OffscreenCanvas
			width: number
			height: number
			dpr: number
			tokens: SkyTokens
			/** The loader has started to lift (or there is none): the stars come out. */
			emerging: boolean
			/** The page content is showing: shooting stars may start. */
			revealed: boolean
			motion: SkyMotion
			/** False when the page loads in a background tab. */
			visible: boolean
			contrastMore: boolean
			scrollY: number
	  }
	| { type: 'resize'; width: number; height: number; dpr: number }
	| { type: 'emerge' }
	| { type: 'reveal' }
	| { type: 'motion'; motion: SkyMotion }
	| { type: 'visible'; visible: boolean }
	| { type: 'contrast'; more: boolean }
	| { type: 'scroll'; y: number }
	| {
			type: 'layout'
			documentHeight: number
			/** Quiet rects in document coordinates. */
			quiet: readonly SkyRect[]
			/** Quiet rects of copy in fixed elements, in screen coordinates. */
			pinned: readonly SkyRect[]
	  }

/** Sky worker to main thread: the first frame is on the canvas, or the sky can't run. */
export type SkyWorkerMessage = { type: 'ready' } | { type: 'error'; message: string }
