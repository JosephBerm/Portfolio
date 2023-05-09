import React, { useContext } from "react";
import PortfolioContext from "../context/portfolioContext";
import LinksList from "./../common/LinksList";

function AppFooter(props) {
	const { userProfile } = useContext(PortfolioContext);

	return (
		<footer className='app-footer'>
			<div className='mobile-footer'>
				<LinksList />
			</div>
			<div className='normal-footer'>
				<a
					href={userProfile.links.github.link}
					rel='noopener noreferrer'
					target='_blank'>
					<p>Built by {userProfile.name}</p>
					<div className='special-thanks'>
						<p>
							I would like to extend a special thank you to Brittany Chiang, whose
							remarkable journey and work have inspired this version of my portfolio.
						</p>
					</div>
				</a>
			</div>
		</footer>
	);
}

export default AppFooter;
