# Audit: codebase conventions (gate round 6)

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` after round 5's revisions (3,979 lines).

## Scope

- **Role.** One of the four auditors, gate round 6. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code actually uses. It confirms that round 5's conventions fixes (CONV5-1 to CONV5-3) landed, and looks for regressions from round 5's other fixes.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)") and `research/01-planning-brief.md`.
  - All of `PLAN.md`; the round 4 and round 5 reports (`audit/conventions.md`, `audit/conventions-gate-r5.md`) and round 5's dispositions.
  - The worktree at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, the icons and their barrel, the `src/lib` and `src/hooks` barrels, `utils.ts`, `globals.css`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `next.config.ts`, `.claude/launch.json`, `README.md`, `AGENTS.md`, `CLAUDE.md` and `git log`.
  - The main checkout's uncommitted veil edits, read only, where names meet: `config.ts`, `scene.ts`, `meteors.ts`, `sky.worker.ts` and the `AGENTS.md`, `Introduction.tsx` and `SidePane.tsx` diffs.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only. Nothing in `PLAN.md`, `src/` or configuration was edited in either checkout. Throwaway scripts live in the session scratchpad, `conventions-gate-r6/`.
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other scopes, and appear here only where they touch a convention.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then every source file the sketches extend.
2. Diffed round 5's input (`check-r5-completeness/PLAN.snapshot.md`, 3,935 lines) against the current plan: 203 lines changed, 47 of them inside fenced blocks (46 in TypeScript sketches, one in 4.1's module diagram). Each was checked for style, imports, names and docs.
3. Re-ran round 5's block scanner over all 41 TypeScript, TSX and JavaScript blocks (tabs, line-end semicolons, quotes, em dashes, namespace imports, import paths, plan IDs and `file:line` in comments), its session-wording scan, and a new scan for exported declarations without a doc comment.
4. Grepped for leftovers of every name round 5 changed (`motionEase` as a variable, `FrameState.camera`, `meteorScrollQuietMs`, `SATELLITE.speed`, `meteorHeight`, `earthRadius`), and checked the plan's names against the veil tree's exports for collisions.
5. Linted a probe of the `LAYER_NEARNESS` sketch with the repository's rule set (`eslint-config-next` core-web-vitals and typescript, plus the repository's overrides) on Node 24.14.0.

## Round 5's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV5-1 | landed | The 7.0 rule (2857) and section 6's intro (432) now also drop wording about the two sessions' process. The `TRANSIENTS` doc says "so copy crossings stay rare" (2257); `METEOR_BRIGHTNESS` says "the veil fits any peak to each copy's INK_BUDGET" (2460-2461), and 8.7 item 1 carries PF's peak bound (3533). The ten comment lines that still carry session wording (1447, 2108, 2122-2123, 2574, 2599, 2601, 2603, 2605, 2607) are all covered by the extended rule, and none is a committed config doc. |
| CONV5-2 | landed | `SKY_WINDOW.meteorHeightKm` and `earthRadiusKm` with their doc (2388-2391); `SATELLITE.angular` (2683), its doc (2668), `SatellitePass.speed` (2720) and 6.11's speed bullet (2760). No `SATELLITE.speed`, `meteorHeight:` or `earthRadius:` is left. |
| CONV5-3 | landed | The worker's ease is `motionLevel` (870, 886, 909, 1236, 1710-1711, 3143), and `motionEase` survives only as the seconds key (1705). `FrameState.cameraActive` (1060, 1077, 1216, 1232). The scroll-quiet key moved to `TRANSIENTS.scrollQuiet` (2272, 2279, 3240, 3252, 3254) with `LaunchGate.settled`'s doc (2157). |

## Findings

### CONV6-1 (minor): docs out of step with the phase that commits them

- **Section.** 6.7 (P8's rename); 6.9 (`TRANSIENTS`, the envelope and spec docs, `drawTransient`); 7.3 (P4, P8 and P11 file lists); 7.0.
- **Problem.** Round 5 fixed the scroll-quiet key's stale doc (CONV5-3 with DRY-R5-3), but its siblings still go stale or run ahead of their phase:
  1. P8 renames `SCENE.heroMeteorMaxScroll` to `heroLaunchMaxScroll` "because it then gates every kind" (1735), yet its inline doc stays "Shooting stars only while no more than this many viewport heights are scrolled". Neither P8's nor P11's config list rewrites it (3240, 3332), so from P11 it hides that satellites pass the same gate.
  2. P8 moves `METEOR.narrowLimit` into `TRANSIENTS` (2279, 3240), but `METEOR`'s narrow-block doc still names "`narrowLimit` per visit" until P9 rewrites that doc (2479). P8 can reach master on its own (2848), so master would carry a doc naming a key `METEOR` no longer has.
  3. P4 makes `SkyFrame.time`'s doc "shooting stars only" (3115). From P11, satellites read it too: `drawTransient` draws every kind "at the frame's time" (2332), and `satelliteAt` takes that time (2745).
  4. Docs that P8 commits name what only P11 adds:
     - `TRANSIENTS`: "(shooting stars, satellites)" (2252);
     - `TransientEnvelope.clearSky`: "drawn with CLEAR_SKY_KEEPS" (2038);
     - `TransientSpec.lease`: "(satellites) ... CLEAR_SKY_KEEPS" (2084);
     - `drawTransient`: "Clear-sky kinds draw with CLEAR_SKY_KEEPS" (2333).

     `CLEAR_SKY_KEEPS` lands in P11 (3332), and P11 is a "should" (3328). If it never ships, these docs name a constant and a kind that don't exist. The 7.0 rule covers plan references, not this.
- **Evidence.**
  - Worktree `config.ts:155-156` (the SCENE key and its doc), `config.ts:283` and `:289` (the narrow-block doc and `narrowLimit`), `renderSky.ts:64` (`SkyFrame.time`'s doc).
  - The veil tree leaves both config docs as they are (main checkout `config.ts:170`, `:298`), so V doesn't change this.
  - The PLAN.md lines above.
- **Fix.**
  1. P8's config line: the renamed key's doc becomes "Transients launch only while no more than this many viewport heights are scrolled", and the narrow-block doc drops "`narrowLimit` per visit" (P9 rewrites the rest).
  2. P4 writes `SkyFrame.time`'s doc without naming a kind: "Seconds on the worker clock (transients; the twinkle reads twinkleTime)".
  3. One line in 7.0: "A committed doc describes what its phase ships; the phase that adds a kind or a constant extends the docs that name it (P8's docs say shooting stars and clear-sky kinds; P11 adds satellites and `CLEAR_SKY_KEEPS`)."

### CONV6-2 (minor): `TRANSIENTS.scrollQuiet` is in seconds, but its one reader runs on the worker's millisecond clock

- **Section.** 6.9 ("In the worker", `LaunchGate`, `TRANSIENTS`); P8 (files, step 3, verification); 7.1 (H13).
- **Problem.** DRY-R5-3's fix moved `FRAME.meteorScrollQuietMs` (1200) into `TRANSIENTS.scrollQuiet` (1.2), a seconds key under `config.ts:2-3`'s unit rule. Its only reader is the worker's launch gate, which works in worker milliseconds (`now` and `lastScrollAt`).
  - The plan spells out the ms-to-seconds conversion for `holdTransients` and `retryTransients` (2360).
  - For this test it says only "now against `TRANSIENTS.scrollQuiet`" (2358), and P8's file list says the old key "becomes" the new one (3240).
  - A mechanical port, `now - lastScrollAt < TRANSIENTS.scrollQuiet`, compiles and holds a launch for 1.2 ms instead of 1.2 s. Shooting stars would then launch mid-scroll in the hero, against P8's "no visible change" (3256-3258).
  - No listed check catches it. H7 feeds the scheduler gates that its own harness builds, since the worker exports nothing (2911, 2932), and no H13 case scrolls just before a due launch (2938).
- **Evidence.**
  - Worktree `sky.worker.ts:51-52` (`lastScrollAt` in "Milliseconds on the worker clock") and `:202` (`now - lastScrollAt < FRAME.meteorScrollQuietMs`).
  - `config.ts:2-3`.
  - PLAN.md 2157, 2272, 2279, 2358, 2360, 3240 and 3254.
- **Fix.**
  1. In 6.9, write the line out: `settled: now - lastScrollAt >= TRANSIENTS.scrollQuiet * 1000` (worker ms against the key's seconds), as 2360 does for the hold and retry.
  2. Add one H13 case for P8: a launch due 0.5 s after a scroll message waits until 1.2 s after it.

  Keeping the key in its reader's unit, `TRANSIENTS.scrollQuietMs: 1200`, which `config.ts:2-3` allows, would also remove the trap.

### CONV6-3 (minor): two more names of the class CONV5-3 removed

- **Section.** 6.2 (`FrameState`, `demandNow`); 6.9 (`TransientSpec`, `LaunchGate`, `PlanContext`, `METEOR_SPEC`, the launch step); 6.11 (`SATELLITE_SPEC`).
- **Problem.** Both predate round 5, and round 5's audit missed them.
  1. **`FrameState.transients`** holds a `FrameDemand` (1058), while from P8 the worker's `transients` is the `TransientSchedule` (2356). After P8 one line holds both: `frameState.transients = transientDemand(transients, t)` (1230-1231, 2363). `FrameState`'s other non-flag fields name their part and their measure (`cameraSpeed`, `cameraCap`, `twinkleFps`). The worker already fills `cameraSpeed` from the function of the same name (1233).
  2. **`narrow`** has two meanings:
     - "this screen is narrow" in `DriftGate` (827), `driftCap` (1084), `PlanContext` (2065), `nextAfter`'s parameter (2075) and `LaunchGate` (2159);
     - "this kind may launch on narrow screens" in `TransientSpec` (2086-2087), `METEOR_SPEC` (2143) and `SATELLITE_SPEC` (2756).

     So the launch step tests `gate.narrow && !spec.narrow` (2235), which reads as "a narrow screen and a kind that isn't narrow". From P9, `METEOR_SPEC` also holds `narrow: true` beside a `nextAfter` whose `narrow` parameter picks `METEOR_RATE.narrow` (2136).
- **Evidence.** The PLAN.md lines above; round 5's CONV5-3 (the `FrameState.camera` and `motionEase` collisions) and its disposition.
- **Fix.**
  1. Rename `FrameState.transients` to `transientDemand` (1057-1058, 1075, 1216, 1230-1231, and 6.9's `demandNow` line).
  2. Give the spec's permission a name that reads as one, for example `TransientSpec.phones` ("It may launch on narrow screens (phones)"), in 2086-2087, 2143, 2235 and 2756.

### CONV6-4 (minor): two sketch nits an implementer would copy

- **Section.** 6.1 (`LAYER_NEARNESS` in `catalog.ts`); 6.10 (`radiants.ts`).
- **Problem.**
  1. **A shadow.** `LAYER_NEARNESS` destructures `const [brightest, faintest] = LAYERS[layer].magnitude` (490). It sits in `catalog.ts`, whose module scope already defines `brightest` and `faintest` as `MAGNITUDE`'s (`catalog.ts:50`).
     - Nothing flags it: lint and `tsc` both pass the shadow (a probe linted with the repository's rules exits 0).
     - `cellStars` names the same tuple `[from, to]` (`catalog.ts:135`).
     - The plan avoids shadowing elsewhere on purpose (`narrowScreen`, 871).
  2. **A missing doc.** `skyWindow` (2527) is the only new export in the sketches without a doc comment (a scan of all 41 blocks). Every exported function in `src/lib/sky` has one.
- **Evidence.**
  - PLAN.md 487-493, 871 and 2527.
  - Worktree `catalog.ts:50` and `:135`.
  - Scratch: `conventions-gate-r6/lint/src/catalogProbe.ts` (ESLint exit 0) and `conventions-gate-r6/docs.mjs`.
- **Fix.**
  1. `const [from, to] = LAYERS[layer].magnitude`, returning `[nearness(to), nearness(from)]`.
  2. A one-line doc on `skyWindow`, for example "The sky window for a viewport: its centre, the focal length at which the longer side spans SKY_WINDOW.fov, and its pitch."

## What passes

- **Code style in all 41 sketches.**
  - Tabs, except the markdown-nested `LEAN_POINTER_QUERY` block.
  - No line-end semicolons, and single quotes (double quotes only on JSX attributes, as in `Navbar.tsx`).
  - No namespace imports. `PLAN.md` has no em or en dash.
  - The 46 sketch lines round 5 changed (`gather`, `demandNow`, `createMeteorMemory`, the renamed keys, the new imports) pass the same checks.
- **Imports.**
  - Model files import their `src/lib/sky` siblings by relative path. Kind modules import `transients.ts` with a statement-level `import type` (2105, 2711).
  - `radiants.ts` imports `startArea` with its types from `meteors.ts` (2488), and `satellites.ts` imports `METEOR`, `skyWindow` and `between` (2706-2710). Neither forms a cycle with `transients.ts`.
  - Worker files import only `@/lib/sky/*` by file. `skyPause.ts` reads `@/lib/utils`, as `mountSky.ts:3` does.
  - `SkyPauseButton.tsx` imports `./skyPause` relatively, as `SkyCanvas.tsx` imports `./mountSky`.
- **Components and the client boundary.**
  - The control is a default export with a props interface, rendered by the client `Navbar.tsx`, so it needs no `'use client'`.
  - The icons get named re-exports in the alphabetical barrel. Navbar renders only on `/` (`src/app/page.tsx`).
- **Names.**
  - No new name collides with the veil tree's exports or worker variables.
  - New factories, steps and queries follow `create*`, `step*`, `*At` and `note*`.
  - Every new config block and main-thread constant has a doc comment.
  - Every new config key follows `config.ts:2-3`'s unit rule, `scrollQuiet` included (CONV6-2 is about its reader).
- **Process.**
  - Lint and type-check in 7.0, and `/_next/mcp` while `next dev` runs.
  - A production smoke build with our own dev server stopped, and `autoPort` from the tracked `.claude/launch.json`.
  - Conventional commit forms, and the `motion` docs query before P5's entrance.
  - No `.env` file, no Cache Components API, `data-sky-quiet` kept, and no POST to `/api/schedule/book`.
- **User-facing copy.** "Pause sky animation" and "Play sky animation" are plain and in sentence case, like "Menu" and "Home", with no em dash. The AGENTS.md line reads plainly and follows the veil's rewritten `data-sky-quiet` line.

## Summary

- **Verdict: pass.** No blocking or major findings. Round 5's three conventions fixes landed where their dispositions say, with no leftovers of the renamed names.
- **Four minor findings,** each cheap and clearly right:
  - CONV6-1: P8's rename and move leave two config docs stale, P4's `SkyFrame.time` doc goes stale in P11, and P8's docs name P11's satellites and `CLEAR_SKY_KEEPS`. Three doc lines and one 7.0 rule fix them.
  - CONV6-2: round 5 moved the scroll-quiet key into seconds while its one reader stays in milliseconds, and no check would catch a mechanical port. Spell out the conversion and add one H13 case.
  - CONV6-3: `FrameState.transients` and `TransientSpec.narrow` are two more collisions of the kind CONV5-3 removed.
  - CONV6-4: `LAYER_NEARNESS` shadows `catalog.ts`'s `brightest` and `faintest`, and `skyWindow` lacks a doc comment.
