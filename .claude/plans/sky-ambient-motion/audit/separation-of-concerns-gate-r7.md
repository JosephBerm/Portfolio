# Separation of concerns: gate round 7

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 7. I check that round 6's four SoC fixes landed, look for regressions they introduced, and sweep the rest of `PLAN.md` through this lens. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as revised after round 6 (3,819 lines, saved 20:10).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, the round-6 rows of `REVIEW-LOG.md`, and my round-6 report.
  - `COORDINATION.md`, all of it. Commit 4606c23 (20:14, after `PLAN.md`'s last save) added "Answers to the planning session's questions (2026-10-27)". The task makes those answers authoritative, and they say they supersede `PLAN.md`'s either-or branches.
  - The worktree code (master 246c0aa), and the main checkout's uncommitted veil edits, read only through `git diff`.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker, main-thread DOM in `mountSky`, and React UI in the control;
  - the protocol as the only contract between threads;
  - the scheduler, kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the ownership split with the veil session (its exports only, never its internals);
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or the main checkout. One throwaway script lives in the scratch folder (`soc-gate-r7/handsoff.mjs`). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files, all of `PLAN.md`, the round-6 rows of `REVIEW-LOG.md` and my round-6 report.
2. Checked each round-6 SoC disposition against the revised text (table below), and traced each fix's new readers and writers for regressions.
3. The worktree's HEAD turned out newer than the task's snapshot (4606c23), so I re-read `COORDINATION.md` and read its answers section against every place `PLAN.md` decides ownership: 4.4, 7.2, the phases' "Blocked on" lines, 8.4 (CP-0), 8.5 step 2, 8.6 and the I9 machinery.
4. Grounded the veil's side in its working copy with `git diff` in the main checkout (read only): `sky.worker.ts`, `mountSky.ts`, `renderSky.ts`, `scene.ts`, `protocol.ts`, `config.ts` and `AGENTS.md`.
5. Ran `soc-gate-r7/handsoff.mjs` on Node 24.14: for each symbol on the answer's hands-off list, the lines of P1 to P7 (the phases planned before V) that name it.

## Round 6's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC6-1 | Yes | `frameAt` gathers first from P6 (922), stated in 6.1 (865) and in `gather`'s doc (885 to 887), listed in P6's files (3188) and checked by H13's case 6 (2948). No ordering hazard: `init` sets presence and the motion level before `resize` and `probeRaster` draw (`sky.worker.ts:420-425`), and `gather` gives the same values for one `now`, so `stepDown`'s nested draw is harmless. Residue: SOC7-2. |
| SOC6-2 | Yes, with gaps | Farewell meteors get their own registry entry, `LaunchGate.scene`, `TransientSpec.scene` and step 2.2's hold (6.12 at 2790, P12 at 3364, 5.1 at 360 and 368, T6 at 312). Residue: SOC7-4. |
| SOC6-3 | Yes | `Camera.scroll` (638), `CameraInput.scroll` (658) and 6.1's law (442) say "the followed scroll". |
| SOC6-4 | Yes | H13's case 7 runs the worker's launch gate in P8 (2948, 3269); 6.9 writes `TRANSIENTS.scrollQuiet * 1000` (2366); P8's files name the units (3250). |

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC7-1 | blocking | The veil's answered file rule puts `frameMode` and `tick` on its hands-off list, but P3 replaces both before V and 8.6 says the veil touches neither |
| SOC7-2 | minor | Round 6's `gather` call in `frameAt` is missing from 8.6's `frameAt` row and CP-0's list of our `frameAt` edits |
| SOC7-3 | minor | I9 is answered, so the fallback's cross-kind rule and `LaunchGate.cometShowing` are dead coupling, and T3 lacks the answer's conditions |
| SOC7-4 | minor | The farewell scene report changes `scene.ts` and `satellites.ts`, which P12 and 5.1 don't list; 0.9 has no config home; the sleeping timer's guard is unsaid |

### SOC7-1 (blocking): `frameMode` and `tick` are hands-off before V, and P3 replaces them

**Section.** 4.4 (the file rule, "Requested overlaps"); 6.1 (the `tick` bullet, P2's `frameMode` line); 6.2 ("The worker's demand", "The worker's mechanism", the phase table); 7.2 (P2 and P3: "Blocked on the veil? no"); the files of P2, P3, P5 and P6; 8.4 (CP-0); 8.5 step 2; 8.6 (its opening, row 1, the `mountSky.ts` and `SkyFrame` rows).

**Problem.**

- **The rule is now settled, and stricter than 8.6 assumes.** The answers make the file rule symbol-level:
  - other lines of the same files may change on our branch, and the veil's lines win at the rebase;
  - its symbols are not reformatted, reordered or moved before the rebase;
  - its list of symbols with changed lines "replaces the shorter 'Changed shape' list above as the hands-off list";
  - only the `frameAt` and `sameRects` overlaps are agreed.
- **The new list names `frameMode` and `tick`**, with `draw`, `rebuildHaze`, `quietEasing`, `mountSky` and `SkyFrame`. Their working copy shows why for `frameMode`: a new worker-private `quietEasing(t)` is now its fade test.
- **`PLAN.md` still keys on "Changed shape".**
  - 4.4 edits nothing on "Changed shape" before V except 8.6's overlaps.
  - 8.6 opens with "Before V, only `frameAt` and `sameRects` are changed by both", and its first row gives theirs for `frameMode`, `schedule`, `tick`, `onFrame`, `onTimer` and `cancelFrames` as "none".
  - CP-0 asks for those two overlaps only.
- **So phases planned before V edit hands-off symbols with no agreed overlap.**
  - P3 deletes `frameMode` for `demandNow` and rewrites `tick`. That moves their symbols before the rebase, which the answer rules out on any reading, and at the rebase it meets their changed fade line as a modify-and-delete conflict. 7.2 marks P3 "no" for the veil.
  - P2 adds an `'active'` line to `frameMode` and an `updateCamera` call to `tick`; P5 adds `easeEnded` to `tick`; P6 adds `gather` to `tick`.
- **The rebase rule disagrees too.** 8.5 step 2 says that in a function we rewrote "ours wins on structure". The answer says its lines win, except where an overlap was agreed (for `frameAt`: keep both).
- **Smaller drift in the same rows.**
  - P4, P5 and P7 edit inside the function `mountSky`, which is now listed (their change there is `headrooms` and `measureLayout`'s reader), but 8.6 calls the two sides "different functions".
  - P1, P2, P4 and P6 add `SkyFrame` fields, also listed.
  - Both are "other lines" under the answer's first rule, but 8.6 should say so.
- **One test, two definitions after V.** The quiet ease would then be decided by their `quietEasing(t)` (in `settleQuiet`, the layout handler and `rebuildHaze`) and by P5's `easing(layoutAt, QUIET.ease, t)` in `demandNow` (6.2's table). If they ever diverge (a pending layout counted as easing, say), the frame decision and `settleQuiet` disagree about when the worker may sleep.

**Evidence.**

- `COORDINATION.md`:
  - 140: the answers are authoritative and supersede the plan's either-or branches;
  - 148 to 153: the rule, and the list that "replaces the shorter 'Changed shape' list above as the hands-off list";
  - 176, 177 to 183 and 184: `SkyFrame`; `frameMode`, `tick`, `draw`, `rebuildHaze` and `quietEasing`; `mountSky`;
  - 187 to 189: yes to `frameAt` and `sameRects` only;
  - 216: `quietEasing(t)` serves `frameMode`, `settleQuiet`, the layout handler and `rebuildHaze`.
- Main checkout, read only:
  - `sky.worker.ts:131-133` (`quietEasing`) and `:142` (`frameMode`'s fade test is now `quietEasing(t)`);
  - `tick`'s own body has no changed line yet (its diff hunk only starts inside it), but the list is authoritative and the `frameMode` line is real;
  - the `mountSky.ts` diff changes `mountSky` itself (`headrooms`, `measureLayout`'s reader).
- `PLAN.md` lines:
  - 322 and 341 (4.4);
  - 920 and 926 (6.1);
  - 1218, 1260 and 1280 (6.2);
  - 1719 (6.6, `easeEnded` in `tick`);
  - 2973 and 2974 (7.2);
  - 3060, 3092, 3099, 3153 and 3188 (P2, P3, P5, P6);
  - 3448 (CP-0), 3484 (8.5 step 2);
  - 3500, 3504 and 3521 (8.6).
- Scratch `soc-gate-r7/handsoff.mjs`:
  - `frameMode` in P2 (3060) and P3 (3098);
  - `tick` in P3 (3092, 3099) and P6 (3188);
  - `mountSky` in P4 (3119, 3130), P5 (3149, 3158) and P7 (3224, 3228);
  - `SkyFrame` in P1, P2, P4 and P6;
  - no phase before V names `draw`, `rebuildHaze`, `quietEasing`, `settleQuiet`, `applyLayout`, `quietBlend` or `pendingLayout`.
- New evidence, not a re-raise: round 5's coordination check found `frameMode` and `tick` untouched in their tree (`drafts/check-r5-coordination-a11y.md:149`), and no earlier report mentions `quietEasing`.

**Fix.**

1. 4.4 adopts the answer's list as the hands-off list, with its three rules, and points at `COORDINATION.md` for it (CP-5 re-checks it against the landed `git diff` list). It drops the file-by-file and declined-overlap branches, which the answers close (section 1, 4.4, 7.0, 7.2's note, P1, P5, 8.5 step 4, 8.7, D10, CP-4, R-1).
2. Ask the veil session for a third overlap now, as the planning session asked the five:
   - **ours:** P2's `'active'` line in `frameMode` and its `updateCamera` call in `tick`; P3's replacement of `frameMode` by `demandNow` and its rewrite of `tick`; P5's `easeEnded` and P6's `gather` lines in `tick`. `schedule`, `onFrame`, `onTimer`, `cancelFrames` and `frameInterval` are not on their list;
   - **theirs:** `frameMode`'s fade test;
   - **resolution at V:** `demandNow`'s `fading` line calls their `quietEasing(t)` in place of `easing(layoutAt, QUIET.ease, t)` (6.2's table says so), and `tick` keeps calling `settleQuiet` before the frame decision.
3. 8.6: the opening names three overlaps once agreed; row 1 gets that "theirs" and that resolution; the `mountSky.ts` and `SkyFrame` rows say our edits are other lines of their listed symbols (never `measureLayout` or `headrooms`). 8.5 step 2 says that an agreed overlap keeps both.
4. Until the yes, P2's `frameMode` and `tick` lines and P3 onward wait, exactly as a declined `frameAt` overlap holds them today (7.2's note, P2's and P3's "Blocked on"), so D10's question comes early on a no. CP-0 records the two answered overlaps as agreed rather than asking again.

### SOC7-2 (minor): round 6's `gather` line in `frameAt` is missing from the overlap list

**Section.** 8.6 (the `frameAt` row); 8.4 (CP-0's overlap paragraph).

**Problem.** Round 6's fix makes `frameAt` call `gather(now, scene)` from P6. 8.6 is "the one list of what both plans touch", and round 5 (CA5-2) required it and CP-0 to list every `frameAt` edit made before V. Both list `snap`, `offset`, `twinkleTime`, `thinFrom`, `thinLevel` and the `keep` line, not the `gather` call. The veil agreed to the overlap on the lines we described, and keeping both at the rebase still works, but the list we gave them is one line short.

**Evidence.**

- `PLAN.md` lines 922 and 3188 (the call, from P6), 3448 (CP-0) and 3505 (8.6).
- `REVIEW-LOG.md`, CA5-2: "CP-0 and 8.6 list every pre-V `frameAt` edit".
- `COORDINATION.md` 188: the veil's terms for the `frameAt` overlap.

**Fix.** Add "`gather` (P6)" to 8.6's `frameAt` row and to CP-0's list of our `frameAt` edits, or to the note that asks for SOC7-1's third overlap.

### SOC7-3 (minor): I9 is answered, so its fallback is dead coupling in the scheduler

**Section.** 4.3 (T2, T3); 6.9 (steps 2.2 and 2.3); 6.12 (the comet row); 5.1 (the `transients.ts` and worker rows); P11's and P12's files; H7; 8.3 (I9); 8.7 step 4; 12.2 question 2.

**Problem.**

- **The answer.** Never-lease kinds may overlap a lease holder on three conditions:
  - (a) no light inside any padded rect over the kind's whole drawn footprint, glow included, on every frame, checked against `blend.to` and `blend.next`. This holds by construction for a kind drawn through `transientQuietFactor` with zero keeps at its centre, whose drawn radius stays at or under `QUIET.padding` (32 px);
  - (b) a moving kind takes `scrollKept` from its own launch;
  - (c) anything that lights quiet copy takes the lease.
- **Satellites meet all three as planned.**
  - Their star sprite's half-side is at most 9 CSS px (6.5).
  - `drawSatellite` multiplies by `transientQuietFactor` with `CLEAR_SKY_KEEPS` at its drawn position every frame (6.11), and that factor already covers `next` (their `scene.ts:156-159`).
  - T4 gives every kind `scrollKept`.
- **`PLAN.md` still treats I9 as open.** T2 ("Until the veil session agrees to I9 ..."), step 2.2's never-lease hold, step 2.3's two-way `nearCopy` rule, and `LaunchGate.cometShowing`: a comet-named field on the kind-agnostic gate that exists only to feed that rule (6.12: "for I9's fallback"). PF keeps the fallback too (8.7 step 4: "With no answer to I9"), though the answer's reasoning (light kept out of padded rects spends no budget) holds under PF's veil as well.
- **Nothing ships wrong.** The conditional wording ("unless the veil session has agreed", P11) keeps the default build right. But the scheduler would carry a cross-kind rule and a comet flag that nothing needs.
- **The contract is missing.** T3 doesn't state condition (a)'s radius bound or `next`, the contract any future never-lease kind has to meet. The comet doesn't meet (a) by construction (its tails exceed 32 px), so its box test must cover `blend.next` as well as the current zones; 6.12 tests "one box against at most 64 rects", the current layout only.

**Evidence.**

- `COORDINATION.md` 191 to 200 (answer 3) and 208 to 213 (answer 5, `QuietBlend.next`).
- Main checkout `scene.ts:156-159`: `transientQuietFactor` takes the minimum with `next`.
- `PLAN.md` lines:
  - 308 and 309 (T2, T3);
  - 360 and 368 (5.1);
  - 1563 (the 9 CSS px half-side);
  - 2246 and 2247 (steps 2.2 and 2.3);
  - 2778 to 2780 (`drawSatellite`);
  - 2791 (the comet: `cometShowing`, 64 rects);
  - 3345, 3351 and 3364 (P11, P12);
  - 3438 (I9 "open"), 3546 (8.7 step 4), 3738 (12.2).

**Fix.**

- Mark I9 answered (8.3, 12.2), and drop T2's second sentence.
- T3 states the never-lease contract: a drawn radius of at most `QUIET.padding`, drawn through `transientQuietFactor` with `CLEAR_SKY_KEEPS` at its centre, so `to` and `next` both count; a larger footprint tests itself against `blend.to` and `blend.next` every frame (the comet's box; a clear-sky meteor variant's streak relies on its planning).
- Drop step 2.2's never-lease hold, step 2.3's two-way clause and `LaunchGate.cometShowing` from 6.9, 6.12, 5.1, P11, P12, H7 and 8.7 step 4, so the scheduler keeps no cross-kind rule beyond the lease.

### SOC7-4 (minor): the farewell scene report touches unlisted files and leaves the sleeping timer's guard unsaid

**Section.** 6.12 (the farewell row); 5.1 (the `scene.ts` and `satellites.ts` rows); P12's files; 6.2 and 6.9 (`schedule`'s sleeping timer, `nextLaunchAt`).

**Problem.**

- **Two files missing.**
  - Round 6's fix reports the scene "from `SceneLevels.launches`, which then names it". In P12 the boolean that P8 renames (today `meteors: scrolled <= SCENE.heroMeteorMaxScroll`) becomes `'hero' | 'end' | null`, and `sceneAt` names `'end'` once the end level is at least 0.9. That edits `scene.ts`, which neither P12's farewell files nor 5.1's `scene.ts` row (P1, P6, P7, P8) list.
  - `TransientSpec.scene` is required, so `SATELLITE_SPEC` gains `scene: 'hero'` in `satellites.ts`, also unlisted (5.1's row says P11 only).
- **The 0.9 has no home.** It appears only in the farewell's spec column. In the farewell's own config block, `sceneAt` (the scene model) would read a transient kind's config; it belongs in `SCENE`, beside `heroLaunchMaxScroll`.
- **The sleeping timer's guard is unsaid.**
  - Today's timer for the next shooting star is armed only while `meteorsAllowed(now)` holds, and that test includes the hero scene (`sky.worker.ts:145`, `:164`).
  - 6.2 keeps "today's one timer" and 6.9 feeds it `nextLaunchAt(transients)`, without naming its guard once P8 folds `meteorsAllowed` into `launchGate`.
  - Once P12 drops the hero test from `allowed`, a guard on `allowed` lets a sleeping worker in the reading scene (D2 at 0) wake every `TRANSIENTS.recheck` (1 s) for kinds that step 2.2 holds back by scene.

**Evidence.**

- `PLAN.md` lines 354 and 364 (5.1), 1291 and 2371 (the sleeping timer), 2163 (`allowed`'s hero test), 2212 to 2213 (`nextLaunchAt(schedule)` takes no gate), 2241 to 2242 (step 2.2's recheck), 2790 (the farewell row) and 3364 (P12's files).
- Worktree `scene.ts:17` and `:36` (`meteors: boolean`); `sky.worker.ts:145` and `:164` (today's guard).

**Fix.**

- P12's farewell files and 5.1 add `scene.ts` (`SceneLevels.launches` as the named scene and its doc, and `SCENE.endLaunchLevel: 0.9` documented beside `heroLaunchMaxScroll`) and `satellites.ts` (`SATELLITE_SPEC.scene`).
- 6.9 names the sleeping timer's guard: `launchGate(now).allowed` and, from P12, a due kind whose `scene` is the gate's. Or `nextLaunchAt(schedule, gate)` skips kinds held back by scene, which keeps the scene rule in the scheduler.

## Summary

**Verdict: revise.** One blocking finding.

SOC7-1 rests on new evidence. The veil session's answers, committed in 4606c23 after `PLAN.md` was saved, make the file rule symbol-level, with a hands-off list that names `frameMode` and `tick`. P3 replaces both before V, and 8.6 still says the veil touches neither. The cure:

- a third overlap request (the veil session already agreed to `frameAt` and `sameRects`);
- a stated resolution: their `quietEasing(t)` in `demandNow`'s fade line;
- the existing hold if they decline.

Round 6's four fixes landed. Their residues and the other answers leave three minors:

- SOC7-2: list the `gather` line in 8.6 and CP-0.
- SOC7-3: retire the I9 fallback and `cometShowing`, and write the answer's three conditions into T3.
- SOC7-4: list `scene.ts` and `satellites.ts` for the farewell scene, give 0.9 a `SCENE` key, and name the sleeping timer's guard.

The boundaries otherwise hold:

- the drift, frame and launch policy is pure in `camera.ts`, `pacing.ts` and `transients.ts`, and the worker only gathers and wires;
- each kind lives in its own module, and `transients.ts` imports specs while kind modules import only types back, with no cycle (also with the farewell entry, which lives in `meteorKind.ts`);
- the protocol is the only channel between threads, and the main thread imports only types and `color.ts` from the model;
- `QuietBlend.next` leaves the star index exact: `easedQuietFactor` ignores it (their `scene.ts:144-147`), so H3 still compares like with like.

**Noted, not raised:**

- 4.2's `FrameDemand` row and DR2 say the worker gathers "at each frame decision"; since round 6, `frameAt` gathers too (wording only).
- `launchGate(now)` builds `field` (`screenQuietZones`, up to 64 rects) on every tick, where today it is built only when a launch is due (`sky.worker.ts:206`): an efficiency point for another lens.
- `DriftGate` also carries the twinkle's gate (`on`, `level`); the name was accepted in round 4.

## Verification

Skeptic for round 7, on `PLAN.md` as saved at 20:10 (before commit 4606c23 added the answers), `COORDINATION.md` in full, the worktree at 246c0aa and the main checkout's uncommitted diff (read only). A scratch scan of P1 to P7 and P13 for every symbol on answer 1's list (`soc-skeptic-r7/prev-symbols.mjs`) reproduces the reviewer's hits and adds P13 (the `tick` message, and the `relay` case inside `mountSky`). SOC7-2 to SOC7-4 are minor and were not part of this pass.

- **SOC7-1: confirmed, blocking.** It holds as stated. Answer 1 makes the rule symbol-level, and its list "replaces the shorter 'Changed shape' list above as the hands-off list" (`COORDINATION.md:148-153`), naming `frameMode` and `tick` (`:180`), `SkyFrame` (`:176`) and `mountSky` (`:184`), with only `frameAt` and `sameRects` agreed (`:187-189`); their `frameMode` fade test now calls the new `quietEasing(t)` (main checkout `sky.worker.ts:131-133`, `:142`; `tick`'s body at `:202-209` is unchanged, but the list is authoritative). `PLAN.md` still keys on "Changed shape" (322), calls `frameMode`, `schedule` and `tick` "Ours, from P1" (330), marks P2 and P3 unblocked (2973-2974), gives theirs as "none" (3500, 3504) and asks for two overlaps (3448). Followed as written, P3 deletes `frameMode`, their changed line with it, and rewrites `tick` before V (1218, 1280, 3092, 3098-3099), which "don't reformat, reorder or move its symbols before the rebase" rules out on any reading, and P2 (920, 926, 3060), P5 (1293, 1719) and P6 (3188) add lines to both; the only net is P0 step 1's conditional CP-5 re-run, while 4.4 still calls both functions ours. That breaks a `COORDINATION.md` constraint, so blocking, on new evidence (round 5 saw both untouched, `drafts/check-r5-coordination-a11y.md:149`). For the reviser: (a) the fix applies two readings, an overlap for lines added inside `tick` and `frameMode` but "other lines" for P4, P5 and P7's edits inside `mountSky` (`mountSky.ts:130-289` holds the listeners, `motion` and `destroy`, and their `headrooms` line and `measureLayout` sit in it too) and for the `SkyFrame` fields; CP-0's own wording (3444), which the answer echoes, means lines outside the listed symbols, and the list also names the import blocks of `sky.worker.ts` and `renderSky.ts`, which P1 to P7 extend, so the same message should ask whether added lines that leave theirs untouched count as other lines, or put them in the overlap (P3's replacement needs the overlap either way, and P13 waits with it through P6); (b) 8.5 step 2 already ports every line their commit adds, so only its "ours wins on structure" wording conflicts; (c) 8.6's `SkyFrame` row already says adjacent and "keep both", and its "no new field" matches their diff (`meteorInk` is at `renderSky.ts:86` in 246c0aa; only its doc changes); (d) the two quiet-ease tests agree today, so pointing `demandNow`'s `fading` line at `quietEasing(t)` at V is a DRY cleanup, not a live bug.
