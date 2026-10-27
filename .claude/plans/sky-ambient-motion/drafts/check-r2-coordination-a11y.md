# Check round 2: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 2. I confirmed whether each round-1 fix landed in `PLAN.md`, looked for regressions the revision introduced, and looked for new problems through this lens. No praise; every finding carries evidence.
- **Inputs.** `PLAN.md` (3,460 lines, all read); `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`; R2 §6.2, §8.4 and §9, R4 §4.5; my round-1 report (`drafts/check-r1-coordination-a11y.md`) and the reviser's dispositions; the worktree code at 246c0aa (`sky.worker.ts`, `mountSky.ts`, `renderSky.ts`, `scene.ts`, `config.ts`, `meteors.ts`, `Navbar.tsx`, `IntroGate.tsx`, `SkyCanvas.tsx`, `Introduction.tsx`, `AboutMe.tsx`, `ContactMe.tsx`, `AppFooter.tsx`, `OtherProjects.tsx`, `Card.tsx`, `FadeInSection.tsx`, `icons/Icon.tsx`, `styles.ts`, `globals.css`, `Background.module.css`, `utils.ts`); `.claude/launch.json` in both checkouts; `git worktree list` in the main checkout.
- **Lens.** COORDINATION.md's hard constraints (veil-owned code untouched until the veil lands, veil-dependent phases blocked, one ink lease, every transient kind through the veil checks and the scroll cancel, 5 s or less per transient, interface requests with fallbacks for "declined" and "never delivered", and a fallback if the veil work never lands); accessibility (WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3 through the veil, 2.5.8 and 1.4.11 for the toggle, reduced motion, forced colors, more contrast, `data-sky-quiet` on the hero, Contact, footer and rails).
- **Output.** This file only. Throwaway scripts (not in the repository): `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r2-a11y/crossings.mjs`, `crossings2.mjs` and `comet.mjs`.
- **Limits.** Planning review only; `PLAN.md` was not edited. `PLAN.md:n` cites the current file, `file:line` the worktree at 246c0aa, and [computed] the scripts above.

## Verdict: revise

1 major, 7 minor. No blocking finding.

## Round-1 fixes: did they land?

| Round 1 | Status in PLAN.md | Where |
|---|---|---|
| CA-1 integration branch | Landed. One gap: how and when that branch reaches master (CA2-1). | 1, 7.0, 7.2, 8.1, 8.4, 8.5 |
| CA-2 comet | Partly. Blocked on V and planned under request 1, but its guard against reading copy is false and the I9 fallback can't apply to it (CA2-2). | 6.12, 7.2, P12, AC-25 |
| CA-3 menu covers control | Landed (`inert={mobileMenuOpen}`; the panel and z-order match `Navbar.tsx:52-53`, `:117`, `:127`). | 6.8, AC-28 |
| CA-4 reading copy | Landed. | 2.2, D2, AC-30, 11 |
| CA-5 far-star case | Landed (PF `inkKeep` 0: 0.039 to 0.06 now fits under 0.064). | 11, 8.7, AC-30, 8.6 |
| CA-6 CP-1 | Landed (local master and the main checkout's status). | CP-0, CP-1, CP-4 |
| CA-7 PF handshake | Landed. | 8.7 |
| CA-8 I9 never answered | Landed for transients; not for the comet (CA2-2). | I9, PF item 4 |
| CA-9 PF contradictions | Landed. | 8.7 |
| CA-10 cooldown 55 s | Landed, but only as a ceiling that can go down (CA2-3). | dev. 11, 6.9, R-10 |
| CA-11 P5 before P4 | Landed; P5's rollback note still names only P6 (CA2-4). | 7.0, 7.2, P4, P5 |
| CA-12 lease at the launch step | Landed. | 6.9 step 3.3, T2, H7 |
| CA-13 could kinds' drawing | Landed. | 6.12, T3 |
| CA-14 DOM order | Landed: logo, burger, control on phones (`#primary-nav` is fixed and invisible while closed, `Navbar.tsx:127-129`); logo, links, Resume, control on desktop. Auto margins beat `justify-between`. | 6.8 |
| CA-15 header and focus | Landed. `smoothScrollTo` moves focus to the section (`utils.ts:23-30`), so keyboard use of a nav link still lets the header hide. | 6.8, 11, AC-28 |
| CA-16 D1 (a) and (b) duties | Landed. | D1 |
| CA-17 card border | Landed (open question 9). | 11, 12.2 |

## Findings

### CA2-1 (major): nothing says how or when the integration branch reaches master, and coordination stops at V

- **Section.** 7.0 (Where), 8.5 step 2, 8.7 (PF), 8.2 (CP-1, CP-2), D10, R-1.
- **Problem.**
  1. **At V.** 8.5 says "merge the integration branch to master when the user approves". But master is checked out in the main checkout, where the veil session works uncommitted. Git won't move a branch that another worktree has checked out (`git branch -f` and `git fetch . x:master` both refuse). So the merge has to run in the main checkout, which 7.0 forbids touching and which rewrites files under the veil session's working tree, or go through origin, which COORDINATION.md records this work never doing, and which also publishes the veil commit if it hasn't been pushed. The plan picks neither route.
  2. **Under PF.** There is no V, and 7.0's rule is "never into master, until checkpoint V". So by the plan's own rules, P1 to P12 never reach master in the fallback. 8.7 ends with "Then P8 to P12 run on top of PF, as planned" and has no merge step.
  3. **After V.** CP-2 covers only P1 to P7 and P13, CP-1 only looks for "the veil commit", and nothing says where P8 to P12 merge. Yet P8 replaces `updateMeteor` and moves the veil's cancel out of its `scroll` handler, and P9 edits `planFlight`. Those are the functions the veil session has just changed, and its own plan ends with an audit step that may follow up on them.
- **Evidence.**
  - `PLAN.md:2490`: "Each phase is a PR into that branch, never into master, until checkpoint V ... only then merges to master, when the user approves." `PLAN.md:2491`: "Never edit `src/` in the main checkout". `PLAN.md:3071`: "Once step 4 passes, merge the integration branch to master when the user approves."
  - `PLAN.md:3038` (CP-0): "nothing of ours reaches master until your commit has landed ... We never edit the main checkout."
  - `PLAN.md:2583`: "(integration branch; master only after V)". `PLAN.md:2587`: "PF fallback ─► then P8 to P12 as above". `PLAN.md:3126`: "Then P8 to P12 run on top of PF, as planned."
  - `PLAN.md:3016` (CP-2: P1 to P7 or P13 only); `PLAN.md:3078` (8.5 step 6 ends coordination with one reply); `PLAN.md:2059` and `:2865` (P8 moves the veil's cancel); `PLAN.md:3027` (I2 edits `planFlight`).
  - `COORDINATION.md:43`: "This planning work reads `src/` only from the worktree ..., never edits the main checkout's `src/`, and never commits or pushes master." `COORDINATION.md:41`: the veil session's steps run to "live verification, audit".
  - `git worktree list` in the main checkout: `S:/Documents/repos/Portfolio 246c0aa [master]`.
  - R-1 (`PLAN.md:3281`) says "P1 to P7 need nothing from it", though they can't ship without it. D10 (`PLAN.md:175`) offers only "Set a date instead. Or wait indefinitely", not the earlier merge that 7.0 allows with the veil session's agreement.
- **Fix.**
  - 8.5 step 2: state one route. The user merges, or approves, a PR from the integration branch into origin/master. If the veil commit isn't on origin, ask the veil session or the user before pushing any branch that contains it. The main checkout's local master is fast-forwarded only by the user, or with their approval once `git -C S:/Documents/repos/Portfolio status --short` shows no uncommitted sky edits and the veil session has been told.
  - 8.7: add a last step: after the handshake, merge the integration branch to master by the same route when the user approves. Uncommitted veil edits left in the main checkout are the user's to keep or stash, never ours to build on.
  - After V: say where P8 to P12 merge (PRs into master, or keep the integration branch). CP-1 keeps watching for later veil commits, and CP-2 keeps notifying for P8 to P12 until the veil session says it has finished.
  - D10: add the alternative "merge P1 to P7 to master now with the veil session's agreement (7.0), while P8 onward waits". Fix R-1's mitigation to name the route.

### CA2-2 (minor): the comet's guards don't hold as written

- **Section.** 6.12 (static comet row), AC-25, 8.3 I9, 8.4 item 4.
- **Problem.**
  1. "It fades with the hero level, gone before reading copy (no rects) arrives" can't be true at any position. The hero level reaches 0 only at 1.3 viewport heights of scroll, by which time About's header has already left the top of the screen. So About's copy, which has no quiet rects, crosses the comet's rows while the comet is still 24% to 98% lit. AC-25 requires "never over reading copy", which the design doesn't ensure. 6.12 also doesn't place the comet, so whether About's text column is under it is left to chance (R4 put it in the upper right).
  2. Only "its tails take `clearSkyFactor` per sample". The nucleus (alpha up to 0.6) and coma don't. When the box test fails, the comet fades over 0.2 s, and a fast scroll (200 px in that time at 1,000 px/s) can slide quiet copy under a still-lit nucleus. T3 asks for zero light inside any padded rect, and R2 applied near-layer keeps to the whole comet.
  3. AC-25 says "it fades on the scroll cancel"; 6.12 uses a box re-test on every scroll step instead. Pick one.
  4. I9 and CP-0 item 4 ask only about satellites. I9's fallback ("wait for the lease to be free ... in the launch step") can't apply to a static body that is never launched, so if the veil session says no, the comet has no specified behavior.
- **Evidence.**
  - `PLAN.md:2425` (the comet row), `PLAN.md:3182` (AC-25), `PLAN.md:3034` (I9), `PLAN.md:3065` (CP-0 item 4).
  - `scene.ts:27` (`hero = 1 - smoothstep(heroFadeFrom, heroFadeTo, scrolled)`), `config.ts:150-151` (0.5 and 1.3), `Introduction.tsx:14` (`min-h-screen`), `styles.ts:7` (`lg:py-[100px]`), `globals.css:201-208` (`.section-header` margins).
  - [computed, `comet.mjs`] At H = 900, About's header reaches a comet at screen rows 150, 250, 350 and 450 px at scroll 0.96, 0.84, 0.73 and 0.62 viewport heights, when the hero level is 0.40, 0.60, 0.79 and 0.94. Its first body line arrives at levels 0.25 to 0.84. The level reaches 0 at 1,170 px of scroll, when About's header is at screen y −160. At H = 800 and 1,200 the range is 0.24 to 0.98.
  - R2 §8.4 C4 (`R2:372`): "The comet and planet follow the per-frame star veil with near-layer keeps". R4 §4.5 (`R4:470`, `:472`): the upper right, nucleus alpha at most 0.6.
- **Fix.**
  - Fade the comet with the launch gate: gone by `SCENE.heroLaunchMaxScroll` (0.4 viewport heights, when About's header is still at 0.6 H + 110 px, 650 px at H = 900), and keep its box above that row less `QUIET.feather`. Or place it in the upper right as R4 does and check the About column. Say which in 6.12.
  - Draw every part (nucleus, coma and both tails) with `clearSkyFactor`.
  - State one scroll rule in both 6.12 and AC-25.
  - Add the comet to I9 and the CP-0 question, with a fallback: it dims to 0 while a lease is held, or no flight takes the lease while it shows.

### CA2-3 (minor): the crossing cooldown can only go down, but 55 s is already at the limit

- **Section.** Deviation 11, 6.9 (the cooldown note), I8, R-10, AC-38, P9.
- **Problem.** The plan sets 55 s and only ever lowers it. By its own numbers, 55 s gives 0.51 to 0.58 crossings a minute against today's 0.57, so a 19% crossing share already fails "at or below today's", and the share on captured layouts is unknown. If AC-38 fails at P9, the plan gives no next step.
- **Evidence.**
  - `PLAN.md:62` ("55 s gives 0.51 to 0.58 ... against today's 0.57"), `PLAN.md:2000` ("lower it only when H9 on captured layouts passes"), `PLAN.md:3033` (I8: "keep the 55 s cooldown"), `PLAN.md:3290` (R-10: "lowered only on captured layouts"), `PLAN.md:3195` (AC-38: "at or below today's").
  - [computed, `crossings.mjs` and `crossings2.mjs`, 300,000 to 400,000 simulated visits each: first launch 4.5 to 7 s after the reveal, then the flight plus min(30, 4 + Exp(8)) s, onsets at least 3 s apart, first two minutes] Today gives 0.576 crossings a minute. At 55 s: 0.517 (16% share), 0.578 (19%), 0.680 (25%) and 0.816 (36%). The cooldown that brings it to 0.576 or less is about 57 s at 19%, 71 s at 22%, 81 s at 25%, 91 s at 30% and 100 s at 36%.
- **Fix.** Make it a two-way knob in 6.9, P9, I8 and R-10: set it from the measured share (the table above), raise it when AC-38 fails, and lower it only when AC-38 passes with margin.

### CA2-4 (minor): P5's rollback note only protects P6

- **Section.** P5 Rollback, 7.0 Gates.
- **Evidence.** `PLAN.md:2794`: "Revert the PR (P4 and P6 depend on it). P6 must never ship without P5: after P6 has landed, revert P6 first, or set every `SCENE.*.drift` to 0." 7.0's gate (`PLAN.md:2505`) names both P4 and P6 as extending automatically started motion, and P4 has no kill switch (7.2, `PLAN.md:2597`). A revert of P5 alone would leave P4's longer twinkle and shooting stars without the control.
- **Fix.** "P4 and P6 must never ship without P5: revert them first (P6 may use its kill switch instead; P4 has none)."

### CA2-5 (minor): the CP-0 message misstates its sender and leaves out I2's change to the veil session's end test

- **Section.** 8.4, 6.10 (What the veil planner accepts), 8.3 I2.
- **Problem.**
  1. The implementing session sends the message at P0, but it opens "From the sky-ambient-motion planning session (branch `claude/quirky-carson-btv2u4` ...)" and then asks for notices to "this implementing session". It never names the integration branch or its worktree.
  2. I2 adds the right edge and `METEOR.top` to `planFlight`'s end test and caps lease-taking peaks at 0.9, and 8.3 says "We inform them". The message mentions only the `aim` and `fireball` options. 6.10 then lists "the layout guards they own" under "Everything else stays the veil session's", a few lines after I2 changes the end test.
- **Evidence.** `PLAN.md:3038`, `:3066`, `:2626` (P0 step 5), `:3014` (CP-0), `:3058`, `:2301`, `:2305-2308`, `:3027`. `COORDINATION.md:13` (`planFlight` is theirs) and `:15` ("possibly the METEOR spawn and selection keys").
- **Fix.** Sign the message as the implementing session, and name `claude/sky-ambient-motion-impl` and its worktree. Add to "After your commit": "I2 also adds `end.x > width − edgeMargin` and `end.y < METEOR.top` to `planFlight`'s end test and keeps peaks at 0.9 or less for flights that may take the lease; tell us if your commit changes the end test." In 6.10, say that the guard values stay theirs and that I2 adds two conditions using them.

### CA2-6 (minor): no checkpoint acts on the veil session's confirmed plan

- **Section.** 8.2.
- **Problem.** COORDINATION.md says the veil session will message twice: when its plan is confirmed (with the final names, signatures and the functions that changed shape) and when its code lands. 8.2 acts only on the commit (CP-3, V). CP-1 says "read any reply" but not what to do with a confirmed plan that arrives while P1 to P7 are in progress, for example one that changes `frameMode`, `tick` or the `motion` handler, which P2 to P5 rewrite.
- **Evidence.** `COORDINATION.md:68` ("It will message when its plan is confirmed ... and when its implementation lands") and `:80`. `PLAN.md:3015`, `:3017`, `:3022`.
- **Fix.** Add a checkpoint: when the confirmed plan arrives, log it, re-check 8.1's seams, 8.3's I1 to I9 and 8.6's hotspots against its names and function list, and tell the veil session at once about any function both plans rewrite, before more phases stack on it.

### CA2-7 (minor): the rebase rule "outside, ours" can drop part of the veil fix

- **Section.** 8.5 step 2, 8.6.
- **Problem.** P3 rewrites `frameMode`, `schedule`, `tick`, `onFrame`, `onTimer` and `cancelFrames`. Any line the veil commit adds there (a frame reason for its cancel fade, a step that applies a deferred layout) falls under "outside, ours" and is discarded. 8.6 asks only to carry over "any new reason into `frameDemand`".
- **Evidence.** `PLAN.md:3071` ("inside a veil-owned function theirs wins; outside, ours"), `PLAN.md:3084`. `COORDINATION.md:18-19`: a fade on scroll and a layout deferred mid-ease, both of which need frames or a later step to apply.
- **Fix.** Add: "In functions we rewrote, ours wins on structure, but every line their commit adds there is ported. List them first with `git diff 246c0aa..<their SHA> -- src/components/sky/sky.worker.ts`." AC-16 (b) and AC-40 at V then confirm that the deferral and the cancel fade survived.

### CA2-8 (minor): D1 calls the default control "always visible", but the header hides while scrolling down

- **Section.** 3 D1, 11 (2.2.2 row).
- **Evidence.** `PLAN.md:166`: "In the navbar and always visible". `Navbar.tsx:31` and `:79` hide the header on every downward scroll, and `PLAN.md:1717` says so ("The header slides fully off-screen while the visitor scrolls down"). The reading drift (D2, 0.35) runs while the header is hidden, and alternative (a)'s listed cost is that "it scrolls away with the hero".
- **Fix.** Say "at the top of the page: visible on load, on any upward scroll and whenever focus enters the header", so D1's comparison with (a) is fair. This still meets G186 (a control at the top of the page).

## Verified with no finding

- **Veil-owned code before V.** P1 to P7 and P13 don't edit `veiledFrom`, `METEOR_VEIL`, `quietBlend`, `settleQuiet` or the `scroll` and `layout` handler bodies. P1's `sameRects` move changes only the layout handler's import, and CP-0 discloses it. P3 keeps the `rafId` and `timerId` names that the scroll handler reads (`sky.worker.ts:469`). `drawMeteor` never reads `SkyFrame.parallaxScroll` (`renderSky.ts:201-261`), so P2's removal stays clear of veil code.
- **Blocked phases.** P8 to P12 are blocked, the comet included. The planet stays unblocked: it is a star with star keeps, and COORDINATION.md's request 1 doesn't name it.
- **5 s rule.** Fireball with train 4.9 s, satellite 4.8 s, earthgrazer about 4 s, burst span at most 5 s. T1 retires at the earlier of the lifetime and the cancel's end.
- **One lease.** T2 is enforced at the launch step, including a `nearCopy` plan made with `mayCrossCopy: false`. T7 and the 4 s gap floor (longer than the 2.4 s train) keep two meteors from overlapping.
- **2.2.2.** The control lands before P4 and P6. It starts paused under reduced motion, Play lasts only for the page view, a pause persists, and other tabs follow. `skyPause.ts`'s rules check out case by case.
- **2.3.1 and 2.3.3.** The warmest tint is 0.42 (`config.ts:101`). Areas stay under about 2,000 CSS px², and bursts are staggered at least 0.35 s. Parallax, glide and lean stop under reduced motion and when paused.
- **2.5.8 and 1.4.11.** 40 × 40 px. Green on navy is 14.1:1. The focus ring is `globals.css:80-83`. Untitled SVGs are `aria-hidden` (`icons/Icon.tsx:14-15`).
- **Forced colors and more contrast.** `Background.module.css:27-31` hides the sky. The worker gets `motion: 'off'` (`mountSky.ts:149`), and the control is `forced-colors:hidden`. `CONTRAST_MORE` is unchanged.
- **`data-sky-quiet`.** The default path edits none of `Introduction.tsx`, `ContactMe.tsx`, `AppFooter.tsx` or `SidePane.tsx`. D1 (a) and (b) state the duties.
- **Dev servers.** `autoPort: true` is set for both configurations in both checkouts' `.claude/launch.json`. The main checkout has no uncommitted sky edits today (`git status --short -- src/lib/sky src/components/sky` is empty).
