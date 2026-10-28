# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 11

Date: 2026-10-28. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 11. Verdict: **pass** (no blocking or major finding; one minor finding, NJ11-1).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 11. I confirm that round 10's one finding in this scope (NJ10-1) landed correctly, check round 10's revision (the reviser's fixes to all 19 of that round's findings) for regressions in this lens, then sweep `PLAN.md` again. The sweep covers every decision that touches Next.js, React, Motion, or the Node APIs the harnesses use:
  - the `'use client'` boundaries, and where the pause control's island lives;
  - what crosses the server and client boundary;
  - hydration safety of `localStorage` and `matchMedia`;
  - the Web Worker under Turbopack;
  - `next/script`, `next/font`, metadata and route-segment usage;
  - React Compiler implications for the plan's hooks and stores;
  - App Router conventions, and deprecated or changed 16.x APIs;
  - the `next dev` MCP endpoint, and the absence of Cache Components APIs.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, and `COORDINATION.md` in full. Its "Committed: cf4d7b8", "Landed in the working tree" and "Answers to the planning session's questions" sections are authoritative.
  - `PLAN.md`: 3,651 lines, 59,713 words, MD5 `8b2111ab…`, the same at the start and the end of the audit. Snapshot: `nextjs-gate-r11/PLAN.r11.md` in the session scratchpad.
  - `REVIEW-LOG.md`: "Round 10", "Gate round 10" and the earlier rows in this scope; `audit/nextjs-docs-gate-r10.md`.
  - The code baseline: the planning worktree's `src/`, which equals cf4d7b8 (`git diff cf4d7b8 HEAD -- src` is empty). The read-only `sky-baseline-cf4d7b8` checkout that earlier rounds used no longer exists, as section 1 now says.
  - Installed versions: Next.js 16.4.2 (docs and source in the main checkout's `node_modules`), React 19.3.1, Motion 12.38.0, TypeScript 6.0.3, ESLint 10.13.0, Node 24.14.0. Also react.dev, Motion's docs through the `motion` MCP server, and the Node v24 docs.
- **Outputs.** This file, and the same findings in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout, and no dev server was started or stopped.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r11/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed since round 10.** Round 10's audited snapshot (`nextjs-gate-r10/PLAN.r10.md`, MD5 `3e8adb43…`) is byte-identical to the reviser's `PLAN.before-r10.md`. `git diff --no-index` against today's text gives 46 hunks (81 lines in, 85 out). I read every hunk as a word diff; the ones that touch this lens are in the tables below.
2. **The sketches.** Round 10's extractor (`code.mjs`) over today's 6.6, 6.8 and 6.13 gives code byte-identical to round 10's (299 lines). The `skyPause.ts` and `SkyPauseButton.tsx` sketches equal the rig's copies apart from the file-name comment line, and 7.1's `register-hooks.mjs` equals the H12 copy.
3. **The rig, rerun** (`nextjs-gate-r11/rig`: round 10's rig, cf4d7b8's `mountSky.ts` and `protocol.ts` with P4's and P5's wiring, the P5 sketches, `Navbar.tsx` with 6.8's changes, the icons). Its `@/*` fallback now points at the planning worktree's `src/` (cf4d7b8), since the baseline checkout is gone.
   - **tsc** 6.0.3 with the repository's compiler options: exit 0.
   - **ESLint** 10.13.0 with eslint-config-next 16.4.2: 0 problems on `Navbar.tsx`, `SkyPauseButton.tsx`, `skyPause.ts`, `mountSky.ts`, `PauseSVG.tsx` and `PlaySVG.tsx`. A probe that reads `ref.current` during render gets three `react-hooks/refs` errors, so the React Compiler rules ran.
4. **H12 smoke, rerun on Node 24.14.0** (`nextjs-gate-r11/h12`), with 7.1's run line verbatim (`SKY_SRC=… node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./register-hooks.mjs h-pause.ts`): `null` before `setSkyRunning(true)`, `'playing'` by default, `'paused'` with `'1'` stored after a pause, both global listeners removed at the last unsubscribe, and a remount that reads storage and the reduced-motion setting afresh.
5. **Next.js docs reopened**, every line `PLAN.md` cites and the ones behind its unstated assumptions:
   - `03-api-reference/01-directives/use-client.md:10`; `01-getting-started/05-server-and-client-components.md:26`, `:178-188`; `02-guides/server-and-client-boundary.md:273` ("You only need `'use client'` at the entry to a client subtree, not on every file inside it");
   - `02-guides/preventing-flash-before-hydration.md:11`; `02-guides/single-page-applications.md:205-221`; `02-guides/preserving-ui-state.md:13-17`;
   - `03-api-reference/08-turbopack.md:130`, `:464`, `:470`, `:482`; `02-guides/scripts.md:128`;
   - `02-guides/mcp.md:50-61`, `:86-90`; `02-guides/testing/vitest.md:43-44`, `:68-71`, `:92-103`; `01-getting-started/01-installation.md:53-60`;
   - `05-config/01-next-config-js/reactStrictMode.md` (Strict Mode on by default with the App Router), `agentUpgrade.md` ("Reminder behavior"), `agentRules.md` (the managed `AGENTS.md` block) and `agentFeedback.md` (off by default; not set in `next.config.ts`).
6. **Node v24 docs.** `deprecations.md`, DEP0205 (documentation-only, v24.15.0): "`module.register()` is deprecated. Use `module.registerHooks()` instead." `typescript.md`: type stripping stable since v24.12.0, file extensions mandatory, the `type` keyword required on type imports, `.tsx` unsupported (no harness loads a `.tsx`).
7. **Motion and React.** `motion://docs/react/react-motion-config`: with `reducedMotion: "user"`, "transform and layout animations will be disabled. Other animations, like `opacity` and `backgroundColor`, will persist." react.dev, `useSyncExternalStore`: `getServerSnapshot` is used "only during server rendering and during hydration of server-rendered content on the client".
8. **Re-grounding** of every main-thread `file:line` in `PLAN.md` against cf4d7b8 (list below), plus the worker lines the hydration argument rests on.
9. **Lifecycle sweep.** Every main-thread resource the phases add, checked against `destroy` and App Router navigation: P4's listeners (`signal`), P5's subscription and running flag (`stopPlayback`, `setSkyRunning(false)`), P7's coalescing frame and P13's relay loop (both cancelled in `destroy`).

## Round 10's finding in this scope

| ID | Disposition in `REVIEW-LOG.md` | Where it landed | Verdict |
|---|---|---|---|
| NJ10-1 (minor) | P13's loop cancels its pending frame in `destroy`, as P7's does; 6.13, 5.1 and P13's files follow; P13's verification adds the `/links`, View Full Portfolio, Back trace | 6.13 (line 2779), 5.1's `mountSky.ts` row (338), P13's files (3324), P13's verification (3332) | Landed and right. cf4d7b8's `destroy` (`mountSky.ts:316-326`) terminates the worker, which can then never send `{ type: 'relay', on: false }`, so cancelling the pending main-thread frame there is the only stop, the same pattern as P7's (6.13 line 2790; P7's files, 3171). No regression. The verification sentence it added can pass without exercising the fix: NJ11-1. |

No earlier rejection in this scope exists to challenge (rounds 4 to 10 rejected nothing here).

## Round 10's revision through this lens

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| The planning branch has merged `origin/master` at cf4d7b8; `file:line` is read with `git show cf4d7b8:<path>` or the planning branch's `src/` | section 1 (lines 7, 17) | Right: `git diff cf4d7b8 HEAD -- src` is empty, and the removed baseline checkout's path appears nowhere in `PLAN.md`. |
| NJ10-1's fix | 6.13, 5.1, P13 | See above. |
| 7.0's rule on which phase extends which doc, now naming `SkyPauseButton` (CONV10-2) | 7.0 (2820) | Doc comments only: no effect on the client boundary, hydration or the bundle. A file-list drift it leaves is noted under "Outside this lens". |
| `meteorsAllowed` renamed `launchesAllowed`; the `reveal`, `motion` and `noteInput` docs (CONV10-1) | 6.9, P8, 5.1 | Worker only. |
| The comet's start rule over the launch gate, resize retirement, `twinkleTime` clock, `fading` term (SOC10-1) | 6.12, P12, AC-25 | Worker and model only. |
| Farewell meteors' band edge, `room`, `limit`, `kindLaunches`, `planMeteorTransient`'s second argument (CA10-1, CA10-2, DRY-R10-2, SOC10-2) | 6.9, 6.12, P12, T6 | Worker and model only. |
| The fallback's scaled minimum, `startArea` unclamped, `DEG` removed (PHY10-1, CG10-2, CG10-3) | 6.10, P9 | Model only. |
| `frameDue` at k = 1, `FrameState.transientDemand`'s doc (CG10-1, CONV10-2) | 6.2 | Worker only. |
| H2's and H5's kill-switch rows, H8's figures, P9's archive extraction (C71, C72, PHY10-1) | 7.1, P1, P2, P6, P7, P9 | Scratch harnesses; the Node run line and hook are unchanged and still work (Method 4). |

## Re-grounded references checked against cf4d7b8

- **`mountSky.ts`:** `:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:122-124`, `:202-206` (a fresh canvas per mount, so StrictMode's dev remount transfers a new one), `:211`, `:214`, `:217`, `:231`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
- **`Navbar.tsx`** (unchanged by cf4d7b8): `:1`, `:14`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`.
- **Other components:** `IntroGate.tsx:47` (the loader's 3 s timer), `:54`, `:74`, `:94-100`; `SkyCanvas.tsx:20-29`; `Background.tsx:9`; `page.tsx:31-32`; `Introduction.tsx` and `AppFooter.tsx` without a directive (D1 (a) and (b)); `PortfolioFooterLink.tsx:9-10` with `linksData.ts:54-58` (`href: '/'`); `not-found.tsx:16`; `utils.ts:20`; `animations.ts:36`; `MotionProvider.tsx:7`; `protocol.ts:32-38`; `README.md:75`, `:80`; `globals.css:17` (`--color-green-tint`, which `hover:bg-green-tint` needs).
- **The worker lines the hydration argument rests on:** `sky.worker.ts:337-339` (`ready` is posted on the first drawn frame, which follows `init`, which `mountSky`'s effect sends) and `:503-509` (a `motion` message before `init` only sets state, as today).
- **Configuration:** `next.config.ts` (`reactCompiler` on, no `cacheComponents`, a static CSP whose `script-src 'self'` admits the same-origin worker chunk); `tsconfig.json` (`isolatedModules`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, no `verbatimModuleSyntax`); `eslint.config.mjs:13`; `.claude/launch.json` (`autoPort: true` for `portfolio-dev` and `portfolio-prod`); `.mcp.json` (`next-devtools-mcp@0.4.0`, `motion`); `AGENTS.md` (the managed block between its markers, then "Project notes", where P5's line goes).

All hold.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| **The island.** `SkyPauseButton.tsx` has no directive and is rendered only by `Navbar.tsx` (`'use client'` at `:1`), which the Server Component page renders with no props (`page.tsx:32`). Under D1 (a) or (b) the control's own file gains the directive, the host stays a Server Component, and only `className`, a string, crosses. | `use-client.md:10`; `05-server-and-client-components.md:178-188`; `server-and-client-boundary.md:273` |
| **Browser APIs** run only inside functions on the client: nothing at module scope, `getSnapshot` reads storage and `matchMedia` only once `running` is true, and the server only ever calls `serverSkyPlayback`, so the store's module state is never written on the server (no state shared across requests). | `05-server-and-client-components.md:26`; the sketch (`PLAN.md:1726-1841`) |
| **Hydration.** Both snapshots are `null` at hydration: `running` turns true only on the worker's first drawn frame (`sky.worker.ts:337-339`), after `mountSky`'s effect. The visible navbar mounts fresh after IntroGate's key flip. No inline script, `next/dynamic`, `useEffect` gate or `use(browser())` is needed. | `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; react.dev; `IntroGate.tsx:94-100` |
| **A page view is one mount**: without Cache Components the home page unmounts on navigation (IntroGate even replays its loader), so the last unsubscribe resets the cached pause and any Play; StrictMode's dev remount ends in the same state. | `preserving-ui-state.md:13-17`; `reactStrictMode.md`; `next.config.ts` |
| **The Web Worker** under Turbopack: the entry is unchanged and model files join its chunk by static import; a production build per phase checks what dev doesn't (minify, mangle export names). | `08-turbopack.md:130`, `:464`, `:470`, `:482`; `mountSky.ts:84-85` |
| **No `next/script` worker strategy**; no `next/font`, metadata, route-segment config, Suspense, Activity or Cache Components API (the only matches are `scrollTo`'s `'instant'`, the plan's own `nextAfter`, and 5.4's reasons for not using `next/dynamic` or `use(browser())`). | `scripts.md:128`; grep of `PLAN.md`; `AGENTS.md` |
| **React Compiler.** The store's functions are module-level (no component or hook names), `getSnapshot` returns a string or `null`, and the header's ref is read only in the scroll callback; the P5 code passes the compiler's lint rules. | `next.config.ts` (`reactCompiler`); Method 3 |
| **`inert={mobileMenuOpen}` and `onFocus`** on Motion elements: React 19 takes the boolean and its `onFocus` bubbles (it listens for `focusin`); Motion forwards both; tsc accepts them. | Method 3; round 10's `filter-props.mjs` check (Motion unchanged at 12.38.0) |
| **Motion under reduced motion**: `MotionConfig reducedMotion="user"` keeps the control's entrance to an opacity fade, like the other nav items; 7.0 queries the `motion` docs before P5's entrance. | `MotionProvider.tsx:7`; Motion docs, MotionConfig |
| **The `next dev` MCP checks**: `get_errors` reads browser sessions with the page open, so a full reload of `/` comes first; `get_logs` names the log file; `compile_route` takes a path; `get_compilation_issues` needs no browser; `nextjs_call` takes `port`, `toolName` and `args`, omitted when a tool takes none. | `mcp.md:54`, `:55`, `:60-61`, `:88`; next-devtools-mcp's `nextjs_call` schema |
| **The upgrade-reminder rule** (7.0, line 2826): "the first eligible reminder stops the command with instructions to report the upgrade. Retrying the same command promptly continues the original task with a warning." | `agentUpgrade.md`, "Reminder behavior"; `AGENTS.md` |
| **P5's `AGENTS.md` line** sits under "Project notes", outside the managed markers, which `next dev` rewrites ("Next.js updates only the content between the markers and preserves the rest of the file"). | `agentRules.md`; `AGENTS.md` |
| **7.1's resolve hook, run line and harness rules** on Node 24. | `deprecations.md` (DEP0205); `typescript.md`; Method 4 |
| **D5's Vitest option**. | `testing/vitest.md:43-44`, `:68-71`, `:92-103` |

## Findings

### NJ11-1 (minor): P13's new navigation check can pass without the relay ever running

- **Section.** P13, Verification (line 3332).
- **Problem.** The check NJ10-1 added names no browser and no precondition: "After `/links`, View Full Portfolio, then Back, a main-thread trace on `/links` shows no relay frames." The bullet just above it says Chrome and Firefox never enable the relay, and the worker asks for it only while its clock is unaligned and a vsync demand exists. So in Chrome or Firefox, or in Safari when Back comes during IntroGate's 3 s loader or while the sky rests or is paused, the trace on `/links` shows no relay frames whether or not `destroy` cancels the loop. The check passes without testing the fix it was added for.
- **Evidence.**
  - `PLAN.md` P13: the worker "asks for the relay (`{ type: 'relay', on }`) while its clock is unaligned and a vsync demand exists" (line 3325); "Chrome and Firefox never enable it, because their clocks are aligned" (3331); the new check (3332) names neither Safari nor a running relay.
  - A client-side return to `/` replays the loader: IntroGate mounts fresh with a 3 s timer (`IntroGate.tsx:47`, `duration.loader` at `animations.ts:36`), and the drift, the vsync demand the relay serves, eases in only from the dusk (deviation 1, line 46). A resting, idle or paused sky draws no frames (F4, line 289; 2.2's pause and idle rows, lines 101 and 104).
  - The path under test: `SkyCanvas.tsx:25-28` calls `destroy` when the home page unmounts on Back, and cf4d7b8's `destroy` (`mountSky.ts:316-326`) terminates the worker, after which nothing but `destroy` can stop the loop.
- **Fix.** Reword the bullet: "In Safari (macOS or an iPhone): open `/links`, follow View Full Portfolio, and once the hero drifts and the main-thread trace shows relay frames, go Back; after the navigation the trace on `/links` shows none." One sentence; nothing else changes.

## Outside this lens (for the conventions and completeness reviewers)

- 7.0's doc rule (line 2820) has P6 add the drift to the `FRAME.motionEase` and `SkyPauseButton` docs, and P7 the lean to "those docs". P6's and P7's file lists (lines 3127-3135, 3166-3172) and 5.1's `config.ts` and `SkyPauseButton.tsx` rows (319, 340) don't name those edits, and the final sketches of both docs (lines 1680-1685, 1864-1869) name no lean. These are doc comments, so nothing in this lens changes; I raise no finding for it.

## Summary

- **Verdict: pass.** One minor finding (NJ11-1), no blocking or major one.
- **NJ10-1 landed** in all four places the log names (6.13, 5.1, P13's files and its verification), and it is right: P13's relay loop now stops in `destroy`, as P7's frame does.
- **Round 10's revision changed no main-thread code sketch**: the 6.6, 6.8 and 6.13 code is byte-identical to round 10's. Its other changes in this lens hold: section 1's baseline wording matches the tree (the planning branch's `src/` is cf4d7b8), and the rest is worker, model, harness or doc-comment text.
- **The P5 code still builds on cf4d7b8.** tsc is clean, ESLint is clean with the React Compiler rules active, and 7.1's hook runs the store, taken verbatim from today's plan, under Node 24.14 as H12 describes.
- **Every cited docs line still says what the plan says**: Next.js 16.4.2, react.dev, Motion and Node v24 (DEP0205, type stripping). No Cache Components, `next/script`, `next/font`, metadata or route-segment API appears.
- **NJ11-1** is a one-sentence fix in a conditional phase: run the navigation check in Safari with the relay running.

Scratch evidence is in `nextjs-gate-r11/` in the session scratchpad, not in the repository:

- `PLAN.r11.md`, the snapshot audited, and `diff-r10-r11.txt` and `wdiff.txt`, its line and word diffs from round 10's snapshot;
- `PLAN.r11.code.txt`: the extracted code of 6.6, 6.8 and 6.13 (identical to round 10's);
- `skyPause.plan.ts`, `SkyPauseButton.plan.tsx` and `register-hooks.plan.mjs`: today's sketches, compared with the rig and H12 copies;
- `rig/`: round 10's rig pointed at the planning worktree's `src/`, rerun with tsc and ESLint;
- `h12/`: 7.1's hook and the store with `h-pause.ts`, rerun on Node 24.14.0.
