import { METEOR, METEOR_CHROMA, METEOR_KINDS, METEOR_LIGHT, METEOR_LOOK, METEOR_PASS, METEOR_VEIL, NARROW_MAX_WIDTH, QUIET, TRAIN, type SpectrumName, type SpeedClassName, type TrainSpec } from './config'
import { planFireballShow, type FireballShow } from './fireball'
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

/** A kind of shooting star apart from the ordinary and the fireball (METEOR_KINDS): one that never takes the ink lease. */
export type MeteorVariant = 'flash' | 'burst' | 'grazer'

/** One planned shooting star. Times are seconds on the worker clock. */
export interface Meteor extends MeteorPath {
	/** Nominal speed (px/s), path length / duration. */
	speed: number
	duration: number
	/** Peak brightness, 0-1. */
	peak: number
	/** Wake afterglow time constant (s). */
	wake: number
	/** The spectrum of its light (METEOR_SPECTRA): the tint of the wake, the color of the head's sheath and of the train. */
	spectrum: SpectrumName
	fireball: boolean
	flare: boolean
	train: boolean
	/** Part of the path lies within the veil of quiet copy and is drawn dimmed; a path in clear sky has none. */
	nearCopy: boolean
	startedAt: number
	/** Which variant this is, if one: it flies in clear sky only, never takes the ink lease and is drawn with CLEAR_SKY_KEEPS. */
	variant?: MeteorVariant
	/** The other pieces of a burst: this shooting star is its first, and each of these starts (`startedAt`) with it or after it, in order. */
	followers?: readonly Meteor[]
	/** A fireball's flight: everything it does beyond its path, drawn at launch (planFireballShow). Only a fireball has one, and it is drawn by drawFireball. */
	show?: FireballShow
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
	/** Longest path as a share of the planner's maximum (RADIANTS.climbShare for climbs, Infinity for an earthgrazer, whose own speed and duration bound its length, else 1). */
	pathShare: number
	/** Shortest path allowed from this start (px), or null for the planner's own minimum. */
	minPath: number | null
	/** Peak brightness (fireballs peak at 1 regardless): veiledFrom and drawMeteor fit it to each copy's INK_BUDGET. */
	peak: number
	/** The spectrum of its light (METEOR_SPECTRA). */
	spectrum: SpectrumName
	/** A persistent train is possible here. */
	train: boolean
	/** The speed class it flies at: how long a fireball launched here lasts (METEOR_KINDS.fireball). */
	speedClass: SpeedClassName
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
	 * links change color on hover and focus, which their measured headroom misses until the next measurement; for farewell
	 * meteors, also the sky above the highest quiet copy on screen at the foot of the page, where copy the sky has no rect
	 * for shows. Default none.
	 */
	clearOf?: readonly SkyRect[]
	/**
	 * The box start points are drawn from, in place of startArea(field); a start above METEOR.top moves down to it.
	 * Farewell meteors start only below the top of the highest copy of the page's flow on screen.
	 */
	starts?: StartArea
	/**
	 * This launch is a fireball: its long flights are fireballs, in clear sky only, for METEOR_KINDS.fireball's duration
	 * by the course's speed class and at a peak of 1. The shorter fallback pass never flies one, so a caller that wants a
	 * fireball or none asks for `flights: 'long'`.
	 */
	fireball?: boolean
	/** Candidate paths each pass tries, in place of METEOR.attempts: a caller whose `starts` is one point gains nothing by drawing it again. */
	attempts?: number
}

/** What one pass of the planner adds to the caller's options: whether it is the shorter fallback (its durations and its shortest path scaled by METEOR.fallbackScale). */
interface PassOptions extends PlanOptions {
	fallback: boolean
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

/**
 * How much of its spectrum's color a shooting star of this peak brightness shows, 0-1 (METEOR_CHROMA): a faint one
 * reads nearly white and a bright one clearly colored, as the eye sees them.
 */
export function meteorChroma(peak: number): number {
	const { floor, ceiling, from, to } = METEOR_CHROMA
	return floor + (ceiling - floor) * smoothstep(from, to, peak)
}

/** White a unit of light adds on the wake's centerline: its core and its soft pass. */
export const WAKE_GAIN = 1 + METEOR_LOOK.softAlpha

/** A box start points are drawn from (CSS px). */
export interface StartArea {
	x0: number
	x1: number
	y0: number
	y1: number
}

/**
 * The box planFlight draws start points from unless the caller gives its own (PlanOptions.starts), in CSS px: width ×
 * METEOR.spawnX by height × spawnY. The box itself is not clamped: a start drawn above METEOR.top, where the navbar is,
 * moves down to it.
 */
export function startArea(field: MeteorField): StartArea {
	const { width, height } = field
	return { x0: width * METEOR.spawnX[0], x1: width * METEOR.spawnX[1], y0: height * METEOR.spawnY[0], y1: height * METEOR.spawnY[1] }
}

/** A start point drawn from `area`, x and then y; one drawn above METEOR.top, where the navbar is, moves down to it. */
export function drawStart(random: Random, area: StartArea): Point {
	return { x: between(random, area.x0, area.x1), y: Math.max(METEOR.top, between(random, area.y0, area.y1)) }
}

/**
 * Whether a point lies inside the screen's guards for where a transient's key points may fall: METEOR's edge margin from
 * each side, below METEOR.top and not below METEOR.maxEndY of the height. A flight's end, a flash, a swarm's pieces and
 * a satellite's fade keep to them.
 */
export function insideGuards(field: MeteorField, x: number, y: number): boolean {
	return x >= METEOR.edgeMargin && x <= field.width - METEOR.edgeMargin && y >= METEOR.top && y <= field.height * METEOR.maxEndY
}

/** Whether a point is a start in clear sky: inside the guards and past the reach of every padded quiet rect, as a flash and a swarm's center need. */
export function clearStart(field: MeteorField, x: number, y: number): boolean {
	return insideGuards(field, x, y) && quietAt(field.quiet, x, y) === 0
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
 * Up to `options.attempts` (METEOR.attempts by default) candidate paths from start points in `options.starts` (startArea
 * by default), steered by `options.steer`, shorter on the fallback pass and every one a fireball if `options.fireball`;
 * the first that fits. A share of the launches (METEOR_PASS) then trade that flight for one that passes visibly behind
 * copy, where one fits in as many more candidates. Fireballs, flares and trains need clear sky, so a launch that came out
 * as one keeps it: their rates don't depend on the aim.
 */
function planFlight(random: Random, field: MeteorField, now: number, options: PassOptions): Meteor | null {
	const { width, height } = field
	const narrow = width <= NARROW_MAX_WIDTH
	const longSide = Math.max(width, height)
	const { steer, fallback, fireball = false, clearOf = [], nearCopy: copyAllowed = true, ink = 1, attempts = METEOR.attempts } = options
	const minPath = (narrow ? METEOR.narrowMinPath : METEOR.path[0]) * (fallback ? METEOR.fallbackScale : 1)
	const maxPath = narrow ? width * METEOR.narrowMaxPathShare : Math.min(METEOR.path[1], METEOR.pathShare * longSide)
	const area = options.starts ?? startArea(field)
	// The first of up to `attempts` candidates that fits and whose head spends at least `minBehind` of the flight visibly on copy
	const fit = (minBehind: number): Fit | null => {
		for (let attempt = 0; attempt < attempts; attempt++) {
			const start = drawStart(random, area)
			const course = steer(random, start, fallback)
			if (course === null) continue

			// A fireball flies the course's way, but slower and for longer than its speed class
			const speed = course.speed * (fireball ? METEOR.fireballSpeedScale : 1)
			const [minDuration, maxDuration] = fireball ? METEOR_KINDS.fireball.duration[course.speedClass] : course.duration
			const duration = between(random, minDuration, maxDuration)
			const length = Math.min(maxPath * course.pathShare, speed * duration)
			if (length < (course.minPath ?? minPath)) continue

			const path = { startX: start.x, startY: start.y, dirX: course.dirX, dirY: course.dirY, length, drag: METEOR.drag }
			const end = meteorPoint(path, 1)
			// Both ends on screen keep the straight path on screen, and the end clears the navbar and the bottom corners
			if (!insideGuards(field, end.x, end.y)) continue
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

			// A fireball's flares, train, wake and spectrum are its show's, and it brakes by its own law, not by METEOR.drag
			const show = fireball ? planFireballShow(random, course.spectrum, duration) : undefined
			// A flare brightens the head and a train lingers along the whole path: both only in clear sky
			const flare = !fireball && dimFrom > METEOR_LIGHT.flareAt + METEOR_LIGHT.flareClearWidths * METEOR_LIGHT.flareWidth && random() < METEOR.flareChance
			const train = show ? show.train !== null : dimFrom === 1 && course.train && random() < METEOR.trainChance
			return {
				meteor: {
					...path,
					speed: length / duration,
					duration,
					peak,
					wake: show?.motion.wake ?? METEOR.wake,
					spectrum: show?.spectrum ?? course.spectrum,
					fireball,
					flare,
					train,
					nearCopy: dimFrom < 1,
					startedAt: now,
					...(show && { show }),
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
 * rather than none, unless `options.flights` asks for one kind. A fireball (`options.fireball`) is a long flight: the
 * shorter ones are always ordinary. Returns null when nothing fits, for example on a phone held sideways.
 */
export function planMeteor(random: Random, field: MeteorField, now: number, options: PlanOptions): Meteor | null {
	const { flights = 'both' } = options
	return (
		(flights === 'short' ? null : planFlight(random, field, now, { ...options, fallback: false })) ??
		(flights === 'long' ? null : planFlight(random, field, now, { ...options, fallback: true, fireball: false }))
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

/** True while the head flies or its wake still glows; in a burst, also while a later member has yet to start or still flies or glows. After that only a slow-fading train may remain. */
export function meteorMoving(meteor: Meteor, now: number): boolean {
	return now - meteor.startedAt < meteor.duration + METEOR.wakeSpan * meteor.wake || (meteor.followers?.some((follower) => meteorMoving(follower, now)) ?? false)
}

/** The persistent train a shooting star leaves, if it leaves one: a fireball's own, which its show holds, else TRAIN. */
function trainOf(meteor: Meteor): TrainSpec | null {
	return meteor.train ? (meteor.show?.train ?? TRAIN) : null
}

/** Seconds a shooting star stays visible after launch: its flight, then its wake or its train; a burst, until its last member is gone. */
export function meteorLifetime(meteor: Meteor): number {
	const train = trainOf(meteor)
	const own = meteor.duration + (train ? train.life : METEOR.wakeSpan * meteor.wake)
	return (meteor.followers ?? []).reduce((longest, follower) => Math.max(longest, follower.startedAt - meteor.startedAt + meteorLifetime(follower)), own)
}

/** Seconds a launch's heads keep flying: a shooting star's flight, a burst's from its first member's start to the latest burn-out of its members. */
export function meteorSpan(meteor: Meteor): number {
	return (meteor.followers ?? []).reduce((longest, follower) => Math.max(longest, follower.startedAt - meteor.startedAt + follower.duration), meteor.duration)
}

/** A persistent train's alpha `elapsed` s after launch: it brightens as the head crosses the path, lingers after the flight of `duration` s and eases out before it is retired. */
export function trainEnvelope(elapsed: number, duration: number, train: TrainSpec): number {
	return (
		train.peak *
		(1 - Math.exp(-Math.max(0, elapsed - train.onset * duration) / train.rise)) *
		Math.exp(-Math.max(0, elapsed - duration) / train.decay) *
		smoothstep(train.life, train.life - train.fadeOut, elapsed - duration)
	)
}

/** A persistent train's width `since` seconds after the flight ended (never negative): it widens from `width[0]` to `width[1]` over `widen` seconds. */
export function trainWidth(train: TrainSpec, since: number): number {
	const aged = Math.min(1, since / train.widen)
	return train.width[0] + (train.width[1] - train.width[0]) * aged
}

/** Progress, brightness and train of a shooting star at time `now` (s). */
export function meteorAt(meteor: Meteor, now: number): MeteorFrame {
	const elapsed = now - meteor.startedAt
	const progress = Math.max(0, elapsed / meteor.duration)
	const train = trainOf(meteor)
	return {
		progress,
		intensity: meteor.peak * meteorLight(progress, meteor.flare),
		train: train ? trainEnvelope(elapsed, meteor.duration, train) : 0,
		flown: meteor.length * travel(progress, meteor.drag),
	}
}
