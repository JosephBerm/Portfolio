'use client'

import { MotionConfig } from 'motion/react'

/** Honors the OS reduce-motion setting on every route: Motion skips transform animations and keeps fades. */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
	return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
