import { QUIET, QUIET_REACH } from './config'
import type { Point } from './meteors'
import type { SkyRect } from './protocol'
import { easedQuietFactor, quietAt, sameRects, type QuietBlend, type QuietKeeps } from './scene'

/**
 * Farthest from a padded quiet zone that the quiet math looks (CSS px): a zone more than this away on either axis adds
 * nothing to any quiet factor, and the ink term only reaches inside it. QUIET_REACH is measured from a text rect, before
 * the padding. A path that must stay in clear sky keeps this far from every padded zone (segmentClear).
 */
export const ZONE_REACH = QUIET_REACH - QUIET.padding

/** Side of the square screen tiles the zones are bucketed into (CSS px). */
const TILE = 64

/** Spacing of segmentClear's samples along a segment (CSS px). */
const SEGMENT_STEP = 8

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

/**
 * True when the segment from `a` to `b` stays clear of every zone's reach: quietAt is 0 at points at most SEGMENT_STEP
 * apart along it. This is the clear-sky test of the paths planned outside the shooting-star planner, which has its own. A
 * graze under 0.2 px deep into a feather's rounded corner can slip between two samples, where the drawing's
 * transientQuietFactor dims it anyway.
 */
export function segmentClear(zones: readonly SkyRect[], a: Point, b: Point): boolean {
	const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SEGMENT_STEP))
	for (let i = 0; i <= steps; i++) {
		if (quietAt(zones, a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps) > 0) return false
	}
	return true
}

/**
 * Replaces the contents of `out` with the zones whose box grown by ZONE_REACH touches the tile [x0, x1] × [y0, y1], in
 * their original order. Fills a list in place, so a rebuild makes no garbage.
 */
function fillZonesNear(out: SkyRect[], zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): void {
	out.length = 0
	for (const zone of zones) if (zoneReaches(zone, x0, y0, x1, y1)) out.push(zone)
}

/** An empty index; update() fills it. */
export function createQuietIndex(): QuietIndex {
	let from: readonly SkyRect[] = []
	let to: readonly SkyRect[] = []
	let tiles: { from: SkyRect[]; to: SkyRect[]; level: number }[] = []
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
				if (regrid) {
					gridWidth = width
					gridHeight = height
					origin = -margin
					columns = Math.max(1, Math.ceil((width + 2 * margin) / TILE))
					rows = Math.max(1, Math.ceil((height + 2 * margin) / TILE))
					// Only a new grid allocates tiles: while the grid stays, a scroll or an ease refills their zone lists in place
					tiles = []
				}
				for (let row = 0; row < rows; row++) {
					for (let column = 0; column < columns; column++) {
						const x0 = origin + column * TILE
						const y0 = origin + row * TILE
						let tile = tiles[row * columns + column]
						if (!tile) {
							tile = { from: [], to: [], level: blend.level }
							tiles.push(tile)
						}
						fillZonesNear(tile.from, from, x0, y0, x0 + TILE, y0 + TILE)
						fillZonesNear(tile.to, to, x0, y0, x0 + TILE, y0 + TILE)
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
