'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, easing } from '@/lib'
import { usePortfolioStore } from '@/store'
import { FadeInSection, RevealItem, ScrollRevealList } from '@/components/motion'

export default function Experience() {
	const { workExperience } = usePortfolioStore()
	const [selectedIndex, setSelectedIndex] = useState(0)
	const selectedWork = workExperience[selectedIndex]!

	return (
		<FadeInSection id="jobs" className="portfolio-section max-w-[900px] min-[700px]:min-h-[625px]" isNumbered threshold={0.2} stagger={0.08}>
			<RevealItem>
				<h2 className="section-header">Where I&apos;ve Worked</h2>
			</RevealItem>
			<RevealItem>
				<div className="block min-[600px]:flex min-[600px]:justify-center min-[600px]:items-start min-[700px]:min-h-[340px]">
					{/* Tab list */}
					<div className="relative z-[3] p-0 m-0 flex overflow-x-auto w-[calc(100%+50px)] pl-[25px] -ml-[25px] mb-[30px] min-[480px]:w-[calc(100%+100px)] min-[480px]:pl-[50px] min-[480px]:-ml-[50px] min-[600px]:block min-[600px]:overflow-x-visible min-[600px]:w-max min-[600px]:pl-0 min-[600px]:ml-0">
						{workExperience.map((wE, index) => (
							<button
								key={wE.companyName}
								onClick={() => setSelectedIndex(index)}
								className={cn(
									'flex items-center justify-center text-center min-w-[120px] px-[2.25rem] h-[42px] text-xs font-mono rounded-none border-0 border-b-2 border-solid border-b-lightest-navy transition-all duration-[250ms] ease-[cubic-bezier(0.645,0.045,0.355,1)] whitespace-nowrap',
									'min-[600px]:border-b-0 min-[600px]:border-l-2 min-[600px]:border-l-lightest-navy min-[600px]:justify-start min-[600px]:w-full',
									index === selectedIndex ? 'text-green' : 'text-slate',
									'hover:bg-light-navy hover:text-green'
								)}
							>
								<span>{wE.companyName}</span>
							</button>
						))}
						{/* Highlight indicator */}
						<div
							className="job-highlight absolute top-auto bottom-0 left-0 z-10 w-full max-w-[120px] h-[2px] bg-green rounded-[4px] transition-transform duration-[250ms] ease-[cubic-bezier(0.645,0.045,0.355,1)] delay-100 ml-[25px] min-[480px]:ml-[50px] min-[600px]:top-0 min-[600px]:bottom-auto min-[600px]:w-[2px] min-[600px]:max-w-none min-[600px]:h-[42px] min-[600px]:ml-0"
							style={{ ['--tab-index' as string]: selectedIndex }}
						/>
					</div>

					{/* Work summary */}
					<AnimatePresence mode="wait">
						<motion.div
							key={selectedIndex}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.3, ease: easing.easeOut }}
							className="relative w-full min-[600px]:ml-[20px]"
						>
							<h3 className="mb-[2px] text-lg font-semibold leading-[1.3]">
								<span>{selectedWork.titleOfPosition}</span>
								<span className="text-green">
									&nbsp;@&nbsp;
									<a className="inline-link" href={selectedWork.link} target="_blank" rel="noopener noreferrer">
										{selectedWork.companyName}
									</a>
								</span>
							</h3>
							<p className="mb-[25px] text-light-slate font-mono text-xs">
								{selectedWork.timeline}
							</p>
							<ScrollRevealList
								items={selectedWork.highlights}
								className="sfx p-0 m-0 list-none text-sm leading-[1.5] min-[600px]:text-base"
								itemClassName="relative pl-[30px] mb-[10px]"
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</RevealItem>
		</FadeInSection>
	)
}
