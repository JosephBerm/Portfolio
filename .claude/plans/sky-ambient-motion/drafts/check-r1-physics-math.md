# Check round 1: physics and math

Adversarial checker, lens "physics-math", round 1, 2026-10-27. Planning only: this file is the only repository file written.

- **Scope.** Recompute every formula, constant and derived number in `PLAN.md` (the depth law, the drift epicycles and their bound, the springs and the snap rule, the closed-form integrators, fps_need per DPR, the phase-sprite quantization, the rate model, per-visit limits, flash rate, duration caps, the WCAG contrast arithmetic) and check the physics (parallax, meteor and radiant geometry, satellites).
- **Inputs.** `PLAN.md`, `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, R1 to R4, and the worktree code at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `src/app/globals.css`).
- **Method.** Node 24 scripts that reimplement the plan's formulas and R2 §10's sketches exactly as written, in the session scratch folder `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r1-physics/` (not in the repository): `depth.mjs`, `drift.mjs`, `repeat.mjs`, `spring.mjs`, `pacing.mjs`, `rates.mjs`, `sprites.mjs`, `directions.mjs`, `directions2.mjs`, `converge.mjs`, `accepted.mjs`, `phone.mjs`, `overshoot.mjs`, `contrast.mjs`.

**Verdict: revise.** 2 blocking, 9 major and 9 minor findings. Most of the plan's arithmetic reproduces exactly (list at the end). The blocking problems are both in P9's meteor population model: a brightness rule that breaks the veil's contrast budget, and missing end guards for the new directions.

## Blocking

### PHY-1. P9's brightness rule brightens most shooting stars past the veil's contrast budget

- **Where.** 6.10, "The aim at a start point", step 8 (PLAN.md:2193), and `METEOR_BRIGHTNESS` (PLAN.md:2104-2109).
- **Problem.** The peak is `between(...) × max(rangeFloor, 1 / range²)` with `range = meteorRange(elevationAt(start)) / meteorRange(view.pitch)`. The plan keeps today's spawn area (`spawnY` [0, 0.5] of the height, clamped below `METEOR.top`: config.ts:262-268, meteors.ts:138), which lies at or above the window's centre. So `range ≤ 1` and the factor is at least 1 for almost every flight: the rule brightens, while its doc says meteors lower in the window "dim".
- **Evidence.**
  - The factor over the spawn rows is 0.95 to 1.54 at 1440 × 900, 0.95 to 1.51 at 1920 × 1080, and 0.99 to 1.88 on a 393 × 852 phone, where the 60° long side is vertical (`phone.mjs`).
  - Ordinary peaks reach 1.37 at 1440 × 900 (38% of flights exceed 0.9) and 1.59 on the phone (`directions2.mjs`, `phone.mjs`).
  - The veil budget assumes a peak of at most 0.9 (`METEOR.peak[1]`, config.ts:291; `METEOR_VEIL` doc, config.ts:316-318: "0.9 × 0.585 × (2 × 0.05 + 0.52 × 0.05²) ≈ 0.053 of white").
  - Ink on the copy then becomes 0.081 of `--color-white` at peak 1.37, above the 0.064 headroom under the haze that COORDINATION.md and PLAN.md §11 quote. At peak 1.59 it is 0.094, and slate `#8892b0` body text on navy drops to 4.32:1 in plain sky, against 4.93:1 at peak 0.9 (`contrast.mjs`, WCAG relative luminance, globals.css:7-18).
  - It also breaks `Flight.peak`'s "0 to 1" contract (PLAN.md:2213), and makes ordinary flights brighter than fireballs (peak 1).
- **Fix.**
  - Never brighten. Normalize to the nearest spawn row, for example `peak × clamp((rangeTop / range)², rangeFloor, 1)` with `rangeTop` the range at `METEOR.top`, or simply clamp the factor at 1.
  - Add to H10 (or H7): every flight that may take the lease has `peak ≤ METEOR.peak[1]`.
  - State in I2 that the ink budget relies on that bound.

### PHY-2. The new directions need end guards that today's planner doesn't have

- **Where.**
  - 6.10, "Everything else stays the veil session's: ... the layout guards: 110 px under the navbar, the 12 px edge margin, ends above 0.72 of the height" (PLAN.md:2245-2251).
  - The `RADIANTS` doc: "so no long streak climbs into the navbar" (PLAN.md:2048-2050).
- **Problem.** Those guards exist only for today's right-to-left, falling paths:
  - `METEOR.top` is only a clamp on the start (meteors.ts:138).
  - The end test is `end.x < METEOR.edgeMargin || end.y > height * METEOR.maxEndY` (meteors.ts:156), with no right edge and no top.

  With R2's directions about half the flights go right and about 8% climb.
- **Evidence.** `directions.mjs` uses R2 §10's functions as written, today's guards and a 1440 × 900 window.
  - 16.3% of accepted flights end beyond the right edge, 8.5% end above y = 110 (the navbar band) and 3.5% above y = 0.
  - 17% of accepted flights leave the screen with the head above 15% of its peak (median 0.74 at the exit). That fails AC-22 ("never enters or leaves an edge bright", PLAN.md:3044) and E6.
  - `climbShare` 0.6 still allows 311 px climbs that start at y = 110.
- **Fix.**
  - In I2, which is ours after V and doesn't touch `veiledFrom`, add `end.x > width - METEOR.edgeMargin || end.y < METEOR.top` to the end test, or clip the whole segment against the inset viewport.
  - Say so in 6.10 instead of "stays the veil session's".
  - Add to H8: every accepted path lies inside the inset viewport.

## Major

### PHY-3. The snap rule fires over and over during any fast continuous scroll

- **Where.** 6.1, `stepCamera` (PLAN.md:672-679); the `CAMERA` doc (PLAN.md:497-499); E11; H5.
- **Problem.** The snap compares the goal with the spring's current value. While scrolling at speed V the spring trails by 2V/ω page px (PLAN.md:504), so above ω·H/2 the trail alone exceeds one viewport. The rule then snaps and zeroes the velocity. The trail rebuilds from rest and crosses H again, so the stars jump every 0.1 to 0.3 s for as long as the scroll lasts. R1 meant a jump within one message: "can move scrollY by thousands of px in one message ... Snap when |Δ| exceeds one viewport height" (R1 §5.1).
- **Evidence** (`spring.mjs`, 60 Hz steps).
  - The critical speed is 4,500 px/s at H = 900 and 3,500 px/s at H = 700.
  - At 5,000 px/s and H = 900 there are 6 snaps in 2 s, each about 909 page px: 102 CSS px for the brightest star, against 9.3 px of normal motion per frame.
  - At 8,000 px/s there are 15 snaps. At H = 700 and 5,000 px/s there are 11 snaps of 80 px.
  - Touch flicks and trackpad flings often exceed 4,000 px/s. H5 tests only a single gap.
- **Fix.**
  - Snap on the step's change of goal instead: keep the previous goal on `Camera` and snap when `Math.abs(goal - camera.lastGoal) > CAMERA.snapViewports * H`. That separates Home, End and find in page (one step) from a fling (many small steps).
  - Or clamp the lag continuously, keeping the velocity.
  - Add an H5 case: sustained ramps at 3,000 to 10,000 px/s give no per-frame star jump beyond the normal motion plus 0.25 px.

### PHY-4. H1's 0.01% flux criterion (A1, AC-11) can't pass

- **Where.** 6.3 (PLAN.md:1158); A1 (PLAN.md:298); H1 (PLAN.md:2486); AC-11 (PLAN.md:3033); P1 step 1 ("The atlas, with H1 green").
- **Problem.** The phases sit 0, 0.25, 0.5 and 0.75 px right of the middle pixel (`placePoint` floors, then carries a phase of 4). The sprite sides stay `2·ceil(3σ) + 1` (skyAssets.ts:57-60, 81-87), so at 0.75 px one tail is cut at 2.25σ. On top of that, every alpha byte rounds to 1/255.
- **Evidence** (`sprites.mjs`, the plan's `profile` and its phase-0 normalization).
  - The float flux varies by up to −0.50% across phases (DPR 2, shape 2, σ 1.0, size 7, phase (3/4, 3/4)).
  - The 8-bit alpha sums vary by up to 1.12% (DPR 1, shape 5, phase (1/2, 1/2): 2612 against 2583).
  - None of the 24 (DPR, shape) pairs keeps all 16 phases within 0.01%.
  - Growing every sprite by 2 px brings the float flux to within 0.016%, still above 0.01%, and pushes the DPR-2 atlas past B-10's 2 MB.
  - The ripple is invisible (R4 asked for 5% or less), so only the criterion is wrong.
- **Fix.**
  - In H1, compare the unrounded (float) phase sums within 0.6% and the byte sums within 1.5%.
  - Restate A1 as "the same total light within 0.5%, unrounded".
  - Keep the phase-0 byte identity, which holds.

### PHY-5. About 6% of visits draw a shower radiant whose every path climbs, which D8's default rejects

- **Where.**
  - 6.10, aim step 2 (PLAN.md:2187), and D8 (PLAN.md:173).
  - Invariant R1 (PLAN.md:306).
  - The meteor planner's doc (PLAN.md:1817-1822) and `pickVisitSky` (PLAN.md:2164-2165).
- **Problem.** `pickVisitSky` draws the shower radiant from the whole sky. When the radiant sits low in front of the window, every path over the spawn area climbs. D8's default rejects shower climbs, so every launch that picks the shower (40% of them) fails. The plan says neither whether a failed plan re-picks the visit's sky (the planner keeps "today's retry of fresh radiants", but R1 keeps the sources fixed except after "repeated planning failures") nor that `pickVisitSky` avoids such radiants.
- **Evidence.**
  - In 6.0% of visits, every one of 160 spawn-area starts climbs more than 15°. In 8.1%, at least 90% do (`directions.mjs`).
  - If the sky is kept, `TRANSIENTS.retry` (5 to 9 s) and `maxFailedPlans` 3 stop meteors for the rest of the visit within 2 minutes in 37% to 50% of those visits (`overshoot.mjs`). The other visits get 4.9 to 5.7 launches in 2 minutes instead of about 9.5.
  - Even in a sky with no copy, 4.7% to 7.4% of launches find no path in 160 tries (`accepted.mjs`).
- **Fix.**
  - In `pickVisitSky`, resample the shower radiant until most of the spawn area gives non-climbing paths. For example, probe 16 spawn points and require at least 50% with `dirY ≥ -sin 15°`.
  - State in 6.9 exactly what a failed plan resets.
  - Add an H8 check that no visit's shower is unusable.

### PHY-6. The radiant would be on screen in about 26% of visits, not 15%

- **Where.**
  - The `RADIANTS` doc and `onScreen: 0.15` (PLAN.md:2050-2060).
  - `VisitSky.showerOnScreen` (PLAN.md:2159-2160).
  - H8 (PLAN.md:2493): "the radiant on screen in 15 ± 1% of visits".
- **Problem.** R2's model already puts the radiant's vanishing point on screen naturally (13% at a 40° window, R2 §4.3). The plan forces it on screen in 15% of visits, but doesn't exclude on-screen radiants from the other 85%.
- **Evidence.**
  - 13.1% of sampled radiants have r_z > 0 and a vanishing point inside 1440 × 900 (`directions.mjs`).
  - The total is about 15% + 0.85 × 13.1%, or 26%.
  - For those natural ones `showerOnScreen` is null. The 40 px minimum and the point flash (D4) then never apply, and their near-radiant meteors fail the 160 px minimum.
- **Fix.** In the off-screen branch, reject radiants whose vanishing point (r_z > 0) falls inside the viewport plus a margin. Alternatively, classify them as on-screen when they sit in clear sky, and count them in the 15%.

### PHY-7. H8's and AC-21's backward-convergence test fails for about 40% of correct visits

- **Where.** H8 (PLAN.md:2493) and AC-21 (PLAN.md:3043): "shower paths extended backward meet within 10% of the diagonal".
- **Problem.** The test holds only for a radiant in front of the viewer with a nearby vanishing point.
  - For r_z ≤ 0 the radiant is behind the viewer, and on screen the shower converges forward, toward the antiradiant (R2 §4.2).
  - For small r_z the vanishing point lies far off screen, and the 1.5° scatter moves each backward line more than 170 px.
- **Evidence** (`converge.mjs`: 10 scattered shower paths per visit, and the perpendicular distance from the mean vanishing point to each backward line).
  - 17.4% of visits have the radiant behind the viewer, so they fail by construction.
  - 23.1% fail on distance.
  - Only 59.5% of visits pass, even though the implementation is correct.
- **Fix.** Test convergence on the sky: every shower meteor's great circle passes within 3σ = 4.5° of the visit's shower radiant. Alternatively, apply the screen test only when r_z > 0 and the vanishing point lies within 2 diagonals, and use forward convergence when r_z < 0.

### PHY-8. The kept spawn area tilts the mix to the right; H8's 50 ± 3% and 13.5 ± 3% fail

- **Where.**
  - 6.10: "about 75% of meteors fall, 13.5% slant sideways and 11% climb, evenly left and right" (PLAN.md:2025).
  - The `RADIANTS` doc (PLAN.md:2047-2048) and "`spawnX` and `spawnY` stay" (PLAN.md:2119).
  - H8 (PLAN.md:2493).
- **Problem.**
  - R2's even split came from starts across the whole width: "uniform over the upper 60% of a 1440 × 900 window" (R2 §4.3).
  - The plan keeps today's spawn area, x ∈ [0.45, 0.985] of the width (config.ts:263), right of the centre.
  - In the gnomonic flow field, paths run away from the vanishing point, so more of them head right.
- **Evidence.**
  - Raw (radiant, start) samples: 42.6% go left (`directions.mjs`).
  - Planned launches under D8's default: 57.9% go right, 17.6% sideways and 8.4% climb with today's guards (`accepted.mjs`).
  - With PHY-2's guards: 57.4% right, 17.2% sideways and 6.9% climbing.
  - So H8's "left and right 50 ± 3%" and "sideways 13.5 ± 3%" fail on either sample. "Climbing 7 ± 2%" passes.
- **Fix.**
  - Either mirror the spawn area for half the launches (x → width − x) or use a symmetric area, then re-measure.
  - Or restate the targets: about 57/43 and about 17% sideways.
  - Either way, say whether H8 samples raw candidates or planned launches.

### PHY-9. A satellite that fades in and then fades out mid-sky in one pass is physically impossible

- **Where.** 6.11: the `SATELLITE` doc and planning step 3 (PLAN.md:2268-2297, 2341).
- **Problem.**
  - A shadow-ending pass starts "in the clear band: below `METEOR.top`" and "fades in, or slides in from beyond an edge when its backward ray meets a side or the top within 0.8 s of travel".
  - At 26 to 54 px/s, 0.8 s is 21 to 43 px. A start at y ≥ 110 never reaches the top, and only starts within about 43 px of a side reach a side.
  - So nearly every shadow-ending pass fades in mid-sky (leaving Earth's shadow), then fades out mid-sky (entering it) within 4.8 s.
  - Seen from the ground, Earth's shadow is one region around the antisolar point. A satellite's nearly straight path can't leave that region and then re-enter it, let alone within seconds (R2 §6.1, [S29]; NASA: steady, "doesn't ... change direction" [S28]).
- **Evidence.**
  - shadowShare 0.6 × about 98% (only about 2% of interior starts lie within 43 px of a side, heading away from it) is about 59% of all passes.
  - The doc's "2 to 3 times faster" is also low: at the window's 40° centre the ISS moves about 0.5°/s (R2 §6.1 table). So 1.2 to 2.5°/s is 2.4 to 5 times realistic, and up to 12 times at the window's 20° bottom.
- **Fix.**
  - Give each pass at most one mid-sky fade. With shadowShare, a dusk pass slides in lit from beyond a side and fades into the shadow in the clear band. Otherwise, a dawn pass fades in mid-sky and leaves through a side.
  - Check the visible part of the path for clear sky.
  - Reword the speed claim to "2 to 5 times".

### PHY-10. AC-15's near-median limit fails by design about a quarter of the time

- **Where.** AC-15 (PLAN.md:3037): "near median ≤ 1.2 px/s".
- **Problem.**
  - The near band's median nearness is 0.9405 (`depth.mjs`).
  - At reading drift 0.35, the near median speed is 0.99 px/s at the mean drift speed and 1.40 px/s at the 1.42 v₀ peak.
  - It exceeds 1.2 px/s whenever the drift speed is above 1.215 v₀.
- **Evidence.** That is true 24.2% of the time over 6 hours of drift clock (`drift.mjs`).
- **Fix.** Either "near median ≤ 1.4 px/s", or "≤ 1.0 px/s averaged over 60 s".

### PHY-11. C3's "scroll term bounded by the page" is false once `resumeCamera` adds a shift

- **Where.**
  - C3 (PLAN.md:270), C8, and `resumeCamera` (PLAN.md:700-705).
  - Deviation 10 (PLAN.md:61).
  - 6.5, "Every term of C is bounded" (PLAN.md:1292-1297).
  - R-14 (PLAN.md:3159).
- **Problem.**
  - `resumeCamera` sets `shift = scrollY − camera.scroll.value`, and the goal is `scroll − shift`.
  - After pause, scrolling while paused, then Play, the camera's scroll coordinate leaves [0, scroll range].
  - Each such cycle can add up to one scroll range, without limit.
- **Evidence.** Take a 20,000 px page (19,100 px of scroll):
  1. Pause at the top, scroll to the bottom, press Play, then scroll back to the top. The goal is now −19,100.
  2. Star offsets become 0.07 × q × 19,100: 1,337 px at q = 1, and 2,139 px for the brightest star.
  3. The hero then shows an unreviewed patch of sky, 4 to 6 times R-14's 328 px wander.
  4. Each further cycle adds up to 2,139 px. The SF2 key guard is reached only after about 3,900 cycles, so it stays safe, but "bounded by the page" is false.
- **Fix.**
  - Correct C3 and 6.5: the scroll part is bounded only between resumes.
  - Make C8's trade-off a stated decision: keep the permanent offset, or let the shift relax to 0 as the visitor scrolls (for example, shrink `|shift|` by a share of each step's `|Δscroll|`), so the reviewed hero composition comes back.

## Minor

### PHY-12. The design ratios quoted for medians are ratios of means

- **Where.** E1 (PLAN.md:146) and AC-1 (PLAN.md:3023).
- **Problem.** "Design 1.71 and 2.04" are ratios of band means: 0.5007/0.2935 = 1.706 and 1.0239/0.5007 = 2.045. The check measures medians, which give 0.4758/0.2845 = 1.672 and 0.9405/0.4758 = 1.977.
- **Effect.** Both still pass 1.6.
- **Fix.** Quote 1.67 and 1.98.

### PHY-13. Three pacing statements disagree with the pacing math

1. **6.2 (PLAN.md:1110), "steps up to 30 only around the speed peaks".**
   - A DPR-2 laptop needs 30 fps whenever the drift speed exceeds 1.042 v₀, which is 50.2% of the time (`drift.mjs`).
   - So it averages about 25 fps, about 1,500 frames a minute. That is still inside B-2 and 10.2.
2. **P3's visible change (PLAN.md:2635), "The scroll glide now draws ... at 20 to 30 fps instead of every refresh".**
   - After a 1,000 px/s scroll stops, the glide needs at least 41 fps for 0.4 s. The 0.5 s hysteresis then holds k = 1.
   - So the glide draws on every refresh until it settles (`pacing.mjs`).
3. **B-2 (PLAN.md:3105), "never every refresh from the drift alone at v₀ ≤ 3.3".** This contradicts deviation 5 and 10.1: macOS Safari draws the drift on every 15 ms tick, at 66.7 fps.
- **Fix.** Reword all three, and exclude WebKit's unaligned clock from B-2.

### PHY-14. SP1 and AC-39 overstate the spring

- **Where.** SP1 (PLAN.md:276) and AC-39 (PLAN.md:3061).
- **Problem 1: "rest within 0.7 s".**
  - `settle()` fires 0.88 to 1.08 s after a 500 to 3,000 px/s scroll stops (`restPx` 0.01, `spring.mjs`).
  - At 0.7 s the brightest star is only 0.04 to 0.26 CSS px from rest.
- **Problem 2: "never passes a fixed target" and "no reversal over 0.1 px".**
  - A critically damped spring does overshoot when its velocity toward the target exceeds ω times its distance.
  - A scroll that reverses just before stopping causes exactly that. Scroll down at 1,500 to 2,000 px/s, back for 0.1 to 0.15 s, then stop: the spring passes the final target by 40 to 47 page px (4.4 to 5.2 CSS px for the brightest star), then comes back (`overshoot.mjs`).
  - H5 tests overshoot only from rest.
- **Fix.**
  - AC-39: "within 0.2 CSS px of rest 0.7 s after a monotone scroll stops".
  - SP1: "from rest or after a monotone approach".
  - Qualify "never overshooting" in the `CAMERA` doc.

### PHY-15. AC-5 is measured through the dusk ease

- **Where.** AC-5 (PLAN.md:3027), checked by the 60-second watch from the reveal (9.1).
- **Problem.**
  - The reveal (3.75 s after load) falls inside the 3 s dusk ease, which runs from 3.0 to 6.0 s.
  - During the ease the drift speed changes by up to 50% of its full value per second (the smoothstep's slope, 1.5/3). That is 100% to 240% of the current speed, against AC-5's 10%.
- **Fix.** Start AC-5's window at 6 s after load, and leave the eases to AC-9.

### PHY-16. AC-16's per-frame limit, applied to re-measured rects

- **Where.** 8.6 item 4 (PLAN.md:2970).
- **Problem.** The veil's 0.6 s smoothstep ease (`QUIET.ease`, config.ts:138) changes a fully covered near star's alpha by up to 0.78 × 1.5 / 0.6, or 1.95 a second.
  - That is 0.065 a frame at the 30 fps fade cadence, and 0.098 at 20 fps.
  - Only the spatial crossing meets 0.05: at most 0.01 a frame at 6.82 px/s and 20 fps.
- **Fix.** State the limit for the ease per second (at most 2 alpha a second).

### PHY-17. The brightest star moves 1.02 px after a pause, not 1.0

- **Where.** AC-27 (PLAN.md:3049) against 6.6 (PLAN.md:1456).
- **Problem.** 6.816 × 0.15 = 1.022 px, so the brightest star at the drift's peak fails a strict 1 px check.
- **Fix.** Set `FRAME.motionEase` to 0.29 s (0.99 px), or use a 1.1 px threshold.

### PHY-18. AC-10's r² test fails from quarter-pixel quantization alone

- **Where.** AC-10's "linear fit r² ≥ 0.999 over 2 s" (PLAN.md:3032).
- **Problem.**
  - Quarter-pixel phases quantize a star's position with a variance of (1/4)²/12 = 0.0052 device px².
  - So r² ≥ 0.999 needs about 7.9 device px of travel in 2 s, or 3.95 device px/s.
- **Effect.** The near-band mean moves 1.78 CSS px/s in the drift's slow phase. From quantization alone, before any capture noise, r² is about 0.995 at DPR 1 and 0.9988 at DPR 2.
- **Fix.** Apply the r² test only to stars moving at least 4 device px/s, or use "no residual from the linear fit over 0.2 device px".

### PHY-19. Numeric slips

- **2.2, reading (PLAN.md:102).** "Fades over the 40 px feather ... half a minute at 1 px/s": it takes 40 s, and 72 s to reach the ink.
- **6.3 (PLAN.md:1198).** "6 Hz for a far star at DPR 2" is R3's figure for 3 px/s. With this plan's far speeds (0.42 to 1.24 px/s) it is 0.8 to 2.5 Hz.
- **6.1 (PLAN.md:559) and D6.** "Rotating all three phases ... without changing any statistic above": the first-minute heading rows do change. Only the speed, turn and bound rows are unaffected by the rotation.
- **10.2 against B-9 (PLAN.md:3112).** "6 to 7 s a minute" and "about 7 to 8 s for meteors" disagree. The model gives 6.4 s: 4.74 launches a minute × (0.96 s of flight + 0.39 s of wake).
- **H10 (PLAN.md:2495).** "Normal flight with train 3.8 s" holds for P8 only. From P9 only fast-class flights carry trains: 0.8 + 2.4 = 3.2 s.
- **AC-38 (PLAN.md:3060) and deviation 11 (PLAN.md:62).**
  - 0.50 crossings a minute is today's steady state. Over a visit's first two minutes today gives 0.57.
  - The new rate, with p = 0.16 to 0.19 and a 40 s cooldown, gives 0.56 to 0.64 over that same window (`rates.mjs`). Compare like windows.
- **AC-7 (PLAN.md:3029).** The design's 6.3 px holds when stretches are compared up to a translation (6.38 px at a 546 s lag). Comparing absolute positions gives 9.76 px. Say which one is meant; both pass 5 px.

### PHY-20. `gaussian(random)` must not take log(0)

- **Where.** 6.10 (PLAN.md:2182): `gaussian(random)`, Box-Muller.
- **Problem.** `Random` returns values in [0, 1) (random.ts:3-13, and `Math.random`). A textbook `Math.sqrt(-2 * Math.log(random()))` can take log(0) = −Infinity, which gives a NaN radiant.
- **Fix.** Specify `Math.log(1 - random())`.

## Recomputed and confirmed

These need no change.

- **Depth law.**
  - The cap applies from m = 0.112.
  - Band nearness ranges 0.2398 / 0.3889 / 0.7410 / 1.6; shares 71.49 / 23.45 / 5.06%.
  - q means 0.2935 / 0.5007 / 1.0239 and medians 0.2845 / 0.4758 / 0.9405.
  - Scroll shares 0.0205 / 0.0350 / 0.0717, within 12.4% of the reviewed values.
  - The least-squares k is 0.1401. Lean ±19.2 / 12.3 / 6.0 / 3.5 px.
- **Epicycles.**
  - ω = 0.03491 / −0.05648 / 0.08426 rad/s; R = 85.94 / 15.94 / 4.27 px.
  - Speed 0.580 to 1.420 v₀. Turn rate: mean 2.00°/s, max 4.33°/s. Speed change at most 3.78% of the current speed per second.
  - Wander supremum 205.24 px (68.41 s × v₀); 2ΣR = 212.30; the 6-hour maximum is 205.17.
  - R1's phases: 190.89 px, a 61.3° initial heading, and 16.2 s within 30° of level.
  - First minute after the dusk:

    | Time after the dusk | 5 s | 10 s | 15 s | 20 s | 30 s | 45 s | 60 s |
    |---|---|---|---|---|---|---|---|
    | Heading | 18.9° | 9.1° | 2.7° | −1.6° | −6.7° | −16.1° | −51.9° |
    | Speed (v₀) | 0.924 | 1.031 | 1.119 | 1.176 | 1.183 | 0.965 | 0.682 |

    53.2 s within 30° of level (52.7 s excluding the first 0.5 s), rightward for all 60 s.
  - Later headings: −92° at 70 s, −177° at 120 s and +91° at 150 s. 24.3 px from the start at 180 s.
  - Exact repeat after 25 h (809/500 and 1207/500). Frequencies 0.0056 / 0.0090 / 0.0134 Hz. The speed beats (68.8, 127.3 and 44.6 s) are all below 0.05 Hz.
  - All 30 cells of the speed table check out. Precision after 30 days: 2.65 × 10⁻⁹ px.
- **Springs.**
  - Scroll spring: 95% at 0.474 s, 99% at 0.664 s, Motion visualDuration 0.524 s. Lean spring: 1.186 s and 1.309 s.
  - Two half steps equal one step exactly.
  - Ramp trail 2V/ω, about 14 px at q = 1 and 22 px at q = 1.6 at 1,000 px/s. No overshoot after a monotone ramp.
  - An unsnapped 5,000 px jump would sweep at 1,288 px/s. C5's 11.2 px holds. The motion-level ease covers 0.15 s × v.
- **Pacing.** Every cell of 6.2's table holds: the needs 20, 20.45, 27.26, 21.81, 20 and 20 fps, the divisors and the steps. 19.2 fps at the typical speed; the v₀ threshold is 3.301; v₀ = 4 needs 36.35 fps; the software budget gives 24, 20 and 2 fps.
- **Sprites.** Phase-0 separability holds. The position error is at most 1/8 px, and S4's half pixel holds.
- **Rates.**
  - Mean gaps 11.690, 21.004, 84.460 and 41.718 s.
  - 22.1% of gaps fall within 2 s of the floor; 3.9% hit the cap.
  - First minute: median 5, and 3 to 6 in 90.2% of visits. Today: 1.85 on average, exactly 2 in 85%.
  - 4.74 launches a minute. A fireball in the first minute 12.0% of the time; a first satellite attempt within 60 s 39.35% of the time; satellites take 3.23 s a minute.
- **Geometry.**
  - Focal length 1,247 px, 21.77 px/° at the centre; the window spans 20.2 to 59.8°.
  - meteorRange: 100 / 110 / 130 / 172 / 277 / 477 km.
  - The image direction (u·r_z − r_x, v·r_z − r_y) and the speed factor, re-derived from the pinhole projection.
  - Raw mix 74.3 / 13.7 / 12.1%; D8's alternative rejects 13.7%.
  - Satellites: 26.1 to 54.4 px/s, 125 to 261 px a pass. Alpha 0.25 to 0.5 corresponds to magnitude 5.42 to 3.61.
- **WCAG.**
  - Green on navy 14.13:1, on light navy 12.71:1; a 10% mint fill 1.28:1; slate on navy 5.69:1.
  - Headroom 0.0822 of `--color-white`. meteorLight(0.75) is 0.585, so a meteor puts 0.0533 of white on the copy.
  - Red shares 0.423 / 0.399 / 0.372. Far-star twinkle peak 1.538.
- **Physics.** These are consistent with R1, R2 and their sources:
  - translation-only parallax (pinhole f·T/Z);
  - the inverse-square depth law, compressed to 0.7;
  - the gnomonic radiant geometry;
  - ω = V·sin D / q with the range factor;
  - elevation density sin h·cos h, sampled as asin(√U).
