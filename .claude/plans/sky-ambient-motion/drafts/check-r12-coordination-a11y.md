# Check round 12: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 12 (a gate round). I confirm round 11's two fixes in this lens (CA11-1, CA11-2), look for regressions those fixes and the other round 11 fixes introduced, then sweep the rest of `PLAN.md` through this lens. I report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md` (all of it; "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree" are authoritative):
  - the veil symbols used exactly as cf4d7b8 has them, extended only through options, `veiledFrom` never rewritten;
  - the veil's three P9 asks and answer 3's three conditions;
  - one ink lease;
  - every near-copy transient through `transientQuietFactor` and `scrollKept`;
  - every transient at 5 s or less.
- **Accessibility.** WCAG 2.2.2, 2.3.1, 2.3.3; 1.4.3 through the per-rect budgets; 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` with AGENTS.md's transform and opacity rule.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it), `REVIEW-LOG.md` (rounds 7 to 11 and gate rounds 5 to 11), my round 11 report, and rounds 9 and 10 of this lens for the farewell and hero-gate history.
  - `PLAN.md` (3,657 lines), word-diffed against the scratchpad's `PLAN.before-r11.md`.
  - The code at cf4d7b8, read from the planning branch's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty; `origin/master` and the local `master` are still cf4d7b8).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or either checkout. My throwaway files are in the session scratchpad, `check-r12-a11y/` (`r11diff.txt`, `wakeleak.mjs`).

## Method

- **Round 11's fixes.** I word-diffed `PLAN.before-r11.md` against `PLAN.md` and traced every change in this lens through each section the dispositions name.
- **The P10 rewrite (CG11-1, with DRY-R11-1 and SOC11-1).** I read the new decision step against the veil's three P9 asks and cf4d7b8's `planLaunch` (`sky.worker.ts:246-261`), `planMeteor` (`meteors.ts:270-277`) and `planFlight`'s clear-sky rule (`:226-228`).
- **Against cf4d7b8.** I re-read `meteors.ts`, `scene.ts`, `config.ts`, `renderSky.ts` (`drawMeteor`, `drawTrain`), `skyAssets.ts` (`spriteSize`), `sky.worker.ts` (`:55-153`, `:155-300`, `:300-552`), `mountSky.ts` (`:25-60`, `:100-260`), `Navbar.tsx`, `ContactMe.tsx`, `AppFooter.tsx`, `FadeInSection.tsx`, `globals.css` (the focus ring, links, cards) and every `data-sky-quiet` root.
- **A wake under `CLEAR_SKY_KEEPS`.** `wakeleak.mjs` applies cf4d7b8's quiet math (`scene.ts:72-77`, `:131-141`) with keeps `{ 0, 0 }` to two neighbouring wake stops of `drawMeteor`'s gradient, one outside a padded rect and one inside it, at the stop spacing a fast-class wake has under P9's `SPEED_CLASSES` and `SKY_WINDOW`.
- **The sweep.** Sections 1 to 5, 6.1 (C6, the worker side), 6.2 (`demandNow`), 6.4, 6.6 to 6.13, 7.0 to 7.3 (P5, P8 to P13), 8, 9, 10.2, 11 and 12. I recomputed the control's contrast figures.

## Round 11 dispositions in this lens

| ID | Verdict |
|---|---|
| CA11-1 | Holds. I9 (`:3370`) now says satellites and the point flash meet answer 3's conditions by construction, while bursts, earthgrazers (T7) and the comet (6.12) stay apart from a lease holder. T3 (`:300`) gives "no light inside any padded rect" to a point sampled at its center with a drawn radius of at most `QUIET.padding`, and says a burst's or earthgrazer's wake is veiled only at its sampled stops. H7 (`:2901`) asserts it for satellites and the point flash only, as AC-30 (`:3461`) does. 6.11 (`:2745`) and 6.12 (`:2761`) now cite T3 instead of restating it, and D12's alternative (`:170`) names satellites. One place still carries the old claim: `CLEAR_SKY_KEEPS`'s doc (CA12-1). |
| CA11-2 | Holds. H7 (`:2901`) holds each kind to its launch scene ("the hero up to 0.4 viewport heights; from P12, farewell meteors at the end bookend") and its `limit`. AC-20 (`:3451`) gains "farewell meteors (P12) at most 2 a visit, clear of the end scene's unmarked copy on its captured layouts (6.12)", with H7 among its methods and P12 among its phases. P12's verification (`:3321`) names AC-20. `heroLaunchMaxScroll`'s P8 doc (`:1716`) reads "Transients launch over the hero only ...", true in every phase, and P12's files (`:3318`) reword `LaunchGate.allowed`'s doc (`:2135`) to "a launch scene (SceneLevels.launchScene)". The other docs that name a scene follow: `SceneLevels.launches` gives way to `launchScene` with its doc (8.4 `:3382`), and `launchesAllowed`'s and `TRANSIENTS`' docs name none. A note, no finding: 6.12 (`:2755`) still says "H7 and AC-20 gain the kind, checked on end-scene layouts P12 captures", while H7's row lists the scene and the limit but not the capture check. P12 step 1 (`:3319`) runs that check as one of "its harness checks", so nothing goes unbuilt. |

**The other round 11 fixes, read through this lens.** None breaks a constraint.

- **P10's decision step (CG11-1, DRY-R11-1, SOC11-1).**
  - Ask 1's order holds. A decided fireball is tried with `{ fireball: true, flights: 'long' }`, so its pass has no short fallback, then an ordinary plan tries long flights on every steer before any short one (`:3271`, `planMeteorTransient`'s doc `:2098-2108`). Never `fireball` on a short pass, because `planMeteor`'s fallback pass would clear it and fly an ordinary short flight first, as cf4d7b8's `fireballs: false` does (`meteors.ts:274-275`).
  - The fireball try draws its own fresh steers, so a fireball launch can try up to twice `METEOR.radiantTries` fresh directions before a short flight. That only lowers the share of short flights, and fireballs are desktop only, where short fallbacks are 0.0 to 0.3% of launches (`COORDINATION.md`, "Landed").
  - Stickiness holds. The fireball try plans with the context's `nearCopy` false, so its failure keeps the visit's sky (RD1); a resize still clears it and a layout still doesn't.
  - The lease holds. A fireball flies in clear sky only (cf4d7b8 `meteors.ts:228`), reports `nearCopy` false and never takes the lease. T2's check reads the scheduler's context (step 2.3), not the spec's inner one.
  - Ask 3 holds. Fireballs never cross copy, so P10 can only lower P9's crossing rates, and the rerun stays P9's.
- **PHY11-1** rewrites the docs of `path`, the flight block and the narrow block. None is a veil-touched line: the veil's `METEOR` doc changes are `attempts` and `radiantTries` (`git diff 246c0aa cf4d7b8 -- src/lib/sky/config.ts`).
- **C74** grows the comet's box by the lean only with P7. The box test stays a superset of where the comet can be drawn.
- **CONV11-1 (a), DRY-R11-2.** The camera docs, `SkyPauseButton`'s doc ("stops all of the sky's motion, as reduced motion does") and `FRAME.motionEase`'s doc ("ambient motion eases out or in") are true from the phase that writes them.
- **NJ11-1, PHY11-2, CONV11-2, CONV11-3, CG11-2.** They touch no veil symbol and no accessibility criterion.

## Findings

### CA12-1 (minor): `CLEAR_SKY_KEEPS`'s doc keeps the claim CA11-1 took out of T3, I9 and H7

- **Sections.** 6.11, the `CLEAR_SKY_KEEPS` doc (`:2670-2674`). Against: T3 (`:300`), 6.12 (`:2761`) and 7.0 (`:2826`).
- **Problem.**
  - **What the doc says.** P11 commits: "Quiet keeps for transients that never take the ink lease (satellites; any clear-sky variant later): no light inside a padded quiet rect, even mid-ease or when a layout changes under it, so they never share a contrast budget with the one that holds the lease."
  - **Who that is true for.** For a point sampled at its center (satellites, the point flash), the keeps give no light inside a padded rect, as T3 now says.
  - **Who it isn't true for.** The two other clear-sky variants P12 adds, bursts and earthgrazers, get the same keeps (`drawTransient` hands `drawMeteor` `CLEAR_SKY_KEEPS`, 6.12). But `drawMeteor` veils a wake only at its 9 sampled stops, one linear gradient between them. When a layout moves copy under a wake, a stop inside a padded rect keeps 0 and its neighbour outside keeps `smoothstep(0, 40, d)`, so the gradient lights the padding between them.
  - **The doc's conclusion.** "So they never share a contrast budget with the one that holds the lease" holds for bursts and earthgrazers only through T7 (one meteor at a time), as T3 now says, not through these keeps.
  - **The forward reference.** "Any clear-sky variant later" names a later phase in a committed doc. 7.0 asks a committed doc to describe what its phase ships, and the phase that adds a kind to extend the docs naming it.
  - **Why minor.** Contrast stays safe: the leak stays in the padding and never reaches the copy itself (computed below), and T7 keeps these variants apart from a lease holder. But this is the comment the next person reads when they add a clear-sky kind, and it promises the by-construction guarantee that answer 3 a allows only for a center-sampled point.
- **Evidence.**
  - `PLAN.md:2671-2673` (the doc).
  - T3 (`:300`): "A point of light sampled at its center whose drawn radius is at most `QUIET.padding` (satellites, the point flash) then adds no light inside any padded rect ... A burst's or earthgrazer's wake is veiled only at its sampled stops (6.12) ... so those stay apart from a lease holder (T7 ...)".
  - 6.12 (`:2761`): "`drawTransient` hands `drawMeteor` `CLEAR_SKY_KEEPS` for them (one more `drawMeteor` argument)".
  - `COORDINATION.md:191-196`, answer 3 a: by construction only for a kind "sampled at its center" whose "drawn radius stays at or under `QUIET.padding` (32 px)".
  - cf4d7b8:
    - `renderSky.ts:221-227` (the stops), `:230` (`kept`), `:240` (each color stop is `stop.light * kept(stop.point)` in one linear gradient);
    - `config.ts:392` (`wakeStops: 9`);
    - `scene.ts:72-77` and `:131-141` (with keeps `{ 0, 0 }`, the factor at `d` px outside a padded rect is `smoothstep(0, 40, d)`, and 0 inside).
  - [computed, `check-r12-a11y/wakeleak.mjs`] A fast-class wake at the window's centre on a 1,440 px window runs about 187 px (479 px/s × 0.39 s), so its stops are about 23 px apart, and about 34 px at the top of the window with the full speed jitter. The gradient then puts up to 0.11 (at 34 px, 0.21) of a stop's light at the padded edge, reaching 9 (14) px into the 32 px padding. It never reaches the copy.
  - 7.0 (`:2826`): "A committed doc describes what its phase ships, and the phase that adds a feature extends the docs that name it."
- **Fix.**
  - **6.11's doc.** "Quiet keeps for transients that never take the ink lease: a point drawn with them, sampled at its center, keeps no light inside a padded quiet rect, even mid-ease or when a layout changes under it, so a satellite never shares a contrast budget with the one that holds the lease. Not a look setting: both stay 0 whatever the star layers' keeps become."
  - **P12's point-flash files.** Extend that sentence to "a satellite or the point flash". Bursts and earthgrazers add nothing to it: T7 keeps them from a lease holder (T3).

### CA12-2 (minor): AC-30 names the point flash, but not P12, the phase that ships it

- **Sections.** AC-30 (`:3461`) and P12's verification (`:3321`). Against: 6.12's point-flash row (`:2752`), H7 (`:2901`), AC-31 and AC-37 (`:3462`, `:3468`).
- **Problem.**
  - AC-30's pass rule says "satellites and the point flash add no light inside the padded rects of `to` or `next` (T3)", but its phase column is "P1, P2, P6, P8, P11".
  - The point flash ships only in P12 (6.12; D4). P12's verification names an acceptance item only for the comet (AC-25) and farewell meteors (AC-20).
  - So no phase's checklist carries AC-30's point-flash clause, and the point flash's PR wouldn't record it among "the checklist items passed" (7.0, Evidence).
  - Why minor: H7 still checks the property in P12 ("H7 and H10 with the kind"; H7 covers P8 to P12), so nothing goes unverified. Only the mapping drifts. AC-31 and AC-37 already list "P8 to P12". This predates round 11 (AC-30 has named the point flash since before round 9) and was not raised before.
- **Evidence.**
  - AC-30's row (`:3461`): "... satellites and the point flash add no light inside the padded rects of `to` or `next` (T3); one lease. ... | C, H3, H7 | P1, P2, P6, P8, P11 |".
  - P12's verification (`:3321`): "its acceptance item (AC-25 for the comet, AC-20 for farewell meteors)".
  - 6.12 (`:2752`): the point flash, "Clear sky only", one of the could kinds P12 ships.
  - H7 (`:2901`): "no satellite or point flash adds light inside a padded rect of `to` or `next` from the frame a layout arrives | P8 to P12".
- **Fix.**
  - AC-30's phase column: "P1, P2, P6, P8, P11, P12 (the point flash)".
  - P12's verification: "its acceptance item (AC-25 for the comet, AC-20 for farewell meteors, AC-30 for the point flash)".

## Checked and holding (no finding)

- **The interface against cf4d7b8**, unchanged since round 11:
  - the planner: `PlanOptions` and `PassOptions` (`meteors.ts:49-63`), `veiledFrom` (`:143`), never changed, `planFlight` (`:191`), `planMeteor` (`:270`) and `Meteor.nearCopy` (`:45`);
  - the quiet helpers: `QuietBlend.next` (`scene.ts:120-125`), `transientQuietFactor` (`:156-160`), `inkBudget` and `budgetKeeps` (`:163-180`), `scrollKept` (`:187-189`);
  - the drawing: `drawMeteor`'s `fade` (`renderSky.ts:204`);
  - the constants: `QUIET_REACH`, `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS` and `SCROLL_CANCEL` (`config.ts:153`, `:335`, `:349`, `:360`, `:367`).
  - `COORDINATION.md` is unchanged since 0c37b5c, and no sky commit follows cf4d7b8 on `origin/master` or `master`.
- **Answer 3 and one lease.**
  - I9, T3, H7, AC-30, D12 and 6.11 agree: satellites and the point flash meet condition a by construction; bursts and earthgrazers stay apart from a lease holder through T7; the comet through D12's hold both ways (`leaseHeld` before it starts, `bodyShowing` while it shows).
  - The point flash qualifies: with zero length, `drawMeteor` draws no wake (`renderSky.ts:236`, `length > 0.5`) and no train (`:175`, `flown < 2`), and its glow is sampled at the head (`:252`), a sprite of radius 3σ = 9 CSS px (`METEOR_LOOK.glow` 3; `skyAssets.ts:58-60`), under `QUIET.padding`.
  - Conditions b and c: T4 (`transientFade`, which calls `scrollKept`) and T2 (`leaseHeld` and `inkLeaseFree`, `:2197-2205`), one lease for every kind, the farewell kind included.
- **Every near-copy kind through the veil's factor and the scroll cancel.** Meteors and farewell meteors through `drawMeteor` with `transientFade` as its `fade`; satellites through `transientQuietFactor` with `CLEAR_SKY_KEEPS` times their fade; the comet with every part through `transientQuietFactor` and its light its fade-in × `scrollKept`.
- **5 s.** T1 and H10, and the scheduler rejects longer plans: fireball 2.5 + 2.4 = 4.9 s; satellite 4.8 s; a fast meteor with its train 0.8 + 2.4 = 3.2 s; earthgrazer about 4 s; a burst's whole span at most 5 s.
- **The P9 asks.** Ask 1 (8.4, `planMeteorTransient`'s doc, P10 as above), ask 2 (the `fallback` flag, the timing in `SPEED_CLASSES` and `METEOR.fallbackScale`, `flights` kept), ask 3 (P9's rerun reported to Joseph, `:3257`).
- **Accessibility.**
  - 2.2.2: P5 lands before P4, P6 and P9 to P12 (7.0 Gates `:2836`); every transient lasts 5 s or less; the comet and the planet move only with the camera, which the control stops, and a pause fades the comet out.
  - 2.3.1: the warmest drawable tint is 0.42; burst members are at least 0.35 s apart; no transient changes more than about 2,000 CSS px².
  - 2.3.3: the glide and the lean hold under reduced motion and a pause (`stepCamera`'s `follow`, `leanWanted`).
  - 1.4.11: the glyph at 14.13:1 on navy and 12.71:1 on the phone menu's light navy [recomputed]; the global 2 px dashed ring (`globals.css:80-83`).
  - 2.4.7 and 2.4.11: the header shows on focus and stays while it holds `:focus-visible` (6.8; today it hides at y −70, `Navbar.tsx:79`); the control's wrapper is `inert` while the phone panel (`Navbar.tsx:127`, z-50) covers it, with the burger above it at z-100 (`:117`).
  - 2.5.8: 40 × 40.
  - Forced colors: the control is hidden (`forced-colors:hidden`) as the sky is (`Background.module.css:27-31`), and nothing draws under `motion: 'off'` (`frameState.live`; cf4d7b8 `sky.worker.ts:137`).
  - `prefers-contrast: more`: `meteorInk` 0 (`config.ts:220`), which every kind takes through the gate's `ink`.
  - Reduced motion: no launches (`allowed`), the springs hold, the comet never starts, the planet stays still, and AC-26's screenshots stay identical.
- **`data-sky-quiet` and AGENTS.md's rule.** No phase edits a quiet root or its ancestors: the quiet roots are `Introduction.tsx:14`, `ContactMe.tsx:11`, `AppFooter.tsx:13` and `SidePane.tsx:23`, and the control lives in the navbar, which is none of them. D1 (a) and (b) restate the precondition, and an icon-only button counts as one rect (`QUIET_CONTROLS`, `mountSky.ts:38`, `:183-186`).
- **The hero gate and About's header.** Round 9 measured it at 0.015% of launches or less, and round 11 changed nothing that bears on it: P10's fireballs are rarer than P9's.

## Summary

- **Round 11's fixes in this lens hold.**
  - CA11-1: I9, T3 and H7 now give answer 3's by-construction route to satellites and the point flash only.
  - CA11-2: H7 and AC-20 carry farewell meteors' scene and limit, P12 names AC-20, and both P8 docs read true in every phase.
- **The other round 11 fixes** break no coordination constraint. P10's decision step keeps ask 1's order and stickiness and the one lease.
- **CA12-1 (minor).** `CLEAR_SKY_KEEPS`'s doc still promises "no light inside a padded quiet rect" for "any clear-sky variant later". P12's bursts and earthgrazers draw wakes veiled at 9 sampled stops, which light up to 9 to 14 px of the padding (never the copy). Fix: word the doc for a center-sampled point and satellites, and let P12 add the point flash.
- **CA12-2 (minor).** AC-30 names the point flash but not P12, and P12's verification names no acceptance item for it. Fix: add P12 to AC-30's phases and AC-30 to P12's verification.
- **Verdict:** pass. Neither finding is blocking or major.
