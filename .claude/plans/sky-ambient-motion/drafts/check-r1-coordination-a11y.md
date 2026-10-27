# Check round 1: coordination and accessibility

## Scope

- **Role.** Adversarial checker, lens "coordination-a11y", round 1. I looked for real problems in `PLAN.md`, not for strengths.
- **Inputs.** `PLAN.md`; `HANDOFF.md`, `COORDINATION.md`, `research/00-shared-brief.md` and `research/01-planning-brief.md`; R1 to R4 (R2 §6, §7, §8.4 and §9 in depth); `drafts/judge-scores.md`; the worktree code at 246c0aa (`src/lib/sky/*`, `src/components/sky/*`, `Navbar.tsx`, `IntroGate.tsx`, `page.tsx`, the `data-sky-quiet` roots, `globals.css`, `Background.module.css`).
- **Lens.** COORDINATION.md's hard constraints (veil-owned code untouched until the veil lands, veil-dependent phases blocked, one ink lease, every transient kind through the veil checks and the scroll cancel, 5 s or less per transient, interface requests with fallbacks for "declined" and "never delivered"), and accessibility (WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3 through the veil, 2.5.8 and 1.4.11 for the toggle, reduced motion, forced colors, more contrast, `data-sky-quiet` on the hero, Contact, footer and side rails).
- **Output.** This file. No other repository file was changed. One scratch script (not in the repository): `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r1-a11y/numbers.mjs`.
- **Limits.** Planning review only. Numbers marked [computed] come from that script. `file:line` cites the worktree at 246c0aa; `PLAN.md:n` cites the current PLAN.md.

## Verdict: revise

2 blocking, 5 major, 10 minor.

Verified with no finding (so the reviser can leave them): green on navy 14.13:1 and on light navy 12.71:1, and the 10% mint fill 1.28:1 [computed]; the 40 x 40 target; the APG rotation-control pattern; the store's reduced-motion and storage rules; forced colors hide the sky (`Background.module.css:27-31`) and the control; the worker still draws a first frame under `motion: 'off'` (`sky.worker.ts:380`, `:278-281`), so `forced-colors:hidden` is the right guard; satellites' near-layer keeps really are 0 at the padded edge and on the ink (`config.ts:80`); the warmest tints give R / (R + G + B) of 0.37 (wake) and 0.42 (star index 7), both far under 0.8; the stable seams in 8.1 match the code (`sky.worker.ts:463-484`, `:193-243`); the I1 fallback's local really is at `meteors.ts:158`.

## Findings

### CA-1 (blocking): the phases land on master first, which inverts the agreed order

- **Section.** 7.0 (Where, One phase one PR, Shippable), 8.1, 8.2 CP-2, 8.5 step 2.
- **Problem.** The plan merges P1 to P7 as PRs while the veil commit is pending, says master could deploy after each, and asks the veil session to rebase onto them. COORDINATION.md says the opposite: the veil fix lands first and this plan rebases onto it. 8.5 then says "rebase this branch onto their commit", which no longer makes sense once P1 to P7 are on master. The notices that are meant to let the veil session rebase go only into `COORDINATION.md` on this branch, which that session never reads.
- **Evidence.**
  - `PLAN.md:2425`: "One phase, one pull request ... merged only after its verification". `PLAN.md:2436`: "After each phase, master could deploy as is."
  - `PLAN.md:2883` (CP-2): "Append a dated entry to `COORDINATION.md` ... so the veil session can rebase onto it." `PLAN.md:2866`: "so their handlers keep working unchanged on top of our phases".
  - `PLAN.md:2937`: "rebase this branch onto their commit (or onto master if they merged it there)".
  - `COORDINATION.md:7`: "Agreed: the veil fixes land first, and this plan builds on top of them." `COORDINATION.md:35` (request 2): "Leave these to the veil session until its commit lands, then rebase on it". `COORDINATION.md:43`: the veil session "edits only the main checkout ... It doesn't touch this worktree or this branch, and commits nothing until the user approves."
  - The base draft carried the same line (`drafts/plan-domain-model-first.md:2497`), and the judge didn't flag it.
- **Fix.** Stack P1 to P7 on an integration branch (for example `claude/sky-ambient-motion-impl`, each phase a PR into it), never master, until checkpoint V. At V, rebase that branch onto the veil commit, run 8.5, and only then merge to master. Reword 7.0 to "the integration branch could deploy as is". If the user wants P1 to P7 on master earlier, first get the veil session's explicit agreement by SendMessage (it would then rebase its uncommitted work onto ours) and log it. Send CP-2 notices by SendMessage as well as logging them.

### CA-2 (blocking): the static comet is unblocked and bypasses the veil checks and the scroll cancel

- **Section.** 6.12 (Static comet row), 7.2 phase map, P12, AC-25.
- **Problem.** COORDINATION.md names the comet among the transients that must go through the veil checks, the same veil and ink budget, and the scroll cancel. The plan says the comet needs no veil machinery and may ship before the veil commit. As specified, it can sit over copy:
  - It moves by the camera law (q × 0.07 of the scroll), while quiet rects move with the whole scroll. A scroll inside the hero therefore slides the hero copy under a comet whose box was only checked "on layout".
  - One quiet factor at a point cannot dim a 90 to 180 px tail.
  - R2's "fades with the hero" is not carried over. Past the hero, the comet would sit over About copy, which has no rects at all.
  - It holds no lease, so it can light copy while a lease-holding meteor does.
- **Evidence.**
  - `PLAN.md:2363`: "Static comet | Not a transient ... | Near-layer keeps (no light near copy); its whole box outside the padded rects, re-tested on layout | ... Needs no veil machinery, so it could follow P2."
  - `PLAN.md:2534`: "P12 | each "could" kind | **yes** (comet and planet: no) | P9 (comet and planet: P2)". `PLAN.md:2843`: "they need no veil machinery, so they could follow P2 if the user wants them early."
  - `COORDINATION.md:34`: "Every transient that can pass over `data-sky-quiet` copy (meteor, burst, earthgrazer, satellite, comet) is planned through the same veil checks, drawn with the same veil and ink budget, and obeys the scroll cancel."
  - `scene.ts:63` moves rects by the full scroll (`y: zone.y - offsetY - QUIET.padding`); `PLAN.md:419` moves the comet by 0.07 × q of it.
  - Coma alpha up to 0.6 (`PLAN.md:2363`; R2 §6.2 says 0.25), against about 0.08 of white headroom for slate body text at 4.5:1 [computed: 0.078].
  - AC-25 (`PLAN.md:3047`) checks "no part inside a padded quiet rect" without saying "during scroll".
- **Fix.**
  - Mark the comet blocked on V, like every other transient, in the phase map and in P12.
  - Either bring it under request 1 (a per-sample veil along the coma and tails, the shared scroll cancel or a scroll-coupled fade, a hero-scene fade, and the ink lease while any part is within the feather), or ask the veil session for an explicit exemption in the CP-0 message, with the cases above, and log the answer.
  - Make AC-25 hold while scrolling and through the hero-to-reading blend.

### CA-3 (major): the open phone menu covers a pause control that keyboard focus can still reach (WCAG 2.4.11)

- **Section.** 6.8 Placement.
- **Problem.** The plan says the covered control is fine because "the menu is modal". It isn't modal for the header: the menu makes only `#content` inert, and the header's own controls stay in the tab order. The panel covers the right 75% of the screen above everything except the burger. The control, beside the burger with no z-index, is under the panel but still focusable, so Tab or Shift+Tab inside the open menu lands on a control that author content hides entirely: a 2.4.11 (AA) failure.
- **Evidence.**
  - `PLAN.md:1681`: "While the phone menu is open its panel covers the control. That is fine: the menu is modal."
  - `Navbar.tsx:52-53`: only `document.getElementById('content')` gets `inert`. `page.tsx:32` and `:44`: the Navbar sits outside `#content`.
  - `Navbar.tsx:127`: the panel is `fixed right-0 top-0 h-screen w-3/4 ... z-[50]`. `Navbar.tsx:117`: only the burger has `z-[100]`. The plan's control (`PLAN.md:1671-1672`) has no z-index.
- **Fix.** While `mobileMenuOpen`, make the control's wrapper `inert` (or don't render it), or lift it above the panel like the burger. Add to P5's checks and AC-28: with the phone menu open, Tab and Shift+Tab never land on a covered control.

### CA-4 (major): there is no veil over reading copy, but the plan says stars fade before they reach a paragraph

- **Section.** 2.2 (Reading row), D2, AC-30, section 11 (1.4.3).
- **Problem.**
  - Only `data-sky-quiet` copy gets quiet rects, and About, Experience, HowIBuild, Projects and OtherProjects don't carry it. At D2's default 0.35 reading drift, stars at reading levels slide straight through body text with no dimming, at about three times the body-text headroom.
  - Static stars already sit behind some reading copy today, so per-moment exposure is similar. But the plan's claim is false, AC-30 claims 4.5:1 without limiting it to quiet copy, and D2's trade-off is mis-stated.
- **Evidence.**
  - `PLAN.md:102`: "A star drifting toward a paragraph fades over the 40 px feather before it reaches the text, which takes half a minute at 1 px/s." It came from `drafts/plan-experience-first.md:48`.
  - `mountSky.ts:34`: `QUIET_SELECTOR = '[data-sky-quiet]'`. The attribute exists only at `Introduction.tsx:14`, `ContactMe.tsx:11`, `AppFooter.tsx:13` and `SidePane.tsx:23`. `AboutMe.tsx:14`: `<FadeInSection id="about" isNumbered>`.
  - Reading-level star alphas reach 0.248 (mid 0.62 × 0.4), 0.234 (near 0.78 × 0.3) and 0.234 (far 0.39 × 0.6), against about 0.078 headroom [computed].
  - `PLAN.md:3052` (AC-30): "Body text keeps ≥ 4.5:1 over the brightest moving star".
- **Fix.**
  - Correct 2.2, and limit AC-30 and the 1.4.3 row to quiet copy.
  - In D2, state that at 0.35 the stars cross unquiet body text, and offer the options: 0, lower reading star levels while drifting, or quiet the reading copy. Quieting it means the veil-owned rect measurement and its 64-rect cap, so it is an interface request.
  - Add an acceptance item for whichever option is chosen.

### CA-5 (major): section 11 and PF call the contrast safe, but the plan's own numbers show a case that isn't

- **Section.** 11 (1.4.3 row), 8.7 PF item 1, AC-30.
- **Problem.** One meteor adds up to 0.053 of white on body text, yet the plan lists the headroom over a far star as 0.026. So one meteor over a far star on body text, under the haze, breaks 4.5:1. The default path can leave this to the veil session's per-class budgets, but PF takes ownership, freezes today's veil "exactly as they are", and declares the budget held.
- **Evidence.**
  - `PLAN.md:3130`: "about 0.053 of white for one meteor, against 0.082 of headroom ... (0.064 under the haze, 0.026 over a far star)".
  - `config.ts:74-75` and `:78`: `LAYERS.far.inkKeep` is 0.1, so a far star adds 0.039 at rest and 0.06 at a twinkle peak on the copy. `config.ts:316-319`: the meteor's 0.053.
  - [computed] 0.064 − 0.039 = 0.025, below 0.053.
  - `PLAN.md:2981`: "Today's `veiledFrom` and `METEOR_VEIL` are stricter than they need to be, not unsafe ... Keep them exactly as they are ... the ink budget holds." `COORDINATION.md:26` gives the same 0.026.
- **Fix.**
  - In section 11, name the far-star case as a known, pre-existing exceedance that the veil's per-class budgets must close, and re-check it at V (8.6 item 8).
  - In PF, close it, for example with `METEOR_VEIL.inkKeep` at about 0.024 (which scales 0.053 down to 0.026 [computed]), or with `LAYERS.far.inkKeep` at 0 while a lease is held.
  - Put the arithmetic in AC-30.

### CA-6 (major): CP-1 can't see the veil commit where it will land

- **Section.** 8.2 CP-1, P0 step 1, CP-4.
- **Problem.**
  - CP-1 inspects only `origin/master-r26syw` and `origin/master`. The veil session works uncommitted in the main checkout, so its commit lands on local `master` first and may never be pushed.
  - The implementing worktree shares that repository's refs, but CP-1 never looks at local `master` or at the main checkout's working tree.
  - The veil session promised to message this planning session, not the future implementer, when its plan is confirmed and its code lands.
  - A missed commit sends CP-4 to the user with a false "still no veil commit", which can start PF.
- **Evidence.** `PLAN.md:2543` and `PLAN.md:2882` (origin refs only). `COORDINATION.md:43`: "It edits only the main checkout (`S:\Documents\repos\Portfolio`, the master working tree, uncommitted) ... commits nothing until the user approves." `COORDINATION.md:68`: "It will message when its plan is confirmed ... and when its implementation lands". `git branch -a` from the main checkout lists the local `master` beside the worktree branch.
- **Fix.**
  - CP-1 also runs `git log --oneline <last-checked>..master -- src/lib/sky src/components/sky` (local master) and a read-only `git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky`.
  - Before CP-4, send a status query by SendMessage.
  - The CP-0 message names the implementing session as the recipient of future landing notices.

### CA-7 (major): PF takes over veil-owned code with no handshake

- **Section.** 8.7 (Trigger, Ownership).
- **Problem.** PF starts on the user's word alone and records the takeover only in `COORDINATION.md` on this branch, which the veil session never reads. If that session is still active, both sides edit the same veil-owned code at once (`veiledFrom`'s planner, `drawMeteor`, `METEOR_VEIL`, the scroll path).
- **Evidence.** `PLAN.md:2978`: "Only the user's decision at CP-4 (D10)." `PLAN.md:2979`: "Record the takeover in `COORDINATION.md`". `COORDINATION.md:41-43`: the veil session resumed on 2026-10-27, works uncommitted in the main checkout, and "doesn't touch this worktree or this branch".
- **Fix.**
  - Before PF, message the veil session (SendMessage through ListAgents, or the user relays it) and name the functions PF takes over.
  - Wait for its answer, or for the user's confirmation that it has stopped, and check the main checkout for uncommitted sky edits. If it is still active, PF waits.
  - Log the exchange in `COORDINATION.md` and `HANDOFF.md`.

### CA-8 (minor): I9 has no fallback for "never answered"

- **Section.** 8.3 I9, 8.7.
- **Evidence.** `PLAN.md:2901`: "We adapt at V. If they say no, satellites also wait for the lease to be free." In PF there is no V and no answer, yet `PLAN.md:2991` runs "P8 to P12 ... exactly as planned". Open question 2 (`PLAN.md:3173`) stays open.
- **Fix.** With no answer, satellites wait for a free lease (the conservative reading of COORDINATION request 1) until the veil session agrees. Say so in I9 and in PF.

### CA-9 (minor): PF contradicts itself

- **Section.** 8.7.
- **Evidence.**
  - `PLAN.md:2983` keeps "the 40 s crossing cooldown", but I8's never-delivered fallback (`PLAN.md:2900`) says "take the conservative 55 s cooldown".
  - PF's verification (`PLAN.md:2990`) includes AC-16, while PF leaves "the cosmetic star pop when rects are re-measured mid-ease" open (`PLAN.md:2988`), and 8.6 uses AC-16 for exactly that pop (`PLAN.md:2970`).
- **Fix.** Say 55 s in PF item 3. Split AC-16 into "drift across a quiet edge" (PF keeps it) and "re-measure pop" (PF exempts it).

### CA-10 (minor): the default crossing cooldown is predicted to fail AC-38

- **Section.** 6.9 `TRANSIENTS`, deviation 11, P9, AC-38.
- **Evidence.**
  - `PLAN.md:62`: "40 s gives 0.52 to 0.59 crossings a minute against today's 0.50. Parity needs 45 to 55 s". `PLAN.md:2788`: about 0.8 a minute with today's 36% share. `PLAN.md:1942`: `crossingCooldown: 40`.
  - [computed] At 40 s: 0.50, 0.56 and 0.80 crossings a minute for crossing shares of 0.16, 0.19 and 0.36. At 55 s: 0.45, 0.49 and 0.66.
  - `COORDINATION.md:28`: the gap "limits how often visitors see a crossing".
- **Fix.** Start at 55 s (I8's conservative value), and lower it only when H9 on captured layouts passes AC-38.

### CA-11 (minor): P4 extends automatically started motion before the 2.2.2 control exists

- **Section.** 7.0 Gates, 7.2, P4.
- **Evidence.**
  - `PLAN.md:2659`: "The twinkle (and the shooting stars) no longer stop at 90 s while the pointer moves or keys are pressed".
  - The only gate is "P6 (the drift) never merges before P5" (`PLAN.md:2434`), and "After each phase, master could deploy as is" (`PLAN.md:2436`).
  - Section 11 counts twinkle under 2.2.2 (`PLAN.md:3127`), and COORDINATION request 3 leans on today's 90 s idle stop (`COORDINATION.md:36`).
  - P5 depends only on P3 (`PLAN.md:2526`).
- **Fix.** Run P5 before P4 (or merge the two). Widen the gate: no phase extends automatically started sky motion before P5.

### CA-12 (minor): the launch step doesn't enforce the one ink lease

- **Section.** 4.3 T2, 6.9 (one tick, step 3).
- **Evidence.** T2 is "Enforced by: code: `inkLeaseFree`, the launch step" (`PLAN.md:300`). The launch step passes `mayCrossCopy` and enforces T1 there (`PLAN.md:1918`: "counts as failed: T1 is enforced at the one place every transient enters the sky"). It never rejects a plan that returns `nearCopy` after `mayCrossCopy` was false, so the lease depends on every planner, including the veil session's option semantics (R-2).
- **Fix.** In the same step, a plan with `nearCopy` while `!mayCrossCopy` counts as failed. H7 asserts it.

### CA-13 (minor): T3's "zero light inside any padded rect" is unspecified for the meteor-like could kinds

- **Section.** 4.3 T3, 6.12.
- **Evidence.**
  - T3 (`PLAN.md:301`): kinds that never take the lease are "drawn with zero light inside any padded rect".
  - Point flashes, bursts and earthgrazers (`PLAN.md:2359-2361`) are meteor-like, so they would draw through `drawMeteor`. Its veil keeps 0.3 at the padded edge and 0.05 on the copy (`renderSky.ts:205-206`, `config.ts:319`).
  - During a scroll-cancel fade or a mid-flight layout change, they can add light to copy while a lease holder does. T7 is per kind, so they may overlap a lease holder.
- **Fix.** Specify their drawing: `drawMeteor` with near-layer keeps (a `veil` argument), as satellites use `LAYERS.near`. Otherwise, forbid their overlap with a lease holder.

### CA-14 (minor): CSS `order` splits the control's DOM order from its visual order (2.4.3)

- **Section.** 6.8 Placement.
- **Evidence.**
  - `PLAN.md:1671`: `className="ml-auto md:order-last"`.
  - For `ml-auto` to put it beside the burger on phones, the control must come before the burger in the DOM (`Navbar.tsx:111`). Placed after it, the auto margin pushes the burger left beside the logo.
  - `md:order-last` then shows it last on desktop while it is focused second, after the logo. WCAG technique C27 asks for DOM order to match visual order.
- **Fix.** Require DOM order to equal visual order at every breakpoint. For example, use two slots: `md:hidden` beside the burger and `hidden md:flex` after Resume, each rendering the one control. Add the order to P5's keyboard check.

### CA-15 (minor): focus can still leave the screen with the header, and 2.4.7 is the closer criterion

- **Section.** 6.8 (header fix), section 11 (2.4.7 and 2.4.11 rows).
- **Evidence.** `PLAN.md:1690`: "The next downward scroll hides the header again, as today." With focus on the control, the arrow keys and Page Down scroll the page, and `setHidden(current > previous && current > 0)` (`Navbar.tsx:31`) slides the header off screen with focus still inside it. A focused control moved off screen fails Focus Visible (2.4.7) more directly than Focus Not Obscured (2.4.11).
- **Fix.** Don't hide the header while it contains focus: check `document.activeElement` in the scroll callback, or track `focusin` and `focusout`. Cite 2.4.7 beside 2.4.11.

### CA-16 (minor): D1's alternatives (a) and (b) leave out the `data-sky-quiet` duties

- **Section.** 3 D1 alternatives.
- **Evidence.**
  - `PLAN.md:166` offers the hero corner and the footer, both `data-sky-quiet` roots (`Introduction.tsx:14`, `AppFooter.tsx:13`).
  - AGENTS.md: "keep the attribute when editing those components".
  - `Introduction.tsx:15`: the hero entrance "must settle" before the 1.5 s re-measure (`ENTRANCE_SETTLE_MS`).
  - `mountSky.ts:37` and `:40`: every button inside a quiet root becomes a quiet rect, and there are 64 at most.
- **Fix.** Add to (a) and (b): keep `data-sky-quiet`, keep the control's entrance inside the 1.5 s settle, and note that it adds a quiet rect.

### CA-17 (minor): "Pause sky animation" leaves other page motion running

- **Section.** 11 (2.2.2), 12.2.
- **Evidence.** `globals.css:273-278` runs `animation: rotation 5s linear infinite` on every `.gradient-card` border under `prefers-reduced-motion: no-preference`, and the home page uses it through `Card.tsx:7` (OtherProjects). Section 11 argues that decorative motion is not exempt (`PLAN.md:3127`), but the sky's control leaves this animation running.
- **Fix.** Add an open question. The page's 2.2.2 conformance also needs this border animation paused, for example with a root attribute, set by the same store, that applies `animation-play-state: paused`. Otherwise, state plainly that it is outside this plan's scope.
