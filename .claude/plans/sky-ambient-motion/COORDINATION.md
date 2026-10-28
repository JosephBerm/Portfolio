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
