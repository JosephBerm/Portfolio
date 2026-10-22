import { footer as MotionFooter } from 'motion/react-client'
import myPortfolio from '@/lib/portfolioInformation'
import { easing, duration } from '@/lib/animations'
import LinksList from '@/components/LinksList'

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
			className="flex justify-center items-center flex-col h-auto min-h-[70px] p-[15px] text-center text-light-slate"
		>
			<div className="block w-full max-w-[270px] mx-auto mb-[10px] md:hidden">
				<div className="[&_ul]:flex-row [&_ul]:justify-between [&_ul]:items-center">
					<LinksList />
				</div>
			</div>
			<div>
				<a
					href={links.github?.link ?? '#'}
					rel="noopener noreferrer"
					target="_blank"
					className="p-[10px] max-w-[85%] text-nowrap text-center"
				>
					<p className="text-[clamp(var(--text-xxs),5vw,var(--text-xs))] w-fit">
						Built by <br />
						{name}
					</p>
				</a>
			</div>
		</MotionFooter>
	)
}
