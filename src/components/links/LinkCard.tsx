import type { ComponentType } from 'react'
import Link from 'next/link'
import { cn } from '@/lib'
import { VendorXSVG, LinkedInSVG, ExternalLinkSVG } from '@/components/icons'
import type { ILinkCard } from '@/lib/linksData'

/** Maps card id → icon component. Keeps icon concerns in the component layer. */
const ICON_MAP: Record<string, ComponentType> = {
	vendorx: VendorXSVG,
	linkedin: LinkedInSVG,
	schedule: ScheduleSVG,
}

/** Icon sizes per variant. */
const ICON_SIZE = {
	hero: 'w-7 h-7',
	secondary: 'w-5 h-5',
} as const

/** Shared glass card classes extracted for DRY reuse between <a> and <Link>. */
function cardClasses(isHero: boolean) {
	return cn(
		// Base glass treatment
		'group flex items-center gap-4 w-full rounded-[16px]',
		'bg-light-navy/40 backdrop-blur-xl',
		'border border-lightest-navy/10',
		'shadow-lg shadow-navy-shadow/30',
		'transition-all duration-300 ease-[cubic-bezier(0.645,0.045,0.355,1)]',
		// Hover: scale + glow + border shift
		'hover:scale-[1.02] hover:bg-light-navy/60',
		'hover:border-green/20 hover:shadow-green/10 hover:shadow-xl',
		// Active press feedback for touch
		'active:scale-[0.98]',
		// Variant sizing
		isHero ? 'px-[28px] py-[22px]' : 'px-[24px] py-[18px]',
	)
}

/** Glassmorphic link card with hero (prominent) and secondary variants.
 *  Internal links (href starts with /) use next/link; external links use <a>. */
export default function LinkCard({ id, label, description, href, variant }: ILinkCard) {
	const Icon = ICON_MAP[id]
	const isHero = variant === 'hero'
	const isInternal = href.startsWith('/')

	const content = (
		<>
			{/* Icon */}
			{Icon && (
				<div className={cn('shrink-0 text-green', ICON_SIZE[variant])}>
					<Icon />
				</div>
			)}

			{/* Label + description */}
			<div className="flex flex-col min-w-0">
				<span className={cn(
					'text-lightest-slate font-sans font-medium leading-tight',
					isHero ? 'text-lg' : 'text-base',
				)}>
					{label}
				</span>
				<span className="text-slate font-mono text-xs mt-0.5 truncate">
					{description}
				</span>
			</div>

			{/* Trailing affordance: arrow for internal, external icon for external */}
			<div className="ml-auto shrink-0 w-4 h-4 text-dark-slate transition-colors duration-200 group-hover:text-green">
				{isInternal ? <ArrowRightSVG /> : <ExternalLinkSVG />}
			</div>
		</>
	)

	if (isInternal) {
		return (
			<Link href={href} className={cardClasses(isHero)}>
				{content}
			</Link>
		)
	}

	return (
		<a href={href} target="_blank" rel="noopener noreferrer" className={cardClasses(isHero)}>
			{content}
		</a>
	)
}

/** Inline arrow icon — too small/specific for the icons barrel. */
function ArrowRightSVG() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="5" y1="12" x2="19" y2="12" />
			<polyline points="12 5 19 12 12 19" />
		</svg>
	)
}

/** Inline calendar icon for the schedule card. */
function ScheduleSVG() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-schedule">
			<title>Schedule</title>
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
			<line x1="16" y1="2" x2="16" y2="6" />
			<line x1="8" y1="2" x2="8" y2="6" />
			<line x1="3" y1="10" x2="21" y2="10" />
		</svg>
	)
}
