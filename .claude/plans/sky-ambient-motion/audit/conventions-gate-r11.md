# Audit: codebase conventions (gate round 11)

Auditor for the "conventions" scope, 2026-10-28. Subject: `PLAN.md` after round 10's revision (3,651 lines, 59,713 words), built on cf4d7b8.

## Scope

- **Role.** One of the four auditors (Next.js docs, conventions, DRY, separation of concerns), gate round 11. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code at cf4d7b8 actually uses. It confirms round 10's conventions fixes (CONV10-1, CONV10-2), looks for regressions that round 10's revision (all of it, not only this lens's fixes) brought into this lens, then sweeps the rest of the plan.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - All of `PLAN.md`; `REVIEW-LOG.md` ("### Round 10" and "### Gate round 10", and the earlier conventions rows); `audit/conventions-gate-r10.md`.
  - The code baseline: the planning worktree's `src/`, which `git diff cf4d7b8 HEAD` shows identical to cf4d7b8 (the `sky-baseline-cf4d7b8` checkout earlier rounds used no longer exists), with `AGENTS.md`, `CLAUDE.md`, `README.md`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `.nvmrc`, `.mcp.json`, `.claude/launch.json`, `next.config.ts` and `git log` on master.
  - The session scratchpad's `PLAN.before-r10.md`, for the diff of round 10's revision.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only: nothing in `PLAN.md`, `REVIEW-LOG.md`, either checkout's `src/` or configuration was edited. Probes and scripts live in the session scratchpad, `conventions-gate-r11/`.
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other reviewers. They appear here only where they touch a convention.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then every baseline file the sketches extend or cite (`src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, the icons and their barrel, `icons/Icon.tsx`, the `src/lib` and `src/hooks` barrels, `utils.ts`, `globals.css`).
2. Diffed `PLAN.before-r10.md` against the current plan (291 diff lines) and every fenced block between the two (`blockdiff.mjs`): code changed in six blocks (the 4.1 diagram, `pacing.ts`, `STAR_PHASES`, `LaunchGate`, `METEOR_RATE`, the `meteors.ts` sketch). Each change was checked against 7.0's comment rules.
3. Extracted all 46 fenced blocks (41 TypeScript, TSX or JavaScript) and scanned their comments for indentation, semicolons, quotes, namespace imports, plan tags, process wording and later-phase words (`pause`, `Play`, `drift`, `lean`, `satellites`, `transients`, `farewell`, `comet`, `fireball`) by the phase that commits each block (`scan.mjs` and an inline scan).
4. Listed all 187 `file:line` citations beside the cited cf4d7b8 lines (`cites.mjs`; 182 in round 10) and diffed the set against round 10's input: five are new (`mountSky.ts:231`, `scene.ts:60-69`, `sky.worker.ts:455` and `:504`, `meteors.ts:77-78`), all resolve to what the text says, and none was dropped.
5. Checked every backticked identifier against cf4d7b8's words and the sketches' (`names.mjs`): the 54 that appear in neither are plan-defined in prose, external (the harness, browser sources), or removed on purpose.
6. Probed the changed code: cf4d7b8's `src/lib/sky` with `DEPTH`, `CAMERA`, `DRIFT`, `PACING`, `LEAN` and `FRAME.motionEase` appended, plus the `pacing.ts` (with round 10's `frameDue`) and `camera.ts` sketches: TypeScript 6.0.3 with the repository's options (`strict`, `noUncheckedIndexedAccess`) exits 0, and ESLint with `eslint-config-next` core-web-vitals and typescript plus the repository's overrides exits 0. A TSX probe confirmed that the Navbar sketch's line comment between JSX attributes parses (TypeScript 6.0.3, no diagnostics).
7. Measured doc-comment wrapping in cf4d7b8's sky sources against the sketches (tabs as 4 columns).
8. Confirmed no sky commit followed cf4d7b8 on `master` or `origin/master` (both tips are cf4d7b8), so every citation's baseline still holds.

## Round 10's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV10-1 | landed | 6.9 renames `meteorsAllowed` to `launchesAllowed`, documented "True when transients may launch at all right now (each kind's own timing aside)" (2333), words `reveal`'s doc (`:455`), the `motion` case's comment (`:504`) and `noteInput`'s doc for transients (2335), and arms the sleeping timer on `launchesAllowed(now)` (2338); P8's files (3200), step 3 (3208) and 5.1's worker row (335) follow; P4's mentions keep the old name (1636, 3066, 3073), as the fix said. Both new citations resolve to the intended cf4d7b8 lines, and `LaunchGate.allowed` (2130) agrees. |
| CONV10-2 | landed, with gaps | Fixed the second way: 7.0's sentence (2820) lists what P5, P6, P7, P8 and P11 add to earlier docs; `FrameState.transientDemand` has a doc of its own (1032) and its P3 text in 7.0; `STAR_PHASES` reads "1 rounds every star to whole pixels." (1301). Every doc CONV10-2 named is covered. Three docs the list misses are CONV11-1, and the list leaves `driftCap` and three `PACING` keys with no truthful P3 doc (CONV11-2). |

## Round 10's revision, through this lens

- **No code-style regression.** `frameDue`'s `k <= 1 ||` and its doc (1114-1123), `startArea`'s doc (2591), the planner comment (2593-2597), `clearOf`'s farewell clause tagged "(P12)" (2583) and `LaunchGate.field()`'s doc (2138) follow the code style; their plan tags are notes the section 6 intro tells the implementer to drop.
- **New names fit the code.** `launchesAllowed` (after `launches`), `TransientSpec.limit` and `room`, `TransientSchedule.kindLaunches` beside `launched` and `failedPlans`, and the `starts` option. `planMeteorTransient`'s optional second argument (6.12) stays module-private, since the farewell spec that calls it lives in `meteorKind.ts` (P12's files, 3312).
- **Citations hold.** The five new ones resolve on cf4d7b8 (Method 4).
- **One formatting regression.** PHY10-4's new sentence left `METEOR_RATE`'s doc wrapped ragged (CONV11-3).
- **No em or en dash** in `PLAN.md` or `REVIEW-LOG.md` (counted with Node).

## Findings

### CONV11-1 (minor): 7.0's list of later clauses misses three docs: P2's pause and Play, P9's satellites, and P8's hero-only launch docs under P12's farewell meteors

- **Section.** 7.0 (the committed-doc rule), 6.1 (`camera.ts`), 6.10 (`SKY_WINDOW`), 6.7 and 6.9 (`heroLaunchMaxScroll`, `LaunchGate`), 6.12 (farewell meteors), P12's files, 8.4.
- **Problem.** Round 10 fixed CONV10-2 by enumerating, in 7.0, what each later phase adds to the docs earlier phases commit: "so earlier phases write it without the later clauses: P5 adds the motion ease (`FADE_FRAMES`, `FrameState.fading`); P6 the drift, ...; P7 the lean ...; P8 every kind to `FrameState.transientDemand` ...; P11 satellites and `CLEAR_SKY_KEEPS` to the docs P8 writes ...". The list reads as complete, but three cases fall outside it:
  - **(a) P2's camera docs name P5's pause and Play.** `camera.ts` lands in P2 with `CameraInput`, `stepCamera` and `resumeCamera` (5.1, 322; 6.1, 823), three phases before the pause control (7.2: P2, P3, then P5). Yet `CameraInput.follow` reads "Otherwise (reduced motion, paused) they hold where they are" (628), `stepCamera`'s hold comment "Reduced motion or paused: the springs hold where they are" (712), and `resumeCamera` "Motion is full again (Play, reduced motion off)" (725). P5's entry adds only the motion ease.
  - **(b) P9's `SKY_WINDOW` doc names P11's satellites.** It lands in P9 (5.1, 319; P9's files, 3224) reading "for the geometry of shooting stars and satellites" (2359). Satellites are P11, a "should" that may never ship (7.2), and P11's entry names only the docs P8 writes.
  - **(c) Farewell meteors (P12) make two P8 docs false.** `heroLaunchMaxScroll`'s doc, "Transients launch only while no more than this many viewport heights are scrolled." (1715), and `LaunchGate.allowed`'s, "Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches)." (2130). With farewell meteors, transients also launch in the end scene, `allowed` keeps only "a launch scene" (`scene !== null`), and `SceneLevels.launches` gives way to `launchScene` (6.12, 2749), so the second doc names a field that no longer exists. P12's files (3312) and 8.4's `scene.ts` row (3376) name `launchScene`'s doc and `endLaunchLevel`'s ("documented beside `heroLaunchMaxScroll`"), but neither of these two docs.
- **Evidence.** PLAN.md lines above; 7.2's phase order (2914); REVIEW-LOG.md 392 (CONV10-2's disposition: "7.0's sentence says which phase adds what to the earlier docs"). At cf4d7b8, `SkyMotion` has no paused state (`protocol.ts:32-38`: `reduced` is "prefers-reduced-motion, so fades and brightness only"), which is what P2's docs would describe.
- **Fix.** Extend 7.0's sentence:
  - P5 also adds the pause and Play to the camera docs P2 writes for reduced motion alone (`CameraInput.follow`, `stepCamera`'s hold comment, `resumeCamera`);
  - P11 also adds satellites to `SKY_WINDOW`'s doc (P9: "for the geometry of shooting stars").
  - Add to P12's farewell files (and 8.4's `scene.ts` row): `heroLaunchMaxScroll`'s doc (the hero's launches only) and `LaunchGate.allowed`'s ("a launch scene (SceneLevels.launchScene)").

### CONV11-2 (minor): `driftCap` and three `PACING` keys land in P3, but their only readers and every word of their docs are P6's

- **Section.** 5.1 (the `config.ts` and `pacing.ts` rows), 6.2 (`PACING`, `driftCap`, the "Lines that refer to later phases" table, "Software raster"), 7.0, P3's and P6's files.
- **Problem.** P3 ships `PACING` whole and `driftCap`: 5.1 says "`PACING` and the `FRAME` doc (P3)" (319) and lists `driftCap` among P3's exports (323); P3's files say "`config.ts`: `PACING`" and "`pacing.ts`: new (6.2), with `FrameState`, `frameDemand` and `driftCap`" (3032-3033). But nothing reads them before P6:
  - `narrowMaxFps` and `slowMaxFps` are read only by `driftCap` (1058-1061), and `softwareShare` only by `softwareFps` (1247).
  - The cap line and `softwareFps` are P6's ("`Infinity`, and no `softwareFps` | P6", 1230; "**Software raster** (P6: the drift is its first reader)", 1244). Until then `cameraCap` is `Infinity` and nothing in P3 caps anything.
  - Their docs speak only of the drift: "The drift draws at most `narrowMaxFps` on narrow screens ... and `slowMaxFps` after the first adaptive step; a software-rasterized canvas may spend `softwareShare` of a core on it" (937-940), and "Most drift frames per second: ..." (1058).

  Round 10's 7.0 sentence (2820) says P6 adds "the drift, its caps ... to the 6.1 and 6.2 docs naming them", so P3 must write these docs without them. That leaves three `PACING` keys undocumented in P3 (`config.ts` documents every key in its block's doc, and 5.2 asks for a doc comment on every config constant), and gives `driftCap`, a function named for the drift, no doc that is true in P3. Section 6's own rule says otherwise: "Imports and module constants arrive with their first reader's phase" (400). Round 8 settled the same case this way: CONV8-2 moved the `ADAPT` drift-cap sentence to P6 (REVIEW-LOG.md 356; 964 now cites `PACING.slowMaxFps` from P6).
- **Evidence.** PLAN.md lines above. H4's capped case ("a fade beside the capped drift keeps the drift's cap", 2892) and 6.2's divisor table (1272-1279) need only a cap value in a `FrameState` or in `refreshDivisor`'s `cap` argument, not `driftCap`, so P3's verification loses nothing.
- **Fix.** Land `PACING.narrowMaxFps`, `slowMaxFps` and `softwareShare`, with the doc's drift sentence, and `driftCap` in P6, beside the cap line and `softwareFps` that read them. That means 5.1's `config.ts` and `pacing.ts` rows, P3's files (drop `driftCap`), P6's files (add the three keys and `driftCap`), and a "(P6)" tag on the `PACING` sketch's drift sentence and on `driftCap`. Alternatively, keep them in P3 and have 7.0 name them as the one exception whose P3 docs describe the drift P6 brings.

### CONV11-3 (minor): four sketch docs wrap unlike any multi-line doc in the sky sources

- **Section.** 6.1 (`CAMERA`), 6.2 (`PACING`), 6.10 (`METEOR_RATE`), 6.11 (`SATELLITE`).
- **Problem.** An implementer pastes these sketches into `config.ts`, and nothing in the repository rewraps them: there is no Prettier, and `eslint.config.mjs` has no `max-len` rule. Four docs break the wrapping `config.ts` keeps:
  - `PACING`'s third line runs to 166 columns (936: "...never draws below `minFps`. Motion draws on animation frames divided by a whole number, so every drawn frame stays up for the").
  - Three docs break mid-paragraph after a short line: `CAMERA` at 90 columns (490: "...at most about 25 px to glide on a 900 px screen. A"); `METEOR_RATE` at 60 (2422: "follow `hero` (floor 4 s plus an exponential 8 s, at most"), left by round 10's PHY10-4 edit (REVIEW-LOG.md 212); `SATELLITE` at 80 (2641: "about magnitude 3.5 to 5.5: never brighter than the brightest mid-layer star;").
- **Evidence.** Measured on cf4d7b8 with tabs as 4 columns. All 342 lines of multi-line doc comments in `src` run to at most 125 columns, none over 130: `config.ts` reaches 125, `meteors.ts` 123, `scene.ts` 121, `sky.worker.ts` 122 and `mountSky.ts` 125. In the sky files none breaks short mid-paragraph except a deliberate paragraph break (`mountSky.ts:117-118`). Round 10's "long lines match the codebase" rests on other kinds of line: of the 69 lines over 160 columns in `src` (tabs as 4), 63 are code, 5 one-line docs and 1 a line comment.
- **Fix.** Rewrap the four docs at about 120 columns, as `config.ts` does.

## What passes

- **Code style in all 41 sketches.** Tabs (except the markdown-nested `LEAN_POINTER_QUERY` block); no line-end semicolons; single quotes, with double quotes only on JSX string attributes as in `Navbar.tsx:113`; no namespace imports, `any`, enums, classes, non-null assertions or `var`. Import order isn't enforced, and long code lines match `src`.
- **Imports and boundaries (AGENTS.md).**
  - Model files import their siblings by relative path. Kind modules import `transients.ts` with a statement-level `import type`, and there is no runtime cycle: `transients.ts` imports the kinds' spec values, while `gaps.ts`, `quietIndex.ts` and `radiants.ts` never import it.
  - Worker files import only `@/lib/sky/*` by file and each other.
  - `mountSky.ts` still takes only types and `@/lib/sky/color` from `src/lib/sky`, and its new constants sit beside `DPR_CAP`. `skyPause.ts` reads `@/lib/utils` by file (`utils.ts:20`).
  - `SkyPauseButton.tsx` imports the `@/components/icons` and `@/lib` barrels as `Navbar.tsx:7-8` does, on a route `/links` never loads.
- **Client boundary and components.**
  - `SkyPauseButton` is a default export with a props interface, rendered by the client `Navbar.tsx` (`'use client'` at `:1`), so it carries no directive.
  - D1's Server Component hosts give the control's own file the directive and keep `motion/react-client` or the hero's `StaggerItem`, with `data-sky-quiet` and AGENTS.md's quiet-copy precondition.
  - The glyphs sit on `Icon` with no `title` (decorative), with named re-exports in the alphabetical barrel.
  - `hover:bg-green-tint` and `duration-250` are classes the code already uses (`CalendarGrid.tsx:114`, `Navbar.tsx:83`).
  - React Compiler is on (`next.config.ts:48`), so the control needs no memoization.
- **Config docs and names.** Every new config block and key has a doc in `config.ts`'s style, with units as `config.ts:2-3` sets them (`Ms` names, `stepDevicePx`, km names, seconds elsewhere), apart from CONV11-2's three keys in P3. New names follow the code's patterns (`*At`, `create*`, `step*`, `note*`, `*Wanted`, `*Transients`, `*SVG`, `*Allowed`) and collide with nothing in the worker or `src/lib/sky`.
- **Node 24 and TypeScript 6.0.** `module.registerHooks`, `--disable-warning` and type stripping are Node 24 features (`.nvmrc` 24, `engines.node` 24.x); `typescript` stays `~6.0.3`; the probe compiles under 6.0.3.
- **Process.**
  - `npm run lint` and `npm run type-check` for every phase (7.0), and `/_next/mcp` while our own `autoPort` server runs (`.claude/launch.json`); the production smoke build runs with that server stopped, then `portfolio-prod` (CLAUDE.md).
  - Conventional commit forms (`feat(sky)`, `refactor(sky)`, `docs`), matching master's `feat(sky)`, `feat:` and `chore:`.
  - The `motion` docs query before P5's entrance.
  - None of: a `.env` file, a Cache Components API, a POST to `/api/schedule/book`. `data-sky-quiet` is kept, and the Next.js upgrade reminder is handled.
- **User-facing copy.** "Pause sky animation", "Play sky animation" and the `AGENTS.md` line read plainly, in sentence case, with no em dash.

## Summary

- **Verdict: pass.** No blocking or major findings in this lens. Round 10's two conventions fixes landed. Its other changes keep the code style and naming, and all 187 citations resolve on cf4d7b8.
- **Three minor findings,** each cheap and clearly right:
  - CONV11-1: 7.0's new list of later clauses misses three docs. P2's camera docs name P5's pause and Play, P9's `SKY_WINDOW` names P11's satellites, and P12's farewell meteors leave P8's hero-only `heroLaunchMaxScroll` and `LaunchGate.allowed` docs false (the latter naming the `SceneLevels.launches` that P12 replaces).
  - CONV11-2: `driftCap` and `PACING`'s `narrowMaxFps`, `slowMaxFps` and `softwareShare` land in P3, but their only readers and every word of their docs are P6's. Under 7.0 they have no truthful P3 doc, so they should land in P6 with their first reader.
  - CONV11-3: four sketch docs (`PACING`, `CAMERA`, `METEOR_RATE`, `SATELLITE`) wrap unlike any multi-line doc in the sky sources, one of them left so by round 10's edit.
