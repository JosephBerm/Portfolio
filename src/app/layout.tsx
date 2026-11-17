import type { Metadata, Viewport } from 'next'
import { siteConfig } from '@/lib/site'
import { sharedOpenGraph } from '@/lib/metadata'
import MotionProvider from '@/components/MotionProvider'
import { golos, firaCode } from './fonts'
import './globals.css'

export const viewport: Viewport = {
	themeColor: siteConfig.themeColor,
}

export const metadata: Metadata = {
	metadataBase: new URL(siteConfig.url),
	title: {
		// Home uses the default; child pages pass a short title for the template
		default: `${siteConfig.name} | Software Engineer`,
		template: `${siteConfig.name} | %s`,
	},
	description:
		'Joseph Bermudez built and owns the accounting platform 100+ car dealerships rely on, and founded VendorX, online ordering for distributors and wholesalers.',
	// Only what every route shares. A page that sets no `openGraph` (the 404) inherits this whole object, so a
	// page's own og:url and share text live with that page: src/app/page.tsx and createPageMetadata
	openGraph: sharedOpenGraph,
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en" className={`${golos.variable} ${firaCode.variable}`} data-scroll-behavior="smooth">
			<body className="min-h-screen">
				<div id="root" className="min-h-screen grid grid-rows-[1fr_auto] grid-cols-[100%]">
					<MotionProvider>{children}</MotionProvider>
				</div>
			</body>
		</html>
	)
}
