# Check round 10: code grounding and feasibility

Checker: adversarial, lens "code-grounding". Date: 2026-10-28.

## Scope

- **Role.** Find real problems in `PLAN.md` through the code-grounding lens; no praise.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8", "Landed in the working tree"), `research/01-planning-brief.md`, `PLAN.md`, `REVIEW-LOG.md` (rounds 7 to 9 and the post-commit restructure), round 9's report in this lens, R2 §10, R3 §8, the archived veil harness, and the code at cf4d7b8 (`.claude/worktrees/sky-baseline-cf4d7b8`, the baseline for every `file:line` below).
- **What the lens covers.**
  - Every existing file, function, type, message and constant `PLAN.md` names exists with that shape at cf4d7b8, or is a veil export, or is marked new.
  - Nothing imports what the veil made private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`).
  - Integration with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol works on cf4d7b8.
  - Sketches type-check in principle (TypeScript ~6.0), the AGENTS.md sky import rules hold for every new or changed file, and no Cache Components API appears.
  - The restructure: nothing stale from the old split, nothing lost, every re-grounded reference.
- **Outputs.** This file and the structured findings.
- **Limits.** Planning only: nothing in either checkout was edited. Scratch work is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/cg10/`.

## Method

1. **Round 9's revision.** Diffed `PLAN.md` against the copy round 9 checked (`scratchpad/PLAN.before-r9.md`, output `cg10/r9-diff.txt`) and read every changed hunk for regressions in this lens.
2. **References.** Round 9's script resolved every explicit `file:line` and every bare `:N` by its nearest file against cf4d7b8 (`cg10/refs.txt`, 178 references). I read each hit. The only unresolved ones (`:482`, `:54`, `:55`, `:88`, `:68-71`, `:92-103`) follow a Next.js docs path in the same sentence, which the script doesn't know; they are unambiguous.
3. **Names.** Round 9's script listed every backticked identifier found in neither cf4d7b8's sources nor a `PLAN.md` code block (`cg10/names.txt`, 142 names); each is a declared new name, a path, a harness file or prose.
4. **Type check and lint.**
   - `cg10/tc/`: round 9's assembled P1 to P11 tree with round 9's changes applied (`cg10/apply-r9.mjs`): `LaunchGate.field()` as a method on one reused gate, `leaseHeld` and its two-way hold, the sleeping timer on `meteorsAllowed(now)`, the pointer's size guard and clamp, the worker's finite check on `at`, and `SHAPE_COUNT` with the `STAR_SHAPES` import gone.
   - `cg10/tc9/`: a new P10-state planner assembly, since round 9's tree kept P8's `meteorKind.ts` and swapped `radiants.ts`'s import line out. It holds `meteors.ts` with 6.10's I2 (`Course`, `Steer`, `PlanOptions.steer`, `clearOf` and `fireball`, `PassOptions.fallback`, `startArea`, the end guards, `Meteor.wakeColor`, `planMeteor` without the radiant; `pickRadiant` and `nextMeteorGap` gone), `radiants.ts` with the sketch's own import line and `pickVisitSky` and `visitSteer` written from 6.10's steps, P10's `meteorKind.ts`, `METEOR_KINDS`, `gaussian`, the P9 key removals and the wake tint.
   - tsc 6.0.3 with the repository's compiler options and ESLint with the repository's config, on both trees.
5. **Runtime.** Under Node 24.14 type stripping with 7.1's resolve hook (`cg10/run/`): `h-p10-load.ts` loads `transients.ts` with the P10 meteor kind and P11 satellites and runs an hour of launches; `h-firstframe.ts` runs 6.2's own `frameDue`, `refreshDivisor` and `stepDivisor`; `h-sampler.ts` compares two readings of `startArea` (CG10-3).
6. **Restructure.** Grepped for the old split's terms (PF, "after V", CP-0, CP-3 to CP-5, D10, D11, 8.5 to 8.7, "file rule", "observed", `meteorScroll`) and checked the archived harness lines P9 cites (`sim2.mjs:23-24`, `:27`, `:28`, `check11/render3-canvas.mjs:136`) against the extracted archive.

## Previous round's findings in this lens

- **CG9-1: fixed, no regression.**
  - 6.13 now says nothing is sent before the canvas's first size (`!size.width`) and each axis is clamped to −1..1 (`PLAN.md:2794`); the worker ignores an `at` with a non-finite coordinate (`:2796`); P7's files and verification follow (`:3176`, `:3185`).
  - The guard reads `mountSky`'s `size`, first set in `sendSize` immediately before `init` is posted (cf4d7b8 `mountSky.ts:245-271`), so no pointer message, `null` ones included, can precede `init`.
  - The assembled listener and worker case compile and lint clean.
- **CG9-2: fixed.** 6.10 says `meteorRange` reads `SKY_WINDOW.earthRadiusKm` and `meteorHeightKm` (`:2516`); R2's bodies compile with the plan's `SKY_WINDOW`.
- **CG9-3: fixed.** 6.6 declares `let presence = createPresence(0)`, which gives cf4d7b8's starting values (`sky.worker.ts:57-58`), and `init` still sets `createPresence(now)` (`:1634`).
- **CG9-4: fixed.** `config.ts:73` at `:467` and `meteors.ts:226-228` at `:2609`; the third sentence is gone. Every bare reference now resolves to the file its sentence means.
- **CG9-5: fixed.** P1's `renderSky.ts` bullet, 5.1 and 8.4 drop `SHAPE_COUNT` and the `STAR_SHAPES` import (`:2972`, `:336`, `:3386`); ESLint on the assembled tree is clean.
- **Round 9's other edits in this lens** (`LaunchGate.field()`, `leaseHeld`, the sleeping timer on `meteorsAllowed(now)`, the farewell `room` and `starts` names, 8.4's widened rows): compile, lint clean, and introduce no name that doesn't exist.

## What held

- **References.** All 178 resolve on cf4d7b8, including the restructure's re-grounded ones; `PortfolioFooterLink.tsx:9-10` (`PORTFOLIO_LINK.href` is `'/'`, `linksData.ts:55-58`), `not-found.tsx:16`, `components/styles.ts:7` and `globals.css:203` hold.
- **Veil symbols.** Every one the plan calls has cf4d7b8's signature (`planMeteor` with `PlanOptions`, private `planFlight` with `PassOptions`, `scrollKept`, `transientQuietFactor`, `budgetKeeps`, `inkBudget`, `screenQuietZones`, `QuietBlend.next`, `drawMeteor`'s `fade`, `contrastLevels`, `quietEasing`, `settleQuiet`, `QUIET_REACH`). Nothing imports `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches`; `clearOf` uses `segmentTouches` inside `meteors.ts` only.
- **Type check.** Both trees pass tsc 6.0.3 with the repository's options. P9 and P10's contracts compose: the steer closure, `startArea`, the required `steer` with no `= {}` default, `PlanContext.field.pinned` as `clearOf`, and `MeteorMemory` holding the visit's sky.
- **Lint.** `cg10/tc` has 0 errors and 0 warnings; `cg10/tc9` has one warning (CG10-2).
- **Module graph.** P10's `transients.ts` with both kinds loads and runs 122 launches under Node type stripping, with no temporal-dead-zone error (`meteorKind.ts` imports `radiants.ts`, which imports `startArea` from `meteors.ts`; nothing imports `transients.ts` at run time).
- **Worker state machine.** Traced `init`, `motion`, `visible`, `scroll`, `activity`, `pointer`, `layout` and `resize` through P2 to P8: the camera exists before `resize` draws, `presence` before any pre-`init` message, the pause ease's last frame comes from `easeEnded`, and P8's port matches the oracle on holds, retries, drops and the sleeping timer.
- **Import rules and Next.js.** The AGENTS.md sky rules hold for every new or changed file; no namespace imports; no Cache Components APIs.
- **Restructure.** None of the old split's terms survive, apart from the harness frame literal's `meteorScroll`, which P9 tells the implementer to replace. The archived harness lines match.

## Findings

### CG10-1 (minor): `frameDue`'s half-refresh rule skips the first animation frame after a timer-driven draw, which H13's case 0 and P3's trace check say never happens

- **Section.** 6.2, `frameDue` (`PLAN.md:1118-1121`) and `tick` step 3 (`:1265`); H13's case 0 (`:2906`); P3 step 3 (`:3048`) and its Chrome-trace check (`:3052`).
- **Problem.**
  - `frameDue` draws a vsync demand only once `(k − 0.5)` refreshes have passed since the last drawn frame. With k = 1 that skips any animation frame that arrives within half a refresh after a draw that came from a timer.
  - That happens at the start of motion whenever a timer drew last:
    - A shooting star launched by a twinkle or fade timer tick is drawn on that tick. Today's `updateMeteor` sets no `needsDraw` at launch (cf4d7b8 `sky.worker.ts:233-237`), and P8's launch does, so either way the launch tick draws and its first animation frame is due half a refresh later.
    - A scroll that arrives while a twinkle or fade timer is pending leaves `needsDraw` false (`:535`).
  - Today's `tick` draws on every animation frame while the mode is `'active'` (`:207`), and so does P2's. H13's case 0 requires P3 to "draw at the same times wherever P3 promises no change (at rest, during a flight, while scrolling; the glide's divided tail excepted)", and P3's trace check expects "a worker frame on every vsync while scrolling and during a flight".
  - So case 0 fails, or passes by the luck of its scripted timings, at P3 step 3, and the implementer can't tell whether the code or the check is wrong. The visible cost is one frame of delay at the start of some flights and scrolls in P3 to P5 and on still-sky (software raster) visits. From P6 the hero's drift keeps the worker on animation frames, so launches and scrolls there start on a vsync draw.
- **Evidence.** [computed, `cg10/run/h-firstframe.ts`, with the plan's own `frameDue`, `refreshDivisor` and `stepDivisor`] At 60 Hz, a timer-driven draw followed by the next vsync: the plan skips that frame in 84 of 167 phases across a refresh (50.3%), whenever the vsync comes less than 8.33 ms after the draw (for example 8.32 ms: k = 1, `frameDue` false), where today's rule draws.
- **Fix.** Make k = 1 draw on every animation frame, as today's `'active'` mode does: `if (demand.vsync) return k <= 1 || now - lastDrawAt >= (k - 0.5) * interval`. The half-refresh guard only matters for holds of two or more refreshes. Or, if the skip is intended, say so in H13's case 0 and the P3 trace check ("except the first animation frame within half a refresh of a timer-driven draw").

### CG10-2 (minor): P9 leaves `DEG` in `meteors.ts` unread, and "Removed in P9" doesn't list it

- **Section.** 6.10, "Removed in P9" (`PLAN.md:2441-2446`), against section 6's rule that names "leave with their last reader" (`:400`).
- **Problem.**
  - `meteors.ts` declares `const DEG = Math.PI / 180` (cf4d7b8 `meteors.ts:77-78`). Its only readers are the `away` and `below` lines (`:209`, `:212`), which I2 replaces with the steer (6.10, `meteors.ts:208-212`).
  - "Removed in P9" enumerates what I2 leaves dead, the `minSpeed`, `maxSpeed` and `nominalSpeed` locals included, "since dead locals and parameters are lint warnings", but not `DEG`. `radiants.ts` needs its own degree conversion anyway (R2 §10's `skyWindow`).
- **Evidence.** [computed] ESLint with the repository's config on the assembled P10 tree (`cg10/tc9`): `meteors.ts: 'DEG' is assigned a value but never used (@typescript-eslint/no-unused-vars)`, the rule at `eslint.config.mjs:13`. It is the tree's only warning.
- **Fix.** Add to "Removed in P9": "the `DEG` constant (`meteors.ts:77-78`), whose only readers are the `away` and `below` lines".

### CG10-3 (minor): `startArea`'s contract leaves open whether the planner's start sampling changes

- **Section.** 6.10: `startArea`'s doc and `planFlight`'s note (`PLAN.md:2588-2590`), the usability probes (`:2529`), and "Everything else stays the veil session's: the start-point sampling (I2 only names its area, `startArea`)" (`:2615`).
- **Problem.**
  - cf4d7b8 draws `y = Math.max(METEOR.top, height × U(spawnY))` (`meteors.ts:204-207`): a uniform draw over `height × [0, 0.5]`, then a clamp. A quarter of the candidate starts at 1440 × 900 (110 of 450 px) land exactly on `METEOR.top`.
  - The plan's `startArea` is "the area planFlight samples start points from (CSS px): today METEOR.spawnX × spawnY, each y at least METEOR.top", and `planFlight` "samples its starts from startArea". Read as a box with `y0 = max(top, …)` sampled uniformly, which is how I first built it, that drops the clamp's pile-up and moves starts lower. That contradicts 6.10's promise that the sampling stays the veil session's.
  - The plan's computed numbers assume the other reading. Round 8's assembly in this lens (`check-r8-cg/stage-p11.mjs:46`, `:67`) and the physics prototypes use the unclamped box and clamp after the draw. So an implementer can build either and not know which one H8's bars and P9's crossing rerun were tuned for.
- **Evidence.** [computed, `cg10/run/h-sampler.ts` on the assembled P9 planner (`cg10/tc9`, and `cg10/tc9b` for today's draw), 1440 × 900, no quiet rects, 20,000 visits, launching as 6.9 says]
  - With today's draw (unclamped box, clamp after), 20.2% of planned launches start exactly at y = 110, and the mean start is y = 243 px.
  - With a uniform draw in the clamped box, none start at y = 110, and the mean start is y = 275 px.
  - The direction mix moves by at most 1 point (falling 74.4 against 75.4%, heading right 55.5 against 54.6%). The 32 px shift toward the hero copy bears on crossings, which P9 measures.
- **Fix.** Pin the contract in 6.10: "`startArea` returns `width × spawnX` by `height × spawnY`, unclamped. `planFlight` keeps cf4d7b8's draw, `y = max(METEOR.top, between(random, y0, y1))`, and the probes clamp their y the same way." If a uniform draw inside the clamped box is wanted, state it as a change to the veil's sampling that H8 and P9's crossing rerun measure.

## Summary

- **Verdict: pass.** No blocking or major finding in this lens.
- **Round 9.** All five fixes in this lens landed correctly, with no regressions. The pointer guard closes the pre-`init` window, `presence` exists before any message, and round 9's other edits compile and lint clean.
- **New this round.** A P10-state planner assembly that nobody had type-checked as written (I2's `Course`, `Steer`, `startArea`, `clearOf`, `fireball`, and `visitSteer` with `pickVisitSky` under the sketch's own import line) compiles and runs. It turned up two small gaps:
  - `DEG` left unread (CG10-2);
  - an ambiguous `startArea` contract that decides whether a fifth of the launches still start under the navbar (CG10-3).
- **The frame clock.** A half-refresh rule makes P3's flight and scroll starts one frame late after a timer draw, against H13's case 0 (CG10-1). Each fix is one sentence or one condition.
- **Restructure.** Nothing stale or lost in this lens. Every re-grounded reference resolves on cf4d7b8.
