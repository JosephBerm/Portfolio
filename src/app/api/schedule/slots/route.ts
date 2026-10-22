import { NextResponse, type NextRequest } from 'next/server'
import type { ApiError, SlotsResponse } from '@/lib/scheduleApi'
import { slotsQuerySchema } from '@/lib/validations'
import { getAvailableSlotsForDate } from '@/lib/google-calendar'
import { getClientKey, rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { isBookable } from '@/lib/scheduleTime'

/** Generous per-client budget per rate window (1 minute): a visitor clicks through a handful of dates. */
const MAX_REQUESTS = 30

export async function GET(request: NextRequest) {
	const limit = rateLimit({ key: `slots:${getClientKey(request.headers)}`, maxRequests: MAX_REQUESTS })
	if (!limit.success) return tooManyRequests()

	const dateParam = request.nextUrl.searchParams.get('date')

	const parsed = slotsQuerySchema.safeParse({ date: dateParam })
	if (!parsed.success) {
		return NextResponse.json<ApiError>(
			{ error: parsed.error.issues[0]?.message ?? 'Invalid date parameter' },
			{ status: 400 },
		)
	}

	const { date } = parsed.data
	// Non-bookable dates have no slots, so skip the Google API call.
	// 200 with [] rather than 400: useAvailableSlots shows static fallback slots on any non-OK response.
	const slots = isBookable(date) ? await getAvailableSlotsForDate(date) : []

	// Live calendar availability: never let a browser, proxy or CDN reuse it
	return NextResponse.json<SlotsResponse>(
		{ slots },
		{ headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } },
	)
}
