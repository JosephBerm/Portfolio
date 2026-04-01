'use client'

import { useState, useEffect } from 'react'

export default function Background() {
	const [gravity, setGravity] = useState(false)

	useEffect(() => {
		const interval = setInterval(() => {
			setGravity((prev) => !prev)
		}, 50000)
		return () => clearInterval(interval)
	}, [])

	return (
		<div id="galaxy-bg" className={`select-none ${gravity ? 'gravity' : ''}`}>
			<div id="stars" />
			<div id="stars2" />
			<div id="stars3" />
			{gravity ? (
				<div className="shooting-stars south">
					<div className="head" />
				</div>
			) : (
				<div className="shooting-stars north">
					<div className="head" />
				</div>
			)}
		</div>
	)
}
