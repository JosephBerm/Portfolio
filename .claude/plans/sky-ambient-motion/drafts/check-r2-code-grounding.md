# Check r2: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 2. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens. Does every file, function, type, message and constant it names as existing exist with that shape in the worktree (master 246c0aa)? Is everything new marked new? Do its statements about current behavior match the code? Can its integration points work with today's worker state machine, frame scheduler, star cache, `mountSky` and protocol? Also: the AGENTS.md sky import rules for every new or changed file, no Cache Components APIs, and client components that follow the codebase and the installed Next.js 16.4.2 docs. In round 2: confirm that each round-1 fix landed correctly, and look for regressions the revision introduced.
- **Inputs.** `PLAN.md` (3,460 lines, read in full); `HANDOFF.md`; `COORDINATION.md`; `research/00-shared-brief.md` and `research/01-planning-brief.md`; R2 §10 and R3 §2 where the plan relies on them; my round-1 report (`drafts/check-r1-code-grounding.md`) and the round-1 dispositions; the worktree code (`src/` equals 246c0aa: `git diff --stat 246c0aa -- src` is empty); `node_modules/next/dist/docs`, `node_modules/framer-motion` and `@types/react` in the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration. Throwaway scripts live in the session scratchpad (`check-r2-cg/`), not in the repository. Never POST to `/api/schedule/book`.

## Verdict: revise

One major finding and seven minor ones, no blocking ones. The major one is a regression from round 1's CG-10 fix: on a desktop with the pointer lean, pausing the sky right after moving the mouse to the control leaves the worker drawing 20 frames a second for as long as the pause lasts. A second regression (minor) comes from round 1's CG-3 fix.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG2-1 | major | 6.2, 6.13, P7 | `leanPending` has no motion gate: a pause that freezes the lean springs off target draws 20 fps forever |
| CG2-2 | minor | 6.2 mechanism, F5 | the fallback timer, armed one 60 Hz period after the last draw, spins 3 to 8 wake-ups per frame when k ≥ 2 |
| CG2-3 | minor | 6.3, M1, AC-9, AC-27 | the level-0 snap hops every star up to 0.5 device px, so AC-9 and AC-27 fail by design |
| CG2-4 | minor | 4.3 R1, 6.9, P10 | `dropTransients` (hidden and resize) resets `VisitMemory`, re-picking the shower and clearing the fireball spacing |
| CG2-5 | minor | 5.4, 7.0 | the production smoke build skips P2, P4, P9 and P11, which also add worker-graph modules |
| CG2-6 | minor | 7.1 H2, P2, AC-35 | P2's H2 identity can't hold on the grid's scroll 1234.5 and 5000 rows |
| CG2-7 | minor | 6.10, P9, P10 | `METEOR.radiantTries` is orphaned but not listed; I2 drops the fireballs' speed and duration lines in P9 |
| CG2-8 | minor | 8.5, 8.6 | the rebase rule would drop any line the veil commit adds to `tick` or `draw` |

## Round-1 fixes in this lens: verified

| Round-1 ID | Landed? | Where |
|---|---|---|
| CG-1 | yes | `const transients = createSchedule()` (6.9 line 2051, P8 line 2862); the 6.2 comment says `transientDemand(transients, t)` (line 1045). The `schedule` parameters left in `transients.ts` are function parameters in another module, so no clash. |
| CG-2 | yes | `crossingCooldown: 0` in the P8 block (line 1984), 55 from P9 (lines 1974, 2887, 2898); H7's oracle equality states it (line 2563). With one meteor at a time and gaps of 30 s or more, `mayCrossCopy` is always true in P8, so the equality can hold. |
| CG-3 | yes, with a regression | The fallback timer is armed against `lastDrawAt` (line 1110). With k ≥ 2 it now spins: CG2-2. |
| CG-4 | yes | The `switch` with a `never` default (line 1750); P13 (line 2976) and the debug patch (line 2552) rely on it. |
| CG-5 | yes | `inert={mobileMenuOpen}` on the wrapper (lines 1706, 1715). Motion forwards `inert` (no `@emotion/is-prop-valid` is installed, so `filterProps` forwards every non-motion prop), and `@types/react` 19.3 types it as `boolean`. |
| CG-6 | yes | `clearSkyFactor` (line 2414; T3 line 301); `quietFactor` is already exported (`scene.ts:113`). |
| CG-7 | yes | C3 (line 270), 6.5 (line 1321). |
| CG-8 | yes | `settleMotion` (line 1484), tick step 1 (line 1119), F7, H13 case 4. |
| CG-9 | yes | `combineDemands` (lines 953-965): drift plus a fade gives cap 30, so k = 3 on WebKit's clock. |
| CG-10 | yes, with a regression | No `needsDraw` on `pointer` (line 2471), but the new `leanPending` gate has no motion test: CG2-1. |
| CG-11 | yes | The wrapper is the last child of `<nav>` with no `order`; the burger takes `ml-auto`, `#primary-nav` takes `md:ml-auto` (lines 1697-1714). On phones `#primary-nav` is `fixed`, so it is out of flex flow: logo, then burger and control on the right. On desktop the burger is `md:!hidden`: logo, then links, Resume and control. DOM order equals visual order at both widths. |
| CG-12 | yes | "`now` in seconds" (lines 1913, 1924); call sites pass `now / 1000` (line 2055). |
| CG-13 | yes | `reprobeMs`, the probe, and strike resets on `contextrestored` and `visible` (lines 896-897, 1111, 1114). |
| CG-14 | yes | 4.4 (line 326), 8.1 (line 3003). |
| CG-15 | yes | D5 (line 170). |
| CG-16 | yes | P3 and P6 update the worker docs (lines 2711, 2804); README in 5.1 and the phases; P13 in 5.1; 5.2 cites `mountSky.ts:79-80` (line 379). |

## Checked and consistent (no finding)

- **Citations.** Every `file:line` I checked in sections 1 to 8 matches the worktree: `sky.worker.ts` (:17-22, :61-66, :82-84, :87-114, :97-99, :103, :116-133, :136-190, :144-146, :152, :167, :171-174, :183-190, :193-224, :202, :206, :207-212, :213-218, :227-243, :246-267, :270-283, :295-298, :309-320, :345, :369-371, :401-427, :409-413, :420-421, :437-443, :444-458, :447-448, :453, :463-470, :465, :467, :469, :471-484, :486), `renderSky.ts` (:38-39, :48, :71-72, :93, :100, :107, :120, :121-125, :155, :222), `skyAssets.ts` (:26-27, :45-55, :57-60, :63-78, :81-120), `config.ts` (:58-59, :78-80, :138, :164, :204, :206-221, :231-234, :237, :246-255, :253, :289, :316-319), `meteors.ts` (:130-131, :138, :140-145, :147-152, :156, :158-159, :165), `scene.ts` (:11-18, :30, :63, :76, :89, :113-124), `protocol.ts` (:26-32, :69-70), `mountSky.ts` (:3, :17-27, :37-40, :42-47, :79-80, :146, :149, :243-247, :249-259, :261-268), `Navbar.tsx` (:1, :14-18, :31, :48-50, :52-53, :79, :88, :117, :127), `IntroGate.tsx` (:54, :94-100), `SidePane.tsx:26`, `animations.ts:36`, `Background.module.css:27-31`, `globals.css` (:17, :80-83, :273-278), `Card.tsx:7`, `utils.ts:20`, `eslint.config.mjs:13`, `README.md` (:75, :80).
- **Next.js 16.4.2 docs.** `05-server-and-client-components.md:178-180`, `preventing-flash-before-hydration.md:11`, `scripts.md:128`, `08-turbopack.md:130` and `:482` say what the plan quotes. No Cache Components API appears anywhere.
- **Worktree mechanics.** `.claude/launch.json` is tracked, so a new worktree gets `autoPort: true`. ESLint's `.claude/worktrees/**` ignore is relative to each worktree's own config, so `npm run lint` works inside one. Next 16.4.2's `lib/find-root.js` detects git worktrees when it infers the root.
- **Import boundaries (AGENTS.md).** Every new `src/lib/sky` file (`camera`, `pacing`, `presence`, `quietIndex`, `transients`, `radiants`, `satellites`) imports only siblings, by relative path. `radiants.ts` imports only types from `meteors.ts`, and `satellites.ts` only types from `transients.ts`, so there is no runtime cycle. The worker files gain only `@/lib/sky/*` and `./skyAssets` imports. `mountSky.ts` keeps importing only types and `@/lib/sky/color` from `src/lib/sky`; `skyPause.ts` and `SkyPauseToggle.tsx` import nothing from it, and no worker file imports them.
- **Client component.** `SkyPauseToggle.tsx` without `'use client'` matches the docs (its only importer, `Navbar.tsx`, is a client entry). It follows the icon pattern: `Icon` without a `title` is `aria-hidden` (`Icon.tsx:14-15`), and icons take no props, so sizing from the button's `[&_svg]:` classes is right.
- **Code sketches.** `springStep` matches motion-dom's critically damped form; `placePoint` with `snap` reproduces `renderSky.ts:132` exactly; the 6.7 claim that `DRIFT.speed === 0` is TS2367 under `as const` is right; `drawTransient`'s `never` default compiles with one kind. The rangeTop point in aim step 8, (cx, `METEOR.top`), is the spawn area's highest elevation: for |v| ≤ 0.58 on screen, elevation falls with y and with |u|, so the factor never exceeds 1.
- **State today.** Local master is still 246c0aa, and `git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky` is empty, so no veil work is visible in the main checkout at the time of this check.

## Findings

### CG2-1 (major): a pause can leave the lean demanding 20 frames a second forever

- **Section.** 6.2 `frameDemand` (line 1049) and its table (line 1086); 6.13, the pointer listener (lines 2470-2471); 7.3 P7 (lines 2838, 2844).
- **Problem.** `leanPending(scene)` is defined only as "the lean springs are away from `leanTarget(scene)`", with no motion test. Under reduced motion or a pause, `stepCamera` freezes the springs where they are: it zeroes their velocity and never calls `settle` (lines 695-700). Pointer messages are "sent only under full motion" (line 2470), so the target stays where the mouse last was. A visitor moves the mouse to the navbar's control and clicks it: the springs, still gliding toward the pointer, freeze off target, and `leanPending` stays true for the whole pause. `frameDemand` exits early only for `motion === 'off'` (line 1041), so it keeps returning `cameraDemand`, and `motionFps(0)` floors at `PACING.minFps`. The worker draws 20 identical snapped frames a second on animation frames, through the 90 s idle window, until Play. This came in with round 1's CG-10 fix.
- **Evidence.** [computed, `check-r2-cg/leanpause.mjs`, the plan's `stepCamera`, `settle`, `frameDemand` camera line and `motionFps` transcribed] The pointer sweeps to the top-right control, and the pause comes 0.2, 0.5, 1.0 or 1.5 s after the last move. In each case: 20.0 frames a second for the next 120 s (2,394 frames, 600 of them after the idle window). Only a click after about 2.2 s of stillness, once the springs have settled, gives 0. The plan promises the opposite: E12 "0 frames idle, hidden or paused" (line 157), AC-14 "0 drawn frames ... when paused" (line 3171), 10.1 (lines 3216-3220), 10.2's "paused | 0" (line 3233) and B-4 (line 3242). No listed check catches it: P7's checklist (line 2844) omits AC-14, and AC-26's two screenshots stay identical because the frames are snapped copies.
- **Fix.** Gate it on full motion: `leanPending(scene)` is `motion === 'full' &&` the springs away from the target. On Play the springs then glide on from where they froze, as C8 intends. Add AC-14 to P7's checklist, and an H13 case: sweep the pointer, pause within 0.5 s, and expect 0 frames after the 0.3 s ease.

### CG2-2 (minor): the fallback timer spins when the divisor is above 1

- **Section.** 6.2 "The worker's mechanism": `requestFrame` (line 1110), `schedule` (line 1117), `tick` steps 2 and 3 (lines 1120-1121); `frameDue` (lines 1003-1007); F5 (line 291).
- **Problem.** Round 1's CG-3 fix arms the fallback timer at `lastDrawAt + 1000 / PACING.fallbackFps`, one 16.7 ms period after the last draw. But `tick` draws a vsync demand only once `now − lastDrawAt ≥ (k − 0.5) × refresh.interval`, and the drift's k is 2 to 7. So the first wake-up draws nothing and re-arms a timer that is already due. The delay is 0, clamped to 4 ms once timers nest more than 5 deep, and the loop runs until the threshold passes: several wasted ticks per drawn frame, and frames at irregular gaps rather than every k timer periods. In fallback mode the k also comes from `refresh.interval`, a stale estimate that can be 8.33 ms after a 120 Hz display stalled. Separately, the same paragraph's non-sleep timer, "at `lastDrawAt + 1000 / demand.fps`", drops today's `needsDraw ? 0` (`sky.worker.ts:167`). A `contrast`, `motion` or `layout` message during a twinkle or fade then waits up to 67 ms to draw.
- **Evidence.** [computed, `check-r2-cg/fallbackk.mjs`, timers 0 to 1 ms late with HTML's 4 ms nesting clamp] On a 60 Hz estimate, with a drift need of 20 or 27.3 fps: k = 2, 3.0 wake-ups per drawn frame, and frames at 38 fps with gaps of 25 to 29.8 ms instead of 33.3. On a 120 Hz estimate: k = 4 or 5, 4 to 6 wake-ups per frame. At 144 Hz: k = 5 to 7, 4.9 to 7.9 wake-ups. `EVERY_FRAME` (k = 1) is unaffected.
- **Fix.** In fallback mode, treat the timer as the refresh: compute k from `1000 / PACING.fallbackFps`, not the stale estimate, and arm `Math.max(0, lastDrawAt + (k − 0.5) × 1000 / PACING.fallbackFps − now)`. It stays armed against the last drawn frame, so messages still can't push it back, and every wake-up draws. Keep today's `needsDraw ? 0` in the timer branch. Add a case to H4 or H13: fallback mode with a k = 2 demand wakes once per drawn frame.

### CG2-3 (minor): the level-0 snap makes every star hop, so AC-9 and AC-27 fail by design

- **Section.** 6.3 `placePoint` (lines 1200-1219) and the snap table (line 1232); M1 (line 282); F7 (line 293); AC-9 (line 3166); AC-27 (line 3184).
- **Problem.** From P5, stars snap to whole pixels only once the motion level reaches 0, and `settleMotion` makes sure that frame is drawn. That frame moves every star from its quarter-pixel phase to `Math.round`, up to 0.5 device px in one frame, and pressing Play moves it back on the first frame of the ease. AC-9 counts pause and reduced motion at "normal + 0.25 px" per frame, which fails at DPR 1. AC-27 allows "at most 1.05 px after the switch", which fails in the worst case at every DPR. The idle sleep already avoids the hop ("stars keep their phases, so nothing jumps"); the pause doesn't.
- **Evidence.** [computed, `check-r2-cg/snaphop.mjs`, the plan's `placePoint`] The hop is at most 0.500 device px (mean 0.250). Adding it to 6.6's 1.022 px of ease travel (line 1482) gives 1.52 CSS px at DPR 1, 1.36 at 1.5 and 1.27 at 2, against AC-27's 1.05.
- **Fix.** Snap only a sky that hasn't moved in this page view (a load under reduced motion), and keep the phases through a pause, as the idle sleep does. S4's identity and H2 still hold for reduced-motion loads. Alternatively, state the 0.5 device px hop in AC-9 and AC-27 as an accepted exception.

### CG2-4 (minor): `dropTransients` resets the visit's memory on a hidden tab

- **Section.** 4.3 R1 (line 306); 6.9 `dropTransients` (lines 1922-1923) and "In the worker (P8)" (line 2056); P10 (lines 2917, 2934).
- **Problem.** R1 says a visit's sources "stay fixed until a resize, a layout change or `maxFailedPlans` failed plans", and enforces it with "`VisitMemory` reset in `dropTransients`". But the worker calls `dropTransients` on a hidden tab as well as on resize, so switching tabs re-picks the visit's shower. From P10 `VisitMemory` also holds the last fireball's time (lines 1811-1812, 2917). A whole-memory reset on hidden or resize then clears the 120 s spacing, so P10's "no two fireballs closer than 120 s" fails over H7's random sequences, which include hidden and resize events (line 2563).
- **Evidence.** Lines 306, 1922-1923, 2056, 2563, 2917, 2934.
- **Fix.** Let `dropTransients` drop only the active transients. Reset `visit.sky` on resize, in `retryTransients` and after the failed-plan limit, never on hidden. Never reset the last fireball's time within a visit.

### CG2-5 (minor): the production smoke build skips phases that add worker modules

- **Section.** 5.4 Verification (line 408); 7.0 Commands (line 2500); R-18 (line 3298).
- **Problem.** The smoke build runs "at the end of P1, P3 and P8, which change the worker's module graph", because production builds minify and mangle export names. But P2 adds `camera.ts`, P4 `presence.ts`, P9 `radiants.ts` and P11 `satellites.ts`, and the worker chunk imports each of them. P5 also adds a client component whose hydration AC-41 checks only in dev.
- **Evidence.** 5.1 (lines 338-345); P2 (line 2670), P4 (line 2736), P9 (line 2889), P11 (line 2944).
- **Fix.** Run the smoke build at the end of every phase that adds a module to the worker graph or changes the client bundle (P1 to P5, P8, P9, P11), or simply at the end of every phase.

### CG2-6 (minor): P2's H2 identity can't hold on the grid's scrolled rows

- **Section.** 7.1 H2 (line 2558); P2 step 3 (line 2682) and verification (line 2691); AC-35 (line 3192).
- **Problem.** H2's grid scrolls to 0, 1234.5 and 5000 px. In P1's reference lists that scroll also sets `parallaxScroll`, so stars sit 0.02, 0.04 or 0.07 times the scroll higher (`renderSky.ts:100`). P2 must equal those lists "with the camera at (0, 0)", which can only hold at scroll 0. Step 3 requires "H2 green", so a literal implementer sees failures on two thirds of the grid and can't tell whether they are expected.
- **Evidence.** Lines 2558, 2682, 2691, 3192; 8.5 step 3 already limits its identity to scroll 0 (line 3074).
- **Fix.** Say that P2 compares only the scroll-0 rows, or that P1's reference lists are regenerated with `parallaxScroll` 0 while the zones follow the scroll.

### CG2-7 (minor): P9 orphans `METEOR.radiantTries` and drops the fireball timing lines

- **Section.** 6.10 "Removed in P9" (lines 2159-2164) and "Inside `planFlight`" (lines 2293-2299); P9 step 2 (line 2897); P10 (lines 2916, 2924).
- **Problem.**
  - `METEOR.radiantTries` (`config.ts:253`) has one reader, the fresh-radiant loop around `pickRadiant` (`sky.worker.ts:209-210`), which P9 removes. The key is then dead but missing from the removal list, which exists so dead keys don't mislead the next tuner.
  - I2 replaces `meteors.ts:147-152` with the aim. Those lines also give fireballs their slower speed and longer flight (`METEOR.fireballSpeedScale` and `METEOR.fireballDuration`, `:148-149`). Nothing in P9 says how a fireball keeps them until P10's `METEOR_KINDS.fireball.duration`. Read literally, P9's fireballs fly at their class speed for 0.55 to 1.4 s, at peak 1.
- **Evidence.** Lines 2159-2164, 2293-2297, 2916, 2924; `meteors.ts:148-149`; `sky.worker.ts:209`; `config.ts:253`.
- **Fix.** Add `METEOR.radiantTries` to P9's removal list. In I2, state the fireball path: `flight.speed × METEOR.fireballSpeedScale`, with the duration from `METEOR.fireballDuration` (P9), then from `METEOR_KINDS.fireball.duration` (P10).

### CG2-8 (minor): the rebase rule would drop veil lines added to `tick` or `draw`

- **Section.** 8.5 step 2 (line 3071); 8.6, first row (line 3084).
- **Problem.** The rule is "inside a veil-owned function theirs wins; outside, ours". `tick` is ours (P3 rewrites it), and `draw` changes in P8. Both are where the veil commit may add lines. Deferring a layout that arrives mid-ease needs a hook when the ease ends, and the scroll cancel's fade needs drawing. 8.6's first row only carries new `frameMode` reasons into `frameDemand`, and `draw` isn't listed at all. By the rule, a call they add to `tick` or `draw` would be dropped without notice.
- **Evidence.** Lines 3071, 3084; `COORDINATION.md:18-19` (the scroll handler drops or fades a flight; the layout handler and `quietBlend` defer a mid-ease layout); `sky.worker.ts:183-190` (`tick` calls `settleQuiet`) and `:270-283` (`draw` calls `drawMeteor`).
- **Fix.** Extend 8.6's first row: carry any call their commit adds to `tick` (applying a deferred layout, say) and any change to `draw` into the rewritten functions. Add a re-verify item that their deferred layout still applies after the rebase.

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r2-cg/` (not in the repository):

- `leanpause.mjs`: frames drawn after a pause clicked 0.2 to 2.5 s after a pointer sweep, with the plan's camera and demand code (CG2-1).
- `fallbackk.mjs`: wake-ups per drawn frame and the drawn cadence in timer-fallback mode for k from 1 to 7 (CG2-2).
- `snaphop.mjs`: the level-0 snap hop and AC-27's total (CG2-3).
