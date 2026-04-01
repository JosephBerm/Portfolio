import { NextRequest, NextResponse } from 'next/server'
import { bookingBodySchema } from '@/lib/validations'
import { isConfigured, isSlotAvailable, createBooking } from '@/lib/google-calendar'
import { isConfigured as emailConfigured, sendBookingConfirmation } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { isBookable, getAvailableSlots } from '@/lib/scheduleConfig'

/** Max booking attempts per IP within the rate window. */
const MAX_REQUESTS = 5
const WINDOW_MS = 60_000 // 1 minute

export async function POST(request: NextRequest) {
	// ── Rate limiting ───────────────────────────────────────────
	const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	const limit = rateLimit({ key: `book:${ip}`, windowMs: WINDOW_MS, maxRequests: MAX_REQUESTS })

	if (!limit.success) {
		return NextResponse.json(
			{ error: 'Too many requests. Please try again shortly.' },
			{ status: 429 },
		)
	}

	// ── Validate body ───────────────────────────────────────────
	let body: unknown
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
	}

	const parsed = bookingBodySchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(
			{ error: parsed.error.issues[0]?.message ?? 'Invalid request' },
			{ status: 400 },
		)
	}

	const { dateISO, hour, visitorName, visitorEmail } = parsed.data

	// ── Server-side business rule validation ────────────────────
	const date = new Date(dateISO + 'T12:00:00') // noon to avoid TZ date shift
	if (!isBookable(date)) {
		return NextResponse.json({ error: 'Selected date is not available' }, { status: 400 })
	}

	const validHours = getAvailableSlots()
	if (!validHours.includes(hour)) {
		return NextResponse.json({ error: 'Selected time is not available' }, { status: 400 })
	}

	// ── Google Calendar check ───────────────────────────────────
	if (!isConfigured) {
		return NextResponse.json(
			{ error: 'Scheduling is not configured. Please contact me directly.' },
			{ status: 503 },
		)
	}

	// Final availability check to prevent double-booking
	const available = await isSlotAvailable(dateISO, hour)
	if (!available) {
		return NextResponse.json(
			{ error: 'This time slot was just booked. Please pick another time.' },
			{ status: 409 },
		)
	}

	// ── Create the booking ──────────────────────────────────────
	try {
		const result = await createBooking({ dateISO, hour, visitorName, visitorEmail })

		// Send confirmation email (fire-and-forget — don't delay the response)
		if (emailConfigured) {
			sendBookingConfirmation({
				visitorName,
				visitorEmail,
				dateISO,
				hour,
				meetLink: result.meetLink,
			}).catch((err) => console.error('[api/schedule/book] Email send failed:', err))
		}

		return NextResponse.json(
			{ success: true, eventId: result.eventId, htmlLink: result.htmlLink, meetLink: result.meetLink },
			{ status: 201 },
		)
	} catch (error) {
		console.error('[api/schedule/book] Booking failed:', error)
		return NextResponse.json(
			{ error: 'Failed to create booking. Please try again.' },
			{ status: 502 },
		)
	}
}
