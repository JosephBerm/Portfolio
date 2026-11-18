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

/** Work the home intro waits for before it ends, within intro.ceiling: what the loader's lift will show should be ready. */
export interface IntroHolds {
	/** Adds work to wait for. Call it from an effect of a component the intro hosts, in the commit that mounts it. */
	add(work: Promise<unknown>): void
	/** Settles once every work added has settled, fulfilled or not, including work added while it waits. */
	settled(): Promise<void>
}

/** A fresh set of holds, one per <IntroGate>. */
export function createIntroHolds(): IntroHolds {
	const works: Promise<unknown>[] = []
	return {
		add(work) {
			works.push(work)
		},
		// Waits again for whatever was added while it waited, so a hold added late is still waited for
		settled: async () => {
			for (let seen = 0; seen < works.length; ) {
				const batch = works.slice(seen)
				seen = works.length
				await Promise.allSettled(batch)
			}
		},
	}
}

/** Provided by <IntroGate>; null outside it, where nothing waits. */
export const IntroHoldsContext = createContext<IntroHolds | null>(null)

/** The intro's holds, for a component whose first view the loader's lift should wait for (the home sky). Null outside <IntroGate>. */
export function useIntroHolds(): IntroHolds | null {
	return use(IntroHoldsContext)
}
