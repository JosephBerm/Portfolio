# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 10

Date: 2026-10-28. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 10. Verdict: **pass** (no blocking or major finding; one minor finding, NJ10-1).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 10. Round 9's audit in this scope passed with no finding (`audit/nextjs-docs-gate-r9.md`), so there is no fix of mine to confirm and no rejection to challenge. I check round 9's revision (the reviser's fixes to the 20 findings the other lenses raised) for regressions in this lens, recheck the post-commit restructure, then sweep `PLAN.md` again. The sweep covers every decision that touches Next.js, React, Motion, or the Node APIs the harnesses use:
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
  - `PLAN.md` (3,655 lines, 58,867 words). Snapshot audited: `nextjs-gate-r10/PLAN.r10.md` in the session scratchpad, byte-identical to `PLAN.md` at the end of the audit (MD5 `3e8adb43…`).
  - `REVIEW-LOG.md`: round 9's rows, "Post-commit restructure (cf4d7b8)" and the earlier rows in this scope; the earlier reports in this scope (`audit/nextjs-docs*.md`, last `nextjs-docs-gate-r9.md`).
  - The code baseline: the read-only checkout of cf4d7b8 at `.claude/worktrees/sky-baseline-cf4d7b8` (HEAD `cf4d7b8`).
  - The installed Next.js 16.4.2 docs and source in the main checkout's `node_modules`; react.dev; Motion's docs through the `motion` MCP server; the Node.js v24 docs.
- **Outputs.** This file, and the same findings in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout, and no dev server was started or stopped.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r10/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed since round 9.** Round 9's audited snapshot (`nextjs-gate-r9/PLAN.r9.md`, MD5 `eb391b3f…`) is byte-identical to `PLAN.before-r9.md`. `git diff --no-index` against today's text gives 63 hunks (79 lines in, 77 out). I read every hunk; the ones that touch this lens are in the table below.
2. **The sketches.** I extracted the fenced code of 6.6, 6.8 and 6.13 from both snapshots (`nextjs-gate-r10/code.mjs`): identical, 299 lines each. `skyPause.ts`, `SkyPauseButton.tsx`, the navbar sketch, the `mountSky` wiring, the activity listener, the protocol block and `LEAN` are unchanged since round 8 built them.
3. **The round 9 rig, rerun** (`nextjs-gate-r10/rig`, a copy of round 9's: cf4d7b8's `mountSky.ts` and `protocol.ts` with P4's and P5's wiring, the P5 sketches, `Navbar.tsx` with 6.8's changes, the icons). Its `skyPause.ts` and `SkyPauseButton.tsx` equal today's sketches byte for byte, apart from the file-name comment line.
   - **tsc** 6.0.3 with the repository's compiler options: exit 0.
   - **ESLint** 10.13.0 with eslint-config-next 16.4.2 (eslint-plugin-react-hooks 7.1.1): 0 problems. A probe component that reads `ref.current` during render gets three `react-hooks/refs` errors, so the React Compiler rules ran.
4. **H12 smoke on Node 24.14.0** (`nextjs-gate-r10/h12`): 7.1's `register-hooks.mjs` and the store, both taken verbatim from today's `PLAN.md`, with `SKY_SRC` at cf4d7b8's `src` and stubs for `localStorage`, `matchMedia` and `window`. The store gives `null` before `setSkyRunning(true)`, `'playing'` by default, `'paused'` with `'1'` stored after a pause, removes both global listeners at the last unsubscribe, and reads storage and the reduced-motion setting afresh afterwards.
5. **Node claims, run on Node 24.14.0** (`nextjs-gate-r10/strip`):
   - `import { type X } from './b.ts'` loads `b.ts` at run time, while `import type { X } from './b.ts'` doesn't: 5.2's cycle rule holds.
   - `import('./w.ts?case=1')` and `import('./w.ts?case=2')` give two module instances, and a repeated query the same one: 7.1's fresh worker per case works through the hook.
   - Node v24 `module.md`: `module.register()` "deprecated: v24.15.0", Stability 0; `module.registerHooks()` Stability 1.2, release candidate.
6. **Docs.** I reopened every docs line `PLAN.md` cites, and the docs behind its unstated assumptions:
   - `08-turbopack.md:464` and `:470`: `turbopackMinify` and `turbopackMangleExportNames` are off in dev and on for builds, which is 5.4's reason for a production build per phase;
   - `01-getting-started/01-installation.md:53-60`: the browser floor (Chrome 111, Safari 16.4);
   - `02-guides/preserving-ui-state.md:13-17`: pages unmount on navigation unless Cache Components is on;
   - `dist/lib/find-root.js` (`findGitBoundary`, `isGitWorktree`): a nested git worktree is its own root.
7. **React and Motion.**
   - **react.dev**, `useSyncExternalStore` (fetched 2026-10-28): `getServerSnapshot` "will be used only during server rendering and during hydration of server-rendered content on the client", and a `subscribe` declared outside the component is never resubscribed.
   - **Motion** (`motion` MCP server, `motion://docs/react/react-motion-config`): with `reducedMotion: "user"`, "transform and layout animations will be disabled. Other animations, like `opacity` and `backgroundColor`, will persist."
   - **framer-motion 12.38.0** `filter-props.mjs`: `@emotion/is-prop-valid` isn't installed, so every prop that isn't a motion prop (`inert`, `onFocus`) is forwarded to the DOM.
8. **Re-grounding.** Every main-thread `file:line` in `PLAN.md`, against cf4d7b8 (list below).
9. **Lifecycle sweep.** Every main-thread resource the phases add, checked against `destroy` and App Router navigation: P4's listeners (`signal`), P5's subscription and running flag (`stopPlayback`, `setSkyRunning(false)`), P7's coalescing frame (cancelled in `destroy`), and P13's relay loop (NJ10-1).

## Round 9's findings in this scope

None: round 9's Next.js docs audit passed with no finding (`REVIEW-LOG.md`, "Gate round 9"). There is nothing to confirm and no rejection to challenge.

## Round 9's revision through this lens

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| The pointer listener sends nothing before the canvas's first size (`!size.width`) and clamps each axis | 6.13, line 2794; P7's files (3176) and verification (3185) | Right. It lives in `mountSky`'s closure, where `size` starts at `{ width: 0, height: 0, dpr: 0 }` (cf4d7b8 `mountSky.ts:217`) and is set only for a non-zero size, in the same call that posts `init` (`:245-272`). So the guard also keeps every `pointer` message after `init`. No layout read, nothing at module scope or during render. |
| The worker ignores a non-finite `at` | 6.13, line 2796 | Worker only; no effect on the client bundle or the protocol type. |
| `copyReader`'s doc names `clearOf` (P9) | 5.1 (338), 6.10 (2596), P9's files (3238), 8.4 (3390), CP-2 (3352) | A comment in a main-thread file. It names a worker-side symbol without importing it, so the main thread still imports only types and `@/lib/sky/color` from `src/lib/sky` (AGENTS.md:19). P9 already ends with 7.0's production build. |
| Section 6's intro: imports and constants leave with their last reader | line 400 | Right. `eslint.config.mjs:13` makes `no-unused-vars` a warning, `npm run lint` is `eslint .`, and `tsconfig.json` sets no `noUnusedLocals`, so tsc doesn't fail on them either. |
| 5.2's import list adds `./catalog` for `bodies.ts` | line 350 | A relative import inside `src/lib/sky`, so worker chunk only (AGENTS.md:19). |
| `LaunchGate.field()`, `leaseHeld`, `createPresence(0)`, the bars, the harness wording, the farewell band | 6.6, 6.9, 6.10, 6.12, H8, H9, P9, P12, AC-38, 11 | Worker, model or harness only; nothing touches Next.js, React, the client bundle or the build. |

## The restructure through this lens

- A grep for the old split's wording (CP-0, CP-3 to CP-5, PF, 8.5 to 8.7, D10, D11, R-1, R-2, "before V", "after V", "at V", "from V", "checkpoint V", "integration branch", "stable seams", "observed") finds only section 3's note that D10 and D11 went with the wait, "8.5%" (a percentage in 6.10) and P0's "hands-off" (meaning untouched).
- Every cross-reference in this lens resolves: 5.2 to D1, 5.4 to 7.0, 6.8 to 5.4, 7.0 to 5.4, P5 to AC-41, P7 to 6.13.
- What an implementer needs from this lens is still in place:
  - the island's placement and D1's alternatives (5.2, D1);
  - the hydration design (5.4, 6.8, PB4, R-12, AC-41);
  - the MCP checks and the full reload before `get_errors` (5.4, 7.0, P5);
  - the per-phase production build (7.0);
  - the dev-server rules: our own port, never another session's server (7.0);
  - the upgrade-reminder rule and the never-POST rule (7.0).

## Re-grounded references checked against cf4d7b8

- **`mountSky.ts`:** `:3`, `:17-27`, `:40-41`, `:52`, `:84-85` (the call also passes `{ name: 'sky' }`, which 5.2's quote of the pattern leaves out; nothing changes), `:122-124`, `:211`, `:214`, `:217`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
- **`Navbar.tsx`** (unchanged by cf4d7b8): `:1`, `:14`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`; its comment at `:100` confirms it renders only on `/`.
- **Other components:**
  - `IntroGate.tsx:54`, `:74` (`{backdrop}` outside the keyed div) and `:94-100`;
  - `SkyCanvas.tsx:20-29` (`mountSky` from an effect, `destroy` in its cleanup);
  - `page.tsx:31-32` (`IntroGate backdrop={<Background />}` and `<Navbar />` from the Server Component page, no props);
  - `SidePane.tsx:26`, `animations.ts:36`, `utils.ts:20`, `MotionProvider.tsx:7`, `protocol.ts:32-38`;
  - `PortfolioFooterLink.tsx:9-10` (a `next/link` to `'/'`, `linksData.ts:57`) and `not-found.tsx:16`;
  - `Introduction.tsx` and `AppFooter.tsx` carry no directive (Server Components), as D1 (a) and (b) assume; the hero uses `StaggerItem` (`Introduction.tsx:4`), the footer `motion/react-client` (`AppFooter.tsx:1`);
  - `globals.css:55`, `:80-83`; `Background.module.css:27-31`.
- **Configuration and docs files:**
  - `eslint.config.mjs:13`;
  - `next.config.ts`: `reactCompiler` on, no `cacheComponents`, and a static CSP whose `script-src 'self'` already admits the same-origin worker chunk;
  - `tsconfig.json`: `isolatedModules`, no `verbatimModuleSyntax`, no `noUnusedLocals`;
  - `.claude/launch.json` (tracked; `autoPort: true` for `portfolio-dev` and `portfolio-prod`); `.mcp.json` (`next-devtools-mcp@0.4.0`, `motion`);
  - `AGENTS.md`: the managed block at `:1-9`, the worker rule at `:19`, the `data-sky-quiet` line at `:20` that P5's line follows, the Cache Components line at `:21`, the MCP line at `:22`.

All hold.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| **The island.** `SkyPauseButton.tsx` has no directive and is rendered only by `Navbar.tsx` (`'use client'` at `:1`), which the Server Component page renders with no props (`page.tsx:32`). Under D1 (a) or (b) the control's own file gains the directive and the host stays a Server Component; only `className`, a string, crosses. | `use-client.md:10`; `05-server-and-client-components.md:178-188`; `Introduction.tsx:4`; `AppFooter.tsx:1` |
| **Browser APIs** run only inside functions on the client, never at module scope or during the server render; `getSnapshot` touches storage and `matchMedia` only once `running` is true | `05-server-and-client-components.md:26`; the sketch (`PLAN.md:1725-1842`) |
| **Hydration.** `useSyncExternalStore` with `serverSkyPlayback` returning `null`. Both snapshots are `null` at hydration, since `running` turns true only on the worker's first frame, after `mountSky`'s effect. The visible navbar mounts fresh after IntroGate's key flip, where React reads `getSnapshot`. No inline script is needed. | `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; react.dev; `IntroGate.tsx:74`, `:94-100` |
| **One store for both islands.** `skyPause.ts` is imported only by client modules (`SkyPauseButton` through `Navbar`, `mountSky` through `SkyCanvas`), never by a Server Component, so the control and the controller share one module instance in the page's client runtime | the sketches (`PLAN.md:1857`, 6.8's wiring); `SkyCanvas.tsx:5` |
| **A page view is one mount**: without Cache Components the home page unmounts on navigation, so the last unsubscribe resets the cached pause and any Play | `preserving-ui-state.md:13-17`; `next.config.ts` |
| **The Web Worker** under Turbopack: the entry is unchanged and model files join its chunk by static import; a nested git worktree is its own root for the per-phase build | `08-turbopack.md:130`, `:482`; `dist/lib/find-root.js` |
| **A production build per phase** checks what dev doesn't: builds minify and mangle export names | `08-turbopack.md:464`, `:470` |
| **No `next/script` worker strategy**; no `next/font`, metadata, route-segment config, Suspense, Activity or Cache Components API (`instant` appears only as `scrollTo`'s behavior; `activity` is the plan's own message) | `scripts.md:128`; grep of `PLAN.md`; `AGENTS.md:21` |
| **React Compiler.** The store's functions are module-level and aren't compiled (no component or hook names); `getSnapshot` returns a string or `null`, stable under `Object.is`; the header's ref is read only in the scroll callback, outside render. The P5 code passes the compiler's lint rules on cf4d7b8. | `next.config.ts` (`reactCompiler`); the rig (Method step 3) |
| **`inert={mobileMenuOpen}` and `onFocus` on Motion elements**: React 19 takes the boolean, Motion forwards both, and tsc accepts them | the rig; `framer-motion` `filter-props.mjs` |
| **`querySelector(':focus-visible')`** never throws inside Next.js 16's browser floor (the selector needs Chrome 86 and Safari 15.4). `inert` arrived in Firefox 112, one release above the floor's Firefox 111, where the attribute is ignored and the covered control merely stays in the tab order: no error | `01-installation.md:53-60` |
| **Motion under reduced motion.** `MotionConfig reducedMotion="user"` keeps the control's entrance to an opacity fade, like the other nav items; 7.0 queries the `motion` docs before P5's entrance | `MotionProvider.tsx:7`; Motion docs, MotionConfig |
| **The `next dev` MCP checks.** `get_errors` takes no route and reads browser sessions with the page open; `get_logs` names the log file; `compile_route` takes a path such as `/`; `get_compilation_issues` needs no browser; `nextjs_call` takes `port`, `toolName` and optional `args`, omitted when a tool takes none | `mcp.md:54`, `:55`, `:60-61`, `:88`; next-devtools-mcp's `nextjs_call` schema |
| **7.1's resolve hook and type stripping** on Node 24 | `module.md` (`registerHooks`; `register` deprecated v24.15.0); the H12 run and Method step 5 |
| **D5's Vitest option** | `testing/vitest.md:43-44`, `:68-71`, `:92-103` |

## Findings

### NJ10-1 (minor): P13's main-thread relay loop never stops when the sky is destroyed

- **Section.** P13 (files, steps and verification); 6.13's P13 sentence.
- **Problem.** P13 adds a main-thread animation-frame loop that posts `tick` "while the worker asks for it", but nothing stops it when `mountSky` is destroyed. `destroy` terminates the worker, which then can never send `{ type: 'relay', on: false }`. On an App Router navigation away from `/`, which keeps the document, the loop keeps posting to a dead worker on every frame until a reload.
- **Evidence.**
  - `PLAN.md` P13's files (line 3329): "`mountSky.ts`: the `relay` case in P5's message `switch`, and a main-thread rAF loop that posts `tick` while the worker asks for it." Its steps (3331) and verification (3333-3336) never mention `destroy`.
  - 6.13 (line 2795) gives P7's coalescing frame "the pending frame cancelled in `destroy`", and P7's files repeat it (3176). P13 has no counterpart, and neither do D7 (167) or R3 §2.6 (`research/R3-rendering-engineering.md:218-220`), which describe only the worker's on and off.
  - cf4d7b8 `mountSky.ts:316-326`: `destroy` aborts the listeners (`:320`) and terminates the worker (`:324`). An `AbortSignal` doesn't cancel a `requestAnimationFrame` chain.
  - `destroy` runs on a live page: `SkyCanvas.tsx:25-28` calls it when the home page unmounts, which without Cache Components happens on every navigation away (`preserving-ui-state.md:13-17`; `next.config.ts` has no `cacheComponents`). App Router navigations keep the document, as 6.8 itself relies on (line 1844).
  - A common path: `/links`, then "View Full Portfolio" (`PortfolioFooterLink.tsx:9-10`, a `next/link` to `'/'`, `linksData.ts:57`), then Back, a client-side navigation. If the worker held the relay at that moment (WebKit's unaligned clock with a vsync demand, so the hero's drift on Safari), `/links` keeps a main-thread loop posting `tick` to a terminated worker. That is the platform P13 exists for, and its go criteria include a Low Power Mode drain (line 3326).
- **Fix.** In P13's `mountSky.ts` line, add "its pending frame cancelled in `destroy`, as P7's is", and say the same in 6.13's P13 sentence. Add to P13's verification: "after `/links`, View Full Portfolio, then Back, a main-thread trace on `/links` shows no relay frames."

## Summary

- **Verdict: pass.** One minor finding (NJ10-1), no blocking or major one.
- **Round 9 had no finding in this scope**, so there was nothing to confirm. Its revision changed no main-thread code sketch: the 6.6, 6.8 and 6.13 code blocks are byte-identical to round 9's. Its prose changes in this lens hold at cf4d7b8: the pointer's size guard and clamp in `mountSky`'s closure, `copyReader`'s doc naming `clearOf`, and the rule that unread imports leave with their last reader. The rest is worker, model or harness only.
- **The P5 code still builds on cf4d7b8.** tsc is clean, ESLint is clean with the React Compiler rules active, and 7.1's hook runs the store, taken verbatim from today's plan, under Node 24.14 as H12 describes.
- **Every cited docs line still says what the plan says**: the Next.js 16.4.2 docs, react.dev, Motion and Node v24. No Cache Components, `next/script`, `next/font`, metadata or route-segment API appears.
- **NJ10-1** is a one-clause fix in a conditional phase: stop P13's relay loop in `destroy`, as P7 already does for its frame.

Scratch evidence is in `nextjs-gate-r10/` in the session scratchpad, not in the repository:

- `PLAN.r10.md`, the snapshot audited, and `diff-r9-r10.txt`, its diff from round 9's snapshot;
- `code.mjs`, `PLAN.r9.code.txt` and `PLAN.r10.code.txt`: the extracted code blocks of 6.6, 6.8 and 6.13;
- `rig/`: round 9's cf4d7b8 rig with P4 and P5 applied, rerun with tsc and ESLint;
- `h12/`: 7.1's `register-hooks.mjs` and the store, both taken verbatim from `PLAN.md`, with `h-pause.ts`;
- `strip/`: the Node 24 checks of inline type imports and query-string module instances.
