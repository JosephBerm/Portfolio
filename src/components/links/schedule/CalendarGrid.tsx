'use client'

import { Suspense, use, useState } from 'react'
import { browser } from 'react-dom'
import { cn } from '@/lib/utils'
import { toISODate } from '@/lib/scheduleConfig'
import { getOwnerTodayISO, isBookable } from '@/lib/scheduleTime'
import ChevronLeftSVG from '@/components/icons/ChevronLeftSVG'
import ChevronRightSVG from '@/components/icons/ChevronRightSVG'

/** Day-of-week header labels. */
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

interface CalendarGridProps {
	selectedDate: string | null
	onSelectDate: (iso: string) => void
}

/** Compact calendar grid for date selection.
 *  Unavailable dates are greyed out; only bookable dates are interactive. */
export default function CalendarGrid(props: CalendarGridProps) {
	return (
		// The prerendered HTML ships this same-footprint placeholder; the month renders in the browser
		<Suspense fallback={<div className="w-full aspect-square" aria-hidden="true" />}>
			<CalendarMonth {...props} />
		</Suspense>
	)
}

/** Browser-only: "today", the bookable days and the visible month depend on the visitor's clock. */
function CalendarMonth({ selectedDate, onSelectDate }: CalendarGridProps) {
	use(browser('CalendarGrid depends on the current date'))

	// Owner-timezone "today", so the grid agrees with what the booking API accepts
	const [todayISO] = useState(getOwnerTodayISO)
	const [todayYear = 0, todayMonth = 1] = todayISO.split('-').map(Number)
	const [viewDate, setViewDate] = useState(() => new Date(todayYear, todayMonth - 1, 1))

	const year = viewDate.getFullYear()
	const month = viewDate.getMonth()

	const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

	// All calendar cells for the current month view (leading blanks + days)
	const firstDay = new Date(year, month, 1).getDay()
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	const cells: (Date | null)[] = [
		...Array.from({ length: firstDay }, () => null),
		...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
	]

	const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
	const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1))

	/** Don't allow navigating before the current month. */
	const canGoPrev = year > todayYear || (year === todayYear && month > todayMonth - 1)

	return (
		<div className="w-full">
			{/* Month navigation */}
			<div className="flex items-center justify-between mb-4">
				<button
					onClick={goToPrevMonth}
					disabled={!canGoPrev}
					className="w-8 h-8 flex items-center justify-center text-slate hover:text-green disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					aria-label="Previous month"
				>
					<ChevronLeftSVG />
				</button>
				{/* Announces the new month after Previous/Next, which keep focus */}
				<span aria-live="polite" className="text-lightest-slate font-sans font-medium text-base">
					{monthLabel}
				</span>
				<button
					onClick={goToNextMonth}
					className="w-8 h-8 flex items-center justify-center text-slate hover:text-green transition-colors"
					aria-label="Next month"
				>
					<ChevronRightSVG />
				</button>
			</div>

			{/* Day-of-week headers */}
			<div className="grid grid-cols-7 gap-1 mb-1">
				{DAY_LABELS.map((label) => (
					<div key={label} className="text-center text-dark-slate font-mono text-[11px] py-1">
						{label}
					</div>
				))}
			</div>

			{/* Date cells */}
			<div className="grid grid-cols-7 gap-1">
				{cells.map((date, i) => {
					if (!date) {
						return <div key={`blank-${i}`} />
					}

					const iso = toISODate(date)
					const bookable = isBookable(iso, todayISO)
					const isSelected = iso === selectedDate
					const isToday = iso === todayISO

					return (
						<button
							key={iso}
							type="button"
							onClick={() => bookable && onSelectDate(iso)}
							disabled={!bookable}
							aria-pressed={isSelected}
							className={cn(
								'relative aspect-square flex items-center justify-center rounded-[10px] text-sm font-sans transition-all duration-200',
								bookable
									? 'cursor-pointer hover:bg-green-tint hover:text-green'
									: 'cursor-not-allowed opacity-25',
								isSelected
									? 'bg-green text-dark-navy font-semibold hover:bg-green hover:text-dark-navy'
									: bookable
										? 'text-lightest-slate'
										: 'text-dark-slate',
								isToday && !isSelected && 'ring-1 ring-green/40',
							)}
							aria-label={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
						>
							{date.getDate()}
						</button>
					)
				})}
			</div>
		</div>
	)
}
