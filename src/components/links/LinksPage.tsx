import { StaggerContainer } from '@/components/motion/StaggerContainer'
import { StaggerItem } from '@/components/motion/RevealItem'
import { duration } from '@/lib/animations'
import { LINK_CARDS, LINKS_PROFILE } from '@/lib/linksData'
import ProfileIdentity from '@/components/ProfileIdentity'
import LinkCard from './LinkCard'
import PortfolioFooterLink from './PortfolioFooterLink'

/** Stagger timing for the entrance cascade. */
const STAGGER_DELAY = 0.15

/** Per-item entrance distances — identity is lighter, cards heavier. */
const ENTRANCE_DISTANCE = { identity: 20, card: 25, footer: 15 } as const

/** /links content column; the shared shell and orbs come from app/links/layout.tsx. */
export default function LinksPage() {
	return (
		<StaggerContainer staggerDelay={STAGGER_DELAY}>
			{/* Profile identity */}
			<StaggerItem index={0} distance={ENTRANCE_DISTANCE.identity} dur={duration.slow}>
				<ProfileIdentity title={LINKS_PROFILE.name} subtitle={LINKS_PROFILE.title} />
			</StaggerItem>

			{/* Link cards */}
			{LINK_CARDS.map((card, i) => (
				<StaggerItem
					key={card.id}
					index={i + 1}
					distance={ENTRANCE_DISTANCE.card}
					dur={duration.slow}
					className={i < LINK_CARDS.length - 1 ? 'mb-4' : ''}
				>
					<LinkCard {...card} />
				</StaggerItem>
			))}

			{/* Portfolio link */}
			<StaggerItem
				index={LINK_CARDS.length + 1}
				distance={ENTRANCE_DISTANCE.footer}
				dur={duration.slow}
				className="flex justify-center"
			>
				<PortfolioFooterLink />
			</StaggerItem>
		</StaggerContainer>
	)
}
