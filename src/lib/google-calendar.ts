import 'server-only'

import { google, type calendar_v3 } from 'googleapis'
import {
	MEETING_DURATION,
	TIME_RANGE,
	OWNER_TIMEZONE,
	getAvailableSlots,
	isBookable,
} from './scheduleConfig'

// ── Environment variables ───────────────────────────────────────
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID

/** Whether Google Calendar credentials are configured. */
export const isConfigured =
	Boolean(SERVICE_ACCOUNT_EMAIL) && Boolean(PRIVATE_KEY) && Boolean(CALENDAR_ID)

// ── Auth singleton ──────────────────────────────────────────────
const SCOPES = ['https://www.googleapis.com/auth/calendar'] as const

let cachedClient: calendar_v3.Calendar | null = null

function getCalendarClient(): calendar_v3.Calendar {
	if (cachedClient) return cachedClient

	if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !CALENDAR_ID) {
		throw new Error('Google Calendar credentials are not configured')
	}

	const auth = new google.auth.JWT({
		email: SERVICE_ACCOUNT_EMAIL,
		key: PRIVATE_KEY,
		scopes: [...SCOPES],
	})

	cachedClient = google.calendar({ version: 'v3', auth })
	return cachedClient
}

// ── Helpers ─────────────────────────────────────────────────────

/**
 * Builds an RFC 3339 datetime string for a given date + hour.
 * The timestamp is naive (no offset) — callers pass `timeZone` separately
 * to Google Calendar so it's interpreted in the correct zone.
 */
function buildDateTime(dateISO: string, hour: number, minute = 0): string {
	return `${dateISO}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
}

/**
 * Converts a date + hour pair into a UTC ISO string for use with
 * FreeBusy queries, which require RFC 3339 timestamps with timezone info.
 */
function toUTCISO(dateISO: string, hour: number): string {
	return new Date(`${dateISO}T${String(hour).padStart(2, '0')}:00:00`).toISOString()
}

/** Checks if a given hour overlaps any busy period. */
function isHourBusy(hour: number, dateISO: string, busyPeriods: Array<{ start?: string | null; end?: string | null }>): boolean {
	const slotStart = new Date(`${dateISO}T${String(hour).padStart(2, '0')}:00:00`)
	const slotEnd = new Date(slotStart.getTime() + MEETING_DURATION * 60_000)

	return busyPeriods.some((period) => {
		if (!period.start || !period.end) return false
		const busyStart = new Date(period.start)
		const busyEnd = new Date(period.end)
		// Overlap: slotStart < busyEnd AND slotEnd > busyStart
		return slotStart < busyEnd && slotEnd > busyStart
	})
}

// ── Public API ──────────────────────────────────────────────────

/**
 * Fetches available time slots for a given date by querying Google Calendar
 * FreeBusy API and subtracting busy periods from the static schedule config.
 *
 * Falls back to static slots if Google Calendar is not configured or unreachable.
 */
export async function getAvailableSlotsForDate(dateISO: string): Promise<number[]> {
	const staticSlots = getAvailableSlots()

	if (!isConfigured) return staticSlots

	try {
		const calendar = getCalendarClient()

		const timeMin = toUTCISO(dateISO, TIME_RANGE.start)
		const timeMax = toUTCISO(dateISO, TIME_RANGE.end)

		const res = await calendar.freebusy.query({
			requestBody: {
				timeMin,
				timeMax,
				timeZone: OWNER_TIMEZONE,
				items: [{ id: CALENDAR_ID }],
			},
		})

		const busyPeriods = res.data.calendars?.[CALENDAR_ID!]?.busy ?? []

		return staticSlots.filter((hour) => !isHourBusy(hour, dateISO, busyPeriods))
	} catch (error) {
		console.error('[google-calendar] FreeBusy query failed, using static slots:', error)
		return staticSlots
	}
}

/**
 * Checks if a specific slot is still available by doing a final FreeBusy check.
 * Used to prevent double-booking race conditions.
 */
export async function isSlotAvailable(dateISO: string, hour: number): Promise<boolean> {
	if (!isConfigured) return true

	try {
		const calendar = getCalendarClient()

		const timeMin = toUTCISO(dateISO, hour)
		const timeMax = toUTCISO(dateISO, hour + 1)

		const res = await calendar.freebusy.query({
			requestBody: {
				timeMin,
				timeMax,
				timeZone: OWNER_TIMEZONE,
				items: [{ id: CALENDAR_ID }],
			},
		})

		const busyPeriods = res.data.calendars?.[CALENDAR_ID!]?.busy ?? []
		return busyPeriods.length === 0
	} catch {
		// If we can't verify, allow the booking (Google will handle conflicts)
		return true
	}
}

export interface BookingResult {
	eventId: string
	htmlLink: string
	meetLink: string | null
}

/** Optional static Meet link — set in env if you have a reusable meeting room. */
const MEET_LINK = process.env.GOOGLE_MEET_LINK ?? null

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
	const calendar = getCalendarClient()

	const startDateTime = buildDateTime(dateISO, hour)
	const endHour = hour + Math.ceil(MEETING_DURATION / 60)
	const endMinute = MEETING_DURATION % 60
	const endDateTime = buildDateTime(dateISO, endHour, endMinute)

	const meetLine = MEET_LINK ? `\nMeet: ${MEET_LINK}` : ''

	const res = await calendar.events.insert({
		calendarId: CALENDAR_ID!,
		requestBody: {
			summary: `Chat with ${visitorName}`,
			description:
				`Booked via portfolio website\n\n` +
				`Visitor: ${visitorName}\n` +
				`Email: ${visitorEmail}\n` +
				`Duration: ${MEETING_DURATION} min` +
				meetLine,
			start: {
				dateTime: startDateTime,
				timeZone: OWNER_TIMEZONE,
			},
			end: {
				dateTime: endDateTime,
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
	})

	return {
		eventId: res.data.id ?? '',
		htmlLink: res.data.htmlLink ?? '',
		meetLink: MEET_LINK,
	}
}
