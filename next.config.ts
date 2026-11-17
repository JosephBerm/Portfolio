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
 * - worker-src names the sky worker's source: Turbopack emits it as a same-origin chunk, never a blob: URL
 * - connect-src falls back to default-src, except on previews, which add the toolbar's endpoints
 * - frame-src: the site embeds no frames, so only previews (the toolbar) allow any
 * Add a domain here before loading any third-party script, style, font, frame or endpoint.
 */
const contentSecurityPolicy = `
	default-src 'self';
	script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${toolbar('https://vercel.live')};
	style-src 'self' 'unsafe-inline'${toolbar('https://vercel.live')};
	img-src 'self' data:${toolbar('https://vercel.live https://vercel.com')};
	font-src 'self'${toolbar('https://vercel.live https://assets.vercel.com')};
	worker-src 'self';
	${isPreview ? "connect-src 'self' https://vercel.live wss://ws-us3.pusher.com;" : ''}
	frame-src ${isPreview ? "'self' https://vercel.live" : "'none'"};
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
	// A page that opens this site in a new window gets no handle on it. Previews keep the popups the page
	// opens itself attached, which the toolbar's sign-in uses.
	{ key: 'Cross-Origin-Opener-Policy', value: isPreview ? 'same-origin-allow-popups' : 'same-origin' },
]

const nextConfig: NextConfig = {
	// Don't advertise the framework in response headers
	poweredByHeader: false,

	// Checks every <Link href> and router call against the routes that exist. The route types come from
	// `next typegen`, which `npm run type-check` runs first. A href built at runtime needs `as Route`.
	typedRoutes: true,

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

	experimental: {
		// `next dev` and `next build` stop once with a reminder when the installed Next.js has a published
		// security advisory, and `next upgrade --agent` moves to the latest safe release. This is the default
		// policy, written down so the choice is visible (set by `next upgrade --agent=security`).
		agentUpgrade: 'security',
	},
}

export default nextConfig
