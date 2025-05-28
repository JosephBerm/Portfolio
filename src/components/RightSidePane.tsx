import React from "react";
import { usePortfolioStore } from '@/store/portfolioStore'

function RightSidePane() {
	const { userProfile } = usePortfolioStore()
	return (
		<div data-orientation='right' className='RightSidePane'>
			<div className='email-wrapper'>
				<a href={`mailTo:${userProfile.email}`}>{userProfile.email}</a>
			</div>
		</div>
	);
}

export default RightSidePane;
