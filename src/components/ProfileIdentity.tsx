import Logo from '@/components/icons/Logo'

interface ProfileIdentityProps {
	/** Heading text */
	title: string
	/** Mono subtitle line */
	subtitle: string
}

/** Logo, heading and mono subtitle: the /links profile header, reused by the status screens. */
export default function ProfileIdentity({ title, subtitle }: ProfileIdentityProps) {
	return (
		<div className="flex flex-col items-center text-center gap-3 mb-10 md:mb-14">
			{/* Decorative: the heading next to it names the page */}
			<div className="w-12 h-12 text-green" aria-hidden="true">
				<Logo />
			</div>
			<h1 className="text-lightest-slate font-sans text-xl md:text-2xl font-semibold tracking-tight m-0">
				{title}
			</h1>
			<p className="text-slate font-mono text-xs m-0">
				{subtitle}
			</p>
		</div>
	)
}
