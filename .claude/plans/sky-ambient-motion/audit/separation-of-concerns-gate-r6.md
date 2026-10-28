# Separation of concerns: gate round 6

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 6. I check that round 5's fixes in this scope landed, challenge a skipped or rejected part only with new evidence, and look for regressions.
- **Inputs.**
  - `PLAN.md` as revised after round 5 (3,978 lines, byte-identical to the round-6 snapshots in the scratch folder).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`.
  - `COORDINATION.md`, all of it, with "Confirmed veil interface (2026-10-27)" as the contract.
  - Round 5's seven SoC findings and the reviser's dispositions, and my round-5 report.
  - The worktree code (master 246c0aa), and the main checkout's uncommitted veil edits, read only.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker, main-thread DOM in `mountSky`, and React UI in the control;
  - the protocol as the only contract between threads;
  - the scheduler, kind specs, rendering and the veil kept apart;
  - config kept apart from logic;
  - the ownership split with the veil session (its exports only, never its internals);
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/`, configuration or the main checkout. Throwaway scripts live in the scratch folder (`soc-gate-r6/`). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the four briefing files, all of `PLAN.md` (sections 1 to 13, the check log and the audit log) and my round-5 report.
2. Checked each round-5 SoC disposition against the revised text (table below).
3. Looked for regressions in three ways:
   - traced every reader of the gathered state (`driftGate`, `frameState`) back to the call that fills it, including draws that happen outside `tick`;
   - walked the launch path (the worker's `launchGate`, steps 2.2 and 2.3 of `updateTransients`, the specs) for round 5's farewell change and P8's moved scroll-quiet key;
   - re-derived the import graph of the sketched model modules against 5.2. There is no cycle, and the veil's working copy adds no import that would close one: its `meteors.ts` imports `config`, `protocol` types, `random` and `scene`, and its `scene.ts` only `config` and `protocol` types.
4. Grounded current behavior in the worktree's `sky.worker.ts` and `mountSky.ts`. I compared the veil's working copy of `sky.worker.ts` (read only) with the plan's "observed" claims: `planLaunch`, `contrastLevels`, `pendingLayout` and `applyLayout`, `scrollKept` in `updateMeteor` and `draw`, and an untouched `scroll` handler. All match, and the plan uses only names the confirmed interface lists.
5. Ran two scratch models on Node 24.14, in `soc-gate-r6/`:
   - `stale-draw.mjs`: 6.1, 6.2 and 6.6 as revised, with a `resize` that draws before the listener's `schedule`, as today's worker does. It reproduces SOC6-1.
   - `farewell-null.mjs`: 6.9's steps 2.2 and 2.3 with 6.12's farewell row as written. It reproduces SOC6-2.

## Round 5's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC5-1 (major) | Yes | `demandNow` gathers first (line 1224), and `tick` gathers before `updateCamera` (1285). The wording follows at 238, 244, 285 (DR2), 299 (F6), 367, 858 and 876 to 880, and in 6.6's `activity` case (1680). 6.2's table defers `gather` to P6 (1247) and keeps the twinkle line fresh before it (1254). H13 case 1 gains the hero twin (2938), and P6 repeats the key-press check (3194). Traced: an `activity` ping after the idle sleep now restarts frames at once in the reading scene, the end and the hero. Residue: SOC6-1, a draw outside a frame decision reads the gate. |
| SOC5-2 | Yes | 5.2 (384, 386), the `radiants.ts` sketch (2488), the `satellites.ts` sketch (2706 to 2711), and `startArea` in P9 step 1 (3280). No cycle. |
| SOC5-3 | In part | 6.12's farewell row (2781) now names the contract change, P12's files list `transients.ts` and the worker's `launchGate` (3354), and D4 flags it (171). Residue: SOC6-2, a refusal can only be a failed plan, and satellites lose their hero-only rule. |
| SOC5-4 | Yes | `createMeteorMemory` (2116 to 2119), imported by `transients.ts` (2008) for `createTransientSchedule` (2183); 5.1 (359, 360); `clearSky(body)` in P12's files (3354). |
| SOC5-5 | Yes, in part | H13 case 0 runs in P3 (2938, 3088 to 3092). The optional P8 part was skipped "since H7's oracle covers launches" (3976); SOC6-4 gives new evidence against that reason. |
| SOC5-6 | Yes | The guard is dropped, and 5.2 (389), deviation 4 (56) and 4.2 (245) say why the worker stays one file. That was one of the two fixes offered, so I don't re-raise it. |
| SOC5-7 | Yes | `bodies.ts` and `SkyBody` in 4.1 (207), 4.2 (260), 5.1 (364, and README at 376) and 5.2 (382). |

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC6-1 | minor | From P6, a draw outside `tick` (resize, a quality step, the raster probe) reads a stale ambient level from `driftGate` |
| SOC6-2 | minor | Farewell meteors: a scene refusal can only be a failed plan, which stops hero meteors for the visit, and satellites lose their hero-only rule |
| SOC6-3 | minor | `CameraInput.scroll`'s doc names the worker's `parallaxScroll`, which P8 removes without touching `camera.ts` |
| SOC6-4 | minor | The launch gate decides T6 in the worker's adapter, which no harness runs, and P8 adds a milliseconds-to-seconds conversion there |

### SOC6-1 (minor): from P6, a draw outside `tick` reads a stale ambient level

**Section.** 6.6 (`twinkleLevel` from P6); 6.1 "The worker side" (`gather` and its doc); P6's files; F7.

**Problem.**

- **The rule round 5 set.** Every frame decision gathers first: `tick` before `updateCamera`, and `demandNow` for `schedule` (858, 876 to 880).
- **A reader off that path.** From P6, `frameAt`'s twinkle reads the gate too: `twinkleLevel` becomes `scene.twinkle × driftGate.level` (1656; P6's files, 3178). But `frameAt` also runs where no gather has run for that moment:
  - `resize` draws at once from the message handler, before the listener's `schedule` (`sky.worker.ts:380`, `:486`);
  - `stepDown` draws (`:302`);
  - `probeRaster` calls `frameAt` in `init` (`:314`).
- **Why it is new in P6.** Until P6 the twinkle reads `presenceLevel` and the motion level fresh (1656, 873), as today's `twinkleLevel` reads `idleTwinkle(now)` (`:97-99`).
- **When it shows.** The worker sleeps beside a present visitor only where nothing demands frames: the reading scene with the drift unaffordable (software raster, where `driftGate.allowed` is false, 1265 to 1270) or at D2 = 0 (169). Then:
  1. the visitor goes idle, and nothing gathers while the worker sleeps;
  2. a resize moves the scroll back into a twinkling scene (a taller window lowers the scroll in viewport heights);
  3. the resize frame draws the twinkle at the last gathered level, 1;
  4. the `schedule` that follows gathers `on = false` and sleeps, so that frame stays until the next input.

  That breaks F7 (300): "the resting sky (with no trace of twinkle once stopped) is what stays on screen". A near star one standard deviation into its twinkle sits 11 to 22% off its rest (deviation 3).
- **The structural point.** `driftGate` is a cache with one rule, fresh for its moment, and the plan gives it a reader outside the path that refreshes it.

**Evidence.**

- PLAN.md lines 169, 300, 858, 873, 876 to 880, 1265 to 1270, 1656 and 3178.
- Worktree `sky.worker.ts`:
  - `:97-99`, today's fresh `twinkleLevel`;
  - `:246-267`, `frameAt`, with `twinkle: twinkleLevel(now)` at `:262`;
  - `:295-303`, `stepDown`;
  - `:309-314`, `probeRaster`;
  - `:363-381` and `:428-430`, `resize`;
  - `:486`, `schedule` after the switch.
- Scratch `soc-gate-r6/stale-draw.mjs`. A visitor present in the reading scene at 10 s leaves the worker asleep. At 130 s a resize into the hero draws twinkle level 1 (last gathered at 10 s), while a fresh gather gives 0 (idle). The `schedule` that follows sleeps, so that frame stays.

**Fix.**

- `frameAt` calls `gather(now, scene)` with the scene it already computes. `gather` gives the same values for one `now`, so every reader of the gate then runs after a gather for its moment.
- 6.1's "every frame decision calls it first" becomes "everything that reads it calls it first: `tick`, `demandNow` and `frameAt`".
- Add to H13 in P6: after the idle sleep in the reading scene with the drift unaffordable, a `resize` draws no twinkle.

### SOC6-2 (minor): farewell meteors: a scene refusal can only be a failed plan, and satellites lose their hero-only rule

**Section.** 6.12 (the farewell row and the `METEOR_KINDS` paragraph); 6.9 (`LaunchGate.allowed`, steps 2.2 and 2.3); 4.3 T6; 5.1 (the `transients.ts` and worker rows); P12's files.

**Problem.** Round 5's fix says the gate "reports where launches may happen (the hero or the end)", and the farewell entry "names its scene, decided in the meteor spec like the other variants" (2781). Two failures follow from the contract as written.

- **A refusal can only be a null plan.**
  - The other variants fall back to an ordinary shooting star (`METEOR_KINDS`' doc, 3313 to 3314), but over the end bookend no ordinary meteor may fly.
  - So when the farewell's own rules refuse (the visit's two spent, the end level under 0.9, its gap not over), the meteor spec's only answer is null.
  - Step 2.3 counts a null plan made with the lease free as a failure. After `maxFailedPlans` of them, `nextAt` becomes Infinity until a layout message (2240, 2198).
  - `mountSky` posts a layout only when the layout changes (`mountSky.ts:160-169`). So a visitor who lingers over the end and scrolls back gets no more shooting stars in the hero.
- **Satellites lose their hero-only rule.** Step 2.2 holds a kind back only on `!gate.allowed` (2233 to 2238), and `SATELLITE_SPEC` has no scene of its own (2748 to 2757). Once the gate allows the end, satellites launch over Contact and the footer, against AC-24 ("desktop hero only", 3598) and P11 ("none ... past the hero", 3345).
- **6.12's own rule points elsewhere.** "Only a kind with its own clock (satellites) gets a registry entry" (2787), and the farewell meteors have their own clock (an 8 + Exp(14) s gap law) and their own visit cap.
- **5.1 misses it.** 5.1's `transients.ts` and worker rows list `clearSky(body)` and `cometShowing` for P12, but not the scene report (359, 367).

**Evidence.**

- PLAN.md lines 2155, 2198, 2233 to 2238, 2240, 2748 to 2757, 2781, 2787, 3313 to 3314, 3345, 3354, 3598, 359 and 367.
- Worktree `mountSky.ts:160-169`: `measureLayout` posts only when the layout changed.
- Scratch `soc-gate-r6/farewell-null.mjs`, with the visit's two farewells spent:
  - 40 s over the end leaves `failedPlans.meteor` at 3 and `nextAt` at Infinity;
  - the next 260 s in the hero launch 0 meteors;
  - 1 satellite launches over the end bookend.

**Fix** (a few sentences in 6.12's row and 6.9's step 2.2).

- The gate reports the scene as a fact (`LaunchGate.scene: 'hero' | 'end' | null`, from `SceneLevels`), and each spec names the scenes it launches in (`TransientSpec.scenes`: meteors and satellites the hero). Step 2.2 holds back a kind outside them, so a scene refusal is a hold, never a failed plan.
- Give farewell meteors their own registry entry, as 6.12's rule asks of a kind with its own clock:
  - `farewell`: body `Meteor`, its own gap law and visit cap, the 0.9 level in its scene test;
  - planned through the meteor planner with the full veil;
  - `drawTransient` gains a `case 'farewell'` that calls `drawMeteor`.

  T7 (one per kind) stays safe, because the two kinds' scenes never overlap. If the variant route stays instead, give the spec a hold test that step 2.2 runs, so its refusal never counts toward `maxFailedPlans`.
- Add the scene report to 5.1's `transients.ts` and worker rows, and amend T6.

### SOC6-3 (minor): `CameraInput.scroll`'s doc names a worker variable that P8 removes

**Section.** 6.1 (the `camera.ts` sketch and the law); P8's files and step 4; 5.1's `camera.ts` row.

**Problem.**

- The model's doc reads "Scroll to follow (page px): the worker's parallaxScroll." (656).
- P8 retires `parallaxScroll`: its `let` and its three writers (3249, 3255). But neither P8's files nor 5.1's `camera.ts` row (P2, P6, P7; 354) touch `camera.ts`. So the committed doc keeps naming a variable that no longer exists.
- A model module's doc shouldn't name the worker's internals anyway. 7.0 has committed comments say the reason in words (2857).
- 6.1's law line ("s: ... on parallaxScroll − shift", 441) has the same problem in the plan's own text.
- My round-5 report noted this under SOC-7 without raising it.

**Evidence.** PLAN.md lines 354, 441, 656, 2857, 3249 and 3255.

**Fix.**

- Write the doc as the model's own fact, "Page scroll the stars follow (page px)", which holds before and after P8. Or list `camera.ts`'s doc in P8 step 4.
- Write "the followed scroll" in 6.1's law.

### SOC6-4 (minor): the launch gate decides T6 in the worker's adapter, which no harness runs

**Section.** 6.9 (`LaunchGate`, "In the worker"); 4.3 T6; 7.1 (H7, H13); P8's verification; round 5's disposition of SOC5-5.

**Problem.**

- **The two gates are built differently.**
  - The drift's gate carries facts, and pure functions decide on them, so "the harnesses test the shipped rules" (858).
  - The launch gate does the opposite. The worker's `launchGate(now)` decides `allowed` (full motion, visible, revealed, present, the hero) and `settled` (the scroll quiet) itself, and the scheduler reads only the two booleans (2153 to 2165, 2358).
  - So T6, enforced by "code: `LaunchGate`, the launch step" (311), is decided in that adapter.
- **No harness runs the adapter.**
  - H7 drives the real scheduler with gates the harness builds itself, beside a harness copy of the veil commit's `updateMeteor` as the oracle (2932).
  - H13's cases 0 to 5 cover frames, not launches (2938).
  - Round 5 skipped SOC5-5's launch check "since H7's oracle covers launches" (3976). But the oracle and the port both take the harness's gates, so neither reaches the shipped adapter.
- **New in round 5 (DRY-R5-3).**
  - P8 moves the scroll quiet from `FRAME.meteorScrollQuietMs` to `TRANSIENTS.scrollQuiet` (1.2 s; 2272, 2279). The old key is in milliseconds and is compared with `lastScrollAt`, also in milliseconds (`sky.worker.ts:202`, `:51-52`).
  - So the adapter now converts units. Written without `* 1000`, the test would hold launches for 1.2 ms after a scroll, so shooting stars could start between the scroll messages of a slow scroll.
  - None of P8's checklist items exercises the scroll quiet on shipped code (3259 to 3261).

**Evidence.**

- PLAN.md lines 311, 858, 2153 to 2165, 2272, 2279, 2358, 2932, 2938, 3259 to 3261 and 3976.
- Worktree `sky.worker.ts`:
  - `:51-52`, `lastScrollAt` in milliseconds;
  - `:144-146`, `meteorsAllowed`;
  - `:202`, today's millisecond test.

**Fix.**

- Add an H13 case that runs in P8 (P8 already runs H13). With `Math.random` seeded and a launch due:
  - a scroll message 0.5 s before it holds the launch until 1.2 s after that scroll;
  - nothing launches while idle, below 0.4 viewport heights, or under reduced motion.
- Or make the T6 decision pure in `transients.ts`, over facts the gate carries, so H7 tests the shipped rule. That form also gives SOC6-2's per-spec scene test its home.

## Summary

**Verdict: pass.** No blocking or major finding remains in this scope.

Round 5's major (SOC5-1) is fixed: `gather` now runs at every frame decision, so a pointer, key or focus ping wakes a sleeping sky at once in every scene, and H13 and P6 check it. The other round-5 fixes landed:

- `startArea`'s import and P9's step order;
- `createMeteorMemory`;
- H13's case 0 in P3;
- the one-file worker;
- the `SkyBody` rows.

The boundaries hold:

- the drift and frame policy is pure;
- `transients.ts` stays kind-agnostic, with each kind in its own module;
- the protocol is the only channel between threads;
- the main thread imports only types and `color.ts` from the model;
- the plan uses only the veil session's confirmed names.

Four cheap minors remain:

- SOC6-1: `frameAt` should gather too, because a resize draw reads a stale ambient level from P6.
- SOC6-2: the farewell meteors' scene should be a per-spec hold, not a null plan, so hero meteors and the satellites' hero-only rule survive P12.
- SOC6-3: `CameraInput.scroll`'s doc should not name `parallaxScroll`, which P8 removes.
- SOC6-4: an H13 case in P8 should cover the launch gate's adapter, now that the scroll quiet is in seconds.

**Noted, not raised:**

- `LaunchGate.cometShowing` keeps the comet's name; the optional rename was skipped.
- `segmentClear` shares `quietIndex.ts` with the star buckets.
- `leanTarget` and `leanPending` stay worker functions; H13 case 5 covers them.
- The audit log's SOC-1 and DRY-7 rows still say "once per tick". They are the history of round 4.
