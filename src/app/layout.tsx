import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
	themeColor: '#0a192f',
}

export const metadata: Metadata = {
	title: 'Joseph Bermudez',
	description: 'Joseph Bermudez: Innovative Software Engineer Shaping the Future of Technology',
	metadataBase: new URL('https://josephbermudez.com'),
	openGraph: {
		title: 'Joseph Bermudez',
		description: 'Innovative Software Engineer Shaping the Future of Technology',
		url: 'https://josephbermudez.com',
		siteName: 'Joseph Bermudez Portfolio',
		images: [
			{
				url: '/thumbnail.png',
				alt: 'Thumbnail of my portfolio website.',
			},
		],
		type: 'website',
	},
	icons: {
		icon: '/favicon.ico',
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<head>
				<script
					src="https://kit.fontawesome.com/d2df4b1e2b.js"
					crossOrigin="anonymous"
					async
				/>
			</head>
			<body className="min-h-screen">
				<div id="root" className="min-h-screen grid grid-rows-[1fr_auto] grid-cols-[100%]">
					{children}
				</div>
			</body>
		</html>
	)
}
