import React, { useContext } from 'react'
import PortfolioContext from '../context/portfolioContext'
import LinksList from './../common/LinksList'

function AppFooter(props) {
	const { userProfile } = useContext(PortfolioContext)

	return (
		<footer className='app-footer'>
			<div className='mobile-footer'>
				<LinksList />
			</div>
			<div className='normal-footer'>
				<a href={userProfile.links.github.link} rel='noopener noreferrer' target='_blank'>
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
