import { EMERGENCE, INK_BUDGET, QUIET, READING, SCENE, SCROLL_CANCEL, SCROLL_LAG, STAR_INK_PEAK, type SkyLayer } from './config'
import { DESCENT } from './miamiConfig'
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
	/** Share of the drift clock's rate. */
	drift: number
	/** Share of the pointer lean. */
	lean: number
	/** Coming down to the landing scene: 0 up to DescentWindow.fromPx from the page's end, 1 from toPx on. Always 0 where there is no scene. */
	descent: number
	/** Share of every rect's ink budget a transient may keep: 1, falling to 0 early in the descent, because headroom assumes a navy ground. */
	inkShare: number
	/** How far the catalog's reserve has come out, 0 to 1. */
	reserve: number
}

/** The scroll left to the page's end (px) over which the sky comes down to the landing scene: the descent starts at `fromPx` and is complete at `toPx`, which is the smaller. */
export interface DescentWindow {
	fromPx: number
	toPx: number
}

/**
 * Scroll narrative: the full sky in the hero, a calmer one while reading, and a bookend near the end of the page, with the
 * nebula receding from the hero as the page goes on. Continuous in scroll, so it never needs its own animation clock.
 * Where the page has a landing scene, `descentWindow` says where the last stretch lies, and the stars, drift and haze give
 * way to it; without one every level is exactly the narrative's.
 */
export function sceneAt(scrollY: number, viewportHeight: number, documentHeight: number, descentWindow: DescentWindow | null = null): SceneLevels {
	const scrolled = scrollY / viewportHeight
	const remaining = Math.max(0, documentHeight - scrollY - viewportHeight) / viewportHeight
	const endShare = smoothstep(SCENE.endFadeFrom, SCENE.endFadeTo, remaining)
	const hero = 1 - smoothstep(SCENE.heroFadeFrom, SCENE.heroFadeTo, scrolled)
	const end = (1 - hero) * endShare
	const reading = 1 - hero - end
	const left = Math.max(0, documentHeight - scrollY - viewportHeight)
	const descent = descentWindow ? (1 - hero) * smoothstep(descentWindow.fromPx, descentWindow.toPx, left) : 0
	// The stars and the drift mix toward the descent's own levels, and the haze fades out, as the descent goes on
	const dusk = smoothstep(DESCENT.starMix[0], DESCENT.starMix[1], descent)
	const mix = (key: 'twinkle' | 'drift' | 'lean') => hero * SCENE.hero[key] + reading * SCENE.reading[key] + end * SCENE.end[key]
	const stars = (layer: SkyLayer) =>
		(hero * SCENE.hero.stars[layer] + reading * SCENE.reading.stars[layer] + end * SCENE.end.stars[layer]) * (1 - dusk) + DESCENT.stars[layer] * dusk
	// The nebula recedes as the page scrolls on, its loss easing in over SCENE.hazeHold, and the end bookend and the descent
	// take out whatever is left
	const [holdFrom, holdTo] = SCENE.hazeHold
	const over = Math.max(0, scrolled - holdFrom)
	const travel = over < holdTo - holdFrom ? (over * over) / (2 * (holdTo - holdFrom)) : scrolled - (holdFrom + holdTo) / 2
	const recede = Math.exp(-travel / SCENE.hazeRecede) * (1 - smoothstep(SCENE.hazeGone[0], SCENE.hazeGone[1], scrolled))
	return {
		stars: { far: stars('far'), mid: stars('mid'), near: stars('near') },
		haze: SCENE.hero.haze * recede * (1 - endShare) * (1 - smoothstep(DESCENT.hazeOut[0], DESCENT.hazeOut[1], descent)),
		twinkle: mix('twinkle'),
		drift: mix('drift') * (1 - dusk) + DESCENT.drift * dusk,
		lean: mix('lean'),
		descent,
		inkShare: 1 - smoothstep(DESCENT.inkOut[0], DESCENT.inkOut[1], descent),
		reserve: (1 - hero) * smoothstep(SCENE.reserveFrom, SCENE.reserveTo, scrollY / Math.max(1, documentHeight - viewportHeight)),
	}
}

/** How far a star with this emergence delay has come out, `seconds` after the loader started lifting (ease-out). */
export function starEmergence(delay: number, seconds: number): number {
	const t = Math.min(1, Math.max(0, (seconds - delay) / EMERGENCE.fade))
	return 1 - (1 - t) * (1 - t)
}

/** How far the nebula has come out, `seconds` after the loader started lifting. */
export function hazeEmergence(seconds: number): number {
	return smoothstep(EMERGENCE.haze[0], EMERGENCE.haze[1], seconds)
}

/** True once every star and the nebula have fully come out. */
export function emergenceDone(seconds: number): boolean {
	return seconds >= Math.max(EMERGENCE.maxDelay + EMERGENCE.fade, EMERGENCE.haze[1])
}

/** A rect moved up by `offsetY` (the scroll offset, for document coordinates) and grown by `padding` on every side. Keeps its `headroom`. */
function padded(zone: SkyRect, offsetY: number, padding: number): SkyRect {
	return { ...zone, x: zone.x - padding, y: zone.y - offsetY - padding, width: zone.width + 2 * padding, height: zone.height + 2 * padding }
}

/**
 * Quiet rects in screen coordinates, padded: the document rects moved by the scroll offset, then the pinned ones
 * (copy in fixed elements such as the side rails), which are already on screen. Each keeps its `headroom`.
 */
export function screenQuietZones(zones: readonly SkyRect[], scrollY: number, pinned: readonly SkyRect[] = []): SkyRect[] {
	return [...zones.map((zone) => padded(zone, scrollY, QUIET.padding)), ...pinned.map((zone) => padded(zone, 0, QUIET.padding))]
}

/** How far reading copy's zones grow on a screen this wide (READING). */
export function readingPadding(narrow: boolean): number {
	return narrow ? READING.narrowPadding : READING.padding
}

/**
 * Copy near the screen in screen coordinates, grown by `padding`: the document rects moved by the scroll offset, leaving
 * out those over READING.margin px off a screen `height` px tall.
 */
export function screenReadingZones(rects: readonly SkyRect[], scrollY: number, height: number, padding: number): SkyRect[] {
	const zones: SkyRect[] = []
	for (const rect of rects) {
		const y = rect.y - scrollY
		if (y + rect.height >= -READING.margin && y <= height + READING.margin) zones.push(padded(rect, scrollY, padding))
	}
	return zones
}

/**
 * Share of its light anything in the sky keeps at (x, y) for copy no light may reach: none inside a zone or within `from`
 * px of one, easing back by `reach` px from it.
 */
export function readingKept(zones: readonly SkyRect[], x: number, y: number, reach: number = QUIET.feather, from = 0): number {
	let kept = 1
	for (const zone of zones) {
		const dx = Math.max(zone.x - x, 0, x - zone.x - zone.width)
		const dy = Math.max(zone.y - y, 0, y - zone.y - zone.height)
		if (dx < reach && dy < reach) kept = Math.min(kept, smoothstep(from, reach, Math.hypot(dx, dy)))
	}
	return kept
}

/** readingKept for a flight, which keeps none until all the light round the point has cleared a zone (SCROLL_LAG). */
export function flightKept(zones: readonly SkyRect[], x: number, y: number): number {
	return readingKept(zones, x, y, QUIET.feather, SCROLL_LAG.glow)
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

/** readingKept while new zones take effect: a cross-fade from the previous zones' share to the current ones', as easedQuietFactor does. Stars on a narrow screen use it. */
export function easedReadingKept(blend: QuietBlend, x: number, y: number, reach: number): number {
	const current = readingKept(blend.to, x, y, reach)
	return blend.level >= 1 ? current : current * blend.level + readingKept(blend.from, x, y, reach) * (1 - blend.level)
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

/**
 * The least distance from (x, y) to the padded rects of `zones` (CSS px), or `least` if that is less. A rect's distance is
 * measured here as zoneQuiet measures it, and written out in both rather than shared: zoneQuiet runs for every star every
 * frame and spares the hypot for the many rects a star is nowhere near, and calling a shared function from it measured
 * slower.
 */
export function clearanceOf(zones: readonly SkyRect[], x: number, y: number, least: number): number {
	let clearance = least
	for (const zone of zones) {
		const dx = Math.max(zone.x - x, 0, x - zone.x - zone.width)
		const dy = Math.max(zone.y - y, 0, y - zone.y - zone.height)
		clearance = Math.min(clearance, Math.hypot(dx, dy))
	}
	return clearance
}

/**
 * How far from (x, y) a light may reach and stay out of every padded quiet rect (CSS px): the distance to the nearest of
 * them, in the zones now, the zones they ease from while the ease runs and a waiting layout's, the lists
 * transientQuietFactor answers to. Infinity with none on screen. A radial light whose rim is this far out lands nothing
 * on the copy, whatever its strength.
 */
export function quietClearance(blend: QuietBlend, x: number, y: number): number {
	const eased = clearanceOf(blend.to, x, y, blend.level < 1 ? clearanceOf(blend.from, x, y, Infinity) : Infinity)
	return blend.next ? clearanceOf(blend.next, x, y, eased) : eased
}

/**
 * White (0-1) a shooting star, or any transient, may add on the copy of a rect with this `headroom` (INK_BUDGET), where the
 * nebula adds no more than INK_BUDGET.hazeReserve. It can add more under the right rail: no transient may light the rails.
 */
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
 * Share of its light a transient the scroll cancel takes keeps once the page has scrolled from `launchScrollY` to
 * `scrollY` (px): the ramp of SCROLL_CANCEL, times `fade` (0-1), the caller's own fade state (a pause, say), which can
 * only dim.
 */
export function scrollKept(launchScrollY: number, scrollY: number, fade = 1): number {
	return Math.min(1, Math.max(0, fade)) * (1 - smoothstep(SCROLL_CANCEL.from, SCROLL_CANCEL.to, Math.abs(scrollY - launchScrollY)))
}
