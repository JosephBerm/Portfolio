import type { Variants } from 'motion/react'

/**
 * Shared easing curves used across all animations.
 *
 * - Reveals/entrances  -> easeOut (fast start, gentle settle)
 * - Bidirectional UI   -> smooth  (ease-in-out, e.g. navbar hide/show)
 * - Hero first-impression -> easeOutExpo (aggressive deceleration)
 * - Image/clip reveals -> imageReveal (Apple-style)
 */
export const easing = {
	/** Standard ease-out for all entrance / reveal animations. */
	easeOut: [0.0, 0.0, 0.2, 1.0] as [number, number, number, number],
	/** Aggressive ease-out for hero & first-impression elements. */
	easeOutExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
	/** Smooth ease-in-out for bidirectional transitions (show/hide, tab highlights). */
	smooth: [0.645, 0.045, 0.355, 1] as [number, number, number, number],
	/** Apple-style curve for clip-path and image reveals. */
	imageReveal: [0.77, 0, 0.175, 1] as [number, number, number, number],
} as const

/**
 * Common animation durations in seconds.
 * Named by intent rather than value.
 */
export const duration = {
	/** Micro-interactions: hover, focus (0.15s). */
	micro: 0.15,
	/** Quick state changes, toggles (0.2s). */
	fast: 0.2,
	/** Standard element transitions (0.3s). */
	normal: 0.3,
	/** Section-level reveals (0.5s). */
	slow: 0.5,
	/** Media reveals: clip-path wipes, scale (0.6s). */
	media: 0.6,
	/** Hero / first-impression animations (0.75s). */
	entrance: 0.75,
	/** Delay before page entrance animations (matches loader exit). */
	loaderExit: 0.5,
} as const

/**
 * Reusable Motion variant objects. Each uses `hidden` / `visible` state names
 * so they pair naturally with IntersectionObserver-driven `animate` props.
 */
export const variants = {
	/** Fade in while sliding up. Distance defaults to 30px. */
	fadeUp: (distance: number | string = 30): Variants => ({
		hidden: { opacity: 0, y: distance },
		visible: { opacity: 1, y: 0 },
	}),

	/** Fade in while sliding down. Distance defaults to '-25%'. */
	fadeDown: (distance: number | string = '-25%'): Variants => ({
		hidden: { opacity: 0, y: distance },
		visible: { opacity: 1, y: 0 },
	}),

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
	} as Variants,

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
	} as Variants,

	/** Clip-path directional reveal — image wipes in from one edge.
	 *  No opacity — the clip itself is the reveal mechanism. */
	clipRevealFromRight: {
		hidden: { clipPath: 'inset(0 100% 0 0)' },
		visible: {
			clipPath: 'inset(0 0% 0 0)',
			transition: { duration: duration.media, ease: easing.imageReveal },
		},
	} as Variants,

	clipRevealFromLeft: {
		hidden: { clipPath: 'inset(0 0 0 100%)' },
		visible: {
			clipPath: 'inset(0 0 0 0%)',
			transition: { duration: duration.media, ease: easing.imageReveal },
		},
	} as Variants,

	/** Scale + fade for profile images and secondary media. */
	scaleReveal: {
		hidden: { opacity: 0, scale: 1.05 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: { duration: duration.media, ease: easing.easeOut },
		},
	} as Variants,
} as const
