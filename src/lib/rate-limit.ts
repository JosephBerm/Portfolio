/**
 * Minimal in-memory sliding-window rate limiter.
 * Sufficient for a portfolio site — no external dependency needed.
 * Note: resets on serverless cold starts, which is acceptable here.
 */

const store = new Map<string, number[]>()

/** Periodic cleanup interval to prevent unbounded memory growth. */
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
	const now = Date.now()
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
	lastCleanup = now

	const cutoff = now - windowMs
	for (const [key, timestamps] of store) {
		const valid = timestamps.filter((t) => t > cutoff)
		if (valid.length === 0) store.delete(key)
		else store.set(key, valid)
	}
}

interface RateLimitResult {
	success: boolean
	remaining: number
}

export function rateLimit(options: {
	key: string
	windowMs: number
	maxRequests: number
}): RateLimitResult {
	const { key, windowMs, maxRequests } = options
	const now = Date.now()
	const cutoff = now - windowMs

	cleanup(windowMs)

	const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

	if (timestamps.length >= maxRequests) {
		return { success: false, remaining: 0 }
	}

	timestamps.push(now)
	store.set(key, timestamps)

	return { success: true, remaining: maxRequests - timestamps.length }
}
