# Audit: codebase conventions (gate round 5)

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` after round 4's revisions (3,935 lines).

## Scope

- **Role.** One of the four auditors, gate round 5. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code actually uses. It also confirms that round 4's conventions fixes (CONV-1 to CONV-9) landed, and looks for regressions from round 4's other fixes.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)") and `research/01-planning-brief.md`.
  - All of `PLAN.md`, the round-4 report `audit/conventions.md` and the round-4 dispositions.
  - The worktree at 246c0aa:
    - `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx` and `MotionProvider.tsx`;
    - the icons and their barrel, the `src/lib` barrel and `utils.ts`, and `src/hooks`;
    - `globals.css`, `eslint.config.mjs`, `tsconfig.json`, `package.json` and `.claude/launch.json`;
    - `README.md`, `AGENTS.md` and `git log`.
  - The main checkout's uncommitted veil edits, read only, where names meet: `AGENTS.md`, `scene.ts`, `config.ts` and `sky.worker.ts`.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only. Nothing in `PLAN.md`, `src/` or configuration was edited in either checkout. Throwaway scripts and file copies live in the session scratchpad (`conventions-gate-r5/`).
  - Physics, coordination, DRY, separation of concerns and the Next.js docs belong to other scopes, and appear here only where they touch a convention.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end.
2. Re-ran round 4's block scanner over all 41 TypeScript, TSX and JavaScript blocks. It checks:
   - tabs, line-end semicolons, quote style, em dashes and namespace imports;
   - import paths;
   - plan IDs and `file:line` inside comments.
3. Checked every round-4 conventions disposition at the lines it names, and searched for leftovers of every identifier round 4 renamed.
4. Checked the sketches' names against the worktree:
   - the exports the sketches import: `smoothstep`, `quietAt` and `easedQuietFactor` (scene.ts), `meteorLifetime`, `meteorMoving`, `nextMeteorGap` and `pickRadiant` (meteors.ts), `between` (random.ts), `Sprite` (skyAssets.ts);
   - in `Navbar.tsx`: `navItemVariants`, `NAV_STAGGER`, `NAV_SECTIONS`, `cn` from `@/lib`, and icons from the barrel;
   - the `--color-green-tint` token, the `[&_svg]:` sizing pattern, relative sibling imports, and the type-import styles in `src`.
5. Ran scratch tests on the local Node v24.14.0:
   - The 7.1 resolve hook, copied verbatim from `PLAN.md`, loading `@/lib/sky/*` from the worktree.
   - Node's type stripping on an import whose specifiers are all inline `type` (5.2's claim), against `import type`.
   - ESLint 10 with the repository's own rule set (`eslint-config-next` core-web-vitals and typescript, plus the repository's overrides) over the plan's Navbar edit, `SkyPauseButton.tsx` and `skyPause.ts`. A probe file proved the React Compiler rules (`react-hooks/refs`) were active.
6. Checked every new config key against `config.ts`'s unit rule (`config.ts:2-3`), and every new name for the collisions CONV-5 removed.

## Round 4's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV-1 | landed (see CONV5-1 for a gap) | The 7.0 rule (2834) and section 6's intro (429). Invariant families are renamed PR1, RD1 to RD3 and DR1 to DR3, and no stale `(R1)`, `(D2, D3)` or presence `(P1)` remains. |
| CONV-2 | landed | `stepDevicePx`, `unalignedIntervalMs` and `unalignedToleranceMs` (966, 973-974), in the `PACING` doc (953, 959), `motionFps` (1035-1039), the refresh estimate (1174) and F3 (294). No `stepPx` is left. |
| CONV-3 | landed | One synchronous `registerHooks` hook (2865-2881). The verbatim copy loads `scene`, `config`, `catalog` and `meteors` through `@/` on Node 24.14. The type-only import rules are in 5.2 (382) and 7.1 (2893), and the Git Bash and PowerShell forms in 2883. |
| CONV-4 | landed | `aria-label` (1891), section 11's 2.5.3 row (3661), and `SkyPauseButton` in 4.1, 5.1, 6.8, P5 and the AGENTS.md line. No `sr-only` or `SkyPauseToggle` is left. |
| CONV-5 | landed | `Course`, `Steer`, `steer`, `visitSteer`, `createTransientSchedule`, `stepSpring`, `SkyFrame.offset`, `isIdle`, `cancelLevel` and `unhandled`. Old names survive only in the historical logs. (CONV5-3 covers two new collisions of the same kind.) |
| CONV-6 | landed | 7.0 (2833, 2838) |
| CONV-7 | landed | `NAV_STAGGER` (3113), `SkyFrame.time` (3090), `sceneAt` (1717, 3150) and `mountSky`'s doc (3084, 3188) |
| CONV-8 | landed | D1 (a) (168) |
| CONV-9 | landed | Per-field docs on `Epicycle` and `GapLaw` (535-543, 2281-2289), and `DRIFT` checked against `DriftConfig` (545-552, 578) |

## Findings

### CONV5-1 (minor): the no-plan-references rule misses session wording in binding doc comments

- **Section.** 7.0 (the rule at 2834); section 6's intro (429); sketches in 6.9 and 6.10.
- **Problem.** Round 4 fixed CONV-1 with a rule that lists what committed comments drop: "phase, invariant, decision, request or research IDs, or `file:line`". Binding doc comments also refer to this planning process without any ID, and a literal reading of the rule keeps those references. On master they point at nothing, just as the IDs would:
  - 2102-2103 (`planMeteorTransient`): "The veil commit's planLaunch, ported in its order ... observed in their working tree, rechecked against the landed planLaunch";
  - 2236 (`TRANSIENTS`, a committed config doc): "copy crossings stay as rare as the veil commit's";
  - 2439 (`METEOR_BRIGHTNESS`, a committed config doc): "a veiled peak above 1 needs the veil commit; today's flat veil takes at most 1";
  - 2578 (`PlanOptions`): "the veil commit's options, then ours";
  - 2582 and 2584: "(theirs)".

  Lines 1432, 2093, 2580 and 2586 put the same wording next to IDs, so the rule already removes them.
- **Evidence.**
  - The `PLAN.md` lines above.
  - The scratch scan `conventions-gate-r5/session-refs.mjs` finds 12 such comment lines in code blocks, one of them a placement note.
  - No comment in `src` mentions a commit, a session or a working tree (grep).
  - The codebase does use change-relative wording now and then ("as before", `Navbar.tsx:69`, `fonts.ts:3`), so "today's" alone is not the problem.
- **Fix.**
  1. Extend the 7.0 rule and section 6's intro with "or wording about the two sessions' process (the veil commit, the confirmed interface, theirs or ours, observed in their working tree)".
  2. Give the two committed config docs their reason in words:
     - `TRANSIENTS`: "so copy crossings stay rare" (the measured bar belongs in the PR description, per 7.0's evidence rule);
     - `METEOR_BRIGHTNESS`: after V, "the veil fits any peak to each copy's INK_BUDGET"; under PF, "veiled flights peak at most 1 (METEOR_VEIL)".

### CONV5-2 (minor): two new config blocks hold units their key names don't state

- **Section.** 6.10 (`SKY_WINDOW`); 6.11 (`SATELLITE`, `SatellitePass`).
- **Problem.** `config.ts:2-3` sets the file's unit rule: "Lengths are CSS px unless a name says device px, times are seconds unless a name ends in Ms or _MS". CONV-2 enforced it in round 4. Two new blocks break it:
  - **`SKY_WINDOW.meteorHeight: 100` and `earthRadius: 6371`** are kilometres, which the rule reads as CSS px. They are the file's first lengths in km.
  - **`SATELLITE.speed: [1.2, 2.5]`** is degrees a second of the sky window. The rule reads a speed as CSS px/s, which is exactly what the plan's other `speed` names hold:
    - `DRIFT.speed` (568);
    - `Course.speed` (2559-2560);
    - `SatellitePass.speed` (2697-2698: "CSS px/s: SATELLITE.speed °/s at the window's scale").

    The plan's own `SpeedClass` already calls a degrees-a-second speed `angular` (2399-2400). A tuner who wants faster satellites and reads `speed` as px/s would set it about 22 times too high: at a 1440 px laptop's centre a degree is 21.8 px (6.11).

  The docs state the units, so nothing is wrong today. But the names are binding (429), and the renames touch about six lines.

  Two kinds of key are not raised, because existing practice already accepts them:
  - angles in degrees (`fov`, `elevation`, `RADIANTS`' scatters, `minTilt`), like `METEOR.angle` and `radiantJitter` (`config.ts:256-261`);
  - viewport multiples such as `CAMERA.maxLag`, like `SCENE.heroFadeFrom` (`config.ts:149-156`).
- **Evidence.** `config.ts:2-3`; PLAN.md 2365-2369, 2647, 2662, 2697-2698, 2737, 2399-2400, 568 and 2559-2560.
- **Fix.**
  1. Rename `SKY_WINDOW.meteorHeightKm` and `earthRadiusKm`.
  2. Rename `SATELLITE.angular`, matching `SPEED_CLASSES`. Update `SATELLITE`'s doc, `SatellitePass.speed`'s doc and 6.11's speed bullet to match.

### CONV5-3 (minor): round 4's fixes reintroduced CONV-5's collisions, and P8's renames miss one gate key

- **Section.** 6.1 (the worker sketch); 6.2 (`FrameState`, `demandNow`); 6.6; 6.9 (`LaunchGate`); P8 and P11's file lists.
- **Problem.**
  1. **Two new collisions.** CONV-5 removed `cancelFade` (both a 0 to 1 function and a key in seconds) and `SkyFrame.camera` (a `Vec` beside the worker's `Camera`). Round 4's fixes (DRY-6's `Ease`, SOC-1's `FrameState`) brought back the same two patterns:
     - **`motionEase`.** The worker's `motionEase: Ease` (866-867) and `FRAME.motionEase: 0.3`, in seconds (1690), share a name, and single calls hold both:
       - `easeAt(motionEase, FRAME.motionEase, t)` (879, 902);
       - `easing(motionEase.since, FRAME.motionEase, t)` (1225);
       - `easeEnded(motionEase.since, FRAME.motionEase, ...)` (1696).
     - **`FrameState.camera`.** `FrameState.camera: boolean` (1052-1053) sits beside the worker's `camera: Camera` (859): `frameState.camera = cameraMoving || wanted || leaning` is followed by `cameraSpeed(camera, ...)` (1221-1222). `FrameState`'s other flags are adjectives (`live`, `scrolling`, `full`, `fading`).
  2. **A gate key P8 doesn't rename.** P8 renames `SCENE.heroMeteorMaxScroll` to `heroLaunchMaxScroll` "because it then gates every kind" (1720). The sibling gate, `FRAME.meteorScrollQuietMs`, keeps its name and its doc, "Shooting stars wait this long after scrolling stops" (`config.ts:215-216`). Yet `LaunchGate.settled` (2137) applies it to every kind, satellites included from P11. Neither P8's nor P11's config list touches it (3214, 3307), so its doc goes stale in P11.

     Its only reader is inside `updateMeteor` (worktree `sky.worker.ts:202`; veil tree `:217`), which P8 step 3 replaces in the same commit. So renaming it there touches no veil code that survives.
- **Evidence.** The lines above; round 4's CONV-5 verification; a grep of both trees for `meteorScrollQuietMs`.
- **Fix.**
  1. Name the worker's ease `motionLevel`, after the MotionLevel entity it holds (4.2 at 240). Also update 287, 866-867, 879, 900, 902, 1225, 1695-1696 and 3118. Calls then read `easeAt(motionLevel, FRAME.motionEase, t)`.
  2. Rename `FrameState.camera` to `cameraActive` (1052-1053, 1070, 1209, 1221).
  3. In P8 step 3, with the other renames, rename `FRAME.meteorScrollQuietMs` to `launchScrollQuietMs`, documented "Transients wait this long after scrolling stops", and update `LaunchGate.settled`'s doc to match.

## What passes

- **Code style in all 41 sketches.**
  - Tabs, except one markdown-nested block.
  - No line-end semicolons, and single quotes (double quotes only on JSX attributes, as in `Navbar.tsx`).
  - No namespace imports and no em dashes. `PLAN.md` has no em or en dash anywhere.
- **The repository's lint.** The plan's Navbar edit, `SkyPauseButton.tsx` and `skyPause.ts` lint clean under the repository's own rule set, including the React Compiler rules of `eslint-plugin-react-hooks` 7.1.1: reading `headerRef.current` inside the `useMotionValueEvent` callback is not a render-time ref read.
- **Type-only imports.**
  - 5.2's claim holds on Node 24.14: `import { type B } from './b.ts'` still loads `b.ts`, while `import type` is erased.
  - `src` already follows the rule: 35 statement-level `import type` statements, 13 mixed imports with inline `type`, and none whose specifiers are all inline `type`.
- **Import boundaries (AGENTS.md).**
  - New model files import only their `src/lib/sky` siblings, by relative path.
  - Worker files import only `@/lib/sky/*` by file and each other.
  - `skyPause.ts` takes `REDUCED_MOTION_QUERY` from `@/lib/utils`, as `mountSky.ts` does today.
  - Main-thread sky code imports only types (and `@/lib/sky/color`) from `src/lib/sky`.
- **Components and the client boundary.**
  - The control is a default export with a props interface, rendered by the client `Navbar.tsx`, so it needs no `'use client'`.
  - Its `cn` and icon-barrel imports match `Navbar.tsx`. Navbar renders only on `/` (`src/app/page.tsx`), so the `/links` by-file rule doesn't apply.
  - `[&_svg]:w-[20px]`-style sizing matches `FeaturedProject.tsx:77`, `LinksList.tsx:31` and `OtherProjects.tsx:80`.
  - `text-green` and `hover:bg-green-tint` are theme tokens (`globals.css:16-17`).
  - Motion runs under `MotionConfig` without `LazyMotion` strict, so `motion.div` is valid.
- **Names that existing code already uses.** `smoothstep`, `quietAt`, `easedQuietFactor`, `meteorLifetime`, `meteorMoving`, `nextMeteorGap`, `pickRadiant`, `between`, `Sprite`, `navItemVariants`, `NAV_STAGGER` and `NAV_SECTIONS` all exist at 246c0aa.
- **Naming and docs.**
  - New factories, steps and queries follow the existing patterns (`create*`, `step*`, `*At`, `note*`).
  - Every new config constant and main-thread constant has a doc comment.
  - Interfaces follow `LayerConfig`'s pattern with `satisfies` (`DriftConfig`, `SpeedClass`, `GapLaw`).
- **Process.**
  - Lint and type-check on every step, and `/_next/mcp` while `next dev` runs.
  - A production smoke build with our own dev server stopped.
  - `.claude/launch.json` has `autoPort: true` and is tracked on master, as are `.mcp.json` and `.claude/settings.json`.
  - Conventional commit forms that match the recent history.
  - The `motion` docs step before P5.
  - No `.env` file, no Cache Components API, `data-sky-quiet` kept, and no POST to `/api/schedule/book`.
- **User-facing copy.** "Pause sky animation" and "Play sky animation" are plain, in sentence case, with no em dash. The AGENTS.md line reads plainly too.

## Summary

- **Verdict: pass.** No blocking or major findings. Round 4's nine conventions fixes landed where their dispositions say.
- **Three minor findings,** each cheap and clearly right:
  - CONV5-1: extend 7.0's no-plan-references rule to the session wording ("the veil commit", "theirs", "observed") that survives in seven doc-comment lines, two of them committed config docs.
  - CONV5-2: name the units of `SKY_WINDOW`'s km lengths and `SATELLITE`'s degrees-a-second speed, which `config.ts:2-3` would otherwise read as CSS px and px/s.
  - CONV5-3: rename two collisions that round 4's own fixes brought back (`motionEase`, `FrameState.camera`), and add `FRAME.meteorScrollQuietMs` to P8's gate renames.
