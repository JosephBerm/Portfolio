import { mixRgb } from '@/lib/sky/color'
import {
	COMET,
	HAZE_MAX_PIXELS,
	HAZE_NARROW_SCALE,
	HAZE_POOLS,
	HAZE_TOP_FADE,
	METEOR_LOOK,
	MIN_CORE_SIGMA_DEVICE_PX,
	NARROW_MAX_WIDTH,
	PLANET,
	STAR_PHASES,
	STAR_SHAPES,
	STAR_TINTS,
} from '@/lib/sky/config'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { smoothstep } from '@/lib/sky/scene'

/** Sigma (CSS px) of the Gaussian glow in the coma sprite: the comet draws it scaled to its own size. */
export const COMA_SIGMA = 6

/** A square sprite in the atlas (device px). */
export interface Sprite {
	x: number
	y: number
	size: number
}

/**
 * Pre-rendered point-spread sprites at device scale: one per (palette tint, shape, sub-pixel phase), plus the shooting
 * star's head and glow and the comet's coma. The planet's shape (PLANET) has sprites in the planet's own tint alone.
 */
export interface StarAtlas {
	/** An ImageBitmap, not a canvas: drawing from a canvas snapshots it on every drawImage call. */
	image: ImageBitmap
	/** Index with starSpriteIndex(tint, shape, phaseX, phaseY); the planet's shape in any other tint has none. */
	stars: readonly (Sprite | undefined)[]
	meteorCore: Sprite
	meteorGlow: Sprite
	/** A mint Gaussian of COMA_SIGMA CSS px, to scale to the coma's radius. */
	cometComa: Sprite
}

/** The star palette: the theme white first, then the pale stellar tints. */
export function starPalette(tokens: SkyTokens): readonly Rgb[] {
	return [tokens.white, ...STAR_TINTS]
}

/**
 * Where in StarAtlas.stars the sprite of a palette tint and shape sits, centered phaseX and phaseY (0 to STAR_PHASES - 1)
 * steps of 1/STAR_PHASES device px right and down.
 */
export function starSpriteIndex(tint: number, shape: number, phaseX: number, phaseY: number): number {
	return ((tint * STAR_SHAPES.length + shape) * STAR_PHASES + phaseY) * STAR_PHASES + phaseX
}

/** Uploads pixels once as an immutable bitmap (synchronous; works in workers). */
function toBitmap(pixels: ImageData): ImageBitmap {
	const canvas = new OffscreenCanvas(pixels.width, pixels.height)
	canvas.getContext('2d')?.putImageData(pixels, 0, 0)
	return canvas.transferToImageBitmap()
}

/**
 * One axis of a 4x4-supersampled pixel-area Gaussian, centered `phase` px right of the sprite's middle pixel. A pixel's
 * value is the product of its column's and its row's (the exponential of a sum is a product), so tiny points keep their
 * true brightness and stay round.
 */
function profile(size: number, sigma: number, phase: number): Float64Array {
	const center = (size - 1) / 2
	const out = new Float64Array(size)
	for (let i = 0; i < size; i++) {
		let sum = 0
		for (let s = 0; s < 4; s++) {
			const x = i - center - phase + (s + 0.5) / 4 - 0.5
			sum += Math.exp(-(x * x) / (2 * sigma * sigma))
		}
		out[i] = sum / 4
	}
	return out
}

/** Odd side (device px) that holds three sigmas of the widest Gaussian. */
function spriteSize(sigma: number): number {
	return 2 * Math.ceil(3 * sigma) + 1
}

/** A point spread at device scale: a core Gaussian and an optional halo, its sprite side and its unshifted middle pixel's value. */
interface PointSpread {
	core: number
	halo: number
	/** The halo's peak relative to the core's. */
	haloPeak: number
	size: number
	peak: number
}

/** The point spread of a core sigma and a halo sigma and peak (device px). */
function pointSpread(core: number, halo: number, haloPeak: number): PointSpread {
	const size = spriteSize(haloPeak > 0 ? Math.max(core, halo) : core)
	const middle = (size - 1) / 2
	const coreMiddle = profile(size, core, 0)[middle] ?? 0
	const haloMiddle = halo > 0 ? (profile(size, halo, 0)[middle] ?? 0) : 0
	return { core, halo, haloPeak, size, peak: coreMiddle * coreMiddle + haloPeak * haloMiddle * haloMiddle }
}

/**
 * Writes one sprite of `spread` centered `phaseX` px right of and `phaseY` px below its middle pixel. Every phase is
 * scaled by the unshifted sprite's peak, so the unshifted one peaks at 1 in its middle pixel and a shifted one carries
 * nearly the same light, spread over its pixels (the tail is cut at the sprite's edge, so it loses a little).
 */
function paintSprite(pixels: ImageData, sprite: Sprite, color: Rgb, spread: PointSpread, phaseX = 0, phaseY = 0): void {
	const { size, haloPeak, peak } = spread
	const coreX = profile(size, spread.core, phaseX)
	const coreY = profile(size, spread.core, phaseY)
	const halo = spread.halo > 0 ? { x: profile(size, spread.halo, phaseX), y: profile(size, spread.halo, phaseY) } : null
	for (let j = 0; j < size; j++) {
		for (let i = 0; i < size; i++) {
			const value = ((coreX[i] ?? 0) * (coreY[j] ?? 0) + (halo ? haloPeak * (halo.x[i] ?? 0) * (halo.y[j] ?? 0) : 0)) / peak
			const offset = ((sprite.y + j) * pixels.width + sprite.x + i) * 4
			pixels.data[offset] = color[0]
			pixels.data[offset + 1] = color[1]
			pixels.data[offset + 2] = color[2]
			pixels.data[offset + 3] = Math.round(Math.min(1, value) * 255)
		}
	}
}

/** Builds the sprite atlas for a device pixel ratio. Rebuilt only when the ratio changes (a few ms). */
export function buildStarAtlas(dpr: number, tokens: SkyTokens): StarAtlas {
	const palette = starPalette(tokens)
	const spreadOf = (shape: (typeof STAR_SHAPES)[number]) => pointSpread(Math.max(MIN_CORE_SIGMA_DEVICE_PX, shape.core * dpr), shape.halo * dpr, shape.haloPeak)
	const shapes = STAR_SHAPES.map(spreadOf)
	const planet = spreadOf(STAR_SHAPES[PLANET.shape])
	const core = pointSpread(Math.max(MIN_CORE_SIGMA_DEVICE_PX, METEOR_LOOK.core * dpr), 0, 0)
	const glow = pointSpread(METEOR_LOOK.glow * dpr, 0, 0)
	const coma = pointSpread(COMA_SIGMA * dpr, 0, 0)

	// One row per tint; one STAR_PHASES x STAR_PHASES block of phases per shape but the planet's, each sprite with a 1px
	// gutter. The meteor and comet sprites take an extra row: the meteor's head over its glow in one column, the comet's
	// coma beside them, and the planet's sprites, which exist in its tint alone, after that, as many to a line as the atlas
	// is already wide. At DPR 2 they fit beside the coma, so the planet adds nothing to the atlas, where a block of its
	// shape in every tint's row would add a whole column.
	const row = STAR_PHASES * (Math.max(...shapes.filter((_, s) => s !== PLANET.shape).map((shape) => shape.size)) + 1)
	const columns: number[] = []
	let width = 0
	for (const [s, shape] of shapes.entries()) {
		columns.push(width)
		if (s !== PLANET.shape) width += STAR_PHASES * (shape.size + 1)
	}
	const leadColumn = Math.max(core.size, glow.size) + 1
	const leadWidth = leadColumn + coma.size + 1
	const leadHeight = Math.max(core.size + glow.size + 2, coma.size + 1)
	const cell = planet.size + 1
	const phases = STAR_PHASES * STAR_PHASES
	const perLine = Math.max(1, Math.min(phases, Math.floor((width - leadWidth) / cell)))
	const lines = Math.ceil(phases / perLine)
	width = Math.max(width, leadWidth + perLine * cell)
	const meteorY = row * palette.length
	const height = meteorY + Math.max(leadHeight, lines * cell)

	const pixels = new ImageData(width, height)
	const stars = Array.from({ length: palette.length * shapes.length * STAR_PHASES * STAR_PHASES }, (): Sprite | undefined => undefined)
	palette.forEach((tint, t) => {
		shapes.forEach((shape, s) => {
			if (s === PLANET.shape) return
			for (let phaseY = 0; phaseY < STAR_PHASES; phaseY++) {
				for (let phaseX = 0; phaseX < STAR_PHASES; phaseX++) {
					const sprite = { x: (columns[s] ?? 0) + phaseX * (shape.size + 1), y: t * row + phaseY * (shape.size + 1), size: shape.size }
					paintSprite(pixels, sprite, tint, shape, phaseX / STAR_PHASES, phaseY / STAR_PHASES)
					stars[starSpriteIndex(t, s, phaseX, phaseY)] = sprite
				}
			}
		})
	})
	for (let phaseY = 0; phaseY < STAR_PHASES; phaseY++) {
		for (let phaseX = 0; phaseX < STAR_PHASES; phaseX++) {
			const k = phaseY * STAR_PHASES + phaseX
			const sprite = { x: leadWidth + (k % perLine) * cell, y: meteorY + Math.floor(k / perLine) * cell, size: planet.size }
			paintSprite(pixels, sprite, palette[PLANET.tint] ?? tokens.white, planet, phaseX / STAR_PHASES, phaseY / STAR_PHASES)
			stars[starSpriteIndex(PLANET.tint, PLANET.shape, phaseX, phaseY)] = sprite
		}
	}
	const meteorCore = { x: 0, y: meteorY, size: core.size }
	const meteorGlow = { x: 0, y: meteorY + core.size + 1, size: glow.size }
	const cometComa = { x: leadColumn, y: meteorY, size: coma.size }
	paintSprite(pixels, meteorCore, tokens.white, core)
	paintSprite(pixels, meteorGlow, tokens.white, glow)
	paintSprite(pixels, cometComa, mixRgb(tokens.green, tokens.white, COMET.coma.mint), coma)

	return { image: toBitmap(pixels), stars, meteorCore, meteorGlow, cometComa }
}

/**
 * The haze as light to add over navy: soft Gaussian pools in the card hues with triangular dither, so the 8-bit
 * gradients never band. Black where there is no haze (it is drawn additively), and none under the glass navbar.
 */
export function buildHaze(width: number, height: number, tokens: SkyTokens): ImageBitmap {
	const scale = Math.min(1, Math.sqrt(HAZE_MAX_PIXELS / Math.max(1, width * height)))
	const w = Math.max(1, Math.round(width * scale))
	const h = Math.max(1, Math.round(height * scale))
	const longSide = Math.max(w, h)
	const level = width <= NARROW_MAX_WIDTH ? HAZE_NARROW_SCALE : 1
	const red = new Float32Array(w * h)
	const green = new Float32Array(w * h)
	const blue = new Float32Array(w * h)
	// Rows under the navbar get no haze; it eases in below it (buffer rows map back to CSS px through `scale`)
	const topFade = Float32Array.from({ length: h }, (_, j) => smoothstep(HAZE_TOP_FADE[0], HAZE_TOP_FADE[1], (j + 0.5) / scale))

	for (const pool of HAZE_POOLS) {
		const color = tokens[pool.color]
		const sigma = (pool.radius * longSide) / 2
		const cx = pool.x * w
		const cy = pool.y * h
		// Separable Gaussian: one exp per column and one per row
		const gx = Float32Array.from({ length: w }, (_, i) => Math.exp(-((i + 0.5 - cx) ** 2) / (2 * sigma * sigma)))
		const gy = Float32Array.from({ length: h }, (_, j) => Math.exp(-((j + 0.5 - cy) ** 2) / (2 * sigma * sigma)))
		for (let j = 0; j < h; j++) {
			const rowWeight = (gy[j] ?? 0) * (topFade[j] ?? 0) * pool.peak * level
			if (rowWeight < 1e-4) continue
			// The pool's color at full row weight; each column scales it
			const r = color[0] * rowWeight
			const g = color[1] * rowWeight
			const b = color[2] * rowWeight
			const row = j * w
			for (let i = 0; i < w; i++) {
				const weight = gx[i] ?? 0
				const k = row + i
				red[k] = (red[k] ?? 0) + r * weight
				green[k] = (green[k] ?? 0) + g * weight
				blue[k] = (blue[k] ?? 0) + b * weight
			}
		}
	}

	const pixels = new ImageData(w, h)
	const { data } = pixels
	let seed = 0x9e3779b9
	// xorshift32; the two 16-bit halves of one draw summed give triangular noise in [-1, 1)
	const noise = () => {
		seed ^= seed << 13
		seed ^= seed >>> 17
		seed ^= seed << 5
		return ((seed & 0xffff) + (seed >>> 16)) / 65536 - 1
	}
	// The clamped array rounds to the nearest level and stops at 0; pixels with no haze stay black
	for (let k = 0; k < w * h; k++) {
		const offset = k * 4
		const r = red[k] ?? 0
		const g = green[k] ?? 0
		const b = blue[k] ?? 0
		if (r >= 0.02) data[offset] = r + noise()
		if (g >= 0.02) data[offset + 1] = g + noise()
		if (b >= 0.02) data[offset + 2] = b + noise()
		data[offset + 3] = 255
	}
	return toBitmap(pixels)
}
