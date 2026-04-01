'use client'

import { motion } from 'motion/react'
import { useInView } from '@/hooks'
import { cn, easing, duration } from '@/lib'

interface FadeInSectionProps {
	children: React.ReactNode
	className?: string
	id?: string
	isNumbered?: boolean
	delay?: number
	/** How much of the section must be visible before animating (0-1). */
	threshold?: number
	/**
	 * When set, the section orchestrates its children via staggerChildren.
	 * Wrap direct children in <RevealItem> for individual fade-up reveals.
	 * Value is the stagger delay between children in seconds (e.g. 0.08).
	 */
	stagger?: number
	/** HTML element to render. Defaults to 'section'. Use 'div' when nesting
	 *  inside an existing semantic section to avoid invalid HTML. */
	as?: 'section' | 'div'
}

export default function FadeInSection({
	children,
	className,
	id,
	isNumbered = false,
	delay = 0,
	threshold = 0.2,
	stagger,
	as = 'section',
}: FadeInSectionProps) {
	const { ref, inView } = useInView({ threshold })
	const isStaggered = stagger !== undefined && stagger > 0

	const Component = as === 'div' ? motion.div : motion.section

	const sectionClasses = cn(
		'mx-auto flex flex-col py-[60px] md:py-[80px] lg:py-[100px] lg:max-w-[1000px]',
		isNumbered && '[counter-increment:section_1]',
		className
	)
	const counterStyle = isNumbered ? { counterIncrement: 'section 1' } : undefined

	// Stagger mode: section fades in, then children stagger via variant propagation.
	if (isStaggered) {
		return (
			<Component
				ref={ref}
				id={id}
				initial="hidden"
				animate={inView ? 'visible' : 'hidden'}
				variants={{
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: {
							duration: duration.normal,
							ease: easing.easeOut,
							delay,
							when: 'beforeChildren',
							staggerChildren: stagger,
						},
					},
				}}
				className={sectionClasses}
				style={counterStyle}
			>
				{children}
			</Component>
		)
	}

	// Default mode: monolithic fade + translate.
	return (
		<Component
			ref={ref}
			id={id}
			initial={{ opacity: 0, y: 30 }}
			animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
			transition={{
				duration: duration.slow,
				ease: easing.easeOut,
				delay,
			}}
			className={sectionClasses}
			style={counterStyle}
		>
			{children}
		</Component>
	)
}
