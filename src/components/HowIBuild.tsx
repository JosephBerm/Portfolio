import aiWorkflow from '@/lib/aiWorkflow'
import { cn } from '@/lib'
import { FadeInSection, RevealItem, ScrollRevealList } from '@/components/motion'
import TechList from '@/components/TechList'
import { BODY_TEXT } from '@/components/styles'
import styles from './HowIBuild.module.css'

const { steps, boundary, tools } = aiWorkflow

/** "How I Direct AI Agents" (#ai): how I plan, set rules for and check the work of AI coding agents, where AI stops, and the tools behind the work. */
export default function HowIBuild() {
	return (
		<FadeInSection id="ai" isNumbered>
			<RevealItem>
				<h2 className="section-header">How I Direct AI Agents</h2>
			</RevealItem>
			{/* One reading width for all body copy; the heading's rule still spans the section, as in the other sections */}
			<div className="max-w-[700px]">
				<RevealItem>
					<p className="mb-[25px]">
						Every day at Relativistic Engine, I put AI coding agents to work, and I do the same on VendorX. The
						agents add speed, but the engineering stays with me: I design the system, set the rules they follow,
						check what they produce and answer for the result. This is what people now call agentic engineering.
					</p>
				</RevealItem>
				{/* Fade only, so heading, intro and steps stay in order on a nav jump or fast scroll (steps already in view fade in together); steps below the fold still rise as they scroll in */}
				<RevealItem distance={0}>
					<ScrollRevealList as="ol" items={steps} className={cn(styles.steps, BODY_TEXT)} />
				</RevealItem>
				{/* The boundary and the tools follow the steps in the section's stagger, like the body copy in the other sections */}
				<RevealItem>
					{/* Left padding lines the text up with the step text: 2px bar + 34px = the numeral column plus its gap */}
					<p
						className={cn(
							'mt-[30px] rounded-r-[4px] border-l-2 border-green bg-light-navy py-[20px] pr-[20px] pl-[34px] shadow-card text-light-slate',
							'min-[600px]:py-[25px] min-[600px]:pr-[25px]',
							BODY_TEXT
						)}
					>
						{boundary}
					</p>
				</RevealItem>
				<RevealItem>
					{/* Aligned columns like the About Me skills list: 2 on phones, 4 from 600px */}
					<TechList
						items={tools}
						aria-label="Tools I use for this work"
						className="mt-[40px] grid grid-cols-2 gap-x-[20px] gap-y-[10px] min-[600px]:grid-cols-4"
						itemClassName="text-xs text-light-slate"
					/>
				</RevealItem>
			</div>
		</FadeInSection>
	)
}
