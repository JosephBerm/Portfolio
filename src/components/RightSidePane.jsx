import React, { useContext } from "react";
import PortfolioContext from "./../context/portfolioContext";

function RightSidePane(props) {
	const { userProfile } = useContext(PortfolioContext);
	return (
		<div orientation='right' className='RightSidePane'>
			<div className='email-wrapper'>
				<a href={`mailTo:${userProfile.email}`}>{userProfile.email}</a>
			</div>
		</div>
	);
}

export default RightSidePane;
