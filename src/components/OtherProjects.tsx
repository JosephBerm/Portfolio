'use client'

import { motion, type Variants } from 'motion/react'
import { usePortfolioStore } from '@/store'
import { useInViewGroup, useGridColumns } from '@/hooks'
import { easing, duration, variants } from '@/lib'
import { ExternalLinkSVG, GitHubSVG, FolderSVG } from '@/components/icons'
import { FadeInSection, RevealItem } from '@/components/motion'
import Card from '@/components/Card'

/** Per-column stagger delay (seconds) for left-to-right cascade within each row. */
const COLUMN_STAGGER = 0.1

/** Card entrance variant — reuses shared fadeDown with per-card transition config. */
const cardVariants = (delay: number): Variants => {
	const { hidden, visible } = variants.fadeDown()
	return {
		hidden: hidden as Variants['hidden'],
		visible: {
			...(visible as object),
			transition: { duration: duration.normal, delay, ease: easing.easeOut },
		},
	}
}

export default function OtherProjects() {
	const { otherProjects: projList } = usePortfolioStore()
	const { inView, getRef } = useInViewGroup(projList.length, { threshold: 0.5 })
	const { ref: gridRef, columns } = useGridColumns()

	return (
		<FadeInSection
			id="other-projects"
			className="portfolio-section md:max-w-[1000px] items-center"
			threshold={0.1}
			stagger={0.08}
		>
			<RevealItem>
				<h2 className="text-[clamp(21px,5vw,27px)] text-lightest-slate font-semibold">My Projects</h2>
			</RevealItem>
			<RevealItem>
				<a
					className="inline-link font-mono text-xs mt-[5px]"
					href="https://github.com/JosephBerm?tab=repositories"
					target="_blank"
					rel="noopener noreferrer"
				>
					view the archive
				</a>
			</RevealItem>
			<motion.ul
				ref={gridRef}
				variants={{ hidden: {}, visible: {} }}
				className="list-none p-0 mt-[50px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[15px] relative wide:gap-0 wide:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
			>
				{projList.map((proj, index) => (
					<motion.li
						key={index}
						ref={getRef(index)}
						variants={cardVariants((index % columns) * COLUMN_STAGGER)}
						initial="hidden"
						animate={inView[index] ? 'visible' : 'hidden'}
						className="relative cursor-default p-[5px] md:p-[15px] wide:p-[20px]"
					>
						<Card>
							<header>
								<div className="flex justify-between items-center mb-[25px]">
									<div className="text-green [&_svg]:w-[40px] [&_svg]:h-[40px]">
										<FolderSVG />
									</div>
									<div className="flex items-center -mr-[10px] text-light-slate">
										{proj.githubLink.length !== 0 && (
											<a href={proj.githubLink} className="flex items-center justify-center p-[5px_7px] [&_svg]:w-[20px] [&_svg]:h-[20px]" rel="noopener noreferrer" aria-label="GitHub" target="_blank">
												<GitHubSVG />
											</a>
										)}
										{proj.projectLink.length !== 0 && (
											<a href={proj.projectLink} className="flex items-center justify-center p-[5px_7px] [&_svg]:w-[22px] [&_svg]:h-[22px]" rel="noopener noreferrer" aria-label="External Link" target="_blank">
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
									<p className="text-[14px]">{proj.description}</p>
								</div>
							</header>
							<footer>
								<ul className="flex items-end grow flex-wrap p-0 mt-[20px] list-none">
									{proj.technologiesUsed.map((tech, i) => (
										<li key={i} className="font-mono text-xxs leading-[1.75] mr-[15px] last:mr-0">
											{tech}
										</li>
									))}
								</ul>
							</footer>
						</Card>
					</motion.li>
				))}
			</motion.ul>
			{projList.length > 6 && <button className="btn py-[2rem] px-[2.55rem] mt-[80px] mx-auto">Show More</button>}
		</FadeInSection>
	)
}
