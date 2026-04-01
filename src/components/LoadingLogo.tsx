'use client'

import { motion } from 'motion/react'
import { easing, duration } from '@/lib'

/** Total stroke length of the hexagon path — used for dash-draw animation. */
const HEXAGON_STROKE_LENGTH = 189

/** Duration tokens for the loading sequence (seconds). */
const DRAW_DURATION = 1.6
const LETTER_DELAY = 1.73
const LETTER_DURATION = 0.4

export default function LoadingLogo() {
	return (
		<div className="w-[100px] h-[100px]">
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 470 541"
				shapeRendering="geometricPrecision"
				textRendering="geometricPrecision"
				initial={{ scale: 1 }}
				animate={{ scale: 0 }}
				transition={{ duration: duration.normal, delay: 2.75, ease: easing.smooth }}
			>
				<g transform="translate(0 0.000001)">
					{/* Hexagon — draws itself via strokeDashoffset */}
					<motion.polygon
						points="65.75,22.72 34.25,22.72 18.5,50 34.25,77.28 65.75,77.28 81.5,50 65.75,22.72"
						transform="matrix(6.92958-3.9992 3.9992 6.92958-311.439 124.023001)"
						fill="transparent"
						stroke="#64ffda"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray={HEXAGON_STROKE_LENGTH}
						initial={{ strokeDashoffset: HEXAGON_STROKE_LENGTH }}
						animate={{ strokeDashoffset: 0 }}
						transition={{ duration: DRAW_DURATION, ease: easing.smooth }}
					/>

					{/* "J" letter — fades in after hexagon draw completes */}
					<motion.text
						dx="0"
						dy="0"
						fontFamily="Roboto"
						fontSize="500"
						fontWeight="700"
						transform="matrix(.550733 0.007079-.007079 0.550733 156.845001 366.174001)"
						fill="#64ffda"
						strokeWidth="0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: LETTER_DURATION, delay: LETTER_DELAY, ease: easing.easeOut }}
					>
						<tspan y="0" fontWeight="700" strokeWidth="0">
							J
						</tspan>
					</motion.text>
				</g>
			</motion.svg>
		</div>
	)
}
