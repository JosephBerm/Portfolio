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
