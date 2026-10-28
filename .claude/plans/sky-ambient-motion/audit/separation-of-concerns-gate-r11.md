# Separation of concerns: gate round 11

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 11. I confirm that round 10's three SoC fixes landed (SOC10-1 to SOC10-3), check the rest of round 10's revision for regressions in this lens, and sweep the rest of `PLAN.md`. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as revised after round 10 (3,651 lines).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md` and all of `COORDINATION.md`. Its "Committed: cf4d7b8", "Landed in the working tree" and "Answers to the planning session's questions" sections are authoritative.
  - `REVIEW-LOG.md` ("### Round 10", "### Gate round 10" and earlier rows where a finding touches the same text), and my round 10 report.
  - The code at cf4d7b8, read from this worktree's `src/` (the planning branch merged `origin/master` at cf4d7b8).
  - `PLAN.before-r10.md` in the session scratchpad, only to diff what round 10 changed.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky`, and React UI in the pause control;
  - the protocol as the only contract between threads;
  - the scheduler, the kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the veil's code used through its exports and extended through options (8.4), never its private helpers;
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout. Throwaway files live in the scratch folder `soc-gate-r11/` (`r10diff.txt`, the word diff of round 10's revision, and `imports.mjs`, round 10's import-graph script rerun on this revision). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files and `COORDINATION.md` in full, then all of `PLAN.md`.
2. Word-diffed `PLAN.before-r10.md` against `PLAN.md` (63 hunks) and checked each change through this lens.
3. Checked the SOC10-1, SOC10-2 and SOC10-3 dispositions against the text, and followed each fix into the sections it touches (4.1, 4.2, 4.3, 5.1, 6.9, 6.12, 8.4, P12, AC-25).
4. Read cf4d7b8's `sky.worker.ts`, `meteors.ts` and `scene.ts` in full, and the relevant parts of `renderSky.ts`, `mountSky.ts`, `protocol.ts`, `random.ts` and `config.ts`, to check the citations round 10 added or moved in this lens.
5. Reran the import extraction (`imports.mjs`) on every sketch and checked the runtime graph for cycles and against 5.2's list; then added the edges P12's text implies but no sketch shows (`bodies.ts`, the farewell spec).
6. Traced the two P12 kinds round 10 reworked (the comet's start rule, the farewell band and cap) and P10's fireball decision through the launch gate, the scheduler's steps, `planMeteorTransient` and the visit's memory.

## Round 10's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC10-1 | Yes | The comet's start rule reads the launch gate: `allowed` (with `scene === 'hero'` once farewell meteors add it), `settled`, `!narrow` and `sinceReveal` past a first delay in its config block, plus the visit's draw and `leaseHeld` (6.12, 2750). A resize retires it beside `dropTransients`, a hidden tab keeps it with its fade-in on the hidden-free clock, and `demandNow`'s `fading` covers its fade-in with one term from `bodies.ts` (2750). 4.2's `LaunchGate` row adds the comet's start rule to "Read by" (246); 5.1's `bodies.ts` and worker rows (332, 335), P12's files and step 1 (3312, 3313) and AC-25 (3450) follow. No regression: the "may a sky event start now" policy now has one definition, and `bodies.ts` reads the gate and `leaseHeld` without `transients.ts` reading anything back (no cycle). |
| SOC10-2 | Yes | `TransientSpec.limit` (2 for farewell meteors) and `TransientSchedule.kindLaunches`, held in step 2.2 beside the narrow limit and counted in step 2.4 (2214, 2221); T6 (303), 5.1 (327), 6.12 (2749) and P12's files and step 1 (3312, 3313) name them. Like `scene`, `room` and `clearSky(body)`, they live in the text and arrive with P12, not in the P8 type sketches; that is consistent. |
| SOC10-3 | Yes | 4.1 puts `sameRects` in the veil column, "moved in P1" (201 to 203); 8.4's row is now "`sameRects`, the imports", with the imports changing "with what each phase reads (5.1)" and P8 dropping the meteor imports, phases P1 to P8 and P12 (3383). I checked the phase range: P9 to P11 and P13 add no worker import (P9 reuses `screenQuietZones`; satellites reach the worker through the registry and `renderSky.ts`; P13's messages are protocol types already imported). |

## Round 10's other changes, through this lens

- **`frameDue` at k = 1** (1114 to 1123): pure policy in `pacing.ts`; the worker's mechanism is unchanged.
- **One field per due kind** (`LaunchGate.field()`'s doc at 2138, step 2.2 at 2214, step 2.3 at 2215, the worker bullet at 2334): the worker still builds the field lazily through the gate, and `room` and the plan share one build. `transients.ts` reads no worker state.
- **`launchesAllowed`** (2333, 2338, 3200, 3208): one launch test, read by the gate's `allowed` and the sleeping timer, now named for every kind.
- **The farewell band** (2749; CA10-1, CA10-2) extends the veil planner only through options (`clearOf`, `starts`), and DRY-R10-2's `planMeteorTransient(context, { clearOf, starts })` keeps the veil's pass order in one function. One side of that fix didn't reach P10 (SOC11-1).
- **The fallback's scaled minimum** (PHY10-1, 2609): the planner owns its minimum and the steer its durations; both read `METEOR.fallbackScale` through the pass's `fallback` flag, so the steer never restates the planner's narrow choice.
- **P13's relay loop** (NJ10-1, 2779, 3324): a main-thread resource, cancelled by `mountSky`'s `destroy`, which owns it.
- **`startArea` unclamped** (CG10-3, 2532, 2591 to 2594): see "Noted, not raised".
- The other changes (PHY10-2 to PHY10-4, CG10-2, DRY-R10-1, C71, C72, the harness and kill-switch wording) carry numbers or wording outside this lens.

## The sweep

- **Imports.** `imports.mjs` finds no runtime cycle among the sketches. Runtime edges: `transients` to `config`, `meteorKind`, `pacing`, `scene` and (P11) `satellites`; `meteorKind` to `config`, `meteors`, `random`; `satellites` to `config`, `gaps`, `quietIndex`, `radiants`, `random`; `quietIndex` and `presence` to `config` and `scene`; `gaps` to `config`. Kind modules import `./transients` as statement-level `import type` (2081, 2679).
- **P12's edges, by the text.** `bodies.ts` reads `nearness` (`catalog`), `DRIFT_REACH` (`camera`), `fadeOutAt` (`pacing`), `zoneReaches` (`quietIndex`), `scrollKept` (`scene`) and `leaseHeld` with the `LaunchGate` type (`transients`); the farewell spec reads `ZONE_REACH` (`quietIndex`). None of those modules imports `bodies.ts` or `meteorKind.ts` back, so no cycle appears.
- **Threads.** The main thread imports only types and `color.ts` from `src/lib/sky`; `skyPause.ts` imports nothing from it (1728); the pause reaches the worker as `motion: 'reduced'`, so no new message carries UI state. The protocol stays the only contract.
- **Veil privates.** No sketch imports `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches`, and `quietEasing` stays in the worker.
- **The worker.** P12 adds six comet touch points (state, pause time, resize retirement, fade-in frames, `bodyShowing`, the hand-off), each a feed or a call into `bodies.ts`; the policy stays pure. 5.2's one-file rule for the orchestrator still holds.

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC11-1 | minor | P10's fireball decision has no channel into `planMeteorTransient` before P12, though 6.12 now places it outside that function |

### SOC11-1 (minor): P10's fireball decision has no channel into `planMeteorTransient` before P12, though 6.12 now places it outside that function

**Section.** P10 (Files, `meteorKind.ts`; the `METEOR_KINDS` doc); 6.9 (`planMeteorTransient` and `METEOR_SPEC`); 5.1 (the `meteorKind.ts` row); 6.12 (the farewell row); P12 (Files per kind).

**Problem.**

- **Where the decision sits now decides P12.** Round 10's DRY-R10-2 fix has the farewell spec call `planMeteorTransient(context, { clearOf, starts })` and states the farewell meteor is "never a fireball, since P10's decision is the meteor spec's" (6.12). That holds only if P10's decision sits around `planMeteorTransient`, since the farewell spec calls that same function.
- **P10 still describes the P8 and P9 shape.**
  - 6.9's `METEOR_SPEC` has `plan: planMeteorTransient`, and `planMeteorTransient(context: PlanContext)` takes one argument.
  - P10's files say only "the meteor spec decides fireballs before planning", yet the decision has to reach the `fireball` option of each `planMeteor` call, and only `planMeteorTransient` makes those calls (the veil's pass order).
  - 5.1 and P12's files date the "optional second argument" to P12.
- **So the P10 implementer must choose, and either choice breaks a statement.**
  - Put the decision inside `planMeteorTransient`, the simplest reading of `plan: planMeteorTransient`: P12's farewell call then inherits fireballs, against 6.12, and P12 has to move P10's code.
  - Or add the second argument in P10: against 5.1 and P12's files.
- **The ordinary fallback has no stated home.** The `METEOR_KINDS` doc promises "if no fireball path fits, an ordinary shooting star flies instead". If the decision step calls `planMeteorTransient` twice (a fireball, then an ordinary one), the first call's failure clears the visit's sky whenever the context allows copy, because `planMeteorTransient` clears it on any failure "unless the context kept it in clear sky (`nearCopy` false)". A fireball flies only in clear sky (cf4d7b8 `meteors.ts:228`), so its failure proves nothing about the sky, by the function's own reasoning. The ordinary plan would then run on a fresh sky, re-picking the visit's shower (RD1) for no cause.
- **Why minor.** P10's own checks pass with either structure. The costs are a P12 refactor and, in the two-call reading, a rare re-pick of the visit's sky (fireballs are 4% of desktop launches, at least 120 s apart).

**Evidence.**

- `PLAN.md`:
  - 2097 to 2106: `planMeteorTransient`'s doc ("When none fits it clears the radiant (P8) or the sky (P9), unless the context kept it in clear sky (`nearCopy` false): that failure proves nothing about the sky") and its one-parameter signature.
  - 2113: `plan: planMeteorTransient`.
  - 328 (5.1): "the fireball decision (P10); the could variants, and farewell meteors' spec through `planMeteorTransient`'s second argument (P12)".
  - 3265 (P10): "the meteor spec decides fireballs before planning: desktop only, at least `after` s since the reveal, at least `spacing` s since the last one (in `MeteorMemory`), and `chance` per launch"; 3270 to 3274 (`METEOR_KINDS` doc): "if no fireball path fits, an ordinary shooting star flies instead"; 3280 (P10's steps).
  - 2585 to 2586 (`PlanOptions.fireball`: "This launch is a fireball: clear sky only") and 2595 to 2596 ("from P10, PlanOptions.fireball replaces PassOptions.fireballs and the per-attempt METEOR.fireballChance draw").
  - 2749 (6.12): "whose `plan` calls `planMeteorTransient(context, { clearOf, starts })`, an optional second argument ...; never a fireball, since P10's decision is the meteor spec's".
  - 2755 (6.12): the could variants are "decided in the meteor spec's one decision step", which "plans them with `nearCopy` false".
  - 3312 (P12's files): "their spec in `meteorKind.ts` (... and `planMeteorTransient`'s optional second argument)".
  - 305 (RD1): a visit's sources stay fixed until a resize or "a launch allowed near copy none of whose steers fits".
- cf4d7b8 `meteors.ts`: `:203` (today's per-attempt fireball draw); `:228` (`if (mayDim && (fireball || !copyAllowed)) continue`: a fireball never comes near copy); `:274-275` (fireballs on the long pass only, desktop only).
- `REVIEW-LOG.md`, "Gate round 10", DRY-R10-2's disposition: "the farewell spec calls `planMeteorTransient(context, { clearOf, starts })`, an optional second argument, and is never a fireball, since P10's decision is the meteor spec's (6.12, 5.1, P12's files)". P10's own text was not changed.

**Fix.** Put the decision step and its channel in P10, where 6.12 already assumes them:

- P10's `meteorKind.ts` line: "`METEOR_SPEC.plan` becomes the meteor spec's decision step around `planMeteorTransient`. It decides fireballs (desktop only, at least `after` s since the reveal, at least `spacing` s since the last one, `chance` per launch) and passes `{ fireball: true }` through `planMeteorTransient`'s optional second argument, added here, which joins its long-flight `planMeteor` calls (fireballs fly long flights only, as today). If that finds nothing, an ordinary shooting star is planned in the same launch. The fireball attempt plans with the context's `nearCopy` false, since a fireball flies only in clear sky, so its failure keeps the visit's sky."
- 5.1's `meteorKind.ts` row: "the fireball decision around `planMeteorTransient`, and its optional second argument (P10); the could variants, and farewell meteors' spec, whose `clearOf` and `starts` join that argument (P12)". In P12's files, the second argument gains `clearOf` and `starts` rather than first appearing there.
- 6.9's `METEOR_SPEC` sketch can stay P8's (`plan: planMeteorTransient`), with a note that P10 wraps it.

## Summary

**Verdict: pass.** No blocking or major finding in this scope.

Round 10's SoC fixes landed:

- the comet's start rule reads the one launch gate, waits a first delay, is retired by a resize and asks for its own fade-in frames;
- farewell meteors' cap has one owner (`TransientSpec.limit`, `kindLaunches`), held beside the narrow limit;
- 4.1 and 8.4 label `sameRects` and the worker's imports as answer 1 does.

Round 10's other changes keep the boundaries. The field is built once per due kind through the gate, and `launchesAllowed` is the one launch test. The farewell band extends the veil planner only through options, and P13's loop is owned and cancelled by `mountSky`. The sketches still have no runtime import cycle, P12's text adds none, and nothing imports a veil private helper.

One cheap minor remains. SOC11-1: P10 should put its fireball decision around `planMeteorTransient` and add the second argument there, as 6.12 now assumes, with the fireball attempt kept in clear sky so its failure leaves the visit's sky alone.

## Noted, not raised

- **Farewell failures re-pick the family's sky.** The farewell spec plans through `planMeteorTransient` with the lease's `nearCopy`, so each null plan in its narrow band (about half of attempts at 2560 × 1440, CA10-2) clears the meteor family's visit sky (2103 to 2104, 2749), which the hero then inherits. Step 2.3 treats the same null plan as proving nothing (2216). I don't raise it: a fresh sky can also help the band find room, the cap bounds it to a couple of re-picks a visit, and the kind is a could.
- **The comet's fade-in clock.** It runs on "`twinkleTime`'s clock" (2750), a hidden-free clock named for its first reader. If the comet reads the frame field, P12 extends `SkyFrame.time`'s and `twinkleTime`'s docs (3069) under 7.0's rule. A naming matter for the conventions lens.
- **The start box's clamp in two places.** With `startArea` unclamped (CG10-3), `max(METEOR.top, y)` lives in `planFlight`'s draw and again in the probes (2532, 2593 to 2594). So "follows the planner if its sampling changes" (2532) now holds for the box only. Low stakes for a usability heuristic.
- **`fading`'s terms.** `FrameState.fading`'s doc names the thin fade (1040), but the `demandNow` sketch's `fading` line (1216) and its phase table (1224 to 1234) carry neither P6's thin-fade term (added at 3147) nor P12's comet term. For the completeness lens.
- **4.1's diagram** lists `bodies.ts (P12)` with the kind modules (199); the comet is a sky body, not a transient kind. Cosmetic.
