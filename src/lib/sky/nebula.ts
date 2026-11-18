/**
 * The nebula as gas moving on the drift clock: the model, a pure function of that clock, with no timing, canvas, window or
 * React in it. Two optically thin slabs of turbulent gas lie along the line of sight. The back one, the body, is lit and
 * colored by the ionization of a cluster below the page's lower right corner: its density is lognormal and its emission goes
 * as density squared. The front one is a thin sky-wide mist, whose dust takes light from the body. Their light goes through
 * one asinh stretch and one budget, C(x) (1 - exp(-w / C(x))), so the most any node can hold at any clock is a static
 * ceiling, and `bound` gives it in closed form.
 *
 * The octaves of log density that move are carried along a divergence-free flow in two phases half a period apart, each
 * renewed with fresh noise where its weight is 0, with weights cos and sin so the variance of log density never changes: no
 * pulse, no dip, no loop. Every octave, the held ones too, also sways on a bounded curl warp, so outlines move and no steady
 * river forms.
 *
 * One evaluation is cut into pieces (`begin`, then `piece` 0 to pieces - 1), small enough for a tick to stop between them,
 * and `bytes` and `grain` turn light into the bytes of the bitmap. They live here, not with the pixels of skyAssets.ts, where
 * buildCometArt paints its own straight into an ImageData, because they are DOM-free: they fill arrays the runtime passes
 * in and make no ImageData or canvas, so a contrast sweep reads the composition's real bytes without one, as fireball.ts's
 * functions are read.
 */

import { scrollShift, type Camera } from './camera'
import { lightWeights, mixRgb } from './color'
import { CAMERA, COMET, HAZE_BRIGHT, HAZE_MAX_PIXELS, HAZE_TOP_FADE, NARROW_MAX_WIDTH, NEBULA, SCENE, SKY_SEED, type NebulaLobe, type NebulaOctave } from './config'
import { createNoise, noise2, NOISE_GRADIENT, NOISE_VARIANCE, quadrature, type NoiseTable } from './noise'
import type { SkyTokens } from './protocol'
import { hashCell, mulberry32, type Random } from './random'
import { smoothstep } from './scene'

/** The nebula's light as float states, evaluated in pieces, and what turns two of them into the bytes of one bitmap. */
export interface NebulaField {
	/** Nodes across and down, and CSS px between them. Node (i, j) sits at ((i + 0.5) × spacing, (j + 0.5) × spacing). */
	columns: number
	rows: number
	spacing: number
	/**
	 * The bitmap's size: the CSS width and the CSS height with the strip below the screen, scaled down where the screen's own
	 * area passes HAZE_MAX_PIXELS, and that scale. `screenRows` of its rows cover the screen, from whichever row the gas has
	 * moved up to.
	 */
	width: number
	height: number
	scale: number
	screenRows: number
	/** The strip of field below the screen, CSS px (nebulaStrip). */
	below: number
	/** Pieces of work in one evaluation. */
	pieces: number
	/** Starts evaluating the light at drift-clock `clock` into `into` (columns × rows × 3 floats, levels over navy). No per-node work. */
	begin(clock: number, into: Float32Array): void
	/** Does piece `index` of the evaluation begun. Pieces run in order, 0 to pieces - 1; the last leaves the light in `into`. */
	piece(index: number): void
	/** A mix of two states at `mix` as RGBA bytes: HAZE_BRIGHT × light less the grain's mean, alpha 255. */
	bytes(from: Float32Array, to: Float32Array, mix: number, out: Uint8ClampedArray): void
	/** The fixed grain as RGBA bytes, width × height × 4, built once. */
	grain(out: Uint8ClampedArray): void
	/**
	 * The most light a node can ever hold, as one color in levels over navy, with no clock in it: what a contrast sweep reads.
	 * It caps white-equivalent and blue, the budget's units, not each channel: in the oxygen zone a bluer light of the same
	 * white-equivalent can pass its WCAG luminance by about 1%, which the sweep's gate margins take.
	 */
	bound(out: Float32Array): void
}

/** A grid of cell-centered nodes over the CSS size, with one cell past the far edges: node (i, j) sits at ((i + 0.5) h, (j + 0.5) h). */
interface Grid {
	columns: number
	rows: number
	h: number
	n: number
}

/** One plane wave of the sway. It is separable, so a wave costs two products per node: its factors along x are baked per column. */
interface Wave {
	ky: number
	omega: number
	phase: number
	/** Its displacement along x and y, per unit of the wave. */
	ax: number
	ay: number
	cosX: Float32Array
	sinX: Float32Array
}

/** The sway every octave rides on: a bounded curl warp, one field for the whole sky. */
interface Sway {
	/** The displacement of each node on the coarsest grid (reference px) for the time of the last `run`. */
	dx: Float32Array
	dy: Float32Array
	/** Sets the field time the next `run` is for. */
	begin(time: number): void
	run(): void
}

/** One level of a slab's pyramid: the warped rest position of its nodes, the sway read up to it and its octaves' sum. Empty where no octave needs it. */
interface Level {
	qx: Float32Array
	qy: Float32Array
	sx: Float32Array
	sy: Float32Array
	field: Float32Array
}

/** One of a moving octave's two phases at the field time begun: its weight, the two factors of the flow and where in the noise it reads. */
interface Phase {
	w: number
	fa: number
	fb: number
	nx: number
	ny: number
}

/** An octave of a slab as baked: what it needs per node, and its constants. */
interface Octave {
	/** Seconds between renewals. 0 holds the octave, moved only by the sway. */
	period: number
	level: Level
	amp: number
	/** The lattice: how warped reference px turn into noise coordinates, and its offset. */
	m00: number
	m01: number
	m10: number
	m11: number
	ox: number
	oy: number
	/** Radians per second at which the flow turns into its quadrature. */
	omega: number
	/** The flow through the warp, read up to the octave's level: the x and y of the flow and of its quadrature. Moving octaves only. */
	velAx: Float32Array
	velAy: Float32Array
	velBx: Float32Array
	velBy: Float32Array
	/** Where the envelope thins the octave: the nodes it reaches, and each node's weight. Only an octave with a `fade` has them. */
	list: Int32Array | null
	weight: Float32Array | null
	/** Entries to evaluate: the list's length, or the level's nodes. */
	count: number
	phases: readonly [Phase, Phase]
}

/** The keys NEBULA.body and NEBULA.mist share: a slab's octaves and the shape of its lattice. */
interface SlabLook {
	octaves: readonly NebulaOctave[]
	hurst: number
	axis: number
	gamma: number
	warp: readonly [number, number, number, number]
}

/** What one slab is made of: the body and the mist differ only in these. */
interface SlabSpec {
	table: NoiseTable
	look: SlabLook
	salt: number
	flowShare: number
	turn: number
	swayShare: number
	/** Thins an octave with a `fade` where it is small. None for a slab that has no such octave. */
	envelope: ((x: number, y: number) => number) | null
	/** How much a node counts in the mean taken off the flow. */
	flowWeight: (x: number, y: number) => number
}

/** What the slabs share. */
interface Shared {
	width: number
	height: number
	/** The screen's height: rows below it are the strip the scroll brings up, which the flow's mean leaves out. */
	shown: number
	unit: number
	spacing: number
	flow: NoiseTable
	flowQ: NoiseTable
	sway: Sway
	/** The evaluation's pieces: a slab appends its own. */
	pieces: (() => void)[]
}

/** A slab's log density on its finest level, and the setting of its time constants. */
interface Slab {
	g: Float32Array
	begin(time: number): void
}

/** The exponential from e^-24, EXP_SCALE entries per unit, so a node's light costs about 40 ns. */
const EXP_FROM = -24
const EXP_SCALE = 64
const EXP = Float64Array.from({ length: 32 * EXP_SCALE + 2 }, (_, i) => Math.exp(EXP_FROM + i / EXP_SCALE))

/** The budget's keep, (1 - exp(-v)) / v: the share of the light left where it reaches v times its ceiling. */
const KEEP_SCALE = 64
const KEEP = Float64Array.from({ length: 16 * KEEP_SCALE + 2 }, (_, i) => (i === 0 ? 1 : (1 - Math.exp(-i / KEEP_SCALE)) / (i / KEEP_SCALE)))

/** The stretch's factor is tabled over the fourth root of the light, FACTOR_SCALE entries per unit. */
const FACTOR_SCALE = 340

/** e^x, read from the table: linear between its entries, held at its two ends. */
function expOf(x: number): number {
	const f = (x - EXP_FROM) * EXP_SCALE
	if (f <= 0) return EXP[0] ?? 0
	const i = f | 0
	if (i >= EXP.length - 1) return EXP[EXP.length - 1] ?? 0
	const entry = EXP[i] ?? 0
	return entry + ((EXP[i + 1] ?? 0) - entry) * (f - i)
}

/** The budget's keep at v times the ceiling, read from the table: linear between its entries, 1 / v past its end. */
function keepOf(v: number): number {
	const f = v * KEEP_SCALE
	const i = f | 0
	if (i >= KEEP.length - 1) return 1 / v
	const entry = KEEP[i] ?? 0
	return entry + ((KEEP[i + 1] ?? 0) - entry) * (f - i)
}

/** A seeded stream of its own for one use, so changing one noise never reshuffles another. */
function stream(id: number): Random {
	return mulberry32(hashCell(id, 0, SKY_SEED ^ NEBULA.salt))
}

/** Linear mix: t = 0 gives `a`, t = 1 gives `b`. */
function mix(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

/** The nodes of a grid of spacing `h` over the CSS size. */
function gridOf(width: number, height: number, h: number): Grid {
	const columns = Math.ceil(width / h) + 1
	const rows = Math.ceil(height / h) + 1
	return { columns, rows, h, n: columns * rows }
}

/** Adds the cell-centered grid `from` (spacing 2h), read bilinearly, into `target` on the grid `to` (spacing h). */
function addUp(source: Float32Array, from: Grid, target: Float32Array, to: Grid): void {
	const { columns: sourceColumns, rows: sourceRows } = from
	for (let j = 0; j < to.rows; j++) {
		const fy = (j - 0.5) / 2
		const j0 = Math.max(0, Math.min(sourceRows - 2, Math.floor(fy)))
		const ty = Math.max(0, Math.min(1, fy - j0))
		const upper = j0 * sourceColumns
		const lower = upper + sourceColumns
		const row = j * to.columns
		for (let i = 0; i < to.columns; i++) {
			const fx = (i - 0.5) / 2
			const i0 = fx < 0 ? 0 : fx >= sourceColumns - 1 ? sourceColumns - 2 : Math.floor(fx)
			const tx = fx < 0 ? 0 : fx >= sourceColumns - 1 ? 1 : fx - i0
			const top = (source[upper + i0] ?? 0) + ((source[upper + i0 + 1] ?? 0) - (source[upper + i0] ?? 0)) * tx
			const bottom = (source[lower + i0] ?? 0) + ((source[lower + i0 + 1] ?? 0) - (source[lower + i0] ?? 0)) * tx
			target[row + i] = (target[row + i] ?? 0) + top + (bottom - top) * ty
		}
	}
}

/** A per-node array read bilinearly at a CSS position, held at the outermost nodes' values beyond them. */
function readNodes(nodes: Float32Array, grid: Grid, x: number, y: number): number {
	const { columns, rows, h } = grid
	const fx = x / h - 0.5
	const fy = y / h - 0.5
	const i0 = fx < 0 ? 0 : fx >= columns - 1 ? columns - 2 : Math.floor(fx)
	const j0 = fy < 0 ? 0 : fy >= rows - 1 ? rows - 2 : Math.floor(fy)
	const tx = fx < 0 ? 0 : fx >= columns - 1 ? 1 : fx - i0
	const ty = fy < 0 ? 0 : fy >= rows - 1 ? 1 : fy - j0
	const upper = j0 * columns + i0
	const lower = upper + columns
	const top = (nodes[upper] ?? 0) + ((nodes[upper + 1] ?? 0) - (nodes[upper] ?? 0)) * tx
	return top + ((nodes[lower] ?? 0) + ((nodes[lower + 1] ?? 0) - (nodes[lower] ?? 0)) * tx - top) * ty
}

/** Triangular noise over [0, 2), mean 1, for a pixel and channel. Stateless, so moving light only flips the pixels that cross it. */
function grainAt(i: number, j: number, channel: number): number {
	const h = hashCell(i, j, channel + 1)
	return ((h & 0xffff) + (h >>> 16)) / 65536
}

/**
 * The sway: plane waves, with a displacement bounded to about a nineteenth of each wave's length, on the coarsest grid.
 * Every octave of both slabs rides on it through its own warp.
 */
function createSway(grid: Grid, unit: number, random: Random): Sway {
	const { columns, rows, h, n } = grid
	const { lengths, modes, rate } = NEBULA.sway
	const waves: Wave[] = []
	for (const length of lengths) {
		const speed = NEBULA.sway.speed * (length / lengths[0]) ** (1 / 3)
		for (let m = 0; m < modes; m++) {
			const angle = (m + random()) * (Math.PI / modes)
			const k = ((2 * Math.PI) / length) * (0.8 + 0.4 * random())
			const amp = (speed * Math.SQRT2) / Math.sqrt(modes)
			const omega = ((2 * Math.PI * rate) / length) * speed * (0.8 + 0.4 * random()) * (random() < 0.5 ? -1 : 1)
			const phase = 2 * Math.PI * random()
			const kx = k * Math.cos(angle)
			const cosX = new Float32Array(columns)
			const sinX = new Float32Array(columns)
			for (let i = 0; i < columns; i++) {
				cosX[i] = Math.cos((kx * (i + 0.5) * h) / unit)
				sinX[i] = Math.sin((kx * (i + 0.5) * h) / unit)
			}
			waves.push({ ky: k * Math.sin(angle), omega, phase, ax: (amp * Math.sin(angle)) / omega, ay: (-amp * Math.cos(angle)) / omega, cosX, sinX })
		}
	}
	const dx = new Float32Array(n)
	const dy = new Float32Array(n)
	let time = 0
	return {
		dx,
		dy,
		begin(at) {
			time = at
		},
		run() {
			dx.fill(0)
			dy.fill(0)
			for (let w = 0; w < waves.length; w++) {
				const wave = waves[w]
				if (!wave) continue
				const { ky, ax, ay, cosX, sinX } = wave
				const theta = wave.phase + wave.omega * time
				for (let j = 0; j < rows; j++) {
					const a = (ky * (j + 0.5) * h) / unit + theta
					const rc = Math.cos(a)
					const rs = Math.sin(a)
					const row = j * columns
					for (let i = 0; i < columns; i++) {
						const v = (sinX[i] ?? 0) * rc + (cosX[i] ?? 0) * rs
						dx[row + i] = (dx[row + i] ?? 0) + ax * v
						dy[row + i] = (dy[row + i] ?? 0) + ay * v
					}
				}
			}
		},
	}
}

/**
 * A slab's log density, about unit variance, on a pyramid of three grids, so each octave is computed only as finely as it
 * needs. Whatever does not depend on time is baked here: the warped rest positions, the warp's Jacobian, the flow (on the
 * coarsest level, read up) and each octave's lattice. The slab appends its pieces to the evaluation and exposes its density
 * on the finest level.
 */
function createSlab(spec: SlabSpec, shared: Shared): Slab {
	const { table, salt, flowShare, turn, swayShare, envelope, flowWeight } = spec
	const { octaves, hurst, axis, gamma, warp } = spec.look
	const { width, height, shown, unit, spacing, flow, flowQ, sway, pieces } = shared
	const fine = gridOf(width, height, spacing)
	const middle = gridOf(width, height, spacing * 2)
	const coarse = gridOf(width, height, spacing * 4)
	const grids = [fine, middle, coarse] as const
	// Level 2 is always in use, then each octave's level, and level 1 whenever level 0 is
	const used: [boolean, boolean, boolean] = [false, false, true]
	for (const octave of octaves) used[octave.level] = true
	if (used[0]) used[1] = true

	const [warpAmp, warpLength, fineAmp, fineLength] = warp
	const wl = warpLength * unit
	const fl = fineLength * unit
	const warpX = (x: number, y: number): number =>
		warpAmp * unit * (noise2(table, x / wl + 5.2 + salt, y / wl + 1.3) + 0.5 * noise2(table, (x / wl) * 2.02 + 37, (y / wl) * 2.02 + 12 + salt)) +
		fineAmp * unit * noise2(table, x / fl + 3.1, y / fl + 8.2 + salt)
	const warpY = (x: number, y: number): number =>
		warpAmp * unit * (noise2(table, x / wl + 19.1 + salt, y / wl + 7.7) + 0.5 * noise2(table, (x / wl) * 2.02 + 51, (y / wl) * 2.02 + 3 + salt)) +
		fineAmp * unit * noise2(table, x / fl + 9.7, y / fl + 2.4 + salt)

	const bake = (grid: Grid, inUse: boolean): Level => {
		const size = inUse ? grid.n : 0
		const level: Level = { qx: new Float32Array(size), qy: new Float32Array(size), sx: new Float32Array(size), sy: new Float32Array(size), field: new Float32Array(size) }
		if (inUse) {
			for (let j = 0; j < grid.rows; j++) {
				for (let i = 0; i < grid.columns; i++) {
					const m = j * grid.columns + i
					const x = (i + 0.5) * grid.h
					const y = (j + 0.5) * grid.h
					level.qx[m] = x + warpX(x, y)
					level.qy[m] = y + warpY(x, y)
				}
			}
		}
		return level
	}
	const levels: readonly [Level, Level, Level] = [bake(fine, used[0]), bake(middle, used[1]), bake(coarse, true)]

	// The warp's Jacobian on the coarsest level, so a pattern fixed in warped space moves as asked on screen
	const jac = new Float32Array(coarse.n * 4)
	const eps = 2 * unit
	for (let j = 0; j < coarse.rows; j++) {
		for (let i = 0; i < coarse.columns; i++) {
			const m = j * coarse.columns + i
			const x = (i + 0.5) * coarse.h
			const y = (j + 0.5) * coarse.h
			const qx = levels[2].qx[m] ?? 0
			const qy = levels[2].qy[m] ?? 0
			jac[m * 4] = 1 + (warpX(x + eps, y) + x - qx) / eps
			jac[m * 4 + 1] = (warpX(x, y + eps) + x - qx) / eps
			jac[m * 4 + 2] = (warpY(x + eps, y) + y - qy) / eps
			jac[m * 4 + 3] = 1 + (warpY(x, y + eps) + y - qy) / eps
		}
	}

	// The flow is the curl of a stream function, scaled so the rms speed of each scale is its speed, in two quadratures so it
	// can turn slowly from one renewal to the next: four values per coarse node and scale, which each octave mixes by its sweep
	const { scales, speeds, turnPerOctave } = NEBULA.flow
	const curls = scales.map((scale, f) => {
		const out = new Float32Array(coarse.n * 4)
		const length = scale * unit
		const e = 0.02
		const k = (flowShare * (speeds[f] ?? 0) * unit) / (Math.SQRT2 * NOISE_GRADIENT * 2 * e)
		for (let j = 0; j < coarse.rows; j++) {
			for (let i = 0; i < coarse.columns; i++) {
				const m = (j * coarse.columns + i) * 4
				// Each scale, and each slab, reads its own place in the flow noise
				const px = ((i + 0.5) * coarse.h) / length + 11.3 * f + salt * 3
				const py = ((j + 0.5) * coarse.h) / length + 29.1 * f - salt * 3
				out[m] = k * (noise2(flow, px, py + e) - noise2(flow, px, py - e))
				out[m + 1] = -k * (noise2(flow, px + e, py) - noise2(flow, px - e, py))
				out[m + 2] = k * (noise2(flowQ, px, py + e) - noise2(flowQ, px, py - e))
				out[m + 3] = -k * (noise2(flowQ, px + e, py) - noise2(flowQ, px - e, py))
			}
		}
		return out
	})

	/** Values on the coarsest grid read up to a finer level. */
	const lift = (values: Float32Array, to: 0 | 1 | 2): Float32Array => {
		if (to === 2) return values
		const upMiddle = new Float32Array(middle.n)
		addUp(values, coarse, upMiddle, middle)
		if (to === 1) return upMiddle
		const upFine = new Float32Array(fine.n)
		addUp(upMiddle, middle, upFine, fine)
		return upFine
	}

	/** An octave's flow: its sweep of the scales, less their mean where the slab's light shows so nothing drifts, through the warp, up to its level. */
	const carry = (sweep: readonly number[], level: 0 | 1 | 2): [Float32Array, Float32Array, Float32Array, Float32Array] => {
		const raw = new Float32Array(coarse.n * 4)
		const mean = new Float64Array(4)
		let total = 0
		// The mean is taken over the screen's own rows and the one past its foot, so the strip below changes no flow on screen
		const shownRows = Math.min(coarse.rows, Math.ceil(shown / coarse.h) + 1)
		for (let j = 0; j < coarse.rows; j++) {
			for (let i = 0; i < coarse.columns; i++) {
				const m = j * coarse.columns + i
				const e = j < shownRows ? flowWeight((i + 0.5) * coarse.h, (j + 0.5) * coarse.h) : 0
				total += e
				for (let q = 0; q < 4; q++) {
					let v = 0
					for (let s = 0; s < curls.length; s++) v += (sweep[s] ?? 0) * (curls[s]?.[m * 4 + q] ?? 0)
					raw[m * 4 + q] = v
					mean[q] = (mean[q] ?? 0) + v * e
				}
			}
		}
		for (let q = 0; q < 4; q++) mean[q] = (mean[q] ?? 0) / total
		const velAx = new Float32Array(coarse.n)
		const velAy = new Float32Array(coarse.n)
		const velBx = new Float32Array(coarse.n)
		const velBy = new Float32Array(coarse.n)
		for (let m = 0; m < coarse.n; m++) {
			const ax = (raw[m * 4] ?? 0) - (mean[0] ?? 0)
			const ay = (raw[m * 4 + 1] ?? 0) - (mean[1] ?? 0)
			const bx = (raw[m * 4 + 2] ?? 0) - (mean[2] ?? 0)
			const by = (raw[m * 4 + 3] ?? 0) - (mean[3] ?? 0)
			const j00 = jac[m * 4] ?? 0
			const j01 = jac[m * 4 + 1] ?? 0
			const j10 = jac[m * 4 + 2] ?? 0
			const j11 = jac[m * 4 + 3] ?? 0
			velAx[m] = j00 * ax + j01 * ay
			velAy[m] = j10 * ax + j11 * ay
			velBx[m] = j00 * bx + j01 * by
			velBy[m] = j10 * bx + j11 * by
		}
		return [lift(velAx, level), lift(velAy, level), lift(velBx, level), lift(velBy, level)]
	}

	// Each octave: the lattice's rotation and scale, and for a moving one its flow and where the envelope thins it
	const amps = octaves.map((octave) => octave.lambda ** hurst)
	let variance = 0
	for (const a of amps) variance += a * a * NOISE_VARIANCE
	const norm = 1 / Math.sqrt(variance)
	const ca = Math.cos((axis * Math.PI) / 180)
	const sa = Math.sin((axis * Math.PI) / 180)
	const none = new Float32Array(0)
	let rc = 1
	let rs = 0
	const ops = octaves.map((octave, k): Octave => {
		const root = Math.sqrt(2 ** (gamma * k))
		const f = 1 / (octave.lambda * unit)
		const m00 = (rc * ca * f) / root + rs * sa * f * root
		const m01 = (rc * sa * f) / root - rs * ca * f * root
		const m10 = (rs * ca * f) / root - rc * sa * f * root
		const m11 = (rs * sa * f) / root + rc * ca * f * root
		const turned = 0.8 * rc - 0.6 * rs
		rs = 0.6 * rc + 0.8 * rs
		rc = turned
		const grid = grids[octave.level]
		let vel: readonly [Float32Array, Float32Array, Float32Array, Float32Array] = [none, none, none, none]
		let list: Int32Array | null = null
		let weight: Float32Array | null = null
		if (octave.period) {
			vel = carry(octave.sweep ?? [0, 0, 0], octave.level)
			if (octave.fade && envelope) {
				const [fadeFrom, fadeTo] = octave.fade
				const members: number[] = []
				weight = new Float32Array(grid.n)
				for (let j = 0; j < grid.rows; j++) {
					for (let i = 0; i < grid.columns; i++) {
						const v = smoothstep(fadeFrom, fadeTo, envelope((i + 0.5) * grid.h, (j + 0.5) * grid.h))
						if (v > 0) members.push(j * grid.columns + i)
						weight[j * grid.columns + i] = v
					}
				}
				list = Int32Array.from(members)
			}
		}
		return {
			period: octave.period,
			level: levels[octave.level],
			amp: (amps[k] ?? 0) * norm,
			m00,
			m01,
			m10,
			m11,
			// Each octave, and each slab, reads its own place in the noise
			ox: 31.7 * k + 7.1 + salt,
			oy: 11.3 * k + 3.7 - salt,
			omega: (2 * Math.PI) / (turn * (1 + turnPerOctave * k)),
			velAx: vel[0],
			velAy: vel[1],
			velBx: vel[2],
			velBy: vel[3],
			list,
			weight,
			count: list ? list.length : grid.n,
			phases: [
				{ w: 0, fa: 0, fb: 0, nx: 0, ny: 0 },
				{ w: 0, fa: 0, fb: 0, nx: 0, ny: 0 },
			],
		}
	})

	const out = new Float32Array(fine.n)
	const middleSum = new Float32Array(middle.n)

	/** The slab's share of the sway, through its warp, read up to the levels in use. */
	function swayIn(): void {
		const share = swayShare * unit
		const { sx, sy } = levels[2]
		for (let m = 0; m < coarse.n; m++) {
			const dx = sway.dx[m] ?? 0
			const dy = sway.dy[m] ?? 0
			sx[m] = ((jac[m * 4] ?? 0) * dx + (jac[m * 4 + 1] ?? 0) * dy) * share
			sy[m] = ((jac[m * 4 + 2] ?? 0) * dx + (jac[m * 4 + 3] ?? 0) * dy) * share
		}
		if (used[1]) {
			levels[1].sx.fill(0)
			levels[1].sy.fill(0)
			addUp(levels[2].sx, coarse, levels[1].sx, middle)
			addUp(levels[2].sy, coarse, levels[1].sy, middle)
		}
		if (used[0]) {
			levels[0].sx.fill(0)
			levels[0].sy.fill(0)
			addUp(levels[1].sx, middle, levels[0].sx, fine)
			addUp(levels[1].sy, middle, levels[0].sy, fine)
		}
	}

	/** Zeroes every level's sum, then adds the octaves held by the sway alone. */
	function held(): void {
		for (let l = 0; l < levels.length; l++) levels[l]?.field.fill(0)
		for (let k = 0; k < ops.length; k++) {
			const octave = ops[k]
			if (!octave || octave.period) continue
			const { qx, qy, sx, sy, field } = octave.level
			const { m00, m01, m10, m11, ox, oy, amp } = octave
			for (let m = 0; m < field.length; m++) {
				const x = (qx[m] ?? 0) - (sx[m] ?? 0)
				const y = (qy[m] ?? 0) - (sy[m] ?? 0)
				field[m] = (field[m] ?? 0) + amp * noise2(table, m00 * x + m01 * y + ox, m10 * x + m11 * y + oy)
			}
		}
	}

	/** Sets one phase of a moving octave for field time `time`: the weight, the flow frozen at the phase's middle and a fresh place in the noise for each renewal. */
	function setPhase(octave: Octave, phase: Phase, time: number, p: 0 | 1): void {
		const period = octave.period
		// Phase 0 peaks at time 0, P, 2P and so on, and phase 1 half a period later: cos² + sin² keeps the variance of log density
		const a = p === 0 ? time / period + 0.5 : time / period
		const c = Math.floor(a)
		const v = a - c - 0.5
		const tau = v * period
		const middleTime = p === 0 ? c * period : (c + 0.5) * period
		phase.w = Math.cos(Math.PI * v) * octave.amp
		phase.fa = Math.cos(octave.omega * middleTime) * tau
		phase.fb = Math.sin(octave.omega * middleTime) * tau
		phase.nx = octave.ox + ((c * 2 + p) * 37.77) % 256
		phase.ny = octave.oy + ((c * 2 + p) * 91.31) % 256
	}

	/**
	 * A piece of a moving octave: both its phases added at entries `from` to `to`, phase 0 first. The loop is the piece
	 * itself, reached only through `piece`, so V8 compiles it on its own and inlines noise2 into it: no number crosses a
	 * call in the loop. Keep the loop here: in a helper the piece calls, it would be inlined into the piece and leave too
	 * little of the piece's inlining budget for noise2, which would stay a call and box its numbers.
	 */
	function advance(octave: Octave, from: number, to: number): () => void {
		return () => {
			const { qx, qy, sx, sy, field } = octave.level
			const { m00, m01, m10, m11, velAx, velAy, velBx, velBy, list, weight, phases } = octave
			for (let p = 0; p < phases.length; p++) {
				const phase = phases[p]
				if (!phase || phase.w < 1e-4) continue
				const { w, fa, fb, nx, ny } = phase
				for (let q = from; q < to; q++) {
					const m = list ? (list[q] ?? 0) : q
					const x = (qx[m] ?? 0) - fa * (velAx[m] ?? 0) - fb * (velBx[m] ?? 0) - (sx[m] ?? 0)
					const y = (qy[m] ?? 0) - fa * (velAy[m] ?? 0) - fb * (velBy[m] ?? 0) - (sy[m] ?? 0)
					const value = w * noise2(table, m00 * x + m01 * y + nx, m10 * x + m11 * y + ny)
					field[m] = (field[m] ?? 0) + (weight ? value * (weight[m] ?? 0) : value)
				}
			}
		}
	}

	/** Adds the pyramid up: the density on the finest level. */
	function gather(): void {
		out.fill(0)
		if (used[0]) out.set(levels[0].field)
		middleSum.fill(0)
		if (used[1]) middleSum.set(levels[1].field)
		addUp(levels[2].field, coarse, middleSum, middle)
		addUp(middleSum, middle, out, fine)
	}

	// The evaluation's pieces for this slab, in a fixed order: an advance chunk covers half of `pieces.evals` entries, since each costs two evaluations
	pieces.push(swayIn, held)
	const per = Math.max(1, Math.floor(NEBULA.pieces.evals / 2))
	for (let k = 0; k < ops.length; k++) {
		const octave = ops[k]
		if (!octave || !octave.period) continue
		for (let from = 0; from < octave.count; from += per) pieces.push(advance(octave, from, Math.min(octave.count, from + per)))
	}
	pieces.push(gather)

	return {
		g: out,
		begin(time) {
			for (let k = 0; k < ops.length; k++) {
				const octave = ops[k]
				if (!octave || !octave.period) continue
				setPhase(octave, octave.phases[0], time, 0)
				setPhase(octave, octave.phases[1], time, 1)
			}
		},
	}
}

/**
 * The strip of field below a screen `height` CSS px tall: as far up as the scroll carries the gas (NEBULA.depth) before its
 * light is out (SCENE.hazeGone), with the camera's longest lag on top.
 */
export function nebulaStrip(height: number): number {
	return Math.ceil(-scrollShift(NEBULA.depth.nearness, 0, (SCENE.hazeGone[1] + CAMERA.maxLag) * height))
}

/**
 * How far up the screen the nebula has moved (CSS px): its share (NEBULA.depth) of the scroll the camera has followed, so it
 * glides and settles with the stars, times `motion`, the motion level, so it hangs at its place over the hero wherever the
 * camera holds still (reduced motion) and eases there and back with the motion. The scroll the camera has followed is its
 * spring's place plus the scroll it skipped while motion was stopped: the page's scroll, once the spring settles.
 */
export function nebulaShift(camera: Camera, motion: number): number {
	return Math.max(0, -scrollShift(NEBULA.depth.nearness, 0, camera.scroll.value + camera.shift) * motion)
}

/**
 * The nebula's light for a CSS size, seeded and fixed like the star catalog: every visitor sees the same bytes at one clock.
 * The static fields, the baked flow and the lookup tables are built once here; `begin` and `piece` then evaluate the light at
 * a clock with no allocation.
 */
export function createNebula(width: number, height: number, tokens: SkyTokens): NebulaField {
	const { copy, ceiling, ionization, cavity, source, presence, stretch, dust } = NEBULA
	// The field covers the screen and the strip below it that the scroll brings up
	const below = nebulaStrip(height)
	const fieldHeight = height + below

	// Where the gas sits: CSS px per reference px, how many nodes, and the bitmap's size
	const land = smoothstep(NEBULA.aspect[0], NEBULA.aspect[1], width / height)
	const portraitUnit = Math.min(width, NEBULA.portrait.heightShare * height, NEBULA.portrait.maxWidth) / NEBULA.portrait.refWidth
	const landUnit = Math.min(height, NEBULA.unit.widthShare * width) / NEBULA.unit.refHeight
	const unit = Math.max(1e-3, mix(portraitUnit, landUnit, land))
	const narrow = width <= NARROW_MAX_WIDTH ? 1 : 0
	const spacing = Math.max(NEBULA.grid.floor[narrow], NEBULA.grid.step * unit, Math.sqrt((width * height) / NEBULA.grid.maxNodes))
	const scale = Math.min(1, Math.sqrt(HAZE_MAX_PIXELS / Math.max(1, width * height)))
	const bitmapWidth = Math.max(1, Math.round(width * scale))
	const bitmapHeight = Math.max(1, Math.round(fieldHeight * scale))
	const grid = gridOf(width, fieldHeight, spacing)
	const { columns, rows, n } = grid

	// The cluster and the lobes hang off the lower right corner, and slide right as a narrower window narrows the copy's room
	const retreat = Math.min(NEBULA.retreat.max, Math.max(0, NEBULA.retreat.from - width) * NEBULA.retreat.rate) * land
	const anchorX = width + retreat
	const anchorY = height
	const starX = anchorX + ionization.star[0] * unit
	const starY = anchorY + ionization.star[1] * unit

	// The copy's reach, measured: the tagline, then the paragraph, then the reading column near the foot, centered past `maxWidth`
	const copyShift = Math.max(0, (width - copy.maxWidth) / 2)
	const heroTop = Math.max(copy.heroTop[0], height / 2 - copy.heroTop[1])
	const copyRight = (y: number): number => {
		const v = y - heroTop
		return copyShift + mix(copy.ends[0], copy.ends[1], smoothstep(copy.turn[0], copy.turn[1], v)) + copy.slant * Math.max(0, v - copy.turn[1])
	}
	/** 1 in clear sky, 0 under the copy, over a slow ramp. */
	const clearAt = (x: number, y: number): number => smoothstep(0, 1, (x - copyRight(y) + copy.lead) / copy.ramp)
	/** The O++ zone: it ends with distance from the cluster and never reaches under the copy. */
	const zoneAt = (x: number, y: number): number => (1 - smoothstep(ionization.zone[0], ionization.zone[1], Math.hypot(x - starX, y - starY) / unit)) * clearAt(x, y)
	const lobes: readonly NebulaLobe[] = NEBULA.body.lobes
	const lobeTail = NEBULA.body.lobeTail
	/** Where the body has gas: soft lobes with long tails that merge. */
	const lobesAt = (x: number, y: number): number => {
		let none = 1
		for (const lobe of lobes) {
			const du = (x - (lobe.left ? lobe.at[0] * unit : anchorX + lobe.at[0] * unit)) / (lobe.radius[0] * unit)
			const dv = (y - (anchorY + lobe.at[1] * unit)) / (lobe.radius[1] * unit)
			none *= 1 - lobe.weight * (1 + (du * du + dv * dv) / (2 * lobeTail)) ** -lobeTail
		}
		return 1 - none
	}

	// What does not move, one value per node
	const lnBody = new Float32Array(n)
	const spread = new Float32Array(n)
	const lnGeom = new Float32Array(n)
	const lnMist = new Float32Array(n)
	const sigmaMist = new Float32Array(n)
	const budget = new Float32Array(n)
	const zone = new Float32Array(n)
	const fade = new Float32Array(n)
	const pedestal = new Float32Array(n)
	const pedestalGreen = new Float32Array(n)
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < columns; i++) {
			const m = j * columns + i
			const x = (i + 0.5) * spacing
			const y = (j + 0.5) * spacing
			const lobesHere = lobesAt(x, y)
			// A hollow over the comet's stage: the body keeps 1 - depth at its middle, the mist half of that loss
			const cd = Math.hypot(x - COMET.anchor[0] * width, y - COMET.anchor[1] * height) / (cavity.radius * unit)
			const hollow = cavity.depth * Math.exp(-0.5 * cd * cd)
			// Gas behind the copy keeps only a share of its density, so the light falls with the budget's slow ramp and the budget rarely shapes the gas
			const clear = clearAt(x, y)
			lnBody[m] = Math.log(Math.max(1e-6, lobesHere * (1 - hollow) * mix(NEBULA.body.toward[narrow], 1, clear)))
			spread[m] = mix(NEBULA.body.sigmaOut, NEBULA.body.sigma, smoothstep(0, 1, lobesHere / NEBULA.body.sigmaAt))
			lnGeom[m] = -2 * Math.log(Math.max(1, Math.hypot(x - starX, y - starY) / unit) / ionization.r0)
			// Diffuse gas everywhere, thinner and flatter under the copy: the copy reads first
			lnMist[m] = Math.log(NEBULA.mist.level * mix(NEBULA.mist.underCopy, 1, clear) * (1 - 0.5 * hollow))
			sigmaMist[m] = mix(NEBULA.mist.sigmaCopy, NEBULA.mist.sigma, clear)
			// The reading column holds less, least at its foot: it scrolls over the lower sky while the level is still high
			const inColumn = 1 - smoothstep(width / 2 + ceiling.columnEdge, width / 2 + ceiling.columnEdge + ceiling.columnRamp * unit, x)
			const rowHeld = mix(ceiling.column, ceiling.foot, smoothstep(ceiling.footRows[0] * height, ceiling.footRows[1] * height, y))
			budget[m] = mix(ceiling.mist, mix(ceiling.clear, rowHeld, inColumn), clear)
			// Oxygen only inside its zone and never under copy, so the mist there is pure card-3 and its green is exactly 0
			const zoneHere = zoneAt(x, y)
			zone[m] = zoneHere
			const fadeHere = smoothstep(HAZE_TOP_FADE[0], HAZE_TOP_FADE[1], y)
			fade[m] = fadeHere
			pedestal[m] = NEBULA.grain * HAZE_BRIGHT * fadeHere
			pedestalGreen[m] = NEBULA.grain * HAZE_BRIGHT * fadeHere * zoneHere
		}
	}

	// The noises, each from its own stream, and the two slabs on one flow and one sway
	const bodyTable = createNoise(stream(NEBULA.streams.body))
	const mistTable = createNoise(stream(NEBULA.streams.mist))
	const flowTable = createNoise(stream(NEBULA.streams.flow))
	const flowQ = quadrature(flowTable)
	const sway = createSway(gridOf(width, fieldHeight, spacing * 4), unit, stream(NEBULA.streams.sway))
	const pieceList: (() => void)[] = [() => sway.run()]
	const shared: Shared = { width, height: fieldHeight, shown: height, unit, spacing, flow: flowTable, flowQ, sway, pieces: pieceList }
	const bodySlab = createSlab(
		{
			table: bodyTable,
			look: NEBULA.body,
			salt: 0,
			flowShare: 1,
			turn: NEBULA.flow.turn,
			swayShare: 1,
			envelope: lobesAt,
			// The mean taken off the flow follows the light, which goes as density squared, and most of what shows as motion is in the oxygen zone
			flowWeight: (x, y) => lobesAt(x, y) ** 2 * mix(NEBULA.body.flowWeightClear, 1, zoneAt(x, y)),
		},
		shared
	)
	const mistSlab = createSlab(
		{
			table: mistTable,
			look: NEBULA.mist,
			salt: 13.7,
			flowShare: NEBULA.mist.flowShare,
			turn: NEBULA.flow.turn * NEBULA.mist.turnShare,
			swayShare: NEBULA.mist.swayShare,
			envelope: null,
			flowWeight: () => 1,
		},
		shared
	)

	// The sources, as levels over navy, from the tokens: hydrogen (h), hydrogen leaning toward card-2 near the cluster (n) and [O III] (o)
	const hydrogen = source.hydrogen * presence
	const nearGas = mixRgb(tokens.card3, tokens.card2, source.scatter)
	const oxygenGas = mixRgb(tokens.card2, tokens.green, source.oxygenMix)
	const oxygen = source.oxygen * presence
	const hR = tokens.card3[0] * hydrogen
	const hG = tokens.card3[1] * hydrogen
	const hB = tokens.card3[2] * hydrogen
	const nR = nearGas[0] * hydrogen
	const nG = nearGas[1] * hydrogen
	const nB = nearGas[2] * hydrogen
	const oR = oxygenGas[0] * oxygen
	const oG = oxygenGas[1] * oxygen
	const oB = oxygenGas[2] * oxygen
	const [wR, wG, wB] = lightWeights(tokens.navy, tokens.white)

	// Lupton's asinh stretch, as one factor shared by the three channels so the hue holds
	const refAsinh = Math.asinh(stretch.alpha * stretch.ref)
	const factors = Float64Array.from({ length: 6 * FACTOR_SCALE + 2 }, (_, i) => {
		const u = i / FACTOR_SCALE
		const light = u * u * u * u
		return light > 1e-9 ? Math.asinh(stretch.alpha * light) / (light * refAsinh) : stretch.alpha / refAsinh
	})
	const factorOf = (light: number): number => {
		const f = Math.sqrt(Math.sqrt(light)) * FACTOR_SCALE
		const i = f | 0
		if (i >= factors.length - 1) return Math.asinh(stretch.alpha * light) / (light * refAsinh)
		const entry = factors[i] ?? 0
		return entry + ((factors[i + 1] ?? 0) - entry) * (f - i)
	}

	const gBody = bodySlab.g
	const gMist = mistSlab.g
	let target: Float32Array = new Float32Array(0)
	/** Shades node rows `fromRow` to `toRow` into the state under evaluation. */
	function shade(fromRow: number, toRow: number): void {
		for (let m = fromRow * columns; m < toRow * columns; m++) {
			const bodyLog = (lnBody[m] ?? 0) + (spread[m] ?? 0) * (gBody[m] ?? 0)
			const mistColumn = expOf((lnMist[m] ?? 0) + (sigmaMist[m] ?? 0) * (gMist[m] ?? 0))
			const mistEmission = mistColumn * mistColumn
			// Radiative transfer through the two slabs: the front one emits, and its dust takes light from the back one
			const bodyEmission = expOf(2 * bodyLog - dust * mistColumn)
			const z = zone[m] ?? 0
			// Ionization, ended by the zone
			const oxygenShare = z > 0 ? z * smoothstep(0, 1, ((lnGeom[m] ?? 0) - ionization.cn * bodyLog - ionization.from) / ionization.span) : 0
			const factor = factorOf(mistEmission + bodyEmission)
			// bound restates this color mix at its greenest (oxygen share z, no mist, the same lean toward card-2): change the two
			// together, or a sweep of bound() stops covering all time
			const hydrogenShare = 1 - oxygenShare
			const red = factor * (mistEmission * hR + bodyEmission * (oxygenShare * oR + hydrogenShare * (hR + (nR - hR) * z)))
			// The mist has no green: card-3 has none, and under the copy z is 0
			const green = factor * bodyEmission * (oxygenShare * oG + hydrogenShare * (hG + (nG - hG) * z))
			const blue = factor * (mistEmission * hB + bodyEmission * (oxygenShare * oB + hydrogenShare * (hB + (nB - hB) * z)))
			const white = wR * red + wG * green + wB * blue
			// The budget: white stays under its ceiling and blue under its own limit, by algebra, at any clock
			const kept = keepOf(Math.max(white / (budget[m] ?? 1), blue / ceiling.blue)) * (fade[m] ?? 0)
			const k = m * 3
			target[k] = red * kept
			target[k + 1] = green * kept
			target[k + 2] = blue * kept
		}
	}
	const shadeRows = Math.ceil(rows / NEBULA.pieces.shadeBlocks)
	for (let from = 0; from < rows; from += shadeRows) {
		const first = from
		const last = Math.min(rows, from + shadeRows)
		pieceList.push(() => shade(first, last))
	}

	return {
		columns,
		rows,
		spacing,
		width: bitmapWidth,
		height: bitmapHeight,
		scale,
		screenRows: Math.min(bitmapHeight, Math.max(1, Math.round(height * scale))),
		below,
		pieces: pieceList.length,
		begin(clock, into) {
			target = into
			const time = NEBULA.start + clock * NEBULA.speed * NEBULA.gasRate[narrow]
			sway.begin(time)
			bodySlab.begin(time)
			mistSlab.begin(time)
		},
		piece(index) {
			pieceList[index]?.()
		},
		bytes(from, to, share, out) {
			for (let m = 0; m < n; m++) {
				const k = m * 3
				const q = m * 4
				const red = from[k] ?? 0
				const green = from[k + 1] ?? 0
				const blue = from[k + 2] ?? 0
				out[q] = (red + ((to[k] ?? 0) - red) * share) * HAZE_BRIGHT - (pedestal[m] ?? 0)
				out[q + 1] = (green + ((to[k + 1] ?? 0) - green) * share) * HAZE_BRIGHT - (pedestalGreen[m] ?? 0)
				out[q + 2] = (blue + ((to[k + 2] ?? 0) - blue) * share) * HAZE_BRIGHT - (pedestal[m] ?? 0)
				out[q + 3] = 255
			}
		},
		grain(out) {
			const amplitude = NEBULA.grain * HAZE_BRIGHT
			for (let j = 0; j < bitmapHeight; j++) {
				const y = (j + 0.5) / scale
				const f = smoothstep(HAZE_TOP_FADE[0], HAZE_TOP_FADE[1], y)
				for (let i = 0; i < bitmapWidth; i++) {
					const q = (j * bitmapWidth + i) * 4
					const z = readNodes(zone, grid, (i + 0.5) / scale, y)
					out[q] = amplitude * f * grainAt(i, j, 0)
					out[q + 1] = z > 0 ? amplitude * f * z * grainAt(i, j, 1) : 0
					out[q + 2] = amplitude * f * grainAt(i, j, 2)
					out[q + 3] = 255
				}
			}
		},
		bound(out) {
			for (let m = 0; m < n; m++) {
				// The most light a node can hold: its budget, in the greenest mix its zone allows (oxygen share z, no mist), the
				// least blue per unit of white. shade's color mix, restated: the two change together
				const z = zone[m] ?? 0
				const red = z * oR + (1 - z) * (hR + (nR - hR) * z)
				const green = z * oG + (1 - z) * (hG + (nG - hG) * z)
				const blue = z * oB + (1 - z) * (hB + (nB - hB) * z)
				const white = wR * red + wG * green + wB * blue
				const keep = Math.min((budget[m] ?? 0) / white, ceiling.blue / blue) * (fade[m] ?? 0)
				out[m * 3] = red * keep
				out[m * 3 + 1] = green * keep
				out[m * 3 + 2] = blue * keep
			}
		},
	}
}
