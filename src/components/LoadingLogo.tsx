import type { CSSProperties } from 'react'
import { easing, intro } from '@/lib/animations'
import { cubicBezierCss, splitEasing } from '@/lib/cubicBezier'
import { LOGO_HEXAGON_POINTS, LOGO_J_PATH, LOGO_J_UNITS_TO_TEXT } from '@/components/icons/logoGlyphs'
import styles from './IntroGate.module.css'

/** The drawing's viewBox: both layers share it, and the glyph's box keeps its aspect ratio. */
const VIEW_WIDTH = 470
const VIEW_HEIGHT = 541
const VIEW_BOX = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`

/** easing.smooth across the whole trace, split between the two halves that uncover it one after the other. */
const TRACE = splitEasing(easing.smooth, 0.5)

/** The mark's timing, from `intro` and `easing`, for IntroGate.module.css. */
const TIMING = {
	aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}`,
	'--intro-draw': `${intro.draw}s`,
	'--intro-trace-first': `${(intro.draw * TRACE.share).toFixed(3)}s`,
	'--intro-trace-first-ease': cubicBezierCss(TRACE.first),
	'--intro-trace-second': `${(intro.draw * (1 - TRACE.share)).toFixed(3)}s`,
	'--intro-trace-second-ease': cubicBezierCss(TRACE.second),
	'--intro-letter': `${intro.letter}s`,
	'--intro-letter-delay': `${intro.letterDelay}s`,
	'--intro-letter-ease': cubicBezierCss(easing.easeOut),
	'--intro-mark-out': `${intro.markOut}s`,
} as CSSProperties

/**
 * The intro loader's mark, rendered on the server so it plays from the first paint, while the page's scripts load: the
 * hexagon traces itself, then the J fades in. The trace is covers in the loader's color turning away about the hexagon's
 * center, so everything that moves is a transform or an opacity (IntroGate.module.css) and nothing the main thread does
 * meanwhile can stall it.
 */
export default function LoadingLogo() {
	return (
		<div className="w-[100px] h-[100px]">
			<div className={styles.glyph} style={TIMING}>
				<svg className={styles.layer} xmlns="http://www.w3.org/2000/svg" viewBox={VIEW_BOX} shapeRendering="geometricPrecision">
					<g transform="translate(0 0.000001)">
						<polygon
							points={LOGO_HEXAGON_POINTS}
							transform="matrix(6.92958-3.9992 3.9992 6.92958-311.439 124.023001)"
							fill="transparent"
							stroke="var(--color-green)"
							strokeWidth="4"
							strokeLinecap="round"
						/>
					</g>
				</svg>
				<div className={styles.trace}>
					<div className={styles.traceLeft}>
						<div className={styles.cover} />
					</div>
					<div className={styles.traceRight}>
						<div className={styles.cover} />
					</div>
				</div>
				<div className={styles.letter}>
					<svg className={styles.layer} xmlns="http://www.w3.org/2000/svg" viewBox={VIEW_BOX} shapeRendering="geometricPrecision">
						<g transform="translate(0 0.000001)">
							{/* "J" outline (Roboto Bold glyph, no font needed) */}
							<path
								d={LOGO_J_PATH}
								transform={`matrix(.550733 0.007079-.007079 0.550733 156.845001 366.174001) ${LOGO_J_UNITS_TO_TEXT}`}
								fill="var(--color-green)"
							/>
						</g>
					</svg>
				</div>
			</div>
		</div>
	)
}
