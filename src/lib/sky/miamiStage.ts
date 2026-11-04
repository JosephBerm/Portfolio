import { luminance } from './color'
import { NARROW_MAX_WIDTH } from './config'
import { BOAT, CLOUDS, RAMP, SKYLINE, STAGE, SUN } from './miamiConfig'
import { buildRampLut, rampTForLuminance, type RampLut } from './miamiRamp'
import type { LandingRect, Rgb, SkyRect, SkyTokens } from './protocol'
import type { DescentWindow } from './scene'

/**
 * Everything the stage is measured from. Rects are CSS px: `quiet` in document coordinates, `pinned` (copy in the fixed
 * side rails) in screen coordinates. `more` is the contrast preference.
 */
export interface StageInput {
	width: number
	height: number
	documentHeight: number
	landing: LandingRect | null
	quiet: readonly SkyRect[]
	pinned: readonly SkyRect[]
	tokens: SkyTokens
	more: boolean
}

/** Where one side's rail stands, in screen coordinates, and the lift at which the scene has reached its copy. */
export interface RailSide {
	/** The rail's inner x: the right edge of the left rail's rects, the left edge of the right rail's. */
	edge: number
	/** The top of the rail's highest rect. */
	top: number
	/** The lift (px of scroll left to the page's end) at and below which the rail's wing is full. */
	need: number
}

/**
 * The landing scene's geometry, all in z (px above the page's end) except where a name says otherwise. It is read from
 * the copy's own rects, so it follows the page's layout on every screen, and the sky is fitted so that every rect of
 * Contact's copy meets its contrast ceiling by construction.
 */
export interface MiamiStage {
	width: number
	height: number
	/** The width is at most NARROW_MAX_WIDTH. */
	narrow: boolean
	more: boolean
	zWater: number
	/** The sky's fit: the height of the warm band, from the waterline to where the ramp is dark enough for the copy. Under `more` it targets navy and falls to a thin band. */
	warm: number
	/** The same fit with `more` false: what palm crowns and streaks read, so the composition doesn't get smaller with the sky. Equals `warm` when `more` is false. */
	warmArt: number
	/** zWater + warm */
	zWarmTop: number
	/** Where the ramp reaches navy. */
	zReach: number
	/** The scene shows once the lift is below this. Equals zReach when `more` is false. */
	zShow: number
	/** No sky event may fly below this height. */
	zEventFloor: number
	/** No star shows at or below this height. */
	zStarOut: number
	/** Stars are at full strength from this height up, and ease in between the two. */
	zStarFull: number
	/** The bottom of the lowest Contact rect. */
	zButtonBottom: number
	/** Bright clouds stay below this: the copy's bottom less a clearance that falls toward its least where the banks need the room. */
	zCopyFloor: number
	/** The top of the footer's highest rect. */
	zFooterTop: number
	tallest: number
	/** The tallest tower in the skyline's drawing units. */
	unit: number
	sunX: number
	sunZ: number
	sunR: number
	/** Px of lift below which the sun's disc is clear of Contact's copy; the halo and the light wrap are scaled down to the room left. */
	sunGate: number
	/** The lift at which the waterline comes onto the screen. */
	horizonEnter: number
	/** The boat's length by the footer's own layout, so its wake stays above the footer. */
	boatLength: number
	rail: { left: RailSide | null; right: RailSide | null }
}

/** A cloud bank's flat bottom lies at least this many tallest towers above the waterline, or it would read as smoke on a tower. */
const BANK_FLOOR = 1.15

/** The ramp for the last navy it was built with: a layout message reruns stageFrom, and the samples change only with the theme. */
let rampMemo: { key: string; lut: RampLut } | null = null

/** The stops of the ramp in use: A's only for the 'A' direction, B's for the others. */
function rampStops(): typeof RAMP.stops.A | typeof RAMP.stops.B {
	return STAGE.direction === 'A' ? RAMP.stops.A : RAMP.stops.B
}

/** The sky's ramp for this navy. */
function rampFor(navy: Rgb): RampLut {
	const key = `${STAGE.direction}|${navy.join(',')}`
	if (rampMemo?.key !== key) rampMemo = { key, lut: buildRampLut(rampStops(), navy) }
	return rampMemo.lut
}

/** Clamps `value` to [min, max]; where they cross, `min` wins, as in CSS. */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

/**
 * The stage for a layout, or null where there is none to draw: no landing (production, forced colors, print), no copy
 * above it, or a page no taller than the canvas.
 *
 * The sky is fitted rather than guessed. Each rect of Contact's copy says what it can take behind it (`headroom`); its
 * ceiling is the luminance of navy with that much white added, less the ramp's safety margin. `warm`, the height of the
 * warm band, is the largest that keeps every rect's bottom at or above the height where the ramp has fallen to its
 * ceiling, so the copy meets its contrast at every scroll position, whatever the screen or the copy.
 */
export function stageFrom(input: StageInput): MiamiStage | null {
	const { width, height, documentHeight, landing, quiet, pinned, tokens, more } = input
	if (!landing || documentHeight <= height) return null
	const z = (y: number) => documentHeight - y
	const contact = quiet.filter((rect) => rect.y + rect.height <= landing.top && rect.y >= landing.top - STAGE.copySearchPx)
	if (contact.length === 0) return null
	const footer = quiet.filter((rect) => rect.y >= landing.bottom - 1)

	const narrow = width <= NARROW_MAX_WIDTH
	const byWidth = narrow ? 'narrow' : 'wide'
	const zFooterTop = footer.length > 0 ? Math.max(...footer.map((rect) => z(rect.y))) : z(landing.bottom)
	// The phone footer, with its row of icons, is taller than the desktop one; it runs to 767 px wide, past narrow
	const phoneFooter = zFooterTop > STAGE.water.phoneFooterZ
	const zWater = Math.max(Math.round(STAGE.water.share[byWidth] * height), zFooterTop + STAGE.water.gap[phoneFooter ? 'narrow' : 'wide'])
	const tallest = clamp(STAGE.tallest.share[byWidth] * height, STAGE.tallest.min, STAGE.tallest.max)

	const lut = rampFor(tokens.navy)
	const navyLuminance = luminance(tokens.navy)
	// The luminance a rect's ground may reach: the ceiling of its headroom less the margin, or navy's own when `navyOnly`
	const targetOf = (rect: SkyRect, navyOnly: boolean): number => {
		if (navyOnly) return navyLuminance
		const lit = (channel: 0 | 1 | 2) => Math.min(255, tokens.navy[channel] + rect.headroom * tokens.white[channel])
		return luminance([lit(0), lit(1), lit(2)]) * RAMP.margin
	}
	const fit = (navyOnly: boolean): number => {
		let fitted = Infinity
		for (const rect of contact) {
			const t = rampTForLuminance(lut, targetOf(rect, navyOnly))
			// A ground that may be as warm as the ramp gets doesn't bind
			if (t > 0) fitted = Math.min(fitted, (z(rect.y + rect.height) - zWater) / t)
		}
		return fitted
	}
	const warm = fit(more)
	const warmArt = more ? fit(false) : warm
	if (!(warm > 0 && warm < Infinity && warmArt > 0 && warmArt < Infinity)) return null

	const topT = lut.topT
	const zButtonBottom = Math.min(...contact.map((rect) => z(rect.y + rect.height)))
	const tallestBank = Math.max(...CLOUDS.banks[byWidth].map((bank) => bank.height))
	const clear = clamp(zButtonBottom - zWater - BANK_FLOOR * tallest - tallestBank, STAGE.copyClearMin, STAGE.copyClear)

	const sunX = SUN.x[byWidth] * width
	const sunR = narrow ? SUN.radius.narrow : clamp(SUN.radius.share * height, SUN.radius.min, SUN.radius.max)
	// The disc sits in the low base's gap, so its lowest quarter or so is behind the base at every screen
	const baseInGap = SKYLINE.base.share[byWidth] * SKYLINE.base.gapShare * tallest
	const sunZ = zWater + baseInGap + SUN.rise * sunR

	// Each side's rail: where its copy stands, and the lift at which the sky or the water first reaches its lowest line
	const side = (rects: readonly SkyRect[], left: boolean): RailSide | null => {
		if (rects.length === 0) return null
		const edge = left ? Math.max(...rects.map((rect) => rect.x + rect.width)) : Math.min(...rects.map((rect) => rect.x))
		const near = Math.exp(-(((edge - sunX) / (RAMP.bend.sigma[byWidth] * width)) ** 2))
		let need = (zWater - (height - Math.max(...rects.map((rect) => rect.y + rect.height)))) / STAGE.horizonRate
		for (const rect of rects) {
			const t = rampTForLuminance(lut, targetOf(rect, more))
			const warmer = Math.max(0, t - RAMP.bend.c * (1 - near)) * (RAMP.bend.a + RAMP.bend.b * near)
			// Ignores the sky's darkening toward the edges, so it runs early, never late
			need = Math.max(need, zWater + warm * warmer - (height - (rect.y + rect.height)))
		}
		return { edge, top: Math.min(...rects.map((rect) => rect.y)), need }
	}

	return {
		width,
		height,
		narrow,
		more,
		zWater,
		warm,
		warmArt,
		zWarmTop: zWater + warm,
		zReach: zWater + topT * warm,
		zShow: zWater + topT * warmArt,
		zEventFloor: zWater + RAMP.eventFloorT * warm,
		zStarOut: zWater + RAMP.starOutT * warm,
		zStarFull: zWater + RAMP.starFullT * warm,
		zButtonBottom,
		zCopyFloor: zButtonBottom - clear,
		zFooterTop,
		tallest,
		unit: tallest / STAGE.tallest.unit,
		sunX,
		sunZ,
		sunR,
		sunGate: (zButtonBottom - sunZ - sunR - SUN.gateMargin) / (1 - STAGE.horizonRate),
		horizonEnter: zWater / STAGE.horizonRate,
		boatLength: BOAT.length[phoneFooter ? 'narrow' : 'wide'],
		rail: {
			left: side(
				pinned.filter((rect) => rect.x + rect.width / 2 < width / 2),
				true
			),
			right: side(
				pinned.filter((rect) => rect.x + rect.width / 2 >= width / 2),
				false
			),
		},
	}
}

/** Whether a bitmap built for `a` is still right for `b`: both z and rail measures within STAGE.rebuildTolerancePx, the same rail sides present, and the same width, height and contrast preference. */
export function sameStage(a: MiamiStage, b: MiamiStage): boolean {
	const near = (x: number, y: number) => Math.abs(x - y) <= STAGE.rebuildTolerancePx
	const sameSide = (x: RailSide | null, y: RailSide | null) => (x === null || y === null ? x === y : near(x.edge, y.edge) && near(x.top, y.top) && near(x.need, y.need))
	return (
		a.width === b.width &&
		a.height === b.height &&
		a.more === b.more &&
		near(a.zWater, b.zWater) &&
		near(a.zWarmTop, b.zWarmTop) &&
		near(a.zReach, b.zReach) &&
		near(a.zShow, b.zShow) &&
		near(a.zEventFloor, b.zEventFloor) &&
		near(a.zStarOut, b.zStarOut) &&
		near(a.zStarFull, b.zStarFull) &&
		near(a.zButtonBottom, b.zButtonBottom) &&
		near(a.zCopyFloor, b.zCopyFloor) &&
		near(a.zFooterTop, b.zFooterTop) &&
		near(a.boatLength, b.boatLength) &&
		sameSide(a.rail.left, b.rail.left) &&
		sameSide(a.rail.right, b.rail.right)
	)
}

/** The scroll left to the page's end over which the descent runs: 0 from `zReach` up, 1 from `zWarmTop` down. */
export function descentWindow(stage: MiamiStage): DescentWindow {
	return { fromPx: stage.zReach, toPx: stage.zWarmTop }
}

/** The canvas y below which no sky event may fly; Infinity with no stage. */
export function eventFloorY(stage: MiamiStage | null, scrollY: number, documentHeight: number): number {
	return stage ? documentHeight - scrollY - stage.zEventFloor : Infinity
}
