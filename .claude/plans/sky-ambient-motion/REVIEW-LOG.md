# Review log: home-sky ambient motion and transients

The check and audit history of `PLAN.md`, moved out of it on 2026-10-27 so the plan carries only what an implementer builds from. The reports behind each row are in `drafts/check-r<N>-*.md` and `audit/`.

## Check log

Rows here and in the Audit log record each round as it was: where a row and `PLAN.md` disagree, `PLAN.md` holds, and a later row names the change.

### Rounds 1 to 3

Twelve checker reports (`drafts/check-r1-*.md` to `drafts/check-r3-*.md`) raised 70, 36 and 25 findings: 4 blocking, then 26, 9 and 6 major. All were fixed (C17, C27 and C35 in part) and none was rejected. Their tables, with where each fix landed, are in `PLAN.md` as committed at 2e622a5. The veil reconciliation below superseded CA3-2's fallback, CA3-3, CG3-1's P9 layout call, CG3-5 and C33, and round 4 corrected the figures of PHY3-1 and PHY3-4 (PHY4-1, PHY4-4).

### Veil reconciliation (2026-10-27)

The plan was rebuilt on `COORDINATION.md`'s "Confirmed veil interface (2026-10-27)"; the main checkout's uncommitted `src/` was read only to confirm it. This superseded round 3's CA3-2 fallback, CA3-3 and CG3-1's P9 layout call, CG3-5's open pass shape, C33's synthetic bar and C34's I1 step in P8. Round 4 revised parts of it (I6 declined, the crossing bar a lower bound, the overlaps in 8.6).

| Area (sections) | Change |
|---|---|
| Status (1, D10, CP-1, CP-4, R-1, R-2) | The veil session is active and local; its commit lands once the user approves it; PF only if that work is abandoned. |
| Text class (4.2, 6.13, I5, 11) | `SkyRect.headroom`, `INK_BUDGET`, `inkBudget`, `budgetKeeps`; the "lease holders peak at 0.9 or less" rule is gone. |
| Scroll cancel (deviation 8, T1, T4, 6.9, P8, AC-40, H7, I3, PF) | `scrollKept` with `SCROLL_CANCEL` through one `transientFade`, the pause fade as `fade`; our threshold-plus-fade rule removed. |
| Quiet factors (T3, Q1, Q2, 6.4, 6.11, 6.12, H3) | Every transient draws through `transientQuietFactor` (replacing `clearSkyFactor`); the index stays exact under the one-pass `quietFactor`; `ZONE_REACH` derives from `QUIET_REACH` from V. |
| Planner (6.9, 6.10, E6, I1, I2, P9, P10) | The confirmed `planMeteor` options and private `planFlight`; our options extend `PlanOptions`; `PlanContext.nearCopy` and `ink`. |
| `drawMeteor` (6.9, I7, P8) | Its `fade = 1` is theirs; the wake tint stays ours (P9). |
| Worker (6.9, `VisitMemory`, `VisitSky`, H7, H8, 8.6) | `planMeteorTransient` ports `planLaunch`; a layout never clears the radiant or the visit's sky; `launchScrollY` joins the schedule. |
| Contrast (I5, PF, AC-30, 11) | The far-star case closed by `LAYERS.far.inkKeep` 0; PF sets it too. |
| AGENTS.md precondition (D1, 6.8, 8.6) | D1's quiet-root options keep no static translation and no opacity below 1 at rest; P5's line follows theirs. |
| Crossings (deviation 11, 6.9, AC-38, H9, R-10, 8.5) | The bar is the veil commit's rate, so the reveal starts the cooldown, and a null clear-sky plan never counts toward `maxFailedPlans` [computed: `veil-reconcile/cooldown-veil.mjs`, `cooldown-reveal.mjs`]. |
| Hotspots and requests (8.1, 8.3, 8.4, 8.6, CP-5, 12.2) | Rows follow "Changed shape"; I1, I3, I4, I5 and I7 answered, I2 ours, I8 in part. |

### Round 4

Four checkers (`drafts/check-r4-*.md`) raised 28 findings on the reconciled plan: 6 major, 22 minor, none blocking. All held and were fixed (C44 in part); none was rejected. The reviser re-ran the camera claims (`reviser-r4/camera-check2.mjs`), the type checks (`reviser-r4/tc/`, TypeScript 6.0.3) and the resolve hook (`reviser-r4/hook/`, Node 24.14).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY4-1 | physics-math | major | Fixed: C4, 6.1 and H5 state the zero-order hold (rates differ by up to 0.002 × H below the cap, 0.01 px after a capped stop; re-run 1.29, 1.65 and 2.65 px at H = 700, 900 and 1,440); round 3's "0.11 px" corrected. |
| PHY4-2 | physics-math | major | Fixed: AC-10's step bound applies where the refresh rate allows it, and a fast glide gets every refresh (4.18 device px at its start, re-run); F3, E4, `PACING`'s doc, P3's checklist. |
| PHY4-3 | physics-math | minor | Fixed with C39: the 0.30 to 0.46 bar is a pass-based lower bound (deviation 11, 6.9, H9, AC-38, R-10); V counts `nearCopy` for both planners and compares a reveal start with a first-crossing start; 55 s likely conservative. |
| PHY4-4 | physics-math | minor | Fixed: AC-39 and H5 hold 0.3 px up to H = 1,440, 2.0 × 10⁻⁴ × H taller (re-run 0.18 to 0.77 px, settled by 1.22 s); H5 adds one-step jumps. Superseded by PHY5-1 and PHY6-1. |
| PHY4-5 | physics-math | minor | Fixed: SP1 and 6.1 quote the bound, `maxLag` × H × 0.112 / 2e (4.6 px at H = 900), which a last-frame step back of the whole lag reaches at every rate (re-run); the per-rate figures depend on the sweep, so they aren't quoted. Superseded by PHY5-3. |
| PHY4-6 | physics-math | minor | Fixed: AC-7 and 6.1 (6.3 px at 24 minutes, 8.9 absolute), 6.9's five-minute parity (50 to 130 s), "3.4 times", 2.1's wake color. |
| CG4-1 | code-grounding | major | Fixed: `drawTransient` checks the destructured `kind` (re-run: compiles with one kind and two, fails without a case); the comment corrected. |
| CG4-2 | code-grounding | minor | Fixed: P8 step 3 is one commit with `drawTransient`, the renames and the README line. |
| CG4-3 | code-grounding | minor | Fixed with CA4-2: PF adds `contrastLevels()`, its planner ignores `ink`, and nothing exports `segmentTouches`. |
| CG4-4 | code-grounding | minor | Fixed: names seen only in their working tree are marked observed and rechecked in 8.5 step 2; 6.9 and 8.6 cover a cancel in the scroll handler; the port and H7 draw fresh radiants up front. |
| CG4-5 | code-grounding | minor | Fixed with CA4-3 and DRY-13: 8.6 lists `SceneLevels`, `SkyFrame`, the import lines and `easedQuietFactor`'s drop at the rebase; P2 leaves `LAYERS` to V. |
| CG4-6 | code-grounding | minor | Fixed: T3, AC-24, 6.11, P11 and H7 count from the frame the veil applies a layout. |
| CG4-7 | code-grounding | minor | Fixed with CONV-4: an `aria-label`, so D1's one quiet rect holds. |
| CG4-8 | code-grounding | minor | Fixed: 5.1's phase columns, the rename under `config.ts`, P11's rollback as 7.2's kill switch. |
| CA4-1 | coordination-a11y | major | Fixed with C36: section 1, 4.4 and 7.0 quote the file rule and state the reading; CP-0 asks for a yes before P1 edits their paths; on a file-by-file reading phases start at V; overlaps are requests listed in 8.6. |
| CA4-2 | coordination-a11y | major | Fixed: PF lists what it lacks (`INK_BUDGET`, the four-argument `veiledFrom`, `planLaunch`); 8.7 bounds veiled peaks at 1 (0.059 against 0.064, re-computed); H10, `METEOR_BRIGHTNESS`, `Course.peak`, AC-30 and section 11 follow. |
| CA4-3 | coordination-a11y | minor | Fixed: P2 leaves `LAYERS` to V (8.5 step 5); CP-0 names `LAYERS` and the adjacent edits. |
| CA4-4 | coordination-a11y | minor | Fixed with DRY-1: the comet keeps `scrollKept` unless the veil session agrees otherwise, never shows under reduced motion, and feeds `LaunchGate.cometShowing`; the planet re-baselines AC-26. |
| CA4-5 | coordination-a11y | minor | Fixed with CG4-7. |
| C36 | completeness | major | Fixed with CA4-1. |
| C37 | completeness | minor | Fixed: H7 and H10 in P9; B-9 in P9 and P11; B-10 in P1 and P6. |
| C38 | completeness | minor | Fixed: spec calls go through `launchKind<K>` and `movingOf<K>`, the push the one cast (re-run). |
| C39 | completeness | minor | Fixed with PHY4-3. |
| C40 | completeness | minor | Fixed: PF wires `scrollKept` into `updateMeteor` and `draw` with `contrastLevels()`; the comet's fallback is `scrollKept`. |
| C41 | completeness | minor | Fixed: "optional" dropped in 6.5 and AC-32; P10 reaches master with P9. |
| C42 | completeness | minor | Fixed with CG4-2 and CG4-8. |
| C43 | completeness | minor | Fixed with SOC-1: 7.1 specifies the real-worker rig for H13. |
| C44 | completeness | minor | Fixed in part: round 3's and the reconciliation's logs are tables; other cuts under DRY-14. |

### Round 5

Four checkers (`drafts/check-r5-*.md`) raised 17 findings on round 4's revision: 6 major, 11 minor, none blocking. All held and were fixed; none was rejected. C45 repeats CG5-1, and the gate audits' DRY-R5-1 and SOC5-1 repeat it again. The reviser re-ran the camera and pacing claims (`reviser-r5/ac39.mjs`, `reversal2.mjs`, `lean.mjs`).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY5-1 | physics-math | major | Fixed the second way: AC-39 and H5 keep the clock at the page's stop and state 2.8 × 10⁻⁴ × H at 0.7 s, settled by 1.2 s (1.3 s at H = 3,840); re-run worst 2.73 × 10⁻⁴ × H at 30 Hz (0.25, 0.39 and 0.70 px at H = 900, 1,440 and 2,560); H5's one-step jumps start from rest and land just after a frame. Its figures refined by PHY6-1. |
| PHY5-2 | physics-math | major | Fixed by stating the pacing the design has (re-run): 6.13 and P7 (every refresh above about 300 CSS px/s at DPR 2), AC-10 (1.05 device px at 1,200 px/s; about 2 under a cap), F3, E4, 10.2's pointer row, B-6 hands off; D3 offers a drift-paced lean. |
| PHY5-3 | physics-math | minor | Fixed: SP1 and 6.1 bound the reversal by `maxLag` × H × 0.112 / (e(2 − ω/2f)) (simulated 4.98, 4.81 and 4.69 px at H = 900), and the cap trims the sampled spring's excess (8% at 30 Hz) in one frame. |
| PHY5-4 | physics-math | minor | Fixed: 6.11 says about 33 px on a 1,440 px window, 0.023 × the longer side. |
| CG5-1 | code-grounding | major | Fixed: `demandNow` gathers first, so each tick and each `schedule` decide on fresh gates; "once per tick" reworded (4.2, DR2, F6, 5.1, 6.1, 6.2, 6.6); H13 case 1 gains the hero twin; P6 repeats P4's key-press check. |
| CG5-2 | code-grounding | minor | Fixed: `startArea` lands in P9 step 1, and `radiants.ts` imports it (5.2, the sketch). |
| CG5-3 | code-grounding | minor | Fixed: `init`'s chained assignment becomes `scrollY = message.scrollY` (6.9, P8's files and step 4). |
| CG5-4 | code-grounding | minor | Fixed: `bodies.ts` in 4.1, 4.2, 5.1 and 5.2; P12 in the `transients.ts` and worker rows; 6.2's table defers `gather` and the speed and cap lines to P6. P9's `transients.ts` line was dropped rather than P9 added (C49). |
| CA5-1 | coordination-a11y | major | Fixed: D10 gains the file-by-file trigger (the files outside their list prepared, or a week after CP-0's answer), which CP-4 and the V note cite; 8.5 step 4 redoes P0's baselines for P1, AC-26 and AC-35; 7.2's note; "Blocked on" in P1, P2, P3 and P5. |
| CA5-2 | coordination-a11y | minor | Fixed with C46: CP-0 and 8.6 list every pre-V `frameAt` edit (P1, P2, P4, P6). |
| CA5-3 | coordination-a11y | minor | Fixed: the comet's light is its fade-in × `scrollKept(…, boxFade)`, and it retires only when `scrollKept` reaches 0 (6.12, AC-25, P12). |
| C45 | completeness | major | Fixed with CG5-1. |
| C46 | completeness | major | Fixed: 4.4's decline clause holds P1 step 2, P2, P4, P6 and, through P2, P3 to P7, and brings D10's question early; P2's "Blocked on" names the `frameAt` yes. |
| C47 | completeness | minor | Fixed with CA5-1. |
| C48 | completeness | minor | Fixed: H4 in P5's and P6's verification, H5 and H13 in P8's, and their phase columns. |
| C49 | completeness | minor | Fixed with CG5-4 and SOC5-7; P3's `easing(layoutAt, …)` is today's inline test until P5 (6.2's table). |
| C50 | completeness | minor | Fixed: deviation 8, 6.9 and 8.7 say P8 never moves the cancel into the `scroll` handler, whose one P8 edit drops the `parallaxScroll` write. |

### Round 6

Four checkers (`drafts/check-r6-*.md`) raised 12 findings on round 5's revision: 1 major, 11 minor, none blocking. All held and were fixed; none was rejected. Some repeat each other, and the gate audits: CG6-1 and C51; CG6-2, C51 and CONV6-1; CA6-1 and C53; PHY6-3, CONV6-2 and SOC6-4. The reviser re-ran AC-39, the drift's turn rate and AC-20's counts (`reviser-r6/ac39.mjs`, `turnmean.mjs`, `ac20.mjs`).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY6-1 | physics-math | minor | Fixed: AC-39 gives the bound (0.25, 0.40 and 0.72 px) beside the computed worst (0.246, 0.393 and 0.699); AC-39 and H5 settle by 1.2 s up to H = 2,560 and 1.3 s up to 3,840 (re-run: 1.233 s from 2,880, 1.267 s at 3,840). |
| PHY6-2 | physics-math | minor | Fixed: AC-4 is per second of drift clock (the log over its `rate`), its mean 2°/s ± 0.2 over any 10 minutes; 6.1's table gives the windows (re-run: 1.39 to 2.35 over a minute, 1.93 to 2.05 over 10); H5 adds the 6-hour and 10-minute means. The first minute from the dusk re-runs at about 1.4°/s, not 1.5. |
| PHY6-3 | physics-math | minor | Fixed with CONV6-2 and SOC6-4: 6.9 writes `settled: now - lastScrollAt >= TRANSIENTS.scrollQuiet * 1000`, P8's files say the key is in seconds, and H13's case 7 runs the worker's launch gate in P8. |
| PHY6-4 | physics-math | minor | Fixed: AC-20 counts from the reveal, takes the median from H9's simulated visits and passes the browser on 3 to 6 in ≥ 8 of 10 runs (re-run: 93.1%; the 10-run median is 5 in 56%); H9 names the time base. |
| CG6-1 | code-grounding | minor | Fixed: `METEOR.fallbackScale` moves into P9 step 1, where `visitSteer` reads it. |
| CG6-2 | code-grounding | minor | Fixed with C51 and CONV6-1: P8 drops "`narrowLimit` per visit" from the narrow block's doc when the key moves (6.9, P8's files and step 3). |
| CA6-1 | coordination-a11y | major | Fixed with C53: on a file-by-file answer or a declined overlap, the waiting phases start at V or after PF (section 1, 4.4, 7.0, 7.2's map, note and P8 row, P1, P5); 8.7 runs them on the PF tree in 7.2's order before P8, on P0 baselines redone there; PF step 4 merges "PF, and P1 to P7 where built"; D10, CP-4, R-1 and P13's heading follow; 7.2's note drops the planet's exception. |
| CA6-2 | coordination-a11y | minor | Fixed: the comet's `scrollKept` fade is its box fade times a pause fade over `cancelFade`, so a pause fades it out and retires it like a transient (6.12, AC-25, P12). |
| C51 | completeness | minor | Fixed with CG6-1 and CG6-2. |
| C52 | completeness | minor | Fixed: 8.5 step 4 runs P1 step 3 first when only the `sameRects` move was declined, and 8.7 runs it after PF. |
| C53 | completeness | minor | Fixed with CA6-1. |
| C54 | completeness | minor | Fixed: P5 and 6.6 say `twinkleLevel` drops its `motion === 'full'` guard for the motion level; H13 case 3 checks the twinkle eases over several frames. |

### Round 7

Four checkers (`drafts/check-r7-*.md`) raised 18 findings on round 6's revision: 3 blocking, 3 major and 12 minor after the skeptics (CA7-2 calibrated from major to minor; CA7-3 confirmed in part). The blocking findings, with CG7-2, NJ7-1 and SOC7-1, are one gap: the veil session's answer 1 replaced "Changed shape" with a longer hands-off list (`frameMode`, `tick`, `SkyFrame`, `mountSky`, the import lines) that `PLAN.md` still called ours. All held and were fixed; none was rejected. The reviser re-ran AC-39's rate sweeps (`check-r7-physics/ac39sup.mjs`, `ac39int.mjs`), the halo half-side (`reviser-r7/edge.mjs`) and the cooldown on the landed numbers (`reviser-r7/cooldown-landed.mjs`, `cooldown-phone.mjs`). `PLAN.md` stays at 63,815 words.

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY7-1 | physics-math | minor | Fixed: AC-39 and H5's one-step jumps hold at the display rates browsers run (30, 48, 50, 60, 66.7, 72, 75, 90, 100, 120, 144 Hz), the worst at 30 and 48 Hz; AC-39 gives 3.6 × 10⁻⁴ × H and 1.25 s for other rates (re-run: 3.53 × 10⁻⁴ × H at 31.4 Hz, 1.231 s at H = 2,700). |
| CG7-1 | code-grounding | blocking | Fixed with CA7-1, C55 and SOC7-1: 4.4 adopts answer 1's list; `frameMode` and `tick` become a requested overlap (8.6, CP-0) whose resolution makes their `quietEasing(t)` `demandNow`'s quiet-ease term (6.2's sketch and table); 8.5 step 2 rechecks `quietEasing`; a decline holds P2 onward (4.4, 7.2, D10, CP-4). |
| CG7-2 | code-grounding | major | Fixed with NJ7-1: the same request covers `mountSky` (the same function, separate lines), `SkyFrame` (theirs only the `meteorInk` doc, per the skeptic) and the import lines; 8.6 lists each with what stays theirs; a decline holds the phases 4.4 names; P2's files add `tick`'s `updateCamera` call. |
| CG7-3 | code-grounding | minor | Fixed: 6.10 writes the whole train line, `dimFrom === 1 && (course.train \|\| fireball) && random() < METEOR.trainChance`. |
| CG7-4 | code-grounding | minor | Fixed: the comet's box test runs against `frame.quiet.to` and, while a layout waits, `next` (up to 128 rects): 6.12, AC-25, P12. |
| CG7-5 | code-grounding | minor | Fixed with SOC7-4: `allowed` keeps "a launch scene" (`scene !== null`), and 6.9 arms the sleeping timer only while `launchGate(now).allowed`. |
| CA7-1 | coordination-a11y | blocking | Fixed with CG7-1 and CG7-2: 8.1 edits listed symbols only as 8.6's overlaps; 8.6's intro and its `frameMode`, `SkyFrame` and `mountSky` rows rewritten; the worker's import lines join the request; 8.5 step 2 follows "their lines win"; CP-0 asks whether `tick` gains a line. |
| CA7-2 | coordination-a11y | minor (partly) | Fixed with C57 to C59: the answers recorded as settled; 8.6's `frameAt` row names answer 2's kept lines and P6's `gather`; P9 reports the rerun crossings to the user. Its `sameRects` point was already recorded; the row gains a clause. |
| CA7-3 | coordination-a11y | major (partly) | Fixed with C56: D12 (two at once is a look choice; default, keep the hold); T2, T3, 6.9 steps 2.2 and 2.3, 6.11, P11, H7, AC-24 and 8.7 follow; I9 answered. Per the skeptic, bursts and earthgrazers don't meet condition a by construction; being meteors, T7 already keeps them from a lease holder, so D12's alternative names satellites, and the comet keeps the hold. |
| CA7-4 | coordination-a11y | minor | Fixed: under PF the parallax keys and sentence go once both PF and P2 have landed (5.1, 6.1, P2, PF, 8.7 item 1). |
| CA7-5 | coordination-a11y | minor | Fixed: P12's comet files and 5.1's worker row add the comet's state, its pause time in the `motion` handler and its hand-off in `draw`. |
| C55 | completeness | blocking | Fixed with CG7-1; the decline branch includes P2, and one request covers every listed symbol (the skeptic's two gaps). |
| C56 | completeness | major | Fixed with CA7-3; D12 names satellites and the comet. |
| C57 | completeness | minor | Fixed: the file-by-file and declined `frameAt` or `sameRects` branches are deleted (section 1, 4.4, 7.0, 7.2, P0, P1, P5, P13, V, CP-0, CP-4, 8.5 step 4, 8.7, D10, R-1); CP-0 keeps the new request and the landing notice. P1 still waits for CP-0's answer, since it edits listed import lines and `SkyFrame`. |
| C58 | completeness | minor | Fixed: 6.12 and D4 record answer 4 (`scrollKept`; a scroll fade of its own only if it ends before unmarked copy at 852 × 393); CP-0's request 3 dropped; the comet's flag stays for D12 as `bodyShowing`. |
| C59 | completeness | minor | Fixed: T3, 6.11, H7, AC-24 and P11 test `to` and `next` from the frame a layout arrives (6.11's 33 px sentence dropped); 6.4 says the index ignores `next`, and H3 adds a `next` case; stale "observed" labels and handler-cancel hedges dropped; P9 reports to the user. |
| C60 | completeness | minor | Fixed: `EDGE`'s doc and AC-8 give 12 CSS px at DPR 0.25 and under 9.4 from DPR 1 (re-run: 12.000 and 9.333); SF2 and the guard read −32,768 to 32,767 (`-0x8000 <= cx, cy < 0x8000`). |
| C61 | completeness | minor | Fixed: `softwareFps` moves to P6 (P3's files and step 4), `cameraSpeed`'s `rate` to P6 and `updateCamera`'s `scene` to P7 (6.1, 6.2's table). |
| Answers fold | coordination | none | `COORDINATION.md`'s "Answers to the planning session's questions" folded in: the file rule settled (section 1, 4.4); the two overlaps agreed on their terms (8.6); answer 3 as D12 and T3; answer 4 in 6.12 and D4; `QuietBlend.next` final (T3, 6.4, H3); I9 answered (8.3); CP-0, D10, CP-4 and the Blocked-on lines updated. |
| Landed fold | coordination | none | "Landed in the working tree" folded in: the bar re-based on the `nearCopy` shares 60.6, 56.1 and 35.1% (0.97, 0.90 and 0.56 a minute), with GPU-canvas streak and glimmer shares for what visitors see; 6.9's table, deviation 11, H9, AC-38, R-10 and 8.5 step 5 recomputed (55 s meets every bar for P9 shares up to 0.6, the phone's included; a first-crossing start needs 1.5 to 2 times the length); I8 answered but for the SHA; H8, H9 and 8.5 step 5 use `harness/`; P9 reports to Joseph; the phone correction (2.2, the fallback doc, H9's clear-sky room); the one-frame dim at a layout change, noted once in 6.9; the launch hold as 12.2's question 2. Observed after the fold and not recorded in `PLAN.md`: a commit cf4d7b8 on the main checkout's local master (20:55, not pushed), whose diff from 246c0aa matches the archived `results/wt-final.diff` line for line; it awaits the landing notice. |

Refuted by the skeptics this round: none.

### Post-commit restructure (cf4d7b8)

The veil fix landed as cf4d7b8 (pushed, patch-id identical to the confirmed diff), so `PLAN.md` was rebuilt for a branch cut from `origin/master` at cf4d7b8: one tree, no wait, no fallback. Every `file:line` was re-grounded on `.claude/worktrees/sky-baseline-cf4d7b8` with a citation script, and `PLAN.md` went from 63,813 to 58,038 words. The pre-restructure copy is `PLAN.before-restructure.md` in the session scratchpad; the scripts are in its `restructure/` folder.

| Area (sections) | Change |
|---|---|
| Status and baseline (1, 4.4, 7.0) | The branch starts from `origin/master` at cf4d7b8 or later, each phase is a PR into `origin/master`, and the planning branch holds documents only. The file rule, the integration-branch route and the wait are gone; 4.4 is one paragraph pointing to 8.4. |
| The wait and the fallback (3, 7.3, 8, 12) | Removed: D10, D11 (satellites before the veil boundary), PF and 8.7, CP-0, CP-3 to CP-5 with CP-4's waiting rule, R-1, R-2, and open question 1 (the SHA); the remaining questions renumbered (11 now cites question 8). |
| Phase order (7.2, P0 to P13) | One dependency-ordered map with no "blocked on V" column; P8 depends on P3, P5 and P6 (`fadeOutAt`); P0 measures cf4d7b8 and sends nothing; the Blocked-on lines lose the overlap clauses; checkpoint V's subsection is gone. |
| Checkpoint V into the phases (8.1, P1, P2, P6, P7, P9, H2, H3) | The kill-switch identity is P1's check against cf4d7b8's render, rerun by P2, P6 and P7; P9 sets the crossing cooldown against the landed bars with the archived harness and reports to Joseph; H2 and H3 lose their V rows. |
| Coordination (8) | 8.1 "Baseline: the veil commit"; 8.2 keeps CP-1 (new sky commits on master) and CP-2; 8.3 a final-status table (I6 declined; I9 with its three conditions and the comet's `scrollKept` exception); 8.4 the veil symbols this plan uses or extends, under "use, extend through options, never rewrite; `veiledFrom` never changes", with the veil's three P9 asks. The stable-seams table, the CP-0 message, the V steps and the hotspot table are gone; their surviving facts sit in 6.x, 7.0, 8.4 and the phases. |
| Design text (5.1 to 5.3, 6.1, 6.2, 6.4, 6.7 to 6.10, 6.12, 6.13) | 5.1 drops its Owner column; P2 removes `LAYERS.*.parallax` itself; P1 defines `ZONE_REACH = QUIET_REACH - QUIET.padding`, moves `sameRects` with its `headroom` comparison and drops the unread `easedQuietFactor` import; 6.2's `quietEasing` row goes (`demandNow` uses it from P3); P8's `launches` doc keeps the veil's wording; every "after V", "from V", PF and "8.5"/"8.6"/"8.7" clause is gone. |
| Acceptance and risks (9.2, 11, 12.1) | AC-16 (b) moves to P3 and P6, AC-19 to P8 and P9; AC-25, AC-30 and AC-38 lose V; AC-30 and 11's 1.4.3 drop PF's flat-veil arithmetic; R-3, R-10 and R-20 rewritten for one tree. |
| Re-grounding (all) | Lines that moved: `sky.worker.ts` (for example `:469` to `:535`, `:116-133` to `:135-152`, `:401-427` to `:467-493`), `config.ts` (`:156` to `:171`, `:231-234` to `:247-250`), `meteors.ts` (I2's lines, now in `fit`, `:195-236`), `mountSky.ts` (`:149` to `:214`, `:261-268` to `:328-335`), `protocol.ts` (`:32-38`) and `drawMeteor`'s tint (`renderSky.ts:237`). F6's stale `sky.worker.ts:124` now reads `:143-144`; ambiguous bare refs made explicit (`skyAssets.ts:81-120` and `:26-27`, `sky.worker.ts:519`, `config.ts:170`, `components/styles.ts:7`). No "observed" marker was left; the comment rules drop the word. |
| Numbers (6.4, 6.9, AC-38) | Re-checked, none changed: the bars 0.97, 0.90 and 0.56 a minute and 6.9's settings reproduce from the landed shares (`cooldown-landed.mjs`, `cooldown-phone.mjs`); star quiet math on cf4d7b8's one-pass `quietFactor` costs within 10% of 246c0aa's, so R3's figures stand (`bench-quiet.mjs`); 7.1's hook loads cf4d7b8's modules (`ZONE_REACH` 40, `STAR_INK_PEAK` 0). |
| Outside `PLAN.md` | `harness/README.md` still cites "8.5 step 5" (now 8.1 and P9), and `HANDOFF.md` predates the restructure; both are left to their owners. |

### Round 8

Four checkers (`drafts/check-r8-*.md`) raised 16 findings on the restructured plan, grounded on cf4d7b8: 3 major, each confirmed by its skeptic (CA8-1, C62, C63), and 13 minor, which the reviser verified. All held and were fixed; none was rejected. The reviser re-ran the first-minute heading (`reviser-r8/heading.mjs`), the nine bars and 2560 × 1440's settings (`bars9.mjs`, `untabled.mjs`), the phone's cadence under the cooldown (`phone.mjs`) and the two type errors (`tc/`, tsc 6.0.3 `--strict`). `PLAN.md` went from 58,038 to 58,308 words: the three majors add the rail guard, the harness adaptation and the nine bars, offset by cutting duplicated text (8.1's restatement, 6.8's store list and hydration note, C4 and SP1's numbers, which 6.1 keeps, 5.2, 5.4, 10.1, section 1).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY8-1 | physics-math | minor | Fixed with C63. |
| PHY8-2 | physics-math | minor | Fixed: AC-16 (a) and (b) bound the alpha before the twinkle, measured with the hero's twinkle at 0 (cf4d7b8 `renderSky.ts:117-131`: the twinkle multiplies after the quiet factor). |
| PHY8-3 | physics-math | minor | Fixed: 2.2's phone row gives both cases (about every 22 s, mostly clear sky, while clear-sky paths fit; about once a minute, most dimming near copy, where none fits), and 6.9 adds the no-fit phone rate (re-run: 22.0 and 47.0 s, 19.0 and 67.2% near copy, 0.47 to 0.66 a minute at share 0.67, 0.68 at 0.7). |
| PHY8-4 | physics-math | minor | Fixed: 53.2 s (re-run: it leaves 30° of level at 53.20 s; the other headings and speeds reproduce). |
| CG8-1 | code-grounding | minor | Fixed: `scope.requestAnimationFrame?.(onFrame) ?? null`, `cancelFrames` cancels with `if (rafId !== null) scope.cancelAnimationFrame?.(rafId)`, and 6.2 says every call uses `?.` (TS2722 twice before, clean after). |
| CG8-2 | code-grounding | minor | Fixed with DRY-R8-1. |
| CG8-3 | code-grounding | minor | Fixed: the heading cites `:154-160` and `:167-209`. |
| CA8-1 | coordination-a11y | major (confirmed) | Fixed the first way: `PlanOptions.clearOf` (ours), which `fit` rejects within `QUIET.feather` (the `nearCopy: false` test); `SkyField.pinned` carries the padded rails from the launch gate (`screenQuietZones([], scrollY, pinned)`), and the meteor kind and farewell meteors pass it; the `METEOR` and `maxEndY` docs say what each guard keeps clear; H8 checks no accepted path within `ZONE_REACH` of a pinned zone on the nine layouts; 5.1, 6.9, 6.10, 6.12, P9, 8.3, 8.4 and section 11 follow. `copyReader`'s caveat then still holds, so the veil session needs only CP-2's note. |
| CA8-2 | coordination-a11y | minor | Fixed: AC-26 compares with P0's screenshots with the navbar masked from P5 on, and P5's verification says so. |
| CA8-3 | coordination-a11y | minor | Fixed: the comet's own fade is checked at the shortest viewport where its placement finds room, sweeping up from 393 px (the box's room recomputed: about 20, 43 and 165 px at 852 × 393, 932 × 430 and 1280 × 600); 6.12, D4 and I9. |
| CA8-4 | coordination-a11y | minor | Fixed with CONV8-4: 8.4's row adds P12's `launchScene`. |
| C62 | completeness | major (confirmed) | Fixed with the skeptic's amendments: P9's verification says how to adapt the archive (`transpile.mjs` at the implementing worktree; `lib.mjs`'s loaders and layouts with P9's modules and `pinned`; `METEOR_SPEC.plan` on a fresh `PlanContext` per launch for each `pickRadiant` and `planMeteor` pair; `sim2.mjs:28` dropped; the render scripts' frame fields; `launch` from `live/alib.mjs`; `run-batch.sh`, `harness/build.mjs` and the live runs unused) and names the rows reported to Joseph; H9 runs the real `updateTransients` on the nine layouts' fields. Outside `PLAN.md`, left to the planning session: archive `meteor3/code-logic/lib.mjs` and `meteor3/live-capture/lib.mjs` from the veil scratchpad while they last, and fix `harness/README.md`'s "8.5 step 5" and checkpoint V. |
| C63 | completeness | major (confirmed) | Fixed: 6.9 gives the bar for all nine layouts and the phone, adds a 2560 × 1440 row (45, 60, 75, 85, 95, 100 s) and says the layout needing the most sets the cooldown: 55 s meets every other bar for shares up to 0.6, 2560 × 1440's only up to 0.28; H9, AC-38 and R-10 follow (re-run: bar 0.412; 0.411 at 0.28, 0.419 at 0.29; the four untabled layouts need at most 50 s at 0.7). |
| C64 | completeness | minor | Fixed: CP-1 merges a sky commit on `origin/master`; one only on the local `master` waits until the user pushes it or says to include it. |
| C65 | completeness | minor | Fixed: section 6's intro states the rule and its three cases. |
| C66 | completeness | minor | Fixed with CONV8-4: 8.1's paragraph and bullets became one line. |
| Answers fold | coordination | none | Re-checked: `COORDINATION.md`'s answers, "Landed in the working tree" and "Committed: cf4d7b8" were already folded by round 7 and the restructure (sections 1 and 4.4, 8.1, 8.3, 8.4, T3, D12, 6.12, the Blocked-on lines); 8.6, D10 and CP-0 no longer exist. Only answer 4's check viewport changed (CA8-3). |

Refuted by the skeptics this round: none.

### Round 9

Four checkers (`drafts/check-r9-*.md`) raised 12 findings on round 8's revision: 3 major, each confirmed by its skeptic (PHY9-1, CG9-1, CA9-1), and 9 minor, which the reviser verified. All held and were fixed (C70 on `PLAN.md`'s side only); none was rejected. The reviser re-ran the phone's bar and P9's phone rates on an independent generator (`reviser-r9/phone-r9.mjs`: the veil commit's two phone launches give 0.94 to 0.98 crossings a minute; P9 at 55 s gives 0.51 to 0.52 where every clear-sky plan fits and 0.76 to 0.90 where none does, 0.50 at 60 s, and 0.95 to 1.0 at 50 s where none fits) and resolved every bare reference on a changed line (`reviser-r9/bare.mjs`). `PLAN.md` went from 58,308 to 58,867 words: the three majors add the phone's bar model, the pointer guard and the farewell band with its hold and check, offset by cutting duplicated text (6.9's lease paragraph and scroll-cancel sub-bullets, 6.10's `Steer` naming note and `nearCopy: false` sentence, 6.11's restatement of T3, the `drawMeteor` I7 restatement, 8.1's phase pointers, P9's fireball pointer, D4's comet condition, 4.2's frame-handle reasons).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY9-1 | physics-math | major (confirmed) | Fixed with the skeptic's amendment: 6.9's bar is what the veil commit flies (its `nearCopy` launches a minute, a null plan retried as its worker does), which H9 now measures with H7's oracle on the baseline tree. The desktop bars stand (share × about 1.6); the phone's is about 0.96, not 0.67, since the landed 67.3% counts planner attempts (a third plan nothing) and nearly every planned phone flight is `nearCopy`. 6.9 gives P9's phone rate by clear-sky fit, all under that bar, and drops the 0.66 and 0.68 that paired no fit with a share under 1; 2.2's phone row says nearly all dim near copy; AC-38 and H9 follow. |
| CG9-1 | code-grounding | major (confirmed) | Fixed: 6.13 sends nothing before the canvas's first size (`!size.width`, R3 §8) and clamps each axis to −1..1, and the worker's `pointer` case ignores a non-finite `at`; P7's files and verification follow. |
| CG9-2 | code-grounding | minor | Fixed: 6.10 says `meteorRange` reads `SKY_WINDOW.earthRadiusKm` and `meteorHeightKm` (`R2-meteors-bodies.md:619-620` read the old names). |
| CG9-3 | code-grounding | minor | Fixed: 6.6 declares `let presence = createPresence(0)`, today's values (cf4d7b8 `sky.worker.ts:57-58`), since `scroll` and `visible` reach `noteInput` before `init` (`:521`, `:533`). |
| CG9-4 | code-grounding | minor | Fixed: `config.ts:73` in 6.1 and `meteors.ts:226-228` in 6.10's rail paragraph; the third reference's sentence, which restated `clearOf`'s doc and cf4d7b8's `PlanOptions` doc, was cut. |
| CG9-5 | code-grounding | minor | Fixed with C69: P1's `renderSky.ts` bullet, 5.1 and 8.4 drop `SHAPE_COUNT` and the `STAR_SHAPES` import with the old sprite lookup (cf4d7b8 `renderSky.ts:13`, `:90`, `:127`). |
| CA9-1 | coordination-a11y | major (confirmed) | Fixed the first way, with the skeptic's amendment (the start area and the hold are required): farewell meteors fly only around Contact and the footer. Their `clearOf` adds the full width above the highest quiet zone in the page's flow less `ZONE_REACH`, their starts come from the band below it (a `starts` option, P12), and a field with no start area there holds the kind (`TransientSpec.room`, step 2.2). H7 and AC-20 gain a check on end-scene layouts P12 captures at 2560 × 1440 and 3840 × 2160 (no accepted path within `ZONE_REACH` of an unmarked text box), and the veil session hears of that copy. D4, 2.2's end row, T6, section 11's 1.4.3 row, 5.1, 8.4 and P12 follow; 2.2's reading row needed no change (skeptic). |
| CA9-2 | coordination-a11y | minor | Fixed with CONV9-2 (2) and DRY-R9-2: P9 points `copyReader`'s caveat at the planner's `clearOf` (6.10, P9's files, 5.1, 8.4's `mountSky.ts` row), and CP-2's P9 entry tells the veil session. |
| C67 | completeness | minor | Fixed: P9's adaptation runs the proto tree only (`TREES=proto`; `sim2.mjs`'s base rows dropped, since `walkBase` throws on cf4d7b8's `METEOR_VEIL`), takes the GPU rows from `check11/render3-canvas.mjs` at `FLIGHTS=200` and `SEED` 0 to 2 (`render3.mjs`'s software canvas leaves the list), and sets the fresh `PlanContext`'s `narrow` as `sim2.mjs:27` does; the report says each share is per launch attempt. |
| C68 | completeness | minor | Fixed: H8's acceptance bar (with `nearCopy` true, under 5% of launches failing every steer on each desktop layout, and on 390 × 844 no more than cf4d7b8's one-radiant 32.5%); H9 runs 20,000 visits per layout; P9 step 3 commits the value 6.9's rule gives from H9, searched from 55 s. |
| C69 | completeness | minor | Fixed: section 6's intro adds that names leave with their last reader (P1's `SHAPE_COUNT` and `STAR_SHAPES`, P3's `FrameMode`, P8's meteor imports, cf4d7b8 `sky.worker.ts:8-13`, `:24`). |
| C70 | completeness | minor | Fixed on `PLAN.md`'s side: P9's adaptation bullet says to follow its list rather than the README's run steps, and to set `live/alib.mjs`'s `PW` and `CHROME`. `harness/README.md` itself (its checkpoint V purpose line and step 3) is outside this role's files and stays with the planning session. |
| Answers fold | coordination | none | Re-checked: `COORDINATION.md` is unchanged since round 8 (last commit 6821c36), and no sky commit followed cf4d7b8 on `master` or `origin/master`; nothing new to fold. |

Refuted by the skeptics this round: none.

### Round 10

Four checkers (`drafts/check-r10-*.md`) raised 11 findings on round 9's revision: 2 major, each confirmed by its skeptic (PHY10-1, CA10-1), and 9 minor, which the reviser verified. All held and were fixed; none was rejected. The reviser re-ran the P9 prototype on the empty fields with the fallback's scaled minimum (`reviser-r10/empty-fields.txt`: 1440 × 900 unchanged; the phone's two steers fail 0.9% against 1.4%), recomputed five-minute parity on its own generator (`reviser-r10/fivemin-check.mjs`: at the two-minute settings P9 runs 18 to 40% over the veil commit at 1920 × 1080 and 28 to 42% at 2560 × 1440; parity needs 45 to 85 s and 75 to 120 s), and checked the archive's path constants (`lib.mjs:7-9`, `transpile.mjs:14-15`, `check11/render3-canvas.mjs:196`) against the veil scratchpad, which still exists. `PLAN.md` went from 58,867 to 59,704 words for 19 findings (with the gate round's): the two majors add the scaled fallback minimum and the on-screen farewell band, offset by cuts (deviation 8's restatement of T4, 6.10's color table and phone-radiant aside, 8.3's I9 restatement of T2 to T4, AC-25's and AC-38's restatements of 6.12 and 6.9, the `drawTransient` #30581 rationale).

| ID | Lens | Severity | Disposition |
|---|---|---|---|
| PHY10-1 | physics-math | major (confirmed) | Fixed the skeptic's way, in I2's existing `minPath` line: `planFlight`'s own minimum scales by `METEOR.fallbackScale` on the fallback pass (`course.minPath ?? minPath × (fallback ? METEOR.fallbackScale : 1)`: 102 and 70 px), so the steer never restates the planner's narrow choice; step 7, the `fallbackScale`, flight-block and `PassOptions` docs, 5.1 and P9's files and step 2 follow. H8 keeps its 5% bar, with the computed figures (at most about 1.5%, at 1024 × 768; 13 to 15% on the phone), and its empty phone failures read about 1%. |
| PHY10-2 | physics-math | minor | Fixed: 6.9 restores the window sentence (over five minutes, up to about 40% more crossings at 1920 × 1080 and 2560 × 1440; parity at 45 to 85 s and 75 to 120 s); E5 and R-10 name the window, R-10 now says "H9's rates"; P9's report gives H9's two- and five-minute rates beside the oracle's. |
| PHY10-3 | physics-math | minor | Fixed: P9 says 8% per candidate path (`meteors.ts:203`, clear sky only, `:228`), about one every 3 minutes at 1440 × 900, 8 times today's one every half hour (2.6% per launch in the archived batch); 7.0 says about 8 times. |
| PHY10-4 | physics-math | minor | Fixed: `METEOR_RATE`'s doc says about 120 times a dawn sky's rate, 500 times an evening's and 10 to 20 times a shower peak's (R2 §8.1, `R2-meteors-bodies.md:340`). |
| CG10-1 | code-grounding | minor | Fixed the first way: `frameDue` draws every animation frame at k = 1 (`k <= 1 ||`), as cf4d7b8's `tick` does in `'active'` mode (`sky.worker.ts:207`), and its doc says so; H13's case 0 and P3's trace check stand. |
| CG10-2 | code-grounding | minor | Fixed: "Removed in P9" lists `DEG` (`meteors.ts:77-78`; its only readers are `:209` and `:212`). |
| CG10-3 | code-grounding | minor | Fixed: `startArea` returns the unclamped box, `planFlight` keeps cf4d7b8's draw (`y = max(METEOR.top, between(random, y0, y1))`), and the probes raise y the same way; the usability test, "Everything else" and P9 step 2 follow. |
| CA10-1 | coordination-a11y | major (confirmed) | Fixed with the skeptic's refinements: the band's edge is the top of the highest in-flow zone on screen (`field.quiet` without `field.pinned`, `zone.y < height` and `zone.y + zone.height > 0`), and `room(field)` is false while none is; P12's capture holds every rect the worker receives, the hero's included; `clearOf`'s doc gains the farewell clause (P12), and 5.1 and P12's files follow. |
| CA10-2 | coordination-a11y | minor | Fixed, and closed further: `room(field)` is also false while the edge lies at or below `maxEndY` × height; starts run from the edge to the screen bottom across `spawnX`; D4 says they fly only in the last few hundred px on tall screens (169 at 2560 × 1440) and never at 3840 × 2160; `field()`'s doc changes with DRY-R10-2. Step 2.3 also lets a kind with a `room` test only retry a null plan, since partial room (47% of attempts null at 137 px left on 2560 × 1440) would still stop it after three, and scrolling posts no layout. |
| C71 | completeness | minor | Fixed: H5 gains the three kill-switch rows (P2, P6, P7); H2, P1, P2, P6 and P7 call those phases' reruns the renderer's zero-offset identity and keep "kill-switch identity" for `STAR_PHASES = 1`. |
| C72 | completeness | minor | Fixed: P9's bullet starts by extracting the archive into the implementing scratchpad, pointing `lib.mjs`'s `ROOT` and `transpile.mjs`'s `HERE` and `PLAN` at that copy, never at the veil scratchpad, and creating `live/out`; its list replaces README step 3 only. |
| Answers fold | coordination | none | Re-checked: `COORDINATION.md` is unchanged since 6821c36, and the local `master` and `origin/master` refs hold no sky commit after cf4d7b8; nothing new to fold. |

Refuted by the skeptics this round: none.

## Audit log

Four auditors (`audit/*.md`) checked the plan against the Next.js 16.4.2 docs, the codebase conventions, DRY and separation of concerns; a skeptic verified each finding. 40 findings, 5 major, 35 minor. For a "partly" verdict only the part that held was applied.

Refuted by the skeptics: none (each finding was confirmed or partly confirmed).

### Next.js docs (`audit/nextjs-docs.md`)

| ID | Severity | Skeptic | Disposition |
|---|---|---|---|
| NJ-1 | minor | partly | Fixed: P5 and AC-41 full-reload `/` before `get_errors` (no route) and the `get_logs` file, and `GET /` checks the server HTML; 5.4 and 7.0 say `get_errors` reads browser sessions. |
| NJ-2 | minor | partly | Fixed where the skeptic placed it: the last unsubscribe forgets the cached pause and any Play (6.8); deviation 7 and PB1 define a page view as one mount; H12 adds a remount case. |
| NJ-3 | minor | partly | Fixed: D5's Vitest option names the `@/` mapping and the `test` script, citing `testing/vitest.md`, with no React plugin, jsdom or Testing Library. |
| NJ-4 | minor | partly | Fixed: 5.4 says why not `next/dynamic`, a `useEffect` gate or `use(browser())`; 5.4 and 6.8 say both snapshots are null at hydration. |
| NJ-5 | minor | partly | Fixed: 5.2 cites `use-client.md:10` and `08-turbopack.md:482`; D1's quiet-root options use the host's entrance pattern or one inside the control. |

### Conventions (`audit/conventions.md`)

| ID | Severity | Skeptic | Disposition |
|---|---|---|---|
| CONV-1 | major | confirmed | Fixed: a 7.0 rule and section 6's intro make plan references in sketch comments notes to drop; the colliding invariants are now PR1, RD1 to RD3 and DR1 to DR3. |
| CONV-2 | major | confirmed | Fixed: `PACING.stepDevicePx`, `unalignedIntervalMs` and `unalignedToleranceMs`, with the doc, `motionFps`, the refresh estimate and F3. |
| CONV-3 | minor | partly | Fixed parts 1, 2 and 4: `registerHooks` (verified), the type-only import rule (5.2, 7.1), the Git Bash and PowerShell forms. Part 3 refuted; only a note on the flag that silences the once-per-run warning. |
| CONV-4 | minor | confirmed | Fixed: `aria-label`, section 11's 2.5.3 row, and the component renamed `SkyPauseButton`. |
| CONV-5 | minor | confirmed | Fixed: `Course`, `Steer` (`steer`, `visitSteer`), `createTransientSchedule`, `stepSpring`, `SkyFrame.offset`, `isIdle`, `cancelLevel`, `unhandled`. |
| CONV-6 | minor | confirmed | Fixed: 7.0 gives the conventional commit forms and the `motion` docs query. |
| CONV-7 | minor | partly | Fixed the four that held (`NAV_STAGGER`, `SkyFrame.time`, `sceneAt`, `mountSky`'s doc); `twinkleLevel`'s doc still holds. |
| CONV-8 | minor | confirmed | Fixed: D1 (a) puts the directive on the control's file; the hero stays a Server Component. |
| CONV-9 | minor | partly | Fixed: per-field docs on `Epicycle` and `GapLaw`, and `DRIFT` checked against a named `DriftConfig`; `SATELLITE` stays unchecked at its declaration, since `nextGap`'s `GapLaw` parameter checks its laws. |

### DRY (`audit/dry.md`)

| ID | Severity | Skeptic | Disposition |
|---|---|---|---|
| DRY-1 | major | confirmed | Fixed: the comet keeps `scrollKept` from the scroll where it starts to show, with the About-row guard at 0.4 viewport heights plus `SCROLL_CANCEL.to`, as the skeptic corrected; I9 and CP-0 ask rather than assume; D4 states the cost. |
| DRY-2 | minor | confirmed | Fixed: `quietIndex.ts` owns `ZONE_REACH`, `zoneReaches` and `segmentClear`; I6 declined, CP-0's request and PF's export dropped; Q2 narrowed to the buckets. |
| DRY-3 | minor | confirmed | Fixed: one tint rule; fast fireballs use `METEOR_LOOK.mintToWhite`. |
| DRY-4 | minor | confirmed | Fixed with SOC-3: `CLEAR_SKY_KEEPS`, picked once in `drawTransient`. |
| DRY-5 | minor | confirmed | Fixed: the point flash, bursts and earthgrazers are `METEOR_KINDS` variants decided in the meteor spec; the optional `busy` part skipped (two specs). |
| DRY-6 | minor | confirmed | Fixed: `Ease`, `easeAt`, `easing`, `easeEnded` in `pacing.ts` serve the motion ease and the thin fade; `settleQuiet` may adopt them after V. `Ease` and `easeAt` serve the motion level only since DRY-R5-2. |
| DRY-7 | minor | confirmed | Fixed with SOC-1: `gather` computes the drift's gate and the shared ambient flag and level once per tick; `narrowScreen` is set in `resize`. "Once per tick" superseded by CG5-1 and SOC6-1. |
| DRY-8 | minor | confirmed | Fixed as the skeptic corrected: one measurement per hidden stretch feeds `hiddenTotal` and today's `exitAt` rule. |
| DRY-9 | minor | confirmed | Fixed: `TransientSpec.nearCopy(body)`; `Planned` removed. |
| DRY-10 | minor | partly | Fixed the part that held: `DRIFT_REACH` and the computed far-band mean (0.293); no `cameraPoint`, and the box fade keeps `cancelFade`. |
| DRY-11 | minor | confirmed | Fixed: `METEOR.fallbackScale` (0.64) replaces `duration` and `fallbackDuration`. |
| DRY-12 | minor | confirmed | Fixed: `TransientOf` removed. |
| DRY-13 | minor | confirmed | Fixed: 8.6 holds the one list; 4.4 and CP-5 point to it; CP-0 adds `LAYERS` and the adjacent edits. |
| DRY-14 | minor | confirmed | Fixed in part: 0.294 corrected; deviations 6, 11 and 13, 6.10's veil rules and section 11's budget formula now cite instead of restating; round 3's and the reconciliation's logs are tables. The plan still grew with this round's design (about 64,000 words with the logs): further deduplication remains open. |

### Separation of concerns (`audit/separation-of-concerns.md`)

| ID | Severity | Skeptic | Disposition |
|---|---|---|---|
| SOC-1 | major | confirmed | Fixed: the drift's gate and rate (`camera.ts`), the frame mapping and the eases (`pacing.ts`) are pure, fed by one `gather` per tick; H4 tests the shipped mapping, H13 drives the real worker on 7.1's rig, as the skeptic required; 5.2 adds a worker size guard. The per-tick `gather` superseded by CG5-1 and SOC6-1, the guard by SOC5-6. |
| SOC-2 | major | confirmed | Fixed with the skeptic's caveats: `transients.ts` is kind-agnostic, the meteor kind is `meteorKind.ts`, `nextGap` is in the leaf `gaps.ts`, the visit's memory is keyed by kind family; `ink` and `sinceReveal` stay in `PlanContext` as facts any kind may read. Type-checked with both kinds and loaded under Node (`reviser-r4/design/`). |
| SOC-3 | minor | confirmed | Fixed: `TransientSpec.lease`, the envelope's `clearSky`, and `drawTransient` as the one place that picks the keeps; planning stays with each planner, as the skeptic noted. |
| SOC-4 | minor | confirmed | Fixed the skeptic's way: `renderSky.ts` owns the index at module scope, so `SkyFrame` stays data and `draw` gains no argument. |
| SOC-5 | minor | partly | Fixed the part that held: the probe grid comes from an exported `startArea`; the on-screen band stays. |
| SOC-6 | minor | confirmed | Fixed the cheap way: `METEOR`'s doc says its guards serve every transient, and `SkyField` aliases `MeteorField`. |
| SOC-7 | minor | confirmed | Fixed: P8 retires `parallaxScroll` (6.9, P8 step 4, 8.1), checked by H5 with the live scroll fed while paused. |
| SOC-8 | minor | partly | Fixed the skeptic's way: the comment corrected, and 6.8 says why one channel stays. |
| SOC-9 | minor | confirmed | Fixed: 5.2's statement-level `import type` rule for kind modules. |
| SOC-10 | minor | confirmed | Fixed: 4.4 names our `planFlight` edits after V. |
| SOC-11 | minor | confirmed | Fixed: the comet's model module, `bodies.ts` (6.12, P12). |
| SOC-12 | minor | confirmed | Fixed with DRY-12. |

### Gate round 5

The four auditors re-checked the revised plan (`audit/*-gate-r5.md`): 15 findings, 2 major, 13 minor. Each came to the reviser as a gate finding to verify; all held, two only in part.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| NJ5-1 | Next.js docs | minor | gate, verified | Fixed: section 13 cites `mcp.md:54` and `:88` for `get_errors` and `:55` for `get_logs`, which names a log file. |
| CONV5-1 | conventions | minor | gate, verified | Fixed: 7.0 and section 6 also drop wording about the two sessions' process; the `TRANSIENTS` and `METEOR_BRIGHTNESS` docs give their reason in words (PF's peak bound stays in 8.7). |
| CONV5-2 | conventions | minor | gate, verified | Fixed: `SKY_WINDOW.meteorHeightKm` and `earthRadiusKm`; `SATELLITE.angular`, with its docs. |
| CONV5-3 | conventions | minor | gate, verified | Fixed: the worker's `motionLevel`, `FrameState.cameraActive`, and the scroll-quiet key with DRY-R5-3. |
| DRY-R5-1 | DRY | major | gate, verified | Fixed with CG5-1. |
| DRY-R5-2 | DRY | minor | gate, partly | Fixed all six facts (8.7's wait, section 11's number, D4 citing 6.12, 6.1's `LAYERS` removal at V, `segmentClear`'s scope in 4.2, T3, 6.11, P11, PF, I6 and 8.7, `Ease`'s doc). The log move is outside this role, which edits only PLAN.md; instead rounds 1 to 3 collapse to a summary of the tables committed at 2e622a5. |
| DRY-R5-3 | DRY | minor | gate, verified | Fixed: P8 moves `FRAME.meteorScrollQuietMs` into `TRANSIENTS.scrollQuiet` (1.2 s), documented for every kind; `LaunchGate.settled` names it. |
| DRY-R5-4 | DRY | minor | gate, verified | Fixed with SOC5-3: 6.12's farewell row states the one-gate change (the gate reports the scene, the entry names it; T6, H7 and AC-20 then name it) and P12's files follow; D4 flags it. |
| SOC5-1 | separation of concerns | major | gate, verified | Fixed with CG5-1. |
| SOC5-2 | separation of concerns | minor | gate, verified | Fixed with CG5-2; the satellite sketch imports `METEOR`, `skyWindow` and `between`, and 5.2's cycle argument names modules that never import `transients.ts`. |
| SOC5-3 | separation of concerns | minor | gate, verified | Fixed with DRY-R5-4. |
| SOC5-4 | separation of concerns | minor | gate, partly | Fixed: `meteorKind.ts` exports `createMeteorMemory`, from which the schedule builds the visit's memory; P12 lists `transients.ts` for `clearSky(body)`. The optional `cometShowing` rename was skipped. |
| SOC5-5 | separation of concerns | minor | gate, verified | Fixed: H13's case 0 runs P2's and P3's workers on the rig in P3 (frame times, the stalled clock); the optional P8 run was skipped, since H7's oracle covers launches. |
| SOC5-6 | separation of concerns | minor | gate, verified | Fixed the second way: the guard is dropped, and 5.2, deviation 4 and 4.2 say the worker stays one file and why. |
| SOC5-7 | separation of concerns | minor | gate, verified | Fixed with CG5-4: a `SkyBody` row in 4.2, and `bodies.ts` in 4.1, 5.1 and 5.2. |

### Gate round 6

The four auditors re-checked round 5's revision (`audit/*-gate-r6.md`): 10 findings, all minor, none from the Next.js docs audit. Each came to the reviser as a gate finding to verify; all held.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| CONV6-1 | conventions | minor | gate, verified | Fixed: `heroLaunchMaxScroll`'s doc (6.7, P8) and the narrow block's (with CG6-2); P4 writes `SkyFrame.time`'s doc without a kind; 7.0 adds that a committed doc describes what its phase ships, and the phase that adds a kind or constant extends the docs naming it. |
| CONV6-2 | conventions | minor | gate, verified | Fixed with PHY6-3; the key stays in seconds, as the unit rule allows. |
| CONV6-3 | conventions | minor | gate, verified | Fixed: `FrameState.transientDemand`, and `TransientSpec.phones` in both specs and the launch step. |
| CONV6-4 | conventions | minor | gate, verified | Fixed: `LAYER_NEARNESS` destructures `[from, to]`, and `skyWindow` has a doc. |
| DRY-R6-1 | DRY | minor | gate, verified | Fixed: section 1 names P1 to P7 (with CA6-1's PF clause); the Check log opens with the rule that the body holds, and PHY4-4, PHY4-5, DRY-6, DRY-7 and SOC-1 name what superseded them. |
| DRY-R6-2 | DRY | minor | gate, verified | Fixed: `leanWanted(camera, lean, follow)` in `camera.ts`, shared by `stepCamera` and `demandNow`, with an H5 table; 5.1, 6.2, 6.13, P7 and H13 take the name. |
| SOC6-1 | separation of concerns | minor | gate, verified | Fixed: from P6 `frameAt` gathers first (6.1, `gather`'s doc, P6's files); H13's case 6 resizes after the idle sleep. |
| SOC6-2 | separation of concerns | minor | gate, verified | Fixed the first way: farewell meteors get their own registry entry; the gate reports the scene (`LaunchGate.scene`), each spec names its own (`TransientSpec.scene`), and step 2.2 holds a kind outside it (6.12, P12, 5.1, T6). |
| SOC6-3 | separation of concerns | minor | gate, verified | Fixed: `CameraInput.scroll`'s doc and 6.1's law say the followed scroll. |
| SOC6-4 | separation of concerns | minor | gate, verified | Fixed the first way, with PHY6-3: H13's case 7 runs the worker's launch gate in P8 (the scroll quiet, idle, past the hero, reduced motion). |

### Gate round 7

The four auditors re-checked round 6's revision (`audit/*-gate-r7.md`): 13 findings. SOC7-1 (blocking) and NJ7-1 (major) were confirmed by their skeptics; the 11 minor ones came to the reviser as gate findings to verify, and all held. The conventions audit passed with minor findings only. None was rejected, and the skeptics refuted none.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| NJ7-1 | Next.js docs | major | confirmed | Fixed with CG7-2: `mountSky` joins the CP-0 request and 8.6 ("the same function, separate lines"); 4.4's "Ours" moves the wiring into the overlaps; a decline holds P4, P5 (its store, control, icons and `Navbar.tsx` prepared), P7, P13 and, through 7.0's gate, P6. |
| CONV7-1 | conventions | minor | gate, verified | Fixed: 6.2's row reads "`transientDemand(transients, t)` in the transient line". |
| CONV7-2 | conventions | minor | gate, verified | Fixed the alternative way: a P12 kind that ships without P11 adds `CLEAR_SKY_KEEPS` itself (7.0); 7.2's P12 row and P11's rollback say so. |
| CONV7-3 | conventions | minor | gate, verified | Fixed with SOC7-4: P12's farewell files add `scene.ts` (`SceneLevels.launchScene` in place of `launches`), `SCENE.endLaunchLevel` and both specs' `scene`; 5.1's and 8.6's `scene.ts` rows add P12. |
| CONV7-4 | conventions | minor | gate, verified | Fixed with SOC7-2: `gather` in 8.6's `frameAt` row and CP-0's list. |
| CONV7-5 | conventions | minor | gate, verified | Fixed: "center" and "centered" in the ten sketch comments. |
| DRY-R7-1 | DRY | minor | gate, verified | Fixed: (a) with CONV7-4; (b) with CONV7-3, T6 naming the exception and H7 and AC-20 gaining it with the kind; (c) 8.1 names P6; (d) 1.1 cites `REVIEW-LOG.md`. |
| DRY-R7-2 | DRY | minor | gate, verified | Fixed with C57: the file-by-file copies are gone; 4.4 alone states the decline rule, and the rest cite it. |
| DRY-R7-3 | DRY | minor | gate, verified | Fixed the alternative way: `fadeOutAt(since, duration, t)` in `pacing.ts` (P6) is the one one-way fade (the thin fade, `transientFade`'s pause fade, the comet's box and pause fades), and `cancelLevel` goes; 6.9 says `cancelFade` is the pause's fade and the comet's box fade. |
| SOC7-1 | separation of concerns | blocking | confirmed | Fixed with CG7-1, CA7-1 and C55: one request with one reading covers every listed symbol (caveat a); 8.5 step 2's wording (b); `demandNow` takes their `quietEasing(t)` at V (d). |
| SOC7-2 | separation of concerns | minor | gate, verified | Fixed with CONV7-4. |
| SOC7-3 | separation of concerns | minor | gate, verified | Fixed in part: I9 answered; T3 states the never-lease contract (`to` and `next`, the radius bound); `LaunchGate.cometShowing` becomes the kind-agnostic `bodyShowing`. Dropping the hold is superseded by D12 (C56, CA7-3), which keeps it as the default look choice. |
| SOC7-4 | separation of concerns | minor | gate, verified | Fixed with CONV7-3 and CG7-5: `SATELLITE_SPEC.scene`, `SCENE.endLaunchLevel` beside `heroLaunchMaxScroll`, and the sleeping timer's guard named in 6.9. |

### Gate round 8

The four auditors re-checked the restructured plan (`audit/*-gate-r8.md`): 9 findings, all minor; the Next.js docs audit found none and passed. Each came to the reviser as a gate finding to verify; all held, SOC8-1 in part. None was rejected.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| CONV8-1 | conventions | minor | gate, verified | Fixed: the sketch keeps cf4d7b8's `PlanOptions` doc and elides its three fields ("exactly as cf4d7b8 has them, docs included"), sketching only `steer`, `clearOf` and `fireball`. |
| CONV8-2 | conventions | minor | gate, verified | Fixed: P3's `FRAME` sentence says "Anything that moves"; the `ADAPT` drift-cap sentence moves to P6; P4's idle docs say "ambient motion" and "nothing new launches", true from P4 on (as do `presence.ts`'s two docs, which named the drift and transients); `SkyMotion`'s `full` line grows from P5 to P8 (6.8; `protocol.ts` in P6's, P7's and P8's files; 5.1). |
| CONV8-3 | conventions | minor | gate, verified | Fixed: (1) P9 rewrites the fireballs' doc ("warm unless fast (mint)") and P10 moves it onto `fireballSpeedScale`; (2) the `MeteorMemory` and `planMeteorTransient` docs no longer name `planLaunch`; (3) "scroll parallax" leaves the `LAYERS` doc's list, which gains a sentence (6.1, 5.1, P2, 8.4). |
| CONV8-4 | conventions | minor | gate, verified | Fixed with CA8-4 and C66. |
| DRY-R8-1 | DRY | minor | gate, verified | Fixed the first way: `easing` and `easeEnded` take `number \| null` and are false while null, one "not begun" convention with `fadeOutAt`, so P6 passes `thinnedAt` to all three; H4 adds the null case (TS2345 twice before, clean after; `fadeOutAt(-Infinity, …)` is NaN, so no −Infinity start). |
| DRY-R8-2 | DRY | minor | gate, verified | Fixed: `LaunchGate.narrow` is documented and filled from `narrowScreen`, whose doc names its two readers; P8 depends on P6 for it (7.2, P8). |
| DRY-R8-3 | DRY | minor | gate, verified | Fixed with SOC8-2: 6.6 drops "`settleQuiet` may adopt it"; 8.4's row lists R-20's cache inside `quietBlend` as its one exception, and R-20 cites it. |
| SOC8-1 | separation of concerns | minor | gate, partly | Fixed the rollback notes from 7.2's graph: P3 "every later phase", P4 "P6 and every later phase", P5 "P4 and every later phase", P6 "every later phase, P8 through `narrowScreen` and `fadeOutAt`"; 7.2 and P8 add P4. Not applied: moving `fadeOutAt` to P5, which has no reader for it (section 6's first-reader rule), while P8 would still need P6's `narrowScreen` (DRY-R8-2). |
| SOC8-2 | separation of concerns | minor | gate, verified | Fixed with DRY-R8-3. |

Refuted by the skeptics this round: none.

### Gate round 9

The four auditors re-checked round 8's revision (`audit/*-gate-r9.md`): 8 findings, all minor; the Next.js docs audit found none and passed. Each came to the reviser as a gate finding to verify; all held, and none was rejected.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| CONV9-1 | conventions | minor | gate, verified | Fixed: the seven docs say the reason in words, without the name their phase removes: `QuietIndex.empty`, `frameDemand` (the identity with the old `frameMode` stays in H4), `holdTransients`, `retryTransients`, `SKY_WINDOW` ("a nominal speed of 0.2 long sides a second"), `METEOR_BRIGHTNESS` ("about 0.5": 0.6 × cf4d7b8's mean peak 0.825) and `PlanOptions.steer`. |
| CONV9-2 | conventions | minor | gate, verified | Fixed: (1) 6.10 gives P9's `PassOptions` and `planFlight` docs and P10's changes to them, named in P9's and P10's `meteors.ts` lines and 8.4's row; (2) with CA9-2; (3) `LaunchGate.narrow` reads "limit (P8) and gaps (P9)". |
| CONV9-3 | conventions | minor | gate, verified | Fixed with CG9-4. |
| DRY-R9-1 | DRY | minor | gate, verified | Fixed: `launchGate(now)` refills one reused gate, and `LaunchGate.field()` builds the field only when step 2.3 plans, as cf4d7b8 builds it only past its due check and holds (`sky.worker.ts:220-226`); from P9 the rails are padded once for `quiet` and `pinned`; the sleeping timer reads `meteorsAllowed(now)`, the gate's `allowed` test. R-20 needs no new row. |
| DRY-R9-2 | DRY | minor | gate, verified | Fixed with CA9-2; `planMeteor`'s doc says "clear of the copy in `clearOf`" in place of "above the side rails", and `clearOf`'s doc stays the one full statement of the rule. |
| DRY-R9-3 | DRY | minor | gate, verified | Fixed with CG9-4. |
| SOC9-1 | separation of concerns | minor | gate, verified | Fixed: `transients.ts` exports `leaseHeld(schedule)`, which `inkLeaseFree` and step 2.2's D12 test read; `bodies.ts` owns the comet's start rule as a pure function over facts the worker gathers (6.12, 5.1, P12's files); P12's step 1 checks that the comet never starts while `leaseHeld` and that no lease begins while it shows; 5.2 adds `./catalog` for `nearness`. |
| SOC9-2 | separation of concerns | minor | gate, verified | Fixed: 8.4's rule names P3's `tick`; its rows list `SkyFrame` whole with P1, P2, P4, P6, P8, P9, P11 and P12 (as 5.1 does), `tick` with P2, P3, P5, P6 and P8, and `frameAt` and `draw` with P1 to P8 and P12 (the comet's hand-off). |

Refuted by the skeptics this round: none.

### Gate round 10

The four auditors re-checked round 9's revision (`audit/*-gate-r10.md`): 8 findings, all minor; every audit passed. Each came to the reviser as a gate finding to verify; all held, and none was rejected.

| ID | Audit | Severity | Skeptic | Disposition |
|---|---|---|---|---|
| NJ10-1 | Next.js docs | minor | gate, verified | Fixed: P13's loop cancels its pending frame in `destroy`, as P7's does (cf4d7b8 `mountSky.ts:316-326` terminates the worker, which can then never turn the relay off); 6.13, 5.1 and P13's files follow, and P13's verification adds the `/links`, View Full Portfolio, Back trace. |
| CONV10-1 | conventions | minor | gate, verified | Fixed: P8 renames `meteorsAllowed` `launchesAllowed`, documented for transients, and words `reveal`'s doc, the `motion` case's comment and `noteInput`'s doc for transients (6.9, P8's files and step 3, 5.1); P4's mentions keep the old name. |
| CONV10-2 | conventions | minor | gate, verified | Fixed the second way: 7.0's sentence says which phase adds what to the earlier docs (P5 the motion ease, P6 the drift, its caps, the thin fade and `gather`, P7 the lean and the pointer ping, P8 every kind, P11 satellites), replacing its P11-only list; `FrameState.transientDemand` gets a doc of its own and P3's text, and `STAR_PHASES` drops "as before the drift". |
| DRY-R10-1 | DRY | minor | gate, verified | Fixed: AC-20 cites H9's bar (about 90% by design) and gives the browser pass rate at 90% and at H9's 85% floor (93% and 82%, binomial). |
| DRY-R10-2 | DRY | minor | gate, verified | Fixed: (a) step 2.2 builds the field once for a due kind past its other holds and hands it to `room` and the plan; `field()`'s doc and the worker bullet follow; (b) the farewell spec calls `planMeteorTransient(context, { clearOf, starts })`, an optional second argument, and is never a fireball, since P10's decision is the meteor spec's (6.12, 5.1, P12's files); (c) with CA10-1. |
| SOC10-1 | separation of concerns | minor | gate, verified | Fixed: the comet's start rule reads the launch gate (`allowed`, `settled`, `!narrow`, `sinceReveal` past a first delay of its own) plus the visit's draw and `leaseHeld`; a resize retires it, a hidden tab keeps it on `twinkleTime`'s clock, and `demandNow`'s `fading` covers its fade-in (6.12, 4.2, 5.1, P12's files and step 1, AC-25, trimmed to cite 6.12). |
| SOC10-2 | separation of concerns | minor | gate, verified | Fixed: `TransientSpec.limit` (2 for farewell meteors) and `TransientSchedule.kindLaunches`, held in step 2.2 beside `launched`; T6, 5.1, 6.12 and P12's files name them. |
| SOC10-3 | separation of concerns | minor | gate, verified | Fixed: 4.1 puts `sameRects` in the veil column ("moved in P1"); 8.4's `sameRects` row adds the worker's imports (P1 to P8, P12). |

Refuted by the skeptics this round: none.
