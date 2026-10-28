import { EMERGENCE, INK_BUDGET, QUIET, SCENE, SCROLL_CANCEL, STAR_INK_PEAK, type SkyLayer } from './config'
import type { SkyRect } from './protocol'

/** Hermite step from 0 at edge0 to 1 at edge1 (the edges may be reversed). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
	return t * t * (3 - 2 * t)
}

/** A place in the page's scroll where transients launch: over the hero, or at the end bookend. */
export type LaunchScene = 'hero' | 'end'

/** Scene multipliers for the current scroll position. */
export interface SceneLevels {
	/** Star alpha multiplier per layer. */
	stars: Record<SkyLayer, number>
	haze: number
	twinkle: number
	/** Share of the drift clock's rate. */
	drift: number
	/** Share of the pointer lean: hero only. */
	lean: number
	/**
	 * Where transients may launch now, if anywhere: the hero, up to SCENE.heroLaunchMaxScroll viewport heights scrolled, or
	 * the end bookend once its level reaches SCENE.endLaunchLevel; null while reading. Shooting stars ignite and peak in
	 * clear sky and may glide on behind the copy, dimmed to what that copy can take (METEOR_VEIL). The two scenes never
	 * meet: the bookend's level is 0 until the hero has begun to give way.
	 */
	launchScene: LaunchScene | null
}

/**
 * Scroll narrative: the full sky in the hero, a dimmer, slowly drifting sky while reading, and a bookend near the end
 * of the page. Continuous in scroll, so it never needs its own animation clock.
 */
export function sceneAt(scrollY: number, viewportHeight: number, documentHeight: number): SceneLevels {
	const scrolled = scrollY / viewportHeight
	const remaining = Math.max(0, documentHeight - scrollY - viewportHeight) / viewportHeight
	const hero = 1 - smoothstep(SCENE.heroFadeFrom, SCENE.heroFadeTo, scrolled)
	const end = (1 - hero) * smoothstep(SCENE.endFadeFrom, SCENE.endFadeTo, remaining)
	const reading = 1 - hero - end
	const mix = (key: 'haze' | 'twinkle' | 'drift' | 'lean') => hero * SCENE.hero[key] + reading * SCENE.reading[key] + end * SCENE.end[key]
	const stars = (layer: SkyLayer) => hero * SCENE.hero.stars[layer] + reading * SCENE.reading.stars[layer] + end * SCENE.end.stars[layer]
	return {
		stars: { far: stars('far'), mid: stars('mid'), near: stars('near') },
		haze: mix('haze'),
		twinkle: mix('twinkle'),
		drift: mix('drift'),
		lean: mix('lean'),
		launchScene: scrolled <= SCENE.heroLaunchMaxScroll ? 'hero' : end >= SCENE.endLaunchLevel ? 'end' : null,
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
 * (copy in fixed elements such as the side rails), which are already on screen. Each keeps its `headroom`.
 */
export function screenQuietZones(zones: readonly SkyRect[], scrollY: number, pinned: readonly SkyRect[] = []): SkyRect[] {
	const pad = (zone: SkyRect, offsetY: number): SkyRect => ({
		...zone,
		x: zone.x - QUIET.padding,
		y: zone.y - offsetY - QUIET.padding,
		width: zone.width + 2 * QUIET.padding,
		height: zone.height + 2 * QUIET.padding,
	})
	return [...zones.map((zone) => pad(zone, scrollY)), ...pinned.map((zone) => pad(zone, 0))]
}

/** True when two lists hold the same rects (a layout message may change only the document height). */
export function sameRects(a: readonly SkyRect[], b: readonly SkyRect[]): boolean {
	return (
		a.length === b.length &&
		a.every((rect, i) => rect.x === b[i]?.x && rect.y === b[i]?.y && rect.width === b[i]?.width && rect.height === b[i]?.height && rect.headroom === b[i]?.headroom)
	)
}

/** quietAt for one zone. */
function zoneQuiet(zone: SkyRect, x: number, y: number): number {
	const dx = Math.max(zone.x - x, 0, x - zone.x - zone.width)
	const dy = Math.max(zone.y - y, 0, y - zone.y - zone.height)
	if (dx > QUIET.feather || dy > QUIET.feather) return 0
	return 1 - smoothstep(0, QUIET.feather, Math.hypot(dx, dy))
}

/** inkAt for one zone. */
function zoneInk(zone: SkyRect, x: number, y: number): number {
	const dx = Math.max(zone.x + QUIET.padding - x, 0, x - (zone.x + zone.width - QUIET.padding))
	const dy = Math.max(zone.y + QUIET.padding - y, 0, y - (zone.y + zone.height - QUIET.padding))
	if (dx > QUIET.padding || dy > QUIET.padding) return 0
	return 1 - smoothstep(0, QUIET.padding, Math.hypot(dx, dy))
}

/** 1 inside a (padded) quiet rect, easing to 0 over QUIET.feather px outside it. */
export function quietAt(zones: readonly SkyRect[], x: number, y: number): number {
	let quiet = 0
	for (const zone of zones) {
		quiet = Math.max(quiet, zoneQuiet(zone, x, y))
		if (quiet === 1) break
	}
	return quiet
}

/** 1 on the quiet copy itself (a padded rect without its padding), easing to 0 at the padded edge. */
export function inkAt(zones: readonly SkyRect[], x: number, y: number): number {
	let ink = 0
	for (const zone of zones) {
		ink = Math.max(ink, zoneInk(zone, x, y))
		if (ink === 1) break
	}
	return ink
}

/**
 * How much of its light something keeps near quiet copy: `quietKeep` at the padded edge, `inkKeep` on the copy itself,
 * a share for all copy or a function of the rect (a budget per text element, see budgetKeeps).
 */
export interface QuietKeeps {
	quietKeep: number
	inkKeep: number | ((zone: SkyRect) => number)
}

/**
 * Quiet zones as a new measurement takes effect: `from` (the previous zones, none at first) eases into `to` as `level`
 * goes from 0 to 1. `next` holds the zones of a layout waiting for that ease to end, if one is.
 */
export interface QuietBlend {
	from: readonly SkyRect[]
	to: readonly SkyRect[]
	level: number
	next?: readonly SkyRect[]
}

/**
 * Share of its light a point keeps near the (padded) zones: `inkKeep` on the copy itself, easing to `quietKeep` at the
 * padded edge, then to all of it over the feather. Each zone asks for its own share and the most protective wins.
 */
export function quietFactor(zones: readonly SkyRect[], x: number, y: number, keeps: QuietKeeps): number {
	let factor = 1
	for (const zone of zones) {
		const quiet = zoneQuiet(zone, x, y)
		if (quiet === 0) continue
		const inkKeep = typeof keeps.inkKeep === 'number' ? keeps.inkKeep : keeps.inkKeep(zone)
		const keep = keeps.quietKeep + (inkKeep - keeps.quietKeep) * zoneInk(zone, x, y)
		factor = Math.min(factor, 1 - (1 - keep) * quiet)
	}
	return factor
}

/** quietFactor while new zones take effect: a cross-fade from the previous zones' factor to the current ones'. Stars use it; a transient uses transientQuietFactor. */
export function easedQuietFactor(blend: QuietBlend, x: number, y: number, keeps: QuietKeeps): number {
	const current = quietFactor(blend.to, x, y, keeps)
	return blend.level >= 1 ? current : current * blend.level + quietFactor(blend.from, x, y, keeps) * (1 - blend.level)
}

/**
 * easedQuietFactor for a transient, a shooting star in the air and any later kind that adds light on the copy: never
 * above the factor of the current zones alone, or of a waiting layout's (`next`). Copy that moves under it (an entrance
 * settling, a reflow) gets no more than its INK_BUDGET from the first frame, not only once the ease has run out or the
 * waiting layout is applied. Stars keep easedQuietFactor: they add no light on the copy itself, so their cross-fade has
 * no budget to break.
 */
export function transientQuietFactor(blend: QuietBlend, x: number, y: number, keeps: QuietKeeps): number {
	const eased = easedQuietFactor(blend, x, y, keeps)
	const current = blend.level >= 1 ? eased : Math.min(eased, quietFactor(blend.to, x, y, keeps))
	return blend.next ? Math.min(current, quietFactor(blend.next, x, y, keeps)) : current
}

/** White (0-1) a shooting star, or any transient, may add on the copy of a rect with this `headroom` (INK_BUDGET). */
export function inkBudget(headroom: number): number {
	const { ceiling, safety, hazeReserve } = INK_BUDGET
	return Math.min(ceiling, Math.max(0, (headroom - hazeReserve - STAR_INK_PEAK) * safety))
}

/** The largest share of its light (0-1) something keeps so that what it adds, at most `white` at full strength, fits `budget`. */
function fitKeep(white: number, budget: number): number {
	return white <= budget ? 1 : budget / white
}

/**
 * Keeps for something that adds at most `white` of light where it is brightest: on each rect's copy it keeps the share
 * that rect's budget allows (never more than `quietKeep`), so all of it dims together and the brightest point fits the
 * budget. `ink` scales every budget; 0 leaves no light on the copy itself.
 */
export function budgetKeeps(white: number, quietKeep: number, ink = 1): QuietKeeps {
	return { quietKeep, inkKeep: (zone) => Math.min(quietKeep, fitKeep(white, inkBudget(zone.headroom) * ink)) }
}

/**
 * Share of its light a moving transient keeps once the page has scrolled from `launchScrollY` to `scrollY` (px): the
 * ramp of SCROLL_CANCEL, times `fade` (0-1), the caller's own fade state (a pause, say), which can only dim. It is what
 * drawMeteor takes as its `fade`.
 */
export function scrollKept(launchScrollY: number, scrollY: number, fade = 1): number {
	return Math.min(1, Math.max(0, fade)) * (1 - smoothstep(SCROLL_CANCEL.from, SCROLL_CANCEL.to, Math.abs(scrollY - launchScrollY)))
}
