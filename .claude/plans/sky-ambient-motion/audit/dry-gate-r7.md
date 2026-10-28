# DRY audit of PLAN.md, gate round 7

## Scope

- **Role.** Auditor, scope "dry", gate round 7. This is one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself, and over-engineering against "defensive but not over-engineered".
  - Whether round 6's DRY fixes (DRY-R6-1, DRY-R6-2) landed, and any regression they or the other round-6 fixes caused.
- **Inputs.**
  - `PLAN.md`, the worktree's working copy as read on 2026-10-27: 3,819 lines, 63,815 words (`wc -w`), sha256 prefix `3608510232f8622f`. Every `PLAN.md:n` below refers to that snapshot (a copy is in the scratch folder, `dry-gate-r7/PLAN.snapshot.md`).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (the contract, above all "Confirmed veil interface (2026-10-27)"; it has no "Answers to the planning session's questions" section yet, so the five questions stay open), `research/01-planning-brief.md`, round 6's `audit/dry-gate-r6.md`, and `REVIEW-LOG.md` (its round-6 rows and the moved logs).
  - The worktree code at 246c0aa (`file:line` below) and, read only, the main checkout's uncommitted veil edits, marked "observed".
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY scope. The contract is `COORDINATION.md`, not the main checkout's work in progress.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then `REVIEW-LOG.md`.
2. Word-diffed round 6's input (`dry-gate-r6/PLAN.snapshot.md`, sha256 `30f28daecd8249f1`: 66,331 words with the logs, 62,648 without) against this snapshot (`dry-gate-r7/r6-to-r7.wdiff`), so every round-6 edit was read in context.
3. Checked DRY-R6-1 and DRY-R6-2 against `PLAN.md` and `REVIEW-LOG.md`, and grepped for stale copies of every name round 6 changed (`leanPending`, `narrow:` in the specs, `frameState.transients`, `meteorScrollQuietMs`, "once per tick").
4. Listed every copy of each fact a round-6 fix changed (the file-by-file rule, our pre-V `frameAt` edits, the farewell kind's files, the fades over `TRANSIENTS.cancelFade`) and compared each copy with its owner.
5. Scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r7/`:
   - `ac-map.mjs` (round 6's) cross-checks 9.2's Phase column against each phase's "Checklist:" line;
   - `h-map.mjs` (new) cross-checks 7.1's harness Phase column against the harnesses each phase's section names.
6. Read the worktree's `sky.worker.ts` (`twinkleLevel` `:97-99`, `frameAt` `:246-267`, `resize` `:362-381`) and, read only, the veil's working-tree diff of `scene.ts`, `config.ts` and `sky.worker.ts`.

## Round 6's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R6-1 | yes | (a) Section 1: "On that reading P1 to P7 and P13 proceed now" (`PLAN.md:20`). (b) The logs moved to `REVIEW-LOG.md`, whose Check log opens with the rule that the body holds (`REVIEW-LOG.md:7`); PHY4-4 (`:40`), PHY4-5 (`:41`), DRY-6 (`:148`), DRY-7 (`:149`) and SOC-1 (`:162`) name what superseded them, and PHY5-1 names PHY6-1 (`:72`). `PLAN.md:16` states the same rule. One pointer in the plan still names the moved log (DRY-R7-1 (d)). |
| DRY-R6-2 | yes | `leanWanted(camera, lean, follow)` in `camera.ts` (`PLAN.md:844-850`), used by `stepCamera` (`:751`) and `demandNow` (`:1234`); 5.1 (`:355`), "What lands when" (`:858`), 6.2's table (`:1259`), 6.13 (`:2837`), P7's files and steps (`:3222`, `:3225`, `:3227`, `:3229`), H5's lean table (`:2940`) and H13's case 5 (`:2948`). No `leanPending` remains. |

The other round-6 fixes leave no stale copy of what they renamed or retuned: `transientDemand` and `phones` (CONV6-3), the `scrollQuiet` conversion written once (`:2366`, PHY6-3), `METEOR.fallbackScale` in P9 step 1 (CG6-1), the narrow block's doc (CG6-2, C51), `LAYER_NEARNESS` (CONV6-4), and AC-4, AC-20, AC-39, H5 and H9 (PHY6-1, PHY6-2, PHY6-4), whose numbers agree with 6.1's table and 2.1. `ac-map.mjs` finds the same three as round 6 (P12 has no "Checklist:" line and names "its acceptance item" instead). `h-map.mjs` finds the harness map consistent, apart from three mentions that use a harness without running it (P0 records H2's baseline, P6 reads H6's medians, PF names H7's oracle).

Still true: no config is shared between the worker and the main thread (the activity interval, the event list and `LEAN_POINTER_QUERY` live in `mountSky.ts`; no hover or fine-pointer query exists elsewhere in `src/`), and no veil export is re-implemented. `transientFade` calls `scrollKept` (`:2219-2225`); every transient and the comet draw through `transientQuietFactor`; `ZONE_REACH` derives from `QUIET_REACH` at V (`:1420-1425`, `:3492`); the moved `sameRects` takes the veil's `headroom` comparison (`:1524`, `:3510`); section 11 cites `inkBudget(headroom)` and `INK_BUDGET` with no number (`:3695`); `CLEAR_SKY_KEEPS` is a plain numeric keeps object, not a copy of `budgetKeeps`.

Four round-6 fixes didn't reach every copy of what they changed; the findings below name them.

## Verdict

**Pass.** No blocking or major finding. Three minor findings, each cheap and clearly right.

## Findings

### DRY-R7-1 (minor): lists that restate a phase's edits missed round 6's additions

- **Section.** 8.6 and 8.4 (CP-0's message); 8.1; 5.1; 6.12's farewell row and P12's files; 1.1's intro.
- **Problem.**
  - (a) SOC6-1 made `frameAt` call `gather(now, scene)` from P6 (6.1, P6's files). Round 5's CA5-2 made 8.6's `frameAt` row and CP-0's message the complete list of our pre-V `frameAt` edits, the overlap the veil session is asked to agree to. Neither names `gather`, so CP-0 asks for a yes to an overlap one edit short.
  - (b) SOC6-2 gave farewell meteors their own registry entry. 6.12 says the gate's scene comes "from `SceneLevels.launches`, which then names it" and that "each spec names its own (`TransientSpec.scene`: the hero for meteors and satellites)". But P12's farewell files and 5.1's `scene.ts` row (phases P1, P6, P7, P8) never name `scene.ts`, and P12's files don't name the existing specs' `scene` (`METEOR_SPEC`, `SATELLITE_SPEC`). The same row's "T6, H7 and AC-20 then name the exception" lost its "then", while only T6 names it: H7 still says "none ... past 0.4 viewport heights", and AC-20 says nothing of it.
  - (c) 8.1's `frameAt` row says "`twinkleLevel` keeps its name (P4 and P5 change its body)". P6 changes it too (`scene.twinkle × driftGate.level`, 6.6), and that is the change that needs a fresh `gather`.
  - (d) 1.1's intro still points to "the check log", which moved to `REVIEW-LOG.md`.
- **Evidence.**
  - (a) `PLAN.md:922` ("From P6 it first calls `gather(now, scene)`"), `:3188` (P6: "`gather` (called by `tick`, `demandNow` and `frameAt`, 6.1)"), against `:3505` (8.6: "`snap` (P1, P2), `offset` (P2), `twinkleTime` (P4), `thinFrom`, `thinLevel` and the `keep` line (P6)") and `:3448` (CP-0: "we add `snap` and the camera's `offset`, then `twinkleTime`, and the thinning fade's `thinFrom` and `thinLevel` with its `keep` line"). `REVIEW-LOG.md:81` (CA5-2: "CP-0 and 8.6 list every pre-V `frameAt` edit (P1, P2, P4, P6)"), `:209` (SOC6-1). `:3500` (8.6: "This is the one list of what both plans touch").
  - (b) `:2790` against `:3364` (P12: "the scene in the worker's `launchGate`", no `scene.ts`) and `:354` (5.1's `scene.ts` row); `:2142-2155` and `:2757-2766` (the two specs, no `scene`); `:312` (T6 names the exception), `:2942` (H7), `:3606` (AC-20); round 6's input, `dry-gate-r6/PLAN.snapshot.md:2781` ("T6, H7 and AC-20 then name the exception").
  - (c) `:3409` against `:1664` ("from P6 `scene.twinkle × driftGate.level`") and `:922`.
  - (d) `:50` ("came from a check round (the check log)"); `:16` and `REVIEW-LOG.md:3`.
- **Fix.**
  - (a) 8.6's `frameAt` "Ours" cell adds "`gather` first (P6)", and CP-0's message adds "and, from the drift phase, a `gather` call before the twinkle". Or, for a smaller overlap: `twinkleLevel(now)`, which is ours and which their `frameAt` only calls by name (8.1), calls `gather` first itself, since it is the one reader there ("everything that reads them calls it first"); `frameAt`'s body then stays as CP-0 lists it, and `gather`'s doc, 6.1's bullet, P6's files and H13's case 6 name `twinkleLevel`.
  - (b) P12's farewell files add `scene.ts` (`SceneLevels.launches` names the scene in `sceneAt`) and `scene: 'hero'` in `METEOR_SPEC` (`meteorKind.ts`) and `SATELLITE_SPEC` (`satellites.ts`), or make `TransientSpec.scene` optional with the hero as its default; 5.1's `scene.ts` row adds P12; the row says "then name the exception" again (or H7 and AC-20 gain "farewell meteors excepted, if D4 picks them").
  - (c) "(P4, P5 and P6 change its body)".
  - (d) "(`REVIEW-LOG.md`)".

### DRY-R7-2 (minor): the file-by-file rule is restated in 15 places, and CP-0's exit missed round 6's PF clause

- **Section.** 8.2 (CP-0); 4.4, which owns the rule; the restatements.
- **Problem.** 4.4 owns the consequence of a file-by-file answer: every phase that edits a veil path "starts at V, or after PF if D10 picks it". Round 6 (CA6-1, C53) added the PF clause to 11 copies, but CP-0's exit cell still says "On a file-by-file reading those phases start at V (4.4)". It is the second round running in which one copy of this rule lagged its owner: round 6's DRY-R6-1 (a) found section 1 naming P0. Each change to the rule now means editing about a dozen sentences.
- **Evidence.** `PLAN.md:325` (4.4) against `:3417` (CP-0's exit). The other copies: `:20` (section 1), `:178` (D10), `:341` (4.4's overlaps), `:2859` (7.0), `:2987` (7.2's note), `:3013` (P1), `:3145` (P5), `:3241` (checkpoint V), `:3393` (PF step 4), `:3421` (CP-4), `:3490` (8.5 step 4), `:3554` (8.7), `:3711` (R-1). `REVIEW-LOG.md:102` (CA6-1's list of places, which leaves out CP-0).
- **Fix.** CP-0's exit: "On a file-by-file reading those phases wait as 4.4 says." Keep the full rule only in 4.4; where another copy only restates it (section 1, 7.0, R-1), cite "(4.4)" in place of the clause, so the next change edits one place. Copies that add a phase-specific consequence (P1's redone baselines, 8.7's order) keep it.

### DRY-R7-3 (minor): the comet's pause and box fades re-implement `cancelLevel`'s ramp

- **Section.** 6.12 (the comet row); 6.9 (`cancelLevel`, "The pause fade"); P12's files; AC-25.
- **Problem.**
  - CA6-2 gave the comet a pause fade "over `TRANSIENTS.cancelFade`, as `cancelLevel` fades transients", beside its box fade, also over `cancelFade`; both live in `bodies.ts`.
  - `cancelLevel(transient, now)` takes a `Transient` and reads `transient.cancelledAt`, and the comet is a `SkyBody`, so `bodies.ts` must write `1 − smoothstep(at, at + TRANSIENTS.cancelFade, now)` twice more: three copies of one ramp in two modules, two of them new in round 6's revision.
  - 6.9 still says "`cancelFade` (0.2 s, R2's limit) is the pause's fade only", which the comet's box fade contradicts (DRY-10's disposition kept that fade on `cancelFade`).
- **Evidence.** `PLAN.md:2214-2217` (`cancelLevel`); `:2791` ("Its box fade and its pause fade (from a pause or a switch to reduced motion, over `TRANSIENTS.cancelFade`, as `cancelLevel` fades transients), both one-way, go in as `fade`"; "with a `TRANSIENTS.cancelFade` fade when that fails"); `:3364` (P12: "its fades: fade-in, box and pause"); `:3611` (AC-25); `:2290`. `REVIEW-LOG.md:103` (CA6-2), `:152` (DRY-10: "the box fade keeps `cancelFade`").
- **Fix.** One owner. `cancelLevel` takes the time its fade began: `cancelLevel(since: number | null, now: number): number`, 1 while `since` is null, then `1 − smoothstep(since, since + TRANSIENTS.cancelFade, now)`. `transientFade` passes `transient.cancelledAt`, and `bodies.ts` calls it for the comet's pause fade and its box fade. 5.2 allows that import ("or each other"), and nothing `transients.ts` loads imports `bodies.ts`, so it adds no cycle. 6.9's sentence becomes "the pause's fade (and, if P12 builds the comet, its box fade), never a scroll distance". (If P6's `thinLevel` should share the ramp too, the owner can instead be a one-way `fadeOut(since, duration, t)` in `pacing.ts`, beside `easeAt`.)

## Summary

- Round 6's two DRY fixes landed: section 1 names P1 to P7, the logs sit in `REVIEW-LOG.md` with superseded rows marked, and `leanWanted` is the one lean test, shared by `stepCamera` and `demandNow` and tabled by H5. Nothing re-implements a veil export, no config is shared between the worker and the main thread, and the AC and harness maps agree with the phases.
- Three minor findings, each cheap:
  - DRY-R7-1: four lists didn't take round 6's additions: `gather` in `frameAt` is missing from 8.6 and CP-0's message (the complete list CA5-2 set up); the farewell kind's `scene.ts` and spec edits are missing from P12's files and 5.1, and its "then" went missing; 8.1 omits P6's `twinkleLevel` change; 1.1 points to the moved check log.
  - DRY-R7-2: the file-by-file rule has 15 copies, and CP-0's exit lacks the PF clause the other copies gained.
  - DRY-R7-3: the comet's pause and box fades restate `cancelLevel`, and 6.9's "pause's fade only" contradicts the box fade.
- Noted, not raised:
  - The plan body grew by 1,167 words in round 6's revision (62,648 to 63,815), even though the logs moved out. The farewell row went from 115 to 200 words and the comet row from 425 to 458, for two "could" kinds that D4's default doesn't ship. DRY-R5-2's size remark stands.
  - `demandNow` passes `leanWanted` the same `leanTarget(scene)` and `motion === 'full'` that `updateCamera` builds into `CameraInput` (`:900-907`, `:1234`): two builders of the lean input. Two short expressions don't warrant a finding.
  - Observed: the veil's working tree adds a worker-local `quietEasing(t)` (`layoutAt !== null && t - layoutAt < QUIET.ease`) and calls it in `frameMode`, `settleQuiet`, the `layout` case and `rebuildHaze`. Our `fading` line writes the same test as `easing(layoutAt, QUIET.ease, t)` (6.2's table, P5). If it lands, 8.6's `frameMode` rule ("port any reason, call or condition the landed commit adds there") points the `fading` line at it; 8.5 step 2's list of observed names could add it.
  - 6.12 says the farewell kind is "planned by `planMeteor`". When D4 picks it, its spec should reuse the meteor kind's planner rather than wrap `planMeteor` in a second steer loop, or the port of `planLaunch` would exist twice.
  - The veil's `SCROLL_CANCEL` distances (12 and 24 px) are restated in prose in about a dozen places. 8.5 step 5 rechecks the values at V, so they stay pinned to the confirmed interface.
