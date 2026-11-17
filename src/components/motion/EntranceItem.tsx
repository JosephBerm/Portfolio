import type { CSSProperties, ReactNode } from 'react'
// By file, not '@/lib': used on the /links routes, which shouldn't pull in the barrel
import { deceleratingDelay } from '@/lib/animations'

interface EntranceItemProps {
	children: ReactNode
	className?: string
	/** Position in the cascade: later items start later, on the curve <StaggerItem> uses. */
	index: number
	/** Fade-up distance (px). Defaults to 20. */
	distance?: number
}

/**
 * Mount entrance for the /links routes: the fade-up of <StaggerItem>, done in CSS (`.entrance-item` in
 * globals.css). No client JavaScript, so it renders in Server Components and the prerendered content paints
 * with the HTML. A Motion entrance starts from an inline `opacity: 0` that only hydration lifts, which kept
 * these pages blank until their scripts had loaded and run, and for good without JavaScript.
 */
export default function EntranceItem({ children, className, index, distance = 20 }: EntranceItemProps) {
	const style = {
		'--entrance-distance': `${distance}px`,
		animationDelay: `${deceleratingDelay(index).toFixed(3)}s`,
	} as CSSProperties

	return (
		<div className={className ? `entrance-item ${className}` : 'entrance-item'} style={style}>
			{children}
		</div>
	)
}
