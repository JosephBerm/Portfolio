# Check round 4: completeness and implementability

## Scope

- **Role.** Adversarial checker, round 4, lens "completeness and implementability". I confirm round 3's fixes, check the veil reconciliation through this lens, look for regressions either introduced, and report real problems in `PLAN.md`, not praise.
- **Inputs read.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it, including "Confirmed veil interface (2026-10-27)"), `research/01-planning-brief.md`.
  - `PLAN.md`, all 3,646 lines, including the check log's "Round 3" and "Veil reconciliation" parts; `drafts/check-r3-completeness.md`.
  - The worktree code at 246c0aa (`git diff --stat 246c0aa -- src/` is empty): `src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `README.md`, `tsconfig.json`.
  - Read only, to see how the confirmed interface is taking shape: the main checkout's uncommitted diffs of `sky.worker.ts`, `scene.ts`, `meteors.ts`, `config.ts`, `renderSky.ts`, `mountSky.ts`, `color.ts`, `protocol.ts`, `AGENTS.md`, `Introduction.tsx` and `SidePane.tsx`. Nothing there was edited.
- **Limits.** Planning only. I wrote this file and scratch files in the session scratchpad (`check-r4-completeness/`); `PLAN.md` and every repository file are unchanged.

## Method

- Walked every section the brief requires, every settled default and deviation, D1 to D11, every new config constant, and every phase's goal, files, steps, visible-change statement, verification, checklist, rollback and blocked mark.
- Cross-checked the phases' verification lists against 7.1's harness table, 9.2's "How" and "Phase" columns and 10.3's budgets.
- Checked each line of the "Veil reconciliation" log against the body and against every sentence of COORDINATION.md's confirmed section, and grepped for stale terms (`clearSkyFactor`, `scrollCancel`, `inkFrom`, `mayCrossCopy`, `meteorScroll`, `METEOR_VEIL.inkKeep`, the 0.9 peak rule, "text class", "optional").
- **Recomputed** with scratch files:
  - `h1-bytes.mjs`: today's 2D painter (`skyAssets.ts:45-78`) against the plan's separable `profile` painter at phase (0, 0), every star shape and both meteor sprites, at H1's DPRs and a sweep from 0.500 to 2.000 in steps of 0.001.
  - `registry.ts`: 6.9's registry types with two kinds (P11's shape), type-checked with the installed TypeScript 6.0.3 under the project's `strict` and `noUncheckedIndexedAccess`.
  - Word counts (`wc -w`) of `PLAN.md`, the committed `PLAN.md` at HEAD 2e622a5, R1 to R4, section 6 and the check log.

## Verdict: revise

One major finding and eight minor ones, none blocking.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| C36 | major | 1, 7.0, CP-0 (8.2, 8.4); reconciliation | COORDINATION.md's "stays off the veil session's files until Joseph approves and commits" is never reconciled, though P1 to P7 edit six of those files before V |
| C37 | minor | P9 verification; 7.1; 10.3 | P9 runs neither H7 nor H10, the only phase where H7's new lease assertions can fail; B-9 and B-10 belong to no phase |
| C38 | minor | 6.9 types and launch step | "The one cast" holds only with generic helpers; naive spec calls compile in P8 and fail with TS2345 once P11 adds a kind |
| C39 | minor | Deviation 11, 6.9, H9, AC-38 | The provisional crossing bar is built from visible-pass shares, a lower bound on the `nearCopy` share it is compared with |
| C40 | minor | PF, 8.7, I9, R-2 | Contingency gaps: PF lacks `contrastLevels()` and a meaning for `ink`, its scroll fix waits for P8, and I9's comet half has no fallback |
| C41 | minor | 6.5, AC-32, 7.0, P10, E7 | Stale "optional" for P4's twinkle clock; P10 called optional with no decision, though E7 needs it |
| C42 | minor | 5.1; P8 steps | The file map disagrees with the phases' files; P8's `scene.ts` rename sits in no step |
| C43 | minor | 7.1 (H13) | No recipe for running the worker under a fake clock, which H13 needs to gate P5 to P7 |
| C44 | minor | Whole plan; check log | Bloat grew again (57,798 words); round 3's log repeats the pattern C35 removed from round 2's |

## Major finding

### C36. The confirmed section's "stays off the veil session's files" is not reconciled

- **Section.** Section 1 (status, the "So phases P0 to P7 ... can proceed now" bullet); 7.0 "Where"; CP-0 (8.2) and its message (8.4); the "Veil reconciliation" log.
- **Problem.** COORDINATION.md's confirmed section sets an ownership rule at the file level: the implementing session "stays off the veil session's files until Joseph approves and commits that change, then rebases onto it". `PLAN.md` works at the function level instead ("avoid every veil-owned function") and has P1 to P7 edit six of the veil session's eight files on the integration branch before V. It never quotes that sentence, never says how it reads it, and CP-0 lets P1 start without the veil session's answer. An implementer told by P0 step 1 to "read `COORDINATION.md`" meets a contract sentence that, read plainly, forbids P1's own file list. Read the plan's way, it means "never the main checkout's working copies", which 7.0 already obeys. Read literally, P1 to P7 break a COORDINATION.md constraint. The reconciliation log covers every other part of the confirmed section, but not this sentence.
- **Evidence.**
  - COORDINATION.md:72: "The implementing session for `PLAN.md` builds on exactly these. It stays off the veil session's files until Joseph approves and commits that change, then rebases onto it."
  - COORDINATION.md:43 names those files: "`src/lib/sky/{meteors,config,scene,protocol}.ts`, `src/components/sky/{sky.worker,renderSky,mountSky}.ts`, and possibly `src/lib/sky/color.ts`".
  - PLAN.md:19: "So phases P0 to P7 and P13 avoid every veil-owned function and can proceed now, on an integration branch".
  - P1 to P7's file lists edit `config.ts`, `scene.ts`, `protocol.ts`, `sky.worker.ts`, `renderSky.ts` and `mountSky.ts` (P1 at PLAN.md:2795-2807, P2 :2829-2840, P3 :2866-2875, P4 :2896-2906, P5 :2926-2933, P6 :2962-2968, P7 :2997-3003).
  - PLAN.md:2653 (7.0) reads the rule as the main checkout only: "Never edit `src/` in the main checkout ... until the user approves its commit (COORDINATION.md, 2026-10-27)".
  - PLAN.md:3188, CP-0's exit: "Sent and logged. A reply is not required to proceed with P1 to P7."
  - `grep -n "stays off\|veil session's files" PLAN.md` returns nothing, and the 14 bullets of the reconciliation log (PLAN.md:3634-3646) don't mention it.
- **Fix.**
  - In section 1 and 7.0, quote COORDINATION.md:72 and state the reading: the implementing session never edits the veil session's working copies in the main checkout; it edits the same paths only on its own integration branch, never a veil-owned function (request 2), and rebases at V by 8.5's rule.
  - Add a line to the CP-0 message asking the veil session to confirm that reading, and make that one answer (from the veil session or the user) required before P1 edits any of the six shared paths.
  - Give the fallback if they read it as file-level: until V only new files proceed (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `skyPause.ts`, `SkyPauseToggle.tsx`, the icons, plus `skyAssets.ts` and `catalog.ts`, which aren't theirs), and the edits to the six files wait for V.
  - Log the decision in the reconciliation log.

## Minor findings

### C37. P9 skips H7 and H10, and two budgets belong to no phase

- **Section.** P9's verification (PLAN.md:3077-3081); 7.1's harness table; 10.3.
- **Evidence.**
  - P9 verifies with "Lint, type-check, H8 and H9, plus" crossings and the watch (PLAN.md:3077). 7.1 maps H7 and H10 to "P8 to P12" (PLAN.md:2725, :2728), and P9's own checklist cites them through AC-18 ("H7, L"), AC-31 ("C, H10"), AC-37 ("H7, H10") and AC-38 ("H7, H9, L") (PLAN.md:3366, :3379, :3385, :3386). P8, P10, P11 and P12 all list H7 and H10.
  - H7's reconciliation-era assertions are vacuous in P8: "a plan reporting `nearCopy` when its context's `nearCopy` was false counts as failed, while a null plan in that context never counts toward `maxFailedPlans`; no lease before the reveal plus `crossingCooldown`" (PLAN.md:2725). In P8 `crossingCooldown` is 0 (PLAN.md:2108) and every context allows copy ("In P8 every plan may reach copy", PLAN.md:2081). P9 is the first phase where these branches run, and it doesn't run H7.
  - H10's flight-with-train limit changes in P9 ("3.8 s in P8, 3.2 s from P9", PLAN.md:2728).
  - B-9 (shooting stars at the new rate) appears only in 10.3 and the round-1 log (PLAN.md:3438, :3587); B-10 (memory: atlas ≤ 2 MB at DPR 2, cache ≤ 2 × the visible cells, no growth over 30 minutes) only in 10.3 and 6.3's argument (PLAN.md:3439, :1242). No phase's verification measures either.
- **Fix.** Add H7 and H10 to P9's verification. Add B-9 to P9 (meteors) and P11 (with satellites), and B-10 to P1 (the atlas size per DPR and the cache bound) and P6 (the 30-minute heap check with drift).

### C38. "The one cast" needs generic helpers, which the plan doesn't name

- **Section.** 6.9 "Types" and the launch step (PLAN.md:1946-1990, :2085).
- **Evidence.**
  - The plan: "`schedule.active.push(envelope as Transient)` is the one cast" (PLAN.md:2085). The bodies of `updateTransients` and `transientDemand` are left to the implementer.
  - [computed, `registry.ts`, TypeScript 6.0.3, `strict` and `noUncheckedIndexedAccess`] With P11's two kinds, the natural bodies fail: `SPECS[transient.kind].moving(transient.body, now)` gives TS2345 ("Argument of type 'Meteor | SatellitePass' is not assignable to parameter of type 'Meteor & SatellitePass'"); `spec.lifetime(planned.body)` inside `for (const kind of TRANSIENT_KINDS)` gives the same, and the push gives a second TS2345. With one kind (P8) all of it compiles, so the break appears only in P11, whose step 2 promises compile errors only for a missing spec or `case` (PLAN.md:3121).
  - Generic helpers over `K` (`launchKind<K extends TransientKind>(kind: K, ...)` and `movingOf<K>(transient: TransientEnvelope<K>, ...)`) compile with exactly the one cast.
- **Fix.** In 6.9, say that every spec call goes through a helper generic in `K` (name the two) and that the push cast is then the only one. Write P8's bodies that way, so P11 only adds the kind.

### C39. The provisional crossing bar compares two different quantities

- **Section.** Deviation 11 (PLAN.md:63); 6.9's bar and table (PLAN.md:2124-2133); H9 (:2727); AC-38 (:3386).
- **Evidence.**
  - The bar comes from the veil commit's visible-pass shares: "the head behind copy at 0.12 white or more for 0.1 s in 29, 19 and 25% of flights ... put the bar near 0.46, 0.30 and 0.40 a minute" (PLAN.md:2124; COORDINATION.md:136).
  - What P9 counts is different: "A crossing is a launch that takes the lease (its meteor reports `nearCopy`)" (PLAN.md:2123), and `Meteor.nearCopy` is "true when `dimFrom < 1`" (COORDINATION.md:96). A head shown on a text rect is inside its padded rect, where the veil dims it, so every visible pass is a `nearCopy` launch, but not the reverse. The visible-pass share is therefore a lower bound on the veil commit's crossing share, and the 0.30 to 0.46 bar and the 55 s start are conservative by an unknown amount.
  - Deviation 11 calls it "a bar of about 0.30 to 0.46 crossings a minute", and AC-38 and H9 repeat the range as the veil commit's crossing level.
- **Fix.** Label the range "a lower bound, from visible passes" in deviation 11, 6.9, H9 and AC-38. In 8.5 step 5, say "count its `nearCopy` launches, not its visible passes", which CP-0 request 2 already asks for separately.

### C40. Contingency gaps in PF and I9

- **Section.** PF (PLAN.md:3160-3166); 8.7 items 2 and 4; I9 (8.3); R-2.
- **Evidence.**
  - PF promises "Every name, signature and value is the confirmed interface's, so P8 to P12 read the same either way" (PLAN.md:3163). But P8 builds its gate "with `ink` from `contrastLevels()`" (PLAN.md:3033), a veil worker function (COORDINATION.md:107) that PF doesn't add. PF also adds `PlanOptions.ink` (PLAN.md:3164) with no `INK_BUDGET`, `inkBudget` or `budgetKeeps` for it to scale, and doesn't say what the PF planner does with it.
  - 8.7 item 2 says "The scroll cancel fixes the verified bug", but PF only adds `scrollKept`, and "P8 applies them" (PLAN.md:3308). PF step 4 sends P1 to P7 and PF to master before P8 (PLAN.md:3164), so the bug in which About scrolls under a meteor head at about 1:1 stays on master until P8.
  - I9 asks two things: whether never-lease kinds may overlap a lease holder, and whether the comet may keep its own scroll rules instead of `scrollKept` (PLAN.md:3209, CP-0 request 3 at :3244). The fallback covers only the overlap. The confirmed interface says "Don't add a second threshold-plus-fade rule: every transient kind uses this helper" (COORDINATION.md:89), yet R-2 says "every open request has a fallback (8.3)" (PLAN.md:3473).
- **Fix.**
  - Under PF, inline `contrastMore ? CONTRAST_MORE : CONTRAST_NORMAL` where P8 calls `contrastLevels()` (or have PF add the helper).
  - Say that the PF planner ignores `ink`, since today's veil scales `METEOR_VEIL.inkKeep` by `meteorInk` only when drawing.
  - Either wire `scrollKept` into today's `updateMeteor` and `draw` in PF (two lines, as the veil commit does), or reword item 2 to say the bug stays until P8.
  - Give I9's comet half a fallback: if the veil session needs `scrollKept`, the comet takes `launchScrollY` at its fade-in and retires by `scrollKept` like any transient.

### C41. Stale "optional" wording, and P10's status

- **Section.** 6.5's `drawLayer` sketch (PLAN.md:1464); AC-32 (:3380); 7.0 (:2658); P9's visible change (:3076); E7 (:154).
- **Evidence.**
  - P4 makes the twinkle clock a step ("4. The twinkle clock", PLAN.md:2911), and 6.6 says "Recommended within P4 (do it)" (PLAN.md:1564). But 6.5 still says "if P4's optional step lands" (PLAN.md:1464), and AC-32 says "with P4's optional step" (PLAN.md:3380).
  - 7.0 lists P10 as "optional or conditional" (PLAN.md:2658), but no decision governs it (D1 to D11 have none) and no condition is stated. P9 alone makes fireballs "about 3.5 times as often (about one every 3 minutes) until P10" (PLAN.md:3076), while E7 requires "fireballs about 1 per 5 to 10 minutes" (PLAN.md:154), which only P10 delivers (AC-37 "from P10").
- **Fix.** Drop "optional" in 6.5 and AC-32. Either make P10 required once P9 ships, or add it to D4 (or a new decision) with a default, and state what E7 becomes without it.

### C42. The file map disagrees with the phases, and P8 has a file in no step

- **Section.** 5.1 (PLAN.md:339-363); P8's steps (PLAN.md:3038-3041).
- **Evidence.**
  - `renderSky.ts` is "ours except `drawMeteor`/`drawTrain` | P1, P2, P4, P6, P8, P11" (PLAN.md:355). But P9 edits `drawMeteor`'s tint line (PLAN.md:3062, :2476), and P12 adds drawing cases and a `drawMeteor` keeps argument (PLAN.md:3136, :2591).
  - `transients.ts` is "P8" only (PLAN.md:349), yet P10 adds `PlanContext.sinceReveal` and the fireball decision (PLAN.md:3089), P11 the satellite kind (:3117) and P12 its kinds (:3136).
  - The `config.ts` row omits `ADAPT.thinFade` (P6's files, PLAN.md:2963) and P12's blocks. The `catalog.ts` and `radiants.ts` rows omit P12's planet and point flash (PLAN.md:3136).
  - P8's files rename `SceneLevels.meteors` to `launches` and `heroMeteorMaxScroll` to `heroLaunchMaxScroll` (PLAN.md:3028) and update README (:3036), but none of steps 1 to 4 does either. The worker reads `sceneAt(...).meteors` today (`sky.worker.ts:145`), so under 7.0's "one commit per numbered step, each green" the rename must go in step 3's commit.
- **Fix.** Make 5.1's Phase and "What changes" columns match the phases' file lists. Put the `scene.ts` rename and the README line in P8 step 3.

### C43. H13 has no recipe for running the real worker under a fake clock

- **Section.** 7.1's kit (PLAN.md:2706-2709) and H13 (:2731), which gates P5 (step 4), P6 (step 3) and P7.
- **Evidence.**
  - The kit stubs only the canvas globals: "`ImageData` ... `OffscreenCanvas`, whose `getContext` returns a recorder" (PLAN.md:2706-2708).
  - H13 is "A simulation of the worker's tick and schedule against a fake clock" (PLAN.md:2731). The worker keeps its state at module scope and registers its message listener at import (`sky.worker.ts:26-29`, `:397`). It also reads `performance.now()` (`:173`, `:399`), `setTimeout` (`:162-167`) and `scope.requestAnimationFrame` (`:158`).
  - Without a recipe, an implementer may re-implement `tick` and `schedule` inside the harness, which proves nothing about the shipped code.
- **Fix.** Add three lines to 7.1:
  - stub `self` (with `postMessage`, `addEventListener` and the animation-frame members), `performance.now`, `setTimeout` and `clearTimeout` from one fake clock;
  - import a fresh worker per case with a distinct query string (`./sky.worker.ts?case=3`);
  - drive it by dispatching messages to the captured listener and advancing the clock.

### C44. Bloat grew again

- **Section.** The whole plan; the check log's "Round 3" part (PLAN.md:3600-3628).
- **Evidence** [computed, `wc -w`].
  - `PLAN.md` is 57,798 words: 5.4% more than the committed version at 2e622a5 (54,853), and 24% more than R1 to R4 together (46,672). Section 6 alone has 24,716.
  - Round 3's log is 25 bullets and 721 words with doubled labels ("r3-physics-math-PHY3-1 (physics-math, major)"). That is the pattern C35 removed from round 2's log by turning it into a table.
- **Fix.** Turn round 3's log into a lens-by-finding table like rounds 1 and 2, linking `drafts/check-r3-*.md`. Leave the rest to the DRY audit.

## Round 3 fixes: confirmed

All of round 3's dispositions are in the text where the log says, except those the reconciliation explicitly supersedes (CA3-2's fallback, CA3-3, CG3-1's P9 layout call, CG3-5's open pass shape, C33's synthetic bar, C34's I1 step).

- **Mine.**
  - C28: `forgetVisitSky` on resize from P8, in 6.9's worker bullets (PLAN.md:2191), P8's files (:3033) and H7's resize and layout cases (:2725).
  - C29: P3 declares `softwareFps` at step 2 and lands the mechanism in one commit (:2878-2879); P4 adds the message before the worker case (:2909); P6 and P7 pass a zero drift and lean (:2970, :3005).
  - C30: `PlanContext.sinceReveal` (:1936, :3089).
  - C31: M1's one settle in M1, AC-9, AC-27 and H13 case 3.
  - C32:
    - 9.2's Phase column and the phase checklists now agree; I rechecked all 41 rows.
    - H5's rest-rule case is in P2.
    - H10 is in P11.
    - The ADAPT fade is P6 step 4, with its worker entries.
    - 7.1 reads `speed` 1.2 s after input.
  - C34: `failedPlans[kind] = 0` on launch (:2086); PF's wake tint comes with I2 (:3163); CP-4 runs weekly (:3192).
  - C35: round 2's log is a table. Its pattern returned in round 3's log (C44).
- **Other lenses.** I spot-checked PHY3-1 (`stepCamera`'s velocity line, C4, SP1 and the `CAMERA` doc), PHY3-2 (AC-10), PHY3-4 (H5's H = 3,840), CG3-6 and CA3-4 (the comet's per-frame box test and its placement), CA3-1 (I9's two-way fallback in the launch step), CA3-5 (CP-4's three answers, CP-1's last-write times, P0's CP-5) and CA3-6 (7.0's gate, P8 depending on P5). All are present.

## Veil reconciliation: checked

Each of the 14 log lines landed in the sections it names:

- the status;
- the text class as `headroom`, and the 0.9 peak rule gone;
- the scroll cancel through `scrollKept` and `transientFade`, with `TRANSIENTS.scrollCancel` gone;
- `transientQuietFactor` replacing `clearSkyFactor`, which survives only in the log;
- the planner's options and `nearCopy`, `ink` and `fallback`;
- `drawMeteor`'s `fade`;
- the ported `planLaunch`, with no layout call to `forgetVisitSky`;
- the far-star case closed by construction;
- the private helpers;
- the AGENTS.md precondition;
- the reveal-started cooldown and its table;
- the hotspot rows;
- the interface-request statuses.

The body matches the main checkout's in-progress code where I compared them:

- `planLaunch`'s long-then-short pass order over the sticky radiant and its fresh ones;
- `PlanOptions.nearCopy` defaulting to true, with `false` meaning clear sky only;
- `scrollKept`'s formula;
- `transientQuietFactor` as the minimum of the eased factor and the current zones' factor;
- the one-pass `quietFactor`;
- `screenQuietZones` keeping `headroom`;
- `contrastLevels()` returning `meteorInk`;
- the deferred layout applied in `settleQuiet`.

The one sentence of the confirmed section left unreconciled is C36's. The reconciliation's other regressions are C39 and C40.

## Checked with no finding

- **Structure.** All 13 sections the brief requires are present and substantive. 4.1 has the ownership diagram, 4.2 every entity the brief lists, and 6.1 to 6.13 every design area.
- **Settled defaults.** Each is followed or covered by deviations 1 to 14: the drift's start (1), `FrameClock` (4), WebKit (5), the pattern (6), only a pause stored (7), the scroll cancel (8), the wrap (10), the 40 s cooldown (11), the reduced-motion snap (13) and the on-screen radiant (14).
- **Decisions.** D1 to D11 each have a recommended default and alternatives, covering the seven the brief requires.
- **Config.** Every new constant has a value, units and a doc comment: `STAR_PHASES`, `DEPTH`, `CAMERA`, `DRIFT` and `Epicycle`, `PACING`, `FRAME.motionEase`, `SCENE.*.drift` and `lean`, `LEAN`, `TRANSIENTS` and `longVisit`, `GapLaw`, `SKY_WINDOW`, `RADIANTS`, `WakeColor`, `SpeedClass` and `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR_KINDS`, `SATELLITE`, `ADAPT.thinFade`, the main-thread constants and the private `ZONE_REACH`, `TILE` and `CELL_CACHE_SLACK`. The could kinds give their values in 6.12's table only, which the brief allows ("kept brief").
- **Phases.** Every phase has a goal, files, steps, a visible-change or no-visible-change statement, verification, a checklist, a rollback and a blocked mark (P9 to P11 through their titles and 7.2's table).
- **P1 implementability.** The painter, `profile`, the phase-0 peak, the block index, `placePoint`, the snap rule, the quiet index's body, the stamp cache and its guard, the step order, and H1 to H3 are all specified.
  - [computed, `h1-bytes.mjs`] The separable painter reproduces today's alpha bytes exactly (0 mismatches) for every shape and both meteor sprites at all seven of H1's DPRs, and at every ratio from 0.500 to 2.000 in steps of 0.001, so P1's "phase-(0, 0) atlas bytes equal P0's" can pass.
  - The index's exactness argument also holds for the veil's one-pass `quietFactor`, which skips any zone whose quiet is 0.
- **Code citations.** These hold at 246c0aa:
  - `sky.worker.ts:61-66`, `:82-84`, `:145`, `:369-371`, `:420`, `:437-458`, `:469`;
  - `renderSky.ts:39`, `:48`, `:71-72`, `:93`, `:100`, `:107`, `:120`, `:127`, `:155`, `:222`;
  - `config.ts:58-59`, `:78-80`, `:206`, `:237`, `:246-255`, `:250`, `:270-274`, `:283`, `:289`, `:305`;
  - `skyAssets.ts:26-27`, `:45-78`, `:81-120`;
  - `meteors.ts:39-40`, `:130-131`, `:135`, `:138`, `:140-145`, `:147-152`, `:156`, `:158-159`, `:165`;
  - `mountSky.ts:3`, `:17-27`, `:37-47`, `:79-80`, `:87-92`, `:146`, `:149`, `:243-268`;
  - `protocol.ts:26-32`, `scene.ts:11-18`, `:30`, `:76`, `:89`;
  - `Navbar.tsx:31`, `:48-53`, `:73`, `:79`, `:88`, `:117`, `:127`;
  - `README.md:75`, `:80`.
- **Conventions in sketches.** No em or en dashes. The sketches use tabs, single quotes and no semicolons outside type literals, `@/` imports in components and relative imports in `src/lib/sky`. `Navbar` renders only on `/` (`src/app/page.tsx:7`), so `SkyPauseToggle.tsx` may import the icon barrel.

## Summary

Round 3's fixes all landed, and the veil reconciliation is thorough: every log line is in the body, and the body matches the confirmed interface and the veil session's in-progress code. One major gap remains. COORDINATION.md's confirmed section says the implementing session "stays off the veil session's files until Joseph approves and commits", while P1 to P7 edit six of those files on the integration branch before V. The plan never states its reading or asks for confirmation (C36). The minor findings tighten verification (H7 and H10 in P9; B-9 and B-10), the transient typing pattern, the provisional crossing bar's label, the PF and I9 contingencies, stale wording, the file map, H13's harness recipe and bloat. P1 can be implemented as written: its atlas, index and cache are fully specified, and the atlas's byte identity recomputes exactly.
