import { BOAT, WATER } from './miamiConfig'
import { hashCell } from './random'
import { smoothstep } from './scene'

/**
 * The water's motion as pure functions of a clock and a level, so any frame can be reproduced from the two numbers alone.
 * `clock` is the seconds of ambient motion the scene has run and `level` how much of it shows, 0 to 1: at 0 every function
 * answers with the still pose, a frozen picture of the water chosen to look well, and the clock itself stands still. The
 * boat that crosses the water is here too, since it rides on it.
 */

const TAU = Math.PI * 2

/** Salts that keep each seeded quantity's draws apart from the others'. */
const WAVE_SALT = 0x77617665
const BAND_SALT = 0x62616e64
const LIFE_SALT = 0x6c696665
const SPOT_SALT = 0x73706f74

/** A uniform number in [0, 1) from two integers and a salt, the same every time. */
function unit(a: number, b: number, salt: number): number {
	return hashCell(a, b, WATER.glitter.seed + salt) / 4294967296
}

/** Each wave that rows ride on starts at its own seeded point of its cycle, so no two waves start together. */
const WAVES = WATER.waves.map((wave, k) => ({ ...wave, start: TAU * unit(k, 0, WAVE_SALT) }))

/** One strip of the water, counted from the waterline down. */
export interface WaterRow {
	/** Its place in the stack, 0 at the waterline: where the row stands in the waves' cycles. */
	index: number
	/** Where it starts and how tall it is, in device px below the waterline. */
	top: number
	height: number
	/** How deep in the water its middle lies, 0 at the waterline and 1 at the page's end. */
	depth: number
}

/**
 * The strips the water is drawn in, from the waterline down. The first is `WATER.strips.firstDevicePx` tall and each is
 * `growth` times the one above (to the nearest whole device px, and never under one), so rows near the horizon are thin and
 * rows near the viewer thick, as in perspective. Their heights add up to `bandDevicePx` exactly: the last one is cut short.
 */
export function waterRows(bandDevicePx: number): readonly WaterRow[] {
	const { firstDevicePx, growth } = WATER.strips
	const rows: WaterRow[] = []
	let covered = 0
	for (let index = 0; covered < bandDevicePx; index++) {
		const height = Math.min(bandDevicePx - covered, Math.max(1, Math.round(firstDevicePx * growth ** index)))
		rows.push({ index, top: covered, height, depth: (covered + height / 2) / bandDevicePx })
		covered += height
	}
	return rows
}

/** The sum of the waves at a row and a time; `quarter` turns every wave a quarter cycle, which gives the second, unrelated shift of the same rows. */
function wave(row: number, clock: number, quarter: number): number {
	let sum = 0
	for (const w of WAVES) sum += w.share * Math.sin(TAU * (clock / w.period + row / w.rows) + w.start + quarter)
	return sum
}

/** How far a row of the water is moved, in CSS px: `dx` sideways and `dy` in the picture's own rows, which smear the water rather than shake it. */
export interface RowShift {
	dx: number
	dy: number
}

/**
 * Where a strip of the water is moved at `clock`. Each row rides the waves at its own point of their cycles, so no part of the water moves
 * as one sheet. The sideways shift grows from `shiftX.top` at the waterline to `shiftX.atHalf` by half way down and then
 * stays; the vertical one grows to `shiftRow.bottom` at the bottom. At `level` 0 the rows stand where they do at
 * `WATER.stillClock`.
 */
export function rowShift(row: WaterRow, clock: number, level: number, out: RowShift): RowShift {
	const { shiftX, shiftRow, stillClock } = WATER
	const across = shiftX.top + (shiftX.atHalf - shiftX.top) * Math.min(1, row.depth / 0.5)
	const down = shiftRow.top + (shiftRow.bottom - shiftRow.top) * row.depth ** shiftRow.power
	let x = wave(row.index, stillClock, 0)
	let y = wave(row.index, stillClock, Math.PI / 2)
	if (level > 0) {
		x += (wave(row.index, clock, 0) - x) * level
		y += (wave(row.index, clock, Math.PI / 2) - y) * level
	}
	out.dx = across * x
	out.dy = down * y
	return out
}

/** The middle of ripple band `band`, as a depth: the bands are the stops of `WATER.ripple.bands`, the first from the waterline. */
export function rippleBandDepth(band: number): number {
	const { bands } = WATER.ripple
	return ((bands[band - 1] ?? 0) + (bands[band] ?? 1)) / 2
}

/**
 * How far the crests of ripple band `band` in layer `layer` (0 for the first, 1 for the second, which drifts slower) have
 * drifted right at `clock` (CSS px, without wrapping): the drift grows from `drift[0]` px a second at the waterline to
 * `drift[1]` at the bottom, with the wind.
 */
export function rippleOffset(band: number, layer: number, clock: number): number {
	const { drift, crestBRate } = WATER.ripple
	return (drift[0] + (drift[1] - drift[0]) * rippleBandDepth(band)) * (layer === 0 ? 1 : crestBRate) * clock
}

/**
 * The share of its light that layer `layer` of the ripples has in band `band`, 0 to 1. In motion the two layers trade places
 * (their shares add up to 1) over each band's own life, which is longer toward the viewer and starts at a seeded point of its
 * cycle in every band, so crests fade in and out with no pop and the bands never slide as rigid sheets. At `level` 0 they hold
 * the same split in every band, `WATER.ripple.stillAlpha` for the first layer and the rest for the second, so the two still add
 * up to 1: a still frame carries as much crest light as a moving one, and a Play doesn't dim the water.
 */
export function rippleAlpha(band: number, layer: number, clock: number, level: number): number {
	const { life, stillAlpha } = WATER.ripple
	const still = layer === 0 ? stillAlpha : 1 - stillAlpha
	if (level <= 0) return still
	const cycle = life[0] + (life[1] - life[0]) * rippleBandDepth(band)
	const first = 0.5 - 0.5 * Math.cos(TAU * (clock / cycle + unit(band, 0, BAND_SALT)))
	return still + ((layer === 0 ? first : 1 - first) - still) * level
}

/** The half-width (CSS px) of the sun's glow column at `depth` in the water, for a sun of radius `sunR`: the column widens as it comes toward the viewer. */
export function columnReach(depth: number, sunR: number): number {
	const { reach } = WATER.glow
	return sunR * (reach[0] + reach[1] * depth ** reach[2])
}

/** One glint of the glitter. */
export interface Glint {
	/** How far from the sun's column it stands, in widths of the column at its depth (negative to the left). */
	across: number
	/** How deep in the water, 0 at the waterline to 1 at the page's end. */
	depth: number
	/** How bright, 0 to `WATER.glitter.peak`, before the column's openness and the copy's quiet. */
	alpha: number
	/** Its size, CSS px. */
	width: number
	height: number
}

/** The glitter's two fields of glints: the frozen one of the still pose, and the live one that runs on the clock. */
export type GlintField = 'still' | 'live'

/**
 * Glint number `slot` of one of the glitter's two fields: the `still` one is frozen at `WATER.stillClock` whatever the clock
 * is, and the `live` one runs on `clock`. A glint can't move from one place to another, so while `level` (how much of the
 * motion shows, 0 to 1) eases, on a Play, a Pause or the rest after idle, the still field fades out as the live one fades in:
 * each field's alpha is its own times its share of the level, `1 - level` for the still one and `level` for the live one, and
 * a caller draws both while the level is between 0 and 1. At 0 only the still field has any light, at 1 only the live one.
 * A slot is born again every few seconds at a new place, brightening and fading with a smooth envelope (under 1.25 flashes a
 * second), and where it stands, and the length of its own life, follow from the slot's number alone. Places are weighted toward
 * the horizon and thin out away from the sun's column.
 */
export function glintAt(slot: number, clock: number, level: number, field: GlintField, out: Glint): Glint {
	const { life, width, height, peak } = WATER.glitter
	const { fade } = WATER.glow
	const live = field === 'live'
	const time = live ? clock : WATER.stillClock
	const share = Math.min(1, Math.max(0, live ? level : 1 - level))
	const cycle = life[0] + (life[1] - life[0]) * unit(slot, -1, LIFE_SALT)
	const age = time / cycle + unit(slot, -2, LIFE_SALT)
	const born = Math.floor(age)
	const lifeShare = age - born
	const depth = unit(slot, born, SPOT_SALT) ** 1.6
	// A normal deviate (Box-Muller) from two draws, cut at three deviations; the column's density is exp(-(x / width) squared), whose deviation is width over the root of two
	const deviate = Math.sqrt(-2 * Math.log(1 - unit(slot, born, SPOT_SALT + 1))) * Math.cos(TAU * unit(slot, born, SPOT_SALT + 2))
	out.across = Math.max(-3, Math.min(3, deviate)) / Math.SQRT2
	out.depth = depth
	const envelope = Math.sin(Math.PI * lifeShare)
	out.alpha = share * peak * envelope * envelope * (1 - smoothstep(fade[0], fade[1], depth)) ** fade[2]
	out.width = width[0] + (width[1] - width[0]) * depth
	out.height = height[0] + (height[1] - height[0]) * depth
	return out
}

/** How far the hull's bow lies ahead of its center, as a share of the boat's length: the most forward point of its outline. */
const BOW = Math.max(...BOAT.hull.map((point) => point[0]))

/** Where the boat is and how it rides the water, at one moment. */
export interface BoatPose {
	/** The hull's center, CSS px from the canvas's left. */
	x: number
	/** Where its bow is, the point its wake springs from. */
	bow: number
	/** How far it has sunk with the swell, CSS px, down positive. */
	bob: number
	/** How far its bow has dipped, degrees, down positive. */
	pitch: number
}

/**
 * Where the boat is at `clock`, and whether it is in sight. It crosses the canvas from left to right at its speed, from where it stands at
 * clock 0 (`BOAT.startX` of the width) until its wake, which trails the bow by `BOAT.wake.lengths` of its lengths, has left by the right edge;
 * then it waits out of sight for `BOAT.pause` seconds and comes in again from the left. All of it is a function of the clock, so a pause
 * holds it where it is and a Play goes on from there. As much as `level` shows it also rides the swell, sinking and dipping its bow by
 * `BOAT.bob` on one period; at level 0 it sits level on the water. `length` is the boat's own, in CSS px, and `width` the canvas's. False
 * while the boat is out of sight, which leaves `out` as it was.
 */
export function boatAt(clock: number, level: number, width: number, length: number, narrow: boolean, out: BoatPose): boolean {
	const klass = narrow ? 'narrow' : 'wide'
	const speed = BOAT.speed[klass]
	const from = -BOW * length
	const to = width + (BOAT.wake.lengths - BOW) * length
	const crossing = (to - from) / speed
	const cycle = crossing + BOAT.pause
	// Seconds into the crossing: it began at clock 0 with the boat at its starting place
	const into = (((clock + (BOAT.startX[klass] * width - from) / speed) % cycle) + cycle) % cycle
	if (into >= crossing) return false
	const swell = (TAU * clock) / BOAT.bob.period
	out.x = from + speed * into
	out.bow = out.x + BOW * length
	out.bob = BOAT.bob.px * level * Math.sin(swell)
	out.pitch = BOAT.bob.pitch * level * Math.cos(swell)
	return true
}
