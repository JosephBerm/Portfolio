# PLAN (draft, experience-first): home sky ambient motion and transients

## 1. Title and status

- **What this is.** A planning draft for `PLAN.md`, written from the visitor's experience backwards. Nothing in `src/` has changed. A judge merges this draft with two others (domain-model-first, delivery-and-risk-first) into `PLAN.md`.
- **Date.** 2026-10-27. Worktree `S:/Documents/repos/Portfolio/.claude/worktrees/sky-ambient-motion`, branch `claude/quirky-carson-btv2u4`, `src/` identical to master 246c0aa. Next.js 16.4.2, React 19.3, TypeScript ~6.0, Motion 12.38, Node 24.
- **Inputs.** `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `research/R1-physics-depth.md` (R1), `R2-meteors-bodies.md` (R2), `R3-rendering-engineering.md` (R3), `R4-design-and-history.md` (R4), the code (`src/lib/sky/*`, `src/components/sky/*`, `Background.tsx` and its CSS module, the `data-sky-quiet` components, `Navbar.tsx`, `IntroGate.tsx`), and the Next.js 16.4.2 docs in `node_modules/next/dist/docs`. Numbers marked **[computed]** come from Node scripts in the session scratchpad (`.../scratchpad/plan-x/calc1.mjs`, `calc2.mjs`, `calc2b.mjs`, `phases.mjs`, `firstmin.mjs`, `directions.mjs`, `contrast.mjs`); none of them is in the repository. The new config blocks, `camera.ts`, the transient types with their compile-time spec registry, and `skyPause.ts` type-check against today's `src/lib/sky` with the repo's TypeScript 6.0.3 under `strict` and `noUncheckedIndexedAccess` (`.../scratchpad/plan-x/tscheck/`).
- **The veil-session dependency.** The meteor-veil session ("Stars and comment animation redesign") owns `veiledFrom`, `planFlight`/`planMeteor`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the `layout` handler) and the `scroll` handler. As of 2026-10-27 **its fix has not landed** and none of its promised numbers arrived (`origin/master-r26syw` holds only an `.env.example` commit). So:
  - Phases P0 to P6 (everything about the stars, the camera, pacing, presence and the pause control) are **independent** and can ship now.
  - Phases T1 to T4 (every transient change) are **blocked** until the veil commit lands, or until the user releases the veil ownership and Phase V0 (the fallback, §7.9) runs. Either path keeps the same invariants.

---

## 2. The end goal, worked backwards

Everything in this plan exists to make the scenes in this section true. Each scene lists what the visitor sees and feels, and the requirements at the end (§2.9) are derived from these scenes, not from the code.

### 2.1 The first sixty seconds on the hero (a laptop: 1440 × 900 CSS px, DPR 2, 60 Hz)

About 300 stars are on screen: about 16 bright ones, 70 of middle brightness and 220 faint ones (R1 §3.1, shares 5.1, 23.5 and 71.5%).

| Time after load | What the visitor sees | What makes it so |
|---|---|---|
| 0 to 3.0 s | The loader. | `IntroGate.tsx` (unchanged) |
| 3.0 s | The loader starts to lift and the dusk begins: the brightest stars come out first, the faint dust follows over about 1.3 s, and the blue-violet haze glows in at the upper right by 5.3 s. The stars are **already drifting, from zero speed**, so the motion never "starts": it grows as the stars appear. | `EMERGENCE` (`config.ts:164`), drift ease from the dusk (§6.1.5) |
| 3.75 s | The page is revealed. The hero copy rises in and settles by about 5 s; the navbar drops in, the pause control last. | `IntroGate.tsx:67`, `Navbar.tsx:152-161` |
| 5.25 to 6.0 s | The side rails fade in. | `SidePane.tsx:26` |
| 6.0 s | The drift is at full speed. The bright stars glide to the right at about 3 CSS px/s (a bright star moves its own width in about a second); the faint majority creeps at under 1 px/s, still unless you stare. Because the bright stars slide **over** the nearly still faint ones, the sky separates into depth: a window, not wallpaper. | one camera, depth from brightness (§6.1) |
| 6 to 63 s | The glide arcs slowly, like the real sky crossing the south. Counting from the dusk: up and to the right at first (24° at 10 s), nearly level by 30 s (8°), dipping down to the right near the end of the minute (−9° at 50 s, −37° at 60 s). Its speed swells to 1.2 times the mean around 20 to 30 s and eases to 0.67 by 60 s. It never stops, never reverses, never repeats. **[computed]** | epicycle phases chosen for the first minute (§6.1.4) |
| 8.25 to 10.75 s | The first shooting star: it ignites in open sky, streaks for about a second, cools to a mint wake and burns out, sometimes fading as it passes behind the headline's padding. | `METEOR.firstDelay` (`config.ts:237`), the veil |
| by 60 s | About **five** shooting stars (median 5; 4 to 6 in 82% of visits) **[computed]**. About 3 in 4 fall, some slant sideways, the odd one climbs a little. About 4 in 10 share one radiant, so over the minute you notice several fanning out from the same patch of sky: a shower. They differ in speed and colour: quick ones with mint tails, slow warm ones, white ones in between. Never two near the copy at once. | population model (§6.10), ink lease (§6.9) |
| some visits | A **satellite** (39% of visits within the first minute): a steady pale point sliding across the upper sky for under 5 s, no tail, no blinking, fading as it enters Earth's shadow and warming to orange. A **fireball** (12% within the first minute): slower, brighter and warm, sometimes with a flare and a faint mint train lingering about 2 s. | §6.11, §6.9 |
| always | The bright stars still breathe (twinkle), slowly, as today. Moving the mouse (if pointer lean ships) leans the near stars gently away from the cursor, up to 16 px for the brightest and about 3 px for the faint ones. | `catalog.ts:168-177`, §6.1.7 |

**What depth feels like.** Three cues agree, so the sky reads as space even to a passive viewer (R1 §1.3):

- the bright stars move faster than the faint ones (motion parallax);
- they are brighter and bigger (brightness and size, the same order);
- they fade out behind the copy's padding as they drift in and come back as they drift out (the copy covers the sky, so the copy is in front: occlusion).

**What calm feels like.** The faint majority (71% of the stars) barely moves, so it acts as the still frame of reference that keeps vection and induced motion away: the headline does not appear to slide (R4 §2.2: Duncker; Howard and Howard). Nothing starts, stops or reverses in one frame, and nothing in the sky oscillates at the 0.05 to 0.5 Hz rates that cause motion sickness (R4 §2.2).

### 2.2 Reading (scrolled into About and beyond)

- As the visitor scrolls, the stars move with the page at their own depths: the bright ones follow about 5 to 11% of the scroll, the faint ones about 2%. When the scroll stops, they **coast to rest within half a second** with no bounce, like a door on a closer (§6.1.6).
- The sky dims (near stars to 30%, today's `SCENE.reading`), stops twinkling, and launches no shooting stars or satellites.
- It still drifts, at 0.35 of the hero speed: the near stars at about 1 px/s (1.3 arcmin/s), the faint ones at 0.3 px/s. **Alive if you look, still if you read.** (D2 lets the owner choose 0, today's still reading sky.)
- A star drifting toward a paragraph fades out over the 40 px feather before it reaches the text; at 1 px/s that fade takes over half a minute, so nothing pops.

### 2.3 The end bookend (Contact and the footer)

The sky brightens back (stars 0.9, haze 0.7), twinkles again (0.8) and drifts at 0.8 of the hero speed: a farewell. No shooting stars by default (two "farewell meteors" are a could, D4).

### 2.4 A narrow phone (393 × 852 CSS px, canvas DPR 2)

- About 108 stars, and the hero copy covers most of the screen, so most stars near it stay dim.
- The drift clock runs at 0.6: the near stars move about 1.7 CSS px/s, which looks like 3 arcmin/s because a phone's CSS pixel looks about 1.35 times bigger at reading distance (R1 §4.2).
- Frames come 20 a second (at most 30), so the battery cost stays small.
- Shooting stars come every 21 s on average (the first at 4.5 to 7 s, a median of 3 in the first minute) and stop at 6 per visit, reached after about 2 minutes **[computed]**. No fireballs, satellites or pointer lean.
- The pause control is in the menu.

### 2.5 Under prefers-reduced-motion, and with the pause control

- **Reduced motion.** The dusk fades in as today, then the sky is perfectly still: no drift, twinkle, scroll parallax, glide, lean, shooting stars or satellites. Stars are drawn at whole pixels, exactly today's crisp points. The pause control starts in its paused state ("Play sky animation"), and pressing it is an explicit opt-in to motion.
- **Pressing pause** (full motion). Within about 0.6 s the drift slows to a stop, the twinkle settles to the resting glow, a flying shooting star fades out within a quarter second (from T1; until then it vanishes as today), and nothing new launches. The stars stay exactly where they stopped. The icon turns into a play triangle and the control is named "Play sky animation".
- **Pressing play.** The drift picks up from exactly where it stopped (WCAG technique G4), and scrolling moves the stars again from where they are, with no jump.
- **Persistence.** After a reload it is still paused; another open tab follows the change.

### 2.6 Lifecycle moments

- **Idle.** After 90 s with no input of any kind (scroll, pointer, keys, focus), the drift and the twinkle ease out over 4 s and the worker stops drawing. Any input eases them back over 4 s from the same place.
- **Hidden tab.** After a minute away, the sky is where it was (no leap by speed × time away), the twinkle continues where it left off, and no shooting star comes for 3 s.
- **Resize.** No star moves except as the new layout requires. Crossing the 640 px phone breakpoint changes speed, never position.
- **A big jump** (Home, End, find in page) snaps the sky to its new place instead of sweeping thousands of pixels.

### 2.7 The qualities, and what the sky must never do

- **Calm.** Less motion, more depth: the majority is still, a minority floats.
- **Alive.** Always some motion while the visitor is here, even without scrolling (the user's request).
- **Deep.** One law for every motion: nearer means brighter means faster.
- **Real.** Shooting stars have radiants, perspective and speed classes; satellites glide steadily and fade into Earth's shadow.
- **Respectful.** The copy wins. One event near the copy at a time, none while reading.
- **In the visitor's control.** One pause control; reduced motion means still.
- **Cheap.** Zero frames when idle, hidden or paused; about 1% of a laptop core while drifting.

The never-list (R4 §2.3, the old implementation's faults): no inverted depth, no sheets moving in lockstep, no reversals, loops or wrap seams, no zoom, warp or whole-sky rotation, no square or saturated dots, no edge pops, no pixel ticking or shimmer, no frantic or rhythmic shooting stars, nothing that blinks.

### 2.8 How it works, in plain words

- **The train window.** From a train, the fence rushes by, the trees glide and the mountains crawl. Nothing moves but you, and the speed differences tell you the distances. That is motion parallax, and it is the whole 3D effect here.
- **An honest diorama.** Real stars are so far away that no amount of moving shows parallax (R1 §2.1). So we build a diorama, like Disney's multiplane camera (1937): we pretend the stars hang at modest depths and move one camera past them. The physics inside the diorama is consistent; the diorama itself is a conceit, and the PR description should say so.
- **Streetlights.** On a street of identical lamps, the dimmer a lamp looks, the farther it is. Each star's depth is read from its brightness the same way, so the bright stars are near and fast, the faint dust far and slow (§6.1.1).
- **A boat on a mooring.** The camera floats rather than travels. Its path is a set of epicycles, Ptolemy's circles riding on circles: it always moves, never races, turns its heading a couple of degrees a second and never repeats, but stays within about 200 px of where it started, like a moored boat swinging on the tide (§6.1.4).
- **A door closer.** Scrolling hands the camera to a spring tuned like a door closer: it follows quickly and settles in half a second without bouncing (§6.1.6).
- **The ice-cube tray.** The pixel grid is an ice-cube tray and a star's light is a spoonful of water. Rounding always pours into the middle of a cell, so a drifting star hops a whole cell at a time (ticking). Smearing the pour makes the star blur and pulse as it crosses cell edges. Instead we pour 16 trays in advance, each at a different spot inside a cell, and set down the tray that matches where the star really is: it glides in quarter-pixel steps without blurring or pulsing (§6.3, R3 §3.6).
- **The drummer and the metronome.** A timer is a drummer who drifts against the band's metronome, so every so often a beat is held long and you hear a stumble. Animation frames divided by a whole number are a drummer who hits exactly every second or third click (§6.2, R3 §2.2).
- **Spark, ship, airplane.** A shooting star (what the user called "the comet") is a speck of dust burning up 100 km overhead: a spark off a grinding wheel, close, fast and gone. A comet is a mountain of ice millions of kilometres away: like a distant ship's lights on the horizon, huge but nearly still. A satellite is a machine lit by a Sun that has already set for you: an airplane at night with its blinking lights switched off (R2 §1).
- **Snow in the headlights.** Driving through falling snow at night, the flakes seem to stream out of one point ahead of the car. Meteors in a shower do the same; that point is the radiant (§6.10).
- **A one-lane bridge.** Text near the sky has a small brightness budget. Only one moving light may cross it at a time, and after one crosses, the bridge rests for 40 s (the ink lease and the crossing cooldown, §6.9).

### 2.9 Requirements derived from the experience

| ID | The visitor experiences | Measurable target | Design | Checks |
|---|---|---|---|---|
| E1 | Depth without input | Band median speeds: near/mid 1.98, mid/far 1.67 (both at least 1.6); faint median 0.85 px/s, at most 1.5 **[computed]** | §6.1 | AC-1, AC-2 |
| E2 | One coherent motion | Every star at `world − q·C`; one heading at any instant | §6.1 | AC-3 |
| E3 | Calm: no onsets, stops, reversals or rhythms | Speed 0.58 to 1.42 × v₀; turn at most 4.33°/s; speed change at most 3.8%/s; no energy in 0.05 to 0.5 Hz; every rate change eased | §6.1, §6.6 | AC-4′, AC-5, AC-6, AC-7′, AC-9 |
| E4 | Smooth at the pixel | Quarter-pixel phases; at most 0.5 device px per drawn frame; frames on display refreshes | §6.2, §6.3 | AC-10′, AC-11′, AC-12, AC-13 |
| E5 | The copy stays calm and readable | Exact quiet factor per star per frame; one lit transient near copy; crossings per minute at today's level | §6.4, §6.9 | AC-16, AC-17, AC-30, AC-36 |
| E6 | Shooting stars feel real and frequent | Median 5 in the first minute; varied radiants with a visible shower; ignite and burn out in open sky | §6.10 | AC-18 to AC-23 |
| E7 | Rare treats | Satellite in the first minute 39%; fireball 12% | §6.9, §6.11 | AC-24 |
| E8 | Reading is calm | Drift 0.35 ×; twinkle 0; no transients | §6.7 | AC-15′ |
| E9 | Phones are calmer and cheap | Clock 0.6 ×; at most 30 fps; at most 6 meteors per visit; no fireballs or satellites | §6.1, §6.2, §6.9 | AC-14, AC-20′ |
| E10 | The visitor is in control | Pause stops everything within 1 s, persists, resumes in place; reduced motion is still | §6.6, §6.8 | AC-26 to AC-28 |
| E11 | Nothing jumps | Hidden tab, idle, resize, DPR change, scene change, pause and resume; snap only beyond one viewport of scroll | §6.1, §6.6 | AC-9, AC-27, AC-32, AC-34, AC-35 |
| E12 | Scrolling feels physical | Glide settles 95% in 0.47 s, never overshoots | §6.1.6 | AC-35 |
| E13 | Light on the battery | 0 frames idle, hidden or paused; about 1% of a laptop core drifting | §6.2, §10 | AC-14, AC-33 |
| E14 | Accessible | WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3, 2.5.8, 1.4.11, 2.5.3, 2.4.11 | §6.8, §11 | AC-26 to AC-31 |

---

## 3. Decisions for the user

Each has a recommended default; the plan is written for the defaults.

| # | Decision | Recommended default | Alternatives and their cost |
|---|---|---|---|
| D1 | **The pause control and its placement** (WCAG 2.2.2, required once the drift ships) | In the navbar after Resume: a 40 × 40 px icon button on desktop, icon plus text in the mobile menu. It follows the W3C carousel "rotation control" pattern: the name says the action and changes with it ("Pause sky animation" / "Play sky animation"), the icon shows the action (two bars / a triangle), no `aria-pressed`. Persisted per browser, paused by default under prefers-reduced-motion, and an explicit choice wins over the OS default. | (a) A corner of the hero: "adjacent to the moving content" (G186), but it needs its own `'use client'` and joins the hero's quiet copy. (b) The footer only: weakest for G186, which asks for the top of the page or next to the motion. (c) An `aria-pressed` toggle with a constant name ("Pause sky animation", pressed = paused): a valid APG variant, but the pressed state then needs a visible cue of at least 3:1; a 10% mint tint is only 1.28:1 **[computed]**. Not acceptable: prefers-reduced-motion as the only mechanism (contested in w3c/wcag #3766 and #4319, R2 §9.1). |
| D2 | Reading-scene drift | 0.35 (R1, R4) | 0: today's still reading sky; the reading scene then draws 0 frames instead of 20 a second (§10). 0.5: livelier, the brightest stars at 3.4 px/s peak. |
| D3 | Pointer lean | Ship last (P6), desktop with a fine pointer and hover, hero only, full motion; reach 10 CSS px at q = 1 (brightest 16 px, faint about 3 px) | Skip it (the drift alone gives depth). Reach 7 (R4) or 12 (R1). Never device orientation (R1 §5.3). |
| D4 | Which "could" transients ship | With T2: stationary near-radiant flashes (they complete the on-screen radiant, which is in the must set). Later, after watching the new sky for a week: farewell meteors at the end bookend, then bursts. | Comet and planet change the reviewed composition, and a comet can read as a rendering bug (R4 risks); earthgrazers fit only wide screens. Each is a small, separate phase (§6.12). |
| D5 | A test runner | None. Dev-only harnesses in the scratchpad (Node 24 strips TypeScript types) plus browser checks, kept as acceptance evidence, not committed. | Vitest (one dev dependency and a config; fits the pure `src/lib/sky` modules). `node --test` with type stripping (no dependency, but every extensionless relative import in `src/lib/sky` needs a `.ts` extension or a loader). Optionally, a dev-only debug channel from the worker (R4 §3.3) for exact logging of drift and launches. |
| D6 | The drift speed v₀ | 3 CSS px/s at q = 1 | 2.5 (subtler); 4 (more obvious; the brightest stars reach 12 arcmin/s at peak, the edge of busy; 60 fps needed on DPR 2 screens). |
| D7 | The WebKit frame relay | Deferred: ship without it, test on an iPhone and macOS Safari | Add it (§7.12) if those tests show visible judder or a measurable Low Power Mode drain. |
| D8 | Climbing meteors | Allow them as the physics gives them, but only from sporadic sources and at most 0.6 of the longest path: about 7% of launches **[computed]** | Forbid paths more than 10° above horizontal (R4: "reads as a firework"). Or lower the window to 30°: 4% climb. |
| D9 | Realistic slow satellites (0.5 to 1°/s, up to 20 s) once the pause control exists | No: every transient stays at most 5 s, the invariant agreed with the veil session | Yes, after the veil session agrees to relax the 5-second invariant for clear-sky bodies. |

---

## 4. Domain model

### 4.1 Entities and their invariants

| Entity | What it is | Invariants |
|---|---|---|
| **Star** (`catalog.ts`) | A point on its layer's infinite plane: world position (CSS px), alpha from magnitude, shape, tint, keep, emergence delay, twinkle, and new: nearness `q` | `q = nearness(m)`, a pure function of the magnitude already drawn: no new random draw, so the catalog never changes, and retuning depth never moves a star at rest. `q` is in [0.24, 1.6] and never increases with magnitude. |
| **Layer** | A magnitude band with twinkle and quiet keeps | No longer carries a parallax value. Its nearness range `[q(faintest), q(brightest)]` (far 0.240 to 0.389, mid 0.389 to 0.741, near 0.741 to 1.600) bounds its cells for culling. |
| **Camera** (`camera.ts`) | One offset `C` (CSS px at q = 1) = scroll part + drift + lean, and its velocity | Every star is drawn at `world − q·C`. C is continuous in time except a snap when one step's scroll change exceeds one viewport. Stepped only by exact closed forms. |
| **Scroll spring** | A critically damped spring following the scroll | ω = 10 rad/s; starts at the restored scroll; frozen while motion is not full; resumes without a jump (`scrollShift`). |
| **Drift clock** | τ (s): the integral of a rate in [0, 1] | `drift = driftAt(τ)` is bounded by 70.8 × v₀ px; τ advances by at most 0.1 s per step and not at all while hidden or asleep. |
| **Lean springs** | Two critically damped springs toward the pointer | ω = 4 rad/s; target 0 without a fine pointer or outside the hero; held still, like the scroll spring, while motion is not full. |
| **Scene levels** (`scene.ts`) | Per-scroll multipliers: stars per layer, haze, twinkle, new drift and lean, the meteor launch gate | Continuous in scroll: a scene change never changes a level in one frame. |
| **Presence** | How present the visitor is: 1, easing to 0 before the idle sleep | One gate for twinkle and drift; inputs are scroll, pointer, keys, focus and visibility. |
| **Motion level** | 1 under full motion, 0 otherwise, eased | Time constant 0.2 s: 95% within 0.6 s. Scales twinkle and the drift rate. |
| **FrameDemand, Pacer, FrameClock** (`pacing.ts`, `frameClock.ts`) | What each part needs (fps, vsync), the divisor k, the animation-frame source | The strictest demand wins. Motion draws on every k-th display refresh; k drops at once and rises only after 0.5 s; motionless fades keep timers. |
| **QuietIndex** (`quietIndex.ts`) | Quiet zones bucketed by 64 px screen tile | Bit-identical to `easedQuietFactor` over all zones. Rebuilt only when the screen zones change. |
| **StarField** (`renderSky.ts`) | The cell cache | A cell visible this frame is never regenerated; the cache holds at most twice the visible cells. |
| **Transient** (`transients.ts`) | A short-lived sky event: `meteor` or `satellite` (more kinds later) | At most 5 s first light to last; screen-space; fades out when the page scrolls 20 px from its launch or motion stops; dropped when hidden or resized. |
| **TransientSpec** | How one kind is timed and planned | A kind without a spec fails to compile. |
| **Scheduler** (`TransientSchedule`) | One clock per kind, the active list, the visit's sources | Any two launches at least 3 s apart; at most one active per kind; narrow screens at most 6 per visit. |
| **InkLease** | Derived: an active transient with `nearCopy` | At most one at a time, held until it retires, then 40 s of clear-sky-only planning. |
| **SkyWindow** (`radiants.ts`) | The screen as a pinhole window on the sky | Longer side 60°, centre 40° above a horizon below the screen. |
| **Radiant, MeteorSource, SpeedClass** | Unit directions in the window's frame; one shower (σ 1.5°) and three sporadic sources (σ 15°) per visit; slow, medium, fast | Elevations weighted like real rates (density sin h cos h); sources are re-created when the layout changes. |
| **Pause store** (`skyPause.ts`, main thread) | The visitor's choice, or the OS default | An explicit choice wins; storage failures fall back to memory; other tabs follow through the `storage` event. |

### 4.2 Who owns what

```
MAIN THREAD                                            WORKER (sky.worker.ts and its files)
-----------                                            -------------------------------------
Navbar.tsx ('use client')                              message handlers
  └─ SkyPauseToggle.tsx ─┐                               init · resize · emerge · reveal · motion · visible
                         ▼                               contrast · activity · pointer · scroll* · layout*
           skyPause.ts (choice store) ◄─ storage event        │
                         │ subscribe                          ▼
SkyCanvas.tsx ('use client')                           tick(now)
  └─ mountSky.ts ── post ──────────────────────────►    ├─ updateTransients ─ transients.ts      [T1+]
       motion(), Motion scroll(), ResizeObserver,       │    ├─ meteor spec ─► planMeteor* ◄─ FlightSource (radiants.ts)
       quiet-rect measurement*, activity and            │    └─ satellite spec ─► satellites.ts
       pointer listeners                                 ├─ stepCamera ─ camera.ts ◄─ sceneAt (scene.ts), presence, motion level
                                                         ├─ frameDemand ─ pacing.ts ─► frameClock.ts (rAF ÷ k, watchdog)
                                                         └─ draw ─ renderSky.ts
                                                               ├─ drawLayer ◄─ catalog.ts (Star.q), quietIndex.ts ◄─ easedQuietFactor* (scene.ts)
                                                               │     └─ placeStar ◄─ skyAssets.ts (phase atlas)
                                                               └─ drawTransient ─► drawMeteor* · drawSatellite
* owned by the veil session until its commit lands
```

---

## 5. Architecture and module map

### 5.1 New and changed files

| File | Status | Runs on | Purpose | Phase |
|---|---|---|---|---|
| `src/lib/sky/camera.ts` | new | worker | Depth law, epicycle drift, exact springs, camera state and stepping | P1 (types), P5 |
| `src/lib/sky/pacing.ts` | new | worker | `FrameDemand`, `combineDemands`, `motionFps`, `refreshDivisor`, `createPacer`, `createRefreshEstimate` | P3 |
| `src/lib/sky/quietIndex.ts` | new | worker | Exact per-tile quiet index over `easedQuietFactor` | P2 |
| `src/lib/sky/transients.ts` | new | worker | Transient union, specs, scheduler, ink lease, scroll cancel | T1 |
| `src/lib/sky/radiants.ts` | new | worker | Sky window, radiants, sources, flight proposals | T2 |
| `src/lib/sky/satellites.ts` | new | worker | Satellite planning and state | T3 |
| `src/components/sky/frameClock.ts` | new | worker | Animation-frame wrapper: feature detection, `null` sentinel, watchdog, timer fallback | P3 |
| `src/components/sky/skyPause.ts` | new | main | The pause choice store (external store for React and `mountSky`) | P4 |
| `src/components/sky/SkyPauseToggle.tsx` | new | main (client) | The pause control | P4 |
| `src/components/icons/PauseSVG.tsx`, `PlaySVG.tsx` | new | main | Decorative glyphs in the shared `Icon` frame | P4 |
| `src/lib/sky/config.ts` | changed | worker | New blocks: `STAR_PHASES`, `STAR_EDGE`, `PACING`, `DEPTH`, `CAMERA`, `DRIFT`, `POINTER`, `TRANSIENTS`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR_KINDS`, `SATELLITE`; `SCENE.*.drift` and `lean`; `FRAME.motionEase`; `LAYERS` loses `parallax` | P1 to T3 |
| `src/lib/sky/catalog.ts` | changed | worker | `Star.q` | P1, P5 |
| `src/lib/sky/scene.ts` | changed | worker | `SceneLevels.drift` and `lean` only (the quiet functions are the veil session's) | P5, P6 |
| `src/lib/sky/protocol.ts` | changed | both (types) | `activity`, `pointer` (and phase-2 `tick`/`relay`) messages; `SkyMotion` doc | P4, P6 |
| `src/lib/sky/meteors.ts` | changed by the veil session, or by V0 | worker | `planMeteor` takes a `FlightSource` and options; `Meteor.nearCopy`, `speedClass`; `segmentTouches` exported | T2 |
| `src/components/sky/sky.worker.ts` | changed | worker | Demand-based scheduling, camera stepping, presence, motion level, transient list | P1 to T3 |
| `src/components/sky/renderSky.ts` | changed | worker | Two-axis culling, `placeStar`, quiet index, stamp eviction, `drawTransient`, `drawSatellite` | P1, P2, T1, T3 |
| `src/components/sky/skyAssets.ts` | changed | worker | Phased atlas with the separable painter | P1 |
| `src/components/sky/mountSky.ts` | changed | main | Pause store in `motion()`, presence pings, pointer messages | P4, P6 |
| `src/components/Navbar.tsx` | changed | main (client) | Renders the toggle; the header reappears when focus enters it | P4 |
| `src/components/icons/index.ts` | changed | main | Named re-exports of the two glyphs | P4 |
| `AGENTS.md` | changed | docs | Adds `frameClock.ts` to the worker-file list; notes the pause control | P3, P4 |

`Background.tsx` and `Background.module.css` do not change: the canvas stays a fixed, decorative layer hidden under forced colors and print (`Background.module.css:27-31`).

### 5.2 Import rules (AGENTS.md)

- `src/lib/sky/*` imports only its own files, by relative path (`./config`). `camera.ts`, `pacing.ts`, `quietIndex.ts`, `transients.ts`, `radiants.ts` and `satellites.ts` follow this; none uses React, `window`, `document`, the `@/lib` barrel or `@/lib/utils`. Type-only cycles (`radiants.ts` imports the `Point` type from `meteors.ts`, `meteors.ts` imports the `FlightSource` type from `radiants.ts`) are erased at build time and allowed.
- The worker's files in `src/components/sky` are `sky.worker.ts`, `renderSky.ts`, `skyAssets.ts` and, new, `frameClock.ts`. They import only `@/lib/sky/*` by file and each other. **P3 adds `frameClock.ts` to that list in AGENTS.md.**
- On the main thread, sky code imports only types and `@/lib/sky/color` from `src/lib/sky`. `skyPause.ts` and `SkyPauseToggle.tsx` import nothing from `src/lib/sky`; the pointer and activity constants live in `mountSky.ts`, like `DPR_CAP` (`mountSky.ts:17-18`).
- `SkyPauseToggle.tsx` has **no** `'use client'` directive: it is rendered only by `Navbar.tsx`, which already is the client boundary. Next.js: "Once a file is marked with `"use client"`, all of its imports and the components it directly renders are included in the client bundle. This means you don't need to add the directive to every component" (`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`, lines 178-180). AGENTS.md: "add `'use client'` only at the entry of an interactive subtree." Under D1's alternatives (a hero corner or the footer, both Server Components) the toggle file becomes an entry and gets the directive.
- No new worker entry: `mountSky.ts:80` keeps the literal `new Worker(new URL('./sky.worker.ts', import.meta.url))` that Turbopack emits as its own chunk (Turbopack docs list `new Worker()` among the expressions its magic comments support, `03-api-reference/08-turbopack.md:130`). New worker files are plain imports of that chunk.
- No Cache Components APIs anywhere (AGENTS.md).

### 5.3 The main-thread and worker split

The main thread only forwards facts (size, scroll, layout, preferences, presence, pointer) and holds the visitor's choice; it never does per-frame sky work (R4 §1.4: the old meteor forced 196 layouts in 3.5 s). Everything per frame stays in the worker. The pointer messages are coalesced to one per animation frame and the presence pings to one per second (§6.13).

---

## 6. Detailed design per area

### 6.1 Camera, depth and drift

#### 6.1.1 The law

```
Per star (fixed):   q = min(1.6, 10^(−0.14·(m − 1.57)))          nearness, from the magnitude already drawn
Per frame:          C = (drift.x + lean.x,  0.07·s + drift.y + lean.y)   CSS px at q = 1
                    screen = world − q·C                            one law for scroll, drift and lean
s:      the scroll spring (§6.1.6), following scrollY − scrollShift
drift:  driftAt(τ), τ the drift clock (§6.1.4, §6.1.5)
lean:   reach × (ℓx, ℓy), ℓ the lean springs (§6.1.7)
```

The depth law (R1 §3.3) keeps the reviewed per-layer parallax: the bands' mean shares of the scroll are 0.0717, 0.0350 and 0.0205 against today's 0.07, 0.04 and 0.02 (+2%, −12.5%, +2.5%) **[computed]**. The brightest stars follow up to 11.2% of the scroll (capped from magnitude 0.112 up), the faintest 1.7%.

| Band (share of stars) | q min | q median | q mean | q max |
|---|---|---|---|---|
| far (71.5%) | 0.240 | 0.284 | 0.293 | 0.389 |
| mid (23.5%) | 0.389 | 0.476 | 0.501 | 0.741 |
| near (5.1%) | 0.741 | 0.941 | 1.024 | 1.600 |

#### 6.1.2 Reconciling R1's bounded drift with R3's wrapping accumulators

- **R3** proposed per-layer drift accumulators (`offset += velocity × dt`), wrapped at 2^16 cells to stay inside the cell-key range, with `wrapCell` on every lookup.
- **R1** makes the drift a closed-form function of an integrated clock. The position never grows without bound: `|C_drift| ≤ 2 × Σ share·v₀/|ω_k| = 70.77 × v₀`, which is 212 px at q = 1 and 340 px for the brightest star at v₀ = 3 **[computed]**. A 6-hour simulation reaches 68.5 × v₀ (206 px) with this plan's phases.
- **The answer: R1's form, no wrap.** The total offset is bounded by the scroll term, at most 0.112 × the page height, plus 340 px of drift and 16 px of lean. For a 12,000 px page that is 1,700 px (7 cells); even a 33.5-million-pixel page (about the tallest a browser lays out) stays at 3.76 million px (14,681 cells), inside the key range of ±32,768 cells (`renderSky.ts:39`) **[computed]**. So `wrapCell` and `FIELD_PERIOD` are dropped. The guard becomes a doc comment beside the key with these bounds.
- **R4's concern is met too.** R4 insisted offsets be integrated and never computed as `speed × t`, so that a change of speed never rescales the accumulated offset and jumps the sky. Here the *clock* is integrated (`τ += rate × dt`) and the position is a function of τ, so any change of rate (scene, idle, pause) changes how fast the path is followed, never where the stars are.
- R3's precision point still holds and is met: positions are computed in doubles in JS (`star.x − q·C.x`) before anything reaches the float32 canvas; nothing goes through `ctx.translate`.

#### 6.1.3 Why epicycles, and how this reconciles with R4's AC-4 and AC-7

R4 asked for a near-constant heading (at most 15°/min of turning) and an offset that never comes back within 50 px. Those describe an unbounded "train window" pan. The settled design (brief, R1) is a **floating** camera, which the user asked for in so many words ("floating around"). Epicycles turn about 2°/s on average, so R4's AC-4 and AC-7 are rewritten for this model (AC-4′, AC-7′ in §9) while keeping their intent:

- no sudden turns: the heading turns at most 4.33°/s, smoothly, with no step **[computed]**;
- no rhythm: the three frequencies (0.0056, 0.0090 and 0.0134 Hz) are incommensurate and all far below the 0.05 to 0.5 Hz sickness band;
- no visible repetition: within 30 minutes, the closest match of any 60-s stretch of path to an earlier one is still 19 px off at q = 1 (at a 24-minute lag) **[computed]**;
- no reversal event: the heading reverses only gradually, over about 90 s, never in a frame;
- the composition wanders at most about 200 px from the reviewed sky, instead of drifting away for good.

#### 6.1.4 The path and its first minute

```
C_drift(τ) = Σ_k R_k · (cos(ω_k τ + φ_k) − cos φ_k,  sin(ω_k τ + φ_k) − sin φ_k)
ω_1 = 2π / P,  ω_k = ratio_k · ω_1,  R_k = share_k · v₀ / |ω_k|
speed |Ċ| ∈ [0.58, 1.42] · v₀ (never 0, never more than 1.42 v₀)
```

R1 flagged the phases as "to review". R1's phases (0.9, 2.4, 4.7) start the stars moving 61° **upward** and swing them to 32° downward within 30 s **[computed]**: the first impression would be the old sky's upward motion and a quick turn. This plan keeps R1's ratios, shares, period and speed and only picks new phases, so every bound and statistic above is unchanged. A search over all phases (72³ combinations, both turning directions) for the calmest first minute gives **φ = (0.44, 6.02, 1.75)** **[computed]**. With the 3-s ease from the dusk, by wall-clock time after the dusk:

| t | 5 s | 10 s | 20 s | 30 s | 40 s | 50 s | 60 s |
|---|---|---|---|---|---|---|---|
| Star heading (+ = up the screen, 0 = rightward) | 34° | 24° | 13° | 8° | 3° | −9° | −37° |
| Speed (× v₀) | 0.93 | 1.04 | 1.19 | 1.19 | 1.06 | 0.85 | 0.67 |

The first minute turns 1.34°/s on average (at most 3.93°/s) and stays within 24° of horizontal from 10 s to 50 s. It is rightward (westward), as R4 asked, and off the scroll axis, and it arcs from up-right to down-right like the real sky crossing the south. It also differs from the falling meteors, so the two never read as one flow (R4 §2.3).

#### 6.1.5 The drift clock

```
τ ← τ + rate · min(dt, DRIFT.maxStep)
rate = scene.drift · presence · motionLevel · duskEase · (narrow ? DRIFT.narrowRate : 1) · (driftAllowed ? 1 : 0)
duskEase = smoothstep(0, DRIFT.ease, t − exitAt)      0 before the dusk
driftAllowed: false only on a software canvas too slow for PACING.minFps within its budget (§6.2.4)
```

- **The ease starts at the dusk, not at the reveal** (a deviation from the brief; reason below). The stars come out already moving from zero speed; the drift is at full speed 3 s after the loader starts lifting, about 2.25 s after the reveal, as the side rails finish fading in and well before the first shooting star. Most of the ramp happens while the hero copy is still entering, when the eye is on the entrance. R3 (multiply by the dusk ramp) and R4 (ease in with the dusk, "never start it later") recommend the same; R1's "3 s after the reveal" would still be ramping up while the visitor reads the headline, and a motion onset is exactly what captures attention (Abrams and Christ 2003).
- Narrow screens and scenes change the **clock rate**, never the path radii, so crossing the 640 px breakpoint or changing scene changes speed, never position (R1 §4.3).
- `maxStep` (0.1 s) only matters after a stall: at 20 fps a step is 0.05 s.

#### 6.1.6 The scroll glide

```
goal = scrollTarget − scrollShift                          scrollTarget: parallaxScroll (frozen by the veil-owned scroll handler under reduced motion)
|goal − s| > viewport · CAMERA.snapViewports → s = goal, ṡ = 0    (Home, End, find in page)
otherwise one exact critically damped step (ω = 10):
	e = s − goal,  c = ṡ + ω·e,  d = e^(−ω·dt)
	s ← goal + (e + c·dt)·d
	ṡ ← (ṡ − ω·c·dt)·d
```

- 95% settled in 0.474 s, 99% in 0.664 s; Motion's equivalent is bounce 0 and visualDuration 0.52 s (R1 §5.1, motion-dom `spring.mjs`) **[computed]**.
- While scrolling at 1000 page px/s the stars trail by `2V/ω`: 14 px at q = 1, 22 px for the brightest, 4 px for the faint median; at 3000 px/s, 42, 67 and 12 px **[computed]**. They glide that far over half a second when the page stops, never overshooting (R1 proves the error stays one-signed for a ramp that stops).
- The spring starts at the restored scroll (`createCamera(scrollY)` at `init`), so a reload never glides.
- **Resume without a jump.** While motion is not full, the springs hold. When motion returns to full, `resumeCamera` sets `parallaxScroll = scrollY` and `scrollShift = scrollY − s`, so the goal equals where the stars are and scrolling continues from there. Without it, a visitor who paused, scrolled 3000 px and pressed play would see every star leap on the next scroll message (today `parallaxScroll` jumps the same way, `sky.worker.ts:465`). The worker sets `parallaxScroll` in its own `motion` handler; the veil-owned `scroll` handler is not touched.
- Explicit Euler is never used: at 10 fps it degenerates and after a 250-ms stall it overshoots by 27 to 33% (R1 §5.4).

#### 6.1.7 Pointer lean (P6, optional, D3)

**Reconciling R1 and R4.** R1 proposes 12 CSS px at q = 1 (brightest ±19, near ±12, mid ±6, far ±3.5). R4 proposes a virtual shift of 100 px times the old per-layer parallax (far 2, mid 4, near 7 px), which is 7 px at q = 1. This plan uses **10 px at q = 1**:

- the near-band median moves ±9.4 px, matching the ±10 points of the iOS motion-effect samples R1 cites;
- the brightest star moves ±16 px, inside R4's 5 to 20 px range for the nearest layer with room to spare;
- the faint median moves ±2.8 px, so the far majority stays the still frame of reference **[computed]**;
- the same law as scroll and drift (only the reach differs), so the depth order is identical in all three motions.

Springs: ω = 4 rad/s for both axes (R1 and R4 agree), 95% in 1.19 s. Target `reach × clamp(pointer, −1, 1) × scene.lean`, 0 when the pointer leaves or the window loses focus. Only `(hover: hover) and (pointer: fine)`, only full motion, mice and pens only (`pointerType !== 'touch'`).

#### 6.1.8 Speeds the visitor sees (v₀ = 3) **[computed]**

| Scene (rate) | Brightest (q 1.6) | Near median | Mid median | Far median | Faintest |
|---|---|---|---|---|---|
| Desktop hero (1) | 4.8 px/s (peak 6.8) = 6.2′/s | 2.8 (4.0) = 3.7′/s | 1.4 (2.0) = 1.9′/s | 0.85 (1.2) = 1.1′/s | 0.72 (1.0) |
| Desktop reading (0.35) | 1.7 (2.4) | 1.0 (1.4) = 1.3′/s | 0.5 (0.7) | 0.30 (0.42) | 0.25 |
| Desktop end (0.8) | 3.8 (5.5) | 2.3 (3.2) | 1.1 (1.6) | 0.68 (0.97) | 0.58 |
| Narrow hero (0.6) | 2.9 (4.1) = 5.2′/s | 1.7 (2.4) = 3.0′/s | 0.86 (1.2) | 0.51 (0.73) | 0.43 |
| Narrow reading (0.21) | 1.0 (1.4) | 0.59 (0.84) | 0.30 | 0.18 | 0.15 |

Arcminutes use 1.3′ per CSS px on desktop and 1.8′ on phones (R1 §4.2). The far band sits at about the threshold of noticing motion (1 to 2′/s, R1 §4.2), the near band at three to four times it.

#### 6.1.9 Config (`config.ts`)

```ts
/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen (CAMERA): 1 at
 * magnitude `reference`, the near band's mean. Identical lamps would give q = 10^(-0.2 (m - reference)), the
 * inverse-square law; `compression` keeps about 70% of that depth range, as STAR_ALPHA keeps a 400:1 flux range as
 * 5:1, so the faintest stars still move (q 0.24) and the brightest never race (`maxNearness`, from magnitude 0.11 up).
 * The bands' mean shares of the scroll come out at 0.072, 0.035 and 0.0205, the reviewed parallax within 13%. No
 * random draw depends on it, and a star at rest (the camera at 0) never moves when it is retuned.
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const

/**
 * The one camera the sky is seen through: a star of nearness q (DEPTH) appears at its place on the sky minus q times
 * the camera's offset (CSS px), whatever moves the camera (the scroll, the drift, a pointer lean), so nearer stars
 * always move more and the depth cues never disagree. Scrolling moves it `scrollParallax` of the scroll through a
 * critically damped spring of `scrollOmega` rad/s: when the page stops the stars glide on and settle (95% in 0.47 s,
 * never overshooting; Motion's spring with bounce 0 and visualDuration 0.52 s). A change of more than `snapViewports`
 * viewport heights in one step (Home, End, find in page) snaps instead of sweeping the sky. A spring within `settle`
 * px of its goal and slower than `settle` px/s has settled.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, snapViewports: 1, settle: 0.01 } as const

interface Epicycle {
	/** Frequency as a multiple of the main circle's (negative turns the other way). */
	ratio: number
	/** Speed as a share of DRIFT.speed. */
	share: number
	/** Starting angle (radians). */
	phase: number
}

/**
 * The floating drift, in CSS px for a star of nearness 1: epicycles, circles riding on circles. A main circle turns
 * once every `period` seconds and smaller ones ride on it at irrational frequency ratios, so the path never repeats,
 * its heading turns about 2° a second (at most 4.3°) and its speed stays within `speed` × (1 ± 0.42): always moving,
 * never racing, never stopping. On a laptop (about 1.3 arcmin per CSS px) the near stars float at about 4 arcmin/s and
 * the faint ones at about 1, three times and once the slowest motion people notice. The phases start the first
 * minute gliding rightward, within 24° of level from 10 s to 50 s and arcing from up-right to down-right like the sky
 * across the south. The path is a pure function of a drift clock and stays within 70.8 × `speed` px of its start
 * (212 px at 3 px/s), so offsets stay small and nothing wraps. The clock runs at scene × presence × motion level,
 * `narrowRate` on narrow screens (their CSS px look about 1.35 times bigger), eases in over `ease` seconds from the
 * dusk, and advances at most `maxStep` seconds per frame, so a stalled frame or a returning tab never jumps the sky.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.44 },
		{ ratio: -1.618, share: 0.3, phase: 6.02 },
		{ ratio: 2.414, share: 0.12, phase: 1.75 },
	],
	narrowRate: 0.6,
	ease: 3,
	maxStep: 0.1,
} as const satisfies { speed: number; period: number; epicycles: readonly Epicycle[]; narrowRate: number; ease: number; maxStep: number }

/**
 * Leaning toward the pointer (mice and pens on hover-capable screens, the hero, full motion): the camera moves up to
 * `reach` CSS px at nearness 1 toward a pointer at the viewport's edge, through critically damped springs of `omega`
 * rad/s (95% in 1.2 s), so the stars slide gently away from it, the brightest about 16 px and the faint ones about 3:
 * the same law as scrolling. The iOS motion-effect samples use about ±10 points.
 */
export const POINTER = { reach: 10, omega: 4 } as const
```

`SCENE` gains two levels per scene (keep the existing doc and extend it: "a dimmer, slower sky while reading"):

```ts
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1, lean: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35, lean: 0 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8, lean: 0 },
```

`LAYERS` and `LayerConfig` lose `parallax` (`config.ts:58-59`, `78-80`); the `LAYERS` doc becomes "magnitude bands, twinkle and how much light each keeps behind quiet copy; depth comes from each star's magnitude (DEPTH)".

#### 6.1.10 `src/lib/sky/camera.ts`

```ts
import { CAMERA, DEPTH, DRIFT, LAYERS, POINTER, type SkyLayer } from './config'

/** A 2D offset (CSS px) or velocity (CSS px/s). */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: where it is and how fast it moves (per second). Stepped in place. */
export interface Spring {
	value: number
	velocity: number
}

/** Main angular frequency of the drift (rad per drift-clock second). */
const MAIN = (2 * Math.PI) / DRIFT.period

/** Peak drift speed as a multiple of DRIFT.speed: all circles aligned (1.42). */
export const DRIFT_PEAK = DRIFT.epicycles.reduce((sum, circle) => sum + circle.share, 0)

/** Nearness q of a star of magnitude m: its share of the camera's motion (DEPTH). */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Nearness range [faintest, brightest] of a layer's magnitude band, for culling its cells. */
export function layerNearness(layer: SkyLayer): readonly [number, number] {
	const [brightest, faintest] = LAYERS[layer].magnitude
	return [nearness(faintest), nearness(brightest)]
}

/** The drift at drift-clock time `clock` (s) and its velocity per clock second, CSS px at nearness 1; zero at 0. */
export function driftAt(clock: number, position: Vec, velocity: Vec): void {
	position.x = position.y = velocity.x = velocity.y = 0
	for (const { ratio, share, phase } of DRIFT.epicycles) {
		const w = MAIN * ratio
		const radius = (share * DRIFT.speed) / Math.abs(w)
		const angle = w * clock + phase
		position.x += radius * (Math.cos(angle) - Math.cos(phase))
		position.y += radius * (Math.sin(angle) - Math.sin(phase))
		velocity.x -= radius * w * Math.sin(angle)
		velocity.y += radius * w * Math.cos(angle)
	}
}

/**
 * One critically damped step toward `target` over `dt` s, exact for any dt: x(t) = target + (e + (v + ωe)t)e^(-ωt).
 * A 15 fps timer, a 120 Hz display and a frame after a stall follow the same curve, and it never overshoots from rest
 * (motion-dom resolves critically damped springs with the same closed form).
 */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number): void {
	const error = spring.value - target
	const slope = spring.velocity + omega * error
	const decay = Math.exp(-omega * dt)
	spring.value = target + (error + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
	if (Math.abs(spring.value - target) < CAMERA.settle && Math.abs(spring.velocity) < CAMERA.settle) {
		spring.value = target
		spring.velocity = 0
	}
}

/** What the camera follows this step. */
export interface CameraTarget {
	/** Drift-clock rate, 0-1: scene × presence × motion level × dusk ease × narrow rate (§6.1.5). */
	driftRate: number
	/** The scroll the sky follows (CSS px); held while `moving` is false. */
	scroll: number
	/** Viewport height (CSS px): a larger scroll change in one step snaps. */
	viewport: number
	/** Lean toward the pointer, -1..1 per axis, already scaled by the scene's lean level. */
	leanX: number
	leanY: number
	/** Full motion: the springs move. Otherwise they hold (reduced motion, the pause). */
	moving: boolean
}

/** The camera, mutated in place so no frame makes garbage. */
export interface CameraState {
	/** Drift clock (s). */
	clock: number
	/** Scroll spring (page CSS px) and the scroll it skipped while holding still. */
	scroll: Spring
	scrollShift: number
	leanX: Spring
	leanY: Spring
	/** Worker-clock seconds of the last step; null after a pause, so the next step is empty. */
	steppedAt: number | null
	/** Offset (CSS px at nearness 1) and velocity (CSS px/s) after the last step. */
	offset: Vec
	velocity: Vec
}

export function createCamera(scroll: number): CameraState
/** Advances to `t` (s): springs by the true elapsed time, the drift clock by at most DRIFT.maxStep. */
export function stepCamera(camera: CameraState, t: number, target: CameraTarget): void
/** Forgets the clock (sleep, hidden tab): the next step starts from here with dt 0. */
export function pauseCamera(camera: CameraState): void
/** Motion is back: the sky keeps its place and follows the scroll from here. */
export function resumeCamera(camera: CameraState, scroll: number): void
/** Upper bound of any star's on-screen speed (CSS px/s) right now: maxNearness × (drift peak × rate + spring speeds). */
export function cameraSpeedBound(camera: CameraState, target: CameraTarget): number
/** True when nothing moves until the target changes: a drift rate of 0 and every spring settled (held springs count as settled). */
export function cameraAtRest(camera: CameraState, target: CameraTarget): boolean
```

`stepCamera` in full (the others are a few lines each):

```ts
/** Scratch vectors for driftAt, so a step allocates nothing. */
const drift: Vec = { x: 0, y: 0 }
const driftVelocity: Vec = { x: 0, y: 0 }

export function stepCamera(camera: CameraState, t: number, target: CameraTarget): void {
	const dt = camera.steppedAt === null ? 0 : Math.max(0, t - camera.steppedAt)
	camera.steppedAt = t
	if (target.moving) {
		const goal = target.scroll - camera.scrollShift
		if (Math.abs(goal - camera.scroll.value) > target.viewport * CAMERA.snapViewports) {
			camera.scroll.value = goal
			camera.scroll.velocity = 0
		} else stepSpring(camera.scroll, goal, CAMERA.scrollOmega, dt)
		stepSpring(camera.leanX, target.leanX * POINTER.reach, POINTER.omega, dt)
		stepSpring(camera.leanY, target.leanY * POINTER.reach, POINTER.omega, dt)
	}
	camera.clock += target.driftRate * Math.min(dt, DRIFT.maxStep)
	driftAt(camera.clock, drift, driftVelocity)
	camera.offset.x = drift.x + camera.leanX.value
	camera.offset.y = CAMERA.scrollParallax * camera.scroll.value + drift.y + camera.leanY.value
	camera.velocity.x = driftVelocity.x * target.driftRate + camera.leanX.velocity
	camera.velocity.y = CAMERA.scrollParallax * camera.scroll.velocity + driftVelocity.y * target.driftRate + camera.leanY.velocity
}
```

Before and after: today each layer moves rigidly by `parallaxScroll × LAYERS[layer].parallax` on y only (`renderSky.ts:100`) and nothing moves without scrolling. After, every star moves by its own `q` on both axes, scroll is smoothed, and the drift runs while the visitor is present.

### 6.2 Pacing and the frame clock (R3 is primary)

#### 6.2.1 Demands

```
transient moving · scrolling under full motion ................ { fps: ∞,                        vsync: true }
camera not at rest (drift rate > 0, or a spring settling) ...... { fps: motionFps(bound, dpr),     vsync: true }
lingering train · scrolling under reduced motion · dusk ·
  quiet ease · motion level still easing ..................... { fps: FRAME.fadeFps (30),        vsync: false }
twinkle (full motion, present, scene twinkle > 0) ............. { fps: 15 (10 after ADAPT step 1), vsync: false }
the strictest wins:  fps = max,  vsync = any moving demand
```

`motionFps(v, dpr) = v > 0 ? max(PACING.minFps, v · dpr / PACING.stepPx) : 0`. The camera demand uses `cameraSpeedBound`, the drift's **peak** speed at the current rate (`DRIFT_PEAK × DRIFT.speed × rate × maxNearness`) plus the springs' current speeds, not the instantaneous drift speed. The epicycle speed beats between 0.58 and 1.42 v₀ every minute or so; using the bound keeps k steady instead of switching between 20 and 30 fps with the beat.

#### 6.2.2 The divisor

```
k = max(⌊Hz / fps⌋, ⌈Hz / cap⌉, 1)         cap = 30 on narrow screens, 30 after ADAPT step 1, the software budget, else ∞
lower k at once; raise k only after the lower need has lasted PACING.slowDownAfter (0.5 s)
draw on an animation frame when needsDraw, or when ≥ (k − ½) refresh intervals have passed since the last draw
```

On WebKit's unaligned 15 ms worker clock (median interval 14.6 to 15.4 ms) the need is not divided (k = 1), as R3 says, **but the caps still apply**: an iPhone (narrow) draws every third tick, 22.2 fps. Reading R3's flowchart, the caps are global; at phone drift speeds each drawn step is 0.37 device px, and the held-frame error stays about a third of a step, invisible, while drawing at 66.7 Hz on a phone would ignore the battery cap the narrow screens exist for.

| Scene | DPR | fps need | 60 Hz | 120 Hz | 144 Hz | WebKit (66.7 Hz) |
|---|---|---|---|---|---|---|
| Desktop hero | 1 | 20.0 | k 3: 20 fps, 0.34 device px/frame | k 6: 20 | k 7: 20.6 | k 1: 66.7, 0.10 |
| Desktop hero | 2 | 27.3 | k 2: 30 fps, 0.45 | k 4: 30 | k 5: 28.8 | k 1: 66.7, 0.20 |
| Desktop reading | 2 | 20.0 | k 3: 20 fps, 0.24 | k 6: 20 | k 7: 20.6 | k 1: 66.7 |
| Desktop end | 2 | 21.8 | k 2: 30 fps, 0.36 | k 5: 24 | k 6: 24 | k 1: 66.7 |
| Narrow hero (cap 30) | 2 | 20.0 | k 3: 20 fps, 0.41 | k 6: 20 | k 7: 20.6 | k 3: 22.2, 0.37 |
| Narrow reading (cap 30) | 2 | 20.0 | k 3: 20 fps, 0.14 | k 6: 20 | k 7: 20.6 | k 3: 22.2 |

**[computed]**; every case keeps the step at or under 0.5 device px.

#### 6.2.3 `src/lib/sky/pacing.ts`

```ts
import { PACING } from './config'

/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Frames per second: 0 for none, Infinity for every animation frame. */
	fps: number
	/** It moves: frames must be animation frames, so each lands on a display refresh. */
	vsync: boolean
}

/** Nothing to draw. */
export const NO_FRAMES: FrameDemand = { fps: 0, vsync: false }

/** The strictest of several demands. */
export function combineDemands(demands: readonly FrameDemand[]): FrameDemand
/** Frames per second that keep a speed of `cssPxPerSecond` under PACING.stepPx device px per frame (0 at rest). */
export function motionFps(cssPxPerSecond: number, dpr: number): number
/** Draw on every k-th refresh: the largest k that still meets `fps`, at least the k that keeps under `capFps`. */
export function refreshDivisor(refreshHz: number, fps: number, capFps?: number): number

/** The divisor in use: it drops at once and rises only after a lower need has lasted PACING.slowDownAfter s. */
export interface Pacer {
	readonly k: number
	update(wanted: number, t: number): number
}
export function createPacer(): Pacer

/** The display's refresh interval, from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes (1000/60 until measured): the median of the last PACING.refreshSamples, ignoring gaps over 1.5 intervals. */
	readonly interval: number
	/** The frames come from a fixed timer (WebKit's 15 ms worker clock), not the display. */
	readonly unaligned: boolean
	sample(timestamp: number): void
	/** Forget the last timestamp after a pause, so the gap is not taken for a refresh. */
	pause(): void
}
export function createRefreshEstimate(): RefreshEstimate
```

```ts
/**
 * Frame pacing for moving stars (FRAME keeps the timer paths for motionless fades and twinkle). Moving stars draw on
 * animation frames, every k-th display refresh, so every frame lands on a refresh and holds the same time and the sky
 * never stutters; a chained timer drifts against the display and holds one frame in 16 for an extra refresh.
 */
export const PACING = {
	/** Largest step per frame (device px) that reads as continuous: under a third of the smallest star's width (1.65 device px), two quarter-pixel phases. */
	stepPx: 0.5,
	/** Fewest frames a second for moving stars: below about 20 even sub-pixel steps read as separate updates. */
	minFps: 20,
	/** Narrow screens: phone GPUs pay most for a full-screen frame. */
	narrowMaxFps: 30,
	/** After the first adaptive step (ADAPT). */
	slowMaxFps: 30,
	/** Share of one core a software-rasterized canvas may spend on moving stars; below minFps the stars hold still. */
	softwareCpuShare: 0.08,
	/** Seconds a lower need must last before the frame rate drops (raising it is immediate). */
	slowDownAfter: 0.5,
	/** Animation-frame intervals whose median estimates the refresh. */
	refreshSamples: 16,
	/** A median interval in this range (ms) is WebKit's fixed worker clock, not a display: k is 1 unless a cap needs more. */
	unalignedMs: [14.6, 15.4],
	/** A requested animation frame that has not come after this long (ms) while visible is answered by a timer. */
	watchdogMs: 250,
	/** After this many missed frames in a row the clock stays on the timer. */
	watchdogStrikes: 3,
	/** Rate of the timer clock (Hz). */
	fallbackFps: 60,
} as const
```

#### 6.2.4 `src/components/sky/frameClock.ts` (new worker file)

```ts
import { PACING } from '@/lib/sky/config'

/** The parts of DedicatedWorkerGlobalScope the clock uses; either may be missing. */
export interface AnimationFrameScope {
	requestAnimationFrame?(callback: (time: number) => void): number
	cancelAnimationFrame?(handle: number): void
}

/**
 * Animation frames from the worker, answered by a timer where they never arrive (Chrome returns id 0 and never calls
 * back when its frame provider is invalid; ids may wrap to 0, so null marks "nothing pending").
 */
export interface FrameClock {
	/** Asks for one frame; `onFrame` gets its timestamp (ms). Nothing happens while one is pending. */
	request(): void
	cancel(): void
	readonly pending: boolean
}

export function createFrameClock(scope: AnimationFrameScope, onFrame: (time: number) => void): FrameClock
```

Behaviour: request rAF when available; arm a `PACING.watchdogMs` timer; a callback clears it; a timeout answers with `onFrame(performance.now())` and counts a strike; `watchdogStrikes` in a row switch to a `1000 / fallbackFps` timer for the rest of the visit. `cancel()` clears both (hidden tab, sleep), so the watchdog never fires while the worker is meant to be asleep.

**Software raster.** `probeRaster` (`sky.worker.ts:309-320`) already times one full frame. Keep that time as `rasterMs` (scaled to the canvas after ADAPT step 2). The software cap is `⌊PACING.softwareCpuShare × 1000 / rasterMs⌋` fps; below `PACING.minFps` the drift is not allowed (`driftAllowed = false`), so the stars hold still as today while scroll parallax and meteors keep working. A 1440 × 900 software canvas at CSS resolution (3.3 to 3.9 ms) drifts at about 20 to 22 fps for about 8% of a core; a 4K one (29 ms) holds still (R3 §6).

### 6.3 Sub-pixel phase sprites (R3 §3)

- **Atlas.** Each (tint, shape) gets a 4 × 4 block of sprites pre-rendered at quarter-pixel phases (i/4, j/4), all normalized by the **phase-0** peak so every phase carries the same light. Phase 0 is byte-identical to today's sprite. The meteor row keeps one sprite (the head is drawn fractionally). The atlas grows from 127 KB to 1.77 MB at DPR 2 (0.67 MB at DPR 1).
- **Painter.** Today's `gaussianAt` (`skyAssets.ts:45-55`) is a 4 × 4 supersampled Gaussian, which is separable: `gaussianAt(dx, dy) = g(dx) · g(dy)` with `g(d) = ¼ Σ_s exp(−(d + (s + ½)/4 − ½)² / 2σ²)`. A per-axis `profile` makes all 16 phases in under 1 ms (today's painter would take 151 ms at DPR 2).
- **Placing a star.** R3's `placeStar` (R3 §9.2): `floor` plus the rounded quarter phase, carrying a phase of 4 into the next whole pixel; `snap` (motion not full) uses `Math.round` and phase 0, exactly today's points.
- **Why.** Rounding makes a drifting star tick (a hop every 167 ms at 3 px/s on DPR 2); bilinear `drawImage` at (0.5, 0.5) drops a σ 0.7 px star to 0.504 of its peak, widens it 24% and makes it pulse at v·dpr Hz, 6 Hz for the far layer (R3 §3.2). With phases, a moving star keeps its flux and width exactly, and its perceived peak varies 1 to 10% on DPR 2 screens.
- **DPR 1 caveat (R3 §3.5).** Where pixels are resolved, even an ideal renderer shows about a 20% max-pixel swing in 1-D motion at σ 0.7 device px. Judge it by eye in P5; if needed, raise the moving-star floor to 0.85 device px on DPR ≤ 1 (a `MIN_CORE_SIGMA_DEVICE_PX`-style constant applied only when `snap` is false).

```ts
/**
 * Sub-pixel positions per device pixel and axis in the star atlas (4, like Skia's glyph cache): a moving star is drawn
 * from the sprite pre-rendered at its nearest quarter-pixel phase, at a whole pixel, so it glides without blurring or
 * pulsing. Phase 0 is today's sprite, byte for byte.
 */
export const STAR_PHASES = 4

/**
 * Stars this far beyond an edge (CSS px) are still drawn, so a halo never pops in at the border: the largest sprite's
 * half-side is about 9 CSS px (3 sigmas of the 2.8 px halo) at any pixel ratio. Moved here from renderSky.ts, where
 * drawLayer culls with it, so the quiet index (§6.4) covers the same margin.
 */
export const STAR_EDGE = 24
```

`skyAssets.ts`: `StarAtlas.stars` is indexed by `starSpriteIndex(tint, shape, phaseX, phaseY) = ((tint × STAR_SHAPES.length + shape) × STAR_PHASES + phaseY) × STAR_PHASES + phaseX`; `profile(size, sigma, phase): Float64Array` replaces `gaussianAt`; `paintSprite` (`skyAssets.ts:63-78`) takes `phaseX`, `phaseY` and divides by the phase-0 peak; `buildStarAtlas` (`skyAssets.ts:81-120`) lays out the 4 × 4 blocks.

### 6.4 The quiet index (R3 §4.2)

- **What.** Screen tiles of 64 px, covering the viewport plus `STAR_EDGE`, each holding the zones (in order) whose padded box grown by the reach touches it, for both the `from` and the `to` sets of the veil session's `QuietBlend`. `factor(x, y, keeps)` calls `easedQuietFactor` on the tile's subsets, always (an empty tile still goes through it, so even the blend arithmetic during an ease matches bit for bit).
- **Why it is exact.** `quietAt` and `inkAt` skip every zone farther than the feather, and both take a maximum over the rest; a tile keeps every zone that can reach any point in it, in the same order. So it computes the same maximum of the same values, and R3 measured max |diff| = 0 over 4 viewports, 2 rect counts, 2 ease states and 40 camera offsets.
- **Why it matters now.** With drift, every star is evaluated on every drawn frame: today's lookup costs up to 1.3 to 1.7 ms per frame mid-ease at 4K with 64 rects, the index 0.14 to 0.32 ms.
- **Rebuild** only when the screen zones change (scroll, layout, an ease starting or ending), never on a drift frame. The tile blends' `level` is copied every frame (a few hundred tiles).
- **Ownership.** It wraps `easedQuietFactor` and consumes `quietBlend(t)` unchanged; both stay the veil session's. Its reach is one constant, to be replaced by the veil session's `QUIET_REACH` export (IR-3). Meteors keep their own full checks.

```ts
// src/lib/sky/quietIndex.ts
import { QUIET } from './config'
import type { SkyRect } from './protocol'
import { easedQuietFactor, type QuietBlend, type QuietKeeps } from './scene'

/** Side of the index's screen tiles (CSS px). */
const TILE = 64

/** How far beyond its padded rect a zone can dim a point: quietAt fades over the feather, inkAt reaches less. Becomes scene.ts's QUIET_REACH (IR-3). */
const REACH = QUIET.feather

/** The quiet zones bucketed by screen tile: a star reads only the zones within reach, with the same result bit for bit. */
export interface QuietIndex {
	/** Rebuilds the buckets when the zones changed; cheap to call every frame. */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps), reading only the zones near (x, y). */
	factor(x: number, y: number, keeps: QuietKeeps): number
}
export function createQuietIndex(): QuietIndex
```

### 6.5 The star-field cache

Replace the full clear (`renderSky.ts:47-49`, `cells.clear()` past 4 × the visible cells) with stamp-based eviction: `beginFrame()` bumps a frame counter, `cell()` stamps what it returns, and `trim()` deletes cells not stamped this frame once the cache holds more than twice the cells looked up this frame.

- **Smaller than R3 assumed.** R3 sized this for unbounded drift accumulators (the clear firing every 7 to 17 minutes). With the bounded drift (§6.1.2) the drift adds at most about ±1.3 cells at the brightest stars' depth, so the cache grows mainly with long scrolls, as today.
- **Still worth it.** When the clear does fire (a long page on a large screen), it regenerates every visible cell in one frame, a 0.25 to 1.2 ms hitch at 4K plus garbage collection (R3 §5.3), and on a moving sky a hitch shows as a stutter. Stamps evict only cells nobody sees.
- `EDGE` (24) moves to `STAR_EDGE` (§6.3). The key comment (`renderSky.ts:38`) gains the bound from §6.1.2.

```ts
export interface StarField {
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Starts a frame: cells looked up from now on count as visible. */
	beginFrame(): void
	/** Drops cells this frame did not use, once the cache holds more than twice the visible ones. */
	trim(): void
}
```

`drawLayer` (`renderSky.ts:96-137`) after P1 and P2, in outline:

```ts
const [qFar, qNear] = layerNearness(layer)
const { x: camX, y: camY } = frame.camera
const x0 = Math.floor((Math.min(camX * qFar, camX * qNear) - STAR_EDGE) / CELL_SIZE)
const x1 = Math.floor((Math.max(camX * qFar, camX * qNear) + frame.width + STAR_EDGE) / CELL_SIZE)
const y0 = Math.floor((Math.min(camY * qFar, camY * qNear) - STAR_EDGE) / CELL_SIZE)
const y1 = Math.floor((Math.max(camY * qFar, camY * qNear) + frame.height + STAR_EDGE) / CELL_SIZE)
// per star: doubles first, then the canvas
const x = star.x - camX * star.q
const y = star.y - camY * star.q
// cull, emergence, frame.quietIndex.factor(x, y, config), twinkle (frame.twinkleTime) as today, then:
const sprite = placeStar(assets.atlas, star, x * frame.dpr, y * frame.dpr, frame.snap)
```

### 6.6 Presence, idle and the motion level

- **Presence** is today's `idleTwinkle` (`sky.worker.ts:92-94`) renamed `presenceLevel(now)`, still built on `FRAME.idleSleepMs` (90 s) and `idleFadeMs` (4 s). `noteInput` (`sky.worker.ts:107-114`) is now also called by the new `activity` message (pointer moves, pointer downs, keys, focus; §6.13) and later by `pointer`. Twinkle and the drift rate both use it: one gate (DRY). At 90 s without input both have eased to 0, the camera keeps its position (`pauseCamera`), and the worker sleeps.
- **Motion level.** A level that follows the motion preference with an exact exponential (time constant `FRAME.motionEase` = 0.2 s, 95% in 0.6 s, 99% in 0.92 s) **[computed]**, computed as a pure function of when motion last changed, like `wokeAt` for presence:

```ts
// Seconds on the worker clock: when the motion preference last changed, and the level at that moment
let motionChangedAt = -Infinity
let motionLevelBefore = 1

/**
 * Share of motion allowed now (twinkle, drift): eases to 1 under full motion and to 0 otherwise (FRAME.motionEase).
 * Within a thousandth of its target it is the target, so the drift rate reaches 0 and the worker can sleep.
 */
function motionLevel(t: number): number {
	const target = motion === 'full' ? 1 : 0
	const level = target + (motionLevelBefore - target) * Math.exp(-(t - motionChangedAt) / FRAME.motionEase)
	return Math.abs(level - target) < 0.001 ? target : level
}
// In the 'motion' handler, before `motion = message.motion`:
// motionLevelBefore = motionLevel(t); motionChangedAt = t
// and when it becomes 'full': parallaxScroll = scrollY; resumeCamera(camera, scrollY); holdMeteors(now) (as today)
```

- **Why an ease** rather than R3's immediate stop: today, turning reduced motion on drops every twinkling star from its twinkled brightness to its resting brightness in one frame (`sky.worker.ts:98` returns 0 at once). A near star one standard deviation into its twinkle is 11 to 22% off its resting brightness (`LAYERS.near.twinkleSigma` 0.12 to 0.22, more toward the bottom of the screen), so many stars pop at once. With the pause control this becomes a common action, so one eased level now serves twinkle and drift. Stopping within 0.6 s is well inside AC-27 and AC-28's 1 s. A load under reduced motion starts at 0 (`motionChangedAt = −Infinity`), so nothing eases at start.
- `twinkleLevel(now)` becomes `scene.twinkle × presenceLevel(now) × motionLevel(t)` (`sky.worker.ts:97-99`).
- **Twinkle time** (R3 §6 polish, adopted for E11): `SkyFrame` gains `twinkleTime`, the worker clock minus the time the tab spent hidden (`hiddenMs`, accumulated in the `visible` handler the way `exitAt` is shifted at `sky.worker.ts:453`). Twinkle reads it; meteors keep `frame.time`. So after a hidden tab the twinkle continues where it left off instead of jumping to a new phase.

```ts
// FRAME (config.ts:207-221), changed and added keys
	/** With no input (scroll, pointer, keys, focus) for this long the twinkle and the drift ease out, shooting stars pause and the worker sleeps until the visitor is back. */
	idleSleepMs: 90_000,
	/** Twinkle and drift fade out and back in around the idle sleep. */
	idleFadeMs: 4000,
	/** Time constant (s) of the ease when motion stops or comes back (the pause control, reduced motion): 95% within 0.6 s, so nothing stops or starts in one frame. */
	motionEase: 0.2,
```

### 6.7 Scene integration

- `SceneLevels` (`scene.ts:11-18`) gains `drift: number` and `lean: number`; `sceneAt` (`scene.ts:24-38`) mixes them like `twinkle` (`mix` takes `'haze' | 'twinkle' | 'drift' | 'lean'`). The quiet functions in `scene.ts` are not touched.
- Levels are continuous in scroll, so moving from hero to reading changes the drift *rate* smoothly over 0.5 to 1.3 viewport heights of scroll.
- The meteor launch gate (`SceneLevels.meteors`, hero only, 0.4 viewport heights) is unchanged.
- The drift and the springs never move quiet rects or transient paths: transients and quiet zones stay in screen space, and every star is veiled at its drawn position every frame (COORDINATION.md: "Star drift is fine, because each star is veiled at its own position every frame").

### 6.8 The pause control (UI, store, protocol, mountSky)

#### 6.8.1 What the visitor gets

- **Desktop.** After Resume in the navbar: a 40 × 40 px button with an 18 px glyph in `text-lightest-slate`, mint on hover (like the nav links), the global dashed mint focus ring (`globals.css:80-83`). Two bars while the sky moves; a triangle while it is paused.
- **Mobile.** The same button inside the slide-in menu (`#primary-nav` holds both layouts, `Navbar.tsx:124-131`), with its text visible: "Pause sky animation" / "Play sky animation".
- **Entrance.** It drops in with the nav items, last: `navItemVariants` with `custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}`.
- **Hidden** under forced colors (`forced-colors:hidden`), where the sky itself is hidden.

#### 6.8.2 Pattern and conformance

- **The W3C APG carousel's rotation control** (the W3C's own control for stopping automatic motion): "The label changes to match the action the button will perform", and "since the label changes, the rotation control does not have any states, e.g., aria-pressed". The APG button pattern adds that a toggle's label must not change if `aria-pressed` is used. R4's "aria-pressed with a label that changes" combines the two and is the anti-pattern; this plan follows the carousel.
- The accessible name comes from the button's text (the span), visible on mobile and visually hidden on desktop, so it always contains the visible label (2.5.3).
- The state is carried by the glyph itself, 12.2:1 on navy (lightest-slate) and 14.1:1 when mint; a state shown only by a 10% mint fill would be 1.28:1 and fail 1.4.11 **[computed]**.
- Target 40 × 40 CSS px (2.5.8 needs 24 × 24).
- **Focus visibility (2.4.11, AA).** The header slides fully off-screen while hidden (`Navbar.tsx:79`, y −70 on a 70 px header), so keyboard focus on any nav control, the new one included, is hidden today. P4 makes the header reappear when focus enters it: `onFocus={() => setHidden(false)}` on the `motion.header` (focus events bubble in React).

#### 6.8.3 The store: `src/components/sky/skyPause.ts` (main thread)

```ts
import { REDUCED_MOTION_QUERY } from '@/lib/utils'

/** localStorage key for the visitor's choice; absent until they press the control. */
const STORAGE_KEY = 'sky-motion'

/** The visitor paused the sky, or asked it to move despite prefers-reduced-motion. */
type SkyChoice = 'paused' | 'playing'

/** The choice in memory: undefined until first read, so storage is read once and a blocked storage still works for this page. */
let choice: SkyChoice | null | undefined

/** Subscribers in this tab (the control, mountSky). */
const listeners = new Set<() => void>()

function parseChoice(value: string | null): SkyChoice | null {
	return value === 'paused' || value === 'playing' ? value : null
}

function readChoice(): SkyChoice | null {
	if (choice === undefined) {
		try {
			choice = parseChoice(localStorage.getItem(STORAGE_KEY))
		} catch {
			choice = null
		}
	}
	return choice
}

/** True when the sky should hold still: the visitor's choice, or prefers-reduced-motion until they make one. */
export function readSkyPaused(): boolean {
	const current = readChoice()
	return current ? current === 'paused' : matchMedia(REDUCED_MOTION_QUERY).matches
}

/** Server render and hydration: the sky moves. (The control hydrates while IntroGate keeps the page hidden.) */
export function readSkyPausedOnServer(): boolean {
	return false
}

/** Records the visitor's choice for this browser and tells every subscriber in this tab. */
export function setSkyPaused(paused: boolean): void {
	choice = paused ? 'paused' : 'playing'
	try {
		localStorage.setItem(STORAGE_KEY, choice)
	} catch {
		// Storage blocked (a private window, say): the choice holds for this page
	}
	for (const listener of listeners) listener()
}

/** Calls `onChange` when the choice (in any tab) or the reduced-motion preference changes; returns the unsubscribe. */
export function subscribeSkyPaused(onChange: () => void): () => void {
	const reduced = matchMedia(REDUCED_MOTION_QUERY)
	const onStorage = (event: StorageEvent) => {
		if (event.key !== STORAGE_KEY) return
		choice = parseChoice(event.newValue)
		onChange()
	}
	listeners.add(onChange)
	reduced.addEventListener('change', onChange)
	window.addEventListener('storage', onStorage)
	return () => {
		listeners.delete(onChange)
		reduced.removeEventListener('change', onChange)
		window.removeEventListener('storage', onStorage)
	}
}
```

Nothing touches `window` at module scope, so the module is safe to import from a server-rendered client component. `readSkyPaused` returns a primitive, so React's snapshot comparison (`Object.is`) is stable, as `useSyncExternalStore` requires (react.dev).

**Why `useSyncExternalStore`, and no flash.** Next.js's guide on preventing flash before hydration notes that a client component reading `localStorage` during render mismatches the server HTML, and deferring to `useEffect` flashes (`02-guides/preventing-flash-before-hydration.md`). React's `useSyncExternalStore` takes a `getServerSnapshot` that "will be used only during server rendering and during hydration", then switches to the client value without a hydration error (react.dev). Here there is also nothing to flash: `IntroGate` hydrates the page while it is `display: none` and remounts it at the reveal (`IntroGate.tsx:94-100`), and the remount is a client render that reads the real choice directly.

#### 6.8.4 The control: `src/components/sky/SkyPauseToggle.tsx`

```tsx
import { useSyncExternalStore } from 'react'
import { PauseSVG, PlaySVG } from '@/components/icons'
import { cn } from '@/lib'
import { readSkyPaused, readSkyPausedOnServer, setSkyPaused, subscribeSkyPaused } from './skyPause'

interface SkyPauseToggleProps {
	className?: string
}

/**
 * The page's pause control for its moving sky (WCAG 2.2.2, techniques G186 and G4): stops the drift, the twinkle and
 * the shooting stars, and starts them again where they stopped. Follows the W3C carousel's rotation control: the name
 * says the action and changes with it, so no aria-pressed. Paused by default under prefers-reduced-motion; the
 * visitor's choice is kept for this browser.
 */
export default function SkyPauseToggle({ className }: SkyPauseToggleProps) {
	const paused = useSyncExternalStore(subscribeSkyPaused, readSkyPaused, readSkyPausedOnServer)
	return (
		<button
			type="button"
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex items-center gap-[10px] p-[11px] cursor-pointer font-mono text-sm text-lightest-slate hover:text-green transition-colors duration-250 forced-colors:hidden [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:shrink-0',
				className
			)}
		>
			{paused ? <PlaySVG /> : <PauseSVG />}
			<span className="md:sr-only">{paused ? 'Play sky animation' : 'Pause sky animation'}</span>
		</button>
	)
}
```

`Navbar.tsx`, after the Resume block (`Navbar.tsx:152-161`):

```tsx
<motion.div
	variants={navItemVariants}
	custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}
	initial="hidden"
	animate="visible"
	className="mt-[20px] md:mt-0 md:ml-[10px]"
>
	<SkyPauseToggle />
</motion.div>
```

Glyphs (decorative, in the shared `Icon` frame, no `title`; Feather "pause" and "play" paths, MIT, like the other stroke icons):

```tsx
// src/components/icons/PauseSVG.tsx
import Icon from './Icon'

/** Two bars: pause. Decorative: the button carries the name. */
export default function PauseSVG() {
	return (
		<Icon>
			<rect x="6" y="4" width="4" height="16" />
			<rect x="14" y="4" width="4" height="16" />
		</Icon>
	)
}
```

`PlaySVG` draws `<polygon points="5 3 19 12 5 21 5 3" />`. Both get named re-exports in `src/components/icons/index.ts`.

#### 6.8.5 Wiring in `mountSky.ts`

- `motion()` (`mountSky.ts:149`) becomes `forcedColors.matches ? 'off' : readSkyPaused() ? 'reduced' : 'full'`.
- `const stopPause = subscribeSkyPaused(syncMotion)` replaces the reduced-motion `change` listener (`mountSky.ts:245`); the store already watches that query, so `mountSky` drops its own `REDUCED_MOTION_QUERY` import and `reducedMotion` (`mountSky.ts:3`, `146`). `destroy()` calls `stopPause()`.
- **No new worker message.** Pausing reuses `motion: 'reduced'`, the pipeline the worker already has (R2 §9.4, R3 §11).
- `protocol.ts:26-32`: the `reduced` doc becomes "prefers-reduced-motion, or the visitor paused the sky: fades and brightness only".

### 6.9 The transient system: union, specs, scheduler, lease, scroll cancel (T1)

#### 6.9.1 Rules the visitor would notice if they broke

- One near the copy at a time, and then 40 s of open-sky flights only (the one-lane bridge).
- Any two launches at least 3 s apart: onsets draw the eye, so they never stack (R4 AC-18).
- Everything ends through light: a fade, never a cut. Scrolling 20 px from a transient's launch, or pausing, fades it over 0.25 s; hiding the tab or resizing drops it at once (no one sees it, or its plan no longer fits the copy).
- At most 5 s from first light to last.

```ts
/**
 * Short-lived sky events (shooting stars, satellites), launched by one scheduler. Any two launches are at least
 * `spacing` seconds apart, so onsets never stack, and narrow screens see at most `narrowLimit` per visit. Only one
 * transient at a time may light up near quiet copy (it holds the ink lease: METEOR_VEIL's budget is for one), and
 * after one does, the next `crossingCooldown` seconds plan clear sky only, so copy crossings stay as rare as before.
 * Once the page scrolls `scrollCancel` px from where a transient launched, or motion stops, it fades out over
 * `cancelFade` seconds. Each lasts at most `maxLife` seconds from first light to last (WCAG 2.2.2).
 */
export const TRANSIENTS = { spacing: 3, narrowLimit: 6, crossingCooldown: 40, scrollCancel: 20, cancelFade: 0.25, maxLife: 5 } as const
```

`scrollCancel` is the middle of the veil session's announced 16 to 24 px; take their number when it lands (IR-2). `narrowLimit` replaces `METEOR.narrowLimit` (`config.ts:289`).

#### 6.9.2 Types (`src/lib/sky/transients.ts`)

```ts
import type { Meteor, MeteorField } from './meteors'
import type { Satellite } from './satellites'
import type { VisitSources } from './radiants'

/** The kinds of short-lived sky events; adding one without a spec fails to compile. */
export const TRANSIENT_KINDS = ['meteor', 'satellite'] as const
export type TransientKind = (typeof TRANSIENT_KINDS)[number]

/** Bookkeeping every transient carries. Times are seconds on the worker clock. */
interface TransientState {
	startedAt: number
	/** Seconds from launch to last light: flight and wake or train, or a whole pass. At most TRANSIENTS.maxLife. */
	lifetime: number
	/** Its planned path comes within QUIET.feather of quiet copy: it holds the ink lease until it retires. */
	nearCopy: boolean
	/** scrollY at launch, for the shared scroll cancel. */
	launchScrollY: number
	/** When a cancel (scroll, pause) began fading it out; null while it plays. */
	cancelledAt: number | null
}

export interface MeteorTransient extends TransientState {
	kind: 'meteor'
	meteor: Meteor
}

export interface SatelliteTransient extends TransientState {
	kind: 'satellite'
	satellite: Satellite
}

export type Transient = MeteorTransient | SatelliteTransient
export type TransientOf<K extends TransientKind> = Extract<Transient, { kind: K }>

/** Where and whether transients may launch now; the worker fills it from its own state. */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present, the hero showing (today's meteorsAllowed, sky.worker.ts:144-146). */
	allowed: boolean
	/** No scroll for FRAME.meteorScrollQuietMs. */
	settled: boolean
	narrow: boolean
	secondsSinceReveal: number
	scrollY: number
	/** The viewport and the padded quiet rects in screen CSS px (screenQuietZones). */
	field: MeteorField
}

/** How one kind is timed and planned. Drawing lives with the canvas code (renderSky.ts). */
export interface TransientSpec<K extends TransientKind> {
	/** Launches allowed on this screen at all (satellites: wider than NARROW_MAX_WIDTH). */
	enabled(gate: LaunchGate): boolean
	firstDelay(random: () => number): number
	/** Seconds from this one's end to the next attempt. */
	gap(random: () => number, secondsSinceReveal: number, narrow: boolean): number
	/** A plan, or null when nothing fits; `nearCopy` false plans clear sky only. */
	plan(random: () => number, schedule: TransientSchedule, gate: LaunchGate, now: number, nearCopy: boolean): TransientOf<K> | null
	/** True while it needs every animation frame. */
	moving(transient: TransientOf<K>, now: number): boolean
}

/** The scheduler's state. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	failedPlans: Record<TransientKind, number>
	/** Launches this visit (the narrow-screen limit counts them). */
	launched: number
	lastLaunchAt: number
	lastCrossingAt: number
	lastFireballAt: number
	/** The visit's meteor sources; null until needed and after a layout change. */
	sources: VisitSources | null
}
```

#### 6.9.3 Functions

```ts
/** Seconds until the next launch: Poisson arrivals with a refractory floor and a cap, stretched on long visits (METEOR_RATE). */
export function nextGap(random: () => number, gap: { floor: number; mean: number; cap: number }, secondsSinceReveal: number): number
export function createSchedule(): TransientSchedule
/** Starts every kind's clock at the reveal. */
export function revealTransients(schedule: TransientSchedule, random: () => number, now: number): void
/**
 * One tick: fades out what the page scrolled away from, retires what is done, then launches each kind that is due and
 * allowed (TRANSIENTS.spacing, one per kind, the narrow limit, near copy only while mayCrossCopy). True when the set
 * changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: () => number, now: number, gate: LaunchGate): boolean
/** Motion stopped: everything fades out over TRANSIENTS.cancelFade. */
export function cancelTransients(schedule: TransientSchedule, now: number): void
/** Hidden tab or resize: everything goes at once. */
export function dropTransients(schedule: TransientSchedule): void
/** Nothing launches for `seconds` (today's holdMeteors: a return to the tab, to full motion or from idle). */
export function holdTransients(schedule: TransientSchedule, now: number, seconds: number): void
/** A new layout may have room again (today's retryMeteors); it also re-creates the visit's sources. */
export function retryTransients(schedule: TransientSchedule, random: () => number, now: number): void
export function transientsMoving(schedule: TransientSchedule, now: number): boolean
export function transientsLingering(schedule: TransientSchedule, now: number): boolean
/** Fade multiplier for drawing: 1 while it plays, easing to 0 over TRANSIENTS.cancelFade after a cancel. */
export function transientFade(transient: Transient, now: number): number
/** The ink lease is free: no active transient (fading ones included) passes near quiet copy. */
export function inkLeaseFree(active: readonly Transient[]): boolean
/** The next plan may pass near quiet copy: the lease is free and the crossing cooldown is over. */
export function mayCrossCopy(schedule: TransientSchedule, now: number): boolean
```

**The scroll cancel lives here**, evaluated in every `updateTransients`: `cancelledAt ??= now` once `|gate.scrollY − launchScrollY| > TRANSIENTS.scrollCancel`. While the page scrolls, frames come every refresh, so the check runs within a frame of the threshold. This fixes the verified bug (a flight in the air keeps drawing over unquiet copy at about 1:1 contrast, COORDINATION.md) for every kind in one place, and it never edits the veil-owned `scroll` handler, which keeps only recording `scrollY`. It is offered to the veil session as the shared rule (IR-2).

**The meteor spec** wraps `planMeteor` (§6.10.4), porting today's `updateMeteor` logic (`sky.worker.ts:193-224`):

1. Pick a source (`pickSource`). If the plan fails, try the other sources, up to `METEOR.radiantTries`. Then back off `METEOR.retry` (5 to 9 s); after `maxFailedPlans`, wait for a layout.
2. Decide fireballs before planning: desktop, at least 20 s after the reveal, at least 120 s since the last one, `METEOR_KINDS.fireball.chance` 4%. A fireball plan is clear sky only; if none fits, plan an ordinary meteor.
3. The next attempt is at `now + duration + gap`: gaps count from the end of the flight, as today, so meteors never overlap.

**The satellite spec** calls `planSatellite` (§6.11) with its own clock.

#### 6.9.4 Drawing

`renderSky.ts` gains `drawTransient` with a `switch` and a `never` check (a `Record` of drawers would need a cast, microsoft/TypeScript#30581, R3 §7.4). It passes `transientFade(transient, frame.time)` to `drawMeteor(ctx, assets, meteor, frame, fade)` (IR-5: `fade` multiplies the wake, glow, core and train alphas) and to `drawSatellite`.

#### 6.9.5 The worker after T1

- `meteor`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt` (`sky.worker.ts:61-66`) become one `schedule`.
- `updateMeteor` becomes `updateTransients(schedule, random, t, launchGate(now))`.
- The `motion` handler's `meteor = null` (`sky.worker.ts:441`) becomes `cancelTransients(schedule, t)` (the pause fade).
- `visible: false` (`sky.worker.ts:446-451`) and `resize` (`sky.worker.ts:369-370`) call `dropTransients`.
- `holdMeteors` becomes `holdTransients(schedule, t, METEOR.afterReturn)`, and `retryMeteors` becomes `retryTransients`.
- Frame demands: `transientsMoving` gives `{ ∞, vsync }`; `transientsLingering` (trains) gives `{ 30, timer }`.

#### 6.9.6 Rates this produces **[computed]** (20,000 simulated visits; crossing odds from R2's synthetic layout)

| | Today | New, desktop | New, narrow |
|---|---|---|---|
| Mean gap after a flight | 41.7 s | 11.7 s (floor 4 + Exp(8), cap 30; 3.9% hit the cap, 22% land within 2 s of the floor) | 21.0 s (8 + Exp(14), cap 45) |
| Meteors in the first 60 s | 2 (median) | median 5: 3 in 9%, 4 in 27%, 5 in 33%, 6 in 21%, 7 in 8% | median 3; the sixth and last at about 113 s |
| Meteors per minute | 1.6 (first 2 min), 1.1 (10 min) | 4.8 (first 2 min), 3.2 (10 min: the stretch is 1.5 at 4 min, 2 at 6, 3 at 10) | 0.6 over 10 min |
| Fireball in the first minute | about 14% (estimate: 8% of planning attempts, no spacing, `meteors.ts:135`) | 12% (about one per 7 to 10 min) | none |
| Satellite in the first minute | none | 39% (mean gap 84.5 s after the last, about 89 s launch to launch) | none |
| Copy crossings per minute | 0.58 (first 2 min), 0.41 (10 min) | 0.55 and 0.38 to 0.44 with the 40 s cooldown; 0.49 without it | not modelled (phone layouts are mostly copy; measure) |
| Shortest gap between onsets | 31 s | 3.0 s (the spacing rule) | 8.6 s |

So the cooldown keeps crossings at today's level while launches triple. The veil session's harness on captured layouts must confirm this (IR-7).

### 6.10 The meteor population model and speed classes (T2, R2 is primary)

#### 6.10.1 What it buys the visitor

Directions from real geometry instead of one diagonal: at a window pitched 40°, **75% fall, 13.5% slant sideways and 11.4% climb, evenly left and right**; after the guard (climbs from sporadic sources only), about 7% of launches climb **[computed, replicating R2 §4.3]**. Meteors from one radiant fan out from a shared vanishing point. On 15% of visits the shower radiant sits on screen in open sky, where its meteors are short, slow stubs (and, with D4, head-on ones are point flashes).

#### 6.10.2 Config (R2 §10; corrections noted)

```ts
/**
 * The screen as a window on the sky, for shooting stars and satellites: its longer side spans `fov` degrees and its
 * centre looks `elevation` degrees above a horizon just below the screen (a 16:10 window spans about 21-59°; twinkle
 * already grows toward the bottom, TWINKLE_HORIZON_GAIN). Today's nominal speed, 0.2 long sides a second, is 12°/s
 * here, a medium meteor (IMO: typically 3-25°/s). Shooting stars glow about `meteorHeight` km up, so lower in the
 * window they are farther away: slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeight: 100, earthRadius: 6371 } as const

/**
 * Where a visit's shooting stars come from. One shower radiant, a spot about `showerScatter` degrees wide, sends
 * `showerShare` of them; the rest come from `sporadicSources` broad sporadic sources (helion, antihelion, apex and
 * toroidal), each `sporadicScatter` degrees wide, one per speed class. Elevations follow real rates (hourly rate ∝
 * sin h, so the density is sin h cos h) and azimuths are uniform: about 3 in 4 fall, 1 in 8 cross sideways and 1 in 9
 * climb, half each way. On `onScreen` of visits the shower radiant sits on screen in clear sky, where its meteors are
 * short and slow and may be as short as `nearMinPath` px within `nearDegrees` of it. A climb steeper than
 * `climbDegrees` comes only from a sporadic source and at most `climbShare` of the longest path, so no long streak
 * climbs into the navbar.
 */
export const RADIANTS = {
	showerShare: 0.4,
	showerScatter: 1.5,
	sporadicSources: 3,
	sporadicScatter: 15,
	onScreen: 0.15,
	nearMinPath: 40,
	nearDegrees: 10,
	climbDegrees: 15,
	climbShare: 0.6,
} as const

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's centre (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** Wake colour the head cools to: palette index (STAR_TINTS), or 'mint' for --color-green mixed toward white. */
	wake: number | 'mint'
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast); the sporadic sources map onto them
 * (helion and antihelion about 30 km/s, toroidal 35-40, apex about 60). Fast meteors cool to mint (magnesium 517 nm,
 * oxygen 557.7 nm) and alone may leave a train; slow ones glow warm (sodium 589 nm, iron).
 */
export const SPEED_CLASSES = {
	slow: { angular: 9, duration: [1.1, 1.4], wake: 5, train: false },
	medium: { angular: 14, duration: [0.8, 1.1], wake: 0, train: false },
	fast: { angular: 22, duration: [0.55, 0.8], wake: 'mint', train: true },
} as const satisfies Record<string, SpeedClass>

/** A speed class's name. */
export type SpeedClassName = keyof typeof SPEED_CLASSES

/**
 * Shooting-star launches. A dark rural site sees 1-3 sporadic meteors an hour in the evening and 4-10 before dawn
 * (AMS), and this window holds about 29% of an observer's 50°-radius field (IMO), so a real window shows one every
 * 25-100 minutes. The hero compresses that about 120 times (a strong shower night played at 10-20 times): gaps, from
 * the end of the last flight, are `floor` plus an exponential extra with mean `mean`, at most `cap` (mean 11.7 s on
 * wide screens, 21 s on narrow ones), so pairs happen and droughts don't. From `slowFrom` s into a visit every gap
 * stretches by 1 + (t - slowFrom) / slowScale, at most `slowMax` times: half the rate by 6 minutes, a third by 10.
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	narrow: { floor: 8, mean: 14, cap: 45 },
	slowFrom: 120,
	slowScale: 240,
	slowMax: 3,
} as const

/**
 * Brightness: real counts are dominated by faint meteors (each brighter magnitude has 1/r as many, r about 2.2-2.6),
 * so `faintShare` of ordinary flights peak at `faint` and the rest at `normal`; lower in the window the meteor is
 * farther away and dims by the square of the distance ratio, never below `rangeFloor` of its peak. Fireballs peak at 1.
 */
export const METEOR_BRIGHTNESS = { faintShare: 0.3, faint: [0.3, 0.5], normal: [0.6, 0.85], rangeFloor: 0.6 } as const

/**
 * Rare kinds of shooting star: odds per launch, least seconds between two of a kind, and the earliest second after
 * the reveal. Fireballs (brighter than Venus; about one per 100-200 meteors in the real sky) stay in clear sky, last
 * `duration` s at METEOR.fireballSpeedScale of the normal speed, and with a 2.4 s train stay under 5 s.
 */
export const METEOR_KINDS = {
	fireball: { chance: 0.04, spacing: 120, after: 20, duration: [1.8, 2.5] },
} as const
```

**Correction to R2.** R2 retunes fireballs to 1.8 to 3 s. With a train (`TRAIN.life` 2.4 s) that reaches 5.4 s and breaks the 5-second invariant, so this plan keeps today's 1.8 to 2.5 s (4.9 s with a train, as `TRAIN`'s doc already states).

Keys removed from `METEOR` (veil-owned, so in T2 after the rebase or in V0): `gapMin`, `gapMeanExtra`, `gapMax`, `slowAfter`, `slowFactor` (to `METEOR_RATE`); `angle`, `radiantX`, `radiantY`, `radiantJitter` (to the window model); `narrowLimit` (to `TRANSIENTS`); `fireballChance`, `fireballDuration` (to `METEOR_KINDS`). `spawnX`/`spawnY` stay: R2 measured today's spawn area accepting 37% of candidates under the new mix, against 21% across the full width.

#### 6.10.3 `src/lib/sky/radiants.ts`

R2 §10 gives the bodies of `skyWindow`, `toward`, `sampleRadiant`, `radiantMotion`, `elevationAt` and `meteorRange`. This plan re-derived and checked them: the gnomonic image direction `(u·r_z − r_x, v·r_z − r_y)`, the `asin(√U)` elevation sampling for density sin h cos h, and the inverse of the window rotation in `elevationAt`. Copy them as they are. New on top:

```ts
/** One source of a visit's shooting stars. */
export interface MeteorSource {
	kind: 'shower' | 'sporadic'
	radiant: SkyDirection
	/** Scatter of each meteor's radiant around the source's (degrees). */
	spread: number
	speedClass: SpeedClassName
}

/** The visit's sources: one shower and RADIANTS.sporadicSources sporadic ones, and the window they were drawn for. */
export interface VisitSources {
	view: SkyWindow
	shower: MeteorSource
	sporadic: readonly MeteorSource[]
	/** Where the shower radiant sits on screen, on RADIANTS.onScreen of visits; null otherwise. */
	showerOnScreen: Point | null
}

/**
 * Draws a visit's sources for the field's window. On RADIANTS.onScreen of visits the shower radiant is placed on
 * screen in clear sky (quietAt 0, the top 45%, x within 10-90%); its direction is the unit vector through that point.
 */
export function createVisitSources(random: () => number, field: MeteorField): VisitSources

/** The source of the next launch: the shower RADIANTS.showerShare of the time, else a sporadic one at random. */
export function pickSource(random: () => number, sources: VisitSources): MeteorSource

/** Turns `direction` about a random axis by a random angle, normally distributed with sigma `degrees`: a radiant's spread. */
export function scatter(random: () => number, direction: SkyDirection, degrees: number): SkyDirection

/** Candidate flights for the veil planner from one source. */
export function flightSource(sources: VisitSources, source: MeteorSource): FlightSource
```

The proposal for a start point:

```
r = scatter(source.radiant, source.spread)
m = radiantMotion(view, r, start)                         null at the radiant itself
climbing = m.dirY < −sin(RADIANTS.climbDegrees)            a shower never climbs (null)
range = meteorRange(elevationAt(view, start)) / meteorRange(view.pitch)
speed (px/s) = angular · π/180 · view.focal · m.rate · jitter / range      jitter: METEOR.speedJitter
duration = between(SPEED_CLASSES[class].duration)
peak = (faint or normal, METEOR_BRIGHTNESS) · max(rangeFloor, 1 / range²)
short = showerOnScreen within RADIANTS.nearDegrees of start
lengthShare = climbing ? RADIANTS.climbShare : 1
```

#### 6.10.4 The interface to the veil planner (IR-1)

The population is ours and the veil is theirs. Candidate generation moves behind an interface we provide; everything about the veil stays in `meteors.ts`: the near-copy test, the clear-sky rules for fireballs, flares and trains, `veiledFrom`, first fit or preferring crossings, and the layout guards.

```ts
// radiants.ts: what the planner asks for
/** A candidate flight from one start point. */
export interface FlightProposal {
	/** Unit direction of travel on screen. */
	dirX: number
	dirY: number
	/** Screen speed (px/s) at the start. */
	speed: number
	/** Flight time (s); the planner's fallback pass may shorten it. */
	duration: number
	/** Longest path as a share of the planner's maximum (climbs: RADIANTS.climbShare). */
	lengthShare: number
	/** Near an on-screen radiant (foreshortened): may be as short as RADIANTS.nearMinPath. */
	short: boolean
	/** Peak brightness, 0-1 (fireballs: the planner uses 1). */
	peak: number
	speedClass: SpeedClassName
}

/** Where shooting stars from one source go from a start point the planner picked. */
export interface FlightSource {
	/** A candidate from `start`, or null when this source sends nothing there (its radiant, or a climb it can't make). */
	propose(random: () => number, start: Point): FlightProposal | null
}

// meteors.ts (veil-owned): the requested signature
export interface FlightOptions {
	/** The flight may pass within QUIET.feather of quiet copy (it then holds the ink lease); false plans clear sky only. */
	nearCopy: boolean
	/** A fireball: clear sky only, METEOR_KINDS.fireball timing, peak 1. */
	fireball: boolean
}
export function planMeteor(random: () => number, field: MeteorField, source: FlightSource, now: number, options: FlightOptions): Meteor | null
// Meteor gains: nearCopy: boolean (dimFrom < 1), speedClass: SpeedClassName
```

Inside `planFlight` this replaces only the radiant-point direction, the angle filter and the speed rule (`meteors.ts:140-152`): `const proposal = source.propose(random, start)`, `length = min(maxPath × lengthShare, speed × duration)`, `minPath = proposal.short ? RADIANTS.nearMinPath : minPath`. Train eligibility becomes `SPEED_CLASSES[speedClass].train || fireball` instead of `jitter >= METEOR.trainSpeedShare` (`meteors.ts:165`). Veiled flights keep the default light curve, so `veiledFrom`'s "never brightens again" rule holds (R2 §5.3).

`drawMeteor` picks the wake tint from `meteor.speedClass` (IR-5): `'mint'` uses today's `mixRgb(green, white, METEOR_LOOK.mintToWhite)`; a palette index uses `assets.palette[index]`; fireballs keep `METEOR_LOOK.fireballTint` unless fast (mint mixed `TRAIN.mintToWhite` toward white). No saturated red: the warmest wake (palette 5) has R/(R+G+B) = 0.37, far under 2.3.1's 0.8.

### 6.11 Satellites (T3, R2 §6.1; R4's look)

The look: a steady sunlit point that slides in from beyond an edge or fades in mid-sky (leaving Earth's shadow), glides in a straight line at constant speed, then either fades into Earth's shadow while warming toward orange or fades out. No tail, no twinkle, no blinking.

```ts
/**
 * Satellites: steady points lit by a Sun below the horizon, gliding in a straight line at constant speed, no tail and
 * no twinkle, never brighter than mid-layer stars. Real low orbits cross about 1°/s overhead; these run `speed` °/s
 * (2-3 times faster) so a whole pass stays under `life` seconds (WCAG 2.2.2's 5 s). Half slide in lit from beyond an
 * edge, half fade in over `fadeIn` s as they leave Earth's shadow; `shadowShare` fade into the shadow over `fadeOut` s
 * while warming toward palette `shadowTint`, as the ISS reddens into darkness. Clear sky only, never near-vertical
 * (`minTilt` degrees from vertical), one at a time, on their own clock (the first after `first`, then `gap`, both
 * stretched on long visits like METEOR_RATE), wider screens only.
 */
export const SATELLITE = {
	first: { floor: 30, mean: 60, cap: 150 },
	gap: { floor: 40, mean: 50, cap: 150 },
	speed: [1.2, 2.5],
	alpha: [0.25, 0.5],
	life: [4, 4.8],
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
	tint: 4,
	shadowTint: 6,
	shape: 2,
	minTilt: 20,
} as const
```

- **Speed.** `speed °/s × π/180 × view.focal` px/s: 29 to 60 px/s on a 1440 px laptop, 140 to 290 px per pass.
- **Plan.** A clear-sky segment (`!field.quiet.some((rect) => segmentTouches(start, end, rect, QUIET.feather))`, IR-4), below `METEOR.top`, above `METEOR.maxEndY`; up to 40 attempts, else back off as meteors do.
- **First appearance.** 30 + Exp(60), capped at 150 s: a 39% chance in the first minute, a mean of 82 s **[computed]**. R2 says only "first after 30 s, about 30-40% in the first minute"; this makes it concrete.
- **Drawing.** `drawSatellite` uses the phase atlas (shape 2, palette `tint` mixed toward `shadowTint` as it fades into shadow) through `placeStar` with `snap = false`, so it glides smoothly. Its alpha is `peak × fadeIn × fadeOut × fade × veil`, where the veil is the same as the meteors' (`easedQuietFactor(frame.quiet, x, y, { quietKeep: METEOR_VEIL.quietKeep, inkKeep: METEOR_VEIL.inkKeep × frame.meteorInk })`), measured at its drawn position every frame. A layout that shifts mid-pass therefore still veils it, as COORDINATION.md requires of every kind.
- **Never takes the lease**; scroll-cancelled like every kind; screen space (no drift or parallax: its own motion dominates, and the veil checks are screen-space).

### 6.12 The "could" kinds (D4), briefly

| Kind | Spec (R2 §7, R4 §4) | Integration rule | Phase |
|---|---|---|---|
| Stationary near-radiant flash | Within 1° of the on-screen radiant: a point that brightens and fades in 0.3 to 0.5 s, no wake, peak ≤ 0.7, at most one per 60 s | A meteor proposal with zero length; clear sky only | T2 (recommended) |
| Farewell meteors | Up to 2 per visit once the end scene is at 0.9 or more and the visitor has rested 3 s; floor 8 + Exp(14) s | The same planner and veil around Contact and the footer; the launch gate gains the end case | T4 |
| Burst | 2 to 4 members from the shower radiant, staggered 0.35 to 1.2 s, whole span ≤ 5 s, no flares or trains; 5% of launches, ≥ 90 s apart, after 45 s, desktop | All members clear sky only; the stagger keeps flashes ≤ 3 per second | T4 |
| Earthgrazer | ≥ 0.45 of the width, within 12° of horizontal, 4 to 6°/s, 2.5 to 3.5 s, warm; 2.5%, ≥ 180 s apart, after 60 s, ≥ 1280 px wide | Clear sky only; skipped silently when no band fits | T4 |
| Static comet | 1 visit in 10, desktop hero, clear upper right; mint coma (C2), curved pale dust tail, faint straight blue-white ion tail, never a green tail; fades in over ≥ 8 s | Moves only as a far-layer star (q 0.29); near-layer keeps (0, 0) near copy; never takes the lease; refit on layout | T4 |
| Planet | Near layer, alpha 0.78, twinkle 0, wider warm core | Part of the reviewed sky: composition review | T4 |

Won't: outbursts (without a pause control a long attention event; with one, still an onset storm), the ISS, Starlink trains, glints, the Milky Way, zodiacal light, aurora, airplanes (R2 §6.4).

### 6.13 Protocol changes (`protocol.ts`)

```ts
// SkyMainMessage gains
	/** The visitor is here without scrolling (pointer, keys, focus): at most one a second (P4). */
	| { type: 'activity' }
	/** A fine pointer for the lean, -1..1 from the viewport centre (x right, y down); null once it leaves (P6). */
	| { type: 'pointer'; at: { x: number; y: number } | null }
	/** Phase 2 only (§7.12): one main-thread animation frame, relayed while the worker asks for it. */
	| { type: 'tick' }

// SkyWorkerMessage gains, phase 2 only
	| { type: 'relay'; on: boolean }
```

`mountSky.ts` (P4, constants beside `DPR_CAP`):

```ts
/** Presence pings for the sky's idle clock, at most this often (ms). */
const ACTIVITY_INTERVAL_MS = 1000

/** Input that tells the sky the visitor is still here without scrolling. */
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const

let lastActivity = -Infinity
const noteActivity = () => {
	const now = performance.now()
	if (now - lastActivity < ACTIVITY_INTERVAL_MS) return
	lastActivity = now
	post({ type: 'activity' })
}
for (const type of ACTIVITY_EVENTS) window.addEventListener(type, noteActivity, { passive: true, signal })
```

P6 adds R3 §8's pointer listener (fine pointer, `pointerType !== 'touch'`, full motion, normalized with the ResizeObserver size so no layout read, coalesced to one message per main-thread animation frame, `null` on `pointerout` with no related target and on `blur`, `cancelAnimationFrame` in `destroy`). The worker's `activity` and `pointer` handlers call `noteInput(now)`; `pointer` also sets the lean target.

---

## 7. Implementation phases

### 7.0 Order, gates and release rules

```
P0 baseline ─► P1 atlas + camera plumbing ─► P2 quiet index + cache ─► P3 frame clock ─► P4 pause + presence ─► P5 drift ─► P6 lean (optional)
                                                                                                                 │
                                       veil commit lands ─► rebase ──┐                                           │
                       or user releases the veil ownership ─► V0 ────┴─► T1 transient system ─► T2 population ─► T3 fireballs + satellites ─► T4 coulds
W (WebKit relay) only if the device tests in P5 ask for it
```

- **P0 to P6 are independent of the veil session**: they do not edit `veiledFrom`, `METEOR_VEIL`, `quietBlend`, `settleQuiet`, or the `layout` or `scroll` handlers. They only read `parallaxScroll`, `scrollY` and `quietBlend(t)`.
- **T1 to T4 are blocked** until the veil commit lands (rebase, §8.2) or the user releases the ownership (V0, §7.9).
- **Release rule (WCAG 2.2.2).** P5 (the drift) never reaches production without P4 (the pause control). They may share a deploy; P4 may ship earlier.
- **Every phase** passes `npm run lint` and `npm run type-check` (AGENTS.md). While `npm run dev` runs, check the next-devtools MCP endpoint (`get_errors`, `get_compilation_issues`). If `next dev` stops with an upgrade reminder, tell the user and rerun; never upgrade Next.js unasked. Never POST to `/api/schedule/book`.
- **Harness recipe** (dev-only, not committed). Copy `src/lib/sky/*.ts` to a scratchpad folder, rewrite relative imports to `.ts` (`sed -E "s#from '\./([A-Za-z]+)'#from './\1.ts'#"`), and run checks with Node 24, which strips TypeScript types by default. Worker files need their `@/lib/sky/x` imports rewritten to the copies. Canvas-dependent code gets tiny stubs (`ImageData` as `{ width, height, data }`; `OffscreenCanvas` only where `toBitmap` is called).
- **Browser checks** run on the `portfolio-dev` preview (`.claude/launch.json`) in the Claude Browser pane or the Playwright MCP (`browser_emulate_media` for reduced motion, screenshots, `browser_evaluate` for timings). R4 §3.3's pixel-tracking method runs from the scratchpad.

### 7.1 P0: Baseline and harness (no repository change)

- **Goal.** Evidence of today's behaviour, to prove P1 to P3 change nothing visible.
- **Steps.**
  - Capture screenshots at 1440 × 900 (DPR 1 and 2) and 393 × 852 (DPR 2), all after the dusk, in states where nothing moves, so frames compare pixel for pixel: the hero and the end under the reduced-motion emulation; the reading scene (1.5 viewport heights) under full motion once the scroll has settled (twinkle 0, no meteors there, so the frame depends only on the scroll offset).
  - Dump the star atlas pixels, and a grid of `easedQuietFactor` values over captured quiet rects (from `layout` messages logged in a dev session), settled and mid-ease.
  - Record the frame intervals during a meteor and during twinkle (a Chromium trace).
- **Verification.** The artefacts exist in the scratchpad.
- **Rollback.** None needed.

### 7.2 P1: Phase atlas and the generalized `drawLayer` (no visible change)

- **Goal.** All the drawing plumbing for moving stars, drawn exactly as today.
- **Files and steps.**
  1. `config.ts`: add `STAR_PHASES`, `STAR_EDGE`, and `CAMERA` with `scrollParallax` only.
  2. `camera.ts` (new): `Vec`; `nearness(layer, m)` with a **temporary body** `LAYERS[layer].parallax / CAMERA.scrollParallax` (per-layer constants, R1 §3.3's "smallest diff" fallback); `layerNearness(layer)` built on it.
  3. `catalog.ts`: `Star.q` (doc: "Nearness: this star's share of the camera's motion (DEPTH)") set in `cellStars` (`catalog.ts:152-163`) without any new random draw.
  4. `skyAssets.ts`: the separable `profile`, phase-aware `paintSprite`, 4 × 4 blocks in `buildStarAtlas`, `starSpriteIndex`.
  5. `renderSky.ts`: `SkyFrame.parallaxScroll` (`renderSky.ts:71-72`) becomes `camera: Vec`, plus `snap: boolean`; `EDGE` becomes `STAR_EDGE`; `drawLayer` gets two-axis culling with `layerNearness` and per-star `q`; `placeStar` replaces `renderSky.ts:127-132`.
  6. `sky.worker.ts` `frameAt` (`sky.worker.ts:246-267`): a reused `camera` object `{ x: 0, y: CAMERA.scrollParallax × parallaxScroll }` and `snap: true`.
- **No visible change means.** The P0 screenshots match pixel for pixel. (`q × 0.07` and `parallax` can differ in the last bit of a double, so a star landing exactly on a rounding boundary could move one device pixel; the harness reports the largest position difference, expected under 1e-9 px.)
- **Verification.** Lint, type-check. Harness: phase-0 sprites byte-identical to today's; the separable painter matches `gaussianAt` within 1e-12; the atlas builds in under 2 ms. Browser: AC-39, AC-12, AC-26 against P0.
- **Rollback.** Revert the commit; nothing else depends on it yet.

### 7.3 P2: Quiet index and stamp eviction (no visible change)

- **Goal.** Make per-star quiet math cheap enough for every-frame drift, exactly.
- **Files and steps.**
  1. `quietIndex.ts` (new).
  2. `renderSky.ts`: `SkyFrame.quietIndex`; `drawLayer` calls `frame.quietIndex.factor(x, y, config)` (`renderSky.ts:107`, `120`); `StarField` gets `beginFrame`/`trim()` with stamps (`renderSky.ts:24-51`), called from `drawSky` (`renderSky.ts:153-155`).
  3. `sky.worker.ts`: one `createQuietIndex()`; `frameAt` calls `quietIndex.update(quietBlend(t), width, height, STAR_EDGE)`. `quietBlend` is consumed unchanged.
- **Verification.** Lint, type-check. Harness: max |diff| = 0 between the index and `easedQuietFactor` over the P0 rect captures, both ease states and 40 camera offsets (AC-38); index time at 4K with 64 rects mid-ease ≤ 0.35 ms on a desktop. Browser: P0 screenshots identical; a 30-minute scroll-and-idle soak shows no cache-clear hitch in the trace.
- **Rollback.** Revert; P1 stays.

### 7.4 P3: The frame clock and pacing (no visible change; more robust)

- **Goal.** Frames that will land on display refreshes once things move; robustness if worker rAF misbehaves.
- **Files and steps.**
  1. `config.ts`: `PACING`.
  2. `pacing.ts` (new); `frameClock.ts` (new); AGENTS.md: add `frameClock.ts` to the worker-file list.
  3. `sky.worker.ts`: `SkyWorkerScope` (`:17-22`) makes `requestAnimationFrame` optional; `FrameMode` (`:24`) and `frameInterval` (`:130-133`) go; `frameMode` (`:117-127`) becomes `frameDemand(now)` (the camera demand arrives in P5); `rafId` becomes the clock; `cancelFrames` (`:136-141`), `schedule` (`:152-168`), `onTimer`/`onFrame` (`:171-180`) and `tick` (`:183-190`) use demand, pacer and estimate.
- **No visible change means.** Meteors and scrolling still draw every refresh (`fps ∞`), twinkle at 15 fps from a timer, sleep as today.
- **Verification.** Lint, type-check. Harness: `refreshDivisor` reproduces §6.2.2's table; the pacer drops k at once and raises it after 0.5 s; the estimate flags a synthetic 15 ms clock as unaligned and a 16.67 ms one as aligned. Browser trace: meteor frames every refresh; twinkle at 15 fps; zero frames after 90 s idle; zero while hidden (AC-13 baseline).
- **Rollback.** Revert P3 (P1 and P2 stay).

### 7.5 P4: The pause control and presence (visible: the control; the twinkle lives while the visitor is here)

- **Goal.** The visitor's control (WCAG 2.2.2) and one presence gate, before any continuous motion ships.
- **Files and steps.**
  1. `skyPause.ts` and `SkyPauseToggle.tsx` (new); `PauseSVG.tsx`, `PlaySVG.tsx` and their barrel exports.
  2. `Navbar.tsx`: the toggle after Resume; `onFocus={() => setHidden(false)}` on the header.
  3. `mountSky.ts`: `motion()` reads the store; `subscribeSkyPaused(syncMotion)`; presence pings (§6.13).
  4. `protocol.ts`: `activity`; the `SkyMotion` doc.
  5. `config.ts`: `FRAME.idleSleepMs` doc, `FRAME.motionEase`.
  6. `sky.worker.ts`: the `activity` handler; `presenceLevel`; `motionLevel` and its bookkeeping in the `motion` handler; `twinkleLevel` uses both; a `{ 30, timer }` demand while the motion level eases; `hiddenMs` and `twinkleTime`.
  7. `renderSky.ts`: twinkle reads `frame.twinkleTime`.
  8. AGENTS.md: one line under the sky notes ("the navbar's pause control maps to `motion: 'reduced'` through `skyPause.ts`").
- **Not in P4.** The fade of a flying meteor on pause comes with T1; until then it disappears at once, as today (`sky.worker.ts:441`).
- **Visible change means.** A new control; pausing settles the twinkle within 0.6 s and stops meteors; reduced-motion visitors see "Play sky animation"; moving the mouse keeps the twinkle alive past 90 s.
- **Verification.** Lint, type-check. Browser (AC-28, AC-29, AC-26, AC-27, AC-32, AC-33 for twinkle):
  - the control is reachable by Tab, operable by Enter and Space, and its name changes with the action;
  - it is 40 × 40 px with the focus ring visible, also when focus enters a hidden header;
  - it persists across reloads and follows another tab (two tabs);
  - it is paused by default under the reduced-motion emulation, and an explicit play wins;
  - it is hidden under forced colors;
  - there is no hydration warning in the console.
- **Rollback.** Revert P4 (and P5, which depends on it). The `sky-motion` key left in localStorage is harmless.

### 7.6 P5: The camera, continuous depth, drift and scroll glide (visible: the main event)

- **Goal.** §2.1 to §2.6 come true for the stars.
- **Files and steps.**
  1. `config.ts`: `DEPTH`; `CAMERA` gains `scrollOmega`, `snapViewports` and `settle`; `DRIFT`; `SCENE.*.drift` (and `lean`, at 0 effect until P6); `LAYERS` loses `parallax`; docs updated.
  2. `camera.ts`: `nearness(m)` takes its real body (drop the `layer` parameter at both call sites); `DRIFT_PEAK`, `driftAt`, `stepSpring`, `CameraTarget`, `CameraState`, `createCamera`, `stepCamera`, `pauseCamera`, `resumeCamera`, `cameraSpeedBound`, `cameraAtRest`. The lean springs exist with target 0.
  3. `catalog.ts`: `q = nearness(m)`.
  4. `scene.ts`: `SceneLevels.drift`/`lean` and their mix.
  5. `sky.worker.ts`:
     - camera state created at `init` from `scrollY` (`:420`);
     - `stepCamera` in `tick` before `draw` with `CameraTarget` from §6.1.5;
     - the camera demand with caps (narrow 30, ADAPT step 1 → 30, software budget);
     - `frameAt` fills `camera` from `camera.offset` and `snap: motion !== 'full'`;
     - `pauseCamera` on hide (`:446`) and when the demand goes to sleep;
     - `resumeCamera` and `parallaxScroll = scrollY` when motion returns to full;
     - `stepDown` (`:295-303`) feeds the 30 fps cap;
     - `probeRaster` (`:309-320`) keeps `rasterMs` for the software gate.
- **Optional within P5 (E11).** Fade the stars that ADAPT step 1 thins out over 1 s instead of removing 20% in one frame (`sky.worker.ts:295-298`, R3 §6).
- **Visible change means.** Floating, deep stars; scroll glide.
- **Verification.** Lint, type-check.
  - Harness: `driftAt(0)` is zero; speeds stay in 0.58 to 1.42 v₀; the turn stays ≤ 4.33°/s; the first-minute headings match §6.1.4; the bound stays ≤ 70.8 v₀ over 6 h; `stepSpring` composes exactly (two half steps equal one step) and never overshoots from rest; `nearness` never increases with magnitude and caps at 1.6; the band medians match §6.1.1.
  - Browser, the 60-second watch protocol (R4 §3.1) on a DPR-2 laptop, a DPR-1 monitor and an iPhone: AC-1 to AC-17, AC-26, AC-27, AC-30, AC-32 to AC-35.
  - Battery (AC-14): a Chromium trace on a laptop, and Safari's Energy Impact on macOS.
- **Device decisions here.** The DPR 1 sigma floor (§6.3) and D7 (WebKit relay).
- **Rollback.** Knob first: `DRIFT.speed = 0` stops the drift and keeps depth and glide. Full rollback: revert P5 (P1 to P4 stay).

### 7.7 P6: Pointer lean (optional, D3; visible on desktop)

- **Files and steps.**
  1. `config.ts`: `POINTER`.
  2. `protocol.ts`: `pointer`.
  3. `mountSky.ts`: R3 §8 listeners, with `PARALLAX_POINTER_QUERY = '(hover: hover) and (pointer: fine)'` beside `DPR_CAP`.
  4. `sky.worker.ts`: the `pointer` handler (target, `noteInput`), and `CameraTarget.leanX`/`leanY = pointer × scene.lean` under full motion, else 0.
- **Verification.** Lean ≤ reach × q (16 px for the brightest); it settles in about 1.2 s; it returns to the centre on leave and blur; it is off under reduced motion, the pause and touch; messages ≤ 1 per frame (main-thread trace).
- **Rollback.** `POINTER.reach = 0`, or revert.

### 7.8 Checkpoint V: the veil session

Before T1, one of two things must be true:

1. **The veil commit has landed.** Rebase (§8.2), update `COORDINATION.md`, re-run §8.4. Or:
2. **The user has explicitly released the veil-owned functions** (the session never delivered). Then run V0.

The trigger to ask: P4 and P5 are merged and the veil commit still hasn't landed. Ask the user once, with this section's two options, rather than waiting indefinitely.

### 7.9 V0: Fallback if the veil work never lands (blocked on the user's go-ahead)

- **Goal.** The same invariants without the veil session: one lit transient near copy, every kind through the same veil checks and veil drawing, a shared scroll cancel, at most 5 s each.
- **Steps.** In one isolated commit, make IR-1, IR-3, IR-4 and IR-5 ourselves:
  - `planMeteor`/`planFlight` take a `FlightSource` and `FlightOptions`, and return `nearCopy` and `speedClass`;
  - `scene.ts` exports `QUIET_REACH = QUIET.feather`;
  - `meteors.ts` exports `segmentTouches`;
  - `drawMeteor` takes `fade` and the class tint.
- **Untouched.** `veiledFrom` (its stricter `clearUntil` errs on the safe side: fewer crossings), `METEOR_VEIL`, the quiet ease and the `scroll` and `layout` handlers. The scroll cancel lives in the scheduler (§6.9.3), so the verified mid-flight bug is fixed for every kind without touching the handler.
- **Known issues left in place** (listed in risks): dimming can't start before 65% of the flight; a star pop when quiet rects are re-measured mid-ease; rects first measured mid-entrance. The sticky radiant disappears anyway, replaced by the visit's sources.
- **Verification.** As T1 and T2, plus a review of the four interface edits for logic changes (there must be none beyond the candidate generation).
- **Rollback.** Revert V0 with T1 and T2.

### 7.10 T1: The transient system (blocked; visible: the scroll-cancel and pause fades)

- **Goal.** One scheduler, one lease and one scroll cancel for every kind, before any new kind or direction exists, so T2 and T3 only add specs.
- **Files and steps.**
  1. `config.ts`: `TRANSIENTS`.
  2. `transients.ts` (new) with `TRANSIENT_KINDS = ['meteor']` (T3 adds `'satellite'`). The meteor spec keeps today's radiant handling (`pickRadiant`, the sticky radiant, `METEOR.radiantTries`) through the veil session's current `planMeteor`; T2 swaps it for the visit's sources.
  3. `sky.worker.ts` changes per §6.9.5.
  4. `renderSky.ts`: `drawTransient`, `fade` passed through.
- **Visible change means.** A flying meteor fades within 0.25 s when the page scrolls 20 px or the visitor pauses, instead of drawing on over the copy or vanishing; nothing else changes.
- **Verification.** Lint, type-check. Harness: lifetimes ≤ 5 s for every config combination (AC-37); the spacing, the lease and the cooldown hold over 10,000 simulated minutes. Browser: AC-40, AC-36 (lease), AC-28 (now with the fade).
- **Rollback.** Revert T1; the worker returns to `updateMeteor`.

### 7.11 T2 and T3: The population model, then fireballs and satellites (blocked)

- **T2.** Goal: §2.1's shooting stars, frequent and from real radiants.
  1. `config.ts`: `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, and the `METEOR` keys removed (§6.10.2).
  2. `radiants.ts` (new).
  3. `planMeteor` through `FlightSource` (the veil session's adoption or V0).
  4. The meteor spec uses `nextGap(METEOR_RATE.hero | narrow)`.
  5. The class wake tint.
  6. With D4, stationary flashes.
  - **Visible:** §2.1's shooting stars.
  - **Verification:** harness rates match §6.9.6 and directions match §6.10.1; AC-18 to AC-23 and AC-31; the veil session's harness on captured layouts for crossings per minute and plan acceptance (AC-36).
  - **Rollback:** revert T2 (T1 stays), or set `METEOR_RATE` back to 30 + Exp(12) capped at 75 to restore today's frequency with the new directions.
- **T3.** Goal: the rare treats of §2.1.
  1. `METEOR_KINDS.fireball` and the fireball decision in the meteor spec.
  2. `SATELLITE`, `satellites.ts` (new), `'satellite'` in `TRANSIENT_KINDS`, the satellite spec and `drawSatellite`.
  - **Visible:** fireballs about one per 7 to 10 minutes; a satellite in 39% of first minutes.
  - **Verification:** AC-24 and AC-37; satellites never near copy at launch; harness fireball and satellite rates match §6.9.6.
  - **Rollback:** remove `'satellite'` from `TRANSIENT_KINDS` (the compiler points at every use), or revert.
- **T4** (coulds, per D4): one small commit per kind, each with its own AC row.

### 7.12 W: The WebKit frame relay (phase 2, only if P5's device tests ask)

- **Go criteria.** On an iPhone in Safari or on macOS Safari, AC-10′ or AC-13 fail visibly (judder of the near stars), or a 10-minute Low Power Mode test shows the sky's energy impact well above Chrome's on the same machine.
- **Design.** R3 §2.6: the worker posts `{ type: 'relay', on: true }` while it needs vsync frames on an unaligned clock; `mountSky` runs a main-thread rAF loop posting `{ type: 'tick' }`; the worker draws on ticks. The cost is coupling to main-thread jank.
- **Verification.** The same device tests now pass AC-10′ and AC-13; the main-thread trace shows the relay at 10 to 30 µs per frame and no long tasks; Chrome and Firefox never enable it (their clocks are aligned).
- **Rollback.** Revert; the worker falls back to its own clock.

---

## 8. Coordination protocol

### 8.1 Interface requests to the veil session

| # | Request | Why | If declined |
|---|---|---|---|
| IR-1 | `planMeteor(random, field, source: FlightSource, now, options: FlightOptions)`, returning `Meteor` with `nearCopy` and `speedClass`; candidate generation behind `FlightSource` (§6.10.4), every veil rule unchanged | New directions, speed classes and the lease without re-checking outside their code | V0 makes the change, logic-neutral for the veil |
| IR-2 | The shared scroll cancel as a rule in the scheduler (§6.9.3), the scroll handler only recording `scrollY`; and their distance (16 to 24 px) and fade | One implementation for every kind, testable without the DOM | Our scheduler rule stands; port their number |
| IR-3 | Export `QUIET_REACH` from `scene.ts` (today `QUIET.feather`), and keep `easedQuietFactor` a maximum over zones within that reach | The quiet index is exact only while zones reach no farther | The index keeps its local constant; re-verify exactness after every change of theirs |
| IR-4 | Export `segmentTouches` | Satellites and coulds test clear sky the same way | V0 exports it |
| IR-5 | `drawMeteor(..., fade = 1)` (and `drawTrain`) multiplying their alphas; the wake tint from `meteor.speedClass` | The cancel and pause fades; the speed-class colours | V0 adds both |
| IR-6 | Keep `meteorLight`'s default curve for veiled flights; other curves (fireballs, coulds) only in clear sky | `veiledFrom`'s "never brightens again" assumes the default | Nothing to do: only clear-sky flights vary |
| IR-7 | The promised numbers: captured layouts, crossings per minute and plan acceptance under the new mix (their Node harness with our `FlightSource`), and confirmation that the ink budget stays one lit transient near copy | §6.9.6 rests on R2's synthetic layout | Run R2's `crossing.py` approach on layouts we capture in P0 |
| IR-8 (optional) | Cache the screen zones in `quietBlend` per scroll and layout | Today it allocates about 64 rects per call, and drift calls it every frame | Minor garbage; leave it |

### 8.2 The rebase checkpoint

When their commit lands:

1. Fetch it and rebase `claude/quirky-carson-btv2u4` onto it (or onto master if they merged there).
2. Resolve the hotspots (§8.3), always keeping their veil logic and porting ours around it.
3. Re-verify (§8.4).
4. Update `COORDINATION.md`'s log and `HANDOFF.md`.

Only then start T1.

### 8.3 Merge-conflict hotspots

| File | Ours | Theirs |
|---|---|---|
| `sky.worker.ts` | `frameDemand`/`schedule`/`tick` (P3), camera and presence (P4, P5), `updateTransients` replacing `updateMeteor` (T1), the `motion` and `visible` handlers | `updateMeteor` radiant ordering, the `scroll` handler cancel, `layout` deferral, `quietBlend`, `settleQuiet` |
| `renderSky.ts` | `drawLayer`, `StarField`, `SkyFrame` fields, `drawTransient` | `drawMeteor`/`drawTrain` veil, maybe per-class ink keeps |
| `scene.ts` | `SceneLevels`/`sceneAt` (drift, lean) | `quietFactor`/`inkAt`, maybe per rect class |
| `config.ts` | new blocks, `SCENE` levels, `FRAME` docs, `LAYERS.parallax` removal, `METEOR` keys moved (T2) | `METEOR_VEIL`, `QUIET`, `METEOR` spawn and selection keys, WCAG doc comments |
| `meteors.ts` | only through IR-1 (T2) | `veiledFrom`, `planFlight`, `planMeteor` |
| `mountSky.ts` | pause store, presence, pointer | per-rect text class, entrance offsets in measured rects |
| `protocol.ts` | `activity`, `pointer` | per-rect text class |

### 8.4 What to re-verify after the rebase

- **Quiet index exactness** against their `quietFactor`, `inkAt` and `easedQuietFactor` (AC-38), with their `QUIET_REACH`.
- **No star pops while stars drift** through their eased and deferred layouts (AC-16).
- **One scroll cancel**, applied to every kind, with their distance (AC-40).
- **The lease** still means one lit transient near copy under their budget (AC-36).
- **Crossings per minute and plan acceptance** under the new mix on captured layouts (IR-7).
- **First launch timing** after their settled-layout fix (AC-19).
- **The `METEOR_VEIL` doc** still states the one-transient budget.

---

## 9. Acceptance checklist

R4's checklist (§3.2), trimmed and mapped to phases. Primed IDs are rewritten for the settled design; the reason follows each. Methods: **W** watch, **S** scripted screenshots, **T** trace, **L** dev logging or harness, **C** code review or config assertion.

| ID | Check | Pass when | How | Phase |
|---|---|---|---|---|
| AC-1 | Depth order | Median speeds far < mid < near with adjacent ratios ≥ 1.6 (expected 1.67 and 1.98) | S, L | P5 |
| AC-2 | Still frame of reference | Far median ≤ 1.5 px/s (expected 0.85), near median ≤ 6 (2.8), no ambient star > 8 (6.8 peak) | S | P5 |
| AC-3 | One heading | All tracked drift headings within ±5° of each other (lean excluded) | S | P5 |
| AC-4′ | Smooth turning (was ≤ 15°/min: R4's steady-pan model, not adopted) | Turn ≤ 4.4°/s with no step; first minute within ±45° of rightward and within 24° of level from 10 s to 50 s | L, S | P5 |
| AC-5 | No starts, stops or reversals | Speed within 0.58 to 1.42 × v₀ × rate; change ≤ 10%/s (expected ≤ 3.8%) | L, S | P5 |
| AC-6 | No oscillation | No energy > 0.3 px in 0.05 to 0.5 Hz (the drift's frequencies are 0.006 to 0.013 Hz) | C, S | P5 |
| AC-7′ | No visible repetition (was "never within 50 px": an unbounded pan) | Over 30 min, no 60-s stretch of path matches an earlier one within 15 px at q = 1 (expected 19 px) | L | P5 |
| AC-8 | No edge pops | Every star appears sliding in from an edge or through a fade | S | P1, P5 |
| AC-9 | Rate changes never jump positions | At scene change, idle, pause, reduced-motion switch, resize, 640 px crossing: largest per-frame move ≤ normal + 0.25 px | S | P4, P5 |
| AC-10′ | No pixel stepping (was ≤ 0.25 device px: R3's 0.5 is settled) | ≤ 0.5 device px per drawn frame (0.45 expected at DPR 2); centroid fit r² ≥ 0.999 over 2 s | S, L | P1, P3, P5 |
| AC-11′ | No shimmer (was peak pixel ≤ 20%: the grid alone gives 20 to 35% at DPR 1) | Flux constant across phases (L: exact); perceived peak ripple ≤ 10% at DPR 2 (eye PSF σ 0.6 device px); DPR 1 judged by eye, with the §6.3 floor if needed | L, S, W | P1, P5 |
| AC-12 | No streaks | Sprite extent along the motion ≤ extent across + 1 device px | S | P1 |
| AC-13 | Frame pacing | During drift, ≥ 95% of intervals within ±25% of target; worker JS ≤ 4 ms p95; no main-thread task > 50 ms from the sky | T | P3, P5 |
| AC-14 | Energy | Laptop renderer ≤ 10% of a core while drifting (expected about 1%); 0 frames after the idle timeout, while hidden, and when paused or under reduced motion with no scroll (scrolling there keeps today's 30 fps fade frames for the quiet zones) | T | P5 |
| AC-15′ | Calm while reading (was "no star > 2 px/s": the 0.35 default peaks at 2.4) | Drift ≤ 0.35 ×, twinkle 0, near median ≤ 1.2 px/s, no star > 2.5 px/s, no transients | S, L | P5, T1 |
| AC-16 | Restraint near copy | A drifting star crossing a quiet edge changes alpha ≤ 0.05 per drawn frame | S | P2, P5 |
| AC-17 | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s see no motion of the copy | W | P5 |
| AC-18 | Attention budget | No onset in the first 3 s after the reveal; ≥ 3 s between onsets; ≤ 1 per 6 s on average (expected 1 per 11 s) | L | T1 to T3 |
| AC-19 | A first shooting star | In ≥ 18 of 20 fresh desktop loads, 4.5 to 7 s after the reveal | L | T2 |
| AC-20′ | Frequency (was median 4: R4's 12 to 18 s gap, not adopted) | Median 5 in the first 60 s, 4 to 6 in ≥ 8 of 10 runs; never two meteors at once; the stretch is ×2 by 6 min and ×3 by 10 min; narrow ≤ 6 per visit | L | T2 |
| AC-21′ | Varied, believable directions (was "never rising more than 10°": D8) | Over 10 meteors, ≥ 3 sources in ≥ 9 of 10 runs; headings span ≥ 60°; climbs (> 15° up) only sporadic, ≤ 0.6 of the longest path, ≤ 10% of launches; shower meteors converge backward within 10% of the diagonal | L | T2 |
| AC-22 | Ignite and burn out on screen | Head light < 15% of peak at the first and last points; never enters or leaves an edge bright; peaks in clear sky | L, C | T2 |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel | C, S | T2 |
| AC-24′ | Satellites (was "≥ 40 s across": D9) | Speed constant within 2%; no tail, no blinking, ≤ 1 at a time; life ≤ 4.8 s; fades in ≥ 0.8 s or slides in from an edge; clear sky at launch; veiled per frame | S, L | T3 |
| AC-25 | Comet (if built) | Moves only as a far-layer star; fades in over ≥ 8 s; no part inside padded quiet rects; ≤ 1 per visit | S | T4 |
| AC-26 | Reduced motion is still | Two screenshots 30 s apart after the dusk are identical; no transients, drift, parallax, glide or lean | S | P4, P5 |
| AC-27 | Live preference switch | Stars hold within ≤ 1 s and ≤ 1 px; resume without a jump; no meteor for ≥ 3 s | S | P4, P5 |
| AC-28 | Pause control (2.2.2) | Visible, named, keyboard-operable; stops drift, twinkle and transients within ≤ 1 s; persists; resumes in place; paused by default under reduced motion; other tabs follow; G186 and F16 procedures | W, S | P4 (fade from T1) |
| AC-29 | Forced colors and contrast | Forced colors hide the sky and the control; prefers-contrast: more drops the haze and dims the stars, drift allowed | S | P4 |
| AC-30 | Contrast budget unchanged | Body text keeps ≥ 4.5:1 over the brightest moving star (drift moves positions, never alpha) | C | P5, T1 |
| AC-31 | Flash safety | ≤ 3 flashes in any second; each transient ≤ about 2,000 CSS px² of change (limit 21,824); no saturated red | C | T2 to T4 |
| AC-32 | Hidden tab | After 60 s hidden: no leap, the twinkle continues where it left, no meteor for ≥ 3 s | S | P4, P5 |
| AC-33 | Idle | 90 s without scroll, pointer, keys or focus: drift and twinkle ease out over 4 s, then 0 frames; input eases them back over 4 s | T, S | P4, P5 |
| AC-34 | Resize and zoom | No jump beyond what the layout requires; drift continues; crossing 640 px changes speed only | S | P5 |
| AC-35 (new) | Scroll glide | After a scroll stops, near stars rest within 0.7 s with no reversal over 0.1 px; Home and End snap, never sweep | S | P5 |
| AC-36 (new) | One lit transient near copy | Never two near-copy transients at once; ≤ 1 crossing per 40 s; crossings per minute at today's level (0.41 over 10 min) on captured layouts | L | T1, T2 |
| AC-37 (new) | The 5-second rule | Asserted over the config: every kind's first-to-last light ≤ 5 s (fireball + train 4.9 s, satellite 4.8 s) | C, L | T1 to T4 |
| AC-38 (new) | Quiet index exact | max \|diff\| = 0 against `easedQuietFactor` | L | P2, after the rebase |
| AC-39 (new) | P1 changes nothing | Phase-0 sprites byte-identical; P0 screenshots pixel-identical | L, S | P1 |
| AC-40 (new) | Scroll cancel | A transient fades within 0.25 s once the page moves 20 px from its launch scroll | S, L | T1 |

**The 60-second watch protocol** (R4 §3.1) is the human check for P5 and T2. Run it on a DPR-2 laptop in Chrome, a DPR-1 external monitor (the worst case for stepping and shimmer) and an iPhone in Safari. Touch nothing for 60 s after the copy appears and note: when the first shooting star comes and how many follow; their directions; any star that pops, steps or shimmers (stare at one bright star at the right of the hero for 10 s); whether the headline seems to drift; whether the faint stars look still while the bright ones float. Then scroll to About for 15 s, scroll back, press pause and reload, switch reduced motion on and off, and hide the tab for a minute.

---

## 10. Performance budget and battery

| State | Cadence | Worker CPU per frame | Share of a core |
|---|---|---|---|
| Laptop hero, 1440 × 900, DPR 2, 60 Hz (314 stars) | 30 fps (k 2) | 0.2 to 0.4 ms | 0.6 to 1.2% |
| Laptop reading (drift 0.35) | 20 fps | 0.2 to 0.4 ms | 0.4 to 0.8%; 0 with D2 = 0 |
| Large desktop, 4K CSS at DPR 1 (1400 stars) | 20 fps | 0.8 to 1.7 ms | 1.6 to 3.4% |
| Phone hero (108 stars, cap 30) | 20 fps (22.2 on WebKit) | 0.4 to 1.0 ms, plus an estimated 2 to 4 ms of GPU per frame | 0.8 to 2% CPU; 4 to 8% GPU (to measure) |
| macOS Safari hero (unaligned clock) | 66.7 fps | as the laptop | about 1.3 to 2.7% (D7 decides the relay) |
| Software raster, 1440 × 900 at CSS resolution | 20 to 22 fps (8% budget) | 3.3 to 3.9 ms | about 8% |
| Software raster, 4K | still (budget gives < 20 fps) | n/a | as today |
| Idle (90 s), hidden, paused, reduced motion | 0 after the fades | 0 | 0 |

CPU figures are R3's measurements and estimates (§4.6), scaled to the cadences in §6.2.2.

- **Frames per minute in the hero:** about 1,050 today (15 fps of twinkle plus meteor frames), about 2,000 with the drift at DPR 2 (1.9 times). **While reading:** 0 today, 1,200 with drift 0.35 (D2 is the battery lever).
- **Memory:** the atlas grows from 127 KB to 1.77 MB at DPR 2 (0.67 MB at DPR 1); the star cache stays under twice the visible cells (at 4K about 13,000 stars, 2.7 MB, R3 §5.3).
- **Levers, in order of effect:** the reading drift (D2), `FRAME.idleSleepMs`, v₀ (D6: above 7.5 CSS px/s at the near layer, a DPR-2 laptop needs 60 fps), the narrow cap, the WebKit relay (D7).

---

## 11. Accessibility conformance summary

| Criterion | How the sky meets it |
|---|---|
| **2.2.2 Pause, Stop, Hide (A)** | Continuous drift (and twinkle) starts automatically, lasts more than 5 s and runs beside the copy, so the page gets one pause control (G186, G4) before the drift ships (P4 before P5). Decorative motion is not exempt (w3c/wcag #3478, #4921), stopping on its own counts only within 5 s, and scrolling away is not a hide mechanism (#5029) (R2 §9.1). Each transient lasts ≤ 5 s (AC-37), passing the per-instance reading; the idle stop and hero-only transients are UX choices, not the mechanism. |
| **2.3.1 Three Flashes (A)** | At most one or two luminance flashes per transient; bursts staggered ≥ 0.35 s with no flares (≤ 3 per second); every transient's change area is at most about 2,000 CSS px² against 21,824 (G176); no saturated red (R/(R+G+B) ≤ 0.37). |
| **2.3.3 Animation from Interactions (AAA)** | Scroll parallax, the glide and the lean are interaction-driven motion; all stop under prefers-reduced-motion (C39, SCR40) and under the pause. Twinkle and fades are not motion animation by the WCAG definition. |
| **1.4.3 Contrast (AA): the veil** | Drift changes star positions, never alpha, and every star is veiled at its drawn position every frame (exact index), so body text keeps 4.5:1 as today. One lit transient near copy at a time (the lease) keeps the `METEOR_VEIL` budget (about 0.053 of white against 0.082 of headroom) valid. Satellites and fireballs plan in clear sky and are veiled per frame anyway. |
| **2.5.8 Target Size (AA)** | The pause control is 40 × 40 CSS px (minimum 24 × 24). |
| **1.4.11 Non-text Contrast (AA)** | The glyph carries the state: 12.2:1 (lightest-slate on navy), 14.1:1 when mint, 10.9:1 on the mobile menu's light-navy. The focus ring is the global 2 px dashed mint (`globals.css:80-83`). |
| **2.5.3 Label in Name (A)** | The accessible name is the button's text, visible on mobile, so the visible label is always in the name. |
| **2.4.11 Focus Not Obscured (AA)** | The header reappears when focus enters it (P4); today a focused nav control in the hidden header is fully off-screen. |
| **4.1.2 Name, Role, Value (A)** | A native `<button>` whose name tracks the action (the APG carousel pattern), no conflicting `aria-pressed`. |

---

## 12. Risks and open questions

- **The veil session may never deliver.** Mitigation: V0 (§7.9), behind an explicit user go-ahead, keeps every invariant; its known issues are listed there.
- **Crossing rates rest on a synthetic layout** (R2 §4.6). The 40 s cooldown holds them at today's level in simulation (0.38 to 0.44 per minute against 0.41); IR-7 or our own captured layouts must confirm.
- **Battery while reading.** Drift 0.35 turns a sleeping worker into 20 fps for as long as the reader is present. Measure in P5; D2 = 0 is the fallback.
- **WebKit's worker clock** is unaligned and ignores Low Power Mode (R3 §2.1). The caps keep phones at 22 fps; macOS Safari draws at 66.7 fps while drifting. D7 decides the relay after device tests.
- **DPR 1 shimmer** is inherent to the pixel grid (20 to 35% max-pixel swing at σ 0.7). It is judged by eye; the 0.85 device px floor for moving stars is ready.
- **The phone GPU cost** (2 to 4 ms per full-screen frame) is an estimate; measure on a low-end Android. The 30 fps cap is the hedge.
- **Composition wander.** The reviewed composition holds only at t = 0; bright stars wander up to about 200 px over three minutes, and the brightest follow 11% of the scroll instead of 7%. Re-review the hero and the reading scene in P5.
- **Spring lag of up to about 67 px** for the brightest stars during a 3000 px/s fling may read as rubber-banding. Tighten `CAMERA.scrollOmega` to 12 if so.
- **The first-minute arc** depends on phases chosen by search. If the owner prefers another opening heading, rotate all phases by one angle (the statistics don't change).
- **Narrow screens may not reach 6 meteors a visit.** The phone hero has little clear sky and plans fail often (R2); measure.
- **Satellites at 4.8 s** may read as slow meteors. The defenses are steady light, no tail and constant speed; D9 holds the realistic version.
- **Two WCAG 2.2.2 questions are unsettled:** whether repeated short transients count cumulatively (#4447), and whether reduced motion alone is a mechanism (#4319, #3766). The plan stays conservative: ≤ 5 s each, plus the control.
- **Thresholds are lab numbers** for high-contrast targets and younger eyes (R1 §4.2). Tune v₀ by eye on a laptop, a phone and a DPR-1 monitor, ideally with an older viewer.
- **The honest note.** Real stars show no parallax; the depth is a diorama. Say so in the PR description (R1).
- **Open:** the veil session's numbers (IR-7) and whether they accept IR-1 and IR-2; D1 to D9.

---

## 13. Sources

**Repository and framework**
- `src/lib/sky/*`, `src/components/sky/*`, `src/components/Navbar.tsx`, `IntroGate.tsx`, `Introduction.tsx`, `SidePane.tsx`, `ContactMe.tsx`, `AppFooter.tsx`, `Background.tsx` and `Background.module.css`, `src/app/globals.css` (cited by file:line in the text); AGENTS.md; CLAUDE.md.
- Next.js 16.4.2 docs (`node_modules/next/dist/docs`): `01-app/01-getting-started/05-server-and-client-components.md` (the `'use client'` boundary); `01-app/02-guides/preventing-flash-before-hydration.md` (client storage and hydration); `01-app/03-api-reference/08-turbopack.md` (`new Worker()` support).
- React, `useSyncExternalStore` (`getServerSnapshot` during hydration; stable snapshots; `subscribe` outside the component): https://react.dev/reference/react/useSyncExternalStore
- Motion spring closed form: `node_modules/motion-dom/dist/es/animation/generators/spring.mjs`; https://motion.dev/docs/spring

**Accessibility**
- WCAG 2.2 Understanding: 2.2.2 https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide · 2.3.1 https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold · 2.3.3 https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions · 2.5.8 https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum · 1.4.11 https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast · 2.5.3 https://www.w3.org/WAI/WCAG22/Understanding/label-in-name · 2.4.11 https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
- Techniques G4, G11, G19, G176, G186, F16, C39, SCR40: https://www.w3.org/WAI/WCAG22/Techniques/
- w3c/wcag issues #3478, #4921, #4319, #3766, #4447, #5029 (R2 [S43])
- WAI-ARIA APG, Button (toggle labels must not change with `aria-pressed`): https://www.w3.org/WAI/ARIA/apg/patterns/button/ · Carousel (rotation control: the label changes, no `aria-pressed`): https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
- MDN, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- Apple HIG, Motion and Accessibility: https://developer.apple.com/design/human-interface-guidelines/motion · https://developer.apple.com/design/human-interface-guidelines/accessibility
- Vercel Web Interface Guidelines: https://vercel.com/design/guidelines

**Perception and physics** (full list in R1 and R4)
- Rogers & Graham (1979), motion parallax as a depth cue, https://doi.org/10.1068/p080125 · Longuet-Higgins & Prazdny (1980), https://doi.org/10.1098/rspb.1980.0057
- Abrams & Christ (2003), motion onset captures attention, https://pubmed.ncbi.nlm.nih.gov/12930472/ · Simons, Franconeri & Reimer (2000), gradual change blindness
- Watson, Ahumada & Farrell (1986), window of visibility, https://ntrs.nasa.gov/citations/19860047713 · Legge & Campbell (1981); McKee & Nakayama (1984); Harth et al. (2025), https://doi.org/10.3390/inventions10030033
- Diels & Howarth (2013), motion-sickness frequency band · Duncker (1929), induced motion · Howard & Howard (1994), vection
- CSS Values 4, reference pixel: https://www.w3.org/TR/css-values-4/#reference-pixel
- LeVeque (2007), forward Euler stability · HyperPhysics, damped oscillator: http://hyperphysics.phy-astr.gsu.edu/hbase/oscda.html
- Disney multiplane camera: https://d23.com/a-to-z/multiplane-camera

**Rendering** (full list in R3)
- WHATWG HTML, animation frames and rendering opportunities: https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames · https://html.spec.whatwg.org/multipage/webappapis.html#rendering-opportunity
- MDN, `requestAnimationFrame` and Optimizing canvas: https://developer.mozilla.org/docs/Web/API/Window/requestAnimationFrame · https://developer.mozilla.org/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- Browser sources: Chromium `worker_animation_frame_provider.cc`; WebKit `WorkerAnimationController.cpp`; Gecko `WorkerScope.cpp` (R3 §2.1)
- Skia glyph sub-pixel positions: https://github.com/google/skia/blob/main/src/core/SkGlyph.h
- Chrome, OffscreenCanvas in workers: https://developer.chrome.com/blog/offscreen-canvas · Pointer Events coalescing: https://w3c.github.io/pointerevents/#coalesced-events

**Meteors and bodies** (full list in R2)
- IMO 2026 calendar: https://www.imo.net/files/meteor-shower/cal2026.pdf · IMO FAQ: https://www.imo.net/resources/faq/
- AMS outlooks and fireball FAQ: https://www.amsmeteors.org/fireballs/faqf/
- NASA Meteoroid Environment Office, sporadic sources: https://www.nasa.gov/meteoroid-environment-office/sporadic-meteoroid-environment/ · Campbell-Brown (2005): https://www.lpi.usra.edu/meetings/dust2005/pdf/4040.pdf
- Sky & Telescope, shower radiants: https://skyandtelescope.org/astronomy-resources/astronomy-questions-answers/how-well-defined-is-a-meteor-shower-radiant/ · angular speed ω = V·sin D/q: https://arxiv.org/pdf/2112.15507
- NASA, Spot the Station FAQ: https://www.nasa.gov/missions/station/spot-the-station-frequently-asked-questions/ · Sky & Telescope, the ISS into Earth's shadow: https://skyandtelescope.org/astronomy-news/flight-into-darkness-observe-the-iss-in-earths-shadow/
- NASA, comets in depth: https://solarsystem.nasa.gov/asteroids-comets-and-meteors/comets/in-depth.amp
