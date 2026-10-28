import myPortfolio from '@/lib/portfolioInformation'
import { duration } from '@/lib/animations'
import { VENDORX_URL } from '@/lib/site'
import { StaggerContainer, StaggerItem } from '@/components/motion'

/** Hero entrance distance by hierarchy — heavier elements travel further. */
const HERO_DISTANCE = { greeting: 25, heading: 40, paragraph: 30, cta: 20 } as const

const { name, email } = myPortfolio.userProfile

export default function Introduction() {
	return (
		// data-sky-quiet: the home sky keeps bright stars clear of this copy, and a shooting star behind it dims to what the copy can take
		<section data-sky-quiet className="flex flex-col justify-center items-start min-h-screen h-auto p-0 pt-[100px]">
			{/* The home sky measures this copy net of every transform translation, and again 1.5s after the reveal (ENTRANCE_SETTLE_MS in src/components/sky/mountSky.ts): entrances may translate and fade, but this copy and its ancestors keep no static transform translation and no opacity below 1 at rest */}
			<StaggerContainer staggerDelay={0.1}>
				<StaggerItem index={0} distance={HERO_DISTANCE.greeting} dur={duration.slow}>
					<p className="text-green font-mono text-[clamp(var(--text-sm),5vw,var(--text-base))] font-normal leading-[1.1] m-0 mb-[20px] ml-[2px] sm:mb-[30px] sm:ml-[4px]">
						Hi, my name is
					</p>
				</StaggerItem>
				<StaggerItem index={1} distance={HERO_DISTANCE.heading} dur={duration.entrance}>
					{/* The page's only h1: the greeting above and the tagline below are styled text, not headings */}
					<h1 className="text-lightest-slate leading-[1.1] m-0 text-[clamp(35px,8vw,75px)]">
						{name}.
					</h1>
				</StaggerItem>
				<StaggerItem index={2} distance={HERO_DISTANCE.heading} dur={duration.entrance}>
					<p className="text-slate font-semibold leading-[0.9] mt-[5px] m-0 text-[clamp(35px,8vw,75px)] text-balance">
						I build software 100+&nbsp;dealerships rely on.
					</p>
				</StaggerItem>
				<StaggerItem index={3} distance={HERO_DISTANCE.paragraph} dur={duration.slow}>
					<p className="mt-[20px] max-w-[540px]">
						At Relativistic Engine, I built and own the accounting platform inside our automotive software,
						where every deal must balance. I also founded{' '}
						<a className="inline-link" href={VENDORX_URL} target="_blank" rel="noopener noreferrer">
							VendorX
						</a>
						, an online ordering company for distributors and wholesalers. I designed and built its software,
						directing AI coding agents held to my plans and the checks I set. Our first customer has signed
						and goes live in early 2027.
					</p>
				</StaggerItem>
				<StaggerItem index={4} distance={HERO_DISTANCE.cta} dur={duration.slow} className="max-w-[230px]">
					<a
						className="btn mt-[50px] py-[2rem] px-[1.75rem] flex justify-center items-center w-full"
						href={`mailto:${email}`}
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
