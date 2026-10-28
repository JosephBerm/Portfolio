# Check round 12: completeness and implementability

## Scope

- **Role.** Adversarial checker, lens "completeness", round 12 (the fifth round on the plan rebuilt on cf4d7b8). Planning only: this file is my one output. Nothing in `src/`, configuration, `PLAN.md`, `REVIEW-LOG.md`, `HANDOFF.md`, `COORDINATION.md`, `harness/` or any other file was edited, in either checkout.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it), `research/01-planning-brief.md`, `PLAN.md` (the working tree's round-11 revision: 3,657 lines, 60,054 words), `REVIEW-LOG.md` (with "Round 11" and "Gate round 11"), my lens's round-11 report (`drafts/check-r11-completeness.md`), the round-11 gate audits where they shaped round 11's fixes (`audit/dry-gate-r11.md`, `audit/separation-of-concerns-gate-r11.md`), `harness/README.md` and the archive `harness/veil-confirm-final-1.tar.gz` (extracted read-only into my scratchpad; nothing in it was run), and the code at cf4d7b8, which is the planning branch's `src/` (`git diff cf4d7b8 HEAD -- src` is empty).
- **Questions.** Did round 11's two fixes in this lens (C73, C74) land, and did round 11's sixteen fixes regress anything an implementer reads? Is every brief section present and substantive, every settled default followed or its deviation justified, every decision given a default and alternatives, every new config constant given a value, units and a doc comment, and every phase given a goal, files, steps, a visible-change statement, verification, a rollback and its dependencies? Can a session on another model build P0 and P1 from cf4d7b8 without re-deriving anything? What text is stale or cuttable?
- **Limits.** Physics, Next.js docs, conventions, DRY and separation of concerns belong to other reviewers. I raise a rule or a number only where a wrong or missing one changes what gets built, measured, reported or rolled back.

## Method

- Read every input above, then `PLAN.md` end to end.
- Word-diffed round 11's revision against the committed plan (`git diff --word-diff=plain HEAD`, HEAD 0c37b5c), extracted each change with its context (`extract.mjs`), and walked every one against its disposition in `REVIEW-LOG.md`: PHY11-1, PHY11-2, CG11-1, CG11-2, CA11-1, CA11-2, C73, C74, NJ11-1, CONV11-1 to CONV11-3, DRY-R11-1 to DRY-R11-3 and SOC11-1.
- Re-read the code the round's changes lean on, at cf4d7b8:
  - `meteors.ts`: `PlanOptions` (`:50-57`), `PassOptions` (`:59-63`), `planFlight` (`:191-262`), `planMeteor` (`:270-277`);
  - `sky.worker.ts`: `planLaunch` (`:246-261`), `retryMeteors` (`:408-412`), `resize` (`:429-447`), the message handler (`:463-552`);
  - `renderSky.ts`: `drawLayer` and `drawSky` (`:89-157`), `drawMeteor`'s wake stops (`:221-240`);
  - `skyAssets.ts` (`:45-120`), `mountSky.ts` (`:206-337`), `config.ts` (`METEOR`, `:251-324`; `wakeStops`, `:392`), `Navbar.tsx` (`:7-9`, `:14-31`, `:88-159`).
- The archive: read `code-logic/lib.mjs` (`:7-18`, `:72`), `check11/render3-canvas.mjs` (`:9-19`, `:37-39`, `:136`, `:196`), `lib.mjs` (`:7-17`, `:45-47`, `:74-112`), `transpile.mjs` (`:14-20`, `:43-56`) and `sim2.mjs` (`:7`, `:23-28`, `:79`, `:125-127`) against P9's adaptation bullet, and listed every import of the scripts it runs.
- Scripts, in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r12-completeness/`:
  - `acmap.mjs`: every AC and harness row's Phase column against the text of each phase it names, and back;
  - `ngrams.mjs`: repeated 14-word passages in the prose (code blocks excluded).
- Grepped for the restructure's leftovers (`PF`, `CP-0`, `CP-3` to `CP-5`, sections 8.5 to 8.7, checkpoint V, "rebase", "decline", "hotspot", "observed", `D10`, `D11`, 246c0aa) and for every phase attribution of the names round 11 moved (`driftCap`, `narrowMaxFps`, `slowMaxFps`, `softwareShare`, `planMeteorTransient`'s second argument).

## Round 11's fixes in this scope

| ID | Verdict | Where it landed |
|---|---|---|
| C73 | Landed | P9's archive bullet (`:3258`) now ends: "its `launch` from the archived `code-logic/lib.mjs` as it is (README step 2 sets its `PW` and `CHROME`; it passes the GPU flags)". Checked against the archive: `check11/render3-canvas.mjs:12` imports only `launch` from that file; `code-logic/lib.mjs` sets `PW` (`:7`), `CHROME` (`:11`) and `GPU_ARGS` (`:12`), which `launch` passes (`:16-18`); its `HERE` (`:10`) is read only by `save` (`:72`), which nothing P9 runs imports; and no script P9 runs imports `live-capture/lib.mjs` (its only importer is `check11/live-lib.mjs`, which P9 leaves unused). `harness/README.md:39` (step 2) lists `PW` and `CHROME` for that file. No regression. |
| C74 | Landed | 6.12's comet row (`:2756`): "the drift up to `DRIFT_REACH` and, only with P7, the lean up to `LEAN.reach`, times its nearness"; the same cell's later "grown by that drift and lean reach" refers back to it. P12's step 1 (`:3319`): "the drift and, with P7, the lean included". 4.2's `SkyBody` row and AC-25 don't name the lean. No regression. |

## Round 11's other changes, through this lens

- **CG11-1, with DRY-R11-1 and SOC11-1.** P10 makes `METEOR_SPEC.plan` the decision step around `planMeteorTransient`, which gains its second argument there. Every place that names it agrees: 5.1 (`:328`), 6.9's doc and sketch notes (`:2105-2109`, `:2117`), 6.10's `PlanOptions.fireball` doc and `planFlight` note (`:2590`, `:2599-2602`), 6.12's farewell row (`:2755`), P10's files, steps and verification (`:3271`, `:3286`, `:3288`) and P12's files (`:3318`). Checked against cf4d7b8: `planMeteor`'s fallback pass sets `fireballs: false` (`meteors.ts:275`, after the long pass at `:274`), so a fireball try with `flights: 'both'` would fly an ordinary short flight before ordinary long ones on the other steers, and `flights: 'long'` prevents it; with the context's `nearCopy` false, a failed try keeps the visit's sky (RD1). The `Omit<PlanOptions, 'steer' | 'nearCopy' | 'ink'>` default `{}` type-checks, since `steer` is required. One regression: farewell meteors now depend on P10, and the phase map doesn't say so (C75).
- **CA11-1.** T3, 6.11's drawing bullet, 6.12's variants paragraph, I9, AC-30 and H7 now say the same thing: satellites and the point flash meet answer 3's condition a by construction, and bursts, earthgrazers and the comet stay apart from a lease holder. One citation went stale in the move (C76).
- **CA11-2.** H7, AC-20 (`H9, H7, L | P9, P12`), P12's verification (AC-20 named), `heroLaunchMaxScroll`'s P8 doc and P12's rewording of `LaunchGate.allowed`'s doc agree; `acmap.mjs` finds AC-20's P12 entry in P12's text.
- **CONV11-2.** `PACING`'s drift caps and `driftCap` date to P6 everywhere: 5.1 (`:319`, `:323`), 6.2 (`:965`, `:1059`, `:1231`, `:1245`), P3's files (`:3038-3039`) and P6's (`:3134-3135`). P3's `PACING` doc is the sketch less one clearly bounded sentence ("The drift draws at most ... below `minFps`."), and P3's `cameraCap` line is `Infinity` (6.2's table).
- **PHY11-1, PHY11-2, CONV11-1, CONV11-3, DRY-R11-2, DRY-R11-3, NJ11-1.** The docs read as their dispositions say, and the fireball figures agree across E7, 2.1, AC-37 and P10's visible change (about one per 8 to 10 minutes early in a visit, about 3% of all launches, about 12% of first minutes). `METEOR.fallbackScale` is covered by the flight block's group doc, as cf4d7b8 documents its other grouped keys (`config.ts:286-290`).

## Sweep

- **The brief, end to end.** Sections 1 to 13 are present and substantive. Every settled default in `01-planning-brief.md` is followed or carries a numbered deviation with its reason (1 to 14). D1 to D9 and D12 each have a default, alternatives and the phases they affect, and every decision the brief requires is among them. Every new config block and key has a value, units and a doc comment; P12's could kinds stay brief, as the brief allows.
- **Phases.** P0 to P13 each have a goal, files, steps, a visible-change statement, verification and a rollback, and a dependency (a "Blocked on" line, or the heading for P10, P11 and P13). The one gap is P12's dependency on P10 and P10's rollback note (C75).
- **P0 and P1 from cf4d7b8.** Round 11 touched neither. Rechecked against the code: `drawLayer`, `drawSky` and the cache (`renderSky.ts:23-51`, `:89-157`) are as 6.4, 6.5 and P1 describe them; the atlas's rows per tint and columns per shape with a 1 px gutter (`skyAssets.ts:93-112`) are what "a 4 × 4 block per (tint, shape), 1 px gutter" reduces to at `STAR_PHASES = 1`, which H1's whole-atlas equality pins; the separable painter's samples never land on x = 0, so the halo-less shapes' zero-sigma profiles are 0, not NaN. Nothing needs re-deriving.
- **Phase maps.** `acmap.mjs` finds every AC and harness Phase entry named in that phase's text, except AC-31 and AC-37 under P12, whose methods (H10, H7) P12 runs (round 11 noted this and left it). In the other direction, P0 names H2 (it records the baseline), P6 names H6 (its band medians) and P12 names AC-26 (the planet's re-baseline): all intended.
- **Stale text.** No restructure leftover remains: the grep finds only the numbers "8.5%" and "8.9 px", `D10` and `D11` in section 3's note, and 246c0aa as cf4d7b8's parent in 8.1. Round 11 left one stale citation (C76).
- **Bloat.** The 14-word scan finds no repeated passage longer than a phrase; each repeat sits in a row that needs it. Nothing can be cut without losing what an implementer needs.

## Findings

No blocking or major finding. Two minor ones, each a few words.

### C75 (minor): P12's meteor variants and farewell meteors depend on P10, but the phase map, P12's "Blocked on" and P10's rollback don't say so

- **Section.** 7.2 (P12's row); 7.3 P12 ("Blocked on"); 7.3 P10 ("Rollback").
- **Problem.**
  - Round 11's CG11-1 fix moved `planMeteorTransient`'s second argument from P12 into P10. Farewell meteors call `planMeteorTransient(context, { clearOf, starts })` through that argument, so they now need P10. Before round 11 the argument was P12's own ("an optional second argument whose `clearOf` joins the rails and whose `starts` every `planMeteor` call takes", committed `:2749`; 5.1: "farewell meteors' spec through `planMeteorTransient`'s second argument (P12)", committed `:328`).
  - The point flash, bursts and earthgrazers already needed P10: each is a `METEOR_KINDS` entry (P10 creates `METEOR_KINDS`) decided in the meteor spec's decision step (P10 creates it).
  - Yet 7.2 lists P12's dependencies as "P9 (planet: P2); `CLEAR_SKY_KEEPS` from P11, or its own", P12 is "Blocked on. P9 for every kind but the planet", and P10's rollback says only "or revert". 7.0 asks every rollback to name "the later phases that depend on it", as P9's ("P10 to P12 depend on it") and P11's ("keeping `CLEAR_SKY_KEEPS` if a P12 kind reads it") do.
  - Why only minor: 7.0 lands phases in order and P10 is required right after P9, so P10 always precedes P12 in practice, and a P10 revert after P12 would fail type-check rather than build something wrong. What's wrong is the dependency record and the rollback note.
- **Evidence.**
  - `PLAN.md` 7.2 (`:2939`): "| P12 | each "could" kind | P9 (planet: P2); `CLEAR_SKY_KEEPS` from P11, or its own (7.0) |"; P12 (`:3317`): "**Blocked on.** P9 for every kind but the planet"; P10 (`:3291`): "**Rollback.** `METEOR_KINDS.fireball.chance = 0` turns fireballs off (today flies 8%), or revert."
  - 7.0 (`:2840`): "It also names its revert, together with the later phases that depend on it."; P9 (`:3263`): "Or revert the PR (P10 to P12 depend on it)"; P11 (`:3312`).
  - 6.12's farewell row (`:2755`): "`planMeteorTransient(context, { clearOf, starts })` (P10's second argument, 6.9)"; P10's files (`:3271`): "`METEOR_SPEC.plan` becomes the decision step around `planMeteorTransient`, which gains its second argument (6.9)"; P12's files (`:3318`): "passed as `clearOf` and `starts` in `planMeteorTransient`'s second argument".
  - 6.12 (`:2761`): "The point flash, bursts and earthgrazers are `METEOR_KINDS` entries like fireballs (P10): ... decided in the meteor spec's one decision step"; P12's files (`:3318`): "a `METEOR_KINDS` entry in `config.ts` ..., the variant in `meteorKind.ts` (decided like fireballs ...)".
  - Round 11's word diff (HEAD 0c37b5c to the working tree) changes the farewell row, 5.1's row and P12's files, but not 7.2's P12 row, P12's "Blocked on" line or P10's rollback.
- **Fix.**
  - 7.2's P12 row: "P9 (planet: P2); P10 for the point flash, bursts, earthgrazers and farewell meteors; `CLEAR_SKY_KEEPS` from P11, or its own (7.0)".
  - P12's "Blocked on": "P9 for every kind but the planet, which is a star ... and could follow P2; P10 too for the point flash, bursts, earthgrazers and farewell meteors (`METEOR_KINDS`, the decision step, `planMeteorTransient`'s second argument)."
  - P10's rollback: "..., or revert (P12's point flash, bursts, earthgrazers and farewell meteors depend on it)."

### C76 (minor): T3 cites 6.12 for a fact round 11 moved out of 6.12, and 6.12 now points back to T3

- **Section.** 4.3, T3.
- **Problem.** Round 11 (CA11-1) moved the sentence about the wake from 6.12 into T3 and replaced it in 6.12 with "T3 says what that guarantees for each". T3 still cites "(6.12)" for that fact, so a reader who follows the citation finds only a pointer back to T3. The fact's support is the code: `drawMeteor` veils the wake only at its `METEOR_LOOK.wakeStops` stops and spans a gradient between them, which is why these kinds don't meet answer 3's condition a by construction. That is the source REVIEW-LOG's CA11-1 row gives.
- **Evidence.** `PLAN.md` T3 (`:300`): "A burst's or earthgrazer's wake is veiled only at its sampled stops (6.12), and the comet's box test can only fade it ..."; 6.12 (`:2761`): "T3 says what that guarantees for each"; round 11's word diff at `:2761` removes "a burst's or earthgrazer's wake is veiled at its sampled stops" from 6.12. cf4d7b8 `renderSky.ts:221-227` (the stops), `:240` (`stop.light * kept(stop.point)` on the gradient), `config.ts:392` (`wakeStops: 9`). `REVIEW-LOG.md`, Round 11, CA11-1: "(cf4d7b8 `renderSky.ts:221-240`, `wakeStops` 9)".
- **Fix.** In T3, replace "(6.12)" with "(`drawMeteor` veils it at its `wakeStops` stops and blends between them, cf4d7b8 `renderSky.ts:221-240`)", or drop the parenthetical.

## Not raised

- **`retryTransients`' doc names layout messages only.** It says the worker calls it "on every layout message", but cf4d7b8's `resize` also calls `retryMeteors` (`sky.worker.ts:437`, after clearing the radiant and the meteor at `:435-436`). P8's rename bullet covers every caller ("`holdMeteors(now)` and `retryMeteors(now)` become ..."), and H7's oracle equality runs sequences with a resize, so a missed call fails H7. Naming resize in the doc would be more exact, but nothing gets built wrong.
- **P10's pass-order check.** "7.1's resolve hook can wrap `./meteors`" needs a wrapper module that imports the real file by URL and re-exports a recording `planMeteor`; the hook in 7.1 only resolves. That is a standard harness technique, and the hint is enough.
- **A failed farewell plan clears the hero's sky.** Farewell meteors plan through `planMeteorTransient`, so a null farewell plan made with `nearCopy` true clears the meteor family's visit sky, and the hero gets a new shower if the visitor scrolls back up. It is a could kind, and the behavior is legal under RD1.
- **The P12 comet's dependency.** It needs P6 and P8, not P9; "Blocked on P9" over-constrains harmlessly.
- **Section 1's date.** "2026-10-27" is when the plan was first written. It's not on an implementer's path.

## Summary

Round 11's two fixes in this lens landed and match the archive and the code. P9's render run now launches Chromium through the archived `code-logic/lib.mjs`, whose `PW` and `CHROME` README step 2 sets and whose `HERE` nothing P9 runs reads. The comet's lean term applies only with P7. Round 11's other fourteen fixes are carried to every place that names them. The new P10 decision step is consistent everywhere it's named, and the pass order it protects matches cf4d7b8's `planMeteor`.

The brief is covered end to end, P0 and P1 can be built from cf4d7b8 without re-deriving anything, the AC and harness phase maps agree with the phases, and nothing is stale from the restructure or worth cutting.

Two minor findings, both from round 11's moves:
- **C75.** Farewell meteors now use P10's second argument, and the meteor variants have always used P10's `METEOR_KINDS` and decision step. P12's dependency entries and P10's rollback should say so.
- **C76.** T3's "(6.12)" points at a section that now points back to T3; cite the code instead.

**Verdict: pass.**
