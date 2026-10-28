# Plan: home-sky ambient motion and transients

## 1. Title and status

- **Status.** Planning only. No file in `src/`, configuration or tooling changes until an implementing session runs a phase from section 7.
- **Date.** 2026-10-27, written in a local desktop session that resumed the cloud planning workflow stopped on 2026-10-25 (`HANDOFF.md`).
- **Baseline.** The meteor-veil fix is committed as cf4d7b8 on master and pushed (`origin/master` is cf4d7b8; 8.1). The implementing branch starts from `origin/master` at cf4d7b8 or later, and the phases run on that one tree in the order of 7.2. The planning branch `claude/quirky-carson-btv2u4` holds only documents and may be rebased onto master later.
- **Inputs.**
  - `research/00-shared-brief.md` (the user's request, verbatim) and `research/01-planning-brief.md` (the settled defaults and this structure).
  - `COORDINATION.md`: the veil session's constraints, confirmed interface, answers to our questions and landed numbers (all 2026-10-27). Every veil name, signature and rule below is checked against cf4d7b8.
  - The research reports: R1 (physics of depth), R2 (meteors and other bodies), R3 (rendering and scheduling), R4 (motion design and the old sky).
  - The code at cf4d7b8, and the Next.js 16.4.2 docs in `node_modules/next/dist/docs`.
- **How this plan was made.** A judge built it from three planner drafts (`drafts/`), and adversarial checkers and four auditors (Next.js 16.4 docs, codebase conventions, DRY, separation of concerns) reviewed it in rounds. `REVIEW-LOG.md` records each round; where it and this plan disagree, this plan holds.
- **Evidence labels.**
  - **[computed]** marks numbers recomputed for this plan with Node 24 scripts in the session scratchpads. Those scripts are not in the repository, and the formulas are in the text.
  - **[R1]** to **[R4]** point to the research reports for derivations and primary sources.
  - `file:line` cites cf4d7b8 (a read-only checkout is at `.claude/worktrees/sky-baseline-cf4d7b8`); if CP-1 finds later sky commits, re-read the cited lines.

**The plan at a glance.**

- **One camera moves the whole sky.** Every star moves by its own nearness times the camera, so scrolling, the new slow drift and an optional lean toward the pointer can never disagree about depth.
- **Nearness comes from brightness.** Brighter is nearer, as with identical lamps, so the faint majority stays almost still and the bright few float.
- **The drift is a closed-form path of a clock.** Three circles ride on each other. That keeps it smooth at any frame rate and bounded, so nothing needs wrapping. It eases in as the stars come out at dusk.
- **Moving stars are drawn from quarter-pixel sprites.** The sprites are pre-rendered, and frames land on the display's refreshes only as often as the stars' speed needs.
- **A navbar control pauses all sky motion** (WCAG 2.2.2).
- **Then one scheduler runs every short-lived event.** Shooting stars come from realistic directions about 3.4 times as often, followed by fireballs and satellites. One ink lease means only one of them can ever light up near the copy.

**How to read this.**

| Section | Contents |
|---|---|
| 2 | The result |
| 3 | The choices left to the user |
| 4 | The model everything else follows from |
| 5 and 6 | The design |
| 7 | The phases an implementer follows |
| 8 | The veil commit this plan builds on |
| 9 to 11 | How "done" is checked |

### 1.1 Deviations from the planning brief

Each deviation was argued in at least one draft and accepted by the judge, or came from a check round (`REVIEW-LOG.md`).

| # | Deviation | Reason |
|---|---|---|
| 1 | The drift eases in over 3 s from the **dusk** (the loader starting to lift), not from the reveal. | The stars come out already moving, and the ease ends at 6.0 s after load, as the side rails finish fading in, so no motion begins after the visitor starts reading. R3 §6 multiplies the drift by the dusk ramp, and R4 §2.4 says "ease in with the dusk emergence ... Never start it later". A motion onset captures attention (Abrams and Christ 2003). |
| 2 | The epicycle **phases** become (0.70, 0.00, 2.09) instead of R1's (0.9, 2.4, 4.7). Ratios, shares, period and speed are unchanged. | R1 left the phases "to review" (R1 §9). Its phases start the stars moving 61° upward, the old sky's direction, and keep them within 30° of level for only 16 of the first 60 s. The new phases keep them within 30° of level for 53 of those 60 s, drifting right. The exact wander bound grows from 190.9 to 205.2 px at q = 1 [computed]. |
| 3 | When motion stops or comes back (the pause control, a reduced-motion switch), one **motion level** eases the drift and twinkle out or in over 0.3 s (a smoothstep), instead of R3's immediate stop. | Today, turning reduced motion on drops every twinkling star to its resting brightness in one frame. A near star one standard deviation into its twinkle is 11 to 22% off its rest (`LAYERS.near.twinkleSigma`). The pause control makes that switch common. 0.3 s keeps R4's AC-27 within rounding: the brightest star at peak speed moves 1.02 px after the switch [computed]. |
| 4 | **No `FrameClock` module** (R3 §2.1). The pure pacing policy goes to `src/lib/sky/pacing.ts`. The `requestAnimationFrame` and timer handles stay worker variables. | The `scroll` handler reads `rafId` and `timerId` directly (`sky.worker.ts:535`), and they are a few handles bound to the orchestrator's state (5.2): a module would only wrap them. |
| 5 | On WebKit's unaligned 15 ms worker clock, the drift's caps still apply: an iPhone draws every third tick (22.2 fps). Uncapped motion (meteors, scrolling) still draws every tick there. | R3 §2.3 says to use k = 1 because dividing the clock "would beat against the screen". At phone drift speeds that beat moves a star about a third of a 0.37 device px step, which is invisible. Drawing at 66.7 Hz would bypass the battery cap that narrow screens exist for. |
| 6 | The pause control follows the **W3C APG carousel's rotation control**: its name changes with the action ("Pause sky animation" or "Play sky animation") and it has no `aria-pressed`. R2 proposed an `aria-pressed` toggle; R4 proposed both together. | The W3C's own pattern for a button that starts and stops automatic motion; the APG Button pattern rules out R4's combination (6.8 quotes both). |
| 7 | **Only a pause is stored.** Pressing Play under prefers-reduced-motion lasts for the page view: one mount of the home page, so a client-side navigation away and back starts again from storage and the OS setting. | A stored "playing" could override a reduced-motion setting the visitor turns on later. The brief's "paused by default under reduced motion, remembered per viewer" still holds. |
| 8 | The **scroll cancel** is the veil commit's `scrollKept(launchScrollY, scrollY, fade)`, not R2's threshold followed by a 0.2 to 0.3 s fade: the only scroll-cancel rule, for every kind, with the pause fade as its `fade` (T4). | The confirmed interface asks for exactly this: one helper for every kind and no second threshold-plus-fade rule. Tied to the scroll position, it takes a transient away even after a one-step jump. The veil commit evaluates it in `updateMeteor` and `draw`, not in the `scroll` handler, so P8 moves it into the scheduler, never into that handler (6.9). |
| 9 | Fireball flights stay **1.8 to 2.5 s** (R2 proposed 1.8 to 3 s). | A 3 s fireball with its 2.4 s train lasts 5.4 s from first light to last, which breaks the 5 s rule. Today's 2.5 + 2.4 = 4.9 s passes [computed]. |
| 10 | `wrapCell`, `FIELD_PERIOD` and R3's wrapped per-layer accumulators are **dropped**. A one-comparison key-range guard stays. | The drift is bounded, and the scroll term grows by at most one page's scroll range per pause cycle (section 6.5), so no offset nears the key range short of thousands of pause cycles. The guard turns that pathological case into "no stars" rather than wrong ones. |
| 11 | The **crossing cooldown** starts at the reveal: 0 in P8, then the value P9 measures (55 s to start) against the veil commit's crossings a minute (6.9). | It meets that bar with half to two thirds of the cooldown a first-crossing start needs, and keeps the copy calm while the visitor starts reading (6.9). |
| 12 | R4's acceptance items AC-4, AC-7, AC-10, AC-11, AC-15, AC-20, AC-21, AC-24, AC-27 and AC-30 are **amended**, and AC-35 to AC-41 are added. | R4 wrote them for an unbounded straight drift, a 0.25 px step, a 12 to 18 s gap, no climbing and 40 s satellites. The brief settled R1's epicycles, R3's 0.5 px step, R2's rates and the 5 s rule. AC-30 covers quiet copy only, because reading copy has no quiet rects (D2). Section 9 gives each new threshold and its reason. |
| 13 | **Additions** beyond the brief. | Each closes a gap the drafts or the check rounds found: a `presence.ts` model module (one tested presence gate, PR1); the camera's scroll shift, so a resume never jumps (C8); the rest rule (F6, C5), which fixes two wake-up bugs found by simulation; the header that shows itself while it holds keyboard focus (WCAG 2.4.7, 2.4.11; 6.8); the control only while a sky runs (PB4); satellites' first appearance at 30 s + Exp(60 s), capped at 150 s (6.11); the scroll spring's lag cap (`CAMERA.maxLag`, 6.1); stars snapping to whole pixels only until the sky first moves in a page view (M1). |
| 14 | The shower radiant sits on screen on 15% of **desktop** visits, never on phones. | Nearly all of a phone's spawn area lies within 25° of any on-screen radiant, where paths are too short for anything but stubs: phone visits with an on-screen radiant failed 31% of launch attempts (one steer each), and every shower meteor they did launch was a stub [computed, check report]. |

## 2. The end goal, worked backwards

Everything in this plan exists to make the scenes below true. Section 2.5 turns them into requirements, and section 9 into checks.

### 2.1 The first minute on the hero (a laptop: 1440 × 900 CSS px, DPR 2, 60 Hz, nothing touched)

About 300 stars are on screen: about 15 bright ones, 70 of middle brightness and 215 faint ones (shares 5.1, 23.5 and 71.5%, R1 §3.1).

| Time after load | What the visitor sees | What makes it so |
|---|---|---|
| 0 to 3.0 s | The loader. | `IntroGate.tsx`, `duration.loader` (`animations.ts:36`), unchanged |
| 3.0 s | The loader starts to lift and the dusk begins: the brightest stars come out first and the faint dust follows over about 1.3 s, with the haze glowing in by 5.3 s. The stars are **already drifting, from zero speed**, so the motion never "starts": it grows as they appear. | `EMERGENCE` (`config.ts:179`); the drift eases in from the dusk (6.1) |
| 3.75 s | The page is revealed. The hero copy rises in and settles by about 5 s, and the navbar drops in, the pause control last. | `IntroGate.tsx:54`, `:94-100`; `Navbar.tsx` stagger |
| 5.25 to 6.0 s | The side rails fade in. | `SidePane.tsx:26` (delay 1.5 s, `duration.entrance` 0.75 s) |
| 6.0 s | The drift reaches full speed. The bright stars glide right at about 3 CSS px/s; the faint majority creeps at under 1 px/s, still unless you stare. The bright stars slide **over** the nearly still faint ones, so the sky separates into depth: a window, not wallpaper. | one camera; depth from brightness (6.1) |
| 6 to 63 s | The glide heads right and arcs slowly. Measured from the dusk, the heading is 19° up-right at 5 s, level by about 15 s, 7° down-right at 30 s, 16° at 45 s and 52° at 60 s; the speed swells to 1.18 times its nominal speed and eases to 0.68 times it. It never stops, never reverses and never bobs [computed]. | the phases chosen for the first minute (6.1) |
| 8.25 to 10.75 s | The first shooting star, at today's moment: it lights up in open sky, streaks for about a second, cools to its wake color and burns out, all in open sky, since the copy rests through the crossing cooldown. | `METEOR.firstDelay` (`config.ts:253`); the cooldown (6.9) |
| by 60 s (after P9) | About **five** shooting stars (median 5, and 3 to 6 in about 90% of simulated visits), against 2 today. About 3 in 4 fall, some slant sideways and the odd short one climbs. About 4 in 10 come from the visit's shower, so several fan out from one patch of sky. They differ in speed and color: quick ones with mint wakes, slow warm ones, white ones in between. They differ in brightness too, as real ones do: on average about 0.6 of today's peak, about 1 in 8 faint, and those high in the window nearly as bright as today's (6.10). None crosses the copy until the cooldown that starts at the reveal ends (55 s to start); after that, now and then one glides on behind the tagline or the name as a faint glimmer (the veil), never two near the copy at once. | the population model (6.10); the ink lease and its cooldown (6.9) |
| some visits | A **satellite** (after P11; a first attempt in 39% of first minutes): a steady pale point sliding across the upper sky for under 5 s, with no tail and no blinking, often fading as it enters Earth's shadow and warming toward orange. A **fireball** (after P10; about 12% of first minutes): slower, brighter and warm, sometimes with a flare and a faint mint train for about 2 s. | 6.11; 6.10 |
| always | The stars still breathe (twinkle), slowly, as today. With pointer lean (P7, optional), moving the mouse leans the stars gently away from the cursor, up to 19 px for the brightest and about 3.5 px for the faint majority. | `catalog.ts:169-177`; 6.1 |

**Minutes two and three.** The heading keeps turning clockwise at about 2° a second: the stars head straight down at about 70 s, left at about 120 s and up at about 150 s. After 3 minutes they are back within about 24 px of where they started, having traced a loop about 170 px across at q = 1. That loop is the floating R1 designed; section 6.1 explains why it never repeats.

**What depth feels like.** Three cues agree, so the sky reads as space even to a passive viewer (R1 §1.3):

- the bright stars move faster than the faint ones (motion parallax);
- they are brighter and bigger (the same order);
- they fade out behind the copy's padding as they drift in, and come back as they drift out (occlusion: the copy is in front).

**What calm feels like.** The faint majority barely moves, so it acts as the still frame that keeps the headline from appearing to slide (induced motion, Duncker 1929; R4 §2.2). Nothing starts, stops or reverses in one frame. Nothing oscillates at the 0.05 to 0.5 Hz rates linked to motion sickness: the drift's frequencies are 0.006 to 0.013 Hz.

### 2.2 Other states

| State | What the visitor sees |
|---|---|
| Scrolling | The stars move with the page at their own depths: the brightest follow 11.2% of the scroll, the faint median 2%. When the page stops they **glide to rest within half a second** with no bounce, like a door on a closer. The glide is short even after a fast fling or a navbar jump, which smooth-scrolls: at most about 25 px for the brightest star on a 900 px screen. A jump that arrives in one step snaps instead of sweeping. |
| Reading (past 1.3 viewport heights) | Dimmer stars, no twinkle and no transients, as today. The drift continues at 0.35 of the hero rate: near stars at about 1 px/s (at most 2.4), faint ones at about 0.3. Alive if you look, still if you read. Reading copy has no quiet rects (only the hero, Contact, the footer and the rails carry `data-sky-quiet`), so, as today, a star may sit behind a paragraph at the reading levels (alpha at most about 0.25); the drift now carries such stars slowly across it. (Decision D2 can choose 0, today's still reading sky, or other ways to reduce that.) |
| End bookend (Contact and footer) | The sky brightens back (stars 0.9, haze 0.7), twinkles again (0.8) and drifts at 0.8. No transients unless the "farewell meteors" could-kind ships (D4), and those fly only around Contact and the footer. |
| A phone (393 × 852, DPR 2) | About 108 stars, mostly dimmed near the copy. The drift clock runs at 0.6, so the near stars move about 1.7 CSS px/s, which looks like 3 arcmin/s on a phone (R1 §4.2). At most 30 frames a second, typically 20. After P9, at most 6 shooting stars a visit: about every 22 s while a path in clear sky fits beside the copy, the crossing cooldown keeping all but one or two in clear sky; where none fits (H9 measures how often), a launch waits for the lease, so they come about once a minute and each dims near the copy, as nearly all of the veil commit's phone flights do. There are no fireballs, satellites or lean. The pause control sits beside the menu button. |
| prefers-reduced-motion | Exactly today's still sky: fades only. There is no drift, twinkle, scroll parallax, glide, lean or transient, and stars sit at whole pixels as today. The pause control shows "Play sky animation". Pressing it opts in to motion for this page view only. |
| Pressing pause | Within 0.3 s the drift slows to a stop and the twinkle settles to its resting glow. Even the brightest star at its peak speed moves only about 1 px after the press. A flying shooting star fades out within 0.2 s (from P8; until then it vanishes as today). Nothing new launches. The control turns into a play triangle named "Play sky animation". |
| Pressing play | The drift picks up from exactly where it stopped (WCAG G4), and scrolling moves the stars again from where they are, with no jump, even after scrolling while paused. No shooting star for 3 s. |
| Paused, then reloaded | Still paused. Another open tab follows the change. |
| No input for 90 s | The drift and twinkle ease out over 4 s, transients pause and the worker stops drawing. Any scroll, pointer move, key or focus eases them back over 4 s from the same place. |
| Hidden tab | No frames. On return, the sky is where it was (no leap of speed × time away) and no shooting star comes for 3 s. |
| Resize | No star moves except as the new layout requires. Crossing the 640 px phone breakpoint changes speed, never position. |
| forced-colors | The sky is hidden (unchanged, `Background.module.css:27-31`) and the pause control with it. |
| prefers-contrast: more | Dimmer stars and no haze, as today. The drift is allowed (R4 AC-29). |
| print | The sky is hidden (unchanged). |

### 2.3 The ideas in plain words

- **The train window.** From a train, the fence rushes by, the trees glide and the mountains crawl. Nothing moves but you; the speed differences tell your brain the distances. That is motion parallax, and it is the whole 3D effect here.
- **An honest diorama.** Real stars are so far away that no amount of moving shows parallax: even New Horizons, 47 AU out, saw the nearest star shift by about half an arcminute (R1 §2.1). So we build a diorama, like Disney's 1937 multiplane camera: the stars hang at modest depths and one camera moves past them. Inside the diorama the physics is consistent (one camera, one law). The diorama itself is a conceit, and the PR description should say so.
- **Streetlights.** On a street of identical lamps, the dimmer a lamp looks, the farther away it is. Each star's nearness is read from its brightness the same way, so bright means near means fast.
- **A boat on a mooring.** The camera floats rather than travels. Its path is a set of epicycles, Ptolemy's circles riding on circles. It always moves, never races, turns its heading about 2° a second and never repeats. It stays within about 200 px of where it started, like a moored boat swinging on the tide.
- **A door closer.** Scrolling hands the camera to a critically damped spring. Like a good door closer, it follows quickly and settles in half a second without bouncing.
- **The ice-cube tray.** The pixel grid is an ice-cube tray and a star's light is a spoonful of water. Rounding always pours into the middle of one cell, so a drifting star hops a whole cell at a time (ticking). Smearing the pour makes the star blur and pulse as it crosses cell edges. Instead we pour 16 trays in advance, each at a different quarter-cell offset, and set down the one that matches where the star really is: it glides without blurring or pulsing.
- **The drummer and the metronome.** A timer is a drummer who drifts against the band's metronome, so every so often a beat is held long and you hear a stumble. Animation frames divided by a whole number are a drummer who hits exactly every second or third click.
- **Spark, ship, airplane.** What the user calls "the comet" is a **meteor**, a shooting star: a grain of dust burning up 100 km overhead in under a second, like a spark off a grinding wheel. A real **comet** is a mountain of ice millions of kilometres away that hangs in the same spot for days, like a distant ship's lights. A **satellite** is a machine lit by a Sun that has already set for you, gliding steadily, like an airplane with its blinking lights off (R2 §1).
- **Snow in the headlights.** Driving through falling snow at night, the flakes seem to stream out of one point ahead of the car. Meteors in a shower do the same, and that point is the radiant.
- **A one-lane bridge.** The copy's contrast budget has room for one light at a time. Only one transient may cross near the copy at once (it holds the ink lease); everything else takes the clear-sky road. The bridge rests for a while after each crossing, and at the start of a visit.

### 2.4 What this plan deliberately doesn't do

Each of these was considered and left out:

- No sky rotation: it adds no depth, and it adds a speed gradient that contradicts brightness.
- No dolly, zoom or warp: that is the screensaver look, and looming captures attention.
- No depth-coded color (physics and perception disagree) and no depth-dependent twinkle (twinkle happens in the air, not in depth).
- No bokeh dust layer in v1.
- No device orientation: it needs a permission prompt, and Apple's Reduce Motion turns tilt parallax off.
- No WebGL: Safari 16.4 to 16.x lacks OffscreenCanvas WebGL2.
- No pre-rendered layer bitmaps: quiet dimming is per star in screen space.
- None of R2's "won't" kinds: outbursts, the ISS, Starlink trains, glints, the Milky Way, zodiacal light, aurora and airplanes.

### 2.5 What must be true (requirements derived from the scenes)

| ID | The visitor experiences | Measurable target | Design | Checks |
|---|---|---|---|---|
| E1 | Depth without input | Band median speeds far < mid < near by the nearness law, adjacent ratios 1.67 and 1.98 (at least 1.6); the order holds on screen | 6.1 | AC-1, AC-2 |
| E2 | One coherent motion | Every star at world − q·C; one heading at any instant | 6.1 | AC-3 |
| E3 | Calm: no onsets, stops, reversals or rhythms | Speed 0.58 to 1.42 × v₀; turn at most 4.4°/s; no energy in 0.05 to 0.5 Hz; every rate change eased, except that a resize across 640 px steps the speed (never a position) | 6.1, 6.6 | AC-4 to AC-7, AC-9 |
| E4 | Smooth at the pixel | Quarter-pixel phases; a true step of at most 0.5 device px per drawn frame whenever the refresh rate allows it and no frame cap holds the motion (otherwise every refresh, or the cap's rate, is drawn); motion on display refreshes | 6.2, 6.3 | AC-10 to AC-13 |
| E5 | The copy stays calm and readable | Exact quiet factor per star per frame; one lit transient near copy; crossings at the veil commit's level over a visit's first two minutes | 6.4, 6.9 | AC-16, AC-30, AC-38 |
| E6 | Shooting stars feel real and frequent | Median 5 in the first minute; varied radiants with a visible shower; light up and peak in open sky, never fading out at the copy's edge (the veil) | 6.10 | AC-18 to AC-23 |
| E7 | Rare treats | Satellite attempt in 39% of first minutes; fireballs about 1 per 5 to 10 minutes | 6.10, 6.11 | AC-24, AC-37 |
| E8 | Reading is calm | Drift 0.35 ×, twinkle 0, no transients | 6.7 | AC-15 |
| E9 | Phones are calmer and cheap | Clock 0.6 ×; at most 30 fps of drift; at most 6 meteors a visit; no fireballs or satellites | 6.1, 6.2, 6.9 | AC-14, AC-20 |
| E10 | The visitor is in control | Pause stops everything within 1 s, persists, resumes in place; reduced motion is still | 6.6, 6.8 | AC-26 to AC-28 |
| E11 | Nothing jumps | Hidden tab, idle, resize, DPR change, scene change, pause and resume (one sub-pixel settle on the first Play after a still load, M1); snap only beyond one viewport of scroll | 6.1, 6.6 | AC-9, AC-27, AC-32, AC-34, AC-39 |
| E12 | Light on the battery | 0 frames idle, hidden or paused; about 1% of a laptop core while drifting | 6.2, 10 | AC-14, AC-33 |
| E13 | Accessible | WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3, 1.4.11, 2.4.11, 2.5.3, 2.5.8 | 6.8, 11 | AC-26 to AC-31, AC-41 |

## 3. Decisions for the user

Each decision has a recommended default, and the plan is written for the defaults. Every phase starts on the defaults; the "Affects" column names the phases a decision changes. Only D4 must be answered first, before each could kind in P12. D10 and D11 went with the wait for the veil commit; the other numbers are kept.

| # | Decision | Recommended default | Alternatives and their cost | Affects |
|---|---|---|---|---|
| D1 | **The pause control: placement, pattern, persistence** (required before the drift ships, WCAG 2.2.2) | **Placement and look.** In the navbar, at the top of the page: visible on load, on any upward scroll and whenever focus enters the header (it slides away with the header while the visitor scrolls down). Last in the row after Resume on desktop, beside the menu button on phones (out of the tab order while the open phone menu covers it). It is a 40 × 40 px icon button, green like the menu button.<br>**Pattern.** The APG rotation control: the name says the action and changes with it ("Pause sky animation" / "Play sky animation"), the glyph shows the action (two bars or a triangle), and there is no `aria-pressed`.<br>**Persistence.** A pause is remembered in this browser. It starts paused under reduced motion, and Play there lasts for the page view.<br>**Visibility.** It shows only while a sky is running. | (a) **Hero corner** (bottom right): "adjacent to the moving content" (G186), but it scrolls away with the hero. `SkyPauseButton.tsx` then gains `'use client'` as an island entry inside `Introduction.tsx`, which stays a Server Component (5.2).<br>(b) **Footer**: the weakest for G186, which asks for the top of the page or next to the motion.<br>Both (a) and (b) put the control inside a `data-sky-quiet` root: keep the attribute and AGENTS.md's quiet-copy precondition (the control and its ancestors keep no static transform translation and no opacity below 1 at rest, because the sky measures net of every translation and reads contrast from `color` alone), so its entrance may slide and fade but must settle to neither; give it the host's entrance (the hero's `StaggerItem`, the footer's named `motion/react-client` imports, AGENTS.md) or one inside the control, settled within the 1.5 s re-measure (`ENTRANCE_SETTLE_MS`, `mountSky.ts:52`); and count it as one more quiet rect of the 64 (`mountSky.ts:40-41`). That holds because its name is an `aria-label`: hidden text would add a second, invisible rect, since the measurement takes each text line's box and clipping doesn't shrink it.<br>(c) **Inside the phone menu**, with a visible text label: less discoverable.<br>(d) **An `aria-pressed` toggle** with the constant name "Pause sky animation": a valid APG pattern, but the pressed state then needs its own visual of at least 3:1 (a 10% mint fill is only 1.28:1 [computed]).<br>(e) **A stored Play that overrides reduced motion on later visits**: it could override a setting the visitor turns on later. | P5 |
| D2 | Drift while reading | 0.35 of the hero rate (R1 and R4 agree) | 0: today's still reading sky, and the worker sleeps while reading (it saves about 20 frames a second there). 0.2: in between. 0.5: livelier; the brightest star reaches 3.4 px/s at its peak.<br>At any rate above 0, stars at the reading levels (alpha up to about 0.25, like today's still ones) slide behind body text, because reading copy has no quiet rects. To reduce that: lower the reading star levels while drifting, or quiet the reading copy (the veil session's rect measurement and its 64-rect cap, so an interface request). AC-30 checks the chosen option. | P6 |
| D3 | Pointer lean (desktop, fine pointer, hero only, full motion) | Ship P7 with a reach of 12 CSS px at nearness 1 (R1): ±19 px for the brightest star, ±3.5 px for the faint majority. While the pointer moves, frames follow the lean's speed (every refresh in a brisk sweep, 10.2). | Reach 7, which is R4's 2, 4 and 7 px per layer under the same law, so subtler. Reach 10 (the iOS motion-effect size for the near band). Pace the lean at the drift's rate: no extra frames, but steps of 1 to 3 device px in brisk sweeps at DPR 2 [computed]. Or skip it: the drift alone carries the depth. Never device orientation. | P7 |
| D4 | Which "could" transients ship | None in v1. First candidates afterwards: the near-radiant point flash (cheap, and it completes the on-screen radiant), then bursts, then two "farewell" meteors around Contact and the footer (which widen the launch gate, 6.12; on tall screens they fly only in the page's last few hundred px of scroll, 169 at 2560 × 1440, and never at 3840 × 2160) | Earthgrazers (wide screens only). A static comet or a planet (6.12): both change the reviewed composition and need a review, and a comet can read as a rendering bug; under the one scroll rule (`scrollKept`) a comet is gone for the page view after its first 24 px of scroll (or a scroll fade of its own, under 6.12's condition). Each is a small, separate phase (6.12). | P12 |
| D5 | A test runner | None in the repository. Verification uses scratch harnesses that load the real modules (7.1) and an uncommitted debug patch, kept as evidence in each PR description. | Vitest: the `vitest` dev dependency, a `test` script and a `vitest.config.mts` that maps `@/` (a one-line `resolve.alias`, or `vite-tsconfig-paths` as the Next.js guide uses, `01-app/02-guides/testing/vitest.md:43-44`, `:68-71`, `:92-103`). The harnesses test DOM-free modules in Vitest's default `node` environment, so no `@vitejs/plugin-react`, jsdom or Testing Library; it can run the harness checks in CI. `node --test` with type stripping: no dependency and no source change; the resolve hook from 7.1 is committed beside the tests (`node --import ./register-hooks.mjs --test`). | none |
| D6 | The drift speed v₀ (and its opening heading) | 3 CSS px/s at nearness 1; phases (0.70, 0.00, 2.09) | 2.5: subtler, the same frame cost. 3.3: the most that keeps a DPR-2 laptop on a 60 Hz screen at 30 fps. 4: more obvious; the brightest stars reach about 12 arcmin/s at their peak, the edge of busy, and a DPR-2 laptop needs every frame (60 fps). Rotating all three phases by one angle turns the opening heading (the first-minute headings change, never the speed, turn-rate or bound figures). | P6 |
| D7 | The WebKit main-thread frame relay | Ship without it, then decide after iPhone and macOS Safari tests (P13). | Build the relay (about 40 lines across `mountSky.ts`, the protocol and the worker) if the tests show judder (about 4.5 jolts a second) or a Low Power Mode drain. It couples the sky's frames to main-thread jank. | P13 |
| D8 | Climbing meteors | Allowed as the physics gives them, but only from sporadic sources and at most 0.6 of the longest path, so about 7% of launches climb (R2's soft guard) [computed]. The user asked for "different directions" and "more realistic". | Forbid any path more than 10° above horizontal (R4: a rising streak "reads as a firework"; the old sky's rising path was a fault). That rejects about 13% of candidates, and the planner resamples. | P9 |
| D9 | Satellite pass length | At most 4.8 s, at 1.2 to 2.5°/s: 2 to 5 times a real pass at the window's 40° centre (about 0.5°/s, R2 §6.1), inside the 5 s rule every transient keeps | Realistic 0.5 to 1°/s and up to 20 s, which the pause control would allow. But it breaks the "5 s or less" rule that the veil session's WCAG reasoning relies on, so it needs that session's agreement. | P11 |
| D12 | A satellite (or the comet) beside a shooting star near the copy | No, a look choice the veil session suggests: the shooting star's peak stays the only bright moment. A satellite waits while a lease holder flies, and a meteor takes the lease only while none flies (6.9 steps 2.2, 2.3); about 3% of leases wait [computed, check report]. Contrast doesn't need it (T3). | Let satellites share the sky: they meet the veil session's conditions by construction (T3). The comet keeps the hold either way (6.12), and T7 keeps the could variants, all meteors, apart from a lease holder. | P11, P12 |

## 4. Domain model

Everything in sections 5 to 7 follows from this section. Each entity has one owning module, and each invariant has one place that enforces it.

### 4.1 Who owns what

```
 MAIN THREAD (src/components)                                WORKER (src/components/sky worker files; import only @/lib/sky/*)
 ┌──────────────────────────────────────────────────┐        ┌───────────────────────────────────────────────────────┐
 │ skyPause.ts        Playback: the visitor's pause, │ motion │ sky.worker.ts  orchestration: state, messages, tick;   │
 │                    reduced-motion default, "sky   │ ─────► │                MotionLevel, Camera, Presence and       │
 │                    running" flag                  │ scroll │                TransientSchedule instances; the frame  │
 │ SkyPauseButton.tsx the control (UI)               │ layout │                handles (rafId, timerId, watchdog)      │
 │ mountSky.ts        DOM events -> messages: size,  │activity│ renderSky.ts   StarField, placePoint, drawLayer,        │
 │                    scroll, layout, activity,      │pointer │                drawTransient, drawMeteor (veil)        │
 │                    pointer, motion                │ ─────► │ skyAssets.ts   StarAtlas with phase sprites            │
 │ Navbar.tsx         hosts the control              │ ◄───── │                                                        │
 └──────────────────────────────────────────────────┘ ready  └───────────────────────────────────────────────────────┘
 src/lib/sky (DOM-free model; runs in the worker; the main thread imports only its types and color.ts)
 ┌───────────┬────────────┬───────────┬────────────┬─────────────┬───────────────┬───────────────┬──────────────────┐
 │ config.ts │ catalog.ts │ camera.ts │ pacing.ts  │ presence.ts │ quietIndex.ts │ transients.ts │ radiants.ts      │
 │ every     │ Star (q),  │ Camera,   │ FrameState,│ Presence    │ QuietIndex    │ Transient,    │ SkyWindow,       │
 │ tunable   │ DepthLaw,  │ Spring,   │ FrameDemand│             │ (wraps the    │ TransientSpec,│ Source, VisitSky,│
 │           │ layer bands│ DriftClock│ divisor,   │             │ veil's math), │ registry,     │ SpeedClass, steer│
 │           │            │ DriftGate │ Ease,      │             │ ZONE_REACH,   │ Schedule,     │ meteorKind.ts,   │
 │           │            │           │ RefreshEst.│             │ segmentClear  │ InkLease      │ satellites.ts,   │
 │           │            │           │            │             │               │               │ gaps.ts (kinds)  │
 │           │            │           │            │             │               │               │ bodies.ts (P12)  │
 ├───────────┴────────────┴───────────┴────────────┴─────────────┴───────────────┴───────────────┴──────────────────┤
 │ scene.ts    SceneLevels, sceneAt (ours)            │ screenQuietZones, quietAt, inkAt, quietFactor,             │
 │                                                    │ easedQuietFactor, transientQuietFactor, inkBudget,         │
 │                                                    │ budgetKeeps, scrollKept, sameRects (veil; moved in P1)     │
 │ meteors.ts  Meteor, light curve, drag (shared) │ veiledFrom, planFlight, planMeteor (veil; Course and Steer     │
 │                                                │ types and startArea added by us in P9)                         │
 │ protocol.ts message types   random.ts seeded randomness, Random   color.ts sRGB helpers                         │
 └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Per frame, the data flows one way:

```
 scroll, pointer, keys, focus ──► Presence ─────────┐
 scene (scroll position) ─────► scene.drift ────────┼──► drift rate ──► stepCamera ──► offset C ──► drawLayer: x = world − q·C
 Playback or reduced motion ──► MotionLevel ────────┤                        │
 the dusk (exitAt) ───────────► dusk ease ──────────┘                        └──► camera speed ──► FrameDemand ──► divisor, rAF/timer
 quiet zones (the veil's quietBlend) ──► QuietIndex ─────────────────────────────────────────────► drawLayer: alpha × factor
 TransientSchedule ──► transientDemand ──► FrameDemand;   active transients ──► drawTransient (meteor, satellite)
```

### 4.2 Entities

| Entity | What it is | Owner (file) | Invariants (4.3) | Read by |
|---|---|---|---|---|
| **Star** | One star on its layer's infinite plane: world position (CSS px from the sky origin), alpha, shape, tint, thinning key, emergence delay, twinkle, and new: **nearness q** | `catalog.ts` (`Star`, `cellStars`) | S1 to S5 | `renderSky.ts` |
| **Layer** | A magnitude band of the one star population, with its twinkle statistics, quiet keeps and drawing order. From P2 it has no parallax of its own; its nearness range is derived. | `config.ts` (`LAYERS`), `catalog.ts` (`LAYER_NEARNESS`) | L1, L2 | `catalog.ts`, `renderSky.ts` |
| **DepthLaw** | Magnitude to nearness: q(m) = min(1.6, 10^(−0.14 (m − 1.57))) | `config.ts` (`DEPTH`), `catalog.ts` (`nearness`) | S3 | `catalog.ts`, the worker (pacing) |
| **Camera** | The one viewpoint: an offset C in CSS px for a star at q = 1, the sum of a scroll part, a drift part and a lean part | `camera.ts` (`Camera`, `stepCamera`, `cameraOffset`) | C1 to C8 | the worker; `renderSky.ts` as `SkyFrame.offset` |
| **Spring** | One critically damped axis (value, velocity), stepped in closed form | `camera.ts` (`stepSpring`) | SP1 | Camera only |
| **DriftClock** | The drift path's own time τ (s); the drift offset is a pure function of τ, and its rate a pure function of the gathered `DriftGate` | `camera.ts` (`Camera.clock`, `driftAt`, `DriftGate`, `driftWanted`, `driftRate`) | DR1 to DR3 | Camera; the worker's frame state |
| **SceneLevels** | Multipliers for the scroll narrative: stars per layer, haze, twinkle, and new drift and lean levels, plus the launch gate | `scene.ts` (`sceneAt`) | SC1 | the worker |
| **Presence** | Whether the visitor seems to be here: last input, last return from idle | `presence.ts` | PR1 | the worker |
| **MotionLevel** | 0 to 1: how much motion the preference allows right now, easing over `FRAME.motionEase` when it changes | `pacing.ts` (`Ease`, `easeAt`); the worker holds `motionLevel` | M1 | twinkle, drift rate |
| **Playback** | The visitor's pause choice: paused by default under reduced motion, a pause remembered, Play under reduced motion for the page view | `skyPause.ts` (main thread) | PB1 to PB4 | `SkyPauseButton.tsx`, `mountSky.ts` |
| **MotionMode** | `SkyMotion`: `'full' \| 'reduced' \| 'off'`; `'reduced'` now also means paused | `protocol.ts` (type), `mountSky.ts` (derives it), the worker (obeys it) | PB3 | the worker |
| **FrameDemand** | What one part of the sky needs from the clock: frames per second, whether they must land on display refreshes, and a cap. `frameDemand` maps the `FrameState` the worker gathers at each frame decision to the strictest one. | `pacing.ts` | F1, F3 | the worker |
| **FrameClock** | When the worker wakes and whether it draws. The policy (divisor and hysteresis, `frameDue`, the refresh estimate) is pure. The mechanism (the `rafId`, `timerId` and watchdog handles) stays in the worker (deviation 4). | `pacing.ts` (policy), `sky.worker.ts` (mechanism) | F2, F4 to F7 | the worker |
| **QuietZones** | Padded quiet rects on screen, easing from the previous layout (`QuietBlend`), with a layout that waits for the ease (`next`), which transients answer to and stars don't. Each keeps its measured `headroom`, the white its copy can take: that number is the text class, and `inkBudget(headroom)` its ink budget. | veil: `scene.ts` math (`quietFactor`, `transientQuietFactor`, `inkBudget`, `budgetKeeps`), the worker's `quietBlend` | (veil-owned) | QuietIndex (stars), every transient's drawing |
| **QuietIndex** | Per-tile buckets of the quiet zones, giving every star its exact quiet factor cheaply; the module also owns a zone's reach and the clear-of-copy tests for what we plan ourselves (`ZONE_REACH`, `zoneReaches`, `segmentClear`); meteors keep the veil planner's | `quietIndex.ts` | Q1, Q2, T3 | `renderSky.ts` (one index); satellites, the comet |
| **StarField** | The cache of generated cells, evicted by frame stamp | `renderSky.ts` (`createStarField`) | SF1, SF2 | `drawLayer` |
| **StarAtlas** | Point-spread sprites per tint, shape and quarter-pixel phase, plus the meteor head | `skyAssets.ts` | A1 | `placePoint` |
| **Transient** | A short-lived sky event: an envelope (kind, lifetime, ink lease, clear sky, launch scroll, cancel) around its kind's body (`Meteor`, `SatellitePass`) | `transients.ts` | T1 to T7 | the worker, `renderSky.ts` |
| **TransientSpec** | How one kind is timed and planned (first delay, next attempt, plan, lifetime, moving, the body's `nearCopy`, whether the kind may take the lease, narrow screens, its part of the visit's memory) | `transients.ts` (the type and the registry, kind-agnostic); each kind's module exports its spec (`meteorKind.ts`, `satellites.ts`) | T1, T3 | the scheduler |
| **Scheduler** (`TransientSchedule`) | The active transients and each kind's next attempt: it launches, retires and cancels | `transients.ts` | T1 to T7 | the worker |
| **InkLease** | The right to plan light onto quiet copy. Not an object: it is held by whichever active transient has `nearCopy`, so it can't leak or go stale. | `transients.ts` (`leaseHeld`, `inkLeaseFree`) | T2 | the scheduler, the comet's start rule |
| **LaunchGate** | Whether and where transients may launch this tick (motion, visibility, presence, scene, scroll quiet, field, the contrast preference's ink share) | `transients.ts` (type), the worker (fills it) | T6 | the scheduler; the comet's start rule (P12) |
| **GapLaw** | floor + Exp(mean), capped: one law for every kind's clock | `config.ts` (type), `gaps.ts` (`nextGap`) | T5 | the specs |
| **SkyWindow** | The screen as a pinhole window on the sky: 60° across the longer side, the centre 40° above the horizon | `radiants.ts`, `config.ts` (`SKY_WINDOW`) | RD3 | meteor and satellite planning |
| **Radiant, Source** | A unit direction in the window's frame, its scatter and speed class; each visit has one shower source and three sporadic ones (`VisitSky`) | `radiants.ts` | RD1, RD2 | meteor planning |
| **SpeedClass** | slow, medium, fast: angular speed, duration, wake color, whether a train is possible | `config.ts` (`SPEED_CLASSES`) | RD3 | `radiants.ts`, `drawMeteor` |
| **SatellitePass** | A steady point on a straight line with its fades | `satellites.ts` | T1, T3 | `renderSky.ts` |
| **SkyBody** (only if D4 picks the comet) | A long-lived body hung in the sky: the static comet, moved by the camera law, faded in, kept clear of copy | `bodies.ts` (P12) | C2; T3's keeps, its box clear of every zone's reach; T4's `scrollKept` | the worker, `renderSky.ts` |

### 4.3 Invariants and where each is enforced

"Type" means the compiler enforces it, "code" means one function does, and "harness" means a scratch check (7.1) proves it for the phase's PR.

| ID | Invariant | Enforced by |
|---|---|---|
| S1 | A cell's stars depend only on (layer, cx, cy, `SKY_SEED`). | code: `cellStars` (unchanged) |
| S2 | Every star consumes the same random draws; nearness adds none, so retuning `DEPTH` never moves a star at rest. | code: `q: nearness(m)` reuses the drawn magnitude; harness H6 |
| S3 | `nearness(m)` never increases with m, is continuous across band edges, and lies in [0.240, 1.600]. | code: `nearness`; harness H6 |
| S4 | With the camera at (0, 0) and `snap` true (a sky that hasn't moved in this page view: a load under reduced motion or paused), every star is drawn exactly where it is drawn today. Otherwise each star is within half a device pixel of that point (its quarter-pixel phase). | harness H2 |
| S5 | Alpha, shape, tint and twinkle depend on the magnitude only, never on q: a move never changes a star's brightness. | code: `cellStars` |
| L1 | Bands are contiguous and drawn faintest first. Their nearness ranges abut (far 0.240 to 0.389, mid 0.389 to 0.741, near 0.741 to 1.600), so there is no speed jump at a band edge. | code: `LAYER_NEARNESS` derived from `LAYERS` |
| L2 | A layer's quiet keeps apply to each of its stars at its drawn position, every frame. | code: `drawLayer` through `QuietIndex.factor` |
| C1 | The camera only translates: no rotation, zoom or dolly. | type: `Camera` has no such state |
| C2 | One law for every cause: screen = world − q·C. | code: `drawLayer` is the only place stars are offset |
| C3 | Bounded. The drift stays within ΣR + \|ΣR e^(iφ)\| = 68.4 s × v₀ of its start (205.2 px at v₀ = 3 and q = 1; at most 2ΣR = 70.8 s × v₀ for any phases). The lean stays within reach × √2. The scroll part is at most 0.07 × the page's scroll range per pause cycle: each pause, scroll and Play can leave up to one scroll range in `shift` (C8), so only SF2 bounds it absolutely. | code: closed-form drift; harness H5; SF2 |
| C4 | Frame-rate independent toward a held target: one spring step of dt equals two of dt/2. Below the lag cap, a scroll sampled once a frame leaves glides that differ between 30 and 144 Hz by up to about 0.002 × H px for the brightest star; one that ends while the cap holds glides the same at any rate (6.1). The one-step snap (C5) compares steps, so it is rate-dependent by design (above 27,000 px/s at 30 Hz on a 900 px screen). | code: `stepSpring` in closed form, the cap's velocity; harness H5 (difference 0 for the spring) |
| C5 | No jumps. Scene, presence, the motion level and the dusk ease change only the drift clock's **rate**, never its position. The clock advances at most `DRIFT.maxStep` per step. After a rest, a sleep or a hidden tab, the next step has dt 0; otherwise a 100 px scroll after a minute at rest would land in one frame (11.2 px for the brightest star, simulated). The scroll part snaps only when one step changes its goal by more than one viewport (a jump, never a fling or a smooth-scrolled jump), and trails its goal by at most `CAMERA.maxLag` viewports (6.1). | code: `stepCamera` (`lastGoal`, the lag cap), `forgetStep` |
| C6 | The springs follow their targets only under full motion; otherwise they hold, with no velocity. The drift eases out with the motion level. | code: `CameraInput.follow`; the drift rate |
| C7 | The camera starts at rest on the restored scroll, so the first frame neither glides nor jumps. | code: `createCamera(scrollY)` |
| C8 | Resuming full motion continues from where the camera is: the scroll it skipped while stopped joins `shift`, so neither a glide nor a snap follows the next scroll. The decided trade-off: the offset is kept for the page view, so after scrolling while paused the hero shows a shifted patch of sky until a reload (R-14). | code: `resumeCamera` |
| SP1 | Critically damped: from rest, a spring following a scroll that moves one way never passes its target; one reversed just before it stops can carry the brightest star past, then back, by at most about 5 px at H = 900 (6.1). It settles exactly on the target once less than `CAMERA.restPx` of motion is left, and the lag cap's steady trail never passes the target at any frame rate (6.1). | code: `stepSpring`, `settle`; harness H5 (overshoot 0 from rest with 250 ms steps) |
| DR1 | The drift clock never runs backward; its rate is in [0, 1]. | code |
| DR2 | The rate is 0 unless motion is (or is easing out of) full, the dusk has begun, the software-raster budget allows drift, and the scene drifts. | code: `driftRate` over the `DriftGate` the worker gathers at each frame decision (H5) |
| DR3 | The rate eases in over `DRIFT.ease` from the dusk and is the product of smooth factors, so the drift speed never changes in one frame. | code: `driftRate` |
| SC1 | Scene levels are continuous in scroll and need no clock. | code: `sceneAt` (unchanged mixing) |
| PR1 | Any input (scroll, pointer, keys, focus, a return to the tab) resets idleness. Levels ease both ways over `FRAME.idleFadeMs`, and after `idleSleepMs` the ambient motion is 0. | code: `presenceLevel`; harness H11 (bit-identical to today's `idleTwinkle`) |
| M1 | The motion level eases between 0 and 1 over `FRAME.motionEase` when the preference changes. Stars snap to whole pixels only while the sky hasn't moved in this page view (a load under reduced motion or paused); after that, a pause, a reduced-motion switch or Play keeps every star at its quarter-pixel phase, so none hops by up to half a device pixel. The one exception, accepted: the first switch to full motion after a still load moves each star once, as the motion starts, from its whole pixel to its phase (at most half a device pixel per axis, 0.71 diagonally). | code: `easeAt` over the worker's `motionLevel`; `skyMoved`, `SkyFrame.snap` |
| PB1 | Paused when the visitor paused (remembered), or when reduced motion is on and they haven't pressed Play in this page view: one mount of the home page, since the last unsubscribe forgets the cached pause and any Play. | code: `skyPaused`, `subscribeSkyPlayback`; harness H12 |
| PB2 | A storage failure never breaks the page; the choice then lasts for the page view. | code: try/catch in `skyPause.ts`; harness H12 |
| PB3 | One stillness pipeline: paused is motion `'reduced'` in the worker. | code: `mountSky`'s `motion()` |
| PB4 | The control renders only while a sky is running, and never during server rendering or hydration. | code: `skyPlayback` returns null; `setSkyRunning` |
| F1 | Anything that moves draws on animation frames, never on a timer (a stalled clock's fallback aside, F5). | code: demands with `vsync: true` |
| F2 | Each drawn frame stays up for the same whole number k of refreshes. On WebKit's unaligned 15 ms clock, uncapped motion draws every tick and capped drift every ⌈66.7 / cap⌉-th tick. | code: `refreshDivisor`, `stepDivisor`, `frameDue` |
| F3 | While stars move: at least `PACING.minFps`, and at most `PACING.stepDevicePx` per drawn frame whenever the refresh rate allows it (a fast scroll, the start of a glide or a brisk pointer sweep gets every refresh instead), within the demand's cap. | code: `motionFps`, `refreshDivisor` |
| F4 | Nothing moving or changing means no frames, except one timer for the next due transient. | code: the worker's `schedule` |
| F5 | A missing or stalled worker animation-frame clock is answered by a timer within `PACING.watchdogMs`. After `watchdogStrikes` misses in a row the clock moves to a timer armed against the last drawn frame (so messages never push it back), which asks for one animation frame every `PACING.reprobeMs` and returns to them when one arrives. | code: the worker's `requestFrame` and watchdog |
| F6 | A level that eases in from 0 (twinkle, drift) demands frames from the moment it heads up, not once its value passes 0, so a sleeping worker never misses its own wake-up. Today's `frameMode` does this for twinkle (`sky.worker.ts:143-144`). | code: `frameDemand`'s camera and twinkle lines, filled from `driftWanted` and the ambient flag that each frame decision gathers afresh, not the eased levels; harness H4, H13 |
| F7 | When the camera comes to rest, or the motion ease ends, one more frame is drawn, so the resting sky (with no trace of twinkle once stopped) is what stays on screen. | code: `updateCamera` and `easeEnded` set `needsDraw` |
| Q1 | `QuietIndex.factor(x, y, keeps)` equals `easedQuietFactor(blend, x, y, keeps)` bit for bit, as long as no padded zone's quiet math reaches farther than `ZONE_REACH` (`QUIET_REACH` less `QUIET.padding`, which is `QUIET.feather`). | code; harness H3 (difference 0) |
| Q2 | The index's buckets serve stars only (`easedQuietFactor`); transient planning and drawing keep the veil's full checks (`transientQuietFactor`). | code: only `drawLayer` reads the buckets |
| SF1 | Cells in use are never regenerated; unused cells are evicted only when the cache holds more than twice the cells in use. | code: `StarField` stamps |
| SF2 | Cell keys are injective for cells −32,768 to 32,767 on each axis, and outside that range a cell holds no stars (never a key collision). | code: `StarField.cell` guard |
| A1 | Phase (0, 0) sprites are byte-identical to today's sprites, and every phase of a sprite carries the same total light within 0.6% before rounding and 2.5% after it, at any DPR (sprites keep today's sizes, so a shifted Gaussian loses a little tail at one edge): far under what anyone sees (R4 allowed 5%). | code: the separable painter, normalized by the phase-0 peak; harness H1 |
| T1 | Every transient lasts at most `TRANSIENTS.maxLife` (5 s) from first light to last, wake, train and fades included. A cancel never extends a life: a transient retires at the earlier of its lifetime and the tick its kept light (`transientFade`) reaches 0. | code: the scheduler rejects longer plans; harness H10 |
| T2 | At most one active transient holds the ink lease (`nearCopy`), and a new lease begins only `crossingCooldown` after the last one began, or after the reveal. Under D12's default, no transient that never takes the lease is active beside a lease holder (6.9). | code: `inkLeaseFree`; the launch step, which also counts a plan reporting `nearCopy` when its context's `nearCopy` was false as failed |
| T3 | Every transient is drawn through the veil's `transientQuietFactor`, never above the factor of the current zones (`to`) or of a waiting layout (`next`), even mid-ease. A kind that may reach quiet copy is planned through the veil checks. A kind that never takes the lease (`lease` false), or a body P12's `clearSky(body)` marks, is planned clear of every zone's reach (`ZONE_REACH`: our planners through `segmentClear`, the meteor planner with `nearCopy` false through its own test) and drawn with `CLEAR_SKY_KEEPS`, so it adds no light inside any padded rect of `to` or `next` from the frame a layout arrives, by construction for a point of light sampled at its center whose drawn radius is at most `QUIET.padding` (satellites, the point flash; answer 3's condition a). The comet's box test can only fade it when copy moves under it, so it keeps D12's hold (6.12). | code: each planner; `drawTransient`, the one place that picks `CLEAR_SKY_KEEPS` |
| T4 | Every transient obeys the scroll cancel and the pause through one value, `scrollKept(launchScrollY, scrollY, pause fade)`, and retires when it reaches 0. | code: `transientFade`, read by `updateTransients` and the worker's `draw` |
| T5 | Onsets are at least `TRANSIENTS.minOnsetGap` apart. At most 3 flashes per second. No saturated red: R / (R + G + B) < 0.8. | code: the launch step; config review (the warmest drawable tint is 0.42) |
| T6 | Launches only in the hero (if D4 picks farewell meteors, those around Contact and the footer, 6.12), under full motion, visible, revealed, present and settled; narrow screens at most `narrowLimit` per visit, and a kind with a `limit` (farewell meteors) at most that many. | code: `LaunchGate`, the launch step |
| T7 | One transient of each kind at a time. | code: the launch step |
| RD1 | A visit's sources stay fixed until a resize, or a launch allowed near copy none of whose steers fits, re-picks them. A layout keeps them, as it keeps the veil commit's sticky radiant (layouts also fire for harmless re-measures), and so does a hidden tab. Every visit's shower can yield paths, on screen or off. | code: `forgetVisitSky` (resize); `planMeteorTransient` (a failed launch, as the veil commit's `planLaunch` drops a failed radiant); `pickVisitSky` (one usability test for both branches) |
| RD2 | A path climbing more than `RADIANTS.climbDegrees` comes only from a sporadic source and is at most `climbShare` of the longest path (D8: or no path climbs more than 10°). | code: `visitSteer` |
| RD3 | A meteor's speed and length follow the window geometry: short and slow near its radiant, longest 90° away, slower and dimmer low in the window. | code: `radiantMotion`, `meteorRange` |

### 4.4 Ownership

The veil commit (cf4d7b8) is this plan's baseline, so its code is the code every phase edits (8.1). Its rules stay the veil session's: `veiledFrom` never changes, and neither do `METEOR_VEIL`, `INK_BUDGET`, `METEOR_PASS` or `SCROLL_CANCEL`. 8.4 lists the veil symbols this plan uses or extends, and how; everything else 5.1 names is ours.

## 5. Architecture and module map

### 5.1 Files

| File | New or changed | Side | Phase | What changes |
|---|---|---|---|---|
| `src/lib/sky/config.ts` | changed | model | P1 to P12 | `STAR_PHASES` (P1); `DEPTH`, `CAMERA`, and `LayerConfig.parallax` and `LAYERS.*.parallax` removed with the `LAYERS` doc's "scroll parallax" (P2); `PACING` and the `FRAME` doc (P3); `FRAME` idle docs (P4); `FRAME.motionEase` (P5); `DRIFT`, `SCENE.*.drift`, the `ADAPT` doc's drift cap, `ADAPT.thinFade` (P6); `LEAN`, `SCENE.*.lean` (P7); `TRANSIENTS`, with `METEOR`'s scheduler keys and `FRAME.meteorScrollQuietMs` moved into it, `SCENE.heroMeteorMaxScroll` renamed (P8); `GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR.fallbackScale`, the `METEOR` and `METEOR_LOOK` docs (P9); `METEOR_KINDS` and the fireball doc's move (P10); `SATELLITE`, `CLEAR_SKY_KEEPS` (P11); each could kind's entry or block, and `SCENE.endLaunchLevel` with farewell meteors (P12) |
| `src/lib/sky/catalog.ts` | changed | model | P2, P12 | `Star.q`, `nearness`, `LAYER_NEARNESS` (P2); the planet (P12) |
| `src/lib/sky/scene.ts` | changed | model | P1, P6, P7, P8, P12 | `sameRects` moved here, still comparing `headroom` (P1); `drift` and `sceneAt`'s doc (P6); `lean` (P7); `meteors` renamed `launches` (P8); `launches` becomes `launchScene` with farewell meteors (P12); the veil's quiet math and `scrollKept` unchanged |
| `src/lib/sky/camera.ts` | **new** | model | P2, P6, P7 | `Vec`, `Spring`, `Camera`, `CameraInput`, `stepSpring`, `createCamera`, `stepCamera`, `resumeCamera`, `forgetStep`, `cameraOffset`, `cameraSpeed` (P2); `driftAt`, `driftVelocity`, `DRIFT_REACH`, `DriftGate`, `driftWanted`, `driftTarget`, `driftRate` (P6); the lean and `leanWanted` (P7) |
| `src/lib/sky/pacing.ts` | **new** | model | P3, P5, P6 | `FrameDemand`, `NO_FRAMES`, `EVERY_FRAME`, `FADE_FRAMES`, `combineDemands`, `FrameState`, `frameDemand`, `driftCap`, `motionFps`, `refreshDivisor`, `Divisor`, `stepDivisor`, `frameDue`, `RefreshEstimate`, `createRefreshEstimate` (P3); `Ease`, `easeAt`, `easing`, `easeEnded` (P5); `fadeOutAt` (P6) |
| `src/lib/sky/presence.ts` | **new** | model | P4 | `Presence`, `createPresence`, `notePresence`, `isIdle`, `presenceLevel` |
| `src/lib/sky/quietIndex.ts` | **new** | model | P1, P11 | `QuietIndex` (it wraps the veil's `easedQuietFactor`), `createQuietIndex`, `ZONE_REACH` (from `QUIET_REACH`) and `zoneReaches` (P1); `segmentClear` (P11) |
| `src/lib/sky/random.ts` | changed | model | P8, P9 | `Random` type (P8); `gaussian` (P9) |
| `src/lib/sky/transients.ts` | **new** | model | P8 to P12 | kind-agnostic: the union, `VisitMemory`, `PlanContext`, `TransientSpec`, the registry, the scheduler, the lease, the cancel, the demand (P8); `SkyField.pinned` (P9); `PlanContext.sinceReveal` (P10); the satellite kind's entry and D12's hold (P11); the spec's `clearSky(body)`, `LaunchGate.bodyShowing`, and the farewell entry with the scene report, `LaunchGate.scene`, `TransientSpec.scene`, `room` and `limit`, and the per-kind `kindLaunches` (P12, per kind) |
| `src/lib/sky/meteorKind.ts` | **new** | model | P8, P9, P10, P12 | the meteor kind: `MeteorMemory`, `createMeteorMemory`, `planMeteorTransient` (`planLaunch` ported), `METEOR_SPEC` (P8); the visit's sky and its steers (P9); the fireball decision (P10); the could variants, and farewell meteors' spec through `planMeteorTransient`'s second argument (P12) |
| `src/lib/sky/gaps.ts` | **new** | model | P9 | `nextGap`, the one gap law every kind's clock uses (a leaf, so kind modules import it without a cycle) |
| `src/lib/sky/radiants.ts` | **new** | model | P9, P12 | `SkyDirection`, `SkyWindow`, `Source`, `VisitSky`, `skyWindow`, `pickVisitSky`, `visitSteer`, `radiantMotion`, `elevationAt`, `meteorRange` (P9); the point flash (P12) |
| `src/lib/sky/satellites.ts` | **new** | model | P11, P12 | `SatellitePass`, `SatelliteFrame`, `planSatellite`, `satelliteMoving`, `satelliteAt`, `SATELLITE_SPEC` (P11); its `scene` with farewell meteors (P12) |
| `src/lib/sky/bodies.ts` | **new** | model | P12, if D4 picks the comet | the static comet as a `SkyBody`: placement, fades, box test, launch scroll and start rule (over the launch gate), as pure functions (6.12) |
| `src/lib/sky/meteors.ts` | changed | model | P9, P10, P12 | `Course`, `Steer`, the `steer` option in place of the `radiant` parameter, `startArea`, the end guards, the fallback pass's shorter minimum and `clearOf` (I2, P9); the `fireball` option (P10); the `starts` option and `clearOf`'s farewell clause, with farewell meteors (P12); `veiledFrom` unchanged (8.4) |
| `src/lib/sky/protocol.ts` | changed | types | P4 to P8, P13 | `activity` (P4), the `SkyMotion` doc (P5, extended in P6 to P8), `pointer` (P7), `tick` and `relay` (P13) |
| `src/components/sky/sky.worker.ts` | changed | worker | P1 to P13 | camera, presence, the motion ease, the `FrameState` and `DriftGate` it gathers at each frame decision, the frame mechanism, the schedule and `launchesAllowed` (P8), the header and `schedule` docs (P3, P6), the comet's state, pause time, resize retirement, fade-in frames and hand-off, `bodyShowing` and the scene in the launch gate (P12), the relay (P13); the veil's layout and quiet-ease code unchanged (8.4) |
| `src/components/sky/renderSky.ts` | changed | worker | P1, P2, P4, P6, P8, P9, P11, P12 | `StarField` and the quiet index it owns, `placePoint`, `drawLayer`, `drawSky`, `SkyFrame.snap`, `SHAPE_COUNT` and the `easedQuietFactor` and `STAR_SHAPES` imports dropped (P1); `SkyFrame.offset` (P2); `SkyFrame.twinkleTime` and the `time` doc (P4); the thinning fade (P6); `drawTransient` (P8); the wake tint (P9); `drawSatellite` (P11); the `drawMeteor` keeps argument and could cases (P12) |
| `src/components/sky/skyAssets.ts` | changed | worker | P1 | the phased atlas, the separable painter, `starSpriteIndex` |
| `src/components/sky/mountSky.ts` | changed | main | P4, P5, P7, P9, P13 | the activity (P4) and pointer (P7) listeners and `mountSky`'s doc; `motion()` from the pause store, the worker-message `switch` with `setSkyRunning` (P5); the rails' guard named in `copyReader`'s doc (P9); the relay loop, cancelled in `destroy` (P13); the veil's rect measurement unchanged |
| `src/components/sky/skyPause.ts` | **new** | main | P5 | `SkyPlayback`, `skyPaused`, `skyPlayback`, `serverSkyPlayback`, `setSkyRunning`, `setSkyPaused`, `subscribeSkyPlayback` |
| `src/components/sky/SkyPauseButton.tsx` | **new** | main (client) | P5 | the pause control |
| `src/components/icons/PauseSVG.tsx`, `PlaySVG.tsx`, `icons/index.ts` | new, changed | main | P5 | two decorative glyphs on the shared `Icon` frame (`icons/Icon.tsx`), re-exported from the barrel |
| `src/components/Navbar.tsx` | changed | main (client) | P5 | hosts the control last in `<nav>`, in the entrance stagger (and `NAV_STAGGER`'s doc), `inert` while the phone menu is open; the header shows itself when focus enters it and stays while it holds keyboard focus |
| `AGENTS.md` | changed | docs | P5, P11 | one line: the pause control is the sky's WCAG 2.2.2 mechanism, and any new continuous sky motion must stop under `motion: 'reduced'`. It goes after the `data-sky-quiet` line. The worker-file list changes only if P11 splits `renderTransients.ts` out (5.2). |
| `README.md` | changed | docs | P5, P6, P8, P9, P11, P12 | the two sky-folder lines (`README.md:75`, `:80`) name what each phase adds (the pause store and control; the camera, pacing, presence and the quiet index; the transients and the meteor kind; radiants and gaps; satellites; the comet's `bodies.ts`, if built) |

`Background.tsx`, `Background.module.css` and `SkyCanvas.tsx` do not change.

### 5.2 Import boundaries (AGENTS.md)

- **`src/lib/sky/*`** imports only its own files, by relative path. Every new model file (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `transients.ts`, `meteorKind.ts`, `gaps.ts`, `radiants.ts`, `satellites.ts`, `bodies.ts`) imports only `./config`, `./catalog` (`bodies.ts`'s `nearness`), `./scene`, `./meteors`, `./pacing`, `./random`, `./protocol` (types) or each other. None uses React, `window`/`document`, the `@/lib` barrel or `@/lib/utils`.
- **No runtime import cycles.**
  - `radiants.ts` imports `startArea` and types (`Point`, `MeteorField`, `Course`, `Steer`) from `meteors.ts`, and `meteors.ts` never imports `radiants.ts`: the planner defines the contract it consumes and the area it samples.
  - `transients.ts` is kind-agnostic. Its registry imports each kind's spec value (`METEOR_SPEC` from `meteorKind.ts`, `SATELLITE_SPEC` from `satellites.ts`), and a kind module imports only types back, with a statement-level `import type { ... } from './transients'`, never inline `type` specifiers: Node's type stripping, which the harnesses run on, keeps an import whose specifiers are all inline `type` as a runtime import (the Next.js build drops both forms).
  - The values a kind needs come from modules that never import `transients.ts` (`nextGap` from the leaf `gaps.ts`, `segmentClear` from `quietIndex.ts`, `skyWindow` from `radiants.ts`). So the kind modules finish loading before the registry reads their specs, and a temporal-dead-zone error (the registry reading a spec before it exists, which the domain-model draft hit in a first sketch) can't happen.
- **Worker files** (`sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`) keep importing only `@/lib/sky/*` by file and each other. No new worker file is added (deviation 4).
  - If `renderSky.ts` grows past about 400 lines with transients, split `renderTransients.ts` out in P11 and add it to AGENTS.md's list (R3 §7.5).
  - `sky.worker.ts` stays one file, the orchestrator: its frame handles are bound to its state, and the policy they run is pure and tested in `pacing.ts` (deviation 4, 6.2).
- **Main thread.**
  - `mountSky.ts` keeps importing only types and `@/lib/sky/color` from `src/lib/sky`. Its new constants (the activity interval, the pointer query) live in `mountSky.ts` beside `DPR_CAP` (`mountSky.ts:17-27`).
  - `skyPause.ts` imports nothing from `src/lib/sky`. It reads `REDUCED_MOTION_QUERY` from `@/lib/utils` (`utils.ts:20`), as `mountSky.ts:3` does today. `mountSky` then drops its own import, because the store owns the query (one reader of the setting for the sky).
- **Code style** (AGENTS.md): tabs, single quotes, no semicolons, `@/` imports outside `src/lib/sky`, default-exported components, named re-exports in barrels, no namespace imports, and a doc comment on every config constant.
- **`'use client'`.**
  - `SkyPauseButton.tsx` has no directive. It is rendered only by `Navbar.tsx`, which is already the client entry of its subtree (`Navbar.tsx:1`).
  - AGENTS.md says to "add 'use client' only at the entry of an interactive subtree". The Next.js docs put it on "the files whose components you want to render directly within Server Components" (`01-app/03-api-reference/01-directives/use-client.md:10`; also `01-app/01-getting-started/05-server-and-client-components.md:178-180`).
  - If D1 moves the control into a Server Component (the hero or the footer), its own file becomes such an entry and gains the directive; the host stays a Server Component.
- **Bundling.** The worker entry is unchanged: `new Worker(new URL('./sky.worker.ts', import.meta.url))` (`mountSky.ts:84-85`), which Turbopack already bundles as its own chunk today: its docs mention `new Worker()` expressions for magic comments (`03-api-reference/08-turbopack.md:130`) and an asset prefix for Web Worker URLs covering the "entrypoint + module chunks" (`turbopackWorkerAssetPrefix`, `:482`). Every new model file reaches the worker chunk through a static import from `sky.worker.ts`, with no configuration.

### 5.3 Main thread and worker split

```
 main thread                                       worker
 ResizeObserver ──── init/resize ───────────────►  sizes, assets; the camera created on the restored scroll
 Motion scroll() ─── scroll ─────────────────────►  scrollY, parallaxScroll, noteInput        (body unchanged until P8)
 ResizeObserver ──── layout ─────────────────────►  quiet rects, ease, deferred layout        (the veil's, unchanged)
 pointer, keys ───── activity (≤ 1/s) ───────────►  noteInput                                 (P4)
 pointermove ─────── pointer (≤ 1 per frame) ────►  lean target                               (P7)
 skyPause store ──── motion: full | reduced ─────►  motion level eases; springs hold; resume (P5)
 visibilitychange ── visible ────────────────────►  cancel frames, forget the camera's step
                     ◄── ready / error ──────────  first frame drawn (setSkyRunning), or the sky can't run
```

All per-frame work stays in the worker. The main thread only forwards facts (the old CSS sky forced 196 layouts in 3.5 s, R4 §1.4). It sends the pointer at most once per animation frame and activity at most once a second.

### 5.4 Next.js 16.4 notes (from the bundled docs)

- **Client boundary.** See 5.2. Browser APIs such as `localStorage` need a Client Component (`05-server-and-client-components.md`), and the store is only read from client code.
- **No flash before hydration.**
  - The guide notes that "A Client Component that re-renders with client values causes a hydration error" (`01-app/02-guides/preventing-flash-before-hydration.md:11`).
  - The control reads the store through `useSyncExternalStore` with a server snapshot. React uses that snapshot "only during server rendering and during hydration" (react.dev, `useSyncExternalStore`). Both snapshots are `null` at hydration, because the sky reports running only after the worker's first frame, which follows `mountSky`'s effect: nothing renders and nothing mismatches, and the control appears when the store notifies.
  - Not `next/dynamic` with `ssr: false`, a `useEffect` gate or `use(browser())` (`01-app/02-guides/single-page-applications.md:205-221`): the control's first browser render already matches the server HTML, so the guide's condition for `browser()` doesn't hold, and it would add a Suspense boundary for nothing.
  - The navbar also lives in IntroGate's content, which is `display: none` until the reveal and then remounted by a key flip (`IntroGate.tsx:94-100`). So the control the visitor sees mounts fresh on the client with the real state, and no inline script is needed.
- **Workers.** Use the existing `new Worker(new URL(...))` pattern (5.2). Don't use `next/script`'s `strategy="worker"`: "The `worker` strategy is not yet stable and does not yet work with the App Router" (`01-app/02-guides/scripts.md:128`).
- **No Cache Components APIs** (AGENTS.md); nothing here needs them.
- **Verification.**
  - While `next dev` runs, use its MCP endpoint `/_next/mcp` (`get_errors`, `get_compilation_issues`, `compile_route` for `/`) instead of `next build` (AGENTS.md). `get_errors` takes no route: it reads errors from browser sessions with the page open (`01-app/02-guides/mcp.md:54`, `:88`). A hydration error appears only after a full load, and on this page only there, since it would sit in IntroGate's hidden preload tree, which the reveal discards. So full-reload `/` on the implementing server's port first (Fast Refresh and client navigations don't hydrate), and also read the log file `get_logs` names (`:55`).
  - Every phase ends with a production build and the `portfolio-prod` preview (7.0), since production builds minify and mangle export names.

## 6. Detailed design per area

Code sketches follow the codebase: tabs, single quotes, no semicolons, a doc comment on every exported constant, relative imports inside `src/lib/sky`, `@/` imports elsewhere, and `noUncheckedIndexedAccess`. They are plans, not patches: names and contracts are binding, and bodies may be tightened. Imports and module constants arrive with their first reader's phase, since an unread one is a lint warning (`no-unused-vars`, `eslint.config.mjs:13`): P1's `quietIndex.ts` has no `quietAt`, `Point` or `SEGMENT_STEP` (P11 adds them with `segmentClear`), P2's `camera.ts` imports only `CAMERA`, and P3's `pacing.ts` has no `smoothstep` (P5 adds it with `easeAt`). They leave with their last reader: P1's `SHAPE_COUNT` and `STAR_SHAPES` import in `renderSky.ts`, P3's `FrameMode` type, and the meteor imports P8's schedule takes over from the worker. Plan references inside sketch comments (phase tags such as "(P6)", IDs, `file:line`, process wording such as "theirs") are notes for the implementer: committed comments drop them or say the reason in words (7.0).

### 6.1 Camera, depth and drift

#### The law

```
 screen(star) = world(star) − q(star) · C(t)              every star, every cause (C2)
 C(t)         = C_scroll + C_drift + C_lean               CSS px for a star at nearness q = 1
 C_scroll     = (0, 0.07 · s(t))                          s: a critically damped spring (ω = 10 rad/s) on the followed scroll − shift
 C_drift      = E(τ) − E(0)                               E(τ) = Σ_k R_k (cos(ω_k τ + φ_k), sin(ω_k τ + φ_k)), τ the drift clock
 C_lean       = 12 · (ℓx(t), ℓy(t))                       ℓ: critically damped springs (ω = 4 rad/s) on the pointer, P7
 dτ/dt        = scene.drift · presence · motionLevel · duskEase · (narrow ? 0.6 : 1); one step adds at most 0.1 s
 q(m)         = min(1.6, 10^(−0.14 · (m − 1.57)))         nearness from magnitude, no random draw
 ω_k = (2π/180 s) · (1, −1.618, 2.414),  R_k = share_k · v₀ / |ω_k|,  shares (1, 0.3, 0.12),  φ = (0.70, 0.00, 2.09),  v₀ = 3 CSS px/s
```

**Why translation only (C1).** Under a pinhole camera, a sideways move shifts every point at depth Z by f·T/Z, the same amount wherever it is on screen. So per-star offsets q·C are the exact pinhole result. Rotation and zoom move near and far points alike and carry no depth (Longuet-Higgins and Prazdny 1980; R1 §1).

**Integrators** are exact closed forms only (R1 §5.4):

- the spring x(t) = target + (e + (v + ωe)t)·e^(−ωt), which Motion's `spring.mjs` resolves the same way;
- the drift, a pure function of its clock.

Both compose exactly: toward a held target the spring follows the same path at 15, 60 or 144 Hz, and the drift is a pure function of its clock. A moving scroll is sampled once per frame and held over the step, so the spring trails it by V/(2f) less at f frames a second (C4). Never explicit Euler, never a fixed lerp per frame: at 10 fps Euler degenerates, and after a 250 ms stall it overshoots by 27 to 33% (R1 §5.4).

#### Depth: nearness from magnitude (P2)

```ts
// src/lib/sky/config.ts
/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen (CAMERA): 1 at
 * magnitude `reference`, the near band's mean. Identical lamps would give q = 10^(-0.2 (m - reference)), the
 * inverse-square law; `compression` keeps about 70% of that depth range, as STAR_ALPHA keeps a 400:1 flux range as 5:1,
 * so the faintest stars still move (q 0.24) and the brightest never race (at most `maxNearness`, from magnitude 0.11
 * up). The bands' mean shares of the scroll come out at 0.0205, 0.0350 and 0.0717 (far, mid, near), within 12.5% of the
 * reviewed 0.02, 0.04 and 0.07. No random draw depends on it, so retuning it never moves a star while the camera rests.
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const
```

```ts
// src/lib/sky/catalog.ts
export interface Star {
	// …existing fields…
	/** Nearness from the magnitude (DEPTH): the share of the camera's motion this star shows. Costs no random draw. */
	q: number
}

/** Nearness q of a star of magnitude m: its share of the camera's motion (DEPTH). Brighter is nearer, at most DEPTH.maxNearness. */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Each layer's nearness range [faintest, brightest], from its magnitude band, for culling its cells against the camera. */
export const LAYER_NEARNESS = Object.fromEntries(
	SKY_LAYERS.map((layer) => {
		const [from, to] = LAYERS[layer].magnitude
		return [layer, [nearness(to), nearness(from)] as const]
	})
) as Record<SkyLayer, readonly [number, number]>

// In cellStars, after `m` is drawn (catalog.ts:143): no new draw, so S2 holds and the resting sky is unchanged
//	stars.push({ x, y, alpha: magnitudeAlpha(m), q: nearness(m), …the rest as today })
```

P2 removes `LayerConfig.parallax` and the three `parallax` values (`config.ts:58-59`, `:78-80`; their only reader is `renderSky.ts:100`), and the `LAYERS` doc (`config.ts:73`) drops "scroll parallax" from its first sentence's list and gains "How far each star moves comes from its magnitude (DEPTH).", beside the veil's ink sentences.

| Layer | Share of stars | Nearness range | q median | q mean | Scroll share (0.07·q), mean | Today |
|---|---|---|---|---|---|---|
| far (mag 4.5 to 6) | 71.5% | 0.240 to 0.389 | 0.284 | 0.293 | 0.0168 to 0.0272, mean 0.0205 | 0.02 |
| mid (2.5 to 4.5) | 23.5% | 0.389 to 0.741 | 0.476 | 0.501 | 0.0272 to 0.0519, mean 0.0350 | 0.04 |
| near (−0.5 to 2.5) | 5.1% | 0.741 to 1.600 | 0.941 | 1.024 | 0.0519 to 0.112, mean 0.0717 | 0.07 |

[computed] **Why k = 0.14 and not the physical 0.2** (R1 §3.2). A least-squares fit of the reviewed parallax values against band-mean magnitudes gives 0.14, so the reviewed sky already *is* the inverse-square law compressed to 70%. At 0.2 the faint stars would drift too slowly to see, and the brightest would race.

#### The camera's scroll part (P2)

```ts
// src/lib/sky/config.ts
/**
 * The one camera the sky is seen through, in CSS px for a star of nearness 1: every star appears at its place on the sky
 * minus its nearness (DEPTH) times the camera, whatever moves it (the scroll, the drift, a pointer lean), so nearer stars
 * always move more and the depth cues never disagree. Scrolling moves the camera `scrollParallax` of the scroll, the near
 * band's reviewed parallax, through a critically damped spring of `scrollOmega` rad/s: when the page stops, the stars
 * glide on and settle (95% in 0.47 s, 99% in 0.66 s, never overshooting after a scroll that moves one way; Motion's
 * spring with bounce 0 and visualDuration 0.52 s). Scrolling at 1000 px/s, the near stars trail by about 14 px. The
 * spring never trails the scroll by more than `maxLag` viewport heights, held there as a spring trailing steadily at
 * that distance, so a fling or a smooth-scrolled jump (the navbar's section links, and Home and End in most desktop
 * browsers) leaves the brightest stars at most about 25 px to glide on a 900 px screen. A
 * jump of more than `snapViewports` viewport heights in one step (an instant scrollTo, say) snaps instead of sweeping
 * the sky; 0 always snaps, which follows the scroll exactly. A spring with less than `restPx` CSS px of motion left (at
 * nearness 1) settles on its target and stops asking for frames.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, maxLag: 0.25, snapViewports: 1, restPx: 0.01 } as const
```

The trail while scrolling is 2V/ω × 0.07 × q: 14 px at q = 1 and 22 px for the brightest at 1000 px/s. Above about 1,100 px/s (at H = 900) the lag cap holds it at `maxLag` × H × 0.07 × q, 25 px for the brightest, and sets the spring's velocity to ω × lag / 2: that of a spring trailing steadily at that lag (x″ = −2ωx′ − ω²(x − g) with x − g constant), close to the uncapped spring's state at the threshold: sampled once a frame, that spring moves up to 8% faster at 30 Hz and 4% at 60 Hz, which the cap trims in one frame. The velocity `stepSpring` leaves would depend on the frame rate, and at 30 Hz fast flings and scrollbar drags would then overshoot by up to about 5 px [computed]. So a scroll that ends while the cap holds closes the last lag as lag × (1 + ωt/2)e^(−ωt) at any frame rate. Below the cap the scroll is sampled once per frame and held over the step, so the trail is about 2V/ω − V/(2f) at f frames a second: glides after the same scroll differ between 30 and 144 Hz by up to about 0.002 × H px for the brightest star (1.7 px at H = 900, 2.7 at 1,440), against a glide of up to 25 px [computed, `reviser-r4/camera-check2.mjs`]. After a scroll that moves one way the stars never overshoot: the spring's impulse response is never negative, so the error stays one-signed (R1 §5.1) [computed]. A scroll reversed just before it stops can carry the brightest star past, then back: at most `maxLag` × H × 0.112 / (e(2 − ω/2f)) at f frames a second (5.1 px at H = 900 at 30 Hz, 4.8 at 60 Hz, 4.7 at 144 Hz; 4.6 in the continuous limit), approached by a scroll just under the cap whose last sampled goal lands on the spring itself (4.98, 4.81 and 4.69 px simulated at 30, 60 and 144 Hz) [computed, `reviser-r5/reversal2.mjs`].

**Why the snap compares steps, and a cap bounds the lag.** Above ωH/2 (4,500 px/s at H = 900) the trail alone exceeds a viewport, so a snap rule on the lag would snap again and again through an ordinary fling: 6 jumps of about 100 px for the brightest star in 2 s at 5,000 px/s [computed]. A jump (R1 §5.1: "thousands of px in one message") is one step; a fling is many small ones. So is nearly every jump on this site: `html` scrolls smoothly under full motion (`globals.css:55`), the navbar's section links rely on it (`smoothScrollTo`, `Navbar.tsx:73`, `utils.ts:26`), and desktop browsers usually animate Home and End, all in steps of a few hundred px. Uncapped, the spring would trail such a scroll by up to 2V/ω and leave the brightest stars gliding 100 to 180 px after the page stops, like a dog on a long leash that keeps running when its owner stops. `maxLag` shortens the leash: at most 24 px of glide after eased jumps of 3,000 to 20,000 px over 0.3 to 1 s at H = 900, with no overshoot at 30 to 144 Hz [computed].

#### The drift (P6)

```ts
// src/lib/sky/config.ts
/** One circle of the drift. */
interface Epicycle {
	/** Frequency as a multiple of the main circle's; negative turns the other way. */
	ratio: number
	/** Speed as a share of DRIFT.speed. */
	share: number
	/** Starting angle (radians). */
	phase: number
}

interface DriftConfig {
	speed: number
	period: number
	epicycles: readonly Epicycle[]
	narrowRate: number
	ease: number
	maxStep: number
}

/**
 * The floating drift, in CSS px for a star of nearness 1: epicycles, a main circle turning once every `period` seconds
 * with smaller circles riding on it at irrational frequency ratios (the golden ratio and 1 + √2, to three decimals). Each
 * circle moves at share × `speed`, so the speed stays within `speed` × 0.58 to 1.42 (never stops, never races), the
 * heading turns 2° a second on average and at most 4.3°, and the path repeats only after 25 hours. On a laptop (about 1.3
 * arcmin per CSS px) the near stars float at about 4 arcmin/s and the faint ones at about 1, three times and once the
 * slowest motion people notice, so the faint majority reads as still. These phases start the first minute drifting
 * right, within 30° of level for 53 of its 60 seconds; the path stays within 68.4 s × `speed` of its start (205 px at
 * nearness 1), so offsets stay small and nothing wraps. The path is a pure function of a drift clock that runs at the
 * scene's drift × presence × the motion level, `narrowRate` on narrow screens (their CSS px look about 1.35 times
 * bigger), easing in over `ease` seconds from the dusk, so the stars come out already moving; one step advances the clock
 * by at most `maxStep` seconds, so a stalled frame or a returning tab never jumps the sky.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.7 },
		{ ratio: -1.618, share: 0.3, phase: 0 },
		{ ratio: 2.414, share: 0.12, phase: 2.09 },
	],
	narrowRate: 0.6,
	ease: 3,
	maxStep: 0.1,
} as const satisfies DriftConfig
```

Computed for v₀ = 3 [computed: the judge's `drift.mjs` and `heading.mjs`, cross-checked against all three drafts]:

| Quantity | Value |
|---|---|
| Circle radii R = share · v₀ / \|ω\| | 85.94, 15.94 and 4.27 CSS px (ω = 0.0349, −0.0565 and 0.0843 rad/s) |
| Speed range | 0.580 to 1.420 v₀ (1.74 to 4.26 px/s at q = 1) |
| Heading turn rate | mean 2.00°/s, max 4.33°/s; it turns smoothly and never steps. The epicycles carry the heading up to asin(0.42) = 24.8° ahead of or behind the main circle, so a window's mean swings: 1.39 to 2.35°/s over any minute (about 1.4 over the first from the dusk), 1.93 to 2.05 over any 10 minutes, 2.00 over 6 h [computed, `reviser-r6/turnmean.mjs`] |
| Largest change of speed | 3.8% per second |
| Wander bound | exact supremum ΣR + \|ΣR e^(iφ)\| = 205.2 px (68.4 s × v₀; a 6-hour simulation reaches 205.2); for any phases at most 2ΣR = 212.3 px (70.8 s × v₀). R1's phases give 190.9 px. |
| Wander per band | brightest 328, near mean 210, mid mean 103, far mean 60 px |
| First minute, from the dusk (the 3 s ease included) | heading 19° up-right at 5 s, 9° at 10 s, level by 15 to 20 s, −7° at 30 s, −16° at 45 s, −52° at 60 s; speed 0.92, 1.03, 1.18, 1.18, 0.96 and 0.68 v₀ at 5, 10, 20, 30, 45 and 60 s; within 30° of level for 53.2 s and rightward for all 60 |
| Later | clockwise: down at about 70 s, left at about 120 s, up at about 150 s; back within about 24 px of the start at 180 s |
| Exact repeat | the ratios are the decimals 809/500 and 1207/500, so the path repeats exactly after 500 main periods, 25 hours of drift clock |
| Frequencies | 0.0056, 0.0090 and 0.0134 Hz: far below the 0.05 to 0.5 Hz band linked to motion sickness (Diels and Howarth 2013) |

Rotating all three phases by one angle turns the opening heading. It changes the first-minute and later heading rows, never the speed, turn-rate, bound or frequency rows (D6).

**Speeds on screen** (CSS px/s, minimum to maximum over the epicycles, v₀ = 3) [computed]:

| Scene (rate) | Brightest (q 1.6) | Near mean (1.024) | Mid mean (0.501) | Far mean (0.293) | Faintest (0.240) |
|---|---|---|---|---|---|
| Desktop hero (1) | 2.78 to 6.82 | 1.78 to 4.36 | 0.87 to 2.13 | 0.51 to 1.25 | 0.42 to 1.02 |
| Desktop end (0.8) | 2.23 to 5.45 | 1.43 to 3.49 | 0.70 to 1.71 | 0.41 to 1.00 | 0.33 to 0.82 |
| Desktop reading (0.35) | 0.97 to 2.39 | 0.62 to 1.53 | 0.30 to 0.75 | 0.18 to 0.44 | 0.15 to 0.36 |
| Narrow hero (0.6) | 1.67 to 4.09 | 1.07 to 2.62 | 0.52 to 1.28 | 0.31 to 0.75 | 0.25 to 0.61 |
| Narrow reading (0.21) | 0.58 to 1.43 | 0.37 to 0.92 | 0.18 to 0.45 | 0.11 to 0.26 | 0.09 to 0.21 |

At about 1.3 arcmin per CSS px on a laptop and 1.8 on a phone (R1 §4.2), the hero's near mean is about 4 arcmin/s and the far mean about 1 arcmin/s. That puts the far band at the threshold of noticing motion and the near band at three to four times it. Adjacent band ratios are 1.71 (mid/far) and 2.04 (near/mid) by mean nearness, and 1.67 and 1.98 by median: all above R4's floor of 1.6. These are the law's, over the whole catalog (H6). A screen holds few stars of a band (6 near stars on a phone, 14 on a laptop), so the on-screen median can sit well off the law's: the near band's is 0.90 to 1.10 against 0.94 across common sizes in the real seeded sky [computed]. AC-1, AC-2 and AC-15 therefore test the law times the measured camera speed, and only the order on screen.

#### `src/lib/sky/camera.ts` (new; P2 adds the scroll part, P6 the drift clock, P7 the lean)

```ts
import { CAMERA, DRIFT, LEAN } from './config'
import { smoothstep } from './scene'

/** A 2D offset (CSS px) or velocity (CSS px/s). */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: where it is and how fast it moves (its own units per second). */
export interface Spring {
	value: number
	velocity: number
}

/**
 * The one camera the sky is seen through. Every star appears at its place on its layer's plane minus q times the
 * camera's offset (cameraOffset), whatever moves it: the page scroll through a spring, the drift as a closed-form path of
 * its own clock, the lean toward the pointer through two springs. Mutated in place, so a frame makes no garbage.
 */
export interface Camera {
	/** Page scroll the stars follow (page px), smoothed by a critically damped spring. */
	scroll: Spring
	/** Scroll skipped while motion was stopped (page px): left out, so the sky resumes where it stopped (C8). */
	shift: number
	/** Scroll goal at the last step (page px): one step that moves it more than CAMERA.snapViewports viewports is a jump. */
	lastGoal: number
	/** Lean toward the pointer on each axis, -1 to 1. (P7) */
	leanX: Spring
	leanY: Spring
	/** Drift clock (s): the drift path's own time. (P6) */
	clock: number
	/** Worker-clock seconds of the last step; null after a rest, a sleep or a hidden tab, so the next step has dt 0 (C5). */
	steppedAt: number | null
}

/** What the camera follows on one step. */
export interface CameraInput {
	/** Worker-clock seconds. */
	time: number
	/** Page scroll the stars follow (page px). */
	scroll: number
	/** Viewport height (CSS px): a gap of more than CAMERA.snapViewports of these snaps, and the spring trails by at most CAMERA.maxLag of them. */
	viewportHeight: number
	/** Full motion: the springs follow their targets. Otherwise (reduced motion, paused) they hold where they are (C6). */
	follow: boolean
	/** Drift-clock rate, 0 to 1. (P6) */
	drift: number
	/** Lean target per axis, -1 to 1, already scaled by the scene's lean level. (P7) */
	lean: Vec
}

/** Each epicycle as angular frequency (rad per drift-clock second), radius (CSS px at nearness 1) and phase (rad). */
const EPICYCLES = DRIFT.epicycles.map(({ ratio, share, phase }) => {
	const omega = ((2 * Math.PI) / DRIFT.period) * ratio
	return { omega, radius: (share * DRIFT.speed) / Math.abs(omega), phase }
})

/** Farthest the drift carries the camera from its start on either axis (CSS px at nearness 1): twice the radii's sum, a bound for any phases (C3). */
export const DRIFT_REACH = 2 * EPICYCLES.reduce((sum, { radius }) => sum + radius, 0)

/** A camera at rest on the restored scroll position (C7): the first frame neither glides nor jumps. */
export function createCamera(scrollY: number): Camera {
	return {
		scroll: { value: scrollY, velocity: 0 },
		shift: 0,
		lastGoal: scrollY,
		leanX: { value: 0, velocity: 0 },
		leanY: { value: 0, velocity: 0 },
		clock: 0,
		steppedAt: null,
	}
}

/**
 * Moves a critically damped spring toward `target` over `dt` seconds with the exact solution
 * x(t) = target + (e + (v + ωe)t)e^(-ωt): the same path at any frame rate (a 15 fps timer, a 144 Hz display, a frame after
 * a stall), never past the target from rest. motion-dom resolves critically damped springs with the same closed form.
 */
export function stepSpring(spring: Spring, target: number, omega: number, dt: number): void {
	const offset = spring.value - target
	const slope = spring.velocity + omega * offset
	const decay = Math.exp(-omega * dt)
	spring.value = target + (offset + slope * dt) * decay
	spring.velocity = (spring.velocity - omega * slope * dt) * decay
}

/** Puts a spring on its target once less than CAMERA.restPx of motion (CSS px at nearness 1, after `scale`) is left. */
function settle(spring: Spring, target: number, omega: number, scale: number): void {
	if (scale * (Math.abs(spring.value - target) + Math.abs(spring.velocity) / omega) >= CAMERA.restPx) return
	spring.value = target
	spring.velocity = 0
}

/**
 * Advances the camera to `input.time`: the springs by the true elapsed time, the drift clock by at most DRIFT.maxStep of it
 * (C4, C5). Returns true while anything still moves, so the worker keeps asking for frames.
 */
export function stepCamera(camera: Camera, input: CameraInput): boolean {
	const dt = camera.steppedAt === null ? 0 : Math.max(0, input.time - camera.steppedAt)
	camera.steppedAt = input.time
	const goal = input.scroll - camera.shift
	// One step's change of goal, not the spring's lag: a fast fling trails far behind without ever jumping in one step
	const jumped = Math.abs(goal - camera.lastGoal) > CAMERA.snapViewports * input.viewportHeight
	camera.lastGoal = goal
	if (input.follow) {
		if (jumped) {
			// A jump in one step (an instant scrollTo, say): a spring would sweep the near stars across the screen
			camera.scroll.value = goal
			camera.scroll.velocity = 0
		} else {
			stepSpring(camera.scroll, goal, CAMERA.scrollOmega, dt)
			// A fling or a smooth-scrolled jump trails by at most maxLag viewports, so the glide after it stays short
			const lag = goal - camera.scroll.value
			const maxLag = CAMERA.maxLag * input.viewportHeight
			if (Math.abs(lag) > maxLag) {
				camera.scroll.value = goal - Math.sign(lag) * maxLag
				// The velocity of a spring trailing steadily at that lag: the glide after it is then the same at any
				// frame rate and never passes the goal
				camera.scroll.velocity = (Math.sign(lag) * CAMERA.scrollOmega * maxLag) / 2
			}
			settle(camera.scroll, goal, CAMERA.scrollOmega, CAMERA.scrollParallax)
		}
		stepSpring(camera.leanX, input.lean.x, LEAN.omega, dt)
		stepSpring(camera.leanY, input.lean.y, LEAN.omega, dt)
		settle(camera.leanX, input.lean.x, LEAN.omega, LEAN.reach)
		settle(camera.leanY, input.lean.y, LEAN.omega, LEAN.reach)
	} else {
		// Reduced motion or paused: the springs hold where they are
		camera.scroll.velocity = 0
		camera.leanX.velocity = 0
		camera.leanY.velocity = 0
	}
	camera.clock += input.drift * Math.min(dt, DRIFT.maxStep)
	const moving = input.drift > 0 || (input.follow && camera.scroll.value !== goal) || leanWanted(camera, input.lean, input.follow)
	// At rest the camera forgets its step clock: when a target next changes, the first step has dt 0, instead of treating
	// the whole rest as time spent chasing the new target and jumping onto it
	if (!moving) camera.steppedAt = null
	return moving
}

/** Motion is full again (Play, reduced motion off): the sky keeps its place and follows the scroll from here (C8). */
export function resumeCamera(camera: Camera, scrollY: number): void {
	camera.shift = scrollY - camera.scroll.value
	camera.lastGoal = camera.scroll.value
	camera.scroll.velocity = 0
	camera.steppedAt = null
}

/** The worker sleeps or the tab hides: the next step starts from dt 0 (C5). */
export function forgetStep(camera: Camera): void {
	camera.steppedAt = null
}

/** Where the drift has carried the camera at drift-clock time `clock` (s), CSS px at nearness 1; zero at 0. Writes `out`. */
export function driftAt(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x += radius * (Math.cos(omega * clock + phase) - Math.cos(phase))
		out.y += radius * (Math.sin(omega * clock + phase) - Math.sin(phase))
	}
	return out
}

/** The drift's velocity at `clock`: CSS px per second of drift clock at nearness 1 (times the rate for real time). Writes `out`. */
export function driftVelocity(clock: number, out: Vec): Vec {
	out.x = 0
	out.y = 0
	for (const { omega, radius, phase } of EPICYCLES) {
		out.x -= radius * omega * Math.sin(omega * clock + phase)
		out.y += radius * omega * Math.cos(omega * clock + phase)
	}
	return out
}

/** Scratch vector for the drift (no garbage per frame). */
const drift: Vec = { x: 0, y: 0 }

/** The camera's offset (CSS px at nearness 1): scroll parallax, drift and lean added. Writes `out`. */
export function cameraOffset(camera: Camera, out: Vec): Vec {
	driftAt(camera.clock, drift)
	out.x = drift.x + LEAN.reach * camera.leanX.value
	out.y = CAMERA.scrollParallax * camera.scroll.value + drift.y + LEAN.reach * camera.leanY.value
	return out
}

/** How fast the camera moves at drift rate `rate` (CSS px/s at nearness 1): what the frame clock paces. */
export function cameraSpeed(camera: Camera, rate: number): number {
	driftVelocity(camera.clock, drift)
	return (
		rate * Math.hypot(drift.x, drift.y) +
		CAMERA.scrollParallax * Math.abs(camera.scroll.velocity) +
		LEAN.reach * Math.hypot(camera.leanX.velocity, camera.leanY.velocity)
	)
}

/** What the drift depends on right now; the worker gathers it before every read (reused) and the twinkle reads `on` and `level` too. */
export interface DriftGate {
	/** The dusk has begun and the software-raster budget allows drift frames (PACING.minFps). */
	allowed: boolean
	/** Seconds since the dusk began (0 before it). */
	dusk: number
	/** Ambient motion runs or is heading up: full motion and the visitor here. */
	on: boolean
	/** Ambient level, 0 to 1: presence times the motion level. */
	level: number
	/** The scene's drift level (SceneLevels.drift). */
	scene: number
	narrow: boolean
}

/** Whether the drift runs or is heading up: frames follow this, not the eased rate, which starts from exactly 0 (F6). */
export function driftWanted(gate: DriftGate): boolean {
	return gate.allowed && gate.on && gate.scene > 0
}

/** The drift-clock rate the scene asks for before the eases: what the frame clock paces for. */
export function driftTarget(gate: DriftGate): number {
	return gate.scene * (gate.narrow ? DRIFT.narrowRate : 1)
}

/** The drift-clock rate now: the target times the ambient level and the ease from the dusk (DR2, DR3). */
export function driftRate(gate: DriftGate): number {
	return gate.allowed ? driftTarget(gate) * gate.level * smoothstep(0, DRIFT.ease, gate.dusk) : 0
}

/**
 * Whether the lean still moves: under full motion (`follow`), a lean spring away from `lean`, its target. A pause holds
 * the springs where they are, often short of it, so it asks for no frames then (F6). stepCamera and the frame clock share it.
 */
export function leanWanted(camera: Camera, lean: Vec, follow: boolean): boolean {
	return follow && (camera.leanX.value !== lean.x || camera.leanY.value !== lean.y)
}
```

Notes for the implementer:

- **What lands when.**
  - In P2 the camera has `scroll`, `shift`, `lastGoal` and `steppedAt`. `cameraOffset` and `cameraSpeed(camera)` have only the scroll term, `CameraInput` has no `drift` or `lean`, and the worker's `updateCamera(now)` takes no scene: a parameter nothing reads yet would trip `no-unused-vars` (`eslint.config.mjs:13`).
  - P6 adds `clock`, `EPICYCLES`, `DRIFT_REACH`, `driftAt`, `driftVelocity`, `DriftGate` with `driftWanted`, `driftTarget` and `driftRate`, and the drift terms, `cameraSpeed`'s `rate` included.
  - P7 adds `leanX`, `leanY`, `LEAN`, `leanWanted`, and `updateCamera`'s `scene`, which `leanTarget` reads. If D3 skips the lean, none of them exists.
- **Rate changes never jump the sky.** The drift clock integrates the rate as it is at the end of each step. While the rate eases (3 s from the dusk, 4 s around the idle fade, 0.3 s around a pause), this differs between 20 and 60 fps by a few hundredths of a second of drift clock: under 0.2 px for the brightest star, and invisible. Positions still never jump, because the rate changes, not the position (C5). This also meets R3's and R4's "integrate, never speed × time": a change of speed never rescales the distance already travelled.
- **Precision.** `world − q·C` is computed in doubles in JavaScript before anything reaches the canvas's float32 coordinates. Offsets stay under 4 million px, where a double's spacing is about 5 × 10⁻¹⁰ px, and nothing goes through `ctx.translate` (R3 §5.2).
- **No allocation.** `stepSpring` mutates in place (R3), unlike R1's sketch, which returned new objects.

#### The worker side (P2, P5, P6)

The worker keeps only the mechanism and its state; the policy is the pure functions above and in `pacing.ts` (6.2), fed by one `gather` that everything reading its gates calls first: each `tick`, each `schedule` (which runs after every message, 6.2) and `frameAt` (below). So every gate has one definition (DRY), a message that wakes a sleeping worker is judged on this moment's gates, no frame draws a stale level, and the harnesses test the shipped rules.

```ts
// src/components/sky/sky.worker.ts
let camera = createCamera(0)
/** The camera's offset for the frame being drawn (reused). */
const offset: Vec = { x: 0, y: 0 }
/** Whether the camera moved on its last step: it then needs motion frames, and stopping draws one last frame (F7). */
let cameraMoving = false
/** Motion has been full at some point in this page view: until then stars snap to today's whole pixels (M1). */
let skyMoved = false
/** The motion level: 1 under full motion, 0 otherwise, easing over FRAME.motionEase when the preference changes (M1). (P5) */
let motionLevel: Ease = { from: 1, to: 1, since: -Infinity }
/** A narrow screen (NARROW_MAX_WIDTH), set in resize: the one test the drift and, from P8, the launch gate read. */
let narrowScreen = false
/** What the drift and the twinkle depend on right now, filled by `gather` (reused). (P6; until then the twinkle reads presence and the motion level directly) */
const driftGate: DriftGate = { allowed: false, dusk: 0, on: false, level: 0, scene: 0, narrow: false }

/**
 * Gathers the gates for `now`: the drift's, and the ambient flag and level that the twinkle shares (one presence gate).
 * Everything that reads them calls it first (tick before updateCamera, demandNow for schedule, frameAt for the twinkle),
 * so a message that wakes a sleeping worker is judged on fresh gates; for one `now` it gives the same values.
 */
function gather(now: number, scene: SceneLevels): void {
	const t = now / 1000
	driftGate.allowed = exitAt !== null && softwareFps >= PACING.minFps
	driftGate.dusk = exitAt === null ? 0 : t - exitAt
	driftGate.on = motion === 'full' && !isIdle(presence, now)
	driftGate.level = presenceLevel(presence, now) * easeAt(motionLevel, FRAME.motionEase, t)
	driftGate.scene = scene.drift
	driftGate.narrow = narrowScreen
}

/** Steps the camera while visible; when it comes to rest, one more frame shows the resting sky (F7). */
function updateCamera(now: number, scene: SceneLevels): void {
	if (!visible) return
	const moving = stepCamera(camera, {
		time: now / 1000,
		scroll: parallaxScroll,
		viewportHeight: height,
		follow: motion === 'full',
		drift: driftRate(driftGate),
		lean: leanTarget(scene),
	})
	if (cameraMoving && !moving) needsDraw = true
	cameraMoving = moving
}
```

- **`init`** (`sky.worker.ts:467-493`): `camera = createCamera(message.scrollY)` next to `scrollY = parallaxScroll = message.scrollY` (`:486`); `skyMoved = message.motion === 'full'`; and `motionLevel` at rest on that motion's level (1 or 0, `since: -Infinity`), so nothing eases at load.
- **`motion` handler** (`:503-509`). It acts only when the value changes:
  - first, `motionLevel = { from: easeAt(motionLevel, FRAME.motionEase, t), to: message.motion === 'full' ? 1 : 0, since: t }`;
  - on a change to full, `skyMoved = true`, today's `holdMeteors(now)`, then `parallaxScroll = scrollY` and `resumeCamera(camera, scrollY)` (C8).
  - Today `parallaxScroll` stays stale until the next scroll message and then leaps (`:531`). This fixes that without touching the scroll handler, which keeps recording `scrollY` and, under full motion only, `parallaxScroll` (until P8 retires it, 6.9).
- **`visible` handler** (`:510-524`): `forgetStep(camera)` in the hidden branch, beside `cancelFrames()`.
- **`tick`**: `gather(now, scene)` and `updateCamera(now, scene)` after `settleQuiet(now)` and before the frame decision. The camera steps on every wake-up, drawn or not, with the true elapsed time.
- **`frameAt`** (`:305-326`): `offset: cameraOffset(camera, offset)` replaces `parallaxScroll` in the `SkyFrame`; the veil's lines stay (8.4).
  - From P6 it first calls `gather(now, scene)` with the scene it computes, since its twinkle reads `driftGate.level` (6.6) and `resize`, `stepDown` and `probeRaster` draw outside a frame decision (`:446`, `:361`, `:373`): a resize after an idle sleep would otherwise leave a frame with a stale twinkle on screen (F7).
  - `snap` is `true` in P1.
  - From P2 it is `!skyMoved`, a worker flag that `init` and the `motion` handler set the first time motion is `'full'` in this page view. A load under reduced motion or paused draws exactly today's points; after that, a pause, a reduced-motion switch or Play keeps every star at its quarter-pixel phase rather than hopping it up to half a device pixel, as the idle sleep already does (M1). The first full motion after such a load still moves each star once to its phase: M1's one-time settle, accepted, because easing it would need each star's rounding at the switch.
- **`probeRaster`** (`:368-379`) keeps calling `frameAt` without stepping the camera.
- **Before P5**, there is no motion ease: P2 uses `follow: motion === 'full'` and no drift. Until P3 replaces `frameMode`, P2 makes `frameMode` return `'active'` while `cameraMoving`, so the glide draws on every refresh.

#### Reconciling R1's drift with R4's heading rules

R4 asked for a heading within ±15° of horizontal that turns at most 15°/min and never reverses (its AC-4), and for no return within 50 px of an earlier offset (its AC-7). Those describe an unbounded "train window" pan. The settled design (the brief, R1) is a floating camera, which is what the user asked for in so many words ("floating around"). Epicycles turn about 2°/s and come back near their start every 180 s, because any bounded path must.

They still meet what R4's rules were for:

- **No stops.** The speed stays at least 0.58 v₀.
- **No abrupt turns.** The heading turns at most 4.33°/s, smoothly.
- **No sway in the sickness band.** Every frequency is under 0.014 Hz.
- **No rhythm to notice.** The speed beats on about 69 s and 127 s, which are incommensurate. The heading's roughly 3-minute cycle is the intended float. The path never retraces itself in a way anyone could see: within 30 minutes, no 60 s stretch matches an earlier one closer than 6.3 px at q = 1 with the two aligned at their first points (at a 24-minute lag, searched on a 0.25 s grid), and the exact path repeats only after 25 hours [computed].

Passing near the starting position is not a repeat. Every bounded quasi-periodic path does it: these phases come within 4 px of the start at about 9 minutes, and R1's within 6 px. So AC-7 measures retraced stretches instead.

R4's other worry, induced motion of the headline when the drift heads vertically, is met by keeping the faint majority nearly still (the far band's mean at most 1.25 px/s), and AC-17 checks it. Section 9 therefore amends AC-4 and AC-7 instead of changing the drift, and section 12 lists the one-constant fallback if AC-17 fails.

#### Reconciling the pointer lean (R1 and R4)

R1 proposes a reach of 12 CSS px at q = 1: ±19 px for the brightest star, ±12 px for the near band, ±6 px for mid and ±3.5 px for far. R4 proposes a virtual shift of 100 px times each layer's parallax, which gives far 2, mid 4 and near 7 px.

In this plan's law, a layer's nearness is its parallax over 0.07, so R4's numbers are the same model at reach 7. The two agree on the law, the spring (ω = 4 rad/s, 95% in 1.19 s) and the gating: fine pointer with hover, hero only, full motion, never device orientation. They differ only in one amplitude: 12 by default (the brief's), with 7 and 10 as the calmer settings (D3). The `LEAN` block is in 6.13.

### 6.2 Pacing and the frame clock (P3)

#### Policy and mechanism

The frame clock has two concerns with different owners:

- **Policy** (pure, in `src/lib/sky/pacing.ts` and, for the drift, `camera.ts`): what each part of the sky needs, mapped from the `FrameState` the worker gathers at each frame decision (`frameDemand`), the strictest demand, the frames per second motion needs, the whole-number divisor and its hysteresis, the refresh estimate, the eases, and whether a wake-up draws. All of it runs in the scratch harness, so H4 tests the shipped mapping, not a copy.
- **Mechanism** (in `sky.worker.ts`): the `requestAnimationFrame` and `setTimeout` handles.
  - They stay worker variables named `rafId` and `timerId`, because the scroll handler reads them: `if (!rafId && timerId === undefined) needsDraw = true` (`sky.worker.ts:535`).
  - `rafId` becomes `number | null`, with `null` as the "nothing pending" sentinel (MDN: request IDs may wrap to 0).
  - `!rafId` still means "no frame pending", so the handler keeps working without an edit. In the rare case of a pending id of 0 it draws one extra frame, which is harmless.
  - The watchdog gets its own `watchdogId`, which the handler never sees. In timer-fallback mode the frame timer lives in `timerId`, so the handler sees a pending frame.

#### Config

```ts
// src/lib/sky/config.ts
/**
 * Frame pacing for moving stars (FRAME keeps the timers for a sky that only changes brightness). A moving star steps at
 * most `stepDevicePx` per drawn frame (two quarter-pixel phases, under a third of the smallest star's width) where the
 * display's refresh rate allows it, and never draws below `minFps`. Motion draws on animation frames divided by a whole number, so every drawn frame stays up for the
 * same number of display refreshes; a lower need must last `slowDownAfter` seconds before the clock slows down. The drift
 * draws at most `narrowMaxFps` on narrow screens (phone GPUs pay most for a full-screen frame) and `slowMaxFps` after the
 * first adaptive step; a software-rasterized canvas may spend `softwareShare` of a core on it and keeps a still sky below
 * `minFps`. The refresh interval is the median of the last `refreshSamples` frame intervals; a median within
 * `unalignedToleranceMs` of `unalignedIntervalMs` is WebKit's fixed 15 ms worker clock, not the display, so uncapped
 * motion draws every frame there and capped drift every few. A requested animation frame that hasn't come `watchdogMs`
 * after the request (while visible) is served by a timer; after `watchdogStrikes` misses in a row, frames come from a
 * `fallbackFps` timer, which asks for one animation frame every `reprobeMs` and goes back to them when one arrives (a GPU
 * restart or a restored context); the strikes also reset when the context is restored or the tab is shown.
 */
export const PACING = {
	stepDevicePx: 0.5,
	minFps: 20,
	slowDownAfter: 0.5,
	narrowMaxFps: 30,
	slowMaxFps: 30,
	softwareShare: 0.08,
	refreshSamples: 16,
	unalignedIntervalMs: 15,
	unalignedToleranceMs: 0.4,
	watchdogMs: 250,
	watchdogStrikes: 3,
	fallbackFps: 60,
	reprobeMs: 5000,
} as const
```

The `FRAME` doc (`config.ts:222`) gains: "Anything that moves draws on animation frames paced by PACING; these timers serve a sky that only changes brightness." In P6, which brings the drift, the `ADAPT` doc gains "step 1 also caps the drift at PACING.slowMaxFps".

**Why three strikes.** The drafts disagreed on the watchdog.

- Switching to timers for good after one stall turns a single GPU hiccup into judder for the rest of the visit.
- Never switching serves a broken provider (Chrome's id 0, which never calls back, R3 §2.1) at about 4 fps, one frame per watchdog delay.
- Three misses in a row (750 ms) separates the two cases, and the 5 s probe undoes a switch that a GPU restart or an occluded window caused.

#### `src/lib/sky/pacing.ts` (new)

```ts
import { FRAME, PACING } from './config'
import { smoothstep } from './scene'

/** What one part of the sky needs from the frame clock right now. */
export interface FrameDemand {
	/** Drawn frames per second: 0 for none, Infinity for every display refresh. */
	fps: number
	/** Something moves: frames must be animation frames, so each one lands on a display refresh. */
	vsync: boolean
	/** At most this many frames per second while this is the strictest demand (the drift's caps); Infinity for none. */
	cap: number
}

/** Nothing to draw. */
export const NO_FRAMES: FrameDemand = { fps: 0, vsync: false, cap: Infinity }

/** Every display refresh: a moving transient, scrolling under full motion. */
export const EVERY_FRAME: FrameDemand = { fps: Infinity, vsync: true, cap: Infinity }

/** Slow changes that don't move (the dusk, a lingering train, the quiet ease, scrolling under reduced motion, the motion level easing). */
export const FADE_FRAMES: FrameDemand = { fps: FRAME.fadeFps, vsync: false, cap: Infinity }

/**
 * The strictest of several demands: the most frames, on animation frames if any of them moves, within the tightest cap
 * unless one asks for every refresh (a flying transient, scrolling). So a fade never lifts the drift's cap, which matters
 * on WebKit's unaligned clock, where tick asks for every tick and only the cap divides it.
 */
export function combineDemands(...demands: FrameDemand[]): FrameDemand {
	let fps = 0
	let vsync = false
	let cap = Infinity
	for (const demand of demands) {
		if (demand.fps <= 0) continue
		fps = Math.max(fps, demand.fps)
		cap = Math.min(cap, demand.cap)
		if (demand.vsync) vsync = true
	}
	if (fps === 0) return NO_FRAMES
	return { fps, vsync, cap: fps === Infinity ? Infinity : cap }
}

/**
 * Frames per second for something moving `devicePxPerSecond`: at most PACING.stepDevicePx per frame, and never under
 * PACING.minFps, even at speed 0, since a motion that has just started (or is easing in from 0) still needs frames (F6).
 */
export function motionFps(devicePxPerSecond: number): number {
	return Math.max(PACING.minFps, devicePxPerSecond / PACING.stepDevicePx)
}

/** What the frame clock needs to know now: the worker fills it from its own state at each frame decision (reused, no garbage). */
export interface FrameState {
	/** A context, the tab visible, motion not 'off' and the dusk begun; otherwise nothing draws. */
	live: boolean
	/** Scrolled within FRAME.scrollSettleMs. */
	scrolling: boolean
	/** Full motion: scrolling then moves the stars (every refresh); otherwise it only fades them. */
	full: boolean
	/** The transients' demand (transientDemand): every frame while one moves, fade frames while one lingers (a train). */
	transientDemand: FrameDemand
	/** The camera moves, or the drift or the lean heads up: decided by where they head, not their eased levels (F6). */
	cameraActive: boolean
	/** Device px/s of the nearest star at the speed the drift heads to. */
	cameraSpeed: number
	/** driftCap() while the drift is wanted or the lean moves, else Infinity: a scroll glide alone is never cut to a crawl. */
	cameraCap: number
	/** A slow change runs: the dusk, the quiet ease, the motion ease or the thin fade. */
	fading: boolean
	/** Twinkle's timer rate while it may change (ambient motion on and a twinkling scene), else 0. */
	twinkleFps: number
}

/** The strictest demand of every part of the sky this tick. */
export function frameDemand(state: FrameState): FrameDemand {
	if (!state.live) return NO_FRAMES
	return combineDemands(
		state.transientDemand,
		state.scrolling ? (state.full ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		state.cameraActive ? { fps: motionFps(state.cameraSpeed), vsync: true, cap: state.cameraCap } : NO_FRAMES,
		state.fading ? FADE_FRAMES : NO_FRAMES,
		state.twinkleFps > 0 ? { fps: state.twinkleFps, vsync: false, cap: Infinity } : NO_FRAMES
	)
}

/** Most drift frames per second: PACING.narrowMaxFps on narrow screens, PACING.slowMaxFps after the first adaptive step, within the software-raster budget. */
export function driftCap(narrow: boolean, slowed: boolean, softwareFps: number): number {
	return Math.min(narrow ? PACING.narrowMaxFps : slowed ? PACING.slowMaxFps : Infinity, softwareFps)
}

/** A level easing (smoothstep) from `from` to `to` since `since` (s): the motion level (P5). */
export interface Ease {
	from: number
	to: number
	since: number
}

/** The eased level at `t` (s), over `duration` s. */
export function easeAt(ease: Ease, duration: number, t: number): number {
	return ease.from + (ease.to - ease.from) * smoothstep(0, duration, t - ease.since)
}

/** True while an ease that started at `since` (s; null while it hasn't begun) runs: fade frames show it. */
export function easing(since: number | null, duration: number, t: number): boolean {
	return since !== null && t - since < duration
}

/** True once an ease has run out while the last drawn frame (`drawnAt`, s) still showed it part way: one more frame shows its end (F7). */
export function easeEnded(since: number | null, duration: number, t: number, drawnAt: number): boolean {
	return since !== null && drawnAt - since < duration && t - since >= duration
}

/** A one-way fade: 1 until `since` (s; null while it hasn't begun), then down to 0 over `duration` s. */
export function fadeOutAt(since: number | null, duration: number, t: number): number {
	return since === null ? 1 : 1 - smoothstep(since, since + duration, t)
}

/** Draw on every k-th refresh: the largest k that still gives `fps`, and at least the k that keeps under `cap`. */
export function refreshDivisor(refreshHz: number, fps: number, cap: number): number {
	return Math.max(Math.floor(refreshHz / fps), Math.ceil(refreshHz / cap), 1)
}

/** The divisor in use, and since when (worker-clock ms) a larger one has been enough. */
export interface Divisor {
	k: number
	slowerSince: number | null
}

/** Moves the divisor toward `wanted`: down at once (more frames), up only after PACING.slowDownAfter s of lower need. */
export function stepDivisor(divisor: Divisor, wanted: number, now: number): number {
	if (wanted <= divisor.k) {
		divisor.k = wanted
		divisor.slowerSince = null
	} else if (divisor.slowerSince === null) divisor.slowerSince = now
	else if (now - divisor.slowerSince >= PACING.slowDownAfter * 1000) {
		divisor.k = wanted
		divisor.slowerSince = null
	}
	return divisor.k
}

/**
 * Whether a wake-up at `now` (ms) draws for `demand`: every animation frame at k = 1 (even just after a timer drew, so
 * motion starts on the next refresh), otherwise one once k - 1/2 refreshes have passed since the last drawn frame; a timer
 * once its interval has (4 ms early is fine: timers fire a little early or late).
 */
export function frameDue(demand: FrameDemand, now: number, lastDrawAt: number, k: number, interval: number): boolean {
	if (demand.fps <= 0) return false
	if (demand.vsync) return k <= 1 || now - lastDrawAt >= (k - 0.5) * interval
	return now - lastDrawAt >= 1000 / demand.fps - 4
}

/** The display's refresh interval, measured from animation-frame timestamps. */
export interface RefreshEstimate {
	/** Milliseconds between refreshes: 1000 / 60 until measured. */
	readonly interval: number
	/** The frames come from a fixed timer, not the display (WebKit's 15 ms worker clock). */
	readonly unaligned: boolean
	/** Adds an animation-frame timestamp (ms). */
	sample(timestamp: number): void
	/** Forgets the last timestamp after a pause (hidden, asleep), so the gap isn't taken for a refresh. */
	pause(): void
}

/** The median of a short list (never empty where it is called). */
function median(values: readonly number[]): number {
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[sorted.length >> 1] ?? 0
}

/**
 * A refresh estimate: the median of the last PACING.refreshSamples intervals. Intervals over 1.5 times the estimate are
 * dropped frames and ignored, unless PACING.refreshSamples of them come in a row: then the display really is slower
 * (Energy Saver's 30 Hz, say) and their median becomes the estimate.
 */
export function createRefreshEstimate(): RefreshEstimate {
	const accepted: number[] = []
	const rejected: number[] = []
	let last: number | null = null
	let interval = 1000 / 60
	const remember = (list: number[], delta: number) => {
		list.push(delta)
		if (list.length > PACING.refreshSamples) list.shift()
	}
	return {
		get interval() {
			return interval
		},
		get unaligned() {
			return Math.abs(interval - PACING.unalignedIntervalMs) <= PACING.unalignedToleranceMs
		},
		sample(timestamp) {
			const delta = last === null ? 0 : timestamp - last
			last = timestamp
			if (delta <= 0) return
			if (delta < interval * 1.5) {
				rejected.length = 0
				remember(accepted, delta)
				interval = median(accepted)
				return
			}
			// A run of long intervals is a slower display, not dropped frames
			remember(rejected, delta)
			if (rejected.length < PACING.refreshSamples) return
			accepted.length = 0
			accepted.push(...rejected)
			rejected.length = 0
			interval = median(accepted)
		},
		pause() {
			last = null
		},
	}
}
```

The domain-model draft tested this body on H4's refresh cases.

#### The worker's demand (replaces `frameMode` and `frameInterval`, `sky.worker.ts:135-152`)

The worker only gathers; `frameDemand` (pure, above) decides. The veil's `quietEasing(t)` is the quiet-ease term of `fading`, and `tick` keeps calling `settleQuiet` before the frame decision (8.4).

```ts
/** What the frame clock sees now (reused). */
const frameState: FrameState = { live: false, scrolling: false, full: false, transientDemand: NO_FRAMES, cameraActive: false, cameraSpeed: 0, cameraCap: Infinity, fading: false, twinkleFps: 0 }

/**
 * The strictest demand of every part of the sky right now. It gathers first (gather, 6.1): schedule runs it after every
 * message, so an activity or pointer ping that wakes a sleeping worker is judged on this moment's presence (F6).
 */
function demandNow(now: number, scene: SceneLevels): FrameDemand {
	const t = now / 1000
	gather(now, scene)
	const wanted = driftWanted(driftGate)
	const leaning = leanWanted(camera, leanTarget(scene), motion === 'full')
	frameState.live = ctx !== null && visible && motion !== 'off' && exitAt !== null
	frameState.scrolling = now - lastScrollAt < FRAME.scrollSettleMs
	frameState.full = motion === 'full'
	// P8 replaces this line with transientDemand(transients, t)
	frameState.transientDemand = meteor ? (meteorMoving(meteor, t) ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES
	frameState.cameraActive = cameraMoving || wanted || leaning
	frameState.cameraSpeed = DEPTH.maxNearness * cameraSpeed(camera, wanted ? driftTarget(driftGate) : 0) * dpr
	frameState.cameraCap = wanted || leaning ? driftCap(narrowScreen, quality > 0, softwareFps) : Infinity
	frameState.fading = (exitAt !== null && !emergenceDone(t - exitAt)) || quietEasing(t) || easing(motionLevel.since, FRAME.motionEase, t)
	frameState.twinkleFps = driftGate.on && scene.twinkle > 0 ? (quality > 0 ? FRAME.slowTwinkleFps : FRAME.twinkleFps) : 0
	return frameDemand(frameState)
}
```

Lines that refer to later phases arrive with them:

| Line or name | Before its phase | From its phase |
|---|---|---|
| `cameraMoving` | (P2) | as written |
| `gather(now, scene)` | absent | P6 |
| `driftWanted(driftGate)` | `false` | P6 |
| `driftTarget(driftGate)` in the speed line | absent: `cameraSpeed(camera)` (6.1) | P6 |
| the cap line (`driftCap(narrowScreen, …, softwareFps)`), and `softwareFps` (below) | `Infinity`, and no `softwareFps` | P6 |
| `leanWanted(camera, leanTarget(scene), …)` (`camera.ts`, which `stepCamera` shares: full motion, and a lean spring away from its target; 6.13 says why the motion test matters) | `false` | P7 |
| the motion ease in `fading` | absent | P5 |
| `driftGate.on` | today's `motion === 'full' && !isIdle(now)` (P4: `isIdle(presence, now)`) | P6 |
| `transientDemand(transients, t)` in the transient line | today's meteor line (as written) | P8 |

Before P6 nothing new moves except the scroll glide. So `frameDemand` reproduces today's `frameMode` exactly for everything that existed before:

| Today's mode | Its demand |
|---|---|
| `'active'` | `EVERY_FRAME` |
| `'fade'` | `FADE_FRAMES` |
| `'twinkle'` | a 15 or 10 fps timer |

**Software raster** (P6: the drift is its first reader).

- `probeRaster` (`:368-379`) keeps the milliseconds it measured, scaled by 1 / dpr² when it stepped down to CSS resolution.
- `softwareFps` is `Math.floor(PACING.softwareShare * 1000 / rasterMs)` when the probe found a software canvas, and `Infinity` otherwise.
- The drift is affordable (`driftGate.allowed`) only when `softwareFps >= PACING.minFps`.
- A 1440 × 900 software canvas at CSS resolution (3.3 to 3.9 ms a frame, R3 §6) affords 20 to 24 fps and drifts. A 4K software canvas (about 29 ms) gets 2 fps and keeps a still sky, as today. Scroll parallax and meteors still work there, at today's cadence.

#### The worker's mechanism (replaces `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames`, `:154-160` and `:167-209`)

- **`requestFrame()`.**
  - If `rafWorks`, it sets `rafId = scope.requestAnimationFrame?.(onFrame) ?? null` and arms `watchdogId = setTimeout(onStalled, PACING.watchdogMs)`.
  - Otherwise it sets `timerId = setTimeout(onTimer, needsDraw ? 0 : Math.max(0, lastDrawAt + divisor.k * 1000 / PACING.fallbackFps - now))`, today's `onTimer` (`:190-193`), which ticks without sampling the refresh estimate. In this mode the timer stands in for the display: `tick` divides it like a 60 Hz refresh, so the timer fires once per drawn frame, k periods after the last one (armed one period after it, a k = 2 demand would wake 3 times per drawn frame). It is armed against the last drawn frame, as today's timers are (`:186`), because `schedule` re-runs after every message: armed from `now`, scroll and pointer messages 8 ms apart would push the frame back for as long as they come.
  - In that fallback mode it also asks for one animation frame every `PACING.reprobeMs`, through its own `probeId`; when one calls back, `rafWorks` is true again and the strikes reset.
  - `rafWorks` starts as `typeof scope.requestAnimationFrame === 'function'`. In `SkyWorkerScope` (`:17-22`) both animation-frame members become optional, so every call to them uses `?.` (a direct one is TS2722 under `strict`).
- **`onFrame(time)`** clears the watchdog, sets `rafId = null`, resets the strikes, samples the refresh estimate and calls `tick(time)`.
- **`onStalled()`** cancels the request, sets `rafId = null`, counts a strike (at `PACING.watchdogStrikes`, `rafWorks = false`) and serves this frame with `tick(performance.now())`. The `contextrestored` listener (`:475-479`) and the `visible` handler reset the strikes.
- **`schedule(now)`** keeps today's structure (`:171-187`):
  - It returns if a frame is pending (`rafId !== null`), there is no context, or the page is hidden, and it clears `timerId`.
  - It computes `demandNow`. A vsync demand requests a frame. An fps of 0 sleeps, keeping today's one timer for `needsDraw` or the next due shooting star or transient, and calls `refresh.pause()`. Otherwise it sets a timer at `needsDraw ? 0 : Math.max(0, lastDrawAt + 1000 / demand.fps - now)`, as today (`:186`), so a message that changes the sky draws at once.
- **`tick(now)`** runs, in order:
  1. the shooting star, `settleQuiet`, `gather`, the motion ease's last frame (`easeEnded`, P5, 6.6) and `updateCamera`;
  2. the divisor: in timer-fallback mode the refresh is the timer, `interval = 1000 / PACING.fallbackFps` and `fps = demand.fps` (the estimate may be stale: 8.33 ms after a 120 Hz display stalled); otherwise `interval = refresh.interval` and `fps = refresh.unaligned ? Infinity : demand.fps`. Then `k = demand.vsync ? stepDivisor(divisor, refreshDivisor(1000 / interval, fps, demand.cap), now) : 1`;
  3. `if (needsDraw || frameDue(demand, now, lastDrawAt, k, interval)) draw(now)`;
  4. `schedule(now)`.
- **`cancelFrames()`** (the hidden branch, `:513`) cancels with `if (rafId !== null) scope.cancelAnimationFrame?.(rafId)`, clears the watchdog, sets `rafId = null` and calls `refresh.pause()`.

#### What it gives (v₀ = 3, the brightest star at the drift's peak, q = 1.6) [computed]

| Scene | DPR | Need (fps) | 60 Hz | 120 Hz | 144 Hz | WebKit (66.7 Hz) | Step (device px) |
|---|---|---|---|---|---|---|---|
| Desktop hero | 1 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | k = 1, 66.7 fps | 0.33 to 0.34 (0.10 on WebKit) |
| Desktop hero | 1.5 | 20.4 | k = 2, 30 fps | k = 5, 24 fps | k = 7, 20.6 fps | k = 1 | 0.34 to 0.50 |
| Desktop hero | 2 | 27.3 | k = 2, 30 fps | k = 4, 30 fps | k = 5, 28.8 fps | k = 1 | 0.45 to 0.47 (0.20) |
| Desktop end (0.8) | 2 | 21.8 | k = 2, 30 fps | k = 5, 24 fps | k = 6, 24 fps | k = 1 | 0.36 to 0.45 |
| Desktop reading (0.35) | 2 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | k = 1 | 0.23 to 0.24 |
| Narrow hero (0.6), cap 30 | 2 | 20 | k = 3, 20 fps | k = 6, 20 fps | k = 7, 20.6 fps | k = 3, 22.2 fps | 0.37 to 0.41 |

These are the frames at the drift's top speed (1.42 v₀). At v₀ a DPR-2 laptop needs 19.2 fps (19.7 at the drift's mean speed, 1.026 v₀); it needs 30 whenever the drift is faster than 1.04 v₀, about half the time, so it averages about 25 fps, switching with the 0.5 s hysteresis [computed]. Every true step stays at or under 0.5 device px per drawn frame (AC-10). With v₀ = 4, a DPR-2 laptop needs 36 fps, which on 60 Hz means every frame; v₀ = 3.3 is the threshold (D6).

#### Before and after

| | Today | After P3 (and P6) |
|---|---|---|
| Moving content | rAF every refresh (meteor, scroll) | the same, plus divided rAF for the camera |
| Fades, twinkle | 30 and 15 fps timers | unchanged (nothing moves, so no judder) |
| Missing or stalled worker rAF | throws, or freezes silently on Chrome's id 0 | feature-detected; a timer frame after 250 ms; a 60 Hz timer after three misses, probing every 5 s to go back |
| WebKit's 15 ms worker clock | treated as vsync | detected: uncapped motion draws every tick, capped drift every third on phones (relay: P13) |
| Hidden tab | frames cancelled | the same, plus the refresh estimate pauses and the camera forgets its step |

### 6.3 Sub-pixel phase sprites (P1)

```ts
// src/lib/sky/config.ts
/**
 * Sub-pixel positions per device pixel and axis in the star atlas (4, like Skia's glyph cache): a moving star is drawn
 * from the sprite pre-rendered at its nearest quarter-pixel phase, placed at a whole device pixel, so it glides without
 * blurring or pulsing and lands within 1/8 px of its true place. Phase 0 is today's sprite, byte for byte; 1 rounds every
 * star to whole pixels.
 */
export const STAR_PHASES = 4
```

`src/components/sky/skyAssets.ts`:

- **Painter.** `gaussianAt` (`:45-55`) becomes a separable `profile(size, sigma, phase): Float64Array`: for each pixel i, the 4-sample box integral of the Gaussian centred `phase` px right of the middle pixel. Today's 16-sample 2D value is exactly the product of two such profiles, because the exponential of a sum is a product.
  - So phase (0, 0) reproduces today's sprites. R3 measured a largest difference of 1.1 × 10⁻¹⁶; the delivery draft found 0 byte mismatches at DPR 1, 1.25, 1.5 and 2 [computed].
  - It is also fast: all 16 phases build in about 0.6 to 1.5 ms. Today's painter would need 53 to 316 ms for them.

```ts
/** One axis of the 4x4-supersampled pixel-area Gaussian, centered `phase` px right of the sprite's middle pixel. */
function profile(size: number, sigma: number, phase: number): Float64Array {
	const center = (size - 1) / 2
	const out = new Float64Array(size)
	for (let i = 0; i < size; i++) {
		let sum = 0
		for (let s = 0; s < 4; s++) {
			const x = i - center - phase + (s + 0.5) / 4 - 0.5
			sum += Math.exp(-(x * x) / (2 * sigma * sigma))
		}
		out[i] = sum / 4
	}
	return out
}
```

- **`paintSprite`** (`:63-78`) paints `round(min(1, (cx[i]·cy[j] + haloPeak·hx[i]·hy[j]) / peak) × 255)` for phases (i/4, j/4). `peak` is the **phase-0** centre value of the same shape, computed once per shape, so every phase carries nearly the same total light. Sprites keep today's sizes (2⌈3σ⌉ + 1, `:57-60`), so a phase shifts the Gaussian toward one edge and cuts a little of its tail: over every DPR from 0.5 to 2 (below 1 when the page is zoomed out, which `canvasDpr` allows, `mountSky.ts:92-97`) and every shape, phase sums stay within 0.5% of phase 0 before rounding (worst: DPR 2, shape 2, σ 1.0 px in a 7 px sprite) and within 1.7% in bytes from DPR 1 to 2 (worst: DPR 1.125, a 90% zoom on a 125% display) and 2.5% below it (worst: 2.45% at DPR 0.825) [computed]. That is far under R4's 5%, and growing sprites to close it would push the DPR-2 atlas past B-10.
- **`buildStarAtlas`** (`skyAssets.ts:81-120`) lays each (tint, shape) out as a 4 × 4 block of its phases, with a 1 px gutter. The meteor core and glow keep one unphased sprite each, because the head is a fast glow drawn fractionally as today.
- **Index.** A new `starSpriteIndex(tint, shape, phaseX, phaseY) = ((tint * STAR_SHAPES.length + shape) * STAR_PHASES + phaseY) * STAR_PHASES + phaseX` replaces `tint * SHAPE_COUNT + shape`, and `StarAtlas.stars` documents it (`skyAssets.ts:26-27`).
- **Size.** About 0.7 MB at DPR 1 and 1.9 MB at DPR 2, against 48 KB and 127 KB today. The atlas is rebuilt only when the ratio changes.

`src/components/sky/renderSky.ts` gets one placement function for every point of light: stars now, satellites in P11.

```ts
/** Top-left device pixel where the sprite placePoint picked goes (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point of light centered at (px, py) device px, with its top-left whole pixel in `corner`. A moving point
 * uses the sprite pre-rendered at its nearest quarter-pixel phase, so it glides without blurring or pulsing; `snap`
 * rounds to whole pixels (a sky that hasn't moved in this page view), which draws exactly today's points.
 */
function placePoint(atlas: StarAtlas, tint: number, shape: number, px: number, py: number, snap: boolean): Sprite | undefined {
	let ix = snap ? Math.round(px) : Math.floor(px)
	let iy = snap ? Math.round(py) : Math.floor(py)
	let phaseX = snap ? 0 : Math.round((px - ix) * STAR_PHASES)
	let phaseY = snap ? 0 : Math.round((py - iy) * STAR_PHASES)
	if (phaseX === STAR_PHASES) {
		ix++
		phaseX = 0
	}
	if (phaseY === STAR_PHASES) {
		iy++
		phaseY = 0
	}
	const sprite = atlas.stars[starSpriteIndex(tint, shape, phaseX, phaseY)]
	if (!sprite) return undefined
	const half = (sprite.size - 1) / 2
	corner.x = ix - half
	corner.y = iy - half
	return sprite
}
```

With `STAR_PHASES = 1` the unsnapped branch reduces to `Math.round` (a phase of 1 carries into the next pixel), so 1 is a complete kill switch.

**Why not a fractional `drawImage`** (R3 §3.2). Browsers may filter however they like. Bilinear filtering spreads a σ = 0.7 px star so that its peak falls to 0.504 at phase (0.5, 0.5) and its width grows 24%, so a drifting star pulses at v·dpr Hz (0.8 to 2.5 Hz for a far star at DPR 2, 5.6 to 13.6 Hz for the brightest). Phase sprites keep each star's light and width. The perceived peak stays at 0.90 to 0.99 on DPR 2 screens, and the position error is at most 1/8 px.

**The snap rule (`SkyFrame.snap`).**

| Phase | `snap` | Effect |
|---|---|---|
| P1 | always `true` | P1 draws exactly today's pixels. |
| P2 on | `!skyMoved`: true until motion is first `'full'` in this page view | A load under reduced motion or paused draws today's frames exactly. Once the sky has moved, every star sits at its true quarter-pixel place: within half a device pixel of today's rounded point, too small to see but not pixel-identical, so identity checks run with `snap` forced true (S4). A pause, a reduced-motion switch, Play and the idle sleep all keep the phases, so no star hops, apart from M1's one settle after a still load. |

**DPR 1 caveat** (R3 §3.5). Where the eye resolves pixels, even an ideal renderer shows about a 20% swing of the brightest pixel for 1-D motion at σ 0.7 device px, and 35% diagonally. Decide by eye in P6 on a DPR-1 monitor. The fix, if needed, is a floor of 0.85 device px on moving stars' core sigma at DPR ≤ 1: one `Math.max` in `buildStarAtlas`, beside `MIN_CORE_SIGMA_DEVICE_PX`. It changes the resting look there.

### 6.4 The quiet index (P1)

Today every star calls `easedQuietFactor` over every quiet zone (`renderSky.ts:120`), and mid-ease that walks both zone sets: 1.3 to 1.7 ms a frame at 1,430 stars and 64 rects (R3 §4.1), 8 to 10% of a core at 60 fps. Once stars move every frame, that cost runs continuously.

```ts
// src/lib/sky/quietIndex.ts (new)
import { QUIET, QUIET_REACH } from './config'
import type { Point } from './meteors'
import type { SkyRect } from './protocol'
import { easedQuietFactor, quietAt, sameRects, type QuietBlend, type QuietKeeps } from './scene'

/**
 * Farthest from a padded quiet zone that the quiet math looks (CSS px): a zone more than this away on either axis adds
 * nothing to any quiet factor, and the ink term only reaches inside it. QUIET_REACH is measured from a text rect, before
 * the padding. Every "clear of copy" test reads it.
 */
export const ZONE_REACH = QUIET_REACH - QUIET.padding

/** Side of the square screen tiles the zones are bucketed into (CSS px). */
const TILE = 64

/** Spacing of segmentClear's samples along a segment (CSS px). */
const SEGMENT_STEP = 8

/**
 * The quiet zones bucketed by screen tile, so a star looks only at the zones that can reach it. Exact: each tile keeps, in
 * their original order, the same zone objects whose box grown by ZONE_REACH touches it, and a zone beyond that reach adds
 * nothing to quietFactor, so the factor equals easedQuietFactor over all zones bit for bit (Q1).
 */
export interface QuietIndex {
	/** No zones on screen: drawLayer skips the lookup. */
	readonly empty: boolean
	/** Follows the zones on screen; rebuilds the buckets only when a zone list or the grid changed (scroll, layout, an ease starting or ending). */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps) for a point within `margin` of the viewport, reading only its tile's zones. */
	factor(x: number, y: number, keeps: QuietKeeps): number
}

/** True when the box [x0, x1] × [y0, y1] touches `zone` grown by ZONE_REACH: only then can the zone dim or veil anything in it. */
export function zoneReaches(zone: SkyRect, x0: number, y0: number, x1: number, y1: number): boolean {
	return zone.x - ZONE_REACH <= x1 && zone.x + zone.width + ZONE_REACH >= x0 && zone.y - ZONE_REACH <= y1 && zone.y + zone.height + ZONE_REACH >= y0
}

/**
 * True when the segment from `a` to `b` stays clear of every zone's reach: quietAt is 0 at points at most SEGMENT_STEP
 * apart along it. A graze under 0.2 px deep into a feather's rounded corner can slip between two samples, where the
 * drawing's transientQuietFactor dims it anyway. (P11: satellites; the confirmed interface keeps segmentTouches private)
 */
export function segmentClear(zones: readonly SkyRect[], a: Point, b: Point): boolean {
	const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / SEGMENT_STEP))
	for (let i = 0; i <= steps; i++) {
		if (quietAt(zones, a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps) > 0) return false
	}
	return true
}

/** The zones whose box grown by ZONE_REACH touches the tile [x0, x1] × [y0, y1], in their original order. */
function zonesNear(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): SkyRect[] {
	return zones.filter((zone) => zoneReaches(zone, x0, y0, x1, y1))
}

/** An empty index; update() fills it. */
export function createQuietIndex(): QuietIndex {
	let from: readonly SkyRect[] = []
	let to: readonly SkyRect[] = []
	let tiles: QuietBlend[] = []
	let columns = 0
	let rows = 0
	let origin = 0
	let gridWidth = -1
	let gridHeight = -1
	return {
		get empty() {
			return from.length === 0 && to.length === 0
		},
		update(blend, width, height, margin) {
			const regrid = width !== gridWidth || height !== gridHeight || -margin !== origin
			if (regrid || !sameRects(blend.from, from) || !sameRects(blend.to, to)) {
				from = blend.from
				to = blend.to
				gridWidth = width
				gridHeight = height
				origin = -margin
				columns = Math.max(1, Math.ceil((width + 2 * margin) / TILE))
				rows = Math.max(1, Math.ceil((height + 2 * margin) / TILE))
				tiles = []
				for (let row = 0; row < rows; row++) {
					for (let column = 0; column < columns; column++) {
						const x0 = origin + column * TILE
						const y0 = origin + row * TILE
						tiles.push({ from: zonesNear(from, x0, y0, x0 + TILE, y0 + TILE), to: zonesNear(to, x0, y0, x0 + TILE, y0 + TILE), level: blend.level })
					}
				}
			}
			for (const tile of tiles) tile.level = blend.level
		},
		factor(x, y, keeps) {
			// Drawn stars lie on the grid; the clamp only guards points outside it
			const column = Math.min(columns - 1, Math.max(0, Math.floor((x - origin) / TILE)))
			const row = Math.min(rows - 1, Math.max(0, Math.floor((y - origin) / TILE)))
			const tile = tiles[row * columns + column]
			return tile ? easedQuietFactor(tile, x, y, keeps) : 1
		},
	}
}
```

The domain-model draft checked this body over 722,355 lookups on 60 random layouts, edge cases included: they differed from `easedQuietFactor` over all zones by exactly 0 (H3 repeats it).

- **Why it is exact.**
  - A zone more than `QUIET.feather` from the point on either axis contributes nothing, and neither does one exactly `QUIET.feather` away (its quiet is 1 − smoothstep(0, 40, 40) = 0). `quietFactor` makes one pass, skips such a zone and lets the most protective of the others win (a minimum).
  - So a zone whose grown box doesn't touch a tile adds nothing anywhere in it, and a minimum over a subsequence that holds every contributing zone, in the same order, is the same number.
  - Each tile holds the same zone objects, so an `inkKeep` that is a function of the rect (`budgetKeeps`, reading its `headroom`) sees the same rect.
  - The per-tile blend then mixes the same two values by the same formula.
  - A blend may carry a waiting layout (`next`). The index ignores it, as `easedQuietFactor` does: only transients answer to it (`transientQuietFactor`).
- **Even empty tiles go through `easedQuietFactor`** while any zone exists. During an ease, a star far from every zone still computes `1 × level + 1 × (1 − level)`, which today's code also computes and which can round one unit below 1. Skipping it would break bit identity. Only `empty` (no zones at all) skips the lookup, exactly as today's `quiet` flag does.
- **Rebuilds.** Zones are in screen space, so drift frames never rebuild; only a scroll, a layout, or an ease starting or ending does. `update` compares the incoming lists with the last ones by content, using `sameRects`, moved from `sky.worker.ts:92-98` to `scene.ts` and exported with its `headroom` comparison, because `quietBlend` builds new arrays on every call (`sky.worker.ts:264-272`): a rect whose headroom alone changed rebuilds its tiles. 64 comparisons cost about 0.5 µs, and a rebuild 0.01 to 0.23 ms. The worker's `layout` handler keeps calling `sameRects(...)` unchanged; only its import moves.
- **Grid.** Tiles cover the viewport plus `margin` on every side. `renderSky.ts` owns one index at module scope (`const quietIndex = createQuietIndex()`, beside `EDGE`, the band in which stars beyond an edge are still drawn). `drawSky` calls `quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)` once per frame, before the layers, and `drawLayer` uses `if (!quietIndex.empty) alpha *= quietIndex.factor(x, y, config)` in place of `renderSky.ts:107` and `:120`. `SkyFrame` stays plain data (`quiet: QuietBlend`, filled from `quietBlend(t)` unchanged), so the worker's `draw` and `probeRaster` need no new argument.
- **Ownership.** It wraps the veil's `easedQuietFactor`, so that math stays the single source, and stays exact as long as no padded zone reaches past `ZONE_REACH` (H3). Transients keep the veil's `transientQuietFactor` over all zones (Q2).
- **Cost.** Star quiet math at 1,430 stars falls from 1.3 to 1.7 ms mid-ease to 0.14 to 0.32 ms. On a 1440 × 900 laptop it falls from about 0.11 to 0.40 ms to 0.04 to 0.12 ms (R3 §4.1).

### 6.5 The star-field cache, and why nothing wraps (P1)

```ts
// src/components/sky/renderSky.ts
/** Lazily generated cells of each layer's infinite plane, evicted by the frame they were last used in. */
export interface StarField {
	/** The stars of one cell; a cell beyond the key range (-32768 to 32767 on each axis) holds none, so keys never collide (SF2). */
	cell(layer: SkyLayer, cx: number, cy: number): readonly Star[]
	/** Starts a frame: cells looked up from now on count as in use. */
	beginFrame(): void
	/** Drops the cells this frame didn't use once the cache holds more than CELL_CACHE_SLACK times the cells in use (SF1). */
	trim(): void
}

/** How many times the cells in use the cache may hold before it drops the unused ones. */
const CELL_CACHE_SLACK = 2
```

Each cache entry records the frame it was last used in, and `trim()` deletes only entries not used this frame. So the cells on screen are never regenerated in one burst. Today's `cells.clear()` (`renderSky.ts:48`) regenerates every visible cell in one frame, a 0.25 to 1.2 ms spike at 4K plus garbage collection (R3 §5.3), and on a moving sky a spike shows as a stutter. `drawLayer` stops returning a cell count. `drawSky` calls `beginFrame()` before the layers and `trim()` after, replacing `trim(cells)` at `:155`.

**R1's bounded drift against R3's wrapping accumulators.**

- R3 designed per-layer drift accumulators (offset += velocity × dt) that grow without bound. It therefore wrapped them, and the cell lookups, at 2^16 cells to keep the numeric cell key (`renderSky.ts:39`) valid.
- The settled drift is different: a closed-form path of a clock, E(τ) − E(0). A circle can't carry anything farther than its diameter.
- **Every term of C is bounded:**
  - the drift within 205.2 px at q = 1 with these phases (212.3 px for any phases), 328 px for the brightest star;
  - the lean within 12 × √2 × 1.6 = 27 px;
  - the scroll term within 0.112 of the page's scroll range per pause cycle. Pausing, scrolling, pressing Play and scrolling back leaves up to one scroll range in `shift` (C8), so a visitor who repeats that adds up to one range each time.
- Chromium lays out at most about 33.5 million px (its layout unit is a 32-bit count of 1/64 px). So one cycle's largest star offset is about 3.76 million px, cell 14,680, inside the key range (−32,768 to 32,767 cells). On a 20,000 px page the scroll term reaches about 2,200 px per cycle for the brightest star, and only about 3,700 full-page pause cycles would reach the key range, where SF2 then shows no stars instead of wrong ones [computed].
- The only unbounded number is the drift clock, a time. After 30 days of continuous drift, its rounding moves a star by 2.5 × 10⁻⁹ px [computed, domain-model and delivery drafts].
- **So:**
  - there is no `FIELD_PERIOD`, no `wrapCell` and no accumulator to wrap;
  - what remains of R3's guard is SF2: `cell()` returns no stars unless `-0x8000 <= cx, cy < 0x8000`, instead of computing a colliding key (`cy` = 32,768 would share `cx + 1`'s key at −32,768). It is one comparison per lookup (100 to 500 a frame), it belongs to the `StarField` because the key encoding is its own invariant, it states that invariant in code rather than in a comment, and it is the only absolute bound on the pathological pause cycles above;
  - the key comment (`renderSky.ts:38`) states the bound above;
  - **`EDGE` stays 24** (`:93`), now documented: the largest halo's half-side is ⌈3σ⌉ of the 2.8 px halo in whole device pixels, at most 12 CSS px (at a 25% zoom, DPR 0.25, which `canvasDpr` passes through) and under 9.4 from DPR 1 [computed]. Culling is per star and continuous, so stars slide in from beyond the edge without popping (R3 §5.4).
- **R4's requirement**, "integrate, never compute speed × time", is met by integrating the *clock* (6.1).
- **Bounded drift also bounds the cache.** Sitting in the hero, the union of cells the drift ever visits is about twice the visible ones, so eviction matters mostly while scrolling, which is when today's clear fires too.

`drawLayer` after P2, in outline (emergence and twinkle lines as today):

```ts
/** Draws one depth layer: each star at its world position less its nearness times the camera. */
function drawLayer(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame, layer: SkyLayer): void {
	const scale = frame.layers[layer]
	if (scale <= MIN_STAR_ALPHA) return
	const config = LAYERS[layer]
	const { width, height, dpr, offset, snap } = frame
	const [qFar, qNear] = LAYER_NEARNESS[layer]
	// The cells this layer's stars can come from, for every nearness in its band
	const x0 = Math.floor((Math.min(offset.x * qFar, offset.x * qNear) - EDGE) / CELL_SIZE)
	const x1 = Math.floor((Math.max(offset.x * qFar, offset.x * qNear) + width + EDGE) / CELL_SIZE)
	const y0 = Math.floor((Math.min(offset.y * qFar, offset.y * qNear) - EDGE) / CELL_SIZE)
	const y1 = Math.floor((Math.max(offset.y * qFar, offset.y * qNear) + height + EDGE) / CELL_SIZE)
	const { image } = assets.atlas
	const emerging = frame.dusk !== Infinity
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			for (const star of field.cell(layer, cx, cy)) {
				if (star.keep >= frame.keep) continue
				// Subtract in doubles before anything reaches the canvas, whose coordinates are float32
				const x = star.x - offset.x * star.q
				const y = star.y - offset.y * star.q
				if (x < -EDGE || y < -EDGE || x > width + EDGE || y > height + EDGE) continue
				let alpha = star.alpha * scale
				if (emerging) alpha *= starEmergence(star.delay, frame.dusk)
				// A bright star beside the copy reads as punctuation or an accent
				if (!quietIndex.empty) alpha *= quietIndex.factor(x, y, config)
				// …twinkle exactly as renderSky.ts:121-125 (it reads frame.twinkleTime from P4)…
				if (alpha < MIN_STAR_ALPHA) continue
				const sprite = placePoint(assets.atlas, star.tint, star.shape, x * dpr, y * dpr, snap)
				if (!sprite) continue
				ctx.globalAlpha = Math.min(STAR_ALPHA.peak, alpha)
				ctx.drawImage(image, sprite.x, sprite.y, sprite.size, sprite.size, corner.x, corner.y, sprite.size, sprite.size)
			}
		}
	}
}
```

`SkyFrame.parallaxScroll` (`renderSky.ts:71-72`) becomes `offset: Vec` ("the camera's offset, CSS px at nearness 1"). `SkyFrame` also gains `snap: boolean`; the quiet index stays `renderSky.ts`'s own (6.4).

### 6.6 Presence, idle and the motion level

#### Presence (P4)

```ts
// src/lib/sky/presence.ts (new)
import { FRAME } from './config'
import { smoothstep } from './scene'

/** Whether the visitor seems to be here: their last input and their last return from an idle stretch (worker-clock ms). */
export interface Presence {
	lastInputAt: number
	wokeAt: number
}

/** A visitor who has just arrived. */
export function createPresence(now: number): Presence {
	return { lastInputAt: now, wokeAt: -Infinity }
}

/** No input (scroll, pointer, keys, focus, a return to the tab) for FRAME.idleSleepMs. */
export function isIdle(presence: Presence, now: number): boolean {
	return now - presence.lastInputAt > FRAME.idleSleepMs
}

/**
 * Records input. Back during the idle fade-out, ambient motion eases back in from where it was; after a full idle stretch,
 * from nothing. Returns true when the visitor was away, so the worker holds the next launch back.
 */
export function notePresence(presence: Presence, now: number): boolean {
	const since = now - presence.lastInputAt
	if (since > FRAME.idleSleepMs - FRAME.idleFadeMs) presence.wokeAt = now - Math.max(0, FRAME.idleSleepMs - since)
	const wasIdle = isIdle(presence, now)
	presence.lastInputAt = now
	return wasIdle
}

/** 0 to 1: the share of ambient motion presence allows, easing out before the idle sleep and in after a return (PR1). */
export function presenceLevel(presence: Presence, now: number): number {
	const fadingOut = smoothstep(FRAME.idleSleepMs - FRAME.idleFadeMs, FRAME.idleSleepMs, now - presence.lastInputAt)
	return (1 - fadingOut) * smoothstep(0, FRAME.idleFadeMs, now - presence.wokeAt)
}
```

These are today's `isIdle`, `idleTwinkle` and `noteInput` (`sky.worker.ts:100-128`), moved into the model with the same arithmetic, so twinkle behaves bit for bit as before (H11). The worker keeps a function named `noteInput(now)`, because the scroll handler calls it (`:533`):

```ts
/** Records input of any kind; back from an idle stretch, no shooting star straight away. */
function noteInput(now: number): void {
	if (notePresence(presence, now)) holdMeteors(now)
}
```

- `presence` is declared `let presence = createPresence(0)`, today's starting values (`sky.worker.ts:57-58`), as the camera is, since `scroll` and `visible` messages reach `noteInput` before `init`; `init` sets `presence = createPresence(now)` where today it sets `lastInputAt = now` (`:487`).
- `twinkleLevel` (`:111-113`) becomes `scene.twinkle × presenceLevel(presence, now)`, times the motion level from P5, and from P6 `scene.twinkle × driftGate.level`, the one ambient level `gather` computes for the twinkle and the drift (6.1). `meteorsAllowed` (`:163-165`) uses `!isIdle(presence, now)`: one presence gate for all ambient motion (R3 §2.5).

The main thread reports input that isn't scrolling:

```ts
// src/components/sky/mountSky.ts, beside DPR_CAP
/** Presence pings for the sky's idle clock, at most this often (ms): someone moving the pointer or typing is still here. */
const ACTIVITY_INTERVAL_MS = 1000

/** Input that shows someone is still here without scrolling. */
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const

// Inside mountSky, with the other listeners (mountSky.ts:310-314):
let lastActivity = -Infinity
const noteActivity = () => {
	const now = performance.now()
	// Before init there is no worker clock to wake
	if (offscreen || now - lastActivity < ACTIVITY_INTERVAL_MS) return
	lastActivity = now
	post({ type: 'activity' })
}
for (const type of ACTIVITY_EVENTS) window.addEventListener(type, noteActivity, { passive: true, signal })
```

- The worker handles `activity` with `noteInput(now)`, followed by the usual `schedule(now)`, whose `demandNow` gathers this moment's gates, so a ping after the idle sleep restarts frames at once (F6).
- `FRAME.idleSleepMs`'s doc changes from "with no scroll for this long" to "with no input (scroll, pointer, keys, focus) for this long ambient motion eases out, nothing new launches and the worker sleeps until the visitor is back", and `idleFadeMs`'s to "Ambient motion fades out and back in around the idle sleep": true of the twinkle now and of the drift later, so no later phase edits them.
- After 90 s without input:
  1. the drift rate eases to 0 over the last 4 s;
  2. the camera comes to rest and keeps its place;
  3. no part of the sky demands frames, so the worker sleeps. The one remaining timer is for a due transient, which isn't allowed while away.
- Any input eases everything back over 4 s from the same place (AC-33). The drift resumes even in the reading scene, where no twinkle wakes the worker, because its frames follow `driftWanted`, not the eased rate (F6).

**Within P4: a twinkle clock without hidden time** (R3 §6). Today, a tab hidden for a minute returns with every twinkling star at a new phase, so all of them change brightness at once. It costs a few lines and AC-32 checks it.

- `SkyFrame` gains `twinkleTime`: the worker clock minus `hiddenTotal`, the seconds the tab has spent hidden.
- The `visible` handler measures each hidden stretch once, from `hiddenAt`, adds it to `hiddenTotal`, and moves `exitAt` from the same measurement by today's rule (`sky.worker.ts:519`), which also starts a dusk that began while hidden: one measurement of hidden time, not two.
- Twinkle reads `twinkleTime`; meteors keep `frame.time`.

#### The motion level (P5)

Pausing, and switching reduced motion on or off, change `motion`, and the motion level eases between 0 and 1 over `FRAME.motionEase` (the worker sketch in 6.1). It scales twinkle (from P5, in place of `twinkleLevel`'s `motion === 'full'` guard, which would still drop the twinkle in one frame) and the drift rate (from P6):

```ts
// FRAME (config.ts:223-237), new key
	/**
	 * Seconds over which motion stops or starts again (the pause control, a reduced-motion switch): the drift and twinkle
	 * ease out or in, so nothing stops or starts in one frame, and even the brightest star at its peak speed moves only
	 * about 1 px after a pause.
	 */
	motionEase: 0.3,
```

- **Why a finite smoothstep, not an exponential.** It ends exactly, like the codebase's other eases (the idle fade, `QUIET.ease`), so the worker knows when to stop drawing. The experience draft's exponential with a "within a thousandth" cut-off only reached 0 after 1.38 s.
- **Why 0.3 s.** It is long enough to turn today's one-frame twinkle drop into a quick fade, and short enough for R4's AC-27: the brightest star at peak speed travels 6.82 × 0.15 = 1.02 px after the switch [computed].
- **One ease, two helpers.** The worker keeps the level as `motionLevel: Ease` (`pacing.ts`), read with `easeAt`. A load starts at rest on its motion's level (0 under reduced motion, `since: −Infinity`), so nothing eases at start.
- **The last frame.** `tick` sets `needsDraw` once when `easeEnded(motionLevel.since, FRAME.motionEase, t, lastDrawAt / 1000)`: the ease has run out and the last drawn frame fell inside it. That is the test `settleQuiet` (`sky.worker.ts:301`) makes for the quiet ease, and `settleQuiet` keeps its own copy (8.4); P6's thin fade uses `easeEnded` too. The last fade frame can land up to 33 ms before the end, at level 0.01 to 0.03, so without it a pause with a still camera (P5 before P6, reading at D2 = 0, software raster) would leave a trace of twinkle on screen (F7).
- **Under the eased stop**, the springs stop following at once (C6) and the drift slows with the level. A flying transient fades out over `TRANSIENTS.cancelFade` (from P8).

### 6.7 Scene integration (P6, P7, P8)

```ts
// src/lib/sky/config.ts
/**
 * Scroll narrative: the full sky in the hero, a dimmer and calmer sky while reading (no twinkle, the drift at about a
 * third), and a bookend near the end of the page. Levels blend continuously with scroll, so the narrative needs no clock
 * of its own. Star levels are per layer: while reading the brighter layers dim most, so no star behind body copy reads as
 * punctuation. `drift` scales the drift clock's rate (DRIFT); `lean` scales the pointer lean (LEAN), which only the hero has.
 */
export const SCENE = {
	hero: { stars: { far: 1, mid: 1, near: 1 }, haze: 1, twinkle: 1, drift: 1, lean: 1 },
	reading: { stars: { far: 0.6, mid: 0.4, near: 0.3 }, haze: 0.4, twinkle: 0, drift: 0.35, lean: 0 },
	end: { stars: { far: 0.9, mid: 0.9, near: 0.9 }, haze: 0.7, twinkle: 0.8, drift: 0.8, lean: 0 },
	// …heroFadeFrom, heroFadeTo, endFadeFrom, endFadeTo and heroMeteorMaxScroll unchanged (P8 renames the last)…
} as const
```

- `SceneLevels` (`scene.ts:11-18`) gains `drift: number` ("share of the drift clock's rate") in P6 and `lean: number` ("share of the pointer lean: hero only") in P7. P6 also rewrites `sceneAt`'s doc (`scene.ts:20-23`), whose "a dimmer and still sky while reading" no longer holds: "a dimmer, slowly drifting sky while reading".
- `sceneAt`'s `mix` (`scene.ts:30`) widens its key to `'haze' | 'twinkle' | 'drift' | 'lean'`: one mixer for every scalar level (DRY), and "hero only" for the lean is data, not a code path. The quiet functions in `scene.ts` are not touched.
- Levels are continuous in scroll, so moving from hero to reading changes the drift *rate* smoothly over 0.5 to 1.3 viewport heights of scroll.
- **P8** renames `SceneLevels.meteors` to `launches`, its doc keeping the veil's wording: "Transients launch only over the hero; shooting stars ignite and peak in clear sky and may glide on behind its copy, dimmed to what that copy can take (METEOR_VEIL)." It renames `SCENE.heroMeteorMaxScroll` (`config.ts:171`, read at `scene.ts:36`) to `heroLaunchMaxScroll` (value unchanged, 0.4), because it then gates every kind; its doc (`config.ts:170`) becomes "Transients launch only while no more than this many viewport heights are scrolled."
- **The dusk is unchanged.** The drift's ease starts with it (6.1), so the sky comes out already gently moving.
- **The drift and the springs never move quiet rects or transient paths.** Transients and quiet zones stay in screen space, and every star is veiled at its drawn position every frame. COORDINATION.md: "Star drift is fine, because each star is veiled at its own position every frame".
- **The kill switch for the drift** is `SCENE.hero.drift = SCENE.reading.drift = SCENE.end.drift = 0`. That gives no drift and no drift frames, with everything else intact. It is data, not a special case in code. (A comparison like `DRIFT.speed === 0` would not even compile: with `as const` the type of `DRIFT.speed` is the literal 3, so TypeScript reports TS2367.)

### 6.8 The pause control (P5)

#### Where the state lives

The pause choice is read by two unrelated client components (the control in the navbar, and the sky's controller under IntroGate's backdrop) and by `mountSky`, which isn't React. So it is a small external store, not React context:

```ts
// src/components/sky/skyPause.ts (new; main thread, no React)
import { REDUCED_MOTION_QUERY } from '@/lib/utils'

/** What the sky's pause control shows: the sky moves, or it holds still. */
export type SkyPlayback = 'playing' | 'paused'

/** localStorage key holding '1' while the visitor has paused the sky in this browser (WCAG 2.2.2's mechanism, remembered). */
const PAUSED_KEY = 'sky-paused'

/** Subscribers in this tab: the control and mountSky. */
const listeners = new Set<() => void>()
/** A sky is drawing (its worker has drawn a first frame); the control shows only then (PB4). */
let running = false
/** The stored pause, read once; null until first read. */
let stored: boolean | null = null
/** Play pressed while the OS asks for reduced motion: honored for this page view (one mount of the home page) only, never stored (PB1). */
let playOverride = false
let reducedMotion: MediaQueryList | null = null
let stopWatching: (() => void) | null = null

/** The reduced-motion query, created on first use, never during server rendering. */
function reduced(): MediaQueryList {
	reducedMotion ??= matchMedia(REDUCED_MOTION_QUERY)
	return reducedMotion
}

/** Whether the visitor paused the sky in this browser; blocked or missing storage counts as no (PB2). */
function storedPause(): boolean {
	if (stored === null) {
		try {
			stored = localStorage.getItem(PAUSED_KEY) === '1'
		} catch {
			stored = false
		}
	}
	return stored
}

function notify(): void {
	for (const listener of listeners) listener()
}

/** True when the sky should hold still (PB1): the visitor paused it, or reduced motion is on and they haven't pressed Play in this page view. */
export function skyPaused(): boolean {
	return storedPause() || (reduced().matches && !playOverride)
}

/** The control's state, or null while no sky runs (PB4). A string, so React's Object.is snapshot comparison is stable. */
export function skyPlayback(): SkyPlayback | null {
	if (!running) return null
	return skyPaused() ? 'paused' : 'playing'
}

/** Server render and hydration: no control (the choice lives in this browser, and no sky runs yet). */
export function serverSkyPlayback(): SkyPlayback | null {
	return null
}

/** mountSky reports that its sky draws (the worker's first frame) or has gone (destroyed, failed). */
export function setSkyRunning(next: boolean): void {
	if (running === next) return
	running = next
	notify()
}

/** Pauses or resumes the sky. A pause is remembered in this browser; Play forgets it, and under reduced motion lasts for this page view. */
export function setSkyPaused(paused: boolean): void {
	stored = paused
	playOverride = !paused && reduced().matches
	try {
		if (paused) localStorage.setItem(PAUSED_KEY, '1')
		else localStorage.removeItem(PAUSED_KEY)
	} catch {
		// Storage is blocked (a private window, say): the choice lasts for this page view
	}
	notify()
}

/** Calls `listener` whenever the playback may have changed (the control, another tab, the OS setting, the sky starting or stopping); returns the unsubscribe. */
export function subscribeSkyPlayback(listener: () => void): () => void {
	listeners.add(listener)
	if (!stopWatching) {
		const watch = new AbortController()
		// Reduced motion turned on or off: an earlier Play no longer applies
		reduced().addEventListener(
			'change',
			() => {
				playOverride = false
				notify()
			},
			{ signal: watch.signal }
		)
		// Paused or resumed in another tab (a null key means that tab cleared all its storage)
		window.addEventListener(
			'storage',
			(event) => {
				if (event.key !== PAUSED_KEY && event.key !== null) return
				stored = null
				notify()
			},
			{ signal: watch.signal }
		)
		stopWatching = () => watch.abort()
	}
	return () => {
		listeners.delete(listener)
		if (listeners.size > 0) return
		stopWatching?.()
		stopWatching = null
		// The home page unmounted (a client-side navigation away): its next mount reads storage and the OS setting afresh
		stored = null
		playOverride = false
	}
}
```

Nothing touches `window`, `matchMedia` or `localStorage` at module scope, so the module is safe to import from server-rendered client code.

**A page view is one mount of the home page.** Module state outlives the page across App Router navigations, which keep the document (`/links` and the not-found page link back to `/`, `PortfolioFooterLink.tsx:9-10`, `not-found.tsx:16`), and without Cache Components the home page unmounts while the visitor is away. The last unsubscribe therefore forgets the cached pause and any Play: on return, `mountSky`, the first to subscribe again, reads a pause made in another tab meanwhile and the current OS setting before it posts `init`. Resetting at the first subscribe instead would come after `mountSky`'s first read. StrictMode's dev remount is harmless, and IntroGate's key flip unmounts only the control while `mountSky` stays subscribed.

**Why only a pause is stored** (deviation 7). The default respects the OS setting on every visit, and a stored "playing" can never override a reduced-motion setting turned on later. A stored "paused" is always safe to keep.

The domain-model draft tested this store's rules with 12 behavior checks; H12 repeats them with the `running` flag added.

#### The control

```tsx
// src/components/sky/SkyPauseButton.tsx (new; rendered only by Navbar, a client entry, so no 'use client' here)
import { useSyncExternalStore } from 'react'
import { PauseSVG, PlaySVG } from '@/components/icons'
import { cn } from '@/lib'
import { serverSkyPlayback, setSkyPaused, skyPlayback, subscribeSkyPlayback } from './skyPause'

interface SkyPauseButtonProps {
	className?: string
}

/**
 * The home sky's pause control (WCAG 2.2.2, techniques G4 and G186): stops the drift, twinkle, parallax and shooting
 * stars, and starts them again from where they stopped. It follows the W3C APG carousel's rotation control: the name says
 * the action and changes with it, so it carries no aria-pressed. Paused by default under prefers-reduced-motion; renders
 * nothing until a sky runs.
 */
export default function SkyPauseButton({ className }: SkyPauseButtonProps) {
	const playback = useSyncExternalStore(subscribeSkyPlayback, skyPlayback, serverSkyPlayback)
	if (!playback) return null
	const paused = playback === 'paused'
	return (
		<button
			type="button"
			aria-label={paused ? 'Play sky animation' : 'Pause sky animation'}
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-green transition-colors duration-250 hover:bg-green-tint forced-colors:hidden [&_svg]:h-[20px] [&_svg]:w-[20px]',
				className
			)}
		>
			{paused ? <PlaySVG /> : <PauseSVG />}
		</button>
	)
}
```

- **Glyphs.** `src/components/icons/PauseSVG.tsx` and `PlaySVG.tsx` sit on the shared `Icon` frame (`icons/Icon.tsx`), with no `title`, so they are decorative and `aria-hidden`. They use Feather's "pause" (`<rect x="6" y="4" width="4" height="16" />` and `<rect x="14" y="4" width="4" height="16" />`) and "play" (`<polygon points="5 3 19 12 5 21 5 3" />`), MIT, like the other stroke icons (`ExternalLinkSVG`, `CalendarSVG`). Each has a default export and a named re-export in `icons/index.ts`. Their size comes from the button (`[&_svg]:…`), because the icon components take no props.
- **The pattern.** The W3C APG carousel's rotation control says: "The label changes to match the action the button will perform", and "since the label changes, the rotation control does not have any states, e.g., aria-pressed". The APG Button pattern sanctions the same choice: "if the design were to call for the button label to change from 'Mute' to 'Unmute,' the aria-pressed attribute would not be needed" (both fetched 2026-10-27). The glyph and the name agree for every user: two bars and "Pause sky animation" while the sky moves, a triangle and "Play sky animation" while it holds still. The name is an `aria-label`, as on the APG example's rotation button and on every icon-only control here (`Navbar.tsx:97`, `:114`); the name `SkyPauseButton` says it is not an `aria-pressed` toggle.
- **Targets and contrast.** The target is 40 × 40 CSS px; WCAG 2.5.8 needs 24 × 24. The glyph carries the state at 14.1:1 (green `#64ffda` on navy `#0a192f`) and 12.7:1 on the mobile menu's light navy [computed]. A state shown only by a 10% mint fill would be 1.28:1 and fail 1.4.11. The focus ring is the global `:focus-visible` rule, a 2 px dashed green outline (`globals.css:80-83`).
- **Forced colors.** `forced-colors:hidden`, because forced colors hide the sky (`Background.module.css:27-31`).
- **Hydration.** Both snapshots are `null` at hydration, and the visible navbar mounts fresh after IntroGate's key flip anyway (5.4).
- **React Compiler** is on, so there is no manual memoization; the store functions are module-level and stable.

#### Placement (D1 default)

```tsx
// src/components/Navbar.tsx: the last child of <nav> (Navbar.tsx:88), after #primary-nav, so the DOM order is the visual
// order at every width: logo, burger, control on phones; logo, links, Resume, control on desktop. The burger gains
// ml-auto and #primary-nav md:ml-auto, so each row's group sits on the right.
<motion.div
	variants={navItemVariants}
	custom={(NAV_SECTIONS.length + 1) * NAV_STAGGER}
	initial="hidden"
	animate="visible"
	// The open phone menu's panel covers this corner, so the control leaves the tab order with it (WCAG 2.4.11)
	inert={mobileMenuOpen}
>
	<SkyPauseButton className="ml-[10px] md:ml-[15px]" />
</motion.div>
```

- It joins the navbar's entrance stagger (`Navbar.tsx:14-18`) after the Resume button.
- No CSS `order`: focus follows the DOM, which matches the screen at every width (WCAG 2.4.3, technique C27).
- Margins live on the button, so the empty wrapper takes no space while no sky runs, and the burger stays at the right edge as today.
- **The open phone menu.** It is not modal for the header: only `#content` turns inert (`Navbar.tsx:52-53`), and its panel (`fixed right-0 top-0 h-screen w-3/4 ... z-[50]`, `:127`) covers the control while only the burger rises above it (`z-[100]`, `:117`). So the wrapper is `inert` while `mobileMenuOpen` (React 19 takes the boolean): Tab never lands on a covered control. On desktop the menu is always closed (`:48-50`).

**The header shows itself when focus enters it, and stays while it holds keyboard focus** (WCAG 2.4.7 Focus Visible and 2.4.11 Focus Not Obscured, AA). The header slides fully off-screen while the visitor scrolls down: y −70 on a 70 px header (`Navbar.tsx:79`). Today, a keyboard user tabbing into any nav control, the new one included, focuses something they cannot see, and Page Down or the arrow keys pressed on a focused control slide it away. Two small changes fix it for every nav item:

```tsx
// On the motion.header. Keyboard focus inside a hidden header would sit off screen (WCAG 2.4.7, 2.4.11)
onFocus={() => setHidden(false)}

// In the scroll callback (Navbar.tsx:31), with a ref on the header: never hide it while it holds keyboard focus.
// :focus-visible, so a mouse click on a nav link (which leaves focus on it in Chrome) still lets it hide as today
const focused = Boolean(headerRef.current?.querySelector(':focus-visible'))
setHidden(current > previous && current > 0 && !focused)
```

React's `onFocus` bubbles (React listens for `focusin`).

#### Wiring

```ts
// src/components/sky/mountSky.ts
// motion() (mountSky.ts:214) reads the store; the store owns the reduced-motion query for the sky
const motion = (): SkyMotion => (forcedColors.matches ? 'off' : skyPaused() ? 'reduced' : 'full')
let sentMotion = motion()
// Post only real changes: the store notifies whenever the playback may have changed (the sky starting or stopping, the
// OS setting, another tab), and many of those leave the motion as it was
const syncMotion = () => {
	const next = motion()
	if (next === sentMotion) return
	sentMotion = next
	post({ type: 'motion', motion: next })
}
const stopPlayback = subscribeSkyPlayback(syncMotion)
```

- `mountSky`'s own `reducedMotion` query, its import and its `change` listener (`:3`, `:211`, `:312`) go, because the store watches the query. The `forcedColors` listener stays and calls `syncMotion`.
- One channel carries both the preference and `running`: the control's snapshot needs both (PB4), and one `useSyncExternalStore` reads one store. Splitting them would not remove `syncMotion`'s dedupe, since the OS and storage listeners also notify without changing the motion.
- `init` posts `motion: sentMotion`.
- The worker-message listener (`:328-335`) becomes a `switch (event.data.type)`: `'ready'` sets `canvas.dataset.ready` and calls `setSkyRunning(true)`, `'error'` calls `destroy`, and a `never` default makes any new message type a compile error. Today's `else destroy()` would tear the sky down on the first new message (P13's `relay`, the debug patch's `debug-frame`), and TypeScript wouldn't flag it.
- `destroy` (`:316-326`) calls `stopPlayback()` and `setSkyRunning(false)`. A failed sky (an `'error'` message or a worker error) goes through `destroy`, so the control disappears with it.
- **No new worker message.** A pause arrives as `motion: 'reduced'`, the pipeline today's reduced motion already uses (PB3; R2 §9.4, R3 §11).
- `protocol.ts:32-38`: the `reduced` doc becomes "prefers-reduced-motion, or the visitor paused the sky (skyPause.ts): fades and brightness only", and `full` "twinkle, scroll parallax and its glide, and shooting stars"; P6, P7 and P8 add the drift, the pointer lean and "transients", giving 6.13's line.
- `AGENTS.md` gains one line under the sky notes, after the `data-sky-quiet` line and its quiet-copy precondition: "The sky's pause control (`src/components/sky/SkyPauseButton.tsx`, state in `skyPause.ts`) is its WCAG 2.2.2 mechanism: it maps to the worker's `motion: 'reduced'`, and any new continuous sky motion must stop under it."

### 6.9 The transient system (P8)

#### Rules the visitor would notice if they broke

- One transient near the copy at a time, then a rest before the next crossing, and none at the start of a visit (the one-lane bridge).
- Any two launches at least 3 s apart: onsets draw the eye, so they never stack (R4 AC-18).
- Everything ends through light: a fade, never a cut.
  - As the page scrolls from where a transient launched, it dims from 12 px and is gone by 24 px (the veil's `scrollKept`); a pause fades it out over 0.2 s (R2 §9.4: "fade out over 200 ms or less (a frozen streak looks broken)").
  - Hiding the tab or resizing drops it at once: nobody sees it, or its plan no longer fits the copy.
  - Copy that moves under one in flight (a layout change) dims it in one frame, by up to 0.88 of white at 1440 × 900 (never seen live): the veil's `transientQuietFactor` follows the new zones at once. Every kind inherits it; no check here promises a fade there.
- At most 5 s from first light to last.

#### Types

`transients.ts` knows no kind: it holds the envelope, the registry, the scheduler, the lease, the cancel and the demand. Each kind's module exports its spec (`METEOR_SPEC` in `meteorKind.ts`, `SATELLITE_SPEC` in `satellites.ts`) and imports only types back (5.2).

```ts
// src/lib/sky/transients.ts (new; kind-agnostic)
import { TRANSIENTS } from './config'
import { METEOR_SPEC, createMeteorMemory, type MeteorMemory } from './meteorKind'
import type { Meteor, MeteorField } from './meteors'
import { EVERY_FRAME, FADE_FRAMES, NO_FRAMES, fadeOutAt, type FrameDemand } from './pacing'
import type { SkyRect } from './protocol'
import type { Random } from './random'
import { scrollKept } from './scene'
// P11 adds: import { SATELLITE_SPEC, type SatellitePass } from './satellites'

/** The model behind each kind: what its planner returns and its drawing reads. P11 adds `satellite: SatellitePass`. */
export interface TransientBodies {
	meteor: Meteor
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in launch-check order (shooting stars first: they are the most frequent). */
export const TRANSIENT_KINDS = ['meteor'] as const satisfies readonly TransientKind[]

/** Where transients may fly: the viewport and the padded quiet rects on screen (CSS px), the field every kind plans in. */
export interface SkyField extends MeteorField {
	/** The padded zones of copy pinned to the screen (the side rails), also in `quiet`: shooting stars keep clear of them (planMeteor's clearOf). (P9; P8 aliases MeteorField) */
	pinned: readonly SkyRect[]
}

/** What the scheduler tracks for a transient of kind K. Times are seconds on the worker clock. */
export interface TransientEnvelope<K extends TransientKind> {
	kind: K
	body: TransientBodies[K]
	startedAt: number
	/** First light to last (s), wake, train and fades included; set once at launch from the kind's spec (T1). */
	lifetime: number
	/** Its body reported that its light may reach quiet copy (spec.nearCopy), so it holds the ink lease until it retires (T2). */
	nearCopy: boolean
	/** It never takes the lease: planned in clear sky and drawn with CLEAR_SKY_KEEPS (T3). */
	clearSky: boolean
	/** scrollY at launch: scrollKept measures from here (T4). */
	launchScrollY: number
	/** When the pause (or reduced motion) cancelled it: it fades out over TRANSIENTS.cancelFade. Null while it runs its course. */
	cancelledAt: number | null
}

/** A transient in the sky: its kind's body plus what the scheduler tracks for every kind. */
export type Transient = { [K in TransientKind]: TransientEnvelope<K> }[TransientKind]

/** What a visit remembers between launches, one entry per kind family, each owned by its module. A hidden tab and a layout keep it; a resize calls each spec's forget. */
export interface VisitMemory {
	meteor: MeteorMemory
}

/** What a planner gets: the moment, the field, the visit's memory, and whether its light may reach quiet copy. */
export interface PlanContext {
	random: Random
	/** Worker-clock seconds: the transient's start. */
	now: number
	field: SkyField
	visit: VisitMemory
	/** The ink lease is free and the crossing cooldown is over, so the plan may pass near quiet copy (planMeteor's nearCopy option); false keeps it in clear sky. */
	nearCopy: boolean
	/** Share of each rect's ink budget a transient may keep on the copy (the contrast preference's meteorInk): planMeteor's ink option. */
	ink: number
	narrow: boolean
	/** Seconds since the reveal: a kind may wait for the visit to settle (fireballs wait METEOR_KINDS.fireball.after). (P10) */
	sinceReveal: number
}

/** How one kind is timed and planned; each kind's module exports one. Drawing lives with the canvas code (drawTransient). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before this kind's first attempt. */
	firstDelay(random: Random): number
	/** Seconds after a launch until the next attempt: the body's own time, then the kind's gap (stretched on long visits). */
	nextAfter(body: TransientBodies[K], random: Random, sinceReveal: number, narrow: boolean): number
	/** A body for this moment, or null when nothing fits (through the veil checks when context.nearCopy lets it reach copy). */
	plan(context: PlanContext): TransientBodies[K] | null
	/** First light to last (s). */
	lifetime(body: TransientBodies[K]): number
	/** True while it moves on screen: it needs every animation frame. */
	moving(body: TransientBodies[K], now: number): boolean
	/** Its light may reach quiet copy, so it holds the ink lease: the body's own report (Meteor.nearCopy), never a copy of the context. */
	nearCopy(body: TransientBodies[K]): boolean
	/** This kind may take the ink lease; false (satellites) plans in clear sky only and draws with CLEAR_SKY_KEEPS (T3). */
	lease: boolean
	/** It may launch on narrow screens (phones). */
	phones: boolean
	/** The viewport changed: forget this kind's part of the visit's memory. */
	forget?(visit: VisitMemory): void
}

/** Every kind's spec: a kind without one fails to compile. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = { meteor: METEOR_SPEC }
```

Every call into a spec goes through a helper generic in K, `launchKind<K>(schedule, kind, context, ...)` and `movingOf<K>(transient, now)`, because TypeScript can't correlate a union of transients with a union of specs (microsoft/TypeScript#30581, R3 §7.4): a call such as `SPECS[transient.kind].moving(transient.body, now)` on a `Transient` fails with TS2345 once P11 adds a second kind. Inside the helpers `SPECS[kind]` is `TransientSpec<K>`, and the launch's `schedule.active.push(envelope as Transient)` is the one cast [computed, TypeScript 6.0.3 and Node's type stripping, both kinds, `reviser-r4/`].

The meteor kind lives in its own module:

```ts
// src/lib/sky/meteorKind.ts (new): the meteor kind
import { METEOR } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, pickRadiant, planMeteor, type Meteor, type Point } from './meteors'
import { between } from './random'
import type { PlanContext, TransientSpec } from './transients'

/**
 * What the meteor family remembers between launches. P8: the sticky radiant. P9: the visit's sky (VisitSky) instead.
 * P10: when the last fireball flew. A failed launch allowed near copy and a resize (forget) clear the radiant or the sky;
 * nothing clears the last fireball's time within a page view (RD1).
 */
export interface MeteorMemory {
	radiant: Point | null
}

/** The meteor family's memory at the start of a visit, nothing remembered yet: createTransientSchedule builds `visit` from it. */
export function createMeteorMemory(): MeteorMemory {
	return { radiant: null }
}

/**
 * Plans one launch: it draws the fresh radiants first (up to METEOR.radiantTries, 1 on narrow screens), then tries long
 * flights (`flights: 'long'`) on the visit's sticky radiant and the fresh ones before the short fallback
 * (`flights: 'short'`) over the same radiants, each with the context's `nearCopy` and `ink` and, from P9, the field's
 * `pinned` as `clearOf`; a fit keeps its radiant. From P9 the visit's sky replaces the radiant: it picks one when there is
 * none (pickVisitSky) and tries the steer visitSteer draws, then fresh steers, each a new source and scatter (I2), in the
 * same pass order. When none fits it clears the radiant (P8) or the sky (P9), unless the context kept it in clear sky
 * (`nearCopy` false): that failure proves nothing about the sky.
 */
function planMeteorTransient(context: PlanContext): Meteor | null

/** The meteor kind's timing and planning. */
export const METEOR_SPEC: TransientSpec<'meteor'> = {
	firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
	// P8: today's law (gap after the flight, ×1.5 after 180 s); P9: nextGap(random, METEOR_RATE.hero or .narrow, sinceReveal)
	nextAfter: (meteor, random, sinceReveal) => meteor.duration + nextMeteorGap(random, sinceReveal),
	plan: planMeteorTransient,
	lifetime: meteorLifetime,
	moving: meteorMoving,
	nearCopy: (meteor) => meteor.nearCopy,
	lease: true,
	phones: true,
	forget: (visit) => {
		visit.meteor.radiant = null
	},
}
```

#### The scheduler

```ts
/** Whether and where transients may launch now; the worker refills one reused gate every tick (T6). */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches). */
	allowed: boolean
	/** No scroll for TRANSIENTS.scrollQuiet seconds. */
	settled: boolean
	/** A narrow screen (the worker's narrowScreen): phones keep their own limit (P8) and gaps (P9). */
	narrow: boolean
	sinceReveal: number
	scrollY: number
	/** The field to plan in, built afresh on each call, so the launch step builds it once, only for a due kind it may plan. */
	field(): SkyField
	/** The contrast preference's meteorInk (the worker's contrastLevels()): PlanContext.ink. */
	ink: number
}

/** The scheduler's state: what flies, and when each kind tries next. */
export interface TransientSchedule {
	active: Transient[]
	/** Next launch attempt per kind (s); Infinity until the reveal. */
	nextAt: Record<TransientKind, number>
	/** Plans in a row that found no room, per kind; at TRANSIENTS.maxFailedPlans the kind waits for a new layout. */
	failedPlans: Record<TransientKind, number>
	/** Launches this visit (narrow screens stop at TRANSIENTS.narrowLimit). */
	launched: number
	/** Last onset of any kind (s): onsets stay TRANSIENTS.minOnsetGap apart (T5). */
	lastOnsetAt: number
	/** Before this (s) every plan stays in clear sky: the crossing cooldown after the reveal and after the last lease began (T2). */
	crossingAfter: number
	visit: VisitMemory
}

/** An empty schedule; each family's memory comes from its own module (createMeteorMemory), so this one never changes with it. */
export function createTransientSchedule(): TransientSchedule
/** Starts each kind's clock at the reveal with its own first delay, and the crossing cooldown (crossingAfter = now + TRANSIENTS.crossingCooldown). */
export function revealTransients(schedule: TransientSchedule, random: Random, now: number): void
/** No launch for TRANSIENTS.afterReturn s after the visitor is back (to the tab, from idle, to full motion). `now` in seconds. */
export function holdTransients(schedule: TransientSchedule, now: number): void
/**
 * One tick: retires what has finished or kept no light (transientFade), then launches each kind that is due and allowed.
 * Returns true when anything changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: Random, now: number, gate: LaunchGate): boolean
/** Fades every active transient out over TRANSIENTS.cancelFade (pause, reduced motion). */
export function cancelTransients(schedule: TransientSchedule, now: number): void
/** Removes every active transient at once (hidden tab, resize: their paths belonged to the old layout); the visit's memory stays. */
export function dropTransients(schedule: TransientSchedule): void
/** A new layout may have room again: kinds stopped after TRANSIENTS.maxFailedPlans failures retry after TRANSIENTS.retry; the worker calls it on every layout message. `now` in seconds. */
export function retryTransients(schedule: TransientSchedule, random: Random, now: number): void
/** The viewport changed: every spec forgets its part of the visit's memory (the meteor radiant in P8, the visit's sky from P9). A layout never calls it (RD1). */
export function forgetVisitSky(schedule: TransientSchedule): void
/** Every animation frame while one moves (cancel fades included), fade frames while one lingers (a train), else none. */
export function transientDemand(schedule: TransientSchedule, now: number): FrameDemand
/** The earliest next attempt of any kind (s), for the one timer a sleeping worker keeps. */
export function nextLaunchAt(schedule: TransientSchedule): number
/**
 * Share of its light a transient keeps (T4): the veil's scrollKept from its launch scroll, with the pause fade (over
 * TRANSIENTS.cancelFade once cancelled) as scrollKept's own `fade`. The scheduler retires it at 0, and the worker draws
 * it with this as drawMeteor's `fade`.
 */
export function transientFade(transient: Transient, now: number, scrollY: number): number {
	return scrollKept(transient.launchScrollY, scrollY, fadeOutAt(transient.cancelledAt, TRANSIENTS.cancelFade, now))
}

/** An active transient holds the ink lease: its light may reach quiet copy (T2). */
export function leaseHeld(schedule: TransientSchedule): boolean {
	return schedule.active.some((transient) => transient.nearCopy)
}

/** The ink lease is free: nobody holds it, and the crossing cooldown is over (T2). */
export function inkLeaseFree(schedule: TransientSchedule, now: number): boolean {
	return now >= schedule.crossingAfter && !leaseHeld(schedule)
}
```

**One tick of `updateTransients`**, in order, each rule once:

1. **Retire (T1, T4)** each transient at the earlier of `startedAt + lifetime` and the tick its `transientFade(transient, now, gate.scrollY)` reaches 0, so a cancel never extends a life. That is the veil's `scrollKept` (all light within 12 px of the launch scroll, none from 24 px, times the pause fade), the only scroll-cancel rule (deviation 8): it follows the scroll position, so even a one-step jump retires a transient at once, and the `scroll` handler never evaluates it (I3).
2. **For each kind in `TRANSIENT_KINDS`:**
   1. *Not due* (`now < nextAt[kind]`): skip.
   2. *Held back* (one of the following): set `nextAt[kind] = now + TRANSIENTS.recheck`.
      - `!gate.allowed` or `!gate.settled`;
      - on a narrow screen only: a kind with `!spec.phones`, or `launched >= TRANSIENTS.narrowLimit`;
      - an onset within `TRANSIENTS.minOnsetGap` (T5);
      - one of this kind already active (T7);
      - from P11, under D12's default: a kind with `lease` false while `leaseHeld(schedule)`;
      - from P12: a kind outside its `spec.scene`, or at its `spec.limit` launches this visit (`kindLaunches[kind]`), or, last, one whose `spec.room(field)` is false, `field` being `gate.field()` built here once and passed on to the plan.
   3. *Plan* in `gate.field()` (or that `field`) with `nearCopy: spec.lease && inkLeaseFree(schedule, now)` and the gate's `ink`. From P11, under D12's default, `nearCopy` is also true only while no other transient is active, so the hold runs both ways; and it is false while a sky body shows (P12's `LaunchGate.bodyShowing`, under either answer).
      - If the plan is null, `failedPlans[kind]++`. Retry after `between(random, ...TRANSIENTS.retry)`, or after `maxFailedPlans` wait for a new layout (`Infinity`), as today (`sky.worker.ts:227-231`). A null plan made with `nearCopy` false (the lease busy or the cooldown running, the reveal's included) only retries: clear sky alone failing shows no lack of room, and on a phone, where the hero copy leaves little clear sky, counting it could stop shooting stars for the visit. From P12 so does a null plan of a kind with a `room` test: its room moves with the scroll, which posts no layout. In P8 every plan may reach copy, so this matches the oracle.
      - The scheduler resets nothing else. From P9 the meteor planner has already cleared the visit's sky (its doc above), so each strike tries a fresh sky, and `maxFailedPlans` strikes in a row mean the layout has no room, not that one sky was bad.
      - A plan whose lifetime exceeds `TRANSIENTS.maxLife`, or whose body reports `nearCopy` (`spec.nearCopy`) when its context's `nearCopy` was false, counts as failed: T1 and T2 are enforced at the one place every transient enters the sky, whatever a planner does.
   4. *Launch* (in `launchKind<K>`). Push the envelope with `startedAt: now`, `nearCopy: spec.nearCopy(body)`, `clearSky: !spec.lease`, `launchScrollY: gate.scrollY` and `cancelledAt: null`.
      - `schedule.active.push(envelope as Transient)` is the one cast (Types, above).
      - Then set `lastOnsetAt = now` and `failedPlans[kind] = 0` (as today, `sky.worker.ts:233`), increment `launched` (and from P12 `kindLaunches[kind]`), set `crossingAfter = now + TRANSIENTS.crossingCooldown` if `nearCopy`, and set `nextAt[kind] = now + spec.nextAfter(body, random, gate.sinceReveal, gate.narrow)`. Gaps count from the end of the body's own time, as today, so meteors never overlap.

```ts
// src/lib/sky/config.ts (P8)
/**
 * Every short-lived sky event (shooting stars, satellites): at most `maxLife` seconds from first light to last, wake,
 * train and fades included (WCAG 2.2.2's 5 s, per animation); onsets at least `minOnsetGap` seconds apart, since a motion
 * onset draws the eye; one of each kind at a time; on narrow screens at most `narrowLimit` per visit. Only one transient at
 * a time may plan its light onto quiet copy (it holds the ink lease: each rect's INK_BUDGET counts one transient plus the
 * haze), and none may do so until `crossingCooldown` seconds after the reveal and after the last lease began, so copy
 * crossings stay rare (0 in P8; from P9 set from the crossing share measured on captured layouts, 55 to start). A pause
 * fades every transient out over `cancelFade` seconds, through scrollKept, which also takes it away as the page scrolls
 * from its launch (SCROLL_CANCEL). A plan that finds no room waits `retry` seconds; after `maxFailedPlans` in a row the
 * kind waits for a new layout. A held launch looks again after `recheck` seconds; a launch waits `scrollQuiet` seconds
 * after scrolling stops, and after a return (tab, idle, full motion) nothing launches for `afterReturn` seconds.
 */
export const TRANSIENTS = {
	maxLife: 5,
	minOnsetGap: 3,
	narrowLimit: 2,
	crossingCooldown: 0,
	cancelFade: 0.2,
	retry: [5, 9],
	maxFailedPlans: 3,
	recheck: 1,
	scrollQuiet: 1.2,
	afterReturn: 3,
} as const
```

**Changes to `METEOR` in P8 and P9.**

- P8 moves `retry`, `maxFailedPlans`, `recheck`, `afterReturn` and `narrowLimit` out of `METEOR` (`config.ts:262-271`, `:305`), because they now apply to every kind, and the narrow block's doc (`:299`) drops "`narrowLimit` per visit" (P9 rewrites the rest). For the same reason `FRAME.meteorScrollQuietMs` (`config.ts:231-232`, 1200 ms) becomes `TRANSIENTS.scrollQuiet` (1.2 s); after P8 the launch gate is its one reader.
- `narrowLimit` stays 2 in P8 (no visible change) and becomes 6 in P9.
- P9 adds `TRANSIENTS.longVisit: { from: 120, scale: 240, max: 3 }` and its doc sentence: "From `longVisit.from` seconds after the reveal every gap stretches by 1 + (t − from) / `longVisit.scale`, at most `longVisit.max` times (half the rate at 6 minutes, a third at 10), so a long visit never turns into a screensaver".
- **The pause fade.** `cancelFade` (0.2 s, R2's limit) is the pause's fade (and, if P12 builds the comet, its box fade), never a scroll distance: those are the veil's `SCROLL_CANCEL` (12 to 24 px), never a key of ours.
- **The cooldown.** `crossingCooldown` is 0 in P8: one meteor flies at a time with today's 30 s floor, so P8 launches exactly as the oracle does (H7). P9 sets it with the new rate by the rule below (55 s to start; AC-38, deviation 11). A crossing is a launch that takes the lease (its meteor reports `nearCopy`).
  - **The bar** is what the veil commit flies on the same captured layouts over a visit's first two minutes: its `nearCopy` launches a minute, retrying a null plan as its worker does (`sky.worker.ts:227-231`), which H9 measures with H7's oracle. On desktop nearly every attempt plans, so it is the landed `nearCopy` share (`COORDINATION.md`, "Landed in the working tree") × about 1.6 launches a minute: 0.97, 0.90, 0.56, 1.09, 0.77, 0.95 and 1.36 a minute at 1440 × 900, 1280 × 800, 1920 × 1080, 1366 × 768, 1536 × 864, 1280 × 720 and 1024 × 768, and 0.41 at 2560 × 1440 (share 25.8%, the lowest) [computed, `reviser-r7/cooldown-landed.mjs`, `reviser-r8/bars9.mjs`]. The phone's 67.3% counts planner attempts, a third of which find no path and are retried, and nearly every planned flight there dims near copy, so its two launches a visit give about 0.96 a minute [computed, check report].
  - **Why the reveal starts it.** A cooldown started at the first crossing needs 1.5 to 2 times the length (at a P9 share of 0.5: 55, 65 and 110 s against 35, 35 and 55 s at the first three layouts), because the one crossing it always allows comes while the visitor starts reading [computed]. So `revealTransients` starts it, and no transient crosses copy in a visit's first `crossingCooldown` seconds; in P8 (0 s) that changes nothing.
  - **The setting** is a two-way knob: the smallest multiple of 5 s whose H9 rate on every captured layout, at P9's share there, is at or below that layout's bar (so the layout needing the most sets it), raising it as readily as lowering it. By P9's share of lease-free launches that take the lease [computed]:

  | P9's crossing share | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 |
  |---|---|---|---|---|---|---|
  | Crossings a minute at 55 s | 0.341 | 0.425 | 0.479 | 0.517 | 0.545 | 0.569 |
  | Setting at 1440 × 900 (bar 0.97) | 5 s | 20 s | 25 s | 35 s | 35 s | 40 s |
  | Setting at 1280 × 800 (bar 0.90) | 10 s | 20 s | 30 s | 35 s | 40 s | 45 s |
  | Setting at 1920 × 1080 (bar 0.56) | 30 s | 45 s | 50 s | 55 s | 55 s | 60 s |
  | Setting at 2560 × 1440 (bar 0.41) | 45 s | 60 s | 75 s | 85 s | 95 s | 100 s |

  So 55 s meets every other desktop layout's bar for shares up to 0.6 (the four untabled ones need at most 50 s even at 0.7), but 2560 × 1440's only up to 0.28: there P9's measured share sets the cooldown, and above about 0.55 (90 s) a slower `METEOR_RATE.hero` is the better lever. On the phone a plan allowed near copy nearly always flies near it, so P9's rate there turns on how often a clear-sky plan fits during the cooldown: at 55 s about 0.52 a minute if every one fits and up to 0.90 if none does, 0.50 at 60 s either way, all under its bar [computed, check report; `reviser-r9/phone-r9.mjs`]; at 50 s it reaches 0.95 to 1.0 where none fits, so H9's fit rate bears on a setting below 55 s. AC-38's window stays a visit's first two minutes: over five, the same settings let P9 cross up to about 40% more often than the veil commit at 1920 × 1080 and 2560 × 1440, where parity would need 45 to 85 s and 75 to 120 s for shares of 0.2 to 0.5 [computed, check report].

`random.ts` gains `export type Random = () => number`, used by every new signature; existing signatures keep `() => number`.

#### The gap law (P9)

```ts
// src/lib/sky/config.ts (P9), next to METEOR_RATE and SATELLITE, which use it
/** Poisson arrivals with a refractory floor and a cap: floor + Exp(mean), at most cap. */
export interface GapLaw {
	/** Shortest gap (s). */
	floor: number
	/** Mean of the exponential part added to the floor (s). */
	mean: number
	/** Longest gap (s). */
	cap: number
}

// src/lib/sky/gaps.ts (new): a leaf every kind's module imports, so none needs a value from transients.ts (5.2)
import { TRANSIENTS, type GapLaw } from './config'
import type { Random } from './random'

/** Seconds until a kind's next launch: one law for every clock, stretched on long visits (TRANSIENTS.longVisit). */
export function nextGap(random: Random, law: GapLaw, sinceReveal: number): number {
	const { from, scale, max } = TRANSIENTS.longVisit
	const stretch = Math.min(max, 1 + Math.max(0, sinceReveal - from) / scale)
	return Math.min(law.cap, law.floor - law.mean * Math.log(1 - random())) * stretch
}
```

Its mean before the stretch is floor + mean · (1 − e^(−(cap − floor) / mean)): 11.69 s for the hero, 21.00 s for narrow screens and 84.46 s for satellites. Today's law (30 + Exp(12), capped at 75 s) gives 41.72 s [computed].

#### Drawing

```ts
// src/components/sky/renderSky.ts
/**
 * Draws one transient at the frame's time with the share of its light it keeps (`fade`: transientFade, from the worker,
 * which holds scrollY). Clear-sky kinds draw with CLEAR_SKY_KEEPS, chosen here for every drawer (T3); a kind without a
 * case fails to compile.
 */
export function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame, fade: number): void {
	// Destructured, so TypeScript narrows `body` with `kind` and the check below holds with one kind or many
	const { kind, body } = transient
	switch (kind) {
		case 'meteor':
			drawMeteor(ctx, assets, body, frame, fade)
			return
		// P11: case 'satellite': drawSatellite(ctx, assets, body, frame, fade, CLEAR_SKY_KEEPS); return
		default: {
			const unhandled: never = kind
			return unhandled
		}
	}
}
```

It uses a `switch` with a `never` check rather than a record of drawers, for the same reason as the spec helpers (#30581). The check is on the destructured `kind`: with one kind a `never` check on `transient` fails to compile (TS2322), and with two `transient.kind` would be TS2339; `kind` compiles in both and still fails for a kind without a case [computed, TypeScript 6.0.3, `reviser-r4/tc/one.ts` and `two.ts`]. `drawMeteor`'s `fade` is the veil's (I7, 8.3). P12's clear-sky meteor variants get `transient.clearSky ? CLEAR_SKY_KEEPS : undefined` as one more `drawMeteor` argument (6.12).

#### In the worker (P8)

- `nextMeteorAt`, `meteor`, `launchScrollY`, `radiant`, `launched` and `failedPlans` (`sky.worker.ts:65-72`) become `const transients = createTransientSchedule()`. Not `schedule`: that name is the frame scheduler, `function schedule(now)` (`:171`), which the message listener and our own functions call (a second declaration is TS2300).
- `updateMeteor` (`:212-238`) and `planLaunch` (`:246-261`) become one `updateTransients(transients, random, t, launchGate(now))` call; when it returns true, set `needsDraw`.
  - `launchGate(now)` refills one reused gate, as `frameState` is, from `launchesAllowed` (today's `meteorsAllowed`, `:163-165`, renamed for every kind and documented "True when transients may launch at all right now (each kind's own timing aside)") and the scroll-quiet test (`:222`), now `settled: now - lastScrollAt >= TRANSIENTS.scrollQuiet * 1000`: worker milliseconds against the key's seconds, converted as for the hold and the retry below. Its `narrow` is `narrowScreen` (6.1), not a second test of the width (`:221`). No harness-built gate reaches this adapter, so H13's case 7 runs it.
  - Its `field()` builds today's field, `{ width, height, quiet: screenQuietZones(quiet, scrollY, pinned) }` (`:226`), once per due kind past its holds (step 2.2), as `updateMeteor` builds it only past its due check and holds (`:220-226`); from P9 it pads the rails once (`screenQuietZones([], scrollY, pinned)`) for both `quiet` and `pinned` (6.10). Its `ink` is `contrastLevels().meteorInk`, which `planLaunch` passes.
- `holdMeteors(now)` and `retryMeteors(now)` become `holdTransients(transients, now / 1000)` and `retryTransients(transients, random, now / 1000)`: today's callers pass worker milliseconds and convert inside (`:117`, `:411`), while the schedule keeps seconds. `reveal` calls `revealTransients`. `reveal`'s doc (`:455`), the `motion` case's comment (`:504`) and `noteInput`'s doc say transients, not shooting stars ("no launch straight away").
- The `motion` handler's `meteor = null` (`:507`) becomes `cancelTransients(transients, t)`. Hidden and resize call `dropTransients` (`:514`, `:436`).
- `resize`'s `radiant = null` (`:435`), the one line outside the planner that clears the radiant, becomes `forgetVisitSky(transients)`, so P8 forgets exactly when the oracle does (H7). The layout handler never re-picks it, because layouts also fire for harmless re-measures, and from P9 a layout keeps the visit's sky the same way. A hidden tab keeps both (RD1).
- `demandNow`'s meteor line becomes `frameState.transientDemand = transientDemand(transients, t)`, and the sleeping timer uses `nextLaunchAt(transients)`, armed only while `launchesAllowed(now)`, the test the gate's `allowed` reads, as today (`:183`), so a worker asleep in the reading scene stays asleep.
- `draw` (`:329-342`) calls `drawTransient(ctx, assets, transient, frame, transientFade(transient, t, scrollY))` for each active transient, in place of the veil commit's `drawMeteor(..., scrollKept(launchScrollY, scrollY))`.
- So the scroll cancel (`scrollKept`'s retire in `updateMeteor` and its fade in `draw`) moves into `updateTransients` and `transientFade` for every kind (I3); P8's only edit to the `scroll` handler is step 4's removal of the `parallaxScroll` write.
- **`parallaxScroll` retires** (P8's last step): `updateCamera` reads `scrollY`, and its three writers go: the `scroll` handler's write, the `motion` handler's resume line and `init`'s chained assignment, which becomes `scrollY = message.scrollY` (`:486`). Nothing visible changes: while stopped the springs hold, and `resumeCamera` sets `shift` and `lastGoal` so the next goal is the camera's own position. H5's pause, scroll, resume case, fed the live scroll while paused, checks it.

### 6.10 The meteor population model and speed classes (P9)

#### What it buys the visitor

Directions come from real geometry instead of one diagonal (R2 §4).

- **The direction mix.** At a window pitched 40°, about 75% of real meteors fall, 13.5% slant sideways and 11% climb, evenly left and right, for starts across the whole width (R2 §4.3). The plan keeps today's right-hand spawn area, where paths run away from vanishing points that mostly lie farther left, so planned launches (with D8's default guard and the end guards below) come out at about 76% falling, 17% sideways and 7% climbing, and about 57% head right, away from the left-aligned copy [computed].
- **The shower.** Meteors from the visit's shower fan out from a shared vanishing point (when the radiant is behind the viewer, they converge toward the opposite point instead, R2 §4.2).
- **The radiant on screen.** On 15% of desktop visits the shower radiant sits on screen in open sky (never on phones, deviation 14). Its meteors there are short, slow stubs, and with D4 the head-on ones become point flashes.
- **Speed and color.** Speed and wake color vary by class: quick ones cool to mint, slow ones glow warm, medium ones stay white.

#### Config

```ts
// src/lib/sky/config.ts (P9)
/**
 * The screen as a window on the sky, for the geometry of shooting stars and satellites: its longer side spans `fov`
 * degrees and its center looks `elevation` degrees above a horizon just below the screen, so a 16:10 window spans about 18°
 * at its bottom corners to 60° at the top of its center (twinkle already grows toward the bottom, TWINKLE_HORIZON_GAIN).
 * A nominal speed of 0.2 long sides a second is 12°/s here, a medium meteor (IMO: 3 to 25°/s). Shooting stars glow
 * about `meteorHeightKm` km up over a planet of radius `earthRadiusKm` km, so lower in the window they are farther away:
 * slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeightKm: 100, earthRadiusKm: 6371 } as const

/**
 * Where a visit's shooting stars come from. One shower radiant sends `showerShare` of them, scattered about it with a
 * standard deviation of `showerScatter` degrees; the rest come from `sporadicSources` broad sporadic sources (helion,
 * antihelion, apex and toroidal), one per speed class, each scattering `sporadicScatter` degrees (one standard deviation).
 * Elevations follow real rates (hourly rate ∝ sin h, so the density is sin h cos h) and azimuths are uniform: about 3 in 4
 * fall, 1 in 7 cross sideways and 1 in 8 climb before the climb guard. A path climbing more than `climbDegrees` comes only
 * from a sporadic source and spans at most `climbShare` of the longest path, and no path ends under the navbar. On
 * `onScreen` of wide-screen visits the shower radiant sits on screen, in clear sky in the top `onScreenTop` of the height
 * (on no other visit, and never on narrow screens, where only stubs would fit around it); within `nearRadiant` degrees of
 * it a shower path may be as short as `nearRadiantPath` px, since meteors there are short and slow.
 */
export const RADIANTS = {
	showerShare: 0.4,
	showerScatter: 1.5,
	sporadicSources: 3,
	sporadicScatter: 15,
	climbDegrees: 15,
	climbShare: 0.6,
	onScreen: 0.15,
	onScreenTop: 0.45,
	nearRadiant: 10,
	nearRadiantPath: 40,
} as const

/** The color a shooting star's wake cools to: warm (sodium, iron), white, or mint (magnesium, oxygen 557.7 nm). */
export type WakeColor = 'warm' | 'white' | 'mint'

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's center (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** Wake color the head cools to (named apart from Meteor.wake, the afterglow time constant). */
	wakeColor: WakeColor
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast). The sporadic sources map onto them:
 * helion and antihelion about 30 km/s, toroidal 35 to 40, apex about 60. Fast meteors cool to mint (magnesium 517 nm,
 * oxygen 557.7 nm) and alone may leave a train; slow ones glow warm (sodium 589 nm, iron); medium ones stay white.
 */
export const SPEED_CLASSES = {
	slow: { angular: 9, duration: [1.1, 1.4], wakeColor: 'warm', train: false },
	medium: { angular: 14, duration: [0.8, 1.1], wakeColor: 'white', train: false },
	fast: { angular: 22, duration: [0.55, 0.8], wakeColor: 'mint', train: true },
} as const satisfies Record<string, SpeedClass>

/**
 * How often shooting stars launch. A dark rural site sees 1 to 3 sporadic meteors an hour in the evening and 4 to 10
 * before dawn (AMS), and a screen-sized window holds about 29% of an observer's field (IMO): a real window shows one every
 * 25 to 100 minutes, or one every 2 to 4 at a Perseid or Geminid peak. The hero runs about 120 times a dawn sky's rate
 * (500 times an evening's, 10 to 20 times a shower peak's), a time-lapse of a strong shower night: gaps after each flight
 * follow `hero` (floor 4 s plus an exponential 8 s, at most
 * 30 s: 11.7 s on average, about 4.7 a minute) or `narrow` on phones (21 s on average), stretched on long visits
 * (TRANSIENTS.longVisit).
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	narrow: { floor: 8, mean: 14, cap: 45 },
} as const satisfies Record<string, GapLaw>

/**
 * Brightness: real counts are dominated by faint meteors (each brighter magnitude has 1/r as many, r about 2.2 to 2.6);
 * the hero keeps only `faintShare` of ordinary flights faint, peaking within `faint`, so most stay easy to see, and the
 * rest peak within `normal`. Lower in the window a meteor is farther away and dims by the square of its distance over the
 * distance at the top of the spawn area (so none ever brightens past `normal`), never below `rangeFloor` of its peak. On
 * average they peak at about 0.5, about 1 in 8 under 0.3; raise `normal` and `rangeFloor` if they read
 * too faint: the veil fits any peak to each copy's INK_BUDGET. Fireballs peak at 1 and stay in clear sky.
 */
export const METEOR_BRIGHTNESS = { faintShare: 0.3, faint: [0.3, 0.5], normal: [0.6, 0.85], rangeFloor: 0.6 } as const
```

`GapLaw` and `WakeColor` live in `config.ts`, like `LayerConfig` and `HazePool`, so the config never depends on the modules that read it. `METEOR_LOOK.fireballTint` (palette index 5, pale yellow) also serves slow meteors' warm wakes, and `METEOR_LOOK.mintToWhite` every mint wake: no second key holds the same color (the train keeps its own `TRAIN.mintToWhite`). The last sentence of `METEOR_LOOK`'s doc becomes the tint rule below, stated once: "Each wake takes its speed class's color: fast ones cool to --color-green mixed `mintToWhite` toward --color-white, medium ones stay white, and slow ones warm to palette index `fireballTint` (pale yellow), as fireballs do unless they are fast."

**Removed in P9**, with I2 (dead keys mislead the next tuner, and dead locals and parameters are lint warnings, section 6):

- `METEOR.gapMin`, `gapMeanExtra`, `gapMax`, `slowAfter`, `slowFactor`, `angle`, `radiantX`, `radiantY`, `radiantJitter` and `trainSpeedShare`;
- the keys I2 orphans, since speed, duration and peak now come from the steer: `METEOR.speedShare`, `speed`, `narrowSpeed`, `duration`, `fallbackDuration`, `narrowDuration`, `narrowFallbackDuration` and `peak` (`speedJitter` stays: the steer reads it). P9 adds `METEOR.fallbackScale: 0.64` (today's 0.9 / 1.4), documented "The fallback pass scales each speed class's durations, and the shortest path it accepts, by this";
- in `planFlight`, `PassOptions.timing` (a `fallback` flag replaces it) and the `minSpeed`, `maxSpeed` and `nominalSpeed` locals (`meteors.ts:195-196`); and the `DEG` constant (`:77-78`), whose only readers are the `away` and `below` lines;
- the `radiant` parameter of `planMeteor` and `planFlight`, and the functions `pickRadiant` and `nextMeteorGap`.

`METEOR.radiantTries` stays (its one reader, `planLaunch`, moves into `planMeteorTransient`) with a new meaning and doc: "Fresh steers (a new source and scatter from the visit's sky) tried per launch when the first yields no long flight, before any shorter one; narrow screens try one." The inner docs of the keys that stay are rewritten:

- `attempts` (`config.ts:266`): "Candidate start points tried per steer for long flights, and again for the fallback; a launch traded for a pass behind copy (METEOR_PASS) tries up to as many again."
- the flight block (`:286-290`): "Speeds and durations come from SPEED_CLASSES, and each flight's speed spreads by `speedJitter`; where no long flight fits (a short laptop window, a phone), the fallback pass flies its class's durations times `fallbackScale` and accepts paths that much shorter."
- the narrow block (`:299`): "Narrow screens: paths at least `narrowMinPath` px and at most `narrowMaxPathShare` of the width."
- `maxEndY` (`:281`): "Paths end above this share of the height, clear of the bottom corners; planMeteor's `clearOf` keeps them off the side rails' copy."
- the fireballs (`:313`): "Fireballs (rare, long flights only): longer, slower and brighter, with more drag and a longer wake, warm unless fast (mint)." P10 moves it onto `fireballSpeedScale`, naming `METEOR_KINDS.fireball` for their odds and timing.
- the train (`:321`): "A faint persistent train behind some fireballs and fast flights (SPEED_CLASSES' `train`)."

`METEOR`'s doc (`config.ts:247-250`) becomes: "Shooting stars: where they start, the layout guards, their length, drag, wake, flares and trains. Directions, speeds and brightness come from the visit's sky (RADIANTS, SPEED_CLASSES, METEOR_BRIGHTNESS) and rates from METEOR_RATE. Each lights up and peaks in clear sky and may glide on behind quiet copy, veiled to what the copy can take (METEOR_VEIL, INK_BUDGET). Its layout guards keep every transient below the navbar (`top`), inside the edges (`edgeMargin`) and clear of the bottom corners (`maxEndY`), and a shooting star also clear of the side rails (planMeteor's `clearOf`)." Its third sentence is the veil commit's. `spawnX` and `spawnY` stay: R2 measured today's spawn area accepting 37% of candidates under the new mix, against 21% across the full width.

#### `src/lib/sky/radiants.ts` (new)

```ts
import { METEOR, METEOR_BRIGHTNESS, RADIANTS, SKY_WINDOW, SPEED_CLASSES } from './config'
import { startArea, type Course, type MeteorField, type Point, type Steer } from './meteors'
import { between, gaussian, type Random } from './random'
import { quietAt } from './scene'

/** A unit direction in the window's frame: x to the right, y down the screen, z through the screen into the sky. */
export interface SkyDirection {
	x: number
	y: number
	z: number
}

/** The screen as a pinhole window (gnomonic: straight paths stay straight, and parallel paths meet at their radiant). */
export interface SkyWindow {
	cx: number
	cy: number
	/** CSS px per unit of the image plane: the longer side spans SKY_WINDOW.fov. */
	focal: number
	/** Elevation of the screen center (radians). */
	pitch: number
}

/** One source of a visit's shooting stars: a radiant, how widely its meteors scatter, and their speed class. */
export interface Source {
	kind: 'shower' | 'sporadic'
	radiant: SkyDirection
	/** Scatter (radians, one standard deviation): RADIANTS' degrees, converted. */
	scatter: number
	speed: keyof typeof SPEED_CLASSES
}

/** A visit's sky (RD1): the window, the shower and the sporadic sources; picked afresh after a resize or a failed launch allowed near copy, never by a layout. */
export interface VisitSky {
	window: SkyWindow
	shower: Source
	sporadic: readonly Source[]
	/** Where the shower radiant sits on screen (RADIANTS.onScreen of visits), else null. */
	showerOnScreen: Point | null
}

/** The sky window for a viewport: its center, the focal length at which the longer side spans SKY_WINDOW.fov, and its pitch. */
export function skyWindow(width: number, height: number): SkyWindow
/** A visit's sky: radiants with elevation density sin h cos h; the shower on screen in clear sky on RADIANTS.onScreen of visits. */
export function pickVisitSky(random: Random, field: MeteorField): VisitSky
/** One launch's steer: a source (the shower with RADIANTS.showerShare, else a sporadic one) and its scattered radiant. */
export function visitSteer(random: Random, sky: VisitSky): Steer
/** Screen direction and speed factor at (x, y) for a meteor from `radiant` (R2 §4.2), or null at the radiant itself. */
export function radiantMotion(view: SkyWindow, radiant: SkyDirection, x: number, y: number): { dirX: number; dirY: number; rate: number } | null
/** Elevation (radians) behind screen point (x, y). */
export function elevationAt(view: SkyWindow, x: number, y: number): number
/** Range (km) to the meteor layer at elevation h: 100 km overhead, about 172 km at 35° and 477 km at 10°. */
export function meteorRange(h: number): number
```

`radiantMotion`, `elevationAt`, `meteorRange`, `toward` and `sampleRadiant` are R2 §10's sketches as written, except that `meteorRange` reads `SKY_WINDOW.earthRadiusKm` and `meteorHeightKm`. R2 checked the screen-speed formula against finite differences, and the experience draft re-derived:

- the gnomonic image direction (u·r_z − r_x, v·r_z − r_y);
- the asin(√U) elevation sampling for density sin h cos h;
- the inverse of the window rotation in `elevationAt`.

`random.ts` gains `gaussian(random)` (Box-Muller) for the scatter: `Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())`. It takes `1 - random()`, as `nextGap` does, because `random()` can return 0 and log(0) would make a NaN radiant.

**`pickVisitSky`, step by step** (no draft or report has its body):

1. `view = skyWindow(field.width, field.height)`.
2. **On screen**, on `RADIANTS.onScreen` of wide-screen visits (never on narrow screens): up to 20 points uniform in [`METEOR.edgeMargin`, width − `edgeMargin`] × [`METEOR.top`, `onScreenTop` × height], keeping the first with `quietAt(field.quiet, x, y) === 0` whose shower passes the usability test (below). The shower radiant is the direction through it, ((x − cx) / focal, (y − cy) / focal, 1) normalized, and `showerOnScreen` is the point. If none passes, go to step 3. Without the test, a radiant low in the spawn area sends most shower paths climbing: 20 to 23% of on-screen showers at 1440 × 900 would fail it [computed, check report].
3. **Off screen**: `sampleRadiant`, resampled (up to 50 tries, then the last is kept) while its vanishing point (r_z > 0) lies inside the viewport, so on-screen radiants come only from step 2 (R2 measured 13% of visits by chance, which would make the total about 26%), or while the shower fails the usability test. A shower sitting low in front of the window otherwise climbs from every start in about 6% of visits, so D8's default rejects every shower launch [computed].
   - **The usability test** (steps 2 and 3): at least 8 of 16 probes give a non-null `radiantMotion` with `dirY ≥ −sin(climbDegrees)`. The probes are a 4 × 4 grid at the cell centres of the planner's start area, `startArea(field)`, which I2 exports from `meteors.ts` and `planFlight`'s sampling uses (today `METEOR.spawnX` × `METEOR.spawnY`, unclamped; the planner and the probes raise each y to `METEOR.top`, `meteors.ts:204-207`): the test is deterministic and follows the planner if its sampling changes. The on-screen band in step 2 is a placement choice, not that area, and stays as written.
4. The shower's speed class is uniform over `SPEED_CLASSES`. The three sporadic sources come from `sampleRadiant`, one per class, with no on-screen test (their near-radiant paths fail the 160 px minimum and are resampled); under D8's alternative, each also passes step 3's usability test at 10°.
5. `visitSteer` picks the shower with `showerShare`, else a sporadic source uniformly, and moves its radiant by two tangent-plane offsets of `gaussian(random) × scatter`, renormalized.

**The steer at a start point** (`visitSteer`'s closure; R2 §4.2 to §4.4):

1. `motion = radiantMotion(view, scattered, start.x, start.y)`. If it is null, no flight starts here.
2. `climbing = motion.dirY < −sin(RADIANTS.climbDegrees°)`. A climbing path from the shower is rejected (null), and the planner resamples. Under D8's alternative, any path with `motion.dirY < −sin(10°)` is rejected instead, which is about 13% of candidates.
3. `range = meteorRange(elevationAt(view, start.x, start.y)) / meteorRange(view.pitch)`.
4. `speed = SPEED_CLASSES[class].angular × π/180 × view.focal × motion.rate × jitter / range`, with `jitter` drawn from `METEOR.speedJitter`.
5. `duration` is the class's range. On the planner's fallback pass it is scaled by `METEOR.fallbackScale`.
6. `pathShare = climbing ? RADIANTS.climbShare : 1`.
7. `minPath = RADIANTS.nearRadiantPath` when the steer's source is the shower and `showerOnScreen` lies within `RADIANTS.nearRadiant`° of `start` (only shower meteors are foreshortened there; a sporadic stub would point anywhere and blur the radiant); otherwise null, so the planner keeps its own minimum (160 px, or 110 on narrow screens, times `METEOR.fallbackScale` on the fallback pass: "Inside `planFlight`" below).
8. `peak = between(random, ...(random() < METEOR_BRIGHTNESS.faintShare ? faint : normal)) × max(rangeFloor, (rangeTop / meteorRange(elevationAt(view, start.x, start.y)))²)`, with `rangeTop = meteorRange(elevationAt(view, view.cx, METEOR.top))`: the nearest point of the spawn area, so the factor never exceeds 1 and a start on the window's centre row dims to about 0.6. Measuring against the window's centre instead (1 / range²) would brighten nearly every flight, since the spawn area lies above the centre: 38% of laptop flights would pass 0.9 and some reach 1.37 [computed].
9. `wakeColor` and `train` come from the class.

#### What the veil planner accepts (I1 theirs, I2 ours)

The veil commit's `planMeteor` and private `planFlight` take an options object (I1 has the signatures). Our additions, `steer`, `clearOf` and `fireball`, extend `PlanOptions` and never change `veiledFrom` (R2 §11's light-curve and drag options, also left to us, aren't needed by this plan):

```ts
// src/lib/sky/meteors.ts
/** How a shooting star launched at a start point flies; the planner keeps start sampling, the layout guards and the veil. */
export interface Course {
	/** Unit direction of travel on screen. */
	dirX: number
	dirY: number
	/** Nominal screen speed at the start (CSS px/s). */
	speed: number
	/** Flight time range (s). */
	duration: readonly [number, number]
	/** Longest path as a share of the planner's maximum (RADIANTS.climbShare for climbs, else 1). */
	pathShare: number
	/** Shortest path allowed from this start (px), or null for the planner's own minimum. */
	minPath: number | null
	/** Peak brightness (fireballs peak at 1 regardless): veiledFrom and drawMeteor fit it to each copy's INK_BUDGET. */
	peak: number
	/** The color the wake cools to (SPEED_CLASSES). */
	wakeColor: WakeColor
	/** A persistent train is possible here. */
	train: boolean
}

/** Direction, speed and timing for a start point the planner picked; null when no shooting star starts there. */
export type Steer = (random: Random, start: Point, fallback: boolean) => Course | null

/** What a plan may do. */
export interface PlanOptions {
	// …nearCopy, flights and ink exactly as cf4d7b8 has them, docs included (I1)…
	/** Where shooting stars go from each start point: a Course, or null where none starts there. (I2, P9) */
	steer: Steer
	/** Padded zones no path comes within QUIET.feather of, as `nearCopy` false keeps it from all: the side rails, whose links change color on hover and focus, which their measured headroom misses until the next measurement; for farewell meteors, also the sky above the end scene's quiet copy, where unmarked copy shows (P12). Default none. (I2, P9) */
	clearOf?: readonly SkyRect[]
	/** This launch is a fireball: clear sky only, METEOR_KINDS.fireball timing, peak 1. (P10) */
	fireball?: boolean
}

// P9 drops the radiant parameter, and with `steer` required, the `= {}` default
export function planMeteor(random: Random, field: MeteorField, now: number, options: PlanOptions): Meteor | null
/** The box planFlight draws start points from (CSS px): width × METEOR.spawnX by height × spawnY, unclamped. (I2, P9) */
export function startArea(field: MeteorField): { x0: number; x1: number; y0: number; y1: number }
// planFlight stays private and keeps cf4d7b8's draw over startArea: x = between(random, x0, x1) and
// y = max(METEOR.top, between(random, y0, y1)). From P9 its PassOptions carries `fallback: boolean`
// (the steer scales its class's durations, and the planner its minimum path, on that pass) in place of `timing`; from P10, PlanOptions.fireball replaces
// PassOptions.fireballs and the per-attempt METEOR.fireballChance draw. Meteor gains wakeColor (P9; today's Meteor.wake
// stays the afterglow time constant, meteors.ts:39-40).
```

**Their docs follow** (7.0). In P9 `PassOptions`' doc becomes "What one pass of the planner adds to the caller's options: whether it is the shorter fallback (its durations and its shortest path scaled by METEOR.fallbackScale) and whether a fireball may fly", `planFlight`'s first sentence "Up to METEOR.attempts candidate paths steered by `options.steer`, shorter on the fallback pass, fireballs only if `options.fireballs`", and `planMeteor`'s "above the side rails" reads "clear of the copy in `clearOf`"; `copyReader`'s caveat (`mountSky.ts:122-124`) names the planner's `clearOf`, which the launch fills with the padded rails, in place of `METEOR.maxEndY`. P10 drops the fireball clause from `PassOptions`' doc, and `planFlight`'s reads `options.fireball`.

**Inside `planFlight`.** I2 replaces four things in its inner `fit` with one call to `options.steer(random, start, fallback)`:

- the lines that compute `away`, `dirX`, `dirY` and `below` (`meteors.ts:208-212`);
- the 18 to 42° filter (`:213`);
- the speed and duration lines (`:215-220`);
- the peak line (`:229`): the course's `peak` goes to the private `veiledFrom(near, path, peak, ink)` instead (fireballs keep 1).

`length = min(maxPath × course.pathShare, course.speed × duration)` and `minPath = course.minPath ?? minPath × (fallback ? METEOR.fallbackScale : 1)`: without cf4d7b8's 240 px/s floor (`METEOR.speed`), fallback flights rarely reach 160 px below about 1,280 px of width, and 11% of launches at 1024 × 768 would fail every steer (1.5% with the scaled minimum: 102 px, 70 on narrow screens) [computed, check report]. The train line becomes `dimFrom === 1 && (course.train || fireball) && random() < METEOR.trainChance`, the `jitter >= METEOR.trainSpeedShare` test (`:236`) giving way to the course's `train`: trains stay in clear sky.

**Fireballs keep their own speed and timing.** The lines I2 replaces also give a fireball attempt its slower, longer flight (`:216-217`). So a fireball flies the steer's direction at `course.speed × METEOR.fireballSpeedScale`, for a duration drawn from `METEOR.fireballDuration` in P9 and from `METEOR_KINDS.fireball.duration` from P10, with peak 1, `fireballDrag`, `fireballWake` and today's clear-sky rule. Until P10, the per-attempt draw (`:203`, `METEOR.fireballChance`, 8%) stays as today.

**I2 also completes the end test** (`:224`). Today's guards cover only right-to-left falling paths: `METEOR.top` clamps the start alone (`:206`), and the end test checks the left edge and `maxEndY` only. With the new directions, 16% of accepted laptop flights would end past the right edge and 8.5% above the navbar's 110 px, many leaving the screen still bright (AC-22) [computed, check report]. So the end test also rejects `end.x > width − METEOR.edgeMargin` and `end.y < METEOR.top`: with both ends on screen, the straight path never leaves it and never ends under the navbar. **And it keeps paths off the rails.** A rightward path from the spawn area's right side can reach the right rail's link, which starts above `maxEndY` on six of the eight archived desktop layouts, and a measurement keeps a link's hover or focus green until the next one (`mountSky.ts:122-124`): a pass there could show 0.2 white on 12 px light-slate text, 4.3:1 [check report]. So `fit` also rejects a segment touching a `clearOf` zone grown by `QUIET.feather` (the `nearCopy: false` test, `meteors.ts:226-228`), and the meteor kind passes the padded rails (`SkyField.pinned`, 6.9). Neither touches a veil rule.

**No peak bound.** The renderer and `veiledFrom` fit any brightness to each copy's budget (`budgetKeeps`), so I2 bounds no peak; `veiledFrom`'s edge-fade rule simply judges the course's peak.

**Everything else stays the veil session's:**

- the start-point sampling (I2 only names its box, `startArea`, and keeps the draw and its clamp);
- the layout guard values: 110 px under the navbar, the 12 px edge margin, ends above 0.72 of the height (I2 only adds the two end conditions and `clearOf` above);
- `segmentTouches`, and `veiledFrom` with its rules and `METEOR_VEIL` (COORDINATION.md, "`veiledFrom` rules");
- the clear-sky rules for fireballs, flares and trains;
- first fit, then `METEOR_PASS`'s trade of a share of plain launches for a pass behind copy.

Veiled flights keep the default light curve, so `veiledFrom`'s "never brightens again" rule holds (R2 §5.3).

**Speed-class colors (ours, P9).** `drawMeteor`'s tint line (`renderSky.ts:237`) follows the tint rule above by `meteor.wakeColor`: `mint` is today's `mixRgb(green, white, METEOR_LOOK.mintToWhite)` (fast fireballs too), `white` the theme white, `warm` (and other fireballs, as today) palette index `fireballTint`. Saturated red never appears: the warmest wake tint, pale yellow `[255, 230, 200]`, has R / (R + G + B) = 0.37, far under 2.3.1's 0.8.

### 6.11 Satellites (P11; after P8 and P9)

```ts
// src/lib/sky/config.ts (P11)
/**
 * Satellites: steady points lit by a Sun below the horizon (no twinkle, no wake, never blinking), gliding in a straight
 * line at constant speed, as NASA describes the space station. Real low orbits cross about 1°/s overhead, about 0.5°/s at
 * the window's 40° center and 0.1 to 0.3°/s low in the sky; these run `angular` °/s of the sky window (SKY_WINDOW), 2 to 5
 * times faster at the center, so a whole pass stays within `life` seconds (WCAG 2.2.2's 5 s). A pass crosses the edge of
 * Earth's shadow at most once, as a real one does: at dusk (`shadowShare` of passes) it slides in lit from beyond a side
 * and fades into the shadow over `fadeOut` s while warming from palette index `tint` toward `shadowTint`, as real ones
 * redden; at dawn it fades in over `fadeIn` s as it leaves the shadow and glides out through a side. Alpha `alpha`,
 * about magnitude 3.5 to 5.5: never brighter than the brightest mid-layer star;
 * drawn with star shape `shape`. Clear sky only (every point clear of every padded quiet rect's reach, ZONE_REACH), never
 * within `minTilt` degrees of vertical (a vertical glide reads as scrolling), one at a time, wide screens only, on their own
 * clock: the first attempt `first` after the reveal and then `gap` after each pass (GapLaw, stretched on long visits), so
 * 39% of visits get a first attempt within their first minute and passes come about 89 s apart. Up to `attempts`
 * candidate passes per launch.
 */
export const SATELLITE = {
	first: { floor: 30, mean: 60, cap: 150 },
	gap: { floor: 40, mean: 50, cap: 150 },
	angular: [1.2, 2.5],
	alpha: [0.25, 0.5],
	life: 4.8,
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
	tint: 4,
	shadowTint: 6,
	shape: 2,
	minTilt: 20,
	attempts: 40,
} as const

/**
 * Quiet keeps for transients that never take the ink lease (satellites; any clear-sky variant later): no light inside a
 * padded quiet rect, even mid-ease or when a layout changes under it, so they never share a contrast budget with the one
 * that holds the lease. Not a look setting: both stay 0 whatever the star layers' keeps become.
 */
export const CLEAR_SKY_KEEPS = { quietKeep: 0, inkKeep: 0 } as const
```

```ts
// src/lib/sky/satellites.ts (new)
import { METEOR, SATELLITE } from './config'
import { nextGap } from './gaps'
import { segmentClear } from './quietIndex'
import { skyWindow } from './radiants'
import { between } from './random'
import type { PlanContext, TransientSpec } from './transients'

/** One satellite pass: a straight line at constant speed in screen CSS px, with its fades. */
export interface SatellitePass {
	startX: number
	startY: number
	/** Unit direction. */
	dirX: number
	dirY: number
	/** CSS px/s: SATELLITE.angular (°/s) at the window's scale. */
	speed: number
	/** Whole pass (s), fades included: at most SATELLITE.life. */
	life: number
	/** Fade in (s): 0 when it slides in from beyond an edge. */
	fadeIn: number
	/** Fade into Earth's shadow at the end (s), warming as it goes; 0 when it leaves through an edge. */
	fadeOut: number
	alpha: number
	startedAt: number
}

/** A satellite at one moment: where it is, how bright, and how far it has warmed into the shadow (0 to 1). */
export interface SatelliteFrame {
	x: number
	y: number
	alpha: number
	warmth: number
}

/** Plans a pass in clear sky for this moment (segmentClear), or null when none fits in SATELLITE.attempts tries. */
export function planSatellite(context: PlanContext): SatellitePass | null
/** True while the pass is on screen. */
export function satelliteMoving(pass: SatellitePass, now: number): boolean
/** Where a pass is at `now`, how bright, and how far it has warmed into Earth's shadow. */
export function satelliteAt(pass: SatellitePass, now: number): SatelliteFrame

/** The satellite kind: its own clock, clear sky only (it never takes the lease), wide screens only. */
export const SATELLITE_SPEC: TransientSpec<'satellite'> = {
	firstDelay: (random) => nextGap(random, SATELLITE.first, 0),
	nextAfter: (pass, random, sinceReveal) => pass.life + nextGap(random, SATELLITE.gap, sinceReveal),
	plan: planSatellite,
	lifetime: (pass) => pass.life,
	moving: satelliteMoving,
	nearCopy: () => false,
	lease: false,
	phones: false,
}
```

- **Speed.** `SATELLITE.angular` (°/s) × π/180 × `view.focal` px/s, using `skyWindow`: 26 to 54 CSS px/s on a 1440 px laptop (about 21.8 px per degree at the centre), so 125 to 260 px per pass [computed].
- **Planning, per attempt.** One mid-sky fade at most, because a nearly straight pass can't leave Earth's shadow and enter it again within seconds (seen from the ground the shadow is one region around the antisolar point, R2 §6.1):
  1. Draw the kind of pass (dusk with `shadowShare`, else dawn), the speed, and a heading at least `minTilt`° from vertical.
  2. *Dusk:* the start is just beyond the left or right side (`METEOR.edgeMargin` outside it, wider than the sprite, so the point slides in), at a height in the clear band (below `METEOR.top`, above `METEOR.maxEndY` of the height), with the heading pointing inward. It glides lit for `life − fadeOut` and fades into the shadow.
  3. *Dawn:* the exit is just beyond a side in the clear band, and the start is one `life` back along the heading, where it fades in over `fadeIn`.
  4. Reject the pass if its mid-sky end (the dusk fade's end or the dawn start) lies outside the clear band or within `METEOR.edgeMargin` of a side.
  5. Accept the first pass whose segment is clear of every padded rect's reach: `segmentClear(field.quiet, start, end)` (6.4), the clear-sky test of every path we plan ourselves (meteors keep the veil planner's own test; the comet's box uses `zoneReaches`).
- **The first attempt** comes within 60 s on 1 − e^(−30/60) = 39% of visits [computed]. R2 said "first after 30 s, about 30-40% in the first minute".
- **Drawing** (`drawSatellite` in `renderSky.ts`, or a split `renderTransients.ts`):
  - `placePoint` with shape `SATELLITE.shape`, unsnapped, so it glides. 26 to 54 px/s at DPR 2 needs every frame, which moving transients get.
  - Two sprites at the same point: the `tint` sprite at alpha × (1 − warmth) and the `shadowTint` sprite at alpha × warmth. Under additive compositing that is an exact color mix.
  - The alpha is multiplied by its `fade` (`transientFade`, from `drawTransient`) and by `transientQuietFactor(frame.quiet, x, y, CLEAR_SKY_KEEPS)` at its drawn position every frame (`drawTransient` hands it the keeps), never by `easedQuietFactor`, which would keep all of its light inside a rect a layout has just added. So, as T3 says, a satellite adds **no light inside any padded rect of `to` or `next`** from the frame a layout arrives, meets answer 3's conditions by construction and never needs the lease; whether it shares the sky is D12's look choice.
- **It never takes the lease, is scroll-cancelled like every kind, and stays in screen space** (no drift or parallax: its own motion dominates, and the veil checks are screen-space).

### 6.12 The "could" kinds (P12, each after D4)

| Kind | Spec (R2 §7, R4 §4) | Planning and veil | Notes |
|---|---|---|---|
| Near-radiant point flash | A meteor variant with zero length within 1° of the on-screen radiant: a point that brightens and fades in 0.3 to 0.5 s without moving, peak at most 0.7 | Clear sky only | At most one per 60 s; needs P9's on-screen radiant |
| Burst | A meteor variant: 2 to 4 faint members from the shower radiant, staggered 0.35 to 1.2 s, the whole span at most 5 s, no flares or trains | All members clear sky (no lease) | 5% of launches, at least 90 s apart, after 45 s; desktop. The stagger keeps flashes at 3 a second or fewer. |
| Earthgrazer | A meteor variant: at least 0.3 of the width (about 20° at the window's centre: 4 to 6°/s for 2.5 to 3.5 s spans at most 21°, so R2's 0.45, about 30°, could never fit), within 12° of horizontal, 4 to 6°/s, 2.5 to 3.5 s plus about 0.54 s of wake (about 4 s in all), warm | Clear sky only; skipped silently when no band fits | 2.5% of launches, at least 180 s apart, after 60 s; at least 1280 px wide |
| Farewell meteors | Up to 2 meteors a visit around Contact and the footer, once the end bookend's level is at least 0.9, with gaps from a `GapLaw` (R2: 8 + Exp(14) s) | Full veil (Contact and the footer are quiet copy), and nothing above Contact, where tall screens show unmarked copy in the flight region (Other Projects' heading and link from 1920 × 1200, the Projects text at 3840 × 2160) that the veil knows nothing of (C1) [measured, check report]. The field holds every flow root's zones wherever they are, the hero's included (`mountSky.ts:231`, `scene.ts:60-69`), so the band's edge is the top of the highest in-flow zone on screen: of `field.quiet` without `field.pinned` (the same padded objects, 6.9), those with `zone.y < height` and `zone.y + zone.height > 0`. `clearOf` adds the full width above that edge less `ZONE_REACH`, and starts come from the edge down to the screen bottom inside `spawnX` (a `starts` option in place of `startArea(field)`). `room(field)` is false (a hold, never a failed plan) while no in-flow zone is on screen or the edge lies at or below `METEOR.maxEndY` × height, where no path below it can end above `maxEndY` | With their own clock and visit cap they get their own registry entry (`'farewell'`: a `Meteor` body whose `plan` calls `planMeteorTransient(context, { clearOf, starts })`, an optional second argument whose `clearOf` joins the rails and whose `starts` every `planMeteor` call takes, so the veil's pass order stays in one function; never a fireball, since P10's decision is the meteor spec's; drawn through `drawMeteor` by its own `drawTransient` case), not a `METEOR_KINDS` variant, which could refuse only with a null plan and so stop the hero's shooting stars after `maxFailedPlans`. Their cap is `TransientSpec.limit` (2), held in step 2.2 against `kindLaunches`. The gate reports the scene as a fact (`LaunchGate.scene`, from `SceneLevels.launchScene`, which replaces P8's `launches` flag: `'hero'` up to `heroLaunchMaxScroll`, `'end'` once the end level reaches `SCENE.endLaunchLevel`, 0.9, else null), and `allowed` keeps only "a launch scene" (`scene !== null`), so a worker asleep in the reading scene keeps no launch timer; each spec names its own (`TransientSpec.scene`: `'hero'` for meteors and satellites), held in step 2.2. T7 holds, since the two scenes never meet. T6 names the exception. H7 and AC-20 gain the kind, checked on end-scene layouts P12 captures at 2560 × 1440 and 3840 × 2160 over the launch scrolls (every rect the worker receives, the hero's included, and the unmarked text boxes above Contact): no accepted path within `ZONE_REACH` of an unmarked box. The veil session hears of launches around Contact and the footer, and of that unmarked copy. |
| Static comet | Not a transient: a `SkyBody` with a world position and the far band's mean nearness (0.293, from `nearness()` over the band: it "moves only with the far layer's parallax", R4), drawn after the layers with the camera law. Pseudo-nucleus alpha at most 0.6, mint coma, a curved pale dust tail, a faint straight blue-white ion tail (never a green tail), fading in over at least 8 s. Placed in the upper right, as R4 has it. It never starts to show under `motion: 'reduced'`, and a pause fades it out. | Under the one scroll rule (COORDINATION.md request 1 names the comet), it takes a launch scroll when it starts to show and is drawn at its fade-in × `scrollKept(launchScrollY, scrollY, boxFade × pauseFade)`. Its box and pause fades (a pause, or a switch to reduced motion), each `fadeOutAt` over `TRANSIENTS.cancelFade`, go in as `fade`; its fade-in brightens, so it stays outside (`scrollKept` only dims, and a fade-in of 0 would retire it on its first frame). When `scrollKept` reaches 0 it is gone for the page view, so it ends within the first 24 px of scroll, or 0.2 s after a pause. The veil session ruled out a fade with the hero's launch gate (answer 4); D4's alternative, a scroll fade of its own, must reach 0 before unmarked copy can come under its drawn footprint, checked at the shortest viewport where the placement rule below finds the comet room, sweeping heights up from 393 px (it leaves the box itself about 20 px at 852 × 393, 43 at 932 × 430 and 165 at 1280 × 600) [computed, check report]. Quiet rects move with the whole scroll and the comet by the camera law, which also carries it between scroll steps (the drift up to `DRIFT_REACH` and the lean up to `LEAN.reach`, times its nearness), so copy and comet can meet without a scroll. So: every part (nucleus, coma, both tails) is drawn through `transientQuietFactor` with `CLEAR_SKY_KEEPS` at its own position; its whole box stays clear of every zone's reach (`zoneReaches`), re-tested on every drawn frame against `frame.quiet.to` and, while a layout waits, `frame.quiet.next`, with a `TRANSIENTS.cancelFade` fade when that fails; and it is placed so that its box, grown by that drift and lean reach, stays below `METEOR.top` (clear of the glass navbar, as satellites are) and above About's header row at `heroLaunchMaxScroll` plus `SCROLL_CANCEL.to` of scroll, less `ZONE_REACH` (that row is 0.6 H plus About's top padding and header margin: 70, 90 or 110 px by breakpoint, `components/styles.ts:7`, `globals.css:203`), since it may start to show anywhere up to `heroLaunchMaxScroll`. It never holds the lease and keeps D12's hold both ways (T3): it starts to show only while `leaseHeld` is false, and the launch gate reports it (`LaunchGate.bodyShowing`) so no meteor takes the lease while it shows. | 1 visit in 8 to 10, desktop hero; changes the reviewed composition; may read as a rendering bug (R4). A model module, `src/lib/sky/bodies.ts`, owns its placement, fades, box test, launch scroll and start rule as pure functions. The start rule reads the launch gate (`allowed`, with `scene === 'hero'` once farewell meteors add it; `settled`; `!narrow`; `sinceReveal` past a first delay in its config block, so the entrance and rails have settled and been measured) plus the visit's draw and `leaseHeld`. The worker only feeds them and keeps the comet's state: a resize retires it beside `dropTransients` (its placement and About guard were the old viewport's), a hidden tab keeps it with its fade-in on `twinkleTime`'s clock, and `demandNow`'s `fading` covers its fade-in (one term from `bodies.ts`, as P6's thin fade). `renderSky.ts` only draws what it returns. |
| Planet | A catalog addition in the near layer at alpha 0.78, twinkle 0, a slightly wider warm core | Star keeps | Changes the reviewed sky; composition review; it shows under reduced motion, so AC-26's P0 screenshot is re-baselined when it ships |

Static bodies (the comet and the planet) obey the camera law like stars, as R1 §9 asks of long-lived bodies. Transients stay in screen space, so the veil planning stays in screen space.

The point flash, bursts and earthgrazers are `METEOR_KINDS` entries like fireballs (P10): odds per launch, spacing, the earliest second, and a minimum width where needed, decided in the meteor spec's one decision step, with bodies that are variants of `Meteor`. So "a share of launches" holds, T7 keeps them from overlapping another meteor (AC-20), and they share the meteor family's sky; only a kind with its own clock (satellites, and farewell meteors) gets a registry entry. All three never take the lease: their entry marks them clear-sky, the meteor spec plans them with `nearCopy` false and reports it (a `clearSky(body)` member of the spec, added to `transients.ts` in P12, which the launch step folds into the envelope's `clearSky`), and `drawTransient` hands `drawMeteor` `CLEAR_SKY_KEEPS` for them (one more `drawMeteor` argument). So the point flash, like a satellite, adds no light inside any padded rect of `to` or `next` (T3); a burst's or earthgrazer's wake is veiled at its sampled stops, and being meteors, T7 keeps all three apart from a lease holder.

**Won't** (R2 §6.4): 2.4's list, and anything that blinks; outbursts because even with the pause control they are an onset storm.

### 6.13 Protocol changes and the lean

```ts
// src/lib/sky/protocol.ts
/**
 * How much the sky may change on its own:
 * - `full`: twinkle, drift, scroll parallax and its glide, pointer lean and transients
 * - `reduced`: prefers-reduced-motion, or the visitor paused the sky (skyPause.ts): fades and brightness only
 * - `off`: forced colors hide the sky, so nothing is drawn
 */
export type SkyMotion = 'full' | 'reduced' | 'off'

export type SkyMainMessage =
	// …every existing message, unchanged…
	/** The visitor is still here without scrolling (pointer, keys, focus); at most one a second. (P4) */
	| { type: 'activity' }
	/** A fine pointer's position for the lean, -1 to 1 from the viewport center (x right, y down); null once it leaves. (P7) */
	| { type: 'pointer'; at: { x: number; y: number } | null }
```

P13 alone would add `{ type: 'tick' }` (main to worker) and `{ type: 'relay'; on: boolean }` (worker to main), its main-thread loop's pending frame cancelled in `destroy` as P7's is (a terminated worker can't turn it off). Our messages leave `SkyRect.headroom` (the measured text class, a number) as it is.

**The pointer listener (P7; R3 §8).**

- A passive `pointermove`, for mice and pens only: `event.pointerType !== 'touch'`, and a `LEAN_POINTER_QUERY` beside `DPR_CAP`:

  ```ts
  /** Pointers that lean the sky (LEAN): a mouse or pen on a screen that can hover. */
  const LEAN_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
  ```
- Normalized to −1 to 1 with the ResizeObserver's size, so it causes no layout read. Nothing is sent before that size is known (`!size.width`, as R3 §8 has it: a size of 0 would send a non-finite target that hangs `drawLayer`'s cell loop), and each axis is clamped to −1..1.
- At most one message per animation frame; `null` on `pointerout` with no related target and on `blur`; sent only under full motion; the pending frame cancelled in `destroy`.
- In the worker, `pointer` sets the lean target (an `at` with a coordinate that isn't finite is ignored, so no message can make the camera non-finite) and calls `noteInput`; `schedule(now)` runs after every message, as today. It doesn't set `needsDraw`, which would draw on every refresh while the mouse moves and bypass the divisor: `demandNow` sets the frame state's camera line while `leanWanted(camera, leanTarget(scene), motion === 'full')` (`camera.ts`, the test `stepCamera` also makes: full motion, and a lean spring away from its target), so a resting camera still wakes (F6). The lean's speed then sets the frames through `motionFps`, in whole-number holds: on a 1,440 px window at DPR 2 and 60 Hz, every refresh once the pointer moves faster than about 300 CSS px/s, with steps past 0.5 device px from about 400 CSS px/s (1.05 at 1,200). Where the drift's caps bind (narrow screens, ADAPT's first step, software raster), steps reach about 2 device px in a brisk sweep [computed, `reviser-r5/lean.mjs`]. The motion test matters: a pause freezes the springs wherever they are, often short of the pointer that just moved to the control, and without it the worker would draw 20 identical frames a second until Play [computed, check report]. `leanTarget(scene)` multiplies the pointer by `scene.lean` (0 below the hero), and is (0, 0) without a fine pointer.

```ts
// src/lib/sky/config.ts (P7)
/**
 * Leaning toward the pointer (mice and pens on hover-capable screens, the hero, full motion): the camera moves up to
 * `reach` CSS px (at nearness 1) toward a pointer at the viewport's edge, through critically damped springs of `omega`
 * rad/s (95% in 1.2 s), so the stars slide away from it, the brightest farthest (19 px) and the faint majority about 3.5 px:
 * the same law as scrolling, so the depth order never changes. iOS's own motion effects use about ±10 points; 7 is R4's
 * calmer setting.
 */
export const LEAN = { reach: 12, omega: 4 } as const
```

## 7. Implementation phases

### 7.0 Rules for every phase

- **Where.** Implement on `claude/sky-ambient-motion-impl`, in its own worktree (`.claude/worktrees/sky-ambient-motion-impl`), cut from `origin/master` at cf4d7b8 or later, and run `npm ci` there.
  - Each phase's pull request goes from that branch into `origin/master`; the user merges it, or approves the merge, and the next phase starts from the updated `origin/master`. Never move the local `master` ref: the main checkout has it checked out, so Git refuses, and the user fast-forwards it.
  - Never edit the main checkout (`S:\Documents\repos\Portfolio`).
  - Veil symbols follow 8.4's rule: use them, extend them through options, never rewrite them.
  - **Logs.** `COORDINATION.md` and `HANDOFF.md` live on the planning branch `claude/quirky-carson-btv2u4` (worktree `.claude/worktrees/sky-ambient-motion`). Commit each log entry there, not on the implementing branch, which carries code only.
- **Dev server.** Start our own `portfolio-dev` from the implementing worktree. `.claude/launch.json` has `autoPort: true`, so it takes a free port if another session's server holds port 3000.
  - Never stop or restart another session's server.
  - Point the `next-devtools` MCP checks at our port.
- **One phase, one pull request** (one commit per numbered step, each green), merged only after its verification. Phases land in order, except that P5 lands before P4 (Gates). P7, P12 and P13 are optional or conditional; P10 reaches master with P9 or right after it, because P9 alone makes fireballs about 8 times as frequent (one every 3 minutes), against E7.
  - Commit subjects and PR titles are conventional, as the recent history is: `feat(sky): ...` for visible changes, `refactor(sky): ...` for steps with no visible change (P1, P3), `docs: ...` for commits that touch only `AGENTS.md` or `README.md`.
  - Committed comments carry no plan cross-references (phase, invariant, decision, request or research IDs, or `file:line`) and no wording about the planning process (the veil commit, the confirmed interface, theirs or ours): they say the reason in words, since the plan never reaches the implementing branch. "(C8)", say, becomes "so the sky resumes where it stopped".
  - A committed doc describes what its phase ships, and the phase that adds a feature extends the docs that name it. The sketches in section 6 show each doc once every phase it names has landed, so earlier phases write it without the later clauses: P5 adds the motion ease (`FADE_FRAMES`, `FrameState.fading`); P6 the drift, its caps, the thin fade and `gather` to the 6.1 and 6.2 docs naming them, `FRAME.motionEase` and `SkyPauseButton`; P7 the lean and the pointer ping to those docs and `SCENE`'s (with D3 skipped, no doc names the lean); P8 every kind to `FrameState.transientDemand` (P3: "Every frame while a shooting star flies, fade frames while its train lingers"); P11 satellites and `CLEAR_SKY_KEEPS` to the docs P8 writes for shooting stars and clear-sky kinds (`TRANSIENTS`, the envelope's `clearSky`, the spec's `lease`, `drawTransient`), and a P12 kind that ships without P11 adds `CLEAR_SKY_KEEPS` itself.
- **Commands.**
  - `npm run lint` and `npm run type-check` (AGENTS.md).
  - While `next dev` runs, its MCP endpoint `/_next/mcp`: `get_errors` (no route; it reads browser sessions that have the page open, so full-reload `/` on our port first, 5.4), `get_compilation_issues`, `compile_route` for `/`.
  - Query the `motion` docs server (`.mcp.json`, CLAUDE.md) before writing animation code: P5's navbar entrance.
  - At the end of every phase (almost every one adds a module to the worker's graph or changes the client bundle): with our dev server stopped, `npm run build`, then the `portfolio-prod` preview. The sky must draw with no console errors.
  - If `next dev` or `next build` stops with a Next.js upgrade reminder, tell the user and rerun; don't upgrade Next.js.
  - Never POST to `/api/schedule/book`; nothing here touches it.
- **Gates.**
  - Before each phase, CP-1 (8.2).
  - P5 (the pause control) merges before any phase that extends automatically started motion: P4 (the twinkle and shooting stars no longer stop at 90 s while the pointer moves), P6 (the drift) and P9 to P12 (more transients). No commit ever has more continuous motion than today without its WCAG 2.2.2 control.
- **Shippable and reversible.**
  - After each phase, master could deploy as is.
  - Phases that change nothing visible prove it with identity harnesses and the reduced-motion screenshot.
  - Each phase names a kill switch, where one exists: a config value that turns its visible change off without a revert. It doesn't always restore today's exact behavior, and each says what remains. It also names its revert, together with the later phases that depend on it.
- **Evidence.** Each PR description records:
  - the harness output;
  - the checklist items passed (section 9);
  - screenshots or traces where the change is visible.

  Evidence never goes into the repository as files.
- **Coordination.** After each merge, CP-2 (8.2).

### 7.1 Verification kit (no test runner; D5)

**Commands and the MCP endpoint**, as in 7.0.

**Scratch harnesses** live in the implementing session's scratchpad and are never committed.

- Node 24 runs TypeScript by stripping types, but its loader rejects the extensionless relative imports in `src/lib/sky`. A small synchronous resolve hook fixes that without copying or editing a source file, and it maps `@/` too. It uses `module.registerHooks()`, because Node 24 deprecates `module.register()` (DEP0205) [verified on Node 24.14 by loading `scene.ts` and `renderSky.ts`, `reviser-r4/hook/`]:

```js
// register-hooks.mjs (scratch only): load the repo's TypeScript as is. SKY_SRC is the src folder under test.
import { registerHooks } from 'node:module'
import { pathToFileURL } from 'node:url'
const src = pathToFileURL(`${process.env.SKY_SRC}/`).href
registerHooks({
	resolve(specifier, context, nextResolve) {
		const mapped = specifier.startsWith('@/') ? new URL(specifier.slice(2), src).href : specifier
		try {
			return nextResolve(mapped, context)
		} catch (error) {
			if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !(mapped.startsWith('.') || mapped.startsWith('file:'))) throw error
			return nextResolve(`${mapped}.ts`, context)
		}
	},
})
```

- **Running.** From Git Bash: `SKY_SRC=<checkout>/src node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./register-hooks.mjs h-<name>.ts` (in PowerShell, set `$env:SKY_SRC` first). The flag only silences the once-per-run warning that `package.json` has no `"type"`.
- **A baseline tree** for before-and-after comparisons: `git archive <base> src/lib/sky src/components/sky | tar -x -C <scratch>/baseline`, then `SKY_SRC=<scratch>/baseline/src`.
- **`renderSky.ts` and `skyAssets.ts` load** with stubs for the canvas globals:
  - `ImageData` as a `{ width, height, data }` class;
  - `OffscreenCanvas`, whose `getContext` returns a recorder of `putImageData`, `drawImage`, `globalAlpha` and the other calls.
- **`sky.worker.ts` runs whole, for H13.** It reads `self` at load, keeps its state at module scope and exports nothing, so a harness that re-implemented `tick` and `schedule` would prove nothing about the shipped code. The rig:
  - one fake clock drives `performance.now`, `setTimeout` and `clearTimeout`, and a fake `self` whose `requestAnimationFrame` and `cancelAnimationFrame` run on the same clock, whose `postMessage` records, and whose `addEventListener` captures the message listener;
  - the recording `OffscreenCanvas` above;
  - a fresh worker per case, imported with a distinct query string (`./sky.worker.ts?case=3`);
  - each case dispatches messages to the captured listener and advances the clock.
- **Harness code must be erasable TypeScript only**: no parameter properties, enums or namespaces, which strip-only mode rejects. Every type-only import uses `import type` or an inline `type` specifier, since stripping keeps an import without them and Node then fails on the missing export. The same holds for `src`, which already complies.

**The debug patch** (scratch, never committed).

- A worker message `{ type: 'debug-frame', time, camera, speed, heading, rate, fps, k, js }` is sent per drawn frame (`speed` is `cameraSpeed`, CSS px/s at nearness 1, which times H6's band medians gives AC-1, AC-2 and AC-15; it also counts the scroll glide and the lean, so read it at least 1.2 s after the last scroll or pointer input, when only the drift moves), and `{ type: 'debug-transient', kind, start, end, heading, peak, startedAt }` per launch.
- `mountSky` collects them into `window.__skyDebug` (R4 §3.3), through cases in P5's message `switch` (before P5, the patch must also replace the `else destroy()` at `mountSky.ts:332`, or the first debug message destroys the sky).
- Apply it with `git apply` for verification runs, and revert it before committing.

| Harness | Proves | Pass when | Phase |
|---|---|---|---|
| **H1** atlas | Phase sprites match today's at phase 0 and keep their light | Phase-(0, 0) bytes equal the baseline's for every tint and shape at DPR 0.825, 1, 1.125, 1.25, 1.5, 1.75 and 2; every phase's unrounded sum within 0.6% of phase 0's and its alpha-byte sum within 2.5% (measured worst: 0.50% at DPR 2; 2.45% at DPR 0.825, 1.63% at 1.125); with `STAR_PHASES = 1` the whole atlas equals the baseline's | P1 |
| **H2** draw calls | Nothing visible changed | `drawSky` on a recording context gives the same list of (destination x, y, size, globalAlpha, source-pixel hash) as the baseline (P0's lists: cf4d7b8's render), with `snap` forced true. The scenarios: scroll {0, 1234.5, 5000} × zones {none, 31 settled, 31 mid-ease} × dusk {0.8 s, done} × DPR {1, 2} × keep {full, thinned}; with `STAR_PHASES = 1` too (P1's kill-switch identity); P2, P6 and P7 rerun the scroll-0 rows as the renderer's zero-offset identity (their switches never reach `drawSky`, so H5 checks them) | P1, P2, P6, P7 |
| **H3** quiet index | The index is exact | 100,000 random points × {31, 64 rects} × {settled, level 0.37} × {1440 × 900, 3840 × 2160, 390 × 844} × every layer's keeps, and rects with random `headroom` and `budgetKeeps(0.5, METEOR_VEIL.quietKeep)` (an `inkKeep` that reads each rect), and blends with a `next` list: `Object.is(index.factor(...), easedQuietFactor(...))` always; unchanged zones never rebuild, and a change of `headroom` alone does; timing at 1,430 stars, 64 rects, mid-ease under 0.4 ms | P1 |
| **H4** pacing | The clock plans what 6.2 says | `frameDemand` reproduces today's `frameMode` over a table of `FrameState`s (meteor flying or lingering, scrolling under full or reduced motion, dusk, quiet ease, twinkle, idle, sleep), the shipped mapping rather than a copy of it; `easing` and `easeEnded` mark the ends of the motion ease and the thin fade, and are false before the thin fade begins (`since` null); and a fade beside the capped drift keeps the drift's cap (on an unaligned clock, every third tick, not every tick); `refreshDivisor` reproduces 6.2's table; `stepDivisor` lowers k at once and raises it only after 0.5 s; the refresh estimate settles at 16.7 ms at 60 Hz with dropped frames, 8.33 ms at 120 Hz, moves to 33.3 ms within 16 samples after a switch to 30 Hz, and flags 15.0 ± 0.2 ms as unaligned; in timer-fallback mode a k = 2 demand wakes once per drawn frame, every 33.3 ms, even after the estimate read 8.33 ms | P3, P5, P6 |
| **H5** camera | Springs and drift behave | **Springs:** two half steps equal one step within 10⁻¹²; no overshoot from rest, or after a scroll that moves one way, at dt ∈ {1/144, 1/60, 1/15, 0.25, 5} s; 95% at 0.474 s for ω = 10; a one-step jump over one viewport snaps, and sustained flings of 3,000 to 10,000 px/s at H = 700 and 900 never do (no per-frame star step beyond the normal motion plus 0.25 px); eased jumps (ease-in-out) of 3,000 to 20,000 px over 0.3 to 1 s and sustained flings of 3,000 to 25,000 px/s, at H ∈ {700, 852, 900, 1440} and 30 to 144 Hz, also with `maxLag` 0.15 and with `scrollOmega` 12 (R-16): the brightest star glides at most `maxLag` × H × 0.112 after the page stops (25.2 px at H = 900; measured at most 23.6 after eased jumps), never overshoots, glides alike at 30, 60 and 144 Hz (eases in-out cubic) within 0.002 × H px wherever no step snaps (1.4, 1.8 and 2.9 px at H = 700, 900 and 1,440) and within 0.01 px after a fling that stops while capped, with the stop on a frame of every rate (C4), and is within 2.8 × 10⁻⁴ × H px of rest 0.7 s after the page stops and settled by 1.2 s up to H = 2,560, 1.3 s up to 3,840 (AC-39; one-step jumps of 0.1, 0.2 and 0.245 H at H up to 3,840 included, at AC-39's display rates, from a camera at rest and landing just after a frame, so the glide starts a frame late, C5); after 60 s at rest, a 100 px scroll moves the brightest star at most 1 px in its first step (C5); pause, scroll 5000 px with the live scroll fed while paused, resume: the position stays continuous within 10⁻⁹ px (C8; from P8 also with `parallaxScroll` retired).<br>**Drift (P6):** `driftWanted` and `driftRate` over a table of `DriftGate`s (DR2, DR3); `driftAt(0)` = 0; over 6 h the speed stays in [0.58, 1.42] v₀, the wander ≤ 68.4 s × `DRIFT.speed` + 0.1 px at q = 1 (205.3 px at v₀ = 3), the turn rate ≤ 4.4°/s, and its mean 2°/s within 0.01 over the 6 h and within 0.2 over every 10 minutes (AC-4); the first-minute headings match 6.1's table within 1°; rate steps (1 → 0.35 → 0) never move the camera within a frame (AC-9); a 5 s stall advances the clock ≤ 0.1 s.<br>**Lean (P7):** 95% at 1.19 s, no overshoot; `leanWanted` over a table: true under full motion while either spring is away from its target, false once both settle, and false under a pause with the springs short of the target.<br>**Kill switches:** `CAMERA.snapViewports = 0` keeps the offset at 0.07 × the scroll, with `stepCamera` false without drift or lean (no glide, P2); every `SCENE.*.drift = 0` gathers a `DriftGate` with scene 0, so `driftWanted` is false and `driftRate` 0 (P6); `LEAN.reach = 0` keeps `cameraOffset`'s lean term at 0 through a pointer sweep, and `leanWanted` false after one step (P7). | P2, P6, P7, P8 |
| **H6** depth | The depth law is as specified and the catalog didn't move | q bands 0.240 to 0.389, 0.389 to 0.741, 0.741 to 1.600; band means 0.293, 0.501, 1.024; monotone; capped from m 0.112; `cellStars` for 1,000 cells per layer equals the baseline field by field except the added `q` | P2 |
| **H7** scheduler | Transient invariants | Over 10⁵ random event sequences (scroll, layout, pause, hidden, resize, idle; a layout takes effect when the veil applies it, up to `QUIET.ease` after it arrives, and is `next` until then), with cf4d7b8's `updateMeteor` and `planLaunch` kept in the harness as the oracle for P8, the port drawing its fresh radiants up front in `planLaunch`'s order: never two `nearCopy` transients at once; a body reporting `nearCopy` when its context's `nearCopy` was false counts as failed, while a null plan in that context never counts toward `maxFailedPlans`; no lease before the reveal plus `crossingCooldown`; no lifetime over 5 s; no transient alive or drawn once `scrollKept` from its launch scroll is 0 (24 px); a cancel never extends a life; onsets ≥ 3 s apart; none on narrow screens past the limit or past 0.4 viewport heights; from P11 under D12's default, no transient that never takes the lease is ever active together with a `nearCopy` one; none adds light inside a padded rect of `to` or `next` from the frame a layout arrives; for the same seed and inputs, P8's launches, gaps and scroll retirements equal the oracle's (`crossingCooldown` is 0 in P8), including sequences with a resize (which clears the radiant) or a layout (which keeps it) between two launches | P8 to P12 |
| **H8** directions | The population model | **Sky parts** (P9 step 1), over 20,000 visits: at 1440 × 900 `showerOnScreen` set on 15 ± 1% and no other visit's radiant projecting inside the viewport; at 393 × 852 none on screen; every visit's shower passes the usability test, on screen or off.<br>**Launch parts** (P9 step 2), with no quiet rects and today's spawn area, launching as `planMeteorTransient` does (long flights on the first steer and fresh ones, then the short fallback over the same steers, 6.9): at 1440 × 900, 200,000 planned launches falling 76 ± 3%, sideways 17.5 ± 3%, climbing (D8 default) 7 ± 2% and only from sporadic sources, heading right 57 ± 3%; at 1440 × 900 and 393 × 852, launch attempts failing every steer under 5% and the shower's share of planned launches 40 ± 5%, in on-screen and off-screen visits alike [computed: 75.8, 17.6, 6.6 and 57.1%; failures 0.0% and about 1%; shower shares 40.9% and 41.9%]; every path ends at least 12 px inside the sides, at or below `METEOR.top` and above `maxEndY`; at least 99% of shower paths' great circles within 4.5° (3σ) of the shower radiant, which holds for radiants behind the viewer too, where paths converge forward; on the nine archived layouts (`harness/`), with `nearCopy` true, launches failing every steer under 5% on each desktop layout, and on 390 × 844 no more often than cf4d7b8's one-radiant planner (32.5%, `planner-9-viewports.txt`) [computed, check report: at most about 1.5%, at 1024 × 768; 13 to 15% on 390 × 844], and no accepted path within `ZONE_REACH` of a pinned zone (`clearOf`) | P9 |
| **H9** rates | The frequency model | Mean gaps 11.69 s (hero) and 21.00 s (narrow) over 10⁵ draws; first minute after the reveal median 5 with 3 to 6 in at least 85% of 20,000 simulated visits; crossings (`nearCopy` launches) a minute over a visit's first two minutes, over 20,000 simulated visits per layout, from the real `updateTransients` with P9's specs on each of the nine archived layouts' fields (P9 adapts the harness), at or below that layout's bar, which H7's oracle measures the same way on the baseline tree (6.9; 0.41 at 2560 × 1440, the lowest), the phone's (390 × 844) also giving how often a clear-sky plan fits (6.9); the cooldown, started at the reveal, set by 6.9's rule from these rates | P9 |
| **H10** limits | The 5 s and flash rules, from the config | Every kind's longest first-to-last light ≤ 5 s (fireball with train 4.9 s; satellite 4.8 s; a normal flight with train 3.8 s in P8, 3.2 s from P9, when only the fast class has trains); burst stagger ≥ 0.35 s; no drawable tint with R / (R + G + B) ≥ 0.8 (the maximum is 0.42) | P8 to P12 |
| **H11** presence | One gate, unchanged twinkle | `presenceLevel` equals today's `idleTwinkle` for the same input timelines, and `notePresence` returns true exactly when today's `isIdle` was true | P4 |
| **H12** pause store | The store's rules | With `matchMedia`, `localStorage` and `window` stubbed: the default with and without reduced motion; a pause surviving a reload; Play under reduced motion lasting only for the page view; reduced motion turning on mid-visit; a pause from another tab (`storage` event); blocked storage throwing on every access; `skyPlayback` null until `setSkyRunning(true)` and after `setSkyRunning(false)`; unsubscribe removing the global listeners; a remount (subscribe, unsubscribe everything, change the stored key and the reduced-motion stub, then read `skyPaused()` before subscribing again) following the new state | P5 |
| **H13** wake-up loop | Liveness and no jumps | The real worker on 7.1's rig (a fake `self` and one fake clock, a fresh module per case):<br>0. (P3) The same message scripts (load, reveal, a flight, a scroll and its glide, rest, hidden and back) on P2's worker and P3's, with a 60 Hz animation-frame clock, draw at the same times wherever P3 promises no change (at rest, during a flight, while scrolling; the glide's divided tail excepted); with animation frames that never fire, the watchdog's timer serves each frame and after three misses the 60 Hz fallback does.<br>1. In the reading scene (twinkle 0), after 95 s without input, one `activity` ping restarts frames at once, and the drift is back to full rate 4 s later (F6). In the hero, the same ping restarts twinkle frames at once, not at the next launch timer, and the twinkle eases in from 0.<br>2. A 100 px scroll after a minute at rest moves the brightest star at most 1 px in its first frame, then glides (C5).<br>3. A pause eases a twinkling star's alpha to its rest over the 0.3 s ease, across several drawn frames, never in one (deviation 3), and draws its last frame at level 0 with every star still at its phase, so none hops (F7, M1); a load under reduced motion draws snapped frames, and its first Play moves each star at most 0.5 device px per axis in one frame (M1's settle), then eases the drift in.<br>4. A pause with the camera at rest (drift 0, as in P5 before P6) still draws a final level-0 frame, with no twinkle (`easeEnded`).<br>5. (P7) A pointer sweep toward the control, then a pause within 0.5 s: 0 frames after the 0.3 s ease (`leanWanted`'s motion test).<br>6. (P6) In the reading scene with no drift (a slow raster probe, or D2 at 0), after the idle sleep, a `resize` that moves the scroll into the hero draws no twinkle (`frameAt` gathers first).<br>7. (P8) The launch gate, which H7's harness-built gates never reach: with `Math.random` seeded and a shooting star due 0.5 s after a `scroll` message, it launches no sooner than 1.2 s after that scroll, and none launches while idle, past 0.4 viewport heights or under reduced motion. | P3, P5, P6, P7, P8 |

**Browser checks.**

- **Chrome DevTools.** Performance (the worker's track shows each drawn frame and its JS time), the Rendering panel (emulate `prefers-reduced-motion`, `forced-colors`, `prefers-contrast`), and the Task Manager (the tab's CPU).
- **Safari Web Inspector.** Timelines, and Energy Impact on macOS; an iPhone over USB.
- **The Firefox Profiler.**
- **R4's 60-second watch** (9.1).
- **The session's browser tools**, if it has them (the Claude Browser pane, or the Playwright MCP with `browser_emulate_media`), for reduced-motion screenshots and timings. Don't add Playwright to the repository.

### 7.2 Phase map

```
P0 baseline ─► P1 render core ─► P2 camera seam ─► P3 pacing ─► P5 pause control ─► P4 presence ─► P6 drift ─┬─► P7 lean (optional)
                                                                                                             ├─► P13 WebKit relay (only if P6's device tests ask)
                                                                                                             └─► P8 transient core ─► P9 population and rates ─► P10 fireballs ─► P11 satellites ─► P12 coulds
```

| Phase | Visible change | Depends on | Kill switch (what remains) | Approx. size |
|---|---|---|---|---|
| P0 | none | | | no code |
| P1 | none | | `STAR_PHASES = 1` | ~250 lines |
| P2 | depth spread and glide while scrolling | P1 | `CAMERA.snapViewports = 0` (no glide; the graded depth stays) | ~250 |
| P3 | none at rest | P2 | | ~300 |
| P5 | the pause control | P3 | | ~250 |
| P4 | twinkle stays while the visitor is active | P5 | | ~80 |
| P6 | **the drift** (the headline change) | P4, P5 | every `SCENE.*.drift = 0` | ~200 |
| P7 | the lean (optional, D3) | P6 | `LEAN.reach = 0` | ~120 |
| P8 | a paused meteor fades instead of vanishing | P3, P4, P5, P6 (`narrowScreen`, `fadeOutAt`) | | ~350 |
| P9 | about 5 meteors a minute from varied directions | P8 | `METEOR_RATE.hero` and `.narrow` = `{ floor: 30, mean: 12, cap: 75 }`, `TRANSIENTS.narrowLimit = 2` (the directions and the long-visit stretch stay) | ~400 |
| P10 | fireballs retuned (reaches master with P9) | P9 | `METEOR_KINDS.fireball.chance = 0` (no fireballs; today has 8%) | ~80 |
| P11 | satellites | P8, P9 | none in config: remove `'satellite'` from `TRANSIENT_KINDS` (one line; `TransientBodies` and the registry keep it, so it compiles) | ~350 |
| P12 | each "could" kind | P9 (planet: P2); `CLEAR_SKY_KEEPS` from P11, or its own (7.0) | per kind | ~100 to 200 each |
| P13 | smoother Safari | P6 and device tests | relay off | ~40 |

### 7.3 The phases

#### P0. Baseline and preflight (no repository change)

- **Goal.** Measure cf4d7b8, so every later phase can prove "no change" or "this much change".
- **Steps.**
  1. Create the implementing branch and its worktree from `origin/master` (7.0), run `npm ci` and CP-1 (8.2), and read `COORDINATION.md` for anything after 2026-10-27. `npm run lint` and `npm run type-check` must be clean before any change.
  2. Set up the harness kit and the baseline tree (7.1). Record H2's baseline draw-call lists and the atlas bytes per DPR.
  3. **Browser baselines** (Chrome, 1440 × 900 at DPR 2 and DPR 1; 393 × 852 at DPR 2):
     - reduced-motion screenshots of the hero and the end bookend after the dusk;
     - a reading-scene screenshot (1.5 viewport heights) under full motion once the scroll has settled;
     - a 60 s Performance trace of the hero hands-off (drawn frames per second, worker JS per frame);
     - a 30 s trace in the reading scene (expect 0 frames);
     - the tab's CPU during hero idle;
     - R4's 60-second watch notes (meteor count and directions).

     Repeat the watch on an iPhone if one is available.
- **Done when.** Two harness runs produce identical logs, and the baselines are saved in the scratchpad.

#### P1. Render core: phase sprites, quiet index, stamp cache (no visible change)

- **Goal.** Draw today's exact sky through the machinery moving stars need.
- **Blocked on.** P0.
- **Files.**
  - `config.ts`: `STAR_PHASES`.
  - `skyAssets.ts`: `profile`, the phase-aware `paintSprite`, the 4 × 4 block layout, `starSpriteIndex`.
  - `quietIndex.ts`: new, with `ZONE_REACH` (from `QUIET_REACH`) and `zoneReaches`.
  - `scene.ts`: `sameRects` moved in and exported, still comparing `headroom` (8.4).
  - `renderSky.ts`:
    - `placePoint` and `corner`;
    - `SkyFrame.snap`, and the one quiet index `renderSky.ts` owns (6.4);
    - `drawLayer` placing stars with `placePoint` and dimming them with the index, so the `easedQuietFactor` import goes, as do `SHAPE_COUNT` and the `STAR_SHAPES` import with the old sprite lookup (nothing else in `renderSky.ts` reads them);
    - `StarField` with stamps, `CELL_CACHE_SLACK` and the key guard;
    - `drawSky` calling `beginFrame`, `quietIndex.update` and `trim`;
    - the docs of `EDGE` and the key.
  - `sky.worker.ts`: imports `sameRects`; `frameAt` sets `snap: true`.
- **Steps (one commit each).**
  1. The atlas, with H1 green; in the same commit `drawLayer` looks sprites up through `starSpriteIndex(tint, shape, 0, 0)`, since the 4 × 4 block layout moves every sprite (`renderSky.ts:127`).
  2. `placePoint` and `snap`.
  3. The quiet index and the `sameRects` move, with H3 green.
  4. The stamp cache, the guard and the docs.
- **No visible change means:**
  - H2's lists equal P0's (cf4d7b8's render) over the whole grid, and again with `STAR_PHASES = 1` (the kill-switch identity);
  - the phase-(0, 0) atlas bytes equal P0's;
  - the index differs from `easedQuietFactor` by exactly 0;
  - the P0 screenshots match pixel for pixel.
- **Verification.** Lint, type-check, H1, H2 and H3, plus:
  - a cache harness: a 10,000 px scroll in 50 px steps regenerates, per frame, only cells that just came into view; a camera moving at 25 px/s for 10 simulated minutes keeps the cache at most twice the visible cells and never regenerates a visible one (SF1);
  - B-10: the atlas size at each DPR and the cache bound;
  - the production build smoke test.

  Checklist: AC-8, AC-11, AC-12, AC-16 (a), AC-29, AC-30, AC-35, AC-36.
- **Rollback.** `STAR_PHASES = 1` restores the old atlas content. A revert removes everything; nothing persists (every later phase depends on it).

#### P2. Camera seam: continuous depth and scroll glide (visible while scrolling)

- **Goal.** One camera for every star: brightness-graded depth and a scroll glide, identical at rest.
- **Blocked on.** P1.
- **Files.**
  - `config.ts`: `DEPTH`, `CAMERA`; `LayerConfig.parallax` and the three `parallax` values go, with "scroll parallax" in the `LAYERS` doc (6.1).
  - `catalog.ts`: `Star.q`, `nearness`, `LAYER_NEARNESS`.
  - `camera.ts`: new, with the scroll part only (6.1).
  - `renderSky.ts`: `SkyFrame.offset` replaces `parallaxScroll`; `drawLayer` offsets each star by q·C and culls cells on both axes with `LAYER_NEARNESS` (6.5).
  - `sky.worker.ts`:
    - `camera`, `offset`, `updateCamera` and `cameraMoving`;
    - `init` creates the camera on the restored scroll;
    - the `motion` handler's resume (`parallaxScroll = scrollY`, `resumeCamera`);
    - the hidden branch's `forgetStep`;
    - `frameAt` sets `offset` and `snap: !skyMoved` (`skyMoved` set in `init` and the `motion` handler, 6.1);
    - `tick` calls `updateCamera`, and `frameMode` returns `'active'` while `cameraMoving` (until P3).
- **Steps** (each ending with lint and type-check green).
  1. `DEPTH`, `nearness`, `LAYER_NEARNESS` and `Star.q`, with H6 green.
  2. `camera.ts` with the scroll part, with H5's spring cases green.
  3. `SkyFrame.offset` and `drawLayer`'s offset and two-axis culling, and the parallax keys removed; until step 4, `frameAt` passes `offset: { x: 0, y: CAMERA.scrollParallax * parallaxScroll }`. H2 green on its scroll-0 rows at camera (0, 0) with `snap` forced true (at scroll 1234.5 and 5000, P1's lists carry the old per-layer parallax, so P2's continuous depth differs there by design).
  4. The worker wiring.
- **Visible change.**
  - At scroll 0, none: positions are identical, with stars at their exact quarter-pixel phases under full motion (S4).
  - While scrolled, each band spreads its parallax by brightness: the brightest stars follow 0.112 of the scroll, the faintest 0.017.
  - After a scroll stops the stars glide to rest in about half a second, at most about 25 px for the brightest even after a navbar jump; a jump in one step snaps.
  - Turning reduced motion off after scrolling no longer leaps the sky.
  - Under reduced motion, identical to today.
- **Verification.** Lint, type-check, plus:
  - H2: on its scroll-0 rows, with `snap` forced true and the camera at (0, 0), the lists equal P1's (the renderer's zero-offset identity);
  - H5 (springs, the snap, the lag cap, the rest rule, the resume continuity, the kill switch);
  - H6;
  - in the browser: scroll and stop (the glide); a navbar section link, Home and End (a short glide, AC-39); `scrollTo({ top: 8000, behavior: 'instant' })` from the console (the snap); reduced motion (still, screenshots identical to P0's at scroll 0); toggle reduced motion after scrolling 3,000 px (no jump);
  - a review of the reading scene's composition while scrolling (R1's risk).

  Checklist: AC-1 (the scroll part), AC-9, AC-26, AC-27, AC-30, AC-34, AC-35, AC-36, AC-39.
- **Rollback.** `CAMERA.snapViewports = 0` follows the scroll exactly, with no glide; the brightness-graded depth stays, so only a revert of the PR restores today's parallax (P3 and later depend on it).

#### P3. Frame pacing (no visible change at rest)

- **Goal.** Draw motion on display refreshes divided by a whole number, with a watchdog, without changing what a resting sky draws.
- **Blocked on.** P2.
- **Files.**
  - `config.ts`: `PACING`; the `FRAME` doc.
  - `pacing.ts`: new (6.2), with `FrameState`, `frameDemand` and `driftCap`.
  - `sky.worker.ts`:
    - `frameState` and `demandNow`, which fill the frame state at each frame decision (the veil's `quietEasing(t)` in `fading`);
    - `rafId: number | null`; `requestFrame`, `onStalled`, the watchdog with its strikes and the probe; `rafWorks`;
    - the refresh estimate and the divisor in `tick`;
    - `schedule` and `cancelFrames`, and the file's header doc and `schedule`'s doc (`:1-5`, `:167-170`), which describe today's timer split;
    - `SkyWorkerScope`'s animation-frame members optional.
- **Steps.**
  1. `PACING` and `pacing.ts`, with H4 green.
  2. `demandNow` and the gathered `FrameState`, reproducing `frameMode` under today's `schedule`, with H13's case 0 green on the 7.1 rig.
  3. `requestFrame`, the watchdog, its strikes and probe, `rafWorks`, the refresh estimate and the divisor in `tick`, in one commit: the fallback timer reads the divisor, and `tick` reads the fallback mode. H13's case 0 again, the stalled clock included.
  4. The docs.
- **Visible change.** None at rest. The scroll glide keeps every refresh while it moves fast: after a 1,000 px/s scroll it needs over 30 fps for about 0.4 s, and the 0.5 s hysteresis holds that rate until it settles [computed].
- **Verification.** Lint, type-check, H4 and H13's case 0, plus:
  - a Chrome trace: a worker frame on every vsync while scrolling and during a flight, twinkle frames about 67 ms apart in the hero, none in the reading scene or a hidden tab, and equal holds during a glide (AC-13);
  - Firefox the same;
  - Safari: the debug patch logs the worker clock as unaligned;
  - a local patch that makes `requestAnimationFrame` never call back: frames continue from the watchdog's timer, and after three misses from the 60 Hz timer, still about 60 a second through 5 s of scrolling (messages never push the timer back); a variant that blocks animation frames for 2 s only goes back to them within 5 s of the block's end (then remove the patch);
  - the production build smoke test.

  Checklist: AC-10 (the glide: every refresh while it needs more than the refresh rate, true steps at most 0.5 device px once k > 1, drawn positions within 1/8 px of true), AC-13, AC-14 (the idle part), AC-16 (b), AC-32.
- **Rollback.** Revert the PR (every later phase depends on it).

#### P4. Presence (visible: the twinkle keeps going while the visitor uses the pointer or keys)

- **Goal.** One presence gate: pointer, keys and focus count as being here, for the twinkle now and the drift later.
- **Blocked on.** P5 merged: P4 extends automatically started motion (the twinkle and shooting stars no longer stop at 90 s), so the pause control comes first (7.0 Gates).
- **Files.**
  - `presence.ts`: new (6.6).
  - `protocol.ts`: `activity`.
  - `mountSky.ts`: `ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`, the listeners, and `mountSky`'s doc (it forwards activity too).
  - `sky.worker.ts`:
    - `presence`; `noteInput` delegates;
    - `twinkleLevel`, `meteorsAllowed` and the twinkle line of the frame state use `presenceLevel` and `isIdle`;
    - the `activity` case;
    - `twinkleTime` and `hiddenTotal` (6.6).
  - `renderSky.ts`: `SkyFrame.twinkleTime`, which `drawLayer`'s twinkle reads instead of `frame.time` (`:124`), and `SkyFrame.time`'s doc (`:64`), which names no kind, since satellites read it too from P11: "Seconds on the worker clock, for everything but the twinkle (which reads twinkleTime)."
  - `config.ts`: the `FRAME` idle docs.
- **Steps.**
  1. `presence.ts`, with H11 green.
  2. The `activity` message in `protocol.ts`, then the worker: `presence`, `noteInput`, `twinkleLevel`, `meteorsAllowed`, the twinkle line and the `activity` case.
  3. `mountSky`'s listeners.
  4. The twinkle clock.
- **Visible change.** The twinkle (and the shooting stars) no longer stop at 90 s while the pointer moves or keys are pressed; otherwise the same.
- **Verification.** Lint, type-check and H11, plus in the browser:
  - move the mouse every 20 s for 3 minutes: the twinkle never fades and meteors keep coming;
  - leave everything alone for 95 s: the twinkle fades over 4 s, then a trace shows 0 frames;
  - a key press brings it back over 4 s, with no meteor for 3 s;
  - at most one `activity` message a second.

  Checklist: AC-14, AC-32 (twinkle continuity), AC-33.
- **Rollback.** Revert the PR (P6 and every later phase depend on it).

#### P5. Pause control (visible: the control in the navbar; lands before P4)

- **Goal.** Give the sky its WCAG 2.2.2 control before any phase extends automatic motion.
- **Blocked on.** P3. It uses D1's default unless the user picks another placement.
- **Files.**
  - New: `skyPause.ts` and `SkyPauseButton.tsx`; `icons/PauseSVG.tsx` and `icons/PlaySVG.tsx`, plus their `icons/index.ts` lines.
  - `Navbar.tsx`: the control last in `<nav>` and in the stagger (`NAV_STAGGER`'s doc, `Navbar.tsx:14`, gains "and the sky's pause control"), `inert` while the menu is open; the burger's `ml-auto` and `#primary-nav`'s `md:ml-auto`; the header's `onFocus`, its ref and the focus test in the scroll callback.
  - `mountSky.ts`: `motion()` reads the store; `syncMotion` with its dedupe; the worker-message `switch` with `setSkyRunning` on `'ready'`, and `destroy`; its own reduced-motion query goes.
  - `protocol.ts`: the `SkyMotion` doc.
  - `config.ts`: `FRAME.motionEase`.
  - `pacing.ts`: `Ease`, `easeAt`, `easing` and `easeEnded`.
  - `sky.worker.ts`: `motionLevel`; `twinkleLevel` drops its `motion === 'full'` guard and multiplies by the motion level, which now carries it (6.6); the motion ease in the frame state's `fading`; its last frame (`easeEnded`).
  - `AGENTS.md`: the pause line (6.8). `README.md`: the sky lines.
- **Steps.**
  1. `skyPause.ts`, with H12 green.
  2. The icons and `SkyPauseButton.tsx`.
  3. `mountSky`: the store, `syncMotion`, the message `switch` and `destroy`.
  4. The ease helpers and the worker's motion ease, with H4's ease rows and H13's third and fourth cases green.
  5. `Navbar.tsx`, then `AGENTS.md` and README.
- **Visible change.**
  - A green pause glyph in the navbar.
  - Pressing it settles the twinkle within 0.3 s, stops shooting stars and stops scroll parallax, and the glyph and name switch to "Play sky animation".
  - Pressing again resumes from there.
  - A reload stays paused, and another tab follows.
  - Under reduced motion the page starts paused, and Play opts in for the page view.
- **Verification.** Lint, type-check, H4 (the ease rows), H12, H13's third and fourth cases, and the hydration check (AC-41): full-reload `/` in a browser on our dev server's port and wait past the reveal, then call `get_errors` through `nextjs_call` (it takes no route) and read the log file `get_logs` names; `GET /` shows no "sky animation" in the server HTML.
  - **Keyboard and screen reader:** Tab reaches the control, Space and Enter operate it, and the dashed focus ring shows. VoiceOver or NVDA announces "Pause sky animation, button", then "Play sky animation, button" after activation.
  - **Order:** at 393 px Tab goes logo, burger, control; at 1440 px logo, links, Resume, control: the order on screen (2.4.3).
  - **The phone menu:** open it and Tab and Shift+Tab through it: focus never lands on the covered control; closed, it is reachable again (2.4.11).
  - **The hidden header:** tabbing into it after scrolling down brings the header back (2.4.11); with the control focused, Page Down and the arrow keys scroll without hiding it (2.4.7); after a mouse click on a nav link, scrolling down still hides it.
  - **Size:** DevTools shows a 40 × 40 target.
  - **Storage:** with storage blocked (DevTools "Block site data", or a Safari private window), toggling still works for the page and nothing throws. Clearing site data returns to the OS default.
  - **Preferences:** under forced colors the control is gone. Under the reduced-motion emulation it starts paused, Play works for the page view, and a reload starts paused again. From here on AC-26 compares with P0's screenshots with the navbar masked, since the control joins it.

  Checklist: AC-9, AC-26, AC-27, AC-28, AC-29, AC-41.
- **Rollback.** Revert the PR (P4 and every later phase depend on it). P4 and P6 must never ship without P5: revert them first (P6 may instead set every `SCENE.*.drift` to 0; P4 has no kill switch).

#### P6. Ambient drift (the headline change)

- **Goal.** The floating drift, paced, gated by presence and the pause control.
- **Blocked on.** P4 and P5 merged (P6 may merge together with them). It uses D2 and D6.
- **Files.**
  - `config.ts`: `DRIFT`; `SCENE.*.drift` and the `SCENE` doc; the `ADAPT` doc's drift cap (6.2); `ADAPT.thinFade` (recommended, below).
  - `pacing.ts`: `fadeOutAt`, with the thin fade (below).
  - `scene.ts`: `SceneLevels.drift`, the `mix` key and `sceneAt`'s doc (6.7).
  - `protocol.ts`: the drift in `SkyMotion`'s `full` doc (6.8).
  - `renderSky.ts`: `SkyFrame.thinFrom` and `thinLevel`, and the thinning fade in `drawLayer` (recommended, below).
  - `camera.ts`: `clock`, `EPICYCLES`, `DRIFT_REACH`, `driftAt`, `driftVelocity`, `DriftGate` with `driftWanted`, `driftTarget` and `driftRate`, and the drift terms of `stepCamera`, `cameraOffset` and `cameraSpeed`.
  - `sky.worker.ts`: `driftGate` and `gather` (called by `tick`, `demandNow` and `frameAt`, 6.1), `narrowScreen` set in `resize`; the drift in the frame state's camera line and its cap, with `softwareFps` from `probeRaster`'s kept milliseconds (6.2); the twinkle reading `driftGate.on` and `.level`; the header doc (reading and idle no longer simply sleep); the ADAPT fade: `thinnedAt` in `stepDown`, `frameAt`'s `thinFrom`, `thinLevel` and `keep`, and its `fading` line and `easeEnded` (recommended, below).
  - `README.md`: the sky lines (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`).
- **Steps.**
  1. Config and the camera, with H5 green before any wiring; `updateCamera` passes `drift: 0` until step 3.
  2. The scene.
  3. The worker, with H13 green.
  4. The ADAPT fade (below), checked with a local patch that forces step 1: the thinned stars fade over 1 s on fade frames, then one final frame.
  5. A by-eye pass on a DPR-2 laptop, a DPR-1 monitor and a phone, changing only `DRIFT.speed` within 2.5 to 3 and, if wanted, rotating the phases (D6). Every drift check holds for any v₀ in that range. A v₀ above 3 is the user's D6 choice: H5's wander bound is then 68.4 s × v₀, AC-15's limits scale with v₀ (they are stated per v₀), B-2 allows every refresh at DPR 2 above v₀ 3.3, and above 3.5 AC-2's 8 px/s ceiling fails by design. Rotating the phases also moves AC-4's first-minute check.
- **Recommended within P6 (do it)** (E11). Fade the stars that ADAPT step 1 thins out over 1 s, instead of removing 20% of them in one frame (`sky.worker.ts:354-357`; R3 §6): on a moving sky a one-frame loss of a fifth of the stars reads as a glitch.
  - `ADAPT.thinFade: 1`; the `ADAPT` doc gains "the stars step 1 thins out fade over `thinFade` seconds".
  - The worker records `thinnedAt` (s) when `stepDown` takes step 1.
  - `SkyFrame` gains `thinFrom`, the thinned share (`densityKeep × ADAPT.thinning`, `Infinity` before step 1), and `thinLevel`, `fadeOutAt(thinnedAt, ADAPT.thinFade, t)` (`pacing.ts`, the one-way fade P8's pause fade and P12's comet reuse; `thinnedAt` is null before step 1). While `thinLevel` is above 0, `frame.keep` stays the unthinned share.
  - `drawLayer`, after the keep test (`renderSky.ts:113`): `if (star.keep >= frame.thinFrom) alpha *= frame.thinLevel`.
  - `demandNow`'s `fading` also covers `easing(thinnedAt, ADAPT.thinFade, t)`, and `easeEnded` asks for one more frame when it ends (6.6).
- **Visible change.** Section 2.1.
- **Verification.** Lint, type-check, H4 (the thin fade's `easing` and `easeEnded`), H5 (the drift part) and H13, plus:
  - H2's scroll-0 rows (the renderer's zero-offset identity, `thinFrom` at `Infinity`) and H5's drift kill-switch row;
  - P4's idle checks again, in the hero and the reading scene: after 95 s without input a key press restarts frames at once, and the twinkle and drift ease back in over 4 s;
  - with the debug patch: the camera speed, which times H6's band medians gives AC-1, AC-2 and AC-15, and the on-screen band order (AC-1); k and fps, JS per frame (AC-13), and no frames after the idle timeout (AC-14);
  - the 60-second watch (9.1) on a DPR-2 laptop in Chrome, a DPR-1 monitor and an iPhone in Safari;
  - budgets B-1 to B-7 and B-10's 30-minute heap check with the drift running (section 10);
  - the ADAPT fade patch (step 4);
  - the DPR-1 shimmer decision (the 0.85 device px floor, 6.3);
  - the D7 device tests (WebKit judder and Low Power Mode drain).

  Checklist: AC-1 to AC-17, AC-26 to AC-28, AC-30, AC-32 to AC-34, AC-36.
- **Rollback.** Set every `SCENE.*.drift` to 0: no drift and no drift frames, with everything else intact. Or revert the PR (every later phase depends on it, P8 through `narrowScreen` and `fadeOutAt`).

#### P7. Pointer lean (optional, D3)

- **Goal.** Lean the stars away from a fine pointer in the hero, by the same camera law.
- **Blocked on.** P6.
- **Files.**
  - `config.ts`: `LEAN`; `SCENE.*.lean` (hero 1, reading 0, end 0).
  - `scene.ts`: `lean` in `SceneLevels` and the `mix` key.
  - `camera.ts`: the lean springs and terms, and `leanWanted`.
  - `protocol.ts`: `pointer`, and the lean in `SkyMotion`'s `full` doc (6.8).
  - `mountSky.ts`: `LEAN_POINTER_QUERY`; the frame-coalesced `pointermove`, with its size guard and clamp; `pointerout` and `blur` sending `null`; `cancelAnimationFrame` in `destroy` (6.13); `mountSky`'s doc (it forwards the pointer too).
  - `sky.worker.ts`: the `pointer` case, `leanTarget(scene)` with `updateCamera`'s `scene`, and `leanWanted` in the frame state's camera line.
- **Steps.**
  1. `LEAN`, the lean springs, `leanWanted` and the `lean` scene level, with H5's lean cases green; `updateCamera` passes a shared zero lean until step 3.
  2. The `pointer` message and `mountSky`'s listener.
  3. The worker: the `pointer` case, `leanTarget` and the camera line's `leanWanted`.
- **Visible change.** On a desktop with a mouse, the hero's stars lean away from the cursor (the brightest up to 19 px) and settle in about 1.2 s. Nothing happens on touch screens, below the hero, under reduced motion or paused.
- **Verification.**
  - H5 (the lean and its kill switch), H13's fifth case, and H2's scroll-0 rows (the renderer's zero-offset identity).
  - With the debug patch: at most one `pointer` message per animation frame while sweeping the mouse, none from touch and none before the canvas's first size; while the pointer moves, drawn frames follow the camera's speed (every refresh at DPR 2 once it moves faster than about 300 CSS px/s on a 1,440 px window, 6.13) in whole-number holds (AC-13), and the drift's divisor returns within 0.5 s of the lean settling; pausing right after moving the mouse to the control leaves 0 frames once the ease ends (AC-14).
  - In the browser: the lean stops below the hero; entering and leaving the window never jumps (AC-9).

  Checklist: AC-3 (lean excluded), AC-9, AC-10, AC-13, AC-14, AC-26.
- **Rollback.** `LEAN.reach = 0`, or revert.

#### P8. Transient core

- **Goal.** One scheduler for every short-lived event, with the ink lease and the scroll cancel, launching exactly as before.
- **Blocked on.** P3, P4, P5 and P6 (`narrowScreen`, `fadeOutAt`).
- **Files.**
  - `transients.ts`: new (6.9), kind-agnostic.
  - `protocol.ts`: "transients" in `SkyMotion`'s `full` doc (6.8).
  - `meteorKind.ts`: new (6.9): `MeteorMemory`, `createMeteorMemory`, `planMeteorTransient` (`planLaunch` ported) and `METEOR_SPEC`.
  - `random.ts`: `Random`.
  - `config.ts`: `TRANSIENTS` (`crossingCooldown` 0), taking `METEOR`'s scheduler keys (the narrow-block doc trimmed) and `FRAME.meteorScrollQuietMs` as `scrollQuiet` in seconds (6.9); `SCENE.heroMeteorMaxScroll` (`config.ts:171`) becomes `heroLaunchMaxScroll`, with its doc (6.7).
  - `scene.ts`: `SceneLevels.meteors` becomes `launches` (its doc keeps the veil's wording, 6.7), read where the key is (`scene.ts:36`).
  - `renderSky.ts`: `drawTransient`, which hands `drawMeteor` its `fade`.
  - `sky.worker.ts`:
    - `const transients = createTransientSchedule()` replaces `meteor`, `launchScrollY`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt` (6.9);
    - `launchGate` (with `ink` from `contrastLevels()` and `narrow` from `narrowScreen`); cancel and drop; `forgetVisitSky` where the oracle clears the radiant (resize only; 6.9); `holdTransients` and `retryTransients` in seconds; `meteorsAllowed` renamed `launchesAllowed`, and the `reveal`, `motion` and `noteInput` docs worded for transients (6.9);
    - `transientDemand` and `nextLaunchAt`;
    - `draw` with `transientFade`, in place of the veil commit's `scrollKept` call (I3);
    - `parallaxScroll` retired (6.9): `updateCamera` reads `scrollY`; the `scroll` handler's write and the `motion` handler's resume line go, and `init`'s chained assignment becomes `scrollY = message.scrollY`.
  - `README.md`: the sky lines (`transients.ts`, `meteorKind.ts`).
- **Steps.**
  1. `TRANSIENTS`, `Random` and the types (`METEOR`'s moved keys and `FRAME.meteorScrollQuietMs` stay until step 3: the worker still reads them).
  2. The scheduler (its retire step through `transientFade`) and the meteor kind (`planLaunch` ported), with H7 green against the oracle.
  3. The worker swap, in one commit because the worker reads every name it replaces: `transients`, the launch gate, cancel and drop, `forgetVisitSky` where the oracle clears the radiant, `drawTransient` with `transientFade` in `draw` (I3, I7), the `launches`, `heroLaunchMaxScroll` and `launchesAllowed` renames with their docs, `METEOR`'s moved keys (and the narrow block's doc) and `FRAME.meteorScrollQuietMs` removed, and the README line.
  4. `parallaxScroll` retired (its `let` and its three writers, 6.9), with H5's pause, scroll, resume case and H13 green.
- **No visible change means:**
  - the same rate (today's gap law), the same radiant behavior, the same narrow limit (2), the same veil checks, the same scroll cancel and no crossing cooldown (H7's oracle equality);
  - the one difference: pausing fades a flying meteor over 0.2 s instead of dropping it (scrolling already dims it through `scrollKept`).
- **Verification.** Lint, type-check, H7 (with the oracle), H10, H5's pause, scroll, resume case and H13 (its case 7 runs the worker's launch gate), plus the production build smoke test.

  Checklist: AC-18, AC-19, AC-22, AC-28 (the fade), AC-30, AC-31, AC-37, AC-38 (the lease), AC-40.
- **Rollback.** Revert the PR; today's `updateMeteor` returns (P9 to P12 depend on it).

#### P9. Meteor population model and rates

- **Goal.** Meteors from realistic directions, then at the new rate.
- **Blocked on.** P8.
- **Files.**
  - `config.ts`:
    - added: `GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `METEOR.fallbackScale`, `TRANSIENTS.longVisit`;
    - changed: `TRANSIENTS.narrowLimit` 6 and `crossingCooldown` (55 to start; the verification below sets it); the `METEOR` and `METEOR_LOOK` docs, `radiantTries`' meaning and the inner key docs (6.10);
    - removed: the keys 6.10 lists.
  - `radiants.ts`: new (6.10).
  - `random.ts`: `gaussian`.
  - `meteorKind.ts`: `MeteorMemory` becomes `{ sky: VisitSky | null }`; `planMeteorTransient` tries long flights on the first steer and fresh ones, then the short fallback over the same steers (6.9), and clears a failed sky; `METEOR_SPEC` uses `nextGap(METEOR_RATE…)`.
  - `gaps.ts`: new, `nextGap` (6.9).
  - `meteors.ts`: `Course`, `Steer`, the `steer` option in place of the `radiant` parameter, `startArea`, `PassOptions.fallback` in place of `timing`, the fallback's scaled minimum, the end guards, `clearOf`, the fireball path and `Meteor.wakeColor` (I2), and the `PassOptions`, `planFlight` and `planMeteor` docs (6.10).
  - `transients.ts` and `sky.worker.ts`: `SkyField.pinned`, which `launchGate` fills with the padded rails (6.9).
  - `mountSky.ts`: `copyReader`'s caveat names `clearOf` as the rails' guard (6.10).
  - `renderSky.ts`: the wake tint (6.10).
  - `README.md`: the sky lines (`radiants.ts`, `gaps.ts`).
- **Steps** (one commit each; the directions come first, because the rate may rise only after they have cut the crossing share: about 57% of the new flights fly away from the left-aligned copy).
  1. `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_BRIGHTNESS`, `METEOR.fallbackScale` (which `visitSteer` reads), the `Course` and `Steer` types and `startArea` in `meteors.ts` (an exported function naming today's spawn area, which `radiants.ts` probes and `planFlight` adopts in step 2), `radiants.ts` and `gaussian`, with H8's sky parts green.
  2. I2 in `planFlight` and `planMeteor` (the steer in place of the radiant, starts drawn from `startArea` as today, the fallback flag and its scaled minimum, the end guards, `clearOf` with `SkyField.pinned`, the peak, the fireball path), `Meteor.wakeColor`, the wake tint, the new `MeteorMemory` and `planMeteorTransient`'s steers; the old radiant, angle, speed, duration and peak keys removed; with H8's launch parts green.
  3. `GapLaw`, `METEOR_RATE`, `gaps.ts`, `TRANSIENTS.longVisit`, `narrowLimit` 6, and `crossingCooldown` at the value 6.9's rule gives from H9, searched from 55 s (P8's `revealTransients` already starts it at the reveal), with H9 green; the old gap keys removed.
- **Visible change.**
  - About 4.7 shooting stars a minute in the hero (median 5 in the first minute), from varied directions, about 4 in 10 sharing the visit's shower radiant.
  - The radiant on screen on about 15% of desktop visits.
  - Warm, white and mint wakes by speed class.
  - Varied brightness: on average about 0.6 of today's peak, about 1 in 8 faint, those high in the window nearly as bright as today's (`METEOR_BRIGHTNESS` is the knob).
  - Gaps that stretch from the third minute.
  - Up to 6 a visit on phones.
  - No crossing of the copy in a visit's first `crossingCooldown` seconds.
  - Fireballs keep today's 8% chance per candidate path, so at the new rate, with more clear sky, they come about one every 3 minutes at 1440 × 900, 8 times today's one every half hour [computed, check report], until P10 makes them 4% and 120 s apart (7.0).
- **Verification.** Lint, type-check, H7, H8, H9 and H10, plus:
  - the crossing cooldown, set by 6.9's rule from H9's nine layouts (AC-38);
  - the veil session's crossing measurement rerun (P9's end tests and `clearOf` change which paths fit), reported to Joseph beside its numbers (8.4) and logged (CP-2): the five rows of `COORDINATION.md`'s "Final crossing numbers" at its three sizes, and the `nearCopy` share and the pass at 0.12 on the other six layouts, each share per launch attempt, as `sim2.mjs` counts it, with H9's crossings a minute over a visit's first two and first five minutes beside the oracle's (6.9);
  - **the archived harness** (`harness/README.md`; I8) plans through names P9 removes, so adapt it outside the repository: extract it into the implementing session's scratchpad, point `lib.mjs`'s `ROOT` (its `HERE` and `ZONES` follow) and `transpile.mjs`'s `HERE` and `PLAN` at that copy, never at the veil session's scratchpad they name today, whose results they would overwrite (README steps 1 and 2), and create `live/out`, which the render writes to; then, in place of README step 3, which predates P9, follow this list: `transpile.mjs` with `REPO` at the implementing worktree (it transpiles every `src/lib/sky` file); `lib.mjs`'s loaders and the nine layouts, with `meteorKind`, `radiants`, `gaps` and `transients` added to its `P` and the field's `pinned` to `fieldOf`; each `pickRadiant` and `planMeteor` pair (`sim2.mjs:23-24`, `check11/render3-canvas.mjs:136`) replaced by `METEOR_SPEC.plan` on a fresh `PlanContext` per launch (a fresh `createMeteorMemory()`, as `sim2.mjs` draws a fresh radiant; `nearCopy` true; `ink` 1; `narrow` as `sim2.mjs:27` sets it); the proto tree only (`TREES=proto`; `sim2.mjs`'s base rows dropped, since `base` would be the implementing HEAD), with `sim2.mjs:28`'s short-flight count dropped (it reads `fallbackDuration`); the GPU rows from `check11/render3-canvas.mjs` (default `CANVAS=gpu`; never `render3.mjs`'s software canvas) at `FLIGHTS=200` and `SEED` 0 to 2 per size, as the veil ran them, its frame literal given P9's `SkyFrame` fields in place of `parallaxScroll` and `meteorScroll`, and its `launch` from `live/alib.mjs` (its `PW` and `CHROME` set), which keeps the GPU flags, in place of the unarchived `code-logic/lib.mjs`. `run-batch.sh`, `harness/build.mjs` and the live runs stay unused: they read worker names P3 and P8 replace;
  - B-9 (every-frame drawing at the new rate);
  - the 60-second watch.

  Checklist: AC-18 to AC-23, AC-31, AC-37, AC-38.
- **Rollback.** `METEOR_RATE.hero` and `.narrow` = `{ floor: 30, mean: 12, cap: 75 }` with `TRANSIENTS.narrowLimit = 2` bring back today's rate and limit with the new directions; the long-visit stretch stays the new one (×2 at 6 minutes, against today's ×1.5 after 3). Or revert the PR (P10 to P12 depend on it).

#### P10. Fireball retune (required with P9; after P9)

- **Goal.** Fireballs rarer, spaced and inside the 5 s rule.
- **Files.**
  - `config.ts`: `METEOR_KINDS`, below; `METEOR.fireballChance` and `fireballDuration` removed, the fireball doc moving onto `fireballSpeedScale` (6.10).
  - `transients.ts`: `PlanContext.sinceReveal`, filled from `gate.sinceReveal` in the launch step.
  - `meteorKind.ts`: the meteor spec decides fireballs before planning: desktop only, at least `after` s since the reveal, at least `spacing` s since the last one (in `MeteorMemory`), and `chance` per launch.
  - `meteors.ts`: the `fireball` option replaces `PassOptions.fireballs` and the per-attempt chance, in the code and the two docs (6.10).

```ts
/**
 * Rare kinds of shooting star: odds per launch, least seconds between two of a kind, and the earliest second after the
 * reveal. Fireballs (brighter than Venus; about one per 100 to 200 meteors in the real sky) stay in clear sky, last
 * `duration` s at METEOR.fireballSpeedScale of the normal speed, and with a 2.4 s train stay under 5 s; if no fireball path
 * fits, an ordinary shooting star flies instead.
 */
export const METEOR_KINDS = {
	fireball: { chance: 0.04, spacing: 120, after: 20, duration: [1.8, 2.5] },
} as const
```

- **Steps.** (1) `METEOR_KINDS` and the `fireball` option, with `METEOR.fireballChance` and `fireballDuration` removed. (2) The spec's fireball decision and `MeteorMemory`'s last fireball, with H7's fireball cases and H10 green.
- **Visible change.** Fireballs at 4% of launches, at least 120 s apart and none in the first 20 s: about one every 5 to 10 minutes.
- **Verification.** H7 extended: no two fireballs closer than 120 s, none before 20 s, every fireball clear-sky. H10.

  Checklist: AC-31, AC-37.
- **Rollback.** `METEOR_KINDS.fireball.chance = 0` turns fireballs off (today flies 8%), or revert.

#### P11. Satellites (should; after P8 and P9)

- **Goal.** Steady satellites in clear sky, on their own clock.
- **Files.**
  - `config.ts`: `SATELLITE` and `CLEAR_SKY_KEEPS`.
  - `satellites.ts`: new (6.11), with `SATELLITE_SPEC`.
  - `quietIndex.ts`: `segmentClear`, the clear-sky test of every path we plan ourselves (6.4).
  - `transients.ts`: `satellite` in `TransientBodies`, `TRANSIENT_KINDS` and the registry (`SATELLITE_SPEC`); D12's two-way hold in the launch step, unless D12 lifts it (6.9).
  - `renderSky.ts`, or a split `renderTransients.ts` (if split, add it to AGENTS.md's worker list): `drawSatellite` (through `transientQuietFactor`) and its `case`, which hands it `CLEAR_SKY_KEEPS`.
  - `README.md`: the sky lines (`satellites.ts`).
- **Steps.** (1) `SATELLITE` and `satellites.ts` without the kind: `SatellitePass`, `SatelliteFrame`, `satelliteMoving` and `satelliteAt`, with the speed, fade and warmth checks green. (2) The kind, in one commit, because the registry and the drawing switch make a kind without a spec or a `case` a compile error: `'satellite'` in `TransientBodies` and `TRANSIENT_KINDS`, `planSatellite`, `SATELLITE_SPEC` and its registry entry, `drawSatellite` and its `case`, with H7 and the pass checks below green.
- **Visible change.** Now and then, a steady point glides across clear sky for under 5 s, often fading into Earth's shadow.
- **Verification.** H7 with satellites (and D12's hold, unless lifted) and H10, plus:
  - every pass at most 4.8 s, clear of every padded rect's reach (`segmentClear`), never `nearCopy`, constant speed, at most one mid-sky fade;
  - no light inside a padded rect of `to` or `next` from the frame a layout arrives, even mid-pass or mid-ease (`transientQuietFactor` with `CLEAR_SKY_KEEPS`);
  - the first attempt within 60 s on 39 ± 2% of simulated visits;
  - in the browser: 5 minutes in the hero; satellites look steady, never blink, warm as they fade, never start within 3 s of a shooting star; scrolling or pausing during a pass fades it; none on a phone or past the hero.

  Checklist: AC-24, AC-30, AC-31, AC-37. Budgets B-8 and B-9.
- **Rollback.** No config value turns satellites off: remove `'satellite'` from `TRANSIENT_KINDS` (7.2's kill switch; `TransientBodies` and the registry keep it, so it compiles), or revert, keeping `CLEAR_SKY_KEEPS` if a P12 kind reads it.

#### P12. Could kinds (each its own PR, per D4)

- **Goal.** Ship each "could" kind the user picks in D4, one at a time: the near-radiant point flash, bursts, earthgrazers, farewell meteors, the static comet and the planet (6.12).
- **Blocked on.** P9 for every kind but the planet, which is a star (star keeps, per star, per frame) and could follow P2.
- **Files per kind.** The point flash, bursts and earthgrazers: a `METEOR_KINDS` entry in `config.ts` (with a doc comment), the variant in `meteorKind.ts` (decided like fireballs, reported by the spec's `clearSky(body)`), `transients.ts` (the first of them adds `clearSky(body)` to `TransientSpec` and folds it into the envelope's `clearSky`), `renderSky.ts` (the `drawMeteor` keeps argument from `drawTransient`), and `radiants.ts` for the point flash. Farewell meteors: their registry entry and the scene report (`transients.ts`: `'farewell'`, `LaunchGate.scene`, `TransientSpec.scene`, `room` and `limit`, `TransientSchedule.kindLaunches`, step 2.2's holds), `scene: 'hero'` in `METEOR_SPEC` and `SATELLITE_SPEC`, `scene.ts` (`SceneLevels.launchScene` in place of `launches`, computed in `sceneAt`, with its doc), `SCENE.endLaunchLevel` (documented beside `heroLaunchMaxScroll`) and the spec's gap law and visit cap in `config.ts`, their spec in `meteorKind.ts` (the band's edge for `room` and `plan`, and `planMeteorTransient`'s optional second argument), the `starts` option and `clearOf`'s farewell clause in `meteors.ts`, `drawTransient`'s `'farewell'` case, and the scene in the worker's `launchGate` (6.12). The comet: its block in `config.ts` (its first delay included), the model module `src/lib/sky/bodies.ts` (placement; its fade-in, and its box and pause fades through `fadeOutAt`; the box test; the launch scroll; the start rule over the launch gate; its light is the fade-in × `scrollKept`, 6.12), `LaunchGate.bodyShowing` in `transients.ts`, the worker (the comet's state, its pause time set in the `motion` handler beside `cancelTransients`, its retirement in `resize` beside `dropTransients`, its fade-in in `demandNow`'s `fading`, `bodyShowing` in `launchGate`, and its hand-off to `renderSky.ts` in `draw`), its drawing after the layers in `renderSky.ts`, and README's sky line. The planet: its catalog entry in `catalog.ts`.
- **Steps.** (1) Config and model, with its harness checks green: burst members at least 0.35 s apart and all clear-sky; farewell paths clear of the end scene's unmarked copy, a hold (never a failed plan) wherever `room` finds none, and at most 2 a visit (6.12); the comet's box clear of every zone's reach in `to` and `next` on every drawn frame, the drift and the lean included, the comet never starting while `leaseHeld`, before its first delay, unsettled or idle, nor a lease beginning while it shows, and a resize retiring it. (2) The drawing. (3) Its acceptance item.
- **Visible change.** The kind appears as its 6.12 row says.
- **Verification.** Lint, type-check, H7 and H10 with the kind, its harness checks, its acceptance item (AC-25 for the comet) and the 60-second watch; the comet and the planet also get a composition review, and the planet re-baselines AC-26's P0 screenshot (it shows under reduced motion).
- **Rollback.** Set the variant's `METEOR_KINDS` chance to 0, remove the comet's or the planet's body, or revert its PR. Nothing depends on it.

#### P13. WebKit frame relay (D7: only if device tests ask; blocked on P6 and the tests)

- **Goal.** Smooth motion on Safari, whose worker clock ignores the display.
- **Go criteria.** On an iPhone in Safari or on macOS Safari, AC-10 or AC-13 fails visibly (judder of the near stars, about 4.5 jolts a second, R3 §2.2), or a 10-minute Low Power Mode test shows an energy impact well above Chrome's on the same machine.
- **Files.**
  - `protocol.ts`: `tick` and `relay`.
  - `mountSky.ts`: the `relay` case in P5's message `switch`, and a main-thread rAF loop that posts `tick` while the worker asks for it, its pending frame cancelled in `destroy`, as P7's is.
  - `sky.worker.ts`: asks for the relay (`{ type: 'relay', on }`) while its clock is unaligned and a vsync demand exists, and draws on `tick`.
- **Steps.** (1) The two messages and the `relay` case. (2) The main-thread loop. (3) The worker's request and its `tick` frames.
- **Visible change.** On Safari only, moving stars land on display refreshes (no judder); elsewhere nothing changes.
- **Verification.**
  - The same device tests now pass.
  - The main-thread trace shows the relay at 10 to 30 µs per frame and no long tasks.
  - Chrome and Firefox never enable it, because their clocks are aligned.
  - After `/links`, View Full Portfolio, then Back, a main-thread trace on `/links` shows no relay frames.

  Checklist: AC-10, AC-13; budget B-5.
- **Rollback.** Revert; the worker falls back to its own clock.

## 8. The veil commit this plan builds on

### 8.1 Baseline: the veil commit

The meteor-veil fix is cf4d7b8 on master ("feat(sky): let shooting stars glide faintly behind hero copy", parent 246c0aa, pushed): its confirmed diff exactly (patch-id checked), with every recommended setting and no launch hold. It lets a shooting star glide on behind quiet copy at a glimmer fitted to each rect's measured `headroom` (`INK_BUDGET`), retires flights on scroll (`scrollKept`), keeps transients under the current and waiting zones (`transientQuietFactor`), defers a layout that arrives mid-ease, and takes far stars off the copy's letters (`LAYERS.far.inkKeep` 0). `COORDINATION.md` has the rest: "Confirmed veil interface", "Answers to the planning session's questions", "Committed: cf4d7b8" and the final crossing numbers in "Landed in the working tree".

### 8.2 Checkpoints

| ID | When | Action |
|---|---|---|
| **CP-1** | Before every phase | `git fetch origin`, then `git log --oneline <last-checked>..origin/master -- src/lib/sky src/components/sky`, and the same for the local `master`. A new sky commit on `origin/master` (a veil follow-up, say) is merged before the phase starts: read it, recheck 8.4's rows against it, and rerun H2 and H3. One only on the local `master` waits until the user pushes it or says to include it, since the phase's pull request would publish it. Read any message from the veil session. |
| **CP-2** | After each phase merges | A dated `COORDINATION.md` entry on the planning branch (7.0) listing the files and functions the phase changed, and the same note to the veil session while it is active (SendMessage through `ListAgents`, or the user relays it). P9's entry carries its crossing numbers and `copyReader`'s new rail guard (8.4). |

### 8.3 Interface requests: final status

`COORDINATION.md` (2026-10-27) settles every request. Our code imports none of the veil's private helpers (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`): the control's contrast figures (6.8) were computed offline, and a harness that rechecks them carries its own WCAG formula.

| # | Request | Final status |
|---|---|---|
| I1 | An options object on the planner, and `Meteor.nearCopy` | **In cf4d7b8**: `planMeteor(random, field, radiant, now, options: PlanOptions = {})` with `PlanOptions { nearCopy?, flights?, ink? }`; `Meteor.nearCopy`, true when `dimFrom < 1`; `planFlight` private, with `PassOptions` (`timing`, `fireballs`). The ink lease (P8) reads `nearCopy` without re-checking the path. |
| I2 | The direction source, the `fireball` option and the end test | **Ours**, agreed with three asks (8.4): `steer` replaces the `radiant` parameter and `pickRadiant`, `PassOptions.timing` becomes a `fallback` flag, the 18 to 42° filter goes, the end test gains the right edge and `METEOR.top`, and `clearOf` keeps paths off the rails (P9); `fireball` joins `PlanOptions` (P10). `veiledFrom` never changes. |
| I3 | One kind-agnostic scroll cancel | **In cf4d7b8**: `scrollKept(launchScrollY, scrollY, fade = 1)` with `SCROLL_CANCEL = { from: 12, to: 24 }`; retire at 0; pause and cancel fades go in as `fade`; no second threshold-plus-fade rule. `transientFade` calls it for every kind (P8). |
| I4 | A `QUIET_REACH` export | **In cf4d7b8**: `QUIET.padding + QUIET.feather`, 72 px from a measured rect; `ZONE_REACH` is it less `QUIET.padding`, 40 px from a padded zone (P1, Q1). |
| I5 | A per-rect text class and its budgets | **In cf4d7b8**: `SkyRect.headroom`, a measured number (no enum); `INK_BUDGET`, `inkBudget(headroom)` and `budgetKeeps(white, quietKeep, ink = 1)`; the far-star case closed (`LAYERS.far.inkKeep` 0, so `STAR_INK_PEAK` is 0). Each budget counts one transient plus the haze, so the lease stays "one lit transient near copy". |
| I6 | Export `segmentTouches` | **Declined** (it stays private). Our planners share `segmentClear` (6.4); meteors keep the planner's own test. |
| I7 | A `fade` on `drawMeteor` | **In cf4d7b8**: `drawMeteor(ctx, assets, meteor, frame, fade = 1)` multiplies the train, wake, glow and core alphas; `SkyFrame` gains no scroll field. The wake tint from `meteor.wakeColor` is ours (P9). |
| I8 | Their numbers | **Answered**: the SHA (cf4d7b8); the names and answer 1's list; `SCROLL_CANCEL`, `INK_BUDGET` and the final crossing numbers (`COORDINATION.md`); the harness and the nine captured layouts, 390 × 844 at DPR 3 among them, archived in `harness/` and never extracted into the repository. No `quietBlend` cache (R-20). |
| I9 | May never-lease kinds overlap a lease holder, and may a comet fade with the launch gate? | **Answered** (answers 3 and 4): yes, on answer 3's three conditions (no light inside a padded rect of `to` or `next`, T3; `scrollKept` from its own launch, T4; the lease for light on quiet copy, T2), which our clear-sky kinds meet by construction; two at once is a look choice (D12). Not the launch gate: the comet keeps `scrollKept`, unless its own scroll fade passes 6.12's check on the shortest screen where it can show. |

### 8.4 Veil symbols this plan uses or extends

**The rule: use them, extend them through options, never rewrite them; `veiledFrom` never changes.** Where a phase replaces a veil function (P3's `frameMode` and `tick`, P8's `updateMeteor` and `planLaunch`), it carries the veil's lines over in their order, as the row says. The symbols are answer 1's, checked against cf4d7b8.

| File | Symbols | How this plan uses or extends them | Phase |
|---|---|---|---|
| `meteors.ts` | `planMeteor`, `planFlight`, `PlanOptions`, `PassOptions`, `Meteor` | `steer`, `clearOf`, `fireball`, the `fallback` flag, `startArea`, the end tests, `Meteor.wakeColor` and their docs (I2, 6.10); farewell meteors' `starts` option (6.12) | P9, P10, P12 |
| `meteors.ts` | `veiledFrom`, `segmentTouches`, `headGain`, `WAKE_GAIN`, the pass trade (`METEOR_PASS`) | unchanged; `veiledFrom` judges each course's `peak` | P9 |
| `scene.ts` | `quietFactor`, `easedQuietFactor`, `quietAt`, `QuietKeeps`, `QuietBlend`, `screenQuietZones` | the quiet index wraps `easedQuietFactor` (H3); `segmentClear` and `pickVisitSky` read `quietAt` | P1, P9, P11 |
| `scene.ts` | `transientQuietFactor`, `scrollKept`, `inkBudget`, `budgetKeeps` | every transient draws through `transientQuietFactor` and fades through `scrollKept` (`transientFade`) | P8, P11, P12 |
| `scene.ts` | `SceneLevels.meteors` | renamed `launches`, its doc keeping the veil's wording (6.7); with farewell meteors, `launchScene` in its place, its doc naming the end bookend (6.12) | P8, P12 |
| `config.ts` | `LAYERS`, `STAR_INK_PEAK`, `QUIET_REACH` | `ZONE_REACH` derives from `QUIET_REACH` (P1); `parallax` and the doc's "scroll parallax" go, beside the veil's ink sentences (P2) | P1, P2 |
| `config.ts` | `METEOR` and its docs | the scheduler keys move to `TRANSIENTS` (P8); the direction, speed, duration, gap, peak and fireball keys go, `radiantTries`, `attempts`, `maxEndY` and the fireballs are re-documented, and the spawn and guard values stay (P9, P10) | P8 to P10 |
| `config.ts` | `INK_BUDGET`, `METEOR_VEIL`, `METEOR_PASS`, `SCROLL_CANCEL`, `CONTRAST_*.meteorInk` | read only | P8 to P12 |
| `renderSky.ts` | `drawMeteor`, `drawTrain`, `SkyFrame`, the imports | `drawTransient` passes `drawMeteor` its `fade`; the wake tint (P9) and a keeps argument (P12) join `drawMeteor`; our `SkyFrame` fields sit beside `meteorInk` and `quiet` (P1, P2, P4, P6), the imports change with what each phase reads (5.1), and the unread `easedQuietFactor` and `STAR_SHAPES` imports go (P1) | P1, P2, P4, P6, P8, P9, P11, P12 |
| `sky.worker.ts` | `frameMode`, `tick`, `quietEasing` | `demandNow` replaces `frameMode` with `quietEasing(t)` in `fading`, and `tick` keeps calling `settleQuiet` before the frame decision as P5, P6 and P8 add to it (6.2) | P2, P3, P5, P6, P8 |
| `sky.worker.ts` | `frameAt`, `draw` | `frameAt` keeps its `contrast` local, `quiet: quietBlend(t)`, `meteorInk: contrast.meteorInk` and its doc line (answer 2) beside our fields; `draw` calls `drawTransient`, and hands P12's comet to `renderSky.ts` | P1 to P8, P12 |
| `sky.worker.ts` | `sameRects`, the imports | `sameRects` moved to `scene.ts`, still comparing `headroom`, so a headroom-only change still reaches the worker (answer 2); the imports change with what each phase reads (5.1), and P8 drops the meteor imports the schedule takes over | P1 to P8, P12 |
| `sky.worker.ts` | `updateMeteor`, `planLaunch`, `launchScrollY`, `contrastLevels` | replaced by the schedule: `planMeteorTransient` ports `planLaunch` in its order and `transientFade` the scroll retire; the launch gate's `ink` reads `contrastLevels()` (6.9) | P8 |
| `sky.worker.ts` | `quietBlend`, `applyLayout`, `settleQuiet`, `pendingLayout`, `rebuildHaze`, the `layout` branch | unchanged, except that the `layout` branch's `retryMeteors` becomes `retryTransients` (no layout calls `forgetVisitSky`, RD1) and, only if B-1 fails, R-20's cache of the zone arrays inside `quietBlend`, keeping its output (H3, AC-16 (b)) | P8 (R-20: P6) |
| `mountSky.ts` | `copyReader`, `CopyReader`, `quietRect`, `quietRects`, `Shift`, `NORMAL_FONT_WEIGHT`, `mountSky` | the measurement unchanged, its doc's rail guard now `clearOf` (P9, 6.10); our listeners and the pause wiring join `mountSky` beside it | P4, P5, P7, P9, P13 |
| `protocol.ts`, `color.ts` | `SkyRect.headroom`; `parseRgbColor`, `minimumContrast`, `lightHeadroom` | unchanged; nothing of ours imports `color.ts`'s WCAG helpers | none |
| `AGENTS.md` | the `data-sky-quiet` line | P5's pause line follows it | P5 |

**The veil session's three asks for P9** (`COORDINATION.md`, "Answers to the planning session's questions"):

1. `steer` reaches into `planLaunch`'s port: keep its order (long flights on every candidate direction, the sticky one first, then fresh ones up to `METEOR.radiantTries`, one on narrow screens, before any short flight) and its stickiness (a resize clears it; a layout doesn't re-pick it).
2. `PassOptions.timing` may become a `fallback` flag: keep the timing values in config (`SPEED_CLASSES`, `METEOR.fallbackScale`) and `planMeteor`'s `flights` option.
3. The new end tests change which paths fit, so after P9 rerun the crossing measurement on the archived layouts and report the numbers to Joseph next to the veil's. The veil's edge-fade rule stays on every viewport.

## 9. Acceptance checklist

### 9.1 The 60-second watch (adapted from R4 §3.1)

1. **Setup.**
   - A laptop in Chrome at default scaling (about 1440 × 900, DPR 2).
   - Once more on a DPR-1 external monitor, the worst case for stepping and shimmer.
   - Once on an iPhone in Safari, and once on a mid Android phone in Chrome.
   - No reduced-motion or contrast preference set; storage cleared.
2. **The first 60 s, hands off, from the reveal.** Note:
   - when the first shooting star appears and how many follow, and their directions;
   - any star that pops, steps or shimmers (stare at one bright star at the right of the hero for 10 s);
   - whether the headline seems to drift;
   - whether the faint stars look still while the bright ones float;
   - whether anything bobs or reverses;
   - the first satellite, if any.
3. **Reading.** Scroll to About and watch for 15 s, then scroll back.
4. **Pause.** Press the pause control and reload: it stays paused. Press again: the sky resumes from where it stopped.
5. **Preferences.** Turn OS reduced motion on while watching, then off.
6. **Hidden tab.** Switch away for 60 s, then come back.
7. **Idle.** Leave the page untouched for 2 minutes, then move the mouse.

### 9.2 The checklist

These are R4's checks (§3.2), trimmed and mapped to phases. "Amended" items differ from R4 for the reason given; AC-35 to AC-41 are new. ★ marks items the 60-second watch covers.

Methods: **W** watch, **S** scripted screenshots or frame capture, **T** a performance trace, **L** the debug patch's log, **H** a scratch harness (7.1), **C** code review or config assertion.

| ID | Check | Pass when | How | Phase |
|---|---|---|---|---|
| AC-1 ★ | Depth order | By the law (H6's median nearness 0.284, 0.476 and 0.941 times the camera speed the debug log records): band median speeds far < mid < near, adjacent ratios 1.67 and 1.98. On screen, over 10 s without input: the median speeds keep the order far < mid < near (a band's few on-screen stars can move its median well off the law's, 6.1) | L, S | P6 (P2 for scroll) |
| AC-2 ★ | Still frame of reference | By the law times the measured camera speed (read as 7.1 says): far median ≤ 1.5 px/s, near median ≤ 6, and no ambient star over 8 (design at v₀ = 3: medians 0.85 and 2.8 at v₀, 1.21 and 4.0 at the drift's peak; the brightest star 6.82 at the peak; a v₀ above 3.5 breaks the 8 px/s ceiling, D6) | L, S | P6 |
| AC-3 | One heading | All drift headings within ±5° of each other at any instant, pointer lean excluded | L | P6, P7 |
| AC-4 | Smooth turning (amended) | Per second of drift clock (the debug log's values divided by its `rate`, which is 0.6 on phones and below 1 outside the hero): turn rate at most 4.4°/s with no step, its mean 2°/s ± 0.2 over any 10 minutes (shorter windows swing by design, 6.1), and speed never under 0.58 v₀; in the first minute after the dusk, within 30° of level for at least 50 s. R4 asked for at most 15°/min, which the settled epicycles don't meet by design (6.1). | H5, L | P6 |
| AC-5 ★ | No starts, stops or reversals | From 6 s after load, once the dusk ease is over (AC-9 covers the eases): speed changes at most 10% per second (design 3.8%); no stop in 60 s | H5, S | P6 |
| AC-6 | No oscillation | No component between 0.05 and 0.5 Hz (the drift's are 0.0056 to 0.0134 Hz) | C, H5 | P6 |
| AC-7 | No visible repeat (amended) | Within 30 minutes, no 60 s stretch of path matches an earlier one within 5 px at q = 1, compared with the two stretches aligned at their first points, since a repeated shape is what would show (design 6.3 px, at a 24-minute lag; 8.9 px comparing absolute positions; about 4 px after the best translation); exact repeat only after 25 h. R4 asked "never within 50 px of an earlier offset", which no bounded path can meet. | H5 | P6 |
| AC-8 ★ | No edge pops | No star appears or vanishes inside the viewport in one frame (EDGE 24 ≥ the largest halo's half-side, at most 12 CSS px, 6.5) | S | P1, P6 |
| AC-9 | Rate changes never jump | At scene changes, idle, pause, reduced motion, resize, the 640 px crossing and the lean entering or leaving: largest per-frame displacement ≤ normal + 0.25 px, except M1's one settle on the first full-motion frame after a still load (at most 0.5 device px per axis, once per page view) | H5, H13, S | P2, P5, P6, P7 |
| AC-10 ★ | No pixel stepping (amended) | True positions (the debug log's camera offset × q × dpr): at most 0.5 device px per drawn frame for every star wherever the motion needs no more frames than the display has and no cap holds it (the drift, and a glide or a lean once it is slower than 0.5 device px per refresh; design at most 0.50 at v₀ = 3). While a glide or a brisk lean needs more, every refresh is drawn (k = 1): at DPR 2 on 60 Hz the brightest star then steps up to about 4 device px a frame for the glide's first 0.37 s, and 1.05 in a pointer sweep of 1,200 CSS px/s across a 1,440 px window; where a cap binds (narrow screens, ADAPT's first step), a brisk sweep steps up to about 2 [computed]. A held frame doubles the next step (about 0.9 device px for the brightest star at DPR 2), so this bound and AC-13's intervals catch a stall. Drawn positions: each axis within 1/8 device px of its true position (the quarter-pixel phases), and, where the true step is bounded, at most 0.5 device px per axis per frame (diagonal drawn steps reach 0.71). No line fit: a correct drift already misses a 2 s fit by 0.30 to 0.40 device px [computed]. R4 asked for 0.25 px, which needs 60 fps at DPR 2; 0.5 px is R3's settled step and within R1's 0.5 to 0.6 arcmin rule. | L, S | P3, P6, P7, P13 |
| AC-11 ★ | No shimmer (amended) | Flux constant across phases (H1: within 0.6% unrounded and 2.5% in bytes); perceived peak swing ≤ 10% at DPR 2; DPR 1 judged by eye with the 0.85 floor decided (6.3). R4's 20% peak-pixel limit is below what the pixel grid alone gives at DPR 1 (20 to 35%). | H1, S, W | P1, P6 |
| AC-12 | No streaks | A moving star's sprite extent along its motion ≤ extent across + 1 device px | S, C | P1, P6 |
| AC-13 | Frame pacing | During drift, ≥ 95% of intervals within ±25% of k refreshes; worker JS ≤ 4 ms at p95 (≤ 2 ms on a mid laptop, B-1); no main-thread task over 50 ms from the sky | T, L | P3, P6, P7, P13 |
| AC-14 | Energy | Budgets B-1 to B-7; 0 drawn frames after the idle timeout, while hidden, and when paused or under reduced motion with no scroll | T | P3, P4, P6, P7 |
| AC-15 ★ | Calm while reading (amended) | Drift at D2's level (default 0.35 of the hero; or 0), twinkle 0, no transients. At 0.35 the camera's drift speed at nearness 1 (debug log, read as 7.1 says) stays at most 0.5 v₀ (design peak 1.42 × 0.35 = 0.497 v₀), so the law's near-median star (q 0.941, H6) moves at most about 0.47 v₀ and no star on screen over 0.8 v₀ (1.41 and 2.4 px/s at v₀ = 3; design 1.0 on average and 1.40 at the peak for the near median, 2.39 for the brightest; R4 said 2); all scale with D2's level. The on-screen sample's near median isn't the test: it runs 0.45 to 0.55 v₀ at the peak across common sizes (6.1) | L, S | P6 |
| AC-16 | Restraint near copy | (a) A drifting star crossing a quiet edge changes alpha by at most 0.05 per drawn frame. (b) While rects are re-measured mid-ease, no star's alpha changes faster than the quiet ease allows (at most 2 a second: 0.78 × 1.5 / 0.6 s), with no one-frame pop. Both on the alpha before the twinkle, measured with the hero's twinkle at 0: the twinkle alone moves a near star up to 0.07 a frame at 20 fps [computed, check report] | S, L | (a) P1, P6; (b) P3, P6 |
| AC-17 ★ | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s report no apparent motion of the copy | W | P6 |
| AC-18 | Attention budget | No onset in the first 3 s after the reveal; onsets at least 3 s apart; at most one onset per 6 s on average (design one per 11 to 13 s) | H7, L | P8, P9 |
| AC-19 ★ | A first shooting star | 4.5 to 7 s after the reveal in ≥ 18 of 20 fresh desktop loads | L | P8, P9 |
| AC-20 ★ | Frequency (amended) | First 60 s after the reveal: median 5, with 3 to 6 at H9's bar (about 90% by design); in the browser, 3 to 6 in ≥ 8 of 10 runs, which a sky at 90% passes about 93% of the time and one at H9's 85% floor 82% (the 10-run median alone is 5 only about half the time); never two meteors at once outside a burst; gaps stretch from minute 2 (×2 at 6 min, ×3 at 10); narrow screens ≤ 6 a visit. R4 said median 4 and a stretch after 3 minutes, for its 12 to 18 s gap. | H9, L | P9 |
| AC-21 ★ | Varied, believable directions (amended) | Over 10 meteors: ≥ 3 radiants and headings spanning ≥ 60°; climbs over 15° only from sporadic sources, at most 0.6 of the longest path and ≤ 10% of launches (D8; under its alternative, none over 10°); each shower meteor's path, extended on the sky as a great circle, passes within 4.5° (3σ) of the visit's shower radiant, whether the radiant is in front (paths fan out) or behind the viewer (they converge forward). R4 said "none rises more than 10°" (D8). | H8, L | P9 |
| AC-22 ★ | Light in, light out | Head light under 15% of its peak at the first and last on-screen points; never enters or leaves an edge bright; peaks in clear sky (the veil) | L, C | P8, P9 |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel (unchanged today) | C, S | P9 |
| AC-24 | Satellites (amended) | Speed varies under 2%; pass ≤ 4.8 s; no tail, no blinking; one at a time; at most one mid-sky fade per pass (a dusk pass slides in lit from a side and fades into the shadow; a dawn pass fades in over ≥ 0.8 s and leaves through a side); clear sky at launch; no light inside a padded rect of `to` or `next` from the frame a layout arrives; desktop hero only; a first attempt within 60 s on 39 ± 2% of simulated visits (E7). R4 asked for ≥ 40 s across and a 2 s fade, which break the 5 s rule (D9). | H7, L, S | P11 |
| AC-25 | Comet (if built) | 6.12's rules: only the camera law moves it; it starts only through the launch gate past its first delay (full motion, settled, present) and fades in over ≥ 8 s; a pause fades it out over `cancelFade`; every part through `transientQuietFactor` with `CLEAR_SKY_KEEPS`, its box clear of every zone's reach in `to` and `next` on every drawn frame (fading over `cancelFade` when not); its light is its fade-in × `scrollKept` from where it started to show, gone for the page view at 0, so never over reading copy; a resize retires it; at most one a visit | S, H | P12 |
| AC-26 ★ | Reduced motion is still | With `prefers-reduced-motion: reduce`, two hero screenshots 30 s apart after the dusk are identical, and identical to P0's at scroll 0 (from P5 with the navbar masked, since the control joins it; re-baselined if P12's planet ships, since it shows under reduced motion); no drift, glide, lean, twinkle or transients | S | P2, P5, P6, P7 |
| AC-27 | Live preference switch (amended) | Turning reduced motion on stops every star within 1 s, each moving at most 1.05 px after the switch (1.02 for the brightest at the drift's peak, the 0.3 s ease); turning it off resumes without a jump (after a load under reduced motion, apart from M1's one sub-pixel settle), even after scrolling while stopped; no shooting star for 3 s. R4 said "≤ 1 px" without an ease; the ease keeps that limit within rounding. | S, H5 | P2, P5, P6 |
| AC-28 ★ | Pause control (2.2.2) | Visible, named, keyboard-operable; its name and glyph switch with the action; stops drift, twinkle, parallax and transients within 1 s; still paused after a reload; other tabs follow; resumes from the paused positions; starts paused under reduced motion when nothing is stored; passes the G186 and F16 procedures. Focus: Tab order equals the visual order at every width (2.4.3); with the phone menu open, Tab and Shift+Tab never land on the covered control, and tabbing into a hidden header shows it, which stays while it holds keyboard focus (2.4.7, 2.4.11) | W, S | P5, P6 (fades from P8) |
| AC-29 | Forced colors and contrast | Forced colors hide the sky and the control; `prefers-contrast: more` drops the haze and dims the stars, drift allowed | S | P1, P5 |
| AC-30 | Contrast budget (amended) | Quiet copy: body text keeps ≥ 4.5:1 over the brightest moving star (drift changes positions, never alpha; the quiet factor at the drawn position); a transient adds at most its rect's `inkBudget(headroom)` on the copy (the veil's); satellites and the point flash add no light inside the padded rects of `to` or `next` (T3); one lease. No star keeps light on the copy (`LAYERS.far.inkKeep` 0, so `STAR_INK_PEAK` is 0). Reading copy (no quiet rects): stars behind it never brighter than today's at the same scroll, plus D2's chosen option | C, H3, H7 | P1, P2, P6, P8, P11 |
| AC-31 | Flash safety | At most 3 luminance flashes in any second; each transient's change ≤ about 2,000 CSS px² (limit 21,824); no tint with R / (R + G + B) ≥ 0.8 | C, H10 | P8 to P12 |
| AC-32 | Hidden tab | After 60 s hidden, the sky reappears where it was (no leap of v × time hidden); no shooting star for 3 s; with P4's twinkle clock, the twinkle continues where it left off | S, H5 | P3, P4, P6 |
| AC-33 | Idle | After 90 s without scroll, pointer, keys or focus, the drift and twinkle ease out over 4 s, then 0 frames; any input eases them back over 4 s, in every scene, including reading (F6) | T, S, H13 | P4, P6 |
| AC-34 | Resize and zoom | No star jumps beyond what the new layout requires; the drift continues; crossing 640 px changes speed only | S | P2, P6 |
| AC-35 | Pixel equivalence (new) | P1's draw calls equal P0's over the H2 grid; P2's equal P1's on the grid's scroll-0 rows, at camera (0, 0) with `snap` forced true | H2 | P1, P2 |
| AC-36 | Exactness (new) | Quiet-index difference 0; spring half-step composition difference 0 and overshoot 0; the drift bound and speed range as computed (6.1) | H3, H5 | P1, P2, P6 |
| AC-37 | Transient invariants (new) | T1 to T7 hold over 10⁵ random event sequences; every kind's first-to-last light ≤ 5 s from the config (H10); from P10, fireballs at 4% of launches, at least 120 s apart and none before 20 s, in about 12% of first minutes (E7) | H7, H10 | P8 to P12 |
| AC-38 | Ink lease and crossings (new) | Never two `nearCopy` transients at once; at most one lease grant per `crossingCooldown`, and none in a visit's first `crossingCooldown`; copy crossings (`nearCopy` launches) per minute over a visit's first two minutes at or below what the veil commit flies on the same captured layouts over the same window (6.9's bar for each layout), with the cooldown retuned up or down from the measured rates if not (6.9) | H7, H9, L | P8, P9 |
| AC-39 | Scroll glide (new) | After any scroll that moves one way stops (a fling, a navbar jump, Home or End), at the display rates browsers run (30, 48, 50, 60, 66.7 for WebKit's worker clock, 72, 75, 90, 100, 120 and 144 Hz), every star is within 2.8 × 10⁻⁴ × H CSS px of rest 0.7 s after the page stops (0.25 px at H = 900, 0.40 at 1,440, 0.72 at 2,560; computed worst 0.246, 0.393 and 0.699) and settled by 1.2 s up to H = 2,560 and by 1.3 s up to 3,840. The worst case is a one-step jump just under `maxLag` × H from a camera at rest at 30 and 48 Hz, whose glide starts on the sky's next frame (C5) [computed, `reviser-r5/ac39.mjs`]; at other rates, or after a late first frame, it starts later: up to 3.6 × 10⁻⁴ × H at 0.7 s between 30 and 48 Hz, settled by 1.25 s up to H = 2,700 [computed, check report]. No reversal over 0.1 px, and none glides more than `maxLag` × H × 0.112 after the stop (about 25 px at H = 900); a jump in one step (an instant `scrollTo`) snaps; a sustained fling that moves less than a viewport per frame never does (C4) | S, H5 | P2 |
| AC-40 | Scroll cancel (new) | Every transient keeps `scrollKept(launchScrollY, scrollY, pause fade)` of its light: all of it within 12 px of scroll from its launch, none from 24 px, where it retires that tick, even after a one-step jump; a pause fades it over `cancelFade`; a cancel never extends a life | H7, S | P8 |
| AC-41 | Hydration and presence of the control (new) | After a full reload of `/` on our dev server, past the reveal: no hydration warning from `get_errors` (through `nextjs_call`, no route) or in the `get_logs` file; `GET /` returns HTML with no "sky animation" in it; the control is absent until the sky's first frame, and gone if the sky fails | MCP, S | P5 |

## 10. Performance budget and battery

### 10.1 Expected cost per drawn frame

These figures come from R3's measurements (§4.6; V8 in Node on a shared Xeon, so absolute numbers are indicative) and the pacing in 6.2.

| Device | Stars drawn | Worker CPU per frame | Drift frame rate (v₀ = 3) | CPU share while drifting |
|---|---|---|---|---|
| Laptop 1440 × 900, DPR 2, GPU canvas | 314 | 0.2 to 0.4 ms | 20 to 30 fps | 0.4 to 1.2% of a core |
| 4K desktop, DPR 1, GPU canvas | about 1,400 | 0.8 to 1.7 ms | 20 fps | 1.6 to 3.4% |
| Phone 393 × 852, DPR 2 | about 108 | 0.4 to 1.0 ms, plus an estimated 2 to 4 ms of GPU fill | 20 fps (22.2 on WebKit; cap 30) | 0.8 to 2% CPU; GPU to be measured |
| macOS Safari hero (unaligned clock) | 314 | as the laptop | 66.7 fps | about 1.3 to 2.7% (D7 decides the relay) |
| Software raster, 1440 × 900 at CSS resolution | 314 | 3.3 to 3.9 ms | 20 fps (the budget allows 20 to 24) | 6.6 to 7.8% |
| Software raster, 4K | about 1,400 | about 29 ms | none (the budget gives 2 fps, under 20) | as today (a still sky) |

- **What pays for continuous frames.** The quiet index cuts the star math at 1,430 stars from 1.3 to 1.7 ms mid-ease to 0.14 to 0.32 ms. Phase sprites cost the same to draw as today, since every destination is a whole pixel.
- **When the sky draws nothing:** under reduced motion or paused (after the 0.3 s ease), while reading if D2 picks 0, 90 s after the last input (the 4 s fade runs inside that window), and in hidden tabs.
- **Memory.** The atlas grows from 48 KB to about 0.7 MB at DPR 1 and from 127 KB to about 1.9 MB at DPR 2 (built in under 1.5 ms). The cell cache holds at most twice the cells in use, about 2.7 MB at 4K.

### 10.2 Frames a minute, today and after (60 Hz, DPR-2 laptop)

| State | Today | After P6 (v₀ = 3) and P9 to P11 | Note |
|---|---|---|---|
| Hero, present, no input | 900 (twinkle timer, 15 fps) | 1,200 to 1,800 (20 to 30 fps on animation frames) | twinkle rides along at no extra cost |
| Hero, shooting stars | about 100 extra (1.4 flights a minute, about 1.5 s each) | about 190 to 260 extra (about 6.4 s a minute at 60 fps: 4.7 flights of 0.96 s plus 0.39 s of wake) | every refresh while one flies |
| Hero, satellites | none | about 100 to 130 extra (3.3 s a minute at 60 fps) | 4.8 s every 89 s or so |
| Hero, pointer moving (P7) | as hands off | up to 3,600 (every refresh while a sweep moves the lean faster than about 300 CSS px/s); the drift's rate within 0.5 s of the lean settling | the lean's speed sets the rate (6.13); B-2 and B-6 are measured hands off |
| Scrolling | 3,600 | 3,600 | unchanged |
| Reading, present | 0 | 1,200 at drift 0.35; 0 at drift 0 | D2 |
| End bookend | 900 | 1,200 to 1,800 | drift 0.8 |
| Idle over 90 s, hidden, paused | 0 | 0 | unchanged |

### 10.3 Budgets (pass/fail)

| ID | Budget | Pass when | Measure |
|---|---|---|---|
| B-1 | Worker JS per drawn frame, hero drifting | p95 ≤ 2 ms on a mid laptop (1440 × 900, DPR 2); ≤ 4 ms everywhere (ADAPT's step-down threshold, the safety net) | Chrome Performance, worker track |
| B-2 | Drawn frames, hero, hands off, drift only | 20 to 30 fps at 60, 120 and 144 Hz; never every refresh from the drift alone at v₀ ≤ 3.3 (D6), except on WebKit's unaligned clock, where macOS Safari draws it on every 15 ms tick (deviation 5, D7) | trace |
| B-3 | Reading scene, present visitor | 20 fps at drift 0.35; 0 at drift 0 | trace |
| B-4 | Idle and hidden | 0 frames within 1 s after the 90 s idle window ends (its 4 s fade runs inside the window); 0 while hidden | trace |
| B-5 | Main thread | No sky-attributable task over 50 ms; `activity` ≤ 1 a second; `pointer` ≤ 1 per frame; no per-frame main-thread work | trace |
| B-6 | CPU, laptop | Hero drifting, hands off, ≤ today's hero-idle CPU + 3 points of one core, and ≤ 10% of a core in absolute terms (R4 AC-14); reading at 0.35 ≤ today's + 1 point | Chrome Task Manager against P0 |
| B-7 | Phones | Drift ≤ 30 fps; no ADAPT step-down in 5 minutes on a mid Android; on an iPhone the worker stays under 4 ms a frame (Web Inspector) | device traces |
| B-8 | Satellites | ≤ 4.8 s of every-frame drawing per pass; scheduler update ≤ 0.05 ms a tick; planning ≤ 1 ms per launch | trace; H7 timing |
| B-9 | Shooting stars at the new rate | Every-frame drawing ≤ 10 s a minute in the hero (about 6.4 s for meteors plus about 3.3 for satellites, 10.2) | trace |
| B-10 | Memory | Atlas ≤ 2 MB at DPR 2; star cache ≤ 2 × the visible cells; no growth over 30 minutes | worker heap snapshots |

### 10.4 Battery levers, in order of effect

1. The 90 s presence gate (no frames when nobody is there), set by `FRAME.idleSleepMs`.
2. The reading drift (D2): 0 restores today's sleeping reading scene.
3. v₀ ≤ 3.3, which keeps DPR-2 60 Hz screens at 30 fps or less (D6).
4. `PACING.minFps`. R1's perceptual bound needs only 5 to 8 fps for the reading drift (R1 §4.4). If B-3 or B-7 fails, lower `minFps` to 12 for drift levels at or below 0.35 (one condition on the camera line in `frameDemand`) before cutting anything else.
5. The narrow cap and the ADAPT cap (30 fps each), and the WebKit relay (D7).

## 11. Accessibility conformance summary

| Criterion | Level | How the sky meets it |
|---|---|---|
| 2.2.2 Pause, Stop, Hide | A | Continuous drift and twinkle start automatically, last more than 5 s and run beside the copy, and decorative motion is not exempt (w3c/wcag #3478, #4921). So the page gets one control that stops every moving part of the sky at once (G186, G4) and resumes from the paused positions. It sits at the top of the page, is remembered, and is paused by default under reduced motion. It ships before the drift (P5 before P6). Each transient lasts at most 5 s (T1), which passes on the per-instance reading the veil session also uses, and the control stops transients too. The idle stop, hero-only transients, the scroll cancel and the long-visit slowdown are UX and battery choices, not the 2.2.2 mechanism: scrolling away is not "hide" (#5029), and reduced motion is the control's default, not the only mechanism (#3766, #4319). The control covers the sky only; the gradient cards' rotating border is page motion outside this plan (open question 8). |
| 2.3.1 Three Flashes or Below Threshold | A | At most one or two luminance flashes per transient (rise and burn-out, or a flare); bursts staggered ≥ 0.35 s, with no flares, so at most 3 a second. Every transient's changing area is at most about 2,000 CSS px², under 10% of the 21,824 px² limit (G176; R2 §9.2). No saturated red: the warmest drawable tint has R / (R + G + B) = 0.42, against the 0.8 threshold. |
| 2.3.3 Animation from Interactions | AAA | Scroll parallax, its glide and the pointer lean are interaction-driven motion. All stop under prefers-reduced-motion (C39, SCR40) and when paused: the springs hold. Twinkle and fades are opacity changes, which "motion animation" excludes. |
| 1.4.3 Contrast (Minimum): the veil | AA | Stars dim per star behind quiet copy (`data-sky-quiet`: the hero, Contact, the footer and the rails) exactly as today: the quiet index is bit-identical, and the factor is taken at each star's drawn position every frame. Drift changes positions, never alpha. One transient at a time may light up near copy (the ink lease), because each rect's budget counts one transient plus the haze. The main thread measures each rect's `headroom`, and the veil fits any brightness to `inkBudget(headroom)` (`INK_BUDGET`). Satellites and the clear-sky could kinds are kept clear of the copy as T3 says, and shooting stars of the side rails, whose links change color on hover and focus (`clearOf`, 6.10); farewell meteors also keep clear of everything above Contact, where unmarked copy can show on tall screens (6.12). No star keeps light on the copy itself (`LAYERS.far.inkKeep` 0 since cf4d7b8; AC-30). **Reading copy** (About to Other Projects) has no quiet rects, today or after this plan: stars sit behind it at the reading scene's levels (alpha at most about 0.25) and, with D2's drift, cross it slowly; D2 lists the options. The budgets remain the veil session's. |
| 1.4.11 Non-text Contrast | AA | The glyph carries the state: green on navy is 14.1:1, and 12.7:1 on the phone menu's light navy. The focus ring is the global 2 px dashed green outline (`globals.css:80-83`). |
| 2.4.7 Focus Visible | AA | The global `:focus-visible` ring applies to the native button, and the header never slides away while it holds keyboard focus (6.8). |
| 2.4.11 Focus Not Obscured (Minimum) | AA | The header shows itself whenever focus enters it (P5); today a focused nav control in the hidden header sits fully off screen (`Navbar.tsx:79`). The control leaves the tab order while the open phone menu's panel covers it (`inert`). |
| 2.5.3 Label in Name | A | No visible text label, since it is an icon button; the accessible name is its `aria-label`, which names the action the glyph shows. |
| 2.5.8 Target Size (Minimum) | AA | The control is 40 × 40 CSS px (minimum 24 × 24). |
| 2.1.1 Keyboard; 2.4.3 Focus Order; 4.1.2 Name, Role, Value | A | A native `<button>`: Tab, Space, Enter. It comes last in `<nav>` with no CSS `order`, so focus follows the visual order at every width. Its name tracks the action (the APG rotation control), and it has no conflicting `aria-pressed`. |

## 12. Risks and open questions

### 12.1 Risk register

L is likelihood and I is impact (H, M, L).

| ID | Risk | L | I | Mitigation | Trigger and owner |
|---|---|---|---|---|---|
| R-3 | A later sky commit on master (a veil follow-up, say) conflicts with a phase in progress | L | M | CP-1 before every phase; new code in new files and appended config blocks; 8.4's rule for veil symbols | CP-1; the implementer |
| R-4 | WCAG 2.2.2 read as "decorative motion is exempt" | L | H | The control ships anyway, before the drift; it is cheap, and the working group has said decorative motion is not exempt | P5 |
| R-5 | Induced motion: the copy seems to drift, or a vertical heading reads as scrolling | M | M | The faint majority nearly still; a horizontal opening (D6); AC-17 with three reviewers. If it fails: v₀ 2.5, or flatten the drift's vertical part with one constant (a y-scale of 0.5 in `driftAt`, accepting a minimum speed of 0.29 v₀ during vertical stretches) | P6 watch; the user |
| R-6 | Battery: continuous frames where the sky used to sleep (reading) | M | M | The levers in 10.4; B-3, B-6 and B-7 measured against P0 | P6; the implementer |
| R-7 | The phone GPU cost is an estimate (2 to 4 ms a frame) | M | M | The 30 fps narrow cap; B-7 on a mid Android; lower `minFps` or the reading drift if it fails | P6 devices |
| R-8 | WebKit's unaligned 15 ms worker clock judders (about 4.5 jolts a second) and ignores Low Power Mode | H (Safari) | L to M | Detect it; uncapped motion every tick, capped drift every third tick on phones; P13 only if device tests show judder or drain | P6 devices; D7 |
| R-9 | DPR-1 shimmer (about 20% max-pixel swing for 1-D motion at σ 0.7, inherent to the grid) | M | L | The 0.85 device px floor, decided by eye on a DPR-1 monitor | P6 |
| R-10 | Crossings rise above the veil commit's at the new rate | M | M | New directions before the new rate (inside P9); the cooldown starts at the reveal, at 55 s, which over a visit's first two minutes (AC-38's window; longer windows run up to about 40% higher, 6.9) meets every landed bar for P9 shares up to 0.6 but 2560 × 1440's, met up to 0.28, and P9 moves it up or down from H9's rates on the nine archived layouts; above about 90 s, a slower rate; AC-38 | P9; the veil's numbers (I8) |
| R-11 | A transient breaks 5 s (R2's 3 s fireball plus its train, say) | L | H | Fireball flights stay 1.8 to 2.5 s; the scheduler rejects longer plans; H10 asserts every kind from the config | P8 to P12 |
| R-12 | A hydration mismatch from the stored pause | L | M | `useSyncExternalStore` with a null server snapshot; the reveal remount; AC-41 | P5 |
| R-13 | `localStorage` unavailable or throwing | M | L | Every access in try/catch; the choice holds for the page view | P5 |
| R-14 | Composition wander: bright stars drift up to 328 px from the reviewed frame over a few minutes; and after pausing, scrolling and pressing Play, the hero keeps a shift of up to 0.112 × the scroll skipped (C8), until a reload | H | L | The quiet zones keep the contrast guarantees; the reviewed sky is exact at the dusk; a 150 s period shrinks the wander about 17%. If the kept shift is disliked: let `shift` relax toward 0 by a share of each step's scroll change, so the hero composition returns as the visitor scrolls back | P6 review; the user |
| R-15 | Continuous depth changes the reading composition (the brightest stars follow 11% of the scroll, not 7%) | M | L | Review in P2; no config value restores the three per-layer values, so revert P2 (depth and glide together) if disliked | P2; the user |
| R-16 | The scroll glide reads as rubber-banding: navbar links, and Home and End in most desktop browsers, smooth-scroll (`globals.css:55`), so every jump between sections ends in a glide | L | L | `CAMERA.maxLag` caps every glide at about 25 px for the brightest star at H = 900 (6.1); `maxLag` 0.15 or `scrollOmega` 12 tightens it; the kill switch `snapViewports = 0` | P2 |
| R-17 | The idle stop reads as "it stopped" | M | L | Pointer, keys and focus count as presence (P4); `FRAME.idleSleepMs` is one knob | P4, P6 |
| R-18 | Harness-only verification misses browser behavior | M | M | Every phase has browser checks and ends with a production smoke build; real devices in P6 | each phase |
| R-19 | A watchdog false positive under GPU back-pressure, a context loss or an occluded window | L | L | One timer frame per miss; a switch only after three misses in a row, undone by the 5 s probe, a context restore or a return to the tab | P3 |
| R-20 | More per-frame garbage (`quietBlend` allocations at 20 to 30 fps) | M | L | Minor GC (the veil commit adds no cache); if B-1 fails, cache the zone arrays per scroll and layout inside `quietBlend`, keeping its output (8.4's one exception for it) | P6; B-1 |
| R-21 | No test runner: later changes break the invariants unnoticed | M | M | D5 (Vitest is the low-friction option); the harness kit is reproducible from this plan | the user |
| R-22 | Satellites at 4.8 s read as slow meteors | M | L | Steady light, no tail and a constant speed tell them apart; D9 holds the realistic version | P11 |
| R-23 | Two WCAG 2.2.2 questions are unsettled: repeated short animations (#4447) and reduced motion as the mechanism (#4319, #3766) | L | M | The plan takes the conservative side of both: 5 s per transient, plus the control | none: a standing choice |

### 12.2 Open questions

1. For the user, raised by the veil session and not designed on here: should launches wait while the quiet zones ease or a layout waits (`quietEasing(t)`, or a pending layout), so no launch plans against stale zones?
2. Is 90 s still the right idle window now that pointer and keys count?
3. The DPR-1 floor (0.85 device px) for moving stars: decide by eye in P6.
4. Is the phone GPU cost within budget (B-7)?
5. Should the end bookend's twinkle (0.8) and drift (0.8) stay as today's config and R1 set them, or match the hero?
6. The thresholds are lab numbers for high-contrast targets and younger eyes (R1 §4.2). Tune v₀ by eye on a laptop, a phone and a DPR-1 monitor, ideally with an older viewer.
7. Decisions D1 to D9 and D12 (section 3).
8. Page-level 2.2.2: the gradient cards' border (`.gradient-card`, `globals.css:273-278`, used through `Card.tsx:7`) also rotates continuously under `prefers-reduced-motion: no-preference`, and the sky's control doesn't pause it. This plan leaves it out of scope. A small follow-up could pause it from the same store (a root attribute that sets `animation-play-state: paused`).

## 13. Sources

**Next.js 16.4.2 docs** (`node_modules/next/dist/docs`):

- `01-app/01-getting-started/05-server-and-client-components.md`: the `'use client'` boundary, lines 178 to 188; browser APIs need Client Components.
- `01-app/02-guides/preventing-flash-before-hydration.md`: client values and hydration errors, line 11.
- `01-app/03-api-reference/08-turbopack.md`: magic comments on `new Worker()` expressions, line 130; `turbopackWorkerAssetPrefix`, line 482.
- `01-app/02-guides/scripts.md`: the `worker` strategy is experimental and doesn't work with the App Router, line 128.
- `01-app/03-api-reference/01-directives/use-client.md`, line 10: the directive goes only where a Server Component renders the component.
- `01-app/02-guides/single-page-applications.md`, lines 205 to 221: browser-only rendering (`next/dynamic`, a `useEffect` gate, `use(browser())`).
- `01-app/02-guides/mcp.md`: `get_errors` reads the browser sessions that have the page open (lines 54 and 88); `get_logs` names the development log file, which holds browser console output and server output (line 55).
- `01-app/02-guides/testing/vitest.md`: the Vitest setup (D5).

**Node.js 24** (https://nodejs.org/docs/latest-v24.x/api/): `module.registerHooks()` in `module.md`, and DEP0205 (`module.register()` deprecated) in `deprecations.md`; type stripping in `typescript.md`.

**Accessibility and the web platform:**

- WCAG 2.2 Understanding documents:
  - 2.2.2 https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
  - 2.3.1 https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold
  - 2.3.3 https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
  - 2.5.8 https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
  - 1.4.11 https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
  - 2.4.11 https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
  - 2.5.3 https://www.w3.org/WAI/WCAG22/Understanding/label-in-name
- Techniques G4, G19, G176, G186, F16, C39 and SCR40: https://www.w3.org/WAI/WCAG22/Techniques/
- w3c/wcag issues #3478, #4921, #4319, #3766, #4447 and #5029 (R2 §9.1).
- WAI-ARIA Authoring Practices (both fetched 2026-10-27):
  - Carousel, the rotation control: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
  - Button, toggle buttons and `aria-pressed`: https://www.w3.org/WAI/ARIA/apg/patterns/button/
- React, `useSyncExternalStore` (`getServerSnapshot` during server rendering and hydration): https://react.dev/reference/react/useSyncExternalStore
- WHATWG HTML, animation frames and rendering opportunities: https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames
- MDN: `requestAnimationFrame` (IDs may wrap to 0), Optimizing canvas, and `prefers-reduced-motion`.
- Browser sources as R3 cites them: Chromium `worker_animation_frame_provider.cc`, WebKit `WorkerAnimationController.cpp` and Gecko `WorkerScope.cpp` (R3 §2.1); Skia `SkGlyph.h`, four sub-pixel positions per axis (R3 §3.3).
- Chrome, OffscreenCanvas in workers: https://developer.chrome.com/blog/offscreen-canvas
- Apple HIG, Motion and Accessibility; the Vercel Web Interface Guidelines (R4 §2.1).

**Physics, perception and astronomy** (full lists in R1, R2 and R4):

- **Motion parallax and depth:** Longuet-Higgins and Prazdny (1980), https://doi.org/10.1098/rspb.1980.0057; Rogers and Graham (1979), https://doi.org/10.1068/p080125.
- **Motion perception and attention:**
  - Abrams and Christ (2003), motion onset captures attention, https://pubmed.ncbi.nlm.nih.gov/12930472/;
  - Watson, Ahumada and Farrell (1986), the window of visibility, https://ntrs.nasa.gov/citations/19860047713;
  - Legge and Campbell (1981), McKee and Nakayama (1984), Lappin et al. (2009) and Harth et al. (2025), motion thresholds;
  - Diels and Howarth (2013), the motion-sickness band; Duncker (1929), induced motion; Howard and Howard (1994), vection.
- **Pixels and springs:**
  - CSS Values 4, the reference pixel: https://www.w3.org/TR/css-values-4/#reference-pixel
  - Motion's critically damped spring: `node_modules/motion-dom/dist/es/animation/generators/spring.mjs`, https://motion.dev/docs/spring
  - LeVeque (2007), explicit Euler stability; HyperPhysics on damped oscillators: http://hyperphysics.phy-astr.gsu.edu/hbase/oscda.html
- **The diorama:** Disney's multiplane camera, https://d23.com/a-to-z/multiplane-camera; the New Horizons parallax (arXiv 2506.21666).
- **Meteors:**
  - the IMO 2026 Meteor Shower Calendar, https://www.imo.net/files/meteor-shower/cal2026.pdf, and the IMO FAQ;
  - AMS meteor outlooks and the fireball FAQ, https://www.amsmeteors.org/fireballs/faqf/;
  - the NASA Meteoroid Environment Office on sporadic sources, https://www.nasa.gov/meteoroid-environment-office/sporadic-meteoroid-environment/, and Campbell-Brown (2005);
  - Sky & Telescope on shower radiants; the relation ω = V·sin D / q, https://arxiv.org/pdf/2112.15507.
- **Satellites and comets:**
  - NASA, Spot the Station: https://www.nasa.gov/missions/station/spot-the-station-frequently-asked-questions/
  - Sky & Telescope, the ISS entering Earth's shadow;
  - NASA on comets.

**Research reports**, for the derivations this plan only summarizes:

- `research/R1-physics-depth.md`: §3 the depth law, §4 the drift, §5 the springs.
- `research/R2-meteors-bodies.md`: §4 the window and radiants, §5 speed classes, §8 rates, §9 WCAG.
- `research/R3-rendering-engineering.md`: §2 pacing, §3 sub-pixel phases, §4 cost and the quiet index, §7 transients.
- `research/R4-design-and-history.md`: §1 the old sky, §2 the principles, §3 the checklist.

**The planner drafts and the judge's scores:**

- `drafts/plan-experience-first.md`, `drafts/plan-domain-model-first.md`, `drafts/plan-delivery-and-risk-first.md`;
- `drafts/judge-scores.md`.

They keep the longer arguments behind the judge's choices. This plan carries every body it relies on, except R2 §10's radiant functions, which are in R2. The drafts' surrounding text predates the check rounds (the domain-model draft still quotes R1's drift phases, for one), so don't build from it.
