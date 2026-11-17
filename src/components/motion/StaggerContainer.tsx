'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useIntroRevealed } from '@/hooks/useIntroPhase'

interface StaggerContainerProps {
	children: React.ReactNode
	className?: string
	staggerDelay?: number
}

/**
 * Mount-triggered orchestrator: staggers its <StaggerItem>/<RevealItem> children once their hidden state has painted
 * and, inside the home intro, once the page shows.
 */
export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) {
	const [shouldAnimate, setShouldAnimate] = useState(false)
	const revealed = useIntroRevealed()

	useEffect(() => {
		// Defer animation trigger until after the browser has painted the hidden state.
		// Without this, Motion can batch initial→animate in a single frame, skipping the animation.
		const frame = requestAnimationFrame(() => {
			setShouldAnimate(true)
		})
		return () => cancelAnimationFrame(frame)
	}, [])

	return (
		<motion.div
			initial="hidden"
			animate={shouldAnimate && revealed ? 'visible' : 'hidden'}
			variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay } } }}
			className={className}
		>
			{children}
		</motion.div>
	)
}
