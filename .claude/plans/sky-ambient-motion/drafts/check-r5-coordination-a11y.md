# Check round 5: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 5. I confirm that round 4's fixes in this lens landed, look for regressions, and report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md` "Confirmed veil interface (2026-10-27)". I checked:
  - names, signatures, rules, what is now private, and the `AGENTS.md` precondition;
  - which items stay ours;
  - no edits to veil-owned code before V, and veil-dependent phases still blocked;
  - one ink lease;
  - every near-copy transient going through `transientQuietFactor` and `scrollKept`;
  - every transient at 5 s or less.
- **Accessibility.**
  - WCAG 2.2.2, 2.3.1 and 2.3.3.
  - 1.4.3 through the per-rect budgets.
  - 2.4.11, 2.5.8 and 1.4.11 for the control.
  - Reduced motion, forced colors and `prefers-contrast`.
  - `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `PLAN.md`, my round 4 report and the reviser's dispositions.
  - The worktree's code at 246c0aa.
  - The main checkout's uncommitted veil diff, read only, to see how the confirmed interface is taking shape.
- **Outputs.** This file and the structured result.
- **Limits.**
  - Planning only. I edited nothing in `src/`, in `PLAN.md` or in the main checkout.
  - Throwaway scripts are in the session scratchpad (`ca5/`).

## Method

- I read all of `PLAN.md` that bears on this lens:
  - sections 1, 1.1, 2.2, 3, 4 and 5;
  - 6.4, 6.6 to 6.13 and 7;
  - 8, 9, 11 and 12;
  - the check and audit logs.
- I checked each claim against `COORDINATION.md:70-136` and the code at 246c0aa. The code I read:
  - `sky.worker.ts` (`frameAt`, the message handlers);
  - `renderSky.ts` (`drawLayer`);
  - `mountSky.ts`;
  - `Navbar.tsx`, `globals.css` and `Background.module.css`;
  - `config.ts`.
- I compared the plan's "observed" names with the veil session's working tree:
  - `git diff` in the main checkout, read only;
  - `planLaunch`, `contrastLevels`, `pendingLayout`, `applyLayout` and `settleQuiet`;
  - `scrollKept`, `transientQuietFactor`, `budgetKeeps` and `inkBudget`;
  - the four-argument `veiledFrom`, `drawMeteor`'s `fade`, `copyReader` and the `AGENTS.md` line.
- I recomputed numbers with Node 24.14, loading the worktree's TypeScript through the plan's resolve hook (7.1):
  - PF's bound: L(0.75) = 0.5853, so a veiled head adds 0.5853 × (2 × 0.05 + 0.52 × 0.05²) = 0.0593 × peak.
  - The control's contrast: 14.13:1 on navy, 12.71:1 on light navy.
  - Two exposure checks, both below the bar (see "Checked and holding").
  - The far-star change at V that CA5-1 relies on.

## Round 4 dispositions in this lens

| ID | Verdict | Where |
|---|---|---|
| CA4-1 | Landed. One residual: the file-by-file branch it added isn't carried through the rest of the plan (CA5-1). | Section 1 (`PLAN.md:19`), 4.4 (`:317-322`), 7.0 (`:2827`), CP-0 (`:3382`, `:3409`), P0 (`:2973`), P1 (`:2978`) |
| CA4-2 | Landed. PF lists what it lacks. The 0.0593 × peak bound recomputes. H10, `METEOR_BRIGHTNESS`, `Course.peak`, AC-30 and section 11 are qualified, and nothing exports `segmentTouches`. | `:3357`, `:3508`, `:2912`, `:2439-2440`, `:2567`, `:3579`, `:3657`, `:3400` |
| CA4-3 | Landed. P2 leaves `LAYERS` to V. CP-0 names `LAYERS` and the adjacent edits. | `:3015`, `:3411`, `:3415`, `:3458` |
| CA4-4 | Landed: `scrollKept`, never under reduced motion, `LaunchGate.cometShowing`, AC-26's planet re-baseline. One slip: the fade-in passed as `fade` (CA5-3). | `:2759`, `:3574`, `:3575`, `:3329`, `:3403` |
| CA4-5 | Landed: `aria-label`, so the control is one quiet rect. | `:1891`, `:168` |

I also checked other lenses' fixes that touch this lens, and each holds:

- NJ-2: the last unsubscribe forgets Play, which errs toward reduced motion. PB1 and H12 match.
- CONV-4: `aria-label`, and section 11's 2.5.3 row.
- DRY-1: the comet uses `scrollKept`.
- DRY-2: `segmentClear` uses only exported `quietAt`, and no `segmentTouches` export.
- SOC-3 and DRY-4: `CLEAR_SKY_KEEPS` is picked in one place.
- SOC-7: `parallaxScroll` retires only after V, and CP-2 reports it.

## Findings

### CA5-1 (major): the file-by-file branch added in round 4 isn't carried through the gates and baselines

- **Sections.** 3 D10; 7.3 "Checkpoint V"; 8.2 CP-4; 7.3 P0 (steps 3 and 4) and P1 ("No visible change means"); 9.2 AC-26 and AC-35; 7.2's "Blocked on the veil?" column; P2, P3 and P5 "Blocked on".
- **Problem.** Round 4 made P1 to P7 (and P13) conditional. If CP-0's answer reads the file rule file by file, every phase that edits the veil session's paths starts at V. Three parts of the plan still assume P1 to P7 run before V.
  1. **The stop-waiting question is never asked on that branch.** D10, CP-4 and the Checkpoint V note ask the user only when "P7 [is] merged or skipped while the veil commit still hasn't landed". On the file-by-file branch, P7 can't merge before V. So if the veil work stalls, the session waits indefinitely, which the Checkpoint V note says it must not do. D10's third answer ("merge P1 to P7 early") also means nothing there, since nothing is built.
  2. **The identity baselines are stale on that branch.** P0 records H2's draw-call lists and the screenshots at 246c0aa. On that branch, P1 to P7 run on the veil commit, which sets `LAYERS.far.inkKeep` from 0.1 to 0. So far stars on the letters of quiet copy go from alpha × 0.1 to nothing:
     - `drawLayer` multiplies by the layer's quiet factor (`renderSky.ts:120`);
     - it skips any star under `MIN_STAR_ALPHA` 0.004 (`:126`).
     
     These checks then can't pass as written:
     - P1's "H2's lists equal P0's" and "the P0 screenshots match pixel for pixel";
     - AC-35;
     - AC-26's "identical to P0's at scroll 0" in P2, P5, P6 and P7.
     
     The plan states the change itself: PF's "Far stars no longer show on the letters of quiet copy themselves".
  3. **The phase map contradicts 4.4 on that branch.** 7.2 still answers "no" in "Blocked on the veil?" for P1 to P7 and P13. P2, P3 and P5 say "Blocked on. Nothing.".
- **Evidence.**
  - The branch: `PLAN.md:19` ("on a file-by-file reading they start at V"), `:322`, `:2827`, `:3382`.
  - The trigger: `:177` (D10: "When P7 is merged (or skipped) and the veil commit still hasn't landed"), `:3205` ("The trigger to ask the user is P7 merged or skipped ... rather than waiting indefinitely"), `:3386` (CP-4's "When": "P7 merged or skipped").
  - The baselines: `:2962` (P0: "Record H2's baseline draw-call lists"), `:2963-2969` (P0's screenshots), `:2998-3001` (P1's identity), `:3584` (AC-35), `:3575` (AC-26), `:3359` (PF's visible change).
  - The table: `:2939-2952` (7.2 rows "no"), `:3013`, `:3050`, `:3110` ("Blocked on. Nothing.").
  - The code: `config.ts:78` (`far: ... inkKeep: 0.1` at 246c0aa). `COORDINATION.md:81` ("`LAYERS.far.inkKeep` goes from 0.1 to 0"). The main checkout's uncommitted `config.ts` diff sets `inkKeep: 0`.
  - [computed, `ca5/farcopy.mjs`, the real `cellStars` at 1440 × 900 with rough hero text rects] 30 of the 212 far stars on screen sit on the copy and are drawn at `inkKeep` 0.1. At 0, every one of them is skipped.
- **Fix.**
  - **Stop waiting.** Give D10 and CP-4 a second trigger for the file-by-file branch: once the prepared files (pause store, control, icons, `Navbar.tsx`) are merged, or one week after CP-0's answer, whichever comes first, then weekly. State that D10's answers there are "keep waiting" or "PF".
  - **Baselines.** Add to 8.5 step 4: when P1 starts after V (the file-by-file branch), redo P0 steps 3 and 4 on the rebased tree first, and "P0's" in P1, AC-35 and AC-26 means that baseline.
  - **Phase map.** In 7.2, mark P1 to P7 and P13 "no (at V on a file-by-file answer to CP-0, 4.4)". Make P2, P3 and P5's "Blocked on" read "P1 (CP-0's answer)".

### CA5-2 (minor): CP-0 and 8.6 understate the `frameAt` overlap

- **Sections.** 8.4 CP-0 ("Two overlaps"); 8.6 (the `frameAt` row); 4.4 ("Requested overlaps").
- **Problem.**
  - `frameAt` is on the confirmed interface's "Changed shape" list, and the plan asks the veil session to agree to editing it before V.
  - CP-0 and 8.6 describe our edits as only `snap` (P1) and `offset` (P2). But `frameAt` builds the whole `SkyFrame`, so two more phases edit it:
    - P4 adds `twinkleTime`;
    - P6 adds `thinFrom` and `thinLevel` and changes the `keep` line.
  - 4.4 says a declined overlap holds only "P1 and P2 for `frameAt`". The veil session would give its yes to a narrower change than the one we make.
- **Evidence.**
  - `PLAN.md:3413` (CP-0: "`frameAt` (we add `snap` and the camera's `offset`; you add `contrastLevels()`)").
  - `:3470` (8.6: "`snap` (P1), `offset` (P2)") and `:338` ("P1 and P2 for `frameAt`").
  - P4: `:3089` ("`twinkleTime` and `hiddenTotal`") and `:1675` ("`SkyFrame` gains `twinkleTime`").
  - P6: `:3153` ("`frameAt`'s `thinFrom`, `thinLevel` and `keep`").
  - The code: `sky.worker.ts:246-267` builds the frame, with `keep` at `:259` and `twinkle` at `:262`.
  - `COORDINATION.md:125` lists `frameAt` under "Changed shape".
- **Fix.**
  - List all four phases' fields in CP-0 and 8.6's `frameAt` row: `snap` (P1), `offset` (P2), `twinkleTime` (P4), `thinFrom`, `thinLevel` and `keep` (P6).
  - In 4.4, say that a declined `frameAt` overlap holds those lines of P1, P2, P4 and P6 until V.

### CA5-3 (minor): the comet passes its fade-in as `scrollKept`'s `fade` and retires at 0, so it would retire on its first frame

- **Sections.** 6.12 (the static comet row); 9.2 AC-25; P12.
- **Problem.**
  - The confirmed interface describes `scrollKept`'s `fade` as "a pause or cancel fade" that "can only dim", and says to retire the transient when the result reaches 0. The veil's body multiplies the clamped `fade` by the scroll ramp.
  - 6.12 passes the comet's fade-in (which is 0 when it starts to show) as `fade`. It also makes the comet "gone for the page view" at 0.
  - So the first evaluation, at the moment the comet starts to show, returns 0 and retires it, and the comet never appears.
- **Evidence.**
  - `PLAN.md:2759` ("keeps `scrollKept(launchScrollY, scrollY, fade)` of its light, its fade-in and box fade passed in as `fade`; at 0 it is gone for the page view").
  - `:3574` (AC-25: "is gone for the page view at 0").
  - `COORDINATION.md:89`.
  - The main checkout's working-tree `scene.ts`: `scrollKept` returns `Math.min(1, Math.max(0, fade)) * (1 - smoothstep(SCROLL_CANCEL.from, SCROLL_CANCEL.to, ...))`.
- **Fix.**
  - Keep the fade-in out of `scrollKept`: draw at `fadeIn × scrollKept(launchScrollY, scrollY, boxFade)`, and retire only when `scrollKept` reaches 0.
  - Say this in 6.12 and AC-25, and in `bodies.ts`'s description in P12.

## Checked and holding (no finding)

- **The confirmed interface.** The plan matches it name for name:
  - `SkyRect.headroom`, `INK_BUDGET`, `STAR_INK_PEAK`, `METEOR_VEIL` and `METEOR_PASS`;
  - `SCROLL_CANCEL`, `QUIET_REACH`, `inkBudget`, `budgetKeeps`, `scrollKept` and `transientQuietFactor`;
  - `QuietKeeps`, `PlanOptions`, the private `planFlight`, `Meteor.nearCopy`, `headGain`, `WAKE_GAIN`, and `drawMeteor`'s `fade`;
  - the worker names and `copyReader`;
  - the `veiledFrom` rules;
  - what is private, the `AGENTS.md` precondition (D1 (a) and (b)), and "Left to this plan".
- **Before V.** The `scroll` and `layout` handlers, `applyLayout`, `quietBlend`, `settleQuiet`, `updateMeteor`, the planner, `drawMeteor` and `LAYERS` all stay off limits.
  - P8 retires `parallaxScroll` only after V.
  - The veil's working tree leaves `frameMode`, `schedule`, `tick`, `init`, `motion`, `visible` and `resize` untouched, as 8.6 says.
- **The lease and the transients.**
  - One ink lease (`inkLeaseFree`).
  - I9's two-way fallback, including `cometShowing`.
  - Every kind goes through `transientFade` (`scrollKept` with the pause fade) and `transientQuietFactor`.
  - Clear-sky kinds use `CLEAR_SKY_KEEPS`.
  - Every kind lasts at most 5 s (H10: fireball 4.9 s, satellite 4.8 s), and a cancel never extends a life.
- **Accessibility.**
  - 2.2.2: P5 merges before P4, P6 and P9 to P12.
  - 2.3.1: tints at most 0.42, and the area is tiny.
  - 2.3.3: the springs hold when paused.
  - 1.4.11: 14.13:1, recomputed.
  - 2.5.8: 40 × 40.
  - 2.4.11: the header shows itself while it holds focus, and the control is `inert` under the phone menu.
  - Forced colors: the sky and the control are hidden. The worker draws nothing under `'off'`, so `ready` never comes.
  - `prefers-contrast: more`: `ink` 0.
  - `data-sky-quiet` is kept, and the navbar isn't quiet.
- **Exposure checks, below the bar.**
  - **About's heading at the launch gate.** A shooting star launched at the 0.4 viewport-height limit can reach About's heading, which is unquiet, large and lightest slate (3:1 headroom 0.402). With the baseline planner this happens in about 0.05% of launches, and the head is bright enough to break 3:1 in 0.01% (worst white 0.47 to 0.72), at 1920 × 1080, 1920 × 1200 and 2560 × 1440. It never happens at 1440 × 900 or 393 × 852 [computed, `ca5/about.mjs`]. This is too rare to raise.
  - **Farewell meteors over Other Projects.** In the end scene, a farewell meteor would pass behind Other Projects' cards, but those cards are opaque light navy (`.gradient-card`, `globals.css:253`), so no unquiet text is lit.

## Summary

- **Round 4.** All five of my round 4 findings landed. I found one regression and two small slips.
- **CA5-1 (major).** The file-by-file branch round 4 added (P1 to P7 start at V) isn't carried into:
  - the stop-waiting trigger: D10 and CP-4 fire only after P7 merges, which can't happen before V on that branch;
  - the identity baselines: P0's are taken at 246c0aa, but the veil commit's `LAYERS.far.inkKeep` 0 removes far stars from the copy, so P1's H2 and screenshot identity, AC-35 and AC-26 can't pass as written;
  - the phase map: 7.2 says "no" and P2, P3 and P5 say "Nothing".
  
  The fix is three short rules.
- **CA5-2 (minor).** CP-0 and 8.6 list only `snap` and `offset` for the `frameAt` overlap, but P4 and P6 also edit it.
- **CA5-3 (minor).** The comet's fade-in, passed as `scrollKept`'s `fade` with "retire at 0", would retire the comet on its first frame.
- **Verdict:** revise (one major).
