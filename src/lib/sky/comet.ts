/**
 * What the comet looks like and how fast it drifts, apart from where it hangs and when it shows (bodies.ts). The light of
 * its coma and tails is a function of a point on the sky and the light of its knots a function of the drift clock. The box
 * around everything that shows comes from scanning that same light, so skyAssets paints the comet's bitmap from
 * cometLightAt, and the placement and the box test read the box. Its size and the pace of its own drift come from the
 * screen's size. This module imports only its own folder's files, and only types from camera.ts and meteors.ts.
 */

import type { Vec } from './camera'
import { COMET } from './config'
import type { Point } from './meteors'
import { skyWindow } from './radiants'
import { smoothstep } from './scene'

/** Radians per degree. */
const DEG = Math.PI / 180

/** A box in CSS px. */
interface Box {
	left: number
	top: number
	right: number
	bottom: number
}

/** The light of the comet's parts at one place: what each adds (0 to 1 of its tint), and the share of the coma's light that is mint. */
export interface CometLight {
	coma: number
	mint: number
	dust: number
	ion: number
}

/** The unit vector the ion tail's axis points along on screen (y down). */
const AXIS = { x: Math.cos(COMET.angle * DEG), y: Math.sin(COMET.angle * DEG) }

/** The ion tail's rays with the cosine and sine of their angle off the axis, and the unit vector each points along on screen: the axis turned clockwise by that angle. */
const ION_RAYS = COMET.ion.rays.map(({ off, share }) => {
	const cos = Math.cos(off * DEG)
	const sin = Math.sin(off * DEG)
	return { share, cos, sin, dirX: AXIS.x * cos - AXIS.y * sin, dirY: AXIS.y * cos + AXIS.x * sin }
})

/** How much of the ion tail's light is left `distance` degrees down a ray: it falls as 1 / (1 + distance / scale). */
function ionFalloff(distance: number): number {
	return (1 + distance / COMET.ion.scale) ** -1
}

/** How much of the ion tail's light its end leaves at `distance` degrees: all of it until `fadeFrom` of the length, easing to none at the length. */
function ionFade(distance: number): number {
	return 1 - smoothstep(COMET.ion.fadeFrom * COMET.ion.length, COMET.ion.length, distance)
}

/** The width of the ion tail's rays `distance` degrees down a ray (one standard deviation, degrees): `width[0]`, widening by `width[1]` a degree. */
function ionWidth(distance: number): number {
	return COMET.ion.width[0] + COMET.ion.width[1] * distance
}

/**
 * The comet's light at a point `xi` degrees along the axis its tails point along, away from the Sun, and `eta` degrees
 * across it toward the side the dust tail bends to, written to `out`. It is the one place the look's math lives, read by
 * both the scan for the comet's box and the painter of its bitmap.
 */
export function cometLight(xi: number, eta: number, out: CometLight): void {
	const { coma, dust, ion } = COMET
	const rho = Math.hypot(xi, eta)
	// The coma: light falling as 1/rho from a softened core, cut off at its radius, over a broad halo
	out.coma =
		rho < 2 * coma.radius
			? (coma.peak / (1 + rho / coma.core)) * Math.exp(-((rho / coma.radius) ** 2)) + coma.halo * Math.exp(-((rho / coma.haloRadius) ** 2))
			: 0
	out.mint = smoothstep(coma.mintFrom, coma.mintTo, rho)
	// The dust tail: every grain size lags the axis as the 1.5 power of the distance along it, so the ridge does, in a fan from a parabolic cap
	out.dust = 0
	if (xi > -dust.behind * dust.cap && xi < dust.length) {
		const bend = Math.max(0, xi / dust.length) ** 1.5
		const capWidth = Math.sqrt(4 * dust.cap * Math.max(xi + dust.cap, 1e-6))
		// Across the ridge: a sharp edge on the side toward the ion tail (negative), a diffuse one on the other
		const delta = eta - dust.lag * dust.length * bend
		const width = delta < 0 ? capWidth * dust.convex : (capWidth + dust.spread * dust.length * bend) * dust.concave
		const along =
			(xi > 0 ? (1 + xi / dust.scale) ** -dust.power : 1) *
			(1 - smoothstep(dust.fadeFrom * dust.length, dust.length, xi)) *
			smoothstep(-dust.rise * dust.cap, 0, xi) *
			(dust.headKeep + (1 - dust.headKeep) * smoothstep(0, dust.headTo, xi))
		out.dust = dust.peak * along * Math.exp(-((delta / width) ** 2))
	}
	// The ion tail: narrow rays from the head, widening downstream
	out.ion = 0
	for (const ray of ION_RAYS) {
		const distance = xi * ray.cos - eta * ray.sin
		if (distance <= 0 || distance >= ion.length) continue
		const across = eta * ray.cos + xi * ray.sin
		out.ion +=
			ion.peak *
			ray.share *
			ionFalloff(distance) *
			ionFade(distance) *
			Math.exp(-((across / ionWidth(distance)) ** 2)) *
			smoothstep(0, ion.rise, distance)
	}
}

/** cometLight at the screen point `x` degrees right of the nucleus and `y` below it. */
export function cometLightAt(x: number, y: number, out: CometLight): void {
	cometLight(x * AXIS.x + y * AXIS.y, x * AXIS.y - y * AXIS.x, out)
}

/** One knot gliding outward along the ion tail: its place from the nucleus (CSS px), the unit vector of its ray, its light (0 to 1 of the knot sprite's) and its standard deviation along the ray and across it (CSS px). */
export interface CometKnot {
	x: number
	y: number
	dirX: number
	dirY: number
	light: number
	long: number
	wide: number
}

/** The golden ratio's fractional part: knots that far apart in phase never bunch up, however many there are. */
const KNOT_PHASE = 0.618034

/** The multiplier of the sine hash that gives each knot a brightness of its own, sin(n × KNOT_HASH)²: it makes neighbors differ, and is not a look number. */
const KNOT_HASH = 12.9898

/**
 * Writes where each of the ion tail's knots is at drift-clock time `clock` (s), for a window of `unit` CSS px a degree. A
 * knot is born near the head every COMET.knots.period s, glides outward faster and faster along one of the first rays,
 * fades in over COMET.knots.fadeIn of its period and out from COMET.knots.fadeOutFrom of it, well before the tail's end,
 * and has a brightness of its own (COMET.knots.floor to floor plus COMET.knots.spread of the peak). It is a pure
 * function of the clock, so a pause freezes it and a returning tab never jumps it, and it neither breathes nor twinkles:
 * only the stars do.
 */
export function cometKnots(clock: number, unit: number, knots: CometKnot[]): void {
	const config = COMET.knots
	for (const [n, knot] of knots.entries()) {
		const ray = ION_RAYS[n % config.rays]
		if (!ray) continue
		const tau = (clock / config.period + n * KNOT_PHASE) % 1
		const age = tau * config.period
		const distance = config.from + config.v0 * age + 0.5 * config.accel * age * age
		knot.x = ray.dirX * distance * unit
		knot.y = ray.dirY * distance * unit
		knot.dirX = ray.dirX
		knot.dirY = ray.dirY
		knot.light =
			config.peak *
			smoothstep(0, config.fadeIn, tau) *
			(1 - smoothstep(config.fadeOutFrom, 1, tau)) *
			(config.floor + config.spread * Math.sin(n * KNOT_HASH) ** 2) *
			ionFalloff(distance) *
			ionFade(distance)
		knot.long = config.long * unit * (1 + distance / config.stretch)
		knot.wide = config.wide * ionWidth(distance) * unit
	}
}

/** The least light that shows on the sky: one level of 255. */
const SEEN = 1 / 255

/** The step of the scan for the comet's extent, and the margin the box keeps around what shows (degrees). */
const SCAN_STEP = 0.25

/** What shows of the comet in degrees of the sky window from its nucleus, on screen axes (y down): a box around all of it and the place each tail shows farthest. */
interface CometExtent {
	box: Box
	dustTip: Point
	ionTip: Point
}

/** The comet's extent, found on first use: a visit with no comet never scans. */
let extent: CometExtent | null = null

/**
 * Where the comet's light shows, by scanning cometLight over a square that holds its longest reach: the box around every
 * place whose light adds to at least one level, padded by a step, and the farthest place each of the dust and the ion
 * tail shows at. It follows the config, so a changed tail or angle never leaves a stale box.
 */
function cometExtent(): CometExtent {
	if (extent) return extent
	const { dust, ion } = COMET
	const reach = Math.ceil(Math.max(ion.length, Math.hypot(dust.length, dust.lag * dust.length)))
	const light: CometLight = { coma: 0, mint: 0, dust: 0, ion: 0 }
	const box: Box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
	const dustTip = { x: 0, y: 0 }
	const ionTip = { x: 0, y: 0 }
	let dustFar = 0
	let ionFar = 0
	for (let y = -reach; y <= reach; y += SCAN_STEP) {
		for (let x = -reach; x <= reach; x += SCAN_STEP) {
			cometLightAt(x, y, light)
			const far = Math.hypot(x, y)
			if (light.dust >= SEEN && far > dustFar) {
				dustFar = far
				dustTip.x = x
				dustTip.y = y
			}
			if (light.ion >= SEEN && far > ionFar) {
				ionFar = far
				ionTip.x = x
				ionTip.y = y
			}
			if (light.coma + light.dust + light.ion < SEEN) continue
			box.left = Math.min(box.left, x)
			box.top = Math.min(box.top, y)
			box.right = Math.max(box.right, x)
			box.bottom = Math.max(box.bottom, y)
		}
	}
	extent = { box: { left: box.left - SCAN_STEP, top: box.top - SCAN_STEP, right: box.right + SCAN_STEP, bottom: box.bottom + SCAN_STEP }, dustTip, ionTip }
	return extent
}

/** The comet's size and extent relative to its nucleus (CSS px, y down), for one size of sky window. */
export interface CometShape {
	/** CSS px a degree of the comet's art spans: the sky window's, times the comet's size. The art and the box are drawn at this scale. */
	unit: number
	/** The box around everything that shows, which the placement and the clear-of-copy test use. */
	box: Box
	/** Where each tail shows farthest from the nucleus: with the nucleus, the places that copy coming near dims all of the comet from. */
	dustTip: Point
	ionTip: Point
}

/** CSS px a degree of the sky window spans on a screen of this size. */
function windowUnit(width: number, height: number): number {
	return (skyWindow(width, height).focal * Math.PI) / 180
}

/**
 * How far the comet's own drift carries it in a second of drift clock on a screen of this size (CSS px, y down):
 * COMET.drift.speed degrees of the sky window along COMET.drift.heading. It is the window's pace, which does not shrink
 * with the comet.
 */
export function cometDrift(width: number, height: number): Vec {
	const pace = COMET.drift.speed * windowUnit(width, height)
	const heading = COMET.drift.heading * DEG
	return { x: Math.cos(heading) * pace, y: Math.sin(heading) * pace }
}

/**
 * The comet laid out for a screen of this size: its parts scale with the sky window (SKY_WINDOW), so it looks the same
 * size on the sky at any screen size, times `size`, the share of its full size a window with too little room for all of it
 * gives it. The box is rounded out to whole CSS px, so the pixels of the comet's art line up with the screen's and fall the
 * same way about the nucleus in every window, which is what its brightest pixel depends on.
 */
export function cometShape(width: number, height: number, size = 1): CometShape {
	const unit = windowUnit(width, height) * size
	const { box, dustTip, ionTip } = cometExtent()
	return {
		unit,
		box: { left: Math.floor(box.left * unit), top: Math.floor(box.top * unit), right: Math.ceil(box.right * unit), bottom: Math.ceil(box.bottom * unit) },
		dustTip: { x: dustTip.x * unit, y: dustTip.y * unit },
		ionTip: { x: ionTip.x * unit, y: ionTip.y * unit },
	}
}
