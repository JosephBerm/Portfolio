import type { StaticImageData } from 'next/image'
import { siteConfig, VENDORX_URL } from './site'
import chatGptImage from '@/assets/images/chatGPT.webp'
import teslaImage from '@/assets/images/tesla.webp'
import spaceXImage from '@/assets/images/spaceX.webp'
import bitcoinImage from '@/assets/images/bitcoin.jpg'

const userProfile: IUserProfile = {
	name: siteConfig.name,
	email: siteConfig.email,
	links: {
		github: {
			name: 'GitHub',
			link: 'https://github.com/JosephBerm',
			icon: 'github',
		},
		instagram: {
			name: 'Instagram',
			link: 'https://www.instagram.com/j0edy',
			icon: 'instagram',
		},
		twitter: {
			name: 'X (Twitter)',
			link: 'https://twitter.com/J0edyy',
			icon: 'twitter',
		},
		linkedin: {
			name: 'LinkedIn',
			link: 'https://www.linkedin.com/in/joseph-bermudez-3rd',
			icon: 'linkedin',
		},
		codepenLink: {
			name: 'CodePen',
			link: '',
			icon: 'codepen',
		},
	},
}

const workExperience: IWorkExperience[] = [
	{
		companyName: 'Relativistic Engine',
		titleOfPosition: 'Software Engineer',
		link: 'https://www.linkedin.com/company/atlantic-coast-automotive-inc',
		timeline: 'April 2022 to Present (formerly Atlantic Coast Automotive Inc.)',
		highlights: [
			'Built and own the accounting platform that turns car sales and leases at 100+ dealerships into balanced entries in their official books, from its first prototype in 2023 to today.',
			"Led the move of the company's dealership software to Vue 3 and TypeScript, wrote custom automated rules that enforce how its code is structured, and upgraded its desktop app to .NET 8.",
			"Redesigned the refund math after real data showed 18.65% of cancellations late in a warranty contract were stuck because the refund didn't match the books. Cut that to zero, verified across 1,000,000+ simulated cases.",
			'Replaced hand-matching of vendor statements with a tool that reads PDFs and spreadsheets, matches hundreds of rows to the right deals and records the entries in one click. It now saves accountants hours every week.',
			"Stopped sales from being booked twice when a transfer to the dealerships' books fails partway and the receiving system cannot be asked what arrived. The deal now stays locked until an accountant signs off.",
			"Cut the deals page's start-up time from over 3 seconds to under 10 milliseconds, ended freezes on large deals, and made switching dealerships in the accounting screens take about 70% less time.",
			'Built the rules engine that decides how each deal is recorded. A rule change updates pending entries in one save instead of row by row, and repairs to live data run as a preview first.',
			'Moved permission checks to the server, so staff see only their approved dealerships and locked accounts lose access within seconds. Built a View As mode that lets testers act as any employee without messaging real customers.',
			"Wrote the plan for reports that would show our CEO, CFO and CTO what's holding up each dealership's month-end close and what waiting on lender payments costs in interest. The research found 39 hidden bugs.",
		],
	},
	{
		companyName: 'VendorX',
		titleOfPosition: 'Founder & Lead Engineer',
		link: VENDORX_URL,
		timeline: 'July 2024 to Present',
		highlights: [
			'Designed and built the platform, including the online store buyers shop from and the tools each business uses to manage quotes and orders.',
			'Signed our first customer, a distributor whose store goes live in early 2027.',
			'Created pricing controls that give each buyer their own contract prices and volume discounts, with a record of how every price was calculated and changed.',
			"Connected the platform to Stripe for payments, QuickBooks for accounting, and ShipStation for shipping, so businesses don't have to jump between systems.",
			"Developed secure sign-in with two-factor authentication, single sign-on, and permissions based on each person's role. Each business's prices and orders stay completely separate from every other business.",
			'Grew the platform to roughly 150 screens ahead of launch, backed by about 430,000 lines of automated tests.',
			"Wrote the coding standards, specs and automated checks that AI coding agents work within, and built the custom tools that give them the project's context.",
		],
	},
]

const featuredProjects: IFeaturedProject[] = [
	{
		info: {
			title: 'ChatGPT',
			topic: 'Artificial Intelligence',
			description:
				"ChatGPT made AI feel personal. Instead of a clunky chatbot, you get a conversation that actually understands what you're asking. It can write code, draft an email, or walk you through a hard topic in plain language.",
			descriptionLinks: [{ text: 'actually understands', link: 'https://openai.com/index/chatgpt/' }],
			technologiesUsed: ['Natural Language Processing', 'Large Language Models', 'Reinforcement Learning from Human Feedback'],
			githubLink: '',
			projectLink: 'https://openai.com/blog/chatgpt',
		},
		imageDetails: {
			link: 'https://openai.com/blog/chatgpt',
			imgSrc: chatGptImage,
			imgAlt: 'The ChatGPT and OpenAI logos beside a glowing digital brain above a robotic hand.',
		},
	},
	{
		info: {
			title: 'Starship',
			topic: 'Space Exploration',
			description:
				"Starship is SpaceX's bet on making humanity multi-planetary, and it's the largest and most powerful rocket ever built. It's also designed to be fully reusable. SpaceX has already caught the returning booster with the launch tower's mechanical arms, which I still find hard to believe.",
			descriptionLinks: [
				{ text: "SpaceX's", link: 'https://www.spacex.com/' },
				{ text: 'fully reusable', link: 'https://www.spacex.com/vehicles/starship/' },
			],
			technologiesUsed: ['Rocket Propulsion', 'Avionics', 'C++', 'Python'],
			githubLink: '',
			projectLink: 'https://www.spacex.com/vehicles/starship/',
		},
		imageDetails: {
			link: 'https://www.spacex.com/vehicles/starship/',
			imgSrc: spaceXImage,
			imgAlt: 'SpaceX logo above a long-exposure photo of a rocket launch arcing across the night sky.',
		},
	},
	{
		info: {
			title: 'Bitcoin',
			topic: 'Digital Currency',
			description:
				"Bitcoin started as a whitepaper and became the world's first decentralized currency, letting people send value to each other over the internet without a bank in the middle. It runs on a global network of computers, secured by proof-of-work mining, and no single party controls it. Whatever you think of it, it launched an entire industry and changed how we think about money.",
			descriptionLinks: [
				{ text: 'whitepaper', link: 'https://bitcoin.org/bitcoin.pdf' },
				{ text: 'proof-of-work mining', link: 'https://en.bitcoin.it/wiki/Proof_of_work' },
				{ text: 'changed how we think about money', link: 'https://bitcoin.org/' },
			],
			technologiesUsed: ['C++', 'SHA-256 Proof-of-Work', 'Lightning Network', 'Peer-to-Peer Networking'],
			githubLink: 'https://github.com/bitcoin/bitcoin',
			projectLink: 'https://bitcoin.org/',
		},
		imageDetails: {
			link: 'https://bitcoin.org/',
			imgSrc: bitcoinImage,
			imgAlt: 'A gold Bitcoin coin standing beside a stack of coins, with a blue market chart behind it.',
		},
	},
	{
		info: {
			title: 'Full Self-Driving (FSD)',
			topic: 'Automation',
			description:
				"Tesla's FSD is teaching cars to drive themselves by reading the road and making decisions in real time, instead of following pre-mapped routes. Driving data from the fleet feeds back into the neural network, so the system keeps getting better. It's one of the hardest problems in engineering, and I find it fascinating to follow.",
			descriptionLinks: [
				{ text: "Tesla's FSD", link: 'https://www.tesla.com/support/autopilot' },
				{ text: 'neural network', link: 'https://www.tesla.com/AI' },
			],
			technologiesUsed: ['Neural Networks', 'Computer Vision', 'C++', 'Python'],
			githubLink: '',
			projectLink: 'https://www.tesla.com/',
		},
		imageDetails: {
			link: 'https://www.tesla.com/',
			imgSrc: teslaImage,
			imgAlt: 'A Tesla Model X with its falcon-wing doors open on a country road at sunset.',
		},
	},
]

const otherProjects: IOtherProject[] = [
	{
		title: 'VendorX',
		description:
			'Online ordering software for distributors and wholesalers, mainly in electrical supply and open to other industries. Each business gets its own branded store where customers can request quotes and order any time instead of calling, faxing, or emailing. Pricing, payments, accounting, and shipping are handled in one place. Our first customer, a distributor, goes live in early 2027.',
		technologiesUsed: ['Next.js 16', '.NET 10', 'PostgreSQL', 'Stripe'],
		githubLink: '',
		projectLink: VENDORX_URL,
	},
]

const myPortfolio: IMyPortfolio = {
	workExperience,
	userProfile,
	featuredProjects,
	otherProjects,
}

// #region Interfaces

export interface IMyPortfolio {
	workExperience: IWorkExperience[]
	userProfile: IUserProfile
	featuredProjects: IFeaturedProject[]
	otherProjects: IOtherProject[]
}

export interface IUserProfile {
	name: string
	email: string
	links: IUserProfileLinks
}

export interface IWorkExperience {
	companyName: string
	titleOfPosition: string
	link: string
	timeline: string
	highlights: string[]
}

export interface IFeaturedProject {
	info: FeaturedProjectInfoType
	imageDetails: FeaturedProjectImageDetailsType
}

export interface IOtherProject {
	title: string
	description: string
	technologiesUsed: string[]
	githubLink: string
	projectLink: string
}

// #endregion

// #region Types

export type FeaturedProjectInfoType = {
	title: string
	topic: string
	description: string
	descriptionLinks: FeaturedProjectDescriptionLinkType[]
	technologiesUsed: string[]
	githubLink: string
	projectLink: string
}

export type FeaturedProjectDescriptionLinkType = {
	text: string
	link: string
}

export type FeaturedProjectImageDetailsType = {
	link: string
	imgSrc: StaticImageData
	imgAlt: string
}

/** Icon keys for profile links; the component layer maps each key to its SVG. */
export type SocialIcon = 'github' | 'instagram' | 'twitter' | 'linkedin' | 'codepen'

export type IUserProfileLinks = {
	[key: string]: {
		name: string
		link: string
		icon: SocialIcon
	}
}

// #endregion

export default myPortfolio
