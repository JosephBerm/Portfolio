import {
	AVAILABLE_DAYS,
	DISABLED_DATES,
	MAX_ADVANCE_DAYS,
	MEETING_DURATION,
	OWNER_TIMEZONE,
	getAvailableSlots,
} from './scheduleConfig'

/**
 * Owner-timezone schedule math, shared by Route Handlers and Client Components.
 * Slot hours are wall-clock times in OWNER_TIMEZONE: never parse them with
 * `new Date('YYYY-MM-DDTHH:mm')`, which uses the runtime's zone (UTC on most hosts).
 */

const ownerClock = new Intl.DateTimeFormat('en-US', {
	timeZone: OWNER_TIMEZONE,
	hourCycle: 'h23',
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
})

/** Wall-clock fields of an instant as seen in OWNER_TIMEZONE. */
function ownerParts(instant: Date | number) {
	const { year = 0, month = 1, day = 1, hour = 0, minute = 0 }: Partial<Record<Intl.DateTimeFormatPartTypes, number>> =
		Object.fromEntries(ownerClock.formatToParts(instant).map(({ type, value }) => [type, Number(value)]))
	return { year, month, day, hour, minute }
}

/** Offset (ms) of OWNER_TIMEZONE from UTC at the given instant. */
function ownerOffsetAt(instant: number): number {
	const o = ownerParts(instant)
	return Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute) - instant
}

/** Converts a wall-clock time in OWNER_TIMEZONE to an absolute Date (DST-safe). */
export function ownerTimeToDate(dateISO: string, hour: number, minute = 0): Date {
	const [y = 0, m = 1, d = 1] = dateISO.split('-').map(Number)
	const asUTC = Date.UTC(y, m - 1, d, hour, minute)
	// Re-read the offset at the first guess so hours right after a DST switch land correctly
	const guess = asUTC - ownerOffsetAt(asUTC)
	return new Date(asUTC - ownerOffsetAt(guess))
}

/** Start/end instants of the meeting that starts at `hour` (owner time) on `dateISO`. */
export function getSlotWindow(dateISO: string, hour: number): { start: Date; end: Date } {
	const start = ownerTimeToDate(dateISO, hour)
	return { start, end: new Date(start.getTime() + MEETING_DURATION * 60_000) }
}

/** Configured slots on `dateISO` that haven't started yet. */
export function getUpcomingSlots(dateISO: string, now: number = Date.now()): number[] {
	return getAvailableSlots().filter((hour) => getSlotWindow(dateISO, hour).start.getTime() > now)
}

/** Today's date (YYYY-MM-DD) in OWNER_TIMEZONE, the same on the server and in every browser. */
export function getOwnerTodayISO(now: Date = new Date()): string {
	const { year, month, day } = ownerParts(now)
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Adds whole days to a YYYY-MM-DD string without touching local time. */
function addDays(dateISO: string, days: number): string {
	const date = new Date(`${dateISO}T00:00:00Z`)
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
}

/** True if the date is bookable on the owner's calendar: available weekday, not disabled, within the booking window. */
export function isBookable(dateISO: string, todayISO: string = getOwnerTodayISO()): boolean {
	const weekday = new Date(`${dateISO}T00:00:00Z`).getUTCDay()
	return (
		dateISO >= todayISO &&
		dateISO <= addDays(todayISO, MAX_ADVANCE_DAYS) &&
		(AVAILABLE_DAYS as readonly number[]).includes(weekday) &&
		!DISABLED_DATES.includes(dateISO)
	)
}

/** Formats YYYY-MM-DD as e.g. "Wednesday, October 21, 2026", identical output on any host. */
export function formatLongDate(dateISO: string): string {
	return new Date(`${dateISO}T00:00:00Z`).toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC',
	})
}
