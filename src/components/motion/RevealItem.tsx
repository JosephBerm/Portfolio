'use client'

import { motion } from 'motion/react'
import { easing, duration } from '@/lib'

interface RevealItemProps {
	children: React.ReactNode
	className?: string
	/** Override the default fade-up distance (px). Defaults to 20. */
	distance?: number
	/** Override the default duration (seconds). */
	dur?: number
}

/**
 * Stagger child — use inside a <FadeInSection stagger={n}> for choreographed reveals.
 * Inherits `hidden` / `visible` variant names from the parent orchestrator.
 */
export default function RevealItem({
	children,
	className,
	distance = 20,
	dur = duration.normal,
}: RevealItemProps) {
	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: distance },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: dur,
						ease: easing.easeOut,
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	)
}
