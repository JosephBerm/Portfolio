import { QUIET, QUIET_REACH } from './config'
import type { SkyRect } from './protocol'
import { easedQuietFactor, sameRects, type QuietBlend, type QuietKeeps } from './scene'

/**
 * Farthest from a padded quiet zone that the quiet math looks (CSS px): a zone more than this away on either axis adds
 * nothing to any quiet factor, and the ink term only reaches inside it. QUIET_REACH is measured from a text rect, before
 * the padding.
 */
export const ZONE_REACH = QUIET_REACH - QUIET.padding

/** Side of the square screen tiles the zones are bucketed into (CSS px). */
const TILE = 64

/**
 * The quiet zones bucketed by screen tile, so a star looks only at the zones that can reach it. Exact: each tile keeps, in
 * their original order, the same zone objects whose box grown by ZONE_REACH touches it, and a zone beyond that reach adds
 * nothing to quietFactor, so the factor equals easedQuietFactor over all zones bit for bit.
 */
export interface QuietIndex {
	/** No zones on screen: the lookup can be skipped. */
	readonly empty: boolean
	/** Follows the zones on screen; rebuilds the buckets only when a zone list or the grid changed (scroll, layout, an ease starting or ending). */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps) for a point within `margin` of the viewport, reading only its tile's zones. */
	factor(x: number, y: number, keeps: QuietKeeps): number
}

/** True when the box [x0, x1] × [y0, y1] touches `zone` grown by ZONE_REACH: only then can the zone dim or veil anything in it. */
export function zoneReaches(zone: SkyRect, x0: number, y0: number, x1: number, y1: number): boolean {
	return zone.x - ZONE_REACH <= x1 && zone.x + zone.width + ZONE_REACH >= x0 && zone.y - ZONE_REACH <= y1 && zone.y + zone.height + ZONE_REACH >= y0
}

/** The zones whose box grown by ZONE_REACH touches the tile [x0, x1] × [y0, y1], in their original order. */
function zonesNear(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): SkyRect[] {
	return zones.filter((zone) => zoneReaches(zone, x0, y0, x1, y1))
}

/** An empty index; update() fills it. */
export function createQuietIndex(): QuietIndex {
	let from: readonly SkyRect[] = []
	let to: readonly SkyRect[] = []
	let tiles: QuietBlend[] = []
	let columns = 0
	let rows = 0
	let origin = 0
	let gridWidth = -1
	let gridHeight = -1
	return {
		get empty() {
			return from.length === 0 && to.length === 0
		},
		update(blend, width, height, margin) {
			const regrid = width !== gridWidth || height !== gridHeight || -margin !== origin
			// The zones arrive as new arrays every frame: compare their contents, headroom included
			if (regrid || !sameRects(blend.from, from) || !sameRects(blend.to, to)) {
				from = blend.from
				to = blend.to
				gridWidth = width
				gridHeight = height
				origin = -margin
				columns = Math.max(1, Math.ceil((width + 2 * margin) / TILE))
				rows = Math.max(1, Math.ceil((height + 2 * margin) / TILE))
				tiles = []
				for (let row = 0; row < rows; row++) {
					for (let column = 0; column < columns; column++) {
						const x0 = origin + column * TILE
						const y0 = origin + row * TILE
						tiles.push({ from: zonesNear(from, x0, y0, x0 + TILE, y0 + TILE), to: zonesNear(to, x0, y0, x0 + TILE, y0 + TILE), level: blend.level })
					}
				}
			}
			for (const tile of tiles) tile.level = blend.level
		},
		factor(x, y, keeps) {
			// Drawn stars lie on the grid; the clamp only guards points outside it
			const column = Math.min(columns - 1, Math.max(0, Math.floor((x - origin) / TILE)))
			const row = Math.min(rows - 1, Math.max(0, Math.floor((y - origin) / TILE)))
			const tile = tiles[row * columns + column]
			return tile ? easedQuietFactor(tile, x, y, keeps) : 1
		},
	}
}
