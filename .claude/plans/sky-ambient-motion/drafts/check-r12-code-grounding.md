# Check round 12: code grounding and feasibility

Checker: adversarial, lens "code-grounding". Date: 2026-10-28.

## Scope

- **Role.** Find real problems in `PLAN.md` through the code-grounding lens; no praise. Confirm round 11's fixes in this lens landed, look for regressions they introduced, then sweep the rest of the plan.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `PLAN.md`; `REVIEW-LOG.md` ("Round 11" and "Gate round 11"); round 11's report in this lens with its skeptic section; the round-11 gate audits and the other round-11 check reports where they touch this lens.
  - The archived veil harness (`harness/veil-confirm-final-1.tar.gz`; the copy extracted in round 11 at `scratchpad/cg11/harness-x/`, read only).
  - The code at cf4d7b8: the worktree's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty), the baseline for every `file:line` below.
- **What the lens covers.**
  - Every existing file, function, type, message and constant `PLAN.md` names exists with that shape at cf4d7b8, is a veil export, or is marked new.
  - Nothing imports what the veil keeps private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches` and answer 1's other private symbols).
  - The design integrates with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol.
  - Sketches type-check in principle (TypeScript ~6.0); the AGENTS.md sky import rules hold for every new or changed file; no Cache Components API.
- **Outputs.** This file and the structured findings.
- **Limits.** Planning only: nothing in either checkout was edited. Scratch work is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/cg12/`.

## Method

1. **Round 11's revision.** Diffed `PLAN.md` against the copy round 11 checked (`scratchpad/PLAN.before-r11.md`; output `cg12/r11-diff.txt`, 252 lines) and read every hunk in this lens.
2. **References and names.** Reran round 9's resolver (`cg11/refs.mjs`, output `cg12/refs.txt`) and lister (`cg11/names.mjs`, output `cg12/names.txt`) against the worktree, and read every reference on a line round 11 changed.
3. **Type check and lint** (tsc 6.0.3 with the repository's compiler options, ESLint with its config) on round 10's P10 and P12 assemblies with round 11's contract applied (`cg12/p10`, `cg12/p12`):
   - `planMeteorTransient(context, options: Omit<PlanOptions, 'steer' | 'nearCopy' | 'ink'> = {})`, whose `clearOf` joins `field.pinned` and whose `flights: 'long'` skips the short pass;
   - `METEOR_SPEC.plan` as the decision step: a decided fireball tried with `planMeteorTransient({ ...context, nearCopy: false }, { fireball: true, flights: 'long' })`, then `planMeteorTransient(context)`;
   - in P12, the farewell spec's `planMeteorTransient(context, { clearOf: [above], starts })`.
4. **Runtime** under Node 24 type stripping (`cg12/run/`):
   - a 7.1-style hook (`hooks-wrap.mjs`) that sends `meteorKind.ts`'s `./meteors` to a recording wrapper (`meteors-rec.mjs`: `export *` from the real module, with a `planMeteor` that records each call);
   - `h-order.ts` runs `METEOR_SPEC.plan` 2,000 times on each of six archived desktop layouts, every launch deciding a fireball (`METEOR_KINDS.fireball.chance` set to 1 in memory, `sinceReveal` 100), and applies P10's new pass-order assertion to the recorded calls;
   - the same on two misbuilds: `p10mis` (round 11's CG11-1 plainest build) and `p10ctx` (the fireball try on the context's own `nearCopy`).
5. **Harness.** Re-read the archive files P9's bullet names (`transpile.mjs`, `lib.mjs`, `sim2.mjs`, `check11/render3-canvas.mjs`, `code-logic/lib.mjs`, `live/alib.mjs`), and checked `git show HEAD:` on a file that exists on disk but not at HEAD (`cg12/gitprobe`).
6. **Integration.** Re-read `sky.worker.ts`, `renderSky.ts`, `meteors.ts`, `scene.ts`, `config.ts` and `protocol.ts` at cf4d7b8 against round 11's lines and P3, P6 and P8 to P12.

## Previous round's findings in this lens

- **CG11-1: fixed, no regression.**
  - P10's `meteorKind.ts` line (`PLAN.md:3271`) now states the decision step: a decided fireball tried with `{ fireball: true, flights: 'long' }` and the context's `nearCopy` false, then an ordinary launch in ask 1's order, never `fireball` on a short pass.
  - 6.9's doc and sketch comments give the second argument and its `flights: 'long'` (`:2098-2109`, `:2117`). 6.10's `PlanOptions.fireball` doc (`:2590`) and the `planFlight` comment (`:2599-2602`) say the fallback pass sets it false, as cf4d7b8's `fireballs: false` does (`meteors.ts:275`). 6.12's farewell row (`:2755`) and P12's files (`:3318`) take the argument from P10.
  - P10's verification (`:3288`) adds the pass-order check on the recorded `planMeteor` calls.
  - Both assemblies compile and lint clean. `Omit<PlanOptions, 'steer' | 'nearCopy' | 'ink'>` drops the required `steer`, so the `= {}` default type-checks, and `{ ...context, nearCopy: false }` is a valid `PlanContext`.
  - **Runtime, as planned** (`cg12/run/order-planned.txt`): 0 order violations on all six layouts. A decided fireball flies on 100, 96.8, 97.4, 100, 88.3 and 67.8% of launches at 1440 × 900, 1280 × 800, 1366 × 768, 1920 × 1080, 1280 × 720 and 1024 × 768. Otherwise an ordinary long flight flies, except at 1024 × 768: 7.7% ordinary short, in ask 1's order, and 0.8% none.
  - The check's recording is feasible: a `registerHooks` resolve hook can return the wrapper for one parent's `./meteors`, and the wrapper's local `planMeteor` shadows the `export *` one.
- **CG11-2: fixed.**
  - P9's bullet (`:3258`) keeps `render3-canvas.mjs`'s import of the archived `code-logic/lib.mjs`.
  - That import takes only `launch` (`check11/render3-canvas.mjs:12`). Its `HERE` and `ZONES` come from the harness's own `lib.mjs` (`:13`, used at `:159` and `:196`), which the bullet repoints.
  - `code-logic/lib.mjs`'s `HERE` (`:10`) is read only by its own `save` (`:72`), so setting `PW` and `CHROME` (`:7`, `:11`) is enough, as the bullet says.

## What held

- **References.** Every `file:line` on a line round 11 changed resolves to the code its sentence means:
  - `config.ts:222` (the `FRAME` doc), `:170-171` (`heroMeteorMaxScroll` and its doc) and `scene.ts:36`;
  - `config.ts:286-290` (the flight block's doc), `:296` (`path`'s doc) and `:299` (the narrow block's doc);
  - `mountSky.ts:231`, `scene.ts:60-69`, `components/styles.ts:7` and `globals.css:203`.
- **Names.** Against round 11, the lister's only change is that `alib` is gone (CG11-2's edit). No new name lacks a definition at cf4d7b8 or in a `PLAN.md` code block.
- **P3 and P6 (CONV11-2's move).** Consistent in code:
  - before P6, P3's `demandNow` sets `cameraCap` to `Infinity` and reads no drift cap (6.2's table, `:1231`);
  - `driftCap`, `PACING`'s drift caps, `narrowScreen` and `softwareFps` all arrive in P6 (`:323`, `:965`, `:3134-3140`);
  - H4's capped-fade row can use a synthetic capped demand at P3.
- **Veil private symbols.** No sketch imports `fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, `zoneQuiet`, `zoneInk`, `CLEAR_SKY`, `Veiled`, `Fit` or `color.ts`'s private helpers. Round 11's only new import is `meteorKind.ts`'s `type PlanOptions` from `./meteors`, which 5.2 allows.
- **Import rules and Next.js.** Round 11 changes no module edge. No Cache Components API appears anywhere.
- **Integration.**
  - The P8 worker port's citations still hold (`sky.worker.ts:65-72`, `:163-165`, `:183`, `:212-238`, `:246-261`, `:435-436`, `:486`, `:507`, `:514`).
  - Every reader of a key P9 or P10 removes is in `meteors.ts` or in `sky.worker.ts` lines P8 replaces. Examples: `pickRadiant` and `nextMeteorGap` (`sky.worker.ts:9`, `:237`, `:248`), and `fireballChance` and `fireballDuration` (`meteors.ts:203`, `:217`).

## Findings

### CG12-1 (minor): P10's pass-order check names no fields and doesn't check the fireball try's `nearCopy: false`, so two misbuilds pass it

- **Section.** P10's verification (`PLAN.md:3288`); H7 (`:2901`); P10's `meteorKind.ts` line (`:3271`); RD1 (`:305`); 6.9's `planMeteorTransient` doc (`:2104-2105`).
- **Problem.** P10 adds an H7 check on the recorded `planMeteor` calls: "a decided fireball tried on long flights only, then ordinary long flights on every steer before any short one". Two gaps let it pass builds that break what P10 states.
  1. **No fields.** CG11-1's misbuild (the decided fireball on every call of P9's loop, the fallback clearing it) makes a short call carrying `fireball` only after every long call fails, and H7 (`:2901`) names no layouts.
     - On roomy layouts the check flags nothing. Only where fireballs fail does it bite.
     - Fireballs are also eligible only from 20 s after the reveal and 120 s apart, so short event sequences reach few decisions.
  2. **No `nearCopy` check.** P10 tries the fireball "with ... the context's `nearCopy` false: ... so its failure keeps the visit's sky" (RD1). `nearCopy` is outside the second argument's type, so the build must pass `{ ...context, nearCopy: false }`.
     - A build that passes the context unchanged passes the check on every layout.
     - Meanwhile a failed try with `nearCopy` true clears the visit's sky (6.9's doc, `:2104-2105`), and the ordinary launch flies on freshly picked sources. The visit's shower radiant then jumps mid-visit, against RD1.
- **Evidence.**
  - [computed, `cg12/run/order-misbuild.txt`] The CG11-1 misbuild, 2,000 decided-fireball launches per layout, P10's stated check: 0, 65, 52, 0, 234 and 645 launches flagged at 1440 × 900, 1280 × 800, 1366 × 768, 1920 × 1080, 1280 × 720 and 1024 × 768. Its launches end as ordinary short flights on 0.0, 3.3, 2.6, 0.0, 11.7 and 30.9%, against 0.0, 0.0, 0.0, 0.0, 0.0 and 7.7% in ask 1's order.
  - [computed, `cg12/run/order-context.txt`] The fireball try on the context's own `nearCopy`: 0 flagged on every layout. The visit's sky was re-picked on an ordinary launch in 0.1, 3.6, 2.9, 0.0, 13.4 and 30.5% of decided-fireball launches at the same six layouts. The as-planned build measures 0.0 to 0.8%, the measurement's floor (a first launch that clears the sky).
  - [computed, `cg12/run/order-planned.txt`] As planned: 0 flagged everywhere. 11.7% (1280 × 720) and 32.2% (1024 × 768) of decided fireballs find no path, so those layouts exercise both halves of the check.
- **Fix.** In P10's verification, write: "H7 extended: no two fireballs closer than 120 s, none before 20 s, every fireball clear-sky, and, on the `planMeteor` calls it records (7.1's resolve hook can wrap `./meteors`), a decided fireball tried on long flights only **and with `nearCopy` false**, then ordinary long flights on every steer before any short one. Run it on fields where fireballs fail: the archived 1280 × 720 and 1024 × 768 layouts, where 12 and 32% of decided fireballs find no path, or as a unit case with the decision forced (`METEOR_KINDS.fireball.chance` 1, `sinceReveal` past `after`)."

### CG12-2 (minor): `transpile.mjs` reads HEAD for three of its four trees, so P9 step 3's H9 run stops on the uncommitted `gaps.ts`

- **Section.** P9's verification, the archived-harness bullet (`PLAN.md:3258`), with P9 step 3 (`:3245`) and H9 (`:2903`).
- **Problem.**
  - The bullet runs "`transpile.mjs` with `REPO` at the implementing worktree (it transpiles every `src/lib/sky` file)". That holds for the `proto` tree, but the script does more:
    - its loop always builds all four trees;
    - it takes the file list from the working tree;
    - `base` reads every file with `git show HEAD:`, and `plan` and `before` fall back to HEAD for any file their folders lack.
  - So a new `src/lib/sky` file that isn't committed yet makes the `base` pass throw.
  - P9 step 3 adds `gaps.ts` and sets `crossingCooldown` "at the value 6.9's rule gives from H9 ... with H9 green". H9 runs "on each of the nine archived layouts' fields (P9 adapts the harness)", that is, through `lib.mjs`'s `P`. Loading `lib.mjs` imports `pure/proto` and, unconditionally, `pure/base` (`lib.mjs:16-17`).
  - So step 3's first H9 run stops before the commit whose value it has to decide.
  - Round 11's completeness report saw the HEAD reads ("Not raised") on the premise that "P9's steps are committed ... before the verification runs". Step 3's own H9 run is the exception.
- **Evidence.**
  - Archive (`meteor3/impl/confirm-final-1/`):
    - `transpile.mjs:20`: `head = (rel) => execFileSync('git', ['show', \`HEAD:${rel}\`], ...)`;
    - `:24`: `if (tree === 'base') return head(rel)`;
    - `:27` and `:31`: the `before` and `plan` fallbacks to `head(rel)`;
    - `:43`: `libFiles` read from the working tree;
    - `:44`: `for (const tree of ['base', 'plan', 'before', 'proto'])`;
    - `lib.mjs:17`: `export const B = { ...(await load('base', 'meteors')), ... }`.
  - [computed, `cg12/gitprobe`] For a file on disk but not committed, `git show HEAD:src/lib/sky/gaps.ts` exits with "fatal: path 'src/lib/sky/gaps.ts' exists on disk, but not in 'HEAD'", which `execFileSync` throws.
- **Fix.** Add to the bullet, after its `transpile.mjs` item: "it also builds `base`, `plan` and `before`, reading `git show HEAD:` for each working-tree file they lack, and `lib.mjs:17` loads `base`. So in the extracted copy, make `sourceOf` return the working-tree file for every tree (only `proto` is read), or commit each new `src/lib/sky` file before running it; otherwise step 3's H9 run stops on `gaps.ts`."

### CG12-3 (minor): P12's "Blocked on" still says P9, but its meteor kinds now need P10

- **Section.** P12's "Blocked on" (`PLAN.md:3317`); 7.2's P12 row (`:2939`).
- **Problem.**
  - Both say P9 (the planet P2), but every P12 meteor kind now needs P10:
    - since round 11, the farewell spec calls `planMeteorTransient(context, { clearOf, starts })` with "P10's second argument" (6.12, `:2755`; P12's files, `:3318`);
    - the point flash, bursts and earthgrazers are `METEOR_KINDS` entries decided in P10's decision step (`:2761`).
  - Built after P9 alone, as "Blocked on" allows, farewell meteors don't compile: `planMeteorTransient` takes one argument until P10.
  - 7.0's order ("P10 reaches master with P9 or right after it", `:2823`) and 7.2's graph make this unreachable in practice. So it is drift from round 11's move, not a trap.
- **Evidence.** `:3317`: "Blocked on. P9 for every kind but the planet". `:2939`: "P9 (planet: P2)". `:2755`: "(P10's second argument, 6.9)". `:3271`: P10 adds the argument and `METEOR_KINDS`.
- **Fix.**
  - P12: "Blocked on. P10 for the meteor kinds (farewell meteors, the point flash, bursts, earthgrazers), P9 for the comet; the planet, a star, could follow P2."
  - 7.2's P12 row: "P10 (the comet: P9; the planet: P2)".

## Summary

- **Verdict: pass.** No blocking or major finding; three minor ones, each a sentence or two.
- **Round 11 in this lens.**
  - CG11-1's fix landed. The decision step and the second argument compile and lint clean in the P10 and P12 assemblies. They fly every decided fireball's failure in ask 1's order with 0 violations on six archived layouts, and the recording hook P10 names is feasible.
  - CG11-2's fix holds against the archive.
  - Round 11's other edits in this lens (the P3 to P6 move of the drift caps, the reworded docs, H7, AC-20, AC-37, the farewell row) are consistent with the code at cf4d7b8, and their references resolve.
- **New.**
  - CG12-1: P10's new check passes CG11-1's misbuild on roomy layouts, and a fireball try on the context's own `nearCopy` everywhere. Naming the 1280 × 720 and 1024 × 768 layouts and asserting `nearCopy: false` closes both.
  - CG12-2: the harness's `transpile.mjs` needs every new file at HEAD, so step 3's H9 run stops on `gaps.ts`.
  - CG12-3: P12's dependency lines predate round 11's move of the second argument into P10.
