import { rgba } from '@/lib/sky/color'
import { MIN_STAR_ALPHA } from '@/lib/sky/config'
import type { Rgb } from '@/lib/sky/protocol'

/**
 * A radial light from full `alpha` shaped by `stops` ([share of the radius, share of `alpha`]), cut at `radius`, whose last
 * stop is 0 so nothing lands beyond it. The square it is filled in is grown by `margin` px on every side: its edge falls
 * between pixels and takes a share of the faint steps nearest the rim from the pixels it crosses, which a margin of a pixel
 * leaves to the gradient.
 */
export function drawRadial(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, radius: number, color: Rgb, alpha: number, stops: readonly (readonly [number, number])[], margin = 0): void {
	if (radius < 1 || alpha < MIN_STAR_ALPHA) return
	const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
	for (const [at, share] of stops) gradient.addColorStop(at, rgba(color, alpha * share))
	ctx.fillStyle = gradient
	ctx.fillRect(x - radius - margin, y - radius - margin, 2 * radius + 2 * margin, 2 * radius + 2 * margin)
}
