const routes = [
	{
		name: "About",
		location: "about",
	},
	{
		name: "Experience",
		location: "jobs",
	},
	{
		name: "Work",
		location: "projects",
	},
	{
		name: "Contact",
		location: "contact",
	},
];

let sections;

function handleLinkClick(location) {
	sections[location].current.scrollIntoView({
		behavior: "smooth",
		block: "start",
	});
}

function linkRoutesTo(refs) {
	sections = refs;
}

const router = {
	routes,
	changeRoute: handleLinkClick,
	linkRoutesTo,
};

export default router;
