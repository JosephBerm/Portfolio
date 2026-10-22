import myPortfolio from '@/lib/portfolioInformation'
import { FadeInSection, RevealItem } from '@/components/motion'

const { email } = myPortfolio.userProfile

export default function ContactMe() {
	return (
		// data-sky-quiet: the home sky keeps bright stars clear of this copy
		<FadeInSection
			id="contact"
			data-sky-quiet
			className="max-w-[600px] mx-auto mb-[50px] md:mb-[100px] text-center"
			isNumbered
		>
			<RevealItem>
				<h2 className="section-header lineless block mb-[20px] text-green font-mono text-base font-normal [&::before]:bottom-[1px]">
					Contact
				</h2>
			</RevealItem>
			<RevealItem>
				<h2 className="text-[clamp(35px,5vw,55px)] text-lightest-slate font-semibold">Get In Touch</h2>
			</RevealItem>
			<RevealItem>
				<p className="text-[clamp(var(--text-xs),5vw,var(--text-base))] leading-[1.5]">
					I&apos;m always glad to hear from people. If you have a project in mind or a question about
					VendorX, send me a note and I&apos;ll get back to you.
				</p>
			</RevealItem>
			<RevealItem>
				<a
					className="btn py-[2rem] px-[2.75rem] text-xs mt-[50px] inline-block"
					href={`mailto:${email}?subject=Hello%20from%20josephbermudez.com`}
					rel="noopener noreferrer"
					target="_blank"
				>
					Say Hello
				</a>
			</RevealItem>
		</FadeInSection>
	)
}
