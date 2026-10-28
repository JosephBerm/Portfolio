# Check round 7: completeness and implementability

## Scope

- **Role.** Round-7 adversarial checker, lens "completeness". The checks: every section the brief requires is present and substantive; every settled default is followed or its deviation justified; every user decision has a default and alternatives; every new config constant has a value, units and a doc comment; every phase has a goal, files, steps, a visible-change statement, verification, a rollback and a blocked mark; a session on another model can implement P0 and P1 without re-deriving anything. Stale text and needless bloat are in scope. This round also confirms round 6's completeness fixes (C51 to C54) and looks for regressions from round 6's revision.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`.
  - `COORDINATION.md`, all of it. That includes the section "Answers to the planning session's questions (2026-10-27)", which commit 4606c23 added at 20:14 while this round ran, four minutes after `PLAN.md`'s last revision (20:10, committed in 5302efe). The resume context makes those answers authoritative.
  - `PLAN.md` (3,819 lines, 63,815 words), `REVIEW-LOG.md` (round 6 and gate round 6 rows), `drafts/check-r6-completeness.md`.
  - For `file:line`, the worktree's `src/` (master 246c0aa). The main checkout's uncommitted veil edits were read only, through `git diff`.
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/` or configuration in either checkout. The only other file written is a throwaway script in the session scratchpad (`check-r7-completeness/edge.mjs`).

## Method

1. Read the four briefs, round 6's report and log rows, then `PLAN.md` end to end.
2. Re-checked each round-6 completeness fix where it landed (table below), and the round-6 fixes from other lenses that touch completeness: CG6-1, CG6-2, CA6-1, CONV6-1, SOC6-1, SOC6-2, PHY6-3.
3. Checked `PLAN.md` against each of the veil session's answers. `COORDINATION.md` says they "supersede PLAN.md's either-or branches" and that "Gate round 7 folds them into PLAN.md". `PLAN.md` predates them: a grep finds none of the names they add (`quietEasing`, `QuietBlend.next`, `LayoutMessage`, `Shift`, `CopyReader`, `NORMAL_FONT_WEIGHT`, `rebuildHaze`).
4. Grounded the new hands-off list in the veil session's working tree (`git -C S:/Documents/repos/Portfolio diff`, read only): `frameMode`'s fade line, `tick` (no changed line), `mountSky`'s changed lines, `scene.ts`'s `QuietBlend.next` and `transientQuietFactor`, and `meteors.ts`'s private `CLEAR_SKY`.
5. Walked P0 and P1 as an implementer against today's `renderSky.ts`, `skyAssets.ts`, `sky.worker.ts`, `scene.ts`, `config.ts`, `mountSky.ts`, `eslint.config.mjs` and `package.json`. The script `edge.mjs` computes the largest sprite half-side over device pixel ratios, sized as `buildStarAtlas` sizes them.

## Round-6 fixes in this lens

| ID | Landed | Note |
|---|---|---|
| C51 | yes | `METEOR.fallbackScale` is in P9 step 1 (`PLAN.md:3290`) and gone from step 2 (`:3291`). P8 drops "`narrowLimit` per visit" from the narrow block's doc (`:2287`, `:3250`, `:3264`). |
| C52 | yes | 8.5 step 4 runs P1 step 3 when only the `sameRects` move was declined (`:3490`), and 8.7 does after PF (`:3554`). Now moot: answer 2 agrees to the move (C57). |
| C53 | yes | With CA6-1, every waiting phase starts at V or after PF: section 1 (`:20`), 4.4 (`:325`), 7.0 (`:2859`), 7.2 (`:2966`, `:2987`), P1 (`:3013`), P5 (`:3145`), PF step 4 (`:3393`), 8.7 (`:3554`), D10 (`:178`), CP-4 (`:3421`), R-1 (`:3711`), P13 (`:3370`). Now moot: answer 1 rules out the file-by-file reading (C57). |
| C54 | yes | P5 drops `twinkleLevel`'s `motion === 'full'` guard (`:3153`; 6.6, `:1704`), and H13 case 3 checks the twinkle easing over several frames (`:2948`). Traced against `sky.worker.ts:97-99`: before P6 the twinkle timer line keeps today's `motion === 'full'` test (`:1262`), and the `fading` line's motion ease (`:1244`) supplies the fade frames, with `easeEnded` for the last one (`:1719`). |

No regression from round 6's revision was found beyond the branches the answers now retire.

## Findings

### r7-completeness-C55 (blocking): the new hands-off list puts `frameMode` and `tick` on the veil session's side, and P2, P3, P5 and P6 edit them before V

- **Section.** 4.4 ("Ours, from P1"); 6.1 ("The worker side"); 6.2 (the two "replaces" headings); P2, P3, P5 and P6; 8.4 (CP-0); 8.5 step 2; 8.6 (first row).
- **Problem.**
  - Answer 1 confirms 4.4's symbol-level reading and replaces the "Changed shape" list with a longer hands-off list. That list names `sky.worker.ts`'s `frameMode` and `tick`, and the answer adds two rules: "don't reformat, reorder or move its symbols before the rebase" and "at the rebase its lines win".
  - `PLAN.md` still calls both functions ours from P1, and 8.6 says the veil commit changes none of them. Their working tree has changed `frameMode`: its fade line now calls a new worker-private `quietEasing(t)`. P3 deletes `frameMode` and moves its logic into `pacing.ts`, so before V it removes one of their changed lines and relocates their symbol. P2 (the `updateCamera` call), P5 (`easeEnded`) and P6 (`gather`) add lines to `tick`.
  - 4.4's own rule, which answer 1 confirms, allows no edit to a listed symbol before V except an overlap agreed in CP-0. CP-0 asks only for `frameAt` and `sameRects`. 8.5 step 2's resolution rule ("ours wins on structure") contradicts "its lines win".
- **Evidence.**
  - `COORDINATION.md:148-153`: "The file rule is symbol-level ... don't reformat, reorder or move its symbols before the rebase. Its symbols with changed lines today (this replaces the shorter "Changed shape" list above as the hands-off list)". `:180`: "`frameMode`, `tick`, `updateMeteor` and `planLaunch`". `:216`: "A worker-private `quietEasing(t)`, used by `frameMode`, `settleQuiet`, the layout handler and `rebuildHaze`."
  - Main checkout, read only, `src/components/sky/sky.worker.ts:142`, inside `frameMode` (`:136`): `if (meteor || scrolling || !emergenceDone(t - exitAt) || quietEasing(t)) return 'fade'`. `git diff` shows no changed line inside `tick` (`:202`); its name heads the hunk that changes `updateMeteor`, which may be why it is listed.
  - `PLAN.md:330` (4.4, "Ours, from P1"): "Scheduling: `frameMode`, `schedule` and `tick`, which become the gathered `FrameState`, `frameDemand` and the pacing policy."
  - `:1218`: "The worker's demand (replaces `frameMode` and `frameInterval` ...)"; `:1280`: "(replaces `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames` ...)".
  - `:3504` (8.6): "`frameMode`, `schedule`, `tick`, ... | replaced (P3) | none: the deferred layout applies inside `settleQuiet` ...".
  - P2: `:920`, `:926`, `:3060`; P5: `:1719`, `:3153`; P6: `:3188`.
  - `:3446-3448` (CP-0): neither function is in the won't-edit list or the two overlaps.
  - `:3484` (8.5 step 2): "in a function we rewrote, ours wins on structure, but every line their commit added there is ported into it".
- **Fix.**
  - In 4.4 and 8.6, take `frameMode` and `tick` off "ours" and list them as a third requested overlap.
    - P2 adds the `cameraMoving` reason to `frameMode`'s `'active'` line, which isn't one of their lines. P3 replaces `frameMode` and rewrites `tick`.
    - At V, their `quietEasing(t)` becomes `FrameState.fading`'s quiet-ease reason, in place of P5's `easing(layoutAt, QUIET.ease, t)`, so the test is written once. Every line they add to `tick` is kept.
  - Add the request to CP-0, noting that their diff shows no changed line in `tick`. For listed symbols, 8.5 step 2's rule becomes theirs: their lines win, and ours are added around them.
  - If they decline `frameMode`, P3 keeps it as it is until V. `demandNow` maps `frameMode(now)` onto 6.2's demands (`'active'`, `'fade'`, `'twinkle'`) and combines that with the camera line, so their fade line stays where it is, and the replacement happens at V. If they decline `tick` too, P3 waits for V, and with it P5, P4, P6 and P7.

### r7-completeness-C56 (major): I9 is answered (never-lease kinds may overlap a lease holder, on three conditions), but the plan still builds and tests for "open", and lacks the decision the answer hands to the user

- **Section.** 3 (decisions); 4.3 (T2, T3); 5.1 (`transients.ts`); 6.9 (launch steps 2.2 and 2.3); 6.12; 7.1 (H7); P11; 8.3 (I9); 8.4 (request 2); 8.7 (item 4); 9.2 (AC-24); 12.2 (question 2).
- **Problem.**
  - Answer 3 says yes, on three conditions:
    - (a) "No light inside any padded rect" holds for the whole drawn footprint, glow included, on every frame, against `blend.to` and `blend.next`. It holds by construction for a kind drawn through `transientQuietFactor` with keeps of 0, sampled at its centre, whose drawn radius is at most `QUIET.padding` (32 px).
    - (b) A moving kind still takes `scrollKept` from its own launch scroll.
    - (c) Anything that lights quiet copy takes the lease.
  - The answer also says "Whether two transients at once look right is Joseph's call", and suggests keeping the shooting star's peak as the only bright moment.
  - `PLAN.md` still marks I9 open. It keeps the two-way hold, and `LaunchGate.cometShowing`, which exists only for that hold, "until they agree", so an implementer can't tell whether P11 builds it.
  - Nothing checks condition (a) as stated. H7, P11 and AC-24 test only "from the frame the veil applies its layout": they never test `next` or the drawn footprint.
  - Section 3 has no decision for the visual question.
  - Satellites meet (a) by construction: one point (star shape 2, a radius of about 1.5 CSS px at DPR 2) drawn through `transientQuietFactor` with `CLEAR_SKY_KEEPS`. So does the point flash, whose glow reaches about 9 CSS px from its centre. Bursts and earthgrazers have wakes, and the comet has tails; their footprints exceed 32 px and are sampled at wake stops or parts, not at one centre.
- **Evidence.**
  - `COORDINATION.md:191-200` (answer 3, as quoted above).
  - `PLAN.md:308` (T2): "Until the veil session agrees to I9, no transient that never takes the lease is active beside a lease holder (6.9)."
  - `:2246-2247` (6.9): "from P11, until the veil session agrees to I9 (and under PF) ..."; "From P11, until I9 is agreed (and under PF), `nearCopy` is also true only while no other transient is active and no comet shows". `:360` (5.1): "I9's fallback (P11)".
  - `:3345`, `:3351` (P11): "I9's two-way fallback in the launch step, unless the veil session has agreed"; "H7 with satellites (and I9's fallback, unless the veil session has agreed)".
  - `:3438` (8.3): I9 "**open**". `:3477` (CP-0 request 2). `:3546` (8.7): "With no answer to I9, its fallback runs both ways". `:3738` (12.2, question 2).
  - Checks that stop at applied layouts: `:2942` (H7): "a layout takes effect when the veil applies it ... none adds light inside a padded rect from the frame the veil applies it". `:3353` (P11), `:3610` (AC-24): "from the frame the veil applies its layout (at most `QUIET.ease` after it arrives)".
  - `:169-179` (section 3): D1 to D11; none covers two transients at once.
- **Fix.**
  - 8.3 marks I9 answered and quotes (a) to (c). 12.2 drops question 2, and CP-0 drops request 2.
  - Section 3 adds D12, "A satellite beside a shooting star":
    - The default follows the veil session's suggestion, the shooting star's peak as the only bright moment. That can be today's two-way hold, kept as a look choice rather than a contrast rule.
    - Alternatives: allow the overlap, which the veil now permits under (a) to (c); or hold satellites while any meteor flies.
  - T2, 6.9 (steps 2.2 and 2.3), 5.1 and P11 then say "per D12" instead of "until the veil session agrees to I9". Under PF, keep the hold.
  - T3 adds (a) and (b) as the never-lease contract. H7, P11's verification and AC-24 check (a) against `to` and `next` from the frame a layout arrives, over the drawn footprint (for a satellite, its centre).
  - 6.12 and P12 say which could kinds meet (a) by construction (the point flash) and which must take the lease, prove (a) per drawn frame, or keep the D12 hold (bursts, earthgrazers, the comet).

### r7-completeness-C57 (minor): answers 1 and 2 settle the file rule and both overlaps, so P1's gate is already met and about 1,000 words of branches are dead

- **Section.** 1; D10; 4.4; 7.0; 7.2 (the note); P0 (step 5, "Done when"); P1 to P3 and P5 ("Blocked on"); P1 step 3; checkpoint V; P13's heading; PF step 4; 8.2 (CP-0, CP-4); 8.4; 8.5 step 4; 8.6 (intro, `frameAt` row); 8.7 ("Then"); R-1.
- **Problem.**
  - Answer 1 confirms 4.4's reading. Answer 2 agrees to `frameAt` (keeping their `contrast` local, `quiet: quietBlend(t)`, `meteorInk` and the doc line) and to the `sameRects` move (as long as it compares `headroom`).
  - The file-by-file branch and the declined-overlap branches can no longer happen. Yet `PLAN.md` gates P1 on a CP-0 answer that `COORDINATION.md` already records, has P0 send a CP-0 that asks those questions again, and keeps both branches throughout.
  - 4.4 also still lists what stays theirs from the "Changed shape" list that answer 1 replaced.
- **Evidence.**
  - `COORDINATION.md:148-151`, `:153`, `:187-189`.
  - `PLAN.md:325` (90 words): "If they read the rule file by file, every phase that edits one of their paths starts at V ..."
  - `:3013` (P1): "**Blocked on.** CP-0's answer confirming 4.4's reading of the file rule ... On a file-by-file answer P1 starts after V".
  - `:3008` (P0): "P1 starts editing the veil session's paths once they (or the user) have confirmed 4.4's reading and the overlaps in 8.6".
  - `:3444` (CP-0): "**Your file rule: please confirm our reading.**"
  - Other dead or answered text: whole lines `:2987` (61 words), `:3554` (96) and `:3448` (77, the overlap request), and the two declined branches of `:3490` (about 80 of its 105). Clauses in `:20`, `:178`, `:320`, `:341`, `:2859`, `:3030`, `:3048`, `:3085`, `:3145`, `:3241`, `:3370`, `:3393`, `:3417`, `:3421`, `:3500` and `:3711`. Together about 1,000 words.
  - `:333-339` (4.4): the list built from "Changed shape".
- **Fix.**
  - Delete the file-by-file and declined-overlap branches.
  - Blocked-on lines:
    - P1: "P0".
    - P2, P3, P5 and P6: their predecessor, plus C55's overlap.
  - D10's trigger keeps only "P7 merged or skipped".
  - CP-0 keeps four things: the introduction, the request for the landing notice and crossing numbers, C55's request, and a pointer to answer 1's list instead of its own won't-edit list.
  - 4.4 points to answer 1 for the hands-off list.
  - 8.6's `frameAt` row names the four lines that answer 2 keeps theirs.

### r7-completeness-C58 (minor): answer 4 settles the comet's fade, which D4, 6.12 and CP-0 still treat as an open question

- **Section.** D4; 6.12 (comet row); 8.3 (I9); 8.4 (request 3); AC-25; 12.2 (question 2).
- **Problem.**
  - Answer 4 rules out a fade tied to the hero's launch gate, which is a boolean.
  - It allows an own scroll-driven fade in place of `scrollKept` only if that fade reaches 0 before any unmarked copy can come under the comet's drawn footprint, checked at the shortest supported viewport (a phone held sideways). Otherwise the comet takes `scrollKept`.
  - Either way the comet draws through `transientQuietFactor`, and it takes the lease if it lights quiet copy.
  - `PLAN.md` still asks the question. Here a phone held sideways (852 × 393) is wider than `NARROW_MAX_WIDTH` (640, `config.ts:29`), so the "desktop hero" comet can appear on one.
- **Evidence.**
  - `COORDINATION.md:202-206`.
  - `PLAN.md:2791` (6.12): "A fade with the launch gate instead needs the veil session's yes (I9)".
  - `:172` (D4): "under the one scroll rule (`scrollKept`) a comet is gone for the page view after its first 24 px of scroll".
  - `:3478` (CP-0 request 3), `:3438` (I9: "Without a yes on the comet's fade, it keeps `scrollKept`"), `:3738`.
- **Fix.**
  - 6.12 and D4 record answer 4: `scrollKept` as planned; as D4's alternative, an own scroll fade that passes that check at 852 × 393.
  - Drop CP-0 request 3.
  - `LaunchGate.cometShowing` stays only if D12 (C56) keeps the hold.

### r7-completeness-C59 (minor): answer 5 (`QuietBlend.next`) and the other additive changes leave stale figures, labels and rows

- **Section.** 4.2 (QuietZones); 4.3 (T3); 6.4; 6.11; 7.1 (H3); 8.6; P9 (verification); the "observed" labels.
- **Problem and evidence.**
  - `QuietBlend.next` is final (`COORDINATION.md:208-213`). `transientQuietFactor` now also takes a waiting layout's factor (main checkout `scene.ts`: `return blend.next ? Math.min(current, quietFactor(blend.next, x, y, keeps)) : current`). So a transient answers to a waiting layout from the frame it arrives. Two passages describe an exposure that no longer exists:
    - T3 (`PLAN.md:309`): "a layout that arrives mid-ease waits up to `QUIET.ease`".
    - 6.11 (`:2780`): "in which a satellite moves at most about 33 px on a 1,440 px wide window ... [computed]".
  - Neither 4.2 nor 6.4 says that the index ignores `next`, as `easedQuietFactor` does: stars keep it, so Q1 holds. H3's V rows don't include a blend with `next`.
  - Names marked "observed" now appear on the confirmed list (`COORDINATION.md:178-184`, `:219`, `:226-228`):
    - `pendingLayout`;
    - `planLaunch` and its order;
    - `contrastLevels`;
    - the cancel in `updateMeteor` and `draw` (the `scroll` handler is not on the list);
    - `color.ts`'s three exports.
    
    The labels and the hedges about a cancel in the handler can go: `PLAN.md:61`, `:2131`, `:2367`, `:2373`, `:3484`, `:3507-3509` and `:3522`.
  - 8.6's `mountSky.ts` row (`:3521`) calls the two sides "different functions". In fact P4, P5 and P7 edit lines inside `mountSky`, which is on the list along with `Shift`, `CopyReader` and `NORMAL_FONT_WEIGHT` (`COORDINATION.md:184`).
  - Answer 5's P9 note asks for the crossing measurement to be rerun after P9 and the numbers reported "to Joseph next to the veil's" (`COORDINATION.md:230`). P9's verification (`PLAN.md:3303`) checks the bar but reports to nobody.
- **Fix.**
  - T3 and 6.11: "from the frame a layout arrives (`to` and `next`)"; drop the 33 px sentence.
  - One sentence in 6.4: the index ignores `next`, as `easedQuietFactor` does. H3's V rows add a blend with `next`.
  - Drop the stale "observed" labels.
  - 8.6's `mountSky` row: "other lines of `mountSky`".
  - P9's verification ends with the report to the user.

### r7-completeness-C60 (minor): two statements P1 commits are imprecise: the EDGE doc's 9 px bound and the key guard's range

- **Section.** 6.5 (`EDGE`, SF2's guard); 4.3 (SF2); AC-8.
- **Problem and evidence.**
  - **The 9 px bound.** `PLAN.md:1563`: "the largest halo's half-side is at most 9 CSS px (3σ of the 2.8 px halo) at any ratio"; AC-8 (`:3594`): "EDGE 24 ≥ the 9 px halo".
    - Sprites are 2⌈3σ⌉ + 1 device px (`skyAssets.ts:57-60`), so the half-side is ⌈8.4 × DPR⌉ / DPR CSS px.
    - That is 9.33 at DPR 1.072, 10 at DPR 0.5, and 12 at 0.25: a 25% zoom, which `canvasDpr` passes through (`mountSky.ts:87-92`) [computed: `edge.mjs`].
    - 6.3 itself counts DPRs down to 0.5. EDGE 24 covers all of these, so only the doc is wrong.
  - **The key guard's range.** SF2 (`:305`) and the field (`:1535`, `:1561`) give the range as "within ±32,768 cells".
    - The key, `((cx + 0x8000) * 0x10000 + (cy + 0x8000)) * 4 + layer` (`renderSky.ts:39`), is injective only for −32,768 ≤ cy ≤ 32,767: `key(cx, 32768)` equals `key(cx + 1, −32768)`.
    - A guard written as `Math.abs(c) > 32768` would let that row collide.
- **Fix.**
  - EDGE doc: "at most 12 CSS px (⌈3σ⌉ of the 2.8 px halo in whole device pixels, at a 25% zoom; under 9.4 from DPR 1)". AC-8 changes to match.
  - Guard: "−0x8000 ≤ cx, cy < 0x8000".

### r7-completeness-C61 (minor): three names land at least one phase before anything reads them, so lint warns from P2 to P6

- **Section.** P3 (files, steps 2 and 4); 6.1 (`cameraSpeed`, `updateCamera`); 6.2 (the later-phase table).
- **Problem.**
  - `softwareFps` is declared in P3 step 2 and filled from the probe in step 4. Its only readers, `gather`'s `driftGate.allowed` and the cap line, arrive in P6: until then 6.2's table makes the cap line `Infinity`.
  - Likewise `cameraSpeed`'s `rate` (P2 has only the scroll term, P3 passes 0, P6 reads it) and `updateCamera`'s `scene` (read only by `leanTarget`, P7).
  - `@typescript-eslint/no-unused-vars` reports a variable that is only assigned, and an unused last parameter.
  - The rule is `warn` and `npm run lint` is `eslint .`, so every step still exits green. But lint is no longer "clean", which P0 step 2 requires of the baseline.
- **Evidence.** `PLAN.md:3090`, `:3098`, `:3100` (P3); readers at `:890` and `:1242` (P6 in the table at `:1258`); `:804-811`, `:898-908`; `eslint.config.mjs:13` (`'warn', { argsIgnorePattern: '^_' }`); `package.json:9`.
- **Fix.**
  - Move `softwareFps` and P3 step 4 into P6's worker step.
  - Add `rate` and `scene` in the phases that read them (P6, P7), or name them `_rate` and `_scene` until then.

## Summary

- **Verdict: revise.** One blocking finding and one major, both from the veil session's answers, which arrived after `PLAN.md`'s last revision. There are also five minor findings, each cheap.
- **Round 6's fixes held.** C51 to C54 landed, and the related fixes from other lenses read consistently. C52's and C53's branches are now dead text, since answers 1 and 2 rule them out.
- **What the answers change:**
  - **C55 (blocking).** `frameMode` and `tick` are on the veil session's hands-off list. P3 replaces `frameMode` before V and deletes their `quietEasing(t)` line, and P2, P5 and P6 edit `tick`. These edits need a third agreed overlap or a different P3, and 8.6's "Theirs: none" and 8.5 step 2's rule need correcting.
  - **C56 (major).** I9 is a yes on three conditions, and the visual question goes to the user. P11's hold, the checks of condition (a) against `to` and `next`, and a new D12 must follow.
  - **C57 to C59 (minor).** These cut about 1,000 words of dead branches, shrink CP-0, settle the comet's fade, and drop the stale `QuietBlend.next` figures and "observed" labels.
- **P0 and P1 are otherwise implementable from the plan alone.**
  - P1 needs nothing from the answers beyond the agreed `frameAt` and `sameRects` overlaps.
  - P0 needs a shorter CP-0 (C57).
  - The sketches for `profile`, `paintSprite`, `starSpriteIndex`, `placePoint`, the quiet index and the stamp cache match today's code, apart from C60's two wording slips.
- **The rest of the brief's checklist holds.**
  - Every required section is present.
  - Every settled default is followed or justified in 1.1.
  - D1 to D11 have defaults and alternatives; only D12 (C56) is missing.
  - Every new config block has a value, units and a doc comment.
  - Every phase has all its parts.

## Verification

Skeptic pass, gate round 7, 2026-10-27. Both findings were re-checked against `PLAN.md` as committed in 5302efe, the worktree's `src/` at 246c0aa, `COORDINATION.md` in full (its answers section came in 4606c23), and, read only, the main checkout's `git diff` of `sky.worker.ts`, `scene.ts`, `renderSky.ts` and `mountSky.ts`. Result: one blocking and one major finding confirmed, so this lens does not pass.

- **r7-completeness-C55: confirmed, blocking.** Every cited fact holds. Answer 1 confirms 4.4's reading ("before V, nothing on their list ... is edited, except the overlaps 8.6 lists, each agreed in CP-0", `PLAN.md:322`), and its hands-off list names `frameMode` and `tick` (`COORDINATION.md:148-153`, `:180`). In the main checkout, `frameMode`'s fade line now calls the new `quietEasing(t)` (`sky.worker.ts:131`, `:142`), while `tick` (`:202`) has no changed line (only the `updateMeteor` hunk's header names it). Yet 4.4 calls both ours (`:330`), 7.2 marks P2 and P3 "no" for the veil, P2 edits both (`:920`, `:926`, `:3060`), P3 replaces both (`:1218`, `:1280`), P5 and P6 add lines to `tick` (`:1719`, `:3153`, `:3188`), 8.6 says theirs is "none" (`:3504`), CP-0 asks for two overlaps only (`:3448`), and 8.5 step 2 says "ours wins on structure" (`:3484`). Blocking, not major: under either reading of answer 1 (4.4's strict one, or the literal "other lines of the same files"), P3 removes a listed symbol and their changed line before V, which "don't reformat, reorder or move its symbols before the rebase" forbids and "at the rebase its lines win" can't resolve; the `tick` part alone would be major. The fix is sound (`easing(layoutAt, QUIET.ease, t)`, `:1109`, is the same test as `quietEasing(t)`), with two gaps for the reviser: its decline branches leave out P2, whose `'active'` line and `updateCamera` call edit the same two symbols; and the same list names `SkyFrame`, the import lines of `sky.worker.ts` and `renderSky.ts`, and the `mountSky` function, which P1, P2 and P4 to P7 edit before V while CP-0 only announces them as adjacent edits (CG7-2, NJ7-1), so one CP-0 request with one stated reading should cover every listed symbol.
- **r7-completeness-C56: confirmed, major.** Every cited fact holds. Answer 3 (`COORDINATION.md:191-200`) says yes on conditions (a) to (c) and gives the look of two transients at once to Joseph, but `PLAN.md` still marks I9 open (`:3438`, `:3738`, CP-0 request 2 at `:3477`), ties the two-way hold and `LaunchGate.cometShowing` (which exists only for it, `:2247`, `:2791`) to "until the veil session agrees" (`:308`, `:2246`, `:3345`, `:3351`, `:3546`), and has no section-3 decision on the look (`:169-179`). So the plan and `COORDINATION.md` disagree on whether P11 builds the hold, and lifting it per the plan's own wording would make Joseph's call without him. Satellites meet (a) by construction (shape 2 is a 7 device px sprite at DPR 2, `config.ts:121`, `skyAssets.ts:57-60`, drawn at its centre through `transientQuietFactor` with `CLEAR_SKY_KEEPS`, `PLAN.md:2710`, `:2780`), and so does the point flash (glow σ 3 CSS px, `config.ts:338`, 9 px at 3σ). Bursts, earthgrazers and the comet don't: the veil's `drawMeteor` samples 9 wake stops and fills a gradient quad between them, and the comet's per-frame box test names no `next`. H7, P11 and AC-24 test only "from the frame the veil applies" a layout (`:2942`, `:3353`, `:3610`); the veil's `transientQuietFactor` already takes `next` (main checkout `scene.ts`), so satellites behave correctly, but the checks are weaker than (a). Major, not blocking: keeping or lifting the hold breaks no constraint, but it decides what P11 and P12 build. The fix stands; D12 should name every never-lease kind, not only satellites.
