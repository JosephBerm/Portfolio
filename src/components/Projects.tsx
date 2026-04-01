'use client'

import { motion } from 'motion/react'
import { usePortfolioStore } from '@/store'
import { useInViewGroup } from '@/hooks'
import { FadeInSection, RevealItem } from '@/components/motion'
import FeaturedProject from '@/components/FeaturedProject'
import ProjectImage from '@/components/ProjectImage'

export default function Projects() {
	const { featuredProjects } = usePortfolioStore()
	const { inView, getRef } = useInViewGroup(featuredProjects.length, {
		threshold: 0.5,
		mode: 'ordered',
	})

	return (
		<section
			id="projects"
			className="portfolio-section mx-auto flex flex-col py-[60px] md:py-[80px] lg:py-[100px] lg:max-w-[1000px] [counter-increment:section_1]"
			style={{ counterIncrement: 'section 1' }}
		>
			{/* Heading reveal uses base components — isolated from card list
			    to prevent section opacity from compounding with per-card IO. */}
			<FadeInSection as="div" stagger={0.08} threshold={0.1} className="!py-0">
				<RevealItem>
					<h2 className="section-header">Projects I Keep Up With</h2>
				</RevealItem>
			</FadeInSection>

			{/* Cards manage their own visibility via IO — no parent opacity wrapper. */}
			<ul className="list-none p-0 m-0 !overflow-visible">
				{featuredProjects.map((project, index) => {
					const isOdd = index % 2 === 0
					return (
						<motion.li
							key={index}
							ref={getRef(index)}
							initial="hidden"
							animate={inView[index] ? 'visible' : 'hidden'}
							className="relative grid gap-[10px] items-center grid-cols-[repeat(12,1fr)] shadow-[0_10px_30px_-15px_var(--color-navy-shadow)] mb-[30px] xs:mb-[70px] md:mb-[100px] md:shadow-none border border-light-navy md:border-none rounded-[4px] md:rounded-none"
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
