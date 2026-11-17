import { z } from 'zod'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from './scheduleConfig'

/** Calendar date (YYYY-MM-DD); rejects impossible dates like 2026-02-31. */
const ISO_DATE = z.iso.date('Please choose a valid date.')

/**
 * A name the confirmation email and the calendar event can show as written. It has no control characters, no
 * invisible format characters (bidi controls that hide or reorder text, zero-width spaces, the byte-order mark),
 * no line or paragraph separators, and no angle brackets: the calendar event's description renders HTML. The
 * zero-width non-joiner and joiner stay (U+200C, U+200D), because some names are written with them.
 */
const SAFE_NAME = /^(?:[^\p{Cc}\p{Cf}\p{Zl}\p{Zp}<>]|[\u200C\u200D])+$/u

/** Query params for the available-slots endpoint. */
export const slotsQuerySchema = z.object({
	date: ISO_DATE,
})

/** Request body for the booking endpoint. */
export const bookingBodySchema = z.object({
	dateISO: ISO_DATE,
	hour: z.number().int().min(0).max(23),
	// trim first: zod 4 runs checks in order, so `.min(1).trim()` accepted whitespace-only names
	visitorName: z
		.string()
		.trim()
		.min(1, 'Please enter your name.')
		.max(NAME_MAX_LENGTH)
		.regex(SAFE_NAME, 'Please enter your name.'),
	visitorEmail: z.email('Please enter a valid email address.').max(EMAIL_MAX_LENGTH),
})

export type BookingBody = z.infer<typeof bookingBodySchema>
