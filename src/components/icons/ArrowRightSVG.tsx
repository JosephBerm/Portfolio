import Icon from './Icon'

/** Decorative trailing arrow (no title, so screen readers skip it). */
export default function ArrowRightSVG() {
	return (
		<Icon>
			<line x1="5" y1="12" x2="19" y2="12" />
			<polyline points="12 5 19 12 12 19" />
		</Icon>
	)
}
