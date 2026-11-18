'use client'

import { useSyncExternalStore } from 'react'
import { EyeOffSVG, EyeSVG } from '@/components/icons'
import { SKY_CONTROL } from '@/components/styles'
import { cn } from '@/lib'
import { serverSkyView, setContentHidden, skyView, subscribeSkyView } from './skyView'

interface SkyViewToggleProps {
	className?: string
}

/**
 * The home page's Hide/View control: hides all of the page's content, the navbar and its pause control included, so the sky
 * and its landing scene show alone, and brings it back (so does Escape). The name says the action and changes with it, as the
 * W3C APG carousel's rotation control's does, so it carries no aria-pressed. It stays in place in both states, and renders
 * nothing until a sky runs, since without one there is nothing to show.
 */
export default function SkyViewToggle({ className }: SkyViewToggleProps) {
	const view = useSyncExternalStore(subscribeSkyView, skyView, serverSkyView)
	if (!view) return null
	const hidden = view === 'sky'
	return (
		<button
			type="button"
			aria-label={hidden ? 'Show page content' : 'Hide page content'}
			data-sky-view-toggle
			onClick={() => setContentHidden(!hidden)}
			className={cn(SKY_CONTROL, className)}
		>
			{hidden ? <EyeSVG /> : <EyeOffSVG />}
		</button>
	)
}
