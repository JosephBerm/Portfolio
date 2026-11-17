/** Uploads pixels once as an immutable bitmap (synchronous; works in workers). */
export function toBitmap(pixels: ImageData): ImageBitmap {
	const canvas = new OffscreenCanvas(pixels.width, pixels.height)
	canvas.getContext('2d')?.putImageData(pixels, 0, 0)
	const bitmap = canvas.transferToImageBitmap()
	// Safari caps the canvases a page may hold, and an emptied one lets go of its memory at once, not when it is collected
	canvas.width = canvas.height = 0
	return bitmap
}
