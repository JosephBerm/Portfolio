import { z } from 'zod'

/** ISO date string pattern (YYYY-MM-DD). */
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD format')

/** Query params for the available-slots endpoint. */
export const slotsQuerySchema = z.object({
	date: ISO_DATE,
})

/** Request body for the booking endpoint. */
export const bookingBodySchema = z.object({
	dateISO: ISO_DATE,
	hour: z.number().int().min(0).max(23),
	visitorName: z.string().min(1, 'Name is required').max(100).trim(),
	visitorEmail: z.string().email('Invalid email address').max(254),
})

export type BookingBody = z.infer<typeof bookingBodySchema>
