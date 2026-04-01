'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInViewGroupOptions {
	/** Fraction of each element that must be visible before triggering (0-1). Default: 0.5 */
	threshold?: number
	/** Expands or shrinks the root's bounding box before computing intersections. Default: '0px' */
	rootMargin?: string
	/** If true, each element fires once then stops being observed. Default: true */
	once?: boolean
	/**
	 * How elements are revealed:
	 * - `'ordered'` — elements reveal in DOM order (element 2 waits for element 1).
	 *   Guarantees a 1→2→3→4 sequence regardless of how fast the user scrolls.
	 * - `'independent'` — each element reveals as soon as it enters the viewport.
	 *
	 * Default: `'independent'`
	 */
	mode?: 'ordered' | 'independent'
}

/**
 * Coordinates viewport detection across a group of elements using one shared
 * IntersectionObserver (instead of N separate observers). Call `getRef(index)`
 * to get a stable ref callback for each element.
 *
 * @param count - Total number of elements in the group.
 *
 * @example
 * ```tsx
 * // Ordered reveal — cards animate 1→2→3→4 in sequence
 * const { inView, getRef } = useInViewGroup(items.length, { mode: 'ordered' })
 *
 * items.map((item, i) => (
 *   <motion.li
 *     ref={getRef(i)}
 *     initial="hidden"
 *     animate={inView[i] ? 'visible' : 'hidden'}
 *   />
 * ))
 * ```
 */
export function useInViewGroup(count: number, options: UseInViewGroupOptions = {}) {
	const { threshold = 0.5, rootMargin = '0px', once = true, mode = 'independent' } = options
	const [inView, setInView] = useState<boolean[]>(() => new Array(count).fill(false))

	const observerRef = useRef<IntersectionObserver | null>(null)
	const nodesRef = useRef<Map<number, Element>>(new Map())
	const indexLookupRef = useRef<WeakMap<Element, number>>(new WeakMap())
	const enteredRef = useRef<Set<number>>(new Set())
	const refCacheRef = useRef<Map<number, (node: Element | null) => void>>(new Map())

	// Create (or recreate) the shared observer when config changes.
	useEffect(() => {
		if (typeof IntersectionObserver === 'undefined') return

		observerRef.current = new IntersectionObserver(
			(entries) => {
				let needsUpdate = false

				for (const entry of entries) {
					if (!entry.isIntersecting) continue

					const index = indexLookupRef.current.get(entry.target)
					if (index === undefined || enteredRef.current.has(index)) continue

					enteredRef.current.add(index)
					needsUpdate = true

					if (once) observerRef.current?.unobserve(entry.target)
				}

				if (!needsUpdate) return

				setInView((prev) => {
					const next = [...prev]
					let changed = false

					if (mode === 'ordered') {
						// Walk sequentially — only reveal an element if every element before it has entered.
						for (let i = 0; i < count; i++) {
							if (next[i]) continue
							if (!enteredRef.current.has(i)) break
							next[i] = true
							changed = true
						}
					} else {
						// Reveal each element independently as it enters.
						enteredRef.current.forEach((idx) => {
							if (!next[idx]) {
								next[idx] = true
								changed = true
							}
						})
					}

					return changed ? next : prev
				})
			},
			{ threshold, rootMargin }
		)

		// Re-observe any nodes already registered (handles React StrictMode double-mount).
		nodesRef.current.forEach((node) => {
			observerRef.current?.observe(node)
		})

		return () => {
			observerRef.current?.disconnect()
			observerRef.current = null
		}
	}, [count, threshold, rootMargin, once, mode])

	/**
	 * Returns a stable ref callback for the element at `index`.
	 * Attach to any DOM or Motion element: `ref={getRef(i)}`.
	 */
	const getRef = useCallback(
		(index: number) => {
			let cachedRef = refCacheRef.current.get(index)

			if (!cachedRef) {
				cachedRef = (node: Element | null) => {
					// Clean up the previous node at this index.
					const prevNode = nodesRef.current.get(index)
					if (prevNode) {
						observerRef.current?.unobserve(prevNode)
						indexLookupRef.current.delete(prevNode)
					}

					if (node) {
						nodesRef.current.set(index, node)
						indexLookupRef.current.set(node, index)
						observerRef.current?.observe(node)
					} else {
						nodesRef.current.delete(index)
					}
				}
				refCacheRef.current.set(index, cachedRef)
			}

			return cachedRef
		},
		[]
	)

	return { inView, getRef }
}
