import ChatGPT from "../assets/chatGPT.jpg";
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
		link: "https://www.saturn-app.com",
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
	{
		companyName: "N/A",
		titleOfPosition: "N/A",
		link: "https://iohk.io/",
		timeline: "August - December 2020",
		highlights: [
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
		],
	},
	{
		companyName: "Tesla",
		titleOfPosition: "Software Engineer Intern",
		link: "https://www.tesla.com/",
		timeline: "January - May 2020",
		highlights: [
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
		],
	},
	{
		companyName: "SpaceX",
		titleOfPosition: "Director of Rockets",
		link: "https://www.spacex.com/",
		timeline: "August - December 2019",
		highlights: [
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
		],
	},
	{
		companyName: "NASA",
		titleOfPosition: "Intern for Director of Rocekts",
		link: "https://www.nasa.gov/",
		timeline: "January - May 2020",
		highlights: [
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore?",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore? Lorem ipsum dolor sit amet consectetur, adipisicing elit.",
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore adipisci asperiores inventore?",
		],
	},
];

const featuredProjects = [
	{
		info: {
			title: "Project 1",
			description:
				"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat dolor adipisci asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
			descriptionLinks: [
				{
					text: "Example Link",
					link: "https://github.com/JosephBerm",
				},
				{
					text: "Link 2 Example",
					link: "https://github.com/JosephBerm",
				},
				{
					text: "Another Example",
					link: "https://github.com/JosephBerm",
				},
				{
					text: "Last One",
					link: "https://github.com/JosephBerm",
				},
			],
			technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
			githubLink: "https://github.com/JosephBerm",
			projectLink: "https://github.com/JosephBerm?tab=repositories",
		},
		imageDetails: {
			link: "https://github.com/JosephBerm",
			imgUrl: ChatGPT,
			imgAlt: "ChatGPT",
		},
	},
	{
		info: {
			title: "Project 2",
			description:
				"Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur qui ratione voluptatem sequi nesciunt.",
			descriptionLinks: [],
			technologiesUsed: ["Vue.js", ".Net Core", "TypeScript", "ChatGPT API"],
			githubLink: "https://github.com/JosephBerm",
			projectLink: "https://github.com/JosephBerm?tab=repositories",
		},
		imageDetails: {
			link: "https://github.com/JosephBerm",
			imgUrl: Tesla,
			imgAlt: "Starlink",
		},
	},
	{
		info: {
			title: "Project 3",
			description:
				"Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat.",
			descriptionLinks: [
				{
					text: "dolorem",
					link: "https://github.com/JosephBerm",
				},
				{
					text: "fugiat",
					link: "https://github.com/JosephBerm",
				},
			],
			technologiesUsed: ["SolidJS", "Express", "TypeScript", "ChatGPT API"],
			githubLink: "https://github.com/JosephBerm",
			projectLink: "https://github.com/JosephBerm?tab=repositories",
		},
		imageDetails: {
			link: "https://github.com/JosephBerm",
			imgUrl: SpaceX,
			imgAlt: "Tesla",
		},
	},
];

const otherProjects = [
	{
		title: "Project 1",
		description:
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit placeat asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 2",
		description:
			"Lorem sit amet consectetur, adipisicing elit. Magni odit placeat asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
		githubLink: "https://github.com/JosephBerm",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 3",
		description:
			"Lorem ipsum amet consectetur, adipisicing elit. Magni odit placeat asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 4",
		description:
			"Lorem ipsum dolor sit consectetur, adipisicing elit. Magni odit placeat asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
		githubLink: "https://github.com/JosephBerm",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 5",
		description:
			"Lorem ipsum dolor consectetur, adipisicing elit. Magni odit placeat asperiores inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
		githubLink: "",
		projectLink: "https://github.com/JosephBerm?tab=repositories",
	},
	{
		title: "Project 6",
		description:
			"Lorem ipsum dolor sit amet consectetur, adipisicing elit. Magni odit inventore. Example Link, Link 2 Example, Another Example, and Last One",
		technologiesUsed: ["React", "Express", "TypeScript", "ChatGPT API"],
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
