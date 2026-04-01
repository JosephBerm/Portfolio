import type { Metadata } from 'next'
import SchedulePage from '@/components/links/schedule/SchedulePage'

export const metadata: Metadata = {
	title: 'Joseph Bermudez | Schedule',
	description: 'Book a time to chat with Joseph Bermudez — 60 min call.',
	openGraph: {
		title: 'Joseph Bermudez | Schedule',
		description: 'Book a time to chat with Joseph Bermudez — 60 min call.',
		url: '/links/schedule',
		siteName: 'Joseph Bermudez',
		images: [{ url: '/thumbnail.png', alt: 'Joseph Bermudez portfolio thumbnail.' }],
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Joseph Bermudez | Schedule',
		description: 'Book a time to chat with Joseph Bermudez — 60 min call.',
		images: ['/thumbnail.png'],
	},
	alternates: {
		canonical: '/links/schedule',
	},
}

export default function ScheduleRoute() {
	return <SchedulePage />
}
