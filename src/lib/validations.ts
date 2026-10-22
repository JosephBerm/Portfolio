import { z } from 'zod'
import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from './scheduleConfig'

/** Calendar date (YYYY-MM-DD); rejects impossible dates like 2026-02-31. */
const ISO_DATE = z.iso.date('Please choose a valid date.')

/**
 * A name without control characters or bidi embedding/override/isolate controls: the name lands in the confirmation
 * email and the calendar event, where these could hide or reorder text. Narrower than \p{C}, which would also reject
 * the zero-width non-joiner some names need.
 */
const SAFE_NAME = /^[^\p{Cc}‪-‮⁦-⁩]+$/u

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
