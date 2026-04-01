'use client'

import { motion } from 'motion/react'
import { duration } from '@/lib'
import { usePortfolioStore } from '@/store'

export default function RightSidePane() {
	const { userProfile } = usePortfolioStore()
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: duration.entrance, delay: 1.5, ease: 'easeOut' }}
			data-orientation="right"
			className="hidden md:block w-[40px] fixed bottom-0 z-10 text-light-slate right-[20px]"
		>
			<div className="flex flex-col items-center relative after:content-[''] after:block after:w-px after:h-[90px] after:mx-auto after:bg-light-slate">
				<a
					href={`mailto:${userProfile.email}`}
					className="my-[20px] mx-auto p-[10px] font-mono text-xxs leading-lg tracking-[0.2em] [writing-mode:vertical-rl]"
				>
					{userProfile.email}
				</a>
			</div>
		</motion.div>
	)
}
