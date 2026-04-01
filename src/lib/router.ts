export interface Route {
	name: string
	location: string
	section?: HTMLElement
}

const routes: Route[] = [
	{ name: 'About', location: 'about' },
	{ name: 'Experience', location: 'jobs' },
	{ name: 'Work', location: 'projects' },
	{ name: 'Contact', location: 'contact' },
]

function handleLinkClick(location: string): void {
	const route = routes.find((r) => r.location === location)
	if (route?.section) {
		route.section.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		})
	}
}

function linkRoutesTo(sections: HTMLElement[]): void {
	routes.forEach((r) => {
		r.section = sections.find((s) => r.location === s.id)
	})
}

const router = {
	routes,
	changeRoute: handleLinkClick,
	linkRoutesTo,
}

export default router
