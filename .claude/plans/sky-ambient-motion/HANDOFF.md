# Handoff: sky ambient motion and transients (planning)

Last updated: 2026-10-25, research done; planning workflow next.

This file lets another session (on any account) pick up the work where it stopped. The copy-and-paste prompt is at the bottom.

## Goal

Plan, but don't yet implement:

1. Ambient star motion with physically consistent parallax, so the sky feels 3D even with no scrolling.
2. More frequent shooting stars from varied directions, plus other space bodies.

The deliverable is `.claude/plans/sky-ambient-motion/PLAN.md`, audited by four separate reviewers: Next.js 16.4 official docs, codebase conventions, DRY, and separation of concerns.

## Status

- [x] Read the current sky system (`src/lib/sky/*`, `src/components/sky/*`).
- [x] Coordinated with the other cloud session, "Stars and comment animation redesign" (`session_01ETNMD4Evfbvs1kq6PPU3AK`, branch `master-r26syw`, not pushed). It owns the meteor veil, its fixes land first, and it set hard constraints. All of this is in `COORDINATION.md`: one lit transient near copy at a time, every transient kind goes through the veil checks and the scroll cancel, and its functions are off-limits until its commit lands. It will send its final plan and commit. When that arrives, update `COORDINATION.md` and re-check `PLAN.md` against it.
- [x] Research, with four Opus max subagents. Reports are in `research/` (R1–R4):
  - R1: physics of depth and parallax.
  - R2: meteors and other space bodies, rates, WCAG.
  - R3: rendering and scheduling engineering.
  - R4: motion design and the old implementation.
- [ ] Planning workflow `sky-motion-plan` (run `wf_dd8855ca-555`) is running: 2 Opus max planners (experience-first, domain-model-first), then a judge that writes `PLAN.md`, an adversarial checker, and a reviser. Its brief is `research/01-planning-brief.md`. The planner drafts go to this session's scratchpad, which another session can't reach. If `PLAN.md` is missing or has no "Check log" section, rerun this step from `01-planning-brief.md`.
- [ ] Four auditors (Next.js docs, conventions, DRY, separation of concerns) write to `audit/`.
- [ ] Fold the audit findings into `PLAN.md`, then commit and push to `claude/quirky-carson-btv2u4`.

## Key facts

- Branch: `claude/quirky-carson-btv2u4` on JosephBerm/Portfolio, based on master 246c0aa.
- The shared brief for all subagents is `research/00-shared-brief.md`. It holds the user's request verbatim, the code map, the current behavior and the rules.
- The old upward-moving stars live in git history before d116918; see `src/css/Background.css` at 7c176fb^.
- `node_modules` must be installed (`npm ci`) for `node_modules/next/dist/docs`.

## Copy-and-paste prompt for a new session

```
Continue the planning task in JosephBerm/Portfolio on branch claude/quirky-carson-btv2u4.
Read .claude/plans/sky-ambient-motion/HANDOFF.md first, then everything in .claude/plans/sky-ambient-motion/.
Pick up at the first unchecked Status item. Use separate Opus max subagents for research, planning, and the four audits (Next.js 16.4 official docs in node_modules/next/dist/docs, codebase conventions per AGENTS.md/CLAUDE.md, DRY, separation of concerns: one subagent per scope).
Coordinate with the cloud session "Stars and comment animation redesign" (session_01ETNMD4Evfbvs1kq6PPU3AK) via send_message: it owns the meteor veil.
Planning only, no source changes. Keep HANDOFF.md current and commit and push it to claude/quirky-carson-btv2u4 after each milestone.
```
