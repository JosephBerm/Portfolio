'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { easing, duration } from '@/lib'

interface StaggerContainerProps {
	children: React.ReactNode
	className?: string
	staggerDelay?: number
	/** Initial delay before the first child starts (seconds). */
	delay?: number
	style?: React.CSSProperties
}

export function StaggerContainer({ children, className, staggerDelay = 0.1, delay = 0, style }: StaggerContainerProps) {
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
			variants={{
				hidden: {},
				visible: {
					transition: {
						delayChildren: delay,
						staggerChildren: staggerDelay,
					},
				},
			}}
			className={className}
			style={style}
		>
			{children}
		</motion.div>
	)
}

/**
 * Decelerating stagger helper — returns a delay that starts fast and slows down.
 * Creates a natural "wave" rather than a mechanical uniform cascade.
 *
 * Formula: base * (1 - e^(-k*i)) where k controls the curve steepness.
 * i=0 gets ~0, early items are close together, later items spread out.
 */
function deceleratingDelay(index: number, base: number = 0.6, k: number = 0.5): number {
	return base * (1 - Math.exp(-k * index))
}

export function StaggerItem({
	children,
	className,
	index,
	distance = 20,
	dur = duration.normal,
}: {
	children: React.ReactNode
	className?: string
	/** When provided, uses decelerating delay instead of uniform stagger. */
	index?: number
	/** Fade-up distance in px. Default: 20. */
	distance?: number
	/** Animation duration in seconds. Default: duration.normal (0.3s). */
	dur?: number
}) {
	const customDelay = index !== undefined ? deceleratingDelay(index) : undefined

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: distance },
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: dur,
						ease: easing.easeOutExpo,
						...(customDelay !== undefined && { delay: customDelay }),
					},
				},
			}}
			className={className}
		>
			{children}
		</motion.div>
	)
}
