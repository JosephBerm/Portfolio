'use client'

import { motion } from 'motion/react'
import { useInView } from '@/hooks'
import { usePortfolioStore } from '@/store'
import { easing, duration } from '@/lib'
import LinksList from '@/components/LinksList'

export default function AppFooter() {
	const { userProfile } = usePortfolioStore()
	const { ref, inView } = useInView({ threshold: 0.3 })

	return (
		<motion.footer
			ref={ref}
			initial={{ opacity: 0 }}
			animate={inView ? { opacity: 1 } : { opacity: 0 }}
			transition={{ duration: duration.slow, ease: easing.easeOut }}
			className="flex justify-center items-center flex-col h-auto min-h-[70px] p-[15px] text-center text-light-slate"
		>
			<div className="block w-full max-w-[270px] mx-auto mb-[10px] md:hidden">
				<div className="[&_ul]:flex-row [&_ul]:justify-between [&_ul]:items-center">
					<LinksList />
				</div>
			</div>
			<div>
				<a
					href={userProfile.links.github?.link ?? '#'}
					rel="noopener noreferrer"
					target="_blank"
					className="p-[10px] max-w-[85%] text-nowrap text-center"
				>
					<p className="text-[clamp(var(--text-xxs),5vw,var(--text-xs))] w-fit">
						Built by <br />
						{userProfile.name}
					</p>
				</a>
			</div>
		</motion.footer>
	)
}
