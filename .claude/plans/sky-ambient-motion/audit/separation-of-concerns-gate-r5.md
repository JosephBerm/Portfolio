# Separation of concerns: gate round 5

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 5. I check that round 4's fixes in this scope landed, challenge nothing the reviser rejected (it rejected nothing), and look for regressions.
- **Inputs.** `PLAN.md` as revised after round 4; `HANDOFF.md`; `research/00-shared-brief.md`; `COORDINATION.md`, all of it, with "Confirmed veil interface (2026-10-27)" as the contract; `research/01-planning-brief.md`; round 4's twelve SoC findings and the reviser's dispositions; the worktree code (master 246c0aa); the main checkout's uncommitted veil edits, read only.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker, main-thread DOM in `mountSky`, and React UI in the control;
  - the protocol as the only contract between threads;
  - the scheduler, kind specs, rendering and the veil kept apart;
  - config kept apart from logic;
  - the ownership split with the veil session (its exports only, never its internals);
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/`, configuration or the main checkout. Throwaway scripts live in the scratch folder. Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the four briefing files, then `PLAN.md` sections 1 to 8 in full and skimmed 9 to 13.
2. Read the round-4 SoC audit (`audit/separation-of-concerns.md`) and the reviser's design check (`reviser-r4/design/`). I also read the pre-round-4 plan (`reviser-r4/PLAN.before-r4.md`) to tell new behavior from old.
3. Checked each round-4 SoC disposition against the revised text (table below).
4. Looked for regressions in three ways:
   - traced every new gathered value (`driftGate`, `frameState`, the launch gate) from where it is filled to every place it is read, including the message path;
   - matched each module's imports, as its sketch and body need them, against 5.2;
   - walked the P8 to P12 file lists against the contract each kind needs.
5. Grounded current behavior in the worktree's `sky.worker.ts`, `scene.ts` and `config.ts`. Grepped the veil's working copy (read only) for line counts and seam names.
6. Ran scratch checks on Node 24.14, in the scratch folder `soc-gate-r5/`:
   - `h13-rig-probe.mjs`, with the plan's `registerHooks` hook. It imports the worktree's `sky.worker.ts` twice under different query strings with a fake `self`. Two distinct message listeners are captured, so 7.1's rig gives a fresh worker per case. `renderSky.ts` stays one shared instance across those imports.
   - `stale-gate.mjs`, a model of 6.1, 6.2 and 6.6 as written: `gather` only in `tick`, and `schedule` after every message. It reproduces SOC5-1.

## Round 4's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC-1 (major) | Yes, with a regression | `DriftGate`, `driftWanted`, `driftTarget` and `driftRate` are pure in `camera.ts`. `FrameState`, `frameDemand`, `driftCap` and `Ease` are pure in `pacing.ts`. 7.1 specifies H13's real-worker rig (it works: see the probe) and no longer claims the worker loads with canvas stubs. 5.2 adds a worker size guard. But "one gather per tick" makes the demand read a stale gate after messages (SOC5-1). The wiring left in the worker is reached only by H13 (SOC5-5), and the size guard has no owner (SOC5-6). |
| SOC-2 (major) | Yes, with residue | `meteorKind.ts` holds the meteor kind, `gaps.ts` holds `nextGap`, and the visit's memory is keyed by family. The registry reads only finished spec values, so there is no load-order hazard. Residue: the initial meteor memory has no owner, and P12's spec member isn't in P12's files (SOC5-4). Farewell meteors don't fit the contract (SOC5-3). `sinceReveal` stays in `PlanContext` as context any kind may read (the launch gate already carries it). That holds, so I don't re-raise it. |
| SOC-3 | Yes | `TransientSpec.lease`, the envelope's `clearSky`, and `drawTransient` choosing `CLEAR_SKY_KEEPS` (passed to `drawSatellite`; by flag to P12's meteor variants). Planning stays with each planner, as the skeptic noted. |
| SOC-4 | Yes | `renderSky.ts` owns one quiet index at module scope, and `SkyFrame` stays plain data. Under H13's rig the index is shared across cases (the probe), which is harmless: `update` rebuilds on any change of size or zones. |
| SOC-5 | Yes, with a regression | The probe grid comes from `startArea(field)`. But `radiants.ts` then needs a value from `meteors.ts`, which 5.2 forbids. P9 step 1 needs `startArea` before step 2 adds it (SOC5-2). |
| SOC-6 | Yes | `METEOR`'s doc says its guards serve every transient. `SkyField` aliases `MeteorField`. |
| SOC-7 | Yes | P8 retires `parallaxScroll` (6.9, P8 step 4, 8.1, CP-0). H5 is fed the live scroll while paused. A doc nit for P8: `CameraInput.scroll`'s doc and 6.1's law still name `parallaxScroll`. |
| SOC-8 | Yes | 6.8 says why one channel stays, and the dedupe comment is corrected. |
| SOC-9 | Yes | 5.2 requires a statement-level `import type` back edge, and both kind sketches use it. |
| SOC-10 | Yes | 4.4 names every `planFlight` edit we make after V. |
| SOC-11 | Partly | `bodies.ts` appears in 6.12 and P12 only (SOC5-7). |
| SOC-12 | Yes | `TransientOf` is gone; only the audit log names it. |

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC5-1 | major | From P6, input other than scrolling no longer wakes a sleeping sky, because `schedule` reads the last tick's drift gate |
| SOC5-2 | minor | `startArea` makes `radiants.ts` import a value from `meteors.ts`: 5.2 is wrong, and P9 step 1 can't compile as ordered |
| SOC5-3 | minor | Farewell meteors can't launch through the kind-agnostic contract as P12 plans them |
| SOC5-4 | minor | `transients.ts` still changes with the meteor family (the memory's initial value, P12's spec member) |
| SOC5-5 | minor | The worker's demand wiring is tested only by H13, which starts in P5 |
| SOC5-6 | minor | The worker size guard will trip, and no phase owns the move |
| SOC5-7 | minor | SOC-11's fix reached 6.12 and P12 but not sections 4 and 5 |

### SOC5-1 (major): from P6, input other than scrolling no longer wakes a sleeping sky

**Section.** 6.1 "The worker side" (`gather`, the `tick` bullet); 6.2 "The worker's demand" (`demandNow`, the `driftGate.on` row) and "The worker's mechanism" (`schedule`, `tick`); 6.6 (the `activity` case); 6.13 (the `pointer` case); 4.3 F6 and PR1; AC-33; 7.1 H13 case 1; P6.

**Problem.**

- **Where the gate is filled.** `gather` fills `driftGate` "once per tick" (6.1), and only `tick` calls it (6.2, the tick's step 1).
- **Where it is read.** `demandNow` reads it:
  - `driftWanted(driftGate)` for the camera line;
  - from P6, `driftGate.on` for the twinkle line. 6.2's row puts it in place of the fresh `motion === 'full' && !isIdle(presence, now)` that P4 uses.
- **When it is read.** `demandNow` runs inside `schedule`, which also runs after every message, before any tick (`sky.worker.ts:486`; 6.13: "`schedule(now)` runs after every message, as today").
- **What goes wrong.** A worker that fell asleep at the idle timeout last gathered `on = false`.
  - When the visitor comes back with the pointer or the keyboard, the `activity` case runs `noteInput` and then `schedule` (6.6). `demandNow` still sees `on = false`, finds no demand, and the worker sleeps again.
  - Nothing else wakes it. `activity` sets no `needsDraw` (by design, like `pointer`). The sleeping branch arms a timer only for `needsDraw` or a due transient, and transients launch only over the hero (`sky.worker.ts:161-164`, `:144-145`).

What the visitor gets:

- **Reading and the end bookend** (drift 0.35 and 0.8, no transients). The drift and the twinkle stay frozen until the next scroll, tab switch or motion change. That contradicts 6.6 ("The drift resumes even in the reading scene, where no twinkle wakes the worker, because its frames follow `driftWanted`"), AC-33 ("any input eases them back over 4 s, in every scene, including reading (F6)") and PR1.
- **The hero.** They wait for the transient timer, at least `afterReturn` (3 s) after the input. So P4's own check, "a key press brings it back over 4 s", regresses at P6.
- **P7.** `pointer` wakes the worker only through `leanPending`, so below the hero (lean level 0) pointer moves don't wake it either.
- **H13.** Case 1 fails as written, so P6 step 3 can't go green without changing the design.

The defect is new in round 4. Before it, `driftWanted(now, scene)` and `twinkleDemand(now, scene)` read `isAway(presence, now)` on every call (`reviser-r4/PLAN.before-r4.md:821-823`, `:1132-1135`). "One gather per tick" (SOC-1 with DRY-7) made the demand read the last tick's value.

**Evidence.**

- PLAN.md lines:
  - 855: "fed from one gather per tick, so every gate is computed once";
  - 873 to 882: `gather`;
  - 906: `tick` calls `gather`;
  - 1211 to 1228: `demandNow`, "from this tick's gathered gates";
  - 1239: the `driftGate.on` row;
  - 1266 to 1273: `schedule` computes `demandNow`, and only `tick` gathers;
  - 1665: `activity`, then `noteInput`, then `schedule`;
  - 1671: the intent;
  - 2805: `pointer` sets no `needsDraw`;
  - 2915: H13 case 1;
  - 3101: P4's key-press check.
- Worktree `sky.worker.ts:486`, `:161-164` and `:144-145`.
- Scratch model `soc-gate-r5/stale-gate.mjs`, in the reading scene: the worker sleeps at 90.01 s with the gathered `on = false`. An `activity` ping at 95.01 s ends in "schedule -> sleep", while a fresh gather would want drift.

**Fix.**

- Read fresh gates wherever the demand is decided: `demandNow` (or `schedule`) calls `gather(now, scene)` before it reads the gate, and `tick` keeps its own call before `updateCamera`. `gather` is a few comparisons and two smoothsteps, so 6.1's "once per tick" becomes "fresh for every demand".
- Or compute the ambient flag in `demandNow` straight from `motion` and `presence`. That also takes the twinkle's flag out of the drift's gate, which then holds only what the drift's rate needs.
- Extend H13 case 1 to the hero and the end bookend: frames restart within one frame of the ping, not at the next transient timer.
- Repeat P4's "a key press brings it back" browser check in P6.

### SOC5-2 (minor): `startArea` makes `radiants.ts` import a value from `meteors.ts`

**Section.** 5.2 "No runtime import cycles"; 6.10 (the `radiants.ts` sketch and `pickVisitSky` step 3); 6.11 (the `satellites.ts` sketch); P9 steps 1 and 2.

**Problem.**

- **5.2 is now wrong.** SOC-5's fix builds the usability probes from `startArea(field)`, which I2 exports from `meteors.ts`. `pickVisitSky(random, field)` lives in `radiants.ts`, so `radiants.ts` imports a value from `meteors.ts`. Yet 5.2 still says it "imports only types from `meteors.ts`", and the sketch's import line is `import type { ... } from './meteors'`.
- **P9 step 1 can't compile as ordered.**
  - Step 1 adds `radiants.ts` with "the `Course` and `Steer` types in `meteors.ts` (types only, so `radiants.ts` compiles)".
  - Step 1 also needs H8's sky parts green, and their "every visit's shower passes the usability test" needs `startArea`.
  - `startArea` only arrives in step 2, and every step is a green commit (7.0). So step 1 fails type-check.
- **The satellite sketch's imports are short.** It imports `SATELLITE`, `nextGap`, `segmentClear` and types only. Its body uses `skyWindow` from `radiants.ts` and `METEOR.edgeMargin`, `top` and `maxEndY`, yet 5.2's cycle argument names only leaf modules as a kind's value sources.
- **No cycle results.** `meteors.ts` imports neither `radiants.ts` nor `transients.ts`, and `radiants.ts` never imports `transients.ts`.

**Evidence.** PLAN.md lines 381, 383, 2467, 2508, 2532, 2595, 2685 to 2688, 2737, 2740, 3255 and 3256.

**Fix.**

- Move `startArea` (a pure function that names today's spawn area) into P9 step 1, and let `planFlight` adopt it in step 2.
- Update 5.2: "`radiants.ts` imports `startArea` and types from `meteors.ts`; `satellites.ts` takes `skyWindow` from `radiants.ts`. Neither imports `transients.ts`, so the registry's load order still holds." Fix both import sketches.
- Or have `meteorKind.ts` pass the area into `pickVisitSky`, which keeps `radiants.ts` type-only on `meteors.ts`.

### SOC5-3 (minor): farewell meteors can't launch through the kind-agnostic contract as P12 plans them

**Section.** 6.9 (`LaunchGate`, launch step 2.2, `TransientSpec`, `PlanContext`); 4.3 T6; 6.12 (the farewell row and the `METEOR_KINDS` paragraph); P12 files; D4.

**Problem.**

- **The shared gate is hero-only.** `LaunchGate.allowed` includes "the hero scene (SceneLevels.launches)", which is `scrolled <= 0.4` viewport heights (`scene.ts:36`). The launch step holds back every kind with `!gate.allowed` before any spec runs, and T6 says "Launches only in the hero".
- **The spec is never reached.** The farewell row is "the meteor kind with the end scene's launch gate", and P12 puts it in `meteorKind.ts` alone. In the end scene the spec never runs.
- **The spec couldn't switch even if it ran.**
  - Its interface carries no scene and no rest time: `nextAfter(body, random, sinceReveal, narrow)` and `PlanContext`.
  - So the meteor kind can't switch to the farewell rules: 8 + Exp(14) s gaps, at most 2 a visit, after 3 s of rest.
  - The gate's `settled` means 1.2 s without scrolling, not 3 s.
- **The plan's own rule points elsewhere.** 6.12 says "only a kind with its own clock gets a registry entry", and the farewell meteors have their own clock.
- **It matters soon.** D4 lists the farewell meteors among the first could kinds to ship after v1.

**Evidence.**

- PLAN.md lines:
  - 171 (D4);
  - 309 (T6);
  - 2040 to 2053 (`PlanContext`);
  - 2058 to 2062 (the spec signatures);
  - 2135 and 2137 (`allowed`, `settled`);
  - 2212 and 2213 (held back);
  - 2758 (the farewell row);
  - 2764 (the registry rule);
  - 3329 (P12's files).
- Worktree `scene.ts:36` (`meteors: scrolled <= SCENE.heroMeteorMaxScroll`) and `config.ts:216` (`meteorScrollQuietMs: 1200`).

**Fix.**

- In 6.12 and P12, state what the farewell meteors change in the shared contract. Either:
  - a `farewell` registry entry with its own clock and a per-spec scene test: the launch gate reports the hero and end levels and the seconds since the last scroll, and the hero test moves from `allowed` into each spec;
  - or a scene fact in `PlanContext` and `nextAfter` that the meteor kind reads.
- Amend T6.
- List `transients.ts` and the worker's launch gate in the farewell's P12 files.
- Tell the veil session: shooting stars would then launch over Contact and the footer.

### SOC5-4 (minor): `transients.ts` still changes with the meteor family

**Section.** 6.9 (`createTransientSchedule`, `VisitMemory`, `MeteorMemory`, `TransientSpec`); 6.12 (`clearSky(body)`); P9, P10 and P12 files.

**Problem.**

- **No module owns the initial meteor memory.**
  - `createTransientSchedule()` must build `visit: VisitMemory`, but `TransientSpec` has `forget` and no initializer.
  - Built in `transients.ts`, the literal changes with `MeteorMemory`'s shape: `{ radiant }` in P8, `{ sky }` in P9, plus the last fireball in P10. Those are meteor-family reasons, the kind SOC-2 moved out.
  - The reviser's own design check builds `visit: { meteor: { radiant: null } }` outside the module (`reviser-r4/design/run.mts`).
- **P12's spec member is missing from P12's files.**
  - P12's clear-sky variants add a `clearSky(body)` member to `TransientSpec` and fold it into the envelope at launch. Both changes are in `transients.ts`, where the envelope's `clearSky` is `!spec.lease` until then.
  - P12's files for the point flash, bursts and earthgrazers list only `config.ts`, `meteorKind.ts`, `renderSky.ts` and `radiants.ts`.

**Evidence.** PLAN.md lines 2035 to 2037, 2056 to 2075, 2097 to 2099, 2160, 2163, 2222, 2764, 3248, 3281 and 3329.

**Fix.**

- `meteorKind.ts` exports `createMeteorMemory()`, and `createTransientSchedule` builds `visit` from it. Then `transients.ts` changes only when a family is added.
- For `clearSky(body)`, either:
  - list `transients.ts` in P12's clear-sky files;
  - or declare the member on `TransientSpec` from P8 (satellites `() => true`, meteors `() => false`). The envelope's flag then has one source, and P12 leaves the contract alone.
- Optional: name `LaunchGate.cometShowing` for what the scheduler needs (a never-lease light near the copy is showing) rather than for the comet.

### SOC5-5 (minor): the worker's demand wiring is tested only by H13, which starts in P5

**Section.** 6.2 "Policy and mechanism" and "The worker's demand"; 7.1 (H4, H13, the rig); P3's verification; P8's verification (H7).

**Problem.**

- **H4 stops at the pure function.** 6.2 says H4 tests "the shipped mapping, not a copy", and that `frameDemand` "reproduces today's frameMode exactly (H4)".
  - H4 covers `frameDemand` over hand-built `FrameState`s.
  - The shipped `demandNow` fills that state from worker variables (the camera, twinkle, fade and cap lines), and it stays in the worker. SOC5-1 is a defect in exactly that wiring.
- **Only H13 reaches the wiring, and it starts in P5.** H13's real-worker rig runs in P5 to P7.
  - P3 introduces `demandNow` and claims no change at rest, yet runs only H4 and browser traces.
  - P8's H7 drives the real scheduler with launch gates the harness builds itself, so the worker's own launch gate (T6's conditions) meets only browser checks.

**Evidence.**

- PLAN.md lines 940, 1064, 1212 to 1228, 2884, 2888 to 2892, 2906, 2909, 2915, and 3067 to 3072.
- Probe `soc-gate-r5/h13-rig-probe.mjs`: the rig loads a fresh worker per case on Node 24.14, so the same rig can load P2's worker and P3's side by side (7.1's baseline tree).

**Fix.**

- Build the rig in P3 and run it there:
  - replay the same message scripts on P2's worker and P3's, with a 60 Hz fake animation-frame clock;
  - require identical drawn-frame times wherever P3 promises no change: at rest, during a flight and while scrolling (the glide's divided tail excepted);
  - add an animation frame that never fires, to check the watchdog's strikes and the 60 Hz fallback.
- Optional, in P8: run the veil commit's worker and P8's on the same scripts with a seeded `Math.random`, for launch equality on shipped code.

### SOC5-6 (minor): the worker size guard will trip, and no phase owns the move

**Section.** 5.2 (the worker guard); deviation 4; P8; 8.1.

**Problem.**

- **The guard has no owner.** 5.2 says that if `sky.worker.ts` "grows past about 600 lines", the frame mechanism moves into a worker file behind `framePending()` after V. No phase has that step, its files or its AGENTS.md line.
- **It will trip.**
  - The veil's working copy is already 538 lines.
  - This plan's worker sketches add about 57 non-blank lines (6.1's worker block and `demandNow`).
  - Still to come: the mechanism (`requestFrame`, `onStalled`, the probe, the divisor in `tick`), presence, the motion ease, the thin fade, the twinkle clock and the lean.
  - Less about 30 removed lines (`frameMode`, `frameInterval`, `isIdle`, `idleTwinkle`), that comes to roughly 650 lines at V.
- **Deviation 4's reason lapses in P8.** P8 edits the scroll handler anyway, to retire `parallaxScroll`.

**Evidence.**

- PLAN.md lines 56, 386, 858 to 897, 1208 to 1228, 2344, 3223 and 3376.
- `wc -l`: the worktree's `sky.worker.ts` is 487 lines; the main checkout's (the veil's, uncommitted) is 538.

**Fix.**

- Make the move a P8 step:
  - a worker file (for example `frameClock.ts`, importing only `@/lib/sky/*`) owns `rafId`, `timerId`, the watchdog, the probe, the refresh estimate and the divisor;
  - the scroll handler reads `framePending()`, in the same edit that drops `parallaxScroll`;
  - add the file to P8's files, 5.1, 8.6 and AGENTS.md's worker list.
- Or drop the guard and say the orchestrator stays one file.

### SOC5-7 (minor): SOC-11's fix reached 6.12 and P12 but not sections 4 and 5

**Section.** 4.1, 4.2, 5.1, 5.2.

**Problem.**

- `bodies.ts` and the `SkyBody` entity appear only in 6.12's comet row and in P12's files.
- Section 4 says every entity has one owning module. Yet:
  - 4.2 has no `SkyBody` row;
  - neither 4.1 nor 5.1 names `bodies.ts`;
  - 5.2's list of model files, which sets their import rules, leaves it out. It would import `camera.ts` (`DRIFT_REACH`), `quietIndex.ts` (`zoneReaches`), `scene.ts` (`scrollKept`) and `config.ts`.

**Evidence.**

- A grep for `bodies.ts` or `SkyBody` finds PLAN.md lines 2759 and 3329 only, plus the audit log (3934).
- The 4.2 table is at lines 230 to 258, the 5.1 table at 347 to 373, 5.2's file list at line 379, and section 4's promise at line 182.

**Fix.**

- Add a conditional `SkyBody` row to 4.2, for when D4 picks the comet:
  - owner: `bodies.ts`;
  - invariants: the camera law, the fades, the box clear of every zone's reach, and `scrollKept`;
  - read by: the worker and `renderSky.ts`.
- Add a `bodies.ts` row to 5.1 (P12), and add `bodies.ts` to 5.2's list.

## Summary

**Verdict: revise**, for one major finding.

Round 4's fixes in this scope landed:

- the drift and frame policy is pure and reachable from harnesses;
- the meteor kind and the gap law have their own modules;
- the registry has no load-order hazard;
- `parallaxScroll` retires in P8;
- the pause store's one channel is justified;
- `TransientOf` is gone.

But the "one gather per tick" that came with SOC-1 introduced a regression (SOC5-1). From P6, pointer, key and focus input no longer wakes a sleeping sky, because `schedule` reads the last tick's drift gate. The fix is one call (gather where the demand is decided) and wider H13 coverage.

Six cheap minors tidy the edges:

- the `startArea` import and P9's step order (SOC5-2);
- the farewell meteors' scene gate (SOC5-3);
- the meteor memory's initial value and P12's file list (SOC5-4);
- H13's rig from P3 (SOC5-5);
- an owner for the worker size guard (SOC5-6);
- the missing `SkyBody` rows (SOC5-7).

**Noted, not raised** (not cheap and clear enough to report):

- `DriftGate` carries the twinkle's ambient flag and level. SOC5-1's second fix would separate them.
- `segmentClear` (transient planning) shares `quietIndex.ts` with the star buckets. A small zones module would split them, at the cost of one more file.
- `CLEAR_SKY_KEEPS` is a fixed invariant in `config.ts`, whose header calls its contents "Tunables". It could sit beside `drawTransient`, its one reader.
- `leanTarget` and `leanPending` stay worker functions (P7 is optional). H13 case 5 covers them.
