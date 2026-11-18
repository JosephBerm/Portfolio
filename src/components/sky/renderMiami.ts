import { CLEAR_SKY_KEEPS, MIN_STAR_ALPHA } from '@/lib/sky/config'
import { BEACONS, BOAT, SKYLINE, STAGE, SUN, WATER, WIND, WING } from '@/lib/sky/miamiConfig'
import type { RailSide } from '@/lib/sky/miamiStage'
import { boatAt, columnReach, glintAt, rippleAlpha, rippleOffset, rowShift, type BoatPose, type Glint, type GlintField, type RowShift, type WaterRow } from '@/lib/sky/miamiWater'
import { createPalmPose, palmPose, shoreShift } from '@/lib/sky/miamiWind'
import type { QuietIndex } from '@/lib/sky/quietIndex'
import { smoothstep } from '@/lib/sky/scene'
import { releaseFade, type MiamiAssets, type MiamiImage, type MiamiWing } from './miamiAssets'
import { drawCrown, trunkOutline } from './miamiPalmArt'
import type { MiamiFrame } from './miamiRuntime'
import type { SkyFrame } from './renderSky'

/** CSS px of sky kept under the waterline: the water is drawn over them, so rounding the waterline to a whole device pixel never opens a gap. */
const WATER_OVERLAP = 2

/** CSS px over which a beacon fades out as it rises toward the copy, so none of its light comes within the sun's margin of the copy's lowest edge. */
const BEACON_FEATHER = 12

/** CSS px by which the key's fill runs past the canvas's edges, so no seam of antialiasing shows along them. */
const KEY_OVERHANG = 2

const TAU = Math.PI * 2
const RADIANS = Math.PI / 180

/** Where in its pulse beacon `n` starts, as a share of its cycle per place in the list: the golden section, so no two start together. */
const BEACON_START = 0.381966

/** Points along a trunk, for each side of it: a few fewer on a phone, where the trunk is short and narrow. */
const TRUNK_SAMPLES = { wide: 12, narrow: 8 } as const

/** The trunk's outline, kept from frame to frame so a frame makes no garbage. */
let trunkPoints: Float32Array = new Float32Array(0)

/** The pose the wind gives the palm being drawn, and where the boat is, reused so a frame makes no garbage. */
const pose = createPalmPose()
const sail: BoatPose = { x: 0, bow: 0, bob: 0, pitch: 0 }

/** What a row of the water and a glint are moved by or lit by, reused so a frame makes no garbage. */
const shift: RowShift = { dx: 0, dy: 0 }
const glint: Glint = { across: 0, depth: 0, alpha: 0, width: 0, height: 0 }
/** Two strips of the water drawn as one, where the scene has stepped down as far as it goes. */
const joined: WaterRow = { index: 0, top: 0, height: 0, depth: 0 }

/** The glitter's two fields, in the order they are drawn. */
const GLINT_FIELDS: readonly GlintField[] = ['still', 'live']

/** How many slots of the glitter a tier draws: the most at the first on a wide stage, `count.narrow` at the second and on a narrow stage, and `count.low` at the last. */
function glitterCount(tier: number, narrow: boolean): number {
	const { count } = WATER.glitter
	return tier >= 2 ? count.low : tier === 1 || narrow ? count.narrow : count.wide
}

/**
 * Puts the context back as the rest of the frame expects it after a draw threw part way: drawSky resets only the blend and
 * the alpha, so a transform or a smoothing setting left behind would bend or blur every star drawn after it. The scene is
 * marked failed, and the worker replaces the half-drawn frame with the plain sky.
 */
function recover(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame): void {
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.imageSmoothingEnabled = true
	ctx.globalCompositeOperation = 'source-over'
	ctx.globalAlpha = 1
	scene.failed = true
}

/**
 * The scene's ground, drawn right after the page's navy and before any star: the baked sky down to just under the waterline.
 * The sky is drawn without smoothing so its dither stays whole, and is placed by the page's end, so it moves with the page.
 * The water below the waterline is part of the scene's silhouettes, drawn over the stars and the sky's events. It leaves the
 * blend, the alpha and the smoothing as drawSky expects them.
 */
export function drawMiamiSky(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	if (scene.fade <= 0) return
	try {
		const { view, assets } = scene
		const { sky } = assets
		const k = frame.dpr
		// The image on the canvas, in device px: where its top is and how far it reaches
		const top = (view.end - sky.zTop) * k
		const extent = sky.rows * k
		const waterY = Math.round(view.horizonY * k)
		// The rows to draw: from the image's top, or the canvas's, down to just under the waterline
		const first = Math.max(0, Math.floor(top))
		const bottom = Math.min(frame.deviceHeight, waterY + Math.ceil(WATER_OVERLAP * k), Math.ceil(top + extent))
		ctx.globalAlpha = scene.fade
		const perPx = sky.image.height / extent
		const from = Math.max(0, (first - top) * perPx)
		const to = Math.min(sky.image.height, (bottom - top) * perPx)
		if (bottom > first && to > from) {
			ctx.imageSmoothingEnabled = false
			ctx.drawImage(sky.image, 0, from, sky.image.width, to - from, 0, first, frame.deviceWidth, bottom - first)
			ctx.imageSmoothingEnabled = true
		}
		ctx.globalAlpha = 1
	} catch {
		recover(ctx, scene)
	}
}

/** The clouds, locked to the page in height and drifting with the wind on the air's clock: each wraps round a span a little wider than the canvas, so it leaves and returns off screen. */
function drawClouds(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, wind, fade } = scene
	const k = frame.dpr
	ctx.globalAlpha = fade
	for (const cloud of assets.clouds) {
		const top = (view.end - cloud.z - cloud.height) * k
		if (top >= frame.deviceHeight || top + cloud.height * k <= 0) continue
		const span = frame.width + cloud.width + 40
		const left = ((((cloud.x * frame.width - cloud.width / 2 + cloud.drift * wind.airClock + cloud.width) % span) + span) % span) - cloud.width
		ctx.drawImage(cloud.image, left * k, top, cloud.width * k, cloud.height * k)
	}
}

/** A picture of light centered on (x, y) CSS px, `size` times its own size, drawn at `alpha`. */
function drawCentered(ctx: OffscreenCanvasRenderingContext2D, picture: MiamiImage, x: number, y: number, size: number, alpha: number, k: number): void {
	const width = picture.width * size * k
	const height = picture.height * size * k
	if (width < 1 || height < 1 || alpha <= 0) return
	ctx.globalAlpha = alpha
	ctx.drawImage(picture.image, x * k - width / 2, y * k - height / 2, width, height)
}

/**
 * How the sun's halo breathes at `clock`: its size swells and eases back by SUN.breath.amount over SUN.breath.period
 * seconds, as much as the level shows, and at level 0 it stands at its own size. The room the halo is cut to
 * (`haloScale`) keeps SUN.gateMargin px clear of the copy, which covers the swell.
 */
function breath(clock: number, level: number): number {
	return 1 + SUN.breath.amount * level * Math.sin((TAU * clock) / SUN.breath.period)
}

/** The sun: its halo's light, then its disc over it, both scaled by how far the sun has come in. The halo breathes. */
function drawSun(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, x: number, y: number): void {
	const { view, assets, fade } = scene
	const alpha = view.sunAlpha * fade
	if (alpha <= 0) return
	const k = frame.dpr
	ctx.globalCompositeOperation = 'lighter'
	drawCentered(ctx, assets.sun.halo, x, y, view.haloScale * breath(scene.clock, scene.level), alpha, k)
	ctx.globalCompositeOperation = 'source-over'
	drawCentered(ctx, assets.sun.disc, x, y, 1, alpha, k)
}

/** The light the sun wraps around the silhouettes beside it: the halo again, fainter, over what has been drawn since, breathing with it. */
function drawWrap(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, x: number, y: number): void {
	const { view, assets, fade } = scene
	ctx.globalCompositeOperation = 'lighter'
	drawCentered(ctx, assets.sun.halo, x, y, view.haloScale * breath(scene.clock, scene.level), SUN.wrap * view.sunAlpha * fade, frame.dpr)
	ctx.globalCompositeOperation = 'source-over'
}

/**
 * Beacon `index` of `count` at `clock`: it burns steadily at BEACONS.still and, as much as the level shows, swells to
 * BEACONS.peak and back in a soft pulse of its own. The periods are spread across BEACONS.period, so no two beacons share
 * one, and each starts at its own point of its pulse, so they never blink together.
 */
function beaconLight(index: number, count: number, clock: number, level: number): number {
	const [shortest, longest] = BEACONS.period
	const period = shortest + ((longest - shortest) * (index + 0.5)) / count
	const swell = Math.sin(Math.PI * (clock / period + index * BEACON_START)) ** 2
	return BEACONS.still + (BEACONS.peak - BEACONS.still) * level * swell
}

/**
 * The far shore's palm tops, each from its atlas cell through the near image's own transform (`a` and `d` device px a near-image px,
 * `top` where the near image's top row lands), sheared about the waterline, the image's bottom row, by how far the wind has moved its
 * crown. At the lowest tier they ease into their still pose as the light the step down took away fades (MiamiFrame.thin), and then
 * skip the wind. It leaves the transform at identity.
 */
function drawShore(target: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, a: number, d: number, top: number): void {
	const shore = scene.assets.shore
	if (!shore) return
	const bottom = scene.assets.near.image.height
	const level = scene.tier >= 2 ? scene.level * scene.thin : scene.level
	for (const palm of shore.palms) {
		const k = shoreShift(palm, scene.wind, scene.clock, level) / palm.top
		target.setTransform(a, 0, -a * k, d, a * k * bottom, top)
		target.drawImage(shore.atlas, palm.sx, palm.sy, palm.w, palm.h, palm.u, palm.v, palm.w, palm.h)
	}
	target.setTransform(1, 0, 0, 1, 0, 0)
}

/** The fade-in's layer, `width` by `height` device px, made on the assets the first frame that needs it; null where no 2D context comes, and then for the rest of that fade, which draws without it. */
function fadeLayer(assets: MiamiAssets, width: number, height: number): OffscreenCanvasRenderingContext2D | null {
	if (assets.fade === false) return null
	if (assets.fade && assets.fade.canvas.width === width && assets.fade.canvas.height === height) return assets.fade
	releaseFade(assets)
	assets.fade = new OffscreenCanvas(width, height).getContext('2d') ?? false
	return assets.fade || null
}

/**
 * The cities along the waterline: the far one, then the near one with the cranes and the low base, standing on the waterline
 * (sunk by their drops while the page is coming down, and covered by the water as they sink), the far shore's palm tops on it, and
 * the beacons on the tallest towers. While the scene fades in after a jump, the near city's band that holds the palm tops is composed
 * with them at full strength and faded in as one, so a palm top a tower hides never shows through the tower while both are half
 * faded. A picture baked for a stage of another width stretches over this one until the new one is built.
 */
function drawCities(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { view, assets, fade } = scene
	const k = frame.dpr
	const { far, near } = assets
	if (far && view.farAlpha > 0) {
		const height = far.height * k
		ctx.globalAlpha = fade * view.farAlpha
		ctx.drawImage(far.image, 0, waterY + Math.round(view.farDrop * k) - height, frame.deviceWidth, height)
	}
	ctx.globalAlpha = fade
	const nearBottom = waterY + Math.round(view.nearDrop * k)
	const nearHeight = Math.round(near.height * k)
	const nearTop = nearBottom - nearHeight
	const a = frame.deviceWidth / near.image.width
	const d = nearHeight / near.image.height
	const shore = assets.shore
	// The palm tops stand in the near image's lowest rows, which sink under the canvas through the descent: then none of them
	// is posed or drawn
	const shoreShows = shore !== null && nearTop + (near.image.height - shore.band) * d < frame.deviceHeight
	const layer = fade < 1 && shore && shoreShows ? fadeLayer(assets, near.image.width, shore.band) : null
	if (layer && shore) {
		// Above the band no palm top stands, so those rows fade in as they are; the band is composed first
		const above = near.image.height - shore.band
		ctx.drawImage(near.image, 0, 0, near.image.width, above, 0, nearTop, frame.deviceWidth, above * d)
		layer.globalCompositeOperation = 'copy'
		layer.drawImage(near.image, 0, above, near.image.width, shore.band, 0, 0, near.image.width, shore.band)
		layer.globalCompositeOperation = 'source-over'
		drawShore(layer, scene, 1, 1, -above)
		ctx.drawImage(layer.canvas, 0, nearTop + above * d, frame.deviceWidth, shore.band * d)
	} else {
		ctx.drawImage(near.image, 0, nearTop, frame.deviceWidth, nearHeight)
		if (shoreShows) drawShore(ctx, scene, a, d, nearTop)
	}
	// Beacons pulse, or burn steadily at their still level, and sink with their towers. A beacon is light on a dark tower, and the towers
	// climb against the page toward the copy as it comes down, so each fades out before its dot comes within the sun's margin of the
	// copy's lowest edge, and stays out above it, at the peak of its pulse too: none of its light is ever behind the copy
	const xs = frame.width / scene.stage.width
	const radius = assets.beacon.height / 2
	const ceiling = scene.stage.zButtonBottom - SUN.gateMargin
	for (let i = 0; i < near.beacons.length; i++) {
		const beacon = near.beacons[i]
		if (!beacon) continue
		const y = view.horizonY + view.nearDrop - beacon.z
		const room = ceiling - (view.end - y + radius)
		drawCentered(ctx, assets.beacon, beacon.x * xs, y, 1, beaconLight(i, near.beacons.length, scene.clock, scene.level) * fade * smoothstep(0, BEACON_FEATHER, room), k)
	}
}

/**
 * The water in strips a few device px tall that grow toward the viewer, cut from the base picture: each strip is shifted
 * sideways and in the picture's own rows by its own point in the waves' cycles, so no part of the water moves as one sheet. Where the
 * scene has stepped down as far as it goes, the strips are drawn in pairs, each pair as one on its first strip's wave, which halves
 * the draws. Where the strips end, under the page's end, the base's own rows go on and then its last row stretches to the bottom of
 * the canvas, so a pull past the end shows no gap.
 */
function drawWater(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { assets, stage, clock, level, fade } = scene
	const { water } = assets
	const { base } = water
	const margin = WATER.strips.margin
	// The strips are in the build's device px, and the canvas may have dropped to a lower ratio since
	const share = frame.dpr / assets.dpr
	const paired = scene.tier >= 2
	ctx.globalAlpha = fade
	let covered = 0
	for (let i = 0; i < water.rows.length; i += paired ? 2 : 1) {
		let row = water.rows[i]
		if (!row) break
		const second = paired ? water.rows[i + 1] : undefined
		if (second) {
			joined.index = row.index
			joined.top = row.top
			joined.height = row.height + second.height
			joined.depth = (row.depth + second.depth) / 2
			row = joined
		}
		const y0 = waterY + Math.round(row.top * share)
		const y1 = waterY + Math.round((row.top + row.height) * share)
		covered = row.top + row.height
		if (y1 <= 0 || y1 <= y0) continue
		if (y0 >= frame.deviceHeight) return
		rowShift(row, clock, level, scene.wind.sea, shift)
		// A source rect above the picture would paint nothing, and the first rows' shifts reach up
		ctx.drawImage(base.image, margin + shift.dx, Math.max(0, row.top / assets.dpr + shift.dy), stage.width, row.height / assets.dpr, 0, y0, frame.deviceWidth, y1 - y0)
	}
	const end = waterY + Math.round(covered * share)
	if (end >= frame.deviceHeight) return
	const deep = Math.round(STAGE.water.overscan * frame.dpr)
	ctx.drawImage(base.image, margin, covered / assets.dpr, stage.width, base.height - covered / assets.dpr, 0, end, frame.deviceWidth, deep)
	const below = end + deep
	if (below < frame.deviceHeight) ctx.drawImage(base.image, margin, base.height - 1, stage.width, 1, 0, below, frame.deviceWidth, frame.deviceHeight - below)
}

/**
 * The ripples: two layers of crests, each in eight bands from the waterline to the page's end, every band drifted with the wind by
 * its own offset and wrapped by drawing its slice again where the slice ends, whichever way the air has gone. The two layers trade light over each band's own life.
 * A band's slice reaches past its edges into its neighbours' rows, over which the two hand the crests from one to the other,
 * so no edge is a line across the water where one band's crests stop and the next one's start.
 */
function drawRipples(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { assets, wind, clock, level, fade } = scene
	const { ripples, slices, tileWidth } = assets.water
	const k = frame.dpr
	for (let layer = 0; layer < ripples.length; layer++) {
		const tile = ripples[layer]
		if (!tile) continue
		for (let b = 0; b < slices.length; b++) {
			const slice = slices[b]
			const alpha = rippleAlpha(b, layer, clock, level) * fade
			if (!slice || alpha < MIN_STAR_ALPHA) continue
			const y0 = waterY + Math.round(slice.from * k)
			const y1 = waterY + Math.round(slice.to * k)
			if (slice.to <= slice.from || y1 <= 0 || y0 >= frame.deviceHeight) continue
			ctx.globalAlpha = alpha
			let offset = rippleOffset(b, layer, wind.airClock) % tileWidth
			// A wind toward the left has taken the crests back past their start: the tiles run from the same place in the tile's span
			if (offset < 0) offset += tileWidth
			for (let x = offset > 0 ? offset - tileWidth : 0; x < frame.width; x += tileWidth) {
				ctx.drawImage(tile, 0, slice.top, tileWidth, slice.to - slice.from, x * k, y0, tileWidth * k, y1 - y0)
			}
		}
	}
}

/**
 * The glitter under the sun: a set number of slots by tier, each a short dash of light at a place and time of its own, added to
 * the water through the zones the stars keep clear of (quiet copy and, on a wide screen, reading copy), which take all of it
 * away inside their padding. At rest the field stands at its still clock. While the level eases, a glint can't move from one
 * place to another, so the frozen field fades out as the live one fades in and both are drawn; under the contrast preference
 * the rows at and below the footer take none. The slots a step down has just taken away are drawn on, fading with `thin`,
 * until it reaches 0.
 */
function drawGlitter(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, quiet: QuietIndex): void {
	const { view, assets, stage, clock, level, fade, tier, thin } = scene
	const open = view.glitterOpen * fade
	if (open <= 0) return
	const k = frame.dpr
	const sunX = stage.sunX * (frame.width / stage.width)
	const cell = assets.glitter
	const count = glitterCount(tier, stage.narrow)
	const slots = tier > 0 && thin > 0 ? glitterCount(tier - 1, stage.narrow) : count
	const footerY = view.end - stage.zFooterTop
	ctx.globalCompositeOperation = 'lighter'
	for (let slot = 0; slot < slots; slot++) {
		const stays = slot < count ? 1 : thin
		for (const field of GLINT_FIELDS) {
			// The frozen field is drawn until the motion has all the level, the live one from the first of it
			if (field === 'still' ? level >= 1 : level <= 0) continue
			glintAt(slot, clock, level, field, scene.wind.sea, glint)
			const light = glint.alpha * open * stays
			if (light < MIN_STAR_ALPHA) continue
			const x = sunX + glint.across * columnReach(glint.depth, stage.sunR)
			const y = view.horizonY + glint.depth * stage.zWater
			if (x < 0 || x > frame.width || y > frame.height || (stage.more && y >= footerY)) continue
			const kept = quiet.empty ? 1 : quiet.factor(x, y, CLEAR_SKY_KEEPS)
			if (light * kept < MIN_STAR_ALPHA) continue
			ctx.globalAlpha = light * kept
			const row = Math.min(cell.classes - 1, Math.floor(glint.depth * cell.classes))
			ctx.drawImage(cell.atlas, 0, row * cell.cellHeight, cell.cellWidth, cell.cellHeight, (x - glint.width / 2) * k, (y - glint.height / 2) * k, glint.width * k, glint.height * k)
		}
	}
	ctx.globalCompositeOperation = 'source-over'
}

/**
 * The boat on its crossing, with its wake behind it (added as light) and its dark reflection under it. The hull sinks and dips its bow
 * with the swell, turning about its foot at the waterline, and the wake stays on the water. While the boat waits out of sight to come
 * in again, nothing is drawn.
 */
function drawBoat(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, stage, fade, clock, level } = scene
	const { boat } = assets
	if (!boat || !boatAt(clock, level, frame.width, stage.boatLength, stage.narrow, scene.wind.sea, sail)) return
	const k = frame.dpr
	const footY = view.horizonY + BOAT.depth
	ctx.globalAlpha = fade
	ctx.globalCompositeOperation = 'lighter'
	ctx.drawImage(boat.wake.image, (sail.bow - boat.apex.x) * k, (footY - boat.apex.y) * k, boat.wake.width * k, boat.wake.height * k)
	ctx.globalCompositeOperation = 'source-over'
	const dip = sail.pitch * RADIANS
	const cos = Math.cos(dip)
	const sin = Math.sin(dip)
	ctx.setTransform(cos, sin, -sin, cos, sail.x * k, (footY + sail.bob) * k)
	ctx.drawImage(boat.hull.image, (-boat.hull.width / 2) * k, -boat.foot * k, boat.hull.width * k, boat.hull.height * k)
	ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/**
 * The strength a wing's part over the sky needs at this scroll. A screen row y shows the height `end - y`, since the sky
 * is locked to the page, and the sky shows behind the part's copy from its top row down to its bottom row, or down to the
 * row `hidden` where that is higher, below which it is behind the water or the towers. Each height counts with what it
 * needs times 1 - smoothstep(0, WING.soft, d), d being how far its row stands from showing there: the px it stands above
 * the copy's top row plus the px it stands below the last row the sky could show in, which add up where the towers stand
 * above the copy's top. d moves by at most a px a px of scroll, so the strength moves by at most 1.5 / WING.soft of the
 * most any height needs: it comes on before the sky that needs it shows behind the copy and goes after it has gone, and
 * never steps.
 */
function wingSkyNeed(wing: MiamiWing, end: number, hidden: number): number {
	const soft = WING.soft
	let most = 0
	for (const part of wing.parts) {
		const low = Math.min(part.bottom, hidden)
		const from = Math.max(0, Math.floor(end - Math.max(low, part.top) - soft))
		const to = Math.min(part.need.length - 1, Math.ceil(end - Math.min(low, part.top) + soft))
		for (let z = from; z <= to; z++) {
			const need = part.need[z] ?? 0
			if (need <= most) continue
			const y = end - z
			const counted = need * (1 - smoothstep(0, soft, Math.max(0, part.top - y) + Math.max(0, y - low)))
			if (counted > most) most = counted
		}
	}
	return most
}

/**
 * One side's wing, screen-fixed (WING): its field over the sky, from the baked sky's top down to the water's top or the
 * canvas's foot, as strong as the sky behind the rail's copy needs and drawn with the darken blend, so it only takes light
 * toward a color no darker than the page's navy and leaves what stands at or under it; and from the water's top down its
 * falloff across, stretched to the canvas's foot, coming on as the water climbs to the copy's last line. The two meet at
 * the water's first device row, under the low base's dark band. A field baked for another width keeps its place at its own
 * edge of the canvas.
 */
function drawWing(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, wing: MiamiWing | null, side: RailSide | null, on: number, left: boolean): void {
	const { view, stage, fade } = scene
	const shown = on * fade
	if (!wing || !side || shown <= 0) return
	const k = frame.dpr
	const scale = WING.scale
	const waterY = Math.max(0, Math.min(frame.deviceHeight, Math.round(view.horizonY * k)))
	// Device x of a field's first column: the left side's stays at the canvas's left edge, the right side's at its right edge
	const at = (x: number) => (left ? x * k : frame.deviceWidth - (stage.width - x) * k)
	// The sky behind the copy is what stands above the water and above the towers' bodies, which hide what is behind them
	const sky = wingSkyNeed(wing, view.end, Math.min(view.horizonY, view.horizonY + view.nearDrop - wing.cover)) * shown
	const y = Math.round(wing.y * k)
	// Above the baked sky's top is the night sky, the page's navy and its stars, which the copy needs nothing taken from
	const from = Math.max(y, Math.round((view.end - scene.assets.sky.zTop) * k))
	if (sky > 0 && waterY > from) {
		// The field's rows from there down to the water's first device row, or to its last
		const skip = (from - y) / (scale * k)
		const rows = Math.min(wing.sky.height, (waterY - y) / (scale * k)) - skip
		if (rows > 0) {
			ctx.globalAlpha = sky
			ctx.globalCompositeOperation = 'darken'
			ctx.drawImage(wing.sky, 0, skip, wing.sky.width, rows, at(wing.x), from, wing.sky.width * scale * k, rows * scale * k)
			ctx.globalCompositeOperation = 'source-over'
		}
	}
	const water = (stage.more ? WING.moreAlpha : WING.alpha) * (1 - smoothstep(side.bottom, side.bottom + WING.waterOn, view.horizonY)) * shown
	if (water > 0 && waterY < frame.deviceHeight) {
		ctx.globalAlpha = water
		ctx.drawImage(wing.water, 0, 0, wing.water.width, wing.water.height, at(wing.waterX), waterY, wing.water.width * scale * k, frame.deviceHeight - waterY)
	}
}

/**
 * Adds a polygon of `count` flat x, y pairs, moved by (x, y), to the path being built, walked from its last point back to its first where
 * `backwards` is set: polygons that overlap in one fill join up only where they turn the same way, and cut a hole where they turn
 * opposite ways.
 */
function addPolygon(ctx: OffscreenCanvasRenderingContext2D, points: Float32Array, count: number, x: number, y: number, backwards = false): void {
	const first = backwards ? count - 1 : 0
	ctx.moveTo(x + (points[first * 2] ?? 0), y + (points[first * 2 + 1] ?? 0))
	for (let n = 1; n < count; n++) {
		const i = backwards ? first - n : first + n
		ctx.lineTo(x + (points[i * 2] ?? 0), y + (points[i * 2 + 1] ?? 0))
	}
	ctx.closePath()
}

/**
 * The key: the land in each bottom corner that has a palm, at the foreground's pace. Its fill runs from its top down past the
 * canvas's bottom, wherever the page's end is, so the trunks' feet stand inside it even while a pull past the page's end has
 * moved the page up. Drawn in CSS px under the context's transform.
 */
function drawKey(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, stage } = scene
	const { key } = assets
	// A side's heights are above the page's end, and a CSS px of the key's reach is a share of the width it was built for
	const xs = frame.width / stage.width
	const top = view.end + view.palmShift
	const bottom = frame.height + KEY_OVERHANG
	let drawn = false
	ctx.beginPath()
	for (const side of key.sides) {
		// Its highest point is still under the canvas
		if (top - side.height >= frame.height) continue
		const edge = side.right ? frame.width + KEY_OVERHANG : -KEY_OVERHANG
		const run = (side.right ? -key.step : key.step) * xs
		ctx.moveTo(edge, bottom)
		ctx.lineTo(edge, top - (side.tops[0] ?? 0))
		let x = side.right ? frame.width : 0
		for (let i = 0; i < side.tops.length; i++, x += run) ctx.lineTo(x, top - (side.tops[i] ?? 0))
		ctx.lineTo(x - run, bottom)
		ctx.closePath()
		drawn = true
	}
	if (drawn) ctx.fill()
}

/**
 * The key and the palms, in front of everything, at the foreground's pace (the page's own, moved by `palmShift`): the key, then
 * each palm with its trunk, the knot at its crown and its fronds, posed by the frame's wind at the clock: a gust reaches each palm
 * when the air carrying it does. A palm whose farthest frond is still under the canvas is
 * skipped, which it is for most of the descent. They only darken what is behind them, so nothing here can lift the ground behind
 * any copy. The context's transform is left for the caller to put back.
 */
function drawPalms(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, stage, clock, level, tier } = scene
	const k = frame.dpr
	const xs = frame.width / stage.width
	const samples = TRUNK_SAMPLES[stage.narrow ? 'narrow' : 'wide']
	// Whatever the layers before left set, these only darken
	ctx.globalCompositeOperation = 'source-over'
	ctx.globalAlpha = scene.fade
	ctx.fillStyle = SKYLINE.near
	ctx.setTransform(k, 0, 0, k, 0, 0)
	drawKey(ctx, scene, frame)
	for (const crown of assets.crowns) {
		const { palm } = crown
		const crownY = view.end - palm.crownZ + view.palmShift
		if (crownY - crown.reach >= frame.height) continue
		const baseY = view.end - palm.baseZ + view.palmShift
		const crownX = palm.crownX * xs
		palmPose(crown.wind, scene.wind, clock, level, pose)
		// The crown stands downwind of where the trunk's curve ends, by the lean and the sway of the pose
		const x = crownX + pose.crownX
		ctx.setTransform(k, 0, 0, k, 0, 0)
		trunkPoints = trunkOutline(palm.baseX * xs, baseY, crownX, crownY, palm.bow, palm.trunk, pose.crownX, WIND.trunk.power, samples, trunkPoints)
		// The trunk and the knot at its top are one fill: the knot's outline turns the opposite way, so it is walked backwards to join the trunk's
		ctx.beginPath()
		addPolygon(ctx, trunkPoints, (samples + 1) * 2, 0, 0)
		addPolygon(ctx, crown.knot, crown.knot.length / 2, x, crownY, true)
		ctx.fill()
		drawCrown(ctx, assets.palms, palm, crown.plan, pose, x, crownY, k, tier)
	}
}

/**
 * The scene's silhouettes and the water, drawn over the stars and the sky's events, back to front: the clouds, the sun's halo
 * and disc, the far city, the near city with the far shore's palm tops and its beacons, the sun's light wrapped round them, the water in strips, the ripples,
 * the glitter, the boat and its wake, the wings that keep the rails' copy readable over the warm sky, and in front of all of it
 * the key and the palms. It sets the blend it needs (drawSky leaves a different one) and puts the blend, the alpha, the
 * smoothing and the transform back at the end. `quiet` is the index of the zones the stars keep clear of (quiet copy and, on
 * a wide screen, reading copy), which the glitter keeps clear of too.
 */
export function drawMiamiScene(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, quiet: QuietIndex): void {
	const composite = ctx.globalCompositeOperation
	const smoothing = ctx.imageSmoothingEnabled
	try {
		ctx.globalCompositeOperation = 'source-over'
		ctx.imageSmoothingEnabled = true
		const { view, assets, stage } = scene
		// The waterline and what stands on it sit on a whole device pixel, so the line stays crisp
		const waterY = Math.round(view.horizonY * frame.dpr)
		// A stage baked for another width keeps its share of it: the sun stays at its share of the width
		const sunX = stage.sunX * (frame.width / stage.width)
		const sunY = view.horizonY - (stage.sunZ - stage.zWater)
		drawClouds(ctx, scene, frame)
		drawSun(ctx, scene, frame, sunX, sunY)
		drawCities(ctx, scene, frame, waterY)
		drawWrap(ctx, scene, frame, sunX, sunY)
		drawWater(ctx, scene, frame, waterY)
		drawRipples(ctx, scene, frame, waterY)
		drawGlitter(ctx, scene, frame, quiet)
		drawBoat(ctx, scene, frame)
		drawWing(ctx, scene, frame, assets.wings.left, stage.rail.left, view.wingLeft, true)
		drawWing(ctx, scene, frame, assets.wings.right, stage.rail.right, view.wingRight, false)
		if (scene.fade > 0) drawPalms(ctx, scene, frame)
	} catch {
		recover(ctx, scene)
		return
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.globalAlpha = 1
	ctx.imageSmoothingEnabled = smoothing
	ctx.globalCompositeOperation = composite
}
