import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			// JSON endpoints: nothing to index, and /api/schedule/slots queries Google Calendar
			disallow: '/api/',
		},
		sitemap: new URL('/sitemap.xml', siteConfig.url).href,
	}
}
