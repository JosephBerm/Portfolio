/**
 * Whether the home sky moves, as a small external store rather than React context: the pause control and the sky's
 * controller are unrelated client components, and mountSky is not React at all. A page view is one mount of the home
 * page: the last unsubscribe forgets what was read and any Play pressed under reduced motion, so the next mount reads
 * storage and the OS setting afresh. Nothing here touches window, matchMedia or localStorage at module scope, so
 * server-rendered client code can import it.
 */

import { REDUCED_MOTION_QUERY } from '@/lib/utils'

/** What the sky's pause control shows: the sky moves, or it holds still. */
export type SkyPlayback = 'playing' | 'paused'

/** localStorage key holding '1' while the visitor has paused the sky in this browser (WCAG 2.2.2's mechanism, remembered). */
const PAUSED_KEY = 'sky-paused'

/** Subscribers in this tab: the control and mountSky. */
const listeners = new Set<() => void>()
/** A sky is drawing (its worker has drawn a first frame); the control shows only then. */
let running = false
/** The stored pause, read once; null until first read. */
let stored: boolean | null = null
/** Play pressed while the OS asks for reduced motion: honored for this page view (one mount of the home page) only, never stored. */
let playOverride = false
let reducedMotion: MediaQueryList | null = null
let stopWatching: (() => void) | null = null

/** The reduced-motion query, created on first use, never during server rendering. */
function reduced(): MediaQueryList {
	reducedMotion ??= matchMedia(REDUCED_MOTION_QUERY)
	return reducedMotion
}

/** Whether the visitor paused the sky in this browser; blocked or missing storage counts as no, so a storage failure never breaks the page. */
function storedPause(): boolean {
	if (stored === null) {
		try {
			stored = localStorage.getItem(PAUSED_KEY) === '1'
		} catch {
			stored = false
		}
	}
	return stored
}

function notify(): void {
	for (const listener of listeners) listener()
}

/** True when the sky should hold still: the visitor paused it, or reduced motion is on and they haven't pressed Play in this page view. */
export function skyPaused(): boolean {
	return storedPause() || (reduced().matches && !playOverride)
}

/** The control's state, or null while no sky runs. A string, so React's Object.is snapshot comparison is stable. */
export function skyPlayback(): SkyPlayback | null {
	if (!running) return null
	return skyPaused() ? 'paused' : 'playing'
}

/** Server render and hydration: no control (the choice lives in this browser, and no sky runs yet). */
export function serverSkyPlayback(): SkyPlayback | null {
	return null
}

/** mountSky reports that its sky draws (the worker's first frame) or has gone (destroyed, failed). */
export function setSkyRunning(next: boolean): void {
	if (running === next) return
	running = next
	notify()
}

/** Pauses or resumes the sky. A pause is remembered in this browser; Play forgets it, and under reduced motion lasts for this page view. */
export function setSkyPaused(paused: boolean): void {
	stored = paused
	playOverride = !paused && reduced().matches
	try {
		if (paused) localStorage.setItem(PAUSED_KEY, '1')
		else localStorage.removeItem(PAUSED_KEY)
	} catch {
		// Storage is blocked (a private window, say): the choice lasts for this page view
	}
	notify()
}

/** Calls `listener` whenever the playback may have changed (the control, another tab, the OS setting, the sky starting or stopping); returns the unsubscribe. */
export function subscribeSkyPlayback(listener: () => void): () => void {
	listeners.add(listener)
	if (!stopWatching) {
		const watch = new AbortController()
		// Reduced motion turned on or off: an earlier Play no longer applies
		reduced().addEventListener(
			'change',
			() => {
				playOverride = false
				notify()
			},
			{ signal: watch.signal }
		)
		// Paused or resumed in another tab (a null key means that tab cleared all its storage)
		window.addEventListener(
			'storage',
			(event) => {
				if (event.key !== PAUSED_KEY && event.key !== null) return
				stored = null
				notify()
			},
			{ signal: watch.signal }
		)
		stopWatching = () => watch.abort()
	}
	return () => {
		listeners.delete(listener)
		if (listeners.size > 0) return
		stopWatching?.()
		stopWatching = null
		// The home page unmounted (a client-side navigation away): its next mount reads storage and the OS setting afresh
		stored = null
		playOverride = false
	}
}
