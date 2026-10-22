'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'

interface StaggerContainerProps {
	children: React.ReactNode
	className?: string
	staggerDelay?: number
}

/** Mount-triggered orchestrator: staggers its <StaggerItem>/<RevealItem> children once the hidden state has painted. */
export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) {
	const [shouldAnimate, setShouldAnimate] = useState(false)

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
			animate={shouldAnimate ? 'visible' : 'hidden'}
			variants={{ hidden: {}, visible: { transition: { staggerChildren: staggerDelay } } }}
			className={className}
		>
			{children}
		</motion.div>
	)
}
