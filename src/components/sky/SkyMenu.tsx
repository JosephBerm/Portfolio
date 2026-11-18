'use client'

import { EyeOffSVG, SlidersSVG } from '@/components/icons'
import { Popover, PopoverAction, PopoverSwitch } from '@/components/popover'
import { SKY_CONTROL } from '@/components/styles'
import { setSkyPaused } from './skyPause'
import { setSkySoundOn } from './skySound'
import { setContentHidden } from './skyView'
import { useSkyPlayback, useSkySound, useSkyView } from './useSkyState'

/** The Hide/View controls (SkyViewToggle), of which one stands at a time. */
const VIEW_TOGGLE_SELECTOR = '[data-sky-view-toggle]'

interface SkyMenuProps {
	/** Classes for the menu's root in the navbar. */
	className?: string
	/** Told when the panel opens or closes, so the navbar can stay in place while it is open. */
	onOpenChange?: (open: boolean) => void
}

/** Hides the page's content, then hands focus to the Hide/View control that stands, the one way back on screen. */
function hideContent(): void {
	setContentHidden(true)
	const toggle = Array.from(document.querySelectorAll<HTMLElement>(VIEW_TOGGLE_SELECTOR)).find((element) => element.getClientRects().length > 0)
	toggle?.focus()
}

/**
 * The navbar's sky menu: every setting of the home sky in one place. "Animation" is the sky's pause control (WCAG 2.2.2),
 * "Music" the landing scene's song (off at every visit, WCAG 1.4.2) and "Hide page content" the Hide/View control's hide,
 * offered only where that control stands in the right rail, on screen to bring the content back (on a phone it stands at
 * the page's foot). Renders nothing until a sky runs.
 */
export default function SkyMenu({ className, onOpenChange }: SkyMenuProps) {
	const playback = useSkyPlayback()
	const view = useSkyView()
	const sound = useSkySound()
	if (!playback) return null
	return (
		<Popover
			label="Sky settings"
			title="Sky"
			icon={<SlidersSVG />}
			triggerClassName={SKY_CONTROL}
			className={className}
			onOpenChange={onOpenChange}
		>
			<PopoverSwitch label="Animation" checked={playback === 'playing'} onChange={(playing) => setSkyPaused(!playing)} />
			{sound && <PopoverSwitch label="Music" hint="Fades in as you near the sunset" checked={sound === 'on'} onChange={setSkySoundOn} />}
			{view === 'content' && (
				<PopoverAction
					label="Hide page content"
					icon={<EyeOffSVG />}
					onSelect={hideContent}
					// Where the rail's Hide/View control has no box (below md, or a window 386px tall or less; page.tsx,
					// AppFooter.tsx and skyView.ts's RAILS_QUERY and SHORT_QUERY), the footer's stands, far down the page: hiding
					// from here would leave no way back on screen. Change the 386px with theirs
					className="max-md:hidden [@media(max-height:386px)]:hidden"
				/>
			)}
		</Popover>
	)
}
