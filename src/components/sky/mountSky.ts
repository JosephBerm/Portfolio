import { scroll } from 'motion/react'
import type { IntroPhase } from '@/hooks/useIntroPhase'
import { REDUCED_MOTION_QUERY } from '@/lib/utils'
import { parseHexColor } from '@/lib/sky/color'
import type { SkyMainMessage, SkyMotion, SkyRect, SkyTokens, SkyWorkerMessage } from '@/lib/sky/protocol'

/** Handle returned by mountSky. */
export interface SkyController {
	/** Follows IntroGate: the stars come out as the loader lifts, and shooting stars start once the page shows. */
	setPhase(phase: IntroPhase): void
	destroy(): void
}

/** Controller for browsers that can't run the sky: the plain navy page stays. */
const NOOP: SkyController = { setPhase: () => {}, destroy: () => {} }

/** Pixel-ratio cap for the canvas: crisp on retina, bounded on 3x phones. */
const DPR_CAP = 2

/** Pixel-ratio cap on devices reporting LOW_MEMORY_GB of memory or less (Chromium only). */
const DPR_CAP_LOW_MEMORY = 1.5

/** Reported memory (GB, navigator.deviceMemory) at or below which the lower pixel-ratio cap applies. */
const LOW_MEMORY_GB = 4

/** Largest canvas backing store (device px, about 33 MB): very large high-DPR screens draw slightly softer instead. */
const MAX_BACKING_PIXELS = 3840 * 2160

/**
 * Copy the sky stays quiet behind: no bright stars beside it, and a shooting star only fades out behind it. The hero,
 * Contact, the footer and the side rails opt in with data-sky-quiet. Copy in fixed elements (the rails) stays put on
 * screen, so its rects travel in screen coordinates.
 */
const QUIET_SELECTOR = '[data-sky-quiet]'

/** Inside quiet copy, links and buttons count by their whole box (a bordered button reaches well past its text). */
const QUIET_CONTROLS = 'a, button'

/** Most quiet rects sent to the worker: one per line of copy, about 31 on desktop and 35-37 on phones. */
const MAX_QUIET_RECTS = 64

/**
 * Entrances move copy without resizing anything: the hero slides its copy up to 40px and settles by about 1.2s after
 * the reveal, and Contact fades up as it scrolls into view. Measure again this long after the reveal and after
 * scrolling stops (ms).
 */
const ENTRANCE_SETTLE_MS = 1500

/** High-contrast modes replace the palette: CSS hides the sky and the worker stops drawing. */
const FORCED_COLORS_QUERY = '(forced-colors: active)'

/**
 * A request for more contrast: the worker drops the haze, dims the stars and leaves no shooting-star light on the
 * copy itself (CONTRAST_MORE.meteorInk is 0).
 */
const MORE_CONTRAST_QUERY = '(prefers-contrast: more)'

/** Workers, OffscreenCanvas and canvas transfer: Chrome 69, Firefox 105, Safari 16.4, all within the Next.js browser floor. */
function supported(): boolean {
	return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype
}

/** Theme colors from the globals.css tokens, so the canvas and CSS can never disagree. Null if any is missing or not hex. */
function readTokens(): SkyTokens | null {
	const styles = getComputedStyle(document.documentElement)
	const read = (name: string) => parseHexColor(styles.getPropertyValue(name))
	// Full literal names: Tailwind only emits theme variables it finds in the source
	const navy = read('--color-navy')
	const white = read('--color-white')
	const green = read('--color-green')
	const card2 = read('--color-card-2')
	const card3 = read('--color-card-3')
	return navy && white && green && card2 && card3 ? { navy, white, green, card2, card3 } : null
}

/** The sky worker, or null where it can't start; a failed sky leaves the plain navy page. */
function startWorker(): Worker | null {
	try {
		// A literal new URL(..., import.meta.url) lets the bundler emit the worker as its own same-origin chunk
		return new Worker(new URL('./sky.worker.ts', import.meta.url), { name: 'sky' })
	} catch {
		return null
	}
}

/** Pixel ratio to draw at: device pixels, capped for memory, but never below CSS resolution unless the device is. */
function canvasDpr(width: number, height: number): number {
	// deviceMemory is Chromium-only; Safari clamps its core count, so neither is a reliable signal there
	const { deviceMemory } = navigator as Navigator & { deviceMemory?: number }
	const cap = deviceMemory !== undefined && deviceMemory <= LOW_MEMORY_GB ? DPR_CAP_LOW_MEMORY : DPR_CAP
	const byArea = Math.sqrt(MAX_BACKING_PIXELS / Math.max(1, width * height))
	return Math.min(window.devicePixelRatio || 1, Math.max(1, Math.min(cap, byArea)))
}

/** A box moved down by `offsetY` (the scroll offset, for document coordinates), or null when it has no area. */
function quietRect(left: number, top: number, right: number, bottom: number, offsetY: number): SkyRect | null {
	return right > left && bottom > top ? { x: left, y: top + offsetY, width: right - left, height: bottom - top } : null
}

/**
 * The quiet rects inside `root`, moved down by `offsetY`: the ink of each line of text (not the layout boxes, which
 * span the whole column even where the words stop, nor one box per run, which spans the empty sky beside a short
 * line) and the full box of each link or button.
 */
function quietRects(root: Element, offsetY: number): SkyRect[] {
	const rects: SkyRect[] = []
	const range = document.createRange()
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		if (!node.textContent?.trim()) continue
		range.selectNodeContents(node)
		for (const line of range.getClientRects()) {
			const rect = quietRect(line.left, line.top, line.right, line.bottom, offsetY)
			if (rect) rects.push(rect)
		}
	}
	for (const control of root.querySelectorAll(QUIET_CONTROLS)) {
		const box = control.getBoundingClientRect()
		const rect = quietRect(box.left, box.top, box.right, box.bottom, offsetY)
		if (rect) rects.push(rect)
	}
	return rects
}

/**
 * Starts the night sky inside `host`: creates the canvas, hands it to the sky worker and forwards size, scroll,
 * visibility, preference and layout changes. Returns a no-op controller where OffscreenCanvas or workers are
 * missing or the theme tokens can't be read, which leaves the plain navy background.
 */
export function mountSky(host: HTMLElement, canvasClassName: string): SkyController {
	if (!supported()) return NOOP
	const tokens = readTokens()
	if (!tokens) return NOOP
	const worker = startWorker()
	if (!worker) return NOOP

	// A fresh canvas per mount: control transfers only once, and StrictMode mounts twice in development
	const canvas = document.createElement('canvas')
	canvas.className = canvasClassName
	host.append(canvas)
	let offscreen: OffscreenCanvas | null = canvas.transferControlToOffscreen()
	const post = (message: SkyMainMessage, transfer: Transferable[] = []) => worker.postMessage(message, transfer)

	const listeners = new AbortController()
	const { signal } = listeners
	const reducedMotion = matchMedia(REDUCED_MOTION_QUERY)
	const forcedColors = matchMedia(FORCED_COLORS_QUERY)
	const moreContrast = matchMedia(MORE_CONTRAST_QUERY)
	const motion = (): SkyMotion => (forcedColors.matches ? 'off' : reducedMotion.matches ? 'reduced' : 'full')

	let phase: IntroPhase = 'loading'
	let size = { width: 0, height: 0, dpr: 0 }
	let flowRoots: Element[] = []
	let pinnedRoots: Element[] = []
	let lastLayout = ''
	let lastScrollY = window.scrollY
	let settleTimer: ReturnType<typeof setTimeout> | undefined
	let destroyed = false

	// Document height and quiet rects; runs after layout (observer callbacks, timers) and posts only when they changed
	const measureLayout = () => {
		if (offscreen || destroyed) return
		const pinned = pinnedRoots.flatMap((root) => quietRects(root, 0)).slice(0, MAX_QUIET_RECTS)
		const quiet = flowRoots.flatMap((root) => quietRects(root, window.scrollY)).slice(0, MAX_QUIET_RECTS - pinned.length)
		const documentHeight = document.documentElement.scrollHeight
		const layout = JSON.stringify([documentHeight, quiet, pinned])
		if (layout === lastLayout) return
		lastLayout = layout
		post({ type: 'layout', documentHeight, quiet, pinned })
	}

	// Entrances move copy without resizing anything: measure again once they have had time to settle
	const settleLater = () => {
		clearTimeout(settleTimer)
		settleTimer = setTimeout(measureLayout, ENTRANCE_SETTLE_MS)
	}

	const sendSize = (width: number, height: number) => {
		if (width <= 0 || height <= 0) return
		const dpr = canvasDpr(width, height)
		if (width === size.width && height === size.height && dpr === size.dpr) return
		size = { width, height, dpr }
		if (!offscreen) {
			post({ type: 'resize', width, height, dpr })
			return
		}
		post(
			{
				type: 'init',
				canvas: offscreen,
				width,
				height,
				dpr,
				tokens,
				emerging: phase !== 'loading',
				revealed: phase === 'revealed',
				motion: motion(),
				visible: document.visibilityState === 'visible',
				contrastMore: moreContrast.matches,
				scrollY: window.scrollY,
			},
			[offscreen]
		)
		offscreen = null
		measureLayout()
	}

	// Measured after layout, so no forced reflow; the first non-zero size starts the worker
	const canvasObserver = new ResizeObserver((entries) => {
		const box = entries[0]?.contentBoxSize[0]
		if (box) sendSize(box.inlineSize, box.blockSize)
	})
	canvasObserver.observe(canvas)

	// Zoom or a move to another screen changes the ratio without resizing the canvas: watch the current ratio
	const watchDpr = () => {
		matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
			'change',
			() => {
				watchDpr()
				sendSize(size.width, size.height)
			},
			{ once: true, signal }
		)
	}
	watchDpr()

	// The page and the quiet copy can change size after fonts load or on resize: measure again
	const layoutObserver = new ResizeObserver(measureLayout)
	layoutObserver.observe(document.body)

	// Motion's scroll() shares one frame-batched listener with the navbar's useScroll. Keep both parameters:
	// Motion only passes the scroll info (with the offset in px) to two-argument callbacks.
	const stopScroll = scroll((_progress, info) => {
		const y = info.y.current
		if (y === lastScrollY) return
		lastScrollY = y
		post({ type: 'scroll', y })
		// Contact's entrance plays as it scrolls into view
		settleLater()
	})

	const syncMotion = () => post({ type: 'motion', motion: motion() })
	document.addEventListener('visibilitychange', () => post({ type: 'visible', visible: document.visibilityState === 'visible' }), { signal })
	reducedMotion.addEventListener('change', syncMotion, { signal })
	forcedColors.addEventListener('change', syncMotion, { signal })
	moreContrast.addEventListener('change', () => post({ type: 'contrast', more: moreContrast.matches }), { signal })

	const destroy = () => {
		if (destroyed) return
		destroyed = true
		clearTimeout(settleTimer)
		listeners.abort()
		stopScroll()
		canvasObserver.disconnect()
		layoutObserver.disconnect()
		worker.terminate()
		canvas.remove()
	}

	worker.addEventListener(
		'message',
		(event: MessageEvent<SkyWorkerMessage>) => {
			if (event.data.type === 'ready') canvas.dataset.ready = ''
			else destroy()
		},
		{ signal }
	)
	// A worker that fails to load or throws leaves the plain navy background
	worker.addEventListener('error', destroy, { signal })

	return {
		setPhase(next) {
			if (next === phase || destroyed) return
			phase = next
			if (!offscreen) post({ type: phase === 'revealed' ? 'reveal' : 'emerge' })
			if (phase !== 'revealed') return
			// The revealed page has just committed: find its quiet copy, then measure again as the entrance and fonts settle
			const roots = Array.from(document.querySelectorAll(QUIET_SELECTOR))
			// Copy in fixed elements (the side rails) stays put on screen while the page scrolls
			pinnedRoots = roots.filter((root) => getComputedStyle(root).position === 'fixed')
			flowRoots = roots.filter((root) => !pinnedRoots.includes(root))
			for (const root of roots) layoutObserver.observe(root)
			settleLater()
			void document.fonts.ready.then(measureLayout)
		},
		destroy,
	}
}
