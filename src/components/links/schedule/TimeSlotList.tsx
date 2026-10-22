'use client'

import { cn } from '@/lib/utils'
import { formatHour } from '@/lib/scheduleConfig'

/** Number of skeleton placeholders to show while loading. */
const SKELETON_COUNT = 8

interface TimeSlotListProps {
	slots: number[]
	loading: boolean
	selectedHour: number | null
	onSelectHour: (hour: number) => void
}

/** List of available start times for the selected date.
 *  Shows start time only — duration is displayed once in the page header. */
export default function TimeSlotList(props: TimeSlotListProps) {
	return (
		// One live region across the loading, empty and loaded states, so screen readers hear when the times arrive
		<div aria-live="polite" aria-busy={props.loading}>
			<TimeSlotContent {...props} />
		</div>
	)
}

function TimeSlotContent({ slots, loading, selectedHour, onSelectHour }: TimeSlotListProps) {
	if (loading) {
		return (
			<div className="grid grid-cols-2 gap-2 w-full" aria-hidden="true">
				{Array.from({ length: SKELETON_COUNT }, (_, i) => (
					<div
						key={i}
						className="py-[12px] px-[16px] rounded-[10px] bg-light-navy/20 border border-lightest-navy/5 animate-pulse motion-reduce:animate-none h-[44px]"
					/>
				))}
			</div>
		)
	}

	if (slots.length === 0) {
		return (
			<p className="text-dark-slate font-mono text-xs text-center py-4 m-0">
				No open times on this day. Please try another date.
			</p>
		)
	}

	return (
		<div className="grid grid-cols-2 gap-2 w-full">
			{slots.map((hour) => {
				const isSelected = hour === selectedHour
				return (
					<button
						key={hour}
						type="button"
						onClick={() => onSelectHour(hour)}
						aria-pressed={isSelected}
						className={cn(
							'py-[12px] px-[16px] rounded-[10px] text-sm font-mono text-center',
							'border transition-all duration-200',
							'ease-smooth',
							isSelected
								? 'bg-green text-dark-navy border-green font-semibold'
								: 'bg-light-navy/30 border-lightest-navy/10 text-lightest-slate hover:border-green/30 hover:bg-light-navy/50',
						)}
					>
						{formatHour(hour)}
					</button>
				)
			})}
		</div>
	)
}
