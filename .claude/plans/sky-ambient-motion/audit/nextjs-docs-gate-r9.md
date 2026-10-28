# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 9

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 9. Verdict: **pass** (no blocking, major or minor findings).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 9. Round 8 raised no finding in this scope (`audit/nextjs-docs-gate-r8.md` passed), so there is no fix of mine to confirm and no rejection to challenge. I check round 8's revision (the reviser's fixes to 25 findings from other lenses) for regressions in this lens, recheck the post-commit restructure, then sweep `PLAN.md` again. The sweep covers every decision that touches Next.js, React, Motion, or the Node APIs the harnesses use:
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
  - `PLAN.md` (3,653 lines, 58,308 words). Snapshot audited: `nextjs-gate-r9/PLAN.r9.md` in the session scratchpad, byte-identical to `PLAN.md` at the end of the audit (MD5 `eb391b3f…`).
  - `REVIEW-LOG.md`: round 8's rows, "Post-commit restructure (cf4d7b8)" and the earlier rows in this scope.
  - The earlier reports in this scope (`audit/nextjs-docs*.md`, last `nextjs-docs-gate-r8.md`).
  - The code baseline: the read-only checkout of cf4d7b8 at `.claude/worktrees/sky-baseline-cf4d7b8` (HEAD `cf4d7b86b63a…`).
  - The installed Next.js 16.4.2 docs and source in the main checkout's `node_modules`; react.dev; Motion's docs through the `motion` MCP server; the Node.js v24 docs.
- **Outputs.** This file, and the same (empty) findings list in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout, and no dev server was started or stopped.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r9/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers.

## Method

1. **What changed since round 8.** Round 8's audited snapshot (`nextjs-gate-r8/PLAN.r8.md`) is byte-identical to `PLAN.before-r8.md`. `git diff --no-index` against today's text gives 86 hunks (114 lines in, 125 out). I read every hunk and checked the ones that touch this lens (table below).
2. **The sketches.** Extracted every code block of 6.6, 6.8 and 6.13 from both snapshots and diffed them. The only differences are two doc comments in `presence.ts` (6.6). `skyPause.ts`, `SkyPauseButton.tsx`, the navbar sketch and the `mountSky` wiring are unchanged since round 8 built and linted them.
3. **Stale split wording.** Grepped for CP-0, CP-3 to CP-5, PF, 8.5 to 8.7, D10, D11, R-1, R-2, "before V", "after V", "at V", "from V", "checkpoint V", "integration branch", "hands-off", "stable seams" and "observed". The only hits are section 3's note that D10 and D11 went with the wait, and "8.5%" (a percentage in 6.10).
4. **Re-grounding.** Every main-thread `file:line` in `PLAN.md`, the two citations the round 8 reviser added among them (`mountSky.ts:122-124` in 6.10, `eslint.config.mjs:13` in section 6's intro), against cf4d7b8. The list is below.
5. **Docs.** Re-opened every docs line `PLAN.md` cites, and the docs behind its unstated assumptions: `preserving-ui-state.md` (page unmounting without Cache Components), `06-cli/next.md` (`PORT`, `next dev` beside `next build`) and `dist/lib/find-root.js` (workspace root in a nested git worktree).
6. **The round 8 rig, rerun** (`nextjs-gate-r9/rig`, a copy of round 8's: cf4d7b8's `mountSky.ts` and `protocol.ts` with P4's and P5's wiring applied, the P5 sketches, `Navbar.tsx` with 6.8's changes, the icons):
   - **tsc** 6.0.3 with the repository's compiler options: exit 0.
   - **ESLint** 10.13.0 with eslint-config-next 16.4.2 and the repository's rules: 0 problems. A probe component that reads `ref.current` during render gets three `react-hooks/refs` errors, so the React Compiler rules ran.
7. **H12 under Node 24.14.0** (`nextjs-gate-r9/h12`): 7.1's `register-hooks.mjs` verbatim, `SKY_SRC` at cf4d7b8's `src`, and stubs for `localStorage`, `matchMedia` and `window`. The store loads (its `@/lib/utils` import pulls `clsx` and `tailwind-merge` from the main checkout's `node_modules`), and it behaves as 6.8 says: `null` before `setSkyRunning(true)`, `'playing'` by default, `'paused'` with `'1'` stored after a pause, both global listeners removed at the last unsubscribe, and a fresh read of storage and the reduced-motion setting afterwards.
8. **React, Motion, Node.**
   - **react.dev**, `useSyncExternalStore`: `getServerSnapshot` "will be used only during server rendering and during hydration of server-rendered content on the client". The page has added "of server-rendered content on the client" since the plan quoted it, so the plan's fragment ("only during server rendering and during hydration") is still verbatim, and the meaning is unchanged.
   - **Motion** (`motion` MCP server, `motion://docs/react/react-motion-config`): with `reducedMotion: "user"`, "transform and layout animations will be disabled. Other animations, like `opacity` and `backgroundColor`, will persist."
   - **Node.js v24 docs:**
     - `module.md`: `module.register()` "deprecated: v24.15.0"; `module.registerHooks()` added in v23.5.0 and v22.15.0, a release candidate since v24.13.1.
     - `deprecations.md`: DEP0205 is `module.register()`, documentation-only since v24.15.0.
   - **next-devtools-mcp** 0.4.0 (`.mcp.json`): `nextjs_call` takes `port`, `toolName` and optional `args`.

## Round 8's findings in this scope

None: round 8's Next.js docs audit passed with no finding (`REVIEW-LOG.md`, "Gate round 8"). There is nothing to confirm and no rejection to challenge.

## Round 8's revision through this lens

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| 5.4's production-build bullet now points to 7.0 | 5.4, line 396; 7.0, line 2829 | Nothing lost. 7.0 keeps "with our dev server stopped, `npm run build`, then the `portfolio-prod` preview. The sky must draw with no console errors", and 7.0's "Where" puts every phase in the implementing worktree. Stopping our own server is more than the docs require (`06-cli/next.md:60`: dev writes to `.next/dev`, so `next dev` and `next build` can run together), but it follows AGENTS.md's "instead of `next build`" while `next dev` runs. |
| 6.8's hydration bullet now points to 5.4 | 6.8, line 1893; 5.4, lines 387 to 391 | Nothing lost. 5.4 keeps the docs quote (`preventing-flash-before-hydration.md:11`), the react.dev quote, both snapshots `null` at hydration, why not `next/dynamic`, a `useEffect` gate or `use(browser())` (`single-page-applications.md:205-221`, the `browser()` condition at `:219`), and IntroGate's key flip (`IntroGate.tsx:94-100`). |
| 6.8's list of store checks folded into H12 | 6.8, line 1848; H12, line 2904 | Nothing lost. All six behaviors are in H12, which adds `running`, the unsubscribe and the remount. The H12 smoke in Method step 7 runs on Node 24 as 7.1 describes. |
| Section 6's intro: an unread import or module constant is a lint warning | line 400 (also 823 and 2440) | Right. `eslint.config.mjs:13` at cf4d7b8 is `'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]`, and `npm run lint` is `eslint .` (`package.json`). |
| `SkyMotion`'s `full` doc grows from P5 to P8 | 6.8, line 1957; P6, P7 and P8 files (lines 3135, 3174, 3196); 6.13, line 2769 | Consistent: P5's text plus P6's drift, P7's lean and P8's "transients" gives 6.13's line. cf4d7b8's doc is `protocol.ts:32-38`. A doc comment only, with no effect on the client bundle or the protocol's types. |
| `presence.ts` doc comments | 6.6, lines 1608 and 1618 | Comment text only. |
| P5: AC-26 compares with P0's screenshots with the navbar masked | P5, line 3122; AC-26, line 3453 | Right. The control renders in the navbar once the sky's first frame arrives, so a P0 screenshot (no control) can only match with the navbar masked. |
| `SkyField.pinned`, with `import type { SkyRect } from './protocol'` | 6.9, lines 1982 and 2001 | A relative, statement-level type import inside `src/lib/sky` (5.2's rule, AGENTS.md:19). Nothing new reaches the main thread or the client bundle. |
| `mountSky.ts:122-124` cited for the rails' link colors | 6.10, line 2608 | Right at cf4d7b8: `copyReader`'s doc on a link that changes color on hover and focus. The citation adds no main-thread change. |
| 7.0's local-`master` rule in CP-1, P8's added dependencies, the rollback notes | 8.2, 7.2, P1 to P6 | Outside this lens; nothing in them touches Next.js, React or the build. |

## The restructure through this lens

Round 8 checked the restructure in full (`nextjs-docs-gate-r8.md`, "The restructure through this lens"). Rechecked here:

- The stale-wording grep (Method step 3) finds nothing new.
- Every section cross-reference in this lens resolves: 5.2 to D1, 5.4 to 7.0, 6.8 to 5.4, 7.0 to 5.4, P5 to AC-41.
- What an implementer needs from this lens is still in place:
  - the island's placement and D1's alternatives (5.2, D1);
  - the hydration design (5.4, 6.8, PB4, R-12, AC-41);
  - the MCP checks and the full reload before `get_errors` (5.4, 7.0, P5);
  - the per-phase production build (7.0);
  - the dev-server rules: our own port, never another session's server (7.0);
  - the upgrade-reminder rule and the never-POST rule (7.0).

## Re-grounded references checked against cf4d7b8

- **`mountSky.ts`:** `:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:122-124`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
- **`Navbar.tsx`** (unchanged by cf4d7b8): `:1`, `:14`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:73`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`.
- **Other components:**
  - `IntroGate.tsx:54` and `:94-100`, with `{backdrop}` outside the keyed div at `:74`;
  - `SkyCanvas.tsx` (`mountSky` from a `useEffect`);
  - `SidePane.tsx:26`; `animations.ts:36`; `utils.ts:20` and `:26`; `MotionProvider.tsx:7`; `protocol.ts:32-38`;
  - `PortfolioFooterLink.tsx:9-10` and `not-found.tsx:16`, both `next/link`, so client-side navigations back to `/`;
  - `page.tsx:31-32`: `IntroGate backdrop={<Background />}` and `<Navbar />` from the Server Component page, with no Suspense boundary around the navbar.
- **Configuration and docs files:**
  - `eslint.config.mjs:13`; `next.config.ts` (`reactCompiler` on, no `cacheComponents`); `tsconfig.json` (`isolatedModules`, no `verbatimModuleSyntax`);
  - `.claude/launch.json` (tracked; `autoPort: true` for `portfolio-dev` and `portfolio-prod`); `.mcp.json` (`next-devtools-mcp@0.4.0`, `motion`);
  - `AGENTS.md`: the managed block at `:1-9`, the `data-sky-quiet` bullet at `:20` that P5's line follows, the Cache Components bullet at `:21`, the MCP bullet at `:22`.
- `Introduction.tsx` and `AppFooter.tsx` carry no directive (Server Components), as D1 (a) and (b) assume. No source file contains "sky animation" today, so AC-41's server-HTML check can only match the new control.

All hold.

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| **The island.** `SkyPauseButton.tsx` has no directive and is rendered only by `Navbar.tsx` (`'use client'` at `:1`), which the Server Component page renders (`page.tsx:32`). Under D1 (a) or (b) the control's file gains the directive and the host stays a Server Component; only `className`, a string, crosses. The hero already renders client `StaggerItem`s, so (a)'s "the host's entrance" works as written. | `use-client.md:10`; `05-server-and-client-components.md:178-188`; `Introduction.tsx:4`, `:17` |
| **Browser APIs** are touched only inside functions on the client, never at module scope or during the server render; `getSnapshot` reads storage only once `running` is true | `05-server-and-client-components.md:26`; the sketch (`PLAN.md:1726-1839`) |
| **Hydration.** `useSyncExternalStore` with `serverSkyPlayback` returning `null`; both snapshots are `null` at hydration, since `running` turns true only on the worker's first frame, after `mountSky`'s effect; a later change re-renders through the store, with no hydration error. The visible navbar mounts fresh after IntroGate's key flip. | `preventing-flash-before-hydration.md:11`; `single-page-applications.md:205-221`; react.dev `useSyncExternalStore`; `IntroGate.tsx:74`, `:94-100` |
| **A page view is one mount**: without Cache Components the home page unmounts on navigation, so the last unsubscribe resets the cached pause and Play | `preserving-ui-state.md:13-17` (Activity only with `cacheComponents`); `next.config.ts` |
| **The Web Worker** under Turbopack: entry unchanged, model files join its chunk by static import. A nested git worktree is its own workspace root for the per-phase build. | `08-turbopack.md:130`, `:482`; `dist/lib/find-root.js` (`findGitBoundary`, `isGitWorktree`) |
| **No `next/script` worker strategy**; no `next/font`, metadata, route-segment config, Suspense, Activity or Cache Components API (`instant` appears only as `scrollTo`'s behavior) | `scripts.md:128`; grep of `PLAN.md`; `AGENTS.md:21` |
| **React Compiler.** The store functions are module-level and stable, `getSnapshot` returns a string or `null` (stable under `Object.is`), and the header's ref is read only in the scroll callback, outside render. The P5 code passes the compiler's lint rules on cf4d7b8. | `next.config.ts` (`reactCompiler`); the rig (Method step 6) |
| **`inert={mobileMenuOpen}` and `onFocus` on Motion elements**: React 19 takes the boolean, Motion forwards both, and tsc accepts them | the rig; `framer-motion` `filter-props.mjs` (round 8) |
| **Motion under reduced motion.** `MotionConfig reducedMotion="user"` (`MotionProvider.tsx:7`) keeps the control's entrance to an opacity fade, like the other nav items; 7.0 queries the `motion` docs before P5's entrance | Motion docs, MotionConfig |
| **The `next dev` MCP checks.** `get_errors` takes no route and reads browser sessions with the page open; `get_logs` names the log file; `compile_route` takes a path such as `/`; `get_compilation_issues` needs no browser; `nextjs_call` takes `port`, `toolName` and `args`. `next dev` and `next start` honor `PORT`, so `autoPort` works for both previews. | `mcp.md:54`, `:55`, `:60-61`, `:88`; `06-cli/next.md:70`, `:122`, `:349-352` |
| **7.1's resolve hook and type stripping** on Node 24 | `module.md` (`registerHooks`, `register` deprecated v24.15.0); `deprecations.md` (DEP0205); the H12 run (Method step 7) |
| **D5's Vitest option** | `testing/vitest.md:43-44`, `:68-71`, `:92-103` |

## Findings

None. No blocking, major or minor finding in this scope.

## Summary

- **Verdict: pass.**
- **Round 8 had no finding in this scope**, so nothing needed confirming. Its revision cut repeated text in 5.4 and 6.8, and everything cut still stands where the pointers lead: 7.0 for the production build, 5.4 for hydration, H12 for the store's checks. The new references (`eslint.config.mjs:13`, `mountSky.ts:122-124`, the `SkyMotion` doc's growth, `SkyField.pinned`'s type import) are right at cf4d7b8 and stay inside the rules this lens checks.
- **The P5 main-thread code is unchanged since round 8, and still builds on cf4d7b8**: tsc clean, and ESLint clean with the React Compiler rules active. 7.1's hook runs the pause store under Node 24 as H12 describes.
- **Every cited docs line still says what the plan says.** This covers the Next.js 16.4.2 docs, react.dev (reworded, same meaning), Motion and Node v24. No Cache Components, `next/script`, `next/font`, metadata or route-segment API appears.

Scratch evidence is in `nextjs-gate-r9/` in the session scratchpad, not in the repository:

- `PLAN.r9.md`, the snapshot audited, and `diff-r8-r9.txt`, its diff from round 8's snapshot;
- `PLAN.before-r8.md.code.txt` and `PLAN.r9.md.code.txt`, the extracted code blocks of 6.6, 6.8 and 6.13;
- `rig/`, round 8's cf4d7b8 rig with P4 and P5 applied, rerun with tsc and ESLint;
- `h12/`, 7.1's `register-hooks.mjs`, the store and `h-pause.ts`.
