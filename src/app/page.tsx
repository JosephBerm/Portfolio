'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { duration, easing } from '@/lib'
import Navbar from '@/components/Navbar'
import Introduction from '@/components/Introduction'
import AboutMe from '@/components/AboutMe'
import Experience from '@/components/Experience'
import Projects from '@/components/Projects'
import OtherProjects from '@/components/OtherProjects'
import ContactMe from '@/components/ContactMe'
import Background from '@/components/Background'
import AppFooter from '@/components/AppFooter'
import LeftSidePane from '@/components/LeftSidePane'
import RightSidePane from '@/components/RightSidePane'
import LoadingPage from '@/components/LoadingPage'

/** Pause after loader exit before page entrance animations begin (seconds). */
const POST_LOADER_PAUSE = 0.25

export default function HomePage() {
	const [isLoading, setIsLoading] = useState(true)
	const [showContent, setShowContent] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false)
		}, 3000)
		return () => clearTimeout(timer)
	}, [])

	const handleExitComplete = useCallback(() => {
		// Loader has fully exited the DOM — wait, then mount page content.
		const pause = setTimeout(() => {
			setShowContent(true)
		}, POST_LOADER_PAUSE * 1000)
		return () => clearTimeout(pause)
	}, [])

	return (
		<MotionConfig reducedMotion="never">
			<AnimatePresence onExitComplete={handleExitComplete}>
				{isLoading && (
					<motion.div
						key="loader"
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: duration.loaderExit, ease: easing.smooth }}
						className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-dark-navy"
					>
						<LoadingPage />
					</motion.div>
				)}
			</AnimatePresence>

			{showContent && (
				<div className="overflow-hidden">
					<Background />
					<Navbar />
					<LeftSidePane />
					<RightSidePane />
					<div className="z-[1] relative" id="content">
						<main className="mx-auto w-full max-w-[1600px] min-h-screen px-[25px] md:px-[100px] lg:px-[150px] sm:px-[50px]">
							<Introduction />
							<AboutMe />
							<Experience />
							<Projects />
							<OtherProjects />
							<ContactMe />
						</main>
						<AppFooter />
					</div>
				</div>
			)}
		</MotionConfig>
	)
}
