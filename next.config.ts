import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// Auto-memoizes components — stable in Next.js 16, no manual React.memo needed
	reactCompiler: true,

	// Prefer AVIF (smaller file size) with WebP fallback
	images: {
		formats: ['image/avif', 'image/webp'],
	},

	experimental: {
		// Caches Turbopack builds to disk for faster dev server restarts
		turbopackFileSystemCacheForDev: true,

		// Tree-shake barrel re-exports for production webpack builds.
		// Turbopack handles this automatically in dev, but the webpack
		// production bundler needs explicit hints for these packages.
		optimizePackageImports: ['motion', 'lodash', 'zustand'],
	},
}

export default nextConfig
