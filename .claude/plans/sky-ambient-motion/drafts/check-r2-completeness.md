# Check round 2: completeness and implementability

## Scope

- **Role.** Adversarial checker, round 2, lens "completeness and implementability". I confirm that round 1's fixes landed, look for regressions the revision introduced, and report real problems in `PLAN.md`, not praise.
- **Inputs read.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md`, `research/01-planning-brief.md`.
  - `PLAN.md`, all 3,460 lines (49,368 words), including its round-1 check log.
  - My round-1 report (`drafts/check-r1-completeness.md`), the round-1 findings and dispositions the workflow relayed, R2 §10, R3's ADAPT and twinkle-clock notes, and the domain-model draft's §6.2, §6.4 and §6.5 bodies.
  - The worktree code at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `tsconfig.json`, `.claude/launch.json` (and master's copy).
- **What I checked.** Every section the brief requires; every settled default and deviation; every decision row; every new config constant; every phase's goal, files, steps, visible-change statement, verification and checklist, rollback and blocked mark; whether P1 can be built without re-deriving anything; bloat.
- **Recomputed or reproduced** with scratch scripts in the session scratchpad (`check-r2-completeness/`, not in the repository):
  - `phase0.mjs`: H1's phase-(0, 0) byte identity at seven ratios.
  - `h-real-sky.ts`: the real seeded catalog, loaded through the plan's own 7.1 resolve hook on Node 24.14.
  - `ac15.mjs`, `shares.mjs`, `ac1.mjs`, `tol.mjs`: on-screen band medians and drift-speed shares.
  - `ac38.mjs`, `ac38b.mjs`: crossings a minute over a visit's first two minutes.
  - `h9.mjs`: the first-minute meteor count.
  - `steps/`: a type-check of the step orders and the `wake` name with the installed TypeScript 6.0.3.
- **Output.** This file and the structured result. `PLAN.md` and every other repository file are unchanged.

## Verdict: revise

Four major findings, no blocking ones, and six minor ones.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| C18 | major | 7.0, P9, P11 (P1, P2, P8) | P9's and P11's first steps don't compile as ordered, so "one commit per step, each green" fails |
| C19 | major | 6.10, I7, P9 | The binding name `Meteor.wake` (a color) collides with today's `Meteor.wake` (the afterglow time constant) |
| C20 | major | dev. 11, 6.9, P9, H9, AC-38, I8, R-10 | The 55 s default straddles AC-38's pass line, and the plan only allows lowering it |
| C21 | major | AC-1, AC-2, AC-15, 7.1, P6 | The debug log can't measure on-screen medians, and AC-15 fails on the real sky at common desktop sizes |
| C22 | minor | P4, P6 | The two "do it" steps have no design (ADAPT fade) and miss `renderSky.ts` in their file lists |
| C23 | minor | 6.10, P9 | Fireballs between P9 and P10, `radiantTries`, METEOR's inner docs and the shower probes are undefined |
| C24 | minor | 8.7, P8, P9, 5.4, 7.0 | Verification lists checks the phase can't deliver; the production-build list misses four phases |
| C25 | minor | 4.3 R1, 6.9, P10 | The visit memory resets on more events than R1 names and would clear P10's fireball spacing |
| C26 | minor | P5, D10, PF | P5's rollback omits P4; D10 recommends no answer; PF has no visible-change statement |
| C27 | minor | whole plan | The plan grew 17%, a copied number is wrong, and P1 and P3 lean on a superseded draft |

## Round-1 fixes: confirmed

My seventeen round-1 findings all landed, with the residues noted:

- **C1** (the flux gate): A1, 6.3, H1 and AC-11 carry 0.6% unrounded and 2% in bytes, and 6.3 says P1 keeps today's sprite sizes. I re-ran the phase-(0, 0) identity: 0 byte mismatches over 9,354 pixels at DPR 1, 1.1, 1.25, 1.3, 1.5, 1.75 and 2 (`phase0.mjs`), so H1's identity part is passable at 1.75 too.
- **C2, C3, C5, C7, C8, C9, C11, C12, C14, C15, C16:** fixed as the dispositions say (checked at PLAN.md:62, :162, :1484, :1694-1729, :1984, :2492, :2602, :2810, :3015, :3181, :3194).
- **C4** (phase parts): every phase now has a goal, files, steps, a visible-change statement, verification, a rollback and a blocked mark, except PF's visible change (C26). The new steps introduced C18.
- **C6** (`pickVisitSky`): five steps at PLAN.md:2232-2238. The probe placement is still open (C23).
- **C10:** the block docs are given, but `radiantTries` and the inner key docs are not (C23).
- **C13:** both steps say "do it", but one has no design (C22).
- **C17:** fixed in part, and the plan grew since (C27).

The other lenses' fixes that touch this lens also landed consistently: P5 before P4 (7.0 Gates, 7.2's map and table, P4, P5), the integration branch (1, 7.0, 8.5), CP-1's local checks (8.2), the message `switch` (6.8, P13, 7.1).

## Major findings

### C18. P9's and P11's first steps can't be green in the order given

- **Section.** 7.0 ("one commit per numbered step, each green"); P9 steps; P11 steps; softer cases in P1, P2 and P8.
- **Problem.** 7.0 requires every numbered step to be a green commit (PLAN.md:2496). Two first steps don't compile as specified, and three others leave the tree broken until a later step. The step lists were added in round 1 (C4), so this is a regression of that fix.
- **Evidence.**
  - **P9 step 1** (PLAN.md:2896) builds `radiants.ts` "with H8 green".
    - The sketch imports `Aim` and `Flight` from `meteors.ts` (PLAN.md:2172). They arrive with I2 in step 2 (PLAN.md:2892, :2897), and today's `meteors.ts` exports neither (`meteors.ts:7-57`).
    - A scratch type-check with TypeScript 6.0.3 gives `TS2305: Module './meteors' has no exported member 'Aim'` (and `'Flight'`).
    - H8 counts *planned* launches and checks the end guards (PLAN.md:2564), which also come with I2 in step 2.
    - Step 1 also needs `WakeColor` (the `SpeedClass.wake` field, PLAN.md:2118), which it doesn't list.
  - **P11 step 1** (PLAN.md:2949) builds `satellites.ts`.
    - `planSatellite` returns `Planned<'satellite'>` (PLAN.md:2392) before step 2 adds the kind: `TS2344: Type '"satellite"' does not satisfy the constraint '"meteor"'`.
    - It calls `segmentTouches` (PLAN.md:2405) before step 3 exports it. Today it is private (`meteors.ts:75`): `TS2459` unless the veil session exported it.
  - **Softer cases.**
    - P1 step 1 (PLAN.md:2647) lays the atlas out in 4 × 4 phase blocks while `drawLayer` still indexes `tint * SHAPE_COUNT + shape` (`renderSky.ts:127`) until step 2. That commit compiles but draws the wrong sprites, and H2 fails.
    - P8's files move `retry`, `maxFailedPlans`, `recheck`, `afterReturn` and `narrowLimit` out of `METEOR` (PLAN.md:2857), but the worker reads them until step 3 (`sky.worker.ts:103`, `:202-203`, `:217`, `:343-345`).
    - P2 step 3 (PLAN.md:2682) replaces `SkyFrame.parallaxScroll`, which `frameAt` sets (`sky.worker.ts:258`), but the worker wiring is step 4.
- **Fix.**
  - P9: step 1 adds `WakeColor` and the `Flight` and `Aim` types to `meteors.ts` along with `radiants.ts`, and checks H8's raw-candidate parts (the direction mix of `radiantMotion` over the spawn area, the usable shower, the 15% on screen). H8's planned-launch parts (the end guards and the planned mix) move to step 2.
  - P11: step 1 also adds `'satellite'` to `TransientBodies` and exports `segmentTouches` (I6), or steps 1 and 2 merge.
  - P1: step 1 switches `drawLayer` to `starSpriteIndex(tint, shape, 0, 0)`.
  - P8: remove `METEOR`'s moved keys in step 3, with the worker swap.
  - P2: step 3 sets `camera` in `frameAt`.

### C19. `Meteor.wake` already exists as the afterglow time constant

- **Section.** 6.10 (the planner contract, speed-class colors), 8.3 I7, P9 files and step 2.
- **Problem.** The plan adds a `WakeColor` field named `wake` to `Meteor`, but `Meteor.wake` is already a number. Section 6 says names are binding (PLAN.md:412), so the plan can't be implemented as written. I7 also asks the veil session for the same clashing name.
- **Evidence.**
  - Today: `/** Wake afterglow time constant (s). */ wake: number` (`meteors.ts:39-40`). It is set at `meteors.ts:171` and read at `:216`, `:221` and `renderSky.ts:212`, `:233`.
  - The plan: "Meteor gains: ... wake (P9)" (PLAN.md:2290); "picks by `meteor.wake`" (:2315); P9's files and step 2 (:2892, :2897); I7: "the wake tint comes from `meteor.wake`" (:3032).
  - Scratch type-check: `TS2430: ... Types of property 'wake' are incompatible. Type 'string' is not assignable to type 'number'`.
- **Fix.** Name the color `wakeColor` on `Meteor`, and on `Flight` and `SpeedClass` for consistency. Change 6.10, the I7 row and request, and P9's files and steps to match.

### C20. No rule for when AC-38 fails at the default cooldown

- **Section.** Deviation 11; 6.9 "The cooldown"; P9 verification; H9; AC-38; I8; R-10.
- **Problem.** The plan's own numbers put the 55 s default on both sides of AC-38's pass line, but every place that mentions tuning says only "lower it". If captured layouts give a crossing share near the top of R2's range, P9 fails AC-38 and the plan gives no next step.
- **Evidence.**
  - Deviation 11 (PLAN.md:62): "55 s gives 0.51 to 0.58 crossings a minute ... against today's 0.57".
  - "lower it only when H9 on captured layouts passes" (PLAN.md:2000); I8's fallback "keep the 55 s cooldown" (:3033); R-10 "lowered only on captured layouts" (:3290).
  - P9's verification (:2906) and AC-38 (:3195) require "at or below today's".
  - [computed, `ac38b.mjs`: 10⁶ simulated visits with the plan's gap laws, durations and first delay, crossings counted over a visit's first two minutes]

    | Crossing share | At 55 s (a minute) | Smallest passing cooldown |
    |---|---|---|
    | today, 36% | 0.5755 (the bar) | |
    | 16% | 0.5178 | about 50 s |
    | 19% | **0.5785** (fails) | about 57 s |
    | 22% | **0.6325** | about 72 s |
    | 25% | **0.6806** | about 82 s |

- **Fix.**
  - State the rule. On captured layouts, set `crossingCooldown` to the smallest value, in 5 s steps, whose H9 rate is at or below today's over the same window, raising it as well as lowering it. Use the table above as a guide.
  - Or give AC-38 an explicit tolerance.
  - Change "lower it only" in 6.9, I8 and R-10 to match.

### C21. AC-15 and AC-1 can't be measured as written, and AC-15 fails on the real sky

- **Section.** AC-1, AC-2, AC-15; 7.1 (the debug patch); P6 verification.
- **Problem.**
  - The debug patch logs no per-star or per-band data, so "median on-screen speed" can't be measured with it.
  - With catalog-wide medians instead, AC-1's ratios are fixed at 1.67 and 1.98 and test nothing.
  - Measured on screen in the real seeded catalog, AC-15's near-median limit fails on common desktop sizes whenever the drift nears its peak, because the limit sits 0.5% above the catalog-wide design value. A correct P6 implementation would fail its own checklist. This is a residue of round 1's PHY-10 fix.
- **Evidence.**
  - The debug message is `{ type: 'debug-frame', time, camera, heading, rate, fps, k, js }` (PLAN.md:2551). P6 relies on it for "the per-band median speeds (AC-1, AC-2)" (:2814). AC-1 measures "Median on-screen speed" (:3158).
  - AC-15 (:3172) caps the near median at 0.47 v₀ "at any moment". The design value at the drift's peak is 0.9406 × 1.42 × 0.35 = 0.4675 v₀.
  - [computed, `h-real-sky.ts`: the real `cellStars` and `densityKeep`, loaded unchanged through the plan's 7.1 resolve hook on Node 24.14, scroll 0, camera at rest; nearness from each star's magnitude]

    | Viewport | Near stars on screen | Near median q | Near median at the drift's peak (limit 0.47 v₀) | Fails while the drift is faster than | Share of the time [`shares.mjs`, 6 h] | Mid/far ratio (AC-1 ≥ 1.6) |
    |---|---|---|---|---|---|---|
    | 1440 × 900 | 14 | 0.943 | 0.4688 | (passes by 0.3%) | | 1.659 |
    | 1920 × 1080 | 24 | 1.034 | **0.514** | 1.30 v₀ | 13.1% | 1.648 |
    | 1280 × 800 | 11 | 1.098 | **0.546** | 1.22 v₀ | 23.0% | 1.700 |
    | 2560 × 1440 | 47 | 0.977 | **0.485** | 1.37 v₀ | 4.7% | 1.665 |
    | 393 × 852 | 6 | 0.900 | 0.447 | (passes) | | 1.638 |

  - AC-1 passes on the real sky at these sizes, but only by 2 to 6%. For random skies of the same density, its on-screen mid/far ratio falls below 1.6 on 9% of 1440 × 900 screens and 21% of phone screens [computed, `ac1.mjs`].
- **Fix.**
  - Define AC-1, AC-2 and AC-15 as the catalog-wide band medians (H6, deterministic) times the camera speed the debug log records (add `speed` to `debug-frame`). Keep the on-screen view for the 60-second watch only.
  - Or add the per-band on-screen median q to the debug message and set on-screen limits with room for the sample. For random skies, the 99th percentile of the near median gives 0.60 v₀ at 1440 × 900 [computed, `tol.mjs`].
  - Either way, give the near-median limit real margin over 0.4675 v₀.

## Minor findings

### C22. The two "do it" steps have no design and miss a file

- **Section.** P6's recommended ADAPT fade; P4's twinkle clock; the P4 and P6 file lists.
- **Evidence.**
  - **The ADAPT fade** (PLAN.md:2811) is one sentence. It gives no state, no alpha formula and no frame demand for the 1 s fade, and R3 says only "Optional: fade the stars that step 1 thins out over about 1 s" (R3 line 538).
    - It changes `drawLayer`'s keep test (`renderSky.ts:113`) and `SkyFrame.keep` (`renderSky.ts:73-74`).
    - P6's files (PLAN.md:2800-2805) don't list `renderSky.ts`.
  - **The twinkle clock** (PLAN.md:1461-1465) adds `SkyFrame.twinkleTime` and changes `drawLayer`'s twinkle read (`renderSky.ts:63-87`, `:124`). P4's files (PLAN.md:2735-2744) list only the worker, `presence.ts`, `protocol.ts`, `mountSky.ts` and `config.ts`.
- **Fix.**
  - Add `renderSky.ts` to both file lists.
  - Sketch the fade:
    - a `thinnedAt` time;
    - `SkyFrame` carries the old and new keep and a fade level;
    - stars between the two keeps draw at alpha × (1 − smoothstep(thinnedAt, thinnedAt + 1, t));
    - `FADE_FRAMES` while it runs.

### C23. P9 leaves the fireball path, `radiantTries`, METEOR's inner docs and the shower probes undefined

- **Section.** 6.10 ("What the veil planner accepts", "Removed in P9", `pickVisitSky` step 3); P9.
- **Evidence.**
  - **Fireballs between P9 and P10.**
    - I2 replaces `meteors.ts:147-152` (PLAN.md:2297), which is where a fireball gets `fireballSpeedScale` and `fireballDuration` (`:148-149`).
    - The per-attempt 8% draw (`:135`) stays until P10 (PLAN.md:2918).
    - P9 doesn't say how a fireball attempt keeps its 1.8 to 2.5 s and its 0.6 speed on top of the aim.
    - At 4.7 launches a minute, 8% makes fireballs about 3.5 times as frequent as today (about one every 2.7 minutes) until P10, which is only a "should". P9's visible change (PLAN.md:2899-2904) doesn't mention it.
  - **`METEOR.radiantTries`** (`config.ts:252-253`: "Fresh radiants tried per launch when the current one leaves no path") appears nowhere in PLAN.md.
    - Today a launch tries up to 3 radiants, 1 on phones (`sky.worker.ts:209`).
    - P9 doesn't say whether a launch tries one aim or several, and it doesn't remove the key.
  - **Inner key docs.** The block doc is given (PLAN.md:2166), but these inner docs describe removed or moved keys: `config.ts:250` ("per radiant"), `:270-274` (`speedShare`, `speed`), `:283` (`narrowDuration`, `narrowSpeed`, `narrowLimit`), `:290` (`peak`) and `:305` (`trainSpeedShare`).
  - **Shower probes.** `pickVisitSky`'s "8 of 16 spawn-area probes" (PLAN.md:2236) doesn't say grid or random, or whether the `METEOR.top` clamp applies.
- **Fix.**
  - Give P9's interim fireball rule: the aim's direction, `fireballDuration` and the 0.6 speed scale. Either list the frequency change under P9's visible change, or move `METEOR_KINDS.fireball.chance` into P9 at today's 0.08.
  - Say how many aims a launch tries, and remove or redefine `radiantTries`.
  - Give the rewritten inner docs.
  - Fix the probes, for example a 4 × 4 grid over `spawnX` × `spawnY` with today's top clamp.

### C24. Verification lists that the phase can't satisfy

- **Section.** 8.7 (PF's verification); the P8 and P9 checklists; 5.4 and 7.0 (production builds).
- **Evidence.**
  - **PF.** Its verification (PLAN.md:3125) lists:
    - AC-37, AC-38 and AC-40;
    - "a meteor never stays lit over unquiet copy for more than `cancelFade` after a scroll".

    But PF's steps stop before P8 (PLAN.md:2992), and its item 2 says "P8 itself fixes it" (:3117).
  - **AC-37** requires "fireballs at 4% of launches, at least 120 s apart and none before 20 s" (PLAN.md:3194). P8 and P9 list AC-37 (:2878, :2909), but fireballs stay at today's 8% per attempt with no spacing until P10.
  - **Production builds** are required "at the end of phases that change the worker's module graph (P1, P3, P8)" (PLAN.md:408, :2500). But P2 (`camera.ts`), P4 (`presence.ts`), P9 (`radiants.ts`) and P11 (`satellites.ts`) also add modules to that graph (5.1).
- **Fix.**
  - Split PF's verification:
    - PF's own checks: AC-16 (a), AC-19 to AC-22 as today, and AC-30 with `inkKeep` 0;
    - P8's checks: AC-37's invariants, AC-38 and AC-40.
  - Tag AC-37's fireball clause "from P10".
  - List P2, P4, P9 and P11 for the build, or restate the criterion.

### C25. The visit memory resets on more events than R1 names

- **Section.** 4.3 (R1); 6.9 (`dropTransients`, `retryTransients`, `VisitMemory`); P10.
- **Evidence.**
  - R1 (PLAN.md:306) keeps a visit's sources until "a resize, a layout change or `TRANSIENTS.maxFailedPlans` failed plans". Its enforcement is "`VisitMemory` reset in `dropTransients`, `retryTransients` and the launch step".
  - `dropTransients` also runs when the tab hides (PLAN.md:1922-1923, :2056), which R1 doesn't list.
  - `retryTransients` "picks the visit's sky afresh" (:1924) with no condition. Today's `retryMeteors` acts only after `maxFailedPlans` (`sky.worker.ts:343`).
  - P10 keeps the last fireball's time in `VisitMemory` (PLAN.md:1812, :2917). So a resize, a layout change or a hidden tab would also clear the 120 s spacing that AC-37 and H7 require.
- **Fix.**
  - Reset `visit.sky` only, never the fireball time, and only on the events R1 names.
  - Say whether every layout message or only a changed layout re-picks the sky.

### C26. Gating and phase-statement gaps

- **Section.** P5's rollback; 3 (D10); PF.
- **Evidence.**
  - P5's rollback (PLAN.md:2794) says only "P6 must never ship without P5", but 7.0's gate also covers P4, which keeps the twinkle and shooting stars going (:2505).
  - D10's default (PLAN.md:175) says when to ask the user, not which answer the plan recommends at CP-4. 8.7 only implies one ("its fix is the better product").
  - PF (PLAN.md:2988-2993) has no visible-change statement. With `inkKeep` 0, meteors burning out behind copy add no light on the copy itself.
- **Fix.**
  - Revert P4 and P6, or set their switches, before reverting P5.
  - Give CP-4 a recommended answer and say what would change it.
  - Add PF's visible change.

### C27. Bloat grew, a copied number is wrong, and P1 and P3 lean on a superseded draft

- **Section.** Whole plan; the Check log; AC-2; 6.2 and 6.4 (the deferred bodies); 13.
- **Evidence.**
  - **Size.** PLAN.md has 49,368 words, up 17% from 42,060 in round 1 and above R1 to R4 together (about 46,700).
    - The check log alone is 1,745 words and restates all 70 dispositions, which `drafts/check-r1-*.md` and the workflow's record already hold.
  - **Repeated facts:**
    - the 55 s rationale, on 8 lines;
    - the snap-versus-fling explanation, on 8;
    - the APG `aria-pressed` rationale, on 6;
    - the 39% satellite figure, on 6.
  - **A wrong copy.** AC-2 (PLAN.md:3159) gives "0.85, 2.8 and 6.82 at the speed peak". But 0.85 and 2.8 are mean-speed medians (0.284 × 3 and 0.941 × 3). At the peak they are 1.21 and 4.01 px/s.
  - **Superseded draft.** P1's quiet index and P3's refresh estimate take their bodies from `drafts/plan-domain-model-first.md` (PLAN.md:1029, :1274). That is a superseded plan, and its surrounding text still quotes R1's phases (its 191 px bound, draft line 1264).
- **Fix.**
  - Give each number one home and cite it by ID elsewhere.
  - Turn the check log into a short table that links the check reports.
  - Correct AC-2.
  - Copy the two bodies (about 95 lines) into 6.2 and 6.4, which costs less than the duplicated prose removed and makes P1 and P3 self-contained.

## Checked with no finding

- **Structure.** All 13 sections the brief requires are present and substantive, and the Check log is there.
- **Settled defaults.** Every default is followed, or its deviation is listed and argued in 1.1 (deviations 1 to 13).
- **Decisions.** D1 to D11 each have a default and alternatives (D10's caveat in C26).
- **Config.** Every new constant has a value, units and a doc comment: `STAR_PHASES`, `DEPTH`, `CAMERA`, `DRIFT`, `PACING`, `FRAME.motionEase`, the scene levels, `TRANSIENTS`, `GapLaw`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR_KINDS`, `SATELLITE`, `LEAN`, and the `mountSky`, `quietIndex`, `renderSky` and `skyPause` constants. Both satellite tints exist (the palette has indices 0 to 7, `config.ts:94-102`).
- **P1 implementability.**
  - The painter, the index formula, `placePoint`, the snap rule, the cache and the harnesses are specified.
  - The quiet-index body exists in the domain-model draft and matches the plan's interface.
  - Phase-(0, 0) bytes match today's at seven ratios (`phase0.mjs`).
  - The 7.1 resolve hook loads the repository's TypeScript unchanged on Node 24.14 (used for `h-real-sky.ts`). It prints only a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning.
- **Rates.** The first-minute count is median 5, with 3 to 6 meteors in 90.1% of visits (`h9.mjs`), as H9 and AC-20 state.
- **Infrastructure.** `.claude/launch.json` has `autoPort: true` on master and in the worktree (7.0).
- **Navbar placement.** It works with `Navbar.tsx:88-131`: the auto margins put the control last in both rows, and the empty wrapper takes no space.
- **Style.** The plan has no em or en dashes. The sketches use tabs, single quotes and no semicolons.
