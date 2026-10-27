# Check r1: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 1. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens: does every file, function, type, message and constant it names as existing exist with that shape in the worktree (master 246c0aa), is everything new marked new, do its statements about current behavior match the code, and can its integration points work with today's worker state machine, frame scheduler, star cache, `mountSky` and protocol? Also: the AGENTS.md sky import rules for every new or changed file, no Cache Components APIs, and client components that follow the codebase and the installed Next.js 16.4.2 docs.
- **Inputs.** `PLAN.md`; `HANDOFF.md`; `COORDINATION.md`; `research/00-shared-brief.md` and `research/01-planning-brief.md`; R1 to R4 where the plan cites them; the draft bodies the plan delegates to (`drafts/plan-domain-model-first.md` 6.2 and 6.4); the worktree code; `node_modules/next/dist/docs` and `node_modules/motion-dom` in the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration. Throwaway scripts live in the session scratchpad (`check-r1-cg/`), not in the repository. Never POST to `/api/schedule/book`.

## Verdict: revise

Five major findings, eleven minor, no blocking ones. None of the majors breaks a COORDINATION.md constraint before checkpoint V; they are a compile error in binding names, a P8 verification that cannot pass as written, a frame-fallback defect, a main-thread listener trap, and an accessibility claim the navbar code contradicts.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG-1 | major | 6.2, 6.9, P3, P8 | `const schedule = createSchedule()` clashes with the kept `function schedule(now)` (TS2300) |
| CG-2 | major | 7.3 P8, 7.1 H7, 6.9 | P8's "no visible change" and H7's oracle equality can't hold with the 40 s crossing cooldown active in P8 |
| CG-3 | major | 6.2 mechanism, F5, P3 | the fallback frame timer is re-armed from `now` on every message, so scrolling starves it |
| CG-4 | major | 6.13, P13, 7.1 debug patch | `mountSky` destroys the sky on any worker message other than `ready`; new worker messages hit that branch |
| CG-5 | major | 6.8 placement, 11 (2.4.11), D1 | "the menu is modal" is false in the code; the control stays focusable under the open phone menu |
| CG-6 | minor | 6.11, T3 | satellites keep light inside a newly padded rect during the 0.6 s quiet ease |
| CG-7 | minor | C3, 6.5, 6.1 | C8's accumulating `shift` makes the scroll term unbounded by the page |
| CG-8 | minor | 6.6, 6.2, M1, F7 | no final (snapped, level 0) frame after the motion ease when the camera is still |
| CG-9 | minor | 6.2, deviation 5, F2 | `combineDemands` takes the busiest demand's cap, so fades lift the drift cap on WebKit |
| CG-10 | minor | 6.13, 6.2, P7 | a `pointer` message sets `needsDraw`, which bypasses the divisor; the lean is uncapped on software raster |
| CG-11 | minor | 6.8 placement | the snippet's `ml-auto` and `md:order-last` contradict the stated layout and focus order |
| CG-12 | minor | 6.9 | `holdTransients` and `retryTransients` don't state units; today's callers pass milliseconds |
| CG-13 | minor | 6.2, F5, R-19 | three watchdog misses switch to timers for the whole visit, with no way back |
| CG-14 | minor | 4.4 vs 6.1 | `parallaxScroll` is listed as read only for us, but P2 writes it |
| CG-15 | minor | 3 (D5) | D5 overstates the cost of `node --test`; the plan's own resolve hook avoids the churn |
| CG-16 | minor | 5.1, 5.2, file lists | stale doc comments, README lines and one citation the file lists miss |

## Checked and consistent (no finding)

Listed so the reviser knows what was verified and need not be reworked.

- All 53 distinct `file:line` citations and the bare `:NNN` references (sections 2 to 8) match the worktree at 246c0aa. `src/` in the worktree equals 246c0aa (`git diff --stat 246c0aa -- src` is empty).
- Next.js 16.4.2 citations hold: `05-server-and-client-components.md:178-180` (the `'use client'` boundary), `:26` (browser APIs such as `localStorage`), `preventing-flash-before-hydration.md:11`, `scripts.md:128`, `08-turbopack.md:482` (`turbopackWorkerAssetPrefix`). No Cache Components API appears anywhere.
- The AGENTS.md import rules hold for every new and changed file in 5.1: new `src/lib/sky` files import only siblings by relative path; worker files import only `@/lib/sky/*` and each other; `mountSky.ts` keeps importing only types and `@/lib/sky/color` from `src/lib/sky`; `skyPause.ts` and `SkyPauseToggle.tsx` import nothing from `src/lib/sky`. The type-only back-import `satellites.ts` to `transients.ts` avoids a runtime cycle.
- Before checkpoint V no phase edits the body of a function COORDINATION.md gives to the veil session. The names the `scroll` and `layout` handlers read keep their meaning (`rafId` falsy when nothing is pending, `timerId`, `noteInput`, `retryMeteors`, `meteorsAllowed`, and `sameRects` under the same name).
- The quiet index's exactness argument holds against `scene.ts:71-124` and the delegated body (`drafts/plan-domain-model-first.md:1152-1206`): `zonesNear`'s closed-interval test keeps every zone that can contribute, and the clamp covers stars culled at exactly `EDGE`.
- `springStep` matches motion-dom's critically damped closed form (`node_modules/motion-dom/dist/es/animation/generators/spring.mjs:232-241`), velocity included.
- `LayerConfig.parallax` has one reader (`renderSky.ts:100`); `SceneLevels.meteors` one (`sky.worker.ts:145`); `heroMeteorMaxScroll` one (`scene.ts:36`).
- Omitting `'use client'` from `SkyPauseToggle.tsx` matches the docs and the codebase's own convention (`TechList.tsx:12`). The tokens it uses exist (`--color-green-tint`, `globals.css:17`; the focus ring at `globals.css:80-83`).
- `.claude/launch.json` sets `autoPort: true` for both servers, as 7.0 says. The main checkout's `tsc` does not pick up nested worktrees (TypeScript's `**` wildcard skips dot directories such as `.claude`).

## Findings

### CG-1 (major): `schedule` is declared twice in `sky.worker.ts`

- **Section.** 6.2 "The worker's mechanism" (`schedule(now)` keeps today's structure); 6.2 `frameDemand` comment ("P8 replaces this line with transientDemand(schedule, t)"); 6.9 "In the worker (P8)"; 7.3 P3 and P8.
- **Problem.** P3 keeps the frame scheduler `function schedule(now: number): void`. P8 then adds, in the same module scope, `const schedule = createSchedule()` ("`meteor`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt` ... become `const schedule = createSchedule()`") and passes it to `updateTransients(schedule, …)`, `transientDemand(schedule, t)` and `nextLaunchAt(schedule)`. Section 6 says "names and contracts are binding", so the plan as written does not compile.
- **Evidence.** `sky.worker.ts:152` declares `function schedule(now: number): void`; it is called at `:338` (`rebuildHaze`), `:412` (the `contextrestored` listener) and `:486` (after every message). A scratch reproduction type-checked with the installed TypeScript 6.0.3 reports `TS2300: Duplicate identifier 'schedule'` at both declarations, plus TS2345 where the transient state is passed (`check-r1-cg/clash.ts`).
- **Fix.** Give the transient state another name, for example `const transients = createSchedule()`, and use it in 6.2's comment, 6.9 "In the worker (P8)", 4.1 and P8's file list. Keep `schedule(now)`, which the message listener and two of our functions call.

### CG-2 (major): P8 changes launches, so its "no visible change" and H7's oracle equality can't hold

- **Section.** 7.3 P8 "No visible change means"; 7.1 H7 ("for the same seed and inputs, P8's launches and gaps equal the oracle's"); 6.9 `TRANSIENTS` (`crossingCooldown: 40`) and scheduler step 3.3 (`mayCrossCopy: inkLeaseFree(schedule, now)`).
- **Problem.** P8 introduces the 40 s crossing cooldown. A launch less than 40 s after the last crossing's launch must then stay in clear sky (`nearCopy: false`), which picks a different path, and its different random draws make every later launch differ from the oracle (today's `updateMeteor`). P8 names only one difference (the 0.2 s cancel fade) and claims "the same veil checks".
- **Evidence.** Today the next launch comes `plan.duration + nextMeteorGap(…)` after a launch (`sky.worker.ts:223`), with gaps of 30 + Exp(12) s capped at 75 (`meteors.ts:244-247`, `config.ts:239-241`). [computed, `check-r1-cg/cooldown.mjs`, 10^6 draws] 51.9% of next launches fall within 40 s of the previous one. With the plan's own crossing shares (16 to 19% synthetic; 36% for today's geometry, 7.3 P9) that is 8 to 19% of all P8 launches re-planned in clear sky.
- **Fix.** Either set `crossingCooldown` to 0 in P8 and raise it to its tuned value in P9, next to the rate it exists to offset (where deviation 11 and AC-38 calibrate it), or keep it in P8, name "fewer copy crossings" as P8's second visible change, and give H7's oracle the same lease and cooldown rule so the equality check can pass.

### CG-3 (major): the fallback frame timer starves while messages arrive

- **Section.** 6.2 "The worker's mechanism" (`requestFrame()`, `schedule(now)`); invariant F5; 7.3 P3 verification.
- **Problem.** In timer-fallback mode the pending frame is a timer in `timerId`. `schedule(now)` returns early only for a pending `rafId`, "and it clears `timerId`", then `requestFrame()` re-arms `setTimeout(onTimer, 1000 / PACING.fallbackFps)` counted from now. The worker calls `schedule(now)` after every message, so each message pushes the next frame 16.7 ms later. Motion's `scroll()` posts one scroll message per main-thread frame, 8.3 ms apart on a 120 Hz screen, and P7 adds up to one pointer message per frame. The sky then stops drawing while the visitor scrolls, the moment it moves most. Today's timer path doesn't have this problem because it re-arms against the last drawn frame.
- **Evidence.** `sky.worker.ts:486` (`schedule(now)` after every message); `sky.worker.ts:167` (today's deadline: `lastDrawAt + frameInterval(mode) - now`); `mountSky.ts:232-241` (the frame-batched scroll listener). [computed, `check-r1-cg/fallback.mjs`] Over 2 s of scroll messages: 0 frames with messages every 8.3 ms (scroll on a 120 Hz screen, or scroll plus pointer at 60 Hz), 61 instead of 120 with 60 Hz messages and ±1 ms jitter; a deadline-based timer gives 120 in every case.
- **Fix.** Arm the fallback frame against the last drawn frame, `setTimeout(onTimer, Math.max(0, lastDrawAt + 1000 / PACING.fallbackFps - now))`, or have `schedule` return early while a fallback frame timer is pending, as it does for `rafId` (keep that timer in `timerId`, so the veil-owned scroll handler still sees a pending frame). Add "scroll for 5 s" to P3's never-calls-back patch test.

### CG-4 (major): new worker-to-main messages would destroy the sky

- **Section.** 6.13 (P13 adds `{ type: 'relay'; on: boolean }`); 7.3 P13 files; 7.1 "The debug patch" (`debug-frame`, `debug-transient`).
- **Problem.** The main thread treats every worker message other than `ready` as fatal. P13's file list says `mountSky.ts` gains "a main-thread rAF loop that posts `tick` while the worker asks for it", and the debug patch says `mountSky` "collects them into `window.__skyDebug`", but neither says that the existing `else destroy()` must change. TypeScript won't flag it: the `if`/`else` compiles with any union. The first relay request would tear the sky down on the Safari devices P13 exists for, and the first debug message would do the same during P3 and P6 verification.
- **Evidence.** `mountSky.ts:261-268`: `if (event.data.type === 'ready') canvas.dataset.ready = ''` then `else destroy()`. `protocol.ts:69-70`: `SkyWorkerMessage` is `ready` or `error` today.
- **Fix.** Replace the listener with a `switch (event.data.type)` over `ready`, `error` (destroy) and any new type, with a `never` default, so a future message type fails to compile instead of destroying the sky. P5 already edits this listener (`setSkyRunning(true)` on `ready`), so make the switch part of P5 and say so in P13 and the debug-patch description.

### CG-5 (major): the control is focusable under the open phone menu, so 2.4.11 fails

- **Section.** 6.8 Placement ("While the phone menu is open its panel covers the control. That is fine: the menu is modal."); section 11, row 2.4.11; D1.
- **Problem.** The phone menu is not modal for the header. Opening it locks the body's scroll and makes only `#content` inert. The header, and the new control in it, stay in the tab order. The panel `#primary-nav` is opaque, covers the right three quarters of the screen above the header's items, and only the burger rises above it. A control "beside the menu button" sits under the panel, and Tab still reaches it: after Resume if it comes after `#primary-nav` in the DOM, right after the burger if it comes before. A focused control that is fully hidden fails 2.4.11 Focus Not Obscured (Minimum, AA), which section 11 says the plan meets.
- **Evidence.** `Navbar.tsx:52-53` (`overflow-hidden` on the body, `inert` on `#content` only); `Navbar.tsx:127` (`fixed right-0 top-0 h-screen w-3/4 bg-light-navy … z-[50]`); `Navbar.tsx:117` (the burger's `z-[100]`).
- **Fix.** While `mobileMenuOpen`, take the control out of sight and out of the tab order (for example `inert` and `invisible` on its wrapper, from the state the panel already uses), or place it where the panel doesn't cover it, or render a second instance inside the panel. Add a phone check to P5: open the menu, Tab through it, and focus never lands on a covered control.

### CG-6 (minor): satellites keep light inside a new padded rect during the quiet ease

- **Section.** 6.11 Drawing ("a satellite adds **no light inside any padded rect**, even if a layout changes mid-pass"); 4.3 T3.
- **Problem.** The drawer multiplies the satellite's alpha by `easedQuietFactor(frame.quiet, x, y, LAYERS.near)`. During an ease that is the current factor times `level` plus the previous one times `1 − level`. A rect a layout adds or moves onto the satellite gives 0 now but 1 before, so the satellite keeps `1 − level` of its light inside it: all of it when the ease starts, for up to `QUIET.ease` (0.6 s). It is rare in the hero after 30 s (no scroll, no resize), but T3 is what lets satellites skip the ink lease (COORDINATION.md request 1).
- **Evidence.** `scene.ts:113-124` (`quietFactor`, `easedQuietFactor`); `config.ts:138` (`ease: 0.6`); `sky.worker.ts:471-484` (a layout with changed rects starts an ease).
- **Fix.** For kinds that never take the lease, use the stricter of the two zone sets, `Math.min(quietFactor(blend.from, x, y, keeps), quietFactor(blend.to, x, y, keeps))` with near keeps (0 inside either), or retire them when a layout changes the rects, as a resize does. Name the choice in T3's "Enforced by" column.

### CG-7 (minor): the scroll term is not bounded by the page

- **Section.** 4.3 C3 ("The scroll part is at most 0.07 × the page's scroll range"); 6.5 ("the scroll term within 0.112 of the page's scroll range"); 6.1 `resumeCamera`.
- **Problem.** `resumeCamera` sets `shift = scrollY − scroll.value`, and the springs follow `scroll − shift`. Pause at the top, scroll to the bottom (range R), press Play, scroll back to the top: `scroll.value` is now −R. Each such cycle adds another R. SF2's guard keeps it safe, but C3 and "why nothing wraps" state a bound the code does not have.
- **Evidence.** PLAN.md 6.1 (`goal = input.scroll - camera.shift`, `resumeCamera`). [computed] Reaching the ±32,768-cell key range at q = 1.6 on a 20,000 px page takes 0.112 × 20,000 × n ≥ 32,768 × 256, so n ≥ 3,745 full-page pause cycles.
- **Fix.** Reword C3 as "at most 0.07 × the scroll travelled under full motion" (or "per pause cycle"), and name SF2 as the guard for the pathological case.

### CG-8 (minor): no final frame after the motion ease when the camera is still

- **Section.** 6.6 "The motion level"; 6.2 `frameDemand` (the motion-ease `FADE_FRAMES` line); M1, F7; H13 item 3; the snap table in 6.3 ("Under reduced motion or a completed pause, frames are today's").
- **Problem.** The ease draws fade frames while `t − motionChangedAt < FRAME.motionEase`. The first tick after that has no demand, so it doesn't draw, and the level-0 frame (no twinkle, stars snapped) appears only if something sets `needsDraw`. F7 does so only when the camera was moving. With a still camera (P5 before P6; reading at D2 = 0; a software canvas where the drift is unaffordable), a pause leaves the last mid-ease frame on screen: stars at quarter-pixel phases and a little twinkle (level about 0.03 for a frame 33 ms before the end). `settleQuiet` exists for exactly this pattern.
- **Evidence.** `sky.worker.ts:236-243` (`settleQuiet` and its reason); PLAN.md 6.2, 6.3, 4.3 F7.
- **Fix.** Add `settleMotion(now)` next to `settleQuiet` (set `needsDraw` once when `lastDrawAt` fell inside the ease and `now` is past it), call it from `tick`, and give H13 a still-camera pause case.

### CG-9 (minor): fades lift the drift's cap on WebKit's unaligned clock

- **Section.** 6.2 `combineDemands` and `tick` step 2; deviation 5; F2.
- **Problem.** `combineDemands` returns the cap of the demand with the most frames. During the dusk, a quiet ease or the motion ease, `FADE_FRAMES` (30 fps, cap Infinity) beats the drift (20 fps, cap 30), so the combined demand is 30 fps on animation frames with no cap. On aligned clocks that is still 30 fps. On WebKit's unaligned clock `tick` sets `fps = Infinity`, and an iPhone then draws every 15 ms tick in those windows, not every third tick as deviation 5 and F2 say.
- **Evidence.** PLAN.md 6.2 `combineDemands`, `refreshDivisor`, `tick` step 2. [computed] `max(floor(66.7 / ∞), ceil(66.7 / ∞), 1) = 1`.
- **Fix.** Combine caps as the minimum over the moving (vsync) demands unless an uncapped moving demand such as `EVERY_FRAME` is present, so a fade never lifts the drift's cap. Add the case to H4.

### CG-10 (minor): pointer messages bypass the pacing

- **Section.** 6.13 pointer listener ("`pointer` sets the lean target, calls `noteInput` and sets `needsDraw`"); 6.2 `tick` step 3 and `cameraDemand`; 7.3 P7.
- **Problem.** `tick` draws on `needsDraw || frameDue(…)`, and pointer messages arrive up to once per main-thread frame, so every refresh draws while the mouse moves (60 to 144 fps instead of the paced 20 to 30), and AC-13's "within ±25% of k refreshes" fails while leaning. When the drift isn't wanted (software raster), `cameraDemand`'s cap is Infinity, so the lean glide is also uncapped on the canvases the software budget protects.
- **Evidence.** PLAN.md 6.2 (`cap: wanted ? driftCap() : Infinity`; tick step 3); 6.13.
- **Fix.** Don't set `needsDraw`: `schedule(now)` already runs after every message. Add the lean to the camera demand (its target differs from the springs), so a resting camera still gets frames (F6), and apply `driftCap()` to lean frames.

### CG-11 (minor): the placement snippet contradicts its requirements

- **Section.** 6.8 Placement.
- **Problem.** `<nav>` is a `justify-between` flex row. The wrapper's `ml-auto` takes all the free space, so on desktop the links and Resume move next to the logo instead of staying on the right. An empty wrapper (no sky yet, or a failed sky) keeps that auto margin, so "the empty wrapper takes no space" holds only for its width. `md:order-last` matters only if the wrapper comes earlier in the DOM, and then desktop Tab order (control before the links) differs from what's on screen (control after Resume).
- **Evidence.** `Navbar.tsx:88` (`flex w-full items-center justify-between`), `:124-131` (`#primary-nav`); PLAN.md 6.8 snippet.
- **Fix.** Put the wrapper last in the DOM, after `#primary-nav`, with no `ml-auto` and no `order`; keep the margins on the button; on phones group it with the burger. Re-check against CG-5.

### CG-12 (minor): `holdTransients` and `retryTransients` don't state units

- **Section.** 6.9 scheduler signatures; "In the worker (P8)" ("`holdMeteors` and `retryMeteors` become `holdTransients` and `retryTransients`").
- **Problem.** The schedule stores seconds ("Next launch attempt per kind (s)"), but today's callers pass worker milliseconds and convert inside the function. A mechanical rename passes milliseconds as seconds and holds every launch for hours.
- **Evidence.** `holdMeteors(now)` at `sky.worker.ts:112`, `:439`, `:456` converts at `:103`; `retryMeteors(now)` at `:371`, `:482` converts at `:345`.
- **Fix.** Say "`now` in seconds" in both docs and show the call sites as `holdTransients(transients, now / 1000)` (with CG-1's name).

### CG-13 (minor): the watchdog never gives animation frames a second chance

- **Section.** 6.2 `PACING` doc ("after `watchdogStrikes` misses in a row, frames come from a `fallbackFps` timer for the rest of the visit"); F5; R-19.
- **Problem.** Any 750 ms while visible with no worker animation frame moves the sky to timer frames for good: a GPU context loss and restore (which the worker already handles, `sky.worker.ts:408-413`), a GPU process restart, or a window occluded where `visibilityState` stays `visible`. The cost is the judder R3 §2.2 measures for 60 Hz timers (3.3 jolts a second) and frames that keep running while nothing is shown.
- **Fix.** In fallback mode, keep probing: request one animation frame every few seconds and return to rAF when it arrives; also reset the strikes on `contextrestored` and on a `visible` message.

### CG-14 (minor): `parallaxScroll` is called read only, but P2 writes it

- **Section.** 4.4 ("Read only, by us, at any time: `parallaxScroll`, …") against 6.1 ("on a change back to full ... then `parallaxScroll = scrollY`").
- **Fix.** Drop `parallaxScroll` from the read-only list and note the write in 8.1's seam table: written by the scroll handler under full motion and by our `motion` handler on resume, with the same meaning.

### CG-15 (minor): D5 overstates the cost of `node --test`

- **Section.** 3, D5.
- **Problem.** D5 says `node --test` needs a `.ts` extension on every import in `src/lib/sky` plus `allowImportingTsExtensions`, "churning files the veil session also edits". The plan's own 12-line resolve hook (7.1) loads those files unchanged, and it works the same with `node --import ./register.mjs --test`. The real cost is committing the hook beside the tests.
- **Fix.** Restate the alternative: "no dependency; the resolve hook from 7.1 is committed with the tests; no source file changes".

### CG-16 (minor): docs and a citation the file lists miss

- **Section.** 5.1, 5.2 and the phase file lists.
- **Problem.**
  - `sky.worker.ts:1-5` says twinkle draws at 15 fps from timers and that "reduced motion, reading and idle visits sleep"; `schedule`'s doc (`:148-151`) describes today's rAF and timer split. After P3 and P6, reading drifts and motion draws on divided animation frames.
  - `README.md:75` and `:80` describe the two sky folders; they gain the pause store and control, and camera, pacing, presence, the quiet index and transients.
  - 5.1's table leaves out P13's changes to `protocol.ts`, `mountSky.ts` and the worker.
  - 5.2 cites `08-turbopack.md:130` for "Turbopack handles `new Worker()` expressions". That line only says magic comments work with `new Worker()` expressions. The working pattern at `mountSky.ts:79-80` is the stronger evidence.
- **Fix.** Add the worker header and `schedule` doc to P3 and P6, the README lines to P5, P6 and P8, P13 to 5.1's rows, and reword the citation.

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r1-cg/` (not in the repository):

- `clash.ts`: the `schedule` clash, type-checked with TypeScript 6.0.3 (CG-1).
- `cooldown.mjs`: the share of launches the 40 s cooldown re-plans under today's gap law (CG-2).
- `fallback.mjs`: fallback frames drawn under message streams, relative against deadline-based re-arming (CG-3).
