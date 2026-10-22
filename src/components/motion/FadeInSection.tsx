'use client'

import { motion } from 'motion/react'
import { cn, easing, duration } from '@/lib'
import { NUMBERED_SECTION, SECTION_SHELL } from '@/components/styles'

/**
 * Data attributes, passed through to the rendered element. TypeScript doesn't check hyphenated JSX attributes against
 * this index signature, so an attribute whose value matters is declared on the props as well.
 */
type DataAttributes = { [name: `data-${string}`]: string | true | undefined }

interface FadeInSectionProps extends DataAttributes {
	children: React.ReactNode
	className?: string
	id?: string
	isNumbered?: boolean
	/**
	 * How far up the viewport (0-1, a fraction of its height from the bottom edge) the section's top must rise before
	 * it animates. A margin rather than a visible ratio, so sections taller than the viewport still reveal on short
	 * screens and at 400% zoom.
	 */
	threshold?: number
	/** Stagger delay between direct <RevealItem> children (seconds). */
	stagger?: number
	/** HTML element to render. Defaults to 'section'. Use 'div' when nesting
	 *  inside an existing semantic section to avoid invalid HTML. */
	as?: 'section' | 'div'
	/** Copy the home sky stays quiet behind. Only its presence counts (QUIET_SELECTOR in mountSky.ts), so `false` isn't allowed. */
	'data-sky-quiet'?: true
}

/** Section that fades in once it scrolls into view, then staggers its <RevealItem> children. */
export default function FadeInSection({ children, className, id, isNumbered = false, threshold = 0.2, stagger = 0.08, as = 'section', ...data }: FadeInSectionProps) {
	const Component = as === 'div' ? motion.div : motion.section

	return (
		<Component
			id={id}
			{...data}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: `0px 0px ${-Math.round(threshold * 100)}% 0px` }}
			variants={{
				hidden: { opacity: 0 },
				visible: {
					opacity: 1,
					transition: { duration: duration.normal, ease: easing.easeOut, when: 'beforeChildren', staggerChildren: stagger },
				},
			}}
			className={cn(SECTION_SHELL, isNumbered && NUMBERED_SECTION, className)}
		>
			{children}
		</Component>
	)
}
