import { WATER } from './miamiConfig'
import { hashCell } from './random'
import { smoothstep } from './scene'

/**
 * The water's motion as pure functions of a clock and a level, so any frame can be reproduced from the two numbers alone.
 * `clock` is the seconds of ambient motion the scene has run and `level` how much of it shows, 0 to 1: at 0 every function
 * answers with the still pose, a frozen picture of the water chosen to look well, and the clock itself stands still.
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

/** The seeded phase of each wave that rows ride on, so no two waves start together. */
const WAVES = WATER.waves.map((wave, k) => ({ ...wave, phase: TAU * unit(k, 0, WAVE_SALT) }))

/**
 * The strips the water is drawn in, as heights in device px from the waterline down. The first is `WATER.strips.firstDevicePx`
 * tall and each is `growth` times the one above (to the nearest whole device px, and never under one), so rows near the horizon
 * are thin and rows near the viewer thick, as in perspective. They add up to `band` exactly: the last one is cut short.
 */
export function waterRows(band: number): Int32Array {
	const { firstDevicePx, growth } = WATER.strips
	const heights: number[] = []
	let covered = 0
	for (let i = 0; covered < band; i++) {
		const height = Math.min(band - covered, Math.max(1, Math.round(firstDevicePx * growth ** i)))
		heights.push(height)
		covered += height
	}
	return Int32Array.from(heights)
}

/** How deep in the water each row's middle lies, 0 at the waterline and 1 at the page's end; the rows add up to the band. */
export function rowDepths(rows: Int32Array): Float32Array {
	const band = rows.reduce((sum, height) => sum + height, 0)
	const depths = new Float32Array(rows.length)
	let top = 0
	rows.forEach((height, i) => {
		depths[i] = band > 0 ? (top + height / 2) / band : 0
		top += height
	})
	return depths
}

/** The sum of the waves at a row and a time; `quarter` turns every wave a quarter cycle, which gives the second, unrelated shift of the same rows. */
function wave(row: number, clock: number, quarter: number): number {
	let sum = 0
	for (const w of WAVES) sum += w.share * Math.sin(TAU * (clock / w.period + row / w.rows) + w.phase + quarter)
	return sum
}

/** How far a row of the water is moved, in CSS px: `x` sideways and `y` in the picture's own rows, which smear the water rather than shake it. */
export interface RowShift {
	x: number
	y: number
}

/**
 * Where row `row` of the water, at `depth` (0 at the waterline, 1 at the page's end), is moved at `clock`. Each row rides the
 * waves at its own phase, so no part of the water moves as one sheet. The sideways shift grows from `shiftX.top` at the
 * waterline to `shiftX.atHalf` by half way down and then stays; the vertical one grows to `shiftRow.bottom` at the bottom.
 * At `level` 0 the rows stand where they do at `WATER.stillClock`.
 */
export function rowShift(row: number, clock: number, level: number, depth: number, out: RowShift): RowShift {
	const { shiftX, shiftRow, stillClock } = WATER
	const across = shiftX.top + (shiftX.atHalf - shiftX.top) * Math.min(1, depth / 0.5)
	const down = shiftRow.top + (shiftRow.bottom - shiftRow.top) * depth ** shiftRow.power
	let x = wave(row, stillClock, 0)
	let y = wave(row, stillClock, Math.PI / 2)
	if (level > 0) {
		x += (wave(row, clock, 0) - x) * level
		y += (wave(row, clock, Math.PI / 2) - y) * level
	}
	out.x = across * x
	out.y = down * y
	return out
}

/** The middle of ripple band `band`, as a depth: the bands are the stops of `WATER.ripple.bands`, the first from the waterline. */
export function rippleBandDepth(band: number): number {
	const { bands } = WATER.ripple
	return ((bands[band - 1] ?? 0) + (bands[band] ?? 1)) / 2
}

/**
 * How far the ripples of a band at `depth` have drifted right at `clock` (CSS px, without wrapping), at `rate` times the first
 * layer's pace: the drift grows from `drift[0]` px a second at the waterline to `drift[1]` at the bottom, with the wind.
 */
export function rippleOffset(depth: number, rate: number, clock: number): number {
	const { drift } = WATER.ripple
	return (drift[0] + (drift[1] - drift[0]) * depth) * rate * clock
}

/**
 * The share of its light that the first of the two ripple layers has in band `band`, 0 to 1; the second has the rest. The two
 * layers trade places over each band's own life, which is longer toward the viewer and starts at a seeded point of its cycle
 * in every band, so crests fade in and out with no pop and the bands never slide as rigid sheets. At `level` 0 the
 * first layer has `WATER.ripple.stillAlpha` of it everywhere.
 */
export function rippleAlpha(band: number, clock: number, level: number): number {
	const { life, stillAlpha } = WATER.ripple
	if (level <= 0) return stillAlpha
	const cycle = life[0] + (life[1] - life[0]) * rippleBandDepth(band)
	const live = 0.5 - 0.5 * Math.cos(TAU * (clock / cycle + unit(band, 0, BAND_SALT)))
	return stillAlpha + (live - stillAlpha) * level
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

/**
 * Glint number `slot` at `clock`. A slot is born again every few seconds at a new place, brightening and fading with a smooth
 * envelope (under 1.25 flashes a second), and where it stands, and the length of its own life, follow from the slot's
 * number alone. Places are weighted toward the horizon and thin out away from the sun's column.
 */
export function glintAt(slot: number, clock: number, out: Glint): Glint {
	const { life, width, height, peak } = WATER.glitter
	const { fade } = WATER.glow
	const cycle = life[0] + (life[1] - life[0]) * unit(slot, -1, LIFE_SALT)
	const age = clock / cycle + unit(slot, -2, LIFE_SALT)
	const born = Math.floor(age)
	const phase = age - born
	const depth = unit(slot, born, SPOT_SALT) ** 1.6
	// A normal deviate (Box-Muller) from two draws, cut at three deviations; the column's density is exp(-(x / width) squared), whose deviation is width over the root of two
	const deviate = Math.sqrt(-2 * Math.log(1 - unit(slot, born, SPOT_SALT + 1))) * Math.cos(TAU * unit(slot, born, SPOT_SALT + 2))
	out.across = Math.max(-3, Math.min(3, deviate)) / Math.SQRT2
	out.depth = depth
	const envelope = Math.sin(Math.PI * phase)
	out.alpha = peak * envelope * envelope * (1 - smoothstep(fade[0], fade[1], depth)) ** fade[2]
	out.width = width[0] + (width[1] - width[0]) * depth
	out.height = height[0] + (height[1] - height[0]) * depth
	return out
}
