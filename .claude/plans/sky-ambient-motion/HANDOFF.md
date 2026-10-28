# Handoff: sky ambient motion and transients (planning)

Last updated: 2026-10-28. Planning is done: `PLAN.md` is built on the veil commit `cf4d7b8`, and it converged in gate round 12. Next comes Joseph's decisions (section 3 of `PLAN.md`, all with defaults), then an implementing session.

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
- [x] Planning workflow. The first run (`wf_dd8855ca-555`, cloud) stopped when the cloud session ran out of credits, and its drafts were lost with the cloud scratchpad. It was rerun on 2026-10-27 from a local desktop session (`wf_406761f9-c9d`, worktree `.claude/worktrees/sky-ambient-motion`):
  - Three Opus max planners wrote drafts: experience-first, domain-model-first, delivery-and-risk-first.
  - A judge took the domain-model-first draft as the base (scores 59, 55 and 52 of 70, in `drafts/judge-scores.md`) and wrote `PLAN.md`.
  - Three rounds of four adversarial checkers (physics and math, code grounding, coordination and accessibility, completeness) followed. They raised 70, 36 and 25 findings, of which 30, 9 and 6 were blocking or major. The reviser fixed all of them; see `REVIEW-LOG.md`.
  - Round 3's fixes were not re-checked. The next review round does that.

  Drafts and check reports are in `drafts/`. If `PLAN.md` or `REVIEW-LOG.md` is missing, rerun this step from `01-planning-brief.md`.
- [x] Reconcile `PLAN.md` with the confirmed veil interface ("Confirmed veil interface" in `COORDINATION.md`), and re-check round 3's fixes. Done in `wf_09c7465f-276`; every change is in `REVIEW-LOG.md` under "Veil reconciliation (2026-10-27)".
- [x] Four auditors (Next.js docs, conventions, DRY, separation of concerns) write to `audit/`, and a skeptic verifies each auditor's findings. Round 4 ran the four checkers and the four auditors together:
  - 68 findings, 11 of them blocking or major.
  - The skeptics refuted none (see each report's "## Verification" section).
  - The reviser fixed all 68.
- [x] Fold the check and audit findings into `PLAN.md`, run gate rounds until no blocking or major findings remain, then commit and push to `claude/quirky-carson-btv2u4`. **Converged on 2026-10-28 in round 12** (`wf_05510e91-63b`):
  - round 11: 16 findings, 1 major;
  - round 12: 11 findings, all minor. All eight reviewers ran, and none raised a blocking or major finding.
  - A fold checker then diffed round 12's edits and found one minor issue, which was fixed (FC12-1).
  - `PLAN.md` is about 60,200 words.
  - Gate rounds 5 and 6 each ran all eight reviewers (four checkers, four auditors):
    - Round 5: 32 findings, 8 blocking or major.
    - Round 6: 22 findings, 1 major.
  - The reviser fixed every finding. Reports: `drafts/check-r<N>-*.md`, `audit/*-gate-r<N>.md`; logs: the "Check log" and "Audit log" in `REVIEW-LOG.md` (moved out of `PLAN.md` after round 6, so the plan holds only what an implementer builds from).
  - Gate rounds 7 to 10 (`wf_da80a929-257`) added a skeptic who tests every blocking or major finding and its severity:
    - Round 7: 31 findings, 8 blocking or major after the skeptics. It also folded in the veil's answers and landed numbers.
    - Then a restructure rebuilt the plan on the veil commit `cf4d7b8`: one tree, no fallback or file-rule branches, 63.8k down to 58.0k words.
    - Rounds 8, 9 and 10: 25, 20 and 19 findings, of which 3, 3 and 2 were major.
  - Every finding is fixed. The plan is about 59,700 words.
  - The convergence rule: a round raises no blocking or major finding that survives its skeptic, and a fold checker finds the final minor edits clean.

## Key facts

- Branch: `claude/quirky-carson-btv2u4` on JosephBerm/Portfolio, cut from master 246c0aa and merged with `origin/master` at `cf4d7b8`.
- The shared brief for all subagents is `research/00-shared-brief.md`. It holds the user's request verbatim, the code map, the current behavior and the rules.
- The old upward-moving stars live in git history before d116918; see `src/css/Background.css` at 7c176fb^.
- `node_modules` must be installed (`npm ci`) for `node_modules/next/dist/docs`.
- Veil session status on 2026-10-27: the local desktop session "Star and comment animation redesign" (`local_e2e17660-e99d-43e6-84ab-7337ee88227d`) finished the veil fix.
  - Joseph committed the fix as `cf4d7b8` on master, on 246c0aa: 11 files, +577 −184, with lint, type-check and its final Opus check clean.
    - Master was pushed, so `origin/master` is `cf4d7b8`.
    - We checked the commit's patch-id against the confirmed diff.
    - This planning branch merged `origin/master` at `cf4d7b8` on 2026-10-28, so its `src/` is the plan's baseline. Its own commits change only documents.
  - `COORDINATION.md` records:
    - its confirmed interface;
    - its answers to our five questions: the file rule is symbol-level, both shared-function edits are agreed, satellites may overlap a meteor under three conditions, and a comet keeps `scrollKept`;
    - its final crossing numbers.
  - Its harness and captured layouts are archived in `harness/` (see `harness/README.md`).
  - `PLAN.md` now starts from `cf4d7b8`: the implementing branch is cut from `origin/master` at `cf4d7b8` or later.

## Copy-and-paste prompt for an implementing session

```
Implement the sky ambient-motion plan in JosephBerm/Portfolio.
The plan is .claude/plans/sky-ambient-motion/PLAN.md on branch claude/quirky-carson-btv2u4: read HANDOFF.md, PLAN.md section 1, section 3's decisions (use the defaults unless Joseph chose otherwise), section 7.0 and 7.2, and COORDINATION.md first.
Cut a new branch from origin/master (cf4d7b8 or later) in its own worktree, run P0, then one phase per pull request in 7.2's order, verifying each as the phase says (npm run lint, npm run type-check, the named harness checks).
The veil-owned symbols in PLAN.md 8.4 are used and extended through options only; veiledFrom never changes.
```

## Copy-and-paste prompt to reopen planning

```
Continue the planning task in JosephBerm/Portfolio on branch claude/quirky-carson-btv2u4.
Read .claude/plans/sky-ambient-motion/HANDOFF.md first, then everything in .claude/plans/sky-ambient-motion/.
Pick up at the first unchecked Status item. Use separate Opus max subagents for research, planning, and the four audits (Next.js 16.4 official docs in node_modules/next/dist/docs, codebase conventions per AGENTS.md/CLAUDE.md, DRY, separation of concerns: one subagent per scope).
Coordinate with the veil owner via send_message: since 2026-10-27 that is the local desktop session "Star and comment animation redesign" (local_e2e17660-e99d-43e6-84ab-7337ee88227d), not the cloud session. See COORDINATION.md.
Planning only, no source changes. Keep HANDOFF.md current and commit and push it to claude/quirky-carson-btv2u4 after each milestone.
```
