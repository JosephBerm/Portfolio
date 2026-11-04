import type { CometView } from '@/lib/sky/bodies'
import type { Vec } from '@/lib/sky/camera'
import { cellStars, LAYER_NEARNESS, twinkleNoise, type Star } from '@/lib/sky/catalog'
import { colorAlong, mixRgb, rgba } from '@/lib/sky/color'
import {
	CELL_SIZE,
	CLEAR_SKY_KEEPS,
	COMET,
	LAYERS,
	METEOR,
	METEOR_LIGHT,
	METEOR_LOOK,
	METEOR_SHEATH,
	METEOR_SPECTRA,
	METEOR_VEIL,
	MIN_CORE_SIGMA_DEVICE_PX,
	MIN_STAR_ALPHA,
	SATELLITE,
	SKY_LAYERS,
	STAR_ALPHA,
	STAR_PHASES,
	TRAIN,
	TWINKLE_HORIZON_GAIN,
	type SkyLayer,
} from '@/lib/sky/config'
import { headGain, meteorAt, meteorChroma, meteorLight, meteorPoint, trainWidth, WAKE_GAIN, type Meteor, type MeteorFrame, type Point } from '@/lib/sky/meteors'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { createQuietIndex } from '@/lib/sky/quietIndex'
import { satelliteAt, type SatellitePass } from '@/lib/sky/satellites'
import { budgetKeeps, starEmergence, transientQuietFactor, type QuietBlend, type QuietKeeps } from '@/lib/sky/scene'
import type { Transient } from '@/lib/sky/transients'
import { drawFireball, drawRadial } from './renderFireball'
import { KNOT_SIGMA, starSpriteIndex, type Sprite, type StarAtlas } from './skyAssets'

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
	/** The comet's coma and tails as one bitmap of light (buildCometArt), painted when it starts to show and closed once it is gone; null while none shows. */
	comet: ImageBitmap | null
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
	/** Share of the catalog to draw at this size and quality: the unthinned share while the stars a quality step thins out are still fading away. */
	keep: number
	/** Stars with a thinning key at or above this are the ones a quality step thins out: the thinned share of the catalog, Infinity before the first step. */
	thinFrom: number
	/** How much of its light a star being thinned out still has: 1 before the first quality step, then easing to 0 over ADAPT.thinFade. */
	thinLevel: number
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
	/** Share of every rect's INK_BUDGET a shooting star keeps on the copy itself (the contrast preference's, times the descent's inkShare). */
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
				// A star a quality step thins out fades away instead of vanishing in one frame
				if (star.keep >= frame.thinFrom) alpha *= frame.thinLevel
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
 * The faint persistent train: a line along the flown path that fades at both ends and widens as it ages, in its
 * spectrum's train colors by its age (colorAlong over TRAIN.life since the flight ended). Those colors are absolute, so
 * the assets are not read. `kept` gives the share of its light each point keeps behind quiet copy.
 */
function drawTrain(ctx: OffscreenCanvasRenderingContext2D, _assets: SkyAssets, meteor: Meteor, state: MeteorFrame, dpr: number, kept: (point: Point) => number): void {
	if (state.flown < 2) return
	const end = meteorPoint(meteor, state.progress)
	// Seconds since the flight ended (0 while the head still flies)
	const since = Math.max(0, (state.progress - 1) * meteor.duration)
	const color = colorAlong(METEOR_SPECTRA[meteor.spectrum].train, since / TRAIN.life)
	const gradient = ctx.createLinearGradient(meteor.startX * dpr, meteor.startY * dpr, end.x * dpr, end.y * dpr)
	for (let k = 0; k <= 4; k++) {
		const point = { x: meteor.startX + ((end.x - meteor.startX) * k) / 4, y: meteor.startY + ((end.y - meteor.startY) * k) / 4 }
		gradient.addColorStop(k / 4, rgba(color, state.train * Math.sin((Math.PI * k) / 4) * kept(point)))
	}
	ctx.globalAlpha = 1
	ctx.strokeStyle = gradient
	ctx.lineCap = 'butt'
	ctx.lineWidth = trainWidth(TRAIN, since) * dpr
	ctx.beginPath()
	ctx.moveTo(meteor.startX * dpr, meteor.startY * dpr)
	ctx.lineTo(end.x * dpr, end.y * dpr)
	ctx.stroke()
}

/** The color a wake cools to: its spectrum's wake color mixed from the theme's white by the meteor's chroma, so a faint one stays nearly white; `plain` stays white. */
function wakeTint(assets: SkyAssets, meteor: Meteor): Rgb {
	const { white } = assets.tokens
	return mixRgb(white, METEOR_SPECTRA[meteor.spectrum].wake ?? white, meteorChroma(meteor.peak))
}

/**
 * A shooting star at the frame's time: its train, then the wake, glow and core. The wake is drawn from the flight's
 * emission history: each point glows from the moment the head passes it and fades with the wake time constant,
 * so the wake grows behind the head, cools from white to the meteor's tint and lingers briefly after burn-out.
 * Behind quiet copy it dims as a whole to what each copy's budget allows (METEOR_VEIL, INK_BUDGET), measured at every
 * point it draws, so a shooting star burning out behind the copy fades there while the part still in clear sky stays
 * bright, and on the copy it keeps its shape at a faint level. While a layout eases in it follows transientQuietFactor.
 * `fade` (0-1) multiplies the light of all of it, train, wake, glow and core: the caller's own fade, such as the scroll
 * cancel (scrollKept). `keeps` replaces the veil's budgets for a variant that never takes the ink lease (CLEAR_SKY_KEEPS),
 * which keeps none of its light inside a padded quiet rect. `wakeStops` is how many of the wake's stops it samples, counted
 * from the head (all of METEOR_LOOK.wakeStops by default). A body that leaves no wake, a point flash, takes none: each
 * stop's light divides its age by the wake time, and an age of 0 over a wake time of 0 is NaN.
 */
export function drawMeteor(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, frame: SkyFrame, fade = 1, keeps?: QuietKeeps, wakeStops: number = METEOR_LOOK.wakeStops): void {
	const { dpr } = frame
	const state = meteorAt(meteor, frame.time)
	const { white } = assets.tokens
	const keptBy = (keeps: QuietKeeps) => (point: Point) => transientQuietFactor(frame.quiet, point.x, point.y, keeps) * fade
	ctx.globalCompositeOperation = 'lighter'
	if (state.train > 0.002) drawTrain(ctx, assets, meteor, state, dpr, keptBy(keeps ?? budgetKeeps(state.train, METEOR_VEIL.quietKeep, frame.meteorInk)))

	// Emission progress still glowing: from `tail` (oldest) to `head` (now)
	const head = Math.min(1, state.progress)
	const tail = Math.max(0, state.progress - (METEOR.wakeSpan * meteor.wake) / meteor.duration)
	const headPoint = meteorPoint(meteor, head)
	const hx = headPoint.x * dpr
	const hy = headPoint.y * dpr
	const flaring = meteor.flare && state.progress > METEOR_LIGHT.flareGlowFrom
	const boost = (meteor.fireball ? METEOR_LOOK.fireballGlow : 1) * (flaring ? METEOR_LIGHT.flareGlow : 1)
	// The light each wake stop carries (from the head back to `tail`) and where it was emitted; the far half thins out a little faster than the afterglow alone
	const wake = Array.from({ length: wakeStops }, (_, k) => {
		const f = k / (METEOR_LOOK.wakeStops - 1)
		const emitted = head - f * (head - tail)
		const age = (state.progress - emitted) * meteor.duration
		const thinning = f < 0.5 ? 1 : 1 - (1 - METEOR_LOOK.tailKeep) * (2 * f - 1)
		return { f, point: meteorPoint(meteor, emitted), light: meteor.peak * meteorLight(emitted, meteor.flare) * Math.exp(-age / meteor.wake) * thinning }
	})
	// The most white the brightest pixel would add with no veil: the veil keeps each copy's share of it, so everything dims together
	const brightest = Math.max(state.intensity * headGain(boost), WAKE_GAIN * Math.max(...wake.map((stop) => stop.light)))
	const kept = keptBy(keeps ?? budgetKeeps(brightest, METEOR_VEIL.quietKeep, frame.meteorInk))
	if (tail < 1) {
		const tailPoint = meteorPoint(meteor, tail)
		const tx = tailPoint.x * dpr
		const ty = tailPoint.y * dpr
		const length = Math.hypot(hx - tx, hy - ty)
		if (length > 0.5) {
			const tint = wakeTint(assets, meteor)
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

/**
 * The color of a shooting star's head, drawn after drawMeteor, whose head stays white: a glow round it (METEOR_SHEATH)
 * in its spectrum's sheath color, mixed from the theme's white by the meteor's chroma. Its light is the head's light now
 * times `fade` (the caller's own, as for drawMeteor) and the transient quiet factor at the head's center with
 * CLEAR_SKY_KEEPS, which is 0 once the head is inside a padded quiet rect, so the sheath never reaches the copy and the
 * veil's budgets never count it. A spectrum with no sheath (`plain`) draws nothing.
 */
export function drawMeteorSheath(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, frame: SkyFrame, fade = 1): void {
	const sheath = METEOR_SPECTRA[meteor.spectrum].sheath
	if (sheath === null) return
	const { dpr } = frame
	const state = meteorAt(meteor, frame.time)
	const head = meteorPoint(meteor, Math.min(1, state.progress))
	const chroma = meteorChroma(meteor.peak)
	const alpha = METEOR_SHEATH.alpha * chroma * state.intensity * fade * transientQuietFactor(frame.quiet, head.x, head.y, CLEAR_SKY_KEEPS)
	if (alpha < MIN_STAR_ALPHA) return
	ctx.globalCompositeOperation = 'lighter'
	ctx.globalAlpha = 1
	drawRadial(ctx, head.x * dpr, head.y * dpr, METEOR_SHEATH.radius * dpr, mixRgb(assets.tokens.white, sheath, chroma), alpha, METEOR_SHEATH.stops)
}

/** The satellite's dot is a radial gradient of this many equal steps of its radius. */
const DOT_STEPS = 8

/**
 * The light the satellite's dot adds at `t` (0 to 1) of its radius, per unit of the satellite's light: the core and the
 * faint glow (SATELLITE.dot), both lowered by what they still have at the radius, so the dot ends in nothing and the
 * square it is filled in leaves no ring, and scaled so that the center adds `gain`. Light past 1 clips where the
 * gradient is drawn, so a bright pass saturates its core. It depends on the dot's proportions alone, so the dot has one
 * shape at every pixel ratio.
 */
function dotLight(t: number): number {
	const { radius, core, glow, glowSigma, gain } = SATELLITE.dot
	const spread = (r: number) => Math.exp(-(r * r) / (2 * core * core)) + glow * Math.exp(-(r * r) / (2 * glowSigma * glowSigma))
	const edge = spread(radius)
	return (gain * (spread(radius * t) - edge)) / (spread(0) - edge)
}

/** The stops of the dot's gradient: each step of its radius, from its center to its edge, and the light it adds there per unit of the satellite's light. */
const DOT_STOPS = Array.from({ length: DOT_STEPS + 1 }, (_, k): readonly [number, number] => [k / DOT_STEPS, dotLight(k / DOT_STEPS)])

/**
 * A satellite at the frame's time: one steady dot, with no tail and no twinkle, added to the sky. It is one radial
 * gradient at the dot's unrounded place, so it glides, in the exact mix of its lit tint and the orange of Earth's shadow
 * that its warmth gives (SATELLITE.tint, SATELLITE.shadowColor). It needs no sprites, so the star atlas is the same with
 * or without satellites. The dot is SATELLITE.dot's size in CSS px, or larger where its core would fall under
 * MIN_CORE_SIGMA_DEVICE_PX (a point that small aliases and shimmers as it moves, as a star's would), and has the same
 * shape at every pixel ratio. `fade` (0-1) multiplies its light, as for a shooting star. `keeps` are the quiet keeps it is
 * drawn with (CLEAR_SKY_KEEPS), read at its center through transientQuietFactor every frame, so none of its light lands
 * inside a quiet rect, even mid-ease or when a layout changes under it: the dot reaches SATELLITE.dot.radius CSS px from
 * there (a few more where the floor widens it), well short of QUIET.padding.
 */
function drawSatellite(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, pass: SatellitePass, frame: SkyFrame, fade: number, keeps: QuietKeeps): void {
	const { x, y, alpha, warmth } = satelliteAt(pass, frame.time)
	const light = alpha * fade * transientQuietFactor(frame.quiet, x, y, keeps)
	if (light < MIN_STAR_ALPHA) return
	const { dpr } = frame
	const { dot } = SATELLITE
	const radius = dot.radius * Math.max(dpr, MIN_CORE_SIGMA_DEVICE_PX / dot.core)
	const color = mixRgb(assets.palette[SATELLITE.tint] ?? assets.tokens.white, SATELLITE.shadowColor, warmth)
	ctx.globalCompositeOperation = 'lighter'
	ctx.globalAlpha = 1
	// A device px past the radius on every side, where the gradient has nothing left to add
	drawRadial(ctx, x * dpr, y * dpr, radius, color, light, DOT_STOPS, 1)
}

/** The wake stops drawMeteor samples for a body: none for one with no wake time (a point flash, which has no length either), else all of them. */
function wakeStopsFor(meteor: Meteor): number {
	return meteor.wake === 0 ? 0 : METEOR_LOOK.wakeStops
}

/** A shooting star: drawMeteor with the wake stops its body takes (wakeStopsFor) and `keeps`, then its sheath. */
function drawShootingStar(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, frame: SkyFrame, fade: number, keeps?: QuietKeeps): void {
	drawMeteor(ctx, assets, meteor, frame, fade, keeps, wakeStopsFor(meteor))
	drawMeteorSheath(ctx, assets, meteor, frame, fade)
}

/**
 * Draws one transient at the frame's time with the share of its light it keeps (`fade`: transientFade, from the worker,
 * which holds scrollY). Clear-sky kinds, and the bodies a kind marks as clear sky (a point flash, a burst, an
 * earthgrazer), draw with CLEAR_SKY_KEEPS, chosen here for every drawer; a kind without a case fails to compile. A
 * shooting star is drawn with drawMeteor and then its sheath (drawMeteorSheath), which always keeps clear of copy. A burst
 * draws its first member and then each later one the same way; a member that has not started yet adds no light. A body
 * with no wake time, a point flash, is drawn with no wake stops (wakeStopsFor); every other body keeps all of them. A
 * fireball, the one body with a show, has a drawer of its own (drawFireball), which always keeps clear of copy.
 */
export function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame, fade: number): void {
	// Destructured, so TypeScript narrows `body` with `kind` and the check below holds with one kind or many
	const { kind, body } = transient
	switch (kind) {
		case 'meteor': {
			if (body.show) {
				drawFireball(ctx, assets, body, body.show, frame, fade)
				return
			}
			const keeps = transient.clearSky ? CLEAR_SKY_KEEPS : undefined
			drawShootingStar(ctx, assets, body, frame, fade, keeps)
			if (body.followers) for (const follower of body.followers) drawShootingStar(ctx, assets, follower, frame, fade, keeps)
			return
		}
		case 'satellite':
			drawSatellite(ctx, assets, body, frame, fade, CLEAR_SKY_KEEPS)
			return
		case 'farewell':
			drawShootingStar(ctx, assets, body, frame, fade)
			return
		default: {
			const unhandled: never = kind
			return unhandled
		}
	}
}

/**
 * The comet at one frame: its bitmap of coma and tails added to the sky, the knots gliding along the ion tail, then the
 * pseudo-nucleus over them. `view.light` (the fade-in times what the scroll and the fades leave) multiplies all of it,
 * and so does the transient quiet factor with CLEAR_SKY_KEEPS, sampled at the nucleus and at the far end of each tail and
 * taken at the lowest of the three. One bitmap cannot be dimmed part by part, so when copy comes within reach of any of
 * them all of the comet gives way together, without waiting for its fade; copy that lands between them is left to the
 * box test (bodyView), whose fade takes the comet out in TRANSIENTS.cancelFade. The bitmap is assets.comet; the caller
 * has painted it before the comet shows.
 */
export function drawComet(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, view: CometView, frame: SkyFrame): void {
	const { comet, atlas } = assets
	if (!comet || view.light < MIN_STAR_ALPHA) return
	const { dpr } = frame
	const { x, y, shape } = view
	const keptAt = (px: number, py: number) => transientQuietFactor(frame.quiet, px, py, CLEAR_SKY_KEEPS)
	const kept = view.light * Math.min(keptAt(x, y), keptAt(x + shape.dustTip.x, y + shape.dustTip.y), keptAt(x + shape.ionTip.x, y + shape.ionTip.y))
	if (kept < MIN_STAR_ALPHA) return
	const { box } = shape
	ctx.globalCompositeOperation = 'lighter'
	ctx.globalAlpha = kept
	ctx.drawImage(comet, (x + box.left) * dpr, (y + box.top) * dpr, (box.right - box.left) * dpr, (box.bottom - box.top) * dpr)
	// Each knot is the knot sprite scaled to its length and width and turned along its ray; the sprite's sigma is KNOT_SIGMA CSS px
	const { cometKnot: sprite } = atlas
	for (const knot of view.knots) {
		const light = knot.light * kept
		if (light < MIN_STAR_ALPHA) continue
		const along = knot.long / KNOT_SIGMA
		const across = knot.wide / KNOT_SIGMA
		ctx.globalAlpha = light
		ctx.setTransform(knot.dirX * along, knot.dirY * along, -knot.dirY * across, knot.dirX * across, (x + knot.x) * dpr, (y + knot.y) * dpr)
		ctx.drawImage(atlas.image, sprite.x, sprite.y, sprite.size, sprite.size, -sprite.size / 2, -sprite.size / 2, sprite.size, sprite.size)
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	// Unsnapped, so the nucleus glides as the camera carries it
	const nucleus = placePoint(atlas, COMET.nucleus.tint, COMET.nucleus.shape, x * dpr, y * dpr, false)
	if (nucleus) {
		ctx.globalAlpha = COMET.nucleus.alpha * kept
		ctx.drawImage(atlas.image, nucleus.x, nucleus.y, nucleus.size, nucleus.size, corner.x, corner.y, nucleus.size, nucleus.size)
	}
	ctx.globalAlpha = 1
}
