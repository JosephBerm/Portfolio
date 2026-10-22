'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import type { ErrorInfo } from 'next/error'
import StatusScreen from '@/components/StatusScreen'

/** Recoverable error screen rendered inside the root layout. */
export default function ErrorPage({ error, retry }: ErrorInfo) {
	useEffect(() => {
		// Hook point for an error reporting service
		console.error(error)
	}, [error])

	return (
		<StatusScreen
			title="Something went wrong"
			description="An unexpected error occurred."
			action={
				<button type="button" onClick={() => retry()} className="btn py-[14px] px-[32px]">
					Try again
				</button>
			}
		/>
	)
}
