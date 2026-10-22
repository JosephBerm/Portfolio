import localFont from 'next/font/local'

/** Golos Text: static Regular (the shipped file has no wght axis), so 500/600 are browser-synthesized exactly as before. */
export const golos = localFont({
	src: '../assets/fonts/golos-text-regular.woff2',
	weight: '400',
	variable: '--font-golos',
	fallback: ['Arial', 'Helvetica', '-apple-system', 'system-ui', 'sans-serif'],
})

/** Fira Code: only the weights the UI renders (400, plus 600 for the selected time slot).
 *  adjustFontFallback is off on purpose: a size-adjusted Arial (~135%) would draw the arrows this subset
 *  lacks oversized. Courier New already matches Fira Code's advance width, so no layout-shift protection is lost. */
export const firaCode = localFont({
	src: [
		{ path: '../assets/fonts/fira-code-regular.woff2', weight: '400', style: 'normal' },
		{ path: '../assets/fonts/fira-code-semibold.woff2', weight: '600', style: 'normal' },
	],
	variable: '--font-fira-code',
	adjustFontFallback: false,
	fallback: ['Courier New', 'Courier', 'monospace'],
})
