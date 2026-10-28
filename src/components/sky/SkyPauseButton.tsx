import { useSyncExternalStore } from 'react'
import { PauseSVG, PlaySVG } from '@/components/icons'
import { cn } from '@/lib'
import { serverSkyPlayback, setSkyPaused, skyPlayback, subscribeSkyPlayback } from './skyPause'

interface SkyPauseButtonProps {
	className?: string
}

/**
 * The home sky's pause control (WCAG 2.2.2): stops all of the sky's motion, as reduced motion does, and starts it again
 * from where it stopped. It follows the W3C APG carousel's rotation control: the name says the action and changes with
 * it, so it carries no aria-pressed. Paused by default under prefers-reduced-motion; renders nothing until a sky runs.
 */
export default function SkyPauseButton({ className }: SkyPauseButtonProps) {
	const playback = useSyncExternalStore(subscribeSkyPlayback, skyPlayback, serverSkyPlayback)
	if (!playback) return null
	const paused = playback === 'paused'
	return (
		<button
			type="button"
			aria-label={paused ? 'Play sky animation' : 'Pause sky animation'}
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-green transition-colors duration-250 hover:bg-green-tint forced-colors:hidden [&_svg]:h-[20px] [&_svg]:w-[20px]',
				className
			)}
		>
			{paused ? <PlaySVG /> : <PauseSVG />}
		</button>
	)
}
