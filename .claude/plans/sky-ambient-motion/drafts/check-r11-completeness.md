# Check round 11: completeness and implementability

## Scope

- **Role.** Adversarial checker, lens "completeness", round 11 (the fourth round on the plan rebuilt on cf4d7b8). Planning only: this file is my one output. Nothing in `src/`, configuration, `PLAN.md`, `REVIEW-LOG.md`, `HANDOFF.md`, `COORDINATION.md`, `harness/` or any other file was edited, in either checkout.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it), `PLAN.md` (all 3,651 lines, committed in 0950538 and 0c37b5c), `REVIEW-LOG.md` (every round, with "Round 10" and "Gate round 10"), my lens's round-10 report (`drafts/check-r10-completeness.md`), `audit/separation-of-concerns-gate-r10.md` (its "Noted, not raised"), the pre-round-10 copy `PLAN.before-r10.md` in the session scratchpad (to diff round 10's revision), `harness/README.md` and the archive `harness/veil-confirm-final-1.tar.gz` (extracted read-only into my scratchpad; nothing in it was run), and the code: the planning branch's `src/`, which equals cf4d7b8 (`git diff cf4d7b8 HEAD -- src` is empty).
- **Questions.** Did round 10's fixes in this lens (C71, C72) land, and did round 10's revision regress anything an implementer reads? Is every brief section present and substantive, every settled default followed or its deviation justified, every decision given a default and alternatives, every new config constant given a value, units and a doc comment, and every phase given a goal, files, steps, a visible-change statement, verification, a rollback and its dependencies? Can a session on another model build P0 and P1 from cf4d7b8 without re-deriving anything? What text is stale or cuttable?
- **Limits.** Physics, Next.js docs, conventions, DRY and separation of concerns belong to other reviewers. I raise a number or a rule only where a wrong or missing one changes what gets built, measured or reported.

## Method

- Read every input above, then `PLAN.md` end to end.
- Diffed `PLAN.before-r10.md` against the committed `PLAN.md` (word diff, 63 hunks) and walked every round-10 change for regressions: PHY10-1 to PHY10-4, CG10-1 to CG10-3, CA10-1, CA10-2, C71, C72, NJ10-1, CONV10-1, CONV10-2, DRY-R10-1, DRY-R10-2, SOC10-1 to SOC10-3.
- Re-read the `file:line` citations that P0 to P9 lean on against the branch's `src/`: `renderSky.ts` (`:13`, `:38-39`, `:48`, `:64`, `:71-72`, `:90`, `:93`, `:100`, `:107`, `:113`, `:120`, `:121-125`, `:127`, `:155`), `skyAssets.ts` (`:26-27`, `:45-55`, `:57-60`, `:63-78`, `:81-120`), `sky.worker.ts` (`:1-5`, `:8-13`, `:17-22`, `:24`, `:57-58`, `:65-72`, `:92-98`, `:100-128`, `:135-152`, `:154-160`, `:163-165`, `:167-209`, `:212-238`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:354-357`, `:368-379`, `:435-437`, `:455`, `:467-493`, `:503-509`, `:510-524`, `:531-535`), `scene.ts`, `config.ts` (`:58-59`, `:73`, `:78-80`, `:170-171`, `:179`, `:222-237`, `:247-250`, `:253`, `:262-271`, `:281`, `:286-290`, `:299`, `:305`, `:313`, `:321`), `meteors.ts` (`:39-40`, `:77-78`, `:195-236`), `mountSky.ts` (`:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:122-124`, `:211-214`, `:231`, `:310-314`, `:316-337`), `protocol.ts:32-38`, `Navbar.tsx` (`:14-18`, `:31`, `:48-53`, `:73`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`), `utils.ts:20`, `:26`, `README.md:75`, `:80` and `.claude/launch.json` (`autoPort`). All hold.
- Cross-checked the Phase columns of H1 to H13 and AC-1 to AC-41 against each phase's verification and checklist lines with a script: every row matches, apart from P12's checklist, which cites AC-25 and runs H7 and H10 (AC-31 and AC-37) in its verification.
- Listed every backticked code name in `PLAN.md` that appears in neither the code nor a sketch, and checked each one against its prose definition (48 names; all defined where they are introduced).
- Scripts, all in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r11-completeness/scripts/`:
  - `h1-painter.mjs`: cf4d7b8's 2D painter (`gaussianAt`, `paintSprite`) against 6.3's separable `profile` painter with the phase-0 peak, on cf4d7b8's `STAR_SHAPES` and `MIN_CORE_SIGMA_DEVICE_PX`, at H1's DPRs and over a 0.25 to 2 sweep in steps of 0.005.
- The archive: listed its files at 3b57f0b and at 0950538 (`git show <commit>:<path> | tar -tz`), and read `lib.mjs`, `transpile.mjs`, `sim2.mjs`, `check11/render3-canvas.mjs`, `live/alib.mjs`, `code-logic/lib.mjs` and `live-capture/lib.mjs` against P9's adaptation bullet.

## Round 10's fixes in this scope

| ID | Verdict | Where it landed |
|---|---|---|
| C71 | Landed | H5 has the three kill-switch rows (`snapViewports = 0` keeps the offset at 0.07 × the scroll with `stepCamera` false; a `DriftGate` with scene 0; `LEAN.reach = 0`). H2, P1 and P2 to P7's verification lines say "the renderer's zero-offset identity" for P2, P6 and P7 and keep "kill-switch identity" for `STAR_PHASES = 1`. Checked by hand on 6.1's sketch: with `snapViewports` 0, a changed goal snaps and `moving` is false; with `LEAN.reach` 0, `settle(..., LEAN.reach)` puts each lean spring on its target in one step. No regression. |
| C72 | Landed, with one stale clause beside it (C73) | P9's bullet now extracts the archive into the implementing scratchpad, points `lib.mjs`'s `ROOT` and `transpile.mjs`'s `HERE` and `PLAN` at that copy, creates `live/out`, and replaces README step 3 only. Checked against the archive: `check11/render3-canvas.mjs:13` takes `HERE` from `../lib.mjs`, so its `:196` write follows `ROOT`; `sim2.mjs:125-127` and `transpile.mjs:39`, `:45-46` write under `HERE` with `mkdirSync`; nothing the procedure runs imports `live-capture/lib.mjs`, whose load-time `mkdirSync` (`:11`) names the veil scratchpad. |

## Round 10's other fixes, through this lens

Every round-10 disposition in `REVIEW-LOG.md` matches the committed text, and each was carried to the places that name it:
- PHY10-1's scaled fallback minimum is in 6.10's `fit` line, steer step 7, the `fallbackScale`, flight-block and `PassOptions` docs, the `planFlight` sketch comment, 5.1, P9's files and step 2, and H8's computed figures (102 and 70 px, at most about 1.5% at 1024 × 768).
- CG10-1's `k <= 1 ||` in `frameDue` reproduces cf4d7b8's `'active'` draws (`sky.worker.ts:207`), which H13's case 0 needs.
- CG10-3's unclamped `startArea` and `y = max(METEOR.top, …)` match `meteors.ts:204-207`.
- CA10-1, CA10-2, SOC10-1 and SOC10-2 (the farewell band, `room`, `limit`, `kindLaunches`, the comet's start rule) are in 6.12, step 2.2 and 2.3, T6, 4.2, 5.1, P12's files and step 1, AC-25 and D4.
- CONV10-1's `launchesAllowed` rename is in P8 only; P4 and 6.6 keep `meteorsAllowed`, which P8 renames. CONV10-2's 7.0 sentence names which phase extends which doc.
- NJ10-1's relay cancel is in 6.13, 5.1 and P13's files and verification.

The only regression is the stale clause in C73, which came from the same commit adding two files to the archive.

## Sweep

- **The brief, end to end.** Sections 1 to 13 are present and substantive. Every settled default in `01-planning-brief.md` is followed or carries a deviation with its reason (deviations 1 to 14; the 40 s cooldown's start and value under deviation 11 and 6.9). D1 to D9 and D12 each have a default, alternatives and the phases they affect, and every brief-required decision (pause control and placement, reading drift, lean, could kinds, test runner, v₀, WebKit relay) is among them.
- **Config constants.** Every new block and key has a value, units and a doc comment: `STAR_PHASES`, `DEPTH`, `CAMERA`, `DRIFT` (with `Epicycle` and `DriftConfig`), `PACING`, `FRAME.motionEase`, `SCENE.*.drift` and `.lean`, `ADAPT.thinFade`, `LEAN`, `TRANSIENTS` and `longVisit`, `GapLaw`, `SKY_WINDOW`, `RADIANTS`, `WakeColor`, `SpeedClass`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR.fallbackScale`, `METEOR_KINDS`, `SATELLITE`, `CLEAR_SKY_KEEPS`; module constants `ZONE_REACH`, `TILE`, `SEGMENT_STEP`, `CELL_CACHE_SLACK`, `EPICYCLES`, `DRIFT_REACH`, `ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`, `LEAN_POINTER_QUERY`, `PAUSED_KEY`. P12's could kinds (`SCENE.endLaunchLevel`'s doc, the comet's block, the farewell gap law's cap) stay brief, as the brief allows.
- **Phases.** P0 to P13 each have a goal, files, steps, a visible-change statement, verification and a rollback, and every one but P0 has its dependency (a "Blocked on" line, or the heading for P10, P11 and P13). 7.2's table, graph and each phase's dependency agree.
- **P0 and P1 from cf4d7b8.**
  - H2's grid is fully specified but for the fixed choice of 31 rects, which P0 records and P1 replays. P1's `drawLayer` keeps cf4d7b8's cells, order, culling and twinkle; `placePoint` with `snap` gives `Math.round(x * dpr) - half` (`renderSky.ts:132`); the index is exact under `quietFactor`'s one pass (`scene.ts:131-141`, `zoneQuiet` returns 0 past `QUIET.feather`, `:75`), and `SkyRect` has only the five fields `sameRects` compares (`protocol.ts:19-30`).
  - H1 holds as written [computed, `h1-painter.mjs`]: phase-(0, 0) alpha bytes equal cf4d7b8's for every shape at DPR 0.825, 1, 1.125, 1.25, 1.5, 1.75 and 2, and at every DPR from 0.25 to 2 in steps of 0.005; the worst unrounded phase sum is 0.495% off phase 0 (DPR 2) against H1's 0.6%, and the worst byte sum 2.452% (DPR 0.825) against 2.5%; no shape yields a NaN (the halo-less shapes' zero-sigma profiles are 0, never NaN, since no sample lands on x = 0).
  - With `STAR_PHASES = 1`, H1's whole-atlas equality pins the block layout to cf4d7b8's rows and columns, so the layout needs no derivation beyond "a 4 × 4 block per (tint, shape), 1 px gutter".
- **Stale text.** No restructure leftover remains: `PF`, `CP-0`, `CP-3` to `CP-5`, `8.5` to `8.7`, checkpoint V, "rebase", "decline", "hotspot" and "observed" are gone, and `D10`, `D11` and `246c0aa` appear only where they belong (section 3's note, 8.1's parent). One round-10 clause is stale (C73).
- **Bloat.** A 14-word n-gram scan of the prose finds no repeated passage longer than a phrase (the longest repeats are "no light inside a padded rect of `to` or `next` from the frame a layout arrives", three times, each in a row that needs it). Nothing can be cut without losing what an implementer needs.

## Findings

No blocking or major finding. Two minor ones, each a few words.

### C73 (minor): P9's archive bullet calls `code-logic/lib.mjs` unarchived, and has the implementer swap it out for nothing

- **Section.** 7.3, P9, verification, "the archived harness" bullet.
- **Problem.**
  - The bullet ends: "its `launch` from `live/alib.mjs` (its `PW` and `CHROME` set), which keeps the GPU flags, in place of the unarchived `code-logic/lib.mjs`".
  - The same commit that wrote that clause (0950538) added `meteor3/code-logic/lib.mjs` and `meteor3/live-capture/lib.mjs` to the archive ("The harness archive gains the two shared lib files its scripts import"), and `harness/README.md` now lists the file and tells the implementer to set its `HERE`, `PW` and `CHROME` in step 2, which the bullet keeps.
  - The archived `code-logic/lib.mjs` launches with the same GPU flags as `live/alib.mjs` (`GPU_ARGS = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11']`, `:12`, `:16-18`, against alib's `:13`, `:17-19`). So the swap of `render3-canvas.mjs`'s import, and the second pair of `PW` and `CHROME` edits it needs, buy nothing, and the clause tells an implementer reading README step 2 beside it that a file they have just edited does not exist.
- **Evidence.**
  - `PLAN.md` P9 (`:3252`): "...and its `launch` from `live/alib.mjs` (its `PW` and `CHROME` set), which keeps the GPU flags, in place of the unarchived `code-logic/lib.mjs`."
  - `git show 3b57f0b:.claude/plans/sky-ambient-motion/harness/veil-confirm-final-1.tar.gz | tar -tz` has neither lib file; the same listing at 0950538 has both.
  - `harness/README.md:22` (the contents list) and `:39` (step 2: "`code-logic/lib.mjs` and `live-capture/lib.mjs`: `HERE`, plus `PW` ... and `CHROME`").
  - Archive `check11/render3-canvas.mjs:12` (`import { launch } from '../../../code-logic/lib.mjs'`), `code-logic/lib.mjs:7`, `:11-12`, `:16-18`, `live/alib.mjs:8`, `:12-13`, `:17-19`.
- **Fix.** Replace the clause with: "and its `launch` from the archived `code-logic/lib.mjs` as it is (README step 2 sets its `PW` and `CHROME`; it passes the GPU flags)". The bullet then needs no import swap and no edit to `live/alib.mjs`.

### C74 (minor): the comet's placement reads `LEAN.reach`, which doesn't exist when D3 skips P7

- **Section.** 6.12, the static comet row; P12, step 1.
- **Problem.** The comet's box is placed and re-tested "grown by that drift and lean reach" ("the drift up to `DRIFT_REACH` and the lean up to `LEAN.reach`, times its nearness"), and P12's step 1 checks the box "the drift and the lean included". But 6.1 says of P7's names: "If D3 skips the lean, none of them exists", and D3's alternatives include skipping P7. With D4 picking the comet and D3 skipping the lean, `bodies.ts` fails to compile on `LEAN`, and the implementer must decide what the lean term is. The answer is plain (0), but the plan doesn't say it. Round 10's separation-of-concerns audit noted this under "Noted, not raised", and no round has raised or rejected it.
- **Evidence.** `PLAN.md` 6.12 (`:2750`): "the drift up to `DRIFT_REACH` and the lean up to `LEAN.reach`, times its nearness"; 6.1 (`:825`): "P7 adds `leanX`, `leanY`, `LEAN`, `leanWanted` ... If D3 skips the lean, none of them exists."; D3 (`:163`): "Or skip it"; P12 step 1 (`:3313`): "the drift and the lean included"; `audit/separation-of-concerns-gate-r10.md:178`.
- **Fix.** In 6.12, write "the lean up to `LEAN.reach` where P7 shipped (no lean term without it)", and in P12's step 1 "the drift and, with P7, the lean included".

## Not raised

- **`transpile.mjs` always builds all four trees.** P9's "the proto tree only (`TREES=proto`; ...)" applies to `render3-canvas.mjs` (`:19`), not to `transpile.mjs`, whose loop builds `base`, `plan`, `before` and `proto` (`:44`) and reads `base` with `git show HEAD:` (`:20`, `:24`). That works once P9's steps are committed, which they are before the verification runs; a file present only in the working tree would make the `base` pass throw. Not worth a sentence.
- **`skyWindow`'s body.** The plan lists "`radiantMotion`, `elevationAt`, `meteorRange`, `toward` and `sampleRadiant`" as R2 §10's sketches but not `skyWindow`, whose body is also there (`R2-meteors-bodies.md:565-568`) and is fully given by its doc. No implementer would be stuck.
- **P12's checklist.** P12 has no "Checklist:" line; its verification names AC-25 and runs H7 and H10, which are AC-31's and AC-37's methods. The AC table's P12 entries are covered.
- **H9's first-minute layout.** H9 doesn't name the layout for "median 5, 3 to 6 in at least 85%". At 1440 × 900 every clear-sky plan fits, so it is the gap law's own figure; elsewhere clear-sky failures during the cooldown can only lower it slightly (my round-10 counterpart's 89.5% clear-sky fit at 1024 × 768). Either reading passes.
- **Section 1's date.** "2026-10-27" is when the plan was first written; it has been revised since. Not on an implementer's path.

## Summary

Round 10's two fixes in this lens landed and work against the archive and the code: H5 now checks the kill switches that H2 can't see, and P9's archive adaptation points every write at the implementing scratchpad and creates `live/out`. Round 10's other seventeen fixes are carried to every place that names them, and their citations hold at cf4d7b8.

The brief is covered end to end: every settled default is followed or justified, every decision has a default and alternatives, every new constant has a value, units and a doc comment, and every phase has its seven parts. P0 and P1 can be built without re-deriving anything; H1's byte, sum and NaN bars hold at every DPR H1 names and over a 0.25 to 2 sweep.

Two minor findings, each a few words:
- **C73.** The same commit that archived `code-logic/lib.mjs` left P9's bullet calling it unarchived and swapping it for `live/alib.mjs`, which has the same GPU launch.
- **C74.** The comet's placement reads `LEAN.reach`, absent when D3 skips P7; say the lean term is 0 then.

**Verdict: pass.**
