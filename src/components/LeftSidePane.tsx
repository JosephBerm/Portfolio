'use client'

import { motion } from 'motion/react'
import { duration } from '@/lib'
import LinksList from '@/components/LinksList'

export default function LeftSidePane() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: duration.entrance, delay: 1.5, ease: 'easeOut' }}
			data-orientation="left"
			className="hidden md:block w-[40px] fixed bottom-0 z-10 text-light-slate left-[20px] wide:left-[40px]"
		>
			<LinksList />
		</motion.div>
	)
}
