'use client'

import { MotionConfig } from 'motion/react'
import { StaggerContainer, StaggerItem } from '@/components/motion'
import { duration } from '@/lib'
import { LINK_CARDS } from '@/lib/linksData'
import BackgroundEffects from './BackgroundEffects'
import ProfileIdentity from './ProfileIdentity'
import LinkCard from './LinkCard'
import PortfolioFooterLink from './PortfolioFooterLink'

/** Stagger timing for the entrance cascade. */
const STAGGER_DELAY = 0.15

/** Per-item entrance distances — identity is lighter, cards heavier. */
const ENTRANCE_DISTANCE = { identity: 20, card: 25, footer: 15 } as const

export default function LinksPage() {
	return (
		<MotionConfig reducedMotion="never">
			{/* Full-viewport dark container */}
			<div className="relative min-h-dvh bg-dark-navy overflow-hidden flex items-center justify-center">
				<BackgroundEffects />

				{/* Centered content column */}
				<div className="relative z-10 w-full max-w-[480px] px-6 py-12 md:py-16">
					<StaggerContainer staggerDelay={STAGGER_DELAY}>
						{/* Profile identity */}
						<StaggerItem index={0} distance={ENTRANCE_DISTANCE.identity} dur={duration.slow}>
							<ProfileIdentity />
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
				</div>
			</div>
		</MotionConfig>
	)
}
