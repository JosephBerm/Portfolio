# Check round 9: code grounding and feasibility

Checker: adversarial, lens "code-grounding". Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through the code-grounding lens; no praise.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, with "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree"), `research/01-planning-brief.md`, `PLAN.md`, `REVIEW-LOG.md` (rounds 1 to 8 and the post-commit restructure), R2 §10, R3 §8, the archived harness, and the code at cf4d7b8 (`.claude/worktrees/sky-baseline-cf4d7b8`, the baseline for every `file:line`).
- **What the lens covers.**
  - Every existing file, function, type, message and constant `PLAN.md` names exists with that shape at cf4d7b8, or is a veil export, or is marked new.
  - Nothing imports what the veil made private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`).
  - Integration with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol works on cf4d7b8.
  - Sketches type-check in principle (TypeScript ~6.0), and the AGENTS.md sky import rules hold for every new or changed file.
  - No Cache Components APIs.
  - The restructure: nothing stale from the old split, nothing lost, every re-grounded reference.
- **Outputs.** This file and the structured findings.
- **Limits.** Planning only: nothing in either checkout was edited. Scratch work is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/cg9/`.

## Method

1. **References.** A script (`cg9/refs.mjs`, output `cg9/refs.txt`) resolved every explicit `file:line` in `PLAN.md`, and every bare `:N` by its nearest file, against cf4d7b8. I read each hit by hand.
2. **Names.** A second script (`cg9/names.mjs`) listed every backticked identifier found neither in cf4d7b8's sky, Navbar or utils sources nor in a `PLAN.md` code block. I checked each one: a declared new name, a path, prose, or (below) a mismatch.
3. **Type check.** `cg9/tc/` is cf4d7b8's `src/lib/sky`, `src/components/sky`, icons, `Navbar.tsx` and helpers, with the plan's code copied in verbatim from the plan's line ranges:
   - `camera.ts`, `pacing.ts`, `quietIndex.ts` and `presence.ts`;
   - `transients.ts`, with bodies I wrote for its declared functions, and the generic helpers `launchKind` and `movingOf`;
   - `meteorKind.ts` as of P8;
   - `renderSky.ts`'s stamp cache, `placePoint`, the module-scope quiet index, the new `SkyFrame` fields, `drawLayer` and `drawTransient`;
   - a `sky.worker.ts` assembled at its P8 state from 6.1, 6.2, 6.6, 6.9 and the P2 to P8 bullets (`gather`, `demandNow`, `requestFrame`, `onStalled`, the optional rAF members, `launchGate`, the thin fade and the retired `parallaxScroll`);
   - P5's `skyPause.ts`, `SkyPauseButton.tsx`, the icons, `mountSky`'s message `switch` and `syncMotion`, and Navbar's wrapper and header changes;
   - P9 to P11's config blocks, `gaps.ts`, R2 §10's radiant bodies and the satellite kind, with both kinds in the registry and the drawing switch.

   tsc 6.0.3 ran with the repository's compiler options, and ESLint ran with the repository's config.
4. **Runtime.** Under Node 24.14 type stripping, with 7.1's resolve hook:
   - `cg9/run/h-load.ts` loads `transients.ts` with both kinds and runs launches, to test 5.2's no-cycle claim;
   - `cg9/run/h-lean-zero.ts` drives the plan's own `camera.ts` and `drawLayer`'s cell range with a zero-size pointer.
5. **Restructure.** I grepped for the old split's terms (PF, "after V", 8.5 to 8.7, CP-0, CP-3 to CP-5, D10, D11, "file-by-file", "observed", `meteorScroll`), checked the archived harness lines P9 cites against the extracted archive, and re-read 4.4, 7.0, 7.2, 8.1 to 8.4 and every phase for steps the restructure may have dropped.

## Previous round's findings in this lens

- **CG8-1: fixed, no regression.**
  - 6.2 now writes `rafId = scope.requestAnimationFrame?.(onFrame) ?? null` (line 1253), states the `?.` rule (1256) and cancels with `if (rafId !== null) scope.cancelAnimationFrame?.(rafId)` (1267).
  - The assembled worker compiles with both members optional, including `onStalled`'s cancel and the scroll handler's unchanged `!rafId` test (cf4d7b8 `sky.worker.ts:535`).
- **CG8-2: fixed (with DRY-R8-1), no regression.**
  - `easing` and `easeEnded` take `since: number | null` (lines 1075 to 1083).
  - P6's `easing(thinnedAt, …)` and `easeEnded(thinnedAt, …)` compile beside `fadeOutAt(thinnedAt, …)`.
  - The motion ease's `easing(motionLevel.since, …)` still compiles.
- **CG8-3: fixed.** The heading at line 1250 cites `:154-160` and `:167-209`. That is cf4d7b8's `cancelFrames` (154 to 160) and `schedule` through `tick` (167 to 209), and leaves out `meteorsAllowed` (162 to 165).

## What held

- **References.** All explicit `file:line` references resolve on cf4d7b8. That includes the re-grounded ones the restructure log lists (for example `sky.worker.ts:535`, `:135-152`, `:467-493`, `:143-144`, `mountSky.ts:214`, `:328-335`, `renderSky.ts:237`, `config.ts:171`, `:247-250`, `meteors.ts:195-196`, `:204-207`, `:208-213`, `:215-220`, `:224`, `:229`, `:236`). Three bare references are ambiguous (CG9-4).
- **Archived harness.** The lines P9's verification cites match the extracted archive: `sim2.mjs:23-24` and `:28`, `render3.mjs:134`, `check11/render3-canvas.mjs:136`, the frame literals at `render3.mjs:36-37`, `render3.mjs:12`'s import of the unarchived `code-logic/lib.mjs`, and `live/alib.mjs`'s `launch`.
- **No leftovers from the split.** No before/after-V, PF, file-rule or 8.5 to 8.7 clause remains, and section 3's note about D10 and D11 is accurate.
- **Veil symbols.** Every veil symbol the plan calls has cf4d7b8's signature: `planMeteor` with `PlanOptions`, private `planFlight` with `PassOptions`, `scrollKept`, `transientQuietFactor`, `budgetKeeps`, `inkBudget`, `screenQuietZones`, `QuietBlend.next`, `drawMeteor`'s `fade`, `contrastLevels`, `quietEasing`, `settleQuiet` and `QUIET_REACH`.
  - Nothing imports `fitKeep`, `luminance`, `contrastRatio` or `segmentTouches`.
  - `clearOf` uses `segmentTouches` only inside `meteors.ts`, which is not an import.
- **Type check.** The assembled P1 to P8 tree, the P5 main-thread pieces and the P9 to P11 kinds pass tsc 6.0.3 with the repository's options, except R2's `meteorRange` (CG9-2). ESLint reports 0 errors and 1 warning (CG9-5).
- **Module graph.** `transients.ts` with both kinds loads and launches under Node 24.14 type stripping, with no temporal-dead-zone error.
- **Import rules.** The AGENTS.md sky import rules hold for every new or changed file the plan lists. There are no namespace imports and no Cache Components APIs.

## Findings

### CG9-1 (major): the lean's pointer listener has no guard for a missing size, and a non-finite pointer hangs the worker

- **Section.** 6.13, "The pointer listener (P7; R3 §8)" (lines 2785 to 2795), and P7's files (line 3175).
- **Problem.**
  - The listener's rules say only "Normalized to −1 to 1 with the ResizeObserver's size, so it causes no layout read" (line 2793), and never say what happens before that size exists. In cf4d7b8 `size` is `{ width: 0, height: 0, dpr: 0 }` until the canvas ResizeObserver's first callback (`mountSky.ts:217`, `:245-249`, `:276-280`), and P7 registers the listener in the same `mountSky` call.
  - So a pointermove in the frame after mount normalizes by 0. Chrome dispatches continuous input just before rAF callbacks, and ResizeObserver notifications come after layout in that frame (R3 §8's notes).
  - R3 §8, which the bullet's heading cites, guards this with `|| !size.width` and clamps each axis with `Math.min(1, Math.max(-1, …))` (R3 lines 766 to 768). `PLAN.md` keeps neither. Its own activity ping spells out the matching guard ("Before init there is no worker clock to wake", `if (offscreen || …)`, lines 1651 and 1652), and section 13 says "This plan carries every body it relies on, except R2 §10's radiant functions" (line 3653), so nothing sends the implementer to R3 for this body.
  - The worker's `pointer` case trusts `at` (line 2795).
- **What happens with an infinite pointer** (clientX above 0, width 0).
  - `stepSpring` yields NaN.
  - `settle` then puts the spring on its target, because `NaN >= CAMERA.restPx` is false (camera sketch, lines 672 to 676). That target is Infinity.
  - So `cameraOffset` is Infinity, and `drawLayer`'s cell loop, `for (let cx = x0; cx <= x1; cx++)` with x0 = x1 = Infinity (lines 1549 to 1556), never ends. SF2's key guard doesn't help, because it bounds keys, not the loop.
  - The worker hangs at its first drawn frame with the lean active: the sky freezes and a core stays busy until the tab closes.
  - A pointer at clientX 0 gives NaN instead, and that blanks the sky until a valid pointer arrives.
- **How the bad target survives.**
  - The stale target outlives `init`, which recreates the camera but not the worker's lean target, until another pointer message overwrites it.
  - A visitor who moves the mouse as the page hydrates and then waits through the 3 s loader hangs the worker on the first tick after `emerge`.
  - D3's default ships P7 (line 163).
- **Evidence.**
  - [computed, `cg9/run/h-lean-zero.ts`, with the plan's own `camera.ts` and `LAYER_NEARNESS`] The posted pointer is `{ x: Infinity, y: Infinity }`. After `stepCamera`, `leanX` is `{ value: Infinity, velocity: 0 }`, the cell range is x0..x1 = Infinity..Infinity, and the loop passed 10⁶ iterations (capped) on each of three steps.
  - The drafts and every committed `PLAN.md` (2e622a5 to 6232c80) lack the guard, so this is long-standing rather than a regression.
- **Fix.**
  - Add to 6.13's bullets: "Nothing is sent before the first size is known (R3 §8's `!size.width`, or the activity ping's `offscreen` test), and each axis is clamped to −1..1."
  - Optionally, the worker's `pointer` case ignores an `at` whose coordinates aren't finite (`Number.isFinite`). That is one line of defense for the camera, which no other input can make non-finite.

### CG9-2 (minor): R2's `meteorRange`, taken "as written", reads `SKY_WINDOW` keys the plan renamed

- **Section.** 6.10, `src/lib/sky/radiants.ts` (line 2515), against `SKY_WINDOW` (line 2363).
- **Problem.**
  - The plan says `radiantMotion`, `elevationAt`, `meteorRange`, `toward` and `sampleRadiant` "are R2 §10's sketches as written", and section 13 says their bodies are in R2.
  - R2's `meteorRange` reads `SKY_WINDOW.earthRadius` and `SKY_WINDOW.meteorHeight` (`R2-meteors-bodies.md:619-620`). CONV5-2 renamed them `earthRadiusKm` and `meteorHeightKm` in the plan's `SKY_WINDOW`.
- **Evidence.** [computed, `cg9/tc/src/lib/sky/radiants.ts`] tsc 6.0.3 with the plan's `SKY_WINDOW` reports TS2551 at both reads: "Property 'earthRadius' does not exist … Did you mean 'earthRadiusKm'?", and the same for `meteorHeight`. With the two names changed, the file compiles.
- **Fix.** At line 2515, write "as written, except that `meteorRange` reads `SKY_WINDOW.earthRadiusKm` and `meteorHeightKm`".

### CG9-3 (minor): `presence` must exist before `init`, but the plan only assigns it there

- **Section.** 6.6, Presence (line 1634), and P4's files (line 3069).
- **Problem.**
  - The plan says only that "`init` sets `presence = createPresence(now)` where today it sets `lastInputAt = now`". But messages reach `noteInput` before `init`:
    - `mountSky` posts `scroll` from Motion's `scroll()` with no init guard (`mountSky.ts:301-308`);
    - it posts `visible` on any visibility change (`:311`);
    - the worker calls `noteInput` from both handlers (`sky.worker.ts:533`, `:521`), and from P7's `pointer` case.
  - Today that state is initialized where it is declared (`let lastInputAt = 0`, `let wokeAt = -Infinity`, `sky.worker.ts:57-58`).
  - A `let presence: Presence` assigned only in `init` passes tsc, which checks no definite assignment across functions. It then throws a TypeError in the worker on such a message, and the worker's `error` event makes `mountSky` destroy the sky (`mountSky.ts:337`).
- **Evidence.** The cited lines. The plan already declares the camera this way (`let camera = createCamera(0)`, line 836).
- **Fix.** In 6.6, write "declared as `let presence = createPresence(0)` (today's starting values), as the camera is, and `init` sets `presence = createPresence(now)`".

### CG9-4 (minor): three bare line references point at the wrong file by proximity

- **Section.** 6.1, line 467; 6.10, lines 2608 and 2620.
- **Problem.** Each bare `:N` follows an explicit reference to another file:
  - Line 467's `(:73)` comes after `renderSky.ts:100` but means `config.ts:73`, the `LAYERS` doc. `renderSky.ts:73` is `SkyFrame.keep`'s doc.
  - Line 2608's "(the `nearCopy: false` test, `:226-228`)" and line 2620's "(`:226-228`)" come after `mountSky.ts:122-124` but mean `meteors.ts:226-228`, the `near` filter and the fireball and `nearCopy` test. `mountSky.ts:226-228` is the start of `measureLayout`.

  The restructure log says ambiguous bare references were made explicit. These three were missed.
- **Evidence.** `cg9/refs.txt`: `config.ts:73` is "The three depth layers: magnitude bands, scroll parallax, …", and `meteors.ts:226-228` is `const near = field.quiet.filter(…)` through `if (mayDim && (fireball || !copyAllowed)) continue`.
- **Fix.** Write `config.ts:73` and `meteors.ts:226-228`.

### CG9-5 (minor): P1 leaves `SHAPE_COUNT` unread, a lint warning the plan doesn't remove

- **Section.** 6.3, Index (line 1330), and P1's `renderSky.ts` files (lines 2968 to 2974).
- **Problem.**
  - P1 replaces `sprites[star.tint * SHAPE_COUNT + star.shape]` (`renderSky.ts:127`) with `starSpriteIndex` in `skyAssets.ts`. That leaves `SHAPE_COUNT` (`renderSky.ts:89-90`), and then its `STAR_SHAPES` import, with no reader.
  - Section 6's intro treats an unread constant as a lint warning to avoid, but P1's list doesn't drop these.
- **Evidence.** [computed] ESLint with the repository's config on the assembled tree reports `renderSky.ts: 'SHAPE_COUNT' is assigned a value but never used (@typescript-eslint/no-unused-vars)`, the rule at `eslint.config.mjs:13`.
- **Fix.** P1's `renderSky.ts` list gains "`SHAPE_COUNT` and the `STAR_SHAPES` import go (the index now lives in `skyAssets.ts`)".

## Summary

- **Verdict.** One major, CG9-1. P7's pointer listener, which D3's default ships, doesn't say to wait for the canvas's first measured size or to clamp. One pointermove in the frame after mount sends a non-finite lean target, and with the plan's own spring and culling code that sends `drawLayer`'s cell loop to Infinity: the worker hangs. R3 §8 had the guard and clamp; the plan's text, which says it carries every body but R2 §10's, lost both. The fix is one sentence in 6.13, plus an optional finite check in the worker.
- **Minors.**
  - R2's `meteorRange` "as written" uses `SKY_WINDOW` names the plan renamed (TS2551 twice).
  - `presence` must be initialized where it is declared, since `scroll`, `visible` and `pointer` messages can precede `init`.
  - Three bare `:N` references sit next to another file's reference.
  - P1 leaves `SHAPE_COUNT` unread.
- **Round 8 and the restructure.** All three round-8 fixes in this lens landed correctly, with no regressions. The restructure's re-grounding is right everywhere else, no clause from the old split survives, and the assembled P1 to P11 code type-checks and lints clean apart from the items above.

## Verification

Skeptic pass, round 9, 2026-10-27. Re-checked against `PLAN.md` as saved at 23:11, `COORDINATION.md` in full, R3 §8, the drafts, the cf4d7b8 checkout (`.claude/worktrees/sky-baseline-cf4d7b8`, the baseline for every code `file:line` below) and the HTML Living Standard's "update the rendering" steps (https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model). My own scripts copy the plan's lines rather than reuse the checker's harness: `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/skeptic-cg9-r9/lean-check.mjs` and `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/skeptic-cg9-r9/axes-check.mjs`. The one major finding stands, so this lens does not pass.

- **CG9-1: confirmed, major.** Every load-bearing fact holds. 6.13 says only "Normalized to −1 to 1 with the ResizeObserver's size" (`PLAN.md:2793`): no rule for the time before that size exists and no clamp, though R3 §8 has both (`R3-rendering-engineering.md:766-769`) and the plan's own activity ping has the matching pre-init test (`PLAN.md:1651-1652`); `git log -S` finds `size.width` in no committed `PLAN.md`. At cf4d7b8 `size` stays `{ width: 0, height: 0, dpr: 0 }` until the canvas observer's first callback (`mountSky.ts:217`, `:245-249`, `:276-280`), the sky mounts at hydration under the loader (`IntroGate.tsx:74`, `SkyCanvas.tsx:20-29`), and the standard runs the animation frame callbacks (step 14) before layout and the resize-observer broadcast (steps 16.2.1 to 16.2.6), with Chrome dispatching continuous input just before those callbacks (R3 §8's notes): any pointermove from mount to that first broadcast divides by 0. My run of the plan's `stepSpring` and `settle` (`PLAN.md:663-676`), the lean lines (`:707-710`), `cameraOffset` (`:764-769`) and `drawLayer`'s cell range (`:1549-1556`) reproduces the chain: an infinite target steps to NaN, `settle` then puts the spring on Infinity (`NaN >= restPx` is false), and the cell loops never end. Four corrections, none of which weakens it: (a) the heading's "(P7; R3 §8)" does cite R3, and the base draft said the listener should "follow R3 §8" (`plan-domain-model-first.md:2204`), but `PLAN.md` turned that into a restatement of R3's other rules, and section 13 says the plan carries every body except R2 §10's (`:3653`), so an implementer builds from the bullets; the experience draft's worker-side `clamp(pointer, −1, 1)` (`plan-experience-first.md:334`) was lost too, and alone it would turn Infinity into 1 but leave NaN; (b) the outer loop runs over rows, so a pointer with clientY above 0 hangs the worker (clientX 0 included), and only clientY 0 gives the starless sky instead, where `leanWanted` stays true (NaN !== NaN) and frames keep coming until the next pointer message; (c) the hang needn't wait for emerge: `mountSky` posts `layout` right after `init` (`mountSky.ts:272`), its `needsDraw` (`sky.worker.ts:547`) keeps the sleeping worker's one timer (`PLAN.md:1048`, `:1261`), and `tick` steps the camera before it draws (`:887`, `:1263-1265`), so the worker hangs within milliseconds of `init`, under the loader, and the stars never come out; (d) if `presence` is assigned only in `init` (CG9-3), the pre-init `pointer` case's `noteInput` throws first and the worker's `error` event makes `mountSky` remove the sky (`mountSky.ts:337`), a different failure that the same guard prevents. Major, not blocking: a missing step (a guard and a clamp the cited source had) in a phase D3's default ships (`PLAN.md:163`), not a wrong design. The fix is right and breaks no `COORDINATION.md` constraint (P7 already adds this listener inside `mountSky`): `size` gets its first value in the same `sendSize` call that posts `init` and clears `offscreen` (`mountSky.ts:249-271`), so either test works; "nothing is sent" also covers the `null` messages from `pointerout` and `blur`; the clamp keeps 6.5's lean bound (12 × √2 × 1.6 = 27 px, `PLAN.md:1526`) for any pointer reported outside the canvas's box; and the worker's `Number.isFinite` test stays optional, since with the guard and clamp nothing non-finite is sent.
