/** Seeded randomness for the sky catalog, so every visitor sees the same stars and nothing random runs during render. */

/** A source of floats in [0, 1): a seeded generator for the catalog, Math.random for what varies per visit. */
export type Random = () => number

/** mulberry32: a small, fast 32-bit generator returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
	let state = seed >>> 0
	return () => {
		state = (state + 0x6d2b79f5) >>> 0
		let t = state
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

/** Mixes integer cell coordinates and a salt into one well-spread 32-bit seed. */
export function hashCell(cx: number, cy: number, salt: number): number {
	let h = Math.imul(cx | 0, 0x27d4eb2d) ^ Math.imul(cy | 0, 0x165667b1) ^ Math.imul(salt | 0, 0x9e3779b1)
	h = Math.imul(h ^ (h >>> 15), 0x85ebca6b)
	h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
	return (h ^ (h >>> 16)) >>> 0
}

/** Uniform float in [min, max). */
export function between(random: () => number, min: number, max: number): number {
	return min + (max - min) * random()
}
