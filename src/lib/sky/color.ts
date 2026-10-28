import type { Rgb } from './protocol'

/** Parses `#rgb`, `#rrggbb` or `#rrggbbaa` (alpha ignored). Returns null for anything else, such as an oklch() token. */
export function parseHexColor(value: string): Rgb | null {
	const hex = value.trim().replace(/^#/, '')
	const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex.slice(0, 6)
	if (!/^[0-9a-f]{6}$/i.test(full)) return null
	const n = Number.parseInt(full, 16)
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Linear mix in sRGB: t = 0 gives `a`, t = 1 gives `b`. */
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
	return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

/** CSS color string for canvas styles; alpha is clamped to 0-1 and written in fixed notation. */
export function rgba(color: Rgb, alpha: number): string {
	const a = Math.min(1, Math.max(0, alpha)).toFixed(4)
	return `rgba(${Math.round(color[0])},${Math.round(color[1])},${Math.round(color[2])},${a})`
}

/** `rgb(r, g, b)` and `rgba(r, g, b, a)`, with commas or spaces and a percentage or number alpha: how a computed style writes an sRGB color. */
const COMPUTED_COLOR = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i

/** Parses a computed `rgb()` or `rgba()` color, a translucent one mixed onto `ground`. Returns null for any other form. */
export function parseRgbColor(value: string, ground: Rgb): Rgb | null {
	const match = COMPUTED_COLOR.exec(value.trim())
	if (!match) return null
	const [, red = '', green = '', blue = '', alphaText = '1'] = match
	const alpha = alphaText.endsWith('%') ? Number.parseFloat(alphaText) / 100 : Number.parseFloat(alphaText)
	return mixRgb(ground, [Number.parseFloat(red), Number.parseFloat(green), Number.parseFloat(blue)], Math.min(1, Math.max(0, alpha)))
}

/** sRGB channel (0-255) to linear light (0-1). */
function linear(channel: number): number {
	const c = channel / 255
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG 2 relative luminance of an sRGB color (0-1). */
function luminance(color: Rgb): number {
	return 0.2126 * linear(color[0]) + 0.7152 * linear(color[1]) + 0.0722 * linear(color[2])
}

/** WCAG 2 contrast ratio of two colors (1-21). */
function contrastRatio(a: Rgb, b: Rgb): number {
	const first = luminance(a)
	const second = luminance(b)
	return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/** WCAG 2 AA (1.4.3): 4.5:1 for text, 3:1 for large text (at least 24 px, or 18.66 px and bold). */
const WCAG_CONTRAST = { text: 4.5, largeText: 3, largePx: 24, largeBoldPx: 18.66, boldWeight: 700 } as const

/** The AA minimum contrast for text of this computed size (px) and weight. */
export function minimumContrast(fontSize: number, fontWeight: number): number {
	const large = fontSize >= WCAG_CONTRAST.largePx || (fontSize >= WCAG_CONTRAST.largeBoldPx && fontWeight >= WCAG_CONTRAST.boldWeight)
	return large ? WCAG_CONTRAST.largeText : WCAG_CONTRAST.text
}

/** Steps of the headroom scan: a resolution of 1/256 of full light, which the sky's own safety margin dwarfs. */
const HEADROOM_STEPS = 256

/**
 * The most light (an alpha of `light`, added per channel as the sky's 'lighter' blending does) that `ground` can take
 * before `text` on it falls under `minimum`:1. It scans up from no light and stops at the first failure, because the
 * ratio falls to 1:1 where the ground matches the text and climbs again beyond it. 0 when the text fails even unlit.
 */
export function lightHeadroom(text: Rgb, ground: Rgb, light: Rgb, minimum: number): number {
	let headroom = 0
	for (let step = 0; step <= HEADROOM_STEPS; step++) {
		const alpha = step / HEADROOM_STEPS
		const lit: Rgb = [Math.min(255, ground[0] + light[0] * alpha), Math.min(255, ground[1] + light[1] * alpha), Math.min(255, ground[2] + light[2] * alpha)]
		if (contrastRatio(text, lit) < minimum) break
		headroom = alpha
	}
	return headroom
}
