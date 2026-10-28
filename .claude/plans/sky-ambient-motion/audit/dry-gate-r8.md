# DRY audit of PLAN.md, gate round 8

## Scope

- **Role.** Auditor, scope "dry", gate round 8. This is one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself (sections repeating each other, research copied instead of linked), and over-engineering against "defensive but not over-engineered".
  - Whether round 7's DRY fixes (DRY-R7-1 to DRY-R7-3) landed and what they broke, and the post-commit restructure through this lens: stale content from the old before/after-V split, anything lost that an implementer needs, and the re-grounded `file:line` references.
- **Inputs.**
  - `PLAN.md` as read on 2026-10-27: 3,664 lines, 58,038 words, sha256 prefix `4a0f1c47c1918697` (a copy is in the scratch folder, `dry-gate-r8/PLAN.snapshot.md`). Every `PLAN.md:n` below refers to it.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree"), `research/01-planning-brief.md`, `REVIEW-LOG.md` (round 7's rows and "Post-commit restructure (cf4d7b8)"), and round 7's `audit/dry-gate-r7.md`.
  - The code baseline cf4d7b8, read only at `.claude/worktrees/sky-baseline-cf4d7b8`. Every `file:line` below cites it.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in any checkout. Findings stay inside the DRY scope, and the contract is `COORDINATION.md`.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then `REVIEW-LOG.md`.
2. Word-diffed round 7's input (`PLAN.before-r7.md`, identical to `dry-gate-r7/PLAN.snapshot.md`, sha256 `3608510232f8622f`) against the reviser's output (`PLAN.before-restructure.md`), and that against this snapshot (`dry-gate-r8/r7-reviser.wdiff`, `restructure.wdiff`). Every round-7 fix and every restructure edit was read in context.
3. Read cf4d7b8's `sky.worker.ts`, `scene.ts`, `config.ts`, `meteors.ts`, `renderSky.ts` and `mountSky.ts` in full, and the cited parts of `protocol.ts`, `catalog.ts`, `skyAssets.ts`, `SidePane.tsx`, `IntroGate.tsx` and `utils.ts`.
4. Listed every copy of each fact that round 7 or the restructure changed (`fadeOutAt` and its callers, the farewell kind's files, `ZONE_REACH`, the moved `sameRects`, the parallax removal, `quietEasing`, 8.4's rule) and compared each copy with its owner. Searched for split-era terms (V, PF, CP-0 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file-by-file", "observed", "rebase", "integration branch").
5. Scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r8/`:
   - `ac-map.mjs` and `h-map.mjs` (round 7's): 9.2's and 7.1's Phase columns against each phase's section;
   - `shingles.mjs`: word runs of 10 and 14 repeated across lines (copy-paste duplication);
   - `secrefs.mjs`: section references against headings (all resolve);
   - `cites.mjs`: the 55 file-qualified sky citations, printed with the cf4d7b8 line each points at (all right; the bare `:n` worker and planner citations in 6.1, 6.2, 6.6, 6.9 and 6.10 were checked by hand, also all right);
   - `tc/thin.ts`: the plan's `pacing.ts` helpers and P6's thin-fade calls under `tsc --strict` (TypeScript 6.0.3 from the main checkout's `node_modules`, read only).

## Round 7's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R7-1 | yes | (a) The overlap list it targeted went with 8.6 and CP-0; 6.1 (`PLAN.md:889`) and P6's files (`:3142`) name `gather` in `frameAt`, and 8.4's `frameAt` row (`:3391`) lists only what stays the veil's. (b) P12's farewell files name `scene.ts` (`SceneLevels.launchScene`), `SCENE.endLaunchLevel` and `scene: 'hero'` in both specs (`:3316`); 5.1's `scene.ts`, `transients.ts` and `satellites.ts` rows add P12 (`:321`, `:327`, `:331`); T6 names the exception, and 6.12 says H7 and AC-20 gain it with the kind (`:303`, `:2758`). (c) 6.6 gives `twinkleLevel`'s P4, P5 and P6 bodies (`:1635`). (d) 1.1 cites `REVIEW-LOG.md` (`:42`). |
| DRY-R7-2 | yes | The restructure deleted the file-by-file rule with all its copies. 4.4 is one paragraph (`:311`) pointing to 8.4's rule (`:3377`), which 7.0 cites (`:2821`). No "file-by-file", PF, CP-0 or "starts at V" remains. |
| DRY-R7-3 | yes, with a regression | `fadeOutAt(since, duration, t)` in `pacing.ts` (`:1086`; P6 in 5.1, `:323`, and in P6's files, `:3138`) serves the thin fade (`:3153`), `transientFade`'s pause fade (`:2191-2193`) and the comet's box and pause fades (`:2759`, `:3316`, AC-25 `:3459`). No `cancelLevel` remains, 6.9's `cancelFade` sentence names the comet's box fade (`:2258`), and P8's dependency on P6 says why (`:3197`, 7.2 `:2938`). The regression: P6 now declares `thinnedAt` null before step 1 but still passes it to `easing` and `easeEnded`, which take a number (DRY-R8-1). |

## The restructure, through this lens

- **Stale split content.** None that an implementer would act on. Two history phrases remain (noted below): 8.1's "What the old checkpoint V did now lives in the phases" (`:3346`) and section 3's "D10 and D11 went with the wait for the veil commit" (`:157`).
- **Lost content.** Nothing an implementer needs. The deleted 4.4 lists, 8.1's stable seams, CP-0's message, 8.5's steps, 8.6's hotspot table and 8.7 served the wait. Their surviving rules now sit in 8.4 (the veil rule and one row per symbol), in 6.x (`ZONE_REACH`, the moved `sameRects`, `quietEasing`, the parallax removal, the `easedQuietFactor` import), in 7.0 (the PR route) and in P9 (the cooldown measurement). One exception lost its condition: 6.6's "`settleQuiet` may adopt it" used to say "after V" and now contradicts 8.4 (DRY-R8-3).
- **Single owners after the move.**
  - `ZONE_REACH` derives from the veil's `QUIET_REACH` from P1 (`:1395`).
  - The moved `sameRects` keeps its `headroom` comparison, and the worker's layout handler and the quiet index both import it (`:1495`).
  - `demandNow` uses the veil's `quietEasing(t)`, not a copy (`:1192`, `:1215`).
  - 8.4's rows match `COORDINATION.md`'s answer 1 list; the only symbols missing are ones no phase touches (the `HAZE_*` docs, `inkAt`, `LayoutMessage`).
- **Still true.** Nothing re-implements a veil export. `transientFade` calls `scrollKept`; every transient and the comet draw through `transientQuietFactor`; `inkBudget`, `budgetKeeps`, `headGain` and `INK_BUDGET` are read only inside the veil's own `drawMeteor` and `veiledFrom` (and in H3's harness). No config is shared between the worker and the main thread: the activity interval, the event list, `LEAN_POINTER_QUERY` and the pause key live on the main thread only, and `REDUCED_MOTION_QUERY` gets one sky reader (`skyPause.ts`).
- **Re-grounded references.** Every citation checked against cf4d7b8 points at the code the text describes (Method, step 5).

## Verdict

**Pass.** No blocking or major finding. Three minor findings, each cheap and clearly right.

## Findings

### DRY-R8-1 (minor): the thin fade passes one `thinnedAt` to helpers with two conventions for "not begun"

- **Section.** P6 ("Recommended within P6"); 6.2 (`pacing.ts`: `easing`, `easeEnded`, `fadeOutAt`); H4.
- **Problem.**
  - Round 7's fix made `fadeOutAt(since: number | null, …)` the one one-way fade and has P6 say "`thinnedAt` is null before step 1".
  - P6 also passes the same `thinnedAt` to `easing(since: number, …)` (in `demandNow`'s `fading`) and to `easeEnded(since: number, …)` (for its last frame). Under the repository's `strict` TypeScript, `let thinnedAt: number | null = null` then fails type-check twice (TS2345).
  - The obvious type fix, starting `thinnedAt` at −Infinity as `motionLevel.since` does, breaks `fadeOutAt` instead: `fadeOutAt(−Infinity, 1, t)` is NaN, because smoothstep divides ∞ by NaN.
  - So the ease helpers now have two ways to say "hasn't begun": null for the one-way fades (`fadeOutAt`, `TransientEnvelope.cancelledAt`) and −Infinity for `Ease.since`. The thin fade uses both. The plan was consistent before round 7's revision, which gave `thinnedAt` no starting value and wrote the ramp out by hand.
- **Evidence.**
  - `PLAN.md:1076` (`easing(since: number, …)`), `:1081` (`easeEnded(since: number, …)`), `:1086` (`fadeOutAt(since: number | null, …)`).
  - `:3153` ("`thinLevel`, `fadeOutAt(thinnedAt, ADAPT.thinFade, t)` … `thinnedAt` is null before step 1"), `:3155` ("`demandNow`'s `fading` also covers `easing(thinnedAt, ADAPT.thinFade, t)`, and `easeEnded` asks for one more frame when it ends").
  - `:844` (`motionLevel: Ease = { …, since: -Infinity }`), `:2023` (`cancelledAt: number | null`), `:2901` (H4: "`easing` and `easeEnded` mark the ends of the motion ease and the thin fade").
  - cf4d7b8 `tsconfig.json`: `"strict": true`. Round 7's input wrote `1 − smoothstep(thinnedAt, thinnedAt + ADAPT.thinFade, t)` with no starting value (`PLAN.before-r7.md:3199`).
  - [computed] `tsc` 6.0.3 with `--strict`, run on the plan's three helpers and P6's three calls (`dry-gate-r8/tc/thin.ts`), reports `TS2345: Argument of type 'number | null' is not assignable to parameter of type 'number'` at the `easing` call and at the `easeEnded` call. Under Node, `fadeOutAt(-Infinity, 1, 5)` returns NaN and `easing(-Infinity, 1, 5)` returns false.
- **Fix.**
  - Give the one-way fades one convention. `easing(since: number | null, duration, t)` and `easeEnded(since: number | null, duration, t, drawnAt)` return false while `since` is null (`since !== null && …`), just as `fadeOutAt` returns 1 then.
  - P6 then passes `thinnedAt` to all three helpers as written, H4's thin-fade rows add the null case, and `motionLevel.since` (a number) still type-checks.
  - A smaller alternative: P6's two calls become `thinnedAt !== null && easing(thinnedAt, …)`, and the same for `easeEnded`.
  - Either way, P6 shouldn't start `thinnedAt` at −Infinity to satisfy the types.

### DRY-R8-2 (minor): the launch gate's `narrow` has no stated source beside `narrowScreen`

- **Section.** 6.9 ("In the worker" and `LaunchGate`); 6.1 (`narrowScreen`).
- **Problem.**
  - P6 adds `narrowScreen`, set in `resize`, as the worker's one narrow-screen fact (round 4's DRY-7). `gather` and the drift cap read it.
  - P8's `LaunchGate.narrow` feeds `PlanContext.narrow`, the `phones` and `narrowLimit` holds and `nextAfter`. It is filled by `launchGate(now)`, whose bullet names `allowed`, `settled`, `field` and `ink` but not `narrow`, and the field has no doc.
  - The code being ported computes `const narrow = width <= NARROW_MAX_WIDTH` inside `updateMeteor`. A literal port therefore puts a second definition of the same fact in the worker, beside `narrowScreen`.
  - `narrowScreen`'s doc explains its name by "the shooting-star launch code ... uses for its locals", and P8 removes that code.
- **Evidence.**
  - `PLAN.md:845-846` (`narrowScreen` and its doc), `:862` (`driftGate.narrow = narrowScreen`), `:1214` (the drift cap).
  - `:2139` (`LaunchGate.narrow: boolean`, no doc), `:2334-2335` (the `launchGate` bullets), `:2045` (`PlanContext.narrow`), `:2221` (`spec.nextAfter(…, gate.narrow)`).
  - cf4d7b8 `sky.worker.ts:221` (`const narrow = width <= NARROW_MAX_WIDTH`), `:432-433` (`resize` sets `width`), `:246` (`planLaunch`'s `narrow` parameter).
  - `REVIEW-LOG.md:196` (DRY-7: "`narrowScreen` is set in `resize`").
- **Fix.**
  - 6.9's `launchGate` bullet adds "its `narrow` is `narrowScreen` (6.1)", and `LaunchGate.narrow` gets a doc saying so.
  - `narrowScreen`'s doc becomes "A narrow screen (NARROW_MAX_WIDTH), set in resize: the drift's `narrow` and, from P8, the launch gate's". This drops the sentence about the launch code's locals.

### DRY-R8-3 (minor): two passages invite edits to veil functions that 8.4, the rule's owner, keeps unchanged

- **Section.** 6.6 ("The last frame"); 12.1 (R-20); 8.4 (the rule and its `quietBlend`/`settleQuiet` row); 8.3 (I8).
- **Problem.**
  - 8.4 owns the veil-symbol rule ("use them, extend them through options, never rewrite them"). Its row lists `quietBlend` and `settleQuiet` as "unchanged"; only the layout branch's `retryMeteors` changes.
  - Two other passages still license changes to those functions:
    - 6.6 says `easeEnded` "is the test `settleQuiet` (`sky.worker.ts:301`) makes for the quiet ease … `settleQuiet` may adopt it". Round 4's DRY-6 allowed this only "after V". The restructure dropped every "after V" clause, so the invitation now stands from P5, against 8.4.
    - R-20's mitigation caches "the zone arrays per scroll and layout, keeping `quietBlend`'s output (8.4)". That is a change inside `quietBlend`, which 8.4 doesn't mention; 8.3's I8 records that the veil commit declined this cache.
  - An implementer who follows either passage rewrites a veil function that the rule's owner says stays as it is, and 8.4 no longer lists every exception to its own rule.
- **Evidence.**
  - `PLAN.md:1690` ("That is the test `settleQuiet` (`sky.worker.ts:301`) makes for the quiet ease, and P6's thin fade uses it too; `settleQuiet` may adopt it").
  - `:3576` (R-20). `:3377` (8.4's rule) and `:3394` (the row: `quietBlend`, `applyLayout`, `settleQuiet`, … "unchanged, except that the `layout` branch's `retryMeteors` becomes `retryTransients`"). `:3372` (I8: "No `quietBlend` cache (R-20)").
  - cf4d7b8 `sky.worker.ts:295-302` (`settleQuiet`, its ease-ended test at `:301`) and `:264-272` (`quietBlend`, which builds new zone arrays on every call).
  - `REVIEW-LOG.md:194` (DRY-6: "`settleQuiet` may adopt them after V"), `:149` (the restructure: "every 'after V', 'from V', PF and '8.5'/'8.6'/'8.7' clause is gone").
- **Fix.** Keep 8.4 as the one statement of what may change in a veil symbol.
  - 6.6 drops "`settleQuiet` may adopt it": the veil keeps its own test, and `easeEnded` serves our eases. Or 8.4's row lists that adoption as an allowed edit that keeps the veil's behavior.
  - R-20 keeps its contingency but points at the rule. 8.4's `quietBlend` row adds "unless B-1 fails: then R-20's cache of the zone arrays, with the same output", and R-20 cites that row.

## Summary

- Round 7's three DRY fixes landed. `fadeOutAt` is now the one one-way fade, the file-by-file rule and its copies are gone, and the farewell kind's files and the `gather` mention are complete. The restructure kept every single owner in this lens: `ZONE_REACH` from `QUIET_REACH`, the moved `sameRects` with `headroom`, `quietEasing` reused, 8.4 as the one veil rule. It lost nothing an implementer needs, and its re-grounded citations hold on cf4d7b8. Nothing re-implements a veil export, and no config is shared between the worker and the main thread.
- Three minor findings:
  - DRY-R8-1: round 7's `fadeOutAt` fix made `thinnedAt` null before step 1, while P6 also hands it to `easing` and `easeEnded`, which take a number. Type-check fails twice, and the −Infinity workaround makes `fadeOutAt` return NaN.
  - DRY-R8-2: the launch gate's `narrow` has no stated source, so porting `updateMeteor` would define the narrow-screen fact a second time beside `narrowScreen`.
  - DRY-R8-3: 6.6 (settleQuiet adopting `easeEnded`) and R-20 (a `quietBlend` cache) license edits to veil functions that 8.4's rule and row keep unchanged.
- Noted, not raised:
  - P8's only dependency on P6 is `fadeOutAt` (`:3197`), which lands with the thin fade (`:3138`), a "Recommended within P6 (do it)" step (`:3150`). If that step were ever dropped, `fadeOutAt` must still land, since `transientFade` needs it.
  - The comet's light, its fade-in × `scrollKept(launchScrollY, scrollY, boxFade × pauseFade)` with each fade a `fadeOutAt` over `TRANSIENTS.cancelFade` (`:2759`), restates `transientFade`'s composition (`:2191-2193`) in `bodies.ts`. If D4 picks the comet, one exported `keptLight(launchScrollY, scrollY, cancelledAt, now, extra = 1)` could serve both. D4's default doesn't ship it.
  - "A lease holder is active" (`active.some((transient) => transient.nearCopy)`) is written in `inkLeaseFree` (`:2197`), in D12's hold (step 2.2, `:2214`) and in the comet's start rule (`:2759`). It is one short predicate.
  - Turning degrees per second into CSS px per second (`× π/180 × view.focal`) is written in the steer (`:2539`) and for satellites (`:2737`), and the earthgrazer row (`:2757`) does the same conversion in prose. They are two short products.
  - 5.4's verification bullets (`:395-396`) restate 7.0's commands (`:2832`, `:2834`): the full reload before `get_errors` and the production build at the end of each phase. 7.1 already cites 7.0 (`:2854`); 5.4 could keep the docs' reasons and cite 7.0.
  - Two history phrases from the old split: 8.1's "What the old checkpoint V did now lives in the phases" (`:3346`), whose list restates P1's and P9's verification and 9.2's Phase column, and section 3's "D10 and D11 went with the wait for the veil commit" (`:157`). Neither changes what gets built.
  - The veil's `SCROLL_CANCEL` distances (12 and 24 px) are restated in prose in nine places (`:53`, `:164`, `:1976`, `:2204`, `:2258`, `:2759`, `:2904`, `:3367`, `:3474`). With 8.5 step 5 gone, CP-1's "recheck 8.4's rows" (`:3356`) is the guard. The values are committed in cf4d7b8, so only a veil follow-up could make them stale.
  - cf4d7b8's `mountSky` already has a `syncMotion` (`mountSky.ts:310`). 6.8's sketch declares one (`:1951`) that replaces it, as P5's files imply ("`syncMotion` with its dedupe", `:3102`). A line reference in the sketch would make that explicit.
  - Still true from round 7: `demandNow` and `updateCamera` each build the lean input. If D4 picks farewell meteors, their spec should reuse `planMeteorTransient` rather than wrap `planMeteor` again.
  - Maps: `ac-map.mjs` finds the same three items as round 7 (P12 names "its acceptance item"). `h-map.mjs` finds that H2's Phase column lists P6 and P7, whose sections call it "the kill-switch identity (P1)", which means the same thing.
