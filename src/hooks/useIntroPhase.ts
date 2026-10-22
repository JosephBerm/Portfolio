import { createContext, use } from 'react'

/**
 * Where the home intro is: the loader is showing, the loader is fading out, or the page has been revealed.
 * Outside <IntroGate> the page counts as revealed.
 */
export type IntroPhase = 'loading' | 'exiting' | 'revealed'

/** Provided by <IntroGate>; read with useIntroPhase(). */
export const IntroPhaseContext = createContext<IntroPhase>('revealed')

/** The current intro phase, for backdrops that choreograph with the loader (the home sky). */
export function useIntroPhase(): IntroPhase {
	return use(IntroPhaseContext)
}
