import { CAMERA, DRIFT, LEAN } from './config'
import { smoothstep } from './scene'

/** A 2D offset (CSS px) or velocity (CSS px/s). */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: where it is and how fast it moves (its own units per second). */
export interface Spring {
	value: number
	velocity: number
}

/**
 * The one camera the sky is seen through. Every star appears at its place on its layer's plane minus q times the
 * camera's offset (cameraOffset), whatever moves it: the page scroll through a spring, the drift as a closed-form path of
 * its own clock, the lean toward the pointer through two springs. Mutated in place, so a frame makes no garbage.
 */
export interface Camera {
	/** Page scroll the stars follow (page px), smoothed by a critically damped spring. */
	scroll: Spring
	/** Scroll skipped while motion was stopped (page px): left out, so the sky resumes where it stopped. */
	shift: number
	/** Scroll goal at the last step (page px): one step that moves it more than CAMERA.snapViewports viewports is a jump. */
	lastGoal: number
	/** Lean toward the pointer on each axis, -1 to 1. */
	leanX: Spring
	leanY: Spring
	/** Drift clock (s): the drift path's own time. */
	clock: number
	/** Worker-clock seconds of the last step; null after a rest, a sleep or a hidden tab, so the next step has dt 0. */
	steppedAt: number | null
}

/** What the camera follows on one step. */
export interface CameraInput {
	/** Worker-clock seconds. */
	time: number
	/** Page scroll the stars follow (page px). */
	scroll: number
	/** Viewport height (CSS px): a gap of more than CAMERA.snapViewports of these snaps, and the spring trails by at most CAMERA.maxLag of them. */
	viewportHeight: number
	/** Full motion: the springs follow their targets; otherwise they hold where they are. */
	follow: boolean
	/** Drift-clock rate, 0 to 1. */
	drift: number
	/** Lean target per axis, -1 to 1, already scaled by the scene's lean level. */
	lean: Vec
}

/** Each epicycle as angular frequency (rad per drift-clock second), radius (CSS px at nearness 1) and phase (rad). */
const EPICYCLES = DRIFT.epicycles.map(({ ratio, share, phase }) => {
	const omega = ((2 * Math.PI) / DRIFT.period) * ratio
	return { omega, radius: (share * DRIFT.speed) / Math.abs(omega), phase }
})

/** Farthest the drift carries the camera from its start on either axis (CSS px at nearness 1): twice the radii's sum, a bound for any phases. */
export const DRIFT_REACH = 2 * EPICYCLES.reduce((sum, { radius }) => sum + radius, 0)

/** A camera at rest on the restored scroll position: the first frame neither glides nor jumps. */
export function createCamera(scrollY: number): Camera {
	return {
		scroll: { value: scrollY, velocity: 0 },
		shift: 0,
		lastGoal: scrollY,
		leanX: { value: 0, velocity: 0 },
		leanY: { value: 0, velocity: 0 },
		clock: 0,
		steppedAt: null,
	}
}

/**
 * Moves a critically damped spring toward `target` over `dt` seconds with the exact solution
 * x(t) = target + (e + (v + ωe)t)e^(-ωt): the same path at any frame rate (a 15 fps timer, a 144 Hz display, a frame after
 * a stall), never past the target from rest. motion-dom resolves critically damped springs with the same closed form.
 */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number): void {
	const offset = spring.value - target
	const slope = spring.velocity + omega * offset
	const decay = Math.exp(-omega * dt)
	spring.value = target + (offset + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
}

/** Puts a spring on its target once less than CAMERA.restPx of motion (CSS px at nearness 1, after `scale`) is left. */
function settle(spring: Spring, target: number, omega: number, scale: number): void {
	if (scale * (Math.abs(spring.value - target) + Math.abs(spring.velocity) / omega) >= CAMERA.restPx) return
	spring.value = target
	spring.velocity = 0
}

/**
 * Advances the camera to `input.time`: the springs by the true elapsed time, the drift clock by at most DRIFT.maxStep of
 * it. Returns true while anything still moves, so the worker keeps asking for frames.
 */
export function stepCamera(camera: Camera, input: CameraInput): boolean {
	const dt = camera.steppedAt === null ? 0 : Math.max(0, input.time - camera.steppedAt)
	camera.steppedAt = input.time
	const goal = input.scroll - camera.shift
	// One step's change of goal, not the spring's lag: a fast fling trails far behind without ever jumping in one step
	const jumped = Math.abs(goal - camera.lastGoal) > CAMERA.snapViewports * input.viewportHeight
	camera.lastGoal = goal
	if (input.follow) {
		if (jumped) {
			// A jump in one step (an instant scrollTo, say): a spring would sweep the near stars across the screen
			camera.scroll.value = goal
			camera.scroll.velocity = 0
		} else {
			stepSpring(camera.scroll, goal, CAMERA.scrollOmega, dt)
			// A fling or a smooth-scrolled jump trails by at most maxLag viewports, so the glide after it stays short
			const lag = goal - camera.scroll.value
			const maxLag = CAMERA.maxLag * input.viewportHeight
			if (Math.abs(lag) > maxLag) {
				camera.scroll.value = goal - Math.sign(lag) * maxLag
				// The velocity of a spring trailing steadily at that lag: the glide after it is then the same at any
				// frame rate and never passes the goal
				camera.scroll.velocity = (Math.sign(lag) * CAMERA.scrollOmega * maxLag) / 2
			}
			settle(camera.scroll, goal, CAMERA.scrollOmega, CAMERA.scrollParallax)
		}
		stepSpring(camera.leanX, input.lean.x, LEAN.omega, dt)
		stepSpring(camera.leanY, input.lean.y, LEAN.omega, dt)
		settle(camera.leanX, input.lean.x, LEAN.omega, LEAN.reach)
		settle(camera.leanY, input.lean.y, LEAN.omega, LEAN.reach)
	} else {
		// Motion isn't full: the springs hold where they are
		camera.scroll.velocity = 0
		camera.leanX.velocity = 0
		camera.leanY.velocity = 0
	}
	// The clock runs forward at the drift rate and a step advances it by DRIFT.maxStep at most, so a stalled frame never
	// jumps the sky
	if (input.drift > 0) camera.clock += input.drift * Math.min(dt, DRIFT.maxStep)
	const moving = input.drift > 0 || (input.follow && camera.scroll.value !== goal) || leanWanted(camera, input.lean, input.follow)
	// At rest the camera forgets its step clock: when the target next changes, the first step has dt 0, instead of treating
	// the whole rest as time spent chasing the new target and jumping onto it
	if (!moving) camera.steppedAt = null
	return moving
}

/** Motion is full again: the sky keeps its place and follows the scroll from here. */
export function resumeCamera(camera: Camera, scrollY: number): void {
	camera.shift = scrollY - camera.scroll.value
	camera.lastGoal = camera.scroll.value
	camera.scroll.velocity = 0
	camera.steppedAt = null
}

/** The worker sleeps or the tab hides: the next step starts from dt 0. */
export function forgetStep(camera: Camera): void {
	camera.steppedAt = null
}

/** Where the drift has carried the camera at drift-clock time `clock` (s), CSS px at nearness 1; zero at 0. Writes `out`. */
export function driftAt(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x += radius * (Math.cos(omega * clock + phase) - Math.cos(phase))
		out.y += radius * (Math.sin(omega * clock + phase) - Math.sin(phase))
	}
	return out
}

/** The drift's velocity at `clock`: CSS px per second of drift clock at nearness 1 (times the rate for real time). Writes `out`. */
export function driftVelocity(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x -= radius * omega * Math.sin(omega * clock + phase)
		out.y += radius * omega * Math.cos(omega * clock + phase)
	}
	return out
}

/** Scratch vector for the drift (no garbage per frame). */
const drift: Vec = { x: 0, y: 0 }

/** The camera's offset (CSS px at nearness 1): the scroll's parallax, the drift and the lean added. Writes `out`. */
export function cameraOffset(camera: Camera, out: Vec): Vec {
	driftAt(camera.clock, drift)
	out.x = drift.x + LEAN.reach * camera.leanX.value
	out.y = CAMERA.scrollParallax * camera.scroll.value + drift.y + LEAN.reach * camera.leanY.value
	return out
}

/** How fast the camera moves with the drift at `rate`, the scroll's glide and the lean included (CSS px/s at nearness 1): what the frame clock paces. A star of nearness q moves q times as fast on screen. */
export function cameraSpeed(camera: Camera, rate: number): number {
	driftVelocity(camera.clock, drift)
	return (
		rate * Math.hypot(drift.x, drift.y) +
		CAMERA.scrollParallax * Math.abs(camera.scroll.velocity) +
		LEAN.reach * Math.hypot(camera.leanX.velocity, camera.leanY.velocity)
	)
}

/** What the drift depends on right now; the worker gathers it before every read (reused) and the twinkle reads `on` and `level` too. */
export interface DriftGate {
	/** The dusk has begun and the software-raster budget allows drift frames (PACING.minFps). */
	allowed: boolean
	/** Seconds since the dusk began (0 before it). */
	dusk: number
	/** Ambient motion runs or is heading up: full motion and the visitor here. */
	on: boolean
	/** Ambient level, 0 to 1: presence times the motion level. */
	level: number
	/** The scene's drift level (SceneLevels.drift). */
	scene: number
	/** A narrow screen (NARROW_MAX_WIDTH): the drift runs at DRIFT.narrowRate. */
	narrow: boolean
}

/** Whether the drift runs or is heading up: frames follow this, not the eased rate, which starts from exactly 0, so a sleeping worker never misses its own wake-up. */
export function driftWanted(gate: DriftGate): boolean {
	return gate.allowed && gate.on && gate.scene > 0
}

/** The drift-clock rate the scene asks for before the eases: what the frame clock paces for. */
export function driftTarget(gate: DriftGate): number {
	return gate.scene * (gate.narrow ? DRIFT.narrowRate : 1)
}

/** The drift-clock rate now: the target times the ambient level and the ease from the dusk, each smooth. */
export function driftRate(gate: DriftGate): number {
	return gate.allowed ? driftTarget(gate) * gate.level * smoothstep(0, DRIFT.ease, gate.dusk) : 0
}

/**
 * Whether the lean still moves: under full motion (`follow`), a lean spring away from `lean`, its target. A pause holds
 * the springs where they are, often short of it, so it asks for no frames then. stepCamera and the frame clock share it.
 */
export function leanWanted(camera: Camera, lean: Vec, follow: boolean): boolean {
	return follow && (camera.leanX.value !== lean.x || camera.leanY.value !== lean.y)
}
