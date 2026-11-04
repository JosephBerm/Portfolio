import { colorAlong, mixRgb, rgba } from '@/lib/sky/color'
import { CLEAR_SKY_KEEPS, FIREBALL, METEOR, METEOR_SPECTRA, MIN_STAR_ALPHA } from '@/lib/sky/config'
import { brakedSpeed, fireballFlare, fireballLight, fireballPoint, quietClearance, type FireballShow } from '@/lib/sky/fireball'
import { trainEnvelope, type Meteor, type Point } from '@/lib/sky/meteors'
import type { Rgb } from '@/lib/sky/protocol'
import { smoothstep, transientQuietFactor } from '@/lib/sky/scene'
import type { SkyAssets, SkyFrame } from './renderSky'

/** Everything the parts of one fireball read at one moment. Lengths in device px unless a name says otherwise. */
interface Moment {
	ctx: OffscreenCanvasRenderingContext2D
	white: Rgb
	meteor: Meteor
	show: FireballShow
	dpr: number
	/** Seconds since it started. */
	elapsed: number
	/** Flight progress: past 1 while the wake and the train fade. */
	progress: number
	/** The head's progress, at most 1. */
	head: number
	/** The head's light, at most FIREBALL.light.cap. */
	light: number
	/** How far into its strongest flare the flight is. */
	flare: number
	/** The head's color now. */
	color: Rgb
	x: number
	y: number
	/** Unit normal of the path. */
	nx: number
	ny: number
	/** Radius of the white-hot core. */
	radius: number
	/** Share of its light a point keeps (CSS px): clear of every padded quiet rect, times the caller's fade. */
	kept: (x: number, y: number) => number
	/** What the head keeps. */
	headKept: number
	/** How far from (x, y) a light may reach and stay out of every padded quiet rect (CSS px, quietClearance). */
	clearanceAt: (x: number, y: number) => number
	/** The same at the head. */
	clearance: number
}

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

/**
 * What each stop of a gradient along the path keeps, for stops at `points` (CSS px): the least of what it and its neighbors
 * keep, so the gradient between a stop in the clear and one inside a padded quiet rect carries no light into the rect.
 */
function keptAlong(kept: (x: number, y: number) => number, points: readonly Point[]): number[] {
	const own = points.map((point) => kept(point.x, point.y))
	return own.map((share, k) => Math.min(own[k - 1] ?? 1, share, own[k + 1] ?? 1))
}

/** What a point with a tail of `tail` CSS px behind it along the path keeps: the least of what its head and its far end keep, so no part of it lands inside a padded quiet rect. */
function keptMote(moment: Moment, x: number, y: number, tail: number): number {
	const { kept, meteor } = moment
	return Math.min(kept(x, y), kept(x - meteor.dirX * tail, y - meteor.dirY * tail))
}

/** The knot light at flight progress `emitted`. */
function knotAt(show: FireballShow, emitted: number): number {
	return show.knots[Math.min(show.knots.length - 1, Math.floor(emitted * show.knots.length))] ?? 1
}

/** The train: what the flight leaves, brightest where the flight was and uneven along its length, swelling as it ages. It lights only once the wake has passed each point. */
function drawTrain(moment: Moment): void {
	const { ctx, meteor, show, dpr, elapsed, head, kept } = moment
	const { train } = show
	if (train === null) return
	const level = trainEnvelope(elapsed, meteor.duration, train)
	if (level < MIN_STAR_ALPHA) return
	const { stops, lightPower, lights, strokes } = FIREBALL.train
	const { brake } = show.motion
	const colors = METEOR_SPECTRA[show.spectrum].train
	const sx = meteor.startX * dpr
	const sy = meteor.startY * dpr
	const end = fireballPoint(meteor, brake, head)
	const ex = end.x * dpr
	const ey = end.y * dpr
	const length = Math.hypot(ex - sx, ey - sy)
	if (length < 1) return
	const gradient = ctx.createLinearGradient(sx, sy, ex, ey)
	const points = Array.from({ length: stops + 1 }, (_, k) => fireballPoint(meteor, brake, (k / stops) * head))
	const keeps = keptAlong(kept, points)
	points.forEach((point, k) => {
		const emitted = (k / stops) * head
		const along = Math.min(1, Math.hypot(point.x * dpr - sx, point.y * dpr - sy) / length)
		const age = elapsed - emitted * meteor.duration
		const profile = Math.min(1, fireballLight(emitted, show)) ** lightPower * knotAt(show, emitted)
		gradient.addColorStop(along, rgba(colorAlong(colors, age / train.life), level * profile * smoothstep(lights[0], lights[1], age) * (keeps[k] ?? 0)))
	})
	const aged = Math.min(1, Math.max(0, elapsed - meteor.duration) / train.widen)
	const width = (train.width[0] + (train.width[1] - train.width[0]) * aged) * dpr
	ctx.strokeStyle = gradient
	ctx.lineCap = 'butt'
	for (const stroke of strokes) {
		ctx.globalAlpha = stroke.alpha
		ctx.lineWidth = width * stroke.width
		ctx.beginPath()
		ctx.moveTo(sx, sy)
		ctx.lineTo(ex, ey)
		ctx.stroke()
	}
	ctx.globalAlpha = 1
}

/**
 * The glare: 1 / (1 + (r / core)^2) less its value at the rim, so it ends at exactly 0 there, and the rim stops at the
 * nearest copy (quietClearance). It has no plateau and no edge, and its wings are the sky's brightening about the head.
 */
function drawGlare(moment: Moment): void {
	const { ctx, show, dpr, x, y, light, flare, color, headKept, clearance, white } = moment
	const { glare } = show.tier
	const { at, flareReach, coreLight, coreFlare, lightGain, lightFloor, tint } = FIREBALL.glare
	const alpha = glare.alpha * Math.min(1, light * lightGain + lightFloor) * headKept
	const radius = Math.min(glare.radius * (1 + flareReach * flare), clearance) * dpr
	if (radius < 1 || alpha < MIN_STAR_ALPHA) return
	const core = glare.core * (coreLight + (1 - coreLight) * Math.min(1, light)) * (1 + coreFlare * flare) * dpr
	const rim = 1 / (1 + (radius / core) ** 2)
	const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
	for (const share of at) {
		const strength = (1 / (1 + ((share * radius) / core) ** 2) - rim) / (1 - rim)
		gradient.addColorStop(share, rgba(mixRgb(color, white, tint * (1 - share)), alpha * strength))
	}
	ctx.fillStyle = gradient
	ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius)
}

/** The sky lifting about a flare, in the head's color, and gone with it; its radius stops at the nearest copy too. */
function drawAureole(moment: Moment): void {
	const { ctx, show, dpr, x, y, flare, color, headKept, clearance, white } = moment
	const { from, stops, tint } = FIREBALL.aureole
	if (flare < from) return
	const { aureole, burst } = show.tier
	drawRadial(ctx, x, y, Math.min(aureole.radius, clearance) * dpr, mixRgb(color, white, tint), aureole.alpha * Math.min(1, flare / burst) * headKept, stops)
}

/**
 * The flame's outline, head and wake as one body behind the head: half-width(s) = tip + (halfWidth - tip) e^(-s / taper),
 * which is the teardrop. The path is straight, so it is a polygon in the frame of the flight. Nothing reaches ahead of
 * the head: the core and the glare are its front.
 */
function traceFlame(moment: Moment, length: number, halfWidth: number, taper: number): void {
	const { ctx, meteor, x, y, nx, ny, dpr } = moment
	const { samples, spacing, tip } = FIREBALL.flame
	const least = tip * dpr
	ctx.beginPath()
	for (let side = 1; side >= -1; side -= 2) {
		for (let j = 0; j <= samples; j++) {
			const s = ((side > 0 ? j : samples - j) / samples) ** spacing * length
			const half = least + (halfWidth - least) * Math.exp(-s / taper)
			const px = x - meteor.dirX * s + side * nx * half
			const py = y - meteor.dirY * s + side * ny * half
			if (side > 0 && j === 0) ctx.moveTo(px, py)
			else ctx.lineTo(px, py)
		}
	}
	ctx.closePath()
}

/**
 * Head and wake as one flame, from the flight's emission history as a shooting star's wake is: each point glows from the
 * moment the head passes it and fades with the motion's wake time, cooling from the head's color then to the spectrum's
 * `cool`, uneven along its length. One gradient for the color and one for the hot spine, filled in nested passes, widest
 * and faintest first.
 */
function drawFlame(moment: Moment): void {
	const { ctx, meteor, show, dpr, x, y, head, progress, radius, white, kept } = moment
	const { wake, brake } = show.motion
	const { arc, cool } = METEOR_SPECTRA[show.spectrum]
	const tail = Math.max(0, progress - (METEOR.wakeSpan * wake) / meteor.duration)
	if (tail >= 1 || progress <= 0) return
	const tailPoint = fireballPoint(meteor, brake, tail)
	const tx = tailPoint.x * dpr
	const ty = tailPoint.y * dpr
	const length = Math.hypot(x - tx, y - ty)
	if (length < 0.5) return
	const { stops, lightGain, lightFloor, lightCap, coolOver, hotOver, hotFade, widthOfRadius, taperOfRadius, taperSpeed, passes } = FIREBALL.flame
	const glow = ctx.createLinearGradient(x, y, tx, ty)
	const hot = ctx.createLinearGradient(x, y, tx, ty)
	const emissions = Array.from({ length: stops }, (_, k) => head - (k / (stops - 1)) * (head - tail))
	const points = emissions.map((emitted) => fireballPoint(meteor, brake, emitted))
	const keeps = keptAlong(kept, points)
	points.forEach((point, k) => {
		const emitted = emissions[k] ?? head
		const age = (progress - emitted) * meteor.duration
		const along = Math.min(1, Math.hypot(point.x * dpr - x, point.y * dpr - y) / length)
		const light = Math.min(lightCap, fireballLight(emitted, show) * lightGain + lightFloor) * Math.exp(-age / wake) * knotAt(show, emitted) * (keeps[k] ?? 0)
		const then = colorAlong(arc, emitted)
		glow.addColorStop(along, rgba(mixRgb(then, cool, 1 - Math.exp(-age / (wake * coolOver))), light))
		hot.addColorStop(along, rgba(mixRgb(white, then, Math.min(1, age / (wake * hotOver))), light * Math.exp(-age / (wake * hotFade))))
	})
	const halfWidth = radius * widthOfRadius
	const taper = radius * taperOfRadius * (taperSpeed[0] + taperSpeed[1] * brakedSpeed(head, brake))
	for (const pass of passes) {
		ctx.fillStyle = pass.hot ? hot : glow
		ctx.globalAlpha = pass.alpha
		traceFlame(moment, length, halfWidth * pass.width, taper)
		ctx.fill()
	}
	ctx.globalAlpha = 1
}

/** A small glowing point with a short tail shrinking behind it along the path: one path, one fill. */
function traceMote(moment: Moment, x: number, y: number, radius: number, tail: number): void {
	const { ctx, meteor, nx, ny } = moment
	const normal = Math.atan2(ny, nx)
	ctx.beginPath()
	ctx.moveTo(x + nx * radius, y + ny * radius)
	ctx.lineTo(x - meteor.dirX * tail, y - meteor.dirY * tail)
	ctx.lineTo(x - nx * radius, y - ny * radius)
	ctx.arc(x, y, radius, normal + Math.PI, normal + 2 * Math.PI)
	ctx.closePath()
}

/** Sparks shed behind the head: they brake fast, because they are small, and cool from the head's color to the spectrum's `cool`. */
function drawSparks(moment: Moment): void {
	const { ctx, meteor, show, dpr, elapsed, nx, ny, white } = moment
	const { brake } = show.motion
	const { arc, cool } = METEOR_SPECTRA[show.spectrum]
	const { fadeIn, fadePower, whiten, coolBy, shrink, tailMin, tailOfSpeed } = FIREBALL.sparks
	for (const spark of show.sparks) {
		const age = elapsed - spark.emitted * meteor.duration
		if (age <= 0 || age >= spark.life) continue
		const origin = fireballPoint(meteor, brake, spark.emitted)
		const speed = (meteor.length / meteor.duration) * brakedSpeed(spark.emitted, brake) * spark.lag
		const gone = spark.tau * (1 - Math.exp(-age / spark.tau))
		const x = origin.x + meteor.dirX * speed * gone + nx * spark.side * gone
		const y = origin.y + meteor.dirY * speed * gone + ny * spark.side * gone
		const tail = Math.max(tailMin, speed * Math.exp(-age / spark.tau) * tailOfSpeed)
		const light = spark.light * Math.min(1, age / fadeIn) * (1 - age / spark.life) ** fadePower * keptMote(moment, x, y, tail)
		if (light < MIN_STAR_ALPHA) continue
		const start = mixRgb(colorAlong(arc, spark.emitted), white, whiten)
		ctx.fillStyle = rgba(mixRgb(start, cool, Math.min(1, age / (spark.life * coolBy))), light)
		traceMote(moment, x * dpr, y * dpr, spark.size * (1 - (shrink * age) / spark.life) * dpr, tail * dpr)
		ctx.fill()
	}
}

/**
 * The pieces of the terminal burst, strung out along the path and not sprayed around it: drag decides where they go, and
 * the smaller a piece the sooner it brakes and falls behind. Their light ends with the flight's.
 */
function drawPieces(moment: Moment): void {
	const { ctx, meteor, show, dpr, elapsed, progress, color, nx, ny, white, clearanceAt } = moment
	if (progress <= show.burstAt) return
	const { brake } = show.motion
	const { cool } = METEOR_SPECTRA[show.spectrum]
	const { fadeIn, coolOver, lingers, tailMin, tailOfSpeed, whiten, glowOfSize, glowAlpha, coreOfSize, bodyOfSize } = FIREBALL.pieces
	const origin = fireballPoint(meteor, brake, show.burstAt)
	const speed = (meteor.length / meteor.duration) * brakedSpeed(show.burstAt, brake)
	const age = elapsed - show.burstAt * meteor.duration
	const ending = smoothstep(meteor.duration + lingers[1], meteor.duration + lingers[0], elapsed)
	const piece = mixRgb(color, cool, Math.min(1, age / coolOver))
	for (const { tau, side, size, light: bright, decay } of show.pieces) {
		const gone = tau * (1 - Math.exp(-age / tau))
		const cx = origin.x + meteor.dirX * speed * gone + nx * side * gone
		const cy = origin.y + meteor.dirY * speed * gone + ny * side * gone
		const back = Math.max(tailMin, speed * Math.exp(-age / tau) * tailOfSpeed)
		const light = bright * Math.exp(-age / decay) * Math.min(1, age / fadeIn) * ending * keptMote(moment, cx, cy, back)
		if (light < MIN_STAR_ALPHA) continue
		const x = cx * dpr
		const y = cy * dpr
		drawRadial(ctx, x, y, Math.min(glowOfSize * size, clearanceAt(cx, cy)) * dpr, piece, light * glowAlpha, FIREBALL.softGlow)
		const tail = ctx.createLinearGradient(x, y, x - meteor.dirX * back * dpr, y - meteor.dirY * back * dpr)
		tail.addColorStop(0, rgba(mixRgb(piece, white, whiten), light))
		tail.addColorStop(1, rgba(piece, 0))
		ctx.fillStyle = tail
		traceMote(moment, x, y, size * bodyOfSize * dpr, back * dpr)
		ctx.fill()
		drawRadial(ctx, x, y, coreOfSize * size * dpr, white, light, FIREBALL.softGlow)
	}
}

/** The core: white at its center, as the eye's cones saturate there; the spectrum shows around it. */
function drawCore(moment: Moment): void {
	const { ctx, dpr, x, y, radius, light, headKept, clearance, white } = moment
	const { reach, lightGain, stops } = FIREBALL.core
	drawRadial(ctx, x, y, Math.min(radius * reach, clearance * dpr), white, Math.min(1, light * lightGain) * headKept, stops)
}

/**
 * A fireball at the frame's time, its light added to the sky: the train, the glare and aureole, the flame, the sparks, the
 * pieces of the burst and the core, in that order. Every part is read at its own place through transientQuietFactor with
 * CLEAR_SKY_KEEPS, a gradient's stops and a point's tail by the least of what they keep, and the radial lights (the glare,
 * the aureole, the core, the pieces' glows) end at the nearest padded quiet rect, so none of it lands inside one, even when a
 * layout changes under it. Its colors are its spectrum's (METEOR_SPECTRA) at full strength, and the center of the head and
 * the hot spine are the theme's white. `fade` (0-1) multiplies all of it, as for a shooting star. It is a drawer of its
 * own: drawMeteor is built round the veil's budgets (METEOR_VEIL), which a fireball never needs, since it flies in clear
 * sky only.
 */
export function drawFireball(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, meteor: Meteor, show: FireballShow, frame: SkyFrame, fade: number): void {
	const { dpr } = frame
	const elapsed = frame.time - meteor.startedAt
	const progress = Math.max(0, elapsed / meteor.duration)
	const head = Math.min(1, progress)
	const point = fireballPoint(meteor, show.motion.brake, head)
	const light = Math.min(FIREBALL.light.cap, fireballLight(progress, show))
	const flare = fireballFlare(progress, show)
	const kept = (x: number, y: number) => transientQuietFactor(frame.quiet, x, y, CLEAR_SKY_KEEPS) * fade
	const clearanceAt = (x: number, y: number) => quietClearance(frame.quiet, x, y)
	const { least, lightPower, flareGrow, spentShrink, spentOver } = FIREBALL.head
	const moment: Moment = {
		ctx,
		white: assets.tokens.white,
		meteor,
		show,
		dpr,
		elapsed,
		progress,
		head,
		light,
		flare,
		color: colorAlong(METEOR_SPECTRA[show.spectrum].arc, head),
		x: point.x * dpr,
		y: point.y * dpr,
		nx: -meteor.dirY,
		ny: meteor.dirX,
		radius: show.tier.head * (least + (1 - least) * Math.min(1, light ** lightPower)) * (1 + flareGrow * flare) * (1 - spentShrink * smoothstep(show.burstAt, show.burstAt + spentOver, progress)) * dpr,
		kept,
		headKept: kept(point.x, point.y),
		clearanceAt,
		clearance: clearanceAt(point.x, point.y),
	}
	ctx.globalCompositeOperation = 'lighter'
	ctx.globalAlpha = 1
	drawTrain(moment)
	if (progress < 1 && light > MIN_STAR_ALPHA) {
		drawGlare(moment)
		drawAureole(moment)
	}
	drawFlame(moment)
	drawSparks(moment)
	drawPieces(moment)
	if (progress < 1 && light > MIN_STAR_ALPHA) drawCore(moment)
	ctx.globalAlpha = 1
}
