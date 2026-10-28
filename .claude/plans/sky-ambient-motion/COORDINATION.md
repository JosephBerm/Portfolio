# Coordination with the meteor-veil session

The other session is the cloud session "Stars and comment animation redesign", `session_01ETNMD4Evfbvs1kq6PPU3AK`. Its branch, `master-r26syw`, is based on master 246c0aa plus a WIP commit (a58c2c6) that changes `.env.example` only. Nothing is pushed yet.

## Its reply (2026-10-25 07:09 UTC), condensed

**State.** The working tree is clean and no code has changed. An Opus planning workflow (2 planners, then a judge, then an adversarial checker) is running. Sonnet implements after the check. It will message the final plan and the pushed commit. Agreed: the veil fixes land first, and this plan builds on top of them.

**Files and functions it will touch:**

- `src/lib/sky/meteors.ts`
  - `veiledFrom`: the `clearUntil` and `rise` rules.
  - `planFlight`: first-fit selection, possibly preferring crossings.
  - `planMeteor`: splits the long pass from the short fallback, so the worker can try fresh radiants before falling back.
- `src/lib/sky/config.ts`: `METEOR_VEIL` (`clearUntil`, `inkKeep`, maybe per-text-class ink budgets), the WCAG doc comments, possibly the METEOR spawn and selection keys, and `QUIET`.
- `src/components/sky/sky.worker.ts`
  - `updateMeteor`: radiant ordering.
  - The `scroll` handler: drops or fades a flight once scrollY moves about 16–24 px from launch.
  - The `layout` handler and `quietBlend`: defers a layout that arrives mid-ease, which fixes a star pop.
- `src/components/sky/renderSky.ts`: the `drawMeteor`/`drawTrain` veil, possibly with a per-class ink keep.
- `src/lib/sky/scene.ts`: `quietFactor`/`inkAt`, possibly per rect class.
- `src/components/sky/mountSky.ts` and `src/lib/sky/protocol.ts`: maybe a per-rect text class (large or body text), and removing entrance-transform offsets from the measured rects.

**Assumptions its budgets rely on:**

- **One transient on screen at a time: YES.** The canvas composites additively. Slate body text keeps 4.5:1 with only about 0.082 of white on navy as headroom. That shrinks to about 0.064 under the hero haze, and to about 0.026 with a far star on the same pixel. Two meteors on the same copy break the budget.
- **One top-right radiant, right-to-left at 18–42°: NOT relied on for safety.** The veil samples the actual path, so any direction is safe if the flight goes through the planner's veil checks. The crossing rates were measured for this geometry, though, so new directions change how often meteors meet copy.
- **Gaps of at least 30 s: not a contrast assumption.** The gap limits how often visitors see a crossing. WCAG 2.2.2 applies per animation: each is under 5 s, including the 2.4 s train.
- **0.4 viewport heights: a LAUNCH gate only.** Today a flight already in the air keeps drawing through any scroll. That is a verified bug: unquiet copy such as About scrolls under the meteor head unveiled, down to about 1:1 contrast. The fix cancels or fades flights on scroll, and any new transient kind must obey the same rule.
- **Quiet zones move only on scroll or layout: yes.** Star drift is fine, because each star is veiled at its own position every frame.

**Its requests for this plan:**

1. Every transient that can pass over `data-sky-quiet` copy (meteor, burst, earthgrazer, satellite, comet) is planned through the same veil checks, drawn with the same veil and ink budget, and obeys the scroll cancel. Transients that light up near copy must not overlap in time unless they share one ink budget.
2. Leave these to the veil session until its commit lands, then rebase on it: `veiledFrom`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the `layout` handler) and the `scroll` handler.
3. WCAG 2.2.2: continuous ambient drift that starts automatically, lasts more than 5 s and runs alongside content needs a pause or stop mechanism, or must stop on its own. Today the twinkle eases out after 90 s idle, and everything is off under prefers-reduced-motion. At minimum, put drift under the same idle and reduced-motion gates.
4. Its evidence (captured layouts, a Node planner harness, the WCAG math) is in its container. It will send the key numbers with its final plan.

## Update 2026-10-27: the veil work resumed in a local session

The cloud veil session ran out of credits before it pushed a plan or code, so its plan and evidence are lost. A local desktop session, "Star and comment animation redesign" (`local_e2e17660-e99d-43e6-84ab-7337ee88227d`), took the veil work over on 2026-10-27. It is resuming from the data its local predecessor's investigators left (live rects, a simulation, WCAG budgets per text element): investigate, plan, Opus confirmation, implementation, live verification, audit. Its message, condensed:

**Ownership.** It edits only the main checkout (`S:\Documents\repos\Portfolio`, the master working tree, uncommitted): `src/lib/sky/{meteors,config,scene,protocol}.ts`, `src/components/sky/{sky.worker,renderSky,mountSky}.ts`, and possibly `src/lib/sky/color.ts` for one shared luminance helper. It doesn't touch this worktree or this branch, and commits nothing until the user approves. This planning work reads `src/` only from the worktree (master 246c0aa), never edits the main checkout's `src/`, and never commits or pushes master.

**Interface it will add.** Names may still change; its confirmed plan will give the final ones.

- R2 §11 item 1, in part: `planFlight` takes a near-copy or clear-sky option, and the returned meteor reports `nearCopy`.
- Item 4: one shared scroll cancel (`launchScrollY` plus a short fade), written once for every moving kind.
- Item 5: a sticky radiant, re-picked on resize, on layout, or after N failed plans.
- A `QUIET_REACH` export.

**Left to this plan.** It won't add these: the direction source for `planMeteor` and `planFlight` (the rest of item 1), the light-curve parameter (item 2) and drag (item 3). They land after the veil commit and must not change `veiledFrom`.

**Ink budgets per text class.** Measured at 1440x900 with exact WCAG math over the real navy and haze. Each budget is the fraction of white that may light up behind that copy.

| Copy | WCAG minimum | Budget |
| --- | --- | --- |
| Slate body text, 16 px | 4.5:1 | about 0.08 |
| Slate tagline, 75 px semibold | 3:1 | about 0.19 |
| Name `h1` | 3:1 | about 0.40 |
| Green text | not stated | about 0.33 |
| Side rails | not stated | about 0.19 |

Flights from today's top-right radiant almost always reach the large tagline or the name first. Per-class ink budgets are therefore likely, so `PLAN.md` assumes per-rect text classes on the quiet rects, not one blanket cap. The ink lease and the "one lit transient near copy" rule still apply.

**Dev server.** It runs `portfolio-dev` on http://localhost:3000 for its verification agents. Don't stop or restart it.

**Next messages.** It will message when its plan is confirmed (with the final interface) and when its implementation lands in the working tree. When each arrives, update this file and re-check `PLAN.md` against it.

## Confirmed veil interface (2026-10-27)

The veil session's fix plan is confirmed (Opus max, 3 check rounds), and implementation started in the main checkout's working tree, uncommitted. These are the final names and signatures it sent. **They supersede the "Interface it will add" list above** wherever the two differ. The implementing session for `PLAN.md` builds on exactly these. It stays off the veil session's files until Joseph approves and commits that change, then rebases onto it.

### Exports

**`src/lib/sky/protocol.ts`**
- `SkyRect.headroom: number`: the amount of white that can be added over navy before that copy falls below WCAG 1.4.3. The main thread measures it per element from the computed color, size and weight. This number is the text class: there is no enum. (It replaces the "body vs large" class this plan expected.)

**`src/lib/sky/config.ts`**, next to `METEOR_VEIL`:
- `INK_BUDGET = { ceiling: 0.2, safety: 0.9, hazeReserve: 0.025 }`.
- `STAR_INK_PEAK = 0.6 * LAYERS.far.inkKeep`, and `LAYERS.far.inkKeep` goes from 0.1 to 0, so far stars add no light on copy.
- `METEOR_VEIL = { quietKeep: 0.3, clearUntil: 0.47, rise: 0.01, samples: 64, edgeBright: 0.3, edgeKept: 0.5 }`. `inkKeep` and `inkFrom` are removed.
- `METEOR_PASS = { share: 0.4, visible: 0.12, dwell: 0.1, glimmer: 0.041 }`.
- `SCROLL_CANCEL = { from: 12, to: 24 }` (CSS px of scroll).
- `QUIET_REACH = QUIET.padding + QUIET.feather`: 72 px from a measured rect. From a padded zone, which is what this plan's quiet index takes, the reach is `QUIET.feather` (40 px).

**`src/lib/sky/scene.ts`**
- `inkBudget(headroom)` and `budgetKeeps(white, quietKeep, ink = 1): QuietKeeps`.
- `scrollKept(launchScrollY, scrollY, fade = 1)`: returns `fade` times a ramp from 1 to 0 over 12 to 24 px of scroll. Retire the transient when it reaches 0. A pause or cancel fade goes in as `fade` and can only dim. **Don't add a second threshold-plus-fade rule:** every transient kind uses this helper.
- New `transientQuietFactor(blend, x, y, keeps)`: the more protective of the eased factor and the current zones' factor. **Every transient that can come near copy must use it.** Stars keep `easedQuietFactor`.
- `QuietKeeps.inkKeep` can be a number or a function of the rect.
- `quietFactor` makes one pass over the zones, and the most protective zone wins. It is bit-identical to today's for numeric keeps.

**`src/lib/sky/meteors.ts`**
- `planMeteor(random, field, radiant, now, options: PlanOptions = {})`, with `PlanOptions { nearCopy?: boolean; flights?: 'long' | 'short' | 'both'; ink?: number }`.
- `Meteor.nearCopy: boolean`, true when `dimFrom < 1`.
- `headGain(boost = 1)` and `WAKE_GAIN`.
- Private `planFlight(random, field, radiant, now, options: PassOptions)`, where `PassOptions extends PlanOptions` adds `timing` and `fireballs`. This plan's P9 `fallback` flag replaces `options.timing`.
- Neither function takes a positional boolean.

**`src/components/sky/renderSky.ts`**
- `drawMeteor(ctx, assets, meteor, frame, fade = 1)`: `fade` multiplies the train, wake, glow and core alphas. This is this plan's I7. There is no `SkyFrame.meteorScroll` field.

**`src/components/sky/sky.worker.ts`**
- `launchScrollY`.
- `planLaunch`: the radiant is sticky, and long flights are tried on fresh radiants before any shorter fallback. Resize clears the radiant. Layout does NOT re-pick it, because layout also fires for harmless re-measures.
- `contrastLevels`.
- `applyLayout` and `settleQuiet`: a layout that arrives mid-ease waits for the ease to finish, and the newest one wins.

**`src/components/sky/mountSky.ts`**
- `copyReader` measures rects net of transform translations.

### `veiledFrom` rules (add options only; never change the rules)

- The head stays in clear sky through p = 0.47 (the light peaks at 0.45).
- Once dimmed, it never brightens again.
- New edge-fade rule: a path is rejected if the veil dims a head that is at least 0.3 white unveiled down to 0.5 or less, unless the head then shows on a text rect at 0.041 white or more for at least `METEOR_PASS.dwell`.
- It returns `{ dimFrom, behind } | null`.

### Changed shape

- `veiledFrom`, `planFlight`, `planMeteor` (plus options), `Meteor` (plus `nearCopy`).
- `screenQuietZones` (keeps `headroom`), `quietFactor`, `QuietKeeps`.
- `drawMeteor` (plus `fade`).
- Worker: `updateMeteor`, `applyLayout`, `settleQuiet`, the `layout` case, `sameRects` (plus `headroom`), `frameAt`.
- mountSky: `quietRect` and `quietRects`.
- Now private: `fitKeep`, `luminance`, `contrastRatio`. Not exported: `segmentTouches`.

### What it means for PLAN.md

- I2/H10: the ink budget no longer assumes a peak of 0.9 or less. The renderer fits any brightness to each rect's budget.
- AC-30's far-star exceedance is closed by construction (far stars add no ink on copy).
- One lit transient near copy at a time still holds: the budget counts one transient plus the haze.
- New AGENTS.md precondition, one line, landing in the veil change: quiet copy and its ancestors carry no static transform translation and no opacity below 1 at rest. This constrains the D1 placement options inside a quiet root.
- The veil change also edits comments in `Introduction.tsx` and `SidePane.tsx`. This plan's P5 AGENTS.md line rebases on top of the veil's.
- Numbers before the edge-fade rule, from its planner at 1440x900, 1280x800 and 1920x1080: the head passes behind copy at 0.12 white or more for 0.1 s in 29%, 19% and 25% of flights (0% today). Rendered streaks: 21%, 14% and 20%. The edge-fade rule cuts flights that dim at a copy edge without passing behind it from about 24 to 36% to under 2% on desktop. Final numbers come with its "landed" message.

## Answers to the planning session's questions (2026-10-27)

We asked five questions (the file rule, the `frameAt` and `sameRects` overlaps, I9's never-lease overlap, a comet's fade, `QuietBlend.next`) and told it about P9. Its answers, condensed. They are authoritative and supersede PLAN.md's either-or branches on these points.

**Status.** The implementation is in the main working tree. The first live check and four Opus audits are done, and a fix round with a final Opus check is still running. Nothing is committed, and Joseph approves the commit. Treat the working tree as provisional until the "landed" message. That message carries:
- the SHA, once Joseph commits;
- the definitive touched-symbol list from `git diff`;
- the crossing numbers we asked for;
- the harness path.

**1. The file rule is symbol-level.** Our reading is right:
- before its commit, never touch the main checkout's working copies;
- on our branch we may edit other lines of the same files, and at the rebase its lines win;
- don't reformat, reorder or move its symbols before the rebase.

Its symbols with changed lines today (this replaces the shorter "Changed shape" list above as the hands-off list):
- `protocol.ts`: `SkyRect.headroom`.
- `color.ts` (all new):
  - exported, main thread, used by `copyReader`: `parseRgbColor`, `minimumContrast`, `lightHeadroom`;
  - private: `linear`, `luminance`, `contrastRatio`, `WCAG_CONTRAST`, `HEADROOM_STEPS`.
- `config.ts`:
  - the header doc (the WCAG thresholds now live in `color.ts`);
  - `LayerConfig`/`LAYERS` (far `inkKeep` 0) and `STAR_INK_PEAK`;
  - the `QUIET` doc and `QUIET_REACH`;
  - the `HAZE_POOLS` and `HAZE_REBUILD_MS` docs;
  - `CONTRAST_NORMAL.meteorInk` (1) and `CONTRAST_MORE.meteorInk` (0);
  - `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS` and `SCROLL_CANCEL`;
  - the `METEOR` keys and docs (`radiantTries`, `attempts`, the spawn keys).
- `scene.ts`:
  - the `SceneLevels.meteors` doc and `screenQuietZones` (keeps `headroom`);
  - `zoneQuiet`, `zoneInk`, `quietAt` and `inkAt`;
  - `QuietKeeps`, `QuietBlend`, `quietFactor`, `easedQuietFactor` and `transientQuietFactor`;
  - `inkBudget`, `fitKeep`, `budgetKeeps` and `scrollKept`.
- `meteors.ts`:
  - `Meteor.nearCopy`, `PlanOptions` and `PassOptions`;
  - `headGain` and `WAKE_GAIN`;
  - `Veiled`, `CLEAR_SKY`, `Fit` and `segmentTouches`;
  - `veiledFrom`, `planFlight` and `planMeteor`.
- `renderSky.ts`: the imports, `SkyFrame` (`meteorInk` added; `meteorScroll` is gone), `drawTrain` and `drawMeteor`.
- `sky.worker.ts`:
  - the imports, `LayoutMessage`, `pendingLayout` and `launchScrollY`;
  - `contrastLevels`, `sameRects` and `quietEasing`;
  - `frameMode`, `tick`, `updateMeteor` and `planLaunch`;
  - `quietBlend`, `applyLayout` and `settleQuiet`;
  - `frameAt`, `draw` and `rebuildHaze`;
  - the `layout` branch of the message handler.
- `mountSky.ts`: `NORMAL_FONT_WEIGHT`, `Shift`, `CopyReader`, `copyReader`, `quietRect`, `quietRects` and `mountSky`.
- Comment lines in `Introduction.tsx` and `SidePane.tsx`, and the `copyReader` line in AGENTS.md.

**2. Yes to both overlaps.**
- `frameAt`: keep its `contrast` local, `quiet: quietBlend(t)`, `meteorInk: contrast.meteorInk` and the doc line.
- `sameRects`: we may move it to `scene.ts` and export it, as long as it keeps comparing `headroom`. A headroom-only change (fonts loading, a token or font-weight change) must still reach the worker and update the budgets.

**3. Never-lease kinds may overlap a lease holder in time, on three conditions.**
- a) "No light inside any padded rect" holds for the kind's whole drawn footprint, glow included, on every frame. It is checked against the zones a transient answers to: `blend.to` and `blend.next`. It holds by construction if:
  - the kind draws through `transientQuietFactor` with keeps `{ quietKeep: 0, inkKeep: 0 }`, sampled at its center;
  - its drawn radius stays at or under `QUIET.padding` (32 px).

  The factor is then 0 inside every padded rect of `to` and `next`, and a center outside a padded rect sits more than 32 px from the copy.
- b) If it moves, it still takes `scrollKept` from its own launch scrollY. "Clear sky" means only clear of quiet copy: About and other unmarked copy scroll in, and the veil knows nothing about them (C1).
- c) Anything that adds light on quiet copy takes the lease. `INK_BUDGET` leaves room for the haze plus one transient, nothing more (`STAR_INK_PEAK` is 0).

Whether two transients at once look right is Joseph's call, not a veil rule. Its suggestion: keep the shooting star's peak as the only bright moment.

**4. A static comet: not with the hero fade as it stands.**
- The launch gate (`sceneAt().meteors`: scrolled ≤ `SCENE.heroMeteorMaxScroll`, 0.4 viewport heights) is a boolean.
- The hero fade (`SCENE.heroFadeFrom` 0.5 to `heroFadeTo` 1.3) runs well past the point where About copy is on screen.

A static comet may use its own scroll-driven fade instead of `scrollKept`, but only if that fade reaches 0 before any unmarked copy can come under its drawn footprint, checked at the shortest supported viewport (phones held sideways). Otherwise it takes `scrollKept`. Either way it draws through `transientQuietFactor`, and it takes the lease if it lights quiet copy.

**5. `QuietBlend.next?` is final interface.** The fix round added it after an audit finding: while a layout waits for the running ease (C2), the copy may already be at the waiting layout's position. `transientQuietFactor` now returns the minimum of:
- the eased factor;
- the factor of `to` while easing;
- the factor of `next` when present.

It is optional and additive.

**Other additive changes since the confirmation (nothing renamed):**
- A worker-private `quietEasing(t)`, used by `frameMode`, `settleQuiet`, the layout handler and `rebuildHaze`. `rebuildHaze` now waits until the zones stop easing, so a mid-ease stall can't show as a step.
- `planLaunch` sizes fresh radiants from the meteor field it is given (`meteorField.width`/`height`), not the worker globals.
- `mountSky.ts` has a private `Shift` interface and `NORMAL_FONT_WEIGHT`.
- `color.ts` exports `parseRgbColor`, `minimumContrast` and `lightHeadroom`.
- `SkyFrame.meteorInk`, which `drawMeteor` passes to `budgetKeeps` as `ink`.
- Doc-only changes:
  - the `STAR_INK_PEAK`, `METEOR_PASS` and `SCROLL_CANCEL` docs;
  - the `HAZE_POOLS` doc now points at `INK_BUDGET.hazeReserve`: re-measure that reserve before brightening any haze.

**P9: no conflict with the veil, with three asks.**
- `steer`, replacing `radiant` and `pickRadiant`, reaches into `planLaunch`. Keep C4's order:
  - try long flights on every candidate direction (the sticky one first, then fresh ones, up to `METEOR.radiantTries`; one on narrow screens) before any short flight;
  - keep the stickiness: a resize clears it, and a layout doesn't re-pick it.
- `PassOptions.timing` becoming a `fallback` flag is fine. Keep the timing values in config, and keep `planMeteor`'s `flights` option.
- The new end tests (`end.x > width − edgeMargin`, `end.y < METEOR.top`) change which paths fit, so crossing rates will move. After P9, rerun the crossing measurement and report the new numbers to Joseph next to the veil's. The edge-fade rule (D1) stays on every viewport.

## Committed: cf4d7b8 (2026-10-27)

The veil fix is on local master as `cf4d7b86b63ac6e3ea722ad23bda3f9492a98815` ("feat(sky): let shooting stars glide faintly behind hero copy"). Its parent is 246c0aa. Master was pushed at 2026-10-27 20:56 (-04:00), so `origin/master` is now `cf4d7b8`.
- Joseph kept every recommended setting. The launch-hold idea was not added.
- We verified the commit ourselves:
  - `git diff 246c0aa cf4d7b8` has the same patch-id (`cbe873c5`) as the archived working-tree diff `results/wt-final.diff`;
  - it changes 11 files, +577 −184;
  - the final numbers are the ones in "Landed in the working tree" below.
- Checkpoint V is reached: the veil session says we're clear to build on `cf4d7b8`. The planning branch merged `origin/master` at cf4d7b8 on 2026-10-28, so its `src/` is the baseline.

## Landed in the working tree (2026-10-27, not yet committed)

The veil fix is final in the main working tree (master, on HEAD 246c0aa), uncommitted. Joseph approves the commit, and the SHA comes when he commits.
- **Checks:**
  - its final Opus check confirmed the fix with no required changes;
  - lint and type-check exit 0;
  - next-devtools `get_errors` and `get_compilation_issues` are empty.
- **The diff:** the working tree is byte-identical to its confirmed diff (11 files, +577 −184).
- **The interface:** it matches "Confirmed veil interface" plus the additive items in "Answers to the planning session's questions". Nothing has changed since.

Checkpoint V still means the commit. Phases blocked on V stay blocked, but these numbers are final unless the commit differs.

**Final crossing numbers.** They replace the pre-D1 software-canvas figures in "What it means for PLAN.md" above (29/19/25% planner, 21/14/20% rendered, 24 to 36% edge dims), and any PLAN.md bar derived from them.

| Measure | 1440x900 | 1280x800 | 1920x1080 |
|---|---|---|---|
| `nearCopy` share of launches (planner, 4,000 launches each) | 60.6% | 56.1% | 35.1% |
| Visible behind copy, planner model: head on a text rect adding at least 0.12 white for 0.1 of the flight | 30.4% | 19.0% | 23.7% |
| The same at 0.04 white | 33.1% | 24.1% | 24.5% |
| Rendered on the GPU canvas the worker draws on (what visitors see): streaks, at least 87 of 726 for 0.1 s | 18.3% | 12.8% | 19.3% |
| Rendered on the GPU canvas: glimmers, at least 30 of 726 | 32.6% | 26.2% | 26.8% |

- Don't use the software-canvas figures (23.3/15.1/23.5%): that canvas renders about 2.4% brighter.
- **Live** (headless Chromium, the real worker bundle):
  - 1440x900: 37 of 240 streaks and 72 of 240 glimmers;
  - 1280x800: 26 of 180 streaks and 42 of 180 glimmers.
- **Cadence:** about one flight every 42 s at 1440x900, so roughly a streak every 4 minutes and a glimmer every 2.
- **Other sizes** (`nearCopy` share / planner pass at 0.12):
  - 1366x768: 68.3 / 35.9%
  - 1536x864@1.25: 48.0 / 25.5%
  - 2560x1440: 25.8 / 20.3%
  - 1280x720: 59.3 / 21.6%
  - 1024x768: 85.1 / 10.8%
  - 390x844 phone: 67.3 / 0% (no pass is possible by geometry)
- **Edge fades** under the worker's radiant policy: at most 1.6% on every desktop size and 3.7% on the phone. Live: 0 of 420.
- **Shorter fallbacks per launch:** 0.0 to 0.3% on desktop, 46.8% on the phone.

**Two corrections to its earlier statements.**
- D1's "a fallback flight that ends in open sky" is wrong for phones. Only about 3% of phone flights end in open sky. Most still dim smoothly near the copy (`nearCopy` 67%), without the bright edge fade.
- D2 in practice: when copy moves under a transient in flight, `transientQuietFactor` dims it in one frame, by up to 0.88 of white at 1440x900 and 0.54 at 1280x800. Every transient of ours will behave the same way. It was never seen live: in 440 visits, no layout message arrived after the reveal.

**A possible follow-up, Joseph's to decide; don't build on it yet:** hold launches while `quietEasing(t)` or a layout is waiting, so a launch never plans against stale zones.

**Harness for re-measuring after P9.** The original lives in the veil session's temporary scratchpad, so a copy is archived at `harness/veil-confirm-final-1.tar.gz`. See `harness/README.md` for what is in it and how to run it. It holds:
- the planner and worker batch, render and live scripts;
- its result summaries and the exact working-tree diff (`results/wt-final.diff`);
- the nine captured layouts (`code-logic/zones/*.json`) that I8 asked for.

## Phase merges (CP-2)

### CP-2, 2026-10-28: P1 to P6

P1 to P6 are merged into master by merge commits, at Joseph's request:

| PR | Phase | Merge commit |
|---|---|---|
| #16 | P1, render core | 71d8041 |
| #17 | P2, camera seam | 5827f6b |
| #18 | P3, frame pacing | 19d69ab |
| #19 | P5, pause control | 57b4df9 |
| #20 | P4, presence | b317b73 |
| #21 | P6, ambient drift | 725a239 |

Each phase followed the same process:
- Sonnet 5.5 implemented it strictly to `PLAN.md`;
- Opus 5.5 audited it, and the fixes were applied;
- independent scratch harnesses and headless-Chromium checks verified it.

Details are in each PR. This entry is the implementing session's report (`local_173b1826-7839-4b4e-a7c8-ad3fe4af9577`). The planning session checked the merges on GitHub, and checked that `git diff cf4d7b8 725a239` leaves `meteors.ts` and every veil function listed under "Unchanged" byte-identical.

**Files and functions changed:**
- **P1.**
  - config: `STAR_PHASES`.
  - skyAssets: `profile`, `pointSpread`, a phase-aware `paintSprite`, 4x4 blocks and `starSpriteIndex`.
  - `quietIndex.ts` (new): `ZONE_REACH`, `zoneReaches`, `QuietIndex` and `createQuietIndex`, wrapping the veil's `easedQuietFactor`.
  - scene: `sameRects`, moved from the worker with its body and doc unchanged (it still compares `headroom`).
  - renderSky:
    - `placePoint`, `corner` and `SkyFrame.snap`;
    - the quiet index, a frame-stamped `StarField`, the key guard and the `EDGE` doc;
    - the unread `easedQuietFactor` and `STAR_SHAPES` imports are dropped.
  - worker: imports `sameRects`, and `frameAt` sets `snap`.
- **P2.**
  - config: `DEPTH` and `CAMERA`. `LayerConfig.parallax` and the parallax values are removed; the veil's ink sentences in the `LAYERS` doc are kept.
  - catalog: `Star.q`, `nearness` and `LAYER_NEARNESS`.
  - `camera.ts` (new): the scroll part.
  - renderSky: `SkyFrame.offset`, the per-star offset and two-axis culling.
  - worker: `camera`, `offset`, `updateCamera`, `cameraMoving` and `skyMoved`, plus the init, motion and visible wiring. `frameAt`'s veil lines are unchanged.
- **P3.**
  - config: `PACING` and the `FRAME` doc.
  - `pacing.ts` (new).
  - worker:
    - removed: `frameMode`, `frameInterval`, `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames`;
    - added: `demandNow`, `requestFrame`, `onStalled`, the watchdog, strikes, the probe, `rafWorks`, the refresh estimate and the divisor;
    - the veil's `quietEasing(t)` sits in `fading`, and `tick` still calls `settleQuiet` before the frame decision.
  - `refreshDivisor` got a 1e-9 float slack, found by the independent H4.
- **P5.**
  - new: `skyPause.ts` and `SkyPauseButton.tsx`, with the icons `PauseSVG` and `PlaySVG`.
  - `Navbar`: the control, the stagger, `inert` and the header focus.
  - mountSky: `motion()` from the store, `syncMotion`, the worker-message switch and `destroy`. The rect measurement is unchanged.
  - protocol: the `SkyMotion` doc.
  - config: `FRAME.motionEase`.
  - pacing: the ease helpers.
  - worker: `motionLevel`.
  - docs: the AGENTS.md pause line, right after the `data-sky-quiet` line, and the README line.
- **P4.**
  - `presence.ts` (new).
  - protocol: `activity`.
  - mountSky: the activity listeners (`ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`).
  - worker: presence, the `activity` case, `twinkleTime` and `hiddenTotal`.
  - renderSky: `SkyFrame.twinkleTime`.
  - Hidden time no longer counts toward the 90 s idle clock (AC-32).
- **P6.**
  - config: `DRIFT`, the `PACING` drift caps, `SCENE.*.drift` and `ADAPT.thinFade`.
  - pacing: `driftCap` and `fadeOutAt`.
  - scene: `SceneLevels.drift`.
  - camera: the drift parts.
  - protocol: a doc.
  - renderSky: `thinFrom` and `thinLevel`.
  - worker: `gather`, `driftGate`, `narrowScreen`, `softwareFps` and the thin fade.
  - The README sky lines.
  - The veil's `settleQuiet` doc is left unchanged (8.4).

**Unchanged by P1 to P6 (the veil's):** `veiledFrom` and the veil's planner, the ink budgets, `scrollKept`, `transientQuietFactor`, `drawMeteor`, `quietBlend`, `applyLayout`, `settleQuiet`, the layout branch and `copyReader`.

**Pending, for Joseph on real devices:**
- AC-13, equal frame holds on a real display;
- P6's by-eye pass on a DPR-2 laptop, a DPR-1 monitor and a phone (`DRIFT.speed` 2.5 to 3);
- iPhone Safari tests (WebKit judder, Low Power Mode);
- budgets B-1 to B-7, and B-10's 30-minute heap check.

**In progress:** P7 (the pointer lean, under audit) and P8 (the transient core). After P9, the crossing measurement is rerun and reported to Joseph next to the veil's numbers.

### CP-2, 2026-10-28: P7

P7 (the pointer lean) is merged into master as #22 (merge eda7acc), with green checks.
- Sonnet 5.5 (max) implemented it to `PLAN.md`.
- Opus 5.5 (max) audited it, and a separate Sonnet 5.5 (max) fixer applied the audit's fixes in its own worktree.
- This entry is the implementing session's report. The planning session checked:
  - #22 is merged;
  - `meteors.ts` is unchanged since cf4d7b8;
  - every veil function listed under P1 to P6's "Unchanged" is byte-identical at eda7acc, as are `quietRects` and `copyReader`.

**Files and functions changed:**
- `config.ts`: `LEAN`, `SCENE.*.lean`, and the `PACING` and `ADAPT` docs naming the lean.
- `scene.ts`: `SceneLevels.lean`.
- `camera.ts`: the lean springs (`leanX`, `leanY`), `leanWanted`, and the lean terms of `stepCamera`, `cameraOffset` and `cameraSpeed`.
- `pacing.ts`: the docs of `driftCap`, `FrameState.cameraActive` and `FrameState.cameraCap` name the lean (doc only).
- `protocol.ts`: `pointer`, plus the lean in `SkyMotion`'s doc.
- `mountSky.ts`:
  - `LEAN_POINTER_QUERY`;
  - a passive `pointermove`, coalesced to one per frame, with its size guard and clamp;
  - `pointerout` and `blur` sending null;
  - `cancelAnimationFrame` in `destroy`.

  The rect measurement is unchanged.
- `sky.worker.ts`: the `pointer` case, `leanTarget(scene)`, and `leanWanted` in the frame state.

**Audit fix:** on a software canvas too slow for the drift (`softwareFps < PACING.minFps`), the lean stays still too. This was a gap in the plan, not a deviation from it.

**Veil code:** untouched.

### CP-2, 2026-10-28: P8

P8 (the transient core) is merged into master as #23 (merge c9e7841), and both Vercel checks pass.
- Sonnet 5.5 (max) implemented it to `PLAN.md`.
- Opus 5.5 (max) audited it, and a separate Sonnet 5.5 (max) fixer applied the fixes.
- This entry is the implementing session's report. The planning session checked:
  - #23 is merged;
  - `meteors.ts` is unchanged since cf4d7b8;
  - the veil's functions are byte-identical at c9e7841: `veiledFrom`, `planFlight`, `planMeteor`, `inkBudget`, `budgetKeeps`, `scrollKept`, `transientQuietFactor`, `easedQuietFactor`, `quietFactor`, `drawMeteor`, `drawTrain`, `quietBlend`, `quietEasing`, `applyLayout`, `settleQuiet`, `copyReader` and `quietRects`.

**Files and functions changed:**
- `transients.ts` (new):
  - types: `TransientKind`, `TransientEnvelope`/`Transient`, `VisitMemory`, `PlanContext` and `TransientSpec`;
  - the registry and `TRANSIENT_KINDS` (meteor only);
  - `TransientSchedule`, `createTransientSchedule`, `updateTransients`, `revealTransients` and `transientFade` (through the veil's `scrollKept`);
  - `leaseHeld`, `inkLeaseFree`, cancel and drop;
  - `forgetVisitSky`, `holdTransients`, `retryTransients`, `transientDemand` and `nextLaunchAt`.
- `meteorKind.ts` (new): `MeteorMemory`, `createMeteorMemory`, `planMeteorTransient` (which ports the veil's `planLaunch` in its order) and `METEOR_SPEC`.
- `random.ts`: `Random`.
- `config.ts`:
  - `TRANSIENTS` (`crossingCooldown` 0) takes `METEOR`'s scheduler keys and `FRAME.meteorScrollQuietMs` as `scrollQuiet`;
  - `SCENE.heroMeteorMaxScroll` becomes `heroLaunchMaxScroll`.
- `scene.ts`: `SceneLevels.meteors` becomes `launches`, keeping the veil's doc wording.
- `protocol.ts`: a doc.
- `pacing.ts`: the frame-demand docs.
- `renderSky.ts`: `drawTransient`, which hands the veil's `drawMeteor` its `fade`.
- `sky.worker.ts`:
  - `transients` replaces `meteor`, `launchScrollY`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt`;
  - the worker's `updateMeteor` and `planLaunch` are gone, ported into the scheduler and `meteorKind.ts` as `PLAN.md` planned;
  - `launchGate(now, scene)` takes `ink` from `contrastLevels()` and `narrow` from `narrowScreen`;
  - `launchesAllowed`, plus `retryTransients` in the layout branch;
  - `forgetVisitSky` runs on resize only;
  - `draw` uses `transientFade`;
  - `parallaxScroll` is retired (the camera reads `scrollY`).
- README: the sky lines.

**Unchanged (the veil's):** `veiledFrom`, `planMeteor` and `planFlight`, `drawMeteor`, `scrollKept`, `transientQuietFactor`, and the quiet ease code.

**Behavior:** launches match the old `updateMeteor`/`planLaunch` exactly. The evidence is an independent oracle harness over 100,000 sequences, plus 523,637 identical worker frames. The one visible change: a pause fades a flying meteor out over 0.2 s.

### CP-2, 2026-10-28: P9 and P10

P9 (meteor population and rates) is merged as #24 (merge 7afdaf9), and P10 (the fireball retune) right after it as #25 (merge 942ebcb). Both had green Vercel checks.
- Sonnet 5.5 (max) implemented them, and Opus 5.5 (max) audited them.
- Separate Sonnet 5.5 (max) fixers applied the fixes, set the measured cooldown and replayed P10.

This entry is the implementing session's report. The planning session checked, at 942ebcb against cf4d7b8:
- #24 and #25 are merged;
- byte-identical: `veiledFrom`, `segmentTouches`, `headGain`, `drawTrain`, the scene's quiet and ink functions (`inkBudget`, `budgetKeeps`, `fitKeep`, `scrollKept`, `quietFactor`, `easedQuietFactor`, `transientQuietFactor`), the worker's quiet ease (`quietBlend`, `quietEasing`, `applyLayout`, `settleQuiet`), `copyReader` and `quietRects`;
- `planFlight` and `planMeteor` change only as I2 allows:
  - the veil's lines are kept: the `veiledFrom` call, `CLEAR_SKY`, `dimFrom`, `nearCopy` as `dimFrom < 1`, and the `METEOR_PASS` behind-copy pass;
  - additions: the `clearOf` skip, `steer` in place of the `radiant` parameter, the `fallback` flag in place of `timing`, and the `fireball` option;
  - `planMeteor` keeps the `flights` option;
- `drawMeteor` changes only its wake-tint line, which now calls our `wakeTint` (I7).

**P9 files and functions:**
- `radiants.ts` (new): `skyWindow`, `pickVisitSky`, `visitSteer`, `radiantMotion`, `elevationAt` and `meteorRange`.
- `gaps.ts` (new): `nextGap`.
- `random.ts`: `gaussian`.
- `config.ts`:
  - added: `GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR.fallbackScale` and `TRANSIENTS.longVisit`;
  - `narrowLimit` is set to 6, and `crossingCooldown` to 40, the measured value;
  - the old radiant, angle, speed, duration, peak and gap keys are removed.
- `meteors.ts`:
  - `Course` and `Steer`;
  - the `steer` option in place of the `radiant` parameter, and `PassOptions.fallback` in place of `timing`;
  - `startArea`, the end guards, `clearOf` and `Meteor.wakeColor`;
  - the `planFlight`/`planMeteor` docs.
- `meteorKind.ts`: `MeteorMemory { sky }`, and `planMeteorTransient` steers. It keeps the old order and stickiness (the veil's first ask):
  - long flights on every steer before any short one;
  - a resize clears the sky, and a layout keeps it.
- `transients.ts` and the worker: `SkyField.pinned`.
- `mountSky.ts`: `copyReader`'s caveat names `clearOf`.
- `renderSky.ts`: the wake tint.
- README.

**P10 files and functions:**
- `config.ts`: `METEOR_KINDS`. Its fireball entry: chance 0.04, spacing 120, after 20, duration 1.8 to 2.5, desktop only. `METEOR.fireballChance` and `fireballDuration` are removed.
- `meteors.ts`: the `fireball` option replaces `PassOptions.fireballs`.
- `meteorKind.ts`: the decision step (`planMeteorLaunch`), with `MeteorMemory.lastFireballAt`.
- `transients.ts`: `PlanContext.sinceReveal`.

**The crossing measurement rerun (the veil's third ask).** The implementing session used the archived harness, adapted as `PLAN.md` 7.3 says. Rerun on cf4d7b8, the adapted pipeline reproduces the veil's published numbers exactly.

On P9, as P9 [veil commit], in percent:

| Size | `nearCopy` share | Pass at 0.12 | Pass at 0.04 | GPU streaks | GPU glimmers |
|---|---|---|---|---|---|
| 1440x900 | 21.8 [60.6] | 8.0 [30.4] | 11.7 [33.1] | 2.0 [18.3] | 12.2 [32.6] |
| 1280x800 | 35.4 [56.1] | 8.3 [19.0] | 14.1 [24.1] | 2.2 [12.8] | 16.0 [26.2] |
| 1920x1080 | 19.1 [35.1] | 11.1 [23.7] | 14.2 [24.5] | 6.8 [19.3] | 14.0 [26.8] |

Other sizes, as `nearCopy` share / pass at 0.12, in percent:

| Size | P9 | Veil commit |
|---|---|---|
| 1366x768 | 28.1 / 8.7 | 68.3 / 35.9 |
| 1536x864@1.25 | 21.0 / 9.3 | 48.0 / 25.5 |
| 2560x1440 | 17.5 / 12.2 | 25.8 / 20.3 |
| 1280x720 | 41.3 / 10.0 | 59.3 / 21.6 |
| 1024x768 | 20.5 / 0.1 | 85.1 / 10.8 |
| 390x844 | 56.9 / 0 | 67.3 / 0 |

Crossings a minute over a visit's first 2 minutes, at the 40 s cooldown:

| Size | P9 | Veil commit |
|---|---|---|
| 1440x900 | 0.438 | 0.954 |
| 1280x800 | 0.609 | 0.918 |
| 1920x1080 | 0.399 | 0.554 |
| 1366x768 | 0.538 | 1.112 |
| 1536x864 | 0.423 | 0.775 |
| 1280x720 | 0.661 | 0.992 |
| 1024x768 | 0.384 | 1.418 |
| 2560x1440 | 0.389 | 0.421 |
| 390x844 | 0.676 | 0.964 |

- **Choosing 40 s:** at 35 s, 2560x1440 goes over its bar by 0.0026, so the rule gives 40 s.
- **Over five minutes:** only 2560x1440 is above the veil commit's rate: 0.420 against 0.350.
- **With P10:** the rule still gives 40 s (0.396 at 2560x1440).
- **The veil's edge-fade rule** stays on every viewport.

### CP-2, 2026-10-28: P11, and the plan's end

P11 (satellites) is merged into master as #26 (merge ecfbf1a, head 8ba5694; commits bfc4cb3, 84deb09, 69f1b78 and 8ba5694). That completes P1 to P11. P12 and P13 are skipped, as the defaults say:
- **P12:** D4 ships none of the "could" kinds in v1.
- **P13:** D7 ships without the WebKit relay until device tests ask for it.

This entry is the implementing session's report. The planning session checked:
- #26 is merged;
- `meteors.ts`, `scene.ts` and `meteorKind.ts` are unchanged since P10's merge (942ebcb);
- `drawMeteor`, `drawTrain`, the worker's quiet ease (`quietBlend`, `quietEasing`, `applyLayout`, `settleQuiet`), `copyReader` and `quietRects` are byte-identical since P10;
- every changed line in `sky.worker.ts`, `mountSky.ts` and `protocol.ts` is a comment.

**Files and functions changed:**
- `satellites.ts` (new): `SatellitePass`, `SatelliteFrame`, `planSatellite`, `satelliteMoving`, `satelliteAt` and `SATELLITE_SPEC`. It imports only types from `transients.ts`.
- `config.ts`:
  - new: `SATELLITE`, and `CLEAR_SKY_KEEPS` (`{ 0, 0 }`);
  - the `TRANSIENTS` doc names satellites and says the cooldown was measured without them. `crossingCooldown` stays 40.
- `quietIndex.ts`: `segmentClear` is new (`quietAt` sampled every 8 px), and the `ZONE_REACH` doc gains a sentence.
- `transients.ts`:
  - `satellite` joins `TransientBodies`, `TRANSIENT_KINDS` and `SPECS`;
  - `heldBack` holds a kind that never takes the lease while `leaseHeld`;
  - `launchKind`'s `nearCopy` also needs `schedule.active.length === 0` (D12's two-way hold);
  - the docs of `PlanContext.nearCopy`, `TransientEnvelope.clearSky`, `TransientSpec.lease` and `transientFade` are updated.
- `renderSky.ts`: `drawSatellite` is new. It draws through `transientQuietFactor` with `CLEAR_SKY_KEEPS`, sampled at its center, and places with unsnapped `placePoint`. `drawTransient` gains a `satellite` case.
- `sky.worker.ts`, `mountSky.ts` and `protocol.ts`: comments only, naming satellites beside shooting stars.
- README: the sky line names `satellites.ts`.

**Answer 3's three conditions** (for a kind that never takes the lease) are met:
- No light inside a padded rect of `to` or `next`: it draws through `transientQuietFactor` with keeps 0, checked by H11-draw.
- The scroll cancel from its own launch: `transientFade`, so `scrollKept`.
- Never the lease: its `nearCopy` is always false.

**Crossings a minute at 40 s with satellites** (first 2 minutes):

| Size | Crossings a minute |
|---|---|
| 1440x900 | 0.429 |
| 1280x800 | 0.587 |
| 1920x1080 | 0.392 |
| 1366x768 | 0.516 |
| 1536x864 | 0.413 |
| 1280x720 | 0.641 |
| 1024x768 | 0.372 |
| 2560x1440 | 0.377 (bar 0.421) |
| 390x844 | 0.674 |

- The hold takes 2.7 to 4.8% of desktop crossings.
- With satellites, the rule would allow 35 s. It gives 40 s without them, and 40 s meets every bar, so it stays.

**Still pending, for Joseph on real devices:**
- AC-13 on a real display;
- P6's by-eye pass and the `DRIFT.speed` choice;
- iPhone Safari (WebKit judder, Low Power Mode), which also decides D7, the relay;
- budgets B-1 to B-7 and B-10's heap check.

## Log

- 2026-10-25 07:0x UTC: we sent our scope and questions.
- 2026-10-25 07:09 UTC: its reply arrived (the first part of this file).
- 2026-10-27: the local veil session's message arrived (the update above). We replied: the four interface items are welcome, and we asked for an options object on `planFlight`, the per-class text type and budgets exported from shared modules, and the final names in its confirmation message.
- 2026-10-27: it agreed to all three requests, and to the names `nearCopy`, `launchScrollY` and `QUIET_REACH`. These are now hard constraints on its plan:
  1. `planFlight` and `planMeteor` take an options object (for example `{ nearCopy }`), never a positional boolean.
  2. The scroll cancel is one kind-agnostic helper that takes the launch scrollY, the current scrollY and the fade state, so any transient kind reuses it.
  3. The per-rect text class lives on the rect type in `protocol.ts`, and the per-class ink budgets live in `config.ts` next to `METEOR_VEIL`.

  Final names and signatures, and the list of functions that changed shape, come with its confirmed plan.
- 2026-10-27: its plan was confirmed and implementation started in the main checkout (uncommitted). The final interface is recorded in "Confirmed veil interface" above. Next from it: a message when the implementation is in the working tree. After Joseph approves and commits it, this plan's implementer rebases onto it.
- 2026-10-27: we asked five questions and told it about P9. It answered the same day; the answers are in "Answers to the planning session's questions" above. Gate round 7 folds them into PLAN.md. Next from it: the "landed" message with the SHA, the touched-symbol list from `git diff`, the crossing numbers and the harness path.
- 2026-10-27: its "landed" message arrived: final in the working tree, uncommitted, with the final crossing numbers and the harness path (see "Landed in the working tree" above). We archived the harness and the captured layouts in `harness/`. Still to come: the SHA once Joseph commits; then checkpoint V runs.
- 2026-10-27: committed as cf4d7b8 on master and pushed (`origin/master` at 20:56), identical to the confirmed diff (patch-id checked), every recommended setting kept, no launch hold. `PLAN.md` is restructured to build on cf4d7b8 directly.
- 2026-10-28: CP-2 for P1 to P6 (PRs #16 to #21, master at 725a239), recorded from the implementing session's report under "Phase merges (CP-2)". The veil session is idle, and its work is committed.
- 2026-10-28: CP-2 for P7 (#22, master at eda7acc), recorded from the implementing session's report under "Phase merges (CP-2)".
- 2026-10-28: CP-2 for P8 (#23, master at c9e7841), recorded the same way.
- 2026-10-28: CP-2 for P9 and P10 (#24 and #25, master at 942ebcb), with the crossing rerun the veil asked for, reported to Joseph next to the veil's numbers.
- 2026-10-28: CP-2 for P11 (#26, master at ecfbf1a). P1 to P11 are done; P12 and P13 are skipped per D4 and D7.
