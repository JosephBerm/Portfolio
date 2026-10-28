# Check round 7: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 7 (a gate round). I confirm round 6's fixes in this lens, look for regressions from every round 6 change that touches the lens, sweep the rest of `PLAN.md`, and report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md`:
  - its "Confirmed veil interface (2026-10-27)";
  - new this round, its "Answers to the planning session's questions (2026-10-27)", which the task makes authoritative once present.

  That covers names and signatures, the hands-off symbols before the veil commit (V), the blocked phases, one route for the file-rule answer and for PF, one ink lease, `transientQuietFactor` and `scrollKept` for every near-copy transient, and 5 s per transient.
- **Accessibility.** WCAG 2.2.2, 2.3.1 and 2.3.3; 1.4.3 through the per-rect budgets; 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `REVIEW-LOG.md` and my round 6 report.
  - `COORDINATION.md`, read twice: it gained the answers section during this round (commit 4606c23, 20:14:35).
  - `PLAN.md` (3,819 lines, commit 5302efe, 20:10).
  - The worktree's code at 246c0aa, and the main checkout's uncommitted veil diff (read only).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only. I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or the main checkout. Scratch copies are in the session scratchpad (`check-r7-a11y/`).

## Method

- **Round 6's changes.** I diffed `PLAN.md` word by word against the snapshot round 6 checked (`check-r6-a11y/PLAN.r6.md`): 57 hunks, in `check-r7-a11y/r6.wdiff`. I read every hunk in the lens.
- **The current plan.** I re-read:
  - sections 1, 2.2 and 3 (D1, D4, D10);
  - 4.2 to 4.4 and 5.1;
  - 6.1's worker side, 6.2's demand and mechanism, 6.4, and 6.6 to 6.13;
  - all of 7, all of 8, 9.2, 10.4, 11 and 12.
- **The answers.** `COORDINATION.md` changed mid-round: 4606c23 adds its answers after `PLAN.md`'s last commit. I mapped each of the five answers and the three P9 asks onto `PLAN.md` with grep.
- **The hands-off symbols.** I checked the answers' list against the main checkout's working tree (read only; its sky files were last written between 19:29 and 19:43) and against 246c0aa.

## Round 6 dispositions in this lens

| ID | Verdict | Where |
|---|---|---|
| CA6-1 | Landed:<br>- section 1 (`:20`), 4.4 (`:325`, `:341`) and 7.0 (`:2859`);<br>- 7.2's map, P8 row and note (`:2966`, `:2980`, `:2987`);<br>- P1 (`:3013`), P5 (`:3145`), PF step 4 (`:3393`) and 8.7 (`:3554`);<br>- D10 (`:178`), CP-4 (`:3421`), R-1 (`:3711`) and P13's heading (`:3370`).<br>Some drift is left over:<br>- CP-0's exit (`:3417`) and P1 step 3 (`:3030`) still say "V" only;<br>- CP-4's void clause omits the declined overlap;<br>- 8.7's handshake names functions where 4.4 says files.<br>It is moot now: Answer 1 settles the rule at symbol level, and Answer 2 agrees to both overlaps (CA7-2). | the file-by-file and PF route |
| CA6-2 | Landed in 6.12 (`:2791`), AC-25 (`:3611`) and P12's `bodies.ts` entry (`:3364`). Residual: the worker side (CA7-5). | the comet's pause |

Other lenses' round 6 changes that touch this lens:

- **SOC6-1 (`frameAt` gathers first).** No accessibility regression: H13 case 6 covers the stale twinkle frame. Its new `frameAt` line is missing from 8.6's overlap row (folded into CA7-2).
- **DRY-R6-2 (`leanWanted`).** A pause leaves no lean frames (`follow` is false), as 2.3.3 and AC-14 require.
- **C54 (the motion level replaces `twinkleLevel`'s guard).**
  - A load under reduced motion shows no twinkle: `motionLevel` starts at rest on 0 (`:914`, `:1718`).
  - Under `'off'` nothing draws (`frameState.live`, `:1235`).
- **SOC6-2 (farewell meteors get their own entry).** They hold the lease, fly under the full veil, and take `transientFade` (`scrollKept` with the pause fade) through `drawTransient`. H10 holds them to 5 s. The reading scene stays empty, because its scene report is null.
- **CONV6-3, PHY6-3 and C52.** No effect on this lens.

## Findings

### CA7-1 (blocking): the answered hands-off list includes `frameMode`, `tick`, `mountSky` and `SkyFrame`, which P1 to P7 and P13 edit before V without an agreed overlap

- **Sections.**
  - 4.4: "Ours, from P1" and "The veil session's until its commit lands".
  - 8.1's opening line, and 8.4's "What we won't edit".
  - 8.6: its opening note, and the `frameMode`, `SkyFrame` and `mountSky.ts` rows.
  - The edits themselves: 6.1's worker side, 6.2, 6.6 and 6.8's wiring.
  - P1 to P7, and P13.
- **Problem.**
  - **What the answers say.**
    - Answer 1 makes the file rule symbol-level: "don't reformat, reorder or move its symbols before the rebase".
    - Its list of "symbols with changed lines today ... replaces the shorter 'Changed shape' list above as the hands-off list".
    - Answer 2 agrees to two overlaps only: `frameAt` and `sameRects`.
  - **Four symbols on that list are edited before V, none of them an agreed overlap:**
    - **`frameMode`.** P2 makes it return `'active'` while the camera moves. P3 deletes it, with `frameInterval`, in favor of `frameDemand`.
    - **`tick`.** P2 adds `updateCamera`, P3 rewrites it, P5 adds the `easeEnded` frame, and P6 adds `gather`.
    - **`mountSky`, the controller function.** The veil changed its `headrooms` and `measureLayout` lines. These edits all sit inside it:
      - P4's activity listeners;
      - P5's `motion()`, `syncMotion`, message `switch` and `destroy`, and the removed reduced-motion query;
      - P7's pointer listener;
      - P13's relay loop.
    - **`SkyFrame`.** P1 adds `snap`. P2 puts `offset` in place of `parallaxScroll`. P4 adds `twinkleTime` and edits the `time` doc. P6 adds `thinFrom` and `thinLevel`.
  - **`PLAN.md` still builds on "Changed shape".**
    - 4.4 lists `frameMode`, `schedule` and `tick` as ours from P1.
    - 8.1 says "Until checkpoint V, this plan edits no veil-owned function".
    - 8.6 gives "none" as theirs for `frameMode` and `tick`, calls `SkyFrame` adjacent, and calls the `mountSky.ts` edits "different functions".
    - CP-0's "won't edit" list names none of the four.
  - **Consequence.** Built as written, the pre-V phases edit four hands-off symbols without the veil session's agreement, and P3 deletes one of them outright. Even on the lenient reading of "on our branch we may edit other lines of the same files", deleting `frameMode` removes the veil's own line (`quietEasing(t)`) before the rebase.
  - **CP-5 doesn't close the gap.** It would notice the new list, but it only says to "tell the veil session"; it gives no rule for an overlap it finds there.
- **Evidence.**
  - **`COORDINATION.md`.**
    - `:148-153`: Answer 1 (symbol-level; "don't reformat, reorder or move its symbols before the rebase"; the list "replaces the shorter 'Changed shape' list above as the hands-off list").
    - `:176` (`renderSky.ts`: "the imports, `SkyFrame` ..."), `:180` ("`frameMode`, `tick`, `updateMeteor` and `planLaunch`") and `:184` ("`mountSky.ts`: ... `quietRect`, `quietRects` and `mountSky`").
    - `:187-189`: "Yes to both overlaps" (`frameAt`, `sameRects`).
  - **`PLAN.md`, what it says is whose.**
    - `:330`: "Scheduling: `frameMode`, `schedule` and `tick`" among ours from P1.
    - `:332`: "`mountSky`'s activity, pointer and pause wiring".
    - `:333-339`: theirs, built from "Changed shape".
    - `:3401`: "this plan edits no veil-owned function".
    - `:3446`: CP-0's "won't edit" list.
    - `:3500`: "'Theirs' is the confirmed interface's 'Changed shape' list".
    - `:3504`: `frameMode` and `tick`, "replaced (P3) | none".
    - `:3512`: `SkyFrame`, "(adjacent)".
    - `:3521`: the `mountSky.ts` edits, "different functions".
  - **`PLAN.md`, the edits.**
    - `frameMode`: `:926` and `:3060` (P2); `:1218` (P3 "replaces `frameMode` and `frameInterval`").
    - `tick`: `:920` (`updateCamera`, `gather`); `:1280` (P3 replaces `tick`); `:1719` and `:3153` (P5's `easeEnded`); `:3188` (P6's `gather`).
    - `mountSky`: `:1676` ("Inside mountSky, with the other listeners (mountSky.ts:243-247)"); `:1976-1993` and `:3149` (P5); `:3224` (P7); `:3376` (P13).
    - `SkyFrame`: `:3021`, `:3053`, `:3125` and `:3186`.
  - **Code at 246c0aa.** `mountSky` spans `mountSky.ts:130-289`. Inside it sit `reducedMotion` (`:146`), `motion` (`:149`), the listeners (`:244-247`), `destroy` (`:249`) and the worker-message listener (`:261`).
  - **The veil's working tree** (main checkout, read only):
    - **`mountSky`.** It changes lines inside the function: `headrooms` at `:221`, and the `copyReader` call in `measureLayout` at `:229`.
    - **`frameMode`.** Its fade test now calls `quietEasing(t)` (`sky.worker.ts:142`).
    - **`SkyFrame`.** The `meteorInk` doc above `renderSky.ts:86` changed.
    - **`tick`.** Its body at `:202` is still identical to 246c0aa's (`:183`). The listing may come from a `git diff` hunk header: `@@ -189,11 +208,12 @@ function tick` heads the hunk that changes `updateMeteor`'s doc. The answer stays authoritative until the "landed" message brings the definitive list (`COORDINATION.md:142-146`).
- **Fix.**
  - **Adopt the list.** Use Answer 1's list as the hands-off list in three places:
    - 4.4: the veil's symbols until V;
    - 8.6: the "Theirs" column and its opening note;
    - CP-0's "What we won't edit".

    Drop 8.1's "edits no veil-owned function", or qualify it with the agreed overlaps.
  - **Request three more overlaps** (`frameMode` with `tick`, `mountSky`, and `SkyFrame` with the import lines) in 4.4, 8.6 and the CP-0 message. Each says what of theirs stays:
    - **`frameMode` and `tick`** (P2, P3, P5, P6). P3 replaces them. Their `quietEasing(t)` test becomes the call in the gathered `fading` line, in place of P5's `easing(layoutAt, QUIET.ease, t)`. `tick` keeps calling `settleQuiet` before the frame decision.
    - **`mountSky`** (P4, P5, P7, P13). We add listeners, `motion()`, `syncMotion`, the message `switch` and `destroy`. We never touch `headrooms`, `measureLayout` or the rect measurement.
    - **`SkyFrame`** (P1, P2, P4, P6). We add fields, put `offset` in place of `parallaxScroll` and edit the `time` doc. We never touch `quiet` or `meteorInk`. Our added import lines merge at the rebase, with theirs kept.
  - **A decline.** If they decline any of these, the steps that edit that symbol wait for V or PF, D10's question comes early, and 8.5 step 4 or 8.7 redo P0's baselines. This reuses the decline clause 4.4 already has for `frameAt`.
  - **`tick`.** Ask in the same message whether it really changed, since its body still matches 246c0aa.

### CA7-2 (major): the answers settle the plan's either-or branches, but `PLAN.md` still runs them as open questions

- **Sections.**
  - Section 1; D4 and D10; 4.4; 6.12 (the comet row); 7.0; 7.2.
  - P1, P5, P9 and PF.
  - In 8: CP-0 and CP-4 (8.2), I9 (8.3), the CP-0 message (8.4), step 4 (8.5), the `frameAt` and `sameRects` rows (8.6), and 8.7.
  - 12.1's R-1, and 12.2's question 2.
- **Problem.** `COORDINATION.md` says the answers "are authoritative and supersede PLAN.md's either-or branches on these points". `PLAN.md` predates them (5302efe at 20:10; the answers came in 4606c23 at 20:14). So:
  1. **The file rule** is settled at symbol level. Yet the file-by-file branch still runs through the whole plan, and P1 is still "blocked on CP-0's answer" to a question already answered.
  2. **Both overlaps are agreed**, with conditions `PLAN.md` doesn't record:
     - `frameAt`: keep its `contrast` local, `quiet: quietBlend(t)`, `meteorInk: contrast.meteorInk` and the doc line;
     - `sameRects`: keep comparing `headroom`, so a headroom-only change still reaches the worker.

     8.6's `frameAt` row also omits P6's `gather` call, which round 6 added (SOC6-1). So at the rebase, "keep both" doesn't cover that line.
  3. **The ready-to-send CP-0 message** asks again about the file rule, both overlaps, and requests 2 and 3.
  4. **The comet's fade** is answered "not with the hero fade as it stands". It may have a scroll-driven fade of its own only if that fade reaches 0 before any unmarked copy can come under its footprint, checked at the shortest supported viewport (phones held sideways); otherwise it takes `scrollKept`. Yet 6.12 still says a launch-gate fade "needs the veil session's yes (I9)", and 8.3 and 12.2 still list the question as open.
  5. **P9's third ask** is "After P9, rerun the crossing measurement and report the new numbers to Joseph next to the veil's". P9's verification compares the numbers with the veil's bar and retunes the cooldown, but reports nothing to the user.
- **Evidence.**
  - **`COORDINATION.md`.** `:138-140`; `:148-151`; `:187-189`; `:202-206`; `:225-230`.
  - **The file-by-file branch** in `PLAN.md`: `:20`, `:178`, `:325`, `:341`, `:2859`, `:2987`, `:3013`, `:3145`, `:3241`, `:3370`, `:3393`, `:3417`, `:3421`, `:3490`, `:3554` and `:3711`.
  - **The wait on CP-0's answer.** P1's block (`:3013`), P0's "done when" (`:3008`) and CP-0's exit (`:3417`).
  - **The CP-0 message.**
    - `:3444`: "Your file rule: please confirm our reading".
    - `:3448`: "Two overlaps we ask you to agree to".
    - `:3477-3478`: requests 2 and 3.
  - **8.6.**
    - `:3505` lists ours as "`snap` (P1, P2), `offset` (P2), `twinkleTime` (P4), `thinFrom`, `thinLevel` and the `keep` line (P6)". But 6.1 (`:922`) says "From P6 it first calls `gather(now, scene)`".
    - `:3510` is the `sameRects` row.
  - **The comet's fade.** 6.12 (`:2791`), 8.3's I9 (`:3438`) and 12.2 (`:3738`).
  - **P9's verification.** `:3303`.
- **Fix.**
  - **The file rule.** Record it as settled: 4.4's reading is confirmed. Drop the file-by-file branch from the places listed, or reduce it to one sentence in 4.4 that cites `COORDINATION.md`. P1 then no longer waits for CP-0's answer on the file rule (CA7-1's new overlaps aside).
  - **The decline machinery.** Keep it only for CA7-1's new overlaps.
  - **8.6.**
    - The `frameAt` row: add Answer 2's kept lines on their side, and P6's `gather` call on ours.
    - The `sameRects` row: a headroom-only change still reaches the worker and rebuilds the index.
  - **The CP-0 message.** Drop the settled questions and keep requests 1 and 4. Add CA7-1's overlap requests, and say that P9's new end tests will change the crossing numbers.
  - **The comet.** In 6.12, D4, 8.3's I9 and 12.2, the comet keeps `scrollKept`, which is the plan's default already. A fade of its own is allowed only under the veil's condition, checked at the shortest supported viewport.
  - **P9's verification.** Report the crossing numbers measured after P9 to the user beside the veil's, and log them (CP-2).

### CA7-3 (major): I9 is answered "yes, on three conditions", but the plan's fallback lifts on "agreement" without checking them, and its checks ignore `QuietBlend.next`

- **Sections.**
  - T2 and T3; 6.9 steps 2.2 and 2.3; 6.11; 6.12 (the comet row).
  - P11 and P12; H7; AC-24.
  - 8.3's I9, 8.7 item 4, 12.2, and section 3.
- **Problem.**
  - **Answer 3** lets kinds that never take the lease overlap a lease holder on three conditions:
    - (a) "No light inside any padded rect" holds for the kind's whole drawn footprint, glow included, on every frame. It is "checked against the zones a transient answers to: `blend.to` and `blend.next`". It holds by construction when the kind draws through `transientQuietFactor` with keeps `{ 0, 0 }`, sampled at its center, with a drawn radius of at most `QUIET.padding` (32 px).
    - (b) The kind keeps `scrollKept` from its own launch scrollY.
    - (c) Anything that adds light on quiet copy takes the lease.

    "Whether two transients at once look right is Joseph's call". The veil session's suggestion is to keep the shooting star's peak as the only bright moment.
  - **Answer 5** makes `QuietBlend.next?` final.
  - **What `PLAN.md` does.** It keys its two-way fallback to "until the veil session agrees to I9". As written, the fallback now switches off with no check of condition (a), and no one asks the user about the look.
  - **Satellites and the clear-sky meteor variants** meet (a) by construction. They draw a star sprite, or the meteor head's glow (σ 3 px), and take the factor at each point they draw.
  - **The comet does not.**
    - Nothing in the plan bounds its drawn radius (it has a coma and two tails) by 32 px.
    - Its per-frame box test checks one zone list ("one box against at most 64 rects", one layout's cap), not `blend.to` and `blend.next`.
    - A waiting layout's copy may already sit under its tails (`COORDINATION.md:208`). With the fallback off, a lease holder may light that same copy at the same time. That puts two lights on one copy, whose budget allows one transient plus the haze (condition c).
  - **The checks.** H7 and AC-24 test "from the frame the veil applies" a layout, and T3, 6.11 and P11 state the guarantee the same way. Condition (a) checks against `to` and `next`, and the final `transientQuietFactor` covers a waiting layout from the frame it arrives.
- **Evidence.**
  - **`COORDINATION.md`.** `:191-200` (Answer 3); `:208-213` (Answer 5).
  - **`PLAN.md`, the fallback.**
    - `:308`: T2, "Until the veil session agrees to I9".
    - `:2246-2247`: steps 2.2 and 2.3.
    - `:3345` and `:3351`: P11, "unless the veil session has agreed".
    - `:3546`: 8.7, "With no answer to I9".
  - **`PLAN.md`, the comet** (`:2791`). It has "a curved pale dust tail, a faint straight blue-white ion tail", and "its whole box stays clear of every zone's reach (`zoneReaches`), re-tested on every drawn frame (one box against at most 64 rects)".
  - **`PLAN.md`, the checks.** H7 (`:2942`); AC-24 (`:3610`); T3 (`:309`); 6.11 (`:2780`); P11 (`:3353`).
  - **`PLAN.md`, the open question.** I9 (`:3438`); 12.2 (`:3738`).
  - **Code.**
    - `MAX_QUIET_RECTS` is 64 per measurement (`mountSky.ts:40`).
    - `QUIET.padding` is 32 (`config.ts:138`).
    - `METEOR_LOOK.glow` is 3 (`config.ts:338`).
    - The veil's `transientQuietFactor` also takes the minimum with `quietFactor(blend.next, …)` when `next` is present (main checkout `scene.ts`, read only).
- **Fix.**
  - **Section 3.** Add a user decision, "two transients at once":
    - recommended default: keep the two-way rule as a look choice, as the veil session suggests (nothing else lights up while a shooting star holds the lease);
    - alternative: let satellites and the clear-sky variants overlap a lease holder.
  - **If the overlap is allowed:**
    - T2, steps 2.2 and 2.3, P11 and 8.7 drop "until the veil session agrees" and state the three conditions.
    - Satellites and the clear-sky variants pass (a) by construction.
    - The comet does one of two things. Either it keeps the rule both ways (no lease while it shows, and it starts to show only while no lease holder is active), or its box test runs against `blend.to` and `blend.next` on every frame.
  - **The checks.** H7 and AC-24, with the wording of T3, 6.11 and P11, test "no light inside any padded rect of `to` or `next`", from the frame a layout arrives.
  - **The open question.** Mark 8.3's I9 and 12.2's question 2 answered.

### CA7-4 (minor): PF never removes `LAYERS.*.parallax`, which V does

- **Sections.** PF (files and steps); 8.7 item 1; 8.5 step 5; 5.1's `config.ts` row; 6.1.
- **Problem.**
  - P2 stops reading `LayerConfig.parallax` and the three `parallax` values.
  - Only V removes them and rewrites the `LAYERS` doc's "scroll parallax" sentence (8.5 step 5).
  - PF edits the same block and doc (`LAYERS.far.inkKeep` 0 and the doc's arithmetic) but leaves the parallax keys.
  - So on the PF route, dead keys and a doc that misdescribes the shipped depth reach master for good. The plan's own rules say "dead keys mislead the next tuner" (6.10) and "A committed doc describes what its phase ships" (7.0).
- **Evidence.**
  - `PLAN.md`:
    - where they go: `:500` ("They go at V"), `:352`, `:3050`, `:3493` (8.5 step 5);
    - what PF edits: `:3391` (PF's `config.ts` edits) and `:3543` (8.7: "The `LAYERS` doc's arithmetic changes with it");
    - the plan's own rules: `:2476` and `:2867`.
  - Code: the keys at `config.ts:58-59` and `:78-80`; their one reader, `renderSky.ts:100`, goes in P2.
- **Fix.** PF step 2 (and 8.7 item 1) also does 8.5 step 5's `LAYERS` bullet:
  - remove `LayerConfig.parallax` and `LAYERS.*.parallax`;
  - the doc's parallax sentence becomes "how far each star moves comes from its magnitude (DEPTH)";
  - 5.1's `config.ts` row says "at V or in PF".

### CA7-5 (minor): the comet's pause fade has no writer in the worker

- **Sections.** 6.12 (the comet row); P12 (files per kind); 5.1 (the worker row); 6.9 ("In the worker").
- **Problem.**
  - CA6-2's fix gives the comet a pause fade over `TRANSIENTS.cancelFade`, "as `cancelLevel` fades transients", computed by the pure functions in `bodies.ts`.
  - A pause reaches the worker's `motion` handler, which calls `cancelTransients` for transients only (6.9), and the comet isn't a transient.
  - P12's comet files name `bodies.ts`, `config.ts`, `LaunchGate.cometShowing` in the launch gate, and the drawing in `renderSky.ts`. They don't name the worker's `motion` handler (where the pause time is recorded), the comet's state, or its hand-off to the renderer.
  - An implementer could leave all three unwired, and the comet would keep shining through a pause.
- **Evidence.** `PLAN.md`:
  - `:2791`: "Its box fade and its pause fade (from a pause or a switch to reduced motion, over `TRANSIENTS.cancelFade`, as `cancelLevel` fades transients)";
  - `:2369`: "The `motion` handler's `meteor = null` (`:441`) becomes `cancelTransients(transients, t)`";
  - `:3364`: P12's comet files;
  - `:368`: 5.1, "`cometShowing` and the scene in the launch gate (P12)";
  - `:3611`: AC-25, "a pause fades it out over `cancelFade`".
- **Fix.** Add the worker to P12's comet files and to 5.1's worker row:
  - the comet's state;
  - its pause time, set in the `motion` handler beside `cancelTransients` on any change away from full motion;
  - its hand-off to `renderSky.ts` in `draw`.

## Checked and holding (no finding)

- **The confirmed interface.** These still match the main checkout's working tree:
  - the planner: `PlanOptions`, `planMeteor`, `veiledFrom(zones, path, peak, ink)` (observed) and `planLaunch`'s order (fresh radiants drawn up front, long flights before short);
  - the drawing: `drawMeteor(…, fade = 1)`;
  - the helpers: `scrollKept`, `transientQuietFactor`, `budgetKeeps` and `inkBudget`;
  - the constants: `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS`, `SCROLL_CANCEL`, `QUIET_REACH`, `STAR_INK_PEAK` and `LAYERS.far.inkKeep` 0;
  - the rest: `SkyRect.headroom` and `contrastLevels`.
- **`QuietBlend.next` and the quiet index.** The index's tiles carry `from`, `to` and `level`, and `easedQuietFactor` ignores `next`. So H3's identity holds under the final interface.
- **The lease and the transients.**
  - There is one lease, and every transient goes through `transientFade` and `transientQuietFactor`.
  - Lifetimes: fireball 4.9 s, satellite 4.8 s, earthgrazer about 4 s, a burst's whole span at most 5 s, point flash at most 0.5 s. A cancel never extends a life.
- **P9's first two asks hold.**
  - Long flights are tried on every steer before any short flight.
  - The stickiness is kept: a resize clears it, and a layout doesn't.
  - `flights` stays, and the timing values stay in config (`SPEED_CLASSES`, `fallbackScale`).
- **2.2.2.** P5 merges before P4, P6 and P9 to P12 (7.0's gates).
- **2.3.1.** Tints reach at most 0.42 (wakes 0.37). Burst members are at least 0.35 s apart, and each transient changes at most 2,000 px².
- **2.3.3.** The springs and the lean hold under reduced motion and while paused.
- **1.4.11 for the control.**
  - The glyph is 14.1:1, and the ring is the global dashed outline.
  - The header is `bg-navy/85` with a 10 px backdrop blur (`Navbar.tsx`).
  - Both ends of every transient path, and satellites and the comet, stay below `METEOR.top` (I2's end test), so nothing bright passes behind the control.
- **2.5.8.** The target is 40 × 40.
- **2.4.11.** The header shows itself when focus enters it, and the control is `inert` under the phone menu.
- **Forced colors.** The sky and the control are hidden.
- **`prefers-contrast: more`.** `meteorInk` is 0, so `budgetKeeps` leaves no light on copy and the planner aims nothing at it.
- **`data-sky-quiet`.** Kept everywhere; only D1 (a) would touch `Introduction.tsx`.
- **Farewell meteors under PF.** Contact and the footer carry slate and light-slate text, whose headroom is at least slate body text's. So PF's flat-veil bound (0.059 against 0.064) covers them too.

## Summary

- **Round 6.** Both of my round 6 fixes landed. The other lenses' round 6 changes caused no accessibility regression.
- **The veil session's answers** arrived mid-round (`COORDINATION.md`, 4606c23) and are authoritative. `PLAN.md` predates them:
  - **CA7-1 (blocking).** The new hands-off list adds `frameMode`, `tick`, `mountSky` and `SkyFrame`. P1 to P7 and P13 edit them before V, and P3 deletes `frameMode`, but only `frameAt` and `sameRects` are agreed. The fix is to request them as overlaps, saying what of theirs stays, and to reuse the decline clause.
  - **CA7-2 (major).** The file rule, the two overlaps (with the lines to keep), the comet's fade and P9's reporting ask are all settled. `PLAN.md` still runs the either-or branches, and its CP-0 message asks the questions again.
  - **CA7-3 (major).** I9 is "yes, on three conditions", but the plan's fallback switches off on agreement without checking them:
    - the comet doesn't meet condition (a) by construction, and its box test ignores `blend.next`;
    - H7 and AC-24 test applied layouts only;
    - whether two transients may show at once is now the user's call.
- **Two minors.** PF leaves `LAYERS.*.parallax` behind as dead keys (CA7-4). The comet's pause fade has no writer in the worker (CA7-5).
- **Verdict:** revise (one blocking, two major).

## Verification

Skeptic pass, gate round 7, 2026-10-27. Each finding was re-checked against `PLAN.md` at 5302efe, `COORDINATION.md` at 4606c23 (its answers section included), the worktree's `src/` at 246c0aa, R2 §7, and, read only, the main checkout's uncommitted `git diff 246c0aa` of `sky.worker.ts`, `mountSky.ts`, `renderSky.ts` and `scene.ts`. Result: one blocking and one major finding survive, so this lens does not pass.

- **CA7-1: confirmed, blocking.** Every cited fact holds. Answer 1 confirms 4.4's own reading ("before V, nothing on their list ... is edited, except the overlaps 8.6 lists, each agreed in CP-0", `PLAN.md:322`) and replaces "Changed shape" with a longer hands-off list (`COORDINATION.md:148-184`) that names `frameMode`, `tick`, `mountSky`, `SkyFrame` and the import lines of `sky.worker.ts` and `renderSky.ts` (`:176`, `:178`); Answer 2 agrees to `frameAt` and `sameRects` only (`:187-189`). Yet 4.4 calls `frameMode` and `tick` ours (`:330`), 8.1 says no veil-owned function is edited (`:3401`), 8.6 gives theirs as "none", "adjacent" and "different functions" (`:3504`, `:3512`, `:3521`), and P1 to P7 and P13 edit all four before V (`:3060`, `:1218`, `:1280`, `:3153`, `:3188`, `:3021`, `:3053`, `:3125`, `:3186`, `:1676`, `:3149`, `:3224`, `:3376`). In the veil's working tree three of them carry changed lines (`quietEasing(t)` in `frameMode`, `sky.worker.ts:142`; `headrooms` and the `copyReader` call inside `mountSky`, `mountSky.ts:221` and `:229`; the `meteorInk` doc in `SkyFrame`, `renderSky.ts:85`), while `tick`'s body still matches 246c0aa and is named only by the `updateMeteor` hunk's header, so asking about it is right. Blocking under either reading of Answer 1: P3 deletes `frameMode` with their line in it, which "don't reformat, reorder or move its symbols before the rebase" rules out, and 8.5 step 2's "ours wins on structure" (`:3484`) contradicts "at the rebase its lines win". The fix asks for nothing `COORDINATION.md` forbids; the reviser should also put the worker's import lines (listed, and edited from P1) in the same CP-0 request, not only `renderSky.ts`'s. Same ground as r7-completeness-C55 and CG7-1, which name only `frameMode` and `tick`.
- **CA7-2: partly, minor.** Every observation is accurate: `PLAN.md` (5302efe, committed 20:12) predates the answers (4606c23, 20:14), keeps the file-by-file and declined-overlap branches (`:20`, `:325`, `:2987`, `:3554` and the rest listed), gates P1 on a CP-0 answer `COORDINATION.md` already records (`:3008`, `:3013`), has CP-0 ask the file rule, both overlaps and requests 2 and 3 again (`:3444`, `:3448`, `:3477-3478`), still treats the comet's fade as open (`:2791`, `:3438`, `:3738`), leaves P6's `gather` call out of 8.6's `frameAt` row (`:3505` against `:922`), and gives P9's verification (`:3303`) no report to the user. Two claims overreach: the `sameRects` condition is already recorded (6.4 at `:1524`, H3 at `:2938`, 8.5 step 5 and the 8.6 row: it compares `headroom` from V, and a headroom-only change rebuilds), and the rebase's "keep both" keeps every line either side adds to `frameAt`, so the missing `gather` is a listing slip, not an unprotected line. Minor, not major: nothing here changes what gets built, because each answer picks the branch `PLAN.md` already builds by default (the symbol-level reading, `scrollKept` for the comet, their `frameAt` lines untouched by every edit of ours, `headroom` compared), and `COORDINATION.md:140` says the answers supersede the branches; P9's crossing numbers already reach the user in the PR evidence 7.0 requires, where H9 compares them with the veil's, so the explicit report is a one-line addition. The fold-in is still worth making in this revision (it overlaps r7-completeness-C57 to C59).
- **CA7-3: partly, major.** The core holds. Answer 3 (`COORDINATION.md:191-200`) is a conditional yes whose condition (a) is checked against `blend.to` and `blend.next`, stricter than I9's premise ("any padded rect the veil has applied", `:3438`), and it leaves the look of two transients at once to Joseph. Yet T2, 6.9 steps 2.2 and 2.3, P11 and 8.7 lift the two-way hold on "agreement" (`:308`, `:2246-2247`, `:3345`, `:3351`, `:3546`), section 3 has no decision on the look (`:169-179`), and H7, AC-24, T3, 6.11 and P11 check only layouts the veil has applied (`:2942`, `:3610`, `:309`, `:2780`, `:3353`), although the veil's `transientQuietFactor` already takes `next` (main checkout `scene.ts`). The comet fails (a) by construction: R2 §7 gives its tails 90 to 180 px, far over `QUIET.padding` (32), and its per-frame box test names one list of at most 64 rects, not `next`. One claim is wrong: not every clear-sky meteor variant meets (a) by construction. Satellites (shape 2, a 7 device px sprite at DPR 2, sampled at its centre) and the zero-length point flash (glow σ 3 px) do, but bursts and earthgrazers draw a wake as a gradient between 9 sampled stops (`METEOR_LOOK.wakeStops`, the veil's `drawMeteor`), not the centre-sampled sprite of radius 32 px or less that the by-construction route needs; under the fix's alternative they need the comet's treatment (the both-ways hold, or a footprint check against `to` and `next`). Major, not blocking: keeping or lifting the hold breaks no constraint for satellites, the only never-lease kind the plan ships by default, but it decides what P11 and P12 build and would make the user's call without him, and the comet's gap matters only if D4 picks it. Same ground as r7-completeness-C56.

**Verdict after verification:** not pass (CA7-1 blocking and CA7-3 major survive; CA7-2 drops to minor).
