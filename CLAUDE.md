@AGENTS.md

## Claude Code

- `.mcp.json` registers `next-devtools` (bridges to the dev server's `/_next/mcp`; it connects only while `npm run dev` is running) and the read-only docs servers `motion` and `zod`. Query `motion` before writing animation code and `zod` before changing schemas such as `src/lib/validations.ts`.
- Preview servers live in `.claude/launch.json`: `portfolio-dev` runs `npm run dev`; `portfolio-prod` runs `npm run start`, which needs a prior `npm run build`.
- `.claude/settings.json` pre-approves `npm run lint` and `npm run type-check` (Bash and PowerShell), asks before any shell command that names `/api/schedule/book`, and blocks reading `.env*` files. Its `.env.example` exception only applies when user-level settings don't also deny `.env*`; the variable list is in README.md's "Environment variables" table.
- Keep shared conventions in AGENTS.md and only Claude Code-specific notes here. On Windows keep this file as an `@AGENTS.md` import, not a symlink.
