'use client'

import { motion } from 'motion/react'
import myPortfolio from '@/lib/portfolioInformation'
import { useInViewGroup, useGridColumns } from '@/hooks'
import { cn, delayedReveal, duration } from '@/lib'
import { ExternalLinkSVG, GitHubSVG, FolderSVG } from '@/components/icons'
import { FadeInSection, RevealItem } from '@/components/motion'
import Card from '@/components/Card'
import TechList from '@/components/TechList'

/** Per-column stagger delay (seconds) for left-to-right cascade within each row. */
const COLUMN_STAGGER = 0.1

/** Widest a single card column gets (px), matching the 3-column desktop layout. */
const CARD_MAX_WIDTH = 340

/** Card entrance variant (drops in from -30px). The per-card column delay is passed through Motion's `custom` prop. */
const cardVariants = delayedReveal(-30, duration.slow)

const { otherProjects: projList } = myPortfolio

export default function OtherProjects() {
	// Trigger on the card's top edge crossing 80% of the viewport, so tall cards on short screens still reveal.
	const { inView, getRef, reveal } = useInViewGroup(projList.length, { threshold: 0, rootMargin: '0px 0px -20% 0px' })
	const { ref: gridRef, columns } = useGridColumns()

	return (
		<FadeInSection
			id="other-projects"
			className="md:max-w-[1000px] items-center"
			threshold={0.1}
		>
			<RevealItem>
				<h2 className="text-heading text-lightest-slate font-semibold">My Projects</h2>
			</RevealItem>
			<RevealItem>
				<a
					className="inline-link font-mono text-xs mt-[5px]"
					href="https://github.com/JosephBerm?tab=repositories"
					target="_blank"
					rel="noopener noreferrer"
				>
					view more on GitHub
				</a>
			</RevealItem>
			{/* Container query: equal-height rows only once the grid has 2+ columns (2 x 250px + 15px gap). */}
			<div className="@container w-full mt-[50px]">
				{/* overflow-visible overrides the base ul rule so first-row cards aren't clipped while dropping in. */}
				<ul
					ref={gridRef}
					role="list"
					className="mx-auto overflow-visible grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] @min-[515px]:auto-rows-fr gap-[15px] relative wide:gap-0 wide:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
					// Cap the grid at one card-width per project so a short list stays centered under the heading.
					style={{ maxWidth: projList.length * CARD_MAX_WIDTH }}
				>
					{projList.map((proj, index) => (
						<motion.li
							key={proj.title}
							ref={getRef(index)}
							variants={cardVariants}
							custom={(index % columns) * COLUMN_STAGGER}
							initial="hidden"
							animate={inView[index] ? 'visible' : 'hidden'}
							onFocus={() => reveal(index)}
							className={cn(
								'relative cursor-default p-[5px] md:p-[15px] wide:p-[20px]',
								!inView[index] && 'pointer-events-none'
							)}
						>
							<Card>
								<header>
									<div className="flex justify-between items-center mb-[25px]">
										<div className="text-green [&_svg]:w-[40px] [&_svg]:h-[40px]">
											<FolderSVG />
										</div>
										{/* relative z-[1] lifts the icon links above the title's full-card click overlay. */}
										<div className="flex items-center -mr-[10px] text-light-slate">
											{proj.githubLink.length !== 0 && (
												<a href={proj.githubLink} className="relative z-[1] flex items-center justify-center p-[5px_7px] [&_svg]:w-[20px] [&_svg]:h-[20px]" rel="noopener noreferrer" aria-label={`${proj.title} on GitHub`} target="_blank">
													<GitHubSVG />
												</a>
											)}
											{proj.projectLink.length !== 0 && (
												<a href={proj.projectLink} className="relative z-[1] flex items-center justify-center p-[5px_7px] [&_svg]:w-[22px] [&_svg]:h-[22px]" rel="noopener noreferrer" aria-label={`Open ${proj.title}`} target="_blank">
													<ExternalLinkSVG />
												</a>
											)}
										</div>
									</div>
									<h3 className="m-0 mb-[10px] text-lightest-slate text-xl leading-[1.3]">
										<a href={proj.projectLink} target="_blank" rel="noopener noreferrer" className="static before:content-[''] before:block before:absolute before:z-0 before:w-full before:h-full before:top-0 before:left-0">
											{proj.title}
										</a>
									</h3>
									<div className="text-light-slate">
										<p className="text-[14px] text-pretty">{proj.description}</p>
									</div>
								</header>
								<footer>
									<TechList items={proj.technologiesUsed} className="items-end grow mt-[20px]" itemClassName="text-xxs leading-[1.75] mr-[15px] last:mr-0" />
								</footer>
							</Card>
						</motion.li>
					))}
				</ul>
			</div>
		</FadeInSection>
	)
}
