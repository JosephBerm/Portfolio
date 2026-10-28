# Audit: codebase conventions (gate round 8)

Auditor for the "conventions" scope, 2026-10-27. Subject: `PLAN.md` after round 7's revisions and the post-commit restructure onto cf4d7b8 (3,664 lines).

## Scope

- **Role.** One of the four auditors (Next.js docs, conventions, DRY, separation of concerns), gate round 8. This one checks `PLAN.md`'s code sketches, file layout, naming and process against `AGENTS.md`, `CLAUDE.md`, `README.md` and the patterns the code actually uses, now at cf4d7b8. It confirms round 7's conventions fixes (CONV7-1 to CONV7-5), checks the restructure through this lens (anything stale from the old split, anything an implementer lost, every re-grounded `file:line`), then sweeps the rest of the plan.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree") and `research/01-planning-brief.md`.
  - All of `PLAN.md`; `audit/conventions-gate-r7.md`; `REVIEW-LOG.md` (round 7's rows and "Post-commit restructure (cf4d7b8)").
  - The code baseline, the read-only checkout of cf4d7b8 (`.claude/worktrees/sky-baseline-cf4d7b8`): `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `Introduction.tsx`, `AppFooter.tsx`, the icons and their barrel, the `src/lib` and `src/hooks` barrels, `utils.ts`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `next.config.ts`, `.claude/launch.json`, `.mcp.json`, `AGENTS.md`, `README.md` and `git log`.
  - The session scratchpad's `PLAN.before-restructure.md` and `PLAN.before-r7.md`, for the diffs; the Next.js 16.4.2 docs in the main checkout's `node_modules`.
- **Output.** This file, plus the same findings returned to the workflow.
- **Limits.**
  - Planning only: nothing in `PLAN.md`, `REVIEW-LOG.md`, either checkout's `src/` or configuration was edited. Probes and scripts live in the session scratchpad, `conventions-gate-r8/`. ESLint ran read-only on the baseline checkout (no `--fix`, no cache; `git status` clean before and after).
  - Physics, coordination, the Next.js docs, DRY and separation of concerns belong to other reviewers. They appear here only where they touch a convention.
  - Per the brief, only blocking or major problems are reported, plus minors that are cheap and clearly right.

## Method

1. Read the four scope documents, then `PLAN.md` end to end, then every baseline file the sketches extend.
2. Diffed `PLAN.before-restructure.md` against the current plan (1,036 diff lines; 19 changed lines sit in fenced blocks: three diagrams, the `quietIndex.ts` import and `ZONE_REACH`, three `file:line` comments, the `narrowScreen`, `MeteorMemory`, `planMeteorTransient` and `LaunchGate.ink` docs, the `meteors.ts` header and the `Course.peak` doc), and `PLAN.before-r7.md` against `PLAN.before-restructure.md` for round 7's fixes.
3. Re-ran round 7's block scanners over all 41 TypeScript, TSX and JavaScript blocks (indentation, semicolons, quotes, namespace imports, import paths, plan references and session wording in comments, doc comments on exports). Grepped for em and en dashes, British spellings, non-ASCII operators or quotes in code, and every term of the old split ("V", PF, CP-0, CP-3 to CP-5, D10, D11, 8.5 to 8.7, "hands-off", "integration branch", "rebase", "observed", "246c0aa").
4. Listed all 170 `file:line` citations beside the cited baseline lines (`cites.mjs`), and checked by hand the seven bare refs the script skips after a heading (`sky.worker.ts:154-209`, `:190-193`, `:186`, `:17-22`, `:475-479`, `:171-187`, `:513`). Spot-checked the cited Next.js doc lines (`use-client.md:10`, `05-server-and-client-components.md:178-188`, `08-turbopack.md:130`, `:482`, `mcp.md:54`, `:55`, `:88`, `scripts.md:128`, `preventing-flash-before-hydration.md:11`, `single-page-applications.md:205`, `testing/vitest.md:43-44`, `:68-71`, `:92-94`).
5. Built a probe from cf4d7b8's real `src/lib/sky` plus the plan's sketches, verbatim: every new config block (`DEPTH`, `CAMERA`, `DRIFT`, `PACING`, `STAR_PHASES`, `LEAN`, `TRANSIENTS` with P9's `longVisit`, `GapLaw`, `SKY_WINDOW` to `METEOR_BRIGHTNESS`, `SATELLITE`, `CLEAR_SKY_KEEPS`, `METEOR_KINDS`), `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts` (with `sameRects` moved into `scene.ts`), `gaps.ts`, `transients.ts` and `meteorKind.ts` (their body-less signatures declared). TypeScript 6.0.3 with the repository's strict options and `noUncheckedIndexedAccess`: exit 0. ESLint with `eslint-config-next` core-web-vitals and typescript plus the repository's overrides, on everything but the two declared files: 0 problems (a canary file with a namespace import and an unused `let` confirmed the rules run).
6. Linted the baseline checkout with the main checkout's ESLint: 0 problems, so P0's "lint must be clean before any change" holds at cf4d7b8.
7. Compared each sketch of a veil symbol with cf4d7b8's text, and each committed-doc edit with the phase that ships what the doc names (7.0's rule).

## Round 7's conventions dispositions: verified

| ID | Verdict | Where it landed |
|---|---|---|
| CONV7-1 | landed | 6.2's table row: "`transientDemand(transients, t)` in the transient line \| today's meteor line (as written) \| P8" (1233). |
| CONV7-2 | landed | 7.0: "a P12 kind that ships without P11 adds `CLEAR_SKY_KEEPS` itself" (2829); 7.2's P12 row: "`CLEAR_SKY_KEEPS` from P11, or its own (7.0)" (2942); P11's rollback keeps the constant "if a P12 kind reads it" (3310). |
| CONV7-3 | landed, then partly lost in the restructure | 6.12's farewell row names `SceneLevels.launchScene` and `SCENE.endLaunchLevel` (2758); P12's farewell files add `scene.ts` and the `SCENE` key (3316); 5.1's `config.ts` and `scene.ts` rows add P12 (319, 321). The 8.6 row that also carried it became 8.4's `SceneLevels.meteors` row, which dropped P12 (CONV8-4). |
| CONV7-4 | landed; moot after the restructure | `gather` was added to 8.6's `frameAt` row and CP-0's list. Both went with the restructure, since no rebase is left to plan, and the call stays where an implementer needs it: 6.1 (889) and P6's files (3142). |
| CONV7-5 | landed | No sketch comment says "centre"; the eight left are plan prose, which the disposition kept. |

## The restructure, through this lens

- **Nothing stale from the old split** in `PLAN.md`: no "V", PF, CP-0, CP-3 to CP-5, D10 or D11 clause, no "integration branch", "hands-off", "rebase" or "observed"; section 3 says why D10 and D11 are gone. 8.1's "What the old checkpoint V did" is the one leftover name (CONV8-4).
- **Every re-grounded `file:line` checks out on cf4d7b8** (the 170 listed and the 7 the script skips): the moved worker lines (`init` 467-493, `motion` 503-509, `visible` 510-524, `frameAt` 305-326, `schedule` 171-187, `updateMeteor` 212-238, `planLaunch` 246-261, `stepDown` 354), `planFlight`'s inner `fit` (`meteors.ts:195-236`), `mountSky.ts` (`:3`, `:17-27`, `:52`, `:84-85`, `:92-97`, `:211`, `:214`, `:310-314`, `:316-326`, `:328-335`, `:332`), `renderSky.ts` (`:38-39`, `:48`, `:64`, `:71-72`, `:93`, `:100`, `:107`, `:113`, `:120-127`, `:155`, `:237`) and `config.ts` (`:58-59`, `:78-80`, `:170-171`, `:222-237`, `:247-250`, `:253`, `:262-271`, `:266`, `:286-290`, `:299`, `:305`, `:321`).
- **What an implementer needs survived.** The `rafId`, `timerId` and `noteInput` names the `scroll` handler reads stay pinned (6.2, 6.6); the `sameRects` move keeps `headroom` (P1, 8.4); the kill-switch identity, the crossing measurement and the veil's own checks moved into P1, P9 and the phases (8.1); the `LAYERS` edit moved to P2 with the rest of P2's config. One sketch still carries pre-commit text for a veil symbol (CONV8-1), and one row lost a phase (CONV8-4).
- **Process.** 7.0's branch, worktree, PR and log rules fit cf4d7b8's setup: `.claude/launch.json` has `autoPort: true` for both previews, `eslint.config.mjs` ignores `.claude/worktrees/**`, and the commit forms match `git log` (`feat(sky): ...` at cf4d7b8). The `motion` docs query, the `/_next/mcp` checks, the production smoke build with our own server stopped and "never POST to `/api/schedule/book`" all stay.

## Findings

### CONV8-1 (minor): 6.10's `PlanOptions` sketch rewrites two cf4d7b8 docs it means to keep

- **Section.** 6.10, "What the veil planner accepts" (the `meteors.ts` sketch); 8.4 (the rule); 7.0.
- **Problem.** The sketch is headed "their options, then ours" and shows the veil's three fields, but its docs are the pre-commit ones, not cf4d7b8's:
  - the interface doc "What a plan may do." becomes "What one launch allows: the veil commit's options, then ours.", which 7.0's comment rule then strips to "What one launch allows";
  - `ink`'s doc loses cf4d7b8's sentence "0 leaves it nothing there, so no flight is aimed at copy.", the reason `planFlight` aims only when `ink > 0`.
  The restructure re-grounded every `file:line` on cf4d7b8 but kept this sketch's text. Copied into P9, it rewrites a veil symbol's docs, against 8.4's "use them, extend them through options, never rewrite them".
- **Evidence.** PLAN.md 2576-2583 (sketch), 2821 (7.0: "Veil symbols follow 8.4's rule"), 3377 (8.4's rule). cf4d7b8 `meteors.ts:49-57` (`/** What a plan may do. */` and the full `ink` doc), `:260` (`const aims = plain && copyAllowed && ink > 0 && ...`).
- **Fix.** Show the veil's part exactly as cf4d7b8 has it (its interface doc and the three field docs, without "(theirs)"), or elide it ("// …nearCopy, flights and ink as cf4d7b8 has them…") and sketch only `steer` and `fireball` with their docs.

### CONV8-2 (minor): doc edits that P3, P4 and P5 commit name the drift, the lean or transients, which ship in P6 to P8

- **Section.** 6.2 (the `FRAME` and `ADAPT` doc additions, P3); 6.6 (the `FRAME` idle docs, P4); 6.8 and 6.13 (the `SkyMotion` doc, P5); 7.0 (the committed-doc rule); 7.3 (the file lists of P3 to P8).
- **Problem.** 7.0 says "A committed doc describes what its phase ships, and the phase that adds a kind or a constant extends the docs that name it". Four doc edits break that, and the phases that ship what they name don't list the doc:
  1. P3's `FRAME` doc gains "Motion (the drift, a shooting star, scrolling) draws on animation frames paced by PACING": the drift arrives in P6.
  2. P3's `ADAPT` doc gains "step 1 also caps the drift at PACING.slowMaxFps", but the cap line is `Infinity` until P6 (6.2's table), so from P3 to P5 the doc states a cap that isn't applied.
  3. P4 writes `FRAME.idleSleepMs`'s doc as "...the twinkle and the drift ease out, transients pause..." and `idleFadeMs`'s as "twinkle and drift fade out...": the drift is P6's and transients are P8's, and neither P6's nor P8's file list carries these docs.
  4. 6.13's `SkyMotion` sketch has `full` say "twinkle, drift, scroll parallax and its glide, pointer lean and transients", but 6.8 gives P5 only the `reduced` line, 5.1 gives the doc to P5 alone, and no later phase lists it (P6 and P8 have no `protocol.ts` entry; P7's is `pointer` only). Either P5 writes P6 to P8's features into it, or nobody does and cf4d7b8's "twinkle, scroll parallax and shooting stars" stays, missing the drift and the lean that `reduced` stops.
- **Evidence.** PLAN.md 964 (both P3 additions), 1229 (the cap line `Infinity` before P6), 1660 (the idle docs), 1966 (6.8: the `reduced` line), 2774 (6.13's `full` line), 2829 (7.0's rule), 334 (5.1's `protocol.ts` row), 3041 (P3's files), 3079 (P4's files), 3103 (P5's files), 3136-3143 (P6's files), 3175-3180 (P7's files), 3199-3211 (P8's files). cf4d7b8 `config.ts:222`, `:233-236`, `:239-245`; `protocol.ts:32-38`.
- **Fix.** P3's addition says what P3 ships ("Motion (a shooting star, scrolling and its glide) draws on animation frames paced by PACING; ..."), and the `ADAPT` sentence moves to P6, which already edits that doc for `thinFade`. P4 writes "the twinkle eases out, shooting stars pause" and "Twinkle fades out and back in around the idle sleep"; P6 adds the drift and P8 says "transients" (add the idle docs to both file lists). For `SkyMotion`, say P5 writes the `reduced` line and `full` as of P5 ("twinkle, scroll parallax and its glide, and shooting stars"), and P6, P7 and P8 add the drift, the lean and "transients" (`protocol.ts` in P6's and P8's files).

### CONV8-3 (minor): three committed docs go stale or read wrong as written, and no phase lists the fix

- **Section.** 6.10 (the `METEOR` inner docs), P10's files; 6.9 (`MeteorMemory`, `planMeteorTransient`), P8 step 3; 6.1, 5.1 and P2's files (the `LAYERS` doc).
- **Problem.**
  1. `METEOR`'s fireball doc says "Fireballs (rare, long flights only): longer, slower and brighter, with more drag, a longer wake and a warm tint." From P9, fast fireballs cool to mint (6.10's tint table), and P10 removes `fireballChance`, the key the doc sits on, with `fireballDuration`. 6.10's list of rewritten `METEOR` docs and P10's files skip it, so P10 either deletes the doc with its key (leaving `fireballSpeedScale`, `fireballDrag` and `fireballWake` with no doc, against the doc-on-every-config-constant rule) or keeps a stale one.
  2. The P8 docs of `MeteorMemory` ("the sticky radiant, as planLaunch keeps it") and `planMeteorTransient` ("planLaunch, ported in its order", "as planLaunch drops a failed radiant") name `planLaunch`, which P8 step 3 deletes from the worker: the committed docs point at a function that no longer exists.
  3. 6.1 says the `LAYERS` doc's "scroll parallax" "becomes 'how far each star moves comes from its magnitude (DEPTH)'". In cf4d7b8 "scroll parallax" is an item in the first sentence's list, so the substitution reads "magnitude bands, how far each star moves comes from its magnitude (DEPTH), twinkle and how much light each keeps behind quiet copy". 5.1 and P2's files instead call it a "parallax sentence" that is removed (the restructure's wording; before it, 5.1 said the doc was "rewritten").
- **Evidence.** PLAN.md 2451-2456 (P9's rewritten `METEOR` docs), 2634 (fast fireballs cool to mint), 3267 (P10's `config.ts` line), 2088 and 2102-2109 (the `planLaunch` mentions), 3215 (P8 step 3, the worker swap), 467 (6.1), 319 (5.1), 3004 (P2's files). cf4d7b8 `config.ts:313-318` (the fireball doc and keys), `:72-76` (the `LAYERS` doc); `sky.worker.ts:246-261` (`planLaunch`). `PLAN.before-restructure.md` 342 (5.1 "the `LAYERS` doc rewritten").
- **Fix.**
  1. P9's list gains the fireball line (for example "...more drag and a longer wake; slow and medium ones warm, fast ones mint"), and P10's files move the doc onto `fireballSpeedScale` ("how much slower fireballs fly, with more drag and a longer wake; their odds and timing are METEOR_KINDS.fireball").
  2. Say "in this order", "the sticky radiant" and "drops a failed radiant" without the function name.
  3. 6.1, 5.1 and P2: "'scroll parallax' leaves the first sentence's list, and the doc gains 'How far each star moves comes from its magnitude (DEPTH).'"

### CONV8-4 (minor): 8.4's `SceneLevels.meteors` row lost P12's change in the restructure, and 8.1 still names "the old checkpoint V"

- **Section.** 8.4 (the `scene.ts` `SceneLevels.meteors` row); 8.1.
- **Problem.** CONV7-3's fix put P12's `launchScene` into 5.1's and 8.6's `scene.ts` rows. The restructure replaced 8.6 with 8.4, whose row for the veil's `SceneLevels.meteors` now reads only "renamed `launches`, its doc keeping the veil's wording (6.7) | P8". With farewell meteors, P12 turns that field into a scene name (`SceneLevels.launchScene`, 6.12, P12's files): a further change to a veil symbol that 8.4, the plan's one list of them under "never rewrite them", no longer shows. Separately, 8.1 opens a list with "What the old checkpoint V did now lives in the phases", a checkpoint this plan no longer defines.
- **Evidence.** PLAN.md 3385 (8.4's row), 2758 (6.12), 3316 (P12's files), 321 (5.1 keeps P12), 3346 (8.1). `PLAN.before-restructure.md` 3502 (8.6's row: "`launches` (P8), `launchScene` (P12, farewell)"). `COORDINATION.md`, answer 1 ("the `SceneLevels.meteors` doc" is on the veil's list).
- **Fix.** 8.4's row: "renamed `launches`, its doc keeping the veil's wording (6.7); with farewell meteors, `launchScene` in its place (6.12) | P8, P12". 8.1: "The checks that used to wait for the veil commit now live in the phases:".

## What passes

- **Code style in all 41 sketches.** Tabs (except the markdown-nested `LEAN_POINTER_QUERY` block); no line-end semicolons; single quotes, with double quotes only on JSX attributes as in `Navbar.tsx`; no namespace imports, `any`, non-null assertions, enums or classes; no em or en dash anywhere in `PLAN.md` or `REVIEW-LOG.md`, and no non-ASCII operator or quote in code.
- **Plan references in sketch comments** (64 tags, 8 `file:line`, 7 session-wording lines) all fall under 7.0's rule that committed comments drop them or say the reason in words.
- **Docs.** Every new export, config block, config key and main-thread constant has a doc comment; the three declarations the doc scan flags (`Star`, `planMeteor`, `SkyMainMessage`) are existing ones shown in part. Every new config key follows `config.ts:2-3`'s unit rule (seconds unless the name ends in `Ms`; `stepDevicePx`, `meteorHeightKm`, `earthRadiusKm` say their units).
- **Imports.** Model files import their siblings by relative path, and kind modules import `transients.ts` with a statement-level `import type`; worker files import only `@/lib/sky/*` by file; `skyPause.ts` reads `@/lib/utils` and nothing from `src/lib/sky`, as `mountSky.ts:3` does; `SkyPauseButton.tsx` imports the `@/components/icons` and `@/lib` barrels, as `Navbar.tsx:7-8` does, and `./skyPause` as `SkyCanvas.tsx` imports `./mountSky`. Nothing here is used by `/links`.
- **Client boundary.** The control is a default export with a props interface, rendered by the client `Navbar.tsx`, so it needs no directive; D1's Server Component hosts give the control's own file the directive and keep `motion/react-client` (`AppFooter.tsx:1`) or the hero's `StaggerItem` (`Introduction.tsx:4`).
- **Names.** No collision with cf4d7b8's exports or the worker's module-level names (its private `CLEAR_SKY` in `meteors.ts` is unexported). New names follow `create*`, `step*`, `*At`, `note*`, `*Wanted`, `*Transients` and `*SVG`; the icons join the alphabetical barrel as named re-exports.
- **Probes.** The config blocks and the `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `gaps.ts`, `transients.ts` and `meteorKind.ts` sketches compile on cf4d7b8 under TypeScript 6.0.3, and lint clean under the repository's ESLint rules.
- **Node 24 and TypeScript 6.0.** `module.registerHooks`, `--disable-warning` and type stripping are v24 features the harness uses within the AGENTS.md limit; nothing needs a newer Node.
- **Process.** `npm run lint` and `npm run type-check` for every phase (7.0, each phase's verification); `/_next/mcp` while `next dev` runs; the production smoke build; conventional commit forms; the `motion` docs query before P5's entrance; no `.env` file, no Cache Components API, `data-sky-quiet` kept, and no POST to `/api/schedule/book`.
- **User-facing copy.** "Pause sky animation" and "Play sky animation", and the `AGENTS.md` line, read plainly, in sentence case, with no em dash.

## Summary

- **Verdict: pass.** No blocking or major findings in this lens. Round 7's five conventions fixes landed; CONV7-3's 8.6 row was lost when the restructure rebuilt section 8 (CONV8-4), and CONV7-4's lists went with the rebase they served. The restructure left nothing stale from the old split, and every re-grounded `file:line` holds on cf4d7b8.
- **Four minor findings,** each cheap and clearly right:
  - CONV8-1: the `PlanOptions` sketch still carries pre-commit docs for the veil's fields, so copying it would rewrite cf4d7b8's interface doc and drop a sentence of `ink`'s.
  - CONV8-2: P3's `FRAME` and `ADAPT` additions, P4's idle docs and 6.13's `SkyMotion` `full` line name the drift, the lean or transients before P6 to P8 ship them, and those phases don't list the docs.
  - CONV8-3: `METEOR`'s fireball doc goes wrong in P9 and loses its key in P10; the P8 docs name `planLaunch`, which P8 deletes; and the `LAYERS` doc edit reads ungrammatically as written.
  - CONV8-4: 8.4's `SceneLevels.meteors` row dropped P12's `launchScene`, and 8.1 still says "the old checkpoint V".
