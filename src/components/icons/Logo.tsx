import { LOGO_HEXAGON_POINTS, LOGO_J_PATH, LOGO_J_UNITS_TO_TEXT } from './logoGlyphs'

export default function Logo() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 477 551" shapeRendering="geometricPrecision">
			<polygon
				points={LOGO_HEXAGON_POINTS}
				transform="matrix(6.924784-4.007492 4.007492 6.924784-308.113806 129.635437)"
				fill="var(--color-green-tint)"
				stroke="var(--color-green)"
				strokeWidth="4"
			/>
			{/* "J" as an outline, so it renders the same everywhere without a font */}
			<path d={LOGO_J_PATH} transform={`matrix(.449374 0 0 0.449374 176.128629 353.753758) ${LOGO_J_UNITS_TO_TEXT}`} fill="var(--color-green)" />
		</svg>
	)
}
