import { scroll } from 'motion/react'
import type { IntroPhase } from '@/hooks/useIntroPhase'
import { lightHeadroom, minimumContrast, parseHexColor, parseRgbColor } from '@/lib/sky/color'
import type { SkyMainMessage, SkyMotion, SkyRect, SkyTokens, SkyWorkerMessage } from '@/lib/sky/protocol'
import { setSkyRunning, skyPaused, subscribeSkyPlayback } from './skyPause'

/** Handle returned by mountSky. */
export interface SkyController {
	/** Follows IntroGate: the stars come out as the loader lifts, and shooting stars and satellites start once the page shows. */
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

/** Presence pings for the sky's idle clock, at most this often (ms): someone moving the pointer or typing is still here. */
const ACTIVITY_INTERVAL_MS = 1000

/** Input that shows someone is still here without scrolling. */
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const

/** Pointers that lean the sky (LEAN): a mouse or pen on a screen that can hover. */
const LEAN_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

/**
 * Copy the sky stays quiet behind: no bright stars beside it, and a shooting star behind it dims to what the copy can
 * take. The hero, Contact, the footer and the side rails opt in with data-sky-quiet. Copy in fixed elements (the rails)
 * stays put on screen, so its rects travel in screen coordinates. The copy and its ancestors keep the preconditions of
 * copyReader: no static transform translation and no opacity below 1 at rest.
 */
const QUIET_SELECTOR = '[data-sky-quiet]'

/** Inside quiet copy, links and buttons count by their whole box (a bordered button reaches well past its text). */
const QUIET_CONTROLS = 'a, button'

/** Most quiet rects sent to the worker: one per line of copy, about 31 on desktop and 35-37 on phones. */
const MAX_QUIET_RECTS = 64

/** CSS font-weight of normal text, assumed when an element's computed weight is not a number. */
const NORMAL_FONT_WEIGHT = 400

/**
 * Entrances move copy without resizing anything: the hero slides its copy up to 40px and settles by about 1.2s after
 * the reveal, and Contact fades up as it scrolls into view. Measurement takes their translation out (see copyReader), so
 * the rects are the settled ones from the first; measure again this long after the reveal and after scrolling stops
 * anyway, in case an entrance moves copy another way (ms).
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

/** A translation in CSS px. */
interface Shift {
	x: number
	y: number
}

/** What a measurement reads of the copy's elements, each once. */
interface CopyReader {
	/** The translation (px) the entrances of this element and its ancestors still add to its box: where the copy is minus where it settles. */
	shift(element: Element): Shift
	/** SkyRect.headroom of text in this element, from its computed color, size and weight. */
	headroom(element: Element): number
}

/**
 * A reader for one measurement. Entrances are Motion translations (a `matrix()` with its offsets in the 5th and 6th terms),
 * so measuring net of them gives the rects the copy settles to. Headroom depends only on color, size and weight, so
 * `headrooms` keeps the scans across measurements.
 *
 * Preconditions, kept by the copy under data-sky-quiet: no static transform translation on the copy or its ancestors
 * (every measurement takes all translations out, so a lasting one, a translate(-50%) centering say, would put the zones
 * beside the copy for good) and no opacity below 1 at rest (headroom reads `color` alone, so a translucent element would
 * be dimmer than its headroom says). The color is the one at measurement time: a link that changes color on hover or
 * focus (the rails' links, light slate at rest and green then) keeps the headroom of the state it was measured in until
 * the next measurement, which is harmless only while no flight reaches the rails (the planner's `clearOf`, which a launch
 * fills with the padded rails).
 */
function copyReader(tokens: SkyTokens, headrooms: Map<string, number>): CopyReader {
	const shifts = new Map<Element, Shift>()
	const shift = (element: Element): Shift => {
		let known = shifts.get(element)
		if (!known) {
			const outer = element.parentElement ? shift(element.parentElement) : { x: 0, y: 0 }
			const { transform } = getComputedStyle(element)
			const matrix = transform === 'none' ? null : new DOMMatrixReadOnly(transform)
			known = { x: outer.x + (matrix?.m41 ?? 0), y: outer.y + (matrix?.m42 ?? 0) }
			shifts.set(element, known)
		}
		return known
	}
	const headroom = (element: Element): number => {
		const { color, fontSize, fontWeight } = getComputedStyle(element)
		const key = `${color}|${fontSize}|${fontWeight}`
		let known = headrooms.get(key)
		if (known === undefined) {
			const text = parseRgbColor(color, tokens.navy)
			// A color that can't be read gets no headroom: nothing but navy behind it
			known = text ? lightHeadroom(text, tokens.navy, tokens.white, minimumContrast(Number.parseFloat(fontSize), Number.parseInt(fontWeight, 10) || NORMAL_FONT_WEIGHT)) : 0
			headrooms.set(key, known)
		}
		return known
	}
	return { shift, headroom }
}

/** A box moved by its entrance `shift` and down by `offsetY` (the scroll offset, for document coordinates), or null when it has no area. */
function quietRect(box: DOMRectReadOnly, shift: Shift, offsetY: number, headroom: number): SkyRect | null {
	const left = box.left - shift.x
	const top = box.top - shift.y
	const right = box.right - shift.x
	const bottom = box.bottom - shift.y
	return right > left && bottom > top ? { x: left, y: top + offsetY, width: right - left, height: bottom - top, headroom } : null
}

/**
 * The quiet rects inside `root`, moved down by `offsetY`: the ink of each line of text (not the layout boxes, which
 * span the whole column even where the words stop, nor one box per run, which spans the empty sky beside a short
 * line) and the full box of each link or button, each with the headroom of its own text.
 */
function quietRects(root: Element, offsetY: number, reader: CopyReader): SkyRect[] {
	const rects: SkyRect[] = []
	const range = document.createRange()
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
	for (let node = walker.nextNode(); node; node = walker.nextNode()) {
		const element = node.parentElement
		if (!element || !node.textContent?.trim()) continue
		range.selectNodeContents(node)
		const shift = reader.shift(element)
		const headroom = reader.headroom(element)
		for (const line of range.getClientRects()) {
			const rect = quietRect(line, shift, offsetY, headroom)
			if (rect) rects.push(rect)
		}
	}
	for (const control of root.querySelectorAll(QUIET_CONTROLS)) {
		const rect = quietRect(control.getBoundingClientRect(), reader.shift(control), offsetY, reader.headroom(control))
		if (rect) rects.push(rect)
	}
	return rects
}

/**
 * Starts the night sky inside `host`: creates the canvas, hands it to the sky worker and forwards size, scroll, the
 * pointer's place for the lean, activity (pointer, keys and focus), visibility, preference and layout changes, and the
 * page's animation frames while the worker asks for them. Returns a no-op controller where OffscreenCanvas or workers
 * are missing or the theme tokens can't be read, which leaves the plain navy background.
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
	const forcedColors = matchMedia(FORCED_COLORS_QUERY)
	const moreContrast = matchMedia(MORE_CONTRAST_QUERY)
	// The pause store owns the reduced-motion query and the visitor's pause: either one holds the sky still
	const motion = (): SkyMotion => (forcedColors.matches ? 'off' : skyPaused() ? 'reduced' : 'full')
	let sentMotion = motion()
	// Post only real changes: the store notifies whenever the playback may have changed (the sky starting or stopping, the
	// OS setting, another tab), and many of those leave the motion as it was
	const syncMotion = () => {
		const next = motion()
		if (next === sentMotion) return
		sentMotion = next
		post({ type: 'motion', motion: next })
	}
	const stopPlayback = subscribeSkyPlayback(syncMotion)

	let phase: IntroPhase = 'loading'
	let size = { width: 0, height: 0, dpr: 0 }
	let flowRoots: Element[] = []
	let pinnedRoots: Element[] = []
	let lastLayout = ''
	const headrooms = new Map<string, number>()
	let lastScrollY = window.scrollY
	let settleTimer: ReturnType<typeof setTimeout> | undefined
	let destroyed = false

	// Document height and quiet rects; runs after layout (observer callbacks, timers) and posts only when they changed
	const measureLayout = () => {
		if (offscreen || destroyed) return
		const reader = copyReader(tokens, headrooms)
		const pinned = pinnedRoots.flatMap((root) => quietRects(root, 0, reader)).slice(0, MAX_QUIET_RECTS)
		const quiet = flowRoots.flatMap((root) => quietRects(root, window.scrollY, reader)).slice(0, MAX_QUIET_RECTS - pinned.length)
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
				motion: sentMotion,
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

	// Pointer, keys and focus show someone is here without scrolling: tell the worker's idle clock, at most once a second
	let lastActivity = -Infinity
	const noteActivity = () => {
		const now = performance.now()
		// Before init there is no worker clock to wake
		if (offscreen || now - lastActivity < ACTIVITY_INTERVAL_MS) return
		lastActivity = now
		post({ type: 'activity' })
	}
	for (const type of ACTIVITY_EVENTS) window.addEventListener(type, noteActivity, { passive: true, signal })

	// A mouse or pen leans the stars: tell the worker where it is, from the canvas size the observer already measured (so
	// there is no layout read) and at most once per animation frame, whatever the rate of the events
	const finePointer = matchMedia(LEAN_POINTER_QUERY)
	let pointerFrame = 0
	let pointerAt: { x: number; y: number } | null = null
	const sendPointer = () => {
		pointerFrame = 0
		post({ type: 'pointer', at: pointerAt })
	}
	const queuePointer = (at: { x: number; y: number } | null) => {
		// Before the first size there is no worker to tell, and a size of 0 would make the position not finite. A paused sky
		// or one under reduced motion holds still, so it isn't told either.
		if (!size.width || !finePointer.matches || motion() !== 'full') return
		pointerAt = at
		if (!pointerFrame) pointerFrame = requestAnimationFrame(sendPointer)
	}
	window.addEventListener(
		'pointermove',
		(event) => {
			// Touch already moves the page by scrolling
			if (event.pointerType === 'touch') return
			const x = Math.min(1, Math.max(-1, (event.clientX / size.width) * 2 - 1))
			const y = Math.min(1, Math.max(-1, (event.clientY / size.height) * 2 - 1))
			queuePointer({ x, y })
		},
		{ passive: true, signal }
	)
	// The pointer leaving the window (no related target) or the window losing focus: the lean eases back to the middle
	document.addEventListener(
		'pointerout',
		(event) => {
			if (event.pointerType !== 'touch' && event.relatedTarget === null) queuePointer(null)
		},
		{ passive: true, signal }
	)
	window.addEventListener('blur', () => queuePointer(null), { signal })

	// WebKit's worker draws on a fixed 15 ms timer, not the display, so while the worker asks for it the page's own animation
	// frames stand in: one tick per frame, nothing read from the layout. The worker stops it when it has no use for it.
	let relayFrame = 0
	const sendTick = () => {
		relayFrame = requestAnimationFrame(sendTick)
		post({ type: 'tick' })
	}
	const setRelay = (on: boolean) => {
		if (on) {
			// A sky that was destroyed starts nothing
			if (!relayFrame && !destroyed) relayFrame = requestAnimationFrame(sendTick)
			return
		}
		cancelAnimationFrame(relayFrame)
		relayFrame = 0
	}

	document.addEventListener('visibilitychange', () => post({ type: 'visible', visible: document.visibilityState === 'visible' }), { signal })
	forcedColors.addEventListener('change', syncMotion, { signal })
	moreContrast.addEventListener('change', () => post({ type: 'contrast', more: moreContrast.matches }), { signal })

	const destroy = () => {
		if (destroyed) return
		destroyed = true
		clearTimeout(settleTimer)
		// The pending pointer message and tick would go to a worker that is gone, which can no longer turn the relay off
		cancelAnimationFrame(pointerFrame)
		setRelay(false)
		listeners.abort()
		stopScroll()
		stopPlayback()
		// A failed or destroyed sky takes the pause control with it
		setSkyRunning(false)
		canvasObserver.disconnect()
		layoutObserver.disconnect()
		worker.terminate()
		canvas.remove()
	}

	worker.addEventListener(
		'message',
		(event: MessageEvent<SkyWorkerMessage>) => {
			const message = event.data
			switch (message.type) {
				case 'ready':
					canvas.dataset.ready = ''
					// The first frame is on the canvas: the pause control may show
					setSkyRunning(true)
					break
				case 'error':
					destroy()
					break
				case 'relay':
					setRelay(message.on)
					break
				default: {
					// Every message type is handled above: a new one fails to compile here, rather than being taken for an error
					const unhandled: never = message
					return unhandled
				}
			}
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
