import { WIND } from './miamiConfig'
import { createArrivals, gustArrivals, LONGEST_GUST, USUAL_TURBULENCE } from './miamiGusts'
import { airClockAt, massAt, type SceneWind, type WeatherEase } from './miamiWeather'
import { hashCell } from './random'
import { smoothstep } from './scene'

/**
 * The wind of the landing scene's one weather, and how each tree answers it, as pure functions of the scene's clock and the frame's
 * wind. The wind is frozen in the air it moves: the gusts (miamiGusts.ts), the wander and the eddies reach a tree when the air
 * carrying them does (SceneWind.airClock and the course of the weather), and each tree answers as damped oscillators of its own
 * size, its trunk by its height and each frond by its length, in closed form, so every pose can be drawn again from the clock.
 * The wander and the eddies are bands of the air's turbulence, each a wave whose size and phase drift at random along the air, so
 * like the gusts no stretch of them comes round again, and a wind that turns round brings new air (WeatherEase.mass). The bands
 * reach a tree at the wind's pace, so a mode answers them only well away from its own frequency; near it, as a continuous spectrum
 * does, the turbulence drives the mode at its own frequency whatever the wind (swing). No natural frequency here reads the wind: the
 * wind sets how hard and when each tree is pushed, never the pace of a mode's own swing, and the damping it adds slows a gust's ring
 * by at most 2.2% for a trunk and 6.3% for a frond at WEATHER.strongest.
 */

const TAU = Math.PI * 2
const RADIANS = Math.PI / 180

/** Salts that keep each seeded quantity's draws apart from the others'. */
const AMPLITUDE_SALT = 0x616d706c
const PERIOD_SALT = 0x70657269
const PHASE_SALT = 0x70686173
const FLUTTER_SALT = 0x666c7574
const WANDER_SALT = 0x77616e64
const TURB_SALT = 0x74757262

/** The shares of the fan's half-width below which a frond counts as standing up, and below which as arching out; beyond them it hangs. */
const UPPER_SHARE = 0.34
const SIDE_SHARE = 0.72

/** A gust's ring is summed for this many of its mode's time constants after its push has passed, and let go over the last of them, so it ends with no step: under 2% of it is left where it starts to go. */
const RING_REACH = 5

/** A uniform number in [0, 1) from a seed, an index and a salt, the same every time. */
function unit(seed: number, index: number, salt: number): number {
	return hashCell(seed, index, salt) / 4294967296
}

/** The value `share` of the way from the first of `range` to the second. */
function along(range: readonly [number, number], share: number): number {
	return range[0] + (range[1] - range[0]) * share
}

/** What the wind needs to know of a place: where it stands, m from the scene's middle, right positive; how far its air lags the near palms' on the air's clock, s; a seed for its own eddies. */
interface WindPlace {
	x: number
	offset: number
	seed: number
}

/** What the wind needs to know of a palm: its seed, its trunk's px and real height, where it stands, its fronds and their natural frequencies. */
export interface WindPalm extends WindPlace {
	/** The trunk's length from its foot to the crown, px. */
	height: number
	/** Its trunk's first mode, Hz (trunkHz of its height in metres). */
	trunkHz: number
	/** How long its fronds are, px: past `WIND.frond.fullLength` a bigger palm moves by less. */
	frond: number
	/** Each frond's rest angle in degrees from straight up, right positive: the hinged fronds first, then the rigid ones behind them. */
	angles: readonly number[]
	/** Each frond's first mode, Hz (frondHz of its length in metres), in the order of `angles`. */
	frondHz: readonly number[]
	/** How many of `angles` are hinged; the rest turn as one piece. */
	hinged: number
	/** The fan's half-width in degrees: it tells a frond that stands up from one that hangs. */
	spread: number
}

/** What the wind needs to know of a palm top on the far shore: where it stands (m), its crown's px above the waterline, its leaves' px and its modes. */
export interface ShorePalm extends WindPlace {
	top: number
	radius: number
	trunkHz: number
	leafHz: number
}

/** A palm's pose, reused from call to call: its lists are filled out to the palm's frond count once and never replaced. */
export interface PalmPose {
	/** Degrees each frond turns from its rest angle, downwind (clockwise) positive: the inner part of a hinged one, the whole of a rigid one. */
	inner: number[]
	/** Degrees the outer part of a hinged frond turns beyond its inner part, in the same direction: a bend that travels outward. */
	outer: number[]
	/** The sideways shear of a hinged frond's outer part, px: the fine flutter of its leaflets. */
	flutter: number[]
	/** How far the crown stands downwind of its rest, px. A point of the trunk moves by this times its share of the trunk's height to `WIND.trunk.power`, so the foot stays planted. */
	crownX: number
	/** Degrees the crown turns with the trunk's tip. */
	tilt: number
}

/** A pose with nothing in it yet; `palmPose` fills it. */
export function createPalmPose(): PalmPose {
	return { inner: [], outer: [], flutter: [], crownX: 0, tilt: 0 }
}

/** A damped oscillator of unit static gain, damped `zeta0` plus `perWind` per m/s of a wind of `wind` m/s: what its answers need, reused from call to call. */
interface Mode {
	hz: number
	zeta0: number
	perWind: number
	wind: number
	wn: number
	zeta: number
	wd: number
	decay: number
	k1: number
	k2: number
}

function setMode(m: Mode, hz: number, zeta0: number, perWind: number, wind: number): Mode {
	const zeta = zeta0 + perWind * wind
	m.hz = hz
	m.zeta0 = zeta0
	m.perWind = perWind
	m.wind = wind
	m.wn = TAU * hz
	m.zeta = zeta
	m.wd = m.wn * Math.sqrt(1 - zeta * zeta)
	m.decay = zeta * m.wn
	m.k1 = (2 * zeta) / m.wn
	m.k2 = (2 * zeta * zeta - 1) / m.wd
	return m
}

const createMode = (): Mode => ({ hz: 0, zeta0: 0, perWind: 0, wind: 0, wn: 0, zeta: 0, wd: 0, decay: 0, k1: 0, k2: 0 })

/** The trunk's and a frond's modes: a frame poses one tree at a time, so two serve every tree; and a mode as a gust's own wind damps it. */
const trunkMode = createMode()
const frondMode = createMode()
const ringMode = createMode()

/** The mode's answer to a unit ramp begun `tau` seconds ago, from rest. */
function ramp(m: Mode, tau: number): number {
	if (tau <= 0) return 0
	const e = Math.exp(-m.decay * tau)
	return tau - m.k1 + e * (m.k1 * Math.cos(m.wd * tau) + m.k2 * Math.sin(m.wd * tau))
}

/** Its answer to a gust of push 1 begun `tau` seconds ago: a ramp up over `rise`, a hold, a ramp down over `fall`. */
function trapezoid(m: Mode, tau: number, rise: number, hold: number, fall: number): number {
	return (ramp(m, tau) - ramp(m, tau - rise)) / rise - (ramp(m, tau - rise - hold) - ramp(m, tau - rise - hold - fall)) / fall
}

/** A band's frequency, Hz of the air's clock: `base` times WIND.waves.step to the `k`, moved by up to WIND.waves.jitter either way by a hash, so no two bands keep a simple ratio. */
function bandHz(base: number, k: number, salt: number): number {
	const { step, jitter } = WIND.waves
	return base * step ** k * (1 + jitter * (2 * unit(WIND.gust.seed, k, salt) - 1))
}

/**
 * How many seconds of the air's clock apart a band's points stand: WIND.waves.cycles of its own periods, and never fewer than
 * WIND.waves.least, so a trunk the band rings up has time to answer each new size and phase before the next.
 */
const spanOf = (hz: number): number => Math.max(WIND.waves.cycles / hz, WIND.waves.least)

/** The rest level's bands, the slow lulls and surges: angular frequency (rad a second of the air's clock), points' spacing and weight. */
const WANDER = [0.5, 0.33, 0.17].map((weight, i) => {
	const hz = bandHz(1 / WIND.wander, i - 1, WANDER_SALT)
	return { omega: TAU * hz, span: spanOf(hz), weight }
})
const REST_MEAN = (WIND.rest[0] + WIND.rest[1]) / 2 / WIND.stillGust
const REST_SWING = (WIND.rest[1] - WIND.rest[0]) / 2 / WIND.stillGust
/** The eddies' bands: angular frequency, points' spacing, amplitude, and whether each tree, and each frond, takes it as its own. */
const EDDIES = Array.from({ length: WIND.eddies.count }, (_, k) => {
	const hz = bandHz(WIND.eddies.hz, k, TURB_SALT)
	const length = WIND.reference / hz
	return { omega: TAU * hz, span: spanOf(hz), share: hz ** (-1 / 3), local: length < WIND.eddies.coherent, frond: length < WIND.eddies.crown }
})
const EDDY_NORM = Math.sqrt(EDDIES.reduce((sum, eddy) => sum + (eddy.share * eddy.share) / 2, 0))

/**
 * A band's size and phase are drawn at points its span apart along the air (spanOf), from a hash of the point and of whose air it
 * is (its key), and eased between them, so they drift at random and never come round again: each part a uniform draw in [-1, 1),
 * scaled so a band's mean square is a sine's of the same share. The two points last read for each band are kept, since the many
 * modes of one tree read the same ones; a mode's own swing keeps its own, in a slot its key picks.
 */
const ENVELOPE = Math.sqrt(105 / 52)
const BANDS = WANDER.length + EDDIES.length
/** Room beyond the bands for the points of the modes' own swings (swing), each kept in the slot its key picks. */
const SLOTS = 1024
const pointKey = new Int32Array(BANDS + SLOTS)
const pointCell = new Float64Array(BANDS + SLOTS).fill(Number.NaN)
const points = new Float64Array((BANDS + SLOTS) * 4)
/** The size and phase a band has at the place read last, as the two parts of one complex number. */
const envelope = { re: 0, im: 0 }

/** Whose points a band reads: the air's own, a place's or a frond's (`seed`), in the air `mass`. */
const keyOf = (seed: number, band: number, mass: number): number => (seed + Math.imul(band + 1, 0x85ebca6b) + Math.imul(mass, 0xc2b2ae35)) | 0

/** One part of a band's point, in [-1, 1) times ENVELOPE. */
const pointOf = (cell: number, key: number, salt: number): number => (hashCell(cell, key, salt) / 2147483648 - 1) * ENVELOPE

/** Band `index`'s size and phase `along` its points (in spans), as `key` draws them, into `envelope`. */
function envelopeAt(index: number, along: number, key: number): void {
	// Each key's points are offset by a share of a spacing of its own, so no two places' bands ease at the same moments
	const shifted = along + (Math.imul(key, 0x9e3779b1) >>> 0) / 4294967296
	const cell = Math.floor(shifted)
	const o = index * 4
	if (pointCell[index] !== cell || pointKey[index] !== key) {
		pointCell[index] = cell
		pointKey[index] = key
		points[o] = pointOf(cell, key, TURB_SALT)
		points[o + 1] = pointOf(cell, key, TURB_SALT + 1)
		points[o + 2] = pointOf(cell + 1, key, TURB_SALT)
		points[o + 3] = pointOf(cell + 1, key, TURB_SALT + 1)
	}
	const u = shifted - cell
	const s = u * u * (3 - 2 * u)
	const re0 = points[o] ?? 0
	const im0 = points[o + 1] ?? 0
	envelope.re = re0 + ((points[o + 2] ?? 0) - re0) * s
	envelope.im = im0 + ((points[o + 3] ?? 0) - im0) * s
}

/**
 * Each band's carrier at the two phases it was read at last, the newer first: its phase, cosine and sine. One tree's modes read the
 * clock's, and each of its outer halves one a little before it, so most reads find theirs here.
 */
const carriers = new Float64Array(BANDS * 6).fill(Number.NaN)
/** The cosine and sine of the carrier read last. */
const turned = { cos: 1, sin: 0 }

/** Band `index`'s carrier at `phase`, into `turned`. */
function carrierAt(index: number, phase: number): void {
	const o = index * 6
	if (carriers[o + 3] === phase) {
		// The older read again becomes the newer
		carriers[o + 3] = carriers[o] ?? Number.NaN
		carriers[o] = phase
		const cos = carriers[o + 4] ?? 1
		const sin = carriers[o + 5] ?? 0
		carriers[o + 4] = carriers[o + 1] ?? 1
		carriers[o + 5] = carriers[o + 2] ?? 0
		carriers[o + 1] = cos
		carriers[o + 2] = sin
	} else if (carriers[o] !== phase) {
		carriers[o + 3] = carriers[o] ?? Number.NaN
		carriers[o + 4] = carriers[o + 1] ?? 1
		carriers[o + 5] = carriers[o + 2] ?? 0
		carriers[o] = phase
		carriers[o + 1] = Math.cos(phase)
		carriers[o + 2] = Math.sin(phase)
	}
	turned.cos = carriers[o + 1] ?? 1
	turned.sin = carriers[o + 2] ?? 0
}

/**
 * Band `index`'s wave (`omega` rad a second of the air's clock, its points `span` s apart) at `here` (s of the air's clock), its size
 * and phase as `key` draws them: as it is (`m` null), or as the mode `m` answers it with the wind at `rate` of the reference wind on
 * `sign`'s side, at the frequency the air carries it past at. A mode's answer follows the band's size and phase as they drift: the
 * steady answer to each, which a band that drifts no faster than its points' span lets a trunk come close to. A mode leaves a band
 * to its own swing (swing) within WIND.resonance.near times its own frequency, and answers one beyond WIND.resonance.far in full.
 */
function wave(index: number, band: { omega: number; span: number }, here: number, key: number, m: Mode | null, rate: number, sign: number): number {
	// A mode answers a wave of `r` times its own frequency by 1 / (1 - r^2 + 2i zeta r), lagging on the side the air carries it past
	const r = m ? (band.omega * rate) / m.wn : 0
	const beyond = m ? smoothstep(WIND.resonance.near, WIND.resonance.far, r > 1 ? r : 1 / r) : 1
	if (beyond <= 0) return 0
	envelopeAt(index, here / band.span, key)
	carrierAt(index, band.omega * here)
	// The wave as one complex number, its size and phase turning with the air
	const real = envelope.re * turned.cos - envelope.im * turned.sin
	if (!m) return real
	const imaginary = envelope.re * turned.sin + envelope.im * turned.cos
	const re = 1 - r * r
	const im = 2 * m.zeta * r
	return (beyond * (real * re + sign * imaginary * im)) / (re * re + im * im)
}

/** Whose points a band of the air reads: the air's own, frozen in it, `mass` numbering which air. */
const airKey = (band: number, mass: number): number => keyOf(WIND.gust.seed, band, mass)

/**
 * The lowest eddy band's frequency (Hz of the air's clock): the spectrum a swing is sized from stops rising below it, the wander
 * carrying the slower part. And the rate of the reference wind below which a swing's pace is looked up no further, WIND.push.calm's.
 */
const LOWEST_AIR_HZ = EDDIES[0] ? EDDIES[0].omega / TAU : WIND.eddies.hz
const SLOWEST_RATE = WIND.push.calm / WIND.reference
/**
 * A damped oscillator driven by a continuous spectrum swings at its own frequency with the variance pi / (4 zeta) of the spectrum's
 * density per unit of ln f there. The bands stand for that density in steps of WIND.waves.step, each holding the power of its own
 * step of ln f, so a swing is sized as a band of the same share, times sqrt(pi / (4 zeta ln step)).
 */
const SWING_GAIN = Math.sqrt(Math.PI / (4 * Math.log(WIND.waves.step)))

/**
 * Mode `m`'s own swing in the air's turbulence at `t` (the scene's clock), sized like a band's wave before `intensity` scales it.
 * The bands' wavenumbers are fixed in the air, so the wind carries them past a tree at a pace it sets, and a mode held to those
 * paces would sway at the wind's pace; a continuous spectrum drives a mode at its own frequency whatever the wind. So the swing is
 * a narrowband wave at the mode's natural frequency on the scene's clock, no pace of it reads the wind, and the wind sets only its
 * size: the spectrum's at the air's frequency that the wind carries past the mode at its own (`rate` of the reference wind), with
 * the eddies' rules for a whole crown and a frond (`part`, -1 for a crown) and the oscillator's resonant gain at the mode's
 * damping. Its size and phase drift between points WIND.resonance.span decay times of the reference wind apart, drawn from a key
 * of the tree, the part, the mode and which air (`mass`): the tree's own, not the air's, since a tree's response is its own.
 */
function swing(place: WindPlace, t: number, m: Mode, part: number, mass: number, rate: number): number {
	const air = Math.max(m.hz / Math.max(rate, SLOWEST_RATE), LOWEST_AIR_HZ)
	// How long an eddy of that frequency is, m: smaller than a crown, a whole crown feels less of it and a frond more
	const { crown, coherent, crownShare, flap } = WIND.eddies
	const inner = part < 0 ? crownShare : flap
	const felt = inner + (1 - inner) * smoothstep(crown, coherent, WIND.reference / air)
	const own = place.seed ^ Math.imul(part + 1, 0x9e3779b1)
	const key = keyOf(own, BANDS + Math.round(m.hz * 1e4), mass)
	const span = WIND.resonance.span / ((m.zeta0 + m.perWind * WIND.reference) * m.wn)
	envelopeAt(BANDS + (key & (SLOTS - 1)), t / span, key)
	const phase = m.wn * t
	return (WIND.resonance.gain * SWING_GAIN * felt * (envelope.re * Math.cos(phase) - envelope.im * Math.sin(phase))) / (Math.sqrt(m.zeta) * Math.cbrt(air))
}

/** When the gusts reached the tree being posed: filled once a tree by arrive, read by each of its modes in pushAt. */
const arrivals = createArrivals(256)

/** The calmest wind (m/s) the course has blown since `since`: none where it turned round. */
function calmest(ease: WeatherEase, since: number): number {
	let least = Infinity
	for (let link: WeatherEase | null = ease; link; link = link.before) {
		// Through its ease the wind ran between its two ends, and through 0 where it turned round; after it, at its end
		const easing = link.since + link.span > since
		least = Math.min(least, Math.abs(link.to.speed), easing ? (link.turn < Infinity ? 0 : Math.abs(link.from.speed)) : Infinity)
		if (link.since <= since) break
	}
	return least
}

/**
 * How far back the gusts of a tree whose trunk sways at `hz` can still be answered at `clock`: the longest gust, the trunk's ring as
 * the calmest wind any of them can have come in damps it, and a second for the outer halves' lateness. In no wind that is the
 * longest it can be.
 */
function reachOf(hz: number, wind: SceneWind, clock: number): number {
	const { zeta, zetaPerWind } = WIND.trunk
	const longest = LONGEST_GUST + RING_REACH / (zeta * TAU * hz) + 1
	return LONGEST_GUST + RING_REACH / ((zeta + zetaPerWind * calmest(wind.ease, clock - longest)) * TAU * hz) + 1
}

/** Finds when the gusts reached `place` in the `reach` seconds up to `clock`, from the course of the weather; returns how many. */
function arrive(place: WindPlace, wind: SceneWind, clock: number, reach: number): number {
	return gustArrivals(wind.ease, clock - reach, clock, place.x, place.offset, arrivals)
}

/**
 * The push at a place at moment `t` (the clock, or a little before it for an outer half), downwind of the frame's wind and 1 at the
 * default weather's rest: as it is (`m` null) or as the mode `m` answers it. `count` arrivals from arrive. `part` is a frond's index
 * for the eddies smaller than a crown, -1 for the whole crown. `mass` is which air the frame has (massAt at the clock), not the air
 * at `t`: the frame's wind sizes the wander, the eddies and the swing, and the frame's air keys them, so the air changes where the
 * frame's wind is 0 and every size with it, for an outer half too.
 */
function pushAt(place: WindPlace, wind: SceneWind, t: number, m: Mode | null, part: number, count: number, mass: number): number {
	const speed = Math.abs(wind.speed)
	const sign = wind.speed < 0 ? -1 : 1
	// Each gust from the moment it reached this place, in real seconds, with the push and the side of the wind it came in and that
	// wind's damping, so every ring keeps its tree's own pace and its own side whatever the wind does after
	let gusts = 0
	for (let i = 0; i < count; i++) {
		const tau = t - (arrivals.times[i] ?? 0)
		if (tau <= 0) continue
		const rise = arrivals.rise[i] ?? 0
		const hold = arrivals.hold[i] ?? 0
		const fall = arrivals.fall[i] ?? 0
		const weight = arrivals.weight[i] ?? 0
		if (m) {
			const came = arrivals.speed[i] ?? 0
			const ring = came === m.wind ? m : setMode(ringMode, m.hz, m.zeta0, m.perWind, came)
			const cut = rise + hold + fall + RING_REACH / ring.decay
			if (tau < cut) gusts += weight * trapezoid(ring, tau, rise, hold, fall) * (1 - smoothstep(cut - 1 / ring.decay, cut, tau))
		} else if (tau < rise + hold + fall) gusts += weight * (tau < rise ? tau / rise : tau < rise + hold ? 1 : 1 - (tau - rise - hold) / fall)
	}
	const scale = (speed / WIND.reference) ** WIND.push.power
	if (scale <= 0) return sign * gusts
	const live = smoothstep(0, WIND.push.calm, speed)
	// All the wind does besides its mean grows with the weather's turbulence
	const stir = (wind.turbulence / USUAL_TURBULENCE) * live
	// The air now at this place, on the air's clock: the wander and the eddies are frozen in it, as the gusts are
	const here = airClockAt(wind.ease, t) - place.x / WIND.reference - place.offset
	const rate = speed / WIND.reference
	let wander = 0
	for (let k = 0; k < WANDER.length; k++) {
		const band = WANDER[k]
		if (band) wander += band.weight * wave(k, band, here, airKey(k, mass), m, rate, sign)
	}
	let total = REST_MEAN + REST_SWING * wander * stir
	const intensity = (WIND.push.power * wind.turbulence * live) / EDDY_NORM
	for (let k = 0; k < EDDIES.length; k++) {
		const eddy = EDDIES[k]
		if (!eddy) continue
		const index = WANDER.length + k
		// An eddy longer than `coherent` reaches every tree in turn; a shorter one reaches each tree as its own, and one smaller than a
		// crown each frond as its own, the crown as a whole feeling less of it, since its parts cancel
		const own = eddy.frond && part >= 0 ? place.seed ^ Math.imul(part + 1, 0x9e3779b1) : place.seed
		const key = eddy.local ? keyOf(own, index, mass) : airKey(index, mass)
		const share = eddy.frond ? (part < 0 ? WIND.eddies.crownShare : WIND.eddies.flap) * eddy.share : eddy.share
		total += intensity * share * wave(index, eddy, here, key, m, rate, sign)
	}
	// A mode also swings at its own frequency, whatever the wind
	if (m) total += intensity * swing(place, t, m, part, mass, rate)
	return scale * total + sign * gusts
}

/** The push of a steady wind of `speed` m/s with no gust or eddy: 1 at the default weather. */
function restPush(speed: number): number {
	return (Math.abs(speed) / WIND.reference) ** WIND.push.power
}

/** A frond's lean saturates as it streamlines, either way: linear near 0, 1 at a push of 1. */
function sat(push: number): number {
	const c = WIND.frond.saturation
	return (push * (1 + c)) / (1 + c * Math.abs(push))
}

/** How much further than the art's bend a streamlined frond's outer half bends: none at or under the default's wind. */
function beyond(streamed: number): number {
	return streamed <= 1 ? 0 : ((streamed - 1) * (streamed - 1)) / (streamed - 1 + WIND.frond.beyond)
}

/**
 * How much frond `i` swings against the mean of the hanging ranges, by how it hangs, and less on the upwind side of a wind of `speed`
 * m/s, where the crown shelters it. The shelter fades out with the wind below WIND.push.calm, so a wind that turns round moves it to
 * the other side without a jump.
 */
function frondGain(palm: WindPalm, i: number, speed: number): number {
	const { upper, side, hanging, windward } = WIND.frond
	const angle = palm.angles[i] ?? 0
	const share = Math.abs(angle) / palm.spread
	const range = share < UPPER_SHARE ? upper : share < SIDE_SHARE ? side : hanging
	const mean = (upper[0] + upper[1] + side[0] + side[1] + hanging[0] + hanging[1]) / 6
	const upwind = speed >= 0 ? angle < 0 : angle > 0
	const shelter = upwind ? (1 - windward) * smoothstep(0, WIND.push.calm, Math.abs(speed)) : 0
	return (along(range, unit(palm.seed, i, AMPLITUDE_SALT)) / mean) * (1 - shelter)
}

/** A trunk's first mode for a palm `metres` tall, Hz: a cantilever of one diameter goes as the height's inverse square. */
export function trunkHz(metres: number): number {
	const { hz, atHeight, range } = WIND.trunk
	return Math.min(range[1], Math.max(range[0], hz * (atHeight / metres) ** 2))
}

/** A frond's first mode for a frond `metres` long, Hz, `WIND.frond.spread` either way by its palm's seed and its index. */
export function frondHz(metres: number, seed: number, index: number): number {
	const { hz, atLength, spread, range } = WIND.frond
	return Math.min(range[1], Math.max(range[0], hz * (atLength / metres) * (1 + spread * (2 * unit(seed, index, PERIOD_SALT) - 1))))
}

/**
 * Poses `palm` in the frame's wind at `clock`, scaled by `level`. Its crown leans downwind by its trunk's answer to the push and its
 * fronds by theirs, each frond streaming toward a lean it can't pass, its outer half a little later and further only past the
 * default's wind, and its leaflets fluttering on periods of their own as the push rises. At `level` 0 it stands in the still pose of
 * the frame's weather, and finds no gust: the still pose of the default weather is the art-directed frame. A palm whose
 * fronds are longer than `WIND.frond.fullLength` moves by that much less, so the tips of a big palm move no faster than a small one's.
 */
export function palmPose(palm: WindPalm, wind: SceneWind, clock: number, level: number, out: PalmPose): PalmPose {
	const { trunk, frond, flutter } = WIND
	const move = level * Math.min(1, frond.fullLength / palm.frond)
	const count = palm.angles.length
	while (out.inner.length < count) {
		out.inner.push(0)
		out.outer.push(0)
		out.flutter.push(0)
	}
	// The still pose is the frame's weather with no gust or eddy: a change of weather while no motion shows lands at once
	const stillSign = wind.speed < 0 ? -1 : 1
	const still = restPush(wind.speed)
	const crownStill = stillSign * trunk.lean * palm.height * still
	const leanStill = stillSign * frond.lean * sat(still)
	const outerStill = stillSign * frond.outerShare * frond.lean * beyond(sat(still))
	if (move <= 0) {
		out.crownX = crownStill
		out.tilt = 0
		for (let i = 0; i < count; i++) {
			out.inner[i] = leanStill
			out.outer[i] = i < palm.hinged ? outerStill : 0
			out.flutter[i] = 0
		}
		return out
	}
	const sign = wind.speed < 0 ? -1 : 1
	const mean = restPush(wind.speed)
	const blowing = Math.abs(wind.speed)
	setMode(trunkMode, palm.trunkHz, trunk.zeta, trunk.zetaPerWind, blowing)
	const found = arrive(palm, wind, clock, reachOf(palm.trunkHz, wind, clock))
	// Which air the frame has: every call keys its bands by it, the outer halves' later ones too
	const mass = massAt(wind.ease, clock)
	const crownMoving = sign * trunk.lean * palm.height * pushAt(palm, wind, clock, trunkMode, -1, found, mass)
	out.crownX = crownStill + move * (crownMoving - crownStill)
	// The crown turns with the trunk's tip as a cantilever's does under a spread load, by its sway about the mean lean
	out.tilt = (move * trunk.tipSlope * (crownMoving - sign * trunk.lean * palm.height * mean)) / palm.height / RADIANS
	// The leaflets flutter harder as the push rises, less and less so as they near the most they can
	const raw = pushAt(palm, wind, clock, null, -1, found, mass)
	const shear = ((flutter.most * raw * raw) / (raw * raw + flutter.half)) * move
	const leanMean = frond.lean * sat(mean)
	for (let i = 0; i < count; i++) {
		setMode(frondMode, palm.frondHz[i] ?? frond.hz, frond.zeta, frond.zetaPerWind, blowing)
		const gain = frondGain(palm, i, wind.speed)
		const moving = sign * (leanMean + gain * frond.lean * (sat(pushAt(palm, wind, clock, frondMode, i, found, mass)) - sat(mean)))
		out.inner[i] = leanStill + move * (moving - leanStill)
		if (i < palm.hinged) {
			const lagged = pushAt(palm, wind, clock - frond.lag / frondMode.wn, frondMode, i, found, mass)
			const outerMoving = sign * frond.outerShare * frond.lean * (beyond(sat(mean)) + gain * (sat(lagged) - sat(mean)))
			out.outer[i] = outerStill + move * (outerMoving - outerStill)
			// The leaflets flutter at their own pace
			out.flutter[i] = shear * Math.sin(TAU * (clock / along(flutter.period, unit(palm.seed, i, FLUTTER_SALT)) + unit(palm.seed, i, PHASE_SALT + 1)))
		} else {
			out.outer[i] = 0
			out.flutter[i] = 0
		}
	}
	return out
}

/** How far a palm top's crown stands downwind of its foot's line (CSS px): its trunk's lean by `trunkPush` and its leaves' by `leafPush`. */
function shoreCrown(top: ShorePalm, side: number, trunkPush: number, leafPush: number): number {
	return side * (WIND.trunk.lean * top.top * trunkPush + top.radius * WIND.frond.lean * RADIANS * sat(leafPush))
}

/**
 * How far (CSS px) the wind has moved a palm top on the far shore from where the bake drew it, at `clock`, scaled by `level`: its
 * trunk and its leaves answer the far shore's own gusts as a near palm's do. At `level` 0 it stands in the still pose of the frame's
 * weather, 0 for the default's, and finds no gust.
 */
export function shoreShift(top: ShorePalm, wind: SceneWind, clock: number, level: number): number {
	const bake = shoreCrown(top, 1, 1, 1)
	const stillPush = restPush(wind.speed)
	const still = shoreCrown(top, wind.speed < 0 ? -1 : 1, stillPush, stillPush) - bake
	if (level <= 0) return still
	const blowing = Math.abs(wind.speed)
	setMode(trunkMode, top.trunkHz, WIND.trunk.zeta, WIND.trunk.zetaPerWind, blowing)
	const found = arrive(top, wind, clock, reachOf(top.trunkHz, wind, clock))
	const mass = massAt(wind.ease, clock)
	const trunkPush = pushAt(top, wind, clock, trunkMode, -1, found, mass)
	setMode(frondMode, top.leafHz, WIND.frond.zeta, WIND.frond.zetaPerWind, blowing)
	const leafPush = pushAt(top, wind, clock, frondMode, -1, found, mass)
	return still + level * (shoreCrown(top, wind.speed < 0 ? -1 : 1, trunkPush, leafPush) - bake - still)
}
