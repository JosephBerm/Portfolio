interface IconProps {
	/** Accessible title; marks the SVG as an image. Omit for decorative icons, which are hidden from assistive tech. */
	title?: string
	strokeWidth?: number
	className?: string
	children: React.ReactNode
}

/** Shared 24×24 stroke-icon frame for the icons in this folder. */
export default function Icon({ title, strokeWidth = 2, className, children }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			role={title ? 'img' : undefined}
			aria-hidden={title ? undefined : true}
			focusable="false"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			{title && <title>{title}</title>}
			{children}
		</svg>
	)
}
