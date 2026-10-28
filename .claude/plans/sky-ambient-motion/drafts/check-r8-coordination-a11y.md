# Check round 8: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 8 (a gate round). I confirm round 7's fixes in this lens, check the post-commit restructure through this lens (anything stale from the old before/after-V split, anything an implementer needs that it dropped, and every re-grounded `file:line` in the lens), then sweep the rest of `PLAN.md`. I report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md`: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree", which the task makes authoritative. That covers the names and signatures, 8.4's rule for veil symbols, one ink lease, `transientQuietFactor` and `scrollKept` for every transient that can come near copy, and 5 s per transient. The pre-commit items of the lens (hands-off symbols before V, blocked phases, one route for the file-rule answer and for PF) are moot now that cf4d7b8 is the baseline; I checked that nothing of them is left behind.
- **Accessibility.** WCAG 2.2.2, 2.3.1 and 2.3.3; 1.4.3 through the per-rect budgets; 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it), `REVIEW-LOG.md` (its "Post-commit restructure (cf4d7b8)" included) and my round 7 report.
  - `PLAN.md` as restructured (working copy on top of 6232c80: 3,664 lines, 58,038 words).
  - The code at cf4d7b8, read only, in `.claude/worktrees/sky-baseline-cf4d7b8`.
  - The nine captured layouts in `harness/veil-confirm-final-1.tar.gz` (only `meteor3/code-logic/zones/*.json`, extracted to the scratchpad and read as data).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only. I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or either checkout. Throwaway scripts are in the session scratchpad, `check-r8-a11y/` (`rails.mjs`, `rails2.mjs`, `railpath.mjs`, `headroom.mjs`).

## Method

- **Round 7's fixes.** I traced each disposition in this lens to its place in the restructured plan.
- **The restructure.** I grepped for every pre-restructure marker (V, PF, CP-0, CP-3 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file rule", "hands-off", "rebase", "observed", 246c0aa, "until the veil"), and checked that what the old 8.6 rows and the CP-0 message carried survives in 8.4, 6.1, 6.2 and the phases.
- **Re-grounding.** I opened every `file:line` the lens sections cite against cf4d7b8 (list under "Checked and holding").
- **The sweep.** I re-read sections 1, 2.2, 3, 4.3 and 4.4, 5.1 and 5.3, 6.1's worker side, 6.2's demand, 6.4, 6.6 to 6.13, all of 7 to 9.2, 11 and 12.
- **New exposure.** I checked which quiet copy the transients can reach after P9 against the archived layouts' quiet and pinned rects, and ran cf4d7b8's own path rules (`veiledFrom`, re-implemented from `meteors.ts:143-177` and `scene.ts`) on example paths. I recomputed contrast with `color.ts`'s math and `inkBudget`.

## Round 7 dispositions in this lens

| ID | Verdict | Where |
|---|---|---|
| CA7-1 | Holds, superseded by the restructure. With cf4d7b8 the baseline, answer 1's hands-off list no longer limits edits; 8.4's rule ("use them, extend them through options, never rewrite them") and its rows keep what of theirs stays. | 8.4's `frameMode`/`tick`/`quietEasing` row, 6.2 (`:1192`, `:1215`), the `frameAt` row and 6.1 (`:888`), the `mountSky.ts` row, the `renderSky.ts` row |
| CA7-2 | Holds. The answers are recorded as settled; answer 2's kept `frameAt` lines and the `sameRects` condition are in 8.4; P9 reports its crossing numbers to Joseph. CA8-3 below refines the comet's viewport. | 8.3, 8.4 (`:3391`, `:3392`), 6.4 (`:1495`), P9 (`:3256`), 8.1, CP-2 |
| CA7-3 | Holds. D12 with the default hold; T2, T3, 6.9 steps 2.2 and 2.3, 6.11's drawing bullet, P11, H7 and AC-24 test `to` and `next` from the frame a layout arrives; I9 answered. | `:170`, `:299-300`, `:2214-2215`, `:2748`, `:3298`, `:3303-3305`, `:2904`, `:3458`, `:3373` |
| CA7-4 | Holds, superseded: PF is gone, and P2 removes `LayerConfig.parallax`, the three values and the doc sentence itself. | 5.1 (`:319`), 6.1 (`:467`), P2 files (`:3004`) |
| CA7-5 | Holds. P12's comet files and 5.1's worker row name the comet's state, its pause time in the `motion` handler beside `cancelTransients`, `bodyShowing` and the hand-off in `draw`. | `:3316`, `:335` |

**The restructure, in this lens.** No pre-restructure marker is left: the grep finds only false positives (DPR-1, "8.5%", "Landed in the working tree", "hands-off" as in a hands-off trace), and section 3 says where D10 and D11 went. Nothing an implementer needs here was lost: answer 2's `frameAt` lines, `settleQuiet` before the frame decision, the untouched `mountSky` measurement, the AGENTS.md line order, the note to the veil session about farewell launches, and the three P9 asks are all present. Every cited line I opened matches cf4d7b8.

## Findings

### CA8-1 (major): P9's new directions let shooting stars reach the right side rail, which the plan says its guards prevent and the veil's `copyReader` relies on

- **Sections.** 6.10 (`METEOR`'s doc; "I2 also completes the end test"; "Everything else stays the veil session's"); H8; P9 (files and verification); 8.4 (the `mountSky.ts` row and the three P9 asks); 11 (1.4.3).
- **Problem.**
  - **At cf4d7b8 no flight reaches the rails.** Every path flies right to left at 18 to 42° from the spawn area (`spawnX` 0.45 to 0.985 of the width, starts no lower than 0.5 H). Falling, it moves away from the right rail, so it never comes within the rail's padded zone; the left rail is out of reach of the path lengths.
  - **P9 changes that.** It drops the angle filter and keeps the spawn area, which reaches 0.985 of the width, right beside the right rail. About 57% of launches then head right, and ends are bounded only by `edgeMargin`, `METEOR.top` and `maxEndY`. But the right rail's email link starts above `maxEndY` on 6 of the 8 archived desktop layouts. So a P9 path can end on it.
  - **The plan says the opposite.** Its new `METEOR` doc says: "Its layout guards (`top`, `edgeMargin`, `maxEndY`) keep every transient clear of the navbar, the edges and the side rails." `maxEndY`'s own doc ("clear of the fixed side rails in the bottom corners") stays as it is. Both become false after P9 for shooting stars. Satellites and the comet are unaffected: `segmentClear` and `zoneReaches` keep them off every quiet zone.
  - **Why it matters: the veil's documented precondition.** `copyReader`'s doc, a veil symbol in 8.4's `mountSky.ts` row, says the rails' links change color on hover or focus (light slate to green). A measurement keeps the headroom of the state it was measured in until the next one, "which is harmless only while no flight reaches the rails (METEOR.maxEndY)".
    - A measurement runs 1.5 s after every scroll stops. So a visitor who clicked or tabbed to the email link (it stays focused and green) and then scrolled leaves green's headroom on that rect until the next scroll: 0.328, budget 0.2.
    - The link's real color, light slate, has a headroom of 0.1875 and a budget of 0.146.
    - A P9 shooting star passing behind it then shows up to 0.2 white on light-slate 12 px text: 4.32:1 against 4.5:1, or 3.94:1 with the full haze reserve. With its own budget it stays at 5.28:1.
  - **The veil's own rules accept such a path, and the aim can seek it.** `METEOR_PASS`'s aim (40% of plain launches) can pick it, since the rail's budget (0.146) is above `METEOR_PASS.visible` (0.12).
  - **No check catches it.** H8 checks ends against the guards only. H9 and P9's report count crossings without separating the rails.
- **Evidence.**
  - **`PLAN.md`.**
    - `:2458`: the `METEOR` doc sentence above.
    - `:2613`: the end test gains only `end.x > width − METEOR.edgeMargin` and `end.y < METEOR.top`.
    - `:2620`: the guard values stay, "ends above 0.72 of the height".
    - `:2350`: "about 57% head right".
    - `:2458`: "`spawnX` and `spawnY` stay".
    - `:2905`: H8 checks "every path ends at least 12 px inside the sides, at or below `METEOR.top` and above `maxEndY`".
  - **Code at cf4d7b8.**
    - `mountSky.ts:122-124`: the `copyReader` caveat, quoted above.
    - `globals.css:119-121`: `a:hover, a:focus { color: var(--color-green) }`.
    - `page.tsx:36-43`: the right rail's `mailto` link, `text-xxs` (`globals.css:28`: 1.2rem, 12 px, so 4.5:1).
    - `config.ts:279-282`: `spawnX` [0.45, 0.985], `spawnY` [0, 0.5], and `maxEndY` 0.72 with its doc.
    - `mountSky.ts:300-308` and `:240-243`: a re-measure 1.5 s after each scroll stops (`ENTRANCE_SETTLE_MS`, `:52`).
    - `meteors.ts:213`: the 18 to 42°, right-to-left filter P9 removes.
  - **The archived layouts** (`harness/`, the pinned rects). The right rail's link box starts above `maxEndY` on six of them:

    | Layout | Link box top | `maxEndY` |
    |---|---|---|
    | 1440 × 900 | 614 | 648 |
    | 1536 × 864 | 578 | 622 |
    | 1280 × 800 | 514 | 576 |
    | 1366 × 768 and 1024 × 768 | 482 | 553 |
    | 1280 × 720 | 434 | 518 |

    The two exceptions are 1920 × 1080 (794 against 778) and 2560 × 1440. At 1440 × 900 the link box spans x 1382 to 1418.
  - **A path cf4d7b8's veil accepts** [computed, `railpath.mjs`: `veiledFrom` re-implemented from `meteors.ts:143-177`]:
    - At 1440 × 900, a path starts at (1200, 430), inside the spawn area, and heads 45° below horizontal to the right for 300 px.
    - It ends at (1412, 642), on the link box: 28 px inside the right edge, above `maxEndY` and below `METEOR.top`.
    - The veil's rules accept it (`dimFrom` 0.563, `glimpsed` 0.109 ≥ `dwell` 0.1).
    - At peak 0.85, the top of P9's `normal` range, it shows 0.146 white on the link under the link's own headroom and 0.2 under a stale green one.
  - **How often** [computed, `rails.mjs`, `rails2.mjs`]. In a crude model (uniform headings in P9's falling, sideways and climbing shares, lengths 160 to 520 px, P9's guards), guard-passing candidates touch the right rail's copy in 0.1 to 1.0% and its padded zone in 0.6 to 2.7% at 1024 to 1536 px wide. Late, dwelling passes, the kind `veiledFrom` accepts, make up as much as 0.33% (0.25, 0.33, 0.09, 0.22, 0.00 and 0.06% at 1024 × 768, 1280 × 720, 1280 × 800, 1366 × 768, 1440 × 900 and 1536 × 864; the example above shows 1440 × 900 isn't immune). With cf4d7b8's angles the copy share is 0.00%, and the padded share 0.02% at 1280 × 720 only.
  - **Contrast** [computed, `headroom.mjs`, with `color.ts`'s `lightHeadroom` and `scene.ts`'s `inkBudget`]. Light slate `#a8b2d1` on navy plus white:

    | White added | Contrast |
    |---|---|
    | 0.146 (its own budget) | 5.28:1 |
    | 0.171 (its budget plus the reserve) | 4.82:1 |
    | 0.200 (green's budget) | 4.32:1 |
    | 0.225 (green's budget plus the reserve) | 3.94:1 |
- **Fix.**
  - **Keep shooting stars off the pinned rails, as cf4d7b8 does.**
    - I2 (P9) adds an option of ours, for example `PlanOptions.clearOf?: readonly SkyRect[]` ("rects no path may come near").
    - The launch gate fills it with the padded pinned rects, `screenQuietZones([], scrollY, pinned)`.
    - `planFlight` rejects a candidate whose segment touches any of them grown by `QUIET.feather`, the test `nearCopy: false` already makes (`meteors.ts:226-228`).
    - Farewell meteors (P12) pass it too.
    - H8's launch parts add a check on the nine archived layouts: no accepted path within `ZONE_REACH` of a pinned zone.
    - The `METEOR` doc sentence then holds. `maxEndY`'s doc says what it still guards.
  - **If rail passes are wanted instead**, tell the veil session (CP-2 and the P9 report) that P9's rightward flights reach the right rail, so `copyReader`'s caveat no longer holds, and agree on its fix: re-measure on the rails' hover and focus, or measure links at the lower headroom of the two colors. Then drop "and the side rails" from both docs, and have P9's report separate rail passes from hero crossings.

### CA8-2 (minor): AC-26's "identical to P0's" can't hold from P5, because the control joins the navbar in the same screenshot

- **Sections.** 9.2 AC-26; P5's checklist; P6 and P7, which also list AC-26; P0 step 3.
- **Problem.**
  - AC-26 asks that, under reduced motion, the hero screenshots be "identical to P0's at scroll 0", re-baselined only "if P12's planet ships".
  - From P5 the hero screenshot also shows the control: the sky runs, so it renders, and under reduced motion it renders "Play sky animation". The nav row also reflows: the burger gets `ml-auto` and `#primary-nav` gets `md:ml-auto`.
  - So AC-26 fails by design at P5, P6 and P7, while the sky itself is unchanged.
- **Evidence.**
  - AC-26 (`:3460`): "identical to P0's at scroll 0 (re-baselined if P12's planet ships ...)", phases P2, P5, P6, P7.
  - P5's checklist (`:3129`) lists AC-26. P0 step 3 (`:2954`) takes "reduced-motion screenshots of the hero". The control is visible in that screenshot: PB4 (`:285`), D1 (`:161`), the placement (`:1907-1921`).
  - At reduced motion `skyPlayback()` is `'paused'` once the sky runs (`:1774-1777`).
- **Fix.** AC-26 compares the sky: the canvas, or the page with the header masked. Or P5 re-baselines the hero screenshot after its navbar change, as P12 does for the planet. Say which in AC-26 and P5's verification.

### CA8-3 (minor): the comet's own-fade alternative is checked at 852 × 393, where the plan's placement rule already excludes the comet, so the check is vacuous

- **Sections.** 6.12 (the comet row); D4; 8.3 I9.
- **Problem.**
  - Answer 4 allows a comet's own scroll fade only if it reaches 0 before unmarked copy can come under its footprint, "checked at the shortest supported viewport (phones held sideways)". The point is to test the worst case.
  - The plan pins the check to 852 × 393 and notes in the same sentence that the placement rule finds the comet no room there. So the check passes without testing anything.
  - The binding case is the shortest viewport where the comet does show (the placement rule finds room). By the rule's own terms that is a short desktop window or a larger phone held sideways:
    - About's header row at 0.4 H plus 24 px of scroll, less `ZONE_REACH`;
    - the box grown by the drift reach, 212.3 × 0.293 = 62.2 px, and the lean, 3.5 px.
- **Evidence.**
  - 6.12 (`:2759`): "must reach 0 before unmarked copy can come under its drawn footprint at 852 × 393 (a phone held sideways), where the placement rule below already finds it no room". D4 (`:164`) and I9 (`:3373`) say the same.
  - The comet is "desktop hero" (`:2759`), that is, any width over 640 px.
  - The room left for the box itself [computed from the row's terms, md and lg paddings, `components/styles.ts:7`, `globals.css:203`]:

    | Viewport | Room for the box |
    |---|---|
    | 852 × 393 | about 20 px |
    | 932 × 430 | about 43 px |
    | 1280 × 600 | about 165 px |
- **Fix.** Check the alternative's fade at the shortest viewport where the placement rule finds room, sweeping heights up from 393 (852 × 393 finds none). State that in 6.12, D4 and I9.

### CA8-4 (minor): 8.4's `SceneLevels` row stops at P8, but P12 replaces the field

- **Sections.** 8.4; 5.1's `scene.ts` row; P12.
- **Problem.**
  - 8.4 lists the veil symbols this plan uses or extends, and when. Its `SceneLevels.meteors` row gives P8's rename to `launches`, "its doc keeping the veil's wording".
  - With farewell meteors, P12 replaces `launches` with `launchScene` and rewrites the doc, since transients then also launch over the end bookend. 5.1 and P12's files say so; 8.4 doesn't.
- **Evidence.** 8.4 (`:3385`): "renamed `launches` ... | P8". 5.1 (`:321`): "`launches` becomes `launchScene` with farewell meteors (P12)". P12 (`:3316`): "`SceneLevels.launchScene` in place of `launches`, computed in `sceneAt`, with its doc".
- **Fix.** The row reads "renamed `launches` (P8), its doc keeping the veil's wording; `launchScene` with farewell meteors (P12), its doc naming the end bookend", with phases "P8, P12".

## Checked and holding (no finding)

- **The confirmed interface matches cf4d7b8.**
  - The helpers: `scrollKept(launchScrollY, scrollY, fade = 1)`, `transientQuietFactor(blend, x, y, keeps)` taking `next`, `budgetKeeps(white, quietKeep, ink = 1)` and `inkBudget(headroom)`.
  - The drawing: `drawMeteor(..., fade = 1)`.
  - The planner: `planMeteor(random, field, radiant, now, options = {})`, `PlanOptions { nearCopy?, flights?, ink? }`, private `planFlight` with `PassOptions { timing, fireballs }`, and `Meteor.nearCopy`.
  - The rest: `QUIET_REACH` (72), `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS`, `SCROLL_CANCEL`, `STAR_INK_PEAK` (0), `SkyRect.headroom`, `contrastLevels`, `quietEasing`, `applyLayout`, `settleQuiet`, `pendingLayout` and `copyReader`.
- **8.4's rule against the replaced functions.**
  - `demandNow` carries `quietEasing(t)` in `fading`, and `tick` keeps `settleQuiet` before the frame decision.
  - P8's retire step and `transientFade` equal cf4d7b8's `updateMeteor` test and `draw` fade. The `motion`, `visible` and `resize` handlers map one for one (`:507` cancel, `:514` and `:436` drop, `:435` forget).
  - `planMeteorTransient` keeps `planLaunch`'s order.
  - The three P9 asks are honored: the stickiness (a resize clears it, a layout doesn't), the timings in config with `flights` kept, and the crossing rerun reported to Joseph.
- **One lease, `transientQuietFactor` and `scrollKept` for every kind.**
  - The envelope's `nearCopy` is the lease.
  - Every kind draws through `transientQuietFactor`: meteors through `drawMeteor`'s `keptBy`, satellites with `CLEAR_SKY_KEEPS`, every part of the comet; the planet uses star keeps.
  - Every kind fades through `transientFade`, which calls `scrollKept`. The comet's box and pause fades go in as `fade`, never a second threshold rule.
- **D12 and answer 3.**
  - Satellites meet condition (a) by construction: a shape-2 sprite of radius 3 device px or less, sampled at its center, far under 32 px.
  - They take `scrollKept` from their own launch (condition b) and add no light on copy (condition c).
  - The point flash's glow sprite has a radius of about 9 CSS px (3σ at `METEOR_LOOK.glow` 3, `skyAssets.ts:89-91`).
  - The default hold runs both ways (6.9 steps 2.2 and 2.3), and the comet keeps it either way.
- **5 s per transient.** Fireball with train 4.9 s, satellite 4.8 s, a P9 fast flight with train 3.2 s, earthgrazer about 4 s, burst span at most 5 s, point flash at most 0.5 s. A cancel never extends a life (T1).
- **2.2.2.** P5 merges before P4, P6 and P9 to P12. A pause stops drift and twinkle over 0.3 s, fades transients over 0.2 s, holds the springs, and resumes in place. The gradient cards' rotation stays open question 8.
- **2.3.1.** At most 3 onsets a second (bursts staggered at least 0.35 s apart), each transient's changing area about 2,000 px² or less, and the warmest tint at R / (R + G + B) = 0.42 (0.37 for pale yellow).
- **2.3.3.** The glide and the lean hold under reduced motion and while paused (`follow`, `leanWanted`'s motion test).
- **The control.**
  - Contrast: 14.13:1 green on navy and 12.71:1 on light navy, recomputed; the 10% mint fill would be 1.28:1, recomputed.
  - Focus and size: the 2 px dashed ring with a 3 px offset (`globals.css:80-83`); a 40 × 40 target.
  - Behavior: `inert` while the phone menu covers it (`Navbar.tsx:127`, `:117`); the header shows on focus and stays while it holds `:focus-visible`; the name tracks the action, with no `aria-pressed`.
  - Preferences: `forced-colors:hidden`, with the sky hidden (`Background.module.css:27-31`).
- **`prefers-contrast: more`.** `meteorInk` 0, so `budgetKeeps` leaves nothing on copy and the planner aims at none; satellites use `CLEAR_SKY_KEEPS` anyway.
- **`data-sky-quiet`.** Kept in every placement. D1's (a) and (b) carry AGENTS.md's quiet-copy precondition and count the control as one rect of 64.
- **Farewell meteors over the end bookend.** The unmarked copy above Contact at that scroll (Other Projects' last card row) sits on opaque light-navy cards, so no unquiet text is lit. The footer's light-slate link lies below `maxEndY` there.
- **Re-grounded references in the lens, all matching cf4d7b8:**
  - **`sky.worker.ts`:** `:1-5`, `:17-22`, `:65-72`, `:92-98`, `:100-128`, `:111-113`, `:117`, `:135-152`, `:143-144`, `:154-209`, `:163-165`, `:167-170`, `:171-187`, `:183`, `:186`, `:190-193`, `:212-238`, `:222`, `:226`, `:227-231`, `:233`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:354-357`, `:361`, `:368-379`, `:373`, `:411`, `:435`, `:436`, `:446`, `:467-493`, `:475-479`, `:486`, `:487`, `:503-509`, `:507`, `:510-524`, `:513`, `:514`, `:519`, `:531`, `:533`, `:535`.
  - **`renderSky.ts`:** `:38`, `:39`, `:48`, `:64`, `:71-72`, `:93`, `:100`, `:107`, `:113`, `:120`, `:121-125`, `:124`, `:127`, `:155`, `:237`.
  - **`scene.ts`:** `:11-18`, `:20-23`, `:30`, `:36`.
  - **`config.ts`:** `:58-59`, `:78-80`, `:170`, `:171`, `:179`, `:222`, `:223-237`, `:231-232`, `:247-250`, `:253`, `:266`, `:286-290`, `:299`, `:305`, `:321`.
  - **`meteors.ts`:** `:39-40`, `:195-196`, `:203`, `:204-207`, `:206`, `:208-212`, `:213`, `:215-220`, `:216-217`, `:224`, `:226-228`, `:229`, `:236`.
  - **`mountSky.ts`:** `:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
  - **Other files:** `protocol.ts:32-38`; `Navbar.tsx:1`, `:14`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:73`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`; `globals.css:55`, `:80-83`, `:203`, `:273-278`; `Background.module.css:27-31`; `SidePane.tsx:26`; `components/styles.ts:7`; `README.md:75`, `:80`.

## Summary

- **Round 7.** All five fixes in this lens hold, CA7-1 and CA7-4 by being superseded by the restructure.
- **The restructure.** It left nothing stale in this lens and dropped nothing an implementer needs. Every re-grounded reference I opened matches cf4d7b8.
- **CA8-1 (major).** P9 keeps today's spawn area and sends most flights rightward. That lets shooting stars reach the right rail, whose link starts above `maxEndY` on six of the eight archived desktop layouts, and cf4d7b8's own veil rules accept such paths.
  - The plan's new `METEOR` doc claims the guards keep transients off the rails.
  - The veil's `copyReader` says its hover and focus caveat is harmless only while no flight reaches them. Under a stale green measurement a pass shows 0.2 white on light-slate text: 4.32:1.
  - The fix is a pinned-rect option in I2, with an H8 check, or a coordination note and doc corrections.
- **Minor.**
  - CA8-2: AC-26's P0 identity can't survive P5's navbar control.
  - CA8-3: the comet's own-fade check sits at a viewport where it can't show.
  - CA8-4: 8.4's `SceneLevels` row misses P12.
- **Verdict:** revise (one major).

## Verification

Skeptic pass, round 8: CA8-1, the one finding rated blocking or major, re-checked against `PLAN.md` (working copy, 3,664 lines), cf4d7b8 in `.claude/worktrees/sky-baseline-cf4d7b8`, `COORDINATION.md` and the archived layouts in `harness/`. Throwaway scripts are in the session scratchpad, `skeptic-r8-ca/` (`railcheck.mts`, `railsim.mts`, `contrast.mjs`, run on a scratch copy of cf4d7b8's `src/lib/sky` with `veiledFrom` exported).

- **CA8-1: confirmed, major.** Every cited line holds (`PLAN.md:2350`, `:2458`, `:2613`, `:2620`, `:2905`; cf4d7b8 `mountSky.ts:122-124`, `:240-243`, `:301-308`, `globals.css:28`, `:119-121`, `page.tsx:36-43`, `SidePane.tsx:28` (light slate), `config.ts:279-282`, `meteors.ts:213`, `:226-228`), the right rail's link box starts above `maxEndY` on 6 of the 8 desktop captures, and the contrast figures recompute exactly (headroom 0.1875 and budget 0.146 for light slate, 0.328 and 0.2 for green; 5.28, 4.32 and 3.94:1). With cf4d7b8's own `veiledFrom`, `transientQuietFactor` and `budgetKeeps` and a P9 steer built from 6.10 (R2 §10's window, range-dimmed peaks), the head reaches the right rail's copy in 0.13 to 0.87% of planned launches at 1024 × 768, 1280 × 720, 1280 × 800 and 1366 × 768 (0.03% at 1440 × 900 and 1536 × 864, none at 1920 × 1080; cf4d7b8's own planner 0.00% on all seven), aimed passes among them; under a stale green headroom, 0.05 to 0.52% of launches put 0.19 white or more on the 12 px light-slate link (under 4.5:1), and none do under its own headroom. One correction to the evidence: the 1440 × 900 example needs peak 0.85, but `METEOR_BRIGHTNESS`'s range factor caps a start at y 430 at 0.51 (the 0.6 floor), where the veil's edge-fade rule rejects that path (glimpsed 0.094 < `dwell`); a P9-consistent case is 1280 × 720, start (1195, 140), 80° below horizontal to the right, 384 px, peak 0.66: accepted (`dimFrom` 0.563, `behind` 0.125, so the aim can pick it) and 0.2 white on the link under a stale headroom (4.32:1). The veil session's "no conflict" answer on P9 rests on the premise its `copyReader` comment names (`METEOR.maxEndY`), which the captures disprove for rightward flights. Major rather than blocking: the contrast dip needs a hover or focus measurement left stale plus a rare path, while what is certain is a contradiction an implementer builds from (the new `METEOR` doc and `maxEndY`'s doc say the guards keep the rails clear; P9's spawn area and end test don't) and a missing step (no guard, no H8 or H9 check, no note to the veil session). The fix fits `COORDINATION.md` and 8.4 (an option of ours on `PlanOptions`, `veiledFrom` untouched), as does its coordination alternative.

Overall: not a pass (one confirmed major).
