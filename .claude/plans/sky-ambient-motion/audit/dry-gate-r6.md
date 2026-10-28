# DRY audit of PLAN.md, gate round 6

## Scope

- **Role.** Auditor, scope "dry", gate round 6. This is one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil now exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself, and over-engineering against "defensive but not over-engineered".
  - Whether round 5's DRY fixes (DRY-R5-1 to DRY-R5-4) landed, and any regression they or the other round-5 fixes caused.
- **Inputs.**
  - `PLAN.md`, the worktree's working copy as read on 2026-10-27: 3,978 lines, 66,331 words (`wc -w`), sha256 prefix `30f28daecd8249f1`. Every `PLAN.md:n` below refers to that snapshot (a copy is in the scratch folder, `dry-gate-r6/PLAN.snapshot.md`).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (the contract, above all "Confirmed veil interface (2026-10-27)"), `research/01-planning-brief.md`, and round 5's `audit/dry-gate-r5.md` with the reviser's dispositions.
  - The worktree code at 246c0aa (`file:line` below) and, read only, the main checkout's uncommitted veil edits, marked "observed".
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY scope. The contract is `COORDINATION.md`, not the main checkout's work in progress.

## Method

1. Read the four required inputs, then `PLAN.md` in full.
2. Word-diffed the round-5 input (`check-r5-completeness/PLAN.snapshot.md`, sha256 `ebd7ff97e238ea6a`, 64,543 words) against this snapshot, so every round-5 edit was read in context.
3. Checked each round-5 DRY disposition against the text (table below), and grepped for stale copies of every fact round 5 changed (`once per tick`, `meteorScrollQuietMs`, `0.3 px`, `/ 2e`, `32 px`, `meteorHeight`, `SATELLITE.speed`, `motionEase`, `state.camera`, `600 lines`).
4. Read the worktree's `sky.worker.ts`, `config.ts`, `meteors.ts` and `scene.ts`, and, read only, the veil's working-tree `sky.worker.ts`, `scene.ts` and `config.ts` diff.
5. Scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r6/`:
   - `fresh-gate.mjs` re-runs round 5's `stale-gate.mjs` scenarios with `gather` inside `demandNow`, as the plan now has it;
   - `ac-map.mjs` cross-checks the two copies of the AC-to-phase mapping (9.2's Phase column and each phase's "Checklist:" line).

## Round 5's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R5-1 | yes | `demandNow` gathers first (`PLAN.md:1218-1224`); `tick` keeps its own `gather` before `updateCamera` (`:913`, `:1285`); "at each frame decision" in 4.2 (`:238`, `:244`), DR2 (`:285`), F6 (`:299`), 5.1 (`:367`), 6.1 (`:815`, `:858`, `:873-880`) and 6.2 (`:947`, `:1049`); the `activity` bullet (`:1680`); 6.2's table defers `gather` to P6 (`:1247`); H13 case 1's hero twin (`:2938`); P6 repeats P4's key-press check (`:3194`). [computed] `fresh-gate.mjs`: after 95 s without input, one `activity` ping now gives vsync frames at once in the reading scene and in the hero, with the ambient level easing 0, 0.5 and 1.0 at 0, 2 and 4 s; three gathers for one `now` give equal gates. Stale copies remain only in the logs (DRY-R6-1). |
| DRY-R5-2 | yes, apart from the size | (1) 8.7 item 4: "wait while a lease holder is active (6.9 step 2.2)" (`:3536`). (2) Section 11 cites `inkBudget(headroom)` and `INK_BUDGET` with no number (`:3683`). (3) D4 cites 6.12 (`:171`); "1 visit in 8 to 10" lives only in 6.12 (`:2782`). (4) 6.1: the parallax values "go at V" (`:499`). (5) `segmentClear`'s scope corrected in 4.2 (`:247`), T3 (`:308`), 6.11 (`:2766`), P11 (`:3334`), PF (`:3382`), I6 (`:3425`) and 8.7 (`:3536`). (6) `Ease`'s doc names only the motion level (`:1088`). The logs grew again (DRY-R6-1). |
| DRY-R5-3 | yes | `TRANSIENTS.scrollQuiet: 1.2` with its doc sentence (`:2260-2272`); `LaunchGate.settled` names it (`:2157`); 6.9's move (`:2279`), the launch gate (`:2358`), 5.1 (`:351`), P8's files and steps 1 and 3 (`:3240`, `:3252-3254`). Its one reader today is `sky.worker.ts:202`, which P8 replaces, and the veil's diff leaves `FRAME.meteorScrollQuietMs` and the moved `METEOR` keys untouched (observed: no hunk in `git diff -- src/lib/sky/config.ts` names them). |
| DRY-R5-4 | yes | The farewell row states the one-gate change and drops the restated rest and gap law (`:2781`); P12's files follow (`:3354`); D4 flags it (`:171`). Under D4's default nothing ships, so the row's sketch is enough. |

The other round-5 fixes add no duplicated rule. The two AC-to-phase mappings agree everywhere (`ac-map.mjs`), apart from P12, which has no "Checklist:" line and names "its acceptance item" instead (`:3357`). No config is shared between the worker and the main thread, and no veil export is re-implemented: `transientFade` calls `scrollKept` (`:2215-2217`), every transient draws through `transientQuietFactor`, `ZONE_REACH` derives from `QUIET_REACH` from V (`:1413-1417`), and the moved `sameRects` takes the veil's `headroom` comparison at V (`:1516`, `:3500`).

## Verdict

**Pass.** No blocking or major finding. Two minor findings, both cheap and clearly right.

## Findings

### DRY-R6-1 (minor): restated facts that disagree with their owner: section 1's file-by-file sentence, and log rows a later round superseded

- **Section.** 1 (veil-session dependency); 4.4; 7.2's note; the Check log (Round 4) and the Audit log.
- **Problem.**
  - (a) Section 1 restates 4.4's file rule and includes P0: on a file-by-file reading, "P0 to P7 and P13 ... start at V". P0 changes nothing in the repository and is the phase that sends CP-0, the question itself. 4.4, which owns the rule, moves only phases that edit the veil's paths and redoes "P0's baselines ... on the rebased tree", so P0 has already run. Round 5's new note in 7.2 excepts P0 too, so section 1 is now the one copy that disagrees.
  - (b) Five log rows restate design facts that a later round replaced, and they now contradict the body:
    - PHY4-4 gives AC-39 and H5 as "0.3 px up to H = 1,440, 2.0 × 10⁻⁴ × H taller ... settled by 1.22 s";
    - PHY4-5 gives "/ 2e (4.6 px at H = 900) ... the per-rate figures ... aren't quoted";
    - DRY-7 says `gather` runs "once per tick";
    - SOC-1 says "one `gather` per tick" and "5.2 adds a worker size guard";
    - DRY-6 says `Ease` and `easeAt` serve "the thin fade".

    The rounds 1 to 3 summary already names the rows that later rounds superseded. Round 4's table and the Audit log don't, so a reader who searches for the guard or the glide bound finds the old rule first. The logs keep growing: 3,683 words now against 3,530 at round 5, in a plan of 66,331 words against 64,543.
- **Evidence.**
  - (a) `PLAN.md:19`: "On that reading P0 to P7 and P13 proceed now; on a file-by-file reading they start at V". `:324` (4.4): "every phase that edits one of their paths starts at V ... P0's baselines are redone on the rebased tree before P1 (8.5 step 4)". `:2977` (7.2): "every "no" above but P0's (and the planet's) becomes "at V"". `:2981-2998`: P0 has "no repository change", and its step 5 sends CP-0.
  - (b) `:3842` (PHY4-4) against `:3613` (AC-39: "2.8 × 10⁻⁴ × H ... settled by 1.2 s (1.3 s at H = 3,840)"). `:3843` (PHY4-5) against `:283` (SP1 quotes 5.1, 4.8 and 4.7 px at 30, 60 and 144 Hz). `:3932` (DRY-7) and `:3945` (SOC-1) against `:858` ("each `tick`, and each `schedule`") and `:389` ("`sky.worker.ts` stays one file"). `:3931` (DRY-6) against `:1088` (`Ease`: "the motion level (P5)") and `:3189` (`thinLevel` is `1 − smoothstep(...)`). `:3813` is the rounds 1 to 3 precedent. Counts: `wc -w` on both snapshots, and the words from "## Check log" to the end.
- **Fix.**
  - (a) Section 1: "On that reading P1 to P7 and P13 proceed now; on a file-by-file reading they start at V (4.4)".
  - (b) Mark the five rows the way `:3813` marks rounds 1 to 3: "(superseded: PHY5-1)" on PHY4-4, "(PHY5-3)" on PHY4-5, "(CG5-1)" on DRY-7 and SOC-1, "(SOC5-6)" on SOC-1's guard, and "(DRY-R5-2)" on DRY-6's `Ease` part. At least, open the Check log with one sentence: "Rows record each round as it was; where a row and the body disagree, the body holds, and a later row names the change".

### DRY-R6-2 (minor): `leanPending` is the one camera gate defined in the worker, and it restates `stepCamera`'s lean test

- **Section.** 6.1 (`stepCamera`, `driftWanted`); 6.2 (`demandNow` and its table); 6.13 (the pointer listener); P7's files; H5.
- **Problem.**
  - 6.1 and 6.2 put every camera gate in pure code, "so every gate has one definition (DRY) ... and the harnesses test the shipped rules". `driftWanted` follows that rule: it lives in `camera.ts`, and H5 table-tests it.
  - Its twin for the lean, `leanPending(scene)` ("full motion, and the lean springs away from `leanTarget(scene)`"), is a worker function. It repeats the comparison `stepCamera` already makes for its `moving` result: `input.follow && (… camera.leanX.value !== input.lean.x || camera.leanY.value !== input.lean.y)`, where `follow` is `motion === 'full'` and `lean` is `leanTarget(scene)` (`updateCamera`).
  - H5's lean cases test only the spring ("95% at 1.19 s, no overshoot"). The worker's copy is reached only through H13's rig.
  - If the two copies drift apart (say a tolerance is added to one), `leanPending` stays true while the camera rests. The camera line then demands `motionFps`' floor, 20 identical frames a second: the failure 6.13 describes for a missing motion test.
- **Evidence.** `PLAN.md:750-752` (`stepCamera`'s `moving`); `:900` (`lean: leanTarget(scene)`); `:1226` and `:1251` (`leanPending` in `demandNow` and the table); `:2828` (6.13: "while `leanPending(scene)` (full motion, and the lean springs away from their target)", and "without it the worker would draw 20 identical frames a second until Play"); `:3215` (P7: `leanPending(scene)` in `sky.worker.ts`); against `:830-833` (`driftWanted` in `camera.ts`), `:858`, `:947` ("Policy (pure, in `src/lib/sky/pacing.ts` and, for the drift, `camera.ts`)") and `:2930` (H5 tables `driftWanted`; its lean cases test the spring only); `:1045-1047` (`motionFps` never falls under `PACING.minFps`).
- **Fix.**
  - `camera.ts` exports the test beside `driftWanted`, for example `leanWanted(camera: Camera, lean: Vec, follow: boolean): boolean`, true under `follow` while either spring is away from `lean`.
  - `stepCamera`'s `moving` uses it for its lean part, and `demandNow`'s camera line reads `leanWanted(camera, leanTarget(scene), motion === 'full')`, with no worker-local `leanPending`.
  - H5's lean cases add its table, including a pause with the springs short of the target, which must give false.
  - 6.2's table row, 6.13 and P7's files take the new name.

## Summary

- Round 5's four DRY fixes landed, and so did the five-place `gather` rewording behind DRY-R5-1, which the round-5 model now confirms: one `activity` ping after an idle sleep restarts frames at once in the reading scene and in the hero (`fresh-gate.mjs`). Nothing in the plan re-implements a veil export, no config is shared between the worker and the main thread, and the two AC-to-phase mappings agree.
- Two minor findings, both cheap:
  - DRY-R6-1: section 1's restatement of the file rule includes P0, and five log rows still state rules a later round replaced (the old glide bound, the reversal bound, "gather once per tick", the dropped size guard, `Ease` serving the thin fade).
  - DRY-R6-2: `leanPending` duplicates `stepCamera`'s lean test in the worker, where H5 can't table it the way it tables `driftWanted`.
- Noted, not raised:
  - The plan is 66,331 words, 1,788 more than at round 5, of which the logs are 3,683. The comet, which D4's default doesn't ship, is now on 33 lines (29 at round 5) and fills a 425-word cell. DRY-R5-2's size remark stands, and its log move needs a role that may write outside `PLAN.md`.
  - `cancelLevel`, P6's `thinLevel` and the comet's box fade each write a one-way `1 − smoothstep` beside `easeAt`. The disposition dropped the thin fade from `Ease`'s doc, an option the round-5 finding offered, so this is not raised again.
