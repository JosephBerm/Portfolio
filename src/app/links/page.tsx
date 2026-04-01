import type { Metadata } from 'next'
import { LinksPage } from '@/components/links'

export const metadata: Metadata = {
	title: 'Joseph Bermudez | Links',
	description: 'Software Engineer & Founder — VendorX, LinkedIn, and more.',
	openGraph: {
		title: 'Joseph Bermudez | Links',
		description: 'Software Engineer & Founder — VendorX, LinkedIn, and more.',
		url: '/links',
		siteName: 'Joseph Bermudez',
		images: [{ url: '/thumbnail.png', alt: 'Joseph Bermudez portfolio thumbnail.' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Joseph Bermudez | Links',
		description: 'Software Engineer & Founder — VendorX, LinkedIn, and more.',
		images: ['/thumbnail.png'],
	},
	alternates: {
		canonical: '/links',
	},
}

export default function LinksRoute() {
	return <LinksPage />
}
