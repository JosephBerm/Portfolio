/**
 * Minimal in-memory sliding-window rate limiter.
 * Sufficient for a portfolio site — no external dependency needed.
 * Note: resets on serverless cold starts, which is acceptable here.
 */

import { NextResponse } from 'next/server'
import type { ApiError } from './scheduleApi'

/**
 * The one window every key is counted over. Cleanup prunes all keys with it, so a per-caller window would
 * let a shorter one prune timestamps that a longer-window key still counts.
 */
export const RATE_LIMIT_WINDOW_MS = 60_000

const store = new Map<string, number[]>()

/** Periodic cleanup interval to prevent unbounded memory growth. */
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanup() {
	const now = Date.now()
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
	lastCleanup = now

	const cutoff = now - RATE_LIMIT_WINDOW_MS
	for (const [key, timestamps] of store) {
		const valid = timestamps.filter((t) => t > cutoff)
		if (valid.length === 0) store.delete(key)
		else store.set(key, valid)
	}
}

interface RateLimitResult {
	success: boolean
}

/** Allows `maxRequests` per `key` within RATE_LIMIT_WINDOW_MS. */
export function rateLimit(options: {
	key: string
	maxRequests: number
}): RateLimitResult {
	const { key, maxRequests } = options
	const now = Date.now()
	const cutoff = now - RATE_LIMIT_WINDOW_MS

	cleanup()

	const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

	if (timestamps.length >= maxRequests) {
		return { success: false }
	}

	timestamps.push(now)
	store.set(key, timestamps)

	return { success: true }
}

/**
 * IPv6 addresses collapse to their /64 prefix (one subscriber's allocation), so rotating the host bits can't
 * mint new keys. IPv4 and IPv4-mapped addresses (and anything unparseable) are returned as they are.
 */
function toNetworkKey(ip: string): string {
	if (!ip.includes(':') || ip.includes('.')) return ip
	// Expand '::' so the first four groups are always the network prefix
	const [head = '', tail] = ip.split('::')
	const headGroups = head ? head.split(':') : []
	const tailGroups = tail ? tail.split(':') : []
	const groups =
		tail === undefined
			? headGroups
			: [...headGroups, ...Array<string>(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill('0'), ...tailGroups]
	return `${groups.slice(0, 4).map((group) => parseInt(group || '0', 16).toString(16)).join(':')}::/64`
}

/**
 * Best-effort client identity for rate-limit keys: the client IP, with IPv6 reduced to its /64. The host's proxy
 * sets these headers (Vercel overwrites both); Next.js only fills `x-forwarded-for` when it's missing, so
 * self-hosting needs a proxy that overwrites them.
 */
export function getClientKey(headers: Headers): string {
	const ip = headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	return toNetworkKey(ip)
}

/** 429 shared by the /api/schedule/* handlers, with Retry-After in seconds. */
export function tooManyRequests() {
	return NextResponse.json<ApiError>(
		{ error: 'Too many requests. Please try again shortly.' },
		{ status: 429, headers: { 'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) } },
	)
}
