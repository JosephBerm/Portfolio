# Check round 5: physics and math

Adversarial checker, lens "physics-math", round 5, 2026-10-27. Planning only: this file is the only repository file written.

- **Scope.** Recompute every formula, constant and derived number in `PLAN.md`, including the ones the veil reconciliation changed (per-rect ink budgets from `headroom`, the `scrollKept` ramp, the crossing bar and the cooldown table, the quiet reach). Confirm that round 4's physics-math fixes (PHY4-1 to PHY4-6) landed correctly, and look for regressions in round 4's rewrites. Rejected findings are not re-raised; none were rejected.
- **Inputs.** `PLAN.md` (3,935 lines, read in full), `HANDOFF.md`, `COORDINATION.md` (all of it, "Confirmed veil interface (2026-10-27)" first), `research/00-shared-brief.md`, `research/01-planning-brief.md`, the round-4 report and the reviser's pre-round-4 copy (`reviser-r4/PLAN.before-r4.md`, diffed against today's plan), the worktree code at 246c0aa (`src/lib/sky/config.ts`, `src/components/sky/sky.worker.ts`, `src/components/styles.ts`, `src/components/Introduction.tsx`), and the main checkout's uncommitted veil code, read only (`config.ts`, `scene.ts`, `meteors.ts`, `sky.worker.ts`).
- **Method.** Node 24.14 scripts in the session scratchpad, `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r5-physics/` (not in the repository):
  - `cam.mjs`: 6.1's `stepSpring`, `settle` and the scroll part of `stepCamera` copied line for line, the rest rule (`steppedAt = null` at rest) included.
  - `reversal5.mjs`, `reversal5b.mjs`: SP1's reversal bound, from steady scrolls of 200 to 4,000 px/s and from adversarial goal sequences.
  - `ac39jump.mjs`: AC-39 and H5 for one-step jumps, with the jump landing between frames.
  - `h5grid5.mjs`, `c4stop.mjs`, `c4stop2.mjs`: H5's eased grid with its `maxLag` 0.15 and `scrollOmega` 12 variants; C4's glide spread with stops on and off the frames.
  - `lean5.mjs`, `phoneglide.mjs`, `pacing5.mjs`: 6.2's demand and divisor (with the 0.5 s hysteresis) for the lean, the glide on phones and the drift's average rate.
  - Inline checks: the drift's exact bound and heading milestones, the zero-order-hold trail in closed form.

**Verdict: revise.** 2 major and 2 minor findings. Round 4's text landed everywhere, but two of its new numbers miss a mechanism: the rest rule's dt-0 first step (C5) delays a jump's glide by a frame, which breaks AC-39's and H5's 0.3 px at 0.7 s at H = 1,440 (PHY5-1); and the camera's frame demand counts the lean's speed with no cap on a wide desktop, so P7's "keep the drift's divisor" check and AC-10's list fail by design (PHY5-2). The reversal bound round 4 wrote is the continuous one and is exceeded below the cap (PHY5-3).

## Round 4's fixes: did they land?

| Round 4 | Landed | Notes |
|---|---|---|
| PHY4-1 zero-order hold | yes | C4 (:276), 6.1 (:453, :527) and H5 (:2907). Re-run: sub-cap stops spread at most 1.66 and 2.70 px at H = 900 and 1,440, at any stop phase (`c4stop2.mjs`), within 0.002 × H; H5's eased grid at most 0.50 px (0.84 with `scrollOmega` 12, 0.50 with `maxLag` 0.15), no cell over 0.002 × H, no overshoot (`h5grid5.mjs`). Capped flings of 3,000 to 25,000 px/s agree exactly (0.000 px, both variants too) with the stop on a frame of every rate (`c4aligned.mjs`); between frames they shift by up to a frame (2.6 px at H = 900), which H5's qualifier already excludes. |
| PHY4-2 AC-10 and the glide | yes | AC-10, F3, E4, `PACING`'s doc and P3's checklist. Re-run: 4.2 device px at the glide's start, over 0.5 for 0.37 s. On phones the 0.5 s hysteresis keeps k = 1 through the fast part even under the narrow cap (`phoneglide.mjs`). But AC-10's list names the lean among the motions within the refresh rate, which it is not: PHY5-2. |
| PHY4-3 the bar | yes | Labeled a pass-based lower bound in deviation 11, 6.9, H9, AC-38 and R-10; 8.5 step 5 counts `nearCopy` for both planners. The main checkout still sets `nearCopy: dimFrom < 1` (`meteors.ts:249`). |
| PHY4-4 AC-39 at tall viewports | text yes, numbers no | The quoted 0.3 px at 0.7 s and 2.0 × 10⁻⁴ × H assume the jump's glide starts on the frame of the jump. From rest it starts a frame later: PHY5-1. |
| PHY4-5 the reversal | text yes, bound no | SP1 and 6.1 quote the continuous bound, `maxLag` × H × 0.112 / 2e. Below the cap the sampled spring moves faster than that bound assumes: PHY5-3. |
| PHY4-6 slips | yes | AC-7 and 6.1 (6.3 px at 24 minutes, 8.9 absolute), 50 to 130 s, "3.4 times", "cools to its wake color". |

**The reconciliation, rechecked.** The main checkout's `config.ts` (last written 15:58) and `scene.ts` (16:28) are unchanged since round 4. `meteors.ts` was edited at 17:34, but `planMeteor(random, field, radiant, now, options)`, `veiledFrom(zones, path, peak, ink)` (`:145`) and `nearCopy: dimFrom < 1` are as the plan observes, and the worker keeps today's gap law (`gapMin` 30, `gapMeanExtra` 12, `gapMax` 75). So round 4's results stand: budgets 0.0515 (body text), 0.1485 (tagline, rails) and 0.2 (name, green text); `scrollKept` = fade × (1 − smoothstep(12, 24, |Δ|)); `QUIET_REACH` − `QUIET.padding` = 40 = `QUIET.feather`; the cooldown table (unchanged since round 4, reproduced then).

## Major

### PHY5-1. AC-39's and H5's "0.3 px at 0.7 s up to H = 1,440" fail for a one-step jump from rest: the rest rule starts its glide a frame late

- **Where.** AC-39 (PLAN.md:3588); H5's spring row (:2907); C5 (:277) and `stepCamera`'s rest rule (:750-752); the round-4 log (:3845).
- **Problem.**
  - AC-39: "After any scroll that moves one way stops ..., at any frame rate, every star is within 0.3 CSS px of rest at 0.7 s on viewports up to 1,440 CSS px tall and settled by 1.2 s (taller, up to 2.0 × 10⁻⁴ × H px at 0.7 s, after a one-step jump just under `maxLag` × H: 0.52 px at 2,560, 0.78 at 3,840, settled by 1.25 s)". H5 makes it P2's harness criterion, "one-step jumps of 0.1, 0.2 and 0.245 H included", at H up to 1,440 and 30 to 144 Hz.
  - Those numbers are the step response J(1 + ωt)e^(−ωt) at t = 0.7 s, counted from the jump. But the camera rests before a one-step jump (P2 has no drift; later, idle or a drift-0 scene), and at rest it has forgotten its step clock (C5: "After a rest, a sleep or a hidden tab, the next step has dt 0"). So the first frame after the jump steps with dt 0 and the glide starts there, up to one frame after the page moved. In a browser it is nearly a full frame: the main thread posts the scroll during its frame, and the worker's next animation frame is the next vsync.
  - At 0.7 s after the jump the glide has run only 0.7 − 1/f s. Round 4's fix (my PHY4-4) missed this.
- **Evidence** (`ac39jump.mjs`, the code path of 6.1 with the jump landing just after a frame; closed form J × 0.112 × (1 + ω(0.7 − 1/f))e^(−ω(0.7 − 1/f))):
  - Worst case, a jump just under `maxLag` × H: 2.73, 2.36, 2.20 and 2.17 × 10⁻⁴ × H px at 30, 60, 120 and 144 Hz, against the plan's 2.0 × 10⁻⁴ × H. At H = 1,440: 0.393, 0.340, 0.316 and 0.313 px. AC-39's 0.3 px holds only up to H = 1,098, 1,270, 1,365 and 1,382 at those rates; a maximized window on a 1440p monitor (about 1,300 px tall) gives 0.355 px at 30 Hz and 0.307 at 60 Hz.
  - H5's own grid point, J = 0.245 H at H = 1,440: 0.386, 0.333, 0.310 and 0.306 px. A harness that lands the jump between frames fails at every rate. One that lands it on a frame passes (0.288 px). H5 says nothing about the jump's timing, while it does require "the stop on a frame of every rate" for its 0.01 px clause.
  - Taller: 0.70 px at 2,560 and 1.05 at 3,840 at 30 Hz (the plan: 0.52 and 0.78), settled at 1.267 s at 3,840 at 30 Hz (the plan: by 1.25 s; 1.233 s at 60 Hz).
  - Jumps over `maxLag` × H don't make it worse: the dt-0 step leaves the full jump as lag, the cap sets the steady trail, and its glide L(1 + ωt/2)e^(−ωt) leaves 0.0055 L at 0.7 − 1/30 s, against 0.0098 L for a jump just under the cap. While the drift runs the camera never rests, and the zero-order hold makes the jump act a frame early instead (at most 0.0076 L, for a jump up to 1.047 L that the cap, checked after the step, lets through at 30 Hz).
- **Fix** (either, stated in both AC-39 and H5):
  - Count from the sky's first frame that shows the stop: "within 0.3 CSS px of rest 0.7 s after the first frame that shows the scroll's last change (whose step has dt 0 when the camera rested, C5)". H5 then lands each one-step jump on a frame of every rate, from a camera at rest, and the plan's numbers hold (0.288 px for 0.245 H at H = 1,440; 2.0 × 10⁻⁴ × H taller).
  - Or keep the origin at the page's stop and restate the bound: "within 2.8 × 10⁻⁴ × H px of rest at 0.7 s (0.25 px at H = 900, 0.39 at 1,440, 0.70 at 2,560, 1.05 at 3,840; worst at 30 Hz, after a one-step jump just under `maxLag` × H that lands just after a frame while the camera rests), settled by 1.15 s up to H = 1,440 and 1.3 s at 3,840".

### PHY5-2. The lean drives the frame clock to every refresh on a wide desktop: P7's "keep the drift's divisor" check and AC-10's list fail by design

- **Where.** P7's verification (PLAN.md:3197); 6.13 (:2805); AC-10 (:3559); `cameraSpeed` (:803-810); `demandNow`'s camera lines (:1221-1223); `driftCap` (:1077-1079); F3 (:294); 10.2 (:3615-3625).
- **Problem.**
  - P7 checks: "drawn frames keep the drift's divisor while the mouse moves (AC-13)". 6.13 gives the reason: the `pointer` message "doesn't set `needsDraw`, which would draw on every refresh while the mouse moves and bypass the divisor: `demandNow` sets the frame state's camera line while `leanPending(scene)` ..., and caps those frames at `driftCap`". AC-10 lists the lean among the motions that need "no more frames than the display has (the drift, the lean, and a glide once ...)". That list was my wording in round 4's PHY4-2 fix.
  - The design does something else. `cameraSpeed` adds `LEAN.reach` × the lean springs' speed, and `motionFps` turns the brightest star's device px/s into frames at 0.5 px a frame. `driftCap` returns `Math.min(narrow ? 30 : slowed ? 30 : Infinity, softwareFps)`, which is Infinity on a wide GPU desktop. So while the pointer moves, k follows the lean's speed and nothing caps it.
  - A pointer moving at S CSS px/s across a window W px wide moves the lean target at 2S / W per second, and the brightest star at about 38.4 S / W CSS px/s once the spring follows. At W = 1,440 and DPR 2 that is 0.053 S device px/s on top of the drift's 9.6 to 13.6, so k drops to 1 at 60 Hz from about 100 CSS px/s of pointer motion.
  - Where a cap does bind (a desktop window narrower than 640 px, which keeps its fine pointer and so its lean, or after ADAPT's first step), the lean is held at 30 fps and steps well over 0.5 device px.
- **Evidence** (`lean5.mjs`: the plan's `motionFps`, `refreshDivisor` and `stepDivisor` with the 0.5 s hysteresis, the lean springs at ω = 4, the drift at v₀ = 3, the pointer sweeping between 10% and 90% of the width):

  | Window, display | Hands off | Pointer 100 px/s | 300 | 600 | 1,200 |
  |---|---|---|---|---|---|
  | 1,440 px, 60 Hz, DPR 2 | 24.4 fps | 46.4 fps | 59.9 | 59.9 (steps up to 0.71 device px) | 59.9 (1.04) |
  | 1,440 px, 144 Hz, DPR 2 | 21.8 | 33.7 | 67.8 | 128.9 | 143.9 |
  | 1,440 px, 60 Hz, DPR 1 | 20.0 | 19.9 | 29.7 | 58.6 | 59.9 |
  | 600 px (narrow cap), 60 Hz, DPR 2 | 24.5 | 30.0 (0.77) | 30.0 (1.61) | 30.0 (2.17) | 30.0 (1.85) |

  So P7's check fails for almost any mouse motion at DPR 2. AC-10's step bound fails for the lean at 60 Hz from about 600 px/s of pointer motion, and in narrow fine-pointer windows from 100 px/s. AC-13 itself still holds, because the holds stay whole numbers of refreshes. 10.2 and B-6 have no row for a moving pointer (up to 3,600 frames a minute at 60 Hz, 8,640 at 144 Hz).
- **Fix** (state the pacing the design has, or change the design; the first is cheaper and keeps the 0.5 px rule):
  - P7: "while the pointer moves, drawn frames follow the camera's speed (every refresh at DPR 2 for pointer motion over about 100 CSS px/s on a 1,440 px window), in whole-number holds (AC-13), and return to the drift's divisor within 0.5 s of the lean settling".
  - 6.13: the lean's frames follow its speed through `motionFps`, like any camera motion. The drift's caps bind only on narrow screens, after ADAPT's first step and on software raster; `needsDraw` would draw every refresh even when the lean barely moves.
  - AC-10, F3 and E4: put the lean with the glide, among motions that may need more than the refresh rate, and say what the caps then allow (at DPR 2, about 2 device px a frame for a brisk sweep at 30 fps). Or gate the lean off on narrow screens, which matches D3's "desktop" and removes the capped case.
  - 10.2: add "Hero, pointer moving (P7): up to every refresh while the lean moves faster than the drift's step allows", and say B-2 and B-6 are measured hands off.
  - The alternative, a design choice for the user under D3: cap the lean's frames at the drift's own need while only the lean adds speed, accepting steps of 1 to 3 device px during sweeps.

## Minor

### PHY5-3. SP1's reversal bound and 6.1's "without a seam" hold only in the continuous limit; the sampled spring under the cap moves up to 8% faster

- **Where.** SP1 (PLAN.md:281); 6.1's cap paragraph (:527); the round-4 log (:3846).
- **Problem.**
  - 6.1 says the cap's velocity, ω × lag / 2, "is also the uncapped spring's state at the threshold, so the cap engages without a seam". SP1 and 6.1 bound a last-frame reversal at "`maxLag` × H × 0.112 / 2e (4.6 px at H = 900)".
  - Both use the continuous steady trail. Sampled once a frame, a spring trailing a steady scroll at V trails by 2V/ω − V/(2f) (round 4's own C4 fix), so V reaches ω × `maxLag` × H / (2 − ω/2f) before the cap binds. At its frames that spring moves at 0.991 V (30 Hz) to 1.000 V (144 Hz), up to 8.1% faster than the cap's ωL/2. A reversal from just under the cap therefore carries the star past by v/(ωe), more than L/2e. When the cap does engage it trims that 8% of velocity in one frame, too little to see, but a seam all the same.
- **Evidence** (`reversal5.mjs`: steady scrolls of 200 to 4,000 px/s, then the last sampled goal anywhere from 0.75 L back to 0.75 L ahead; closed form from the zero-order-hold steady state):
  - At H = 900, past rest at most 5.00, 4.81, 4.72 and 4.70 px at 30, 60, 120 and 144 Hz, against the plan's 4.64. The limits are 5.01, 4.83, 4.73 and 4.72 px (v/(ωL/2) = 1.0808, 1.0411, 1.0207 and 1.0173). The worst case is always a sub-cap scroll at 0.998 L of lag whose last goal lands on the spring itself.
  - The same at H = 700 and 1,440: 3.88 and 8.00 px at 30 Hz, against 3.61 and 7.42.
  - No other sequence beats the sub-cap steady state: hill-climbing up to eight free goal steps from a capped scroll reached 4.92 px at 30 Hz (`reversal5b.mjs`).
- **Fix.**
  - SP1 and 6.1: "a scroll that reverses just before it stops can carry the brightest star past, then back: at most `maxLag` × H × 0.112 / (e(2 − ω/2f)), 5.0 px at H = 900 at 30 Hz (4.8 at 60 Hz, 4.7 at 144 Hz, 4.6 in the continuous limit)".
  - 6.1: "close to the uncapped spring's state at the threshold (sampled once a frame, that spring moves up to 8% faster at 30 Hz and 4% at 60 Hz, which the cap trims in one frame)".

### PHY5-4. 6.11's "a satellite moves at most 32 px" holds only on a 1,440 px window

- **Where.** 6.11, Drawing (PLAN.md:2748), from round 4's CG4-6 fix.
- **Problem.** "one that arrives mid-ease waits up to `QUIET.ease` (0.6 s), in which a satellite moves at most 32 px". A satellite's speed is `SATELLITE.speed` °/s × π/180 × `view.focal`, and the focal length grows with the window's longer side.
- **Evidence.** 2.5°/s × 0.6 s × π/180 × (W/2)/tan 30° = 0.0227 × W px: 32.6 px at W = 1,440 (QUIET.ease 0.6 s, `config.ts:138`), 43.5 at 1,920 and 58.0 at 2,560.
- **Fix.** "at most about 33 px on a 1,440 px wide window (0.023 × its longer side: 58 px at 2,560)".

## Recomputed and confirmed

These need no change.

- **Drift.** The exact bound ΣR + |ΣR e^(iφ)| is 205.2365 px = 68.41 s × v₀ at q = 1 (H5's 68.4 × 3 + 0.1 = 205.3 holds), and 2ΣR = 212.30 px = 70.77 s × v₀ (`DRIFT_REACH`). From the dusk, the stars head down at 69.4 s, left at 121.0 s and up at 151.3 s, and are 24.3 px from the start at 180 s. The loop spans 177 × 162 px ("about 170"). Radii, speed range, turn rates and first-minute headings are as in round 4.
- **Pacing.** The drift is faster than 1.0417 v₀ for 50.2% of the time, and a DPR-2 laptop at 60 Hz averages 25.1 drawn fps with the hysteresis (6.2's "about half" and "about 25"). 6.2's table is unchanged, and so are 19.2 fps at v₀, 36.4 at v₀ = 4 and the 3.30 threshold.
- **Zero-order hold.** The sampled trail is 0.183337 V at 30 Hz, against 2/ω − 1/(2f) = 0.183333 (60, 120 and 144 Hz agree to 6 digits). The cap binds at 1,227, 1,174, 1,149 and 1,145 px/s at H = 900 (6.1's "above about 1,100 px/s"). One-way scrolls never overshoot, in H5's grid with both variants.
- **Glide steps.** 4.2 device px a frame at the start of a capped glide at DPR 2 on 60 Hz, over 0.5 for 0.37 s. P3's "over 30 fps for about 0.4 s" after a 1,000 px/s scroll is 0.43 s.
- **Contrast.** The budgets and tints are as in round 4. PF's 0.0593 × peak comes from `config.ts:317`, 0.585 × (2 × 0.05 + 0.52 × 0.05²), so a peak of 1 adds 0.059 against 0.064.
- **Geometry and bodies.** `meteorRange`: 100 km overhead, 171.7 km at 35° and 477.4 km at 10°. `SKY_WINDOW` on 1440 × 900 spans 17.6° to 59.8°. A start on the centre row dims to 0.62 against `METEOR.top`. Satellites move at 21.77 px/° (26.1 to 54.4 px/s, 125 to 261 px a pass), make a first attempt in 39.35% of visits and pass 89.3 s apart. H8's "99% within 4.5°" holds (99.73%): a path's great circle misses the true radiant by the scatter's component across it, a one-dimensional Gaussian with σ 1.5°.
- **Config arithmetic.** `METEOR.fallbackScale` 0.64 = 0.9 / 1.4. 10.2's extra frames, AC-2, AC-15 and AC-27 are as in round 4.

## Summary

- **Majors.** Two pass/fail criteria fail a correct implementation by design.
  - AC-39 and H5 promise 0.3 px at 0.7 s up to H = 1,440, and 2.0 × 10⁻⁴ × H taller. A one-step jump from rest starts its glide a frame late (C5's dt-0 step), leaving 0.31 to 0.39 px at H = 1,440 (H5's own 0.245 H jumps: 0.306 to 0.386), 2.7 × 10⁻⁴ × H at 30 Hz, and a settle at 1.27 s at 3,840. Fix: count from the first frame that shows the stop, or restate the bound.
  - The lean's speed sets the frame rate with no cap on wide desktops, so the sky draws every refresh at DPR 2 while the mouse moves faster than about 100 CSS px/s. P7's "keep the drift's divisor" check, 6.13's rationale and AC-10's list of motions within the refresh rate are all wrong. Fix: state the real pacing (or cap the lean by user decision), and add the pointer case to 10.2.
- **Minors.**
  - The reversal bound is up to 8% low below the cap (5.0 px at H = 900 at 30 Hz, not 4.6), and the cap's engagement has a small seam.
  - The satellite's "32 px" holds only at 1,440 px wide.
- **Confirmed.** The other round-4 fixes and the reconciliation's numbers (ink budgets, `scrollKept`, quiet reach, the crossing table) are confirmed, along with every other figure rechecked here.
