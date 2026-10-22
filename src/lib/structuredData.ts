import myPicture from '@/assets/images/myPicture.jpg'
import myPortfolio from './portfolioInformation'
import { siteConfig } from './site'

/** schema.org Person for the site owner — rendered on the home page. */
export const personJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Person',
	name: siteConfig.name,
	url: siteConfig.url,
	image: new URL(myPicture.src, siteConfig.url).href,
	jobTitle: siteConfig.jobTitle,
	// Profile URLs from the single source of truth (skips empty placeholders)
	sameAs: Object.values(myPortfolio.userProfile.links)
		.map(({ link }) => link)
		.filter(Boolean),
}
