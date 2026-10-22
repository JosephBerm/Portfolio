import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/** tailwind-merge, taught the custom @theme keys in globals.css so text-xxs/text-heading merge as font sizes (not colors), shadow-card* as shadows and ease-smooth as an easing. Keep these lists in sync with @theme. */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			text: ['xxs', 'heading'],
			shadow: ['card', 'card-hover'],
			ease: ['smooth'],
		},
	},
})

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/** The OS reduce-motion setting as a media query; the home sky also listens to it for live changes. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** Scrolls to the element and moves focus there, as a native in-page link would, so the next Tab continues from it. */
export function smoothScrollTo(elementId: string): void {
	const element = document.getElementById(elementId)
	if (!element) return
	// No behavior: the browser uses html's scroll-behavior from globals.css (smooth, instant under reduced motion)
	element.scrollIntoView({ block: 'start' })
	// tabindex="-1" makes it focusable from script only; globals.css hides the ring this would draw on a section
	if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1')
	element.focus({ preventScroll: true })
}
