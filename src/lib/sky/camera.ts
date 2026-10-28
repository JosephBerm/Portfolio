import { CAMERA } from './config'

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
 * camera's offset (cameraOffset): the page scroll moves it through a spring. Mutated in place, so a frame makes no
 * garbage.
 */
export interface Camera {
	/** Page scroll the stars follow (page px), smoothed by a critically damped spring. */
	scroll: Spring
	/** Scroll skipped while motion was stopped (page px): left out, so the sky resumes where it stopped. */
	shift: number
	/** Scroll goal at the last step (page px): one step that moves it more than CAMERA.snapViewports viewports is a jump. */
	lastGoal: number
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
	/** Full motion: the scroll spring follows its target; otherwise it holds where it is. */
	follow: boolean
}

/** A camera at rest on the restored scroll position: the first frame neither glides nor jumps. */
export function createCamera(scrollY: number): Camera {
	return { scroll: { value: scrollY, velocity: 0 }, shift: 0, lastGoal: scrollY, steppedAt: null }
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
 * Advances the camera to `input.time` by the true elapsed time. Returns true while the camera still moves, so the worker
 * keeps asking for frames.
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
	} else {
		// Motion isn't full: the spring holds where it is
		camera.scroll.velocity = 0
	}
	const moving = input.follow && camera.scroll.value !== goal
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

/** The camera's offset (CSS px at nearness 1): the scroll's parallax. Writes `out`. */
export function cameraOffset(camera: Camera, out: Vec): Vec {
	out.x = 0
	out.y = CAMERA.scrollParallax * camera.scroll.value
	return out
}

/** How fast the camera moves (CSS px/s at nearness 1): a star of nearness q moves q times as fast on screen. */
export function cameraSpeed(camera: Camera): number {
	return CAMERA.scrollParallax * Math.abs(camera.scroll.velocity)
}
