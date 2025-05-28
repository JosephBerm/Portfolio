import React from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'

function LinksList() {
	const { userProfile } = usePortfolioStore()
	const getLinks = () => {
		let links = []
		for (let key in userProfile.links) {
			let site = userProfile.links[key];
			links.push(
				<li key={key}>
					<a
						href={site.link}
						aria-label={site.name}
						rel='noopener noreferrer'
						target='_blank'
						title={site.name}>
						{site.svg}
					</a>
				</li>
			);
		}

		return links;
	};
	return <ul>{getLinks()}</ul>
}

export default LinksList
