# R4: Ambient motion design for the home sky, and lessons from the old implementation

Research agent R4. Planning only, 2026-10-25. Repository: `/home/user/Portfolio` (branch `claude/quirky-carson-btv2u4`).

**Scope.** This report covers design and history only. R1 owns the physics formulas, R2 owns meteors and other bodies (physics and timing), R3 owns rendering engineering, and the meteor veil belongs to the concurrent session ("Stars and comment animation redesign"). Where this report gives numbers in their areas, treat them as design budgets that their models should land inside. They are not competing models.

**Evidence labels**
- **[Measured]**: I rebuilt the old sky from git and measured it in headless Chromium 153.0.8010.12 (Playwright 1.63, software compositing, 1440 × 900, DPR 1). The reproduction is scratch material outside the repository, in `/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/r4/`: `page/old-sky.html`, `scripts/probe1.js`, `scripts/probe2.js`, `scripts/ts.py`, `scripts/count.py`, and the screenshots in `out/`.
- **[Source]**: a cited primary or official source. Text in quotation marks is verbatim.
- **[Judgment]**: my design call. A reviewer should challenge these first.

**Source access note.** This sandbox's proxy blocked w3.org, MDN, web.dev, vercel.com and most journal sites. I read the W3C Understanding documents, MDN pages and Vercel's guidelines from their official source repositories on GitHub (`w3c/wcag`, `mdn/content`, `vercel-labs/web-interface-guidelines`), and Apple's pages from developer.apple.com's documentation JSON. Journal findings come from abstracts, citation records and citing papers, and each is marked as secondary where that applies.

## TL;DR

- **The old sky did move, but every motion cue was wrong.** The smallest, dimmest dots moved fastest, which inverts parallax. All layers slid up for 50 s and then reversed in the same frame: a 100 s ping-pong driven by a React timer. About a third of the stars were saturated 2–3 px squares, and moving dots shimmered ±50 % at 9 Hz. The shooting star fired on a fixed schedule, entered from a corner at full brightness, flew 8–11° off the axis of its own tail on desktop screens, and forced a layout on every frame.
- **The new drift should give less motion and more depth.** The faint 71 % of stars (the far layer) stays almost still and acts as the frame of reference. Only the bright near stars float, at about 3–6 px/s, and adjacent layers differ in speed by at least 1.6×. One depth factor per layer drives scroll parallax, ambient drift and optional pointer parallax ("one depth, three cameras"), which keeps the model DRY.
- **No discontinuities or screensaver motion.** That means no reversals, no oscillation (above all none in 0.05–0.5 Hz), no loops, no wrap-around, no zoom or warp, and no rotation of the whole sky. Motion runs at constant velocity with a slowly wandering heading, eases only at its boundaries, and offsets are integrated over time (never computed as v × t).
- **Continuous drift brings WCAG 2.2.2 Pause, Stop, Hide (Level A) into play.** Today's meteors, each under 5 s, did not. The site therefore needs one in-page control that pauses all sky motion (technique G186). Under reduced motion the sky stays still, as it does today.
- **Transients must read as real.**
  - Shooting stars ignite and burn out in the sky, never at a screen edge. They come from varied radiants but never rise.
  - A cluster is 2–4 meteors from one radiant.
  - Satellites are steady sunlit points that take 40 s or more to cross the screen.
  - A comet, if one is added, is static, with a mint coma (C2) and a pale tail.
  - Mint stays reserved for things that are green in nature: meteor wakes (O I 557.7 nm) and comet comae.
- §3 is a 34-item acceptance checklist, each item with a pass/fail threshold and a way to check it. Fourteen of the items can be checked by watching the page for 60 s.

---

## 1. Old implementation: how it moved and why it felt bad

### 1.1 Where it lived

- **Vite era.** The sky was `src/css/Background.css` (1,166 lines, 61.9 kB) plus `src/components/Background.tsx`; the last version is `git show 7c176fb^:src/css/Background.css`. The Next.js migration (`7c176fb`) copied the same rules into `src/app/globals.css` (`d116918^`, lines 691–1855, with the tokens renamed `--color-red-stars`, `--color-yellow-stars` and `--color-blue-stars`). `d116918` replaced all of it with the worker canvas.
- **History.** The motion model never changed (`94e891a` → `2cea411` → `c3fc372` → `5008945`); later commits only added the wide-screen layers `#stars4–6`. The author's own note in `2cea411` (`md/latestTasks.md`) says: "I left off styling the stars that don't appear when the screen is wider than 2000px."

### 1.2 Technique (old code, trimmed)

Each layer was one tiny element whose `box-shadow` list held hundreds of offsets, one star per shadow, inside a 2000 × 2000 px field. Its pseudo-element held a copy. Motion came from CSS keyframes on `transform`, 50 s `linear`, `forwards`, and not `infinite`. A React interval flipped a `gravity` class every 50 s, which swapped every layer onto reverse keyframes.

```css
#stars  { position: fixed; box-shadow: 1744px 122px var(--red-stars), /* …699 more */; animation: animStarFast 50s linear forwards; }
#stars2 { position: fixed; width: 2px; height: 2px; box-shadow: /* 200 */; animation: animStarNorm 50s linear forwards; }
#stars3 { position: fixed; width: 3px; height: 3px; box-shadow: /* 100 */; animation: animStarSlow 50s linear forwards; }
#galaxy-bg.gravity #stars { animation: animStarGravityFast 50s linear forwards; }
@keyframes animStarFast { 0% { transform: translateY(0px); } 100% { transform: translateY(-50vh); } }   /* Norm: -25vh, Slow: -15vh */
@keyframes animStarGravityFast { 0% { transform: translateY(-50vh); } 100% { transform: translateY(0); } }
```

```tsx
const [gravity, setGravity] = useState(false)
useEffect(() => {
	const interval = setInterval(() => {
		setGravity((prev) => !prev)
	}, 50000)
	return () => clearInterval(interval)
}, [])
// …renders #stars, #stars2, #stars3 and one shooting star: className={gravity ? 'shooting-stars south' : 'shooting-stars north'}
```

The shooting star was a 5 px wide gradient bar with a glowing head. Its height and position were animated:

```css
#galaxy-bg div.shooting-stars { opacity: 0; width: 5px; height: 85px; position: fixed; bottom: 0; right: 0;
	background: linear-gradient(to top, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)); }
#galaxy-bg div.shooting-stars.north { animation: animShootingStar 2s linear forwards; }
#galaxy-bg div.shooting-stars.south { animation: animShootingStarGravity 2s 15s linear forwards; }
@media screen and (min-width: 1024px) {
	#galaxy-bg div.shooting-stars.north { animation-duration: 3.25s; }
	@keyframes animShootingStar {
		from { transform: translateY(0px) translateX(0px) rotate(-50deg); opacity: 1; height: 10px; }
		to { transform: translateY(-150vh) translateX(-150vw) rotate(-50deg); opacity: 1; height: 250px; }
	}
}
```

### 1.3 How it moved [Measured]

| Layer (old name) | Element as rendered | Stars in field / visible at 1440 × 900 | Dot | Speed at 900 px tall | In viewport units |
|---|---|---|---|---|---|
| 1 "Fast" | `#stars` is **0 × 0**; its `::after` is 1 × 1 | 568 / ≈ 201 | 1 px | **8.98 px/s** | 1 vh/s |
| 2 "Norm" | `#stars2` 2 × 2 (copy at `top: 2000px`) | 200 / ≈ 61 | 2 × 2 px square | **4.49 px/s** | 0.5 vh/s |
| 3 "Slow" | `#stars3` 3 × 3 (its copy is 0 × 0) | 100 / ≈ 31 | 3 × 3 px square | **2.69 px/s** | 0.3 vh/s |

- **Directions.** All three layers moved vertically and in the same direction: up for 50 s, then down for 50 s. All of them reversed in the same frame, with no easing (`linear`). The loop length was 100 s, and every star returned exactly to its earlier position each period.
- **The seam at a reversal.** Position stayed continuous, because the gravity keyframes start where the forward keyframes end, but velocity jumped. About 300 dots stopped and reversed at once. The class flip came from a JavaScript timer while the motion ran on the CSS animation clock, so with `fill-mode: forwards` any lateness of the timer showed up as a dead stop at the end of a sweep. The timer could be late because of main-thread work or because of inactive-tab throttling (MDN: Chrome checks timers once per second in hidden tabs, and once per minute after 5 minutes hidden) [Source 12].
- **Shooting stars.** A single element was reused for every shooting star:
  - Schedule: `north` launched at t = 0, and `south` launched 15 s after each class flip. That gives launches at t = 0, 65, 100, 165, 200, 265 s…, on two fixed paths, with gaps alternating between 65 s and 35 s.
  - The first one launched the moment the content mounted. In the Vite app `<Background />` rendered only after the 3 s loader. In the Next.js-era page it rendered after the loader exit plus 0.25 s, so the meteor fired together with the hero entrance.

### 1.4 Why it felt bad (diagnosis)

1. **Inverted depth [Measured].** The smallest, dimmest dots moved fastest (9 px/s) and the biggest, brightest squares moved slowest (2.7 px/s). Motion parallax says nearer things move faster (R1: angular speed ∝ 1/distance); relative size says bigger things are nearer. The two cues contradicted each other, so the field read as flat sheets sliding over one another, not as space.
2. **One sheet on the scroll axis [Measured, Source].** Every layer moved vertically, with the same sign and the same 50 s schedule. Coherent whole-field motion along the scroll axis reads as the page creeping by itself. A moving surround also makes a stationary target appear to move the opposite way (induced motion: Duncker 1929, "the moon racing the clouds") [17], so the copy could appear to sink. The field moving is the one perceived as background, and the background is what drives vection [15].
3. **Ping-pong reversals [Measured, Source].** Every 50 s, about 300 dots stopped and reversed in one frame. The onset of motion captures attention, while ongoing motion does not (Abrams & Christ 2003) [19], so each turnaround pulled the eye off the copy. The exact 100 s period also made the sky predictable and canned.
4. **Speeds tied to viewport height [Measured].** Speeds were in vh, so the same design ran at 8.4 px/s on a phone and 14.4 px/s on a monitor 1440 px tall. On a laptop the fast layer moved about 12 arcmin/s (at roughly 1.3 arcmin per CSS px; §2.3). That is about the commonly cited threshold for seeing motion with no stationary reference (unverified textbook value, see [26]), so peripheral vision noticed it while the visitor was reading.
5. **Pixel-art stars [Measured].**
   - About 31 % of the visible stars were hard 2 × 2 or 3 × 3 squares, not point-spread blobs.
   - Many stars used saturated hues: `#1f51ff` (HSV saturation 0.88, 3.1:1 on navy) and `#900603` (0.98, 1.9:1). Starlight is never that saturated; compare the pale blackbody tints in `src/lib/sky/config.ts` `STAR_TINTS`.
   - Pure `#fff` at full alpha reached 17.6:1 on navy and outshone the name heading (`#ccd6f6`, 12.2:1). The brightness hierarchy was inverted: the sky competed with the copy.
6. **Shimmer [Measured].**
   - Over 40 frames in 3.9 s, each tracked 1 px star's brightest pixel swung between 683 and 339 (the sum of |RGB − navy|; 683 is pure white) while the sum over the star stayed at 677–683.
   - At whole-pixel offsets the star was one full pixel; at half-pixel offsets it became two half-bright pixels. In linear light the split star emits about 51 % of the light, because of sRGB gamma.
   - The star's brightness therefore flickered at the rate it crossed pixels: 9 Hz for layer 1, 4.5 Hz and 2.7 Hz for the squares.
   - DPR 2 softens the effect, because a dot two device pixels wide keeps its peak, so DPR-1 monitors were the worst case. GPU compositors also filter at fractional offsets (the familiar blurry text under `translate`), but I did not measure on real hardware.
7. **Dead weight and gaps [Measured].**
   - `#stars` has no size (0 × 0, with its `::after` positioned `fixed`), so its own 700 shadows never painted (0 lit pixels). Only the 568 shadows in its `::after` painted.
   - `#stars3:after` is 0 × 0 as well.
   - After the migration dropped `#stars4–6`, screens wider than 2000 CSS px had an empty band at the right: every field offset is at x ≤ 2000, and the author knew about it.
   - On viewports taller than about 1330 px, layer 1 has no copy below its field, so an empty band rose from the bottom edge near the end of each upward sweep.
8. **The shooting star [Measured, Source].**
   - Fixed schedule, two canned paths, and the first launch competed with the hero entrance.
   - The `north` path **rose** (up and to the left), which reads as a firework. Meteors move away from their radiant, so rising ones are uncommon.
   - It was at **full opacity from its first frame**, inside the viewport at the bottom-right corner (or the right edge for `south`), so it popped in. It flew off-screen at full brightness: there was no ignition and no burn-out.
   - It traveled 150–162 vw by 150 vh, which is **590–1,350 px/s** depending on the screen, against 240–460 px/s in today's config. It was a full-screen streak.
   - Its tail was rotated by a fixed angle per breakpoint while the travel was in vw/vh, so the head and the direction of travel disagreed: +8.0° at 1280 × 800 and 1440 × 900, and +10.6° at 1920 × 1080 and 2560 × 1440 (≤ 3.5° on phones). The meteor "crabbed" sideways.
   - It animated `height` (10 → 250 px), which costs a style recalculation plus a layout every frame: **196 layouts in 3.5 s** measured, against 0 without the meteor. MDN: properties that change geometry trigger layout and repaint, while `transform` and `opacity` on their own layer only need compositing [11].
   - It passed behind the hero copy at full brightness.
9. **Accessibility [Source].**
   - The star field and the meteor had no reduced-motion rule.
   - The Next.js-era page wrapped everything in `<MotionConfig reducedMotion="never">`.
   - There was no pause control. Continuous motion longer than 5 s, shown alongside content, fails WCAG 2.2.2 (Level A) [1].
10. **What worked, and what the user misses.** The page was alive without any input. The drift was a compositor-driven `transform` animation with no per-frame main-thread work (0 layouts measured) [11]. Speeds were a few px/s, which is calm rather than frantic.

### 1.5 Old versus new targets at a glance

| Dimension | Old (measured) | New target (§2–4) |
|---|---|---|
| Depth order | Inverted (small dots fastest) | Far slowest; ratio ≥ 1.6 between adjacent layers; brighter means nearer means faster |
| Who moves | Every star, at 3–9 px/s | The far 71 % at ≤ 1.5 px/s; the near 5 % at 3–6 px/s |
| Direction | Vertical, all together, reversing every 50 s | One parallax-consistent heading that wanders slowly and never reverses; off the scroll axis |
| Loop | 100 s exact ping-pong | Never repeats (infinite seeded plane, integrated drift) |
| Shape and color | 1–3 px squares, saturated red and blue | Gaussian point-spread sprites, pale blackbody tints (keep today's) |
| Brightness | `#fff` at 17.6:1 outshone the h1 | Ceiling 0.78 (≈ 12.2:1, level with the h1); keep today's |
| Sub-pixel | ±50 % shimmer at 9 Hz | ≤ 5 % flux ripple, no pixel stepping |
| Shooting star | Fixed schedule, corner pop-in, rising path, 1,000 px/s, layout every frame | Ignites and burns out in clear sky, varied radiants, never rising, worker canvas |
| Reduced motion, pause | None (`reducedMotion="never"`) | Still sky under reduced motion; one pause control |

---

## 2. Modern ambient-motion principles (sourced)

### 2.1 What official guidance requires

| Source | What it says | What it means for the sky |
|---|---|---|
| **WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A)** [1] | "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless … essential." Understanding: "'Moving, blinking and scrolling' refers to content in which the visible content conveys a sense of motion. Common examples include … animations …". The criterion applies to "all content on the web page" (non-interference), and the Understanding document suggests "a single mechanism … that affects all these elements at the same time." | **Continuous drift, and slow satellites, bring 2.2.2 into play.** Today's sky arguably stays outside it: twinkle changes only brightness, and each shooting star lasts under 5 s. Sufficient techniques: G186 (a control in the page, "either at the top of the page or adjacent to the moving content") and G4 (pause, then resume from where it paused) [2]. |
| **WCAG 2.2 SC 2.3.3 Animation from Interactions (AAA)**, C39 [3] | "Another animation that is often non-essential is parallax scrolling. Parallax scrolling occurs when backgrounds move at a different rate to foregrounds." "Motion animation" "does not include changes – such as changes of color or opacity –". C39 (`prefers-reduced-motion`) is a sufficient technique. | Scroll parallax and pointer parallax must switch off under reduced motion (scroll parallax already does). Twinkle and fades are not motion animation; drift is. |
| **WCAG 2.3.1 flash thresholds** [4] | At most 3 flashes per second, or a combined flash area of at most 25 % of any 10° field (about 341 × 256 px at 1024 × 768). | Meteors and flares are far smaller than the area limit. Never strobe: no blinking satellite glints. |
| **Apple HIG, Motion** [5] | "Add motion purposefully, supporting the experience without overshadowing it. Don't add motion for the sake of adding motion. Gratuitous or excessive animation can distract people and may make them feel disconnected or physically uncomfortable." "Make motion optional." For visionOS: "People can be particularly sensitive to motion that occurs in their peripheral vision … it can make people feel like they or their surroundings are moving." "Consider giving people a stationary frame of reference." "In general, avoid letting people rotate a virtual world … even when they control the rotation and the movement is subtle." "Avoid showing objects that oscillate in a sustained way … around 0.2 Hz … keep the amplitude low." "Consider using fades when you need to relocate an object." For games: a "consistent frame rate of 30 to 60 fps". | Keep the faint majority still as the frame of reference. Don't rotate the whole sky. No sway near 0.2 Hz. Things fade in rather than pop. Motion is optional (pause and reduced motion). The visionOS lines are platform-specific, but their perceptual reasons apply to a background that fills the viewport. |
| **Apple HIG, Accessibility** [6] | When Reduce Motion is on, respond "by reducing automatic and repetitive animations, including zooming, scaling, and peripheral motion"; "Avoiding animating depth changes in z-axis layers"; "Replacing transitions in x-, y-, and z-axes with fades". | Reduced motion keeps today's still sky with fades only. |
| **SwiftUI `accessibilityReduceMotion`** [7] | "UI should avoid large animations, especially those that simulate the third dimension." | The "almost 3D" effect is exactly what people with reduced motion have opted out of. |
| **Apple Support, Reduce Motion** [8] | Turns off "the parallax effect of wallpaper, apps, and alerts" (from a search snippet; page not fetched). | Industry precedent: parallax wallpaper switches off under this preference. |
| **MDN `prefers-reduced-motion`** [10] | "Animations such as scaling or panning large objects can be vestibular motion triggers." | Panning the whole sky is panning a large object: keep it slow and small, and off under reduce. |
| **MDN, animation performance** [11] | Geometry properties trigger "style recalculation, layout, repaint"; `transform` and `opacity` on their own layer are handled in composition. | Never animate layout, as the old meteor's `height` did. The worker canvas avoids this; R3 covers the rest. |
| **Vercel Web Interface Guidelines** [13] | "Honor `prefers-reduced-motion`." "Necessity check. Only animate when it clarifies cause & effect or when it adds deliberate delight." "Interruptible." "Automatically playing motion lasting >5 seconds alongside other content has pause, stop, or hide controls." | This reaches the same conclusion as WCAG. Delight is a legitimate reason for motion, but it comes with a pause control. |
| **Material (MDC Android, Motion.md)** [14] | Spring tokens: `motionSpringSlowSpatial` "damping: 0.9, stiffness: 300 … for full screen animations"; effects springs use damping 1. | For pointer parallax, use a critically damped spring (damping 1) that is slower than UI springs: the sky should feel heavy. |

### 2.2 What vision science says

| Finding | Source | What it means for the sky |
|---|---|---|
| Motion parallax alone gives "vivid and unambiguous" depth, whether the observer moves or the surface translates | Rogers & Graham 1979 [18] | Depth from differences in speed is the right lever. Keep the mapping from speed to depth consistent everywhere. |
| Vection is determined by the display perceived as distant (the background) | Ohmi, Howard & Landolt 1987 [15] (via citing reviews) | A star field is the background, so its farthest layer must stay nearly still. |
| Stationary objects seen *beyond* a moving display suppress vection; ones in front of it do not | Howard & Howard 1994 [16] (via citing reviews) | A nearly still far layer actively calms the scene. Physics and comfort agree here. |
| Induced motion: a moving surround makes a stationary target appear to move the opposite way | Duncker 1929 [17] | Avoid coherent whole-field drift behind the h1. Move the minority (near stars) and keep the majority still. |
| The onset of motion captures attention; motion already under way does not | Abrams & Christ 2003 [19] | Never start, stop or reverse abruptly. Transients are onsets by nature, so they need an attention budget. |
| Looming objects capture attention (receding ones did not, in that study) | Franconeri & Simons 2003 [20] | No warp or zoom starfields. |
| Visually induced motion sickness peaks for oscillating optic flow at 0.2–0.4 Hz (an earlier hypothesis put it near 0.06 Hz) | Diels & Howarth 2013 [21]; Duh et al. 2004 [22] | No sway or bob between about 0.05 and 0.5 Hz. Any wander should have periods of minutes. |
| Speed discrimination is about 7 % of the speed (Weber fraction) and gets markedly worse at slow speeds | McKee 1981 [23] (via a citing paper) | At our very slow speeds use adjacent-layer ratios of at least 1.6, not 1.1–1.3. |
| Motion thresholds of about 1–2 arcmin/s with a stationary reference and 10–20 arcmin/s without one | Commonly attributed to Aubert 1886 [26]; **not verified here** | Loose anchor only: far layer ≲ 2 arcmin/s, near layer 4–8 arcmin/s, cap about 10 arcmin/s. |

### 2.3 Premium versus 2000s screensaver: do's and don'ts with numbers

**The screensaver tells.** These are the things that read as cheap:
1. Radial warp or looming (Windows 3.1 "Starfield Simulation", After Dark's "Warp" [27]).
2. One uniform sheet scrolling in one direction.
3. A visible loop, ping-pong or wrap-around seam.
4. Saturated rainbow dots, square pixels, uniform sizes.
5. Stars spawning or popping at the edges.
6. Shooting stars on a timer, on the same path, flying edge to edge at constant brightness, too fast and too often.
7. Twinkle as on/off blinking in step.
8. Speed-line streaks on stars.
9. Mouse-follow parallax with a big amplitude and either instant or bouncy tracking.
10. Everything moving at once with equal emphasis.

**The premium tells.** The base state is stillness: the faint majority stays put and a few bright near stars carry the motion, so the eye reads depth rather than movement. Relationships stay physically coherent (nearer means brighter means faster). Change is slow and never repeats or stops abruptly. Rendering is smooth below the pixel. The sky goes quiet near text and while reading. Events are rare and plausible. Preferences are respected, and the sky costs little battery.

**Design model: "one depth, three cameras" [Judgment, physics by R1].**
- Each star has one depth factor *k*; today's `LAYERS[layer].parallax` is far 0.02, mid 0.04, near 0.07, which is a far-to-near ratio of 3.5.
- On-screen offset = *k* × (scroll offset + integrated drift travel + pointer shift).
- This is a camera translating in front of a volume of stars, so every star moves in the same direction at any instant, at a speed proportional to *k*.
- It is DRY (one depth per star), consistent across scrolling, drift and pointer, and the motion parallax is physically valid.
- If R1 widens the depth range, all three cameras scale together. Jittering *k* per star by about ±20 % within its band, correlated with magnitude, avoids the "three cardboard sheets" look.
- The metaphor is stylized: real stars show no naked-eye parallax, and the real sky turns at 15°/h, about 0.075 px/s on screen. See Risks.

**Speed budget [Judgment].** The conversion is about 1.3 arcmin per CSS px: a 13.6-inch laptop at 1470 CSS px over 29 cm, viewed from 50 cm, is about 1.35 arcmin/px. A 24-inch 1080p monitor at 65 cm is about 1.46 arcmin/px, and a phone at 30 cm about 1.9 arcmin/px.

| Layer (share of stars) | Old speed (same-size dot) | Hero drift target | ≈ arcmin/s on a laptop | Example: *k* × V with V = 70 px/s |
|---|---|---|---|---|
| far (71.5 %, ≈ 213 stars at 1440 × 900) | 9.0 px/s (1 px dots) | 0.5–1.5 px/s | 0.7–2 | 1.4 px/s |
| mid (23.5 %, ≈ 70) | 4.5 px/s | 1.5–3 px/s | 2–4 | 2.8 px/s |
| near (5.1 %, ≈ 15) | 2.7 px/s | 3–6 px/s | 4–8 | 4.9 px/s |
| ceiling for any ambient star | n/a | 8 px/s | ≈ 10 | n/a |

**Do**
- **Heading [Judgment].**
  - Keep the drift off the scroll axis, so it is never mistaken for scrolling. The default is horizontal, toward the right (westward, as the real sky moves for a northern-hemisphere viewer facing south). R1 may justify another direction.
  - The tilt stays within ±15° of horizontal.
  - The heading wanders by at most 15°/min, as a sum of two incommensurate terms each below 0.004 Hz (periods of 4 minutes or more). That keeps "directions vary" true over minutes, keeps the sky from repeating, and stays two decades below the sickness band.
  - The drift never reverses.
  - It should differ visibly from the dominant meteor directions, so the two never look like one flow.
- **Constant velocity, easing only at the boundaries.**
  - Uniform motion is what inertial motion looks like.
  - Ease in with the dusk emergence (0 → 1 over about 2.5 s, `smoothstep` from `scene.ts`), so the drift is steady before the hero entrance ends. Never start it later.
  - Ease out over 3–4 s when idle, and over at most 0.6–1 s when the visitor pauses or turns on reduced motion.
  - Offsets must be **integrated**: `drift += velocity × dt`. Never compute them as `speed × t`, because then any change of speed (a scene blend, the idle fade, a pause) rescales the accumulated offset and every star jumps.
- **Scene levels [Judgment; the owner decides].**
  - Hero 1×, end bookend 0.8×.
  - Reading at 0.35×, so the near layer moves at most about 2 px/s and the sky never looks dead behind long sections. The alternative is 0×, which matches today's "still while reading".
  - Blend continuously through `sceneAt`.
- **Rendering [design criteria; engineering by R3].**
  - Draw moving stars at sub-pixel positions, with no `Math.round` snap. Snap only while resting (paused or reduced motion).
  - Keep the integrated linear-light flux ripple of a moving star at or below 5 %. That needs band-limited sprites (a core σ around 0.8–1 device px for moving faint stars, or phase-correct sprites).
  - Keep the step per drawn frame at or below 0.25 device px, which means fps ≥ 4 × v × dpr. At v = 5 px/s that is 40 fps at DPR 2 and 20 fps at DPR 1, so draw drift on animation frames rather than on today's 15 fps twinkle timer.
- **Restraint near text.** The existing quiet rules apply to moving stars without changes: near stars keep 0 inside the padded copy rects, mid stars keep 0.6, and the fade runs over a 40 px feather (`QUIET`). A near star drifting at 5 px/s fades over about 8 s as it slides behind a line, which reads as the copy occluding the sky: a free depth cue that puts the copy on the nearest plane.
- **Pointer parallax (optional) [Judgment].**
  - Virtual shift P = 100 px at the viewport edge, giving far 2 px, mid 4 px and near 7 px (the same *k*). That sits inside the commonly used 5–20 px range for the nearest layer.
  - A critically damped spring with ω = 4 rad/s settles to 5 % in about 1.2 s; the root of (1 + ωt)e^(−ωt) = 0.05 is ωt ≈ 4.74. Let the sky ease back to center over about 1.5 s when the pointer leaves.
  - Only under `(hover: hover) and (pointer: fine)`. Never under reduced motion or while paused. Never from `DeviceOrientation`, which needs a permission prompt on iOS and is the vestibular-heavy case Apple's Reduce Motion turns off [8].
- **Scroll "physics" (if R1 adds inertia).** Make it critically damped (ζ = 1), with no overshoot or bounce and a lag of at most about 150 ms. A heavy sky feels expensive; a springy sky feels like a toy.
- **Pause control (WCAG 2.2.2) [Judgment on placement].**
  - One `<button aria-pressed>` labelled "Pause sky animation" / "Play sky animation". It stops drift, twinkle, satellites and new meteors; an in-flight meteor, under 2.5 s, may finish.
  - Resume from the paused positions (G4).
  - Persist the choice per viewer, with `localStorage` reads wrapped in try/catch.
  - Default to paused when `prefers-reduced-motion` is set.
  - Place it in the navbar ("at the top of the page", G186) and in the mobile menu. The footer is the fallback.

**Don't**
- **Don't** invert depth, move everything in lockstep, or let any two adjacent layers share a speed (ratio below 1.6).
- **Don't** reverse, ping-pong, loop, or wrap a finite field. The seeded infinite plane in `catalog.ts`/`renderSky.ts` makes wrapping unnecessary.
- **Don't** zoom, warp, or radiate stars from a vanishing point (looming, [20]), and don't rotate the whole sky [5].
- **Don't** oscillate with any amplitude above about 0.3 px in 0.05–0.5 Hz [5][21][22].
- **Don't** streak stars, snap moving stars to pixels, or let motion pulse their brightness.
- **Don't** use saturated colors or square dots, and don't let any ambient star pass the 0.78 alpha ceiling.
- **Don't** let anything appear or vanish within the viewport in one frame [5].
- **Don't** animate layout properties, or put per-frame sky work on the main thread [11][13].

### 2.4 Design-budget sketch (TypeScript, codebase style)

These names are proposals. R1 and R3 own the actual model; the values below are the limits that a visual review signs off against.

```ts
/**
 * Ambient drift, design budget: on-screen speed of each layer's stars while the hero shows and nothing scrolls (CSS
 * px/s). About 1.3 arcmin per CSS px on a laptop at arm's length, so the far layer (71% of the stars) stays near the
 * threshold of seeing motion and serves as the still frame of reference, while near stars float at 4-8 arcmin/s.
 * Adjacent layers differ by at least `minRatio`. The heading turns at most `turnPerMinute` degrees and never reverses;
 * the drift eases in over the dusk and out over `easeOut` s, and its offset is integrated, never speed × time.
 */
export const DRIFT_BUDGET = {
	far: [0.5, 1.5],
	mid: [1.5, 3],
	near: [3, 6],
	max: 8,
	minRatio: 1.6,
	turnPerMinute: 15,
	easeIn: 2.5,
	easeOut: [3, 4],
	/** Share of the hero rate per scene; 0 while reading keeps today's still reading sky. */
	scene: { hero: 1, reading: 0.35, end: 0.8 },
} as const

/**
 * Pointer parallax (fine pointers, full motion only): a virtual shift of `shift` px at the viewport edge times each
 * layer's depth factor (far 2, mid 4, near 7 px), followed by a critically damped spring (no overshoot) of natural
 * frequency `omega` rad/s, so the sky settles about 1.2 s after the pointer stops.
 */
export const POINTER_PARALLAX = { shift: 100, omega: 4, damping: 1, recenter: 1.5 } as const

/**
 * Attention budget in the hero (s): nothing during the entrance, the first shooting star by `firstBy`, then a mean
 * gap with a floor; any two onsets at least `minOnsetGap` apart outside a cluster; clusters and satellites rarer still.
 */
export const ATTENTION = {
	quietAfterReveal: 3,
	firstBy: 6,
	meteorMeanGap: 15,
	meteorMinGap: 6,
	minOnsetGap: 3,
	clusterEvery: 180,
	satelliteFirst: 20,
	satelliteMeanGap: 90,
} as const
```

---

## 3. Acceptance checklist

### 3.1 Sixty-second watch protocol (★ items in §3.2)

1. **Setup.** Use a laptop with Chrome at its default scaling (about 1440 × 900, DPR 2). Repeat once on a DPR-1 external monitor, which is the worst case for stepping and shimmer, and once on an iPhone in Safari. Make sure no reduced-motion or contrast preference is set.
2. **First 60 s.** Load the home page and start a stopwatch when the copy appears (the reveal). Touch nothing for 60 s and note:
   - when the first shooting star appears, and how many appear;
   - their directions;
   - any star that pops, steps or shimmers (stare at one bright near star for 10 s at the right of the hero);
   - whether the headline seems to drift;
   - whether the faint stars look still while the bright ones float;
   - whether anything bobs or reverses.
3. **Reading.** Scroll to About and watch for 15 s.
4. **Pause.** Scroll back to the top. Press the pause control; then reload and confirm it stays paused.
5. **Preferences.** Turn on OS reduced motion while watching, and turn it off again.
6. **Hidden tab.** Switch tabs for 60 s and come back.

### 3.2 Checklist

Methods:
- **W**: watch.
- **S**: scripted screenshot analysis (Playwright).
- **T**: trace (Chrome performance trace or CDP metrics).
- **L**: debug event log from the worker (§3.3).
- **C**: code review or unit test.

Numbers are [Judgment] unless a source is cited.

| ID | Check | Pass when | How |
|---|---|---|---|
| **Depth and drift** | | | |
| AC-1 ★ | Depth order | Median on-screen speed: far < mid < near, with each adjacent ratio ≥ 1.6, over a 10 s window with no input | S: track blobs, group by brightness tercile; L: layer offsets |
| AC-2 ★ | Still frame of reference | Far-layer median ≤ 1.5 px/s; near ≤ 6 px/s; no ambient star > 8 px/s | S |
| AC-3 | Parallax-consistent | At any instant, all tracked drift headings lie within ±5° of one another (pointer parallax excluded) | S |
| AC-4 | Directions vary slowly | Heading turns ≤ 15°/min, and spans ≥ 20° over 5 min | L (5-minute run) |
| AC-5 ★ | No starts, stops or reversals | Per-star speed changes ≤ 10 % per second; no stop or reversal during 60 s with no input | S (10 Hz tracking) |
| AC-6 | No oscillation | After detrending, tracked positions show no spectral peak > 0.3 px in 0.05–0.5 Hz [5][21] | S (FFT over 60 s); C (no `sin` sway terms in that band) |
| AC-7 | Never repeats | After the first minute, the drift offset never comes within 50 px of an earlier offset over 10 min | L, C |
| AC-8 ★ | No edge pops | Every star that appears inside the viewport is first lit while touching an edge (sliding in) or through a fade; no blob appears or disappears in one frame | S (30 fps capture, frame diff) |
| AC-9 | Integrated offsets | Where the drift rate changes (into the reading scene, idle fade, pause, reduced-motion switch, resize), the largest per-frame displacement ≤ normal per-frame displacement + 0.25 px | S at each transition |
| **Rendering quality** | | | |
| AC-10 ★ | No pixel stepping | A tracked near star's centroid advances ≤ 0.25 device px per drawn frame, with no stall-then-jump staircase (linear fit r² ≥ 0.999 over 2 s) | S (capture at display rate), W on a DPR-1 monitor |
| AC-11 ★ | No shimmer | A moving star's integrated linear-light flux varies ≤ 5 % peak to peak, and its peak pixel ≤ 20 % (old: −50 % at 9 Hz) | S |
| AC-12 | No streaks | A drifting star's sprite extent along its motion ≤ its extent across + 1 device px | S |
| AC-13 | Frame pacing | During drift, ≥ 95 % of frame intervals within ±25 % of target; worker frame JS ≤ 4 ms p95 (`ADAPT.slowFrameMs`); no main-thread task > 50 ms attributable to the sky | T, L |
| AC-14 | Energy | On a mid laptop the renderer process stays at ≤ 10 % of one core while drifting; after the idle timeout the worker draws 0 frames | T, Chrome Task Manager |
| **Calm and hierarchy** | | | |
| AC-15 ★ | Calm while reading | In the reading scene (≥ 1.3 viewport heights scrolled), drift ≤ 0.35× the hero rate (or 0) and twinkle is 0; no star > 2 px/s | S |
| AC-16 | Restraint near copy | Existing quiet rules hold for moving stars; a star crossing a quiet edge changes alpha by ≤ 0.05 per frame (it fades, never pops) | S, L |
| AC-17 ★ | Headline stays put | 3 of 3 reviewers watching the h1 for 20 s report no apparent motion of the copy (the induced-motion check, [17]). Optional 5-second test: ≥ 4 of 5 people recall the name and tagline, and ≤ 1 of 5 mention the background first | W |
| AC-18 | Attention budget | No transient onset in the first 3 s after the reveal; ≥ 3 s between any two onsets outside a cluster; ≤ 1 onset per 6 s on average in the hero | L |
| AC-19 ★ | A first shooting star | In ≥ 18 of 20 fresh desktop loads, the first one appears 3–7 s after the reveal | L, S |
| **Transients** | | | |
| AC-20 ★ | Frequency | In 60 s of hero dwell, a median of 4 shooting stars (3–6 in ≥ 8 of 10 runs); never more than 2 heads at once outside a cluster; gaps stretch after 3 minutes as today | L |
| AC-21 ★ | Varied but believable directions | Over 10 meteors: ≥ 3 radiants and headings spanning ≥ 60°; none rises more than 10° above horizontal; meteors that share a radiant converge backward (within 10 % of the viewport diagonal) | L |
| AC-22 ★ | Ignite and burn out on screen | Head light < 15 % of its peak at the first and last on-screen points; never enters or leaves an edge bright; peaks in clear sky (veil) | L, C (assert in planning) |
| AC-23 | Tail on its path | Wake axis within 1° of the direction of travel (old: up to 10.6°) | C, S |
| AC-24 | Satellites (if built) | Speed varies < 2 %; crossing the full width takes ≥ 40 s; no tail; no blinking; ≤ 1 at a time; enters from beyond an edge or fades over ≥ 2 s | S, L |
| AC-25 | Comet (if built) | Static except for far-layer parallax; fades in over ≥ 8 s; no part of the tail inside padded quiet rects; ≤ 1 per visit | S |
| **Accessibility and preferences** | | | |
| AC-26 ★ | Reduced motion is still | With `prefers-reduced-motion: reduce`, two screenshots 30 s apart after the dusk are identical; no meteors, satellites, drift, or scroll or pointer parallax | S (Playwright `reducedMotion: 'reduce'`) |
| AC-27 | Live preference switch | Turning reduced motion on freezes stars where they are (≤ 1 px from their last position) within ≤ 1 s; turning it off resumes without a jump; no meteor for ≥ 3 s (`holdMeteors`) | S |
| AC-28 ★ | Pause control (2.2.2) | A visible, labelled, keyboard-operable control stops drift, twinkle and transients within ≤ 1 s; still paused after a reload; resumes from the paused positions | W, S (follow the G186 and F16 test procedures [2]) |
| AC-29 | Forced colors and contrast | `forced-colors: active` hides the sky; `prefers-contrast: more` drops the haze and dims the stars, with drift allowed (all existing) | S |
| AC-30 | Contrast budget unchanged | Body text keeps ≥ 4.5:1 over the brightest moving star (drift changes positions, not alpha) | C |
| AC-31 | Flash safety | No transient produces more than 3 luminance flashes in any second; a flare is a single event [4] | C |
| **Lifecycle** | | | |
| AC-32 | Hidden tab | After 60 s hidden, the sky reappears where it was (no leap by v × time hidden) and resumes smoothly; no meteor for ≥ 3 s | S |
| AC-33 | Idle | After the idle timeout (no scroll, pointer or key input), drift eases to 0 over ≥ 3 s, then the worker sleeps; any input eases it back over ≥ 2 s | T, S |
| AC-34 | Resize and zoom | No star jumps beyond what the new layout requires; drift continues | S |

### 3.3 How to automate the checks

- **A debug hook (proposal for R3).** In development only, or behind an `init` flag, the worker posts per-frame `{ time, drift: { x, y }, heading, js }` and per-transient `{ kind, heading, start, end, peak, startedAt }` messages. The main thread collects them in `window.__skyDebug`. With these, AC-1/4/7/13/18–22 become exact assertions instead of pixel forensics.

  ```ts
  /** Sky worker to main thread, development only: what the sky just did, for the R4 acceptance checks. */
  export type SkyDebugMessage =
  	| { type: 'debug-frame'; time: number; drift: { x: number; y: number }; heading: number; js: number }
  	| { type: 'debug-transient'; time: number; kind: 'meteor' | 'cluster' | 'satellite' | 'comet'; heading: number; start: Point; end: Point; peak: number }
  ```

- **Pixel tracking (black box).** This is the method I used on the old sky (`scripts/ts.py`):
  1. Capture full-viewport PNGs at 10–30 Hz.
  2. Threshold against navy and label the blobs.
  3. Match each blob to its nearest neighbor in the next frame; ambient stars move under 1 px per frame, so this is trivial.
  4. Per blob, compute the centroid, the peak, and the integrated linear-light flux (sRGB → linear, minus navy).
  5. Group the blobs by brightness tercile to stand in for depth.

  The OffscreenCanvas output appears in normal page screenshots. Playwright is preinstalled in this sandbox (`/opt/node-tools`), so the repository needs no new dependency.
- **AC-26 sketch** (an ad-hoc script outside the repository):

  ```ts
  import { chromium } from 'playwright'
  import { PNG } from 'pngjs'

  /** AC-26: under reduced motion the sky is still once the dusk is over. */
  async function reducedMotionIsStill(url: string): Promise<boolean> {
  	const browser = await chromium.launch()
  	const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  	await page.goto(url)
  	// Loader (3 s), its exit and the dusk (about 2.3 s)
  	await page.waitForTimeout(8000)
  	const before = PNG.sync.read(await page.screenshot())
  	await page.waitForTimeout(30_000)
  	const after = PNG.sync.read(await page.screenshot())
  	await browser.close()
  	return before.data.equals(after.data)
  }
  ```

- **Layout and frame costs.** Use CDP `Performance.getMetrics`, comparing `LayoutCount` and `RecalcStyleCount` deltas; that is how I measured the old meteor's 196 layouts. Add a Chromium trace for frame intervals. The repository's own rule still applies: use `npm run lint` and `npm run type-check`. While `next dev` runs, use its MCP endpoint instead of `next build`.

---

## 4. Visual direction for transients

The theme: navy `--color-navy` `#0a192f`, mint `--color-green` `#64ffda`, `--color-white` `#e6f1ff`, and the haze hues `--color-card-2` `#3c67e3` and `--color-card-3` `#4e00c2`. R2 owns the physics, rates and paths. These are the looks, behaviors and limits.

### 4.1 Rules shared by every transient [Judgment]

- **Same optics.** Every head or point uses the atlas's Gaussian point-spread sprites (`skyAssets.ts`), so everything in the sky is seen through one "lens". A transient drawn in a different style from the stars reads as an overlay.
- **Brightness hierarchy.** Nothing passes the star ceiling (alpha 0.78, level with the h1) except a fireball, which may reach 1 for up to about 1.5 s (as today).
- **Color.**
  - White and the pale `STAR_TINTS` for everything.
  - Mint, always mixed 45–60 % toward `--color-white`, only for things that are green in nature: meteor wakes and trains, from the forbidden O I 557.7 nm line ("short-duration trains are formed by only one spectral line, the forbidden green … line of neutral atomic oxygen at 557.7 nm", Matlovič & Tóth 2020 [24]); and comet comae, from C2 Swan bands, a green that never reaches the tail (Borsovszky et al. 2021 [25]).
  - The card hues stay in the haze. Nothing that moves is saturated.
  - The brand accent then means something: it shows up where physics puts green.
- **Light in, light out.** Every transient starts and ends through light: ignition and burn-out, or a fade. Only steady objects (satellites) may enter from beyond an edge, and they slide in. Nothing pops (AC-8, AC-22).
- **One focal event at a time.** Clusters are the exception. Nothing in the first 3 s after the reveal (AC-18).
- **Screen space.** Transients are drawn in screen space and do not take part in the ambient drift; their own motion dominates. Whether they also take the near layer's scroll parallax is R2/R3's call, but it must be the same answer for all kinds.
- **Veil, reduced motion, pause.** Everything passes the veil (§4.7). Everything stops under reduced motion and when the visitor pauses.
- **Phones are calmer.** Fewer and shorter transients, no clusters, no comet. Today's 2-per-visit limit for narrow screens can rise to about 6, with a mean gap of about 25 s.

### 4.2 Shooting stars: more often and from more directions

- **Rate.** The mean gap in the hero drops from about 42 s today (30 s + Exp(12 s)) to 12–18 s, with a floor of 6 s and a cap of about 40 s. The first should appear 3–6 s after the reveal, after the side rails settle (about 2.3 s) and the quiet rects have been measured. Keep today's stretch after 3 minutes (×1.5), so a long visit never turns into a screensaver. That is roughly 3× today's rate and still far above the real naked-eye rate inside a screen-sized field of view, which is an artistic compression R2 should state openly.
- **Directions.**
  - Draw radiants from around the top and both sides, beyond the frame.
  - Travel 10–70° below horizontal, both leftward and rightward, with occasional near-horizontal paths (within ±10°). Paths close to vertical (more than 70°) are rare, because they read as rain.
  - **Never rising more than about 10°**: a rising meteor reads as a firework, and that was the old `north` path.
  - Coherence: for about 40 % of meteors, keep a visit-long "shower" radiant, so some paths visibly share a vanishing point. The rest are sporadic. This is the same idea as the code's sticky radiant, which the other session is unsticking.
- **Look.** Keep today's `METEOR_LOOK`, `METEOR_LIGHT` and `TRAIN`: a white head, a wake that cools to mint, warm fireballs (Na), rare trains, the light curve, drag, and the tail on its path. Paths stay at or below 36 % of the long side (`pathShare`), so there is never a full-screen streak.
- **Speed and length follow geometry (R2).** Meteors near their radiant are short and slow; meteors 90° away are long and fast. Variety in length then comes from physics, not dice.

### 4.3 Clusters (the "meteor burst")

- **Shape.**
  - 2–4 meteors from one radiant within 3 s or less, staggered by 0.25–1.2 s.
  - Their backward extensions meet at the radiant.
  - One is normal brightness (peak ≤ 0.9); the others are faint (0.4–0.7).
  - No fireballs, flares or trains inside a cluster.
  - At least 40 px between concurrent heads, since two heads close together look like a glitch.
  - Each meteor in a cluster lasts under 5 s, and so does the whole cluster.
- **Rate.** At most one per 3 minutes of hero time, never in the first 20 s, desktop only. It is a reward for lingering, not part of the baseline.

### 4.4 Satellites (and the occasional ISS)

- **Look.**
  - A single steady point like a mid star (alpha 0.35–0.6), sunlit warm white (`STAR_TINTS` index 4, mixed toward `--color-white`).
  - No halo, no wake, never blinking. At most the subtle mid-layer twinkle, or none.
  - Steadiness is how people tell a satellite from an airplane, whose strobes blink.
- **Motion.** Constant velocity in a straight line (a great circle is close to straight across one screen). It crosses the full width in 45–120 s (≤ 36 px/s at 1440 px wide; R2 gives the real angular rates). Any direction except vertical, and not parallel to the drift.
- **Entering and leaving.** It slides in from beyond an edge already lit, or fades in or out mid-sky over 2.5–6 s, as satellites do when they enter or leave Earth's shadow. That fade is a quietly delightful real detail. It never pops.
- **Rate.** The first comes no earlier than about 20 s into the hero; after that, a mean gap of about 90 s. At most one at a time, and never together with a cluster.
- **Near copy.** It is dimmed with the mid layer's keeps (0.6 at the padded edge, 0 on the ink). Prefer paths that cross little of the hero copy (see §4.7).
- **ISS variant.** About 1 in 6 satellites. Brighter (0.78), slower (60–150 s across), and sometimes fading into shadow mid-screen.
- **Not built.** No Starlink "trains": they only happen around launch and read as a bug or a UFO.

### 4.5 A rare comet (optional "easter egg")

- **Behavior.** Real comets don't visibly move over minutes, so on this page a comet is **static**. It moves only with the far layer's parallax, so it reads as part of the deep sky, never as a projectile. It appears in perhaps 1 in 8 visits, only in the hero and only in clear sky (on desktop, the upper right where the haze pools are). It fades in over 8–12 s and then stays. Phones never get one.
- **Look.**
  - A tiny bright pseudo-nucleus (a mag-2 star sprite, alpha ≤ 0.6).
  - A soft coma (Gaussian σ 3–6 px, alpha ≤ 0.14), mint mixed about 60 % toward white (C2).
  - A broad, gently curved **dust tail** 90–200 px long, pale warm white (`STAR_TINTS` index 5, alpha ≤ 0.08, falling to 0).
  - A narrower, straighter, fainter **ion tail** (index 2, blue-white, alpha ≤ 0.035) at a slightly different angle.
  - Both tails point away from a notional sun below the horizon. **The tail is never green** [25].
- **Fit.** The whole bounding box, tails included, lies outside the padded quiet rects at the current layout, and the comet hides if a resize breaks that fit.
- **Naming.** In the plan and the code, keep "comet" (this object) separate from "shooting star / meteor" (what the user called "the comet").

### 4.6 Considered and rejected [Judgment]

- **Warp or looming starfield.** It is the screensaver archetype [27] and the motion most likely to capture attention [20].
- **Rotating the whole sky at the diurnal rate.** At the true rate (about 0.075 px/s) it is invisible; exaggerated, it is the rotating world Apple warns against [5].
- **Aurora or animated nebula glow.** A large moving area of light behind the copy costs contrast and is a vestibular trigger ("panning large objects", [10]). Vercel's northern-lights example [13] is an isolated hero visual, not something behind body text.
- **Airplanes, satellite glints, blinking anything.** Blinking (WCAG 2.2.2 and 2.3.1 territory), and airplanes are not space.
- **Moving planets.** Planets don't visibly move. A static, steady bright "planet" in the near layer is possible but low value.

### 4.7 Veil interactions to hand to the concurrent session

1. **More meteors means more planning.** Every launch still runs `planFlight` and the veil checks. With 6–18 s gaps, the retry path (5–9 s) and `maxFailedPlans` could set the effective rate on short or narrow layouts. The rate targets assume the veil fixes land.
2. **Clusters make meteors concurrent.** The contrast budget is per meteor: about 0.053 of white on the copy, which keeps slate text at 4.5:1. Two meteors burning out behind the same line could double that. Rule: concurrent meteors may not burn out behind the same quiet rect, or each gets half the budget.
3. **New directions.** On desktop the hero copy is left-aligned. Rightward paths that start near the left edge will mostly fail the "ignite and peak in clear sky" rule. Bias their radiants so paths begin in the clear right half, and don't spend attempts on doomed paths.
4. **Satellites don't burn out.** The veil's "only burn out behind copy" rule doesn't fit them. They need their own rule: mid-layer keeps, plus a cap on the share of the path inside quiet zones (≤ 15 %), or paths planned clear of the hero ink.
5. **The comet is static.** It needs a one-time fit test against the quiet rects and a re-test when the layout changes.
6. **Drift.** Stars now cross quiet edges all the time. `easedQuietFactor` already evaluates every drawn point, so no rule changes are needed, but the other session's quiet easing must not reintroduce one-frame pops while stars move (AC-16).
7. **Scrolling mid-flight.** This stays the other session's call; whatever it decides should apply to every transient kind the same way.

### 4.8 Look sketch (TypeScript)

```ts
/**
 * A satellite: a steady sunlit point (no wake, never blinking) crossing the screen in `crossing` s; it may fade in or
 * out mid-sky over `shadowFade` s, entering or leaving Earth's shadow. One in `issEvery` is the brighter, slower ISS.
 */
export const SATELLITE_LOOK = { alpha: [0.35, 0.6], tint: 4, crossing: [45, 120], shadowFade: [2.5, 6], issEvery: 6, issAlpha: 0.78, issCrossing: [60, 150] } as const

/** A meteor cluster: `count` meteors from one radiant within `span` s, staggered by `stagger` s, one normal and the rest faint. */
export const CLUSTER = { count: [2, 4], span: 3, stagger: [0.25, 1.2], peak: [0.75, 0.9], faintPeak: [0.4, 0.7], minHeadGap: 40 } as const

/**
 * A comet: static and rare. A mint coma (C2 Swan bands) around a small bright core, a curved pale dust tail and a
 * fainter, straighter blue-white ion tail; never a green tail. Fades in over `fadeIn` s in clear sky only.
 */
export const COMET_LOOK = {
	chance: 0.12,
	fadeIn: 10,
	coreAlpha: 0.6,
	comaSigma: [3, 6],
	comaAlpha: 0.14,
	comaMintToWhite: 0.6,
	dustTail: { length: [90, 200], alpha: 0.08, tint: 5, curve: 0.15 },
	ionTail: { length: [120, 260], alpha: 0.035, tint: 2, offsetDegrees: 12 },
} as const
```

---

## 5. Sources

Official and standards. W3C pages were read from the `w3c/wcag` source repository; the published URLs are given.
1. W3C, WCAG 2.2 SC 2.2.2 Pause, Stop, Hide, SC text and Understanding: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide (source files `guidelines/sc/20/pause-stop-hide.html` and `understanding/20/pause-stop-hide.html` in https://github.com/w3c/wcag; techniques listed in `understanding/understanding.11tydata.js`).
2. W3C techniques G186 (https://www.w3.org/WAI/WCAG22/Techniques/general/G186), G4, and failure F16 (https://www.w3.org/WAI/WCAG22/Techniques/failures/F16); glossary "mechanism" (https://www.w3.org/TR/WCAG22/#dfn-mechanism).
3. W3C, WCAG 2.2 SC 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions; technique C39: https://www.w3.org/WAI/WCAG22/Techniques/css/C39; glossary "motion animation": https://www.w3.org/TR/WCAG22/#dfn-motion-animation.
4. W3C, general flash and red flash thresholds: https://www.w3.org/TR/WCAG22/#dfn-general-flash-and-red-flash-thresholds.
5. Apple Human Interface Guidelines, Motion: https://developer.apple.com/design/human-interface-guidelines/motion.
6. Apple Human Interface Guidelines, Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility.
7. Apple, SwiftUI `accessibilityReduceMotion`: https://developer.apple.com/documentation/swiftui/environmentvalues/accessibilityreducemotion (also UIKit `UIInterpolatingMotionEffect`, the API behind tilt parallax: https://developer.apple.com/documentation/uikit/uiinterpolatingmotioneffect).
8. Apple Support, "Reduce screen motion on your iPhone, iPad, or iPod touch": https://support.apple.com/en-us/111781 (seen through a search snippet only).
9. (Repository) `src/lib/sky/config.ts`, `scene.ts`, `catalog.ts`, `meteors.ts`, `src/components/sky/renderSky.ts`, `sky.worker.ts`, `mountSky.ts`, `src/components/Introduction.tsx`, `SidePane.tsx`, `ContactMe.tsx`, `AppFooter.tsx`, `src/app/globals.css`; history in `7c176fb^`, `d116918^`, `2cea411`.
10. MDN, `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (source `mdn/content`).
11. MDN, Animation performance and frame rate: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate; and CSS and JavaScript animation performance (off-main-thread animation of `transform`).
12. MDN, `setTimeout`, "Timeouts in inactive tabs": https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#timeouts_in_inactive_tabs.
13. Vercel, Web Interface Guidelines, Animations: https://vercel.com/design/guidelines (source https://github.com/vercel-labs/web-interface-guidelines, README.md).
14. Material Components for Android, Motion theming (M3 easing, duration and spring tokens): https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md.

Vision science, astronomy and history:
15. Ohmi, M., Howard, I. P. & Landolt, J. P. (1987). Circular vection as a function of foreground-background relationships. *Perception* 16, 17–22 (via citing reviews).
16. Howard, I. P. & Howard, A. (1994). Vection: the contributions of absolute and relative visual motion. *Perception* 23, 745–751 (via citing reviews).
17. Duncker, K. (1929). Über induzierte Bewegung. *Psychologische Forschung* 12, 180–259 (via secondary sources).
18. Rogers, B. J. & Graham, M. E. (1979). Motion parallax as an independent cue for depth perception. *Perception* 8, 125–134 (content via citing papers).
19. Abrams, R. A. & Christ, S. E. (2003). Motion onset captures attention. *Psychological Science* 14(5), 427–432. https://pubmed.ncbi.nlm.nih.gov/12930472/.
20. Franconeri, S. L. & Simons, D. J. (2003). Moving and looming stimuli capture attention. *Perception & Psychophysics* 65(7), 999–1010. https://visualcognition.psych.northwestern.edu/publications/FranconeriSimons_Motion.pdf.
21. Diels, C. & Howarth, P. A. (2013). Frequency characteristics of visually induced motion sickness. *Human Factors* 55(3), 595–604 (abstract via the Loughborough repository).
22. Duh, H. B.-L., Parker, D. E., Philips, J. O. & Furness, T. A. (2004). *Human Factors* 46(1), 142–153 (the 0.06 Hz hypothesis, via Chen et al. 2016).
23. McKee, S. P. (1981). A local mechanism for differential velocity detection. *Vision Research* 21, 491–500 (the 7 % figure via a citing paper).
24. Matlovič, P. & Tóth, J. (2020). Meteors: light from comets and asteroids. arXiv:2007.04041 (O I 557.7 nm short trains).
25. Borsovszky, J. et al. (2021). Photodissociation of dicarbon. *PNAS* 118, e2113315118 (C2 makes comae green and is destroyed before it reaches the tail; via Physics Today and Chemistry World).
26. Aubert, H. (1886). Die Bewegungsempfindung. *Pflügers Archiv* 39, 347–370. The motion-threshold figures commonly attributed to it (via Graham 1965) were **not verified** here.
27. Windows 3.1 "Starfield Simulation" and After Dark "Warp" (TechRepublic and PCWorld retrospectives), cited only as the archetype of the screensaver look.

Not cited: blog posts from Stripe, Linear and GitHub (the globe article) could not be fetched from this sandbox. I left them out rather than citing from memory.

---

## Key recommendations

- **Fix the root causes the old sky showed.** Depth must agree with size and brightness: far stars slow, near stars fast, adjacent layers ≥ 1.6× apart. Never reverse, loop, wrap or move all layers in lockstep. Ignite and burn out meteors in the sky. Keep everything off the main thread.
- **Less motion, more depth.**
  - The far 71 % of stars drifts at ≤ 1.5 px/s and serves as the still frame of reference (Apple HIG; Howard & Howard).
  - Near stars float at 3–6 px/s; nothing ambient exceeds 8 px/s.
  - The heading is lateral and turns ≤ 15°/min.
  - Adopt "one depth, three cameras": one per-star depth factor drives scroll, drift and pointer parallax.
- **Smoothness is the premium.** Constant velocity, easing only at boundaries, offsets integrated (never v × t), sub-pixel rendering with ≤ 5 % flux ripple, and ≤ 0.25 device px per frame. In practice that means animation-frame pacing while drifting (R3).
- **Add one pause control** (navbar plus mobile menu; G186, resume where paused, persisted). It is required by WCAG 2.2.2 as soon as continuous drift ships, and Vercel's guidelines say the same. Keep reduced motion as a still sky.
- **Make the idle rule count pointer and keyboard activity as input**, so a visitor reading the hero doesn't see the sky stop at 90 s. Keep the eased idle sleep for battery.
- **Shooting stars:** mean gap 12–18 s (about 3× today), the first at 3–6 s, a 6 s floor, varied radiants with about 40 % sharing a visit-long shower radiant, never rising. Keep today's look, which is physically grounded.
- **New kinds, in order of value:** clusters (rare, desktop), satellites (steady, slow, fading into Earth's shadow), and optionally a static comet with a mint coma and a pale, never-green tail. Reject warp, sky rotation, aurora and anything that blinks.
- **Mint means green in nature.** Use it only for meteor wakes and trains (O I 557.7 nm) and comet comae (C2); everything else is white or pale stellar tints.
- **Hand §4.7 to the concurrent session.** Clusters need a shared contrast budget; satellites and comets need their own quiet rules; new directions need radiant biasing.
- **Ship with §3.** Add the debug hook, run the scripted checks with the preinstalled Playwright, and run the 60-second watch on a DPR-2 laptop, a DPR-1 monitor and an iPhone.

## Risks and open questions

- **WCAG 2.2.2 is a product decision.** Without an in-page pause control, continuous drift fails Level A. Honoring `prefers-reduced-motion` is a sufficient technique for 2.3.3 but is not listed for 2.2.2. The owner must accept a small navbar control, or keep the sky without continuous drift.
- **Motion while reading.** Recommendation: 0.35× the hero rate. The owner may prefer today's still reading sky (0×), or motion everywhere. The user's request ("SOME movement … even when the screen is not being scrolled") suggests something above 0.
- **The metaphor tension.** The sky is Earth-bound (meteors, satellites, twinkle that grows toward the horizon), but the depth comes from a "camera drifting through space". Real stars show no visible parallax. The drift must stay subtle enough to read as depth, not as a spaceship. R1 should state the stylization plainly.
- **Battery and CPU.** Continuous drift replaces today's 15 fps twinkle timer and sleeping with continuous frames. R3 must budget for low-end phones and keep the adaptive step-down. AC-14's ≤ 10 % of a core is a guess to be measured.
- **Shimmer is not yet solved.** Faint sprites at σ ≈ 0.7 device px (`MIN_CORE_SIGMA_DEVICE_PX`) will ripple when they move. Wider cores or phase-correct sprites change today's reviewed look of resting stars, so review both states.
- **The numbers need tuning on real devices.** Check DPR 1, 2 and 3; 60 Hz and 120 Hz; and dim moving dots on VA panels, which smear on dark transitions. My shimmer measurement used software compositing, so its size on GPU hardware is unverified.
- **Threshold anchors are partly unverified.** The motion-threshold figures (Aubert 1886, via Graham 1965) and the Ohmi, Howard & Duncker details are secondary. The speed budget is judgment informed by them, not derived from them.
- **The attention cost of 3× more meteors.** Each one is a motion onset [19]. If the 5-second test (AC-17) shows the background winning, raise the mean gap before cutting anything else.
- **Dependence on the concurrent session.** Its veil and radiant changes may cut the share of valid plans for new directions, satellites and clusters. Our rate targets assume its fixes land; recheck AC-19 to AC-22 after merging.
- **Pointer parallax is optional and adds main-thread-to-worker messages** (coalesced per animation frame). Decide whether the desktop depth it adds is worth the code. Fine pointers only.
- **The comet could be read as a rendering bug.** A fuzzy blob that appears in 1 of 8 visits might look like a glitch; decide whether to include it at all.
- **The idle timeout and its input sources** (scroll only today) need a decision: count pointer and keys? Keep 90 s?
- **Satellite paths near copy.** A slow object passing behind text for 40 s or more is the longest-lived moving thing near copy. Prefer paths in clear sky, and accept fewer satellites on layouts dense with copy.
