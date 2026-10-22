/** How I direct and check AI coding agents (the #ai section). Keep each step and the boundary under about 35 words. */
const aiWorkflow: IAiWorkflow = {
	steps: [
		"I plan a feature before an agent writes its code: what it must do, how it fits the system and how I'll know it works.",
		"I write the rules the code must follow, from coding standards to automated checks that block changes that break the system's structure or let the screens and server fall out of step.",
		'I built custom tools and reusable instructions that teach the agents how my project works, so they follow the patterns I set instead of guessing.',
		"Nothing ships on an agent's word. I read every change before it merges, and it must pass the automated tests and checks I require. On VendorX, some of them check that one business cannot see another's data.",
	],
	boundary:
		'I also decide where AI stops. In my plan for a leadership briefing, AI writes only the wording and never sees numbers or customer data. Code fills in every figure, and 12 checks screen each draft.',
	tools: ['xUnit', 'Vitest', 'Playwright', 'ESLint', 'GitHub Actions', 'Claude Code', 'MCP servers', 'Agent skills'],
}

/**
 * Content for the #ai section. The intro paragraph stays in HowIBuild's JSX, like the About Me and Contact prose;
 * the boundary lives here with the steps because it is the closing practice from the original list.
 * Its own module, not part of portfolioInformation's default export: only the Server Component HowIBuild reads it,
 * and Client Components import that whole object, which would ship this copy in client JS.
 */
export interface IAiWorkflow {
	/** The order I work in when directing AI coding agents, one step per item. */
	steps: string[]
	/** Where I keep AI out of the work: the closing practice, shown apart from the steps. */
	boundary: string
	/** Tools behind the steps, listed by name so the prose can stay plain English. */
	tools: string[]
}

export default aiWorkflow
