'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { duration, easing } from '@/lib'
import { IntroPhaseContext, type IntroPhase } from '@/hooks/useIntroPhase'
import LoadingLogo from '@/components/LoadingLogo'

/** Pause after loader exit before page entrance animations begin (seconds). */
const POST_LOADER_PAUSE = 0.25

/**
 * Without JavaScript the timers never run: hide the loader, show the server-rendered page and drop Motion's inline
 * initial states (opacity 0 and entrance offsets), which a stylesheet's !important outranks.
 */
const NO_SCRIPT_CSS =
	'#intro-loader{display:none!important}#intro-content{display:block!important}#intro-content [style*="opacity"]{opacity:1!important;transform:none!important}'

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

interface IntroGateProps {
	/** Mounted once, outside the remounted tree, so it is already in place when the loader lifts (the home sky). */
	backdrop?: React.ReactNode
	children: React.ReactNode
}

/**
 * Plays the intro loader, then reveals the server-rendered page passed as `children`.
 * The page's entrance animations are mount-driven, so the content mounts at reveal time.
 * The backdrop follows the same timeline through IntroPhaseContext.
 */
export default function IntroGate({ backdrop, children }: IntroGateProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [loaderGone, setLoaderGone] = useState(false)
	const [showContent, setShowContent] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), duration.loader * 1000)
		return () => clearTimeout(timer)
	}, [])

	// Loader has fully exited the DOM — wait, then reveal page content
	useEffect(() => {
		if (!loaderGone) return
		const pause = setTimeout(() => setShowContent(true), POST_LOADER_PAUSE * 1000)
		return () => clearTimeout(pause)
	}, [loaderGone])

	// The browser's own fragment scroll ran while the content was display:none, so a /#section URL (a shared link,
	// or a nav link opened in a new tab) would land at the top. Jump there once the revealed tree has mounted; the
	// frame lets mount-time measurement settle, and 'instant' overrides the CSS smooth scroll like a native load.
	useEffect(() => {
		if (!showContent) return
		const frame = requestAnimationFrame(() => getHashTarget()?.scrollIntoView({ block: 'start', behavior: 'instant' }))
		return () => cancelAnimationFrame(frame)
	}, [showContent])

	const phase: IntroPhase = showContent ? 'revealed' : isLoading ? 'loading' : 'exiting'

	return (
		<IntroPhaseContext value={phase}>
			<noscript>
				<style>{NO_SCRIPT_CSS}</style>
			</noscript>
			{backdrop}
			<AnimatePresence onExitComplete={() => setLoaderGone(true)}>
				{isLoading && (
					<motion.div
						key="loader"
						id="intro-loader"
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: duration.loaderExit, ease: easing.smooth }}
						className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-dark-navy"
					>
						<LoadingLogo />
					</motion.div>
				)}
			</AnimatePresence>
			{/*
			 * Server-rendered so HTML-only crawlers can read it. display:none until the loader is gone keeps
			 * layout, scroll and in-view reveals inert; the key flip then remounts the tree so every
			 * mount-driven entrance animation starts exactly when the content used to mount.
			 */}
			<div
				key={showContent ? 'revealed' : 'preload'}
				id="intro-content"
				className={showContent ? 'overflow-hidden' : 'hidden'}
			>
				{children}
			</div>
		</IntroPhaseContext>
	)
}
