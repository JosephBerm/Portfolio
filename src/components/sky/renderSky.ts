import type { Vec } from '@/lib/sky/camera'
import { cellStars, LAYER_NEARNESS, twinkleNoise, type Star } from '@/lib/sky/catalog'
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
import { createQuietIndex } from '@/lib/sky/quietIndex'
import { budgetKeeps, starEmergence, transientQuietFactor, type QuietBlend, type QuietKeeps } from '@/lib/sky/scene'
import { starSpriteIndex, type Sprite, type StarAtlas } from './skyAssets'

/** Lazily generated cells of each layer's infinite plane, evicted by the frame they were last used in. */
export interface StarField {
	/** The stars of one cell; a cell beyond the key range (-32768 to 32767 on each axis) holds none, so keys never collide. */
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Starts a frame: cells looked up from now on count as in use. */
	beginFrame(): void
	/** Drops the cells this frame didn't use once the cache holds more than CELL_CACHE_SLACK times the cells in use. */
	trim(): void
}

/** How many times the cells in use the cache may hold before it drops the unused ones. */
const CELL_CACHE_SLACK = 2

/** Layer slot in a cell's cache key. */
const LAYER_INDEX: Record<SkyLayer, number> = { far: 0, mid: 1, near: 2 }

/**
 * Each axis's cell coordinates from -CELL_KEY_RANGE to CELL_KEY_RANGE - 1 get their own key (about ±8.4 million px),
 * well past how far the scroll moves any star on the longest page a browser lays out (Chromium stops at about 33.5
 * million px).
 */
const CELL_KEY_RANGE = 0x8000

/** A cell beyond the key range. */
const NO_STARS: readonly Star[] = []

/** A cached cell's stars and the frame that last used them. */
interface CachedCell {
	stars: readonly Star[]
	frame: number
}

/**
 * An empty star-cell cache; cells are generated on first use. A cell the current frame uses is never dropped or
 * regenerated, so the cells on screen never regenerate in one burst; once the cache holds more than CELL_CACHE_SLACK
 * times the cells in use, the cells this frame didn't use are dropped.
 */
export function createStarField(): StarField {
	const cells = new Map<number, CachedCell>()
	let frame = 0
	let inUse = 0
	return {
		cell(layer, cx, cy) {
			if (cx < -CELL_KEY_RANGE || cx >= CELL_KEY_RANGE || cy < -CELL_KEY_RANGE || cy >= CELL_KEY_RANGE) return NO_STARS
			// Numeric key (no string garbage per frame), one per cell inside the key range
			const key = ((cx + CELL_KEY_RANGE) * 2 * CELL_KEY_RANGE + (cy + CELL_KEY_RANGE)) * 4 + LAYER_INDEX[layer]
			let cached = cells.get(key)
			if (!cached) {
				cached = { stars: cellStars(layer, cx, cy), frame: -1 }
				cells.set(key, cached)
			}
			if (cached.frame !== frame) {
				cached.frame = frame
				inUse++
			}
			return cached.stars
		},
		beginFrame() {
			frame++
			inUse = 0
		},
		trim() {
			if (cells.size <= inUse * CELL_CACHE_SLACK) return
			for (const [key, cached] of cells) if (cached.frame !== frame) cells.delete(key)
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
	/** Seconds on the worker clock, for everything but the twinkle (which reads twinkleTime). */
	time: number
	/**
	 * Seconds on the worker clock less the time the tab has spent hidden. The twinkle runs on it, so a tab shown again
	 * picks the twinkle up where it stopped, instead of every star changing brightness at once.
	 */
	twinkleTime: number
	width: number
	height: number
	dpr: number
	deviceWidth: number
	deviceHeight: number
	/** The camera's offset (CSS px at nearness 1): each star is drawn its nearness times this far from its place on the sky. */
	offset: Vec
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
	/** Every star at a whole device pixel, as a sky that hasn't moved in this page view draws them; false places each at its nearest sub-pixel phase (placePoint). */
	snap: boolean
}

/**
 * Stars this far beyond an edge (CSS px) are still drawn, so a halo never pops in at the border: the widest sprite's
 * half-side, three halo sigmas rounded up to whole device pixels, is at most 12 CSS px, even at the 25% zoom the canvas
 * ratio can fall to.
 */
const EDGE = 24

/** The quiet zones bucketed by screen tile over the viewport and EDGE, so each star reads only the zones that can reach it. */
const quietIndex = createQuietIndex()

/** Top-left device pixel of the sprite placePoint last picked (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point of light centered at (px, py) device px, with its top-left whole pixel in `corner`. A moving
 * point uses the sprite pre-rendered at its nearest sub-pixel phase, so it glides without blurring or pulsing; `snap`
 * rounds to whole pixels (sprites have odd sides), so a sky that hasn't moved in this page view draws crisp points.
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

/** Draws one depth layer: each star at its place on the sky less its nearness times the camera's offset. */
function drawLayer(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame, layer: SkyLayer): void {
	const scale = frame.layers[layer]
	if (scale <= MIN_STAR_ALPHA) return
	const config = LAYERS[layer]
	const { offset } = frame
	const [qFar, qNear] = LAYER_NEARNESS[layer]
	// The cells this layer's stars can come from, for every nearness in its band
	const x0 = Math.floor((Math.min(offset.x * qFar, offset.x * qNear) - EDGE) / CELL_SIZE)
	const x1 = Math.floor((Math.max(offset.x * qFar, offset.x * qNear) + frame.width + EDGE) / CELL_SIZE)
	const y0 = Math.floor((Math.min(offset.y * qFar, offset.y * qNear) - EDGE) / CELL_SIZE)
	const y1 = Math.floor((Math.max(offset.y * qFar, offset.y * qNear) + frame.height + EDGE) / CELL_SIZE)
	const { atlas } = assets
	const emerging = frame.dusk !== Infinity
	// Whether any quiet zone is on screen: fixed for the whole frame, so read once per layer
	const quiet = !quietIndex.empty
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			for (const star of field.cell(layer, cx, cy)) {
				if (star.keep >= frame.keep) continue
				// Subtract in doubles before anything reaches the canvas, whose coordinates are float32
				const x = star.x - offset.x * star.q
				const y = star.y - offset.y * star.q
				if (x < -EDGE || y < -EDGE || x > frame.width + EDGE || y > frame.height + EDGE) continue
				let alpha = star.alpha * scale
				if (emerging) alpha *= starEmergence(star.delay, frame.dusk)
				// A bright star beside the copy reads as punctuation or an accent
				if (quiet) alpha *= quietIndex.factor(x, y, config)
				if (star.twinkle && frame.twinkle > 0) {
					const depth = y / frame.height
					const sigma = star.twinkle.sigma * frame.twinkle * (1 + TWINKLE_HORIZON_GAIN * depth * depth)
					alpha *= Math.exp(sigma * twinkleNoise(star.twinkle, frame.twinkleTime) - (sigma * sigma) / 2)
				}
				if (alpha < MIN_STAR_ALPHA) continue
				const sprite = placePoint(atlas, star.tint, star.shape, x * frame.dpr, y * frame.dpr, frame.snap)
				if (!sprite) continue
				ctx.globalAlpha = Math.min(STAR_ALPHA.peak, alpha)
				ctx.drawImage(atlas.image, sprite.x, sprite.y, sprite.size, sprite.size, corner.x, corner.y, sprite.size, sprite.size)
			}
		}
	}
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
	quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)
	field.beginFrame()
	for (const layer of SKY_LAYERS) drawLayer(ctx, assets, field, frame, layer)
	field.trim()
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
