import { WEATHER, WIND } from './miamiConfig'

/**
 * The landing scene's weather: one blows through the whole scene at a time, and everything in it that moves with the wind reads
 * it. A weather is set by its strength and its direction alone; how rough the sea is follows from those. It lives in the worker's
 * start-up code and reaches the scene's art as numbers in its frame.
 */

/** A weather as it is set. */
export interface Weather {
	/** The mean wind at the palms' crowns, m/s (at most WEATHER.strongest). */
	strength: number
	/** Which way it blows across the picture: 1 toward the right, -1 toward the left. */
	direction: number
}

/**
 * What a change of weather eases: the mean wind across the picture (m/s, positive toward the right) and the sea's roughness
 * (seaOf), which eases from the old weather's to the new one's: through the lull of a wind that turns round, the waves don't die
 * down in the seconds the wind takes to turn.
 */
export interface WindState {
	speed: number
	sea: number
}

/**
 * A change of weather: from `from` to `to` over `span` seconds of the scene's clock from `since`, when the air's clock stood at
 * `airClock`. `before` is the change before it, else null: before `since` the weather then held at `from`.
 */
export interface WeatherEase {
	from: WindState
	to: WindState
	since: number
	span: number
	airClock: number
	before: WeatherEase | null
}

/** The wind a frame is drawn in. */
export interface SceneWind {
	/** The mean wind across the picture at this moment, m/s: positive blows toward the right. */
	speed: number
	/** How rough the sea is against the default weather's: the spread of its slopes. */
	sea: number
	/**
	 * Seconds of the default weather's wind that the air has moved toward the right: the scene's clock itself while the weather is
	 * the default, faster in a stronger wind, backward in a wind toward the left. The clouds and the ripples drift on it.
	 */
	airClock: number
	/** The course of the weather up to this frame: when each gust reached each tree comes from it. */
	ease: WeatherEase
}

/** The wind across the picture and the sea's roughness a weather sets. */
export function windOf(weather: Weather): WindState {
	const strength = Math.min(WEATHER.strongest, Math.max(0, weather.strength))
	const speed = strength * Math.sign(weather.direction)
	return { speed, sea: seaOf(speed) }
}

/** How rough the sea is under a wind of `speed` m/s, against the default weather's: the spread of its slopes (Cox and Munk). */
export function seaOf(speed: number): number {
	const { calm, perWind } = WEATHER.sea
	return Math.sqrt((calm + perWind * Math.abs(speed)) / (calm + perWind * WIND.reference))
}

/** A weather that holds from the clock's 0. */
export function steadyWeather(weather: Weather): WeatherEase {
	const wind = windOf(weather)
	return { from: wind, to: wind, since: 0, span: 0, airClock: 0, before: null }
}

/** The integral of smoothstep from 0 to x, x in [0, 1]: how much of a span's change an eased speed has covered. */
const covered = (x: number): number => x * x * x - (x * x * x * x) / 2

/** How far a change has eased at `clock`, 0 to 1. */
function easedShare(link: WeatherEase, clock: number): number {
	const x = link.span > 0 ? Math.min(1, Math.max(0, clock - link.since) / link.span) : 1
	return x * x * (3 - 2 * x)
}

/** The change that governs `clock`: the newest one begun by then, or the oldest kept. */
function governing(ease: WeatherEase, clock: number): WeatherEase {
	let link = ease
	while (link.before && clock < link.since) link = link.before
	return link
}

/** The air's clock at `clock` as one change has it: its ease from `since` on, and before `since` its `from` held. */
function airIn(link: WeatherEase, clock: number): number {
	const dt = clock - link.since
	const v0 = link.from.speed / WIND.reference
	if (dt <= 0) return link.airClock + v0 * dt
	const v1 = link.to.speed / WIND.reference
	if (link.span <= 0) return link.airClock + v1 * dt
	if (dt >= link.span) return link.airClock + v0 * dt + (v1 - v0) * (dt - link.span / 2)
	return link.airClock + v0 * dt + (v1 - v0) * link.span * covered(dt / link.span)
}

/**
 * The weather at `clock` (as the change that governs it has it, smoothstepped from its start to its end), the air's clock there and
 * the course, into `out`.
 */
export function windAt(ease: WeatherEase, clock: number, out: SceneWind): SceneWind {
	const link = governing(ease, clock)
	const s = easedShare(link, clock)
	out.speed = link.from.speed + (link.to.speed - link.from.speed) * s
	out.sea = link.from.sea + (link.to.sea - link.from.sea) * s
	out.airClock = airIn(link, clock)
	out.ease = ease
	return out
}
