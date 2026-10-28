# Check round 5: completeness and implementability

## Scope

- **Role.** Round-5 adversarial checker, lens "completeness": every section the brief requires is present and substantive, every settled default is followed or its deviation justified, every user decision has a default and alternatives, every new config constant has a value, units and a doc comment, and every phase has a goal, files, steps, a visible-change statement, verification, a rollback and a blocked mark. A session on another model must be able to implement P1 without re-deriving anything. Stale text left by the reconciliation and needless bloat are in scope. This round also confirms that the round-4 completeness fixes (C36 to C44) landed and looks for regressions.
- **Inputs.** `HANDOFF.md`; `research/00-shared-brief.md`; `COORDINATION.md`, all of it, especially "Confirmed veil interface (2026-10-27)"; `research/01-planning-brief.md`; `PLAN.md` (all 3,935 lines, 64,543 words); the round-4 findings and the reviser's dispositions. For `file:line`, the worktree's `src/` (identical to master 246c0aa). The main checkout's uncommitted veil edits were read only, through `git diff`.
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/` or configuration in either checkout. The only other file written is a throwaway script in the session scratchpad (`check-r5-completeness/stale-gate.mjs`).

## Method

1. Read the four briefs, then `PLAN.md` end to end.
2. Re-checked each round-4 completeness fix where it landed (table below).
3. Walked every phase's parts against 5.1's file map, 7.1's harness table, 9.2's AC phase column and 10.3's budgets. The AC phase column and every phase's checklist were extracted with a script and compared; they match.
4. Traced the worker's frame decision as round 4 restructured it (`gather`, `demandNow`, `schedule` and the message handlers) against today's worker (`sky.worker.ts:152-168`, `:397-487`). A scratch script (`stale-gate.mjs`) replays the reading-scene wake-up with the plan's own presence, gate and demand rules.
5. Compared every pre-V edit of a function on the confirmed "Changed shape" list with 8.6 and the CP-0 message. The veil session's working-tree diff (`git -C S:/Documents/repos/Portfolio diff`, read only) shows which lines it touches.
6. Grepped for names that round 4 renamed or removed (`clearSkyFactor`, `Planned`, `TransientOf`, the old `PACING` keys, `SkyPauseToggle`, `sr-only`, `settleMotion`, the old invariant IDs, `inkFrom`, `METEOR_VEIL.inkKeep`). Only the check logs still use them, as history.

## Round-4 fixes in this lens

| ID | Landed | Note |
|---|---|---|
| C36 | yes, with gaps | Section 1, 4.4, 7.0, CP-0, P0 and P1 quote the file rule, state the reading and give the fallback. C46 and C47 below: the `frameAt` overlap, and the per-phase gates the rule implies, are incomplete. |
| C37 | yes | P9 runs H7 and H10 (`PLAN.md:3267`). B-9 is checked in P9 and P11 (`:3269`, `:3322`), and B-10 in P1 and P6 (`:3004`, `:3171`). |
| C38 | yes | 6.9 (`:2081`) routes every spec call through `launchKind<K>` and `movingOf<K>`, with the push as the one cast. |
| C39 | yes | Deviation 11, 6.9 (`:2262`), H9, AC-38, R-10 and 8.5 step 5 call the bar a lower bound and count `nearCopy` launches. |
| C40 | yes | PF wires `scrollKept` into `updateMeteor` and `draw` and adds `contrastLevels()` (`:3356`, `:3509`). The comet keeps `scrollKept` (6.12). |
| C41 | yes | "Optional" is gone from 6.5, 6.6, AC-32 and P4. P10 reaches master with P9 (`:2832`, `:2949`, `:3266`, `:3275`). |
| C42 | in part | P8 step 3 carries the rename and the README line (`:3228`). 5.1 still misses some phases (C49). |
| C43 | yes | 7.1 specifies H13's real-worker rig (`:2888-2892`). |
| C44 | in part | Round 3's log and the reconciliation's log are tables. The plan still grew 11.7% this round, to 64,543 words (section 6 alone: 27,177). Deduplication is the DRY audit's job, so there is no finding here. |

## Findings

### r5-completeness-C45 (major): a frame decision made after a message reads a stale drift gate, so an `activity` ping no longer wakes the drift (a P6 regression; F6, H13 case 1)

- **Section.** 6.1 (the worker side), 6.2 (`demandNow`, `schedule`), 6.6 (the `activity` case), F6, P6.
- **Problem.**
  - Round 4 moved the drift and ambient gates into `gather`, which runs only in `tick`. But `schedule` also runs after every message, and it computes `demandNow`. From P6, `demandNow` reads `driftWanted(driftGate)` and `driftGate.on` as the last tick left them.
  - The `activity` case runs `noteInput` and then `schedule`, and sets no `needsDraw`. The `pointer` case doesn't set it either.
  - So after the idle sleep, whose last tick gathered `on: false`, a key press, focus or pointer ping finds no camera or twinkle demand.
    - In the reading scene and the end bookend there are no launches, so no timer is set: the worker sleeps until the next scroll.
    - In the hero it wakes only when the held launch timer fires (`holdMeteors`, 3 s later), so the drift and twinkle come back 3 s late.
  - P4's "a key press brings it back over 4 s" holds at P4, whose twinkle line is computed fresh, and regresses at P6.
  - H13 case 1, which P6 runs, fails as written.
- **Evidence.**
  - `PLAN.md:906`: "`tick`: `gather(now, scene)` and `updateCamera(now, scene)` after `settleQuiet(now)` and before the frame decision".
  - `:855`: "fed from one gather per tick".
  - `:1211`: `demandNow` works "from this tick's gathered gates".
  - `:1268`: `schedule` "computes `demandNow`".
  - `:1239`: the twinkle line switches to `driftGate.on` in P6.
  - `:1665`: "The worker handles `activity` with `noteInput(now)`, followed by the usual `schedule(now)`".
  - `:2805`: the `pointer` case "doesn't set `needsDraw`".
  - Today's listener calls `schedule(now)` after every message (`sky.worker.ts:486`).
  - The sleeping timer exists only while launches are allowed (`:162-163`).
  - H13 case 1 (`:2915`): "after 95 s without input, one `activity` ping restarts frames at once".
  - [computed, scratchpad `check-r5-completeness/stale-gate.mjs`, using the plan's `notePresence`, `presenceLevel`, `driftWanted` and demand lines]:
    - the last tick at 92 s gathers `on: false` and level 0, then sleeps;
    - an `activity` at 95 s returns `wasIdle` true, and a fresh `driftWanted` would be true;
    - but `schedule` with the gathered gate gives "sleep (no timer)";
    - after `gather(now)`, the same decision asks for camera frames.
- **Fix.**
  - Gather before every frame decision: `schedule` (or `demandNow`) calls `gather(now, scene)` first, and `tick` keeps its own `gather` before `updateCamera`.
  - Reword "once per tick" to "once per frame decision (each tick and each `schedule`)" in 6.1 (`:812`, `:855`, `:870`), 6.2 (`:940`, `:1042`, `:1211`), DR2, 4.2's FrameDemand row and 5.1's worker row.
  - Add a P6 browser check: in the hero, after 95 s idle, one key press restarts twinkle frames at once, not after the 3 s launch hold.

### r5-completeness-C46 (major): the CP-0 message and 8.6 understate the `frameAt` overlap, and the plan's own decline clause doesn't cover what then waits

- **Section.** 4.4 (requested overlaps), 8.4 (the CP-0 message), 8.6 (the `frameAt` row), P2, P4, P6.
- **Problem.**
  - `frameAt` is on the confirmed "Changed shape" list. 4.4 allows pre-V edits there only within "the overlaps 8.6 lists, each agreed in CP-0".
  - 8.6 and the ready-to-send CP-0 message describe our `frameAt` edits as `snap` (P1) and `offset` (P2). But P4 adds `twinkleTime` to the frame it builds, and P6 adds `thinFrom` and `thinLevel` and changes its `keep` line. The veil session would agree to less than we edit, and P4 and P6 would then exceed the agreement under the plan's own rule.
  - The decline clause also understates the cost. A "no" to `frameAt` holds "P1 and P2", but P3 to P7 depend on P2 (7.2), and P4 and P6 edit `frameAt` themselves. Only P1 steps 1, 3 and 4 would then remain before V, and nothing tells the implementer that, or what to do next. P2's own block reads "Blocked on. Nothing."
- **Evidence.**
  - `PLAN.md:3470` (8.6): "`frameAt` (overlap) | `snap` (P1), `offset` (P2)".
  - `:3413` (CP-0): "`frameAt` (we add `snap` and the camera's `offset`; you add `contrastLevels()`)".
  - `:319`: "before V, nothing on their list below or on 'Changed shape' is edited, except the overlaps 8.6 lists, each agreed in CP-0".
  - `:338`: "if they decline, the step that needs it waits for V (... P1 and P2 for `frameAt`)".
  - `:1675`, with P4's files at `:3089`: "`SkyFrame` gains `twinkleTime`", which only `frameAt` fills.
  - `:3153` (P6): "`frameAt`'s `thinFrom`, `thinLevel` and `keep`".
  - `:3013` (P2): "Blocked on. Nothing."
  - The veil's `frameAt` change is one line (`const contrast = contrastLevels()`, main checkout `sky.worker.ts:302`), inside the function our P1, P2, P4 and P6 edit (worktree `sky.worker.ts:246-267`).
- **Fix.**
  - In 8.6's `frameAt` row and the CP-0 overlap sentence, list every pre-V `frameAt` edit: `snap` (P1, P2), `offset` (P2), `twinkleTime` (P4), and `thinFrom`, `thinLevel` and the `keep` line (P6).
  - In 4.4, say that a decline holds P1 step 2, P2, P4 and P6 until V (and, through P2, P3 to P7), and that the implementer then asks the user D10's question at once.
  - P2's "Blocked on" names P1 and the `frameAt` yes.

### r5-completeness-C47 (minor): the C36 gate isn't carried by the phases' "Blocked on" lines, 7.2's column or D10's trigger

- **Section.** P2, P3 and P5 ("Blocked on"); 7.2 ("Blocked on the veil?"); D10, CP-4 and the Checkpoint V heading.
- **Problem.**
  - The file-rule gate appears only in section 1, 4.4, 7.0, CP-0 and P1.
  - P2, P3 and P5 say "Blocked on. Nothing.", although they edit the veil session's paths (`config.ts`, `renderSky.ts`, `sky.worker.ts`, `mountSky.ts`, `protocol.ts`, `AGENTS.md`).
  - 7.2 answers "no" for P1 to P7, which holds only on 4.4's reading.
  - On a file-by-file answer, P1 to P7 start at V. Then "P7 merged or skipped", the only trigger for D10 and CP-4, never fires before V, and the plan never asks the user whether to keep waiting.
- **Evidence.**
  - `PLAN.md:3013`, `:3050`, `:3110`: "Blocked on. Nothing."
  - `:322`: "If they read the rule file by file, every phase that edits one of their paths starts at V".
  - `:177`, `:3386`, `:3205`: the D10 and CP-4 trigger is "P7 merged or skipped".
- **Fix.**
  - P2, P3 and P5: "Blocked on: CP-0's answer (through P1)", and for P2 the `frameAt` yes too.
  - 7.2's column: "no, on 4.4's reading (CP-0)".
  - D10, CP-4 and the V heading: "P7 merged or skipped, or, on a file-by-file answer to CP-0, once the files outside their list are prepared".

### r5-completeness-C48 (minor): three harnesses that steps require are missing from those phases' verification lists and from 7.1's phase column

- **Section.** 7.1 (H4, H5, H13), P5, P6, P8.
- **Problem.**
  - H4 tests the ends of the motion ease (P5) and the thin fade (P6). P5 step 4 requires "H4's ease rows", but neither P5's nor P6's verification runs H4, and 7.1 maps H4 to P3 only.
  - P8 step 4 requires "H5's pause, scroll, resume case and H13", but P8's verification lists only H7 and H10, and 7.1 maps H5 and H13 to other phases. This is the same class as C37.
- **Evidence.**
  - `PLAN.md:2906`: H4's phase column is "P3", but its criteria include "`easing` and `easeEnded` mark the ends of the motion ease and the thin fade".
  - `:3124` (P5 step 4) against `:3132` (P5's verification: "Lint, type-check, H12, H13's third and fourth cases, and the hydration check").
  - `:3168` (P6's verification: "H5 (the drift part) and H13").
  - `:3229` (P8 step 4) against `:3233` (P8's verification: "Lint, type-check, H7 (with the oracle) and H10").
  - `:2907` (H5: "P2, P6, P7") and `:2915` (H13: "P5, P6, P7").
- **Fix.** Add H4 to P5's and P6's verification and make its phase column "P3, P5, P6". Add H5 and H13 to P8's verification and add P8 to their phase columns.

### r5-completeness-C49 (minor): leftovers in the file map against the phases' own file lists

- **Section.** 5.1, 5.2, 6.2 (`demandNow`), P3, P5, P9, P12.
- **Problem.**
  - **`easing`.** P3's `demandNow` calls `easing`, which 5.1 and P5 add only in P5. The "lines that refer to later phases" table defers only the motion-ease line.
  - **The crossing cooldown.** P9 lists `transients.ts` for "`revealTransients` starts the crossing cooldown", but 6.9's P8 sketch already does that (and 5.1's `transients.ts` row has no P9).
  - **P12's other edits.** P12 adds `TransientSpec.clearSky(body)` and `LaunchGate.cometShowing` to `transients.ts`, and the worker fills the gate. Yet 5.1's `transients.ts` and `sky.worker.ts` rows have no P12, and P12's file list names neither file.
  - **The comet's module.** `src/lib/sky/bodies.ts` (6.12, P12) is missing from 5.1, from 5.2's list of model files and from 4.1.
- **Evidence.**
  - `PLAN.md:1225`: `(layoutAt !== null && easing(layoutAt, QUIET.ease, t))`.
  - `:3063`: P3 step 2 adds `demandNow`.
  - `:353` and `:3117`: `easing` comes in P5.
  - `:1233-1240`: the later-phase lines table.
  - `:3250` against `:2164` and `:2263` ("In P8 (0 s) that changes nothing"), and `:357`.
  - `:2764` and `:2218`: the spec member and `cometShowing`, set against the rows at `:357` and `:364`, P12's files at `:3329`, and 5.2's list at `:379`.
- **Fix.**
  - Move `easing` to P3, in 5.1 and P3's files, or note that P3 uses today's inline `t - layoutAt < QUIET.ease` until P5.
  - Drop P9's `transients.ts` line: P9 only sets the config value.
  - Add P12 to 5.1's `transients.ts` and `sky.worker.ts` rows and name both files in P12's list.
  - List `bodies.ts` in 5.1 and 5.2 as "P12, if D4 picks the comet".

### r5-completeness-C50 (minor): P8's text says both "no edit to the scroll handler" and "remove its `parallaxScroll` write"

- **Section.** Deviation 8, 6.9 (steps 1 and "In the worker"), 8.7 item 2, P8 step 4, 8.6.
- **Problem.** Three places say P8 leaves the veil-owned `scroll` handler untouched, while P8's file list, its step 4 and 8.6 remove the handler's `parallaxScroll` write. An implementer at step 4 meets a rule against the step.
- **Evidence.**
  - `PLAN.md:60`: "without touching that handler".
  - `:2209`: "keeps only recording `scrollY`".
  - `:2343`: "the `scroll` handler stays untouched".
  - `:3509`: "with no edit to the scroll handler".
  - Against those: `:2344` and `:3223` ("the `scroll` handler's write ... go"), `:3229` (step 4) and `:3472` ("P8 removes its `parallaxScroll` write").
- **Fix.** Say it once: P8 never moves the cancel into the `scroll` handler, and its only edit there is step 4's removal of the `parallaxScroll` write.

## Summary

- **Verdict: revise.** Two findings are major and four are minor. None is blocking.
- **C45** is a regression from round 4's "gather once per tick" design. A frame decision made after a message (`activity`, `pointer`) reads the previous tick's drift gate, so from P6 the drift no longer wakes on keys, focus or pointer pings after the idle sleep: never in the reading scene, and 3 s late in the hero. The plan's own H13 case 1 fails as written. The fix is to gather before every decision.
- **C46** is in the coordination contract the implementer sends verbatim. CP-0 and 8.6 describe the `frameAt` overlap as `snap` and `offset`, but P4 and P6 edit `frameAt` too, and a decline would stall all of P2 to P7, which the plan doesn't say.
- **The minor findings** are cheap bookkeeping:
  - the gate's "Blocked on" lines and D10's trigger (C47);
  - harness-to-phase mapping (C48);
  - 5.1 leftovers (C49);
  - one self-contradicting sentence about the scroll handler (C50).
- **The rest holds.**
  - Every required section is present.
  - Every settled default is followed or justified in 1.1.
  - Every decision has a default and alternatives.
  - Every new config block has a value, units and a doc comment.
  - Every phase has its parts.
  - P1 can be implemented from the plan alone (`profile`, `placePoint`, the index, the stamp cache, H1 to H3 and the cache harness are all specified against today's code).
- **Bloat.** The plan grew to 64,543 words (C44 in part). That is noted here for the DRY audit, not raised as a finding.
