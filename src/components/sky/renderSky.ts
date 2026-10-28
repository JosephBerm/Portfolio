import { cellStars, twinkleNoise, type Star } from '@/lib/sky/catalog'
import { mixRgb, rgba } from '@/lib/sky/color'
import {
	CELL_SIZE,
	LAYERS,
	METEOR,
	METEOR_LIGHT,
	METEOR_LOOK,
	METEOR_VEIL,
	MIN_STAR_ALPHA,
	SKY_LAYERS,
	STAR_ALPHA,
	STAR_PHASES,
	TRAIN,
	TWINKLE_HORIZON_GAIN,
	type SkyLayer,
} from '@/lib/sky/config'
import { headGain, meteorAt, meteorLight, meteorPoint, WAKE_GAIN, type Meteor, type MeteorFrame, type Point } from '@/lib/sky/meteors'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { budgetKeeps, easedQuietFactor, starEmergence, transientQuietFactor, type QuietBlend, type QuietKeeps } from '@/lib/sky/scene'
import { starSpriteIndex, type Sprite, type StarAtlas } from './skyAssets'

/** Lazily generated cells of each layer's infinite plane, kept while they stay near the viewport. */
export interface StarField {
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Drops the cache once it holds far more cells than one screenful. */
	trim(visibleCells: number): void
}

/** Layer slot in a cell's cache key. */
const LAYER_INDEX: Record<SkyLayer, number> = { far: 0, mid: 1, near: 2 }

/** An empty star-cell cache; cells are generated on first use. */
export function createStarField(): StarField {
	const cells = new Map<number, readonly Star[]>()
	return {
		cell(layer, cx, cy) {
			// Numeric key (no string garbage per frame): cell coordinates stay well inside ±32768
			const key = ((cx + 0x8000) * 0x10000 + (cy + 0x8000)) * 4 + LAYER_INDEX[layer]
			let stars = cells.get(key)
			if (!stars) {
				stars = cellStars(layer, cx, cy)
				cells.set(key, stars)
			}
			return stars
		},
		trim(visibleCells) {
			if (cells.size > visibleCells * 4) cells.clear()
		},
	}
}

/** Static drawing resources, rebuilt on resize or when the pixel ratio changes. */
export interface SkyAssets {
	atlas: StarAtlas
	haze: ImageBitmap | null
	/** Star tints: --color-white, then the pale stellar tints. */
	palette: readonly Rgb[]
	tokens: SkyTokens
}

/** Everything one frame needs. Sizes are CSS px unless named device. */
export interface SkyFrame {
	/** Seconds on the worker clock (twinkle, shooting stars). */
	time: number
	width: number
	height: number
	dpr: number
	deviceWidth: number
	deviceHeight: number
	/** Scroll offset that drives parallax (frozen under reduced motion). */
	parallaxScroll: number
	/** Share of the catalog to draw at this size and quality. */
	keep: number
	/** Alpha multiplier per layer: scene × contrast. */
	layers: Record<SkyLayer, number>
	/** Seconds since the loader started lifting: negative before it, Infinity once every star is out. */
	dusk: number
	/** Twinkle strength multiplier; 0 draws every star at its resting alpha. */
	twinkle: number
	/** Haze alpha: scene × contrast × its own emergence. */
	haze: number
	/** Padded quiet rects in screen coordinates, easing from the previous measurement to the current one. */
	quiet: QuietBlend
	/** Share of every rect's INK_BUDGET a shooting star keeps on the copy itself (contrast). */
	meteorInk: number
	/** Every star at a whole device pixel, as a sky at rest draws them; false places each at its nearest quarter-pixel phase (placePoint). */
	snap: boolean
}

/** Stars this far beyond an edge are still drawn, so a halo never pops in at the border. */
const EDGE = 24

/** Top-left device pixel of the sprite placePoint last picked (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point of light centered at (px, py) device px, with its top-left whole pixel in `corner`. A moving
 * point uses the sprite pre-rendered at its nearest quarter-pixel phase, so it glides without blurring or pulsing; `snap`
 * rounds to whole pixels (sprites have odd sides), so resting stars stay crisp points.
 */
function placePoint(atlas: StarAtlas, tint: number, shape: number, px: number, py: number, snap: boolean): Sprite | undefined {
	let ix = snap ? Math.round(px) : Math.floor(px)
	let iy = snap ? Math.round(py) : Math.floor(py)
	let phaseX = snap ? 0 : Math.round((px - ix) * STAR_PHASES)
	let phaseY = snap ? 0 : Math.round((py - iy) * STAR_PHASES)
	// The nearest phase may be the next pixel's first
	if (phaseX === STAR_PHASES) {
		ix++
		phaseX = 0
	}
	if (phaseY === STAR_PHASES) {
		iy++
		phaseY = 0
	}
	const sprite = atlas.stars[starSpriteIndex(tint, shape, phaseX, phaseY)]
	if (!sprite) return undefined
	const half = (sprite.size - 1) / 2
	corner.x = ix - half
	corner.y = iy - half
	return sprite
}

/** Draws one depth layer; returns the cells visited. */
function drawLayer(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame, layer: SkyLayer): number {
	const scale = frame.layers[layer]
	if (scale <= MIN_STAR_ALPHA) return 0
	const config = LAYERS[layer]
	const offsetY = frame.parallaxScroll * config.parallax
	const x0 = Math.floor(-EDGE / CELL_SIZE)
	const x1 = Math.floor((frame.width + EDGE) / CELL_SIZE)
	const y0 = Math.floor((offsetY - EDGE) / CELL_SIZE)
	const y1 = Math.floor((offsetY + frame.height + EDGE) / CELL_SIZE)
	const { atlas } = assets
	const emerging = frame.dusk !== Infinity
	const quiet = frame.quiet.to.length > 0 || frame.quiet.from.length > 0
	let cells = 0
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			cells++
			for (const star of field.cell(layer, cx, cy)) {
				if (star.keep >= frame.keep) continue
				const x = star.x
				const y = star.y - offsetY
				if (x < -EDGE || y < -EDGE || x > frame.width + EDGE || y > frame.height + EDGE) continue
				let alpha = star.alpha * scale
				if (emerging) alpha *= starEmergence(star.delay, frame.dusk)
				// A bright star beside the copy reads as punctuation or an accent
				if (quiet) alpha *= easedQuietFactor(frame.quiet, x, y, config)
				if (star.twinkle && frame.twinkle > 0) {
					const depth = y / frame.height
					const sigma = star.twinkle.sigma * frame.twinkle * (1 + TWINKLE_HORIZON_GAIN * depth * depth)
					alpha *= Math.exp(sigma * twinkleNoise(star.twinkle, frame.time) - (sigma * sigma) / 2)
				}
				if (alpha < MIN_STAR_ALPHA) continue
				const sprite = placePoint(atlas, star.tint, star.shape, x * frame.dpr, y * frame.dpr, frame.snap)
				if (!sprite) continue
				ctx.globalAlpha = Math.min(STAR_ALPHA.peak, alpha)
				ctx.drawImage(atlas.image, sprite.x, sprite.y, sprite.size, sprite.size, corner.x, corner.y, sprite.size, sprite.size)
			}
		}
	}
	return cells
}

/** Navy, haze, then every layer with additive blending (starlight adds; overlapping glows never muddy). */
export function drawSky(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame): void {
	ctx.globalCompositeOperation = 'source-over'
	ctx.globalAlpha = 1
	ctx.fillStyle = rgba(assets.tokens.navy, 1)
	ctx.fillRect(0, 0, frame.deviceWidth, frame.deviceHeight)
	ctx.globalCompositeOperation = 'lighter'
	if (assets.haze && frame.haze > MIN_STAR_ALPHA) {
		// Nearest-neighbor keeps the dither grain intact when the haze buffer is scaled up
		ctx.imageSmoothingEnabled = false
		ctx.globalAlpha = frame.haze
		ctx.drawImage(assets.haze, 0, 0, frame.deviceWidth, frame.deviceHeight)
		ctx.imageSmoothingEnabled = true
	}
	let cells = 0
	for (const layer of SKY_LAYERS) cells += drawLayer(ctx, assets, field, frame, layer)
	field.trim(cells)
	ctx.globalAlpha = 1
}

/** Fills a quad tapering from `headWidth` at (hx, hy) to `tailWidth` at (tx, ty); (nx, ny) is the unit normal. */
function taperedQuad(ctx: OffscreenCanvasRenderingContext2D, hx: number, hy: number, tx: number, ty: number, nx: number, ny: number, headWidth: number, tailWidth: number): void {
	ctx.beginPath()
	ctx.moveTo(hx + (nx * headWidth) / 2, hy + (ny * headWidth) / 2)
	ctx.lineTo(tx + (nx * tailWidth) / 2, ty + (ny * tailWidth) / 2)
	ctx.lineTo(tx - (nx * tailWidth) / 2, ty - (ny * tailWidth) / 2)
	ctx.lineTo(hx - (nx * headWidth) / 2, hy - (ny * headWidth) / 2)
	ctx.closePath()
	ctx.fill()
}

/**
 * The faint persistent train: a mint line along the flown path that fades at both ends and widens as it ages. `kept`
 * gives the share of its light each point keeps behind quiet copy.
 */
function drawTrain(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, state: MeteorFrame, dpr: number, kept: (point: Point) => number): void {
	if (state.flown < 2) return
	const end = meteorPoint(meteor, state.progress)
	const color = mixRgb(assets.tokens.green, assets.tokens.white, TRAIN.mintToWhite)
	const gradient = ctx.createLinearGradient(meteor.startX * dpr, meteor.startY * dpr, end.x * dpr, end.y * dpr)
	for (let k = 0; k <= 4; k++) {
		const point = { x: meteor.startX + ((end.x - meteor.startX) * k) / 4, y: meteor.startY + ((end.y - meteor.startY) * k) / 4 }
		gradient.addColorStop(k / 4, rgba(color, state.train * Math.sin((Math.PI * k) / 4) * kept(point)))
	}
	const aged = Math.min(1, Math.max(0, (state.progress - 1) * meteor.duration) / TRAIN.widen)
	ctx.globalAlpha = 1
	ctx.strokeStyle = gradient
	ctx.lineCap = 'butt'
	ctx.lineWidth = (TRAIN.width[0] + (TRAIN.width[1] - TRAIN.width[0]) * aged) * dpr
	ctx.beginPath()
	ctx.moveTo(meteor.startX * dpr, meteor.startY * dpr)
	ctx.lineTo(end.x * dpr, end.y * dpr)
	ctx.stroke()
}

/**
 * A shooting star at the frame's time: its train, then the wake, glow and core. The wake is drawn from the flight's
 * emission history: each point glows from the moment the head passes it and fades with the wake time constant,
 * so the wake grows behind the head, cools from white to the meteor's tint and lingers briefly after burn-out.
 * Behind quiet copy it dims as a whole to what each copy's budget allows (METEOR_VEIL, INK_BUDGET), measured at every
 * point it draws, so a shooting star burning out behind the copy fades there while the part still in clear sky stays
 * bright, and on the copy it keeps its shape at a faint level. While a layout eases in it follows transientQuietFactor.
 * `fade` (0-1) multiplies the light of all of it, train, wake, glow and core: the caller's own fade, such as the scroll
 * cancel (scrollKept).
 */
export function drawMeteor(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, frame: SkyFrame, fade = 1): void {
	const { dpr } = frame
	const state = meteorAt(meteor, frame.time)
	const { white, green } = assets.tokens
	const keptBy = (keeps: QuietKeeps) => (point: Point) => transientQuietFactor(frame.quiet, point.x, point.y, keeps) * fade
	ctx.globalCompositeOperation = 'lighter'
	if (state.train > 0.002) drawTrain(ctx, assets, meteor, state, dpr, keptBy(budgetKeeps(state.train, METEOR_VEIL.quietKeep, frame.meteorInk)))

	// Emission progress still glowing: from `tail` (oldest) to `head` (now)
	const head = Math.min(1, state.progress)
	const tail = Math.max(0, state.progress - (METEOR.wakeSpan * meteor.wake) / meteor.duration)
	const headPoint = meteorPoint(meteor, head)
	const hx = headPoint.x * dpr
	const hy = headPoint.y * dpr
	const flaring = meteor.flare && state.progress > METEOR_LIGHT.flareGlowFrom
	const boost = (meteor.fireball ? METEOR_LOOK.fireballGlow : 1) * (flaring ? METEOR_LIGHT.flareGlow : 1)
	// The light each wake stop carries (from the head back to `tail`) and where it was emitted; the far half thins out a little faster than the afterglow alone
	const wake = Array.from({ length: METEOR_LOOK.wakeStops }, (_, k) => {
		const f = k / (METEOR_LOOK.wakeStops - 1)
		const emitted = head - f * (head - tail)
		const age = (state.progress - emitted) * meteor.duration
		const thinning = f < 0.5 ? 1 : 1 - (1 - METEOR_LOOK.tailKeep) * (2 * f - 1)
		return { f, point: meteorPoint(meteor, emitted), light: meteor.peak * meteorLight(emitted, meteor.flare) * Math.exp(-age / meteor.wake) * thinning }
	})
	// The most white the brightest pixel would add with no veil: the veil keeps each copy's share of it, so everything dims together
	const brightest = Math.max(state.intensity * headGain(boost), WAKE_GAIN * Math.max(...wake.map((stop) => stop.light)))
	const kept = keptBy(budgetKeeps(brightest, METEOR_VEIL.quietKeep, frame.meteorInk))
	if (tail < 1) {
		const tailPoint = meteorPoint(meteor, tail)
		const tx = tailPoint.x * dpr
		const ty = tailPoint.y * dpr
		const length = Math.hypot(hx - tx, hy - ty)
		if (length > 0.5) {
			const tint = meteor.fireball ? (assets.palette[METEOR_LOOK.fireballTint] ?? white) : mixRgb(green, white, METEOR_LOOK.mintToWhite)
			// One gradient serves the core and the wider, fainter soft pass
			const gradient = ctx.createLinearGradient(hx, hy, tx, ty)
			for (const stop of wake) gradient.addColorStop(stop.f, rgba(mixRgb(white, tint, Math.min(1, stop.f / METEOR_LOOK.coolBy)), stop.light * kept(stop.point)))
			const nx = -(hy - ty) / length
			const ny = (hx - tx) / length
			const [headWidth, tailWidth] = METEOR_LOOK.wakeWidth
			ctx.fillStyle = gradient
			ctx.globalAlpha = METEOR_LOOK.softAlpha
			taperedQuad(ctx, hx, hy, tx, ty, nx, ny, headWidth * METEOR_LOOK.softWidth * dpr, tailWidth * METEOR_LOOK.softWidth * dpr)
			ctx.globalAlpha = 1
			taperedQuad(ctx, hx, hy, tx, ty, nx, ny, headWidth * dpr, tailWidth * dpr)
		}
	}
	if (state.intensity > 0.003) {
		const veiled = kept(headPoint)
		const { image, meteorGlow: glow, meteorCore: core } = assets.atlas
		ctx.globalAlpha = Math.min(1, METEOR_LOOK.glowAlpha * state.intensity * boost * veiled)
		ctx.drawImage(image, glow.x, glow.y, glow.size, glow.size, hx - glow.size / 2, hy - glow.size / 2, glow.size, glow.size)
		ctx.globalAlpha = Math.min(1, state.intensity * veiled)
		ctx.drawImage(image, core.x, core.y, core.size, core.size, hx - core.size / 2, hy - core.size / 2, core.size, core.size)
	}
	ctx.globalAlpha = 1
}
