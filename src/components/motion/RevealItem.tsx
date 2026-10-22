'use client'

import { motion } from 'motion/react'
// By file, not '@/lib': also used on /links routes, which shouldn't pull in the barrel
import { easing, duration, variants } from '@/lib/animations'

type Easing = (typeof easing)[keyof typeof easing]

interface RevealItemProps {
	children: React.ReactNode
	className?: string
	/** Fade-up distance (px). Defaults to 20. */
	distance?: number
	/** Duration (seconds). Defaults to duration.normal. */
	dur?: number
	/** Easing curve. Defaults to easing.easeOut. */
	ease?: Easing
	/** When set, delays this item on a decelerating curve instead of the parent's uniform stagger. */
	index?: number
}

/** base * (1 - e^(-k*i)): early items land close together, later ones spread out — a natural wave. */
function deceleratingDelay(index: number, base = 0.6, k = 0.5): number {
	return base * (1 - Math.exp(-k * index))
}

/**
 * Fade-up child of a variant orchestrator (<FadeInSection>, <StaggerContainer>).
 * Inherits the parent's `hidden` / `visible` labels.
 */
export default function RevealItem({ children, className, distance = 20, dur = duration.normal, ease = easing.easeOut, index }: RevealItemProps) {
	const { hidden, visible } = variants.fadeUp(distance)
	const delay = index !== undefined ? deceleratingDelay(index) : undefined

	return (
		<motion.div
			variants={{ hidden, visible: { ...visible, transition: { duration: dur, ease, ...(delay !== undefined && { delay }) } } }}
			className={className}
		>
			{children}
		</motion.div>
	)
}

/** Hero / first-impression stagger child (aggressive ease-out). Pair with <StaggerContainer>. */
export function StaggerItem(props: Omit<RevealItemProps, 'ease'>) {
	return <RevealItem ease={easing.easeOutExpo} {...props} />
}
