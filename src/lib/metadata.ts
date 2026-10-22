import type { Metadata } from 'next'
import { siteConfig } from './site'

/**
 * Open Graph defaults for every route. Metadata merges shallowly, so a page that sets `openGraph`
 * must spread these back in (createPageMetadata does). og:title / og:description and twitter:* are
 * left out on purpose: Next.js fills them from the route's resolved title and description.
 */
export const sharedOpenGraph = {
	siteName: siteConfig.name,
	type: 'website',
	images: [{ ...siteConfig.ogImage, alt: `${siteConfig.name} portfolio thumbnail.` }],
} satisfies Metadata['openGraph']

interface PageMetadataOptions {
	/** Short title rendered by the root template ("<name> | <title>"), or `{ absolute }` to bypass it. */
	title: string | { absolute: string }
	description: string
	/** Route path, e.g. '/links': drives both the canonical URL and og:url. */
	path: string
}

/** Metadata for a child route, built on the shared Open Graph defaults. */
export function createPageMetadata({ title, description, path }: PageMetadataOptions): Metadata {
	return {
		title,
		description,
		alternates: { canonical: path },
		openGraph: { ...sharedOpenGraph, url: path },
	}
}
