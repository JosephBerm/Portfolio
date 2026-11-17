import { createContext, use } from 'react'

/**
 * Where the home intro is: the loader shows (its mark may have started to leave), the loader fades, or the page shows.
 * Outside <IntroGate> the page counts as shown.
 */
export type IntroPhase = 'loading' | 'exiting' | 'revealed'

/** Provided by <IntroGate>; read with useIntroPhase() or useIntroRevealed(). */
export const IntroPhaseContext = createContext<IntroPhase>('revealed')

/** The current intro phase, for backdrops that choreograph with the loader (the home sky). */
export function useIntroPhase(): IntroPhase {
	return use(IntroPhaseContext)
}

/**
 * Whether the page shows. Under <IntroGate> it is laid out unseen first, so an entrance that plays as the page appears,
 * not on scroll, waits for this rather than for its own mount. True outside <IntroGate>.
 */
export function useIntroRevealed(): boolean {
	return use(IntroPhaseContext) === 'revealed'
}
