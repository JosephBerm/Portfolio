'use client'

import { motion, type Variants } from 'motion/react'
import { useInViewGroup } from '@/hooks'
import { easing, duration, variants } from '@/lib'

interface ScrollRevealListProps {
	/** Items to render as `<li>` elements. */
	items: React.ReactNode[]
	className?: string
	itemClassName?: string
	/** IO threshold per item (0-1). Default: 0.3 */
	threshold?: number
	/** Stagger delay between sequential items (seconds). Default: 0.06 */
	stagger?: number
}

/** Fade-up distance for each bullet point. */
const BULLET_DISTANCE = 15

const bulletVariants = (delay: number): Variants => {
	const { hidden, visible } = variants.fadeUp(BULLET_DISTANCE)
	return {
		hidden: hidden as Variants['hidden'],
		visible: {
			...(visible as object),
			transition: {
				duration: duration.normal,
				delay,
				ease: easing.easeOut,
			},
		},
	}
}

/**
 * A `<ul>` whose `<li>` children reveal individually as they scroll into view.
 * Uses ordered mode — bullet 2 waits for bullet 1 — to guarantee a
 * top-to-bottom cascade regardless of scroll speed.
 */
export default function ScrollRevealList({
	items,
	className,
	itemClassName,
	threshold = 0.3,
	stagger = 0.06,
}: ScrollRevealListProps) {
	const { inView, getRef } = useInViewGroup(items.length, {
		threshold,
		mode: 'ordered',
	})

	return (
		<ul className={className}>
			{items.map((item, index) => (
				<motion.li
					key={index}
					ref={getRef(index)}
					variants={bulletVariants(index * stagger)}
					initial="hidden"
					animate={inView[index] ? 'visible' : 'hidden'}
					className={itemClassName}
				>
					{item}
				</motion.li>
			))}
		</ul>
	)
}
