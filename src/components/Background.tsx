import SkyCanvas from '@/components/sky/SkyCanvas'
import styles from './Background.module.css'

/**
 * Home page night sky: a fixed, decorative layer under #content. A Web Worker draws the stars, haze and shooting
 * stars (src/components/sky); until its first frame the body's navy shows.
 */
export default function Background() {
	return <SkyCanvas className={styles.sky} canvasClassName={styles.canvas} />
}
