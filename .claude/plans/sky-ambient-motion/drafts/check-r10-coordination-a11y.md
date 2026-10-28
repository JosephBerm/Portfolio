# Check round 10: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 10 (a gate round). I confirm round 9's two fixes in this lens (CA9-1, CA9-2), look for regressions they introduced, check the post-commit restructure through this lens again, then sweep the rest of `PLAN.md`. I report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md`. Four sections there are authoritative: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree". The checks:
  - 8.4's rule for veil symbols ("use them, extend them through options, never rewrite them");
  - one ink lease;
  - `transientQuietFactor` and `scrollKept` for every transient that can come near copy;
  - 5 s or less per transient.

  The pre-commit items of the lens (hands-off symbols, blocked phases, the routes for the file-rule answers and for PF) are moot now that cf4d7b8 is the baseline. I checked that none of them is left behind.
- **Accessibility.**
  - WCAG 2.2.2, 2.3.1 and 2.3.3.
  - 1.4.3 through the per-rect budgets, and for copy the veil can't see (`COORDINATION.md`: C1, answer 3 b).
  - 2.4.11, 2.5.8 and 1.4.11 for the control.
  - Reduced motion, forced colors and `prefers-contrast`.
  - `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it), `REVIEW-LOG.md` (round 9 and the post-commit restructure) and my round 9 report.
  - `PLAN.md` (3,655 lines), word-diffed against the scratchpad's `PLAN.before-r9.md`.
  - The code at cf4d7b8, read only (`.claude/worktrees/sky-baseline-cf4d7b8`).
  - The archived layouts in `harness/veil-confirm-final-1.tar.gz` (`code-logic/zones/*.json`), already extracted in the scratchpad by round 8.
  - Round 9's live measurements of the end scene (`check-r9-a11y/farewell.mjs`).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only: I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or either checkout. My throwaway scripts are in the session scratchpad, `check-r10-a11y/`:
  - `hooks.mjs`, which loads cf4d7b8's TypeScript as it is;
  - `numeral.mjs`, `literal.mjs`, `literal2.mjs`, `footer.mjs` and `footer2.mjs`;
  - `r9diff.txt`.

## Method

- **Round 9's fixes.** I word-diffed `PLAN.before-r9.md` against `PLAN.md` and traced each change in this lens through every section the dispositions name.
- **Exercising the farewell fix on real data.** I loaded cf4d7b8's own `config.ts`, `scene.ts`, `meteors.ts` and `color.ts` in Node 24 through a resolve hook. The private `veiledFrom` and `segmentTouches` are ported line for line. On the archived 2560 × 1440 capture, I ran farewell launches at end-scene scrolls with the band taken two ways: as `PLAN.md` words it, and from the highest flow zone that reaches the screen.
  - The headrooms come from each rect's described color, size and weight, through cf4d7b8's `lightHeadroom` and `minimumContrast`.
  - The directions use round 9's P9-like mix (76% falling, 17% sideways, 7% climbing; 57% heading right).
  - The guards follow 6.10: both ends inside the edges, below `METEOR.top` and above `maxEndY`, and `clearOf` grown by `QUIET.feather`.
  - The aim follows `METEOR_PASS`: 40% of plain launches re-fit for a pass behind copy.
  - The Other Projects text boxes are round 9's live measurements, given in px above the page bottom.
- **New exposure checks.** The same rig checked two pieces of copy farewell meteors could reach that the veil can't fully see:
  - Contact's CSS-generated section number;
  - the footer's link, whose color changes on hover and focus.

  Separately, a geometric check covered satellites against About's header at the hero gate.
- **The restructure.** I grepped again for every pre-restructure marker and reopened the `file:line` references this lens cites on cf4d7b8.
- **The sweep.** I re-read sections 1 to 4, 5.1 and 5.2, 6.4, 6.6 to 6.13, 7.0 to 7.3, 8, 9.2, 11 and 12.

## Round 9 dispositions in this lens

| ID | Verdict |
|---|---|
| CA9-1 | The text landed in every place the disposition lists: 2.2's end row (`:98`), D4 (`:164`), T6 (`:303`), 5.1 (`:327`, `:333`), 6.12 (`:2754`), P12's files and step 1 (`:3317-3318`), 8.4 (`:3376`) and section 11 (`:3534`). But the rule that defines the band picks the wrong zone (CA10-1), and the hold that came with it misses the commonest no-room case (CA10-2). |
| CA9-2 | Holds. 6.10 (`:2596`) rewrites `copyReader`'s caveat to name the planner's `clearOf`. 5.1 (`:338`), P9's files (`:3238`), 8.4's `mountSky.ts` row (`:3390`) and CP-2 (`:3352`) follow. cf4d7b8 `mountSky.ts:122-124` is the parenthetical it replaces. My checks below show the rewritten caveat still holds after P12. |

**The restructure, in this lens.** No pre-restructure marker is left. The grep for PF, CP-0, CP-3 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file rule", "hands-off", "rebase", "after V", "from V", "until the veil", "checkpoint V", "integration branch" and "observed" finds only three things:
- section 1's note that the planning branch may be rebased;
- section 3's note on where D10 and D11 went;
- "8.5%" in 6.10, a percentage.

Nothing an implementer needs for coordination was lost: every item of the confirmed interface and the answers is still in sections 6 and 8 (see "Checked and holding").

## Findings

### CA10-1 (major): the farewell band's rule picks the hero's first line, so it keeps nothing clear

- **Sections.**
  - 6.12, the farewell row's planning cell (`:2754`);
  - P12: its files ("their spec in `meteorKind.ts` (with its `clearOf` band)") and step 1 (`:3317-3318`);
  - H7 and AC-20, as 6.12 extends them;
  - 6.10, `PlanOptions.clearOf`'s doc (`:2580`);
  - section 11, 1.4.3 (`:3534`).
- **Problem.**
  - **The rule.** 6.12 defines the guard as "`clearOf` adds the full width above the highest quiet zone in the page's flow (Contact's first line) less `ZONE_REACH`; starts come from the band below it".
  - **What the field holds.** The field a farewell spec plans in holds every flow root's rects, not just those on screen:
    - `mountSky` measures every `data-sky-quiet` flow root in document coordinates, whatever the scroll;
    - `screenQuietZones` moves all of them to screen coordinates without culling;
    - that is the field the worker plans in, and 6.9 keeps it from P9.
  - **So the zone is the hero's.** "The highest quiet zone in the page's flow" is the hero's greeting line, not Contact's first line. In the end scene it lies about 6,000 px above the screen. The band then covers nothing on screen, starts may come from anywhere, and `room(field)` is always true. Farewell meteors fly over Other Projects' heading and link exactly as CA9-1 found. The parenthetical "(Contact's first line)" names the intent, but the field carries no identity, so the rule as written is the only thing an implementer can compute.
  - **An "on screen" rule needs its empty case.** At 3840 × 2160 the gate opens at 620 px left, and Contact's first line sits about 540 px above the page bottom. So for the first 80 px of the gate, no flow zone reaches the screen while "My Projects" and the Projects text are in view. A rule that reads "no zone on screen" as "no band" fails there too.
  - **The check may not catch it.** 6.12 checks on "end-scene layouts P12 captures ... (the quiet rects and the unmarked text boxes above Contact)":
    - captured with the hero's rects, as the worker receives them, the check fails on the literal rule;
    - captured as the rects on screen at the launch scroll, it passes, while production, which has the hero's rects, fails.
- **Evidence.**
  - **Code at cf4d7b8.**
    - `mountSky.ts:231`: `const quiet = flowRoots.flatMap((root) => quietRects(root, window.scrollY, reader))`. `flowRoots` is every quiet root that isn't fixed (`:346-349`): the hero, Contact and the footer.
    - `scene.ts:60-69`: `screenQuietZones` returns `[...zones.map((zone) => pad(zone, scrollY)), ...pinned.map((zone) => pad(zone, 0))]`, with no viewport test.
    - `sky.worker.ts:226` builds the planning field from it.
  - **The archived layout.** In `2560x1440@1.json`, `settled.quiet` holds 25 rects:
    - the hero's, from document y 497.6 ("Hi, my name is") to 1,042;
    - Contact's, from 7,512.7 ("Contact");
    - the footer's, to 8,038.

    `documentHeight` is 8,053.
  - **The exposure** [computed, `check-r10-a11y/literal2.mjs`, method above]. At 2560 × 1440, with 0, 137, 275 and 412 px left to scroll:
    - the literal rule's band ends at screen y −6,187, −6,050, −5,912 and −5,775;
    - under it, 0.00, 1.68, 3.36 and 3.97% of farewell launches put the head's centre on Other Projects' heading or link, adding more than that text's headroom less the haze reserve. The limits are 0.377 for the 27 px semibold lightest-slate heading (3:1) and 0.303 for the 13 px green link (4.5:1), from `color.ts`'s `lightHeadroom`;
    - with the band taken from the highest flow zone that reaches the screen, the share is 0.00% at every scroll.
  - **4K.**
    - The end level reaches 0.9 at 0.287 H, which is 620 px at H 2,160 (`scene.ts:26-28`, `config.ts:168-169`).
    - Contact's first line sits 540 px above the page bottom in the archived capture (8,053 − 7,512.7). Contact's and the footer's classes have no breakpoint between 2560 and 3840 px wide: `components/styles.ts:7`, `ContactMe.tsx:12`, `AppFooter.tsx:18`, with clamps already at their maxima.
    - Round 9 measured "My Projects" at y 1,341-1,373 with 619 px left.
- **Fix.**
  - **6.12: define the edge.** The band's edge is the top of the highest in-flow zone that reaches the screen:
    - the in-flow zones are `field.quiet` without `field.pinned`, the same padded objects from P9 (6.9);
    - a zone reaches the screen when `zone.y + zone.height > 0`.
  - **6.12: define the empty case.** When no in-flow zone reaches the screen, the band covers the whole screen, so `room(field)` is false: a hold.
  - **The check's capture.** P12's capture holds every rect the worker receives at each launch scroll (the `layout` message's `quiet` and `pinned`, the hero's included) beside the unmarked boxes. Its 3840 × 2160 scrolls include the ones where no in-flow zone is on screen.
  - **The doc.** P12 extends `PlanOptions.clearOf`'s doc, which names only the side rails (6.10), with the farewell band, as 7.0 asks of a phase that ships a new use.
- **Why major, not blocking.** This is the same calibration as CA9-1: farewell meteors aren't v1's default (D4). But the rule decides what gets built. Built as written, it ships the C1 failure CA9-1 found, and whether the plan's own check catches it depends on how the layouts are captured.

### CA10-2 (minor): the farewell hold misses the case where no path can end above `maxEndY`

- **Sections.**
  - 6.12, the farewell row: "while that band has no start area the spec's `room(field)` is false: a hold (step 2.2), never a failed plan";
  - 6.9, step 2.3 (`:2214`) and `LaunchGate.field`'s doc (`:2137`);
  - D4 (`:164`).
- **Problem.**
  - **What `room(field)` tests.** It tests only for a start area. Farewell paths are planned "as the meteor kind plans", so they still end above `METEOR.maxEndY`, and the band keeps every path below the padded top of Contact's first line.
  - **Where that leaves no path.** Where that edge lies below `maxEndY` × height, a start area exists but no path fits. Every plan is null, made with `nearCopy` true once the cooldown is over, so each counts toward `maxFailedPlans`. After three, the kind waits for a new layout (`Infinity`).
  - **Scrolling doesn't bring one.** `mountSky` posts a layout only when the document-space rects change. So a visitor who rests in that range stops farewell meteors for the page view, which is exactly what the hold was added to prevent (CA9-1's skeptic: "its start area and its hold are required").
  - **The start band's lower edge is unstated** ("the band below it"). If it is read as ending at today's spawn rows (`spawnY` up to 0.5 H), the start band is empty at every gate scroll on 2560 × 1440, and the kind never flies there.
  - **Contrast is safe either way.** The cost is a could kind that stops or never shows on tall screens.
- **Evidence.**
  - **Where the edge lies below `maxEndY`** [computed]. Contact's first line sits 540 px above the page bottom on every archived desktop layout. The edge then lies below `maxEndY`:
    - from 169 px left to the 413 px gate at 2560 × 1440;
    - from 270 to 310 px at 1920 × 1080;
    - over the whole gate at 3840 × 2160 (edge 1,588 against 1,555 at 0 px left).
  - **How often plans fail** [computed, `numeral.mjs`]. At 2560 × 1440, with starts from the band to the screen bottom across `spawnX`, launch attempts that find no path:
    - 1.4% at 0 px left;
    - 47.1% at 137 px;
    - 100% at 275 and 412 px.
  - **Step 2.3:** "If the plan is null, `failedPlans[kind]++` ... after `maxFailedPlans` wait for a new layout (`Infinity`)".
  - **cf4d7b8 `mountSky.ts:233-236`:** a layout is posted only when `[documentHeight, quiet, pinned]` changes, and `quiet` is in document coordinates (`:231`).
- **Fix.**
  - **6.12: the hold.** `room(field)` is also false while the band's edge lies at or below `METEOR.maxEndY` × height.
  - **6.12: the start band.** It runs from that edge down to the screen bottom, inside `spawnX`.
  - **D4's farewell entry.** On tall screens they fly only near the very bottom (the last 169 px at 2560 × 1440) and never at 3840 × 2160. The user should decide D4 knowing that.
  - **6.9's `LaunchGate.field` doc.** It says the launch step also builds the field for a kind's `room`, not "only when it plans".

## Checked and holding (no finding)

- **The confirmed interface against cf4d7b8.**
  - The planner: `planMeteor`, `PlanOptions`, `PassOptions`, `planFlight` and `Meteor.nearCopy` (`meteors.ts:49-63`, `:191`, `:270`).
  - The drawing: `drawMeteor`'s `fade` (`renderSky.ts:204`).
  - The helpers: `scrollKept`, `transientQuietFactor` with `next`, `inkBudget` and `budgetKeeps` (`scene.ts:156-189`).
  - The constants: `INK_BUDGET` and `METEOR_VEIL` (`config.ts:335`, `:349`), `METEOR_PASS` and `SCROLL_CANCEL`, and `QUIET_REACH` (`:153`).
  - 8.3 and 8.4 state each one as committed; answers 1 to 5 and the three P9 asks are all in 8.4, D12, T3 and 6.12.
- **One lease, the veil's factors, the scroll cancel and 5 s.**
  - The lease: `leaseHeld` and `inkLeaseFree` (`:2191-2199`), shared by every kind, the comet's start rule and farewell meteors (the two scenes never meet).
  - Every kind draws through `transientQuietFactor` and fades through `transientFade`, which calls `scrollKept` (`:2187-2189`, `:2309-2322`, `:2744`, `:2754-2755`).
  - The 5 s rule: T1 and H10.
- **Copy the veil can't see, under farewell meteors with the band taken on screen** [computed]:
  - **Contact's section number.** The "0N." comes from `.section-header::before` (`globals.css:209-219`), on the numbered Contact section (`ContactMe.tsx:13`, `:16`; `styles.ts:9-10`). `quietRects` never measures it, since it walks text nodes and `a, button` boxes (`mountSky.ts:168-188`). It sits 5 to 42 px left of "Contact", inside that rect's padding and feather. Heads crossed it in at most 0.01% of farewell launches, adding at most 0.09 white against a budget of 0.20 (headroom 0.328) [`numeral.mjs`]. With the literal band it reached 0.04% above its headroom, one more reason for CA10-1's fix.
  - **The footer's link.** It is light slate, green on hover or focus (`globals.css:119-121`), so `copyReader`'s stale-headroom caveat applies to it. No lit head came within 72 px of it at 1280 × 720, 1440 × 900, 1920 × 1080 or 2560 × 1440 [`footer.mjs`, `footer2.mjs`]. So the caveat as P9 rewrites it (the rails, kept clear by `clearOf`) stays true after P12.
- **Satellites and About's header at the hero gate on tall screens.** A pass starts or ends just beyond a side and runs at most about 465 px at 2560 wide (2.5°/s × 38.7 px/° × 4.8 s) and 349 px at 1920 wide. About's left-aligned header starts at least 460 px in. So no pass reaches the only unmarked copy in the hero's flight region (6.11).
- **2.2.2, 2.3.1, 2.3.3.**
  - P5 lands before P4, P6 and P9 to P12 (7.0 `:2835`, P4 `:3064`, P6 `:3131`).
  - At most 3 onsets a second; the warmest tint is 0.42.
  - The glide and the lean hold under reduced motion and pause (C6, `leanWanted`).
  - The pause fade gets its frames under `motion: 'reduced'`, since `frameDemand` returns nothing only when not `live` (`:1047-1053`).
- **The control.**
  - A 40 × 40 target, the global 2 px dashed ring (`globals.css:80-83`) and 14.1:1 on `bg-navy/85`.
  - `inert` while the phone menu covers it (`Navbar.tsx:117`, `:127`), and the header shows on focus (`:79`).
  - Hidden under forced colors (`Background.module.css:27-31`).
  - `meteorInk` 0 under `prefers-contrast: more`, which farewell meteors inherit through the gate's `ink`.
  - `data-sky-quiet` stays on every root, and D1 (a) and (b) keep AGENTS.md's precondition.
- **Re-grounded references opened this round (cf4d7b8), all matching.**
  - `sky.worker.ts`: `:57-58`, `:163-165`, `:183`, `:212-238`, `:220-226`, `:227-231`.
  - `mountSky.ts`: `:122-124`, `:168-188`, `:214`, `:230-236`, `:346-349`.
  - `meteors.ts`: `:226-228`.
  - `scene.ts`: `:26-28`, `:60-69`.
  - `config.ts`: `:58-59`, `:73`, `:78-80`, `:168-171`, `:281-282`, `:335`, `:349`, `:360`, `:367`.
  - `renderSky.ts`: `:100`, `:204`.
  - `globals.css`: `:119-121`, `:209-219`.
  - Navbar and other files: `Navbar.tsx:79`, `:117`, `:127`; `SidePane.tsx:26`; `PortfolioFooterLink.tsx:9-10`; `not-found.tsx:16`.

## Summary

- **Round 9.**
  - CA9-2 holds.
  - CA9-1's text landed everywhere its disposition lists, and the restructure left nothing stale in this lens.
  - The interface, the one lease, the veil's factors, the scroll cancel, the 5 s rule and the control's criteria all hold.
- **CA10-1 (major).** The farewell band is defined from "the highest quiet zone in the page's flow". The field holds every flow root's rects (cf4d7b8 `mountSky.ts:231`, `scene.ts:60-69`), so that zone is the hero's greeting line, about 6,000 px above the screen in the end scene. As written, the guard keeps nothing clear: 1.7 to 4.0% of farewell launches at 2560 × 1440 put a head on Other Projects' text above its headroom, against 0% with the edge taken from the highest in-flow zone on screen. Fix:
  - state the on-screen rule and its empty case (a hold);
  - capture every rect for the check;
  - extend `clearOf`'s doc.
- **CA10-2 (minor).** `room(field)` misses the case where the band's edge lies below `maxEndY`. Plans then fail, and the kind stops for the page view: from 169 px left on 2560 × 1440, and always at 3840 × 2160. Make the hold cover it, state the start band, and tell the user in D4.
- **Verdict:** revise (one major).

## Verification

- **r10-coordination-a11y-CA10-1**: confirmed, major. The field a farewell spec plans in holds every flow root's rects: cf4d7b8 `mountSky.ts:231` measures the hero, Contact and the footer (`:348-349`) in document coordinates whatever the scroll, `screenQuietZones` (`scene.ts:60-69`) moves them all to the screen with no viewport test, `sky.worker.ts:226` plans in that, and PLAN.md keeps it (6.9 `:2332`, `SkyField` `:1998-2002`), while `SkyRect` carries no identity (`protocol.ts:19-30`). So "the highest quiet zone in the page's flow" computes to the hero's first line, and the parenthetical "(Contact's first line)" names a zone the written rule can't reach; nothing else in PLAN.md defines the edge (the 6.12 row is the only place). On my own extract of `harness/veil-confirm-final-1.tar.gz`, `2560x1440@1.json` holds 25 flow rects (hero 497.6 to 1,042.4, Contact from 7,512.7, footer to 8,037.8; `documentHeight` 8,053), so with the gate at 0.287 H = 413 px (`scene.ts:26-28`, `config.ts:168-169`) the literal band ends at screen y −6,187, −6,050, −5,912 and −5,775 at 0, 137, 275 and 412 px left, the start band is the whole screen and `room(field)` is always true. The reviewer's `literal2.mjs`, rerun on that extract (6,000 launches per scroll, same seed), gives 0.00, 1.68, 3.33 and 4.10% of farewell heads on Other Projects' heading or link above headroom less the haze reserve, and 0.00% with the edge from the highest in-flow zone on screen, matching its 20,000-launch figures within sampling. The fix keeps every veil rule (`clearOf`, `starts` and `room` are ours: I2, 6.12), and a capture holding every rect the worker receives matches the archived format (`settled.quiet` includes the hero). Two refinements for the reviser: the test `zone.y + zone.height > 0` alone also counts zones below the screen, so either add `zone.y < height` and keep the empty-case hold, or say that an edge at or below the screen bottom leaves no start area (a hold), since both give the hold the 4K case needs; and at 3840 × 2160 the padded zone, not the line, is what the rule sees, so the gap with no in-flow zone on screen is 48 px of scroll (620 to 572 px left), not 80. Major, not blocking: the kind is off the default path (D4: none in v1), 6.12, P12 and section 11 all state the intent (nothing above Contact), and a check run on full captured layouts would fail and expose it; but the written rule contradicts its own parenthetical and decides what gets built, the calibration CA9-1 got.
