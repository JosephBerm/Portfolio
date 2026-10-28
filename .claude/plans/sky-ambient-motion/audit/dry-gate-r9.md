# DRY audit of PLAN.md, gate round 9

## Scope

- **Role.** Auditor, scope "dry", gate round 9. This is one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, and the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself (sections repeating each other, research copied instead of linked), and over-engineering against "defensive but not over-engineered".
  - Whether round 8's DRY fixes (DRY-R8-1 to DRY-R8-3) landed and what they broke. Round 8's other changes go through the same lens: the rail guard (`clearOf`, `SkyField.pinned`), the nine bars, the harness adaptation and the moved docs. So does the post-commit restructure: stale split content, anything an implementer needs that was lost, and the re-grounded `file:line` references.
- **Inputs.**
  - `PLAN.md` as read on 2026-10-27: 3,653 lines, 58,308 words, sha256 prefix `99cc28a8b7133578`. A copy is in the scratch folder (`dry-gate-r9/PLAN.snapshot.md`), and every `PLAN.md:n` below refers to it.
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree") and `research/01-planning-brief.md`.
  - `REVIEW-LOG.md` (round 8's rows), round 8's `audit/dry-gate-r8.md`, and CA8-1 in `drafts/check-r8-coordination-a11y.md`.
  - The code baseline cf4d7b8, read only at `.claude/worktrees/sky-baseline-cf4d7b8`. Every `file:line` below cites it.
  - The archived harness `harness/veil-confirm-final-1.tar.gz`, extracted into the scratch folder.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.**
  - Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or anything outside this file, in any checkout.
  - Findings stay inside the DRY scope, and the contract is `COORDINATION.md`.

## Method

1. Read the four required inputs, then `PLAN.md` in full, then `REVIEW-LOG.md`'s round 8 rows and round 8's DRY report.
2. Word-diffed round 8's input (`PLAN.before-r8.md`, sha256 `4a0f1c47c1918697`, identical to `dry-gate-r8/PLAN.snapshot.md`) against this snapshot (`dry-gate-r9/r8-reviser.wdiff`). I read every change in context.
3. Read cf4d7b8's `sky.worker.ts`, `scene.ts`, `config.ts` and `meteors.ts` in full, and the cited parts of `mountSky.ts`, `renderSky.ts` and `protocol.ts`.
4. Listed every copy of each fact round 8 touched and compared each copy with its owner. The facts:
   - the ease helpers' "not begun" convention, `narrowScreen` and `LaunchGate.narrow`;
   - 8.4's veil rule;
   - the rails' guard (`clearOf`, `SkyField.pinned`, the `METEOR` and `maxEndY` docs);
   - the nine bars, the `SkyMotion` doc's growth and the rollback notes.

   I also searched for split-era terms (PF, V, CP-0, CP-3 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file-by-file", "observed", "rebase", "old checkpoint").
5. Ran scratch scripts in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-gate-r9/`:
   - `tc/thin.ts`: the plan's `Ease`, `easeAt`, `easing`, `easeEnded` and `fadeOutAt`, with every caller the plan names, under `tsc` 6.0.3 `--strict` (TypeScript from the main checkout's `node_modules`, read only), then run under Node for the edge values.
   - `gate/gate2.mjs`: what one `launchGate(now)` allocates.
     - Inputs: cf4d7b8's own `screenQuietZones`, loaded through the plan's 7.1 resolve hook (`gate/register-hooks.mjs`) on Node 24.14, and the archived 1440 × 900 settled layout.
     - It compares that with what `quietBlend(t)` allocates per drawn frame.
   - `shingles.mjs` (repeated 9- and 12-word runs, compared with round 8's input), `secrefs.mjs`, `cites.mjs`, `ac-map.mjs` and `h-map.mjs` (round 8's).
   - A bare-reference check: a bare `:n` that follows another file's explicit `file:line` on the same line.
   - `harness-x/`: the extracted archive, used two ways.
     - To check the names and lines P9's adaptation step cites. All hold: `sim2.mjs:23-24` and `:28`, `render3.mjs:134`, `check11/render3-canvas.mjs:136`, `lib.mjs`'s `P` and `fieldOf`, `transpile.mjs`'s `REPO`, and `live/alib.mjs`'s `launch`.
     - To count the layouts' rects: 25 quiet and 6 pinned on every desktop capture, 35 and 0 on the phone.

## Round 8's fixes

| ID | Landed? | Where |
|---|---|---|
| DRY-R8-1 | yes, no regression | `easing` and `easeEnded` take `number \| null` and return false while it is null (`PLAN.md:1075-1083`), as `fadeOutAt` returns 1 then (`:1085-1088`). P6 passes the null-started `thinnedAt` to all three (`:3149`, `:3151`), and H4 adds the null case (`:2896`). `motionLevel.since` (`-Infinity`, `:844`) still type-checks with `easeAt`, `easing` and `easeEnded`. [computed: `tc/thin.ts`, clean under `--strict`; under Node `easing(null, …)` and `easeEnded(null, …)` are false, `fadeOutAt(null, …)` is 1, and an ease at rest (`since` −Infinity) gives level 1, not easing, not ended.] The two conventions now name two different states, an ease at rest since forever and a one-way fade not yet begun, and each helper handles both. Nothing more is needed. |
| DRY-R8-2 | yes | `narrowScreen`'s doc names its two readers (`:845`). `LaunchGate.narrow` has a doc saying it is filled from `narrowScreen` (`:2133-2134`), and the `launchGate` bullet says it is not a second width test (`:2330`). P8's files (`:3204`), 7.2's P8 row (`:2933`), P8's "Blocked on" (`:3193`) and P6's rollback (`:3164`) follow. |
| DRY-R8-3 | yes | 6.6 says "`settleQuiet` keeps its own copy (8.4)" (`:1690`). 8.4's `quietBlend` row is the one statement of the R-20 exception (`:3387`, "only if B-1 fails, R-20's cache of the zone arrays inside `quietBlend`, keeping its output"). R-20 cites it (`:3565`). 8.3's I8 (`:3365`, "No `quietBlend` cache (R-20)") reports the veil's answer and agrees. |

## The restructure and round 8's other changes, through this lens

- **Stale split content.** Only section 3's history sentence remains: "D10 and D11 went with the wait for the veil commit" (`:157`). 8.1's "What the old checkpoint V did …" went with C66. Nothing an implementer acts on.
- **Lost content.** Nothing an implementer needs. Every single owner round 8's DRY report listed still holds:
  - `ZONE_REACH` from `QUIET_REACH` (`:1395`);
  - the moved `sameRects` with `headroom` (`:1495`);
  - `quietEasing` reused by `demandNow` (`:1192`, `:1215`);
  - 8.4 as the one veil rule (`:3370`), which 4.4 and 7.0 cite.
- **Round 8's new content.**
  - `clearOf` reuses the veil planner's own `nearCopy: false` test (`segmentTouches` grown by `QUIET.feather`, `meteors.ts:226-228`) on a second list, so the veil's rule is not re-implemented.
  - The nine bars sit once, in 6.9 (`:2255`). AC-38, H9 and R-10 cite it, and the numbers agree.
  - The `SkyMotion` doc's growth from P5 to P8 is stated once (`:1957`), and the phases' file lists follow it.
  - The new rollback notes agree with 7.2's map.
- **Still true.** Nothing re-implements a veil export:
  - `transientFade` calls `scrollKept`;
  - every transient draws through `transientQuietFactor`;
  - `inkBudget`, `budgetKeeps`, `headGain` and `INK_BUDGET` are read only inside the veil's own code.

  No config is shared between the worker and the main thread.
- **Two exceptions, found this round.**
  - One fact round 8 moved, which guard keeps shooting stars off the rails, keeps a stale copy in a veil doc (DRY-R9-2).
  - The launch gate the plan ports from `updateMeteor` now rebuilds, on every tick, the zone list cf4d7b8 builds once per launch attempt (DRY-R9-1).
- **Re-grounded references.**
  - Of the citation script's 59 matches, every real sky citation resolves to the code the text describes. The others are ratios such as `4.3:1`, references to the Markdown docs, and the two bare references below.
  - The bare worker and planner references in 6.1, 6.2, 6.6, 6.9 and 6.10, checked by hand, are all right.
  - Two bare references that round 8 added sit after another file's explicit reference, so they point at the wrong file (DRY-R9-3).

## Verdict

**Pass.** No blocking or major finding. Three minor findings, each cheap and clearly right.

## Findings

### DRY-R9-1 (minor): the launch gate builds the quiet field on every tick, where cf4d7b8 builds it once per launch attempt

- **Section.** 6.9 (`LaunchGate`, "In the worker"); 6.2 (`tick`); 12.1 (R-20).
- **Problem.**
  - cf4d7b8's `updateMeteor` runs on every tick, but it builds the planner's field only after its due check and its holds (`sky.worker.ts:220-222`), at `:226`: about once per launch attempt.
  - P8 replaces it with `updateTransients(transients, random, t, launchGate(now))`, and `LaunchGate`, with an eager `field: SkyField`, is "filled ... every tick". So the field is built on every wake-up.
    - That means every animation frame while anything moves: `tick` runs on each refresh and draws only every k-th.
    - From P9 the gate calls `screenQuietZones` twice, once more for the rails as `pinned`.
    - The sleeping timer's guard builds a whole gate just to read `allowed`.
  - The field's `quiet` is the same list `quietBlend(t)` builds as `to` for the frame (`sky.worker.ts:268`). So the same zones are now derived twice per frame, and the rails a third time.
  - Every other per-tick state in the plan is reused (`frameState`, `driftGate`, `offset`, the camera, `corner`). R-20 counts only `quietBlend`'s allocations.
- **Evidence.**
  - `PLAN.md`:
    - `:2127` ("the worker fills it from its own state every tick") and `:2137` (`field: SkyField`);
    - `:2329` (the `updateTransients(…, launchGate(now))` call) and `:2331` (the field: `screenQuietZones(quiet, scrollY, pinned)`, "plus from P9 … `pinned: screenQuietZones([], scrollY, pinned)`");
    - `:2335` (the sleeping timer "armed only while `launchGate(now).allowed`");
    - `:1253`, `:1257` and `:1263-1265` (each animation frame runs `tick`, whose step 1 is "the shooting star"; step 3 draws only when due);
    - `:838`, `:848`, `:1024`, `:1195` and `:1336` ("reused", "no garbage");
    - `:3565` (R-20: "`quietBlend` allocations at 20 to 30 fps").
  - cf4d7b8:
    - `sky.worker.ts:203` (`tick` calls `updateMeteor`), `:220-222` (it returns before building a field), `:226` (the field), `:183` (the cheap `meteorsAllowed(now)` guard) and `:268` (`quietBlend`'s `to`, the same expression);
    - `scene.ts:60-69` (`screenQuietZones` builds new arrays and rect objects on every call).
  - [computed] `gate/gate2.mjs`, on the archived 1440 × 900 settled layout (25 quiet rects, 6 pinned) with cf4d7b8's `screenQuietZones` under Node 24.14:
    - per build: about 4.7 KB for a P8 gate, 6.1 KB for a P9 gate and 5.6 KB for a `quietBlend(t)`;
    - at one gate per tick: 355 KB/s at 60 Hz and 853 KB/s at 144 Hz, against `quietBlend`'s 110 to 166 KB/s at 20 to 30 drawn frames a second. That is 2 to 8 times the garbage R-20 tracks, and R-20's mitigation (a cache inside `quietBlend`) wouldn't touch it.
- **Fix.** Build the field when a plan needs it, as cf4d7b8 does.
  - `launchGate(now)` fills one reused gate object, as `frameState` and `driftGate` are.
  - Its `field` is built only when the launch step plans (step 2.3). Either a getter, which still satisfies `field: SkyField`, or a `fieldAt()` the step calls.
  - From P9 it pads the rails once and uses them both in `quiet` and as `pinned`.
  - The sleeping timer's guard reads `allowed` from the one helper the gate's `allowed` also reads (today's `meteorsAllowed`), not from a whole gate.
  - 6.9's `LaunchGate` doc then says the field is built only for a plan. R-20 needs no new row.

### DRY-R9-2 (minor): after P9, cf4d7b8's `copyReader` doc still names `METEOR.maxEndY` as what keeps shooting stars off the rails

- **Section.** 6.10 (`clearOf`, and the `METEOR` and `maxEndY` docs); 8.4 (the `mountSky.ts` row); P9's files.
- **Problem.**
  - Which guard keeps shooting stars off the side rails is a fact stated in several committed docs.
  - P9 moves it to `clearOf`, filled with `SkyField.pinned`, and rewrites the `METEOR` and `maxEndY` docs to say so. The veil's `copyReader` doc keeps "(METEOR.maxEndY)". That doc states the contrast precondition for the rails' hover and focus measurement.
  - By 6.10's own evidence, `maxEndY` alone doesn't keep P9's rightward paths off the right rail's link, which starts above it on six of the eight archived desktop layouts.
  - So after P9, two committed docs disagree about the guard, and the one stating the precondition names the guard that isn't enough. A maintainer who reads it could drop `clearOf` as redundant and reopen the 4.3:1 dip CA8-1 measured.
  - Nothing in the plan changes that doc: 8.4's `mountSky.ts` row says only "the measurement unchanged", and P9's files list no `mountSky.ts`.
  - `planMeteor`'s own doc ("below the navbar and above the side rails", `meteors.ts:265`) is a second copy, true from P9 only while the caller passes `clearOf`.
- **Evidence.**
  - cf4d7b8:
    - `mountSky.ts:122-124` ("keeps the headroom of the state it was measured in until the next measurement, which is harmless only while no flight reaches the rails (METEOR.maxEndY)");
    - `config.ts:281` (`maxEndY`'s doc);
    - `meteors.ts:265`.
  - `PLAN.md`:
    - `:2452` (P9's `maxEndY` doc: "clear of the bottom corners; planMeteor's `clearOf` keeps them off the side rails' copy");
    - `:2456` (the `METEOR` doc names `clearOf`) and `:2579` (`clearOf`'s doc);
    - `:2608` ("A rightward path … can reach the right rail's link, which starts above `maxEndY` on six of the eight archived desktop layouts … (`mountSky.ts:122-124`)");
    - `:3388` (8.4's `mountSky.ts` row) and `:3226-3238` (P9's files).
  - `REVIEW-LOG.md:168` (CA8-1: "`copyReader`'s caveat then still holds, so the veil session needs only CP-2's note"). The caveat holds, but its named guard changes.
  - A search of `PLAN.md` finds no other mention of `copyReader`'s doc.
- **Fix.**
  - In P9, `copyReader`'s parenthetical names the new guard, for example "(planMeteor's clearOf, which the launch fills with the padded rails)".
  - 8.4's `mountSky.ts` row lists this one doc edit beside "the measurement unchanged". P9's files add `mountSky.ts` for it, and P9's CP-2 note tells the veil session.
  - `planMeteor`'s doc, which P9 edits anyway with the signature, says "clear of the copy in `clearOf`" in place of "above the side rails".
  - `clearOf`'s doc stays the one full statement of the rule.

### DRY-R9-3 (minor): two bare line references added in round 8 follow another file's explicit reference

- **Section.** 6.1 (P2's removal of the parallax keys); 6.10 ("I2 also completes the end test").
- **Problem.** The restructure made the ambiguous bare references explicit, so that a bare `:n` reads as the file named just before it. Round 8 added two new ones that break this:
  - `PLAN.md:467`: "… their only reader is `renderSky.ts:100`), and the `LAYERS` doc (`:73`) drops …". The text means `config.ts:73`, but `renderSky.ts:73` is `SkyFrame.keep`'s doc.
  - `PLAN.md:2608`: "(`mountSky.ts:122-124`) … (the `nearCopy: false` test, `:226-228`)". The text means `meteors.ts:226-228`, but `mountSky.ts:226-228` is `measureLayout`.
- **Evidence.**
  - cf4d7b8 `config.ts:73` (the `LAYERS` doc's first sentence, with "scroll parallax") against `renderSky.ts:73` ("Share of the catalog to draw at this size and quality.").
  - cf4d7b8 `meteors.ts:226-228` (`near`, `mayDim`, `if (mayDim && (fireball || !copyAllowed)) continue`) against `mountSky.ts:226-228` ("Document height and quiet rects; …", `measureLayout`).
  - `dry-gate-r9/r8-reviser.wdiff`: both added by round 8 (CONV8-3 and CA8-1).
  - `REVIEW-LOG.md:151` (the restructure: "ambiguous bare refs made explicit"). The bare-reference check flags only these two among 15 lines that mix files; the other 13 continue the same file.
- **Fix.** Write `config.ts:73` and `meteors.ts:226-228`.

## Summary

- **Round 8's fixes.** All three DRY fixes landed with no regression.
  - The ease helpers share one "not begun" convention for one-way fades, clean under `--strict`.
  - The launch gate's `narrow` is `narrowScreen`.
  - 8.4 is the one statement of what may change in a veil symbol, R-20's cache included.
- **The restructure.** Every single owner in this lens still holds, and nothing an implementer needs was lost. Nothing re-implements a veil export, and no config is shared between the worker and the main thread.
- **Three minor findings:**
  - **DRY-R9-1.** P8's launch gate rebuilds the planner's zone list on every tick, duplicating `quietBlend`'s per-frame `to`, where cf4d7b8 builds it once per launch attempt. That is 2 to 8 times the garbage R-20 tracks. Build the field only when a plan reads it.
  - **DRY-R9-2.** P9 moves the rails' guard to `clearOf`, but the veil's `copyReader` doc, which states the precondition, keeps naming `METEOR.maxEndY`. Update it in P9 and list the edit in 8.4.
  - **DRY-R9-3.** Two bare references added in round 8 resolve to the wrong file. Make them explicit.

## Noted, not raised

- **Farewell meteors.** If D4 picks them, 6.12's row now carries its own option list ("planned by `planMeteor` under the full veil, the lease and `clearOf`", `:2753`). That repeats what `planMeteorTransient` already wires: the steers, the pass order, `ink` and the rails as `clearOf` (`:2097-2103`). Saying `plan: planMeteorTransient` would keep one meteor launch path.
  - Raised as a note in rounds 7 and 8, and round 8's `clearOf` edit is the first actual copy. It is still a could kind outside D4's default, and how P10's fireball decision reaches it would need settling. So it stays a note.
- **The comet's row** is the plan's longest line (551 words, `:2754`), for a could kind the brief asked to keep brief.
  - Its placement uses "0.4 viewport heights", the value of `SCENE.heroLaunchMaxScroll`, as a literal beside the named `SCROLL_CANCEL.to` and `ZONE_REACH`.
  - Its light restates `transientFade`'s composition (round 8's note).
- **`ZONE_REACH`'s doc** says "Every 'clear of copy' test reads it" (`:1393`). But `segmentClear` reads `quietAt`, and `clearOf` reads the veil's `QUIET.feather`. All three are 40 px from a padded zone, so no value can drift; only the doc overclaims.
- **`pickVisitSky(random, field)`** has no narrow input, so "never on narrow screens" will test `field.width <= NARROW_MAX_WIDTH`. cf4d7b8's `planFlight` and `planMeteor` already do the same (`meteors.ts:193`, `:271`). Passing `context.narrow` would keep the model side on the gate's one test.
- **8.4's `METEOR` row** lists four re-documented keys (`:3380`). 6.10 rewrites seven docs, adding the flight block, the narrow block and the train (`:2447-2454`). It is a summary, not a contradiction.
- **Still true from round 8:**
  - "a lease holder is active" is written in three places;
  - degrees per second to CSS px per second is written twice;
  - `SCROLL_CANCEL`'s 12 and 24 px recur in prose;
  - section 3's D10 and D11 history sentence remains.
- **Maps.**
  - `ac-map.mjs` finds the same three items as rounds 7 and 8: P12 says "its acceptance item".
  - `h-map.mjs` finds the same four: H2's P6 and P7 via "the kill-switch identity (P1)", P0's baseline lists, and P6's use of H6's medians.
