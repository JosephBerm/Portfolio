import type { ComponentType } from 'react'
import { CodePenSVG, GitHubSVG, InstagramSVG, LinkedInSVG, TwitterSVG } from '@/components/icons'
import myPortfolio, { type SocialIcon } from '@/lib/portfolioInformation'

/** Maps profile-link icon keys to their SVGs, keeping presentation out of the data layer (same pattern as LinkCard). */
const SOCIAL_ICONS: Record<SocialIcon, ComponentType> = {
	github: GitHubSVG,
	instagram: InstagramSVG,
	twitter: TwitterSVG,
	linkedin: LinkedInSVG,
	codepen: CodePenSVG,
}

// Skip links without a URL, as FeaturedProject/OtherProjects already do
const profileLinks = Object.entries(myPortfolio.userProfile.links).filter(([, site]) => site.link)

export default function LinksList() {
	// role="list" keeps list semantics in Safari, which drops them from list-style: none lists
	return (
		<ul role="list" className="flex flex-col items-center">
			{profileLinks.map(([key, site]) => {
				const Icon = SOCIAL_ICONS[site.icon]
				return (
					<li key={key}>
						<a
							href={site.link}
							aria-label={site.name}
							rel="noopener noreferrer"
							target="_blank"
							title={site.name}
							className="p-[10px] block [&_svg]:w-[20px] [&_svg]:h-[20px] motion-safe:hover:-translate-y-[3px] motion-safe:focus:-translate-y-[3px] transition-transform duration-250"
						>
							<Icon />
						</a>
					</li>
				)
			})}
		</ul>
	)
}
