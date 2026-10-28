# Check round 4: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 4. I confirmed round 3's fixes in this lens, checked the veil reconciliation against `COORDINATION.md`'s "Confirmed veil interface (2026-10-27)", and looked for regressions either introduced. No praise; every finding carries evidence.
- **Inputs.** `PLAN.md` (3,646 lines, all read); `HANDOFF.md`, `COORDINATION.md` (all, the confirmed section line by line), `research/00-shared-brief.md`, `research/01-planning-brief.md`; my round-3 report (`drafts/check-r3-coordination-a11y.md`) and the Check log's "Round 3" and "Veil reconciliation" parts; the worktree code at 246c0aa (`sky.worker.ts`, `mountSky.ts`, `meteors.ts`, `config.ts`, `Navbar.tsx`, the `data-sky-quiet` roots); the main checkout's uncommitted veil diff, read only, to see how the confirmed interface is taking shape (COORDINATION.md stays the contract); Tailwind 4.2.2's `sr-only` rule in the main checkout's `node_modules`.
- **Output.** This file only. One throwaway script outside the repository: `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r4-a11y/pfveil.mjs` (the PF-path contrast arithmetic and the confirmed `inkBudget` values).
- **Limits.** Planning review only: `PLAN.md`, `src/` and configuration untouched in both checkouts. `PLAN.md:n` cites the current file, `file:line` the worktree at 246c0aa, `COORDINATION.md:n` the contract, and [computed] the script above.

## Method

1. Read the four scope documents, then `PLAN.md` front to back, noting every veil name, signature, rule, ownership claim and accessibility claim.
2. Compared each against the confirmed section (exports, `veiledFrom` rules, "Changed shape", "Now private", "What it means for PLAN.md") and against the main checkout's uncommitted diff (`git diff`, read only).
3. Grepped `PLAN.md` for leftovers of removed names (`clearSkyFactor`, `mayCrossCopy`, `scrollCancel`, `METEOR_VEIL.inkKeep`, `inkFrom`, the 0.9 peak rule) and for every place that reads the veil's budget machinery.
4. Re-checked each round-3 fix in this lens at its cited location.
5. Recomputed the PF path's contrast bound and the confirmed budgets [computed].

## Verdict: revise

2 major, 3 minor. No blocking finding.

## Round-3 fixes: did they land?

| Round 3 | Status | Where |
|---|---|---|
| CA3-1 two-way I9 fallback | Landed: both directions, every never-lease kind, PF included; H7 checks it | 6.9 steps 2.2 and 2.3 (`PLAN.md:2079-2080`), T2 (`:303`), I9 (`:3209`), PF item 4 (`:3310`), H7 (`:2725`), open question 2 (`:3499`) |
| CA3-2 far-star case | Superseded by the confirmed interface and landed as such: closed by construction (`LAYERS.far.inkKeep` 0, `STAR_INK_PEAK`); PF sets the same value | I5 (`:3205`), AC-30 (`:3378`), 11 (`:3456`), PF step 2 (`:3164`), re-verify item 8 (`:3299`) |
| CA3-3 layout re-pick | Superseded: a layout never clears the radiant or the visit's sky, matching the confirmed `planLaunch` | R1 (`:309`), `forgetVisitSky` doc (`:2041`), 8.6 layout row (`:3273`) |
| CA3-4 comet guards | Landed (far-band nearness, box grown by drift and lean, re-tested every drawn frame, below `METEOR.top`, About's row by breakpoint, CP-0 states its scroll rule). The confirmed interface's new "no second threshold-plus-fade rule" reopens the scroll part (CA4-4) | 6.12 (`:2586`), AC-25 (`:3373`), CP-0 item 3 (`:3244`) |
| CA3-5 checkpoints | Landed: D10's three answers in CP-4 and before P8, the early merge's real cost, CP-1's last-write times, P0 on CP-5, section 1 and 7.2 reworded | D10 (`:177`), 7.0 (`:2651`), CP-1 and CP-4 (`:3189`, `:3192`), P0 step 1 (`:2776`), `:19`, `:2745` |
| CA3-6 the 2.2.2 gate | Landed: the gate names P4, P6 and P9 to P12; P8 depends on P5 | 7.0 Gates (`:2667`), 7.2 (`:2763`) |

## The veil reconciliation, through this lens

| Confirmed item (COORDINATION.md) | PLAN.md | Status |
|---|---|---|
| `SkyRect.headroom`, `INK_BUDGET`, `inkBudget(headroom)`, `budgetKeeps(white, quietKeep, ink = 1)` (`:77-88`) | 4.2, 6.4, I5, AC-30, 11 | Match. `inkBudget` gives body 0.0495, tagline and rails 0.1485, green and name 0.2 [computed], as section 11 states |
| `scrollKept(launchScrollY, scrollY, fade = 1)`, `SCROLL_CANCEL` 12 to 24, retire at 0, pause as `fade`, no second rule (`:84`, `:89`) | `transientFade` (`:2056-2058`), T4, deviation 8, AC-40 | Match for every transient; the static comet keeps a second rule (CA4-4) |
| `transientQuietFactor` for every near-copy transient (`:90`) | meteors (their `drawMeteor`), satellites (`:2575`), could kinds (`:2591`), comet (`:2586`) | Match |
| `planMeteor(..., options: PlanOptions = {})`, private `planFlight` with `PassOptions`, `fallback` replaces `timing`, no positional boolean (`:95-99`) | 6.10 (`:2399-2447`), I1, I2 | Match |
| `drawMeteor(..., fade = 1)`, no `SkyFrame.meteorScroll` (`:102`) | 6.9 Drawing (`:2181`), I7 | Match |
| Worker `launchScrollY`, sticky `planLaunch`, resize clears, layout keeps, `contrastLevels`, `applyLayout`, `settleQuiet` (`:105-108`) | 6.9 (`:2183-2194`), R1, 8.6 | Match |
| `veiledFrom` rules (`:113-118`) | 6.10 (`:2470`) | Match; the plan never edits them |
| Now private: `fitKeep`, `luminance`, `contrastRatio`; `segmentTouches` unexported (`:127`) | 8.3 (`:3197`), I6 | Match on the normal path; PF exports `segmentTouches` (CA4-2) |
| AGENTS.md precondition (`:134`) | D1 (`:168`), 5.1 (`:362`), 6.8 (`:1857`), 8.6 (`:3287`) | Match; D1's quiet-root alternatives miscount their rects (CA4-5) |
| "stays off the veil session's files until Joseph approves and commits" (`:72`) | not addressed | CA4-1 |
| "I2/H10: the ink budget no longer assumes a peak of 0.9 or less" (`:131`) | rule removed everywhere | Correct for the veil path; regresses the PF path (CA4-2) |

The main checkout's uncommitted diff (read only) carries every one of these names with these signatures, including `PlanOptions.nearCopy` defaulting to true and `veiledFrom(zones, path, peak, ink)`, so the plan's sketches will meet real code at V.

## Findings

### CA4-1 (major): the confirmed section's file rule is never reconciled, so P1 to P7 edit the veil session's files before V on an unstated reading, and CP-0 needs no reply

- **Section.** 1 (veil-session dependency); 4.4; 5.1; 7.0; 8.2 (CP-0); 8.4.
- **Problem.**
  1. The contract's confirmed section says: "The implementing session for `PLAN.md` builds on exactly these. It stays off the veil session's files until Joseph approves and commits that change, then rebases onto it." The veil session's files are named at `COORDINATION.md:43` (`src/lib/sky/{meteors,config,scene,protocol}.ts`, `src/components/sky/{sky.worker,renderSky,mountSky}.ts`, possibly `color.ts`), and its change also edits `AGENTS.md`, `Introduction.tsx` and `SidePane.tsx` (`:134-135`).
  2. `PLAN.md` never quotes or interprets that rule. It reads ownership function by function (request 2) and proceeds: P0 to P7 "avoid every veil-owned function and can proceed now". By 5.1, P1 to P7 edit `config.ts`, `scene.ts`, `protocol.ts`, `sky.worker.ts`, `renderSky.ts`, `mountSky.ts` and `AGENTS.md` before V: seven of the files the veil change touches.
  3. 4.4 contradicts itself: everything on the "Changed shape" list "becomes shared only after the rebase", then "Changed by both before V: `frameAt` ... and `sameRects`", both on that list.
  4. CP-0 informs rather than asks: "A reply is not required to proceed with P1 to P7."
  
  Read literally, the rule blocks P1 to P7 (only new files and files outside the veil's list could land before V). An implementer who reads `COORDINATION.md` either has no basis to start P1 or starts it against the contract. The plan may well have the intended reading, but it has to say so and get it confirmed.
- **Evidence.**
  - `COORDINATION.md:72` (the rule), `:43` (the files), `:125` ("Worker: `updateMeteor`, `applyLayout`, `settleQuiet`, the `layout` case, `sameRects` (plus `headroom`), `frameAt`"), `:134-135`.
  - `PLAN.md:19` ("So phases P0 to P7 and P13 avoid every veil-owned function and can proceed now"), `:322` ("Everything else its commit changes ... becomes shared only after the rebase"), `:330` ("Changed by both before V"), `:341-363` (5.1's phases per file), `:3188` (CP-0: "A reply is not required to proceed with P1 to P7"), `:3213-3217`.
  - `grep -n -i -E "stays off|off the veil|files until" PLAN.md` returns nothing.
- **Fix.**
  - In 4.4, with pointers from section 1 and 7.0, quote `COORDINATION.md:72` and state the reading the plan relies on: no edit in the main checkout; no edit before V to request 2's functions or to anything on "Changed shape" except the overlaps CP-0 lists; other parts of those files edited only on the integration branch, which reaches master only after the rebase (or by agreement, or PF). Reword 4.4's carve-out as a request pending that agreement.
  - CP-0 asks for an explicit yes to that reading and to each overlap, and the answer is logged. If they object, the plan's fallback: before V, land only new files and files outside their list (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `skyAssets.ts`, `catalog.ts`, `skyPause.ts`, `SkyPauseToggle.tsx`, the icons, `Navbar.tsx`), and wire them into the shared files right after V, so P5 and P6 ship after V.
  - Cut the one avoidable overlap: P1's `sameRects` move. `QuietIndex.update` can rebuild on the change signals 4.4 already lets us read (`scrollY`, `layoutAt`, and the ease reaching 1), passed in by the worker, so `sameRects` stays in the worker untouched; or keep the move only with their yes.

### CA4-2 (major): PF no longer matches what P8 to P11 read after the reconciliation

- **Section.** P8 to P10 and PF in 7.3; 8.7 items 1 and 4; 8.3 I1 and I5; 6.9 (`PlanContext.ink`, `LaunchGate.ink`, the `TRANSIENTS` doc, the worker's `launchGate`); 6.10 (I2, `Flight.peak`, `PlanOptions.ink`, `METEOR_BRIGHTNESS`); AC-30; 11 (1.4.3 row); H10.
- **Problem.** PF's Files row says: "Every name, signature and value is the confirmed interface's, so P8 to P12 read the same either way." PF keeps today's veil math "exactly as it is" and adds only `LAYERS.far.inkKeep` 0, `SCROLL_CANCEL`, `scrollKept`, `transientQuietFactor`, I1, I3, I6 and I7. After the reconciliation, P8 to P10 read budget machinery that only the veil commit adds:
  1. **P8 doesn't compile under PF as written.** Its launch gate takes `ink` from `contrastLevels()`, a worker helper the veil commit adds. PF never adds it.
  2. **P9's I2 can't be done under PF as written.** It sends "the aim's `flight.peak` ... to `veiledFrom(zones, path, peak, ink)`" in place of "the veil commit's peak line". Under PF, `veiledFrom` is today's two-parameter function, and the peak is set in the returned meteor.
  3. **`ink` means nothing under PF.** PF adds `PlanOptions.ink` by name (I1). In the veil commit, `ink` scales each rect's budget inside `veiledFrom` and gates `METEOR_PASS`'s aimed passes; PF has neither. The docs of `PlanContext.ink`, `PlanOptions.ink`, `TRANSIENTS` ("each rect's INK_BUDGET counts one transient plus the haze"), `METEOR_BRIGHTNESS` and `Flight.peak` all name `INK_BUDGET`, which PF never defines.
  4. **The contrast proof covers only the veil path.** AC-30 ("a transient adds at most its rect's `inkBudget(headroom)`") and section 11 ("the veil fits any brightness to `inkBudget(headroom)`") describe the veil commit's model only.
     - Under PF's flat veil the bound depends on the peak. A veiled head adds 0.0593 × peak of white on the copy (0.053 at today's 0.9), so slate body text keeps its 0.064 under the haze up to a peak of 1.08 [computed].
     - P9's defaults pass: ordinary flights peak at most 0.85, and fireballs stay in clear sky.
     - But the reconciliation removed the only peak check (H10's), and the `METEOR_BRIGHTNESS` doc now invites raising `normal` because "the veil fits any peak to each copy's INK_BUDGET", which is false under PF.
  5. **PF exports `segmentTouches`**, which the confirmed interface keeps unexported, so "every name ... is the confirmed interface's" doesn't hold on the PF path either.
- **Evidence.**
  - PF: `PLAN.md:3163` (Files), `:3164` (step 3), `:3307` (item 1: "`METEOR_VEIL` stays as it is"), `:3310` (item 4).
  - P8 to P10: `:2005`, `:2188` and `:3033` (`contrastLevels()`); `:2456` and `:2464` (I2's `veiledFrom` call, "No peak bound"); `:1933`, `:2096`, `:2289`, `:2416` and `:2433` (`INK_BUDGET` in docs).
  - Proofs: `:3378` (AC-30), `:3456` (section 11).
  - Contract: `COORDINATION.md:107` (`contrastLevels` is the veil's), `:127` (`segmentTouches` not exported), `:131` (the 0.9 assumption dropped for the veil path).
  - Code at 246c0aa: `meteors.ts:104` (`function veiledFrom(zones: readonly SkyRect[], path: MeteorPath): number | null`), `:170` (the peak in the returned meteor), `config.ts:310-319` (the flat veil; its arithmetic at `:317`, "0.9 × 0.585 × (2 × 0.05 + 0.52 × 0.05²) ≈ 0.053"), `:291` (`peak: [0.75, 0.9]`).
  - [computed, `pfveil.mjs`] The light curve at `inkFrom` 0.75 is 0.5851. The white per unit of peak is 0.05927: 0.0504 at 0.85, 0.0533 at 0.9 and 0.0593 at 1. It reaches 0.064 at a peak of 1.080.
- **Fix.**
  - Replace PF's "read the same either way" with what PF lacks, and give the PF reading of each affected line:
    - `contrastLevels()`: PF adds it, or the gate reads `contrastMore ? CONTRAST_MORE : CONTRAST_NORMAL`;
    - I2 under PF: it sets the aim's peak in the returned meteor and calls today's `veiledFrom(zones, path)`;
    - `ink` under PF: PF either omits it from `PlanOptions` or documents that it scales nothing in the planner (today's `meteorInk` already scales `METEOR_VEIL.inkKeep` in `drawMeteor`).
  - In PF item 1, state the bound: veiled flights peak at most 1 (0.059 of white against 0.064). Restore H10's peak check on the PF path, and qualify the `METEOR_BRIGHTNESS` and `Flight.peak` docs, AC-30 and section 11 with "under PF, today's flat veil: 0.0593 × peak on the copy".
  - Name the `segmentTouches` export as PF's one addition beyond the confirmed names.

### CA4-3 (minor): CP-0 understates the pre-V overlaps, and it promises not to edit lines that P2 rewrites

- **Section.** 8.4 (CP-0 message); 8.2 CP-5; 4.4; P2.
- **Problem.** CP-0 says "What we won't edit until your commit lands: ... `LAYERS.*.inkKeep` ..." and names only "Two functions both of us change before your commit lands: `frameAt` ... and `sameRects`".
  - P2 removes `parallax` from each `LAYERS` entry. These are the lines that hold `inkKeep`, and the veil commit sets `far.inkKeep` to 0 on one of them. P2 also rewrites the `LAYERS` doc, which the veil commit rewrites to carry its contrast arithmetic.
  - 8.6 lists the `LAYERS` row, but CP-0, CP-5 and 4.4's "Changed by both before V" don't.
  - Resolving that line as "ours" would restore `inkKeep: 0.1` and reopen the far-star case (0.053 plus 0.06 against 0.064). Re-verify item 8 would catch it at V, but the veil session is told nothing about the overlap.
  - CP-0 also leaves out the textual overlaps 8.6 knows: AGENTS.md (P5's line directly after their rewritten line), `SceneLevels` (P6 and P7, next to their `meteors` doc), `SkyFrame` (P1, P2, P4 and P6, next to their `quiet` and `meteorInk` docs), and the import lines of `sky.worker.ts` and `mountSky.ts`.
- **Evidence.**
  - CP-0 and 4.4: `PLAN.md:3215` and `:3217`; `:330`; CP-5 at `:3193`.
  - P2's edits: `:485` and `:2830`; 8.6 at `:3282` and `:3287`.
  - Contract: `COORDINATION.md:81` ("`LAYERS.far.inkKeep` goes from 0.1 to 0").
  - `config.ts:72-80`: the doc and the three entries, `parallax` and `inkKeep` on the same lines.
  - The main checkout's uncommitted `config.ts` diff (read only) rewrites the same doc and `far` line.
- **Fix.**
  - Either defer P2's `LAYERS` edits to V: P2 only stops reading `parallax`, and 8.5 step 5 removes `LayerConfig.parallax` and rewrites the doc. That removes the overlap.
  - Or name `LAYERS` (the entries and the doc) as a third overlap in CP-0, CP-5 and 4.4.
  - Either way, add one CP-0 line listing the adjacent edits we will resolve at our rebase.

### CA4-4 (minor): the static comet keeps a second scroll rule with no fallback, and its behavior while paused or under reduced motion is unstated

- **Section.** 6.12 (the comet row); AC-25; AC-26; 8.3 I9; 8.4 item 3; 6.9 step 2.3 and `LaunchGate`; P12.
- **Problem.**
  1. **The second rule.** The confirmed interface says of `scrollKept`: "Don't add a second threshold-plus-fade rule: every transient kind uses this helper". Request 1 names the comet among the kinds that obey the scroll cancel.
     - The comet instead fades with `1 − smoothstep(0, SCENE.heroLaunchMaxScroll, scrolled)` and with its own box test: a second scroll-driven fade rule.
     - The plan asks for an exception (I9; CP-0 item 3, "tell us if you need `scrollKept` instead"). It says what happens neither on a yes to `scrollKept` nor with no answer, so with no answer the comet ships its own rule anyway.
  2. **Reduced motion and pause.** The comet fades in "over at least 8 s", and nothing says whether it shows, or keeps fading in, under `motion: 'reduced'`. AC-26 requires reduced-motion hero screenshots 30 s apart to match each other and P0's. A comet fading in would fail it, and so would P12's planet, a new catalog star.
  3. **No input for the fallback.** The I9 fallback's "no comet shows" has nothing to read: `LaunchGate` has no comet flag, and the comet isn't in `schedule.active`.
- **Evidence.**
  - The contract: `COORDINATION.md:89` ("Don't add a second threshold-plus-fade rule"), `:34` (request 1 names the comet).
  - The comet: `PLAN.md:2586` (its scroll rule and fade-in), `:3373` (AC-25), `:3209` (I9), `:3244` (CP-0 item 3).
  - Reduced motion: `:3374` (AC-26), `:2587` (the planet).
  - The fallback: `:2080` ("no comet shows"), `:1996-2007` (`LaunchGate`).
- **Fix.**
  - Until the veil session agrees, give the comet a launch scroll: the scroll at which it starts to show. Draw it with `scrollKept(launchScrollY, scrollY, fade)`, passing its launch-gate and box fades in as `fade`, and retire it at 0 for the page view. Switch to the plan's own rule only on their yes.
  - State that the comet doesn't show under `motion: 'reduced'`. Re-baseline AC-26's P0 screenshot when the planet ships.
  - Add `cometShowing` to `LaunchGate` in P12.

### CA4-5 (minor): in D1's quiet-root alternatives, the control adds two quiet rects, one of them invisible

- **Section.** 3 D1 (alternatives a and b); 6.8 (the control).
- **Problem.** D1 counts the control inside a `data-sky-quiet` root "as one more quiet rect of the 64". The measurement adds each `button`'s box and also every non-empty text node's line rects.
  - The control's name is sr-only text.
  - Tailwind 4.2.2's `sr-only` is `position: absolute; width: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`. Clipping hides the text but doesn't change its layout box, which is what `Range.getClientRects()` returns (CSSOM View).
  - So the label "Pause sky animation" becomes a second rect, one line wide, over empty sky beside the button. Stars dim and shooting stars veil there for nothing, and it uses one more of the 64.
  - It is the codebase's first sr-only text, so nothing hits this today. The navbar default is unaffected, because the header isn't quiet.
- **Evidence.**
  - D1: `PLAN.md:168` ("count it as one more quiet rect of the 64").
  - The control: `:1784` (`<span className="sr-only">`).
  - The measurement: `mountSky.ts:37` (`QUIET_CONTROLS = 'a, button'`), `:105-115` (`NodeFilter.SHOW_TEXT`, `range.getClientRects()`), `:117`.
  - `node_modules/tailwindcss/dist/lib.js` (4.2.2): `sr-only` = `position: absolute`, `width: 1px`, `overflow: hidden`, `clip-path: inset(50%)`, `white-space: nowrap`.
  - `grep -rn sr-only src/components` finds nothing.
- **Fix.** In alternatives (a) and (b), name the button with `aria-label` (the same changing name) instead of sr-only text, so its only quiet rect is the 40 × 40 box. Or count two rects in D1.

## Verified with no finding

- **Veil-owned functions before V.** No phase before V edits `veiledFrom`, `METEOR_VEIL`, `METEOR_PASS`, `INK_BUDGET`, `SCROLL_CANCEL`, `quietBlend`, `settleQuiet`, `applyLayout`, `drawMeteor` or `drawTrain`. None edits the bodies of the `scroll` and `layout` handlers (`sky.worker.ts:463-484`) either. P3 keeps `!rafId` meaningful for `:469`; P4 keeps `noteInput` and `meteorsAllowed` by name; `tick` keeps calling `settleQuiet`, which now applies a deferred layout, before it decides the frame (`PLAN.md:1177`, `:3269`). The exceptions are CA4-1's and CA4-3's overlaps.
- **Blocked phases.** P8 to P12 wait for V (the planet excepted) or for PF, which only the user can start; P13 touches no veil function.
- **One ink lease.** T2 is enforced at the launch step: a plan reporting `nearCopy` under a `nearCopy: false` context fails. The lease is the `nearCopy` flag of an active transient, so it can't leak. Each budget counts one transient plus the haze; with every layer's `inkKeep` 0 after V, no star adds light on the copy.
- **The scroll cancel.** Every transient goes through `scrollKept` with the pause fade as `fade` and retires at 0, at the earlier of that and its lifetime (`PLAN.md:2068`). P8 moves their `updateMeteor` and `draw` calls into `transientFade` without touching the `scroll` handler; the main checkout's diff evaluates it in exactly those two places.
- **5 s per transient.**
  - A fireball with its train lasts 2.5 + 2.4 = 4.9 s (`meteors.ts:220-222`; `fireballDuration` at `config.ts:299`, `TRAIN.life` at `:357`).
  - A satellite lasts 4.8 s, an earthgrazer about 4, a point flash 0.5, and a burst's span is capped at 5.
  - The scheduler rejects longer plans; a cancel never extends a life; H10 asserts every kind from the config.
- **Accessibility.**
  - **2.2.2.** P5 lands before P4, P6 and P9 to P12. The control stops every moving part of the sky, starts paused under reduced motion, keeps Play for the page view only, persists a pause and follows other tabs.
  - **2.3.1.** Onsets are at least 3 s apart and bursts staggered at least 0.35 s; every change is under 2,000 CSS px²; the warmest tint has R / (R + G + B) = 0.42.
  - **2.3.3.** Parallax, the glide and the lean hold under reduced motion and when paused.
  - **2.4.11 and 2.4.7.** The header shows itself on focus and stays while it holds `:focus-visible`; the control is `inert` under the open phone menu.
  - **2.5.8 and 1.4.11.** The target is 40 × 40; green on navy is 14.13:1 (recomputed).
  - **Forced colors and more contrast.** Forced colors hide the sky; the worker never posts `ready` under `motion: 'off'`, and the control is `forced-colors:hidden`. More contrast sends `ink` 0 to every plan.
  - **`data-sky-quiet`.** The default path edits none of `Introduction.tsx:14`, `ContactMe.tsx:11`, `AppFooter.tsx:13` or `SidePane.tsx:23`, and none of their ancestors' transforms or opacity.
- **Leftovers.** No `clearSkyFactor`, `mayCrossCopy`, `TRANSIENTS.scrollCancel`, `METEOR_VEIL.inkKeep`, `inkFrom` or 0.9 peak rule remains outside the Check log.
- **A note for 8.5 step 5.** `veiledFrom(zones, path, peak, ink)`, which I2 relies on, comes from the main checkout, not from the contract, which gives only its return type. Add its parameters to the names step 5 checks at V.

## Summary

Round 3's six fixes in this lens all landed, and the reconciliation matches the confirmed names, signatures, rules and private helpers on the normal path. Two gaps keep the verdict at revise:

- **CA4-1 (major).** The confirmed section's "stays off the veil session's files" rule is never addressed, while P1 to P7 edit seven of those files before V. CP-0 doesn't even need a reply. The plan should state its reading, get it confirmed, and have a fallback order ready.
- **CA4-2 (major).** Dropping the 0.9 peak rule and adopting the budget helpers left the PF path inconsistent. P8 and P9 call `contrastLevels()` and a four-parameter `veiledFrom` that PF never adds. Docs, AC-30 and section 11 cite `INK_BUDGET`, which PF never defines. The flat veil's peak bound (1.08 for body text under the haze) is no longer stated or checked.

The three minors:

- **CA4-3.** CP-0 discloses two overlaps, not the `LAYERS` lines it promises not to edit.
- **CA4-4.** The comet keeps a second scroll rule with no fallback, and nothing says how it behaves under reduced motion.
- **CA4-5.** D1's quiet-root alternatives miscount the control's quiet rects.
