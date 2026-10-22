'use client'

import { useEffect, useRef } from 'react'
import { useIntroPhase } from '@/hooks/useIntroPhase'
import { mountSky, type SkyController } from './mountSky'

interface SkyCanvasProps {
	/** Class for the fixed, decorative root. */
	className?: string
	/** Class for the canvas, which is created imperatively: a canvas can hand its control to a worker only once. */
	canvasClassName?: string
}

/** Client island of the home sky: mounts the worker-drawn canvas once and keeps it in step with the intro loader. */
export default function SkyCanvas({ className, canvasClassName = '' }: SkyCanvasProps) {
	const hostRef = useRef<HTMLDivElement>(null)
	const skyRef = useRef<SkyController | null>(null)
	const phase = useIntroPhase()

	useEffect(() => {
		const host = hostRef.current
		if (!host) return
		const sky = mountSky(host, canvasClassName)
		skyRef.current = sky
		return () => {
			skyRef.current = null
			sky.destroy()
		}
	}, [canvasClassName])

	// Declared after the mount effect, so on mount it runs once the controller exists. It also runs when the mount
	// effect re-creates the controller, which starts at 'loading' and must catch up with the intro
	useEffect(() => {
		skyRef.current?.setPhase(phase)
	}, [phase, canvasClassName])

	return <div ref={hostRef} className={className} aria-hidden="true" />
}
