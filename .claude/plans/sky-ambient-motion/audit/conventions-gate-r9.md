# Audit: codebase conventions (gate round 9)

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` after round 8's revision (3,653 lines), built on cf4d7b8.

## Scope

- **Role.** One of the four auditors (Next.js docs, conventions, DRY, separation of concerns), gate round 9. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code at cf4d7b8 actually uses. It confirms round 8's conventions fixes (CONV8-1 to CONV8-4), looks for regressions that round 8's revision (all of it, not only this lens's fixes) brought into this lens, rechecks the restructure's leftovers and re-grounded `file:line`, then sweeps the rest of the plan.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree") and `research/01-planning-brief.md`.
  - All of `PLAN.md`; `audit/conventions-gate-r8.md` (and r5, for the earlier ruling on change-relative wording); `REVIEW-LOG.md` (round 8's rows, the restructure log).
  - The code baseline, the read-only checkout of cf4d7b8 (`.claude/worktrees/sky-baseline-cf4d7b8`): `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `Background.tsx`, the icons and their barrel, the `src/lib`, `src/hooks` and `motion` barrels, `utils.ts`, `animations.ts`, `globals.css`, `eslint.config.mjs`, `package.json`, `.nvmrc`, `.claude/launch.json`, `README.md` and `git log`.
  - The session scratchpad's `PLAN.before-r8.md`, for the diff of round 8's revision.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only: nothing in `PLAN.md`, `REVIEW-LOG.md`, either checkout's `src/` or configuration was edited. Probes and scripts live in the session scratchpad, `conventions-gate-r9/`.
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other reviewers. They appear here only where they touch a convention.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then every baseline file the sketches extend.
2. Diffed `PLAN.before-r8.md` against the current plan (404 diff lines), and checked each changed sketch and doc against 7.0's two comment rules (no plan references or process wording; a committed doc describes what its phase ships).
3. Extracted all 46 fenced blocks (41 TypeScript, TSX or JavaScript) and scanned them for indentation, semicolons, quotes, namespace imports, `any`, enums, classes, non-null assertions, plan tags and process wording in comments, and comment text naming symbols the plan removes.
4. Listed all 180 `file:line` citations beside the cited cf4d7b8 lines (round 8's `cites.mjs`), and compared the set with round 8's run to find citations that are new or now resolve differently.
5. Built a probe from cf4d7b8's real `src/lib/sky` plus the sketches as written: every new config block, `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts` (with `sameRects` moved into `scene.ts`), `gaps.ts`, `transients.ts` (with round 8's `SkyField.pinned`), `meteorKind.ts`, `radiants.ts` (signatures declared) and `meteors.ts` with P9's `Course`, `Steer` and `PlanOptions` (`steer`, `clearOf`, `fireball`, the veil's three fields kept as cf4d7b8 has them). TypeScript 6.0.3 with the repository's strict options and `noUncheckedIndexedAccess`; ESLint with `eslint-config-next` core-web-vitals and typescript plus the repository's overrides.
6. Confirmed no sky commit landed after cf4d7b8 (`git log cf4d7b8..master`, `origin/master`), so the baseline for every citation still holds.

## Round 8's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV8-1 | landed | The `PlanOptions` sketch keeps cf4d7b8's `/** What a plan may do. */` and elides the three veil fields "exactly as cf4d7b8 has them, docs included" (2574-2576); the probe rebuilt it with cf4d7b8's own field docs, including `ink`'s "0 leaves it nothing there, so no flight is aimed at copy.", and it compiles. |
| CONV8-2 | landed | P3's `FRAME` sentence says "Anything that moves" (964); the `ADAPT` drift-cap sentence is P6's (964, 3132); the idle docs say "ambient motion" and "nothing new launches" (1660), as do `presence.ts`'s two docs (1606-1618); `SkyMotion`'s `full` line grows from P5 to P8 (1957), and `protocol.ts` is in P6's, P7's and P8's files (3135, 3174, 3196) and 5.1 (334). |
| CONV8-3 | landed, with one regression | (1) P9 rewrites the fireballs' doc (2453) and P10's files move it onto `fireballSpeedScale` (3266). (2) `MeteorMemory` and `planMeteorTransient` no longer name `planLaunch` (2082-2104). (3) "scroll parallax" leaves the `LAYERS` doc's list, which gains a sentence (467, 319, 2999, 3379); the new `(:73)` at 467 is ambiguous (CONV9-3). The class of (2) survives in six other docs (CONV9-1). |
| CONV8-4 | landed | 8.4's row: "renamed `launches` ...; with farewell meteors, `launchScene` in its place, its doc naming the end bookend (6.12) \| P8, P12" (3378); 8.1 no longer names a checkpoint V (3343). |

## Round 8's revision and the restructure, through this lens

- **Nothing stale from the old split.** No PF, CP-0, CP-3 to CP-5, checkpoint V, integration branch, "observed" or 8.5 to 8.7 clause; "D10 and D11 went with the wait" (157) and "may be rebased onto master later" (7, the planning branch) are deliberate.
- **The re-grounded citations hold on cf4d7b8**, including round 8's new ones (`mountSky.ts:122-124`, `sky.worker.ts:221`, `config.ts:281`, `:313`, `Navbar.tsx:14`), except three bare `:N` references that round 8's edits left pointing at the wrong file (CONV9-3).
- **Round 8's new sketch text compiles and lints.** The probe's only type error is cf4d7b8's own `planMeteor(..., options: PlanOptions = {})` default (`meteors.ts:270`), which the sketch says P9 drops once `steer` is required (2585). ESLint: 0 errors; the only warnings are imports that the declared-only functions (`planMeteorTransient`, `pickVisitSky`, ...) read in bodies the plan doesn't sketch.
- **Three docs that round 8 wrote or moved go stale or run ahead of their phase** (CONV9-2): `LaunchGate.narrow`'s new doc, and the veil's `PassOptions`, `planFlight` and `copyReader` docs that P9's `fallback`, `clearOf` and P10's `fireball` change under them.

## Findings

### CONV9-1 (minor): seven more committed docs name what their own phase removes (CONV8-3 (2)'s class)

- **Section.** 6.4 (`QuietIndex.empty`), 6.2 (`frameDemand`), 6.9 (`holdTransients`, `retryTransients`), 6.10 (`SKY_WINDOW`, `METEOR_BRIGHTNESS`, `PlanOptions.steer`); 7.0's comment rules.
- **Problem.** Round 8 fixed CONV8-3 (2), docs naming `planLaunch`, which P8 deletes, but only in the two docs that finding listed. The same defect is in seven more sketch docs: each names, as present ("today's") or as what it replaces, a symbol or value that the same phase deletes, so on master it points at nothing:
  1. `QuietIndex.empty` (P1): "as today's quiet flag does": P1 replaces that flag (`renderSky.ts:107`) with `quietIndex.empty`.
  2. `frameDemand` (P3): "before P6 it reproduces today's frameMode exactly (H4)": P3 replaces `frameMode`; with the tags dropped the clause names a deleted function, and it is a test claim (H4) anyway.
  3. `holdTransients` (P8): "...: today's holdMeteors": P8 replaces `holdMeteors`.
  4. `retryTransients` (P8): "(today's retryMeteors, on every layout message)": P8 replaces `retryMeteors`.
  5. `SKY_WINDOW` (P9): "Today's nominal speed, 0.2 long sides a second, is 12°/s here": P9 removes `METEOR.speedShare`.
  6. `METEOR_BRIGHTNESS` (P9): "about 0.6 of today's 0.83": P9 removes `METEOR.peak`.
  7. `PlanOptions.steer` (P9): "in place of the radiant parameter and pickRadiant": P9 removes both.

  Round 5 ruled that change-relative wording alone is fine here (the code says "as before", `Navbar.tsx:69`, `fonts.ts:3`); the defect is the present-tense pointer to a name a reader on master would search for and not find.
- **Evidence.** PLAN.md 1409, 1046, 2162, 2173, 2359, 2432, 2577 (the docs); 1496 (P1's index replaces `renderSky.ts:107` and `:120`), 1190 (P3 replaces `frameMode`), 2332 (`holdMeteors` and `retryMeteors` become `holdTransients` and `retryTransients`), 2443 and 2445 (P9 removes `speedShare`, `peak`, the `radiant` parameter and `pickRadiant`); 2823 (7.0: "no wording about the planning process ... they say the reason in words"). REVIEW-LOG.md 314 (CONV8-3 (2) fixed for `planLaunch` only); `audit/conventions-gate-r5.md:72`. cf4d7b8 `renderSky.ts:107`, `sky.worker.ts:116-118`, `:408-412`, `config.ts:293`, `:307`, `meteors.ts:96`.
- **Fix.** Say the reason in words, without the removed name:
  1. "No zones on screen: drawLayer skips the lookup."
  2. "The strictest demand of every part of the sky this tick." (H4's identity with the old `frameMode` goes in P3's PR description.)
  3. "No launch for TRANSIENTS.afterReturn s after the visitor is back (to the tab, from idle, to full motion). `now` in seconds."
  4. "...retry after TRANSIENTS.retry; the worker calls it on every layout message. `now` in seconds."
  5. "A nominal speed of 0.2 long sides a second is 12°/s here, a medium meteor (IMO: 3 to 25°/s)."
  6. "about 0.6 of the earlier fixed peak (0.83 on average)", or the absolute mean, about 0.5.
  7. "Where shooting stars go from each start point: a Course, or null where none starts there."

### CONV9-2 (minor): docs that P8 to P10 leave stale or write early, which no phase lists

- **Section.** 6.10 (the list of rewritten docs, the `maxEndY` rewrite, the `meteors.ts` sketch); 6.9 (`LaunchGate.narrow`); P8's, P9's and P10's files; 8.4's `meteors.ts` and `mountSky.ts` rows; 7.0's committed-doc rule.
- **Problem.** 7.0: "A committed doc describes what its phase ships, and the phase that adds a kind or a constant extends the docs that name it." 6.10 lists every `METEOR` doc P9 rewrites, but three docs whose subject P9 or P10 changes are on no list, and 8.4's rule ("use them, extend them through options, never rewrite them") gives an implementer reason to leave a veil doc alone unless the plan says otherwise:
  1. **`PassOptions` and `planFlight`** (veil symbols). Their docs describe the fields P9 and P10 replace: `PassOptions`' "the duration range of its flights (s) and whether a fireball may fly", and `planFlight`'s "durations from `options.timing` (s), fireballs only if `options.fireballs`". P9 replaces `timing` with a `fallback` flag, and P10 replaces `fireballs` with `PlanOptions.fireball`.
  2. **`copyReader`'s caveat** (veil symbol). It says a hover color kept until the next measurement "is harmless only while no flight reaches the rails (METEOR.maxEndY)". Round 8's CA8-1 fix makes `planMeteor`'s `clearOf` the rails' guard, and P9's own `maxEndY` doc says "clear of the bottom corners; planMeteor's `clearOf` keeps them off the side rails' copy". From P9 the two committed docs name different guards for the same thing. The caveat itself still holds, as CA8-1's disposition says; only its pointer is stale.
  3. **`LaunchGate.narrow`** (new in round 8, DRY-R8-2): "phones keep their own limit and gaps". In P8 the meteor spec keeps today's gap law and ignores `narrow` (`nextAfter: ... nextMeteorGap(random, sinceReveal)`); phone gaps arrive with `METEOR_RATE.narrow` in P9. Untagged, so P8 commits it as written.
- **Evidence.**
  - PLAN.md 2444, 2589-2591, 3235 and 3269 (`timing` and `fireballs` replaced, no doc named); 2447-2456 (6.10's rewritten docs); 3374 (8.4's `meteors.ts` row); 3370 (8.4's rule).
  - PLAN.md 2452 (the new `maxEndY` doc), 2608 (`clearOf`'s reason, citing `mountSky.ts:122-124`), 3388 (8.4: "the measurement unchanged"); REVIEW-LOG.md 168 (CA8-1: "`copyReader`'s caveat then still holds").
  - PLAN.md 2133 (`LaunchGate.narrow`), 2110-2111 (P8's `nextAfter`), 2422-2425 (`METEOR_RATE.narrow`, P9), 2824 (7.0).
  - cf4d7b8 `meteors.ts:59` (`PassOptions` doc), `:185-190` (`planFlight` doc), `mountSky.ts:122-124` (`copyReader` caveat), `config.ts:281` (today's `maxEndY` doc).
- **Fix.**
  1. 6.10's list gains both docs: `PassOptions` in P9, "What one pass of the planner adds to the caller's options: whether it is the shorter fallback (the steer scales its durations by METEOR.fallbackScale) and whether a fireball may fly", P10 dropping the fireball clause; `planFlight` in P9, "...candidate paths steered by `options.steer`, shorter on the fallback pass, fireballs only if `options.fireballs`", P10 reading `options.fireball`. Name them in P9's and P10's `meteors.ts` lines and in 8.4's `meteors.ts` row.
  2. P9's files gain `mountSky.ts`: `copyReader`'s caveat names `planMeteor`'s `clearOf` beside `METEOR.maxEndY`, and 8.4's `mountSky.ts` row says "its doc's guard pointer (P9)". If the veil's doc should stay as committed, say so in 6.10 beside the `maxEndY` rewrite instead, since that doc now hands the rails to `clearOf`.
  3. P8 writes "phones keep their own limit"; P9's `transients.ts` line adds "and gaps" (or the sketch tags it "(P9)").

### CONV9-3 (minor): three bare `file:line` references that round 8's edits left pointing at the wrong file

- **Section.** 6.1 (the `LAYERS` doc edit); 6.10 ("I2 also completes the end test" and the `nearCopy: false` sentence).
- **Problem.** The plan's bare `:N` references read against the last file named before them, and the restructure made ambiguous ones explicit for that reason. Round 8's edits broke three:
  1. 467: "their only reader is `renderSky.ts:100`), and the `LAYERS` doc (`:73`)" reads as `renderSky.ts:73` (`SkyFrame.keep`'s doc), not `config.ts:73`. CONV8-3 (3)'s fix added it.
  2. 2608: CA8-1's fix inserted `mountSky.ts:122-124` before "(the `nearCopy: false` test, `:226-228`)", which now reads as `mountSky.ts:226-228` (`measureLayout`'s opening lines), not `meteors.ts:226-228`.
  3. 2620: "which is the test fireballs take today (`:226-228`)" resolved to `meteors.ts` in round 8's citation run; it now follows the same `mountSky.ts:122-124` with no file named between.
- **Evidence.** PLAN.md 467, 2608, 2620. Citation listing (`conventions-gate-r9/cites.txt`): `L467 renderSky.ts:73 (bare)`, `L2608` and `L2620 mountSky.ts:226-228 (bare)`; round 8's run had `meteors.ts:226-228 (bare)` and no `:73`. cf4d7b8 `config.ts:73` (the `LAYERS` doc), `renderSky.ts:73`, `meteors.ts:226-228` (the `near` filter and the fireball or `nearCopy: false` rejection), `mountSky.ts:226-228`. REVIEW-LOG.md 151 ("ambiguous bare refs made explicit").
- **Fix.** Write `config.ts:73` at 467 and `meteors.ts:226-228` at 2608 and 2620.

## What passes

- **Code style in all 41 sketches.** Tabs (except the markdown-nested `LEAN_POINTER_QUERY` block); no line-end semicolons; single quotes, with double quotes only on JSX attributes as in `Navbar.tsx`; no namespace imports, `any`, enums, classes, non-null assertions or `var`; no em or en dash anywhere in `PLAN.md` or `REVIEW-LOG.md`.
- **Imports.** Model files import their siblings by relative path, kind modules import `transients.ts` with a statement-level `import type`, and every mixed import keeps a value specifier beside its inline `type` ones; worker files import only `@/lib/sky/*` by file and each other; `skyPause.ts` reads `@/lib/utils` and nothing from `src/lib/sky`; `SkyPauseButton.tsx` imports the `@/components/icons` and `@/lib` barrels as `Navbar.tsx:7-8` does, and `./skyPause` as `SkyCanvas.tsx` imports `./mountSky`. Nothing new is used by `/links`.
- **Client boundary and components.** `SkyPauseButton` is a default export with a props interface, rendered by the client `Navbar.tsx`, so no directive; D1's Server Component hosts give the control's file the directive and keep `motion/react-client` or the hero's `StaggerItem`. The glyphs sit on `Icon` with no `title` (decorative), as default exports with named re-exports in the alphabetical barrel. `bg-green-tint`, `duration-250` and `forced-colors:` resolve against `globals.css` and Tailwind 4.
- **Config docs and names.** Every new config block, key and main-thread constant has a doc; units follow `config.ts:2-3` (`Ms` names, `stepDevicePx`, `meteorHeightKm`, degrees stated in the docs). New names follow the code's patterns (`*At`, `create*`, `step*`, `note*`, `*Wanted`, `*Transients`, `*SVG`) and collide with no name in `src/lib/sky` or the worker at cf4d7b8 (`pacing.ts`'s `easing` shares only a name with `animations.ts`'s curves, and no file can import both: the worker can't import `@/lib`, and main-thread sky code takes only types and `color.ts` from `src/lib/sky`).
- **Probe.** The config blocks and the `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `gaps.ts`, `transients.ts`, `meteorKind.ts`, `radiants.ts` and `meteors.ts` sketches compile on cf4d7b8 under TypeScript 6.0.3 (the one error is the `= {}` default P9 drops) and lint with 0 errors under the repository's rules.
- **Node 24 and TypeScript 6.0.** `module.registerHooks`, `--disable-warning` and type stripping are Node 24 features (`.nvmrc` 24, `engines.node` 24.x); `typescript` stays `~6.0.3`.
- **Process.** `npm run lint` and `npm run type-check` for every phase; `/_next/mcp` while `next dev` runs on our own `autoPort` server; the production smoke build with that server stopped; conventional commit forms (`feat(sky)`, `refactor(sky)`, `docs`) as in `git log`; the `motion` docs query before P5's entrance; no `.env` file, no Cache Components API, `data-sky-quiet` kept, and no POST to `/api/schedule/book`.
- **User-facing copy.** "Pause sky animation", "Play sky animation" and the `AGENTS.md` line read plainly, in sentence case, with no em dash.

## Summary

- **Verdict: pass.** No blocking or major findings in this lens. Round 8's four conventions fixes landed, and nothing stale from the old split remains.
- **Three minor findings,** each cheap and clearly right:
  - CONV9-1: seven more docs (one of them, `frameDemand`'s, a plan-tagged clause) name, as present, a symbol or value their own phase removes: the class round 8 fixed for `planLaunch` only.
  - CONV9-2: the veil's `PassOptions`, `planFlight` and `copyReader` docs go stale under P9 and P10, and round 8's `LaunchGate.narrow` doc names P9's phone gaps from P8; no phase lists them.
  - CONV9-3: three bare `file:line` references point at the wrong file after round 8's insertions (`:73` at 467, `:226-228` at 2608 and 2620).
