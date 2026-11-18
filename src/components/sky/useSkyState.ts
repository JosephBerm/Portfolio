import { useSyncExternalStore } from 'react'
import { serverSkyPlayback, skyPlayback, subscribeSkyPlayback, type SkyPlayback } from './skyPause'
import { serverSkySound, skySound, subscribeSkySound, type SkySound } from './skySound'
import { serverSkyView, skyView, subscribeSkyView, type SkyView } from './skyView'

/** Whether the sky moves, or null while no sky runs (skyPause.ts). */
export function useSkyPlayback(): SkyPlayback | null {
	return useSyncExternalStore(subscribeSkyPlayback, skyPlayback, serverSkyPlayback)
}

/** Whether the page's content shows over the sky, or null while no sky runs (skyView.ts). */
export function useSkyView(): SkyView | null {
	return useSyncExternalStore(subscribeSkyView, skyView, serverSkyView)
}

/** Whether the landing scene's music is on, or null while there is no landing room to play at (skySound.ts). */
export function useSkySound(): SkySound | null {
	return useSyncExternalStore(subscribeSkySound, skySound, serverSkySound)
}
