# DRY audit of PLAN.md

## Scope

- **Role.** Auditor, scope "dry": one of the four audits the task calls for (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns), one subagent per scope.
- **What it looks for.**
  - The same rule, formula, constant or helper defined in more than one place, with the single owner each should have.
  - Per-kind code paths that should be one spec-driven path.
  - Config duplicated between the worker and the main thread.
  - Anything that re-implements what the veil now exports: `scrollKept`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`, `QUIET_REACH`, `SkyRect.headroom`, `INK_BUDGET`, `headGain`.
  - Duplication in the document itself (content repeated across sections, research copied instead of linked).
  - Over-engineering against the user's "defensive but not over-engineered".
- **Inputs.**
  - `PLAN.md`, the worktree's working copy as read on 2026-10-27: 3,646 lines, sha256 prefix `ab3c192d506b4bc5`. Every `PLAN.md:n` below refers to that snapshot.
  - `COORDINATION.md` (the contract, especially "Confirmed veil interface (2026-10-27)"), `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`.
  - `drafts/check-r2-completeness.md` (C27) and `drafts/check-r3-completeness.md` (C35), which left the document's duplication to this audit, and `drafts/judge-scores.md`.
  - The worktree code at 246c0aa (`file:line` below), and, read only, the main checkout's uncommitted veil edits, to see how the confirmed exports take shape.
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only: no edit to `PLAN.md`, `src/`, configuration or anything outside this file, in either checkout. Findings stay inside the DRY scope. The contract is `COORDINATION.md`, not the main checkout's work in progress.

## Method

1. Read the four required inputs, then `PLAN.md` in full.
2. Read the worktree's sky code (`config.ts`, `scene.ts`, `meteors.ts`, `sky.worker.ts`, `renderSky.ts`, the head of `mountSky.ts`) and searched for every name, constant and test the plan repeats.
3. Diffed the main checkout's veil edits (read only) for `scene.ts`, `meteors.ts`, `config.ts`, `protocol.ts`, `sky.worker.ts` and `renderSky.ts`, to check what the confirmed exports cover and which helpers stay private.
4. Counted repeated facts and words in `PLAN.md`, and recomputed two derived numbers with a scratch script (`C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-audit/band-means.mjs`): the bands' mean nearness under the plan's law, and the drift's vertical extents for the plan's epicycles.
5. Read the earlier rounds' DRY remarks, so settled items aren't raised again.

## Verdict

**Revise.** 1 major, 13 minor, none blocking. DRY-1 alone holds the gate.

## Findings

### DRY-1 (major): the comet gets a second scroll-fade rule, which the confirmed interface forbids

- **Section.** 6.12 (the static comet row); 8.3 I9; 8.4 request 3; AC-25; 12.2 question 2.
- **Problem.**
  - The comet fades with a scroll rule of its own, `1 − smoothstep(0, SCENE.heroLaunchMaxScroll, scrolled)`, "in place of `scrollKept`". That is a second threshold-plus-fade rule, for a body the plan itself says can meet copy without a scroll.
  - The confirmed interface says "Don't add a second threshold-plus-fade rule: every transient kind uses this helper", and request 1 names the comet among the kinds that "obey the scroll cancel". Calling the comet "not a transient" doesn't remove it from request 1.
  - The plan asks for an exception (I9), but I9's "If declined" column covers only the overlap in time. A "no", or no answer, leaves the comet with no compliant design, and the CP-0 message treats silence as consent ("tell us if you need `scrollKept` instead").
  - The rule also recomputes `scrolled` outside `sceneAt`, which 6.7 makes the one owner of scroll levels ("one mixer for every scalar level (DRY)").
- **Evidence.**
  - `PLAN.md:2586`: "it fades with the launch gate, `1 − smoothstep(0, SCENE.heroLaunchMaxScroll, scrolled)` ... It never holds the lease and has no launch scroll, so these rules stand in for `scrollKept`, which needs one (I9 asks the veil session to agree ...)".
  - `PLAN.md:3209` (I9: its "If declined" text is the two-way overlap rule only); `:3244` (CP-0 request 3); `:3499`.
  - `COORDINATION.md:89` ("**Don't add a second threshold-plus-fade rule:** every transient kind uses this helper"); `:34` (request 1: "meteor, burst, earthgrazer, satellite, comet ... obeys the scroll cancel").
  - `PLAN.md:1609` (6.7's one-mixer rule). `drafts/check-r3-coordination-a11y.md` (CA3-4, point 4) raised the substitution; round 3 added the question to I9 and CP-0 but no answer for a refusal, and the "no second rule" sentence arrived later, with the confirmed interface.
- **Fix.**
  - Give the comet the one rule every kind has: `scrollKept` from the scroll at which it starts to fade in, times its own fade-in, retired for the visit at 0 (AC-25 already allows one a visit). That also retires the bespoke launch-gate fade and the About-row placement guard, since a 24 px scroll can't bring About up to it. The per-frame box test stays, for the drift and the lean.

    ```ts
    // The comet's light this frame: the veil's scroll cancel from where it began to appear, times its fade-in
    const kept = scrollKept(comet.appearScrollY, scrollY) * smoothstep(comet.appearAt, comet.appearAt + COMET.fadeIn, t)
    ```
  - Keep today's rule only if the veil session explicitly agrees to I9's scroll part. Then compute it in `sceneAt`, its one owner, and say in D4 and P12 that the comet waits for that answer.
  - CP-0 request 3 asks rather than assuming consent.
  - Under D4's default (no comet in v1), moving the comet's design to a follow-up is also fine.

### DRY-2 (minor): one clear-sky test is planned four ways, and its reach is spelled two ways

- **Section.** 6.4 (`ZONE_REACH`, `zonesNear`); 4.3 T3; 6.10 (`pickVisitSky` step 2); 6.11 (the `SATELLITE` doc, planning step 5); 6.12 (the comet); P11; PF; 8.3 I6; 8.4 request 1; 12.2 question 1.
- **Problem.** "Clear of every padded zone's reach" is one test, written as:
  - a tile box against zones grown by `ZONE_REACH` in the quiet index (`zonesNear`), with the reach tied to the veil's `QUIET_REACH`;
  - the comet's box against rects grown by `QUIET.feather` on every drawn frame, which is the same box test again;
  - for satellites, `segmentTouches` "if the veil session exports its test (I6, still open)", else sampled `quietAt`. PF exports `segmentTouches`, so the satellites' code depends on the route;
  - `quietAt(...) === 0` at a point, for an on-screen radiant.

  The index derives its reach from `QUIET_REACH` so that it follows a change of reach, but T3, the satellites, the comet, P11 and AC-24 and AC-25 hard-code `QUIET.feather`, so they wouldn't. I6 is still "open", although the contract says "Not exported: `segmentTouches`".
- **Evidence.**
  - `PLAN.md:1304-1308` and `:3258` (`ZONE_REACH`, then `QUIET_REACH - QUIET.padding`); `:1328-1336` (`zonesNear`).
  - `QUIET.feather` hard-coded: `PLAN.md:304` (T3), `:2500`, `:2566` (step 5), `:2586` (the comet's box, "re-tested on every drawn frame"), `:3124` (P11), `:3373` (AC-25).
  - `PLAN.md:2379` (`quietAt(field.quiet, x, y) === 0`).
  - `PLAN.md:3206` (I6 "open"), `:3242` (CP-0 request 1), `:3163` and `:3310` (PF exports `segmentTouches`), `:3498`.
  - `COORDINATION.md:85` (`QUIET_REACH`), `:127` ("Not exported: `segmentTouches`").
  - `drafts/judge-scores.md:52` marked down the delivery draft's DRY score because "its satellites sample `quietAt` instead of sharing the segment test". With the export declined, sampling is the right answer, but then it should be the only one.
- **Fix.** One owner, in `quietIndex.ts`, the model file that already owns the reach (a value import from `transients.ts` into `satellites.ts` would be the runtime cycle 5.2 warns about):

  ```ts
  /** How far the quiet math reaches from a padded zone (CSS px). From V it is QUIET_REACH less QUIET.padding. */
  export const ZONE_REACH = QUIET.feather

  /** Does `zone`, grown by ZONE_REACH, touch the box [x0, x1] × [y0, y1]? */
  export function zoneReaches(zone: SkyRect, x0: number, y0: number, x1: number, y1: number): boolean

  /** True when a→b stays out of every zone's reach: quietAt is 0 at points at most 8 px apart (it misses only grazes under 0.2 px deep). */
  export function segmentClear(zones: readonly SkyRect[], a: Point, b: Point): boolean
  ```

  - `zonesNear` filters with `zoneReaches`, and the comet tests `!zones.some((zone) => zoneReaches(zone, ...box))`.
  - Satellites use `segmentClear` on every route.
  - T3, the `SATELLITE` doc, P11 and AC-24 and AC-25 say `ZONE_REACH`.
  - Mark I6 as declined by the confirmed interface, drop CP-0 request 1, and drop the `segmentTouches` export from PF: it edits a veil-owned private helper for no gain.

### DRY-3 (minor): two statements of the fast-fireball wake tint disagree, and the mint wake forks into two constants

- **Section.** 6.10: the rewritten `METEOR_LOOK` doc, and the speed-class tint table.
- **Problem.**
  - The new `METEOR_LOOK` doc says fireballs warm to `fireballTint`. The tint table says fast fireballs cool to mint, mixed by `TRAIN.mintToWhite`. An implementer can't satisfy both.
  - The table also gives a fast fireball's wake the train's mint (0.45), while every other fast wake uses `METEOR_LOOK.mintToWhite` (0.55): two keys for one look. That comes right after 6.10 says, of the warm tint, "No second key holds the same color".
- **Evidence.** `PLAN.md:2294` ("slow wakes and fireballs warm to palette index `fireballTint`"); `:2483` ("fast fireballs, which cool to mint mixed `TRAIN.mintToWhite` toward white"); `config.ts:347` (`mintToWhite: 0.55`), `:357` (`TRAIN.mintToWhite: 0.45`); `renderSky.ts:177` (the train's color), `:222` (the wake's color).
- **Fix.** State the rule once, in the table, and have the doc point to it. If fast fireballs cool to mint, they use `METEOR_LOOK.mintToWhite`, the wake's one owner. `TRAIN.mintToWhite` stays the train's own color.

### DRY-4 (minor): three drawers borrow the never-lease keeps from `LAYERS.near`

- **Section.** 4.3 T3; 6.11 (drawing); 6.12 (the meteor-like could kinds, the comet); AC-25.
- **Problem.**
  - T3's guarantee for kinds that never take the lease ("adds no light inside any current padded rect"), and I9's premise, rest on `LAYERS.near` keeping 0 and 0. That is a star layer's look setting.
  - Three drawers pass it separately: `drawSatellite`, `drawMeteor`'s new P12 argument, and the comet. The round-1 `clearSkyFactor` was one owner; the veil reconciliation replaced it with direct calls.
  - Retuning the near layer's `quietKeep` for looks would let satellites and the could kinds add light inside padded rects, and nothing would flag it.
- **Evidence.** `PLAN.md:304`, `:2575` (`transientQuietFactor(frame.quiet, x, y, LAYERS.near)`), `:2591`, `:2586`, `:3373`; `:3637` ("replacing our `clearSkyFactor`"). `config.ts:72-80`: the `LAYERS` doc presents the keeps as how much light each layer keeps behind copy. The veil's rewritten `LAYERS` doc constrains only `inkKeep` ("mid and near must keep none").
- **Fix.** One owner with a doc comment that cites T3: `CLEAR_SKY_KEEPS = { quietKeep: 0, inkKeep: 0 } as const` in `config.ts`, or a one-line `clearSkyKept(frame, x, y)` in `renderSky.ts`. Every never-lease drawer uses it.

### DRY-5 (minor): P12's rare variants re-create `METEOR_KINDS` once per kind

- **Section.** The 6.12 table (point flash, burst, earthgrazer); P10 (`METEOR_KINDS`); P12 "Files per kind"; the specs in 6.9 and 6.11.
- **Problem.**
  - Fireballs are decided once, in the meteor spec, from `METEOR_KINDS`: a chance per launch, spacing, an earliest second, desktop only.
  - Bursts, earthgrazers and the point flash have exactly that shape ("5% of launches, at least 90 s apart, after 45 s; desktop"). Yet P12 gives each "its body, spec and registry entry": a separate kind with its own clock.
  - A separate clock can't express "a share of launches". And T7 (one of each kind at a time) would let a burst fly beside a meteor, against AC-20's "never two meteors at once outside a burst".
  - Every spec also repeats "the body's own time + `nextGap`(its law)".
- **Evidence.** `PLAN.md:2582-2584`; `:3089` (the fireball decision); `:3099-3101` (`METEOR_KINDS`); `:3136` (P12's files); `:3368` (AC-20); `:1982` and `:2569` (body time + gap in each spec).
- **Fix.**
  - Every "share of launches, spaced, not before N s, wide screens only" variant becomes a `METEOR_KINDS` entry (with a `minWidth` where needed), decided in the meteor spec's one decision step, its body a variant of the meteor's.
  - Only kinds with their own clock (satellites) get a registry entry.
  - Optionally, specs give `gap(narrow): GapLaw` and `busy(body)`, and the scheduler applies `busy + nextGap` once.

### DRY-6 (minor): "ease, then one more frame" is written three times

- **Section.** 6.2 (`frameDemand`'s fade line); 6.6 (`settleMotion`); P6 (the ADAPT thin fade).
- **Problem.**
  - The veil's `settleQuiet` asks for one frame after its ease ends.
  - `settleMotion` copies its condition for the motion ease.
  - P6 asks for a third, unnamed copy for the thin fade ("as `settleQuiet` does").
  - `frameDemand`'s fade line gains one clause per ease.
- **Evidence.** `sky.worker.ts:241-243` (`settleQuiet`); `PLAN.md:1587` (`lastDrawAt / 1000 − motionChangedAt < FRAME.motionEase && t − motionChangedAt >= FRAME.motionEase`); `:2980` (the thin fade); `:1108` (the fade line).
- **Fix.** Two pure helpers in `pacing.ts`. The motion ease and the thin fade use them now; after V they can serve `settleQuiet` too.

  ```ts
  /** An ease that began at `from` (s) and lasts `duration` s still changes the sky at `t`. */
  export function easing(from: number, duration: number, t: number): boolean

  /** It has ended by `t`, and the last drawn frame (`drawnAt`, s) still showed it part way: draw once more. */
  export function easeEnded(from: number, duration: number, t: number, drawnAt: number): boolean
  ```

### DRY-7 (minor): the ambient gates are written twice for each part, and the narrow test spreads further

- **Section.** 6.1 (the worker side); 6.2 (`frameDemand`, `cameraDemand`, `twinkleDemand`, `driftCap`); 6.6; 6.9 (`PlanContext`, `LaunchGate`).
- **Problem.**
  - `driftWanted` and `driftRate` both test `exitAt` and `driftAffordable()`.
  - `driftWanted`, `twinkleDemand` and `twinkleLevel` each re-derive "full motion and present".
  - `cameraDemand` calls `driftWanted` and `leanPending` again, right after `frameDemand` evaluated them.
  - F6 depends on these pairs agreeing. A gate added to one and not the other wakes a worker that never moves, or moves a sky that never wakes.
  - `width <= NARROW_MAX_WIDTH` is already written inline five times. The plan adds `driftTarget`, `driftCap`, `LaunchGate.narrow` and `PlanContext.narrow`, and the veil's planner recomputes the last from `field.width` anyway.
- **Evidence.** `PLAN.md:821-823`, `:831-835`, `:1132-1135`, `:1532`, `:1107`, `:1119-1123`, `:827`, `:1127`, `:1935`, `:2001`; `sky.worker.ts:201`, `catalog.ts:90`, `skyAssets.ts:131`, `meteors.ts:128`, `:187`.
- **Fix.**
  - Compute once per tick and pass the values down: `driftAllowed()` for the hard gates; one "ambient heading up" flag and one ambient level (presence × motion), shared by twinkle and drift.
  - `cameraDemand` takes `wanted` as a parameter.
  - One owner for the narrow test: an `isNarrow(width)` beside `NARROW_MAX_WIDTH`, or a worker `narrow` set in `resize`.

### DRY-8 (minor): P4's twinkle clock is a second way of leaving out hidden time

- **Section.** 6.6 ("a twinkle clock without hidden time").
- **Problem.** The worker already stops the dusk clock while the tab is hidden, by shifting `exitAt`. P4 adds `twinkleTime`, "the worker clock minus the total time the tab spent hidden", accumulated "the way it already shifts `exitAt`". That is two mechanisms for one rule.
- **Evidence.** `sky.worker.ts:453`; `PLAN.md:1564-1568`.
- **Fix.** Keep one total of hidden seconds in the `visible` handler. The twinkle reads `t` less that total, and the dusk reads the same total (or keeps its shift, written in terms of it).

### DRY-9 (minor): the ink lease's source fact is copied three times

- **Section.** 6.9 (`Planned`, `TransientEnvelope`, the launch step).
- **Problem.**
  - The veil's `Meteor.nearCopy` says whether the path is veiled. `Planned.nearCopy` copies it, and the envelope copies it again.
  - T2's checks read the copies, while the veil's budget follows the body's path.
  - A planner that forgets the copy, or a P12 variant that wraps meteors, puts the lease out of step with the light.
- **Evidence.** `COORDINATION.md:96`; `PLAN.md:1940-1944`, `:1899-1900`, `:2083`.
- **Fix.**
  - The spec owns an accessor, `nearCopy(body: TransientBodies[K]): boolean`: `(meteor) => meteor.nearCopy` for meteors, `() => false` for satellites.
  - `plan` returns the body alone.
  - The scheduler sets the envelope's `nearCopy` from the accessor once, at launch, and runs T2's check against it.

### DRY-10 (minor): the comet re-applies the camera law and hard-codes values the model owns

- **Section.** 6.12 (the static comet); AC-25.
- **Problem.**
  - The comet is "drawn after the layers with the camera law": a second copy of `world − q·C` beside `drawLayer`, which C2 names as the only place.
  - Its guard uses literal drift extents ("the drift up to 165 q px down and 47 q px up"). Those depend on the phases and v₀, which D6 lets the user change.
  - Its nearness is the literal 0.29.
  - Its contrast fade borrows `TRANSIENTS.cancelFade`, the pause's fade.
- **Evidence.**
  - `PLAN.md:2586`, `:272` (C2), `:173` (D6: rotating the phases, v₀ from 2.5 to 4).
  - [computed, `band-means.mjs`] For these phases the camera's vertical drift spans −165.2 to +47.1 px at q = 1 (−ΣR − Σ R sin φ and ΣR − Σ R sin φ), so rotating the phases changes both. The far band's mean nearness is 0.29348.
- **Fix.**
  - Export one `driftReach` from `camera.ts`, computed from `EPICYCLES` (C3's 2ΣR bounds it for any phases), and a small `cameraPoint(x, y, q, offset, out)`. The comet uses `cameraPoint`; `drawLayer` may keep its inline copy for speed, with a comment that it is the same law.
  - Take q from `nearness()` or from the far band's computed mean.
  - Give the comet a fade constant of its own.

### DRY-11 (minor): after P9, `METEOR.duration` and `fallbackDuration` survive only to encode one ratio

- **Section.** 6.10 ("Removed in P9", the rewritten key docs, step 5 of the aim).
- **Problem.** After P9 the flight durations come from `SPEED_CLASSES`. The two `METEOR` ranges stay only so the aim can compute `fallbackDuration[1] / duration[1]` (0.9 / 1.4). The plan then has two sources of flight duration, and one of them is no longer a duration.
- **Evidence.** `PLAN.md:2299` ("`duration`, `fallbackDuration` and `speedJitter` stay: the aim reads them"), `:2306`, `:2391`, `:2264-2268`.
- **Fix.** Replace both ranges with one key, for example `METEOR.fallbackScale: 0.64`, documented as "the fallback pass flies each speed class's durations times this".

### DRY-12 (minor): `TransientOf` is declared and never used

- **Section.** 6.9, Types.
- **Problem.** An exported generic type with no reader: a small piece of over-engineering.
- **Evidence.** `PLAN.md:1911` is its only occurrence in the plan.
- **Fix.** Remove it, and add it when a caller needs it.

### DRY-13 (minor): the list of overlaps lives in three places, and they disagree

- **Section.** 4.4; 8.2 (CP-5); 8.4 (the CP-0 message); 8.6.
- **Problem.**
  - 4.4, CP-5 and the CP-0 message say both plans change only `frameAt` and `sameRects` before V.
  - 8.6 also has P2 removing `parallax` from the same `LAYERS` lines, and rewriting the same `LAYERS` doc, that the veil commit edits (`LAYERS.far.inkKeep` from 0.1 to 0). It also has P5 adding its `AGENTS.md` line next to the line the veil rewrites.
  - So the message the veil session receives lists fewer overlaps than 8.6 does.
- **Evidence.** `PLAN.md:330`, `:3193`, `:3217`, `:3282`, `:3287`; P2's files (`:2830`); `COORDINATION.md:81`, `:134-135`.
- **Fix.** Keep the list once, in 8.6, and point to it from 4.4 and CP-5. The CP-0 message also names `LAYERS` and `AGENTS.md`.

### DRY-14 (minor): the document restates facts instead of citing one home, and it has grown again

- **Section.** The whole plan (C27 in round 2 and C35 in round 3 left this to the DRY audit).
- **Problem.**
  - `PLAN.md` has 57,798 words, up from 49,368 in round 2 and 53,067 in round 3. That is 1.24 times R1 to R4 together (46,672). The growth is mostly restatement, not new design.
  - Copies have diverged before (AC-2 in round 2) and diverge now: DRY-3, and the far band's mean nearness, which is 0.293 at `:489` and in H6 (`:2724`), 0.294 at `:577` and 0.29 at `:2586`. The exact value is 0.29348 [computed].
  - Numbers the veil owns are restated rather than cited, so checkpoint V's "adopt their names and numbers" step has to hunt for every copy.
- **Evidence.**
  - The glide cap is restated on 13 lines, and `maxLag` appears on 16.
  - The crossing-cooldown argument appears in full twice (deviation 11 at `:63`; 6.9 at `:2123-2135`), and "55 s" on 9 lines.
  - The APG `aria-pressed` rationale appears on 6 lines.
  - `SCROLL_CANCEL`'s 12 and 24 px are restated at `:60`, `:1866`, `:2069`, `:2122`, `:2725`, `:3388` and `:3636`. `inkBudget`'s formula is restated in section 11 (`:3456`), and the veil planner's rules at `:2470`.
  - The Check log has 2,200 words, restating dispositions that `drafts/check-r*.md` already hold.
- **Fix.**
  - Give each fact one home and cite it elsewhere by name: the glide cap in 6.1, the cooldown in 6.9 (deviation 11 shrinks to one line pointing there), the APG pattern in 6.8, the satellite figures in 6.11.
  - For anything the veil owns, cite the name (`SCROLL_CANCEL`, `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS`) and `COORDINATION.md` instead of the numbers.
  - Make each round of the Check log one table that links the reports.
  - Correct the 0.294.
  - Aim for well under the research's size.

## What holds (no finding)

- **The veil's exports are reused, not re-implemented.**
  - `scrollKept` runs through one `transientFade` for every transient kind (6.9).
  - Every transient drawer uses `transientQuietFactor`.
  - The quiet index wraps `easedQuietFactor` bit for bit (Q1, H3).
  - `inkBudget`, `budgetKeeps`, `INK_BUDGET` and `headGain` stay inside the veil's planner and `drawMeteor`.
  - `SkyRect.headroom` passes through unchanged and is compared by the moved `sameRects`.
  - `contrastLevels()` feeds `LaunchGate.ink`.
  - The one exception is DRY-1.
- **No config is duplicated between the worker and the main thread.**
  - The main thread's new constants (`ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`, `LEAN_POINTER_QUERY`, `PAUSED_KEY`) have no twin in the worker.
  - A pause reaches the worker as `motion: 'reduced'` (PB3), with no new message.
  - After P5 the reduced-motion query has one reader, `skyPause.ts`, because `mountSky.ts:3`, `:146` and `:245` go.
  - No existing media-query hook or store in `src/` is duplicated by `skyPause.ts`.
- **Good single owners.**
  - `LAYER_NEARNESS` is derived from `LAYERS.magnitude`, and `EPICYCLES` from `DRIFT`.
  - One `GapLaw` with one `nextGap`, and one `smoothstep`.
  - `sceneAt`'s single mixer carries the drift and lean levels.
  - `placePoint` places every point of light.
  - `METEOR_LOOK.fireballTint` serves every warm wake.
  - The `TRANSIENTS` keys move out of `METEOR`.
  - `sameRects` moves to `scene.ts` so the index can reuse it.
  - D11 is rejected because it would duplicate `scrollKept`.
- **Over-engineering, checked and accepted.**
  - The three-strike watchdog with its probe (R3 §2.1's provider that never calls back).
  - The refresh estimate's detection of a slower display.
  - `maxLag`'s steady trail, which measurements back.
  - SF2's one-comparison guard.
  - I9's two-way fallback, at about 3% of leases.

  Only `TransientOf` (DRY-12), PF's `segmentTouches` export (DRY-2) and the comet's bespoke guards (DRY-1, DRY-10) go beyond "defensive but not over-engineered".

## Summary

- **One major.** The comet keeps a scroll-fade rule of its own, which the confirmed interface forbids, and the plan has no comet design if the veil session says no. Routing the comet through `scrollKept`, or making an explicit yes to I9 a precondition for building it, clears the gate.
- **Thirteen minors.**
  - Design:
    - one clear-sky test planned four ways, with two spellings of its reach;
    - a tint rule stated two ways that contradict each other;
    - keeps borrowed from a star layer in three drawers;
    - P12 variants that bypass `METEOR_KINDS`;
    - three copies of the ease-then-one-more-frame rule;
    - gates and narrow tests computed twice or more;
    - two clocks that leave out hidden time;
    - the lease's source fact copied three times;
    - comet literals that the model owns;
    - two config keys kept for one ratio;
    - an unused type.
  - Document:
    - overlap lists that disagree;
    - a plan that restates rather than cites, now 57,798 words.
- **What is already right.** Apart from DRY-1, the veil's exports are reused correctly, and nothing is duplicated between the worker and the main thread.

## Verification

Skeptic pass, 2026-10-27. Each finding was re-checked against `PLAN.md` as the audit read it (sha256 prefix `ab3c192d506b4bc5`, 3,646 lines, 57,798 words, unchanged since), the worktree code at 246c0aa, all of `COORDINATION.md`, `drafts/` (the committed plan at 2e622a5, `judge-scores.md`, the round 2 to 4 completeness reports) and, read only, the main checkout's uncommitted veil edits. The band means and drift extents were recomputed independently, analytically rather than by sampling, in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/dry-skeptic/check.mjs`: far-band mean nearness 0.29348, and the drift's vertical camera offset −165.2 to +47.1 px at q = 1. No fix below breaks a `COORDINATION.md` constraint, but DRY-1's and DRY-8's need the corrections given. Verdicts: 13 confirmed, 1 partly, none refuted. Plain numbers in parentheses are `PLAN.md` lines.

- **DRY-1: confirmed (major stands).** The comet's own fade "stand[s] in for `scrollKept`" (2586), while `COORDINATION.md:34` names the comet among the kinds that obey the scroll cancel and `:89` forbids a second rule; I9's fallback covers only overlap in time (3209), and CP-0 request 3 presumes consent ("tell us if you need `scrollKept` instead", 3244). `scrollKept` takes any reference scroll (the distance is absolute, main checkout `scene.ts:186-187`), so the fix complies. One correction: it does not retire the About-row guard. The comet may start to appear anywhere the launch gate allows (up to 0.4 viewport heights, where About's header row is already at 0.6 H plus its padding), and About has no quiet rects (2.2, section 11), so no box test would catch it; keep the guard, now at 0.4 viewport heights plus `SCROLL_CANCEL.to`, or let the comet appear only near the top. Also state under D4 that the comet then ends at the first 24 px of scroll (the plan's current design keeps it until 0.4 viewport heights). Minor: the plan never says where its fade is computed, so "recomputes `scrolled` outside `sceneAt`" is an inference.
- **DRY-2: confirmed.** `zonesNear` (1328-1336) and the comet's per-frame box test (2586) are one predicate, a box against a zone grown by the reach; the reach is `ZONE_REACH` in the index but `QUIET.feather` in T3 (304), the `SATELLITE` doc (2500), step 5 (2566), the comet, P11 (3124) and AC-25 (3373); the satellite test forks on I6 and on PF (2566, 3119, 3163, 3310); and I6 is still "open" (3206) although `COORDINATION.md:127` lists `segmentTouches` as not exported. Two details are off: AC-24 (3372) names no `QUIET.feather`, and the point test `quietAt(...) === 0` (2379) is reuse of the veil's export, not a fourth copy (the fix leaves it alone anyway). If the helpers go into `quietIndex.ts`, Q2 ("only `drawLayer` uses it", 298) must narrow to the index's buckets, since satellite planning would then import the module.
- **DRY-3: confirmed.** The rewritten `METEOR_LOOK` doc says fireballs warm to `fireballTint` (2294); the tint table says fast fireballs cool to mint mixed by `TRAIN.mintToWhite` (2483). Today the wake's mint is `METEOR_LOOK.mintToWhite` 0.55 (`renderSky.ts:222`, `config.ts:347`) and only the train uses 0.45 (`renderSky.ts:177`, `config.ts:357`); ordinary fast flights already pair a 0.55 wake with a 0.45 train, so matching a fireball's train is no reason to fork the key.
- **DRY-4: confirmed (minor).** The committed plan (2e622a5) had one `clearSkyFactor` that held `LAYERS.near`; the reconciliation (3637) replaced it with direct `transientQuietFactor(..., LAYERS.near)` calls in three drawers (2575, 2586, 2591), so T3 (304) and I9's premise (3209) rest on a star layer's look setting. The veil's in-progress `LAYERS` doc (main checkout `config.ts:72-77`) pins only `inkKeep` ("mid and near must keep none"). The exposure is small, since these kinds are also planned clear of the feather, and the fix costs one line (SOC-3 reaches the same place from the separation-of-concerns side).
- **DRY-5: confirmed.** The burst and earthgrazer rows have `METEOR_KINDS`' exact shape (a share of launches, spacing, an earliest second, a width gate; 2583-2584, 3099-3101) and the point flash is a meteor proposal (2582), yet P12 gives each its own spec and registry entry (3136), that is its own clock, which cannot express a share of launches; and T7 (308) lets a burst overlap an ordinary meteor, against AC-20 (3368). As meteor variants they would also hold the meteor kind's slot, which settles their I9 overlap with a lease holder. The `busy + nextGap` part is optional with two specs (1982, 2569).
- **DRY-6: confirmed (minor).** `settleQuiet` (`sky.worker.ts:241-243`), `settleMotion` (1587) and P6's thin fade (2980, "as `settleQuiet` does") repeat one "ended since the last drawn frame" test, and the fade line (1108) repeats the matching "still easing" test per ease; one pair of helpers keeps the two boundaries in step. Leaving `settleQuiet` until after V respects `COORDINATION.md` request 2. The fade line still needs one clause per ease, since each is its own reason to draw.
- **DRY-7: confirmed (minor).** `driftWanted` (821-823) and `driftRate` (831-835) both test `exitAt` and `driftAffordable()`; "full motion and present" is derived in `driftWanted` and `twinkleDemand` (1132-1135), and presence times the motion level in `driftRate` and `twinkleLevel` (1532), where the plan itself promises "one presence gate for all ambient motion"; `cameraDemand` (1119-1123) re-runs `driftWanted` and `leanPending` just after `frameDemand` did (1107). The narrow part is the weakest: `NARROW_MAX_WIDTH` already owns the threshold, and the veil's planner keeps its own test (main checkout `meteors.ts:192`, `:269`); prefer the worker `narrow` set in `resize`, since `config.ts` holds only constants and types today.
- **DRY-8: confirmed (minor), with a correction to the fix.** P4's hidden-time total (1564-1568) and the `exitAt` shift (`sky.worker.ts:453`) are two ways of keeping hidden time out of a clock. But if the dusk just reads "t minus the total", an `emerge` that arrives while the tab is hidden (a page opened in a background tab) is recorded too late on that clock, and at show the dusk waits as long as the tab was hidden before the emerge, where today it starts at once (`sky.worker.ts:417`, `:452-453`). Unify through one visible clock that also stands still during the current hidden stretch, with `exitAt` recorded on it, or keep the shift.
- **DRY-9: confirmed.** `Meteor.nearCopy` (`COORDINATION.md:96`) is copied into `Planned.nearCopy` (1940-1944) and again into the envelope (1899-1900), and T2's check reads the copy (2083). A planner that wrote `nearCopy: context.nearCopy` would type-check and pass that check, yet hold the lease and start the cooldown for flights that never come near copy. With a spec accessor the body is the one source; the envelope's single copy, set once at launch, stays as the lease's cache.
- **DRY-10: partly.** Holds: the comet's guard uses literal drift extents ("165 q px down and 47 q px up", 2586; recomputed as −165.2 to +47.1 px at q = 1) that change with D6's v₀ and phases (173), and a literal nearness 0.29 that would not follow a `DEPTH` retune (the exact far-band mean is 0.29348); derive both. Does not hold: the camera law is one line, C2's enforcement names stars only (272), and the fix itself keeps `drawLayer`'s inline copy, so `cameraPoint` would be a helper with one caller; and the box-fail fade is itself a cancel, so sharing `TRANSIENTS.cancelFade` is a defensible single owner, a look choice rather than duplication.
- **DRY-11: confirmed.** From P9 `planFlight` takes a `fallback` flag instead of `timing` (2443-2444), so `METEOR.duration` and `fallbackDuration` (`config.ts:275-276`) are read only by aim step 5's ratio, 0.9 / 1.4 (2391); the veil's in-progress planner reads them only as `timing` (main checkout `meteors.ts:272-273`). Yet 2306 still documents them as flight durations beside `SPEED_CLASSES`. One `fallbackScale` (0.643) is one owner, changed after V, when these keys are shared.
- **DRY-12: confirmed.** `TransientOf` occurs once (1911). It comes from R3 §7.2 (`R3-rendering-engineering.md:604`), whose spec signatures used it; the plan's `TransientSpec` takes `TransientBodies[K]`, so nothing reads it (SOC-12 found the same).
- **DRY-13: confirmed.** 4.4 (330), CP-5 (3193) and the CP-0 message (3217) name only `frameAt` and `sameRects`, while 8.6 has P2, before V, editing the `LAYERS` lines and doc the veil edits (3282; the main checkout's diff changes the `far` line and the doc) and P5's `AGENTS.md` line beside the line they rewrite (3287). 8.6 also shows a third overlap the fix should carry into CP-0: P6 and P7 add `SceneLevels` fields before V, beside their `meteors` doc (3280). The main checkout further edits `mountSky.ts:4`, next to the import P5 removes (`:3`), which 8.6 calls "different functions", so CP-5 should re-derive the one list from their diff.
- **DRY-14: confirmed (minor).** 57,798 words (`wc -w`), 1.24 times R1 to R4 (46,672), against 49,368 and 53,067 at the round-2 and round-3 checks and 54,853 at 2e622a5; `maxLag` on 16 lines, `SCROLL_CANCEL`'s 12 and 24 px on the 7 cited lines, a 2,200-word Check log. The exact far mean is 0.29348, so the 0.294 at 577 is the one wrong copy (0.29 at 2586 is a fair rounding, not a divergence); "mostly restatement" is a judgment, but the cited restatements are real. It overlaps check-r4-completeness C44; cut restatements and the log, not the implementer's specs.
