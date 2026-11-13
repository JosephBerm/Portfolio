import { WIND } from './miamiConfig'
import { hashCell, mulberry32 } from './random'
import { smoothstep } from './scene'

/**
 * The wind and how it poses a palm, as pure functions of a clock, so any frame can be reproduced from the clock, the gust level
 * `e` and a `level` alone. The clock is the seconds that the swings' periods divide, which is the scene's own. At `level` 0
 * every swing is zero and the gust holds at `WIND.stillGust`, whatever `e` is: the art-directed frame, a crown already
 * blown downwind and standing still. Time is never scaled by the gust, only the amplitudes are, so a gust arriving moves
 * nothing that was already swinging.
 */

const TAU = Math.PI * 2

/** Salts that keep each seeded quantity's draws apart from the others'. */
const TRUNK_SALT = 0x7472756e
const AMPLITUDE_SALT = 0x616d706c
const PERIOD_SALT = 0x70657269
const PHASE_SALT = 0x70686173
const FLUTTER_SALT = 0x666c7574
const WANDER_SALT = 0x77616e64

/** The shares of the fan's half-width below which a frond counts as standing up, and below which as arching out; beyond them it hangs. */
const UPPER_SHARE = 0.34
const SIDE_SHARE = 0.72

/** A uniform number in [0, 1) from a palm's seed, an index and a salt, the same every time. */
function unit(seed: number, index: number, salt: number): number {
	return hashCell(seed, index, salt) / 4294967296
}

/** The value `share` of the way from the first of `range` to the second. */
function along(range: readonly [number, number], share: number): number {
	return range[0] + (range[1] - range[0]) * share
}

/** One gust of the list: when it begins (seconds into the loop), how long it holds its peak, and the gust level at the peak. */
interface Gust {
	start: number
	hold: number
	peak: number
}

/**
 * The waves the calm between gusts drifts on: how many of each fit the loop, and how much of the drift each carries. Their periods
 * are the loop over a whole number, so the drift closes with the loop and the wind has no seam where it starts again, and they
 * stand near `WIND.wander` seconds (a longer one, the wander itself, and a shorter one) so it never settles into a rhythm.
 */
const WANDER_WAVES = [
	{ cycles: Math.max(1, Math.round(WIND.gust.loop / (WIND.wander * 1.6))), weight: 0.5 },
	{ cycles: Math.max(1, Math.round(WIND.gust.loop / WIND.wander)), weight: 0.33 },
	{ cycles: Math.max(1, Math.round(WIND.gust.loop / (WIND.wander * 0.65))), weight: 0.17 },
].map((wave, i) => ({ ...wave, start: TAU * unit(WIND.gust.seed, i, WANDER_SALT) }))

/** The gusts of one loop, laid out the first time they are asked for. */
let gusts: readonly Gust[] | null = null

/**
 * Lays out the gusts of one loop of `WIND.gust.loop` seconds from the seed: as many as fit at the mean gap, each with its own hold and
 * peak and followed by a calm of its own. The calms are fitted to the loop by sharing out what is over or short among them, each by how
 * much room it has left to the end of its range, so every calm stays in its range and the loop closes: the last calm runs on into the
 * first gust of the next loop, and the same list begins again with no seam.
 */
function layOut(): readonly Gust[] {
	const { gap, rise, hold, fall, peak, loop, seed } = WIND.gust
	const random = mulberry32(seed)
	const meanGust = rise + (hold[0] + hold[1]) / 2 + fall
	const count = Math.max(1, Math.round(loop / ((gap[0] + gap[1]) / 2 + meanGust)))
	const holds: number[] = []
	const peaks: number[] = []
	const calms: number[] = []
	for (let i = 0; i < count; i++) {
		holds.push(along(hold, random()))
		peaks.push(along(peak, random()))
		calms.push(along(gap, random()))
	}
	const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)
	// What is left of the loop once the gusts have run is what the calms must add up to
	const excess = loop - sum(holds) - count * (rise + fall) - sum(calms)
	const room = calms.map((calm) => (excess >= 0 ? gap[1] - calm : calm - gap[0]))
	const total = sum(room)
	const share = total > 0 ? Math.min(1, Math.abs(excess) / total) : 0
	for (let i = 0; i < count; i++) calms[i] = (calms[i] ?? 0) + Math.sign(excess) * (room[i] ?? 0) * share
	// A loop whose range of calms is too narrow to close it is closed by the last one, so the list always repeats whole
	calms[count - 1] = (calms[count - 1] ?? 0) + loop - sum(holds) - count * (rise + fall) - sum(calms)
	// The last calm is shared between the end of the loop and the start of the next
	let start = (calms[count - 1] ?? 0) / 2
	const list: Gust[] = []
	for (let i = 0; i < count; i++) {
		list.push({ start, hold: holds[i] ?? 0, peak: peaks[i] ?? 0 })
		start += rise + (holds[i] ?? 0) + fall + (calms[i] ?? 0)
	}
	return list
}

/**
 * The level the wind rests at between gusts at `t` seconds into the loop: it drifts within `WIND.rest` on a few slow waves, over a
 * span of about `WIND.wander` seconds.
 */
function restAt(t: number): number {
	let drift = 0
	for (const wave of WANDER_WAVES) drift += wave.weight * Math.sin(TAU * ((wave.cycles * t) / WIND.gust.loop) + wave.start)
	return along(WIND.rest, 0.5 + 0.5 * drift)
}

/**
 * The gust level `e` at `clock` seconds, 0 to 1: the wind rests at a level that wanders within `WIND.rest`, and now and then a gust
 * arrives, swells to its peak in `WIND.gust.rise` seconds, holds it, and dies away over `WIND.gust.fall`. The gusts come from one seeded
 * list of `WIND.gust.loop` seconds that repeats, at gaps of their own, so nothing in it can be counted off or tapped along to. It has no
 * state: the same clock always answers the same, whatever was asked before. A gust crosses the scene at `WIND.gust.travel` px a second, so
 * a caller asks it for a place at `clock - x / WIND.gust.travel`.
 */
export function gustAt(clock: number): number {
	const { rise, fall, loop } = WIND.gust
	const t = ((clock % loop) + loop) % loop
	const calm = restAt(t)
	gusts ??= layOut()
	for (const gust of gusts) {
		const into = t - gust.start
		// The gusts run in order, so none after this one has begun
		if (into < 0) break
		const held = rise + gust.hold
		if (into >= held + fall) continue
		const swell = into < rise ? smoothstep(0, rise, into) : into < held ? 1 : 1 - smoothstep(held, held + fall, into)
		return calm + (gust.peak - calm) * swell
	}
	return calm
}

/** What the wind needs to know of a palm. */
export interface WindPalm {
	/** Seeds this palm's periods and phases, so no two palms and no two fronds swing alike. */
	seed: number
	/** The trunk's length from its foot to the crown, px: the crown's sway and lean are shares of it. */
	height: number
	/** How long the palm's fronds are, px: past `WIND.frond.fullLength` a bigger palm moves by less, so its tips never move faster than a palm of that size's. */
	frond: number
	/** Each frond's rest angle in degrees from straight up, downwind (right) positive: the hinged fronds first, then the rigid ones behind them. */
	angles: readonly number[]
	/** How many of `angles` are hinged; the rest turn as one piece. */
	hinged: number
	/** The fan's half-width in degrees: it tells a frond that stands up from one that hangs. */
	spread: number
}

/** A palm's pose, reused from call to call: its lists are filled out to the palm's frond count once and never replaced. */
export interface PalmPose {
	/** Degrees each frond turns from its rest angle, downwind (clockwise) positive: the inner part of a hinged one, the whole of a rigid one. */
	inner: number[]
	/** Degrees the outer part of a hinged frond turns beyond its inner part, in the same direction: a bend that travels outward. */
	outer: number[]
	/** The sideways shear of a hinged frond's outer part, px: the fine flutter of a gust. */
	flutter: number[]
	/** How far the crown stands downwind of its rest, px: the trunk's lean and its sway together. A point of the trunk moves by this times its share of the trunk's height to `WIND.trunk.power`, so the foot stays planted. */
	crownX: number
	/** Degrees the crown turns with the trunk's tip. */
	tilt: number
}

/** A pose with nothing in it yet; `palmPose` fills it. */
export function createPalmPose(): PalmPose {
	return { inner: [], outer: [], flutter: [], crownX: 0, tilt: 0 }
}

/**
 * Poses `palm` for gust level `e` at `clock` seconds, scaled by `level`. A frond's swing has its own period and its own start,
 * seeded, and an amplitude by how it hangs (standing up, arching out or hanging), raised with the gust and held back on the
 * upwind side, where the crown shelters it. The downwind lean of every frond rises with the gust and stays at `level` 0.
 * The outer part of a hinged frond swings the same way a little later and a little less, relative to the inner. A palm
 * whose fronds are longer than `WIND.frond.fullLength` moves by at least that much less (the scaled level also pulls the
 * gust toward `WIND.stillGust`, which lowers the gain, the lean, the flutter and the trunk's sway too), because a tip a
 * given angle away from where it was is that much further from it: the tips of a big palm on a big screen move no faster
 * than a small one's.
 */
export function palmPose(palm: WindPalm, e: number, clock: number, level: number, out: PalmPose): PalmPose {
	const { trunk, frond, flutter } = WIND
	const move = level * Math.min(1, frond.fullLength / palm.frond)
	const gust = WIND.stillGust + (e - WIND.stillGust) * move
	const count = palm.angles.length
	while (out.inner.length < count) {
		out.inner.push(0)
		out.outer.push(0)
		out.flutter.push(0)
	}
	const lean = along(frond.bias, gust)
	const gain = frond.gain[0] + frond.gain[1] * gust
	const shear = flutter.amount * gust * gust * move
	for (let i = 0; i < count; i++) {
		const angle = palm.angles[i] ?? 0
		const share = Math.abs(angle) / palm.spread
		const hanging = share < UPPER_SHARE ? frond.upper : share < SIDE_SHARE ? frond.side : frond.hanging
		const amplitude = along(hanging, unit(palm.seed, i, AMPLITUDE_SALT)) * gain * (angle < 0 ? frond.windward : 1)
		const turn = TAU * (clock / along(frond.period, unit(palm.seed, i, PERIOD_SALT)) + unit(palm.seed, i, PHASE_SALT))
		out.inner[i] = lean + move * amplitude * Math.sin(turn)
		if (i < palm.hinged) {
			out.outer[i] = move * frond.outerShare * amplitude * Math.sin(turn - frond.lag)
			out.flutter[i] = shear * Math.sin(TAU * (clock / along(flutter.period, unit(palm.seed, i, FLUTTER_SALT)) + unit(palm.seed, i, PHASE_SALT + 1)))
		} else {
			out.outer[i] = 0
			out.flutter[i] = 0
		}
	}
	const sway = Math.sin(TAU * (clock / along(trunk.period, unit(palm.seed, 0, TRUNK_SALT)) + unit(palm.seed, 1, TRUNK_SALT)))
	const second = Math.sin(TAU * ((clock * trunk.second) / along(trunk.period, unit(palm.seed, 0, TRUNK_SALT)) + unit(palm.seed, 2, TRUNK_SALT)))
	const swing = sway + trunk.secondShare * second
	out.crownX = palm.height * along(trunk.lean, gust) + move * palm.height * along(trunk.sway, gust) * swing
	out.tilt = (move * trunk.tilt * swing) / (1 + trunk.secondShare)
	return out
}
