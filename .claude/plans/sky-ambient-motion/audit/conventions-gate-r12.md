# Audit: codebase conventions (gate round 12)

Auditor for the "conventions" scope, 2026-10-28. Subject: `PLAN.md` after round 11's revision (3,657 lines, 60,054 words), built on cf4d7b8.

## Scope

- **Role.** One of the four auditors (Next.js docs, conventions, DRY, separation of concerns), gate round 12. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code at cf4d7b8 actually uses. It confirms round 11's three conventions fixes (CONV11-1 to CONV11-3), looks for regressions that round 11's whole revision brought into this lens, then sweeps the rest of the plan.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - All of `PLAN.md`; `REVIEW-LOG.md` (its "Round 11" and "Gate round 11" sections and the earlier conventions rows); `audit/conventions-gate-r11.md`; the session scratchpad's `PLAN.before-r11.md`, for round 11's diff.
  - The code baseline: the planning worktree's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty, and the local `master` and `origin/master` both point at cf4d7b8), with `AGENTS.md`, `CLAUDE.md`, `README.md`, `package.json`, `.nvmrc`, `.claude/launch.json`, `Navbar.tsx`, `icons/Icon.tsx` and two stroke icons, `mountSky.ts`, `utils.ts`, `src/app/page.tsx` and the sky modules.
  - The Node.js 24 deprecations page (https://nodejs.org/docs/latest-v24.x/api/deprecations.md), for 7.1's DEP0205.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only: nothing in `PLAN.md`, `REVIEW-LOG.md`, either checkout's `src/` or configuration was edited. Scripts live in the session scratchpad's `conventions-gate-r12/`.
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other reviewers. They appear here only where they touch a convention.
  - Only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then the baseline files the sketches extend or cite.
2. Diffed `PLAN.before-r11.md` against the current plan (a 252-line diff) and every fenced block (`blockdiff.mjs`). Ten blocks changed, all in doc or comment text: no line of sketch code changed. Each change was checked against 7.0's comment rules and the phase that commits it.
3. Measured every doc and line comment in the 41 TypeScript, TSX and JavaScript sketches against cf4d7b8's `src`, with tabs as 4 columns and line endings excluded (the checkout uses CRLF): multi-line docs (`wrap.mjs`), one-line docs (`oneliners.mjs`), and the four rewrapped docs word for word against `PLAN.before-r11.md`.
4. Scanned every sketch for code style (`style.mjs`: indentation, semicolons, quotes, namespace imports, `any`, enums, classes, `var`, non-null assertions), its comments for plan-only wording (`words.mjs`), and its non-ASCII characters against those `src` already uses.
5. Listed all 188 `file:line` citations beside the cited cf4d7b8 lines (`cites.mjs`) and diffed the set against round 11's 187. The one new citation, `config.ts:296` (6.10's `path` doc), resolves to `METEOR.path`'s doc; none was dropped.
6. Checked every backticked identifier against cf4d7b8's words and the sketches' (`names.mjs`): the same 54 plan-defined or external names as round 11, and no new one.
7. Counted em and en dashes in `PLAN.md` and `REVIEW-LOG.md` with Node: none.
8. Checked the process facts the plan relies on:
   - `package.json`: `lint` and `type-check` (`next typegen && tsc --noEmit`), `engines.node` 24.x, `typescript` ~6.0.3, `next` 16.4.2; `.nvmrc` 24; `autoPort` in both `.claude/launch.json` entries.
   - Node 24.14 (installed): `module.registerHooks` exists and `module.register()` raises no warning. The v24 deprecations page lists DEP0205 (`module.register()`) as a documentation-only deprecation added in v24.15.0, so 7.1's choice of `registerHooks` holds.
9. Checked the main-thread sketches against `Navbar.tsx` (Resume's stagger slot, `:152-161`), `Icon.tsx` and `CalendarSVG.tsx`, `mountSky.ts` (`:206-214`, `:310-313`), `utils.ts:19-20`, and where the sky and the navbar render (`src/app/page.tsx:6-7`, `:31-32`).

## Round 11's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV11-1 | landed | (a) The P2 camera docs no longer name the pause or Play: `CameraInput.follow` reads "Full motion: the springs follow their targets; otherwise they hold where they are (C6)." (628), `stepCamera`'s hold comment "Motion isn't full: the springs hold where they are" (712), `resumeCamera` "Motion is full again: the sky keeps its place and follows the scroll from here (C8)." (725). All hold from P2, where `SkyMotion` has no paused state (cf4d7b8 `protocol.ts:32-38`). The one camera doc that names a pause, `leanWanted`'s (812), lands in P7, after P5. (b) `SKY_WINDOW` reads "for the geometry of the transients crossing it" (2364), true in P9 and P11. (c) `heroLaunchMaxScroll`'s P8 doc reads "Transients launch over the hero only while no more than this many viewport heights are scrolled." (1716), true in every phase; P12's farewell files reword `LaunchGate.allowed`'s doc to "a launch scene (SceneLevels.launchScene)" (3318), while 6.9's sketch keeps P8's text (2135), which names only P8's field. No 8.4 row is needed: neither doc is in answer 1's hands-off list. |
| CONV11-2 | landed | `PACING.narrowMaxFps`, `slowMaxFps` and `softwareShare`, the doc's drift sentence and `driftCap` are P6's in 5.1's `config.ts` and `pacing.ts` rows (319, 323), 6.2's prose (965), `driftCap`'s "(P6)" (1059), P3's files ("`PACING` without its drift caps (P6)"; "with `FrameState` and `frameDemand`", 3038-3039) and P6's files (3134-3135). Every other mention (857, 1216, 1231, 1248-1249, 3140) was already P6's. P3 loses no check: H4's capped case and 6.2's divisor table need only a cap value in `FrameState.cameraCap`, which P3 fills with `Infinity` (1231), and 7.0's P6 entry ("the drift, its caps") keeps the sketch doc's `driftCap()` clause out of P3. |
| CONV11-3 | landed | The four docs keep their words (compared word for word) and wrap evenly: `CAMERA` (481-493), `PACING` (933-946), `METEOR_RATE` (2422-2428) and `SATELLITE` (2639-2652) run to 120 columns or less, apart from two untouched `CAMERA` lines at 122 (483-484), within cf4d7b8's widest multi-line doc line (124). No multi-line doc line in any sketch now runs past 126 columns; the two at 126 (813, 1703) predate round 10. |

## Round 11's revision, through this lens

- **No code changed.** Every edited block changed only doc or comment text, so round 11's TypeScript 6.0.3 and ESLint probes of the `config.ts`, `pacing.ts` and `camera.ts` sketches still stand.
- **The new doc and comment text follows 7.0.** `planMeteorTransient`'s new sentence ("From P10 a second argument adds options to every `planMeteor` call ...", 2105-2107) and the two P10 notes (2109, 2117) keep that doc's phase-marked style, which the section 6 intro and 7.0 tell the implementer to resolve per phase. `PlanOptions.fireball` (2590), the `meteors.ts` note (2599-2603) and the reworded `FRAME.motionEase` (1682-1684) and `SkyPauseButton` (1866-1869) docs are true from the phase that commits them.
- **No new name** beyond `planMeteorTransient`'s `options` parameter, typed `Omit<PlanOptions, 'steer' | 'nearCopy' | 'ink'>`, whose members (`flights`, `clearOf`, `fireball`, then P12's `starts`) all exist in their phases.
- **Citations and dashes.** One new citation, which resolves; no dash.

## Findings

### CONV12-1 (minor): `PlanOptions.clearOf`'s one-line doc would be the widest doc line in the repository

- **Section.** 6.10, "What the veil planner accepts" (the `meteors.ts` sketch).
- **Problem.** The doc is one line of 352 columns (2588). Committed with its plan tags dropped, it runs to 241 columns in P9 and 337 once P12 adds the farewell clause. Nothing in the repository would rewrap it (no Prettier, no `max-len` rule), so an implementer who pastes the sketch commits the widest doc line in the codebase by a wide margin, beside one-line siblings of at most 173. Round 11's CONV11-3 rewrapped four multi-line docs for the same reason, and this one-liner, which round 10's farewell clause lengthened, was left. It is polish: nothing built changes.
- **Evidence.**
  - PLAN.md 2588 (6.10): "/** Padded zones no path comes within QUIET.feather of, as `nearCopy` false keeps it from all: the side rails, whose links change color on hover and focus, which their measured headroom misses until the next measurement; for farewell meteors, also the sky above the end scene's quiet copy, where unmarked copy shows (P12). Default none. (I2, P9) */".
  - At cf4d7b8, with tabs as 4 columns and line endings excluded: the widest one-line doc in `src` is 218 columns (`utils.ts:4`), and the same interface's widest is 173 (`PlanOptions.ink`, `meteors.ts:55`). Of the plan's 227 one-line sketch docs, this is the only one wider than 218 (`oneliners.mjs`).
  - Long field docs at cf4d7b8 are multi-line: `SkyRect.headroom` (`protocol.ts:24-28`) and `METEOR`'s flight block (`config.ts:286-290`).
- **Fix.** Write it as a multi-line field doc wrapped at about 120 columns, words unchanged, so P12's clause adds a line instead of lengthening one:

  ```ts
  	/**
  	 * Padded zones no path comes within QUIET.feather of, as `nearCopy` false keeps it from all: the side rails,
  	 * whose links change color on hover and focus, which their measured headroom misses until the next measurement;
  	 * for farewell meteors, also the sky above the end scene's quiet copy, where unmarked copy shows (P12). Default
  	 * none. (I2, P9)
  	 */
  	clearOf?: readonly SkyRect[]
  ```

  Its lines run to 113, 116 and 116 columns.

## What passes

- **Code style in all 41 sketches.** Tabs (except the list-nested `LEAN_POINTER_QUERY` block); no line-end semicolons; single quotes, with double quotes only on JSX string attributes as in `Navbar.tsx:113`; no namespace imports, `any`, enums, classes, `var` or non-null assertions.
- **Imports and boundaries (AGENTS.md).**
  - Model files import their siblings by relative path, and kind modules take `transients.ts` types through a statement-level `import type`. Worker files import only `@/lib/sky/*` by file and each other. `mountSky.ts` keeps to types and `@/lib/sky/color`, and `skyPause.ts` reads `@/lib/utils` by file.
  - Sibling-relative imports (`./skyPause`) and inline `type` specifiers have precedent at cf4d7b8 (`SkyCanvas.tsx:5`, `sky.worker.ts:13`, `scene.ts:1`).
  - The control, its store and the sky render only from `src/app/page.tsx` (`:6-7`, `:31-32`), so the `/links` by-file rule doesn't reach them.
- **Components.** `SkyPauseButton` is a default export with a props interface and no directive, under the client `Navbar.tsx`; its stagger slot follows Resume's (`Navbar.tsx:152-161`); the glyphs follow `Icon`'s decorative pattern (`Icon.tsx`, `CalendarSVG.tsx`) with named re-exports in the barrel.
- **Config docs and names.** Every new config constant has a doc in `config.ts`'s style. The private shape interfaces (`DriftConfig`, `SpeedClass`) go undocumented as `LayerConfig` and `HazePool` do at cf4d7b8 (`config.ts:55`, `:181`). The non-ASCII in the docs is math notation of the kind `src` already uses (π, ², °, ×). New and renamed names follow the code's patterns and collide with nothing.
- **The committed-doc rule (7.0).** No committed doc names a later phase's feature outside 7.0's list or an inline phase tag. "Today's" in four docs is change-relative wording that round 5 accepted on codebase precedent (`Navbar.tsx:69`, `fonts.ts:3`).
- **Process.** `npm run lint` and `npm run type-check` for every phase (7.0's Commands); the `/_next/mcp` checks on our own `autoPort` server, then the build with that server stopped and `portfolio-prod`; conventional commits as in `git log` (`feat(sky)`, `refactor(sky)`, `docs`); the `motion` docs query before P5's entrance; no `.env` file, Cache Components API or POST to `/api/schedule/book`; Node 24 and TypeScript ~6.0 features only. `data-sky-quiet` and the quiet-copy precondition are kept in D1's alternatives.
- **User-facing copy.** "Pause sky animation", "Play sky animation" and the `AGENTS.md` line read plainly, in sentence case, with no dash.

## Summary

- **Verdict: pass.** No blocking or major findings in this lens.
- Round 11's three conventions fixes landed with no regression. Its other edits changed no sketch code, follow 7.0's comment rules, and add one citation, which resolves.
- **One minor finding,** cheap and clearly right: CONV12-1. `PlanOptions.clearOf`'s one-line doc (241 columns as committed in P9, 337 in P12) is the only sketch doc wider than any doc line at cf4d7b8 (218); write it as a multi-line field doc.
