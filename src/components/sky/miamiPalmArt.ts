import { PALMS, SKYLINE } from '@/lib/sky/miamiConfig'
import type { MiamiStage } from '@/lib/sky/miamiStage'
import type { PalmPose, WindPalm } from '@/lib/sky/miamiWind'
import { hashCell } from '@/lib/sky/random'
import { smoothstep } from '@/lib/sky/scene'

/** What a frond is drawn from: the palm tunables of `PALMS`, gathered so a different look can be passed in as one object. */
export interface FrondArt {
	/** Degrees either side of straight up that the fan of fronds covers. */
	spread: number
	/** A frond's length as a seeded share of its palm's: the range. */
	length: readonly [number, number]
	/** A frond's length by its angle: the share at the top, the share it gains toward the sides, and how fast it gains it. */
	shape: readonly [number, number, number]
	/** A frond's droop by its angle: the least, the gain toward the sides, the power of the gain, and the seeded spread. */
	droop: readonly [number, number, number, number]
	/** How many droop shapes are baked. */
	variants: number
	/** Where a frond is split into its inner and outer sprite, as a share of its length. */
	hinge: number
	/** The midrib's width at the foot, px. */
	midrib: number
	/** The depth of the solid band under the midrib at its deepest, as a share of the frond's length. */
	core: number
	/** How broad a frond's foot is, as a share of its length: the feet overlap where the fronds meet, and make the crown's heart solid. */
	hub: number
	/** The longest leaflet as a share of the frond's length. */
	leafLength: number
	/** The leaflets' angle off the midrib at the foot of the frond and at its tip, degrees. */
	leafAngle: readonly [number, number]
	/** How far a leaflet's end is pulled toward the hanging side, as a share of its length. */
	leafSag: number
	/** A leaflet's width at its root and at its tip, px. */
	leafWidth: readonly [number, number]
	/** Leaflets along each side of the midrib. */
	leaflets: number
	/** Where the leaflets begin along the frond, as a share of its length: the foot is a bare stalk. */
	leafFrom: number
}

/** How a crown is put together from its fronds. */
export interface CrownArt {
	/** The fewest and most clumps the fronds gather into. */
	clusters: readonly [number, number]
	/** How far a frond strays from its place, as a share of the even spacing. */
	jitter: number
	/** How many times wider the space between two clumps is than the space between two fronds inside one. */
	clump: number
	/** The short fronds behind the crown that make its solid heart: how many, their length as a share of a frond's, and how much heavier than a frond they are (wider leaflets, a deeper band). */
	back: { count: readonly [number, number]; length: number; weight: number }
	/** How much longer and flatter the fronds that point nearest to level run downwind, and how much shorter and fuller upwind, as a share. */
	stream: number
	/** How much shorter the oldest fronds, the ones that hang, are than the ones that arch out, as a share: their tips are broken and dry, and the crown stays wider than it is tall. */
	aged: number
	/** The knot at the crown, as a share of a frond's length. */
	knot: number
}

/** Everything that sets how a palm looks: how a frond is drawn and how a crown is laid out. */
export interface PalmArt {
	frond: FrondArt
	layout: CrownArt
}

/** The palm's art as the config has it. */
export const PALM_ART: PalmArt = { frond: PALMS.frond, layout: PALMS.layout }

const TAU = Math.PI * 2
const RADIANS = Math.PI / 180

/** Salts that keep each seeded quantity's draws apart from the others'. */
const CLUSTER_SALT = 0x636c7573
const SIZE_SALT = 0x73697a65
const STRAY_SALT = 0x73747261
const LENGTH_SALT = 0x6c656e67
const DROOP_SALT = 0x64726f6f
const BACK_SALT = 0x6261636b
const LEAF_SALT = 0x6c656166
const KNOT_SALT = 0x6b6e6f74

/** How far below the page's end a trunk's foot stands, so the key can cover it. */
const FOOT_Z = -40

/** The angle from straight up, in degrees, at which two of the short fronds behind a crown hang around the trunk's top, as the dead fronds of a real palm do. */
const SKIRT_AT = 150

/** The share of the fan's half-width beyond which a frond counts as old and starts to lose its length. */
const AGED_FROM = 0.7

/** The angle from straight up, in degrees, at which the wind streams a frond most, and how wide that reach is: the fronds that point nearest to level. */
const STREAM_AT = 85
const STREAM_WIDTH = 42

/** The droop shapes the short fronds behind a crown choose from: they are drawn whole, so only the first few are baked. */
const BACK_VARIANTS = 3

/** Px of overlap where a hinged frond's two sprites meet, so a bend of a few degrees opens no gap under the solid band. */
const HINGE_OVERLAP = 5

/** Samples along a midrib, for its edges and for its arc length (four times as many). */
const RIB_STEPS = 32

/** The share of a frond's length over which its broad foot narrows to the midrib. */
const HUB_REACH = 0.24

/** Px of empty margin around a sprite, so its edge pixels are fully antialiased. */
const SPRITE_PAD = 2

/** A uniform number in [0, 1) from a seed, an index and a salt, the same every time. */
function unit(seed: number, index: number, salt: number): number {
	return hashCell(seed, index, salt) / 4294967296
}

/** The value `share` of the way from the first of `range` to the second. */
function along(range: readonly [number, number], share: number): number {
	return range[0] + (range[1] - range[0]) * share
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value))
}

/** One palm where the stage puts it: CSS px from the canvas's left, and z above the page's end. */
export interface PlacedPalm {
	/** Its place in the width class's list: the seed follows it, so a palm keeps its look when another comes or goes. */
	index: number
	crownX: number
	crownZ: number
	baseX: number
	baseZ: number
	/** How far the trunk's control point stands to the right of the straight line from foot to crown, px. */
	bow: number
	/** The trunk's width at its foot and at the crown, px. */
	trunk: readonly [number, number]
	/** The length of a frond, px. */
	frond: number
	fronds: number
	set: 'large' | 'small'
	seed: number
	/** The trunk's length from foot to crown, px. */
	length: number
}

/**
 * The palms of a stage. A crown stands at its share of the width and its height in warm bands above the waterline, held at least
 * `onScreen` of a frond's length under the top of the canvas, so a short screen keeps it in view. A frond is the listed one
 * (times the canvas's height over `scale.per`, on wide screens) or `frondFromTrunk` of the trunk's length if that is more, which
 * keeps a crown from turning into a small tuft on a tall pole. Under `shortHeight` px only the shorter palm shows.
 */
export function placePalms(stage: MiamiStage): PlacedPalm[] {
	const list = stage.narrow ? PALMS.narrow : PALMS.wide
	const scale = stage.narrow ? 1 : clamp(stage.height / PALMS.scale.per, PALMS.scale.min, PALMS.scale.max)
	const short = !stage.narrow && stage.height < PALMS.shortHeight
	const placed: PlacedPalm[] = []
	list.forEach((entry, index) => {
		if (stage.width < entry.minWidth || (short && index !== 1)) return
		const baseX = entry.base * stage.width
		const crownX = entry.crown[0] * stage.width
		const listed = entry.frond * scale
		const wanted = stage.zWater + entry.crown[1] * stage.warmArt
		let crownZ = wanted
		let frond = listed
		// The crown's height depends on the frond and the frond on the trunk's length, so settle it in two passes
		for (let pass = 0; pass < 2; pass++) {
			frond = Math.max(listed, PALMS.frondFromTrunk * Math.hypot(crownX - baseX, crownZ - FOOT_Z))
			crownZ = Math.min(wanted, stage.height - PALMS.onScreen * frond)
		}
		placed.push({
			index,
			crownX,
			crownZ,
			baseX,
			baseZ: FOOT_Z,
			bow: entry.bow * scale,
			trunk: [entry.trunk[0] * scale, entry.trunk[1] * scale],
			frond,
			fronds: entry.fronds,
			set: entry.set,
			seed: hashCell(index, stage.narrow ? 1 : 0, PALMS.seed),
			length: Math.hypot(crownX - baseX, crownZ - FOOT_Z),
		})
	})
	return placed
}

/** One frond of a crown at rest. */
export interface FrondPlan {
	/** Degrees from straight up, downwind (right) positive. */
	angle: number
	/** Px from the crown to the frond's end along its own axis. */
	length: number
	/** Which droop shape draws it. */
	variant: number
	/** The side it hangs on: 1 for the right, -1 for the left, where the sprite is mirrored. */
	side: 1 | -1
}

/** A crown at rest: the hinged fronds from the left to the right, and the short rigid ones behind them. */
export interface CrownPlan {
	fronds: FrondPlan[]
	back: FrondPlan[]
}

/** The droop of the first and the last of the baked shapes. */
function droopRange(frond: FrondArt): readonly [number, number] {
	return [frond.droop[0] - frond.droop[3], frond.droop[0] + frond.droop[1] + frond.droop[3]]
}

/** The droop of baked shape `variant`: the shapes divide the droop's whole range evenly. */
export function variantDroop(frond: FrondArt, variant: number): number {
	return along(droopRange(frond), frond.variants > 1 ? variant / (frond.variants - 1) : 0)
}

/** The baked shape nearest a droop. */
function nearestVariant(frond: FrondArt, droop: number): number {
	const [low, high] = droopRange(frond)
	return clamp(Math.round(((droop - low) / (high - low)) * (frond.variants - 1)), 0, frond.variants - 1)
}

/**
 * How a palm's fronds are laid out, the same every time for a palm. An even fan reads as a hatched feather, so the fronds gather
 * into a few clumps with wide sky between them, each frond strays a little from its place, and the lengths and the droop differ. The
 * ones that stand up are the shortest, the ones that arch out the longest, and the oldest hang. Those on the downwind side stream
 * farther and flatter, and those on the upwind side press back over the crown. Behind them stand a few short, heavy fronds that
 * make the crown's heart solid.
 */
export function planCrown(palm: PlacedPalm, art: PalmArt = PALM_ART): CrownPlan {
	const { frond, layout } = art
	const roll = (index: number, salt: number) => unit(palm.seed, index, salt)
	const count = palm.fronds
	const clumps = layout.clusters[0] + Math.floor(roll(0, CLUSTER_SALT) * (layout.clusters[1] - layout.clusters[0] + 1))

	// Where the sky opens between clumps, as a share of the way along the fronds from the left. Two clumps part once, as likely on one
	// side as the other; three part twice, between the oldest fronds on each side and the ones that arch out above them
	const cuts: number[] = []
	if (clumps <= 2) cuts.push(roll(1, SIZE_SALT) < 0.5 ? 0.28 + 0.14 * roll(2, SIZE_SALT) : 0.58 + 0.14 * roll(2, SIZE_SALT))
	else cuts.push(0.22 + 0.12 * roll(1, SIZE_SALT), 0.62 + 0.16 * roll(2, SIZE_SALT))
	const gapAfter = new Set(cuts.map((share) => clamp(Math.round(count * share), 2, count - 2) - 1))

	// The spaces between neighboring fronds, in even steps: each strays by `jitter`, and one between clumps is `clump` times as wide
	const spaces: number[] = []
	for (let i = 0; i < count - 1; i++) spaces.push((1 + (roll(i, STRAY_SALT) - 0.5) * 2 * layout.jitter) * (gapAfter.has(i) ? layout.clump : 1))
	const total = spaces.reduce((sum, space) => sum + space, 0) || 1
	let covered = 0
	const angles = [-frond.spread]
	for (const space of spaces) {
		covered += space
		angles.push(-frond.spread + (2 * frond.spread * covered) / total)
	}

	const fronds: FrondPlan[] = angles.map((angle, i) => {
		const share = Math.abs(angle) / frond.spread
		const downwind = angle > 0
		// The fronds that point nearest to level are the ones the wind streams: downwind they run longer and flatter, upwind shorter and fuller
		const level = Math.exp(-(((Math.abs(angle) - STREAM_AT) / STREAM_WIDTH) ** 2))
		const reach = (downwind ? 1 + layout.stream * (0.25 + 0.75 * level) : 1 - layout.stream * 0.45 * level) * along(frond.length, roll(i, LENGTH_SALT))
		const droop = frond.droop[0] + frond.droop[1] * share ** frond.droop[2] + (roll(i, DROOP_SALT) - 0.5) * 2 * frond.droop[3]
		const flatter = downwind ? 1 - layout.stream * 1.4 * level : 1 + layout.stream * 0.4 * level
		const aged = 1 - layout.aged * smoothstep(AGED_FROM, 1, share)
		return {
			angle,
			length: palm.frond * reach * aged * (frond.shape[0] + frond.shape[1] * Math.min(1, share * frond.shape[2])),
			variant: nearestVariant(frond, droop * flatter),
			side: downwind ? 1 : -1,
		}
	})

	// The short fronds behind, one rigid sprite each: two hang around the trunk's top, and the rest stand in the widest gaps between the
	// front fronds, so the heart is solid where the clumps leave the middle open
	const behind = layout.back.count[0] + Math.floor(roll(0, BACK_SALT) * (layout.back.count[1] - layout.back.count[0] + 1))
	const openings = angles
		.slice(1)
		.map((angle, i) => ({ at: (angle + (angles[i] ?? angle)) / 2, width: angle - (angles[i] ?? angle) }))
		.sort((p, q) => q.width - p.width)
	const spots = [-SKIRT_AT, SKIRT_AT, ...openings.slice(0, Math.max(0, behind - 2)).map((opening) => opening.at)]
	const back: FrondPlan[] = spots.map((spot, i) => {
		const angle = spot + (roll(i, BACK_SALT + 1) - 0.5) * 10
		return {
			angle,
			length: palm.frond * layout.back.length * (0.85 + 0.3 * roll(i, BACK_SALT + 2)),
			variant: clamp(Math.round((Math.abs(angle) / SKIRT_AT) * (BACK_VARIANTS - 1)), 0, BACK_VARIANTS - 1),
			side: angle > 0 ? 1 : -1,
		}
	})
	return { fronds, back }
}

/** The wind's view of a palm and its crown. */
export function windPalm(palm: PlacedPalm, plan: CrownPlan, art: PalmArt = PALM_ART): WindPalm {
	const angles = [...plan.fronds.map((frond) => frond.angle), ...plan.back.map((frond) => frond.angle)]
	return { seed: palm.seed, height: palm.length, angles, hinged: plan.fronds.length, spread: art.frond.spread }
}

/** A frond's shape in its own px: +x along its chord from where it leaves the crown, +y toward the side it hangs on. */
export interface FrondShape {
	/** The midrib and the solid band under it, as flat lists of x, y. */
	rib: number[][]
	/** The leaflets, tapered fingers, as flat lists of x, y. */
	leaflets: number[][]
	/** Where the hinge lies. */
	hinge: { x: number; y: number }
}

/** Which part of a frond a sprite holds. */
export type FrondPart = 'whole' | 'inner' | 'outer'

/** The signed area of a flat polygon: positive turns one way, negative the other. */
function area(points: readonly number[]): number {
	let sum = 0
	for (let i = 0, n = points.length; i < n; i += 2) {
		const j = (i + 2) % n
		sum += (points[i] ?? 0) * (points[j + 1] ?? 0) - (points[j] ?? 0) * (points[i + 1] ?? 0)
	}
	return sum / 2
}

/** Adds a polygon to a list, turned the way the rest turn: shapes that overlap all turn one way, so filling them together unites them and never cuts one from another. */
function addPolygon(into: number[][], points: number[]): void {
	if (points.length < 6) return
	if (area(points) >= 0) {
		into.push(points)
		return
	}
	const turned: number[] = []
	for (let i = points.length - 2; i >= 0; i -= 2) turned.push(points[i] ?? 0, points[i + 1] ?? 0)
	into.push(turned)
}

/**
 * The shape of a frond of chord `length` px whose midrib sags by `droop`: the midrib, the solid band under it and the leaflets that
 * hang from both sides. `part` cuts it at the hinge: the inner part carries the leaflets that start before it and the midrib a little
 * past it, the outer part the rest, from a little before it. `weight` makes a frond heavier (wider leaflets, a deeper band), for the
 * short fronds that fill the crown's heart. `variant` seeds the leaflets' small differences, so each baked shape has a comb of its own.
 * Everything is a pure function of its arguments.
 */
export function frondShape(art: FrondArt, droop: number, length: number, variant: number, part: FrondPart, weight: number): FrondShape {
	const point = (s: number): [number, number] => [length * s, droop * length * s * s]
	const slope = (s: number): number => Math.atan(2 * droop * s)

	// Arc length along the midrib, to put the leaflets evenly along it
	const samples = RIB_STEPS * 4
	const arc: number[] = [0]
	let previous = point(0)
	for (let i = 1; i <= samples; i++) {
		const at = point(i / samples)
		arc.push((arc[i - 1] ?? 0) + Math.hypot(at[0] - previous[0], at[1] - previous[1]))
		previous = at
	}
	const total = arc[arc.length - 1] ?? 1
	const atArc = (share: number): number => {
		const target = share * total
		let low = 0
		let high = arc.length - 1
		while (high - low > 1) {
			const middle = (low + high) >> 1
			if ((arc[middle] ?? 0) < target) low = middle
			else high = middle
		}
		const span = (arc[high] ?? 0) - (arc[low] ?? 0) || 1
		return (low + (target - (arc[low] ?? 0)) / span) / samples
	}

	const hingeAt = art.hinge
	const overlap = HINGE_OVERLAP / length
	const from = part === 'outer' ? Math.max(0, hingeAt - overlap) : 0
	const to = part === 'inner' ? Math.min(1, hingeAt + overlap) : 1
	const rib: number[][] = []
	const hubAt = (s: number): number => art.hub * length * weight * Math.max(0, 1 - s / HUB_REACH) ** 1.5

	// The midrib: a tapered ribbon from `from` to `to`, broad at the foot
	const ribbon: number[] = []
	const back: number[] = []
	for (let i = 0; i <= RIB_STEPS; i++) {
		const s = from + ((to - from) * i) / RIB_STEPS
		const [x, y] = point(s)
		const a = slope(s)
		const half = (art.midrib * (1 - 0.5 * s) * weight + hubAt(s)) / 2
		ribbon.push(x + Math.sin(a) * half, y - Math.cos(a) * half)
		back.push(x - Math.sin(a) * half, y + Math.cos(a) * half)
	}
	for (let i = back.length - 2; i >= 0; i -= 2) ribbon.push(back[i] ?? 0, back[i + 1] ?? 0)
	addPolygon(rib, ribbon)

	// The solid band: a lens hanging under the midrib, deepest mid-frond and tapering to nothing at both ends
	const lens: number[] = []
	const under: number[] = []
	for (let i = 0; i <= RIB_STEPS; i++) {
		const s = from + ((to - from) * i) / RIB_STEPS
		const [x, y] = point(s)
		const a = slope(s)
		const depth = art.core * weight * length * Math.sin(Math.PI * clamp(s * 0.98 + 0.03, 0, 1)) ** 0.8 + hubAt(s)
		lens.push(x, y)
		under.push(x - Math.sin(a) * depth, y + Math.cos(a) * depth)
	}
	for (let i = under.length - 2; i >= 0; i -= 2) lens.push(under[i] ?? 0, under[i + 1] ?? 0)
	addPolygon(rib, lens)

	// The leaflets: tapered fingers from both sides, swept toward the tip and pulled toward the hanging side
	const leaflets: number[][] = []
	for (let side = -1; side <= 1; side += 2) {
		for (let k = 0; k < art.leaflets; k++) {
			const draw = (salt: number) => unit(variant * 2 + (side > 0 ? 1 : 0), k, LEAF_SALT + salt)
			const share = art.leafFrom + (1 - art.leafFrom) * ((k + 0.5 + (draw(0) - 0.5) * 0.7) / art.leaflets)
			const s = atArc(clamp(share, 0, 1))
			if (part === 'inner' ? s >= hingeAt : part === 'outer' ? s < hingeAt : false) continue
			const size = art.leafLength * length * Math.sin(Math.PI * s ** 0.7) * (0.82 + 0.36 * draw(1))
			if (size < 2.5) continue
			const [bx, by] = point(s)
			const swept = (art.leafAngle[1] + (art.leafAngle[0] - art.leafAngle[1]) * s + (draw(2) - 0.5) * 10) * RADIANS
			const direction = slope(s) + side * swept
			const toX = Math.cos(direction)
			const toY = Math.sin(direction) + art.leafSag
			const reach = Math.hypot(toX, toY)
			const ex = bx + (size * toX) / reach
			const ey = by + (size * toY) / reach
			const cx = bx + 0.55 * size * Math.cos(direction)
			const cy = by + 0.55 * size * Math.sin(direction)
			const w0 = art.leafWidth[0] * weight
			const w1 = art.leafWidth[1] * weight
			const edgeA: number[] = []
			const edgeB: number[] = []
			for (const t of [0, 0.33, 0.66, 0.92]) {
				const px = (1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * ex
				const py = (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ey
				const tx = 2 * (1 - t) * (cx - bx) + 2 * t * (ex - cx)
				const ty = 2 * (1 - t) * (cy - by) + 2 * t * (ey - cy)
				const norm = Math.hypot(tx, ty) || 1
				const half = along([w0, w1], t) / 2
				edgeA.push(px - (ty / norm) * half, py + (tx / norm) * half)
				edgeB.push(px + (ty / norm) * half, py - (tx / norm) * half)
			}
			const finger: number[] = [...edgeA, ex, ey]
			for (let i = edgeB.length - 2; i >= 0; i -= 2) finger.push(edgeB[i] ?? 0, edgeB[i + 1] ?? 0)
			addPolygon(leaflets, finger)
		}
	}
	const [hx, hy] = point(hingeAt)
	return { rib, leaflets, hinge: { x: hx, y: hy } }
}

/** A baked sprite and where it lies in its frond's own coordinates, CSS px. */
export interface PalmSprite {
	image: ImageBitmap
	left: number
	top: number
	width: number
	height: number
}

/** One droop shape of a frond, split at the hinge, and whole for a scene that has stepped down as far as it goes. */
export interface FrondSprites {
	inner: PalmSprite
	outer: PalmSprite
	/** The frond in one piece: one draw instead of two, where the bend at the hinge is no longer drawn. */
	whole: PalmSprite
	/** The hinge in the frond's own coordinates, CSS px. */
	hinge: { x: number; y: number }
}

/** The sprites for one size of frond. */
export interface PalmSet {
	/** The chord length these were baked for, CSS px: a frond of another length draws them scaled. */
	length: number
	variants: FrondSprites[]
	/** The short fronds behind a crown, whole, baked at `back.length` of `length`. */
	back: PalmSprite[]
}

/** The sprites of every set a stage's palms use, baked for one pixel ratio. */
export type PalmSprites = Partial<Record<'large' | 'small', PalmSet>>

/** Fills a shape in the near color on a canvas of its own at `dpr`, and hands it over as a bitmap. */
export function bakeShape(shape: FrondShape, dpr: number): PalmSprite {
	const polygons = [...shape.rib, ...shape.leaflets]
	let minX = Infinity
	let minY = Infinity
	let maxX = -Infinity
	let maxY = -Infinity
	const path = new Path2D()
	for (const polygon of polygons) {
		path.moveTo(polygon[0] ?? 0, polygon[1] ?? 0)
		for (let i = 0; i < polygon.length; i += 2) {
			const x = polygon[i] ?? 0
			const y = polygon[i + 1] ?? 0
			minX = Math.min(minX, x)
			maxX = Math.max(maxX, x)
			minY = Math.min(minY, y)
			maxY = Math.max(maxY, y)
			if (i > 0) path.lineTo(x, y)
		}
		path.closePath()
	}
	const left = Math.floor(minX) - SPRITE_PAD
	const top = Math.floor(minY) - SPRITE_PAD
	const width = Math.ceil(maxX) + SPRITE_PAD - left
	const height = Math.ceil(maxY) + SPRITE_PAD - top
	const canvas = new OffscreenCanvas(Math.max(1, Math.ceil(width * dpr)), Math.max(1, Math.ceil(height * dpr)))
	const ctx = canvas.getContext('2d')
	if (ctx) {
		ctx.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr)
		ctx.fillStyle = SKYLINE.near
		ctx.fill(path, 'nonzero')
	}
	const image = canvas.transferToImageBitmap()
	// An emptied canvas lets go of its memory at once, which keeps the page's canvas count down on Safari
	canvas.width = canvas.height = 0
	return { image, left, top, width, height }
}

/**
 * Bakes the sprites of every set the palms need, at device px for `dpr`, a sprite at a time so a build can stop between two. Each
 * set is baked for the first palm that uses it: the others draw its sprites scaled to their own frond. `keep` is told of each
 * bitmap as it is made, so a build that is abandoned part way can close them.
 */
export function* bakePalmSprites(palms: readonly PlacedPalm[], dpr: number, art: PalmArt = PALM_ART, keep?: (bitmap: ImageBitmap) => void): Generator<void, PalmSprites, undefined> {
	const baked: PalmSprites = {}
	const bake = (shape: FrondShape): PalmSprite => {
		const sprite = bakeShape(shape, dpr)
		keep?.(sprite.image)
		return sprite
	}
	for (const palm of palms) {
		if (baked[palm.set]) continue
		const set: PalmSet = { length: palm.frond, variants: [], back: [] }
		for (let variant = 0; variant < art.frond.variants; variant++) {
			const droop = variantDroop(art.frond, variant)
			const innerShape = frondShape(art.frond, droop, palm.frond, variant, 'inner', 1)
			const inner = bake(innerShape)
			yield
			const outer = bake(frondShape(art.frond, droop, palm.frond, variant, 'outer', 1))
			yield
			const whole = bake(frondShape(art.frond, droop, palm.frond, variant, 'whole', 1))
			set.variants.push({ inner, outer, whole, hinge: innerShape.hinge })
			yield
		}
		for (let variant = 0; variant < BACK_VARIANTS; variant++) {
			const droop = variantDroop(art.frond, variant)
			set.back.push(bake(frondShape(art.frond, droop, palm.frond * art.layout.back.length, variant, 'whole', art.layout.back.weight)))
			yield
		}
		baked[palm.set] = set
	}
	return baked
}

/** Frees every sprite's bitmap. */
export function closePalmSprites(sprites: PalmSprites): void {
	for (const set of [sprites.large, sprites.small]) {
		if (!set) continue
		for (const variant of set.variants) {
			variant.inner.image.close()
			variant.outer.image.close()
			variant.whole.image.close()
		}
		for (const back of set.back) back.image.close()
	}
}

/**
 * The trunk as a tapered polygon from its foot to the crown, in canvas px, as flat x, y pairs: down one side from the foot to the
 * crown and back up the other. The trunk is a quadratic curve whose control point stands `bow` px to the right of the straight line,
 * and it narrows from `widths[0]` to `widths[1]` as the 0.8 power of its length. The crown stands `sway` px downwind of where the
 * curve ends, and a point lower down moves by `sway` times its share of the trunk's length to the `power`, so the foot stays planted.
 * `out` is reused when it is long enough.
 */
export function trunkOutline(baseX: number, baseY: number, crownX: number, crownY: number, bow: number, widths: readonly [number, number], sway: number, power: number, samples: number, out: Float32Array): Float32Array {
	const need = (samples + 1) * 4
	const points = out.length >= need ? out : new Float32Array(need)
	const controlX = (baseX + crownX) / 2 + bow
	const controlY = (baseY + crownY) / 2
	const centerX = (s: number) => (1 - s) * (1 - s) * baseX + 2 * (1 - s) * s * controlX + s * s * crownX + sway * s ** power
	const centerY = (s: number) => (1 - s) * (1 - s) * baseY + 2 * (1 - s) * s * controlY + s * s * crownY
	for (let i = 0; i <= samples; i++) {
		const s = i / samples
		const dx = centerX(Math.min(1, s + 0.01)) - centerX(Math.max(0, s - 0.01))
		const dy = centerY(Math.min(1, s + 0.01)) - centerY(Math.max(0, s - 0.01))
		const norm = Math.hypot(dx, dy) || 1
		const half = (widths[0] + (widths[1] - widths[0]) * s ** 0.8) / 2
		const x = centerX(s)
		const y = centerY(s)
		points[i * 2] = x - (dy / norm) * half
		points[i * 2 + 1] = y + (dx / norm) * half
		const j = (2 * (samples + 1) - 1 - i) * 2
		points[j] = x + (dy / norm) * half
		points[j + 1] = y - (dx / norm) * half
	}
	return points
}

/** The knot at the crown: a lumpy disc of `radius` px around the origin, as flat x, y pairs, the same every time for a palm. */
export function knotOutline(palm: PlacedPalm, radius: number, out: Float32Array): Float32Array {
	const lumps = 9
	const points = out.length >= lumps * 2 ? out : new Float32Array(lumps * 2)
	for (let i = 0; i < lumps; i++) {
		const reach = radius * (0.88 + 0.24 * unit(palm.seed, i, KNOT_SALT))
		points[i * 2] = Math.cos((TAU * i) / lumps) * reach
		points[i * 2 + 1] = Math.sin((TAU * i) / lumps) * reach * 0.9
	}
	return points
}

/**
 * Sets the context's transform for a frond whose crown is at (`x`, `y`) device px, turned `degrees` from straight up (downwind
 * positive), drawn `scale` times its baked size. A frond on the left is the right-hand shape mirrored, so its droop stays down.
 * The six numbers it sets are left in `out`, for the outer part, which turns about the hinge from the same start.
 */
function setFrond(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, degrees: number, side: 1 | -1, scale: number, out: Float64Array): void {
	const turn = (side * degrees - 90) * RADIANS
	const cos = Math.cos(turn)
	const sin = Math.sin(turn)
	out[0] = side * scale * cos
	out[1] = scale * sin
	out[2] = -side * scale * sin
	out[3] = scale * cos
	out[4] = x
	out[5] = y
	ctx.setTransform(out[0], out[1], out[2], out[3], out[4], out[5])
}

/** The inner part's matrix of the frond being drawn, reused. */
const matrix = new Float64Array(6)

/**
 * Draws a crown: the short fronds behind it, then the hinged ones, each as its inner sprite and its outer sprite turned about the
 * hinge, in the near color. (`x`, `y`) is the crown in CSS px and `k` the device px to a CSS px. `tier` is how far the scene has stepped
 * down for a slow canvas: only at the first does the outer part shear with the flutter, and at the last each hinged frond is drawn in
 * one piece, which halves its draws and leaves its bend out. The trunk and the knot are the caller's, so they can be drawn under a
 * transform of their own. It leaves the context's transform set to the last frond's.
 */
export function drawCrown(ctx: OffscreenCanvasRenderingContext2D, sprites: PalmSprites, palm: PlacedPalm, plan: CrownPlan, pose: PalmPose, x: number, y: number, k: number, tier: number, art: PalmArt = PALM_ART): void {
	const set = sprites[palm.set]
	if (!set) return
	const rest = plan.fronds.length
	plan.back.forEach((frond, i) => {
		const sprite = set.back[frond.variant]
		if (!sprite) return
		setFrond(ctx, x * k, y * k, frond.angle + (pose.inner[rest + i] ?? 0) + pose.tilt, frond.side, (k * frond.length) / (set.length * art.layout.back.length), matrix)
		ctx.drawImage(sprite.image, sprite.left, sprite.top, sprite.width, sprite.height)
	})
	plan.fronds.forEach((frond, i) => {
		const variant = set.variants[frond.variant]
		if (!variant) return
		setFrond(ctx, x * k, y * k, frond.angle + (pose.inner[i] ?? 0) + pose.tilt, frond.side, (k * frond.length) / set.length, matrix)
		if (tier >= 2) {
			ctx.drawImage(variant.whole.image, variant.whole.left, variant.whole.top, variant.whole.width, variant.whole.height)
			return
		}
		ctx.drawImage(variant.inner.image, variant.inner.left, variant.inner.top, variant.inner.width, variant.inner.height)
		// The outer part turns about the hinge by the extra degrees the wind gives it, and shears by the flutter; a frond on the left is mirrored, so its turn is too
		const delta = (pose.outer[i] ?? 0) * frond.side * RADIANS
		const cos = Math.cos(delta)
		const sin = Math.sin(delta)
		const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = matrix
		const a2 = a * cos + c * sin
		const b2 = b * cos + d * sin
		const c2 = -a * sin + c * cos
		const d2 = -b * sin + d * cos
		const { x: hx, y: hy } = variant.hinge
		const shear = tier === 0 ? (pose.flutter[i] ?? 0) / Math.max(1, frond.length * (1 - art.frond.hinge)) : 0
		ctx.setTransform(a2 + c2 * shear, b2 + d2 * shear, c2, d2, e + a * hx + c * hy - (a2 * hx + c2 * hy) - c2 * shear * hx, f + b * hx + d * hy - (b2 * hx + d2 * hy) - d2 * shear * hx)
		ctx.drawImage(variant.outer.image, variant.outer.left, variant.outer.top, variant.outer.width, variant.outer.height)
	})
}
