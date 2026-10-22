import type { ComponentType } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ArrowRightSVG from '@/components/icons/ArrowRightSVG'
import CalendarSVG from '@/components/icons/CalendarSVG'
import ExternalLinkSVG from '@/components/icons/ExternalLinkSVG'
import LinkedInSVG from '@/components/icons/LinkedInSVG'
import VendorXSVG from '@/components/icons/VendorXSVG'
import type { ILinkCard, LinkCardId } from '@/lib/linksData'

/** Maps card id → icon component. Keeps icon concerns in the component layer. */
const ICON_MAP: Record<LinkCardId, ComponentType> = {
	vendorx: VendorXSVG,
	linkedin: LinkedInSVG,
	schedule: CalendarSVG,
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
		'transition-all duration-300 ease-smooth',
		// Hover: scale + glow + border shift
		'motion-safe:hover:scale-[1.02] hover:bg-light-navy/60',
		'hover:border-green/20 hover:shadow-green/10 hover:shadow-xl',
		// Active press feedback for touch
		'motion-safe:active:scale-[0.98]',
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
			{/* Icon (decorative: the label names the link) */}
			<div className={cn('shrink-0 text-green', ICON_SIZE[variant])} aria-hidden="true">
				<Icon />
			</div>

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

			{/* Trailing affordance (decorative): arrow for internal, external icon for external */}
			<div className="ml-auto shrink-0 w-4 h-4 text-dark-slate transition-colors duration-200 group-hover:text-green" aria-hidden="true">
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
