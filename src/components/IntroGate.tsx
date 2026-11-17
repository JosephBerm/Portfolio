'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { intro } from '@/lib/animations'
import { IntroPhaseContext, type IntroPhase } from '@/hooks/useIntroPhase'
import styles from './IntroGate.module.css'

/**
 * Without JavaScript the loader never lifts: hide it, show the server-rendered page and drop Motion's inline initial
 * states (opacity 0 and entrance offsets), which a stylesheet's !important outranks. The sky's landing room (empty space
 * for a canvas that is never drawn) goes too, so the page has no gap.
 */
const NO_SCRIPT_CSS =
	'#intro-loader{display:none!important}#intro-content{display:block!important}#intro-content [style*="opacity"]{opacity:1!important;transform:none!important}[data-sky-landing]{display:none}'

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

/** Resolves `ms` after navigation start (the origin of performance.now()), at once if that has passed. */
function until(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms - performance.now())))
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

interface IntroGateProps {
	/** Mounted once, outside the loader, so it is already in place when the loader lifts (the home sky). */
	backdrop?: React.ReactNode
	/** The loader's mark, rendered on the server (LoadingLogo) so it plays before any script runs. */
	mark: React.ReactNode
	children: React.ReactNode
}

/**
 * Plays the intro loader over the server-rendered page passed as `children`, then reveals the page. The loader lifts once
 * its mark has played and held. The backdrop follows the same timeline through IntroPhaseContext.
 */
export default function IntroGate({ backdrop, mark, children }: IntroGateProps) {
	const [phase, setPhase] = useState<IntroPhase>('loading')
	const [markLeaving, setMarkLeaving] = useState(false)
	const [faded, setFaded] = useState(false)
	const loaderRef = useRef<HTMLDivElement>(null)
	const revealed = phase === 'revealed'

	// The loader lifts once its mark's entry has played and held: the mark starts to leave, then the loader fades as the
	// stars come out
	useEffect(() => {
		const loader = loaderRef.current
		if (!loader) return
		let live = true
		void markSettled(loader).then(() => {
			if (!live) return
			performance.mark('intro-exit')
			setMarkLeaving(true)
			setTimeout(() => {
				if (live) setPhase('exiting')
			}, intro.exitLead * 1000)
		})
		return () => {
			live = false
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

	// The browser's own fragment scroll ran while the content was display:none, so a /#section URL (a shared link, or a
	// nav link opened in a new tab) would land at the top. Jump there once the revealed tree has mounted; the frame lets
	// mount-time measurement settle, and 'instant' overrides the CSS smooth scroll like a native load.
	useEffect(() => {
		if (!revealed) return
		const frame = requestAnimationFrame(() => getHashTarget()?.scrollIntoView({ block: 'start', behavior: 'instant' }))
		return () => cancelAnimationFrame(frame)
	}, [revealed])

	return (
		<IntroPhaseContext value={phase}>
			<noscript>
				<style>{NO_SCRIPT_CSS}</style>
			</noscript>
			{backdrop}
			{!revealed && !faded && (
				<div
					ref={loaderRef}
					id="intro-loader"
					data-intro-phase={phase}
					data-mark={markLeaving ? 'leaving' : undefined}
					style={LOADER_TIMING}
					className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-dark-navy ${styles.loader}`}
				>
					{mark}
				</div>
			)}
			{/*
			 * Server-rendered so HTML-only crawlers can read it. display:none until the loader is gone keeps
			 * layout, scroll and in-view reveals inert; the key flip then remounts the tree so every
			 * mount-driven entrance animation starts exactly when the content used to mount.
			 */}
			<div key={revealed ? 'revealed' : 'preload'} id="intro-content" className={revealed ? 'overflow-hidden' : 'hidden'}>
				{children}
			</div>
		</IntroPhaseContext>
	)
}
