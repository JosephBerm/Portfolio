'use client'

import { motion } from 'motion/react'
import { useInViewGroup } from '@/hooks'
import { duration, delayedReveal } from '@/lib/animations'

interface ScrollRevealListProps {
	/** Items to render as `<li>` elements. */
	items: React.ReactNode[]
	className?: string
	itemClassName?: string
	/** List element to render. Defaults to 'ul'; use 'ol' when the order of the items carries meaning, such as steps. */
	as?: 'ul' | 'ol'
	/** IO threshold per item (0-1). Default: 0.3 */
	threshold?: number
	/** Stagger delay between sequential items (seconds). Default: 0.06 */
	stagger?: number
}

/** Fade-up distance for each bullet point. */
const BULLET_DISTANCE = 15

/** Bullet entrance variant. Each bullet's stagger delay is passed through Motion's `custom` prop. */
const bulletVariants = delayedReveal(BULLET_DISTANCE, duration.normal)

/**
 * A list (`<ul>` by default, `<ol>` via `as`) whose `<li>` children reveal individually as they scroll into view.
 * Uses ordered mode — bullet 2 waits for bullet 1 — to guarantee a
 * top-to-bottom cascade regardless of scroll speed.
 */
export default function ScrollRevealList({
	items,
	className,
	itemClassName,
	as: Component = 'ul',
	threshold = 0.3,
	stagger = 0.06,
}: ScrollRevealListProps) {
	const { inView, getRef } = useInViewGroup(items.length, {
		threshold,
		mode: 'ordered',
	})

	// role="list" keeps list semantics in Safari, which drops them from list-style: none lists
	return (
		<Component role="list" className={className}>
			{items.map((item, index) => (
				<motion.li
					key={index}
					ref={getRef(index)}
					variants={bulletVariants}
					custom={index * stagger}
					initial="hidden"
					animate={inView[index] ? 'visible' : 'hidden'}
					className={itemClassName}
				>
					{item}
				</motion.li>
			))}
		</Component>
	)
}
