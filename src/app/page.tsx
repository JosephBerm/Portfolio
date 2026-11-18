import type { Metadata } from 'next'
import myPortfolio from '@/lib/portfolioInformation'
import { sharedOpenGraph } from '@/lib/metadata'
import { personJsonLd } from '@/lib/structuredData'
import JsonLd from '@/components/JsonLd'
import IntroGate from '@/components/IntroGate'
import LoadingLogo from '@/components/LoadingLogo'
import Background from '@/components/Background'
import Navbar from '@/components/Navbar'
import SidePane from '@/components/SidePane'
import LinksList from '@/components/LinksList'
import SkyViewToggle from '@/components/sky/SkyViewToggle'
import Introduction from '@/components/Introduction'
import AboutMe from '@/components/AboutMe'
import Experience from '@/components/Experience'
import HowIBuild from '@/components/HowIBuild'
import Projects from '@/components/Projects'
import OtherProjects from '@/components/OtherProjects'
import ContactMe from '@/components/ContactMe'
import SkyLanding from '@/components/SkyLanding'
import AppFooter from '@/components/AppFooter'

// Title and description come from the root layout. The canonical URL and the share card's URL and text are
// home's own: left in the layout, the 404 would inherit them and unfurl as the home page
export const metadata: Metadata = {
	alternates: { canonical: '/' },
	openGraph: {
		...sharedOpenGraph,
		url: '/',
		description: 'Software engineer who built and owns the accounting platform 100+ car dealerships rely on. Founder of VendorX, online ordering for distributors and wholesalers.',
	},
}

const { email } = myPortfolio.userProfile

/** Home: server-composed sections, revealed when the intro loader lifts. */
export default function HomePage() {
	return (
		<>
			<JsonLd data={personJsonLd} />
			<IntroGate backdrop={<Background />} mark={<LoadingLogo />}>
				<Navbar />
				<SidePane side="left">
					<LinksList />
				</SidePane>
				<SidePane
					side="right"
					control={
						<SkyViewToggle
							// At the top of the page, in a window 386px tall or less, the navbar's 100px covers this control,
							// which sits above the 286px of rail below it, so there it has no box and no tab stop, and the
							// footer's control is the one left. The footer's hides itself with this query negated
							// (AppFooter.tsx), and skyView.ts reads it to know which control stands, so change the 386px
							// in all three places together
							className="[@media(max-height:386px)]:hidden"
						/>
					}
				>
					<a
						href={`mailto:${email}`}
						className="my-[20px] mx-auto p-[10px] font-mono text-xxs tracking-[0.2em] [writing-mode:vertical-rl]"
					>
						{email}
					</a>
				</SidePane>
				<div className="z-[1] relative" id="content">
					{/* data-sky-hide: the Hide/View control hides every section with the rest of the page's content (skyView.ts); the
					    footer hides its own copy, never the control in it */}
					<main data-sky-hide className="mx-auto w-full max-w-[1600px] min-h-screen px-[25px] md:px-[100px] lg:px-[150px] sm:px-[50px]">
						<Introduction />
						<AboutMe />
						<Experience />
						<HowIBuild />
						<Projects />
						<OtherProjects />
						<ContactMe />
					</main>
					<SkyLanding />
					<AppFooter />
				</div>
			</IntroGate>
		</>
	)
}
