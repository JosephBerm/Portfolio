'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Returns the live column count of a CSS grid container.
 * Reads `gridTemplateColumns` via ResizeObserver so the value
 * updates automatically when the viewport (or container) resizes.
 */
export function useGridColumns() {
	const [columns, setColumns] = useState(1)
	const elRef = useRef<HTMLElement | null>(null)

	const ref = useCallback(<T extends HTMLElement>(node: T | null) => {
		elRef.current = node
		if (node) {
			const cols = getComputedStyle(node).gridTemplateColumns.split(' ').length
			setColumns(cols)
		}
	}, [])

	useEffect(() => {
		const node = elRef.current
		if (!node || typeof ResizeObserver === 'undefined') return

		const ro = new ResizeObserver(() => {
			const cols = getComputedStyle(node).gridTemplateColumns.split(' ').length
			setColumns(cols)
		})
		ro.observe(node)
		return () => ro.disconnect()
	}, [])

	return { ref, columns }
}
