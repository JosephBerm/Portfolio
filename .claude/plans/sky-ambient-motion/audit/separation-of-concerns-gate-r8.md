# Separation of concerns: gate round 8

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 8. I check that round 7's four SoC fixes landed (now through the post-commit restructure), look for regressions, check the restructure itself through this lens (anything stale from the old split, anything lost that an implementer needs, the re-grounded references), and sweep the rest of `PLAN.md`. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as restructured on cf4d7b8 (3,664 lines, saved 22:00).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, and `COORDINATION.md` in full, including "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree", which the task makes authoritative.
  - `REVIEW-LOG.md` (the round 7 rows and "Post-commit restructure (cf4d7b8)") and my round 7 report.
  - The code at cf4d7b8, read from the read-only checkout `.claude/worktrees/sky-baseline-cf4d7b8`.
  - The pre-restructure copy `PLAN.before-restructure.md` in the session scratchpad, only to see what the restructure changed.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky`, and React UI in the pause control;
  - the protocol as the only contract between threads;
  - the scheduler, the kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the ownership split with the veil session, now that its commit is the baseline: use its exports, extend them through the agreed options, never its private helpers;
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout. One throwaway script lives in the scratch folder (`soc-gate-r8/deps.mjs`). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files and `COORDINATION.md` in full, then all of `PLAN.md`.
2. Checked each round 7 SoC disposition against the restructured text (table below).
3. Read cf4d7b8's `sky.worker.ts`, `renderSky.ts`, `scene.ts`, `mountSky.ts` and `protocol.ts`, and the relevant parts of `config.ts` and `meteors.ts`. Checked every `file:line` that `PLAN.md` cites in those files (about 70 citations).
4. Grepped `PLAN.md` for leftovers of the old split (V, PF, CP-0, CP-3 to CP-5, D10, D11, 8.5 to 8.7, "hands-off", "overlap", "rebase") and compared the changed passages with the pre-restructure copy.
5. Extracted every import line from the section 6 sketches and checked them against 5.2 and AGENTS.md: no runtime cycle, worker files import only `@/lib/sky/*` by file, and the main thread imports only types and `color.ts` from `src/lib/sky`.
6. Ran `soc-gate-r8/deps.mjs` on Node 24: for each phase, the later phases that 7.2's "Depends on" column makes depend on it, against the phases its Rollback note names.

## Round 7's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC7-1 | Yes; its blocking part is moot | The veil commit is the baseline, so there is no hands-off list or rebase left (`COORDINATION.md`, "Committed: cf4d7b8": clear to build on it). Part (d) landed: `demandNow`'s `fading` line uses the veil's `quietEasing(t)` (1215), 6.2 says so (1192), and so does 8.4's row (3390). No second quiet-ease test remains: no `easing(layoutAt, QUIET.ease, t)` anywhere. |
| SOC7-2 | Moot | 8.6 and CP-0 are gone; the `gather` call in `frameAt` sits in 6.1 (889) and P6's files (3142). |
| SOC7-3 | Yes | I9 is answered (8.3, 3373), and T3 states the never-lease contract: `to` and `next`, drawn radius at most `QUIET.padding` (300). `bodyShowing` replaces `cometShowing` (2215, 2759, 3316). D12 keeps the hold as a look choice (170). |
| SOC7-4 | Yes | `scene.ts` and `satellites.ts` are in 5.1 (321, 331) and P12's files (3316); `SCENE.endLaunchLevel` sits beside `heroLaunchMaxScroll` (319, 2758, 3316). The sleeping timer's guard is named (2339), and with farewell meteors `allowed` keeps only "a launch scene", so a worker asleep while reading keeps no timer (2758). |

## The restructure, through this lens

- **Nothing stale from the split.** No V, PF, CP-0, CP-3 to CP-5, D10, D11, 8.5 to 8.7, "hands-off", "overlap" or "rebase" wording is left. The one mention of "the old checkpoint V" (3346) says where its steps went.
- **Nothing an implementer needs was lost.**
  - The old hotspot table's facts are 8.4's rows.
  - The kill-switch identity is in P1 (2987), and P2, P6 and P7 rerun it.
  - The crossing measurement is in P9 (3255, 3256).
  - The veil's still-binding rules sit in 4.4 and in the invariants T1 to T4: `veiledFrom` unchanged, one scroll cancel (`scrollKept`), `transientQuietFactor` for every transient, one ink lease, and 5 s per transient. So do the veil's three asks for P9 (8.4).
- **Re-grounded references.** Every citation I checked matches cf4d7b8, for example:
  - `sky.worker.ts:92-98`, `:135-152`, `:143-144`, `:163-165`, `:171-187`, `:183`, `:212-238`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:467-493`, `:503-509`, `:510-524`, `:535`;
  - `renderSky.ts:38`, `:39`, `:48`, `:64`, `:71-72`, `:93`, `:100`, `:107`, `:113`, `:120`, `:124`, `:127`, `:155`, `:237`;
  - `mountSky.ts:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:211`, `:214`, `:310-314`, `:316-326`, `:328-335`, `:332`;
  - `scene.ts:11-18`, `:20-23`, `:30`, `:36`; `protocol.ts:32-38`;
  - `config.ts:58-59`, `:78-80`, `:170`, `:171`, `:222`, `:231-232`, `:247-250`, `:262-271`, `:305`;
  - `meteors.ts:195-196`, `:203`, `:204-207`, `:208-212`, `:213`, `:215-220`, `:224`, `:226-228`, `:229`, `:236`.
- **Boundaries.** The sketches' imports match 5.2:
  - `transients.ts` imports the specs, and the kind modules import only types back, so there is no runtime cycle;
  - `quietIndex.ts` takes only a type from `meteors.ts`;
  - the worker files import only `@/lib/sky/*` by file;
  - `skyPause.ts` imports nothing from `src/lib/sky`.

  The veil's private helpers (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, `quietEasing` outside the worker) are never imported.

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC8-1 | minor | P8 now depends on P6 for a generic fade helper, but P6's rollback (and P3's, P4's and P5's) doesn't name P8 |
| SOC8-2 | minor | 8.4 keeps the veil's quiet-ease code unchanged, but 6.6 and R-20 invite edits to `settleQuiet` and `quietBlend` |

### SOC8-1 (minor): the transient core depends on the drift phase for `fadeOutAt`, and the rollback notes don't say so

**Section.** 5.1 (the `pacing.ts` row); 7.2 (the P8 row); P3, P4, P5 and P6 (Rollback); P5 and P6 (Files); P8 (Blocked on).

**Problem.**

- **A misplaced helper couples two tracks.** `fadeOutAt` is the one-way fade that the transient core uses for the pause fade (`transientFade`, from P8) and the comet for its fades (P12). It lands in P6, with the drift, because P6's thin fade happens to read it first.
  - So the restructure, which made dependencies explicit, now makes P8 depend on P6: "P3, P5 and P6 (`fadeOutAt`)".
  - The transient track (P8 to P12, the user's second request) needs nothing else from the drift phase. The other eases (`Ease`, `easeAt`, `easing`, `easeEnded`) already land in P5.
- **The rollback notes contradict the map.** 7.0 asks each phase to name "its revert, together with the later phases that depend on it". By 7.2's "Depends on" column:
  - P6's rollback still reads "(P7 depends on it)", although P8 lists P6 directly and P13 is "blocked on P6".
  - P5's reads "(P4 and P6 depend on it)", although P8 lists P5 directly.
  - P3's reads "(P4 to P7 and P13 depend on it)", although P8 lists P3 directly.
  - P4's reads "(P6 depends on it)", although P8's launch gate is built from `meteorsAllowed`, which P4 moves onto `isIdle(presence, now)` (6.6, 6.9).
- **The cost.** An implementer who reverts P6 after P8 has landed, as P6's note allows (say AC-17 or R-5 fails), removes `fadeOutAt` from under `transients.ts` and breaks the build. Type-check would catch it, so this stays minor.

**Evidence.**

- `PLAN.md`:
  - 323 (5.1: `fadeOutAt` (P6));
  - 1990 and 2191 to 2193 (`transients.ts` imports `fadeOutAt`; `transientFade`);
  - 2258 ("`cancelFade` ... is the pause's fade");
  - 2843 (7.0's rollback rule);
  - 2938 and 2943 (7.2: P8 "P3, P5, P6 (`fadeOutAt`)"; P13 "P6 and device tests");
  - 3105 and 3138 (P5's and P6's `pacing.ts` lines);
  - 3197 (P8 "Blocked on");
  - 3063, 3093, 3130 and 3168 (the P3, P4, P5 and P6 rollback notes).
- The restructure added the dependency without touching P6's note. Before it, P8 depended on "V or PF, P3, P5", and P6's rollback read the same (`PLAN.before-restructure.md`:2967, :3200).
- `soc-gate-r8/deps.mjs` on `PLAN.md` gives these dependents and named phases:

  | Phase | Dependents by 7.2 | Rollback names |
  |---|---|---|
  | P3 | P4 to P13 | P4, P7, P13 |
  | P4 | P6 to P13 | P6 |
  | P5 | P4 and P6 to P13 | P4, P6 |
  | P6 | P7 to P13 | P7 |
- 6.6 (1635) and 6.9 (2334): P4 moves `meteorsAllowed` onto `isIdle(presence, now)`, and P8 builds `launchGate` from it.

**Fix.**

- Preferred: land `fadeOutAt` in P5 with the other eases. It is first of all the pause's fade, and P6's thin fade reuses it. Update:
  - 5.1's `pacing.ts` row and P5's and P6's `pacing.ts` lines;
  - P8's "Blocked on" and 7.2's P8 row, to P3, P4 and P5 (its launch gate reads P4's presence).

  The transient core then no longer waits on the drift phase for a helper.
- In any case, make each rollback note name its dependents:
  - P3: "every later phase";
  - P4: "P6 and P8 to P12";
  - P5: "P4, P6 and P8 to P12";
  - P6: "P7 and P13", plus "P8 to P12" if `fadeOutAt` stays in P6.

### SOC8-2 (minor): 8.4 keeps the veil's quiet-ease code unchanged, but two passages invite edits to it

**Section.** 6.6 ("The last frame"); 12.1 (R-20); 8.4 (its rule and the `quietBlend`, `applyLayout`, `settleQuiet` row); 7.0 (the veil-symbol rule).

**Problem.**

- **8.4 says unchanged.** It lists `quietBlend`, `applyLayout`, `settleQuiet`, `pendingLayout`, `rebuildHaze` and the `layout` branch as "unchanged, except that the `layout` branch's `retryMeteors` becomes `retryTransients`". 7.0 makes 8.4's rule binding: "use them, extend them through options, never rewrite them".
- **Two passages invite edits.**
  - 6.6 ends its `easeEnded` paragraph with "`settleQuiet` may adopt it". Before the restructure this read "after V, `settleQuiet` may adopt it", a post-rebase cleanup. Now it is an open invitation to rewrite a veil function that has two jobs since cf4d7b8: applying a waiting layout and asking for the ease's last frame (`sky.worker.ts:295-302`).
  - R-20's mitigation ("cache the zone arrays per scroll and layout, keeping `quietBlend`'s output (8.4)") cites 8.4 for a cache that 8.4 never mentions. `quietBlend` builds its zone arrays itself (`sky.worker.ts:264-272`). A cache inside it is an edit the row rules out, and nothing says whether it may live there or must wrap it.
- **The cost.** The implementer gets two answers about whether the veil's quiet-ease code may change. The adoption gains one line of DRY at the price of a veil rewrite that CP-1's future re-checks then have to diff around.

**Evidence.**

- `PLAN.md` 1690 (6.6), 2821 (7.0), 3377 and 3394 (8.4), 3576 (R-20).
- `PLAN.before-restructure.md`:1714 (6.6 said "after V").
- cf4d7b8 `sky.worker.ts:264-272` (`quietBlend`) and `:290-302` (`settleQuiet` and its doc).

**Fix.**

- Drop 6.6's "`settleQuiet` may adopt it", so `settleQuiet` keeps its own test, which matches `easeEnded` today.
- Make 8.4's row the one statement: "unchanged, except the `layout` branch's `retryTransients` and, only if B-1 fails, R-20's cache inside `quietBlend`, which keeps its output (checked by H3 and AC-16 (b))".

## Summary

**Verdict: pass.** No blocking or major finding in this scope.

Round 7's four SoC fixes landed or became moot when the veil commit became the baseline. The quiet ease now has one definition (`quietEasing(t)` in `demandNow`), I9 is answered with its contract in T3, and the farewell scene report names its files, its `SCENE` key and the sleeping timer's guard.

The restructure leaves nothing of the old split and loses nothing an implementer needs. Its re-grounded references match cf4d7b8. The boundaries hold:

- the drift, frame and launch policy is pure in `camera.ts`, `pacing.ts` and `transients.ts`, and the worker gathers and wires;
- each kind lives in its own module, with no import cycle;
- the protocol is the only channel between threads (a pause is `motion: 'reduced'`, the control appears on `ready`);
- the React control reads a non-React store, and `mountSky` only forwards facts;
- veil code is used through its exports and the options agreed for P9.

Two cheap minors remain:

- SOC8-1: a fade helper ties the transient track to the drift phase, and four rollback notes miss P8.
- SOC8-2: 8.4's "unchanged" for the quiet-ease code against two invitations to edit it.

**Noted, not raised:**

- **`pickVisitSky`'s search budgets and threshold** (up to 20 on-screen points, 50 resamples, 8 of 16 probes) live only in prose. The codebase's precedent (`METEOR.attempts`, `METEOR.radiantTries`, `SATELLITE.attempts`) makes them `RADIANTS` keys, or else documented module constants like `quietIndex.ts`'s `TILE`.
- **P12's comet has no owner for its start decision** (1 visit in 8 to 10, the hero, full motion, "only while no lease holder flies"). Without one it lands in the worker, which would read `transients.active` itself. A pure start rule in `bodies.ts` and a `leaseHeld(schedule)` export beside `inkLeaseFree` would keep both out. This affects a could kind only, and D4's default is none.
- **"The one place that picks `CLEAR_SKY_KEEPS`"** (T3 and `drawTransient`'s doc): the comet's drawer picks it too (6.12).
- **8.4's Phase column**: it gives P2 and P3 for `frameMode`, `tick` and `quietEasing`, though `tick` also changes in P5, P6 and P8. Its `SceneLevels.meteors` row omits P12's `launchScene`.
- **6.2's heading range** `:154-209` also spans `meteorsAllowed` (`:162-165`), which P3 keeps. The heading names the replaced functions, and the range was as loose before the restructure.
- **Carried from round 7:**
  - the "at each frame decision" wording in 4.2's `FrameDemand` row and DR2;
  - `launchGate(now)` building `field` on every tick (an efficiency point).
- **For other lenses:**
  - `easing(thinnedAt, …)` and `easeEnded(thinnedAt, …)` take a number, while `thinnedAt` is `number | null` (6.2's table, P6's recommended block, 3155).
  - The `quietIndex.ts` sketch imports `quietAt` and `Point` and declares `SEGMENT_STEP`, which only `segmentClear` (P11) reads. P1 copying it gets `no-unused-vars` warnings: lint warns but doesn't fail (`eslint.config.mjs:13`).
- **Outside `PLAN.md`:** `harness/README.md` still cites "8.5 step 5", as `REVIEW-LOG.md` notes.
