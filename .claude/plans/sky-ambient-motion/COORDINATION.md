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
