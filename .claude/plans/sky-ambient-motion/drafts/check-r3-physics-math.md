# Check round 3: physics and math

Adversarial checker, lens "physics-math", round 3, 2026-10-27. Planning only: this file is the only repository file written.

- **Scope.** Confirm that each round-2 physics-math fix landed in `PLAN.md` (and the other lenses' fixes that carry math: the cooldown table, the law-times-speed checks, the snap rule, the timer fallback), recompute every formula and derived number again, check the physics, and look for regressions the revision introduced. No round-2 finding was rejected, so none is re-raised.
- **Inputs.** `PLAN.md` (3,572 lines), `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, R1 to R4, the round-2 reports, the reviser's scripts (`reviser-r2/`), and the worktree code at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `Background.module.css`, `globals.css`).
- **Method.** Node 24 scripts in the session scratch folder `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r3-physics/` (not in the repository):
  - `lag3.mjs` to `lag3f.mjs`: the plan's `stepCamera` scroll part exactly as written (`springStep`, the one-step snap, the lag cap with the velocity kept, `settle`), against a variant;
  - `ac10.mjs` to `ac10d.mjs`, `ac7.mjs`, `drift3.mjs`, `heading3.mjs`: the drift path, pacing and quarter-pixel placement;
  - `pop3.mjs` (the reviser's `population5.mjs` over 11 screen sizes), `cool3.mjs`, `fireball3.mjs`, `flux3.mjs`, `bands.mjs`, `contrast3.mjs`, `headroom.mjs`.

**Verdict: revise.** 2 major and 3 minor findings. Every round-2 fix landed, and nearly all the arithmetic reproduces (list at the end). The majors: the lag cap keeps a velocity that depends on the frame rate, so H5 and AC-39 fail on H5's own grid; and AC-10's line fit (my own round-1 suggestion) fails a correct implementation and can't see the stall it exists for.

## Round-2 fixes: did they land?

| Round 2 | Landed | Notes |
|---|---|---|
| PHY-1 on-screen yield | yes | Re-run: 0.0% failed launches at 1440 × 900 (on screen and off), 1.1% at 393 × 852, 2.1% at 360 × 780; shower share 40.8% on and off screen at 1440 × 900; no visit stops early at any of 11 desktop and tablet sizes. |
| PHY-2 law × speed | yes | The on-screen order far < mid < near is guaranteed: the bands' q ranges don't overlap. |
| PHY-3 glide | yes | The cap works for eased jumps (17.2 to 22.8 px at H = 900), but its velocity rule causes PHY3-1. |
| PHY-4 brightness | yes | Mean peak 0.506, 12.1% under 0.3. |
| PHY-5 AC-39 | yes | Except very tall viewports: PHY3-4. |
| PHY-6 snap hop | yes | Through `skyMoved`: phases kept through a pause. |
| PHY-7 / C20 / CA2-3 cooldown | yes | Table reproduced (below). |
| PHY-8 sporadic stubs | yes | |
| PHY-9 earthgrazer | yes | 0.3 of the width (17 to 20° by position) is reached by 2 to 18% of independent speed and duration draws; feasible for a could kind with many attempts. |
| PHY-10 slips | yes, all seven | H1's 2.5% holds from DPR 0.25 to 2 (0.55% at 0.25, worst 2.452% at 0.825). |
| CG2-2 timer fallback | yes | Armed k periods after the last frame: one wake per drawn frame. |
| CG2-3 / C21 | yes | |

## Major

### PHY3-1. The lag cap keeps a frame-rate-dependent velocity: H5 and AC-39 fail on H5's own grid, and C4's 0.3 px claim is wrong

- **Where.** `stepCamera` (PLAN.md:690-696); 6.1's glide paragraphs (:510, :512) and Integrators (:437); C4 (:272); SP1 (:277); the `CAMERA` doc (:499-506); H5 (:2681); AC-39 (:3331); R-16 (:3431); deviation 13 (:64).
- **Problem.**
  - When the cap binds, the spring keeps whatever velocity `springStep` left. In the discrete steady state that is ω²(L + VΔt)Δt / (e^(ωΔt) − 1 + ωΔt), which depends on the step Δt and the scroll speed V. In continuous time it would be ωL/2 (1,125 px/s at H = 900, L = 225).
  - A critically damped spring released at lag L crosses rest if its velocity exceeds ωL (2,250 px/s here). At 30 Hz the kept velocity passes that once a one-way scroll runs above about 8,000 px/s, so the glide after an abrupt stop overshoots. Think of a dog on a leash that is shortened by yanking: it arrives still running.
  - **H5 fails on its own grid.** H5 tests "sustained flings of 3,000 to 10,000 px/s at H = 700 and 900" at "30 to 144 Hz" and requires "never overshoots". At H = 700, 30 Hz and 10,000 px/s the brightest star overshoots 0.112 px, which also fails AC-39's "no reversal over 0.1 px".
  - **R-16's tightening makes it worse.** With `maxLag` 0.15 the same flings overshoot 0.12 to 1.30 px at 30 Hz (H = 700 and 900); with `scrollOmega` 12, 0.080 px.
  - **Scrollbar drags**, which stop abruptly, overshoot 0.78, 2.19 and 4.44 px at 16,000, 20,000 and 25,000 px/s at 30 Hz (H = 900). 30 Hz is a case the plan names: Energy Saver's 30 Hz (PLAN.md:1037-1038).
  - **C4 is wrong as stated.** "30 and 60 Hz differ by at most about 0.3 px" came from one sustained 5,000 px/s fling compared while clamped (`reviser-r2/lagcap.mjs`). After the stop the glides differ by 0.9 to 1.3 px (eased jumps, a 5,000 px/s fling) and 4.6 to 7.3 px (16,000 to 25,000 px/s drags). Mid-scroll they differ by the full 25.2 px wherever a step exceeds a viewport at 30 Hz but not at 60 (an eased 8,000 px jump in 0.8 s snaps twice at 30 Hz, never at 60), and a 30,000 px/s drag ends with no glide at 30 Hz (every step snaps) but a 25 px glide at 60 Hz. 6.1's "15, 60 and 144 Hz follow the same path" (:437) holds for the spring alone.
- **Evidence.** `lag3b.mjs`: kept velocity at 5,000 px/s is 1,791, 1,477 and 1,276 px/s at 30, 60 and 144 Hz (continuous 1,125); at 20,000 px/s, 4,077 at 30 Hz. `lag3d.mjs`: the H5 grid (H ∈ {700, 852, 900, 1440}, 30 to 144 Hz, 3,000 to 10,000 px/s), one failing cell. `lag3f.mjs`: R-16's options. `lag3.mjs`, `lag3b.mjs`: the frame-rate differences.
- **Fix.**
  - When the cap binds, also set the velocity to the steady trail of a critically damped spring at that lag (from x″ = −2ωx′ − ω²(x − g) with x − g held constant):

    ```ts
    if (Math.abs(lag) > maxLag) {
    	camera.scroll.value = goal - Math.sign(lag) * maxLag
    	// The steady trail at that lag, so the glide after it is the same at any frame rate and never passes the goal
    	camera.scroll.velocity = (Math.sign(lag) * CAMERA.scrollOmega * maxLag) / 2
    }
    ```

  - The glide after any capped scroll is then exactly −L(1 + ωt/2)e^(−ωt). Re-run (`lag3c.mjs`, `lag3d.mjs`, `lag3e.mjs`, `lag3f.mjs`): glides at 30, 60 and 144 Hz agree within 0.09 px; no overshoot anywhere in H5's grid, for drags up to 25,000 px/s, or with `maxLag` 0.15 or `scrollOmega` 12; the glide stays at most `maxLag` × H × 0.112, is 0.103 px from rest at 0.7 s and settles by 1.0 s at H = 900; after a reversal just before the stop, the overshoot past rest falls from 4.4 to 2.3 px (30, 60 and 144 Hz).
  - Restate SP1, C4, the `CAMERA` doc and 6.1 to match: the spring is exact; with the steady-trail velocity, the capped glide is the same at any rate; the one-step snap compares steps, so at 30 Hz a scroll faster than about 27,000 px/s (H = 900) snaps every step, which can't be seen at that speed.
  - Add to H5: sustained flings at 30 Hz up to 25,000 px/s, and the `maxLag` 0.15 setting R-16 offers, never overshooting.

### PHY3-2. AC-10 fails a correct implementation, and its line fit can't see a stall

- **Where.** AC-10 (PLAN.md:3302); E4 (:150); the P3 and P6 checklists. The line fit was round 1's PHY-18 fix, which I proposed without counting the path's curvature or the 2D rounding.
- **Problem.** AC-10 measures "drawn" positions (methods S and L).
  - **The line fit fails by design.** With quarter-pixel phases, a correct drift's largest residual from a 2 s fit of position against time is 0.39 device px for the brightest star at DPR 2, 0.34 for the near median and 0.30 for the far median, against 0.2. "Quarter-pixel phases alone give at most 0.125" is per axis: in 2D it is up to 0.177, and the fitted line itself moves with the rounding. The drift's curvature alone, with no phases at all, gives 0.195 device px over 2 s for the brightest star at DPR 2 (the heading turns up to 4.33°/s).
  - **It can't see a stall.** A 2 s window with one held frame can show a residual as small as 0.10 to 0.16 device px, well inside the 0.30 to 0.39 that correct frames reach, so the fit can't tell them apart. A spatial fit (position against position) can't see it at all, because a held frame stays on the path.
  - **The step clause fails on drawn positions too.** The true step reaches 0.500 device px (6.2's divisor makes it exactly 0.5 at its edge), but drawn steps reach 0.707 device px on diagonal headings (0.50 per axis), and 0.559 at DPR 1 where the true step is 0.341.
- **Evidence.** `ac10c.mjs` (position against time, 0.5, 1 and 2 s windows, 3 h of drift, with and without phases, with a held frame); `ac10b.mjs` (spatial fit); `ac10d.mjs` (steps at DPR 2 on 60 and 144 Hz, DPR 1.5 on 144 Hz, DPR 1 on 60 Hz, with 6.2's divisor).
- **Fix.**
  - Measure the step on true positions from the debug log (camera offset × q × dpr): at most 0.5 device px per drawn frame. On drawn positions, at most 0.5 device px per axis, each within 1/8 px of its true position (the phase rule).
  - Drop the line fit. A held frame doubles the next true step (about 0.9 device px for the brightest star at DPR 2), which the step bound and AC-13's intervals already catch.
  - If a fit stays, fit position against time over 1 s on true positions, with a 0.1 device px limit (design 0.048).

## Minor

### PHY3-3. AC-7's "compared up to a translation" fails by design under its usual meaning

- **Where.** AC-7 (PLAN.md:3299); 6.1 "No rhythm to notice" (:864).
- **Problem.** "Up to a translation" usually means after the best translation. Under it, the closest 60 s match within 30 minutes is 3.97 px at q = 1 (stretches starting at 3.97 and 28.02 minutes, a 24.1-minute lag), so "no ... match within 5 px" fails. The plan's 6.4 px aligns the two stretches at their first points (reproduced: 6.38 px at a 9.1-minute lag); aligning their means gives 4.89 px. An implementer who picks the best translation fails a correct drift, though no one could see a 4 px match 24 minutes later.
- **Evidence.** `ac7.mjs` (0.5 s sampling, the minimum enclosing circle of the difference vectors, which bounds the best translation from above); `drift3.mjs` (start-aligned 6.38, mean-aligned 4.89, absolute 9.9 px).
- **Fix.** "Compared with the two stretches aligned at their first points (design 6.4 px at a 9-minute lag)". Or keep "up to a translation" with a 3 px limit (design 3.97 px).

### PHY3-4. AC-39's "0.3 px at 0.7 s" fails on viewports taller than about 2,600 CSS px

- **Where.** AC-39 (PLAN.md:3331); H5 (:2681).
- **Problem.** The cap scales with H, so below it the spring trails scrolls of up to 1.25 H px/s uncapped. From that steady trail the brightest star is V(2/ω + t)e^(−ωt) × 0.112 from rest at t = 0.7 s, which passes 0.3 px once V exceeds 3,264 px/s. So on a viewport taller than about 2,610 CSS px (a 4K monitor in portrait at 100%, H about 3,800) AC-39 fails by design. H5's heights stop at 1,440, so it never shows.
- **Evidence.** `lag3.mjs`: just under the cap's threshold, 0.096 px at H = 900, 0.153 at 1,440, 0.230 at 2,160, 0.273 at 2,560 and 0.409 to 0.422 at 3,840 (60 and 144 Hz); every case settles by 1.14 s.
- **Fix.** Qualify AC-39 ("at viewport heights up to 2,560 CSS px; taller ones within 0.45 px at 0.7 s"), or bound the cap in pixels too: `maxLag × Math.min(H, 2600)`, which keeps 0.3 px at 0.7 s at any height.

### PHY3-5. Small numeric slips

- **The drift's mean speed is 1.026 v₀, not v₀** (median 1.043 v₀: the two small circles add nothing to the velocity on average, and the length of a sum is convex, so its time average exceeds the main circle's v₀). So:
  - 2.1 (:82): "the speed swells to 1.18 times its mean" is 1.18 v₀, 1.15 times the mean;
  - 6.2 (:1183): "At its mean speed a DPR-2 laptop needs 19.2 fps" is at v₀; at the mean it needs 19.7;
  - AC-2 (:3294): "medians 0.85 and 2.8 at the drift's mean speed" are at v₀; at the mean they are 0.88 and 2.90.
- **AC-15 (:3307).** A camera drift speed at the 0.5 v₀ limit moves the near-median star 0.941 × 0.5 = 0.4705 v₀, not "at most 0.47 v₀". Say "about 0.47".
- **6.1's speed table (:573).** From the band means 1.0239 and 0.2935: near mean 1.78 to 4.36 (not 1.77 to 4.35) and far mean 0.51 to 1.25 (not 0.50 to 1.24) px/s.
- **The `SKY_WINDOW` doc (:2183).** A 16:10 window spans 20.2 to 59.9° along its centre column and down to 17.6° at its bottom corners, not "about 21 to 59°".

## Recomputed and confirmed

These need no change.

- **Depth law.** q bands 0.2398 to 0.3889, 0.3889 to 0.7410, 0.7410 to 1.6; medians 0.2845, 0.4758, 0.9405; means 0.2935, 0.5007, 1.0239; scroll shares 0.0205, 0.0350, 0.0717; the cap from magnitude 0.112; the near band's mean magnitude 1.566 (`DEPTH.reference`). Pinhole translation gives shifts ∝ 1/Z ∝ q, as C1 says.
- **Drift.** Radii 85.94, 15.94 and 4.27 px; wander bound 205.2 px (2ΣR 212.3); speed 0.58 to 1.42 v₀; largest change 3.79% of the current speed per second (the plan's 3.8%); 50.2% of the time above 1.0417 v₀; headings −92°, −177° and +91° at 70, 120 and 150 s; 24 px from the start at 180 s; a loop 177 × 162 px; speed beats 68.7 and 127.3 s; exact repeat after 25 h.
- **Springs and the glide.** 95% at 0.474 s, 99% at 0.664 s; trail 14 and 22 px at 1,000 px/s; the cap binds above 1,125 px/s at H = 900 and holds the brightest star's glide at 25.2 px; eased jumps glide 17.2 to 22.8 px with no overshoot. After a scroll reversed just before it stops, the uncapped spring carries the brightest star up to 6.3 px beyond where it stood at the stop (the plan's "about 6 px"); capped, up to 3.3 px beyond it and 4.4 px past rest, within SP1's "a few px". The motion ease moves the brightest star 6.82 × 0.15 = 1.02 px (0.85 px at 20 fps with the end-of-step rate).
- **Pacing.** Every row of 6.2's table; after a 1,000 px/s scroll the glide needs over 30 fps for 0.44 s at DPR 2.
- **Sprites and atlas.** Unrounded ripple 0.495% (DPR 2); bytes at most 2.452% from DPR 0.25 to 2; the 4 × 4 atlas is 0.72 MB at DPR 1 and 1.904 MB at DPR 2, under B-10's 2 MB.
- **Population (11 sizes, 6,000 visits each).** Mix 75.9 / 17.6 / 6.5%, 57.0% heading right at 1440 × 900; on screen 14.1 to 15.7% of wide-screen visits; no visit stops early. A note, not a finding: on portrait tablets just above 640 px, on-screen showers are mostly stubs (700 × 900: shower share 30.9% of on-screen launches, 91% of those stubs; 768 × 1024: 36.4% and 84%), against 40.8% and 47% at 1440 × 900. Launches don't fail there (0.2 to 1.9%), so it is a matter of look; gating the on-screen branch on landscape would avoid it.
- **Rates.** Gap means 11.69, 21.00, 84.46 and 41.72 s; satellites 39.3% in the first minute and 89.3 s apart; fireballs (P10) in 12.0% of first minutes, one every 8.2 minutes over a visit's first 5 and every 10.2 over its first 10.
- **Cooldown table (6.9).** Today 0.575 a minute; at 55 s, 0.517, 0.579, 0.632, 0.681, 0.749 and 0.817 for shares 0.16 to 0.36; parity at 37.5, 56.5, 71.5, 82, 92.5 and 99.5 s; settings 40, 60, 75, 85, 95 and 100 s.
- **WCAG.** Green on navy 14.13:1, on light navy 12.71:1; a 10% mint fill 1.278:1; slate body text keeps 4.5:1 with 0.0822 of theme white added (section 11's 0.082).
- **Physics.** Range to the 100 km layer 171.7 km at 35° and 477.6 km at 10°; 21.77 px per degree at the centre of a 1440 px window; satellites 26 to 54 px/s and magnitude 3.61 to 5.42 for alpha 0.5 to 0.25; meteors from a radiant behind the viewer converge on the antiradiant, which lies below the horizon and so never on screen (the window's lowest point is 17.6° up).
