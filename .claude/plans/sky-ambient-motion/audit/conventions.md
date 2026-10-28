# Audit: codebase conventions

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` as it stands after the veil reconciliation (3,646 lines).

## Scope

- **Role.** One of the four auditors. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code actually uses.
- **Checked:** tabs, single quotes, no semicolons, `@/` imports, default-exported components, named re-exports in barrels, no namespace imports, `'use client'` only at island entries, `motion/react-client` in Server Components, `/links` importing by file, the sky-worker import rules, `data-sky-quiet`, no Cache Components, Node 24 API limits, TypeScript `~6.0`, `config.ts`'s doc-comment and unit-naming style, the names of existing sky functions and constants, verification (`npm run lint`, `npm run type-check`, `/_next/mcp`), commit messages, `.env` files, and the user-facing copy of the pause control.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (including "Confirmed veil interface (2026-10-27)") and `research/01-planning-brief.md`.
  - All of `PLAN.md`.
  - The worktree at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `IntroGate.tsx`, `Introduction.tsx`, `MotionProvider.tsx`, the icons and their barrel, `src/hooks/*`, the `src/lib` barrel and `utils.ts`, `globals.css`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `.gitignore`, `.claude/*`, `.mcp.json` and `git log`.
  - The main checkout's uncommitted veil edits, read only and only where names meet.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only. Nothing in `PLAN.md`, `src/` or configuration was edited in either checkout. Throwaway scripts live in the session scratchpad.
  - Physics, coordination, DRY and separation of concerns belong to other scopes, and appear here only where they touch a convention.

## Method

1. Read the four scope documents, then `PLAN.md` end to end.
2. Read every source file the plan names, and recorded the codebase's actual patterns:
   - doc comments (self-contained prose; sources named in words, `config.ts:89-93`, `:104`);
   - unit naming (`config.ts:2-3`);
   - config typing (`LayerConfig`, `HazePool` and `satisfies`, `config.ts:55-81`, `:166-186`);
   - icon-button naming (`aria-label` throughout);
   - barrels, the import order, and the `'use client'` and `motion/react-client` placement.
3. Extracted all 41 TypeScript and JavaScript code blocks from `PLAN.md` with a scratch Node script. It checked:
   - indentation;
   - semicolons at line ends;
   - quote style;
   - em dashes;
   - namespace imports;
   - import paths;
   - plan IDs and `file:line` references inside comments.
4. Verified external claims against primary sources:
   - the Next.js 16.4.2 docs (`01-app/01-getting-started/05-server-and-client-components.md:178-180`);
   - the Node 24 docs (`module.md`, `typescript.md`, `deprecations.md` DEP0205);
   - the W3C APG carousel example (its rotation control's name);
   - `node_modules/eslint-config-next/dist/typescript.js`.
5. Tested on the local Node v24.14.0, in scratch:
   - a type import without the `type` keyword;
   - `module.registerHooks()` resolving extensionless imports;
   - the warning a package.json without `"type"` produces.

## Findings

Severity follows the brief: blocking (wrong behavior, a broken COORDINATION.md constraint or codebase rule, or not implementable as written), major (a real gap or error an implementer would trip on), minor (clarity or polish).

### CONV-1 (major): plan-only cross-references inside doc comments the implementer will paste

- **Section.**
  - 6 (sketches in 6.1, 6.2, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.13).
  - 7.0.
- **Problem.** The doc comments on the plan's binding declarations carry plan-only annotations:
  - phase tags: `(P4)`, `(P6)`, `(P7)`, `(P10)`, and "P8: ... P9: ... P10: ..." in `VisitMemory`;
  - invariant IDs: `(C5)`, `(C8)`, `(F6)`, `(F7)`, `(M1)`, `(Q1)`, `(SF1)`, `(SF2)`, `(PB1)`, `(PB2)`, `(PB4)`, `(T1)` to `(T6)`, `(R1)`, `(D2, D3)`;
  - request tags: `(I1, theirs)`, `(I2, ours: P9)`;
  - research pointers: `(R2 §4.2)`;
  - source line numbers: `(scene.ts:76)`, `(scene.ts:89)`, `(renderSky.ts:107)`, `(sky.worker.ts:124)`.

  A scratch scan finds about 60 such comment lines in the sketches for camera.ts, the worker, pacing.ts, quietIndex.ts, renderSky.ts, presence.ts, skyPause.ts, transients.ts, config.ts (`TRANSIENTS`), radiants.ts, meteors.ts and protocol.ts. Section 6's intro says "names and contracts are binding", so they will be copied. Why that is wrong:
  - **The codebase doesn't do this.** Its doc comments are self-contained prose that name sources in words ("Mitchell Charity's blackbody table", "WCAG 2.2.2"). No comment in `src/` cites a `file:line`: a grep for `\.tsx?:\d` finds none.
  - **The references would dangle.** 7.0 keeps `PLAN.md` on the planning branch, and the integration branch "carries code only", so on master every ID points nowhere.
  - **Several IDs are ambiguous even with the plan open.**
    - "P1" is both the render-core phase and the presence invariant.
    - "R1" is both the depth research report and the radiant invariant.
    - "D1" to "D3" are both decisions and drift invariants.

    So `forgetVisitSky`'s "A layout never calls it (R1)" sends the reader to the physics report. `driftRate`'s "(D2, D3)" reads as the decisions on reading drift and pointer lean.
  - **The line numbers are stale on arrival.**
    - `sky.worker.ts:124` sits in `frameMode`, which P3, the phase that writes `twinkleDemand`, deletes.
    - `renderSky.ts:107` is the `quiet` flag that P1 replaces.
    - The veil's working tree already moved the cut-offs that `ZONE_REACH`'s doc cites (now `scene.ts:75` and `:83`).
- **Evidence.**
  - PLAN.md 612, 616, 619, 621, 633, 635, 637, 647, 682, 729, 737, 803, 805, 811, 819, 825, 830, 837, 988, 1106, 1131, 1305, 1316, 1319, 1403, 1407, 1515, 1634, 1638, 1649, 1665, 1670, 1881, 1897, 1899, 1901, 1914-1917, 1936, 1970-1972, 1995, 2018, 2020, 2041, 2053, 2060, 2098, 2346, 2360, 2429-2437, 2614, 2616.
  - PLAN.md 418 (binding), 2654 (code only).
  - `config.ts:89-93`, `:104`.
  - Main checkout `src/lib/sky/scene.ts:75`, `:83`.
- **Fix.**
  1. Add a rule to 7.0: committed comments and doc comments carry no plan cross-references (no phase, invariant, decision, request or research IDs, and no `file:line`), and give the reason in words instead. For example, "(C8)" becomes "so the sky resumes where it stopped".
  2. Either strip the tags from the sketches, or state once in section 6's intro that parenthesized IDs in sketch comments are plan annotations to drop.
  3. Give the invariant families IDs that can't be confused with phases, reports or decisions: for example `PR1` (presence), `RD1` to `RD3` (radiants) and `DR1` to `DR3` (drift clock).

### CONV-2 (major): three `PACING` keys break `config.ts`'s unit-naming rule

- **Section.** 6.2, Config (`PACING`).
- **Problem.** `config.ts` defines units by the key's name: "Lengths are CSS px unless a name says device px, times are seconds unless a name ends in Ms or _MS" (`config.ts:2-3`). Every existing key follows it, for example `MIN_CORE_SIGMA_DEVICE_PX`, `FRAME.scrollSettleMs`, `ADAPT.slowFrameMs` and `HAZE_REBUILD_MS`. Three new keys break it, though names are binding:

  | Key | Real unit | What the rule reads | Error |
  |---|---|---|---|
  | `stepPx` | device px | CSS px | a DPR factor |
  | `unalignedInterval: 15` | ms | 15 s | 1000× |
  | `unalignedTolerance: 0.4` | ms | 0.4 s | 1000× |

  The same block follows the rule for `watchdogMs` and `reprobeMs`, so these three are slips.
- **Evidence.**
  - PLAN.md 905-906: "at most `stepPx` device px per drawn frame".
  - PLAN.md 912: "within `unalignedTolerance` ms of `unalignedInterval` is WebKit's fixed 15 ms worker clock".
  - PLAN.md 919, 926-927 (the keys).
  - PLAN.md 991: `devicePxPerSecond / PACING.stepPx`.
  - PLAN.md 1065: `Math.abs(interval - PACING.unalignedInterval) <= PACING.unalignedTolerance`, with `interval` in ms.
  - `config.ts:2-3`, `:131`, `:214`, `:229`.
- **Fix.** Rename them `stepDevicePx`, `unalignedIntervalMs` and `unalignedToleranceMs`. Carry the new names through the `PACING` doc, `motionFps`, `createRefreshEstimate`, H4, AC-10 and 6.2's table.

### CONV-3 (minor): the Node 24 harness kit uses a deprecated API and omits the rule it depends on

- **Section.** 7.1, Verification kit; 5.2, No runtime import cycles; D5.
- **Problems.**
  1. **A deprecated API.** The kit registers its resolve hook with `module.register()`, which Node 24 deprecates:
     - DEP0205 is a documentation-only deprecation from v24.15.0: "Please migrate to `module.registerHooks()` as soon as possible as `module.register()` will be removed in a future version of Node.js".
     - AGENTS.md pins Node 24 and points at the latest-v24 docs, and D5's `node --test` option would commit this hook.
     - `module.registerHooks()` (added v23.5.0 and v22.15.0, release candidate since v24.13.1) does the same job synchronously in one file. It resolved extensionless imports on the local v24.14.0.
  2. **A missing rule.** Node's type stripping erases a type-only import only when it carries `type`:
     - The Node docs say "Without the `type` keyword, Node.js will treat the import as a value import, which will result in a runtime error".
     - Nothing in this repository enforces `type`: `tsconfig.json` has no `verbatimModuleSyntax`, and `eslint-config-next/typescript` uses typescript-eslint's `recommended` set, which has no `consistent-type-imports`.
     - 5.2 says `satellites.ts` "may import only types back (`PlanContext`, `Planned`), which TypeScript erases". That holds for the Next.js build, but not for H7, which loads that graph in Node.
     - Tested: a bare `import { value, Ctx } from './types.ts'` fails with "SyntaxError: The requested module './types.ts' does not provide an export named 'Ctx'".
  3. **Warnings, and D5's claim.** The repository's `package.json` has no `"type"` field, so Node prints `MODULE_TYPELESS_PACKAGE_JSON` for every module the harness loads (tested). That is harmless in scratch, but it qualifies D5's "no dependency and no source change": a committed `node --test` setup either prints that noise on every run or adds `"type": "module"` to `package.json`.
  4. **The shell.** `SKY_SRC=<checkout>/src node ...` is POSIX syntax. This repository is worked on Windows with PowerShell as the primary shell (`.claude/settings.json` pre-approves both forms).
- **Evidence.**
  - PLAN.md 2686-2704, 2709, 372, 172.
  - Node 24 `module.md` (`module.register`: "Stability: 0 - Deprecated", "deprecated: v24.15.0"), `deprecations.md` DEP0205 and `typescript.md`.
  - `tsconfig.json`; `node_modules/eslint-config-next/dist/typescript.js`.
  - The scratch tests.
- **Fix.**
  1. Replace `ts-resolve.mjs` and `register.mjs` with one `register-hooks.mjs`, run as `node --import ./register-hooks.mjs h-<name>.ts`. It calls `registerHooks({ resolve(specifier, context, nextResolve) { ... } })` with the same mapping, made synchronous (no `async` or `await`; `nextResolve` throws `ERR_MODULE_NOT_FOUND` synchronously).
  2. Add to 7.1's erasable-syntax rule: "and every type-only import uses `import type` or an inline `type`, as `src` already does".
  3. Reword 5.2 to say the same.
  4. Note the typeless-package warning in D5.
  5. Give the PowerShell form, or say "run harnesses from Git Bash".

### CONV-4 (minor): the control is named with `sr-only` text and called a "Toggle", unlike the codebase and the pattern it follows

- **Section.** 6.8, The control; 11 (the 2.5.3 row); 4.1, 5.1, P5 and 6.8's AGENTS.md line (the component name).
- **Problem.**
  - **The name technique.** `SkyPauseToggle` names itself with `<span className="sr-only">`, a utility used nowhere in `src`.
    - Every icon-only control in the codebase uses `aria-label`: the burger (`"Menu"`), the logo link (`"Home"`), the calendar's month buttons and the project links.
    - So does the W3C APG carousel example whose rotation control deviation 6 adopts. Its attribute table reads: "`aria-label` ... Defines the accessible name for the pause auto-rotation button".
  - **The component's name.** Deviation 6 rejects the APG toggle-button pattern (`aria-pressed`) in favor of the rotation control. A component named "Toggle" invites a later maintainer to add `aria-pressed`.

  The visible copy itself passes: "Pause sky animation" and "Play sky animation" are plain, in sentence case like "Menu" and "Previous month", with no em dash.
- **Evidence.**
  - PLAN.md 1784, 3460, 58, 1767.
  - `Navbar.tsx:97`, `:114`; `CalendarGrid.tsx:66`, `:77`; `FeaturedProject.tsx:77`, `:81`.
  - A grep finds no `sr-only` in `src`.
  - The APG carousel example (fetched 2026-10-27).
- **Fix.**
  1. Put `aria-label={paused ? 'Play sky animation' : 'Pause sky animation'}` on the `<button>` and drop the span.
  2. Make the 2.5.3 row say the name is the `aria-label`.
  3. Rename the component `SkyPauseButton` (or `SkyPlaybackButton`) in 4.1, 5.1, 6.8, P5 and the AGENTS.md line.

### CONV-5 (minor): new names collide with the veil's vocabulary or break the plan's own patterns

- **Section.** 6.1, 6.2, 6.5, 6.6, 6.9, 6.10.
- **Problem.**
  - **"Aim" means two things.** `Aim`, `PlanOptions.aim` and `visitAim` mean a direction source. In the veil's `planFlight`, which I2 edits, "aim" already means trading a launch for a pass behind copy:
    - `const aims = plain && ... random() < METEOR_PASS.share` (main checkout `meteors.ts:258`);
    - "nothing to aim at" (`:256`);
    - "so no flight is aimed at copy" (`:55`);
    - `METEOR_PASS`'s doc (`config.ts:354`, `:357`).

    After P9, one function holds `options.aim(...)` and `aims` with unrelated meanings. The plan notes the clash (PLAN.md 2449) but keeps it. `Flight` adds a third meaning of "flight", beside `planFlight` and `PlanOptions.flights: 'long' | 'short' | 'both'`.
  - **`createSchedule()`.** It returns `TransientSchedule`. Every other factory is `create` plus its type: `createCamera`, `createQuietIndex`, `createPresence`, `createRefreshEstimate` and the existing `createStarField`. The worker also already has `schedule()`, the frame scheduler; the plan itself warns about that clash (PLAN.md 2185).
  - **`springStep`.** It reads noun then verb, beside `stepCamera` and `stepDivisor`.
  - **`SkyFrame.camera`.** It is an offset `Vec`, while the worker's `camera` is a `Camera`: `camera: cameraOffset(camera, offset)`.
  - **`isAway`.** The config keys stay `FRAME.idleSleepMs` and `idleFadeMs`, and the docs say "idle".
  - **`cancelFade`.** It is both a function returning a 0 to 1 level and `TRANSIENTS.cancelFade`, in seconds.
  - **`const unknown: never = transient`.** It names a variable after a TypeScript keyword.
- **Evidence.**
  - PLAN.md 2404, 2425, 2436, 2449, 2359 (`Aim`, `Flight`).
  - PLAN.md 2025, 2185, 648, 1339, 1494, 1051; `renderSky.ts:34`; `sky.worker.ts:152` (factories and `schedule`).
  - PLAN.md 665, 684, 1006 (`springStep`); 1476, 800, 860 (`SkyFrame.camera`); 1499 (`isAway`); 2048, 2109 (`cancelFade`); 2174 (`unknown`).
  - Main checkout `meteors.ts:55`, `:256-259`; `config.ts:265`, `:354`, `:357`.
- **Fix.** Rename ours:
  - `Course` for `Flight`;
  - `steer`/`Steer`/`visitSteer` (or `direction`/`DirectionSource`) for `aim`/`Aim`/`visitAim`;
  - `createTransientSchedule`;
  - `stepSpring`;
  - `SkyFrame.offset` (or `cameraOffset`);
  - either keep `isIdle`, or reword the `FRAME` docs to "away";
  - `cancelLevel` for the function;
  - `const unhandled: never`.

### CONV-6 (minor): 7.0's process omits the repository's commit style and CLAUDE.md's Motion docs step

- **Section.** 7.0, Rules for every phase.
- **Problem.**
  1. **Commit messages.** The plan asks for one commit per numbered step (about 40) and one PR per phase, but never gives a message format. The history uses conventional commits: `feat:`, `chore:`, `docs:`, and `docs(plans):` on this branch.
  2. **Motion docs.** CLAUDE.md says "Query `motion` before writing animation code", but 7.0's commands list only lint, type-check, `/_next/mcp` and a build. P5 writes Motion code: the navbar's staggered `motion.div` with `inert`.
- **Evidence.**
  - `git log`: d116918 "feat: upgrade to Next.js 16.4 ...", 0d2dc2a "feat: add meeting scheduler ...", 506d21d "chore: remove Vite build artifacts ...", and 2e622a5 "docs(plans): ..." on this branch.
  - PLAN.md 2658-2664.
  - CLAUDE.md, "Claude Code" section.
- **Fix.** Add two lines to 7.0:
  - Commit subjects and PR titles in conventional form: `feat(sky): ...` for visible changes, `refactor(sky): ...` for no-visible-change steps (P1, P3) and `docs: ...` for commits that touch only AGENTS.md or README.md.
  - Query the `motion` docs server (`.mcp.json`) before writing the navbar entrance in P5.

### CONV-7 (minor): phases change behavior whose doc comments then go stale

- **Section.** P4, P5 and P6 file lists (7.3).
- **Problem.** The plan lists many doc edits (FRAME, ADAPT, LAYERS, SCENE, SkyMotion, the worker header), but misses these. Each becomes wrong in its phase:

  | Doc | Today's wording | Changed by |
  |---|---|---|
  | `NAV_STAGGER` (`Navbar.tsx:14`) | "and then the Resume button" | P5: the control comes after Resume |
  | `SkyFrame.time` (`renderSky.ts:64`) | "(twinkle, shooting stars)" | P4: twinkle reads `twinkleTime` |
  | `twinkleLevel` (`sky.worker.ts:96`) | "scene, idle fade and motion preference" | P4 and P5: scene × presence × motion level |
  | `sceneAt` (`scene.ts:20-23`) | "a dimmer and still sky while reading" | P6: the reading sky drifts at 0.35. The plan rewrites the same sentence in SCENE's doc, not here |
  | `mountSky` (`mountSky.ts:125-129`) | "forwards size, scroll, visibility, preference and layout changes" | P4 and P7: activity and the pointer |
- **Evidence.**
  - The lines in the table.
  - PLAN.md 1532, 1568, 1595-1598, 2905, 2928, 2932.
- **Fix.** Add each doc edit to its phase's file list.

### CONV-8 (minor): D1 alternative (a) is ambiguous about which file gets `'use client'`

- **Section.** 3, D1 alternative (a).
- **Problem.** "the file then needs `'use client'` because `Introduction.tsx` is a Server Component" can be read as adding the directive to `Introduction.tsx`. That would make the hero a Client Component, against AGENTS.md's "Server Components by default; add `'use client'` only at the entry of an interactive subtree". Section 5.2 means the control's own file. The alternative also doesn't say that a Motion wrapper there must use `motion/react-client` named imports.
- **Evidence.**
  - PLAN.md 168, 380-384.
  - AGENTS.md.
  - `Introduction.tsx` (no directive); `AboutMe.tsx:2`, `AppFooter.tsx:1` (`motion/react-client`).
- **Fix.** Reword to: "`SkyPauseToggle.tsx` then needs `'use client'`: it becomes an island entry inside `Introduction.tsx`, which stays a Server Component. Any Motion wrapper there uses `motion/react-client` named imports, as `AppFooter.tsx` does."

### CONV-9 (minor): config typing departs from `config.ts`'s pattern

- **Section.** 6.1 (`Epicycle`, `DRIFT`), 6.9 (`GapLaw`), 6.11 (`SATELLITE`).
- **Problem.** `config.ts` types its structured blocks through a named interface with a doc comment per field, checked with `satisfies`: `LayerConfig` with `satisfies Record<SkyLayer, LayerConfig>`, and `HazePool` with `satisfies readonly HazePool[]`. The plan departs from that in three ways:
  - `DRIFT` repeats its whole shape inline: `satisfies { speed: number; period: number; epicycles: readonly Epicycle[]; ... }`.
  - `Epicycle` and `GapLaw` document the interface but not their fields or units.
  - `SATELLITE.first` and `SATELLITE.gap` are gap laws that nothing checks where they are declared.
- **Evidence.**
  - `config.ts:55-81`, `:166-186`.
  - PLAN.md 525-529, 555, 2144-2148, 2506-2520.
- **Fix.**
  1. Give `Epicycle` and `GapLaw` a doc comment per field, with units.
  2. Type `DRIFT` with a named `DriftConfig` interface (not exported, like `LayerConfig`).
  3. Check `SATELLITE` against a `SatelliteConfig` whose `first` and `gap` are `GapLaw`.

## What passes

- **Code style in all 41 sketches.**
  - Tabs throughout; the only space indentation is the markdown nesting of one fenced block.
  - No semicolons at line ends.
  - Single quotes; double quotes only on JSX attributes, as in `Navbar.tsx`.
  - No namespace imports and no lint suppressions.
  - Type-only imports carry `type` wherever an import is shown.
- **The worker import rules.**
  - New model files import only their `src/lib/sky` siblings, by relative path.
  - Worker files import only `@/lib/sky/*` and each other.
  - A split `renderTransients.ts` is added to AGENTS.md's list.
  - `mountSky.ts` keeps to types and `@/lib/sky/color`, and `skyPause.ts` reads `@/lib/utils` as `mountSky.ts` does today.
  - None of these use React, `window`/`document`, the `@/lib` barrel or `@/lib/utils` in the worker graph.
- **Components and the client boundary.**
  - The control and the icons are default exports, and the icons barrel gets named re-exports.
  - `'use client'` stays on `Navbar.tsx`, the island entry. The Next.js passage cited for this is verbatim.
  - Motion stays in client code, `/links` is untouched, and `hover:bg-green-tint` matches `.btn:hover`.
- **Project rules.**
  - `data-sky-quiet` is kept.
  - No Cache Components APIs.
  - TypeScript `~6.0` and Next.js 16.4.2 are left alone.
  - No `.env` file is touched.
  - Never POST to `/api/schedule/book`.
  - The main checkout is read only.
  - The AGENTS.md line follows the file's style and lands after the veil's rewritten `data-sky-quiet` line.
- **Verification.**
  - Lint and type-check on every step, and `/_next/mcp` (`get_errors`, `get_compilation_issues`, `compile_route`).
  - A production smoke build with our own dev server stopped. This agrees with AGENTS.md's "instead of `next build`" while `next dev` runs.
  - A separate worktree with `npm ci`, and a port of its own.
- **Config docs.** Every new config block and constant has a doc comment with its units and reasons.
- **Document style.** `PLAN.md` has no em dashes.

## Summary

- **Findings.** No blocking findings, two major and seven minor.
- **Verdict.** Revise. The two majors are cheap to fix:
  - CONV-1: add one 7.0 rule, strip the plan IDs and `file:line` references from the sketches' doc comments, and disambiguate the invariant IDs.
  - CONV-2: rename three `PACING` keys so their names carry their units.
- **The minors.**
  - Modernize the Node 24 harness hook, and state its `import type` rule.
  - Name the control with `aria-label`, as the codebase and the APG do, and drop "Toggle".
  - Remove the "aim"/"flight" collisions with the veil's vocabulary, and align a few factory and step names.
  - Add the conventional-commit format and the Motion docs step to 7.0.
  - List five doc comments that would go stale.
  - Clarify D1 (a)'s client boundary.
  - Follow `config.ts`'s interface-plus-`satisfies` pattern.
- **The pause control's visible copy.** "Pause sky animation" and "Play sky animation" read plain and human, with no em dashes.

## Verification

Skeptic pass, 2026-10-27. Each finding was re-checked against `PLAN.md`, the worktree at 246c0aa, the main checkout's veil edits (read only), `COORDINATION.md` and the cited sources (Node's latest-v24 docs, the W3C APG carousel example and Button pattern). Scratch tests: `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/conv-skeptic`.

- **CONV-1: confirmed.** 56 doc-comment lines in the sketches carry plan IDs, research pointers or `file:line` (18 more in plain `//` notes), and no comment in `src` does; master 246c0aa has no `.claude/plans`, so they would dangle on the integration branch; P1, R1 and D1 to D3 each name an invariant (4.3) as well as a phase, a report or a decision; and the cited lines go stale as stated (`sky.worker.ts:124` is in `frameMode`, which P3 replaces; `renderSky.ts:107` is the `quiet` flag P1 replaces; the veil tree has the cut-offs at `scene.ts:75` and `:83`). Renaming the invariant families breaks nothing in `COORDINATION.md`, which uses D1 and P5 only as a decision and a phase.
- **CONV-2: confirmed.** `config.ts:2-3` states the rule and every existing key follows it; `stepPx` is device px (PLAN.md 906), and `unalignedInterval` and `unalignedTolerance` are ms (912, compared with an ms `interval` at 1065). The doc does give the units, so the harm is a misread by the next tuner rather than a wrong value, but the names are binding and the rename is cheap. The fix's list is slightly off: F3 (292) and `cameraDemand`'s doc (1115) also name `stepPx`, while H4 and AC-10 name no key.
- **CONV-3: partly.** Parts 1, 2 and 4 hold. Node's latest-v24 `module.md` marks `module.register()` "Stability: 0 - Deprecated" (DEP0205: documentation-only from v24.15.0, "migrate ... as soon as possible"), and a synchronous `registerHooks` resolver loaded `src/lib/sky`, extensionless imports included, on local v24.14.0, also under `node --test`. A bare `import { value, Ctx }` fails ("does not provide an export named 'Ctx'") while `type Ctx` loads, and nothing enforces `type` (no `verbatimModuleSyntax`; `consistent-type-imports` is only in typescript-eslint's `all`), though `src` complies. `SKY_SRC=... node` is POSIX; it runs as written in the session's Git Bash tool, so one line covers it. Part 3 does not hold: `MODULE_TYPELESS_PACKAGE_JSON` printed once per run (for `config.ts`, the first of six `src` modules loaded), not per module, and `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` silences it under `node --test` without touching `package.json`, so D5's "no dependency and no source change" stands.
- **CONV-4: confirmed.** `src` has no `sr-only`, and every icon-only control is named by `aria-label` (`Navbar.tsx:97`, `:114`; `CalendarGrid.tsx:66`, `:77`; `FeaturedProject.tsx:77`, `:81`; `OtherProjects.tsx:80`, `:85`). The APG carousel example's attribute table names its rotation button with `aria-label`, and the APG Button pattern defines a toggle button as one with `aria-pressed` and a label that never changes, the pattern deviation 6 rejects. The rename touches 11 lines of `PLAN.md` and nothing in `COORDINATION.md`.
- **CONV-5: confirmed.** The veil tree uses "aim" for a launch traded for a pass behind copy (`meteors.ts:55`, `:256`, `:258`; `config.ts:265`, `:354`, `:357`), so after I2 `planFlight` would hold both `options.aim` and `aims`; `planFlight` returns a `Meteor`, not a `Flight`; every other factory is "create" plus its type (`createStarField`, `renderSky.ts:34`); `SkyFrame.camera` is a `Vec` beside the worker's `Camera`; and `cancelFade` is both a 0 to 1 function and the seconds key it reads. `springStep`, `isAway` and `unknown` are style only (`src` has no `never` check to copy). Every name is ours and the CP-0 message that says `aim` is unsent, so nothing coordinated breaks; prefer `steer` to `direction` and `DirectionSource`, which would sit beside `radiants.ts`'s `SkyDirection` and `Source`.
- **CONV-6: confirmed.** 7.0 gives no commit format and omits CLAUDE.md's "Query `motion` before writing animation code", while P5 writes a `motion.div` with `variants`, `custom` and `inert`. The history is mixed (246c0aa and most older commits are not conventional), but every recent `feat:`, `chore:`, `docs:` and `docs(plans):` commit is, so the format follows current practice.
- **CONV-7: partly.** Four hold, and no phase lists their edit: `NAV_STAGGER`'s "and then the Resume button" (P5), `SkyFrame.time`'s "(twinkle, shooting stars)" (P4's twinkle clock), `sceneAt`'s "a dimmer and still sky while reading" (P6 lists only the `SCENE` doc) and `mountSky`'s list of what it forwards (P4's activity, P7's pointer). `twinkleLevel`'s "scene, idle fade and motion preference together" still describes scene × `presenceLevel` (the idle fade) × `motionLevel` (the eased preference), so it needs no edit.
- **CONV-8: confirmed.** D1 (a) never names "the file", and the wrong reading puts `'use client'` on `Introduction.tsx`, a Server Component, against AGENTS.md; 5.2 (384) means the control's file. Server Components here render Motion through `motion/react-client` (`AppFooter.tsx:1`, `AboutMe.tsx:2`, `SidePane.tsx:1`); the hero's own `StaggerItem`, a client wrapper, is a second compliant choice the reword may name.
- **CONV-9: partly.** Holds: `DRIFT` restates its shape inline, where `config.ts` names an interface and checks it with `satisfies` (`LayerConfig`, `HazePool`), as the plan itself does for `SpeedClass` and `METEOR_RATE`; and `SATELLITE` is unchecked at its declaration, though `nextGap`'s `law: GapLaw` already type-checks `first` and `gap` at their only use, so that part is consistency. Overstated: the `Epicycle` and `GapLaw` docs do name every field and give the units ("starting angle (radians)", "(s)"); they lack only per-field docs like `LayerConfig`'s, which `HazePool` (`y`, `color`) shows the codebase doesn't always require.
