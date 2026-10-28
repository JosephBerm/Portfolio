# DRY audit of PLAN.md, gate round 5

## Scope

- **Role.** Auditor, scope "dry", gate round 5: one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, with the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil now exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself, and over-engineering against "defensive but not over-engineered".
  - Whether round 4's DRY fixes (DRY-1 to DRY-14) landed, and any regression they caused.
- **Inputs.**
  - `PLAN.md`, the worktree's working copy as read on 2026-10-27: 3,935 lines, 64,543 words (`wc -w`), sha256 prefix `ebd7ff97e238ea6a`. Every `PLAN.md:n` below refers to that snapshot.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (the contract, above all "Confirmed veil interface (2026-10-27)"), `research/01-planning-brief.md`, and round 4's `audit/dry.md` with its dispositions.
  - The worktree code at 246c0aa (`file:line` below) and, read only, the main checkout's uncommitted veil edits (`sky.worker.ts`, `scene.ts`, `config.ts`), marked "observed".
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY scope (a regression of a DRY fix is in scope). The contract is `COORDINATION.md`, not the main checkout's work in progress.

## Method

1. Read the four required inputs, then `PLAN.md` in full.
2. Checked each round-4 DRY disposition against the text (table below).
3. Read the worktree's `sky.worker.ts`, `scene.ts`, `meteors.ts` and `config.ts`, and diffed the veil's working-tree `sky.worker.ts`, `scene.ts` and `config.ts` (read only).
4. Grepped `PLAN.md` for stale names, restated literals and repeated rules, and counted words per section.
5. Modeled the plan's `gather`/`schedule` path with a scratch script, `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r5/stale-gate.mjs` (the plan's functions as written).

## Round 4's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-1 | yes | The comet keeps `scrollKept` from the scroll where it starts to show, fade-in and box fade as `fade`; the About-row guard at 0.4 viewport heights plus `SCROLL_CANCEL.to`, less `ZONE_REACH` (`PLAN.md:2759`); I9 and CP-0 request 3 ask (`:3403`, `:3443`); D4 states the cost (`:171`); AC-25 matches (`:3574`). |
| DRY-2 | yes, one wording overclaim (DRY-R5-2, item 5) | `ZONE_REACH`, `zoneReaches`, `segmentClear` in `quietIndex.ts` (`:1397-1445`); satellites and the comet use them (`:2743`, `:2759`); I6 declined (`:3400`); PF exports nothing (`:3357`, `:3511`); Q2 narrowed (`:300`). |
| DRY-3 | yes | One tint rule (`:2445`), and the table agrees (`:2629-2636`). |
| DRY-4 | yes | `CLEAR_SKY_KEEPS` with its doc (`:2675-2680`), picked in `drawTransient` (`:2311`, `:2321`). |
| DRY-5 | yes | The point flash, bursts and earthgrazers are `METEOR_KINDS` variants (`:2764`, `:3329`). |
| DRY-6 | yes, one doc nit (DRY-R5-2, item 6) | `easing` and `easeEnded` (`:1093-1101`) serve the quiet ease, the motion ease (`:1225`, `:1696`) and the thin fade (`:3166`). |
| DRY-7 | landed with a regression | DRY-R5-1. |
| DRY-8 | yes | One measurement per hidden stretch (`:1676`). |
| DRY-9 | yes | `TransientSpec.nearCopy(body)` (`:2068`), set once at launch (`:2222`), checked by T2 (`:2221`); `Planned` is gone. |
| DRY-10 | yes | `DRIFT_REACH` (`:671-672`); the far band's mean 0.293 everywhere; no literal drift extents remain. |
| DRY-11 | yes | `METEOR.fallbackScale` (`:2450`, `:2457`, `:2542`); no `METEOR.duration` reader remains. |
| DRY-12 | yes | `TransientOf` appears only in the log. |
| DRY-13 | yes | 8.6 is the one overlap list (`:3465`); 4.4 and CP-5 point to it (`:338`, `:3387`); CP-0 names `LAYERS`, `AGENTS.md` and the adjacent edits (`:3411-3415`). |
| DRY-14 | in part | DRY-R5-2. |

## Verdict

**Revise.** 1 major (a regression of round 4's DRY-7 fix), 3 minor, none blocking.

## Findings

### DRY-R5-1 (major): the gate gathered "once per tick" goes stale in `schedule`, so an input ping no longer wakes the drift

- **Section.** 6.1 (the worker side: `gather`, the `tick` bullet); 6.2 (`demandNow`, `schedule`); 6.6 (the `activity` case); 4.3 DR2 and F6; 5.1 (the worker row).
- **Problem.**
  - Round 4's DRY-7 fix gathers the ambient gate (`driftGate.on`, `.level`) once per tick, and only `tick` calls `gather`.
  - But `schedule(now)` also decides frames: it runs after every message and calls `demandNow`, which reads `driftWanted(driftGate)` and `driftGate.on` without gathering.
  - The `activity` case runs `noteInput` and then `schedule`, and sets no `needsDraw` (rightly: a ping per second must not draw while paused). After an idle sleep, the ping is therefore judged on the gate from before it (`on` false): no frames.
  - In the reading scene nothing else wakes the worker, so the drift never resumes until a scroll. F6, AC-33 and H13 case 1 fail.
  - In the hero the only wake-up is the next launch timer, which the return pushes `afterReturn` (3 s) out. The twinkle and the drift rate then jump from 0 to 0.84 of full in one frame, against E3 ("every rate change eased") and AC-33 ("eases them back over 4 s").
  - Before P6 the twinkle line is computed fresh (6.2's table), so the regression starts in P6. Today's `frameMode` also evaluates its gate fresh at every `schedule`.
- **Evidence.**
  - `PLAN.md:906`: "**`tick`**: `gather(now, scene)` and `updateCamera(now, scene)` after `settleQuiet(now)` and before the frame decision".
  - `PLAN.md:1211-1214` (`demandNow`, "from this tick's gathered gates": `const wanted = driftWanted(driftGate)`); `:1226` (the twinkle line reads `driftGate.on`); `:1239` (before P6 that line is today's fresh `motion === 'full' && !isIdle(...)`).
  - `PLAN.md:1266-1268` (`schedule(now)` "computes `demandNow`"; an fps of 0 sleeps); `:2805` ("`schedule(now)` runs after every message, as today"; `sky.worker.ts:486`).
  - `PLAN.md:1665` ("The worker handles `activity` with `noteInput(now)`, followed by the usual `schedule(now)`"); `:1671` ("The drift resumes even in the reading scene ... because its frames follow `driftWanted`"); `:297` (F6); `:2915` (H13 case 1: "one `activity` ping restarts frames at once"); `:3582` (AC-33).
  - `sky.worker.ts:125`: today's twinkle gate is computed inside `frameMode` at every call.
  - [computed] `dry-gate-r5/stale-gate.mjs`: in the reading scene after 95 s without input, the ping gives `NO_FRAMES`, while a fresh `gather` gives vsync frames. In the hero it also gives `NO_FRAMES` until the launch timer 3 s later, when `presenceLevel` is smoothstep(0, 4000, 3000) = 0.84375.
- **Fix.**
  - Gather at every frame decision, not once per tick: `demandNow` starts with `gather(now, scene)`, so `schedule` after a message sees the fresh gate. `tick` keeps its earlier call for `updateCamera`; `gather` is idempotent for one `now`. That is still one definition, called wherever the gate is read.
  - Reword "gathers once per tick" to "gathers at each wake-up and each schedule" in 4.3 DR2, 5.1, 6.1 (the `DriftGate` and `driftGate` docs, the worker-side paragraph) and 6.2 (the `FrameState` and `demandNow` docs).
  - H13 case 1 already catches it; add its hero twin: a key press after 95 s idle starts frames at once, not at the next launch.

### DRY-R5-2 (minor): restated facts that now disagree with their owner (DRY-14's remainder)

- **Section.** 8.7 item 4; section 11 (the 1.4.3 row); D4 and 6.12; 6.1 (depth, headed P2); 6.11 step 5, 8.3 I6, 4.2 QuietIndex and 4.3 T3; 6.2 (`Ease`), P6 and 6.9 (`cancelLevel`); the whole plan.
- **Problem.** Six copies now say something other than the section that owns the fact:
  1. 8.7 says never-lease kinds "wait for a free lease". 6.9 step 2.2 and I9 hold them only while a lease holder is active. `inkLeaseFree` also waits out the crossing cooldown (55 s from the reveal and after every lease), so the 8.7 wording would hold satellites for most of a visit.
  2. Section 11 gives "about 0.05 of white for body text, COORDINATION.md". `COORDINATION.md`'s table says about 0.08 for slate body text: the headroom, before `inkBudget`. The 0.05 comes from the veil's working-tree `INK_BUDGET` doc (observed). DRY-14's fix was to cite the name, not restate the number.
  3. D4 puts the comet on "1 visit in 10", and 6.12 on "1 visit in 8 to 10".
  4. 6.1's depth subsection, headed P2, says `LayerConfig.parallax` and the three values "go" and that the `LAYERS` doc changes. P2, 5.1, 8.5 step 5 and 8.6 leave that to V.
  5. 6.11 step 5 and I6 call `segmentClear` "the one clear-sky test every kind and route shares", and 4.2 calls it "the one 'clear of copy' test". T3 enforces clear sky through "each planner (`segmentClear`)" for `lease: false` kinds only. But meteors planned with `nearCopy: false` (fireballs, and P12's clear-sky variants, for which 6.12 cites T3) take the veil planner's own segment test (6.10).
  6. `Ease`'s doc says it serves ADAPT's thin fade, but P6 writes `thinLevel` as `1 − smoothstep(thinnedAt, thinnedAt + ADAPT.thinFade, t)`. `cancelLevel` and the comet's box fade repeat the same one-way ease beside `easeAt`.

  The size keeps growing with each round. The plan is 64,543 words: 6,745 more than at round 4's audit (57,798) and 9,690 more than at 2e622a5 (54,853), and 1.38 times R1 to R4 together (46,672). Its two logs come to 3,530 words. The comet, a "could" that D4's default doesn't ship, fills a 397-word table cell and appears on 29 lines.
- **Evidence.**
  - (1) `PLAN.md:3511` ("kinds that never take the lease wait for a free lease"); `:2217`; `:3403` ("a never-lease kind waits while a lease holder is active"); `:2199-2201` (`inkLeaseFree` tests `now >= schedule.crossingAfter`).
  - (2) `PLAN.md:3657`; `COORDINATION.md:58` ("Slate body text, 16 px | 4.5:1 | about 0.08"); main checkout `src/lib/sky/config.ts`, `INK_BUDGET`'s doc: "That leaves slate body text about 0.05" (observed).
  - (3) `PLAN.md:171` and `:2759`.
  - (4) `PLAN.md:455` and `:496`, against `:3015`, `:349` and `:3458`.
  - (5) `PLAN.md:2743`, `:3400`, `:246` and `:306`, against `:2627` and `:2764`; baseline `meteors.ts:158` (the planner's own `segmentTouches(start, end, rect, QUIET.feather)`).
  - (6) `PLAN.md:1081`, against `:3164`, `:2186-2188` and `:2759`.
  - Counts: `wc -w` on `PLAN.md`, on `research/R*.md` and on `git show 2e622a5:…/PLAN.md`; the per-section word counts.
- **Fix.**
  - Correct each copy to its owner:
    1. "wait while a lease holder is active (6.9 step 2.2)";
    2. "fits any brightness to `inkBudget(headroom)` (`INK_BUDGET`, `COORDINATION.md`)", with no number;
    3. one figure, kept in 6.12, which D4 cites;
    4. 6.1: "go at V (8.5 step 5)";
    5. "the one clear-sky test for the kinds we plan ourselves (satellites; the comet's box uses `zoneReaches`); meteors keep the veil planner's", with T3 naming both routes (a kind with `lease` false, or P12's `clearSky(body)`);
    6. drop the thin fade from `Ease`'s doc, or hold it as an `Ease` read with `easeAt`.
  - The cheapest size cut: move the Check log and the Audit log to `drafts/review-log.md`, keeping a "Check log" heading with the link (`HANDOFF.md` tests for that heading). Optionally, shrink the comet to its constraints until D4 picks it.

### DRY-R5-3 (minor): the scroll-quiet wait gates every kind from P8 but keeps a meteor key in `FRAME`

- **Section.** 6.9 (`LaunchGate.settled`; "Changes to `METEOR` in P8 and P9"); 6.7 (the P8 renames); P8 files.
- **Problem.** From P8, `LaunchGate.settled` ("No scroll for FRAME.meteorScrollQuietMs") holds every kind. Yet the key keeps its name and its doc ("Shooting stars wait this long after scrolling stops"). Meanwhile P8 moves every other scheduler key out of `METEOR` into `TRANSIENTS` "because they now apply to every kind", and renames `heroMeteorMaxScroll` to `heroLaunchMaxScroll` for the same reason. The scheduler's timing then has two homes, one of them named for meteors, in milliseconds while `TRANSIENTS` uses seconds.
- **Evidence.** `PLAN.md:2137`, `:2257`, `:1720` and `:3214`; `config.ts:215-216` (`meteorScrollQuietMs: 1200` and its doc); its one reader today is `sky.worker.ts:202`, which P8 replaces.
- **Fix.** P8 moves it to `TRANSIENTS` (for example `scrollQuiet: 1.2`, in seconds like `recheck` and `afterReturn`, documented "a launch waits this long after scrolling stops"), and `LaunchGate.settled`'s doc names it. Its only reader after P8 is the launch gate. At least, rename it and rewrite its doc, as P8 does for the hero gate.

### DRY-R5-4 (minor): the farewell meteors get a second launch gate that the scheduler's gate always overrides

- **Section.** 6.12 (the farewell row); P12 "Files per kind"; 4.3 T6; 6.9 (`LaunchGate`, step 2.2); H7.
- **Problem.**
  - The farewell meteors get "the end-scene gate in `meteorKind.ts`", with conditions of their own: the end level at least 0.9, the visitor rested 3 s, and gaps of 8 + Exp(14) s.
  - But the kind-agnostic scheduler holds every kind while `!gate.allowed`, and `LaunchGate.allowed` includes "the hero scene (`SceneLevels.launches`)". T6 says "Launches only in the hero", and H7 tests that nothing launches past 0.4 viewport heights.
  - So a gate inside the kind can never open, and as written the variant can't launch. Making it work would add a per-kind launch gate beside the one the scheduler owns.
  - "Rested 3 s" restates `settled` (1.2 s) with another number, and 8 + Exp(14) is `METEOR_RATE.narrow`'s law without its cap.
- **Evidence.** `PLAN.md:2758` and `:3329`, against `:309` (T6), `:2135` (`LaunchGate.allowed`), `:2213` (step 2.2) and `:2909` (H7).
- **Fix.**
  - Keep one gate. `sceneAt` reports where launches may happen (for example `launches: 'hero' | 'end' | null`), and the `LaunchGate` passes it on.
  - Each kind or `METEOR_KINDS` entry names the scenes it launches in. The farewell entry names the end, at most 2 a visit, and the meteor spec's one decision step decides it, like the other variants.
  - T6 and H7 name the exception, and the entry's gap is a `GapLaw`, not restated numbers.
  - Under D4's default none ships, so a one-line note in the row is enough until the user picks it.

## Summary

- Round 4's fourteen DRY fixes landed, DRY-14 in part, with nothing re-implementing a veil export. One regression: DRY-7's "gather once per tick" leaves `schedule` reading a stale gate, so from P6 a pointer or key ping after an idle sleep never restarts the drift in the reading scene, and restarts it late and with a jump in the hero (DRY-R5-1, major). Calling `gather` at the top of `demandNow` fixes it.
- Three minor findings, each cheap:
  - six restated facts that now disagree with their owner, and the plan's continued growth (64.5k words, 3.5k of them logs);
  - the scroll-quiet key P8 leaves behind in `FRAME`;
  - a farewell-meteor gate the scheduler can't let through.
- No config is duplicated between the worker and the main thread. Of the veil's exports, the plan wraps or calls `scrollKept`, `transientQuietFactor`, `easedQuietFactor`, `quietAt` and `QUIET_REACH` and copies none of them. `segmentTouches` stays the veil's private test, and `segmentClear` covers our own planners.
