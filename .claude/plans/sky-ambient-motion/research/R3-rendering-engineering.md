# R3: Rendering and scheduling engineering for continuous drift

Research agent R3. Planning only: nothing in the repository was changed. Every script and its raw output is in
`/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/research/r3-data/` (each
`out-<name>.txt` is the output of `<name>.mjs`). The CPU benchmarks run copies of `src/lib/sky/*.ts` (in `r3-data/sky/`,
imports rewritten to `.ts`) under Node 22.22 type stripping, never the repository files.

**Labels.** [Verified] means checked in a primary source (spec, MDN, browser-compat-data, browser source code), with
its URL. [Measured] means produced by a script in `r3-data` (V8 in Node 22.22 on a 2.1 GHz Xeon vCPU; this VM is shared,
so repeat runs vary by about ±30%, and ranges below span two runs). [Estimate] means derived, with the assumptions
stated. [Judgment] means my recommendation.

**Hosts I could not reach.** html.spec.whatwg.org, w3.org, webkit.org, developer.chrome.com and support.google.com
are blocked from this sandbox. I read the same documents from their GitHub sources instead: whatwg/html `source`,
w3c/wcag, GoogleChrome/developer.chrome.com, mdn/content, mdn/browser-compat-data, and the Chromium, WebKit, Gecko and
Skia repositories. I cite the public URLs. The single exception is the WebKit power post (§2.6), which I know only from
search summaries.

---

## 0. Summary

1. **Frame clock.** Moving stars need frames that land evenly on display refreshes. Request an animation frame on
   every refresh, but draw only on every k-th one, with k = max(⌊refreshHz / fps_need⌋, ⌈refreshHz / fps_cap⌉, 1) and
   fps_need = max(20, v_max·dpr / 0.5). Timer frames judder. [Measured] A 33 ms `setTimeout` on a 60 Hz screen holds
   one frame in 16 for 3 refreshes instead of 2, so the sky slows to 0.67× about twice a second. Divided animation
   frames hold every frame for exactly k refreshes. Fades and twinkle keep their timers whenever nothing moves.
2. **Engines differ** [Verified, browser source]. Chrome and Firefox drive worker `requestAnimationFrame` from vsync.
   **WebKit drives it from a fixed 15 ms timer, about 66.7 Hz.** That timer is not vsync-aligned, and a `FIXME` in the
   source says it skips the page's throttling (Low Power Mode, the 60 fps preference). On a 60 Hz screen it gives
   about 4.5 jolts/s, and about 7% of the drawn frames are never shown. Draw every frame on that clock. A main-thread
   frame relay for WebKit is phase 2, gated on device tests.
3. **Sub-pixel rendering.** Draw sprites pre-rendered at 4×4 quarter-pixel phases at whole device pixels (Skia's glyph
   cache uses the same 4 positions per axis). Fractional `drawImage` resamples bilinearly: a σ = 0.7 px star at phase
   (0.5, 0.5) drops to **0.504** of its phase-0 peak, its width grows 24%, and a drifting star pulses at v·dpr Hz. A
   phased sprite keeps its flux and width, and its perceived peak stays at 0.90–0.99 on DPR 2 screens. The atlas grows
   from 127 KB to 1.77 MB at DPR 2. Painting the phases with separable profiles takes **0.8 ms** (today's painter would
   take 151 ms). Under reduced motion, keep today's exact rounding.
4. **Cost.** [Measured] The per-star quiet lookup dominates today's star math: 0.48–1.72 ms per frame at 1430 stars.
   An **exact per-tile quiet index** cuts that to 0.15–0.32 ms with bit-identical output (max |diff| = 0). It wraps the
   veil session's own `easedQuietFactor`, so their math stays the single source. Hoisting constants saves only
   0.02–0.06 ms. Pre-rendered layer bitmaps are rejected: screen-space quiet dimming and per-star twinkle can't be baked
   into a moving layer, lockstep bilinear shimmer would hit every star at once, and they cost more than 100× the GPU fill.
5. **Camera geometry.** Give each layer its own (x, y) offset. Wrap cell lookups (and the offsets) at the existing key
   range of 2^16 cells, which is a no-op for every reachable cell, so the catalog never changes. Evict cache cells by
   frame stamp instead of clearing all of them. EDGE = 24 already covers the largest halo (≤ 9 CSS px).
6. **Idle and accessibility.** Count pointer, key and focus activity as presence. Drift shares the twinkle's 90 s idle
   gate: it eases out over 4 s, sleeps, and keeps its position. Freeze it under reduced motion. WCAG 2.2.2 still needs a
   user pause mechanism for automatic motion longer than 5 s; this is an open product decision (§11).
7. **Transients.** Use a discriminated `Transient` union, a per-kind spec registry and a single scheduler. Its
   invariants: at most one ink lease at a time (one transient near copy), the veil session's scroll-cancel rule applied
   to every kind, and vsync frames while any transient moves.

---

## 1. Facts in today's code that the design builds on

| Where (current lines) | Fact |
|---|---|
| `sky.worker.ts` L117–127 `frameMode` | Modes, first match wins: `active` (rAF) while a meteor moves or the page scrolls under full motion; `fade` (30 fps timer); `twinkle` (15 fps timer, 10 after a step-down); `sleep`. |
| `sky.worker.ts` L152–168 `schedule`, L183–190 `tick` | The next timer fires at `lastDrawAt + interval` after the actual draw (L167), so timer lateness accumulates. A draw happens when `now - lastDrawAt >= interval - 4` (L188). |
| `sky.worker.ts` L16–22, L70, L137, L153, L158 | `scope.requestAnimationFrame` is called without feature detection, and 0 marks "no frame pending". |
| `sky.worker.ts` L86–99 | Idle: `FRAME.idleSleepMs` = 90 s with no **scroll** (other input doesn't count). The twinkle eases out over 4 s, then the worker sleeps. |
| `sky.worker.ts` L444–457 | Hidden: frames are cancelled, the meteor is dropped, and the dusk clock pauses. |
| `renderSky.ts` L96–137 `drawLayer` | x always spans 0…width (L101–102); `offsetY = parallaxScroll × parallax` (L100); every star calls `easedQuietFactor` (L120); stars snap with `Math.round(x * dpr) - half` (L132). |
| `renderSky.ts` L34–51 `createStarField` | Numeric key valid for cells in ±32768 (L38–39); `trim` clears the whole cache past 4× the visible cells (L47–49). |
| `scene.ts` L71–124 | `quietAt` and `inkAt` loop over every zone, skipping those more than `QUIET.feather` (40) or `QUIET.padding` (32) away on either axis. During an ease, `easedQuietFactor` evaluates both zone sets. |
| `skyAssets.ts` L81–120 | Atlas: 8 palette rows × 6 shapes plus a meteor row, painted with 16 `exp()` per pixel (L44–55). The comment says "about 1 ms"; [Measured] it takes 3.2 ms at DPR 1 and 10.0 ms at DPR 2. |
| `mountSky.ts` L17–24, L87–93 | The canvas DPR is capped at 2 (1.5 at ≤ 4 GB memory, Chromium only), so DPR 3 never reaches the worker. |
| `catalog.ts` L89–94 | `densityKeep`: [Measured] about 1430 stars at 3840×2160 CSS (the MAX_STARS cap), 869 at 2560×1440, 314 at 1440×900 and 108 at 390×844. **Only very large CSS viewports draw 1400 stars; phones draw about 100.** |

---

## 2. Frame scheduling

### 2.1 Worker animation frames: support and actual behavior

**Spec** [Verified, WHATWG HTML, *Animation frames* and *Event loop processing model*,
https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames]: `DedicatedWorkerGlobalScope
includes AnimationFrameProvider`. It is "supported" only if the worker's owner set contains a Document; otherwise
`requestAnimationFrame` throws `NotSupportedError`. A worker event loop runs the callbacks with `now` = "the current high
resolution time", and "a user agent can determine the rate of rendering in the dedicated worker". The spec's note on
rendering opportunities endorses whole-rate division: if a browser "is not able to sustain this rate, it might drop to a
more sustainable 30 rendering opportunities per second … rather than occasionally dropping frames"
(https://html.spec.whatwg.org/multipage/webappapis.html#rendering-opportunity).

| Engine | Worker rAF since [Verified, BCD `api.DedicatedWorkerGlobalScope.requestAnimationFrame`] | Clock and timestamp [Verified, source] | Throttling |
|---|---|---|---|
| Chrome / Edge (Blink) | 69 (not in nested workers) | The OffscreenCanvas's compositor frame sink sends BeginFrames, which are vsync-aligned. Timestamp = `args.frame_time - TimeOrigin()`. Callbacks are skipped while the canvas "has too many pending frames" (GPU backpressure). (`third_party/blink/renderer/core/animation_frame/worker_animation_frame_provider.cc`) | Desktop Energy Saver throttles all frame sinks to 30 Hz (`chrome/browser/performance_manager/user_tuning/battery_saver_mode_manager.cc`: `StartThrottlingAllFrameSinks(base::Hertz(30))`). Android throttles the **main frame** from 120 to 60 Hz (`kThrottleMainFrameTo60Hz`, on by default), but `kThrottleOffscreenCanvasTo60Hz` is **off by default** (`cc/base/features.cc`), so on 120 Hz phones a worker canvas can draw at 120 Hz. |
| Firefox (Gecko) | 99 | `VsyncWorkerChild` (PVsync); timestamp = the vsync time; unobserved while the document is hidden (`dom/workers/WorkerScope.cpp`, `DedicatedWorkerGlobalScope::OnVsync`). | Follows vsync. |
| Safari (WebKit) | 16.4 | `WorkerAnimationController`: a **one-shot 15 ms timer** re-armed after each frame (`fullSpeedAnimationInterval { 15_ms }`); timestamp = `performance.now()` when it fires. The source says: "FIXME: There's a lot of missing throttling behaviour that's present on DOMDocument" (`Source/WebCore/workers/WorkerAnimationController.cpp`, `Source/WebCore/dom/RequestAnimationFrameCallback.h`). | **None of the page's throttling.** WebKit's page rendering prefers about 60 fps on 120 Hz screens (`PreferPageRenderingUpdatesNear60FPSEnabled`, default true, in `Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml`) and drops to 30 fps for Low Power Mode, visually idle pages, non-interacted cross-origin frames and aggressive thermal mitigation (`Source/WebCore/platform/graphics/AnimationFrameRate.cpp`). The worker clock ignores all of this. |

Source URLs: github.com/chromium/chromium (the paths above), github.com/mozilla-firefox/firefox, github.com/WebKit/WebKit.

**When rAF is missing, today's code** [Verified by reading]: `mountSky.ts` `supported()` requires OffscreenCanvas and
`transferControlToOffscreen`, which arrived in Chrome 69, Firefox 105 and Safari 16.4 [Verified, BCD]. All three
engines had worker rAF by then (69, 99, 16.4), so in practice it is never missing. If it were,
`scope.requestAnimationFrame` would throw a TypeError inside `schedule()`. The worker would raise an `error` event,
`mountSky` would destroy the sky, and the page would keep its plain navy: a safe failure, but no sky. Two edge cases
need handling:

- **Chrome:** `RegisterCallback` returns `kInvalidCallbackId` (0) and never calls back when the frame provider is
  invalid. The code treats 0 as "nothing pending", so active modes would freeze silently until the next message.
- **MDN:** request IDs "may overflow and end up reaching 0 … prefer unattainable values such as null"
  (https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame).

[Judgment] Wrap the clock in a `FrameClock`:

- feature-detect `requestAnimationFrame`;
- use `null` as the "nothing pending" sentinel;
- add a watchdog: while visible, if no callback arrives within 250 ms of a request, fall back to a 60 Hz timer that
  passes `performance.now()`.

### 2.2 Why timer frames judder, with numbers

**Model** (`pacing.mjs`, [Measured]). At every vsync the display shows the newest frame committed before that vsync's
deadline, and each frame shows the sky at the time it was drawn. When a frame stays on screen for more or fewer
refreshes than its neighbors, the motion appears to speed up or slow down. Timers here are chained the way `tick()`
chains them, with 0–2 ms of lateness each.

| Clock | 60 Hz display | 120 Hz display |
|---|---|---|
| rAF, draw every k-th vsync | every hold is exactly k refreshes; apparent speed **1.00×**; 0 jolts | same |
| `setTimeout` 33.3 ms (fades) | holds: 94% 2 refreshes, 6% 3; the speed dips to **0.67×** about **1.9 times/s** | holds: 87% 4, 13% 5; dips to 0.80× |
| `setTimeout` 66.7 ms (twinkle) | holds: 94% 4, 6% 5 (a 20% dip about once a second) | 8 or 9 refreshes |
| `setTimeout` 16.7 ms | 0.50–1.12×, **3.3 jolts/s** | 0.67–1.12×, **6.6 jolts/s** |
| WebKit worker rAF (15 ms timer) | a new frame on every refresh, but 4.7 frames/s are drawn and never shown, so content sometimes advances two steps: **0.90–1.92×, about 4.5 jolts/s** | the same 66.7 Hz clock |

A "jolt" here is a displayed frame whose apparent speed is more than 20% off. Each one is about one frame of motion
wrong: **0.83 device px at 50 device px/s** (the near layer at 25 CSS px/s on DPR 2) but only 0.1 px at 6 device px/s.
So judder is a near-layer problem. These ratios don't depend on the drift speed. Chained timers drift because each one
is scheduled from the last actual draw, so lateness accumulates and the phase against vsync wanders. Each time it
crosses a refresh boundary, one frame stays up a refresh longer.

*Analogy for this part:* a timer is a drummer who keeps a decent tempo but drifts against the band's metronome; every
so often a beat is held long and you hear a stumble. Divided animation frames are a drummer who hits exactly every
second (or third) click.

[Verified, MDN *Optimizing canvas*] "With animations, use `requestAnimationFrame()` instead of `setInterval()`"
(https://developer.mozilla.org/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas). [Verified, MDN rAF] "Be sure always
to use the first argument … to calculate how much the animation will progress in a frame — otherwise, the animation will
run faster on high refresh-rate screens."

### 2.3 The drift frame-rate rule

**Need:** `fps_need = max(PACING.minFps, v_max · dpr / PACING.stepPx)`, where v_max is the fastest layer's current
on-screen speed in CSS px/s (drift plus spring velocities, §5 and §8).

- `stepPx` = 0.5 device px [Judgment]: under a third of the smallest star's FWHM (2.355 × 0.7 = 1.65 device px), and two
  quarter-pixel phase steps (§3).
- `minFps` = 20 [Judgment]: below about 20 Hz even sub-pixel steps start to read as discrete updates.

**Divisor:** `k = max(⌊refreshHz / fps_need⌋, ⌈refreshHz / fps_cap⌉, 1)`. Draw on every k-th animation frame, so the
rate is refreshHz / k.

- Caps [Judgment]: 30 fps on narrow screens (phone GPUs pay most for a full-screen frame, §4.6); 30 fps after the first
  ADAPT step; on software raster, a CPU budget (§6).
- Hysteresis: lower k (more frames) at once; raise k only after the lower need has lasted 0.5 s.
- WebKit's clock: if the measured interval is 15 ± 0.4 ms (66.7 Hz is not a real display rate), use k = 1. Dividing
  it would beat against the screen (33.3 vs 30 Hz).

[Measured] `out-fps-table.txt` (the near layer sets v_max):

| Near layer (CSS px/s) | DPR | fps needed | 60 Hz: k, rate, px/frame | 120 Hz: k, rate, px/frame | Phone (cap 30) |
|---|---|---|---|---|---|
| 5 | 2 | 20 | 3, 20, 0.50 | 6, 20, 0.50 | 20, 0.50 |
| 7.5 | 2 | 30 | 2, 30, 0.50 | 4, 30, 0.50 | 30, 0.50 |
| 10 | 1 | 20 | 3, 20, 0.50 | 6, 20, 0.50 | 20, 0.50 |
| 10 | 2 | 40 | 1, 60, 0.33 | 3, 40, 0.50 | 30, 0.67 |
| 15 | 2 | 60 | 1, 60, 0.50 | 2, 60, 0.50 | 30, 1.00 |
| 25 | 1 | 50 | 1, 60, 0.42 | 2, 60, 0.42 | 30, 0.83 |
| 25 | 2 | 100 | 1, 60, 0.83 | 1, 120, 0.42 | 30, 1.67 |

**Battery lever for R1.** On a DPR 2 laptop at 60 Hz, a near layer at ≤ 7.5 CSS px/s draws at 30 fps; at 10 CSS px/s it
needs 60 fps. On WebKit (every frame, 66.7 Hz), a jolt stays ≤ 0.5 device px only if the near layer is ≤ 33 device px/s
(≤ 16 CSS px/s at DPR 2).

**Refresh estimate** [Judgment]: the median of the last 16 rAF deltas, ignoring deltas over 1.5× the current estimate
(dropped frames). Start at 16.7 ms. Timestamps are coarsened to 100 µs in non-isolated contexts [Verified, MDN
`performance.now`], which is harmless here.

### 2.4 How drift interacts with twinkle, fades, transients and scrolling

| Subsystem | Today | Proposed demand | Effect while drifting |
|---|---|---|---|
| Moving transient, scrolling (full motion) | rAF every refresh | `{ fps: ∞, vsync: true }` → k = 1 | unchanged |
| Camera moving (drift, springs settling) | none | `{ fps: motionFps(v), vsync: true }` | sets k |
| Lingering train, scrolling (reduced), dusk, quiet ease | 30 fps timer | `{ fps: 30, vsync: false }` | rides the rAF clock and lowers k if needed (k ≤ ⌊Hz/30⌋) |
| Twinkle | 15 fps timer (10 after a step-down) | `{ fps: 15, vsync: false }` | already met (rate ≥ 20); twinkle gets smoother for free |

With nothing moving (reduced motion, reading at drift 0, the idle sleep), the timer paths stay exactly as today: no
motion, so no judder, and the thread sleeps between frames.

### 2.5 Idle behavior: battery against "some movement even when not scrolling"

[Judgment] **Drift runs while the visitor is present, and stops when they're gone.**

1. **Presence signals:** scroll (today), plus a new `pointer` message and a throttled `activity` ping (pointerdown,
   keydown, focusin; §8), plus visibility. Someone reading the hero and moving the mouse keeps the sky moving. Today the
   twinkle fades at 90 s even then.
2. **One idle gate for all ambient motion (DRY):** rename `idleTwinkle` to `presenceLevel(now)`, still built on
   `FRAME.idleSleepMs` = 90 s and `idleFadeMs` = 4 s. Twinkle and drift both scale by it; meteors pause as today. At
   90 s the drift has eased to 0. The camera keeps its position, the clock sleeps, and CPU use drops to 0.
3. **Wake:** any presence signal eases the drift in over about 2 s, from the same position, with no jump.
4. **Per scene** (R4 decides): hero 1, reading 0, end 1. Reading at 0 keeps today's "still sky while reading" and lets
   the worker sleep under body copy. Scroll parallax still moves the stars while the visitor scrolls.

Weighing it: a continuously drifting sky costs 20–60 frames/s of full-canvas work. That is about 1–3% of a core on a
laptop, plus a full-screen composite per frame; the GPU part is not free on phones (§4.6). The 90 s gate bounds the cost
for tabs left open in the foreground, and the presence signals cover the user's actual complaint: motion while they look
without scrolling. If testing shows 90 s is too short, `FRAME.idleSleepMs` is the one knob. WCAG 2.2.2 is §11's risk 1.

### 2.6 Phase 2 (only if device tests ask for it): a WebKit frame relay

WebKit's worker clock is unaligned and unthrottled (§2.1): it jolts about 4.5 times/s and draws at 66.7 Hz even in Low
Power Mode. A relay would fix both, because WebKit's **main-thread** rAF is vsync-driven and throttled:

- The worker detects the clock (§2.3) and posts `{ type: 'relay', on: true }` while it needs vsync frames.
- `mountSky` runs a main-thread rAF loop that posts `{ type: 'tick' }`, and the worker draws on each tick. Main-thread
  cost [Estimate]: about 10–30 µs per frame.

Cost: the sky's frames become coupled to main-thread jank. Chrome's guidance is the reverse: "the busy main thread does
not influence the animation running on a worker … use worker.requestAnimationFrame" [Verified,
https://developer.chrome.com/blog/offscreen-canvas, read from GoogleChrome/developer.chrome.com]. In WebKit, worker
frames reach the layer contents from the worker thread (`PlaceholderRenderingContext.cpp`: `copyFrame`, then only a
metadata hop to the main thread), so today's WebKit path is not main-thread-bound. Hence phase 2: ship without the
relay, test on iPhones, and add it only if the judder or the Low Power Mode drain shows.

The WebKit power guidance (https://webkit.org/blog/8970/how-web-content-can-affect-power-usage/; unreachable here,
known only from search summaries) advises minimizing timer wake-ups and continuously animating content when the user
isn't interacting. That supports the idle gate, not drift at all costs.

---

## 3. Sub-pixel rendering

### 3.1 Why snapping fails for drift

`Math.round` makes a star hop whole device pixels, so a slow star moves in visible ticks: at 3 CSS px/s on DPR 2, one
hop every 167 ms (every 333 ms on DPR 1), with up to 0.5 px of position error. Snapping was right for a still sky; with
a drift, every star is always moving.

### 3.2 Option (a): fractional `drawImage` (bilinear)

[Verified, WHATWG `drawImage`] With smoothing on, "the user agent may use any filtering algorithm (for example bilinear
interpolation or nearest-neighbor)", and samples outside the source rectangle but inside the image read the image. The
output at fractional positions is therefore engine-defined. MDN advises: "Avoid floating-point coordinates and use
integers instead … This forces the browser to do extra calculations to create the anti-aliasing effect."

[Measured] `shimmer.mjs` replicates `gaussianAt` and `paintSprite` exactly (4×4 supersampled pixel-area Gaussian,
center pixel = 1, 8-bit alpha), then bilinearly resamples the phase-0 sprite. For **σ = 0.7 device px**
(`MIN_CORE_SIGMA_DEVICE_PX`):

| Sub-pixel phase | Bilinear: peak | Bilinear: σ_eff | Phased sprite: peak (max pixel) | Phased: σ_eff |
|---|---|---|---|---|
| (0, 0) | 1.000 | 0.689 | 1.000 | 0.689 |
| (0.25, 0) | 0.855 | 0.813 | 0.949 | 0.691 |
| (0.5, 0) | 0.710 | 0.851 | 0.804 | 0.690 |
| (0.25, 0.25) | 0.731 | 0.813 | 0.898 | 0.694 |
| **(0.5, 0.5)** | **0.504** | **0.851 (+24%)** | **0.647** | 0.699 |

- **Flux** (total light) is 3.588 in every case. Both methods keep the star's light; bilinear changes how it is spread.
  [Verified analytically] Bilinear adds variance φ(1−φ) per axis: σ² 0.49 → 0.74 at φ = 0.5.
- **What the eye sees.** I blurred each image with a Gaussian eye PSF:
  - σ_e ≈ 0.3 device px: DPR 1 at 60 cm, where 1 px ≈ 1.6′;
  - σ_e ≈ 0.6–1.0 device px: a DPR 2 laptop or phone, where 1 px ≈ 0.7′.
  
  The peak at phase (0.5, 0.5), relative to phase 0, is **bilinear 0.506 / 0.715 / 0.851 against phased 0.649 / 0.903 /
  0.994** for σ_e = 0.3 / 0.6 / 1.0. In 1-D motion at (0.5, 0) it is bilinear 0.711 / 0.846 / 0.923 against phased
  0.805 / 0.950 / 0.996.
- **Temporal frequency.** A drifting star crosses one pixel phase cycle per pixel, so the pulse runs at v·dpr Hz: 6 Hz
  for the far layer at 3 CSS px/s on DPR 2. That is a fast sparkle squarely in the flicker-sensitive band, not the
  design's 0.08–0.32 Hz twinkle.
- **Software cost.** [Measured, Skia CPU] 1400 sprites take 4.3–4.4 ms at whole pixels and 7.5–8.3 ms at fractional
  positions (+70–90%).
- **Larger sprites** suffer less. Bilinear at (0.5, 0.5): 0.585 at σ 0.84, 0.665 at σ 1.0, 0.740 at σ 1.2, 0.850 at
  σ 1.7.

These are encoded (sRGB) alpha units. For bright stars the luminance swing is larger in linear light (up to about 2.2×
for the brightest); for faint stars on navy it is about the same.

### 3.3 Option (b): sub-pixel phase sprites in the atlas

Glyph rasterizers render each glyph at a few sub-pixel offsets and place the matching one at whole pixels. Skia packs
**2 bits per axis, so 4 sub-pixel positions in x and in y**, and rounds to the nearest quarter (`kSubPixelPosLen = 2u`,
`kSubpixelRound = 1/8`) [Verified, `src/core/SkGlyph.h`, https://github.com/google/skia/blob/main/src/core/SkGlyph.h].
Here: paint each (tint, shape) sprite at the 16 phases (i/4, j/4), all normalized by the **phase-0** peak so the flux is
equal across phases. Draw the sprite for the star's quantized phase at an integer device position. The filter then acts
as an exact copy in every engine.

The phased sprite above is the image a real point at that position produces on the pixel grid. Its flux and σ_eff stay
constant (0.69–0.70), and only the max pixel varies, which is inherent to the grid. Its perceived peak is 0.90–0.99 on
DPR 2. The residual position error is ≤ 1/8 px.

[Measured] `out-atlas.txt`, replicating `buildStarAtlas`:

| DPR | Sprite sides (shapes 0–5) | Atlas today | 3×3 phases | **4×4 phases** |
|---|---|---|---|---|
| 1 | 7/7/7/7/15/19 | 68×180, 48 KB | 0.38 MB | **0.67 MB** |
| 1.25 | 7/7/7/7/19/23 | 76×218, 65 KB | 0.51 MB | 0.90 MB |
| 1.5 | 7/7/7/7/21/27 | 82×254, 81 KB | 0.64 MB | 1.13 MB |
| 2 | 7/7/7/9/29/35 | 100×326, 127 KB | 1.00 MB | **1.77 MB** |
| 3 (unreachable: capped at 2) | 9/9/11/13/41/53 | 142×488, 271 KB | 2.14 MB | 3.77 MB |

The star rows (8 × 6 × 16 = 768 sprites) get phases; the meteor row doesn't, because the meteor head is drawn
fractionally (it moves fast and is a glow). At DPR 2, a 4×4 block layout gives a texture of about 400×1190, far below
any texture limit.

**Build time** [Measured]. Today's painter (16 `exp()` per pixel) would take 53 / 151 / 316 ms at DPR 1 / 2 / 3 with 16
phases. The 4×4 supersampled Gaussian is **separable**: G(x, y) = g(x)·g(y) with g the 4-sample box-integrated 1-D
profile. The separable painter takes **0.64 / 0.76 / 1.45 ms** for all 16 phases, and matches the current sprites to
max |error| = **1.1 × 10⁻¹⁶**. At phase 0 the sprites are byte-identical to today's.

### 3.4 Option (c): snap only resting stars

With continuous drift, stars rest only when the camera does (reduced motion, the idle sleep). [Judgment]

- **Under reduced motion,** snap (`Math.round`, phase 0): exactly today's crisp points, bit-identical.
- **In the idle sleep,** keep the phases, so nothing jumps when the drift stops and later resumes. Snapping at the end of
  the ease-out would make every star jump up to 0.5 device px at once.

### 3.5 Recommendation

**(b) 4×4 phase sprites, drawn at whole device pixels, plus (c) snapping under reduced motion.** The numbers: perceived
peak modulation on DPR 2 falls from 15–29% (bilinear, σ_e 0.6) to 5–10%, and from 8–15% to ≤ 0.6% at σ_e 1.0. The atlas
grows by 0.6–1.65 MB, the build adds under 1 ms, and drawing costs the same as today (whole-pixel destinations; 40–50%
cheaper than fractional on software raster).

**DPR 1 caveat** [Judgment]. Where the eye resolves pixels (σ_e ≈ 0.3), even an ideal renderer shows about a 20%
max-pixel swing for 1-D motion at σ 0.7 (0.805). Consider a floor of about 0.85 device px for drifting stars on DPR ≤ 1
(the swing becomes about 15% for 1-D motion) and decide by eye.

### 3.6 The hardest idea, in plain words

Think of the pixel grid as an ice-cube tray and a star's light as a spoonful of water:

- **Pour it over the middle of one cell** and nearly all of it lands there: one bright pixel, a crisp star.
- **Pour it over a corner** and it splits four ways: four dimmer pixels. The total water (the star's light) is the same;
  only how it divides changes.
- **Rounding (today)** always pours over a cell's middle. Stars look crisp, but a drifting star can only hop a whole cell
  at a time, which you see as ticking.
- **Fractional `drawImage`** pours over the middle and then sloshes the tray to fake the move. The water smears into
  extra cells, so the star blurs and dims each time it crosses a cell edge and sharpens in the middle: a moving star
  pulses.
- **Phase sprites** are 16 trays poured in advance, each at a different spot inside a cell (every quarter of the way
  across and down). To draw a star you pick the tray that matches where it really is and set it on the grid. The light
  lands exactly as a real point there would, so the star glides in quarter-pixel steps without blurring or pulsing.

---

## 4. Cost model

### 4.1 Star math per frame, measured

`bench-stars.mjs` reproduces `drawLayer`'s per-star work (keep test, cull, scale, `easedQuietFactor`, twinkle) on the
real catalog, without the two canvas calls. The hero copy and rails are modeled as 31 rects (the comment in `mountSky`
says about 31 on desktop) or as the 64-rect worst case, with the ease settled (one zone set) or mid-ease (two sets).

| Viewport (stars) | Today: settled, 31 → 64 rects | Today: mid-ease, 31 → 64 rects | **Tile index** (all cases) | No quiet zones |
|---|---|---|---|---|
| 3840×2160 (≈1430) | 0.48 → 0.75–0.85 ms | 0.76–0.90 → **1.29–1.72 ms** | **0.14–0.32 ms** | 0.07–0.08 ms |
| 2560×1440 (≈869) | 0.27–0.36 → 0.40–0.50 | 0.48–0.55 → 0.83–0.87 | 0.09–0.26 | 0.03–0.04 |
| 1440×900 (≈314) | 0.11 → 0.15–0.21 | 0.19–0.20 → 0.30–0.40 | 0.04–0.12 | 0.01–0.02 |
| 390×844 (≈108) | 0.04–0.08 → 0.07–0.13 | 0.08–0.16 → 0.14 | 0.02–0.07 | ≤ 0.01 |

At 60 fps, today's 1.3–1.7 ms worst case is 8–10% of a core spent on quiet math alone; the index brings it to 1–2%.
Twinkle and the loop itself are about 0.07 ms at 1430 stars.

### 4.2 (a)/(b) The exact quiet index (recommended), and why not a Float32Array grid

- **A Float32Array field** (4–16 px cells, interpolated) is *not* exact. `smoothstep` over the 40 px feather has a
  curvature of up to 6/40² px⁻², so bilinear interpolation with 8 px cells errs by about g²/8 · f″ ≈ 0.03 of alpha, more
  at rect corners and where the max over rects switches. Reject it under the brief's exactness constraint.
- **A per-tile rect list** (64 px screen tiles) is exact. Each tile keeps the subsequence of zones whose box, grown by
  `QUIET.feather`, touches the tile, in the original order, for both the `from` and the `to` sets.
  
  The proof: `quietAt` skips every zone whose dx or dy exceeds the feather, `inkAt` reaches even less (only within the
  padded rect), and each takes a **max** over the zones it doesn't skip. So the tile's subset contains every zone that
  can contribute at any point in the tile. Since `easedQuietFactor` is called on a tile-filtered `QuietBlend`, the
  result is the same maximum over the same values, blended by the same formula. That makes it bit-identical, and it
  stays so whatever the veil session changes inside `quietFactor`, `inkAt` or `easedQuietFactor`, as long as a zone's
  reach stays ≤ the index's reach constant.
  
  [Measured] max |diff| = **0** across 4 viewports × 2 rect counts × 2 ease states × 40 camera offsets.
- **Rebuild:** only when the screen-space zones change, which happens on scroll (zones move with the page), on a layout,
  and when an ease starts or ends. Never on drift frames, because the zones are screen-space and stars move under them.
  The build takes [Measured] 0.01–0.23 ms. Change detection compares the arrays with the worker's existing `sameRects`
  (about 0.5 µs for 64 rects).
- **Per-cell culling against the zones** is the same idea seen from the star side: a star in a tile with empty lists
  skips the loop entirely, and most do.
- **Meteors keep their exact checks.** The index is used only by `drawLayer`. `drawMeteor`/`veiledFrom` keep calling
  `quietFactor`/`easedQuietFactor` over all zones; that's the veil session's domain.

### 4.3 (c) Hoisting per-layer constants

[Measured] `bench-hoist.mjs`: hoisting `frame.*` into locals and using indexed loops takes the non-quiet loop from
0.09–0.12 to 0.06–0.07 ms at 1430 stars. That saves 0.02–0.06 ms per frame. Worth doing where it reads naturally
(destructure `frame` once per layer), but **don't inline `twinkleNoise`**: that would duplicate the formula for about
10 µs.

### 4.4 `drawImage` on GPU versus software canvases

- **Software raster** [Measured, Skia CPU via @napi-rs/canvas 0.1.65, a stand-in for Chromium's unaccelerated canvas]:
  - Background (navy `fillRect` plus the haze scaled with nearest-neighbor and blended with `'lighter'`): 24 ms at
    3840×2160, 10–13 ms at 2880×1800, 2.5–2.9 ms at 1.3 Mpx.
  - Sprites: about **3.1–3.7 µs each** at whole pixels and 5.3–6.3 µs fractional.
  - A cached, pre-composited background blit is no cheaper (16 ms at 4K with `source-over`; `copy` is pathological at
    227 ms). The cost is memory bandwidth.
- **GPU canvas** [Estimate; no browser available in this sandbox]: in Chrome each `globalAlpha` set plus `drawImage` is
  a binding call and a recorded paint op. Skia batches the ops into a few textured-quad draws per atlas. I estimate
  **0.4–1.0 µs of worker CPU per star on a desktop and 3–6 µs on a low-end phone**. The GPU work is about 1400 small
  quads, which is negligible. Calibrate with the existing `adapt()` timing (JS time per `draw()`) in a dev build.

### 4.5 Rejected: caching each layer as a pre-rendered bitmap translated per frame

That would be 3 `drawImage` calls instead of 1400:

1. **Additive compositing is not the blocker.** Starlight adds, so summing stars into a transparent layer and then
   adding the layer with `'lighter'` gives the same sum, up to 8-bit rounding.
2. **Per-star twinkle** changes each star's alpha over time. 100% of near stars and 35% of mid stars twinkle, so those
   layers would be re-rendered at the twinkle rate anyway.
3. **Screen-space quiet dimming.** A star's alpha depends on where it sits on *screen* relative to the copy, and the
   layer moves. The factor can't be baked into layer space. It would need a screen-space mask per layer (their keeps
   differ: far 1/0.1, mid 0.6/0, near 0/0) applied with `destination-in` through a scratch canvas: 2–3 extra full-screen
   passes per layer.
4. **Lockstep shimmer.** Translating a whole layer bitmap by fractional offsets resamples every star with the same phase
   at once, so the whole layer breathes in sync at v·dpr Hz, far more visible than independent shimmer. Integer offsets
   bring the ticking back. Phase copies of whole layers would take 16 × 33 MB.
5. **Fill and memory.** One full-screen pass at 4K DPR 1 touches 8.3 Mpx. All 1400 sprites touch about 83 k px
   (96% are 7×7). The cached path costs **more than 100× the GPU fill** per frame, plus 33 MB per layer bitmap.
6. **Dusk emergence** fades each star in by magnitude, which forces re-rendering anyway.

WebGL2 instancing (one draw call, analytic Gaussians per fragment) would cut the canvas-call CPU to about 0.05 ms. But
OffscreenCanvas WebGL2 arrived only in Safari 17 [Verified, BCD], so Safari 16.4–16.x would need a second renderer.
Context loss needs handling, and at ≤ 1400 stars the 2D path fits the budget. Revisit only if star counts grow by 10×.

### 4.6 Per-frame budget at the drift rate

Assumptions: [Estimate] desktop JS is about 1.5× this Xeon vCPU and a low-end phone (Cortex-A53/A55 class) about 5×
slower; GPU canvas calls cost 0.4–1.0 µs (desktop) and 3–6 µs (phone) per star. Phone GPU fill (about 2–4 ms for 1.3 Mpx
× 2 passes plus the compositor's composite) is an estimate from Mali-G52-class fill rates, to be measured.

| Per frame | Desktop GPU (4K CSS, DPR 1) | Low-end phone (canvas DPR 2) | Software raster |
|---|---|---|---|
| Stars drawn | 1400 | 1400 (hypothetical) / **108 (real)** | 1400 at 4K DPR 1 / 314 at CSS res |
| Star math today | 0.48–1.72 [M] | 2.4–8.6 / 0.2–0.8 [E] | same as left [M] |
| Star math with tile index | 0.14–0.32 [M] (≈0.1–0.2 on a desktop) | 0.7–1.6 / 0.1–0.35 [E] | 0.14–0.32 / 0.04–0.12 [M] |
| `globalAlpha` + `drawImage` | 0.6–1.4 [E] | 4.2–8.4 / 0.3–0.65 [E] | 4.3–4.4 / 0.8–1.0 [M] (fractional +70–90%) |
| Navy + haze | ≈0.02 CPU; GPU 0.2–0.5 [E] | GPU 2–4 [E] | 24 / 2.5–2.8 [M] |
| Transients (one meteor) | ≈0.05–0.1 [E] | ≈0.3 [E] | ≈0.5 [E] |
| **Worker CPU total** | **≈0.8–1.7 ms** | **5–10 / 0.4–1.0 ms** | **≈29 / 3.3–3.9 ms** |
| Drift rate (near layer 10 CSS px/s) | 20 fps (60 Hz, k = 3) | capped at 30 fps | off / 20 fps (budget) |
| CPU share at that rate | 1.6–3.4% of a core | 1.2–3% (108 stars) | — / 6.6–7.8% |

A 1440×900 laptop at DPR 2 (314 stars) costs about 0.2–0.4 ms of CPU per frame: 1–2.4% of a core at 60 fps, or 0.8–1.6%
at 40 fps on 120 Hz.

---

## 5. Camera geometry in `drawLayer`

### 5.1 Per-layer offsets and the generalized loop

Each layer gets an `(offsetX, offsetY)` from the camera (§9.2): its drift accumulator, plus scroll parallax
(`scroll × LAYERS[layer].parallax`, as today), plus pointer parallax. The cell range uses the offsets on both axes:

```ts
const { x: offsetX, y: offsetY } = frame.offsets[layer]
const x0 = Math.floor((offsetX - EDGE) / CELL_SIZE)
const x1 = Math.floor((offsetX + width + EDGE) / CELL_SIZE)
const y0 = Math.floor((offsetY - EDGE) / CELL_SIZE)
const y1 = Math.floor((offsetY + height + EDGE) / CELL_SIZE)
for (let cy = y0; cy <= y1; cy++) {
	// The catalog repeats every FIELD_PERIOD cells, so a wrapped offset finds the same stars
	const wy = wrapCell(cy)
	const shiftY = (cy - wy) * CELL_SIZE - offsetY
	for (let cx = x0; cx <= x1; cx++) {
		cells++
		const wx = wrapCell(cx)
		const shiftX = (cx - wx) * CELL_SIZE - offsetX
		for (const star of field.cell(layer, wx, wy)) {
			if (star.keep >= keep) continue
			// Subtract in doubles before anything reaches the canvas, whose coordinates are float32
			const x = star.x + shiftX
			const y = star.y + shiftY
			// …cull, emergence, quiet (index), twinkle as today, then placeStar (§9.2)
		}
	}
}
```

### 5.2 Key range, precision, wrap

- **Key range.** `((cx + 0x8000) * 0x10000 + (cy + 0x8000)) * 4 + layer` is valid for cx, cy in [−32768, 32767], so
  offsets must stay within ±8,388,608 CSS px. At 25 px/s that is 3.9 days of continuous motion. Past it, keys would
  collide (cy bleeding into cx).
- **Precision.** JS doubles are exact enough forever: at 8.4 M px the ulp is about 2 × 10⁻⁹ px. The real risk is
  canvas float32: never pass large coordinates through `ctx.translate`. Subtract in JS first, as above.
- **Wrap** [Judgment]: `FIELD_PERIOD = 0x10000` cells and `wrapCell(c) = ((c + 0x8000) & 0xffff) - 0x8000`. This is the
  identity for every cell within the key range, so **the catalog does not change in any state reachable today**, and
  the sky would repeat only after 16.8 M px (7.8 days at 25 px/s). Also wrap each drift accumulator,
  `offset - PLANE * Math.round(offset / PLANE)` with `PLANE = FIELD_PERIOD * CELL_SIZE`, to keep the numbers small. The
  wrap is seamless because the field is periodic. Wrap each **layer's own accumulator**, not one shared camera value
  scaled by per-layer factors, which would need a common period.

### 5.3 Cache trim under continuous drift

[Measured] `bench-cells.mjs`: a far cell holds 14 stars and takes 4.7–4.8 µs to generate; a mid cell 4.7 stars and
1.8–1.9 µs; a near cell 1 star and 0.6–1.0 µs.

The visible cells are 3 × 7 × 5 = 105 on a 1440×900 viewport and 3 × 17 × 10 = 510 at 4K. A drift of 25/10/3 px/s
(near/mid/far) adds about 0.7 cells/s (laptop) to 1.5 cells/s (4K). The 4× threshold is then reached every 7–17
minutes, and `cells.clear()` regenerates every visible cell in one frame: a 0.25–1.2 ms spike plus garbage collection.
That's not thrashing, but it is an avoidable hitch.

[Judgment] **Stamp-based eviction:** `field.beginFrame()` bumps a frame counter, `cell()` stamps what it returns, and
`trim()` (when the cache holds more than 2× the visible cells) deletes only cells not stamped this frame. Visible cells
are never regenerated. At the threshold the cache holds about 13 k stars, roughly 2.7 MB.

### 5.4 EDGE margin for halos

The largest sprite's half-side in CSS px is 9 at DPR 1, 8.5 at DPR 2 and 8.7 at DPR 3 (3σ of the 2.8 px halo, rounded
up). EDGE = 24 covers it with room to spare, and per-star culling is continuous, so a star slides in from outside the
viewport without popping. Keep 24 and document the bound next to it. New bodies with larger halos (R2: comets, planets)
need their own margins, sized by their sprites.

---

## 6. Interactions with existing systems

| System | Proposal |
|---|---|
| Reduced motion | Drift `level = 0` immediately (no ease-out: stopping is never harmful), springs settled to their targets, pointer target 0, `snap = true` (today's pixels). `parallaxScroll` stays frozen as today. WCAG 2.3.3: motion triggered by interaction (pointer parallax, scroll parallax) must be possible to turn off, and the reduced-motion preference is the documented example [Verified, Understanding 2.3.3, github.com/w3c/wcag `understanding/21/animation-from-interactions.html`]. |
| Scene (hero, reading, end) | Add `drift` to `SCENE.*` and `SceneLevels`, mixed by `sceneAt` like `twinkle`. The value is continuous in scroll, and the camera eases its `level` toward the target, so changing scene never changes speed in one frame. Proposed: hero 1, reading 0, end 1 (R4 decides). |
| Emergence / dusk | No camera steps before `exitAt` (the worker sleeps). The drift level target is multiplied by the dusk ramp (0 → 1 over the emergence window), so the sky comes out, then comes alive. |
| Idle sleep | §2.5: one `presenceLevel`. The camera position persists, and `camera.steppedAt = null` while asleep, so the first step after waking has dt = 0. |
| Hidden tab | Frames are cancelled as today (essential on WebKit, whose worker clock would otherwise keep running), and the refresh estimator pauses. On return: dt = 0, then the drift eases in. Optional polish: a **sky clock** that excludes hidden time (`pausedMs`, the same idea as the dusk shift at L453) for twinkle, so twinkle phases don't jump on return (they do today). Transients stay on the worker clock. |
| Adaptive quality (ADAPT) | Step 1 also caps drift at 30 fps (`PACING.slowMaxFps`). Step 2 (CSS resolution) halves the device speed, so `motionFps` falls by itself. Optional: fade the stars that step 1 thins out over about 1 s; today they pop, and a moving sky makes the pop more visible. |
| `probeRaster` | Keep the probe and also record `rasterMs`, scaled to the canvas size after step 2. Software drift cap = ⌊`PACING.softwareCpuShare` × 1000 / rasterMs⌋. Below `PACING.minFps` the sky stays still, as today. [Measured] A 4K software canvas (≈29 ms per frame) stays still; a 1440×900 software canvas at CSS resolution (3.3–3.9 ms) drifts at 20 fps for about 7% of a core. |
| DPR change, resize | The camera works in CSS px, so stars keep their CSS positions. Phases are recomputed from the new device positions. The phased atlas rebuilds in under 1 ms (separable painter). Resize already redraws in the same task (L380). |
| Meteor scheduler and veil | Transients stay in screen space, so the veil planning is unchanged. Stars stay veiled per star position on every frame (the index is exact), which is the property the veil session asked us to keep. |

---

## 7. Several concurrent transients

### 7.1 Invariants from the veil session (coordinator update)

1. **Hands off until their commit lands:** `veiledFrom`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the
   `layout` handler) and the `scroll` handler. This design only *reads* their state: `parallaxScroll`, `quietBlend(t)`,
   `scrollY`.
2. **Their likely changes:** `planMeteor` split into a long pass and a short fallback; the scroll handler cancelling or
   fading an in-flight transient about 16–24 px from launch; mid-ease layout deferral; maybe per-rect text classes.
   Hence:
   - the base transient type carries `launchScrollY`, so their rule ports to a list unchanged;
   - the quiet index's reach is one constant to update if per-class reaches appear;
   - the meteor spec wraps whatever `planMeteor` becomes.
3. **One ink lease at a time.** A transient whose planned path comes within `QUIET.feather` of copy holds the lease
   (`nearCopy: true`) until it retires, including its train. While the lease is held, the scheduler plans the next
   transient with near-copy paths forbidden. Transients that stay in clear sky may overlap freely.
4. **Every kind** goes through the same veil checks and ink budget and obeys the scroll rule. That is a property of each
   kind's `plan` and of the shared scroll rule; the scheduler enforces the lease.

**Coordination asks.**

- `planMeteor` should return `nearCopy` on the planned `Meteor` (today it is a local in `planFlight`) and accept an
  "avoid copy" option, so the lease needs no re-check outside their code.
- `scene.ts` should export the zone reach (`QUIET_REACH`) next to `quietAt`, so the index can't fall out of step with it.

### 7.2 Types (in `src/lib/sky/transients.ts`, DOM-free)

```ts
import { METEOR, TRANSIENTS } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, planMeteor, type Meteor, type MeteorField, type Point } from './meteors'
import { between } from './random'

/** Short-lived sky events. Each kind plans and times itself; one scheduler launches them all. */
export const TRANSIENT_KINDS = ['meteor'] as const

/** One kind of transient (R2 adds more: satellites, bursts, …). */
export type TransientKind = (typeof TRANSIENT_KINDS)[number]

/** Bookkeeping every transient carries, whatever its kind. Times are seconds on the worker clock. */
interface TransientState {
	startedAt: number
	/** Seconds it stays visible after launch: its light, then its wake or train. */
	lifetime: number
	/** Its planned path comes within QUIET.feather of quiet copy: it holds the single ink lease until it retires. */
	nearCopy: boolean
	/** scrollY at launch: the scroll rule (owned by the veil session) ends or fades it once the page moves. */
	launchScrollY: number
}

/** A shooting star: the flight exactly as meteors.ts plans it. */
export interface MeteorTransient extends TransientState {
	kind: 'meteor'
	meteor: Meteor
}

/** Any active transient; `kind` selects its planner, clock and drawing. */
export type Transient = MeteorTransient

/** The member of Transient for one kind. */
export type TransientOf<K extends TransientKind> = Extract<Transient, { kind: K }>

/** State each kind keeps between launches. */
export interface TransientMemory {
	meteor: { radiant: Point | null }
}

/** Where and whether transients may launch this moment; the worker fills it from its own state. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the scene allowing it (today's meteorsAllowed). */
	allowed: boolean
	/** No scroll for FRAME.meteorScrollQuietMs. */
	settled: boolean
	narrow: boolean
	secondsSinceReveal: number
	scrollY: number
	/** The viewport and the padded quiet rects in screen CSS px. */
	field: MeteorField
}

/** How one kind is timed and planned. Drawing lives with the canvas code (renderSky.ts). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before the first one. */
	firstDelay(random: () => number): number
	/** Seconds from one launch to the next attempt. */
	gap(random: () => number, secondsSinceReveal: number): number
	/** A plan for the gate's field (near copy only when `nearCopy` allows it), or null when nothing fits. */
	plan(random: () => number, gate: LaunchGate, now: number, nearCopy: boolean, memory: TransientMemory[K]): TransientOf<K> | null
	/** True while it moves on screen: it needs every animation frame. */
	moving(transient: TransientOf<K>, now: number): boolean
	/** Most of this kind in the sky at once. */
	maxActive: number
}

/** The scheduler's state. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	launched: Record<TransientKind, number>
	failedPlans: Record<TransientKind, number>
	memory: TransientMemory
	/** Last launch of any kind (s), for TRANSIENTS.spacing. */
	lastLaunchAt: number
}
```

The registry is typed so that adding a kind without a spec fails to compile:

```ts
const SPECS: { [K in TransientKind]: TransientSpec<K> } = {
	meteor: {
		firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
		gap: nextMeteorGap,
		// Wraps the veil session's planMeteor and the radiant retry now in sky.worker.ts updateMeteor
		plan: planMeteorTransient,
		moving: (transient, now) => meteorMoving(transient.meteor, now),
		maxActive: 1,
	},
}
```

### 7.3 One scheduler

```ts
/** Starts the clocks at the reveal: each kind's first launch waits its own first delay. */
export function revealTransients(schedule: TransientSchedule, random: () => number, now: number): void

/**
 * Retires transients past their lifetime, then launches every kind that is due and allowed: within its own and the
 * global TRANSIENTS.maxActive, TRANSIENTS.spacing after the last launch of any kind, and near copy only while no
 * active transient holds the ink lease. Returns true when the set changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: () => number, now: number, gate: LaunchGate): boolean

/** True while any transient moves on screen. */
export function transientsMoving(schedule: TransientSchedule, now: number): boolean

/** The ink lease is free: no active transient's path comes near quiet copy. */
export function inkLeaseFree(active: readonly Transient[]): boolean {
	return !active.some((transient) => transient.nearCopy)
}
```

New tunables (the numbers are R2's): `TRANSIENTS = { maxActive, spacing, narrowLimit }`. The narrow-screen limit moves
here from `METEOR.narrowLimit`, as a total per visit. The frame demand is in §9.3: any moving transient asks for every
animation frame, and a lingering one asks for 30 fps.

### 7.4 Drawing dispatch (in `renderSky.ts`)

```ts
/** Draws one transient; a kind without a case fails to compile. */
function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame): void {
	switch (transient.kind) {
		case 'meteor':
			drawMeteor(ctx, assets, transient.meteor, frame)
			return
		default: {
			const unknown: never = transient.kind
			return unknown
		}
	}
}
```

A `switch` with a `never` check is used rather than a `Record` of drawers, so that no cast is needed: TypeScript can't
correlate a union value with a record of per-member functions (microsoft/TypeScript#30581).

### 7.5 Module boundaries

All of these follow AGENTS.md's import rules:

- `src/lib/sky/transients.ts` and per-kind models (`satellites.ts`, … for R2) import only their own siblings
  (`./meteors`, `./config`, `./random`, `./scene`).
- Drawing stays in `renderSky.ts` (`drawMeteor` unchanged, `drawTransient` added). If it grows past about 400 lines,
  split out `src/components/sky/renderTransients.ts`, and **add it to AGENTS.md's list of worker files** (`sky.worker.ts`,
  `renderSky.ts`, `skyAssets.ts`), keeping the "only `@/lib/sky/*` by file and each other" rule.

---

## 8. Message protocol: pointer parallax and presence

Main-thread rule (AGENTS.md): `mountSky.ts` imports only types and `@/lib/sky/color` from `src/lib/sky`, so the
pointer constants live in `mountSky.ts`, like `DPR_CAP`.

```ts
// src/lib/sky/protocol.ts, added to SkyMainMessage
	/** A fine pointer's position for parallax: -1..1 from the viewport center (x right, y down); null once it leaves. */
	| { type: 'pointer'; at: { x: number; y: number } | null }
	/** The visitor is still here without scrolling (pointer, keys, focus); at most one per ACTIVITY_INTERVAL_MS. */
	| { type: 'activity' }
	/** Phase 2 only (§2.6): one main-thread animation frame, relayed while the worker asks for it. */
	| { type: 'tick' }

// added to SkyWorkerMessage, phase 2 only
	| { type: 'relay'; on: boolean }
```

```ts
// src/components/sky/mountSky.ts
/** Pointer parallax follows mice and pens only: touch already moves the page by scrolling. */
const PARALLAX_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

/** Presence pings for the sky's idle clock, at most this often (ms). */
const ACTIVITY_INTERVAL_MS = 1000

// Inside mountSky, after the visibility and preference listeners:
const finePointer = matchMedia(PARALLAX_POINTER_QUERY)
let pointerFrame = 0
let pointerAt: { x: number; y: number } | null = null
const sendPointer = () => {
	pointerFrame = 0
	post({ type: 'pointer', at: pointerAt })
}
// At most one message per animation frame, whatever the event rate
const queuePointer = (at: { x: number; y: number } | null) => {
	pointerAt = at
	if (!pointerFrame) pointerFrame = requestAnimationFrame(sendPointer)
}
window.addEventListener(
	'pointermove',
	(event) => {
		if (event.pointerType === 'touch' || !finePointer.matches || motion() !== 'full' || !size.width) return
		// The canvas size from the ResizeObserver: no layout read in the handler
		const x = Math.min(1, Math.max(-1, (event.clientX / size.width) * 2 - 1))
		const y = Math.min(1, Math.max(-1, (event.clientY / size.height) * 2 - 1))
		queuePointer({ x, y })
	},
	{ passive: true, signal }
)
// Leaving the window (no related target) or losing focus: the parallax eases back to center
document.addEventListener('pointerout', (event) => event.relatedTarget === null && queuePointer(null), { passive: true, signal })
window.addEventListener('blur', () => queuePointer(null), { signal })

let lastActivity = -Infinity
const noteActivity = () => {
	const now = performance.now()
	if (now - lastActivity < ACTIVITY_INTERVAL_MS) return
	lastActivity = now
	post({ type: 'activity' })
}
for (const type of ['pointerdown', 'keydown', 'focusin'] as const) window.addEventListener(type, noteActivity, { passive: true, signal })
// In destroy(): cancelAnimationFrame(pointerFrame)
```

Notes [Verified]:

- Chrome 60+ already delays continuous events (`pointermove`, `mousemove`) and dispatches them "right before the
  `requestAnimationFrame()` callback" (https://developer.chrome.com/blog/aligning-input-events, read from
  GoogleChrome/developer.chrome.com). The Pointer Events spec allows coalescing, "for example to align with the display
  refresh rate" (https://w3c.github.io/pointerevents/#coalesced-events). The main-thread rAF throttle makes "at most one
  message per frame" hold everywhere.
- `pointer: fine` and `hover: hover` are supported since Chrome 41/38, Firefox 64 and Safari 9 [BCD]. Filtering by
  `pointerType` per event also handles hybrid touch laptops.

In the worker:

- `pointer` sets the pointer target, and both `pointer` and `activity` call `noteInput(now)` (the existing presence
  function, L107–114).
- Under reduced motion the pointer target is forced to 0 and the springs are frozen.
- The springs are **critically damped and stepped in closed form**: exact for any dt, so 30, 60, 120 and 144 Hz follow
  the same path (§9.2). [Measured] `spring.mjs`: closed form against RK4 at a 10 µs step: |Δ| ≤ 3.4 × 10⁻¹³ px at every
  frame rate. Semi-implicit Euler ends 0.47 px off at 30 Hz but 0.13 px at 120 Hz, so with Euler the sky's position
  would depend on the display. The solution of x″ + 2ωx′ + ω²(x − g) = 0 is the textbook critically damped oscillator
  (http://hyperphysics.phy-astr.gsu.edu/hbase/oscda.html; R1 owns the physics).

---

## 9. Proposed architecture

### 9.1 Module map

```
Main thread
  src/components/sky/mountSky.ts      + pointer and activity listeners (+ phase-2 tick relay); constants live here
  src/lib/sky/protocol.ts (types)     + 'pointer', 'activity' (+ 'tick', 'relay')

src/lib/sky (DOM-free; imports only siblings)
  config.ts       + DRIFT, PACING, CAMERA, POINTER, TRANSIENTS, STAR_PHASES; SCENE.*.drift; FRAME docs updated
  catalog.ts      + FIELD_PERIOD, wrapCell (cellStars unchanged)
  scene.ts        + SceneLevels.drift and its mix in sceneAt (quiet functions untouched: the veil session's)
  camera.ts       NEW  per-layer drift accumulators, scroll and pointer springs, layer offsets, on-screen speed
  pacing.ts       NEW  FrameDemand, combineDemands, motionFps, refreshDivisor, refresh estimator
  quietIndex.ts   NEW  exact per-tile index over easedQuietFactor (stars only)
  transients.ts   NEW  Transient union, per-kind specs, one scheduler, ink lease
  meteors.ts      unchanged by us (the veil session's); wrapped by the meteor spec

Worker (imports only @/lib/sky/* by file and each other)
  sky.worker.ts   frame clock (FrameClock wrapper), demand-based schedule, camera stepping, transient list
  renderSky.ts    drawLayer (offsets, wrap, phases, quiet index), drawSky, drawTransient + drawMeteor
  skyAssets.ts    phased atlas with the separable painter
```

### 9.2 Key types and signatures

```ts
// src/lib/sky/config.ts (numbers marked R1/R4 are theirs to set)
/**
 * Ambient drift: the sky keeps moving when the page doesn't. Velocities are CSS px/s per layer (R1). The speed
 * share eases toward scene × presence × motion over `levelTime` seconds, so no change of scene, idle or wake
 * changes speed in one frame.
 */
export const DRIFT = {
	velocity: { far: [0, 0], mid: [0, 0], near: [0, 0] },
	levelTime: 0.8,
	/** Longest camera step (s): after a stall the sky resumes instead of leaping ahead. */
	maxStep: 0.1,
	/** Below this on-screen speed (CSS px/s) with every spring settled, the camera is at rest and the clock may stop. */
	restSpeed: 0.02,
} as const satisfies { velocity: Record<SkyLayer, readonly [number, number]>; levelTime: number; maxStep: number; restSpeed: number }

/** Frame pacing for motion (see FRAME for the timer paths). */
export const PACING = {
	/** Largest move per frame (device px) that reads as continuous: under a third of the smallest star's width. */
	stepPx: 0.5,
	/** Fewest frames per second for moving stars. */
	minFps: 20,
	/** Narrow screens (phones): their GPUs pay most per full-screen frame. */
	narrowMaxFps: 30,
	/** After the first adaptive step (ADAPT). */
	slowMaxFps: 30,
	/** Share of one core a software-rasterized canvas may spend drifting. */
	softwareCpuShare: 0.08,
	/** Seconds a lower need must last before the clock slows down (speeding up is immediate). */
	slowDownAfter: 0.5,
} as const

/** Sub-pixel positions per device pixel and axis in the star atlas (4, like Skia's glyph cache). */
export const STAR_PHASES = 4
```

```ts
// src/lib/sky/camera.ts
/** A 2D offset (CSS px) or velocity (CSS px/s). */
export interface Vec {
	x: number
	y: number
}

/** A critically damped spring on one axis: it follows its target without overshoot at any frame rate. */
export interface Spring {
	value: number
	velocity: number
}

/** Where each layer's plane sits under the viewport, and how it moves. Mutated in place: no garbage per frame. */
export interface CameraState {
	/** Drift travelled per layer (CSS px), each wrapped to the catalog period on its own. */
	drift: Record<SkyLayer, Vec>
	/** Share of the drift speed in effect, 0-1. */
	level: number
	/** Scroll parallax, following the scroll offset (frozen under reduced motion). */
	scroll: Spring
	/** Pointer parallax, -1..1 per axis. */
	pointerX: Spring
	pointerY: Spring
	/** Seconds of the last step; null after a pause, so the next step is empty and nothing jumps. */
	steppedAt: number | null
}

/** What the camera follows this frame. */
export interface CameraTarget {
	/** Drift speed share: scene × presence × dusk, 0 under reduced motion. */
	level: number
	scrollY: number
	pointerX: number
	pointerY: number
}

export function createCamera(scrollY: number): CameraState
/** Advances to time t (s); the first step after a pause is empty. */
export function stepCamera(camera: CameraState, t: number, target: CameraTarget): void
/** Forget the clock (sleep, hidden tab): the next step starts from here. */
export function pauseCamera(camera: CameraState): void
/** A layer's offset under the viewport (CSS px): drift, scroll parallax and pointer parallax. Writes `out`. */
export function layerOffset(camera: CameraState, layer: SkyLayer, out: Vec): Vec
/** Fastest on-screen speed of any layer right now (CSS px/s), for the frame clock. */
export function cameraSpeed(camera: CameraState): number
/** True when nothing moves until the target changes. */
export function cameraAtRest(camera: CameraState, target: CameraTarget): boolean

/** One critically damped step toward `target`: exact for any dt, so 30, 60 and 120 Hz follow the same path. */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number): void {
	const offset = spring.value - target
	const slope = spring.velocity + omega * offset
	const decay = Math.exp(-omega * dt)
	spring.value = target + (offset + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
}
```

```ts
// src/lib/sky/pacing.ts
/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Frames per second: 0 for none, Infinity for every animation frame. */
	fps: number
	/** Motion: frames must be animation frames, so each lands on a display refresh. */
	vsync: boolean
}

/** Nothing to draw. */
export const NO_FRAMES: FrameDemand = { fps: 0, vsync: false }

/** The strictest of several demands. */
export function combineDemands(demands: readonly FrameDemand[]): FrameDemand
/** Frames per second that keep the fastest layer's move under PACING.stepPx device px per frame (0 at rest). */
export function motionFps(cssPxPerSecond: number, dpr: number): number
/** Draw on every k-th refresh: the largest k that still meets `fps`, at least the k that keeps under `capFps`. */
export function refreshDivisor(refreshHz: number, fps: number, capFps?: number): number

/** Display refresh interval from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes (16.7 until measured). */
	readonly interval: number
	/** The frames come from a fixed timer, not the display (WebKit's 15 ms worker clock): draw every one. */
	readonly unaligned: boolean
	sample(timestamp: number): void
	/** Forget the last timestamp after a pause, so the gap isn't taken for a refresh. */
	pause(): void
}
export function createRefreshEstimate(): RefreshEstimate
```

```ts
// src/lib/sky/quietIndex.ts
/**
 * The quiet zones bucketed by screen tile, so a star looks only at the zones within reach. Exact: a tile keeps every
 * zone whose box grown by the reach touches it, in order, and quietAt and inkAt take a maximum over zones within
 * reach, so the factor equals easedQuietFactor over all zones bit for bit.
 */
export interface QuietIndex {
	/** True when there are no zones at all (the per-star lookup can be skipped). */
	readonly empty: boolean
	/** Rebuilds the buckets when the zones changed (scroll, layout, an ease starting or ending); cheap to call every frame. */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps), reading only the zones near (x, y). */
	factor(x: number, y: number, keeps: QuietKeeps): number
}
export function createQuietIndex(): QuietIndex
```

```ts
// src/components/sky/skyAssets.ts
export interface StarAtlas {
	image: ImageBitmap
	/** Index with starSpriteIndex(tint, shape, phaseX, phaseY). */
	stars: readonly Sprite[]
	meteorCore: Sprite
	meteorGlow: Sprite
}
/** Sprite index for a palette tint, a shape and a sub-pixel phase (0..STAR_PHASES-1 per axis). */
export function starSpriteIndex(tint: number, shape: number, phaseX: number, phaseY: number): number
/** One axis of the 4x4-supersampled pixel-area Gaussian, centered `phase` px right of the sprite's middle pixel. */
function profile(size: number, sigma: number, phase: number): Float64Array

// src/components/sky/renderSky.ts
export interface SkyFrame {
	// …existing fields; `parallaxScroll` is replaced by:
	/** Each layer's offset under the viewport (CSS px), from the camera. */
	offsets: Readonly<Record<SkyLayer, Vec>>
	/** Whole-pixel stars (reduced motion: today's crisp points); otherwise quarter-pixel phases. */
	snap: boolean
	/** Exact quiet lookup for stars (drawMeteor keeps easedQuietFactor over frame.quiet). */
	quietIndex: QuietIndex
}
export interface StarField {
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Starts a frame: cells looked up from now on count as visible. */
	beginFrame(): void
	/** Drops cells this frame didn't use once the cache holds more than twice the visible ones. */
	trim(): void
}
```

`placeStar` replaces renderSky.ts L127–132:

```ts
/** Top-left device pixel of the sprite placeStar picked (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a star centered at (px, py) device px, and its top-left whole pixel in `corner`. A moving star uses
 * the sprite pre-rendered at its nearest quarter-pixel phase, so it glides without blurring; `snap` rounds to whole
 * pixels (reduced motion), which draws exactly today's points.
 */
function placeStar(atlas: StarAtlas, star: Star, px: number, py: number, snap: boolean): Sprite | undefined {
	let ix = snap ? Math.round(px) : Math.floor(px)
	let iy = snap ? Math.round(py) : Math.floor(py)
	let phaseX = snap ? 0 : Math.round((px - ix) * STAR_PHASES)
	let phaseY = snap ? 0 : Math.round((py - iy) * STAR_PHASES)
	if (phaseX === STAR_PHASES) {
		ix++
		phaseX = 0
	}
	if (phaseY === STAR_PHASES) {
		iy++
		phaseY = 0
	}
	const sprite = atlas.stars[starSpriteIndex(star.tint, star.shape, phaseX, phaseY)]
	if (!sprite) return undefined
	const half = (sprite.size - 1) / 2
	corner.x = ix - half
	corner.y = iy - half
	return sprite
}
```

### 9.3 The frame-scheduling state machine, before and after

**Before** (`frameMode`, first match wins):

```
 message, timer or rAF tick ──► frameMode(now)
   ├─ no ctx · hidden · motion off · before dusk ............ SLEEP
   ├─ meteor moving · scrolling (full) ...................... ACTIVE   rAF on every refresh
   ├─ train · scrolling (reduced) · dusk · quiet ease ....... FADE     setTimeout 33 ms
   ├─ full · not idle (scroll in 90 s) · scene twinkle > 0 .. TWINKLE  setTimeout 67 ms (100 ms after step-down)
   └─ otherwise ............................................. SLEEP    one timer for the next due meteor
```

**After** (`frameDemand` = the strictest of the subsystems' demands):

```
   transient moving · scrolling (full) ................................ { fps: ∞,            vsync }
   camera moving (drift level > 0, or springs not settled) ............ { fps: motionFps(v), vsync }
   transient lingering · scrolling (reduced) · dusk · quiet ease ...... { fps: 30,           timer }
   twinkle: full · present (any input in 90 s) · scene twinkle > 0 .... { fps: 15 (10),      timer }

 ──► clock
   ├─ fps = 0 ...................... SLEEP   pauseCamera(), estimate.pause(); a timer only for the next due transient
   ├─ any vsync demand ............. FRAMES  rAF on every refresh; draw when needsDraw or ≥ (k − ½) refreshes since the last draw
   │                                         k = max(⌊Hz / fps⌋, ⌈Hz / cap⌉, 1), lowered at once, raised after 0.5 s
   │                                         k = 1 on an unaligned clock (WebKit); cap = 30 narrow · 30 after ADAPT 1 · software budget
   └─ otherwise .................... TIMER   setTimeout at fps (today's fade and twinkle paths)
```

The demand is recomputed after every tick and every message, as `schedule()` does today. Watchdog: a requested frame
that hasn't arrived after 250 ms while visible switches `FrameClock` to a 60 Hz timer.

### 9.4 Perf budget

See §4.6. Headline at 1400 stars: desktop GPU about 0.8–1.7 ms per frame (1.6–3.4% of a core at 20 fps); a low-end phone
would need 5–10 ms (never happens: phones draw about 108 stars, 0.4–1.0 ms, capped at 30 fps); software raster about
29 ms (no drift) or 3.3–3.9 ms at CSS resolution on a laptop (20 fps, about 7% of a core).

### 9.5 Exact changes, by file and current line

**`src/components/sky/sky.worker.ts`**

- L16–22 `SkyWorkerScope`: keep it, and add a `FrameClock` wrapper (feature detection, `null` sentinel, 250 ms
  watchdog, timer fallback).
- L24 `FrameMode`: remove; use `FrameDemand` from `@/lib/sky/pacing`.
- L63–66 `meteor`, `radiant`, `launched`, `failedPlans`: become `schedule: TransientSchedule` (after the veil commit,
  porting their `updateMeteor` logic into the meteor spec).
- L86–99 `isIdle`, `idleTwinkle`, `twinkleLevel`: `presenceLevel(now)`, shared by twinkle and the camera's level target.
- L106–114 `noteInput`: also called from `pointer` and `activity`.
- L116–127 `frameMode`: becomes `frameDemand` (§9.3).
- L129–133 `frameInterval`: removed (`demand.fps`).
- L135–141 `cancelFrames`: `clock.cancel()`, `pauseCamera()`, `estimate.pause()`.
- L152–168 `schedule`: demand-based (sleep, frames, timer).
- L171–180 `onTimer`, `onFrame`: `estimate.sample(timestamp)` on animation frames.
- L183–190 `tick`: the divisor decision.
- L193–224 `updateMeteor`: `updateTransients` (after the veil commit).
- L246–267 `frameAt`:
  - step the camera and fill `offsets`;
  - `quietIndex.update(quietBlend(t), …)`, consuming the veil session's `quietBlend` unchanged;
  - `snap: motion !== 'full'`;
  - optionally a twinkle clock that excludes hidden time.
- L270–283 `draw`: `drawTransient` for each active transient.
- L286–303 `adapt`, `stepDown`: the step-1 drift cap; optionally fade the thinned stars.
- L309–320 `probeRaster`: keep the measured ms for the software budget.
- L397–487 messages:
  - add `pointer` and `activity` (and phase 2 `tick`);
  - `motion`: freeze the camera under reduced motion;
  - `visible`: pause the camera and the estimate;
  - **do not edit `scroll` or `layout`** (veil session).

**`src/components/sky/renderSky.ts`**

- L23–51 `StarField`: stamp-based `beginFrame`/`trim`; callers pass wrapped cells.
- L62–87 `SkyFrame`: `offsets`, `snap`, `quietIndex` replace `parallaxScroll` in `drawLayer`.
- L92–93 `EDGE`: keep 24 and document the ≤ 9 CSS px halo bound.
- L96–137 `drawLayer`: the §5.1 loop, `quietIndex.factor` at L120, `placeStar` for L127–132.
- L140–157 `drawSky`: `field.beginFrame()`/`trim()`.
- L201–261 `drawMeteor`: unchanged; called from `drawTransient`.

**`src/components/sky/skyAssets.ts`**

- L15–30: phases in `StarAtlas`, plus `starSpriteIndex`.
- L44–55 `gaussianAt`: becomes `profile` (separable; identical values).
- L62–78 `paintSprite`: phase-aware, normalized by the phase-0 peak.
- L81–120 `buildStarAtlas`: 4×4 phase blocks for the star rows.

**`src/lib/sky/` (shared model)**

- `config.ts`: `DRIFT`, `PACING`, `CAMERA` (spring ω), `POINTER` (shift per layer, R4), `TRANSIENTS` (R2), `STAR_PHASES`;
  `SCENE.hero/reading/end.drift`; `FRAME` docs.
- `scene.ts` L11–18, L24–38: `drift` in `SceneLevels` and `sceneAt`. Nothing else in `scene.ts`.
- `catalog.ts`: export `FIELD_PERIOD` and `wrapCell`.
- `protocol.ts` L35–70: the §8 messages.

**Elsewhere**

- `src/components/sky/mountSky.ts`: after L247, the §8 listeners; `cancelAnimationFrame(pointerFrame)` in `destroy`
  (L249–259).
- **New files:** `src/lib/sky/camera.ts`, `pacing.ts`, `quietIndex.ts`, `transients.ts`.
- **AGENTS.md:** only if a new worker file is split out.

### 9.6 Implementation order

1. **No visible change, all the infrastructure.**
   - The phased atlas with the separable painter.
   - The generalized `drawLayer`, with the camera fixed at today's offsets (x 0, y = parallax).
   - The exact quiet index.
   - Stamp-based trim and `FrameClock`.
   
   Verify: with `snap = true` the output is pixel-identical to today; the index test shows max |diff| = 0.
2. **Pacing:** `FrameDemand`, the divisor and the estimate replace `frameMode`. The timer paths stay as they are.
3. **Camera:** `DRIFT`, presence, `SCENE.*.drift`, the dusk ramp and reduced-motion freezing.
4. **After the veil commit:** the transient list, the ink lease, and the scroll rule ported to every kind.
5. **Pointer parallax and the activity ping.**
6. **Phase 2, if device tests ask for it:** the WebKit relay.

Verify every step with `npm run lint` and `npm run type-check` (AGENTS.md).

---

## 10. Key recommendations

- **Draw motion on animation frames divided by whole numbers.** Request a frame on every refresh, draw on every k-th:
  k = max(⌊Hz / max(20, v·dpr/0.5)⌋, ⌈Hz / cap⌉, 1), lowered at once and raised after 0.5 s. Keep timers only for
  motionless fades and twinkle. Step the camera with the rAF timestamp.
- **Treat WebKit's 15 ms worker clock as unaligned.** Detect it (median interval 15 ± 0.4 ms) and draw every frame.
  Keep a main-thread relay as a phase-2 option for judder or Low Power Mode drain, decided by iPhone tests.
- **Wrap `requestAnimationFrame` in a `FrameClock`:** feature detection, a `null` sentinel (IDs can wrap to 0), and a
  250 ms watchdog that falls back to a 60 Hz timer (Chrome returns id 0 and never calls back when its frame provider is
  invalid).
- **Use 4×4 quarter-pixel phase sprites at whole device pixels** (Skia's glyph-cache scheme). The phased atlas is
  1.77 MB at DPR 2 (0.67 MB at DPR 1) and builds in under 1 ms with the separable painter, which is identical to today's
  sprites at phase 0. Keep `Math.round` (phase 0) under reduced motion, for bit-identical stars. Don't use fractional
  `drawImage`: a 49% peak swing at (0.5, 0.5) and a v·dpr Hz pulse.
- **Add the exact per-tile quiet index for stars:** about 5× less star math (1.29–1.72 → 0.24–0.32 ms worst case at
  1430 stars), bit-identical, built over the veil session's own `easedQuietFactor`, rebuilt only when the zones change.
  Meteors keep their full checks.
- **Don't cache layers as bitmaps:** screen-space quiet dimming, per-star twinkle, lockstep shimmer, and more than 100×
  the fill. Don't move to WebGL2 at these star counts (Safari 16.4–16.x lacks OffscreenCanvas WebGL).
- **Give each layer its own wrapped drift accumulator.** Wrap cell lookups at 2^16 (the key range, so the catalog never
  changes). Evict cache cells by frame stamp. Keep EDGE = 24.
- **Treat presence as scroll, pointer, keys, focus or visibility,** behind one 90 s idle gate shared by twinkle and
  drift (4 s ease-out, then sleep, position kept, 2 s ease-in on return). Drift 0 in the reading scene (R4 to confirm).
  Freeze the drift under reduced motion.
- **Cap the drift:** 30 fps on narrow screens; 30 fps after ADAPT step 1; a CPU budget on software raster (about 8% of a
  core, otherwise still).
- **Run transients through one discriminated union with typed per-kind specs and one scheduler.** At most one ink lease
  (a near-copy path) at a time; `launchScrollY` on every transient for the veil session's scroll rule; vsync frames
  while any transient moves.
- **Pointer parallax:** a passive `pointermove`, mouse and pen only, normalized to −1..1 with the ResizeObserver size,
  at most one message per frame, `null` on leave. Closed-form critically damped springs, which are exact at any frame
  rate.

## 11. Risks and open questions

1. **WCAG 2.2.2 (Level A).** Automatic moving content that "lasts more than five seconds" alongside other content
   needs "a mechanism for the user to pause, stop, or hide it" [Verified, WCAG 2.2 SC text and Understanding,
   github.com/w3c/wcag]. The Understanding document counts "animations" as moving content. Its sufficient techniques are
   G4, SCR33, G11, G152, SCR22, G186 and G191; `prefers-reduced-motion` (C39) is listed under 2.3.3, not here. The idle
   gate and reduced motion reduce exposure but are **not** a conforming mechanism.
   
   Proposal for the planner, R4 and the user: a site-level "Pause animation" control that maps to the worker's existing
   `motion: 'reduced'`, persisted in `localStorage` and read by `mountSky`'s `motion()`. No new worker protocol needed.
2. **WebKit's worker clock** (verified in source): unaligned and unthrottled. It jolts about 4.5 times/s on 60 Hz, draws
   about 7% of its frames for nothing, and ignores Low Power Mode. The relay trades this for coupling to main-thread
   jank. Decide by testing on iPhone and macOS Safari. The near-layer speed bounds the jolt size (§2.3).
3. **DPR 1 shimmer is inherent to the pixel grid.** At σ 0.7, about 20% (1-D) to 35% (diagonal) max-pixel swing, which
   is perceptible where pixels are resolved. A floor of about 0.85 device px for drifting stars on DPR ≤ 1 may be
   needed. Decide by eye.
4. **The phone GPU cost is an estimate** (about 2–4 ms per full-screen frame). Measure on a low-end Android device; the
   30 fps narrow cap is the hedge. Battery figures generally are estimates; measure with Chrome tracing or Perfetto,
   macOS `powermetrics` and Activity Monitor's Energy Impact, or Android Battery Historian.
5. **Coordination with the veil session:**
   - `planMeteor` exposing `nearCopy` and an "avoid copy" option (the ink lease);
   - porting their scroll-cancel rule to the transient list;
   - a shared `QUIET_REACH` constant if per-class zones arrive (the index's exactness depends on it);
   - their `quietBlend` allocates new zone arrays every call, so each drift frame makes about 64 objects (minor GC;
     caching by scrollY and layout is up to them).
6. **The near-layer speed decides battery** (§2.3): above 7.5 CSS px/s on DPR 2, a 60 Hz laptop needs every refresh. R1
   should weigh the depth cue against frame count.
7. **A scroll spring changes today's tuned parallax.** Exact following becomes lagged following, and stars keep moving
   briefly after a fling. R4 decides; if it's adopted, its velocity feeds `motionFps`.
8. **The haze stays screen-fixed** while stars drift. That matches an Earth-rotation reading (airglow and light are
   atmospheric, stars celestial), but R1/R4 should confirm. Meteors stay screen-space for the same reason, and because
   the veil planning is screen-space.
9. **Existing pops become more visible with motion:** adaptive thinning (step 1) removes 20% of stars in one frame, and
   twinkle phases jump after a hidden tab. Both have cheap fixes (§6), but they are optional.
10. **Engine details can change.** Chrome's `kThrottleOffscreenCanvasTo60Hz` (off today) or WebKit's worker timer could
    change. The estimate-driven divisor adapts to whatever cadence arrives; only the WebKit detection is a heuristic.
11. **The benchmarks ran in Node 22.22** (the project uses Node 24 and ships to browsers) on a shared VM. The ratios
    (bilinear against phases, index against today, timer against rAF) are robust; the absolute ms are indicative only.
    Calibrate GPU canvas call costs with `adapt()` timings in a dev build.
12. **Open:** drift velocities and depth factors (R1); per-scene drift, pointer parallax on or off, ease curves and the
    scroll spring (R4); the idle duration, if 90 s feels short (product); transient rates and caps (R2); relay go or
    no-go (device tests).
