# Plan draft: home-sky ambient motion and transients (delivery-and-risk-first)

## 1. Title and status

- **Status:** planning only. This is the delivery-and-risk-first planner's complete draft of `PLAN.md`, written 2026-10-27 for the judge. Nothing in `src/`, configuration or any other repository file was changed.
- **Inputs:** `research/00-shared-brief.md` (the user's request verbatim), `research/01-planning-brief.md`, `../COORDINATION.md`, `../HANDOFF.md`, research reports R1 (physics of depth), R2 (meteors and other bodies), R3 (rendering and scheduling), R4 (motion design and the old sky), the worktree code at master 246c0aa (branch `claude/quirky-carson-btv2u4`), and the Next.js 16.4.2 docs in `node_modules/next/dist/docs`. The research ran in a Linux container: read its `/home/user/Portfolio` as this worktree.
- **Veil dependency:** the meteor-veil session ("Stars and comment animation redesign", `session_01ETNMD4Evfbvs1kq6PPU3AK`, branch `master-r26syw`) owns the veil. On 2026-10-27 its fix had not landed: `origin/master-r26syw` holds only f03ccb3 (an `.env.example` commit), and none of its promised numbers or plan arrived. So every veil-owned function stays off-limits (§5.4), every phase that needs it is marked **BLOCKED**, and §8.5 gives a fallback with the same invariants if the veil work never lands.
- **Evidence labels:** **[computed]** numbers were rerun for this draft with Node 24.14 scripts in this session's scratchpad (`plan-dr/calc-*.mjs` and `plan-dr/h-*.ts`, not committed); **[R1]-[R4]** point to the research reports for derivations and sources; **[code]** cites the worktree as `file:line`.
- **Where this draft is strongest:** the phase plan (§7), the coordination protocol and fallback (§8), the acceptance checklist and budgets with pass/fail numbers (§9, §10), and the risk register (§12).

### 1.1 Deviations from the planning brief

| # | Deviation | Reason |
|---|---|---|
| 1 | The transient scheduler ships **before** the veil boundary, carrying **satellites only** (phase P9); shooting stars join it after the veil commit (P11). The brief says the transient work comes after the veil commit. | Satellites touch no veil-owned function and need no ink: they are planned in clear sky only, drawn with the near layer's keeps (zero light on copy) and faded by a scroll cancel the scheduler applies on its own tick (reading `scrollY`, never editing the scroll handler). Shipping them early delivers part of the user's second request even if the veil never lands, and it retires the scheduler's risk on a simple kind before the hard one. If the judge prefers the brief's order, P9 moves after V0 unchanged. |
| 2 | Fireballs keep today's **1.8-2.5 s** flights (R2 proposed 1.8-3 s). | A 3 s fireball with its 2.4 s train lasts 5.4 s from first light to last, which breaks the 5 s invariant (WCAG 2.2.2) [computed]. Today's 2.5 + 2.4 = 4.9 s passes. |
| 3 | The drift's epicycle **phases** become (0.70, 0.00, 2.09) instead of R1's (0.9, 2.4, 4.7). The brief does not settle phases (R1 left the starting heading open). | With R1's phases the stars start drifting up and to the right at 61° above horizontal, close to the scroll axis (the old sky's "upward" look, and what R4 warns can read as the page scrolling). The new phases keep the stars within 30° of horizontal, drifting right, for 52 of the first 60 s after the reveal (R1's: 16.5 s) [computed]. Cost: the wander bound grows from 190.9 px to 205.2 px at q = 1. |
| 4 | **One** drift-level ease (an exact exponential, time constant 1 s) replaces R1's separate 3 s reveal smoothstep plus R3's 0.8 s level ease. | One mechanism covers the reveal, scene changes, waking from idle and resuming from a pause. It reaches 95% in 3.0 s, so "eases in over 3 s after the reveal" still holds [computed]. |
| 5 | The 40 s crossing cooldown stays the **starting** value, but its acceptance criterion is "crossings per minute at or below today's", not the number 40. | With R2's synthetic crossing shares (16-19% of accepted flights burn out behind copy) a 40 s cooldown gives 0.52-0.59 crossings a minute against today's 0.50 [computed]; parity needs 45 s (16%) to 55 s (19%). The veil session's harness on captured layouts should fix the share, then the cooldown. |
| 6 | `wrapCell` and R3's wrapped per-layer drift accumulators are **dropped** entirely, not kept "defensively". | R1's drift is bounded and its scroll term is bounded by the tallest page a browser can lay out: the largest star offset is 3.76 M px, 14,682 cells, under the 32,768-cell key range [computed]. A guard that can never run is dead code (§6.1.6). |
| 7 | The pause toggle uses the WAI-ARIA toggle-button pattern: a **stable** name with `aria-pressed`. R2 and R4 proposed `aria-pressed` with a label that flips between "Pause" and "Play". | The APG says "it is critical the label on a toggle does not change when its state changes", and a changing label makes `aria-pressed` unnecessary; mixing the two announces a contradiction. |
| 8 | The rAF wrapper lives in a new worker file, `src/components/sky/frameClock.ts`, rather than inside `sky.worker.ts` (R3). | The veil session edits `sky.worker.ts`; new code in a new file keeps our diff there small and the merge cheap. AGENTS.md's list of worker files gains one name. |
| 9 | Several of R4's acceptance thresholds are rewritten to match the settled design (AC-4, AC-7, AC-10, AC-11, AC-15, AC-20, AC-21, AC-24). | R4 wrote them for an unbounded, nearly horizontal drift, a 0.25-device-px step and 40 s satellites; the brief settled R1's epicycles, R3's 0.5 px step and R2's 4.8 s satellites. §9 gives each new threshold with its computed design value. |

## 2. The end goal, worked backwards

### 2.1 What a visitor sees

**After 60 s on the hero, on a laptop, touching nothing.** The loader lifts and the stars come out, brightest first (today's dusk). Within three seconds the whole sky starts to float. Seven in ten stars, the faint dust, barely move: about 1 CSS px a second, at the edge of what anyone notices. The bright stars glide visibly, 3 to 7 px a second. Everything moves the same way at any instant, so the eye reads one deep space, not sheets: the bright stars slide over a nearly still background. For most of the first minute the stars drift to the right, then the heading slowly turns (about two degrees a second, never stopping, never turning back). Stars that slide toward the name and tagline fade as they pass behind the copy and come back on the other side, which puts the page in front of the sky. Twinkle continues as today. In the first minute about five shooting stars cross (after P12-P13; today about two), from different directions, each lighting up and burning out in the sky; about one visit in three also shows a steady satellite gliding for a few seconds before it fades into Earth's shadow.

**Scrolling.** The stars follow the page with depth, bright ones farther, and when the page stops they glide to rest in half a second without bouncing.

**Reading (About and below).** The sky dims as today and slows to about a third: the near stars move about 1 px a second, the faint ones look still, twinkle is off, nothing flies. With the reading drift at 0 (a user decision) it is today's still sky.

**After 90 s without any input** (no scroll, pointer, key or focus), the drift and twinkle ease out over a few seconds and the worker sleeps. The sky keeps its position, and any input brings the motion back gently.

**With reduced motion, or after pressing "Pause sky animation".** The sky is still: no drift, no twinkle, no parallax, no shooting stars or satellites. Under `prefers-reduced-motion` the frames are pixel-for-pixel today's reduced-motion sky.

**On a phone.** The same sky at 0.6 of the drift speed (a phone's CSS pixel looks about 1.35 times bigger), at most 30 frames a second, no satellites, and rarer shooting stars (at most 6 a visit).

### 2.2 The ideas in plain words

- **Depth from motion (a train window).** From a train, the fence rushes by, trees glide and mountains crawl. Nothing moves but you; speed across the window falls with distance, and the brain reads those speed differences as depth. The sky gets the same rule: each star moves by its **nearness** `q` times one camera motion `C`, so `screen = world - q × C`. Scrolling, drifting and leaning toward the pointer all move `C`, never a layer directly, so they can never disagree about which star is nearer [R1 §1-2].
- **A diorama (Disney's multiplane camera).** Real stars are so far away that they show no parallax at all; even New Horizons, 47 AU out, saw the nearest star shift half an arcminute [R1 §2.1]. The depth is an honest artistic conceit: like the 1937 multiplane camera, we hang the stars at modest distances and move one camera past them.
- **Brightness tells distance (streetlights).** On a street of identical lamps, dimmer means farther. Each star's nearness comes from its magnitude, `q(m) = min(1.6, 10^(-0.14 (m - 1.57)))`, so bright = big = fast = near. No new random number is drawn, so the resting sky never changes [R1 §3].
- **Floating, not travelling (epicycles).** The camera rides a main circle with two smaller circles on it at irrational speed ratios, like Ptolemy's planets: always moving, never racing, never stopping, never repeating. Its offset is a pure function of a "drift clock"; slowing the drift slows the clock, never rescales the offset, so nothing jumps [R1 §4].
- **A door closer (critically damped spring).** When the page stops, the stars glide to rest in about half a second without bouncing, and the result is exactly the same at 15, 60 or 144 frames a second, because the spring is solved in closed form [R1 §5].
- **A drummer and a metronome (frame pacing).** A timer is a drummer who drifts against the band, so every so often a beat is held long and moving stars stumble. Moving stars therefore draw on display refreshes, every k-th one; still things keep their cheap timers [R3 §2].
- **An ice-cube tray (sub-pixel sprites).** A star's light is a spoonful of water poured onto a tray of pixels. Rounding always pours over a cell's middle, so a drifting star hops a whole cell at a time. We pour 16 trays in advance, each at a different quarter-pixel spot, and pick the one that matches where the star really is: it glides without blurring or pulsing [R3 §3.6].
- **Meteor, comet, satellite.** What the user calls "the comet" is a **meteor** (a shooting star): a sand-grain of comet dust burning up 100 km up in under a second, like a spark flicked off a grinding wheel. A **comet** is a mountain of ice millions of km away that hangs in the same spot for days, like the lights of a distant ship. A **satellite** is a machine lit by a Sun already set for you: a steady point gliding for minutes, like an airplane with its lights off. A **radiant** is the point a shower's meteors seem to stream from, like snowflakes in your headlights all coming from one spot ahead [R2 §1].

### 2.3 What we tell the user plainly

- The depth is a diorama: real stars show no parallax. The physics inside the diorama is consistent (one camera, one law, the inverse-square law compressed to 70%) [R1 §2-3].
- The new shooting-star rate is a time-lapse: about 120 times a dawn sky, or 10-20 times a strong shower peak [R2 §8.1].
- Skipped on purpose: sky rotation (adds no depth and bends paths), forward dolly or warp (the screensaver look), depth-coded color (physics and perception disagree), depth-dependent twinkle (twinkle is in the air, not in the stars), and the bokeh dust layer (not in v1) [R1 §6-7].

## 3. Decisions for the user

Each has a recommended default; the plan is written so the default works without waiting for an answer, except where marked.

| # | Decision | Recommended default | Alternatives and their cost |
|---|---|---|---|
| D1 | **Pause control: placement and look** (needed before drift ships, WCAG 2.2.2) | In the navbar, as the last item of `#primary-nav` after Resume: on desktop a 40×40 px icon button (green pause glyph, screen-reader-only label); on phones the same element appears in the slide-in menu with its visible label "Pause sky animation". APG toggle: stable name plus `aria-pressed`. Persisted per viewer; starts paused under `prefers-reduced-motion`. | (a) A hero-corner button: adjacent to the motion (G186's other option), but it scrolls away while reading. (b) The footer: least discoverable. (c) The left side rail: desktop only, so phones get no control. Pattern alternative: a label that flips "Pause sky animation" / "Play sky animation" with no `aria-pressed` (never both). |
| D2 | **Does an explicit "play" override the OS reduce-motion setting?** | Yes: the stored choice wins; with no choice stored, reduced motion means paused. It is an explicit, reversible choice made on this page. | Reduced motion always wins: the toggle shows pressed and does nothing (or hides) under it. Simpler, but a visitor who wants the sky cannot get it without changing an OS setting. |
| D3 | **Reading-scene drift** | 0.35 of the hero rate (R1 and R4): near stars about 1 px/s, faint ones look still. | 0: today's still reading sky; the worker sleeps while reading. Cost of 0.35: about 20 drawn frames a second while a present visitor reads (laptop about 0.4-0.8% of a core; phone about 1-2% CPU plus an estimated 4-8% GPU busy), against 0 today (§10). |
| D4 | **Drift speed v₀** | 3 CSS px/s at nearness 1: near stars about 4 arcmin/s, faint about 1 arcmin/s. | 2.5: subtler, same frame cost. 4: more obvious (brightest about 12 arcmin/s at peak, the edge of busy) and it **doubles** the drawn frames on DPR-2, 60 Hz laptops (the need rises from 27 to 36 fps, so the divisor drops from 2 to 1); the threshold is v₀ = 3.3 [computed]. |
| D5 | **Drift heading in the first minute** (epicycle phases) | (0.70, 0.00, 2.09): stars drift right, within 30° of horizontal for 52 of the first 60 s. | R1's (0.9, 2.4, 4.7): stars start drifting up-right at 61° above horizontal, near the scroll axis. Any phases keep the same speed range and turn rates; only the opening heading and the wander bound change. |
| D6 | **Pointer lean** (desktop, fine pointer, hero, full motion) | Build last (P10), after the drift is accepted, with reach 12 px at nearness 1 (R1; brightest ±19 px). | Reach 7 px: R4's 2/4/7 px per layer is the same law at reach 7. Or skip lean: the drift alone carries the depth. |
| D7 | **Which "could" transients ship** | None in v1. If wanted, in this order: near-radiant stationary flashes (cheap; the strongest perspective cue), a static comet (1 visit in 8-10), bursts, earthgrazers, a planet (changes the reviewed sky), two end-bookend farewell meteors. | Each is its own small phase (P15) with its own acceptance item. |
| D8 | **Add a test runner?** | No: verify with scratch harnesses that import the real modules (§7.1) and keep them out of the repository. | Vitest: resolves the extensionless `./x` imports and the `@/` alias, adds a devDependency, a config file and a `test` script, and lets the harness checks run in CI. `node --test` with type stripping: no dependency, but Node's ESM loader rejects the extensionless relative imports in `src/lib/sky` [computed], so every import there would need a `.ts` extension plus `allowImportingTsExtensions`: churn across files the veil session also edits. |
| D9 | **WebKit main-thread frame relay** | None. Ship with "draw every frame" on WebKit's unaligned 15 ms worker clock, then decide by iPhone and macOS Safari tests (P16). | Build the relay (about 40 lines across `mountSky.ts`, the protocol and the worker) if the tests show judder or Low Power Mode drain. It couples sky frames to main-thread jank. |
| D10 | **Satellites before the veil boundary** | Yes (P9, deviation 1). | After V0, with the other transients: the brief's order; nothing else changes. |
| D11 | **Satellite pass length** | 4.8 s at 1.2-2.5°/s (R2): every moving transient stays under 5 s. | 15-20 s at a realistic 0.5-1°/s: allowed once the pause control exists, but it is the longest moving thing near copy and a steady attention draw. |
| D12 | **When to stop waiting for the veil commit** | After P10 (all veil-independent work merged), ask the user: keep waiting, or take over the veil-owned functions under §8.5's fallback. | Set a date instead. |

## 4. Domain model

### 4.1 Entities and their invariants

| Entity | What it is | Invariants |
|---|---|---|
| **Star** | A point on its layer's plane: world position (CSS px from the sky origin), magnitude-derived alpha, shape, tint, thinning key, dusk delay, twinkle, and (P8) nearness `q`. Generated per 256-px cell from a seeded stream (`catalog.ts:132-166`). | Deterministic per cell; every star consumes the same number of random draws (`catalog.ts:128-131`); `q` is a pure function of the magnitude already drawn, so retuning depth never moves a star at rest; at camera zero the sky is the reviewed one. |
| **Layer** | A magnitude band (far 4.5-6, mid 2.5-4.5, near -0.5-2.5) with twinkle and quiet keeps (`config.ts:77-81`). | Drawing order far, mid, near; quiet keeps unchanged by this plan; its nearness range `[q(faintest), q(brightest)]` bounds its culling (P8). |
| **Camera** | `C = C_scroll + C_drift + C_lean` in CSS px at nearness 1; every star appears at `world - q × C`. | Translation only (no rotation, zoom or dolly); one law for every cause; every term bounded (§6.1.6); frozen where it is under reduced motion or the pause; continuous across rate changes, freezes, resumes, idle sleep and hidden tabs. |
| **DriftClock** | `τ`, seconds of drift time: `τ += level × min(dt, DRIFT.maxStep)`. The drift offset is a pure function of `τ`. | Integrated, monotone, never jumps; stops when hidden, asleep or frozen. |
| **Scene levels** | `sceneAt(scrollY, …)` multipliers: stars per layer, haze, twinkle, (P7) drift, the meteor launch gate (`scene.ts:24-38`). | Continuous in scroll; no clock of their own. |
| **Presence** | How present the visitor seems: `presenceLevel(now)` in [0, 1] from the last input (scroll, and from P5 pointer, keys and focus). | One gate for twinkle and drift; 90 s idle window, 4 s fades (`config.ts:217-220`). |
| **FrameDemand, FrameClock** | Each subsystem says how many frames it needs and whether they must land on display refreshes; the clock sleeps, runs a timer, or runs animation frames divided by `k`. | Motion draws only on animation frames; `k` lowers at once and rises only after 0.5 s; WebKit's unaligned clock draws every frame; nothing draws while hidden. |
| **QuietIndex** | Per-64-px-tile subsets of the quiet zones, for stars. | Exact: the factor equals `easedQuietFactor` over all zones bit for bit; it only reads the veil session's blend. |
| **Transient** | A short-lived sky event: `{ kind, startedAt, lifetime, nearCopy, launchScrollY, cancelledAt }` plus its kind's data. Kinds: `satellite` (P9), `meteor` (P11), could kinds (P15). | First light to last light ≤ 5 s; drawn in screen space (not moved by the camera); faded out once the page scrolls 16 px from launch, or on pause; never more than one holds the ink lease. |
| **TransientSpec** | Per-kind first delay, gap, planner, motion test, eligibility and cap, in a registry typed over the kinds. | A kind without a spec, or without a drawing case, fails to compile. |
| **Scheduler** | One state machine for every kind: retire, cancel, launch when due. | At least 3 s between any two onsets; launches only in the hero, under full motion, visible, present; per-kind and global caps. |
| **InkLease** | The single right to light up near quiet copy. | At most one holder at a time, held until its last light (wake or train) is gone; while held, and during the crossing cooldown, every launch is planned clear-sky only. |
| **SkyWindow** | The viewport as a pinhole camera onto the sky: 60° across the longer side, center pitched 40° above a horizon just below the screen (P9: field of view only; P12: the rest). | Gnomonic: straight paths stay straight and parallel paths meet at their radiant. |
| **Radiant, Source** | A visit's directions: one shower radiant (40% of launches, scatter σ 1.5°) and three sporadic sources (60%, σ 15°), each with a speed class (P12). | Elevations drawn with density sin h cos h; re-drawn on resize or layout. |
| **SpeedClass** | slow 9°/s, medium 14°/s, fast 22°/s at 90° from the radiant, with durations and wake colors (P14). | Only fast meteors may leave a train. |
| **PauseState** (main thread) | The visitor's stored choice (`'paused'`, `'playing'` or none) with the reduce-motion default. | Read only in the browser, inside try/catch; maps to the worker's existing `motion: 'reduced'`. |

### 4.2 Who owns what

```
 MAIN THREAD                                                   WORKER (sky.worker.ts chunk)
 ───────────                                                   ───────────────────────────
 Navbar ── SkyPauseToggle ──┐                                  sky.worker.ts   state, messages, frame demands,
                            ├── skyPause.ts                                    camera stepping, transient glue
 SkyCanvas ── mountSky.ts ──┘   choice + reduce-motion          frameClock.ts   rAF with watchdog, timers      (P4)
               │                default ─► motion()             renderSky.ts    drawLayer, placePoint, quiet index use,
               │                                                                drawTransient, drawSatellite, drawMeteor*
               ├─ scroll ─────────────────────────────────►     skyAssets.ts    phased atlas, separable painter  (P1)
               ├─ layout (quiet rects)* ──────────────────►
               ├─ activity (P5), pointer (P10) ───────────►     src/lib/sky (shared model, DOM-free)
               └─ motion, visible, contrast, resize ───────►       config.ts       every tunable
                                                                   camera.ts       depth law, drift, springs   (P7, P8)
 * veil-owned: do not edit until V0                                pacing.ts       demands, divisor, refresh   (P4)
                                                                   quietIndex.ts   exact per-tile lookup       (P3)
                                                                   transients.ts   union, specs, scheduler, lease (P9)
                                                                   satellites.ts   satellite passes            (P9)
                                                                   skyWindow.ts    the pinhole window          (P9, P12)
                                                                   radiants.ts     visit sources, aim          (P12)
                                                                   meteors.ts*     flight planning, veil
                                                                   scene.ts        scene levels; quiet math*
                                                                   catalog.ts      stars and cells
```

## 5. Architecture and module map

### 5.1 New and changed files

| File | Phase | Role | Import rules it keeps |
|---|---|---|---|
| `src/lib/sky/config.ts` | P1-P14 | New blocks appended after `TRAIN` (`STAR_PHASES`, `CAMERA`, `PACING`, `DRIFT`, `DEPTH`, `TRANSIENTS`, `SKY_WINDOW`, `SATELLITE`, `POINTER`; later `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_KINDS`); `SCENE.*.drift`; `FRAME` doc; `LAYERS.parallax` removed (P8). | Imports only its own files (`./protocol` types). |
| `src/lib/sky/camera.ts` (new) | P7, P8 | Depth law, drift path, springs, `CameraState`. | Relative imports of its own files only; no DOM. |
| `src/lib/sky/pacing.ts` (new) | P4 | `FrameDemand`, `planFrames`, `refreshDivisor`, `motionFps`, refresh estimate, divisor hysteresis. | Same. |
| `src/lib/sky/quietIndex.ts` (new) | P3 | Exact per-tile quiet lookup over `easedQuietFactor`. | Same. |
| `src/lib/sky/transients.ts` (new) | P9 | Transient union, spec registry, scheduler, lease, scroll cancel, `nextGap`. | Same. |
| `src/lib/sky/satellites.ts` (new) | P9 | Satellite planning and state at time t. | Same. |
| `src/lib/sky/skyWindow.ts` (new) | P9, P12 | The pinhole window (`pixelsPerDegree` in P9; `toward`, `elevationAt`, `meteorRange` in P12). | Same. |
| `src/lib/sky/radiants.ts` (new, BLOCKED) | P12 | Visit sources, `radiantMotion`, the aim callback for the meteor planner. | Same. |
| `src/lib/sky/scene.ts` | P7, P10 | `drift` (and `lean`) in `SceneLevels` and `sceneAt` only. | Unchanged imports. |
| `src/lib/sky/catalog.ts` | P8 | `q: nearness(m)` on each star (no new draw). | Gains `./camera`. |
| `src/lib/sky/protocol.ts` | P5, P10, P16 | `activity`, `pointer` (and phase-2 `tick`/`relay`) messages; `SkyMotion` doc. | Types only. |
| `src/components/sky/skyAssets.ts` | P1 | Phased atlas, separable painter, `starSpriteIndex`. | Worker file: only `@/lib/sky/*` by file. |
| `src/components/sky/renderSky.ts` | P1-P3, P8, P9 | `placePoint`, camera-based `drawLayer`, stamp cache, quiet index use, `drawTransient`, `drawSatellite`. | Worker file. |
| `src/components/sky/frameClock.ts` (new) | P4 | rAF wrapper: feature detection, pending flag (not id 0), 250 ms watchdog, timer fallback. | Worker file: imports only `@/lib/sky/*`; no `window`. **Add it to AGENTS.md's worker-file list.** |
| `src/components/sky/sky.worker.ts` | P2, P4, P5, P7, P9, P10 | Demands replace `frameMode`; camera stepping; presence; transient glue; motion freeze and resume. Veil-owned parts untouched (§5.4). | Worker file. |
| `src/components/sky/skyPause.ts` (new) | P6 | Main-thread pause store (localStorage, listeners, reduce-motion default). | Main thread: imports `@/lib/utils` (as `mountSky.ts:3` does), nothing from `src/lib/sky`. |
| `src/components/sky/SkyPauseToggle.tsx` (new) | P6 | The button (default export, no `'use client'`: it renders inside `Navbar`, already a client entry). | `@/` imports; icons through the barrel like `Navbar.tsx:7`. |
| `src/components/icons/PauseSVG.tsx` (new) + barrel | P6 | Pause glyph on the shared `Icon` frame. | Named re-export in `icons/index.ts`. |
| `src/components/Navbar.tsx` | P6 | Renders the toggle after Resume inside `#primary-nav`. | Unchanged imports plus the toggle. |
| `src/components/sky/mountSky.ts` | P5, P6, P10 | Activity and pointer listeners; `motion()` reads the pause store. | Main thread: types and `@/lib/sky/color` only from `src/lib/sky`. |
| `AGENTS.md` | P4 | Worker-file list gains `frameClock.ts`. | n/a |

### 5.2 Main thread and worker

The split stays as today: the main thread measures, listens and posts; the worker owns time, state and pixels. The new main-thread work is tiny and event-driven: one throttled `activity` message per second at most (P5), at most one `pointer` message per animation frame on fine pointers in the hero (P10), and the pause store (P6). Nothing new runs per frame on the main thread. Constants the main thread needs (`ACTIVITY_INTERVAL_MS`, the pointer media query) live in `mountSky.ts` beside `DPR_CAP` (`mountSky.ts:17-27`), because the main thread must not import `config.ts` (AGENTS.md).

### 5.3 Next.js 16.4 notes (from the bundled docs)

- **Client boundary.** `"use client"` declares a boundary, and "all of its imports and the components it directly renders are included in the client bundle" (`01-app/01-getting-started/05-server-and-client-components.md`). `Navbar.tsx` is already a client entry (`Navbar.tsx:1`), so `SkyPauseToggle.tsx` needs no directive; AGENTS.md puts `'use client'` only at the entry of an interactive subtree.
- **Browser-only APIs.** The same page lists `localStorage` among the reasons to use a Client Component. Reading it during the server render or the first client render would cause a hydration mismatch (`01-app/02-guides/preventing-flash-before-hydration.md`: "A Client Component that re-renders with client values causes a hydration error"). The toggle reads the store through `useSyncExternalStore` with a server snapshot, which React uses "during server rendering and during hydration" (react.dev, `useSyncExternalStore`). No inline script is needed: the toggle sits in IntroGate's content, which is `display: none` until the reveal and then remounted by its key flip (`IntroGate.tsx:94-100`), so the stored state is read on a fresh client mount before anyone sees it.
- **Workers under Turbopack.** The sky worker is created with `new Worker(new URL('./sky.worker.ts', import.meta.url))` (`mountSky.ts:77-84`), the pattern Turbopack bundles as its own chunk (`03-api-reference/08-turbopack.md` documents magic comments on `new Worker()` expressions and `turbopackWorkerAssetPrefix` for "Web Worker URLs (entrypoint + module chunks)"). New modules imported by `sky.worker.ts` (`frameClock.ts`, `camera.ts`, …) join that chunk with no configuration. Don't use `next/script`'s `strategy="worker"`: it is experimental and "does not yet work with the App Router" (`01-app/02-guides/scripts.md`).
- **No Cache Components APIs** (AGENTS.md). Nothing here needs them.
- **Verification while `next dev` runs:** its MCP endpoint `/_next/mcp` (`get_errors`, `get_compilation_issues`, `compile_route`) instead of `next build` (AGENTS.md). A production build (`npm run build`, then the `portfolio-prod` preview) runs only with the dev server stopped, at the end of phases that change the worker's module graph (P4, P9), because production builds minify and mangle export names (`08-turbopack.md` configuration table).

### 5.4 Veil-owned code: do not edit until V0

From COORDINATION.md (its request 2, and the functions it said it will touch). Our phases may **read** their state; they may not edit these until the veil commit lands and we rebase (V0):

- `src/lib/sky/meteors.ts`: `veiledFrom` (`meteors.ts:104-123`), `planFlight` (`:126-179`), `planMeteor` (`:186-192`); the file's private `segmentTouches` (`:75-97`) by courtesy.
- `src/lib/sky/config.ts`: `METEOR_VEIL` (`:319`), its WCAG doc comments, `QUIET` (`:138`), and the `METEOR` spawn and selection keys (`:235-308`).
- `src/components/sky/sky.worker.ts`: `updateMeteor` (`:193-224`), the `scroll` handler (`:463-470`), the `layout` handler (`:471-484`), `quietBlend` (`:227-234`), `settleQuiet` (`:241-243`).
- `src/components/sky/renderSky.ts`: `drawMeteor` and `drawTrain` (`:170-261`).
- `src/lib/sky/scene.ts`: `quietAt`, `inkAt`, `quietFactor`, `easedQuietFactor` (`:70-124`).
- `src/components/sky/mountSky.ts` and `src/lib/sky/protocol.ts`: quiet-rect measurement (`mountSky.ts:95-123`, `:160-176`, `:278-285`) and `SkyRect`/the `layout` message (`protocol.ts:15-24`, `:60-67`).

## 6. Detailed design per area

Code sketches are plans, not patches. They follow the codebase: tabs, single quotes, no semicolons, relative imports inside `src/lib/sky`, `@/lib/sky/*` by file in worker files, a doc comment on every config constant, and `noUncheckedIndexedAccess` (indexing returns `T | undefined`, `tsconfig.json`).

### 6.1 Camera, depth and drift

#### 6.1.1 The law

```
Per star (fixed):    q = min(Q_MAX, 10^(-K (m - M_REF)))            K 0.14, M_REF 1.57, Q_MAX 1.6        (P8; per-layer constant before)
Per frame:           C = C_scroll + C_drift + C_lean                 CSS px at nearness 1
                     screen(star) = world(star) - q × C              one law for every cause
C_scroll = (0, 0.07 × s)          s: critically damped spring (ω 10 rad/s) following scroll - origin; snap if |gap| > 1 viewport
C_drift  = E(τ) - E(0)            E(τ) = Σ R_k (cos(ω_k τ + φ_k), sin(ω_k τ + φ_k)),  ω_k = (2π/P) r_k,  R_k = s_k v₀ / |ω_k|
τ        += level × min(dt, 0.1)  level eases to scene.drift × presence (× 0.6 narrow) with time constant 1 s; 0 when frozen
C_lean   = reach × (ℓx, ℓy)       ℓ: critically damped springs (ω 4) toward the normalized pointer offset              (P10)
```

Constants: P = 180 s, r = (1, -1.618, 2.414), s = (1, 0.3, 0.12), v₀ = 3 CSS px/s, φ = (0.70, 0.00, 2.09) rad (D5). The drift speed always lies in [0.58, 1.42] × v₀ × level; the heading turns 0.38 to 4.33°/s (mean 2.00°/s) and never turns back; the speed changes by at most 3.8% a second; the component frequencies are 0.0056, 0.0090 and 0.0134 Hz, two decades under the 0.2-0.4 Hz motion-sickness band [computed; R1 §4.1; R4 §2.2].

Integrators are exact closed forms only (R1 §5.4): the spring `x(t) = target + (e + (v + ωe) t) e^(-ωt)` (Motion's `resolveSpring` uses the same form) and the exponential approach `x ← target + (x - target) e^(-dt/τ)`. Both compose exactly, so 15, 60 and 144 Hz follow the same path. Never Euler, never a fixed per-frame lerp.

#### 6.1.2 Config blocks (appended to `config.ts`)

```ts
/**
 * The camera the sky is seen through, in CSS px for a star at nearness 1: every star moves on screen by its nearness
 * times the camera, whatever moves it (scroll, drift, pointer lean). Scrolling moves it `scrollParallax` of the page
 * scroll, the near band's reviewed parallax, through a critically damped spring of `scrollOmega` rad/s, so the stars
 * glide to rest about half a second after the page stops and never overshoot (Motion's spring with bounce 0 has the
 * same curve at a visualDuration of 0.52 s). A gap of more than `snapViewports` viewport heights between the spring and
 * the scroll (Home, End, find in page) snaps instead of sweeping; 0 always snaps, which follows the scroll exactly.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, snapViewports: 1 } as const

/**
 * The floating drift, in CSS px for a star at nearness 1: epicycles, a main circle turning once every `period` seconds
 * with smaller circles riding on it at irrational frequency ratios (negative turns the other way), so the path never
 * repeats, its heading turns 0.4-4.3° a second (2 on average) without ever turning back, and its speed stays within
 * `speed` × (1 ± 0.42): always moving, never racing. On a laptop that is about 4 arcmin/s for the near stars and 1 for
 * the faint ones, three times and once the slowest motion people notice. The path is a pure function of a drift clock,
 * zero at 0; with these phases the stars first drift right, and they never wander more than 68.4 s × `speed` from the
 * start (205 px at nearness 1). The clock runs at the drift level, which eases toward scene × presence (× `narrowRate`
 * on narrow screens, whose CSS px look about 1.35× bigger) with time constant `levelTime` (s), 95% of the way in three
 * of them, and drops to 0 at once under reduced motion or the pause control. One frame advances the clock by at most
 * `maxStep` seconds, so a stalled frame or a returning tab never jumps the sky. Below `restSpeed` CSS px/s with every
 * spring settled, the camera is at rest and the worker may sleep.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.7 },
		{ ratio: -1.618, share: 0.3, phase: 0 },
		{ ratio: 2.414, share: 0.12, phase: 2.09 },
	],
	narrowRate: 0.6,
	levelTime: 1,
	maxStep: 0.1,
	restSpeed: 0.02,
} as const

/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen: 1 at magnitude
 * `reference` (the near band's mean), 10^(-compression × (m - reference)) elsewhere, at most `maxNearness`. Identical
 * lamps would give compression 0.2 (the inverse-square law); 0.14 keeps about 70% of that depth range, as STAR_ALPHA
 * keeps a 400:1 flux range as 5:1, so the faintest stars still move (q 0.24) and the few brightest never race. Band
 * means come out at 0.0205, 0.0350 and 0.0717 of the scroll (far, mid, near), within 12.5% of the reviewed 0.02, 0.04
 * and 0.07. Retuning it never moves a star at rest (camera at zero).
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const
```

`SCENE` gains a drift level per scene (P7), mixed by `sceneAt` like `twinkle`:

```ts
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8 },
```

with the `SCENE` doc gaining one sentence: "`drift` scales the ambient drift (DRIFT): the sky floats in the hero, slows to about a third while reading (the near stars at about 1 px a second, the faint ones still) and nearly recovers at the end."

`P8` removes `parallax` from `LayerConfig` and `LAYERS` (`config.ts:58-59`, `:78-80`): the depth law replaces it, and its doc moves into `DEPTH`.

#### 6.1.3 `src/lib/sky/camera.ts`

```ts
import { CAMERA, DEPTH, DRIFT, LAYERS, POINTER, SKY_LAYERS, type SkyLayer } from './config'

/** A position or offset in CSS px, or a velocity in CSS px/s. */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: its value and velocity per second. Stepped in place, so no garbage per frame. */
export interface Spring {
	value: number
	velocity: number
}

/** Nearness q = Z_ref / Z of a star of magnitude m: the share of the camera's motion it shows on screen (DEPTH). */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Each layer's nearness range [faintest, brightest], for culling its cells. */
const LAYER_NEARNESS = Object.fromEntries(
	SKY_LAYERS.map((layer) => {
		const [brightest, faintest] = LAYERS[layer].magnitude
		return [layer, [nearness(faintest), nearness(brightest)] as const]
	})
) as Record<SkyLayer, readonly [number, number]>

/** Nearness range [faintest, brightest] of a layer's magnitude band: far 0.240-0.389, mid 0.389-0.741, near 0.741-1.6. */
export function layerNearness(layer: SkyLayer): readonly [number, number] {
	return LAYER_NEARNESS[layer]
}

/** Each epicycle as angular frequency (rad per second of drift clock), radius (CSS px at nearness 1) and phase (rad). */
const EPICYCLES = DRIFT.epicycles.map(({ ratio, share, phase }) => {
	const omega = ((2 * Math.PI) / DRIFT.period) * ratio
	return { omega, radius: (share * DRIFT.speed) / Math.abs(omega), phase }
})

/** Where the drift has carried the camera at drift-clock time `clock` (s), CSS px at nearness 1; zero at 0. Writes `out`. */
export function driftAt(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x += radius * (Math.cos(omega * clock + phase) - Math.cos(phase))
		out.y += radius * (Math.sin(omega * clock + phase) - Math.sin(phase))
	}
	return out
}

/** The drift's velocity at `clock`: CSS px per second of drift clock at nearness 1 (times the level for real time). Writes `out`. */
export function driftVelocity(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x -= radius * omega * Math.sin(omega * clock + phase)
		out.y += radius * omega * Math.cos(omega * clock + phase)
	}
	return out
}

/**
 * One critically damped step toward `target` over `dt` seconds, with the exact solution
 * x(t) = target + (e + (v + ωe)t)e^(-ωt): the same curve at any frame rate, never overshooting from rest.
 */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number): void {
	const offset = spring.value - target
	const slope = spring.velocity + omega * offset
	const decay = Math.exp(-omega * dt)
	spring.value = target + (offset + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
}

/** Exponential approach to `target` with time constant `tau` (s), exact at any frame time. */
export function approach(value: number, target: number, tau: number, dt: number): number {
	return target + (value - target) * Math.exp(-dt / tau)
}

/** The camera, mutated in place once per drawn frame. */
export interface CameraState {
	/** The page scroll the camera follows (px), less `scrollOrigin`. */
	scroll: Spring
	/** Scroll that happened while the camera was frozen (px): left out, so a resume continues where the sky stopped. */
	scrollOrigin: number
	/** Drift clock (s) and the share of the drift speed in effect (0-1). */
	clock: number
	level: number
	/** Lean toward the pointer, CSS px at nearness 1 (P10; at rest at 0 before). */
	leanX: Spring
	leanY: Spring
	/** Reduced motion or the pause control: nothing moves until resumeCamera. */
	frozen: boolean
	/** Worker seconds of the last step; null after a pause, so the next step is empty and nothing jumps. */
	steppedAt: number | null
	/** C, CSS px at nearness 1, and its velocity (CSS px/s), as of the last step. */
	position: Vec
	velocity: Vec
}

/** What the camera follows this frame; the worker fills it from its own state. */
export interface CameraTarget {
	/** Page scroll the sky follows (px): the worker's parallaxScroll, which holds still under reduced motion. */
	scroll: number
	viewportHeight: number
	/** Drift level to ease toward: scene × presence (× DRIFT.narrowRate on narrow screens); 0 before the reveal. */
	level: number
	/** Lean target per axis, -1..1 of POINTER.reach (P10). */
	leanX: number
	leanY: number
}

/** A camera at rest on `scroll` (the restored scroll position: no glide on load). */
export function createCamera(scroll: number): CameraState {
	return {
		scroll: { value: scroll, velocity: 0 },
		scrollOrigin: 0,
		clock: 0,
		level: 0,
		leanX: { value: 0, velocity: 0 },
		leanY: { value: 0, velocity: 0 },
		frozen: false,
		steppedAt: null,
		position: { x: 0, y: CAMERA.scrollParallax * scroll },
		velocity: { x: 0, y: 0 },
	}
}

const drift: Vec = { x: 0, y: 0 }
const driftRate: Vec = { x: 0, y: 0 }

/** Advances the camera to worker time `now` (s): springs by the true elapsed time, the drift clock by at most DRIFT.maxStep. */
export function stepCamera(camera: CameraState, now: number, target: CameraTarget): void {
	const dt = camera.steppedAt === null ? 0 : Math.max(0, now - camera.steppedAt)
	camera.steppedAt = now
	if (camera.frozen) return
	const scrollTarget = target.scroll - camera.scrollOrigin
	if (Math.abs(scrollTarget - camera.scroll.value) > target.viewportHeight * CAMERA.snapViewports) {
		camera.scroll.value = scrollTarget
		camera.scroll.velocity = 0
	} else stepSpring(camera.scroll, scrollTarget, CAMERA.scrollOmega, dt)
	camera.level = approach(camera.level, target.level, DRIFT.levelTime, dt)
	camera.clock += camera.level * Math.min(dt, DRIFT.maxStep)
	stepSpring(camera.leanX, target.leanX * POINTER.reach, POINTER.omega, dt)
	stepSpring(camera.leanY, target.leanY * POINTER.reach, POINTER.omega, dt)
	driftAt(camera.clock, drift)
	driftVelocity(camera.clock, driftRate)
	camera.position.x = drift.x + camera.leanX.value
	camera.position.y = CAMERA.scrollParallax * camera.scroll.value + drift.y + camera.leanY.value
	camera.velocity.x = driftRate.x * camera.level + camera.leanX.velocity
	camera.velocity.y = CAMERA.scrollParallax * camera.scroll.velocity + driftRate.y * camera.level + camera.leanY.velocity
}

/** Sleep or a hidden tab: forget the clock, so the first step afterwards is empty. */
export function pauseCamera(camera: CameraState): void {
	camera.steppedAt = null
}

/** Reduced motion or the pause control: stop where it is, drift level 0. `scroll` is the scroll it followed. */
export function freezeCamera(camera: CameraState, scroll: number): void {
	camera.frozen = true
	camera.level = 0
	camera.scroll.velocity = 0
	camera.leanX.velocity = 0
	camera.leanY.velocity = 0
	camera.velocity.x = 0
	camera.velocity.y = 0
	// The spring now targets where it is: a resume continues from here instead of finishing an old glide
	camera.scrollOrigin = scroll - camera.scroll.value
}

/**
 * Back to full motion: the scroll the camera ignored while frozen (from `frozenScroll` to `scroll`) joins the origin,
 * so the sky continues from where it stopped instead of jumping (WCAG G4: resume from where it paused). The drift
 * eases back in from level 0.
 */
export function resumeCamera(camera: CameraState, frozenScroll: number, scroll: number): void {
	camera.frozen = false
	camera.scrollOrigin += scroll - frozenScroll
}

/** Fastest on-screen speed of any star now (CSS px/s): the camera's speed times the largest nearness. */
export function cameraSpeed(camera: CameraState): number {
	return Math.hypot(camera.velocity.x, camera.velocity.y) * DEPTH.maxNearness
}

/** True when the camera won't move until its target changes: no drift wanted, every spring settled. */
export function cameraAtRest(camera: CameraState, target: CameraTarget): boolean {
	if (camera.frozen) return true
	const settled = (spring: Spring, goal: number) => Math.abs(spring.value - goal) < DRIFT.restSpeed && Math.abs(spring.velocity) < DRIFT.restSpeed
	return (
		target.level === 0 &&
		cameraSpeed(camera) < DRIFT.restSpeed &&
		settled(camera.scroll, target.scroll - camera.scrollOrigin) &&
		settled(camera.leanX, target.leanX * POINTER.reach) &&
		settled(camera.leanY, target.leanY * POINTER.reach)
	)
}
```

Phasing inside the file: P7 ships everything except `nearness`, `layerNearness` and the lean (springs present but targets always 0, and `POINTER` absent: use 0 for the lean target and `1` for the largest nearness in `cameraSpeed`, the near layer's constant). P8 adds the depth law and switches `cameraSpeed` to `DEPTH.maxNearness`. P10 adds `POINTER`.

#### 6.1.4 Worker integration (P7)

```ts
// sky.worker.ts: one camera, replaced at init so it starts on the restored scroll
let camera = createCamera(0)

/** What the camera follows at `now` (ms): the scroll the sky follows and the drift level the scene and visitor allow. */
function cameraTarget(now: number): CameraTarget {
	const narrow = width <= NARROW_MAX_WIDTH
	const level = revealAt === null || !driftAllowed() ? 0 : sceneAt(scrollY, height, documentHeight).drift * presenceLevel(now) * (narrow ? DRIFT.narrowRate : 1)
	return { scroll: parallaxScroll, viewportHeight: height, level, leanX: 0, leanY: 0 }
}
```

- `draw(now)` steps the camera first (`stepCamera(camera, now / 1000, cameraTarget(now))`), then `frameAt` reads `camera.position` into `SkyFrame.camera` and sets `snap: motion !== 'full' || DRIFT.speed <= 0`. `probeRaster` keeps calling `frameAt` without stepping.
- `init`: after `scrollY = parallaxScroll = message.scrollY` (`sky.worker.ts:420`), `camera = createCamera(parallaxScroll)`; if `message.motion !== 'full'`, `freezeCamera(camera, parallaxScroll)`.
- `motion` handler (`:437-443`), our part (the handler is not veil-owned):

```ts
		case 'motion': {
			const was = motion
			// Back to full motion: no shooting star straight away
			if (message.motion === 'full' && was !== 'full') holdMeteors(now)
			motion = message.motion
			if (motion !== 'full') meteor = null
			// Frozen where it is; on the way back, continue from there (the scroll in between joins the camera's origin)
			if (motion !== 'full' && was === 'full') freezeCamera(camera, parallaxScroll)
			if (motion === 'full' && was !== 'full') {
				resumeCamera(camera, parallaxScroll, scrollY)
				parallaxScroll = scrollY
			}
			needsDraw = true
			break
		}
```

- `visible` handler, hidden branch (`:446-451`): add `pauseCamera(camera)` beside the frame clock's `cancel()` (P4 replaced `cancelFrames`).
- When `planFrames` returns sleep (§6.2.4): `pauseCamera(camera)`.
- `driftAllowed()` is false when `DRIFT.speed <= 0` (the kill switch: without this the drift level would stay above 0, `cameraAtRest` would never hold, and the clock would draw 20 fps of nothing) or when the software-raster budget is below `PACING.minFps` (§6.2.2): the sky then stays still, as today.

Before and after: today `drawLayer` moves each layer by `parallaxScroll × parallax` vertically and nothing else (`renderSky.ts:100-104`); after P7 every star moves by `q × C` on both axes, with the scroll term gliding.

#### 6.1.5 Speeds on screen [computed]

CSS px/s, minimum to maximum of the epicycles (×0.58 to ×1.42 of v₀ = 3), for the brightest star (q 1.6), the band means (near 1.02, mid 0.50, far 0.29) and the faintest (q 0.24):

| Scene (rate) | q 1.6 | near 1.02 | mid 0.50 | far 0.29 | faintest 0.24 |
|---|---|---|---|---|---|
| Desktop hero (1) | 2.78-6.82 | 1.77-4.35 | 0.87-2.13 | 0.50-1.24 | 0.42-1.02 |
| Desktop end (0.8) | 2.23-5.45 | 1.42-3.48 | 0.70-1.70 | 0.40-0.99 | 0.33-0.82 |
| Desktop reading (0.35) | 0.97-2.39 | 0.62-1.52 | 0.30-0.75 | 0.18-0.43 | 0.15-0.36 |
| Narrow hero (0.6) | 1.67-4.09 | 1.06-2.61 | 0.52-1.28 | 0.30-0.74 | 0.25-0.61 |
| Narrow reading (0.21) | 0.58-1.43 | 0.37-0.91 | 0.18-0.45 | 0.11-0.26 | 0.09-0.21 |

At about 1.3 arcmin per CSS px on a laptop (R1 §4.2), the hero's near mean is about 4 arcmin/s and the far mean about 1 arcmin/s. Adjacent band ratios are 1.71 (mid/far) and 2.04 (near/mid), above R4's 1.6 floor. The scroll spring makes the brightest star trail its target by 22 px at 1000 px/s of scrolling (near mean 14 px) and glide that far after the page stops [computed].

#### 6.1.6 Reconciliation: R1's bounded drift against R3's wrapping accumulators

- **R3** gave each layer a velocity accumulator (`drift += v × dt`) for an unbounded, constant-velocity drift. Unbounded offsets eventually overflow the star cache's cell keys, valid for cells in ±32,768 (`renderSky.ts:38-39`), after about 3.9 days at 25 px/s, so R3 wrapped the accumulators and the cell lookups at the catalog period (`wrapCell`).
- **R1** made the drift a bounded closed-form path driven by an integrated clock. The supremum of `|C_drift|` is exact: `sup = Σ R_k + |Σ R_k e^(iφ_k)|` (the phases of an orbit with rationally independent frequencies come arbitrarily close to lining up against the start vector). For R1's phases that is 190.9 px = 63.63 s × v₀ at q = 1, matching R1's "63.6 v₀ q"; for this plan's phases (D5) it is 205.2 px = 68.4 s × v₀ (328 px for the brightest stars) [computed].
- **Every term of C is bounded**: the drift as above, the lean by `reach` (19 px at q 1.6), and the scroll by the page: Chromium lays out at most about 33.5 M px (its layout unit is a 32-bit count of 1/64 px), so the largest star offset is 0.07 × 1.6 × 33.5 M + 328 + 19 ≈ 3.76 M px, cell 14,682, well inside the key range [computed].
- **Decision:** adopt R1's bounded path; drop R3's accumulators and `wrapCell` (no guard: it could never run). Keep R4's and R3's real requirement, "integrate, never compute speed × time", by integrating the **clock**: changing the level changes how fast the clock runs, never the offset already travelled, so no scene change, idle fade, pause or resize can make the stars jump (AC-9). Update the key comment at `renderSky.ts:38` to state the bound.
- **Precision:** offsets stay under 4 M px, where a double's spacing is about 5 × 10⁻¹⁰ px; the subtraction `world - q × C` happens in JavaScript before anything reaches the canvas's float32 coordinates (R3 §5.2).

#### 6.1.7 Reconciliation: pointer lean, R1 against R4

R1: reach 12 CSS px at q = 1 (brightest ±19, near ±12, mid ±6, far ±3.5 px), ω = 4 rad/s. R4: a virtual shift of 100 px times each layer's parallax, far 2, mid 4, near 7 px, ω = 4. In R1's law a layer's nearness is its parallax over 0.07, so R4's numbers are the same model at reach 7. The two agree on the law, the spring and the gating (fine pointer with hover, hero, full motion, never device orientation); they differ only in one amplitude. Default 12 (the brief's), with 7 as the calmer setting (D6).

### 6.2 Pacing and the frame clock

#### 6.2.1 The rule

- `fps_need = max(PACING.minFps, v_max × dpr / PACING.stepPx)` with `v_max = cameraSpeed(camera)`; 0 when the camera is at rest.
- Divisor for one demand at refresh rate `Hz`: `k = max(⌊Hz / need⌋, ⌈Hz / cap⌉, 1)`; for several demands the smallest `k` wins (the most demanding part sets the pace). A demand needing every frame has `k = 1`.
- Hysteresis: a lower `k` applies at once; a higher `k` only after the lower need has lasted `PACING.slowDownAfter` (0.5 s).
- WebKit: when the median rAF interval is 15 ± 0.4 ms (its fixed worker timer, not a display rate), `k = 1`.
- Caps apply to the camera's demand only: 30 fps on narrow screens and after the first ADAPT step; on a software-rasterized canvas `⌊softwareCpuShare × 1000 / rasterMs⌋`, and below `minFps` the drift is off (`driftAllowed()` false). Meteors, satellites and scrolling still draw every frame, as today.

Resulting rates [computed], drift only, v₀ = 3:

| Case | v (CSS px/s) | DPR 1 | DPR 1.5 | DPR 2 |
|---|---|---|---|---|
| Hero, peak speed | 6.82 | 20 fps at 60 and 120 Hz (k 3, 6), 20.6 at 144 Hz | 30 at 60 Hz, 24 at 120 Hz, 20.6 at 144 Hz | 30 at 60 and 120 Hz, 28.8 at 144 Hz; step 0.45-0.47 device px |
| Hero, typical | 4.80 | 20 | 20 | 20; step 0.48 device px |
| Reading, peak | 2.39 | 20 | 20 | 20; step 0.24 device px |
| Narrow hero, peak (cap 30) | 4.09 | 20 | 20 | 20; step 0.41 device px |

Every drawn step stays at or under 0.5 device px (AC-10). The minimum of 20 fps sets the rate almost everywhere; only the brightest stars at peak speed on DPR ≥ 1.5 ask for 30.

#### 6.2.2 Config block

```ts
/**
 * Frame pacing for motion (FRAME keeps the timer paths for a still sky). Moving stars draw on animation frames, every
 * k-th display refresh: at least `minFps`, and enough that the fastest star moves at most `stepPx` device px per frame
 * (two quarter-pixel phases, a third of the smallest star's width). A faster need lowers k at once; a slower one raises
 * it only after `slowDownAfter` seconds. The drift draws at most `narrowMaxFps` on narrow screens (phone GPUs pay most
 * for a full-screen frame) and `slowMaxFps` after the first adaptive step; a software-rasterized canvas may spend
 * `softwareCpuShare` of a core on it, and below `minFps` it stays still. The refresh rate is the median of the last
 * `refreshSamples` frame intervals; a median within `unalignedTolerance` ms of `unalignedMs` is WebKit's fixed worker
 * timer, not a display, so every frame draws. A requested frame that hasn't come after `watchdogMs` while visible is
 * replaced by a timer frame, at most `fallbackFps` a second.
 */
export const PACING = {
	stepPx: 0.5,
	minFps: 20,
	narrowMaxFps: 30,
	slowMaxFps: 30,
	softwareCpuShare: 0.08,
	slowDownAfter: 0.5,
	refreshSamples: 16,
	unalignedMs: 15,
	unalignedTolerance: 0.4,
	watchdogMs: 250,
	fallbackFps: 60,
} as const
```

The `FRAME` doc (`config.ts:206`) gains: "Motion (the drift, a shooting star, scrolling) draws on animation frames paced by PACING; these timers serve a sky that only changes brightness."

#### 6.2.3 `src/lib/sky/pacing.ts`

```ts
import { PACING } from './config'

/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Frames per second: 0 for none, Infinity for every display refresh. */
	fps: number
	/** Motion: frames must land on display refreshes (animation frames), never timers. */
	vsync: boolean
	/** Most frames per second this part may cause (the drift's caps); Infinity for none. */
	cap: number
}

/** A moving shooting star, satellite or scroll: every display refresh. */
export const EVERY_FRAME: FrameDemand = { fps: Infinity, vsync: true, cap: Infinity }

/** How the clock runs for a set of demands. */
export type FramePlan = { mode: 'sleep' } | { mode: 'timer'; intervalMs: number } | { mode: 'frames'; divisor: number }

/** Frames per second that keep a star moving at `cssPxPerSecond` within PACING.stepPx device px a frame, at least PACING.minFps. */
export function motionFps(cssPxPerSecond: number, dpr: number): number {
	return Math.max(PACING.minFps, (cssPxPerSecond * dpr) / PACING.stepPx)
}

/** Refreshes per drawn frame for one demand: the largest k that still meets its fps, at least the k that keeps it under its cap. */
export function refreshDivisor(refreshHz: number, demand: FrameDemand): number {
	const need = Number.isFinite(demand.fps) ? Math.floor(refreshHz / demand.fps) : 1
	const cap = Number.isFinite(demand.cap) ? Math.ceil(refreshHz / demand.cap) : 1
	return Math.max(need, cap, 1)
}

/**
 * The pace for several demands: sleep when none wants frames, a timer when none needs vsync (fades, twinkle), otherwise
 * animation frames at the smallest divisor any demand asks for; timer demands ride along. An unaligned clock draws every frame.
 */
export function planFrames(demands: readonly FrameDemand[], estimate: RefreshEstimate): FramePlan
```

```ts
/** Display refresh interval estimated from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes: the median of the last PACING.refreshSamples intervals (16.7 until measured). */
	readonly interval: number
	/** The frames come from a fixed timer, not the display (WebKit's 15 ms worker clock). */
	readonly unaligned: boolean
	/** Records one animation-frame timestamp; an interval over 1.5 × the estimate (a dropped frame) is ignored. */
	sample(timestamp: number): void
	/** Forgets the last timestamp after a pause, so the gap isn't taken for a refresh. */
	pause(): void
}
export function createRefreshEstimate(): RefreshEstimate

/** Lowers the divisor at once (more frames) and raises it only after a lower need has lasted PACING.slowDownAfter s. */
export interface DivisorGovernor {
	next(divisor: number, now: number): number
	reset(): void
}
export function createDivisorGovernor(): DivisorGovernor
```

#### 6.2.4 `src/components/sky/frameClock.ts` and the worker

```ts
import { PACING } from '@/lib/sky/config'

/** The animation-frame part of DedicatedWorkerGlobalScope; feature-detected because a missing one would throw in schedule(). */
export interface FrameSource {
	requestAnimationFrame?: (callback: (time: number) => void) => number
	cancelAnimationFrame?: (handle: number) => void
}

/**
 * One pending wake-up for the worker: an animation frame or a timer. A requested frame that hasn't come after
 * PACING.watchdogMs (Chrome never calls back when its frame provider is invalid) is served by a timer instead, and
 * the next request tries animation frames again. "Pending" is a flag, not a handle: rAF ids may wrap to 0 (MDN).
 */
export interface FrameClock {
	readonly pending: boolean
	readonly framePending: boolean
	frame(callback: (now: number) => void): void
	timer(callback: (now: number) => void, delayMs: number): void
	cancel(): void
}
export function createFrameClock(source: FrameSource): FrameClock
```

In `sky.worker.ts`:

- Remove `FrameMode`, `frameMode`, `frameInterval`, `rafId` and `cancelFrames` (`:24`, `:70`, `:116-141`); add `const clock = createFrameClock(scope)`, `const estimate = createRefreshEstimate()` and `const governor = createDivisorGovernor()`. `SkyWorkerScope`'s rAF members become optional (`:20-21`).
- `frameDemands(now)` keeps `frameMode`'s reasons in the same order:

```ts
/** What each part of the sky needs from the frame clock at `now` (ms); nothing when the sky can't or needn't draw. */
function frameDemands(now: number): FrameDemand[] {
	if (!ctx || !visible || motion === 'off' || exitAt === null) return []
	const t = now / 1000
	const scrolling = now - lastScrollAt < FRAME.scrollSettleMs
	const demands: FrameDemand[] = []
	if ((meteor && meteorMoving(meteor, t)) || transientsMoving(transients, t) || (scrolling && motion === 'full')) demands.push(EVERY_FRAME)
	if (!cameraAtRest(camera, cameraTarget(now))) demands.push({ fps: motionFps(cameraSpeed(camera), dpr), vsync: true, cap: driftCap() })
	// A lingering train, scrolling under reduced motion, the dusk and copy that has just appeared or moved change slowly
	if (meteor || scrolling || !emergenceDone(t - exitAt) || (layoutAt !== null && t - layoutAt < QUIET.ease)) demands.push({ fps: FRAME.fadeFps, vsync: false, cap: Infinity })
	// Decided by where the twinkle is heading, not its level: waking from idle, it eases in from 0
	if (motion === 'full' && !isIdle(now) && sceneAt(scrollY, height, documentHeight).twinkle > 0) {
		demands.push({ fps: quality > 0 ? FRAME.slowTwinkleFps : FRAME.twinkleFps, vsync: false, cap: Infinity })
	}
	return demands
}
```

(P4 ships it without the camera and transient lines; P7 and P9 add them.)

- `schedule(now)`: if `clock.framePending`, return; cancel a pending timer; `plan = planFrames(frameDemands(now), estimate)`. Sleep: `pauseCamera(camera)`, `estimate.pause()`, `governor.reset()`, then today's sleep timers (`:161-165`: a pending redraw, or the next due shooting star or transient). Timer: `clock.timer(onTimer, needsDraw ? 0 : max(0, lastDrawAt + plan.intervalMs - now))`. Frames: `clock.frame(onFrame)`.
- `onFrame(now)`: `estimate.sample(now)`, then `tick(now)`. `tick` draws when `needsDraw`, or for frames when `now - lastDrawAt >= (governor.next(plan.divisor, now) - 0.5) × estimate.interval`, or for timers with today's 4 ms slack (`:187-188`).
- Before P7 nothing moves except what moved before, so the plans reproduce today's modes: scrolling and flights draw every refresh (`k = 1`), fades and twinkle stay on their timers.

### 6.3 Sub-pixel phase sprites

- **Config:**

```ts
/**
 * Sub-pixel positions per device pixel and axis in the star atlas (4, as in Skia's glyph cache): a moving star is drawn
 * from the sprite pre-rendered at its nearest quarter pixel, placed at a whole device pixel, so it glides without
 * blurring or pulsing. 1 rounds every star to whole pixels, as before the drift.
 */
export const STAR_PHASES = 4
```

- **Painter** (`skyAssets.ts:44-78`): the 4×4-supersampled pixel-area Gaussian is separable, `G(x, y) = g(x) g(y)`, so each sprite is the product of two axis profiles shifted by the phase, plus the halo's product. Every phase is divided by the **phase-0** center value, so all phases hold the same light. Checked in scratch [computed]: at phase 0 the new painter's bytes equal today's for all six shapes at DPR 1, 1.25, 1.5 and 2 (0 mismatches, worst value difference 3.3 × 10⁻¹⁶), and a phase-(0.5, 0.5) sprite holds the same light within 0.003%.

```ts
/** One axis of the 4x4-supersampled pixel-area Gaussian, centered `phase` px right of the sprite's middle pixel. */
function profile(size: number, sigma: number, phase: number): Float64Array {
	const center = (size - 1) / 2
	const out = new Float64Array(size)
	for (let i = 0; i < size; i++) {
		let sum = 0
		for (let s = 0; s < 4; s++) {
			const x = i - center - phase + (s + 0.5) / 4 - 0.5
			sum += Math.exp(-(x * x) / (2 * sigma * sigma))
		}
		out[i] = sum / 4
	}
	return out
}
```

`paintSprite(pixels, sprite, color, shape, phaseX, phaseY)` writes `round(min(1, (cx[i] cy[j] + haloPeak hx[i] hy[j]) / peak) × 255)`, with `peak` the phase-0 center of the same shape (computed once per shape). `gaussianAt` is removed.

- **Layout:** for each tint row, each shape gets a 4×4 block of phase cells (cell side = sprite side + 1 px gutter); the meteor core and glow stay unphased in the last row. At DPR 2 the atlas is 400×1190 (about 1.9 MB of RGBA); at DPR 1, 272×660 (about 0.7 MB). Today: 100×326 and 68×180 [computed with `h-atlas-probe.ts`; R3 §3.3].
- **Index** (replaces `tint * SHAPE_COUNT + shape`, `skyAssets.ts:26-27`):

```ts
/** Sprite index for a palette tint, a shape and a sub-pixel phase (0 to STAR_PHASES - 1 per axis); with one phase, tint × shapes + shape. */
export function starSpriteIndex(tint: number, shape: number, phaseX: number, phaseY: number): number {
	return ((tint * STAR_SHAPES.length + shape) * STAR_PHASES + phaseY) * STAR_PHASES + phaseX
}
```

- **Placement** (replaces `renderSky.ts:127-132`):

```ts
/** Top-left device pixel of the sprite placePoint picked; reused, so no garbage per star. */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point centered at (px, py) device px, with its top-left whole pixel in `corner`. A moving point
 * takes the sprite pre-rendered at its nearest quarter-pixel phase, so it glides without blurring; `snap` rounds to
 * whole pixels (reduced motion, the pause control), which draws exactly the points drawn before phases.
 */
function placePoint(atlas: StarAtlas, tint: number, shape: number, px: number, py: number, snap: boolean): Sprite | undefined {
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
	const sprite = atlas.stars[starSpriteIndex(tint, shape, phaseX, phaseY)]
	if (!sprite) return undefined
	const half = (sprite.size - 1) / 2
	corner.x = ix - half
	corner.y = iy - half
	return sprite
}
```

  With `STAR_PHASES = 1` the unsnapped branch reduces to `Math.round` (a phase of 1 carries into the next pixel), so 1 is a complete kill switch.
- **Snap rule:** `SkyFrame.snap` is `true` in P1-P6 (stars move only with scroll parallax, as today), and from P7 `motion !== 'full' || DRIFT.speed <= 0`. Under reduced motion or the pause the frames are bit-identical to today's. In the idle sleep stars keep their phases, so nothing jumps when the drift resumes (R3 §3.4); resting stars then look marginally softer than today's snapped points, which the reduced-motion and paused sky do not.
- **DPR 1 caveat:** where the eye resolves pixels, even an ideal renderer shows about a 20% max-pixel swing for 1-D motion at σ 0.7 device px (R3 §3.5). Decide by eye in P7 on a DPR-1 monitor; the fallback is a floor of 0.85 device px on the core sigma for drifting stars at DPR ≤ 1 (one `Math.max` in `buildStarAtlas`).

### 6.4 The quiet index (stars only)

- **What:** `src/lib/sky/quietIndex.ts` buckets the quiet zones by 64-px screen tiles. A tile lists, in their original order, the zones of each set (`from`, `to`) whose padded box grown by the reach touches the tile. A star looks up its tile and calls the veil session's own `easedQuietFactor` on the tile's subsets. Meteors keep calling `easedQuietFactor` over all zones (`renderSky.ts:206`).
- **Why exact:** `quietAt` skips every zone more than `QUIET.feather` away on either axis (`scene.ts:76`), `inkAt` reaches only inside the padded rect (`scene.ts:89`), and both take a maximum. A tile's subset therefore holds every zone that can contribute anywhere in the tile, and the maximum over it equals the maximum over all zones. R3 measured max |difference| = 0 over 4 viewports × 2 rect counts × 2 ease states × 40 offsets [R3 §4.2].
- **Bit-identity detail:** today, a star near no zone during an ease still gets `1 × level + 1 × (1 - level)`, which can come out one unit in the last place below 1. So `factor` skips the call only when its tile is empty **and** `level >= 1`; during an ease it calls `easedQuietFactor` even with empty subsets. When there are no zones at all (`empty`), `drawLayer` skips the lookup exactly as today's `quiet` flag does (`renderSky.ts:107`).
- **Rebuild:** only when the zones change: on scroll (document zones move), on a layout, and when an ease starts or ends. `update` compares the incoming `from`/`to` arrays with its copies (an exported `sameRects`, about 0.5 µs for 64 rects; the worker's private copy at `sky.worker.ts:82-84` folds into it at V0). Rebuild cost 0.01-0.23 ms; drift-only frames never rebuild [R3 §4.2].
- **Gain:** star quiet math at 4K falls from 0.48-1.72 ms per frame to 0.14-0.32 ms; on a 1440×900 laptop from about 0.11-0.40 ms to 0.04-0.12 ms [R3 §4.1].

```ts
import { QUIET } from './config'
import type { SkyRect } from './protocol'
import { easedQuietFactor, type QuietBlend, type QuietKeeps } from './scene'

/** Side of the screen tiles the zones are bucketed by (CSS px). */
const TILE = 64

/**
 * Farthest distance (CSS px) beyond a padded quiet rect at which a point can still be dimmed: quietAt skips zones farther
 * than QUIET.feather on either axis, and inkAt reaches only inside the padded rect. Replaced by the veil session's
 * exported QUIET_REACH once it lands (interface request IR-5); the index is exact only while no zone reaches farther.
 */
const REACH = QUIET.feather

/** The quiet zones bucketed by screen tile, so a star reads only the zones within reach of it. */
export interface QuietIndex {
	/** No zones at all: stars skip the lookup. */
	readonly empty: boolean
	/** Rebuilds the tiles when the zones changed (scroll, layout, an ease starting or ending); cheap when they didn't. */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps) over only the zones near (x, y): the same value, bit for bit. */
	factor(x: number, y: number, keeps: QuietKeeps): number
}
export function createQuietIndex(): QuietIndex

/** True when two lists hold the same rects in the same order. */
export function sameRects(a: readonly SkyRect[], b: readonly SkyRect[]): boolean
```

`margin` is `EDGE` (stars are drawn up to 24 px beyond the viewport); tiles cover `[-margin, width + margin]` and lookups clamp to the edge tiles. `SkyFrame` gains `quietIndex: QuietIndex`. The worker creates one index and passes it in `frameAt`, still filling `frame.quiet` from `quietBlend(t)` unchanged; `drawSky` calls `frame.quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)` before the layers, because `renderSky.ts` owns `EDGE`.

### 6.5 The star-field cache

- **Stamps instead of a full clear** (`renderSky.ts:23-51`): `beginFrame()` bumps a frame counter; `cell()` stamps what it returns and counts the cells first touched this frame; `trim()` runs only when the cache holds more than twice that count and then deletes the unstamped cells. Visible cells are never regenerated, so the drift never causes a 0.25-1.2 ms regeneration spike every 7-17 minutes [R3 §5.3]. `drawSky` calls `field.beginFrame()` before the layers and `field.trim()` after (replacing `trim(cells)`, `:155`); `drawLayer` no longer returns a count.
- **Keys:** unchanged formula; the comment at `:38` states the bound (cells within ±14,700 for any page a browser lays out, §6.1.6).
- **EDGE stays 24** (`:93`), documented: the largest halo's half-side is at most 9 CSS px at any DPR, and culling per star is continuous, so a star slides in past the edge without popping (AC-8) [R3 §5.4].
- **drawLayer after P2, P3 and P8** (the body that changes; emergence and twinkle lines unchanged):

```ts
/** Draws one depth layer: each star at its world position less its nearness times the camera. */
function drawLayer(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame, layer: SkyLayer): void {
	const scale = frame.layers[layer]
	if (scale <= MIN_STAR_ALPHA) return
	const config = LAYERS[layer]
	const { width, height, dpr, camera, snap, quietIndex } = frame
	const [qFar, qNear] = layerNearness(layer)
	// The cells this layer's stars can come from, for every nearness in its band
	const x0 = Math.floor((Math.min(camera.x * qFar, camera.x * qNear) - EDGE) / CELL_SIZE)
	const x1 = Math.floor((Math.max(camera.x * qFar, camera.x * qNear) + width + EDGE) / CELL_SIZE)
	const y0 = Math.floor((Math.min(camera.y * qFar, camera.y * qNear) - EDGE) / CELL_SIZE)
	const y1 = Math.floor((Math.max(camera.y * qFar, camera.y * qNear) + height + EDGE) / CELL_SIZE)
	const { image } = assets.atlas
	const emerging = frame.dusk !== Infinity
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			for (const star of field.cell(layer, cx, cy)) {
				if (star.keep >= frame.keep) continue
				// Subtract in doubles before anything reaches the canvas, whose coordinates are float32
				const x = star.x - camera.x * star.q
				const y = star.y - camera.y * star.q
				if (x < -EDGE || y < -EDGE || x > width + EDGE || y > height + EDGE) continue
				let alpha = star.alpha * scale
				if (emerging) alpha *= starEmergence(star.delay, frame.dusk)
				// A bright star beside the copy reads as punctuation or an accent
				if (!quietIndex.empty) alpha *= quietIndex.factor(x, y, config)
				// …twinkle exactly as renderSky.ts:121-125…
				if (alpha < MIN_STAR_ALPHA) continue
				const sprite = placePoint(assets.atlas, star.tint, star.shape, x * dpr, y * dpr, snap)
				if (!sprite) continue
				ctx.globalAlpha = Math.min(STAR_ALPHA.peak, alpha)
				ctx.drawImage(image, sprite.x, sprite.y, sprite.size, sprite.size, corner.x, corner.y, sprite.size, sprite.size)
			}
		}
	}
}
```

In P2 (before the depth law) the nearness is the layer's constant, `q = LAYERS[layer].parallax / CAMERA.scrollParallax` (1, 0.571, 0.286), used for both bounds and every star, and the worker sets `camera = { x: 0, y: CAMERA.scrollParallax * parallaxScroll }`: the cells, positions and draw calls are today's. P8 moves `q` onto each star (`catalog.ts` `cellStars`: `q: nearness(m)`, +8 bytes per cached star, no new random draw) and switches the bounds to `layerNearness(layer)`.

### 6.6 Presence and idle

- **Protocol** (P5): `| { type: 'activity' }`, doc: "The visitor is here without scrolling (pointer moves or presses, keys, focus): at most one a second (ACTIVITY_INTERVAL_MS in mountSky)".
- **mountSky** (after the preference listeners, `mountSky.ts:243-247`):

```ts
/** Presence pings for the sky's idle clock (pointer moves and presses, keys, focus), at most one per this many ms. */
const ACTIVITY_INTERVAL_MS = 1000

	// Inside mountSky: reading the hero without scrolling still counts as watching the sky
	let lastActivity = -Infinity
	const noteActivity = () => {
		const now = performance.now()
		// Before init there is no worker clock to wake
		if (offscreen || now - lastActivity < ACTIVITY_INTERVAL_MS) return
		lastActivity = now
		post({ type: 'activity' })
	}
	for (const type of ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const) window.addEventListener(type, noteActivity, { passive: true, signal })
```

- **Worker:** `case 'activity': noteInput(now); break` (the existing presence function, `sky.worker.ts:107-114`, which also holds shooting stars back after an idle stretch). Rename `idleTwinkle` (`:92-94`) to `presenceLevel`, doc: "How present the visitor seems: 1 while they scroll, point, type or focus within FRAME.idleSleepMs, easing to 0 over FRAME.idleFadeMs after it and back in when they return. Twinkle and drift both scale by it." `twinkleLevel` and `cameraTarget` use it.
- **Config doc** (`config.ts:217-218`): "With no input (scroll, pointer, keys, focus) for this long the twinkle and drift ease out, shooting stars pause and the worker sleeps until the visitor returns."
- **Behavior:** a visitor who moves the mouse over the hero keeps the sky alive (today the twinkle fades at 90 s even then). After 90 s with no input the presence fades over 4 s, the drift level follows (time constant 1 s), the camera reaches rest about 6 s after the fade ends (speed under 0.02 px/s), the worker sleeps with 0 frames, and the camera keeps its position. Input eases presence back in over 4 s from the same position.

### 6.7 Scene integration

- `SceneLevels` gains `drift: number` (`scene.ts:11-18`); `sceneAt`'s `mix` accepts `'haze' | 'twinkle' | 'drift'` (`:30`). Nothing else in `scene.ts` changes; the quiet functions are the veil session's.
- **Hero** 1, **reading** 0.35 (D3), **end** 0.8. The level is continuous in scroll, and the camera's level ease smooths any fast scroll between scenes, so the drift speed never changes in one frame.
- **Dusk:** the drift's target is 0 until the reveal, then eases in (95% in 3 s) while the hero entrance plays.
- **Narrow screens** scale the drift clock, not the path, so crossing the 640-px breakpoint changes the speed but never the position.
- **Contrast preference:** `prefers-contrast: more` still dims the stars and drops the haze; the drift is allowed (R4 AC-29).

### 6.8 The pause control (UI, store, mountSky, worker)

- **Semantics:** one page-level control stops drift, twinkle, scroll parallax and new transients at once (G186; the Understanding text recommends a single mechanism for all moving content). It maps to the worker's existing `motion: 'reduced'` (`protocol.ts:26-32`), so no new worker message is needed. Pausing freezes the camera where it is; in-flight satellites fade over 0.25 s (P9); until P11 an in-flight shooting star is dropped as reduced motion drops it today (`sky.worker.ts:441`), from P11 it fades. Playing resumes from the paused positions (G4) and holds shooting stars back 3 s (`holdMeteors`, `:439`).
- **Persistence and default:** stored per viewer in `localStorage`, every access inside try/catch. With nothing stored, `prefers-reduced-motion: reduce` means paused (C39, SCR40). A stored choice wins over the OS default (D2). Another tab's change applies through the `storage` event.

```ts
// src/components/sky/skyPause.ts (main thread)
import { REDUCED_MOTION_QUERY } from '@/lib/utils'

/** localStorage key holding the visitor's choice for the home sky: 'paused' or 'playing'. */
const STORAGE_KEY = 'sky-motion'

type SkyChoice = 'paused' | 'playing'

/** The stored choice, or null when there is none or storage is unavailable (private modes, blocked site data). */
function readChoice(): SkyChoice | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY)
		return value === 'paused' || value === 'playing' ? value : null
	} catch {
		return null
	}
}

/** The choice as last read or made; undefined until first needed (browser only). */
let choice: SkyChoice | null | undefined
const listeners = new Set<() => void>()

/** True when the sky should hold still: the visitor's choice, or by default the OS reduce-motion setting. */
export function skyPaused(): boolean {
	if (choice === undefined) choice = readChoice()
	return choice === null ? matchMedia(REDUCED_MOTION_QUERY).matches : choice === 'paused'
}

/** Server render and hydration: playing. The toggle is hidden until the reveal remounts it, so nobody sees this value. */
export function skyPausedOnServer(): boolean {
	return false
}

/** Records the visitor's choice for this and later visits, and tells the toggle and the sky. */
export function setSkyPaused(paused: boolean): void {
	choice = paused ? 'paused' : 'playing'
	try {
		localStorage.setItem(STORAGE_KEY, choice)
	} catch {
		// Storage is unavailable: the choice still holds for this page
	}
	for (const listener of listeners) listener()
}

/** Calls `listener` when the pause state may have changed: a choice here or in another tab, or the OS setting. */
export function subscribeSkyPause(listener: () => void): () => void {
	const reduced = matchMedia(REDUCED_MOTION_QUERY)
	const onStorage = (event: StorageEvent) => {
		if (event.key !== STORAGE_KEY) return
		choice = readChoice()
		listener()
	}
	listeners.add(listener)
	reduced.addEventListener('change', listener)
	window.addEventListener('storage', onStorage)
	return () => {
		listeners.delete(listener)
		reduced.removeEventListener('change', listener)
		window.removeEventListener('storage', onStorage)
	}
}
```

```tsx
// src/components/sky/SkyPauseToggle.tsx (rendered by Navbar, a client entry: no directive here)
import { useSyncExternalStore } from 'react'
import { PauseSVG } from '@/components/icons'
import { cn } from '@/lib'
import { setSkyPaused, skyPaused, skyPausedOnServer, subscribeSkyPause } from './skyPause'

interface SkyPauseToggleProps {
	className?: string
}

/**
 * Pause control for the home sky's drift, twinkle and shooting stars (WCAG 2.2.2, technique G186). A toggle button: its
 * name stays "Pause sky animation" and aria-pressed tells whether the sky is paused (WAI-ARIA APG). The label is
 * visible in the mobile menu and for screen readers only on desktop, where the icon stands alone.
 */
export default function SkyPauseToggle({ className }: SkyPauseToggleProps) {
	const paused = useSyncExternalStore(subscribeSkyPause, skyPaused, skyPausedOnServer)
	return (
		<button
			type="button"
			aria-pressed={paused}
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex items-center gap-[10px] min-h-[40px] min-w-[40px] justify-center cursor-pointer text-green rounded-[5px] border border-transparent hover:border-dashed hover:border-green aria-pressed:bg-green-tint aria-pressed:border-green forced-colors:hidden',
				className
			)}
		>
			<PauseSVG />
			<span className="md:sr-only">Pause sky animation</span>
		</button>
	)
}
```

- **Navbar** (`Navbar.tsx:152-161`): after the Resume `motion.div`, a second `motion.div` with `variants={navItemVariants}`, `custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}`, `initial="hidden"`, `animate="visible"`, holding `<SkyPauseToggle className="md:ml-[15px]" />`. One element serves desktop (inline, icon only) and the phone menu (labelled); the slide-in menu is "at the top of the page" (G186).
- **Icon:** `src/components/icons/PauseSVG.tsx` on the shared `Icon` frame (two vertical strokes), default export, named re-export in `icons/index.ts`.
- **mountSky** (`mountSky.ts:146-149`, `:243-247`): `motion()` becomes `forcedColors.matches ? 'off' : skyPaused() ? 'reduced' : 'full'`; the reduce-motion listener is replaced by `const stopPause = subscribeSkyPause(syncMotion)` (the store already watches that query), called in `destroy`; the `REDUCED_MOTION_QUERY` import moves to `skyPause.ts`.
- **Protocol doc** (`protocol.ts:26-32`): "`reduced`: prefers-reduced-motion or the page's pause control (skyPause.ts), so fades and brightness only".
- **Why `useSyncExternalStore`:** a boolean snapshot satisfies "repeated calls must return the same value while the store has not changed", and the server snapshot keeps hydration of IntroGate's hidden preload tree consistent; at the reveal the tree remounts on the client and reads the real value (§5.3).

### 6.9 The transient system

#### 6.9.1 Types (`src/lib/sky/transients.ts`, P9; the meteor joins in P11)

```ts
import { SATELLITE, TRANSIENTS } from './config'
import type { MeteorField } from './meteors'
import { between } from './random'
import { planSatellite, type Satellite } from './satellites'
import { smoothstep } from './scene'

/** Short-lived sky events, one scheduler for all. 'meteor' joins after the veil commit (P11). */
export const TRANSIENT_KINDS = ['satellite'] as const

/** One kind of transient. */
export type TransientKind = (typeof TRANSIENT_KINDS)[number]

/** Bookkeeping every transient carries. Times are seconds on the worker clock. */
interface TransientState {
	startedAt: number
	/** Seconds from first light to last light, wake or train included; at most TRANSIENTS.maxLife. */
	lifetime: number
	/** Its planned path comes within QUIET.feather of quiet copy: it holds the single ink lease until it retires. */
	nearCopy: boolean
	/** scrollY at launch: once the page scrolls TRANSIENTS.cancelDistance from here, it fades out. */
	launchScrollY: number
	/** When it began fading out early (scroll, pause); null while it runs its course. */
	cancelledAt: number | null
}

/** A satellite pass. */
export interface SatelliteTransient extends TransientState {
	kind: 'satellite'
	satellite: Satellite
}

/** Any active transient; `kind` selects its planner, timing and drawing. */
export type Transient = SatelliteTransient

/** The member of Transient for one kind. */
export type TransientOf<K extends TransientKind> = Extract<Transient, { kind: K }>

/** Where and whether transients may launch now; the worker fills it from its own state. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero showing (today's meteorsAllowed). */
	allowed: boolean
	/** No scroll for FRAME.meteorScrollQuietMs. */
	settled: boolean
	narrow: boolean
	secondsSinceReveal: number
	scrollY: number
	/** The viewport and the padded quiet rects in screen CSS px. */
	field: MeteorField
	/** Until P11, the shooting star scheduled outside the scheduler: when the current one started and when the next is due (s). */
	outsideOnsets: readonly number[]
}

/** How one kind is timed and planned. Drawing lives with the canvas code (renderSky.ts). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before the first one. */
	firstDelay(random: () => number): number
	/** Seconds from one launch to the next attempt. */
	gap(random: () => number, secondsSinceReveal: number): number
	/** May this kind launch under this gate at all (screen size, scene)? */
	eligible(gate: LaunchGate): boolean
	/** A plan for the gate's field (near copy only when `nearCopy` allows it), or null when nothing fits. */
	plan(random: () => number, gate: LaunchGate, now: number, nearCopy: boolean): TransientOf<K> | null
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
	/** Last launch of any kind (s), for TRANSIENTS.spacing. */
	lastLaunchAt: number
	/** Last launch that may burn out behind copy (s), for the crossing cooldown (P13). */
	lastCrossingAt: number
}
```

#### 6.9.2 The registry and scheduler

```ts
/** The specs, typed so a kind without one fails to compile. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = {
	satellite: {
		firstDelay: (random) => between(random, SATELLITE.after[0], SATELLITE.after[1]),
		gap: (random, seconds) => nextGap(random, SATELLITE.gap, seconds),
		eligible: (gate) => !gate.narrow,
		plan: (random, gate, now) => satelliteTransient(planSatellite(random, gate.field, now), gate, now),
		moving: (transient, now) => now - transient.startedAt < transient.lifetime,
		maxActive: 1,
	},
}

export function createTransientSchedule(): TransientSchedule
/** Starts the clocks at the reveal: each kind's first launch waits its own first delay. */
export function revealTransients(schedule: TransientSchedule, random: () => number, now: number): void
/**
 * Retires transients past their lifetime or cancel fade, starts the cancel fade of any the page has scrolled under,
 * then launches every kind that is due and allowed: within its own and the global TRANSIENTS.maxActive, at least
 * TRANSIENTS.spacing after any other onset (outside ones included), and near copy only while the ink lease is free.
 * Returns true when the set changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: () => number, now: number, gate: LaunchGate): boolean
/** Pause, reduced motion: every active transient starts its cancel fade now. */
export function cancelTransients(schedule: TransientSchedule, now: number): void
/** Hidden tab or resize: drop them all at once (nothing is on screen, or the layout they were planned for is gone). */
export function dropTransients(schedule: TransientSchedule): void
/** True while any transient moves on screen. */
export function transientsMoving(schedule: TransientSchedule, now: number): boolean
/** Share of its light a transient keeps while fading out early: 1 until cancelledAt, 0 TRANSIENTS.cancelFade later. */
export function transientFade(transient: Transient, now: number): number {
	return transient.cancelledAt === null ? 1 : 1 - smoothstep(transient.cancelledAt, transient.cancelledAt + TRANSIENTS.cancelFade, now)
}
/** The ink lease is free: no active transient's path comes near quiet copy. */
export function inkLeaseFree(active: readonly Transient[]): boolean {
	return !active.some((transient) => transient.nearCopy)
}
/** Seconds until the next launch of a clock: Poisson arrivals with a refractory floor and a cap, stretched on long visits. */
export function nextGap(random: () => number, gap: { floor: number; mean: number; cap: number }, secondsSinceReveal: number): number {
	const stretch = Math.min(TRANSIENTS.slowMax, 1 + Math.max(0, secondsSinceReveal - TRANSIENTS.slowFrom) / TRANSIENTS.slowScale)
	return Math.min(gap.cap, gap.floor - gap.mean * Math.log(1 - random())) * stretch
}
```

- **`satelliteTransient(plan, gate, now)`** wraps a plan in the bookkeeping (`lifetime` = the pass's life, `nearCopy` false, `launchScrollY` = `gate.scrollY`, `cancelledAt` null), or returns null when the plan is null.
- **Scroll cancel, one rule for every kind:** in `updateTransients`, any transient with `|gate.scrollY - launchScrollY| > TRANSIENTS.cancelDistance` and no `cancelledAt` gets `cancelledAt = now`; it retires `cancelFade` later. The rule reads `scrollY` on the scheduler's tick, so it needs no edit to the veil-owned `scroll` handler. Before V0 it covers satellites only; the veil session's own fix covers its meteor; at P11 the two become this one implementation, with the veil session's distance and fade (IR-4).
- **Onset spacing with the outside meteor** (P9-P10): the gate passes the legacy meteor's `startedAt` and `nextMeteorAt`, and the scheduler launches nothing within `TRANSIENTS.spacing` of either, so a satellite never starts within 3 s of a shooting star even though `updateMeteor` (veil-owned) doesn't know satellites exist.
- **The ink lease** is inert in P9 (satellites never take it) and becomes live in P11 when shooting stars join: a near-copy plan is allowed only when `inkLeaseFree(active)` and (P13) `now - lastCrossingAt >= METEOR_RATE.crossingCooldown`; otherwise the kind plans clear-sky only (IR-2).
- **Drawing** (`renderSky.ts`), with a `never` check so a kind without a case fails to compile (a `Record` of drawers would need a cast, microsoft/TypeScript#30581):

```ts
/** Draws one transient at the frame's time, faded by any early exit; a kind without a case fails to compile. */
export function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame): void {
	const fade = transientFade(transient, frame.time)
	switch (transient.kind) {
		case 'satellite':
			drawSatellite(ctx, assets, transient.satellite, frame, fade)
			return
		default: {
			const unknown: never = transient.kind
			return unknown
		}
	}
}
```

- **Worker glue (P9):** `const transients = createTransientSchedule()`; `reveal()` calls `revealTransients`; `tick()` calls `updateTransients(transients, random, t, launchGate(now))` beside `updateMeteor` and sets `needsDraw` when it returns true; `draw()` draws each active transient after the sky; the `motion` handler calls `cancelTransients` when leaving full motion; the hidden branch of `visible` and `resize()` call `dropTransients`; `frameDemands` asks for every frame while `transientsMoving` (cancel fades included); the sleep path's wake-up timer also covers the scheduler's earliest `nextAt`.

#### 6.9.3 Config

```ts
/**
 * Short-lived sky events (satellites, and shooting stars once they join the scheduler): at most `maxActive` in the sky at
 * once, and any two onsets at least `spacing` seconds apart, so each is its own event (a motion onset captures attention).
 * A moving one fades out over `cancelFade` seconds once the page scrolls `cancelDistance` px from where it launched (copy
 * scrolling under it would otherwise meet it unveiled), or when the sky pauses. Each lasts at most `maxLife` seconds
 * from first light to last (WCAG 2.2.2). Gaps stretch on long visits: from `slowFrom` seconds after the reveal by
 * 1 + (t - slowFrom) / slowScale, at most `slowMax` times (doubled at 6 minutes, tripled at 10), so the sky never turns
 * into a screensaver.
 */
export const TRANSIENTS = { maxActive: 2, spacing: 3, cancelDistance: 16, cancelFade: 0.25, maxLife: 5, slowFrom: 120, slowScale: 240, slowMax: 3 } as const
```

`cancelDistance` 16 and `cancelFade` 0.25 are the low end of the veil session's "about 16-24 px" and R2's 0.2-0.3 s; at V0 they take the veil session's values.

### 6.10 Satellites (P9)

- **Look and motion** [R2 §6.1; R4 §4.4]: a steady point (no twinkle, no wake, never blinking), warm white (palette index 4), alpha 0.25-0.5 (about magnitude 2.5-5, never brighter than a mid star), drawn with the phased star sprites so it glides; a straight line at constant speed, 1.2-2.5°/s of the sky window, which is 26-54 CSS px/s on a 1440-px laptop (21.8 px per degree at the window's center) [computed]. Each pass enters from beyond an edge already lit, or fades in over 0.8 s (leaving Earth's shadow); 60% end by fading into the shadow over 1.2-1.5 s while warming toward pale orange (palette index 6, R/(R+G+B) 0.40, far from saturated red), the rest leave through an edge. First light to last light at most 4.8 s.
- **Where and when:** desktop hero only (not narrow), clear sky only, one at a time, on its own clock: gaps of 40 s + Exp(50 s) capped at 150 s, a mean gap of 84.5 s (about 88 s launch to launch); the first comes between 30 and 110 s after the reveal (uniform, so no visitor sees it at a fixed moment: 37.7% of visits get one in the first minute, R2's 30-40%); with the long-visit stretch, about 4.7 passes in the first 10 minutes [computed].
- **Veil:** planned in clear sky (every point of the pass beyond the feather of every padded quiet rect) and drawn through `easedQuietFactor` with the near layer's keeps (`LAYERS.near`: 0 at the padded edge and on the ink), so it adds no light on copy and never needs the ink lease. Scroll-cancelled like every transient.

```ts
/**
 * Satellites: steady sunlit points (no twinkle, no wake, never blinking) gliding in a straight line at constant speed, as
 * NASA describes the space station. Real low orbits cross about 1°/s overhead and 0.1-0.3°/s low in the sky; these run
 * `speed` °/s of the sky window (SKY_WINDOW), 2-3 times faster, so a whole pass stays under `life` seconds (WCAG 2.2.2).
 * Each enters from beyond an edge or fades in over `fadeIn` s, leaving Earth's shadow, and `shadowShare` of them fade into
 * it over `fadeOut` s while warming from palette index `tint` to `shadowTint`, as real ones redden. Alpha `alpha`, about
 * magnitude 2.5-5: never brighter than a mid star; drawn with star shape `shape`. Clear sky only, desktop hero only, one
 * at a time, on their own clock: gaps of `gap.floor` plus an exponential extra with mean `gap.mean`, at most `gap.cap`
 * seconds (84.5 on average), the first at a uniform moment within `after` seconds of the reveal (about one visit in
 * three sees one in its first minute); up to `attempts` candidate passes per launch.
 */
export const SATELLITE = {
	gap: { floor: 40, mean: 50, cap: 150 },
	after: [30, 110],
	speed: [1.2, 2.5],
	alpha: [0.25, 0.5],
	life: 4.8,
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
	tint: 4,
	shadowTint: 6,
	shape: 3,
	attempts: 40,
} as const

/**
 * The screen as a window on the sky, for the angular speeds of satellites and (P12) shooting stars: its longer side spans
 * `fov` degrees, so a 1440-px laptop shows about 22 px per degree at the center.
 */
export const SKY_WINDOW = { fov: 60 } as const
```

```ts
// src/lib/sky/satellites.ts
import { METEOR, QUIET, SATELLITE } from './config'
import type { MeteorField } from './meteors'
import { between } from './random'
import { quietAt, smoothstep } from './scene'
import { pixelsPerDegree } from './skyWindow'

/** One satellite pass. Lengths in screen CSS px, times in seconds on the worker clock. */
export interface Satellite {
	startX: number
	startY: number
	/** Unit direction of travel. */
	dirX: number
	dirY: number
	/** Constant speed (px/s). */
	speed: number
	/** Steady brightness, 0-1. */
	alpha: number
	/** Seconds of fade-in from Earth's shadow; 0 when it slides in from beyond an edge. */
	fadeIn: number
	/** Seconds after first light when it starts fading into Earth's shadow; null when it leaves through an edge. */
	shadowFrom: number | null
	/** Seconds from first light to last light (at most SATELLITE.life). */
	life: number
	startedAt: number
}

/** A straight, steady pass in clear sky, or null when none fits in SATELLITE.attempts tries. */
export function planSatellite(random: () => number, field: MeteorField, now: number): Satellite | null

/** A satellite at `now`: position, brightness, and warmth (0 sunlit to 1 at its shadow tint). */
export function satelliteAt(satellite: Satellite, now: number): { x: number; y: number; light: number; warmth: number }
```

Planning, per attempt: draw the end (shadow with `shadowShare`) and the speed; draw a heading at least 20° from vertical (a vertical glide reads as scrolling); for a shadow ending, a start anywhere in the clear band (below `METEOR.top`, above `METEOR.maxEndY` of the height, `METEOR.edgeMargin` inside the sides), entering by fade-in or, when the backward ray meets a side or top edge within 0.8 s of travel, sliding in from beyond that edge; for an edge ending, an exit point on the top or a side edge and the start one life back along the heading, fading in. Accept the first pass whose points, sampled every 4 px, all have `quietAt(field.quiet, x, y) === 0` (beyond every feather; before V0 this sampled test stands in for the private `segmentTouches` with `QUIET.feather` margin, and at V0 it switches to the exported one, IR-6). `skyWindow.ts` (P9) holds `pixelsPerDegree(width, height) = (max(width, height) / 2 / tan(fov / 2)) × π / 180`.

Drawing: `drawSatellite` reads `satelliteAt`, multiplies the light by the cancel fade and by `easedQuietFactor(frame.quiet, x, y, LAYERS.near)`, and draws two phased sprites at the same point (shape 3), the sunlit tint at `light × (1 - warmth)` and the shadow tint at `light × warmth`: under additive compositing that is an exact color mix, with no tint step.

### 6.11 The meteor population model and speed classes (BLOCKED: P12, P14)

Settled by the brief from R2 (§4-5, §10); summarized here, with what changes in the code. All of it lands through the interface requests in §8.2 or, if declined, through our own edit of `planFlight`'s direction lines (`meteors.ts:140-145`) after V0.

- **The window:** a 60° gnomonic window whose center looks 40° above a horizon just below the screen (`SKY_WINDOW` gains `elevation: 40`, `meteorHeight: 100`, `earthRadius: 6371`). Straight 3-D paths project to straight lines, and parallel paths meet at their radiant's vanishing point.
- **Sources per visit:** one shower radiant (40% of launches, scatter σ 1.5°, one speed class for the visit) and three sporadic sources (60%, σ 15°: slow, medium and fast, like the antihelion, toroidal and apex sources). Radiant elevations have density sin h × cos h (hourly rates scale with sin h, weighted by solid angle), azimuths uniform. Result: about 77% fall, 13% cross sideways, 10% climb, half go each way; the median meteor flies 58° from its radiant [R2 §4.3].
- **The aim:** for a candidate start point, `radiantMotion(view, radiant, x, y)` gives the screen direction `(u r_z - r_x, v r_z - r_y)` and the rate; the speed is `SPEED_CLASSES[class].angular × DEG × focal × rate / rangeFactor`, where the range to a 100-km meteor layer, `q(e) = √((R + h)² - R² cos² e) - R sin e`, makes low meteors slower, shorter and dimmer. The 18-42° filter goes; the layout guards stay (110 px under the navbar, the 12 px edge margin, ends above 0.72 of the height, length bounds, every veil check).
- **Soft guards:** climbing paths (dirY < -sin 15°) only from sporadic sources and at most 0.6 of the maximum length; minimum length 40 px only within 10° of an on-screen radiant, otherwise today's 160 px (110 narrow).
- **The radiant on screen** on 15% of visits, in clear sky in the top 45% of the screen and outside every feather: meteors near it are short slow stubs. (Head-on point flashes within 1° of it are a "could", P15.)
- **Speed classes** (P14): slow 9°/s for 1.1-1.4 s with a warm wake; medium 14°/s for 0.8-1.1 s, white; fast 22°/s for 0.55-0.8 s, mint, the only class that may leave a train. 30% of ordinary meteors are faint (peak 0.3-0.5). Fireballs drop to 4% of launches, at least 120 s apart, none in the first 20 s, flights 1.8-2.5 s (deviation 2), clear sky only as today.
- **Config sketches:** `RADIANTS`, `SPEED_CLASSES` and the `SKY_WINDOW` extension exactly as R2 §10 gives them (with the doc comments there), and `src/lib/sky/radiants.ts` with `SkyDirection`, `toward`, `sampleRadiant`, `RadiantMotion`, `radiantMotion`, `elevationAt` and `meteorRange` (R2 §10; `skyWindow` itself already exists from P9). `METEOR.angle`, `radiantX`, `radiantY`, `radiantJitter` and `pickRadiant` are removed when the aim replaces them.

### 6.12 Rates, lease and crossing cooldown (BLOCKED: P13)

```ts
/**
 * Shooting-star launches. A dark site sees 1-3 sporadic meteors an hour in the evening and 4-10 before dawn (AMS), and
 * the window holds about 29% of an observer's 50°-radius field (IMO): a real window shows one every 25-100 minutes, one
 * every 2-4 at a Perseid or Geminid peak. The hero compresses that about 120 times: gaps, counted from the end of the
 * last flight, are `floor` plus an exponential extra with mean `mean`, at most `cap` (11.7 s on average, about 5 in the
 * first minute), stretched on long visits (TRANSIENTS). Narrow screens wait longer (21 s on average) and stop at
 * `narrow.limit` a visit. After a flight that may burn out behind quiet copy, the next `crossingCooldown` seconds plan
 * clear-sky flights only, so crossings stay no more frequent than before this rate (about one every two minutes).
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	narrow: { floor: 8, mean: 14, cap: 45, limit: 6 },
	crossingCooldown: 40,
} as const
```

- **Computed checks:** desktop mean gap 11.69 s (3.9% of gaps hit the cap, 22% fall within 2 s of the floor); narrow 21.00 s; first minute after the reveal: median 5 meteors, 3-6 in 90% of visits (today median 2); minutes 9-10: median 2 [computed, 20,000 simulated visits].
- **Crossings:** today about 0.50 a minute (36% of 1.40 launches a minute). With R2's synthetic shares, a 40 s cooldown gives 0.52 (16%) to 0.59 (19%) a minute; 45 s restores parity at 16%, 55 s at 19% [computed]. Set the cooldown from the veil session's measured share (§8.2 IR-7) with this table, and accept on "≤ today's" (AC-18b).
- **Order inside P13:** the rate rises only after P12 has cut the crossing share (new directions fly away from the left-aligned copy half the time). With today's geometry (36%) the same rate and a 40 s cooldown would give about 0.8 crossings a minute.
- `METEOR.gapMin`, `gapMeanExtra`, `gapMax`, `slowAfter`, `slowFactor`, `narrowLimit` and `nextMeteorGap` go; meteors use `nextGap` and `TRANSIENTS`' stretch like satellites (one gap function for every clock).

### 6.13 The could kinds (P15, each its own phase, user-selected)

| Kind | Spec in one line | Veil rule | Needs the veil commit? |
|---|---|---|---|
| Near-radiant stationary flash | Within 1° of an on-screen radiant: a point that brightens and fades in 0.3-0.5 s without moving, peak ≤ 0.7, at most one a minute | Clear sky only | Yes (needs P12's on-screen radiant) |
| Burst | 2-4 faint members from the shower radiant, staggered 0.35-1.2 s, whole span ≤ 5 s, no flares or trains, 5% of launches, ≥ 90 s apart, after 45 s, desktop | All members clear sky only | Yes |
| Earthgrazer | ≥ 0.45 of the width, within 12° of horizontal, 4-6°/s, 2.5-3.5 s (plus 0.54 s of wake: 4.04 s total), warm, 2.5% of launches, ≥ 180 s apart, ≥ 1280 px wide | Clear sky only | Yes |
| Static comet | 1 visit in 8-10, hero, desktop: pseudo-nucleus alpha ≤ 0.6, mint coma σ 3-6 px alpha ≤ 0.14, curved pale dust tail 90-200 px alpha ≤ 0.08, straight blue-white ion tail alpha ≤ 0.035, tails away from a Sun below the horizon; fades in over 8-12 s; moves only with the camera at a declared nearness | Near-layer keeps (0 near copy); its whole box outside the padded rects, re-tested on layout | **No**: static, star-like, no lease, no scroll cancel |
| Planet | One near-layer point at alpha 0.78, twinkle 0, slightly wider core, warm white; part of the reviewed sky | Near-layer keeps | **No**, but it changes the reviewed composition |
| Farewell meteors | Up to 2 in the end bookend once its level is ≥ 0.9 and the visitor has rested 3 s, 8 + Exp(14) s | Full veil (Contact and the footer are quiet copy) | Yes |

Won't (R2 §6.4): outbursts without a pause control, the ISS, Starlink trains, glints, the Milky Way, zodiacal light, aurora, airplanes, and anything that blinks.

### 6.14 Protocol changes

| Message | Direction | Phase | Shape and doc |
|---|---|---|---|
| `activity` | main → worker | P5 | `{ type: 'activity' }`: the visitor is here without scrolling; at most one a second. |
| `motion` | main → worker | P6 (doc only) | Unchanged shape; `'reduced'` now also means the pause control. |
| `pointer` | main → worker | P10 | `{ type: 'pointer'; at: { x: number; y: number } \| null }`: a fine pointer's position, -1..1 from the viewport center (x right, y down), at most one per animation frame; `null` once it leaves the window or the window blurs. |
| `tick` | main → worker | P16 only | `{ type: 'tick' }`: one main-thread animation frame, relayed while the worker asks. |
| `relay` | worker → main | P16 only | `{ type: 'relay'; on: boolean }`: start or stop relaying frames (WebKit). |

The veil session may add a per-rect text class to `SkyRect` or the `layout` message (COORDINATION.md); our messages don't touch those.

## 7. Implementation phases

### 7.0 Working rules for every phase

- **Where:** a feature branch off master, one commit per phase (a large phase may use one commit per numbered step, each green). In the worktree `node_modules` is missing: run `npm ci` there first, or implement in the main checkout.
- **Order:** P0-P10 are independent of the veil and run in order (P5 and P6 may swap). V0 runs **whenever** the veil commit lands, even mid-sequence: finish the current phase, then rebase before starting the next. P11-P15 are **BLOCKED** until V0 (or F1). P16 waits for device tests.
- **Gate before each phase:** checkpoint CP-1 (§8.1): has the veil commit landed?
- **Gate after each phase:** `npm run lint` and `npm run type-check` clean; the phase's harness checks pass; the phase's browser checks pass; evidence (harness output, trace numbers, screenshots) goes into the commit or PR description, never into the repository as files.
- **Shippable means:** after the phase, master could deploy as is. Phases that change nothing visible prove it (identity harnesses plus the reduced-motion screenshot). P7 (drift) never merges before P6 (pause control): no commit ever has continuous motion without its WCAG 2.2.2 control.
- **Reversible means:** each phase names a **kill switch** (a config value that restores today's behavior without a revert, where one exists) and its **revert** (the commit, plus any later phase that depends on it, per §7.2).
- **Never POST to `/api/schedule/book`.** Nothing here touches it; the rule stands.

### 7.1 Verification kit (no test runner)

**Commands.** `npm run lint`; `npm run type-check` (runs `next typegen` first). While `next dev` runs (`portfolio-dev` in `.claude/launch.json`): `/_next/mcp` `get_errors` and `get_compilation_issues` for `/`. At the end of P4 and P9 (they change the worker's module graph), with the dev server stopped: `npm run build`, then the `portfolio-prod` preview, and confirm the sky draws with no console errors. If `next dev` or `next build` stops with an upgrade reminder, tell the user and rerun; don't upgrade.

**Scratch harnesses** (in the implementing session's scratchpad; never committed). Node 24 runs TypeScript by stripping types, but its ESM loader rejects the extensionless relative imports in `src/lib/sky` [computed]. A 12-line resolve hook fixes that without copying or editing a source file, and it also maps `@/`:

```js
// ts-resolve.mjs (scratch only): load the repo's TypeScript as is. SKY_SRC is the src folder under test.
import { pathToFileURL } from 'node:url'
const src = pathToFileURL(`${process.env.SKY_SRC}/`).href
export async function resolve(specifier, context, next) {
	const mapped = specifier.startsWith('@/') ? new URL(specifier.slice(2), src).href : specifier
	try {
		return await next(mapped, context)
	} catch (error) {
		if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !(mapped.startsWith('.') || mapped.startsWith('file:'))) throw error
		return next(`${mapped}.ts`, context)
	}
}
// register.mjs: import { register } from 'node:module'; register('./ts-resolve.mjs', import.meta.url)
```

Run as `SKY_SRC=<checkout>/src node --import ./register.mjs h-<name>.ts`. A baseline tree for before/after comparisons: `git archive 246c0aa src/lib/sky src/components/sky | tar -x -C <scratch>/baseline`, then `SKY_SRC=<scratch>/baseline/src`. Worker files load too, with two stubs for the canvas globals (`ImageData`, `OffscreenCanvas`) and a recording 2D context; this session loaded `skyAssets.ts` that way and reproduced R3's atlas sizes (68×180 at DPR 1, 100×326 at DPR 2) [computed]. Harness code must use erasable TypeScript only (no parameter properties, enums or namespaces: strip-only mode rejects them), and so must `src/lib/sky` (it does today).

| Harness | Proves | Pass |
|---|---|---|
| **H1** atlas | Phase sprites match today's at phase 0 and keep their light | Phase-(0,0) bytes equal the baseline's for every tint and shape at DPR 1, 1.25, 1.5, 2; every phase's alpha sum within 0.01% of phase 0's; with `STAR_PHASES = 1` the whole atlas equals the baseline's |
| **H2** draw calls | Nothing visible changed | `drawSky` on a recording context, for scenarios {scroll 0, 1234.5, 5000} × {no zones, 31 rects settled, 31 rects mid-ease} × {dusk at 0.8 s, done} × {DPR 1, 2} × {keep full, thinned}: the list of (destination x, y, size, globalAlpha, source-pixel hash) equals the baseline's exactly |
| **H3** quiet index | The index is exact | 100,000 random points × {31, 64 rects} × {settled, level 0.37} × {1440×900, 3840×2160, 390×844} × every layer's keeps: `Object.is(index.factor, easedQuietFactor)` always; unchanged zones never rebuild |
| **H4** pacing | The clock plans what §6.2 says | `planFrames` reproduces §6.2.1's table; the governor lowers k at once and raises it only after 0.5 s; synthetic timestamps: 16.667 ms → 60 Hz aligned, 8.333 → 120 Hz, 15.0 ± 0.2 → unaligned, 33 ms gaps ignored, `pause()` drops the next interval |
| **H5** camera | The drift and springs behave | `driftAt(0) = 0`; over 6 h: speed in [0.58, 1.42] v₀, wander ≤ 205.3 px at q = 1, turn rate in [0.3, 5]°/s and never negative, speed change ≤ 10%/s; spring: two half steps equal one step within 10⁻¹², monotone with no overshoot from rest at dt ∈ {1/144, 1/60, 1/15, 0.25, 5} s; freeze, 5000 px of scroll, resume: position continuous within 10⁻⁹ px; level at 95% after 3.0 s; a 5 s stall advances the clock ≤ 0.1 s; snap beyond one viewport |
| **H6** depth | The depth law is as specified and the catalog didn't move | q bands 0.240-0.389, 0.389-0.741, 0.741-1.600; band means 0.293, 0.501, 1.024; monotone; capped below m 0.112; `cellStars` for 1,000 cells per layer equals the baseline field by field except the added `q` |
| **H7** scheduler and satellites | Transient invariants | 10,000 simulated 10-minute desktop visits on R2's synthetic hero layout with a stub legacy-meteor clock: lifetimes ≤ 4.8 s; ≥ 3 s from every meteor onset; no pass point within the feather of a padded rect (checked every 1 px); constant speed; a scroll of 17 px starts the fade and the pass is gone 0.25 s later; a pause fades everything within 0.25 s; none on narrow screens or past 0.4 viewport heights; from P11: never two lease holders |
| **H8** directions | The population model | 200,000 samples: falling 77 ± 3%, sideways 13 ± 3%, climbing ≤ 12%, left and right 50 ± 3%; radiant on screen in 15 ± 1% of visits; crossing share on R2's synthetic layout 0.16-0.19 |
| **H9** rates | The frequency model | Mean gaps 11.69 s (hero) and 21.00 s (narrow); first minute median 5 with 3-6 in ≥ 88% of visits; crossings a minute ≤ today's 0.50 with the chosen cooldown and the measured crossing share |
| **H10** limits | Per-kind 5 s and flash rules from the config | Every kind's longest first-to-last light ≤ 5 s (fireball with train 4.9 s); burst stagger ≥ 0.35 s; no drawable tint with R/(R+G+B) ≥ 0.8 (max is 0.423) |

**Browser checks.** Chrome DevTools: Performance (the worker's track shows each drawn frame and its JS time), the Rendering panel (emulate `prefers-reduced-motion`, `forced-colors`, `prefers-contrast`), the Task Manager (CPU of the tab). Safari Web Inspector (Timelines, Energy Impact on macOS; an iPhone over USB). The Firefox Profiler. R4's 60-second watch protocol (§9.1). Playwright MCP, if the session has it, for reduced-motion screenshots and media emulation; don't add Playwright to the repository. Frame counters or timing logs needed for a check are a **local, uncommitted** patch (for example a `console.debug` per second in the worker), removed before committing.

### 7.2 Phase map

```
P0 baseline ─► P1 phase atlas ─► P2 camera-ready drawLayer + stamp cache ─► P3 quiet index ─┐
               P4 frame clock + pacing ────────────────────────────────────────────────────┤
               P5 presence ────────────────────────────────────────────────────────────────┤
               P6 pause control ───────────────────────────────────────────────────────────┴─► P7 camera + drift ─► P8 continuous depth
               P4 + P1 ─► P9 scheduler + satellites                                           P7 ─► P10 pointer lean (optional)
 ─────────────────────────────────────── veil boundary ─────────────────────────────────────────────────────────────────────
 V0 rebase (when the veil commit lands) ─► P11 meteors join the scheduler ─► P12 directions ─► P13 rate + cooldown ─► P14 classes + fireballs
                                           P11 ─► P15 could kinds (comet and planet need only P8)        P4 ─► P16 WebKit relay (device tests)
 If the veil never lands: CP-4 decision ─► F1 takeover ─► then P11-P15 as above
```

| Phase | Visible change | Blocked on the veil? | Depends on | Kill switch | Approx. size |
|---|---|---|---|---|---|
| P0 | none | no | | | 0 (no code) |
| P1 | none | no | | `STAR_PHASES = 1` | ~120 lines |
| P2 | none | no | P1 | | ~90 |
| P3 | none | no | P2 | | ~150 |
| P4 | none | no | | | ~300 |
| P5 | twinkle stays while the visitor is active | no | | | ~40 |
| P6 | the pause button | no | | | ~150 |
| P7 | **the drift and scroll glide** | no | P1-P6 | `DRIFT.speed = 0` and `CAMERA.snapViewports = 0` | ~300 |
| P8 | bright stars deeper in scroll | no | P7 | | ~50 |
| P9 | satellites | no (deviation 1) | P1, P4 | `SATELLITE.gap.floor = Infinity` | ~400 |
| P10 | lean toward the pointer | no | P7 | `POINTER.reach = 0` | ~100 |
| V0 | none | lands with it | the veil commit | | merge |
| P11 | meteors fade on pause | **yes** | V0, P9 | | ~200 |
| P12 | varied directions | **yes** | P11 | | ~250 |
| P13 | about 5 meteors a minute | **yes** | P11, P12 | today's gaps in `METEOR_RATE.hero` | ~80 |
| P14 | speed classes and colors | **yes** | P12 | | ~120 |
| P15 | each "could" kind | **yes** (comet, planet: no) | P11 (comet, planet: P8) | per kind | ~100-200 each |
| P16 | none (smoother Safari) | no | P4 + device tests | relay off | ~40 |

### 7.3 The phases

#### P0. Baseline and preflight (no code)

- **Goal:** measure today so every later phase can prove "no change" or "this much change", and open the line to the veil session.
- **Steps:**
  1. `git fetch origin`; record `git log --oneline -3 origin/master-r26syw` and `git log --oneline 246c0aa..origin/master -- src/lib/sky src/components/sky`. If the veil commit has landed, do V0 first.
  2. Branch from master; `npm ci` if needed; `npm run lint` and `npm run type-check` must be clean before any change.
  3. Set up the harness kit (§7.1) and the baseline tree; record H2's baseline draw-call lists.
  4. Browser baselines (Chrome, 1440×900 at DPR 2, and once at DPR 1): a reduced-motion screenshot of the hero after the dusk; a 60 s Performance trace of the hero hands-off (drawn frames per second, worker JS per frame); a 30 s trace in the reading scene (expect 0 frames); the tab's CPU in the Task Manager during hero idle; R4's 60 s watch notes (meteor count and directions). Repeat the watch on an iPhone if one is available.
  5. Send the CP-0 message (§8.2) and log it in `COORDINATION.md`.
- **Exit:** baselines saved in the scratchpad; CP-0 sent.

#### P1. Phase-sprite atlas (no visible change)

- **Goal:** sub-pixel sprites exist and are proven identical at phase 0; nothing uses other phases yet.
- **Files:** `config.ts` (`STAR_PHASES`); `skyAssets.ts` (`profile`, new `paintSprite`, the phased layout in `buildStarAtlas`, `starSpriteIndex`, the `StarAtlas.stars` index doc); `renderSky.ts` (`placePoint` and `corner`; `drawLayer` calls it; `SkyFrame.snap`); `sky.worker.ts` (`frameAt` sets `snap: true`).
- **Steps:** add the constant; replace `gaussianAt` with `profile` and the separable painter (§6.3); lay out 4×4 phase blocks per tint and shape; replace the index; add `placePoint`; route `drawLayer` through it with `frame.snap`.
- **Visible change:** none (`snap` is always true, so every star still rounds to the same pixel and uses the phase-0 sprite).
- **Verification:** lint, type-check; H1; H2 (identical lists); the reduced-motion screenshot equals P0's pixel for pixel; atlas memory in DevTools about 1.9 MB at DPR 2.
- **Rollback:** kill switch `STAR_PHASES = 1`; revert the commit (P2 depends on `placePoint`).

#### P2. Camera-ready drawLayer and stamp cache (no visible change)

- **Goal:** `drawLayer` draws from a 2-D camera vector with per-star nearness math, and the cache evicts by stamp.
- **Files:** `config.ts` (`CAMERA = { scrollParallax: 0.07 }` only; P7 adds the rest); `renderSky.ts` (`SkyFrame.camera` replaces `parallaxScroll` at `:71-72`; `drawLayer` per §6.5 with the layer's constant nearness `LAYERS[layer].parallax / CAMERA.scrollParallax`; `StarField.beginFrame`/`trim` stamps; key comment; `EDGE` doc); `sky.worker.ts` (`frameAt`: `camera: { x: 0, y: CAMERA.scrollParallax * parallaxScroll }`).
- **Visible change:** none: the same cells, positions and draw calls.
- **Verification:** lint, type-check; H2 identical (destination pixels identical after rounding; the nearness ratio `0.04 / 0.07` times `0.07 × s` can differ from `0.04 × s` in the last bit, which can never move a rounded pixel except at an exact half, so H2 compares rounded destinations); a cache harness: a camera moving 25 px/s for 10 simulated minutes keeps the cache at most twice the visible cells and never regenerates a visible cell; the reduced-motion screenshot equals P0's; scrolling looks unchanged.
- **Rollback:** revert (P3 and P7 depend on it).

#### P3. Exact quiet index (no visible change)

- **Goal:** the per-star quiet lookup costs about a fifth of today's on big screens, bit for bit the same.
- **Files:** `src/lib/sky/quietIndex.ts` (new); `renderSky.ts` (`SkyFrame.quietIndex`; `drawSky` calls `frame.quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)` before the layers, since `renderSky.ts` owns `EDGE`; `drawLayer` uses `quietIndex.factor`); `sky.worker.ts` (one `createQuietIndex()`, passed in `frameAt`; `quietBlend(t)` consumed unchanged).
- **Visible change:** none.
- **Verification:** lint, type-check; H3; H2 identical including the mid-ease scenarios; a timing run in H3: 1,430 stars, 64 rects, mid-ease, under 0.4 ms in Node (today about 1.3-1.7 ms [R3 §4.1]).
- **Rollback:** revert. If the veil session later widens a zone's reach without exporting `QUIET_REACH`, H3 catches it at V0.

#### P4. Frame clock and pacing (no visible change)

- **Goal:** the scheduler that the drift needs, with today's cadence reproduced exactly while nothing new moves.
- **Files:** `config.ts` (`PACING`; `FRAME` doc); `src/lib/sky/pacing.ts` (new); `src/components/sky/frameClock.ts` (new); `sky.worker.ts` (§6.2.4: `frameDemands` replaces `frameMode` and `frameInterval`, `schedule`/`tick`/`onFrame`/`onTimer` on the clock, `cancelFrames` removed, optional rAF members in `SkyWorkerScope`, `probeRaster` keeps the raster milliseconds, `driftCap()` and `driftAllowed()` helpers for P7); `AGENTS.md` (worker-file list gains `frameClock.ts`).
- **Steps:** pure `pacing.ts` first (H4 against it); then `frameClock.ts`; then switch the worker; then the AGENTS.md line.
- **Visible change:** none. Scrolling and a flying meteor still draw every refresh; fades stay at 30 fps and twinkle at 15 (10 after a step-down) on timers; reading and idle still sleep.
- **Verification:** lint, type-check; H4; Chrome trace: a worker frame on every vsync while scrolling and during a flight, twinkle frames about 67 ms apart in the hero, none in the reading scene or a hidden tab; Firefox the same; Safari: a local debug log shows the worker clock detected as unaligned and every frame drawn; a local patch that makes `requestAnimationFrame` never call back shows frames continuing from the watchdog's timer (then remove it); the production build smoke test.
- **Rollback:** revert (P7, P9 and P16 depend on it).

#### P5. Presence (small visible change)

- **Goal:** pointer, key and focus activity count as presence; one gate for twinkle (and from P7 the drift).
- **Files:** `protocol.ts` (`activity`); `mountSky.ts` (`ACTIVITY_INTERVAL_MS` and the listeners, §6.6); `sky.worker.ts` (`activity` case; `idleTwinkle` renamed `presenceLevel`); `config.ts` (`FRAME.idleSleepMs` doc).
- **Visible change:** a visitor who moves the mouse, types or tabs keeps the twinkle (and shooting stars) going past 90 s.
- **Verification:** lint, type-check; browser: move the mouse every 20 s for 3 minutes, the twinkle never fades and meteors keep coming; hands off for 90 s, the twinkle fades over about 4 s and the trace shows 0 frames after; a key press brings it back over about 4 s with no meteor for 3 s; at most one `activity` message a second (Performance panel, or a local `console.count`).
- **Rollback:** revert.

#### P6. Pause control (visible: the button)

- **Goal:** the WCAG 2.2.2 mechanism exists before any continuous motion does.
- **Files:** `src/components/sky/skyPause.ts` and `SkyPauseToggle.tsx` (new, §6.8); `src/components/icons/PauseSVG.tsx` plus its barrel line; `Navbar.tsx` (after `:152-161`); `mountSky.ts` (`motion()` and the subscription; the reduce-motion import moves); `protocol.ts` (the `SkyMotion` doc).
- **Visible change:** a pause button in the navbar and the phone menu. Pressed, the sky does what it does today under reduced motion.
- **Verification:** lint, type-check; `/_next/mcp` `get_errors` on `/`: no hydration warnings; AC-28 by hand: Tab reaches it, Space and Enter toggle it, the dashed focus ring shows, VoiceOver or NVDA announces "Pause sky animation, toggle button, pressed / not pressed"; the choice survives a reload and syncs to another tab; with the OS set to reduce motion and nothing stored it starts pressed (D2: pressing it then plays and is remembered); clearing site data returns to the OS default; with storage blocked (DevTools "Block site data", Safari private browsing) it still works for the page and throws nothing; hidden under forced colors; DevTools shows a 40×40 target (2.5.8 needs 24×24); the icon is 14.1:1 on navy and 12.7:1 on the menu's light navy (1.4.11 needs 3:1) [computed].
- **Rollback:** revert. P7 must not ship without it.

#### P7. Camera, drift and scroll glide (visible: the feature)

- **Goal:** the user's first request: the sky floats with physically consistent depth, and scrolling glides.
- **Files:** `config.ts` (`CAMERA` complete, `DRIFT`, `SCENE` drift levels and doc); `src/lib/sky/camera.ts` (new, without the depth law, §6.1.3); `scene.ts` (`drift` in `SceneLevels`/`sceneAt`); `sky.worker.ts` (§6.1.4: the camera, `cameraTarget`, stepping in `draw`, the camera demand, the freeze and resume in the `motion` handler, `init`, the hidden branch, the sleep path, `driftCap`/`driftAllowed` with the software budget, the snap rule).
- **Steps:** config and `camera.ts` with H5 green before any wiring; scene; worker; then a by-eye pass on a laptop, a DPR-1 monitor and a phone, changing only `DRIFT.speed` within 2.5-4 and the phases (D4, D5).
- **Visible change:** the drift (hero, reading at 0.35, end at 0.8), the scroll glide, and quarter-pixel gliding stars.
- **Verification:** lint, type-check; H5; the 60 s watch (AC-1, AC-2, AC-3, AC-5, AC-8, AC-9, AC-10, AC-11, AC-17); AC-26: the reduced-motion screenshot still equals P0's pixel for pixel; AC-27 (switch reduce motion on and off while watching); AC-28 (the pause now stops the drift within a second and resumes from the same positions); AC-32 (hidden tab), AC-33 (idle), AC-34 (resize); budgets B-1 to B-7 (§10) on a laptop, an iPhone and an Android phone; the DPR-1 shimmer check (decide the 0.85 device px floor, §6.3).
- **Kill switch:** `DRIFT.speed = 0` (no drift; with the snap rule, resting stars are today's crisp points) plus `CAMERA.snapViewports = 0` (exact scroll following): together, today's rendering.
- **Rollback:** revert (P8 and P10 depend on it).

#### P8. Continuous depth (visible: subtle)

- **Goal:** three rigid sheets become one volume: each star's nearness from its magnitude.
- **Files:** `config.ts` (`DEPTH`; `parallax` removed from `LayerConfig` and `LAYERS`, doc moved); `camera.ts` (`nearness`, `layerNearness`, `cameraSpeed` with `DEPTH.maxNearness`); `catalog.ts` (`Star.q` with a doc, `q: nearness(m)` in `cellStars`, no new draw); `renderSky.ts` (`drawLayer` reads `star.q` and culls with `layerNearness`).
- **Visible change:** while scrolling and drifting, bright stars move more than their layer used to (up to 11% of the scroll for the brightest, 7% before), with no speed jump at band edges.
- **Verification:** lint, type-check; H6; H2 at camera (0, 0) identical to P7's (depth never moves a star at rest); a review of the reading scene's composition while scrolling (R1's risk); AC-1 with brightness terciles.
- **Rollback:** revert.

#### P9. Transient scheduler and satellites (visible: satellites; deviation 1)

- **Goal:** one scheduler for every transient kind, proven on the simplest kind, and the first "other space body".
- **Before starting:** CP-2 (§8.1).
- **Files:** `config.ts` (`TRANSIENTS`, `SATELLITE`, `SKY_WINDOW = { fov: 60 }`); `src/lib/sky/skyWindow.ts`, `satellites.ts`, `transients.ts` (new, §6.9-6.10); `renderSky.ts` (`drawTransient`, `drawSatellite`); `sky.worker.ts` (§6.9.2 glue; the gate passes the legacy meteor's start and next due time).
- **Visible change:** in the desktop hero, a steady satellite now and then (about 4.7 in the first 10 minutes; in the first minute on about one visit in three).
- **Verification:** lint, type-check; H7; H10; AC-24, AC-30, AC-31; browser: 5 minutes in the hero, satellites look steady, never blink, warm as they fade into shadow, never start within 3 s of a shooting star; scrolling during a pass fades it; pausing fades it; none on a phone or past the hero; budget B-8; the production build smoke test.
- **Kill switch:** `SATELLITE.gap.floor = Infinity`.
- **Rollback:** revert (P11 depends on the scheduler).

#### P10. Pointer lean (optional; visible)

- **Goal:** self-produced parallax on desktop, the strongest depth cue a page can give a mouse user [R1 §5.2].
- **Files:** `protocol.ts` (`pointer`); `mountSky.ts` (`PARALLAX_POINTER_QUERY = '(hover: hover) and (pointer: fine)'`; a passive `pointermove` ignoring `pointerType === 'touch'`, normalized with the ResizeObserver size, coalesced to one message per animation frame; `null` on `pointerout` with no related target and on `blur`; the pending frame cancelled in `destroy`) [R3 §8]; `config.ts` (`POINTER`; `SCENE` `lean` levels hero 1, reading 0, end 0); `scene.ts` (`lean` mixed like `drift`); `camera.ts` (`POINTER`); `sky.worker.ts` (`pointer` case sets the lean target and calls `noteInput`; `cameraTarget` scales it by the scene's lean level).

```ts
/**
 * Leaning toward the pointer (mice and pens with hover, hero only, full motion): the camera moves up to `reach` CSS px
 * (at nearness 1) toward a pointer at the viewport's edge, through critically damped springs of `omega` rad/s (95%
 * settled in 1.2 s), so the stars slide away from it, the brightest farthest (19 px). 7 is the calmer setting.
 */
export const POINTER = { reach: 12, omega: 4 } as const
```

- **Visible change:** in the desktop hero the stars lean away from the cursor and ease back when it leaves.
- **Verification:** lint, type-check; H5 extended (lean 95% settled at 1.19 s, no overshoot); at most one `pointer` message per frame; no lean from touch on a hybrid laptop, in the reading scene, under reduced motion or paused; AC-9 when the pointer enters and leaves.
- **Kill switch:** `POINTER.reach = 0`.
- **Rollback:** revert.

#### V0. Rebase onto the veil commit (when it lands; unblocks P11-P15)

Follow §8.3 and §8.4. Afterwards: fold the worker's private `sameRects` into the exported one; switch satellites' clear-sky test to the exported segment test (IR-6); take the veil session's scroll-cancel distance and fade into `TRANSIENTS` (IR-4); take `QUIET_REACH` into the quiet index (IR-5); re-run H2, H3, H5, H7 and the 60 s watch.

#### P11. Shooting stars join the scheduler (BLOCKED)

- **Goal:** one scheduler, one lease, one scroll cancel for every kind.
- **Files:** `transients.ts` (`'meteor'` in `TRANSIENT_KINDS`, `MeteorTransient`, its spec wrapping the veil session's `planMeteor` with `nearCopy` (IR-2/IR-3), the lease); `sky.worker.ts` (the legacy `meteor`, `radiant`, `launched`, `failedPlans`, `nextMeteorAt`, `updateMeteor`, `retryMeteors` and `holdMeteors` become scheduler state and calls; `retryTransients` from the `layout` handler and `resize`); `renderSky.ts` (`drawTransient` gains `case 'meteor'` calling `drawMeteor`).
- **Visible change:** none, except that an in-flight shooting star fades out over 0.25 s when the sky pauses instead of vanishing.
- **Verification:** H7 with meteors (never two lease holders; satellites never hold it; meteor gaps still today's, mean 41.7 s); the veil session's own checks rerun (IR-7); the 60 s watch unchanged.
- **Rollback:** revert.

#### P12. Directions: the sky window and visit sources (BLOCKED)

- **Files:** `config.ts` (`SKY_WINDOW` extension, `RADIANTS`); `src/lib/sky/radiants.ts` (new); `skyWindow.ts` (`toward`, `elevationAt`, `meteorRange`); `transients.ts` (the meteor spec draws the visit's sources and passes the aim); `meteors.ts` (only through IR-1, or our own edit of the direction lines after V0); `sky.worker.ts` (sources re-drawn on resize and layout).
- **Visible change:** shooting stars from many directions, some converging on a shared radiant; on about one visit in seven, a radiant on screen with short slow stubs near it.
- **Verification:** H8; crossing share measured on captured layouts (IR-7), not only synthetic ones; AC-21 by watching 10 meteors; crossings a minute at today's rate ≤ today's.
- **Rollback:** revert.

#### P13. Rate, crossing cooldown, narrow limit (BLOCKED)

- **Files:** `config.ts` (`METEOR_RATE`; the old gap keys and `narrowLimit` go); `transients.ts` (meteor gaps through `nextGap`, the cooldown in the lease); `meteors.ts` (`nextMeteorGap` removed, after V0).
- **Visible change:** about 5 shooting stars in the first minute (median), fewer on long visits; up to 6 a visit on phones.
- **Verification:** H9 (choose the cooldown from §6.12's table and the measured crossing share); AC-18, AC-19, AC-20; budget B-9.
- **Kill switch:** `METEOR_RATE.hero = { floor: 30, mean: 12, cap: 75 }` and `narrow.limit = 2` (today's model; the stretch differs slightly).
- **Rollback:** revert.

#### P14. Speed classes, colors, faint share, fireball retune (BLOCKED)

- **Files:** `config.ts` (`SPEED_CLASSES`; fireball odds 0.04, spacing 120 s, after 20 s in `METEOR_KINDS`); `radiants.ts` (a class per source); the wake tint per class in `drawMeteor` (veil-owned before V0).
- **Verification:** H10; a look review (warm, white and mint wakes; trains only behind fast meteors); AC-22 and AC-23 unchanged.
- **Rollback:** revert.

#### P15. Could kinds (each its own phase, after D7)

Each kind (§6.13) adds one member to the union, one spec, one drawing case and one acceptance item, with H7 and H10 extended. The static comet and the planet need no veil machinery and could ship after P8 if the user wants them early.

#### P16. WebKit frame relay (device-gated)

Only if iPhone or macOS Safari tests after P7 show judder (about 4.5 visible jolts a second on 60 Hz screens is the predicted size [R3 §2.2]) or a Low Power Mode drain. Then: the worker posts `{ type: 'relay', on }` while it needs vsync frames on an unaligned clock; `mountSky` runs a main-thread rAF loop posting `{ type: 'tick' }`; the worker draws on ticks. Verify on the same devices; revert if main-thread jank shows through.

#### F1. Fallback takeover (only after the CP-4 decision)

§8.5.

## 8. Coordination protocol with the veil session

### 8.1 Checkpoints

| ID | When | Action | Exit |
|---|---|---|---|
| **CP-0** | P0 | Send the message in §8.2 (SendMessage to `session_01ETNMD4Evfbvs1kq6PPU3AK` if the session list shows it; otherwise ask the user to relay it). Log it in `COORDINATION.md`. | Sent and logged. A reply is not required to proceed with P1-P10. |
| **CP-1** | Before every phase | `git fetch origin`; check `git log --oneline -3 origin/master-r26syw` and `git log --oneline <last-checked>..origin/master -- src/lib/sky src/components/sky`; read any reply. | If the veil commit landed: finish the current phase, run V0, then continue. |
| **CP-2** | Before P9 | Tell the veil session that satellites ship before its commit: clear sky only, near-layer keeps (no light on copy, no lease), faded 0.25 s after a 16 px scroll by our scheduler's tick, never within 3 s of a meteor onset. | Proceed unless it objects; its functions are untouched. |
| **CP-3** | The veil commit lands | V0 (§8.3, §8.4); update `COORDINATION.md` (SHA, numbers received, answers to IR-1..IR-8); reply with what we adopted. | P11 unblocked. |
| **CP-4** | After P10, or a date the user sets (D12) | Ask the user: keep waiting, or F1 (§8.5). | Decision logged in `COORDINATION.md` and `HANDOFF.md`. |

### 8.2 Interface requests

| ID | Request | Why | If declined (after the commit lands) |
|---|---|---|---|
| **IR-1** | `planMeteor` takes an optional **aim** instead of only a radiant point: `options.aim?: (random: () => number, start: Point) => Aim \| null` with `Aim = { dirX: number; dirY: number; speed: number; duration: readonly [number, number] }`. The default aim is today's radiant logic, so nothing changes until we pass ours. | The population model (P12) chooses direction and speed per start point; the planner keeps start sampling, layout guards and every veil check. A callback keeps the sky window and radiants out of their module. | We edit `planFlight`'s direction lines (`meteors.ts:140-145`) ourselves in P12, leaving `veiledFrom` untouched. |
| **IR-2** | `options.nearCopy?: boolean` (default true, today's behavior): false rejects any candidate whose path comes within the feather of copy, as fireballs are rejected today (`meteors.ts:158-159`). | The ink lease: while one transient holds it, and during the crossing cooldown, every launch must be clear-sky. | We add the option ourselves (four lines). |
| **IR-3** | The returned `Meteor` reports `nearCopy` (today a local at `meteors.ts:158`). | The scheduler holds the lease without re-checking the path. | We add the field ourselves. |
| **IR-4** | The scroll cancel as data plus a rule, not only code inside the `scroll` handler: export the distance and fade, and keep `launchScrollY` on the flight. | One implementation (our scheduler's tick) for every kind from P11; before that, our satellites use the same numbers. | At P11 we move the cancel into the scheduler with their numbers and delete the copy in the handler. |
| **IR-5** | Export `QUIET_REACH` from `scene.ts`: the farthest distance beyond a padded rect at which `quietFactor` can be below 1 (today `QUIET.feather`); keep `quietAt`/`inkAt` as maxima over zones within reach. | The quiet index is exact only while no zone reaches farther than its constant. | The index keeps `QUIET.feather`; H3 at V0 and after any later veil change is the guard. |
| **IR-6** | Export `segmentTouches` (or a `pathClear(zones, a, b, margin)`). | Satellites and the could kinds share the planner's clear-sky test (DRY). | Satellites keep their sampled `quietAt` test. |
| **IR-7** | Send: the commit SHA; the final plan; the share of accepted flights that burn out behind copy, and crossings a minute, on captured layouts; the scroll-cancel distance and fade; any per-text-class ink budgets. | Sets the crossing cooldown (§6.12) and the satellite cancel; confirms §11's contrast numbers. | We capture layouts ourselves (a local patch that logs `layout` messages), run H8 on them, and take the conservative 55 s cooldown. |
| **IR-8** | Keep `parallaxScroll`'s meaning (it follows `scrollY` under full motion and holds still otherwise, `sky.worker.ts:465`); if convenient, cache `quietBlend`'s zone arrays between frames when nothing changed (it allocates on every call, `:227-234`). | The camera reads `parallaxScroll`; the drift draws 20-30 frames a second, so per-frame allocations matter more than before. | We adapt the camera's input; the allocations are minor garbage. |

**CP-0 message (ready to send):**

> From the sky-ambient-motion planning session (branch `claude/quirky-carson-btv2u4`). Our plan builds on your veil fix. Until your commit lands we will not edit `veiledFrom`, `planFlight`, `planMeteor`, `METEOR_VEIL`, `QUIET`, the `METEOR` spawn and selection keys, `updateMeteor`, the `scroll` and `layout` handlers, `quietBlend`, `settleQuiet`, `drawMeteor`/`drawTrain`, the quiet functions in `scene.ts`, or the quiet-rect measurement. Before it lands we plan to ship: sub-pixel star sprites; a camera-based `drawLayer`; a per-tile quiet index for stars that calls your `easedQuietFactor` on tile subsets (bit-identical); a frame clock; presence pings (pointer, keys, focus); a pause control that maps to `motion: 'reduced'`; the ambient drift (stars only; your quiet factors apply per star per frame); and satellites (clear sky only, near-layer keeps so no light on copy and no lease, faded 0.25 s after a 16 px scroll by our scheduler's tick, never within 3 s of a meteor onset). Requests: (1) `planMeteor` options `aim` (direction and speed per start point; default = today's radiant) and (2) `nearCopy: false` for clear-sky-only plans; (3) report `nearCopy` on the returned meteor; (4) export your scroll-cancel distance and fade and keep `launchScrollY`; (5) export `QUIET_REACH`; (6) export `segmentTouches`; (7) please send your SHA, final plan, the share of accepted flights that burn out behind copy and crossings a minute on your captured layouts, and your cancel numbers; (8) keep `parallaxScroll`'s meaning. Shooting stars join one scheduler (one ink lease, one scroll cancel) only after your commit.

### 8.3 The rebase (V0)

1. Finish and commit the current phase; CP-1 confirms the commit (`<sha>`).
2. `git fetch origin`; `git rebase origin/master` (or onto their branch if the user prefers to stack before it merges).
3. Resolve conflicts by §8.4's rules: inside a veil-owned function theirs wins; outside, ours; for shared types and the message switch, keep both.
4. **Kill-switch identity:** with `STAR_PHASES = 1`, `DRIFT.speed = 0`, `CAMERA.snapViewports = 0`, `POINTER.reach = 0` and `SATELLITE.gap.floor = Infinity` set temporarily, H2 on the rebased tree must equal H2 on their commit (`SKY_SRC` pointing at an archive of it): our phases add nothing visible beyond their intended effects.
5. Re-verify §8.4's list; run lint, type-check, H1-H7 and the 60 s watch.
6. Fold the DRY items (V0 in §7.3); update `COORDINATION.md` and `HANDOFF.md`; reply to the veil session.

### 8.4 Merge-conflict hotspots and what to re-verify

| File | Our hunks | Their likely hunks | Rule |
|---|---|---|---|
| `sky.worker.ts` | imports; state (camera, clock, estimate, governor, quiet index, transients); `frameDemands` replacing `frameMode`; `schedule`, `tick`, `onFrame`, `draw`, `frameAt`; the `init`, `motion`, `visible`, `activity`, `pointer` cases; `presenceLevel` | `updateMeteor` (radiant ordering); the `scroll` handler (cancel); the `layout` handler and `quietBlend` (mid-ease deferral); maybe `frameMode`'s quiet-ease reason | Theirs inside their functions. Any new reason they add to `frameMode` must be carried into `frameDemands` (a fade demand or `EVERY_FRAME`). |
| `config.ts` | blocks appended after `TRAIN`; `SCENE` drift and lean; `FRAME` doc; `LAYERS.parallax` removed (P8) | `METEOR_VEIL`, `QUIET`, `METEOR` keys, doc comments | Appended blocks rarely conflict; in `LAYERS` and `SCENE` keep both sides. |
| `renderSky.ts` | `SkyFrame` fields (`camera`, `snap`, `quietIndex`); `drawLayer`; `StarField`; `drawSky`; `placePoint`; `drawTransient`, `drawSatellite` | `drawMeteor`, `drawTrain`; maybe `SkyFrame` fields (per-class ink) | `SkyFrame`: the union of fields. |
| `scene.ts` | `SceneLevels.drift`/`lean`, the `sceneAt` mix | the quiet functions, maybe per-class keeps | Keep both. |
| `mountSky.ts` | activity and pointer listeners; `motion()` with the pause store | quiet-rect measurement (text classes, entrance offsets) | Keep both; check they didn't change `motion()`. |
| `protocol.ts` | `activity`, `pointer`, the `SkyMotion` doc | `SkyRect` class or the `layout` message | Keep both. |
| `meteors.ts` | nothing before V0 | their functions | Theirs. |

**Re-verify after the rebase:**

1. H3: the quiet index is still exact with their quiet math (`QUIET_REACH` ≥ every reach; per-class keeps pass through `factor`).
2. H2 kill-switch identity (§8.3 step 4).
3. The camera still reads `parallaxScroll` with the same meaning; their `scroll` handler still calls `noteInput` (presence) and still sets `lastScrollAt` (frame demands, launch gates).
4. One scroll cancel by P11, with their distance and fade.
5. Satellites' launch gate still matches theirs for meteors (`meteorsAllowed`, `FRAME.meteorScrollQuietMs`, settled layouts before the first launch).
6. AC-16 under their quiet ease with moving stars: no star changes alpha by more than 0.05 in a frame while rects are re-measured (R4 §4.7 item 6).
7. §11's contrast numbers against their final `METEOR_VEIL` comment.

### 8.5 Fallback if the veil work never lands (F1)

- **Trigger:** the user's decision at CP-4 (D12). Not before: the veil session asked to land first, and its fix is the better product.
- **What we take over, and how little:** only what our invariants need, leaving the veil math exactly as on master. Today's veil is stricter than the planned fix (`clearUntil` 0.65 means fewer crossings), so it is contrast-safe, not broken.
  - `planFlight`/`planMeteor`: the `nearCopy` option and report (IR-2, IR-3; the local already exists at `meteors.ts:158`), and in P12 the aim (IR-1) in the direction lines (`:140-145`).
  - The scroll cancel: none in the `scroll` handler. The scheduler's tick-based cancel (P9) covers shooting stars once they join (P11), so the handler stays untouched.
  - Unchanged: `veiledFrom`, `METEOR_VEIL`, `QUIET`, `quietBlend`, `settleQuiet`, the `layout` handler, the quiet functions, `drawMeteor`'s veil.
- **Invariants kept:** one ink lease; every moving kind through the veil checks (shooting stars through `veiledFrom`, every other kind clear sky); one scroll cancel for every kind; at most 5 s per transient; launches only in the hero.
- **Left open, documented in `COORDINATION.md`:** the strict `clearUntil` (fewer crossings than the redesign intended), the star pop when rects are re-measured mid-ease (cosmetic), and rects first measured mid-entrance (mitigated: the first shooting star waits 4.5-7 s, after the 1.5 s re-measure, `mountSky.ts:42-47`).
- **Then** P11-P15 run on top of F1 exactly as planned.

## 9. Acceptance checklist

### 9.1 The 60-second watch (adapted from R4 §3.1)

1. **Setup:** a laptop in Chrome at default scaling (about 1440×900, DPR 2); once more on a DPR-1 external monitor (worst case for stepping and shimmer); once on an iPhone in Safari and once on a mid Android phone in Chrome. No reduced-motion or contrast preference set; storage cleared.
2. **First 60 s, hands off,** from the reveal: when the first shooting star appears and how many; their directions; any star that pops, steps or shimmers (stare at one bright star at the right of the hero for 10 s); whether the headline seems to drift; whether the faint stars look still while the bright ones float; whether anything bobs or reverses; the first satellite, if any.
3. **Reading:** scroll to About and watch 15 s.
4. **Pause:** back to the top; press the pause control; reload; it stays paused; press again; the sky resumes from where it stopped.
5. **Preferences:** turn OS reduced motion on while watching, then off.
6. **Hidden tab:** switch away for 60 s, come back.
7. **Idle:** leave the page untouched for 2 minutes; then move the mouse.

### 9.2 The checklist

Methods: **W** watch; **S** scripted screenshots or frame capture; **T** a performance trace; **H** a scratch harness (§7.1); **C** code review. ★ marks items the 60 s watch covers.

| ID | Check | Pass when | How | Phase |
|---|---|---|---|---|
| AC-1 ★ | Depth order | Median speed far < mid < near, adjacent ratios ≥ 1.6 (design 1.71 and 2.04) | H5/H6; S by brightness tercile | P7, P8 |
| AC-2 ★ | Still frame of reference | Far stars ≤ 1.3 px/s (design max 1.24), near band mean ≤ 4.4 (design 4.35), no star > 7 px/s (design 6.82) | H5; S | P7 |
| AC-3 | One heading | At any instant every drifting star moves within 1° of the same heading (one camera), pointer lean aside | C; S | P7 |
| AC-4 | Slow, one-way turning | Heading turns between 0.3 and 5°/s and never turns back (design 0.38-4.33, mean 2.0) | H5 | P7 |
| AC-5 ★ | No starts, stops or reversals | Speed within 0.58-1.42 × v₀ × level; speed changes ≤ 10% a second (design 3.8%) | H5; S | P7 |
| AC-6 | No sway in 0.05-0.5 Hz | Drift components at 0.0056, 0.0090, 0.0134 Hz only | C; H5 | P7 |
| AC-7 | Never repeats (rewritten) | No periodic pattern within a visit: the ratios 1 : -1.618 : 2.414 repeat only after 25 h (the decimal ratios are 809/500 and 1207/500) | C | P7 |
| AC-8 ★ | No pops at edges | Stars enter by sliding past an edge (EDGE 24 ≥ 9 px halo) or by fades; none appears or vanishes in one frame | S; C | P2, P7 |
| AC-9 | Integrated offsets | At every rate change (scene, idle, pause, resume, resize, tab return, lean) the largest per-frame step ≤ the normal step + 0.25 px | H5; S | P7, P10 |
| AC-10 ★ | Sub-pixel steps (rewritten) | ≤ 0.5 device px per drawn frame (design max 0.48), no stall-then-jump staircase | H4/H5; S | P4, P7 |
| AC-11 ★ | No shimmer (rewritten) | Light per star constant across phases within 0.01% (H1); no visible pulsing at DPR 2; on DPR 1 the floor decision recorded | H1; W | P1, P7 |
| AC-12 | No streaks | Phase sprites are the same shape along and across the motion | C | P1 |
| AC-13 | Frame pacing | ≥ 95% of drift-frame intervals within ±25% of k refreshes; worker JS p95 ≤ 2 ms on a mid laptop | T | P4, P7 |
| AC-14 | Energy | §10 budgets B-1 to B-9 | T | P7, P9, P13 |
| AC-15 ★ | Calm while reading (rewritten) | Drift ≤ 0.35 × hero (or 0), twinkle 0, no star > 2.4 px/s (design 2.39), no transients | H5; S | P7 |
| AC-16 | Restraint near copy | Quiet rules hold for moving stars; a star crossing a quiet edge changes alpha by ≤ 0.05 per frame | H3; S | P3, P7 |
| AC-17 ★ | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s see no apparent motion of the copy | W | P7 |
| AC-18 | Attention budget | No onset in the first 3 s after the reveal; ≥ 3 s between onsets outside a burst; ≤ 1 onset per 6 s on average | H7/H9 | P9, P13 |
| AC-18b | Crossings | Shooting stars burning out behind copy ≤ today's 0.50 a minute | H9 with the measured share | P13 |
| AC-19 ★ | A first shooting star | 4.5-7 s after the reveal in ≥ 18 of 20 fresh desktop loads | W | today; recheck P11-P13 |
| AC-20 ★ | Frequency (rewritten) | 60 s of hero: median 5 shooting stars, 3-6 in ≥ 8 of 10 runs (simulated 90%); never two heads at once outside a burst; gaps stretch on long visits | H9; W | P13 |
| AC-21 ★ | Directions (rewritten) | Over 10 shooting stars: ≥ 3 radiants, headings spanning ≥ 60°; climbing ≤ 12%, only from sporadic sources and ≤ 0.6 of the longest path; paths sharing a radiant converge backward | H8; W | P12 |
| AC-22 ★ | Light in, light out | Head light < 15% of peak at the first and last on-screen points; peaks in clear sky (the veil) | C | P11-P14 |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel (unchanged today) | C | P14 |
| AC-24 | Satellites (rewritten) | Speed constant within 2%; no tail, no blinking; ≤ 1 at a time; first light to last ≤ 4.8 s; slides in from an edge or fades in over ≥ 0.8 s; clear sky; desktop hero only | H7; W | P9 |
| AC-25 | Comet (if built) | Static except camera parallax; fades in over ≥ 8 s; no part inside a padded rect; ≤ 1 a visit | S | P15 |
| AC-26 ★ | Reduced motion is still | With `prefers-reduced-motion: reduce`, two hero screenshots 30 s apart after the dusk are identical, and identical to P0's baseline (at scroll 0) | S | every phase |
| AC-27 | Live preference switch | Reduce motion on: stars freeze within 1 px of where they were, within 1 s; off: resume without a jump, no shooting star for 3 s | S; H5 | P7 |
| AC-28 ★ | Pause control | Visible, labelled, keyboard-operable; stops drift, twinkle, parallax and transients within 1 s; paused after a reload; resumes from the paused positions; starts paused under reduced motion when nothing is stored | W; S | P6, P7 |
| AC-29 | Forced colors and more contrast | Forced colors hide the sky and the toggle; more contrast drops the haze and dims the stars, drift allowed | S | P6 |
| AC-30 | Contrast budget unchanged | Drift changes positions, not alpha; satellites and could kinds add no light on copy; one lease | C; H7 | P7, P9, P11 |
| AC-31 | Flash safety | ≤ 3 flashes in any second; bursts staggered ≥ 0.35 s; no tint with R/(R+G+B) ≥ 0.8 | H10 | P9-P15 |
| AC-32 | Hidden tab | After 60 s hidden the sky reappears where it was, no leap; no shooting star for 3 s | S; H5 | P7 |
| AC-33 | Idle | After 90 s without input the drift eases to 0 over ≥ 3 s, then 0 frames; input brings it back over about 4 s | T; S | P5, P7 |
| AC-34 | Resize and zoom | No star jumps beyond what the new layout requires; the drift continues | S | P7 |
| AC-35 | No visible change in P1-P4 | H1, H2, H3 identity and the reduced-motion screenshot equal P0's | H; S | P1-P4 |
| AC-36 | Hydration | No hydration warning in the dev console or `/_next/mcp` `get_errors` on `/` | MCP | P6 |

## 10. Performance budget and battery

### 10.1 Budgets (pass/fail)

| ID | Budget | Pass when | Measure |
|---|---|---|---|
| B-1 | Worker JS per drawn frame, hero drifting | p95 ≤ 2 ms on a mid laptop (1440×900, DPR 2); ≤ 4 ms everywhere (ADAPT's step-down threshold, the safety net) | Chrome Performance, worker track |
| B-2 | Drawn frames, hero, hands off, drift only | 20-30 fps at 60, 120 and 144 Hz (§6.2.1); never every refresh from the drift alone at v₀ ≤ 3.3 | Trace |
| B-3 | Reading scene, present visitor | 20 fps at drift 0.35; 0 at drift 0 | Trace |
| B-4 | Idle and hidden | 0 frames within 15 s after the 90 s window ends (4 s presence fade plus about 6 s of level decay); 0 frames while hidden | Trace |
| B-5 | Main thread | No sky-attributable task over 50 ms; `activity` ≤ 1 a second; `pointer` ≤ 1 per frame; no per-frame main-thread work | Trace |
| B-6 | CPU, laptop | Hero drifting ≤ today's hero-idle CPU + 3 points of one core, and ≤ 10% of a core absolute (R4 AC-14); reading at 0.35 ≤ today's + 1 point | Chrome Task Manager vs P0 |
| B-7 | Phones | Drift ≤ 30 fps; no ADAPT step-down in 5 minutes on a mid Android; on iPhone the worker stays under 4 ms a frame in Web Inspector | Device traces |
| B-8 | Satellites | ≤ 4.8 s of every-frame drawing per pass (about 4.7 passes in 10 minutes); scheduler update ≤ 0.05 ms a tick; planning ≤ 1 ms per launch | Trace; H7 bench |
| B-9 | Shooting stars at the new rate | Every-frame drawing ≤ 10 s a minute in the hero (R2: about 7-8 s for meteors plus about 3 for satellites) | Trace |
| B-10 | Memory | Atlas ≤ 2 MB at DPR 2; star cache ≤ 2 × visible cells (about 2.7 MB at 4K); no growth over 30 minutes | Worker heap snapshots |

### 10.2 Frames a minute, today and after (60 Hz, DPR-2 laptop)

| State | Today | After P7 (v₀ 3) | Note |
|---|---|---|---|
| Hero, present, no input | 900 (twinkle timer, 15 fps) | 1,200-1,800 (20-30 fps on animation frames) | Twinkle rides along at no extra cost |
| Hero, shooting stars | about 100 extra (1.4 flights a minute, about 1.5 s each, over the 15 fps base) | about 200-280 extra after P13 (6-7 s a minute at 60 fps, over a 20-30 fps base) | Every refresh while one flies |
| Hero, satellites | none | about 100-130 extra after P9 (3.3 s a minute at 60 fps) | 4.8 s every ~88 s |
| Scrolling | 3,600 | 3,600 | Unchanged |
| Reading, present | 0 | 1,200 at 0.35, 0 at 0 | D3 |
| End bookend | 900 | 1,200-1,800 | Drift 0.8 |
| Idle over 90 s, hidden | 0 | 0 | Unchanged |

### 10.3 CPU and GPU estimates (to confirm with B-1 to B-7)

From R3 §4.6: a 1440×900 laptop at DPR 2 (314 stars) costs about 0.2-0.4 ms of worker CPU a frame, so 20-30 fps is 0.4-1.2% of a core; a 4K desktop (1,400 stars) about 0.8-1.7 ms, 1.6-5.1%; a phone (about 108 stars) about 0.4-1.0 ms of CPU plus an estimated 2-4 ms of GPU fill per full-screen frame, the least certain number in this plan (risk R-7). A software-rasterized canvas drifts only if its measured raster time allows `PACING.minFps` within 8% of a core (a 1440×900 software canvas at CSS resolution: about 20 fps at 7% of a core; at 4K it stays still, as today).

### 10.4 Battery levers, in order

1. The 90 s presence gate (no frames when nobody is there).
2. The reading drift (D3): 0 restores today's sleeping reading scene.
3. v₀ ≤ 3.3: keeps DPR-2 60 Hz screens at 30 fps or less (D4).
4. `PACING.minFps`: R1's perceptual bound needs only 5-8 fps for the reading drift [R1 §4.4]; if B-3 or B-7 fails, lower `minFps` to 12 for drift levels ≤ 0.35 (one condition in `motionFps`'s caller) before cutting anything else.
5. The narrow cap (30 fps) and the ADAPT step-down cap (30 fps).

## 11. Accessibility conformance summary

| Criterion | How the plan meets it | Where |
|---|---|---|
| **2.2.2 Pause, Stop, Hide (A)** | Continuous drift starts automatically, lasts more than 5 s and runs beside content, and decorative motion is not exempt (w3c/wcag #3478, #4921), so the page gets one control that pauses all sky motion at once (G186, "at the top of the page"; G4, resume where paused). It ships before the drift (P6 before P7). Every moving transient lasts ≤ 5 s from first light to last (H10), and the control stops transients too. Hero-only motion, the idle stop, the scroll cancel and the long-visit slowdown are UX and battery choices, not the mechanism (scrolling away is not "hide", #5029); reduced motion is the control's default state, not the only mechanism (#3766). | §6.8, P6 |
| **2.3.1 Three Flashes (A)** | Each transient makes one or two luminance flashes (rise and burn-out; a flare); burst members are staggered ≥ 0.35 s, so ≤ 3 a second. Every transient's changing area is at most about 2,000 CSS px², under 10% of the 21,824 px² limit (G176). No saturated red: the warmest drawable tint has R/(R+G+B) = 0.423 against the 0.8 threshold. | §6.10-6.13, H10 |
| **2.3.3 Animation from Interactions (AAA)** | Scroll parallax, the scroll glide and the pointer lean are off under `prefers-reduced-motion` (C39, SCR40) and while paused: the camera freezes. Twinkle and fades are opacity changes, which "motion animation" excludes. | §6.1.4, §6.8 |
| **1.4.3 Contrast (AA), the veil budget** | Stars dim per star behind quiet copy exactly as today (the quiet index is bit-identical); the drift changes positions, never alpha; at most one transient holds the ink lease; satellites and every could kind add no light on copy (near-layer keeps, clear sky). The veil session's budget (about 0.053 of white for one meteor against 0.082 of headroom for slate body text at 4.5:1; 0.064 under the haze; 0.026 over a far star) is unchanged and remains theirs. | §6.4, §6.9, §6.10 |
| **2.5.8 Target Size (AA)** | The toggle is 40×40 CSS px (minimum 24×24). | §6.8 |
| **1.4.11 Non-text Contrast (AA)** | The icon is #64ffda on navy, 14.1:1 (12.7:1 on the menu's light navy); the focus ring is the same green; the pressed state adds a border, not only a tint. | §6.8 |
| Also | 2.1.1 (a native `button`), 4.1.2 (name "Pause sky animation", role button, `aria-pressed`), 2.4.7 (the global dashed focus ring, `globals.css:79-83`), 2.5.3 Label in Name (the visible phone label is the accessible name). Pre-existing, out of scope: the navbar hides on scroll-down (`Navbar.tsx:28-31`, `:79`), so tabbing into it can focus controls that are off screen (2.4.11); every nav item already has this; showing the header on `focus-within` would fix it. | |

## 12. Risks and open questions

### 12.1 Risk register

L = likelihood, I = impact (H/M/L).

| ID | Risk | L | I | Mitigation | Trigger and owner |
|---|---|---|---|---|---|
| R-1 | The veil commit never lands | M | H | P0-P10 need nothing from it; F1 takes over the minimum with today's veil math | CP-4; the user decides |
| R-2 | The veil commit lands with interfaces unlike IR-1..IR-6 | M | M | Every request has a post-landing fallback (§8.2); the meteor spec adapts to whatever `planMeteor` becomes | V0; implementer |
| R-3 | Merge conflicts in the shared files | H | M | New code in new files; appended config blocks; rebase as soon as CP-1 sees the commit; hotspot rules and kill-switch identity (§8.3-8.4) | V0; implementer |
| R-4 | WCAG 2.2.2 read differently (decorative motion "exempt") | L | H | The pause control ships anyway, before the drift; it is cheap and the WG has said decorative is not exempt | P6 |
| R-5 | Induced motion: the copy seems to drift, or the drift reads as scrolling when its heading passes vertical | M | M | Faint majority nearly still; opening heading horizontal (D5); AC-17 with three reviewers; fallbacks: v₀ 2.5, or scale the drift's y component (one multiply in `driftAt`) | P7 watch; user |
| R-6 | Battery: continuous frames where the sky used to sleep (reading) | M | M | §10.4 levers; B-3, B-6, B-7 measured against P0 | P7; implementer |
| R-7 | Phone GPU cost is an estimate (2-4 ms a frame) | M | M | 30 fps narrow cap; B-7 on a mid Android; lower `minFps` or the reading drift if it fails | P7 devices |
| R-8 | WebKit's unaligned 15 ms worker clock judders (about 4.5 jolts a second) and ignores Low Power Mode | H (Safari) | L-M | Detect it and draw every frame; P16 relay only if device tests show it | P7 devices; D9 |
| R-9 | DPR-1 shimmer (about 20% max-pixel swing for 1-D motion at σ 0.7, inherent to the grid) | M | L | Decide the 0.85 device px floor by eye on a DPR-1 monitor | P7 |
| R-10 | Crossings rise above today's at the new rate | M | M | P12 before P13; cooldown from the measured share (45-55 s); AC-18b | P13; veil numbers |
| R-11 | A transient breaks 5 s (e.g. R2's 3 s fireball plus train) | L | H | Fireball flights stay 1.8-2.5 s; H10 asserts every kind from the config | P9-P15 |
| R-12 | Hydration mismatch from the stored pause state | L | M | `useSyncExternalStore` with a server snapshot; the toggle is hidden until the reveal remount; AC-36 | P6 |
| R-13 | `localStorage` unavailable or throwing | M | L | Every access in try/catch; the choice still holds for the page | P6 |
| R-14 | Composition wander: bright stars drift up to 328 px from the reviewed frame over minutes | H | L | Quiet zones keep the contrast guarantees; the reviewed sky is exact at t = 0; a 150 s period shrinks the wander about 17% | P7 review |
| R-15 | Continuous depth changes the reading composition (brightest stars follow 11% of the scroll) | M | L | Review in P8; revert P8 alone if disliked | P8; user |
| R-16 | The scroll glide reads as rubber-banding (up to 22 px lag at 1000 px/s) | L | L | ω 12 tightens it; kill switch `snapViewports = 0` | P7 |
| R-17 | The 90 s idle stop reads as "it stopped" | M | L | Pointer, keys and focus count as presence (P5); `FRAME.idleSleepMs` is one knob | P5, P7 |
| R-18 | Harness-only verification misses browser behavior | M | M | Every phase has browser checks; production build smoke tests at P4 and P9; real devices in P7 | each phase |
| R-19 | Satellites before the veil (deviation 1) duplicate the cancel rule until P11 | H | L | Same numbers; folded into one implementation at V0/P11 | V0 |
| R-20 | A watchdog false positive under GPU back-pressure | L | L | The watchdog serves one frame by timer and the next request tries rAF again; it never switches permanently | P4 |
| R-21 | The phased atlas grows to about 1.9 MB at DPR 2 (from 0.13 MB) | H | L | Rebuilt only on DPR change (under 1 ms); within B-10 | P1 |
| R-22 | More per-frame garbage (`quietBlend` allocations at 20-30 fps) | M | L | IR-8; minor GC | V0 |
| R-23 | No test runner: regressions later go unnoticed | M | M | D8 (Vitest as the low-friction option); the harness kit stays reproducible from this plan | user |

### 12.2 Open questions

1. Will the veil session accept the aim callback (IR-1), or prefer a direction-source object? Either works; the callback keeps the sky window out of its module.
2. Its final scroll-cancel distance and fade, and the measured share of flights that burn out behind copy on captured layouts (they set `TRANSIENTS.cancelDistance`, `cancelFade` and the crossing cooldown).
3. Should the pause toggle appear when the sky cannot run (no OffscreenCanvas, or a worker failure)? Recommended: render it only after the worker's first `ready` (a `available` flag in the pause store set by `mountSky`), a few lines; today's draft always renders it.
4. Is 90 s the right idle window now that pointer and keys count?
5. The DPR-1 core-sigma floor (0.85 device px) for drifting stars: by eye in P7.
6. Is the phone GPU cost within budget (B-7)?
7. D1-D12 (§3).

## 13. Sources

Consolidated from the research reports, which carry the full lists and access notes; the reports read W3C, MDN and browser sources from their official repositories when the hosts were blocked.

**Accessibility and web platform**

- W3C, WCAG 2.2 Understanding 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide ; techniques G4, G11, G186, F16: https://www.w3.org/WAI/WCAG22/Techniques/ ; w3c/wcag issues #3478, #4921, #4319, #3766, #4447, #5029 (R2 §9.1).
- W3C, Understanding 2.3.1 and the flash thresholds: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold ; G19, G176.
- W3C, Understanding 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions ; C39, SCR40.
- W3C, Understanding 2.5.8 Target Size (Minimum) and 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG22/Understanding/
- W3C WAI-ARIA Authoring Practices, Button pattern (toggle buttons and `aria-pressed`): https://www.w3.org/WAI/ARIA/apg/patterns/button/
- React, `useSyncExternalStore` (`getServerSnapshot` during hydration): https://react.dev/reference/react/useSyncExternalStore
- Next.js 16.4.2 docs (bundled): `01-app/01-getting-started/05-server-and-client-components.md`, `01-app/02-guides/preventing-flash-before-hydration.md`, `01-app/03-api-reference/08-turbopack.md`, `01-app/02-guides/scripts.md`, `01-app/02-guides/lazy-loading.md`.
- WHATWG HTML, animation frames and rendering opportunities: https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames ; MDN `requestAnimationFrame`, Optimizing canvas, `prefers-reduced-motion`, `setTimeout` in inactive tabs (R3 §2, R4 §5).
- Worker rAF sources: Chromium `worker_animation_frame_provider.cc`; WebKit `WorkerAnimationController.cpp`; Gecko `WorkerScope.cpp`; Skia `SkGlyph.h` (four sub-pixel positions per axis) (R3 §2.1, §3.3).
- Vercel Web Interface Guidelines; Apple HIG Motion and Accessibility (R4 §2.1).

**Physics, perception, astronomy**

- Longuet-Higgins & Prazdny (1980); Rogers & Graham (1979); Watson, Ahumada & Farrell (1986) "Window of visibility"; Abrams & Christ (2003); McKee & Nakayama (1984); Legge & Campbell (1981); Lappin et al. (2009); Diels & Howarth (2013); Howard & Howard (1994) (R1 §1-5, R4 §2.2).
- Motion's critically damped spring: `node_modules/motion-dom/dist/es/animation/generators/spring.mjs`; LeVeque (2007) on explicit Euler's stability (R1 §5.4).
- CSS Values 4 reference pixel; Disney's multiplane camera (R1 §2, §4.2).
- IMO 2026 Meteor Shower Calendar and the ZHR formula; AMS meteor outlooks and fireball FAQ; NASA Meteoroid Environment Office (sporadic sources); NASA Spot the Station; Sky & Telescope on radiants and the ISS in Earth's shadow; Borovička's two-component spectra (R2 §3-6).

**This plan's own computations** (scratchpad `plan-dr/`, not committed): `calc-depth-drift.mjs` (q bands, drift bound, turn rates, speed tables, key range), `calc-pacing.mjs` (fps and divisors), `calc-rates.mjs`, `calc-cooldown.mjs`, `calc-satellite.mjs` (gap means, first-minute counts, crossings, 5 s checks), `calc-heading.mjs` (opening heading and phases), `calc-contrast.mjs` (toggle contrast, red ratios), `h-separable.ts` (phase-0 byte identity) and `h-atlas-probe.ts` (loading worker files with stubs).
