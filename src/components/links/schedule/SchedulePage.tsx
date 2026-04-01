'use client'

import { useState, useCallback } from 'react'
import { MotionConfig, AnimatePresence, motion } from 'motion/react'
import { duration, easing } from '@/lib'
import { MEETING_DURATION, getUserTimezone } from '@/lib/scheduleConfig'
import { useAvailableSlots } from '@/hooks'
import { StaggerContainer, StaggerItem } from '@/components/motion'
import BackgroundEffects from '../BackgroundEffects'
import CalendarGrid from './CalendarGrid'
import TimeSlotList from './TimeSlotList'
import BookingConfirm from './BookingConfirm'

/** Schedule booking flow steps. */
type Step = 'select' | 'confirm' | 'success'

/** Entrance distance for the stagger cascade. */
const ENTRANCE_DISTANCE = 20

export default function SchedulePage() {
	const [selectedDate, setSelectedDate] = useState<string | null>(null)
	const [selectedHour, setSelectedHour] = useState<number | null>(null)
	const [step, setStep] = useState<Step>('select')

	const timezone = getUserTimezone()
	const { slots, loading } = useAvailableSlots(selectedDate)

	// No guard needed — the Continue button only renders when both values are set
	const handleConfirm = useCallback(() => {
		setStep('confirm')
	}, [])

	const handleBack = useCallback(() => {
		setStep('select')
	}, [])

	const handleSuccess = useCallback(() => {
		setStep('success')
	}, [])

	const handleBookAnother = useCallback(() => {
		setSelectedDate(null)
		setSelectedHour(null)
		setStep('select')
	}, [])

	const handleSelectDate = useCallback((iso: string) => {
		setSelectedDate(iso)
		setSelectedHour(null) // reset time when date changes
	}, [])

	return (
		<MotionConfig reducedMotion="never">
			<div className="relative min-h-dvh bg-dark-navy overflow-hidden flex items-center justify-center">
				<BackgroundEffects />

				<div className="relative z-10 w-full max-w-[480px] px-6 py-12 md:py-16">
					<StaggerContainer staggerDelay={0.12}>
						{/* Header */}
						<StaggerItem index={0} distance={ENTRANCE_DISTANCE} dur={duration.slow}>
							<div className="text-center mb-8">
								<h1 className="text-lightest-slate font-sans text-xl md:text-2xl font-semibold m-0 mb-2">
									Let&apos;s Chat
								</h1>
								<p className="text-slate font-mono text-xs m-0">
									{MEETING_DURATION} min &middot; {timezone}
								</p>
							</div>
						</StaggerItem>

						{/* Content — animated step transitions */}
						<StaggerItem index={1} distance={ENTRANCE_DISTANCE} dur={duration.slow}>
							<AnimatePresence mode="wait">
								{step === 'select' ? (
									<motion.div
										key="select"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: duration.normal, ease: easing.easeOut }}
										className="flex flex-col gap-6"
									>
										{/* Calendar */}
										<div className="bg-light-navy/30 backdrop-blur-xl border border-lightest-navy/10 rounded-[16px] p-5">
											<CalendarGrid
												selectedDate={selectedDate}
												onSelectDate={handleSelectDate}
											/>
										</div>

										{/* Time slots — only show when a date is selected */}
										{selectedDate && (
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: duration.normal, ease: easing.easeOut }}
											>
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
											<motion.div
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: duration.normal, ease: easing.easeOut }}
												className="flex justify-center"
											>
												<button onClick={handleConfirm} className="btn py-[14px] px-[32px]">
													Continue
												</button>
											</motion.div>
										)}
									</motion.div>
								) : (
									<motion.div
										key="confirm"
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: duration.normal, ease: easing.easeOut }}
										className="flex flex-col items-center gap-6"
									>
										<BookingConfirm
											dateISO={selectedDate!}
											hour={selectedHour!}
											onBack={handleBack}
											onSuccess={handleSuccess}
										/>
										{step === 'success' && (
											<button
												onClick={handleBookAnother}
												className="text-slate font-mono text-xs hover:text-green transition-colors duration-200"
											>
												Book another time
											</button>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</StaggerItem>

						{/* Back to links */}
						<StaggerItem index={2} distance={15} dur={duration.slow} className="flex justify-center mt-8">
							<a
								href="/links"
								className="inline-link font-mono text-xs text-slate"
							>
								&larr; Back to links
							</a>
						</StaggerItem>
					</StaggerContainer>
				</div>
			</div>
		</MotionConfig>
	)
}
