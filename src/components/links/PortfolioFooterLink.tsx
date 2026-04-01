import Link from 'next/link'
import { PORTFOLIO_LINK } from '@/lib/linksData'

/** Subtle "View Full Portfolio" link at the bottom of the links page.
 *  Uses the inline-link pattern for the underline reveal on hover. */
export default function PortfolioFooterLink() {
	return (
		<div className="mt-14 md:mt-18">
			<Link
				href={PORTFOLIO_LINK.href}
				className="inline-link font-mono text-sm text-slate"
			>
				{PORTFOLIO_LINK.label}
			</Link>
		</div>
	)
}
