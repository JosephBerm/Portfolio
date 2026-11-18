import { WIND } from './miamiConfig'
import { airIn, easedShare, massIn, turbulenceOf, type WeatherEase } from './miamiWeather'
import { hashCell } from './random'
import { smoothstep } from './scene'

/**
 * The gusts of the landing scene's air, and when each reaches a place. They are frozen in the air the wind moves: the air's clock
 * (SceneWind.airClock) is cut into cells of WIND.gust.every seconds, and each cell holds one gust or none, at a place in it and with
 * a hold, a push, a pace and a profile along its path drawn from a hash of the cell's index and of which air it is
 * (WeatherEase.mass), so no stretch of gusts ever comes round again, and a wind that turns round brings new air past the trees,
 * never the gusts they have had. A gust reaches a place when the air carrying it does, at its own pace, which the course of the
 * weather gives from the past alone, so a change of weather moves no gust that has already arrived. Each gust brings the push of
 * the wind it came in, on that wind's side, and that wind damps its answer; its rise, hold and fall then run in real seconds from
 * its arrival, so every tree answers it at its own pace, and on its side, whatever the wind does after.
 */

const TAU = Math.PI * 2

/** Salts that keep each seeded quantity's draws apart from the others'. */
const MARK_SALT = 0x6d61726b
const RANK_SALT = 0x72616e6b
const HOLD_SALT = 0x686f6c64
const PUSH_SALT = 0x70757368
const PACE_SALT = 0x70616365
const REACH_SALT = 0x72656163
const PHASE_SALT = 0x70686173

/** The default weather's turbulence: the gusts are as WIND lists them there, and grow with a weather's turbulence against it. */
export const USUAL_TURBULENCE = turbulenceOf(WIND.reference)

/** The longest a gust takes to pass a place, s: in the lightest wind that still brings one (WIND.push.calm). */
export const LONGEST_GUST = ((WIND.gust.rise + WIND.gust.hold[1] + WIND.gust.fall) * WIND.reference) / WIND.push.calm

/** A uniform number in [0, 1) from a cell of the air, which air it is and a salt, the same every time. */
function unit(cell: number, mass: number, salt: number): number {
	return hashCell(cell, WIND.gust.seed + mass, salt) / 4294967296
}

/** The value `share` of the way from the first of `range` to the second. */
function along(range: readonly [number, number], share: number): number {
	return range[0] + (range[1] - range[0]) * share
}

/**
 * Where gustArrivals writes, made once and reused: for each gust that reached the place, the moment (the scene's clock); its weight,
 * the push it brings there as the wind it came in makes it (that wind's side, its drag on a crown and its turbulence); that wind's
 * speed (m/s), which damps the answer; and its rise, hold and fall in real seconds.
 */
export interface Arrivals {
	times: Float64Array
	weight: Float64Array
	speed: Float64Array
	rise: Float64Array
	hold: Float64Array
	fall: Float64Array
}

/** Room for `size` arrivals. */
export function createArrivals(size: number): Arrivals {
	return {
		times: new Float64Array(size),
		weight: new Float64Array(size),
		speed: new Float64Array(size),
		rise: new Float64Array(size),
		hold: new Float64Array(size),
		fall: new Float64Array(size),
	}
}

/** The mean wind (m/s) at `clock` as one change has it, as the frame's wind reads it. */
function speedIn(link: WeatherEase, clock: number): number {
	return link.from.speed + (link.to.speed - link.from.speed) * easedShare(link, clock)
}

/** The moment in (p, q], where one change's air clock is monotone, at which the air's clock reaches `v`. */
function solveIn(link: WeatherEase, p: number, q: number, v: number, ap: number, aq: number): number {
	let lo = p
	let hi = q
	const rising = aq > ap
	// A first guess along the chord, then Newton's steps, kept inside the bracket that holds the answer
	let t = p + ((v - ap) / (aq - ap)) * (q - p)
	for (let i = 0; i < 40; i++) {
		const f = airIn(link, t) - v
		if (Math.abs(f) < 1e-12) return t
		if (rising ? f < 0 : f > 0) lo = t
		else hi = t
		const rate = speedIn(link, t) / WIND.reference
		let next = rate !== 0 ? t - f / rate : (lo + hi) / 2
		if (!(next > lo && next < hi)) next = (lo + hi) / 2
		t = next
	}
	return t
}

/**
 * Records the gusts of the air `mass` that reach a place `x` m across the scene (`offset` seconds of the air's clock behind the
 * scene's middle) in (p, q], where one change's air clock is monotone; returns the new count.
 */
function crossIn(link: WeatherEase, p: number, q: number, x: number, offset: number, mass: number, out: Arrivals, count: number): number {
	if (!(q > p)) return count
	const ap = airIn(link, p)
	const aq = airIn(link, q)
	if (ap === aq) return count
	const rising = aq > ap
	const lo = rising ? ap : aq
	const hi = rising ? aq : ap
	// A straight stretch: before the change began, after its ease, or a change that lands at once
	const straight = link.span <= 0 || q <= link.since || p >= link.since + link.span
	const { every, share, pace, rise, hold, fall, push, vary, reach } = WIND.gust
	// A gust passes the scene's middle at its mark and reaches x when the air's clock has gone x over its own speed further
	const slowest = x / (WIND.reference * pace[0])
	const fastest = x / (WIND.reference * pace[1])
	const least = offset + Math.min(slowest, fastest)
	const most = offset + Math.max(slowest, fastest)
	for (let cell = Math.floor((lo - most) / every) - 1; cell <= Math.floor((hi - least) / every); cell++) {
		if (unit(cell, mass, RANK_SALT) >= share) continue
		const v = (cell + unit(cell, mass, MARK_SALT)) * every + offset + x / (WIND.reference * along(pace, unit(cell, mass, PACE_SALT)))
		// (p, q] in time is (lo, hi] while the air's clock rises and [lo, hi) while it falls
		if (rising ? v <= lo || v > hi : v < lo || v >= hi) continue
		if (count >= out.times.length) return count
		const t = straight ? p + ((v - ap) / (aq - ap)) * (q - p) : solveIn(link, p, q, v, ap, aq)
		// The wind the gust came in: its side, its drag on a crown and its turbulence give the gust its push. A gust the air brings past
		// slower than WIND.push.calm brings nothing: where a wind turns round, the air drifts back and forth with none behind it
		const eased = easedShare(link, t)
		const blowing = link.from.speed + (link.to.speed - link.from.speed) * eased
		const wind = Math.abs(blowing)
		const gustiness = link.from.gustiness + (link.to.gustiness - link.from.gustiness) * eased
		const stir = (turbulenceOf(blowing) * gustiness) / USUAL_TURBULENCE
		const drag = (wind / WIND.reference) ** WIND.push.power
		const gate = smoothstep(0, WIND.push.calm, wind)
		// The faster the air carries a gust past, the sooner it has passed
		const passing = WIND.reference / Math.max(wind, WIND.push.calm)
		// Its push grows and fades along its path, so neighbouring trees take it at strengths of their own
		const profile = 1 + vary * Math.sin((TAU * x) / along(reach, unit(cell, mass, REACH_SALT)) + TAU * unit(cell, mass, PHASE_SALT))
		out.times[count] = t
		out.weight[count] = (blowing < 0 ? -1 : 1) * drag * stir * gate * along(push, unit(cell, mass, PUSH_SALT)) * profile
		out.speed[count] = wind
		out.rise[count] = rise * passing
		out.hold[count] = along(hold, unit(cell, mass, HOLD_SALT)) * passing
		out.fall[count] = fall * passing
		count++
	}
	return count
}

/**
 * Every gust that reached a place `x` m across the scene (right positive), `offset` seconds of the air's clock behind the scene's
 * middle, in (`after`, `upTo`] of the scene's clock: when the air carrying it got there, from the course of the weather. Writes into
 * `out`, newest change first, and returns how many it found (at most out.times.length). `after` must lie within WEATHER.memory of
 * the newest change's clock.
 */
export function gustArrivals(ease: WeatherEase, after: number, upTo: number, x: number, offset: number, out: Arrivals): number {
	let count = 0
	let end = upTo
	for (let link: WeatherEase | null = ease; link; link = link.before) {
		const from = link.before ? Math.max(link.since, after) : after
		if (end > from) {
			// The change's monotone stretches: before it began (the oldest kept alone), its ease up to where the wind turns round and from
			// there, and after its ease. From its turn on, the air is the next one
			const start = link.since
			const finish = link.since + link.span
			let p = from
			if (start > p && start < end) {
				count = crossIn(link, p, start, x, offset, massIn(link, p), out, count)
				p = start
			}
			if (link.turn > p && link.turn < end) {
				count = crossIn(link, p, link.turn, x, offset, massIn(link, p), out, count)
				p = link.turn
			}
			if (finish > p && finish < end) {
				count = crossIn(link, p, finish, x, offset, massIn(link, p), out, count)
				p = finish
			}
			count = crossIn(link, p, end, x, offset, massIn(link, p), out, count)
		}
		if (!link.before || link.since <= after) break
		end = Math.min(end, link.since)
	}
	return count
}
