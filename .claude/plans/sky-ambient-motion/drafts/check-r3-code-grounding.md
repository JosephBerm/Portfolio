# Check r3: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 3. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens. Does every file, function, type, message and constant it names as existing exist with that shape in the worktree (master 246c0aa)? Is everything new marked new? Do its statements about current behavior match the code? Can its integration points work with today's worker state machine, frame scheduler, star cache, `mountSky` and protocol? Also: the AGENTS.md sky import rules for every new or changed file, no Cache Components APIs, and client components that follow the codebase and the installed Next.js 16.4.2 docs. In round 3: confirm that each round-2 fix in this lens landed correctly, and look for regressions the revision introduced.
- **Inputs.** `PLAN.md` (3,572 lines, read in full); `HANDOFF.md`; `COORDINATION.md`; `research/00-shared-brief.md` and `research/01-planning-brief.md`; R2 §10 (the radiant sketches the plan adopts as written); my round-2 report and the round-2 dispositions; the worktree code (`src/` equals 246c0aa); `node_modules/next/dist/docs` and TypeScript 6.0.3 in the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration. Throwaway scripts live in the session scratchpad (`check-r3-cg/`), not in the repository. Never POST to `/api/schedule/book`.

## Verdict: revise

One major finding and five minor ones, no blocking ones. The major one is a regression from round 2's CG2-4 fix: in P8 a resize no longer resets the sticky radiant, so P8 stops launching as its oracle does and H7 can't pass. A second, minor one is a residue of round 2's CG2-3 fix (my own suggestion): the first Play after a still load still moves every star by up to 0.71 device px.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG3-1 | major | 6.9 (P8 worker), P8, H7 | `dropTransients` keeps the memory and `forgetVisitSky` starts in P9, so in P8 a resize keeps the old radiant |
| CG3-2 | minor | M1, 6.3, AC-9, AC-27 | the first Play after a still load switches every star from snapped to phased in one frame (up to 0.71 device px) |
| CG3-3 | minor | 7.0, P3, P4, P6, P7, P8 | five steps still don't compile in the order written (TS2678, TS2345 reproduced) |
| CG3-4 | minor | P10, 6.9 `PlanContext` | the fireball "after" rule needs the time since the reveal, which a planner never gets |
| CG3-5 | minor | 6.9, 6.10, 8.6 | P9's aim loop runs both passes per aim, which may undo the veil session's long-before-fallback order |
| CG3-6 | minor | 6.12 comet, AC-25 | the comet's box test runs on layout and scroll steps, but the camera law moves it every frame |

## Round-2 fixes in this lens: verified

| Round-2 ID | Landed? | Where |
|---|---|---|
| CG2-1 | yes | `leanPending` requires full motion (6.2 table, line 1133; 6.13, line 2590); H13 case 5 (line 2689); AC-14 in P7's verification and checklist (lines 2968, 2971). Traced: under a pause `driftWanted` and `leanPending` are false, `stepCamera` returns `input.drift > 0` only, the drift eases out with the motion level, and the camera demand ends after one final frame. |
| CG2-2 | yes | Fallback timer at `lastDrawAt + divisor.k × 1000 / PACING.fallbackFps` (line 1157); `tick` uses that interval and `demand.fps` in fallback mode (line 1167); the fade timer keeps `needsDraw ? 0` (line 1164); H4 case (line 2680). |
| CG2-3 | yes, with a residue | `skyMoved` (lines 795, 842, 845, 851), M1, S4, the 6.3 table, H13 case 3. A pause no longer hops; the first Play after a still load still does: CG3-2. |
| CG2-4 | yes, with a regression | `dropTransients` keeps the memory, `forgetVisitSky` added (lines 2017-2022, 2161), R1 (line 307). The P8 radiant reset on resize is lost: CG3-1. |
| CG2-5 | yes | A production build ends every phase (lines 409, 2620; R-18). |
| CG2-6 | yes | P2 step 3, P2's verification and AC-35 compare H2's scroll-0 rows only (lines 2802, 2811, 3327). |
| CG2-7 | yes | `radiantTries` redefined (line 2273); the fireball path through I2 in P9 (line 2418). |
| CG2-8 | yes | The ported-lines rule with `git diff 246c0aa..<their SHA>` (line 3204); 8.6's `tick` and `draw` rows (lines 3218-3219); re-verify items 4 and 5 (lines 3239-3240). |

Other round-2 fixes that touch this lens: C19 (`wakeColor`, no clash with `Meteor.wake` at `meteors.ts:39-40`) and C22 (the ADAPT fade, consistent with `frameAt`'s keep at `sky.worker.ts:259` and the keep test at `renderSky.ts:113`) landed. C18 landed for P1, P2, P8 (the moved keys), P9 and P11, with residues: CG3-3.

## Checked and consistent (no finding)

- **Citations.** Every `file:line` in the plan was listed by script and checked against the worktree, including those new in round 3: `globals.css:55` (and the reduced-motion override at `:473-475`), `Navbar.tsx:73`, `utils.ts:25-26`, `meteors.ts:39-40`, `:138`, `:148-149`, `:156`, `:158-159`, `config.ts:250`, `:270-274`, `:283`, `:305`, `:316-318`, `sky.worker.ts:207-214`, `:259`, `:295-298`, `:369-370`, `:475-481`, `mountSky.ts:87-92`, `renderSky.ts:113`, `scene.ts:76`, `:89`. All match.
- **Sketches compile.** The plan's `pacing.ts` (with the full `createRefreshEstimate` body), `quietIndex.ts` (the full `createQuietIndex` body), `camera.ts` (with the `maxLag` cap) and `presence.ts`, extracted verbatim from `PLAN.md` and type-checked with TypeScript 6.0.3 under the repo's compiler options (`strict`, `noUncheckedIndexedAccess`, `isolatedModules`), give no errors. `SPEED_CLASSES` with `wakeColor` satisfies its interface.
- **The lag cap.** It moves the value and keeps the velocity; `settle` still lands exactly; `resumeCamera` resets `lastGoal`, so a resume never counts as a jump; `snapViewports = 0` still follows the scroll exactly. IntroGate's hash jump (`IntroGate.tsx:63`, `behavior: 'instant'`) is one step, so it snaps.
- **R2 §10.** `skyWindow`, `toward`, `sampleRadiant`, `radiantMotion`, `elevationAt` and `meteorRange` (R2 lines 565-622) match the plan's signatures; `() => number` equals the plan's `Random`.
- **Import boundaries (AGENTS.md).** Unchanged from round 2 and still clean: new `src/lib/sky` files import siblings only; `radiants.ts` imports only types from `meteors.ts`, `satellites.ts` only types from `transients.ts`; worker files import `@/lib/sky/*` and each other; `mountSky.ts` and `skyPause.ts` import nothing but types and `color.ts` from `src/lib/sky`. Navbar imports through the `@/lib` and `@/components/icons` barrels, and it renders only on `/` (`page.tsx:7`), so the toggle may too.
- **Next.js 16.4.2 docs.** The quoted lines (`05-server-and-client-components.md:178-180`, `preventing-flash-before-hydration.md:11`, `scripts.md:128`, `08-turbopack.md:130`) say what the plan quotes. No Cache Components API appears.
- **A hypothesis I tested and dropped.** P9 re-picks the visit's sky on any layout whose rects differ (`sameRects` is exact). I checked in the desktop app's Chromium (152) whether `mountSky`'s document coordinates (`top + scrollY`, `mountSky.ts:96-98`, `:113`) drift between scroll positions: at DPR 1 the browser rounds scroll offsets to whole pixels, even for `scrollTo` with fractions, and 11 positions gave bit-identical JSON. Fractional DPR couldn't be emulated there, so this is not a finding.

## Findings

### CG3-1 (major): in P8 a resize no longer resets the sticky radiant

- **Section.** 6.9 "In the worker (P8)" (line 2161), `dropTransients` and `forgetVisitSky` (lines 2017-2022), `VisitMemory` (lines 1902-1909); P8's files and "no visible change" (lines 2989-2990, 3001); H7 (line 2683); P9's files and step 2 (lines 3019, 3025); PF step 3 (line 3122).
- **Problem.** The CG2-4 fix made `dropTransients` keep the visit's memory and moved every memory reset into `forgetVisitSky`, which the worker calls only "From P9" (line 2161). But in P8 that memory is the sticky radiant (lines 1902-1905), and today's `resize()` clears it (`radiant = null`, `sky.worker.ts:369`), the very line the plan maps to `dropTransients` (`:369-370`). So after a resize, P8 keeps planning from a radiant picked for the old viewport (`pickRadiant` scales it by the old width and height, `meteors.ts:67-72`). Today's code picks a fresh one, and so does the veil session's agreed sticky radiant, "re-picked on resize, on layout, or after N failed plans" (`COORDINATION.md:49`). P8 promises "the same radiant behavior ... (H7's oracle equality)" (line 3001), and H7's random sequences include resize (line 2683). Under PF the oracle is today's planner (line 3122), so the mismatch is certain there.
- **Evidence.** [computed, `check-r3-cg/p8-resize.ts`, the worktree's real `planMeteor`, `pickRadiant` and `nextMeteorGap`, loaded through the plan's 7.1 resolve hook on Node 24.14] A launch at 1440 × 900, a resize to 1280 × 720, then the next launch, once with today's reset and once as P8 is written: the second launch's start, direction, duration or next attempt differs in 1,000 of 1,000 seeds (seed 1: start x 681.8 against 1259.8, next attempt at 91.81 s against 96.78 s).
- **Fix.** Call `forgetVisitSky` from P8 wherever the oracle drops the radiant: on resize always, and on layout as well if the veil commit re-picks there. In P8 it clears `visit.radiant`, from P9 `visit.sky`. Move "`forgetVisitSky` on resize" from P9's files into P8's (step 3), keep P9's own change (the changed-rects layout branch and the memory's new shape), and add "a resize between two launches" to H7's oracle cases.

### CG3-2 (minor): the first Play after a still load still hops every star

- **Section.** M1 (line 283), deviation 13 (line 64), the 6.1 worker notes (lines 842, 845, 851), the 6.3 snap table (line 1278), AC-9 (line 3301), AC-27 (line 3319), 2.2 "Pressing play" (line 108); the check log's PHY-6 entry (line 3542).
- **Problem.** Round 2's CG2-3 fix, which I proposed, snaps stars while `skyMoved` is false and keeps their phases afterwards. That removes the hop at a pause, but not at the one switch from snapped to phased. A page view that starts still (OS reduced motion, or a pause remembered from an earlier visit, which P5 makes common for returning visitors) draws every star at `Math.round`; the first Play sets `skyMoved` and the next frame draws each at `Math.floor` plus its quarter phase (`placePoint`, lines 1247-1266). The plan says no star hops (M1, deviation 13), and the PHY-6 disposition says "AC-9 and AC-27 hold as written".
- **Evidence.** [computed, `check-r3-cg/firstplay.mjs`, the plan's `placePoint` over 200,000 random positions] The switch moves a star by up to 0.707 device px. With the drift easing in from 0, AC-9's "normal + 0.25 px" fails for 68.8% of stars at DPR 1 (largest 0.71 CSS px), 43.7% at DPR 1.5 (0.47) and 31.2% at DPR 2 (0.35). AC-27 asks that turning reduced motion off "resumes without a jump".
- **Fix.** Ease the first switch: while the motion level first rises in a page view, place each star at round(p) + (p − round(p)) × level through its phases, so no star moves more than a quarter device pixel per frame over the 0.3 s ease. Or state the one-time settle (at most 0.71 device px, once per page view) in M1, deviation 13, AC-9 and AC-27, and correct the PHY-6 note.

### CG3-3 (minor): five steps still don't compile in the order written

- **Section.** 7.0 (line 2616: "one commit per numbered step, each green"); P3 steps 2 and 3 (lines 2836-2837); P4 step 2 (line 2868); P6 step 1 (line 2929); P7 step 1 (line 2962); P8's files and steps (lines 2986, 2994-2999).
- **Problem.** Round 2's C18 fix reordered P1, P2, P8, P9 and P11. These remain:
  - P3 step 2 writes `frameDemand` "and its helpers", including `driftCap`, which reads `softwareFps` (lines 1114-1118), added in step 5. Step 3's `requestFrame` arms the fallback timer from `divisor.k` (line 1157), and `onFrame` samples the refresh estimate (line 1160), both added in step 4.
  - P4 step 2 adds the worker's `activity` case; step 3 adds the message to `protocol.ts`.
  - P6 step 1 adds `drift` to `CameraInput` (P7 step 1 adds `lean`) "with H5 green before any wiring", but the worker's P2-era call passes neither.
  - P8 needs I1's `nearCopy` option in step 2's meteor spec when the veil session declined it (line 2986), but no step adds it. "Always under PF" in that line also contradicts PF step 3 (line 3122), which adds I1 before P8.
- **Evidence.** [computed, `check-r3-cg/tc/`, TypeScript 6.0.3 with the repo's compiler options, on copies of `src/lib/sky` plus the plan's `camera.ts`, `pacing.ts`, `quietIndex.ts` and `presence.ts`] A `case 'activity'` against today's `SkyMainMessage` gives TS2678 ("Type '"activity"' is not comparable to type '"init" | "resize" | ... | "layout"'"). The P2-era `stepCamera(camera, { time, scroll, viewportHeight, follow })` call gives TS2345 ("missing the following properties from type 'CameraInput': drift, lean").
- **Fix.** P3: declare `softwareFps = Infinity` in step 2, and use k = 1 with no estimate in step 3 (or merge steps 3 and 4). P4: move the `activity` message into step 2. P6 and P7: let step 1 pass `drift: 0` and `lean: { x: 0, y: 0 }` from the worker. P8: add I1 to step 2 when the veil session declined it, and drop "always under PF".

### CG3-4 (minor): the fireball "after" rule needs the time since the reveal, which a planner never gets

- **Section.** P10's files (line 3047); `PlanContext` (lines 1911-1922); `LaunchGate` (lines 1978-1987).
- **Problem.** P10 has the meteor spec decide fireballs "before planning: desktop only, at least `after` s since the reveal, at least `spacing` s since the last one (in `VisitMemory`), and `chance` per launch". The spec's only per-launch hook is `plan(context)`, and `PlanContext` carries `random`, `now`, `field`, `visit`, `mayCrossCopy` and `narrow`, not the reveal time. `LaunchGate.sinceReveal` exists, but it never reaches a planner, and P10's file list doesn't add it.
- **Fix.** Add `sinceReveal` to `PlanContext` in P10, filled from `gate.sinceReveal` in the launch step (or keep the reveal time in `VisitMemory`), and list it in P10's files.

### CG3-5 (minor): P9's aim loop may undo the veil session's long-before-fallback order

- **Section.** 6.9 `planMeteorTransient` (lines 1950-1957); 6.10 `planMeteor` (line 2405); 8.6's `updateMeteor` row (line 3222).
- **Problem.** `COORDINATION.md:14` records the veil session's plan to split `planMeteor`'s long pass from its short fallback "so the worker can try fresh radiants before falling back", and `:17` its "radiant ordering" in `updateMeteor`. 8.6 ports that ordering into P8's meteor spec. P9 then rewrites the loop: the first aim, then up to `radiantTries` fresh aims, each through one `planMeteor` call that runs both passes (line 2405 has no pass option). A first aim whose long pass fails but whose fallback fits then flies a short flight without trying a fresh aim for a long one: today's order, which their split exists to change. H8's launch figures come from that per-aim order.
- **Fix.** If their commit splits the passes, state in 6.9 and P9 that `planMeteorTransient` keeps their order (the long pass over the first and the fresh aims, then the fallback over them), give `PlanOptions` the pass or keep their two entry points, and rerun H8's launch parts that way. CP-5 is where this gets settled.

### CG3-6 (minor): the comet's box test misses the camera's own motion

- **Section.** 6.12's comet row (line 2544) and the note under the table (line 2547); AC-25 (line 3317).
- **Problem.** The comet is "a `SkyBody` with a world position and a declared nearness, drawn after the layers with the camera law", and "Static bodies ... obey the camera law like stars". That law moves it every frame by q × (C_drift + C_lean) (lines 420-425): up to 205 × q px of drift (C3, line 271) and 17 × q px of lean, with no scroll and no layout. But its box test, which fades it over `cancelFade` before it nears a padded rect, runs only "on every layout and scroll step" (lines 2544, 3317). Between those steps the drift can carry the box into a rect's feather, where `clearSkyFactor` cuts the parts inside to zero with no fade: a nucleus or tail clipped by an invisible box. Contrast stays safe; the look doesn't.
- **Fix.** Re-test the box on every drawn frame (one box against at most 64 rects), or take the comet out of the drift and lean (q = 0 for C_drift and C_lean), and say which in 6.12 and AC-25.

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r3-cg/` (not in the repository):

- `p8-resize.ts`, with `ts-resolve.mjs` and `register.mjs` (the plan's 7.1 hook): today's resize rule against P8's, with the worktree's real planner (CG3-1).
- `firstplay.mjs`: the snapped-to-phased switch on the first Play (CG3-2).
- `tc/`: the type-check project with the plan's sketches and the step-order cases (CG3-3; the sketches themselves compile cleanly).
- `rects.html`: the rect-measurement fixture for the dropped float-noise hypothesis (the test itself ran in the desktop browser pane on a blank page).
