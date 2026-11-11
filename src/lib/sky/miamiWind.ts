import { WIND } from './miamiConfig'
import { hashCell } from './random'

/**
 * How the wind poses a palm, as a pure function of the gust level `e`, a clock and a `level`, so any frame can be reproduced
 * from those three numbers alone. `phase` is the seconds the swing periods divide, which is the scene's clock. At `level` 0
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

/** What the wind needs to know of a palm. */
export interface WindPalm {
	/** Seeds this palm's periods and phases, so no two palms and no two fronds swing alike. */
	seed: number
	/** The trunk's length from its foot to the crown, px: the crown's sway and lean are shares of it. */
	height: number
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
 * Poses `palm` for gust level `e` at `phase` seconds, scaled by `level`. A frond's swing has its own period and its own start,
 * seeded, and an amplitude by how it hangs (standing up, arching out or hanging), raised with the gust and held back on the
 * upwind side, where the crown shelters it. The downwind lean of every frond rises with the gust and stays at `level` 0.
 * The outer part of a hinged frond swings the same way a little later and a little less, relative to the inner.
 */
export function palmPose(palm: WindPalm, e: number, phase: number, level: number, out: PalmPose): PalmPose {
	const { trunk, frond, flutter } = WIND
	const gust = WIND.stillGust + (e - WIND.stillGust) * level
	const count = palm.angles.length
	while (out.inner.length < count) {
		out.inner.push(0)
		out.outer.push(0)
		out.flutter.push(0)
	}
	const lean = along(frond.bias, gust)
	const gain = frond.gain[0] + frond.gain[1] * gust
	const shear = flutter.amount * gust * gust * level
	for (let i = 0; i < count; i++) {
		const angle = palm.angles[i] ?? 0
		const share = Math.abs(angle) / palm.spread
		const hanging = share < UPPER_SHARE ? frond.upper : share < SIDE_SHARE ? frond.side : frond.hanging
		const amplitude = along(hanging, unit(palm.seed, i, AMPLITUDE_SALT)) * gain * (angle < 0 ? frond.windward : 1)
		const turn = TAU * (phase / along(frond.period, unit(palm.seed, i, PERIOD_SALT)) + unit(palm.seed, i, PHASE_SALT))
		out.inner[i] = lean + level * amplitude * Math.sin(turn)
		if (i < palm.hinged) {
			out.outer[i] = level * frond.outerShare * amplitude * Math.sin(turn - frond.lag)
			out.flutter[i] = shear * Math.sin(TAU * (phase / along(flutter.period, unit(palm.seed, i, FLUTTER_SALT)) + unit(palm.seed, i, PHASE_SALT + 1)))
		} else {
			out.outer[i] = 0
			out.flutter[i] = 0
		}
	}
	const sway = Math.sin(TAU * (phase / along(trunk.period, unit(palm.seed, 0, TRUNK_SALT)) + unit(palm.seed, 1, TRUNK_SALT)))
	const second = Math.sin(TAU * ((phase * trunk.second) / along(trunk.period, unit(palm.seed, 0, TRUNK_SALT)) + unit(palm.seed, 2, TRUNK_SALT)))
	const swing = sway + trunk.secondShare * second
	out.crownX = palm.height * along(trunk.lean, gust) + level * palm.height * along(trunk.sway, gust) * swing
	out.tilt = (level * trunk.tilt * swing) / (1 + trunk.secondShare)
	return out
}
