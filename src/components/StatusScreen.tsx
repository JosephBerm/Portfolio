import type { ReactNode } from 'react'
import CenteredShell from '@/components/CenteredShell'
import ProfileIdentity from '@/components/ProfileIdentity'

interface StatusScreenProps {
	title: string
	description: string
	/** Primary recovery action: a <Link> or <button> styled with .btn */
	action: ReactNode
}

/** On-brand full-screen status message shared by the not-found and error boundaries. */
export default function StatusScreen({ title, description, action }: StatusScreenProps) {
	return (
		<CenteredShell>
			<ProfileIdentity title={title} subtitle={description} />
			<div className="flex justify-center">{action}</div>
		</CenteredShell>
	)
}
