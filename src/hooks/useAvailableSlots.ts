'use client'

import { useState, useEffect, useRef } from 'react'
import { getAvailableSlots } from '@/lib/scheduleConfig'

interface UseAvailableSlotsResult {
	slots: number[]
	loading: boolean
	error: string | null
}

/**
 * Fetches available time slots for a given date from the API.
 * Falls back to static config slots on network failure.
 * Cancels in-flight requests when the date changes.
 */
export function useAvailableSlots(dateISO: string | null): UseAvailableSlotsResult {
	const [slots, setSlots] = useState<number[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const controllerRef = useRef<AbortController | null>(null)

	useEffect(() => {
		if (!dateISO) {
			setSlots([])
			setLoading(false)
			setError(null)
			return
		}

		// Cancel any in-flight request
		controllerRef.current?.abort()
		const controller = new AbortController()
		controllerRef.current = controller

		setLoading(true)
		setError(null)

		fetch(`/api/schedule/slots?date=${dateISO}`, { signal: controller.signal })
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return res.json()
			})
			.then((data: { slots: number[] }) => {
				if (!controller.signal.aborted) {
					setSlots(data.slots)
					setLoading(false)
				}
			})
			.catch((err) => {
				if (controller.signal.aborted) return
				console.error('[useAvailableSlots] Fetch failed, using static fallback:', err)
				setSlots(getAvailableSlots())
				setError('Could not load live availability')
				setLoading(false)
			})

		return () => controller.abort()
	}, [dateISO])

	return { slots, loading, error }
}
