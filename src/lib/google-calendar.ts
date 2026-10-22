import 'server-only'

import { auth as googleAuth, calendar as calendarApi, type calendar_v3 } from '@googleapis/calendar'
import { MAX_ADVANCE_DAYS, MEETING_DURATION, OWNER_TIMEZONE, TIME_RANGE } from './scheduleConfig'
import { getSlotWindow, getUpcomingSlots, ownerTimeToDate } from './scheduleTime'

// ── Environment variables ───────────────────────────────────────
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
/** Optional static Meet link (reusable room). `||` so an empty GOOGLE_MEET_LINK= counts as unset. */
const MEET_LINK = process.env.GOOGLE_MEET_LINK || null

/** Whether Google Calendar credentials are configured. */
export const isConfigured =
	Boolean(SERVICE_ACCOUNT_EMAIL) && Boolean(PRIVATE_KEY) && Boolean(CALENDAR_ID)

// ── Client singleton ────────────────────────────────────────────
const SCOPES = ['https://www.googleapis.com/auth/calendar'] as const
/** Upper bound per Google API call (token fetch included), so a stalled call fails fast into the fallback / 502 paths. */
const REQUEST_TIMEOUT_MS = 10_000

/**
 * Rejects once `promise` has taken REQUEST_TIMEOUT_MS. The client's own `timeout` only covers the API request,
 * not the service-account token fetch (with retries) that precedes it on a cold instance.
 */
function withTimeout<T>(promise: Promise<T>): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(
			() => reject(new Error(`Google Calendar request timed out after ${REQUEST_TIMEOUT_MS}ms`)),
			REQUEST_TIMEOUT_MS,
		)
	})
	return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

interface CalendarClient {
	calendar: calendar_v3.Calendar
	calendarId: string
}

let cachedClient: CalendarClient | null = null

function getCalendarClient(): CalendarClient {
	if (cachedClient) return cachedClient

	if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !CALENDAR_ID) {
		throw new Error('Google Calendar credentials are not configured')
	}

	const auth = new googleAuth.JWT({
		email: SERVICE_ACCOUNT_EMAIL,
		key: PRIVATE_KEY,
		scopes: [...SCOPES],
		// Caps each token request attempt; withTimeout bounds the whole call, retries included
		transporterOptions: { timeout: REQUEST_TIMEOUT_MS },
	})

	cachedClient = {
		calendar: calendarApi({ version: 'v3', auth, timeout: REQUEST_TIMEOUT_MS }),
		calendarId: CALENDAR_ID,
	}
	return cachedClient
}

// ── Helpers ─────────────────────────────────────────────────────

/** Busy periods on the owner's calendar between two instants. Throws when Google couldn't compute them. */
async function queryBusy(timeMin: Date, timeMax: Date): Promise<calendar_v3.Schema$TimePeriod[]> {
	const { calendar, calendarId } = getCalendarClient()

	const res = await withTimeout(
		calendar.freebusy.query({
			requestBody: {
				timeMin: timeMin.toISOString(),
				timeMax: timeMax.toISOString(),
				timeZone: OWNER_TIMEZONE,
				items: [{ id: calendarId }],
			},
		}),
	)

	// A failed computation (e.g. notFound, internalError) still answers 200, with errors and no busy list: never read it as free
	const entry = res.data.calendars?.[calendarId]
	if (!entry || entry.errors?.length) {
		throw new Error(`FreeBusy unavailable: ${entry?.errors?.map((e) => e.reason).join(', ') || 'calendar missing from response'}`)
	}
	return entry.busy ?? []
}

/** How long a date's FreeBusy answer serves the slots list, so a burst of requests can't each call Google. */
const BUSY_CACHE_TTL_MS = 30_000
/** At most one entry per bookable date. */
const BUSY_CACHE_MAX_DATES = MAX_ADVANCE_DAYS + 1

/** Per-date FreeBusy answers (in-flight ones included), oldest first. */
const busyCache = new Map<string, { expires: number; busy: Promise<calendar_v3.Schema$TimePeriod[]> }>()

/**
 * Busy periods within the bookable hours of `dateISO`, shared for BUSY_CACHE_TTL_MS. Only the slots list reads this:
 * isSlotAvailable always asks Google, so a stale entry can at worst offer a slot that booking then turns down (409).
 */
function getBusyForDate(dateISO: string): Promise<calendar_v3.Schema$TimePeriod[]> {
	const now = Date.now()
	const cached = busyCache.get(dateISO)
	if (cached && cached.expires > now) return cached.busy

	const busy = queryBusy(ownerTimeToDate(dateISO, TIME_RANGE.start), ownerTimeToDate(dateISO, TIME_RANGE.end))
	// Failures aren't cached: the next request asks Google again
	busy.catch(() => {
		if (busyCache.get(dateISO)?.busy === busy) busyCache.delete(dateISO)
	})

	busyCache.delete(dateISO)
	if (busyCache.size >= BUSY_CACHE_MAX_DATES) {
		const oldest = busyCache.keys().next().value
		if (oldest !== undefined) busyCache.delete(oldest)
	}
	busyCache.set(dateISO, { expires: now + BUSY_CACHE_TTL_MS, busy })
	return busy
}

/** Checks whether the meeting starting at `hour` overlaps any busy period. */
function isHourBusy(hour: number, dateISO: string, busyPeriods: calendar_v3.Schema$TimePeriod[]): boolean {
	const { start, end } = getSlotWindow(dateISO, hour)

	return busyPeriods.some((period) => {
		if (!period.start || !period.end) return false
		// Overlap: slotStart < busyEnd AND slotEnd > busyStart
		return start < new Date(period.end) && end > new Date(period.start)
	})
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Fetches available time slots for a given date by querying Google Calendar
 * FreeBusy API and subtracting busy periods from the static schedule config.
 * Hours that have already started (owner time) are always left out.
 *
 * Falls back to the upcoming static slots if Google Calendar is not configured or unreachable.
 */
export async function getAvailableSlotsForDate(dateISO: string): Promise<number[]> {
	const slots = getUpcomingSlots(dateISO)

	if (!isConfigured || slots.length === 0) return slots

	try {
		const busy = await getBusyForDate(dateISO)

		return slots.filter((hour) => !isHourBusy(hour, dateISO, busy))
	} catch (error) {
		// Message only: Google client errors embed the request body
		console.error(
			'[google-calendar] FreeBusy query failed, using static slots:',
			error instanceof Error ? error.message : error,
		)
		return slots
	}
}

/**
 * Checks if a specific slot is still available by doing a final FreeBusy check.
 * Used to prevent double-booking race conditions.
 *
 * Throws when availability can't be verified, so callers must fail closed
 * (events.insert happily creates overlapping events).
 */
export async function isSlotAvailable(dateISO: string, hour: number): Promise<boolean> {
	if (!isConfigured) return true

	const { start, end } = getSlotWindow(dateISO, hour)
	return (await queryBusy(start, end)).length === 0
}

export interface BookingResult {
	meetLink: string | null
}

/**
 * Creates a calendar event for the booking.
 *
 * Note: Service accounts on personal Gmail cannot create Google Meet
 * conferences or invite attendees without Domain-Wide Delegation.
 * If GOOGLE_MEET_LINK is set, it's included in the event description
 * and returned to the visitor.
 */
export async function createBooking(params: {
	dateISO: string
	hour: number
	visitorName: string
	visitorEmail: string
}): Promise<BookingResult> {
	const { dateISO, hour, visitorName, visitorEmail } = params
	const { calendar, calendarId } = getCalendarClient()
	const { start, end } = getSlotWindow(dateISO, hour)

	const meetLine = MEET_LINK ? `\nMeet: ${MEET_LINK}` : ''

	await withTimeout(calendar.events.insert({
		calendarId,
		requestBody: {
			summary: `Chat with ${visitorName}`,
			description:
				`Booked via portfolio website\n\n` +
				`Visitor: ${visitorName}\n` +
				`Email: ${visitorEmail}\n` +
				`Duration: ${MEETING_DURATION} min` +
				meetLine,
			// Absolute instants; timeZone only sets the zone the event is displayed in
			start: {
				dateTime: start.toISOString(),
				timeZone: OWNER_TIMEZONE,
			},
			end: {
				dateTime: end.toISOString(),
				timeZone: OWNER_TIMEZONE,
			},
			reminders: {
				useDefault: false,
				overrides: [
					{ method: 'email', minutes: 30 },
					{ method: 'popup', minutes: 15 },
				],
			},
		},
	}))

	// The cached answer for this date no longer shows the new event
	busyCache.delete(dateISO)

	return { meetLink: MEET_LINK }
}
