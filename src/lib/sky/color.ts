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
