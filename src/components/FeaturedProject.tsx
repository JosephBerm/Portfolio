'use client'

import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { ExternalLinkSVG, GitHubSVG } from '@/components/icons'
import { cn, variants } from '@/lib'
import type { FeaturedProjectDescriptionLinkType, FeaturedProjectInfoType } from '@/lib/portfolioInformation'
import TechList from '@/components/TechList'

interface IFeaturedProjectProps {
	projectDetails: FeaturedProjectInfoType
	isOdd: boolean
}

/** Escapes RegExp metacharacters so link text is matched literally. */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Splits `text` into plain strings and <a> nodes for each phrase in `links`. */
function linkify(text: string, links: FeaturedProjectDescriptionLinkType[]): ReactNode[] {
	if (links.length === 0) return [text]
	const pattern = new RegExp(`(${links.map((l) => escapeRegExp(l.text)).join('|')})`, 'g')
	return text.split(pattern).map((part, i) => {
		const match = links.find((l) => l.text === part)
		return match ? (
			<a key={i} href={match.link} target="_blank" rel="noopener noreferrer" className="inline-link">
				{part}
			</a>
		) : (
			part
		)
	})
}

export default function FeaturedProject({ projectDetails, isOdd }: IFeaturedProjectProps) {
	const { projectLink, title, topic, technologiesUsed, githubLink, description, descriptionLinks } = projectDetails

	// Odd cards (1st, 3rd) have content on the right, so text slides in from the right.
	// Even cards (2nd, 4th) are mirrored — content on the left, sliding from the left.
	const slideVariants = isOdd ? variants.slideFromRight : variants.slideFromLeft

	return (
		<motion.div
			variants={slideVariants}
			className={cn(
				'relative z-[5] row-[1/-1] col-span-full flex flex-col justify-center h-full xs:p-[40px_40px_30px]',
				isOdd ? 'p-[25px_25px_20px]' : 'p-[30px_25px_20px]',
				'md:block md:h-auto md:p-0 md:z-[10]',
				// wide (1080px) narrows the text column so more of the image shows beside it
				isOdd ? 'md:col-[5/-1] wide:col-[7/-1] md:text-right' : 'md:col-[1/9] wide:col-[1/7]'
			)}
		>
			<p className="m-[10px_0] font-normal text-green text-xs font-mono">{topic}</p>
			<h3 className="text-white md:text-lightest-slate md:mb-[20px] text-heading">
				<a href={projectLink} target="_blank" rel="noopener noreferrer" className="static md:relative z-[1]">
					{title}
				</a>
			</h3>
			<div className={cn(
				'py-[20px] bg-transparent relative z-[2] rounded-[4px] text-light-slate text-lg',
				'md:shadow-card md:bg-light-navy md:p-[25px] md:hover:shadow-card-hover'
			)}>
				<p className="leading-[1.4]">{linkify(description, descriptionLinks)}</p>
			</div>
			<TechList
				items={technologiesUsed}
				className={cn('relative z-[2] m-[10px_0] md:m-[25px_0_10px]', isOdd && 'md:justify-end')}
				itemClassName={cn(
					'text-xs text-lightest-slate md:text-light-slate',
					isOdd ? 'm-[0_10px_5px_0] md:m-[0_0_5px_20px]' : 'm-[0_10px_5px_0] md:m-[0_20px_5px_0]'
				)}
			/>
			<div className={cn(
				'flex items-center relative mt-[10px] -ml-[10px] text-lightest-slate w-fit md:w-auto',
				isOdd && 'md:justify-end md:ml-0 md:-mr-[10px] md:w-auto'
			)}>
				{githubLink.length !== 0 && (
					<a href={githubLink} target="_blank" rel="noopener noreferrer" aria-label={`${title} on GitHub`} className="flex items-center justify-center p-[10px] [&_svg]:w-[20px] [&_svg]:h-[20px]">
						<GitHubSVG />
					</a>
				)}
				<a href={projectLink} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title}`} className="flex items-center justify-center p-[10px] [&_svg]:w-[20px] [&_svg]:h-[20px]">
					<ExternalLinkSVG />
				</a>
			</div>
		</motion.div>
	)
}
