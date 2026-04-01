import { GitHubSVG, CodePenSVG, TwitterSVG, LinkedInSVG, InstagramSVG } from '@/components/icons'
import { createElement } from 'react'

const userProfile: IUserProfile = {
	name: 'Joseph Bermudez',
	objective:
		'Full-stack software engineer with 4+ years of experience building web applications in C#/.NET and TypeScript/React. Founder of VendorX, a multi-tenant B2B ordering platform with PostgreSQL row-level security, 40+ API controllers, 100+ pages, and Stripe billing. Comfortable owning features end-to-end from database schema to deployment pipeline.',
	email: 'jcbtechs@gmail.com',
	links: {
		github: {
			name: 'GitHub',
			link: 'https://github.com/JosephBerm',
			svg: createElement(GitHubSVG),
		},
		instagram: {
			name: 'Instagram',
			link: 'https://www.instagram.com/j0edy',
			svg: createElement(InstagramSVG),
		},
		twitter: {
			name: 'Twitter',
			link: 'https://twitter.com/J0edyy',
			svg: createElement(TwitterSVG),
		},
		linkedin: {
			name: 'LinkedIn',
			link: 'https://www.linkedin.com/in/joseph-bermudez-3rd',
			svg: createElement(LinkedInSVG),
		},
		codepenLink: {
			name: 'CodePen',
			link: '',
			svg: createElement(CodePenSVG),
		},
	},
}

const workExperience: IWorkExperience[] = [
	{
		companyName: 'VendorX',
		titleOfPosition: 'Founder & Lead Engineer',
		link: 'https://vendorxpro.com',
		timeline: 'July 2024 - Present',
		highlights: [
			'Architected and built a multi-tenant white-label B2B ordering platform from zero — shipping 40+ API controllers, 253 service classes, 100+ routed pages, and 31 frontend feature modules as the sole developer.',
			'Engineered enterprise-grade tenant isolation using subdomain routing, custom middleware, and PostgreSQL row-level security policies — ensuring zero cross-tenant data leakage across every database query.',
			'Integrated QuickBooks Online, NetSuite, Stripe, and ShipStation with bidirectional OAuth sync, webhook processing, idempotency keys, and a transactional outbox pattern for automatic failure recovery.',
			'Implemented a full OAuth 2.0/OIDC auth system with OpenIddict, five-tier RBAC, MFA, SSO/SCIM via WorkOS, and admin impersonation with dedicated audit trails.',
			'Built a dynamic pricing engine supporting contract pricing, customer-specific price lists, volume-tier breaks, effective-date scheduling, and approval workflows — each line item carrying a full audit trail.',
			'Established CI/CD via GitHub Actions with ESLint zero-warning enforcement, automated route-consistency guards, and comprehensive test coverage across Playwright E2E, Vitest, and xUnit suites.',
		],
	},
	{
		companyName: 'Atlantic Coast Automotive Inc.',
		titleOfPosition: 'Software Engineer',
		link: 'https://www.linkedin.com/company/atlantic-coast-automotive-inc',
		timeline: 'April 2022 - Present',
		highlights: [
			'Build and maintain full-stack internal business applications using ASP.NET Core, SignalR, and Elasticsearch on the backend with TypeScript, Vue 3, and Pinia on the frontend — delivering real-time updates and full-text search across MySQL data stores.',
			'Integrated Azure Blob Storage for enterprise document management, replacing a legacy shared-drive workflow and eliminating file reliability issues across departments.',
			'Led implementation of two-factor authentication (2FA) and strengthened role-based access controls (RBAC) across all internal tools — improving security posture company-wide.',
			'Developed and deployed Selenium-based desktop automation scripts that eliminated several hours of repetitive manual data entry per week, directly increasing operational efficiency.',
		],
	},
]

const featuredProjects: IFeaturedProject[] = [
	{
		info: {
			title: 'ChatGPT',
			topic: 'Articial Intelligence',
			description:
				"ChatGPT made AI feel personal. Instead of clunky chatbots, you get a conversation that actually understands what you're asking. It writes code, drafts emails, explains complex topics, and learns from context — all in plain language. It's become a core part of how I build software, and it's hard to imagine working without it.",
			descriptionLinks: [
				{ text: 'actually understands', link: 'https://openai.com/index/chatgpt/' },
				{ text: 'how I build software', link: 'https://chat.openai.com/' },
			],
			technologiesUsed: ['Natural Language Processing', 'Large Language Models', 'Reinforcement Learning (RLHF)'],
			githubLink: '',
			projectLink: 'https://openai.com/blog/chatgpt',
		},
		imageDetails: {
			link: 'https://openai.com/blog/chatgpt',
			imgUrl: '/images/chatGPT.jpg',
			imgAlt: 'ChatGPT and the emergence of AI.',
		},
	},
	{
		info: {
			title: 'Full Self-Driving (FSD)',
			topic: 'Automation',
			description:
				"Tesla's FSD is teaching cars to drive themselves — not with pre-mapped routes, but by watching the road and making decisions in real time, just like a human would. Every mile driven feeds data back into the neural network, making the system smarter over time. It's one of the hardest engineering problems out there, and watching it evolve is fascinating.",
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
			imgUrl: '/images/tesla.jpg',
			imgAlt: 'Tesla Vehicles and Full Self Driving.',
		},
	},
	{
		info: {
			title: 'Starship',
			topic: 'Space Exploration',
			description:
				"Starship is SpaceX's bet on making humanity multi-planetary — and it's the largest and most powerful rocket ever built. What makes it special isn't just the size, it's that the whole thing is designed to be fully reusable. Catch a rocket booster mid-air with chopsticks? They actually did it. This is the kind of engineering ambition that keeps me inspired.",
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
			imgUrl: '/images/spaceX.jpg',
			imgAlt: 'Starship and the future of humanity.',
		},
	},
	{
		info: {
			title: 'Bitcoin',
			topic: 'Digital Currency',
			description:
				"Bitcoin started as a whitepaper and became the world's first decentralized currency — no banks, no middlemen, just people sending value to each other over the internet. It runs on a global network of nodes, secured by proof-of-work mining, and nobody controls it. Love it or not, it sparked an entire industry and changed how we think about money.",
			descriptionLinks: [
				{ text: 'whitepaper', link: 'https://bitcoin.org/bitcoin.pdf' },
				{ text: 'proof-of-work mining', link: 'https://en.bitcoin.it/wiki/Proof_of_work' },
				{ text: 'changed how we think about money', link: 'https://bitcoin.org/' },
			],
			technologiesUsed: ['C++', 'SHA-256 Proof of Work', 'Lightning Network', 'Peer-to-peer networking'],
			githubLink: 'https://github.com/bitcoin/bitcoin',
			projectLink: 'https://bitcoin.org/',
		},
		imageDetails: {
			link: 'https://bitcoin.org/',
			imgUrl: '/images/bitcoin.jpg',
			imgAlt: 'Bitcoin — the original cryptocurrency.',
		},
	},
]

const otherProjects: IOtherProject[] = [
	{
		title: 'VoltEdge Supply',
		description:
			'VoltEdge Supply is the first tenant launching on the VendorX platform — an electrical wholesale distributor built for contractors. I designed and built their entire digital storefront, quoting engine, and order management system as a white-label deployment on VendorX, giving them 24/7 self-service ordering and automated pricing governance out of the box.',
		technologiesUsed: ['Next.js 16', '.NET 10', 'PostgreSQL', 'Stripe'],
		githubLink: '',
		projectLink: 'https://voltedgesupply.com',
	},
	{
		title: 'Project 2',
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ['React', 'Express', 'TypeScript'],
		githubLink: 'https://github.com/JosephBerm',
		projectLink: 'https://github.com/JosephBerm?tab=repositories',
	},
	{
		title: 'Project 3',
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ['React', 'Express', 'TypeScript'],
		githubLink: '',
		projectLink: 'https://github.com/JosephBerm?tab=repositories',
	},
	{
		title: 'Project 4',
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ['React', 'Express', 'TypeScript'],
		githubLink: 'https://github.com/JosephBerm',
		projectLink: 'https://github.com/JosephBerm?tab=repositories',
	},
	{
		title: 'Project 5',
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ['React', 'Express', 'TypeScript'],
		githubLink: '',
		projectLink: 'https://github.com/JosephBerm?tab=repositories',
	},
	{
		title: 'Project 6',
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ['React', 'Express', 'TypeScript'],
		githubLink: 'https://github.com/JosephBerm',
		projectLink: 'https://github.com/JosephBerm?tab=repositories',
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
	objective: string
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
	imgUrl: string
	imgAlt: string
}

export type IUserProfileLinks = {
	[key: string]: {
		name: string
		link: string
		svg: React.ReactNode
	}
}

// #endregion

export default myPortfolio
