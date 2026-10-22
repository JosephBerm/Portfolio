import 'server-only'

import { createElement } from 'react'
import { Resend } from 'resend'
import BookingConfirmationEmail from '@/emails/BookingConfirmationEmail'
import { MEETING_DURATION, OWNER_TIMEZONE, OWNER_TIMEZONE_LABEL, formatHour } from './scheduleConfig'
import { formatLongDate, getSlotWindow } from './scheduleTime'

// ── Environment variables ───────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY
// || so an empty EMAIL_FROM= line in .env also falls back
const EMAIL_FROM = process.env.EMAIL_FROM || 'Joseph Bermudez <onboarding@resend.dev>'

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

	const formattedDate = formatLongDate(dateISO)
	const formattedTime = formatHour(hour)

	// Build Google Calendar "Add to Calendar" URL
	// Google Calendar template dates: UTC stamps like 20261021T130000Z
	const { start, end } = getSlotWindow(dateISO, hour)
	const toStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
	const calendarUrl =
		`https://calendar.google.com/calendar/render?action=TEMPLATE` +
		`&text=${encodeURIComponent(`Chat with Joseph Bermudez`)}` +
		`&dates=${toStamp(start)}/${toStamp(end)}` +
		`&ctz=${encodeURIComponent(OWNER_TIMEZONE)}` +
		`&details=${encodeURIComponent(`Booked via josephbermudez.com${meetLink ? `\nMeet: ${meetLink}` : ''}`)}`

	const { data, error } = await resend.emails.send({
		from: EMAIL_FROM,
		to: [visitorEmail],
		subject: `Meeting confirmed for ${formattedDate} at ${formattedTime} ${OWNER_TIMEZONE_LABEL}`,
		react: createElement(BookingConfirmationEmail, {
			visitorName,
			formattedDate,
			formattedTime,
			timezone: OWNER_TIMEZONE_LABEL,
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
