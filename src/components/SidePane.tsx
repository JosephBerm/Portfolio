'use client'

import { motion } from 'motion/react'
import { cn, duration } from '@/lib'
import { useIntroRevealed } from '@/hooks/useIntroPhase'

/** Edge-specific placement for each rail. */
const SIDE_CLASSES = {
	left: 'left-[20px] wide:left-[40px]',
	right: 'right-[20px]',
} as const

interface SidePaneProps {
	side: keyof typeof SIDE_CLASSES
	/** A control above the rail's content that stays on screen while the page's content is hidden (the Hide/View control). */
	control?: React.ReactNode
	children: React.ReactNode
}

/** The 90px vertical rule under each rail's content. */
const RAIL_LINE = "after:content-[''] after:block after:w-px after:h-[90px] after:mx-auto after:bg-light-slate"

/** Fixed desktop-only rail on the left or right edge; fades in after the hero entrance, which starts when the page shows. */
export default function SidePane({ side, control, children }: SidePaneProps) {
	const revealed = useIntroRevealed()
	return (
		// data-sky-quiet: the home sky keeps bright stars clear of the rail's links and its control, and no sky event ever lights them
		<motion.div
			data-sky-quiet
			initial={{ opacity: 0 }}
			animate={{ opacity: revealed ? 1 : 0 }}
			transition={{ duration: duration.entrance, delay: 1.5, ease: 'easeOut' }}
			data-orientation={side}
			className={cn('hidden md:flex flex-col items-center w-[40px] fixed bottom-0 z-10 text-light-slate', SIDE_CLASSES[side])}
		>
			{control}
			{/* data-sky-hide: the Hide/View control hides the rail's copy and line, never the control above them */}
			<div data-sky-hide className={cn('flex flex-col items-center', RAIL_LINE)}>
				{children}
			</div>
		</motion.div>
	)
}
