/**
 * Schedule configuration — edit these values to control
 * which days and time frames are available for booking.
 */

/** Duration of each meeting slot in minutes. */
export const MEETING_DURATION = 60

/** Days of the week available for booking (0 = Sunday, 6 = Saturday). */
export const AVAILABLE_DAYS = [1, 2, 3, 4, 5] as const // Mon–Fri

/** Available time window — start and end hours in 24h format.
 *  Slots are generated from `start` up to (but not including) `end`. */
export const TIME_RANGE = { start: 9, end: 17 } as const // 9 AM – 5 PM

/** IANA timezone for the schedule owner. Times are stored in this zone. */
export const OWNER_TIMEZONE = 'America/New_York'

/** Human-readable name for OWNER_TIMEZONE. Slot hours are shown unconverted, so every label must use this zone. */
export const OWNER_TIMEZONE_LABEL = 'Eastern Time'

/** Length and timezone line shown with a slot, e.g. "60 minutes · Eastern Time". */
export const MEETING_SUMMARY = `${MEETING_DURATION} minutes · ${OWNER_TIMEZONE_LABEL}`

/** Booking form limits, shared by the form fields and the API schema (validations.ts); here so the form doesn't bundle zod. */
export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254

/** How many days into the future users can book. */
export const MAX_ADVANCE_DAYS = 30

/** Specific dates to block (ISO format YYYY-MM-DD).
 *  Add holidays, vacations, etc. */
export const DISABLED_DATES: string[] = [
	// '2026-04-15',
]

// ─── Derived helpers ─────────────────────────────────────────────
// Date rules (bookable days, owner-timezone math) live in scheduleTime.ts.

/** Generates the list of available start-time hours for a bookable date. */
export function getAvailableSlots(): number[] {
	const slots: number[] = []
	for (let h = TIME_RANGE.start; h < TIME_RANGE.end; h++) {
		slots.push(h)
	}
	return slots
}

/** Formats a 24h hour as a localized time string (e.g. "9:00 AM"). */
export function formatHour(hour: number): string {
	const date = new Date()
	date.setHours(hour, 0, 0, 0)
	return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** Formats a Date to ISO date string (YYYY-MM-DD). */
export function toISODate(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}
