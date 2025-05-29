import React from 'react'
import ExternalLinkSVG from '@/common/ExternalLinkSVG'
import GitHubSVG from '@/common/GitHubSVG'
import { FeaturedProjectDescriptionLinkType, FeaturedProjectInfoType } from '@/services/portfolioInformation'

interface IFeaturedProjectProps {
	projectDetails: FeaturedProjectInfoType
}

function FeaturedProject({ projectDetails }: IFeaturedProjectProps) {
	const { projectLink, title, topic, technologiesUsed, githubLink, description, descriptionLinks } = projectDetails

	const getTextWithLinks = (str: string, links: FeaturedProjectDescriptionLinkType[]) => {
		let allText = str

		for (let key in links) {
			const { text, link } = links[key]
			const regex = new RegExp(text, 'g')
			allText = allText.replace(
				regex,
				`<a
					href=${link} 
					target="_blank"
					rel='noopener noreferrer'
					>
					${text}
				</a>`
			)
		}

		return <p dangerouslySetInnerHTML={{ __html: allText }} />
	}

	return (
		<div className='project-content'>
			<p className='project-overline'>{topic}</p>
			<h3 className='project-title'>
				<a
					href={projectLink}
					target='_blank'
					rel='noopener noreferrer'>
					{title}
				</a>
			</h3>
			<div className='project-description'>{getTextWithLinks(description, descriptionLinks)}</div>
			<ul className='project-tech-list'>
				{technologiesUsed.map((tech, index) => (
					<li key={index}>{tech}</li>
				))}
			</ul>
			<div className='project-links'>
				{githubLink.length !== 0 && (
					<a
						href={githubLink}
						target='_blank'
						rel='noopener noreferrer'>
						<GitHubSVG />
					</a>
				)}
				<a
					href={projectLink}
					target='_blank'
					rel='noopener noreferrer'>
					<ExternalLinkSVG />
				</a>
			</div>
		</div>
	)
}

export default FeaturedProject
