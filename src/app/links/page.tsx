import type { Metadata } from 'next'
import { createPageMetadata } from '@/lib/metadata'
import LinksPage from '@/components/links/LinksPage'

export const metadata: Metadata = createPageMetadata({
	title: 'Links',
	description: 'Links for Joseph Bermudez, software engineer and founder of VendorX. Visit VendorX, connect on LinkedIn, or book a call.',
	path: '/links',
})

export default function LinksRoute() {
	return <LinksPage />
}
