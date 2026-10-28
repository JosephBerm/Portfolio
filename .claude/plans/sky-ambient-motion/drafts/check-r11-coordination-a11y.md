# Check round 11: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 11 (a gate round). I confirm round 10's two fixes in this lens (CA10-1, CA10-2), look for regressions those fixes and the other round 10 fixes introduced, then sweep the rest of `PLAN.md` through this lens. I report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md` (all of it; "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree" are authoritative):
  - the veil symbols used exactly as cf4d7b8 has them, extended only through options, `veiledFrom` never rewritten;
  - the veil's three P9 asks and answer 3's three conditions;
  - one ink lease;
  - every near-copy transient through `transientQuietFactor` and `scrollKept`;
  - every transient at 5 s or less.
- **Accessibility.** WCAG 2.2.2, 2.3.1, 2.3.3; 1.4.3 through the per-rect budgets and for copy the veil can't see (C1); 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` with AGENTS.md's transform and opacity rule.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md`, `REVIEW-LOG.md` (round 10 and gate round 10, plus round 7's CA7-3 for history) and my round 10 report.
  - `PLAN.md` (3,651 lines), word-diffed against the scratchpad's `PLAN.before-r10.md`.
  - The code at cf4d7b8, read from the planning branch's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty; `origin/master` and the local `master` are still cf4d7b8).
  - The archived layouts (`harness/veil-confirm-final-1.tar.gz`, `code-logic/zones/*.json`), already extracted in the scratchpad by an earlier round (`check-r10-completeness/archive/`).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or either checkout. My throwaway files are in the session scratchpad, `check-r11-a11y/` (`r10diff.txt`, `band.mjs`).

## Method

- **Round 10's fixes.** I word-diffed `PLAN.before-r10.md` against `PLAN.md` and traced every change in this lens through the sections each disposition names.
- **The farewell band on real layouts.** `band.mjs` applies 6.12's rule as now written (in-flow zones padded by `QUIET.padding`, on screen when `zone.y < height` and `zone.y + zone.height > 0`; the edge is their highest top; room while the edge lies above `METEOR.maxEndY` × height) to the `settled` layout of each of the nine archived captures, scroll by scroll across the end gate (`sceneAt`'s end level at 0.9 or more, `scene.ts:24-38`, `config.ts:160-172`).
- **Against cf4d7b8.** I re-read `scene.ts`, `meteors.ts`, `protocol.ts`, `config.ts`, `sky.worker.ts`, `mountSky.ts`, `renderSky.ts` (`drawMeteor`), `Navbar.tsx`, `ContactMe.tsx`, `AppFooter.tsx`, `FadeInSection.tsx`, `RevealItem.tsx`, `Background.module.css`, `SkyCanvas.tsx`, `globals.css` (links, `.btn`, the focus ring) and AGENTS.md.
- **The sweep.** Sections 1 to 5, 6.4, 6.6 to 6.13, 7.0 to 7.3 (P5, P8 to P12), 8, 9.2, 11 and 12. I recomputed the control's contrast figures.

## Round 10 dispositions in this lens

| ID | Verdict |
|---|---|
| CA10-1 | Holds. 6.12's row (`:2749`) now defines the edge as "the top of the highest in-flow zone on screen: of `field.quiet` without `field.pinned` (the same padded objects, 6.9), those with `zone.y < height` and `zone.y + zone.height > 0`", with both of the skeptic's refinements (`zone.y < height`, and no zone on screen is a hold). It matches cf4d7b8: `mountSky.ts:231` measures every flow root in document coordinates, `scene.ts:60-69` moves them all to the screen, and 6.9's worker bullet (`:2334`) pads the rails once for `quiet` and `pinned`, so the identity filter works. P12's capture takes every rect the worker receives (`:2749`), `clearOf`'s doc gains the farewell clause (`:2583`), and 5.1 (`:327`, `:333`) and P12's files (`:3312`) follow. On the archived layouts the edge always finds an in-flow zone across the gate [computed, `band.mjs`]. |
| CA10-2 | Holds. `room(field)` is false at or below `maxEndY` × height (`:2749`); starts run from the edge to the bottom inside `spawnX`; step 2.3 lets a kind with a `room` test only retry (`:2216`); `field()`'s doc (`:2138`) and D4 (`:164`) follow. D4's figures recompute: room in the last 169 px of the 413 px gate at 2560 × 1440, 269 of 310 at 1920 × 1080, and the whole gate on the seven smaller archived layouts [computed, `band.mjs`]; at 3840 × 2160 the edge sits at 1,588 px at the page bottom against 1,555 (CA10-2's figures, no breakpoint between 2560 and 3840). |

**The other round 10 fixes, read through this lens.** None breaks a constraint.

- PHY10-1's scaled fallback minimum changes `planFlight`'s own minimum only; the guard values the veil owns (`METEOR.top`, `edgeMargin`, `maxEndY`) stay, and P9 reruns the crossing measurement (ask 3).
- CG10-3 keeps cf4d7b8's draw and clamp (`meteors.ts:206`), so a farewell `starts` box below `METEOR.top` is still raised to it.
- CONV10-1's rename touches `meteorsAllowed`, which is not on answer 1's list.
- SOC10-1's comet start rule reads `allowed`, which requires full motion: the comet never starts under reduced motion or a pause.
- DRY-R10-2 routes farewell meteors through `planMeteorTransient`'s second argument, so ask 1's pass order stays in one function.

I found one regression, in round 10's trim of I9 (CA11-1).

## Findings

### CA11-1 (minor): round 10's trim of I9 says every clear-sky kind meets answer 3's conditions by construction; bursts and earthgrazers don't, and T3 and H7 make the same broad claim

- **Sections.**
  - 8.3, I9 (`:3364`);
  - T3 (`:300`);
  - H7 (`:2895`).

  Against: 6.12 (`:2755`), D12 (`:170`) and AC-30 (`:3455`).
- **Problem.**
  - **What the trim did.** Round 10 condensed I9 (REVIEW-LOG round 10: "8.3's I9 restatement of T2 to T4").
    - Before, it limited the construction: condition (a) "holds by construction for a point drawn through `transientQuietFactor` with `CLEAR_SKY_KEEPS` at its center and a radius of at most `QUIET.padding`".
    - Now it reads: "yes, on answer 3's three conditions (...), which our clear-sky kinds meet by construction".
  - **Who that covers.** In this plan the clear-sky kinds include P12's clear-sky could kinds: the point flash, bursts and earthgrazers. Section 11's 1.4.3 row says "Satellites and the clear-sky could kinds", and T3 covers "a body P12's `clearSky(body)` marks".
  - **Why bursts and earthgrazers don't qualify.** They draw a wake through `drawMeteor`'s 9 sampled stops, not a point sampled at its center.
    - Answer 3 a makes the center-sampled point of radius 32 px or less the by-construction route.
    - CA7-3's skeptic found that these two kinds don't take it.
    - 6.12 says so too: "a burst's or earthgrazer's wake is veiled at its sampled stops, and being meteors, T7 keeps all three apart from a lease holder".
  - **The same claim in T3 and H7.**
    - T3 gives every never-lease kind, P12's included, the conclusion "so it adds no light inside any padded rect of `to` or `next` from the frame a layout arrives", and only then adds "by construction for a point of light".
    - H7 asserts "none adds light inside a padded rect of `to` or `next` from the frame a layout arrives" right after its never-lease clause, and P12 runs H7 "with the kind" (`:3315`).
    - When copy moves under a burst, its wake gradient ramps from a stop inside a padded rect (factor 0) to the next stop outside it. So it lights the padding near the edge. H7 as worded then fails for bursts and earthgrazers, or gets built as a center-only test that proves nothing about wakes.
  - **Why minor.** Nothing built changes:
    - D12's alternative lifts the hold for satellites only (`:170`);
    - T7 keeps the meteor variants from a lease holder;
    - the comet keeps its hold (6.12, T3).

    But I9 is the line that records the veil's answer. A reader who lifts D12's hold on its word would be wrong for every kind but satellites and the point flash.
- **Evidence.**
  - `PLAN.before-r10.md` (scratchpad), I9: "(a) no light inside any padded rect of `to` or `next` over the whole drawn footprint, every frame, which holds by construction for a point drawn through `transientQuietFactor` with `CLEAR_SKY_KEEPS` at its center and a radius of at most `QUIET.padding`".
  - `PLAN.md:3364`: "which our clear-sky kinds meet by construction".
  - `COORDINATION.md:191-198`, answer 3 a: "It holds by construction if: the kind draws through `transientQuietFactor` with keeps `{ quietKeep: 0, inkKeep: 0 }`, sampled at its center; its drawn radius stays at or under `QUIET.padding` (32 px)".
  - cf4d7b8, the wake as sampled stops:
    - `renderSky.ts:221-227`: `wakeStops` points, each with its own light;
    - `renderSky.ts:240`: each stop's alpha × `kept(stop.point)` in one linear gradient;
    - `config.ts:392`: `wakeStops: 9`.
  - The history:
    - `drafts/check-r7-coordination-a11y.md`, CA7-3's verification: "bursts and earthgrazers draw a wake as a gradient between 9 sampled stops ..., not the centre-sampled sprite of radius 32 px or less that the by-construction route needs";
    - REVIEW-LOG round 7, CA7-3's row.
- **Fix.**
  - **I9.** "...which satellites and the point flash meet by construction (T3); bursts and earthgrazers, being meteors, never overlap a lease holder (T7), and the comet keeps the hold (6.12)".
  - **T3.** Give "adds no light inside any padded rect" to the point lights only (satellites, the point flash), and say that bursts' and earthgrazers' wakes are veiled at their sampled stops (6.12).
  - **H7.** Word it as AC-30 already does: "no satellite or point flash adds light inside a padded rect of `to` or `next` from the frame a layout arrives".

### CA11-2 (minor): P12's end-scene launches don't reach H7 or AC-20, which 6.12 says gain the kind, nor two P8 docs that state the hero-only rule

- **Sections.**
  - H7 (`:2895`);
  - AC-20 (`:3445`);
  - 6.12's farewell row (`:2749`) and T6 (`:303`);
  - 6.7 (`:1715`) and `LaunchGate.allowed` (`:2130`);
  - P12's files and verification (`:3312`, `:3315`).
- **Problem.**
  - **What 6.12 promises.** "H7 and AC-20 gain the kind, checked on end-scene layouts P12 captures ...: no accepted path within `ZONE_REACH` of an unmarked box". T6 makes farewell meteors the one exception to launching only over the hero.
  - **H7.** It covers phases P8 to P12, yet still asserts "none on narrow screens past the limit or past 0.4 viewport heights".
    - Farewell meteors launch far past 0.4 viewport heights by design. At 1440 × 900 their gate opens at scroll 6,355 px, 7.1 viewport heights [computed, `band.mjs`: document 7,513, gate 258 px from the bottom].
    - So the invariant fails as written once P12 adds the kind.
    - H7 also doesn't name the kind's `limit` (2 a visit).
  - **AC-20.** It has no farewell clause and lists P9 only.
    - P12's verification names "its acceptance item (AC-25 for the comet)" and none for farewell meteors.
    - So the C1 check that CA9-1 and CA10-1 were about lives only in 6.12's row and P12 step 1.
  - **Two P8 docs.** They state the hero-only rule as universal:
    - `heroLaunchMaxScroll`: "Transients launch only while no more than this many viewport heights are scrolled" (6.7);
    - `LaunchGate.allowed`: "Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches)".

    After P12, `allowed` keeps only "a launch scene" (6.12), so both read false. P12's files don't name them, and 7.0 asks that a committed doc describe what its phase ships.
- **Evidence.**
  - `PLAN.md:2895` (H7, phases "P8 to P12");
  - `:3445` (AC-20, phase "P9");
  - `:3315` (P12's verification);
  - `:2749` ("H7 and AC-20 gain the kind");
  - `:303` (T6);
  - `:1715` and `:2130` (the two docs);
  - `:3312` (P12's files).
  - `REVIEW-LOG.md`, round 9, CA9-1's disposition: "H7 and AC-20 gain a check on end-scene layouts P12 captures". AC-20's row has had no farewell clause since. Round 10's DRY-R10-1 rewrote that row without one.
- **Fix.**
  - **H7.** "...none outside its kind's launch scene (`TransientSpec.scene`: the hero up to `heroLaunchMaxScroll`; from P12, farewell meteors at the end bookend), none on narrow screens past `narrowLimit`, none past its kind's `limit`".
  - **AC-20.** Add "(P12, farewell meteors) at most 2 a visit; on the captured end-scene layouts, no accepted path within `ZONE_REACH` of an unmarked text box (6.12)", with P12 in its phase column.
  - **P12's verification.** Name AC-20 for farewell meteors.
  - **P12's files.** Add the two docs: "Transients launch over the hero only while no more than this many viewport heights are scrolled" and "a launch scene (SceneLevels.launchScene)".

## Checked and holding (no finding)

- **The interface against cf4d7b8.** Each matches 8.3 and 8.4:
  - the planner: `PlanOptions` (`meteors.ts:50-57`), `PassOptions` (`:60-63`), `planFlight` (`:191`), `planMeteor` (`:270`), `Meteor.nearCopy` (`:45`) and `veiledFrom` (`:143`), never changed;
  - the quiet helpers: `scrollKept` (`scene.ts:187-189`), `transientQuietFactor` with `next` (`:156-160`), `inkBudget` and `budgetKeeps` (`:163-180`), `QuietBlend.next` (`:124`);
  - the drawing: `drawMeteor`'s `fade` (`renderSky.ts:204`);
  - the constants: `QUIET_REACH`, `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS` and `SCROLL_CANCEL` (`config.ts:153`, `:335`, `:349`, `:360`, `:367`).
  - `COORDINATION.md` changed since round 10 only in one path line (0c37b5c). No sky commit follows cf4d7b8 on `origin/master` or `master`.
- **The P9 asks and answer 3.**
  - Ask 1: the pass order and the stickiness (8.4; `planMeteorTransient`'s doc, `:2097-2105`; RD1).
  - Ask 2: the `fallback` flag, the timing in config and `flights` kept.
  - Ask 3: the crossing rerun reported to Joseph (P9 verification, `:3251`).
  - Answer 3 (b) and (c): T4 and T2, met by satellites (6.11) and every clear-sky kind. Only (a)'s wording overreaches (CA11-1).
- **One lease, the factors, the cancel, 5 s.**
  - The lease: `leaseHeld` and `inkLeaseFree` (`:2193-2200`), shared by both launch scenes and read by the comet's start rule.
  - Every kind draws through `transientQuietFactor` and retires through `transientFade`, which calls `scrollKept` (`:2188-2190`, `:2739`, `:2750`).
  - Lifetimes from the config (H10): fireball 2.5 + 2.4 = 4.9 s; satellite 4.8 s; a fast meteor with its train 0.8 + 2.4 = 3.2 s; earthgrazer about 4 s; a burst's span at most 5 s.
- **C1 in the end scene.**
  - Contact's entrance ends before a farewell launch can plan, so no launch plans against translucent copy whose headroom is read from color alone. The section fades in over 0.3 s, then four reveal items each take 0.3 s at a 0.08 s stagger: 0.84 s (`FadeInSection.tsx:44-49`, `RevealItem.tsx:31-41`). The launch gate waits 1.2 s after the scroll stops (`TRANSIENTS.scrollQuiet`).
  - The footer settles within 0.5 s (`AppFooter.tsx:14-17`).
  - Hover and focus turn links green (`globals.css:119-121`). That raises their contrast, and the stale-headroom caveat round 10 checked for the footer link holds.
- **The control.**
  - Contrast: 14.13:1 on navy and 12.71:1 on the phone menu's light navy [recomputed]. Behind the glass header, a white backdrop at 15% still leaves 9.0:1 [computed].
  - A 40 × 40 target, the global 2 px dashed ring (`globals.css:80-83`), and `inert` while the menu panel covers it (`Navbar.tsx:117`, `:127`).
  - The header shows on focus (`Navbar.tsx:79` today hides it at y −70).
  - Hidden under forced colors twice: `forced-colors:hidden`, and `Background.module.css:27-31` for the sky.
  - `meteorInk` is 0 under `prefers-contrast: more` (`config.ts:220`), which farewell meteors inherit through the gate's `ink`.
  - Under reduced motion or a pause there are no launches (`allowed`), the springs hold (C6), and nothing moves after the 0.3 s ease.
- **`data-sky-quiet` and AGENTS.md's rule.**
  - No phase adds a static transform or opacity below 1 at rest to a quiet root or its ancestors: the control sits in the navbar, which is not a quiet root.
  - D1 (a) and (b) restate the precondition.
  - AGENTS.md line 20 is untouched, and P5's line follows it.
- **2.3.1.** The warmest drawable tint is 255 / 603 = 0.42. Burst members are at least 0.35 s apart. No transient changes more than about 2,000 CSS px².
- **2.2.2.** P5 lands before P4, P6 and P9 to P12 (7.0 Gates). Every transient lasts 5 s or less. The comet is not a transient, and the control fades it out.
- **The hero gate and About's header.** Round 9 measured this at 0.015% of launches or less (`drafts/check-r9-coordination-a11y.md`), and round 10 changed nothing that bears on it.

## Summary

- **Round 10's fixes in this lens hold.**
  - CA10-1: 6.12 defines the band's edge from the in-flow zones on screen, with both of the skeptic's refinements, and every listed section follows.
  - CA10-2: the hold covers an edge at or below `maxEndY`, the start band is stated, a room-tested kind only retries a null plan, and D4's 169 px recomputes on the archived 2560 × 1440 layout.
- **The other round 10 fixes** break no coordination constraint, and the accessibility criteria hold.
- **CA11-1 (minor).** Round 10's trim of I9 says every clear-sky kind meets answer 3's conditions by construction. T3 and H7 make the same broad claim. Bursts and earthgrazers don't meet it, as 6.12 and CA7-3 say. Fix: give the claim to satellites and the point flash only.
- **CA11-2 (minor).** 6.12 says H7 and AC-20 gain farewell meteors, but:
  - H7 still forbids any launch past 0.4 viewport heights;
  - AC-20 has no farewell clause;
  - two P8 docs state the hero-only rule that P12 breaks.

  Fix: update the three and name AC-20 in P12's verification.
- **Verdict:** pass. Neither finding is blocking or major.
