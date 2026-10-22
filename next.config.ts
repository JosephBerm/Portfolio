import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'
/** Vercel preview deployments, where Vercel injects its toolbar (https://vercel.com/docs/vercel-toolbar/managing-toolbar). */
const isPreview = process.env.VERCEL_ENV === 'preview'

/** The toolbar's sources for one directive, on previews only, so production keeps the strict policy. */
const toolbar = (sources: string) => (isPreview ? ` ${sources}` : '')

/**
 * Static Content-Security-Policy (no nonces), so every page stays statically prerendered.
 * - 'unsafe-inline' scripts: Next.js inline RSC payload; styles: Motion's inline style attributes
 * - 'unsafe-eval' only in development (React debugging tooling)
 * - connect-src and frame-src fall back to default-src, except on previews, which add the toolbar's endpoints
 * Add a domain here before loading any third-party script, style, font or endpoint.
 */
const contentSecurityPolicy = `
	default-src 'self';
	script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${toolbar('https://vercel.live')};
	style-src 'self' 'unsafe-inline'${toolbar('https://vercel.live')};
	img-src 'self' blob: data:${toolbar('https://vercel.live https://vercel.com')};
	font-src 'self'${toolbar('https://vercel.live https://assets.vercel.com')};
	${isPreview ? "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com;" : ''}
	${isPreview ? "frame-src 'self' https://vercel.live;" : ''}
	object-src 'none';
	base-uri 'self';
	form-action 'self';
	frame-ancestors 'none';
`
	.replace(/\s{2,}/g, ' ')
	.trim()

/** Sent on every route, including /public files and Route Handlers. HSTS already comes from the host (Vercel). */
const securityHeaders = [
	{ key: 'X-Content-Type-Options', value: 'nosniff' },
	// Legacy fallback for frame-ancestors 'none'
	{ key: 'X-Frame-Options', value: 'DENY' },
	{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
	{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

const nextConfig: NextConfig = {
	// Don't advertise the framework in response headers
	poweredByHeader: false,

	// Auto-memoizes components. Pin the memoization guarantee so compiler upgrades
	// (or a switch to the Rust port) can't change existing useMemo/useCallback semantics.
	reactCompiler: {
		environment: {
			enablePreserveExistingMemoizationGuarantees: true,
		},
	},

	images: {
		// Prefer AVIF (smaller file size) with WebP fallback
		formats: ['image/avif', 'image/webp'],
		// Only statically imported images (src/assets) may be optimized; any other path returns 400
		localPatterns: [{ pathname: '/_next/static/media/**', search: '' }],
	},

	async headers() {
		return [
			{ source: '/(.*)', headers: securityHeaders },
			// /resume.pdf skips the page CSP: its object-src 'none' can block the browser's built-in PDF viewer.
			// Only that file: any other *.pdf URL is an HTML 404 and keeps the CSP. Add new PDFs in public/ to the lookahead.
			{ source: '/((?!resume\\.pdf$).*)', headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy }] },
		]
	},
}

export default nextConfig
