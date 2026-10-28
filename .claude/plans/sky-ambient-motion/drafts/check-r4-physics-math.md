# Check round 4: physics and math

Adversarial checker, lens "physics-math", round 4, 2026-10-27. Planning only: this file is the only repository file written.

- **Scope.** Recompute every formula, constant and derived number in `PLAN.md`, including the ones the veil reconciliation changed (per-rect ink budgets from `headroom`, the `scrollKept` ramp, the crossing bar, the cooldown table, the quiet reach). Confirm round 3's physics-math fixes (`drafts/check-r3-physics-math.md`, the "Round 3" part of the Check log) and check the "Veil reconciliation" part through this lens. Look for regressions either introduced.
- **Inputs.** `PLAN.md` (3,646 lines), `HANDOFF.md`, `COORDINATION.md` (all of it, "Confirmed veil interface" first), `research/00-shared-brief.md`, `research/01-planning-brief.md`, R1 to R3 where the plan cites them, the round-3 reports and the reviser's scripts (`reviser-r3/`, `veil-reconcile/`), the worktree code at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `src/lib/utils.ts`, `globals.css`), the main checkout's uncommitted veil code read only (`scene.ts`, `config.ts`, `meteors.ts`, `renderSky.ts`), and Motion's `spring.mjs` in `node_modules/motion-dom`.
- **Method.** Node 24.14 scripts in the session scratchpad, `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r4-physics/` (not in the repository):
  - `camera.mjs`: the plan's `stepCamera` scroll part exactly as 6.1 writes it (`springStep`, the one-step snap, the lag cap with the steady-trail velocity, `settle`): flings, eased jumps, one-step jumps, reversals, the rest rule.
  - `camera-rate.mjs`, `h5grid.mjs`, `foh.mjs`, `tol.mjs`: the glide after a stop compared across 30, 60, 120 and 144 Hz. After the stop the goal is held and `springStep` is exact, so each rate's glide is evolved analytically from its state at its first frame on or after the stop and compared at common times (no sampling offsets).
  - `glidestep.mjs`: the glide's true step per drawn frame.
  - `rates.mjs`: the bar, the cooldown table, the first-crossing variant, the five-minute window, first-minute counts and gap means, written independently of the reviser's scripts (the shower's class fixed per visit, a xorshift generator, up to 2 × 10⁶ visits per cell).
  - `contrast.mjs`, `drift.mjs`, `pacing.mjs`, `ac7.mjs` (0.5, 0.25 and 1 s grids), `reversal.mjs`.

**Verdict: revise.** 2 major and 4 minor findings. Round 3's fixes landed, and the reconciliation's numbers reproduce. Both majors are pass/fail criteria that a correct implementation fails by design, each made by combining or generalizing round-3 fixes: H5's frame-rate tolerance (and C4's claim behind it), and AC-10's step bound applied to the scroll glide in P3.

## Round 3's fixes: did they land?

| Round 3 | Landed | Notes |
|---|---|---|
| PHY3-1 cap velocity | yes | `stepCamera` sets `ω × maxLag / 2` (PLAN.md:705). Re-run: no overshoot for flings of 1,000 to 25,000 px/s at H 700 to 3,840 and 30 to 144 Hz, with `maxLag` 0.15 and with `scrollOmega` 12 (0.000 px); eased jumps glide at most 23.65 px at H = 900. But C4 and H5 generalize "the same glide at any rate" beyond the capped case: PHY4-1. |
| PHY3-2 AC-10 | yes | The line fit is gone and the true step is bounded. But AC-10 now reads "for every star", and round 3's checklist pass (C32) put "AC-10 (the glide)" into P3: PHY4-2. |
| PHY3-3 AC-7 | yes | The wording landed. Its design numbers came from a 1 s grid of start times: PHY4-6. |
| PHY3-4 AC-39 | yes, for steady trails | 0.294 px at H = 2,560 and 0.441 at 3,840 at 0.7 s, settled by 1.17 s (reproduced). A one-step scroll under the cap leaves more: PHY4-4. |
| PHY3-5 slips | yes, all | 1.18 v₀ (2.1); 19.2 and 19.7 fps (6.2); medians 0.85 and 2.8 at v₀ (AC-2); "about 0.47 v₀" (AC-15); 1.78 to 4.36 and 0.51 to 1.25 px/s (6.1); 18 to 60° (`SKY_WINDOW`). |

## The veil reconciliation, through this lens

| Item | Result |
|---|---|
| Per-rect ink budgets | Reproduced with the confirmed `inkBudget` (`scene.ts:161` in the main checkout: `min(ceiling, max(0, (headroom − hazeReserve − STAR_INK_PEAK) × safety))`, `STAR_INK_PEAK` 0): slate body text's headroom is 0.0822 of white at 4.5:1 (budget 0.0515, "about 0.05"); the tagline and rails 0.19 (0.1485); the name 0.40 and green text 0.33 (the 0.2 ceiling). Section 11 and AC-30 match. |
| `scrollKept` ramp | `fade × (1 − smoothstep(12, 24, \|Δ\|))` (`scene.ts:186`): all light within 12 px, exactly 0 from 24 px, so the retire test at 0 fires. Deviation 8, 6.9, T4, AC-40 match. |
| Quiet reach | `QUIET_REACH − QUIET.padding` = 72 − 32 = 40 = `QUIET.feather`. The one-pass `quietFactor` skips every zone with `zoneQuiet` 0 (beyond the 40 px feather), and the ink term reaches only inside the padded zone, so Q1's exactness argument holds, rect-function keeps included. |
| Crossing table (6.9) | Reproduced independently: launches 1.598 a minute (the "× 1.6"); bars 0.304, 0.400, 0.464; at 55 s 0.294, 0.330, 0.361, 0.388, 0.425, 0.460; every setting matches except the 0.30-share, 0.40-bar cell, which is borderline (60 s gives 0.398 against 0.3996, so 60 or 65 s by seed). The first-crossing variant gives 0.403 to 0.491, and meets 0.46 only up to share 0.22 (from 80, 100 and 110 s). The definitions behind the bar are mixed: PHY4-3. |
| PF's contrast | Today's veil puts 0.9 × 0.5851 × (2 × 0.05 + 0.52 × 0.05²) = 0.0533 of white on copy; P9's highest normal peak (0.85) gives 0.0504, so PF's "0.053 stays within 0.064" holds with the new population. |
| P9's wake tints | The veil fits light counted in units of the theme white (`brightest`, `headGain`, `WAKE_GAIN`, `renderSky.ts:230`). Navy plus 0.08 of mint has luminance 0.02445 and navy plus 0.08 of pale yellow 0.02398, against 0.02485 with white, so neither tint can push copy past its budget. |
| Satellites' 8 px sampling | `quietAt` uses Euclidean corners (`scene.ts:77` at 246c0aa), so a chord under 8 px can graze a 40 px corner arc by at most its sagitta, 40 − √(40² − 4²) = 0.2005 px ("under 0.2 px"). |

## Major

### PHY4-1. C4's and H5's frame-rate agreement holds only for a capped stop: H5 fails its own eased-jump grid

- **Where.** C4 (PLAN.md:274); 6.1 "Integrators" (:442); H5 (:2723); the Check log's round-3 line (:3604).
- **Problem.**
  - C4: "the glide after the page stops is the same at any frame rate (30, 60 and 144 Hz within about 0.1 px for the brightest star [computed])". H5 makes it a P2 pass criterion: "glides alike at 30, 60 and 144 Hz wherever no step snaps (within 0.15 px, C4)". 6.1: "Both compose exactly, so 15, 60 and 144 Hz follow the same path".
  - That composition holds for a **held** target. A scroll moves during the step, and `springStep` steers toward each frame's newest goal for the whole step (a zero-order hold). So a spring following a steady scroll at V trails by about 2V/ω − V/(2f) at f frames a second, not 2V/ω. At V = 1,000 px/s the simulated trails are 183.34, 191.67 and 196.53 px at 30, 60 and 144 Hz, matching 200 − 16.67, 200 − 8.33 and 200 − 3.47 to 0.01 px.
  - The lag cap removes the difference only when it holds the spring at the stop (a fling over about 1.25 H px/s that stops abruptly, where the cap sets the state exactly). Below the cap, and in every eased jump (the ease slows the scroll, so the cap lets go before the stop), the glide depends on the rate.
- **Evidence** (brightest star, spread of the glide across 30, 60, 120 and 144 Hz, evolved analytically from each rate's stop frame):
  - Sustained scrolls stopping abruptly, frame-aligned: 0.41 px at 300 px/s, 0.82 at 600, 1.36 at 1,000 and 1.50 at 1,100 px/s (H = 900); the worst is 1.31, 1.69 and 2.70 px at H = 700, 900 and 1,440, at the speed where the cap starts to bind at 30 Hz (890, 1,145 and 1,830 px/s); 0.000 once every rate is capped (`camera-rate.mjs`, `foh.mjs`, `tol.mjs`).
  - H5's own eased grid (3,000 to 20,000 px over 0.3 to 1 s, H 700 to 1,440), run with two ease-in-out curves, cubic and sine: 50 of the 78 cells that never snap exceed 0.15 px. With frame-aligned stops (0.5 and 1 s) the worst is 0.50 px for the cubic (3,000 px over 1 s at H = 1,440) and 1.05 px for the sine (`h5grid.mjs`, `foh.mjs`). H5 doesn't define its ease, so either curve is a fair implementation.
  - The reviser's own run, `reviser-r3/lagfix.mjs`, prints 60-to-144 Hz differences of 0.23 to 0.92 px for the fixed spring (part of them from comparing 144 Hz samples up to half a frame off); the log quotes only the 30-to-60 Hz column ("within 0.11 px").
  - A first-order hold (stepping toward a goal that moves linearly over the step, closed form e(t) = −2u/ω + (A + Bt)e^(−ωt)) makes steady scrolls agree exactly (0.000 px) but still leaves eased jumps up to 1.18 px apart (`foh.mjs`), so a tolerance change is needed either way.
- **Fix.**
  - C4: "The spring is exact for a held target, and the lag cap leaves it at its steady trail, so after a scroll that ends capped the glide is the same at any frame rate. A moving scroll is sampled once per frame, so a spring below the cap trails by about 2V/ω − V/(2f): the glide after it differs between 30 and 144 Hz by up to about 0.002 × H px for the brightest star (1.7 px at H = 900, 2.7 px at 1,440), against a glide of up to 25 px. Only the one-step snap depends on the rate by design."
  - 6.1 "Integrators": "the spring follows the same path at 15, 60 and 144 Hz toward a held target, and the drift is a pure function of its clock; a moving scroll is sampled once per frame, so the spring trails it by V/(2f) less at f frames a second".
  - H5: "glides alike at 30, 60 and 144 Hz within 0.002 × H px wherever no step snaps (1.4, 1.8 and 2.9 px at H = 700, 900 and 1,440; measured worst 1.31, 1.69 and 2.70), and within 0.01 px after a fling that stops while capped, with the stop on a frame of every rate", and name the ease (ease-in-out cubic).
  - Correct the Check log's "within 0.11 px".

### PHY4-2. AC-10's step bound can't hold for the scroll glide, which P3's checklist tests it on

- **Where.** AC-10 (PLAN.md:3358); P3's checklist "AC-10 (the glide)" (:2889); F3 (:292); E4 (:151).
- **Problem.**
  - Round 3 rewrote AC-10 as "True positions ...: at most 0.5 device px per drawn frame for every star" (PHY3-2), and its checklist pass put "AC-10 (the glide)" into P3 (it was absent from P3 in round 2). F3 states the same bound as an invariant enforced by "`motionFps`, `refreshDivisor`", and E4 as a requirement.
  - `refreshDivisor` can't go below k = 1. When the camera needs more frames than the display has, every refresh is drawn and the step is speed ÷ refresh rate. A glide starts at the scroll's own trail speed (ωL/2 = 1.25 H px/s of scroll when capped), so for its first few tenths of a second no display can keep its steps under 0.5 device px.
- **Evidence** (`glidestep.mjs`, the glide −L(1 + ωt/2)e^(−ωt) times 0.112, every refresh drawn):
  - a DPR-2 laptop, H = 900, 60 Hz, after a capped stop: up to 4.18 device px per frame, over 0.5 px for the first 0.37 s;
  - the same after a 1,000 px/s scroll (P3's own example): up to 3.72, over 0.5 px for 0.35 s;
  - DPR 1 at 144 Hz: up to 0.87, over 0.5 px for 0.15 s.
  - The plan's own P3 note, "after a 1,000 px/s scroll it needs over 30 fps for about 0.4 s", is consistent: for about 0.35 s of that it needs over 60.
- **Fix.**
  - AC-10: "True positions, while the camera needs at most the display's refresh rate (the drift, the lean, and a glide once it is slower than 0.5 device px per refresh): at most 0.5 device px per drawn frame. While a glide needs more, every refresh is drawn (k = 1); at DPR 2 on 60 Hz the brightest star then steps up to about 4 device px a frame for the glide's first 0.37 s."
  - F3: "at most `PACING.stepPx` device px per drawn frame whenever the display's refresh rate allows it, otherwise every refresh (k = 1)". E4 likewise.
  - P3's checklist: "AC-10 (the glide: k = 1 while it needs more than the refresh rate, true steps of at most 0.5 device px once k > 1, drawn positions within 1/8 px of true)".

## Minor

### PHY4-3. The provisional crossing bar counts passes, but a crossing is a `nearCopy` launch

- **Where.** 6.9 "The bar" and "Why the reveal starts it" (PLAN.md:2124-2125) and its table; deviation 11 (:63); H9 (:2727); AC-38 (:3386); R-10 (:3481).
- **Problem.**
  - The plan defines a crossing as a launch whose meteor reports `nearCopy` (:2123), which the confirmed planner sets for any flight whose head is within the 40 px feather of a padded zone at any sample after p = 0.47 (main checkout `meteors.ts:155-157`, `nearCopy: dimFrom < 1` at :245).
  - The bar's 0.30 to 0.46 comes from the veil session's pass shares instead: the head behind copy at 0.12 white or more for 0.1 s, in 19 to 29% of flights. Every pass dims, so passes are a subset of `nearCopy` launches. By the same session's numbers, before the edge-fade rule another 24 to 36% of flights dimmed at a copy edge without passing behind it (COORDINATION.md:136), so the `nearCopy` share was then at least about 43 to 65%, not 19 to 29%. Today's planner has 0% passes but plenty of `nearCopy` flights, so under PF a pass-based bar would be 0.
  - So the table's rows ("veil share", passes) and columns ("P9's crossing share", `nearCopy`) count different things, and H9 and AC-38 compare `nearCopy` counts with the pass-based "near 0.30 to 0.46".
  - Deviation 11's case for starting the cooldown at the reveal rests on those bars. A cooldown that starts at the first crossing reaches at most 0.40 to 0.49 a minute (reproduced). If the `nearCopy` bar measured at V is above that, a first-crossing start already meets it at some length, and starting at the reveal would only cost the visit's first `crossingCooldown` seconds of crossings.
- **Fix.**
  - Label 0.30 to 0.46 as pass-based, a lower bound of the `nearCopy` bar, wherever it appears.
  - At V (8.5 step 5), count `nearCopy` launches for both the veil planner and P9 on the same layouts.
  - Before fixing deviation 11, compare the reveal start with a first-crossing start against that bar.
  - Say that the 55 s placeholder is conservative.

### PHY4-4. AC-39's tall-viewport qualifier covers steady trails, not a one-step scroll under the cap

- **Where.** AC-39 (PLAN.md:3387); H5 (:2723).
- **Problem.**
  - A scroll that arrives in one step of J (more than nothing, but under about a quarter viewport, so neither the snap nor the cap acts) leaves the step response J(1 + ωt)e^(−ωt). At 0.7 s that is 8e^(−7) = 0.0073 of J, against 4.5e^(−7) = 0.0041 for the steady trail round 3 measured.
  - The worst one-way case is J just under maxLag × H, so the 0.3 px limit holds only up to about 1,470 CSS px tall, not 2,560. A fast wheel spin with smooth scrolling off can coalesce into one such step.
- **Evidence** (`camera.mjs` part D, 60 and 144 Hz): at 0.7 s, 0.184 px at H = 900, 0.294 at 1,440, 0.52 at 2,560 and 0.78 at 3,840; settled by 1.17 s at 2,560 and 1.22 s at 3,840 (AC-39 says 1.2 s). Analytic: 0.25 H × 8e^(−7) × 0.112 = 2.0 × 10⁻⁴ × H px.
- **Fix.** In AC-39, "within 0.3 CSS px of rest at 0.7 s on viewports up to 1,440 CSS px tall; taller, up to 2.0 × 10⁻⁴ × H px (0.52 at 2,560, 0.78 at 3,840, settled by 1.25 s)". In H5, add one-step jumps of 0.1, 0.2 and 0.245 H.

### PHY4-5. A flick reversed in the last frame overshoots more than SP1's "about 2.5 px"

- **Where.** SP1 (PLAN.md:279); 6.1 (:516).
- **Problem.** SP1 says "at most about 2.5 px for the brightest star", from the reviser's sweep (reverse speeds up to 5,000 px/s, `reviser-r3/reversal.mjs`: 2.43). From the capped trail, a last-frame step back of about maxLag × H leaves the spring at its goal still moving at nearly ωL/2. The bound grows with the frame rate and with H.
- **Evidence** (`reversal.mjs`, H = 900): past rest up to 2.43 px at 30 Hz, 3.29 at 60 Hz and 3.99 at 144 Hz (a step back of 196, 208 and 217 px). The continuous limit is maxLag × H × 0.112 / (2e) = 4.64 px at H = 900 and 7.42 px at 1,440. A wider sweep in `camera.mjs` part E gives 2.71 to 2.88 px at 60 and 144 Hz.
- **Fix.** "A scroll reversed in its last frame can carry the brightest star up to about 3.3 px past at 60 Hz and 4 px at 144 Hz (at most maxLag × H × 0.112 / 2e, 4.6 px at H = 900), then back."

### PHY4-6. Small numeric slips

- **AC-7 (PLAN.md:3355) and 6.1 (:875).** "design 6.4 px, at a 9-minute lag; 9.8 px comparing absolute positions" come from start times on a 1 s grid (reproduced there: 6.38 px at 9.1 minutes, 9.76 px). On 0.5 s and 0.25 s grids the minima converge to 6.29 px at a 24.1-minute lag and 8.94 px absolute (`ac7.mjs`, `ac7b.mjs`, `ac7c.mjs`). AC-7's 5 px limit still holds. Say "6.3 px at a 24-minute lag; 8.9 px absolute".
- **6.9 (:2135).** "parity over a visit's first five minutes ... would need 60 to 125 s" covers shares 0.19 to 0.30 only (`veil-reconcile/cooldown-reveal.mjs`). Over the table's 0.16 to 0.36 it is 50 to 130 s (`rates.mjs`).
- **The plan at a glance (:33).** "about 3.5 times as often" is 3.4: launch cycles of 42.87 s today against 12.65 s (11.69 s mean gap plus a 0.96 s mean flight).
- **2.1's 8.25 to 10.75 s row (:84).** It describes P9 (the reveal's cooldown), where only the fast class cools to mint (6.10); one first meteor in three does. Say "cools to its wake color".

## Recomputed and confirmed

These need no change.

- **Depth.** q from magnitude 0.112 up is 1.6; band shares 5.1, 23.5 and 71.5%; scroll shares 0.0205, 0.0350 and 0.0717; Motion's visualDuration 0.52 s gives ω = 2π / (1.2 × 0.52) = 10.07 rad/s (`motion-dom/.../spring.mjs:137`).
- **Drift.** Radii 85.94, 15.94 and 4.27 px; speed 0.580 to 1.420 v₀, mean 1.026; wander 205.2 px (the bound); turn rate at most 4.33°/s, mean 2.00; first-minute headings 18.9, 9.1, −1.6, −6.7, −16.1 and −51.9° with speeds 0.92, 1.03, 1.18, 1.18, 0.96 and 0.68 v₀; within 30° of level for about 53 s; the comet's drift reach 165.0 q px down and 46.7 q px up (6.12's 165 and 47).
- **Springs.** 95% at 0.474 s and 99% at 0.664 s (ω 10); the lean's 95% at 1.19 s (ω 4); the lean stays within reach on each axis, because a critically damped spring from rest is a weighted average of past targets (its impulse response is non-negative and sums to 1). The rest rule: a 100 px scroll after a minute at rest moves the brightest star 0 px in its first step and 0.139 px in its second (11.2 px without the rule). The snap threshold at 30 Hz is 27,000 px/s for H = 900. A pause moves the brightest star 6.82 × 0.15 = 1.02 px (the integral of 1 − smoothstep is half the ease).
- **Pacing.** Every cell of 6.2's table; 19.2 fps at v₀, 36.4 fps at v₀ = 4, threshold v₀ 3.30; software raster floor(80 / 3.3 to 3.9 ms) = 24 to 20 fps, 2 fps at 29 ms; 10.1's CPU shares.
- **Rates.** Gap means 11.69, 21.00, 84.46 and 41.72 s; the first minute after the reveal has median 5 with 3 to 6 in 90.2% (93.6% over the first 60 s after load); satellites' first attempt within 60 s in 39.35% and passes 89.3 s apart; the long-visit stretch ×2 at 6 minutes and ×3 at 10; onsets one per 11.1 s with satellites (AC-18); 10.2's extra frames (6.4 s a minute of flight and wake; satellites 4.8 s every 89.3 s, 3.2 s a minute, the plan's "about 3.3").
- **Contrast and color.** Green on navy 14.13:1, on light navy 12.71:1, a 10% mint fill 1.278:1; R / (R + G + B) 0.372 for pale yellow and 0.423 for the warmest star tint; the far-star case 0.039 to 0.060 of white; AC-16 (b)'s 0.78 × 1.5 / 0.6 = 1.95 a second.
- **Limits.** H10's 4.9 s (fireball and train), 3.8 s (P8 flight and train), 3.2 s (fast class and train from P9), 4.8 s (satellite) and about 4.04 s (earthgrazer, 3.5 + 3 × 0.18); 6.11's 26 to 54 px/s and 125 to 260 px per pass at 21.77 px per degree.
- **Geometry.** Chromium's 2³¹ / 64 = 33.5 million px gives 3.76 million px and cell 14,680 for the brightest star; about 3,700 full-page pause cycles to reach the key range on a 20,000 px page; double spacing about 5 × 10⁻¹⁰ px under 4 million px.

## Summary

- **Majors.** Two verification gates fail a correct implementation.
  - H5's 0.15 px agreement across frame rates (and C4's 0.1 px claim) holds only after a capped stop. Sub-cap scrolls differ by up to about 0.002 × H px (1.7 px at H = 900, 2.7 at 1,440: a zero-order-hold trail of 2V/ω − V/(2f)), eased jumps by up to 1.05 px with frame-aligned stops, and 50 of the 78 non-snapping cells of H5's eased grid (two ease curves) fail.
  - AC-10's "0.5 device px for every star", which P3 applies to the glide, can't hold while a glide needs more frames than the display has: up to 4 device px a frame for its first 0.37 s at DPR 2 on 60 Hz.
- **Minors.**
  - The provisional crossing bar is pass-based while crossings are `nearCopy` launches, which also bears on deviation 11's reveal start.
  - AC-39 at tall viewports under one-step jumps.
  - SP1's reversal figure.
  - Four small slips.
- **Confirmed.** The reconciliation's numbers (ink budgets, `scrollKept`, quiet reach, the cooldown table, PF's 0.053, the wake tints) and every other figure reproduce.
