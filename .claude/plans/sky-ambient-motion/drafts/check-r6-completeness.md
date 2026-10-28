# Check round 6: completeness and implementability

## Scope

- **Role.** Round-6 adversarial checker, lens "completeness": every section the brief requires is present and substantive, every settled default is followed or its deviation justified, every user decision has a default and alternatives, every new config constant has a value, units and a doc comment, and every phase has a goal, files, steps, a visible-change statement, verification, a rollback and a blocked mark. A session on another model must be able to implement P1 without re-deriving anything. Stale text left by the reconciliation and needless bloat are in scope. This round also confirms that round 5's completeness fixes (C45 to C50) landed and looks for regressions from round 5's revision.
- **Inputs.** `HANDOFF.md`; `research/00-shared-brief.md`; `COORDINATION.md`, all of it, especially "Confirmed veil interface (2026-10-27)"; `research/01-planning-brief.md`; `PLAN.md` (all 3,979 lines, 66,331 words); round 5's findings and the reviser's dispositions; `drafts/check-r5-completeness.md`. For `file:line`, the worktree's `src/` (identical to master 246c0aa). The main checkout's uncommitted veil edits were read only, through `git diff`.
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/` or configuration in either checkout. The only other files written are throwaway scripts in the session scratchpad (`check-r6-completeness/`).

## Method

1. Read the four briefs, then `PLAN.md` end to end.
2. Re-checked each round-5 completeness fix where it landed (table below), and traced round 5's design changes for regressions: `gather` inside `demandNow`, the scroll-quiet key moved into `TRANSIENTS`, `createMeteorMemory`, the comet's light (fade-in × `scrollKept`), the lean's pacing, D10's file-by-file trigger, 8.5 step 4's baseline redo, `startArea` in P9 step 1, and `init`'s assignment in P8.
3. Walked every phase as an implementer would, step by step, for what each step needs in order to type-check, since 7.0 makes every numbered step its own green commit. The walk used today's code in the worktree: `sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`, `config.ts`, `scene.ts`, `catalog.ts`, `meteors.ts`, `mountSky.ts`, `protocol.ts` and `Navbar.tsx`.
4. Scratch scripts (`check-r6-completeness/`):
   - `phase-parts.mjs`: every phase block in 7.3 has a goal, blocked mark, files, steps, visible change, verification and rollback. P1 to P13 all do; P0 (no repository change), V and PF point to 8.2, 8.5 and 8.7.
   - `ac-map.mjs`: 9.2's AC phase column against every phase's checklist. They agree; P12 names its item in prose ("AC-25 for the comet").
   - `h-map.mjs`: 7.1's harness phase column against the harnesses each phase names. They agree, including round 5's H4, H5 and H13 additions.
5. Read the veil session's working-tree diff (`git -C S:/Documents/repos/Portfolio diff`, read only) to confirm that the names the plan marks "observed" still hold: `planLaunch`'s order, `contrastLevels`, `pendingLayout`, `scrollKept` in `updateMeteor` and `draw`, and `veiledFrom(zones, path, peak, ink)`. They do.
6. Grepped for names renamed or removed in rounds 4 and 5 (`clearSkyFactor`, `Planned`, `inkFrom`, `METEOR_VEIL.inkKeep`, `meteorScrollQuietMs`, `frameState.camera`, the worker's old `ease`, the size guard). Only the logs and the planned move of `meteorScrollQuietMs` still name them.

## Round-5 fixes in this lens

| ID | Landed | Note |
|---|---|---|
| C45 | yes | `gather` runs first in `demandNow` (`PLAN.md:1222-1224`) and before `updateCamera` in `tick` (`:878`, `:1285`). The rewording reached 4.2 (`:244`), DR2 (`:285`), F6 (`:299`), 5.1 (`:367`), 6.1 (`:815`, `:858`, `:876-880`), 6.2 (`:947`, `:1218-1221`) and 6.6 (`:1680`). The later-phase table defers `gather` to P6 (`:1247`), and H13 case 1 has its hero twin (`:2938`). P6 repeats P4's key-press check (`:3194`). Traced against today's listener (`sky.worker.ts:397-487`): every message reaches `schedule`, which returns early while a frame is pending and otherwise gathers on the message's own `now`; `tick`'s second gather is idempotent for one `now`. No regression found. |
| C46 | yes | 8.6's `frameAt` row lists `snap` (P1, P2), `offset` (P2), `twinkleTime` (P4), and `thinFrom`, `thinLevel` and `keep` (P6) (`:3495`). CP-0 lists them too (`:3438`). 4.4's decline clause names what waits (`:340`), and P2's "Blocked on" names the `frameAt` yes (`:3038`). |
| C47 | yes | The "Blocked on" lines of P2, P3 and P5 (`:3038`, `:3075`, `:3135`), 7.2's column header and note (`:2959`, `:2977`), and the file-by-file trigger in D10, CP-4 and the V note (`:177`, `:3411`, `:3231`). |
| C48 | yes | H4's column reads P3, P5 and P6 (`:2929`). P5's and P6's verification run H4 (`:3157`, `:3193`), P8's runs H5's resume case and H13 (`:3259`), and the H5 and H13 columns include P8 (`:2930`, `:2938`). |
| C49 | yes | P3 uses today's inline quiet-ease test until P5 (`:1252`). P9's files no longer list `transients.ts`. P12 appears in 5.1's `transients.ts` and worker rows (`:359`, `:367`) and in its own files (`:3354`). `bodies.ts` appears in 4.1, 5.1 and 5.2 (`:207`, `:364`, `:382`). |
| C50 | yes | Deviation 8 (`:60`), 6.9 step 1 (`:2230`), 6.9 "In the worker" (`:2365`), 8.7 item 2 (`:3534`) and 6.1's `motion` bullet (`:911`) now say it once: P8's only edit to the `scroll` handler is step 4's removal of the `parallaxScroll` write. |

## Findings

### r6-completeness-C51 (minor): two step-ordering slips: P9 step 1 can't be green as written, and P8 leaves a doc naming a key it moved

- **Section.** P9 (steps 1 and 2); 6.10 ("The steer at a start point"); P8 (step 3).
- **Problem.**
  - 7.0 makes every numbered step its own green commit. P9 step 1 writes `radiants.ts`, whose `visitSteer` closure scales the fallback pass's durations by `METEOR.fallbackScale`. That key arrives only in step 2, so step 1 fails type-check as written (TS2339 on `METEOR`). Step 1's H8 sky parts don't need the steer, so either order works, but the plan names neither.
  - P8 moves `narrowLimit` out of `METEOR`, but `METEOR`'s narrow doc (`config.ts:283`) still says "`narrowLimit` per visit" until P9 step 2 rewrites that line. P8 can reach master on its own (7.0), so the stale doc can ship.
- **Evidence.**
  - `PLAN.md:3280` (P9 step 1): "... `radiants.ts` and `gaussian`, with H8's sky parts green."
  - `:3281` (P9 step 2): "... the old radiant, angle, speed, duration and peak keys removed and `METEOR.fallbackScale` added".
  - `:2563` (the steer, step 5): "`duration` is the class's range. On the planner's fallback pass it is scaled by `METEOR.fallbackScale`."
  - `:362` (5.1): `radiants.ts` gains `visitSteer` in P9.
  - `:2855` (7.0): "one commit per numbered step, each green".
  - `config.ts:235-308` (`METEOR` at 246c0aa) has no `fallbackScale`. `config.ts:283`: "... at most `narrowMaxPathShare` of the width, `narrowLimit` per visit."
  - `PLAN.md:2279` and `:3240` (P8 moves `narrowLimit`); `:2479` (P9 rewrites `:283`).
- **Fix.**
  - Add `METEOR.fallbackScale` (0.64, with its doc) in P9 step 1, beside the `Course` and `Steer` types, and drop it from step 2's list. Or say that step 1's `visitSteer` leaves the fallback scaling to step 2.
  - In P8 step 3, drop "`narrowLimit` per visit" from the narrow doc at `config.ts:283` when the key moves.

### r6-completeness-C52 (minor): a declined `sameRects` move defers P1 step 3 to V, but checkpoint V never runs it

- **Section.** 4.4 (requested overlaps); P1 step 3; 8.5 steps 4 and 5.
- **Problem.**
  - If the veil session declines the `sameRects` move, P1 step 3 (the quiet index) waits for V, and `drawLayer` keeps the per-star `easedQuietFactor`. P2 to P7 go on without the index, so P6's drift pays the per-star cost on every frame.
  - 8.5 step 4 starts deferred work only after a file-by-file answer or a declined `frameAt` overlap. Step 5 then adopts "the moved `sameRects` compares `headroom`", which assumes the move already happened. No step of V builds the index, so it can be forgotten after the rebase.
- **Evidence.**
  - `PLAN.md:340` (4.4): "if they decline, the step that needs it waits for V (P1 step 3 for the `sameRects` move; ...)".
  - `:3020` (P1 step 3): "(if the veil session declines the move, this step waits for V and `drawLayer` keeps today's per-star `easedQuietFactor` until then)".
  - `:3480` (8.5 step 4): "If CP-0's answer was file by file, or the `frameAt` overlap was declined (4.4), P1 (or its step 2) starts only now".
  - `:3482` (8.5 step 5): "the moved `sameRects` compares `headroom`".
  - `:1403` (6.4): today's per-star quiet math costs "1.3 to 1.7 ms a frame at 1,430 stars and 64 rects ... Once stars move every frame, that cost runs continuously."
- **Fix.** 8.5 step 4 adds: "If the `sameRects` move was declined, P1 step 3 runs now: the move (comparing `headroom`, as theirs does) and the index, with H3 green, before H1 to H6."

### r6-completeness-C53 (minor): after a file-by-file answer (or a declined `frameAt`), choosing PF never lets P1 to P7 start, yet PF step 4 and 8.7 assume they exist

- **Section.** 4.4; 7.2 (the map and the note under the table); P1 ("Blocked on"); D10; PF (step 4); 8.7 ("Then").
- **Problem.**
  - On a file-by-file answer, every phase that edits a veil path starts at V, and D10 asks the user early, with PF as one of the answers. If the user picks PF, V never comes, so by the letter P1 to P7 never start.
  - PF step 4 merges "the integration branch (P1 to P7 and PF)", and 8.7 says "P8 to P12 run on top of PF". 7.2's map places only P8 to P12 after PF. Nothing says that PF's handshake, which hands the veil-owned functions to this plan, also ends the wait for P1 to P7, or where they go relative to PF.
- **Evidence.**
  - `PLAN.md:324` (4.4): "every phase that edits one of their paths starts at V, in 7.2's order".
  - `:2977` (7.2): "every 'no' above but P0's (and the planet's) becomes 'at V'".
  - `:3003` (P1): "On a file-by-file answer P1 starts after V".
  - `:177` (D10): on that branch the user may "run the fallback PF (8.7)", and the early merge is "void on that branch, where P1 to P7 wait for V".
  - `:2956` (7.2's map): "PF fallback ─► then P8 to P12 as above".
  - `:3383` (PF step 4): "the integration branch (P1 to P7 and PF) reaches master".
  - `:3531` (8.7): "the veil-owned functions become this plan's".
- **Fix.**
  - In 4.4, 7.2's note and P1's "Blocked on", "at V" (or "after V") becomes "at V, or after PF's handshake (8.7), which ends the wait the same way".
  - PF step 4 adds: on that branch, P1 to P7 run after the handshake, in 7.2's order, and reach master with PF.

### r6-completeness-C54 (minor): nothing verifies the twinkle half of deviation 3, and P5's wording can leave today's one-frame drop in place

- **Section.** Deviation 3; 6.6 ("The motion level"); P5 (files, visible change, verification); H13 case 3.
- **Problem.**
  - Deviation 3 eases the twinkle out over 0.3 s on a pause because today's `twinkleLevel` drops every twinkling star to rest in one frame. That drop comes from the guard in today's `twinkleLevel`, `motion === 'full' ? ... : 0`.
  - P5 lands before P4 and says only "`twinkleLevel` times the motion level". Multiplying inside the guard compiles, passes every listed check, and keeps the one-frame drop: the guard zeroes the twinkle as soon as `motion` turns `'reduced'`.
  - No check would catch that. "Settles the twinkle within 0.3 s" also holds for an instant drop. H13 case 3 checks the last frame at level 0 and the star phases. H4 tests the pure ease helpers only. AC-27 measures positions.
- **Evidence.**
  - `PLAN.md:55` (deviation 3): "Today, turning reduced motion on drops every twinkling star to its resting brightness in one frame ... The pause control makes that switch common."
  - `sky.worker.ts:97-99`: `return motion === 'full' ? sceneAt(scrollY, height, documentHeight).twinkle * idleTwinkle(now) : 0`.
  - `PLAN.md:3143` (P5's files): "`twinkleLevel` times the motion level".
  - `:1656` (6.6): `twinkleLevel` "becomes `scene.twinkle × presenceLevel(presence, now)`, times the motion level from P5". That sentence is P4's, which lands after P5.
  - `:3153` (P5's visible change): "Pressing it settles the twinkle within 0.3 s".
  - `:2938` (H13 case 3): "A pause draws its last frame at level 0 with every star still at its phase".
- **Fix.**
  - P5's worker line: "`twinkleLevel` drops its `motion === 'full'` guard and multiplies by the motion level, which now carries it".
  - H13 case 3 adds: "after a pause, a twinkling star's alpha reaches its resting value over the 0.3 s ease, across several drawn frames, not in one".

## Summary

- **Verdict: pass.** There is no blocking or major finding, and four minor ones, each a one-line fix.
- **Round 5's fixes held.** All six completeness fixes (C45 to C50) landed. The `gather` fix holds on every message path: `schedule` returns early while a frame is pending and otherwise gathers on the message's own `now`, and `tick`'s second gather is idempotent.
- **The minor findings:**
  - C51: two step-ordering slips. P9 step 1 can't be green until `METEOR.fallbackScale` moves into it, and P8 leaves a doc naming `narrowLimit`.
  - C52: V never runs the P1 step 3 that a declined `sameRects` move defers.
  - C53: on the file-by-file branch, choosing PF never starts P1 to P7.
  - C54: no check verifies deviation 3's twinkle fade, and P5's wording allows keeping the old guard.
- **The rest is complete.**
  - Every required section is present and substantive.
  - Every settled default is followed or justified in 1.1.
  - Every decision (D1 to D11) has a default and alternatives.
  - Every new config block has a value, units and a doc comment, except the could kinds, which the brief asks to keep brief.
  - Every phase has its parts, and the AC and harness phase maps agree with the phases (scripts above).
- **P1 can be implemented from the plan alone.** The plan specifies, against today's code:
  - `profile`, the phased `paintSprite` and `starSpriteIndex` (with `STAR_PHASES = 1` reproducing today's layout and index);
  - `placePoint` and `snap`;
  - the quiet index, with H3;
  - the stamp cache and its key guard;
  - H1 to H3 and the cache harness.
- **Bloat, noted for the DRY audit and not raised.** The plan is 66,331 words. Section 6 alone is 27,700, and the check and audit logs are 3,683.
