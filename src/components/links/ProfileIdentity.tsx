import { Logo } from '@/components/icons'
import { LINKS_PROFILE } from '@/lib/linksData'

/** Top section of the links page — logo, name, and role tagline. */
export default function ProfileIdentity() {
	return (
		<div className="flex flex-col items-center text-center gap-3 mb-10 md:mb-14">
			<div className="w-12 h-12 text-green">
				<Logo />
			</div>
			<h1 className="text-lightest-slate font-sans text-xl md:text-2xl font-semibold tracking-tight m-0">
				{LINKS_PROFILE.name}
			</h1>
			<p className="text-slate font-mono text-xs m-0">
				{LINKS_PROFILE.title}
			</p>
		</div>
	)
}
