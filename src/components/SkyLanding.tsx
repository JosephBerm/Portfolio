import styles from './Background.module.css'

/** Off in production until the landing scene ships. Vercel sets VERCEL_ENV at build, and this page is prerendered then, so a missing variable keeps the scene off. */
const SHOW_SCENE = process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development'

/** Empty room between Contact and the footer for the sky's landing scene; mountSky measures it. Keep it free of copy. */
export default function SkyLanding() {
	return SHOW_SCENE ? <div data-sky-landing className={styles.landing} /> : null
}
