# Audit: Next.js 16.4 official docs (scope "nextjs-docs"), gate round 7

Date: 2026-10-27. Auditor: one subagent of the sky-ambient-motion planning workflow, gate round 7. Verdict: **revise** (one major finding, NJ7-1; no blocking or minor findings).

## Scope

- **Role.** The Next.js 16.4 docs auditor for gate round 7. Round 6 raised nothing in this scope, so there is no fix of ours to confirm. The job is to check round 6's other changes for regressions in this scope, then sweep `PLAN.md` again for every decision that touches Next.js, React, Motion or the Node APIs the harnesses use:
  - the `'use client'` boundaries and where the pause control's island lives;
  - what crosses the server and client boundary;
  - hydration safety of `localStorage` and `matchMedia`;
  - the Web Worker under Turbopack;
  - `next/script`, `next/font`, metadata and route-segment usage;
  - React Compiler implications for the plan's hooks and stores;
  - App Router conventions, deprecated or changed 16.x APIs, the `next dev` MCP endpoint, and the absence of Cache Components APIs.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md` and `research/01-planning-brief.md`.
  - `COORDINATION.md` in full: "Confirmed veil interface (2026-10-27)", and the section "Answers to the planning session's questions (2026-10-27)". That section was committed during this round (4606c23, 20:14), so its answers are authoritative here.
  - `PLAN.md` (3,819 lines now that the logs have moved out). Sections read: 1, 1.1, 2.1, 2.2, 3, 4.1 to 4.4, 5, 6.6 to 6.8, 6.13, 7.0 to 7.3 (P0 to P7, P13, PF), 8.4, 8.6, 9.2, 11, 12 and 13.
  - `REVIEW-LOG.md`: the round-6 rows and every Next.js docs row.
  - The earlier reports in this scope: `audit/nextjs-docs-gate-r6.md`, and for history `audit/nextjs-docs.md` and `audit/nextjs-docs-gate-r5.md`.
  - The worktree code at 246c0aa; the installed Next.js 16.4.2 docs and source; react.dev; Motion's docs through the `motion` MCP server; the Node.js v24 docs.
  - Read only, in the main checkout: the veil session's uncommitted diff of `mountSky.ts`, `protocol.ts`, `sky.worker.ts` and `AGENTS.md`.
- **Outputs.** This file, and the same finding in the structured result.
- **Limits.**
  - Planning only. Nothing was edited in `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or the main checkout, and the veil session's dev server on port 3000 was left alone.
  - Throwaway checks ran only in the session scratchpad (`nextjs-gate-r7/`).
  - Physics, coordination, conventions, DRY and separation of concerns belong to the other reviewers. NJ7-1 covers only the pause control's main-thread wiring; folding in the rest of the veil's answers belongs to the coordination review.

## Method

1. **What changed.**
   - Diffed round 6's starting text (`nextjs-gate-r6/PLAN.r6.md`) against the reviser's copy (`reviser-r6/PLAN.after-r6.md`): 129 lines added, 80 removed.
   - Diffed that copy against the current `PLAN.md`: the only difference is the log move (one line added to section 1, lines 3819 to 4027 removed).
   - Compared the two texts section by section. 5.2, 5.3 and 5.4 are byte-identical to round 6's input, and so are the four parts of 6.8 ("Where the state lives", "The control", "Placement (D1 default)", "Wiring").
2. **The answers.** Read `COORDINATION.md` lines 138 to 230 and the commit that added them (`git show 4606c23`). Compared answer 1's hands-off list with every edit `PLAN.md` makes in this scope before V.
3. **Docs.** Re-opened every docs line the plan cites and confirmed the text:
   - `01-app/01-getting-started/05-server-and-client-components.md:26`, `:178-188`;
   - `01-app/03-api-reference/01-directives/use-client.md:10`, `:50`;
   - in `01-app/02-guides/`: `preventing-flash-before-hydration.md:11`, `single-page-applications.md:205-221`, `scripts.md:128`, `mcp.md:54-61` and `:88`, `testing/vitest.md:43-44`, `:68-71` and `:92-103`, and `preserving-ui-state.md:13-17`;
   - `01-app/03-api-reference/08-turbopack.md:130` and `:466-482`;
   - `05-config/01-next-config-js/reactCompiler.md:12` and `logging.md:100-105`.

   Also read the newer guides for any advice that bears on the plan: `server-and-client-boundary.md`, `interactive-apps.md`, `keeping-pages-static.md` and `content-security-policy.md`. Read Next's `dist/lib/find-root.js` and `dist/server/lib/generate-agent-files.js` too.
4. **Lint and types.** Copied round 6's rig into `nextjs-gate-r7/rig`.
   - The current `skyPause.ts` and `SkyPauseButton.tsx` sketches (`PLAN.md` lines 1755 to 1868 and 1891 to 1924) are byte-identical to the rig's files. The rig's `Navbar.tsx` carries every 6.8 change.
   - ESLint with the repository's rules (eslint-config-next 16.4.2, React Compiler rules included): 0 problems in `src/components`. The probe file got 4 `react-hooks/refs` errors, which shows the compiler rules ran.
   - tsc (`@types/react` 19.3.0, Motion 12.38.0): exit 0.
5. **React, Motion, Node.**
   - Fetched react.dev's `useSyncExternalStore` page.
   - Read Motion's `useMotionValueEvent` page through the `motion` MCP server.
   - Fetched the Node.js v24 `module.md`, `deprecations.md` and `typescript.md`.
   - Loaded the `next-devtools` MCP schemas (`nextjs_call`, `nextjs_index`). Nothing was called.
6. **The veil's working tree, read only.** `git diff` of four files in the main checkout:
   - `mountSky.ts`: its hunks;
   - `protocol.ts`: only `SkyRect.headroom` is added;
   - `sky.worker.ts`: no new worker-to-main message;
   - `AGENTS.md`: the `data-sky-quiet` line.

## Round 6 in this scope

Round 6 raised nothing in this scope (`REVIEW-LOG.md`, "Gate round 6": "none from the Next.js docs audit"). The earlier fixes in this scope are still in place:

| ID | Where in `PLAN.md` now |
|---|---|
| NJ-1 | 5.4 line 428; 7.0 line 2870; P5 line 3167; AC-41 line 3627 |
| NJ-2 | 6.8 lines 1859 to 1867 and 1873; deviation 7 (line 60); PB1 (line 291); H12 (line 2947) |
| NJ-3 | D5 (line 173) |
| NJ-4 | 5.4 lines 422 and 423; 6.8 line 1931 |
| NJ-5 | 5.2 lines 397 and 399; D1 (line 169) |
| NJ5-1 | Section 13, line 3757 |

## Regression check: round 6's changes that touch this scope

| Change | Where (`PLAN.md`) | Verdict |
|---|---|---|
| On a file-by-file answer, only the store, the control, its icons and `Navbar.tsx` are prepared, now "before V or PF" (CA6-1) | 4.4 line 325; P5 line 3145; 7.2 line 2987 | No issue in this scope. The files are the same, and the control still renders nothing until `setSkyRunning(true)`. Answer 1 makes this branch moot; NJ7-1 covers what it means for `mountSky`. |
| `twinkleLevel` drops its `motion === 'full'` guard for the motion level (C54) | 6.6 line 1704; P5 line 3153 | Worker only. |
| `leanWanted(camera, lean, follow)`, shared by `stepCamera` and `demandNow` (DRY-R6-2) | 6.1; 6.13 line 2837; P7 | Model and worker only. P7's main-thread pointer listener is unchanged. |
| `frameAt` gathers first (SOC6-1) | 6.1; P6 | Worker only. |
| The PF and V clauses (CA6-1, C52, C53) | Sections 1, 4.4, 7.0, 7.2, 8.5, 8.7 | Sequencing only. No Next.js or React change. |
| The logs moved to `REVIEW-LOG.md` | Section 1, line 16 | Section 13's sources stay in `PLAN.md`, and nothing in this scope pointed into the logs. |

## Verified, no finding

| Plan decision | Evidence |
|---|---|
| `SkyPauseButton.tsx` has no directive and lives in Navbar's client island. Under D1 (a) or (b) its file gains the directive, and its one prop, `className`, is serializable. | `use-client.md:10`, `:50`; `05-server-and-client-components.md:178-182`; `Navbar.tsx:1`, rendered by the Server Component at `page.tsx:32` |
| Browser APIs are used only inside functions, never at module scope, so the static prerender evaluates the store module with no DOM access | `05-server-and-client-components.md:26`; the sketch (lines 1755 to 1868); `next.config.ts:11`, where a static CSP keeps every page prerendered |
| Hydration uses `useSyncExternalStore` with a null `getServerSnapshot`, not `next/dynamic`, a `useEffect` gate or `use(browser())`, and needs no inline script | react.dev: the server snapshot "will be used only during server rendering and during hydration of server-rendered content on the client". `preventing-flash-before-hydration.md:11`; `single-page-applications.md:219`, `:221`; `IntroGate.tsx:94-100`. The worker posts `'ready'` only after its first frame (`sky.worker.ts:278-280`), and the worker exists only after `SkyCanvas`'s effect, so both snapshots are null at hydration. |
| The store's contract | react.dev: declaring `subscribe` outside the component prevents resubscribing, and repeated `getSnapshot` values are compared with `Object.is` (the sketch returns a string or null) |
| A page view is one mount of `/`, and the last unsubscribe resets the cache | `preserving-ui-state.md:13-17`: before Cache Components, keeping page state across navigations needed "an external store", and only with them are pages hidden instead of unmounted. `next.config.ts` sets no `cacheComponents`. Routes back to `/`: `PortfolioFooterLink.tsx:9-10`, `not-found.tsx:16`. |
| React Compiler | `next.config.ts` enables it. `reactCompiler.md:12`: the compiler runs only on files with JSX or hooks. No new plan function is named like a hook (grep: only `useEffect` and `useSyncExternalStore` appear). See also the ESLint run above. |
| The worker bundling is unchanged, and new model files join the worker chunk by static import. The transient registry imports each spec value by name, so production tree shaking can't drop a kind. | `mountSky.ts:79-80`; `08-turbopack.md:130`, `:482`, and that table's production column (`turbopackInferModuleSideEffects` and `turbopackRemoveUnusedImports` are `true` in builds); `PLAN.md` 5.2 and line 2101 |
| No `next/script` worker strategy | `scripts.md:128` |
| A production smoke build ends each phase | `08-turbopack.md:470`: `turbopackMangleExportNames` is `true` in builds. Plan code uses no namespace import, `.name` or dynamic `import()`. |
| The MCP checks | `get_errors` takes no route and runs after a full reload; the plan also uses `get_logs`, `get_compilation_issues` and `compile_route` for `/`, all through `nextjs_call` on our port. `mcp.md:54`, `:55`, `:60`, `:61`, `:88`. `next-devtools-mcp@0.4.0` (`.mcp.json`): `nextjs_call` takes `port`, `toolName` and an optional `args`. `logging.md:100-105`: `browserToTerminal` forwards warnings and errors by default, so a hydration error reaches the `get_logs` file. `.claude/launch.json` is tracked and has `autoPort: true`. |
| `next dev` and P5's `AGENTS.md` line | `generate-agent-files.js` replaces only the text between its markers, and both checkouts' `AGENTS.md` carry those markers (lines 1 and 9) |
| No Cache Components, `next/font`, metadata, route-segment config, Suspense or Activity | grep of `PLAN.md`: "instant" appears only as "an instant scrollTo" and `behavior: 'instant'`, and "Suspense" only in 5.4's reason against `use(browser())`. Nothing touches `layout.tsx`, `page.tsx`'s `metadata`, `fonts.ts` or `next.config.ts`. |
| Motion | Motion docs: `useMotionValueEvent`'s `change` callback receives the latest value and is cleaned up on unmount, so Navbar's focus test runs outside render. `MotionConfig reducedMotion="user"` is set at `MotionProvider.tsx:7`. The D1 Server Component hosts use `StaggerItem` (`Introduction.tsx:4`) or a named `motion/react-client` import (`AppFooter.tsx:1`), as AGENTS.md asks. |
| D5's Vitest option | `testing/vitest.md:43-44`, `:68-71`, `:92-103` |
| The Node APIs in 7.1 and D5 | Node v24 `module.md`: `registerHooks` was added in v23.5.0 and v22.15.0 and has been a release candidate since v24.13.1. `module.register()` was deprecated in v24.15.0 (DEP0205, documentation-only, `deprecations.md`), so "Node 24 deprecates" holds from 24.15. 7.1's "24.14" tag dates the loader run, and `registerHooks` exists on every 24.x. `typescript.md`: type stripping has been stable since v24.12.0 and silent since v24.3.0. File extensions are mandatory, which is why the hook appends `.ts`. `.tsx` is unsupported, and no harness loads one. A type-only import needs the `type` keyword, as 7.1's rule and 5.2's statement-level `import type` say. |
| The veil's in-progress main-thread code | `protocol.ts` adds only `SkyRect.headroom`. The worker posts no new message type, so P5's `switch` with a `never` default still covers `'ready'` and `'error'`. The `mountSky.ts` hunks leave `motion()`, the reduced-motion query, the message listener and `destroy` as they are at 246c0aa; see NJ7-1 for the function they sit in. |
| `COORDINATION.md` answers 2 to 5 | None touches this scope: the two overlaps, never-lease kinds, the comet's fade and `QuietBlend.next`. |

## Findings

### NJ7-1 (major): the veil's authoritative hands-off list names the function `mountSky`, which P4, P5 and P7 edit before V

- **Section.**
  - 4.4: "Ours, from P1" (line 332), the veil's list (line 339) and the rule (line 322).
  - 8.6: the intro (line 3500) and the `mountSky.ts` row (line 3521).
  - 8.4: the two overlaps asked for (line 3448).
  - P4 step 3 (line 3130); P5's "Blocked on", files and step 3 (lines 3145, 3149, 3158); P7's files and step 2 (lines 3224, 3228).
  - 7.0 "Gates" (line 2877).
- **Problem.**
  - **What the answer says.** The veil session's answers are authoritative and supersede `PLAN.md`'s either-or branches. Answer 1 confirms `PLAN.md`'s symbol-level reading of the file rule, and it replaces "Changed shape" with a longer hands-off list. For `mountSky.ts` the list names `NORMAL_FONT_WEIGHT`, `Shift`, `CopyReader`, `copyReader`, `quietRect`, `quietRects` and `mountSky`. The last is the exported function itself: their working tree changes two places in its body.
  - **What `PLAN.md` says.** It still treats that function as ours:
    - 4.4 puts "`mountSky`'s activity, pointer and pause wiring" under "Ours, from P1", and lists only the rect measurement as theirs;
    - 8.6 says only `frameAt` and `sameRects` are changed by both before V, and resolves the `mountSky.ts` row with "different functions";
    - the CP-0 message asked for those two overlaps only.
  - **Where our edits sit.** Every main-thread edit in P4, P5 and P7 is inside `mountSky`'s body:
    - P4's activity listeners;
    - P5's store wiring: the `motion` closure, `sentMotion` and `syncMotion`, `init`'s `motion` field, the removed reduced-motion query and its listener, the worker-message `switch` with `setSkyRunning`, and `destroy`;
    - P7's pointer listener, and later P13's relay loop.
  - **What follows on the confirmed reading.** 4.4 says "before V, nothing on their list ... is edited, except the overlaps 8.6 lists, each agreed". So those steps can't land before V, and that changes what gets built before V:
    - without the `mountSky` wiring the pause control never renders (`skyPlayback` stays null until `setSkyRunning(true)`), so P5 can't finish;
    - 7.0's gate merges P5 before P4 and P6, so P4 and P6 (the drift) wait as well.
  - **The other reading.** Answer 1's second bullet says "on our branch we may edit other lines of the same files, and at the rebase its lines win". None of these edits touches the veil's lines, so on that reading they are allowed. Either way, `PLAN.md` must say which reading it follows (and ask when unsure), not describe the function as outside the veil's symbols.
- **Evidence.**
  - `COORDINATION.md`:
    - line 140: "They are authoritative and supersede PLAN.md's either-or branches on these points."
    - lines 148 to 153: "The file rule is symbol-level. Our reading is right", its three bullets, and "Its symbols with changed lines today (this replaces the shorter "Changed shape" list above as the hands-off list)".
    - line 184: "`mountSky.ts`: `NORMAL_FONT_WEIGHT`, `Shift`, `CopyReader`, `copyReader`, `quietRect`, `quietRects` and `mountSky`."
  - The main checkout's `git diff -U0 -- src/components/sky/mountSky.ts` (read only) has two hunks inside `mountSky`:
    - `@@ -155,0 +221 @@` adds `const headrooms = new Map<string, number>()`;
    - `@@ -163,2 +229,3 @@` changes `measureLayout` to call `copyReader`.

    P4, P5 and P7 edit other lines of the same function (246c0aa lines 146, 149, 197 and 243 to 268), none of them theirs.
  - `PLAN.md`:
    - 4.4 lines 322, 332 and 339;
    - 8.6 line 3500 ("Before V, only `frameAt` and `sameRects` are changed by both") and line 3521 ("different functions; check they didn't change `motion()`");
    - 8.4 line 3448;
    - P4 line 3130; P5 lines 3145, 3149 and 3158; P7 lines 3224 and 3228;
    - 7.0 line 2877;
    - 6.8 "Wiring", lines 1973 to 1993.
  - The same list also names worker symbols that the phases before V edit: `tick`, `frameMode`, `draw`, `SkyFrame`, and the import lines of `sky.worker.ts` and `renderSky.ts`, which are how each new model file joins the worker chunk (5.2). P5 step 4's `easeEnded` line in `tick` (6.6, line 1719) is one such edit. These belong to the coordination fold-in; they are listed here only so the two fixes agree.
- **Fix.** When folding in the answers:
  1. **4.4.** Add `mountSky` (the function) to the veil session's symbols. Its observed changed lines are the `headrooms` map and `measureLayout`. Move "`mountSky`'s activity, pointer and pause wiring" out of "Ours, from P1" and into the overlaps.
  2. **A third overlap.** Ask the veil session for it, worded like the other two: "`mountSky`: we add or change only lines you didn't (P4's activity listeners; P5's `motion()`, `syncMotion`, `init`'s `motion` field, the worker-message `switch` and `destroy`; P7's pointer listener); your lines win at the rebase." Add it to 8.6's overlap list, and change the `mountSky.ts` row from "different functions" to "the same function, different lines; keep theirs".
  3. **Until they agree.** P4 step 3, P5 step 3 and P7 step 2 wait for V or PF. P5's other steps can be prepared: the store, the control, its icons and `Navbar.tsx`, with the control rendering nothing until `mountSky` reports a running sky, as 4.4 already says for a file-by-file answer. Through 7.0's gate this also holds P4 and P6, so D10's question comes early, as it does for a declined `frameAt` overlap.

  If the fold-in adopts the second bullet's line-level reading instead, write it into 4.4 and 8.6: inside a listed symbol, lines they didn't change may be edited on our branch, and theirs win at the rebase. Still list `mountSky` as shared, so nobody reads 8.6's "different functions" as permission.

## Summary

- **Verdict: revise**, on one major finding.
  - **NJ7-1.** The veil's answers arrived during this round. Their authoritative hands-off list names `mountSky`, the function that holds the pause control's main-thread wiring, and `PLAN.md` still treats it as ours before V. The fold-in should ask for a third overlap, or hold P4, P5 and P7's `mountSky` steps until V or PF, which through 7.0's gate also holds P4 and P6.
- **Round 6** raised nothing in this scope, and its changes caused no regression here. Sections 5.2 to 5.4 and 6.8 are byte-identical to round 6's input, and every earlier Next.js docs fix (NJ-1 to NJ-5, NJ5-1) is still in place.
- **Re-verified on the current text.**
  - The P5 sketches pass the repository's ESLint rules, React Compiler rules included, and tsc.
  - Every cited docs line says what the plan says.
  - The hydration design matches react.dev and the Next.js 16.4 guides, and the worker bundling matches the Turbopack reference.
  - No Cache Components, `next/script` worker, `next/font`, metadata or route-segment API appears.
  - The Node APIs (`registerHooks`, DEP0205, type stripping) match the v24 docs.
  - Answers 2 to 5 change nothing in this scope.

Scratch evidence is in `nextjs-gate-r7/` in the session scratchpad, not in the repository:
- `PLAN.r7.md`, the snapshot audited;
- `r6.diff` and `move.diff`, round 6's changes and the log move;
- the extracted sketches (`skyPause.r7.ts`, `SkyPauseButton.r7.tsx`, `navbar.r7.txt`, `wiring.r7.ts`);
- `rig/`, the ESLint and tsc run.

## Verification

Skeptic pass, gate round 7, 2026-10-27. NJ7-1 was re-checked against `PLAN.md` as committed in 5302efe (20:12), the worktree code at 246c0aa, and `COORDINATION.md` in full: its answers section came in 4606c23 (20:14), after `PLAN.md`'s last save. Also checked, read only: the main checkout's `git diff -U0 -- src/components/sky/mountSky.ts`. It was compared with this round's SOC7-1 and with the conventions report's note on answer 1, which look at the same list from other angles. Result: confirmed, major. Nothing is blocking, but this scope doesn't pass while NJ7-1 stands.

- **NJ7-1: confirmed, major.** The answers' hands-off list does name the function `mountSky`, whose body P4, P5 and P7 edit before V while `PLAN.md` still calls that wiring ours. Which reading of answer 1 the plan takes decides whether P5, and through 7.0's gate P4 and P6, is built before V.
  - **The facts.** Every cited fact holds.
    - `COORDINATION.md:148-153` and `:184` put the function `mountSky` on the list that replaces "Changed shape" as the hands-off list.
    - The main checkout's diff has exactly the two cited hunks inside that function (246c0aa lines 130 to 289): `@@ -155,0 +221 @@` (`headrooms`) and `@@ -163,2 +229,3 @@` (`measureLayout`'s reader).
    - P4 step 3, P5 step 3 and P7 step 2 all change other lines of the same function: 6.6 line 1676 ("Inside mountSky, with the other listeners"); 6.8 "Wiring" (246c0aa lines 146, 149, 197 and 243 to 268); 6.13 lines 2835 and 2836 (the ResizeObserver's size, `destroy`).
  - **What `PLAN.md` still says.**
    - 4.4 line 332 lists that wiring as ours from P1.
    - Only the `frameAt` and `sameRects` overlaps are listed or asked for (lines 341, 3448 and 3500).
    - 8.6 line 3521 calls the `mountSky.ts` row "different functions".
    - 7.2 lines 2975 to 2978 mark P4, P5 and P7 "no" for the veil.
  - **The consequence.** Applied to the authoritative list, 4.4's own rule (line 322) holds those steps until V or PF. `skyPlayback()` stays null until the `'ready'` case calls `setSkyRunning(true)` (lines 1803 to 1806 and 1992), so P5 can't finish, and the gate at line 2877 then holds P4 and P6.
  - **Why major, not blocking.**
    - Answer 1's second and third bullets, read literally, allow edits to "other lines of the same files" that don't reformat, reorder or move the veil's symbols. SOC7-1 reads the `mountSky` edits that way, so following the plan doesn't plainly break a constraint.
    - But the two readings decide whether the pause control, the presence pings and, through the gate, the drift are built before V. `PLAN.md` states neither reading for this function.
  - **One overstatement, which changes nothing.** Not every main-thread edit of P4, P5 and P7 is inside the function. `ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`, `LEAN_POINTER_QUERY`, the import lines, and P5's store, control, icons and `Navbar.tsx` sit outside it, and the fix already lets them be prepared.
  - **The fix.** It breaks no `COORDINATION.md` constraint. When folding it in:
    - merge it with SOC7-1's third overlap (`frameMode`, `tick`) into one request, with one stated reading for every listed symbol;
    - confirm the line-level alternative with the veil session before relying on it, since answer 1 calls the rule symbol-level.
