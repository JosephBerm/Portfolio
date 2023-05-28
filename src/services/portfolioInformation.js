import ChatGPT from "../assets/chatGPT.jpg";
import Cardano from "../assets/cardano.jpg";
import SpaceX from "../assets/spaceX.jpg";
import Tesla from "../assets/tesla.jpg";

import GitHubSVG from "../common/GitHubSVG";
import CodePenSVG from "../common/CodePenSVG";
import TwitterSVG from "../common/TwitterSVG";
import LinkedInSVG from "../common/LinkedInSVG";
import InstagramSVG from "../common/InstagramSVG";

const userProfile = {
	name: "Joseph Bermudez",
	objective:
		"As a software engineer, I have a deep passion for crafting one-of-a-kind digital experiences that captivate users and deliver measurable results. I thrive on working with innovative companies and products that push the boundaries of what's possible in the tech world.",
	email: "jcbtechs@gmail.com",
	links: {
		github: {
			name: "GitHub",
			link: "https://github.com/JosephBerm",
			svg: <GitHubSVG />,
		},
		instagram: {
			name: "Instagram",
			link: "https://www.instagram.com/j0edy",
			svg: <InstagramSVG />,
		},
		twitter: {
			name: "Twitter",
			link: "https://twitter.com/J0edyy",
			svg: <TwitterSVG />,
		},
		linkedin: {
			name: "LinkedIn",
			link: "https://www.linkedin.com/in/joseph-bermudez-3rd",
			svg: <LinkedInSVG />,
		},
		codepenLink: {
			name: "CodePen",
			link: "",
			svg: <CodePenSVG />,
		},
	},
};

const workExperience = [
	{
		companyName: "A.C.A.I",
		titleOfPosition: "Full-Stack Software Engineer",
		link: "https://www.linkedin.com/company/atlantic-coast-automotive-inc",
		timeline: "April 2022 - Present",
		highlights: [
			"Led the development of a camera and screen recording component, embraced company-wide to optimize business transactions.",
			"Crafted highly efficient and reusable pages and components using Vue, elevating the overall performance and user experience of the web application.",
			"Developed resilient and scalable data storage solutions by leveraging Azure Blob Storage and File System, ensuring optimal reliability and flexibility.",
			"Elevated the visual appeal and user experience by seamlessly integrating elegant web components with smooth transitions, resulting in a captivating and immersive interface.",
		],
	},
	{
		companyName: "Bizzie Co.",
		titleOfPosition: "Software Engineer Intern",
		link: "https://bizzieco.com/",
		timeline: "January - May 2021",
		highlights: [
			"Made significant contributions to the development of a cutting-edge business application, utilizing Flutter, React, and Firebase.",
			"Fostered seamless collaboration within a cross-functional team, driving sprint goals and successfully delivering a minimum viable product.",
			"Played a vital role in data analysis and metadata management, leveraging the power of Firebase to ensure efficient data handling.",
			"Designed and developed an engaging landing page for the application using React, showcasing a profound understanding of hooks and their lifecycles.",
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
	// {
	// 	companyName: "N/A",
	// 	titleOfPosition: "N/A",
	// 	link: "https://www.tesla.com/",
	// 	timeline: "From - To YYYY",
	// 	highlights: [
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
	// 	],
	// },
	// {
	// 	companyName: "N/A",
	// 	titleOfPosition: "N/A",
	// 	link: "https://www.spacex.com/",
	// 	timeline: "From - To YYYY",
	// 	highlights: [
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
	// 	],
	// },
	// {
	// 	companyName: "N/A",
	// 	titleOfPosition: "N/A",
	// 	link: "https://www.nasa.gov/",
	// 	timeline: "From - To YYYY",
	// 	highlights: [
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
	// 		"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
	// 	],
	// },
];

const featuredProjects = [
	{
		info: {
			title: "ChatGPT",
			description:
				"ChatGPT revolutionizes communication with advanced AI-powered chatbots. It enables human-like interactions, adapts to conversational styles, and transforms customer support, information retrieval, and virtual assistance. Experience the future of seamless human-AI interaction.",
			descriptionLinks: [
				{
					text: "AI-powered chatbots",
					link: "https://www.247.ai/insights/all-about-ai-powered-chatbots",
				},
				{
					text: "Experience the future",
					link: "https://chat.openai.com/",
				},
			],
			technologiesUsed: [
				"TensorFlow",
				"Python",
				"Large-scale language models",
				"Natural Language Processing (NLP)",
			],
			githubLink: "",
			projectLink: "https://openai.com/blog/chatgpt",
		},
		imageDetails: {
			link: "https://openai.com/blog/chatgpt",
			imgUrl: ChatGPT,
			imgAlt: "ChatGPT and the emergence of AI.",
		},
	},
	{
		info: {
			title: "Full Self-Driving (FSD)",
			description:
				"Tesla's Full Self-Driving is reshaping transportation with advanced sensors, machine learning, and real-time data. It aims to prevent accidents, optimize traffic flow, and revolutionize our commutes, making them safer, efficient, and enjoyable. This is the future of autonomous driving.",
			descriptionLinks: [
				{
					text: "Tesla's Full Self-Driving",
					link: "https://www.tesla.com/support/autopilot",
				},
				{
					text: "This is the future",
					link: "https://www.notateslaapp.com/tesla-reference/1353/tesla-pioneers-the-future-how-electric-and-autonomous-cars-will-transform-car-ownership-and-transportation",
				},
			],
			technologiesUsed: ["OpenCV", "TensorFlow", "Python"],
			githubLink: "",
			projectLink: "https://www.tesla.com/",
		},
		imageDetails: {
			link: "https://www.tesla.com/",
			imgUrl: Tesla,
			imgAlt: "Tesla Vehicles and Full Self Driving.",
		},
	},
	{
		info: {
			title: "Starship",
			description:
				"Embark on an extraordinary journey as Starship opens the door to boundless possibilities of exploration and colonization beyond Earth, bringing us closer to becoming an interplanetary species. SpaceX's visionary spacecraft is set to redefine space exploration and enable the establishment of sustainable habitats in the cosmos.",
			descriptionLinks: [
				{
					text: "colonization beyond Earth",
					link: "https://www.spacex.com/vehicles/starship/assets/media/Starbase%20Overview.pdf",
				},
				{
					text: "SpaceX's",
					link: "https://www.spacex.com/",
				},
			],
			technologiesUsed: ["Rocket Propulsion", "Avionics", "C++", "Python"],
			githubLink: "",
			projectLink: "https://www.spacex.com/vehicles/starship/",
		},
		imageDetails: {
			link: "https://www.spacex.com/vehicles/starship/",
			imgUrl: SpaceX,
			imgAlt: "Starship and the future of humanity.",
		},
	},
	{
		info: {
			title: "Cardano",
			description:
				"Cardano is a blockchain platform pioneering a secure and sustainable ecosystem for decentralized applications. With a scientific approach, it leverages peer-reviewed research, formal verification, and a unique layered architecture to ensure scalability, interoperability, and financial inclusivity. This is the future of blockchain technology.",
			descriptionLinks: [
				{
					text: "peer-reviewed research",
					link: "https://iohk.io/en/research/library/",
				},
				{
					text: "unique",
					link: "https://emurgo.io/fibo-101-cardano-nft-energy-consumption/",
				},
				{
					text: "This is the future",
					link: "https://www.essentialcardano.io/",
				},
			],
			technologiesUsed: [
				"Haskell",
				"Ouroboros consensus algorithm",
				"Plutus",
				"Marlowe financial contract language",
			],
			githubLink: "",
			projectLink: "https://www.cardano.org/",
		},
		imageDetails: {
			link: "https://www.cardano.org/",
			imgUrl: Cardano,
			imgAlt: "Cardano is the future.",
		},
	},
];

const otherProjects = [
	{
		title: "Project 1",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 2",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "https://github.com/JosephBerm",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 3",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 4",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "https://github.com/JosephBerm",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 5",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 6",
		description:
			"I am currently working to fill this card with a project worth showing. Clicking on this card would redirect you to the live project itself. For now, you'll be redirected to my github repositories' page.",
		technologiesUsed: ["React", "Express", "TypeScript"],
		githubLink: "https://github.com/JosephBerm",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
];

const myPortfolio = {
	workExperience,
	userProfile,
	featuredProjects,
	otherProjects,
};

export default myPortfolio;
