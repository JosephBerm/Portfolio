# DRY audit of PLAN.md, gate round 11

## Scope

- **Role.** Auditor, scope "dry", gate round 11: one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what cf4d7b8 exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain` and the `color.ts` exports.
  - Duplication in the document itself (sections repeating each other, research copied instead of linked), and over-engineering against "defensive but not over-engineered", including what rounds 9 and 10 added.
  - Whether round 10's DRY fixes (DRY-R10-1, DRY-R10-2 (a) to (c)) landed, and what round 10's changes broke.
- **Inputs.**
  - `PLAN.md` as read on 2026-10-28: 3,651 lines, 59,713 words, sha256 prefix `2fc5c3b8fea0f6cd`, committed and unchanged in the worktree. A copy is in the scratch folder (`dry-gate-r11/PLAN.snapshot.md`); every `PLAN.md:n` below refers to it.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `REVIEW-LOG.md` ("### Round 10" and "### Gate round 10") and round 10's `audit/dry-gate-r10.md`.
  - The code baseline cf4d7b8: the worktree's `src/`, which `git diff cf4d7b8 HEAD -- src` shows is identical. Every `file:line` below cites it.
  - `harness/README.md` and the archive's file list.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY lens; `COORDINATION.md` is the contract.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then round 10's DRY report and its log rows.
2. Word-diffed round 10's input (`PLAN.before-r10.md`, sha256 `515aac12d898801f`, identical to `dry-gate-r10/PLAN.snapshot.md`) against this snapshot (`dry-gate-r11/r10-reviser.wdiff`, 63 hunks) and read every change in context, including the cuts the round 10 log lists.
3. Read cf4d7b8's `planFlight` and `planMeteor` (`meteors.ts:180-276`), the `METEOR` block (`config.ts:247-331`), `screenQuietZones` and the veil helpers (`scene.ts:55-190`), `updateMeteor` and `planLaunch` (`sky.worker.ts:211-261`) and the idle helpers (`:100-127`).
4. For each fact round 10 touched, listed every copy in `PLAN.md` and compared it with its owner: the lazy field, the farewell band and its `room`, `limit` and `kindLaunches`, `planMeteorTransient`'s second argument, the fireball decision, `clearOf`'s doc, the fallback's scaled minimum, `startArea`'s clamp, `launchesAllowed`, the comet's start rule, the kill switches, the five-minute window and 7.0's docs rule.
5. Ran scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r11/`:
   - `shingles.mjs` (repeated 9- and 12-word runs, against round 10's input);
   - `cites.mjs` (every `file:line` resolved on cf4d7b8, diffed with round 10's input);
   - `xcopy.mjs` (new: 12-word runs shared with R1 to R4 and `COORDINATION.md`);
   - `ac-map.mjs`, `h-map.mjs` and `secrefs.mjs` (the AC and H phase maps, section references);
   - a binomial check of AC-20's browser pass rates.
6. Extracted three archive files into `dry-gate-r11/harness-x/` (never into the repository) to check the P9 harness bullet's library paths.

## Round 10's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R10-1 | yes | AC-20 now cites H9's bar: "median 5, with 3 to 6 at H9's bar (about 90% by design)", and gives the browser pass rate for both shares, "a sky at 90% passes about 93% of the time and one at H9's 85% floor 82%" (`PLAN.md:3445`). H9 keeps the one number, 85% (`:2897`); 2.1's "about 90%" (`:78`) describes the design. [computed] P(at least 8 of 10) is 0.9298 at 0.90, 0.9332 at 0.902 and 0.8202 at 0.85. |
| DRY-R10-2 (a) | yes | `LaunchGate.field()`'s doc says "the launch step builds it once, only for a due kind it may plan" (`:2138`); step 2.2 builds it for the `room` hold and passes it on to the plan (`:2214`); step 2.3 plans "in `gate.field()` (or that `field`)" (`:2215`); the worker bullet says "once per due kind past its holds" (`:2334`). The three statements agree, and the build still follows cf4d7b8's due check and holds (`sky.worker.ts:220-226`). |
| DRY-R10-2 (b) | in part | `planMeteorTransient(context, { clearOf, starts })` is named in 6.12 (`:2749`), 5.1 (`:328`) and P12's files (`:3312`), so the pass order stays in one function. The answer it gives on fireballs, "never a fireball, since P10's decision is the meteor spec's", has no support in P10 or in the sketch it would have to change: DRY-R11-1. |
| DRY-R10-2 (c) | yes | `clearOf`'s doc gains "for farewell meteors, also the sky above the end scene's quiet copy, where unmarked copy shows (P12)" (`:2583`); 5.1's `meteors.ts` row (`:333`) and P12's files (`:3312`) follow. |

## Round 10's other changes, through this lens

- **Single owners that still hold.**
  - `launchesAllowed` is the one launch test: the gate's `allowed` and the sleeping timer read it (`:2333`, `:2338`), and the comet's start rule now reads the gate instead of restating its facts (`:2750`), which closes round 10's noted overlap.
  - The farewell band's edge is one helper read by both `room` and `plan` (P12's files, `:3312`), and "`field.quiet` without `field.pinned`" relies on the worker padding the rails once for both lists (`:2334`), which cf4d7b8's `screenQuietZones` allows (`scene.ts:60-69`: zones first, then the padded pinned rects).
  - The scroll cancel is still `scrollKept` alone: `transientFade` for transients, one direct call for the comet, with `fadeOutAt` as the one one-way fade (`:2189`, `:2750`).
  - The five-minute window has one owner, 6.9 (`:2270`); E5 (`:145`), R-10 (`:3553`) and P9's report (`:3251`) cite it.
  - Nothing new re-implements a veil export, and no config is shared between the worker and the main thread (P13's loop and P7's pointer listener keep their state in `mountSky.ts`).
- **The cuts** each leave the fact with its owner: deviation 8's restatement (T4, step 1 and AC-40), 6.10's color table (the `METEOR_LOOK` tint rule, `:2442`), the phone-radiant aside (deviation 14), I9's restatement (T2 to T4), AC-25's and AC-38's restatements (6.12 and 6.9) and the `drawTransient` rationale (the spec helpers' #30581 paragraph, `:2072`).
- **References.** `cites.mjs` resolves 63 citations; the three new ones (`meteors.ts:77-78`, `mountSky.ts:231`, `scene.ts:60-69`) point at the code the text means, and so do the bare references on changed lines (`:455`, `:504`, `:203`, `:209`, `:212`, `:224`, `:228`, `:236`).
- **Repeated text.** The 12-word repeats are round 10's 20 plus one, P12's step 1 against AC-25, a check list against its acceptance item. Overlap with the research and `COORDINATION.md` is unchanged (12-word runs shared with R1 to R4: 125, 215, 245 and 48, against 125, 216, 245 and 48 before round 10), nearly all in config docs and analogies the plan adopts.
- **Three exceptions**, the findings below: the fireball decision's place and channel (DRY-R11-1), a second list of what the pause stops that 7.0's new docs rule reaches but no file list does (DRY-R11-2), and two docs for `METEOR.fallbackScale` (DRY-R11-3).

## Verdict

**Pass.** No blocking or major finding. Three minor findings, each cheap and clearly right.

## Findings

### DRY-R11-1 (minor): P10 never says where the fireball decision runs or how its `fireball` reaches the planner, and 6.12's "never a fireball" depends on it

- **Section.** 6.9 (`planMeteorTransient`, `METEOR_SPEC`); P10 (files); 6.12 (the farewell row and the variants paragraph); 5.1 (`meteorKind.ts`).
- **Problem.**
  - From P10 the planner no longer draws fireballs per attempt: the launch passes `PlanOptions.fireball`. Only `planMeteorTransient` calls `planMeteor`, and the plan gives it one parameter and lists the options it passes, all taken from the context (`nearCopy`, `ink`, and from P9 the rails as `clearOf`). P10 says only that "the meteor spec decides fireballs before planning", and the `METEOR_KINDS` doc that "if no fireball path fits, an ordinary shooting star flies instead". Nothing says how the decision's `fireball` gets in.
  - Round 10's fix gave `planMeteorTransient` an optional second argument, dated to P12, and states farewell meteors are "never a fireball, since P10's decision is the meteor spec's". But `METEOR_SPEC.plan` is `planMeteorTransient` itself, so the decision can only sit inside it, and then the farewell spec, which calls it, decides fireballs too. From P12 the same holds for the point flash, bursts and earthgrazers, "decided in the meteor spec's one decision step".
  - The other reading, a decision step wrapped around `planMeteorTransient`, needs the second argument in P10, not P12. It also runs the fireball try as its own call, and by `planMeteorTransient`'s doc a null result with the context's `nearCopy` true clears the visit's sky, although a fireball flies in clear sky only, and a clear-sky failure "proves nothing about the sky".
  - So P10 can be built two ways, only one keeps 6.12's claim, and the one channel for per-launch options into the pass order is dated to an optional phase while a required one already needs it.
- **Evidence.**
  - `PLAN.md:2097-2106`: "each with the context's `nearCopy` and `ink` and, from P9, the field's `pinned` as `clearOf`"; "When none fits it clears the radiant (P8) or the sky (P9), unless the context kept it in clear sky (`nearCopy` false): that failure proves nothing about the sky"; `function planMeteorTransient(context: PlanContext): Meteor | null`.
  - `:2113`: `plan: planMeteorTransient,`.
  - `:2585-2586` (`fireball?: boolean`, "This launch is a fireball ... (P10)") and `:2595-2596` ("from P10, PlanOptions.fireball replaces PassOptions.fireballs and the per-attempt METEOR.fireballChance draw").
  - `:3265-3266` (P10's `meteorKind.ts` and `meteors.ts` lines), `:3271-3273` (the `METEOR_KINDS` doc), `:3280` (P10's steps: "The spec's fireball decision").
  - `:2749` (farewell: "whose `plan` calls `planMeteorTransient(context, { clearOf, starts })`, an optional second argument ...; never a fireball, since P10's decision is the meteor spec's"), `:2755` (variants), `:328` (5.1: "the fireball decision (P10); the could variants, and farewell meteors' spec through `planMeteorTransient`'s second argument (P12)").
  - cf4d7b8: the per-attempt draw (`meteors.ts:203`); `planMeteor` gives the long pass `fireballs: !narrow` and the fallback pass `fireballs: false` (`:274-275`); `planLaunch` drops the radiant on any null plan (`sky.worker.ts:246-261`).
  - Round 10's report already asked "where P10's variant decision sits, inside that function or around it" (`audit/dry-gate-r10.md`, DRY-R10-2 (b)); the fix answered whether, not where.
- **Why minor, not major.** The plainest P10 build (the decision inside `planMeteorTransient`) works on its own and keeps the veil's pass order. The contradiction bites only if D4 picks farewell meteors (P12, not in v1), and the fix is a few sentences.
- **Fix.**
  - P10 makes `METEOR_SPEC.plan` the decision step around `planMeteorTransient`, and gives `planMeteorTransient` its optional second argument there: extra `PlanOptions` added to every `planMeteor` call, `fireball` from P10, extended by P12's variants and farewell meteors (`clearOf`, `starts`).
  - The step tries a decided fireball first, in clear sky (`nearCopy` false, so its failure keeps the visit's sky) and on long flights only, as `planMeteor`'s fallback pass is today; if that is null it plans an ordinary flight.
  - 6.9's sketch notes P10's `plan`, `planMeteorTransient`'s doc names the argument, and 5.1, P10's files and P12's files date it to P10.

### DRY-R11-2 (minor): the pause control's doc keeps a second list of what the pause stops; 7.0 has P6 edit it, but no file list does, and P11's satellites never reach it

- **Section.** 6.8 (`SkyPauseButton`'s doc), 6.13 (`SkyMotion`), 7.0 (the docs rule), 5.1, P6 and P11 (files).
- **Problem.**
  - `SkyMotion`'s doc is the one list of what full motion allows: P5 to P8 each extend it, and each phase's `protocol.ts` line names the edit. `SkyPauseButton`'s doc lists the same parts again: "stops the drift, twinkle, parallax and shooting stars".
  - Round 10's 7.0 sentence makes P6 add the drift to that doc (and to `FRAME.motionEase`'s), but neither P6's files nor 5.1's `SkyPauseButton.tsx` row (P5 only) names the file, so a P6 pull request built from its file list leaves the doc without the drift. P6's `config.ts` line and 5.1's `config.ts` row likewise leave out `FRAME.motionEase`'s doc.
  - The pause stops satellites too (`cancelTransients`), but 7.0's P11 entry covers only the docs P8 writes, so the control's doc never gains them.
- **Evidence.** `PLAN.md:1864-1869` (the control's doc); `:2763-2769` (`SkyMotion`: "`full`: twinkle, drift, scroll parallax and its glide, pointer lean and transients"); `:1958` ("P6, P7 and P8 add the drift, the pointer lean and "transients", giving 6.13's line"); `:2820` (7.0: "P6 the drift, its caps, the thin fade and `gather` to the 6.1 and 6.2 docs naming them, `FRAME.motionEase` and `SkyPauseButton`"; "P11 satellites and `CLEAR_SKY_KEEPS` to the docs P8 writes ... (`TRANSIENTS`, the envelope's `clearSky`, the spec's `lease`, `drawTransient`)"); `:340` (5.1: `SkyPauseButton.tsx`, P5); `:3127-3135` (P6's files); `:3290-3296` (P11's files); `:1679-1686` (`FRAME.motionEase`: "the drift and twinkle ease out or in"); `:3128` and `:319` (P6's and 5.1's `config.ts` entries).
- **Fix.** Word the control's doc once, for every phase, by what it does instead of a list: "stops all of the sky's motion, as `motion: 'reduced'` does (`SkyMotion`), and starts it again from where it stopped". 7.0's P6 entry then drops `SkyPauseButton`. For `FRAME.motionEase`, name its doc in P6's `config.ts` line and 5.1's row (or word it "ambient motion", as P4's idle docs are, so that no later phase edits it).

### DRY-R11-3 (minor): `METEOR.fallbackScale` gets two docs for one rule

- **Section.** 6.10 ("Removed in P9" and the rewritten inner docs).
- **Problem.** P9 documents `fallbackScale` on its own ("The fallback pass scales each speed class's durations, and the shortest path it accepts, by this") and rewrites the flight block's doc, which covers the keys under it, to say the same ("the fallback pass flies its class's durations times `fallbackScale` and accepts paths that much shorter"). `METEOR` documents related keys in groups, and `fallbackScale` replaces the flight block's `fallbackDuration`. Round 10 (PHY10-1) had to edit both sentences to add the shorter minimum path: the cost of the copy.
- **Evidence.** `PLAN.md:2447` and `:2454`. cf4d7b8 `config.ts:286-295` (one doc above `duration`, `fallbackDuration`, `speedShare`, `speed` and `speedJitter`), `:254-257` (`gapMin` to `gapMax`) and `:261-263` (`retry` and `maxFailedPlans`), each group under one doc.
- **Fix.** Put `fallbackScale` in the flight block, whose rewritten doc already describes it, and drop its separate doc (or keep that doc and cut the fallback clause from the block's). `PassOptions`' doc may keep naming `METEOR.fallbackScale`.

## Summary

- **Round 10's fixes.** DRY-R10-1 and DRY-R10-2 (a) and (c) landed: AC-20 cites H9's one bar with the browser pass rate at both shares, the launch step builds the field once per due kind, and `clearOf`'s doc names the farewell band. DRY-R10-2 (b) landed in part: the farewell spec reuses `planMeteorTransient`, but its "never a fireball" rests on a P10 structure the plan doesn't state.
- **Round 10's other changes.** Every single owner in this lens holds, nothing re-implements a veil export, no config crosses the thread boundary, and the cuts lost nothing an implementer needs.
- **Three minor findings.**
  - **DRY-R11-1.** P10's fireball decision has no stated place or channel into `planMeteorTransient`; read one way it makes farewell meteors fireballs, read the other it needs the second argument in P10.
  - **DRY-R11-2.** The pause control's doc duplicates `SkyMotion`'s list; 7.0 has P6 extend it while no file list includes it, and P11's satellites never reach it.
  - **DRY-R11-3.** `METEOR.fallbackScale` is documented twice in one block.

## Noted, not raised

- **The farewell meteors' weight** (over-engineering). Rounds 9 and 10 gave this could kind about fifteen mechanisms: its registry entry, `LaunchGate.scene`, `SceneLevels.launchScene`, `SCENE.endLaunchLevel`, `TransientSpec.scene`, `room` and `limit`, `kindLaunches`, the `starts` option, `clearOf`'s band, the edge helper, `planMeteorTransient`'s second argument, its `drawTransient` case, its gap law and cap, step 2.3's retry exception, end-scene captures at two sizes and a notice to the veil session. They drew five findings in two rounds (CA9-1, CA10-1, CA10-2, DRY-R10-2, SOC10-2), and the kind flies only in the last 169 px of scroll at 2560 × 1440 and never at 3840 × 2160 (D4). No v1 code carries them (D4's default is none, and each member is P12's), so the cost is the plan's length and review time. Whether to keep it among D4's candidates is the user's call.
- **The comet's About row** is 0.6 H plus 70, 90 or 110 px by breakpoint (`PLAN.md:2750`), CSS facts (`components/styles.ts:7`, `globals.css:203`) the worker can't read. The plan doesn't name the constant that will mirror them; `METEOR.top`, whose doc names the 100 px navbar it clears (`config.ts:283-284`), is the precedent to follow. A could kind.
- **The fallback's scaling is split by owner**: the steer scales its class's durations, the planner its own minimum path (6.10 steps 5 and 7, `:2609`). Each scales the quantity it owns, so it is not a copy, but a change to what the fallback means touches both.
- **`startArea`'s clamp** is applied twice, by the planner's draw and by the usability test's probes (`:2532`, `:2593-2594`), because CG10-3 keeps cf4d7b8's exact draw (`meteors.ts:204-207`). Keeping the draw justifies it.
- **`launched` and `kindLaunches`** count the same launches, the total and per kind, both incremented at the one launch point (`:2221`). Cheap; the total could be derived if a later kind needs it.
- **Outside this lens.**
  - H9 defines crossings over a visit's first two minutes only (`:2897`), while P9's report asks for "H9's crossings a minute over a visit's first two and first five minutes" (`:3251`).
  - P9's harness bullet calls `code-logic/lib.mjs` "unarchived" (`:3252`), but the archive holds `meteor3/code-logic/lib.mjs` (`harness/README.md:22`, and `tar -tzf`), which `check11/render3-canvas.mjs:12` imports. Its `launch` is identical to `live/alib.mjs`'s, so the instruction works either way; only the word is wrong.
- **Still true from rounds 9 and 10:**
  - the `TRANSIENTS` doc's note "set from the crossing share measured on captured layouts" (`:2231`), where 6.9's rule and now R-10 use H9's rates;
  - degrees per second to CSS px per second written twice (`:2541`, `:2728`);
  - `SCROLL_CANCEL`'s 12 and 24 px recurring in prose;
  - section 3's D10 and D11 sentence (`:157`);
  - `ZONE_REACH`'s doc saying "Every "clear of copy" test reads it" (`:1394`);
  - `pickVisitSky` testing the field's width;
  - 8.4's `METEOR` row summarizing 6.10's doc list;
  - "a lease holder is active" written in three places;
  - the maps' known gaps: P12's "its acceptance item" (AC-25, AC-31, AC-37), P0's baseline lists and P6's use of H6's medians.
