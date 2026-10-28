# Audit: codebase conventions (gate round 7)

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` after round 6's revisions and the move of the review history into `REVIEW-LOG.md` (3,819 lines, as committed at 5302efe).

## Scope

- **Role.** One of the four auditors, gate round 7. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code actually uses. It confirms that round 6's conventions fixes (CONV6-1 to CONV6-4) landed, looks for regressions from round 6's other fixes, then sweeps the rest of the plan through this lens.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
    - `COORDINATION.md` gained "Answers to the planning session's questions (2026-10-27)" during this audit (commit 4606c23, 20:14), after this round's `PLAN.md` (20:10). `PLAN.md` doesn't fold them in yet; its log says round 7 does. The answers are read here as authoritative, and "Outside this scope" below lists what they change for that fold-in.
  - All of `PLAN.md`; `audit/conventions-gate-r6.md`; the round 6 rows of `REVIEW-LOG.md` (Check log "Round 6", Audit log "Gate round 6").
  - The worktree at 246c0aa: `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, the icons, `Icon.tsx` and their barrel, the `src/lib` and `src/hooks` barrels, `utils.ts`, the `globals.css` theme, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `.claude/launch.json`, `.mcp.json`, `README.md`, `AGENTS.md`, `CLAUDE.md` and `git log`.
  - The main checkout, read only, where names meet: `git status` of its sky files, its `frameAt`, its `meteors.ts` exports and its spelling.
  - The Node.js v24 deprecations page (DEP0205).
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only: nothing in `PLAN.md`, `REVIEW-LOG.md`, `src/` or configuration was edited in either checkout. Throwaway scripts and probes live in the session scratchpad, `conventions-gate-r7/`.
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other reviewers. They appear here only where they touch a convention; CONV7-4 crosses into coordination and says so.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then every source file the sketches extend.
2. Diffed round 6's input (`check-r6-cg/PLAN.r6.md`, its body up to the Check log) against the current plan (`r6.diff`): 86 lines added or changed, 75 removed. 28 of the changed lines sit inside fenced blocks (26 in TypeScript sketches, one in 6.1's law, one in 7.2's map), and each was checked for style, imports, names and docs. The current plan equals round 6's revised body (`reviser-r6/PLAN.after-r6.md`) plus section 1's line on `REVIEW-LOG.md`.
3. Re-ran round 6's block scanner over all 41 TypeScript, TSX and JavaScript blocks, its doc-comment scan and its session-wording scan; scanned `PLAN.md` and `REVIEW-LOG.md` for em and en dashes, and the sketches' comments for British spellings.
4. Grepped for leftovers of every name round 6 changed (`FrameState.transients`, `spec.narrow`, a spec's `narrow:`, `leanPending`, `[brightest, faintest]`), and grepped the main checkout's sky tree for the new names (`leanWanted`, `transientDemand`, `phones`, `farewell`, `gather`): none collides.
5. Type-checked and linted two probes built from the sketches verbatim (`probe/`, written by `extract.mjs`): `camera.ts` with `leanWanted`, and `pacing.ts` with `FrameState.transientDemand`, over the plan's `CAMERA`, `DRIFT`, `LEAN`, `PACING` and `FRAME` blocks. TypeScript 6.0.3 with the repository's strict options and `noUncheckedIndexedAccess`, and ESLint with `eslint-config-next` core-web-vitals and typescript plus the repository's overrides: both exit 0.
6. Checked Node 24: `module.registerHooks` is a function on 24.14.0, and DEP0205 (`module.register()`) is a documentation-only deprecation added in v24.15.0 that points to `module.registerHooks()` (https://nodejs.org/docs/latest-v24.x/api/deprecations.md).

## Round 6's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV6-1 | landed | `heroLaunchMaxScroll`'s doc is spelled out in 6.7 (1743) and carried by P8's files and step 3 (3250, 3264); the narrow block's doc drops "`narrowLimit` per visit" (2287, 3250, 3264); P4 writes `SkyFrame.time`'s doc without a kind (3125); 7.0 gains the rule that a committed doc describes what its phase ships (2867). CONV7-2 covers a gap the rule's P11 example leaves. |
| CONV6-2 | landed | 6.9 writes `settled: now - lastScrollAt >= TRANSIENTS.scrollQuiet * 1000` (2366), P8's files name both units (3250), and H13's case 7 runs the worker's launch gate (2948, 3269). The test keeps today's sense: `sky.worker.ts:202` holds a launch while `now - lastScrollAt < 1200`. |
| CONV6-3 | landed, one regression | `FrameState.transientDemand` (1065-1066, 1083, 1224, 1239, 2371) and `TransientSpec.phones` (2094-2095, 2151, 2243, 2765); no `FrameState.transients`, `spec.narrow` or spec `narrow:` is left. The rename leaves 6.2's arrival table calling the field absent before P8 (CONV7-1). |
| CONV6-4 | landed | `LAYER_NEARNESS` destructures `[from, to]` (491-492), as `STARS_PER_CELL` and `cellStars` do (`catalog.ts:67`, `:135`); `skyWindow` has a doc (2535), though its wording carries CONV7-5's spelling. |

## Round 6's other fixes, through this lens

- **DRY-R6-2 (`leanWanted`).** A doc-commented export in `camera.ts`, named like `driftWanted`, and listed in 5.1, 6.2's table, 6.13, P7's files and steps, H5 and H13. The probe compiles and lints clean, and `leanPending` is gone everywhere.
- **SOC6-1 (`frameAt` gathers).** `gather`'s doc, 6.1's note and P6's files agree (865, 885-886, 922, 3188), but the one list of `frameAt` overlaps doesn't carry the new line (CONV7-4).
- **SOC6-2 (farewell meteors).** `LaunchGate.scene` and `TransientSpec.scene` read well, but the change it makes to `scene.ts` is in no file list (CONV7-3).
- **SOC6-3, SOC6-4, the PHY6, CA6 and C51 to C54 fixes, DRY-R6-1.** Their sketch lines (6.1's law, `CameraInput.scroll`'s doc, `DriftGate`'s doc) pass the style checks; the rest is prose and numbers.
- **The log move.** `PLAN.md` carries no review log, and section 1 points to `REVIEW-LOG.md`, saying the plan holds where the two disagree.

## Findings

### CONV7-1 (minor): 6.2's arrival table still calls `transientDemand` absent before P8

- **Section.** 6.2, "The worker's demand": the table "Lines that refer to later phases arrive with them".
- **Problem.** CONV6-3 renamed the frame state's field to `transientDemand`. That field exists from P3 and holds today's meteor line until P8 (1065-1066, 1239). The table's row `transientDemand | absent | P8` (1263) was written for the function call, beside a field then named `transients`. It now also names the field, and says it is absent before P8. P3's step 2 builds `demandNow` from this table, while the interface (1066), the initializer (1224) and `frameDemand` (1083) need the field from P3.
- **Evidence.** PLAN.md 1065-1066, 1083, 1224, 1238-1239 and 1250-1263; the same row in round 6's input (`PLAN.r6.md` 1255) beside `transients: FrameDemand` (1058).
- **Fix.** The row becomes "`transientDemand(transients, t)` in the transient line | today's meteor line (as written) | P8".

### CONV7-2 (minor): P12 reads P11's `CLEAR_SKY_KEEPS`, but the phase map and P11's rollback say nothing depends on P11

- **Section.** 7.0 (the doc rule), 7.2 (P12's row), 7.3 (P11's rollback, P12's files), 6.12.
- **Problem.**
  - CONV6-1's fix has 7.0 say "P11 adds satellites and `CLEAR_SKY_KEEPS`" (2867), and 5.1 and P11's files add the constant there (352, 3342).
  - P12 reads it: `drawTransient` hands the point flash, bursts and earthgrazers `CLEAR_SKY_KEEPS` (2796), and the comet draws every part with it (2791). Until answer 3 is folded in, the comet also feeds `LaunchGate.cometShowing` to I9's fallback, which P11 adds too (2247, 3345).
  - Yet 7.2 has P12 depend on P9 only (2984), P12's files add neither (3364), and P11's rollback ends "or revert. Nothing depends on it." (3358). P11 is a "should" (3338).
  - So a P12 kind shipped without P11, or kept when P11 is reverted, names a constant no phase adds: the build breaks at the first use, and an implementer following 7.2 only learns of the dependency there.
- **Evidence.** PLAN.md 352, 2247, 2791, 2796, 2867, 2984, 3338, 3342, 3345, 3358, 3364.
- **Fix.** 7.2's P12 row: "P9; P11 for the clear-sky variants and the comet (`CLEAR_SKY_KEEPS`)". P11's rollback: "P12's clear-sky variants and the comet read `CLEAR_SKY_KEEPS`: revert them first, or keep the constant." (Or P12 adds the constant, with its doc, when P11 hasn't shipped.)

### CONV7-3 (minor): the farewell kind's `scene.ts` change is unlisted, and a renamed flag ends up holding a scene name

- **Section.** 6.12 (the farewell row), 7.3 (P12's files), 5.1 (the `scene.ts` row), 8.6 (the `scene.ts` row).
- **Problem.**
  - SOC6-2's fix has the gate report "`LaunchGate.scene`: `'hero'`, `'end'` once the end level is at least 0.9, or null, from `SceneLevels.launches`, which then names it" (2790). So P12 changes `scene.ts`: `SceneLevels.launches` turns from P8's flag ("transients launch only over the hero", 1743; today's `meteors: boolean`, `scene.ts:16-17`) into a scene name, and `sceneAt` computes it (`scene.ts:36`).
  - P12's farewell files name `transients.ts`, `meteorKind.ts`, a `config.ts` block, `drawTransient` and the worker's `launchGate`, but not `scene.ts` (3364). 5.1's `scene.ts` row stops at P8 (354), and so does 8.6's (3516).
  - The name then misleads: `scene.launches === 'end'` reads as a count or a flag, beside the round's own `LaunchGate.scene` and `TransientSpec.scene`.
  - The 0.9 is a new tunable with no key, while every sky tunable lives in `config.ts` with a doc (`config.ts:1-3`), the scene's scroll thresholds in `SCENE` (`config.ts:149-156`).
- **Evidence.** PLAN.md 354, 1743, 2790, 3364, 3516; worktree `scene.ts:16-17`, `:36`, `config.ts:1-3`, `:149-156`.
- **Fix.** P12's farewell files add "`scene.ts`: `SceneLevels.launches` becomes a scene name (for example `launchScene: 'hero' | 'end' | null`), computed in `sceneAt`, with its doc"; 5.1's and 8.6's `scene.ts` rows gain P12; and the 0.9 becomes a documented `SCENE` key beside `heroLaunchMaxScroll` (for example `endLaunchFrom`: "the end bookend's level from which farewell meteors may launch").

### CONV7-4 (minor; crosses into coordination): the one list of `frameAt` edits misses P6's `gather` call

- **Section.** 8.6 (the `frameAt` row), 8.4 (CP-0's overlap request), 6.1.
- **Problem.** SOC6-1's fix makes `frameAt` call `gather(now, scene)` first from P6 (922; 865, 885-886; P6's files, 3188). 8.6 is "the one list of what both plans touch; 4.4, CP-0 and CP-5 point here" (3500). Its `frameAt` row lists `snap`, `offset`, `twinkleTime`, `thinFrom`, `thinLevel` and the `keep` line (3505), and CP-0 names exactly those (3448): the `gather` line is in neither. In the veil tree that line would sit two lines from their changed `contrast` local (main checkout `sky.worker.ts:307-309`, observed), the likeliest conflict in `frameAt` at the rebase. The veil session's answer 2 has since agreed to the `frameAt` overlap and named the lines to keep, so only the list needs the line.
- **Evidence.** PLAN.md 865, 885-886, 922, 3188, 3448, 3500, 3505; main checkout `sky.worker.ts:305-309` (read only); `COORDINATION.md` answer 2.
- **Fix.** 8.6's `frameAt` row adds "`gather(now, scene)` after the scene line (P6)", and CP-0's list (or whatever the fold-in of answer 2 leaves of it) names it too.

### CONV7-5 (minor): sketch docs spell "centre" where the code says "center"

- **Section.** 6.3 (`profile`, `placePoint`), 6.10 (`SKY_WINDOW`, `SpeedClass.angular`, `SkyWindow.pitch`, `skyWindow`), 6.11 (`SATELLITE`), 6.13 (the `pointer` message).
- **Problem.** Ten comment lines that become committed docs spell "centre" or "centred". The code uses American spelling throughout: "center" (`config.ts:167`, `:173`; `skyAssets.ts:62`, beside `const center` at `:64`), "centered" (`OtherProjects.tsx:54`), "color" everywhere; and so does the veil tree ("center pixel", "centerline", "centering": main checkout `meteors.ts:81`, `:88`, `mountSky.ts:120`). Neither tree has a "centre". The `profile` sketch would put "centred" in the doc right above its own `const center` (1342-1344). The `skyWindow` wording came from round 6's suggested doc.
- **Evidence.** PLAN.md 1342, 1370, 2393, 2394, 2429, 2513, 2535, 2677, 2678 and 2821.
- **Fix.** "center" and "centered" in those sketch comments.

## Outside this scope (for the fold-in of the veil session's answers)

The answers arrived after this round's `PLAN.md`, and `COORDINATION.md`'s log says round 7 folds them in. Two of them change what `PLAN.md` builds, and belong to the coordination review; they are noted here so the fold-in doesn't miss them, and are not counted as findings of this lens.

- **Answer 1 (the hands-off list is now symbol-level).** It replaces "Changed shape" with "its symbols with changed lines", which name `frameMode` (it now calls their `quietEasing`), `tick`, `rebuildHaze`, `SkyFrame`, the `mountSky` function, and the import blocks of `sky.worker.ts` and `renderSky.ts`, and asks us not to "reformat, reorder or move its symbols before the rebase". P2 to P7 edit several of these before V: P2's `frameMode` line (3060), P3's replacement of `frameMode` and `tick` (1218, 1280, 3092), the `SkyFrame` fields of P1, P2, P4 and P6 (3021, 3053, 3125, 3186), and `mountSky`'s listeners and wiring in P4, P5 and P7 (3119, 3149, 3224). 8.6 calls theirs "none" for `frameMode` and `tick` (3504), "no new field" for `SkyFrame` (3512) and "different functions" for `mountSky.ts` (3521), and only `frameAt` and `sameRects` are agreed overlaps.
- **Answer 3 (never-lease kinds may overlap a lease holder, on three conditions).** It settles I9 for kinds that meet them, so the fold-in decides what remains of I9's fallback and `LaunchGate.cometShowing` (which bears on CONV7-2's second point).

## What passes

- **Code style in all 41 sketches.**
  - Tabs, except the markdown-nested `LEAN_POINTER_QUERY` block.
  - No line-end semicolons; single quotes (double quotes only on JSX attributes, as in `Navbar.tsx`).
  - No namespace imports, no `any`, no non-null assertions, no enums or classes.
  - No em or en dash in `PLAN.md` or `REVIEW-LOG.md`.
- **Plan references in sketch comments** (64 tags, 8 `file:line`, 10 session-wording lines, the new `leanWanted` doc's "(F6)" included) all fall under 7.0's rule that committed comments drop them.
- **Docs.** Every new export, config block, config key and main-thread constant has a doc comment. The three declarations the doc scan flags (`Star`, `planMeteor`, `SkyMainMessage`) are existing ones shown in part. Interfaces follow `LayerConfig`'s per-field docs where the plan gives them (`Epicycle`, `GapLaw`, `SpeedClass`).
- **Imports.**
  - Model files import their siblings by relative path; kind modules import `transients.ts` with a statement-level `import type`.
  - Worker files import only `@/lib/sky/*` by file; `skyPause.ts` reads `@/lib/utils`, as `mountSky.ts:3` does.
  - `SkyPauseButton.tsx` imports `./skyPause` as `SkyCanvas.tsx` imports `./mountSky`. The two glyphs follow `Icon.tsx`'s frame like `ArrowRightSVG` (no title, so decorative) and get named re-exports in the alphabetical barrel.
- **Client boundary.** The control is a default export with a props interface, rendered by the client `Navbar.tsx`, so it needs no directive. D1's Server Component hosts put the directive on the control and keep `motion/react-client` (`AppFooter.tsx:1`). `hover:bg-green-tint` is a theme color (`globals.css:17`), already used in `CalendarGrid.tsx`.
- **Names.** No collision with the veil tree (its private `CLEAR_SKY` in `meteors.ts` is a "not veiled" result, distinct from our exported `CLEAR_SKY_KEEPS`). New names follow `create*`, `step*`, `*At`, `note*`, `*Wanted` and `*Moving`. Every config key follows `config.ts:2-3`'s unit rule.
- **Node 24 and TypeScript 6.0.** `module.registerHooks` exists on Node 24, and DEP0205 is a v24 deprecation of `module.register()`. The harness rules (erasable TypeScript only, type-only imports marked) match Node's strip-only mode. Both probes compile under TypeScript 6.0.3.
- **Process.**
  - `npm run lint` and `npm run type-check` for every phase (7.0), and `/_next/mcp` while `next dev` runs.
  - The production smoke build with our own dev server stopped, on `autoPort` from the tracked `.claude/launch.json`.
  - Conventional commit forms, and the `motion` docs query before P5's entrance.
  - No `.env` file, no Cache Components API, `data-sky-quiet` kept, and no POST to `/api/schedule/book`.
- **User-facing copy.** "Pause sky animation" and "Play sky animation", and the `AGENTS.md` line, read plainly, in sentence case, with no em dash.

## Summary

- **Verdict: pass.** No blocking or major findings in this lens. Round 6's four conventions fixes landed where their dispositions say, and its other fixes compile and lint clean in the probes.
- **Five minor findings,** each cheap and clearly right:
  - CONV7-1: CONV6-3's rename left 6.2's arrival table calling the frame state's `transientDemand` absent before P8.
  - CONV7-2: P12 reads P11's `CLEAR_SKY_KEEPS`, while 7.2 has P12 depend on P9 only and P11's rollback says nothing depends on it.
  - CONV7-3: the farewell kind's change to `scene.ts` is in no file list, `SceneLevels.launches` would keep a flag's name while holding a scene, and its 0.9 has no config key.
  - CONV7-4 (crossing into coordination): 8.6's `frameAt` row and CP-0 miss P6's `gather` call.
  - CONV7-5: ten committed-doc lines spell "centre" where both trees say "center".
- **For the fold-in of the veil session's answers** (outside this lens): answer 1's symbol-level hands-off list names `frameMode`, `tick`, `SkyFrame`, `mountSky` and the import blocks that P2 to P7 edit before V, and answer 3 settles I9.
