# Judge scores: PLAN.md drafts (2026-10-27)

Three planner drafts were scored from 1 to 10 on seven criteria. Every claim below was checked against the worktree code (master 246c0aa), the research reports R1 to R4, the W3C APG pages (fetched 2026-10-27) and Node recomputations in the judge's scratchpad (`judge/drift.mjs`, `judge/misc.mjs`, `judge/heading.mjs`; not in the repository).

| Draft | Fidelity | Correctness | Implementability | Coordination | Accessibility | Clarity | DRY and SoC | Total (of 70) |
|---|---|---|---|---|---|---|---|---|
| Experience-first (X) | 9 | 7 | 8 | 6 | 9 | 9 | 7 | **55** |
| Domain-model-first (D) | 8 | 9 | 9 | 8 | 8 | 8 | 9 | **59** |
| Delivery-and-risk-first (R) | 8 | 7 | 9 | 6 | 7 | 8 | 7 | **52** |

**Base for PLAN.md: the domain-model-first draft.** It is the most correct: its sketches were type-checked and run, and its wake-up-loop simulation found two real bugs that the other two drafts still have. It is also the only draft that keeps the veil-owned scroll handler compiling unchanged. Grafts from the other two are listed at the end.

## Experience-first (X)

- **Fidelity 9.** The second-by-second first minute is built from real timings, which the judge confirmed: loader 3 s, reveal 3.75 s, rails 5.25 to 6.0 s (`animations.ts:34-38`, `IntroGate.tsx:54`, `SidePane.tsx:26`). It serves both requests. Its deviations are argued. The drift eases in from the dusk, which R3 §6 and R4 §2.4 both recommend. The new phases are justified. Pointer reach 10 departs from the brief's 12 on a thin reason.
- **Correctness 7.** The numbers check out: the phase bound is 205.5 px, and the contrasts are 14.13, 12.17, 10.94 and 1.28:1. Three faults:
  - The drift's frame demand is decided by the eased rate. After an idle stretch in the reading scene, where there is no twinkle demand, the worker never wakes again.
  - `snap` turns on at the start of the pause ease, so stars tick for the length of the ease.
  - "Within a thousandth is the target" ends the 0.2 s exponential at 1.38 s, not at the 0.6 s it claims.
- **Implementability 8.** It has concrete config blocks, `camera.ts`, the store and the control, a phase list and an acceptance table. The `frameClock.ts` design cannot land without editing a veil-owned handler.
- **Coordination 6.** In P3, "`rafId` becomes the clock". But the veil-owned `scroll` handler reads `rafId` and `timerId` (`sky.worker.ts:469`). The rest is strong: the V0 fallback, the IR list, and the scroll cancel offered to the veil session as a shared rule.
- **Accessibility 9.** It uses the APG carousel rotation-control pattern, verified (W3C: "since the label changes, the rotation control does not have any states, e.g., aria-pressed"). It computes the 1.4.11 contrasts and fixes 2.4.11 (the header slides fully off-screen, `Navbar.tsx:79`). Its eased stop avoids today's twinkle pop. Two weaknesses: a stored "playing" overrides a reduced-motion setting the visitor turns on later, and the phone control is hidden in the menu.
- **Clarity 9.** It has the best plain-words section (the moored boat, the one-lane bridge, snow in the headlights) and requirements derived from the experience.
- **DRY and SoC 7.** One motion level serves twinkle and drift, and one gap law serves every clock. But presence stays inline in the worker, and the frame-clock module crosses an ownership seam.

## Domain-model-first (D)

- **Fidelity 8.** It follows the brief closely, but keeps R1's phases. The judge recomputed that those start the stars moving 61° upward, the old sky's look, and keep them within 30° of level for only 16 of the first 60 s. Its 10° climb cap gives up some of the realism the user asked for.
- **Correctness 9.** Its checks were real. The quiet index matched exactly over 722,355 lookups, presence matched today's code bit for bit, and spring steps composed exactly. Its simulation found the two bugs it labels F6 and C5: the reading-scene wake, and the 11.2 px jump on the first scroll after a long rest. Two faults:
  - Resuming after a paused scroll leaves `parallaxScroll` stale, so the stars snap or glide on the next scroll.
  - P2 claims draw calls identical to P1 at camera (0, 0) while `snap` is already false under full motion.
- **Implementability 9.** It gives binding signatures and bodies for the camera, pacing, quiet index, presence and pause store. It lists 43 invariants, each with one enforcement point, and every phase has files, steps, verification and rollback.
- **Coordination 8.** It lists the stable seams the veil code reads (`rafId`, `timerId`, `noteInput`, `retryMeteors`) and keeps them, and it has a PF fallback. Three slips:
  - It renames the agreed option to `mayCrossCopy`.
  - It returns `{ meteor, nearCopy }` where COORDINATION.md says "the returned meteor reports `nearCopy`".
  - It suggests implementing in the main checkout, where the veil session works.
- **Accessibility 8.** It uses a valid APG toggle (a constant name plus `aria-pressed`), with the state visible through the glyph. "Play under reduced motion lasts for the page view" is the safest persistence rule of the three, and its placement is always visible on phones. It leaves the 2.4.11 header issue as a risk and keeps the twinkle pop on pause.
- **Clarity 8.** It has good analogies and an at-a-glance summary, but it is dense.
- **DRY and SoC 9.** It is the cleanest of the three. `presence.ts` and the pure pacing policy are split from the mechanism. The index wraps the veil's own math. The ink lease is derived, so it cannot leak. It has one `GapLaw`, a typed spec registry and named wake colours.

## Delivery-and-risk-first (R)

- **Fidelity 8.** Its phases (0.70, 0.00, 2.09) give the flattest opening of all three: within 30° of level for 52.7 of the first 60 s, and 19° at 5 s (recomputed). One exponential level ease replaces the brief's smoothstep. Shipping satellites before the veil boundary departs from the brief's order for a modest gain.
- **Correctness 7.** It has the exact bound formula (205.2 px), the pacing tables, the crossing-parity table and the TS2367 catch on `DRIFT.speed === 0`. Its faults:
  - It removes `rafId`, which the veil-owned handler reads.
  - The drift demand is decided by the eased level, which gives the same reading-scene wake bug.
  - The twinkle still drops in one frame on pause.
- **Implementability 9.** It has the best verification kit: a 12-line resolve hook that loads the real modules, and H1 to H10 with pass criteria. It also gives a kill switch per phase, budgets B-1 to B-10 and a phase map with sizes.
- **Coordination 6.** It removes `rafId` (`sky.worker.ts:469`). It writes its own scroll-cancel rule and ships satellites before the veil commit, although the veil session asked for transient work to come after its commit and agreed to write a kind-agnostic cancel helper. Its strengths are checkpoints CP-0 to CP-4, a ready-to-send message, and a kill-switch identity check after the rebase.
- **Accessibility 7.** It uses a valid `aria-pressed` toggle with a bordered pressed state (14.1:1). But a stored Play wins over a later reduced-motion setting, the phone control sits inside the menu, and 2.4.11 is left out of scope.
- **Clarity 8.** It is plain and well organized, with fewer analogies beyond the shared set.
- **DRY and SoC 7.** `skyWindow.ts` and `frameClock.ts` are clean seams. It duplicates the scroll cancel and `sameRects` until the rebase, and its satellites sample `quietAt` instead of sharing the segment test.

## What PLAN.md takes from each

- **From D (base):**
  - the domain model, invariants and enforcement table;
  - `presence.ts`, the pure `pacing.ts` and the worker-owned frame handles;
  - the quiet index and its exactness argument;
  - the stamp cache with a key-range guard;
  - the F6 frame-demand rule and the C5 rest rule;
  - the store rule that Play under reduced motion lasts for the page view, with the always-visible placement;
  - the transient envelope, typed registry and derived ink lease;
  - `GapLaw` and the `WakeColor` names;
  - the stable-seams list, the phase order and the PF fallback.
- **From X:**
  - the first-minute narrative and lifecycle scenes;
  - the drift easing in from the dusk;
  - one eased motion level for pause and reduced motion (made a finite 0.3 s smoothstep);
  - the scroll shift on resume;
  - the APG rotation-control pattern;
  - the 2.4.11 header fix;
  - the narrow and ADAPT caps kept on WebKit's unaligned clock;
  - the satellite first-appearance law (30 + Exp(60), capped at 150 s);
  - the climb guards from R2 as the default;
  - `METEOR_BRIGHTNESS` and the experience-derived requirements.
- **From R:**
  - the epicycle phases (0.70, 0.00, 2.09);
  - the resolve-hook harness and H1 to H10;
  - checkpoints CP-0 to CP-4 and the ready message;
  - the kill-switch identity check after the rebase;
  - budgets B-1 to B-10 and the risk register;
  - the crossing cooldown accepted on "crossings per minute at or below today's", with its parity table;
  - the scroll cancel at the conservative 16 px;
  - the satellite pass geometry;
  - the Next.js notes (the `worker` script strategy, and a production smoke build when the worker's module graph changes).
