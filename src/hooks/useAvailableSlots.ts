import { useEffect, useState } from 'react'
import type { SlotsResponse } from '@/lib/scheduleApi'
import { getUpcomingSlots } from '@/lib/scheduleTime'

interface UseAvailableSlotsResult {
	slots: number[]
	loading: boolean
}

/**
 * Fetches available time slots for a given date from the API.
 * Falls back to the static schedule (minus past hours) on network failure.
 * Aborts the in-flight request when the date changes or on unmount.
 */
export function useAvailableSlots(dateISO: string | null): UseAvailableSlotsResult {
	/** null until the current date's slots arrive (or the fallback is used). */
	const [slots, setSlots] = useState<number[] | null>(null)
	const [prevDateISO, setPrevDateISO] = useState(dateISO)

	// Reset while rendering when the date changes (React's "adjust state on prop change"
	// pattern) rather than calling setState synchronously inside the effect
	if (dateISO !== prevDateISO) {
		setPrevDateISO(dateISO)
		setSlots(null)
	}

	useEffect(() => {
		if (!dateISO) return

		const controller = new AbortController()

		fetch(`/api/schedule/slots?${new URLSearchParams({ date: dateISO })}`, { signal: controller.signal })
			.then((res) => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return res.json() as Promise<SlotsResponse>
			})
			.then((data) => {
				if (!controller.signal.aborted) setSlots(data.slots)
			})
			.catch((err) => {
				if (controller.signal.aborted) return
				console.error('[useAvailableSlots] Fetch failed, using static fallback:', err)
				setSlots(getUpcomingSlots(dateISO))
			})

		return () => controller.abort()
	}, [dateISO])

	return {
		slots: slots ?? [],
		loading: dateISO !== null && slots === null,
	}
}
