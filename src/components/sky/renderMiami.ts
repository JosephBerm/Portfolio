import type { MiamiWing } from './miamiAssets'
import type { MiamiFrame } from './miamiRuntime'
import type { SkyFrame } from './renderSky'

/** CSS px of sky kept under the waterline: the water is drawn over them, so rounding the waterline to a whole device pixel never opens a gap. */
const WATER_OVERLAP = 2

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
 * The scene's ground, drawn right after the page's navy and before any star: the baked sky down to just under the waterline,
 * and below it the water's flat color. The sky is drawn without smoothing so its dither stays whole, and is placed by the
 * page's end, so it moves with the page. It leaves the blend, the alpha and the smoothing as drawSky expects them.
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
		if (waterY < frame.deviceHeight) {
			const water = Math.max(0, waterY)
			ctx.fillStyle = assets.water
			ctx.fillRect(0, water, frame.deviceWidth, frame.deviceHeight - water)
		}
		ctx.globalAlpha = 1
	} catch {
		recover(ctx, scene)
	}
}

/**
 * One side's wing: its top feather, then its last row stretched down to the bottom of the canvas. The wing is fixed to the
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
 * The scene's silhouettes, drawn over the stars and the sky's events: the two wings that keep the rails' copy readable over
 * the warm sky. It sets the blend it needs (drawSky leaves a different one) and puts the blend, the alpha and the smoothing
 * back at the end.
 */
export function drawMiamiScene(ctx: OffscreenCanvasRenderingContext2D, scene: MiamiFrame, frame: SkyFrame): void {
	const composite = ctx.globalCompositeOperation
	const smoothing = ctx.imageSmoothingEnabled
	try {
		ctx.globalCompositeOperation = 'source-over'
		ctx.imageSmoothingEnabled = true
		const { view, assets } = scene
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
