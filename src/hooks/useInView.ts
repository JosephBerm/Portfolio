'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInViewOptions {
	/** Fraction of the element that must be visible before triggering (0-1). Default: 0.2 */
	threshold?: number
	/** Expands or shrinks the root's bounding box before computing intersections. Default: '0px' */
	rootMargin?: string
	/** If true, fires once then stops observing. Default: true */
	once?: boolean
}

/**
 * Tracks whether a DOM element is visible in the viewport using a single
 * IntersectionObserver. Attach the returned `ref` callback to any element
 * to start tracking.
 *
 * Works on both Motion and plain HTML elements — no separate `useRef` needed.
 *
 * @example
 * ```tsx
 * const { ref, inView } = useInView({ threshold: 0.3 })
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     animate={inView ? { opacity: 1 } : { opacity: 0 }}
 *   />
 * )
 * ```
 */
export function useInView({ threshold = 0.2, rootMargin = '0px', once = true }: UseInViewOptions = {}) {
	const [inView, setInView] = useState(false)
	const observerRef = useRef<IntersectionObserver | null>(null)
	const firedRef = useRef(false)

	const disconnect = useCallback(() => {
		observerRef.current?.disconnect()
		observerRef.current = null
	}, [])

	/** Ref callback — attach to any DOM element to start observing it. */
	const ref = useCallback(
		(node: Element | null) => {
			disconnect()

			if (!node || (once && firedRef.current)) return
			if (typeof IntersectionObserver === 'undefined') return

			observerRef.current = new IntersectionObserver(
				([entry]) => {
					if (!entry) return

					if (entry.isIntersecting) {
						setInView(true)
						firedRef.current = true
						if (once) disconnect()
					} else if (!once) {
						setInView(false)
					}
				},
				{ threshold, rootMargin }
			)

			observerRef.current.observe(node)
		},
		[threshold, rootMargin, once, disconnect]
	)

	useEffect(() => disconnect, [disconnect])

	return { ref, inView }
}
