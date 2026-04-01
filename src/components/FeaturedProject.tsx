'use client'

import { motion } from 'motion/react'
import { ExternalLinkSVG, GitHubSVG } from '@/components/icons'
import { cn, variants } from '@/lib'
import type { FeaturedProjectDescriptionLinkType, FeaturedProjectInfoType } from '@/lib'

interface IFeaturedProjectProps {
	projectDetails: FeaturedProjectInfoType
	isOdd: boolean
}

export default function FeaturedProject({ projectDetails, isOdd }: IFeaturedProjectProps) {
	const { projectLink, title, topic, technologiesUsed, githubLink, description, descriptionLinks } = projectDetails

	const getTextWithLinks = (str: string, links: FeaturedProjectDescriptionLinkType[]) => {
		let allText = str
		for (const key in links) {
			const { text, link } = links[key]!
			const regex = new RegExp(text, 'g')
			allText = allText.replace(
				regex,
				`<a href="${link}" target="_blank" rel="noopener noreferrer" class="inline-link">${text}</a>`
			)
		}
		return <p className="leading-[1.4]" dangerouslySetInnerHTML={{ __html: allText }} />
	}

	// Odd cards (1st, 3rd) have content on the right, so text slides in from the right.
	// Even cards (2nd, 4th) are mirrored — content on the left, sliding from the left.
	const slideVariants = isOdd ? variants.slideFromRight : variants.slideFromLeft

	return (
		<motion.div
			variants={slideVariants}
			className={cn(
				'relative z-[5] row-[1/-1] col-span-full flex flex-col justify-center h-full xs:p-[40px_40px_30px]',
				isOdd ? 'p-[25px_25px_20px]' : 'p-[30px_25px_20px]',
				'md:block md:h-auto md:col-[1/9] md:p-0 md:z-[10]',
				isOdd && 'md:col-[5/-1] md:text-right'
			)}
		>
			<p className="m-[10px_0] font-normal text-green text-xs font-mono">{topic}</p>
			<h3 className="text-white md:text-lightest-slate md:mb-[20px] text-[clamp(21px,5vw,27px)]">
				<a href={projectLink} target="_blank" rel="noopener noreferrer" className="static md:relative z-[1]">
					{title}
				</a>
			</h3>
			<div className={cn(
				'py-[20px] bg-transparent relative z-[2] rounded text-light-slate text-lg',
				'md:shadow-[0_10px_30px_-15px_rgba(2,12,27,0.7)] md:bg-light-navy md:p-[25px] md:hover:shadow-[0_20px_30px_-15px_rgba(2,12,27,0.7)]'
			)}>
				{getTextWithLinks(description, descriptionLinks)}
			</div>
			<ul className={cn(
				'flex flex-wrap relative z-[2] p-0 list-none m-[10px_0] md:m-[25px_0_10px]',
				isOdd ? 'justify-start md:justify-end' : 'justify-start'
			)}>
				{technologiesUsed.map((tech, index) => (
					<li key={index} className={cn(
						'text-lightest-slate font-mono text-xs whitespace-nowrap md:text-light-slate',
						isOdd ? 'm-[0_10px_5px_0] md:m-[0_0_5px_20px]' : 'm-[0_10px_5px_0] md:m-[0_20px_5px_0]'
					)}>
						{tech}
					</li>
				))}
			</ul>
			<div className={cn(
				'flex items-center relative mt-[10px] -ml-[10px] text-lightest-slate w-fit md:w-auto',
				isOdd && 'md:justify-end md:ml-0 md:-mr-[10px] md:w-auto'
			)}>
				{githubLink.length !== 0 && (
					<a href={githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-[10px] [&_svg]:w-[20px] [&_svg]:h-[20px]">
						<GitHubSVG />
					</a>
				)}
				<a href={projectLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-[10px] [&_svg]:w-[20px] [&_svg]:h-[20px]">
					<ExternalLinkSVG />
				</a>
			</div>
		</motion.div>
	)
}
