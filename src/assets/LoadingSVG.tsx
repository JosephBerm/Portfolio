import React, { useEffect } from 'react'

const LoadingSVG: React.FC = () => {
	useEffect(() => {
		// Animation settings
		const animationSettings: KeyframeAnimationOptions = {
			duration: 3200,
			iterations: 1,
			fill: 'forwards' as FillMode,
			easing: 'ease-in-out'
		}

		// Get SVG elements
		const svg = document.getElementById('eDWS6Karuqz1')
		const polygon = document.getElementById('eDWS6Karuqz3')
		const text = document.getElementById('eDWS6Karuqz4')

		if (!svg || !polygon || !text) return

		// Animate polygon stroke
		polygon.animate(
			[
				{ strokeDashoffset: 189.000692 },
				{ strokeDashoffset: 0 }
			],
			{
				...animationSettings,
				duration: 1600
			}
		)

		// Animate text opacity
		text.animate(
			[
				{ opacity: 0 },
				{ opacity: 0.25 },
				{ opacity: 1 }
			],
			{
				...animationSettings,
				duration: 400,
				delay: 1730
			}
		)

		// Animate transform
		svg.animate(
			[
				{ transform: 'scale(1)' },
				{ transform: 'scale(0)' }
			],
			{
				...animationSettings,
				duration: 350,
				delay: 2750
			}
		)
	}, [])

	return (
		<svg
			id="eDWS6Karuqz1"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox="0 0 470 541"
			shapeRendering="geometricPrecision"
			textRendering="geometricPrecision"
			style={{ backgroundColor: 'rgba(255,255,255,0)' }}
		>
			<g id="eDWS6Karuqz2" transform="translate(0 0.000001)">
				<polygon
					id="eDWS6Karuqz3"
					points="65.75,22.72 34.25,22.72 18.5,50 34.25,77.28 65.75,77.28 81.5,50 65.75,22.72"
					transform="matrix(6.92958-3.9992 3.9992 6.92958-311.439 124.023001)"
					fill="#64ffda"
					fillOpacity="0"
					stroke="#64ffda"
					strokeWidth="4"
					strokeLinecap="round"
					strokeDashoffset="189.000692"
					strokeDasharray="189.000692"
				/>
				<text
					id="eDWS6Karuqz4"
					dx="0"
					dy="0"
					fontFamily="Roboto"
					fontSize="500"
					fontWeight="700"
					transform="matrix(.550733 0.007079-.007079 0.550733 156.845001 366.174001)"
					opacity="0"
					fill="#64ffda"
					strokeWidth="0"
				>
					<tspan
						y="0"
						fontFamily="Roboto"
						fontSize="500"
						fontWeight="700"
						fontStyle="normal"
						fill="#64ffda"
						strokeWidth="0"
					>
						J
					</tspan>
				</text>
			</g>
		</svg>
	)
}

export default LoadingSVG
