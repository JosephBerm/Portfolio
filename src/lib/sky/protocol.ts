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
	/**
	 * What the copy in this rect can take behind it: the most white (0-1 of --color-white, added over navy) before its
	 * own color and size fall under their WCAG 2 AA contrast (4.5:1, or 3:1 for large text). Measured per element on
	 * the main thread (`lightHeadroom`), so the worker mirrors no theme color and no text size.
	 */
	headroom: number
}

/**
 * How much the sky may change on its own:
 * - `full`: twinkle, drift, scroll parallax and its glide, pointer lean and transients
 * - `reduced`: prefers-reduced-motion, or the visitor paused the sky (skyPause.ts): fades and brightness only
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
			/** The page content is showing: shooting stars and satellites may start. */
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
	/** The visitor is still here without scrolling (pointer, keys, focus); at most one a second. */
	| { type: 'activity' }
	/** A fine pointer's position for the lean, -1 to 1 from the viewport center (x right, y down); null once it leaves. At most one per animation frame. */
	| { type: 'pointer'; at: { x: number; y: number } | null }
	/** One animation frame of the page, sent on every frame while the worker has asked for a relay and not otherwise. */
	| { type: 'tick' }

/** Sky worker to main thread: the first frame is on the canvas, the sky can't run, or the page's animation frames are wanted or not. */
export type SkyWorkerMessage =
	| { type: 'ready' }
	| { type: 'error'; message: string }
	/** Whether the main thread should send a `tick` on every animation frame of the page. Sent only when that changes. */
	| { type: 'relay'; on: boolean }
