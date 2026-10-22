/**
 * Site identity — single source of truth for metadata, sitemap, robots and JSON-LD.
 * Leaf module: keep it free of UI imports.
 */
export const siteConfig = {
	name: 'Joseph Bermudez',
	/** Shown under the name on /links and used as the Person JSON-LD jobTitle. */
	jobTitle: 'Software Engineer & Founder',
	/** Public contact address. */
	email: 'jcbtechs@gmail.com',
	/** Canonical origin; production redirects the other host here. */
	url: 'https://www.josephbermudez.com',
	/** Mirrors --color-navy in globals.css (CSS can't import TS). */
	themeColor: '#0a192f',
	/** Default social share image, served from /public. */
	ogImage: {
		url: '/thumbnail.png',
		width: 593,
		height: 341,
		type: 'image/png',
	},
} as const

/** VendorX's site, linked from the home page, the /links page and the project data. */
export const VENDORX_URL = 'https://vendorxpro.com'
