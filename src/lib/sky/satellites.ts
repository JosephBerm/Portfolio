/**
 * Satellites: steady points lit by a Sun below the horizon, gliding across clear sky. A pass is a point on a straight
 * line at constant speed, with no tail and no twinkle, and at most one fade: out into Earth's shadow, warming as it goes,
 * or in as it leaves the shadow.
 */

import { smoothstep } from './scene'

/** One satellite pass: a straight line at constant speed in screen CSS px, with its fades. */
export interface SatellitePass {
	startX: number
	startY: number
	/** Unit direction. */
	dirX: number
	dirY: number
	/** CSS px/s: SATELLITE.angular (°/s) at the window's scale. */
	speed: number
	/** Whole pass (s), fades included: at most SATELLITE.life. */
	life: number
	/** Fade in (s): 0 when it slides in from beyond an edge. */
	fadeIn: number
	/** Fade into Earth's shadow at the end (s), warming as it goes; 0 when it leaves through an edge. */
	fadeOut: number
	/** Brightness while it is lit, 0-1. */
	alpha: number
	/** Worker-clock seconds. */
	startedAt: number
}

/** A satellite at one moment: where it is, how bright, and how far it has warmed into the shadow (0 to 1). */
export interface SatelliteFrame {
	x: number
	y: number
	alpha: number
	warmth: number
}

/** True while the pass lasts: its point glides, so it needs every animation frame. */
export function satelliteMoving(pass: SatellitePass, now: number): boolean {
	return now - pass.startedAt < pass.life
}

/**
 * Where a pass is at `now`, how bright, and how far it has warmed into Earth's shadow. The point keeps one speed along the
 * whole line. A pass that enters the shadow fades out over its last `fadeOut` s along one smoothstep and warms by the
 * share it has faded; one that leaves the shadow fades in over its first `fadeIn` s. Outside its life it holds its first
 * or last place.
 */
export function satelliteAt(pass: SatellitePass, now: number): SatelliteFrame {
	const elapsed = Math.min(pass.life, Math.max(0, now - pass.startedAt))
	const distance = pass.speed * elapsed
	// The shares of its light still showing: not yet faded in, not yet gone into the shadow
	const risen = pass.fadeIn > 0 ? smoothstep(0, pass.fadeIn, elapsed) : 1
	const unshadowed = pass.fadeOut > 0 ? smoothstep(pass.life, pass.life - pass.fadeOut, elapsed) : 1
	return { x: pass.startX + pass.dirX * distance, y: pass.startY + pass.dirY * distance, alpha: pass.alpha * risen * unshadowed, warmth: 1 - unshadowed }
}
