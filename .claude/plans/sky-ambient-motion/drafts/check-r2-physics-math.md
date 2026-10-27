# Check round 2: physics and math

Adversarial checker, lens "physics-math", round 2, 2026-10-27. Planning only: this file is the only repository file written.

- **Scope.** Confirm that each round-1 physics-math fix landed in `PLAN.md`, recompute every formula and derived number again (depth law, drift, springs and the snap rule, integrators, pacing, sprite quantization, rate model, per-visit limits, flash rate, durations, WCAG arithmetic), check the physics, and look for regressions the revision introduced. Rejected round-1 findings: none (all 70 were accepted).
- **Inputs.** `PLAN.md` (3,460 lines, revised), `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, R1 to R4, the round-1 reports, the reviser's scratch scripts (`reviser-r1/`), and the worktree code at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `globals.css`, `utils.ts`).
- **Method.** Node 24 scripts in the session scratch folder `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r2-physics/` (not in the repository):
  - `population.mjs` and `phone.mjs`: P9's model exactly as 6.10 writes it (`pickVisitSky` steps 1 to 5, the aim steps 1 to 9, I2's planner with the new end guards), on R2 §10's functions, with the 6.9 scheduler's three-strike stop;
  - `onscreen.mjs`: the worktree's real `catalog.ts` (SKY_SEED), loaded through the plan's own 7.1 resolve hook (`ts-resolve.mjs`, `register.mjs`), with the plan's nearness law and camera;
  - `smoothjump.mjs`, `glide.mjs`: the plan's `springStep`, `settle` and snap rule;
  - `converge.mjs`, `cooldown.mjs`, `flux-sweep.mjs`, `flux-zoom.mjs`, `drift.mjs`.

**Verdict: revise.** 3 major and 7 minor findings. Every round-1 fix landed as described, and most of the arithmetic reproduces (list at the end). The major problems are regressions or gaps around three fixes: the on-screen shower branch that PHY-5's usability test doesn't cover, acceptance limits (AC-1, AC-15) tighter than the real catalog's on-screen spread, and a snap rule that never fires on this site, whose jumps all animate.

## Round-1 fixes: did they land?

| Round 1 | Landed | Notes |
|---|---|---|
| PHY-1 brightness | yes | Factor 0.60 to 1.00 on every screen; peak at most 0.85. Side effect: PHY-4 below (dimmer meteors). |
| PHY-2 end guards | yes | 6.10, I2, H8. |
| PHY-3 snap on fling | yes | No snap in sustained flings. Regression: PHY-3 below (animated jumps never snap). |
| PHY-4 flux criterion | yes | H1 0.6% and 2%. Wording slip in 6.3 (PHY-10 below). |
| PHY-5 unusable shower | partly | Off-screen branch only. PHY-1 below. |
| PHY-6 on-screen share | yes | 14.8 to 15.7% simulated. |
| PHY-7 convergence | yes | 99.79% within 4.5° on planned shower launches. |
| PHY-8 direction mix | yes | 75.9 / 17.6 / 6.5%, 56.9% right (one aim); 75.4 / 18.1 / 6.6%, 57.1% (with retries). |
| PHY-9 satellites | yes | One mid-sky fade; "2 to 5 times" holds (1.7 to 5.1). |
| PHY-10 AC-15 | yes, too tight | PHY-2 below. |
| PHY-11 shift bound | yes | C3, 6.5, deviation 10, C8, R-14. |
| PHY-12 to PHY-20 | yes | PHY-14 and PHY-17 leave small gaps: PHY-5 and PHY-6 below. |

## Major

### PHY-1. On-screen showers skip the usability test; on phones they yield almost nothing, and the three-strike rule can stop meteors for the visit

- **Where.**
  - 6.10, `pickVisitSky` step 2 (PLAN.md:2235) and step 3 (:2236).
  - H8 (:2564): "every visit's shower usable (8 of 16 spawn probes)".
  - Invariant R1 (:306): "every visit's shower can yield paths".
  - The meteor planner's doc (:1857-1862): "today's retry of fresh radiants ... P9 replaces the radiant with the visit's sky and an aim".
  - 6.9 step 3.3 (:1957-1958); P9's visible change (:2900): "about 4 in 10 sharing the visit's shower radiant".
- **Problem.**
  - PHY-5's resample runs only in the off-screen branch. The on-screen radiant is placed uniformly in the top 45% of the screen with a quiet test alone.
  - When it sits low in the spawn area, most spawn points lie above it. Every path from them climbs, and D8's default rejects shower climbs.
  - Paths 10° to about 30° from the radiant are short (speed ∝ sin D), so they fail the 160 px (110 px on narrow screens) minimum. On a phone the whole spawn area lies within about 25° of an on-screen radiant, so only the 40 px stubs within 10° survive.
  - The plan doesn't say whether P9 keeps today's fresh-radiant retry (up to 3 per launch, 1 on narrow screens, `sky.worker.ts:209`). After `maxFailedPlans` failures in a row the kind waits for a new layout (`sky.worker.ts:217`, kept by 6.9 step 3.3), which a still page may never send. Until P9 that stop meant "no room around the copy"; from P9 it can also mean "this visit's sky is bad", which a fresh sky would fix.
- **Evidence** (`population.mjs` with 10,000 visits; `phone.mjs` with 20,000; no quiet rects, so these are lower bounds).
  - 1440 × 900: 20 to 23% of on-screen showers fail H8's own probe (fewer than 8 of 16 non-climbing probes), and 3.3% have fewer than 4. H8 can't go green as written. Laptop launches still plan: 3.5% of attempts fail with one aim per launch.
  - 393 × 852, one aim per launch: on-screen visits fail 30.7% of launch attempts; the shower's share of their meteors falls from 40% to 22.4%, and all of those are near-radiant stubs (22.3% of launches). 47% of on-screen showers fail the probe. Off-screen visits fail 8.0% of attempts, because phone paths are short (mean 163 px against the 110 px minimum).
  - With `narrowLimit` 6 and the three-strike stop: 5.3% of 393 × 852 visits (23% of on-screen ones) stop before their 6th meteor; 8.4% (33%) at 360 × 780. With today's one fresh retry on narrow screens: 0.7% (3.1%) and 1.2% (5.0%).
- **Fix.**
  - In step 2, test the on-screen radiant for yield as step 3 does, but with the aim: of 16 spawn probes, at least 8 give a plannable path (not a shower climb, at least the screen's minimum path, inside the end guards). Or skip the on-screen branch on narrow screens.
  - State that P9 keeps today's retry as fresh aims (a new source and scatter): `METEOR.radiantTries` per launch, 1 on narrow screens.
  - When `maxFailedPlans` clears `visit.sky`, give the fresh sky one more round of `maxFailedPlans` tries (after `TRANSIENTS.retry`) before waiting for a layout.
  - Add a 393 × 852 case to H8: launch-attempt failures under 5%, and the shower's share of planned launches 40 ± 5% in both on-screen and off-screen visits. Make "every visit's shower usable" cover both branches.

### PHY-2. AC-1 and AC-15 test on-screen medians with margins smaller than the real catalog's spread

- **Where.**
  - AC-1 (:3158): "Median on-screen speed ... adjacent ratios at least 1.6 (design medians 1.67 and 1.98)". E1 (:146).
  - AC-15 (:3172): "near median ≤ 0.47 v₀ px/s at any moment ... design 1.0 on average and 1.40 at the drift's peak".
- **Problem.**
  - The design values are population medians of q: 0.2845, 0.4758 and 0.9405.
  - The checks measure the stars actually on screen. That is 12 to 25 near stars on a desktop and 5 to 6 on a phone, fixed by the deterministic catalog.
  - AC-15's limit sits 0.6% above the design value at the drift's peak (0.4674 v₀), and AC-1's floor sits 4% below 1.67. A sample median a few percent off fails a correct implementation. PHY-10's fix tightened the limit instead of widening it.
- **Evidence** (`onscreen.mjs`: the worktree's `catalog.ts` loaded through the plan's 7.1 hook, q from each star's magnitude, scroll offset 0.07·q·scroll).
  - 1920 × 1080, reading positions (1.3 to 12 viewport heights): AC-15 fails at 88% of positions at the drift's peak, with the on-screen near median up to 1.48 px/s against 1.41.
  - 393 × 852: AC-1 fails at 62% of reading positions (lowest ratio 1.54), and at 8% of hero drift positions over 6 minutes of drift clock (lowest 1.56).
  - 1440 × 900 passes, but right at the limits: AC-15 at worst 1.41 px/s, AC-1's lowest ratio 1.60.
- **Fix.**
  - Take the band medians from the nearness law (H6's population values) times the measured camera speed, so the check tests the law, not the sample.
  - On screen, check only the order far < mid < near, or a floor of 1.5.
  - For AC-15: camera drift speed at q = 1 at most 0.5 v₀ × D2's level (design 1.42 × 0.35 = 0.497 v₀), or an on-screen near median of at most 0.55 v₀ (1.65 px/s at v₀ = 3).

### PHY-3. On this site the per-step snap almost never fires: navbar jumps, Home and End glide 110 to 170 px after the page stops

- **Where.**
  - The `CAMERA` doc (:500-502): "A jump of more than `snapViewports` viewport heights in one step (Home, End, find in page) snaps instead of sweeping the sky".
  - 6.1, "Why the snap compares steps" (:509); 2.2, Scrolling (:101).
  - P2's visible change (:2687) and browser check (:2694): "Home and End (the snap)".
  - AC-39 (:3196): "Home and End snap, never sweep".
  - R-16 (:3296): likelihood L, "up to 22 px lag at 1000 px/s ... about 180 px in a sustained 8,000 px/s fling".
- **Problem.**
  - `html` has `scroll-behavior: smooth` under full motion (`globals.css:55`; `utils.ts:26` relies on it), and the navbar's section links scroll with `smoothScrollTo` (`Navbar.tsx:73`).
  - So every jump between sections is an animation of many steps of a few hundred px. Desktop browsers' default smooth scrolling usually animates Home and End too.
  - Under PHY-3's rule no such step exceeds a viewport, so nothing snaps, and the spring trails the animation by up to 2V/ω. Think of a dog on a long leash: the owner stops at the end of a sprint and the dog keeps running for a while.
- **Evidence** (`smoothjump.mjs`: the plan's `springStep` and snap rule at 60 Hz, ease-in-out jumps).
  - Jumps of 3,000 px in 0.5 s, 5,000 in 0.6 s, 8,000 in 0.8 s and 12,000 in 1.0 s: 0 snaps (largest step 150 to 300 px).
  - When the page stops, the brightest stars are still 113, 151, 160 and 168 CSS px from rest, and glide on for about half a second.
  - An 8,000 px jump animated in 0.3 s leaves 494 px.
  - So AC-39's "Home and End snap" can't be observed on this site, P2's browser check fails as written, and R-16's rubber-banding follows every navbar jump, not rare flings.
- **Fix.** Choose and state one of these:
  - **Cap the lag**, instead of or beside the snap. After `springStep`, if |goal − value| > `CAMERA.maxLag` × H (for example 0.25), move `value` to within that lag of the goal and keep its velocity. Every glide after a scroll is then at most 0.25 × H × 0.112, about 25 px for the brightest star at H = 900, and a one-step jump still lands next to its goal.
  - **Or accept the glide.** Say in 2.2, the `CAMERA` doc and R-16 (likelihood H) that animated jumps glide up to about 170 px. Restate AC-39 and P2 as "an instant jump of more than a viewport (find in page, or smooth scrolling off) snaps", and review a navbar jump's glide by eye in P2.
  - Either way, add H5 cases for eased jumps of 3,000 to 12,000 px over 0.3 to 1 s.

## Minor

### PHY-4. The new brightness rule dims the average shooting star by about 40%, and the plan never says so

- **Where.** `METEOR_BRIGHTNESS` (:2147-2154); aim step 8 (:2249); 2.1 (:83); P9's visible change (:2899-2904).
- **Problem.**
  - PHY-1's fix measures dimming from the top of the spawn area, so the factor is 0.6 to 1 (mean 0.81).
  - But R2's ranges (30% at 0.3 to 0.5, 70% at 0.6 to 0.85) date from a rule that brightened most flights. Today ordinary flights peak at 0.75 to 0.9 (`config.ts:291`).
  - The doc's "real counts are dominated by faint meteors ..., so `faintShare` of ordinary flights peak within `faint`" also reads backwards: 30% faint deliberately inverts the real counts.
- **Evidence.** `population.mjs`: the mean planned peak is 0.506 against today's 0.825, at both 1440 × 900 and 393 × 852, and 12% of meteors peak under 0.3.
- **Fix.**
  - Either list "most shooting stars are dimmer than today, about 1 in 8 faint" in 2.1 and P9's visible change.
  - Or rescale to keep today's level within the 0.9 bound, for example `normal` [0.75, 0.9] and `rangeFloor` 0.75.
  - Reword the doc: "real counts are dominated by faint meteors; the hero keeps only `faintShare` faint, so most stay easy to see".

### PHY-5. AC-39's 0.25 px at 0.7 s fails at 60 and 120 Hz (the reviser measured one frame late)

- **Where.** AC-39 (:3196); check log, PHY-14 (:3404).
- **Evidence** (`glide.mjs`).
  - After a 3,000 px/s scroll held long enough to reach its steady trail, the brightest star is 0.256 CSS px from rest at 0.7 s at 60 Hz and 0.266 at 120 Hz.
  - In continuous time it is 0.276: (e + (v + ωe)t)e^(−ωt) with e = −2V/ω, v = V.
  - At 30 Hz the settle lands exactly on 1.10 s.
  - `reviser-r1/spring.mjs` samples "at 0.7 s" one step late (0.717 s), which gave 0.221.
- **Fix.** "Within 0.3 CSS px of rest at 0.7 s and settled by 1.2 s", or 0.25 px at 0.75 s.

### PHY-6. AC-27 and AC-9 leave out M1's snap to whole pixels when motion stops or starts

- **Where.** AC-27 (:3184); AC-9 (:3166); M1 (:282); the snap table (:1232); `placePoint` (:1200-1219).
- **Problem.** At level 0 every star moves from its quarter-pixel phase to `Math.round`: up to half a device pixel in one frame. Play moves it back the same way.
- **Evidence.**
  - A star at px = 100.49 draws at 100.5 with phases and at 100 snapped.
  - After a pause the brightest star can end 1.02 + 0.5/dpr CSS px from where it was: 1.52 at DPR 1 and 1.27 at DPR 2, against AC-27's 1.05.
  - The snap frame moves stars 0.5 CSS px at DPR 1 with no other motion, against AC-9's "normal + 0.25 px".
- **Fix.**
  - AC-27: "at most 1.05 px of eased travel, then the snap of at most half a device pixel".
  - AC-9: exempt the snap frames, or allow half a device pixel there.
  - The snap itself is fine: half a device pixel doesn't show.

### PHY-7. The crossing cooldown has no rule for going up

- **Where.**
  - Deviation 11 (:62).
  - 6.9 (:2000): "lower it only when H9 on captured layouts passes".
  - I8's fallback (:3033): "keep the 55 s cooldown".
  - R-10 (:3290); AC-38 (:3195).
- **Problem.**
  - 55 s reaches parity only up to a crossing share of about 0.185. R2's synthetic 16% for this spawn area passes with margin, but deviation 11's own upper end (0.19) already fails: 0.578 against 0.576.
  - If captured layouts show a higher share, AC-38 fails, and every instruction in the plan says to keep or lower the cooldown.
- **Evidence** (`cooldown.mjs`, the reviser's crossing model, a visit's first two minutes; today 0.576 a minute). Parity needs a cooldown of:

  | Crossing share | 0.16 | 0.19 | 0.22 | 0.25 | 0.30 | 0.36 |
  |---|---|---|---|---|---|---|
  | Cooldown | 37 s | 57 s | 72 s | 82 s | 93 s | 100 s |

- **Fix.**
  - Put the table in 6.9 or H9, and set the cooldown from the measured share, raising it as well as lowering it.
  - Above a share of about 0.3 the cooldown passes 90 s; say that the rate is then the better lever.

### PHY-8. As written, the 40 px near-radiant minimum also applies to sporadic meteors

- **Where.** Aim step 7 (:2248).
- **Problem.** "`minPath = RADIANTS.nearRadiantPath` when `showerOnScreen` lies within `nearRadiant`° of `start`" doesn't name the source. So a sporadic meteor that starts near the on-screen shower radiant may be a 40 px stub, though nothing foreshortens it there.
- **Evidence** (`converge.mjs`).
  - In on-screen visits, 32% of sporadic launches start within 10° of the shower radiant.
  - 12.2% of all their sporadic launches are stubs under 160 px that only this reading admits. They point every which way, which blurs the radiant those visits exist to show.
- **Fix.** "When the aim's source is the shower and `showerOnScreen` lies within ...".

### PHY-9. The earthgrazer spec can't be met

- **Where.** 6.12, the Earthgrazer row (:2423), copied from R2 §5.7.
- **Problem.** At 4 to 6°/s for 2.5 to 3.5 s an earthgrazer spans at most 21°. But 0.45 of the width is about 30° in this window, on any screen, because the longer side always spans 60° (about 66° at the centre's scale). With "skipped silently when no band fits", it would never fly.
- **Evidence.**
  - 0.45 × 1440 px / 21.8 px per degree = 29.8°, against 6 × 3.5 = 21°.
  - The gnomonic stretch toward the sides (up to 1.33×) still gives only about 500 px against the 648 px needed.
- **Fix.** If D4 picks it, require at least 0.3 of the width (19.8°), or 8 to 9°/s. A longer flight would break the 5 s rule: 3.5 s plus 0.54 s of wake is already about 4 s.

### PHY-10. Small numeric slips

- **6.3 (:1184).** "Over every DPR from 1 to 2 ... within 1.6% in bytes (worst: DPR 1.75)". `flux-sweep.mjs` (steps of 0.005) gives:
  - 1.63% at DPR 1.125 (90% zoom on a 125% Windows display);
  - below DPR 1, which browser zoom-out produces and `canvasDpr` allows (`mountSky.ts:87-92`): 1.94% at 0.75 and 2.45% at 0.825.

  H1's grid still passes. Say "within 2.5% at any DPR", or add 0.75 and 1.125 to H1's grid.
- **The `SATELLITE` doc (:2342) and 10.2.** "Passes come about 88 s apart": 4.8 + 84.46 = 89.3 s.
- **6.1 (:856) against AC-7 (:3164).** "Closer than 6.3 px" against "design 6.4 px" (6.38).
- **AC-2 (:3159).** "Design at v₀ = 3: 0.85, 2.8 and 6.82 at the speed peak": 0.85 and 2.8 are the medians at v₀. At the peak the far and near medians are 1.21 and 4.0.
- **The `SATELLITE` doc (:2338).** "Never brighter than mid-layer stars": alpha 0.5 outshines most mid-layer stars (0.39 to 0.62). Say "the brightest mid-layer star".
- **E3 (:148).** "Every rate change eased" doesn't hold at the 640 px crossing, where `driftTarget` switches 1 → 0.6 in one step (:806-808). AC-9 accepts it; say E3 excludes resizes.
- **6.5 (:1322).** Cell 14,680 (3,758,096 / 256), not 14,682.

## Recomputed and confirmed

These need no change.

- **Brightness factor.** The elevation behind a screen point falls monotonically down the screen (d sin h / dv < 0 while v > −cot 40° = −1.19) and away from the centre column. So `rangeTop` at (cx, `METEOR.top`) is the nearest range for every start at or below `METEOR.top`, and the factor never exceeds 1 anywhere there. The peak is at most 0.85 ≤ 0.9 (I2, H10).
- **Population (H8 conditions).**
  - Mix 75.9 / 17.6 / 6.5%, 56.9% right with one aim; 75.4 / 18.1 / 6.6%, 57.1% with today's retries.
  - On-screen visits 14.8 to 15.7%.
  - Shower great circles within 4.5° of the radiant: 99.79% (worst 6.3°).
  - Mean speed 308 px/s, mean path 268 px; the mean class duration is 0.958 s (10.2's 0.96).
- **Gnomonic speed.** f·V·√(u² + v² + 1)·|(u r_z − r_x, v r_z − r_y)|/q, re-derived from the pinhole projection. Speed classes at D = 90° and q = 154 km match entry speeds of 24, 38 and 59 km/s (helion, toroidal, apex).
- **Satellites.**
  - The ISS at 40° elevation moves 0.49°/s along the vertical plane and 0.70°/s across it, so 1.2 to 2.5°/s is 1.7 to 5.1 times real.
  - 26.1 to 54.4 px/s; 125 to 261 px a pass.
  - Alpha 0.25 to 0.5 corresponds to magnitude 5.42 to 3.61.
  - A first attempt within 60 s on 1 − e^(−0.5) = 39.3% of visits.
- **Springs.**
  - v(t) = (v − ω(v + ωe)t)e^(−ωt) matches the plan's velocity line.
  - Fling steps equal the scroll's own (5.6 to 18.7 px for the brightest at 3,000 to 10,000 px/s).
  - Settle 0.87 to 1.08 s after a monotone stop.
  - A reversal for 0.13 s just before stopping overshoots about 6.5 px for the brightest.
- **Drift.**
  - First minute from the dusk: 18.9°, 9.1°, 2.7°, −1.6°, −6.7°, −16.1° and −51.9° at 5 to 60 s, with speeds 0.924 to 0.682 v₀; within 30° of level for 52.7 s.
  - Near-returns: 3.9 px at 8.9 min (R1's phases 5.8 px at 9.0 min).
  - Wander 68.41 s × v₀; 2ΣR = 70.77 s × v₀; brightest 328 px.
- **Pacing.** Every row of 6.2's table. Need above 20 fps whenever the drift exceeds 1.0417 v₀ (50.2% of the time); v₀ 3.3 is the 30 fps threshold at DPR 2; AC-2's 8 px/s ceiling breaks just above v₀ 3.5.
- **AC-15's star ceiling.** The brightest star's 0.795 v₀ is a hard bound (q ≤ 1.6, speed ≤ 1.42 v₀), so "no star over 0.8 v₀" holds.
- **Rates.**
  - Gap means 11.69, 21.00, 84.46 and 41.72 s.
  - First 60 s after the reveal: median 5, 3 to 6 in 90.1% (still median 5 counted from load).
  - Crossings at 55 s and share 0.16: 0.518 a minute against today's 0.576.
- **Sprites.**
  - Worst unrounded ripple 0.495% (DPR 2) over any DPR from 0.5 to 2.
  - At standard zoom DPRs, bytes stay at or under 1.94%.
  - Position error at most 1/8 px; placement conventions consistent with today's `Math.round`.
- **WCAG.** PF's `inkKeep` 0 leaves a far star's 0.039 to 0.06 under the 0.064 haze headroom. The warmest drawable tint is R / (R + G + B) = 0.423.
- **Physics.** New Horizons' Proxima shift is about 36 arcsec ("half an arcminute"). Double spacing at 4 million px is 4.7 × 10⁻¹⁰ px.
