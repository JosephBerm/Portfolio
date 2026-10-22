import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

/** Indexable routes; each page declares the same path as its canonical URL. */
const ROUTES = ['/', '/links', '/links/schedule']

export default function sitemap(): MetadataRoute.Sitemap {
	return ROUTES.map((path) => ({ url: new URL(path, siteConfig.url).href }))
}
