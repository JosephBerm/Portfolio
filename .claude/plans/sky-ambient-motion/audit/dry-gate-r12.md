# DRY audit of PLAN.md, gate round 12

## Scope

- **Role.** Auditor, scope "dry", gate round 12: one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what cf4d7b8 exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain` and the `color.ts` exports.
  - Duplication in the document itself (sections repeating each other, research copied instead of linked), and over-engineering against "defensive but not over-engineered", including what round 11 added.
  - Whether round 11's DRY fixes (DRY-R11-1 to DRY-R11-3) landed, and what round 11's revision broke.
- **Inputs.**
  - `PLAN.md` as read on 2026-10-28: 3,657 lines, 60,054 words, sha256 prefix `eb9f9c8a9050a03f`, uncommitted in the worktree (round 11's revision). A copy is in the scratch folder (`dry-gate-r12/PLAN.snapshot.md`); every `PLAN.md:n` below refers to it. Round 11's input is the committed `PLAN.md` at 0c37b5c (sha256 prefix `2fc5c3b8fea0f6cd`, identical to `dry-gate-r11/PLAN.snapshot.md` and `PLAN.before-r11.md`), copied as `dry-gate-r12/PLAN.head.md`.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `REVIEW-LOG.md` ("### Round 11" and "### Gate round 11"), round 11's `audit/dry-gate-r11.md`, and round 11's `drafts/check-r11-coordination-a11y.md` (CA11-1, whose fix touched the text below).
  - The code baseline cf4d7b8: the worktree's `src/`, which `git diff --quiet cf4d7b8 HEAD -- src` shows is identical. Every `file:line` below cites it.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY lens; `COORDINATION.md` is the contract.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then round 11's DRY report and its log rows.
2. Word-diffed round 11's input against this snapshot (`dry-gate-r12/r11-reviser.wdiff`, 43 hunks) and read every change in context, including the cuts the round 11 log lists (`fallbackScale`'s own doc, 6.11's and 6.12's restatements of T3, the steer's step 7 numbers, P9's fireball odds, the camera docs' pause and Play).
3. Read cf4d7b8's `planFlight` and `planMeteor` (`meteors.ts:185-277`), `PlanOptions` and `PassOptions` (`:49-63`), the `METEOR` block (`config.ts:247-324`), `METEOR_LOOK` (`:384-395`), `drawMeteor` (`renderSky.ts:194-260`), `updateMeteor` and `planLaunch` (`sky.worker.ts:211-261`) and `color.ts` (all of it).
4. For each fact round 11 touched, listed every copy in `PLAN.md` and compared it with its owner: the fireball decision step and `planMeteorTransient`'s second argument, the pass order, `PlanOptions.fireball`, the farewell spec's call, the pause control's doc, `FRAME.motionEase`'s doc, `METEOR.fallbackScale` and the minimum paths it scales, `PACING`'s drift caps and `driftCap`, T3 and its copies (6.11, 6.12, I9, D12, H7, AC-24, AC-30, P11, section 11), the launch-scene docs, and the fireball cadence (2.1, E7, P9, P10, AC-37, 7.0).
5. Re-ran round 11's scratch scripts on both versions, in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r12/`:
   - `shingles.mjs` (repeated 9- and 12-word runs);
   - `cites.mjs` (every `file:line` resolved on cf4d7b8);
   - `xcopy.mjs` (12-word runs shared with R1 to R4 and `COORDINATION.md`);
   - `ac-map.mjs`, `h-map.mjs` and `secrefs.mjs` (the AC and H phase maps, section references);
   - a symbol scan of every `function`, `const`, `interface` and `type` the sketches declare, for a second definition.

## Round 11's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R11-1 | yes | P10 makes `METEOR_SPEC.plan` the decision step around `planMeteorTransient` and gives that function its second argument (`PLAN.md:3271`, steps `:3286`); 6.9's doc names it, "From P10 a second argument adds options to every `planMeteor` call (a `clearOf` joins the rails), and its `flights: 'long'` drops the short fallback" (`:2105-2107`), with the type as `Omit<PlanOptions, 'steer' \| 'nearCopy' \| 'ink'>` (`:2109`), so P12's `starts` joins it with no second list; `METEOR_SPEC.plan` points at P10 (`:2117`); 5.1 dates it to P10 (`:328`), and 6.12's farewell row and P12's files call it as P10's (`:2755`, `:3318`). The fireball try runs with the context's `nearCopy` false and `flights: 'long'`, so its failure keeps the visit's sky, and `PlanOptions.fireball` reads "long flights in clear sky only" (`:2590`), matching cf4d7b8's own rules (`meteors.ts:228` rejects a fireball wherever the veil may dim; `:274-275` give fireballs to the long pass only). "Never a fireball" for farewell meteors now follows from the structure. |
| DRY-R11-2 | yes | `SkyPauseButton`'s doc reads "stops all of the sky's motion, as reduced motion does, and starts it again from where it stopped" (`:1866-1867`), and `FRAME.motionEase`'s "ambient motion eases out or in" (`:1682-1683`). 7.0's P6 entry names neither (`:2826`), and no doc keeps a second list of what the pause stops: the only other list is AC-28's check (`:3459`). `SkyMotion`'s doc stays the one list (6.8 `:1959`, 6.13 `:2771`). |
| DRY-R11-3 | yes | `METEOR.fallbackScale` joins the flight block, "whose doc covers it" (`:2451`), and that doc keeps only the durations (`:2458`); each minimum states its own scaling once, `path` (`:2459`) and the narrow block (`:2460`), which is how cf4d7b8 documents those keys (`config.ts:286-299`: one doc per group, `path` and the narrow block on their own). `PassOptions`' doc still names `METEOR.fallbackScale` (`:2606`). |

## Round 11's other changes, through this lens

- **Single owners that hold.**
  - The veil's pass order still lives in one function: the fireball try and the farewell spec both go through `planMeteorTransient`, and its second argument's type derives from `PlanOptions`, so no option list is written twice.
  - `PACING`'s drift caps and `driftCap` move to P6 in one sentence (6.2, `:965`); 5.1 (`:319`, `:323`), P3's files (`:3038-3039`) and P6's (`:3134-3135`) follow, and 7.0's rule covers the P3 docs that name the caps (`FrameDemand.cap`, `FrameState.cameraCap`).
  - Who meets answer 3's conditions by construction is now stated once, in T3 (`:300`), with 6.11 (`:2745`), 6.12 (`:2761`), I9 (`:3370`), D12 (`:170`), H7 (`:2901`), AC-30 (`:3461`) and section 11 (`:3536`) citing it.
- **The cuts** each leave their fact with its owner, except one: 6.12's sentence on bursts' and earthgrazers' wakes moved into T3, which still cites 6.12 for it (DRY-R12-1).
- **Code.** Nothing new re-implements a veil export: the fireball try relies on cf4d7b8's own fireball rules (`meteors.ts:228`, `:274-275`) and its `flights` option (`:270-276`), and no config crosses the thread boundary.
- **References.** `cites.mjs` resolves the same 63 citations as round 11's input; none moved.
- **Repeated text.** 12-word repeats fall from 21 to 19 and 9-word ones from 66 to 64: the two removed are round 11's targets (AC-37's old fireball clause and T3's "no light" sentence that 6.12 repeated), and none is new. Overlap with the research is 125, 203, 245 and 48 runs for R1 to R4 (125, 215, 245 and 48 before), and 4 with `COORDINATION.md`.
- **Over-engineering.** Round 11's additions are the smallest that keep ask 1's order: the decision step is two calls of the one planner, and H7's pass-order check records `planMeteor` calls through 7.1's existing resolve hook. The plan grew by 341 words, to 60,054.

## Verdict

**Pass.** No blocking or major finding. One minor finding, cheap and clearly right.

## Findings

### DRY-R12-1 (minor): T3 cites 6.12 for the bursts' and earthgrazers' wake fact, but round 11 moved that fact out of 6.12, which now points back to T3

- **Section.** 4.3 (T3); 6.12 (the variants paragraph).
- **Problem.**
  - Before round 11, 6.12 held the fact that a burst's or earthgrazer's wake is veiled only at its sampled stops, which is why those two kinds can't meet answer 3's condition a by construction and stay apart from a lease holder.
  - Round 11 (CA11-1's fix) moved that fact into T3 with the citation "(6.12)", and in the same pass replaced 6.12's sentence with "T3 says what that guarantees for each".
  - So T3 cites 6.12 and 6.12 cites T3: a reader who follows T3 to its source lands on a pointer back, and nothing in 6.12 says how a wake is veiled (its burst and earthgrazer rows give them wakes, not their veil). The fact's real source is `drawMeteor`'s wake, which REVIEW-LOG's CA11-1 row already names, so the log and the plan disagree on the citation.
- **Evidence.**
  - `PLAN.md:300` (T3): "A burst's or earthgrazer's wake is veiled only at its sampled stops (6.12), and the comet's box test can only fade it when copy moves under it, so those stay apart from a lease holder (T7; the comet by D12's hold, 6.12)."
  - `PLAN.md:2761` (6.12): "T3 says what that guarantees for each, and T7, since all three are meteors, keeps them apart from a lease holder." 6.12's rows for the two kinds (`:2753`, `:2754`) say nothing of how a wake is veiled.
  - Round 11's input (`git show HEAD:.claude/plans/sky-ambient-motion/PLAN.md`, line 2755): "a burst's or earthgrazer's wake is veiled at its sampled stops, and being meteors, T7 keeps all three apart from a lease holder", the sentence CA11-1's fix cited ("say that bursts' and earthgrazers' wakes are veiled at their sampled stops (6.12)", `drafts/check-r11-coordination-a11y.md:87`).
  - `REVIEW-LOG.md:234` (CA11-1's row): T3 "says wakes are veiled only at their sampled stops (cf4d7b8 `renderSky.ts:221-240`, `wakeStops` 9)".
  - cf4d7b8: `drawMeteor` builds `METEOR_LOOK.wakeStops` points (`renderSky.ts:221-227`; `config.ts:392`, 9) and gives each one color stop of one linear gradient at `stop.light * kept(stop.point)` (`renderSky.ts:240`), so between two stops the light is interpolated, not veiled.
- **Fix.** In T3, replace "(6.12)" after "sampled stops" with the drawing it describes, for example "(`drawMeteor` veils the wake only at its `METEOR_LOOK.wakeStops` gradient stops, cf4d7b8 `renderSky.ts:221-240`)", or drop the parenthetical. 6.12's pointer to T3 then resolves, and the second "6.12" in T3 (the comet's hold, which 6.12's comet row does state) stays.

## Summary

- **Round 11's fixes.** All three landed: P10 owns the fireball decision step and `planMeteorTransient`'s second argument, so farewell meteors are never fireballs by structure; the pause control's doc and `FRAME.motionEase`'s describe what they do in words true from P5, so no later phase edits them; and `METEOR.fallbackScale` sits in the flight block with each minimum documenting its own scaling once.
- **Round 11's other changes.** Every single owner in this lens holds, nothing re-implements a veil export, no config crosses the thread boundary, citations and repeated text are unchanged or fewer, and round 11 added no mechanism beyond what ask 1's order needs.
- **One minor finding.** DRY-R12-1: T3 and 6.12 cite each other for the bursts' and earthgrazers' wake fact after round 11 moved it; T3 should cite `drawMeteor`'s wake stops.

## Noted, not raised

- **New this round.**
  - The fireball's screen gate ("desktop only") lives in the P10 decision step's code (`:3271`), while 6.12 gives P12's variants "a minimum width where needed" as `METEOR_KINDS` data (`:2761`). If P12 turns the step into one loop over the entries, the fireball's gate may become an entry key too. Could kinds only (D4's default is none).
  - `planMeteorTransient`'s P10 sentence says "a `clearOf` joins the rails" (`:2105-2106`), though no P10 caller passes one (P12's farewell spec is the first). That is 7.0's "a committed doc describes what its phase ships" rule, not a copy.
  - AC-28 lists what the pause stops ("drift, twinkle, parallax and transients", `:3459`) as a check; it omits the lean, which H13's case 5 and AC-14 (both in P7's checklist, `:3189`) cover.
  - E7's target ("about 1 per 8 to 10 minutes early in a visit", `:147`) and AC-37's measure ("in about 12% of first minutes (E7)", `:3468`) are two facets of one simulation (REVIEW-LOG round 11: one per 8.3 to 10.2 minutes over a visit's first 5 to 10, and 12.2% of first minutes), so they agree.
- **Carried from round 11, unchanged:**
  - the farewell meteors' weight (about fifteen mechanisms for a could kind that flies only in the last 169 px of scroll at 2560 × 1440 and never at 3840 × 2160; the user's call under D4);
  - the comet's About row (0.6 H plus 70, 90 or 110 px by breakpoint, `:2756`), CSS facts the worker can't read and no named constant mirrors;
  - the fallback's scaling split by owner (the steer its durations, the planner its minimum path), and `startArea`'s clamp applied by the draw and the probes;
  - `launched` and `kindLaunches` counting the same launches;
  - the `TRANSIENTS` doc's "set from the crossing share measured on captured layouts" (`:2236`), degrees per second to CSS px per second written twice (`:2546`, `:2734`), `SCROLL_CANCEL`'s 12 and 24 px in prose, `ZONE_REACH`'s doc saying every "clear of copy" test reads it (`:1395`), `pickVisitSky` testing the field's width, and 8.4's `METEOR` row summarizing 6.10's doc list;
  - the maps' known gaps: P12's acceptance items (AC-20, AC-25, AC-31, AC-37) have no "Checklist:" line, P0 names H2 for its baselines and P6 uses H6's medians.
- **Outside this lens.** H9 defines crossings over a visit's first two minutes only (`:2903`), while P9's report asks for "H9's crossings a minute over a visit's first two and first five minutes" (`:3257`).
