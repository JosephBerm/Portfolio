import myPortfolio from './portfolioInformation'
import { MEETING_DURATION } from './scheduleConfig'
import { siteConfig, VENDORX_URL } from './site'

// Re-derive shared values from the single source of truth
const { name } = myPortfolio.userProfile
const linkedinUrl = myPortfolio.userProfile.links.linkedin?.link ?? '#'

/** Profile info displayed at the top of the links page. */
export const LINKS_PROFILE = {
	name,
	title: siteConfig.jobTitle,
} as const

/** Card variant controls visual hierarchy — hero is larger and more prominent. */
export type LinkCardVariant = 'hero' | 'secondary'

/** Card ids; LinkCard maps each one to its icon. */
export type LinkCardId = 'vendorx' | 'linkedin' | 'schedule'

export interface ILinkCard {
	id: LinkCardId
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
		description: 'Online ordering for distributors and wholesalers',
		href: VENDORX_URL,
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
		description: `Book a ${MEETING_DURATION}-minute call`,
		href: '/links/schedule',
		variant: 'secondary',
	},
]

/** The "View Full Portfolio" link at the bottom. */
export const PORTFOLIO_LINK = {
	label: 'View Full Portfolio',
	href: '/',
} as const
