# Plan: home-sky ambient motion and transients

## 1. Title and status

- **Status.** Planning only. No file in `src/`, configuration or tooling changes until an implementing session runs a phase from section 7.
- **Date.** 2026-10-27, written in a local desktop session. It resumes the cloud planning workflow that stopped on 2026-10-25 (`HANDOFF.md`).
- **Branch.** `claude/quirky-carson-btv2u4` (worktree `.claude/worktrees/sky-ambient-motion`). Its `src/` is identical to master 246c0aa, so every `file:line` below also holds on master.
- **Inputs.**
  - `research/00-shared-brief.md` (the user's request, verbatim) and `research/01-planning-brief.md` (the settled defaults and this structure).
  - `COORDINATION.md` (the veil session's hard constraints).
  - The research reports: R1 (physics of depth), R2 (meteors and other bodies), R3 (rendering and scheduling), R4 (motion design and the old sky).
  - The code at 246c0aa, and the Next.js 16.4.2 docs in `node_modules/next/dist/docs`.
- **How this plan was made.**
  - Three planners wrote complete drafts: `drafts/plan-experience-first.md`, `drafts/plan-domain-model-first.md` and `drafts/plan-delivery-and-risk-first.md`.
  - A judge scored them (`drafts/judge-scores.md`), took the domain-model-first draft as the base, grafted the best parts of the other two, and resolved every conflict. Where it matters, the reason is given in place.
- **Veil-session dependency.** The meteor-veil session ("Star and comment animation redesign") owns `veiledFrom`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the `layout` handler) and the worker's `scroll` handler. Its fix was meant to land first.
  - As of 2026-10-27 it has not landed. `origin/master-r26syw` holds only an `.env.example` commit, and its final plan and numbers never arrived.
  - So phases P0 to P7 and P13 avoid every veil-owned function and can proceed now, on an integration branch that reaches master at V (once we have rebased onto the veil commit), after PF, or earlier with the veil session's agreement (7.0).
  - Phases P8 to P12 are blocked on the veil commit (the planet in P12 excepted). If that work never lands, they run after the fallback PF, which only the user can start (section 8.7).
- **Evidence labels.**
  - **[computed]** marks numbers recomputed for this plan with Node 24 scripts in the session scratchpads. Those scripts are not in the repository, and the formulas are in the text.
  - **[R1]** to **[R4]** point to the research reports for derivations and primary sources.
  - `file:line` cites the worktree at 246c0aa.

**The plan at a glance.**

- **One camera moves the whole sky.** Every star moves by its own nearness times the camera, so scrolling, the new slow drift and an optional lean toward the pointer can never disagree about depth.
- **Nearness comes from brightness.** Brighter is nearer, as with identical lamps, so the faint majority stays almost still and the bright few float.
- **The drift is a closed-form path of a clock.** Three circles ride on each other. That keeps it smooth at any frame rate and bounded, so nothing needs wrapping. It eases in as the stars come out at dusk.
- **Moving stars are drawn from quarter-pixel sprites.** The sprites are pre-rendered, and frames land on the display's refreshes only as often as the stars' speed needs.
- **A navbar control pauses all sky motion** (WCAG 2.2.2).
- **Then, once the veil work lands, one scheduler runs every short-lived event.** Shooting stars come from realistic directions about 3.5 times as often, followed by fireballs and satellites. One ink lease means only one of them can ever light up near the copy.

**How to read this.**

| Section | Contents |
|---|---|
| 2 | The result |
| 3 | The choices left to the user |
| 4 | The model everything else follows from |
| 5 and 6 | The design |
| 7 | The phases an implementer follows |
| 8 | The coordination with the veil session |
| 9 to 11 | How "done" is checked |

### 1.1 Deviations from the planning brief

Each deviation was argued in at least one draft and accepted by the judge, or came from a check round (the check log).

| # | Deviation | Reason |
|---|---|---|
| 1 | The drift eases in over 3 s from the **dusk** (the loader starting to lift), not from the reveal. | The stars come out already moving, and the ease ends at 6.0 s after load, as the side rails finish fading in, so no motion begins after the visitor starts reading. R3 §6 multiplies the drift by the dusk ramp, and R4 §2.4 says "ease in with the dusk emergence ... Never start it later". A motion onset captures attention (Abrams and Christ 2003). |
| 2 | The epicycle **phases** become (0.70, 0.00, 2.09) instead of R1's (0.9, 2.4, 4.7). Ratios, shares, period and speed are unchanged. | R1 left the phases "to review" (R1 §9). Its phases start the stars moving 61° upward, the old sky's direction, and keep them within 30° of level for only 16 of the first 60 s. The new phases keep them within 30° of level for 53 of those 60 s, drifting right. The exact wander bound grows from 190.9 to 205.2 px at q = 1 [computed]. |
| 3 | When motion stops or comes back (the pause control, a reduced-motion switch), one **motion level** eases the drift and twinkle out or in over 0.3 s (a smoothstep), instead of R3's immediate stop. | Today, turning reduced motion on drops every twinkling star to its resting brightness in one frame. A near star one standard deviation into its twinkle is 11 to 22% off its rest (`LAYERS.near.twinkleSigma`). The pause control makes that switch common. 0.3 s keeps R4's AC-27 within rounding: the brightest star at peak speed moves 1.02 px after the switch [computed]. |
| 4 | **No `FrameClock` module** (R3 §2.1). The pure pacing policy goes to `src/lib/sky/pacing.ts`. The `requestAnimationFrame` and timer handles stay worker variables. | The veil-owned `scroll` handler reads `rafId` and `timerId` directly (`sky.worker.ts:469`). Moving them into a module would force an edit inside that handler. |
| 5 | On WebKit's unaligned 15 ms worker clock, the drift's caps still apply: an iPhone draws every third tick (22.2 fps). Uncapped motion (meteors, scrolling) still draws every tick there. | R3 §2.3 says to use k = 1 because dividing the clock "would beat against the screen". At phone drift speeds that beat moves a star about a third of a 0.37 device px step, which is invisible. Drawing at 66.7 Hz would bypass the battery cap that narrow screens exist for. |
| 6 | The pause control follows the **W3C APG carousel's rotation control**: its name changes with the action ("Pause sky animation" or "Play sky animation") and it has no `aria-pressed`. R2 proposed an `aria-pressed` toggle; R4 proposed both together. | The APG's rotation control is the W3C's own pattern for a button that starts and stops automatic motion, and since its label changes it carries no `aria-pressed`; the APG Button pattern calls R4's combination wrong, because a toggle's label must not change with its state (6.8 quotes both; fetched 2026-10-27). The glyph and the name then both state the action. |
| 7 | **Only a pause is stored.** Pressing Play under prefers-reduced-motion lasts for the page view. | A stored "playing" could override a reduced-motion setting the visitor turns on later. The brief's "paused by default under reduced motion, remembered per viewer" still holds. |
| 8 | The **scroll cancel** is evaluated in the transient scheduler's tick, for every kind. It calls the veil session's agreed kind-agnostic helper, not code inside the `scroll` handler. | It gives one rule for every kind, testable without the DOM. It never edits the veil-owned handler before the rebase, and it makes the fallback PF possible without taking over that handler. |
| 9 | Fireball flights stay **1.8 to 2.5 s** (R2 proposed 1.8 to 3 s). | A 3 s fireball with its 2.4 s train lasts 5.4 s from first light to last, which breaks the 5 s rule. Today's 2.5 + 2.4 = 4.9 s passes [computed]. |
| 10 | `wrapCell`, `FIELD_PERIOD` and R3's wrapped per-layer accumulators are **dropped**. A one-comparison key-range guard stays. | The drift is bounded, and the scroll term grows by at most one page's scroll range per pause cycle (section 6.5), so no offset nears the key range short of thousands of pause cycles. The guard turns that pathological case into "no stars" rather than wrong ones. |
| 11 | The **crossing cooldown** starts at 55 s, from P9 (0 in P8, which launches exactly as today). Its acceptance criterion is "copy crossings per minute at or below today's" over the same window (a visit's first two minutes), on captured layouts, and it is retuned up or down from the crossing share measured there (6.9). | With R2's synthetic crossing shares (16 to 19% of flights), 55 s gives 0.518 to 0.578 crossings a minute over a visit's first two minutes, against today's 0.576 over the same window (0.50 in the steady state), so it sits on the line: 6.9 gives the cooldown each share needs [computed]. |
| 12 | R4's acceptance items AC-4, AC-7, AC-10, AC-11, AC-15, AC-20, AC-21, AC-24, AC-27 and AC-30 are **amended**, and AC-35 to AC-41 are added. | R4 wrote them for an unbounded straight drift, a 0.25 px step, a 12 to 18 s gap, no climbing and 40 s satellites. The brief settled R1's epicycles, R3's 0.5 px step, R2's rates and the 5 s rule. AC-30 covers quiet copy only, because reading copy has no quiet rects (D2). Section 9 gives each new threshold and its reason. |
| 13 | **Additions** beyond the brief. | Each closes a gap the drafts or the check rounds found. In order of the list:<ul><li>a `presence.ts` model module (one tested presence gate);</li><li>the camera's scroll shift, so a resume never jumps;</li><li>the rest rule, F6 and C5, which fixes two wake-up bugs found by simulation;</li><li>the navbar showing itself when focus enters it and staying while it holds keyboard focus (WCAG 2.4.7, 2.4.11), because the new control sits in a header that slides fully off-screen (`Navbar.tsx:79`);</li><li>the control appearing only while a sky runs;</li><li>satellites' first appearance at 30 s + Exp(60 s), capped at 150 s, which makes R2's "first after 30 s, about 30-40% in the first minute" concrete (39%);</li><li>a lag cap on the scroll spring (`CAMERA.maxLag`) that holds it at its steady trail, because every jump on this site smooth-scrolls in small steps and never snaps (6.1);</li><li>stars snap to today's whole pixels only until the sky first moves in a page view, not whenever motion is reduced, so a pause never hops them by half a device pixel; only the first Play after a still load settles them once (M1).</li></ul> |
| 14 | The shower radiant sits on screen on 15% of **desktop** visits, never on phones. | Nearly all of a phone's spawn area lies within 25° of any on-screen radiant, where paths are too short for anything but stubs: phone visits with an on-screen radiant failed 31% of launch attempts (one aim each), and every shower meteor they did launch was a stub [computed, check report]. |

## 2. The end goal, worked backwards

Everything in this plan exists to make the scenes below true. Section 2.5 turns them into requirements, and section 9 into checks.

### 2.1 The first minute on the hero (a laptop: 1440 × 900 CSS px, DPR 2, 60 Hz, nothing touched)

About 300 stars are on screen: about 15 bright ones, 70 of middle brightness and 215 faint ones (shares 5.1, 23.5 and 71.5%, R1 §3.1).

| Time after load | What the visitor sees | What makes it so |
|---|---|---|
| 0 to 3.0 s | The loader. | `IntroGate.tsx`, `duration.loader` (`animations.ts:36`), unchanged |
| 3.0 s | The loader starts to lift and the dusk begins: the brightest stars come out first and the faint dust follows over about 1.3 s, with the haze glowing in by 5.3 s. The stars are **already drifting, from zero speed**, so the motion never "starts": it grows as they appear. | `EMERGENCE` (`config.ts:164`); the drift eases in from the dusk (6.1) |
| 3.75 s | The page is revealed. The hero copy rises in and settles by about 5 s, and the navbar drops in, the pause control last. | `IntroGate.tsx:54`, `:94-100`; `Navbar.tsx` stagger |
| 5.25 to 6.0 s | The side rails fade in. | `SidePane.tsx:26` (delay 1.5 s, `duration.entrance` 0.75 s) |
| 6.0 s | The drift reaches full speed. The bright stars glide right at about 3 CSS px/s; the faint majority creeps at under 1 px/s, still unless you stare. The bright stars slide **over** the nearly still faint ones, so the sky separates into depth: a window, not wallpaper. | one camera; depth from brightness (6.1) |
| 6 to 63 s | The glide heads right and arcs slowly. Measured from the dusk, the heading is 19° up-right at 5 s, level by about 15 s, 7° down-right at 30 s, 16° at 45 s and 52° at 60 s; the speed swells to 1.18 times its nominal speed and eases to 0.68 times it. It never stops, never reverses and never bobs [computed]. | the phases chosen for the first minute (6.1) |
| 8.25 to 10.75 s | The first shooting star, as today: it lights up in open sky, streaks for about a second, cools to a mint wake and burns out, sometimes fading as it passes behind the headline's padding. | `METEOR.firstDelay` (`config.ts:237`); the veil |
| by 60 s (after P9) | About **five** shooting stars (median 5, and 3 to 6 in about 90% of simulated visits), against 2 today. About 3 in 4 fall, some slant sideways and the odd short one climbs. About 4 in 10 come from the visit's shower, so several fan out from one patch of sky. They differ in speed and color: quick ones with mint wakes, slow warm ones, white ones in between. They differ in brightness too, as real ones do: on average about 0.6 of today's peak, about 1 in 8 faint, and those high in the window nearly as bright as today's (6.10). Never two near the copy at once. | the population model (6.10); the ink lease (6.9) |
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
| End bookend (Contact and footer) | The sky brightens back (stars 0.9, haze 0.7), twinkles again (0.8) and drifts at 0.8. No transients unless the "farewell meteors" could-kind ships (D4). |
| A phone (393 × 852, DPR 2) | About 108 stars, mostly dimmed near the copy. The drift clock runs at 0.6, so the near stars move about 1.7 CSS px/s, which looks like 3 arcmin/s on a phone (R1 §4.2). At most 30 frames a second, typically 20. After P9, shooting stars come every 21 s on average, at most 6 a visit. There are no fireballs, satellites or lean. The pause control sits beside the menu button. |
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
- **A one-lane bridge.** The copy's contrast budget has room for one light at a time. Only one transient may cross near the copy at once (it holds the ink lease); everything else takes the clear-sky road, and after a crossing the bridge rests for a while.

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
| E4 | Smooth at the pixel | Quarter-pixel phases; a true step of at most 0.5 device px per drawn frame; motion on display refreshes | 6.2, 6.3 | AC-10 to AC-13 |
| E5 | The copy stays calm and readable | Exact quiet factor per star per frame; one lit transient near copy; crossings at today's level | 6.4, 6.9 | AC-16, AC-30, AC-38 |
| E6 | Shooting stars feel real and frequent | Median 5 in the first minute; varied radiants with a visible shower; light up and burn out in open sky | 6.10 | AC-18 to AC-23 |
| E7 | Rare treats | Satellite attempt in 39% of first minutes; fireballs about 1 per 5 to 10 minutes | 6.10, 6.11 | AC-24, AC-37 |
| E8 | Reading is calm | Drift 0.35 ×, twinkle 0, no transients | 6.7 | AC-15 |
| E9 | Phones are calmer and cheap | Clock 0.6 ×; at most 30 fps of drift; at most 6 meteors a visit; no fireballs or satellites | 6.1, 6.2, 6.9 | AC-14, AC-20 |
| E10 | The visitor is in control | Pause stops everything within 1 s, persists, resumes in place; reduced motion is still | 6.6, 6.8 | AC-26 to AC-28 |
| E11 | Nothing jumps | Hidden tab, idle, resize, DPR change, scene change, pause and resume (one sub-pixel settle on the first Play after a still load, M1); snap only beyond one viewport of scroll | 6.1, 6.6 | AC-9, AC-27, AC-32, AC-34, AC-39 |
| E12 | Light on the battery | 0 frames idle, hidden or paused; about 1% of a laptop core while drifting | 6.2, 10 | AC-14, AC-33 |
| E13 | Accessible | WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3, 1.4.11, 2.4.11, 2.5.3, 2.5.8 | 6.8, 11 | AC-26 to AC-31, AC-41 |

## 3. Decisions for the user

Each decision has a recommended default, and the plan is written for the defaults. Every phase starts on the defaults; the "Affects" column names the phases a decision changes. Only D4 (before each could kind in P12) and D10 (before PF) must be answered first.

| # | Decision | Recommended default | Alternatives and their cost | Affects |
|---|---|---|---|---|
| D1 | **The pause control: placement, pattern, persistence** (required before the drift ships, WCAG 2.2.2) | **Placement and look.** In the navbar, at the top of the page: visible on load, on any upward scroll and whenever focus enters the header (it slides away with the header while the visitor scrolls down). Last in the row after Resume on desktop, beside the menu button on phones (out of the tab order while the open phone menu covers it). It is a 40 × 40 px icon button, green like the menu button.<br>**Pattern.** The APG rotation control: the name says the action and changes with it ("Pause sky animation" / "Play sky animation"), the glyph shows the action (two bars or a triangle), and there is no `aria-pressed`.<br>**Persistence.** A pause is remembered in this browser. It starts paused under reduced motion, and Play there lasts for the page view.<br>**Visibility.** It shows only while a sky is running. | (a) **Hero corner** (bottom right): "adjacent to the moving content" (G186), but it scrolls away with the hero, and the file then needs `'use client'` because `Introduction.tsx` is a Server Component.<br>(b) **Footer**: the weakest for G186, which asks for the top of the page or next to the motion.<br>Both (a) and (b) put the control inside a `data-sky-quiet` root: keep the attribute (AGENTS.md), keep the control's entrance inside the 1.5 s re-measure (`ENTRANCE_SETTLE_MS`, `mountSky.ts:47`), and count it as one more quiet rect of the 64 (`mountSky.ts:37-40`).<br>(c) **Inside the phone menu**, with a visible text label: less discoverable.<br>(d) **An `aria-pressed` toggle** with the constant name "Pause sky animation": a valid APG pattern, but the pressed state then needs its own visual of at least 3:1 (a 10% mint fill is only 1.28:1 [computed]).<br>(e) **A stored Play that overrides reduced motion on later visits**: it could override a setting the visitor turns on later. | P5 |
| D2 | Drift while reading | 0.35 of the hero rate (R1 and R4 agree) | 0: today's still reading sky, and the worker sleeps while reading (it saves about 20 frames a second there). 0.2: in between. 0.5: livelier; the brightest star reaches 3.4 px/s at its peak.<br>At any rate above 0, stars at the reading levels (alpha up to about 0.25, like today's still ones) slide behind body text, because reading copy has no quiet rects. To reduce that: lower the reading star levels while drifting, or quiet the reading copy (the veil session's rect measurement and its 64-rect cap, so an interface request). AC-30 checks the chosen option. | P6 |
| D3 | Pointer lean (desktop, fine pointer, hero only, full motion) | Ship P7 with a reach of 12 CSS px at nearness 1 (R1): ±19 px for the brightest star, ±3.5 px for the faint majority | Reach 7, which is R4's 2, 4 and 7 px per layer under the same law, so subtler. Reach 10 (the iOS motion-effect size for the near band). Or skip it: the drift alone carries the depth. Never device orientation. | P7 |
| D4 | Which "could" transients ship | None in v1. First candidates afterwards: the near-radiant point flash (cheap, and it completes the on-screen radiant), then bursts, then two end-bookend "farewell" meteors | Earthgrazers (wide screens only). A static comet (1 visit in 10) or a planet: both change the reviewed composition and need a review, and a comet can read as a rendering bug. Each is a small, separate phase (6.12). | P12 |
| D5 | A test runner | None in the repository. Verification uses scratch harnesses that load the real modules (7.1) and an uncommitted debug patch, kept as evidence in each PR description. | Vitest: one dev dependency and a config file; it resolves `@/` and extensionless imports through Vite and can run the harness checks in CI. `node --test` with type stripping: no dependency and no source change; the 12-line resolve hook from 7.1 is committed beside the tests (`node --import ./register.mjs --test`). | none |
| D6 | The drift speed v₀ (and its opening heading) | 3 CSS px/s at nearness 1; phases (0.70, 0.00, 2.09) | 2.5: subtler, the same frame cost. 3.3: the most that keeps a DPR-2 laptop on a 60 Hz screen at 30 fps. 4: more obvious; the brightest stars reach about 12 arcmin/s at their peak, the edge of busy, and a DPR-2 laptop needs every frame (60 fps). Rotating all three phases by one angle turns the opening heading (the first-minute headings change, never the speed, turn-rate or bound figures). | P6 |
| D7 | The WebKit main-thread frame relay | Ship without it, then decide after iPhone and macOS Safari tests (P13). | Build the relay (about 40 lines across `mountSky.ts`, the protocol and the worker) if the tests show judder (about 4.5 jolts a second) or a Low Power Mode drain. It couples the sky's frames to main-thread jank. | P13 |
| D8 | Climbing meteors | Allowed as the physics gives them, but only from sporadic sources and at most 0.6 of the longest path, so about 7% of launches climb (R2's soft guard) [computed]. The user asked for "different directions" and "more realistic". | Forbid any path more than 10° above horizontal (R4: a rising streak "reads as a firework"; the old sky's rising path was a fault). That rejects about 13% of candidates, and the planner resamples. | P9 |
| D9 | Satellite pass length | At most 4.8 s, at 1.2 to 2.5°/s: 2 to 5 times a real pass at the window's 40° centre (about 0.5°/s, R2 §6.1), inside the 5 s rule every transient keeps | Realistic 0.5 to 1°/s and up to 20 s, which the pause control would allow. But it breaks the "5 s or less" rule that the veil session's WCAG reasoning relies on, so it needs that session's agreement. | P11 |
| D10 | When to stop waiting for the veil commit | When P7 is merged (or skipped) and the veil commit still hasn't landed, ask the user (CP-4, then weekly until V or PF): keep waiting, run the fallback PF (8.7), or merge P1 to P7 early (alternatives). Recommended answer: keep waiting while the veil session answers CP-4's status query or its edits in the main checkout keep changing (CP-1's last-write times); run PF once it has done neither for a week, or the user knows it has stopped. | Merge P1 to P7 to master early, with the veil session's agreement (7.0): the drift ships now, but the veil session must first commit or stash its uncommitted work, update its local master and resolve conflicts in the sky files both plans change, mid-work; P8 onward still waits. Set a date instead. Or wait indefinitely, which keeps all transient work blocked. | P8 |
| D11 | Ship satellites before the veil boundary | No: every transient phase follows the veil commit, as the brief orders and the veil session asked | The delivery draft's plan: satellites before the veil, clear sky only, near-layer keeps, with our own interim scroll cancel. That delivers part of the second request earlier, but it duplicates the cancel rule, needs glue to space satellites from the veil-owned meteor clock, and needs the veil session's agreement. | P11 |

## 4. Domain model

Everything in sections 5 to 7 follows from this section. Each entity has one owning module, and each invariant has one place that enforces it.

### 4.1 Who owns what

```
 MAIN THREAD (src/components)                                WORKER (src/components/sky worker files; import only @/lib/sky/*)
 ┌──────────────────────────────────────────────────┐        ┌───────────────────────────────────────────────────────┐
 │ skyPause.ts        Playback: the visitor's pause, │ motion │ sky.worker.ts  orchestration: state, messages, tick;   │
 │                    reduced-motion default, "sky   │ ─────► │                MotionLevel, Camera, Presence and       │
 │                    running" flag                  │ scroll │                TransientSchedule instances; the frame  │
 │ SkyPauseToggle.tsx the control (UI)               │ layout │                handles (rafId, timerId, watchdog)      │
 │ mountSky.ts        DOM events -> messages: size,  │activity│ renderSky.ts   StarField, placePoint, drawLayer,        │
 │                    scroll, layout, activity,      │pointer │                drawTransient, drawMeteor (veil)        │
 │                    pointer, motion                │ ─────► │ skyAssets.ts   StarAtlas with phase sprites            │
 │ Navbar.tsx         hosts the control              │ ◄───── │                                                        │
 └──────────────────────────────────────────────────┘ ready  └───────────────────────────────────────────────────────┘
 src/lib/sky (DOM-free model; runs in the worker; the main thread imports only its types and color.ts)
 ┌───────────┬────────────┬───────────┬────────────┬─────────────┬───────────────┬───────────────┬──────────────────┐
 │ config.ts │ catalog.ts │ camera.ts │ pacing.ts  │ presence.ts │ quietIndex.ts │ transients.ts │ radiants.ts      │
 │ every     │ Star (q),  │ Camera,   │ FrameDemand│ Presence    │ QuietIndex    │ Transient,    │ SkyWindow,       │
 │ tunable   │ DepthLaw,  │ Spring,   │ divisor,   │             │ (wraps the    │ TransientSpec,│ Source, VisitSky,│
 │           │ layer bands│ DriftClock│ RefreshEst.│             │ veil's math)  │ Schedule,     │ SpeedClass, aim  │
 │           │            │           │            │             │               │ InkLease      │ satellites.ts    │
 ├───────────┴────────────┴───────────┴────────────┴─────────────┴───────────────┴───────────────┴──────────────────┤
 │ scene.ts    SceneLevels, sceneAt, sameRects (ours) │ screenQuietZones, quietAt, inkAt, quietFactor,             │
 │                                                    │ easedQuietFactor (veil)                                    │
 │ meteors.ts  Meteor, light curve, drag (shared) │ veiledFrom, planFlight, planMeteor (veil; Flight and Aim types │
 │                                                │ added by us after the rebase)                                  │
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
| **Camera** | The one viewpoint: an offset C in CSS px for a star at q = 1, the sum of a scroll part, a drift part and a lean part | `camera.ts` (`Camera`, `stepCamera`, `cameraOffset`) | C1 to C8 | the worker; `renderSky.ts` as `SkyFrame.camera` |
| **Spring** | One critically damped axis (value, velocity), stepped in closed form | `camera.ts` (`springStep`) | SP1 | Camera only |
| **DriftClock** | The drift path's own time τ (s); the drift offset is a pure function of τ | `camera.ts` (`Camera.clock`, `driftAt`) | D1 to D3 | Camera only |
| **SceneLevels** | Multipliers for the scroll narrative: stars per layer, haze, twinkle, and new drift and lean levels, plus the launch gate | `scene.ts` (`sceneAt`) | SC1 | the worker |
| **Presence** | Whether the visitor seems to be here: last input, last return from idle | `presence.ts` | P1 | the worker |
| **MotionLevel** | 0 to 1: how much motion the preference allows right now, easing over `FRAME.motionEase` when it changes | the worker (`motionLevel`), from `FRAME` | M1 | twinkle, drift rate |
| **Playback** | The visitor's pause choice: paused by default under reduced motion, a pause remembered, Play under reduced motion for the page view | `skyPause.ts` (main thread) | PB1 to PB4 | `SkyPauseToggle.tsx`, `mountSky.ts` |
| **MotionMode** | `SkyMotion`: `'full' \| 'reduced' \| 'off'`; `'reduced'` now also means paused | `protocol.ts` (type), `mountSky.ts` (derives it), the worker (obeys it) | PB3 | the worker |
| **FrameDemand** | What one part of the sky needs from the clock: frames per second, whether they must land on display refreshes, and a cap | `pacing.ts` | F1, F3 | the worker |
| **FrameClock** | When the worker wakes and whether it draws. The policy (divisor and hysteresis, `frameDue`, the refresh estimate) is pure. The mechanism (the `rafId`, `timerId` and watchdog handles) stays in the worker because the veil-owned `scroll` handler reads them. | `pacing.ts` (policy), `sky.worker.ts` (mechanism) | F2, F4 to F7 | the worker |
| **QuietZones** | Padded quiet rects on screen, easing from the previous layout (`QuietBlend`) | veil: `scene.ts` math, the worker's `quietBlend` | (veil-owned) | QuietIndex, `drawMeteor` |
| **QuietIndex** | Per-tile buckets of the quiet zones, giving every star its exact quiet factor cheaply | `quietIndex.ts` | Q1, Q2 | `renderSky.ts` |
| **StarField** | The cache of generated cells, evicted by frame stamp | `renderSky.ts` (`createStarField`) | SF1, SF2 | `drawLayer` |
| **StarAtlas** | Point-spread sprites per tint, shape and quarter-pixel phase, plus the meteor head | `skyAssets.ts` | A1 | `placePoint` |
| **Transient** | A short-lived sky event: an envelope (kind, lifetime, ink lease, launch scroll, cancel) around its kind's body (`Meteor`, `SatellitePass`) | `transients.ts` | T1 to T7 | the worker, `renderSky.ts` |
| **TransientSpec** | How one kind is timed and planned (first delay, next attempt, plan, lifetime, moving, narrow screens) | `transients.ts` (one registry); each kind's module supplies its planner | T1, T3 | the scheduler |
| **Scheduler** (`TransientSchedule`) | The active transients and each kind's next attempt: it launches, retires and cancels | `transients.ts` | T1 to T7 | the worker |
| **InkLease** | The right to plan light onto quiet copy. Not an object: it is held by whichever active transient has `nearCopy`, so it can't leak or go stale. | `transients.ts` (`inkLeaseFree`) | T2 | the scheduler |
| **LaunchGate** | Whether and where transients may launch this tick (motion, visibility, presence, scene, scroll quiet, field) | `transients.ts` (type), the worker (fills it) | T6 | the scheduler |
| **GapLaw** | floor + Exp(mean), capped: one law for every kind's clock | `config.ts` (type), `transients.ts` (`nextGap`) | T5 | the specs |
| **SkyWindow** | The screen as a pinhole window on the sky: 60° across the longer side, the centre 40° above the horizon | `radiants.ts`, `config.ts` (`SKY_WINDOW`) | R3 | meteor and satellite planning |
| **Radiant, Source** | A unit direction in the window's frame, its scatter and speed class; each visit has one shower source and three sporadic ones (`VisitSky`) | `radiants.ts` | R1, R2 | meteor planning |
| **SpeedClass** | slow, medium, fast: angular speed, duration, wake color, whether a train is possible | `config.ts` (`SPEED_CLASSES`) | R3 | `radiants.ts`, `drawMeteor` |
| **SatellitePass** | A steady point on a straight line with its fades | `satellites.ts` | T1, T3 | `renderSky.ts` |

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
| C4 | Frame-rate independent: one spring step of dt equals two of dt/2, and the lag cap leaves the spring at its steady trail (6.1), so the glide after the page stops is the same at any frame rate (30, 60 and 144 Hz within about 0.1 px for the brightest star [computed]). Only the one-step snap (C5) depends on the rate, by design: it compares steps, so at 30 Hz it fires above 27,000 px/s on a 900 px screen, where nobody can follow the stars. | code: `springStep` in closed form, the cap's velocity; harness H5 (difference 0 for the spring) |
| C5 | No jumps. Scene, presence, the motion level and the dusk ease change only the drift clock's **rate**, never its position. The clock advances at most `DRIFT.maxStep` per step. After a rest, a sleep or a hidden tab, the next step has dt 0; otherwise a 100 px scroll after a minute at rest would land in one frame (11.2 px for the brightest star, simulated). The scroll part snaps only when one step changes its goal by more than one viewport (a jump, never a fling or a smooth-scrolled jump), and trails its goal by at most `CAMERA.maxLag` viewports (6.1). | code: `stepCamera` (`lastGoal`, the lag cap), `forgetStep` |
| C6 | The springs follow their targets only under full motion; otherwise they hold, with no velocity. The drift eases out with the motion level. | code: `CameraInput.follow`; the drift rate |
| C7 | The camera starts at rest on the restored scroll, so the first frame neither glides nor jumps. | code: `createCamera(scrollY)` |
| C8 | Resuming full motion continues from where the camera is: the scroll it skipped while stopped joins `shift`, so neither a glide nor a snap follows the next scroll. The decided trade-off: the offset is kept for the page view, so after scrolling while paused the hero shows a shifted patch of sky until a reload (R-14). | code: `resumeCamera` |
| SP1 | Critically damped: from rest, a spring following a scroll that moves one way never passes its target (its impulse response is never negative); a scroll that reverses just before it stops can carry it a few px past, then back (at most about 2.5 px for the brightest star). It settles exactly on the target once less than `CAMERA.restPx` of motion is left. When the lag cap binds, it sets the spring to its steady trail at that lag, from which the glide never passes the target at any frame rate (6.1) [computed]. | code: `springStep`, `settle`; harness H5 (overshoot 0 from rest with 250 ms steps) |
| D1 | The drift clock never runs backward; its rate is in [0, 1]. | code |
| D2 | The rate is 0 unless motion is (or is easing out of) full, the dusk has begun, the software-raster budget allows drift, and the scene drifts. | code: the worker's `driftRate` |
| D3 | The rate eases in over `DRIFT.ease` from the dusk and is the product of smooth factors, so the drift speed never changes in one frame. | code: `driftRate` |
| SC1 | Scene levels are continuous in scroll and need no clock. | code: `sceneAt` (unchanged mixing) |
| P1 | Any input (scroll, pointer, keys, focus, a return to the tab) resets idleness. Levels ease both ways over `FRAME.idleFadeMs`, and after `idleSleepMs` the ambient motion is 0. | code: `presenceLevel`; harness H11 (bit-identical to today's `idleTwinkle`) |
| M1 | The motion level eases between 0 and 1 over `FRAME.motionEase` when the preference changes. Stars snap to whole pixels only while the sky hasn't moved in this page view (a load under reduced motion or paused); after that, a pause, a reduced-motion switch or Play keeps every star at its quarter-pixel phase, so none hops by up to half a device pixel. The one exception, accepted: the first switch to full motion after a still load moves each star once, as the motion starts, from its whole pixel to its phase (at most half a device pixel per axis, 0.71 diagonally). | code: the worker's `motionLevel` and `skyMoved`, `SkyFrame.snap` |
| PB1 | Paused when the visitor paused (remembered), or when reduced motion is on and they haven't pressed Play in this page view. | code: `skyPaused` |
| PB2 | A storage failure never breaks the page; the choice then lasts for the page view. | code: try/catch in `skyPause.ts`; harness H12 |
| PB3 | One stillness pipeline: paused is motion `'reduced'` in the worker. | code: `mountSky`'s `motion()` |
| PB4 | The control renders only while a sky is running, and never during server rendering or hydration. | code: `skyPlayback` returns null; `setSkyRunning` |
| F1 | Anything that moves draws on animation frames, never on a timer (a stalled clock's fallback aside, F5). | code: demands with `vsync: true` |
| F2 | Each drawn frame stays up for the same whole number k of refreshes. On WebKit's unaligned 15 ms clock, uncapped motion draws every tick and capped drift every ⌈66.7 / cap⌉-th tick. | code: `refreshDivisor`, `stepDivisor`, `frameDue` |
| F3 | While stars move: at least `PACING.minFps` and at most `PACING.stepPx` device px per drawn frame, within the demand's cap. | code: `motionFps`, `refreshDivisor` |
| F4 | Nothing moving or changing means no frames, except one timer for the next due transient. | code: the worker's `schedule` |
| F5 | A missing or stalled worker animation-frame clock is answered by a timer within `PACING.watchdogMs`. After `watchdogStrikes` misses in a row the clock moves to a timer armed against the last drawn frame (so messages never push it back), which asks for one animation frame every `PACING.reprobeMs` and returns to them when one arrives. | code: the worker's `requestFrame` and watchdog |
| F6 | A level that eases in from 0 (twinkle, drift) demands frames from the moment it heads up, not once its value passes 0, so a sleeping worker never misses its own wake-up. Today's `frameMode` does this for twinkle (`sky.worker.ts:124`). | code: `driftWanted`, `twinkleDemand`; harness H13 |
| F7 | When the camera comes to rest, or the motion ease ends, one more frame is drawn, so the resting sky (with no trace of twinkle once stopped) is what stays on screen. | code: `updateCamera` and `settleMotion` set `needsDraw` |
| Q1 | `QuietIndex.factor(x, y, keeps)` equals `easedQuietFactor(blend, x, y, keeps)` bit for bit, as long as no zone reaches farther than `QUIET_REACH`. | code; harness H3 (difference 0) |
| Q2 | The index serves stars only; meteor planning and drawing keep the full checks. | code: only `drawLayer` uses it |
| SF1 | Cells in use are never regenerated; unused cells are evicted only when the cache holds more than twice the cells in use. | code: `StarField` stamps |
| SF2 | Cell keys are injective within ±32,768 cells, and outside that range a cell holds no stars (never a key collision). | code: `StarField.cell` guard |
| A1 | Phase (0, 0) sprites are byte-identical to today's sprites, and every phase of a sprite carries the same total light within 0.6% before rounding and 2.5% after it, at any DPR (sprites keep today's sizes, so a shifted Gaussian loses a little tail at one edge): far under what anyone sees (R4 allowed 5%). | code: the separable painter, normalized by the phase-0 peak; harness H1 |
| T1 | Every transient lasts at most `TRANSIENTS.maxLife` (5 s) from first light to last, wake, train and fades included. A cancel never extends a life: a transient retires at the earlier of its lifetime and its cancel fade's end. | code: the scheduler rejects longer plans; harness H10 |
| T2 | At most one active transient holds the ink lease (`nearCopy`), and a new lease begins only `crossingCooldown` after the last one began. Until the veil session agrees to I9, no transient that never takes the lease is active beside a lease holder (6.9). | code: `inkLeaseFree`; the launch step, which also counts a plan with `nearCopy` after `mayCrossCopy: false` as failed |
| T3 | A kind that may reach quiet copy is planned through the veil checks. A kind that never takes the lease is planned at least `QUIET.feather` clear of every padded rect, and drawn with zero light inside any padded rect, old or new, even mid-ease. | code: each spec's `plan`; its drawer, through `clearSkyFactor` (the stricter of the two eased zone sets) |
| T4 | Every transient obeys the scroll cancel (`launchScrollY`) and the pause. | code: `updateTransients`, `cancelTransients` |
| T5 | Onsets are at least `TRANSIENTS.minOnsetGap` apart. At most 3 flashes per second. No saturated red: R / (R + G + B) < 0.8. | code: the launch step; config review (the warmest drawable tint is 0.42) |
| T6 | Launches only in the hero, under full motion, visible, revealed, present and settled; narrow screens at most `narrowLimit` per visit. | code: `LaunchGate`, the launch step |
| T7 | One transient of each kind at a time. | code: the launch step |
| R1 | A visit's sources stay fixed until a resize, a change of the quiet rects, or a launch none of whose aims fits re-picks them (a hidden tab keeps them), and every visit's shower can yield paths, on screen or off. | code: `forgetVisitSky` (resize, changed rects); `planMeteorTransient` (a failed launch, as today's loop drops a failed radiant); `pickVisitSky` (one usability test for both branches) |
| R2 | A path climbing more than `RADIANTS.climbDegrees` comes only from a sporadic source and is at most `climbShare` of the longest path (D8: or no path climbs more than 10°). | code: `visitAim` |
| R3 | A meteor's speed and length follow the window geometry: short and slow near its radiant, longest 90° away, slower and dimmer low in the window. | code: `radiantMotion`, `meteorRange` |

### 4.4 Ownership across the two sessions

- **Ours, from P1.**
  - Config: `DEPTH`, `CAMERA`, `DRIFT`, `LEAN`, `PACING`, `STAR_PHASES`, `FRAME.motionEase`, and the `drift` and `lean` scene levels.
  - Model: `catalog.ts` nearness; `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`.
  - Drawing: `drawLayer`, `StarField`, `placePoint`, the atlas.
  - Scheduling: `frameMode`, `schedule` and `tick`, which become `frameDemand` plus the pacing policy.
  - Worker handlers: `init`, `motion`, `visible`.
  - Main thread: `mountSky`'s activity, pointer and pause wiring; the pause UI.
- **The veil session's until its commit lands** (COORDINATION.md request 2): `veiledFrom`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the `layout` handler) and the `scroll` handler. Some code is also touched by it, so it becomes ours only after the rebase:
  - `planFlight`, `planMeteor` and `updateMeteor`;
  - `drawMeteor` and `drawTrain`;
  - `quietFactor` and `inkAt`;
  - `QUIET`, and `METEOR`'s spawn and selection keys;
  - the rect measurement in `mountSky.ts`, and `SkyRect` and the `layout` message in `protocol.ts`.
- **Read only, by us, at any time:** `scrollY`, `quietBlend(t)`, `layoutAt`, `easedQuietFactor`, `quietFactor`, `screenQuietZones`. Reading their outputs never conflicts with how they compute them. Section 8.1 lists the names their code reads from ours, which our phases keep stable.
- **Written by both:** `parallaxScroll`, by their `scroll` handler under full motion and by our `motion` handler on resume (P2), with the same meaning (8.1).
- **Shared after the rebase.** The transient scheduler replaces `updateMeteor` and calls their kind-agnostic scroll-cancel helper for every kind (I3).

## 5. Architecture and module map

### 5.1 Files

| File | New or changed | Side | Owner | Phase | What changes |
|---|---|---|---|---|---|
| `src/lib/sky/config.ts` | changed | model | ours (new blocks) | P1 to P11 | `STAR_PHASES` (P1); `DEPTH`, `CAMERA`, `LayerConfig.parallax` and `LAYERS.*.parallax` removed (P2); `PACING`, `ADAPT` and `FRAME` docs (P3); `FRAME` idle docs (P4); `FRAME.motionEase` (P5); `DRIFT`, `SCENE.*.drift` (P6); `LEAN`, `SCENE.*.lean` (P7); `TRANSIENTS`, `METEOR`'s scheduler keys moved (P8); `GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, the `METEOR_LOOK.fireballTint` doc (P9); `METEOR_KINDS` (P10); `SATELLITE` (P11) |
| `src/lib/sky/catalog.ts` | changed | model | ours | P2 | `Star.q`, `nearness`, `LAYER_NEARNESS` |
| `src/lib/sky/scene.ts` | changed | model | ours (`sceneAt`, `sameRects`); veil (quiet math) | P1, P6, P7, P8 | `sameRects` moved here (P1); `drift` (P6) and `lean` (P7) levels; `meteors` renamed `launches` (P8) |
| `src/lib/sky/camera.ts` | **new** | model | ours | P2, P6, P7 | `Vec`, `Spring`, `Camera`, `CameraInput`, `springStep`, `createCamera`, `stepCamera`, `resumeCamera`, `forgetStep`, `cameraOffset`, `cameraSpeed`; `driftAt`, `driftVelocity` (P6) |
| `src/lib/sky/pacing.ts` | **new** | model | ours | P3 | `FrameDemand`, `NO_FRAMES`, `EVERY_FRAME`, `FADE_FRAMES`, `combineDemands`, `motionFps`, `refreshDivisor`, `Divisor`, `stepDivisor`, `frameDue`, `RefreshEstimate`, `createRefreshEstimate` |
| `src/lib/sky/presence.ts` | **new** | model | ours | P4 | `Presence`, `createPresence`, `notePresence`, `isAway`, `presenceLevel` |
| `src/lib/sky/quietIndex.ts` | **new** | model | ours (wraps veil math) | P1 | `QuietIndex`, `createQuietIndex`, `QUIET_REACH` (until the veil session exports its own) |
| `src/lib/sky/random.ts` | changed | model | ours | P8, P9 | `Random` type (P8); `gaussian` (P9) |
| `src/lib/sky/transients.ts` | **new** | model | ours | P8 | the union, specs, scheduler, lease, cancel, `nextGap` (P9), demand |
| `src/lib/sky/radiants.ts` | **new** | model | ours | P9 | `SkyDirection`, `SkyWindow`, `Source`, `VisitSky`, `skyWindow`, `pickVisitSky`, `visitAim`, `radiantMotion`, `elevationAt`, `meteorRange` |
| `src/lib/sky/satellites.ts` | **new** | model | ours | P11 | `SatellitePass`, `SatelliteFrame`, `planSatellite`, `satelliteMoving`, `satelliteAt` |
| `src/lib/sky/meteors.ts` | changed | model | veil until V | P8 to P10 | only through interface requests I1, I2, I6, I7 (8.3): the `nearCopy` option and field (theirs; ours if declined, and under PF), `Flight`, `Aim`, the `aim` option and the end guards (ours after V), the `fireball` option (P10) |
| `src/lib/sky/protocol.ts` | changed | types | shared | P4, P5, P7, P13 | `activity` (P4), the `SkyMotion` doc (P5), `pointer` (P7), `tick` and `relay` (P13) |
| `src/components/sky/sky.worker.ts` | changed | worker | ours except the veil handlers | P1 to P11, P13 | camera, presence, motion level, demand, schedule, the header and `schedule` docs (P3, P6), the relay (P13); never the `scroll` or `layout` handler bodies before V |
| `src/components/sky/renderSky.ts` | changed | worker | ours except `drawMeteor`/`drawTrain` | P1, P2, P4, P6, P8, P11 | `StarField`, `SkyFrame` (`twinkleTime` in P4, the thinning fade in P6), `drawLayer`, `placePoint`, `drawSky`, `drawTransient`, `drawSatellite` |
| `src/components/sky/skyAssets.ts` | changed | worker | ours | P1 | the phased atlas, the separable painter, `starSpriteIndex` |
| `src/components/sky/mountSky.ts` | changed | main | ours except the rect measurement | P4, P5, P7, P13 | activity and pointer listeners; `motion()` from the pause store; the worker-message `switch` with `setSkyRunning` (P5); the relay loop (P13) |
| `src/components/sky/skyPause.ts` | **new** | main | ours | P5 | `SkyPlayback`, `skyPaused`, `skyPlayback`, `serverSkyPlayback`, `setSkyRunning`, `setSkyPaused`, `subscribeSkyPlayback` |
| `src/components/sky/SkyPauseToggle.tsx` | **new** | main (client) | ours | P5 | the pause control |
| `src/components/icons/PauseSVG.tsx`, `PlaySVG.tsx`, `icons/index.ts` | new, changed | main | ours | P5 | two decorative glyphs on the shared `Icon` frame (`icons/Icon.tsx`), re-exported from the barrel |
| `src/components/Navbar.tsx` | changed | main (client) | ours | P5 | hosts the control last in `<nav>`, in the entrance stagger, `inert` while the phone menu is open; the header shows itself when focus enters it and stays while it holds keyboard focus |
| `AGENTS.md` | changed | docs | ours | P5 | one line: the pause control is the sky's WCAG 2.2.2 mechanism, and any new continuous sky motion must stop under `motion: 'reduced'`. The worker-file list doesn't change (no new worker file). |
| `README.md` | changed | docs | ours | P5, P6, P8, P9, P11 | the two sky-folder lines (`README.md:75`, `:80`) name what each phase adds (the pause store and control; the camera, pacing, presence, the quiet index, transients, radiants and satellites) |

`Background.tsx`, `Background.module.css` and `SkyCanvas.tsx` do not change.

### 5.2 Import boundaries (AGENTS.md)

- **`src/lib/sky/*`** imports only its own files, by relative path. Every new model file (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`, `transients.ts`, `radiants.ts`, `satellites.ts`) imports only `./config`, `./scene`, `./meteors`, `./pacing`, `./random`, `./protocol` (types) or each other. None uses React, `window`/`document`, the `@/lib` barrel or `@/lib/utils`.
- **No runtime import cycles.**
  - `radiants.ts` imports only types from `meteors.ts` (`Point`, `MeteorField`, `Flight`, `Aim`), and `meteors.ts` never imports `radiants.ts`: the planner defines the contract it consumes.
  - `transients.ts` holds every kind's spec in one registry and imports the satellite functions (`planSatellite`, `satelliteMoving`). `satellites.ts` may import only *types* back (`PlanContext`, `Planned`), which TypeScript erases.
  - A value import back from `satellites.ts` would be a real runtime cycle. If `satellites.ts` loaded first, the registry would read its spec before it exists (a temporal-dead-zone error). The domain-model draft hit exactly this in a first sketch.
- **Worker files** (`sky.worker.ts`, `renderSky.ts`, `skyAssets.ts`) keep importing only `@/lib/sky/*` by file and each other. No new worker file is added (deviation 4).
  - If `renderSky.ts` grows past about 400 lines with transients, split `renderTransients.ts` out in P11 and add it to AGENTS.md's list (R3 §7.5).
- **Main thread.**
  - `mountSky.ts` keeps importing only types and `@/lib/sky/color` from `src/lib/sky`. Its new constants (the activity interval, the pointer query) live in `mountSky.ts` beside `DPR_CAP` (`mountSky.ts:17-27`).
  - `skyPause.ts` imports nothing from `src/lib/sky`. It reads `REDUCED_MOTION_QUERY` from `@/lib/utils` (`utils.ts:20`), as `mountSky.ts:3` does today. `mountSky` then drops its own import, because the store owns the query (one reader of the setting for the sky).
- **Code style** (AGENTS.md): tabs, single quotes, no semicolons, `@/` imports outside `src/lib/sky`, default-exported components, named re-exports in barrels, no namespace imports, and a doc comment on every config constant.
- **`'use client'`.**
  - `SkyPauseToggle.tsx` has no directive. It is rendered only by `Navbar.tsx`, which is already the client entry of its subtree (`Navbar.tsx:1`).
  - AGENTS.md says to "add 'use client' only at the entry of an interactive subtree".
  - The Next.js docs: "Once a file is marked with "use client", all of its imports and the components it directly renders are included in the client bundle. This means you don't need to add the directive to every component that is intended for the client" (`01-app/01-getting-started/05-server-and-client-components.md:178-180`).
  - If D1 moves the control to a Server Component (the hero or the footer), the file becomes an entry and gains the directive.
- **Bundling.** The worker entry is unchanged: `new Worker(new URL('./sky.worker.ts', import.meta.url))` (`mountSky.ts:79-80`), which Turbopack already bundles as its own chunk today (its docs mention `new Worker()` expressions only for magic comments, `03-api-reference/08-turbopack.md:130`). Every new model file reaches the worker chunk through a static import from `sky.worker.ts`, with no configuration.

### 5.3 Main thread and worker split

```
 main thread                                       worker
 ResizeObserver ──── init/resize ───────────────►  sizes, assets; the camera created on the restored scroll
 Motion scroll() ─── scroll (veil handler) ──────►  scrollY, parallaxScroll, noteInput      (handler body unchanged)
 ResizeObserver ──── layout (veil handler) ──────►  quiet rects, ease                         (handler body unchanged)
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
  - The control reads the store through `useSyncExternalStore` with a server snapshot. React uses that snapshot "only during server rendering and during hydration" (react.dev, `useSyncExternalStore`), and both are `null` here, so nothing renders and nothing mismatches.
  - The navbar also lives in IntroGate's content, which is `display: none` until the reveal and then remounted by a key flip (`IntroGate.tsx:94-100`). So the control the visitor sees mounts fresh on the client with the real state, and no inline script is needed.
- **Workers.** Use the existing `new Worker(new URL(...))` pattern (5.2). Don't use `next/script`'s `strategy="worker"`: "The `worker` strategy is not yet stable and does not yet work with the App Router" (`01-app/02-guides/scripts.md:128`).
- **No Cache Components APIs** (AGENTS.md); nothing here needs them.
- **Verification.**
  - While `next dev` runs, use its MCP endpoint `/_next/mcp` (`get_errors`, `get_compilation_issues`, `compile_route` for `/`) instead of `next build` (AGENTS.md).
  - At the end of every phase (almost every one adds a module to the worker's graph or changes the client bundle), run one production build in the implementing worktree with its own dev server stopped: `npm run build`, then the `portfolio-prod` preview. Confirm the sky draws with no console errors, since production builds minify and mangle export names.

## 6. Detailed design per area

Code sketches follow the codebase: tabs, single quotes, no semicolons, a doc comment on every exported constant, relative imports inside `src/lib/sky`, `@/` imports elsewhere, and `noUncheckedIndexedAccess`. They are plans, not patches: names and contracts are binding, and bodies may be tightened.

### 6.1 Camera, depth and drift

#### The law

```
 screen(star) = world(star) − q(star) · C(t)              every star, every cause (C2)
 C(t)         = C_scroll + C_drift + C_lean               CSS px for a star at nearness q = 1
 C_scroll     = (0, 0.07 · s(t))                          s: a critically damped spring (ω = 10 rad/s) on parallaxScroll − shift
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

Both compose exactly, so 15, 60 and 144 Hz follow the same path (the scroll part's one-step snap aside, C4). Never explicit Euler, never a fixed lerp per frame: at 10 fps Euler degenerates, and after a 250 ms stall it overshoots by 27 to 33% (R1 §5.4).

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
		const [brightest, faintest] = LAYERS[layer].magnitude
		return [layer, [nearness(faintest), nearness(brightest)] as const]
	})
) as Record<SkyLayer, readonly [number, number]>

// In cellStars, after `m` is drawn (catalog.ts:143): no new draw, so S2 holds and the resting sky is unchanged
//	stars.push({ x, y, alpha: magnitudeAlpha(m), q: nearness(m), …the rest as today })
```

`LayerConfig.parallax` and the three `parallax` values go (`config.ts:58-59`, `:78-80`); their only reader is `renderSky.ts:100`. The `LAYERS` doc changes from "scroll parallax" to "how far each star moves comes from its magnitude (DEPTH)".

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
 * browsers) leaves the brightest stars at most about 25 px to glide on a 900 px screen, the same at any frame rate. A
 * jump of more than `snapViewports` viewport heights in one step (an instant scrollTo, say) snaps instead of sweeping
 * the sky; 0 always snaps, which follows the scroll exactly. A spring with less than `restPx` CSS px of motion left (at
 * nearness 1) settles on its target and stops asking for frames.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, maxLag: 0.25, snapViewports: 1, restPx: 0.01 } as const
```

The trail while scrolling is 2V/ω × 0.07 × q: 14 px at q = 1 and 22 px for the brightest at 1000 px/s. Above about 1,100 px/s (at H = 900) the lag cap holds it at `maxLag` × H × 0.07 × q, 25 px for the brightest, and sets the spring's velocity to ω × lag / 2: that of a spring trailing steadily at that lag (x″ = −2ωx′ − ω²(x − g) with x − g constant), which is also the uncapped spring's state at the threshold, so the cap engages without a seam. The velocity `springStep` leaves would depend on the frame rate, and at 30 Hz fast flings and scrollbar drags would then overshoot by up to about 5 px [computed]. So the camera closes the last lag as lag × (1 + ωt/2)e^(−ωt) at any frame rate, and after a scroll that moves one way the stars never overshoot: the spring's impulse response is never negative, so the error stays one-signed (R1 §5.1) [computed]. A scroll reversed just before it stops can carry the brightest star up to about 2.5 px past, then back.

**Why the snap compares steps, and a cap bounds the lag.** Above ωH/2 (4,500 px/s at H = 900) the trail alone exceeds a viewport, so a snap rule on the lag would snap again and again through an ordinary fling: 6 jumps of about 100 px for the brightest star in 2 s at 5,000 px/s [computed]. A jump (R1 §5.1: "thousands of px in one message") is one step; a fling is many small ones. So is nearly every jump on this site: `html` scrolls smoothly under full motion (`globals.css:55`), the navbar's section links rely on it (`smoothScrollTo`, `Navbar.tsx:73`, `utils.ts:26`), and desktop browsers usually animate Home and End, all in steps of a few hundred px. Uncapped, the spring would trail such a scroll by up to 2V/ω and leave the brightest stars gliding 100 to 180 px after the page stops, like a dog on a long leash that keeps running when its owner stops. `maxLag` shortens the leash: at most 24 px of glide after eased jumps of 3,000 to 20,000 px over 0.3 to 1 s at H = 900, with no overshoot at 30 to 144 Hz [computed].

#### The drift (P6)

```ts
// src/lib/sky/config.ts
/** One circle of the drift: frequency as a multiple of the main circle's (negative turns the other way), speed as a share of DRIFT.speed, starting angle (radians). */
interface Epicycle {
	ratio: number
	share: number
	phase: number
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
} as const satisfies { speed: number; period: number; epicycles: readonly Epicycle[]; narrowRate: number; ease: number; maxStep: number }
```

Computed for v₀ = 3 [computed: the judge's `drift.mjs` and `heading.mjs`, cross-checked against all three drafts]:

| Quantity | Value |
|---|---|
| Circle radii R = share · v₀ / \|ω\| | 85.94, 15.94 and 4.27 CSS px (ω = 0.0349, −0.0565 and 0.0843 rad/s) |
| Speed range | 0.580 to 1.420 v₀ (1.74 to 4.26 px/s at q = 1) |
| Heading turn rate | mean 2.00°/s, max 4.33°/s; it turns smoothly and never steps |
| Largest change of speed | 3.8% per second |
| Wander bound | exact supremum ΣR + \|ΣR e^(iφ)\| = 205.2 px (68.4 s × v₀; a 6-hour simulation reaches 205.2); for any phases at most 2ΣR = 212.3 px (70.8 s × v₀). R1's phases give 190.9 px. |
| Wander per band | brightest 328, near mean 210, mid mean 103, far mean 60 px |
| First minute, from the dusk (the 3 s ease included) | heading 19° up-right at 5 s, 9° at 10 s, level by 15 to 20 s, −7° at 30 s, −16° at 45 s, −52° at 60 s; speed 0.92, 1.03, 1.18, 1.18, 0.96 and 0.68 v₀ at 5, 10, 20, 30, 45 and 60 s; within 30° of level for 52.7 s and rightward for all 60 |
| Later | clockwise: down at about 70 s, left at about 120 s, up at about 150 s; back within about 24 px of the start at 180 s |
| Exact repeat | the ratios are the decimals 809/500 and 1207/500, so the path repeats exactly after 500 main periods, 25 hours of drift clock |
| Frequencies | 0.0056, 0.0090 and 0.0134 Hz: far below the 0.05 to 0.5 Hz band linked to motion sickness (Diels and Howarth 2013) |

Rotating all three phases by one angle turns the opening heading. It changes the first-minute and later heading rows, never the speed, turn-rate, bound or frequency rows (D6).

**Speeds on screen** (CSS px/s, minimum to maximum over the epicycles, v₀ = 3) [computed]:

| Scene (rate) | Brightest (q 1.6) | Near mean (1.024) | Mid mean (0.501) | Far mean (0.294) | Faintest (0.240) |
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
	/** Scroll to follow (page px): the worker's parallaxScroll. */
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
export function springStep(spring: Spring, target: number, omega: number, dt: number): void {
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
			springStep(camera.scroll, goal, CAMERA.scrollOmega, dt)
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
		springStep(camera.leanX, input.lean.x, LEAN.omega, dt)
		springStep(camera.leanY, input.lean.y, LEAN.omega, dt)
		settle(camera.leanX, input.lean.x, LEAN.omega, LEAN.reach)
		settle(camera.leanY, input.lean.y, LEAN.omega, LEAN.reach)
	} else {
		// Reduced motion or paused: the springs hold where they are
		camera.scroll.velocity = 0
		camera.leanX.velocity = 0
		camera.leanY.velocity = 0
	}
	camera.clock += input.drift * Math.min(dt, DRIFT.maxStep)
	const moving =
		input.drift > 0 ||
		(input.follow && (camera.scroll.value !== goal || camera.leanX.value !== input.lean.x || camera.leanY.value !== input.lean.y))
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
```

Notes for the implementer:

- **What lands when.**
  - In P2 the camera has `scroll`, `shift`, `lastGoal` and `steppedAt`. `cameraOffset` has only the scroll term, and `CameraInput` has no `drift` or `lean`.
  - P6 adds `clock`, `EPICYCLES`, `driftAt`, `driftVelocity` and the drift terms.
  - P7 adds `leanX`, `leanY` and `LEAN`. If D3 skips the lean, the lean fields and `LEAN` never exist.
- **Rate changes never jump the sky.** The drift clock integrates the rate as it is at the end of each step. While the rate eases (3 s from the dusk, 4 s around the idle fade, 0.3 s around a pause), this differs between 20 and 60 fps by a few hundredths of a second of drift clock: under 0.2 px for the brightest star, and invisible. Positions still never jump, because the rate changes, not the position (C5). This also meets R3's and R4's "integrate, never speed × time": a change of speed never rescales the distance already travelled.
- **Precision.** `world − q·C` is computed in doubles in JavaScript before anything reaches the canvas's float32 coordinates. Offsets stay under 4 million px, where a double's spacing is about 5 × 10⁻¹⁰ px, and nothing goes through `ctx.translate` (R3 §5.2).
- **No allocation.** `springStep` mutates in place (R3), unlike R1's sketch, which returned new objects.

#### The worker side (P2, P5, P6)

```ts
// src/components/sky/sky.worker.ts
let camera = createCamera(0)
/** The camera's offset for the frame being drawn (reused). */
const offset: Vec = { x: 0, y: 0 }
/** Whether the camera moved on its last step: it then needs motion frames, and stopping draws one last frame (F7). */
let cameraMoving = false
/** Motion has been full at some point in this page view: until then stars snap to today's whole pixels (M1). */
let skyMoved = false
// Seconds on the worker clock: when the motion preference last changed, and the motion level at that moment (P5)
let motionChangedAt = -Infinity
let motionLevelFrom = 0

/** Share of motion allowed now (twinkle, drift): eases to 1 under full motion and to 0 otherwise over FRAME.motionEase (M1). (P5) */
function motionLevel(t: number): number {
	const target = motion === 'full' ? 1 : 0
	return motionLevelFrom + (target - motionLevelFrom) * smoothstep(0, FRAME.motionEase, t - motionChangedAt)
}

/**
 * Whether the drift runs or is heading up: full motion, the dusk begun, affordable, the visitor here, a drifting scene.
 * Frames follow this, not the eased rate, which starts from exactly 0 (F6). (P6)
 */
function driftWanted(now: number, scene: SceneLevels): boolean {
	return motion === 'full' && exitAt !== null && driftAffordable() && !isAway(presence, now) && scene.drift > 0
}

/** The drift-clock rate the scene asks for before the eases: what the frame clock paces for. (P6) */
function driftTarget(scene: SceneLevels): number {
	return scene.drift * (width <= NARROW_MAX_WIDTH ? DRIFT.narrowRate : 1)
}

/** Drift-clock rate now: the scene's target × presence × the motion level × the ease from the dusk (D2, D3). (P6) */
function driftRate(now: number, scene: SceneLevels): number {
	if (exitAt === null || !driftAffordable()) return 0
	const t = now / 1000
	return driftTarget(scene) * presenceLevel(presence, now) * motionLevel(t) * smoothstep(0, DRIFT.ease, t - exitAt)
}

/** Steps the camera while visible; when it comes to rest, one more frame shows the resting sky (F7). */
function updateCamera(now: number, scene: SceneLevels): void {
	if (!visible) return
	const moving = stepCamera(camera, {
		time: now / 1000,
		scroll: parallaxScroll,
		viewportHeight: height,
		follow: motion === 'full',
		drift: driftRate(now, scene),
		lean: leanTarget(scene),
	})
	if (cameraMoving && !moving) needsDraw = true
	cameraMoving = moving
}
```

- **`init`** (ours, `sky.worker.ts:401-427`): `camera = createCamera(message.scrollY)` next to `scrollY = parallaxScroll = message.scrollY` (`:420`), and `skyMoved = message.motion === 'full'`.
- **`motion` handler** (ours, `:437-443`). It acts only when the value changes:
  - first, `motionLevelFrom = motionLevel(t); motionChangedAt = t`;
  - on a change to full, `skyMoved = true`, today's `holdMeteors(now)`, then `parallaxScroll = scrollY` and `resumeCamera(camera, scrollY)` (C8).
  - Today `parallaxScroll` stays stale until the next scroll message and then leaps (`:465`). This fixes that without touching the veil-owned scroll handler, which keeps recording `scrollY` and, under full motion only, `parallaxScroll`.
- **`visible` handler** (ours, `:444-458`): `forgetStep(camera)` in the hidden branch, beside `cancelFrames()`.
- **`tick`**: `updateCamera(now, scene)` after `settleQuiet(now)` and before the frame decision. The camera steps on every wake-up, drawn or not, with the true elapsed time.
- **`frameAt`** (`:246-267`): `camera: cameraOffset(camera, offset)` replaces `parallaxScroll` in the `SkyFrame`.
  - `snap` is `true` in P1.
  - From P2 it is `!skyMoved`, a worker flag that `init` and the `motion` handler set the first time motion is `'full'` in this page view. A load under reduced motion or paused draws exactly today's points; after that, a pause, a reduced-motion switch or Play keeps every star at its quarter-pixel phase rather than hopping it up to half a device pixel, as the idle sleep already does (M1). The first full motion after such a load still moves each star once to its phase: M1's one-time settle, accepted, because easing it would need each star's rounding at the switch.
- **`probeRaster`** (`:309-320`) keeps calling `frameAt` without stepping the camera.
- **Before P5**, `motionLevel` is not there: P2 uses `follow: motion === 'full'` and no drift. Until P3 replaces `frameMode`, P2 makes `frameMode` return `'active'` while `cameraMoving`, so the glide draws on every refresh.

#### Reconciling R1's drift with R4's heading rules

R4 asked for a heading within ±15° of horizontal that turns at most 15°/min and never reverses (its AC-4), and for no return within 50 px of an earlier offset (its AC-7). Those describe an unbounded "train window" pan. The settled design (the brief, R1) is a floating camera, which is what the user asked for in so many words ("floating around"). Epicycles turn about 2°/s and come back near their start every 180 s, because any bounded path must.

They still meet what R4's rules were for:

- **No stops.** The speed stays at least 0.58 v₀.
- **No abrupt turns.** The heading turns at most 4.33°/s, smoothly.
- **No sway in the sickness band.** Every frequency is under 0.014 Hz.
- **No rhythm to notice.** The speed beats on about 69 s and 127 s, which are incommensurate. The heading's roughly 3-minute cycle is the intended float. The path never retraces itself in a way anyone could see: within 30 minutes, no 60 s stretch matches an earlier one closer than 6.4 px at q = 1 with the two aligned at their first points (after a 9-minute lag), and the exact path repeats only after 25 hours [computed].

Passing near the starting position is not a repeat. Every bounded quasi-periodic path does it: these phases come within 4 px of the start at about 9 minutes, and R1's within 6 px. The base draft's "near-returns differ by 21 to 38 px" was wrong, so AC-7 measures retraced stretches instead.

R4's other worry, induced motion of the headline when the drift heads vertically, is met by keeping the faint majority nearly still (the far band's mean at most 1.25 px/s), and AC-17 checks it. Section 9 therefore amends AC-4 and AC-7 instead of changing the drift, and section 12 lists the one-constant fallback if AC-17 fails.

#### Reconciling the pointer lean (R1 and R4)

R1 proposes a reach of 12 CSS px at q = 1: ±19 px for the brightest star, ±12 px for the near band, ±6 px for mid and ±3.5 px for far. R4 proposes a virtual shift of 100 px times each layer's parallax, which gives far 2, mid 4 and near 7 px.

In this plan's law, a layer's nearness is its parallax over 0.07, so R4's numbers are the same model at reach 7. The two agree on the law, the spring (ω = 4 rad/s, 95% in 1.19 s) and the gating: fine pointer with hover, hero only, full motion, never device orientation. They differ only in one amplitude: 12 by default (the brief's), with 7 and 10 as the calmer settings (D3). The `LEAN` block is in 6.13.

### 6.2 Pacing and the frame clock (P3)

#### Policy and mechanism

The frame clock has two concerns with different owners:

- **Policy** (pure, in `src/lib/sky/pacing.ts`): what each part of the sky needs (`FrameDemand`), the strictest of them, the frames per second motion needs, the whole-number divisor and its hysteresis, the refresh estimate, and whether a wake-up draws. All of it runs in the scratch harness.
- **Mechanism** (in `sky.worker.ts`): the `requestAnimationFrame` and `setTimeout` handles.
  - They stay worker variables named `rafId` and `timerId`, because the veil-owned scroll handler reads them: `if (!rafId && timerId === undefined) needsDraw = true` (`sky.worker.ts:469`).
  - `rafId` becomes `number | null`, with `null` as the "nothing pending" sentinel (MDN: request IDs may wrap to 0).
  - `!rafId` still means "no frame pending", so the handler keeps working without an edit. In the rare case of a pending id of 0 it draws one extra frame, which is harmless.
  - The watchdog gets its own `watchdogId`, which the handler never sees. In timer-fallback mode the frame timer lives in `timerId`, so the handler sees a pending frame.

#### Config

```ts
// src/lib/sky/config.ts
/**
 * Frame pacing for moving stars (FRAME keeps the timers for a sky that only changes brightness). A moving star steps at
 * most `stepPx` device px per drawn frame (two quarter-pixel phases, under a third of the smallest star's width) and never
 * draws below `minFps`. Motion draws on animation frames divided by a whole number, so every drawn frame stays up for the
 * same number of display refreshes; a lower need must last `slowDownAfter` seconds before the clock slows down. The drift
 * draws at most `narrowMaxFps` on narrow screens (phone GPUs pay most for a full-screen frame) and `slowMaxFps` after the
 * first adaptive step; a software-rasterized canvas may spend `softwareShare` of a core on it and keeps a still sky below
 * `minFps`. The refresh interval is the median of the last `refreshSamples` frame intervals; a median within
 * `unalignedTolerance` ms of `unalignedInterval` is WebKit's fixed 15 ms worker clock, not the display, so uncapped
 * motion draws every frame there and capped drift every few. A requested animation frame that hasn't come `watchdogMs`
 * after the request (while visible) is served by a timer; after `watchdogStrikes` misses in a row, frames come from a
 * `fallbackFps` timer, which asks for one animation frame every `reprobeMs` and goes back to them when one arrives (a GPU
 * restart or a restored context); the strikes also reset when the context is restored or the tab is shown.
 */
export const PACING = {
	stepPx: 0.5,
	minFps: 20,
	slowDownAfter: 0.5,
	narrowMaxFps: 30,
	slowMaxFps: 30,
	softwareShare: 0.08,
	refreshSamples: 16,
	unalignedInterval: 15,
	unalignedTolerance: 0.4,
	watchdogMs: 250,
	watchdogStrikes: 3,
	fallbackFps: 60,
	reprobeMs: 5000,
} as const
```

The `FRAME` doc (`config.ts:206`) gains: "Motion (the drift, a shooting star, scrolling) draws on animation frames paced by PACING; these timers serve a sky that only changes brightness." The `ADAPT` doc gains: "step 1 also caps the drift at PACING.slowMaxFps".

**Why three strikes.** The drafts disagreed on the watchdog.

- Switching to timers for good after one stall turns a single GPU hiccup into judder for the rest of the visit.
- Never switching serves a broken provider (Chrome's id 0, which never calls back, R3 §2.1) at about 4 fps, one frame per watchdog delay.
- Three misses in a row (750 ms) separates the two cases, and the 5 s probe undoes a switch that a GPU restart or an occluded window caused.

#### `src/lib/sky/pacing.ts` (new)

```ts
import { FRAME, PACING } from './config'

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
 * Frames per second for something moving `devicePxPerSecond`: at most PACING.stepPx per frame, and never under
 * PACING.minFps, even at speed 0, since a motion that has just started (or is easing in from 0) still needs frames (F6).
 */
export function motionFps(devicePxPerSecond: number): number {
	return Math.max(PACING.minFps, devicePxPerSecond / PACING.stepPx)
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
 * Whether a wake-up at `now` (ms) draws for `demand`: an animation frame once k - 1/2 refreshes have passed since the last
 * drawn frame, a timer once its interval has (4 ms early is fine: timers fire a little early or late).
 */
export function frameDue(demand: FrameDemand, now: number, lastDrawAt: number, k: number, interval: number): boolean {
	if (demand.fps <= 0) return false
	if (demand.vsync) return now - lastDrawAt >= (k - 0.5) * interval
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
			return Math.abs(interval - PACING.unalignedInterval) <= PACING.unalignedTolerance
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

The domain-model draft tested this body: a 60 Hz stream with a dropped frame every 13 settles at 16.7 ms, it follows a switch to 30 Hz after exactly 16 samples, a 15.0 to 15.1 ms stream reads as unaligned, and 120 Hz gives 8.33 ms.

#### The worker's demand (replaces `frameMode` and `frameInterval`, `sky.worker.ts:116-133`)

```ts
/** The strictest demand of every part of the sky right now; NO_FRAMES while nothing can draw. */
function frameDemand(now: number, scene: SceneLevels): FrameDemand {
	if (!ctx || !visible || motion === 'off' || exitAt === null) return NO_FRAMES
	const t = now / 1000
	const scrolling = now - lastScrollAt < FRAME.scrollSettleMs
	return combineDemands(
		// P8 replaces this line with transientDemand(transients, t)
		meteor ? (meteorMoving(meteor, t) ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		scrolling ? (motion === 'full' ? EVERY_FRAME : FADE_FRAMES) : NO_FRAMES,
		// Decided by where the drift and the lean are heading, not their rates: waking from idle the drift eases in from 0 (F6)
		cameraMoving || driftWanted(now, scene) || leanPending(scene) ? cameraDemand(now, scene) : NO_FRAMES,
		!emergenceDone(t - exitAt) || (layoutAt !== null && t - layoutAt < QUIET.ease) || t - motionChangedAt < FRAME.motionEase ? FADE_FRAMES : NO_FRAMES,
		twinkleDemand(now, scene)
	)
}

/**
 * Display-aligned frames while the camera moves or the drift is wanted: enough for the nearest stars to step at most
 * PACING.stepPx device px at the speed the drift is heading to (not its eased rate), never fewer than PACING.minFps. The
 * drift's caps apply while the drift is wanted or the lean moves (a mouse never draws every refresh), so a scroll glide
 * alone is never cut to a crawl.
 */
function cameraDemand(now: number, scene: SceneLevels): FrameDemand {
	const wanted = driftWanted(now, scene)
	const speed = DEPTH.maxNearness * cameraSpeed(camera, wanted ? driftTarget(scene) : 0) * dpr
	return { fps: motionFps(speed), vsync: true, cap: wanted || leanPending(scene) ? driftCap() : Infinity }
}

/** Most drift frames per second here: 30 on narrow screens and after the first adaptive step; a CPU budget on software raster. */
function driftCap(): number {
	const cap = width <= NARROW_MAX_WIDTH ? PACING.narrowMaxFps : quality > 0 ? PACING.slowMaxFps : Infinity
	return Math.min(cap, softwareFps)
}

/** Twinkle's timer while it may change: decided by where the twinkle is heading, not its level, as today (sky.worker.ts:124). */
function twinkleDemand(now: number, scene: SceneLevels): FrameDemand {
	if (motion !== 'full' || isAway(presence, now) || scene.twinkle <= 0) return NO_FRAMES
	return { fps: quality > 0 ? FRAME.slowTwinkleFps : FRAME.twinkleFps, vsync: false, cap: Infinity }
}
```

Lines that refer to later phases arrive with them:

| Line or name | Before its phase | From its phase |
|---|---|---|
| `cameraMoving` | (P2) | as written |
| `driftWanted` | `false` | P6 |
| `leanPending` (full motion, and the lean springs away from `leanTarget(scene)`; 6.13 says why the motion test matters) | `false` | P7 |
| the motion-level ease | absent | P5 |
| `isAway(presence, now)` | today's `isIdle(now)` | P4 |
| `transientDemand` | absent | P8 |

Before P6 nothing new moves except the scroll glide. So `frameDemand` reproduces today's `frameMode` exactly for everything that existed before:

| Today's mode | Its demand |
|---|---|
| `'active'` | `EVERY_FRAME` |
| `'fade'` | `FADE_FRAMES` |
| `'twinkle'` | a 15 or 10 fps timer |

**Software raster.**

- `probeRaster` (`:309-320`) keeps the milliseconds it measured, scaled by 1 / dpr² when it stepped down to CSS resolution.
- `softwareFps` is `Math.floor(PACING.softwareShare * 1000 / rasterMs)` when the probe found a software canvas, and `Infinity` otherwise.
- `driftAffordable()` is `softwareFps >= PACING.minFps`.
- A 1440 × 900 software canvas at CSS resolution (3.3 to 3.9 ms a frame, R3 §6) affords 20 to 24 fps and drifts. A 4K software canvas (about 29 ms) gets 2 fps and keeps a still sky, as today. Scroll parallax and meteors still work there, at today's cadence.

#### The worker's mechanism (replaces `schedule`, `onTimer`, `onFrame`, `tick` and `cancelFrames`, `:136-190`)

- **`requestFrame()`.**
  - If `rafWorks`, it sets `rafId = scope.requestAnimationFrame(onFrame)` and arms `watchdogId = setTimeout(onStalled, PACING.watchdogMs)`.
  - Otherwise it sets `timerId = setTimeout(onTimer, needsDraw ? 0 : Math.max(0, lastDrawAt + divisor.k * 1000 / PACING.fallbackFps - now))`, today's `onTimer` (`:171-174`), which ticks without sampling the refresh estimate. In this mode the timer stands in for the display: `tick` divides it like a 60 Hz refresh, so the timer fires once per drawn frame, k periods after the last one (armed one period after it, a k = 2 demand would wake 3 times per drawn frame). It is armed against the last drawn frame, as today's timers are (`:167`), because `schedule` re-runs after every message: armed from `now`, scroll and pointer messages 8 ms apart would push the frame back for as long as they come.
  - In that fallback mode it also asks for one animation frame every `PACING.reprobeMs`, through its own `probeId`; when one calls back, `rafWorks` is true again and the strikes reset.
  - `rafWorks` starts as `typeof scope.requestAnimationFrame === 'function'`. In `SkyWorkerScope` (`:17-22`) both animation-frame members become optional.
- **`onFrame(time)`** clears the watchdog, sets `rafId = null`, resets the strikes, samples the refresh estimate and calls `tick(time)`.
- **`onStalled()`** cancels the request, sets `rafId = null`, counts a strike (at `PACING.watchdogStrikes`, `rafWorks = false`) and serves this frame with `tick(performance.now())`. The `contextrestored` listener (`:409-413`) and the `visible` handler reset the strikes.
- **`schedule(now)`** keeps today's structure (`:152-168`):
  - It returns if a frame is pending (`rafId !== null`), there is no context, or the page is hidden, and it clears `timerId`.
  - It computes `frameDemand`. A vsync demand requests a frame. An fps of 0 sleeps, keeping today's one timer for `needsDraw` or the next due shooting star or transient, and calls `refresh.pause()`. Otherwise it sets a timer at `needsDraw ? 0 : Math.max(0, lastDrawAt + 1000 / demand.fps - now)`, as today (`:167`), so a message that changes the sky draws at once.
- **`tick(now)`** runs, in order:
  1. the shooting star, `settleQuiet`, `settleMotion` (P5, 6.6) and `updateCamera`;
  2. the divisor: in timer-fallback mode the refresh is the timer, `interval = 1000 / PACING.fallbackFps` and `fps = demand.fps` (the estimate may be stale: 8.33 ms after a 120 Hz display stalled); otherwise `interval = refresh.interval` and `fps = refresh.unaligned ? Infinity : demand.fps`. Then `k = demand.vsync ? stepDivisor(divisor, refreshDivisor(1000 / interval, fps, demand.cap), now) : 1`;
  3. `if (needsDraw || frameDue(demand, now, lastDrawAt, k, interval)) draw(now)`;
  4. `schedule(now)`.
- **`cancelFrames()`** (the hidden branch, `:447`) also clears the watchdog, sets `rafId = null` and calls `refresh.pause()`.

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
 * star to whole pixels, as before the drift.
 */
export const STAR_PHASES = 4
```

`src/components/sky/skyAssets.ts`:

- **Painter.** `gaussianAt` (`:45-55`) becomes a separable `profile(size, sigma, phase): Float64Array`: for each pixel i, the 4-sample box integral of the Gaussian centred `phase` px right of the middle pixel. Today's 16-sample 2D value is exactly the product of two such profiles, because the exponential of a sum is a product.
  - So phase (0, 0) reproduces today's sprites. R3 measured a largest difference of 1.1 × 10⁻¹⁶; the delivery draft found 0 byte mismatches at DPR 1, 1.25, 1.5 and 2 [computed].
  - It is also fast: all 16 phases build in about 0.6 to 1.5 ms. Today's painter would need 53 to 316 ms for them.

```ts
/** One axis of the 4x4-supersampled pixel-area Gaussian, centred `phase` px right of the sprite's middle pixel. */
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

- **`paintSprite`** (`:63-78`) paints `round(min(1, (cx[i]·cy[j] + haloPeak·hx[i]·hy[j]) / peak) × 255)` for phases (i/4, j/4). `peak` is the **phase-0** centre value of the same shape, computed once per shape, so every phase carries nearly the same total light. Sprites keep today's sizes (2⌈3σ⌉ + 1, `:57-60`), so a phase shifts the Gaussian toward one edge and cuts a little of its tail: over every DPR from 0.5 to 2 (below 1 when the page is zoomed out, which `canvasDpr` allows, `mountSky.ts:87-92`) and every shape, phase sums stay within 0.5% of phase 0 before rounding (worst: DPR 2, shape 2, σ 1.0 px in a 7 px sprite) and within 1.7% in bytes from DPR 1 to 2 (worst: DPR 1.125, a 90% zoom on a 125% display) and 2.5% below it (worst: 2.45% at DPR 0.825) [computed]. That is far under R4's 5%, and growing sprites to close it would push the DPR-2 atlas past B-10.
- **`buildStarAtlas`** (`:81-120`) lays each (tint, shape) out as a 4 × 4 block of its phases, with a 1 px gutter. The meteor core and glow keep one unphased sprite each, because the head is a fast glow drawn fractionally as today.
- **Index.** A new `starSpriteIndex(tint, shape, phaseX, phaseY) = ((tint * STAR_SHAPES.length + shape) * STAR_PHASES + phaseY) * STAR_PHASES + phaseX` replaces `tint * SHAPE_COUNT + shape`, and `StarAtlas.stars` documents it (`:26-27`).
- **Size.** About 0.7 MB at DPR 1 and 1.9 MB at DPR 2, against 48 KB and 127 KB today. The atlas is rebuilt only when the ratio changes.

`src/components/sky/renderSky.ts` gets one placement function for every point of light: stars now, satellites in P11.

```ts
/** Top-left device pixel where the sprite placePoint picked goes (reused, so no garbage per star). */
const corner = { x: 0, y: 0 }

/**
 * The sprite for a point of light centred at (px, py) device px, with its top-left whole pixel in `corner`. A moving point
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
import { QUIET } from './config'
import type { SkyRect } from './protocol'
import { easedQuietFactor, sameRects, type QuietBlend, type QuietKeeps } from './scene'

/**
 * Farthest from a padded quiet rect that the quiet math looks (CSS px): quietAt skips zones more than QUIET.feather away
 * on either axis (scene.ts:76) and inkAt only reaches inside the padded rect (scene.ts:89). Replaced by the veil
 * session's own QUIET_REACH export from scene.ts once it lands (interface request I4).
 */
export const QUIET_REACH = QUIET.feather

/** Side of the square screen tiles the zones are bucketed into (CSS px). */
const TILE = 64

/**
 * The quiet zones bucketed by screen tile, so a star looks only at the zones that can reach it. Exact: each tile keeps, in
 * their original order, the zones whose box grown by QUIET_REACH touches it, and easedQuietFactor only takes maxima over
 * zones within that reach, so the factor equals easedQuietFactor over all zones bit for bit (Q1).
 */
export interface QuietIndex {
	/** No zones on screen: drawLayer skips the lookup, as it does today (renderSky.ts:107). */
	readonly empty: boolean
	/** Follows the zones on screen; rebuilds the buckets only when a zone list or the grid changed (scroll, layout, an ease starting or ending). */
	update(blend: QuietBlend, width: number, height: number, margin: number): void
	/** easedQuietFactor(blend, x, y, keeps) for a point within `margin` of the viewport, reading only its tile's zones. */
	factor(x: number, y: number, keeps: QuietKeeps): number
}

/** The zones whose box grown by QUIET_REACH touches the tile [x0, x1] × [y0, y1], in their original order. */
function zonesNear(zones: readonly SkyRect[], x0: number, y0: number, x1: number, y1: number): SkyRect[] {
	return zones.filter(
		(zone) =>
			zone.x - QUIET_REACH <= x1 &&
			zone.x + zone.width + QUIET_REACH >= x0 &&
			zone.y - QUIET_REACH <= y1 &&
			zone.y + zone.height + QUIET_REACH >= y0
	)
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

The domain-model draft checked this body over 60 random layouts (390 × 844, 1440 × 900, 2560 × 1440; 31 and 64 rects; settled and mid-ease; three keep pairs; points exactly `QUIET.feather` beyond an edge): its 722,355 lookups differed from `easedQuietFactor` over all zones by exactly 0.

- **Why it is exact.**
  - `quietAt` skips a zone when the point is more than `QUIET.feather` from it on either axis. At exactly the feather the zone contributes 1 − smoothstep(0, 40, d) = 0. `inkAt` contributes only inside the padded rect.
  - So a zone whose grown box doesn't touch a tile adds nothing anywhere in it.
  - Each function takes a maximum over the zones it doesn't skip, and a maximum over a subsequence that contains every contributing zone, in the same order, is the same number. `quietAt`'s early exit at 1 meets the same zone first.
  - The per-tile blend then mixes the same two values by the same formula.
- **Even empty tiles go through `easedQuietFactor`** while any zone exists. During an ease, a star far from every zone still computes `1 × level + 1 × (1 − level)`, which today's code also computes and which can round one unit below 1. Skipping it would break bit identity. Only `empty` (no zones at all) skips the lookup, exactly as today's `quiet` flag does.
- **Rebuilds.** Zones are in screen space, so drift frames never rebuild; only a scroll, a layout, or an ease starting or ending does. `update` compares the incoming lists with the last ones by content, using `sameRects` moved from `sky.worker.ts:82-84` to `scene.ts` and exported, because the veil's `quietBlend` builds new arrays on every call (`sky.worker.ts:227-234`). 64 comparisons cost about 0.5 µs, and a rebuild 0.01 to 0.23 ms. The worker's `layout` handler keeps calling `sameRects(...)` unchanged; only its import moves.
- **Grid.** Tiles cover the viewport plus `margin` on every side. `drawSky` calls `frame.quietIndex.update(frame.quiet, frame.width, frame.height, EDGE)` once per frame, before the layers, because `renderSky.ts` owns `EDGE` (the band in which stars beyond an edge are still drawn). `drawLayer` uses `if (!frame.quietIndex.empty) alpha *= frame.quietIndex.factor(x, y, config)` in place of `renderSky.ts:107` and `:120`. The worker creates one index and passes it in the `SkyFrame`, still filling `frame.quiet` from `quietBlend(t)` unchanged.
- **Ownership.** It wraps the veil session's `easedQuietFactor`, so their math stays the single source. Whatever they change inside `quietFactor`, `inkAt` or `easedQuietFactor` stays exact as long as no zone reaches past `QUIET_REACH` (re-checked by H3 at the rebase). Meteors keep calling `easedQuietFactor` over all zones (Q2).
- **Cost.** Star quiet math at 1,430 stars falls from 1.3 to 1.7 ms mid-ease to 0.14 to 0.32 ms. On a 1440 × 900 laptop it falls from about 0.11 to 0.40 ms to 0.04 to 0.12 ms (R3 §4.1).

### 6.5 The star-field cache, and why nothing wraps (P1)

```ts
// src/components/sky/renderSky.ts
/** Lazily generated cells of each layer's infinite plane, evicted by the frame they were last used in. */
export interface StarField {
	/** The stars of one cell; a cell beyond the key range (±32768 cells) holds none, so keys never collide (SF2). */
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
- Chromium lays out at most about 33.5 million px (its layout unit is a 32-bit count of 1/64 px). So one cycle's largest star offset is about 3.76 million px, cell 14,680, inside the ±32,768-cell key range. On a 20,000 px page the scroll term reaches about 2,200 px per cycle for the brightest star, and only about 3,700 full-page pause cycles would reach the key range, where SF2 then shows no stars instead of wrong ones [computed].
- The only unbounded number is the drift clock, a time. After 30 days of continuous drift, its rounding moves a star by 2.5 × 10⁻⁹ px [computed, domain-model and delivery drafts].
- **So:**
  - there is no `FIELD_PERIOD`, no `wrapCell` and no accumulator to wrap;
  - what remains of R3's guard is SF2: `cell()` returns no stars outside ±32,768 cells instead of computing a colliding key. It is one comparison per lookup (100 to 500 a frame), it belongs to the `StarField` because the key encoding is its own invariant, it states that invariant in code rather than in a comment, and it is the only absolute bound on the pathological pause cycles above;
  - the key comment (`renderSky.ts:38`) states the bound above;
  - **`EDGE` stays 24** (`:93`), now documented: the largest halo's half-side is at most 9 CSS px (3σ of the 2.8 px halo) at any ratio. Culling is per star and continuous, so stars slide in from beyond the edge without popping (R3 §5.4).
- **R4's requirement**, "integrate, never compute speed × time", is met by integrating the *clock* (6.1).
- **Bounded drift also bounds the cache.** Sitting in the hero, the union of cells the drift ever visits is about twice the visible ones, so eviction matters mostly while scrolling, which is when today's clear fires too.

`drawLayer` after P2, in outline (emergence and twinkle lines as today):

```ts
/** Draws one depth layer: each star at its world position less its nearness times the camera. */
function drawLayer(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, field: StarField, frame: SkyFrame, layer: SkyLayer): void {
	const scale = frame.layers[layer]
	if (scale <= MIN_STAR_ALPHA) return
	const config = LAYERS[layer]
	const { width, height, dpr, camera, snap, quietIndex } = frame
	const [qFar, qNear] = LAYER_NEARNESS[layer]
	// The cells this layer's stars can come from, for every nearness in its band
	const x0 = Math.floor((Math.min(camera.x * qFar, camera.x * qNear) - EDGE) / CELL_SIZE)
	const x1 = Math.floor((Math.max(camera.x * qFar, camera.x * qNear) + width + EDGE) / CELL_SIZE)
	const y0 = Math.floor((Math.min(camera.y * qFar, camera.y * qNear) - EDGE) / CELL_SIZE)
	const y1 = Math.floor((Math.max(camera.y * qFar, camera.y * qNear) + height + EDGE) / CELL_SIZE)
	const { image } = assets.atlas
	const emerging = frame.dusk !== Infinity
	for (let cy = y0; cy <= y1; cy++) {
		for (let cx = x0; cx <= x1; cx++) {
			for (const star of field.cell(layer, cx, cy)) {
				if (star.keep >= frame.keep) continue
				// Subtract in doubles before anything reaches the canvas, whose coordinates are float32
				const x = star.x - camera.x * star.q
				const y = star.y - camera.y * star.q
				if (x < -EDGE || y < -EDGE || x > width + EDGE || y > height + EDGE) continue
				let alpha = star.alpha * scale
				if (emerging) alpha *= starEmergence(star.delay, frame.dusk)
				// A bright star beside the copy reads as punctuation or an accent
				if (!quietIndex.empty) alpha *= quietIndex.factor(x, y, config)
				// …twinkle exactly as renderSky.ts:121-125 (it reads frame.twinkleTime if P4's optional step lands)…
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

`SkyFrame.parallaxScroll` (`renderSky.ts:71-72`) becomes `camera: Vec` ("the camera's offset, CSS px at nearness 1"). `SkyFrame` also gains `snap: boolean` and `quietIndex: QuietIndex`.

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
export function isAway(presence: Presence, now: number): boolean {
	return now - presence.lastInputAt > FRAME.idleSleepMs
}

/**
 * Records input. Back during the idle fade-out, ambient motion eases back in from where it was; after a full idle stretch,
 * from nothing. Returns true when the visitor was away, so the worker holds the next transient back.
 */
export function notePresence(presence: Presence, now: number): boolean {
	const since = now - presence.lastInputAt
	if (since > FRAME.idleSleepMs - FRAME.idleFadeMs) presence.wokeAt = now - Math.max(0, FRAME.idleSleepMs - since)
	const wasAway = isAway(presence, now)
	presence.lastInputAt = now
	return wasAway
}

/** 0 to 1: the share of ambient motion (twinkle, drift) presence allows, easing out before the idle sleep and in after a return (P1). */
export function presenceLevel(presence: Presence, now: number): number {
	const fadingOut = smoothstep(FRAME.idleSleepMs - FRAME.idleFadeMs, FRAME.idleSleepMs, now - presence.lastInputAt)
	return (1 - fadingOut) * smoothstep(0, FRAME.idleFadeMs, now - presence.wokeAt)
}
```

These are today's `isIdle`, `idleTwinkle` and `noteInput` (`sky.worker.ts:87-114`), moved into the model with the same arithmetic, so twinkle behaves bit for bit as before (H11). The worker keeps a function named `noteInput(now)`, because the veil-owned scroll handler calls it (`:467`):

```ts
/** Records input of any kind; back from an idle stretch, no shooting star straight away. */
function noteInput(now: number): void {
	if (notePresence(presence, now)) holdMeteors(now)
}
```

- `init` sets `presence = createPresence(now)` where today it sets `lastInputAt = now` (`:421`).
- `twinkleLevel` (`:97-99`) becomes `scene.twinkle × presenceLevel(presence, now) × motionLevel(t)`. The drift rate uses the same `presenceLevel` (6.1), and `meteorsAllowed` (`:144-146`) uses `!isAway(presence, now)`: one presence gate for all ambient motion (R3 §2.5).

The main thread reports input that isn't scrolling:

```ts
// src/components/sky/mountSky.ts, beside DPR_CAP
/** Presence pings for the sky's idle clock, at most this often (ms): someone moving the pointer or typing is still here. */
const ACTIVITY_INTERVAL_MS = 1000

/** Input that shows someone is still here without scrolling. */
const ACTIVITY_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'focusin'] as const

// Inside mountSky, with the other listeners (mountSky.ts:243-247):
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

- The worker handles `activity` with `noteInput(now)`, followed by the usual `schedule(now)`.
- `FRAME.idleSleepMs`'s doc changes from "with no scroll for this long" to "with no input (scroll, pointer, keys, focus) for this long the twinkle and the drift ease out, transients pause and the worker sleeps until the visitor is back". `idleFadeMs`'s doc becomes "twinkle and drift fade out and back in around the idle sleep".
- After 90 s without input:
  1. the drift rate eases to 0 over the last 4 s;
  2. the camera comes to rest and keeps its place;
  3. no part of the sky demands frames, so the worker sleeps. The one remaining timer is for a due transient, which isn't allowed while away.
- Any input eases everything back over 4 s from the same place (AC-33). The drift resumes even in the reading scene, where no twinkle wakes the worker, because its frames follow `driftWanted`, not the eased rate (F6).

**Recommended within P4 (do it): a twinkle clock without hidden time** (R3 §6). Today, a tab hidden for a minute returns with every twinkling star at a new phase, so all of them change brightness at once. It costs a few lines and AC-32 checks it.

- `SkyFrame` gains `twinkleTime`: the worker clock minus the total time the tab spent hidden.
- The worker accumulates that total in its own `visible` handler, the way it already shifts `exitAt` (`:453`).
- Twinkle reads `twinkleTime`; meteors keep `frame.time`.

#### The motion level (P5)

Pausing, and switching reduced motion on or off, change `motion`, and the motion level eases between 0 and 1 over `FRAME.motionEase` (the worker sketch in 6.1). It scales twinkle (from P5) and the drift rate (from P6):

```ts
// FRAME (config.ts:207-221), new key
	/**
	 * Seconds over which motion stops or starts again (the pause control, a reduced-motion switch): the drift and twinkle
	 * ease out or in, so nothing stops or starts in one frame, and even the brightest star at its peak speed moves only
	 * about 1 px after a pause.
	 */
	motionEase: 0.3,
```

- **Why a finite smoothstep, not an exponential.** It ends exactly, like the codebase's other eases (the idle fade, `QUIET.ease`), so the worker knows when to stop drawing. The experience draft's exponential with a "within a thousandth" cut-off only reached 0 after 1.38 s.
- **Why 0.3 s.** It is long enough to turn today's one-frame twinkle drop into a quick fade, and short enough for R4's AC-27: the brightest star at peak speed travels 6.82 × 0.15 = 1.02 px after the switch [computed].
- **A load under reduced motion starts at level 0** (`motionChangedAt = −Infinity`), so nothing eases at start.
- **`settleMotion(now)`**, beside `settleQuiet` (`sky.worker.ts:241-243`) and called from `tick`: once the ease has run out, if the last drawn frame fell inside it, it sets `needsDraw` once (`lastDrawAt / 1000 − motionChangedAt < FRAME.motionEase && t − motionChangedAt >= FRAME.motionEase`). The last fade frame can land up to 33 ms before the end, at level 0.01 to 0.03, so without it a pause with a still camera (P5 before P6, reading at D2 = 0, software raster) would leave a trace of twinkle on screen (F7).
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

- `SceneLevels` (`scene.ts:11-18`) gains `drift: number` ("share of the drift clock's rate") in P6 and `lean: number` ("share of the pointer lean: hero only") in P7.
- `sceneAt`'s `mix` (`scene.ts:30`) widens its key to `'haze' | 'twinkle' | 'drift' | 'lean'`: one mixer for every scalar level (DRY), and "hero only" for the lean is data, not a code path. The quiet functions in `scene.ts` are not touched.
- Levels are continuous in scroll, so moving from hero to reading changes the drift *rate* smoothly over 0.5 to 1.3 viewport heights of scroll.
- **P8** renames `SceneLevels.meteors` to `launches` ("transients launch only over the hero") and `SCENE.heroMeteorMaxScroll` to `heroLaunchMaxScroll` (value unchanged, 0.4), because it then gates every kind.
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
/** Play pressed while the OS asks for reduced motion: honored for this page view only, never stored (PB1). */
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
	}
}
```

Nothing touches `window`, `matchMedia` or `localStorage` at module scope, so the module is safe to import from server-rendered client code.

**Why only a pause is stored** (deviation 7). The default respects the OS setting on every visit, and a stored "playing" can never override a reduced-motion setting turned on later. A stored "paused" is always safe to keep.

The domain-model draft tested this store's rules with 12 behavior checks:

- the default with and without reduced motion;
- a pause surviving a reload;
- Play under reduced motion lasting only for the page view;
- reduced motion turning on mid-visit;
- a pause from another tab;
- blocked storage.

H12 repeats them with the `running` flag added.

#### The control

```tsx
// src/components/sky/SkyPauseToggle.tsx (new; rendered only by Navbar, a client entry, so no 'use client' here)
import { useSyncExternalStore } from 'react'
import { PauseSVG, PlaySVG } from '@/components/icons'
import { cn } from '@/lib'
import { serverSkyPlayback, setSkyPaused, skyPlayback, subscribeSkyPlayback } from './skyPause'

interface SkyPauseToggleProps {
	className?: string
}

/**
 * The home sky's pause control (WCAG 2.2.2, techniques G4 and G186): stops the drift, twinkle, parallax and shooting
 * stars, and starts them again from where they stopped. It follows the W3C APG carousel's rotation control: the name says
 * the action and changes with it, so it carries no aria-pressed. Paused by default under prefers-reduced-motion; renders
 * nothing until a sky runs.
 */
export default function SkyPauseToggle({ className }: SkyPauseToggleProps) {
	const playback = useSyncExternalStore(subscribeSkyPlayback, skyPlayback, serverSkyPlayback)
	if (!playback) return null
	const paused = playback === 'paused'
	return (
		<button
			type="button"
			onClick={() => setSkyPaused(!paused)}
			className={cn(
				'flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-[5px] text-green transition-colors duration-250 hover:bg-green-tint forced-colors:hidden [&_svg]:h-[20px] [&_svg]:w-[20px]',
				className
			)}
		>
			{paused ? <PlaySVG /> : <PauseSVG />}
			<span className="sr-only">{paused ? 'Play sky animation' : 'Pause sky animation'}</span>
		</button>
	)
}
```

- **Glyphs.** `src/components/icons/PauseSVG.tsx` and `PlaySVG.tsx` sit on the shared `Icon` frame (`icons/Icon.tsx`), with no `title`, so they are decorative and `aria-hidden`. They use Feather's "pause" (`<rect x="6" y="4" width="4" height="16" />` and `<rect x="14" y="4" width="4" height="16" />`) and "play" (`<polygon points="5 3 19 12 5 21 5 3" />`), MIT, like the other stroke icons (`ExternalLinkSVG`, `CalendarSVG`). Each has a default export and a named re-export in `icons/index.ts`. Their size comes from the button (`[&_svg]:…`), because the icon components take no props.
- **The pattern.** The W3C APG carousel's rotation control says: "The label changes to match the action the button will perform", and "since the label changes, the rotation control does not have any states, e.g., aria-pressed". The APG Button pattern sanctions the same choice: "if the design were to call for the button label to change from 'Mute' to 'Unmute,' the aria-pressed attribute would not be needed" (both fetched 2026-10-27). The glyph and the name agree for every user: two bars and "Pause sky animation" while the sky moves, a triangle and "Play sky animation" while it holds still.
- **Targets and contrast.** The target is 40 × 40 CSS px; WCAG 2.5.8 needs 24 × 24. The glyph carries the state at 14.1:1 (green `#64ffda` on navy `#0a192f`) and 12.7:1 on the mobile menu's light navy [computed]. A state shown only by a 10% mint fill would be 1.28:1 and fail 1.4.11. The focus ring is the global `:focus-visible` rule, a 2 px dashed green outline (`globals.css:80-83`).
- **Forced colors.** `forced-colors:hidden`, because forced colors hide the sky (`Background.module.css:27-31`).
- **Hydration.** `useSyncExternalStore` uses `getServerSnapshot` "only during server rendering and during hydration" (react.dev). Both are `null`, so they agree, and React re-renders with the real state right after. In this app the visible navbar never hydrates anyway: IntroGate remounts its children with a key flip when the loader lifts (`IntroGate.tsx:94-100`), so the control the visitor sees mounts fresh on the client.
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
	<SkyPauseToggle className="ml-[10px] md:ml-[15px]" />
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
// motion() (mountSky.ts:149) reads the store; the store owns the reduced-motion query for the sky
const motion = (): SkyMotion => (forcedColors.matches ? 'off' : skyPaused() ? 'reduced' : 'full')
let sentMotion = motion()
// Post only real changes: the store also notifies when the sky starts or stops running
const syncMotion = () => {
	const next = motion()
	if (next === sentMotion) return
	sentMotion = next
	post({ type: 'motion', motion: next })
}
const stopPlayback = subscribeSkyPlayback(syncMotion)
```

- `mountSky`'s own `reducedMotion` query, its import and its `change` listener (`:3`, `:146`, `:245`) go, because the store watches the query. The `forcedColors` listener stays and calls `syncMotion`.
- `init` posts `motion: sentMotion`.
- The worker-message listener (`:261-268`) becomes a `switch (event.data.type)`: `'ready'` sets `canvas.dataset.ready` and calls `setSkyRunning(true)`, `'error'` calls `destroy`, and a `never` default makes any new message type a compile error. Today's `else destroy()` would tear the sky down on the first new message (P13's `relay`, the debug patch's `debug-frame`), and TypeScript wouldn't flag it.
- `destroy` (`:249-259`) calls `stopPlayback()` and `setSkyRunning(false)`. A failed sky (an `'error'` message or a worker error) goes through `destroy`, so the control disappears with it.
- **No new worker message.** A pause arrives as `motion: 'reduced'`, the pipeline today's reduced motion already uses (PB3; R2 §9.4, R3 §11).
- `protocol.ts:26-32`: the `reduced` doc becomes "prefers-reduced-motion, or the visitor paused the sky (skyPause.ts): fades and brightness only".
- `AGENTS.md` gains one line under the sky notes: "The sky's pause control (`src/components/sky/SkyPauseToggle.tsx`, state in `skyPause.ts`) is its WCAG 2.2.2 mechanism: it maps to the worker's `motion: 'reduced'`, and any new continuous sky motion must stop under it."

### 6.9 The transient system (P8; blocked on the veil commit)

#### Rules the visitor would notice if they broke

- One transient near the copy at a time, then a rest before the next crossing (the one-lane bridge).
- Any two launches at least 3 s apart: onsets draw the eye, so they never stack (R4 AC-18).
- Everything ends through light: a fade, never a cut.
  - When the page scrolls 16 px from a transient's launch, or the visitor pauses, it fades out over 0.2 s (R2 §9.4: "fade out over 200 ms or less (a frozen streak looks broken)").
  - Hiding the tab or resizing drops it at once: nobody sees it, or its plan no longer fits the copy.
- At most 5 s from first light to last.

#### Types

```ts
// src/lib/sky/transients.ts (new)
import { METEOR, TRANSIENTS } from './config'
import { meteorLifetime, meteorMoving, nextMeteorGap, planMeteor, type Meteor, type MeteorField, type Point } from './meteors'
import { EVERY_FRAME, FADE_FRAMES, NO_FRAMES, type FrameDemand } from './pacing'
import { between, type Random } from './random'
import { smoothstep } from './scene'
// P11 adds: import { planSatellite, satelliteMoving, type SatellitePass } from './satellites' (and SATELLITE)

/** The model behind each kind: what its planner returns and its drawing reads. P11 adds `satellite: SatellitePass`. */
export interface TransientBodies {
	meteor: Meteor
}

/** One kind of transient. */
export type TransientKind = keyof TransientBodies

/** Every kind, in launch-check order (shooting stars first: they are the most frequent). */
export const TRANSIENT_KINDS = ['meteor'] as const satisfies readonly TransientKind[]

/** What the scheduler tracks for a transient of kind K. Times are seconds on the worker clock. */
export interface TransientEnvelope<K extends TransientKind> {
	kind: K
	body: TransientBodies[K]
	startedAt: number
	/** First light to last (s), wake, train and fades included; set once at launch from the kind's spec (T1). */
	lifetime: number
	/** Its light may fall within QUIET.feather of quiet copy: it holds the ink lease until it retires (T2). */
	nearCopy: boolean
	/** scrollY at launch: the scroll cancel measures from here (T4). */
	launchScrollY: number
	/** When a cancel began (scroll, pause): it fades out over TRANSIENTS.cancelFade. Null while it runs its course. */
	cancelledAt: number | null
}

/** A transient in the sky: its kind's body plus what the scheduler tracks for every kind. */
export type Transient = { [K in TransientKind]: TransientEnvelope<K> }[TransientKind]

/** The member of Transient for one kind. */
export type TransientOf<K extends TransientKind> = Extract<Transient, { kind: K }>

/**
 * What a visit remembers between launches. P8: the sticky radiant, as the veil commit leaves it. P9: the visit's sky
 * (VisitSky). P10: when the last fireball flew. A hidden tab keeps all of it; forgetVisitSky and a failed meteor launch
 * clear only the radiant (P8) or the sky (P9), and nothing clears the last fireball's time within a page view (R1).
 */
export interface VisitMemory {
	radiant: Point | null
}

/** What a planner gets: the moment, the field, the visit's memory, and whether its light may reach quiet copy. */
export interface PlanContext {
	random: Random
	/** Worker-clock seconds: the transient's start. */
	now: number
	/** Viewport and padded quiet rects on screen (CSS px). */
	field: MeteorField
	visit: VisitMemory
	/** The ink lease is free and the crossing cooldown is over; otherwise the plan must stay in clear sky. */
	mayCrossCopy: boolean
	narrow: boolean
	/** Seconds since the reveal, from the launch gate: fireballs wait METEOR_KINDS.fireball.after. (P10) */
	sinceReveal: number
}

/** A plan: the body, and whether its light may reach quiet copy (it then takes the ink lease). */
export interface Planned<K extends TransientKind> {
	body: TransientBodies[K]
	nearCopy: boolean
}

/** How one kind is timed and planned. Drawing lives with the canvas code (drawTransient in renderSky.ts). */
export interface TransientSpec<K extends TransientKind> {
	/** Seconds after the reveal before this kind's first attempt. */
	firstDelay(random: Random): number
	/** Seconds after a launch until the next attempt: the body's own time, then the kind's gap (stretched on long visits). */
	nextAfter(body: TransientBodies[K], random: Random, sinceReveal: number, narrow: boolean): number
	/** A plan for this moment, or null when nothing fits (T3: through the veil checks when it may reach quiet copy). */
	plan(context: PlanContext): Planned<K> | null
	/** First light to last (s). */
	lifetime(body: TransientBodies[K]): number
	/** True while it moves on screen: it needs every animation frame. */
	moving(body: TransientBodies[K], now: number): boolean
	/** It may launch on narrow screens. */
	narrow: boolean
}
```

The registry makes a missing spec a compile error, and the drawing switch makes a missing drawer one too:

```ts
/**
 * The meteor kind's planner: the veil session's planMeteor with the agreed `nearCopy` option, and today's retry of fresh
 * radiants when the current one leaves no path (sky.worker.ts:207-212, as their commit leaves it). From P9 it picks the
 * visit's sky when there is none (pickVisitSky) and tries the aim visitAim draws, then up to METEOR.radiantTries fresh
 * aims (1 on narrow screens), each a new source and scatter (I2). If their commit splits planMeteor's long pass from its
 * fallback so that fresh radiants are tried before falling back (COORDINATION.md), it keeps that order: the long pass
 * over the first aim and each fresh one, then the fallback over the same aims (a pass in PlanOptions, or their two entry
 * points; CP-5 settles which). When none fits it clears the visit's sky, as today's loop drops a failed radiant
 * (sky.worker.ts:214), so the next attempt starts from a fresh one (R1).
 */
function planMeteorTransient(context: PlanContext): Planned<'meteor'> | null

/** Every kind's timing and planning. */
const SPECS: { [K in TransientKind]: TransientSpec<K> } = {
	meteor: {
		firstDelay: (random) => between(random, METEOR.firstDelay[0], METEOR.firstDelay[1]),
		// P8: today's law (gap after the flight, ×1.5 after 180 s); P9: nextGap(random, METEOR_RATE.hero or .narrow, sinceReveal)
		nextAfter: (meteor, random, sinceReveal) => meteor.duration + nextMeteorGap(random, sinceReveal),
		plan: planMeteorTransient,
		lifetime: meteorLifetime,
		moving: meteorMoving,
		narrow: true,
	},
	// P11 adds the satellite kind (6.11)
}
```

#### The scheduler

```ts
/** Whether and where transients may launch now; the worker fills it from its own state every tick (T6). */
export interface LaunchGate {
	/** Full motion, visible, revealed, the visitor present and the hero scene (SceneLevels.launches). */
	allowed: boolean
	/** No scroll for FRAME.meteorScrollQuietMs. */
	settled: boolean
	narrow: boolean
	sinceReveal: number
	scrollY: number
	field: MeteorField
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
	/** Before this (s) every plan stays in clear sky: the crossing cooldown after the last lease began (T2). */
	crossingAfter: number
	visit: VisitMemory
}

export function createSchedule(): TransientSchedule
/** Starts each kind's clock at the reveal with its own first delay. */
export function revealTransients(schedule: TransientSchedule, random: Random, now: number): void
/** No launch for TRANSIENTS.afterReturn s (back to the tab, back from idle, back to full motion: today's holdMeteors). `now` in seconds. */
export function holdTransients(schedule: TransientSchedule, now: number): void
/**
 * One tick: starts the cancel fade of anything the page scrolled away from, retires what has finished, then launches each
 * kind that is due and allowed. Returns true when anything changed, so the worker redraws.
 */
export function updateTransients(schedule: TransientSchedule, random: Random, now: number, gate: LaunchGate): boolean
/** Fades every active transient out over TRANSIENTS.cancelFade (pause, reduced motion). */
export function cancelTransients(schedule: TransientSchedule, now: number): void
/** Removes every active transient at once (hidden tab, resize: their paths belonged to the old layout); the visit's memory stays. */
export function dropTransients(schedule: TransientSchedule): void
/** A new layout may have room again: kinds stopped after TRANSIENTS.maxFailedPlans failures retry after TRANSIENTS.retry (today's retryMeteors, on every layout message). `now` in seconds. */
export function retryTransients(schedule: TransientSchedule, random: Random, now: number): void
/** The viewport changed (from P8), or the quiet rects did (from P9): the next meteor plan picks afresh, the radiant in P8 and the visit's sky from P9 (R1). */
export function forgetVisitSky(schedule: TransientSchedule): void
/** Every animation frame while one moves (cancel fades included), fade frames while one lingers (a train), else none. */
export function transientDemand(schedule: TransientSchedule, now: number): FrameDemand
/** The earliest next attempt of any kind (s), for the one timer a sleeping worker keeps. */
export function nextLaunchAt(schedule: TransientSchedule): number
/** 1 while a transient runs its course, falling to 0 over TRANSIENTS.cancelFade once cancelled: its drawing's light multiplier. */
export function cancelFade(transient: Transient, now: number): number {
	return transient.cancelledAt === null ? 1 : 1 - smoothstep(transient.cancelledAt, transient.cancelledAt + TRANSIENTS.cancelFade, now)
}

/** The ink lease is free: no active transient's light may reach quiet copy, and the crossing cooldown is over (T2). */
export function inkLeaseFree(schedule: TransientSchedule, now: number): boolean {
	return now >= schedule.crossingAfter && !schedule.active.some((transient) => transient.nearCopy)
}
```

**One tick of `updateTransients`**, in order, each rule once:

1. **The scroll cancel (T4).** Each active transient with `cancelledAt === null` whose launch scroll is too far from `gate.scrollY` gets `cancelledAt = now`.
   - The test is the veil session's agreed kind-agnostic helper: it "takes the launch scrollY, the current scrollY and the fade state" (COORDINATION.md log, item 2).
   - Until it exists, and in PF, it is `Math.abs(gate.scrollY - launchScrollY) > TRANSIENTS.scrollCancel`.
   - Ticks run on every animation frame while the page scrolls under full motion, so the rule acts within a frame of the threshold.
   - The veil-owned `scroll` handler keeps only recording `scrollY` (I3).
2. **Retire** each transient at the earlier of `startedAt + lifetime` and `cancelledAt + cancelFade` (T1: a cancel never extends a life).
3. **For each kind in `TRANSIENT_KINDS`:**
   1. *Not due* (`now < nextAt[kind]`): skip.
   2. *Held back* (one of the following): set `nextAt[kind] = now + TRANSIENTS.recheck`.
      - `!gate.allowed` or `!gate.settled`;
      - on a narrow screen only: a kind with `!spec.narrow`, or `launched >= TRANSIENTS.narrowLimit`;
      - an onset within `TRANSIENTS.minOnsetGap` (T5);
      - one of this kind already active (T7);
      - from P11, until the veil session agrees to I9 (and under PF): a `nearCopy` transient is active (T7 already holds a second meteor, so this holds only the kinds that never take the lease).
   3. *Plan* with `mayCrossCopy: inkLeaseFree(schedule, now)`. From P11, until I9 is agreed (and under PF), also only while no other transient is active and no comet shows, so the rule runs both ways and no never-lease transient ever shares the sky with a lease holder (I9).
      - If the plan is null, `failedPlans[kind]++`. Retry after `between(random, ...TRANSIENTS.retry)`, or after `maxFailedPlans` wait for a new layout (`Infinity`), as today (`sky.worker.ts:213-218`).
      - The scheduler resets nothing else. From P9 the meteor planner has already cleared `visit.sky` (its doc above), so each strike tries a fresh sky, and `maxFailedPlans` strikes in a row mean the layout has no room, not that one sky was bad.
      - A plan whose lifetime exceeds `TRANSIENTS.maxLife`, or that reports `nearCopy` when `mayCrossCopy` was false, counts as failed: T1 and T2 are enforced at the one place every transient enters the sky, whatever a planner does.
   4. *Launch.* Push the envelope with `startedAt: now`, `launchScrollY: gate.scrollY` and `cancelledAt: null`.
      - `schedule.active.push(envelope as Transient)` is the one cast: TypeScript can't see that `TransientEnvelope<K>` is a member of the union for a generic `K` (microsoft/TypeScript#30581, R3 §7.4).
      - Then set `lastOnsetAt = now` and `failedPlans[kind] = 0` (as today, `sky.worker.ts:220`), increment `launched`, set `crossingAfter = now + TRANSIENTS.crossingCooldown` if `nearCopy`, and set `nextAt[kind] = now + spec.nextAfter(body, random, gate.sinceReveal, gate.narrow)`. Gaps count from the end of the body's own time, as today, so meteors never overlap.

The ink lease is not an object. It is held by whichever active transient has `nearCopy`, so it is released the moment that transient retires and can never leak or go stale.

```ts
// src/lib/sky/config.ts (P8)
/**
 * Every short-lived sky event (shooting stars, satellites): at most `maxLife` seconds from first light to last, wake,
 * train and fades included (WCAG 2.2.2's 5 s, per animation); onsets at least `minOnsetGap` seconds apart, since a motion
 * onset draws the eye; one of each kind at a time; on narrow screens at most `narrowLimit` per visit. Only one transient at
 * a time may plan its light onto quiet copy (it holds the ink lease: METEOR_VEIL's contrast budget is for one), and the
 * next may do so only `crossingCooldown` seconds after the last lease began, so copy crossings stay as rare as before
 * (0 in P8, which launches exactly as today; from P9 set from the crossing share measured on captured layouts, 55 to start).
 * Once the page scrolls `scrollCancel` px from where it was at a launch, that transient's veil no longer matches the copy,
 * so it fades out over `cancelFade` seconds, as it does when the visitor pauses the sky. A plan that finds no room waits
 * `retry` seconds; after `maxFailedPlans` in a row the kind waits for a new layout. A held launch looks again after
 * `recheck` seconds; after a return (tab, idle, full motion) nothing launches for `afterReturn` seconds.
 */
export const TRANSIENTS = {
	maxLife: 5,
	minOnsetGap: 3,
	narrowLimit: 2,
	crossingCooldown: 0,
	scrollCancel: 16,
	cancelFade: 0.2,
	retry: [5, 9],
	maxFailedPlans: 3,
	recheck: 1,
	afterReturn: 3,
} as const
```

**Changes to `METEOR` in P8 and P9.**

- P8 moves `retry`, `maxFailedPlans`, `recheck`, `afterReturn` and `narrowLimit` out of `METEOR` (`config.ts:246-255`, `:289`), because they now apply to every kind.
- `narrowLimit` stays 2 in P8 (no visible change) and becomes 6 in P9.
- P9 adds `TRANSIENTS.longVisit: { from: 120, scale: 240, max: 3 }` and its doc sentence: "From `longVisit.from` seconds after the reveal every gap stretches by 1 + (t − from) / `longVisit.scale`, at most `longVisit.max` times (half the rate at 6 minutes, a third at 10), so a long visit never turns into a screensaver".
- **Placeholders.** `scrollCancel` (16 px, the conservative end of the veil session's "about 16-24 px") and `cancelFade` (0.2 s, R2's limit) are placeholders: adopt the veil session's numbers at the rebase.
- **The cooldown.** `crossingCooldown` is 0 in P8: one meteor flies at a time with today's 30 s floor, so P8 launches exactly as the oracle does (H7). P9 starts it at 55 s with the new rate and accepts it on "crossings per minute at or below today's over the same window" (AC-38; deviation 11). It is a two-way knob: on captured layouts, set it to the smallest multiple of 5 s whose H9 rate is at or below today's on the same layouts, raising it as readily as lowering it. Today's is measured with today's planner over a visit's first two minutes; with no cooldown it is about its crossing share × 1.6 launches a minute (0.576 at R2's synthetic share of 0.36). The table's parity row is against that synthetic 0.576, so recompute it against the captured bar. By the share of flights that cross copy [computed]:

  | Crossing share | 0.16 | 0.19 | 0.22 | 0.25 | 0.30 | 0.36 |
  |---|---|---|---|---|---|---|
  | Crossings a minute at 55 s | 0.518 | 0.578 | 0.632 | 0.681 | 0.749 | 0.817 |
  | Cooldown at parity | 37 s | 57 s | 72 s | 82 s | 93 s | 100 s |
  | Setting (5 s steps) | 40 s | 60 s | 75 s | 85 s | 95 s | 100 s |

  Above a share of about 0.3 the cooldown passes 90 s; there a slower `METEOR_RATE.hero` is the better lever.

`random.ts` gains `export type Random = () => number`, used by every new signature; existing signatures keep `() => number`.

#### The gap law (P9)

```ts
// src/lib/sky/config.ts (P9), next to METEOR_RATE and SATELLITE, which use it
/** Poisson arrivals with a refractory floor and a cap: floor + Exp(mean), at most cap (s). */
export interface GapLaw {
	floor: number
	mean: number
	cap: number
}

// src/lib/sky/transients.ts
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
/** Draws one transient at the frame's time, faded by its cancel; a kind without a case fails to compile. */
export function drawTransient(ctx: OffscreenCanvasRenderingContext2D, assets: SkyAssets, transient: Transient, frame: SkyFrame): void {
	const fade = cancelFade(transient, frame.time)
	switch (transient.kind) {
		case 'meteor':
			drawMeteor(ctx, assets, transient.body, frame, fade)
			return
		// P11: case 'satellite': drawSatellite(ctx, assets, transient.body, frame, fade); return
		default: {
			// Narrowed to never once every kind has its case; `transient.kind` would not compile here (TS2339)
			const unknown: never = transient
			return unknown
		}
	}
}
```

It uses a `switch` with a `never` check rather than a record of drawers, because TypeScript can't correlate a union member with a record of per-member functions without a cast (microsoft/TypeScript#30581, R3 §7.4). `drawMeteor`'s `fade` multiplies its train, wake, glow and core alphas (I7). If the veil session declines I7, the plan adds it after the rebase. Until either lands, a cancelled meteor is dropped at once, as today.

#### In the worker (P8)

- `meteor`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt` (`sky.worker.ts:61-66`) become `const transients = createSchedule()`. Not `schedule`: that name is the frame scheduler, `function schedule(now)` (`:152`), which the message listener and our own functions call (a second declaration is TS2300).
- `updateMeteor` (`:193-224`) becomes one `updateTransients(transients, random, t, launchGate(now))` call; when it returns true, set `needsDraw`.
  - `launchGate` is built from today's `meteorsAllowed` (`:144-146`) and the scroll-quiet test (`:202`).
  - Its field is today's: `{ width, height, quiet: screenQuietZones(quiet, scrollY, pinned) }` (`:206`), as the veil commit leaves it.
- `holdMeteors(now)` and `retryMeteors(now)` become `holdTransients(transients, now / 1000)` and `retryTransients(transients, random, now / 1000)`: today's callers pass worker milliseconds and convert inside (`:103`, `:345`), while the schedule keeps seconds. `reveal` calls `revealTransients`.
- The `motion` handler's `meteor = null` (`:441`) becomes `cancelTransients(transients, t)`. Hidden and resize call `dropTransients` (`:448`, `:370`).
- Every line outside the planner that clears the radiant becomes `forgetVisitSky(transients)`, so P8 forgets exactly when the oracle does (H7): `resize`'s `radiant = null` (`:369`), and any such line their commit adds (a layout, if their sticky radiant re-picks there). A hidden tab keeps it (R1). From P9 a layout calls it only when its quiet rects change, where the new rects take effect: today the handler's `!sameRects` branch (`:475-481`); after their commit, wherever a deferred layout replaces `quiet` and `pinned` (8.6).
- `frameDemand`'s meteor line becomes `transientDemand(transients, t)`, and the sleeping timer uses `nextLaunchAt(transients)`.
- `draw` (`:270-283`) calls `drawTransient` for each active transient.
- The scroll cancel moves out of the scroll handler into `updateTransients` (the veil session's helper, ported; I3).

### 6.10 The meteor population model and speed classes (P9; blocked on the veil commit)

#### What it buys the visitor

Directions come from real geometry instead of one diagonal (R2 §4).

- **The direction mix.** At a window pitched 40°, about 75% of real meteors fall, 13.5% slant sideways and 11% climb, evenly left and right, for starts across the whole width (R2 §4.3). The plan keeps today's right-hand spawn area, where paths run away from vanishing points that mostly lie farther left, so planned launches (with D8's default guard and the end guards below) come out at about 76% falling, 17% sideways and 7% climbing, and about 57% head right, away from the left-aligned copy [computed].
- **The shower.** Meteors from the visit's shower fan out from a shared vanishing point (when the radiant is behind the viewer, they converge toward the opposite point instead, R2 §4.2).
- **The radiant on screen.** On 15% of desktop visits the shower radiant sits on screen in open sky (never on phones: nearly all of their spawn area lies within 25° of any on-screen radiant, mean 13.5°, where paths are too short for anything but stubs [computed]). Its meteors there are short, slow stubs, and with D4 the head-on ones become point flashes.
- **Speed and color.** Speed and wake color vary by class: quick ones cool to mint, slow ones glow warm, medium ones stay white.

#### Config

```ts
// src/lib/sky/config.ts (P9)
/**
 * The screen as a window on the sky, for the geometry of shooting stars and satellites: its longer side spans `fov`
 * degrees and its centre looks `elevation` degrees above a horizon just below the screen, so a 16:10 window spans about 18°
 * at its bottom corners to 60° at the top of its centre (twinkle already grows toward the bottom, TWINKLE_HORIZON_GAIN).
 * Today's nominal speed, 0.2 long sides a second, is 12°/s here, a medium meteor (IMO: 3 to 25°/s). Shooting stars glow
 * about `meteorHeight` km up over a planet of radius `earthRadius` km, so lower in the window they are farther away:
 * slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeight: 100, earthRadius: 6371 } as const

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
	/** Angular speed 90° from the radiant at the window's centre (°/s). */
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
 * 25 to 100 minutes, or one every 2 to 4 at a Perseid or Geminid peak. The hero compresses that about 120 times, a
 * time-lapse of a strong shower night: gaps after each flight follow `hero` (floor 4 s plus an exponential 8 s, at most
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
 * distance at the top of the spawn area (so none ever brightens past `normal`, under the 0.9 METEOR_VEIL's budget
 * assumes), never below `rangeFloor` of its peak. On average they peak at about 0.6 of today's 0.83, about 1 in 8 under
 * 0.3; raise `normal` and `rangeFloor` (within the 0.9 bound) if they read too faint. Fireballs peak at 1 and stay in
 * clear sky.
 */
export const METEOR_BRIGHTNESS = { faintShare: 0.3, faint: [0.3, 0.5], normal: [0.6, 0.85], rangeFloor: 0.6 } as const
```

`GapLaw` and `WakeColor` live in `config.ts`, like `LayerConfig` and `HazePool`, so the config never depends on the modules that read it. `METEOR_LOOK.fireballTint` (palette index 5, pale yellow) also serves slow meteors' warm wakes. No second key holds the same color. The last sentence of `METEOR_LOOK`'s doc becomes: "Fast wakes cool to --color-green mixed `mintToWhite` toward --color-white, medium ones stay white, and slow wakes and fireballs warm to palette index `fireballTint` (pale yellow)."

**Removed in P9**, with I2 or after PF (dead keys mislead the next tuner, and the dead locals and parameter would trip `@typescript-eslint/no-unused-vars`, `eslint.config.mjs:13`):

- `METEOR.gapMin`, `gapMeanExtra`, `gapMax`, `slowAfter`, `slowFactor`, `angle`, `radiantX`, `radiantY`, `radiantJitter` and `trainSpeedShare`;
- the keys I2 orphans, since speed, duration and peak now come from the aim: `METEOR.speedShare`, `speed`, `narrowSpeed`, `narrowDuration`, `narrowFallbackDuration` and `peak` (`duration`, `fallbackDuration` and `speedJitter` stay: the aim reads them);
- in `planFlight`, the `timing` parameter (a `fallback` flag replaces it) and the `minSpeed`, `maxSpeed` and `nominalSpeed` locals (`meteors.ts:130-131`);
- the functions `pickRadiant` and `nextMeteorGap`.

`METEOR.radiantTries` stays (its one reader, `sky.worker.ts:209`, moves into `planMeteorTransient`) with a new meaning and doc: "Fresh aims (a new source and scatter from the visit's sky) tried per launch when the first leaves no path; narrow screens try one." The inner docs of the keys that stay are rewritten:

- `attempts` (`config.ts:250`): "Candidate start points tried per aim for long flights, and again for the fallback."
- the flight block (`:270-274`): "Normal flights' duration range (s), and the fallback pass's shorter one where no long flight fits (a short laptop window, a phone held sideways); the aim scales its class's durations by fallbackDuration[1] / duration[1] on that pass. Each flight's speed spreads by `speedJitter`; speeds and durations otherwise come from SPEED_CLASSES."
- the narrow block (`:283`): "Narrow screens: paths at least `narrowMinPath` px and at most `narrowMaxPathShare` of the width."
- the train (`:305`): "A faint persistent train behind some fireballs and fast flights (SPEED_CLASSES' `train`)."

`METEOR`'s doc (`config.ts:231-234`) becomes: "Shooting stars: where they start, the layout guards, their length, drag, wake, flares and trains. Directions, speeds and brightness come from the visit's sky (RADIANTS, SPEED_CLASSES, METEOR_BRIGHTNESS) and rates from METEOR_RATE. Each lights up and peaks in clear sky and may burn out behind quiet copy, veiled (METEOR_VEIL)." `spawnX` and `spawnY` stay: R2 measured today's spawn area accepting 37% of candidates under the new mix, against 21% across the full width.

#### `src/lib/sky/radiants.ts` (new)

```ts
import { METEOR, METEOR_BRIGHTNESS, RADIANTS, SKY_WINDOW, SPEED_CLASSES } from './config'
import type { Aim, Flight, MeteorField, Point } from './meteors'
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
	/** Elevation of the screen centre (radians). */
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

/** A visit's sky (R1): the window, the shower and the sporadic sources; picked afresh after a resize, a change of the quiet rects or a failed launch. */
export interface VisitSky {
	window: SkyWindow
	shower: Source
	sporadic: readonly Source[]
	/** Where the shower radiant sits on screen (RADIANTS.onScreen of visits), else null. */
	showerOnScreen: Point | null
}

export function skyWindow(width: number, height: number): SkyWindow
/** A visit's sky: radiants with elevation density sin h cos h; the shower on screen in clear sky on RADIANTS.onScreen of visits. */
export function pickVisitSky(random: Random, field: MeteorField): VisitSky
/** One launch's aim: a source (the shower with RADIANTS.showerShare, else a sporadic one) and its scattered radiant. */
export function visitAim(random: Random, sky: VisitSky): Aim
/** Screen direction and speed factor at (x, y) for a meteor from `radiant` (R2 §4.2), or null at the radiant itself. */
export function radiantMotion(view: SkyWindow, radiant: SkyDirection, x: number, y: number): { dirX: number; dirY: number; rate: number } | null
/** Elevation (radians) behind screen point (x, y). */
export function elevationAt(view: SkyWindow, x: number, y: number): number
/** Range (km) to the meteor layer at elevation h: 100 km overhead, about 172 km at 35° and 477 km at 10°. */
export function meteorRange(h: number): number
```

`radiantMotion`, `elevationAt`, `meteorRange`, `toward` and `sampleRadiant` are R2 §10's sketches as written. R2 checked the screen-speed formula against finite differences, and the experience draft re-derived:

- the gnomonic image direction (u·r_z − r_x, v·r_z − r_y);
- the asin(√U) elevation sampling for density sin h cos h;
- the inverse of the window rotation in `elevationAt`.

`random.ts` gains `gaussian(random)` (Box-Muller) for the scatter: `Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())`. It takes `1 - random()`, as `nextGap` does, because `random()` can return 0 and log(0) would make a NaN radiant.

**`pickVisitSky`, step by step** (no draft or report has its body):

1. `view = skyWindow(field.width, field.height)`.
2. **On screen**, on `RADIANTS.onScreen` of wide-screen visits (never on narrow screens): up to 20 points uniform in [`METEOR.edgeMargin`, width − `edgeMargin`] × [`METEOR.top`, `onScreenTop` × height], keeping the first with `quietAt(field.quiet, x, y) === 0` whose shower passes the usability test (below). The shower radiant is the direction through it, ((x − cx) / focal, (y − cy) / focal, 1) normalized, and `showerOnScreen` is the point. If none passes, go to step 3. Without the test, a radiant low in the spawn area sends most shower paths climbing: 20 to 23% of on-screen showers at 1440 × 900 would fail it [computed, check report].
3. **Off screen**: `sampleRadiant`, resampled (up to 50 tries, then the last is kept) while its vanishing point (r_z > 0) lies inside the viewport, so on-screen radiants come only from step 2 (R2 measured 13% of visits by chance, which would make the total about 26%), or while the shower fails the usability test. A shower sitting low in front of the window otherwise climbs from every start in about 6% of visits, so D8's default rejects every shower launch [computed].
   - **The usability test** (steps 2 and 3): at least 8 of 16 probes give a non-null `radiantMotion` with `dirY ≥ −sin(climbDegrees)`. The probes are a 4 × 4 grid at the cell centres of `METEOR.spawnX` × `METEOR.spawnY`, each y clamped to `METEOR.top` as the planner clamps its starts (`meteors.ts:138`), so the test is deterministic.
4. The shower's speed class is uniform over `SPEED_CLASSES`. The three sporadic sources come from `sampleRadiant`, one per class, with no on-screen test (their near-radiant paths fail the 160 px minimum and are resampled); under D8's alternative, each also passes step 3's usability test at 10°.
5. `visitAim` picks the shower with `showerShare`, else a sporadic source uniformly, and moves its radiant by two tangent-plane offsets of `gaussian(random) × scatter`, renormalized.

**The aim at a start point** (`visitAim`'s closure; R2 §4.2 to §4.4):

1. `motion = radiantMotion(view, scattered, start.x, start.y)`. If it is null, no flight starts here.
2. `climbing = motion.dirY < −sin(RADIANTS.climbDegrees°)`. A climbing path from the shower is rejected (null), and the planner resamples. Under D8's alternative, any path with `motion.dirY < −sin(10°)` is rejected instead, which is about 13% of candidates.
3. `range = meteorRange(elevationAt(view, start.x, start.y)) / meteorRange(view.pitch)`.
4. `speed = SPEED_CLASSES[class].angular × π/180 × view.focal × motion.rate × jitter / range`, with `jitter` drawn from `METEOR.speedJitter`.
5. `duration` is the class's range. On the planner's fallback pass it is scaled by `METEOR.fallbackDuration[1] / METEOR.duration[1]`.
6. `pathShare = climbing ? RADIANTS.climbShare : 1`.
7. `minPath = RADIANTS.nearRadiantPath` when the aim's source is the shower and `showerOnScreen` lies within `RADIANTS.nearRadiant`° of `start` (only shower meteors are foreshortened there; a sporadic stub would point anywhere and blur the radiant); otherwise null, so the planner keeps its own minimum (160 px, or 110 on narrow screens).
8. `peak = between(random, ...(random() < METEOR_BRIGHTNESS.faintShare ? faint : normal)) × max(rangeFloor, (rangeTop / meteorRange(elevationAt(view, start.x, start.y)))²)`, with `rangeTop = meteorRange(elevationAt(view, view.cx, METEOR.top))`: the nearest point of the spawn area, so the factor never exceeds 1 and a start on the window's centre row dims to about 0.6. Measuring against the window's centre instead (1 / range²) would brighten nearly every flight, since the spawn area lies above the centre: 38% of laptop flights would pass 0.9 and some reach 1.37 [computed].
9. `wakeColor` and `train` come from the class.

#### What the veil planner accepts (I1 theirs, I2 ours after the rebase)

```ts
// src/lib/sky/meteors.ts, after the rebase
/** How a shooting star launched at a start point flies; the planner keeps start sampling, the layout guards and the veil. */
export interface Flight {
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
	/** Peak brightness, 0 to 0.9: METEOR_VEIL's budget assumes at most 0.9 (fireballs, clear sky only, peak at 1 regardless). */
	peak: number
	/** The color the wake cools to (SPEED_CLASSES). */
	wakeColor: WakeColor
	/** A persistent train is possible here. */
	train: boolean
}

/** Direction, speed and timing for a start point the planner picked; null when no shooting star starts there. */
export type Aim = (random: Random, start: Point, fallback: boolean) => Flight | null

/** What one launch allows (an options object, as agreed with the veil session). */
export interface PlanOptions {
	/** The path may pass within QUIET.feather of quiet copy (burning out veiled); false keeps it in clear sky. (I1, theirs) */
	nearCopy: boolean
	/** Where shooting stars go from each start point. (I2, ours: P9) */
	aim: Aim
	/** This launch is a fireball: clear sky only, METEOR_KINDS.fireball timing, peak 1. (P10) */
	fireball: boolean
}

export function planMeteor(random: Random, field: MeteorField, now: number, options: PlanOptions): Meteor | null
// Meteor gains: nearCopy (I1: the path passes within QUIET.feather of quiet copy, so it holds the ink lease) and
// wakeColor (P9; today's Meteor.wake stays the afterglow time constant, meteors.ts:39-40)
```

**Inside `planFlight`.** I2 replaces three things with one call to `options.aim(random, start, fallback)`:

- the lines that compute `away`, `dirX`, `dirY` and `below`;
- the 18 to 42° filter (`meteors.ts:140-145`);
- the speed and duration lines (`:147-152`).

`length = min(maxPath × flight.pathShare, flight.speed × duration)` and `minPath = flight.minPath ?? minPath`. Train eligibility becomes `(flight.train || fireball) && random() < METEOR.trainChance`, instead of the `jitter >= METEOR.trainSpeedShare` test (`:165`).

**Fireballs keep their own speed and timing.** The lines I2 replaces also give a fireball attempt its slower, longer flight (`:148-149`). So a fireball flies the aim's direction at `flight.speed × METEOR.fireballSpeedScale`, for a duration drawn from `METEOR.fireballDuration` in P9 and from `METEOR_KINDS.fireball.duration` from P10, with peak 1, `fireballDrag`, `fireballWake` and today's clear-sky rule. Until P10, the per-attempt draw (`:135`, `METEOR.fireballChance`, 8%) stays as today.

**I2 also completes the end test** (`:156`). Today's guards cover only right-to-left falling paths: `METEOR.top` clamps the start alone (`:138`), and the end test checks the left edge and `maxEndY` only. With the new directions, 16% of accepted laptop flights would end past the right edge and 8.5% above the navbar's 110 px, many leaving the screen still bright (AC-22) [computed, check report]. So the end test also rejects `end.x > width − METEOR.edgeMargin` and `end.y < METEOR.top`: with both ends on screen, the straight path never leaves it and never ends under the navbar. It touches no veil rule.

**I2 keeps the ink budget's peak.** Every flight that may take the lease has `flight.peak ≤ 0.9`, the peak METEOR_VEIL's budget assumes (`config.ts:316-318`); the aim's step 8 gives at most 0.85, and H10 asserts it.

**Everything else stays the veil session's:**

- the start-point sampling;
- the layout guard values: 110 px under the navbar, the 12 px edge margin, ends above 0.72 of the height (I2 only adds the two end conditions above, which use them);
- `segmentTouches` and `veiledFrom`;
- the clear-sky rules for fireballs, flares and trains;
- first fit, or preferring crossings, as they choose.

With `nearCopy: false`, the planner rejects any path within `QUIET.feather` of a padded rect, which is the test fireballs take today (`:158-159`). Veiled flights keep the default light curve, so `veiledFrom`'s "never brightens again" rule holds (R2 §5.3).

**Speed-class colors (I7).** `drawMeteor`'s tint line (`renderSky.ts:222`) picks by `meteor.wakeColor`:

| Case | Tint |
|---|---|
| `mint` | today's `mixRgb(green, white, METEOR_LOOK.mintToWhite)` |
| `white` | the theme white |
| `warm` | palette index `METEOR_LOOK.fireballTint` |
| fireballs | `METEOR_LOOK.fireballTint` as today, except fast fireballs, which cool to mint mixed `TRAIN.mintToWhite` toward white |

Saturated red never appears: the warmest wake tint, pale yellow `[255, 230, 200]`, has R / (R + G + B) = 0.37, far under 2.3.1's 0.8.

### 6.11 Satellites (P11; after P8 and P9)

```ts
// src/lib/sky/config.ts (P11)
/**
 * Satellites: steady points lit by a Sun below the horizon (no twinkle, no wake, never blinking), gliding in a straight
 * line at constant speed, as NASA describes the space station. Real low orbits cross about 1°/s overhead, about 0.5°/s at
 * the window's 40° centre and 0.1 to 0.3°/s low in the sky; these run `speed` °/s of the sky window (SKY_WINDOW), 2 to 5
 * times faster at the centre, so a whole pass stays within `life` seconds (WCAG 2.2.2's 5 s). A pass crosses the edge of
 * Earth's shadow at most once, as a real one does: at dusk (`shadowShare` of passes) it slides in lit from beyond a side
 * and fades into the shadow over `fadeOut` s while warming from palette index `tint` toward `shadowTint`, as real ones
 * redden; at dawn it fades in over `fadeIn` s as it leaves the shadow and glides out through a side. Alpha `alpha`,
 * about magnitude 3.5 to 5.5: never brighter than the brightest mid-layer star;
 * drawn with star shape `shape`. Clear sky only (every point at least QUIET.feather from every padded quiet rect), never
 * within `minTilt` degrees of vertical (a vertical glide reads as scrolling), one at a time, wide screens only, on their own
 * clock: the first attempt `first` after the reveal and then `gap` after each pass (GapLaw, stretched on long visits), so
 * 39% of visits get a first attempt within their first minute and passes come about 89 s apart. Up to `attempts`
 * candidate passes per launch.
 */
export const SATELLITE = {
	first: { floor: 30, mean: 60, cap: 150 },
	gap: { floor: 40, mean: 50, cap: 150 },
	speed: [1.2, 2.5],
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
```

```ts
// src/lib/sky/satellites.ts (new)
/** One satellite pass: a straight line at constant speed in screen CSS px, with its fades. */
export interface SatellitePass {
	startX: number
	startY: number
	/** Unit direction. */
	dirX: number
	dirY: number
	/** CSS px/s: SATELLITE.speed °/s at the window's scale. */
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

/** Plans a pass in clear sky for this moment, or null when none fits in SATELLITE.attempts tries (nearCopy is always false). */
export function planSatellite(context: PlanContext): Planned<'satellite'> | null
/** True while the pass is on screen. */
export function satelliteMoving(pass: SatellitePass, now: number): boolean
/** Where a pass is at `now`, how bright, and how far it has warmed into Earth's shadow. */
export function satelliteAt(pass: SatellitePass, now: number): SatelliteFrame
```

- **Speed.** `speed °/s × π/180 × view.focal` px/s, using `skyWindow`: 26 to 54 CSS px/s on a 1440 px laptop (about 21.8 px per degree at the centre), so 125 to 260 px per pass [computed].
- **Planning, per attempt.** One mid-sky fade at most, because a nearly straight pass can't leave Earth's shadow and enter it again within seconds (seen from the ground the shadow is one region around the antisolar point, R2 §6.1):
  1. Draw the kind of pass (dusk with `shadowShare`, else dawn), the speed, and a heading at least `minTilt`° from vertical.
  2. *Dusk:* the start is just beyond the left or right side (`METEOR.edgeMargin` outside it, wider than the sprite, so the point slides in), at a height in the clear band (below `METEOR.top`, above `METEOR.maxEndY` of the height), with the heading pointing inward. It glides lit for `life − fadeOut` and fades into the shadow.
  3. *Dawn:* the exit is just beyond a side in the clear band, and the start is one `life` back along the heading, where it fades in over `fadeIn`.
  4. Reject the pass if its mid-sky end (the dusk fade's end or the dawn start) lies outside the clear band or within `METEOR.edgeMargin` of a side.
  5. Accept the first pass whose segment is at least `QUIET.feather` clear of every padded rect: `!field.quiet.some((rect) => segmentTouches(start, end, rect, QUIET.feather))`, using the veil's exported test (I6).
- **The satellite spec** in the registry:
  - `firstDelay: (random) => nextGap(random, SATELLITE.first, 0)`;
  - `nextAfter: (pass, random, sinceReveal) => pass.life + nextGap(random, SATELLITE.gap, sinceReveal)`;
  - `plan: planSatellite`, `lifetime: (pass) => pass.life`, `moving: satelliteMoving`, `narrow: false`.
  - The first attempt comes within 60 s on 1 − e^(−30/60) = 39% of visits [computed]. R2 said "first after 30 s, about 30-40% in the first minute".
- **Drawing** (`drawSatellite` in `renderSky.ts`, or a split `renderTransients.ts`):
  - `placePoint` with shape `SATELLITE.shape`, unsnapped, so it glides. 26 to 54 px/s at DPR 2 needs every frame, which moving transients get.
  - Two sprites at the same point: the `tint` sprite at alpha × (1 − warmth) and the `shadowTint` sprite at alpha × warmth. Under additive compositing that is an exact color mix.
  - The alpha is multiplied by `cancelFade` and by `clearSkyFactor(frame.quiet, x, y)`, taken at its drawn position every frame: `Math.min(quietFactor(blend.from, x, y, LAYERS.near), quietFactor(blend.to, x, y, LAYERS.near))`, a small helper in `renderSky.ts` over the veil's exported `quietFactor`. The near layer's keeps are 0 at the padded edge and on the ink, and the minimum over both zone sets matters mid-ease: `easedQuietFactor` would cross-fade, keeping all of a satellite's light inside a rect a layout has just added at the start of the 0.6 s ease. So a satellite adds **no light inside any padded rect**, old or new, even if a layout changes mid-pass. It therefore never needs the ink lease and never shares a contrast budget with a lease holder (COORDINATION.md request 1; T3).
- **It never takes the lease, is scroll-cancelled like every kind, and stays in screen space** (no drift or parallax: its own motion dominates, and the veil checks are screen-space).

### 6.12 The "could" kinds (P12, each after D4)

| Kind | Spec (R2 §7, R4 §4) | Planning and veil | Notes |
|---|---|---|---|
| Near-radiant point flash | A meteor proposal with zero length within 1° of the on-screen radiant: a point that brightens and fades in 0.3 to 0.5 s without moving, peak at most 0.7 | Clear sky only | At most one per 60 s; needs P9's on-screen radiant |
| Burst | 2 to 4 faint members from the shower radiant, staggered 0.35 to 1.2 s, the whole span at most 5 s, no flares or trains | All members clear sky (no lease) | 5% of launches, at least 90 s apart, after 45 s; desktop. The stagger keeps flashes at 3 a second or fewer. |
| Earthgrazer | At least 0.3 of the width (about 20° at the window's centre: 4 to 6°/s for 2.5 to 3.5 s spans at most 21°, so R2's 0.45, about 30°, could never fit), within 12° of horizontal, 4 to 6°/s, 2.5 to 3.5 s plus about 0.54 s of wake (about 4 s in all), warm | Clear sky only; skipped silently when no band fits | 2.5% of launches, at least 180 s apart, after 60 s; at least 1280 px wide |
| Farewell meteors | The meteor kind with the end scene's launch gate: up to 2 per visit once the end level is at least 0.9 and the visitor has rested 3 s; gaps 8 + Exp(14) s | Full veil (Contact and the footer are quiet copy) | Needs the veil commit, like every moving kind |
| Static comet | Not a transient: a `SkyBody` with a world position and the far band's mean nearness (0.29: it "moves only with the far layer's parallax", R4), drawn after the layers with the camera law. Pseudo-nucleus alpha at most 0.6, mint coma, a curved pale dust tail, a faint straight blue-white ion tail (never a green tail), fading in over at least 8 s. Placed in the upper right, as R4 has it | Under COORDINATION.md request 1, which names the comet. Quiet rects move with the whole scroll and the comet by the camera law, which also carries it between scroll steps (the drift up to 165 q px down and 47 q px up, the lean 12 q px), so copy and comet can meet without a scroll. So: every part (nucleus, coma, both tails) is drawn with `clearSkyFactor`, so it adds no light inside any padded rect; its whole box stays `QUIET.feather` clear of every padded rect, re-tested on every drawn frame (one box against at most 64 rects), with a `cancelFade` fade when that fails; it is placed so that its box, grown by that drift and lean reach, stays below `METEOR.top` (clear of the glass navbar, as satellites are) and above About's header row at 0.4 viewport heights of scroll less `QUIET.feather` (that row is 0.6 H plus About's top padding and header margin: 70, 90 or 110 px by breakpoint, `styles.ts:7`, `globals.css:203`); and it fades with the launch gate, `1 − smoothstep(0, SCENE.heroLaunchMaxScroll, scrolled)`, gone at 0.4 viewport heights (the hero level itself reaches 0 only after About's copy has crossed the upper sky). It never holds the lease and has no launch scroll, so these rules stand in for the shared scroll cancel (the CP-0 message says so); I9 asks whether it may overlap a lease holder | 1 visit in 8 to 10, desktop hero; changes the reviewed composition; may read as a rendering bug (R4). Blocked on V like every transient. |
| Planet | A catalog addition in the near layer at alpha 0.78, twinkle 0, a slightly wider warm core | Star keeps | Changes the reviewed sky; composition review |

Static bodies (the comet and the planet) obey the camera law like stars, as R1 §9 asks of long-lived bodies. Transients stay in screen space, so the veil planning stays in screen space.

The meteor-like kinds that never take the lease (the point flash, bursts, earthgrazers) draw through `drawMeteor` with `clearSkyFactor` in place of `METEOR_VEIL`'s keeps (one more `drawMeteor` argument, added in P12), so, like satellites, they add no light inside any padded rect, even mid-ease or while a scroll cancel fades them (T3).

**Won't** (R2 §6.4):

- outbursts: without a pause control they are a long attention event, and even with one they are an onset storm;
- the ISS, Starlink trains and glints;
- the Milky Way, zodiacal light and aurora;
- airplanes, and anything that blinks.

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
	/** A fine pointer's position for the lean, -1 to 1 from the viewport centre (x right, y down); null once it leaves. (P7) */
	| { type: 'pointer'; at: { x: number; y: number } | null }
```

P13 alone would add `{ type: 'tick' }` (main to worker) and `{ type: 'relay'; on: boolean }` (worker to main). The veil session may add a per-rect text class to `SkyRect`; our messages don't touch it.

**The pointer listener (P7; R3 §8).**

- A passive `pointermove`, for mice and pens only: `event.pointerType !== 'touch'`, and a `LEAN_POINTER_QUERY` beside `DPR_CAP`:

  ```ts
  /** Pointers that lean the sky (LEAN): a mouse or pen on a screen that can hover. */
  const LEAN_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
  ```
- Normalized to −1 to 1 with the ResizeObserver's size, so it causes no layout read.
- At most one message per animation frame; `null` on `pointerout` with no related target and on `blur`; sent only under full motion; the pending frame cancelled in `destroy`.
- In the worker, `pointer` sets the lean target and calls `noteInput`; `schedule(now)` runs after every message, as today. It doesn't set `needsDraw`, which would draw on every refresh while the mouse moves and bypass the divisor: `frameDemand` asks for camera frames while `leanPending(scene)` (full motion, and the lean springs away from their target), so a resting camera still wakes (F6), and `cameraDemand` applies `driftCap()` to those frames. The motion test matters: a pause freezes the springs wherever they are, often short of the pointer that just moved to the control, and without it the worker would draw 20 identical frames a second until Play [computed, check report]. `leanTarget(scene)` multiplies the pointer by `scene.lean` (0 below the hero), and is (0, 0) without a fine pointer.

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

- **Where.** Implement on an integration branch, `claude/sky-ambient-motion-impl`, in its own worktree (`.claude/worktrees/sky-ambient-motion-impl`), cut from master 246c0aa, and run `npm ci` there.
  - Each phase is a PR into that branch, never into master, until checkpoint V. COORDINATION.md agreed that the veil fix lands first and this plan rebases onto it, so at V (8.5) the branch rebases onto the veil commit and only then reaches master, by the route in 8.5 step 2, when the user approves. Under PF it reaches master the same way once PF's handshake is done (8.7). Merging any phase into master earlier needs the veil session's explicit agreement first (it would then have to commit or stash its uncommitted work, update its local master and resolve conflicts in the sky files both plans change; D10), logged in `COORDINATION.md`.
  - After V (or PF), P8 to P12 keep landing on the integration branch, and each reaches master by the same route when the user approves.
  - Never edit `src/` in the main checkout (`S:\Documents\repos\Portfolio`): the veil session works there, uncommitted, until the user approves its commit (COORDINATION.md, 2026-10-27).
  - **Logs.** `COORDINATION.md` and `HANDOFF.md` live on the planning branch `claude/quirky-carson-btv2u4` (worktree `.claude/worktrees/sky-ambient-motion`). Commit each log entry there, not on the integration branch, which carries code only.
- **Dev server.** Start our own `portfolio-dev` from the implementing worktree. `.claude/launch.json` has `autoPort: true`, so it takes a free port while the veil session's server holds port 3000.
  - Never stop or restart the veil session's server.
  - Point the `next-devtools` MCP checks at our port.
- **One phase, one pull request** into the integration branch (one commit per numbered step, each green), merged only after its verification. Phases land in order, except that P5 lands before P4 (Gates); P7, P10, P12 and P13 are optional or conditional.
- **Commands.**
  - `npm run lint` and `npm run type-check` (AGENTS.md).
  - While `next dev` runs, its MCP endpoint `/_next/mcp`: `get_errors`, `get_compilation_issues`, `compile_route` for `/`.
  - At the end of every phase (almost every one adds a module to the worker's graph or changes the client bundle): with our dev server stopped, `npm run build`, then the `portfolio-prod` preview. The sky must draw with no console errors.
  - If `next dev` or `next build` stops with a Next.js upgrade reminder, tell the user and rerun; don't upgrade Next.js.
  - Never POST to `/api/schedule/book`; nothing here touches it.
- **Gates.**
  - Before each phase, CP-1 (8.2): has the veil commit landed? If it has, finish the current phase, run checkpoint V, then continue.
  - P5 (the pause control) merges before any phase that extends automatically started motion: P4 (the twinkle and shooting stars no longer stop at 90 s while the pointer moves), P6 (the drift) and P9 to P12 (more transients). No commit ever has more continuous motion than today without its WCAG 2.2.2 control.
- **Shippable and reversible.**
  - After each phase, the integration branch could deploy as is.
  - Phases that change nothing visible prove it with identity harnesses and the reduced-motion screenshot.
  - Each phase names a kill switch, where one exists: a config value that turns its visible change off without a revert. It doesn't always restore today's exact behavior, and each says what remains. It also names its revert, together with the later phases that depend on it.
- **Evidence.** Each PR description records:
  - the harness output;
  - the checklist items passed (section 9);
  - screenshots or traces where the change is visible.

  Evidence never goes into the repository as files.
- **Coordination.** After each merge, CP-2 (8.2): a dated `COORDINATION.md` entry on the planning branch, and the same note to the veil session.

### 7.1 Verification kit (no test runner; D5)

**Commands and the MCP endpoint**, as in 7.0.

**Scratch harnesses** live in the implementing session's scratchpad and are never committed.

- Node 24 runs TypeScript by stripping types, but its loader rejects the extensionless relative imports in `src/lib/sky`. A 12-line resolve hook fixes that without copying or editing a source file, and it maps `@/` too (the delivery draft verified it on Node 24.14 by loading `skyAssets.ts`):

```js
// ts-resolve.mjs (scratch only): load the repo's TypeScript as is. SKY_SRC is the src folder under test.
import { pathToFileURL } from 'node:url'
const src = pathToFileURL(`${process.env.SKY_SRC}/`).href
export async function resolve(specifier, context, next) {
	const mapped = specifier.startsWith('@/') ? new URL(specifier.slice(2), src).href : specifier
	try {
		return await next(mapped, context)
	} catch (error) {
		if (error?.code !== 'ERR_MODULE_NOT_FOUND' || !(mapped.startsWith('.') || mapped.startsWith('file:'))) throw error
		return next(`${mapped}.ts`, context)
	}
}
// register.mjs: import { register } from 'node:module'; register('./ts-resolve.mjs', import.meta.url)
```

- **Running.** Run a harness as `SKY_SRC=<checkout>/src node --import ./register.mjs h-<name>.ts`.
- **A baseline tree** for before-and-after comparisons: `git archive <base> src/lib/sky src/components/sky | tar -x -C <scratch>/baseline`, then `SKY_SRC=<scratch>/baseline/src`.
- **Worker files load too**, with stubs for the canvas globals:
  - `ImageData` as a `{ width, height, data }` class;
  - `OffscreenCanvas`, whose `getContext` returns a recorder of `putImageData`, `drawImage`, `globalAlpha` and the other calls.
- **Harness code must be erasable TypeScript only**: no parameter properties, enums or namespaces, which strip-only mode rejects. The same holds for `src/lib/sky`, which already complies.

**The debug patch** (scratch, never committed).

- A worker message `{ type: 'debug-frame', time, camera, speed, heading, rate, fps, k, js }` is sent per drawn frame (`speed` is `cameraSpeed`, CSS px/s at nearness 1, which times H6's band medians gives AC-1, AC-2 and AC-15; it also counts the scroll glide and the lean, so read it at least 1.2 s after the last scroll or pointer input, when only the drift moves), and `{ type: 'debug-transient', kind, start, end, heading, peak, startedAt }` per launch.
- `mountSky` collects them into `window.__skyDebug` (R4 §3.3), through cases in P5's message `switch` (before P5, the patch must also replace the `else destroy()` at `mountSky.ts:265`, or the first debug message destroys the sky).
- Apply it with `git apply` for verification runs, and revert it before committing.

| Harness | Proves | Pass when | Phase |
|---|---|---|---|
| **H1** atlas | Phase sprites match today's at phase 0 and keep their light | Phase-(0, 0) bytes equal the baseline's for every tint and shape at DPR 0.825, 1, 1.125, 1.25, 1.5, 1.75 and 2; every phase's unrounded sum within 0.6% of phase 0's and its alpha-byte sum within 2.5% (measured worst: 0.50% at DPR 2; 2.45% at DPR 0.825, 1.63% at 1.125); with `STAR_PHASES = 1` the whole atlas equals the baseline's | P1 |
| **H2** draw calls | Nothing visible changed | `drawSky` on a recording context gives the same list of (destination x, y, size, globalAlpha, source-pixel hash) as the baseline, with `snap` forced true. The scenarios: scroll {0, 1234.5, 5000} × zones {none, 31 settled, 31 mid-ease} × dusk {0.8 s, done} × DPR {1, 2} × keep {full, thinned} | P1, P2, V |
| **H3** quiet index | The index is exact | 100,000 random points × {31, 64 rects} × {settled, level 0.37} × {1440 × 900, 3840 × 2160, 390 × 844} × every layer's keeps: `Object.is(index.factor(...), easedQuietFactor(...))` always; unchanged zones never rebuild; timing at 1,430 stars, 64 rects, mid-ease under 0.4 ms | P1, V |
| **H4** pacing | The clock plans what 6.2 says | `combineDemands` reproduces today's `frameMode` over a table of states (meteor flying or lingering, scrolling under full or reduced motion, dusk, quiet ease, twinkle, idle, sleep), and a fade beside the capped drift keeps the drift's cap (on an unaligned clock, every third tick, not every tick); `refreshDivisor` reproduces 6.2's table; `stepDivisor` lowers k at once and raises it only after 0.5 s; the refresh estimate settles at 16.7 ms at 60 Hz with dropped frames, 8.33 ms at 120 Hz, moves to 33.3 ms within 16 samples after a switch to 30 Hz, and flags 15.0 ± 0.2 ms as unaligned; in timer-fallback mode a k = 2 demand wakes once per drawn frame, every 33.3 ms, even after the estimate read 8.33 ms | P3 |
| **H5** camera | Springs and drift behave | **Springs:** two half steps equal one step within 10⁻¹²; no overshoot from rest, or after a scroll that moves one way, at dt ∈ {1/144, 1/60, 1/15, 0.25, 5} s; 95% at 0.474 s for ω = 10; a one-step jump over one viewport snaps, and sustained flings of 3,000 to 10,000 px/s at H = 700 and 900 never do (no per-frame star step beyond the normal motion plus 0.25 px); eased jumps (ease-in-out) of 3,000 to 20,000 px over 0.3 to 1 s and sustained flings of 3,000 to 25,000 px/s, at H ∈ {700, 852, 900, 1440} and 30 to 144 Hz, also with `maxLag` 0.15 and with `scrollOmega` 12 (R-16): the brightest star glides at most `maxLag` × H × 0.112 after the page stops (25.2 px at H = 900; measured at most 23.6 after eased jumps), never overshoots, glides alike at 30, 60 and 144 Hz wherever no step snaps (within 0.15 px, C4), and is within 0.3 px of rest at 0.7 s and settled by 1.2 s (AC-39; at H = 3,840, within 0.45 px at 0.7 s); after 60 s at rest, a 100 px scroll moves the brightest star at most 1 px in its first step (C5); pause, scroll 5000 px, resume: the position stays continuous within 10⁻⁹ px (C8).<br>**Drift (P6):** `driftAt(0)` = 0; over 6 h the speed stays in [0.58, 1.42] v₀, the wander ≤ 68.4 s × `DRIFT.speed` + 0.1 px at q = 1 (205.3 px at v₀ = 3), the turn rate ≤ 4.4°/s; the first-minute headings match 6.1's table within 1°; rate steps (1 → 0.35 → 0) never move the camera within a frame (AC-9); a 5 s stall advances the clock ≤ 0.1 s.<br>**Lean (P7):** 95% at 1.19 s, no overshoot. | P2, P6, P7 |
| **H6** depth | The depth law is as specified and the catalog didn't move | q bands 0.240 to 0.389, 0.389 to 0.741, 0.741 to 1.600; band means 0.293, 0.501, 1.024; monotone; capped from m 0.112; `cellStars` for 1,000 cells per layer equals the baseline field by field except the added `q` | P2 |
| **H7** scheduler | Transient invariants | Over 10⁵ random event sequences (scroll, layout, pause, hidden, resize, idle), with today's `updateMeteor` kept in the harness as the oracle for P8: never two `nearCopy` transients at once; a plan reporting `nearCopy` after `mayCrossCopy: false` counts as failed; no lifetime over 5 s; no scroll beyond `scrollCancel` without a cancel; a cancel never extends a life; onsets ≥ 3 s apart; none on narrow screens past the limit or past 0.4 viewport heights; from P11 with I9's fallback on, no transient that never takes the lease is ever active together with a `nearCopy` one; for the same seed and inputs, P8's launches and gaps equal the oracle's (`crossingCooldown` is 0 in P8), including sequences with a resize (and, if their commit re-picks its radiant there, a layout) between two launches | P8 to P12 |
| **H8** directions | The population model | **Sky parts** (P9 step 1), over 20,000 visits: at 1440 × 900 `showerOnScreen` set on 15 ± 1% and no other visit's radiant projecting inside the viewport; at 393 × 852 none on screen; every visit's shower passes the usability test, on screen or off.<br>**Launch parts** (P9 step 2), with no quiet rects and today's spawn area, launching as `planMeteorTransient` does (the first aim, then fresh ones, in the veil commit's pass order, 6.9): at 1440 × 900, 200,000 planned launches falling 76 ± 3%, sideways 17.5 ± 3%, climbing (D8 default) 7 ± 2% and only from sporadic sources, heading right 57 ± 3%; at 1440 × 900 and 393 × 852, launch attempts failing every aim under 5% and the shower's share of planned launches 40 ± 5%, in on-screen and off-screen visits alike [computed: 75.8, 17.6, 6.6 and 57.1%; failures 0.0% and 1.2%; shower shares 40.9% and 41.9%]; every path ends at least 12 px inside the sides, at or below `METEOR.top` and above `maxEndY`; at least 99% of shower paths' great circles within 4.5° (3σ) of the shower radiant, which holds for radiants behind the viewer too, where paths converge forward | P9 |
| **H9** rates | The frequency model | Mean gaps 11.69 s (hero) and 21.00 s (narrow) over 10⁵ draws; first minute median 5 with 3 to 6 in at least 85% of 20,000 simulated visits; crossings a minute over a visit's first two minutes at or below today's planner's on the same layouts over the same window (0.576 on R2's synthetic layout), with the cooldown set from the measured crossing share (6.9) | P9 |
| **H10** limits | The 5 s, flash and peak rules, from the config | Every kind's longest first-to-last light ≤ 5 s (fireball with train 4.9 s; satellite 4.8 s; a normal flight with train 3.8 s in P8, 3.2 s from P9, when only the fast class has trains); every flight that may take the lease peaks at most 0.9; burst stagger ≥ 0.35 s; no drawable tint with R / (R + G + B) ≥ 0.8 (the maximum is 0.42) | P8 to P12 |
| **H11** presence | One gate, unchanged twinkle | `presenceLevel` equals today's `idleTwinkle` for the same input timelines, and `notePresence` returns true exactly when today's `isIdle` was true | P4 |
| **H12** pause store | The store's rules | With `matchMedia`, `localStorage` and `window` stubbed: the default with and without reduced motion; a pause surviving a reload; Play under reduced motion lasting only for the page view; reduced motion turning on mid-visit; a pause from another tab (`storage` event); blocked storage throwing on every access; `skyPlayback` null until `setSkyRunning(true)` and after `setSkyRunning(false)`; unsubscribe removing the global listeners | P5 |
| **H13** wake-up loop | Liveness and no jumps | A simulation of the worker's tick and schedule against a fake clock:<br>1. In the reading scene (twinkle 0), after 95 s without input, one `activity` ping restarts frames at once, and the drift is back to full rate 4 s later (F6).<br>2. A 100 px scroll after a minute at rest moves the brightest star at most 1 px in its first frame, then glides (C5).<br>3. A pause draws its last frame at level 0 with every star still at its phase, so none hops (F7, M1); a load under reduced motion draws snapped frames, and its first Play moves each star at most 0.5 device px per axis in one frame (M1's settle), then eases the drift in.<br>4. A pause with the camera at rest (drift 0, as in P5 before P6) still draws a final level-0 frame, with no twinkle (`settleMotion`).<br>5. (P7) A pointer sweep toward the control, then a pause within 0.5 s: 0 frames after the 0.3 s ease (`leanPending`'s motion test). | P5, P6, P7 |

**Browser checks.**

- **Chrome DevTools.** Performance (the worker's track shows each drawn frame and its JS time), the Rendering panel (emulate `prefers-reduced-motion`, `forced-colors`, `prefers-contrast`), and the Task Manager (the tab's CPU).
- **Safari Web Inspector.** Timelines, and Energy Impact on macOS; an iPhone over USB.
- **The Firefox Profiler.**
- **R4's 60-second watch** (9.1).
- **The session's browser tools**, if it has them (the Claude Browser pane, or the Playwright MCP with `browser_emulate_media`), for reduced-motion screenshots and timings. Don't add Playwright to the repository.

### 7.2 Phase map

```
P0 baseline ─► P1 render core ─► P2 camera seam ─► P3 pacing ─► P5 pause control ─► P4 presence ─► P6 drift ─► P7 lean (optional)
                                                       │                 (integration branch; master at V, after PF, or earlier by agreement, 7.0)
                                                       └─► P13 WebKit relay (only if P6's device tests ask)
───────────────────────────────────────── veil boundary ─────────────────────────────────────────────────────────────────
checkpoint V (the veil commit lands; rebase, then merge to master) ─► P8 transient core ─► P9 population and rates ─► P10 fireballs ─► P11 satellites ─► P12 coulds
   or, on the user's go-ahead (D10) and a handshake: PF fallback ─► then P8 to P12 as above
```

| Phase | Visible change | Blocked on the veil? | Depends on | Kill switch (what remains) | Approx. size |
|---|---|---|---|---|---|
| P0 | none | no | | | no code |
| P1 | none | no | | `STAR_PHASES = 1` | ~250 lines |
| P2 | depth spread and glide while scrolling | no | P1 | `CAMERA.snapViewports = 0` (no glide; the graded depth stays) | ~250 |
| P3 | none at rest | no | P2 | | ~300 |
| P5 | the pause control | no | P3 | | ~250 |
| P4 | twinkle stays while the visitor is active | no | P5 | | ~80 |
| P6 | **the drift** (the headline change) | no | P4, P5 | every `SCENE.*.drift = 0` | ~200 |
| P7 | the lean (optional, D3) | no | P6 | `LEAN.reach = 0` | ~120 |
| V | none (the rebase) | lands with it | the veil commit | | merge |
| P8 | a cancelled meteor fades instead of vanishing | **yes** | V, P3, P5 | | ~350 |
| P9 | about 5 meteors a minute from varied directions | **yes** | P8 | `METEOR_RATE.hero` and `.narrow` = `{ floor: 30, mean: 12, cap: 75 }`, `TRANSIENTS.narrowLimit = 2` (the directions and the long-visit stretch stay) | ~400 |
| P10 | fireballs retuned | **yes** | P9 | `METEOR_KINDS.fireball.chance = 0` (no fireballs; today has 8%) | ~80 |
| P11 | satellites | **yes** | P8, P9 | none in config: remove `'satellite'` from `TRANSIENT_KINDS` (one line) | ~350 |
| P12 | each "could" kind | **yes** (planet: no) | P9 (planet: P2) | per kind | ~100 to 200 each |
| P13 | smoother Safari | no | P6 and device tests | relay off | ~40 |

### 7.3 The phases

#### P0. Baseline and preflight (no repository change)

- **Goal.** Measure today, so every later phase can prove "no change" or "this much change", and open the line to the veil session.
- **Steps.**
  1. **CP-1** (8.2), from 246c0aa, then read `COORDINATION.md`. If the veil commit has landed, run checkpoint V first; if it already logs the veil session's confirmed plan, run CP-5 before P1.
  2. Create the integration branch and its worktree (7.0) and run `npm ci`. `npm run lint` and `npm run type-check` must be clean before any change.
  3. Set up the harness kit and the baseline tree (7.1). Record H2's baseline draw-call lists and the atlas bytes per DPR.
  4. **Browser baselines** (Chrome, 1440 × 900 at DPR 2 and DPR 1; 393 × 852 at DPR 2):
     - reduced-motion screenshots of the hero and the end bookend after the dusk;
     - a reading-scene screenshot (1.5 viewport heights) under full motion once the scroll has settled;
     - a 60 s Performance trace of the hero hands-off (drawn frames per second, worker JS per frame);
     - a 30 s trace in the reading scene (expect 0 frames);
     - the tab's CPU during hero idle;
     - R4's 60-second watch notes (meteor count and directions).
     
     Repeat the watch on an iPhone if one is available.
  5. **CP-0.** Send the message in 8.4 and log it in `COORDINATION.md`.
- **Done when.** Two harness runs produce identical logs, the baselines are saved in the scratchpad, and CP-0 has been sent.

#### P1. Render core: phase sprites, quiet index, stamp cache (no visible change)

- **Goal.** Draw today's exact sky through the machinery moving stars need.
- **Blocked on.** Nothing.
- **Files.**
  - `config.ts`: `STAR_PHASES`.
  - `skyAssets.ts`: `profile`, the phase-aware `paintSprite`, the 4 × 4 block layout, `starSpriteIndex`.
  - `quietIndex.ts`: new.
  - `scene.ts`: `sameRects` moved in and exported.
  - `renderSky.ts`:
    - `placePoint` and `corner`;
    - `SkyFrame.snap` and `SkyFrame.quietIndex`;
    - `drawLayer` placing stars with `placePoint` and dimming them with the index;
    - `StarField` with stamps, `CELL_CACHE_SLACK` and the key guard;
    - `drawSky` calling `beginFrame`, `quietIndex.update` and `trim`;
    - the docs of `EDGE` and the key.
  - `sky.worker.ts`: imports `sameRects`; creates the index once; `frameAt` sets `snap: true` and passes the index.
- **Steps (one commit each).**
  1. The atlas, with H1 green; in the same commit `drawLayer` looks sprites up through `starSpriteIndex(tint, shape, 0, 0)`, since the 4 × 4 block layout moves every sprite (`renderSky.ts:127`).
  2. `placePoint` and `snap`.
  3. The quiet index and the `sameRects` move, with H3 green.
  4. The stamp cache, the guard and the docs.
- **No visible change means:**
  - H2's lists equal P0's over the whole grid;
  - the phase-(0, 0) atlas bytes equal P0's;
  - the index differs from `easedQuietFactor` by exactly 0;
  - the P0 screenshots match pixel for pixel.
- **Verification.** Lint, type-check, H1, H2 and H3, plus:
  - a cache harness: a 10,000 px scroll in 50 px steps regenerates, per frame, only cells that just came into view; a camera moving at 25 px/s for 10 simulated minutes keeps the cache at most twice the visible cells and never regenerates a visible one (SF1);
  - the production build smoke test.

  Checklist: AC-8, AC-11, AC-12, AC-16 (a), AC-29, AC-30, AC-35, AC-36.
- **Rollback.** `STAR_PHASES = 1` restores the old atlas content. A revert removes everything; nothing persists (every later phase depends on it).

#### P2. Camera seam: continuous depth and scroll glide (visible while scrolling)

- **Goal.** One camera for every star: brightness-graded depth and a scroll glide, identical at rest.
- **Blocked on.** Nothing.
- **Files.**
  - `config.ts`: `DEPTH`, `CAMERA`; `LayerConfig.parallax` and `LAYERS.*.parallax` removed; the `LAYERS` doc.
  - `catalog.ts`: `Star.q`, `nearness`, `LAYER_NEARNESS`.
  - `camera.ts`: new, with the scroll part only (6.1).
  - `renderSky.ts`: `SkyFrame.camera` replaces `parallaxScroll`; `drawLayer` offsets each star by q·C and culls cells on both axes with `LAYER_NEARNESS` (6.5).
  - `sky.worker.ts`:
    - `camera`, `offset`, `updateCamera` and `cameraMoving`;
    - `init` creates the camera on the restored scroll;
    - the `motion` handler's resume (`parallaxScroll = scrollY`, `resumeCamera`);
    - the hidden branch's `forgetStep`;
    - `frameAt` sets `camera` and `snap: !skyMoved` (`skyMoved` set in `init` and the `motion` handler, 6.1);
    - `frameMode` returns `'active'` while `cameraMoving` (until P3).
- **Steps** (each ending with lint and type-check green).
  1. `DEPTH`, `nearness`, `LAYER_NEARNESS` and `Star.q`, with H6 green.
  2. `camera.ts` with the scroll part, with H5's spring cases green.
  3. `SkyFrame.camera` and `drawLayer`'s offset and two-axis culling; until step 4, `frameAt` passes `camera: { x: 0, y: CAMERA.scrollParallax * parallaxScroll }`. H2 green on its scroll-0 rows at camera (0, 0) with `snap` forced true (at scroll 1234.5 and 5000, P1's lists carry the old per-layer parallax, so P2's continuous depth differs there by design).
  4. The worker wiring; `LayerConfig.parallax` removed last.
- **Visible change.**
  - At scroll 0, none: positions are identical, with stars at their exact quarter-pixel phases under full motion (S4).
  - While scrolled, each band spreads its parallax by brightness: the brightest stars follow 0.112 of the scroll, the faintest 0.017.
  - After a scroll stops the stars glide to rest in about half a second, at most about 25 px for the brightest even after a navbar jump; a jump in one step snaps.
  - Turning reduced motion off after scrolling no longer leaps the sky.
  - Under reduced motion, identical to today.
- **Verification.** Lint, type-check, plus:
  - H2: on its scroll-0 rows, with `snap` forced true and the camera at (0, 0), the lists equal P1's;
  - H5 (springs, the snap, the lag cap, the rest rule, the resume continuity);
  - H6;
  - in the browser: scroll and stop (the glide); a navbar section link, Home and End (a short glide, AC-39); `scrollTo({ top: 8000, behavior: 'instant' })` from the console (the snap); reduced motion (still, screenshots identical to P0's at scroll 0); toggle reduced motion after scrolling 3,000 px (no jump);
  - a review of the reading scene's composition while scrolling (R1's risk).

  Checklist: AC-1 (the scroll part), AC-9, AC-26, AC-27, AC-30, AC-34, AC-35, AC-36, AC-39.
- **Rollback.** `CAMERA.snapViewports = 0` follows the scroll exactly, with no glide; the brightness-graded depth stays, so only a revert restores today's three parallax values. Or revert the PR (P3 and later depend on it).

#### P3. Frame pacing (no visible change at rest)

- **Goal.** Draw motion on display refreshes divided by a whole number, with a watchdog, without changing what a resting sky draws.
- **Blocked on.** Nothing.
- **Files.**
  - `config.ts`: `PACING`; the `FRAME` and `ADAPT` docs.
  - `pacing.ts`: new (6.2).
  - `sky.worker.ts`:
    - `frameDemand`, `cameraDemand`, `twinkleDemand`, `driftCap` and `softwareFps`;
    - `rafId: number | null`; `requestFrame`, `onStalled`, the watchdog with its strikes and the probe; `rafWorks`;
    - the refresh estimate and the divisor in `tick`;
    - `schedule` and `cancelFrames`, and the file's header doc and `schedule`'s doc (`:1-5`, `:148-151`), which describe today's timer split;
    - `probeRaster` keeps `rasterMs`;
    - `SkyWorkerScope`'s animation-frame members optional.
- **Steps.**
  1. `PACING` and `pacing.ts`, with H4 green.
  2. `frameDemand` and its helpers, reproducing `frameMode` under today's `schedule` (`softwareFps` is declared `Infinity` until step 4).
  3. `requestFrame`, the watchdog, its strikes and probe, `rafWorks`, the refresh estimate and the divisor in `tick`, in one commit: the fallback timer reads the divisor, and `tick` reads the fallback mode.
  4. `softwareFps` from the probe, and the docs.
- **Visible change.** None at rest. The scroll glide keeps every refresh while it moves fast: after a 1,000 px/s scroll it needs over 30 fps for about 0.4 s, and the 0.5 s hysteresis holds that rate until it settles [computed].
- **Verification.** Lint, type-check and H4, plus:
  - a Chrome trace: a worker frame on every vsync while scrolling and during a flight, twinkle frames about 67 ms apart in the hero, none in the reading scene or a hidden tab, and equal holds during a glide (AC-13);
  - Firefox the same;
  - Safari: the debug patch logs the worker clock as unaligned;
  - a local patch that makes `requestAnimationFrame` never call back: frames continue from the watchdog's timer, and after three misses from the 60 Hz timer, still about 60 a second through 5 s of scrolling (messages never push the timer back); a variant that blocks animation frames for 2 s only goes back to them within 5 s of the block's end (then remove the patch);
  - the production build smoke test.

  Checklist: AC-10 (the glide), AC-13, AC-14 (the idle part), AC-32.
- **Rollback.** Revert the PR (P4 to P7 and P13 depend on it).

#### P4. Presence (visible: the twinkle keeps going while the visitor uses the pointer or keys)

- **Goal.** One presence gate: pointer, keys and focus count as being here, for the twinkle now and the drift later.
- **Blocked on.** P5 merged: P4 extends automatically started motion (the twinkle and shooting stars no longer stop at 90 s), so the pause control comes first (7.0 Gates).
- **Files.**
  - `presence.ts`: new (6.6).
  - `protocol.ts`: `activity`.
  - `mountSky.ts`: `ACTIVITY_INTERVAL_MS`, `ACTIVITY_EVENTS`, the listeners.
  - `sky.worker.ts`:
    - `presence`; `noteInput` delegates;
    - `twinkleLevel`, `meteorsAllowed` and `twinkleDemand` use `presenceLevel` and `isAway`;
    - the `activity` case;
    - `twinkleTime` (recommended, 6.6).
  - `renderSky.ts`: `SkyFrame.twinkleTime`, which `drawLayer`'s twinkle reads instead of `frame.time` (`:124`).
  - `config.ts`: the `FRAME` idle docs.
- **Steps.**
  1. `presence.ts`, with H11 green.
  2. The `activity` message in `protocol.ts`, then the worker: `presence`, `noteInput`, `twinkleLevel`, `meteorsAllowed`, `twinkleDemand` and the `activity` case.
  3. `mountSky`'s listeners.
  4. The twinkle clock.
- **Visible change.** The twinkle (and the shooting stars) no longer stop at 90 s while the pointer moves or keys are pressed; otherwise the same.
- **Verification.** Lint, type-check and H11, plus in the browser:
  - move the mouse every 20 s for 3 minutes: the twinkle never fades and meteors keep coming;
  - leave everything alone for 95 s: the twinkle fades over 4 s, then a trace shows 0 frames;
  - a key press brings it back over 4 s, with no meteor for 3 s;
  - at most one `activity` message a second.

  Checklist: AC-14, AC-32 (twinkle continuity), AC-33.
- **Rollback.** Revert the PR (P6 depends on it).

#### P5. Pause control (visible: the control in the navbar; lands before P4)

- **Goal.** Give the sky its WCAG 2.2.2 control before any phase extends automatic motion.
- **Blocked on.** Nothing. It uses D1's default unless the user picks another placement.
- **Files.**
  - New: `skyPause.ts` and `SkyPauseToggle.tsx`; `icons/PauseSVG.tsx` and `icons/PlaySVG.tsx`, plus their `icons/index.ts` lines.
  - `Navbar.tsx`: the control last in `<nav>` and in the stagger, `inert` while the menu is open; the burger's `ml-auto` and `#primary-nav`'s `md:ml-auto`; the header's `onFocus`, its ref and the focus test in the scroll callback.
  - `mountSky.ts`: `motion()` reads the store; `syncMotion` with its dedupe; the worker-message `switch` with `setSkyRunning` on `'ready'`, and `destroy`; its own reduced-motion query goes.
  - `protocol.ts`: the `SkyMotion` doc.
  - `config.ts`: `FRAME.motionEase`.
  - `sky.worker.ts`: `motionChangedAt`, `motionLevelFrom` and `motionLevel`; `twinkleLevel` × `motionLevel`; the fade demand while easing; `settleMotion`.
  - `AGENTS.md`: the pause line (6.8). `README.md`: the sky lines.
- **Steps.**
  1. `skyPause.ts`, with H12 green.
  2. The icons and `SkyPauseToggle.tsx`.
  3. `mountSky`: the store, `syncMotion`, the message `switch` and `destroy`.
  4. The worker's motion level and `settleMotion`, with H13's third and fourth cases green.
  5. `Navbar.tsx`, then `AGENTS.md` and README.
- **Visible change.**
  - A green pause glyph in the navbar.
  - Pressing it settles the twinkle within 0.3 s, stops shooting stars and stops scroll parallax, and the glyph and name switch to "Play sky animation".
  - Pressing again resumes from there.
  - A reload stays paused, and another tab follows.
  - Under reduced motion the page starts paused, and Play opts in for the page view.
- **Verification.** Lint, type-check, H12, H13's third and fourth cases, and `/_next/mcp` `get_errors` on `/` (no hydration warning, AC-41).
  - **Keyboard and screen reader:** Tab reaches the control, Space and Enter operate it, and the dashed focus ring shows. VoiceOver or NVDA announces "Pause sky animation, button", then "Play sky animation, button" after activation.
  - **Order:** at 393 px Tab goes logo, burger, control; at 1440 px logo, links, Resume, control: the order on screen (2.4.3).
  - **The phone menu:** open it and Tab and Shift+Tab through it: focus never lands on the covered control; closed, it is reachable again (2.4.11).
  - **The hidden header:** tabbing into it after scrolling down brings the header back (2.4.11); with the control focused, Page Down and the arrow keys scroll without hiding it (2.4.7); after a mouse click on a nav link, scrolling down still hides it.
  - **Size:** DevTools shows a 40 × 40 target.
  - **Storage:** with storage blocked (DevTools "Block site data", or a Safari private window), toggling still works for the page and nothing throws. Clearing site data returns to the OS default.
  - **Preferences:** under forced colors the control is gone. Under the reduced-motion emulation it starts paused, Play works for the page view, and a reload starts paused again.

  Checklist: AC-9, AC-26, AC-27, AC-28, AC-29, AC-41.
- **Rollback.** Revert the PR (P4 and P6 depend on it). P4 and P6 must never ship without P5: revert them first (P6 may instead set every `SCENE.*.drift` to 0; P4 has no kill switch).

#### P6. Ambient drift (the headline change)

- **Goal.** The floating drift, paced, gated by presence and the pause control.
- **Blocked on.** P4 and P5 merged (P6 may merge together with them). It uses D2 and D6.
- **Files.**
  - `config.ts`: `DRIFT`; `SCENE.*.drift` and the `SCENE` doc; `ADAPT.thinFade` (recommended, below).
  - `scene.ts`: `SceneLevels.drift` and the `mix` key.
  - `renderSky.ts`: `SkyFrame.thinFrom` and `thinLevel`, and the thinning fade in `drawLayer` (recommended, below).
  - `camera.ts`: `clock`, `EPICYCLES`, `driftAt`, `driftVelocity`, and the drift terms of `stepCamera`, `cameraOffset` and `cameraSpeed`.
  - `sky.worker.ts`: `driftWanted`, `driftTarget`, `driftRate` and `driftAffordable`; the drift in `cameraDemand` and its caps; the header doc (reading and idle no longer simply sleep); the ADAPT fade: `thinnedAt` in `stepDown`, `frameAt`'s `thinFrom`, `thinLevel` and `keep`, and its line in `frameDemand` (recommended, below).
  - `README.md`: the sky lines (`camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts`).
- **Steps.**
  1. Config and the camera, with H5 green before any wiring; `updateCamera` passes `drift: 0` until step 3.
  2. The scene.
  3. The worker, with H13 green.
  4. The ADAPT fade (below), checked with a local patch that forces step 1: the thinned stars fade over 1 s on fade frames, then one final frame.
  5. A by-eye pass on a DPR-2 laptop, a DPR-1 monitor and a phone, changing only `DRIFT.speed` within 2.5 to 3 and, if wanted, rotating the phases (D6). Every drift check holds for any v₀ in that range. A v₀ above 3 is the user's D6 choice: H5's wander bound is then 68.4 s × v₀, AC-15's limits scale with v₀ (they are stated per v₀), B-2 allows every refresh at DPR 2 above v₀ 3.3, and above 3.5 AC-2's 8 px/s ceiling fails by design. Rotating the phases also moves AC-4's first-minute check.
- **Recommended within P6 (do it)** (E11). Fade the stars that ADAPT step 1 thins out over 1 s, instead of removing 20% of them in one frame (`sky.worker.ts:295-298`; R3 §6): on a moving sky a one-frame loss of a fifth of the stars reads as a glitch.
  - `ADAPT.thinFade: 1`; the `ADAPT` doc gains "the stars step 1 thins out fade over `thinFade` seconds".
  - The worker records `thinnedAt` (s) when `stepDown` takes step 1.
  - `SkyFrame` gains `thinFrom`, the thinned share (`densityKeep × ADAPT.thinning`, `Infinity` before step 1), and `thinLevel`, `1 − smoothstep(thinnedAt, thinnedAt + ADAPT.thinFade, t)`. While `thinLevel` is above 0, `frame.keep` stays the unthinned share.
  - `drawLayer`, after the keep test (`renderSky.ts:113`): `if (star.keep >= frame.thinFrom) alpha *= frame.thinLevel`.
  - `frameDemand`'s fade line also asks for `FADE_FRAMES` while `t − thinnedAt < ADAPT.thinFade`, with one more frame when it ends, as `settleQuiet` does.
- **Visible change.** Section 2.1.
- **Verification.** Lint, type-check, H5 (the drift part) and H13, plus:
  - with the debug patch: the camera speed, which times H6's band medians gives AC-1, AC-2 and AC-15, and the on-screen band order (AC-1); k and fps, JS per frame (AC-13), and no frames after the idle timeout (AC-14);
  - the 60-second watch (9.1) on a DPR-2 laptop in Chrome, a DPR-1 monitor and an iPhone in Safari;
  - budgets B-1 to B-7 (section 10);
  - the ADAPT fade patch (step 4);
  - the DPR-1 shimmer decision (the 0.85 device px floor, 6.3);
  - the D7 device tests (WebKit judder and Low Power Mode drain).

  Checklist: AC-1 to AC-17, AC-26 to AC-28, AC-30, AC-32 to AC-34, AC-36.
- **Rollback.** Set every `SCENE.*.drift` to 0: no drift and no drift frames, with everything else intact. Or revert the PR (P7 depends on it).

#### P7. Pointer lean (optional, D3)

- **Goal.** Lean the stars away from a fine pointer in the hero, by the same camera law.
- **Blocked on.** P6.
- **Files.**
  - `config.ts`: `LEAN`; `SCENE.*.lean` (hero 1, reading 0, end 0).
  - `scene.ts`: `lean` in `SceneLevels` and the `mix` key.
  - `camera.ts`: the lean springs and terms.
  - `protocol.ts`: `pointer`.
  - `mountSky.ts`: `LEAN_POINTER_QUERY`; the frame-coalesced `pointermove`; `pointerout` and `blur` sending `null`; `cancelAnimationFrame` in `destroy` (6.13).
  - `sky.worker.ts`: the `pointer` case, `leanTarget(scene)` and `leanPending(scene)` in the camera demand.
- **Steps.**
  1. `LEAN`, the lean springs and the `lean` scene level, with H5's lean cases green; `updateCamera` passes a shared zero lean until step 3.
  2. The `pointer` message and `mountSky`'s listener.
  3. The worker: the `pointer` case, `leanTarget` and `leanPending`.
- **Visible change.** On a desktop with a mouse, the hero's stars lean away from the cursor (the brightest up to 19 px) and settle in about 1.2 s. Nothing happens on touch screens, below the hero, under reduced motion or paused.
- **Verification.**
  - H5 (the lean) and H13's fifth case.
  - With the debug patch: at most one `pointer` message per animation frame while sweeping the mouse, and none from touch; drawn frames keep the drift's divisor while the mouse moves (AC-13); pausing right after moving the mouse to the control leaves 0 frames once the ease ends (AC-14).
  - In the browser: the lean stops below the hero; entering and leaving the window never jumps (AC-9).

  Checklist: AC-3 (lean excluded), AC-9, AC-14, AC-26.
- **Rollback.** `LEAN.reach = 0`, or revert.

#### Checkpoint V: the veil commit lands (8.5)

Everything below waits for it, or for PF (8.7), which only the user can start (D10). The trigger to ask the user is P7 merged or skipped while the veil commit still hasn't landed. Ask then, with D10's three answers (keep waiting, PF, or an early merge of P1 to P7 with the veil session's agreement), and again weekly while the answer is to wait (CP-4), rather than waiting indefinitely.

#### P8. Transient core (blocked on V)

- **Goal.** One scheduler for every short-lived event, with the ink lease and the scroll cancel, launching exactly as before.
- **Files.**
  - `transients.ts`: new (6.9), with the meteor kind only.
  - `random.ts`: `Random`.
  - `config.ts`: `TRANSIENTS` (`crossingCooldown` 0); `retry`, `maxFailedPlans`, `recheck`, `afterReturn` and `narrowLimit` move out of `METEOR`.
  - `scene.ts`: `meteors` becomes `launches`; `heroMeteorMaxScroll` becomes `heroLaunchMaxScroll`.
  - `meteors.ts`: I1's `nearCopy` option and field, only if the veil session declined them (under PF, PF step 3 has added them).
  - `renderSky.ts`: `drawTransient`; `drawMeteor`'s `fade` (I7, if not theirs).
  - `sky.worker.ts`:
    - `const transients = createSchedule()` replaces `meteor`, `radiant`, `launched`, `failedPlans` and `nextMeteorAt` (6.9);
    - `launchGate`; cancel and drop; `forgetVisitSky` wherever the oracle clears the radiant (resize, and a layout if their commit re-picks there; 6.9); `holdTransients` and `retryTransients` in seconds;
    - `transientDemand` and `nextLaunchAt`;
    - the scroll cancel ported from the veil's handler into `updateTransients` (I3).
  - `README.md`: the sky lines (`transients.ts`).
- **Steps.**
  1. `TRANSIENTS`, `Random` and the types (`METEOR`'s moved keys stay until step 3: the worker still reads them), and I1 in `meteors.ts` if the veil session declined it.
  2. The scheduler and the meteor spec, with H7 green against the oracle.
  3. The worker swap, with `forgetVisitSky` where the oracle clears the radiant, removing `METEOR`'s moved keys.
  4. `drawTransient` and the fade (I7).
  5. The scroll cancel in `updateTransients` (I3).
- **No visible change means:**
  - the same rate (today's gap law, as their commit leaves it), the same radiant behavior, the same narrow limit (2), the same veil checks and no crossing cooldown (H7's oracle equality);
  - the one difference: pausing or scrolling fades a flying meteor over 0.2 s instead of dropping it, once I7's `fade` exists.
- **Verification.** Lint, type-check, H7 (with the oracle) and H10, plus the production build smoke test.

  Checklist: AC-18, AC-19, AC-22, AC-28 (the fade), AC-30, AC-31, AC-37, AC-38 (the lease), AC-40.
- **Rollback.** Revert the PR; the veil-era `updateMeteor` returns (P9 to P12 depend on it).

#### P9. Meteor population model and rates (blocked on P8)

- **Goal.** Meteors from realistic directions, then at the new rate.
- **Files.**
  - `config.ts`:
    - added: `GapLaw`, `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `TRANSIENTS.longVisit`;
    - changed: `TRANSIENTS.narrowLimit` 6 and `crossingCooldown` 55; the `METEOR` and `METEOR_LOOK` docs, `radiantTries`' meaning and the inner key docs (6.10);
    - removed: the keys 6.10 lists.
  - `radiants.ts`: new (6.10).
  - `random.ts`: `gaussian`.
  - `transients.ts`: `VisitMemory` becomes `{ sky: VisitSky | null }`; `planMeteorTransient` tries the first aim and fresh ones (in the veil commit's pass order, 6.9) and clears a failed sky; the meteor spec uses `nextGap(METEOR_RATE…)`.
  - `sky.worker.ts`: `forgetVisitSky` where changed quiet rects take effect (6.9; the resize call is P8's).
  - `meteors.ts`: `Flight`, `Aim`, the `aim` option, the end guards, the fireball path and `Meteor.wakeColor` (I2).
  - `renderSky.ts`: the wake tint (I7).
  - `README.md`: the sky lines (`radiants.ts`).
- **Steps** (one commit each; the directions come first, because the rate may rise only after they have cut the crossing share: about 57% of the new flights fly away from the left-aligned copy, while with today's geometry, where 36% of flights burn out behind copy, the new rate would give about 0.8 crossings a minute even with the 55 s cooldown [computed]).
  1. `WakeColor`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_BRIGHTNESS`, the `Flight` and `Aim` types in `meteors.ts` (types only, so `radiants.ts` compiles), `radiants.ts` and `gaussian`, with H8's sky parts green.
  2. I2 in `planFlight` (the aim, the end guards, the peak, the fireball path), `Meteor.wakeColor`, the wake tint, the new `VisitMemory`, `planMeteorTransient`'s aims and `forgetVisitSky`'s layout call; the old radiant, angle, speed and peak keys removed; with H8's launch parts green.
  3. `GapLaw`, `METEOR_RATE`, `nextGap`, `TRANSIENTS.longVisit`, `narrowLimit` 6 and `crossingCooldown` 55, with H9 green; the old gap keys removed.
- **Visible change.**
  - About 4.7 shooting stars a minute in the hero (median 5 in the first minute), from varied directions, about 4 in 10 sharing the visit's shower radiant.
  - The radiant on screen on about 15% of desktop visits.
  - Warm, white and mint wakes by speed class.
  - Varied brightness: on average about 0.6 of today's peak, about 1 in 8 faint, those high in the window nearly as bright as today's (`METEOR_BRIGHTNESS` is the knob).
  - Gaps that stretch from the third minute.
  - Up to 6 a visit on phones.
  - Fireballs keep today's odds per launch, so at the new rate they come about 3.5 times as often (about one every 3 minutes) until P10 makes them 4% and 120 s apart.
- **Verification.** Lint, type-check, H8 and H9, plus:
  - crossings per minute over a visit's first two minutes and plan acceptance on captured layouts (from the veil session, I8, or captured by us with a local patch that logs `layout` messages), at or below today's over the same window; otherwise retune `crossingCooldown` from the measured share (6.9's table);
  - the 60-second watch.

  Checklist: AC-18 to AC-23, AC-31, AC-37, AC-38.
- **Rollback.** `METEOR_RATE.hero` and `.narrow` = `{ floor: 30, mean: 12, cap: 75 }` with `TRANSIENTS.narrowLimit = 2` bring back today's rate and limit with the new directions; the long-visit stretch stays the new one (×2 at 6 minutes, against today's ×1.5 after 3). Or revert the PR (P10 to P12 depend on it).

#### P10. Fireball retune (should; after P9)

- **Goal.** Fireballs rarer, spaced and inside the 5 s rule.
- **Files.**
  - `config.ts`: `METEOR_KINDS`, below; `METEOR.fireballChance` and `fireballDuration` removed.
  - `transients.ts`: `PlanContext.sinceReveal`, filled from `gate.sinceReveal` in the launch step; the meteor spec decides fireballs before planning: desktop only, at least `after` s since the reveal, at least `spacing` s since the last one (in `VisitMemory`), and `chance` per launch.
  - `meteors.ts`: the `fireball` option replaces the per-attempt chance.

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

- **Steps.** (1) `METEOR_KINDS` and the `fireball` option, with `METEOR.fireballChance` and `fireballDuration` removed. (2) The spec's fireball decision and `VisitMemory`'s last fireball, with H7's fireball cases and H10 green.
- **Visible change.** Fireballs at 4% of launches, at least 120 s apart and none in the first 20 s: about one every 5 to 10 minutes.
- **Verification.** H7 extended: no two fireballs closer than 120 s, none before 20 s, every fireball clear-sky. H10.

  Checklist: AC-31, AC-37.
- **Rollback.** `METEOR_KINDS.fireball.chance = 0` turns fireballs off (today flies 8%), or revert.

#### P11. Satellites (should; after P8 and P9)

- **Goal.** Steady satellites in clear sky, on their own clock.
- **Files.**
  - `config.ts`: `SATELLITE`.
  - `satellites.ts`: new (6.11).
  - `transients.ts`: `satellite` in `TransientBodies`, `TRANSIENT_KINDS` and the registry; I9's two-way fallback in the launch step, unless the veil session has agreed (6.9).
  - `renderSky.ts`, or a split `renderTransients.ts` (if split, add it to AGENTS.md's worker list): `drawSatellite`, `clearSkyFactor` and its `case`.
  - `meteors.ts`: `segmentTouches` exported (I6).
  - `README.md`: the sky lines (`satellites.ts`).
- **Steps.** (1) `SATELLITE`, the `segmentTouches` export (I6), and `satellites.ts` without the kind: `SatellitePass`, `SatelliteFrame`, `satelliteMoving` and `satelliteAt`, with the speed, fade and warmth checks green. (2) The kind, in one commit, because the registry and the drawing switch make a kind without a spec or a `case` a compile error: `'satellite'` in `TransientBodies` and `TRANSIENT_KINDS`, `planSatellite` and its registry entry, `drawSatellite` with `clearSkyFactor` and its `case`, with H7 and the pass checks below green.
- **Visible change.** Now and then, a steady point glides across clear sky for under 5 s, often fading into Earth's shadow.
- **Verification.** H7 with satellites (and I9's fallback, unless the veil session has agreed) and H10, plus:
  - every pass at most 4.8 s, at least `QUIET.feather` clear of every padded rect, never `nearCopy`, constant speed, at most one mid-sky fade;
  - no light inside a rect a layout adds mid-pass (`clearSkyFactor`);
  - the first attempt within 60 s on 39 ± 2% of simulated visits;
  - in the browser: 5 minutes in the hero; satellites look steady, never blink, warm as they fade, never start within 3 s of a shooting star; scrolling or pausing during a pass fades it; none on a phone or past the hero.

  Checklist: AC-24, AC-30, AC-31, AC-37. Budget B-8.
- **Rollback.** No config value turns satellites off: remove `'satellite'` from `TRANSIENT_KINDS` and the registry (the compiler then points at every use), or revert. Nothing depends on it.

#### P12. Could kinds (each its own PR, per D4)

- **Goal.** Ship each "could" kind the user picks in D4, one at a time: the near-radiant point flash, bursts, earthgrazers, farewell meteors, the static comet and the planet (6.12).
- **Blocked on.** V (or PF) for every kind but the planet, which is a star (star keeps, per star, per frame) and could follow P2. COORDINATION.md request 1 names the comet, so it waits like the others.
- **Files per kind.** `config.ts` (its block, with a doc comment); `transients.ts` (its body, spec and registry entry), or, for the comet, a `SkyBody` drawn after the layers in `renderSky.ts`, and for the planet, its catalog entry in `catalog.ts`; `renderSky.ts` (its drawing case, and the `drawMeteor` argument for `clearSkyFactor`); `radiants.ts` for the point flash.
- **Steps.** (1) Config and model, with its harness checks green: burst members at least 0.35 s apart and all clear-sky; the comet's box clear of every padded rect on every drawn frame, the drift and the lean included. (2) The drawing. (3) Its acceptance item.
- **Visible change.** The kind appears as its 6.12 row says.
- **Verification.** Lint, type-check, H7 and H10 with the kind, its harness checks, its acceptance item (AC-25 for the comet) and the 60-second watch; the comet and the planet also get a composition review.
- **Rollback.** Remove the kind from `TRANSIENT_KINDS` and the registry (or the body from the draw list), or revert its PR. Nothing depends on it.

#### P13. WebKit frame relay (D7: only if device tests ask; blocked on P6 and the tests, not on the veil)

- **Goal.** Smooth motion on Safari, whose worker clock ignores the display.
- **Go criteria.** On an iPhone in Safari or on macOS Safari, AC-10 or AC-13 fails visibly (judder of the near stars, about 4.5 jolts a second, R3 §2.2), or a 10-minute Low Power Mode test shows an energy impact well above Chrome's on the same machine.
- **Files.**
  - `protocol.ts`: `tick` and `relay`.
  - `mountSky.ts`: the `relay` case in P5's message `switch`, and a main-thread rAF loop that posts `tick` while the worker asks for it.
  - `sky.worker.ts`: asks for the relay (`{ type: 'relay', on }`) while its clock is unaligned and a vsync demand exists, and draws on `tick`.
- **Steps.** (1) The two messages and the `relay` case. (2) The main-thread loop. (3) The worker's request and its `tick` frames.
- **Visible change.** On Safari only, moving stars land on display refreshes (no judder); elsewhere nothing changes.
- **Verification.**
  - The same device tests now pass.
  - The main-thread trace shows the relay at 10 to 30 µs per frame and no long tasks.
  - Chrome and Firefox never enable it, because their clocks are aligned.

  Checklist: AC-10, AC-13; budget B-5.
- **Rollback.** Revert; the worker falls back to its own clock.

#### PF. Veil fallback (only on the user's go-ahead, D10, and a handshake)

- **Goal, trigger and rules.** Section 8.7.
- **Files.** `meteors.ts` (I1's `nearCopy` option and field, the `segmentTouches` export; later I2 and the `fireball` option, in P9 and P10); `config.ts` (`METEOR_VEIL.inkKeep` 0 and its doc's arithmetic); `renderSky.ts` (`drawMeteor`'s `fade`, I7; its wake tint needs `Meteor.wakeColor` and so comes with I2 in P9).
- **Steps.** (1) The handshake (8.7). (2) `METEOR_VEIL.inkKeep` 0, with AC-30's arithmetic. (3) I1, I6 and I7. (4) When the user approves, the integration branch (P1 to P7 and PF) reaches master by the route in 8.5 step 2. Then P8, whose H7 oracle is today's planner with PF's `inkKeep`.
- **Visible change.** A shooting star burning out behind quiet copy no longer adds light on the letters themselves; it still dims through the padding, as today. Nothing else changes until P8.
- **Rollback.** Revert PF (P8 to P12 depend on it).

## 8. Coordination protocol

### 8.1 Stable seams (what the veil session's code reads from ours)

Until checkpoint V, this plan edits no veil-owned function, and it keeps every name their code reads stable in name and meaning, so that when the integration branch rebases onto their commit, their handlers keep working unchanged with our phases.

| Their code | What it reads | Note |
|---|---|---|
| The `scroll` handler (`sky.worker.ts:463-470`) | `scrollY`, `motion`, `parallaxScroll`, `lastScrollAt`, `noteInput(now)`, `rafId` (falsy when no frame is pending), `timerId` (undefined when no timer is), `needsDraw` | P3 changes `rafId`'s type to `number \| null` but not its meaning. Our `motion` handler also writes `parallaxScroll` on resume (P2), with the same meaning. |
| The `layout` handler (`:471-484`) | `documentHeight`, `sameRects`, `quiet`, `pinned`, `quietBefore`, `pinnedBefore`, `layoutAt`, `retryMeteors(now)`, `needsDraw` | `sameRects` moves to `scene.ts` in P1, still imported under that name |
| `quietBlend` and `settleQuiet` (`:227-243`) | `layoutAt`, `scrollY`, `quiet`, `pinned`, `quietBefore`, `pinnedBefore`, `lastDrawAt`, `needsDraw` | |
| `updateMeteor` (`:193-224`) | `meteor`, `radiant`, `launched`, `failedPlans`, `nextMeteorAt`, `revealAt`, `meteorsAllowed(now)`, `lastScrollAt`, `random` | `meteorsAllowed` keeps its name; P4 changes only its presence test |

P8 (after V) is the first phase allowed to rename or remove any of these.

### 8.2 Checkpoints

| ID | When | Action | Exit |
|---|---|---|---|
| **CP-0** | P0 | Send the message in 8.4 to the veil session: SendMessage if `ListAgents` shows "Star and comment animation redesign" (`local_e2e17660-e99d-43e6-84ab-7337ee88227d`); otherwise ask the user to relay it. It names the implementing session as a recipient of their confirmation and landing notices, which they promised to the planning session. Log it in `COORDINATION.md`. | Sent and logged. A reply is not required to proceed with P1 to P7. |
| **CP-1** | Before every phase | Starting from 246c0aa: `git fetch origin`; `git log --oneline <last-checked>..master -- src/lib/sky src/components/sky` (local master: the veil session commits in the main checkout, whose refs every worktree shares, and may never push); the same for `origin/master`; `git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky` (read only: their work still in progress), with each listed file's last-write time (metadata only, never the contents), so CP-4 can tell whether that work still moves; read any reply. `origin/master-r26syw` belonged to the defunct cloud session and needs no check. | If the veil commit landed: finish the current phase, run checkpoint V (8.5), then continue. After V it keeps running until the veil session says it has finished (its plan ends with an audit that may follow up); a later veil commit is merged into the integration branch by 8.5 step 2's rule. |
| **CP-2** | After each merge of a phase (P1 to P13, PF) into the integration branch, until the veil session says it has finished | Append a dated entry to `COORDINATION.md` on the planning branch (7.0), listing the files and functions the phase changed and confirming the stable seams (8.1); send the veil session the same note by SendMessage, or through the user. | Logged and sent. |
| **CP-3** | The veil commit lands | Checkpoint V (8.5). Then update `COORDINATION.md` (the SHA, the numbers received, the answers to I1 to I9) and reply with what we adopted. | P8 unblocked. |
| **CP-4** | P7 merged or skipped, and still no veil commit (D10); then weekly while the answer is to wait | Run CP-1 and send the veil session a status query (SendMessage, or the user relays it). Then ask the user D10's question: keep waiting, run PF (8.7), or merge P1 to P7 early with the veil session's agreement (7.0). | Each decision is logged, dated, in `COORDINATION.md` and `HANDOFF.md`; it ends at V or PF. |
| **CP-5** | The veil session's confirmed plan arrives (it comes before its commit) | Log it in `COORDINATION.md`. Re-check 8.1's seams, 8.3's I1 to I9 and 8.6's hotspots against its final names and its list of functions that changed shape. Tell the veil session at once about any function both plans rewrite (`frameMode`, `tick` or the `motion` handler, say, which P2 to P5 rewrite), before more phases stack on it. | Logged; every overlap raised. |

### 8.3 Interface requests

The names `nearCopy`, `launchScrollY` and `QUIET_REACH`, the options object, the kind-agnostic scroll-cancel helper, and the per-rect text class with per-class budgets are already agreed (COORDINATION.md log). The final names and signatures come with the veil session's confirmed plan.

| # | Request | Owner | Why | If declined or never delivered |
|---|---|---|---|---|
| I1 | `planFlight` and `planMeteor` take an options object with `nearCopy` (the path may pass near copy), and the returned `Meteor` reports `nearCopy` (it does). | veil (agreed) | The ink lease (P8): the scheduler holds the lease without re-checking the path. | After V we add both ourselves: the value is already a local at `meteors.ts:158`. |
| I2 | The direction source (`aim`, 6.10) and, in P10, the `fireball` option join that options object. The 18 to 42° filter goes, the end test gains the right edge and `METEOR.top`, and every flight that may take the lease peaks at most 0.9, the bound their ink budget assumes. | **ours**, after V (they said they won't add the direction source) | The population model (P9) and the fireball retune (P10). | Not applicable. We inform them, and it must not change `veiledFrom`. |
| I3 | One kind-agnostic scroll-cancel helper taking the launch scrollY, the current scrollY and the fade state. Our scheduler calls it for every active transient from P8, and the handler's own call moves into `updateTransients`. | veil (agreed) | One rule for every kind, testable without the DOM. Ticks run every frame while scrolling, so it acts within a frame. | Our rule: `\|scrollY − launchScrollY\| > TRANSIENTS.scrollCancel`, then a `cancelFade` fade (6.9). |
| I4 | Export `QUIET_REACH` from `scene.ts` (today `QUIET.feather`), and keep every zone's reach within it, per-class rects included. | veil (agreed name) | The quiet index is exact only while no zone reaches farther (Q1). | `quietIndex.ts` keeps its own constant; H3 re-checks it at every rebase. |
| I5 | The per-rect text class lives on `SkyRect` in `protocol.ts`, and the per-class ink budgets live in `config.ts` next to `METEOR_VEIL`. The budgets also cover the known far-star case: a veiled meteor on body text over a far star under the haze (0.053 plus 0.039 to 0.06 of white, against 0.064). | veil (agreed; the far-star case is our request) | The index passes rects through unchanged, but `sameRects` must then compare the class. The lease stays "one lit transient near copy" under any budget. The far-star case is section 11's one known 1.4.3 exceedance (AC-30). | The class and budgets: nothing to do. The far-star case, if their commit leaves it open and they decline or have finished: after V, with the user's OK and before P8, set `METEOR_VEIL.inkKeep` to 0 with its doc's arithmetic (PF item 1's change), then re-run AC-30. |
| I6 | Export `segmentTouches` unchanged. | request | Satellites and the could kinds share the planner's clear-sky test (DRY). | We export it after V: one keyword in a file that is shared by then. |
| I7 | `drawMeteor(ctx, assets, meteor, frame, fade = 1)` multiplies its train, wake, glow and core alphas; the wake tint comes from `meteor.wakeColor` (`meteor.wake` stays the afterglow time constant). | request | The cancel and pause fades (a frozen or cut streak looks broken), and the speed-class colors. | We add both after V. Until then a cancelled meteor is dropped, as today. |
| I8 | Their numbers: the commit SHA; the final names and the functions that changed shape; the share of accepted flights that burn out behind copy and crossings per minute, on captured layouts, for today's and the new direction mix; the scroll-cancel distance and fade; the per-class budgets. Optionally, cache `quietBlend`'s zone arrays per scroll and layout: it allocates about 64 rects per call, and drift calls it 20 to 30 times a second. | request | They set `scrollCancel`, `cancelFade` and the crossing cooldown (AC-38) and confirm section 11. | We capture layouts ourselves (a local patch that logs `layout` messages), run H8 and H9 on them, and set the cooldown from the measured crossing share (6.9). The allocations are minor garbage. |
| I9 | Keep the stable seams of 8.1. Confirm that the kinds that never take the lease and add zero light inside any padded rect (satellites; the point flash, bursts, earthgrazers and the static comet of P12) may overlap a lease-holding meteor in time. | request | Our phases land on top of theirs, and satellites need that overlap (COORDINATION.md: "Transients that light up near copy must not overlap in time unless they share one ink budget"). | If they say no, or never answer (PF included), the rule runs both ways from P11 until they agree (6.9, steps 3.2 and 3.3): a never-lease kind waits while a lease holder is active, and a meteor takes the lease only while nothing else is active and no comet shows. It costs about 3% of leases [computed, check report]. |

### 8.4 The CP-0 message (ready to send)

> From the sky-ambient-motion implementing session: integration branch `claude/sky-ambient-motion-impl` in the worktree `.claude/worktrees/sky-ambient-motion-impl`; the plan is `.claude/plans/sky-ambient-motion/PLAN.md` on `claude/quirky-carson-btv2u4`. Our plan builds on your veil fix. We build its veil-independent phases first, on that branch, and nothing of ours reaches master until your commit has landed and we have rebased onto it, unless you agree to an earlier merge. We never edit the main checkout.
>
> **What we won't edit until your commit lands:** `veiledFrom`, `planFlight`, `planMeteor`, `updateMeteor`, `METEOR_VEIL`, `QUIET`, the `METEOR` spawn and selection keys, the `scroll` and `layout` handlers, `quietBlend`, `settleQuiet`, `drawMeteor`/`drawTrain`, the quiet functions in `scene.ts`, and the quiet-rect measurement.
>
> **What we plan to build before it lands:**
> - sub-pixel star sprites;
> - a per-tile quiet index for stars, which calls your `easedQuietFactor` on tile subsets (bit-identical);
> - continuous depth and a scroll glide through one camera;
> - frame pacing on divided animation frames;
> - presence pings (pointer, keys, focus);
> - a pause control that maps to `motion: 'reduced'`;
> - the ambient drift (stars only: your quiet factors apply per star per frame);
> - optionally, a pointer lean.
>
> **Seams we keep stable for your handlers:**
> - `rafId` (now `number | null`, still falsy when nothing is pending) and `timerId`;
> - `noteInput`, `parallaxScroll`'s meaning, `retryMeteors` and `meteorsAllowed`;
> - `sameRects`, which moves to `scene.ts` (exported) in our first phase; your layout handler only changes its import.
>
> **After your commit:**
> - shooting stars join one scheduler (one ink lease, one scroll cancel, at most 5 s each), and we add a direction source (`aim`) and a `fireball` option to your planner's options object without touching `veiledFrom`;
> - `planFlight`'s end test also gains `end.x > width − edgeMargin` and `end.y < METEOR.top`, using your guard values, and flights that may take the lease keep peaks at 0.9 or less; tell us if your commit changes the end test;
> - satellites (and perhaps a static comet) come later, in clear sky only, with zero light inside any padded rect (near-layer keeps) and never taking the lease.
>
> **Requests:**
> 1. As agreed: `nearCopy` in the options object and on the returned meteor; the kind-agnostic scroll-cancel helper, which our scheduler will call for every kind; `QUIET_REACH`; the per-rect text class in `protocol.ts` and the budgets in `config.ts`.
> 2. Please also export `segmentTouches`, and give `drawMeteor` a `fade = 1` multiplier.
> 3. Please send your SHA, your final names and signatures, your cancel numbers, the crossing share and crossings per minute on your captured layouts, and the per-class budgets. Do the budgets cover a veiled meteor on body text over a far star under the haze (0.053 plus 0.039 to 0.06 of white, against 0.064)? If not, may we set `METEOR_VEIL.inkKeep` to 0 after your commit, as `CONTRAST_MORE.meteorInk` already does?
> 4. Can the kinds that never take the lease and add no light inside any padded rect (a clear-sky satellite; later perhaps a point flash, a burst, an earthgrazer or a static comet) overlap a lease-holding meteor in time? Until you agree, none of them will. The comet has no launch scroll, so instead of the shared cancel it is gone by 0.4 viewport heights, adds no light inside any padded rect at any scroll, and fades when its box meets a rect: tell us if you need the shared cancel instead.
> 5. Please send your confirmation (again, if you already sent it to the planning session) and your landing notice to this implementing session too (ListAgents shows it), or to the user if you can't reach it.

### 8.5 Checkpoint V: when the veil commit lands

1. Read the commit and its final plan, and log both in `COORDINATION.md` with their numbers and the answers to I1 to I9.
2. Finish and commit the current phase, then rebase the integration branch onto their commit (or onto master if they merged it there). Resolve the hotspots (8.6) by one rule: inside a veil-owned function theirs wins; in a function we rewrote, ours wins on structure, but every line their commit added there is ported into it (list those first: `git diff 246c0aa..<their SHA> -- src/lib/sky src/components/sky`); for shared types and the message switch, keep both.
   - **The route to master**, once step 4 passes and the user approves. Master is checked out in the main checkout, where the veil session works, and Git refuses to move a branch another worktree has checked out (`git branch -f`, `git fetch . x:master` and `git push . x:master` all refuse). So push the integration branch and open a PR into `origin/master`, which the user merges or approves. If their commit isn't on origin yet, ask the veil session or the user before pushing a branch that contains it. The main checkout's local master is then fast-forwarded only by the user, or with their approval once `git -C S:/Documents/repos/Portfolio status --short` shows no uncommitted sky edits and the veil session has been told.
3. **Kill-switch identity.**
   - Set these temporarily: `STAR_PHASES = 1`, every `SCENE.*.drift = 0`, `CAMERA.snapViewports = 0`, `LEAN.reach = 0`, and `snap` forced true.
   - Then H2 at scroll 0 on the rebased tree must equal H2 on their commit (`SKY_SRC` at an archive of it). Our phases add nothing visible beyond their intended effects.
   - At other scroll positions only P2's continuous depth differs.
4. Re-verify against their code (8.6), then run lint, type-check, H1 to H6 and H11 to H13, and the 60-second watch.
5. Adopt their numbers: `scrollCancel`, `cancelFade`, and any `METEOR_VEIL` change. If they exported `QUIET_REACH`, import it in `quietIndex.ts` and delete ours. Recheck the ink lease against any per-class budget. If their budgets leave the far-star case open, apply I5's fallback before P8.
6. Unblock P8, update `HANDOFF.md`, and reply to the veil session.

### 8.6 Merge-conflict hotspots and what to re-verify

| File | Function or block | Ours | Theirs (likely) | Resolution |
|---|---|---|---|---|
| `sky.worker.ts` | `frameMode`, `schedule`, `tick`, `onFrame`, `onTimer`, `cancelFrames` | replaced (P3) | maybe a fade demand for a cancelling flight, a new reason in `frameMode`, or a step in `tick` that applies a deferred layout | port every reason, call or condition their commit adds there: reasons into `frameDemand` as more lines, calls into our `tick` |
| `sky.worker.ts` | `draw` | `drawTransient` per transient (P8, after V) | maybe drawing for the cancel fade | V keeps theirs; P8 edits on top of it |
| `sky.worker.ts` | the `scroll` handler | untouched; read only | the scroll cancel | at P8, move their cancel call into `updateTransients` (I3) |
| `sky.worker.ts` | the `layout` handler, `quietBlend`, `settleQuiet` | untouched until V; `quietBlend` read in `frameAt`; `sameRects` import moved; after V, P8's `retryTransients` (and `forgetVisitSky` if their radiant re-picks there) and P9's `forgetVisitSky` | the mid-ease deferral | the index compares contents; P9's `forgetVisitSky` goes wherever their commit replaces `quiet` and `pinned`, deferred or not (CP-5, V) |
| `sky.worker.ts` | `updateMeteor` and its state | replaced by the schedule (P8) | radiant ordering, sticky radiant, long passes before the fallback | port their logic into the meteor spec (P8), and keep their pass order in P9's aims (6.9) |
| `sky.worker.ts` | `init`, `motion`, `visible`, `noteInput`, presence | P2 to P5 | none expected | keep the seam names |
| `renderSky.ts` | `SkyFrame` | `camera`, `snap`, `quietIndex` | maybe per-class ink fields | keep both sets of fields |
| `renderSky.ts` | `drawLayer`, `StarField`, `drawSky` | P1, P2 | none expected | |
| `renderSky.ts` | `drawMeteor`, `drawTrain` | only I7, after V | the veil, per-class ink | theirs first, then I7 |
| `scene.ts` | `SceneLevels`, `sceneAt`, `sameRects` | `drift`, `lean`, `launches`; `sameRects` moved in | maybe `sameRects` comparing a text class | keep their comparison in the moved function |
| `scene.ts` | `quietAt`, `inkAt`, `quietFactor`, `easedQuietFactor` | read only | per-class ink | rerun H3 |
| `config.ts` | `LAYERS`, `SCENE`, `FRAME`, `ADAPT`, new blocks | P1 to P11 | `METEOR_VEIL`, `QUIET`, `METEOR` spawn keys, doc comments | new blocks never reuse their keys |
| `meteors.ts` | `planFlight`, `planMeteor`, `nextMeteorGap` | I2, P9, P10 | theirs | after V only |
| `protocol.ts` | `SkyMainMessage`, `SkyRect` | `activity`, `pointer`, the `SkyMotion` doc | the text class on rects | union |
| `mountSky.ts` | listeners, `motion()`, `destroy` | P4, P5, P7 | rect measurement, entrance offsets | different functions; check they didn't change `motion()` |

**Re-verify after the rebase:**

1. **H3:** the quiet index is still exact against their `quietFactor`, `inkAt` and `easedQuietFactor`, with `QUIET_REACH` covering every reach and per-class keeps passing through `factor`.
2. **The kill-switch identity** (8.5, step 3).
3. **The camera** still reads `parallaxScroll` with the same meaning. Their `scroll` handler still calls `noteInput` (presence) and sets `lastScrollAt` (frame demands, the launch gate).
4. **No star pops** while stars drift through their eased and deferred layouts: AC-16 (b), no star's alpha changing faster than the quiet ease allows (at most 2 a second) while rects are re-measured; their deferred layout still applies after the rebase (any step they added to `tick` survived).
5. **The scroll cancel**: at V their cancel still fades a flight (any reason they added to `frameMode`, or drawing in `draw`, survived); from P8, one cancel for every kind, with their distance and fade (AC-40).
6. **The lease** still means one lit transient near copy under their budget (AC-38).
7. **The first launch timing** after their settled-layout fix (AC-19).
8. **Section 11's contrast numbers** against their final `METEOR_VEIL` comment, which must still state the one-transient budget, and the far-star case (AC-30) closed by their per-class budgets or by I5's fallback.

### 8.7 If the veil work never lands (PF)

- **Trigger.** Only the user's decision at CP-4 (D10). Not before: the veil session asked to land first, and its fix is the better product.
- **Handshake.** Before any PF edit, message the veil session (SendMessage through `ListAgents`, or the user relays it), naming the functions PF takes over (8.4's list), and check the main checkout for uncommitted sky edits (`git -C S:/Documents/repos/Portfolio status --short -- src/lib/sky src/components/sky`, read only). Wait for its answer, or for the user's confirmation that it has stopped. While it is still active, PF waits: both sides editing the planner, `drawMeteor` and `METEOR_VEIL` at once would collide.
- **Ownership.** Record the takeover and the exchange in `COORDINATION.md` and `HANDOFF.md` (on the planning branch): the veil-owned functions become this plan's.
- **What PF does, and only this, keeping the same invariants:**
  1. **Contrast stays safe without their fix.** Today's `veiledFrom` and its rules are stricter than they need to be: dimming can't start before 65% of the flight, so fewer flights cross copy. Keep them exactly as they are, with one change that closes the known exceedance (section 11, AC-30): `METEOR_VEIL.inkKeep` becomes 0, as `CONTRAST_MORE.meteorInk` already makes it under prefers-contrast: more. A meteor then adds no light on the copy itself, so a far star's 0.039 to 0.06 of white stays within the 0.064 of headroom under the haze. The `METEOR_VEIL` doc's arithmetic changes with it.
  2. **The scroll cancel** fixes the verified bug in which unquiet copy, such as About, scrolls under a meteor head at about 1:1 contrast. P8 itself fixes it: `updateTransients` cancels any transient once the page scrolls `scrollCancel` px from its launch, for every kind, with no edit to the scroll handler.
  3. **The one ink lease and the crossing cooldown** are P8's and P9's own (T2, 6.9).
  4. **I1, I2, I6 and I7 by us:** the `nearCopy` option and field, the `aim` and `fireball` options, the `segmentTouches` export, and `drawMeteor`'s `fade` and wake tint (the tint with I2, in P9). `veiledFrom` and the veil math stay unchanged. With no answer to I9, its fallback runs both ways: kinds that never take the lease wait for a free lease, and no meteor takes the lease while one of them is active or the comet shows.
  5. **Only with the user's explicit OK**, because they are the veil session's planned fixes and not needed for this plan's invariants: deferring a layout that arrives mid-ease (a star pop), and removing entrance-transform offsets from the measured rects. The sticky radiant needs no fix: the visit's sources replace it in P9.
- **Left open, documented in `COORDINATION.md`:**
  - the strict `clearUntil`, which means fewer crossings than the redesign intended;
  - the cosmetic star pop when rects are re-measured mid-ease;
  - rects first measured mid-entrance. This is mitigated, because the first shooting star waits 4.5 to 7 s, after the 1.5 s re-measure (`mountSky.ts:42-47`).
- **Verification.** PF's own: AC-16 (a) (PF leaves the re-measure pop, AC-16 (b), open), AC-19 to AC-22 as today, and AC-30 with `inkKeep` 0 (the far-star case closed). P8's, once it runs on PF: AC-37's invariants, AC-38, AC-40, and a check that a meteor never stays lit over unquiet copy for more than `cancelFade` after a scroll.
- **Then** the integration branch reaches master by the route in 8.5 step 2 when the user approves (PF step 4), and P8 to P12 run on top of PF, as planned. Uncommitted veil edits left in the main checkout are the user's to keep or stash, never ours to build on.

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
| AC-4 | Smooth turning (amended) | Turn rate at most 4.4°/s with no step, mean 2°/s ± 0.2; speed never under 0.58 v₀; in the first minute after the dusk, within 30° of level for at least 50 s. R4 asked for at most 15°/min, which the settled epicycles don't meet by design (6.1). | H5, L | P6 |
| AC-5 ★ | No starts, stops or reversals | From 6 s after load, once the dusk ease is over (AC-9 covers the eases): speed changes at most 10% per second (design 3.8%); no stop in 60 s | H5, S | P6 |
| AC-6 | No oscillation | No component between 0.05 and 0.5 Hz (the drift's are 0.0056 to 0.0134 Hz) | C, H5 | P6 |
| AC-7 | No visible repeat (amended) | Within 30 minutes, no 60 s stretch of path matches an earlier one within 5 px at q = 1, compared with the two stretches aligned at their first points, since a repeated shape is what would show (design 6.4 px, at a 9-minute lag; 9.8 px comparing absolute positions; about 4 px after the best translation); exact repeat only after 25 h. R4 asked "never within 50 px of an earlier offset", which no bounded path can meet. | H5 | P6 |
| AC-8 ★ | No edge pops | No star appears or vanishes inside the viewport in one frame (EDGE 24 ≥ the 9 px halo) | S | P1, P6 |
| AC-9 | Rate changes never jump | At scene changes, idle, pause, reduced motion, resize, the 640 px crossing and the lean entering or leaving: largest per-frame displacement ≤ normal + 0.25 px, except M1's one settle on the first full-motion frame after a still load (at most 0.5 device px per axis, once per page view) | H5, H13, S | P2, P5, P6, P7 |
| AC-10 ★ | No pixel stepping (amended) | True positions (the debug log's camera offset × q × dpr): at most 0.5 device px per drawn frame for every star (design at most 0.50 at v₀ = 3). A held frame doubles the next step (about 0.9 device px for the brightest star at DPR 2), so this bound and AC-13's intervals catch a stall. Drawn positions: at most 0.5 device px per axis per frame, each axis within 1/8 device px of its true position (the quarter-pixel phases; diagonal drawn steps reach 0.71). No line fit: a correct drift already misses a 2 s fit by 0.30 to 0.40 device px [computed]. R4 asked for 0.25 px, which needs 60 fps at DPR 2; 0.5 px is R3's settled step and within R1's 0.5 to 0.6 arcmin rule. | L, S | P3, P6, P13 |
| AC-11 ★ | No shimmer (amended) | Flux constant across phases (H1: within 0.6% unrounded and 2.5% in bytes); perceived peak swing ≤ 10% at DPR 2; DPR 1 judged by eye with the 0.85 floor decided (6.3). R4's 20% peak-pixel limit is below what the pixel grid alone gives at DPR 1 (20 to 35%). | H1, S, W | P1, P6 |
| AC-12 | No streaks | A moving star's sprite extent along its motion ≤ extent across + 1 device px | S, C | P1, P6 |
| AC-13 | Frame pacing | During drift, ≥ 95% of intervals within ±25% of k refreshes; worker JS ≤ 4 ms at p95 (≤ 2 ms on a mid laptop, B-1); no main-thread task over 50 ms from the sky | T, L | P3, P6, P13 |
| AC-14 | Energy | Budgets B-1 to B-7; 0 drawn frames after the idle timeout, while hidden, and when paused or under reduced motion with no scroll | T | P3, P4, P6, P7 |
| AC-15 ★ | Calm while reading (amended) | Drift at D2's level (default 0.35 of the hero; or 0), twinkle 0, no transients. At 0.35 the camera's drift speed at nearness 1 (debug log, read as 7.1 says) stays at most 0.5 v₀ (design peak 1.42 × 0.35 = 0.497 v₀), so the law's near-median star (q 0.941, H6) moves at most about 0.47 v₀ and no star on screen over 0.8 v₀ (1.41 and 2.4 px/s at v₀ = 3; design 1.0 on average and 1.40 at the peak for the near median, 2.39 for the brightest; R4 said 2); all scale with D2's level. The on-screen sample's near median isn't the test: it runs 0.45 to 0.55 v₀ at the peak across common sizes (6.1) | L, S | P6 |
| AC-16 | Restraint near copy | (a) A drifting star crossing a quiet edge changes alpha by at most 0.05 per drawn frame. (b) While rects are re-measured mid-ease, no star's alpha changes faster than the quiet ease allows (at most 2 a second: 0.78 × 1.5 / 0.6 s), with no one-frame pop | S, L | (a) P1, P6; (b) V |
| AC-17 ★ | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s report no apparent motion of the copy | W | P6 |
| AC-18 | Attention budget | No onset in the first 3 s after the reveal; onsets at least 3 s apart; at most one onset per 6 s on average (design one per 11 to 13 s) | H7, L | P8, P9 |
| AC-19 ★ | A first shooting star | 4.5 to 7 s after the reveal in ≥ 18 of 20 fresh desktop loads | L | P8 (recheck at V and P9) |
| AC-20 ★ | Frequency (amended) | First 60 s of hero: median 5, 3 to 6 in ≥ 8 of 10 runs (simulated 90%); never two meteors at once outside a burst; gaps stretch from minute 2 (×2 at 6 min, ×3 at 10); narrow screens ≤ 6 a visit. R4 said median 4 and a stretch after 3 minutes, for its 12 to 18 s gap. | H9, L | P9 |
| AC-21 ★ | Varied, believable directions (amended) | Over 10 meteors: ≥ 3 radiants and headings spanning ≥ 60°; climbs over 15° only from sporadic sources, at most 0.6 of the longest path and ≤ 10% of launches (D8; under its alternative, none over 10°); each shower meteor's path, extended on the sky as a great circle, passes within 4.5° (3σ) of the visit's shower radiant, whether the radiant is in front (paths fan out) or behind the viewer (they converge forward). R4 said "none rises more than 10°" (D8). | H8, L | P9 |
| AC-22 ★ | Light in, light out | Head light under 15% of its peak at the first and last on-screen points; never enters or leaves an edge bright; peaks in clear sky (the veil) | L, C | P8, P9 |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel (unchanged today) | C, S | P9 |
| AC-24 | Satellites (amended) | Speed varies under 2%; pass ≤ 4.8 s; no tail, no blinking; one at a time; at most one mid-sky fade per pass (a dusk pass slides in lit from a side and fades into the shadow; a dawn pass fades in over ≥ 0.8 s and leaves through a side); clear sky at launch; no light inside a padded rect, old or new; desktop hero only; a first attempt within 60 s on 39 ± 2% of simulated visits (E7). R4 asked for ≥ 40 s across and a 2 s fade, which break the 5 s rule (D9). | H7, L, S | P11 |
| AC-25 | Comet (if built) | Moves only by the camera law; fades in over ≥ 8 s; adds no light inside any padded quiet rect at any moment (every part drawn with `clearSkyFactor`), and its box stays `QUIET.feather` clear of them, re-tested on every drawn frame (the drift and the lean move it between scroll steps), fading over `cancelFade` when that fails; gone by 0.4 viewport heights of scroll, so never over reading copy; at most one a visit | S, H | P12 (after V) |
| AC-26 ★ | Reduced motion is still | With `prefers-reduced-motion: reduce`, two hero screenshots 30 s apart after the dusk are identical, and identical to P0's at scroll 0; no drift, glide, lean, twinkle or transients | S | P2, P5, P6, P7 |
| AC-27 | Live preference switch (amended) | Turning reduced motion on stops every star within 1 s, each moving at most 1.05 px after the switch (1.02 for the brightest at the drift's peak, the 0.3 s ease); turning it off resumes without a jump (after a load under reduced motion, apart from M1's one sub-pixel settle), even after scrolling while stopped; no shooting star for 3 s. R4 said "≤ 1 px" without an ease; the ease keeps that limit within rounding. | S, H5 | P2, P5, P6 |
| AC-28 ★ | Pause control (2.2.2) | Visible, named, keyboard-operable; its name and glyph switch with the action; stops drift, twinkle, parallax and transients within 1 s; still paused after a reload; other tabs follow; resumes from the paused positions; starts paused under reduced motion when nothing is stored; passes the G186 and F16 procedures. Focus: Tab order equals the visual order at every width (2.4.3); with the phone menu open, Tab and Shift+Tab never land on the covered control, and tabbing into a hidden header shows it, which stays while it holds keyboard focus (2.4.7, 2.4.11) | W, S | P5, P6 (fades from P8) |
| AC-29 | Forced colors and contrast | Forced colors hide the sky and the control; `prefers-contrast: more` drops the haze and dims the stars, drift allowed | S | P1, P5 |
| AC-30 | Contrast budget (amended) | Quiet copy: body text keeps ≥ 4.5:1 over the brightest moving star (drift changes positions, never alpha; the quiet factor at the drawn position); satellites and could kinds add no light inside padded rects; one lease. The far-star case (a meteor's 0.053 of white plus a far star's 0.039 to 0.06, against 0.064 under the haze) is closed by the veil's per-class budgets (asked in I5, checked at V), or by `inkKeep` 0 (I5's fallback, or PF). Reading copy (no quiet rects): stars behind it never brighter than today's at the same scroll, plus D2's chosen option | C, H3, H7 | P1, P2, P6, P8, P11, V |
| AC-31 | Flash safety | At most 3 luminance flashes in any second; each transient's change ≤ about 2,000 CSS px² (limit 21,824); no tint with R / (R + G + B) ≥ 0.8 | C, H10 | P8 to P12 |
| AC-32 | Hidden tab | After 60 s hidden, the sky reappears where it was (no leap of v × time hidden); no shooting star for 3 s; with P4's optional step, the twinkle continues where it left off | S, H5 | P3, P4, P6 |
| AC-33 | Idle | After 90 s without scroll, pointer, keys or focus, the drift and twinkle ease out over 4 s, then 0 frames; any input eases them back over 4 s, in every scene, including reading (F6) | T, S, H13 | P4, P6 |
| AC-34 | Resize and zoom | No star jumps beyond what the new layout requires; the drift continues; crossing 640 px changes speed only | S | P2, P6 |
| AC-35 | Pixel equivalence (new) | P1's draw calls equal P0's over the H2 grid; P2's equal P1's on the grid's scroll-0 rows, at camera (0, 0) with `snap` forced true | H2 | P1, P2 |
| AC-36 | Exactness (new) | Quiet-index difference 0; spring half-step composition difference 0 and overshoot 0; the drift bound and speed range as computed (6.1) | H3, H5 | P1, P2, P6 |
| AC-37 | Transient invariants (new) | T1 to T7 hold over 10⁵ random event sequences; every kind's first-to-last light ≤ 5 s from the config (H10); from P10, fireballs at 4% of launches, at least 120 s apart and none before 20 s, in about 12% of first minutes (E7) | H7, H10 | P8 to P12 |
| AC-38 | Ink lease and crossings (new) | Never two `nearCopy` transients at once; at most one lease grant per `crossingCooldown`; copy crossings per minute over a visit's first two minutes at or below today's planner's on the same captured layouts over the same window (about its crossing share × 1.6 a minute; 0.576 on R2's synthetic layout, 0.50 in the steady state), with the cooldown retuned up or down from the measured share if not (6.9) | H7, H9, L | P8, P9 |
| AC-39 | Scroll glide (new) | After any scroll that moves one way stops (a fling, a navbar jump, Home or End), at any frame rate, every star is within 0.3 CSS px of rest at 0.7 s on viewports up to 2,560 CSS px tall (the residual grows with the height: 0.44 px at 3,840) and settled by 1.2 s, with no reversal over 0.1 px, and none glides more than `maxLag` × H × 0.112 after the stop (about 25 px at H = 900); a jump in one step (an instant `scrollTo`) snaps; a sustained fling that moves less than a viewport per frame never does (C4) | S, H5 | P2 |
| AC-40 | Scroll cancel (new) | A transient starts fading once the page moves `scrollCancel` px from its launch scroll and is gone `cancelFade` later; a cancel never extends a life | H7, S | P8 |
| AC-41 | Hydration and presence of the control (new) | No hydration warning in the console or `/_next/mcp` `get_errors` on `/`; the control is absent during server rendering and until the sky's first frame, and gone if the sky fails | MCP, S | P5 |

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
- **When the sky draws nothing:**
  - under reduced motion, or paused (after the 0.3 s ease);
  - in the reading scene if D2 picks 0;
  - 90 s after the last input (the 4 s fade runs inside that window, as today's `idleTwinkle` does);
  - in hidden tabs.
- **Memory.** The atlas grows from 48 KB to about 0.7 MB at DPR 1 and from 127 KB to about 1.9 MB at DPR 2 (built in under 1.5 ms). The cell cache holds at most twice the cells in use, about 2.7 MB at 4K.

### 10.2 Frames a minute, today and after (60 Hz, DPR-2 laptop)

| State | Today | After P6 (v₀ = 3) and P9 to P11 | Note |
|---|---|---|---|
| Hero, present, no input | 900 (twinkle timer, 15 fps) | 1,200 to 1,800 (20 to 30 fps on animation frames) | twinkle rides along at no extra cost |
| Hero, shooting stars | about 100 extra (1.4 flights a minute, about 1.5 s each) | about 190 to 260 extra (about 6.4 s a minute at 60 fps: 4.7 flights of 0.96 s plus 0.39 s of wake) | every refresh while one flies |
| Hero, satellites | none | about 100 to 130 extra (3.3 s a minute at 60 fps) | 4.8 s every 89 s or so |
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
| B-6 | CPU, laptop | Hero drifting ≤ today's hero-idle CPU + 3 points of one core, and ≤ 10% of a core in absolute terms (R4 AC-14); reading at 0.35 ≤ today's + 1 point | Chrome Task Manager against P0 |
| B-7 | Phones | Drift ≤ 30 fps; no ADAPT step-down in 5 minutes on a mid Android; on an iPhone the worker stays under 4 ms a frame (Web Inspector) | device traces |
| B-8 | Satellites | ≤ 4.8 s of every-frame drawing per pass; scheduler update ≤ 0.05 ms a tick; planning ≤ 1 ms per launch | trace; H7 timing |
| B-9 | Shooting stars at the new rate | Every-frame drawing ≤ 10 s a minute in the hero (about 6.4 s for meteors plus about 3.3 for satellites, 10.2) | trace |
| B-10 | Memory | Atlas ≤ 2 MB at DPR 2; star cache ≤ 2 × the visible cells; no growth over 30 minutes | worker heap snapshots |

### 10.4 Battery levers, in order of effect

1. The 90 s presence gate (no frames when nobody is there), set by `FRAME.idleSleepMs`.
2. The reading drift (D2): 0 restores today's sleeping reading scene.
3. v₀ ≤ 3.3, which keeps DPR-2 60 Hz screens at 30 fps or less (D6).
4. `PACING.minFps`. R1's perceptual bound needs only 5 to 8 fps for the reading drift (R1 §4.4). If B-3 or B-7 fails, lower `minFps` to 12 for drift levels at or below 0.35 (one condition in `cameraDemand`) before cutting anything else.
5. The narrow cap and the ADAPT cap (30 fps each), and the WebKit relay (D7).

## 11. Accessibility conformance summary

| Criterion | Level | How the sky meets it |
|---|---|---|
| 2.2.2 Pause, Stop, Hide | A | Continuous drift and twinkle start automatically, last more than 5 s and run beside the copy, and decorative motion is not exempt (w3c/wcag #3478, #4921). So the page gets one control that stops every moving part of the sky at once (G186, G4) and resumes from the paused positions. It sits at the top of the page, is remembered, and is paused by default under reduced motion. It ships before the drift (P5 before P6). Each transient lasts at most 5 s (T1), which passes on the per-instance reading the veil session also uses, and the control stops transients too. The idle stop, hero-only transients, the scroll cancel and the long-visit slowdown are UX and battery choices, not the 2.2.2 mechanism: scrolling away is not "hide" (#5029), and reduced motion is the control's default, not the only mechanism (#3766, #4319). The control covers the sky only; the gradient cards' rotating border is page motion outside this plan (open question 9). |
| 2.3.1 Three Flashes or Below Threshold | A | At most one or two luminance flashes per transient (rise and burn-out, or a flare); bursts staggered ≥ 0.35 s, with no flares, so at most 3 a second. Every transient's changing area is at most about 2,000 CSS px², under 10% of the 21,824 px² limit (G176; R2 §9.2). No saturated red: the warmest drawable tint has R / (R + G + B) = 0.42, against the 0.8 threshold. |
| 2.3.3 Animation from Interactions | AAA | Scroll parallax, its glide and the pointer lean are interaction-driven motion. All stop under prefers-reduced-motion (C39, SCR40) and when paused: the springs hold. Twinkle and fades are opacity changes, which "motion animation" excludes. |
| 1.4.3 Contrast (Minimum): the veil | AA | Stars dim per star behind quiet copy (`data-sky-quiet`: the hero, Contact, the footer and the rails) exactly as today: the quiet index is bit-identical, and the factor is taken at each star's drawn position every frame. Drift changes positions, never alpha. One transient at a time may light up near copy (the ink lease), as the veil session's budget requires: about 0.053 of white for one meteor, against 0.082 of headroom for slate body text at 4.5:1 (0.064 under the haze). Satellites and every could kind add no light inside padded rects. **A known, pre-existing exceedance:** one meteor over a far star on body text under the haze (0.053 plus the star's 0.039, or 0.06 at a twinkle peak, against 0.064). The veil's per-class budgets should close it (asked in I5, re-checked at V, 8.6); if they don't, I5's fallback or PF sets `METEOR_VEIL.inkKeep` to 0 (8.3, 8.7). **Reading copy** (About to Other Projects) has no quiet rects, today or after this plan: stars sit behind it at the reading scene's levels (alpha at most about 0.25) and, with D2's drift, cross it slowly; D2 lists the options. The budget and its per-class refinement remain the veil session's. |
| 1.4.11 Non-text Contrast | AA | The glyph carries the state: green on navy is 14.1:1, and 12.7:1 on the phone menu's light navy. The focus ring is the global 2 px dashed green outline (`globals.css:80-83`). |
| 2.4.7 Focus Visible | AA | The global `:focus-visible` ring applies to the native button, and the header never slides away while it holds keyboard focus (6.8). |
| 2.4.11 Focus Not Obscured (Minimum) | AA | The header shows itself whenever focus enters it (P5); today a focused nav control in the hidden header sits fully off screen (`Navbar.tsx:79`). The control leaves the tab order while the open phone menu's panel covers it (`inert`). |
| 2.5.3 Label in Name | A | No visible text label, since it is an icon button; the accessible name is the sr-only text, which names the action the glyph shows. |
| 2.5.8 Target Size (Minimum) | AA | The control is 40 × 40 CSS px (minimum 24 × 24). |
| 2.1.1 Keyboard; 2.4.3 Focus Order; 4.1.2 Name, Role, Value | A | A native `<button>`: Tab, Space, Enter. It comes last in `<nav>` with no CSS `order`, so focus follows the visual order at every width. Its name tracks the action (the APG rotation control), and it has no conflicting `aria-pressed`. |

## 12. Risks and open questions

### 12.1 Risk register

L is likelihood and I is impact (H, M, L).

| ID | Risk | L | I | Mitigation | Trigger and owner |
|---|---|---|---|---|---|
| R-1 | The veil commit never lands | M | H | P1 to P7 need nothing from it to be built, and reach master at V, after PF, or earlier with the veil session's agreement (D10), always by the route in 8.5 step 2; PF takes over the minimum with today's strict veil and the same invariants | CP-4; the user decides (D10) |
| R-2 | The veil commit lands with interfaces unlike I1 to I9 | M | M | Every request has a fallback (8.3); the meteor spec adapts to whatever `planMeteor` becomes | V; the implementer |
| R-3 | Merge conflicts in the shared files | H | M | New code in new files; appended config blocks; stable seams; rebase as soon as CP-1 sees the commit; hotspot rules and kill-switch identity (8.5, 8.6) | V; the implementer |
| R-4 | WCAG 2.2.2 read as "decorative motion is exempt" | L | H | The control ships anyway, before the drift; it is cheap, and the working group has said decorative motion is not exempt | P5 |
| R-5 | Induced motion: the copy seems to drift, or a vertical heading reads as scrolling | M | M | The faint majority nearly still; a horizontal opening (D6); AC-17 with three reviewers. If it fails: v₀ 2.5, or flatten the drift's vertical part with one constant (a y-scale of 0.5 in `driftAt`, accepting a minimum speed of 0.29 v₀ during vertical stretches) | P6 watch; the user |
| R-6 | Battery: continuous frames where the sky used to sleep (reading) | M | M | The levers in 10.4; B-3, B-6 and B-7 measured against P0 | P6; the implementer |
| R-7 | The phone GPU cost is an estimate (2 to 4 ms a frame) | M | M | The 30 fps narrow cap; B-7 on a mid Android; lower `minFps` or the reading drift if it fails | P6 devices |
| R-8 | WebKit's unaligned 15 ms worker clock judders (about 4.5 jolts a second) and ignores Low Power Mode | H (Safari) | L to M | Detect it; uncapped motion every tick, capped drift every third tick on phones; P13 only if device tests show judder or drain | P6 devices; D7 |
| R-9 | DPR-1 shimmer (about 20% max-pixel swing for 1-D motion at σ 0.7, inherent to the grid) | M | L | The 0.85 device px floor, decided by eye on a DPR-1 monitor | P6 |
| R-10 | Crossings rise above today's at the new rate | M | M | New directions before the new rate (inside P9); the cooldown starts at 55 s and is set up or down from the crossing share measured on captured layouts (6.9); above a share of about 0.3, a slower rate; AC-38 | P9; the veil's numbers (I8) |
| R-11 | A transient breaks 5 s (R2's 3 s fireball plus its train, say) | L | H | Fireball flights stay 1.8 to 2.5 s; the scheduler rejects longer plans; H10 asserts every kind from the config | P8 to P12 |
| R-12 | A hydration mismatch from the stored pause | L | M | `useSyncExternalStore` with a null server snapshot; the reveal remount; AC-41 | P5 |
| R-13 | `localStorage` unavailable or throwing | M | L | Every access in try/catch; the choice holds for the page view | P5 |
| R-14 | Composition wander: bright stars drift up to 328 px from the reviewed frame over a few minutes; and after pausing, scrolling and pressing Play, the hero keeps a shift of up to 0.112 × the scroll skipped (C8), until a reload | H | L | The quiet zones keep the contrast guarantees; the reviewed sky is exact at the dusk; a 150 s period shrinks the wander about 17%. If the kept shift is disliked: let `shift` relax toward 0 by a share of each step's scroll change, so the hero composition returns as the visitor scrolls back | P6 review; the user |
| R-15 | Continuous depth changes the reading composition (the brightest stars follow 11% of the scroll, not 7%) | M | L | Review in P2; no config value restores the three per-layer values, so revert P2 (depth and glide together) if disliked | P2; the user |
| R-16 | The scroll glide reads as rubber-banding: navbar links, and Home and End in most desktop browsers, smooth-scroll (`globals.css:55`), so every jump between sections ends in a glide | L | L | `CAMERA.maxLag` caps every glide at about 25 px for the brightest star at H = 900 (6.1); `maxLag` 0.15 or `scrollOmega` 12 tightens it; the kill switch `snapViewports = 0` | P2 |
| R-17 | The idle stop reads as "it stopped" | M | L | Pointer, keys and focus count as presence (P4); `FRAME.idleSleepMs` is one knob | P4, P6 |
| R-18 | Harness-only verification misses browser behavior | M | M | Every phase has browser checks and ends with a production smoke build; real devices in P6 | each phase |
| R-19 | A watchdog false positive under GPU back-pressure, a context loss or an occluded window | L | L | One timer frame per miss; a switch only after three misses in a row, undone by the 5 s probe, a context restore or a return to the tab | P3 |
| R-20 | More per-frame garbage (`quietBlend` allocations at 20 to 30 fps) | M | L | I8's cache; otherwise minor GC | V |
| R-21 | No test runner: later changes break the invariants unnoticed | M | M | D5 (Vitest is the low-friction option); the harness kit is reproducible from this plan | the user |
| R-22 | Satellites at 4.8 s read as slow meteors | M | L | Steady light, no tail and a constant speed tell them apart; D9 holds the realistic version | P11 |
| R-23 | Two WCAG 2.2.2 questions are unsettled: repeated short animations (#4447) and reduced motion as the mechanism (#4319, #3766) | L | M | The plan takes the conservative side of both: 5 s per transient, plus the control | none: a standing choice |

### 12.2 Open questions

1. Will the veil session accept I3 as a helper our scheduler calls, rather than code in its scroll handler? And what are its final numbers (I8)?
2. May the kinds that never take the lease (satellites, the point flash, bursts, earthgrazers, the comet) overlap a lease-holding meteor (I9)?
3. Is 90 s still the right idle window now that pointer and keys count?
4. The DPR-1 floor (0.85 device px) for moving stars: decide by eye in P6.
5. Is the phone GPU cost within budget (B-7)?
6. Should the end bookend's twinkle (0.8) and drift (0.8) stay as today's config and R1 set them, or match the hero?
7. The thresholds are lab numbers for high-contrast targets and younger eyes (R1 §4.2). Tune v₀ by eye on a laptop, a phone and a DPR-1 monitor, ideally with an older viewer.
8. Decisions D1 to D11 (section 3).
9. Page-level 2.2.2: the gradient cards' border (`.gradient-card`, `globals.css:273-278`, used through `Card.tsx:7`) also rotates continuously under `prefers-reduced-motion: no-preference`, and the sky's control doesn't pause it. This plan leaves it out of scope. A small follow-up could pause it from the same store (a root attribute that sets `animation-play-state: paused`).

## 13. Sources

**Next.js 16.4.2 docs** (`node_modules/next/dist/docs`):

- `01-app/01-getting-started/05-server-and-client-components.md`: the `'use client'` boundary, lines 178 to 188; browser APIs need Client Components.
- `01-app/02-guides/preventing-flash-before-hydration.md`: client values and hydration errors, line 11.
- `01-app/03-api-reference/08-turbopack.md`: magic comments on `new Worker()` expressions, line 130; `turbopackWorkerAssetPrefix`, line 482.
- `01-app/02-guides/scripts.md`: the `worker` strategy is experimental and doesn't work with the App Router, line 128.

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

## Check log

### Round 1

Four checkers (`drafts/check-r1-*.md`) raised 70 findings: 4 blocking, 26 major, 40 minor. All were fixed (C17 in part) and none was rejected; the round-2 reports confirm that each fix landed. Where each lives:

| Lens | Finding: where it was fixed |
|---|---|
| physics-math | PHY-1 (blocking): aim step 8, `METEOR_BRIGHTNESS`, I2, H10. PHY-2 (blocking): I2's end test, H8. PHY-3: the one-step snap (`lastGoal`), C5, H5, AC-39. PHY-4: A1, 6.3, H1, AC-11. PHY-5: `pickVisitSky` step 3, R1, H8. PHY-6: step 3's in-view rejection. PHY-7: great circles in H8 and AC-21. PHY-8: the spawn-area targets (6.10, H8). PHY-9: one mid-sky satellite fade, D9, AC-24. PHY-10: AC-15. PHY-11: C3, 6.5, deviation 10, C8, R-14. PHY-12 to PHY-20 (minor): medians in E1 and AC-1; average pacing (6.2, P3, B-2); SP1's wording; AC-5's start; AC-27's 1.05 px; AC-10's line fit; AC-16 (a) and (b); numbers in 2.2, 6.3, 10.2, H10, AC-7 and AC-38; `gaussian`'s `1 − random()`. |
| code-grounding | CG-1: the worker's `transients`. CG-2 (with C2): cooldown 0 in P8. CG-3: the fallback timer armed against the last frame. CG-4: the message `switch`. CG-5 (with CA-3, C7): the `inert` wrapper. CG-6: `clearSkyFactor`. CG-7: with PHY-11. CG-8 (with C14): `settleMotion`. CG-9: `combineDemands`' cap. CG-10: `leanPending`. CG-11 (with CA-14): DOM order. CG-12: seconds at the call sites. CG-13: `reprobeMs` and strike resets. CG-14: `parallaxScroll` written by both. CG-15: D5's `node --test`. CG-16: worker docs, README, 5.1, 5.2. |
| coordination-a11y | CA-1 (blocking): the integration branch. CA-2 (blocking): the comet blocked on V. CA-3: with CG-5. CA-4: reading copy has no quiet rects (2.2, D2, AC-30, 11). CA-5: PF's `inkKeep` 0. CA-6: CP-1's local checks. CA-7: PF's handshake. CA-8: I9's fallback. CA-9: PF's contradictions. CA-10: the 55 s start. CA-11: P5 before P4. CA-12: the lease at the launch step. CA-13: could kinds through `clearSkyFactor`. CA-14: with CG-11. CA-15: the header and `:focus-visible`. CA-16: D1's quiet duties. CA-17: open question 9. |
| completeness | C1: with PHY-4. C2: with CG-2. C3: P6 step 4 and v₀. C4: every phase's parts. C5: with CA-6. C6: `pickVisitSky`'s steps. C7: with CG-5 and CG-11. C8: the "Affects" column. C9: P8's and PF's files. C10: the P9 removal list and docs. C11: kill switches. C12: RADIANTS units, `LEAN_POINTER_QUERY`'s doc. C13: both optional steps "do it". C14: with CG-8. C15: logs on the planning branch. C16: E7 and AC-28. C17 (in part): the stray source, 10.2 and B-9. |

### Round 2

Four checkers (`drafts/check-r2-*.md`) raised 36 findings: 9 major, 27 minor, none blocking. All held and were fixed (C27 in part); none was rejected. The reviser re-ran the key numbers with scratch scripts (`reviser-r2/`). Where each lives:

| Lens | Finding: where it was fixed |
|---|---|
| physics-math | PHY-1: one usability test for both `pickVisitSky` branches; on-screen radiants on wide screens only (deviation 14); fresh aims per launch, and a failed launch clears the sky (R1, 6.9); H8 at 393 × 852. PHY-2 (with C21): AC-1, AC-2 and AC-15 test the law times the measured speed. PHY-3: `CAMERA.maxLag` (6.1; its velocity rule revised in round 3). PHY-4: the brightness figures (2.1, `METEOR_BRIGHTNESS`, P9). PHY-5: AC-39 and H5 at 0.7 s and 1.2 s. PHY-6: with CG2-3 (round 3's CG3-2 corrects its "no hop": a still load's first Play settles once). PHY-7: with C20. PHY-8: the 40 px minimum for shower aims only. PHY-9: earthgrazers at 0.3 of the width. PHY-10: seven slips (the sprite bytes in A1, 6.3, H1 and AC-11; 89 s; 6.4 px; AC-2's peak medians; the brightest mid-layer star; E3's 640 px exception; cell 14,680). |
| code-grounding | CG2-1: `leanPending` needs full motion (6.2, 6.13, H13 case 5, AC-14 in P7). CG2-2: the fallback timer, k periods after the last frame (6.2, H4). CG2-3: `skyMoved` (M1, S4, 6.1, 6.3). CG2-4 (with C25): `dropTransients` keeps the visit's memory; `forgetVisitSky` (its P8 call added in round 3, CG3-1). CG2-5: a production build ends every phase. CG2-6: P2 and AC-35 compare H2's scroll-0 rows. CG2-7: `radiantTries` redefined; the fireball path through I2 (6.10). CG2-8 (with CA2-7): 8.5 step 2 ports their lines; 8.6's `tick` and `draw` rows. |
| coordination-a11y | CA2-1: the route to master (8.5 step 2, 7.0, PF, 8.7, CP-1, CP-2, D10, R-1). CA2-2: the comet's guards (6.12, AC-25, I9). CA2-3: with C20. CA2-4: P5's rollback. CA2-5: the CP-0 signature and I2's end test. CA2-6: CP-5. CA2-7: with CG2-8. CA2-8: D1's wording. |
| completeness | C18: step orders (residue fixed in round 3, CG3-3). C19: `wakeColor`. C20: the two-way cooldown and its table (6.9, deviation 11, H9, AC-38, P9, I8, R-10). C21: with PHY-2; `speed` in `debug-frame`. C22: `renderSky.ts` in P4 and P6; the ADAPT fade. C23: with CG2-7 and PHY-1. C24: PF's verification; AC-37 from P10. C25: with CG2-4. C26: P5's rollback, D10's answer, PF's visible change. C27 (in part): AC-2, the copied bodies, the compressed round-1 log; the rest left to the DRY audit. |

### Round 3

Four checkers (`drafts/check-r3-*.md`) raised 25 findings: 6 major, 19 minor, none blocking (C28 to C31 repeat CG3-1, CG3-3, CG3-4 and CG3-2). The reviser checked each against the plan, the code at 246c0aa and the research, and re-ran the key numbers with its own scratch scripts (`reviser-r3/`: the lag cap, AC-10's fit, AC-7's stretches, the speed table, the checklist mapping). All 25 held and were fixed (C35 in part); none was rejected.

- r3-physics-math-PHY3-1 (physics-math, major): fixed. A binding lag cap sets the spring's velocity to its steady trail, ω × lag / 2 (`stepCamera`, 6.1, C4, SP1, the `CAMERA` doc); H5 adds flings to 25,000 px/s and R-16's settings. Re-run: no overshoot (up to 4.85 px before); 30, 60 and 144 Hz within 0.11 px.
- r3-physics-math-PHY3-2 (physics-math, major): fixed. AC-10 bounds the true step and the drawn step per axis; the line fit is gone (re-run: a correct drift misses it by 0.30 to 0.40 device px).
- r3-physics-math-PHY3-3 (physics-math, minor): fixed. AC-7 and 6.1 align the stretches at their first points (re-run 6.38 px; about 4 px after the best translation).
- r3-physics-math-PHY3-4 (physics-math, minor): fixed. AC-39's 0.3 px holds up to 2,560 CSS px tall (0.44 px at 3,840, re-run); H5 adds H = 3,840.
- r3-physics-math-PHY3-5 (physics-math, minor): fixed. v₀ or the nominal speed in 2.1, 6.2 and AC-2; "about 0.47 v₀" in AC-15; the speed table from exact band means; 1.25 px/s in 6.1; 18 to 60° in `SKY_WINDOW`.
- r3-code-grounding-CG3-1 (code-grounding, major): fixed. From P8 every radiant reset outside the planner becomes `forgetVisitSky` (6.9, `VisitMemory`, P8's files and step 3, H7's resize case); P9 adds only the layout call.
- r3-code-grounding-CG3-2 (code-grounding, minor): fixed by stating M1's one-time settle (at most half a device pixel per axis) in M1, deviation 13, E11, 6.1, 6.3, AC-9, AC-27 and H13; easing it would need each star's rounding at the switch.
- r3-code-grounding-CG3-3 (code-grounding, minor): fixed. P3 declares `softwareFps` early and lands the frame mechanism with the divisor; P4 adds the message first; P6 and P7 pass a zero drift and lean; P8 step 1 adds I1 when declined.
- r3-code-grounding-CG3-4 (code-grounding, minor): fixed. `PlanContext.sinceReveal` in P10, from the launch gate.
- r3-code-grounding-CG3-5 (code-grounding, minor): fixed. If their commit splits the passes, `planMeteorTransient` keeps their order (6.9, P9, H8, 8.6); CP-5 settles the shape.
- r3-code-grounding-CG3-6 (code-grounding, minor): fixed with CA3-4: the comet's box is re-tested every drawn frame (6.12, AC-25, P12).
- r3-coordination-a11y-CA3-1 (coordination-a11y, major): fixed. I9's fallback runs both ways from P11 and covers every never-lease kind (6.9, I9, CP-0, PF item 4, P11, open question 2); H7 checks it.
- r3-coordination-a11y-CA3-2 (coordination-a11y, major): fixed. I5 asks for the far-star case, with a fallback (`inkKeep` 0 after V, with the user's OK, before P8); CP-0, 8.5, 8.6, AC-30 and section 11 follow.
- r3-coordination-a11y-CA3-3 (coordination-a11y, minor): fixed. P9's `forgetVisitSky` goes where new rects take effect, wherever their deferral moves that (6.9, 8.6).
- r3-coordination-a11y-CA3-4 (coordination-a11y, minor): fixed. The comet takes the far band's nearness; its box, grown by the drift and lean reach, stays below `METEOR.top` and above About's row by breakpoint (6.12); CP-0 states its scroll rule.
- r3-coordination-a11y-CA3-5 (coordination-a11y, minor): fixed. CP-4 offers D10's three answers, weekly; D10 and 7.0 state the early merge's cost; CP-1 records last-write times; P0 runs CP-5; CP-0 asks for a resend; section 1 and 7.2 reworded.
- r3-coordination-a11y-CA3-6 (coordination-a11y, minor): fixed. The 7.0 gate names P9 to P12; P8 depends on P5.
- r3-completeness-C28 (completeness, major): fixed with CG3-1.
- r3-completeness-C29 (completeness, minor): fixed with CG3-3.
- r3-completeness-C30 (completeness, minor): fixed with CG3-4.
- r3-completeness-C31 (completeness, minor): fixed with CG3-2.
- r3-completeness-C32 (completeness, minor): fixed. Checklists and 9.2 agree (re-checked by script); H5's rest rule in P2; H10 in P11; the ADAPT fade as P6 step 4; `speed` read 1.2 s after input (7.1).
- r3-completeness-C33 (completeness, minor): fixed. Today's bar is today's planner on the same captured layouts; 0.576 is labeled synthetic (6.9, H9, AC-38).
- r3-completeness-C34 (completeness, minor): fixed. `failedPlans[kind] = 0` on launch; I1 in P8 step 1; PF's I7 is the fade only; CP-4 weekly.
- r3-completeness-C35 (completeness, minor): fixed in part. Round 2's log is a table; P2 cites AC-39. The glide figure stays in pass criteria, the config doc and the visitor's scene; the rest is the DRY audit's.
