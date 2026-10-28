# Veil measurement harness (archived)

`veil-confirm-final-1.tar.gz` is a copy of the meteor-veil session's final confirmation harness, archived on 2026-10-27. The original lives in that session's temporary scratchpad and won't last. The plan uses it to measure crossings again after P9, and checkpoint V uses it to set the crossing cooldown (`PLAN.md` 8.5 step 5, H8 and H9). The veil session asked us to report the new numbers to Joseph next to its own (`COORDINATION.md`, "Answers to the planning session's questions").

It is an archive, not loose files, because `tsconfig.json` type-checks every `**/*.ts` file and ESLint lints everything outside `.claude/worktrees/`. Loose copies of the harness's `.ts` and `.mjs` files would break `npm run lint` and `npm run type-check` if this folder ever reached master.

## Contents

`tar -xzf veil-confirm-final-1.tar.gz` extracts a `meteor3/` folder:

- `meteor3/impl/confirm-final-1/`, the harness:
  - `lib.mjs`: shared loaders and the capture reader.
  - `transpile.mjs`: builds `pure/<tree>/` from the repository: `base` is HEAD, `proto` is the working tree, and `before` is `before-src/`.
  - `sim2.mjs`: the planner batch across nine viewports.
  - `render3.mjs` and `check11/render3-canvas.mjs`: the rendered streak and glimmer counts.
  - `check11/` and `live/`: the live headless-Chromium runs against `next dev`.
  - `harness/`: the worker tests and visits.
  - `run-*.sh`: the batch entry points.
  - `before-src/`: the sky sources before the veil's round-1 fixes.
  - `results/`: the text summaries, including `batch/planner-9-viewports.txt` and the exact working-tree diff `wt-final.diff`.
- `meteor3/code-logic/zones/*.json`: the nine captured layouts (1024x768, 1280x720, 1280x800, 1366x768, 1440x900, 1536x864@1.25, 1920x1080, 2560x1440, 390x844@3m), with each quiet rect and its headroom.

## Left out

These are left out to keep the archive at 174 KB:
- `pure/`, which `transpile.mjs` regenerates;
- the large per-flight result JSON files (`render3-results-*.json`, about 8.5 MB);
- the PNG strips;
- the veil plan's proposed files (`meteor3/plan/proto`), so `PTREE=plan` won't run.

## Running it

1. Extract the archive into a scratch folder, never into the repository.
2. Edit the absolute paths at the top of these files to point at the extracted `meteor3/` folder and the checkout you measure:
   - `lib.mjs`: `ROOT`, `HERE` and `ZONES`;
   - `transpile.mjs`: `HERE`, `PLAN` and `REPO`;
   - `check11/live-lib.mjs` and `live/alib.mjs`: `TARGET` defaults to `http://localhost:3000/`.
3. Run `node transpile.mjs` and `node harness/build.mjs`, then the `run-*.sh` scripts. Their header comments give the order. They need Node 24, Git Bash, the repository's `typescript`, and Playwright's Chromium for the live and render runs.

The live runs only load the home page. They never call `/api/schedule/book`.
