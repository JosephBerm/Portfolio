# Separation of concerns: gate round 12

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 12. I confirm that round 11's fix in this scope (SOC11-1, which landed with CG11-1 and DRY-R11-1) is in `PLAN.md` as its disposition says, look for regressions it or round 11's other edits brought into this lens, and sweep the rest of `PLAN.md`. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as revised after round 11 (3,657 lines).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md` and all of `COORDINATION.md`. Its "Committed: cf4d7b8", "Landed in the working tree" and "Answers to the planning session's questions" sections are authoritative.
  - `REVIEW-LOG.md` (Round 11, Gate round 11 and the earlier rows that touch the same text), my round 11 report, and CG11-1's report with its skeptic's notes (`drafts/check-r11-code-grounding.md:101-164`).
  - The code at cf4d7b8, read from this worktree's `src/` (the planning branch merged `origin/master` at cf4d7b8).
  - `PLAN.before-r11.md` in the session scratchpad, only to diff what round 11 changed.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky`, and React UI in the pause control;
  - the protocol as the only contract between threads;
  - the scheduler, the kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the veil's code used through its exports and extended through options (8.4), never its private helpers;
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout. Throwaway files live in the scratch folder `soc-gate-r12/`: `r11diff.txt` (the word diff of round 11's revision) and `imports.mjs` (round 11's import-graph script, rerun here). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files and `COORDINATION.md` in full, then all of `PLAN.md`.
2. Word-diffed `PLAN.before-r11.md` against `PLAN.md` (36 hunks) and checked each change through this lens.
3. Checked SOC11-1's disposition clause by clause against the text, and followed the fix into every section that names the decision step or the second argument (5.1, 6.9, 6.10, 6.12, P10, P12, H7).
4. Read cf4d7b8's `planFlight` and `planMeteor` (`meteors.ts:185-277`), the worker's `updateMeteor` and `planLaunch` (`sky.worker.ts:211-261`), `screenQuietZones` (`scene.ts:56-69`), the `METEOR` block (`config.ts:247-324`) and `SidePane.tsx`, to test the fix and the sweep's one finding against the code.
5. Reran `imports.mjs` on every sketch, then added the edges P10 and P12 imply in prose.
6. Traced a decided fireball through the decision step, `planMeteorTransient`, the launch step's T2 test, RD1's sky rule, D12's hold and P12's farewell and variant specs.

## Round 11's fix: did it land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC11-1 | Yes | Each clause of the disposition is in the text. **The step and the argument in P10:** P10's `meteorKind.ts` line (3271) makes `METEOR_SPEC.plan` "the decision step around `planMeteorTransient`, which gains its second argument"; P10's steps name it (3286); 6.9's doc and the comment above the signature give the argument, `Omit<PlanOptions, 'steer' \| 'nearCopy' \| 'ink'> = {}`, from P10 (2105-2109); 5.1's row dates it to P10 (328). **The fireball try keeps the sky:** it plans "with `{ fireball: true, flights: 'long' }` and the context's `nearCopy` false: a fireball flies only in clear sky, so its failure keeps the visit's sky" (3271), which matches RD1 (305) and `planMeteorTransient`'s own rule (2104-2105). **6.9's sketch:** `plan: planMeteorTransient` stays, with "From P10 the decision step around planMeteorTransient (P10's files)" above it (2117-2118). **P12:** the farewell spec passes `clearOf` and `starts` in that argument (3318, 328) and "never a fireball, since P10 decides those in `METEOR_SPEC.plan`, around that function" (2755). **The ordinary fallback has a home:** "If none fits, it plans an ordinary one, long flights over every steer before any short one (8.4, ask 1)" (3271), and H7 asserts that order on the recorded `planMeteor` calls (3288). |

**No regression in this lens.**

- **One module, one entry.** The decision step, `planMeteorTransient` and `MeteorMemory`'s last fireball all live in `meteorKind.ts`, and the scheduler still sees one `plan(context)` per kind (2054). So `transients.ts` stays kind-agnostic, and P10's only change there is the `sinceReveal` fact (3270).
- **The clear-sky try changes only the sky rule.** A `nearCopy: false` fireball try fits exactly the paths a fireball fits anyway: cf4d7b8 skips any candidate that may dim when it is a fireball or copy isn't allowed (`meteors.ts:228`), and `METEOR_PASS`'s trade is already off for fireballs (`:259-260`). So the derived context changes nothing but whether a failure clears the visit's sky.
- **T2 still has one enforcer.** The launch step judges a body against the context it passed (2223), so the decision step's derived context can't make a clear-sky fireball count as failed.
- **Imports.** P10 adds `METEOR_KINDS` and `type PlanOptions` to `meteorKind.ts`. Neither adds an edge toward `transients.ts`, and the cycle check is unchanged (below).

## Round 11's other changes, through this lens

- **`driftCap` and `PACING`'s drift caps move to P6** (CONV11-2; 323, 965, 1059, 3038-3039, 3134-3135): the policy stays pure in `pacing.ts`, and the worker's cap line is `Infinity` until P6 (1231). 7.0's doc rule covers `FrameState.cameraCap`'s doc before P6 (2826).
- **T3 and I9 scoped per kind** (CA11-1; 300, 3370): `drawTransient` is still the one place that picks `CLEAR_SKY_KEEPS`. One cross-reference drifted (see "Noted, not raised").
- **H7 and AC-20 per launch scene and `limit`** (CA11-2; 2901, 3451): the checks follow the gate's facts, and ownership is unchanged.
- **The comet's lean only with P7** (C74; 2756, 3319): `bodies.ts` reads `LEAN.reach` only when P7 exists.
- **P13's check in Safari** (NJ11-1; 3338): `mountSky` still owns the relay loop and cancels it in `destroy`.
- The rest (CONV11-1, CONV11-3, DRY-R11-2, DRY-R11-3, PHY11-1, PHY11-2, CG11-2, C73) changes docs, numbers or harness wording and moves no responsibility.

## The sweep

- **Imports.** `imports.mjs` finds no runtime cycle among the sketches. Runtime edges: `transients` to `config`, `meteorKind`, `pacing`, `scene` and (P11) `satellites`; `meteorKind` to `config`, `meteors`, `random`; `satellites` to `config`, `gaps`, `quietIndex`, `radiants`, `random`; `quietIndex` and `presence` to `config` and `scene`; `gaps` to `config`. Kind modules import `./transients` with statement-level `import type` (2082, 2685). By the text: P10 adds `meteorKind` to `config` (`METEOR_KINDS`); P12 adds `meteorKind` to `quietIndex` (`ZONE_REACH`), and `bodies` to `catalog`, `camera`, `pacing`, `quietIndex`, `scene` and `transients` (`leaseHeld`). Nothing imports `bodies.ts`, and none of those modules imports `meteorKind.ts` back, so no cycle appears.
- **Threads.** The main thread imports only types and `color.ts` from `src/lib/sky`; `skyPause.ts` imports nothing from it (1729); a pause reaches the worker as `motion: 'reduced'` (1958). The protocol stays the only contract.
- **Veil privates.** No sketch imports `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches`, and `quietEasing` stays in the worker.
- **The worker.** It still only gathers, feeds pure functions and keeps handles and state; 5.2's one-file rule for the orchestrator holds (357).
- **One new boundary gap** (SOC12-1): the farewell band tells the page's zones from the rails by object identity, a contract the `SkyField` type doesn't carry.

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC12-1 | minor | The farewell band relies on `SkyField.quiet` and `SkyField.pinned` sharing the rails' padded objects, but only the plan's prose says so, not the type that carries the field |

### SOC12-1 (minor): the farewell band relies on `quiet` and `pinned` sharing the rails' objects, which the `SkyField` type doesn't say

**Section.** 6.9 (`SkyField.pinned`'s doc; the worker's `field()` bullet); 6.12 (the farewell row); P12 (Files per kind, farewell meteors).

**Problem.**

- **The band finds the page's zones by identity.** From P12 the band's edge is "the top of the highest in-flow zone on screen: of `field.quiet` without `field.pinned` (the same padded objects, 6.9)" (6.12). That filter works only because the worker's `field()` pads the rails once and puts the same objects in both lists (6.9's worker bullet).
- **Two paddings would break it silently.** cf4d7b8's `screenQuietZones` makes a new object for every zone on every call (`scene.ts:60-69`). A field built the cf4d7b8 way for `quiet`, `screenQuietZones(quiet, scrollY, pinned)`, plus a second call for `pinned` holds different objects. Then the filter keeps the rails as "in-flow" zones.
- **The contract isn't on the boundary.** The interface between the field's builder (the worker) and its reader (the farewell spec in `meteorKind.ts`) is `SkyField`, whose `pinned` doc says only "also in `quiet`". The plan states the identity as a DRY detail of P9 (6.9) and as a parenthesis in 6.12, and the plan never reaches the implementing branch (7.0). So committed code would carry the invariant nowhere, and P9 has no reader that would notice a field built the other way.
- **The effect of a break.** On desktop the rails always show, so `room(field)`'s "no in-flow zone on screen" hold never fires, and the edge can come from a rail's top instead of Contact's. No named check reads the worker's own field in P12: H7 and P12's harness checks plan in fields the harness builds, and H13's case 7, the one that runs the worker's gate, is P8's.
- **Why minor.** P12 is a could (D4's default is none), 6.12 states the dependency for the P12 implementer, and the fix is one doc clause and one comment.

**Evidence.**

- `PLAN.md`:
  - 2002: `SkyField.pinned`'s doc, "The padded zones of copy pinned to the screen (the side rails), also in `quiet`: shooting stars keep clear of them (planMeteor's clearOf)."
  - 2339: "from P9 it pads the rails once (`screenQuietZones([], scrollY, pinned)`) for both `quiet` and `pinned` (6.10)".
  - 2755: "of `field.quiet` without `field.pinned` (the same padded objects, 6.9)", and "`room(field)` is false (a hold, never a failed plan) while no in-flow zone is on screen".
  - 3318: P12's farewell files name no change to `SkyField`'s doc or to the worker's `field()`.
  - 2825 (7.0): committed comments "say the reason in words, since the plan never reaches the implementing branch".
  - 2901 (H7's harness-built events) and 2907 (H13's case 7, "(P8) The launch gate, which H7's harness-built gates never reach").
- cf4d7b8: `scene.ts:60-69` (`pad` returns `{ ...zone, ... }` for every zone on each call); `SidePane.tsx:28` (the rails are `fixed bottom-0`, shown from `md`).
- `drafts/check-r11-code-grounding.md:66`: the edge "works by identity, because the gate pads the rails once for both lists".

**Fix.** Put the contract where the builder and the reader meet. In P12's farewell files (P9 may already write it, since P9 builds the lists that way):

- extend `SkyField.pinned`'s doc in `transients.ts`: "the same objects as the rails' entries in `quiet` (the gate pads them once), so `quiet` without them is the zones in the page's flow";
- give the worker's `field()` a comment saying why it pads the rails once;
- add both to P12's farewell file list.

If an explicit list reads better, `SkyField` could carry the in-flow zones itself (`flow`, with `quiet` built as `[...flow, ...pinned]`), so no reader depends on identity.

## Summary

**Verdict: pass.** No blocking or major finding in this scope.

- **Round 11's fix landed.** SOC11-1's decision step sits around `planMeteorTransient` in P10, with the second argument dated there. The fireball try plans in clear sky, so its failure keeps the visit's sky, and the ordinary fallback runs in ask 1's order with H7 asserting it. P12's farewell spec reuses the argument and never decides fireballs.
- **No regression.** The fix keeps the scheduler kind-agnostic and adds no import cycle, and T2 keeps one enforcer. Round 11's other edits move no responsibility across a boundary.
- **One cheap minor** (SOC12-1): the farewell band's identity filter needs its contract stated on `SkyField`.

## Noted, not raised

- **Farewell failures still re-pick the family's sky,** carried from round 11 with a new angle. Round 11 settled that a failure under a constraint unrelated to the sky proves nothing about it, and applied it to fireballs through `nearCopy` false (3271). A farewell failure in its narrow band still clears the sky (2104-2105, 2755), while step 2.3 treats the same null plan as proving nothing (2221). Two layers now read a farewell failure differently. I don't raise it: the kind is a could, a fresh sky may help the band, and the cost is a re-picked shower.
- **The fireball try's `flights: 'long'` is the caller's duty.** It follows from `planMeteor`'s fallback clearing `fireball` (2601-2602, 3271). A planner that ran no fallback pass for a fireball would carry that rule itself. But CG11-1's skeptic chose this shape, and H7 checks the order (3288), so I don't re-raise it.
- **T3's cross-reference drifted.** T3 says a burst's or earthgrazer's wake is "veiled only at its sampled stops (6.12)" (300), but round 11 cut that sentence from 6.12, which now says "T3 says what that guarantees for each" (2761). That is for the DRY or completeness lens.
- **`METEOR.radiantTries`' doc says "per launch"** (2455). A launch that decides a fireball calls `planMeteorTransient` twice, and each call draws its own fresh steers. That is a wording matter.
- **Unchanged from round 11:**
  - the comet's fade-in clock name;
  - the start box's clamp in two places;
  - `fading`'s terms in 6.2's sketch and table (1217, 1225-1235: no thin-fade or comet term);
  - 4.1's diagram, which lists `bodies.ts` with the kinds.
