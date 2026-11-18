'use client'

import { useId } from 'react'
import { POPOVER_ROW } from '@/components/styles'
import { cn } from '@/lib'

interface PopoverSwitchProps {
	/** The setting's name. It stays the same in both states (WAI-ARIA APG switch pattern): the state is `checked`. */
	label: string
	/** A line under the label, read as the switch's description. */
	hint?: string
	checked: boolean
	onChange: (checked: boolean) => void
}

/** An on/off setting in a popover panel: a `role="switch"` button, so the panel stays open for the next setting. */
export default function PopoverSwitch({ label, hint, checked, onChange }: PopoverSwitchProps) {
	const id = useId()
	const labelId = `${id}-label`
	const hintId = `${id}-hint`
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			// Named by the label alone: the hint inside the button is its description, not part of its name
			aria-labelledby={labelId}
			aria-describedby={hint ? hintId : undefined}
			onClick={() => onChange(!checked)}
			className={cn('group', POPOVER_ROW)}
		>
			<span className="flex flex-col gap-[2px]">
				<span id={labelId}>{label}</span>
				{hint && (
					<span id={hintId} className="text-xxs text-slate">
						{hint}
					</span>
				)}
			</span>
			{/* The track and its knob: the knob slides to the end and both turn green while on */}
			<span
				aria-hidden="true"
				className="relative h-[18px] w-[32px] shrink-0 rounded-full border border-slate transition-colors duration-150 group-aria-checked:border-green group-aria-checked:bg-green-tint"
			>
				<span className="absolute top-[2px] left-[2px] h-[12px] w-[12px] rounded-full bg-slate transition-[translate,background-color] duration-150 group-aria-checked:translate-x-[14px] group-aria-checked:bg-green motion-reduce:transition-none" />
			</span>
		</button>
	)
}
