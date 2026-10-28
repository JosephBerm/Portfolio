# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 6

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 6. Verdict: **pass** (no blocking, major or minor findings).

## Scope

- **Role.** Re-audit `PLAN.md` within the Next.js 16.4 docs scope after round 5. Confirm that the one round-5 finding in this scope (NJ5-1) landed, check the other round-5 changes for regressions in this scope, and audit again every decision that touches Next.js, React or Motion:
  - the `'use client'` boundaries and where the pause control's island lives;
  - what crosses the server and client boundary;
  - hydration safety of `localStorage` and `matchMedia` (`useSyncExternalStore` with a server snapshot);
  - the Web Worker under Turbopack (`new URL(..., import.meta.url)`);
  - any `next/script`, `next/font`, metadata or route-segment usage;
  - React Compiler implications for the plan's hooks and stores;
  - App Router conventions, deprecated or changed 16.x APIs, and the absence of Cache Components APIs;
  - Motion usage, against Motion's docs.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)") and `research/01-planning-brief.md`.
  - `PLAN.md`: sections 1, 1.1, 2.1, 2.2, 3, 4.1, 4.2, 4.4, 5, 6.6, 6.7, 6.8, 6.13, 7.0 to 7.3 (P0 to P7), 9.2, 11 to 13, the check log and the audit log; the round-5 dispositions; the previous reports `audit/nextjs-docs.md` and `audit/nextjs-docs-gate-r5.md`.
  - The worktree code at 246c0aa; the installed Next.js 16.4.2 docs (`S:/Documents/repos/Portfolio/node_modules/next/dist/docs`) and source; react.dev; Motion's docs through the `motion` MCP server.
  - Read only, in the main checkout: the veil session's uncommitted diff of `mountSky.ts` and `AGENTS.md`.
- **Outputs.** This file, and the same (empty) list of findings in the structured result.
- **Limits.** Planning only: no edits to `PLAN.md`, `src/`, configuration or anything in the main checkout, and the veil session's dev server on port 3000 was not touched. Throwaway checks ran only in the session scratchpad (`nextjs-gate-r6/`). Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed.** Diffed the current `PLAN.md` against the snapshot round 5 started from (`check-r5-completeness/PLAN.snapshot.md`: 363 changed lines) and against the reviser's copy (`reviser-r5/PLAN.after-r5.md`: one later edit, a lean figure in 6.13), then filtered round 5's additions for Next.js, React and Motion terms. Sections 5.4 and 6.8 are byte-identical to round 5's starting text. Section 5.2 changed only in its worker-graph bullets (`bodies.ts`, `radiants.ts` importing `startArea`, the worker staying one file).
2. **Docs.** Re-opened every docs line the plan cites and confirmed the text:
   - `01-app/01-getting-started/05-server-and-client-components.md:26`, `:178-180`;
   - `01-app/03-api-reference/01-directives/use-client.md:10`, `:50`;
   - `01-app/02-guides/preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; `scripts.md:128`; `mcp.md:54-61`, `:88`; `testing/vitest.md:43-44`, `:68-71`, `:92-103`;
   - `01-app/03-api-reference/08-turbopack.md:130`, `:470`, `:473`, `:482`.

   Also read `reactStrictMode.md:8`, `reactCompiler.md:12`, `preserving-ui-state.md:15-17`, `upgrading/version-16.md` (`:100`, `:893-895`, `:1098`) and Next's `dist/lib/find-root.js` and `dist/server/mcp/tools/get-errors.js`.
3. **Lint and types.** Copied the current P5 sketches verbatim from `PLAN.md` (`skyPause.ts`, lines 1747 to 1860; `SkyPauseButton.tsx`, lines 1883 to 1916) into round 5's rig, beside the worktree's `Navbar.tsx` with every 6.8 change and the two icons. Ran the repository's ESLint rules (eslint-config-next 16.4.2, with eslint-plugin-react-hooks' React Compiler rules) and tsc (`@types/react` 19.3.0, Motion 12.38.0).
4. **The store.** Two Node 24.14 simulations of the current sketch, with `matchMedia`, `localStorage` and `window` stubbed: round 5's remount script, and a new script for StrictMode's development double-invoke of passive effects, in tree order.
5. **React and Motion.** Fetched react.dev's `useSyncExternalStore` page again (2026-10-27). Read Motion's `scroll`, `useMotionValueEvent` and Accessibility pages through the `motion` MCP server.
6. **The veil diff.** Read the main checkout's uncommitted `mountSky.ts` and `AGENTS.md` diffs, read only.

## Round-5 fix in this scope: landed

| ID | Where (`PLAN.md`) | Confirmation |
|---|---|---|
| NJ5-1 | 13 Sources, line 3745 | The line now reads "`get_errors` reads the browser sessions that have the page open (lines 54 and 88); `get_logs` names the development log file, which holds browser console output and server output (line 55)", the finding's wording. It matches `mcp.md:54` ("browser runtime errors"), `:55` ("Get the path to the development log file, which contains browser console logs and server output") and `:88` ("Tools such as `get_errors` and `get_page_metadata` read from active browser sessions"). It agrees with 5.4 (line 427), 7.0 (line 2860), P5 (line 3157) and AC-41 (line 3615), and the audit log records it (line 3964). |

## Regression check: round-5 changes that touch this scope

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| On a file-by-file answer to CP-0, only the pause store, the control, its icons and `Navbar.tsx` are prepared before V | 4.4 (line 324), the 7.2 note (line 2977), P5 "Blocked on" (line 3135) | No issue. Until `mountSky` calls `setSkyRunning(true)`, `skyPlayback` returns null, so the prepared control renders nothing on the server or the client, and the store attaches its two listeners only while something subscribes. Nothing reaches master before V. |
| `radiants.ts` imports `startArea` from `meteors.ts` at run time; `bodies.ts` joins the model files; `sky.worker.ts` stays one file | 5.2 (lines 382 to 389) | No issue. These are static imports inside the worker's graph, so they join the worker chunk with no configuration (`08-turbopack.md:482`: Web Worker "entrypoint + module chunks"). `meteors.ts` never imports `radiants.ts`, and no kind module imports `transients.ts` at run time, so evaluation order holds in the build too. The main thread's imports are unchanged. |
| H4 joins P5's verification | P5 (line 3157) | No effect on the hydration check, which is unchanged. |
| `demandNow` gathers first; the `activity` case | 6.6 (line 1680) | Worker only. `mountSky`'s activity sketch (lines 1661 to 1677) is unchanged: string constants at module scope, listeners inside `mountSky`. |

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| The P5 code passes the repository's lint, React Compiler rules included, and type-checks | ESLint: 0 errors and 0 warnings in each of `skyPause.ts`, `SkyPauseButton.tsx`, `Navbar.tsx`, `PauseSVG.tsx`, `PlaySVG.tsx` and `icons/index.ts`. A probe that reads a ref during render raised 4 errors (`react-hooks/refs`), so the compiler rules ran. tsc: exit 0. The sketches are identical to the ones round 5 checked. |
| `SkyPauseButton.tsx` has no `'use client'`; the control lives in Navbar's existing client island; under D1 (a) or (b) its own file gains the directive, and its one prop, `className`, is serializable | `Navbar.tsx:1` (`'use client'`), rendered by the Server Component at `page.tsx:32`; `use-client.md:10` ("You only need to add it to the files whose components you want to render directly within Server Components"), `:50` (serializable props); `05-server-and-client-components.md:178-180`. |
| Browser APIs only in client code, never at module scope | `05-server-and-client-components.md:26` ("Browser-only APIs. E.g. `localStorage`, `window`"). The sketch touches `matchMedia`, `localStorage` and `window` only inside functions (lines 1768 to 1860), and its one import, `utils.ts`, has no module-scope DOM access. The page is statically prerendered (`next.config.ts:11`), so the store module is also evaluated at build time, where React calls only `getServerSnapshot` and runs no effect: its state is never written on the server. |
| Hydration: `useSyncExternalStore` with a null server snapshot; not `next/dynamic`, a `useEffect` gate or `use(browser())`; no inline script | react.dev, `getServerSnapshot`: "It will be used only during server rendering and during hydration of server-rendered content on the client". `preventing-flash-before-hydration.md:11`. `single-page-applications.md:219` ("Use `use(browser())` only when a Client Component's first browser render cannot match server-rendered HTML") and `:221` (it suspends to a Suspense boundary). `IntroGate.tsx:94-100`: the key flip remounts the visible tree on the client. The worker exists only after `SkyCanvas`'s effect creates it, so its `'ready'` (`mountSky.ts:261-268`) always follows the hydration commit: both snapshots are null at hydration, as 5.4 and 6.8 say. |
| One store instance for Navbar's and SkyCanvas's client entries | Round 5's evidence from the production build (a module imported by two client entries is registered once, `useIntroPhase.ts`) still applies: `page.tsx`, `IntroGate.tsx`, `SkyCanvas.tsx` and `Navbar.tsx` are unchanged at 246c0aa. |
| StrictMode's dev remount is harmless | `reactStrictMode.md:8` (on by default with the App Router). The new simulation: after the double-invoke both watchers are attached again (1 and 1), `mountSky`'s second read still sees the stored pause, and the control's first snapshot is `'paused'`. `mountSky` creates a fresh canvas per mount (`mountSky.ts:137-141`), so the second mount can transfer control. |
| A page view is one mount of `/`; the last unsubscribe resets the cache | `preserving-ui-state.md:15`, `:17`: without Cache Components, keeping page state across navigations needs "an external store", and only with them are pages hidden instead of unmounted; `next.config.ts` sets no `cacheComponents`. Round 5's remount script on the current sketch: listeners (0, 0) while away, another tab's pause seen on return, no lingering Play, and an in-page Play survives the control's remount. |
| React Compiler | `next.config.ts` enables it; `reactCompiler.md:12` (applied only to files with JSX or hooks, so `skyPause.ts` is not compiled). react.dev: declaring `subscribe` outside the component prevents resubscribing, and snapshots are compared with `Object.is` (the sketch returns a string or null). |
| Worker bundling unchanged; no `next/script` worker strategy | `mountSky.ts:79-80`; `08-turbopack.md:130`, `:482`; `scripts.md:128` ("not yet stable and does not yet work with the App Router"). The CSP (`script-src 'self' 'unsafe-inline'`, no `worker-src`) is met by Turbopack's same-origin worker chunks, and the plan adds no `blob:` worker, `eval` or dynamic `import()`. |
| The production smoke build at the end of each phase | `08-turbopack.md:470` (`turbopackMangleExportNames`: `false` in dev, `true` in builds) and `:473` (scope hoisting off in dev). No plan code relies on runtime names (no `.name`, namespace import or dynamic `import()`). `version-16.md:1098`: `next build` no longer lints, which the separate `npm run lint` covers. Stopping our dev server first is stricter than Next 16 needs (`version-16.md:893-895`), and it is what AGENTS.md asks. |
| The MCP checks | `mcp.md:54`, `:55`, `:60` (`get_compilation_issues` needs no browser session), `:61`, `:88`. `get-errors.js` declares `inputSchema: {}` and, with no browser session, returns an explicit "No browser sessions connected" error; `nextjs_call` takes `port`, `toolName` and an optional `args`, as P5 and AC-41 use it. |
| D5's Vitest option | `testing/vitest.md:43-44`, `:68-71`, `:92-103`. |
| No Cache Components, `next/font`, metadata, route-segment config, Suspense or Activity | grep of `PLAN.md`: "instant" appears only as "at any instant", "an instant scrollTo" and `behavior: 'instant'`; "Suspense" only in 5.4's reason against `use(browser())`; nothing touches `layout.tsx`, `page.tsx`'s `metadata`, `fonts.ts` or `next.config.ts`. |
| Motion | `scroll()`: "By passing a callback with a second `info` argument, it's possible to get detailed information about scrolling" (Motion `scroll` docs), as `mountSky.ts:234-235` already does; the plan leaves it unchanged. `useMotionValueEvent`'s `change` callback receives the latest value and is cleaned up on unmount, so Navbar's focus test runs outside render. `MotionConfig reducedMotion="user"` (`MotionProvider.tsx:7`) "will automatically disable transform and layout animations, while preserving the animation of other values like opacity", so the control's drop-in becomes a fade under reduced motion. D1's Server Component hosts use the host's `StaggerItem` or a named `motion/react-client` import (AGENTS.md). |
| The veil's in-progress `mountSky.ts` and `AGENTS.md` | Its `mountSky.ts` diff changes the rect measurement and the line-4 import only. `motion()`, the reduced-motion query, the worker-message listener and `destroy`, which P5 rewires, are untouched, as 8.6 expects. Its `AGENTS.md` edit is the `data-sky-quiet` line that P5's line follows (8.6). |
| The nested implementing worktree | `find-root.js`: `findGitBoundary` stops the root search at a git worktree, so the worktree uses its own lockfile. The repository's `eslint.config.mjs` ignores `.claude/worktrees/**` relative to each checkout's own config, so `npm run lint` in the worktree lints its own `src`. |

## Findings

None. No blocking, major or minor problem in this scope.

## Summary

- **Verdict: pass.**
- **NJ5-1 landed as written.** Section 13 now describes `get_errors` and `get_logs` as `mcp.md` does, in line with 5.4, 7.0, P5 and AC-41.
- **No regression.** Round 5 left sections 5.4 and 6.8 byte-identical. Its other edits in this scope (the files prepared on a file-by-file answer, the worker graph's new imports) stay inside the existing client boundary and the worker chunk.
- **Re-verified on the current text.**
  - The P5 code passes the repository's ESLint rules, React Compiler rules included, and tsc.
  - The store keeps its rules across a client-side navigation and through StrictMode's development remount.
  - Every cited docs line says what the plan says.
  - No Cache Components, `next/script` worker, `next/font`, metadata or route-segment API appears.
- **The confirmed veil interface** still changes nothing in this scope.

Scratch evidence (not in the repository), in `nextjs-gate-r6/` in the session scratchpad: `rig/` (ESLint and tsc on the current sketches), `sim/sim.mjs` and `sim/strict.mjs` (the store), and `r5.diff` (round 5's changes).
