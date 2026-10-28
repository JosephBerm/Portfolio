# Check round 6: physics and math

Adversarial checker, lens "physics-math", round 6, 2026-10-27. Planning only: this file is the only repository file written.

## Scope

- **Role.** Recompute every formula, constant and derived number in `PLAN.md` (3,979 lines, read in full), including the ones the veil reconciliation brought in (`scrollKept`'s ramp, the quiet reach, the crossing bar and the cooldown table; the plan no longer quotes per-rect budget numbers, only `inkBudget(headroom)` and PF's flat 0.0593 × peak). Confirm that round 5's PHY5-1 to PHY5-4 fixes landed correctly, and look for regressions from round 5's other rewrites (CG5-1's `gather` in `demandNow`, DRY-R5-3's `TRANSIENTS.scrollQuiet`, CA5-3's comet light, the P7 pacing text). No round-5 finding was rejected, so nothing is re-raised.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, "Confirmed veil interface (2026-10-27)" first), `research/01-planning-brief.md`, `PLAN.md`, the round-5 report, a word diff of `PLAN.md` against the round-5 snapshot (`check-r5-completeness/PLAN.snapshot.md`), the worktree code at 246c0aa (`config.ts`, `scene.ts`, `meteors.ts`, `sky.worker.ts`, `mountSky.ts`, `styles.ts`, `globals.css`), and the main checkout's uncommitted veil code, read only (`scene.ts`, `config.ts`, `sky.worker.ts`).
- **Output.** This report. Limits: no edit to `PLAN.md`, `src/` or any configuration, in either checkout; scripts only in the scratch folder.

## Method

Node 24.14 scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r6-physics/`:

- `camera.ts` is 6.1's `camera.ts` sketch extracted verbatim from `PLAN.md:616-843`, run under type stripping with stub `config.ts` and `scene.ts`; `port.mjs` is a parameterized port of its scroll part for H5's variants, and `crosscheck.ts` shows the two agree exactly (difference 0).
- `ac39.mjs`, `ac39b.mjs`: AC-39 and H5 for one-step jumps from rest, the jump at five phases between frames, H from 700 to 3,840, 30 to 144 Hz.
- `h5grid.mjs`: H5's flings (100 to 25,000 px/s) and eased in-out cubic jumps (3,000 to 20,000 px over 0.3 to 1 s), base config and both variants (`maxLag` 0.15, `scrollOmega` 12).
- `drift.ts`, `turnmean.ts`: drift speed, turn rate, headings and milestones from the extracted module; the mean turn rate over windows of 60 s to 30 minutes.
- `rates.mjs`, `ac20.mjs`, `firstcross.mjs`: first-minute launch counts and AC-20's 10-run pass rates, fireball and satellite first minutes, gap means, the first-crossing cooldown variant. `veil-reconcile/cooldown-reveal.mjs` re-run for 6.9's table; `reviser-r5/lean.mjs`, `lean-fine.mjs` and `lean-driftpaced.mjs` re-run for P7's pacing.

## Round 5's fixes: did they land?

| Round 5 | Landed | Notes |
|---|---|---|
| PHY5-1 AC-39 and H5 | yes, with a slip | 2.8 × 10⁻⁴ × H at 0.7 s holds everywhere: worst 2.731 × 10⁻⁴ × H, always a one-step jump just under `maxLag` × H at 30 Hz landing just after a frame (`ac39.mjs`). Flings and eased jumps stay at or under 1.71 × 10⁻⁴ × H, settle by 1.062 s and never overshoot, in all three variants (`h5grid.mjs`). But AC-39's parenthetical figures are the computed worst case, not the bound, and "settled by 1.2 s" holds only up to about H = 2,700: PHY6-1. |
| PHY5-2 lean pacing | yes | Re-run: at 1,440 px, DPR 2, 60 Hz, 60 fps from 300 px/s, steps 0.46, 0.55 and 1.05 device px at 300, 400 and 1,200 px/s. Under a 30 fps cap the largest steps are 2.19 (a 600 px window at 600 px/s) and 2.10 (after ADAPT's first step at 1,200 px/s), 6.13's "about 2". The drift-paced alternative gives 1.27 to 3.04 at 300 to 1,200 px/s (D3's "1 to 3"). 6.13, P7, AC-10, F3, E4, D3 and 10.2 agree with each other. |
| PHY5-3 reversal bound | yes | `maxLag` × H × 0.112 / (e(2 − ω/2f)) gives 5.06, 4.84 and 4.72 px at H = 900 and 30, 60 and 144 Hz (stated 5.1, 4.8, 4.7), above the simulated 4.98 to 5.00, 4.81 and 4.69 to 4.70, so it is a valid "at most". The cap paragraph's 8% and 4% are 1.0808 and 1.0411. |
| PHY5-4 satellite drift | yes | 2.5 °/s × 0.6 s × π/180 × (W/2)/tan 30° = 0.0227 × W: 32.65 px at 1,440, 58.0 at 2,560. |

**Regressions from round 5's other rewrites.** None in this lens. `gather` in `demandNow` is idempotent for one `now` and only refreshes the gates a message-driven `schedule` reads; `stepCamera` still runs only in `tick`, so no rate, clock or spring changes (DR1 to DR3, C5 hold). The comet's light, fade-in × `scrollKept(…, boxFade)`, matches the main checkout's `scrollKept` (`scene.ts:189-190`: clamp(fade) × (1 − smoothstep(12, 24, |Δ|))). One unit conversion that DRY-R5-3's move created is left implicit: PHY6-3.

## Findings

No blocking or major findings. Four minor ones, each cheap and clearly right.

### PHY6-1 (minor). AC-39's figures don't match its bound, and "settled by 1.2 s" fails between about H = 2,700 and 3,840

- **Section.** AC-39 (PLAN.md:3613); H5's spring row (:2930).
- **Problem.** AC-39 says "within 2.8 × 10⁻⁴ × H CSS px of rest 0.7 s after the page stops (0.25 px at H = 900, 0.39 at 1,440, 0.70 at 2,560) and settled by 1.2 s (1.3 s at H = 3,840)". The parenthetical figures are round 5's computed worst case (2.73 × 10⁻⁴ × H), not the bound, and at 1,440 the figure is rounded below that worst case. A tester who reads "0.39 at 1,440" as the threshold fails a correct sky at 30 Hz. Separately, H5 runs one-step jumps "at H up to 3,840" against "settled by 1.2 s, 1.3 s at H = 3,840", and heights between about 2,700 and 3,840 settle later than 1.2 s.
- **Evidence.** `ac39.mjs`, from rest with the jump landing just after a frame:
  - At 0.7 s the worst case is 0.2458, 0.3932 and 0.6991 px at H = 900, 1,440 and 2,560, all at 30 Hz with J = 0.2499 H. The bound gives 0.252, 0.403 and 0.717. So 0.393 > 0.39.
  - `ac39b.mjs` gives the latest settle over jumps up to 0.25 H, at 30 to 144 Hz: 1.2000 s at H = 2,560 and 2,700, 1.2333 s at 2,880, 3,000, 3,200 and 3,456, and 1.2667 s at 3,840.
- **Fix.** AC-39: "within 2.8 × 10⁻⁴ × H CSS px of rest 0.7 s after the page stops (0.25 px at H = 900, 0.40 at 1,440, 0.72 at 2,560; computed worst 0.246, 0.393 and 0.699), settled by 1.2 s up to H = 2,560 and by 1.3 s up to 3,840". H5: "settled by 1.2 s up to H = 2,560, 1.3 s up to 3,840".

### PHY6-2 (minor). AC-4's "mean 2°/s ± 0.2" has no window, and over the windows a browser log covers it fails by design

- **Section.** AC-4 (PLAN.md:3578); 6.1's drift table (:590, :594); H5's drift part (:2930).
- **Problem.** AC-4 passes on "Turn rate at most 4.4°/s with no step, mean 2°/s ± 0.2; speed never under 0.58 v₀". Its methods are H5 and L, but H5's drift list checks only the maximum turn rate, not the mean. So the debug log (L) is the stated way to check the mean. 2.00°/s is the long-run mean: over the minutes a session logs, the epicycles carry the heading up to asin(0.42) = 24.8° ahead of or behind the main circle. 6.1's own first-minute table already implies 71° in 55 s. Also, the turn rate and the speed in real seconds scale with the drift clock's rate: 0.6 on phones, and 0.35 and 0.8 in the reading and end scenes.
- **Evidence.** `turnmean.ts`, over 12 h of drift clock:
  - The mean turn rate over 60 s windows ranges 1.39 to 2.35°/s; over 120 s, 1.73 to 2.20; over 180 s, 1.73 to 2.21; over 300 s, 1.87 to 2.15; over 600 s, 1.93 to 2.05; over 1,800 s, 1.99 to 2.02.
  - From the dusk it is 1.47°/s over the first minute and 1.75 over the first two or three minutes.
  - On a phone the hero's real-time mean is 1.2°/s and its slowest speed 0.348 v₀.
- **Fix.** AC-4: "mean 2°/s ± 0.2 per second of drift clock over at least 10 minutes (shorter windows run 1.4 to 2.35°/s by design, 1.5°/s in the first minute after the dusk); speeds and turn rates per second of drift clock, that is, the debug log's values divided by its `rate`". Add the 6-hour mean to H5's drift list.

### PHY6-3 (minor). The launch gate's scroll-quiet test changes units from ms to s with no conversion stated

- **Section.** 6.9's `LaunchGate.settled` (PLAN.md:2157-2158), `TRANSIENTS.scrollQuiet` (:2272), P8's move (:2279) and "In the worker" (:2358); P8's files and steps (:3240, :3254).
- **Problem.** P8 replaces `FRAME.meteorScrollQuietMs` (1200 ms) with `TRANSIENTS.scrollQuiet: 1.2` in seconds, and the worker builds `settled` from "the scroll-quiet test (`:202`), now against `TRANSIENTS.scrollQuiet`". That test reads `now - lastScrollAt < FRAME.meteorScrollQuietMs` (worktree `sky.worker.ts:202`), and both `now` and `lastScrollAt` are worker milliseconds. The plan states the ms-to-s conversion for `holdTransients` and `retryTransients` (:2360) but not here. A literal swap compares milliseconds with 1.2, so launches stop waiting 1.2 s after a scroll: they start about 1 ms after it, while the glide still runs. That contradicts P8's "launching exactly as before".
- **Evidence.** The gate is filled by the worker (`LaunchGate`: "the worker fills it from its own state every tick"). H7 feeds `updateTransients` a gate the harness builds itself, so H7 can't catch a missing × 1000 in the worker's `launchGate`. No H13 case run in P8 checks the launch delay after a scroll: case 0's scripted flight and scroll compare P2's worker with P3's.
- **Fix.** 6.9 and P8: "`settled`: `now - lastScrollAt >= TRANSIENTS.scrollQuiet * 1000` (worker ms; the key is in seconds)". Add a P8 check: no launch within 1.2 s of the last `scroll` message (debug log, or an H13 case).

### PHY6-4 (minor). AC-20's "median 5" over 10 browser runs fails a correct sky about half the time

- **Section.** AC-20 (PLAN.md:3594); H9 (:2934); 2.1 (:85).
- **Problem.** AC-20 passes on "First 60 s of hero: median 5, 3 to 6 in ≥ 8 of 10 runs (simulated 90%)", by H9 and L. "Median 5" read as the median of the 10 browser runs is a coin toss, because the count's distribution is broad. The window's time base (from load or from the reveal) is also unstated: 2.1 counts from load, and the first delay counts from the reveal.
- **Evidence.** `ac20.mjs`, using P9's gap law and class durations:
  - Counts from the reveal: 3 in 9.3% of runs, 4 in 26.2%, 5 in 32.3%, 6 in 22.2%, 7 in 7.9%.
  - Over 10 runs, the median is exactly 5 in 55.6% of trials and 4.5 to 5.5 in 82.9%. The "3 to 6 in ≥ 8 of 10" part passes 93.3%. From load, the figures are 42.4%, 69.7% and 97.8%.
  - H9's simulated median is 5 on either time base: 3 to 6 in 90.4% from the reveal and 93.7% from load (`rates.mjs`).
- **Fix.** AC-20: "First 60 s after the reveal: median 5 over H9's 20,000 simulated visits; in the browser, 3 to 6 in ≥ 8 of 10 runs (a correct sky passes about 93% of the time; the 10-run median alone is 5 only about half the time)".

## Recomputed and confirmed

These need no change.

- **Camera.** The extracted `camera.ts` loads and matches the port exactly.
  - Spring timings: 95% at 0.474 s and 99% at 0.664 s for ω = 10; 1.19 s for the lean's ω = 4. Motion's visualDuration is 2π/(1.2ω) = 0.524 s.
  - The trail at 1,000 px/s is 14 px at q = 1 and 22.4 px for the brightest. The cap binds at 1,227, 1,174 and 1,125 px/s at H = 900 (30 Hz, 60 Hz, continuous). A one-step jump over ωH/2 = 4,500 px/s, the lean's 27 px reach and the key-range figures (3.76 million px, cell 14,680) also check.
  - H5's whole grid stays within 2.8 × 10⁻⁴ × H at 0.7 s with no overshoot (`h5grid.mjs`).
- **Drift.**
  - Radii 85.94, 15.94 and 4.27 px; speed 0.580 to 1.420 v₀; largest change of speed 3.78% per second of the current speed; turn rate at most 4.33°/s, mean 2.000.
  - Wander 205.17 px, against the bound 205.24 and `DRIFT_REACH` 212.30.
  - First-minute headings 18.9, 9.1, −1.6, −6.7, −16.1 and −51.9°, with speeds 0.92, 1.03, 1.18, 1.18, 0.96 and 0.68 v₀.
  - The heading points down at 69.4 s, left at 121.0 s and up at 151.3 s; 24.3 px from the start at 180 s; within 30° of level for 53 s.
  - Beats of 68.8 and 127.3 s; the exact repeat after 25 h.
- **Depth and speeds.** q spans 0.240 to 1.600, capped from m = 0.112. Band means are 0.293, 0.501 and 1.024 and medians 0.284, 0.476 and 0.941; star shares are 5.06, 23.46 and 71.48%. 6.1's speed table, AC-2's 0.85, 2.8, 1.21, 4.0 and 6.82, AC-15's 0.497 v₀, 1.40 and 2.39 px/s, and AC-27's 1.02 px (6.82 × 0.15) all check.
- **Pacing.** Every cell of 6.2's table checks: 20.4 and 27.3 fps; steps 0.33 to 0.50, 0.45 to 0.47, 0.36 to 0.45, 0.23 to 0.24 and 0.37 to 0.41. So do 19.2 fps at v₀, the 1.04 v₀ threshold, 36 fps at v₀ = 4, the 3.30 threshold and 10.1's CPU shares (0.4 to 1.2%, 1.6 to 3.4%, 6.6 to 7.8%).
  - 10.2's extra frames check: 190 to 254 for meteors (4.7 × 1.35 s), 97 to 130 for satellites and 94 today.
- **Transients.**
  - Gap means are 11.690, 21.004, 84.460 and 41.718 s; satellites pass every 89.26 s, and 39.3% of visits get a first attempt within 60 s of the reveal.
  - The first minute holds 5 launches at the median, 3 to 6 in 90 to 94% of visits, and a fireball in 11 to 12% of them.
  - Re-running `cooldown-reveal.mjs` gives the bars 0.303, 0.399 and 0.464 and reproduces 6.9's whole table: 0.295 to 0.460 a minute at 55 s, settings 55 to 95, 40 to 75 and 30 to 55 s.
  - A first-crossing start gives 0.404 to 0.491 a minute and meets 0.46 only for shares up to 0.22, at 80 to 110 s (`firstcross.mjs`).
- **Geometry.**
  - `meteorRange` is 100.0, 171.7 and 477.4 km. On 1,440 × 900, `SKY_WINDOW` spans 17.6° to 59.8°, and a start on the centre row dims to 0.621. Satellites run at 21.77 px/° (26.1 to 54.4 px/s, 125 to 261 px a pass).
  - `segmentClear`'s worst miss is the 8 px chord's sagitta on a 40 px feather corner, 0.201 px: `quietAt` is Euclidean (`scene.ts:71-81`).
  - The comet's About-row guard matches `styles.ts:7` (60, 80 and 100 px of section padding) and `globals.css:203` (a 10 px header margin).
- **Contrast and limits.** PF's flat veil adds 0.585 × (2 × 0.05 + 0.52 × 0.05²) = 0.0593 per unit of peak, so a peak of 1 adds 0.059 and 0.9 adds 0.053, against 0.064. The control reaches 14.13:1 and 12.71:1, and a 10% mint fill 1.28:1. `scrollKept` and `QUIET_REACH` − `QUIET.padding` = 40 = `QUIET.feather` match the main checkout (`config.ts:153`, `scene.ts:189-190`). H10's 4.9, 4.8, 3.8 and 3.2 s check.

## Outside this lens (for the coordination checker)

The main checkout's working tree moved after round 5: `scene.ts` (19:29) and `sky.worker.ts` (19:43) now give `QuietBlend` a `next` (the waiting layout's zones). `transientQuietFactor` also takes the minimum with `quietFactor(blend.next, …)`. That makes T3's and 6.11's "a layout that arrives mid-ease waits up to `QUIET.ease`" conservative for drawing. But a satellite planned against the applied zones can then fade where a waiting layout adds a rect. This is not part of the confirmed interface yet; 8.5 step 2's recheck of "observed" names should include it.

## Summary

- **Verdict: pass.** No blocking or major findings. Round 5's four fixes landed; their numbers re-run within rounding, and round 5's other rewrites changed no physics.
- **Four minor findings, each a sentence to fix:**
  - AC-39's parenthetical understates the bound at 1,440 (0.39, against a computed 0.393 and a bound of 0.40), and "settled by 1.2 s" holds only up to about H = 2,700.
  - AC-4's mean turn rate needs a window and drift-clock units: 1.4 to 2.35°/s over 60 s by design.
  - `TRANSIENTS.scrollQuiet` needs its × 1000 at the worker's ms gate.
  - AC-20's "median 5" belongs to H9, not to 10 browser runs, where it holds only about half the time.
