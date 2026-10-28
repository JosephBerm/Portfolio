/**
 * Satellites: steady points lit by a Sun below the horizon, gliding across clear sky, as a kind of transient. A pass is a
 * point on a straight line at constant speed, with no tail and no twinkle, and at most one fade: out into Earth's shadow,
 * warming as it goes, or in as it leaves the shadow. This module imports only types from transients.ts, which reads its
 * spec when it loads.
 */

import { METEOR, SATELLITE } from './config'
import { nextGap } from './gaps'
import { segmentClear } from './quietIndex'
import { skyWindow } from './radiants'
import { between } from './random'
import { smoothstep } from './scene'
import type { PlanContext, TransientSpec } from './transients'

/** Radians per degree. */
const DEG = Math.PI / 180

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

/**
 * Plans a pass in clear sky for this moment, or null when none fits in SATELLITE.attempts tries. Each try draws the kind
 * of pass (at dusk with SATELLITE.shadowShare, else at dawn), its speed and a heading at least SATELLITE.minTilt degrees
 * from vertical, and puts one end of the line just beyond a side (METEOR.edgeMargin outside it), at a height below the
 * navbar and above the bottom corners. A dusk pass starts there, heading in, and fades into the shadow where its life
 * ends; a dawn pass ends there, and fades in where its life starts. The other end, where the fade happens, must lie in
 * that band of height and at least METEOR.edgeMargin inside both sides, so the fade is seen in open sky. The first pass
 * whose line is clear of every padded quiet rect's reach (segmentClear) is the plan.
 */
export function planSatellite(context: PlanContext): SatellitePass | null {
	const { random, now, field } = context
	const { width, height, quiet } = field
	const { focal } = skyWindow(width, height)
	const top = METEOR.top
	const bottom = METEOR.maxEndY * height
	const steepest = (90 - SATELLITE.minTilt) * DEG
	for (let attempt = 0; attempt < SATELLITE.attempts; attempt++) {
		const dusk = random() < SATELLITE.shadowShare
		const left = random() < 0.5
		const speed = between(random, SATELLITE.angular[0], SATELLITE.angular[1]) * DEG * focal
		const angle = between(random, -steepest, steepest)
		// A dusk pass heads in from its side, a dawn pass out through it
		const dirX = (left === dusk ? 1 : -1) * Math.cos(angle)
		const dirY = Math.sin(angle)
		const length = speed * SATELLITE.life
		const beyond = { x: left ? -METEOR.edgeMargin : width + METEOR.edgeMargin, y: between(random, top, bottom) }
		const midSky = { x: beyond.x + (dusk ? dirX : -dirX) * length, y: beyond.y + (dusk ? dirY : -dirY) * length }
		if (midSky.y < top || midSky.y > bottom || midSky.x < METEOR.edgeMargin || midSky.x > width - METEOR.edgeMargin) continue
		// The line as the satellite flies it: in from beyond its side at dusk, out through it at dawn
		const start = dusk ? beyond : midSky
		const end = dusk ? midSky : beyond
		if (!segmentClear(quiet, start, end)) continue
		return {
			startX: start.x,
			startY: start.y,
			dirX,
			dirY,
			speed,
			life: SATELLITE.life,
			fadeIn: dusk ? 0 : SATELLITE.fadeIn,
			fadeOut: dusk ? between(random, SATELLITE.fadeOut[0], SATELLITE.fadeOut[1]) : 0,
			alpha: between(random, SATELLITE.alpha[0], SATELLITE.alpha[1]),
			startedAt: now,
		}
	}
	return null
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

/** The satellite kind: its own clock, clear sky only (it never takes the ink lease), wide screens only. */
export const SATELLITE_SPEC: TransientSpec<'satellite'> = {
	firstDelay: (random) => nextGap(random, SATELLITE.first, 0),
	nextAfter: (pass, random, sinceReveal) => pass.life + nextGap(random, SATELLITE.gap, sinceReveal),
	plan: planSatellite,
	lifetime: (pass) => pass.life,
	moving: satelliteMoving,
	nearCopy: () => false,
	lease: false,
	phones: false,
}
