'use client'

import { useState, useCallback } from 'react'
import type { BookingBody } from '@/lib/validations'

interface UseBookingResult {
	book: (params: BookingBody) => Promise<boolean>
	loading: boolean
	error: string | null
	success: boolean
	meetLink: string | null
	reset: () => void
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

	const reset = useCallback(() => {
		setLoading(false)
		setError(null)
		setSuccess(false)
		setMeetLink(null)
	}, [])

	const book = useCallback(async (params: BookingBody): Promise<boolean> => {
		setLoading(true)
		setError(null)
		setSuccess(false)
		setMeetLink(null)

		try {
			const res = await fetch('/api/schedule/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params),
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error ?? 'Booking failed. Please try again.')
				setLoading(false)
				return false
			}

			setSuccess(true)
			setMeetLink(data.meetLink ?? null)
			setLoading(false)
			return true
		} catch {
			setError('Network error. Please check your connection and try again.')
			setLoading(false)
			return false
		}
	}, [])

	return { book, loading, error, success, meetLink, reset }
}
