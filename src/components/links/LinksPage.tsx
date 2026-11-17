import EntranceItem from '@/components/motion/EntranceItem'
import { LINK_CARDS, LINKS_PROFILE } from '@/lib/linksData'
import ProfileIdentity from '@/components/ProfileIdentity'
import LinkCard from './LinkCard'
import PortfolioFooterLink from './PortfolioFooterLink'

/** Per-item entrance distances — identity is lighter, cards heavier. */
const ENTRANCE_DISTANCE = { identity: 20, card: 25, footer: 15 } as const

/** /links content column; the shared shell and orbs come from app/links/layout.tsx. */
export default function LinksPage() {
	return (
		<>
			{/* Profile identity */}
			<EntranceItem index={0} distance={ENTRANCE_DISTANCE.identity}>
				<ProfileIdentity title={LINKS_PROFILE.name} subtitle={LINKS_PROFILE.title} />
			</EntranceItem>

			{/* Link cards */}
			{LINK_CARDS.map((card, i) => (
				<EntranceItem
					key={card.id}
					index={i + 1}
					distance={ENTRANCE_DISTANCE.card}
					className={i < LINK_CARDS.length - 1 ? 'mb-4' : undefined}
				>
					<LinkCard {...card} />
				</EntranceItem>
			))}

			{/* Portfolio link */}
			<EntranceItem index={LINK_CARDS.length + 1} distance={ENTRANCE_DISTANCE.footer} className="flex justify-center">
				<PortfolioFooterLink />
			</EntranceItem>
		</>
	)
}
