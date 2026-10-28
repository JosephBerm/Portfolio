# Separation of concerns: gate round 9

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 9. I confirm that round 8's two SoC fixes landed (SOC8-1 as partly applied, SOC8-2), check what else the round 8 reviser changed for regressions in this lens, recheck the restructure, and sweep the rest of `PLAN.md`. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as revised after round 8 (3,653 lines, saved 23:11).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, and `COORDINATION.md` in full. Its "Committed: cf4d7b8", "Landed in the working tree" and "Answers to the planning session's questions" sections are authoritative.
  - `REVIEW-LOG.md` (the round 8 rows) and my round 8 report.
  - The code at cf4d7b8, read from the read-only checkout `.claude/worktrees/sky-baseline-cf4d7b8`.
  - `PLAN.before-r8.md` in the session scratchpad, only to diff what round 8 changed.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky`, and React UI in the pause control;
  - the protocol as the only contract between threads;
  - the scheduler, the kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the veil's code used through its exports and extended through options (8.4), never its private helpers;
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout. Two throwaway scripts live in the scratch folder `soc-gate-r9/` (`deps.mjs`, `imports.mjs`). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files and `COORDINATION.md` in full, then all of `PLAN.md`.
2. Diffed `PLAN.before-r8.md` against `PLAN.md` to list round 8's changes, and checked each one through this lens.
3. Checked the SOC8-1 and SOC8-2 dispositions against the text, and reran `deps.mjs` (7.2's "Depends on" graph against each phase's Rollback note).
4. Read cf4d7b8's `sky.worker.ts`, `renderSky.ts`, `scene.ts`, `meteors.ts`, `mountSky.ts` and `protocol.ts`, and the relevant parts of `config.ts`, `catalog.ts`, `skyAssets.ts`, `utils.ts`, `Navbar.tsx`, `README.md` and `eslint.config.mjs`. I checked about 130 `file:line` citations, the ones round 8 added among them.
5. Extracted the import lines of every `src/lib/sky` sketch (`imports.mjs`) and checked the runtime import graph for cycles and against 5.2's list.
6. Compared the ownership statements (4.1, 4.2, 4.3, 5.1, 5.2, 8.4) with section 6 and each phase's Files list.

## Round 8's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC8-1 | Yes, as applied | Each rollback note now names its dependents from 7.2's graph: P3 "every later phase" (3058), P4 "P6 and every later phase" (3088), P5 "P4 and every later phase" (3125), P6 "every later phase ..., P8 through `narrowScreen` and `fadeOutAt`" (3164). 7.2's P8 row (2933) and P8's "Blocked on" (3193) add P4. `deps.mjs` finds no phase whose note misses a dependent. The rejected part (moving `fadeOutAt` to P5) stands, since there is no new evidence against it: P8 also needs P6's `narrowScreen` (845, 2133, 2330), so the move would not cut P8's dependency on P6, and section 6's first-reader rule (400) puts `fadeOutAt` with the thin fade. |
| SOC8-2 | Yes | 6.6 says `settleQuiet` keeps its own copy (1690). 8.4's row makes R-20's cache inside `quietBlend`, keeping its output, its one exception (3387). R-20 cites it (3565), and I8 agrees (3365). |

## Round 8's other changes, through this lens

- **`PlanOptions.clearOf` and `SkyField.pinned`** (2580, 1999 to 2002, 2331, 2608).
  - They extend a veil type through an option, which 8.4's rule allows and its `meteors.ts` row lists (3374).
  - Inside `meteors.ts`, `fit` can reuse its private `segmentTouches` with `QUIET.feather`, as its `nearCopy: false` test does (cf4d7b8 `meteors.ts:226-228`).
  - The worker fills `pinned` from facts it already holds (`pinned` at `sky.worker.ts:48`, `screenQuietZones` at `scene.ts:60-69`), and the meteor kind passes it on. `transients.ts` stays kind-agnostic: the field carries a fact about the layout.
  - The only new import edge is a type import of `SkyRect` into `transients.ts`.
- **`LaunchGate.narrow` from `narrowScreen`** (845, 2133, 2330): one width test in the worker instead of today's second one (`sky.worker.ts:221`). The planner's own tests (`meteors.ts:193`, `:271`) stay the veil's.
- **`easing` and `easeEnded` take `number | null`** (1075 to 1083): one "not begun" convention with `fadeOutAt`, all pure and in `pacing.ts`.
- **Docs that move with their phase:** the `SkyMotion` doc grows from P5 to P8, the idle docs are written once in P4, and the `ADAPT` doc's drift cap lands in P6. The protocol stays types only.
- **P9's harness adaptation** (3255) stays outside the repository and plans through `METEOR_SPEC.plan` on a `PlanContext`, the same seam the scheduler uses.

## The restructure, rechecked

- **Nothing stale.** No V, PF, CP-0, CP-3 to CP-5, 8.5 to 8.7, "hands-off" or "rebase" wording is left, beyond line 7 (the planning branch) and line 157 (why D10 and D11 are gone).
- **Nothing lost.** Round 8 cut 8.1's list of where checkpoint V's steps went. Each item survives in the AC table's phase column (AC-16 (b) in P3 and P6, AC-19 and AC-38 in P8 and P9, AC-40 in P8, AC-30 and H3 in P1) and in P1's and P9's verification.
- **Re-grounded references.** Every one I checked matches cf4d7b8:
  - `sky.worker.ts:1-5`, `:17-22`, `:48`, `:65-72`, `:92-98`, `:100-128`, `:111-113`, `:117`, `:135-152`, `:143-144`, `:154-160`, `:163-165`, `:167-209`, `:183`, `:186`, `:190-193`, `:203`, `:212-238`, `:221`, `:222`, `:226`, `:227-231`, `:233`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:354-357`, `:361`, `:368-379`, `:373`, `:411`, `:435`, `:436`, `:446`, `:467-493`, `:475-479`, `:486`, `:487`, `:503-509`, `:507`, `:510-524`, `:513`, `:514`, `:519`, `:531`, `:533`, `:535`;
  - `renderSky.ts:38`, `:39`, `:48`, `:64`, `:71-72`, `:93`, `:100`, `:107`, `:113`, `:120`, `:121-125`, `:124`, `:127`, `:155`, `:237`;
  - `scene.ts:11-18`, `:20-23`, `:30`, `:36`; `protocol.ts:32-38`; `catalog.ts:143`, `:169-177`;
  - `mountSky.ts:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:122-124`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`;
  - `config.ts:58-59`, `:73`, `:78-80`, `:170`, `:171`, `:179`, `:222`, `:223-237`, `:231-232`, `:247-250`, `:253`, `:262-271`, `:266`, `:281`, `:286-290`, `:299`, `:305`, `:313`, `:321`;
  - `meteors.ts:39-40`, `:195-196`, `:203`, `:204-207`, `:206`, `:208-212`, `:213`, `:215-220`, `:216-217`, `:224`, `:226-228`, `:229`, `:236`;
  - `skyAssets.ts:26-27`, `:45-55`, `:57-60`, `:63-78`, `:81-120`; `utils.ts:20`; `Navbar.tsx:1`, `:14`, `:31`, `:79`, `:88`; `README.md:75`, `:80`; `eslint.config.mjs:13`.
- **Boundaries.**
  - `imports.mjs` finds no runtime cycle among the sketches. Its one reported cycle, `config -> config`, is a parsing artifact of the block that holds both `GapLaw` (config) and `gaps.ts`.
  - Every import stays within 5.2's list. Kind modules import `./transients` as statement-level `import type`.
  - The main thread imports only types from `src/lib/sky`, and `skyPause.ts` imports nothing from it.
  - No sketch imports a veil private helper (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, or `quietEasing` outside the worker).

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC9-1 | minor | The comet's start rule has no owner, and "a lease holder flies" has no shared query, so the worker would rederive the ink lease |
| SOC9-2 | minor | 8.4's Phase column misses the phases that extend `tick`, `SkyFrame`, the renderer's imports and `draw` |

### SOC9-1 (minor): the comet's start rule has no owner, and its half of D12's hold would rederive the lease in the worker

**Section.** 6.12 (the static comet row); P12 (Files per kind, Steps); 5.1 (the `bodies.ts` row); 6.9 (`inkLeaseFree`, steps 2.2 and 2.3); AC-25; H7.

**Problem.**

- **No owner.** The comet starts to show only while no lease holder flies, on 1 visit in 8 to 10, in the desktop hero, never under reduced motion, anywhere up to 0.4 viewport heights (6.12). The owners named so far:
  - `bodies.ts`: placement, fades, box test and launch scroll (5.1, 6.12, P12);
  - the worker: the comet's state, its pause time, `bodyShowing` in `launchGate`, and its hand-off to `renderSky.ts` (P12).

  Nobody owns the decision to start. By default it lands in the worker as inline policy, against section 4 ("each invariant has one place that enforces it") and 6.1 ("the worker keeps only the mechanism and its state; the policy is the pure functions").
- **No lease query that fits.** The only lease export is `inkLeaseFree(schedule, now)`, and it is also false during the crossing cooldown. So the worker has two choices, both poor:
  - read `transients.active.some((t) => t.nearCopy)`, a third copy of the lease test beside `inkLeaseFree` and step 2.2's inline test;
  - reuse `inkLeaseFree`, which keeps the comet from starting for 55 s after the reveal and after every crossing (P9's cooldown). 6.12 doesn't ask for that.
- **No check.** P12's step 1 checks the comet's box only, AC-25 has no hold item, and H7's D12 item covers transients only. So the comet's half of D12's hold "both ways" (T2, T3, and D12: "The comet keeps the hold either way") is neither enforced in one place nor tested.
- **Why minor.** It is a could kind, and D4's default is none.

**Evidence.**

- `PLAN.md`:
  - 174 (section 4's rule) and 832 (6.1: the worker keeps only the mechanism);
  - 170 (D12), 299 and 300 (T2, T3);
  - 332 (5.1's `bodies.ts` row);
  - 2191 to 2193 (`inkLeaseFree`: `now >= schedule.crossingAfter && !schedule.active.some(...)`);
  - 2209 and 2210 (steps 2.2 and 2.3);
  - 2754 (6.12: "it starts to show only while no lease holder flies"; "1 visit in 8 to 10, desktop hero"; "`bodies.ts`, owns its placement, fades, box test and launch scroll");
  - 2899 (H7's D12 item, transients only);
  - 3315 and 3316 (P12's comet files; step 1's checks);
  - 3452 (AC-25).
- The same gap was noted, not raised, in my round 8 report. It still holds.

**Fix.**

- `transients.ts` exports `leaseHeld(schedule)`: true while an active transient has `nearCopy`. `inkLeaseFree` becomes `now >= schedule.crossingAfter && !leaseHeld(schedule)`, and step 2.2's D12 test reads it.
- `bodies.ts` owns the comet's start rule as a pure function of facts the worker gathers (the visit's draw, the hero scene, full motion, revealed, `leaseHeld`). 5.1's row and P12's comet files name it, and the worker only feeds it and keeps the state.
- P12's step 1 checks (or H7, with the comet's `bodyShowing` fed to the gate) add: the comet never starts while `leaseHeld`, and no lease begins while it shows.
- If `bodies.ts` computes the far band's mean nearness from `nearness()` (6.12), 5.2's import list gains `./catalog`.

### SOC9-2 (minor): 8.4's Phase column misses the phases that extend `tick`, `SkyFrame`, the renderer's imports and `draw`

**Section.** 8.4 (the rule's parenthetical, and the `renderSky.ts`, `frameMode`/`tick`/`quietEasing` and `frameAt`/`draw` rows).

**Problem.**

- **What the column is for.** 8.4 tells the implementer which veil symbols each phase extends, and CP-1 rechecks "8.4's rows" whenever a new sky commit lands (3349).
- **Three rows name fewer phases than the phases' own Files lists:**
  - `tick` ("P2, P3", 3383):
    - P5 adds the motion ease's last frame to `tick` (1690, 3101);
    - P6 adds `gather` and the thin fade's `easeEnded` (1263, 3138, 3151);
    - P8 swaps `tick`'s first line, `updateMeteor(now)` (cf4d7b8 `sky.worker.ts:203`), for the `updateTransients` call (2329).
  - `renderSky.ts` ("P1, P8, P9, P12", 3382). Answer 1 lists `SkyFrame` and the import lines whole (`COORDINATION.md`:176):
    - `SkyFrame` gains `offset` in P2, `twinkleTime` and the `time` doc in P4, and `thinFrom` and `thinLevel` in P6 (3002, 3073, 3136);
    - the imports change in P2 (`LAYER_NEARNESS`, `Vec`) and P11 (`CLEAR_SKY_KEEPS` and the satellite drawer, 3298).

    5.1's own `renderSky.ts` row already says "P1, P2, P4, P6, P8, P9, P11, P12" (336).
  - `frameAt`, `draw` ("P1 to P8", 3384): P12's comet hands off to `renderSky.ts` in `draw` (3315).
- **The rule's parenthetical** (3370) names P3's `frameMode` but not `tick`, which P3 also replaces (1250).
- **The cost.** At P5, P6 or P8, an implementer who reads 8.4 to see whether the phase touches veil code finds nothing for `tick`, the function whose `settleQuiet` call must stay before the frame decision. A CP-1 recheck before those phases skips the row too. Round 8 fixed the same drift in the `SceneLevels.meteors` row (CA8-4).

**Evidence.**

- `PLAN.md`:
  - 3349 (CP-1) and 3370 (8.4's rule);
  - 3382 to 3384 (the three rows);
  - 336 (5.1's `renderSky.ts` row);
  - 1250 (P3 replaces `tick`) and 1263 (`tick`'s step 1);
  - 1690 and 3101 (P5);
  - 3138 and 3151 (P6);
  - 2329 (P8);
  - 3002, 3073, 3136 and 3298 (`SkyFrame` and imports in P2, P4, P6 and P11);
  - 3315 (P12's `draw`).
- `COORDINATION.md`:176 (answer 1's `renderSky.ts` symbols); cf4d7b8 `sky.worker.ts:202-209` (`tick`).

**Fix.**

- In 8.4's Phase column:
  - the `renderSky.ts` row: "P1, P2, P4, P6, P8, P9, P11, P12", as 5.1 has it;
  - the `frameMode`, `tick`, `quietEasing` row: "P2, P3, P5, P6, P8";
  - the `frameAt`, `draw` row: "P1 to P8, P12".
- In the rule's parenthetical: "P3's `frameMode` and `tick`".

## Summary

**Verdict: pass.** No blocking or major finding in this scope.

Round 8's SoC fixes landed. The rollback notes now match 7.2's graph, the rejected `fadeOutAt` move stays rejected for the reason given (P8 needs P6's `narrowScreen` anyway), and the veil's quiet-ease code has one statement of what may change. Round 8's additions keep the boundaries:

- the rails guard is an option on the veil's planner, fed by a fact the launch gate carries;
- the narrow test is one worker flag;
- the ease helpers share one "not begun" convention.

The restructure leaves nothing stale. What round 8 cut survives in the AC table and the phases, and every cited line matches cf4d7b8. The sketches have no runtime import cycle and import nothing from the veil's private helpers.

Two cheap minors remain:

- SOC9-1: the comet's start rule needs an owner and a shared lease query.
- SOC9-2: 8.4's Phase column misses later edits to `tick`, `SkyFrame`, the imports and `draw`.

## Noted, not raised

- **The launch gate's field.** `launchGate(now)` builds its field on every tick, and from P9 that is two `screenQuietZones` arrays (2331). Today's `updateMeteor` builds one only once a launch is due and allowed (cf4d7b8 `sky.worker.ts:220-226`). A field built only when a kind plans, or cached per scroll and layout as R-20's is, would keep the per-tick gate cheap. Efficiency, carried from rounds 7 and 8.
- **`pickVisitSky`'s search budgets** (20 points, 50 resamples, 8 of 16 probes; 2526 to 2528) live only in prose. Carried.
- **"Every later phase"** in P3 to P6's rollback notes includes P12's planet, which needs only P2 (2937): a safe overstatement.
- **Labels.** 4.1's diagram labels `sameRects` "(ours)", while 8.4 lists it as a veil symbol. 4.2's `LaunchGate` row doesn't list `narrow`.
- **The farewell meteors' visit cap** of 2 (6.12) has no named place: `TransientSchedule.launched` counts every kind, and `TransientSpec` has no cap member. A could kind, for the completeness lens.
- **The camera law, twice.** The comet would apply the camera law in `bodies.ts` while stars apply it inline in `drawLayer` (C2: "the only place stars are offset"): one line, for a could kind.
- **Outside `PLAN.md`.** `harness/README.md:3` still cites "`PLAN.md` 8.5 step 5" and checkpoint V, and P9's verification sends the implementer to that README (3255).
