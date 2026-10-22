import { useCallback, useState } from 'react'

/**
 * Returns the live column count of a CSS grid container.
 * Reads `gridTemplateColumns` via ResizeObserver so the value
 * updates automatically when the viewport (or container) resizes.
 */
export function useGridColumns() {
	const [columns, setColumns] = useState(1)

	// React 19 ref cleanup: observe the node while it is attached, disconnect when it detaches
	const ref = useCallback((node: HTMLElement | null) => {
		if (!node) return
		const read = () => setColumns(getComputedStyle(node).gridTemplateColumns.split(' ').length)
		read()
		if (typeof ResizeObserver === 'undefined') return
		const ro = new ResizeObserver(read)
		ro.observe(node)
		return () => ro.disconnect()
	}, [])

	return { ref, columns }
}
