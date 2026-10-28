# Portfolio

Developer notes for this Next.js app: stack, setup, scripts, configuration, routes and project layout.

## Stack

- [Next.js 16](https://nextjs.org/docs) with the App Router (`src/app`), bundled with Turbopack
- React 19 with the React Compiler
- Tailwind CSS 4, configured CSS-first in `src/app/globals.css` (no `tailwind.config.*`)
- TypeScript in strict mode
- ESLint with a flat config (`eslint.config.mjs`)

## Requirements

- Node.js 24 LTS: `.nvmrc` holds the major and `engines.node` in `package.json` is `24.x` (Vercel deploys the latest 24.x). With nvm-sh or fnm run `nvm use` / `fnm use`; nvm-windows doesn't read `.nvmrc`, so run `nvm install 24` then `nvm use` with the installed 24.x version.
- npm (the repo ships a `package-lock.json`).

## Setup

```bash
npm ci
cp .env.example .env.local
```

Fill in the values in `.env.local` (see [Environment variables](#environment-variables)), then start the dev server with `npm run dev` and open http://localhost:3000.

`.env.local` and every other `.env*` file are gitignored. Only `.env.example` is committed.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Starts the development server with Turbopack and hot reloading. |
| `npm run build` | Creates an optimized production build. |
| `npm run start` | Serves the production build created by `build`. |
| `npm run lint` | Runs ESLint over the project. |
| `npm run lint:fix` | Runs ESLint and applies automatic fixes. |
| `npm run type-check` | Type-checks the project, including Next.js generated route types. |

## Environment variables

Defined in `.env.local` (template: `.env.example`). All of them are server-only.

| Variable | Required | Description |
| --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | For live availability and booking | Email of the Google Cloud service account that reads and writes the calendar. |
| `GOOGLE_PRIVATE_KEY` | For live availability and booking | The service account's private key, on a single line with `\n` escapes for line breaks. |
| `GOOGLE_CALENDAR_ID` | For live availability and booking | ID of the calendar shared with the service account. |
| `RESEND_API_KEY` | Optional | Resend API key for booking confirmation emails. Without it, bookings still succeed but no email is sent. |
| `EMAIL_FROM` | Optional | Sender address on a domain verified in Resend. Defaults to `onboarding@resend.dev`. |
| `GOOGLE_MEET_LINK` | Optional | Reusable Google Meet link added to the event description and the confirmation email. |

Without the three `GOOGLE_*` variables, the slots endpoint falls back to the static schedule in `src/lib/scheduleConfig.ts` and the booking endpoint responds with 503.

## Routes

| Route | Description |
| --- | --- |
| `/` | Home page. |
| `/links` | Links page. |
| `/links/schedule` | Meeting scheduler. |
| `GET /api/schedule/slots?date=YYYY-MM-DD` | Returns the open time slots for a date. Safe to call while testing. |
| `POST /api/schedule/book` | Books a meeting. It creates a real Google Calendar event and sends real emails, so never call it while testing. |
| `/sitemap.xml` | Sitemap generated from the App Router metadata files. |
| `/robots.txt` | Robots rules generated from the App Router metadata files. |

## Project layout

```txt
src/
├── app/          Routes, layouts, route handlers, error/not-found pages and metadata files (favicon, sitemap, robots), plus globals.css and fonts.ts
├── components/   UI components
│   ├── icons/            SVG icon components
│   ├── motion/           Animation wrappers
│   ├── sky/              Home night sky: client island, controller, pause store and control, and Web Worker renderer
│   └── links/            /links components
│       └── schedule/     /links/schedule components
├── hooks/        Client hooks
├── lib/          Site config, metadata helpers, schedule config and time helpers, content data
│   └── sky/              Home sky model: tuning, star catalog, scene and shooting-star math (DOM-free)
├── assets/       Fonts and images imported statically
└── emails/       React Email templates
public/           Static files served from the site root
```

## Agent notes

- [`AGENTS.md`](./AGENTS.md) holds the instructions for AI coding agents (`CLAUDE.md` imports it). `next dev` keeps the block between the `nextjs-agent-rules` markers up to date; project notes go below it.
- The documentation for the installed Next.js version is bundled at `node_modules/next/dist/docs`. Prefer it over memory or web results.
- While `next dev` runs, its MCP endpoint at `/_next/mcp` exposes errors, routes, logs and compilation issues. `.mcp.json` registers `next-devtools-mcp` (bridges to `/_next/mcp`) and the official read-only docs servers for Motion (`https://mcp.motion.dev`) and Zod (`https://mcp.inkeep.com/zod/mcp`); account-level servers (Vercel, GitHub, Playwright, Context7) are not duplicated there.
