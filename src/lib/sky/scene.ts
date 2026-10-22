import { EMERGENCE, QUIET, SCENE, type SkyLayer } from './config'
import type { SkyRect } from './protocol'

/** Hermite step from 0 at edge0 to 1 at edge1 (the edges may be reversed). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
	return t * t * (3 - 2 * t)
}

/** Scene multipliers for the current scroll position. */
export interface SceneLevels {
	/** Star alpha multiplier per layer. */
	stars: Record<SkyLayer, number>
	haze: number
	twinkle: number
	/** Shooting stars only fly over the hero, peak in clear sky and may only fade out behind its copy (METEOR_VEIL). */
	meteors: boolean
}

/**
 * Scroll narrative: the full sky in the hero, a dimmer and still sky while reading, and a bookend near the end of
 * the page. Continuous in scroll, so it never needs its own animation clock.
 */
export function sceneAt(scrollY: number, viewportHeight: number, documentHeight: number): SceneLevels {
	const scrolled = scrollY / viewportHeight
	const remaining = Math.max(0, documentHeight - scrollY - viewportHeight) / viewportHeight
	const hero = 1 - smoothstep(SCENE.heroFadeFrom, SCENE.heroFadeTo, scrolled)
	const end = (1 - hero) * smoothstep(SCENE.endFadeFrom, SCENE.endFadeTo, remaining)
	const reading = 1 - hero - end
	const mix = (key: 'haze' | 'twinkle') => hero * SCENE.hero[key] + reading * SCENE.reading[key] + end * SCENE.end[key]
	const stars = (layer: SkyLayer) => hero * SCENE.hero.stars[layer] + reading * SCENE.reading.stars[layer] + end * SCENE.end.stars[layer]
	return {
		stars: { far: stars('far'), mid: stars('mid'), near: stars('near') },
		haze: mix('haze'),
		twinkle: mix('twinkle'),
		meteors: scrolled <= SCENE.heroMeteorMaxScroll,
	}
}

/** How far a star with this emergence delay has come out, `seconds` after the loader started lifting (ease-out). */
export function starEmergence(delay: number, seconds: number): number {
	const t = Math.min(1, Math.max(0, (seconds - delay) / EMERGENCE.fade))
	return 1 - (1 - t) * (1 - t)
}

/** How far the haze has come out, `seconds` after the loader started lifting. */
export function hazeEmergence(seconds: number): number {
	return smoothstep(EMERGENCE.haze[0], EMERGENCE.haze[1], seconds)
}

/** True once every star and the haze have fully come out. */
export function emergenceDone(seconds: number): boolean {
	return seconds >= Math.max(EMERGENCE.maxDelay + EMERGENCE.fade, EMERGENCE.haze[1])
}

/**
 * Quiet rects in screen coordinates, padded: the document rects moved by the scroll offset, then the pinned ones
 * (copy in fixed elements such as the side rails), which are already on screen.
 */
export function screenQuietZones(zones: readonly SkyRect[], scrollY: number, pinned: readonly SkyRect[] = []): SkyRect[] {
	const pad = (zone: SkyRect, offsetY: number): SkyRect => ({
		x: zone.x - QUIET.padding,
		y: zone.y - offsetY - QUIET.padding,
		width: zone.width + 2 * QUIET.padding,
		height: zone.height + 2 * QUIET.padding,
	})
	return [...zones.map((zone) => pad(zone, scrollY)), ...pinned.map((zone) => pad(zone, 0))]
}

/** 1 inside a (padded) quiet rect, easing to 0 over QUIET.feather px outside it. */
export function quietAt(zones: readonly SkyRect[], x: number, y: number): number {
	let quiet = 0
	for (const zone of zones) {
		const dx = Math.max(zone.x - x, 0, x - zone.x - zone.width)
		const dy = Math.max(zone.y - y, 0, y - zone.y - zone.height)
		if (dx > QUIET.feather || dy > QUIET.feather) continue
		quiet = Math.max(quiet, 1 - smoothstep(0, QUIET.feather, Math.hypot(dx, dy)))
		if (quiet === 1) break
	}
	return quiet
}

/** 1 on the quiet copy itself (a padded rect without its padding), easing to 0 at the padded edge. */
export function inkAt(zones: readonly SkyRect[], x: number, y: number): number {
	let ink = 0
	for (const zone of zones) {
		const dx = Math.max(zone.x + QUIET.padding - x, 0, x - (zone.x + zone.width - QUIET.padding))
		const dy = Math.max(zone.y + QUIET.padding - y, 0, y - (zone.y + zone.height - QUIET.padding))
		if (dx > QUIET.padding || dy > QUIET.padding) continue
		ink = Math.max(ink, 1 - smoothstep(0, QUIET.padding, Math.hypot(dx, dy)))
		if (ink === 1) break
	}
	return ink
}

/** How much of its light something keeps near quiet copy: `quietKeep` at the padded edge, `inkKeep` on the copy itself. */
export interface QuietKeeps {
	quietKeep: number
	inkKeep: number
}

/** Quiet zones as a new measurement takes effect: `from` (the previous zones, none at first) eases into `to` as `level` goes from 0 to 1. */
export interface QuietBlend {
	from: readonly SkyRect[]
	to: readonly SkyRect[]
	level: number
}

/**
 * Share of its light a point keeps near the (padded) zones: `inkKeep` on the copy itself, easing to `quietKeep` at the
 * padded edge, then to all of it over the feather.
 */
export function quietFactor(zones: readonly SkyRect[], x: number, y: number, keeps: QuietKeeps): number {
	const quiet = quietAt(zones, x, y)
	if (quiet === 0) return 1
	const keep = keeps.quietKeep + (keeps.inkKeep - keeps.quietKeep) * inkAt(zones, x, y)
	return 1 - (1 - keep) * quiet
}

/** quietFactor while new zones take effect: a cross-fade from the previous zones' factor to the current ones'. */
export function easedQuietFactor(blend: QuietBlend, x: number, y: number, keeps: QuietKeeps): number {
	const current = quietFactor(blend.to, x, y, keeps)
	return blend.level >= 1 ? current : current * blend.level + quietFactor(blend.from, x, y, keeps) * (1 - blend.level)
}
