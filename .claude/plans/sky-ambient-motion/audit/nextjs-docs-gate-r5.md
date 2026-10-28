# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 5

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 5. Verdict: **pass** (no blocking or major findings; 1 minor).

## Scope

- **Role.** Re-audit `PLAN.md` within the Next.js 16.4 docs scope after round 4. Confirm that the five round-4 findings in this scope (r4-nextjs-docs-NJ-1 to NJ-5) landed correctly, together with the round-4 changes that touch Next.js or React (CONV-4's rename to `SkyPauseButton` and its `aria-label`, CONV-8's `'use client'` for D1 (a)), and look for regressions. Then audit every decision that touches Next.js, React or Motion:
  - the `'use client'` boundaries and where the pause control's island lives;
  - what crosses the server and client boundary;
  - hydration safety of `localStorage` and `matchMedia` (`useSyncExternalStore` with a server snapshot);
  - the Web Worker under Turbopack (`new URL(..., import.meta.url)`);
  - any `next/script`, `next/font`, metadata or route-segment usage;
  - React Compiler implications for the plan's hooks and stores;
  - App Router conventions, deprecated or changed 16.x APIs, and the absence of Cache Components APIs.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)") and `research/01-planning-brief.md`.
  - `PLAN.md`: sections 1, 1.1, 2.1, 2.2, 3, 4, 5, 6.1 (the worker side), 6.6, 6.7, 6.8, 6.13, 7.0 to 7.3 (P0 to P7, P13, PF), 8.1 and 8.4 to 8.6, 9.2, 10 to 13, the check log and the audit log.
  - The previous report, `audit/nextjs-docs.md`, with its skeptic notes and the round-4 dispositions.
  - The worktree code at 246c0aa; the installed Next.js 16.4.2 docs (`S:/Documents/repos/Portfolio/node_modules/next/dist/docs`); react.dev; Motion's docs through the `motion` MCP server.
  - Read only, in the main checkout: the veil session's uncommitted diff of `mountSky.ts` and `AGENTS.md`, and the production build left in `.next` (2026-10-22).
- **Outputs.** This file, and the same findings in the structured result.
- **Limits.** Planning only: no edits to `PLAN.md`, `src/`, configuration or anything in the main checkout. Throwaway checks ran only in the session scratchpad (`nextjs-gate-r5/`). Conventions, DRY, separation of concerns, physics and coordination belong to the other reviewers and appear here only where a Next.js or React rule is the reason.

## Method

1. Read every section above and grepped `PLAN.md` for `'use client'`, hydration, `useSyncExternalStore`, StrictMode, Turbopack, `import.meta.url`, `next/*`, `nextjs_call`, `get_errors`, `get_logs`, metadata, route-segment exports, Suspense, Activity, `'use cache'`, `cacheLife`, `instant`, `localStorage`, `matchMedia`, Motion APIs, `inert` and `onFocus`.
2. Opened every docs line the plan cites and confirmed the quoted text: `use-client.md:10`; `05-server-and-client-components.md:26`, `:178-180`; `08-turbopack.md:130`, `:470`, `:482`; `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; `scripts.md:128`; `mcp.md:54`, `:55`, `:88`; `testing/vitest.md:43-44`, `:68-71`, `:92-103`. Also read `preserving-ui-state.md:13-15`, `reactStrictMode.md`, `reactCompiler.md:12`, `logging.md:100-105`, `next.md:70`, `:122` and `upgrading/version-16.md`.
3. React claims on react.dev: `useSyncExternalStore` (the `getServerSnapshot`, `subscribe` and `getSnapshot` texts) and the common components page (`onFocus` bubbles). Motion claims through the `motion` MCP server (`useMotionValueEvent`, `scroll`) and its sources (`framer-motion/dist/es/motion/utils/valid-prop.mjs`, `render/dom/utils/filter-props.mjs`, `motion-dom/.../generators/spring.mjs`).
4. Empirical checks, scratch only:
   - **Lint and types.** The current P5 sketches copied verbatim from `PLAN.md` (`skyPause.ts`, lines 1732 to 1845; `SkyPauseButton.tsx`, lines 1868 to 1901) and the worktree's `Navbar.tsx` with every 6.8 change, run through ESLint with the repository's rules (eslint-config-next 16.4.2, eslint-plugin-react-hooks 7.1.1 with its React Compiler rules) and through tsc (`@types/react` 19.3.0, Motion 12.38.0, `next/link`).
   - **The store across remounts.** A Node 24.14 simulation of the `skyPause.ts` sketch as written, with `matchMedia`, `localStorage` and `window` stubbed.
   - **Type-only imports.** Next's own SWC transform (`next/dist/build/swc`, default options) and Node 24.14's type stripping on the two import forms 5.2 discusses.
   - **The production build.** The main checkout's 2026-10-22 `.next` output: how a module shared by two client entries and the sky worker are emitted.
   - **The App Router's React.** The React that Next.js vendors (`next/dist/compiled/react*`).

## Round-4 fixes in this scope: all landed

| ID | Where it landed (`PLAN.md`) | Confirmation |
|---|---|---|
| NJ-1 | 5.4 (:424), 7.0 (:2837), P5 verification (:3132), AC-41 (:3590) | Full reload of `/` on our port, wait past the reveal, `get_errors` through `nextjs_call` with no route, the file `get_logs` names, and `GET /` for the server HTML. Matches `mcp.md:54`, `:55`, `:88` and the docs' own example call (`nextjs_call (port: 3000, toolName: "get_errors")`, `mcp.md:117`). The loaded `nextjs_call` tool takes `port`, `toolName` and an optional `args`, which `get_errors` doesn't need. Hydration mismatches are console errors, which the log receives by default (`logging.md:102`, `'warn'`: "warnings and errors"). `GET /` is a sound test: no file in `src/` contains "sky animation" today, and the button renders null on the server. |
| NJ-2 | 6.8 sketch (:1836-1844) and paragraph (:1850); deviation 7 (:59); PB1 (:288); H12 (:2914) | The reset sits in the last-unsubscribe branch, where the skeptic placed it. Simulation of the sketch as written: after a Play under reduced motion and an unmount, both global listeners are gone (0 and 0); a pause another tab stores meanwhile is what `mountSky`'s first read sees on return (`true`); the old Play doesn't linger (paused again under reduced motion, playing once the OS setting is off); an in-page Play survives the control's remount at the key flip while `mountSky` stays subscribed. The cited links back to `/` hold (`PortfolioFooterLink.tsx:9-10` with `linksData.ts:55-57`; `not-found.tsx:16`). StrictMode is on by default under the App Router (`reactStrictMode.md`), and its dev remount happens before anyone can press Play, as 6.8 says. |
| NJ-3 | D5 (:172), R-21 | The Vitest option names the `@/` mapping and the `test` script; every cited line exists as described (`vitest.md:44`: the TypeScript install line with `vite-tsconfig-paths`; `:68-71`: `tsconfigPaths()` in `vitest.config.mts`; `:92-103`: the `test` script). The repository's `tsconfig.json` includes only `**/*.ts` and `**/*.tsx`, so a `vitest.config.mts` would stay outside `npm run type-check`. |
| NJ-4 | 5.4 (:418-419), 6.8 "Hydration" (:1908) | The 5.4 bullet gives the guide's own condition (`single-page-applications.md:219`) and the Suspense cost (`:221`). "Both snapshots are null at hydration" holds: the worker posts `'ready'` only after it draws its first frame (`sky.worker.ts:269-281`), a message that arrives as a task after the effects of the hydration commit, so the button's subscribe-time snapshot check still reads `null`. |
| NJ-5 | 5.2 (:391-395), D1 (a) and (b) (:168) | 5.2 cites `use-client.md:10` and `08-turbopack.md:130` with `:482`. D1's quiet-root options use the host's entrance (the hero's `StaggerItem` from the `'use client'` wrappers in `@/components/motion`, `Introduction.tsx:4`, `:16-22`; the footer's named `motion/react-client` imports, `AppFooter.tsx:1`) or one inside the control, as AGENTS.md requires for Server Components. |
| CONV-8 | D1 (a) (:168), 5.2 (:394) | `'use client'` goes on `SkyPauseButton.tsx` only when a Server Component renders it, and the host stays a Server Component: exactly `use-client.md:10`. Its one prop, `className`, is serializable (`use-client.md:50`). |
| CONV-4 | 6.8 (:1868-1906), 11 (2.5.3) | The rename and the `aria-label` change nothing for Next.js or React. ESLint and tsc on the renamed sketches: 0 problems (below). |

No regression found: the round-4 edits outside this scope (the pure frame policy in `pacing.ts`, the kind-agnostic `transients.ts`, the module-scope quiet index in `renderSky.ts`, the worker size guard) stay inside the worker's graph and the `src/lib/sky` import rules, so they change nothing about the client bundle, the boundary or hydration.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| The P5 code passes the repository's lint, React Compiler rules included, and type-checks | ESLint over `skyPause.ts`, `SkyPauseButton.tsx`, the two icons, the icons barrel and the changed `Navbar.tsx`: 0 errors and 0 warnings in each file. A probe that reads a ref during render and sets state in an effect raised 4 errors, so the compiler rules (`react-hooks/refs`, `set-state-in-effect`) ran. tsc: 0 errors. The compiler doesn't compile `skyPause.ts` (no JSX or hooks, `reactCompiler.md:12`), the store functions are module-level, so `subscribe` is stable (react.dev: "You can prevent this by declaring `subscribe` outside the component"), and the snapshots are strings or `null` (react.dev: compared with `Object.is`). |
| The control lives in the Navbar's existing client island; no new boundary in the default | `Navbar.tsx:1`; `05-server-and-client-components.md:180` ("all of its imports and the components it directly renders are included in the client bundle"); `use-client.md:10`. Navbar receives no props, so nothing new crosses the boundary. |
| No browser API at module scope; the store is safe in server-rendered client code | The sketch touches `window`, `matchMedia` and `localStorage` only inside functions (`PLAN.md:1752-1845`). On the server React calls only `getServerSnapshot` (react.dev: "used only during server rendering and during hydration of server-rendered content on the client"), and no effect runs there, so the module state is never written on the server. |
| One store instance for two client entries in production | `skyPause.ts` is imported from two client entries: Navbar's (rendered by `page.tsx`) and SkyCanvas's (rendered by `Background.tsx`, through `mountSky.ts`). The existing build shows how Turbopack treats that case: `useIntroPhase.ts`'s context, `createContext("revealed")`, is one registered module (49904 in `.next/static/chunks/0x2d7crrdufup.js`) that both IntroGate's module (87024) and SkyCanvas's (81096) import by id (`e.i(49904)`), in one page chunk with the Navbar. Scope hoisting, which is off in dev and on in builds (`08-turbopack.md:473`), did merge `mountSky.ts` (imported only by SkyCanvas) into SkyCanvas's module, but kept the shared module separate. |
| Worker bundling is unchanged; new model files join the worker chunk by static import | The build loads the worker through Turbopack's bootstrap (`static/chunks/turbopack-worker-1hrsqshz0gfey.js`), which `importScripts` its module chunks and refuses any foreign origin: the "entrypoint + module chunks" of `turbopackWorkerAssetPrefix` (`08-turbopack.md:482`). `mountSky` calls it as `e.r(39022)(Worker, { name: "sky" })`. Same-origin chunks satisfy the CSP's `script-src 'self'` (`next.config.ts`), and the plan adds no new script source. |
| 5.2's type-only import rule, and "the Next.js build drops both forms" | Next's SWC transform turns `import { type A, type B } from './transients'` plus `import type { C } from './transients'` into no import at all. Node 24.14's type stripping drops the statement form but keeps the inline-only form as a runtime import (the imported module evaluated). |
| `inert={mobileMenuOpen}` and `onFocus` on Motion elements | The App Router runs the React that Next vendors, 19.3.0-canary-278794d7-20261002 (`next/dist/compiled/react`); its react-dom treats `inert` as a boolean attribute (`react-dom-client.development.js:21908`). Motion forwards both props: neither is in `validMotionProps` or a motion prefix (`valid-prop.mjs`), and `@emotion/is-prop-valid` is absent, so `filter-props.mjs` forwards every non-motion prop. react.dev: "Unlike the built-in browser `focus` event, in React the `onFocus` event bubbles." |
| Reading `headerRef.current` inside the `useMotionValueEvent` callback | Motion's docs: the callback fires "when the value of a motion value changes", not during render; the compiler lint passes it (above). |
| The page-view semantics across soft navigations | One root layout (`src/app/layout.tsx`); without Cache Components the home page unmounts on navigation, and keeping state across navigations meant "using an external store" (`preserving-ui-state.md:13-15`), which is what 6.8 builds, now with the reset on the last unsubscribe. |
| Not `next/dynamic` with `ssr: false`, a `useEffect` gate or `use(browser())` | `single-page-applications.md:205-221`; the vendored react-dom exports `browser`. The control's first browser render matches the server HTML, so `:219`'s condition fails. |
| No inline script is needed | The guide's inline script exists to fix server HTML before first paint (`preventing-flash-before-hydration.md:15`). Here the server HTML has no control, the visible control mounts fresh at the reveal (`IntroGate.tsx:94-100`), and the worker's first frame already uses the stored pause, since `init` carries `motion: sentMotion`. |
| No `next/script` worker strategy | `scripts.md:128`: "not yet stable and does not yet work with the App Router"; `experimental.nextScriptWorkers` is also unsupported under Turbopack (`08-turbopack.md:435`). |
| No Cache Components API, `next/font`, metadata, route-segment config, Suspense or Activity | grep of `PLAN.md`: "instant" appears only as `behavior: 'instant'` and "an instant scrollTo"; nothing touches `layout.tsx`, `page.tsx`'s `metadata` or `next.config.ts`. |
| Motion references | `scroll()` docs: "By passing a callback with a second `info` argument ... `info.x.current`", as `mountSky.ts:232-235` already uses; the spring equivalence (`spring.mjs:135-137`: ω = 2π / (1.2 × visualDuration), so ω = 10 is visualDuration 0.524 s, the plan's 0.52 s; the critically damped branch is the closed form `stepSpring` uses). |
| The implementing worktree's dev server and build | `.claude/launch.json` sets `autoPort` on both configurations, and `next dev` and `next start` read `PORT` (`next.md:70`, `:122`). `find-root.js` stops its root search at a git worktree, so a nested worktree uses its own lockfile. Building with our dev server stopped respects AGENTS.md's "while `next dev` runs ... instead of `next build`". |
| The veil diff doesn't touch what P5 rewires | In the main checkout, the veil's `mountSky.ts` diff changes the measurement and the `color` import on line 4, not `motion()`, the worker-message listener, `destroy` or the reduced-motion wiring. Line 4 sits next to the `REDUCED_MOTION_QUERY` import P5 removes, which 8.6 lists as an adjacent edit. |

## Findings

### NJ5-1 (minor): section 13 says `get_logs` reads browser sessions; the docs say it names a log file

- **Section.** 13 Sources, the `mcp.md` line (`PLAN.md:3719`).
- **Problem.** The line reads "`01-app/02-guides/mcp.md`, lines 54, 55 and 88: `get_errors` and `get_logs` read from browser sessions with the page open." Only `get_errors` (and `get_page_metadata`) read active browser sessions. `get_logs` returns the path of the development log file, which the agent then reads. 5.4 (`:424`) and P5 (`:3132`) already describe both tools correctly, so the Sources line contradicts the plan's own instructions.
- **Evidence.**
  - `mcp.md:54`: `get_errors` gets "the current error state, including ... browser runtime errors".
  - `mcp.md:55`: `get_logs`: "Get the path to the development log file, which contains browser console logs and server output."
  - `mcp.md:88`: "Tools such as `get_errors` and `get_page_metadata` read from active browser sessions."
- **Fix.** Replace the line with: "`01-app/02-guides/mcp.md`: `get_errors` reads the browser sessions that have the page open (lines 54 and 88); `get_logs` names the development log file, which holds browser console output and server output (line 55)."

## Summary

- **Verdict: pass.** No blocking or major finding.
- **The round-4 fixes landed** as the dispositions say, each in the place the skeptic corrected it to:
  - NJ-1's hydration check (a full reload, `get_errors` with no route, the `get_logs` file, `GET /`);
  - NJ-2's reset on the last unsubscribe, confirmed by simulating the sketch as written;
  - NJ-3's Vitest wording; NJ-4's reasons against the browser-only patterns; NJ-5's citations and D1's entrance rule;
  - CONV-8's directive on the control's own file under D1 (a).
- **No regression.** The renamed control and the round-4 store change pass the repository's ESLint rules (React Compiler rules included) and tsc.
- **New evidence for the design.**
  - The existing production build keeps a module shared by two client entries as one instance, so the store works across the Navbar and the sky in production too.
  - The worker loads through Turbopack's same-origin bootstrap, which new model files join by static import.
  - Next's SWC drops both type-only import forms, as 5.2 says.
- **One minor fix:** the Sources line for `mcp.md` misstates what `get_logs` does.
- **The confirmed veil interface** changes nothing in this scope: its `mountSky.ts` work stays in the rect measurement, apart from one adjacent import line that 8.6 already lists.

Scratch evidence (not in the repository): `nextjs-gate-r5/` in the session scratchpad, with the lint and type rig, `sim/sim.mjs` (the store) and `strip/` (Node's type stripping).
