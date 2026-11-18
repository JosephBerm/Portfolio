'use client'

import { use, type ReactNode } from 'react'
import { POPOVER_ROW } from '@/components/styles'
import { cn } from '@/lib'
import { PopoverCloseContext } from './Popover'

interface PopoverActionProps {
	label: string
	/** A decorative glyph at the end of the row. */
	icon?: ReactNode
	/** Runs after the panel has closed, so focus is back on the trigger before the action moves it anywhere. */
	onSelect: () => void
	className?: string
}

/** A one-shot action in a popover panel: closes the panel, then acts. */
export default function PopoverAction({ label, icon, onSelect, className }: PopoverActionProps) {
	const close = use(PopoverCloseContext)
	return (
		<button
			type="button"
			onClick={() => {
				close()
				onSelect()
			}}
			className={cn(POPOVER_ROW, '[&_svg]:h-[16px] [&_svg]:w-[16px] [&_svg]:text-green', className)}
		>
			{label}
			{icon}
		</button>
	)
}
