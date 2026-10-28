# Audit: separation of concerns

Auditor scope: separation of concerns, one of the four audits the task calls for. Date: 2026-10-27. Verdict: **revise** (2 major, 10 minor, no blocking).

## Scope

- **Role.** Audit `PLAN.md` for module boundaries and responsibilities only: pure math and policy in `src/lib/sky`, effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky.ts`, React UI in the pause control; the protocol as the only contract between threads; scheduler versus kind specs versus rendering versus the veil; config versus logic; the ownership split with the veil session (its exports, never its internals). Flag god-module growth, leaky abstractions, circular imports and over-engineering.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, "Confirmed veil interface (2026-10-27)" first), `research/01-planning-brief.md`, all 3,646 lines of `PLAN.md`; the worktree's `src/` at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `useIntroPhase.ts`, `tsconfig.json`, `eslint.config.mjs`); the main checkout's uncommitted veil edits, read only, to see whether the plan's reasons for its boundaries still hold.
- **Output.** This file and the same findings returned to the workflow.
- **Limits.** Planning only. I changed no file except this one. Throwaway checks live in the session scratchpad. Other lenses (Next.js docs, conventions, DRY) are out of scope except where they bear on a boundary.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, mapping every new or changed module to the responsibilities the plan gives it (4.1, 4.2, 5.1) and to the invariants it enforces (4.3).
2. Read the code each module boundary touches at 246c0aa, and the veil session's in-progress `sky.worker.ts`, `scene.ts` and `meteors.ts` in the main checkout (read only).
3. Counted functions and module bindings in the worker today and with the veil's edits, and the worker functions the plan adds.
4. Ran two scratch checks on Node 24.14 with the plan's own resolve hook (7.1), in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/soc-audit/`:
   - `h-worker-load.mjs`: can a harness load the worker files with the stubs 7.1 lists?
   - `cycle/`: does Node's type stripping erase an inline `import { type X }`?
5. Searched the round 1 to 3 check reports: none raised these boundary issues (they added cases to H13 instead).

## Findings at a glance

| ID | Severity | Section | Finding |
|---|---|---|---|
| SOC-1 | major | 6.1, 6.2, 6.6, 6.13, 4.3, 7.1 | Policy the plan calls pure lives in `sky.worker.ts`, where no harness can reach it; the worker grows with no guard |
| SOC-2 | major | 4.2, 5.1, 5.2, 6.9, P9 to P12 | `transients.ts` becomes the meteor kind's home as well as the kind-agnostic scheduler |
| SOC-3 | minor | 4, T3, 6.11, 6.12 | T3's drawing rule is enforced separately in each drawer |
| SOC-4 | minor | 6.4, 6.5, P1 | The quiet index, a renderer cache, travels inside the per-frame data |
| SOC-5 | minor | 6.10 | The visit's sky copies the veil planner's start sampling instead of using an export |
| SOC-6 | minor | 6.9, 6.10, 6.11, 6.12 | Sky-wide layout guards and the field type carry the meteor's name |
| SOC-7 | minor | 4.4, 6.1, 8.1 | `parallaxScroll` survives as a second, two-writer copy of the scroll |
| SOC-8 | minor | 6.8 | The pause store carries the visitor's choice and the sky's lifecycle on one channel |
| SOC-9 | minor | 5.2 | The cycle-safety argument assumes type imports vanish, which the harness doesn't guarantee |
| SOC-10 | minor | 4.4, 6.10, P10 | 4.4 understates what we change inside the veil's planner after V |
| SOC-11 | minor | 6.12, P12, 4.2 | The static comet has no owning module |
| SOC-12 | minor | 6.9 | An exported type nothing uses |

## Findings

### SOC-1. Policy the plan calls pure lives in the worker, where no harness can reach it (major)

**Section.** 6.1 "The worker side"; 6.2 "Policy and mechanism" and "The worker's demand"; 6.6 "The motion level"; 6.13 (`leanTarget`, `leanPending`); 4.1; 4.3 (D2, D3, M1, F6, F7); 7.1 (worker stubs, H4, H13); P5 step 4, P6 step 3, 8.5 step 4.

**Problem.**

- 6.2 splits the frame clock into "**Policy** (pure, in `src/lib/sky/pacing.ts`): what each part of the sky needs (`FrameDemand`), the strictest of them, ... All of it runs in the scratch harness" and "**Mechanism** (in `sky.worker.ts`): the `requestAnimationFrame` and `setTimeout` handles" (lines 891 to 894).
- But "what each part of the sky needs" is decided in the worker: `frameDemand`, `cameraDemand`, `driftCap` and `twinkleDemand` (lines 1098 to 1135), and the policy they read, `motionLevel`, `driftWanted`, `driftTarget`, `driftRate` and `driftAffordable` (lines 812 to 835), `settleMotion` (6.6), `leanTarget` and `leanPending` (6.13). All are closures over worker module state (`motion`, `exitAt`, `presence`, `width`, `quality`, `softwareFps`, `camera`).
- 4.3 says these worker functions enforce D2 ("the worker's `driftRate`"), D3, M1 ("the worker's `motionLevel` and `skyMoved`"), F6 ("`driftWanted`, `twinkleDemand`; harness H13") and F7.
- The worker exports nothing and touches `self` when it loads (`sky.worker.ts:26`, the listener at `:397`). 7.1 says "Worker files load too, with stubs for the canvas globals" (`ImageData`, `OffscreenCanvas`; line 2706), which doesn't hold for `sky.worker.ts`. So H13, "a simulation of the worker's tick and schedule against a fake clock" (line 2731), has no specified rig, yet P5 step 4, P6 step 3, P7 and checkpoint V (line 3256) require it green. H4 can only test `combineDemands` by rebuilding the worker's state-to-demand mapping inside the harness, so it tests a copy.
- Meanwhile the worker keeps growing. Today it has 30 functions and 40 module-level bindings (33 and 42 with the veil's in-progress edits). The plan adds 16 named worker functions, 12 of them policy, and about a dozen net module variables, while removing about 7. 5.2 gives `renderSky.ts` a size guard (line 375) and the worker none. 4.1 calls the worker "orchestration: state, messages, tick; ... instances" (line 189), which hides the policy it now holds.

**Evidence.**

- Scratch check `h-worker-load.mjs`, the plan's resolve hook, Node 24.14: `renderSky.ts` loads (exports `createStarField, drawMeteor, drawSky`); `sky.worker.ts` throws `ReferenceError - self is not defined`; with a fake `self` it loads and exports `[]`.
- Counts: `grep -cE "^(async )?function "` gives 30 in the worktree's `sky.worker.ts` and 33 in the main checkout's; `grep -cE "^(let|const) "` gives 40 and 42.
- The 16: `updateCamera`, `motionLevel`, `driftWanted`, `driftTarget`, `driftRate`, `driftAffordable`, `frameDemand`, `cameraDemand`, `driftCap`, `twinkleDemand`, `requestFrame`, `onStalled`, `settleMotion`, `leanTarget`, `leanPending`, `launchGate`.
- Deviation 4's reason for keeping the handles in the worker still holds: the veil's in-progress `scroll` case still reads `if (!rafId && timerId === undefined) needsDraw = true`.

**Fix.** Keep the mechanism (handles, watchdog, probe, timers) in the worker, and move the policy into `src/lib/sky` as pure functions of explicit inputs that the worker fills from its variables each tick:

- `camera.ts`: `driftWanted(gate)` and `driftRate(gate)` over a plain `DriftGate`, for example:

  ```ts
  /** What the drift clock's rate depends on, gathered by the worker each tick. */
  export interface DriftGate {
  	/** Full motion: not paused and no reduced-motion preference. */
  	full: boolean
  	/** Seconds since the dusk began, or null before it. */
  	dusk: number | null
  	/** The software-raster budget allows drift frames (PACING.minFps). */
  	affordable: boolean
  	/** No input for FRAME.idleSleepMs (isAway). */
  	away: boolean
  	/** The scene's drift level (SceneLevels.drift). */
  	sceneDrift: number
  	narrow: boolean
  	/** presenceLevel, 0 to 1. */
  	presence: number
  	/** The motion level, 0 to 1. */
  	motion: number
  }

  /** Whether the drift runs or is heading up: frames follow this, not the eased rate (F6). */
  export function driftWanted(gate: DriftGate): boolean {
  	return gate.full && gate.dusk !== null && gate.affordable && !gate.away && gate.sceneDrift > 0
  }

  /** The drift clock's rate: the scene's target times presence, the motion level and the ease from the dusk (D2, D3). */
  export function driftRate(gate: DriftGate): number {
  	if (gate.dusk === null || !gate.affordable) return 0
  	return gate.sceneDrift * (gate.narrow ? DRIFT.narrowRate : 1) * gate.presence * gate.motion * smoothstep(0, DRIFT.ease, gate.dusk)
  }
  ```

- `pacing.ts`: the state-to-demand mapping as a pure `frameDemand(state)` over a plain record (can draw, scrolling and its motion, the transients' demand, the camera's device-px speed, drift or lean wanted, the drift cap, fade reasons, twinkle on and its fps), with `cameraDemand` and `twinkleDemand` as pure helpers. H4 then tests the real mapping.
- A small eased level beside `presence.ts` for the motion level (`{ from, target, changedAt }` and `motionLevelAt(ease, t)`), the same shape as `presenceLevel`.
- H13: run cases 1 and 3 to 5 against these functions in a harness tick loop with `frameDue`. If any whole-worker simulation stays, specify its rig in 7.1: a fake `self` with a message dispatcher, fake animation frames, timers and `performance.now`, the recording `OffscreenCanvas`, and a fresh module per case (`import(url + '?case=n')`). Correct 7.1's "Worker files load too".
- Add a worker guard beside 5.2's `renderSky.ts` one. After V, when 8.1 lets P8 change the seams, consider moving the frame mechanism into a worker file (for example `frameLoop.ts`, added to AGENTS.md's list) behind `framePending()`.

### SOC-2. `transients.ts` becomes the meteor kind's home as well as the scheduler (major)

**Section.** 4.2 (the TransientSpec row); 5.1; 5.2 ("No runtime import cycles"); 6.9 (Types, `VisitMemory`, `PlanContext`, `planMeteorTransient`, the registry); 6.11 (the satellite spec); P9, P10, P11, P12.

**Problem.**

- 4.2 puts the registry in `transients.ts` and says "each kind's module supplies its planner" (line 248). Satellites do (`planSatellite` in `satellites.ts`). The meteor kind doesn't: its planner, `planMeteorTransient` (the ported `planLaunch`: the sticky radiant, fresh radiants, long then short passes, clearing the radiant or the visit's sky; lines 1966 to 1975), lives in `transients.ts`.
- So does its per-visit memory, `VisitMemory` (the radiant in P8, `VisitSky` in P9, the last fireball in P10; lines 1913 to 1921), and from P10 its fireball decision ("desktop only, at least `after` s since the reveal, at least `spacing` s since the last one (in `VisitMemory`), and `chance` per launch", line 3089).
- P12 then adds every could kind's "body, spec and registry entry" there (line 3136). 5.1 already lists "the union, specs, scheduler, lease, cancel, `nextGap` (P9), demand" (line 349).
- The result: the kind-agnostic scheduler changes in P8, P9, P10, P11 and every P12 pull request, for scheduling reasons and meteor-policy reasons alike. Meteor-only fields leak into the shared contract: `PlanContext.visit`, `PlanContext.sinceReveal` ("fireballs wait"), and `PlanContext.ink`, documented as "planMeteor's ink option" (lines 1923 to 1938).
- 5.2's reason for keeping specs in the registry is that a value import back from a kind module would be a runtime cycle with a temporal-dead-zone error (lines 372 and 373). The only value a kind's spec needs from `transients.ts` is `nextGap` (6.11's satellite spec calls it, lines 2567 to 2570). Moving `nextGap` to a leaf module removes the cycle without keeping kinds in the scheduler.

**Evidence.** PLAN.md lines 248, 349, 372 and 373, 1874 to 1879 (imports of `planMeteor`, `pickRadiant`, `nextMeteorGap`, `meteorLifetime` and `meteorMoving`; P11 adds `./satellites`), 1913 to 1938, 1966 to 1989, 2567 to 2570, 3060, 3089, 3117, 3136.

**Fix.**

- Keep `transients.ts` kind-agnostic: the envelope and union, the registry, the scheduler, the lease, `cancelFade` and `transientFade`, and `transientDemand`.
- Move `nextGap` (with `TRANSIENTS.longVisit`) to a leaf module: `random.ts`, beside `between` and `gaussian`, or a new `gaps.ts`.
- Give the meteor kind its own module, for example `src/lib/sky/meteorKind.ts`, importing values from `meteors.ts` and `radiants.ts`. It exports its `TransientSpec<'meteor'>`, `planMeteorTransient`, its memory type and, from P10, the fireball decision. `satellites.ts` exports its spec the same way.
- Kind modules import only types from `transients.ts`, with a statement-level `import type` (SOC-9), and the registry imports each spec value. Load order then never matters.
- Make per-visit memory per kind (for example `VisitMemory = { meteor: MeteorMemory }`, with each spec's `forget` called on resize) and keep `PlanContext` to what every kind needs.
- Update 4.2, 5.1, 5.2 and the P9 to P12 file lists.

### SOC-3. T3's drawing rule is enforced separately in each drawer (minor)

**Section.** Section 4's opening; 4.3 T3; 6.11 "Drawing"; 6.12 (the meteor-like could kinds and the comet).

**Problem.** Section 4 promises that "each invariant has one place that enforces it" (line 182). T3's drawing half, that a kind that never takes the lease is "drawn with the near layer's keeps", is "Enforced by: ... its drawer" (line 304):

- `drawSatellite` hardcodes `transientQuietFactor(frame.quiet, x, y, LAYERS.near)` (line 2575);
- P12's point flash, bursts and earthgrazers get "one more `drawMeteor` argument" (line 2591);
- the comet repeats the rule for every part (line 2586).

Which keeps a kind draws with is lease policy, decided three ways inside the renderer. A future never-lease kind whose drawer forgets it would add light inside a padded rect after a mid-pass layout.

**Evidence.** PLAN.md lines 182, 304, 2575, 2586, 2591.

**Fix.**

- Add a spec property, for example `TransientSpec.lease: boolean`, false for satellites and the never-lease could kinds.
- The launch step already enforces the planning half in one place: it counts a `nearCopy` plan made with `nearCopy: false` as failed. Have it also pass `nearCopy: spec.lease && inkLeaseFree(...)`, and stamp the envelope with `clearSkyOnly: !spec.lease`.
- `drawTransient` picks the near layer's keeps once from that flag and hands them to every drawer, P12's `drawMeteor` argument included.
- Meteors keep the veil's budget keeps whatever their plan, so P8 still matches its oracle.

### SOC-4. The quiet index, a renderer cache, travels inside the per-frame data (minor)

**Section.** 6.4 "Grid"; 6.5's last paragraph; P1's files.

**Problem.** `SkyFrame` is "Everything one frame needs" (`renderSky.ts:62`), a snapshot the worker builds in `frameAt`. The plan puts the stateful `QuietIndex` in it, and `drawSky` mutates it (`frame.quietIndex.update(...)`, line 1393). Meanwhile the other renderer cache, `StarField`, is a `drawSky` parameter (`renderSky.ts:140`). That gives two caches two conventions, and the frame stops being plain data: `probeRaster` draws a spread, modified copy of the frame (`sky.worker.ts:314`), which shares and updates the live index.

**Evidence.** PLAN.md lines 1393 and 1476; worktree `renderSky.ts:62` and `:140`; `sky.worker.ts:314`.

**Fix.** Treat the index like the star field: create it once beside `createStarField()` and pass it to `drawSky` as an argument (or pass both as one `SkyCaches` argument). `SkyFrame` keeps only `quiet: QuietBlend`. P1's file list and 6.5's `SkyFrame` sentence change with it.

### SOC-5. The visit's sky copies the veil planner's start sampling (minor)

**Section.** 6.10, `pickVisitSky` steps 2 and 3 (the usability test); 6.10 "Everything else stays the veil session's".

**Problem.** The usability test probes "a 4 × 4 grid at the cell centres of `METEOR.spawnX` × `METEOR.spawnY`, each y clamped to `METEOR.top` as the planner clamps its starts (`meteors.ts:138`)" (line 2381), and on-screen radiants sample the same band (line 2379). This re-implements how the veil-owned `planFlight` picks start points, which the plan itself lists as staying the veil session's: "the start-point sampling" (line 2468). It matches today: the veil's in-progress planner still samples starts the same way. If that rule changes, though, R1's "every visit's shower can yield paths" is checked against the wrong area, and nothing reports it.

**Evidence.** PLAN.md lines 2379, 2381, 2468; worktree `meteors.ts:136-139`; main checkout `meteors.ts:203-205` (read only).

**Fix.** With I2 (ours after V, and it already edits that loop), export the start area from `meteors.ts`, for example `startArea(field): { x0: number; x1: number; y0: number; y1: number }`. Use it in `planFlight`'s sampling, and build the probe grid and the on-screen band from it. If the veil session prefers to own it, ask for it in the I2 note.

### SOC-6. Sky-wide layout guards and the field type carry the meteor's name (minor)

**Section.** 6.9 (`PlanContext`, `LaunchGate`); 6.10 step 2; 6.11 planning step 2; 6.12 (the comet); 4.4.

**Problem.**

- Every kind reads the navbar, edge and side-rail clearances from the meteor's block:
  - satellites start `METEOR.edgeMargin` outside a side, "below `METEOR.top`, above `METEOR.maxEndY`" (line 2563);
  - the comet "stays below `METEOR.top`" (line 2586);
  - the on-screen radiant uses `METEOR.edgeMargin` and `METEOR.top` (line 2379).
- Those keys are documented as the meteor's ("Clearance below the top edge (under the 100px navbar) and inside the screen edges", `config.ts:267-269`). 4.4 counts "`METEOR`'s spawn and selection keys" as the veil's until V (line 326). So a retune for meteors would silently move satellites and the comet too.
- The same leak shows in the kind-agnostic contract: `PlanContext.field` and `LaunchGate.field` are typed `MeteorField` (lines 1928 and 2004).

**Evidence.** PLAN.md lines 326, 1928, 2004, 2379, 2563, 2586; worktree `config.ts:265-269`.

**Fix.** After V, move `top`, `edgeMargin` and `maxEndY` to a kind-agnostic block (for example `SKY_CLEARANCE`, with its own doc comment) that `METEOR` and every kind read. If that's too much churn, at least say in `METEOR`'s doc that these three keys guard every transient. Alias the field type (`export type SkyField = MeteorField`, or rename it at V).

### SOC-7. `parallaxScroll` survives as a second, two-writer copy of the scroll (minor)

**Section.** 4.4 "Written by both"; 6.1 "The worker side"; 8.1.

**Problem.** From P2 the camera already encodes the motion freeze: `follow: motion === 'full'` holds the springs (line 844), and `resumeCamera` puts the scroll skipped while stopped in `shift` (lines 729 to 735). Yet the camera still reads `parallaxScroll` (line 842), a motion-gated copy of `scrollY` written by two owners:

- the veil's `scroll` handler, under full motion (`sky.worker.ts:465`);
- our `motion` handler, on resume (line 856; 4.4, line 332).

So two owners write one variable, and two mechanisms encode one rule. Keeping it as a seam before V is right. The plan never retires it after V, although 8.1 lets P8 change seams (line 3182).

**Evidence.** PLAN.md lines 332, 729 to 735, 842, 844, 856, 3182; worktree `sky.worker.ts:465`.

**Fix.** Add a cleanup step after V, in P8:

- `updateCamera` reads `scrollY`;
- `parallaxScroll`, its write in the scroll handler and the resume line go.

While stopped the springs hold, and `resumeCamera` sets `lastGoal` and `shift` so the next goal equals the camera's position, so nothing visible changes. H5's continuity case (pause, scroll 5,000 px, resume) checks it.

### SOC-8. The pause store carries the visitor's choice and the sky's lifecycle on one channel (minor)

**Section.** 6.8 "Where the state lives" and "Wiring".

**Problem.** `skyPause.ts` holds two concerns behind one `subscribeSkyPlayback`:

- the playback preference: the stored pause, the reduced-motion default and the Play override;
- a lifecycle flag, `running`, which `mountSky` sets when the worker draws or dies (lines 1634, 1681 to 1686, 1853).

`mountSky` writes `running` and also subscribes, so it hears its own writes and has to filter them ("Post only real changes: the store also notifies when the sky starts or stops running", `sentMotion`, lines 1840 to 1847). The dedupe works, but it is a symptom of one subscription carrying two concerns.

**Evidence.** PLAN.md lines 1634, 1670 to 1674, 1681 to 1686, 1840 to 1848, 1853 and 1854.

**Fix.** Pick one of these:

- Give `mountSky` a preference-only subscription, and let the toggle subscribe to both the preference and `running`.
- Move `running` to a two-function companion (`setSkyRunning`, `subscribeSkyRunning`) that the toggle reads beside the preference.
- If one channel stays, say why in 6.8.

### SOC-9. The cycle-safety argument assumes type imports vanish, which the harness doesn't guarantee (minor)

**Section.** 5.2 "No runtime import cycles".

**Problem.**

- 5.2 relies on `satellites.ts` importing `PlanContext` and `Planned` back from `transients.ts` as types "which TypeScript erases" (line 372).
- The production build does elide them: `tsconfig.json` has `isolatedModules` and no `verbatimModuleSyntax`.
- The plan's harnesses run on Node's type stripping, though, which erases only a statement-level `import type`. An inline `import { type PlanContext, type Planned } from './transients'`, a form the codebase uses when it mixes values and types, stays a runtime import there. That makes the cycle real in exactly the harness that checks P11.
- Today's design survives this, because the registry reads only hoisted function declarations at load. SOC-2's fix (spec constants in kind modules) would not.

**Evidence.** PLAN.md lines 372 and 373; worktree `tsconfig.json`. Scratch check `soc-audit/cycle/` on Node 24.14: running `b.ts` (`import { type X } from './a.ts'`) prints "a.ts evaluated"; running `c.ts` (`import type { X } from './a.ts'`) doesn't.

**Fix.** State in 5.2, and in the `satellites.ts` sketch, that a kind module's back edge is a statement-level `import type { ... } from './transients'`, never inline `type` specifiers. The registry reads nothing at load but function declarations, or values from leaf modules.

### SOC-10. 4.4 understates what we change inside the veil's planner after V (minor)

**Section.** 4.4; 6.10 "Inside `planFlight`"; P10.

**Problem.** 4.4 says "The veil's even after the rebase: `veiledFrom`'s rules and `METEOR_VEIL`. Our additions extend `PlanOptions` only." (line 329). But both I2 and P10 edit the veil's private planner:

- I2 edits `planFlight`'s body: it replaces the direction, filter, speed, duration and peak lines with `options.aim`, adds two end conditions, and changes train eligibility and the fireball path (lines 2451 to 2462);
- P10 replaces `PassOptions.fireballs` and the per-attempt fireball draw (line 3090).

`COORDINATION.md` leaves the direction source to this plan ("Left to this plan"), so the edits are sanctioned. Only the ownership sentence is wrong, and an implementer reading 4.4 at P9 would expect an options change only.

**Evidence.** PLAN.md lines 329, 2451 to 2462, 3090; `COORDINATION.md`, "Left to this plan".

**Fix.** Reword it: "After V we extend `PlanOptions` (`aim`, `fireball`) and edit `planFlight`'s direction, end-test, train and fireball lines (I2, P10); `veiledFrom`'s rules and `METEOR_VEIL` stay the veil's."

### SOC-11. The static comet has no owning module (minor)

**Section.** 6.12 (Static comet); P12's files; 4.2.

**Problem.** The comet is "not a transient: a `SkyBody`" with state and rules of its own:

- a fade-in of at least 8 s;
- a box re-tested against every padded rect on every drawn frame, fading out when that fails;
- a scroll-level fade.

Yet 4.2 has no `SkyBody` entity, 5.1 no file for it, and P12 says only "a `SkyBody` drawn after the layers in `renderSky.ts`" (line 3136). As written, its model logic lands in the renderer, against 4.1's split.

**Evidence.** PLAN.md lines 2586 and 3136; 4.2's table (lines 228 to 256) has no `SkyBody` row.

**Fix.** If D4 picks the comet, add a `SkyBody` row to 4.2 and a model module, for example `src/lib/sky/bodies.ts`, that owns its placement, fades and box test as pure functions; `renderSky.ts` only draws what it returns. D4's default ships no could kinds, so this can wait for that decision.

### SOC-12. An exported type nothing uses (minor)

**Section.** 6.9 "Types".

**Problem.** `TransientOf<K>` is declared (line 1911) and used nowhere in the plan. This is the only over-engineering I found: every other piece of machinery (the watchdog and its strikes, the refresh estimate, the quiet index, the registry) has a stated cause.

**Evidence.** PLAN.md line 1911; `grep -c TransientOf PLAN.md` returns 1.

**Fix.** Drop it, or name its first user.

## Summary

**Verdict: revise.** Two findings are major, both about where policy lives:

- **SOC-1.** The worker holds the drift, motion-level, lean and frame-demand policy. That leaves the invariants that matter most for the headline change (D2, D3, M1, F6, F7) testable only through an H13 rig the plan doesn't specify, and the worker can't load with the stubs 7.1 lists.
- **SOC-2.** The scheduler module also becomes the meteor kind's planner, memory and fireball policy, contradicting 4.2.

Both fixes are moves, not redesigns: pure functions with explicit inputs for SOC-1, and a meteor kind module plus a leaf `nextGap` for SOC-2.

**What holds up.**

- **Threads.** The protocol is the only contract between them: activity, pointer, motion and ready all travel as messages. The main thread imports only types and `color.ts` from `src/lib/sky`, and no runtime constant must agree across the two sides.
- **The pause control.** The toggle is presentational, the store is DOM-guarded and needs no `'use client'`, and `mountSky` maps the pause to the existing `motion: 'reduced'` pipeline. Navbar renders only on `/`, so nothing reaches `/links`.
- **New model modules.** `camera.ts`, `pacing.ts`, `presence.ts` and `quietIndex.ts` are cohesive and pure.
- **Dependency inversion.** `Aim` and `Flight` keep `meteors.ts` from importing `radiants.ts`.
- **Rendering.** Drawing stays out of the registry (`drawTransient`'s switch), and `transientFade` is the single cancel rule.
- **Config.** `GapLaw` and `WakeColor` live in `config.ts`, so the config never depends on its readers.
- **The veil.** Before V, our code uses only the veil's exports (`QUIET_REACH`, `transientQuietFactor`, `scrollKept`, the `planMeteor` options) and imports no private helper.

**Fix first:** SOC-1 (it gates P5, P6, P7 and V), then SOC-2 (before P8 writes `transients.ts`). The minor findings can fold in alongside.

## Verification

Skeptic pass, 2026-10-27. I re-read every cited line of `PLAN.md`, the worktree code at 246c0aa, all of `COORDINATION.md`, and the veil's in-progress `sky.worker.ts` and `meteors.ts` in the main checkout (read only). I re-ran the auditor's two scratch checks on Node 24.14 from `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/soc-skeptic/`, with the same results, and added `swc-elide.cjs`, which runs Next's own SWC transform with default options on both type-import forms. No fix below breaks a `COORDINATION.md` constraint: the ones that touch veil-era code (SOC-5, SOC-6, SOC-7, SOC-10) wait for V. Verdicts: 10 confirmed, 2 partly, none refuted.

- **SOC-1: confirmed.** Every cited line holds: 6.2 calls the policy pure and harness-run (893), while `frameDemand`, `cameraDemand`, `driftCap`, `twinkleDemand` (1098-1135) and the drift and motion closures (812-835) are worker closures that 4.3 makes the enforcers of D2, D3, M1, F6 and F7 (4.2 even gives D1 to D3 to `camera.ts`). `sky.worker.ts` still fails to load with only 7.1's stubs (`self is not defined`, `:26`) and exports nothing with a fake `self`; the plan has no H13 rig anywhere; H4's timer-fallback case is worker mechanism too (`requestFrame`, 1168); the counts reproduce (30 functions and 40 bindings here, 33 and 42 in the veil's WIP). Round 4's completeness check found the H13 gap independently (C43). The fix keeps deviation 4's handles in the worker and reuses the plan's own `LaunchGate` pattern. Caveat: F6 and F7 are properties of `tick` and `schedule`, so H13 still needs C43's real-worker rig (a fake `self`, one fake clock, a fresh module per case); running its cases on a harness tick loop would test a copy, the flaw this finding names in H4.
- **SOC-2: confirmed.** 4.2 says each kind's module supplies its planner (248), yet the meteor's planner (`planMeteorTransient`, 1966-1975), its `VisitMemory` (1913-1921), the P10 fireball decision (3089) and `nextGap` (2150-2156) sit in `transients.ts`, and P12 adds each could kind's body there (3136). The only value a kind's spec needs back is `nextGap` (2568-2569), so 5.2's TDZ reason (372-373, from the base draft's `nextGap` back-import) goes once `nextGap` is a leaf. Caveats for the reviser: `ink` pairs with the kind-agnostic `nearCopy` lease (any lease-taking kind needs the contrast preference's share), so it can stay in `PlanContext`, and the clear leaks are `visit` and `sinceReveal`; the visit's sky also serves the meteor-like could kinds (bursts and the point flash use the shower radiant, 6.12), so key the memory by kind family; prefer a new `gaps.ts` to `random.ts`, which is documented as seeded randomness and imports nothing today.
- **SOC-3: confirmed.** Section 4 promises one enforcer per invariant (182), but T3 names "its drawer" (304), and the near-layer keeps are chosen in `drawSatellite` (2575), in P12's extra `drawMeteor` argument (2591) and per part for the comet (2586). Caveat: the launch step's `nearCopy` check (2083) guards the lease, not the `QUIET.feather` clearance, which each planner still enforces (`planSatellite`'s segment test, 2566), so only the drawing half moves to one place; the comet is not a transient and stays outside the flag (SOC-11).
- **SOC-4: confirmed.** `SkyFrame` is "Everything one frame needs" (`renderSky.ts:62`), `StarField` is a `drawSky` argument (`:140`), and the plan carries the mutable index in the frame (1393, 1476), which `probeRaster`'s spread copy (`sky.worker.ts:314`) shares (harmlessly: same size and zones). A cost the finding doesn't name: new `drawSky` arguments edit `draw` and `probeRaster` before V, and the veil's in-progress `draw` changes the very next line (`drawMeteor` with `scrollKept`, main checkout `sky.worker.ts:326-327`), so 8.6 must then list `draw`; letting `renderSky.ts` own the index at module scope avoids that hotspot.
- **SOC-5: partly.** Holds: the usability probes (2381) restate `planFlight`'s start sampling (worktree `meteors.ts:136-139`, unchanged in the veil's WIP at `:203-205`), which 6.10 leaves to the veil (2468), so an exported start area should feed the probe grid. Doesn't hold: the on-screen radiant (step 2, 2379) samples [`edgeMargin`, W − `edgeMargin`] × [`top`, `onScreenTop` × H], a band chosen for placing the radiant, not a copy of the start sampling; building it from the start area would move every on-screen radiant into the spawn area (x from 0.45 W), a design change the computed figures (H8's 15 ± 1%, the 20 to 23% usability failures) don't cover. Apply the fix to the probe grid only.
- **SOC-6: confirmed.** Satellites (2563, 2565), the comet (2586) and the on-screen radiant (2379) read `METEOR.top`, `edgeMargin` and `maxEndY`, which are documented inside the shooting-star block (`config.ts:265-269`), and the kind-agnostic `PlanContext.field` and `LaunchGate.field` are `MeteorField` (1929, 2004; "Where a shooting star may fly", `meteors.ts:12-13`). The key docs already read as layout guards (navbar, edges, side rails), so the doc-only fallback is cheap; a shared block edits the veil's planner reads (its WIP `meteors.ts:205`, `:223`), which is allowed only after V, as the fix says.
- **SOC-7: confirmed.** After P2 the only reader of `parallaxScroll` is `updateCamera` (842; P2 replaces the `frameAt` read), and with `follow` false `stepCamera` holds the springs while `resumeCamera` sets `shift` and `lastGoal` so the next goal equals the camera's position (684-735): reading `scrollY` changes nothing visible, and H5's pause, scroll, resume case covers it if it feeds the live scroll while paused. The removal edits the scroll handler, which `COORDINATION.md` frees only at V and 8.1 lets P8 change; log it in CP-2.
- **SOC-8: partly.** Holds: the lifecycle flag `running` and the pause preference share one `subscribeSkyPlayback` channel (1635, 1682-1686), and the plan's own comment ties `sentMotion` to that (1841). Doesn't hold: the dedupe isn't only a symptom of it, since the reduced-motion and `storage` listeners (1707-1724) also notify when the motion doesn't change (a reduced-motion switch while a stored pause holds; another tab pausing while this one is already still under reduced motion), so splitting `running` out leaves the dedupe in place, and PB4 makes `running` part of the control's own snapshot (`SkyPlayback | null`), which one channel keeps to one `useSyncExternalStore`. Take the third option: fix the comment at 1841 and say in 6.8 why one channel stays.
- **SOC-9: confirmed.** Re-run on Node 24.14: an inline `import { type X }` still evaluates its module and `import type` doesn't; Next's SWC with default options drops both (`swc-elide.cjs`), as the finding says of the build; today's registry survives because it reads only function declarations, which ESM initializes at link time. The risk is low, since the codebase writes all-type imports as `import type` and uses inline specifiers only beside values (`sky.worker.ts:9-10`, `renderSky.ts:18-19`), but the one-sentence rule is cheap and becomes load-bearing if SOC-2's fix puts spec constants in kind modules.
- **SOC-10: confirmed.** 4.4 says our additions extend `PlanOptions` only (329), but I2 rewrites `planFlight`'s direction, filter, speed, duration and peak lines, adds two end conditions and changes train eligibility (2451-2462), P9 drops the `radiant` parameter and turns `PassOptions.timing` into `fallback` (2441-2446, 3061), and P10 replaces `PassOptions.fireballs` (3090). The new sentence should name those P9 changes too, as the CP-0 message already does (3236-3237).
- **SOC-11: confirmed.** The comet's state and rules (a fade-in of at least 8 s, a per-frame box test with a `cancelFade` fade, the scroll-level fade; 2586) have no entity in 4.2, no file in 5.1 and only "a `SkyBody` drawn after the layers in `renderSky.ts`" in P12 (3136), while the launch step must know whether "a comet shows" (2080). It can wait for D4, as the finding says.
- **SOC-12: confirmed.** `TransientOf` appears once (1911). The delivery and experience drafts used it in their specs' `plan` and `moving` signatures, which this plan replaced with `Planned<K>` and `TransientBodies[K]`, so it is a leftover, and lint doesn't flag an unused export.
