# Check round 3: completeness and implementability

## Scope

- **Role.** Adversarial checker, round 3, lens "completeness and implementability". I confirm that round 2's fixes landed, look for regressions the revision introduced, and report real problems in `PLAN.md`, not praise.
- **Inputs read.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md`, `research/01-planning-brief.md`.
  - `PLAN.md`, all 3,572 lines (53,067 words), including its check log.
  - My round-2 report (`drafts/check-r2-completeness.md`), the 36 round-2 findings and dispositions the workflow relayed, and R2 §4.6 and §10.
  - The worktree code at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `icons/`, `README.md`, `AGENTS.md`, `.claude/launch.json` (and the main checkout's copy, its `git worktree list` and `git status`).
- **What I checked.** Every section the brief requires; every settled default and deviation; every decision row; every new config constant; every phase's goal, files, steps, visible-change statement, verification and checklist, rollback and blocked mark; whether each numbered step can be a green commit (7.0); whether P1 can be built without re-deriving anything; bloat.
- **Recomputed** with scratch files in the session scratchpad (`check-r3-completeness/`, not in the repository):
  - `steps.ts`: the step orders and the P10 context, type-checked with the installed TypeScript 6.0.3.
  - `unsnap.mjs`: the hop when `snap` turns off, using the plan's `placePoint`; today's crossing bar by crossing share.
- **Output.** This file and the structured result. `PLAN.md` and every other repository file are unchanged.

## Verdict: revise

One major finding and seven minor ones, none blocking.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| C28 | major | 6.9 (worker), P8, H7 | P8 no longer clears the sticky radiant on resize, so its "same radiant behavior" and H7's oracle equality fail |
| C29 | minor | 7.0; P3, P4, P6, P7 steps | Four phases still have steps that can't be green commits in the order given |
| C30 | minor | P10; 6.9 `PlanContext` | P10's "after 20 s since the reveal" has no reveal time to read |
| C31 | minor | M1, AC-9, AC-27, H13 | The first Play after a snapped load still hops stars by up to half a device pixel |
| C32 | minor | 9.2, P1 to P8, P11, AC-2, AC-15 | Verification gaps: checklists disagree with 9.2, C5's rest rule and the ADAPT fade go unchecked, H10 is missing in P11 |
| C33 | minor | 6.9, H9, AC-38 | "Today's" crossing bar is fixed at 0.576, a synthetic-layout value, though the test runs on captured layouts |
| C34 | minor | 6.9, P8, PF, D10/CP-4 | Four small gaps: `failedPlans` reset, I1's step, PF's wake tint, no re-check after a week |
| C35 | minor | Check log; whole plan | Bloat grew again; the round-2 log restates all 36 dispositions |

## Round-2 fixes: confirmed

All 36 round-2 dispositions are in the text, at the places they name. Specifically:

- **Mine.** C19 (`wakeColor` everywhere; no bare `meteor.wake` color remains), C21 (`speed` in `debug-frame`; AC-1, AC-2 and AC-15 test the law times the measured speed), C23, C24 and C26 landed as described. C18, C20, C22 and C25 landed with the residues in C29, C33, C32 and C28.
- **Other lenses.** `CAMERA.maxLag` (stepCamera, doc, H5, AC-39, R-16), the lean's motion test (6.2, 6.13, H13 case 5, AC-14 in P7), the fallback timer's divisor (6.2, H4), `skyMoved` (S4, M1, 6.1, 6.3), production builds in every phase (5.4, 7.0, R-18), the scroll-0 H2 rows (P2, AC-35), `radiantTries` and the interim fireball path (6.10), the ported-lines rebase rule (8.5, 8.6), the route to master (8.5 step 2), the comet's guards (6.12, AC-25, I9), CP-5, and D1's wording.
- **Residues of other lenses' fixes**, raised here because they break a gate or a step: CG2-4 (C28) and CG2-3 or PHY-6 (C31).

## Major findings

### C28. P8 keeps the sticky radiant across a resize, so P8 can't launch "exactly as today"

- **Section.** 6.9 "In the worker (P8)"; `dropTransients` and `VisitMemory`; P8's files and "No visible change"; H7.
- **Problem.** Round 2's fix for CG2-4 and C25 made `dropTransients` keep the visit's memory and moved every reset to `forgetVisitSky`, which the worker calls only "From P9". In P8 the memory is the sticky radiant, and today the resize handler clears it. So from P8 a resize keeps the old radiant, and the next launch draws different random numbers from the oracle's. P8's gate, H7's oracle equality, fails on every sequence with a resize. This is a regression of that fix.
- **Evidence.**
  - Today: `resize` sets `radiant = null; meteor = null` and then calls `retryMeteors(now)` (`sky.worker.ts:369-371`). A null radiant makes the next launch call `pickRadiant` (`:208-212`), which draws two random numbers (`meteors.ts:67-71`). A hidden tab keeps the radiant (`:446-450`).
  - The plan maps both lines to one call that keeps the memory: "Hidden and resize call `dropTransients` (`:448`, `:369-370`). From P9, resize and a layout whose quiet rects changed ... also call `forgetVisitSky`" (PLAN.md:2161). `dropTransients`: "the visit's memory stays" (PLAN.md:2017). P8's files have no `forgetVisitSky` call (PLAN.md:2988-2992); P9's do (PLAN.md:3019).
  - `VisitMemory` in P8 is "the sticky radiant, as the veil commit leaves it" (PLAN.md:1903). The veil session's sticky radiant is "re-picked on resize, on layout, or after N failed plans" (COORDINATION.md:49), so after V the oracle may reset on layout too.
  - P8's gate: "the same radiant behavior ... (H7's oracle equality)" (PLAN.md:3001). H7 runs "random event sequences (scroll, layout, pause, hidden, resize, idle)" and requires "for the same seed and inputs, P8's launches and gaps equal the oracle's" (PLAN.md:2683). P8's step 2 needs H7 green (PLAN.md:2996).
- **Fix.** From P8, call `forgetVisitSky` on resize (in P8 it clears `visit.radiant`; from P9, `visit.sky`), and wherever the veil-era code re-picks its radiant (a layout, if their commit does). Keep "a hidden tab keeps it". Change 6.9's worker bullet, P8's `sky.worker.ts` entry and the `VisitMemory` doc to match, and add a resize case to H7's oracle check.

## Minor findings

### C29. Four phases still have steps that can't be green commits

- **Section.** 7.0 ("one commit per numbered step, each green", PLAN.md:2616); the steps of P3, P4, P6 and P7. The C18 disposition says "Every step compiles" (PLAN.md:3563).
- **Evidence** [computed, `steps.ts`, TypeScript 6.0.3]:
  - **P4.** Step 2 adds "the `activity` case" to the worker (PLAN.md:2868); step 3 adds "The `activity` message" (PLAN.md:2869). Until then `SkyMainMessage` has no `activity` member (`protocol.ts:35-67`), so step 2 fails with `TS2678: Type '"activity"' is not comparable to type ...`.
  - **P6.** Step 1 is "Config and the camera, with H5 green before any wiring" (PLAN.md:2929). `CameraInput.drift` is required (PLAN.md:629-630), and the worker's call from P2 passes no drift (PLAN.md:778, :853), so step 1 fails with `TS2345: Property 'drift' is missing`.
  - **P7.** Step 1 adds the lean springs (PLAN.md:2962); `CameraInput.lean` is required (PLAN.md:631-632); the worker wiring is step 3 (PLAN.md:2964). Same `TS2345`, for `lean`.
  - **P3** (softer). Step 2's `driftCap` reads `softwareFps` (PLAN.md:1117), which step 5 adds; step 3's fallback timer reads `divisor.k` (PLAN.md:1157), which step 4 adds (PLAN.md:2836-2839). Both are undeclared names until the later step.
- **Fix.** P4: put the message type before the worker case (swap steps 2 and 3). P6 and P7: step 1 also passes `drift: 0` and `lean: { x: 0, y: 0 }` in `updateCamera`. P3: declare `softwareFps = Infinity` and the `divisor` with the code that first reads them.

### C30. P10's fireball rule has no reveal time to read

- **Section.** P10 files (PLAN.md:3047); 6.9 `PlanContext` (PLAN.md:1912-1922) and `TransientSpec` (PLAN.md:1931-1944).
- **Evidence.**
  - P10: "the meteor spec decides fireballs before planning: desktop only, at least `after` s since the reveal" (PLAN.md:3047), with `METEOR_KINDS.fireball.after: 20` (PLAN.md:3058).
  - The spec's only planning hook is `plan(context)` (PLAN.md:1937). `PlanContext` holds `random`, `now`, `field`, `visit`, `mayCrossCopy` and `narrow`, and `VisitMemory` holds no reveal time. The time since the reveal reaches only `nextAfter` and `LaunchGate.sinceReveal` (PLAN.md:1935, :1984).
  - [computed, `steps.ts`] Reading it gives `TS2339: Property 'sinceReveal' does not exist on type 'PlanContext'`.
- **Fix.** In P10, add `sinceReveal: number` to `PlanContext` (filled from `gate.sinceReveal` in the launch step) and list it in P10's `transients.ts` entry.

### C31. The first Play after a snapped load still hops the stars

- **Section.** M1 (PLAN.md:283), 6.1's worker notes (PLAN.md:842-851), 6.3's snap table, AC-9, AC-27, H13 case 3. A residue of CG2-3 and PHY-6.
- **Problem.** Stars snap to whole pixels until motion is first full in the page view. On a load under reduced motion or paused, the first Play (or reduced motion turned off) sets `skyMoved`, so every star moves from its rounded pixel to its quarter-pixel phase in one frame, while the 0.3 s ease has barely moved anything. The check log says "no hop, so AC-9 and AC-27 hold as written" (PLAN.md:3542), but that holds only for a pause after a full-motion load.
- **Evidence.**
  - `placePoint` draws a snapped star at `Math.round(px)` and an unsnapped one at `floor(px)` plus its nearest quarter phase (PLAN.md:1247-1266). [computed, `unsnap.mjs`, 10⁶ positions] The two differ by at most 0.500 device px (mean 0.250), and 25% of stars move by more than 0.25 device px.
  - AC-9 allows "normal + 0.25 px" per frame at "pause, reduced motion" (PLAN.md:3301). At DPR 1 a quarter of the stars break it. AC-27 says turning reduced motion off "resumes without a jump" (PLAN.md:3319).
  - H13 case 3 checks only the pause direction and that "a load under reduced motion draws snapped frames" (PLAN.md:2689).
- **Fix.** State the exception in AC-9 and AC-27: once per page view, after a snapped load, the first full-motion frame may move a star by up to half a device pixel. Add an H13 case for it (a reduced-motion load, then Play: one frame of at most 0.5 device px, then the eased drift).

### C32. Verification gaps

- **Section.** 9.2's "Phase" column against each phase's checklist; P2, P6 and P11 verification; AC-2 and AC-15.
- **Evidence.**
  - **Checklists against 9.2.**
    - P1's checklist (PLAN.md:2780) lacks AC-11, which 9.2 maps to P1 (PLAN.md:3303).
    - P2's (PLAN.md:2817) lacks AC-1's scroll part, AC-9 and AC-30 (PLAN.md:3293, :3301, :3322).
    - P3's (PLAN.md:2848) lacks AC-10 (PLAN.md:3302).
    - P5's (PLAN.md:2914) lacks AC-9.
    - P8's (PLAN.md:3005) lacks AC-30.
    - The other way round, P7 lists AC-3, AC-14 and AC-26 (PLAN.md:2971) and P13 lists AC-10 and AC-13 (PLAN.md:3115), but 9.2 maps none of them to P7 or P13.
  - **C5's rest rule ships unchecked in P2.** P2's `stepCamera` carries it (PLAN.md:712-714), and it exists because a 100 px scroll after a minute at rest would otherwise land in one frame (C5, PLAN.md:273). In P2 that happens whenever the worker has slept, in the reading scene or after the idle window. But P2's verification (PLAN.md:2810-2817) has no case for it, and H13 case 2, which tests it, runs from P5 (PLAN.md:2689).
  - **P11 omits H10.** 7.1 maps H10 to P8 to P12 and states the satellite's 4.8 s (PLAN.md:2686), and P11's checklist has AC-31 and AC-37, whose "How" is H10 (PLAN.md:3323, :3329). P11's verification lists H7 only (PLAN.md:3081).
  - **The ADAPT fade ("do it", PLAN.md:2933-2938)** is in none of P6's four steps (PLAN.md:2928-2932). Its worker parts are missing from P6's `sky.worker.ts` entry (PLAN.md:2926): `thinnedAt` in `stepDown`, `frameAt`'s `thinFrom`, `thinLevel` and `keep`, and the fade line in `frameDemand`. No check covers it, and E11's ACs don't touch it.
  - **AC-2 and AC-15 read the debug log's `speed`**, which is `cameraSpeed` (PLAN.md:2671): the drift plus the scroll glide and the lean (PLAN.md:765-772). AC-15 speaks of "the camera's drift speed", but read right after the scroll into the reading scene, the glide alone can exceed its 0.5 v₀.
- **Fix.**
  - Make the phase checklists and 9.2's column agree.
  - Add to P2's H5: "a 100 px scroll after 60 s at rest moves the brightest star at most 1 px in the first step".
  - Add H10 to P11's verification.
  - Give the ADAPT fade a step, its worker entries and a check (force step 1 with a local patch: the thinned stars fade over 1 s on fade frames, then one final frame).
  - Read AC-2 and AC-15 after at least 1.2 s without scroll or pointer input.

### C33. The crossing bar is a synthetic-layout number

- **Section.** 6.9's cooldown rule and table (PLAN.md:2097-2105); H9 (PLAN.md:2685); AC-38 (PLAN.md:3330).
- **Problem.** The rule sets the cooldown against "today's (0.576 a minute over a visit's first two minutes)", and AC-38 says "on captured layouts (today 0.576 there ...)". But 0.576 is today's rate at R2's 36% crossing share, measured on a synthetic hero with estimated rects (R2:143, :147; R2:701 "Crossing frequency was measured on a synthetic layout"). On captured layouts, today's own share sets the bar, and the table's parity row moves with it. I8 already asks for today's share on captured layouts (PLAN.md:3165), but the rule doesn't use it.
- **Evidence** [computed, `unsnap.mjs`, from the plan's own numbers]. Today has no cooldown, so its crossings scale with its share: 0.576 / 0.36 = 1.6 launches a minute in the window. If today's captured share is 0.30, the bar is 0.480 a minute. The table's 55 s start at a new share of 0.16 then gives 0.518 (PLAN.md:2101) and fails, though the rule as written passes it.
- **Fix.** Say that "today's" is measured on the same captured layouts with today's planner (its crossing share × 1.6 launches a minute), recompute the parity row from it, and label 0.576 as the synthetic value in H9 and AC-38.

### C34. Four small gaps

- **`failedPlans` reset.** The launch step (PLAN.md:2057-2059) never sets `failedPlans[kind] = 0`. Today's code resets it on success (`sky.worker.ts:220`), and the field's doc says "in a row" (PLAN.md:1994). Without it, three failures spread over a visit stop the kind until a new layout, and H7's oracle check fails. Add the reset to step 4.
- **I1 when declined.** P8's files add I1's `nearCopy` option and field "only if the veil session declined them" (PLAN.md:2986), but no step does it, and step 2's meteor spec needs it (PLAN.md:2996). Put it in step 1 or 2.
- **PF's wake tint.** PF's files and item 4 add `drawMeteor`'s "fade and wake tint" (PLAN.md:3121, :3254). The tint reads `meteor.wakeColor`, which arrives with I2 in P9 (PLAN.md:3020, :2406-2407). Limit PF to the fade, as P8's entry does (PLAN.md:2987).
- **No re-check after a week.** D10's recommended answer is to keep waiting until the veil session has been silent for a week (PLAN.md:176). But CP-4 asks the user "once" (PLAN.md:3149), and CP-1 runs only before phases, none of which run between P7 and V or PF. Nothing re-asks after the week. Add a dated re-check to CP-4 (for example, weekly until V or PF).

### C35. Bloat grew again

- **Section.** The check log; the whole plan. C27 left the rest to the DRY audit, which is planned, so only the parts that this revision added are raised here.
- **Evidence.**
  - PLAN.md has 53,067 words, up 7.5% from 49,368 in round 2 and 14% above R1 to R4 together (46,672). Section 6 alone has 23,271.
  - Round 2's check log (PLAN.md:3533-3572) restates all 36 dispositions in 1,125 words, with doubled IDs ("r2-physics-math-r2-physics-math-PHY-1"). That is nearly three times round 1's table (408 words), and it repeats the workflow's record and `drafts/check-r2-*.md`.
  - The one new fact of the glide cap (`maxLag`, about 25 px at H = 900) is restated in deviation 13, 2.2, C4, C5, SP1, the `CAMERA` doc, two 6.1 paragraphs, the `stepCamera` comment, P2 twice, H5, AC-39, R-16 and the log: 15 places. The copies agree today, but round 2 found a wrong copy (AC-2), so each restatement is a future inconsistency.
- **Fix.** Compress round 2's log into a table like round 1's, linking the check reports. Give the glide cap one home (6.1) and cite it elsewhere. Leave the rest to the DRY audit.

## Checked with no finding

- **Structure.** All 13 sections the brief requires are present and substantive, and the check log is there.
- **Settled defaults.** Every default is followed or listed in 1.1 with a reason (deviations 1 to 14). That includes the brief's "under reduced motion, snap exactly as today", which deviation 13 and M1 replace with "snap until the sky first moves".
- **Decisions.** D1 to D11 each have a recommended default and alternatives, and D10 now names a recommended answer.
- **Config.** Every new or changed constant has a value, units and a doc comment, including round 2's `CAMERA.maxLag`, `ADAPT.thinFade`, the redefined `METEOR.radiantTries` and the rewritten `METEOR` inner docs.
- **Phases.** Every phase has a goal, files, steps, a visible-change or no-visible-change statement, verification, a checklist, a rollback and a blocked mark (P10 and P11 by their place under V and 7.2's table).
- **P1 implementability.** The painter, `profile`, the phase-0 peak, the block layout's index, `placePoint`, the snap rule, the quiet-index body, the stamp cache and its guard, and H1 to H3 are all specified. The atlas sizes check out: at DPR 2, a plain 4 × 4 grid of today's blocks is 400 × 1,190 px, 1.9 MB, under B-10.
- **Code grounding spot checks.** The cited lines hold at 246c0aa: `meteors.ts:135`, `:147-152`, `:156`, `:165`; `renderSky.ts:100`, `:107`, `:113`, `:120`, `:127`; `sky.worker.ts:82-84`, `:208-220`, `:369-371`, `:441`, `:448`, `:465-469`, `:475-482`; `mountSky.ts:3`, `:146`, `:245`, `:261-268`; `README.md:75`, `:80`; `.claude/launch.json` has `autoPort: true` in both checkouts.
- **Numbers.** The gap means (11.69, 21.00, 84.46 and 41.72 s), the drift's speed medians in AC-2 (0.85 and 2.8 at the mean, 1.21 and 4.0 at the peak), AC-15's 1.41 and 2.4 px/s, the 39% first-minute satellite attempt, the 89 s satellite spacing and the 1.9 MB atlas all recompute.
- **R2 §10.** The radiant functions the plan takes from R2 (`radiantMotion`, `elevationAt`, `meteorRange`, `toward`, `sampleRadiant`) match the plan's `SkyWindow` and `SkyDirection` types and signatures.
- **Style.** No em or en dashes. The sketches use tabs, single quotes, no semicolons outside type literals (as `protocol.ts` does) and `@/` or relative imports as the rules require.
