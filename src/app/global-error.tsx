'use client' // Error boundaries must be Client Components

import type { ErrorInfo } from 'next/error'
import ErrorPage from './error'
import { golos, firaCode } from './fonts'
import './globals.css'

/** Replaces the root layout when it fails, so it brings its own document, styles and fonts. */
export default function GlobalError(props: ErrorInfo) {
	return (
		<html lang="en" className={`${golos.variable} ${firaCode.variable}`}>
			<body className="min-h-screen">
				<title>Something went wrong</title>
				<ErrorPage {...props} />
			</body>
		</html>
	)
}
