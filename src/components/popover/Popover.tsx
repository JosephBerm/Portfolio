'use client'

import { createContext, useEffect, useEffectEvent, useId, useRef, type CSSProperties, type ReactNode, type ToggleEvent } from 'react'
import { cn } from '@/lib'
import styles from './Popover.module.css'

/** Closes the popover that holds the caller; a no-op outside one. Read by rows that act and then get out of the way. */
export const PopoverCloseContext = createContext<() => void>(() => {})

interface PopoverProps {
	/** The trigger's accessible name: it shows only `icon`. */
	label: string
	/** The trigger's glyph, decorative. */
	icon: ReactNode
	/** Shown at the top of the panel, and names it. */
	title: string
	/** Classes for the trigger, which carries no look of its own. */
	triggerClassName?: string
	/** Classes for the root, which holds the trigger (the panel shows in the top layer). */
	className?: string
	/** Told as the panel opens or closes, by any means (the trigger, Escape, a click outside, a row), and told it closed if the popover unmounts open. */
	onOpenChange?: (open: boolean) => void
	children: ReactNode
}

/**
 * A button that opens a panel next to it, on the Popover API: the browser gives the panel the top layer (no ancestor's
 * transform, filter or overflow clips or moves it), light dismiss, Escape, the trigger's expanded state, and a focus order
 * that runs from the trigger into the panel and back to the trigger when it closes. It is the disclosure pattern, not an
 * ARIA menu: its rows are ordinary buttons reached with Tab, with no roving focus to implement. Rows close it through
 * PopoverCloseContext.
 */
export default function Popover({ label, icon, title, triggerClassName, className, onOpenChange, children }: PopoverProps) {
	const id = useId()
	const panelRef = useRef<HTMLDivElement>(null)
	const panelId = `${id}-panel`
	const titleId = `${id}-title`
	// A dashed ident of this instance's own, for anchor positioning: useId's punctuation isn't valid in one
	const anchor = { '--popover-anchor': `--popover${id.replace(/[^\w-]/g, '')}` } as CSSProperties
	const close = () => panelRef.current?.hidePopover()
	// A popover removed while open closes without a toggle event (HTML's popover removing steps), so an unmount says so itself
	const open = useRef(false)
	const toggled = useEffectEvent((next: boolean) => onOpenChange?.(next))
	useEffect(
		() => () => {
			if (open.current) toggled(false)
		},
		[]
	)

	return (
		<div className={className} style={anchor}>
			<button type="button" popoverTarget={panelId} aria-label={label} className={cn(styles.trigger, triggerClassName)}>
				{icon}
			</button>
			<div
				ref={panelRef}
				id={panelId}
				popover="auto"
				role="group"
				aria-labelledby={titleId}
				className={styles.panel}
				// beforetoggle, not toggle: it fires at once, where toggle is queued, so the change is known before the next scroll
				onBeforeToggle={(event: ToggleEvent<HTMLDivElement>) => {
					open.current = event.newState === 'open'
					onOpenChange?.(open.current)
				}}
			>
				<p id={titleId} className="px-[12px] pt-[8px] pb-[4px] font-mono text-xxs uppercase tracking-[0.2em] text-slate">
					{title}
				</p>
				<PopoverCloseContext value={close}>{children}</PopoverCloseContext>
			</div>
		</div>
	)
}
