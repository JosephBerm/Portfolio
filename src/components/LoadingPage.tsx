import React, { useState, useEffect } from 'react'
import LoadingLogo from '@/components/LoadingLogo'

function LoadingPage() {
	const [isVisible, setIsVisible] = useState(true)

	useEffect(() => {
		// Start fade out after animation completes
		const timer = setTimeout(() => {
			setIsVisible(false)
		}, 3000) // Match this with your CSS animation duration

		return () => clearTimeout(timer)
	}, [])

	if (!isVisible) return null

	return (
		<div className='fill-page page-loader not-scrollable'>
			<LoadingLogo />
		</div>
	)
}

export default LoadingPage
