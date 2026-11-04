/**
 * What a fireball does in its flight, apart from where it flies (the planner's path) and the colors of its light
 * (METEOR_SPECTRA). Everything random is drawn once at launch into a FireballShow, so drawing one (renderFireball.ts) is a
 * pure function of the time, and the functions here read it. This module imports only its own folder's files, and only
 * types from meteors.ts, which imports it.
 */

import { FIREBALL, FIREBALL_MOTION, FIREBALL_TIERS, type FireballMotion, type FireballSpectrumName, type FireballTier, type SpectrumName, type TrainSpec } from './config'
import type { MeteorPath, Point } from './meteors'
import { between, drawByShare, type Random } from './random'
import { smoothstep } from './scene'

/** A sudden brightening as the body breaks: its peak (flight progress), how much it adds, and its rise and fall (progress units). */
export interface FireballFlare {
	at: number
	gain: number
	rise: number
	fall: number
}

/** A spark shed behind the head. */
export interface FireballSpark {
	/** Flight progress when it was shed. */
	emitted: number
	/** Time constant of its braking (s). */
	tau: number
	/** Speed across the path (CSS px/s, signed). */
	side: number
	/** Seconds until it is out. */
	life: number
	/** Radius (CSS px). */
	size: number
	/** Light at its brightest, 0-1. */
	light: number
	/** Its starting speed as a share of the head's. */
	lag: number
}

/** A piece of the terminal burst: it keeps to the path, and the bigger it is the longer it holds its speed. */
export interface FireballPiece {
	/** Time constant of its braking (s). */
	tau: number
	/** Speed across the path (CSS px/s, signed). */
	side: number
	/** Radius (CSS px). */
	size: number
	/** Light at its brightest, 0-1. */
	light: number
	/** Time constant of its fading (s). */
	decay: number
}

/** One fireball's flight, drawn at launch. */
export interface FireballShow {
	/** The spectrum its light takes (METEOR_SPECTRA): the flight's, except that a fireball drawing the eye's white (`plain`) burns as `normal`, since it is bright enough to show a color. */
	spectrum: FireballSpectrumName
	motion: FireballMotion
	tier: FireballTier
	/** Flight progress of the terminal burst. */
	burstAt: number
	flares: readonly FireballFlare[]
	/** How bright the wake and the train are along the path, in FIREBALL.knots equal stretches of the flight. */
	knots: readonly number[]
	sparks: readonly FireballSpark[]
	pieces: readonly FireballPiece[]
	/** The persistent train it leaves, if it leaves one: its motion's, cut short where the flight and the train would outlast FIREBALL.life. */
	train: TrainSpec | null
}

/** The value `share` (0-1) of the way along `range`. */
function along(range: readonly [number, number], share: number): number {
	return range[0] + (range[1] - range[0]) * share
}

/** A tier drawn by the tiers' shares, which add up to 1; the last takes whatever rounding leaves of the draw. */
function drawTier(random: Random): FireballTier {
	return drawByShare(random, Object.values(FIREBALL_TIERS), (tier) => tier.share, FIREBALL_TIERS.bright)
}

/** Either side of the path, at a speed within `range`. */
function sideways(random: Random, range: readonly [number, number]): number {
	return (random() < 0.5 ? -1 : 1) * between(random, range[0], range[1])
}

/**
 * A fireball burning in this spectrum (`plain` burns as `normal`), in a flight of `duration` seconds: its motion
 * (FIREBALL_MOTION), its brightness tier and everything that happens in the flight. The terminal burst comes after the
 * light's peak, and each earlier flare at least FIREBALL.flares.gap seconds before the one after it, so no second holds more
 * than two of them.
 */
export function planFireballShow(random: Random, spectrum: SpectrumName, duration: number): FireballShow {
	const burning = spectrum === 'plain' ? 'normal' : spectrum
	const motion: FireballMotion = FIREBALL_MOTION[burning]
	const tier = drawTier(random)
	const { flares: flareSpec, sparks: sparkSpec, pieces: pieceSpec } = FIREBALL
	const burstAt = between(random, Math.max(motion.peakAt + flareSpec.afterPeak, flareSpec.burstBetween[0]), flareSpec.burstBetween[1])
	const flares: FireballFlare[] = [{ at: burstAt, gain: tier.burst, rise: flareSpec.burstRise / duration, fall: flareSpec.burstFall / duration }]
	for (let count = 1, at = burstAt; count < tier.flares; count++) {
		at -= flareSpec.gap / duration + between(random, flareSpec.earlier[0], flareSpec.earlier[1])
		flares.push({ at, gain: between(random, flareSpec.gain[0], flareSpec.gain[1]), rise: flareSpec.rise / duration, fall: flareSpec.fall / duration })
	}
	const knots = Array.from({ length: FIREBALL.knots }, () => between(random, FIREBALL.knotLight[0], FIREBALL.knotLight[1]))
	const sparks = Array.from({ length: tier.sparks }, (): FireballSpark => {
		// Most are shed at a flare, the rest anywhere from the middle of the flight to the burst
		const flare = flares[Math.floor(random() * flares.length)]
		const emitted = flare && random() < sparkSpec.atFlares ? flare.at + between(random, sparkSpec.afterFlare[0], sparkSpec.afterFlare[1]) : between(random, sparkSpec.from, burstAt)
		return {
			emitted: Math.min(sparkSpec.lastAt, emitted),
			tau: between(random, sparkSpec.tau[0], sparkSpec.tau[1]),
			side: sideways(random, sparkSpec.side),
			life: between(random, sparkSpec.life[0], sparkSpec.life[1]),
			size: between(random, sparkSpec.size[0], sparkSpec.size[1]),
			light: between(random, sparkSpec.light[0], sparkSpec.light[1]),
			lag: between(random, sparkSpec.lag[0], sparkSpec.lag[1]),
		}
	})
	const pieces = Array.from({ length: tier.pieces }, (): FireballPiece => {
		// The bigger a piece, the longer it holds its speed, so the burst strings out along the path with the biggest in front
		const grain = random()
		return {
			tau: along(pieceSpec.tau, grain),
			side: sideways(random, pieceSpec.side),
			size: along(pieceSpec.size, grain),
			light: between(random, pieceSpec.light[0], pieceSpec.light[1]),
			decay: between(random, pieceSpec.decay[0], pieceSpec.decay[1]),
		}
	})
	// A train that would outlast FIREBALL.life with the flight is cut short
	const train = random() < tier.trainChance ? { ...motion.train, life: Math.min(motion.train.life, FIREBALL.life - duration) } : null
	return { spectrum: burning, motion, tier, burstAt, flares, knots, sparks, pieces, train }
}

/** The speed law's constant: speed(p) = 1 - c k e^(kp) of the entry speed, with speed(1) = `end`. */
function brakeConstant(brake: FireballMotion['brake']): number {
	return (1 - brake.end) / (brake.k * Math.exp(brake.k))
}

/** Unnormalized distance at progress p under the speed law. */
function brakeDistance(p: number, brake: FireballMotion['brake']): number {
	return p - brakeConstant(brake) * (Math.exp(brake.k * p) - 1)
}

/**
 * Share of the path flown at progress p (clamped to 0-1), by Whipple and Jacchia's exponential law: the deceleration
 * follows the air's density, so the speed stays near the entry speed and collapses late.
 */
export function brakedShare(progress: number, brake: FireballMotion['brake']): number {
	return brakeDistance(Math.min(1, Math.max(0, progress)), brake) / brakeDistance(1, brake)
}

/** Speed at progress p (clamped to 0-1), in path lengths per flight. */
export function brakedSpeed(progress: number, brake: FireballMotion['brake']): number {
	const p = Math.min(1, Math.max(0, progress))
	return (1 - brakeConstant(brake) * brake.k * Math.exp(brake.k * p)) / brakeDistance(1, brake)
}

/** Where the head is at flight progress p, in screen CSS px. */
export function fireballPoint(meteor: MeteorPath, brake: FireballMotion['brake'], progress: number): Point {
	const distance = meteor.length * brakedShare(progress, brake)
	return { x: meteor.startX + meteor.dirX * distance, y: meteor.startY + meteor.dirY * distance }
}

/** How far into its strongest flare the flight is at progress p: that flare's gain at its peak, 0 away from them. */
export function fireballFlare(progress: number, show: FireballShow): number {
	let flare = 0
	for (const { at, gain, rise, fall } of show.flares) {
		const after = progress - at
		flare = Math.max(flare, gain * (after < 0 ? Math.exp(-((after / rise) ** 2)) : Math.exp(-after / fall)))
	}
	return flare
}

/**
 * The head's light at progress p, 1 about the peak of the climb and more at a flare: it climbs to the motion's peakAt,
 * burns out, and loses FIREBALL.light.spent of itself at the terminal burst (FIREBALL.light has the curve).
 */
export function fireballLight(progress: number, show: FireballShow): number {
	if (progress <= 0 || progress >= 1) return 0
	const { peakAt } = show.motion
	const { climb, burn, level, flareFloor, spent, spentOver } = FIREBALL.light
	const base = progress < peakAt ? (progress / peakAt) ** climb : (1 - (progress - peakAt) / (1 - peakAt)) ** burn
	const left = 1 - spent * smoothstep(show.burstAt, show.burstAt + spentOver, progress)
	return base * left * level + fireballFlare(progress, show) * Math.min(1, base + flareFloor)
}
