'use client'

import { usePortfolioStore } from '@/store'
import { duration } from '@/lib'
import { StaggerContainer, StaggerItem } from '@/components/motion'

/** Hero entrance distance by hierarchy — heavier elements travel further. */
const HERO_DISTANCE = { greeting: 25, heading: 40, paragraph: 30, cta: 20 } as const

export default function Introduction() {
	const { userProfile } = usePortfolioStore()

	return (
		<section className="flex flex-col justify-center items-start min-h-screen h-auto p-0 pt-[100px]">
			<StaggerContainer staggerDelay={0.1}>
				<StaggerItem index={0} distance={HERO_DISTANCE.greeting} dur={duration.slow}>
					<h1 className="text-green font-mono text-[clamp(var(--text-sm),5vw,var(--text-base))] font-normal m-0 mb-[20px] ml-[2px] sm:mb-[30px] sm:ml-[4px]">
						Hi, my name is
					</h1>
				</StaggerItem>
				<StaggerItem index={1} distance={HERO_DISTANCE.heading} dur={duration.entrance}>
					<h2 className="text-lightest-slate leading-[1.1] m-0 text-[clamp(35px,8vw,75px)]">
						{userProfile.name}.
					</h2>
				</StaggerItem>
				<StaggerItem index={2} distance={HERO_DISTANCE.heading} dur={duration.entrance}>
					<h3 className="text-slate leading-[0.9] mt-[5px] m-0 text-[clamp(35px,8vw,75px)]">
						I build things for the web.
					</h3>
				</StaggerItem>
				<StaggerItem index={3} distance={HERO_DISTANCE.paragraph} dur={duration.slow}>
					<p className="mt-[20px] max-w-[540px]">
						Full-stack software engineer with 4+ years of experience building web applications in C#/.NET
						and TypeScript/React. Founder of{' '}
						<a className="inline-link" href="https://vendorxpro.com" target="_blank" rel="noopener noreferrer">
							VendorX
						</a>
						, a multi-tenant B2B ordering platform with PostgreSQL row-level security, 40+ API controllers,
						100+ pages, and Stripe billing. Comfortable owning features end-to-end from database schema to
						deployment pipeline.
					</p>
				</StaggerItem>
				<StaggerItem index={4} distance={HERO_DISTANCE.cta} dur={duration.slow} className="max-w-[230px]">
					<a
						className="btn mt-[50px] py-[2rem] px-[1.75rem] flex justify-center items-center w-full"
						href={`mailto:${userProfile.email}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						Contact Me
					</a>
				</StaggerItem>
			</StaggerContainer>
		</section>
	)
}
