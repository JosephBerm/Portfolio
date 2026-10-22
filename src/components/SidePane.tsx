import { div as MotionDiv } from 'motion/react-client'
import { cn, duration } from '@/lib'

/** Edge-specific placement for each rail. */
const SIDE_CLASSES = {
	left: 'left-[20px] wide:left-[40px]',
	right: 'right-[20px]',
} as const

interface SidePaneProps {
	side: keyof typeof SIDE_CLASSES
	children: React.ReactNode
}

/** The 90px vertical rule under each rail's content. */
const RAIL_LINE = "after:content-[''] after:block after:w-px after:h-[90px] after:mx-auto after:bg-light-slate"

/** Fixed desktop-only rail on the left or right edge; fades in after the hero entrance. */
export default function SidePane({ side, children }: SidePaneProps) {
	return (
		// data-sky-quiet: the home sky keeps bright stars clear of the rail's links, and shooting stars only fade out behind them
		<MotionDiv
			data-sky-quiet
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: duration.entrance, delay: 1.5, ease: 'easeOut' }}
			data-orientation={side}
			className={cn('hidden md:flex flex-col items-center w-[40px] fixed bottom-0 z-10 text-light-slate', RAIL_LINE, SIDE_CLASSES[side])}
		>
			{children}
		</MotionDiv>
	)
}
