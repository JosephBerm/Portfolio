import myPortfolio from './portfolioInformation'

// Re-derive shared values from the single source of truth
const { name, email } = myPortfolio.userProfile
const linkedinUrl = myPortfolio.userProfile.links.linkedin?.link ?? '#'

/** Profile info displayed at the top of the links page. */
export const LINKS_PROFILE = {
	name,
	title: 'Software Engineer & Founder',
	email,
} as const

/** Card variant controls visual hierarchy — hero is larger and more prominent. */
export type LinkCardVariant = 'hero' | 'secondary'

export interface ILinkCard {
	id: string
	label: string
	description: string
	href: string
	variant: LinkCardVariant
}

/** Ordered list of link cards rendered on the /links page. */
export const LINK_CARDS: ILinkCard[] = [
	{
		id: 'vendorx',
		label: 'VendorX',
		description: 'Launch your own B2B ordering brand',
		href: 'https://vendorxpro.com',
		variant: 'hero',
	},
	{
		id: 'linkedin',
		label: 'LinkedIn',
		description: 'Connect with me',
		href: linkedinUrl,
		variant: 'secondary',
	},
	{
		id: 'schedule',
		label: "Let's Chat",
		description: 'Book a time — 60 min call',
		href: '/links/schedule',
		variant: 'secondary',
	},
]

/** The "View Full Portfolio" link at the bottom. */
export const PORTFOLIO_LINK = {
	label: 'View Full Portfolio',
	href: '/',
} as const
