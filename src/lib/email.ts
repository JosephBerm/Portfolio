import 'server-only'

import { Resend } from 'resend'
import BookingConfirmationEmail from '@/emails/BookingConfirmationEmail'
import { MEETING_DURATION, OWNER_TIMEZONE, formatHour } from './scheduleConfig'

// ── Environment variables ───────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Joseph Bermudez <onboarding@resend.dev>'

/** Whether email sending is configured. */
export const isConfigured = Boolean(RESEND_API_KEY)

// ── Client ──────────────────────────────────────────────────────
// Follows Resend docs: instantiate at module scope with the env var.
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// ── Public API ──────────────────────────────────────────────────

/**
 * Sends a booking confirmation email to the visitor.
 *
 * This is non-critical — callers should catch errors and log them
 * rather than letting email failures disrupt the booking flow.
 */
export async function sendBookingConfirmation(params: {
	visitorName: string
	visitorEmail: string
	dateISO: string
	hour: number
	meetLink: string | null
}): Promise<void> {
	if (!resend) throw new Error('RESEND_API_KEY is not configured')

	const { visitorName, visitorEmail, dateISO, hour, meetLink } = params

	const date = new Date(dateISO + 'T12:00:00') // noon to avoid TZ date shift
	const formattedDate = date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
	const formattedTime = formatHour(hour)

	// Build Google Calendar "Add to Calendar" URL
	const pad = (n: number) => String(n).padStart(2, '0')
	const startDT = `${dateISO.replace(/-/g, '')}T${pad(hour)}0000`
	const endHour = hour + Math.floor(MEETING_DURATION / 60)
	const endMinute = MEETING_DURATION % 60
	const endDT = `${dateISO.replace(/-/g, '')}T${pad(endHour)}${pad(endMinute)}00`
	const calendarUrl =
		`https://calendar.google.com/calendar/render?action=TEMPLATE` +
		`&text=${encodeURIComponent(`Chat with Joseph Bermudez`)}` +
		`&dates=${startDT}/${endDT}` +
		`&ctz=${encodeURIComponent(OWNER_TIMEZONE)}` +
		`&details=${encodeURIComponent(`Booked via josephbermudez.com${meetLink ? `\nMeet: ${meetLink}` : ''}`)}`

	const { data, error } = await resend.emails.send({
		from: EMAIL_FROM,
		to: [visitorEmail],
		subject: `Meeting confirmed — ${formattedDate} at ${formattedTime}`,
		react: BookingConfirmationEmail({
			visitorName,
			formattedDate,
			formattedTime,
			timezone: OWNER_TIMEZONE,
			duration: MEETING_DURATION,
			meetLink,
			calendarUrl,
		}),
	})

	if (error) {
		throw new Error(`Resend API error: ${error.message}`)
	}

	console.log('[email] Booking confirmation sent:', data?.id)
}
