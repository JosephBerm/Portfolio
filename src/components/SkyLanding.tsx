import styles from './Background.module.css'

/**
 * Empty room between Contact and the footer for the sky's landing scene; mountSky measures it. Keep it free of copy.
 * It is also the scene's off switch, one line and a redeploy: render null here, or only when
 * `process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development'` to keep it off production (Vercel sets
 * VERCEL_ENV at build, so a missing variable keeps it off). With no landing the sky has nothing to fit, so it draws the
 * night sky alone and the page loses the empty room above the footer. Where no sky runs at all (the browser can't start
 * it, or it failed) mountSky marks <html> with `data-sky-off` and the stylesheet collapses the room.
 */
export default function SkyLanding() {
	return <div data-sky-landing className={styles.landing} />
}
