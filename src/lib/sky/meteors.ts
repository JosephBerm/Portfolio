import { METEOR, METEOR_LIGHT, METEOR_LOOK, METEOR_PASS, METEOR_VEIL, NARROW_MAX_WIDTH, QUIET, TRAIN, type WakeColor } from './config'
import type { SkyRect } from './protocol'
import { between, type Random } from './random'
import { budgetKeeps, inkAt, quietAt, quietFactor, smoothstep } from './scene'

/** A point in screen CSS px. */
export interface Point {
	x: number
	y: number
}

/** Where a shooting star may fly: the viewport and the padded quiet rects, all in screen CSS px. */
export interface MeteorField {
	width: number
	height: number
	quiet: readonly SkyRect[]
}

/** A straight path in screen CSS px, flown from its start with atmospheric drag (see travel). */
export interface MeteorPath {
	startX: number
	startY: number
	/** Unit direction of travel. */
	dirX: number
	dirY: number
	/** Path length (px). */
	length: number
	/** Speed loss over the flight (see METEOR.drag). */
	drag: number
}

/** One planned shooting star. Times are seconds on the worker clock. */
export interface Meteor extends MeteorPath {
	/** Nominal speed (px/s), path length / duration. */
	speed: number
	duration: number
	/** Peak brightness, 0-1. */
	peak: number
	/** Wake afterglow time constant (s). */
	wake: number
	/** The color the wake cools to (SPEED_CLASSES). */
	wakeColor: WakeColor
	fireball: boolean
	flare: boolean
	train: boolean
	/** Part of the path lies within the veil of quiet copy and is drawn dimmed; a path in clear sky has none. */
	nearCopy: boolean
	startedAt: number
}

/** How a shooting star launched at a start point flies; the planner keeps start sampling, the layout guards and the checks against quiet copy (METEOR_VEIL). */
export interface Course {
	/** Unit direction of travel on screen. */
	dirX: number
	dirY: number
	/** Nominal screen speed at the start (CSS px/s). */
	speed: number
	/** Flight time range (s). */
	duration: readonly [number, number]
	/** Longest path as a share of the planner's maximum (RADIANTS.climbShare for climbs, else 1). */
	pathShare: number
	/** Shortest path allowed from this start (px), or null for the planner's own minimum. */
	minPath: number | null
	/** Peak brightness (fireballs peak at 1 regardless): veiledFrom and drawMeteor fit it to each copy's INK_BUDGET. */
	peak: number
	/** The color the wake cools to (SPEED_CLASSES). */
	wakeColor: WakeColor
	/** A persistent train is possible here. */
	train: boolean
}

/** Direction, speed and timing for a start point the planner picked; null when no shooting star starts there. */
export type Steer = (random: Random, start: Point, fallback: boolean) => Course | null

/** What a plan may do. */
export interface PlanOptions {
	/** False: only paths in clear sky, clear of the veil of every quiet rect, as fireballs fly. Default true. */
	nearCopy?: boolean
	/** Long flights, the shorter fallback, or both in turn (the default). */
	flights?: 'long' | 'short' | 'both'
	/** Share of each rect's INK_BUDGET the renderer lets it keep on the copy (CONTRAST_*.meteorInk). 0 leaves it nothing there, so no flight is aimed at copy. Default 1. */
	ink?: number
	/** Where shooting stars go from each start point: a Course, or null where none starts there. */
	steer: Steer
	/**
	 * Padded zones no path comes within QUIET.feather of, as `nearCopy` false keeps it from all: the side rails, whose
	 * links change color on hover and focus, which their measured headroom misses until the next measurement. Default none.
	 */
	clearOf?: readonly SkyRect[]
}

/** What one pass of the planner adds to the caller's options: whether it is the shorter fallback (its durations and its shortest path scaled by METEOR.fallbackScale) and whether a fireball may fly. */
interface PassOptions extends PlanOptions {
	fallback: boolean
	fireballs: boolean
}

/** A shooting star at one moment. */
export interface MeteorFrame {
	/** Flight progress: 0 at launch, 1 when the head burns out (larger while the wake and train fade). */
	progress: number
	/** Head brightness now, 0-1. */
	intensity: number
	/** Alpha of the persistent train (0 when there is none). */
	train: number
	/** Distance flown (px). */
	flown: number
}

/**
 * White a unit of light adds on the head's center pixel: the core sprite and the wake's core, the soft pass and the
 * glow (`boost` brightens the glow of fireballs and flares). The veil keeps the share of it each copy's budget allows.
 */
export function headGain(boost = 1): number {
	return 2 + METEOR_LOOK.softAlpha + METEOR_LOOK.glowAlpha * boost
}

/** White a unit of light adds on the wake's centerline: its core and its soft pass. */
export const WAKE_GAIN = 1 + METEOR_LOOK.softAlpha

/**
 * The box planFlight draws start points from (CSS px): width × METEOR.spawnX by height × spawnY. The box itself is not
 * clamped: a start drawn above METEOR.top is raised to it, under the navbar.
 */
export function startArea(field: MeteorField): { x0: number; x1: number; y0: number; y1: number } {
	const { width, height } = field
	return { x0: width * METEOR.spawnX[0], x1: width * METEOR.spawnX[1], y0: height * METEOR.spawnY[0], y1: height * METEOR.spawnY[1] }
}

/** Does the segment a→b touch the rectangle grown by `margin` on every side? (Liang-Barsky clipping.) */
function segmentTouches(a: Point, b: Point, rect: SkyRect, margin: number): boolean {
	const dx = b.x - a.x
	const dy = b.y - a.y
	const edges = [
		[-dx, a.x - (rect.x - margin)],
		[dx, rect.x + rect.width + margin - a.x],
		[-dy, a.y - (rect.y - margin)],
		[dy, rect.y + rect.height + margin - a.y],
	] as const
	let enter = 0
	let exit = 1
	for (const [p, q] of edges) {
		if (p === 0) {
			if (q < 0) return false
			continue
		}
		const t = q / p
		if (p < 0) enter = Math.max(enter, t)
		else exit = Math.min(exit, t)
		if (enter > exit) return false
	}
	return true
}

/** What the veil does to a path: where the head first dims (progress, 1 if it never does) and how much of the flight it spends visibly on copy. */
interface Veiled {
	dimFrom: number
	behind: number
}

/** A path that never meets copy. */
const CLEAR_SKY: Veiled = { dimFrom: 1, behind: 0 }

/**
 * Checks a path against the rules of the veil (METEOR_VEIL) at evenly spaced moments of the flight, for a head of this
 * `peak` that keeps `ink` of each copy's budget. `zones` are the quiet rects the path can reach; every other rect gives
 * the veil nothing along it. Returns where it first dims and the share of the flight it spends visibly on copy
 * (METEOR_PASS), or null when the path breaks a rule.
 */
function veiledFrom(zones: readonly SkyRect[], path: MeteorPath, peak: number, ink: number): Veiled | null {
	let dimFrom = 1
	let dimmest = Infinity
	let behind = 0
	let glimpsed = 0
	let edgeFade = false
	for (let i = 0; i < METEOR_VEIL.samples; i++) {
		const progress = i / METEOR_VEIL.samples
		const { x, y } = meteorPoint(path, progress)
		const inVeil = quietAt(zones, x, y) > 0
		// The light matters only in the veil and after clearUntil
		const light = inVeil || progress > METEOR_VEIL.clearUntil ? meteorLight(progress, false) : 0
		let kept = 1
		if (inVeil) {
			if (progress <= METEOR_VEIL.clearUntil) return null
			dimFrom = Math.min(dimFrom, progress)
			const white = peak * light * headGain()
			kept = quietFactor(zones, x, y, budgetKeeps(white, METEOR_VEIL.quietKeep, ink))
			if (white >= METEOR_VEIL.edgeBright && kept <= METEOR_VEIL.edgeKept) edgeFade = true
			if (inkAt(zones, x, y) === 1) {
				const shown = white * kept
				if (shown >= METEOR_PASS.visible) behind += 1 / METEOR_VEIL.samples
				if (shown >= METEOR_PASS.glimmer) glimpsed += 1 / METEOR_VEIL.samples
			}
		}
		// Past clearUntil the light curve only falls: once the veil dims the head, it never brightens again
		if (progress > METEOR_VEIL.clearUntil) {
			const visible = light * kept
			if (visible > dimmest + METEOR_VEIL.rise) return null
			dimmest = Math.min(dimmest, visible)
		}
	}
	// The edge-fade rule (METEOR_VEIL)
	return edgeFade && glimpsed < METEOR_PASS.dwell ? null : { dimFrom, behind }
}

/** A planned flight and the share of it (progress units) its head spends visibly on copy (METEOR_PASS). */
interface Fit {
	meteor: Meteor
	behind: number
}

/**
 * Up to METEOR.attempts candidate paths steered by `options.steer`, shorter on the fallback pass, fireballs only if
 * `options.fireballs`; the first that fits. A share of the launches (METEOR_PASS) then trade that flight for one that
 * passes visibly behind copy, where one fits in as many more candidates. Fireballs, flares and trains need clear sky, so a
 * launch that came out as one keeps it: their rates don't depend on the aim.
 */
function planFlight(random: Random, field: MeteorField, now: number, options: PassOptions): Meteor | null {
	const { width, height } = field
	const narrow = width <= NARROW_MAX_WIDTH
	const longSide = Math.max(width, height)
	const { steer, fallback, fireballs, clearOf = [], nearCopy: copyAllowed = true, ink = 1 } = options
	const minPath = (narrow ? METEOR.narrowMinPath : METEOR.path[0]) * (fallback ? METEOR.fallbackScale : 1)
	const maxPath = narrow ? width * METEOR.narrowMaxPathShare : Math.min(METEOR.path[1], METEOR.pathShare * longSide)
	const { x0, x1, y0, y1 } = startArea(field)
	// The first of up to METEOR.attempts candidates that fits and whose head spends at least `minBehind` of the flight visibly on copy
	const fit = (minBehind: number): Fit | null => {
		for (let attempt = 0; attempt < METEOR.attempts; attempt++) {
			const fireball = fireballs && random() < METEOR.fireballChance
			const start = { x: between(random, x0, x1), y: Math.max(METEOR.top, between(random, y0, y1)) }
			const course = steer(random, start, fallback)
			if (course === null) continue

			// A fireball flies the course's way, but slower and for longer than its class
			const speed = course.speed * (fireball ? METEOR.fireballSpeedScale : 1)
			const [minDuration, maxDuration] = fireball ? METEOR.fireballDuration : course.duration
			const duration = between(random, minDuration, maxDuration)
			const length = Math.min(maxPath * course.pathShare, speed * duration)
			if (length < (course.minPath ?? minPath)) continue

			const path = { startX: start.x, startY: start.y, dirX: course.dirX, dirY: course.dirY, length, drag: fireball ? METEOR.fireballDrag : METEOR.drag }
			const end = meteorPoint(path, 1)
			// Both ends on screen keep the straight path on screen, and the end clears the navbar and the bottom corners
			if (end.x < METEOR.edgeMargin || end.x > width - METEOR.edgeMargin || end.y < METEOR.top || end.y > height * METEOR.maxEndY) continue
			// Clear of the zones the caller keeps every path away from
			if (clearOf.some((rect) => segmentTouches(start, end, rect, QUIET.feather))) continue
			// Within a feather of the padded copy the veil may dim it, and only the rects it comes that close to can; a fireball is too bright to veil
			const near = field.quiet.filter((rect) => segmentTouches(start, end, rect, QUIET.feather))
			const mayDim = near.length > 0
			if (mayDim && (fireball || !copyAllowed)) continue
			const peak = fireball ? 1 : course.peak
			const veiled = mayDim ? veiledFrom(near, path, peak, ink) : CLEAR_SKY
			if (veiled === null || veiled.behind < minBehind) continue
			const { dimFrom } = veiled

			// A flare brightens the head and a train lingers along the whole path: both only in clear sky
			const flare = dimFrom > METEOR_LIGHT.flareAt + METEOR_LIGHT.flareClearWidths * METEOR_LIGHT.flareWidth && random() < METEOR.flareChance
			const train = dimFrom === 1 && (course.train || fireball) && random() < METEOR.trainChance
			return {
				meteor: {
					...path,
					speed: length / duration,
					duration,
					peak,
					wake: fireball ? METEOR.fireballWake : METEOR.wake,
					wakeColor: course.wakeColor,
					fireball,
					flare,
					train,
					nearCopy: dimFrom < 1,
					startedAt: now,
				},
				behind: veiled.behind,
			}
		}
		return null
	}

	const first = fit(0)
	if (first === null) return null
	// A flight that already passes behind copy keeps its path; with no light allowed on the copy (ink 0) there is nothing to aim at
	const plain = !first.meteor.fireball && !first.meteor.flare && !first.meteor.train
	const aims = plain && copyAllowed && ink > 0 && first.behind < METEOR_PASS.dwell && random() < METEOR_PASS.share
	return (aims ? fit(METEOR_PASS.dwell) : null)?.meteor ?? first.meteor
}

/**
 * Plans a shooting star inside the viewport, below the navbar and clear of the copy in `clearOf`, that lights up and
 * peaks in clear sky and may glide on behind quiet copy (METEOR_VEIL). Long flights first; where none fits, shorter ones
 * rather than none, unless `options.flights` asks for one kind. Returns null when nothing fits, for example on a phone
 * held sideways.
 */
export function planMeteor(random: Random, field: MeteorField, now: number, options: PlanOptions): Meteor | null {
	const narrow = field.width <= NARROW_MAX_WIDTH
	const { flights = 'both' } = options
	return (
		(flights === 'short' ? null : planFlight(random, field, now, { ...options, fallback: false, fireballs: !narrow })) ??
		(flights === 'long' ? null : planFlight(random, field, now, { ...options, fallback: true, fireballs: false }))
	)
}

/** Share of the path flown at progress p (0-1): fast at first, slowing with atmospheric drag. */
export function travel(progress: number, drag: number): number {
	const p = Math.min(1, Math.max(0, progress))
	return (p - drag * p * p * p) / (1 - drag)
}

/** Where the head is at flight progress p (clamped to 0-1), in screen CSS px. */
export function meteorPoint(meteor: MeteorPath, progress: number): Point {
	const distance = meteor.length * travel(progress, meteor.drag)
	return { x: meteor.startX + meteor.dirX * distance, y: meteor.startY + meteor.dirY * distance }
}

/** Light curve at progress p (0-1): a quick ignition, a peak near 45% and a gentle burn-out; a flare adds a late spike. */
export function meteorLight(progress: number, flare: boolean): number {
	if (progress <= 0 || progress >= 1) return 0
	const { skew, sharpness, flareAt, flareWidth } = METEOR_LIGHT
	const curve = Math.sin(Math.PI * progress ** skew) ** sharpness
	return flare ? curve + METEOR_LIGHT.flare * Math.exp(-(((progress - flareAt) / flareWidth) ** 2)) : curve
}

/** True while the head flies or its wake still glows; after that only a slow-fading train may remain. */
export function meteorMoving(meteor: Meteor, now: number): boolean {
	return now - meteor.startedAt < meteor.duration + METEOR.wakeSpan * meteor.wake
}

/** Seconds a shooting star stays visible after launch: its flight, then its wake or its train. */
export function meteorLifetime(meteor: Meteor): number {
	return meteor.duration + (meteor.train ? TRAIN.life : METEOR.wakeSpan * meteor.wake)
}

/** Progress, brightness and train of a shooting star at time `now` (s). */
export function meteorAt(meteor: Meteor, now: number): MeteorFrame {
	const elapsed = now - meteor.startedAt
	const progress = Math.max(0, elapsed / meteor.duration)
	// The train brightens as the head crosses the path, lingers after the flight and eases out before it is retired
	const train = meteor.train
		? TRAIN.peak *
			(1 - Math.exp(-Math.max(0, elapsed - TRAIN.onset * meteor.duration) / TRAIN.rise)) *
			Math.exp(-Math.max(0, elapsed - meteor.duration) / TRAIN.decay) *
			smoothstep(TRAIN.life, TRAIN.life - TRAIN.fadeOut, elapsed - meteor.duration)
		: 0
	return {
		progress,
		intensity: meteor.peak * meteorLight(progress, meteor.flare),
		train,
		flown: meteor.length * travel(progress, meteor.drag),
	}
}

/** Seconds until the next shooting star: a floor plus an exponential extra (no rhythm to notice), longer on long visits. */
export function nextMeteorGap(random: () => number, secondsSinceReveal: number): number {
	const gap = Math.min(METEOR.gapMax, METEOR.gapMin - METEOR.gapMeanExtra * Math.log(1 - random()))
	return secondsSinceReveal > METEOR.slowAfter ? gap * METEOR.slowFactor : gap
}
