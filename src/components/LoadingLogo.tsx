'use client'

import { motion, useReducedMotion } from 'motion/react'
import { easing, duration } from '@/lib'
import { LOGO_HEXAGON_POINTS, LOGO_J_PATH, LOGO_J_UNITS_TO_TEXT } from '@/components/icons/logoGlyphs'

/** Total stroke length of the hexagon path — used for dash-draw animation. */
const HEXAGON_STROKE_LENGTH = 189

/** Duration tokens for the loading sequence (seconds). */
const DRAW_DURATION = 1.6
const LETTER_DELAY = 1.73
const LETTER_DURATION = 0.4
/** The logo starts shrinking this long before the loader overlay starts fading. */
const EXIT_LEAD = 0.25

export default function LoadingLogo() {
	// Reduced motion skips scale animations entirely (the logo would vanish on mount), so fade it out instead.
	const reduceMotion = useReducedMotion()

	return (
		<div className="w-[100px] h-[100px]">
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 470 541"
				shapeRendering="geometricPrecision"
				initial={{ scale: 1, opacity: 1 }}
				animate={reduceMotion ? { opacity: 0 } : { scale: 0 }}
				transition={{ duration: duration.normal, delay: duration.loader - EXIT_LEAD, ease: easing.smooth }}
			>
				<g transform="translate(0 0.000001)">
					{/* Hexagon — draws itself via strokeDashoffset */}
					<motion.polygon
						points={LOGO_HEXAGON_POINTS}
						transform="matrix(6.92958-3.9992 3.9992 6.92958-311.439 124.023001)"
						fill="transparent"
						stroke="var(--color-green)"
						strokeWidth="4"
						strokeLinecap="round"
						strokeDasharray={HEXAGON_STROKE_LENGTH}
						initial={{ strokeDashoffset: HEXAGON_STROKE_LENGTH }}
						animate={{ strokeDashoffset: 0 }}
						transition={{ duration: DRAW_DURATION, ease: easing.smooth }}
					/>

					{/* "J" outline (Roboto Bold glyph, no font needed) — fades in after hexagon draw completes */}
					<motion.path
						d={LOGO_J_PATH}
						transform={`matrix(.550733 0.007079-.007079 0.550733 156.845001 366.174001) ${LOGO_J_UNITS_TO_TEXT}`}
						fill="var(--color-green)"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: LETTER_DURATION, delay: LETTER_DELAY, ease: easing.easeOut }}
					/>
				</g>
			</motion.svg>
		</div>
	)
}
