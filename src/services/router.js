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

function handleLinkClick(location) {
	routes
		.find((r) => r.location === location)
		.section.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
}

function linkRoutesTo(sections) {
	routes.forEach((r) => {
		r.section = sections.find((s) => r.location === s.id);
	});
}

const router = {
	routes,
	changeRoute: handleLinkClick,
	linkRoutesTo,
};

export default router;
