import React from 'react'
import ChatGPT from '@assets/chatGPT.jpg'
import Cardano from '@assets/cardano.jpg'
import SpaceX from '@assets/spaceX.jpg'
import Tesla from '@assets/tesla.jpg'

import GitHubSVG from '@/common/GitHubSVG'
import CodePenSVG from '@/common/CodePenSVG'
import TwitterSVG from '@/common/TwitterSVG'
import LinkedInSVG from '@/common/LinkedInSVG'
import InstagramSVG from '@/common/InstagramSVG'

const userProfile: IUserProfile = {
	name: 'Joseph Bermudez',
	objective:
		"As a software engineer, I have a deep passion for crafting one-of-a-kind digital experiences that captivate users and deliver measurable results. I thrive on working with innovative companies and products that push the boundaries of what's possible in the tech world.",
	email: 'jcbtechs@gmail.com',
	links: {
		github: {
			name: 'GitHub',
			link: 'https://github.com/JosephBerm',
			svg: React.createElement(GitHubSVG),
		},
		instagram: {
			name: 'Instagram',
			link: 'https://www.instagram.com/j0edy',
			svg: React.createElement(InstagramSVG),
		},
		twitter: {
			name: 'Twitter',
			link: 'https://twitter.com/J0edyy',
			svg: React.createElement(TwitterSVG),
		},
		linkedin: {
			name: 'LinkedIn',
			link: 'https://www.linkedin.com/in/joseph-bermudez-3rd',
			svg: React.createElement(LinkedInSVG),
		},
		codepenLink: {
			name: 'CodePen',
			link: '',
			svg: React.createElement(CodePenSVG),
		},
	},
}

const workExperience: IWorkExperience[] = [
	{
		companyName: 'ACA Inc.',
		titleOfPosition: 'Mid-Level Software Engineer',
		link: 'https://www.linkedin.com/company/atlantic-coast-automotive-inc',
		timeline: 'April 2022 - Present',
		highlights: [
			'Integrated cloud-based solutions using Azure to streamline data storage and retrieval.',
			'Utilized ASP.NET Core, SignalR, Elasticsearch, and MySQL in the back-end to achieve project goals and meet business requirements.',
			'Utilizes TypeScript, Vue 3, and Pinia in the front-end to build powerful components and efficient user web pages.',
			`Led the development and successful implementation of a robust two-factor authentication (2FA) sign-in process for the company's internal application – following ISO 27001 standards.`,
			"Created and deployed a Selenium desktop application to enhance the company's usability and efficiency of the internal web application.",
		],
	},
	{
		companyName: 'Bizzie Co.',
		titleOfPosition: 'Software Engineer Intern',
		link: 'https://bizzieco.com/',
		timeline: 'January - May 2021',
		highlights: [
			'Assisted in building, testing, debugging, and deploying the mobile application.',
			'Contributed to the development of a business application using Flutter and Firebase.',
			'Developed the application landing page using React and gained a strong understanding of hooks and their life cycles.',
			'Utilized Figma to create wireframes and diagrams, effectively communicating design concepts with the team.',
		],
	},
	// {
	// 	companyName: "N/A",
	// 	titleOfPosition: "N/A",
	// 	link: "https://iohk.io/",
	// 	timeline: "From - To YYYY",
	// 	highlights: [
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
	// 	],
	// },
]

const featuredProjects: IFeaturedProject[] = [
	{
		info: {
			title: 'ChatGPT',
			topic: 'Articial Intelligence',
			description:
				'ChatGPT revolutionizes communication with advanced AI-powered chatbots. It enables human-like interactions, adapts to conversational styles, and transforms customer support, information retrieval, and virtual assistance. Experience the future of seamless human-AI interaction.',
			descriptionLinks: [
				{
					text: 'AI-powered chatbots',
					link: 'https://www.247.ai/insights/all-about-ai-powered-chatbots',
				},
				{
					text: 'Experience the future',
					link: 'https://chat.openai.com/',
				},
			],
			technologiesUsed: [
				'TensorFlow',
				'Python',
				'Large-scale language models',
				'Natural Language Processing (NLP)',
			],
			githubLink: '',
			projectLink: 'https://openai.com/blog/chatgpt',
		},
		imageDetails: {
			link: 'https://openai.com/blog/chatgpt',
			imgUrl: ChatGPT,
			imgAlt: 'ChatGPT and the emergence of AI.',
		},
	},
	{
		info: {
			title: 'Full Self-Driving (FSD)',
			topic: 'Automation',
			description:
				"Tesla's Full Self-Driving is reshaping transportation with advanced sensors, machine learning, and real-time data. It aims to prevent accidents, optimize traffic flow, and revolutionize our commutes, making them safer, efficient, and enjoyable. This is the future of autonomous driving.",
			descriptionLinks: [
				{
					text: "Tesla's Full Self-Driving",
					link: 'https://www.tesla.com/support/autopilot',
				},
				{
					text: 'This is the future',
					link: 'https://www.notateslaapp.com/tesla-reference/1353/tesla-pioneers-the-future-how-electric-and-autonomous-cars-will-transform-car-ownership-and-transportation',
				},
			],
			technologiesUsed: ['OpenCV', 'TensorFlow', 'Python'],
			githubLink: '',
			projectLink: 'https://www.tesla.com/',
		},
		imageDetails: {
			link: 'https://www.tesla.com/',
			imgUrl: Tesla,
			imgAlt: 'Tesla Vehicles and Full Self Driving.',
		},
	},
	{
		info: {
			title: 'Starship',
			topic: 'Space Exploration',
			description:
				"Embark on an extraordinary journey as Starship opens the door to boundless possibilities of exploration and colonization beyond Earth, bringing us closer to becoming an interplanetary species. SpaceX's visionary spacecraft is set to redefine space exploration and enable the establishment of sustainable habitats in the cosmos.",
			descriptionLinks: [
				{
					text: 'colonization beyond Earth',
					link: 'https://www.spacex.com/vehicles/starship/assets/media/Starbase%20Overview.pdf',
				},
				{
					text: "SpaceX's",
					link: 'https://www.spacex.com/',
				},
			],
			technologiesUsed: ['Rocket Propulsion', 'Avionics', 'C++', 'Python'],
			githubLink: '',
			projectLink: 'https://www.spacex.com/vehicles/starship/',
		},
		imageDetails: {
			link: 'https://www.spacex.com/vehicles/starship/',
			imgUrl: SpaceX,
			imgAlt: 'Starship and the future of humanity.',
		},
	},
	{
		info: {
			title: 'Cardano',
			topic: 'Blockchain Technology',
			description:
				'Cardano is a blockchain platform pioneering a secure and sustainable ecosystem for decentralized applications. With a scientific approach, it leverages peer-reviewed research, formal verification, and a unique layered architecture to ensure scalability, interoperability, and financial inclusivity. This is the future of blockchain technology.',
			descriptionLinks: [
				{
					text: 'peer-reviewed research',
					link: 'https://iohk.io/en/research/library/',
				},
				{
					text: 'unique',
					link: 'https://emurgo.io/fibo-101-cardano-nft-energy-consumption/',
				},
				{
					text: 'This is the future',
					link: 'https://www.essentialcardano.io/',
				},
			],
			technologiesUsed: [
				'Haskell',
				'Ouroboros consensus algorithm',
				'Plutus',
				'Marlowe financial contract language',
			],
			githubLink: '',
			projectLink: 'https://www.cardano.org/',
		},
		imageDetails: {
			link: 'https://www.cardano.org/',
			imgUrl: Cardano,
			imgAlt: 'Cardano is the future.',
		},
	},
]

const otherProjects: IOtherProject[] = [
	{
		title: 'Medsource Pro',
		description:
			"At Medsource, I led the end-to-end development of a high-performance website, taking it from concept to launch. I focused on building a scalable front-end architecture, optimizing for sub-second load times, and ensuring the product aligned with business goals through close collaboration with stakeholders.",
		technologiesUsed: ['Next.js', '.NET 9', 'TypeScript', 'Zustand'],
		githubLink: '',
		projectLink: 'https://www.medsourcepro.com',
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
