/** A cubic-bezier easing's control values (x1, y1, x2, y2), as in `easing` (src/lib/animations.ts). */
export type CubicBezier = readonly [number, number, number, number]

/** One easing split in two (splitEasing). */
export interface EasingSplit {
	/** The first part's share of the whole time (0-1). */
	share: number
	/** The first part's own easing, over its share of the time. */
	first: CubicBezier
	/** The second part's own easing, over the rest. */
	second: CubicBezier
}

/** A cubic-bezier easing as CSS writes it. */
export function cubicBezierCss(curve: CubicBezier): string {
	return `cubic-bezier(${curve.map((value) => Number(value.toFixed(4))).join(', ')})`
}

/**
 * Splits a cubic-bezier easing where its progress reaches `progress` (0-1), so one curve can run across two CSS
 * animations played back to back, which CSS eases separately: the first takes `share` of the time and goes from 0 to
 * `progress`, the second the rest. Each part comes back as an easing of its own (de Casteljau's split, normalized). The
 * curve's progress must rise monotonically, as every curve in `easing` does.
 */
export function splitEasing(curve: CubicBezier, progress: number): EasingSplit {
	const [x1, y1, x2, y2] = curve
	// The curve's progress at parameter u; its end points are (0, 0) and (1, 1)
	const progressAt = (u: number) => 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3
	let low = 0
	let high = 1
	for (let step = 0; step < 50; step++) {
		const middle = (low + high) / 2
		if (progressAt(middle) < progress) low = middle
		else high = middle
	}
	const u = (low + high) / 2
	const lerp = (from: number, to: number) => from + (to - from) * u
	// de Casteljau at u: a, b and c on the control polygon, d and e between them, f on the curve
	const ax = lerp(0, x1)
	const ay = lerp(0, y1)
	const bx = lerp(x1, x2)
	const by = lerp(y1, y2)
	const cx = lerp(x2, 1)
	const cy = lerp(y2, 1)
	const dx = lerp(ax, bx)
	const dy = lerp(ay, by)
	const ex = lerp(bx, cx)
	const ey = lerp(by, cy)
	const fx = lerp(dx, ex)
	const fy = lerp(dy, ey)
	return {
		share: fx,
		first: [ax / fx, ay / fy, dx / fx, dy / fy],
		second: [(ex - fx) / (1 - fx), (ey - fy) / (1 - fy), (cx - fx) / (1 - fx), (cy - fy) / (1 - fy)],
	}
}
