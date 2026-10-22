'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn, duration, easing } from '@/lib'
import myPortfolio from '@/lib/portfolioInformation'
import { FadeInSection, RevealItem, ScrollRevealList } from '@/components/motion'
import { BODY_TEXT } from '@/components/styles'

const { workExperience } = myPortfolio

export default function Experience() {
	const [selectedIndex, setSelectedIndex] = useState(0)
	const selectedWork = workExperience[selectedIndex]!

	return (
		<FadeInSection id="jobs" className="min-[700px]:min-h-[625px]" isNumbered>
			<RevealItem>
				<h2 className="section-header">Where I&apos;ve Worked</h2>
			</RevealItem>
			<RevealItem>
				<div className="block min-[600px]:flex min-[600px]:justify-center min-[600px]:items-start min-[700px]:min-h-[340px]">
					{/* Tab list. --tab-h is one tab's height, shared by the buttons and the 600px+ indicator */}
					<div className="relative z-[3] [--tab-h:42px] p-0 m-0 flex overflow-x-auto w-[calc(100%+50px)] pl-[25px] -ml-[25px] mb-[30px] min-[600px]:block min-[600px]:overflow-x-visible min-[600px]:w-max min-[600px]:pl-0 min-[600px]:ml-0">
						{workExperience.map((wE, index) => (
							<button
								key={wE.companyName}
								onClick={() => setSelectedIndex(index)}
								aria-pressed={index === selectedIndex}
								className={cn(
									'flex items-center justify-center text-center min-w-[120px] px-[2.25rem] h-(--tab-h) text-xs font-mono rounded-none border-0 border-b-2 border-solid border-b-lightest-navy transition-all duration-250 ease-smooth whitespace-nowrap',
									'min-[600px]:border-b-0 min-[600px]:border-l-2 min-[600px]:border-l-lightest-navy min-[600px]:justify-start min-[600px]:w-full',
									// Below 600px the selected tab's own bottom border is the indicator (tab widths vary).
									index === selectedIndex ? 'text-green border-b-green' : 'text-slate',
									'hover:bg-light-navy hover:text-green',
									// Below 600px the strip scrolls and would clip an outside ring, so draw it inside the button
									'max-[600px]:focus-visible:-outline-offset-4'
								)}
							>
								<span>{wE.companyName}</span>
							</button>
						))}
						{/* Highlight indicator (600px and up, where every tab is --tab-h tall): moves down one tab height per index */}
						<div
							className="hidden min-[600px]:block absolute top-0 left-0 z-10 w-[2px] h-(--tab-h) translate-y-[calc(var(--tab-index)*var(--tab-h))] bg-green rounded-[4px] transition-transform motion-reduce:transition-none duration-250 ease-smooth delay-100"
							style={{ '--tab-index': selectedIndex } as React.CSSProperties}
						/>
					</div>

					{/* Work summary */}
					<AnimatePresence mode="wait">
						<motion.div
							key={selectedIndex}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: duration.normal, ease: easing.easeOut }}
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
								className={cn('sfx', BODY_TEXT)}
								itemClassName="relative pl-[30px] mb-[10px] [&::before]:top-[2px]"
							/>
						</motion.div>
					</AnimatePresence>
				</div>
			</RevealItem>
		</FadeInSection>
	)
}
