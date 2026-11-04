<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project notes

- Setup, scripts, environment variables, routes and layout: see README.md.
- Runtime is Node.js 24 LTS (`.nvmrc` is `24`, `engines.node` is `24.x`, matching Vercel). Don't use Node APIs newer than v24; reference: https://nodejs.org/docs/latest-v24.x/api/ (append `.md` to a module page for Markdown).
- TypeScript stays on `~6.0.x`: typescript-eslint 8 (pulled in by eslint-config-next) supports only `>=4.8.4 <6.1.0`, and TypeScript 7.0 ships no JS compiler API or tsserver. Don't upgrade to 7.x until typescript-eslint supports it (typescript-eslint/typescript-eslint#10940).
- Code style: tabs, single quotes, no semicolons, `@/` imports, default-exported components, named re-exports in barrels. ESLint forbids namespace imports (`import * as`).
- Server Components by default; add `'use client'` only at the entry of an interactive subtree. In Server Components, render Motion elements through named imports from `motion/react-client` (for example `import { div as MotionDiv } from 'motion/react-client'`).
- Code used by `/links` and `/links/schedule` imports shared primitives and hooks by file, not through barrels, to keep those routes' client JS small.
- The home sky draws in a Web Worker (`src/components/sky/sky.worker.ts`), and everything that file imports ships in the worker chunk: `src/lib/sky` imports only its own files, and the worker's files in `src/components/sky` (`sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`, `miamiRuntime.ts`) import only `@/lib/sky/*` by file and each other. None of them uses React, `window`/`document`, the `@/lib` barrel or `@/lib/utils`. On the main thread, sky code imports only types and `@/lib/sky/color` from `src/lib/sky`.
- Copy the sky stays quiet behind carries `data-sky-quiet` (the hero, Contact, the footer and the side rails: no bright stars on it, and a shooting star behind it dims to what that copy's WCAG contrast can take, a faint glimmer at most); keep the attribute when editing those components, and keep that copy and its ancestors free of static `transform` translations and of `opacity` below 1 at rest, because the sky measures net of every translation and reads contrast from `color` alone.
- Farewell meteors fly only in the sky below the top of the highest quiet copy of the page's flow that is on screen (`planFarewell` in `src/lib/sky/meteorKind.ts`), because the sky has no rect for copy without `data-sky-quiet`: such copy belongs above Contact, never below its top.
- `SkyLanding` (between Contact and the footer) is empty room for the sky's landing scene: keep it free of copy. No copy goes below Contact's top except the footer.
- `SkyRect.headroom` assumes a navy ground, so light added on copy (the veil's ink) scales to 0 through the descent (`SceneLevels.inkShare`), and no sky event launches once `scene.descent` reaches `DESCENT.eventStop`. `eventFloorY` is the lowest canvas y an event may fly at; nothing reads it yet, because at normal contrast that stop and the scroll cancel already keep flights above it.
- `SkyLanding` renders only under `next dev` and on Vercel Previews (`SHOW_SCENE`) until the landing scene ships, so a local production build has no scene unless `VERCEL_ENV=preview` is set.
- `MAX_QUIET_RECTS` cuts flow rects from the end of the DOM, so footer rects go first, and `stageFrom` needs them: keep the count under it.
- The sky's pause control (`src/components/sky/SkyPauseButton.tsx`, in the navbar, in the right rail from `md` up, and in the footer wherever the rail shows none, state in `skyPause.ts`) is its WCAG 2.2.2 mechanism: it maps to the worker's `motion: 'reduced'`, and any new continuous sky motion must stop under it.
- Cache Components is not enabled: don't add `instant`, `'use cache'`, `cacheLife` or other APIs that require `cacheComponents`.
- Tailwind detects class names only in `src/` (`source("..")` on the import in `src/app/globals.css`), so class names written outside `src/` get no CSS. Keep plans and other docs out of `src/`: Tailwind reads Markdown and source files there unless git ignores them, so a word in a doc that names a utility the site doesn't use yet (`table`, `sticky`) can add CSS to the site.
- Verify every change with `npm run lint` and `npm run type-check` (it runs `next typegen` first, so generated route types are checked too). While `next dev` runs, use its MCP endpoint `/_next/mcp` (`get_errors`, `get_compilation_issues`, `compile_route`) instead of `next build`.
- If `next dev` or `next build` stops with a Next.js upgrade reminder, tell the user and rerun the command; don't upgrade Next.js without asking.
- Never POST to `/api/schedule/book`: it creates real Google Calendar events and sends real emails. To check the integration, GET `/api/schedule/slots?date=YYYY-MM-DD` for an upcoming bookable date (non-bookable dates return `[]` without calling Google). A 200 by itself doesn't show Google answered: the endpoint returns the static schedule from `src/lib/scheduleConfig.ts` when the `GOOGLE_*` variables are unset (silently) or when FreeBusy fails (logged as `[google-calendar] FreeBusy query failed`), so check the server log, and expect busy hours to be missing from the result.
- Never commit `.env*` files except `.env.example`.
