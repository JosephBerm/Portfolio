'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib'
import { isBookable, toISODate } from '@/lib/scheduleConfig'

/** Day-of-week header labels. */
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

interface CalendarGridProps {
	selectedDate: string | null
	onSelectDate: (iso: string) => void
}

/** Compact calendar grid for date selection.
 *  Unavailable dates are greyed out; only bookable dates are interactive. */
export default function CalendarGrid({ selectedDate, onSelectDate }: CalendarGridProps) {
	const [viewDate, setViewDate] = useState(() => new Date())

	const year = viewDate.getFullYear()
	const month = viewDate.getMonth()

	const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

	/** All calendar cells for the current month view (including leading/trailing blanks). */
	const cells = useMemo(() => {
		const firstDay = new Date(year, month, 1).getDay()
		const daysInMonth = new Date(year, month + 1, 0).getDate()

		const result: (Date | null)[] = []

		// Leading blanks
		for (let i = 0; i < firstDay; i++) result.push(null)

		// Actual days
		for (let d = 1; d <= daysInMonth; d++) {
			result.push(new Date(year, month, d))
		}

		return result
	}, [year, month])

	const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
	const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1))

	/** Don't allow navigating before the current month. */
	const today = new Date()
	const canGoPrev = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())

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
				<span className="text-lightest-slate font-sans font-medium text-base">
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
					const bookable = isBookable(date)
					const isSelected = iso === selectedDate
					const isToday = iso === toISODate(today)

					return (
						<button
							key={iso}
							onClick={() => bookable && onSelectDate(iso)}
							disabled={!bookable}
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

/** Inline chevron icons — too small for the icons barrel. */
function ChevronLeftSVG() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
			<polyline points="15 18 9 12 15 6" />
		</svg>
	)
}

function ChevronRightSVG() {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	)
}
