# Check round 8: physics and math

Adversarial checker, lens "physics-math", round 8, 2026-10-27. Planning only: this file is the only repository file written.

## Scope

- **Role.** Recompute every formula, constant and derived number in `PLAN.md` (3,664 lines, read in full), above all the ones round 6 and round 7 changed: AC-39's and H5's bounds and settle times, the turn-rate windows, AC-4's and AC-20's counts, the crossing bar and the cooldown table (re-based in round 7 on the landed numbers), `scrollKept`'s ramp, the per-rect budgets and the quiet reach. Check units, and that the formulas match R1 to R3 or that the differences are justified. Confirm that round 7's PHY7-1 fix landed, look for regressions, and check the post-commit restructure through this lens: anything stale from the before/after-V split, anything an implementer needs that was lost, and every re-grounded `file:line` that carries a number.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8", "Landed in the working tree"), `research/01-planning-brief.md`, `PLAN.md`, `REVIEW-LOG.md` (including "Post-commit restructure (cf4d7b8)"), my round-7 report, word diffs of `PLAN.md` against the round-7 snapshot and the pre-restructure copy, the code baseline at `.claude/worktrees/sky-baseline-cf4d7b8` (cf4d7b8: `config.ts`, `scene.ts`, `meteors.ts`, `catalog.ts`, `sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`, `mountSky.ts`), and the archived veil harness's planner results (`harness/veil-confirm-final-1.tar.gz`, extracted to scratch).
- **Output.** This report, and the findings returned to the workflow.
- **Limits.** No edit to `PLAN.md`, `REVIEW-LOG.md`, `src/` or any configuration, in any checkout; scripts only in the scratch folder.

## Method

Node 24.14 scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r8-physics/`. `rng.mjs` is a xoshiro128** generator, independent of the revisers' LCG. `port.mjs` is round 6's line-for-line port of 6.1's `stepSpring`, `settle` and `stepCamera`; 6.1's `camera.ts` sketch is byte-identical to the round-7 snapshot (`cam-old.txt` against `cam-new.txt`), so the port still applies.

- `ac39std.mjs`: AC-39 and H5's one-step jumps at the display rates AC-39 now names, and the 48 to 144 Hz continuum.
- `h5variants2.mjs`: H5's "glides alike at 30, 60 and 144 Hz within 0.002 × H px" for its listed scrolls, with the shipped `CAMERA` and H5's two variants (`maxLag` 0.15, `scrollOmega` 12), compared on the frames all three rates draw.
- `cooldown8.mjs`: 6.9's bar and cooldown table re-implemented from 6.9's step list with the independent generator; the revisers' `reviser-r7/cooldown-landed.mjs` and `cooldown-phone.mjs` re-run too. `ninebars.mjs`: the bar and the settings on all nine archived layouts, from the landed `nearCopy` shares.
- `phone.mjs`, `phonebar.mjs`: P9 on a phone under 6.9's rules (the cooldown, step 2.3's clear-sky retries), for a range of clear-sky fit rates.
- `ac16a.mjs`, `ac16b.mjs`: AC-16's two thresholds against cf4d7b8's `drawLayer` alpha (quiet factor, then twinkle, then the 0.78 cap).
- `heading8.mjs`: the first-minute headings for the plan's phases and R1's. `brightness.mjs`: `METEOR_BRIGHTNESS` over today's spawn area, and `SKY_WINDOW`'s geometry.

## Round 7's fix: did it land?

| Round 7 | Landed | Notes |
|---|---|---|
| PHY7-1: AC-39 and H5 at the display rates | yes | AC-39 (`PLAN.md:3473`) names 30, 48, 50, 60, 66.7, 72, 75, 90, 100, 120 and 144 Hz, puts the worst case "at 30 and 48 Hz", and adds "up to 3.6 × 10⁻⁴ × H at 0.7 s between 30 and 48 Hz, settled by 1.25 s up to H = 2,700"; H5 (`:2902`) runs its one-step jumps "at AC-39's display rates". Re-run (`ac39std.mjs`): at those rates the worst is 2.731 × 10⁻⁴ × H (2.677 with H5's jump sizes 0.1, 0.2 and 0.245 H), settled by 1.100, 1.200 and 1.267 s at H = 900, 2,560 and 3,840, the plan's figures. |

No regression: the camera sketch is unchanged, and H5's other clauses still hold (below). One wording note, not a finding: at non-standard rates between 48 and 144 Hz the worst is 2.92 × 10⁻⁴ × H (settled by 1.245 s at H = 3,840), so the complete clause is "up to 3.6 × 10⁻⁴ × H at 0.7 s between 30 and 144 Hz". Every display and WebKit's worker clock run at named rates, and H5 tests only those.

## The restructure, through this lens

- **Nothing stale.** No "PF", "CP-0", "CP-3" to "CP-5", "8.5" to "8.7", "observed", "before V", "after V", "integration branch", D10 or D11 remains outside the one-line notes in section 3 and 8.1 (grep). The cooldown retune that 8.5 step 5 did now sits in P9's verification and H9; 8.6 item 4's re-measure check is AC-16 (b) in P3 and P6; PF's flat-veil arithmetic went with PF, and nothing in the plan still relies on it.
- **`PLAN.md`'s re-grounded references that carry a number or a formula, all correct on cf4d7b8.** `config.ts:58-59`, `:78-80`, `:170-171` (0.4), `:179` (`EMERGENCE`), `:222-237` (`FRAME`, `meteorScrollQuietMs` 1200 at `:231-232`), `:247-253` (`METEOR`'s doc, `firstDelay` [4.5, 7]), `:262-271`, `:266`, `:286-290`, `:299`, `:305`, `:321`; `scene.ts:11-18`, `:20-23`, `:30`, `:36`; `meteors.ts:39-40`, `:195-196`, `:203`, `:204-207`, `:206`, `:208-212`, `:213`, `:215-220`, `:216-217`, `:224`, `:226-228`, `:229`, `:236`; `renderSky.ts:38-39` (the key), `:48`, `:64`, `:71-72`, `:93` (`EDGE` 24), `:100`, `:107`, `:113`, `:120`, `:121-125`, `:127`, `:155`, `:237`; `sky.worker.ts:92-98`, `:100-128`, `:135-152`, `:143-144`, `:163-165`, `:171-187`, `:212-238` (with `:222`, `:226`, `:227-231`, `:233`), `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:354-357`, `:368-379`, `:435-436`, `:467-493` (`:486`, `:487`), `:503-509`, `:510-524` (`:519`), `:531`, `:533`, `:535`; `mountSky.ts:17-27`, `:40-41`, `:52` (1500 ms), `:92-97`. The values behind the plan's figures check out there too: `QUIET` and `QUIET_REACH` (`config.ts:147`, `:153`), `inkBudget` and `scrollKept` (`scene.ts:163-166`, `:187-189`), the quiet ease as `smoothstep(0, QUIET.ease, ·)` (`sky.worker.ts:265`), the 64-rect cap shared by quiet and pinned rects (`mountSky.ts:230-231`, so `to` and `next` hold at most 128), and `canvasDpr` passing a ratio below 1 through (`mountSky.ts:97`).

## Findings

No blocking or major findings. Four minor ones, each cheap and clearly right.

### PHY8-1 (minor). "55 s meets every bar for shares up to 0.6" holds on the three tabulated layouts, not on 2560 × 1440, one of the nine that H9 and P9 measure

- **Section.** 6.9, "The setting" and its table (`PLAN.md:2262-2271`); R-10 (`:3566`); H9 (`:2906`); P9's verification (`:3255`); AC-38 (`:3472`).
- **Problem.** The setting is "the smallest multiple of 5 s whose H9 rate on each captured layout, at P9's share there, is at or below that layout's bar" (`:2262`), and H9 and P9 measure "on the nine archived layouts". But the table gives bars and settings for 1440 × 900, 1280 × 800 and 1920 × 1080 only, and concludes "So 55 s meets every bar for shares up to 0.6" (`:2271`); R-10 repeats it ("which meets the landed `nearCopy` bars for P9 shares up to 0.6"). The lowest landed share of the nine is 2560 × 1440's, 25.8% (`COORDINATION.md`, "Landed in the working tree", other sizes), so its bar is 0.41 a minute, the lowest of all, and 55 s meets it only for P9 shares up to 0.28. P9's verification says to retune "from the measured share (6.9's table)", and the table has no row for the layout that binds.
- **Evidence.** `ninebars.mjs` (6.9's model, independent generator): bars 0.970, 0.896, 0.560, 1.091, 0.767, 0.412, 0.948 and 1.360 a minute at 1440 × 900, 1280 × 800, 1920 × 1080, 1366 × 768, 1536 × 864, 2560 × 1440, 1280 × 720 and 1024 × 768 (and 0.673 on the phone). At 2560 × 1440 the settings are 45, 55, 60, 75, 85, 95 and 100 s at P9 shares 0.2, 0.25, 0.3, 0.4, 0.5, 0.6 and 0.7; 55 s gives 0.425 a minute at share 0.3 against 0.412. On every other desktop layout 55 s holds up to a share of 0.6 (1920 × 1080 needs 60 s at 0.7, as the table says; the four untabulated ones need at most 50 s at 0.7). P9's share at 2560 × 1440 is unknown until P9 measures it; since about 57% of P9's flights head away from the left-aligned copy (6.10), it may well stay under the veil commit's 25.8%, so 55 s may still pass, but the plan's claim doesn't say so.
- **Fix.** Add a 2560 × 1440 row to 6.9's table (bar 0.41: 45, 60, 75, 85, 95 and 100 s at shares 0.2, 0.3, 0.4, 0.5, 0.6 and 0.7) and reword `:2271`: "So 55 s meets these bars, and those of 1366 × 768, 1536 × 864, 1280 × 720 and 1024 × 768 (1.09, 0.77, 0.95 and 1.36 a minute), for shares up to 0.6, but the 2560 × 1440 bar (0.41, the lowest) only up to 0.28: there P9's measured share sets the cooldown." R-10: "meets the landed bars for P9 shares up to 0.6 on every desktop layout but 2560 × 1440 (up to 0.28)". AC-38's parenthetical can add "0.41 at 2560 × 1440, the lowest".

### PHY8-2 (minor). AC-16's two thresholds bound the quiet factor but are stated on a star's alpha, which also carries the twinkle; a correct sky fails both in the hero

- **Section.** AC-16 (`PLAN.md:3450`), checked in P3 and P6 (8.1, `:3350`; P6's checklist).
- **Problem.** The drawn alpha is min(0.78, alpha × quiet factor × twinkle) (cf4d7b8 `renderSky.ts:120`, `:123-124`, `:131`), and the twinkle is on in the hero, where both checks run.
  - (b) "no star's alpha changes faster than the quiet ease allows (at most 2 a second: 0.78 × 1.5 / 0.6 s)" is the ease's rate for an untwinkling star at `STAR_ALPHA.peak`. A near star's twinkle factor exp(σn − σ²/2) reaches 1.63 at the top of the screen and 1.80 at 60% of its height (σ up to 0.22 × (1 + 0.6 d²), n up to (1 + 0.7 + 0.45) / 0.92 = 2.34; `config.ts:80`, `:93`, `:96`), and below the cap it multiplies the ease's term. The reveal's first layout eases every near star behind the copy out over 0.6 s while it twinkles, so a frame capture of any load can fail (b).
  - (a) "changes alpha by at most 0.05 per drawn frame": the quiet edge itself gives at most 0.010 per frame (0.78 × 1.5 / 40 × 6.82 / 20), but the twinkle alone moves a near star's alpha by more than 0.05 per frame at 20 fps, which is the drift's rate on a DPR-1 laptop and on phones (6.2).
- **Evidence.** `ac16b.mjs` (200,000 random near stars, 30 fps fade frames through the 0.6 s smoothstep ease): 1.94 a second without the twinkle; 3.42, 3.52 and 3.81 a second with it at depths 0, 0.3 and 0.6 of the screen (instantaneous bound from the ease term alone, 0.78 × T_max × 2.5: 3.18, 3.26 and 3.52). `ac16a.mjs` (20,000 near stars, one minute each, no quiet zone): largest twinkle step 0.056 per frame at 20 fps at depth 0 and 0.068 at depth 0.6, with 1.4% and 11.6% of near stars over 0.05 within a minute; 0.038 and 0.046 at 30 fps. The 2-a-second figure is my own round-1 PHY-16, which left the twinkle out; cf4d7b8 behaves the same, so P3 would "fail" on unchanged code.
- **Fix.** State both on the alpha before the twinkle: "(a) A drifting star crossing a quiet edge changes its alpha before the twinkle by at most 0.05 per drawn frame. (b) While rects are re-measured mid-ease, no star's alpha before the twinkle changes faster than the quiet ease allows (at most 2 a second: 0.78 × 1.5 / 0.6 s), with no one-frame pop." Measure it with the debug patch logging the quiet factor, on stars that don't twinkle (90% of far stars, 65% of mid ones), or with the scene's twinkle at 0 for the test. If the check must stay on drawn alpha, use 0.08 per frame and 4 a second.

### PHY8-3 (minor). 2.2's phone row promises two things that 6.9's cooldown makes exclusive: a shooting star every 21 s, and most of them dimming near the copy

- **Section.** 2.2, the phone row (`PLAN.md:99`); 6.9's phone sentence (`:2271`); H9 (`:2906`).
- **Problem.** "After P9, shooting stars come every 21 s on average, at most 6 a visit; most dim near the copy, which fills much of a phone's sky (two in three of the veil commit's do; about 3% end in open sky)." The two in three is the veil commit's share, which has no cooldown. Under 6.9, a phone visit's six launches come within about two minutes, and the crossing cooldown (55 s from the reveal and after each lease) lets at most one or two of them take the lease; H9 itself says "the cooldown and a busy lease keep a phone's plans in clear sky".
  - If clear-sky plans fit, launches come every 22 s and only 16 to 23% dim near the copy (P9 shares 0.5 to 1 there).
  - If they rarely fit (6.9 step 2.3 expects "little clear sky" on a phone), a held launch retries every 5 to 9 s until the lease frees, so launches come every 37 to 59 s, and at the veil commit's share most of them dim near the copy.

  6.9's "55 s gives 0.29 to 0.48 for shares of 0.3 to 0.7" assumes the first case; in the second, the phone's crossing rate rises to its bar.
- **Evidence.** `phone.mjs` (P9 on a phone, the veil commit's share 0.673, 100,000 five-minute visits), by how often a clear-sky plan fits:

  | Clear-sky plans fit | always | half the time | 1 in 5 | 1 in 20 | never |
  |---|---|---|---|---|---|
  | Mean launch interval | 22.0 s | 25.9 s | 32.7 s | 41.5 s | 47.0 s |
  | Launches dimming near copy | 18.9% | 25.8% | 38.6% | 56.1% | 67.2% |

  Even at share 1, near-copy launches stay at 22.5% when clear-sky plans fit. `phonebar.mjs`: crossings a minute over the first two minutes at 55 s, share 0.673: 0.471 (always fit) to 0.666 (never); share 0.7: 0.478 to 0.683, against the phone bar of 0.673.
- **Fix.** 2.2: "After P9, at most 6 a visit. While a path in clear sky fits beside the copy, they come every 21 s or so, and the crossing cooldown keeps all but one or two of them in clear sky. Where none fits (H9 measures how often), a launch waits for the lease, so they come about once a minute and dim near the copy, as two in three of the veil commit's do." 6.9: after "55 s gives 0.29 to 0.48 for shares of 0.3 to 0.7", add "if every clear-sky plan fits; where none does, a held launch retries every 5 to 9 s and takes the lease soon after each cooldown ends, up to 0.67 a minute at a share of 0.67 and 0.68 at 0.7".

### PHY8-4 (minor). 6.1's first-minute row says 52.7 s within 30° of level; it is 53.2 s

- **Section.** 6.1's drift table (`PLAN.md:562`); deviation 2 (`:47`) and the `DRIFT` doc (`:532`) say 53.
- **Evidence.** `heading8.mjs` (the drift clock is the integral of the 3 s smoothstep from the dusk): the heading starts 28.4° up-right and first leaves 30° of level at 53.20 s, so it is within 30° for 53.2 of the first 60 s. The row's other figures reproduce: 18.9°, 9.1°, −6.7°, −16.1° and −51.9° at 5, 10, 30, 45 and 60 s; 0.92, 1.03, 1.18, 1.18, 0.96 and 0.68 v₀ at 5, 10, 20, 30, 45 and 60 s; level between 15 s (2.7°) and 20 s (−1.6°). R1's phases give 16.2 s (deviation 2's "16").
- **Fix.** Write 53.2 s.

## Recomputed and confirmed

These need no change.

- **Camera.** AC-39 at the named rates as above. H5's "glides alike within 0.002 × H" on frames all three rates draw (`h5variants2.mjs`): with the shipped `CAMERA`, a steady scroll just under the cap that stops abruptly gives 1.84 × 10⁻³ × H (C4's figure: V/(2f) between 30 and 144 Hz at the cap's 1.25 H/s, times 0.112), eased jumps 0.41 × 10⁻³ × H, and flings 0 (they stop capped). With `maxLag` 0.15: 1.10 × 10⁻³ × H at most. With `scrollOmega` 12: eased jumps 0.48 × 10⁻³ × H and flings 0, so H5's listed scrolls pass; only an abrupt stop just under the cap would reach 2.2 × 10⁻³ × H there, and H5 lists none. SP1's 5.06, 4.84, 4.72 and 4.64 px; the snap rule's 6 jumps of about 101 px in 2 s at 5,000 px/s; C4's 27,000 px/s; 95% at 0.474 s and 1.186 s for ω = 10 and 4.
- **Drift.** Radii 85.94, 15.94 and 4.27 px; ΣR = 35.38 s × v₀; the bound 68.41 s × v₀ = 205.2 px, 70.77 s × v₀ for any phases; frequencies 0.0056, 0.0090 and 0.0134 Hz; speed beats of 68.8 and 127.3 s. The motion ease's 6.82 × 0.15 = 1.02 px; the rate-change integration error under 0.2 px (h/2 of drift clock at 20 fps, 0.11 px).
- **Depth.** Band medians q 0.2845, 0.4758 and 0.9406 (ratios 1.676 and 1.977); capped from m = 0.112; scroll shares 0.0205, 0.0351 and 0.0717; 2.1's 298 stars as 15, 70 and 213.
- **Crossings.** `cooldown8.mjs` reproduces every cell of 6.9's table and the bars 0.969, 0.896 and 0.561 (closest margin: 25 s at share 0.4 on 1440 × 900, 0.967 against 0.969); the first-crossing settings 55, 65 and 110 s at share 0.5; the five-minute 10 to 90 s (45 to 90 at 1920 × 1080); the phone's 0.29 to 0.48 at 55 s with every clear-sky plan fitting. Deviation 11's "half to two thirds" holds for shares 0.3 to 0.7 (0.45 to 0.67).
- **Contrast and reach (cf4d7b8).** `inkBudget` gives 0.0495 (slate body), 0.1485 (tagline, rails) and the 0.2 ceiling (name, green), with `METEOR_PASS.visible` 0.12 between them; `scrollKept` is clamp(fade) × (1 − smoothstep(12, 24, |Δ|)), and `fadeOutAt` reaches exactly 0 at `since` + 0.2; `ZONE_REACH` = 72 − 32 = 40; `zoneQuiet` is 0 at 40 px or more (Euclidean) from a padded zone and `zoneInk` reaches only inside it, so the index's buckets are exact; `segmentClear`'s worst graze is the 8 px chord's sagitta in a 40 px corner, 0.20 px. AC-16 (b)'s untwinkled 1.95 a second survives the drift (1.957 at most).
- **Sprites and cache.** Bilinear peak 0.503 at phase (0.5, 0.5) for σ 0.7 with the 4 × 4 area sampling (6.3's 0.504); `EDGE`'s 12 CSS px at DPR 0.25 and under 9.4 from DPR 1; SF2's collision (`cy` 32,768 takes the key of (`cx` + 1, −32,768), `renderSky.ts:39`); 33,554,432 × 0.112 = 3.76 million px, cell 14,680, and about 3,745 full-page cycles on a 20,000 px page.
- **Transients.** `METEOR_BRIGHTNESS` over today's spawn area: mean peak 0.50 (0.61 of today's 0.825), 13.0% under 0.3, the centre row at 0.62 of the top (1440 × 900; 0.59 to 0.61 and 12.4 to 14.1% at 1280 × 800 to 2560 × 1440). `SKY_WINDOW`: 59.8° at the top of the centre, 17.6° at the bottom corners; ranges 171.7 and 477.4 km at 35° and 10°. Fireballs in 12% of first minutes after P10; at P9's rate with today's 8%, one every 2.6 minutes ("about one every 3"). Satellites 21.77 px/°, 26 to 54 px/s, a first attempt within 60 s on 39.3% of visits, 89.3 s apart. Gap means 11.69, 21.00 and 84.46 s.
- **Limits.** AC-2 (0.85, 2.82, 1.21, 4.01 and 6.82 px/s; the 3.52 v₀ ceiling), AC-15 (0.497, 0.468 and 0.795 v₀; 2.385 px/s for the brightest under 2.4), AC-27 (1.02 px), H10 (4.9, 4.8, 3.8 and 3.2 s), the burst stagger's 2.86 onsets a second.
- **The veil session's D12 figure.** "About 3% of leases wait" is round 3's measured cost of the two-way hold (`check-r3-coordination-a11y.md`), close to the satellites' duty cycle over a 10-minute visit (4.8 s per pass every 89 s, stretched); not re-run.

## Summary

- **Verdict: pass.** No blocking or major findings. Round 7's PHY7-1 fix landed and re-runs exactly at the named display rates, the camera sketch is unchanged, and the restructure left nothing stale or lost in this lens; every re-grounded reference that carries a number checks out on cf4d7b8.
- **Four minor findings.**
  - PHY8-1: 6.9's and R-10's "55 s meets every bar for shares up to 0.6" leaves out 2560 × 1440, one of the nine layouts H9 and P9 measure, whose bar (0.41 a minute) 55 s meets only up to a share of 0.28.
  - PHY8-2: AC-16 (a) and (b) bound the quiet factor but are stated on alpha, so the twinkle fails them on a correct sky (up to 0.068 per frame at 20 fps, up to 3.8 a second mid-ease).
  - PHY8-3: 2.2's phone row claims a shooting star every 21 s and most dimming near the copy, which the crossing cooldown makes exclusive; 6.9's phone rate assumes every clear-sky plan fits.
  - PHY8-4: 6.1's 52.7 s within 30° of level is 53.2 s.
