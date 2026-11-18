/**
 * Whether the landing scene's music is on, as a small external store like skyPause.ts and skyView.ts: its readers are the
 * sky menu's Music switch, and it drives sceneMusic.ts. Off at every page view, and never remembered: the browser lets a
 * page make sound only after a click or key press, and WCAG 2.2's 1.4.2 asks that audio not start on its own, so the
 * visitor turns it on each visit. It has a switch only while a landing room exists to play at: mountSky hands over the
 * room when its sky first draws, and takes it back when the sky stops. Forced colors hide the sky and its controls, so
 * they turn the music off. Nothing here touches window or document at module scope, so server-rendered client code can
 * import it.
 */

import { FORCED_COLORS_QUERY } from '@/lib/utils'
import { createSceneMusic, type SceneMusic } from './sceneMusic'

/** What the Music switch shows. */
export type SkySound = 'on' | 'off'

/** Subscribers in this tab: the sky menu. */
const listeners = new Set<() => void>()
/** The landing room the scene is drawn in, while a sky draws one; null hides the switch. */
let landing: Element | null = null
let on = false
/** Created at the first turn on, inside its click, for the room it was made for. */
let music: SceneMusic | null = null
/** Ends the watch that runs only while the music is on: forced colors coming on. */
let stopWatch: (() => void) | null = null

function notify(): void {
	for (const listener of listeners) listener()
}

/** Turns the music on or off. Synchronous, so a turn on runs inside the click that asked for it. */
function apply(next: boolean): void {
	if (on === next) return
	on = next
	stopWatch?.()
	stopWatch = null
	if (on && landing) {
		music ??= createSceneMusic(landing, () => apply(false))
		music.start()
		const watch = new AbortController()
		matchMedia(FORCED_COLORS_QUERY).addEventListener(
			'change',
			(event) => {
				if (event.matches) apply(false)
			},
			{ signal: watch.signal }
		)
		stopWatch = () => watch.abort()
	} else {
		music?.stop()
	}
	notify()
}

/** Turns the music off and lets go of it: the room has gone, or the page has. */
function release(): void {
	apply(false)
	music?.destroy()
	music = null
}

/** The switch's state, or null while there is no landing room to play at. A string, so React's Object.is snapshot comparison is stable. */
export function skySound(): SkySound | null {
	if (!landing) return null
	return on ? 'on' : 'off'
}

/** Server render and hydration: no switch (no sky draws yet). */
export function serverSkySound(): SkySound | null {
	return null
}

/** mountSky hands over the landing room when its sky first draws (null if the page has none), and null when the sky stops. */
export function setSkySoundLanding(next: Element | null): void {
	if (landing === next) return
	release()
	landing = next
	notify()
}

/** Turns the music on or off; call a turn on from the click or key press that asked for it. Never under forced colors. */
export function setSkySoundOn(next: boolean): void {
	apply(next && landing !== null && !matchMedia(FORCED_COLORS_QUERY).matches)
}

/** Calls `listener` whenever the switch may have changed (the switch, an interruption, forced colors, the room coming or going); returns the unsubscribe. */
export function subscribeSkySound(listener: () => void): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
		// The home page unmounted (a client-side navigation away): the music stops with it
		if (listeners.size === 0) release()
	}
}
