# Audit: Next.js 16.4 official docs (scope "nextjs-docs")

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow. Verdict: **pass** (no blocking or major findings; 5 minor).

## Scope

- **Role.** Audit every decision in `PLAN.md` that touches Next.js, React or Motion against the installed Next.js 16.4.2 docs (`S:/Documents/repos/Portfolio/node_modules/next/dist/docs`), react.dev, and Motion's docs (through the `motion` MCP server). Topics: the `'use client'` boundaries and where the pause-control island lives; Server versus Client Components and what crosses the boundary; hydration safety of `localStorage` and `matchMedia`; bundling the Web Worker under Turbopack; any `next/script`, `next/font`, metadata or route-segment usage; React Compiler implications for the plan's hooks and stores; App Router conventions; deprecated or changed 16.x APIs; and the absence of Cache Components APIs.
- **Inputs.** `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)"), `research/01-planning-brief.md`, and `PLAN.md` (sections 1, 1.1, 2.1 and 2.2, 3, 4, 5, 6.6, 6.7, 6.8, 6.13, 7.0 to 7.3 for P0 to P7, 9.2, 11, 12, 13 and the check log). The worktree code at master 246c0aa. The main checkout's uncommitted veil diff, read only (`mountSky.ts`, `AGENTS.md`, `protocol.ts`).
- **Outputs.** This file, and the same findings in the structured result.
- **Limits.** Planning only: no edits to `PLAN.md`, `src/`, configuration or the main checkout. Throwaway checks ran only in the session scratchpad. Conventions, DRY and separation of concerns belong to the other three auditors, and physics to the check rounds; they are mentioned here only where a Next.js or React rule is the reason.

## Method

1. Listed every Next.js, React and Motion touchpoint in `PLAN.md` by reading the sections above and grepping for `'use client'`, hydration, `useSyncExternalStore`, Turbopack, `import.meta.url`, `next/*`, metadata, route-segment exports, Suspense, Activity, `'use cache'`, `cacheLife`, `instant`, Motion APIs, `inert` and `onFocus`.
2. Checked each against the installed docs, by file and line:
   - `01-app/01-getting-started/05-server-and-client-components.md`, `04-linking-and-navigating.md`;
   - `01-app/02-guides/server-and-client-boundary.md`, `preventing-flash-before-hydration.md`, `single-page-applications.md`, `preserving-ui-state.md`, `scripts.md`, `mcp.md`, `testing/vitest.md`, `upgrading/version-16.md`, `content-security-policy.md`;
   - `01-app/03-api-reference/01-directives/use-client.md`, `08-turbopack.md`, `05-config/01-next-config-js/reactCompiler.md`, `turbopack.md`, `06-cli/next.md`.
3. Checked React claims on react.dev (`useSyncExternalStore`; common components, `onFocus`) and in React's CHANGELOG (19.0.0, `inert`), and Motion's on the `motion` MCP (`useMotionValueEvent`, Accessibility and `reducedMotion`, `scroll`).
4. Read the sources the claims rest on: Motion's DOM prop filter (`framer-motion/dist/es/render/dom/utils/filter-props.mjs`, `motion/utils/valid-prop.mjs`), `motion-dom`'s spring generator, Next's `dist/esm/lib/find-root.js` and `dist/server/lib/generate-agent-files.js`, `@types/react` 19.3.0 and `react-dom` 19.3.1.
5. Two empirical checks in the scratchpad, on the plan's P5 sketches copied verbatim (`skyPause.ts`, `SkyPauseToggle.tsx`) and the worktree's `Navbar.tsx` with every P5 change from 6.8 applied:
   - **ESLint** with the repository's rules (eslint-config-next 16.4.2, including eslint-plugin-react-hooks 7.1.1's React Compiler rules `refs`, `set-state-in-effect`, `globals`, `immutability`, `purity` and the rest): 0 problems. A probe file that reads a ref during render and sets state in an effect raised 4 errors, so the rules were active.
   - **tsc** with the repository's compiler options against `@types/react` 19.3.0, Motion 12.38.0 and `next/link`: 0 errors. A probe with `inert="yes"` failed with TS2322, so the props were really type-checked.

### Verified, no finding

| Plan decision | Evidence |
|---|---|
| `SkyPauseToggle.tsx` carries no `'use client'`: only `Navbar.tsx`, already a client entry, renders it (5.2, 6.8) | `use-client.md:10`; `server-and-client-boundary.md:273`; `05-server-and-client-components.md:178-180`; `Navbar.tsx:1` |
| D1 (a) or (b) needs the directive, because those hosts are Server Components | `Introduction.tsx` and `AppFooter.tsx` have no directive (`AppFooter.tsx:1` imports `motion/react-client`); the only new prop, `className`, is serializable (`use-client.md:50`) |
| Browser APIs only in client code, none at module scope; the store is a module, not context, because `mountSky` (non-React) reads it | `05-server-and-client-components.md:26`; react.dev `useSyncExternalStore` ("declaring `subscribe` outside the component" prevents resubscribing; snapshots must be immutable and repeat while the store is unchanged; strings and null satisfy both) |
| Hydration: `getServerSnapshot` returns null; the visible navbar mounts fresh after IntroGate's key flip, so no inline script is needed | react.dev: the server snapshot "will be used only during server rendering and during hydration of server-rendered content on the client"; `IntroGate.tsx:94-100` (`key`, `hidden` until reveal); `server-and-client-boundary.md:43` (the hidden preload copy does hydrate, against the same null); no Suspense boundary on `/`, so one hydration pass |
| React Compiler: no manual memoization; stable module-level store functions | `reactCompiler.md:12` (compiled only where JSX or hooks appear, so `skyPause.ts` isn't compiled); the lint and tsc runs above |
| `inert={mobileMenuOpen}` on a `motion.div` | React CHANGELOG 19.0.0 "Add support for `inert`" (#24730); `@types/react/index.d.ts:2948` `inert?: boolean`; Motion forwards every non-motion prop when `@emotion/is-prop-valid` is absent (`filter-props.mjs`), and it is absent from `node_modules` |
| `onFocus` on `motion.header` sees focus entering any descendant | react.dev common components: "Unlike the built-in browser `focus` event, in React the `onFocus` event bubbles" |
| Reading `headerRef.current` inside the `useMotionValueEvent` callback | Motion docs: the callback runs on value change, not during render; the compiler lint allows a ref read in a function passed to a hook (lint run above) |
| Worker bundling unchanged (`new Worker(new URL('./sky.worker.ts', import.meta.url))`); new model files enter the worker chunk by static import | `mountSky.ts:79-80`; `08-turbopack.md:130` and `:482` |
| No `next/script` `strategy="worker"` | `scripts.md:128` ("not yet stable and does not yet work with the App Router") |
| No `next/font`, metadata, route-segment config, Suspense, Activity, `'use cache'`, `cacheLife` or `instant` | grep of `PLAN.md`: the only "instant" is `behavior: 'instant'` |
| A production smoke build ends every phase, because production builds mangle export names | `08-turbopack.md:470` (`turbopackMangleExportNames`: production default `true`); `version-16.md:102` (`next build` uses Turbopack by default) |
| Its own dev server in a nested worktree, on a free port | `find-root.js` stops the root search at a git worktree, so the main checkout's lockfile isn't picked; `autoPort` in `.claude/launch.json`; `next.md:70` and `:122` (`next dev` and `next start` read `PORT`) |
| Stopping the dev server before `npm run build` | Not required by Next 16 (`next.md:60`: dev outputs to `.next/dev`, so both can run at once), but it is what AGENTS.md's "use its MCP endpoint ... instead of `next build`" asks while dev runs; keep it |
| P5's `AGENTS.md` line | `next dev` upserts only its marked block (`generate-agent-files.js`), so the new line survives |
| Motion references | `scroll()` is unchanged (Motion `scroll` docs: two-argument callbacks receive `info.y.current`); `MotionConfig reducedMotion="user"` (`MotionProvider.tsx:7`) turns the control's stagger into a fade under reduced motion (Motion Accessibility docs); the spring equivalence holds (`motion-dom` `spring.mjs:135-140` and `:232-236`: ω = 2π / (1.2 × visualDuration), so ω = 10 is visualDuration 0.524 s, the plan's 0.52 s) |
| Browser floor | `version-16.md:100` (Safari 16.4+) matches the plan's "no WebGL" reason and `mountSky.ts:58` |

These agree with the earlier code-grounding rounds (`drafts/check-r1-code-grounding.md`, `check-r2-...`, `check-r3-...`), which checked the same citations and the `inert` forwarding.

## Findings

### NJ-1 (minor): `get_errors` needs an open browser session, and AC-41's server-render check has no method

- **Section.** 5.4 "Verification"; 7.0 "Commands"; P5 "Verification" (`PLAN.md:2946`); AC-41 (`PLAN.md:3389`).
- **Problem.** P5 checks hydration with "`/_next/mcp` `get_errors` on `/`". But `get_errors` takes no route: it reads errors from the browser sessions that have the page open. Called with no browser on the implementing server's port, it reports nothing, which reads as "no hydration warning".
  - On this page a mismatch would also be invisible on screen. It happens in IntroGate's hidden preload tree, which the reveal throws away (`IntroGate.tsx:94-100`), so the logged error is the only sign.
  - AC-41's "absent during server rendering" names no check either.
- **Evidence.**
  - `mcp.md:54`: `get_errors` returns "browser runtime errors".
  - `mcp.md:88`: "Open the pages you're working on in the browser. Tools such as `get_errors` and `get_page_metadata` read from active browser sessions."
  - `mcp.md:55`: `get_logs` gives "the development log file, which contains browser console logs".
  - `mcp.md:61`: `compile_route` alone needs no browser.
- **Fix.** In P5's verification and AC-41, write:
  - Load `/` with a full reload, in a browser on the implementing dev server's port: hydration runs only on a full load. Wait past the reveal.
  - Call `get_errors` through `nextjs_call` (no route argument), and read the file `get_logs` names for console output. A result with no browser session proves nothing.
  - For "absent during server rendering", GET `/` and confirm the HTML contains no "sky animation" text.

### NJ-2 (minor): the pause store's module state outlives its subscribers across App Router navigations

- **Section.** 6.8 "Where the state lives" (`skyPause.ts`, `PLAN.md:1622-1734`); deviation 7; D1 "Persistence"; PB1; AC-28; H12 (`PLAN.md:2730`).
- **Problem.** In the App Router, a `<Link>` navigation keeps the document. Without Cache Components, the home page unmounts when the visitor leaves it and mounts fresh on return, while module variables live on. This site has that path: `/links` links back to `/`.
  - While the visitor is on `/links`, nothing subscribes. The unsubscribe branch removes the `storage` and reduced-motion listeners, but `stored` and `playOverride` keep their values. On return:
    1. A pause or Play made in another tab meanwhile is missed, because `stored` stays cached. That breaks AC-28's "other tabs follow".
    2. A Play pressed under reduced motion carries into the next visit to `/`: "lasts for the page view" really means "for the document". An OS reduced-motion change made while away doesn't clear it either.
- **Evidence.**
  - The plan's sketch:
    - `let stored: boolean | null = null` is "read once" (`PLAN.md:1636-1637`), and `storedPause()` caches it (`:1650-1659`).
    - `playOverride` (`:1638-1639`) is cleared only by the media-query listener (`:1707-1714`).
    - Both listeners are attached on the first subscribe and aborted at zero subscribers (`:1704-1732`).
  - The docs:
    - `04-linking-and-navigating.md:155-157`: a `<Link>` transition works "Instead of reloading the page".
    - `preserving-ui-state.md:13-15`: Activity-based preservation assumes Cache Components; before them, keeping state across navigations meant "using an external store", which is exactly what this module is.
  - The code:
    - `PortfolioFooterLink.tsx:9-10` renders `<Link href={PORTFOLIO_LINK.href}>`, and `linksData.ts:55-57` sets `href: '/'`; `not-found.tsx:16` also has `<Link href="/">`.
    - There is one root layout (`src/app/layout.tsx`; `src/app/links/layout.tsx` is nested), so these are soft navigations.
- **Fix.**
  - In `subscribeSkyPlayback`, when the first subscriber arrives with no watcher (`if (!stopWatching)`), set `stored = null` and `playOverride = false` before attaching the listeners. Each mount of `/` then starts from storage and the OS setting.
  - State in PB1 and deviation 7 that "page view" means one mount of the home page.
  - Add an H12 case: subscribe, unsubscribe everything, change the stored key and the reduced-motion stub, subscribe again; the snapshot follows.
  - Neither StrictMode's development remount nor IntroGate's key flip is affected. `mountSky` stays subscribed through the flip, since `SkyCanvas` sits in the backdrop and mounts once. A development remount only re-reads storage before anyone could press Play.

### NJ-3 (minor): D5 understates what Vitest needs, by the Next.js Vitest guide

- **Section.** 3, D5 (`PLAN.md:172`); R-21.
- **Problem.** D5 prices Vitest as "one dev dependency and a config file; it resolves `@/` and extensionless imports through Vite".
  - The Next.js 16.4 guide resolves tsconfig paths with the `vite-tsconfig-paths` plugin in its TypeScript setup. Vite resolves extensionless relative imports by itself, but `@/` needs that plugin or a `resolve.alias` entry.
  - The harnesses do need `@/`: the worker files import `@/lib/sky/*` (5.2), and H12's store imports `@/lib/utils` (6.8).
- **Evidence.** `02-guides/testing/vitest.md:43-44` ("Using TypeScript": `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths`); `:68-71` (`tsconfigPaths()` in `vitest.config.mts`).
- **Fix.** Reword D5's Vitest option and cite `02-guides/testing/vitest.md`:
  - It needs `vitest`, plus `@/` resolution (`vite-tsconfig-paths`, as the guide uses, or a one-line `resolve.alias` in `vitest.config.mts`), and a `test` script.
  - It doesn't need `@vitejs/plugin-react`, jsdom or Testing Library, because the harnesses test DOM-free modules and stub `matchMedia` and `localStorage`.

### NJ-4 (minor): the hydration approach doesn't say why it skips the Next.js docs' browser-only patterns, and states one React behavior that react.dev doesn't document

- **Section.** 5.4 "No flash before hydration" (`PLAN.md:406-409`); 6.8 "Hydration" (`PLAN.md:1794`).
- **Problem.**
  - The Next.js 16.4 docs give their own patterns for UI that depends on browser-only data: `next/dynamic` with `ssr: false`, a `useEffect` gate that returns null, and React 19.3's `use(browser())`. The plan's `useSyncExternalStore` with a null server snapshot is the better choice here, because its hydration render matches the server HTML, which is the docs' own condition for not using `browser()`. But the plan doesn't say so, and an implementer reading the docs may reach for `browser()`, which would add a Suspense boundary for nothing.
  - "React re-renders with the real state right after" hydration is React's actual behavior, but the react.dev page doesn't describe it. The plan's safety doesn't depend on it anyway, since the visible control mounts after the reveal.
- **Evidence.**
  - `single-page-applications.md:205-221`, including line 219: "Use `use(browser())` only when a Client Component's first browser render cannot match server-rendered HTML". `react-dom` 19.3.1 exports `browser` (checked in `node_modules`).
  - react.dev `useSyncExternalStore` covers what `getServerSnapshot` is for, not the re-render after hydration.
- **Fix.**
  - Add one bullet to 5.4: "Not `use(browser())`, `next/dynamic({ ssr: false })` or a `useEffect` gate (`single-page-applications.md:205-221`): the control's first browser render is the server snapshot, null, which matches the server HTML, so the docs' condition for `browser()` doesn't hold, and it would need a Suspense boundary."
  - In 6.8 and 5.4, say the post-hydration re-render is React's behavior, and that nothing relies on it, because the control the visitor sees mounts fresh at the reveal.

### NJ-5 (minor): boundary and bundling citations are indirect, and D1's Server Component hosts need the `motion/react-client` rule

- **Section.** 5.2 "`'use client'`" and "Bundling" (`PLAN.md:380-385`); 3, D1 alternatives (a) and (b) (`PLAN.md:168`).
- **Problem.**
  - **The directive.** 5.2 supports "no directive on `SkyPauseToggle.tsx`" with the bundling sentence of `05-server-and-client-components.md`. The docs state the rule itself more directly in two places.
  - **The worker.** 5.2 cites only the magic-comment line, which the plan itself calls indirect. The stronger line, `turbopackWorkerAssetPrefix`, is cited only in section 13.
  - **D1 (a) and (b).** Both put the control inside a Server Component (`Introduction.tsx`, `AppFooter.tsx`) and allow it an entrance ("may slide and fade but must settle to neither"). They don't say that a Motion entrance wrapper in those files must come from `motion/react-client`.
- **Evidence.**
  - `use-client.md:10`: "You only need to add it to the files whose components you want to render directly within Server Components."
  - `server-and-client-boundary.md:273`: "You only need `'use client'` at the entry to a client subtree, not on every file inside it."
  - `08-turbopack.md:482`: `turbopackWorkerAssetPrefix`, "Custom asset prefix for Web Worker URLs (entrypoint + module chunks)".
  - AGENTS.md: "In Server Components, render Motion elements through named imports from `motion/react-client`". The existing hosts do this: `AppFooter.tsx:1`, `SidePane.tsx:1`.
- **Fix.**
  - In 5.2, cite `use-client.md:10` and `server-and-client-boundary.md:273` for the directive, and `08-turbopack.md:482` beside `:130` for the worker.
  - In D1 (a) and (b), add: "any entrance wrapper in that Server Component uses a named import from `motion/react-client` (AGENTS.md), or the entrance lives inside the client control."

## Summary

- **Verdict: pass.** No blocking or major finding.
- **What holds.** The plan's Next.js and React decisions match the installed 16.4.2 docs and react.dev:
  - the control lives in the existing Navbar client island, with no new boundary;
  - its state is a module-level external store read through `useSyncExternalStore`, with a null server snapshot and no module-scope browser access;
  - the worker bundling is unchanged, and `next/script`'s worker strategy is correctly rejected;
  - no Cache Components, `next/font`, metadata or route-segment APIs appear;
  - the P5 sketches pass the repository's ESLint rules, React Compiler rules included, and type-check against React 19.3 and Motion 12.38.
- **The five minor findings.**
  - NJ-1: run `get_errors` against a freshly loaded page, and check the server HTML.
  - NJ-2: reset the store's cached pause and Play override when the home page mounts again after a `<Link>` navigation.
  - NJ-3: correct D5's Vitest dependencies.
  - NJ-4: say why `use(browser())` and the other browser-only patterns aren't used.
  - NJ-5: cite the direct docs lines, and add the `motion/react-client` rule to D1's Server Component alternatives.
- **The confirmed veil interface** changes nothing in this scope. The veil's `mountSky.ts` diff touches rect measurement only, not the `motion()` wiring, the message listener or the reduced-motion query that P5 rewires.

## Verification

Skeptic pass, 2026-10-27. Each finding was re-checked against `PLAN.md`, the worktree code at 246c0aa, `COORDINATION.md` (including "Confirmed veil interface"), the installed Next.js 16.4.2 docs and source, react.dev, `react-dom` 19.3.1, and the Vite and Vitest docs. Two throwaway simulations of the 6.8 store test NJ-2 (`nj-skeptic/nj2-order.mjs` and `nj-skeptic/nj2-storage.mjs` in the session scratchpad, not in the repository). Result: all five are **partly** right, none is refuted, none is blocking or major, and NJ-2's fix must move before it is folded in.

- **NJ-1: partly.** Holds: `get_errors` takes no arguments (`next/dist/esm/server/mcp/tools/get-errors.js`, `inputSchema: {}`) and asks each connected browser session for its error state over HMR (`mcp.md:54`, `:88`); hydration runs only on a full load; a mismatch would sit in IntroGate's `display: none` preload tree, which the key flip discards (`IntroGate.tsx:94-100`); and AC-41's "absent during server rendering" has no method that can see the server HTML (its methods are MCP and S, scripted screenshots: `PLAN.md:3345`, `:3389`). Doesn't hold: with no browser session the tool doesn't "report nothing", it returns an explicit error saying no browser session is connected (same file), which nobody would read as "no warning". The silent false negative is a connected tab that hasn't fully reloaded since the change (Fast Refresh and `<Link>` navigations don't hydrate), which gets empty `configErrors` and `sessionErrors` lists. The fix's full reload covers that, and the `get_logs` file holds browser console output (`mcp.md:55`) with warnings and errors forwarded by default (`03-api-reference/05-config/01-next-config-js/logging.md:100-105`), so keep the fix, with this reason.
- **NJ-2: partly.** The problem holds, on a narrower path than stated: nothing on `/` links to another route (the logo's `<Link href="/">` cancels its navigation, `Navbar.tsx:95-104`), so the document must enter `/` by a `<Link>` (`PortfolioFooterLink.tsx:9-10`, `not-found.tsx:16`) and leave it by Back, which the App Router serves in the same document (`01-app/04-glossary.md:49`). The sky and the control live in `page.tsx:31-32`, not the root layout, and `next.config.ts` sets no `cacheComponents`, so both unmount while the visitor is on `/links`. The simulations reproduce both defects (a Play under reduced motion carries into the next mount; another tab's pause is missed). The fix is in the wrong place: `mountSky` computes `sentMotion = motion()` before it subscribes (`PLAN.md:1839-1848`) and is the first subscriber on a remount (IntroGate renders the backdrop before `#intro-content`, `IntroGate.tsx:74` and `:94`, and React runs an earlier sibling's passive effects first, `react-dom/cjs/react-dom-client.development.js:16849-16856`). A reset inside the first `subscribe` therefore lands after that stale read: `init` posts the stale `'full'` until `'ready'` corrects it, and that `'full'` sets M1's `skyMoved` latch (`PLAN.md:862`), so a sky that should load paused stops snapping to today's whole pixels (M1, AC-26). Reset `stored` and `playOverride` in the last-unsubscribe branch instead (or have `mountSky` subscribe before its first `motion()` read); the simulations then show a fresh `init`. H12's new case should read `skyPaused()` before subscribing again, as `mountSky` does. The PB1 and deviation 7 wording ("page view" means one mount of `/`) holds and matches the worker, which every remount recreates (M1, C8).
- **NJ-3: partly.** Holds: Vite resolves extensionless relative imports itself (`resolve.extensions`) but not tsconfig `paths` unless configured (the Next guide adds `vite-tsconfig-paths`, `02-guides/testing/vitest.md:44`, `:68-71`; Vite's built-in `resolve.tsconfigPaths` defaults to `false`, https://vite.dev/config/shared-options#resolve-tsconfigpaths); the harnesses import `@/` (`sky.worker.ts:7-12`, `renderSky.ts:1-20`, `skyAssets.ts:1-13`, and the 6.8 sketch's `@/lib/utils`); and the guide's `@vitejs/plugin-react`, jsdom and Testing Library aren't needed (Vitest's default environment is `node`, https://vitest.dev/config/environment). Doesn't hold: "understates". "One dev dependency and a config file" is exactly the cost of the auditor's own `resolve.alias` route, or of Vite's `resolve.tsconfigPaths: true`, which the finding leaves out. The real gaps are one clause (the config file maps `@/`) and the guide's `test` script (`vitest.md:92-103`): a rewording, not a cost correction.
- **NJ-4: partly.** Holds: the plan never says why it skips the browser-only patterns of `02-guides/single-page-applications.md:205-221` (`next/dynamic` with `ssr: false`, a `useEffect` gate, and `use(browser())`, which `react-dom` 19.3.1 exports), and that guide's own `browser()` example reads `localStorage` (`:223-244`), so an implementer could plausibly reach for it. The proposed 5.4 bullet is right: the first browser render uses the server snapshot, so `:219`'s condition fails, and `:221` would add a Suspense boundary. Overstated: the plan attributes only the quoted phrase to react.dev, and react.dev does imply the switch (it calls the server snapshot the initial value used until the app becomes interactive); 5.4 (`PLAN.md:409`) and 6.8 (`:1794`) already say the visible control mounts fresh at the reveal, so "nothing relies on it" is already there. The accurate correction to 6.8 is a different one: at hydration both snapshots are null here (`running` stays false until the worker's `'ready'`, which comes after `mountSky` runs in an effect), so no post-hydration re-render with a different state happens; the control first gets a state when the sky reports its first frame.
- **NJ-5: partly.** Holds: every cited line exists as described (`use-client.md:10`, `server-and-client-boundary.md:273`, `08-turbopack.md:482`). `:482` belongs beside `:130` in 5.2: it qualifies 5.2's "only for magic comments", since the docs also describe Web Worker entrypoint and module chunks there (the plan cites it only in section 13, `PLAN.md:3514`). `use-client.md:10` adds the converse that `05-server-and-client-components.md:178-180` lacks (a file rendered directly from a Server Component needs the directive), which backs 5.2's D1 sub-bullet. And a Motion element rendered in a Server Component host must come from `motion/react-client` (`AGENTS.md:17`, as `AppFooter.tsx:1` and `SidePane.tsx:1` do). Overstated: the current citation isn't indirect, since `05-server-and-client-components.md:180` already states that the directive isn't needed on every component meant for the client. The D1 fix is too narrow: the hero already animates through the shared client wrappers (`StaggerItem` from `@/components/motion`, a `'use client'` file; `Introduction.tsx:4`, `:16-22`), so the note should read "use the host's existing entrance pattern (`StaggerItem` in the hero, a `motion/react-client` element in the footer), or put the entrance inside the client control".
