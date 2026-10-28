# Check round 8: code grounding and feasibility

## Scope

- **Role.** Adversarial checker, lens "code-grounding", round 8.
- **Questions this lens answers:**
  - Does every file, function, type, message and constant that `PLAN.md` names exist with that shape at cf4d7b8, or is it marked new?
  - Does any sketch import what the veil made private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`)?
  - Do the integration points work with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol on cf4d7b8?
  - Do the sketches type-check under TypeScript 6.0?
  - Does every new or changed file keep AGENTS.md's sky import rules, with no Cache Components APIs?
- **What this round also covers:**
  - whether round 7's five code-grounding fixes landed;
  - the post-commit restructure: anything left over from the old before/after-V split, anything an implementer needs that was lost, and every re-grounded `file:line`.
- **Inputs:**
  - `PLAN.md` (3,664 lines) and `REVIEW-LOG.md`, including "Post-commit restructure (cf4d7b8)";
  - `COORDINATION.md` (all of it), `HANDOFF.md`, `research/00-shared-brief.md` and `research/01-planning-brief.md`;
  - the code at cf4d7b8, read from the read-only checkout `.claude/worktrees/sky-baseline-cf4d7b8`;
  - the pre-restructure copy, `PLAN.before-restructure.md`, in the session scratchpad.
- **Output.** This file only. I edited nothing in `src/`, `PLAN.md` or `REVIEW-LOG.md`, in either checkout.
- **Scratch work.** Everything is in `C:\Users\josep\AppData\Local\Temp\claude\S--Documents-repos-Portfolio\a0e9de06-a28e-4f61-8721-ce75a333fee7\scratchpad\check-r8-cg`.

## Method

1. **Read all of cf4d7b8's sky code:**
   - `src/lib/sky/*` and `src/components/sky/*`;
   - the files the plan cites: `Navbar.tsx`, `utils.ts`, `icons/*`, `globals.css`, `Background.module.css`, `IntroGate.tsx`, `SidePane.tsx`, `animations.ts`, `styles.ts`, `Card.tsx`, `README.md`, `eslint.config.mjs`, `PortfolioFooterLink.tsx` and `not-found.tsx`.
2. **References.**
   - Extracted every explicit `file:line` (98 of them) and every bare `:N` reference from `PLAN.md`, and read each cited line at cf4d7b8. All of them hold.
   - One range is wider than its sentence (CG8-3).
3. **Names.** A script (`idents.mjs`) collected every backticked identifier in the plan's prose. It checked each one against cf4d7b8's source and the plan's own code blocks. What remains are file names, external references, or names the plan's prose introduces as new:
   - P3's `requestFrame`, `onStalled`, `rafWorks`, `probeId` and `watchdogId`;
   - P6's `thinFade`, `thinFrom`, `thinLevel` and `thinnedAt`;
   - P8's `launchGate` and `heroLaunchMaxScroll`;
   - P12's `bodyShowing`, `launchScene` and `endLaunchLevel`.

   Nothing that is supposed to exist today is missing.
4. **Type-check with TypeScript 6.0.3**, using the main checkout's compiler and the repo's `tsconfig` flags (`strict`, `noUncheckedIndexedAccess`, `isolatedModules`, `moduleResolution: bundler`):
   - **P8 tree** (`assemble.mjs`). cf4d7b8's sources plus every sketch the plan gives as code, verbatim:
     - the config blocks (`DEPTH`, `CAMERA`, `DRIFT` with `Epicycle` and `DriftConfig`, `PACING`, `STAR_PHASES`, `LEAN`, `TRANSIENTS`, `GapLaw`, `FRAME.motionEase`, and `SCENE` with `drift` and `lean`);
     - `catalog.ts`'s `q`, `nearness` and `LAYER_NEARNESS`;
     - `scene.ts` with `sameRects` moved in and the `launches` rename;
     - `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `gaps.ts`, `transients.ts` and `meteorKind.ts`;
     - in `renderSky.ts`: `placePoint`, the stamped `StarField`, the module-scope quiet index, 6.5's `drawLayer` and `drawTransient` against cf4d7b8's `drawMeteor(…, fade)`;
     - a worker file holding 6.1's worker block and 6.2's `demandNow`.

     It compiles with 0 errors.
   - **P11 tree** (`stage-p11.mjs`). P9's `Course`, `Steer` and `PlanOptions` with `steer` required, plus `startArea`. P9's `planFlight` is rewritten from 6.10's I2 prose:
     - the steer call;
     - the fireball path;
     - the whole train line from CG7-3;
     - the two new end tests.

     It also has `planMeteor` without the radiant, `radiants.ts`, `satellites.ts`, the second kind in `TransientBodies`, `TRANSIENT_KINDS` and `SPECS`, and `drawTransient`'s `'satellite'` case. 0 errors.
   - **P5's main-thread code** (`p5tsx.mjs`). It ran against the main checkout's real `node_modules` (React 19 types, Motion) through a junction:
     - `skyPause.ts`, `SkyPauseButton.tsx`, `PauseSVG` and `PlaySVG`, and the `icons/index.ts` lines;
     - `Navbar.tsx` with the control, `inert`, `headerRef`, `onFocus` and the `:focus-visible` test;
     - in `mountSky.ts`: `motion()` from the store, `sentMotion`, the deduped `syncMotion`, `subscribeSkyPlayback`, the `never`-checked message `switch`, `destroy`, and P4's activity listeners.

     0 errors.
5. **Node 24.14** with 7.1's `registerHooks` resolve hook (taken from the plan's own block):
   - `camera`, `pacing`, `presence`, `quietIndex`, `gaps`, `transients` and `meteorKind` load under type stripping with no load-order error.
   - Printed values: `ZONE_REACH` 40, `STAR_INK_PEAK` 0, `QUIET_REACH` 72, `DRIFT_REACH` 212.30.
   - `LAYER_NEARNESS` gives far 0.240–0.389, mid 0.389–0.741 and near 0.741–1.6, all matching L1 and C3.
   - `sameRects` treats a change of `headroom` alone as different.
6. **A small H3** (`h3mini.ts`). It ran on cf4d7b8's one-pass `quietFactor`, with every layer's keeps, `budgetKeeps(0.5, METEOR_VEIL.quietKeep)` and blends carrying a `next` list. `QuietIndex.factor` equalled `easedQuietFactor` under `Object.is` on all 960,000 lookups (0 mismatches).
7. **The restructure** (`lost.mjs`). I diffed `PLAN.md` against `PLAN.before-restructure.md` and listed every backticked identifier that disappeared:
   - all of them come from the removed stable-seams and hotspot tables (state lists for each handler);
   - their facts survive in 6.2, 6.4, 6.6, 6.9 and 8.4.

   A grep for "after V", "from V", PF, 8.5, 8.6, 8.7, CP-0, CP-3 to CP-5, D10, D11, R-1, R-2, "observed", "file rule", "overlap" and "hands-off" finds only deliberate notes ("D10 and D11 went with the wait…", "What the old checkpoint V did now lives in the phases").
8. **Integration on cf4d7b8**, traced line by line through:
   - the wake-up loop (`tick`, `schedule`, `frameMode` becoming `demandNow`, `settleQuiet` and `quietEasing`, `rebuildHaze`);
   - every message handler (`init`, `motion`, `visible`, `scroll`, `layout`, `contrast`);
   - P8's swap of `updateMeteor`, `planLaunch`, `launchScrollY` and `draw`, against the oracle's random-draw order and boundary tests;
   - the star cache through `probeRaster` and `stepDown`;
   - `mountSky`'s message switch, store subscription and teardown.

## Round 7 fixes in scope

| ID | Status on the restructured plan |
|---|---|
| CG7-1 (blocking) | **Landed, and the commit makes it moot.** `demandNow`'s `fading` calls the veil's `quietEasing(t)` directly (line 1215, cf4d7b8 `sky.worker.ts:131-133`), and `tick` keeps `settleQuiet` before the frame decision (1192, 1263). The overlap request went with the wait. 8.4's row names `frameMode`, `tick` and `quietEasing` for P2 and P3. |
| CG7-2 (major) | **Landed.** P2's files list `tick`'s `updateCamera` call (3014). 8.4's rows cover `mountSky` ("the measurement unchanged; our listeners and the pause wiring join `mountSky` beside it"), `SkyFrame` and the import lines. |
| CG7-3 | **Landed.** The train line reads `dimFrom === 1 && (course.train \|\| fireball) && random() < METEOR.trainChance` (2609), which matches cf4d7b8 `meteors.ts:236` with `course.train` in place of the jitter test. It compiles in the P11 tree. |
| CG7-4 | **Landed.** The comet's box is tested against `frame.quiet.to` and, while a layout waits, `frame.quiet.next` (up to 128 rects) in the 6.12 comet row (2759), AC-25 (3459) and P12 step 1 (3317). |
| CG7-5 | **Landed.** In P8, `LaunchGate.allowed` is today's `meteorsAllowed` (2135, 2334), and the sleeping timer is armed only while `launchGate(now).allowed` (2339), as cf4d7b8's `:183` guards it. P12's farewell row narrows `allowed` to `scene !== null` (2758). |

No regressions found.

## Findings

### CG8-1 (minor): 6.2's frame mechanism calls optional members directly

- **Section.** 6.2, "The worker's mechanism", the `requestFrame()` bullet (line 1253) and the line saying "In `SkyWorkerScope` (`:17-22`) both animation-frame members become optional" (1256). `cancelFrames()` is affected too (1267).
- **Problem.**
  - The plan makes `SkyWorkerScope.requestAnimationFrame` and `cancelAnimationFrame` optional, then writes `rafId = scope.requestAnimationFrame(onFrame)`.
  - Today's `cancelFrames` line, `if (rafId) scope.cancelAnimationFrame(rafId)` (cf4d7b8 `sky.worker.ts:156`), carries over unchanged.
  - Under `strict`, both calls fail to compile. The `rafWorks` boolean doesn't narrow a property of `scope`.
- **Evidence.** In `tsdup/b.ts`, tsc 6.0.3 with `--strict` reports TS2722 ("Cannot invoke an object which is possibly 'undefined'") and TS18048 on the `requestAnimationFrame` call, and TS2722 on the `cancelAnimationFrame` call.
- **Fix.** Write `rafId = scope.requestAnimationFrame?.(onFrame) ?? null` and `if (rafId !== null) scope.cancelAnimationFrame?.(rafId)`. Alternatively, keep both members required as today: the `typeof scope.requestAnimationFrame === 'function'` test compiles either way.

### CG8-2 (minor): P6 passes the nullable `thinnedAt` to `easing` and `easeEnded`

- **Section.** P6, "Recommended within P6": the `thinLevel` bullet (line 3153) and the `fading` bullet (3155).
- **Problem.**
  - `thinnedAt` is "null before step 1", which `fadeOutAt(since: number | null, …)` accepts.
  - The plan then writes `easing(thinnedAt, ADAPT.thinFade, t)` and has `easeEnded` ask for the last frame.
  - Both take `since: number` (6.2 sketch, lines 1076 and 1081), so the call fails under `strict`.
  - A `-Infinity` sentinel isn't a safe way out either: `fadeOutAt(-Infinity, …)` evaluates `smoothstep(-∞, -∞, t)`, which is NaN.
- **Evidence.** In `tsdup/b.ts`, `easing(thinnedAt, 1, 0)` with `let thinnedAt: number | null` gives TS2345 ("Argument of type 'null' is not assignable to parameter of type 'number'").
- **Fix.** In P6, write `thinnedAt !== null && easing(thinnedAt, ADAPT.thinFade, t)`, and the same guard before `easeEnded(thinnedAt, ADAPT.thinFade, t, lastDrawAt / 1000)`.

### CG8-3 (minor): a replaced range takes in `meteorsAllowed`

- **Section.** 6.2, the heading "The worker's mechanism (replaces `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames`, `:154-209`)" (line 1250).
- **Problem.**
  - At cf4d7b8, `:154-209` also holds `meteorsAllowed` (`:162-165`).
  - P3 doesn't replace `meteorsAllowed`. `schedule` (`:183`) and `updateMeteor` (`:222`) keep reading it until P8 turns it into `launchGate` (6.9, line 2334).
  - The names in the heading are right. Only the range is wider.
- **Evidence.** cf4d7b8 `sky.worker.ts`:
  - `cancelFrames` at `:154-160`;
  - `meteorsAllowed` at `:162-165`;
  - `schedule` at `:167-187`, with its doc;
  - `onTimer`, `onFrame` and `tick` at `:189-209`.
- **Fix.** Cite `:154-160` and `:167-209`.

## Checked and found sound (no finding)

- **Re-grounding.** Every explicit and bare `file:line` reads as cited at cf4d7b8:
  - the 98 explicit references;
  - every bare `:N` in 6.1, 6.2, 6.6, 6.8, 6.9, 6.10, P3 and P4.

  Two examples: `sky.worker.ts:535` (the scroll handler's `rafId`/`timerId` test) and `meteors.ts:208-236` (I2's lines inside `fit`).
- **Private veil helpers.** None is imported. `segmentTouches` and `veiledFrom` are named only as private and unchanged (8.3, 8.4). `fitKeep`, `luminance` and `contrastRatio` appear only in 8.3's "imports none" sentence.
- **Import rules (AGENTS.md):**
  - every new `src/lib/sky` module imports only its siblings, relatively;
  - kind modules import `./transients` with statement-level `import type`;
  - there is no runtime cycle (the Node load in method step 5 confirms it);
  - the worker files import only `@/lib/sky/*` and each other;
  - `mountSky.ts` keeps to types and `@/lib/sky/color` from `src/lib/sky`;
  - `skyPause.ts`, a main-thread file, reads `@/lib/utils`;
  - `SkyPauseButton.tsx` imports the icons barrel and `@/lib` as `Navbar.tsx` does (home page only);
  - no Cache Components API appears anywhere.
- **Wake-up loop.**
  - `demandNow` reproduces cf4d7b8's `frameMode`, case by case:
    - sleep is `live` false;
    - `active` is a flying meteor, or scrolling under full motion;
    - `fade` is a lingering train, scrolling under reduced motion, the dusk or `quietEasing`;
    - `twinkle` is the 15 or 10 fps line.
  - The 6.2 table's before-P6 substitutions cover every later-phase line.
  - `settleQuiet` still runs before the decision, so a waiting layout applies when the ease ends, and the fade frames keep ticking until it does.
  - `rebuildHaze`'s deferral is untouched.
- **P8 against the oracle:**
  - The random draws come in the same order: the reveal's first delay; `planLaunch`'s fresh radiants and passes; `nextMeteorGap`; the retry interval.
  - The tests have the same boundaries: scroll-quiet `<` against `>=`; retirement at `lifetime` or when `scrollKept` reaches 0.
  - The new holds (T5, T7 and the lease) never fire in P8, because gaps of at least 30 s exceed every lifetime and the cooldown is 0.
  - `parallaxScroll`'s retirement leaves `resumeCamera` continuous.
- **Star cache and drawing.**
  - `probeRaster` and `stepDown`'s nested `draw` go through `beginFrame` and `trim` correctly.
  - 6.5's two-axis cell culling bounds every q in a band.
  - `placePoint` with `snap` true equals today's `Math.round(x * dpr) - half`.
- **Main thread.**
  - `sentMotion` is defined before `sendSize` can post `init`.
  - The store subscription and `setSkyRunning` survive StrictMode's remount and the reveal's key flip.
  - The `never`-checked `switch` replaces `else destroy()` at `mountSky.ts:332`.
  - The new protocol messages (`activity`, `pointer`, and P13's `tick` and `relay`) need no change to the worker's switch, which has no exhaustiveness check.
- **Restructure.** No PF branch, wait or overlap clause remains. Dependencies agree everywhere:
  - P5 lands before P4;
  - P8 depends on P3, P5 and P6 (`fadeOutAt`);
  - 5.1's phase columns, 7.2's map and each phase's "Blocked on" line agree.

  The facts from the removed stable-seams table survive: `rafId`'s type change, `sameRects` keeping its name, `meteorsAllowed` and `twinkleLevel` keeping theirs, and P8's renames.

## Summary

- **Verdict: pass.** No blocking or major finding through the code-grounding lens.
- **What holds on the restructured plan.** It is grounded on cf4d7b8 line for line:
  - every name it says exists does exist;
  - every sketch it gives as code compiles under TypeScript 6.0.3 with the repo's flags, at both the P8 and the P11 shape, P5's TSX included;
  - the model modules load under Node's type stripping;
  - the quiet index is exact on the committed one-pass `quietFactor`.
- **Round 7.** All five code-grounding fixes landed, and the commit makes CG7-1 and CG7-2 moot.
- **Three minor findings, each a one-line edit:**
  - CG8-1 and CG8-2 are two prose code lines that wouldn't compile as written: optional rAF members called directly, and a nullable `thinnedAt` passed to `easing` and `easeEnded`;
  - CG8-3 is one range that reaches past what it names.
