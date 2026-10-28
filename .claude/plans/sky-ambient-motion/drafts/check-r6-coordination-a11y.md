# Check round 6: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 6. I confirm that round 5's fixes in this lens landed, look for regressions from every round 5 and gate round 5 change that touches the lens, and report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md` "Confirmed veil interface (2026-10-27)":
  - names, signatures, rules, what is now private, the `AGENTS.md` precondition, and which items stay ours;
  - no edits to veil-owned code before V, and veil-dependent phases blocked on every branch the plan defines (4.4's reading, a file-by-file answer, a declined overlap, PF);
  - one ink lease;
  - every near-copy transient through `transientQuietFactor` and `scrollKept`;
  - every transient at 5 s or less.
- **Accessibility.** WCAG 2.2.2, 2.3.1 and 2.3.3; 1.4.3 through the per-rect budgets; 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `PLAN.md` (3,978 lines), its round 5 diff, my round 5 report and the reviser's dispositions.
  - The worktree's code at 246c0aa.
  - The main checkout's uncommitted veil diff, read only.
- **Outputs.** This file and the structured result.
- **Limits.** Planning only. I edited nothing in `src/`, in `PLAN.md` or in the main checkout. Scratch files are in the session scratchpad (`check-r6-a11y/`).

## Method

- **The round 5 changes.** I diffed `PLAN.md` at word level against the snapshot round 5 checked (`check-r5-completeness/PLAN.snapshot.md`, 18:28): 128 hunks, in `check-r6-a11y/r5.wdiff`. I read every hunk that touches this lens.
- **The current plan.** I re-read sections 1 and 3 (D1, D4, D10), 4.4, 5.1, 6.6 to 6.9, 6.11 to 6.13, all of 7 (every phase and PF), 8, 9.2, 11 and 12.
- **The observed names.** I checked them against the main checkout's working tree, read only. Its sky files last changed at 17:34 (`meteors.ts`), before round 5, so round 5's observations still hold. I read the `git diff` of:
  - `sky.worker.ts`: `planLaunch`, `contrastLevels`, `pendingLayout`, `applyLayout`, `settleQuiet`, `scrollKept` in `updateMeteor` and `draw`, and `sameRects` with `headroom`;
  - `scene.ts`: `scrollKept`, `transientQuietFactor`, `inkBudget` and `budgetKeeps`;
  - `meteors.ts`: `PlanOptions`, the private `PassOptions`, `headGain` and `WAKE_GAIN`;
  - `config.ts`: `LAYERS.far.inkKeep` 0, `STAR_INK_PEAK`, `QUIET_REACH`, `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS` and `SCROLL_CANCEL` (it doesn't touch `FRAME`, `ADAPT` or `SCENE`);
  - `color.ts` (`luminance` and `contrastRatio` stay private) and `AGENTS.md`.
- **Numbers.** I re-ran `farcopy.mjs` with Node 24.14 through the plan's resolve hook (7.1), on both trees.

## Round 5 dispositions in this lens

| ID | Verdict | Where |
|---|---|---|
| CA5-1 | Landed, for V:<br>- D10's early trigger (`PLAN.md:177`), CP-4 (`:3411`) and the V note (`:3231`);<br>- 8.5 step 4's baseline redo (`:3480`);<br>- 7.2's column and note (`:2959`, `:2977`);<br>- "Blocked on" in P1, P2, P3 and P5 (`:3003`, `:3038`, `:3075`, `:3135`).<br>One residual: the same branch has no path through PF (CA6-1). | D10, CP-4, V, 8.5, 7.2, P1 to P5 |
| CA5-2 | Landed: CP-0 (`:3438`), 8.6's row (`:3495`) and 4.4's decline clause (`:340`). A grep for `frameAt` finds no other pre-V edit: P7's lean enters through `cameraOffset`, not `frameAt` (`:914`). | CP-0, 8.6, 4.4 |
| CA5-3 | Landed. The comet is drawn at its fade-in × `scrollKept(launchScrollY, scrollY, boxFade)` and retires only when `scrollKept` reaches 0: 6.12 (`:2782`), AC-25 (`:3599`) and P12 (`:3354`). One small gap remains: the pause (CA6-2). | 6.12, AC-25, P12 |

Other lenses' round 5 fixes that touch this lens hold:

- **CG5-1 (`gather` in `demandNow`).** `schedule`, `tick` and `demandNow` are ours. The veil-owned handler bodies are unchanged, and `gather` only reads state.
- **DRY-R5-3 (`TRANSIENTS.scrollQuiet`).** It moves `FRAME.meteorScrollQuietMs` in P8, after V. The veil's working tree reads that key only in `updateMeteor` (main checkout `sky.worker.ts:217`), which P8 replaces.
- **DRY-R5-4 and SOC5-3 (the farewell meteors' gate).** They fly under the full veil, take the lease, keep `scrollKept`, and stay under 5 s. The veil session is told of launches over Contact and the footer. 7.0's gate puts P5 before P12.
- **C50 and CG5-3.** P8 never evaluates the cancel in the `scroll` handler. Its only edit there, after V, is the `parallaxScroll` write. This matches the working tree, which evaluates `scrollKept` in `updateMeteor` and `draw`.
- **PHY5-2 (the lean's pacing).** No accessibility effect. The lean stays off under reduced motion and while paused (`leanPending`'s full-motion test, `:2828`).

## Findings

### CA6-1 (major): the file-by-file branch has no path through PF

- **Sections.**
  - Section 1 (status); 3 D10; 4.4 (the file rule, the decline clause); 7.0.
  - 7.2: the diagram, P8's row and the note.
  - P1 ("Blocked on", "No visible change means"); PF steps 2 and 4; 8.5 step 4; 8.7 ("Then"); 8.2 CP-4; 12.1 R-1; 9.2 AC-26 and AC-35.
- **Problem.** Round 5 made D10's question fire early on a file-by-file answer to CP-0, or on a declined `frameAt` overlap, and one of its two live answers there is "run PF". The plan never says what happens to P1 to P7 after PF on that branch.
  1. **Every rule still says V.** P1 to P7 (or P1 step 2 through P7, on a declined overlap) "start at V". V never comes once the user has chosen PF.
  2. **P8 is stranded too.** It depends on "V, P3, P5", and P3 and P5 are among the phases waiting for V.
  3. **PF and 8.7 assume P1 to P7 exist.** PF step 4 merges "the integration branch (P1 to P7 and PF)", and 8.7 then runs "P8 to P12 on top of PF". Read literally, that branch deadlocks.
  4. **The baselines are stale on a PF tree.** Suppose the implementer infers that P1 may start after PF. PF step 2 sets `LAYERS.far.inkKeep` to 0, the same change that made 8.5 step 4 redo P0's baselines at V. Nothing redoes them for PF, so these checks compare against 246c0aa and can't pass:
     - P1's "H2's lists equal P0's" and "the P0 screenshots match pixel for pixel";
     - AC-35;
     - AC-26's "identical to P0's at scroll 0" in P2, P5, P6 and P7.

  This is the PF twin of CA5-1, which round 5 fixed for V only.
- **Evidence.**
  - **"At V" everywhere.**
    - `PLAN.md:19`: "on a file-by-file reading they start at V".
    - `:324` (4.4): "every phase that edits one of their paths starts at V".
    - `:340`: a declined `frameAt` overlap "waits for V (... P1 step 2, P2, P4 and P6, and through P2 everything up to P7 ...)".
    - `:2850` (7.0) and `:2977` (7.2's note: "becomes 'at V'").
    - `:3003` (P1: "On a file-by-file answer P1 starts after V, on P0 baselines redone there (8.5 step 4)").
  - **PF is offered on that branch.** `:177` (D10: "on a file-by-file answer to CP-0 or a declined `frameAt` overlap ... ask the user ... to keep waiting, run the fallback PF (8.7), or merge P1 to P7 early (alternatives; void on that branch, where P1 to P7 wait for V)"); `:3411` (CP-4).
  - **The PF route skips P1 to P7.**
    - `:2956`: "PF fallback ─► then P8 to P12 as above".
    - `:2970`: P8 depends on "V, P3, P5".
    - `:3383`: PF step 4, "the integration branch (P1 to P7 and PF) reaches master ... Then P8".
    - `:3543`: 8.7, "P8 to P12 run on top of PF, as planned".
    - `:20`: "If that work is abandoned, they [P8 to P12] run after the fallback PF".
    - `:3699`: R-1, "P1 to P7 need nothing from it to be built".
  - **Baselines.** `:3480` (8.5 step 4 redoes P0's steps 3 and 4 only "on the rebased tree"); `:3022-3026` (P1's identity); `:3609` (AC-35); `:3600` (AC-26); `:3384` (PF's own visible change: "Far stars no longer show on the letters of quiet copy themselves").
  - **Code.**
    - `drawLayer` multiplies alpha by the layer's quiet factor (`renderSky.ts:120`) and skips stars under `MIN_STAR_ALPHA` (`:126`).
    - `config.ts:78` has the far `inkKeep` at 0.1.
    - PF step 2 sets it to 0 (`PLAN.md:3383`), as the veil's working tree does.
  - **[computed, `check-r6-a11y/farcopy.mjs`, the real `cellStars` at 1440 × 900 with stand-in hero text rects]**
    - Worktree at 246c0aa: 30 of the 212 far stars on screen sit on the copy, and all 30 are drawn at `inkKeep` 0.1.
    - Main checkout (`inkKeep` 0): none of them is drawn.
- **Fix.**
  - **Unblock after PF.** In section 1, 4.4 (`:324`, `:340`), 7.0, 7.2's note and P1's "Blocked on", say "at V, or after PF when D10 picks it". PF's handshake hands the veil's files over, so the file rule no longer holds them.
  - **Order the PF route.** In PF and 8.7, on a file-by-file answer or a declined `frameAt` overlap:
    - PF runs first;
    - then P1 to P7, from P1 step 2 on a declined overlap, on the PF tree in 7.2's order (P5 before P4 and P6);
    - then P8.

    PF step 4's "(P1 to P7 and PF)" then reads "(PF, and P1 to P7 where built)".
  - **Redo the baselines.** Before P1 (or its step 2) on that route, redo P0's steps 3 and 4 on the PF tree, since PF's `inkKeep` 0 removes far stars from the copy as V's does. "P0's" in P1, AC-26 and AC-35 then means that baseline: 8.5 step 4's sentence, repeated for PF.
  - **Small consistency edits.**
    - P8's "Depends on" reads "V or PF, P3, P5".
    - D10's "where P1 to P7 wait for V" reads "wait for V or PF".
    - CP-4 marks the early-merge option void on that branch, as D10 does.
    - R-1 qualifies "need nothing from it to be built" with "on 4.4's reading".
    - Optional: 7.2's note drops "(and the planet's)", since the planet follows P2, which waits too. P13's heading "not on the veil" gains "(on 4.4's reading)".

### CA6-2 (minor): how the comet leaves on a pause is unspecified

- **Sections.** 6.12 (the static comet row), 9.2 AC-25, and P12's description of `bodies.ts`.
- **Problem.**
  - The comet "never shows under `motion: 'reduced'`", which is what a pause sends. But it isn't a transient, so T4 (the pause fade through `scrollKept`) and `cancelTransients` don't reach it.
  - 6.12 passes only the box fade as `scrollKept`'s `fade`. So a pause while the comet shows has no defined behavior. An implementer who gates the drawing on `motion === 'full'` cuts the comet in one frame and brings it back in one frame on Play. That breaks the plan's own rule, "Everything ends through light: a fade, never a cut" (6.9), and it is an onset that draws the eye.
  - The confirmed interface already gives the rule: "A pause or cancel fade goes in as fade and can only dim".
- **Evidence.**
  - `PLAN.md:2782` (6.12: "It never shows under `motion: 'reduced'`"; "Its box fade, a one-way cancel fade, goes in as `fade`").
  - `:309` (T4 covers transients only).
  - `:1997` ("a pause fades it out over 0.2 s").
  - `:3599` (AC-25: "never under reduced motion").
  - `:108` (2.2's "Pressing pause" row doesn't mention the comet).
  - `COORDINATION.md:89`.
  - A grep for "comet" with "pause" or "reduced" finds no other rule.
- **Fix.**
  - In 6.12, pass the box fade times a pause fade (the same `TRANSIENTS.cancelFade` smoothstep that `cancelLevel` gives transients) as `scrollKept`'s `fade`. A pause or a switch to reduced motion then fades the comet out over 0.2 s, and at 0 it is gone for the page view, like every transient.
  - Say the same in AC-25 and in P12's `bodies.ts` entry ("fades: fade-in, box and pause").

## Checked and holding (no finding)

- **The confirmed interface.**
  - The plan matches it name for name: `SkyRect.headroom`, `INK_BUDGET`, `STAR_INK_PEAK`, `METEOR_VEIL`, `METEOR_PASS`, `SCROLL_CANCEL`, `QUIET_REACH`, `inkBudget`, `budgetKeeps`, `scrollKept`, `transientQuietFactor`, `QuietKeeps`, `PlanOptions`, the private `planFlight` and `PassOptions`, `Meteor.nearCopy`, `headGain`, `WAKE_GAIN`, `drawMeteor`'s `fade`, `launchScrollY`, `planLaunch`, `contrastLevels`, `applyLayout`, `settleQuiet` and `copyReader`.
  - The `veiledFrom` rules are untouched. P9 only passes the course's peak to the observed `peak` parameter.
  - What is private: the plan imports none of `fitKeep`, `luminance` or `contrastRatio`, and exports no `segmentTouches` (8.3, PF).
  - The `AGENTS.md` precondition matches the working tree's line and binds D1 (a) and (b).
  - Items 2 and 3 (light curve, drag) are left to this plan and not needed. The direction source is ours after V.
- **Before V.**
  - These stay off limits: the `scroll` and `layout` handler bodies, `applyLayout`, `quietBlend`, `settleQuiet`, `updateMeteor`, `planLaunch`, the planner, `drawMeteor`/`drawTrain`, `LAYERS` and the quiet math.
  - The two overlaps are requests in CP-0.
  - `FRAME`, `ADAPT` and `SCENE`, which P3 to P7 document or extend, aren't in the veil's diff.
- **The lease and the transients.**
  - One lease (`inkLeaseFree`), held by `nearCopy` and released on retire.
  - I9's two-way fallback, including `cometShowing`.
  - Every kind goes through `transientFade` (`scrollKept` with the pause fade) and `transientQuietFactor`, and clear-sky kinds through `CLEAR_SKY_KEEPS`.
  - Lifetimes: fireball 4.9 s, satellite 4.8 s, earthgrazer about 4 s, burst span at most 5 s, point flash 0.5 s. A cancel never extends a life.
- **Accessibility.**
  - **2.2.2.** P5 merges before P4, P6 and P9 to P12. On a file-by-file answer, 7.2's order keeps that.
  - **2.3.1.** Tints at most 0.42, and the burst stagger is at least 0.35 s.
  - **2.3.3.** The springs and the lean hold under reduced motion and while paused.
  - **1.4.11.** The glyph is 14.1:1. The ring is the global dashed outline, `globals.css:80-83`, verified.
  - **2.5.8.** 40 × 40.
  - **2.4.11.** The header shows itself on focus, and the control is `inert` under the phone menu.
  - **Forced colors.** The sky and the control are hidden, and `ready` never comes under `'off'`.
  - **`prefers-contrast: more`.** `ink` 0, and the veil's `PlanOptions.ink` doc says no flight is aimed at copy then.
  - **`data-sky-quiet`.** Kept. Only D1 (a) would touch `Introduction.tsx`.

## Summary

- **Round 5.** All three of my round 5 findings landed, and the other lenses' round 5 fixes caused no regression in this lens.
- **CA6-1 (major).** On a file-by-file answer to CP-0, or a declined `frameAt` overlap, D10 now offers PF early. But the plan still holds P1 to P7 "at V", so on that branch:
  - P8 stays stranded behind P3 and P5;
  - PF step 4 and 8.7 assume P1 to P7 were built;
  - P0's baselines aren't redone after PF's `LAYERS.far.inkKeep` 0, so P1's identity checks, AC-26 and AC-35 can't pass.

  The fix is to unblock those phases after PF, in 7.2's order, with the same baseline redo as 8.5 step 4.
- **CA6-2 (minor).** The comet "never shows under reduced motion", but the plan doesn't say how it leaves on a pause. The fix is to pass the pause fade into `scrollKept`'s `fade` with the box fade, as every transient does.
- **Verdict:** revise (one major).
