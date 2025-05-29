import React, { useEffect } from 'react'
import LoadingSVG from '@/assets/LoadingSVG'

function LoadingLogo() {
	useEffect(() => {}, [])
	return (
		<div className='loading-logo'>
			<LoadingSVG />
		</div>
	)
}

export default LoadingLogo
