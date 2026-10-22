'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib'
import myPortfolio from '@/lib/portfolioInformation'
import { useInViewGroup } from '@/hooks'
import { FadeInSection, RevealItem } from '@/components/motion'
import { NUMBERED_SECTION, SECTION_SHELL } from '@/components/styles'
import FeaturedProject from '@/components/FeaturedProject'
import ProjectImage from '@/components/ProjectImage'

const { featuredProjects } = myPortfolio

export default function Projects() {
	// Trigger on the card's top edge crossing 80% of the viewport, as OtherProjects does: a card taller than twice the
	// viewport (short landscape screens, 400% zoom) can never be 50% visible, and ordered mode would then hold back every later card.
	const { inView, getRef } = useInViewGroup(featuredProjects.length, {
		threshold: 0,
		rootMargin: '0px 0px -20% 0px',
		mode: 'ordered',
	})

	return (
		<section
			id="projects"
			className={cn(SECTION_SHELL, NUMBERED_SECTION)}
		>
			{/* Heading reveal uses base components — isolated from card list
			    to prevent section opacity from compounding with per-card IO. */}
			<FadeInSection as="div" threshold={0.1} className="!py-0">
				<RevealItem>
					<h2 className="section-header">Projects I Keep Up With</h2>
				</RevealItem>
			</FadeInSection>

			{/* Cards manage their own visibility via IO — no parent opacity wrapper. */}
			<ul role="list" className="!overflow-visible">
				{featuredProjects.map((project, index) => {
					const isOdd = index % 2 === 0
					return (
						<motion.li
							key={index}
							ref={getRef(index)}
							initial="hidden"
							animate={inView[index] ? 'visible' : 'hidden'}
							className="relative grid gap-[10px] items-center grid-cols-[repeat(12,1fr)] shadow-card mb-[30px] xs:mb-[70px] md:mb-[100px] md:shadow-none border border-light-navy md:border-none rounded-[4px] md:rounded-none"
						>
							<FeaturedProject projectDetails={project.info} isOdd={isOdd} />
							<ProjectImage imageDetails={project.imageDetails} isOdd={isOdd} />
						</motion.li>
					)
				})}
			</ul>
		</section>
	)
}
