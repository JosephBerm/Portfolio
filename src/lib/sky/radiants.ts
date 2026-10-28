/**
 * Where a visit's shooting stars come from. The screen is a pinhole window on the sky (SKY_WINDOW), and each shooting
 * star is a straight path that seems to come from a radiant, the point of the sky all its parallel paths meet at. A visit
 * has one shower radiant and a few broad sporadic sources; this module places them and turns a start point on the
 * screen into a direction, a speed and a brightness for a shooting star launched there.
 */

import { METEOR, METEOR_BRIGHTNESS, NARROW_MAX_WIDTH, RADIANTS, SKY_WINDOW, SPEED_CLASSES } from './config'
import { startArea, type Course, type MeteorField, type Point, type Steer } from './meteors'
import { between, gaussian, type Random } from './random'
import { quietAt } from './scene'

/** Radians per degree. */
const DEG = Math.PI / 180

/** The name of a speed class. */
type SpeedName = keyof typeof SPEED_CLASSES

/** The speed classes, slowest first: the shower takes any one of them and the sporadic sources one each in turn. */
const SPEED_NAMES = Object.keys(SPEED_CLASSES) as SpeedName[]

/** Points tried for a radiant on screen before the shower goes off screen after all. */
const ON_SCREEN_TRIES = 20

/** Radiants drawn for an off-screen shower before the last one is kept. */
const OFF_SCREEN_TRIES = 50

/** A shower radiant is tested on a grid of this many probe points on each side of the start area... */
const PROBES_PER_SIDE = 4

/** ...and needs at least this many of them to give a path that doesn't climb steeply (RADIANTS.climbDegrees), or most of its launches would fail. */
const PROBES_NEEDED = 8

/** A unit direction in the window's frame: x to the right, y down the screen, z through the screen into the sky. */
export interface SkyDirection {
	x: number
	y: number
	z: number
}

/** The screen as a pinhole window (gnomonic: straight paths stay straight, and parallel paths meet at their radiant). */
export interface SkyWindow {
	cx: number
	cy: number
	/** CSS px per unit of the image plane: the longer side spans SKY_WINDOW.fov. */
	focal: number
	/** Elevation of the screen center (radians). */
	pitch: number
}

/** One source of a visit's shooting stars: a radiant, how widely its meteors scatter, and their speed class. */
export interface Source {
	kind: 'shower' | 'sporadic'
	radiant: SkyDirection
	/** Scatter (radians, one standard deviation): RADIANTS' degrees, converted. */
	scatter: number
	speed: SpeedName
}

/** A visit's sky: the window, the shower and the sporadic sources; picked afresh after a resize or a failed launch allowed near copy, never by a layout. */
export interface VisitSky {
	window: SkyWindow
	shower: Source
	sporadic: readonly Source[]
	/** Where the shower radiant sits on screen (RADIANTS.onScreen of visits), else null. */
	showerOnScreen: Point | null
}

/** How a shooting star from a radiant crosses one screen point. */
interface RadiantMotion {
	/** Unit screen direction: away from the radiant's vanishing point (toward the antiradiant's when it is behind the viewer). */
	dirX: number
	dirY: number
	/**
	 * Screen speed in focal lengths per unit of entry speed over range: px/s = focal × V × rate / range. It is 1 at the
	 * center 90° from the radiant, falls to 0 at the radiant (a head-on meteor stands still) and grows a little toward
	 * the edges.
	 */
	rate: number
}

/** The sky window for a viewport: its center, the focal length at which the longer side spans SKY_WINDOW.fov, and its pitch. */
export function skyWindow(width: number, height: number): SkyWindow {
	const focal = Math.max(width, height) / 2 / Math.tan((SKY_WINDOW.fov * DEG) / 2)
	return { cx: width / 2, cy: height / 2, focal, pitch: SKY_WINDOW.elevation * DEG }
}

/** The direction toward elevation `h` and azimuth `a` (radians; azimuth 0 is straight ahead, positive to the right). */
function toward(view: SkyWindow, h: number, a: number): SkyDirection {
	const right = Math.cos(h) * Math.sin(a)
	const ahead = Math.cos(h) * Math.cos(a)
	const up = Math.sin(h)
	const cos = Math.cos(view.pitch)
	const sin = Math.sin(view.pitch)
	return { x: right, y: ahead * sin - up * cos, z: ahead * cos + up * sin }
}

/** A radiant weighted like real rates: hourly rates scale with sin h (IMO), so elevations have density sin h cos h. */
function sampleRadiant(random: Random, view: SkyWindow): SkyDirection {
	return toward(view, Math.asin(Math.sqrt(random())), between(random, -Math.PI, Math.PI))
}

/** The unit direction through screen point (x, y). */
function through(view: SkyWindow, x: number, y: number): SkyDirection {
	const u = (x - view.cx) / view.focal
	const v = (y - view.cy) / view.focal
	const norm = Math.hypot(u, v, 1)
	return { x: u / norm, y: v / norm, z: 1 / norm }
}

/** `radiant` moved by `scatter` radians (one standard deviation) along two directions at right angles on the sky, and made a unit vector again. */
function scattered(random: Random, radiant: SkyDirection, scatter: number): SkyDirection {
	// Two unit vectors at right angles to the radiant and to each other, built from an axis the radiant doesn't lie along
	const axis = Math.abs(radiant.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 }
	const cx = radiant.y * axis.z - radiant.z * axis.y
	const cy = radiant.z * axis.x - radiant.x * axis.z
	const cz = radiant.x * axis.y - radiant.y * axis.x
	const norm = Math.hypot(cx, cy, cz)
	const east = { x: cx / norm, y: cy / norm, z: cz / norm }
	const north = {
		x: radiant.y * east.z - radiant.z * east.y,
		y: radiant.z * east.x - radiant.x * east.z,
		z: radiant.x * east.y - radiant.y * east.x,
	}
	const eastward = gaussian(random) * scatter
	const northward = gaussian(random) * scatter
	const x = radiant.x + eastward * east.x + northward * north.x
	const y = radiant.y + eastward * east.y + northward * north.y
	const z = radiant.z + eastward * east.z + northward * north.z
	const length = Math.hypot(x, y, z)
	return { x: x / length, y: y / length, z: z / length }
}

/** The screen motion at (x, y) of a shooting star from `radiant`, or null at the radiant itself (a stationary meteor). */
export function radiantMotion(view: SkyWindow, radiant: SkyDirection, x: number, y: number): RadiantMotion | null {
	const u = (x - view.cx) / view.focal
	const v = (y - view.cy) / view.focal
	// A point moving along -radiant crosses the image along (u·rz - rx, v·rz - ry), whatever its depth
	const dx = u * radiant.z - radiant.x
	const dy = v * radiant.z - radiant.y
	const image = Math.hypot(dx, dy)
	if (image < 1e-6) return null
	return { dirX: dx / image, dirY: dy / image, rate: image * Math.hypot(u, v, 1) }
}

/** Elevation (radians) behind screen point (x, y). */
export function elevationAt(view: SkyWindow, x: number, y: number): number {
	const u = (x - view.cx) / view.focal
	const v = (y - view.cy) / view.focal
	return Math.asin((Math.sin(view.pitch) - v * Math.cos(view.pitch)) / Math.hypot(u, v, 1))
}

/** Range (km) to the meteor layer at elevation h: 100 km overhead, about 172 km at 35° and 477 km at 10°. */
export function meteorRange(h: number): number {
	const ground = SKY_WINDOW.earthRadiusKm
	const layer = ground + SKY_WINDOW.meteorHeightKm
	return Math.sqrt(layer * layer - (ground * Math.cos(h)) ** 2) - ground * Math.sin(h)
}

/** Whether a radiant in front of the viewer has its vanishing point inside the viewport. */
function projectsOnScreen(view: SkyWindow, radiant: SkyDirection, field: MeteorField): boolean {
	if (radiant.z <= 0) return false
	const x = view.cx + (view.focal * radiant.x) / radiant.z
	const y = view.cy + (view.focal * radiant.y) / radiant.z
	return x >= 0 && x <= field.width && y >= 0 && y <= field.height
}

/**
 * Whether a shower from `radiant` can launch over the start area: at least PROBES_NEEDED of a grid of probe points give a
 * path that doesn't climb more than RADIANTS.climbDegrees. A radiant low in front of the window sends most of its paths
 * climbing, and a shower may not climb.
 */
function usable(view: SkyWindow, radiant: SkyDirection, field: MeteorField): boolean {
	const { x0, x1, y0, y1 } = startArea(field)
	const steepest = -Math.sin(RADIANTS.climbDegrees * DEG)
	let fits = 0
	for (let i = 0; i < PROBES_PER_SIDE; i++) {
		for (let j = 0; j < PROBES_PER_SIDE; j++) {
			const x = x0 + ((x1 - x0) * (i + 0.5)) / PROBES_PER_SIDE
			const y = Math.max(METEOR.top, y0 + ((y1 - y0) * (j + 0.5)) / PROBES_PER_SIDE)
			const motion = radiantMotion(view, radiant, x, y)
			if (motion !== null && motion.dirY >= steepest) fits++
		}
	}
	return fits >= PROBES_NEEDED
}

/** The speed class at `index`, counting round. */
function speedAt(index: number): SpeedName {
	return SPEED_NAMES[index % SPEED_NAMES.length] ?? 'medium'
}

/** A visit's sky around a shower radiant: the shower with a speed class picked uniformly, and a sporadic source for each speed class in turn. */
function buildVisitSky(random: Random, view: SkyWindow, radiant: SkyDirection, showerOnScreen: Point | null): VisitSky {
	const shower: Source = { kind: 'shower', radiant, scatter: RADIANTS.showerScatter * DEG, speed: speedAt(Math.floor(random() * SPEED_NAMES.length)) }
	const sporadic = Array.from({ length: RADIANTS.sporadicSources }, (_, i): Source => ({
		kind: 'sporadic',
		radiant: sampleRadiant(random, view),
		scatter: RADIANTS.sporadicScatter * DEG,
		speed: speedAt(i),
	}))
	return { window: view, shower, sporadic, showerOnScreen }
}

/** A visit's sky: radiants with elevation density sin h cos h; the shower on screen in clear sky on RADIANTS.onScreen of visits. */
export function pickVisitSky(random: Random, field: MeteorField): VisitSky {
	const view = skyWindow(field.width, field.height)
	// A share of the wide-screen visits get the shower radiant on screen, in clear sky in the top of it
	if (field.width > NARROW_MAX_WIDTH && random() < RADIANTS.onScreen) {
		for (let tries = 0; tries < ON_SCREEN_TRIES; tries++) {
			const point = {
				x: between(random, METEOR.edgeMargin, field.width - METEOR.edgeMargin),
				y: between(random, METEOR.top, RADIANTS.onScreenTop * field.height),
			}
			if (quietAt(field.quiet, point.x, point.y) > 0) continue
			const radiant = through(view, point.x, point.y)
			if (usable(view, radiant, field)) return buildVisitSky(random, view, radiant, point)
		}
	}
	// Off screen otherwise, so a radiant on screen comes only from the draw above: one that projects inside the viewport is drawn again
	let radiant = sampleRadiant(random, view)
	for (let tries = 1; tries < OFF_SCREEN_TRIES && (projectsOnScreen(view, radiant, field) || !usable(view, radiant, field)); tries++) radiant = sampleRadiant(random, view)
	return buildVisitSky(random, view, radiant, null)
}

/** One launch's steer: a source (the shower with RADIANTS.showerShare, else a sporadic one) and its scattered radiant. */
export function visitSteer(random: Random, sky: VisitSky): Steer {
	const view = sky.window
	const source = random() < RADIANTS.showerShare ? sky.shower : (sky.sporadic[Math.floor(random() * sky.sporadic.length)] ?? sky.shower)
	const radiant = scattered(random, source.radiant, source.scatter)
	const speedClass = SPEED_CLASSES[source.speed]
	const [shortest, longest] = speedClass.duration
	const durations = { long: speedClass.duration, short: [shortest * METEOR.fallbackScale, longest * METEOR.fallbackScale] as const }
	const steepest = -Math.sin(RADIANTS.climbDegrees * DEG)
	const centerRange = meteorRange(view.pitch)
	// The range at the nearest point of the start area: a flight dims with the square of its range over this one, so none is brighter than its peak
	const nearestRange = meteorRange(elevationAt(view, view.cx, METEOR.top))
	// Only the shower's meteors are foreshortened to stubs around a radiant on screen
	const onScreen = source.kind === 'shower' && sky.showerOnScreen !== null ? through(view, sky.showerOnScreen.x, sky.showerOnScreen.y) : null
	const nearCosine = Math.cos(RADIANTS.nearRadiant * DEG)
	return (random, start, fallback): Course | null => {
		const motion = radiantMotion(view, radiant, start.x, start.y)
		if (motion === null) return null
		const climbing = motion.dirY < steepest
		// A shower never climbs: the planner draws another start
		if (climbing && source.kind === 'shower') return null
		const range = meteorRange(elevationAt(view, start.x, start.y))
		const jitter = between(random, METEOR.speedJitter[0], METEOR.speedJitter[1])
		const speed = (speedClass.angular * DEG * view.focal * motion.rate * jitter) / (range / centerRange)
		const [dimmest, brightest] = random() < METEOR_BRIGHTNESS.faintShare ? METEOR_BRIGHTNESS.faint : METEOR_BRIGHTNESS.normal
		const peak = between(random, dimmest, brightest) * Math.max(METEOR_BRIGHTNESS.rangeFloor, (nearestRange / range) ** 2)
		let near = false
		if (onScreen !== null) {
			const toStart = through(view, start.x, start.y)
			near = onScreen.x * toStart.x + onScreen.y * toStart.y + onScreen.z * toStart.z >= nearCosine
		}
		return {
			dirX: motion.dirX,
			dirY: motion.dirY,
			speed,
			duration: fallback ? durations.short : durations.long,
			pathShare: climbing ? RADIANTS.climbShare : 1,
			minPath: near ? RADIANTS.nearRadiantPath : null,
			peak,
			wakeColor: speedClass.wakeColor,
			train: speedClass.train,
		}
	}
}
