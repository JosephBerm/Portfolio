import type { Random } from './random'

/** Lookup tables of one seeded gradient noise. */
export interface NoiseTable {
	/** A shuffled 0-255, twice over, so a lookup never has to wrap. */
	perm: Uint8Array
	/** The 256 gradients' x and y. */
	gx: Float32Array
	gy: Float32Array
}

/** Seeds a gradient noise, always with 511 draws: 255 for the shuffle and 256 for the gradient angles. */
export function createNoise(random: Random): NoiseTable {
	const order = Uint8Array.from({ length: 256 }, (_, i) => i)
	for (let i = 255; i > 0; i--) {
		const j = Math.floor(random() * (i + 1))
		const swap = order[i] ?? 0
		order[i] = order[j] ?? 0
		order[j] = swap
	}
	const perm = new Uint8Array(512)
	for (let i = 0; i < 512; i++) perm[i] = order[i & 255] ?? 0
	const gx = new Float32Array(256)
	const gy = new Float32Array(256)
	for (let i = 0; i < 256; i++) {
		const angle = random() * Math.PI * 2
		gx[i] = Math.cos(angle)
		gy[i] = Math.sin(angle)
	}
	return { perm, gx, gy }
}

/** One row of noise2's cell: the two corners' gradients dotted with the offsets to them, mixed by the fade `u`. */
function rowAt(table: NoiseTable, col: number, hash: number, xf: number, dy: number, u: number): number {
	const { perm, gx, gy } = table
	const a = perm[col + hash] ?? 0
	const b = perm[col + 1 + hash] ?? 0
	const left = (gx[a] ?? 0) * xf + (gy[a] ?? 0) * dy
	return left + ((gx[b] ?? 0) * (xf - 1) + (gy[b] ?? 0) * dy - left) * u
}

/**
 * 2D gradient noise with a quintic fade, about -1 to 1. Its rows are a helper so it stays well under the 460 bytes of
 * bytecode V8 inlines (check: `node --print-bytecode --print-bytecode-filter=noise2`): a call in the field's loops that V8
 * can't inline allocates its numbers.
 */
export function noise2(table: NoiseTable, x: number, y: number): number {
	const { perm } = table
	const xi = Math.floor(x)
	const yi = Math.floor(y)
	const xf = x - xi
	const yf = y - yi
	const col = xi & 255
	const row = yi & 255
	const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10)
	const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
	const top = rowAt(table, col, perm[row] ?? 0, xf, yf, u)
	return (top + (rowAt(table, col, perm[row + 1] ?? 0, xf, yf - 1, u) - top) * v) * 1.41
}

/** Variance of `noise2` over the plane. Measured and fixed, so no window changes how a sum of octaves is scaled. */
export const NOISE_VARIANCE = 0.0914

/**
 * Root mean square of one component of `noise2`'s gradient per lattice cell. Measured and fixed, so no window changes
 * how fast a flow built from it runs.
 */
export const NOISE_GRADIENT = 0.879

/**
 * The same noise with every gradient turned 90 degrees, sharing `perm`, so it takes no draws. cos(p) times a noise plus
 * sin(p) times its quadrature is flow noise.
 */
export function quadrature(table: NoiseTable): NoiseTable {
	return { perm: table.perm, gx: Float32Array.from(table.gy, (v) => -v), gy: table.gx.slice() }
}
