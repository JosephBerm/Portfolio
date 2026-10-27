# Check round 1: completeness and implementability

## Scope

- **Role.** Adversarial checker, round 1, lens "completeness and implementability". I look for missing or unusable parts of `PLAN.md`, not for praise.
- **Inputs read.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md`, `research/01-planning-brief.md`.
  - `PLAN.md`, all 3,252 lines.
  - R2 §4.3 and §10, R4 §3.2, the domain-model draft (§6.2 to §6.5, §6.10, §7) and `drafts/judge-scores.md`.
  - The worktree code at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `IntroGate.tsx`, `src/app/page.tsx`, `src/lib/utils.ts`, `src/components/icons/*`, `eslint.config.mjs`, `package.json`, `next.config.ts`, `README.md`, `.claude/launch.json`; Next.js's `find-root.js` and Turbopack docs in the main checkout's `node_modules`.
- **What I checked.**
  - Every section the planning brief requires, every settled default and listed deviation, and every decision row.
  - Every new config constant's value, units and doc comment.
  - Every phase's required elements (goal, files, steps, visible change, verification and checklist, rollback, blocked mark).
  - Whether P1 can be built without re-deriving anything.
  - Bloat.
- **Recomputed** with Node scripts in the session scratchpad (`check-r1/h1-flux.mjs`, `per-shape.mjs`, `grow.mjs`, `cooldown.mjs`; not in the repository).
- **Output.** This file. `PLAN.md` was not edited and no other repository file changed.

## Verdict: revise

Seven major findings, no blocking ones, and ten minor ones.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| C1 | major | 6.3, A1, H1, AC-11, P1 | The 0.01% "same total light" gate can't pass with the plan's own painter, so P1's step 1 never goes green |
| C2 | major | 6.9, H7, P8 | P8 adds the 40 s crossing cooldown yet claims no visible change and oracle-equal launches |
| C3 | major | P6 step 4, D2, D6, AC-2, AC-15, H5, B-2 | Acceptance numbers are fixed at v₀ = 3 and reading drift 0.35, but the plan invites other values |
| C4 | major | 7.3 | Nine phases have no steps, only P0 states a goal, and P12, P13 and PF lack several required parts |
| C5 | major | P0, 8.2 CP-1 | CP-1 only looks at origin refs, but the veil session commits to local `master` first |
| C6 | major | 6.10, H8 | `pickVisitSky` has no body anywhere, and H8's 15% conflicts with the 13% by-chance share |
| C7 | major | 6.8, §11 | With the phone menu open, the new control is covered but still focusable (2.4.11); the menu is not modal for the header |
| C8 | minor | 3, 7.3 | The "Gates" column contradicts the phases that start on the default |
| C9 | minor | P8, PF | P8's files omit `meteors.ts` though I1 falls to us when declined and always under PF |
| C10 | minor | 6.10, P9 | The P9 removal list misses orphaned keys and locals; `longVisit` is filed under the wrong block |
| C11 | minor | 7.0, P2, P9, P10, P11 | Several "kill switches" don't restore today's behavior |
| C12 | minor | 6.10, 6.13 | Scatter constants say "degrees wide" where the type and brief say σ; one constant lacks a doc comment |
| C13 | minor | P4, P6 | Two optional steps have no recommended default |
| C14 | minor | 6.3, F7, H13 | No final frame is guaranteed when the motion ease ends with the camera at rest |
| C15 | minor | 7.0, 8.5, 5.1 | No home for the coordination logs on the implementing branch; README's layout lines not updated |
| C16 | minor | 2.5, 9.2 | E7's rates and 2.4.11 have no acceptance item |
| C17 | minor | whole plan | 42,060 words with facts repeated up to six times; one stray source; copies already disagree |

## Major findings

### C1. The flux gate can't pass with the plan's own painter

- **Section.** 6.3 (`paintSprite`), 4.3 (A1), 7.1 (H1), 9.2 (AC-11), P1 step 1.
- **Problem.**
  - H1 requires "every phase's alpha sum within 0.01% of phase 0's" (`PLAN.md:2486`), AC-11 repeats it (`:3033`), and A1 says "every phase of a sprite carries the same total light" (`:298`).
  - P1's first step is "The atlas, with H1 green" (`:2575`).
  - The painter as specified can't meet 0.01%, so a different model following P1 gets stuck at step 1.
- **Evidence.**
  - I recomputed the plan's `profile` and the phase-0-normalized `paintSprite` against today's `gaussianAt` (`skyAssets.ts:45-78`) for all six shapes (`h1-flux.mjs`, `per-shape.mjs`).
  - Phase (0, 0) bytes match today's exactly: 0 mismatches at DPR 1, 1.25, 1.5 and 2. That part of H1 holds.
  - The 16 phases' alpha byte sums differ from phase 0 by up to:
    - 1.12% at DPR 1 (shape 5, phase (2/4, 2/4): 2612 against 2583);
    - 1.05% at DPR 1.25, 0.88% at 1.5, 0.55% at 2 and 1.52% at 1.75.
  - Even the unrounded sums differ by up to 0.49% (DPR 2, shape 2).
    - There the core σ is 1.0 device px in today's 7 px sprite.
    - Sprites keep the 2⌈3σ⌉+1 size (`skyAssets.ts:58-60`), so a 0.75 px phase leaves only 2.75σ on one side.
  - The plan's evidence ("3.588 at every phase for σ 0.7", "a phase-(0.5, 0.5) sprite within 0.003%", `:1158`) holds only for sprites with room to spare.
  - Growing every non-zero phase by one pixel per side still leaves 1.52% on bytes (8-bit rounding) and 0.09% unrounded (`grow.mjs`).
  - R4's original AC-11 allowed 5% (R4 line 341).
- **Fix.**
  - Restate A1 as "the same light within the 8-bit rounding".
  - Set H1 and AC-11 to measured limits: for example, byte sums within 2% of phase 0 and unrounded sums within 0.5%. If every non-zero phase sprite grows by one pixel per side, the unrounded limit can be 0.1%. Phase 0 keeps today's size either way, so H2 and the `STAR_PHASES = 1` identity still hold.
  - Say which sizing P1 implements.

### C2. P8 adds the crossing cooldown but claims identity with the oracle

- **Section.** 6.9 (`TRANSIENTS`, marked P8), 7.1 (H7), 7.3 (P8).
- **Problem.**
  - P8 ships `crossingCooldown: 40` (`:1942`, in the block marked "(P8)"), so T2's cooldown is live from P8.
  - Yet P8's "No visible change means" (`:2757-2759`) omits it.
  - H7 requires that, "for the same seed and inputs, P8's launches and gaps equal the oracle's" (`:2492`).
  - The oracle is today's `updateMeteor`, or the veil era's. Neither has a cooldown: COORDINATION.md asks only that lit transients don't overlap.
- **Evidence.**
  - Today's onsets are `duration + min(75, 30 + Exp(12))` apart (`config.ts:239-241`, `sky.worker.ts:223`), so 51.8% of onset gaps are under 40 s (`cooldown.mjs`, 10⁶ draws).
  - With the plan's own share of flights that cross copy, 36% (`:2788`), about 19% of launches get `mayCrossCopy: false` where the oracle allows a crossing.
  - The planner then rejects different candidates and consumes a different random sequence, so every later launch diverges from the oracle.
- **Fix.** Either:
  - introduce `crossingCooldown` in P9 together with the rate change, where AC-38 measures it, or ship it as 0 in P8, and keep P8's oracle equality; or
  - give the oracle the same cooldown and list "fewer back-to-back crossings" under P8's visible change.

### C3. Acceptance numbers are fixed at the defaults while the plan invites other values

- **Section.** P6 step 4, D2, D6, H5, AC-2, AC-15, B-2.
- **Problem.**
  - P6 step 4 tells the implementer to try "changing only `DRIFT.speed` within 2.5 to 4" (`:2708`), and D2 offers a reading drift of 0.5 (`:167`).
  - P6's checklist uses absolute numbers computed for v₀ = 3 and drift 0.35:
    - AC-2: no ambient star over 8 px/s (`:3024`);
    - AC-15: ≤ 0.35 of the hero and no star over 2.4 px/s (`:3037`);
    - H5: wander ≤ 205.3 px (`:2490`);
    - B-2: 20 to 30 fps (`:3105`).
  - Any v₀ above 3 fails AC-15 and H5, so an implementer following step 4 can't pass P6.
- **Evidence.** From 6.1's own formulas (the brightest star's peak is 2.273 v₀, the wander bound 68.4 s × v₀; `cooldown.mjs`):

  | v₀ | Hero brightest peak (AC-2 ≤ 8) | Reading brightest peak (AC-15 ≤ 2.4) | Wander (H5 ≤ 205.3) |
  |---|---|---|---|
  | 3 | 6.82 | 2.39 | 205.2 |
  | 3.3 | 7.50 | **2.63** | **225.7** |
  | 3.5 | 7.96 | **2.78** | **239.4** |
  | 4 | **9.09** | **3.18** | **273.6** |

  - At v₀ = 4, a DPR-2 laptop also needs every frame (D6, `:171`), which fails B-2.
  - D2's 0.5 alternative gives "3.4 px/s at its peak" by its own text, against AC-15's 2.4 and its 0.35 cap.
- **Fix.**
  - Write the drift checks in units that follow the decisions: speeds as multiples of `DRIFT.speed` times the scene's drift level, the wander as 68.4 s × `DRIFT.speed`, and B-2 tied to D6's choice.
  - Or limit step 4 to v₀ ≤ 3 unless the user picks otherwise in D6, and state how AC-2, AC-15, H5 and B-2 are re-derived when they do.

### C4. Most phases lack required parts

- **Section.** 7.3.
- **Problem.** The brief requires each phase to have "its goal, its files, its steps, what 'no visible change' or 'visible change' means, verification (commands plus checklist items), and a rollback note". Many phases don't.
- **Evidence.**
  - **Steps.** Only P0, P1 and P6 have them; P9 has a two-commit "Order inside P9".
    - P2, P3, P4, P5, P7, P8, P10, P11 and P13 have none.
    - That includes the two riskiest rewrites. P3 replaces `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames` (about 300 lines). P8 replaces `updateMeteor` (about 350 lines).
  - **Goal.** Only P0 has a "Goal." line; the others rely on their headings.
  - **P12** (`:2833-2843`) has no files per kind, no verification commands, no rollback and no visible-change statement.
  - **P13** (`:2845-2856`) has no visible-change statement and no checklist items.
  - **PF** (`:2858-2860`) is only "Section 8.7", which has no files, ordered steps or rollback.
  - **Rollback dependents.** 7.0 requires each revert to name the later phases that depend on it (`:2438`). P4 (`:2667`), P8 (`:2763`) and P9 (`:2789`) don't, though P6 depends on P4, P9 to P12 on P8, and P10 and P11 on P9.
- **Fix.**
  - Give every phase a one-line goal and numbered steps, each ending green (lint, type-check, the named harness). For example:
    - **P3:** (1) `PACING` and `pacing.ts` with H4; (2) `frameDemand` and its helpers reproducing `frameMode` under today's `schedule`; (3) `requestFrame`, the watchdog and `rafWorks`; (4) the refresh estimate and the divisor in `tick`; (5) `softwareFps`.
    - **P8:** (1) `TRANSIENTS`, `Random` and the types; (2) `transients.ts` with the meteor spec, H7 against the oracle; (3) the worker swap; (4) `drawTransient` and the fade; (5) the scroll cancel.
  - Add verification and rollback to P12 and P13, and files and a rollback to PF.
  - Name the dependents in every revert note.

### C5. CP-1 can't see the veil commit where it will land

- **Section.** P0 step 1, 8.2 (CP-1).
- **Problem.** CP-1 checks only `origin/master-r26syw` and `origin/master` (`:2543`, `:2882`). The veil session will commit to local `master` in the main checkout first, so CP-1 would report "not landed" while the commit is already there.
- **Evidence.**
  - COORDINATION.md:43 says the veil session "edits only the main checkout (`S:\Documents\repos\Portfolio`, the master working tree, uncommitted) ... and commits nothing until the user approves".
  - `git worktree list` shows the main checkout on local `master` at 246c0aa.
  - `origin/master-r26syw` belonged to the defunct cloud session and holds only f03ccb3, the `.env.example` commit.
  - Worktrees share refs, so local `master` is visible from the implementing worktree. CP-1 just doesn't look there.
- **Fix.**
  - CP-1 runs `git log --oneline 246c0aa..master -- src/lib/sky src/components/sky` for a local commit.
  - CP-1 runs `git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky` for veil work still in progress.
  - Keep `origin/master` as a second check, and drop `origin/master-r26syw` or mark it historical.
  - Change P0 step 1 the same way.

### C6. `pickVisitSky` has no body, and H8's 15% can't be met as defined

- **Section.** 6.10 (`radiants.ts`), 7.1 (H8), 13.
- **Problem.** `pickVisitSky` is the core of P9's population model, but no document gives its body, and its rule is ambiguous enough that H8 fails as written.
- **Evidence.**
  - **No body.**
    - 6.10 gives only signatures (`:2163-2167`).
    - §13 says R2 §10 keeps the radiant bodies (`:3248`). R2 §10 (R2 lines 539-623) defines only `skyWindow`, `toward`, `sampleRadiant`, `radiantMotion`, `elevationAt` and `meteorRange`.
    - The domain-model draft has only the signature (draft line 2041).
  - **The 15% conflict.**
    - R2's simulation puts a sampled radiant on screen on 13% of visits at a 40° window (R2 line 112).
    - The domain draft says the deliberate on-screen shower "adds to that" (draft line 2071).
    - H8 requires "the radiant on screen in 15 ± 1% of visits" (`:2493`).
    - Unless the off-screen branch rejects directions that land on screen, the total is 0.15 + 0.85 × 0.13 ≈ 26%.
  - **Also unstated:**
    - the shower's speed class;
    - which sporadic source a launch uses;
    - how the on-screen point is found in clear sky (sampling area, test, tries, fallback);
    - how a direction is scattered by σ.
- **Fix.** Specify `pickVisitSky` in steps:
  - off-screen draws reject directions that project inside the viewport, or H8 is redefined as 15% plus the chance share;
  - the shower's class is uniform over `SPEED_CLASSES`, and each launch picks a sporadic source uniformly;
  - the on-screen point is uniform in [`edgeMargin`, width − `edgeMargin`] × [`METEOR.top`, `onScreenTop` × height], rejected while `quietAt` > 0, up to N tries, then off-screen;
  - the scatter is two tangent-plane Gaussian offsets of σ, renormalized.

### C7. With the phone menu open, the new control is focusable but covered

- **Section.** 6.8 (Placement), §11 (2.4.11, 2.4.3).
- **Problem.**
  - The plan says the open phone menu covering the control "is fine: the menu is modal" (`:1681`).
  - The menu is not modal for the header: only `#content` becomes inert. So keyboard focus can land on the covered control, which fails WCAG 2.4.11, a criterion §11 claims to meet (`:3133`).
  - The plan also never fixes the control's DOM position, which decides the focus order.
- **Evidence.**
  - `Navbar.tsx:39` and `:53` set `inert` on `#content` only.
  - `page.tsx:32` renders `<Navbar />` outside `<div id="content">` (`:43`).
  - The menu panel is `fixed right-0 top-0 h-screen w-3/4 ... z-[50]` (`Navbar.tsx:127`). Only the burger is lifted above it (`z-[100]`, `:117`).
  - A 40 px control beside the burger at the right edge sits under the panel, yet stays in the tab order (logo, control, burger, links).
  - On desktop the snippet's `md:order-last` (`:1671`) implies the wrapper precedes `#primary-nav` in the DOM. Focus then reaches it before the links while it shows last (2.4.3).
- **Fix.**
  - State the DOM position, and keep the control last in focus order on desktop.
  - While the menu is open, lift the control above the panel as the burger is, or make it `inert`.
  - Add both cases to P5's verification and to AC-28, or to a new acceptance item.

## Minor findings

### C8. The "Gates" column contradicts the phases

- **Section.** 3, 7.3.
- **Evidence.**
  - §3 says "Phases can start without an answer, except where the 'Gates' column says otherwise" (`:162`).
  - Every decision but D5 names a phase there. Yet P5 says "Blocked on. Nothing. It uses D1's default" (`:2671`), and P6 "uses D2 and D6" (`:2698`).
- **Fix.** Split the column into "affects" and "must be answered before". Only D10 and D4 truly block.

### C9. P8's file list omits `meteors.ts`

- **Section.** P8, PF.
- **Evidence.**
  - P8's files (`:2746-2756`) don't include `meteors.ts`.
  - Today's `planMeteor` takes no options and returns no `nearCopy` (`meteors.ts:186`).
  - I1's fallback is "After V we add both ourselves" (`:2893`), and PF item 4 makes I1 ours (`:2984`).
- **Fix.** Add `meteors.ts` (I1, when declined or under PF) to P8's files, and give PF a concrete file list.

### C10. The P9 removal list is incomplete, and `longVisit` is filed under `METEOR`

- **Section.** 6.10, 6.9.
- **Evidence.**
  - After I2, these become dead: `METEOR.speedShare`, `speed`, `narrowDuration`, `narrowFallbackDuration` and `narrowSpeed` (`config.ts:277-286`), and `planFlight`'s `minSpeed`, `maxSpeed` and `nominalSpeed` (`meteors.ts:130-131`).
  - None of them is in "Removed in P9" (`:2114-2117`).
  - `@typescript-eslint/no-unused-vars` warns (`eslint.config.mjs:13`), and P0 asks for a clean lint.
  - "Changes to `METEOR` in P8 and P9 ... P9 adds `longVisit`" (`:1952-1956`), but the code reads `TRANSIENTS.longVisit` (`:1976`).
  - The rewritten `METEOR` doc and the widened `fireballTint` doc are promised without text (`:2112`, `:2119`).
- **Fix.** List every key and local that I2 orphans, move `longVisit` under `TRANSIENTS`, and give the two doc texts.

### C11. Several kill switches don't restore today's behavior

- **Section.** 7.0, P2, P9, P10, P11.
- **Evidence.** 7.0 defines a kill switch as "a config value that restores today's behavior" (`:2438`).
  - **P2** restores only the glide. Nothing restores per-band parallax: `LayerConfig.parallax` is removed, and `DEPTH.compression = 0` gives every star q = 1. So R-15's "revert P2's depth alone" (`:3160`) has no mechanism.
  - **P9**'s switch "differs slightly" (`:2789`). In fact `longVisit` gives ×2 at 6 minutes and ×3 at 10, against today's ×1.5 (`config.ts:243-244`), and the narrow rate (21 s) and limit (6) stay.
  - **P10**'s `chance = 0` removes fireballs, while today has 8% (`config.ts:298`).
  - **P11**'s switch is a code edit, not a config value.
- **Fix.** Call these "off" switches, or give real ones (P9: the old values for `METEOR_RATE.narrow`, `TRANSIENTS.longVisit` and `narrowLimit`).

### C12. Scatter units are ambiguous, and one constant has no doc comment

- **Section.** 6.10, 6.13.
- **Evidence.**
  - `RADIANTS` says "a spot about `showerScatter` degrees wide" (`:2044-2045`). `Source.scatter` says "radians, one standard deviation" (`:2149`), and the brief says σ 1.5° and σ 15°.
  - `LEAN_POINTER_QUERY` (`:2399`) has no doc comment.
- **Fix.** Write "one standard deviation of the scatter, degrees" for both scatter keys, and give the query a doc comment.

### C13. Two optional steps have no recommended default

- **Section.** P4, P6.
- **Evidence.**
  - "Optional within P4: a twinkle clock without hidden time" (`:1435`). AC-32 depends on it (`:3054`).
  - "Optional within P6 (E11)" fades the stars ADAPT thins out (`:2709`). E11 is "Nothing jumps" (`:156`).
  - Neither says whether to do it.
- **Fix.** Recommend "do" or "skip" for each.

### C14. No final frame is guaranteed when the motion ease ends with the camera at rest

- **Section.** 6.3 (snap table), F7, H13.
- **Evidence.**
  - The snap table says a completed pause draws "today's" frames (`:1206`). F7 covers only the camera coming to rest (`:293`).
  - `frameDemand` gives `FADE_FRAMES` only while t − `motionChangedAt` < 0.3 s (`:1028`). The last 30 fps frame can land 0.27 to 0.30 s in, at level 0.01 to 0.03, unsnapped and with a trace of twinkle.
  - Nothing redraws at level 0 in P5, or later whenever the drift isn't wanted (idle, reading at D2 = 0, software raster).
  - `settleQuiet` (`sky.worker.ts:241-243`) is the existing pattern for this. H13 item 3 (`:2498`) tests only a pause with the drift running.
- **Fix.** Add a `settleMotion` twin of `settleQuiet`, and an H13 case that pauses with the camera at rest.

### C15. No home for the coordination logs, and README's layout lines not updated

- **Section.** 7.0, 8.5, 5.1.
- **Evidence.**
  - The implementing branch is cut from master (`:2420`). CP-2 and 8.5 step 6 write `COORDINATION.md` and `HANDOFF.md` (`:2445`, `:2944`), which exist only on `claude/quirky-carson-btv2u4`.
  - `README.md:75` and `:80` describe the two sky folders. 5.1 adds nine files but no README change.
- **Fix.** Say on which branch and worktree the logs are committed, and update README's two layout lines in P5 or P11.

### C16. E7's rates and 2.4.11 have no acceptance item

- **Section.** 2.5, 9.2.
- **Evidence.**
  - E7 (`:153`) maps only to AC-24, which checks no frequency (`:3046`).
  - E13 (`:158`) lists 2.4.11, but no AC covers it; P5 checks it only in prose.
- **Fix.**
  - Add the 39% satellite and fireball-rate checks to AC-24 and AC-37, or as new items.
  - Add a 2.4.11 item that includes C7's menu case.

### C17. The plan is bloated, and copies of the same facts have started to disagree

- **Section.** Whole plan.
- **Evidence.**
  - **Size.** `PLAN.md` is 42,060 words, against 28,253 for the largest draft and about 46,700 for R1 to R4 together.
  - **Repeated facts:**
    - the first-minute heading profile: 2.1, 6.1's table, the `DRIFT` doc, deviation 2, H5 and AC-4;
    - the APG rationale: deviation 6, D1, 6.8, §11 and the component's doc;
    - the 4.9 s fireball arithmetic: deviation 9, T1, H10, AC-37, R-11 and the `METEOR_KINDS` doc;
    - the 39% satellite figure: six places.
  - **Stray source.** §13 lists `lazy-loading.md` (`:3189`), which the plan never uses.
  - **Disagreeing copies.** Meteor every-frame drawing is "6 to 7 s a minute" in 10.2 (`:3093`) but "7 to 8 s" in B-9 (`:3112`).
- **Fix.** Keep each number in its design section and cite it by ID elsewhere, and drop the stray source.

## Checked with no finding

- **Structure.** All 13 sections the brief requires are present, and §2 carries all the requested analogies.
- **Defaults.** Every settled default is followed, or its deviation is listed in 1.1. The brief's seven decisions, plus D8 to D11, each have a default and alternatives.
- **Config.** Every new config block has values and a doc comment, with units stated except where C12 notes.
- **Deferred bodies.** The quiet-index and refresh-estimate bodies in the domain-model draft match the plan's interfaces. R2 §10's radiant sketches match the plan's signatures.
- **Code style.** The sketches use tabs, single quotes, no semicolons and no namespace imports. The plan has no em dashes.
- **Worktree builds.** Running `next dev` and `next build` from a nested worktree is safe: Next.js 16.4 stops its root search at the git worktree (`next/dist/lib/find-root.js`).
- **Citations.** About 60 `file:line` citations I sampled match the worktree.
