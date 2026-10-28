# Check round 10: completeness and implementability

## Scope

- **Role.** Adversarial checker, lens "completeness", round 10 (the third round on the plan restructured to build on cf4d7b8). Planning only: this file is my one output. Nothing in `src/`, configuration, `PLAN.md`, `REVIEW-LOG.md`, `harness/` or any other file was edited, in any checkout.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree"), `PLAN.md` (all 3,655 lines), `REVIEW-LOG.md` (rounds 1 to 9, the post-commit restructure, gate rounds 5 to 9), my round-9 report (`drafts/check-r9-completeness.md`), the round-10 gate audits already written (`audit/dry-gate-r10.md`, `audit/separation-of-concerns-gate-r10.md`, `audit/nextjs-docs-gate-r10.md`, read only to avoid duplicates), the archived harness (`harness/veil-confirm-final-1.tar.gz`, extracted fresh into my scratchpad) and `harness/README.md`, and the code at cf4d7b8 (`.claude/worktrees/sky-baseline-cf4d7b8`).
- **Questions.** Did round 9's four fixes in this lens (C67 to C70) land, and did they regress anything? Is every brief section present and substantive, every settled default followed or its deviation justified, every decision given a default and alternatives, every new config constant given a value, units and a doc comment, and every phase given a goal, files, steps, a visible-change statement, verification, rollback and a blocked mark? Could a session on another model build P0 and P1 without re-deriving anything? What stale or cuttable text is left?
- **Limits.** Physics, Next.js docs, conventions, DRY and separation of concerns belong to other reviewers; I raise a number or a rule only where a missing or wrong one changes what gets built, measured or reported. Findings another lens already raised this round are listed under "Not raised".

## Method

- Read every input above, then `PLAN.md` end to end.
- Restructure leftovers: grepped for `PF`, `CP-0`, `CP-3` to `CP-5`, `8.5` to `8.7`, `D10`, `D11`, `R-1`, `R-2`, checkpoint V, "rebase", "observed", "decline", "file rule", "hotspot", "working tree" and `246c0aa`. Only history that belongs there remains (section 3's note on the missing D10 and D11, 8.1's parent SHA).
- Citations: listed the 147 explicit `file:line` citations and re-read every one into `src/lib/sky/*` and `src/components/sky/*` against cf4d7b8, plus `Navbar.tsx`, `SidePane.tsx`, `IntroGate.tsx`, `globals.css`, `components/styles.ts`, `animations.ts`, `Card.tsx`, `not-found.tsx`, `README.md:75`, `:80` and `AGENTS.md:20`. All hold.
- Brief compliance: walked the 13 required sections, every settled default in `01-planning-brief.md` against the plan and deviations 1 to 14, D1 to D9 and D12, every new config block and module constant, and the seven required parts of P0 to P13. I also cross-checked the Phase columns of H1 to H13, AC-1 to AC-41 and B-1 to B-10 against each phase's verification list.
- P0 and P1 walk: the harness rig, H1 to H3, the phased atlas (layout and size), `placePoint`, the quiet index, the stamp cache, the worker's `sameRects` import and the step order against cf4d7b8.
- P9's archive adaptation: walked it against the extracted archive (`transpile.mjs`, `lib.mjs`, `sim2.mjs`, `check11/render3-canvas.mjs`, `live/alib.mjs`) and checked which absolute paths it names still exist on this machine.
- Scratch scripts, run on Node 24 with 7.1's resolve hook against cf4d7b8, all in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r10-completeness/scripts/`:
  - `h2-smoke.ts`: P0's rig as 7.1 describes it loads cf4d7b8's `skyAssets.ts` and `renderSky.ts` and records one `drawSky` (338 star `drawImage` calls at 1440 x 900, DPR 2). The stub also needs `transferToImageBitmap`, which 7.1 leaves implicit.
  - `firstminute.mjs`: P9's first minute after the reveal (for AC-20 and H9).
  - `clearsky.ts`, `anyfit.ts`: cf4d7b8's planner on the nine archived layouts with `nearCopy: false` and with copy allowed, one radiant and the worker's radiant policy (for H8's bar and the cooldown's clear-sky plans).

## Round 9's fixes in this scope

| ID | Verdict | Where it landed |
|---|---|---|
| C67 | Landed | P9's bullet runs the proto tree only (`TREES=proto`, `sim2.mjs`'s base rows dropped) and takes the GPU rows from `check11/render3-canvas.mjs` at `FLIGHTS=200` with `SEED` 0 to 2, never from `render3.mjs`. It sets the fresh `PlanContext`'s `narrow` as `sim2.mjs:27` does and reports each share per launch attempt. Checked against the archive: `sim2.mjs:23-24`, `:27`, `:28`; `render3-canvas.mjs:16-19`, `:132`, `:136`; `live/alib.mjs:8`, `:12`, `:17`. One gap came in with C70's wording (C72). |
| C68 | Landed | H8 has its acceptance bar (with `nearCopy` true, under 5% of launches failing every steer on each desktop layout, at most 32.5% on 390 x 844). H9 runs 20,000 visits per layout, and P9 step 3 commits "the value 6.9's rule gives from H9, searched from 55 s". No regression: P9's files ("the verification below sets it"), deviation 11, 2.1, the `TRANSIENTS` doc and R-10 agree. The bar looks reachable: cf4d7b8's own worker policy (fresh radiants, long then short) fits a path on 99.8 to 100% of launches on every desktop layout and 65.8% on the phone [computed, `anyfit.ts`]. |
| C69 | Landed | Section 6's intro states the mirror rule with P1's `SHAPE_COUNT` and `STAR_SHAPES`, P3's `FrameMode` and P8's meteor imports; P1's `renderSky.ts` bullet, 5.1 and 8.4 name P1's case. At cf4d7b8, after P8 the worker reads no `METEOR`, `meteors.ts`, `between`, `scrollKept` or `drawMeteor` import. P9's `DEG` in `meteors.ts`, read only by the lines I2 replaces (`:209`, `:212`), falls under the general rule. |
| C70 | Landed on `PLAN.md`'s side | `harness/README.md` is unchanged since 3b57f0b: it still cites "`PLAN.md` 8.5 step 5" and checkpoint V, and still says to run `harness/build.mjs` and the `run-*.sh` scripts. That stays with the planning session. The new wording ("following this list rather than the README's run steps") also drops the README's path step (C72). |

## The restructure, through this lens

- **Nothing stale from the old split.** No branch for the wait, PF, the file rule or the overlaps survives, and every Blocked-on line reads in phase order.
- **Nothing lost that an implementer needs.** The surviving facts of the hotspot table, the V steps and CP-0 are in 6.x, 7.0, 8.4 and the phases.
- **Re-grounded references.** Every `file:line` I re-read matches cf4d7b8.
- **The brief, end to end.**
  - Sections 1 to 13 are present and substantive.
  - Every settled default is followed or carries a deviation with its reason (deviations 1 to 14, M1 in addition 13).
  - D1 to D9 and D12 each have a default and alternatives.
  - Every new config block and module constant has a value, units and a doc comment; P12's could kinds stay brief, as the brief allows.
  - Every phase has a goal, files, steps, a visible-change statement, verification, a rollback and a blocked mark (P10, P11 and P13 carry it in their headings).
  - The Phase columns of H1 to H13, AC-1 to AC-41 and B-1 to B-10 match each phase's verification list.
- **P0 and P1 can be built from the plan.** The rig loads cf4d7b8's drawing code (`h2-smoke.ts`), and the atlas sizes reproduce: a 272 x 660 sheet at DPR 1 (0.72 MB) and 400 x 1,190 at DPR 2 (1.90 MB), under B-10's 2 MB. With `STAR_PHASES = 1` the block layout collapses to today's, `placePoint` with `snap` reproduces `Math.round(x * dpr) - half`, and every cache, index and identity check has an observable in the stated interfaces.

## Findings

No blocking or major finding. Two minor ones, each cheap.

### C71 (minor): the kill-switch identity can't see the switches P2, P6 and P7 name, and nothing else checks two of them

- **Section.** 7.1 H2 (its last clause) and H5; P1 ("No visible change means"); P2, P6 and P7 (verification and rollback); 7.2's kill-switch column.
- **Problem.**
  - P1's identity check has P2, P6 and P7 rerun H2's scroll-0 rows "with their own switches set too (`CAMERA.snapViewports = 0`, every `SCENE.*.drift = 0`, `LEAN.reach = 0`, `snap` forced true)". H2 calls `drawSky(ctx, assets, field, frame)` on frames the harness builds, and none of those three keys is an input to `drawSky`:
    - `snapViewports` is read only in `stepCamera`'s `jumped` test;
    - a scene's `drift` only through `gather` (`driftGate.scene`) and `driftRate`;
    - `LEAN.reach` only in `stepCamera`'s `settle`, `cameraOffset` and `cameraSpeed`.
  - At scroll 0 the frame's `offset` is (0, 0) with or without them, so those rows pass whatever the switches do.
  - What the rows still prove is worth keeping: the renderer's new paths are an identity at zero offset, with P6's `thinFrom` at `Infinity`. What the rollback notes rely on is checked only in part:
    - P2's "no glide" and P7's "no lean" are checked nowhere;
    - P6's "no drift and no drift frames" is checked only if H5's `DriftGate` table happens to hold a row with `scene` 0.
  - P1's own switch, `STAR_PHASES = 1`, does reach `drawSky` (the atlas and `placePoint`), so P1's row is sound.
- **Evidence.**
  - `PLAN.md`: H2 (`:2895`: "`drawSky` on a recording context ... the kill-switch identity (P1) reruns the scroll-0 rows with every kill switch set"); P1 (`:2983`); P2 (`:3023`, rollback `:3030`); P6 (`:3155`, rollback `:3165`: "no drift and no drift frames, with everything else intact"); P7 (`:3184`, rollback `:3189`).
  - The readers: 6.1's sketches, `stepCamera` (`:687`, `:709-710`), `cameraOffset` (`:766-767`), `cameraSpeed` (`:777`) and `gather` (`:861`).
  - H5 (`:2898`) runs its spring cases "also with `maxLag` 0.15 and with `scrollOmega` 12", and its lean cases on `leanWanted` under full motion and a pause. Neither sets `snapViewports` to 0 or `LEAN.reach` to 0.
  - Checked by hand on the sketch:
    - with `snapViewports = 0`, any change of goal is a jump (`> 0 * H`), so the spring sits on its goal and `stepCamera` reports no motion from the scroll;
    - with `LEAN.reach = 0`, `settle(..., LEAN.reach)` puts each lean spring on its target in the first step, so `leanWanted` turns false.

  Both switches work as the rollbacks say; no check states it.
- **Fix.**
  - Add three rows to H5:
    - (P2) with `CAMERA.snapViewports = 0`, every step leaves the offset at 0.07 x the scroll, and with no drift or lean `stepCamera` returns false (no glide);
    - (P6) the `DriftGate` table has a row with `scene` 0: `driftWanted` false, `driftRate` 0;
    - (P7) with `LEAN.reach = 0`, `cameraOffset`'s lean term stays 0 through a pointer sweep, and `leanWanted` is false after one step.
  - In H2, P1, P2, P6 and P7, call the scroll-0 rerun "the renderer's zero-offset identity" for P2, P6 and P7, keeping "kill-switch identity" for P1's `STAR_PHASES = 1`.

### C72 (minor): P9's archive adaptation drops the README's path step, so as written it runs on the veil session's scratchpad

- **Section.** P9 (verification: "the archived harness" bullet).
- **Problem.**
  - Round 9's wording tells the implementer to follow P9's list "rather than the README's run steps, which predate it". The list sets only `transpile.mjs`'s `REPO` and `live/alib.mjs`'s `PW` and `CHROME`.
  - README step 2 is the one that points the harness at the extracted copy: `lib.mjs`'s `ROOT`, `HERE` and `ZONES`, and `transpile.mjs`'s `HERE` and `PLAN`. It goes with the run steps.
  - Those paths name the veil session's scratchpad, which still exists on this machine. Followed literally, the rerun quietly works on it:
    - `transpile.mjs` deletes and rewrites its `pure/<tree>` folders;
    - `lib.mjs` reads its zones;
    - `sim2.mjs` and the render write their results into it, where a reused `TAG` would overwrite the veil's per-seed render files.
  - Pointed at an extracted copy instead, the render fails at its last line: it writes to `live/out`, which the archive doesn't contain and the script never creates. It throws ENOENT after the per-size counts are printed, so the readability summary is lost.
- **Evidence.**
  - `PLAN.md` P9 (`:3257`).
  - `harness/README.md`, "Running it", step 2.
  - Archive `lib.mjs:7` (`ROOT = 'C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/f159339c-8cb2-444a-916b-251e57be791d/scratchpad/starfield/meteor3'`), `:8-9` (`HERE` and `ZONES` from `ROOT`) and `:13` (`pure/` loaded under `HERE`).
  - Archive `transpile.mjs:14-15` (`HERE` and `PLAN` in that scratchpad) and `:46` (`fs.rmSync(out, { recursive: true, force: true })` for each tree's `pure/` folder).
  - Archive `sim2.mjs:125-127` (it creates and writes `HERE/<OUT>/sim2.json`) and `check11/render3-canvas.mjs:196` (it writes `HERE/live/out/render3-<CANVAS>-results<TAG>.json` with no `mkdir`).
  - [checked with `ls`, 2026-10-28] That scratchpad exists, with:
    - `impl/confirm-final-1/pure/{base,before,plan,proto}`;
    - `impl/confirm-final-1/live/out/render3-gpu-results-1920x1080@1-s0.json`, `-s1` and `-s2`;
    - `code-logic/zones` and `plan/proto`.

    The extracted archive has no `live/out` (`find . -type d`).
- **Fix.** Start the bullet's list with: "extract the archive into the implementing session's scratchpad, point `lib.mjs`'s `ROOT` (its `HERE` and `ZONES` follow) and `transpile.mjs`'s `HERE` and `PLAN` at that copy, never at the veil session's scratchpad they name today (README steps 1 and 2), and create `live/out`; then, in place of README step 3, follow this list".

## Not raised

- **AC-20's "(3 to 6 in 90%)" against H9's "at least 85%".** DRY-R10-1 raised it this round, and I concur. P9's first minute gives median 5 with 3 to 6 in 90.1% with no fireballs and 90.8% with P9's inherited 8% [computed, `firstminute.mjs`, 200,000 visits]. Clear-sky retries during the cooldown can only lower that: cf4d7b8's policy fits a clear-sky path on 89.5% of launches at 1024 x 768 and 98.7% at 1280 x 720, and on 100% at the other desktop sizes [computed, `clearsky.ts`]. Read as a bar, the 90% is a coin flip.
- **P0's H2 inputs.** The viewport, which 31 rects, the `from` set for mid-ease and the time are left to the implementer. Any fixed choice works for an identity check that P0 records and P1 replays.
- **7.1's canvas stubs.** They omit `transferToImageBitmap` and `close`, which `skyAssets.ts`'s `toBitmap` calls. The first run names them (`h2-smoke.ts`).
- **P9's steps.** Steps 2 and 3 don't name the removal of `pickRadiant` and `nextMeteorGap`. 6.10's list does, and type-check forces it once their keys go.
- **P10's fallback pass.** It doesn't say which pass masks `fireball`, but `METEOR`'s doc ("long flights only") and the spec's decision before planning settle it.
- **The comet's `LEAN.reach` without P7, `field()`'s doc under P12's `room`, and the farewell cap.** These belong to SOC10-1, SOC10-2, DRY-R10-2 and SOC10's notes this round.
- **Bloat.** Nothing can be cut without losing what an implementer needs. 6.12's comet and farewell rows are long for a "could", but each clause is a constraint a coordination round added. The `[computed, check report]` labels are evidence, not instructions.
- **`HANDOFF.md`.** Its status block still says round 6 is unchecked. It isn't on an implementer's path.

## Summary

Round 9's four fixes in this lens landed:
- P9's archive rerun runs the proto tree on the GPU canvas at the veil's run size, with the planner's `narrow` set.
- H8 and H9 have pass numbers and a run size, and P9 step 3 no longer commits 55 s ahead of H9.
- Section 6 states the last-reader rule with its cases.
- `PLAN.md` no longer sends the implementer to the README's stale run steps.

The restructure left nothing stale and lost nothing an implementer needs. Every re-grounded citation matches cf4d7b8, the brief is covered end to end, and P0 and P1 can be built without re-deriving anything.

Two minor findings remain, both cheap:
- **C71.** The kill-switch identity that P2, P6 and P7 rerun can't see their switches. P2's and P7's switches are checked nowhere; add three H5 rows.
- **C72.** Round 9's "rather than the README's run steps" also drops the README's path edits. As written, the rerun would delete and rewrite files in the veil session's scratchpad, which still exists. Pointed elsewhere, it would end in ENOENT for want of `live/out`.

**Verdict: pass.**
