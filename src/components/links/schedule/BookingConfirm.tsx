'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { EMAIL_MAX_LENGTH, MEETING_SUMMARY, NAME_MAX_LENGTH, formatHour } from '@/lib/scheduleConfig'
import { formatLongDate } from '@/lib/scheduleTime'
import { useBooking } from '@/hooks/useBooking'
import { GLASS_PANEL } from './styles'

/** Shared styling for the booking form fields. */
const INPUT_CLASSES = cn(
	'w-full py-[12px] px-[16px] rounded-[10px] text-sm font-mono',
	'bg-light-navy/30 border border-lightest-navy/10 text-lightest-slate',
	'placeholder:text-dark-slate',
	'outline-none transition-colors duration-200',
	'focus:border-green/40 focus:bg-light-navy/50',
)

interface BookingConfirmProps {
	dateISO: string
	hour: number
	onBack: () => void
	/** Resets the flow from the success view. */
	onBookAnother: () => void
}

/** Confirmation step — collects visitor info and books via the API. */
export default function BookingConfirm({ dateISO, hour, onBack, onBookAnother }: BookingConfirmProps) {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const { book, loading, error, success, meetLink } = useBooking()
	const successRef = useRef<HTMLParagraphElement>(null)

	// Success replaces the form, focused submit button included: move focus to the confirmation so it is announced
	useEffect(() => {
		if (success) successRef.current?.focus()
	}, [success])

	const formattedDate = formatLongDate(dateISO)
	const formattedTime = formatHour(hour)

	const canSubmit = name.trim().length > 0 && email.includes('@') && !loading

	async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!canSubmit) return

		await book({
			dateISO,
			hour,
			visitorName: name.trim(),
			visitorEmail: email.trim(),
		})
	}

	// ── Success state ───────────────────────────────────────────
	if (success) {
		return (
			<div className="flex flex-col items-center text-center gap-6 w-full">
				<div className="flex flex-col gap-1">
					<p ref={successRef} tabIndex={-1} className="text-green font-sans text-lg font-medium m-0 outline-none">
						Your meeting is booked
					</p>
					<p className="text-slate font-mono text-xs m-0 mt-1">
						Check your email for a confirmation with a link to add it to your calendar.
					</p>
				</div>

				<div className={cn(GLASS_PANEL, 'w-full max-w-[320px]')}>
					<p className="text-lightest-slate font-sans text-base font-medium m-0">
						{formattedDate}
					</p>
					<p className="text-green font-mono text-sm m-0 mt-1">
						{formattedTime}
					</p>
					<p className="text-dark-slate font-mono text-xs m-0 mt-1">
						{MEETING_SUMMARY}
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

				<button
					type="button"
					onClick={onBookAnother}
					className="text-slate font-mono text-xs hover:text-green transition-colors duration-200"
				>
					Book another time
				</button>
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
					{MEETING_SUMMARY}
				</p>
			</div>

			{/* Booking form */}
			<form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-[320px]">
				<input
					type="text"
					name="name"
					autoComplete="name"
					placeholder="Your name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
					maxLength={NAME_MAX_LENGTH}
					// This step mounts after Continue's step has exited, so focus picks up where the visitor left off
					autoFocus
					className={INPUT_CLASSES}
				/>
				<input
					type="email"
					name="email"
					autoComplete="email"
					placeholder="Your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					maxLength={EMAIL_MAX_LENGTH}
					className={INPUT_CLASSES}
				/>

				{/* Error message */}
				{error && (
					<p role="alert" className="text-[#ff6b6b] font-mono text-xs m-0 text-left">
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
					{loading ? 'Booking...' : 'Confirm booking'}
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
