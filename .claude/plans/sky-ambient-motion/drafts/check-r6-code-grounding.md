# Check r6: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 6. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens: code grounding and feasibility. Every existing file, function, type, message and constant it names must exist with that shape in the worktree (`src/` equals master 246c0aa), be an export of COORDINATION.md's "Confirmed veil interface (2026-10-27)" marked as arriving with the veil commit, or be marked new. `PLAN.md` must not import what the veil keeps private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`). Its integration points must work with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol, before and after the veil commit. The AGENTS.md sky import rules must hold for every new or changed file, and no Cache Components API may appear. This round confirms that round 5's four code-grounding fixes (CG5-1 to CG5-4) landed, and looks for regressions from the rest of round 5's revisions (physics, coordination, completeness and the gate audits).
- **Inputs.** `PLAN.md` (3,978 lines, read in full, logs included); `HANDOFF.md`; `COORDINATION.md` (all of it, "Confirmed veil interface" first); `research/00-shared-brief.md` and `research/01-planning-brief.md`; my round-5 report and the reviser's round-5 dispositions; the round-5 input snapshot (`check-r5-completeness/PLAN.snapshot.md`) for a word diff of what round 5 changed; the worktree code; the main checkout's uncommitted veil edits (read only, `git diff` and the current files); TypeScript 6.0.3 and Node 24.14 from the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration in either checkout. Throwaway scripts live in the session scratchpad (`check-r6-cg/`). Never POST to `/api/schedule/book`.

## Method

1. Read the four context files, then `PLAN.md` end to end. Word-diffed it against round 5's input (128 hunks) and listed every change that touches a code name, signature, sketch, phase step or citation.
2. Re-ran the identifier scan (`idents.py`) and the citation scan (`cites.py`) on the current plan and diffed them against round 5's results.
3. Rebuilt the type-check project (`check-r6-cg/tc/`) on the main checkout's **current** veil files (its `scene.ts` changed at 19:29, after round 5), with every config block spliced in from the current plan (including P8's removal of `FRAME.meteorScrollQuietMs` and `METEOR`'s moved keys, `TRANSIENTS.scrollQuiet`, `SKY_WINDOW.meteorHeightKm` and `earthRadiusKm`, `SATELLITE.angular`), `camera.ts`, `pacing.ts`, `presence.ts` and `quietIndex.ts` regenerated verbatim from the plan's code blocks, the two-kind `transients.ts` with `createMeteorMemory`, `meteorKind.ts`, `satellites.ts` with its new imports, a new `radiants.ts` with the sketch's import line (`startArea` plus types), `Course`, `Steer` and `startArea` added to `meteors.ts`, and a worker harness (`workerSketch.ts`) into which 6.1's "worker side" block and 6.2's `demandNow` block are pasted verbatim. Ran TypeScript 6.0.3 with the repository's options.
4. Loaded every new module under Node 24.14 type stripping with the plan's 7.1 hook (load order, temporal dead zone).
5. Replayed CG5-1's case on the pasted worker code (`h-gather.ts`), and re-ran H3's identity against the veil's current `scene.ts` (`h3-quick.ts`).
6. Walked every phase's numbered steps for "each green" (7.0) at step granularity.

## Verdict: pass

No blocking or major finding. Round 5's four code-grounding fixes all landed and hold under compilation and replay. Two minor, cheap step-level slips remain (CG6-1, CG6-2).

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG6-1 | minor | P9 steps 1 and 2; 6.10 "The steer at a start point" | `radiants.ts` lands in step 1, but its `visitSteer` reads `METEOR.fallbackScale`, which step 2 adds: step 1 fails type-check (TS2339) |
| CG6-2 | minor | P8 files and steps; 6.9 "Changes to `METEOR`" | P8 moves `narrowLimit` out of `METEOR` but leaves the narrow block's doc naming it (`config.ts:283`) until P9 rewrites that doc |

## Round-5 fixes in this lens: verified

| Round-5 ID | Landed? | Where, and how checked |
|---|---|---|
| CG5-1 (major) | yes | `demandNow` now calls `gather(now, scene)` first (6.2 sketch, line 1224), and 6.1's text and `gather`'s doc say every frame decision gathers (tick before `updateCamera`, `demandNow` for `schedule`). "Once per tick" is gone from 4.2, DR2, F6, 5.1, 6.1, 6.2 and 6.6. 6.2's phase table defers `gather` to P6, so P3 to P5 compute the twinkle gate inline. [computed, `h-gather.ts` on the plan's 6.1 and 6.2 blocks pasted verbatim, with the real `camera.ts`, `pacing.ts`, `presence.ts` and `scene.ts`] Last tick 95 s after the last input: `{ fps: 0 }`, gate off. One `activity` ping at 100 s, then `schedule`: reading scene `{ fps: 20, vsync: true, cap: Infinity }`, hero `{ fps: 20, vsync: true, cap: Infinity }`, gate on, level 0.000 (so the drift and twinkle ease in from 0). H13 case 1's hero twin and P6's repeat of P4's key-press check are in place. `gather` is idempotent for one `now`: nothing between tick's call and `demandNow`'s (the `easeEnded` check, `updateCamera`) writes what it reads. |
| CG5-2 (minor) | yes | 5.2: "`radiants.ts` imports `startArea` and types ... from `meteors.ts`"; the sketch's line is `import { startArea, type Course, type MeteorField, type Point, type Steer } from './meteors'`; P9 step 1 now adds `startArea`. Compiles, and `radiants.ts` and `satellites.ts` (which imports `skyWindow` from it) load under Node type stripping with no cycle (`meteors.ts` never imports `radiants.ts`). |
| CG5-3 (minor) | yes | 6.9 "`parallaxScroll` retires" names its three writers and `init`'s chained assignment becoming `scrollY = message.scrollY` (`:420`); P8's files and step 4 say the same. |
| CG5-4 (minor) | yes | `bodies.ts` is in 4.1's diagram (line 207), 4.2 (`SkyBody`, line 260), 5.1 (line 364) and 5.2 (line 382). The `transients.ts` row lists P12 and the worker row "P1 to P13" with `cometShowing` (P12). 6.2's table has rows for `gather`, `driftTarget` in the speed line (`0`), the cap line (`Infinity`) and `easing(layoutAt, ...)` (today's inline test until P5). P9's `transients.ts` line was dropped instead of adding P9 to the row, which is right: P8's `revealTransients` already starts the cooldown. |

## Round 5's other revisions: checked in this lens, consistent

- **Renames (CONV5-2, CONV5-3, DRY-R5-3).** No stale `motionEase` as the worker's variable (only `FRAME.motionEase`, line 1705), no `FrameState.camera`, no `SATELLITE.speed`, no `SKY_WINDOW.meteorHeight` or `earthRadius`. `TRANSIENTS.scrollQuiet` (1.2 s) replaces `FRAME.meteorScrollQuietMs`, whose only reader is `sky.worker.ts:202` (worktree) and `:222` (veil working tree), both inside the `updateMeteor` P8 replaces. With P8's removals spliced, the whole project compiles: nothing else reads the moved keys.
- **`createMeteorMemory` (SOC5-4).** `transients.ts` imports it as a value from `meteorKind.ts`, which imports only types back (statement-level `import type`), so no cycle and no load-order error under Node.
- **Satellite imports (SOC5-2).** `METEOR`, `skyWindow` and `between` compile and load; `skyWindow` comes from `radiants.ts`, which never imports `transients.ts`, so 5.2's temporal-dead-zone argument holds.
- **The comet (CA5-3) and farewell meteors (DRY-R5-4).** Both stay P12 prose; `scrollKept(launchScrollY, scrollY, boxFade)` matches the confirmed signature (`fade = 1`), and `LaunchGate.allowed`'s doc (6.9) matches the farewell row's statement that the gate holds every kind outside the hero.
- **H13 case 0 (SOC5-5).** Feasible on the 7.1 rig: P2's worker draws every refresh while `cameraMoving` (its `frameMode` returns `'active'`), P3's step 2 keeps that (no divisor yet), and twinkle and fade timers map one to one (`frameDue`'s timer branch is today's `now - lastDrawAt >= interval - 4`). Step 3's "glide's divided tail excepted" is the only difference.
- **Lean pacing (PHY5-2).** 6.13's "frames follow the lean's speed" is what the sketch does: `cameraSpeed` includes `LEAN.reach × |lean velocity|`, and `cameraCap` applies the drift's caps while `leanPending`. P7's "the drift's divisor returns within 0.5 s" is `stepDivisor`'s `PACING.slowDownAfter`.
- **`frameAt` overlap (CA5-2, C46).** 8.6's row (`snap`, `offset`, `twinkleTime`, `thinFrom`, `thinLevel`, the `keep` line) matches 5.1's `renderSky.ts` row and P1, P2, P4 and P6's files.
- **Citations.** The scan finds 82 explicit `file:line` citations; the only new one, `config.ts:215-216`, is `meteorScrollQuietMs` and its doc. The new short forms (`:420`, `:202`) match. Every other citation matched in round 5 and is unchanged.
- **Names.** The identifier scan's only new unresolved names are `boxFade` and `cometShowing`, both introduced in prose as P12's (6.12, P12's files). `settleMotion` (a stale name) no longer appears.
- **Private helpers and Cache Components.** No `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches` import (the last appears only as "kept private"); no `'use cache'`, `cacheLife`, `cacheTag`, `cacheComponents` or `instant` API.
- **Import boundaries (AGENTS.md).** Every new `src/lib/sky` file imports only siblings by relative path; worker files import `@/lib/sky/*` by file; `mountSky.ts` keeps to types and `@/lib/sky/color`; `skyPause.ts` imports only `@/lib/utils`; `SkyPauseButton.tsx`'s barrel imports run only on `/` (`Navbar` is used only by `src/app/page.tsx`).

## Findings

### CG6-1 (minor): P9 step 1 lands `radiants.ts`, whose steer needs `METEOR.fallbackScale`, which only step 2 adds

- **Section.** P9 step 1 (line 3280) and step 2 (line 3281); 6.10 "The steer at a start point", item 5 (line 2563); 6.10's removal list (line 2471: "P9 adds `METEOR.fallbackScale: 0.64`", with I2).
- **Problem.** Step 1 adds "`radiants.ts` and `gaussian`", and 5.1 lists `visitSteer` among `radiants.ts`'s exports. `visitSteer`'s closure scales the class's durations on the fallback pass: "On the planner's fallback pass it is scaled by `METEOR.fallbackScale`" (the `Steer` signature carries the `fallback` flag for exactly that). But `METEOR.fallbackScale` arrives in step 2 ("the old radiant, angle, speed, duration and peak keys removed and `METEOR.fallbackScale` added"). So step 1 fails type-check, against 7.0's "one commit per numbered step, each green". It is the same class of slip as CG5-2, one key over.
- **Evidence.** [computed, `check-r6-cg/tc-p9s1/`: the full P9 project with only `METEOR.fallbackScale` removed, TypeScript 6.0.3] `src/lib/sky/radiants.ts(64,35): error TS2339: Property 'fallbackScale' does not exist on type '{ readonly firstDelay: ...; readonly trainSpeedShare: 1; }'`. With the key present (`tc/`), the project compiles with no error.
- **Fix.** Add `METEOR.fallbackScale` (0.64, with its doc "The fallback pass flies each speed class's durations times this") to P9 step 1; it is additive, and step 2 still removes the old duration keys. Or move `visitSteer` to step 2, where H8's launch parts first exercise it (H8's sky parts in step 1 test only `pickVisitSky`).

### CG6-2 (minor): P8 moves `narrowLimit` out of `METEOR` but leaves the narrow block's doc naming it

- **Section.** 6.9 "Changes to `METEOR` in P8 and P9" (line 2279); P8's files (line 3240) and steps 1 and 3 (lines 3252, 3254); 6.10's inner-doc rewrite of the narrow block (line 2479), which lands in P9.
- **Problem.** The narrow block's doc in `METEOR` ends with "`narrowLimit` per visit", and P8 moves `narrowLimit` into `TRANSIENTS`. P8's edits list no doc change there, and P9 rewrites that doc only later ("Narrow screens: paths at least `narrowMinPath` px and at most `narrowMaxPathShare` of the width."). Between P8 and P9 the committed doc names a key its block no longer has. The other moved keys carry their own inline docs, so only this shared doc goes stale.
- **Evidence.** Worktree `config.ts:283`: "Narrow screens: slower flights and their fallback, at least `narrowMinPath` px and at most `narrowMaxPathShare` of the width, `narrowLimit` per visit." and `:289`: `narrowLimit: 2`. The veil commit keeps both lines as they are (main checkout `config.ts:299` and `:305`).
- **Fix.** In P8 step 3 (where `METEOR`'s moved keys are removed), drop ", `narrowLimit` per visit" from that doc; P9 then rewrites the rest as planned.

## Observation (no finding): the veil's working tree moved since round 5

The main checkout's `scene.ts` (modified 19:29) now gives `QuietBlend` an optional `next` (the zones of a layout waiting for the running ease), and `transientQuietFactor` also takes the minimum with `quietFactor(blend.next, ...)`. This is not in the confirmed interface. It breaks nothing in the plan:

- `quietIndex.ts` builds its tile blends as `{ from, to, level }`, which still type-checks with `next` optional, and stars read `easedQuietFactor`, which ignores `next`. [computed, `h3-quick.ts`] Against the current `scene.ts`, 960,000 lookups (1440 × 900, 390 × 844, 3840 × 2160; 31 and 64 rects with random `headroom`; settled and level 0.37; the three layers' keeps and `budgetKeeps(0.5, METEOR_VEIL.quietKeep)`) give `Object.is` equality in every case.
- Satellites and the comet draw through `transientQuietFactor(frame.quiet, ...)`, so a waiting layout's rects now protect them from the frame the layout arrives. T3's, 6.11's and AC-24's "a layout that arrives mid-ease waits up to `QUIET.ease`" stays true, only more conservative than needed.

8.5 step 2 (recheck observed names and port every line the landed commit adds to functions we rewrote) and step 4 (type-check and H3 on the rebased tree) already cover it at V. If the landed `next` is required rather than optional, the index's tile literal needs `next: undefined`, which that type-check would flag.

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r6-cg/` (not in the repository):

- `PLAN.r6.md`, `r5-wdiff.txt`, `r5-changes.txt`: the snapshot checked and round 5's word diff.
- `tc/`: the full type-check project (veil files as of 19:29, every config block, two kinds, `radiants.ts`, the worker harness with 6.1 and 6.2 pasted verbatim), clean under TypeScript 6.0.3. `tc-p9s1/`: the same without `METEOR.fallbackScale` (CG6-1).
- `splice_config.py`, `blocks/`: the config splice and the plan's code blocks.
- `register-hooks.mjs` (the plan's 7.1 hook) and `load-*.mjs`: every new module loads under Node 24.14.
- `h-gather.ts`: CG5-1's replay on the pasted worker code. `h3-quick.ts`: H3's identity against the current veil `scene.ts`.
- `idents.py`, `cites.py`, `idents-r6.txt`, `cites-r6.txt`: the name and citation scans.

## Summary

Round 5's code-grounding fixes all landed. The decisive one, CG5-1, now holds on the plan's own code: with `gather` inside `demandNow`, one `activity` ping after an idle sleep asks for frames at once in the reading scene and the hero, with the levels easing in from 0. The reconciled design still compiles end to end against the veil's current working tree (which has moved since round 5, harmlessly), loads in any order under Node, keeps the quiet index exact, imports nothing the veil keeps private, follows the AGENTS.md import rules and uses no Cache Components API.

Two minor step-level slips remain, each a one-line fix: P9 step 1 needs `METEOR.fallbackScale` (or `visitSteer` moves to step 2), and P8 should drop the stale `narrowLimit` clause from `METEOR`'s narrow-block doc.
