# Check r5: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 5. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens: code grounding and feasibility. Every existing file, function, type, message and constant it names must exist with that shape in the worktree (`src/` equals master 246c0aa), be an export of COORDINATION.md's "Confirmed veil interface (2026-10-27)" marked as arriving with the veil commit, or be marked new. `PLAN.md` must not import what the veil keeps private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`). Its integration points must work with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol, before and after the veil commit. The AGENTS.md sky import rules must hold for every new or changed file, and no Cache Components API may appear. This round also confirms that round 4's fixes in this lens landed, and looks for regressions from round 4's revisions and the audits.
- **Inputs.** `PLAN.md` (3,935 lines, read in full, Check log and Audit log included); `HANDOFF.md`; `COORDINATION.md` (all of it); `research/00-shared-brief.md` and `research/01-planning-brief.md`; my round-4 report; the round-4 reviser's scratch (`reviser-r4/`, including `PLAN.before-r4.md`); the worktree code; the main checkout's uncommitted veil edits (`git diff`, read only); TypeScript 6.0.3 and Node 24.14 from the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration in either checkout. Throwaway scripts live in the session scratchpad (`check-r5-cg/`). Never POST to `/api/schedule/book`.

## Method

1. Read the four context files, then `PLAN.md` end to end, listing every code name, citation, sketch and phase step.
2. Re-ran the identifier scan (`check-r5-cg/idents.py`) and a new citation scan (`check-r5-cg/cites.py`) over every `file:line` in the plan, and spot-checked the short `:NN` forms against the worktree.
3. Built a type-check project (`check-r5-cg/tc/`) from the main checkout's uncommitted `src/lib/sky`, `renderSky.ts` and `skyAssets.ts` (the "after V" baseline), spliced in every config block from P1 to P12, `sameRects` moved to `scene.ts`, the `launches`, `drift` and `lean` scene levels, `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts` (its V form), `gaps.ts`, P8's kind-agnostic `transients.ts` and `meteorKind.ts` (bodies written from 6.9's prose, the `planLaunch` port in its observed order), `drawTransient`, and P1/P2's `StarField`, `placePoint`, quiet index and `drawLayer`. A second copy (`tc2/`) adds P11's satellite kind. Ran TypeScript 6.0.3 with the repository's options on both, and loaded every new module under Node 24.14 type stripping with the plan's 7.1 resolve hook.
4. Traced the frame scheduler as 6.1 and 6.2 now specify it (`gather` once per tick, `demandNow` from `schedule`) through every message the worker handles, and replayed the idle-then-`activity` case with the real pure functions (`check-r5-cg/h-stale-gate.ts`).

## Verdict: revise

One major finding, three minor ones, none blocking. The major one is a regression from round 4's SOC-1/DRY-7 revision: the drift and twinkle gates are now gathered only inside `tick`, but `schedule`, which runs after every message, decides frames from them, so a pointer, key or focus ping after an idle sleep no longer wakes the sky.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG5-1 | major | 6.1 worker side, 6.2 `demandNow`/`schedule`/`tick`, 6.6, 6.13 | `activity` after an idle sleep leaves the worker asleep (reading) or wakes it 3 s late with a one-frame twinkle jump (hero), from P6 |
| CG5-2 | minor | 5.2, 6.10 `radiants.ts`, P9 steps 1 and 2 | `radiants.ts` needs the value `startArea` from `meteors.ts`, yet 5.2 and its import say "types only", and P9 step 1 can't be green before step 2 adds it |
| CG5-3 | minor | P8 step 4 and files, 6.9 "`parallaxScroll` retires" | the retirement removes two writers of `parallaxScroll` but not `init`'s `scrollY = parallaxScroll = message.scrollY` (`sky.worker.ts:420`) |
| CG5-4 | minor | 4.1, 5.1, 5.2, 6.2's phase table | module-map slips: `bodies.ts` is missing; the `transients.ts` row misses P9 and P12; P3's `demandNow` names two P6 symbols the table doesn't list |

## Round-4 fixes in this lens: verified

| Round-4 ID | Landed? | Where, and how checked |
|---|---|---|
| CG4-1 | yes | 6.9 "Drawing": `const { kind, body } = transient` and `const unhandled: never = kind`. Compiled against the veil's `renderSky.ts` with one kind (`tc/`) and two (`tc2/`): no error. The comment is corrected. |
| CG4-2 | yes | P8 step 3 is one commit: the worker swap, `drawTransient` with `transientFade`, the renames, the removed `METEOR` keys and the README line. |
| CG4-3 | yes | PF's files add `contrastLevels()`; "What PF lacks" says the PF planner accepts `ink` and ignores it; nothing exports `segmentTouches` (I6 declined, `segmentClear` on every route). |
| CG4-4 | yes | "Observed" labels on `pendingLayout`, the four-argument `veiledFrom`, `planLaunch`'s order, where `scrollKept` runs and the `color.ts` helpers; 8.5 step 2 rechecks them; `planMeteorTransient`'s doc and H7 draw fresh radiants up front; 6.9 and 8.6 cover a landed cancel in the `scroll` handler. |
| CG4-5 | yes | 8.6 is the one list, with `SceneLevels`, `SkyFrame`, the import lines and dropping `easedQuietFactor` from `renderSky.ts`'s import at the rebase (confirmed: after the rebase only the veil's `drawMeteor` used it, and it now uses `transientQuietFactor`). |
| CG4-6 | yes | T3, AC-24, 6.11, P11 and H7 count "from the frame the veil applies a layout"; no "layout's first frame" wording remains. |
| CG4-7 | yes | 6.8's control uses `aria-label`; no `sr-only` text anywhere in the plan. |
| CG4-8 | yes, with a residue | 5.1's `renderSky.ts` and `catalog.ts` rows are complete, the rename is under `config.ts:156`, and P11's rollback matches 7.2's kill switch. The `transients.ts` row still misses P9 and P12 (CG5-4). |

## Checked and consistent (no finding)

- **Citations.** Every explicit `file:line` (81 distinct, by script) and the short `:NN` forms I spot-checked match the worktree: for example `sky.worker.ts:61-66`, `:87-114`, `:193-224`, `:213-218`, `:241-243`, `:369`, `:420`, `:463-470`, `renderSky.ts:100`, `:107`, `:120`, `:127`, `:222`, `config.ts:156`, `:246-255`, `:317`, `meteors.ts:130-131`, `:136-139`, `:140-145`, `mountSky.ts:37-40`, `:243-247`, `:265`, `Navbar.tsx:14-18`, `:31`, `:52-53`, `:79`, `:88`, `:97`, `:117`, `:127`, `styles.ts:7`, `globals.css:55`, `:80-83`, `:203`, `eslint.config.mjs:13`.
- **Names.** Every backticked identifier is in the worktree, in COORDINATION.md, defined or marked new in the plan, or labeled observed. Stale names (`TransientOf`, `Planned`, `cameraPoint`, `clearSkyFactor`, `settleMotion`, `isAway`, `SkyPauseToggle`, `PACING.stepPx`) appear only in the logs.
- **Private helpers and Cache Components.** The plan imports none of `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches`, and uses no `'use cache'`, `cacheLife`, `cacheTag`, `cacheComponents` or `instant`.
- **Sketches against the veil's code** [computed, `check-r5-cg/tc/`, `tc2/`, TypeScript 6.0.3, `strict`, `noUncheckedIndexedAccess`, `isolatedModules`]. All of these compile with no error against the main checkout's uncommitted veil files: every config block (`DEPTH`, `CAMERA`, `DRIFT` with `DriftConfig`, `PACING`, `STAR_PHASES`, `FRAME.motionEase`, `SCENE`'s levels, `TRANSIENTS` with `longVisit`, `GapLaw`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `SATELLITE`, `CLEAR_SKY_KEEPS`, `LEAN`, `METEOR_KINDS`); `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts` with `ZONE_REACH = QUIET_REACH - QUIET.padding`, `gaps.ts`; P8's kind-agnostic `transients.ts` with `launchKind<K>`, `movingOf<K>`, the one `as Transient` cast, `forgetVisitSky` over optional `forget`, and `meteorKind.ts` calling `planMeteor(random, field, candidate, now, { flights, ink, nearCopy })`; `drawTransient`; P1/P2's stamped `StarField`, `placePoint`, the module-scope quiet index and `drawLayer` with `SkyFrame.offset` and `snap`; and P11's two-kind registry with `SATELLITE_SPEC` and a `drawSatellite` through `transientQuietFactor` with `CLEAR_SKY_KEEPS`.
- **Load order.** Under Node 24.14 type stripping with the plan's `registerHooks` hook, `transients.ts`, `meteorKind.ts`, `satellites.ts`, `quietIndex.ts`, `camera.ts`, `pacing.ts`, `presence.ts` and `gaps.ts` each load first without a temporal-dead-zone error: the kind modules import `./transients` with statement-level `import type`, as 5.2 requires.
- **H7's oracle in P8.** The port's draw order (fresh radiants up front, long flights over every radiant, then short) matches the observed `planLaunch` (main checkout `sky.worker.ts:241-256`); with `crossingCooldown` 0 and one meteor at a time every plan passes `nearCopy: true`, which equals their default; retry, hold and gap draws come in their order; `transientFade` with no pause equals their `scrollKept(launchScrollY, scrollY)`.
- **Seams after V.** Their `scroll` handler still reads `rafId` (a falsy test), `timerId`, `noteInput`, `parallaxScroll`; their `layout` case reads `sameRects` and calls `retryMeteors`; their deferred layout applies inside `settleQuiet`, which P3's `tick` calls before the frame decision, and P3's quiet-ease `fading` line keeps the worker ticking until it does.
- **Import boundaries (AGENTS.md).** Every new `src/lib/sky` file imports only siblings by relative path (CG5-2 corrects one statement of which); the worker files import `@/lib/sky/*` by file and each other; `mountSky.ts` keeps to types and `@/lib/sky/color`; `skyPause.ts` imports only `@/lib/utils`; `SkyPauseButton.tsx` uses the `@/lib` and `@/components/icons` barrels from a component rendered only on `/`.

## Findings

### CG5-1 (major): the gates `demandNow` reads are gathered only in `tick`, so `activity` after an idle sleep no longer wakes the sky

- **Section.** 6.1 "The worker side" (`driftGate`, `gather`, lines 870-882, and "`tick`", line 906); 6.2 `demandNow` (lines 1211-1228), `schedule` and `tick` (lines 1266-1273); 6.6 (line 1665: "The worker handles `activity` with `noteInput(now)`, followed by the usual `schedule(now)`", and line 1671); 6.13 (line 2805: `pointer` "doesn't set `needsDraw`").
- **Problem.** Round 4 (SOC-1, DRY-7) moved the drift and twinkle gates into one `gather(now, scene)` per tick: `driftGate.on = motion === 'full' && !isIdle(presence, now)`, and `demandNow` reads `driftWanted(driftGate)` and `driftGate.on` for the camera and twinkle lines. But `demandNow` runs from `schedule`, and `schedule(now)` runs at the end of every message, outside `tick`. A message that records input without setting `needsDraw` is then judged on the gate from the last tick, which for a worker asleep after the idle window says `on: false`:
  - **Reading scene** (P6 on, D2 default 0.35): no twinkle, no transients, so `demandNow` returns no frames and no timer is armed. Pointer, key and focus pings (`activity`, at most one a second) never wake the drift; only a scroll does (its handler sets `needsDraw`). This breaks F6 ("a sleeping worker never misses its own wake-up"), PR1, 6.6's "The drift resumes even in the reading scene", AC-33 ("any input eases them back over 4 s, in every scene, including reading") and H13 case 1, which P6 must pass to merge.
  - **Hero:** `noteInput` holds the next launch 3 s (`holdMeteors`, then `holdTransients`), and the sleeping branch arms that timer, so the worker wakes 3 s after the first ping. Its first `gather` then finds `presenceLevel` already at 0.84, so the twinkle steps from 0 to 0.84 in one frame (a near star one standard deviation into its twinkle brightens 18%) and the drift starts at 0.84 of its speed: the one-frame onset E3 and deviation 1 rule out.
  - Before round 4 the plan computed these gates at each call (`driftWanted(now, scene)` and `twinkleDemand(now, scene)` read `isAway(presence, now)`; `reviser-r4/PLAN.before-r4.md`, its 6.2), so this is a regression. P4 and P5 are unaffected, because until P6 the twinkle line computes `motion === 'full' && !isIdle(presence, now)` inline (6.2's table).
- **Evidence.**
  - [computed, `check-r5-cg/h-stale-gate.ts`, run with the plan's hook on the real `camera.ts`, `pacing.ts`, `presence.ts` and `scene.ts`] Reading scene, last tick 95 s after the last input, then `notePresence` at 100 s: `schedule after activity (stale gate, as written): { fps: 0, vsync: false, cap: Infinity }`; with the gate gathered at the ping: `{ fps: 20, vsync: true, cap: Infinity }`.
  - [computed] `smoothstep(0, 4000, 3000)` = 0.844; at `twinkleSigma` 0.22 a 1-sigma star's factor goes from 1.000 to 1.183 in one frame.
  - `PLAN.md` line 1211: "The strictest demand of every part of the sky right now, from this tick's gathered gates (`gather`, 6.1)"; line 1268: `schedule` "computes `demandNow`"; line 906: `gather` runs in `tick` only.
- **Fix.** Make every frame decision use this moment's gates: `schedule` (or `demandNow` itself) calls `gather(now, scene)` before deciding, and `tick` keeps its own call for `updateCamera` and the twinkle (a gather is six assignments). Say it in 6.1 and 6.2 ("one gather per decision", not "per tick"). Alternatively, the `activity` and `pointer` cases set `needsDraw` when `noteInput` reports a return from idle, so a 0 ms timer runs a tick, but that leaves the message's own decision stale. Keep H13 case 1 as written, and add its hero twin: after 95 s idle, one `activity` ping in the hero restarts the twinkle timer at once, with the level easing from 0.

### CG5-2 (minor): `radiants.ts` imports a value from `meteors.ts`, and P9 step 1 needs it before step 2 adds it

- **Section.** 5.2 (line 381: "`radiants.ts` imports only types from `meteors.ts` (`Point`, `MeteorField`, `Course`, `Steer`)"); 6.10's `radiants.ts` sketch (line 2467: `import type { Course, MeteorField, Point, Steer } from './meteors'`); `pickVisitSky`'s usability test (line 2532); P9 step 1 (line 3255: "the `Course` and `Steer` types in `meteors.ts` (types only, so `radiants.ts` compiles) ... with H8's sky parts green") and step 2 (line 3256: "`startArea`").
- **Problem.** Round 4's SOC-5 fix made the usability test probe `startArea(field)`, a function I2 exports from `meteors.ts`. `pickVisitSky` lives in `radiants.ts`, so that module needs a runtime import from `meteors.ts`, contrary to 5.2 and its import line. No cycle follows (`meteors.ts` never imports `radiants.ts`), but P9 step 1, "each green" (7.0), builds `radiants.ts` and runs H8's sky parts ("every visit's shower passes the usability test") while `startArea` arrives only in step 2, so step 1 fails type-check.
- **Evidence.** Lines cited above; `pickVisitSky(random: Random, field: MeteorField): VisitSky` (line 2508) takes no area, so the test must call `startArea` itself.
- **Fix.** Add `startArea` to P9 step 1 (an exported function of `METEOR.spawnX`, `spawnY` and `top` that `planFlight` adopts in step 2), drop "types only" there, import `startArea` in the `radiants.ts` sketch, and change 5.2 to "imports `startArea` and types from `meteors.ts`".

### CG5-3 (minor): retiring `parallaxScroll` misses the `init` writer

- **Section.** P8 files (line 3223: "`updateCamera` reads `scrollY`; the `scroll` handler's write and the `motion` handler's resume line go"), P8 step 4, and 6.9 (line 2344).
- **Problem.** A third writer remains: `init` sets `scrollY = parallaxScroll = message.scrollY`, which 6.1 keeps next to `camera = createCamera(message.scrollY)` (line 900). Removing the `let` leaves TS2304 there, so step 4 isn't green as listed.
- **Evidence.** `sky.worker.ts:420`.
- **Fix.** Add "`init`'s chained assignment becomes `scrollY = message.scrollY`" to P8 step 4 and 6.9.

### CG5-4 (minor): module-map slips

- **Section.** 4.1's diagram, 5.1, 5.2 (line 379), 6.2's later-phase table (lines 1233-1240).
- **Problem.**
  1. `src/lib/sky/bodies.ts` (6.12, P12, added by SOC-11) appears in neither 5.1's file table, 5.2's list of new model files nor 4.1's diagram.
  2. 5.1's `transients.ts` row lists P8, P10 and P11, but P9's files change `revealTransients` (line 3250) and P12 adds the spec's `clearSky(body)` and `LaunchGate.cometShowing` (6.12, P12 files).
  3. P3's `demandNow` (lines 1222-1223) calls `driftTarget(driftGate)` and `driftCap(narrowScreen, ...)`, and `driftTarget`, `driftGate` and `narrowScreen` arrive in P6. The table lists `driftWanted(driftGate)` as `false` before P6 but not these, so P3 step 2 as sketched doesn't compile (TS2304, TS2305) until the implementer writes `cameraSpeed(camera, 0)` and `Infinity`.
- **Evidence.** 6.12 line 2759 and P12 line 3329 (`bodies.ts`); P9 files line 3250; 6.1 notes line 847 and P6 files line 3153 (`driftTarget`, `narrowScreen` in P6).
- **Fix.** Add `bodies.ts` (P12, new, model, ours) to 5.1, 5.2 and 4.1; add P9 and P12 to the `transients.ts` row; add two table rows: "`driftTarget(driftGate)` in the speed line: `0` before P6" and "the cap line: `Infinity` before P6".

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r5-cg/` (not in the repository):

- `tc/` and `tc2/`: the type-check projects (one kind, then two), both clean under TypeScript 6.0.3.
- `register-hooks.mjs` (the plan's 7.1 hook, verbatim) and `load-*.mjs`: the Node load-order checks.
- `h-stale-gate.ts`: CG5-1's replay.
- `idents.py`, `cites.py`, `blocks/`: the name and citation scans, and the plan's code blocks.

## Summary

Round 4's eight code-grounding fixes all landed, and the reconciled design holds up in this lens: every confirmed veil export it uses compiles against their working tree, the kind-agnostic transient core compiles with one kind and with two and loads in any order, the P8 port can still reproduce the veil's launches, and no private helper or Cache Components API is used.

One major regression blocks a clean gate. Round 4 moved the drift and twinkle gates into a once-per-tick `gather`, but frame decisions also run from `schedule` after every message. So from P6 a pointer, key or focus ping after an idle sleep leaves the reading scene asleep, and in the hero wakes the sky only 3 s later, with the twinkle and drift jumping in. Gathering at each decision fixes it.

The three minor findings are a step-order and import statement around `startArea`, a missed `parallaxScroll` writer, and module-map slips.
