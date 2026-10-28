# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 12

Date: 2026-10-28. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 12. Verdict: **pass** (no blocking or major finding; one minor finding, NJ12-1).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 12. I confirm that round 11's one finding in this scope (NJ11-1) landed correctly, check round 11's revision (the reviser's fixes to that round's 16 findings) for regressions in this lens, then sweep `PLAN.md` again. The sweep covers every decision that touches Next.js, React, Motion, or the Node APIs the harnesses use:
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
  - `PLAN.md`: 3,657 lines, 60,054 words, MD5 `f6099ae3…`, the same at the start and the end of the audit. Snapshot: `nextjs-gate-r12/PLAN.r12.md` in the session scratchpad.
  - `REVIEW-LOG.md`: "Round 11", "Gate round 11" and the earlier rows in this scope; `audit/nextjs-docs-gate-r11.md`.
  - The code baseline: the planning worktree's `src/`, which equals cf4d7b8 (`git diff cf4d7b8 HEAD -- src` is empty), and no sky commit follows cf4d7b8 on `master` or `origin/master`.
  - Installed versions (unchanged since round 11): Next.js 16.4.2 (docs and source in the main checkout's `node_modules`), React 19.3.1, Motion 12.38.0 (motion-dom 12.38.0), TypeScript 6.0.3, ESLint 10.13.0, eslint-config-next 16.4.2, babel-plugin-react-compiler 1.0.0, Node 24.14.0. Also react.dev, Motion's docs through the `motion` MCP server, and the Node v24 docs.
- **Outputs.** This file, and the same findings in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout, and no dev server was started or stopped.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r12/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed since round 11.** Round 11's audited snapshot (`nextjs-gate-r11/PLAN.r11.md`, MD5 `8b2111ab…`) is byte-identical to the reviser's `PLAN.before-r11.md`. `git diff --no-index` against today's text gives 36 hunks (87 lines in, 81 out). I read every hunk as a word diff; the ones that touch this lens are in the tables below.
2. **The sketches.** Round 10's extractor (`code.mjs`) over today's 6.6, 6.8 and 6.13 gives 299 lines, which differ from round 11's only in two doc comments: `FRAME.motionEase` ("ambient motion eases out or in") and `SkyPauseButton` ("stops all of the sky's motion, as reduced motion does"). The `skyPause.ts` sketch (lines 1727-1842) and 7.1's `register-hooks.mjs` (2857-2873) are byte-identical to round 11's copies.
3. **The rig, rerun** (`nextjs-gate-r12/rig`: round 11's rig, cf4d7b8's `mountSky.ts` and `protocol.ts` with P4's and P5's wiring, the P5 sketches with today's `SkyPauseButton.tsx`, `Navbar.tsx` with 6.8's changes, the icons):
   - **tsc** 6.0.3 with the repository's compiler options: exit 0.
   - **ESLint** 10.13.0 with eslint-config-next 16.4.2: 0 problems on `Navbar.tsx`, `SkyPauseButton.tsx`, `skyPause.ts`, `mountSky.ts`, `PauseSVG.tsx` and `PlaySVG.tsx`. A probe that reads `ref.current` during render gets "Cannot access refs during render", so the React Compiler rules ran.
4. **H12 smoke, rerun on Node 24.14.0** (`nextjs-gate-r12/h12`) with 7.1's run line verbatim: `null` before `setSkyRunning(true)`, `'playing'` by default, `'paused'` with `'1'` stored after a pause, both global listeners removed at the last unsubscribe, and a remount that reads storage and the reduced-motion setting afresh.
5. **Two new Node checks** for claims round 11 added or relies on:
   - `nextjs-gate-r12/wrap`: P10's "7.1's resolve hook can wrap `./meteors`". 7.1's hook plus one redirect (`./meteors` from any importer but the wrapper resolves to a recording module that re-exports the real file by URL and wraps `planMeteor`) records `[{"fireball":true,"flights":"long"}]` from a stand-in `meteorKind.ts`. The redirect returns `shortCircuit: true`, which Node requires of a hook that doesn't call `nextResolve` (`module.md`, "A hook that returns without calling `next<hookName>()` _and_ without returning `shortCircuit: true` also triggers an exception").
   - `nextjs-gate-r12/query`: 7.1's "a fresh worker per case, imported with a distinct query string". Through the same hook, `./counter.ts?case=1` and `?case=2` load as two module instances (two loads, separate state).
6. **Next.js docs reopened**, every line `PLAN.md` cites, each line number checked with `sed`:
   - `01-app/03-api-reference/01-directives/use-client.md:10`; `01-app/01-getting-started/05-server-and-client-components.md:26`, `:178-188`;
   - `01-app/02-guides/preventing-flash-before-hydration.md:11`; `01-app/02-guides/single-page-applications.md:205-221`; `01-app/02-guides/preserving-ui-state.md:13-17` (assumes Cache Components);
   - `01-app/03-api-reference/08-turbopack.md:130`, `:464`, `:470`, `:482`; `01-app/02-guides/scripts.md:128`;
   - `01-app/02-guides/mcp.md:54`, `:55`, `:60-61`, `:88`; `01-app/02-guides/testing/vitest.md:43-44`, `:68-71`, `:92-103`;
   - `05-config/01-next-config-js/agentRules.md` (the managed `AGENTS.md` block).
   - I also scanned the guides added in 16.x that the plan doesn't cite (`interactive-apps.md`, `view-transitions.md`, `instant-navigation.md`): none bears on a decision here.
7. **Node v24 docs** (`https://nodejs.org/docs/latest-v24.x/api/module.md`): `module.register()` is "Stability: 0 - Deprecated: Use `module.registerHooks()` instead" (deprecated v24.15.0); `module.registerHooks()` was added in v23.5.0 and v22.15.0 and is a release candidate since v24.13.1, so it runs on the installed 24.14.0.
8. **Motion and React.** `motion://docs/react/react-motion-config`: with `reducedMotion: "user"`, "transform and layout animations will be disabled. Other animations, like `opacity` and `backgroundColor`, will persist." `motion://docs/react/react-motion-component`: `custom` passes data to dynamic variants, as the navbar stagger uses it. react.dev, `useSyncExternalStore`: `getServerSnapshot` "will be used only during server rendering and during hydration of server-rendered content on the client"; a `subscribe` declared outside the component is never re-subscribed; a store mutated during a non-blocking Transition falls back to a blocking update.
9. **Re-grounding** of the main-thread `file:line` references against cf4d7b8 (list below).

## Round 11's finding in this scope

| ID | Disposition in `REVIEW-LOG.md` | Where it landed | Verdict |
|---|---|---|---|
| NJ11-1 (minor) | P13's navigation check runs in Safari (macOS or an iPhone) and goes Back only once the relay runs, so it exercises `destroy`'s cancel | P13, Verification (line 3338): "In Safari (macOS or an iPhone): open `/links`, follow View Full Portfolio, and once the hero drifts and the main-thread trace shows relay frames, go Back; after the navigation the trace on `/links` shows none." | Landed verbatim and right. The precondition now guarantees a running relay (the worker asks for it only on WebKit's unaligned clock while a vsync demand exists, line 3331, and the drift is that demand). View Full Portfolio is a `next/link` (`PortfolioFooterLink.tsx:1`, `:9-14`, `href: '/'` at `linksData.ts:57`), so the trip and the Back are App Router navigations in one document: the home page unmounts, `SkyCanvas.tsx:25-28` calls `destroy`, and only `destroy` can stop the loop, since cf4d7b8's `destroy` terminates the worker (`mountSky.ts:316-326`). No regression: the bullet's neighbors (3335-3337) and P13's checklist are unchanged. |

No earlier rejection in this scope exists to challenge (rounds 4 to 11 rejected nothing here).

## Round 11's revision through this lens

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| NJ11-1's fix | P13 (3338) | See above. |
| `SkyPauseButton`'s doc: "stops all of the sky's motion, as reduced motion does, and starts it again from where it stopped" (DRY-R11-2) | 6.8 (1865-1870) | A doc comment only: the rig's tsc and ESLint stay clean with it. It is true from P5 on, since a pause is `motion: 'reduced'` (PB3), and 7.0's P6 entry (2826) no longer edits it, which closes round 11's "Outside this lens" note. |
| `FRAME.motionEase`'s doc: "ambient motion eases out or in" (DRY-R11-2) | 6.6 (1680-1687) | Worker config; no client impact. |
| P10's decision step and its H7 assertion on recorded `planMeteor` calls, "7.1's resolve hook can wrap `./meteors`" (CG11-1) | P10, Verification (3288) | Feasible on Node 24.14 with `registerHooks` (Method 5). Not a finding: P10 leaves the redirect's form to the implementer, and Node's own error names the missing `shortCircuit: true`. |
| H7's scene and `limit` clauses, farewell rows, AC-20 and AC-37 (CA11-2, PHY11-2) | 7.1 (2901), 9.2 | Harness and model only. |
| The camera docs drop the pause and Play (CONV11-1), `PACING`'s drift caps and `driftCap` move to P6 (CONV11-2), doc rewraps (CONV11-3) | 6.1, 6.2, 5.1, P3, P6 | Worker and model only. |
| P9's harness bullet takes `launch` from the archived `code-logic/lib.mjs` (CG11-2, C73) | P9 (3258) | Scratch harness outside the repository; nothing in the Next.js build or the client bundle. |
| T3, I9, 6.12, 8.3 rewording (CA11-1) | 4.3, 6.12, 8.3 | Model and coordination text. |

## Re-grounded references checked against cf4d7b8

- **`mountSky.ts`:** `:1-5` (Motion's `scroll`, the `REDUCED_MOTION_QUERY` import at `:3`), `:17-27`, `:40-41`, `:52`, `:84-85`, `:202-206`, `:207`, `:211`, `:214`, `:245-273` (`init` posts `motion: motion()` at `:264`), `:301-308`, `:310-314`, `:316-326`, `:328-335` (`else destroy()` at `:332`), `:337`.
- **`Navbar.tsx`:** `:1`, `:14-18`, `:28-32`, `:48-50`, `:52-53`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`, `:152-161` (the Resume item at `NAV_SECTIONS.length * NAV_STAGGER`).
- **Other components:** `IntroGate.tsx:1`, `:47`, `:54`, `:74`, `:94-100`; `SkyCanvas.tsx:1`, `:20-29`; `Background.tsx:9`; `page.tsx:20-22` (the only metadata, untouched), `:31-32`; `Introduction.tsx` (no directive; `StaggerItem` from `@/components/motion`, whose `RevealItem.tsx` is `'use client'`) and `AppFooter.tsx:1` (`footer as MotionFooter` from `motion/react-client`), for D1 (a) and (b); `PortfolioFooterLink.tsx:1`, `:9-14`; `MotionProvider.tsx:7`; `utils.ts:20`; `animations.ts:36`; `protocol.ts:32-38`, `:76`.
- **The worker lines the hydration argument rests on:** `sky.worker.ts:337-339` (`ready` on the first drawn frame, after `init`) and `:503-509` (a `motion` message before `init` only sets state).
- **Configuration:** `next.config.ts` (`reactCompiler` with `enablePreserveExistingMemoizationGuarantees`, no `cacheComponents`, a static CSP whose `script-src 'self'` admits the same-origin worker chunk and whose `style-src 'unsafe-inline'` admits Motion's inline styles); `eslint.config.mjs:10`, `:13`; `.claude/launch.json` (`autoPort: true` for both servers); `.mcp.json` (`next-devtools-mcp@0.4.0`, `motion`); `AGENTS.md` (the managed block at lines 1-9, then "Project notes", where P5's line goes after line 20).

All hold.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| **The island.** `SkyPauseButton.tsx` has no directive and is rendered only by `Navbar.tsx` (`'use client'` at `:1`), which the Server Component page renders as IntroGate's child with no props (`page.tsx:31-32`). Under D1 (a) or (b) the control's own file gains the directive, the host stays a Server Component, and only `className`, a string, crosses. | `use-client.md:10`; `05-server-and-client-components.md:178-188` |
| **Browser APIs** run only inside functions on the client: nothing at module scope, `skyPlayback` reads storage and `matchMedia` only once `running` is true, and the server only ever calls `serverSkyPlayback`, so the store's module state is never written on the server. | `05-server-and-client-components.md:26`; the sketch (1727-1842) |
| **Hydration.** Both snapshots are `null` at hydration (`running` turns true only on the worker's first drawn frame, after `mountSky`'s effect), and React re-renders after hydration rather than erroring if they ever differ. The visible navbar mounts fresh after IntroGate's key flip. No inline script, `next/dynamic`, `useEffect` gate or `use(browser())` is needed. | `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; react.dev; `IntroGate.tsx:94-100`; `sky.worker.ts:337-339` |
| **A page view is one mount**: without Cache Components the home page unmounts on navigation (IntroGate even replays its loader), so the last unsubscribe resets the cached pause and any Play; StrictMode's dev remount ends in the same state. | `preserving-ui-state.md:13-17` (the Activity behavior needs `cacheComponents`); `next.config.ts` |
| **The Web Worker** under Turbopack: the entry is unchanged and model files join its chunk by static import; a production build per phase checks what dev doesn't (`turbopackMinify` and `turbopackMangleExportNames` default to `true` in builds only). | `08-turbopack.md:130`, `:464`, `:470`, `:482`; `mountSky.ts:84-85` |
| **No `next/script` worker strategy**; no `next/font`, metadata, route-segment config, Suspense, `<Activity>` or Cache Components API (the grep's only matches are `scrollTo`'s `'instant'`, the `activity` message, the plan's own `nextAfter`, and 5.4's reasons for not using `next/dynamic` or `use(browser())`). | `scripts.md:128`; grep of `PLAN.md`; `AGENTS.md:21` |
| **React Compiler.** The store's functions are module-level, `getSnapshot` returns a string or `null`, `subscribe` is declared outside the component, and the header's ref is read only in the scroll callback; the P5 code passes the compiler's lint rules. | `next.config.ts` (`reactCompiler`); Method 3; react.dev |
| **`inert={mobileMenuOpen}` and `onFocus`** on Motion elements: React 19 takes the boolean and its `onFocus` bubbles (it listens for `focusin`); Motion forwards both; tsc accepts them. | Method 3; Motion's component docs |
| **Motion under reduced motion**: `MotionConfig reducedMotion="user"` keeps the control's entrance to an opacity fade, like the other nav items; its stagger slot uses `custom` as the Resume item does; 7.0 queries the `motion` docs before P5's entrance. | `MotionProvider.tsx:7`; Motion docs (Method 8) |
| **The `next dev` MCP checks**: `get_errors` reads browser sessions with the page open, so a full reload of `/` comes first; `get_logs` names the log file; `compile_route` takes a path; `get_compilation_issues` needs no browser. | `mcp.md:54`, `:55`, `:60-61`, `:88` |
| **The upgrade-reminder rule** (7.0, line 2832) and **P5's `AGENTS.md` line** under "Project notes", outside the managed markers ("Next.js updates only the content between the markers and preserves the rest of the file"). | `AGENTS.md:23`; `agentRules.md` |
| **7.1's resolve hook, run line and harness rules** on Node 24, the query-string fresh-module rig (H13) and P10's `./meteors` wrap. | `module.md` (Method 7); Methods 4 and 5 |
| **D5's Vitest option.** | `testing/vitest.md:43-44`, `:68-71`, `:92-103` |

## Findings

### NJ12-1 (minor): 5.2's Turbopack citation names a path that doesn't exist

- **Section.** 5.2, "Bundling" (line 366).
- **Problem.** 5.2 cites the Turbopack page as `03-api-reference/08-turbopack.md:130` (and `:482` after it). Read from the docs root the plan names (`node_modules/next/dist/docs`, section 1 and 13), that path doesn't resolve: the page is under `01-app/`. Every other docs citation in 5.2, 5.4, D5 and section 13 carries the `01-app/` prefix, and section 13 cites this same page correctly (line 3591).
- **Evidence.**
  - `PLAN.md` line 366: "its docs mention `new Worker()` expressions for magic comments (`03-api-reference/08-turbopack.md:130`) and an asset prefix ... (`turbopackWorkerAssetPrefix`, `:482`)".
  - `PLAN.md` line 3591: "`01-app/03-api-reference/08-turbopack.md`: magic comments on `new Worker()` expressions, line 130; `turbopackWorkerAssetPrefix`, line 482."
  - `ls node_modules/next/dist/docs` gives `01-app`, `02-pages`, `03-architecture`, `04-community` and `index.md`; `01-app/03-api-reference/08-turbopack.md` exists and its lines 130 and 482 say what 5.2 quotes; `03-api-reference/08-turbopack.md` doesn't exist.
- **Fix.** In 5.2's "Bundling" bullet, write `01-app/03-api-reference/08-turbopack.md:130`. Nothing else changes.

## Summary

- **Verdict: pass.** One minor finding (NJ12-1), no blocking or major one.
- **NJ11-1 landed** verbatim in P13's verification and is right: the check now runs in Safari with the relay on, so it passes only if `destroy` cancels the main-thread loop; View Full Portfolio is a `next/link`, so the Back is an App Router navigation that unmounts the home page.
- **Round 11's revision changed no main-thread code**: only the `SkyPauseButton` and `FRAME.motionEase` doc comments moved in 6.6, 6.8 and 6.13. The P5 code still builds on cf4d7b8: tsc is clean, ESLint is clean with the React Compiler rules active, and 7.1's hook runs the store under Node 24.14 as H12 describes.
- **P10's new harness claim holds**: a `registerHooks` resolve hook can wrap `./meteors` and record each `planMeteor` call's options (with `shortCircuit: true`), and H13's query-string imports give fresh module instances.
- **Every cited docs line still says what the plan says**: Next.js 16.4.2, react.dev, Motion and Node v24 (`module.register()` deprecated in v24.15.0, `registerHooks` a release candidate since v24.13.1). No Cache Components, `next/script`, `next/font`, metadata or route-segment API appears.
- **NJ12-1** is a one-token path fix in 5.2.

Scratch evidence is in `nextjs-gate-r12/` in the session scratchpad, not in the repository:

- `PLAN.r12.md`, the snapshot audited, and `diff-r11-r12.txt` and `wdiff.txt`, its line and word diffs from round 11's snapshot;
- `PLAN.r12.code.txt`: the extracted code of 6.6, 6.8 and 6.13;
- `skyPause.plan.ts`, `SkyPauseButton.plan.tsx` and `register-hooks.plan.mjs`: today's sketches;
- `rig/`: round 11's rig with today's `SkyPauseButton.tsx`, rerun with tsc and ESLint;
- `h12/`: 7.1's hook and the store with `h-pause.ts`, rerun on Node 24.14.0;
- `wrap/` and `query/`: the two Node checks of Method 5.
