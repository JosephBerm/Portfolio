'use client'

import { usePortfolioStore } from '@/store'
import { FadeInSection, RevealItem } from '@/components/motion'

export default function ContactMe() {
	const { userProfile } = usePortfolioStore()
	return (
		<FadeInSection
			id="contact"
			className="portfolio-section max-w-[600px] mx-auto mb-[50px] md:mb-[100px] text-center"
			isNumbered
			threshold={0.4}
			stagger={0.08}
		>
			<RevealItem>
				<h2 className="section-header lineless block mb-[20px] text-green font-mono text-base font-normal [&::before]:bottom-[1px]">
					What&apos;s Next?
				</h2>
			</RevealItem>
			<RevealItem>
				<h2 className="text-[clamp(35px,5vw,55px)] text-lightest-slate font-semibold">Get In Touch</h2>
			</RevealItem>
			<RevealItem>
				<p className="text-[clamp(var(--text-xs),5vw,var(--text-base))] leading-[1.5]">
					I&apos;m always on the lookout for new ways to innovate. If you&apos;d like to explore an idea together or just
					want to say hi, feel free to shoot me an email. I&apos;ll do my best to respond promptly and look forward to
					hearing from you!
				</p>
			</RevealItem>
			<RevealItem>
				<a
					className="btn py-[2rem] px-[2.75rem] text-xs mt-[50px] inline-block"
					href={`mailto:${userProfile.email}?subject=Inquiry%20from%20Your%20Portfolio%20Website`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Say Hello
				</a>
			</RevealItem>
		</FadeInSection>
	)
}
