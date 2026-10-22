import type { Metadata } from 'next'
import Link from 'next/link'
import StatusScreen from '@/components/StatusScreen'

export const metadata: Metadata = {
	title: 'Not Found',
}

/** Branded 404 for notFound() calls and every unmatched URL. */
export default function NotFound() {
	return (
		<StatusScreen
			title="404"
			description="This page doesn't exist."
			action={
				<Link href="/" className="btn py-[14px] px-[32px]">
					Back to home
				</Link>
			}
		/>
	)
}
