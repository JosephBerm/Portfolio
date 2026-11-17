'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { intro } from '@/lib/animations'
import { IntroPhaseContext, type IntroPhase } from '@/hooks/useIntroPhase'
import styles from './IntroGate.module.css'

/**
 * Without JavaScript the loader never lifts: hide it, show the server-rendered page and let it scroll (the "Home intro"
 * block in globals.css hides and holds it until the reveal), and drop Motion's inline initial states (opacity 0 and
 * entrance offsets), which a stylesheet's !important outranks. The sky's landing room (empty space for a canvas that is
 * never drawn) goes too, so the page has no gap.
 */
const NO_SCRIPT_CSS =
	'#intro-loader{display:none!important}#intro-content{visibility:visible!important}#intro-content [style*="opacity"]{opacity:1!important;transform:none!important}[data-sky-landing]{display:none}html{overflow:visible!important;background-color:transparent!important}html body{overflow-x:hidden!important}'

/** The loader's fade, for IntroGate.module.css. */
const LOADER_TIMING = { '--intro-fade': `${intro.fade}s` } as CSSProperties

/** The element the URL fragment points at, if any (a malformed %-escape matches nothing). */
function getHashTarget(): HTMLElement | null {
	const id = window.location.hash.slice(1)
	if (!id) return null
	try {
		return document.getElementById(decodeURIComponent(id))
	} catch {
		return null
	}
}

/** This document's navigation entry. Its activationStart (Chromium) is when a page the browser prerendered was shown; TypeScript's DOM types don't list it yet. */
function navigationEntry(): (PerformanceNavigationTiming & { activationStart?: number }) | undefined {
	return performance.getEntriesByType('navigation')[0] as (PerformanceNavigationTiming & { activationStart?: number }) | undefined
}

/** Resolves `ms` after navigation start (the origin of performance.now()), at once if that has passed. */
function until(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms - performance.now())))
}

/** The intro's ceiling: intro.ceiling after the page could first be seen (navigation start, or a prerendered page's activation). */
function ceiling(): Promise<void> {
	return until((navigationEntry()?.activationStart ?? 0) + intro.ceiling * 1000)
}

/**
 * On a load of a URL with a fragment (a shared link, a nav link opened in a new tab), puts its target at the top again
 * under the loader: the browser scrolled there as the page loaded, and fonts loading since may have moved it. A reload
 * or a history traversal keeps the position the browser restored. 'instant' overrides the CSS smooth scroll, as a
 * native load does.
 */
function settleOnFragment(): void {
	const type = navigationEntry()?.type
	if (type === 'reload' || type === 'back_forward') return
	getHashTarget()?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

/**
 * The intro's floor: the mark's entry (its CSS animations) has played and then held for intro.hold. Those animations
 * start with the first frame that renders them (in a tab opened in the background, when it is first shown), so the floor
 * counts from what the visitor saw. A mark with no entry (reduced motion) has no floor.
 */
async function markSettled(loader: HTMLElement): Promise<void> {
	const entry = loader.getAnimations({ subtree: true })
	if (entry.length === 0) return
	await Promise.all(entry.map((animation) => animation.finished.catch(() => undefined)))
	const ends = entry.map((animation) =>
		animation.startTime === null ? performance.now() : Number(animation.startTime) + Number(animation.effect?.getComputedTiming().endTime ?? 0)
	)
	await until(Math.max(...ends) + intro.hold * 1000)
}

/**
 * The page is ready to show: its fonts have loaded and a fragment's target is in place. `lift` aborts once the loader
 * starts to lift; from then on the visitor owns the scroll position, so a late font load no longer moves the page.
 */
async function pageReady(lift: AbortSignal): Promise<void> {
	await document.fonts.ready
	if (!lift.aborted) settleOnFragment()
}

/** The intro may end: its mark has played and held, and the page is ready or the ceiling has passed. */
async function introReady(loader: HTMLElement, lift: AbortSignal): Promise<void> {
	await Promise.all([markSettled(loader), Promise.race([pageReady(lift), ceiling()])])
}

interface IntroGateProps {
	/** Mounted once, outside the loader, so it is already in place when the loader lifts (the home sky). */
	backdrop?: React.ReactNode
	/** The loader's mark, rendered on the server (LoadingLogo) so it plays before any script runs. */
	mark: React.ReactNode
	children: React.ReactNode
}

/**
 * Plays the intro loader over the server-rendered page passed as `children`, which is laid out and hydrated under it and
 * shown without a remount. The loader lifts once its mark has played and held and the page is ready. The backdrop
 * follows the same timeline through IntroPhaseContext.
 */
export default function IntroGate({ backdrop, mark, children }: IntroGateProps) {
	const [phase, setPhase] = useState<IntroPhase>('loading')
	const [markLeaving, setMarkLeaving] = useState(false)
	const [faded, setFaded] = useState(false)
	const loaderRef = useRef<HTMLDivElement>(null)

	// The loader lifts once its mark has played and held and the page is ready, within the ceiling: the mark starts to
	// leave, then the loader fades as the stars come out. From the lift on, nothing the readiness work does moves the page
	useEffect(() => {
		const loader = loaderRef.current
		if (!loader) return
		performance.mark('intro-armed')
		const lift = new AbortController()
		let live = true
		void introReady(loader, lift.signal).then(() => {
			if (!live) return
			lift.abort()
			performance.mark('intro-exit')
			setMarkLeaving(true)
			setTimeout(() => {
				if (live) setPhase('exiting')
			}, intro.exitLead * 1000)
		})
		return () => {
			live = false
			lift.abort()
		}
	}, [])

	// The loader fades (IntroGate.module.css); once that has played, it leaves the DOM. A loader with no fade (a stylesheet
	// that turns animations off) leaves at once
	useEffect(() => {
		const loader = loaderRef.current
		if (phase !== 'exiting' || !loader) return
		let live = true
		const leave = () => {
			if (live) setFaded(true)
		}
		void Promise.all(loader.getAnimations().map((animation) => animation.finished)).then(leave, leave)
		return () => {
			live = false
		}
	}, [phase])

	// The loader is gone: after a short pause the page shows and its entrances start
	useEffect(() => {
		if (!faded) return
		const pause = setTimeout(() => {
			performance.mark('intro-revealed')
			setPhase('revealed')
		}, intro.pause * 1000)
		return () => clearTimeout(pause)
	}, [faded])

	return (
		<IntroPhaseContext value={phase}>
			<noscript>
				<style>{NO_SCRIPT_CSS}</style>
			</noscript>
			{backdrop}
			{phase !== 'revealed' && !faded && (
				<div
					ref={loaderRef}
					id="intro-loader"
					data-intro-phase={phase}
					data-mark={markLeaving ? 'leaving' : undefined}
					style={LOADER_TIMING}
					className={`fixed inset-y-0 left-0 w-screen z-[1000] flex flex-col items-center justify-center bg-dark-navy touch-pinch-zoom ${styles.loader}`}
				>
					{mark}
				</div>
			)}
			{/*
			 * Server-rendered so HTML-only crawlers can read it. Laid out and hydrated under the loader, but hidden and still
			 * until the reveal (the "Home intro" block in globals.css), so its fonts load, a fragment lands and the sky measures
			 * it; the reveal changes its visibility only. Entrances that play as it appears wait for useIntroRevealed().
			 */}
			<div id="intro-content" data-intro-phase={phase} className="overflow-hidden">
				{children}
			</div>
		</IntroPhaseContext>
	)
}
