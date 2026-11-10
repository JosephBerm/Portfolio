import { parseHexColor } from './color'
import { RAMP } from './miamiConfig'
import type { Rgb } from './protocol'

/** A color in Oklab: lightness, then the green-red and blue-yellow axes. */
export type Oklab = readonly [lightness: number, a: number, b: number]

/** A stop of a color ramp: where it lies (t) and its color, a hex string or 'navy' for the theme's navy token. */
export type RampStop = readonly [t: number, color: string]

/**
 * A ramp sampled at `size` evenly spaced t from 0 to `topT`. The channels are linear light, clamped to 0-1, the form the
 * sky is baked in; `luminance` is WCAG relative luminance, and falls as t rises for the ramps in miamiConfig.
 */
export interface RampLut {
	size: number
	/** The last stop's t, where the ramp has reached the page's navy. */
	topT: number
	/** Red, green and blue of each sample, in that order. */
	rgb: Float32Array
	luminance: Float32Array
}

/** WCAG 2 relative luminance of a linear-light color: the weights of red, green and blue. */
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const

/** sRGB channel (0-255) to linear light (0-1). */
export function srgbToLinear(channel: number): number {
	const c = channel / 255
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** An sRGB color (0-255 channels) in Oklab (Ottosson's matrices). */
export function srgbToOklab(color: Rgb): Oklab {
	const red = srgbToLinear(color[0])
	const green = srgbToLinear(color[1])
	const blue = srgbToLinear(color[2])
	const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue)
	const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue)
	const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue)
	return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}

/** An Oklab color in linear-light sRGB, unclamped: one outside the gamut has a channel under 0 or over 1. */
export function oklabToLinear(color: Oklab): [number, number, number] {
	const l = (color[0] + 0.3963377774 * color[1] + 0.2158037573 * color[2]) ** 3
	const m = (color[0] - 0.1055613458 * color[1] - 0.0638541728 * color[2]) ** 3
	const s = (color[0] - 0.0894841775 * color[1] - 1.291485548 * color[2]) ** 3
	return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
}

/** The item at `index`, which the caller knows exists. */
function at<T>(items: readonly T[], index: number): T {
	const item = items[index]
	if (item === undefined) throw new RangeError(`No ramp stop at ${index}`)
	return item
}

/**
 * Cuts a color ramp into evenly spaced samples. The path runs through every stop in Oklab, so a step from navy to amber doesn't
 * muddy, along a cubic Hermite curve whose tangents are central differences across the (uneven) stops, one-sided at the
 * ends, which keeps the stops from showing as bands. 'navy' stops take `navy`, so the ramp's top joins the page exactly.
 */
export function buildRampLut(stops: readonly RampStop[], navy: Rgb, size: number = RAMP.lutSize): RampLut {
	const points = stops.map(([t, color]) => {
		const rgb = color === 'navy' ? navy : parseHexColor(color)
		if (!rgb) throw new Error(`Unreadable ramp color: ${color}`)
		return { t, lab: srgbToOklab(rgb) }
	})
	if (points.length < 2 || size < 2) throw new RangeError('A ramp needs two stops and two samples')
	const last = points.length - 1
	const tangents = points.map((_, i) => {
		const before = at(points, Math.max(0, i - 1))
		const after = at(points, Math.min(last, i + 1))
		const span = after.t - before.t
		return [0, 1, 2].map((axis) => (span > 0 ? (at(after.lab, axis) - at(before.lab, axis)) / span : 0))
	})
	const topT = at(points, last).t
	const rgb = new Float32Array(size * 3)
	const luminance = new Float32Array(size)
	let segment = 0
	for (let sample = 0; sample < size; sample++) {
		const t = (sample / (size - 1)) * topT
		while (segment < last - 1 && t > at(points, segment + 1).t) segment++
		const from = at(points, segment)
		const to = at(points, segment + 1)
		const fromTangent = at(tangents, segment)
		const toTangent = at(tangents, segment + 1)
		const span = to.t - from.t
		const u = span > 0 ? (t - from.t) / span : 0
		const u2 = u * u
		const u3 = u2 * u
		const blend = (axis: number) =>
			(2 * u3 - 3 * u2 + 1) * at(from.lab, axis) +
			(u3 - 2 * u2 + u) * span * at(fromTangent, axis) +
			(-2 * u3 + 3 * u2) * at(to.lab, axis) +
			(u3 - u2) * span * at(toTangent, axis)
		const linear = oklabToLinear([blend(0), blend(1), blend(2)])
		let light = 0
		for (let channel = 0; channel < 3; channel++) {
			const value = Math.min(1, Math.max(0, at(linear, channel)))
			rgb[sample * 3 + channel] = value
			light += at(LUMINANCE_WEIGHTS, channel) * value
		}
		luminance[sample] = light
	}
	return { size, topT, rgb, luminance }
}

/**
 * The smallest t from which the ramp stays at or under `luminance` all the way up: the height at which a ground that must
 * not be brighter than that is first allowed, found between two samples by interpolating. 0 where even the ramp's warmest
 * end is dark enough, and `topT` where even its navy end is too bright (nothing the ramp can do), which is also what a
 * luminance that is not a number gets.
 */
export function rampTForLuminance(lut: RampLut, luminance: number): number {
	const sample = (index: number) => lut.luminance[index] ?? 0
	for (let i = lut.size - 1; i >= 0; i--) {
		const here = sample(i)
		if (here <= luminance) continue
		if (i === lut.size - 1) return lut.topT
		const above = sample(i + 1)
		return ((i + (here - luminance) / (here - above)) / (lut.size - 1)) * lut.topT
	}
	return 0
}
