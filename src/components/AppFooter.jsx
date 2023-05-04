import React, { useContext } from "react";
import PortfolioContext from "../context/portfolioContext";

function AppFooter(props) {
	const { userProfile } = useContext(PortfolioContext);
	return (
		<footer className='app-footer'>
			<div className='mobile-footer'></div>
			<div className='normal-footer'>
				<a href={userProfile.gitHubLink} rel='noopener noreferrer' target='_blank'>
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
