import BackgroundEffects from '@/components/BackgroundEffects'

/** Full-viewport dark shell with ambient orbs, shared by the /links routes and the status (404/error) screens. */
export default function CenteredShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="relative min-h-dvh bg-dark-navy overflow-hidden flex items-center justify-center">
			<BackgroundEffects />
			<main className="relative z-10 w-full max-w-[480px] px-6 py-12 md:py-16">{children}</main>
		</div>
	)
}
