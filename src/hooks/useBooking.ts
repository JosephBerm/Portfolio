import { useState } from 'react'
import type { BookingBody } from '@/lib/validations'
import type { ApiError, BookingResponse } from '@/lib/scheduleApi'

interface UseBookingResult {
	book: (params: BookingBody) => Promise<void>
	loading: boolean
	error: string | null
	success: boolean
	meetLink: string | null
}

/** Outcome of one booking attempt, in the shape the UI needs. */
type BookingOutcome = { ok: true; meetLink: string | null } | { ok: false; error: string }

/**
 * POSTs the booking. Kept outside the hook: the React Compiler skips hooks that use
 * `??` / `?.` inside try/catch, so all error handling lives here.
 */
async function postBooking(params: BookingBody): Promise<BookingOutcome> {
	let res: Response
	try {
		res = await fetch('/api/schedule/book', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(params),
		})
	} catch {
		return { ok: false, error: 'Network error. Please check your connection and try again.' }
	}
	// Error bodies may not be JSON (e.g. a host's 5xx page)
	const body: unknown = await res.json().catch(() => null)
	if (!res.ok) {
		return { ok: false, error: (body as Partial<ApiError> | null)?.error ?? 'Booking failed. Please try again.' }
	}
	return { ok: true, meetLink: (body as Partial<BookingResponse> | null)?.meetLink ?? null }
}

/**
 * Handles the booking POST request to the API.
 * Returns success/error states for the UI to react to.
 */
export function useBooking(): UseBookingResult {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)
	const [meetLink, setMeetLink] = useState<string | null>(null)

	const book = async (params: BookingBody): Promise<void> => {
		setLoading(true)
		setError(null)
		setSuccess(false)
		setMeetLink(null)

		const outcome = await postBooking(params)
		setLoading(false)

		if (!outcome.ok) {
			setError(outcome.error)
			return
		}
		setSuccess(true)
		setMeetLink(outcome.meetLink)
	}

	return { book, loading, error, success, meetLink }
}
