/**
 * The near skyline as data: one panorama of slender towers standing apart, with sky between them, in drawing units
 * (the tallest tower's body is 128 high). Every x is relative to the sun's gap, which stays clear, as does the window the
 * port cranes stand in, and is scaled by the screen's `unit` (the tallest tower over 128) and cropped at its edges, never
 * stretched, so every screen shows the same picture of one city. The list was drawn once from a seeded set of rules (a
 * density that thins away from the sun, groups of two or three towers, heights in three bands that fall away toward both
 * ends into a low shoreline) and stays as it is: edit the numbers freely, keeping the sun's gap and the crane window clear.
 * No tower here is taken from a real building or from a photograph.
 */

/**
 * The crown shapes, which a tower's last number indexes: flat, a small rooftop box, a two-step setback, a curved shoulder, a
 * thin mast, a stepped arc of three receding tiers and a slanted top. The last two are the skyline's two signature crowns.
 */
export const CROWNS = ['flat', 'box', 'setback', 'round', 'mast', 'arc', 'angle'] as const

/**
 * The near towers, left to right: the left edge, the width and the height of the body (drawing units), and the crown.
 * Where a tower stands in the sun's gap or among the cranes there is none.
 */
export const NEAR_TOWERS: readonly (readonly [x: number, width: number, height: number, crown: number])[] = [
	[-2291, 16, 30, 4],
	[-2158, 21, 39, 2],
	[-2081, 24, 26, 0],
	[-2005, 14, 50, 0],
	[-1928, 21, 29, 0],
	[-1799, 38, 61, 0],
	[-1715, 23, 48, 0],
	[-1643, 14, 39, 0],
	[-1529, 15, 49, 0],
	[-1414, 15, 80, 0],
	[-1302, 20, 64, 0],
	[-1222, 39, 55, 1],
	[-1077, 15, 65, 0],
	[-1055, 23, 118, 1],
	[-1010, 24, 109, 3],
	[-943, 19, 90, 1],
	[-911, 37, 125, 0],
	[-865, 21, 86, 0],
	[-803, 21, 67, 0],
	[-773, 13, 94, 0],
	[-751, 16, 83, 0],
	[-707, 35, 118, 0],
	[-658, 18, 82, 0],
	[-614, 34, 121, 0],
	[-568, 22, 111, 0],
	[-328, 14, 82, 0],
	[-303, 16, 92, 0],
	[-253, 24, 124, 5],
	[-220, 19, 65, 0],
	[-191, 19, 81, 3],
	[-156, 17, 91, 2],
	[-134, 35, 124, 1],
	[-94, 18, 75, 0],
	[92, 20, 119, 6],
	[122, 15, 90, 1],
	[147, 22, 80, 0],
	[185, 18, 67, 0],
	[213, 20, 126, 0],
	[242, 22, 113, 2],
	[282, 30, 91, 1],
	[325, 18, 81, 0],
	[382, 23, 66, 0],
	[415, 28, 77, 0],
	[449, 23, 124, 0],
	[501, 22, 91, 0],
	[531, 40, 124, 2],
	[602, 17, 66, 0],
	[624, 16, 124, 1],
	[649, 35, 68, 0],
	[708, 32, 123, 0],
	[750, 16, 78, 1],
	[800, 14, 111, 2],
	[922, 22, 58, 0],
	[1060, 19, 98, 0],
	[1172, 19, 86, 0],
	[1259, 15, 95, 2],
	[1324, 17, 83, 0],
	[1417, 32, 56, 0],
]

/**
 * The solid clusters that close the frame on each side, from the screen's edge inward: a tower's width, its height and its
 * crown, with no air between them. Each list is longer than the widest screen needs.
 */
export const EDGE_LEFT: readonly (readonly [width: number, height: number, crown: number])[] = [
	[30, 85, 0],
	[29, 98, 0],
	[28, 75, 0],
	[29, 66, 0],
	[28, 88, 0],
	[34, 78, 0],
	[30, 97, 0],
	[30, 72, 0],
	[27, 100, 0],
	[27, 80, 0],
	[28, 112, 0],
	[29, 90, 0],
	[27, 78, 0],
	[28, 111, 0],
	[33, 72, 0],
	[32, 94, 0],
	[27, 77, 0],
]

export const EDGE_RIGHT: readonly (readonly [width: number, height: number, crown: number])[] = [
	[31, 106, 0],
	[34, 89, 0],
	[33, 65, 0],
	[30, 94, 0],
	[28, 71, 0],
	[30, 80, 0],
	[34, 100, 0],
	[32, 67, 0],
	[27, 78, 0],
	[30, 87, 0],
	[33, 109, 0],
	[28, 71, 0],
	[31, 109, 0],
	[31, 76, 0],
	[33, 103, 0],
	[32, 93, 0],
]
