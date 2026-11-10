import { CLEAR_SKY_KEEPS, MIN_STAR_ALPHA } from '@/lib/sky/config'
import { BEACONS, BOAT, STAGE, SUN, WATER } from '@/lib/sky/miamiConfig'
import { columnReach, glintAt, rippleAlpha, rippleBandDepth, rippleOffset, rowShift, type Glint, type RowShift } from '@/lib/sky/miamiWater'
import type { QuietIndex } from '@/lib/sky/quietIndex'
import type { MiamiImage, MiamiWing } from './miamiAssets'
import type { MiamiFrame } from './miamiRuntime'
import type { SkyFrame } from './renderSky'

/** CSS px of sky kept under the waterline: the water is drawn over them, so rounding the waterline to a whole device pixel never opens a gap. */
const WATER_OVERLAP = 2

/** What a row of the water and a glint are moved by or lit by, reused so a frame makes no garbage. */
const shift: RowShift = { x: 0, y: 0 }
const glint: Glint = { across: 0, depth: 0, alpha: 0, width: 0, height: 0 }

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

/** The clouds, locked to the page in height and drifting right: each wraps round a span a little wider than the canvas, so it leaves and returns off screen. */
function drawClouds(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, clock, fade } = scene
	const k = frame.dpr
	ctx.globalAlpha = fade
	for (const cloud of assets.clouds) {
		const top = (view.end - cloud.z - cloud.height) * k
		if (top >= frame.deviceHeight || top + cloud.height * k <= 0) continue
		const span = frame.width + cloud.width + 40
		const left = ((((cloud.x * frame.width - cloud.width / 2 + cloud.drift * clock + cloud.width) % span) + span) % span) - cloud.width
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

/** The sun: its halo's light, then its disc over it, both scaled by how far the sun has come in. */
function drawSun(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, x: number, y: number): void {
	const { view, assets, fade } = scene
	const alpha = view.sunAlpha * fade
	if (alpha <= 0) return
	const k = frame.dpr
	ctx.globalCompositeOperation = 'lighter'
	drawCentered(ctx, assets.sun.halo, x, y, view.haloScale, alpha, k)
	ctx.globalCompositeOperation = 'source-over'
	drawCentered(ctx, assets.sun.disc, x, y, 1, alpha, k)
}

/** The light the sun wraps around the silhouettes beside it: the halo again, fainter, over what has been drawn since. */
function drawWrap(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, x: number, y: number): void {
	const { view, assets, fade } = scene
	ctx.globalCompositeOperation = 'lighter'
	drawCentered(ctx, assets.sun.halo, x, y, view.haloScale, SUN.wrap * view.sunAlpha * fade, frame.dpr)
	ctx.globalCompositeOperation = 'source-over'
}

/**
 * The cities along the waterline: the far one, then the near one with the cranes and the low base, standing on the waterline
 * (sunk by their drops while the page is coming down, and covered by the water as they sink), and the beacons on the tallest
 * towers. A picture baked for a stage of another width stretches over this one until the new one is built.
 */
function drawCities(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { view, assets, fade } = scene
	const k = frame.dpr
	ctx.globalAlpha = fade
	const { far, near } = assets
	if (far) {
		const height = far.height * k
		ctx.drawImage(far.image, 0, waterY + Math.round(view.farDrop * k) - height, frame.deviceWidth, height)
	}
	const nearBottom = waterY + Math.round(view.nearDrop * k)
	const nearHeight = Math.round(near.height * k)
	ctx.drawImage(near.image, 0, nearBottom - nearHeight, frame.deviceWidth, nearHeight)
	// Beacons burn steadily at their still level; they sink with their towers
	const xs = frame.width / scene.stage.width
	const alpha = BEACONS.still * fade
	for (const beacon of near.beacons) {
		const y = view.horizonY + view.nearDrop - beacon.z
		drawCentered(ctx, assets.beacon, beacon.x * xs, y, 1, alpha, k)
	}
}

/**
 * The water in strips a few device px tall that grow toward the viewer, cut from the base picture: each strip is shifted
 * sideways and in the picture's own rows by its own phase of the waves, so no part of the water moves as one sheet. Where the
 * strips end, under the page's end, the base's own rows go on and then its last row stretches to the bottom of the canvas,
 * so a pull past the end shows no gap.
 */
function drawWater(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { assets, stage, clock, level, fade } = scene
	const { water } = assets
	const { base } = water
	const margin = WATER.strips.margin
	// The strips are in the build's device px, and the canvas may have dropped to a lower ratio since
	const share = frame.dpr / assets.dpr
	ctx.globalAlpha = fade
	let top = 0
	for (let i = 0; i < water.rows.length; i++) {
		const rows = water.rows[i] ?? 0
		const y0 = waterY + Math.round(top * share)
		const y1 = waterY + Math.round((top + rows) * share)
		const sourceTop = top / assets.dpr
		top += rows
		if (y1 <= 0 || y1 <= y0) continue
		if (y0 >= frame.deviceHeight) return
		rowShift(i, clock, level, water.depths[i] ?? 0, shift)
		// A source rect above the picture would paint nothing, and the first rows' shifts reach up
		ctx.drawImage(base.image, margin + shift.x, Math.max(0, sourceTop + shift.y), stage.width, rows / assets.dpr, 0, y0, frame.deviceWidth, y1 - y0)
	}
	const end = waterY + Math.round(top * share)
	if (end >= frame.deviceHeight) return
	const deep = Math.round(STAGE.water.overscan * frame.dpr)
	ctx.drawImage(base.image, margin, top / assets.dpr, stage.width, base.height - top / assets.dpr, 0, end, frame.deviceWidth, deep)
	const below = end + deep
	if (below < frame.deviceHeight) ctx.drawImage(base.image, margin, base.height - 1, stage.width, 1, 0, below, frame.deviceWidth, frame.deviceHeight - below)
}

/**
 * The ripples: two layers of crests, each in eight bands from the waterline to the page's end, every band drifted right by its
 * own offset and wrapped by drawing the tile again where it ends. The two layers trade light over each band's own life.
 */
function drawRipples(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, waterY: number): void {
	const { assets, clock, level, fade } = scene
	const { ripples, tileWidth } = assets.water
	const { bands, crestBRate } = WATER.ripple
	const k = frame.dpr
	for (let layer = 0; layer < ripples.length; layer++) {
		const tile = ripples[layer]
		if (!tile) continue
		const rate = layer === 0 ? 1 : crestBRate
		for (let b = 0; b < bands.length; b++) {
			const first = layer === 0 ? rippleAlpha(b, clock, level) : 1 - rippleAlpha(b, clock, level)
			const alpha = first * fade
			if (alpha < MIN_STAR_ALPHA) continue
			const p0 = Math.round((bands[b - 1] ?? 0) * tile.height)
			const p1 = Math.round((bands[b] ?? 1) * tile.height)
			const y0 = waterY + Math.round(p0 * k)
			const y1 = waterY + Math.round(p1 * k)
			if (p1 <= p0 || y1 <= 0 || y0 >= frame.deviceHeight) continue
			ctx.globalAlpha = alpha
			const offset = rippleOffset(rippleBandDepth(b), rate, clock) % tileWidth
			for (let x = offset > 0 ? offset - tileWidth : 0; x < frame.width; x += tileWidth) {
				ctx.drawImage(tile, 0, p0, tileWidth, p1 - p0, x * k, y0, tileWidth * k, y1 - y0)
			}
		}
	}
}

/**
 * The glitter under the sun: a set number of slots, each a short dash of light at a place and time of its own, added to
 * the water through the quiet zones of the copy, which take all of it away inside their padding. At rest the field stands at
 * its still clock; under the contrast preference the rows at and below the footer take none.
 */
function drawGlitter(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, quiet: QuietIndex): void {
	const { view, assets, stage, clock, level, fade } = scene
	const open = view.glitterOpen * fade
	if (open <= 0) return
	const k = frame.dpr
	const sunX = stage.sunX * (frame.width / stage.width)
	const cell = assets.glitter
	const count = WATER.glitter.count[stage.narrow ? 'narrow' : 'wide']
	const time = level > 0 ? clock : WATER.stillClock
	const footerY = view.end - stage.zFooterTop
	ctx.globalCompositeOperation = 'lighter'
	for (let slot = 0; slot < count; slot++) {
		glintAt(slot, time, glint)
		const light = glint.alpha * open
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
	ctx.globalCompositeOperation = 'source-over'
}

/** The boat where it starts, with its wake behind it (added as light) and its dark reflection under it. */
function drawBoat(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const { view, assets, stage, fade } = scene
	const { boat } = assets
	if (!boat) return
	const k = frame.dpr
	const x = BOAT.startX[stage.narrow ? 'narrow' : 'wide'] * frame.width
	const footY = view.horizonY + BOAT.depth
	const bow = x + 0.52 * stage.boatLength
	ctx.globalAlpha = fade
	ctx.globalCompositeOperation = 'lighter'
	ctx.drawImage(boat.wake.image, (bow - boat.apex.x) * k, (footY - boat.apex.y) * k, boat.wake.width * k, boat.wake.height * k)
	ctx.globalCompositeOperation = 'source-over'
	ctx.drawImage(boat.hull.image, (x - boat.hull.width / 2) * k, (footY - boat.foot) * k, boat.hull.width * k, boat.hull.height * k)
}

/**
 * One side's wing: its top feather, then its last row stretched down to the bottom of the canvas. The wing stays with the
 * screen, anchored at its own edge.
 */
function drawWing(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame, wing: MiamiWing | null, level: number, top: number, left: boolean): void {
	const alpha = level * scene.fade
	if (!wing || alpha <= 0) return
	// The wing was baked at its own pixel ratio, and the canvas may have dropped to a lower one since
	const k = frame.dpr / scene.assets.dpr
	const width = Math.min(frame.deviceWidth, Math.round(wing.image.width * k))
	const feather = Math.round(wing.feather * k)
	const x = left ? 0 : frame.deviceWidth - width
	const y = Math.round(top * frame.dpr)
	ctx.globalAlpha = alpha
	if (y + feather > 0 && y < frame.deviceHeight) ctx.drawImage(wing.image, 0, 0, wing.image.width, wing.feather, x, y, width, feather)
	const body = Math.max(0, y + feather)
	if (body < frame.deviceHeight) ctx.drawImage(wing.image, 0, wing.feather, wing.image.width, 1, x, body, width, frame.deviceHeight - body)
}

/**
 * The scene's silhouettes and the water, drawn over the stars and the sky's events, back to front: the clouds, the sun's halo
 * and disc, the far city, the near city with its beacons, the sun's light wrapped round them, the water in strips, the ripples,
 * the glitter, the boat and its wake, and the wings that keep the rails' copy readable over the warm sky. It sets the blend it
 * needs (drawSky leaves a different one) and puts the blend, the alpha and the smoothing back at the end. `quiet` is the
 * copy's quiet zones, which the glitter keeps clear of.
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
		drawWing(ctx, scene, frame, assets.wings.left, view.wingLeft, view.wingTopLeft, true)
		drawWing(ctx, scene, frame, assets.wings.right, view.wingRight, view.wingTopRight, false)
	} catch {
		recover(ctx, scene)
		return
	}
	ctx.globalAlpha = 1
	ctx.imageSmoothingEnabled = smoothing
	ctx.globalCompositeOperation = composite
}
