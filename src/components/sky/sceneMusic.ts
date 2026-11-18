/**
 * The landing scene's music: one song whose volume follows the scroll, silent while the landing room is more than a screen
 * below the viewport and full once it is wholly on screen. No React and no store: skySound.ts decides when it plays.
 *
 * The song streams through a media element into Web Audio, which sets the volume, since iOS ignores a media element's
 * `volume` (Apple: "not settable in JavaScript"); an AudioBuffer would decode the whole song into memory, and MDN keeps
 * those for clips under about 45 s. The element is paused whenever the music can't be heard (the room far away, the tab
 * hidden, the music turned off), so nothing decodes, and no OS media control shows, for silence.
 */

/** The song, served from public/ and fetched only once the visitor first turns the music on, and how the OS media controls name it. */
const SONG = {
	src: '/audio/dtmf-looped.mp3',
	title: 'DtMF',
	artist: 'Bad Bunny',
}

/** The volume's tunables. */
const MUSIC = {
	/** Gain with the landing room wholly on screen: the song's own level is full scale, and the music is a backdrop. */
	peak: 0.8,
	/** setTargetAtTime's time constant while the volume follows the scroll (s): a change is 95% done after three. */
	follow: 0.12,
	/** Its time constant when the music is turned off (s). */
	release: 0.08,
	/** Time constants after which a fade toward silence counts as silent (99.3% of the way), and the element pauses. */
	settle: 5,
	/** Where the volume starts to rise: the landing room's top this many screens below the viewport's bottom. */
	reach: 1,
}

/**
 * Calls `onProgress` with how far the scroll has come through the rise, 0 (silent) with the landing room's top
 * `MUSIC.reach` screens below the viewport's bottom to 1 (full) with the room's bottom on the viewport's bottom, beyond
 * either end too, after each scroll and resize, at most once a frame. Returns the stop.
 */
function followRise(landing: Element, onProgress: (progress: number) => void): () => void {
	const listeners = new AbortController()
	let frame = 0
	const measure = () => {
		frame = 0
		const { top, height } = landing.getBoundingClientRect()
		const viewport = window.innerHeight
		const from = viewport * (1 + MUSIC.reach)
		const to = viewport - height
		onProgress((from - top) / Math.max(1, from - to))
	}
	const schedule = () => {
		frame ||= requestAnimationFrame(measure)
	}
	window.addEventListener('scroll', schedule, { passive: true, signal: listeners.signal })
	window.addEventListener('resize', schedule, { signal: listeners.signal })
	schedule()
	return () => {
		listeners.abort()
		cancelAnimationFrame(frame)
	}
}

export interface SceneMusic {
	/**
	 * Starts the music following the scroll. Call it from inside the click that turned it on: the autoplay policy and iOS
	 * let a page make sound only after user activation, so the audio context starts and the element plays here, even when
	 * the room is far away and the volume is 0, which lets later plays on scroll alone go ahead.
	 */
	start(): void
	/** Fades out, then pauses and suspends; the song resumes where it stopped on the next start. */
	stop(): void
	/** Lets go of the element, the audio context and every listener. */
	destroy(): void
}

interface Graph {
	audio: HTMLAudioElement
	context: AudioContext
	gain: GainNode
}

/**
 * The music for the landing room `landing`. `onInterrupt` asks for the music to be turned off when it stops other than
 * through `stop()`: the browser refused to play or couldn't load the song, or something outside the page paused it (a
 * headset button, the OS media controls).
 */
export function createSceneMusic(landing: Element, onInterrupt: () => void): SceneMusic {
	const listeners = new AbortController()
	const { signal } = listeners
	let graph: Graph | null = null
	let following = false
	/** The gain the volume is easing toward. */
	let level = 0
	let stopScroll: VoidFunction | null = null
	/** Pauses the element once a fade toward silence has settled. */
	let silence: ReturnType<typeof setTimeout> | undefined
	/** Whether this file wants the element playing, so a pause or a play it didn't ask for is known to come from outside. */
	let wantPlaying = false

	const visible = () => document.visibilityState === 'visible'
	// resume(), suspend() and close() reject only on a closed context, or where WebKit holds an interruption: nothing to do
	const ignore = () => {}
	const session = () => ('mediaSession' in navigator ? navigator.mediaSession : null)

	/** The element, its source node and the gain, built in the first start's click, since a context made later starts suspended. */
	const build = (): Graph => {
		const audio = new Audio(SONG.src)
		audio.loop = true
		const context = new AudioContext()
		const gain = new GainNode(context, { gain: 0 })
		// One source node per element, for the element's life: it can't be made twice
		new MediaElementAudioSourceNode(context, { mediaElement: audio }).connect(gain).connect(context.destination)
		// Paused from outside while the music is on and heard (a headset button): the switch follows
		audio.addEventListener(
			'pause',
			() => {
				if (following && wantPlaying && visible()) onInterrupt()
			},
			{ signal }
		)
		// Played from outside (the OS media controls) while this file wants silence: take it back, or it would stream unheard
		audio.addEventListener(
			'play',
			() => {
				if (!wantPlaying) audio.pause()
			},
			{ signal }
		)
		// The song failed to load or decode (offline, say): no music to give
		audio.addEventListener(
			'error',
			() => {
				if (following) onInterrupt()
			},
			{ signal }
		)
		// iOS can take the context to 'interrupted' (a call, Siri; MDN, BaseAudioContext.state): resume it while the music should play
		context.addEventListener(
			'statechange',
			() => {
				if (wantPlaying && visible() && context.state !== 'running' && context.state !== 'closed') context.resume().catch(ignore)
			},
			{ signal }
		)
		return { audio, context, gain }
	}

	/** Pauses the element and suspends the context, which then renders nothing: the music can't be heard. */
	const pause = () => {
		clearTimeout(silence)
		silence = undefined
		wantPlaying = false
		if (!graph) return
		if (!graph.audio.paused) graph.audio.pause()
		if (graph.context.state === 'running') graph.context.suspend().catch(ignore)
	}

	const play = () => {
		clearTimeout(silence)
		silence = undefined
		if (!graph) return
		wantPlaying = true
		if (graph.context.state !== 'running') graph.context.resume().catch(ignore)
		if (!graph.audio.paused) return
		graph.audio.play().catch((error: unknown) => {
			// Refused (no activation the browser accepts) or unplayable (the song didn't load): turn the switch off, rather than
			// show music on that makes no sound. An AbortError is a pause or a reload cutting this play short, which needs nothing
			if (!(error instanceof DOMException && error.name === 'AbortError')) onInterrupt()
		})
	}

	/** Eases toward the volume for the scroll's `progress` through the rise, and plays or (once silent) pauses to match. */
	const aim = (progress: number) => {
		if (!graph) return
		const share = Math.min(1, Math.max(0, progress))
		// A quadratic taper: loudness is heard roughly on a log scale, so a linear gain would rush in and then flatten
		const next = MUSIC.peak * share * share
		if (next !== level) {
			level = next
			// Eases from wherever the gain is now, so a scroll's steps never jump
			graph.gain.gain.setTargetAtTime(level, graph.context.currentTime, MUSIC.follow)
		}
		if (!visible()) return
		if (level > 0) play()
		else if (silence === undefined && wantPlaying) silence = setTimeout(pause, MUSIC.follow * MUSIC.settle * 1000)
	}

	const onVisibility = () => {
		if (!following || !graph) return
		const { gain, context } = graph
		if (!visible()) {
			pause()
			// From silence, so the return eases in rather than starting at full volume
			gain.gain.cancelScheduledValues(0)
			gain.gain.setValueAtTime(0, context.currentTime)
			return
		}
		if (level > 0) {
			gain.gain.setTargetAtTime(level, context.currentTime, MUSIC.follow)
			play()
		}
	}
	document.addEventListener('visibilitychange', onVisibility, { signal })

	/** The OS media controls' pause turns the music off through the switch, so it fades and the switch shows it. */
	const claimSession = (claim: boolean) => {
		const media = session()
		if (!media) return
		if (claim) media.metadata = new MediaMetadata({ title: SONG.title, artist: SONG.artist })
		media.setActionHandler('pause', claim ? onInterrupt : null)
	}

	return {
		start() {
			graph ??= build()
			following = true
			// A song that failed to load before gets a fresh try
			if (graph.audio.error) graph.audio.load()
			// Played inside the click, at whatever the gain is: the first scroll measurement sets the volume, and pauses the
			// element again once it settles if the room is far away
			play()
			stopScroll ??= followRise(landing, aim)
			claimSession(true)
		},
		stop() {
			following = false
			stopScroll?.()
			stopScroll = null
			claimSession(false)
			if (!graph) return
			level = 0
			graph.gain.gain.setTargetAtTime(0, graph.context.currentTime, MUSIC.release)
			clearTimeout(silence)
			silence = setTimeout(pause, MUSIC.release * MUSIC.settle * 1000)
		},
		destroy() {
			following = false
			wantPlaying = false
			stopScroll?.()
			stopScroll = null
			clearTimeout(silence)
			listeners.abort()
			claimSession(false)
			const media = session()
			if (media) media.metadata = null
			if (!graph) return
			const { audio, context } = graph
			graph = null
			audio.pause()
			// Drop the source so the browser releases the download and its buffers
			audio.removeAttribute('src')
			audio.load()
			context.close().catch(ignore)
		},
	}
}
