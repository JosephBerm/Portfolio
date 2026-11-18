/**
 * Whether the home page's content shows over the sky, as a small external store rather than React context: its readers are
 * the Hide/View controls (the right rail's from md up, the footer's elsewhere; one shows at a time) and mountSky, which
 * isn't React. Hiding marks <html> with `data-sky-only` and every `data-sky-hide` element with `inert`, and the stylesheet
 * fades those elements out and takes their visibility, never their boxes (globals.css); showing takes both away again and
 * sets nothing in their place. Forced colors show the content and hide the control, so the content never hides under them,
 * and shows again if they come on while it is hidden. So does a change of the window's shape that moves the control
 * between the rail and the footer: the one the visitor pressed has gone, and the other may stand far down the page. A page
 * view is one mount of the home page: the last unsubscribe shows the content again, and so does a sky that stops, since
 * with no sky there is nothing to show. Nothing here touches window or document at module scope, so server-rendered client
 * code can import it.
 */

import { FORCED_COLORS_QUERY } from '@/lib/utils'

/** What the Hide/View control shows: the page's content over the sky, or the sky alone. */
export type SkyView = 'content' | 'sky'

/** What the Hide/View control hides: the navbar, each rail's copy, every section and the footer's copy. The controls stay outside all of them. */
export const SKY_HIDE_SELECTOR = '[data-sky-hide]'

/** From this width up the side rails show (SidePane.tsx's md, Tailwind's 48rem), and the control stands in the right-hand one. */
const RAILS_QUERY = '(min-width: 48rem)'
/**
 * In a window this short the rail's control has no box and the footer's stands instead (page.tsx, AppFooter.tsx). Both
 * queries are those classes' own limits: change them together.
 */
const SHORT_QUERY = '(max-height: 386px)'

/** Subscribers in this tab: the controls and mountSky. */
const listeners = new Set<() => void>()
/** A sky is drawing (its worker has drawn a first frame); the control shows only then. */
let running = false
/** The page's content is hidden, and only the sky shows. */
let hidden = false
/** Ends the listeners that run only while the content is hidden: Escape, forced colors coming on, and the control moving. */
let stopWatch: (() => void) | null = null

function notify(): void {
	for (const listener of listeners) listener()
}

/**
 * Hides or shows the content: the attribute the stylesheet reads; `inert` on what hides, so nothing in it can take focus,
 * a click or a screen reader's attention while it fades and after, whatever visibility its own descendants set; and, while
 * it is hidden, Escape to bring it back and watches on forced colors and on the control's place, either of which shows it.
 */
function apply(next: boolean): void {
	if (hidden === next) return
	hidden = next
	document.documentElement.toggleAttribute('data-sky-only', next)
	for (const element of document.querySelectorAll(SKY_HIDE_SELECTOR)) element.toggleAttribute('inert', next)
	stopWatch?.()
	stopWatch = null
	if (next) {
		const watch = new AbortController()
		document.addEventListener(
			'keydown',
			(event) => {
				if (event.key === 'Escape') apply(false)
			},
			{ signal: watch.signal }
		)
		// Forced colors show the content (globals.css) and hide the control: bring the content back whole, or it would stay inert
		matchMedia(FORCED_COLORS_QUERY).addEventListener(
			'change',
			(event) => {
				if (event.matches) apply(false)
			},
			{ signal: watch.signal }
		)
		// A window that changes shape (a tablet turned upright, a window narrowed or made short) can move the control between
		// the rail and the footer, far down the page: bring the content back, or the visitor could be left with the sky alone
		// and nothing on screen to press
		const rails = matchMedia(RAILS_QUERY)
		const short = matchMedia(SHORT_QUERY)
		const inRail = () => rails.matches && !short.matches
		const wasInRail = inRail()
		const moved = () => {
			if (inRail() !== wasInRail) apply(false)
		}
		rails.addEventListener('change', moved, { signal: watch.signal })
		short.addEventListener('change', moved, { signal: watch.signal })
		stopWatch = () => watch.abort()
	}
	notify()
}

/** The control's state, or null while no sky runs. A string, so React's Object.is snapshot comparison is stable. */
export function skyView(): SkyView | null {
	if (!running) return null
	return hidden ? 'sky' : 'content'
}

/** Server render and hydration: no control (no sky runs yet). */
export function serverSkyView(): SkyView | null {
	return null
}

/** Whether the page's content is hidden now. */
export function contentHidden(): boolean {
	return hidden
}

/** mountSky reports that its sky draws (the worker's first frame) or has gone (destroyed, failed); a sky that goes brings the content back. */
export function setSkyViewRunning(next: boolean): void {
	if (running === next) return
	running = next
	if (hidden && !next) apply(false)
	else notify()
}

/** Hides the page's content so the sky shows alone, or shows it again. Only while a sky runs, and never under forced colors, which show it. */
export function setContentHidden(next: boolean): void {
	apply(next && running && !matchMedia(FORCED_COLORS_QUERY).matches)
}

/** Calls `listener` whenever the view may have changed (the control, Escape, forced colors, the control moving, the sky starting or stopping); returns the unsubscribe. */
export function subscribeSkyView(listener: () => void): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
		// The home page unmounted (a client-side navigation away): the next page shows its content
		if (listeners.size === 0) apply(false)
	}
}
