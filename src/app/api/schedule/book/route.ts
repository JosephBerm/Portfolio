import { after, NextResponse, type NextRequest } from 'next/server'
import type { ApiError, BookingResponse } from '@/lib/scheduleApi'
import { bookingBodySchema } from '@/lib/validations'
import { isConfigured, isSlotAvailable, createBooking } from '@/lib/google-calendar'
import { isConfigured as emailConfigured, sendBookingConfirmation } from '@/lib/email'
import { getClientKey, rateLimit, tooManyRequests } from '@/lib/rate-limit'
import { getUpcomingSlots, isBookable } from '@/lib/scheduleTime'
import { siteConfig } from '@/lib/site'

/** Max booking attempts per client within the rate window (1 minute). */
const MAX_REQUESTS = 5
/** Booking payloads are tiny; anything larger is abuse. */
const MAX_BODY_BYTES = 2_048

/**
 * Reads the body as text, or returns null once it passes `limit` bytes. Content-Length alone can't be trusted:
 * chunked requests don't send it, and Route Handlers have no built-in body size limit.
 */
async function readBodyWithLimit(request: NextRequest, limit: number): Promise<string | null> {
	const reader = request.body?.getReader()
	if (!reader) return ''
	const decoder = new TextDecoder()
	let text = ''
	let size = 0
	for (;;) {
		const { done, value } = await reader.read()
		if (done) return text + decoder.decode()
		size += value.byteLength
		if (size > limit) {
			await reader.cancel()
			return null
		}
		text += decoder.decode(value, { stream: true })
	}
}

export async function POST(request: NextRequest) {
	// ── Rate limiting ───────────────────────────────────────────
	const limit = rateLimit({ key: `book:${getClientKey(request.headers)}`, maxRequests: MAX_REQUESTS })
	if (!limit.success) return tooManyRequests()

	// ── Request shape ───────────────────────────────────────────
	// JSON only, compared on the exact MIME type: a cross-site page can send a CORS-safelisted type without a
	// preflight (even `text/plain; charset=application/json`, so a substring check isn't enough). application/json
	// forces a preflight, and Next's automatic OPTIONS reply has no Access-Control-Allow-* headers, so the browser
	// never sends the POST. Route Handlers get no built-in Origin check (only Server Actions do).
	const mimeType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
	if (mimeType !== 'application/json') {
		return NextResponse.json<ApiError>({ error: 'Unsupported content type' }, { status: 415 })
	}

	// Defense in depth: browsers label cross-site requests with Fetch Metadata. Clients that don't send it still pass.
	const fetchSite = request.headers.get('sec-fetch-site')
	if (fetchSite && fetchSite !== 'same-origin') {
		return NextResponse.json<ApiError>({ error: 'Forbidden' }, { status: 403 })
	}

	// Fast path; the streaming read below enforces the limit when Content-Length is missing or wrong
	if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
		return NextResponse.json<ApiError>({ error: 'Request too large' }, { status: 413 })
	}

	// ── Validate body ───────────────────────────────────────────
	let body: unknown
	try {
		const raw = await readBodyWithLimit(request, MAX_BODY_BYTES)
		if (raw === null) {
			return NextResponse.json<ApiError>({ error: 'Request too large' }, { status: 413 })
		}
		body = JSON.parse(raw)
	} catch {
		return NextResponse.json<ApiError>({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const parsed = bookingBodySchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json<ApiError>(
			{ error: parsed.error.issues[0]?.message ?? 'Please check your details and try again.' },
			{ status: 400 },
		)
	}

	const { dateISO, hour, visitorName, visitorEmail } = parsed.data

	// ── Server-side business rule validation (owner timezone) ──
	if (!isBookable(dateISO)) {
		return NextResponse.json<ApiError>({ error: "That date isn't available. Please pick another one." }, { status: 400 })
	}

	// Also rejects hours that already started today
	if (!getUpcomingSlots(dateISO).includes(hour)) {
		return NextResponse.json<ApiError>({ error: "That time isn't available. Please pick another one." }, { status: 400 })
	}

	// ── Google Calendar check ───────────────────────────────────
	if (!isConfigured) {
		return NextResponse.json<ApiError>(
			{ error: `Online booking isn't available right now. Please email me at ${siteConfig.email}.` },
			{ status: 503 },
		)
	}

	// ── Create the booking ──────────────────────────────────────
	try {
		// Final availability check to prevent double-booking (throws if Google can't verify, so it fails closed)
		if (!(await isSlotAvailable(dateISO, hour))) {
			return NextResponse.json<ApiError>(
				{ error: 'This time slot was just booked. Please pick another time.' },
				{ status: 409 },
			)
		}

		const result = await createBooking({ dateISO, hour, visitorName, visitorEmail })

		// Send the confirmation after the response; `after` keeps the invocation alive until it settles
		if (emailConfigured) {
			after(() =>
				sendBookingConfirmation({ visitorName, visitorEmail, dateISO, hour, meetLink: result.meetLink })
					.catch((err) => console.error('[api/schedule/book] Email send failed:', err instanceof Error ? err.message : err)),
			)
		}

		// Minimal DTO: the UI only reads meetLink (htmlLink is the owner's private calendar URL)
		return NextResponse.json<BookingResponse>({ meetLink: result.meetLink }, { status: 201 })
	} catch (error) {
		// Message only: Google client errors embed the request body (visitor name/email)
		console.error('[api/schedule/book] Booking failed:', error instanceof Error ? error.message : error)
		return NextResponse.json<ApiError>(
			{ error: 'Something went wrong with your booking. Please try again.' },
			{ status: 502 },
		)
	}
}
