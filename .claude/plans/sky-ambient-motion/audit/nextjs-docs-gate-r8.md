# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 8

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 8. Verdict: **pass** (no blocking, major or minor findings).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 8. I confirm round 7's finding in this scope (NJ7-1), check the post-commit restructure through this lens, then sweep `PLAN.md` again. The sweep covers every decision that touches Next.js, React, Motion, or the Node APIs the harnesses use:
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
  - `PLAN.md` (3,664 lines, the uncommitted restructure). Snapshot audited: `nextjs-gate-r8/PLAN.r8.md`, byte-identical to the restructurer's `restructure/work.md`.
  - `REVIEW-LOG.md`: round 7's rows and "Post-commit restructure (cf4d7b8)".
  - The earlier reports in this scope (`audit/nextjs-docs*.md`, last `nextjs-docs-gate-r7.md`).
  - The code baseline: the read-only checkout of cf4d7b8 at `.claude/worktrees/sky-baseline-cf4d7b8`.
  - The installed Next.js 16.4.2 docs and source in the main checkout's `node_modules`; react.dev; Motion's docs through the `motion` MCP server; the Node.js v24 docs.
- **Outputs.** This file, and the same (empty) findings list in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout, and no dev server was started or stopped.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r8/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed in this scope.**
   - Diffed sections 5.2, 5.3, 5.4, 6.6, 6.8, 6.13, 7.0, 7.1 and P4, P5, P7, P13 three ways: round 7's snapshot (`nextjs-gate-r7/PLAN.r7.md`) against today's text, and the pre-restructure copy (`PLAN.before-restructure.md`) against today's text.
   - Diffed 1, 3, 4.4, 5.1, 9.2, 11, 12 and 13 against the pre-restructure copy.
   - The results:
     - 5.4 is unchanged.
     - The `skyPause.ts` and `SkyPauseButton.tsx` sketches are byte-identical to round 7's.
     - 6.8 changed only in its re-grounded line numbers and the AGENTS.md sentence.
2. **Stale split wording.** Grepped `PLAN.md` for CP-0, CP-3 to CP-5, PF, 8.5 to 8.7, D10, D11, R-1, R-2, "before V", "after V", "at V", "from V", "integration branch", "hands-off" and "stable seams".
   - The only hits are 3's note that D10 and D11 went with the wait, 8.1's "What the old checkpoint V did now lives in the phases", and P0's "hero hands-off" (a different sense).
   - Every section cross-reference resolves (5.1 to 5.4, 6.1 to 6.13, 7.0 to 7.2, 8.1, 8.2, 8.4).
3. **Re-grounding.** Checked every main-thread `file:line` against cf4d7b8, plus the worker lines that the pause wiring and presence feed. The full list is below.
4. **Docs.**
   - Re-opened every docs line `PLAN.md` cites.
   - Read the 16.4 docs on running `next dev` and `next build` side by side, the dev lock, the `next start` port, and workspace-root detection in a nested git worktree. The per-phase production build relies on these.
5. **A rig on the new baseline** (`nextjs-gate-r8/rig`).
   - **Setup.** `apply-p5.mjs` applied P4's activity listener and P5's pause wiring (6.6, 6.8) to cf4d7b8's own `mountSky.ts` and `protocol.ts`. Every anchor the plan cites was found:
     - in `mountSky.ts`: the `:3` import, `:211`, `:214`, `init`'s `motion`, `:310`, `:312`, `destroy` and the `:328-335` listener;
     - in `protocol.ts`: the `SkyMotion` doc.

     The rig also holds the P5 sketches, `Navbar.tsx` with 6.8's changes, and cf4d7b8's icons plus `PauseSVG` and `PlaySVG`. `@/*` resolves to the rig first, then to cf4d7b8's `src`.
   - **tsc** (TypeScript 6.0.3, the repository's compiler options): exit 0.
   - **ESLint** (eslint 10.13.0, eslint-config-next 16.4.2 with eslint-plugin-react-hooks 7.1.1, the repository's rules): 0 problems. A probe file got a `react-hooks/refs` error, which shows the React Compiler rules ran.
6. **React, Motion, Node.**
   - **react.dev:** `useSyncExternalStore` (already cited).
   - **Motion** (`motion` MCP server, `motion://docs/react/react-motion-config`), plus the installed source:
     - framer-motion's `filter-props.mjs`, for how `inert` is forwarded;
     - motion-dom's `spring.mjs`.
   - **Node.js v24 docs:** `module.md` (`registerHooks`, `register`).
   - **Node 24.14.0 runs:**
     - the plan's resolve hook loading cf4d7b8's modules;
     - query-string imports for H13's fresh workers;
     - type stripping of inline `type` specifiers against statement-level `import type`.

## Round 7's finding in this scope

### NJ7-1 (major, round 7): resolved by the restructure

- **Round 7's problem.** The veil's hands-off list named the function `mountSky`, while `PLAN.md` still called its activity, pointer and pause wiring "ours, from P1".
- **What the reviser did.** Folded it into the CP-0 request and 8.6.
- **What the restructure did.** cf4d7b8 has landed and is on `origin/master` (`COORDINATION.md:232-240`, "Checkpoint V is reached"), so the restructure removed the wait, the overlaps and the decline branch. The current text handles `mountSky` correctly:
  - **4.4** (`PLAN.md:311`). cf4d7b8 "is this plan's baseline, so its code is the code every phase edits". Its rules stay the veil session's, and 8.4 lists the veil symbols.
  - **8.4's `mountSky.ts` row** (`PLAN.md:3395`). It lists `mountSky` among the veil symbols with "the measurement unchanged; our listeners and the pause wiring join `mountSky` beside it", for P4, P5, P7 and P13. 5.1's row agrees (`PLAN.md:338`: "the veil's rect measurement unchanged").
  - **cf4d7b8's own diff agrees.** Inside `mountSky` it changes only the `headrooms` map and `measureLayout`: hunks `@@ -155,0 +221 @@` and `@@ -163,2 +229,3 @@` of `git diff -U0 246c0aa cf4d7b8 -- src/components/sky/mountSky.ts`. P4's, P5's and P7's edits touch other lines.
  - **The Blocked-on lines.** P5 is now "P3" (`PLAN.md:3098`), P4 "P5 merged" (`:3068`), P7 "P6" (`:3173`) and P13 "P6 and the tests". No veil answer gates them.
- **The rig confirms it.** The wiring applies cleanly to cf4d7b8's `mountSky.ts` and compiles and lints, with no `reducedMotion` or `REDUCED_MOTION_QUERY` left in it.

No regression: the fix's text is gone with the split, and what replaced it states the one-tree reading.

## The restructure through this lens

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| The worker entry's citation moved to `mountSky.ts:84-85` | 5.2, line 366 | Right: line 84 is the bundler comment, line 85 `new Worker(new URL('./sky.worker.ts', import.meta.url), { name: 'sky' })`. Turbopack's docs lines are unchanged. |
| The main-thread diagram drops "veil handler" | 5.3, lines 373 to 374 | Right: the `scroll` body changes only in P8 (`parallaxScroll`), and the `layout` path is the veil's, with its deferred layout. |
| 6.8's wiring re-grounded: `motion()` `:214`, the query, import and listener `:3`, `:211`, `:312`, the listener `:328-335`, `destroy` `:316-326`, `protocol.ts:32-38` | 6.8, lines 1946 to 1966 | All right at cf4d7b8, and the rig applied each one. |
| The AGENTS.md line goes "after the `data-sky-quiet` line and its quiet-copy precondition" | 6.8, line 1967 | Right: at cf4d7b8 that is one bullet (`AGENTS.md:20`). The new line falls before the Cache Components bullet and outside `next dev`'s `<!-- BEGIN/END:nextjs-agent-rules -->` markers (lines 1 and 9), which are all `generate-agent-files.js` rewrites. |
| The activity listener's anchor `mountSky.ts:310-314` | 6.6, line 1647 | Right: those are today's `syncMotion` and listener lines. |
| The debug patch's `else destroy()` at `mountSky.ts:332` | 7.1, line 2893 | Right. |
| P5's Blocked-on is P3 alone | P5, line 3098 | Right: `pacing.ts`'s eases and `FrameState` come from P3. |
| 7.0 rewritten for one tree (PRs into `origin/master`, our own `portfolio-dev`, "another session's server", the MCP checks pointed at our port, the build smoke test, the upgrade reminder, never POST) | 7.0, lines 2818 to 2836 | Nothing in this lens was lost. `.claude/launch.json` at cf4d7b8 has `autoPort: true` for both `portfolio-dev` and `portfolio-prod`. |
| `headroom` sentence reworded | 6.13, line 2788 | Right: `SkyRect.headroom` exists at cf4d7b8 (`protocol.ts:24-29`). |

## Re-grounded references checked against cf4d7b8

- **Main thread.**
  - `mountSky.ts`: `:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
  - `Navbar.tsx`: `:1`, `:14`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:73`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`. The file is unchanged by cf4d7b8.
  - `IntroGate.tsx:54` and `:94-100`; `SidePane.tsx:26` (its comment changed above, but the delay line stayed); `animations.ts:36`.
  - `utils.ts:20`; `globals.css:55`, `:80-83` and `:273-278`; `Background.module.css:27-31`.
  - `not-found.tsx:16`; `PortfolioFooterLink.tsx:9-10` (in `src/components/links/`); `Card.tsx:7`; `protocol.ts:32-38`; `README.md:75` and `:80`.
- **Worker lines the pause wiring and presence feed.**
  - `sky.worker.ts:100-128` (`isIdle`, `idleTwinkle`, `noteInput`), `:111-113`, `:163-165`, `:301`.
  - In the message handler: `:467-493` (`init`), `:486`, `:487`, `:503-509` (`motion`), `:510-524` (`visible`), `:519`, `:531`, `:533`, `:535`, and `:551` (`schedule(now)` after every message).
  - `config.ts:223-237` (`FRAME`).
  - The first frame posts `'ready'` from `draw` (`:337-340`).

All hold.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| **The island.** `SkyPauseButton.tsx` has no directive and is rendered only by `Navbar.tsx` (`'use client'`, `Navbar.tsx:1`), which `page.tsx:32` renders from a Server Component. Under D1 (a) or (b), the file gains the directive, the host (`Introduction.tsx` or `AppFooter.tsx`, both Server Components at cf4d7b8) stays a Server Component, and only `className`, a string, crosses. | `use-client.md:10`; `05-server-and-client-components.md:178-182` |
| **Browser APIs** stay inside functions, never at module scope, and the store is read only from client code | `05-server-and-client-components.md:26`; the sketch (`PLAN.md:1726-1839`) |
| **Hydration.** `useSyncExternalStore` with a null `getServerSnapshot` and no `next/dynamic`, `useEffect` gate or `use(browser())`. `running` is false until the worker's first frame, so both snapshots are null at hydration; React's post-commit snapshot check finds no change, and a later change re-renders without a hydration error. | `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221` (line 219: `use(browser())` "only when a Client Component's first browser render cannot match server-rendered HTML"); react.dev on `getServerSnapshot`; `IntroGate.tsx:94-100` (the reveal remounts the navbar; `backdrop`, and so `mountSky`, sits outside the keyed div at `:74`) |
| **A page view is one mount**, and the last unsubscribe resets the cached pause and Play | `preserving-ui-state.md:13-17` (without Cache Components pages unmount; `next.config.ts` sets no `cacheComponents`) |
| **The Web Worker** under Turbopack: unchanged entry, and model files join the chunk by static import | `08-turbopack.md:130`, `:482` |
| **No `next/script` worker strategy**; no `next/font`, metadata, route-segment config, Suspense, Activity or Cache Components API in the plan | `scripts.md:128`; grep of `PLAN.md`; `AGENTS.md:21` |
| **React Compiler.** The compiler runs only on files with JSX or hooks (so not `skyPause.ts`), and the store functions are module-level and stable. The P5 code passes the compiler lint rules on cf4d7b8 (rig, with the probe showing the rules are active). | `reactCompiler.md:12`; `next.config.ts` (`reactCompiler` on) |
| **The `next dev` MCP checks.** `get_errors` takes no route and reads browser sessions with the page open; `get_logs` names the log file; `compile_route` takes a path; `nextjs_call` takes `port`, `toolName` and optional `args` (next-devtools-mcp 0.4.0 schema). A hydration error reaches the log through `browserToTerminal`, whose default `'warn'` forwards warnings and errors. | `mcp.md:54`, `:55`, `:60-61`, `:88`; `logging.md:98-102` |
| **The per-phase production build** in `.claude/worktrees/sky-ambient-motion-impl`. Stopping our dev server first isn't required by the docs, but it follows AGENTS.md ("instead of `next build`" while `next dev` runs), so it stands. Root detection stops at a git worktree boundary, so the nested worktree doesn't adopt the main checkout's lockfile. Its own `.next/dev/lock` keeps our server separate from another session's, and `next start` honors `PORT`, so `portfolio-prod` with `autoPort` works. | `06-cli/next.md:60`, `:70`; `upgrading/version-16.md:895`; `02-guides/ai-agents.md:132`; `dist/lib/find-root.js` (`findGitBoundary`, `isGitWorktree`) |
| **`inert={mobileMenuOpen}` on `motion.div`.** React 19 takes the boolean, and Motion forwards it: with no `@emotion/is-prop-valid` installed, every non-motion prop is forwarded. | `framer-motion/dist/es/render/dom/utils/filter-props.mjs`; tsc on the rig |
| **Motion under reduced motion.** `MotionConfig reducedMotion="user"` (`MotionProvider.tsx:7`) disables transform and layout animations and keeps opacity, so the control's entrance fades like the other nav items. The navbar entrance query is in 7.0. | Motion docs, MotionConfig (`motion` MCP) |
| **6.1's critically damped spring** is the closed form Motion uses | motion-dom `spring.mjs:232-240` |
| **7.1's resolve hook.** It loads cf4d7b8's modules: `ZONE_REACH` 40, `STAR_INK_PEAK` 0, `scrollKept(0, 18)` 0.5. Query strings give fresh module instances (H13). An inline `type` specifier keeps the runtime import and `import type` drops it, as 5.2 says. | Node 24.14.0 runs (`h-load.ts`, `h-query.ts`, `strip/`) |
| **`module.registerHooks()` over `module.register()`.** `registerHooks` was added in v23.5.0 and v22.15.0 and has been a release candidate since v24.13.1; `module.register()` was deprecated in v24.15.0. | https://nodejs.org/docs/latest-v24.x/api/module.md |
| **D5's Vitest option** | `testing/vitest.md:43-44`, `:68-71`, `:92-103` (unchanged since round 7) |

## Findings

None. No blocking, major or minor finding in this scope.

## Summary

- **Verdict: pass.**
- **NJ7-1 is resolved.** The restructure made cf4d7b8 the baseline and removed the wait. 8.4 now names `mountSky` as a veil symbol whose measurement stays unchanged, and our wiring joins it beside the veil's lines, which are only `headrooms` and `measureLayout`. P4, P5 and P7 are no longer gated on a veil answer.
- **The restructure lost nothing an implementer needs in this lens.** The hydration design, the island's placement, the MCP checks, the build smoke test and the dev-server rules all survive. Every main-thread and related worker `file:line` it re-grounded is correct at cf4d7b8.
- **P4's and P5's main-thread code builds on cf4d7b8 as written.** Applied to cf4d7b8's own `mountSky.ts`, it type-checks and passes the repository's ESLint rules, the React Compiler rules included.
- **Every cited docs line still says what the plan says.** The newer 16.4 docs on concurrent dev and build, the dev lock and worktree root detection support the per-phase build in a nested worktree.

Scratch evidence is in `nextjs-gate-r8/` in the session scratchpad, not in the repository:
- `PLAN.r8.md`, the snapshot audited;
- `sect.mjs`, the section extractor used for the diffs;
- `skyPause.r8.ts`, `SkyPauseButton.r8.tsx` and `wiring.r8.ts`, the extracted sketches;
- `apply-p5.mjs` and `rig/`, the cf4d7b8 rig with P4 and P5 applied, its `tsconfig.json` and the ESLint config;
- `register-hooks.mjs`, `h-load.ts`, `h-query.ts` and `strip/`, the Node 24 checks.
