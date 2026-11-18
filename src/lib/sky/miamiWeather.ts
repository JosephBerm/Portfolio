import { WEATHER, WIND } from './miamiConfig'

/**
 * The landing scene's weather: one blows through the whole scene at a time, and everything in it that moves with the wind reads
 * it. A weather is set by its strength and its direction alone; how gusty it is and how rough the sea is follow from those. It
 * lives in the worker's start-up code and reaches the scene's art as numbers in its frame. A change of weather eases on the
 * scene's own clock, and the course of the weather since the oldest moment the wind still reads is kept, so the air's clock is a
 * pure function of the clock: any frame can be drawn again from it, and a change of weather never alters a frame before it.
 */

/** A weather as it is set. */
export interface Weather {
	/** The mean wind at the palms' crowns, m/s (at most WEATHER.strongest). */
	strength: number
	/** Which way it blows across the picture: 1 toward the right, -1 toward the left. */
	direction: number
	/** How gusty it is against what its strength makes usual (WEATHER.turbulence): 1 where it isn't set. */
	gustiness?: number
}

/**
 * What a change of weather eases: the mean wind across the picture (m/s, positive toward the right), the gustiness, and the sea's
 * roughness (seaOf), which eases from the old weather's to the new one's: through the lull of a wind that turns round, the waves
 * don't die down in the seconds the wind takes to turn.
 */
export interface WindState {
	speed: number
	gustiness: number
	sea: number
}

/**
 * A change of weather: from `from` to `to` over `span` seconds of the scene's clock from `since`, when the air's clock stood at
 * `airClock`. `mass` numbers the air the scene had then: even while it moves, or last moved, toward the right and odd toward the
 * left, one more each time the wind has turned round, since air that comes back after minutes is no longer the air that left.
 * `turn` is when this change's wind passes through 0 toward the other side, from which the air is the next one (Infinity where it
 * doesn't turn round). `before` is the change before it, while the wind may still read a moment it governed (WEATHER.memory),
 * else null: before `since` the weather then held at `from`.
 */
export interface WeatherEase {
	from: WindState
	to: WindState
	since: number
	span: number
	airClock: number
	mass: number
	turn: number
	before: WeatherEase | null
}

/** The wind a frame is drawn in. */
export interface SceneWind {
	/** The mean wind across the picture at this moment, m/s: positive blows toward the right. */
	speed: number
	/** The eddies' share of the mean wind at this moment (its turbulence intensity): what its strength makes usual, times the gustiness. */
	turbulence: number
	/** How rough the sea is against the default weather's: the spread of its slopes. */
	sea: number
	/**
	 * Seconds of the default weather's wind that the air has moved toward the right: the scene's clock itself while the weather is
	 * the default, faster in a stronger wind, backward in a wind toward the left. The clouds and the ripples drift on it, and the
	 * gusts, the wander and the eddies are frozen in the air it moves.
	 */
	airClock: number
	/** The course of the weather up to this frame: when each gust reached each tree, and which air the scene has, come from it. */
	ease: WeatherEase
}

/** The wind across the picture and the gustiness a weather sets. */
export function windOf(weather: Weather): WindState {
	const strength = Math.min(WEATHER.strongest, Math.max(0, weather.strength))
	const speed = strength * Math.sign(weather.direction)
	return { speed, gustiness: Math.max(0, weather.gustiness ?? 1), sea: seaOf(speed) }
}

/**
 * The eddies' share of a mean wind of `speed` m/s, its turbulence intensity, as its strength makes it: a light wind meanders by a
 * few tenths of a m/s whatever its mean, and a strong one's eddies grow with it.
 */
export function turbulenceOf(speed: number): number {
	const { strong, light, most } = WEATHER.turbulence
	const wind = Math.abs(speed)
	return wind > 0 ? Math.min(most, strong + light / wind) : most
}

/** How rough the sea is under a wind of `speed` m/s, against the default weather's: the spread of its slopes (Cox and Munk). */
export function seaOf(speed: number): number {
	const { calm, perWind } = WEATHER.sea
	return Math.sqrt((calm + perWind * Math.abs(speed)) / (calm + perWind * WIND.reference))
}

/** A weather that holds from the clock's 0. */
export function steadyWeather(weather: Weather): WeatherEase {
	const wind = windOf(weather)
	return { from: wind, to: wind, since: 0, span: 0, airClock: 0, mass: wind.speed < 0 ? 1 : 0, turn: Infinity, before: null }
}

/** The integral of smoothstep from 0 to x, x in [0, 1]: how much of a span's change an eased speed has covered. */
const covered = (x: number): number => x * x * x - (x * x * x * x) / 2

/** How far a change has eased at `clock`, 0 to 1: 0 before it begins, 1 once it has landed, and from its start where its span is 0. */
export function easedShare(link: WeatherEase, clock: number): number {
	if (clock < link.since) return 0
	if (link.span <= 0 || clock >= link.since + link.span) return 1
	const x = (clock - link.since) / link.span
	return x * x * (3 - 2 * x)
}

/** The change that governs `clock`: the newest one begun by then, or the oldest kept. */
function governing(ease: WeatherEase, clock: number): WeatherEase {
	let link = ease
	while (link.before && clock < link.since) link = link.before
	return link
}

/** The air's clock at `clock` as one change has it: its ease from `since` on, and before `since` its `from` held. */
export function airIn(link: WeatherEase, clock: number): number {
	const dt = clock - link.since
	const v0 = link.from.speed / WIND.reference
	if (dt <= 0) return link.airClock + v0 * dt
	const v1 = link.to.speed / WIND.reference
	if (link.span <= 0) return link.airClock + v1 * dt
	if (dt >= link.span) return link.airClock + v0 * dt + (v1 - v0) * (dt - link.span / 2)
	return link.airClock + v0 * dt + (v1 - v0) * link.span * covered(dt / link.span)
}

/** The air's clock at `clock`, any moment the course still keeps. */
export function airClockAt(ease: WeatherEase, clock: number): number {
	return airIn(governing(ease, clock), clock)
}

/** Which air one change has at `clock` (WeatherEase.mass): from its turn on, the next. */
export function massIn(link: WeatherEase, clock: number): number {
	return clock >= link.turn ? link.mass + 1 : link.mass
}

/** Which air the scene has at `clock` (WeatherEase.mass), any moment the course still keeps: from a change's turn on, the next. */
export function massAt(ease: WeatherEase, clock: number): number {
	return massIn(governing(ease, clock), clock)
}

/**
 * The weather at `clock` (as the change that governs it has it, smoothstepped from its start to its end), the air's clock there and
 * the course, into `out`.
 */
export function windAt(ease: WeatherEase, clock: number, out: SceneWind): SceneWind {
	const link = governing(ease, clock)
	const s = easedShare(link, clock)
	out.speed = link.from.speed + (link.to.speed - link.from.speed) * s
	out.turbulence = turbulenceOf(out.speed) * (link.from.gustiness + (link.to.gustiness - link.from.gustiness) * s)
	out.sea = link.from.sea + (link.to.sea - link.from.sea) * s
	out.airClock = airIn(link, clock)
	out.ease = ease
	return out
}

/**
 * A change to `to` from wherever the weather stands at `clock`, over `span` seconds of the scene's clock; 0 lands at once. The
 * course keeps every change that governs a moment within WEATHER.memory seconds before `clock`, and a change asked at the same clock
 * as the newest takes its place, since that one then governs no moment, so changes asked while the clock stands still never pile up.
 * `scratch` is filled on the way.
 */
export function changeWeather(ease: WeatherEase, to: WindState, clock: number, span: number, scratch: SceneWind): WeatherEase {
	const now = windAt(ease, clock, scratch)
	const link = governing(ease, clock)
	const gustiness = link.from.gustiness + (link.to.gustiness - link.from.gustiness) * easedShare(link, clock)
	const mass = massIn(link, clock)
	// The air turns round where the wind passes through 0 toward the side it last moved away from: within the ease, by smoothstep's
	// inverse, or at once where the change lands at once or starts from no wind. Within a few ulps of a turn the eased wind's
	// sign can disagree with the air's number, so the share is held to [0, 1], which turns the air at once there
	let turn = Infinity
	if (to.speed * (mass % 2 === 0 ? 1 : -1) < 0) {
		const share = Math.min(1, Math.max(0, now.speed / (now.speed - to.speed)))
		turn = span > 0 && now.speed !== 0 ? clock + span * (0.5 - Math.sin(Math.asin(1 - 2 * share) / 3)) : clock
	}
	// The newest change, where it began at this same clock, governs no moment once this one does; the oldest stays, since the
	// weather it held before it is the course's past
	const kept = ease.since === clock && ease.before ? ease.before : ease
	let oldest = kept
	while (oldest.before && oldest.since > clock - WEATHER.memory) oldest = oldest.before
	// What governed only moments older than that is never read again
	oldest.before = null
	return { from: { speed: now.speed, gustiness, sea: now.sea }, to, since: clock, span, airClock: now.airClock, mass, turn, before: kept }
}
