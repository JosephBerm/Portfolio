# Check round 9: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 9 (a gate round). I confirm round 8's four fixes in this lens (CA8-1 to CA8-4), look for regressions they introduced, check the post-commit restructure through this lens again, then sweep the rest of `PLAN.md`. I report real problems only.
- **Coordination.** `PLAN.md` against `COORDINATION.md`: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and "Landed in the working tree", which are authoritative. That covers 8.4's rule for veil symbols ("use them, extend them through options, never rewrite them"), one ink lease, `transientQuietFactor` and `scrollKept` for every transient that can come near copy, and 5 s per transient. The pre-commit items of the lens (hands-off symbols before the veil commit, blocked phases, one route for the file-rule answer and for PF) are moot now that cf4d7b8 is the baseline; I checked that nothing of them is left behind.
- **Accessibility.** WCAG 2.2.2, 2.3.1 and 2.3.3; 1.4.3 through the per-rect budgets, and for unmarked copy the veil knows nothing about (`COORDINATION.md`, C1); 2.4.11, 2.5.8 and 1.4.11 for the control; reduced motion, forced colors and `prefers-contrast`; `data-sky-quiet` kept.
- **Inputs.**
  - The plan folder: `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, `COORDINATION.md` (all of it), `REVIEW-LOG.md` (round 8 and the post-commit restructure) and my round 8 report.
  - `PLAN.md` as revised by round 8 (3,653 lines), and the scratchpad's `PLAN.before-r8.md`, diffed against it to see exactly what round 8 changed.
  - The code at cf4d7b8, read only, in `.claude/worktrees/sky-baseline-cf4d7b8`.
  - The nine archived layouts (`harness/veil-confirm-final-1.tar.gz`, already extracted in the scratchpad by round 8, read as data).
  - The live home page (https://www.josephbermudez.com) for the layout below the hero, which cf4d7b8 doesn't touch (method below).
- **Outputs.** This file and the structured result.
- **Limits.** Planning only. I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md` or either checkout. Throwaway scripts are in the session scratchpad, `check-r9-a11y/` (`farewell.mjs`, `farewell1200.mjs`, `abouthero.mjs`, `r8diff.txt`).

## Method

- **Round 8's fixes.** I word-diffed `PLAN.before-r8.md` against `PLAN.md` and traced each change in this lens: `clearOf` and `SkyField.pinned` through 5.1, 6.9, 6.10, 6.12, H8, P9, 8.3, 8.4 and section 11; AC-26 and P5; 6.12, D4 and I9 for the comet; 8.4's `SceneLevels` row.
- **Regressions.** I checked what `clearOf` does to the veil's own mechanisms: the aim (`METEOR_PASS`), `field.quiet`, the padded pinned zones, the left rail, and every other quiet link whose color changes on hover or focus (the `copyReader` caveat, `mountSky.ts:122-124`).
- **The restructure.** I grepped again for every pre-restructure marker and reopened the `file:line` references this lens cites against cf4d7b8 (list under "Checked and holding").
- **The sweep.** I re-read sections 1 to 4, 5.1 to 5.3, 6.1's worker side, 6.2's demand, 6.4, 6.6 to 6.13, 7.0 to 7.3, 8, 9.2, 11 and 12.
- **New exposure: where transients launch versus unmarked copy.** The veil only protects `data-sky-quiet` copy. So for every launch scene the plan allows, I measured which unmarked text lies inside the flight region (below `METEOR.top`, above `maxEndY`), and for the scene that showed some, I simulated paths.
  - **Layout.** The archived captures hold only quiet rects, so I measured the live page with Playwright's Chromium (analytics requests blocked, reduced motion emulated so entrances settle, read-only DOM inspection). cf4d7b8 changes nothing below the hero: `git diff --stat 246c0aa cf4d7b8` touches only the sky files, comments in `Introduction.tsx` and `SidePane.tsx`, and `AGENTS.md`. The live page's Other Projects text matches cf4d7b8's `portfolioInformation.ts:155-164`, and its Contact header sits 20 px higher above the page bottom than in the archived captures, which changes none of the conclusions below.
  - **Paths.** A crude Monte Carlo of P9-like paths (76% falling, 17% sideways, 7% climbing, 57% heading right), with the plan's guards and `clearOf`, and cf4d7b8's light curve and drag (`meteors.ts:280-297`).

## Round 8 dispositions in this lens

| ID | Verdict | Where |
|---|---|---|
| CA8-1 | Holds. `PlanOptions.clearOf` (`:2579-2580`) is tested in `fit` with the `nearCopy: false` test (`:2608`). `SkyField.pinned` (`:1999-2002`) carries the padded rails from `launchGate` (`:2331`). The meteor kind (`:2100`) and farewell meteors (`:2753`) pass it. The `METEOR` and `maxEndY` docs say what each guard keeps clear (`:2452`, `:2456`). H8 checks the nine layouts (`:2900`), and P9's files and step 2 (`:3235-3236`, `:3241`), I2 (`:3359`), 8.4 (`:3374`, `:3380`) and section 11 (`:3532`) follow. One residue in a veil comment: CA9-2. | see "Checked and holding" for the exercise |
| CA8-2 | Holds. AC-26 masks the navbar from P5 on (`:3453`), and P5's preferences bullet says so (`:3122`). | |
| CA8-3 | Holds. 6.12 sweeps heights up from 393 px (`:2754`), D4 (`:164`) and I9 (`:3366`) say "the shortest screen where it can show". | |
| CA8-4 | Holds. 8.4's row reads "P8, P12" with `launchScene` (`:3378`), matching 5.1 (`:321`) and P12 (`:3315`). | |

**The restructure, in this lens.** No pre-restructure marker is left. The grep for PF, CP-0, CP-3 to CP-5, 8.5 to 8.7, D10, D11, R-1, R-2, "file rule", "hands-off", "rebase", "observed", "after V", "from V" and "until the veil" finds only:
- section 1's note that the planning branch may be rebased;
- section 3's note on where D10 and D11 went;
- 8.1's parent SHA;
- "hands-off" meaning no input.

## Findings

### CA9-1 (major): farewell meteors launch where unmarked copy is on screen on tall screens, and nothing keeps them off it

- **Sections.** 6.12 (the farewell meteors row); D4; T6; 2.2 (the reading and end-bookend rows); P12; H7 and AC-20 (the farewell clauses); 11 (1.4.3).
- **Problem.**
  - **The plan widens the launch gate.** Farewell meteors launch over the end bookend once its level reaches 0.9, planned "under the full veil, the lease and `clearOf`". The only copy that planning knows is the quiet copy: Contact, the footer and the rails.
  - **The veil doesn't protect unmarked copy.** `COORDINATION.md` says so twice: unquiet copy scrolling under a meteor head is "a verified bug ... down to about 1:1 contrast" (C1), and "'Clear sky' means only clear of quiet copy ... the veil knows nothing about" About and other unmarked copy (answer 3 b). For the hero, cf4d7b8's geometry keeps unmarked copy out of the flight region, and the plan's comet row guards against it explicitly (answer 4). Nothing does for the end bookend.
  - **On tall screens the end bookend shows unmarked copy inside the flight region.** It sits in the middle of the start area, on bare sky:
    - Other Projects' "My Projects" heading (lightest slate, 27 px semibold);
    - its "view more on GitHub" link (green, 13 px);
    - at 4K, the Projects section's titles and tech lists too.
  - **The plan contradicts itself.** 2.2 promises "no transients" over reading copy (`:97`), and section 11's 1.4.3 row covers reading copy for stars only.
  - **Nothing would catch it.** H7, AC-20 and the farewell kind's checks never look at unmarked copy, and the archived layouts are hero captures.
- **Evidence.**
  - **`PLAN.md`.**
    - 6.12 (`:2753`): "Up to 2 meteors a visit over the end bookend, once its level is at least 0.9 ... Full veil (Contact and the footer are quiet copy) ... planned by `planMeteor` under the full veil, the lease and `clearOf`".
    - D4 (`:164`) lists farewell meteors among the first candidates after v1. T6 (`:303`) and 2.2 (`:98`) describe the gate.
    - 2.2 (`:97`): reading has "no transients, as today".
    - Section 11 (`:3532`): reading copy has no quiet rects, and "stars sit behind it".
  - **Code at cf4d7b8.**
    - `scene.ts:26-28` with `config.ts:168-169`: the end level is smoothstep(0.85, 0.15, remaining), so it reaches 0.9 when no more than 0.287 viewport heights are left to scroll (413 px at H = 1,440).
    - `planMeteor` samples starts from `METEOR.spawnX` 0.45 to 0.985 and `spawnY` 0 to 0.5, each y at least `top` (`config.ts:279-284`, `meteors.ts:204-207`). Ends lie above `maxEndY` 0.72.
    - `OtherProjects.tsx:34-46`: the heading and the link, under no `data-sky-quiet` root. Only `Introduction.tsx:14`, `ContactMe.tsx:11`, `AppFooter.tsx:13` and `SidePane.tsx:23` carry it.
    - Its card is opaque light navy (`globals.css:253`), so only the text outside the card is exposed.
  - **The layout in the end scene** [measured, live page, method above]. Rows give the text boxes' screen y; x is the boxes' range:

    | Viewport | Left to scroll | "My Projects" | "view more on GitHub" | x | Start area x |
    |---|---|---|---|---|---|
    | 2560 × 1440 | 0 px | 2-34 | 52-65 (above `METEOR.top`) | 1199-1351 | 1152-2522 |
    | 2560 × 1440 | 216 px | 218-250 | 268-281 | 1199-1351 | 1152-2522 |
    | 2560 × 1440 | 413 px (level 0.9) | 415-447 | 465-478 | 1199-1351 | 1152-2522 |
    | 3840 × 2160 | 0 to 619 px | 722-754 to 1341-1373 | 772-785 to 1391-1404 | 1839-1991 | 1728-3782 |
    | 1920 × 1200 | 344 px (level 0.9) | 106-138 | 156-169 | 879-1031 | 864-1891 |

    - At 3840 × 2160, the Projects section's text also lies in the flight region at every resting position, for example "Full Self-Driving (FSD)" (lightest slate) and light-slate tech lists at y 354-367 and 678-691.
    - At 1920 × 1080 and every smaller archived size, nothing unmarked reaches the flight region: the link peaks at y 2-15.
  - **How often** [computed, `check-r9-a11y/farewell.mjs`, `farewell1200.mjs`, crude model]. Share of accepted farewell paths whose head, at 0.3 of its peak light or more, comes within its 9 px glow of the heading or the link:
    - 2560 × 1440: 2.0, 4.4, 5.4 and 5.6% with 72, 144, 288 and 413 px left to scroll (0% at 0 px);
    - 3840 × 2160: 2.5% at 0 px, falling to 0.2% at 619 px;
    - 1920 × 1200: 5.7% at 344 px.
  - **Contrast.**
    - The budgets `COORDINATION.md` lists put the white each text can take before falling below its minimum at about 0.33 for green text and about 0.40 for lightest-slate large text (the name).
    - A head at 0.3 of a 0.6 peak already adds 0.3 × 0.6 × `headGain()` (2.52, `meteors.ts:84-86`) = 0.45 of white at its center.
    - At its peak it saturates: about 1:1, as C1 describes.
  - **The hero gate, for comparison** [computed, `abouthero.mjs`].
    - At the hero's 0.4 H gate, About's header sits above `maxEndY` only on screens 1,080 px and taller (776 against 778 px at 1920 × 1080, 992 against 1,037 at 2560 × 1440).
    - Bright heads reach it in at most 0.015% of launches at that scroll, for P9-like and cf4d7b8-like paths alike.
    - So the gap is the farewell gate's, which the plan adds.
- **Fix.**
  - **Keep farewell paths below the unmarked copy.** For example, the farewell spec passes, beside the rails, one more `clearOf` zone: the full width above the highest quiet zone on screen (at the end bookend, Contact's first line), less `ZONE_REACH`. Farewell meteors then fly only around Contact and the footer, which is what "over the end bookend" means.
    - Give the kind a start area inside that band.
    - Treat "no room at this scroll" as a hold (6.9 step 2.2), not a failed plan, so a visitor resting high on a tall screen doesn't stop the kind for the page view after `maxFailedPlans`.
  - **Or mark the copy quiet.** Mark Other Projects' heading and link quiet, and at 4K the Projects text in view. That changes the reading scene's stars (D2) and the 64-rect count, so it's the costlier route.
  - **Add a check.** P12 captures the end-scene layout at 2560 × 1440 and 3840 × 2160 (the quiet rects at the launch scroll, and the unmarked text boxes above Contact). The farewell kind's harness (with H7) then checks that no accepted farewell path comes within `ZONE_REACH` of an unmarked box, and AC-20's farewell clause says so.
  - **Say it where it is promised.**
    - D4 and 2.2's end-bookend row say farewell meteors stay around Contact and the footer.
    - 6.12's note to the veil session names the unmarked copy in the end scene, since it rests on C1.
- **Why major, not blocking.** Farewell meteors are a "could" kind and not v1's default. But 6.12 and P12 specify them fully, and D4 lists them as an early candidate. Built as written, they put meteor heads behind unmarked text at an archived layout (2560 × 1440) and at 4K, and no step or check in the plan would catch it.

### CA9-2 (minor): `copyReader`'s doc still names `METEOR.maxEndY` as the rail guard after P9 gives that job to `clearOf`

- **Sections.** 6.10 (`maxEndY`'s new doc, "And it keeps paths off the rails"); 8.4 (the `mountSky.ts` row); P9 (files); CP-2.
- **Problem.**
  - cf4d7b8's `copyReader` doc says a link measured while hovered or focused keeps that headroom until the next measurement, "which is harmless only while no flight reaches the rails (METEOR.maxEndY)".
  - After P9, `maxEndY` no longer keeps flights off the rails. The plan's own `maxEndY` doc and 6.10's paragraph hand that job to `planMeteor`'s `clearOf`.
  - 8.4 still leaves the `mountSky.ts` measurement "unchanged", and P9's files don't touch `mountSky.ts`. So the veil's precondition would point at the wrong guard, and anyone who tunes or drops `clearOf` would read that `maxEndY` covers the rails, bringing back CA8-1's case.
  - 7.0 asks that "a committed doc describes what its phase ships".
- **Evidence.**
  - cf4d7b8 `mountSky.ts:122-124`.
  - `PLAN.md` `:2452` ("planMeteor's `clearOf` keeps them off the side rails' copy"), `:2608`, `:3388` ("the measurement unchanged"), P9's files (`:3226-3238`, no `mountSky.ts`), and 7.0 (`:2824`).
- **Fix.**
  - P9 edits that parenthetical, a doc-only change to a veil symbol, to name the real guard, for example "(the planner's clearOf, which the worker fills with the rails)".
  - 8.4's `mountSky.ts` row adds "its doc's rail guard renamed (P9)" and P9 to its phases.
  - P9's CP-2 note tells the veil session.

## Checked and holding (no finding)

- **CA8-1's fix, exercised.**
  - **The zones.** The pinned zones are padded and in screen coordinates (`screenQuietZones(zones, scrollY, pinned)` pads them with offset 0, `scene.ts:60-69`). `clearOf` plus the feather keeps every path 72 px from the rails' text, which keeps the head and its 9 px glow off it (`skyAssets.ts:89-91`).
  - **The aim.** It goes through the same `fit` (`meteors.ts:256-261`), so `METEOR_PASS` can't seek a rail.
  - **Both rails.** Both are pinned roots (`mountSky.ts:346-349`).
  - **Other quiet links whose color flips.** None stays in reach, so the stale-headroom caveat is confined to the rails, which `clearOf` covers:
    - The footer's light-slate link, also green on hover or focus (`globals.css:119-121`), starts 75 px above the page bottom (archived captures). The head stays above `maxEndY` and the ink ramps over 32 px, so no flight's light reaches it on any screen taller than about 384 px, 852 × 393 included.
    - Contact's and the hero's buttons stay green on hover (`globals.css:154-170`), and the hero's link is green at rest (`Introduction.tsx:37`, `:46-47`).
- **The confirmed interface matches cf4d7b8.**
  - The helpers: `scrollKept`, `transientQuietFactor` with `next`, `budgetKeeps` and `inkBudget` (`scene.ts:156-189`).
  - The planner: `PlanOptions`, `PassOptions`, `planFlight` and `planMeteor` (`meteors.ts:49-63`, `:191`, `:270`).
  - The drawing: `drawMeteor`'s `fade`.
  - The constants: `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS` and `SCROLL_CANCEL` (`config.ts:335`, `:349`, `:360`, `:367`), and `QUIET_REACH` (`:153`).
- **One lease, the veil's factors, the scroll cancel and 5 s.**
  - The lease: `inkLeaseFree` (`:2190-2193`).
  - Every kind: it draws through `transientQuietFactor` and fades through `transientFade`, which calls `scrollKept` (`:2186-2188`). The comet's box and pause fades go in as `fade`.
  - The 5 s rule: T1 and H10.
  - The pause fade gets its frames under reduced motion, because `frameDemand` returns `NO_FRAMES` only when not `live` (`:1047-1053`). Under forced colors a cancelled transient retires on the first tick after motion returns.
- **D12, answer 3 and the comet.** Unchanged since round 8. Satellites and the point flash meet condition (a) by construction, and the comet keeps the hold and `bodyShowing`.
- **2.2.2, 2.3.1, 2.3.3.** Unchanged and holding: P5 lands before P4, P6 and P9 to P12; at most 3 onsets a second; the warmest tint is 0.42.
- **The hero gate and About** (new check, no finding). It is inherited from cf4d7b8 and negligible (CA9-1's comparison).
- **The control.**
  - Its background: the header is `bg-navy/85` with a backdrop blur behind the glyph (`Navbar.tsx:83-84`), so 14.1:1 holds.
  - Size and focus: a 40 × 40 target and the 2 px dashed ring (`globals.css:80-83`).
  - The phone menu: `inert` while the menu's panel (`Navbar.tsx:127`, `z-[50]`) covers it, under the burger's `z-[100]` (`:117`).
  - The hidden header: it shows on focus, and the scroll callback (`:31`) keeps it while it holds `:focus-visible`.
  - Forced colors: `forced-colors:hidden`, with the sky hidden (`Background.module.css:27-31`).
  - `prefers-contrast: more`: `meteorInk` 0.
  - `data-sky-quiet` stays on every root, and D1 (a) and (b) keep the precondition and count the control as one rect.
- **Re-grounded references opened this round (cf4d7b8), all matching.**
  - **`mountSky.ts`:** `:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:122-124`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`.
  - **`Navbar.tsx`:** `:1`, `:14-18`, `:31`, `:48-50`, `:52-53`, `:73`, `:79`, `:88`, `:97`, `:114`, `:117`, `:127`.
  - **`globals.css`:** `:28`, `:55`, `:80-83`, `:119-121`, `:203`, `:253`, `:273-278`.
  - **Other files:**
    - `Background.module.css:27-31`; `utils.ts:20`, `:26`; `IntroGate.tsx:54`, `:94-100`; `animations.ts:36`; `README.md:75`, `:80`;
    - `protocol.ts:32-38`; `renderSky.ts:237`; `skyAssets.ts:89-91`;
    - `Card.tsx:7`; `components/styles.ts:7`; `not-found.tsx:16`.
  - **`config.ts`:** `:58-59`, `:73`, `:78-80`, `:153`, `:170-171`, `:179`, `:222-237`, `:231-232`, `:247-250`, `:253`, `:262-271`, `:266`, `:279-282`, `:286-290`, `:299`, `:305`, `:313`, `:321`.
  - **`meteors.ts`:** `:39-40`, `:84-86`, `:195-196`, `:203`, `:204-207`, `:206`, `:208-212`, `:213`, `:215-220`, `:224`, `:226-228`, `:229`, `:236`.
  - **`scene.ts`:** `:11-18`, `:20-23`, `:30`, `:36`.
  - **`sky.worker.ts`:**
    - `:65-72`, `:92-98`, `:117`, `:135-152`, `:143-144`, `:163-165`, `:183`;
    - `:212-238`, `:221`, `:222`, `:226`, `:227-231`, `:233`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`;
    - `:411`, `:435`, `:436`, `:467-493`, `:486`, `:503-509`, `:507`, `:510-524`, `:513`, `:514`, `:531`, `:535`.

## Summary

- **Round 8.** All four fixes in this lens hold. The restructure left nothing stale in this lens, and every re-grounded reference I opened matches cf4d7b8.
- **CA9-1 (major).** The farewell meteors' gate (6.12, P12) lets shooting stars launch in the end scene with unmarked copy inside the start area on tall screens.
  - **Where.** Other Projects' heading and link at 2560 × 1440 (an archived layout) and 1920 × 1200, and also the Projects section's text at 3840 × 2160.
  - **How often.** About 2 to 6% of farewell paths put a bright head behind that text at 2560 × 1440, and up to 2.5% at 4K.
  - **Why it matters.** It is the C1 failure the veil session ruled out, and nothing in the plan guards against it or checks for it.
  - **The fix.** Keep farewell paths below the highest quiet zone on screen (one more `clearOf` zone), treat no room as a hold, and add an end-scene check at 2560 × 1440 and 4K.
- **CA9-2 (minor).** P9 should rename the rail guard in `copyReader`'s doc from `METEOR.maxEndY` to `clearOf`, and tell the veil session.
- **Verdict:** revise (one major).

## Verification

- **r9-coordination-a11y-CA9-1**: confirmed, major. I re-measured the end scene myself (Playwright Chromium on the live page, reduced motion, entrances settled; below the hero cf4d7b8 equals 246c0aa per `git diff --stat`): at 2560 × 1440 "My Projects" sits at y 2-34 and its green link at 52-65 (x 1199-1351) with 0 px left, so both lie inside the start area (x 1152-2522) and the flight region (below `METEOR.top` 110, above `maxEndY` 1037) from about 36 px left up to the 413 px gate; at 1920 × 1200 they sit at 106-138 and 156-169 with 344 px left (in reach from about 276 px); at 3840 × 2160 the heading sits at 722-754 with 0 px left, and Projects text on bare sky is in reach too (the 27 px "Bitcoin" title at 169-201, inside the start area, with 619 px left), so the 4K exposure is if anything larger than the reviewer modeled. cf4d7b8 confirms the gate (level 0.9 at 0.287 H, `scene.ts:26-28`, `config.ts:168-169`), the start area and guards (`config.ts:279-285`, `meteors.ts:204-207`, `:224`), `headGain` 2.52 (`meteors.ts:84-86`), the four quiet roots and the opaque card (`globals.css:253`), and the reviewer's `farewell.mjs` reruns to its numbers. In PLAN.md the farewell row (`:2753`) plans against `field.quiet` and the rails' `clearOf` only, P12 (`:3315-3318`), H7, H8 and AC-20 never test unmarked copy, and section 11's 1.4.3 row (`:3532`) says reading copy only ever has stars behind it, which farewell meteors would break. One overstatement: 2.2's reading row (`:97`) covers the reading scene and its end row (`:98`) admits farewell meteors, so the conflict is with 6.12's "over the end bookend" and section 11, not with 2.2. The fix keeps every veil rule (`clearOf` is ours, I2; a start-area option extends the planner through options, 8.4), and its start area and hold are required, not optional: a `clearOf` band above Contact alone leaves no start point at 2560 × 1440 (starts at most 0.5 H = 720 px, Contact's first line at 880 with 0 px left). Major, not blocking: the kind is off the default path (D4: none in v1) and the exposure needs a tall viewport and a resting scroll in a band above the bottom (about 2 to 6% of farewell paths there), but P12 specifies it fully and would ship a 1.4.3 failure on unmarked copy (C1, answer 3 b) with no step or check to catch it: a missing step, the calibration CA8-1 got for a v1 kind.
