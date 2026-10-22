import type { TargetAndTransition, Variants } from 'motion/react'

/** Concrete hidden/visible pair, so destructured states stay non-optional under noUncheckedIndexedAccess. */
type RevealVariants = { hidden: TargetAndTransition; visible: TargetAndTransition }

/**
 * Shared easing curves used across all animations.
 *
 * - Reveals/entrances  -> easeOut (fast start, gentle settle)
 * - Bidirectional UI   -> smooth  (ease-in-out, e.g. navbar hide/show)
 * - Hero first-impression -> easeOutExpo (aggressive deceleration)
 */
export const easing = {
	/** Standard ease-out for all entrance / reveal animations. */
	easeOut: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
	/** Aggressive ease-out for hero & first-impression elements. */
	easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
	/** Smooth ease-in-out for bidirectional transitions (show/hide, tab highlights). */
	smooth: [0.645, 0.045, 0.355, 1] as [number, number, number, number],
} as const

/**
 * Common animation durations in seconds.
 * Named by intent rather than value.
 */
export const duration = {
	/** Standard element transitions (0.3s). */
	normal: 0.3,
	/** Section-level reveals (0.5s). */
	slow: 0.5,
	/** Media reveals: clip-path wipes, scale (0.6s). */
	media: 0.6,
	/** Hero / first-impression animations (0.75s). */
	entrance: 0.75,
	/** How long the intro loader stays on screen before it starts exiting (3s); the loading logo times its exit from it. */
	loader: 3,
	/** Delay before page entrance animations (matches loader exit). */
	loaderExit: 0.5,
} as const

/** Fade in on the Y axis from `distance` px. */
const fadeY = (distance: number | string): RevealVariants => ({
	hidden: { opacity: 0, y: distance },
	visible: { opacity: 1, y: 0 },
})

/**
 * Reusable Motion variant objects. Each uses `hidden` / `visible` state names
 * so they pair naturally with IntersectionObserver-driven `animate` props.
 */
export const variants = {
	/** Fade in while sliding up. Distance defaults to 30px. */
	fadeUp: (distance: number | string = 30): RevealVariants => fadeY(distance),

	/** Slide in from the right edge with a subtle overshoot settle. */
	slideFromRight: {
		hidden: { opacity: 0, x: '50%' },
		visible: {
			opacity: 1,
			x: ['50%', '-2%', '0%'],
			transition: {
				x: { duration: duration.slow, ease: 'easeOut' as const, times: [0, 0.85, 1] },
				opacity: { duration: duration.normal, ease: easing.easeOut },
			},
		},
	} satisfies Variants,

	/** Slide in from the left edge with a subtle overshoot settle. */
	slideFromLeft: {
		hidden: { opacity: 0, x: '-50%' },
		visible: {
			opacity: 1,
			x: ['-50%', '2%', '0%'],
			transition: {
				x: { duration: duration.slow, ease: 'easeOut' as const, times: [0, 0.85, 1] },
				opacity: { duration: duration.normal, ease: easing.easeOut },
			},
		},
	} satisfies Variants,

	/** Scale + fade for profile images and secondary media. */
	scaleReveal: {
		hidden: { opacity: 0, scale: 1.05 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { duration: duration.media, ease: easing.easeOut },
		},
	} satisfies Variants,
} as const

/** Fade-in on the Y axis whose `visible` delay comes from Motion's `custom` prop. */
export const delayedReveal = (distance: number, dur: number): Variants => {
	const { hidden, visible } = fadeY(distance)
	return {
		hidden,
		visible: (delay: number = 0) => ({ ...visible, transition: { duration: dur, delay, ease: easing.easeOut } }),
	}
}
