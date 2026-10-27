# Check round 3: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 3. I confirmed whether each round-2 fix in my lens landed in `PLAN.md`, looked for regressions the round-2 revision introduced, and looked for new problems through this lens. No praise; every finding carries evidence.
- **Inputs.** `PLAN.md` (3,572 lines, all read); `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`; R1 §9 and R4 §4.5 (the comet); my round-2 report and the reviser's dispositions; the worktree code at 246c0aa (`sky.worker.ts`, `renderSky.ts`, `meteors.ts`, `scene.ts`, `config.ts`, `mountSky.ts`, `Navbar.tsx`, `IntroGate.tsx`, `Introduction.tsx`, `AboutMe.tsx`, `FadeInSection.tsx`, `SidePane.tsx`, `styles.ts`, `globals.css`, `Background.module.css`, `utils.ts`); `git status` and `git log` of the main checkout (read only).
- **Lens.** COORDINATION.md's hard constraints (veil-owned code untouched until the veil lands, veil-dependent phases blocked, one ink lease, every transient kind through the veil checks and the scroll cancel, 5 s or less per transient, interface requests with fallbacks for "declined" and "never delivered", and a fallback if the veil work never lands); accessibility (WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3 through the veil, 2.5.8 and 1.4.11 for the toggle, reduced motion, forced colors, more contrast, `data-sky-quiet` on the hero, Contact, footer and rails).
- **Output.** This file only. Throwaway scripts, outside the repository: `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r3-a11y/i9overlap.mjs`, `cometdrift.mjs`, and a scratch Git repository (`gitt/`) for the checked-out-branch test.
- **Limits.** Planning review only; `PLAN.md` was not edited. `PLAN.md:n` cites the current file, `file:line` the worktree at 246c0aa, and [computed] the scripts above.

## Verdict: revise

2 major, 4 minor. No blocking finding.

## Round-2 fixes: did they land?

| Round 2 | Status in PLAN.md | Where |
|---|---|---|
| CA2-1 route to master | Landed. Git 2.46.2 refuses `git branch -f`, `git fetch . x:master` and `git push . x:master` on a branch checked out in another worktree (reproduced). Residue: section 1 and the 7.2 map still say "only after V", and CP-4 doesn't offer D10's early merge (CA3-5). | 7.0, 8.5 step 2, PF step 4, 8.7, CP-1, CP-2, D10, R-1 |
| CA2-2 comet | Mostly landed: upper right, every part through `clearSkyFactor`, the launch-gate fade, one scroll rule in 6.12 and AC-25, the comet in I9 and the CP-0 question. Gaps: its own drift and lean between re-tests, its undeclared nearness, the per-breakpoint About row, the glass navbar (CA3-4); PF item 4 and open question 2 omit the comet rule (CA3-1). | 6.12, AC-25, I9, 8.4 |
| CA2-3 two-way cooldown | Landed. | dev. 11, 6.9 table, `TRANSIENTS` doc, H9, AC-38, P9, I8, R-10 |
| CA2-4 P5 rollback | Landed. | P5 |
| CA2-5 CP-0 sender and end test | Landed. | 8.4, 6.10 |
| CA2-6 confirmed-plan checkpoint | Landed as CP-5. Gap: P0 doesn't run it for a plan logged before the implementing session starts (CA3-5). | 8.2 |
| CA2-7 porting their lines | Landed. | 8.5 step 2, 8.6 (`tick`, `draw`), re-verify 4 and 5 |
| CA2-8 D1 wording | Landed. | D1, 11 (2.2.2 row) |
| CG2-1 (touches E12: 0 frames paused) | Landed: `leanPending` needs full motion; H13 case 5; AC-14 in P7. | 6.2, 6.13, P7 |
| CG2-3 (touches AC-26 and AC-27) | Landed: no snap hop on pause; a load under reduced motion still matches today. | M1, S4, 6.3 |

## Findings

### CA3-1 (major): I9's fallback stops a satellite from starting during a lease, but not a lease from starting during a satellite pass

- **Section.** 8.3 I9; 8.7 PF item 4; 6.9 "One tick of `updateTransients`" step 3.3; 8.4 item 4; 12.2 open question 2; H7.
- **Problem.**
  1. For a "no" or no answer (PF included), the fallback adds one condition: satellites and the never-lease could kinds wait for a free lease. Nothing stops a meteor from taking the lease while one of them is in the sky. The launch step plans every meteor with `mayCrossCopy: inkLeaseFree(schedule, now)`, which looks only at active `nearCopy` transients, and a satellite's `nearCopy` is always false.
  2. Onsets need only 3 s between them and a pass lasts 4.8 s. A meteor held back by the onset gap rechecks every second, so it often launches 3 to 4 s into a pass, inside it.
  3. The comet got the reverse rule ("no flight takes the lease while the comet shows"); satellites, the point flash, bursts and earthgrazers didn't. Under PF, where I9 is never answered, this one-way rule is what P11 ships.
  4. PF item 4 restates only the one-way rule and drops the comet's. The I9 question (8.4 item 4) and open question 2 ask only about satellites (and the comet), so even a "yes" leaves the point flash, bursts and earthgrazers under the fallback.
- **Evidence.**
  - `PLAN.md:3166` (I9): "If they say no, or never answer (PF included), satellites and the could kinds that never take the lease also wait for the lease to be free (one more condition in the launch step), and while the comet shows, which never launches, no flight takes the lease (`mayCrossCopy` false)".
  - `PLAN.md:3254` (PF item 4): "With no answer to I9, satellites and the could kinds that never take the lease wait for a free lease."
  - `PLAN.md:2053`: "*Plan* with `mayCrossCopy: inkLeaseFree(schedule, now)`". `PLAN.md:2033-2035`: `inkLeaseFree` is the cooldown plus `!schedule.active.some((transient) => transient.nearCopy)`. `PLAN.md:2510`: `planSatellite` "(nearCopy is always false)".
  - `PLAN.md:2079` and `:2086` (`minOnsetGap: 3`, `recheck: 1`), `:2048-2051` (a held launch looks again after `recheck`), `:2469` (`life: 4.8`).
  - `COORDINATION.md:34`: "Transients that light up near copy must not overlap in time unless they share one ink budget."
  - `PLAN.md:3198` and `:3443`: the question names a satellite and the comet, or only a satellite.
  - [computed, `i9overlap.mjs`: 3,000 ten-minute desktop hero visits per case; the plan's meteor and satellite gap laws, the long-visit stretch, the 3 s onset gap with 1 s rechecks, satellites held while a lease is held] 3.3 to 3.4% of satellite passes overlap a lease-holding meteor (456 to 469 of about 13,600 passes) at crossing shares 0.16, 0.19 and 0.25 with 6.9's cooldowns of 40, 60 and 85 s. With the reverse rule added, none overlap, at a cost of about 3% of leases (0.39 to 0.38 a minute).
- **Fix.**
  - Make the fallback two-way in I9, PF item 4 and 6.9 step 3.3. While I9 is unanswered or "no", a meteor may take the lease only when nothing else is active and no comet shows (`mayCrossCopy: inkLeaseFree(schedule, now) && schedule.active.length === 0 && !cometShowing`; T7 and the gap law already keep a second meteor out). Never-lease kinds launch only while no `nearCopy` transient is active.
  - Add an H7 case: with the fallback on, no never-lease transient is ever active together with a `nearCopy` one.
  - Ask I9 for every never-lease kind (satellite, point flash, burst, earthgrazer, comet) in 8.3, 8.4 item 4 and open question 2, and carry the comet's rule into PF item 4.

### CA3-2 (major): the far-star exceedance must be closed "by the veil's per-class budgets", but nothing asks the veil session for it, and V has no fallback

- **Section.** 11 (1.4.3 row); AC-30; 8.3; 8.4 (CP-0 message); 8.5 step 5; 8.6 re-verify item 8.
- **Problem.** The plan names one known 1.4.3 exceedance on the normal path: a veiled meteor's 0.053 of white on body text over a far star's 0.039 to 0.06, under the haze, against 0.064 of headroom. It hands the fix to the veil session ("must close it") and checks it at V.
  - Nothing asks for it. The CP-0 message requests the per-class budgets as numbers but never states the case, and I1 to I9 don't include it.
  - The veil session's own budget table has no far-star term (body text "about 0.08"), so its commit can easily leave the case open.
  - If it does, AC-30 fails at V and the plan gives no next step: PF's `inkKeep` 0 exists only on the PF path, and 8.5 step 5 only adopts their numbers.
- **Evidence.**
  - `PLAN.md:3400` (11): "A known, pre-existing exceedance: one meteor over a far star on body text under the haze (0.053 plus the star's 0.039, or 0.06 at a twinkle peak, against 0.064). The veil's per-class budgets must close it (re-checked at V, 8.6)".
  - `PLAN.md:3322` (AC-30): "closed by the veil's per-class budgets (checked at V) or PF's `inkKeep` 0". `PLAN.md:3243` (re-verify item 8). `PLAN.md:3211` (8.5 step 5: "Adopt their numbers: `scrollCancel`, `cancelFade`, and any `METEOR_VEIL` change").
  - `PLAN.md:3194-3199` (CP-0 requests 1 to 5): budgets asked for as numbers only; the far-star case is not mentioned anywhere in 8.3 or 8.4.
  - `COORDINATION.md:26` ("about 0.026 with a far star on the same pixel"); `COORDINATION.md:58` (slate body text budget "about 0.08", with no star term).
  - `config.ts:74-80` (far stars: alpha up to 0.39, `inkKeep` 0.1; 0.06 at a twinkle peak); `config.ts:317` (a meteor adds about 0.053 on the copy).
- **Fix.**
  - Add a request (I10, or a line in I8 and in the CP-0 message): "Your per-class budgets should cover a veiled meteor on body text over a far star under the haze (0.053 plus 0.039 to 0.06, against 0.064). If they don't, may we set `METEOR_VEIL.inkKeep` to 0 after your commit, as `CONTRAST_MORE.meteorInk` already does?"
  - Its fallback, in 8.3 and in 8.5 step 5: if their commit leaves the case open and they decline or have finished, apply PF item 1 (`inkKeep` 0 and its doc's arithmetic) after V, with the user's OK and before P8, then re-run AC-30.

### CA3-3 (minor): P9 hooks R1's re-pick into the layout handler's changed-rects branch, which the veil's planned deferral may move

- **Section.** 6.9 "In the worker (P8)"; P9 files and step 2; R1; 8.6 (layout-handler row).
- **Problem.** From P9, `forgetVisitSky` runs in "the handler's `!sameRects` branch, `:475-481`". The veil session plans to defer a layout that arrives mid-ease, so after its commit `quiet` and `pinned` may be replaced in a later step, not in that branch.
  - A call left in the branch then clears the sky before the rects change. The next launch re-picks against the old rects (`pickVisitSky`'s clear-sky test reads `field.quiet`, which is built from `quiet`), and the deferred change re-picks nothing, against R1.
  - 8.6's layout row gives "none" as the resolution and doesn't mention that P8 (`retryTransients`) and P9 (`forgetVisitSky`) edit that handler after V.
- **Evidence.** `PLAN.md:2161`, `:3019`, `:3025` (P9 step 2: "`forgetVisitSky`'s calls"), `:307` (R1), `:3221` (8.6 row), `:2349` (`quietAt(field.quiet, x, y) === 0`), `:326` (4.4: `layoutAt` is ours to read at any time). `sky.worker.ts:206` (the field is built from `quiet`), `:475-481` (the branch sets `layoutAt = now / 1000`), `:482` (`retryMeteors`). `COORDINATION.md:19`: "The `layout` handler and `quietBlend`: defers a layout that arrives mid-ease".
- **Fix.** Key the re-pick on `layoutAt`, which the veil's code sets whenever new rects take effect (it drives the quiet ease) and which 4.4 already lets us read. `VisitSky` keeps the `layoutAt`, width and height it was picked under, the launch gate carries the current `layoutAt`, and `planMeteorTransient` re-picks when they differ. That needs no call in the veil-owned handler and survives any deferral. Otherwise add to 8.6: "P9's `forgetVisitSky` goes wherever their commit replaces `quiet` and `pinned`", and check it at V.

### CA3-4 (minor): the comet's guards leave out its own camera motion, its nearness, the narrower desktop breakpoints and the glass navbar, and the change to its scroll rule isn't disclosed

- **Section.** 6.12 (static comet row); AC-25; 8.4 ("After your commit"); I9.
- **Problem.**
  1. **Its own motion.** The comet obeys the camera law with "a declared nearness" that the plan never gives. The drift moves a body at nearness q down by up to 165 q px, and the lean by up to 12 q px, continuously. Yet its box is "re-tested on every layout and scroll step" only. So it can drift into a padded rect's feather between re-tests, where `clearSkyFactor` masks part of it with no fade, and AC-25's "its box stays `QUIET.feather` clear" isn't guaranteed. The same drift can carry the box below the About row it was placed above.
  2. **The About row.** "About's header is still below about 0.6 H + 110 px" holds only from 1024 px wide. Sections are padded 60, 80 or 100 px by breakpoint, plus the header's 10 px margin, so the row is 0.6 H + 70 at 641 to 767 px and 0.6 H + 90 at 768 to 1023 px. "Desktop" in this plan means wider than 640 px (`NARROW_MAX_WIDTH`, `config.ts:29`), so the comet can show at those widths.
  3. **The navbar.** Nothing keeps the box below `METEOR.top`. An upper-right comet (R4: "where the haze pools are"; the pools sit at 6% and 20% of the height) can sit under the 85% glass navbar, behind the nav links and the new pause control, where even the haze is faded out. Satellites already stay below `METEOR.top`.
  4. **The scroll cancel.** COORDINATION.md request 1 names the comet among the kinds that "obey the scroll cancel". 6.12 replaces it with the launch-gate fade, per-frame `clearSkyFactor` and the box re-test. Those meet the cancel's purpose, but the CP-0 message and I9 ask only about overlap in time.
- **Evidence.**
  - `PLAN.md:2544` (the comet row: "a declared nearness", "re-tested on every layout and scroll step", "0.6 H + 110 px"); `:2547` (the camera law); `:3317` (AC-25); `:271` (C3).
  - [computed, `cometdrift.mjs`: the plan's epicycles at v₀ = 3 over 6 h] The drift's vertical offset at q = 1 spans −165.0 to +46.7 px, so a body moves down by up to 165 q px: 64 px at the far band's q = 0.389, 165 px at q = 1. With the box's bottom at 0.6 H + 70 (H = 900, a hero H tall, the lg padding) and the camera's scroll lift included, About's header reaches the box's feather at 305 px of scroll with the comet still 6.3% lit (q 0.389), or at 210 px with it 37.6% lit (q 1).
  - `styles.ts:7` (`py-[60px] md:py-[80px] lg:py-[100px]`), `globals.css:203` (`margin: 10px 0 40px`), `Introduction.tsx:14` (`min-h-screen`).
  - `Navbar.tsx:83-85` (`fixed top-0`, `backdrop-blur-[10px]`, `bg-navy/85`, 100 px tall before scrolling); `config.ts:183-184` (haze pools at y 0.2 and 0.06), `:188` (`HAZE_TOP_FADE`: "No haze under the glass navbar"), `:268` (`top: 110`); `PLAN.md:2521` (satellites stay "below `METEOR.top`").
  - `COORDINATION.md:34`; `PLAN.md:3192`, `:3198`, `:3166`. R4 §4.5 (`R4:470`): the comet "moves only with the far layer's parallax".
- **Fix.**
  - Declare the comet's nearness in the far band (R4). Grow its box by its drift and lean reach (165 q + 12 q px) for both the rect test and the About row, or re-test the box on every drawn frame (one box against at most 64 rects).
  - State the About row per breakpoint: 0.6 H plus the section padding plus 10 px.
  - Keep the box below `METEOR.top`, like satellites.
  - Add to the CP-0 comet line: "the comet has no launch scroll: it is gone by 0.4 viewport heights, adds no light inside any padded rect at any scroll, and fades when its box meets a rect; tell us if you need the shared cancel instead."

### CA3-5 (minor): checkpoint gaps around D10, CP-4 and CP-5

- **Section.** 3 D10; 7.0; the note before P8; 8.2 (CP-1, CP-4, CP-5); P0; 8.4 item 5; section 1; 7.2.
- **Problem.**
  1. **CP-4's question.** CP-4 and the note before P8 ask the user to choose between two options ("keep waiting, or run PF"). D10 also lists "Merge P1 to P7 to master now, with the veil session's agreement", the only option that ships the drift while the veil work is pending, and CP-4 never offers it. D10 and 7.0 describe its cost as the veil session "rebas[ing] its uncommitted work onto ours", but uncommitted work can't be rebased. The veil session would have to commit or stash, move its local master and resolve conflicts in the sky files both plans change, mid-work. Say so, so it and the user can judge.
  2. **"Keep changing".** D10's recommended answer turns on whether the veil session's "edits in the main checkout keep changing", but CP-1 records only `git status --short`, which lists file names and can't show change between checks.
  3. **A plan that arrives early.** P0 step 1 runs CP-1, which looks for commits only. If the veil session's confirmed plan reaches the planning session before the implementing session exists and is logged in COORDINATION.md, nothing runs CP-5 before P2 to P5 rewrite `frameMode`, `tick` and the `motion` handler. CP-0's item 5 asks only for future notices.
  4. **Stale wording.** Section 1 says the integration branch "reaches master only after the veil commit lands", and the 7.2 map says "master only after V". Both contradict 7.0's PF route and its early merge.
- **Evidence.** `PLAN.md:176` (D10), `:2609` (7.0), `:2976` ("Ask once, with D10's two options"), `:3149` (CP-4: "keep waiting, or run PF"), `:3146` (CP-1), `:2734` (P0 step 1), `:3150` (CP-5), `:3199` (CP-0 item 5), `:18`, `:2703`. `COORDINATION.md:43` (read `src/` only from the worktree) and `:68` (the confirmation comes before the landing notice).
- **Fix.**
  - CP-4 and the note before P8 offer D10's three answers: keep waiting, run PF, or merge P1 to P7 early with the veil session's agreement. D10 and 7.0 state the early merge's real cost.
  - CP-1 records the last-write times of the files `git status --short` lists. That is metadata only, never their contents, per COORDINATION.md:43.
  - P0 runs CP-5 when COORDINATION.md already logs a confirmed plan, and CP-0's item 5 asks the veil session to resend any confirmation it already sent to the planning session.
  - Reword section 1 and the 7.2 map: "reaches master at V, after PF, or earlier with the veil session's agreement (7.0)".

### CA3-6 (minor): the 2.2.2 gate names only P4 and P6

- **Section.** 7.0 (Gates); 7.2 (P8's "Depends on"); R-23; 11 (2.2.2 row).
- **Problem.** 7.0 puts P5 before "any phase that extends automatically started motion" and lists P4 partly because shooting stars stop less often. P9 (about 3.5 times the shooting stars) and P11 (satellites) extend the same motion further, and R-23 and section 11 rest on "5 s per transient, plus the control". P8 depends only on "V, P3". "Phases land in order" keeps P5 first today, but if the order changes after an early V (the meteors are the user's second request), nothing in the gate keeps P9 from shipping before the control.
- **Evidence.** `PLAN.md:2625` (the gate), `:2616` ("Phases land in order"), `:2721` (P8: "V, P3"), `:3438` (R-23: "5 s per transient, plus the control"), `:3397` (11: "the control stops transients too"), `:32` and `:3028` (P9's rate).
- **Fix.** Name P9 to P12 in the gate, and add P5 to P8's "Depends on".

## Verified with no finding

- **Veil-owned code before V.** P1 to P7 and P13 don't edit `veiledFrom`, `METEOR_VEIL`, `quietBlend`, `settleQuiet`, or the `scroll` and `layout` handler bodies:
  - P1's `sameRects` move changes only an import, and CP-0 discloses it.
  - P2's `parallaxScroll` write sits in our `motion` handler.
  - P3 keeps `rafId`'s falsy "nothing pending" meaning for `sky.worker.ts:469`.
  - P4 keeps `noteInput` and `meteorsAllowed` by name.
  - P5's `mountSky` edits avoid the rect measurement.
  - P6's thinning fade sits in `stepDown` and `frameAt`.
- **Blocked phases.** P8 to P12 are blocked on V, the comet included; only the planet (star keeps, not named in request 1) is not.
- **5 s rule.** `meteorLifetime` (`meteors.ts:220-222`) gives a fireball with its train 2.5 + 2.4 = 4.9 s. A satellite pass is 4.8 s, an earthgrazer about 4 s, a burst at most 5 s, and T1 retires at the earlier of the life and the cancel fade's end.
- **One lease.** T2 is enforced at the launch step, including a `nearCopy` plan made under `mayCrossCopy: false` (apart from CA3-1's fallback).
- **2.2.2.** The control lands before P4 and P6, starts paused under reduced motion, keeps Play for the page view only, and a pause persists and syncs across tabs. D1 and section 11 now say "at the top of the page".
- **2.3.1 and 2.3.3.** The warmest tint, light orange, has R / (R + G + B) = 0.42 (`config.ts:101`); areas are about 2,000 CSS px² or less, and bursts are staggered at least 0.35 s. Parallax, the glide and the lean stop under reduced motion and when paused (C6).
- **2.5.8 and 1.4.11.** The control is 40 × 40 px; green on navy is 14.1:1 [recomputed]; the focus ring is `globals.css:80-83`. Even a pure-white pixel behind the 85% glass (`Navbar.tsx:84`) leaves 9.0:1 under the glyph [computed].
- **Forced colors and more contrast.** `Background.module.css:27-31` hides the sky, the worker gets `motion: 'off'`, and the control is `forced-colors:hidden`. `CONTRAST_MORE` is unchanged.
- **`data-sky-quiet`.** The default path edits none of `Introduction.tsx:14`, `ContactMe.tsx:11`, `AppFooter.tsx:13` or `SidePane.tsx:23`.
- **The main checkout.** It still has no uncommitted sky edits, and master is at 246c0aa (`git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky` is empty), which matches the plan's statement that the veil work hasn't landed.
