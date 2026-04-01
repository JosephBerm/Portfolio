'use client'

import { usePortfolioStore } from '@/store'

export default function LinksList() {
	const { userProfile } = usePortfolioStore()

	return (
		<ul className="flex flex-col items-center m-0 p-0 list-none md:after:content-[''] md:after:block md:after:w-px md:after:h-[90px] md:after:mx-auto md:after:bg-light-slate">
			{Object.entries(userProfile.links).map(([key, site]) => (
				<li key={key}>
					<a
						href={site.link}
						aria-label={site.name}
						rel="noopener noreferrer"
						target="_blank"
						title={site.name}
						className="p-[10px] block [&_svg]:w-[20px] [&_svg]:h-[20px] hover:-translate-y-[3px] focus:-translate-y-[3px] transition-transform duration-250"
					>
						{site.svg}
					</a>
				</li>
			))}
		</ul>
	)
}
