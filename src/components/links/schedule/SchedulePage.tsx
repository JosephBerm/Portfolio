'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { duration, easing } from '@/lib/animations'
import { cn } from '@/lib/utils'
import { MEETING_SUMMARY } from '@/lib/scheduleConfig'
import { useAvailableSlots } from '@/hooks/useAvailableSlots'
import { StaggerContainer } from '@/components/motion/StaggerContainer'
import { StaggerItem } from '@/components/motion/RevealItem'
import { GLASS_PANEL } from './styles'
import CalendarGrid from './CalendarGrid'
import TimeSlotList from './TimeSlotList'
import BookingConfirm from './BookingConfirm'

/** Entrance distance for the stagger cascade. */
const ENTRANCE_DISTANCE = 20

/** Fade-up shared by the two steps and the controls that appear inside the select step. */
const STEP_FADE = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	transition: { duration: duration.normal, ease: easing.easeOut },
}

/** Exit for the two steps (AnimatePresence mode="wait"). */
const STEP_EXIT = { opacity: 0, y: -10 }

/** /links/schedule booking flow; the shared shell and orbs come from app/links/layout.tsx. */
export default function SchedulePage() {
	const [selectedDate, setSelectedDate] = useState<string | null>(null)
	const [selectedHour, setSelectedHour] = useState<number | null>(null)
	/** The slot being confirmed; null while the visitor is still selecting. */
	const [confirmed, setConfirmed] = useState<{ dateISO: string; hour: number } | null>(null)

	const { slots, loading } = useAvailableSlots(selectedDate)

	// Leaving the confirm step unmounts the focused button. Focus moves to the calendar once the select step is back:
	// mode="wait" mounts it in the same update as onExitComplete, so the effect below runs after it has mounted.
	const calendarPanelRef = useRef<HTMLDivElement>(null)
	const refocusCalendarRef = useRef(false)
	const [stepSwaps, setStepSwaps] = useState(0)

	useEffect(() => {
		if (!refocusCalendarRef.current) return
		refocusCalendarRef.current = false
		calendarPanelRef.current?.focus()
	}, [stepSwaps])

	const handleConfirm = () => {
		if (selectedDate && selectedHour !== null) setConfirmed({ dateISO: selectedDate, hour: selectedHour })
	}

	const handleBack = () => {
		refocusCalendarRef.current = true
		setConfirmed(null)
	}

	const handleBookAnother = () => {
		refocusCalendarRef.current = true
		setSelectedDate(null)
		setSelectedHour(null)
		setConfirmed(null)
	}

	const handleSelectDate = (iso: string) => {
		setSelectedDate(iso)
		setSelectedHour(null) // reset time when date changes
	}

	return (
		<StaggerContainer staggerDelay={0.12}>
			{/* Header */}
			<StaggerItem index={0} distance={ENTRANCE_DISTANCE} dur={duration.slow}>
				<div className="text-center mb-8">
					<h1 className="text-lightest-slate font-sans text-xl md:text-2xl font-semibold m-0 mb-2">
						Let&apos;s Chat
					</h1>
					<p className="text-slate font-mono text-xs m-0">
						{MEETING_SUMMARY}
					</p>
				</div>
			</StaggerItem>

			{/* Content — animated step transitions */}
			<StaggerItem index={1} distance={ENTRANCE_DISTANCE} dur={duration.slow}>
				<AnimatePresence mode="wait" onExitComplete={() => setStepSwaps((n) => n + 1)}>
					{confirmed === null ? (
						<motion.div
							key="select"
							{...STEP_FADE}
							exit={STEP_EXIT}
							className="flex flex-col gap-6"
						>
							{/* Calendar (focus target when returning from the confirm step; no ring, like a section) */}
							<div ref={calendarPanelRef} tabIndex={-1} className={cn(GLASS_PANEL, 'outline-none')}>
								<CalendarGrid
									selectedDate={selectedDate}
									onSelectDate={handleSelectDate}
								/>
							</div>

							{/* Time slots — only show when a date is selected */}
							{selectedDate && (
								<motion.div {...STEP_FADE}>
									<p className="text-slate font-mono text-xs mb-3 m-0">
										Available times
									</p>
									<TimeSlotList
										slots={slots}
										loading={loading}
										selectedHour={selectedHour}
										onSelectHour={setSelectedHour}
									/>
								</motion.div>
							)}

							{/* Confirm button */}
							{selectedDate && selectedHour !== null && (
								<motion.div {...STEP_FADE} className="flex justify-center">
									<button onClick={handleConfirm} className="btn py-[14px] px-[32px]">
										Continue
									</button>
								</motion.div>
							)}
						</motion.div>
					) : (
						<motion.div
							key="confirm"
							{...STEP_FADE}
							exit={STEP_EXIT}
							className="flex flex-col items-center gap-6"
						>
							<BookingConfirm
								dateISO={confirmed.dateISO}
								hour={confirmed.hour}
								onBack={handleBack}
								onBookAnother={handleBookAnother}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</StaggerItem>

			{/* Back to links */}
			<StaggerItem index={2} distance={15} dur={duration.slow} className="flex justify-center mt-8">
				<Link href="/links" className="inline-link font-mono text-xs text-slate">
					&larr; Back to links
				</Link>
			</StaggerItem>
		</StaggerContainer>
	)
}
