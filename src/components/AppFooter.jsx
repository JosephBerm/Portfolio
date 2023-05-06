import React, { useContext } from "react";
import PortfolioContext from "../context/portfolioContext";

function AppFooter(props) {
	const { userProfile } = useContext(PortfolioContext);

	const getLinks = () => {
		let links = [];
		for (let key in userProfile.links) {
			let site = userProfile.links[key];
			links.push(
				<li key={key}>
					<a href={site.link} rel='noopener noreferrer' target='_blank'>
						{site.svg}
					</a>
				</li>
			);
		}

		return links;
	};

	return (
		<footer className='app-footer'>
			<div className='mobile-footer'>
				<ul>{getLinks()}</ul>
			</div>
			<div className='normal-footer'>
				<a
					href={userProfile.links.github.link}
					rel='noopener noreferrer'
					target='_blank'>
					<p>Designed &amp; Built by {userProfile.name}</p>
					<div className='special-thanks'>
						<p>
							I would like to give a special thank you to Brittany Chiang. She
							inspired me to build my first portfolio.
						</p>
					</div>
				</a>
			</div>
		</footer>
	);
}

export default AppFooter;
