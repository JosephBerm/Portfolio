'use client'

import { useState } from 'react'
import { cn, MEETING_DURATION } from '@/lib'
import { formatHour, getUserTimezone } from '@/lib/scheduleConfig'
import { useBooking } from '@/hooks'

interface BookingConfirmProps {
	dateISO: string
	hour: number
	onBack: () => void
	onSuccess: () => void
}

/** Confirmation step — collects visitor info and books via the API. */
export default function BookingConfirm({ dateISO, hour, onBack, onSuccess }: BookingConfirmProps) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const { book, loading, error, success, meetLink } = useBooking()

	const timezone = getUserTimezone()
	const date = new Date(dateISO + 'T12:00:00') // noon to avoid TZ date shift

	const formattedDate = date.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric',
	})
	const formattedTime = formatHour(hour)

	const canSubmit = name.trim().length > 0 && email.includes('@') && !loading

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!canSubmit) return

		const booked = await book({
			dateISO,
			hour,
			visitorName: name.trim(),
			visitorEmail: email.trim(),
		})

		if (booked) onSuccess()
	}

	// ── Success state ───────────────────────────────────────────
	if (success) {
		return (
			<div className="flex flex-col items-center text-center gap-6 w-full">
				<div className="flex flex-col gap-1">
					<p className="text-green font-sans text-lg font-medium m-0">
						You&apos;re booked!
					</p>
					<p className="text-slate font-mono text-xs m-0 mt-1">
						Check your email for a calendar invite.
					</p>
				</div>

				<div className="bg-light-navy/30 backdrop-blur-xl border border-lightest-navy/10 rounded-[16px] p-5 w-full max-w-[320px]">
					<p className="text-lightest-slate font-sans text-base font-medium m-0">
						{formattedDate}
					</p>
					<p className="text-green font-mono text-sm m-0 mt-1">
						{formattedTime}
					</p>
					<p className="text-dark-slate font-mono text-xs m-0 mt-1">
						{timezone} &middot; {MEETING_DURATION} min
					</p>
					{meetLink && (
						<a
							href={meetLink}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block mt-3 text-green font-mono text-xs hover:text-lightest-slate transition-colors duration-200"
						>
							Join Google Meet &rarr;
						</a>
					)}
				</div>
			</div>
		)
	}

	// ── Form state ──────────────────────────────────────────────
	return (
		<div className="flex flex-col items-center text-center gap-6 w-full">
			{/* Summary */}
			<div className="flex flex-col gap-1">
				<p className="text-lightest-slate font-sans text-lg font-medium m-0">
					{formattedDate}
				</p>
				<p className="text-green font-mono text-base m-0">
					{formattedTime}
				</p>
				<p className="text-dark-slate font-mono text-xs m-0 mt-1">
					{timezone} &middot; {MEETING_DURATION} min
				</p>
			</div>

			{/* Booking form */}
			<form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-[320px]">
				<input
					type="text"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					maxLength={100}
					className={cn(
						'w-full py-[12px] px-[16px] rounded-[10px] text-sm font-mono',
						'bg-light-navy/30 border border-lightest-navy/10 text-lightest-slate',
						'placeholder:text-dark-slate',
						'outline-none transition-colors duration-200',
						'focus:border-green/40 focus:bg-light-navy/50',
					)}
				/>
				<input
					type="email"
					placeholder="Your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					maxLength={254}
					className={cn(
						'w-full py-[12px] px-[16px] rounded-[10px] text-sm font-mono',
						'bg-light-navy/30 border border-lightest-navy/10 text-lightest-slate',
						'placeholder:text-dark-slate',
						'outline-none transition-colors duration-200',
						'focus:border-green/40 focus:bg-light-navy/50',
					)}
				/>

				{/* Error message */}
				{error && (
					<p className="text-[#ff6b6b] font-mono text-xs m-0 text-left">
						{error}
					</p>
				)}

				{/* Actions */}
				<button
					type="submit"
					disabled={!canSubmit}
					className={cn(
						'btn py-[14px] px-[24px] text-center w-full',
						'disabled:opacity-40 disabled:cursor-not-allowed',
					)}
				>
					{loading ? 'Booking...' : 'Confirm Booking'}
				</button>

				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="text-slate font-mono text-xs hover:text-green transition-colors duration-200 disabled:opacity-40"
				>
					&larr; Pick a different time
				</button>
			</form>
		</div>
	)
}
