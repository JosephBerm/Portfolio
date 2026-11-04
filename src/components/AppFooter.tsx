import { footer as MotionFooter } from 'motion/react-client'
import myPortfolio from '@/lib/portfolioInformation'
import { easing, duration } from '@/lib/animations'
import LinksList from '@/components/LinksList'
import SkyPauseButton from '@/components/sky/SkyPauseButton'

const { name, links } = myPortfolio.userProfile

/** Site footer; fades in once when 30% visible. */
export default function AppFooter() {
	return (
		// data-sky-quiet: the home sky keeps bright stars clear of this copy
		<MotionFooter
			data-sky-quiet
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true, amount: 0.3 }}
			transition={{ duration: duration.slow, ease: easing.easeOut }}
			className="flex justify-center items-center flex-col h-auto min-h-[70px] p-[15px] text-center text-white"
		>
			<div className="block w-full max-w-[270px] mx-auto mb-[10px] md:hidden">
				<div className="[&_ul]:flex-row [&_ul]:justify-between [&_ul]:items-center">
					<LinksList />
				</div>
			</div>
			<div className="relative">
				<a
					href={links.github?.link ?? '#'}
					rel="noopener noreferrer"
					target="_blank"
					className="p-[10px] text-nowrap text-center"
				>
					<p className="text-[clamp(var(--text-xxs),5vw,var(--text-xs))] w-fit">
						Built by <br />
						{name}
					</p>
				</a>
				{/* Only where the right rail shows no control: below md, and in the short windows where the rail hides its own. The 386px is the rail's own limit in page.tsx, negated rather than written as a min-height, so no window height (a fractional one, say) shows both controls or neither; change the two together. The navbar has slid away by here, so without this a phone would have no pause at the page's end.
				Absolute, so its late appearance shifts nothing; anchored to the link, so it clears the link at every width and moves with the text. After the link in the document, so Tab reaches it last in the footer */}
				<SkyPauseButton className="absolute bottom-0 left-full ml-[24px] md:not-[@media(max-height:386px)]:hidden" />
			</div>
		</MotionFooter>
	)
}
