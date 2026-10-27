# Plan: home-sky ambient motion and transients

Draft by the domain-model-first planner of the 2026-10-27 planning run. A judge merges the three planner drafts into
`PLAN.md`. This draft starts from the entities and their invariants (section 4) and derives the types, modules, design
and phases from them.

## 1. Title and status

- **Status.** Planning only. No file in `src/`, configuration or tooling changes until a session implements a phase from
  section 7.
- **Date.** 2026-10-27, in a local desktop session. It resumes the cloud planning workflow that stopped on 2026-10-25
  (`HANDOFF.md`).
- **Branch.** `claude/quirky-carson-btv2u4`. Its `src/` is identical to master 246c0aa, so every `file:line` below also
  holds on master.
- **Inputs.** `research/00-shared-brief.md` (the user's request, verbatim), `research/01-planning-brief.md` (settled
  defaults and required structure), `COORDINATION.md` (the veil session's hard constraints), research reports R1 (physics
  of depth), R2 (meteors and other bodies), R3 (rendering and scheduling), R4 (design and the old sky), the code at
  246c0aa, and the Next.js 16.4.2 docs in `node_modules/next/dist/docs`.
- **Veil-session dependency.** The meteor-veil session ("Stars and comment animation redesign") owns `veiledFrom`,
  `METEOR_VEIL`, the quiet ease and the worker's `scroll` handler, and its fix was meant to land first. As of 2026-10-27
  it has not landed: `origin/master-r26syw` holds only an `.env.example` commit, and its final plan and numbers never
  arrived. So phases P1 to P7 and P13 avoid every veil-owned function and can proceed now; P8 to P12 are blocked on the
  veil commit, or on the fallback in section 8.6 if that work never lands.
- **Numbers.** Every number that isn't quoted from the research was computed for this draft with Node 24.14 (throwaway
  scripts in the session's scratch folder). The formulas are in the text, so anyone can recompute them.
- **Sketches verified.** The model sketches of sections 6.1, 6.2, 6.4, 6.6 and 6.9 (with the config, catalog, scene,
  random and protocol changes they need) were type-checked with the repo's own TypeScript 6.0.3 under its `strict` and
  `noUncheckedIndexedAccess` settings, and run under Node 24 against a copy of `src/lib/sky` at 246c0aa. Results: star
  positions, alphas, tints, shapes and keys identical to today after adding nearness (S2); the quiet index identical to
  `easedQuietFactor` over 722,355 lookups (Q1); presence bit-identical to today's idle twinkle (P1); spring steps
  compose exactly and never overshoot (C4, SP1); drift speed 0.580 to 1.420 v₀, wander 190.7 px (C3); a rate change
  never makes a per-frame jump (AC-9); 450 scheduler launches under random scroll, pause and settle events never broke
  T1, T2, T4 or T5. Removing a `case` from the drawing switch or a kind from the spec registry fails to compile, as
  designed. A simulation of the worker's wake-up loop caught two bugs in this draft's first sketch, both fixed here
  (F6, C5): in the reading scene the drift never resumed after an idle stretch (0 frames in 10 s; now 200), and a
  100 px scroll after a minute at rest moved the brightest stars 11.2 px in one frame (now 1.0 px, then a glide). The
  pause store and button (6.8), extracted verbatim from this plan, type-check against React 19.3's types, and the store
  passed 12 behavior checks: defaults with and without reduced motion, a pause surviving a reload, Play under reduced
  motion lasting only the page view, reduced motion turning on mid-visit, a pause from another tab, and blocked
  storage. Nothing was written to the repository.

**The plan at a glance.** One camera moves the whole sky, and every star moves by its own nearness times the camera, so
scrolling, the new slow drift and an optional lean toward the pointer can never disagree about depth. Nearness comes
from brightness (brighter is nearer, as with identical lamps), so the faint majority stays almost still and the bright
few float. The drift is a closed-form path of a clock (three circles riding on each other), which keeps it smooth at any
frame rate and bounded, so no wrapping is needed. Moving stars are drawn from quarter-pixel pre-rendered sprites, on
display-aligned frames only as often as their speed needs. A navbar control pauses all sky motion (WCAG 2.2.2). Then,
once the veil work lands: one scheduler for every short-lived event (shooting stars from realistic directions about
3.5 times as often, then satellites), with one ink lease so only one of them can ever light up near the copy.

**How to read this.** Section 2 is the result, section 3 the choices left to the user, section 4 the model everything
else follows from, sections 5 and 6 the design, section 7 the phases an implementer follows, section 8 the coordination.

## 2. The end goal, worked backwards

### 2.1 After 60 seconds on the hero (a laptop at DPR 2, nothing touched)

- **The faint stars look still unless you stare.** They are 71% of the sky and drift at 0.5 to 1.3 CSS px/s, about one
  arcminute per second, right at the edge of what people notice. They are the still frame the rest moves against.
- **The bright few glide.** Near-band stars move about 3 px/s (1.8 to 4.4), the two or three brightest up to 6.8 px/s.
  All stars move the same way at any instant, so the sky reads as one deep space, not sliding sheets. Mid stars move
  half as fast as near ones, far stars a third as fast again (ratios 2.05 and 1.71, both above R4's 1.6 minimum).
- **The drift floats.** Its heading turns about 2° a second (at most 4.3°), so in a minute it bends through about a third
  of a circle. Its speed waxes and wanes between 0.58 and 1.42 times the mean, with beats of about 69 s and 127 s. It
  never stops, never flips direction, never bobs, and doesn't repeat for 25 hours.
- **Copy sits in front.** Stars fade as they slide behind the hero copy and the side rails, and come back out on the
  other side, which reads as the page being a pane in front of the sky.
- **Scrolling has depth.** Near stars follow up to 0.112 of the scroll, faint ones 0.017, a smooth spread instead of
  three fixed rates. When the page stops, the stars glide to rest in about half a second (95% in 0.47 s) with no bounce.
- **Shooting stars.** About 5 in the first minute (median 5; 3 to 6 in 90% of visits), from several directions: about
  six in seven fall, the rest cross roughly sideways, none climbs more than 10°. Some share a vanishing point (the
  visit's shower). Each lights up and peaks in clear sky. On about one visit in seven the shower's radiant sits on screen,
  and the meteors near it are short, slow stubs.
- **Perhaps a satellite** (after P11): a steady point gliding in a straight line for under 5 s, sometimes fading out mid
  sky as it enters Earth's shadow. The first attempt comes within 60 s on 45% of visits.
- **A small pause button** sits in the navbar.

### 2.2 Other states

| State | What the visitor sees |
|---|---|
| Reading (scrolled past 1.3 viewport heights) | Dimmer stars, no twinkle, no transients, drift at 0.35: near stars about 1 px/s (at most 2.4), far stars about 0.3. Alive if you look, still if you read. |
| End bookend (Contact and footer) | Drift 0.8, twinkle 0.8, no transients unless the "farewell" could-kind ships. |
| prefers-reduced-motion | Exactly today's still sky: fades only, no drift, twinkle, scroll parallax, glide, lean or transients. The pause button shows paused; pressing it opts in to motion for that page view only. |
| Paused by the visitor | The sky freezes where it is (each star moves at most half a device pixel, to its rounded pixel); transients fade out over a quarter second. Play resumes from the same place. Remembered in this browser. |
| No input for 90 s | Drift and twinkle ease out over 4 s, transients pause, the worker sleeps (no frames). Any scroll, pointer move, key or focus eases everything back in over 4 s from where it stopped. |
| Hidden tab | No frames. On return the sky continues from where it was, with no leap. |
| forced-colors | Sky hidden (unchanged, `Background.module.css:27`), and the pause button hidden with it (`forced-colors:hidden`). |
| print | Sky hidden (unchanged). |

### 2.3 The ideas in plain words

- **Train window.** From a train the fence rushes by, trees glide, mountains crawl: the farther a thing is, the slower it
  slides. Your brain reads those speed differences as depth (motion parallax).
- **An honest conceit.** Real stars are so far away that they show no parallax at all, from anywhere on Earth or even
  from New Horizons. So the depth here is a diorama, like Disney's multiplane camera (1937), which slid painted glass
  layers at different speeds. Inside the diorama the physics is consistent: one camera, one law.
- **Streetlights.** On a street of identical lamps, the dimmer a lamp looks, the farther it is. Each star's nearness is
  read from its brightness the same way, so bright means near means fast, and every cue agrees.
- **Epicycles.** The camera floats on a path of circles riding on circles (Ptolemy's planets): always moving, never
  racing, never repeating a pattern you could notice.
- **Door closer.** Scrolling hands the camera to a critically damped spring: like a good door closer, it settles fast
  and never bounces.
- **Ice-cube tray.** The pixel grid is an ice-cube tray and a star's light is a spoonful of water. Pour it over a cell's
  middle and one pixel gets it all; over a corner and four pixels share it. Snapping to whole pixels makes a slow star
  tick from cell to cell. Smearing a sprite across pixels makes it pulse. Pre-pouring 16 trays at quarter-cell offsets,
  and picking the right one each frame, lets a star glide with its light landing exactly where a real point would put it.
- **The drummer.** A timer is a drummer who drifts against the band's metronome, so now and then a beat is held long and
  you hear a stumble. Drawing on every second or third display refresh is a drummer who hits exactly every second click.
- **One-lane bridge.** The copy's contrast budget has room for one light at a time. Only one transient may cross near the
  copy at once (it holds the ink lease); everything else takes the clear-sky road.
- **Meteor, comet, satellite.** What the user calls "the comet" is a meteor: a grain of dust burning up 100 km away in
  under a second, like a spark flicked off a grinding wheel. A real comet is a mountain of ice millions of km away that
  hangs in the same spot for days, like a distant ship's lights. A satellite is a machine lit by the Sun after dusk that
  glides steadily for minutes, like an airplane with its blinking lights off.

### 2.4 What this plan deliberately doesn't do

No sky rotation (adds no depth, adds a speed gradient that contradicts brightness), no dolly, zoom or warp (screensaver
look, looming captures attention), no depth-coded color (physics and perception disagree), no depth-dependent twinkle
(twinkle is in the air, not in depth), no bokeh dust layer in v1, no device orientation (permission prompt, and Apple's
Reduce Motion turns tilt parallax off), no WebGL (Safari 16.4 to 16.x lacks OffscreenCanvas WebGL2), no pre-rendered
layer bitmaps (quiet dimming is per star in screen space), and none of R2's "won't" kinds (outbursts without a pause
control, the ISS, Starlink trains, glints, the Milky Way, zodiacal light, aurora, airplanes).

## 3. Decisions for the user

Each decision has a recommended default. Phases can start with the defaults; each line says which phase a decision
gates.

| # | Decision | Recommended default | Alternatives and their cost | Gates |
|---|---|---|---|---|
| D1 | Pause control: placement and look | A 40 × 40 icon button in the navbar, always visible: beside the burger on phones, last in the nav row on desktop (after Resume). Constant accessible name "Pause sky animation", `aria-pressed`, green pause or play glyph, remembered in this browser. Paused by default under reduced motion; Play there lasts for the page view only. | (b) Bottom-right corner of the hero, next to the moving content: also meets G186, but scrolls away with the hero. (c) Footer: weakest, since G186 asks for the top of the page or next to the motion. (d) A text button ("Pause sky") instead of an icon: clearer, wider. | P5 |
| D2 | Drift while reading | 0.35 of the hero rate (R1 and R4 agree) | 0: today's still reading sky, and the worker sleeps while reading (saves about 20 frames/s there). 0.2: in between. | P6 |
| D3 | Pointer lean (desktop, fine pointer, hero only) | Ship P7 with reach 12 px at nearness 1 (R1) | Reach 7 px (R4's 2/4/7 px per layer, same law, subtler). Skip: one message type and two springs fewer. | P7 |
| D4 | Which "could" transients ship | None in v1. First candidates after v1: bursts (2 to 4 meteors from one radiant), then the near-radiant point flash. | Earthgrazers (wide screens only); a static comet (1 visit in 10) and a planet both change the reviewed composition and need a review; two end-bookend "farewell" meteors. | P12 |
| D5 | Adding a test runner | No runner in the repo. Verification uses a scratch-folder harness (Node 24 with type stripping) and an uncommitted debug patch, kept as evidence in each phase's PR description. | `node --test`: zero dependencies, but Node 24 can't resolve the codebase's extensionless relative imports without a small resolve hook (verified). Vitest: one dev dependency tree, resolves `@/` and extensionless imports through Vite, fastest to write. Either one makes the invariants in section 4.3 permanent tests. | none |
| D6 | Drift speed v₀ | 3 CSS px/s at nearness 1 | 2.5: subtler. 3.3: the most that keeps a DPR-2 laptop at 30 fps on a 60 Hz screen. 3.5: the most that keeps every star under R4's 8 px/s ceiling. 4: needs every frame (60 fps) at DPR 2 on 60 Hz and breaks AC-2. | P6 |
| D7 | WebKit main-thread frame relay | Ship without; decide after iPhone and macOS Safari tests (P13) | Build the relay if the tests show judder (about 4.5 jolts/s) or Low Power Mode drain. | P13 |
| D8 | Climbing meteors | Climb at most 10° above horizontal (R4: a rising meteor reads as a firework; the old sky's rising path was one of its faults) | R2's physical mix: about 11% climb more than 15°, kept short and sporadic-only. | P9 |
| D9 | Satellite passes | 4.8 s at 1.2 to 2.5°/s, time-compressed 2 to 3 times (R2, within the 5 s rule every transient keeps) | Realistic 0.5 to 1°/s and up to 20 s, which the pause control would allow, but it breaks the one "5 s or less" rule the veil session's WCAG reasoning relies on. | P11 |
| D10 | If the veil work never lands | When P8 is next and the veil commit still hasn't landed, ask the user whether to wait or run the fallback PF (section 8.6). | Wait indefinitely: the transient work stays blocked. | P8 |

## 4. Domain model

Everything in sections 5 to 7 follows from this section: each entity has one owning module, each invariant has one place
that enforces it.

### 4.1 Who owns what

```
 MAIN THREAD (src/components/sky, src/components)                 WORKER (src/components/sky; imports only @/lib/sky/*)
 ┌──────────────────────────────────────────────────┐            ┌──────────────────────────────────────────────────────┐
 │ skyPause.ts        Playback (the visitor's pause) │  motion    │ sky.worker.ts   orchestration: state, messages, tick; │
 │ SkyPauseToggle.tsx the pause button (UI)          │ ─────────► │                 MotionMode, Presence, Camera,         │
 │ mountSky.ts        DOM events -> messages         │  scroll    │                 TransientSchedule instances; the      │
 │                    (size, scroll, layout,         │  layout    │                 frame handles (rafId, timerId)        │
 │                     activity, pointer, motion)    │  activity  │ renderSky.ts    StarField, placePoint, drawLayer,     │
 │ Navbar.tsx         hosts the pause button         │  pointer   │                 drawTransient, drawMeteor (veil)      │
 └──────────────────────────────────────────────────┘ ─────────► │ skyAssets.ts    StarAtlas with phase sprites          │
                                                                  └──────────────────────────────────────────────────────┘
 src/lib/sky (DOM-free model; runs in the worker; the main thread imports only its types and color.ts)
 ┌────────────┬─────────────┬────────────┬─────────────┬─────────────┬───────────────┬──────────────┬──────────────────┐
 │ config.ts  │ catalog.ts  │ camera.ts  │ pacing.ts   │ presence.ts │ quietIndex.ts │transients.ts │ radiants.ts      │
 │ every      │ Star (q),   │ Camera,    │ FrameDemand,│ Presence    │ QuietIndex    │ Transient,   │ SkyWindow,       │
 │ tunable    │ DepthLaw,   │ Spring,    │ divisor,    │             │ (wraps the    │ TransientSpec│ Source, VisitSky,│
 │            │ layer bands │ DriftClock │ RefreshEst. │             │  veil's math) │ Schedule,    │ SpeedClass,      │
 │            │             │            │             │             │               │ InkLease     │ FlightLaw        │
 ├────────────┴─────────────┴────────────┴─────────────┴─────────────┴───────────────┴──────────────┴──────────────────┤
 │ scene.ts    SceneLevels and sceneAt (ours) │ screenQuietZones, quietAt, inkAt, quietFactor, easedQuietFactor (veil) │
 │ meteors.ts  Meteor, light curve, drag (shared) │ veiledFrom, planFlight, planMeteor (veil)  │ satellites.ts (ours) │
 │ protocol.ts message types   random.ts seeded randomness   color.ts sRGB helpers                                     │
 └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Per frame, the data flows one way:

```
 scroll, pointer, keys, focus ──► Presence ──┐
 scene (scroll position) ───────────────────┼──► drift rate ──► stepCamera ──► camera offset C ──► drawLayer: x = world - q·C
 Playback / reduced motion ─► MotionMode ───┘                         │
                                                                     └──► cameraSpeed ──► FrameDemand ──► divisor, rAF/timer
 quiet zones (veil's quietBlend) ──► QuietIndex ───────────────────────────────────────────► drawLayer: alpha × factor
 TransientSchedule ──► transientDemand ──► FrameDemand;   active transients ──► drawTransient (meteor, satellite)
```

### 4.2 Entities

| Entity | What it is | Owner (file) | Invariants (4.3) | Read by |
|---|---|---|---|---|
| **Star** | One star on its layer's infinite plane: world position (CSS px from the sky origin), alpha, shape, tint, thinning key, emergence delay, twinkle, and new **nearness q** | `catalog.ts` (`Star`, `cellStars`) | S1 to S5 | `renderSky.ts` |
| **Layer** | A magnitude band of the one star population, with its twinkle statistics, quiet keeps and draw order. After P2 it has no parallax of its own: its nearness range is derived. | `config.ts` (`LAYERS`, `SKY_LAYERS`), `catalog.ts` (`LAYER_NEARNESS`) | L1, L2 | `catalog.ts`, `renderSky.ts` |
| **DepthLaw** | Magnitude to nearness: q(m) = min(1.6, 10^(-0.14 (m - 1.57))) | `config.ts` (`DEPTH`), `catalog.ts` (`nearness`) | S3 | `catalog.ts`, worker (q max for pacing) |
| **Camera** | The one viewpoint: offset C in CSS px for a star at q = 1, the sum of three components: scroll, drift, lean | `camera.ts` (`Camera`, `stepCamera`, `cameraOffset`) | C1 to C7 | worker, `renderSky.ts` (as `SkyFrame.camera`) |
| **Spring** | One critically damped axis (value, velocity), stepped in closed form | `camera.ts` (`Spring`, `springStep`) | SP1 | Camera only |
| **DriftClock** | The drift path's own time τ (s); the drift offset is a pure function of τ | `camera.ts` (`Camera.clock`, `driftAt`) | D1, D2 | Camera only |
| **SceneLevels** | Multipliers for the scroll narrative: stars per layer, haze, twinkle, and new drift and lean, plus the launch gate | `scene.ts` (`sceneAt`) | SC1 | worker |
| **Presence** | Whether the visitor seems to be here: last input, last return from idle | `presence.ts` | P1 | worker |
| **Playback** | The visitor's pause choice, defaulting to paused under reduced motion | `skyPause.ts` (main thread) | PB1, PB2 | `SkyPauseToggle.tsx`, `mountSky.ts` |
| **MotionMode** | `SkyMotion`: `'full' \| 'reduced' \| 'off'`; `'reduced'` now also means paused | `protocol.ts` (type), `mountSky.ts` (derives it), worker (obeys it) | PB3, C6 | worker |
| **FrameDemand** | What one part of the sky needs from the clock: frames per second, whether they must be display-aligned, and a cap | `pacing.ts` | F1, F3 | worker |
| **FrameClock** | When the worker wakes and whether it draws. Policy (divisor and its hysteresis, `frameDue`, the refresh estimate) is pure; mechanism (the `rafId` and `timerId` handles, the watchdog) stays in the worker, because the veil-owned scroll handler reads those handles (6.2). | `pacing.ts` (policy), `sky.worker.ts` (mechanism) | F2, F4, F5 | worker |
| **QuietZones** | Padded quiet rects on screen, easing from the previous layout (`QuietBlend`) | veil: `scene.ts` math, worker `quietBlend` | (veil-owned) | QuietIndex, `drawMeteor` |
| **QuietIndex** | Per-tile buckets of the quiet zones, giving every star its exact quiet factor cheaply | `quietIndex.ts` | Q1, Q2 | `renderSky.ts` |
| **StarField** | The cache of generated cells, evicted by frame stamp | `renderSky.ts` (`createStarField`) | SF1, SF2 | `drawLayer` |
| **StarAtlas** | Point-spread sprites per tint, shape and quarter-pixel phase, plus the meteor head | `skyAssets.ts` | A1 | `placePoint` |
| **Transient** | A short-lived sky event: an envelope (kind, lifetime, ink lease, launch scroll, cancel) around its kind's body (`Meteor`, `SatellitePass`) | `transients.ts` | T1 to T7 | worker, `renderSky.ts` |
| **TransientSpec** | How one kind is timed and planned (first delay, next attempt, plan, lifetime, moving) | `transients.ts` (one registry for every kind; each kind's module supplies its planner) | T1, T3 | the Scheduler |
| **Scheduler** (`TransientSchedule`) | The active transients and each kind's next attempt; launches, retires, cancels | `transients.ts` | T1 to T7 | worker |
| **InkLease** | The right to plan light onto quiet copy. Not an object: it is held by whichever active transient has `nearCopy`, so it can't leak. | `transients.ts` (`inkLeaseFree`) | T2 | Scheduler |
| **LaunchGate** | Whether and where transients may launch this tick (motion, visibility, presence, scene, scroll quiet, field) | `transients.ts` (type), worker (fills it) | T6 | Scheduler |
| **GapLaw** | floor + Exp(mean), capped: one law for every kind's clock | `transients.ts` (`nextGap`), `config.ts` | T5 | specs |
| **SkyWindow** | The screen as a pinhole window on the sky: 60° across the longer side, centre 40° above the horizon | `radiants.ts`, `config.ts` (`SKY_WINDOW`) | R3 | meteor and satellite planning |
| **Radiant / Source** | A unit direction in the window frame, its scatter and speed class; a visit has one shower source and three sporadic ones (`VisitSky`) | `radiants.ts` | R1, R2 | meteor planning |
| **SpeedClass** | slow / medium / fast: angular speed, duration, wake color, train allowed | `config.ts` (`SPEED_CLASSES`) | R3 | `radiants.ts`, `drawMeteor` |
| **SatellitePass** | A steady point on a straight line with fades | `satellites.ts` | T1, T3 | `renderSky.ts` |

### 4.3 Invariants and where each is enforced

"Type" means the compiler enforces it; "code" means one function does; "harness" means a scratch check (section 7.0)
proves it for the phase's PR.

| ID | Invariant | Enforced by |
|---|---|---|
| S1 | A cell's stars depend only on (layer, cx, cy, `SKY_SEED`). | code: `cellStars` (unchanged) |
| S2 | Every star consumes the same random draws; nearness adds none, so retuning `DEPTH` never moves a star at rest. | code: `q: nearness(m)` reuses the drawn magnitude; harness: positions identical before and after P2 |
| S3 | q = `nearness(m)` is non-increasing in m, continuous across band edges, and in [0.240, 1.600]. | code: `nearness`; harness |
| S4 | With the camera at (0, 0) every star is drawn exactly where it is drawn today. | harness: draw-call equivalence (P1, P2) |
| S5 | Alpha, shape, tint and twinkle depend on magnitude only, never on q (a sideways move changes no brightness). | code: `cellStars` |
| L1 | Bands are contiguous, faintest first; their nearness ranges abut (far 0.240 to 0.389, mid 0.389 to 0.741, near 0.741 to 1.600), so no speed inversion at a band edge. | code: `LAYER_NEARNESS` derived from `LAYERS` |
| L2 | A layer's quiet keeps apply to each of its stars at its drawn position, every frame. | code: `drawLayer` via `QuietIndex.factor` |
| C1 | The camera only translates: no rotation, zoom or dolly. | type: `Camera` has no such state |
| C2 | One law for every cause: screen = world - q · C. | code: `drawLayer` is the only place stars are offset |
| C3 | Bounded: drift within 2 (R₁ + R₂ + R₃) = 70.8 s × v₀ (212 CSS px at v₀ = 3) of its start; lean within reach × √2; scroll at most 0.07 × the page's scroll range. | code: closed-form drift; harness |
| C4 | Frame-rate independent: one step of dt equals two steps of dt/2. | code: `springStep` closed form; harness (difference 0 measured) |
| C5 | No jumps: scene, presence, ease and pause change only the drift clock's rate, never its position; the clock steps at most `DRIFT.maxStep`; after a freeze, and whenever the camera has come to rest, the next step has dt 0 (otherwise a scroll after a long rest would land in one frame: 11.2 px for the brightest stars after a 100 px scroll, simulated); scroll snaps only on jumps over one viewport. | code: `stepCamera`, `freezeCamera` |
| C6 | Frozen unless motion is `'full'` (reduced, paused, hidden). | code: worker steps the camera only under full motion and visible |
| C7 | Starts at rest on the restored scroll; the drift offset is 0 until the reveal. | code: `createCamera(scrollY)`, clock 0 |
| SP1 | Critically damped: never passes a fixed target; settles exactly on it once under `CAMERA.restPx` of motion is left. | code: `springStep`, `settle`; harness (overshoot 0 with 250 ms steps) |
| D1 | The drift clock never runs backward; its rate is in [0, 1]. | code |
| D2 | The rate is 0 unless motion is full, the page is revealed, and the software-raster budget allows drift. | code: worker `driftRate` |
| SC1 | Scene levels are continuous in scroll and need no clock. | code: `sceneAt` (unchanged mixing) |
| P1 | Any input resets idleness; levels ease both ways over `FRAME.idleFadeMs`; after `idleSleepMs` the ambient motion is 0. | code: `presenceLevel` |
| PB1 | Paused when the visitor paused (remembered), or when reduced motion is on and they haven't pressed Play in this page view. | code: `skyPlayback` |
| PB2 | Storage failure never breaks the page; the choice then lasts for the page view. | code: try/catch in `skyPause.ts` |
| PB3 | One stillness pipeline: paused is motion `'reduced'` in the worker. | code: `mountSky`'s `motion()` |
| F1 | Anything that moves draws on animation frames, never on a timer. | code: demands with `vsync: true` |
| F2 | Each drawn frame stays up for the same number of refreshes (a whole divisor k), except on WebKit's unaligned 15 ms clock (k = 1). | code: `refreshDivisor`, `stepDivisor`, `frameDue` |
| F3 | While stars move: at least `PACING.minFps` and at most `PACING.stepPx` device px per drawn frame, within the demand's cap. | code: `motionFps`, `refreshDivisor` |
| F4 | Nothing moving or changing means no frames, except one timer for the next due transient. | code: the worker's `schedule` |
| F5 | A missing or stalled worker animation-frame clock falls back to a 60 Hz timer within `PACING.watchdogMs`. | code: the worker's `requestFrame` and watchdog |
| F6 | A level that eases in from 0 (twinkle, drift) demands frames from the moment it heads up, not once its value passes 0, so a sleeping worker never misses its own wake-up. Today's `frameMode` does this for twinkle (`sky.worker.ts:124`). Input that only changes a target (the pointer, a resume) sets `needsDraw`, so a tick steps the camera. | code: `driftWanted`, `twinkleDemand`, the `pointer` and `motion` handlers |
| Q1 | `QuietIndex.factor(x, y, keeps)` equals `easedQuietFactor(blend, x, y, keeps)` bit for bit, as long as no zone reaches farther than `QUIET_REACH`. | code; harness (max difference 0) |
| Q2 | The index serves stars only; meteor planning and drawing keep the full checks. | code: only `drawLayer` uses it |
| SF1 | Cells in use are never regenerated within a frame; unused cells go only above 2 times the cells in use. | code: `StarField` stamps |
| SF2 | Cell keys are injective within ±32768 cells; outside that range a cell holds no stars (never a key collision). | code: `StarField.cell` guard |
| A1 | Phase (0, 0) sprites are byte-identical to today's sprites; every phase of a sprite has the same total light. | code: separable painter normalized by the phase-0 peak; harness (bytes equal) |
| T1 | Every transient lasts at most `TRANSIENTS.maxLife` (5 s) from first light to last, wake, train and fades included. | code: the scheduler rejects longer plans; harness over the config |
| T2 | At most one active transient holds the ink lease (`nearCopy`); a new lease only `crossingCooldown` after the last one began. | code: `inkLeaseFree`, `launch` |
| T3 | A kind that may reach quiet copy is planned through the veil checks; a kind that never takes the lease is planned at least `QUIET.feather` clear of every padded rect. | code: each spec's `plan` |
| T4 | Every transient obeys the scroll cancel (`launchScrollY`) and the pause. | code: `updateTransients`, `cancelTransients` |
| T5 | Onsets at least `TRANSIENTS.minOnsetGap` apart; at most 3 flashes per second; no saturated red (R / (R + G + B) < 0.8). | code: `launch`; config review (pale orange is 0.40) |
| T6 | Launches only in the hero, under full motion, visible, revealed, present and settled; narrow screens at most `narrowLimit` per visit. | code: `LaunchGate`, `launch` |
| T7 | One transient of each kind at a time. | code: `launch` |
| R1 | A visit's sources stay fixed until a resize, a layout change or repeated planning failures. | code: `VisitMemory` reset |
| R2 | No path climbs more than `RADIANTS.maxClimb` above horizontal. | code: the flight law |
| R3 | A meteor's speed and length follow the window geometry: short and slow near its radiant, longest 90° away. | code: `radiantMotion` |

### 4.4 Ownership across the two sessions

- **Ours, from P1.** `DEPTH`, `CAMERA`, `DRIFT`, `LEAN`, `PACING`, `STAR_PHASES`, the `drift` and `lean` scene levels;
  `catalog.ts` nearness; `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`; `drawLayer`, `StarField`,
  `placePoint`, the atlas; `frameMode`/`schedule`/`tick` (becoming `frameDemand` plus the pacing policy);
  the worker's `init`, `motion`, `visible` handlers; mountSky's activity, pointer and pause wiring; the pause UI.
- **The veil session's until its commit lands** (COORDINATION.md request 2): `veiledFrom`, `METEOR_VEIL`, the quiet
  ease (`quietBlend`, `settleQuiet`, the `layout` handler) and the `scroll` handler. Also touched by it, so ours only
  after the rebase: `planFlight`, `planMeteor`, `updateMeteor`, `drawMeteor`/`drawTrain`, `quietFactor`/`inkAt`,
  `QUIET`, METEOR's spawn and selection keys, the rect measurement in `mountSky.ts`.
- **Read only, by us, at any time:** `parallaxScroll`, `scrollY`, `quietBlend(t)`, `layoutAt`, `easedQuietFactor`,
  `screenQuietZones`. Reading their outputs never conflicts with how they compute them.
- **Shared after the rebase:** the transient scheduler replaces `updateMeteor` and absorbs their scroll cancel, so one
  rule covers every kind (section 8.2, I3).

## 5. Architecture and module map

### 5.1 Files

| File | New or changed | Side | Owner | Phase | What changes |
|---|---|---|---|---|---|
| `src/lib/sky/config.ts` | changed | model | ours (new blocks) | P1 to P11 | `STAR_PHASES` (P1); `DEPTH`, `CAMERA`, `LAYERS.*.parallax` removed (P2); `PACING`, `ADAPT` doc (P3); `FRAME` doc (P4); `DRIFT`, `SCENE.*.drift` (P6); `LEAN`, `SCENE.*.lean` (P7); `TRANSIENTS`, METEOR's scheduler keys moved (P8); `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE` (P9); `METEOR_KINDS` (P10); `SATELLITE` (P11) |
| `src/lib/sky/catalog.ts` | changed | model | ours | P2 | `Star.q`, `nearness`, `LAYER_NEARNESS` |
| `src/lib/sky/scene.ts` | changed | model | ours (`sceneAt`), veil (quiet math) | P1, P6, P7, P8 | `sameRects` moved here (P1); `drift` (P6) and `lean` (P7) levels; `meteors` renamed `launches` (P8) |
| `src/lib/sky/camera.ts` | **new** | model | ours | P2, P6, P7 | `Vec`, `Spring`, `Camera`, `CameraInput`, `springStep`, `createCamera`, `stepCamera`, `freezeCamera`, `cameraOffset`, `cameraSpeed`, `cameraAtRest`, `driftAt`, `driftVelocity` |
| `src/lib/sky/pacing.ts` | **new** | model | ours | P3 | `FrameDemand`, `NO_FRAMES`, `EVERY_FRAME`, `FADE_FRAMES`, `combineDemands`, `motionFps`, `refreshDivisor`, `RefreshEstimate` |
| `src/lib/sky/presence.ts` | **new** | model | ours | P4 | `Presence`, `createPresence`, `notePresence`, `isAway`, `presenceLevel` |
| `src/lib/sky/quietIndex.ts` | **new** | model | ours (wraps veil math) | P1 | `QuietIndex`, `createQuietIndex`, `QUIET_REACH` |
| `src/lib/sky/random.ts` | changed | model | ours | P8, P9 | `Random` type; `gaussian` (P9) |
| `src/lib/sky/transients.ts` | **new** | model | ours | P8 | the union, specs, scheduler, lease, cancel, `nextGap`, demand |
| `src/lib/sky/radiants.ts` | **new** | model | ours | P9 | `SkyWindow`, `SkyDirection`, `Source`, `VisitSky`, `FlightLaw`, `radiantMotion`, `elevationAt`, `meteorRange`, `pickVisitSky`, `flightLaw` |
| `src/lib/sky/satellites.ts` | **new** | model | ours | P11 | `SatellitePass`, `SatelliteFrame`, `planSatellite`, `satelliteMoving`, `satelliteAt` |
| `src/lib/sky/meteors.ts` | changed | model | veil | P9, P10 | only through interface requests I1, I2, I4 (section 8.2) |
| `src/lib/sky/protocol.ts` | changed | types | shared | P4, P5, P7 | `activity` (P4), `SkyMotion` doc (P5), `pointer` (P7) |
| `src/components/sky/sky.worker.ts` | changed | worker | ours except the veil handlers | P1 to P11 | camera, presence, demand, schedule; never the `scroll`/`layout` handler bodies |
| `src/components/sky/renderSky.ts` | changed | worker | ours except `drawMeteor`/`drawTrain` | P1, P2, P8, P11 | `StarField`, `SkyFrame`, `drawLayer`, `placePoint`, `drawSky`, `drawTransient`, `drawSatellite` |
| `src/components/sky/skyAssets.ts` | changed | worker | ours | P1 | phased atlas, separable painter, `starSpriteIndex` |
| `src/components/sky/mountSky.ts` | changed | main | ours except rect measurement | P4, P5, P7 | activity and pointer listeners; `motion()` from the pause store |
| `src/components/sky/skyPause.ts` | **new** | main | ours | P5 | `SkyPlayback`, `skyPlayback`, `setSkyPaused`, `subscribeSkyPlayback` |
| `src/components/sky/SkyPauseToggle.tsx` | **new** | main (client) | ours | P5 | the pause button |
| `src/components/icons/PauseSVG.tsx`, `PlaySVG.tsx`, `icons/index.ts` | new, changed | main | ours | P5 | two glyphs on the shared `Icon` frame, re-exported from the barrel |
| `src/components/Navbar.tsx` | changed | main (client) | ours | P5 | hosts the toggle in the entrance stagger |
| `AGENTS.md` | changed | docs | ours | P5, P11 | the pause rule (P5); the worker-file list gains `renderTransients.ts` only if P11 splits it out |

### 5.2 Import boundaries (AGENTS.md line 19)

- **`src/lib/sky/*`** imports only its own files, by relative path. Every new model file (`camera.ts`, `pacing.ts`,
  `presence.ts`, `quietIndex.ts`, `transients.ts`, `radiants.ts`, `satellites.ts`) imports only `./config`, `./scene`,
  `./meteors`, `./pacing`, `./random`, `./protocol` (types) or each other. No React, no `window`/`document`, no `@/lib`
  barrel, no `@/lib/utils`. The only cycle is type-only: `transients.ts` holds every kind's spec in one registry and
  imports the satellite body functions (`planSatellite`, `satelliteMoving`) from `satellites.ts`, which imports only
  types (`PlanContext`, `Planned`) back; type imports are erased, so there is no runtime cycle. Keep it that way: a
  first sketch of this draft let `satellites.ts` import the value `nextGap` back, a real runtime cycle in which, if
  `satellites.ts` loads first, the registry reads `satelliteSpec` before it exists (a temporal-dead-zone error).
- **Worker files** (`sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`) keep importing only `@/lib/sky/*` by file and each
  other. No new worker file is needed: R3 proposed a `FrameClock` wrapper module, but the veil-owned scroll handler reads
  the worker's `rafId` and `timerId` directly (`sky.worker.ts:469`), so the handles stay in the worker and only the pure
  pacing policy moves out, to `src/lib/sky/pacing.ts` (6.2). If `renderSky.ts` grows past about 400 lines with
  transients, split `renderTransients.ts` out in P11 and add it to AGENTS.md's list (R3 §7.5).
- **Main thread.** `mountSky.ts` keeps importing only types and `@/lib/sky/color` from `src/lib/sky`; its new constants
  (activity interval, pointer query) live in `mountSky.ts`, like `DPR_CAP`. `skyPause.ts` imports nothing from
  `src/lib/sky`; it reads `REDUCED_MOTION_QUERY` from `@/lib/utils`, which `mountSky.ts` already does.
- **Bundling.** The worker entry is unchanged: `new Worker(new URL('./sky.worker.ts', import.meta.url))`
  (`mountSky.ts:80`). Turbopack analyzes `new Worker()` expressions (Next.js docs, `03-api-reference/08-turbopack.md`
  "Magic Comments"; `02-guides/lazy-loading.md`), and every new model or worker file reaches the worker chunk through a
  static import from `sky.worker.ts`. No config change.

### 5.3 Main thread and worker split

```
 main thread                                       worker
 ResizeObserver ──── init/resize ───────────────►  sizes, assets, camera created on the restored scroll
 Motion scroll() ─── scroll (veil handler) ──────►  scrollY, parallaxScroll, noteInput      (handler body unchanged)
 ResizeObserver ──── layout (veil handler) ──────►  quiet rects, ease                         (handler body unchanged)
 pointer, keys ───── activity (≤ 1/s) ───────────►  noteInput                                 (P4)
 pointermove ─────── pointer (≤ 1 per frame) ────►  lean target                               (P7)
 skyPause store ──── motion: full | reduced ─────►  freeze camera, cancel transients, snap     (P5)
 visibilitychange ── visible ────────────────────►  cancel frames, freeze camera
                     ◄── ready / error ──────────  first frame drawn, or the sky can't run
```

All per-frame work stays in the worker. The main thread only forwards events: the pointer at most once per animation
frame, activity at most once a second.

### 5.4 Protocol changes in one place

```ts
// src/lib/sky/protocol.ts
/**
 * How much the sky may change on its own:
 * - `full`: twinkle, drift, scroll parallax and its glide, pointer lean and transients
 * - `reduced`: prefers-reduced-motion, or the visitor paused the sky: fades and brightness only
 * - `off`: forced colors hide the sky, so nothing is drawn
 */
export type SkyMotion = 'full' | 'reduced' | 'off'

export type SkyMainMessage =
	// …every existing message, unchanged…
	/** The visitor is still here without scrolling (pointer, keys, focus); at most one a second. (P4) */
	| { type: 'activity' }
	/** A fine pointer's position for the lean, -1 to 1 from the viewport centre (x right, y down); null once it leaves. (P7) */
	| { type: 'pointer'; at: { x: number; y: number } | null }
```

P13 alone would add `{ type: 'tick' }` (main to worker) and `{ type: 'relay'; on: boolean }` (worker to main).

## 6. Detailed design per area

Code sketches follow the codebase: tabs, single quotes, no semicolons, a documentation comment on every exported constant,
relative imports inside `src/lib/sky`, `@/` imports elsewhere. They are plans, not patches: names and contracts are
binding, bodies may be tightened.

### 6.1 Camera, depth and drift

#### The law

```
 screen(star) = world(star) - q(star) · C(t)                 every star, every cause (C2)
 C(t)         = C_scroll + C_drift + C_lean                   CSS px for a star at nearness q = 1
 C_scroll     = (0, 0.07 · s(t))                              s: critically damped spring on the scroll, ω = 10 rad/s
 C_drift      = E(τ) - E(0)                                   three circles, τ = the drift clock (s)
 C_lean       = 12 · (ℓx(t), ℓy(t))                           ℓ: critically damped springs on the pointer, ω = 4 rad/s
 dτ/dt        = scene.drift · presence · ease · narrow        0 unless motion is full; dt capped at 0.1 s per step
 q(m)         = min(1.6, 10^(-0.14 · (m - 1.57)))             nearness from magnitude, no random draw
```

Why translation only (C1): under a pinhole camera a sideways move shifts every point at depth Z by f·T/Z, the same
amount wherever it is on screen, so per-star offsets q·C are the exact pinhole result; rotation and zoom move near and
far points alike and carry no depth (Longuet-Higgins and Prazdny 1980; R1 §1).

#### Depth: nearness from magnitude (P2)

```ts
// src/lib/sky/config.ts
/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen: 1 at magnitude
 * `reference` (the near band's mean). Identical lamps would give q = 10^(-0.2 (m - reference)), the inverse-square law;
 * `compression` 0.14 keeps 70% of that depth range (as STAR_ALPHA keeps a 400:1 flux range as 5:1), so the faintest stars
 * still move (q 0.24) and the few brightest never race (at most `maxNearness`, from magnitude 0.11 up). The band means
 * come out at 0.29, 0.50 and 1.02, so scroll parallax (CAMERA.scrollParallax × q) averages 0.0205, 0.035 and 0.0717, close
 * to the reviewed 0.02, 0.04 and 0.07. Retuning it never moves a star while the camera is at rest.
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const
```

```ts
// src/lib/sky/catalog.ts
export interface Star {
	// …existing fields…
	/** Nearness from the magnitude (DEPTH): the share of the camera's motion this star shows. Costs no random draw. */
	q: number
}

/** Nearness q of a star of magnitude m: its share of the camera's motion (DEPTH). Brighter is nearer, at most DEPTH.maxNearness. */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Each layer's nearness range [faintest, brightest], from its magnitude band, for culling its cells against the camera. */
export const LAYER_NEARNESS = Object.fromEntries(
	SKY_LAYERS.map((layer) => {
		const [brightest, faintest] = LAYERS[layer].magnitude
		return [layer, [nearness(faintest), nearness(brightest)] as const]
	})
) as Record<SkyLayer, readonly [number, number]>

// In cellStars, after `m` is drawn (catalog.ts:143): no new draw, so S2 holds and the resting sky is unchanged
//	stars.push({ x, y, alpha: magnitudeAlpha(m), q: nearness(m), …the rest as today })
```

`LayerConfig.parallax` and the three `parallax` values go (`config.ts:59`, `:78` to `:80`); the only reader is
`renderSky.ts:100`. The `LAYERS` comment changes from "scroll parallax" to "how far each star moves comes from DEPTH".

| Layer | Share of stars | Nearness range | Mean q | Scroll share (0.07 q) | Today |
|---|---|---|---|---|---|
| far (mag 4.5 to 6) | 71.5% | 0.240 to 0.389 | 0.293 | 0.0168 to 0.0272, mean 0.0205 | 0.02 |
| mid (2.5 to 4.5) | 23.5% | 0.389 to 0.741 | 0.501 | 0.0272 to 0.0519, mean 0.0351 | 0.04 |
| near (-0.5 to 2.5) | 5.1% | 0.741 to 1.600 | 1.024 | 0.0519 to 0.112, mean 0.0717 | 0.07 |

Why k = 0.14 and not the physical 0.2 (R1 §3.2): a least-squares fit of the reviewed parallax values against band-mean
magnitudes gives 0.14, so the reviewed sky already *is* the inverse-square law compressed to 70%. At 0.2 the faint stars
would drift too slowly to see and the brightest would race.

#### The camera and its scroll part (P2)

```ts
// src/lib/sky/config.ts
/**
 * The camera the sky is seen through, in CSS px for a star at nearness 1: every star appears at its place minus q times
 * the camera, whatever moves it (scroll, drift, lean). Scrolling moves the camera `scrollParallax` of the scroll through
 * a critically damped spring of `scrollOmega` rad/s, so the stars glide to rest after the page stops (95% in 0.47 s, 99%
 * in 0.66 s) and never overshoot (Motion: bounce 0, visualDuration 0.52 s). Scrolling at 1000 px/s, the near stars trail
 * by about 14 px. A jump of more than `snapViewports` viewport heights in one message (Home, End, find in page) snaps
 * instead of sweeping the near stars across the screen at up to 2000 px/s. A spring with less than `restPx` (CSS px at
 * nearness 1) of motion left settles on its target and stops asking for frames.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, snapViewports: 1, restPx: 0.01 } as const
```

#### The drift (P6)

```ts
// src/lib/sky/config.ts
/**
 * The floating drift, in CSS px for a star at nearness 1: epicycles, a main circle turning once every `period` seconds
 * with smaller circles riding on it (a negative ratio turns the other way). Each circle moves at share × `speed`, so the
 * speed stays within `speed` × 0.58 to 1.42 (never stops, never races), the heading turns about 2° a second (at most 4.3°)
 * and the speed waxes and wanes on beats of about 69 s and 127 s. The path stays within 63.6 s × `speed` of its start
 * (191 CSS px at nearness 1) and doesn't repeat exactly for 25 hours. On a laptop (about 1.3 arcmin per CSS px) the near
 * stars move about 4 arcmin/s and the faint ones about 1, three times and once the slowest motion people notice, so the
 * faint majority reads as still. Narrow screens run the drift clock at `narrowRate` (their CSS px look about 1.35 times
 * bigger). The drift eases in over `ease` seconds after the reveal or a resume; `maxStep` caps one step of the drift
 * clock, so a stalled frame never jumps the sky.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.9 },
		{ ratio: -1.618, share: 0.3, phase: 2.4 },
		{ ratio: 2.414, share: 0.12, phase: 4.7 },
	],
	narrowRate: 0.6,
	ease: 3,
	maxStep: 0.1,
} as const
```

Computed for v₀ = 3 (Node, 2-hour simulation at 10 Hz):

| Quantity | Value |
|---|---|
| Circle radii R = share · v₀ / \|ω\| | 85.94, 15.94, 4.27 CSS px (ω = 0.0349, -0.0565, 0.0843 rad/s) |
| Speed range | 0.580 to 1.420 v₀ |
| Heading turn rate | mean 2.00°/s, max 4.33°/s |
| Largest change of speed | 3.8% per second |
| Bound on the wander | exact supremum with these phases R₁ + R₂ + R₃ + \|E(0)\| = 190.9 px (63.6 s × v₀; simulated 190.7); for any phases 2 (R₁ + R₂ + R₃) = 212.3 px (70.8 s × v₀) |
| Wander per band | brightest 305, near mean 195, mid mean 96, far mean 56 px |
| Near-return | once per main period (180 s) the camera comes back within 21 to 38 px (q = 1) of where it was |
| Exact repeat | the ratios are the decimals 1.618 = 809/500 and 2.414 = 1207/500, so the path repeats exactly after 500 periods: 25 hours |
| Frequencies | 0.0056, 0.0090 and 0.0134 Hz: far below the 0.05 to 0.5 Hz band linked to motion sickness (Diels and Howarth 2013) |

#### `src/lib/sky/camera.ts` (new; P2 adds the scroll part, P6 the drift clock, P7 the lean)

```ts
import { CAMERA, DRIFT, LEAN } from './config'

/** A 2D offset (CSS px) or velocity (CSS px/s). */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: where it is and how fast it moves (its own units per second). */
export interface Spring {
	value: number
	velocity: number
}

/**
 * The one camera the sky is seen through. Every star appears at its place on its layer's plane minus q times the
 * camera's offset (cameraOffset), whatever moves it: the page scroll through a spring, the drift as a closed-form path of
 * its own clock, the lean toward the pointer through two springs. Mutated in place by stepCamera, so no garbage per frame.
 */
export interface Camera {
	/** Page scroll the stars follow (page px): the real scroll, smoothed by a critically damped spring. */
	scroll: Spring
	/** Lean toward the pointer on each axis, -1 to 1. (P7) */
	leanX: Spring
	leanY: Spring
	/** Drift clock (s): the drift path's own time. It runs at the drift rate and stops when the sky may not move. (P6) */
	clock: number
	/** Worker-clock seconds of the last step; null after a freeze, so the next step has dt 0 and nothing jumps. */
	steppedAt: number | null
}

/** What the camera follows on one step. */
export interface CameraInput {
	/** Worker-clock seconds. */
	time: number
	/** Scroll offset to follow (page px): the worker's parallaxScroll. */
	scroll: number
	/** Lean target per axis, -1 to 1: (0, 0) with no fine pointer, off the hero, or without the lean. */
	lean: Vec
	/** Drift clock rate, 0 to 1: scene, presence, ease-in and narrow screens together. */
	drift: number
	/** Viewport height (CSS px): a scroll jump of more than CAMERA.snapViewports of these snaps. */
	viewportHeight: number
}

/** Radians per second of the main drift circle. */
const MAIN_OMEGA = (2 * Math.PI) / DRIFT.period

/** A camera at rest on the restored scroll position (C7): the first frame neither glides nor jumps. */
export function createCamera(scrollY: number): Camera {
	return {
		scroll: { value: scrollY, velocity: 0 },
		leanX: { value: 0, velocity: 0 },
		leanY: { value: 0, velocity: 0 },
		clock: 0,
		steppedAt: null,
	}
}

/**
 * Moves a critically damped spring toward `target` over `dt` seconds with the exact solution
 * x(t) = target + (e + (v + ωe)t)e^(-ωt): the same path at any frame rate (a 15 fps timer, a 144 Hz display, a frame after
 * a stall) and never past the target. motion-dom resolves critically damped springs with the same closed form.
 */
export function springStep(spring: Spring, target: number, omega: number, dt: number): void {
	const offset = spring.value - target
	const slope = spring.velocity + omega * offset
	const decay = Math.exp(-omega * dt)
	spring.value = target + (offset + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
}

/** Puts a spring on its target once less than CAMERA.restPx of motion (CSS px at nearness 1, after `scale`) is left. */
function settle(spring: Spring, target: number, omega: number, scale: number): void {
	if (scale * (Math.abs(spring.value - target) + Math.abs(spring.velocity) / omega) >= CAMERA.restPx) return
	spring.value = target
	spring.velocity = 0
}

/**
 * Advances the camera to `input.time`: springs by the true elapsed time, the drift clock by at most DRIFT.maxStep of it
 * (C4, C5). Returns true while anything still moves, so the worker keeps asking for frames.
 */
export function stepCamera(camera: Camera, input: CameraInput): boolean {
	const dt = camera.steppedAt === null ? 0 : Math.max(0, input.time - camera.steppedAt)
	camera.steppedAt = input.time
	if (Math.abs(input.scroll - camera.scroll.value) > CAMERA.snapViewports * input.viewportHeight) {
		// A jump (Home, End, find in page): a spring would sweep the near stars across the screen
		camera.scroll.value = input.scroll
		camera.scroll.velocity = 0
	} else {
		springStep(camera.scroll, input.scroll, CAMERA.scrollOmega, dt)
		settle(camera.scroll, input.scroll, CAMERA.scrollOmega, CAMERA.scrollParallax)
	}
	springStep(camera.leanX, input.lean.x, LEAN.omega, dt)
	springStep(camera.leanY, input.lean.y, LEAN.omega, dt)
	settle(camera.leanX, input.lean.x, LEAN.omega, LEAN.reach)
	settle(camera.leanY, input.lean.y, LEAN.omega, LEAN.reach)
	camera.clock += input.drift * Math.min(dt, DRIFT.maxStep)
	const moving =
		input.drift > 0 ||
		camera.scroll.value !== input.scroll ||
		camera.leanX.value !== input.lean.x ||
		camera.leanY.value !== input.lean.y
	// At rest the camera forgets its clock: whenever a target next changes (a scroll, the pointer), the first step starts
	// from dt 0, instead of treating the whole rest as time spent chasing the new target and jumping onto it
	if (!moving) camera.steppedAt = null
	return moving
}

/** Stops the camera where it is (reduced motion, paused, hidden): no velocity, and the next step starts from dt 0 (C6). */
export function freezeCamera(camera: Camera): void {
	camera.scroll.velocity = 0
	camera.leanX.velocity = 0
	camera.leanY.velocity = 0
	camera.steppedAt = null
}

/**
 * Where the drift has carried the camera at drift-clock time `clock` (s), CSS px at nearness 1, written to `out`. Zero at
 * clock 0, so a visit starts on the reviewed sky. Each circle's radius is share × speed / |ω|, so its own speed is
 * share × speed.
 */
export function driftAt(clock: number, out: Vec): Vec {
	let x = 0
	let y = 0
	for (const { ratio, share, phase } of DRIFT.epicycles) {
		const omega = MAIN_OMEGA * ratio
		const radius = (share * DRIFT.speed) / Math.abs(omega)
		x += radius * (Math.cos(omega * clock + phase) - Math.cos(phase))
		y += radius * (Math.sin(omega * clock + phase) - Math.sin(phase))
	}
	out.x = x
	out.y = y
	return out
}

/** The drift's velocity at drift-clock time `clock`, CSS px per second of drift clock at nearness 1, written to `out`. */
export function driftVelocity(clock: number, out: Vec): Vec {
	let x = 0
	let y = 0
	for (const { ratio, share, phase } of DRIFT.epicycles) {
		const turn = MAIN_OMEGA * ratio * clock + phase
		const speed = Math.sign(ratio) * share * DRIFT.speed
		x -= speed * Math.sin(turn)
		y += speed * Math.cos(turn)
	}
	out.x = x
	out.y = y
	return out
}

/** Scratch vector for the drift (no garbage per frame). */
const drift: Vec = { x: 0, y: 0 }

/** The camera's offset (CSS px at nearness 1): scroll parallax, drift and lean added. Written to `out`. */
export function cameraOffset(camera: Camera, out: Vec): Vec {
	driftAt(camera.clock, drift)
	out.x = drift.x + LEAN.reach * camera.leanX.value
	out.y = CAMERA.scrollParallax * camera.scroll.value + drift.y + LEAN.reach * camera.leanY.value
	return out
}

/** How fast the camera moves now, at drift rate `rate` (CSS px/s at nearness 1): what the frame clock paces. */
export function cameraSpeed(camera: Camera, rate: number): number {
	driftVelocity(camera.clock, drift)
	return (
		rate * Math.hypot(drift.x, drift.y) +
		CAMERA.scrollParallax * Math.abs(camera.scroll.velocity) +
		LEAN.reach * Math.hypot(camera.leanX.velocity, camera.leanY.velocity)
	)
}
```

Notes for the implementer:

- In P2 the camera has only `scroll` and `steppedAt` (and `cameraOffset` only the scroll term); P6 adds `clock`,
  `driftAt`, `driftVelocity`; P7 adds `leanX`, `leanY` and `LEAN`. If D3 says skip the lean, the lean fields and `LEAN`
  never exist.
- The drift clock integrates the rate with the rate at the end of each step. While the rate eases (3 s after the reveal,
  4 s around the idle fade) this differs between 20 and 60 fps by at most a few hundredths of a second of drift clock,
  under 0.2 px at the brightest star: invisible, and positions still never jump because the rate, not the position, is
  what changes (C5).
- R1's sketch returned new objects from `springStep`; this version mutates in place (R3), so a frame allocates nothing.

#### The worker side (P2, P6)

```ts
// src/components/sky/sky.worker.ts
let camera = createCamera(0)
/** The camera's offset for the frame being drawn (reused). */
const offset: Vec = { x: 0, y: 0 }
/** Whether the camera moved on the last step (drift running or a spring settling): it then needs motion frames. */
let cameraMoving = false
/** Worker-clock seconds when motion last turned full after a pause or reduced motion: the drift eases in from there. (P6) */
let fullSince: number | null = null

/** Share of ambient motion (twinkle, drift) the moment allows: the visitor's presence under full motion, else 0. (P4) */
function ambient(now: number): number {
	return motion === 'full' ? presenceLevel(presence, now) : 0
}

/**
 * Whether the drift runs, or is easing in or out: full motion, revealed, affordable, the visitor present and a scene that
 * drifts. The frame demand uses this, not the rate, because the rate eases in from exactly 0. (P6)
 */
function driftWanted(now: number, scene: SceneLevels): boolean {
	return motion === 'full' && revealAt !== null && driftAffordable() && !isAway(presence, now) && scene.drift > 0
}

/** The drift clock rate the scene asks for before presence and the ease-in: what the frame clock paces for. (P6) */
function driftTarget(scene: SceneLevels): number {
	return scene.drift * (width <= NARROW_MAX_WIDTH ? DRIFT.narrowRate : 1)
}

/** Drift clock rate now: the scene's target × presence × the ease-in after the reveal or a resume. (P6) */
function driftRate(now: number, scene: SceneLevels): number {
	if (revealAt === null || !driftWanted(now, scene)) return 0
	const easeFrom = Math.max(revealAt, fullSince ?? revealAt)
	return driftTarget(scene) * ambient(now) * smoothstep(0, DRIFT.ease, now / 1000 - easeFrom)
}

/** Steps the camera under full motion while visible; otherwise it stays frozen where it is (C6). */
function updateCamera(now: number, scene: SceneLevels): void {
	// P2 passes a constant zero lean and drift 0; P6 adds driftRate, P7 leanTarget (the pointer × scene.lean)
	cameraMoving =
		motion === 'full' &&
		visible &&
		stepCamera(camera, { time: now / 1000, scroll: parallaxScroll, lean: leanTarget(scene), drift: driftRate(now, scene), viewportHeight: height })
}
```

- `init`: `camera = createCamera(message.scrollY)` next to `scrollY = parallaxScroll = message.scrollY`
  (`sky.worker.ts:420`).
- `motion` handler (ours, `:437`): on a change away from full, `freezeCamera(camera)` (and today's `meteor = null`); on a
  change back to full, `fullSince = now / 1000` next to today's `holdMeteors(now)`.
- `visible` handler (ours, `:444`): `freezeCamera(camera)` when hidden.
- The camera reads `parallaxScroll`, which the veil-owned scroll handler keeps frozen under reduced motion
  (`sky.worker.ts:465`). So back at full motion, stars stay put until the next scroll, then glide (or snap past one
  viewport): the same moment today's sky jumps.
- `frameAt` (`:246`): `camera: cameraOffset(camera, offset)` replaces `parallaxScroll` in the `SkyFrame`, and
  `snap: motion !== 'full'`.

#### Reconciling R1's drift with R4's heading rules

R4 asked for a steady heading within ±15° of horizontal that turns at most 15°/min and never reverses (AC-4), and for no
return within 50 px of an earlier offset (AC-7). The settled epicycles turn the heading about 2°/s and come back near
their start every 180 s, because any bounded path must. The brief settles on the epicycles, and they meet what R4's
rules were for: no stops (speed at least 0.58 v₀), no abrupt turns (at most 4.3°/s), no sway in the sickness band (all
frequencies under 0.014 Hz), no rhythm to notice (near-returns differ by 21 to 38 px and the speed beats on 69 s and
127 s). R4's other worry, induced motion of the headline when the drift runs vertically, is met by keeping the majority
still (the far band moves at most 1.25 px/s) and is checked by AC-17. So section 9 amends AC-4 and AC-7 instead of
changing the drift, and section 12 lists the one-constant fallback if AC-17 fails.

### 6.2 Pacing and the frame clock (P3)

#### Policy and mechanism

The frame clock has two concerns with different owners:

- **Policy** (pure, in `src/lib/sky/pacing.ts`): what each part of the sky needs (`FrameDemand`), the strictest of them,
  the frames per second motion needs, the whole-number divisor with its hysteresis, the refresh estimate, and whether a
  wake-up draws. All of it runs in the scratch harness.
- **Mechanism** (in `sky.worker.ts`): the `requestAnimationFrame` and `setTimeout` handles. They stay worker variables
  named `rafId` and `timerId` because the veil-owned scroll handler reads them (`sky.worker.ts:469`:
  `if (!rafId && timerId === undefined) needsDraw = true`). `rafId` becomes `number | null` with `null` as the "nothing
  pending" sentinel (MDN: request IDs may wrap to 0); `!rafId` still means "no frame pending", so the handler keeps
  working without an edit.

#### Config

```ts
// src/lib/sky/config.ts
/**
 * Frame pacing for moving stars (FRAME keeps the timers for fades and twinkle). A moving star should step at most `stepPx`
 * device px per drawn frame (two quarter-pixel phases, under a third of the smallest star's width) and never draw below
 * `minFps`. Motion draws on animation frames divided by a whole number, so every drawn frame stays up for the same number
 * of display refreshes; a lower need must last `slowDownAfter` seconds before the clock slows down. Drift draws at most
 * `narrowMaxFps` on narrow screens and `slowMaxFps` after the first adaptive step; a software-rasterized canvas may spend at
 * most `softwareShare` of a core on drift and keeps a still sky below `minFps`. The refresh interval is the median of the
 * last `refreshSamples` frame intervals; a median within `unalignedTolerance` ms of `unalignedInterval` is WebKit's fixed
 * 15 ms worker clock, not the display, so every frame draws there. A requested animation frame that hasn't come
 * `watchdogMs` after the request (while visible) switches frames to a 60 Hz timer.
 */
export const PACING = {
	stepPx: 0.5,
	minFps: 20,
	slowDownAfter: 0.5,
	narrowMaxFps: 30,
	slowMaxFps: 30,
	softwareShare: 0.08,
	refreshSamples: 16,
	unalignedInterval: 15,
	unalignedTolerance: 0.4,
	watchdogMs: 250,
} as const
```

#### `src/lib/sky/pacing.ts` (new)

```ts
import { FRAME, PACING } from './config'

/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Drawn frames per second: 0 for none, Infinity for every display refresh. */
	fps: number
	/** Something moves: frames must be animation frames, so each one lands on a display refresh. */
	vsync: boolean
	/** At most this many frames per second while this is the strictest demand (drift caps); Infinity for none. */
	cap: number
}

/** Nothing to draw. */
export const NO_FRAMES: FrameDemand = { fps: 0, vsync: false, cap: Infinity }

/** Every display refresh: a moving transient, scrolling under full motion. */
export const EVERY_FRAME: FrameDemand = { fps: Infinity, vsync: true, cap: Infinity }

/** Slow changes that don't move (the dusk, a lingering train, the quiet ease, scrolling under reduced motion). */
export const FADE_FRAMES: FrameDemand = { fps: FRAME.fadeFps, vsync: false, cap: Infinity }

/** The strictest of several demands: the most frames (with that demand's cap), on animation frames if any of them moves. */
export function combineDemands(...demands: FrameDemand[]): FrameDemand {
	let strictest = NO_FRAMES
	let vsync = false
	for (const demand of demands) {
		if (demand.fps > strictest.fps) strictest = demand
		if (demand.vsync && demand.fps > 0) vsync = true
	}
	return { fps: strictest.fps, vsync, cap: strictest.cap }
}

/**
 * Frames per second for something moving `devicePxPerSecond`: at most PACING.stepPx per frame, and never under
 * PACING.minFps, even at speed 0, since a motion that has just started (or is easing in from 0) still needs frames (F6).
 */
export function motionFps(devicePxPerSecond: number): number {
	return Math.max(PACING.minFps, devicePxPerSecond / PACING.stepPx)
}

/** Draw on every k-th refresh: the largest k that still gives `fps`, and at least the k that keeps under `cap`. */
export function refreshDivisor(refreshHz: number, fps: number, cap: number): number {
	return Math.max(Math.floor(refreshHz / fps), Math.ceil(refreshHz / cap), 1)
}

/** The divisor in use, and since when (worker-clock ms) a larger one has been enough. */
export interface Divisor {
	k: number
	slowerSince: number | null
}

/** Moves the divisor toward `wanted`: down at once (more frames), up only after PACING.slowDownAfter s of lower need. */
export function stepDivisor(divisor: Divisor, wanted: number, now: number): number {
	if (wanted <= divisor.k) {
		divisor.k = wanted
		divisor.slowerSince = null
	} else if (divisor.slowerSince === null) divisor.slowerSince = now
	else if (now - divisor.slowerSince >= PACING.slowDownAfter * 1000) {
		divisor.k = wanted
		divisor.slowerSince = null
	}
	return divisor.k
}

/**
 * Whether a wake-up at `now` (ms) draws for `demand`: an animation frame once k - 1/2 refreshes have passed since the last
 * drawn frame, a timer once its interval has (4 ms early is fine: timers fire a little early or late).
 */
export function frameDue(demand: FrameDemand, now: number, lastDrawAt: number, k: number, interval: number): boolean {
	if (demand.fps <= 0) return false
	if (demand.vsync) return now - lastDrawAt >= (k - 0.5) * interval
	return now - lastDrawAt >= 1000 / demand.fps - 4
}

/** The display's refresh interval, measured from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes: 1000 / 60 until measured. */
	readonly interval: number
	/** The frames come from a fixed timer, not the display (WebKit's 15 ms worker clock): every frame draws. */
	readonly unaligned: boolean
	/** Adds an animation-frame timestamp (ms). */
	sample(timestamp: number): void
	/** Forgets the last timestamp after a pause (hidden, asleep), so the gap isn't taken for a refresh. */
	pause(): void
}

/** The median of a short list (never empty where it is called). */
function median(values: readonly number[]): number {
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[sorted.length >> 1] ?? 0
}

/**
 * A refresh estimate: the median of the last PACING.refreshSamples intervals. Intervals over 1.5 times the estimate are
 * dropped frames and ignored, unless PACING.refreshSamples of them come in a row: then the display really is slower
 * (Energy Saver's 30 Hz, say) and their median becomes the estimate.
 */
export function createRefreshEstimate(): RefreshEstimate {
	const accepted: number[] = []
	const rejected: number[] = []
	let last: number | null = null
	let interval = 1000 / 60
	const remember = (list: number[], delta: number) => {
		list.push(delta)
		if (list.length > PACING.refreshSamples) list.shift()
	}
	return {
		get interval() {
			return interval
		},
		get unaligned() {
			return Math.abs(interval - PACING.unalignedInterval) <= PACING.unalignedTolerance
		},
		sample(timestamp) {
			const delta = last === null ? 0 : timestamp - last
			last = timestamp
			if (delta <= 0) return
			if (delta < interval * 1.5) {
				rejected.length = 0
				remember(accepted, delta)
				interval = median(accepted)
				return
			}
			// A run of long intervals is a slower display, not dropped frames
			remember(rejected, delta)
			if (rejected.length < PACING.refreshSamples) return
			accepted.length = 0
			accepted.push(...rejected)
			rejected.length = 0
			interval = median(accepted)
		},
		pause() {
			last = null
		},
	}
}
```

Tested for this draft: a 60 Hz stream with a dropped frame every 13 settles at 16.7 ms; it follows a switch to 30 Hz
after exactly 16 samples; a 15.0 to 15.1 ms stream reads as unaligned; 120 Hz gives 8.33 ms.

#### The worker's demand (replaces `frameMode`, `sky.worker.ts:116` to `:133`)

```ts
/** The strictest demand of every part of the sky right now; NO_FRAMES while nothing can draw. */
function frameDemand(now: number, scene: SceneLevels): FrameDemand {
	if (!ctx || !visible || motion === 'off' || exitAt === null) return NO_FRAMES
	const t = now / 1000
	const scrolling = now - lastScrollAt < FRAME.scrollSettleMs
	return combineDemands(
		// P8 replaces this line with transientDemand(schedule, t)
		meteor ? (meteorMoving(meteor, t) ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		scrolling ? (motion === 'full' ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		// Decided by where the drift is heading, not its rate: waking from idle it eases in from exactly 0 (F6)
		cameraMoving || driftWanted(now, scene) ? cameraDemand(now, scene) : NO_FRAMES,
		!emergenceDone(t - exitAt) || (layoutAt !== null && t - layoutAt < QUIET.ease) ? FADE_FRAMES : NO_FRAMES,
		twinkleDemand(now, scene)
	)
}

/**
 * Display-aligned frames while the camera moves or the drift is wanted: enough for the nearest stars to step at most
 * PACING.stepPx device px at the speed the drift is heading to (not its eased rate, which starts at 0), never fewer than
 * PACING.minFps. Drift caps apply only while the drift is wanted, so a scroll glide is never cut to a crawl.
 */
function cameraDemand(now: number, scene: SceneLevels): FrameDemand {
	const wanted = driftWanted(now, scene)
	const speed = DEPTH.maxNearness * cameraSpeed(camera, wanted ? driftTarget(scene) : 0) * dpr
	return { fps: motionFps(speed), vsync: true, cap: wanted ? driftCap() : Infinity }
}

/** Most drift frames per second here: 30 on narrow screens and after the first adaptive step; a CPU budget on software raster. */
function driftCap(): number {
	const cap = width <= NARROW_MAX_WIDTH ? PACING.narrowMaxFps : quality > 0 ? PACING.slowMaxFps : Infinity
	return Math.min(cap, softwareFps)
}

/** Twinkle's timer while it may change: decided by where the twinkle is heading, not its level, as today (sky.worker.ts:124). */
function twinkleDemand(now: number, scene: SceneLevels): FrameDemand {
	if (motion !== 'full' || isAway(presence, now) || scene.twinkle <= 0) return NO_FRAMES
	return { fps: quality > 0 ? FRAME.slowTwinkleFps : FRAME.twinkleFps, vsync: false, cap: Infinity }
}
```

(Until P4 lands, `isAway(presence, now)` is today's `isIdle(now)`.)

`frameDemand` reproduces today's `frameMode` exactly for everything that existed before (active means `EVERY_FRAME`,
fade means `FADE_FRAMES`, twinkle means a 15 or 10 fps timer), and adds the camera. `softwareFps` is
`Math.floor(PACING.softwareShare * 1000 / rasterMs)` when `probeRaster` (`:309`) found a software canvas, else
`Infinity`; `probeRaster` keeps the measured milliseconds, scaled by 1 / dpr² after the second quality step.
`driftAffordable()` is `softwareFps >= PACING.minFps`: a 1440 × 900 software canvas at CSS resolution (3.3 to 3.9 ms a
frame, R3) affords 20 to 24 fps and drifts; a 4K software canvas (29 ms) gets 2 and keeps a still sky, as today.

#### The worker's mechanism (replaces `schedule`, `onTimer`, `onFrame`, `tick`, `cancelFrames`)

- `requestFrame()`: if `rafWorks`, `rafId = scope.requestAnimationFrame(onFrame)` plus a watchdog
  `setTimeout(onStalled, PACING.watchdogMs)`; otherwise `timerId = setTimeout(() => onFrame(performance.now()), 1000 / 60)`.
  `rafWorks` starts as `typeof scope.requestAnimationFrame === 'function'` (in `SkyWorkerScope` both rAF members become
  optional). `onStalled` cancels the request, sets `rafWorks = false` and requests again: Chrome returns id 0 and never
  calls back when its frame provider is invalid (R3 §2.1).
- `schedule(now)`: as today (`:152`), except it computes `frameDemand` and then: a vsync demand requests a frame; fps 0
  sleeps (with today's one timer for `needsDraw` or the next due shooting star); otherwise a timer at
  `lastDrawAt + 1000 / demand.fps`.
- `tick(now, fromFrame)`: `if (fromFrame) refresh.sample(now)`, then the shooting star, `settleQuiet`, `updateCamera`,
  then the divisor `k = demand.vsync ? stepDivisor(divisor, refresh.unaligned ? 1 : refreshDivisor(1000 / refresh.interval, demand.fps, demand.cap), now) : 1`,
  then `if (needsDraw || frameDue(demand, now, lastDrawAt, k, refresh.interval)) draw(now)`, then `schedule(now)`.
- `cancelFrames()`: also clears the watchdog and calls `refresh.pause()`.

#### What it gives (v₀ = 3, the brightest star, q = 1.6)

| Scene | DPR | Need (fps) | 60 Hz | 120 Hz | 144 Hz | Step (device px) |
|---|---|---|---|---|---|---|
| Desktop hero | 1 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | 0.33 to 0.34 |
| Desktop hero | 1.5 | 20.4 | k = 2, 30 fps | k = 5, 24 fps | k = 7, 20.6 fps | 0.34 to 0.50 |
| Desktop hero | 2 | 27.3 | k = 2, 30 fps | k = 4, 30 fps | k = 5, 28.8 fps | 0.45 to 0.47 |
| Desktop reading (0.35) | 2 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | 0.23 to 0.24 |
| Narrow hero (0.6), cap 30 | 2 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | 0.40 to 0.41 |

These are the frames at the drift's top speed (1.42 v₀); at its typical speed a DPR-2 laptop needs 19.2 fps, so the
clock settles at 20 fps there and steps up to 30 only around the speed peaks. With v₀ = 4 a DPR-2 laptop needs 36 fps,
which on 60 Hz means every frame (D6).

#### Before and after

| | Today | After P3 |
|---|---|---|
| Moving content | rAF every refresh (meteor, scroll) | the same, plus divided rAF for the camera |
| Fades, twinkle | 30 and 15 fps timers | unchanged (nothing moves, so no judder) |
| Missing or stalled worker rAF | throws, or freezes silently on Chrome's id 0 | feature-detected; a 60 Hz timer after 250 ms |
| WebKit's 15 ms worker clock | treated as vsync | detected, every frame draws (relay: P13) |
| Hidden tab | frames cancelled | the same, and the refresh estimate pauses |

### 6.3 Sub-pixel phase sprites (P1)

```ts
// src/lib/sky/config.ts
/** Sub-pixel positions per device pixel and axis in the star atlas: 4, like Skia's glyph cache, so a star lands within 1/8 px. */
export const STAR_PHASES = 4
```

`src/components/sky/skyAssets.ts`:

- `gaussianAt` (`:45`) becomes a separable `profile(size, sigma, phase): Float64Array`: pixel i's 4-sample box
  integral of the Gaussian centred `phase` px right of the middle pixel. Today's 16-sample 2D value is exactly the
  product of two such profiles (the exponential of a sum is a product), so phase (0, 0) reproduces today's sprites; R3
  measured a largest difference of 1.1 × 10⁻¹⁶ and byte-identical sprites (A1).
- `paintSprite` (`:63`) paints `(core profile x · core profile y + haloPeak · halo profile x · halo profile y) / peak` for
  phases (i/4, j/4), where `peak` is the phase-0 centre value, so every phase carries the same total light (R3: flux 3.588
  at every phase for σ 0.7).
- `buildStarAtlas` (`:81`) lays each (tint, shape) out as a 4 × 4 block of its phases. The meteor row keeps no phases
  (the head is a fast glow, drawn fractionally as today).
- New `starSpriteIndex(tint, shape, phaseX, phaseY) = ((tint * STAR_SHAPES.length + shape) * STAR_PHASES + phaseY) * STAR_PHASES + phaseX`;
  `StarAtlas.stars` documents that index instead of `tint * STAR_SHAPES.length + shape`.
- Build time: about 0.6 to 1.5 ms for all 16 phases with the separable painter (today's painter would need 53 to 316 ms).
- Size: about 0.7 MB at DPR 1 and 1.8 to 1.9 MB at DPR 2 with this simple block layout (R3: 0.67 and 1.77 MB with tighter
  packing), against 48 KB and 127 KB today.

`src/components/sky/renderSky.ts` gets one placement function for every point of light (stars now, satellites in P11):

```ts
/** Top-left device pixel where the sprite placePoint picked goes (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point of light centred at (px, py) device px, with its top-left whole pixel in `corner`. A moving point
 * uses the sprite pre-rendered at its nearest quarter-pixel phase, so it glides without blurring or pulsing; `snap`
 * rounds to whole pixels (reduced motion, paused), which draws exactly today's points.
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

Why not fractional `drawImage` (R3 §3.2): browsers may filter however they like, and bilinear filtering spreads a
σ = 0.7 px star so its peak falls to 0.504 at phase (0.5, 0.5) and its width grows 24%, so a drifting star pulses at
v · dpr Hz (6 Hz for a far star at DPR 2). Phase sprites keep each star's light and width; the perceived peak stays at
0.90 to 0.99 on DPR 2 screens and the position error at most 1/8 px. At DPR 1, where the eye resolves pixels, a 20% swing
of the brightest pixel is inherent to the grid (section 12, risk 7).

`SkyFrame.snap` is `motion !== 'full'`. In P1 it is `true` everywhere, so P1 draws exactly today's pixels; from P2 it
follows the motion mode. While the sky sleeps under full motion, stars keep their phases, so nothing jumps when the drift
stops or resumes.

### 6.4 The quiet index (P1)

Today every star calls `easedQuietFactor` over every quiet zone (`renderSky.ts:120`), and mid-ease it walks both zone
sets: 1.3 to 1.7 ms a frame at 1430 stars and 64 rects (R3 §4.1), 8 to 10% of a core at 60 fps. Stars now move every
frame, so this cost runs continuously.

```ts
// src/lib/sky/quietIndex.ts (new)
import { QUIET } from './config'
import type { SkyRect } from './protocol'
import { easedQuietFactor, sameRects, type QuietBlend, type QuietKeeps } from './scene'

/**
 * Farthest from a padded quiet rect that the quiet math looks (CSS px): quietAt skips zones more than QUIET.feather away
 * on either axis (scene.ts:76) and inkAt only reaches inside the padded rect (scene.ts:89). If the veil session exports its
 * own reach from scene.ts, use that instead (interface request I4).
 */
export const QUIET_REACH = QUIET.feather

/** Side of the square screen tiles the zones are bucketed into (CSS px). */
const TILE = 64

/**
 * The quiet zones bucketed by screen tile, so a star looks only at the zones that can reach it. Exact: each tile keeps,
 * in their original order, the zones whose box grown by QUIET_REACH touches it, and easedQuietFactor only takes maxima
 * over zones within that reach, so the factor equals easedQuietFactor over all zones bit for bit (Q1).
 */
export interface QuietIndex {
	/** No zones on screen: drawLayer skips the lookup, as it does today. */
	readonly empty: boolean
	/** Follows the zones on screen; rebuilds the buckets only when a zone list or the grid changed (scroll, layout, an ease starting or ending). */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps) for a point within `margin` of the viewport, reading only its tile's zones. */
	factor(x: number, y: number, keeps: QuietKeeps): number
}

/** The zones whose box grown by QUIET_REACH touches the tile [x0, x1] × [y0, y1], in their original order. */
function zonesNear(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): SkyRect[] {
	return zones.filter(
		(zone) =>
			zone.x - QUIET_REACH <= x1 &&
			zone.x + zone.width + QUIET_REACH >= x0 &&
			zone.y - QUIET_REACH <= y1 &&
			zone.y + zone.height + QUIET_REACH >= y0
	)
}

/** An empty index; update() fills it. */
export function createQuietIndex(): QuietIndex {
	let from: readonly SkyRect[] = []
	let to: readonly SkyRect[] = []
	let tiles: QuietBlend[] = []
	let columns = 0
	let rows = 0
	let origin = 0
	let gridWidth = -1
	let gridHeight = -1
	return {
		get empty() {
			return from.length === 0 && to.length === 0
		},
		update(blend, width, height, margin) {
			const regrid = width !== gridWidth || height !== gridHeight || -margin !== origin
			if (regrid || !sameRects(blend.from, from) || !sameRects(blend.to, to)) {
				from = blend.from
				to = blend.to
				gridWidth = width
				gridHeight = height
				origin = -margin
				columns = Math.max(1, Math.ceil((width + 2 * margin) / TILE))
				rows = Math.max(1, Math.ceil((height + 2 * margin) / TILE))
				tiles = []
				for (let row = 0; row < rows; row++) {
					for (let column = 0; column < columns; column++) {
						const x0 = origin + column * TILE
						const y0 = origin + row * TILE
						tiles.push({ from: zonesNear(from, x0, y0, x0 + TILE, y0 + TILE), to: zonesNear(to, x0, y0, x0 + TILE, y0 + TILE), level: blend.level })
					}
				}
			}
			for (const tile of tiles) tile.level = blend.level
		},
		factor(x, y, keeps) {
			// Drawn stars lie on the grid; the clamp only guards points outside it
			const column = Math.min(columns - 1, Math.max(0, Math.floor((x - origin) / TILE)))
			const row = Math.min(rows - 1, Math.max(0, Math.floor((y - origin) / TILE)))
			const tile = tiles[row * columns + column]
			return tile ? easedQuietFactor(tile, x, y, keeps) : 1
		},
	}
}
```

Tested for this draft: over 60 random layouts (390 × 844, 1440 × 900 and 2560 × 1440; 31 and 64 rects; settled and
mid-ease; three keep pairs; points exactly `QUIET.feather` beyond an edge), 722,355 lookups differ from
`easedQuietFactor` over all zones by exactly 0.

- **Why it is exact.** `quietAt` skips a zone when the point is more than `QUIET.feather` from it on either axis, and at
  exactly `QUIET.feather` the zone contributes 1 - smoothstep(0, 40, d) = 0 because d ≥ 40. `inkAt` contributes only
  inside the padded rect. So zones whose grown box doesn't touch a tile add nothing anywhere in it. Each function takes
  a maximum over the zones it doesn't skip, and a maximum over a subsequence that contains every contributing zone, in
  the same order, is the same number; `quietAt`'s early exit at 1 hits the same zone first. Calling `easedQuietFactor` on a
  per-tile `QuietBlend { from, to, level }` then blends the same two values by the same formula. R3 measured a largest
  difference of 0 over 4 viewports, 2 rect counts, 2 ease states and 40 camera offsets.
- **Rebuilds.** Zones are in screen space, so drift frames never rebuild: only a scroll (zones move), a layout, or an ease
  starting or ending does. `update` compares the incoming lists with the last ones by content (`sameRects`), because the
  veil's `quietBlend` builds new arrays every call (`sky.worker.ts:227`); 64 comparisons cost about 0.5 µs. A rebuild
  costs 0.01 to 0.23 ms. `level` is copied into every tile's blend each call (a few hundred tiles).
- **Grid.** Tiles cover the viewport plus `margin` on every side; `drawSky` passes `EDGE` (24), the band in which stars
  beyond an edge are still drawn, so every drawn star lies on the grid.
- **Ownership.** It wraps the veil session's `easedQuietFactor`, so their math stays the single source; whatever they
  change inside `quietFactor`, `inkAt` or `easedQuietFactor` stays exact as long as no zone reaches past `QUIET_REACH`.
  Meteors keep calling `easedQuietFactor` over all zones (Q2).
- **Cost.** Worst case at 1430 stars: 1.29 to 1.72 ms becomes 0.14 to 0.32 ms (R3 §4.1).
- **DRY.** `sameRects` moves from `sky.worker.ts:82` to `scene.ts` (next to `screenQuietZones`), exported; the worker's
  layout handler keeps calling `sameRects(...)` unchanged, only its import moves.

`drawSky` calls `frame.quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)` once per frame, before the
layers; `drawLayer` uses `if (!frame.quietIndex.empty) alpha *= frame.quietIndex.factor(x, y, config)` in place of
`renderSky.ts:107` and `:120`. The worker creates the index once and passes it in the `SkyFrame`.

### 6.5 The star-field cache, and why nothing wraps (P1)

```ts
// src/components/sky/renderSky.ts
/** Lazily generated cells of each layer's infinite plane, evicted by the frame they were last used in. */
export interface StarField {
	/** The stars of one cell; a cell beyond the key range (±32768 cells) holds none, so keys never collide (SF2). */
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Starts a frame: cells looked up from now on count as in use. */
	beginFrame(): void
	/** Drops the cells this frame didn't use once the cache holds more than CELL_CACHE_SLACK times the cells in use (SF1). */
	trim(): void
}

/** How many times the cells in use the cache may hold before it drops the unused ones. */
const CELL_CACHE_SLACK = 2
```

Each cache entry records the frame it was last used in. `trim()` deletes only entries not used this frame, so the cells
on screen are never regenerated in one burst: today's `cells.clear()` (`renderSky.ts:48`) regenerates every visible cell
in one frame, a 0.25 to 1.2 ms spike (R3 §5.3). `drawLayer` stops returning a cell count; `drawSky` calls `beginFrame()`
before the layers and `trim()` after.

**R1's bounded drift against R3's wrapping accumulators.** R3 designed per-layer drift accumulators (offset += velocity ×
dt) that grow without bound, so it wrapped them and the cell lookups at 2^16 cells to keep the numeric cell key
(`renderSky.ts:39`) valid. The settled drift is different: a closed-form path of a clock, E(τ) - E(0), three circles. A
circle can't carry anything farther than its diameter, so the drift stays within 2 (R₁ + R₂ + R₃) = 70.8 s × v₀ of its
start whatever the phases (212 CSS px at v₀ = 3; the exact supremum with the chosen phases is 63.6 s × v₀ = 191 px). The
scroll term is at most 0.07 × 1.6 = 0.112 of the page's scroll range, and the lean at most 12 × √2 × 1.6 = 27 px. On a
20,000 px page with v₀ = 4 the farthest any star sits from its catalog place is about 2,700 CSS px; the key covers
±8,388,608 px and would break only on a page about 75 million px tall. The only unbounded number is the drift clock, a
time: after 30 days of continuous drift its rounding moves a star by 2.5 × 10⁻⁹ px. So:

- no `FIELD_PERIOD`, no `wrapCell`, no accumulators to wrap;
- what remains of R3's guard is SF2: `cell()` returns no stars outside ±32768 cells instead of computing a colliding key.
  The check belongs to the `StarField` because the key encoding is its own invariant, and it costs one comparison per
  cell lookup (100 to 500 a frame);
- `EDGE` stays 24: the largest halo is at most 9 CSS px (3σ of the 2.8 px halo), and culling is per star and
  continuous, so stars slide in from beyond the edge without popping (R3 §5.4). Its comment gains that bound.

Bounded drift also bounds the cache: sitting in the hero, the union of cells the drift ever visits is about twice the
visible ones, so eviction mostly matters while scrolling, which is when today's clear fires too.

### 6.6 Presence and idle (P4)

```ts
// src/lib/sky/presence.ts (new)
import { FRAME } from './config'
import { smoothstep } from './scene'

/** Whether the visitor seems to be here: their last input and their last return from an idle stretch (worker-clock ms). */
export interface Presence {
	lastInputAt: number
	wokeAt: number
}

/** A visitor who has just arrived. */
export function createPresence(now: number): Presence {
	return { lastInputAt: now, wokeAt: -Infinity }
}

/** No input (scroll, pointer, keys, focus, a return to the tab) for FRAME.idleSleepMs. */
export function isAway(presence: Presence, now: number): boolean {
	return now - presence.lastInputAt > FRAME.idleSleepMs
}

/**
 * Records input. Back during the idle fade-out, ambient motion eases back in from where it was; after a full idle stretch,
 * from nothing. Returns true when the visitor was away, so the worker holds the next transient back.
 */
export function notePresence(presence: Presence, now: number): boolean {
	const since = now - presence.lastInputAt
	if (since > FRAME.idleSleepMs - FRAME.idleFadeMs) presence.wokeAt = now - Math.max(0, FRAME.idleSleepMs - since)
	const wasAway = isAway(presence, now)
	presence.lastInputAt = now
	return wasAway
}

/** 0 to 1: the share of ambient motion (twinkle, drift) presence allows, easing out before the idle sleep and in after a return (P1). */
export function presenceLevel(presence: Presence, now: number): number {
	const fadingOut = smoothstep(FRAME.idleSleepMs - FRAME.idleFadeMs, FRAME.idleSleepMs, now - presence.lastInputAt)
	return (1 - fadingOut) * smoothstep(0, FRAME.idleFadeMs, now - presence.wokeAt)
}
```

These are today's `isIdle`, `idleTwinkle` and `noteInput` (`sky.worker.ts:86` to `:114`) moved into the model with the
same arithmetic, so twinkle behaves bit for bit as before. The worker keeps a function named `noteInput(now)` (the
veil-owned scroll handler calls it, `:467`):

```ts
/** Records input of any kind; back from an idle stretch, no shooting star straight away. */
function noteInput(now: number): void {
	if (notePresence(presence, now)) holdMeteors(now)
}
```

`twinkleLevel` becomes `sceneAt(…).twinkle * ambient(now)`, the drift rate uses `ambient(now)` too (6.1), and
`meteorsAllowed` uses `!isAway(presence, now)`: one presence gate for all ambient motion (R3 §2.5).

The main thread reports input that isn't scrolling:

```ts
// src/components/sky/mountSky.ts
/** Presence pings for the sky's idle clock, at most this often (ms): someone moving the pointer or typing is still here. */
const ACTIVITY_INTERVAL_MS = 1000

/** Input that shows someone is still here without scrolling. */
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const

// Inside mountSky, with the other listeners (mountSky.ts:243 to :247):
let lastActivity = -Infinity
const noteActivity = () => {
	const now = performance.now()
	if (now - lastActivity < ACTIVITY_INTERVAL_MS) return
	lastActivity = now
	post({ type: 'activity' })
}
for (const type of ACTIVITY_EVENTS) window.addEventListener(type, noteActivity, { passive: true, signal })
```

The worker handles `activity` with `noteInput(now)` and the usual `schedule(now)`. Before `init` it only updates the
presence clock. `FRAME`'s comment changes from "with no scroll for this long" to "with no input (scroll, pointer, keys,
focus) for this long the twinkle and drift ease out, transients pause and the worker sleeps until the next input".

After 90 s without input: the drift rate eases to 0 over the last 4 s, the camera keeps its place, no part of the sky
demands frames, and the worker sleeps (the one remaining timer is for a due transient, which isn't allowed while away).
Any input eases everything back over 4 s from the same place (AC-33).

### 6.7 Scene integration (P6, P7, P8)

```ts
// src/lib/sky/config.ts
/**
 * Scroll narrative: the full sky in the hero, a dimmer and calmer sky while reading (no twinkle, the drift at about a
 * third), and a bookend near the end of the page. Levels blend continuously with scroll, so the narrative needs no clock
 * of its own. Star levels are per layer: while reading the brighter layers dim most, so no star behind body copy reads as
 * punctuation. `drift` scales the drift clock's rate; `lean` scales the pointer lean, which only the hero has.
 */
export const SCENE = {
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1, lean: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35, lean: 0 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8, lean: 0 },
	// …heroFadeFrom, heroFadeTo, endFadeFrom, endFadeTo, heroMeteorMaxScroll unchanged…
} as const
```

- `SceneLevels` (`scene.ts:11`) gains `drift: number` ("share of the drift clock's rate") in P6 and `lean: number`
  ("share of the pointer lean: hero only") in P7.
- `sceneAt`'s `mix` (`scene.ts:30`) widens its key to `'haze' | 'twinkle' | 'drift' | 'lean'`: one mixer for every scalar
  level (DRY), and "hero only" for the lean is data, not a code path.
- P8 renames `SceneLevels.meteors` to `launches` ("transients launch only over the hero"), because it then gates every
  kind; `SCENE.heroMeteorMaxScroll` keeps its value (0.4) and becomes `heroLaunchMaxScroll`.
- The dusk is unchanged: the drift clock stays at 0 until the reveal and then eases in over `DRIFT.ease`, so the sky
  comes out, then comes alive.

### 6.8 The pause control (P5)

#### Where the state lives

The pause choice is read by two unrelated client components (the button in the navbar, the sky's controller under
`IntroGate`'s backdrop), and by `mountSky`, which isn't React. So it is a small external store, not React context:

```ts
// src/components/sky/skyPause.ts (new, main thread; no React)
import { REDUCED_MOTION_QUERY } from '@/lib/utils'

/** Whether the home sky moves: the visitor's choice, or by default their reduced-motion setting. */
export type SkyPlayback = 'playing' | 'paused'

/** localStorage key holding '1' while the visitor has paused the sky (WCAG 2.2.2's pause mechanism, kept per browser). */
const PAUSED_KEY = 'sky-paused'

const listeners = new Set<() => void>()
/** The stored choice, read once; null until first read. */
let stored: boolean | null = null
/** Play pressed while the OS asks for reduced motion: honored for this page view only and never stored. */
let playOverride = false
let reducedMotion: MediaQueryList | null = null
let stopWatching: (() => void) | null = null

/** The reduced-motion query, created on first use, never during server rendering. */
function reduced(): MediaQueryList {
	reducedMotion ??= matchMedia(REDUCED_MOTION_QUERY)
	return reducedMotion
}

/** Whether the visitor paused the sky in this browser; blocked or missing storage counts as "no" (PB2). */
function storedPause(): boolean {
	if (stored === null) {
		try {
			stored = localStorage.getItem(PAUSED_KEY) === '1'
		} catch {
			stored = false
		}
	}
	return stored
}

/** The sky's playback now (PB1): paused when the visitor paused it, or under reduced motion unless they pressed Play. */
export function skyPlayback(): SkyPlayback {
	return storedPause() || (reduced().matches && !playOverride) ? 'paused' : 'playing'
}

/** Pauses or resumes the sky. A pause is remembered in this browser; Play forgets it. */
export function setSkyPaused(paused: boolean): void {
	stored = paused
	playOverride = !paused && reduced().matches
	try {
		if (paused) localStorage.setItem(PAUSED_KEY, '1')
		else localStorage.removeItem(PAUSED_KEY)
	} catch {
		// Storage is blocked: the choice lasts for this page view
	}
	for (const listener of listeners) listener()
}

/** Calls `listener` whenever the playback may have changed (the button, another tab, the OS setting); returns the unsubscribe. */
export function subscribeSkyPlayback(listener: () => void): () => void {
	listeners.add(listener)
	if (!stopWatching) {
		const watch = new AbortController()
		const notify = () => {
			for (const each of listeners) each()
		}
		// Reduced motion turned on or off: an earlier Play no longer applies
		reduced().addEventListener(
			'change',
			() => {
				playOverride = false
				notify()
			},
			{ signal: watch.signal }
		)
		// Paused or resumed in another tab (a null key means that tab cleared all storage)
		window.addEventListener(
			'storage',
			(event) => {
				if (event.key !== PAUSED_KEY && event.key !== null) return
				stored = null
				notify()
			},
			{ signal: watch.signal }
		)
		stopWatching = () => watch.abort()
	}
	return () => {
		listeners.delete(listener)
		if (listeners.size > 0) return
		stopWatching?.()
		stopWatching = null
	}
}
```

Why "Play under reduced motion lasts for the page view": the default respects the OS setting on every visit, and a
stored "playing" can never override a reduced-motion setting turned on later. A stored "paused" is always safe to keep.

#### The button

```tsx
// src/components/sky/SkyPauseToggle.tsx (new)
'use client'

import { useSyncExternalStore } from 'react'
import { PauseSVG, PlaySVG } from '@/components/icons'
import { cn } from '@/lib'
import { setSkyPaused, skyPlayback, subscribeSkyPlayback, type SkyPlayback } from './skyPause'

/** The server and hydration render nothing: the choice lives in this browser. Without JavaScript there is no sky to pause. */
function serverPlayback(): SkyPlayback | null {
	return null
}

interface SkyPauseToggleProps {
	className?: string
}

/**
 * Pauses and resumes all of the home sky's motion (drift, twinkle, parallax, shooting stars): WCAG 2.2.2's mechanism
 * (techniques G4 and G186). A toggle button whose name never changes; aria-pressed carries the state.
 */
export default function SkyPauseToggle({ className }: SkyPauseToggleProps) {
	const playback = useSyncExternalStore<SkyPlayback | null>(subscribeSkyPlayback, skyPlayback, serverPlayback)
	if (!playback) return null
	const paused = playback === 'paused'
	return (
		<button
			type="button"
			aria-pressed={paused}
			title="Pause sky animation"
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex h-[40px] w-[40px] cursor-pointer items-center justify-center rounded-[5px] text-green transition-colors duration-250 hover:bg-green-tint aria-pressed:bg-green-tint forced-colors:hidden',
				className
			)}
		>
			{paused ? <PlaySVG className="h-[20px] w-[20px]" /> : <PauseSVG className="h-[20px] w-[20px]" />}
			<span className="sr-only">Pause sky animation</span>
		</button>
	)
}
```

- **Icons.** `src/components/icons/PauseSVG.tsx` (two bars, `<path d="M9 6v12M15 6v12" />`) and `PlaySVG.tsx` (an outline
  triangle, `<path d="M8 5.5v13l10.5-6.5z" />`) on the shared `Icon` frame (`icons/Icon.tsx`, decorative so
  `aria-hidden`), default exports, re-exported from `icons/index.ts`.
- **The name.** WAI-ARIA APG, Button pattern: "it is critical the label on a toggle does not change when its state
  changes". So the name stays "Pause sky animation" and `aria-pressed` says whether it's on. R4 suggested swapping the
  label between Pause and Play; that would make `aria-pressed` wrong, so this deviates from R4. The glyph shows the
  action (pause while playing, play while paused), the universal media convention, and the pressed tint shows the state.
- **Targets and contrast.** 40 × 40 CSS px, above WCAG 2.5.8's 24 × 24. Green `#64ffda` on navy `#0a192f` is 14.1:1,
  far above 1.4.11's 3:1, and the global `:focus-visible` rule (`globals.css:80`, a 2px dashed green outline) gives the
  focus ring. `forced-colors:hidden`, because forced colors hide the sky (`Background.module.css:27`).
- **Hydration.** `useSyncExternalStore` uses `getServerSnapshot` "only during server rendering and during hydration"
  (react.dev), so the server HTML and the hydrating render agree (both empty), and React re-renders with the stored
  state right after. In this app the visible navbar never hydrates anyway: `IntroGate` remounts its children with a key
  flip when the loader lifts (`IntroGate.tsx:95`), so the button the visitor sees mounts fresh on the client with the
  real state, and the Next.js "flash before hydration" problem (`02-guides/preventing-flash-before-hydration.md`) can't
  arise. `skyPlayback` returns a string, so React's `Object.is` snapshot comparison is stable.
- **`'use client'`.** The file declares it, as the codebase does for every component with hooks or browser state even
  when only a client component imports it (`LoadingLogo.tsx`, imported only by the client `IntroGate`; the schedule
  subcomponents under `SchedulePage`). It also keeps D1's alternatives open: the hero corner or the footer would import it
  from `Introduction.tsx` or `AppFooter.tsx`, both Server Components, where it becomes the entry of its interactive
  subtree. The Next.js docs: "'use client' is used to declare a boundary between the Server and Client module graphs" and
  "add 'use client' at the top of the files that define your interactive components"
  (`01-getting-started/05-server-and-client-components.md:178`, `:188`); browser APIs such as `localStorage` need a Client
  Component (`:26`).
- **React Compiler** is on, so no manual memoization; the store functions are module-level and stable.

#### Placement (D1 default)

```tsx
// src/components/Navbar.tsx, inside <nav> (Navbar.tsx:88): before the burger on phones, last in the row on desktop
<motion.div
	variants={navItemVariants}
	custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}
	initial="hidden"
	animate="visible"
	className="ml-auto mr-[10px] md:order-last md:ml-[15px] md:mr-0"
>
	<SkyPauseToggle />
</motion.div>
```

It joins the navbar's existing entrance stagger (`Navbar.tsx:15` to `:18`), after the Resume button. The exact flex
classes are the implementer's to tune against the burger (`:111`) and `#primary-nav` (`:124`); the requirement is that
the button is visible at every width without opening the mobile menu. While the mobile menu is open, its panel covers
the button; that is fine, the menu is modal.

#### Wiring

```ts
// src/components/sky/mountSky.ts
// motion() (mountSky.ts:149) reads the store; the store owns the reduced-motion query for the sky
const motion = (): SkyMotion => (forcedColors.matches ? 'off' : skyPlayback() === 'paused' ? 'reduced' : 'full')
const stopPlayback = subscribeSkyPlayback(syncMotion)
// destroy(): stopPlayback()
```

`mountSky`'s own `reducedMotion` query and its `change` listener (`:146`, `:245`) go, since the store watches it (one
reader of the setting for the sky, DRY). The worker needs no new message: a pause arrives as `motion: 'reduced'`, the
pipeline today's reduced motion already uses (PB3). In the worker, a change away from full freezes the camera and drops
the shooting star (today's behavior, `sky.worker.ts:441`); from P8 it fades every transient out over
`TRANSIENTS.cancelFade` instead (a frozen streak looks broken, R2 §9.4).

`AGENTS.md` gains one line in P5: "The sky's pause button (`src/components/sky/SkyPauseToggle.tsx`, state in
`skyPause.ts`) is the WCAG 2.2.2 mechanism for the sky; any new continuous sky motion must stop under `motion:
'reduced'`."

### 6.9 The transient system (P8; blocked on the veil commit)

#### Types

```ts
// src/lib/sky/transients.ts (new)
import { METEOR, SATELLITE, TRANSIENTS, type GapLaw } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, planMeteor, type Meteor, type MeteorField, type Point } from './meteors'
import { EVERY_FRAME, FADE_FRAMES, NO_FRAMES, type FrameDemand } from './pacing'
import { between, type Random } from './random'
import { planSatellite, satelliteMoving, type SatellitePass } from './satellites'
import { smoothstep } from './scene'
// P11 adds the satellite kind (and SATELLITE); P8 has the meteor kind only

/** The model behind each kind: what its planner returns and its drawing reads. Every body records when it started. */
export interface TransientBodies {
	meteor: Meteor
	satellite: SatellitePass
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in launch-check order: shooting stars first, they are the most frequent. */
export const TRANSIENT_KINDS = ['meteor', 'satellite'] as const satisfies readonly TransientKind[]

/** What the scheduler tracks for a transient of kind K. Times are seconds on the worker clock. */
export interface TransientEnvelope<K extends TransientKind> {
	kind: K
	body: TransientBodies[K]
	/** First light to last (s), wake, train and fades included; set once at launch from the kind's spec (T1). */
	lifetime: number
	/** Its light may fall within QUIET.feather of quiet copy: it holds the ink lease until it retires (T2). */
	nearCopy: boolean
	/** scrollY at launch: TRANSIENTS.scrollCancel px of scrolling from it cancels the transient (T4). */
	launchScrollY: number
	/** When a cancel began (scroll, pause): it fades out over TRANSIENTS.cancelFade. Null while it runs its course. */
	cancelledAt: number | null
}

/** A transient in the sky: its kind's body plus what the scheduler tracks for every kind. */
export type Transient = { [K in TransientKind]: TransientEnvelope<K> }[TransientKind]

/** The member of Transient for one kind. */
export type TransientOf<K extends TransientKind> = Extract<Transient, { kind: K }>

/** What a visit remembers between launches: today the sticky radiant; from P9 the visit's sky (VisitSky). */
export interface VisitMemory {
	radiant: Point | null
}

/** What a planner gets: the moment, the field, the visit's memory, and whether its light may end behind quiet copy. */
export interface PlanContext {
	random: Random
	/** Worker-clock seconds: the transient's start. */
	now: number
	/** Viewport and padded quiet rects on screen (CSS px). */
	field: MeteorField
	visit: VisitMemory
	/** The ink lease is free and the crossing cooldown is over; otherwise the plan must stay in clear sky. */
	mayCrossCopy: boolean
	narrow: boolean
}

/** A plan: the body, and whether its light may reach quiet copy (it then takes the ink lease). */
export interface Planned<K extends TransientKind> {
	body: TransientBodies[K]
	nearCopy: boolean
}

/** How one kind is timed and planned. Drawing lives with the canvas code (drawTransient in renderSky.ts). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before this kind's first attempt. */
	firstDelay(random: Random): number
	/** Seconds after a launch until the next attempt: the body's own time, then the kind's gap (stretched on long visits). */
	nextAfter(body: TransientBodies[K], random: Random, sinceReveal: number, narrow: boolean): number
	/** A plan for this moment, or null when nothing fits (T3: through the veil checks when it may reach quiet copy). */
	plan(context: PlanContext): Planned<K> | null
	/** First light to last (s). */
	lifetime(body: TransientBodies[K]): number
	/** True while it moves on screen: it needs every animation frame. */
	moving(body: TransientBodies[K], now: number): boolean
	/** It may launch on narrow screens. */
	narrow: boolean
}
```

The registry makes a missing spec a compile error, and so does a missing drawer (6.9, drawing):

```ts
/**
 * The meteor kind's planner: the veil session's planMeteor with the visit's radiant, and today's retry of fresh radiants
 * when the current one leaves no path (sky.worker.ts:207 to :212, as their commit leaves it). P9 swaps the radiant for
 * the visit's sky and a FlightLaw (I1).
 */
function planMeteorTransient(context: PlanContext): Planned<'meteor'> | null

/** Every kind's timing and planning. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = {
	meteor: {
		firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
		// P8: today's law (gap after the flight, ×1.5 after 180 s); P9: nextGap(METEOR_RATE…)
		nextAfter: (meteor, random, sinceReveal) => meteor.duration + nextMeteorGap(random, sinceReveal),
		// Wraps the veil session's planMeteor and the radiant retry of their updateMeteor (ported at the rebase)
		plan: planMeteorTransient,
		lifetime: meteorLifetime,
		moving: meteorMoving,
		narrow: true,
	},
	satellite: {
		// The first attempt within 60 s on 1 - e^(-30/50) = 45% of visits
		firstDelay: (random) => SATELLITE.after - SATELLITE.gap.mean * Math.log(1 - random()),
		nextAfter: (pass, random, sinceReveal) => pass.life + nextGap(random, SATELLITE.gap, sinceReveal),
		plan: planSatellite,
		lifetime: (pass) => pass.life,
		moving: satelliteMoving,
		narrow: false,
	},
}
```

#### The scheduler

```ts
/** Whether and where transients may launch now; the worker fills it from its own state every tick (T6). */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches). */
	allowed: boolean
	/** No scroll for FRAME.meteorScrollQuietMs. */
	settled: boolean
	narrow: boolean
	sinceReveal: number
	scrollY: number
	field: MeteorField
}

/** The scheduler's state: what flies, and when each kind tries next. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	/** Plans in a row that found no room, per kind; at TRANSIENTS.maxFailedPlans the kind waits for a new layout. */
	failedPlans: Record<TransientKind, number>
	/** Launches this visit (narrow screens stop at TRANSIENTS.narrowLimit). */
	launched: number
	/** Last onset of any kind (s): onsets stay TRANSIENTS.minOnsetGap apart (T5). */
	lastOnsetAt: number
	/** Before this (s) every plan stays in clear sky: the crossing cooldown after the last lease began (T2). */
	crossingAfter: number
	visit: VisitMemory
}

export function createSchedule(): TransientSchedule
/** Starts each kind's clock at the reveal with its own first delay. */
export function revealTransients(schedule: TransientSchedule, random: Random, now: number): void
/** No launch for TRANSIENTS.afterReturn s (back to the tab, back from idle, back to full motion). */
export function holdTransients(schedule: TransientSchedule, now: number): void
/**
 * One tick: retires what has finished, starts the cancel fade of anything the page scrolled TRANSIENTS.scrollCancel px
 * away from, then launches each kind that is due and allowed. Returns true when anything changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: Random, now: number, gate: LaunchGate): boolean
/** Fades every active transient out over TRANSIENTS.cancelFade (pause, reduced motion). */
export function cancelTransients(schedule: TransientSchedule, now: number): void
/** Removes every transient at once (hidden tab, resize: their paths belonged to the old layout). */
export function dropTransients(schedule: TransientSchedule): void
/** A new layout may have room again: failed kinds retry after TRANSIENTS.retry, and the visit's sky is picked afresh. */
export function retryTransients(schedule: TransientSchedule, random: Random, now: number): void
/** Every animation frame while one moves, fade frames while one lingers (a train), else none. */
export function transientDemand(schedule: TransientSchedule, now: number): FrameDemand
/** The earliest next attempt of any kind (s), for the one timer a sleeping worker keeps. */
export function nextLaunchAt(schedule: TransientSchedule): number
/** 1 while a transient runs its course, falling to 0 over TRANSIENTS.cancelFade once cancelled: its drawing's light multiplier. */
export function cancelFade(transient: Transient, now: number): number

/** The ink lease is free: no active transient's light may reach quiet copy, and the crossing cooldown is over (T2). */
export function inkLeaseFree(schedule: TransientSchedule, now: number): boolean {
	return now >= schedule.crossingAfter && !schedule.active.some((transient) => transient.nearCopy)
}
```

Launching one kind (inside `updateTransients`), in order, each rule once:

1. Not due (`now < nextAt[kind]`): skip.
2. Held back: `!gate.allowed`, `!gate.settled`, a narrow screen with `!spec.narrow` or `launched >= TRANSIENTS.narrowLimit`,
   an onset within `TRANSIENTS.minOnsetGap`, or one of this kind already active (T7): `nextAt[kind] = now + TRANSIENTS.recheck`.
3. Plan with `mayCrossCopy: inkLeaseFree(schedule, now)`. Null: `failedPlans[kind]++`, and retry after
   `between(TRANSIENTS.retry)` or, after `maxFailedPlans`, wait for a new layout (`Infinity`), as today
   (`sky.worker.ts:213` to `:218`).
4. A plan whose lifetime exceeds `TRANSIENTS.maxLife` counts as a failed plan (T1 is enforced at the one place every
   transient enters the sky).
5. Launch: push the envelope (`schedule.active.push(envelope as Transient)`: the one cast, because TypeScript can't see
   that `TransientEnvelope<K>` is a member of the union for a generic `K`, microsoft/TypeScript#30581) with
   `launchScrollY: gate.scrollY`, `cancelledAt: null`; `lastOnsetAt = now`;
   `launched++`; if `nearCopy`, `crossingAfter = now + TRANSIENTS.crossingCooldown`;
   `nextAt[kind] = now + spec.nextAfter(body, random, gate.sinceReveal, gate.narrow)`.

The ink lease is not an object: it is held by whichever active transient has `nearCopy`, so it is released the moment
that transient retires and can never leak or go stale.

```ts
// src/lib/sky/config.ts (P8)
/**
 * Every transient (shooting stars, satellites): at most `maxLife` seconds from first light to last, wake, train and fades
 * included (WCAG 2.2.2's 5 s, per animation); onsets at least `minOnsetGap` apart; on narrow screens at most `narrowLimit`
 * per visit. Only one transient at a time may plan its light onto quiet copy (METEOR_VEIL's contrast budget is for one),
 * and the next may do so `crossingCooldown` seconds after the last began. Once the page scrolls `scrollCancel` px from
 * where it was at launch, a transient's veil no longer matches the copy, so it fades out over `cancelFade` seconds, as it
 * does when the visitor pauses the sky. A plan that finds no room waits `retry` seconds; after `maxFailedPlans` in a row the
 * kind waits for a new layout. A held launch looks again after `recheck` seconds; after a return (tab, idle, full motion)
 * none launches for `afterReturn` seconds. From `longVisit.from` seconds into a visit every gap stretches by
 * 1 + (t - from) / `longVisit.scale`, at most `longVisit.max` times (P9), so a long visit never turns into a screensaver.
 */
export const TRANSIENTS = {
	maxLife: 5,
	minOnsetGap: 3,
	narrowLimit: 6,
	crossingCooldown: 40,
	scrollCancel: 20,
	cancelFade: 0.25,
	retry: [5, 9],
	maxFailedPlans: 3,
	recheck: 1,
	afterReturn: 3,
	longVisit: { from: 120, scale: 240, max: 3 },
} as const
```

P8 moves `retry`, `maxFailedPlans`, `recheck`, `afterReturn` and `narrowLimit` out of `METEOR` (`config.ts:246` to
`:255`, `:289`) because they now apply to every kind. `narrowLimit` stays 2 in P8 (no visible change) and becomes 6 in P9.
`scrollCancel` (20 px) and `cancelFade` (0.25 s) are placeholders for the veil session's numbers (it named 16 to 24 px):
adopt theirs at the rebase.

`random.ts` gains `export type Random = () => number`, used by every new signature (existing signatures keep
`() => number`).

#### The gap law

```ts
// src/lib/sky/config.ts (P9), next to METEOR_RATE and SATELLITE, which use it
/** Poisson arrivals with a refractory floor and a cap: floor + Exp(mean), at most cap (s). */
export interface GapLaw {
	floor: number
	mean: number
	cap: number
}

// src/lib/sky/transients.ts
/** Seconds until a kind's next launch: one law for every clock (P9), stretched on long visits (TRANSIENTS.longVisit). */
export function nextGap(random: Random, law: GapLaw, sinceReveal: number): number {
	const { from, scale, max } = TRANSIENTS.longVisit
	const stretch = Math.min(max, 1 + Math.max(0, sinceReveal - from) / scale)
	return Math.min(law.cap, law.floor - law.mean * Math.log(1 - random())) * stretch
}
```

Its mean before the stretch is floor + mean · (1 - e^(-(cap - floor) / mean)).

#### Drawing

```ts
// src/components/sky/renderSky.ts
/** Draws one transient at the frame's time, faded by its cancel; a kind without a case fails to compile. */
export function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame): void {
	const fade = cancelFade(transient, frame.time)
	switch (transient.kind) {
		case 'meteor':
			// The fade multiplier needs interface request I5; until then a cancelled meteor is dropped at once
			drawMeteor(ctx, assets, transient.body, frame)
			return
		case 'satellite':
			drawSatellite(ctx, assets, transient.body, frame, fade)
			return
		default: {
			const unknown: never = transient
			return unknown
		}
	}
}
```

A `switch` with a `never` check, not a record of drawers: TypeScript can't correlate a union member with a record of
per-member functions without a cast (microsoft/TypeScript#30581, R3 §7.4).

#### In the worker

- `meteor`, `radiant`, `launched`, `failedPlans` (`sky.worker.ts:63` to `:66`) become `const schedule = createSchedule()`.
- `updateMeteor` (`:193`) becomes one `updateTransients(schedule, random, t, launchGate(now))` call, with `launchGate`
  built from today's `meteorsAllowed` (`:144`) and the scroll-quiet test (`:202`).
- `holdMeteors`, `retryMeteors` become `holdTransients`, `retryTransients`; the reveal calls `revealTransients`.
- `motion` away from full calls `cancelTransients`; hidden and resize call `dropTransients` (today: `meteor = null`).
- `frameDemand` uses `transientDemand(schedule, t)`; the sleeping timer uses `nextLaunchAt(schedule)`.
- `draw` (`:270`) calls `drawTransient` for each active transient.
- The scroll cancel moves out of the scroll handler into `updateTransients` (the veil session's rule, ported, I3). Ticks
  run on every animation frame while the page scrolls under full motion, so the check runs within a frame of the scroll.

### 6.10 The meteor population model and speed classes (P9; blocked on the veil commit and I1)

#### Config

```ts
// src/lib/sky/config.ts (P9)
/**
 * The screen as a window on the sky, for the geometry of shooting stars and satellites: its longer side spans `fov`
 * degrees and its centre looks `elevation` degrees above a horizon just below the screen, so a 16:10 window spans about
 * 21 to 59° (twinkle already grows toward the bottom, TWINKLE_HORIZON_GAIN). Today's nominal speed, 0.2 long sides per
 * second, is 12°/s here, a medium meteor (IMO: 3 to 25°/s). Shooting stars glow about `meteorHeight` km up over a planet of
 * radius `earthRadius` km, so lower in the window they are farther away: slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeight: 100, earthRadius: 6371 } as const

/**
 * Where a visit's shooting stars come from. One shower radiant, a spot `showerScatter` degrees wide, sends `showerShare`
 * of them; the rest come from `sporadicSources` broad sporadic sources (helion, antihelion, apex and toroidal), each
 * `sporadicScatter` degrees wide, one per speed class. Elevations follow real rates (hourly rate ∝ sin h, so density
 * sin h cos h) and azimuths are uniform. No path climbs more than `maxClimb` degrees above horizontal (a rising streak
 * reads as a firework), so about six in seven fall and the rest cross roughly sideways, half each way. On `onScreen` of visits the
 * shower radiant sits on screen, in clear sky in the top `onScreenTop` of the height; within `nearRadiant` degrees of it a
 * path may be as short as `nearRadiantPath` px, since meteors there are short and slow.
 */
export const RADIANTS = {
	showerShare: 0.4,
	showerScatter: 1.5,
	sporadicSources: 3,
	sporadicScatter: 15,
	maxClimb: 10,
	onScreen: 0.15,
	onScreenTop: 0.45,
	nearRadiant: 10,
	nearRadiantPath: 40,
} as const

/** The color a shooting star's wake cools to: warm (sodium, iron), white, or mint (magnesium, oxygen 557.7 nm). */
export type WakeColor = 'warm' | 'white' | 'mint'

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's centre (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** Wake color the head cools to. */
	wake: WakeColor
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast). The sporadic sources map onto them:
 * helion and antihelion about 30 km/s, toroidal 35 to 40, apex about 60. Fast meteors cool to mint (magnesium 517 nm,
 * oxygen 557.7 nm) and alone may leave a train; slow ones glow warm (sodium 589 nm, iron); medium ones stay white.
 */
export const SPEED_CLASSES = {
	slow: { angular: 9, duration: [1.1, 1.4], wake: 'warm', train: false },
	medium: { angular: 14, duration: [0.8, 1.1], wake: 'white', train: false },
	fast: { angular: 22, duration: [0.55, 0.8], wake: 'mint', train: true },
} as const satisfies Record<string, SpeedClass>

/**
 * How often shooting stars launch. A dark rural site sees 1 to 3 sporadic meteors an hour in the evening and 4 to 10
 * before dawn (AMS), and a screen-sized window holds about 29% of an observer's field (IMO): a real window shows one every
 * 25 to 100 minutes, or one every 2 to 4 at a Perseid or Geminid peak. The hero compresses that about 120 times, a
 * time-lapse of a strong shower night: gaps after each flight follow `hero` (floor 4 s + an exponential 8 s, at most 30 s:
 * 11.7 s on average, about 4.7 a minute) or `narrow` on phones (21 s on average), and stretch on long visits
 * (TRANSIENTS.longVisit).
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	narrow: { floor: 8, mean: 14, cap: 45 },
} as const satisfies Record<string, GapLaw>
```

(`GapLaw` and `WakeColor` live in `config.ts`, like `LayerConfig` and `HazePool`, so the config never depends on the
modules that read it.)

`METEOR.gapMin`, `gapMeanExtra`, `gapMax`, `slowAfter`, `slowFactor`, `angle`, `radiantX`, `radiantY`, `radiantJitter`
go in P9 (with I1, or with the fallback), and `METEOR`'s comment ("falling from one radiant beyond the top-right
corner") is rewritten. `nextMeteorGap` (`meteors.ts:244`) is replaced by `nextGap(random, METEOR_RATE.hero or .narrow, …)`.

#### `src/lib/sky/radiants.ts` (new)

```ts
/** A unit direction in the window's frame: x to the right, y down the screen, z through the screen into the sky. */
export interface SkyDirection {
	x: number
	y: number
	z: number
}

/** The screen as a pinhole window (gnomonic: straight paths stay straight, and parallel paths meet at their radiant). */
export interface SkyWindow {
	cx: number
	cy: number
	/** CSS px per unit of the image plane: the longer side spans SKY_WINDOW.fov. */
	focal: number
	/** Elevation of the screen centre (radians). */
	pitch: number
}

/** One source of a visit's shooting stars: a radiant, how widely its meteors scatter, and their speed class. */
export interface Source {
	radiant: SkyDirection
	/** Scatter (radians, one standard deviation). */
	scatter: number
	speed: keyof typeof SPEED_CLASSES
}

/** A visit's sky (R1): the window, the shower and the sporadic sources; picked afresh on resize, layout or repeated failures. */
export interface VisitSky {
	window: SkyWindow
	shower: Source
	sporadic: readonly Source[]
	/** The shower radiant lies on screen (RADIANTS.onScreen of visits). */
	showerOnScreen: boolean
}

/** How a shooting star launched at a start point flies: direction, speed and timing, or null when nothing starts there. */
export interface Flight {
	dirX: number
	dirY: number
	/** Nominal screen speed (CSS px/s). */
	speed: number
	duration: readonly [number, number]
	/** Shortest path allowed from this start (px): today's minimum, or RADIANTS.nearRadiantPath near an on-screen radiant. */
	minPath: number
	/** Peak brightness scale from the range to the meteor layer: (reference range / range)², at least 0.6. */
	brightness: number
	wake: WakeColor
	train: boolean
}

/** The direction source handed to the veil session's planner (I1): it picks start points, this decides how they fly. */
export type FlightLaw = (random: Random, start: Point) => Flight | null

export function skyWindow(width: number, height: number): SkyWindow
/** A visit's sky: radiants with elevation density sin h cos h; the shower on screen in clear sky on RADIANTS.onScreen of visits. */
export function pickVisitSky(random: Random, field: MeteorField): VisitSky
/** One launch's flight law: a source (the shower with RADIANTS.showerShare, else a sporadic one) and its scattered radiant. */
export function flightLaw(random: Random, sky: VisitSky): FlightLaw
/** Screen direction and speed factor at (x, y) for a meteor from `radiant` (R2 §4.2), or null at the radiant itself. */
export function radiantMotion(view: SkyWindow, radiant: SkyDirection, x: number, y: number): RadiantMotion | null
/** Elevation (radians) behind screen point (x, y). */
export function elevationAt(view: SkyWindow, x: number, y: number): number
/** Range (km) to the meteor layer at elevation h: 100 km overhead, about 172 km at 35° and 477 km at 10°. */
export function meteorRange(h: number): number
```

`radiantMotion`, `elevationAt`, `meteorRange`, `toward` and `sampleRadiant` are R2 §10's sketches as written (R2
checked the screen-speed formula against finite differences). `random.ts` gains `gaussian(random)` (Box-Muller) for the
scatter.

The flight law at a start point (R2 §4.2 to §4.4):

1. `motion = radiantMotion(view, scattered, start.x, start.y)`; null: no flight here.
2. Reject a climb steeper than `RADIANTS.maxClimb` (`motion.dirY < -sin(maxClimb)`): about 13% of candidates (computed),
   which the planner simply re-samples. (D8.)
3. `range = meteorRange(elevationAt(view, start)) / meteorRange(view.pitch)`;
   `speed = SPEED_CLASSES[c].angular × (π/180) × view.focal × motion.rate × jitter / range`, with jitter from
   `METEOR.speedJitter`.
4. `minPath`: `RADIANTS.nearRadiantPath` if the shower is on screen and the start lies within `RADIANTS.nearRadiant`
   degrees of it, else today's `METEOR.path[0]` (110 px on narrow screens).
5. `brightness = max(0.6, range⁻²)`; the planner multiplies its peak by it.

Computed with this geometry (200,000 samples, 1440 × 900, start points over the upper 60%): 75% of paths fall more
than 15° below horizontal, 13.5% run within ±15° of it and 11% climb more than 15°; the 10° guard removes the 13% that
climb more than 10°, leaving 86% falling and 14% roughly sideways (D8), half going each
way, and 13% of radiants land on screen by chance (the deliberate on-screen shower adds to that).

#### What the veil planner needs to accept (I1)

```ts
// src/lib/sky/meteors.ts, the veil session's planner after I1
export function planMeteor(random: Random, field: MeteorField, law: FlightLaw, now: number, options: PlanOptions): PlannedMeteor | null

/** What a launch allows. */
export interface PlanOptions {
	/** The ink lease is free: the path may burn out behind quiet copy (veiled); otherwise it stays in clear sky. */
	mayCrossCopy: boolean
	/** A fireball may be chosen (wide screens, spacing and first-delay rules met). */
	fireballs: boolean
}

/** A planned meteor and whether its light reaches quiet copy (dimFrom < 1, or the path within QUIET.feather of a rect). */
export interface PlannedMeteor {
	meteor: Meteor
	nearCopy: boolean
}
```

Inside `planFlight`, the lines that compute `away`, `dirX`, `dirY`, `below` and the 18 to 42° filter
(`meteors.ts:140` to `:145`) and the speed and duration lines (`:147` to `:152`) are replaced by one call to `law(random,
start)`; everything else stays theirs: the start-point sampling, the layout guards (110 px under the navbar, the 12 px
edge margin, ends above 0.72 of the height), `segmentTouches`, `veiledFrom`, flares and trains. With
`mayCrossCopy: false` the planner rejects any path within `QUIET.feather` of a padded rect, the path fireballs take
today (`:159`).

#### Speed-class colors (I6)

`Meteor` gains `wake: 'warm' | 'white' | 'mint'`. `drawMeteor`'s tint line (`renderSky.ts:222`) picks: fireballs warm as
today (`METEOR_LOOK.fireballTint`); `mint` is today's `mixRgb(green, white, METEOR_LOOK.mintToWhite)`; `white` is the
theme white; `warm` is palette index `METEOR_LOOK.warmTint` (new, 5: pale yellow). Trains only on the fast class, as today
only behind the faster half. Saturated red never appears: the warmest tint, pale orange `[255, 214, 170]`, has R / (R + G
+ B) = 0.40, far under 2.3.1's 0.8.

### 6.11 Satellites (P11; after P8 and P9)

```ts
// src/lib/sky/config.ts (P11)
/**
 * Satellites: steady points (no twinkle, no wake) gliding in a straight line, lit by a Sun below the horizon. Real low
 * orbits cross about 1°/s overhead and 0.2 to 0.3°/s low in the sky; these run `speed` °/s (2 to 3 times faster) so a whole
 * pass, fading in from Earth's shadow over `fadeIn` s (or sliding in from an edge) and, on `shadowShare` of passes, fading
 * into it over `fadeOut` s while warming toward pale orange as real ones redden, stays under `life` seconds (5 s, WCAG
 * 2.2.2). Alpha `alpha`, about magnitude 2.5 to 5, never brighter than mid stars. Clear sky only, one at a time, on their
 * own clock: the first attempt `after` s plus an exponential `gap.mean` after the reveal, then `gap` after each pass
 * (84.5 s on average after a pass ends, about 88.5 s from start to start).
 */
export const SATELLITE = {
	gap: { floor: 40, mean: 50, cap: 150 },
	after: 30,
	speed: [1.2, 2.5],
	alpha: [0.25, 0.5],
	life: 4.8,
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
	tint: 4,
	shadowTint: 6,
	shape: 3,
} as const
```

```ts
// src/lib/sky/satellites.ts (new)
/** One satellite pass: a straight line at constant speed in screen CSS px, with its fades. */
export interface SatellitePass {
	startX: number
	startY: number
	/** Unit direction. */
	dirX: number
	dirY: number
	/** CSS px/s: SATELLITE.speed °/s at the window's scale. */
	speed: number
	/** Whole pass (s), fades included: at most SATELLITE.life. */
	life: number
	/** Fade in (s): 0 when it slides in from beyond an edge. */
	fadeIn: number
	/** Fade into Earth's shadow at the end (s), warming as it goes; 0 when it leaves through an edge. */
	fadeOut: number
	alpha: number
	startedAt: number
}

/** A satellite at one moment: where it is, how bright, and how far it has warmed into the shadow (0 to 1). */
export interface SatelliteFrame {
	x: number
	y: number
	alpha: number
	warmth: number
}

/** Plans a pass in clear sky for this moment, or null when nothing fits (never near copy: nearCopy is always false). */
export function planSatellite(context: PlanContext): Planned<'satellite'> | null
/** True while the pass is on screen. */
export function satelliteMoving(pass: SatellitePass, now: number): boolean
/** Where a pass is at `now`, how bright, and how far it has warmed into Earth's shadow. */
export function satelliteAt(pass: SatellitePass, now: number): SatelliteFrame

// The satellite kind's timing lives in the registry in transients.ts (6.9), next to the meteor kind's
```

- **Plan.** A random straight segment of length speed × life whose every point is at least `QUIET.feather` clear of
  every padded rect (T3; the veil's `segmentTouches`, exported by I2), inside the viewport below the navbar and above
  0.72 of the height (today's layout guards), entering at an edge or fading in mid-sky; `nearCopy` is always false. Wide
  screens only (`narrow: false`). `firstDelay(random) = SATELLITE.after - SATELLITE.gap.mean × ln(1 - random())`, so the
  first attempt comes within 60 s on 45% of visits.
- **Draw** (`drawSatellite`, in `renderSky.ts` or a split `renderTransients.ts`): `placePoint` with
  `SATELLITE.tint` and `SATELLITE.shape` at fractional positions (60 px/s at DPR 2 needs every frame, which moving
  transients get), alpha × `cancelFade`, and × `easedQuietFactor(frame.quiet, x, y, LAYERS.mid)` as a second guard
  should a layout change mid-pass bring copy under it. The warm shift draws the `shadowTint` sprite on top with
  alpha × warmth and the white one with alpha × (1 - warmth); additive compositing makes that an exact blend.

### 6.12 The "could" kinds (P12, each after D4)

| Kind | Body and spec | Planning and veil | Notes |
|---|---|---|---|
| Burst (2 to 4 meteors from one radiant within 5 s) | A burst body holding member `Meteor`s with staggered starts (≥ 0.35 s apart: 3 flashes a second at most) | All members clear sky (no lease) | 5% of launches, ≥ 90 s apart, after 45 s; desktop |
| Near-radiant point flash | A meteor with no length: brightens and fades in 0.3 to 0.5 s within 1° of an on-screen radiant | Clear sky | At most one per 60 s |
| Earthgrazer | Long (≥ 0.45 of the width), slow (4 to 6°/s), within 12° of horizontal | Clear sky | 2.5% of launches, ≥ 180 s apart; ≥ 1280 px wide |
| Static comet | Not a transient: a `SkyBody` with a world position and nearness, drawn after the layers with the camera law | Near-layer keeps (no light near copy); hidden if a layout puts it in a padded rect | 1 visit in 10; changes the reviewed composition; never green in the tail (R4) |
| Planet | A catalog addition in the near layer at alpha 0.78, twinkle 0 | Star keeps | Changes the reviewed sky |
| Farewell meteors | The meteor kind with the end scene's launch gate | As meteors | At most 2 per visit, end scene ≥ 0.9 |

Static bodies (comet, planet) obey the camera law like stars, which R1 §9 asks of long-lived bodies; transients stay in
screen space, so the veil planning stays in screen space.

### 6.13 Protocol changes

Section 5.4 lists them: `activity` (P4), `pointer` (P7), the `SkyMotion` comment (P5), and nothing else. The pointer
message and its listener follow R3 §8: a passive `pointermove`, mice and pens only (`event.pointerType !== 'touch'` and
`(hover: hover) and (pointer: fine)`), normalized to -1 to 1 with the ResizeObserver's size (no layout read), at most one
message per animation frame, `null` on leaving the window or on `blur`, and only under full motion. In the worker,
`pointer` sets the lean target (multiplied by `scene.lean`), calls `noteInput` and sets `needsDraw`, so a resting camera
gets the tick that starts it moving (F6).

```ts
// src/lib/sky/config.ts (P7)
/**
 * Leaning toward the pointer (fine pointers with hover, the hero, full motion): the camera moves up to `reach` CSS px (at
 * nearness 1) toward a cursor at the viewport's edge, through critically damped springs of `omega` rad/s (95% in 1.2 s),
 * so the stars slide away from it, the bright ones farthest: 19 px for the brightest, 12 for the near mean, 6 for the mid
 * mean, 3.5 for the faint mean. iOS's own motion effects use about ±10 points.
 */
export const LEAN = { reach: 12, omega: 4 } as const
```

R1 and R4 describe the same law here. R4's "virtual shift of 100 px at the viewport edge times each layer's parallax"
is 100 × 0.07 = 7 px at nearness 1, giving its 2, 4 and 7 px per layer; R1's reach is 12 px at nearness 1. Both multiply
one camera offset by each star's nearness, so the difference is one constant: `LEAN.reach` 12 (default) or 7 (D3).

## 7. Implementation phases

### 7.0 Rules for every phase

- **One phase, one pull request**, merged only after its verification. Phases land in order; P7, P10, P12 and P13 are
  optional or conditional.
- **Commands.** `npm run lint` and `npm run type-check` (AGENTS.md line 22). The worktree has no `node_modules`
  (only the main checkout does), so run `npm ci` in the worktree first or implement in the main checkout. While
  `next dev` runs, use its MCP endpoint (`get_errors`, `get_compilation_issues`, `compile_route` for `/`) instead of
  `next build`. If `next dev` stops with an upgrade reminder, tell the user and rerun; don't upgrade Next.js. Never POST
  to `/api/schedule/book`.
- **The harness** (scratch folder, never committed; D5). Copy `src/lib/sky/*.ts`, and for render checks
  `renderSky.ts` and `skyAssets.ts`, into the session's scratch folder; rewrite relative and `@/lib/sky/` imports to
  `./name.ts`; run with `node file.ts`. Node 24 strips types by default but can't resolve the codebase's extensionless
  imports, hence the rewrite (verified on Node 24.14). For render checks, stub `globalThis.ImageData` (a
  `{ width, height, data }` class) and `globalThis.OffscreenCanvas` (whose `getContext` returns a recorder of
  `putImageData`, `drawImage`, `globalAlpha` and the other calls), so atlas bytes and every draw call can be compared
  between the old code (`git show <base>:<path>`) and the new.
- **The debug patch** (scratch, never committed). A worker message `{ type: 'debug-frame', time, camera, heading, rate,
  fps, k, js }` per drawn frame and `{ type: 'debug-transient', kind, start, end, heading, peak, startedAt }` per launch,
  collected by `mountSky` into `window.__skyDebug` (R4 §3.3). Apply with `git apply` for verification runs; revert
  before committing.
- **Browser checks** with the session's browser tools (the browser pane or the Playwright MCP) against `next dev`:
  `resize_window` presets for phone and desktop, reduced-motion emulation, screenshots and performance traces.
- **Evidence.** Each PR description records the harness output, the checklist items (section 9) passed, and
  screenshots or traces where the change is visible.
- **Coordination** before each merge: section 8.3.

### P0. Baseline (no repository change)

- **Goal.** Record today's behavior, so later phases can prove "no visible change".
- **Steps.** Build the harness. Record draw-call logs for a grid: viewports 390 × 844, 1440 × 900, 2560 × 1440 at DPR 1
  and 2; scroll 0, 600, 1800 px and 1.3 viewport heights; quiet ease settled and mid-ease; contrast normal and more;
  twinkle at 0 and at several times. Record the atlas bytes per DPR. Take screenshots of the hero after the dusk and of
  About.
- **Done when** two harness runs produce identical logs.

### P1. Render core: phase sprites, quiet index, cell eviction (no visible change)

- **Blocked on:** nothing.
- **Files:** `config.ts` (`STAR_PHASES`), `skyAssets.ts`, `renderSky.ts`, `quietIndex.ts` (new), `scene.ts`
  (`sameRects` moved in), `sky.worker.ts`.
- **Steps.**
  1. `STAR_PHASES`. In `skyAssets.ts`: `profile`, phase-aware `paintSprite` normalized by the phase-0 peak, the 4 × 4
     block layout, `starSpriteIndex` (6.3).
  2. `quietIndex.ts` (6.4). Move `sameRects` from `sky.worker.ts:82` to `scene.ts`, exported; the worker imports it.
  3. In `renderSky.ts`: `placePoint`; `SkyFrame` gains `snap` and `quietIndex`; `drawLayer` places stars with
     `placePoint` and dims them with the index; the `StarField` with frame stamps, `CELL_CACHE_SLACK` and the key guard;
     `drawSky` calls `beginFrame`, `quietIndex.update` and `trim`; `EDGE`'s comment states the 9 px halo bound (6.5).
  4. In the worker: create the index once; `frameAt` sets `snap: true` and passes the index.
- **No visible change means:** every recorded `drawImage` call (source rectangle, destination, `globalAlpha`) equals P0's
  over the whole grid; phase-(0, 0) atlas bytes equal P0's; the quiet index's factor differs from `easedQuietFactor` by
  exactly 0 at every star and test point (64 rects, mid-ease included).
- **Verification.** Lint and type-check; the three harness comparisons; a scroll over a 10,000 px page in 50 px steps
  regenerates, per frame, only cells that just came into view (SF1); star math at 1430 stars mid-ease drops to about
  0.3 ms. Checklist: AC-29, AC-30, AC-35, AC-36.
- **Rollback.** Revert the PR. Nothing persists.

### P2. Camera seam: continuous depth and scroll glide (visible while scrolling)

- **Blocked on:** nothing.
- **Files:** `config.ts` (`DEPTH`, `CAMERA`; `LayerConfig.parallax` and `LAYERS.*.parallax` removed, `LAYERS` comment),
  `catalog.ts` (`Star.q`, `nearness`, `LAYER_NEARNESS`), `camera.ts` (new: the scroll part, 6.1), `renderSky.ts`
  (`SkyFrame.camera` replaces `parallaxScroll`; `drawLayer` offsets each star by q · C and culls cells on both axes with
  `LAYER_NEARNESS`; `snap` from the frame), `sky.worker.ts` (`camera`, `updateCamera`, `cameraMoving`; `init`,
  `motion`, `visible` freeze the camera; `frameAt` sets `camera` and `snap: motion !== 'full'`; until P3, `frameMode`
  returns `'active'` while `cameraMoving`).
- **Visible change.** At scroll 0, none (S4). While scrolled, the stars of each band spread their parallax (the brightest
  follow 0.112 of the scroll, the faintest 0.017); after a scroll stops, the stars glide to rest in about half a second;
  Home and End snap. Under reduced motion, identical to today.
- **Verification.** Harness: with the camera at (0, 0) the draw calls equal P1's; star positions equal P1's for every
  cell (S2); band-mean scroll shares 0.0205, 0.0351 and 0.0717; `springStep` composes exactly (one 0.2 s step against
  two 0.1 s steps: difference 0, computed), never overshoots with 250 ms steps, and reaches 95% in 0.474 s at ω = 10;
  a scroll jump over one viewport snaps. Browser: scroll and stop (the glide), Home and End (the snap), reduced
  motion (still). Checklist: AC-26, AC-27, AC-34, AC-35, AC-36.
- **Rollback.** Revert the PR.

### P3. Frame pacing (no visible change at rest)

- **Blocked on:** nothing.
- **Files:** `config.ts` (`PACING`; the `ADAPT` comment: step 1 also caps drift at `PACING.slowMaxFps`), `pacing.ts`
  (new, 6.2), `sky.worker.ts` (`frameDemand`, `cameraDemand`, `twinkleDemand`, `driftCap`, `softwareFps`; `rafId` with a
  `null` sentinel; `requestFrame`, the watchdog, `rafWorks`; the refresh estimate and divisor in `tick`; `schedule`,
  `cancelFrames`; `probeRaster` keeps `rasterMs`; `SkyWorkerScope`'s rAF members optional).
- **Visible change.** None at rest. The glide after a scroll now draws on display-aligned frames at 20 to 30 fps
  instead of every refresh.
- **Verification.** Harness: `combineDemands` reproduces `frameMode` over a table of states (meteor flying or lingering,
  scrolling under full or reduced motion, dusk, quiet ease, twinkle, idle, sleep); `refreshDivisor` gives the table in
  6.2; `stepDivisor` lowers k at once and raises it after 0.5 s; the refresh estimate settles at 16.7 ms for 60 Hz with
  dropped frames, 8.3 ms for 120 Hz, moves to 33.3 ms within 16 samples after a switch to 30 Hz, and flags a 15 ms clock
  as unaligned. Browser: a Chrome trace of a glide shows equal holds on refreshes (AC-13); twinkle still draws at 15 fps
  from its timer; a hidden tab draws nothing; with `scope.requestAnimationFrame` removed in the debug patch, motion
  still runs on the 60 Hz timer. Checklist: AC-13, AC-14 (idle part), AC-32.
- **Rollback.** Revert the PR.

### P4. Presence (visible: twinkle keeps going while the visitor uses the pointer or keys)

- **Blocked on:** nothing.
- **Files:** `presence.ts` (new, 6.6), `protocol.ts` (`activity`), `mountSky.ts` (`ACTIVITY_INTERVAL_MS`,
  `ACTIVITY_EVENTS`, listeners), `sky.worker.ts` (`presence`; `noteInput` delegates; `ambient`; `twinkleLevel`,
  `meteorsAllowed` and the twinkle demand use `isAway`; the `activity` case), `config.ts` (`FRAME` comment).
- **Visible change.** Twinkle no longer fades at 90 s while the pointer moves or keys are pressed; otherwise the same.
- **Verification.** Harness: `presenceLevel` equals today's `idleTwinkle` for the same input timelines, and
  `notePresence` returns true exactly when today's `isIdle` was true. Browser: move the pointer for two minutes without
  scrolling (twinkle continues); leave everything alone for 95 s (twinkle eases out over 4 s, then a trace shows no
  drawn frames). Checklist: AC-14, AC-33.
- **Rollback.** Revert the PR.

### P5. Pause control (visible: a pause button in the navbar)

- **Blocked on:** nothing. Uses D1's default unless the user picks another placement.
- **Files:** `skyPause.ts` (new), `SkyPauseToggle.tsx` (new), `icons/PauseSVG.tsx`, `icons/PlaySVG.tsx`,
  `icons/index.ts`, `Navbar.tsx`, `mountSky.ts` (`motion()` reads the store; its own reduced-motion query goes),
  `protocol.ts` (the `SkyMotion` comment), `sky.worker.ts` (`fullSince`), `AGENTS.md` (the pause line) (6.8).
- **Visible change.** The button. Pressing it freezes the sky where it is (stars round to whole pixels, at most half a
  device pixel), stops twinkle and shooting stars; pressing again resumes from there; a reload stays paused; under
  reduced motion the page starts paused.
- **Verification.** Lint, type-check, MCP `get_errors` on `/`, and no hydration warning in the console. Keyboard: Tab
  reaches the button, Space and Enter toggle it, the dashed focus ring shows. The accessibility tree shows a button named
  "Pause sky animation" whose pressed state follows the sky. With site data blocked (or a private window), toggling
  still works for the page view. A second tab follows (the `storage` event). Under reduced-motion emulation: starts
  paused; Play opts in for the page view; a reload starts paused again. Under forced colors the button is gone.
  Checklist: AC-26, AC-27, AC-28, AC-29.
- **Rollback.** Revert the PR. P6 must never ship without P5 (WCAG 2.2.2), so after P6 has landed, revert P6 first or set
  every `SCENE.*.drift` to 0.

### P6. Ambient drift (the headline change)

- **Blocked on:** P5 merged (or merged together). Uses D2 and D6.
- **Files:** `config.ts` (`DRIFT`, `SCENE.*.drift`, the `SCENE` comment), `scene.ts` (`SceneLevels.drift`, the `mix`
  key), `camera.ts` (`clock`, `driftAt`, `driftVelocity`, the drift terms of `cameraOffset`, `cameraSpeed` and
  `stepCamera`), `sky.worker.ts` (`driftRate`, `driftAffordable`, `fullSince` in the ease, the drift in `cameraDemand`).
- **Visible change.** Section 2.1.
- **Verification.** Harness: `driftAt(0)` is (0, 0); over a 2-hour run the speed stays within 0.580 to 1.420 v₀, the
  heading turns at most 4.4°/s, the wander at most 212 px at q = 1; stepping the rate from 1 to 0.35 or 0 never moves the
  camera (per-frame displacement only shrinks, AC-9); a simulated 5 s stall advances the clock by 0.1 s; a freeze makes
  the next step's dt 0. Liveness (F6): in the reading scene (twinkle 0), after 95 s without input, one `activity` ping
  restarts the frames at once and the drift is back to full rate 4 s later. In the browser with the debug patch:
  per-band median speeds (AC-1, AC-2), k and fps (AC-13), JS
  per frame (AC-13), no frames after the idle timeout (AC-14). The 60-second watch (R4 §3.1) on a DPR-2 laptop, a DPR-1
  monitor and an iPhone: AC-5, AC-8, AC-10, AC-11, AC-12, AC-15, AC-16, AC-17. Checklist: AC-1 to AC-12, AC-15 to
  AC-17, AC-33, AC-36.
- **Rollback.** Set `SCENE.hero.drift`, `reading.drift` and `end.drift` to 0: no drift and no drift frames, everything
  else intact. Or revert the PR.

### P7. Pointer lean (optional, D3)

- **Blocked on:** nothing; after P6.
- **Files:** `config.ts` (`LEAN`, `SCENE.*.lean`), `scene.ts` (`lean`), `camera.ts` (lean springs and terms),
  `protocol.ts` (`pointer`), `mountSky.ts` (`LEAN_POINTER_QUERY`, the frame-coalesced `pointermove`, `pointerout` and
  `blur` sending `null`, `cancelAnimationFrame` in `destroy`), `sky.worker.ts` (the `pointer` case, `leanTarget(scene)`).
- **Visible change.** On a desktop with a mouse, the hero's stars lean away from the cursor, the brightest up to 19 px,
  settling in about 1.2 s. Nothing on touch screens, in other scenes, under reduced motion or paused.
- **Verification.** Harness: the lean springs never overshoot and settle exactly. Debug patch: at most one `pointer`
  message per animation frame while sweeping the mouse; none from touch. Browser: the lean stops below the hero
  (`SCENE.reading.lean` 0). Checklist: AC-3 (pointer excluded), AC-26.
- **Rollback.** Revert the PR.

### Checkpoint V: the veil commit lands (section 8.4)

Everything below waits for it, or for the fallback PF (section 8.6), which only the user can start (D10).

### P8. Transient core (no visible change; blocked on V)

- **Files:** `transients.ts` (new, 6.9, with the meteor kind only), `random.ts` (`Random`), `config.ts` (`TRANSIENTS`;
  `retry`, `maxFailedPlans`, `recheck`, `afterReturn`, `narrowLimit` move out of `METEOR`), `scene.ts` (`meteors`
  becomes `launches`), `renderSky.ts` (`drawTransient`), `sky.worker.ts` (the schedule replaces `meteor`, `radiant`,
  `launched`, `failedPlans`; `launchGate`; cancel and drop; `transientDemand`; the scroll cancel ported from the veil's
  handler into `updateTransients`, I3).
- **No visible change means:** the same rate (today's gap law), the same radiant behavior (as the veil commit left it),
  the same narrow limit (2), the same veil checks. The one difference: pausing fades a meteor over 0.25 s if I5 landed
  (otherwise it is dropped, as today).
- **Verification.** Harness: for the same seed and inputs, launches, plans and gaps equal the veil-era `updateMeteor`
  (kept in the harness as the oracle); a property run over 10⁵ random event sequences (scroll, layout, pause, hidden,
  resize) never shows two `nearCopy` transients at once, a lifetime over 5 s, a scroll over `scrollCancel` without a
  cancel, or onsets under 3 s apart (T1 to T7). Checklist: AC-18, AC-19, AC-22, AC-31, AC-37, AC-38.
- **Rollback.** Revert the PR; the veil-era `updateMeteor` returns.

### P9. Meteor population model and rates (visible; blocked on P8 and I1)

- **Files:** `config.ts` (`GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`,
  `METEOR_LOOK.warmTint`; the old radiant, angle and gap keys removed; `TRANSIENTS.narrowLimit` 6), `radiants.ts` (new),
  `random.ts` (`gaussian`), `transients.ts` (`VisitMemory` becomes `{ sky: VisitSky | null }`; the meteor spec uses
  `flightLaw` and `nextGap`), `meteors.ts` (through I1 and I6, or by us after PF), `renderSky.ts` (the wake tint, I6).
- **Visible change.** About 4.7 shooting stars a minute in the hero, from varied directions, some sharing a radiant; the
  shower radiant on screen on about 15% of visits; warm, white and mint wakes by speed class; gaps stretch from the
  second minute.
- **Verification.** Harness: the direction mix (86% falling, 14% sideways after the 10° guard, ±2%); left and right
  50/50; mean gaps 11.69 s (desktop) and 21.0 s (narrow) over 10⁵ draws; first-minute count median 5 and 3 to 6 in at
  least 80% of runs (computed: 90%); no climb over 10°; shower paths, extended backward, meet within 10% of the viewport
  diagonal; at most one lease grant per 40 s. With the veil session's captured layouts if shared (I7), else synthetic
  ones: the share of accepted plans and crossings per minute at or below today's. The 60-second watch. Checklist: AC-18
  to AC-23, AC-31, AC-37, AC-38.
- **Rollback.** Revert the PR. For a quick rate rollback alone, set `METEOR_RATE.hero` to `{ floor: 30, mean: 12, cap: 75 }`
  (today's law without its step stretch).

### P10. Fireball retune (should; after P9)

- **Files:** `config.ts` (`METEOR_KINDS.fireball = { chance: 0.04, spacing: 120, after: 20 }`, documented;
  `METEOR.fireballChance` removed), `transients.ts` (the meteor spec passes `fireballs: true` only when the spacing and
  first-delay rules allow), fireball colors by speed class (I6).
- **Visible change.** Fireballs at 4% of launches, at least 120 s apart, none in the first 20 s: about one every 5 minutes.
- **Verification.** Harness: no two fireballs closer than 120 s; none before 20 s. Checklist: AC-31.
- **Rollback.** Revert the PR.

### P11. Satellites (should; after P8 and P9)

- **Files:** `config.ts` (`SATELLITE`), `satellites.ts` (new, 6.11), `transients.ts` (registered), `renderSky.ts` or a
  split `renderTransients.ts` (`drawSatellite`; if split, add it to AGENTS.md's worker list), I2 (`segmentTouches`
  exported).
- **Visible change.** Now and then a steady point glides across clear sky for under 5 s.
- **Verification.** Harness: every pass at most 4.8 s, at least `QUIET.feather` clear of every padded rect, never
  `nearCopy`, constant speed; the first attempt within 60 s on about 45% of runs. Browser watch. Checklist: AC-24, AC-31,
  AC-37.
- **Rollback.** Remove `'satellite'` from `TRANSIENT_KINDS` and the registry, or revert.

### P12. Could kinds (each its own PR, per D4; after P9)

Bursts, the near-radiant point flash, earthgrazers, the static comet, the planet, farewell meteors (6.12). Each adds a
body type and a spec (or, for static bodies, a `SkyBody` drawn after the layers), its config block, and harness checks
for its invariants (bursts: members at least 0.35 s apart and all clear-sky). The comet and planet also need a
composition review, since they change the reviewed sky.

### P13. WebKit frame relay (D7: only if device tests ask; blocked on P3 and the tests, not on the veil)

- **Files:** `protocol.ts` (`tick`, `relay`), `mountSky.ts` (a main-thread rAF loop that posts `tick` while the worker
  asks for it), `sky.worker.ts` (asks for the relay when the clock is unaligned and a vsync demand exists; draws on
  `tick`).
- **Decide with:** iPhone and macOS Safari traces at 60 and 120 Hz, in Low Power Mode too: unequal holds per second and
  frames drawn per second, with and without the relay.
- **Rollback.** Revert the PR.

### PF. Veil fallback (only on the user's go-ahead, D10)

Section 8.6.

## 8. Coordination protocol

### 8.1 Ownership and stable seams

Until checkpoint V, this plan edits no veil-owned function (4.4) and keeps every name the veil's code reads stable in
name and meaning, so their handlers keep working unchanged on top of our phases:

- read by the `scroll` handler (`sky.worker.ts:463`): `scrollY`, `motion`, `parallaxScroll`, `lastScrollAt`,
  `noteInput(now)`, `rafId` (falsy when no frame is pending), `timerId` (undefined when no timer is), `needsDraw`;
- read by the `layout` handler (`:471`): `documentHeight`, `sameRects` (moved to `scene.ts` in P1, still imported under
  that name), `quiet`, `pinned`, `quietBefore`, `pinnedBefore`, `layoutAt`, `retryMeteors(now)`, `needsDraw`;
- read by `quietBlend` and `settleQuiet` (`:227`, `:241`): `layoutAt`, `scrollY`, `quiet`, `pinned`, `quietBefore`,
  `pinnedBefore`, `lastDrawAt`, `needsDraw`;
- read by `updateMeteor` (`:193`): `meteor`, `radiant`, `launched`, `failedPlans`, `nextMeteorAt`, `revealAt`,
  `meteorsAllowed(now)`, `lastScrollAt`, `random`.

P8 (after V) is the first phase allowed to rename or remove any of these.

### 8.2 Interface requests to the veil session

| # | Request | Why | If they decline |
|---|---|---|---|
| I1 | `planMeteor(random, field, law: FlightLaw, now, options: { mayCrossCopy, fireballs }) → { meteor, nearCopy } \| null`: their start-point sampling, layout guards and veil checks stay; the direction, speed and duration come from `law`; the 18 to 42° filter goes (6.10). | The population model (P9) and the ink lease (P8) need it; `nearCopy` is a local in `planFlight` today (`meteors.ts:158`). | After V we make the same change in `meteors.ts` ourselves, leaving `veiledFrom` and `segmentTouches` untouched. If they object to that too, they export `veiledFrom` and `segmentTouches` unchanged and we write `planDirectedFlight` in `radiants.ts` on top of them (duplicating only the layout guards). |
| I2 | Export `segmentTouches` unchanged. | Satellites (P11) need the same clear-sky test. | A copy of the 24-line Liang-Barsky test in `satellites.ts`, with a comment pointing at the original (a DRY cost). |
| I3 | The scroll cancel as data (`TRANSIENTS.scrollCancel` px, `cancelFade` s) and one rule, "cancel once \|scrollY - launchScrollY\| > scrollCancel", run in `updateTransients` for every kind instead of in the scroll handler. | One rule for every kind (COORDINATION.md request 1); ticks run every frame while scrolling, so it reacts within a frame. | Keep their handler rule and make it walk `schedule.active`. |
| I4 | Export `QUIET_REACH` from `scene.ts` next to `quietAt`, and keep every zone's reach within it if per-class rects arrive. | The quiet index is exact only while no zone reaches farther (Q1). | `quietIndex.ts` keeps its own `QUIET_REACH = QUIET.feather`, re-checked at every rebase. |
| I5 | `drawMeteor(ctx, assets, meteor, frame, fade = 1)`: one light multiplier. | A paused or scrolled-away meteor fades over 0.25 s instead of vanishing (a frozen or cut streak looks broken). | A cancelled meteor is dropped at once, as today. |
| I6 | `Meteor.wake` (`WakeColor`) honored by `drawMeteor`'s tint line (`renderSky.ts:222`). | Speed-class colors (P9). | Every wake stays mint, as today. |
| I7 | Their numbers: captured layouts, crossing rates for the new direction mix, the scroll-cancel distance, the per-class ink math; optionally, cache `screenQuietZones` by scroll and layout (`quietBlend` builds about 64 rects per drift frame). | P9's rate and crossing checks; less garbage per frame. | Synthetic layouts (R2 §4.6) and our own measurements. |

### 8.3 Merging the independent phases (P1 to P7, P13)

1. Before each merge, look for the veil commit (`git fetch origin`, then `git log origin/master` and
   `git log origin/master-r26syw`), read `COORDINATION.md`, and message the veil session if it is reachable.
2. If the veil commit is on master: rebase onto it first and rerun the phase's verification.
3. If not: merge the phase (it touches no veil-owned function) and append a dated entry to `COORDINATION.md` listing
   the files and functions it changed and confirming the stable seams (8.1), so the veil session can rebase onto it.

### 8.4 Checkpoint V: when the veil commit lands

1. Read the commit and its final plan; log both in `COORDINATION.md` with their numbers and the answers to I1 to I7.
2. Rebase this branch; resolve the hotspots (8.5).
3. Re-verify against their code: Q1 (the quiet index against their `quietFactor`, `inkAt`, `easedQuietFactor`, and the
   reach of any per-class rects); any new frame need of theirs (a fading flight) becomes one more line in
   `frameDemand`; the stable seams; their `planMeteor` signature against I1.
4. Rerun the harness checks of P1 to P7 and the 60-second watch; check AC-16, AC-19 to AC-22 and AC-30.
5. Adopt their numbers (`scrollCancel`, `cancelFade`, any `METEOR_VEIL` change) and recheck the ink lease against any
   per-class ink budget.
6. Unblock P8 and update `HANDOFF.md`.

### 8.5 Merge-conflict hotspots

| File | Function or block | Ours | Theirs | Resolution |
|---|---|---|---|---|
| `sky.worker.ts` | `frameMode`, `schedule`, `tick`, `onFrame`, `onTimer`, `cancelFrames` | replaced (P3) | maybe a fade demand for a cancelling flight | keep theirs as one more `frameDemand` line |
| `sky.worker.ts` | `scroll` handler | untouched; reads only | the scroll cancel | port the cancel into `updateTransients` at P8 (I3) |
| `sky.worker.ts` | `layout` handler, `quietBlend`, `settleQuiet` | untouched; `quietBlend` read in `frameAt` | the mid-ease deferral | none: the index compares contents |
| `sky.worker.ts` | `updateMeteor` and its state | replaced by the schedule (P8) | radiant ordering | port their logic into the meteor spec |
| `sky.worker.ts` | `init`, `motion`, `visible`, `sameRects`, `noteInput` | P1 to P5 | none expected | keep the seam names |
| `renderSky.ts` | `SkyFrame` | `camera`, `snap`, `quietIndex` (P1, P2) | maybe per-class ink fields | keep both sets of fields |
| `renderSky.ts` | `drawLayer`, `StarField`, `drawSky` | P1, P2 | none expected | |
| `renderSky.ts` | `drawMeteor`, `drawTrain` | only I5 and I6, after V | the veil, per-class ink | theirs first |
| `scene.ts` | `SceneLevels`, `sceneAt` | `drift`, `lean`, `launches` | none expected | |
| `scene.ts` | `quietAt`, `inkAt`, `quietFactor`, `easedQuietFactor` | read only | per-class ink | rerun Q1 |
| `config.ts` | `LAYERS`, `SCENE`, `FRAME`, `ADAPT`, new blocks | P1 to P11 | `METEOR_VEIL`, `QUIET`, METEOR's spawn keys | new blocks never reuse their keys |
| `meteors.ts` | `planFlight`, `planMeteor`, `nextMeteorGap` | I1, P9 | theirs | after V only |
| `protocol.ts` | `SkyMainMessage` | `activity`, `pointer` | maybe a text class on `layout` rects | union |
| `mountSky.ts` | listeners, `motion()`, `destroy` | P4, P5, P7 | rect measurement, entrance offsets | different functions |

### 8.6 If the veil work never lands (PF)

**Trigger.** Only the user's decision (D10), asked when P8 is next and no veil commit has landed.

**Ownership.** Record the takeover in `COORDINATION.md`: the veil-owned functions become this plan's.

**What PF does, and only this, keeping the same invariants:**

1. **Contrast stays safe without their fix.** Today's `veiledFrom` and `METEOR_VEIL` are stricter than they need to be
   (dimming can't start before 65% of the flight), not unsafe: keep them exactly as they are. Fewer flights cross copy,
   and the ink budget holds.
2. **The scroll cancel**, the verified bug (unquiet copy such as About scrolling under a meteor head at about 1:1
   contrast), is fixed by P8 itself: `updateTransients` cancels any transient once the page scrolls `scrollCancel` px
   from its launch, for every kind. It needs no edit to the scroll handler.
3. **The one ink lease and the 40 s crossing cooldown** are P8's own (T2).
4. **I1, I2, I5, I6 by us:** the `FlightLaw` parameter and `{ meteor, nearCopy }` result in `planMeteor`, the
   `segmentTouches` export, the `fade` multiplier, the wake tint, with `veiledFrom` and the veil math unchanged.
5. **Only with the user's explicit OK** (they are the veil session's planned fixes, not needed for this plan's
   invariants): deferring a layout that arrives mid-ease (a star pop), and removing entrance-transform offsets from the
   measured rects. The sticky radiant needs no fix: `VisitMemory` replaces it.

**Verification:** AC-16, AC-19 to AC-22, AC-30, AC-37, AC-38, and a check that a meteor never stays lit over unquiet
copy for more than `cancelFade` after a scroll.

## 9. Acceptance checklist

R4's checklist (§3.2), trimmed and mapped to phases. ★ marks the items a 60-second watch can check. "Amended" items
differ from R4 for the reason given. Methods: W watch, S scripted screenshots, T trace, L debug-patch log, H harness, C
code review.

| ID | Check | Pass when | How | Phase |
|---|---|---|---|---|
| AC-1 ★ | Depth order | Median on-screen speed far < mid < near, adjacent ratios at least 1.6 (computed 1.71 and 2.05), over 10 s without input | L, S | P6 (P2 for scroll) |
| AC-2 ★ | Still frame of reference | Far median ≤ 1.5 px/s, near ≤ 6, no star over 8 (computed at v₀ = 3: 1.25, 4.36, 6.82 at the speed peak) | L, S | P6 |
| AC-3 | One heading | All drift headings within ±5° at any instant, pointer lean excluded | L | P6 |
| AC-4 | Heading turns smoothly (amended) | Turn rate at most 4.4°/s, mean 2°/s ± 0.2; speed never under 0.58 v₀. R4 asked ≤ 15°/min, which the settled epicycles don't meet by design (6.1). | H, L | P6 |
| AC-5 ★ | No starts, stops or reversals | Speed changes at most 10% per second (computed 3.8%); no stop in 60 s | H, S | P6 |
| AC-6 | No oscillation | No component between 0.05 and 0.5 Hz (the drift's are 0.0056 to 0.0134 Hz) | C, H | P6 |
| AC-7 | No visible repeat (amended) | No exact repeat within 25 h; the near-return once per 180 s lands at least 20 px (q = 1) from the earlier position. R4 asked "never within 50 px over 10 min", which no bounded path can meet. | H | P6 |
| AC-8 ★ | No edge pops | No star appears or vanishes inside the viewport in one frame | S | P1, P6 |
| AC-9 | Rate changes never jump | At scene changes, idle, pause, reduced motion and resize, the largest per-frame displacement ≤ normal + 0.25 px | H, S | P6 |
| AC-10 ★ | No pixel stepping (amended) | At most 0.5 device px per drawn frame (computed ≤ 0.50 at v₀ = 3 everywhere) and no staircase (linear fit r² ≥ 0.999 over 2 s). R4 asked 0.25 px, which needs 60 fps at DPR 2; 0.5 px is R3's settled step and within R1's 0.5 to 0.6 arcmin rule. | S, L | P3, P6 |
| AC-11 ★ | No shimmer | Flux ripple ≤ 5% (phase sprites keep flux exactly); perceived peak swing ≤ 10% at DPR 2; DPR 1 judged by eye (risk 7) | S, H | P1, P6 |
| AC-12 | No streaks | A moving star's sprite extent along its motion ≤ across + 1 device px | S | P6 |
| AC-13 | Frame pacing | ≥ 95% of drawn-frame intervals within ±25% of target; worker JS ≤ 4 ms at p95; no main-thread task over 50 ms from the sky | T, L | P3, P6 |
| AC-14 | Energy | Renderer ≤ 10% of a core while drifting on a mid laptop; 0 drawn frames after the idle timeout | T | P3, P4, P6 |
| AC-15 ★ | Calm while reading (amended) | Drift ≤ 0.35 of the hero (or 0), twinkle 0, no star over 2.4 px/s (the brightest at its speed peak; R4 said 2, the near-band median here is 1.1) | L, S | P6 |
| AC-16 | Restraint near copy | Alpha changes at most 0.05 per frame at quiet edges (computed under 0.01) | S, L | P1, P6 |
| AC-17 ★ | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s report no apparent motion of the copy | W | P6 |
| AC-18 | Attention budget | No onset in the first 3 s after the reveal; onsets at least 3 s apart; at most one onset per 6 s on average | L, H | P8, P9 |
| AC-19 ★ | A first shooting star | 3 to 7 s after the reveal in ≥ 18 of 20 desktop loads | L | P8, P9 |
| AC-20 ★ | Frequency (amended) | First 60 s: median 5, 3 to 6 in ≥ 80% of runs (computed 90%); one shooting star at a time outside bursts; gaps stretch from minute 2 (×2 at 6 min, ×3 at 10). R4 said median 4 and a stretch after 3 min. | L, H | P9 |
| AC-21 ★ | Varied but believable directions | Over 10 meteors: ≥ 3 radiants, headings spanning ≥ 60°, none climbing over 10° (D8); shower paths meet backward within 10% of the diagonal | L | P9 |
| AC-22 ★ | Ignite and burn out on screen | Head light under 15% of its peak at the first and last on-screen points; peak in clear sky | L, C | P8, P9 |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel | C, S | P9 |
| AC-24 | Satellites (amended) | Speed varies under 2%; pass ≤ 4.8 s; no tail, no blinking; one at a time; enters from an edge or fades. R4 asked ≥ 40 s across, which breaks T1 (D9). | L, S | P11 |
| AC-25 | Comet (if built) | Moves only by the camera law; fades in over ≥ 8 s; no part inside a padded quiet rect; at most one a visit | S | P12 |
| AC-26 ★ | Reduced motion is still | Two screenshots 30 s apart after the dusk are identical; no drift, glide, lean, twinkle or transients | S | P2, P5, P6 |
| AC-27 | Live preference switch | Turning reduced motion on freezes stars within 1 s, each at most 1 px from where it was; turning it off resumes without a jump; no shooting star for 3 s | S | P2, P5 |
| AC-28 ★ | Pause control (2.2.2) | Visible, named "Pause sky animation", keyboard-operable, `aria-pressed` follows the state; stops drift, twinkle and transients within 1 s; still paused after a reload; resumes from the paused positions | W, S | P5 |
| AC-29 | Forced colors and contrast | forced-colors hides the sky and the button; prefers-contrast: more drops the haze and dims the stars, drift allowed | S | P1, P5 |
| AC-30 | Contrast budget unchanged | Body text keeps 4.5:1 over the brightest moving star: drift changes positions, never alpha; the quiet factor is taken at the drawn position | C, H | P1, P2, P6 |
| AC-31 | Flash safety | At most 3 luminance flashes in any second; no saturated red (R / (R + G + B) < 0.8) | C, H | P8 to P12 |
| AC-32 | Hidden tab | After 60 s hidden the sky resumes where it was, no leap; no shooting star for 3 s | S | P3, P6 |
| AC-33 | Idle | After the idle timeout, drift and twinkle ease to 0 over 4 s and frames stop; any input eases them back over 4 s, in every scene, including reading, where nothing else wakes the worker (F6) | T, S, L | P4, P6 |
| AC-34 | Resize and zoom | No star jumps beyond what the new layout requires; drift continues | S | P2, P6 |
| AC-35 | Pixel equivalence (new) | P1's draw calls equal P0's over the grid; P2's equal P1's with the camera at (0, 0) | H | P1, P2 |
| AC-36 | Exactness (new) | Quiet index difference 0; spring half-step composition difference 0 and overshoot 0; drift bound and speed range as computed | H | P1, P2, P6 |
| AC-37 | Transient invariants (new) | T1 to T7 hold over 10⁵ random event sequences | H | P8 to P11 |
| AC-38 | Ink lease (new) | Never two `nearCopy` transients at once; at most one lease grant per 40 s | H, L | P8, P9 |

## 10. Performance budget and battery

Per drawn frame, from R3's measurements (§4.6; V8 in Node on a shared Xeon, so absolute numbers are indicative) and the
pacing in 6.2:

| Device | Stars drawn | Worker CPU per frame | Drift rate (v₀ = 3) | CPU share while drifting |
|---|---|---|---|---|
| Laptop 1440 × 900, DPR 2, GPU canvas | 314 | 0.2 to 0.4 ms | 20 to 30 fps | 0.4 to 1.2% of a core |
| 4K desktop, DPR 1, GPU canvas | about 1400 | 0.8 to 1.7 ms | 20 fps | 1.6 to 3.4% |
| Phone 390 × 844, DPR 2 | about 108 | 0.4 to 1.0 ms, plus an estimated 2 to 4 ms of GPU fill | 20 fps (capped at 30) | 0.8 to 2% CPU; GPU to be measured |
| Software raster, 1440 × 900 at CSS resolution | 314 | 3.3 to 3.9 ms | 20 fps (budget allows 20 to 24) | 6.6 to 7.8% |
| Software raster, 4K | 1400 | about 29 ms | none (budget gives 2 fps < 20) | 0 (still sky, as today) |

- **What changed the cost.** The quiet index cuts the star math at 1430 stars from 1.3 to 1.7 ms mid-ease to 0.14 to
  0.32 ms, which pays for continuous frames. Phase sprites cost the same to draw as today (whole-pixel destinations).
- **When the sky draws nothing.** Reduced motion or paused (after the fades); the reading scene if D2 picks 0; 94 s
  after the last input (90 s plus the 4 s fade); hidden tabs.
- **Transients.** A shooting star needs every refresh for about 1 s in every 12.6 s in the hero (about 8% of the time),
  a satellite every refresh for under 5 s in every 88 s.
- **Memory.** The atlas grows from 48 KB to about 0.7 MB at DPR 1 and from 127 KB to about 1.9 MB at DPR 2 (built in
  under 1.5 ms). The cell cache holds at most twice the cells in use.
- **Battery levers, in order of effect:** `DRIFT.speed` (at DPR 2 and 60 Hz, v₀ up to 3.3 keeps 30 fps, 4 needs 60);
  reading drift (D2: 0 lets the worker sleep while reading); `FRAME.idleSleepMs`; `PACING.narrowMaxFps`.
- **To measure before calling it done** (R3 risk 4): phone GPU fill on a low-end Android device (Chrome tracing), and
  the laptop numbers with the debug patch's per-frame JS times in a production build.

## 11. Accessibility conformance summary

| Criterion | Level | How the sky meets it |
|---|---|---|
| 2.2.2 Pause, Stop, Hide | A | Continuous motion (drift, twinkle) has a pause mechanism: one control that stops every moving part of the sky at once (G4, G186), at the top of the page, remembered, paused by default under reduced motion. Each transient lasts at most 5 s (T1), which passes on the per-instance reading the veil session also uses. The idle fade and the hero-only rules are battery and attention choices, not the 2.2.2 mechanism. |
| 2.3.1 Three Flashes or Below Threshold | A | At most 3 flashes per second (bursts staggered at least 0.35 s, no flares in bursts); every transient's changing area is at most about 2,000 CSS px², under 10% of the 21,824 px² limit (R2 §9.2); no saturated red (pale orange is 0.40 of R + G + B). |
| 2.3.3 Animation from Interactions | AAA | Interaction-driven motion (scroll parallax and its glide, the pointer lean) is off under prefers-reduced-motion (C39) and when paused. |
| 1.4.3 Contrast (Minimum) | AA | The veil's contrast budget is untouched: drift moves stars, never brightens them, and each star's quiet factor is taken at its drawn position every frame; only one transient may light up near copy at a time (the ink lease, T2), as the veil session's budget requires. |
| 2.5.8 Target Size (Minimum) | AA | The pause button is 40 × 40 CSS px (minimum 24 × 24). |
| 1.4.11 Non-text Contrast | AA | Green glyph on navy 14.1:1 (minimum 3:1); the focus ring is the site's 2px dashed green outline. |
| 4.1.2 Name, Role, Value | A | A native `button` with a constant name and `aria-pressed` (APG Button pattern). |
| 2.1.1 Keyboard | A | A native button: Tab, Space, Enter. |

## 12. Risks and open questions

1. **The veil work may never land.** Mitigation: P1 to P7 don't depend on it; PF (8.6) keeps every invariant with
   today's strict veil, on the user's go-ahead.
2. **Interface churn.** P9 depends on I1, a change inside `planFlight`. Mitigation: the `FlightLaw` callback is the
   smallest seam (their loop, our directions); fallbacks in 8.2.
3. **The headline may seem to move** when the drift heads vertically (induced motion, Duncker 1929). Mitigation: the
   faint majority stays nearly still (AC-17 checks it). If AC-17 fails, flatten the path's vertical part with one new
   constant (a y-scale in `driftAt`, say 0.5), accepting a minimum speed of 0.29 v₀ during vertical stretches.
4. **Composition wander.** Bright stars move up to 305 px (q = 1.6) from the reviewed frame over a few minutes; the
   reviewed composition holds only at the reveal. Quiet zones keep contrast; a shorter `DRIFT.period` (150 s) shrinks
   the wander about 17%.
5. **Continuous depth changes the reading composition.** The brightest stars follow up to 11% of the scroll instead of
   7%. Review the reading scene after P2.
6. **Battery on phones.** GPU fill is an estimate (R3 risk 4); the 30 fps narrow cap and the 20 fps typical rate are
   the hedges. Measure in P6.
7. **DPR-1 shimmer.** Where the eye resolves pixels, a moving σ 0.7 px star's brightest pixel swings about 20% (1-D) to
   35% (diagonal) even with phase sprites. Decide by eye on a DPR-1 monitor in P6; the fix is a floor of about 0.85
   device px on moving stars at DPR ≤ 1, which changes the resting look there.
8. **WebKit's worker clock** is unaligned and ignores Low Power Mode. Mitigation: draw every frame there (F2); P13 (D7) if
   device tests show judder or drain.
9. **More shooting stars mean more attention onsets** (Abrams and Christ 2003). If the 5-second test (AC-17) shows the
   background winning, raise `METEOR_RATE.hero.mean` before cutting anything else.
10. **Satellites at 4.8 s may read as slow meteors** (R2). Defenses: no wake, constant speed, steady light. The
    realistic version needs D9.
11. **Two WCAG 2.2.2 questions are unsettled** (w3c/wcag #4447 on repeated short animations, #4319 and #3766 on reduced
    motion as a mechanism). The plan takes the conservative side of both: 5 s per transient plus a pause control.
12. **Hidden navbar.** The navbar slides away while scrolling down (`Navbar.tsx:79`), taking the button with it until
    the visitor scrolls up. This is today's behavior for every nav item and is acceptable for G186 (the control is at
    the top of the page), but if D1 chooses the hero corner, the button scrolls away with the hero instead.
13. **No test runner** (D5). The invariants in 4.3 are proven per PR by the harness but not kept as tests; a later change
    could break them silently.
14. **Twinkle phases still jump after a hidden tab, and adaptive thinning still pops 20% of the stars in one frame** (R3
    §6). Both were true before; motion makes them a little more visible. Optional fixes: a sky clock that excludes
    hidden time for twinkle; a 1 s fade for thinned stars.

**Open questions for the judge and reviewers:**

- Should P2's continuous depth and P6's drift ship together (one visible change) or apart (as planned, for easier
  review and rollback)?
- Is a 10° climb limit (D8) right, or should a few short climbing meteors stay for realism?
- Should the end bookend's twinkle (0.8) and drift (0.8) stay as R1 and today's config set them, or match the hero?

## 13. Sources

**Next.js 16.4.2 docs** (`node_modules/next/dist/docs`): `01-app/01-getting-started/05-server-and-client-components.md`
(the `'use client'` boundary, lines 178 to 188; browser APIs need Client Components, line 26);
`01-app/02-guides/server-and-client-boundary.md` (Client Components also render on the server);
`01-app/02-guides/preventing-flash-before-hydration.md` (client-only preferences, `localStorage` in try/catch);
`01-app/03-api-reference/08-turbopack.md` and `01-app/02-guides/lazy-loading.md` (Turbopack analyzes `new Worker()`
expressions).

**Web platform and accessibility.** WCAG 2.2: SC 2.2.2 and its Understanding document, techniques G4, G186 and failure
F16; SC 2.3.1 and the flash thresholds, G19, G176; SC 2.3.3, C39; SC 2.5.8; SC 1.4.11
(https://www.w3.org/WAI/WCAG22/Understanding/, read from w3c/wcag by R2 and R4). w3c/wcag issues #3478, #4921, #4319,
#3766, #4447, #5029. WAI-ARIA Authoring Practices, Button pattern (https://www.w3.org/WAI/ARIA/apg/patterns/button/,
fetched 2026-10-27: a toggle's label must not change with its state). React, `useSyncExternalStore`
(https://react.dev/reference/react/useSyncExternalStore, fetched 2026-10-27: `getServerSnapshot` runs only during server
rendering and hydration). WHATWG HTML, animation frames and rendering opportunities
(https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames). MDN:
`requestAnimationFrame`, Optimizing canvas, `prefers-reduced-motion`. Browser sources as R3 cites them: Chromium
`worker_animation_frame_provider.cc`, Firefox `WorkerScope.cpp`, WebKit `WorkerAnimationController.cpp`; Skia
`SkGlyph.h` (4 sub-pixel positions per axis). Apple HIG, Motion and Accessibility. Vercel Web Interface Guidelines.

**Physics, perception and astronomy (via R1 and R2).** Longuet-Higgins and Prazdny 1980 (flow decomposition); Rogers
and Graham 1979 (motion parallax); Gibson 1950; Cutting and Vishton 1995; O'Shea, Blackburn and Ono 1994 (contrast as
depth); Schütz 2011 (transparent motion); Kaplan 1969 (accretion and deletion); Legge and Campbell 1981, McKee and
Nakayama 1984, Lappin et al. 2009, Harth et al. 2025 (motion thresholds); Abrams and Christ 2003 (motion onset);
Watson, Ahumada and Farrell 1986 (window of visibility); Diels and Howarth 2013 (sickness band); Duncker 1929 (induced
motion); CSS Values 4 reference pixel; IERS constants; Gaia DR3 (Proxima Centauri parallax); New Horizons parallax
(arXiv 2506.21666); Disney multiplane camera (D23). IMO 2026 shower calendar and ZHR formula; AMS sporadic and fireball
rates; NASA Meteoroid Environment Office (sporadic sources); Campbell-Brown 2005; the ω = V sin D / q relation (arXiv
2112.15507); Sky & Telescope on radiants; IAU meteor definitions; NASA Spot the Station; Mallama on satellite brightness;
NASA on comets.

**Numerics.** motion-dom 12.38.0 `spring.mjs` (the closed-form critically damped spring); LeVeque 2007 (Euler stability);
HyperPhysics, damped oscillators.

**Research reports**, for derivations this plan only summarizes: `research/R1-physics-depth.md` (§3 depth law, §4 drift,
§5 springs), `research/R2-meteors-bodies.md` (§4 window and radiants, §5 speed classes, §8 rates, §9 WCAG),
`research/R3-rendering-engineering.md` (§2 pacing, §3 sub-pixel, §4 cost and the quiet index, §7 transients),
`research/R4-design-and-history.md` (§1 the old sky, §2 principles, §3 the checklist).
