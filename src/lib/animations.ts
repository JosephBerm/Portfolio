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
} as const

/**
 * The home intro, in seconds. LoadingLogo hands the mark's times to IntroGate.module.css as custom properties, and
 * IntroGate the loader's fade; IntroGate's script times the rest. The mark's entry plays in CSS from the first paint, and
 * the loader lifts once that entry has played and held (the floor) and the page is ready, waiting for the page no later
 * than `ceiling` after it could first be seen.
 */
export const intro = {
	/** The hexagon's trace. */
	draw: 1.6,
	/** The J starts to fade in just after the trace closes. */
	letterDelay: 1.73,
	/** The J's fade. */
	letter: 0.4,
	/** The whole mark holds still this long once the J has landed, before it may leave. */
	hold: 0.62,
	/** The mark shrinks away (fades, under reduced motion). */
	markOut: duration.normal,
	/** The mark starts to leave this long before the loader fades and the stars come out. */
	exitLead: 0.25,
	/** The loader's fade. */
	fade: 0.5,
	/** Between the loader leaving and the page's entrances. */
	pause: 0.25,
	/** The latest, after the page could first be seen (navigation start, a prerendered page's activation, or the first showing of a tab opened in the background), that the intro waits for the page to be ready; its floor still plays in full. */
	ceiling: 5,
} as const

/**
 * Start delay (seconds) of item `index` in an entrance cascade: base * (1 - e^(-k*i)). Early items land close
 * together and later ones spread out, a natural wave. Shared by Motion's <RevealItem> and the CSS <EntranceItem>.
 */
export function deceleratingDelay(index: number, base = 0.6, k = 0.5): number {
	return base * (1 - Math.exp(-k * index))
}

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
