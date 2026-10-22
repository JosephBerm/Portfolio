import CenteredShell from '@/components/CenteredShell'

/** Shared shell for /links and /links/schedule; persists across navigation between them. */
export default function LinksLayout({ children }: { children: React.ReactNode }) {
	return <CenteredShell>{children}</CenteredShell>
}
