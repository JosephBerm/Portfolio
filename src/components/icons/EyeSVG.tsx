import Icon from './Icon'

/** Decorative eye glyph, Feather's "eye" (no title: the button that holds it names itself). */
export default function EyeSVG() {
	return (
		<Icon>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
			<circle cx="12" cy="12" r="3" />
		</Icon>
	)
}
