import React from 'react'
import { usePortfolioStore } from '@/store/portfolioStore'
import LinksList from '../common/LinksList'

function AppFooter() {
	const { userProfile } = usePortfolioStore()

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
					<p>
						Built by <br />
						{userProfile.name}
					</p>
				</a>
			</div>
		</footer>
	)
}

export default AppFooter
