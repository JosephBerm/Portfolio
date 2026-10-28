# DRY audit of PLAN.md, gate round 10

## Scope

- **Role.** Auditor, scope "dry", gate round 10. This is one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself (sections repeating each other, research copied instead of linked), and over-engineering against "defensive but not over-engineered".
  - Whether round 9's DRY fixes (DRY-R9-1 to DRY-R9-3) landed and what they broke. Round 9's other changes go through the same lens. So does the post-commit restructure: stale split content, anything an implementer needs that was lost, and the re-grounded `file:line` references.
- **Inputs.**
  - `PLAN.md` as read on 2026-10-28: 3,655 lines, 58,867 words, sha256 prefix `515aac12d898801f`. A copy is in the scratch folder (`dry-gate-r10/PLAN.snapshot.md`), and every `PLAN.md:n` below refers to it.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree") and `research/01-planning-brief.md`.
  - `REVIEW-LOG.md` (round 9's rows) and round 9's `audit/dry-gate-r9.md`.
  - The code baseline cf4d7b8, read only at `.claude/worktrees/sky-baseline-cf4d7b8`. Every `file:line` below cites it.
  - The archived harness (`harness/veil-confirm-final-1.tar.gz`), as round 9 extracted it into the scratch folder.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.**
  - Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in any checkout.
  - Findings stay inside the DRY scope, and the contract is `COORDINATION.md`.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then `REVIEW-LOG.md`'s round 9 rows and round 9's DRY report.
2. Word-diffed round 9's input (`PLAN.before-r9.md`, sha256 `99cc28a8b7133578`, identical to `dry-gate-r9/PLAN.snapshot.md`) against this snapshot (`dry-gate-r10/r9-reviser.wdiff`, 63 hunks). I read every change in context, including the ten cuts the round 9 log lists.
3. Read cf4d7b8's `sky.worker.ts` and `scene.ts` in full, and these ranges: `meteors.ts:1-80` and `:180-300`, `config.ts:50-100` and `:160-405`, `mountSky.ts:100-140` and `:200-356`. Searched cf4d7b8's `src`, `AGENTS.md` and `README.md` for every committed statement of the rails' guard.
4. For each fact round 9 touched, listed every copy in `PLAN.md` and compared it with its owner:
   - the launch gate's field and `allowed`, and the sleeping timer's guard;
   - the rails' guard (`clearOf`, `pinned`, and the `METEOR`, `maxEndY`, `planMeteor` and `copyReader` docs);
   - the phone's bar;
   - the farewell band (`clearOf`, `starts`, `room`);
   - `leaseHeld`;
   - the pointer guards.
5. Ran scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r10/`. Round 9's scripts were rerun on this snapshot, and one is new:
   - `shingles.mjs`: repeated 9- and 12-word runs, compared with round 9's input;
   - `secrefs.mjs` and `ac-map.mjs` and `h-map.mjs`: section references and the AC and H phase maps;
   - `cites.mjs`: every `file:line` resolved on cf4d7b8, then diffed with round 9's input;
   - `reviser-r9/bare.mjs`: bare `:n` references on changed lines;
   - `ac20/firstmin.mjs` (new): the first-minute count under P9's gap law over 200,000 visits, and the chance that at least 8 of 10 browser runs give 3 to 6.
6. Searched for split-era terms: PF, V, CP-0, CP-3 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file-by-file", "observed", "rebase".

## Round 9's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R9-1 | yes | The gate is one reused object that the worker refills every tick (`PLAN.md:2127`, and `:2331`: "as `frameState` is").<br>`field()` builds the field afresh on each call and only when the launch step plans (`:2137-2138`, `:2213`, `:2332`). That matches cf4d7b8, which builds it only past its due check and holds (`sky.worker.ts:220-226`).<br>From P9 the rails are padded once for both `quiet` and `pinned` (`:2332`).<br>The sleeping timer reads `meteorsAllowed(now)`, the one test the gate's `allowed` reads (`:2336`; cf4d7b8 `:163-165`, `:183`).<br>R-20 is unchanged (`:3567`).<br>It has one interaction with P12's new `room` hold: DRY-R10-2 (a). |
| DRY-R9-2 | yes | 6.10's "Their docs follow" (`:2596`) does both edits:<br>- `planMeteor`'s "above the side rails" becomes "clear of the copy in `clearOf`";<br>- `copyReader`'s caveat (`mountSky.ts:122-124`) names `clearOf`.<br>5.1 (`:338`), P9's files (`:3238`), CP-2 (`:3352`) and 8.4 (`:3390`) follow. `clearOf`'s doc (`:2580`) stays the one full statement.<br>cf4d7b8 has no other committed statement of the rails' guard. A search of `src`, `AGENTS.md` and `README.md` finds only `config.ts:281`, `meteors.ts:265` and `mountSky.ts:122-124`, and the plan covers all three. |
| DRY-R9-3 | yes | `config.ts:73` (`:467`) and `meteors.ts:226-228` (`:2609`). The citation resolver now maps both to the code the text means. Its two wrong resolutions (`renderSky.ts:73`, `mountSky.ts:226-228`) are gone. |

## Round 9's other changes and the restructure, through this lens

- **Single owners that still hold.**
  - `leaseHeld` (`:2192`) is the one lease test, read by `inkLeaseFree`, step 2.2's D12 hold and the comet's start rule.
  - `transientFade` calls `scrollKept`, and every transient draws through `transientQuietFactor`.
  - `ZONE_REACH` derives from `QUIET_REACH`, and `clearOf` reuses the planner's own `nearCopy: false` test.
  - `inkBudget`, `budgetKeeps`, `headGain` and `INK_BUDGET` are read only inside the veil's code.
  - No config is shared between the worker and the main thread. The activity interval and the pointer query live in `mountSky.ts`, and the store reads `REDUCED_MOTION_QUERY` from `@/lib/utils`.
- **The pointer guards (CG9-1)** are two one-line checks at the message boundary: the main thread's size test and clamp, and the worker's finiteness test. That is defensive, not duplicated logic.
- **The phone's bar (PHY9-1)** reads the same in 6.9 (`:2256`), AC-38 (`:3467`) and 2.2's phone row (`:99`).
- **The cuts round 9 made** each leave the fact in its owner, so nothing an implementer needs was lost:

  | Cut | Where the fact still lives |
  |---|---|
  | 6.9's lease paragraph | 4.2's `InkLease` row and `leaseHeld`'s doc |
  | 6.9's scroll-cancel sub-bullets | step 1's one sentence |
  | 6.10's `nearCopy: false` sentence | `PlanOptions.nearCopy`'s doc (cf4d7b8 `meteors.ts:51`) |
  | 6.11's T3 restatement | T3 |
  | the `drawMeteor` I7 restatement | 8.3's I7 row |
  | 8.1's phase pointers | P1 and P9 |
  | P9's fireball pointer | 7.0 |
  | D4's comet condition | 6.12 |
  | 4.2's frame-handle reasons | deviation 4 |

  6.10's `Steer` naming note only explained a name, so it needs no owner.
- **Stale split content.** Only section 3's history sentence remains, "D10 and D11 went with the wait for the veil commit" (`:157`), as in round 9.
- **Re-grounded references.**
  - Every bare `:n` on a line round 9 changed resolves to the right file and code: `:467`, `:1634`, `:2331`, `:2332`, `:2336` and `:2609`.
  - The citation resolver's 60 matches resolve to the code the text describes, apart from its known false positives (ratios such as `4.3:1`, and Markdown doc lines).
- **Repeated text.** The 12-word repeats are round 9's 21 less the cut lease and comet sentences, plus one: 6.11's "as T3 says" sentence, which cites T3. Nothing is copied from the research.
- **Two exceptions.**
  - AC-20 states H9's simulated-visit bar again, with a different number (DRY-R10-1). This predates round 9.
  - Round 9's farewell band (CA9-1) leans on three shared pieces it doesn't yet fit: the lazy field, `planMeteorTransient` and `clearOf`'s doc (DRY-R10-2).

## Verdict

**Pass.** No blocking or major finding. Two minor findings, each cheap and clearly right.

## Findings

### DRY-R10-1 (minor): AC-20 restates H9's first-minute bar as 90%, where H9 passes at 85%

- **Section.** 9.2 (AC-20); 7.1 (H9).
- **Problem.**
  - AC-20 and H9 judge the same measurement, the first minute of H9's 20,000 simulated visits, and give it two bars:
    - AC-20's pass column: "median 5 over H9's 20,000 simulated visits (3 to 6 in 90%)";
    - H9's: "3 to 6 in at least 85%".
  - AC-20's browser half rests on the 90%: "3 to 6 in ≥ 8 of 10 runs (a correct sky passes about 93% of the time)". At H9's 85% floor, the same check passes only 82% of the time. So a sky that H9 accepts can fail AC-20's browser check about one time in five.
  - Say an implementer's H9 run gives 88%. P9's clear-sky retries during the cooldown can push the share below the bare gap law's. That run passes H9, and the implementer can't tell whether AC-20 passed.
- **Evidence.**
  - `PLAN.md:3449` (AC-20) and `:2902` (H9). 2.1's "3 to 6 in about 90% of simulated visits" (`:78`) is a description, and it agrees with AC-20.
  - [computed] `dry-gate-r10/ac20/firstmin.mjs`: 200,000 visits under P9's gap law (a first delay of 4.5 to 7 s, then each class's duration plus 4 + Exp(8) s, capped at 30 s).
    - Median 5, with 3 to 6 in 90.2%. Round 1's check report has the same 90.2% (`drafts/check-r1-physics-math.md:305`).
    - The chance that at least 8 of 10 runs fall in 3 to 6: 0.933 at a share of 90.2%, 0.930 at 90% and 0.820 at 85%.
- **Fix.** Give the bar one owner.
  - H9 keeps the number, and AC-20 cites it: "median 5, with 3 to 6 at H9's bar (about 90% by design)".
  - AC-20 then gives its browser pass rate for the share H9 measures: about 93% at 90%, and 82% at 85%.

### DRY-R10-2 (minor): the farewell band (P12) leans on three shared pieces it doesn't yet fit

- **Section.** 6.12 (farewell meteors); 6.9 (`LaunchGate.field()`, steps 2.2 and 2.3, `planMeteorTransient`); 6.10 (`clearOf`); P12's files.
- **Problem.** Round 9 added the farewell band (CA9-1: a `clearOf` band above Contact, `starts` below it, and a `room(field)` hold). In the same round, and separately, it made the field lazy (DRY-R9-1). Where the band meets shared code, three gaps remain.
  - **(a) The field is built twice, and its doc stops being true.** `field()`'s doc says it is "built afresh on each call, so the launch step calls it only when it plans". From P12, step 2.2's `room(field)` hold also needs it, before step 2.3's plan builds it again. So each farewell attempt pads the zones twice.
  - **(b) The band has no way into the one launch path.**
    - The farewell body is "planned as the meteor kind plans, with that `clearOf` and `starts`". The meteor kind plans through `planMeteorTransient(context)`, which fills `clearOf` from `context.field.pinned` alone and has no `starts`.
    - So P12 must either widen that function or write a second launch loop. A copy would duplicate the pass order the veil session asked the port to keep (8.4, ask 1).
    - Where P10's variant decision sits, inside that function or around it, also decides whether farewell meteors can be fireballs. The plan doesn't say which.
  - **(c) `clearOf`'s doc lists only the rails.**
    - It reads "the side rails, whose links change color on hover and focus …".
    - From P12 it also carries the farewell band: a region of unmarked copy, not padded quiet copy.
    - P12's files don't extend that doc, which 7.0's rule asks of the phase that adds the use. It is the drift DRY-R9-2 fixed for `maxEndY`.
- **Evidence.**
  - (a): `PLAN.md:2137-2138` (`field()`'s doc), `:2207-2213` (steps 2.2 and 2.3), `:2332` ("only when the launch step plans").
  - 6.12's farewell row, `:2754`:
    - "while that band has no start area the spec's `room(field)` is false: a hold (step 2.2), never a failed plan";
    - "planned as the meteor kind plans, with that `clearOf` and `starts`".
  - P12's files, `:3317`: "`TransientSpec.scene` and `room`, step 2.2's holds" and "their spec in `meteorKind.ts` (with its `clearOf` band), the `starts` option in `meteors.ts`". The `clearOf` doc isn't listed.
  - (b):
    - `:2096-2105`: `planMeteorTransient(context: PlanContext)`, "each with the context's `nearCopy` and `ink` and, from P9, the field's `pinned` as `clearOf`";
    - `:2029-2043`: `PlanContext`, which has no `starts` and no extra zones;
    - `:3396`: ask 1;
    - `:3270`: P10, "the meteor spec decides fireballs before planning".
  - (c): `:2580` (`clearOf`'s doc) and `:2825` (7.0: "the phase that adds a kind or a constant extends the docs that name it").
  - Round 9 noted the farewell path without raising it (`audit/dry-gate-r9.md`, "Noted, not raised"). The new evidence is CA9-1's two farewell-only options, which have no channel into that path.
- **Fix.**
  - (a) The launch step builds the field once for each kind that is due and not otherwise held, and passes it to that kind's `room` (P12) and to its plan. `field()`'s doc becomes "built afresh on each call, so the launch step builds it only for a due kind it may plan".
  - (b) `planMeteorTransient` takes an optional second argument: extra `clearOf` zones and a `starts` area, added to each `planMeteor` call. The farewell spec's `plan` calls it, so the veil's pass order stays in one function. 6.12 and P12's files name that argument. 6.12 also says whether P10's decision step, and so fireballs, applies to farewell meteors.
  - (c) P12's farewell files add a clause to `clearOf`'s doc, for example "and, for farewell meteors, the sky above Contact".

## Summary

- **Round 9's fixes.** All three DRY fixes landed.
  - The launch gate is one reused object. Its field is built only when a kind plans, with the rails padded once, and the sleeping timer reads the gate's own `meteorsAllowed` test.
  - `copyReader`'s and `planMeteor`'s docs now name `clearOf` as the rails' guard, and no other committed doc names `maxEndY` for it.
  - The two bare references resolve to the right files.
- **The restructure and round 9's other changes.**
  - Every single owner in this lens still holds, and nothing re-implements a veil export.
  - No config is shared between the worker and the main thread.
  - Round 9's cuts lost nothing an implementer needs, and every re-grounded reference on a changed line resolves.
- **Two minor findings.**
  - **DRY-R10-1.** AC-20 restates H9's simulated-visit bar as 90% where H9 passes at 85%. At 85%, AC-20's browser check passes only 82% of the time. AC-20 should cite H9's bar.
  - **DRY-R10-2.** P12's farewell band leans on three shared pieces it doesn't fit yet:
    - a lazy field whose doc its `room` hold contradicts;
    - `planMeteorTransient`, which has no channel for the band or `starts`;
    - `clearOf`'s doc, which still lists only the rails.

## Noted, not raised

- **The cooldown rule's summaries.** R-10 (`:3557`) and the `TRANSIENTS` doc (`:2229`) still say the cooldown is set from the share P9 measures.
  - Round 9 (PHY9-1) made 6.9's rule H9's measured rates, and AC-38 and H9 follow it. On the phone the rate turns on the clear-sky fit rate, not the share.
  - R-10 points to 6.9, and the doc's parenthetical is process wording that 7.0 drops, so an implementer still follows 6.9.
- **`meteorsAllowed` keeps its meteor name and doc** ("True when a shooting star may launch at all right now", cf4d7b8 `sky.worker.ts:162`).
  - From P8 it is the one launch test for every kind (the gate's `allowed` and the sleeping timer), and from P12 it covers the end scene too.
  - Its siblings were renamed for that reason: `launches`, `heroLaunchMaxScroll`, `holdTransients`, `retryTransients`.
  - Naming belongs to the conventions audit.
- **The comet's start rule** (`:2755`) lists facts that overlap `meteorsAllowed`'s (full motion, the reveal, the hero scene), without presence or visibility. It is a could kind with rules of its own.
- **"A layout keeps the visit's sky"** appears in four committed docs besides RD1: `VisitMemory`, `MeteorMemory`, `VisitSky` and `forgetVisitSky`. These are lifecycle notes at each level, and they agree.
- **Still true from round 9's list:**
  - "a lease holder is active" is written in three places;
  - degrees per second to CSS px per second is written twice (`:2538`, `:2733`);
  - `SCROLL_CANCEL`'s 12 and 24 px recur in prose;
  - section 3's D10 and D11 sentence remains;
  - `ZONE_REACH`'s doc overclaims "Every 'clear of copy' test reads it" (`:1393`), with no value that can drift;
  - `pickVisitSky` will test the field's width;
  - 8.4's `METEOR` row summarizes 6.10's doc list.
- **Maps.** `ac-map.mjs` and `h-map.mjs` find the same three AC items and four H items as rounds 7 to 9:
  - P12 says "its acceptance item";
  - H2 reaches P6 and P7 through "the kill-switch identity (P1)";
  - P0 has its baseline lists;
  - P6 uses H6's medians.
