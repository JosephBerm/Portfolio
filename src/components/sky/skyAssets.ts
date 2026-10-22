import {
	HAZE_MAX_PIXELS,
	HAZE_NARROW_SCALE,
	HAZE_POOLS,
	HAZE_TOP_FADE,
	METEOR_LOOK,
	MIN_CORE_SIGMA_DEVICE_PX,
	NARROW_MAX_WIDTH,
	STAR_SHAPES,
	STAR_TINTS,
} from '@/lib/sky/config'
import type { Rgb, SkyTokens } from '@/lib/sky/protocol'
import { smoothstep } from '@/lib/sky/scene'

/** A square sprite in the atlas (device px). */
export interface Sprite {
	x: number
	y: number
	size: number
}

/** Pre-rendered point-spread sprites at device scale: one per (palette tint, shape), plus the shooting star's head. */
export interface StarAtlas {
	/** An ImageBitmap, not a canvas: drawing from a canvas snapshots it on every drawImage call. */
	image: ImageBitmap
	/** Index with `tint * STAR_SHAPES.length + shape`. */
	stars: readonly Sprite[]
	meteorCore: Sprite
	meteorGlow: Sprite
}

/** The star palette: the theme white first, then the pale stellar tints. */
export function starPalette(tokens: SkyTokens): readonly Rgb[] {
	return [tokens.white, ...STAR_TINTS]
}

/** Uploads pixels once as an immutable bitmap (synchronous; works in workers). */
function toBitmap(pixels: ImageData): ImageBitmap {
	const canvas = new OffscreenCanvas(pixels.width, pixels.height)
	canvas.getContext('2d')?.putImageData(pixels, 0, 0)
	return canvas.transferToImageBitmap()
}

/** 4x4 supersampled Gaussian, so tiny points keep their true brightness and stay round. */
function gaussianAt(dx: number, dy: number, sigma: number): number {
	let sum = 0
	for (let sy = 0; sy < 4; sy++) {
		for (let sx = 0; sx < 4; sx++) {
			const x = dx + (sx + 0.5) / 4 - 0.5
			const y = dy + (sy + 0.5) / 4 - 0.5
			sum += Math.exp(-(x * x + y * y) / (2 * sigma * sigma))
		}
	}
	return sum / 16
}

/** Odd side (device px) that holds three sigmas of the widest Gaussian. */
function spriteSize(sigma: number): number {
	return 2 * Math.ceil(3 * sigma) + 1
}

/** Writes one sprite whose center pixel peaks at 1: a core Gaussian plus an optional halo. */
function paintSprite(pixels: ImageData, sprite: Sprite, color: Rgb, core: number, halo: number, haloPeak: number): void {
	const center = (sprite.size - 1) / 2
	const peak = gaussianAt(0, 0, core) + (halo > 0 ? haloPeak * gaussianAt(0, 0, halo) : 0)
	for (let j = 0; j < sprite.size; j++) {
		for (let i = 0; i < sprite.size; i++) {
			const dx = i - center
			const dy = j - center
			const value = (gaussianAt(dx, dy, core) + (halo > 0 ? haloPeak * gaussianAt(dx, dy, halo) : 0)) / peak
			const offset = ((sprite.y + j) * pixels.width + sprite.x + i) * 4
			pixels.data[offset] = color[0]
			pixels.data[offset + 1] = color[1]
			pixels.data[offset + 2] = color[2]
			pixels.data[offset + 3] = Math.round(Math.min(1, value) * 255)
		}
	}
}

/** Builds the sprite atlas for a device pixel ratio. Rebuilt only when the ratio changes (about 1 ms). */
export function buildStarAtlas(dpr: number, tokens: SkyTokens): StarAtlas {
	const palette = starPalette(tokens)
	const shapes = STAR_SHAPES.map((shape) => {
		const core = Math.max(MIN_CORE_SIGMA_DEVICE_PX, shape.core * dpr)
		const halo = shape.halo * dpr
		return { core, halo, haloPeak: shape.haloPeak, size: spriteSize(shape.haloPeak > 0 ? Math.max(core, halo) : core) }
	})
	const coreSigma = Math.max(MIN_CORE_SIGMA_DEVICE_PX, METEOR_LOOK.core * dpr)
	const glowSigma = METEOR_LOOK.glow * dpr
	const meteorCoreSize = spriteSize(coreSigma)
	const meteorGlowSize = spriteSize(glowSigma)

	// One row per tint; one column per shape with a 1px gutter. The meteor sprites take an extra row.
	const row = Math.max(...shapes.map((shape) => shape.size)) + 1
	const columns: number[] = []
	let width = 0
	for (const shape of shapes) {
		columns.push(width)
		width += shape.size + 1
	}
	width = Math.max(width, meteorCoreSize + meteorGlowSize + 2)
	const height = row * palette.length + Math.max(meteorCoreSize, meteorGlowSize) + 1

	const pixels = new ImageData(width, height)
	const stars: Sprite[] = []
	palette.forEach((tint, t) => {
		shapes.forEach((shape, s) => {
			const sprite = { x: columns[s] ?? 0, y: t * row, size: shape.size }
			paintSprite(pixels, sprite, tint, shape.core, shape.halo, shape.haloPeak)
			stars.push(sprite)
		})
	})
	const meteorY = row * palette.length
	const meteorCore = { x: 0, y: meteorY, size: meteorCoreSize }
	const meteorGlow = { x: meteorCoreSize + 1, y: meteorY, size: meteorGlowSize }
	paintSprite(pixels, meteorCore, tokens.white, coreSigma, 0, 0)
	paintSprite(pixels, meteorGlow, tokens.white, glowSigma, 0, 0)

	return { image: toBitmap(pixels), stars, meteorCore, meteorGlow }
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
