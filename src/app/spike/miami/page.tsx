'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { BootMessage, Config, Kind, MainMessage, Pct, StatsMessage, WorkerMessage } from './spike.worker'

/**
 * P0 spike (PLAN 9.2): a throwaway page that measures what the Miami landing scene would cost on a real phone. A worker
 * draws synthetic content with the plan's counts onto a canvas shaped like the home sky's (fixed, 100lvh, DPR capped at
 * 2) while this page relays its animation frames, as the real sky does on WebKit, and shows the numbers. Never merged.
 */

const INITIAL: Config = { load: 'phone', double: false, fps: 30, strips: true, ripple: true, glitter: true, fronds: true, readback: true }

/** Pixel-ratio caps and the largest backing store, as mountSky.ts has them. */
const DPR_CAP = 2
const DPR_CAP_LOW_MEMORY = 1.5
const LOW_MEMORY_GB = 4
const MAX_BACKING_PIXELS = 3840 * 2160

/** Workers, OffscreenCanvas and canvas transfer: Chrome 69, Firefox 105, Safari 16.4. */
function supported(): boolean {
	return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype
}

/** mountSky.ts's canvasDpr: device pixels, capped for memory, but never below CSS resolution unless the device is. */
function canvasDpr(width: number, height: number): number {
	const { deviceMemory } = navigator as Navigator & { deviceMemory?: number }
	const cap = deviceMemory !== undefined && deviceMemory <= LOW_MEMORY_GB ? DPR_CAP_LOW_MEMORY : DPR_CAP
	const byArea = Math.sqrt(MAX_BACKING_PIXELS / Math.max(1, width * height))
	return Math.min(window.devicePixelRatio || 1, Math.max(1, Math.min(cap, byArea)))
}

/** What the HUD reads from the page itself. */
interface Env {
	cssW: number
	cssH: number
	dpr: number
}

const fixed = (x: number, digits: number, width: number): string => (Number.isFinite(x) ? x.toFixed(digits) : '--').padStart(width)

/** One table row: label, p50, p95, max, n and, for intervals, the dropped frames. */
function row(label: string, p: Pct, drops?: number): string {
	const cells = p.n > 0 ? fixed(p.p50, 1, 6) + fixed(p.p95, 1, 6) + fixed(p.max, 1, 6) : '    --    --    --'
	return label.padEnd(12) + cells + String(p.n).padStart(6) + (drops === undefined ? '' : String(drops).padStart(6))
}

const flag = (on: boolean, letter: string): string => (on ? letter : '-')

function frameLines(kind: Kind, name: string): string[] {
	return [row(`${name} js`, kind.js), row(`${name} int`, kind.interval, kind.drops)]
}

/** The HUD: small monospace lines that survive a phone screenshot. */
function formatHud(env: Env, boot: BootMessage | null, stats: StatsMessage | null, failure: string): string {
	const lines: string[] = []
	if (stats) {
		const { config: c, counts: n } = stats
		const layers = [flag(c.strips, 'S'), flag(c.ripple, 'R'), flag(c.glitter, 'G'), flag(c.fronds, 'F'), flag(c.readback, 'B')].join(' ')
		lines.push(`MIAMI SPIKE P0  ${c.load}${c.double ? ' x2' : ''}  ${c.fps}fps  ${layers}  ${stats.sinceS.toFixed(0)}s`)
		lines.push(`draws ${n.total}: navy${n.navy} sky${n.sky} city${n.city} str${n.strips}/${stats.stripRows}r rip${n.ripple} gli${n.glitter} frn${n.fronds} fil${n.fills}${n.other ? ` oth${n.other}` : ''}`)
	} else {
		lines.push('MIAMI SPIKE P0  waiting for the first second of frames')
	}
	const raw = window.devicePixelRatio
	const device = boot ? `${boot.canvasW}x${boot.canvasH}` : '--'
	lines.push(`cv ${env.cssW}x${env.cssH} css ${device} dev  dpr ${raw}->${env.dpr}  in ${window.innerWidth}x${window.innerHeight}`)
	if (stats) {
		lines.push(`hz ${stats.hz.toFixed(1)} (med ${stats.intervalMs.toFixed(1)}ms) k ${stats.divisor} mk ${stats.masterDivisor} queued ${stats.queued} timer ${boot ? boot.timerRes.toFixed(3) : '--'}ms`)
		lines.push(`${''.padEnd(12)}${'p50'.padStart(6)}${'p95'.padStart(6)}${'max'.padStart(6)}${'n'.padStart(6)}${'drop'.padStart(6)}`)
		lines.push(...frameLines(stats.steady, 'steady'), ...frameLines(stats.scroll, 'scroll'))
		lines.push(row('flush /30', stats.flush))
	}
	if (boot) {
		const p = boot.probe
		lines.push(`probe raster ${p.rasterMs.toFixed(2)}ms  limit ${p.limitMs.toFixed(2)}  ${p.megapixels.toFixed(2)}MP  ${p.stars} stars`)
		lines.push(`  ${p.tripped ? 'TRIPPED' : 'ok'}  softwareFps ${Number.isFinite(p.softwareFps) ? p.softwareFps : 'inf'}  sceneStill ${p.sceneStill ? 'YES' : 'no'}`)
		const b = (stats ? stats.bake : boot.bake)
		lines.push(`bake ${b.load}: sky ${b.skyMs.toFixed(1)}+${b.skyBitmapMs.toFixed(1)}  water ${b.waterMs.toFixed(1)}+${b.waterBitmapMs.toFixed(1)}  other ${b.otherMs.toFixed(0)} ms`)
		lines.push(`  sky ${b.skyW}x${b.skyH}  water ${b.waterW}x${b.waterH}  (loops+toBitmap)`)
	}
	if (failure) lines.push(`ERROR ${failure}`)
	lines.push(`ua ${navigator.userAgent}`)
	return lines.join('\n')
}

// Fixed pieces, styled inline so the spike depends on nothing in the site's CSS

/** Placed like the home sky's host (Background.module.css): fixed, the large viewport's height, never resized by the URL bar. */
const HOST: CSSProperties = { position: 'fixed', inset: '0 0 auto', zIndex: 0, height: '100lvh', pointerEvents: 'none' }
const HUD_PANEL: CSSProperties = {
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	zIndex: 10,
	padding: 'max(6px, env(safe-area-inset-top)) 8px 6px',
	background: 'rgba(3, 6, 12, 0.93)',
	color: '#d8ecff',
	font: '10px/1.25 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
	WebkitTextSizeAdjust: '100%',
}
const READOUT: CSSProperties = { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit' }
const BUTTONS: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }
const BUTTON: CSSProperties = {
	font: 'inherit',
	fontSize: 11,
	minHeight: 28,
	padding: '4px 8px',
	borderRadius: 4,
	border: '1px solid #4b6a8c',
	color: '#d8ecff',
	background: '#0d1b2e',
	touchAction: 'manipulation',
}
const BUTTON_ON: CSSProperties = { ...BUTTON, background: '#1f6f4a', borderColor: '#5fd49b', color: '#fff' }
/** Three screens tall, so the page can be scrolled while the scene draws. */
const SCROLL_BODY: CSSProperties = { position: 'relative', zIndex: 1, height: '300lvh' }
const TICK: CSSProperties = {
	position: 'absolute',
	left: 0,
	width: 56,
	paddingTop: 2,
	borderTop: '1px solid rgba(255, 255, 255, 0.45)',
	font: '9px ui-monospace, Menlo, monospace',
	color: 'rgba(255, 255, 255, 0.6)',
}
/** A tick every tenth of a screen, so scrolling reads against the canvas. */
const TICKS = Array.from({ length: 30 }, (_, i) => i)

interface ButtonProps {
	label: string
	active: boolean
	onClick: () => void
}

function Toggle({ label, active, onClick }: ButtonProps) {
	return (
		<button type="button" aria-pressed={active} onClick={onClick} style={active ? BUTTON_ON : BUTTON}>
			{label}
		</button>
	)
}

export default function SpikeMiamiPage() {
	const hostRef = useRef<HTMLDivElement>(null)
	const hudRef = useRef<HTMLPreElement>(null)
	const workerRef = useRef<Worker | null>(null)
	const configRef = useRef<Config>(INITIAL)
	const [config, setConfig] = useState<Config>(INITIAL)

	useEffect(() => {
		const host = hostRef.current
		const hud = hudRef.current
		if (!host || !hud) return
		if (!supported()) {
			hud.textContent = 'This browser lacks Worker + OffscreenCanvas (Safari 16.4+, Chrome 69+, Firefox 105+).'
			return
		}
		let worker: Worker
		try {
			// A literal new URL(..., import.meta.url) lets the bundler emit the worker as its own same-origin chunk
			worker = new Worker(new URL('./spike.worker.ts', import.meta.url), { name: 'spike' })
		} catch (error) {
			hud.textContent = `The worker did not start: ${String(error)}`
			return
		}
		workerRef.current = worker
		// A fresh canvas per mount: control transfers only once, and StrictMode mounts twice in development
		const canvas = document.createElement('canvas')
		canvas.style.cssText = 'display:block;width:100%;height:100%'
		host.append(canvas)
		let offscreen: OffscreenCanvas | null = canvas.transferControlToOffscreen()
		const listeners = new AbortController()
		const { signal } = listeners
		const post = (message: MainMessage, transfer: Transferable[] = []): void => worker.postMessage(message, transfer)

		let size = { width: 0, height: 0, dpr: 0 }
		let boot: BootMessage | null = null
		let stats: StatsMessage | null = null
		let failure = ''
		const show = (): void => {
			hud.textContent = formatHud({ cssW: size.width, cssH: size.height, dpr: size.dpr }, boot, stats, failure)
		}

		// The page's animation frames stand in for the worker's own, which WebKit fixes to a 15 ms timer: one tick per frame,
		// and the scroll message ahead of it, so the worker knows the page has scrolled when it decides to draw
		let relayFrame = 0
		let scrollDirty = false
		const relay = (): void => {
			relayFrame = requestAnimationFrame(relay)
			if (scrollDirty) {
				scrollDirty = false
				post({ type: 'scroll', y: window.scrollY })
			}
			post({ type: 'tick' })
		}
		window.addEventListener(
			'scroll',
			() => {
				scrollDirty = true
			},
			{ passive: true, signal }
		)
		document.addEventListener('visibilitychange', () => post({ type: 'visible', visible: document.visibilityState === 'visible' }), { signal })

		const sendSize = (width: number, height: number): void => {
			if (width <= 0 || height <= 0) return
			const dpr = canvasDpr(width, height)
			if (width === size.width && height === size.height && dpr === size.dpr) return
			size = { width, height, dpr }
			if (!offscreen) {
				post({ type: 'resize', width, height, dpr })
				return
			}
			post({ type: 'init', canvas: offscreen, width, height, dpr, config: configRef.current, visible: document.visibilityState === 'visible' }, [offscreen])
			offscreen = null
		}
		// Measured after layout; the first non-zero size starts the worker
		const observer = new ResizeObserver((entries) => {
			const box = entries[0]?.contentBoxSize[0]
			if (box) sendSize(box.inlineSize, box.blockSize)
		})
		observer.observe(canvas)

		worker.addEventListener(
			'message',
			(event: MessageEvent<WorkerMessage>) => {
				const message = event.data
				switch (message.type) {
					case 'boot':
						boot = message
						show()
						// The worker is done baking: frames start here, so a boot's stall is not taken for a refresh
						if (!relayFrame) relayFrame = requestAnimationFrame(relay)
						break
					case 'stats':
						stats = message
						show()
						break
					case 'error':
						failure = message.message
						show()
						cancelAnimationFrame(relayFrame)
						relayFrame = 0
						break
					default: {
						const unhandled: never = message
						return unhandled
					}
				}
			},
			{ signal }
		)
		worker.addEventListener(
			'error',
			(event) => {
				failure = event.message || 'worker error'
				show()
			},
			{ signal }
		)
		hud.textContent = 'MIAMI SPIKE P0  baking the first sky and water...'

		return () => {
			listeners.abort()
			cancelAnimationFrame(relayFrame)
			observer.disconnect()
			worker.terminate()
			canvas.remove()
			workerRef.current = null
		}
	}, [])

	const update = (patch: Partial<Config>): void => {
		const next = { ...configRef.current, ...patch }
		configRef.current = next
		setConfig(next)
		workerRef.current?.postMessage({ type: 'config', config: next } satisfies MainMessage)
	}

	return (
		<>
			<meta name="robots" content="noindex, nofollow" />
			<div ref={hostRef} aria-hidden="true" style={HOST} />
			<div style={HUD_PANEL}>
				{/* The effect owns this text: it rewrites it every second */}
				<pre ref={hudRef} style={READOUT} />
				<div style={BUTTONS}>
					<Toggle label="Phone" active={config.load === 'phone'} onClick={() => update({ load: 'phone', double: false })} />
					<Toggle label="Desktop" active={config.load === 'desktop'} onClick={() => update({ load: 'desktop', double: false })} />
					<Toggle label="Double" active={config.double} onClick={() => update({ double: !config.double })} />
					<Toggle label={`${config.fps} fps`} active={config.fps === 20} onClick={() => update({ fps: config.fps === 30 ? 20 : 30 })} />
				</div>
				<div style={BUTTONS}>
					<Toggle label="strips" active={config.strips} onClick={() => update({ strips: !config.strips })} />
					<Toggle label="ripple" active={config.ripple} onClick={() => update({ ripple: !config.ripple })} />
					<Toggle label="glitter" active={config.glitter} onClick={() => update({ glitter: !config.glitter })} />
					<Toggle label="fronds" active={config.fronds} onClick={() => update({ fronds: !config.fronds })} />
					<Toggle label="readback" active={config.readback} onClick={() => update({ readback: !config.readback })} />
				</div>
			</div>
			<div style={SCROLL_BODY} aria-hidden="true">
				{TICKS.map((i) => (
					<div key={i} style={{ ...TICK, top: `${i * 10}lvh` }}>
						{(i / 10).toFixed(1)} screen
					</div>
				))}
			</div>
		</>
	)
}
