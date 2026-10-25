# R2: Meteors and other space bodies: realism, frequency and accessibility

Research agent R2, 2026-10-25. Planning only: no repository file was changed. Scope: what flies across the home sky, how often and from where, the physics that makes it read as real, which other bodies to add, and the WCAG answer. Drift and parallax (R1), rendering and scheduling engineering (R3) and motion design (R4) are covered elsewhere.

**Legend.** **[F]** is a fact with a source (IDs such as [S5] point to the list at the end). **[C]** is my calculation from sourced inputs; the scripts are in `/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/r2calc/` (`calc.py`, `directions.py`, `crossing.py`, `verify.py`). **[J]** is my judgment or a design recommendation.

**How sources were read.** This sandbox could reach only GitHub. So the WCAG Understanding documents, success criteria, definitions and techniques were read in full from their source repository (w3c/wcag), MDN pages from mdn/content, and the WCAG GitHub issue threads from their pages. Astronomy pages (IMO, AMS, NASA, ESA, Sky & Telescope, arXiv) were read only through web-search extracts. The numbers below are quoted as those extracts state them, with URLs. Items marked "verify" should be spot-checked against the full page before they go into code comments.

**Hard constraints from the meteor-veil session** (`.claude/plans/sky-ambient-motion/COORDINATION.md`, reply at 07:09 UTC), which this report plans against [S50]:

1. Only one transient may light up near `data-sky-quiet` copy at a time. Additive compositing leaves about 0.082 of white as headroom for slate body text at 4.5:1. That drops to about 0.064 under the hero haze and about 0.026 with a far star on the same pixel.
2. Every kind that can pass over quiet copy goes through the same veil checks, the same veil and ink budget, and the new scroll-cancel rule: the flight is dropped or faded once scrollY moves about 16–24 px from launch. The 0.4-viewport gate controls launches only.
3. Any direction is safe for contrast once it goes through the veil checks, but crossing rates were measured for today's top-right geometry.
4. WCAG 2.2.2 is applied per animation, and each transient stays under 5 s. A slow satellite or comet that lasts longer needs its own 2.2.2 answer.
5. `veiledFrom`, `METEOR_VEIL`, the quiet ease and the scroll handler belong to that session. This plan uses their interfaces and doesn't redesign them.

---

## 1. In plain words: meteor, comet, satellite

What you call "the comet" is a **meteor**, a shooting star. These are three different things:

- **A meteor** is a speck of dust, usually smaller than a grain of sand, left behind by a comet or asteroid. It hits the air about 80–120 km up at 11–72 km/s and burns out in well under a second [S14][S9]. *Analogy: a spark flicked off a grinding wheel. It is tiny and close, it moves fast, and then it is gone.*
- **A comet** is a mountain-sized lump of ice and dust millions of kilometres away. Sunlight boils gas off it into a glowing head (the coma) and pushes out two tails that point away from the Sun [S34]. Because it is so far away, it hangs in the same spot for days or weeks and drifts only a little from night to night [S35]. *Analogy: the lights of a distant ship on the horizon. It is huge, but it hardly seems to move.*
- **A satellite** is a machine 400–1,000 km up, lit by a Sun that has already set for you. It is a steady point that glides across the sky in a few minutes without blinking and without turning [S28]. It can fade out in mid-sky as it slides into Earth's shadow [S29]. *Analogy: an airplane at night with its blinking lights switched off.*

They are related. A meteor shower happens when Earth drives through the dust trail a comet left behind. It is like driving through falling snow at night: the flakes seem to stream out of one point ahead of the car. For meteors, that point is called the **radiant**.

---

## 2. What the code does today, within this scope

- **Directions** (`pickRadiant`, `planFlight`, `updateMeteor`). There is one radiant at x = 1.5–2.2 viewport widths beyond the right edge and y = 0.15–0.45 viewport heights above the top, with ±4° of jitter per meteor. A hard filter keeps only paths with `dirX < 0` that run 18–42° below horizontal, and the radiant is kept for as long as it yields paths. The result is that every shooting star runs right-to-left and downward at a moderate slope, the paths are almost parallel because the radiant is far away, and nothing is ever foreshortened.
- **Rate.** The first meteor comes 4.5–7 s after the reveal. Each later one waits a gap of `min(75, 30 + Exp(12))` after the previous flight, which averages **41.7 s [C]**. After 3 minutes the gap is stretched ×1.5 (62.6 s). That is about 1.4 meteors a minute, then about 0.9. Meteors appear only in the hero, one at a time, and at most 2 per visit on narrow screens.
- **Speed and size.** The nominal speed is 0.2 long sides per second, clamped to 240–460 px/s. Flights last 0.9–1.4 s (fireballs 1.8–2.5 s) and paths are 160–640 px long. In the 60° window model of §4.2, that is **12°/s and 7–27° of sky [C]**, which matches a real medium-speed meteor [S4].
- **Light curve** `sin(π·p^0.868)^1.2`. It peaks at **p = 0.450** of the flight time, so its F parameter (§5.3) is about 0.47 [C].
- **Drag** `travel(p) = (p − d·p³)/(1 − d)`. Speed falls to 1 − 3d of the entry speed (82% at d = 0.06).
- **Colors.** The head is white, the wake cools to mint (the theme green mixed 55% toward white), fireballs warm to pale yellow, and trains are mint.

**Verdict [J].** The tuning of a single meteor is already realistic. What is unrealistic is the population: there is one direction, one slope and one speed class, the radiant geometry has no perspective, and meteors are rare.

---

## 3. How often real meteors appear

### 3.1 Sporadic versus shower meteors

- **Sporadic background.** A rural site near 45°N sees about **1–3 sporadic meteors per hour in the evening and about 4–10 per hour before dawn**, according to the AMS weekly outlooks for 2026. At 25°S, mornings bring 6–10 per hour [F][S5]. NASA's Meteoroid Handbook gives observed sporadic rates of "only about 5 to 8 per hour" [F][S7]. Rates are higher before dawn than in the evening [F][S5]. Radar studies put the maximum near 6 a.m. and the minimum near 6 p.m. local time, because the morning side of Earth faces the apex, Earth's direction of motion [F][S51].
- **Major showers**, from the IMO 2026 calendar [F][S1]:

  | Shower | Peak 2026 | ZHR | V∞ (km/s) | r |
  |---|---|---|---|---|
  | Quadrantids | Jan 3 | 80 | 41 | 2.1 |
  | Eta Aquariids | May 6 | 50 | 66 | 2.4 |
  | Perseids | Aug 13 | 100 | 59 | 2.2 |
  | Orionids | Oct 21 | 20 | 66 | 2.5 |
  | Leonids | Nov 17 | 15 | 71 | 2.5 |
  | Geminids | Dec 14 | 150 | 35 | 2.6 |

- **ZHR**, per the IMO, is the rate one observer would see if the radiant were overhead and the sky showed stars to magnitude +6.5. Real rates are almost always lower [F][S1][S3].

### 3.2 What a viewer actually sees: limiting magnitude, radiant height, field of view

- **IMO formula** [F][S3]: ZHR = N · r^(6.5 − lm) · c_F / (T_eff · sin^γ h_R), with γ = 1.0 for visual work. Here r is the population index: each extra magnitude of sky darkness shows r times more meteors. Turned around, the observed hourly rate is **HR = ZHR · sin(h_R) / r^(6.5 − lm)**, divided by the cloud-cover factor c_F.
- **Example [C].** Perseids (ZHR 100, r = 2.2) with the radiant 60° high give HR ≈ 87/h at lm 6.5, 39/h at 5.5 (a rural edge), 18/h at 4.5 (a suburb) and 8/h at 3.5 (a city).
- **Field of view** [F][S2]. A visual observer's effective field is roughly circular with a radius of about 50°, and about 98% of the meteors seen fall inside it. That cap covers **2.24 sr [C]**. A 60° × 37.5° screen window (16:10) covers **0.65 sr, or 29%**, and a 16:9 window covers 26% [C].
- **So in real time a screen-sized patch of sky would show [C]:** about one meteor every 100 min of evening sporadics, one every 26 min of dawn sporadics, one every 3–4 min at a Perseid peak (about 60/h seen) and one every 2 min at a Geminid peak (about 100/h seen). That is far too sparse for a page view, which sets the compression factor in §8.1.

### 3.3 The sporadic sources: how varied real directions are

- There are **six sources** [F][S8][S10]: the **helion and antihelion** sources (on the ecliptic, about 60–70° from the apex), the **north and south apex** sources (around Earth's direction of motion) and the **north and south toroidal** sources (about 60° above and below the ecliptic, at the apex longitude). NASA's Meteoroid Environment Office calls them "four major sources in six radiants".
- **Speeds** [F][S10]: helion and antihelion about **30 km/s** and dominant; toroidal **35–40 km/s**; apex about **60 km/s** and fastest. Arecibo radar recovered five of the six (no clear South Apex), which is a reminder that the picture is well established but not fully settled [F][S10].
- **What this means for the screen [J].** Real sporadic directions are varied but not uniform. They come from a few broad regions, tens of degrees wide, whose places in the sky depend on the time of night. A screen is best modeled with 2–3 broad sporadic sources per visit, each with its own speed class, plus one narrow shower radiant.

---

## 4. Radiant geometry and perspective

### 4.1 Formulas

- **The radiant is a vanishing point** [F][S12]. A shower's meteoroids travel on parallel paths, so in perspective their trails, extended backward, meet at the radiant. A real radiant is a spot a few degrees wide, not a point. A meteor coming straight at the observer shows as a point, not a streak.
- **Angular speed** [F][S11]: **ω = V∞ · sin D / q** in rad/s, or (180/π)·V∞·sin(D)/q in °/s. D is the angular distance between the meteor and the radiant, V∞ is the entry speed in km/s and q is the observer-to-meteor range in km. When D → 0 the meteor appears to stand still.
- **Apparent length [C].** A trail L km long at range q spans **Λ ≈ L · sin D / q** for small angles. Exactly, the trail runs along the great circle through the radiant, from D_begin to D_end, so Λ = D_end − D_begin. So meteors near the radiant are short and slow, and those about 90° from it are long and fast. Beyond 90° they shorten again.
- **Range to the meteor layer [C].** For a layer at height h seen at elevation e, **q(e) = √((R+h)² − R²·cos²e) − R·sin e**, with R = 6371 km. With h = 100 km:

  | Elevation | 90° | 65° | 50° | 35° | 20° | 10° |
  |---|---|---|---|---|---|---|
  | q (km) | 100 | 110 | 130 | 172 | 277 | 477 |
  | speed and length factor h/q | 1.00 | 0.91 | 0.77 | 0.58 | 0.36 | 0.21 |
  | inverse-square dimming (mag) | 0 | 0.21 | 0.57 | 1.17 | 2.21 | 3.39 |

  On top of that comes atmospheric extinction. Meteors low in the sky look slower, shorter and fainter, which is a free depth cue.
- **Typical numbers [C].** A 40 km/s meteor whose trail drops 25 km in height at a 45° slope has a 35 km trail and lasts 0.88 s. At q = 150 km it moves 15.3°/s and spans 13.5° at D = 90°, 7.6°/s and 6.8° at D = 30°, and 2.7°/s and 2.3° at D = 10°. A 60 km/s meteor lasts 0.59 s and moves 22.9°/s at D = 90°. Both agree with the IMO's typical 3–25°/s [F][S4].

### 4.2 Model the screen as a window onto the sky (gnomonic projection)

[J] Treat the viewport as a pinhole camera looking at the sky.

- **Field of view.** The longer side spans **60°**: about 24 px per degree on a 1440 px laptop, 32 on a 1920 px desktop and 14 on an 844 px-tall phone [C].
- **Pitch.** The screen center looks **40°** above a horizon just below the screen, so a 16:10 window spans about 21–59° of elevation [C]. That matches the existing `TWINKLE_HORIZON_GAIN` idea that the bottom of the screen is "near the horizon".
- **Why a gnomonic projection.** It maps straight 3D paths to straight 2D lines, and parallel 3D paths meet at the projection of their direction. That gives the real convergence at the radiant for free [C][S12].
- **Vanishing point.** For a radiant unit vector r (screen x to the right, y down, z into the sky), the vanishing point is (cx + f·r_x/r_z, cy + f·r_y/r_z) when r_z > 0. When r_z ≤ 0 the radiant is behind the viewer, and paths run *toward* the projected antiradiant instead.
- **Direction and speed on screen [C].** At normalized point (u, v) = ((x − cx)/f, (y − cy)/f), a meteor moves along **(u·r_z − r_x, v·r_z − r_y)**, whatever its depth. Its exact screen speed is **f · V · |(u·r_z − r_x, v·r_z − r_y)| · √(u² + v² + 1) / q**. I checked this against finite differences and it matches exactly. The small-angle form f·V·sin D/q is within about 8% inside a 60° window (`verify.py`).
- **Consistency check [C].** Today's nominal speed of 0.2 long sides per second is exactly **12°/s** in this window on any screen size, and today's paths are 7–27°. Adopting the window keeps today's tuned feel and adds real geometry on top.

### 4.3 The direction mix the model produces

[C] I ran a simulation with 200,000 samples (`directions.py`). Radiant elevations were drawn with density ∝ sin h · cos h: hourly rates scale with sin h_R [S3], weighted by solid angle. Azimuths were uniform. Start points were uniform over the upper 60% of a 1440 × 900 window.

| Window center elevation | Falling (> 15° below horizontal) | Sideways (±15°) | Climbing | Leftward / rightward | Radiant on screen | Strongly foreshortened (sin D < 0.5) |
|---|---|---|---|---|---|---|
| 40° | **77%** | **13%** | **10%** | 50% / 50% | 13% | 17% |
| 55° | 66% | 16% | 19% | 50% / 50% | 17% | 21% |

Climbing meteors are real. A radiant below the patch you are looking at sends meteors upward on the sky. A 40° window keeps them to about 1 in 10, which reads as "stars falling" while staying honest. The median angular distance from the radiant is 58°, with quartiles at 37° and 80°.

### 4.4 Today's filter and what should replace it

- **Today.** The direction comes from `atan2(start − radiant)` plus ±4° of jitter, and anything with `dirX >= 0` or `below ∉ [18°, 42°]` is rejected. That hard-codes one quadrant (down and to the left) and makes the sky repeat one diagonal.
- **Replacement [J]:**
  1. Get (dirX, dirY, screen speed) from the window model (`radiantMotion` in §10) for a radiant drawn from the visit's sources (§4.5). **Drop the angle filter.**
  2. Keep the layout guards that protect the page: 110 px under the navbar, the 12 px edge margin, path ends above 0.72 of the height (clear of the side rails), the length bounds and all the veil checks.
  3. Add two soft guards. Climbing paths (dirY < −sin 15°) may come only from sporadic sources and may be at most 0.6 of the maximum length, because a long streak climbing into the navbar reads as a glitch. The minimum length drops to **40 px only within 10° of an on-screen radiant**; elsewhere it stays at today's 160 px (110 px on narrow screens).
  4. **Sources per visit:**
     - one **shower radiant**: 40% of launches, scatter σ = 1.5° (a few degrees wide [S12]), with one speed class for the visit;
     - **three sporadic sources**: 60% of launches, σ = 15°, one each slow (antihelion-like, about 30 km/s), medium (toroidal-like, 35–40 km/s) and fast (apex-like, about 60 km/s) [S10];
     - all radiants drawn with the same elevation law.

     The resulting mix is roughly 3/4 falling, 1/8 sideways and 1/10 climbing, split evenly between left and right.
  5. **Optional realism [J], could.** During an IMO shower window (activity periods in [S1], Table 5; *verify before use*), raise the shower share to 60% and take its speed class from V∞. This week, for example, the Orionids are active (66 km/s, so fast). The Geminids in December are slow (35 km/s). Store only the date windows and V∞, because ZHRs change from year to year.

### 4.5 A radiant on the screen

[J] On about **15% of visits**, place the shower radiant on screen, in clear sky in the top 45% of the screen and outside every quiet rect's feather. Its meteors then show the effect people recognize from real showers:

- streaks near the radiant are short, slow stubs;
- within about 1° of it, a meteor is a **point that brightens and fades without moving**, because it is coming straight at the viewer [S11][S12].

That one effect says "real perspective" more strongly than anything else on the list, and it costs nothing to draw.

### 4.6 How new directions change copy-crossing frequency (constraint 3)

[C] I simulated this on a synthetic 1440 × 900 hero (`crossing.py`), with ink rects estimated from `Introduction.tsx` and `SidePane.tsx`, padding 32 and feather 40. The veil was approximated as clear sky through p = 0.65 and no ink before p = 0.75.

| Geometry | Raw candidates accepted | Accepted flights that burn out behind copy |
|---|---|---|
| Today's (top-right radiant, right-to-left at 18–42°) | 18% | **36%** |
| Physical mix, today's spawn area | 37% | **16%** |
| Physical mix, spawn area across the width | 21% | 19% |

So each meteor is about half as likely to cross copy, because half of them now fly away from it. But at about 3.3× the launch rate (§8), a visitor would see **about 1.6–1.8× as many crossings per minute**.

[J] Add a **crossing cooldown of at least 40 s** between flights that burn out behind copy, and plan every other flight in clear sky meanwhile. That keeps crossings per minute at or below today's. These are synthetic layouts. The veil session's Node harness, run on captured layouts, should confirm the numbers, and its "prefer crossings" option should use this same knob.

---

## 5. The physics of individual meteors

### 5.1 Speeds, heights and durations

- **Speed range** [F][S9][S48]. Entry speeds run from about 11 to 72 km/s. The floor is Earth's escape speed (about 11 km/s). The ceiling is the solar escape speed at 1 au (about 42 km/s) plus Earth's orbital speed (about 30 km/s), reached by head-on retrograde particles. The IMO calls 11 km/s very slow, 40 km/s medium and 72 km/s very fast [F][S4].
- **Heights** [F][S15][S16]. Faster meteors begin higher. Most large Perseids burn up near 90 km, within a range of 76–104 km. Bright meteors loud enough to be heard by infrasound sensors begin at 72–124 km, end at 48–83 km and last 0.4–3.3 s.
- **Durations** [F][S14]. Meteor trails "usually last for less than a second". Fireballs can last 8–10 s (an ESA example).

### 5.2 Deceleration: is the cubic a reasonable shape?

- **The standard model** [F][S17] is the Whipple–Jacchia exponential, l(t) = v₀·t − |a₁|·e^(|a₂|·t). It is described as the only common empirical model with a physical motivation: deceleration is proportional to air density, and density rises roughly exponentially as the meteoroid descends. It is ill-conditioned to fit (Egal et al. 2017, cited in [S17]).
- **How the code's cubic compares [C].** The cubic gives a speed of 1 − 3·d·p² relative to entry, so its deceleration grows linearly with time. For the same end speed (82% at d = 0.06), it has already lost **4.5% by mid-flight**. A normalized exponential loses **2.1%** (k = 4) or 1.4% (k = 5). The real shape holds speed longer and brakes late.
- **Drop-in exponential [C]:**
  - v(p) = 1 − δ·(e^(k·p) − 1)/(e^k − 1)
  - s(p) = [p − δ·((e^(k·p) − 1)/k − p)/(e^k − 1)] / s(1)
  - k = Δh/H, where Δh is the height the trail spans (about 20–30 km) and H is the density scale height. H = R_air·T/g with the US Standard Atmosphere 1976 mesopause temperature of about 187 K at 86 km [S47] gives H ≈ 5.6 km (verify), so k ≈ 4–5.
- **Recommendation [J].** The cubic is acceptable for faint meteors: the difference is under 3% of speed mid-flight, below what the eye notices. Use the exponential only for fireballs (δ = 0.3–0.5), where hard late braking is visible and reads as "heavy". Fireballs are clear-sky-only, so the veil's sampling of veiled flights is untouched. Priority: could.

### 5.3 Light curves

- **The F parameter** [F][S18]: F = (h_begin − h_peak)/(h_begin − h_end). Below 0.5 the curve peaks early, at 0.5 it is symmetric, and above 0.5 it peaks late. **Classical single-body ablation gives F ≈ 0.7.**
- **What is observed** [F][S18][S19]. Many studies find **mainly symmetric curves** (Fleming et al. 1993; Koten et al. 2004; Subasinghe et al. 2016), explained by fragile "dustball" meteoroids fragmenting. For faint meteors, curve shape is not a reliable predictor of fragmentation, and very early-peaked curves suggest disruptive fragmentation.
- **Checks [C].** The classical curve I ∝ x(1 − x/3)², with x = ρ/ρ_peak at constant speed in isothermal air, gives **F = 0.655 at half maximum and 0.740 two magnitudes below peak**. The code's `sin(π·p^0.868)^1.2` peaks at 45% of the time, with **F ≈ 0.47** in time and about 0.47 along the path at d = 0.06.
- **Correction to the brief.** Fragile cometary meteoroids tend toward symmetric curves, not late-peaked ones. Late peaks are the signature of compact, non-fragmenting bodies, such as slow asteroidal fireballs.
- **Recommendation [J].**
  - Keep today's curve as the default. It is realistic for faint cometary meteors, and it is the curve the veil's "never brightens again" rule assumes (`veiledFrom` calls `meteorLight(progress, false)`).
  - Add variety only where the veil isn't involved. Clear-sky-only meteors may peak at p* = 0.5–0.6. Fireballs peak at 0.6–0.7 and add the terminal flare.
  - The peak sets the exponent: skew = ln 0.5 / ln p*. That gives 1.0 at p* = 0.5, 1.36 at 0.6 and 1.94 at 0.7; today's 0.868 corresponds to p* = 0.45.

### 5.4 Colors by emission line

- **What each element gives** [F][S20][S21]. NASA's Leonid page: sodium orange-yellow, iron yellow, magnesium blue-green, ionized calcium violet, and atmospheric nitrogen and oxygen red. The lines are Na I 589 nm, Mg I 517 nm, Ca II H and K 393/397 nm, Fe I 382/405 nm, O I 615 nm and N₂ 631 nm. The green **O I 557.7 nm** line comes from a state with a lifetime of about 0.7 s [S24], which is why it lingers in afterglows and trains [S23].
- **Two spectral components** [F][S22] (Borovička 1994):
  - a main component at about 4,000–5,000 K, from neutral Na, Mg and Fe;
  - a hot component at about 10,000 K (Mg II, Ca II, Si II, O, N), seen only above about 30 km/s and growing with speed. The ratio of main to hot gas falls from about 3,000 at 17 km/s to about 15 at 67 km/s.
- **Vivid colors need brightness** [F][S6]. Strong colors are reported mostly for fireballs, which are bright enough for color vision. Geminid fireballs are often brilliant green, as well as yellow and orange.
- **Screen palette [J]:**
  - Faint meteors are nearly white, and color strength grows with peak brightness.
  - **Fast** meteors: white head with a blue-green cast, wake cooling to mint (as today), mint train (557.7 nm).
  - **Slow** meteors: warm-white head, wake cooling to pale yellow or orange (palette 5 or 6).
  - **Medium** meteors: white.
  - Never use saturated red. For WCAG 2.3.1's red flash, keep R/(R+G+B) below 0.8; pale orange [255, 214, 170] is 0.40.

### 5.5 Fireballs, bolides, flares and fragmentation

- **Definitions** [F][S13][S6]. The IAU calls a meteor brighter than absolute magnitude −4 a fireball (or bolide), and one brighter than −17 a superbolide. The AMS describes a fireball as brighter than about −4, roughly Venus, and a **bolide** as a fireball that "explodes in a bright terminal flash at its end, often with visible fragmentation".
- **Rates** [F][S6]. Experienced observers see about one magnitude −4 fireball per 20 hours of observing and one −6 per 200 hours, and each brighter magnitude class has about a third as many. Several thousand fireball-class meteors happen in the atmosphere every day.
- **[C]** At 5–10 visible meteors an hour, that is about one fireball per 100–200 meteors (0.5–1%).
- **Screen [J]:**
  - 4% of launches, down from today's 8%. At 3.3× the launch rate that still means about 1.7× more fireballs per minute, roughly one every 5 minutes.
  - At least 120 s apart, and none in the first 20 s.
  - 1.8–3 s long, at a slow-to-medium 8–14°/s.
  - Late-peaked, with a terminal flare on half of them.
  - Optionally (could) 1–3 fragment sparks shed in the last 15%: tiny points at 0.85–0.95 of the head's speed, each fading in 0.15–0.3 s.
  - Colored by speed class; a train (2.4 s at most) only on fast ones.
  - Clear sky only, as today.

### 5.6 Persistent trains

- [F][S23] Short-duration trains glow in the forbidden O I 557.7 nm line and fade within the first minute. Persistent trains last minutes, and one in 2017 lasted over an hour. A New Mexico camera recorded about 850 trains among about 7,500 meteors (October 2021 to July 2023), and meteors passing near 90 km left them more often.
- [J] Keep `TRAIN` as it is, a short-duration train of at most 2.4 s, so flight plus train stays under 5 s. Keep it only behind fast meteors and fireballs, which is already the rule.

### 5.7 Earthgrazers

- [F][S25] When the radiant is near the horizon, meteors enter the atmosphere at a shallow angle. They last longer, leave long streaks and can flare for many seconds. They are most common when a shower's radiant is just rising or setting, and often appear just above the horizon. They are rare.
- [J] Screen spec:
  - at least 0.45 of the screen width, within 12° of horizontal;
  - slow, 4–6°/s, lasting 2.5–3.5 s;
  - peak 0.6–0.8, warm, with a long thin wake;
  - clear sky only, which in practice means wide screens with a clear horizontal band;
  - 2.5% of launches, at least 180 s apart, none in the first 60 s;
  - skipped silently when nothing fits.

### 5.8 Screen spec per speed class [J]

| Class | Real analog | Angular speed at D = 90°, window center | Duration | Length on a 1440 px laptop (D = 90°) | Wake | Train |
|---|---|---|---|---|---|---|
| Slow | helion/antihelion sporadics, Geminids, Taurids (25–35 km/s) | 9°/s | 1.1–1.4 s | ~245 px | warm | no |
| Medium | toroidal sporadics, Quadrantids (35–45 km/s) | 14°/s | 0.8–1.1 s | ~290 px | white | no |
| Fast | apex sporadics, Perseids, Orionids, Leonids (55–71 km/s) | 22°/s | 0.55–0.8 s | ~325 px | mint | yes (15–30%) |

The lengths use the window's center scale, focal × π/180 = 21.8 px/° at 1440 px. The average across the long side is 24 px/°.

- Every class is then multiplied by the window factors: the exact image-speed factor (§4.2) and the range factor q_center/q.
- Lengths are capped at today's 0.36 long sides (0.55 of the width on narrow screens).
- **Brightness:** 30% of ordinary meteors are faint (peak 0.3–0.5) and 70% normal (0.6–0.85). Real counts are dominated by faint meteors: with population index r, each brighter magnitude has 1/r as many [S1][S3]. Lower meteors are dimmed by (q_ref/q)², with a floor of 0.6.

---

## 6. Other bodies

### 6.1 Satellites

- **How they look** [F][S28]. NASA: the station "looks like an airplane or a very bright star moving across the sky, except it doesn't have flashing lights or change direction". It is seen only within a few hours of sunrise or sunset, and it shines by reflected sunlight. The ISS is similar to Venus in size and brightness, the third-brightest object in the sky.
- **Speeds [C].** A circular orbit has v = √(μ/(R+h)): 7.66 km/s at 420 km (period 92.8 min), 7.59 at 550 km (95.5 min) and 7.46 at 800 km (100.7 min). Angular speeds on an overhead pass:

  | Elevation | 90° | 60° | 45° | 30° | 20° | 10° |
  |---|---|---|---|---|---|---|
  | 420 km (ISS) | 1.05°/s | 0.81 | 0.57 | 0.33 | 0.20 | 0.11 |
  | 550 km (Starlink) | 0.79 | 0.62 | 0.44 | 0.26 | 0.17 | 0.10 |
  | 800 km | 0.53 | 0.42 | 0.31 | 0.20 | 0.13 | 0.09 |

  An overhead ISS pass takes **6.4 min above 10° of elevation and 4.2 min above 20°** [C], which matches NASA's per-pass listings (its example shows 4 min) [S28].
- **Why only at dusk and dawn [C].** The height of Earth's shadow above an observer's zenith grows from about 142 km when the Sun is 12° below the horizon, to about 328 km at 18° and about 603 km at 24°. So a low-orbit satellite overhead goes dark 1–2 hours after sunset.
- **The fade into shadow** [F][S29]. Sky & Telescope describes the ISS turning "from pale yellow to orange and finally red as it raced into darkness" and dimming to magnitude 8–9. [C] Crossing the penumbra (the Sun is 0.53° wide) takes about 8 s for a perpendicular crossing, and longer for an oblique one. So the fade lasts seconds, not a frame.
- **Brightness** [F][S30][S31]. Starlink's characteristic overhead magnitudes are about 4.7 (original design), 6.2 (VisorSat) and 5.5 (post-VisorSat). During orbit-raising the mean apparent magnitude is 2.68, against 6.46 at operational height. Trains of new satellites are visible from a day to a few days after launch, at about magnitude 2 at first.
- **Glints** [F][S32][S30]. Iridium flares reached about −8 (up to −9.5) and lasted seconds, up to about 20 s. The first-generation fleet was deorbited by 2019, and its successors don't flare. Starlink satellites can flare.
- **Twinkle** [F][S33]. Satellites are point sources and can scintillate, but an ESA space-debris paper finds scintillation matters less for objects moving at high angular speed, such as fast low-orbit satellites. NASA's way to recognize one is a steady light [S28]. **[J] Draw them with no twinkle.**
- **Screen spec [J], with no page pause control (constraint 4):**
  - a steady point: core σ 0.6 px, no halo, no wake;
  - alpha 0.25–0.5, about magnitude 2.5–5, never brighter than mid-layer stars;
  - a straight line at constant speed, **1.2–2.5°/s** (29–60 px/s at 24 px/°), time-compressed 2–3× from reality;
  - enters at a screen edge or fades in over 0.8 s (leaving Earth's shadow);
  - 60% fade into shadow over 1.2–1.5 s while warming toward pale orange;
  - **at most 4.8 s from first light to last**, clear sky only, one at a time, scroll-cancelled with a 0.3 s fade.

  If a page pause control ships (§9.4), satellites can move at a realistic 0.5–1°/s and last up to 20 s.

### 6.2 Comets

- [F][S34] A comet has a nucleus (usually under 16 km), a coma, a **broad, gently curved dust tail**, and an **ion tail that points directly away from the Sun**, straighter and thinner. Tails can stretch about 100 million km.
- [F][S35] NASA: comets brighten "while slowly moving across the sky night-to-night", and Sky & Telescope says they "crawl". Even IRAS–Araki–Alcock (1983), which came unusually close, moved only about four Moon diameters an hour.
- [C] That is about 2°/h, or 0.0006°/s: about 1/20,000 of a medium meteor's speed, or 0.013 px/s on a laptop. **A fast-moving "comet" is unrealistic.**
- **Recommendation [J], could:**
  - a **static**, faint comet on about 1 visit in 10, in the hero's clear upper-right sky;
  - coma: a Gaussian with σ 1.5 px core and 8 px halo, alpha 0.25 at most;
  - dust tail: 90–150 px, curving toward the horizon side, alpha 0.06 at most and fading along its length, pale yellow-white;
  - ion tail: 120–180 px, straight, about 2 px wide, alpha 0.03 at most, pale blue;
  - both tails point away from an implied Sun below the horizon (upward, ±30°);
  - it moves only with its layer (parallax or drift).

  Draw it with the near-layer star rules (quietKeep 0, inkKeep 0), so it never adds light near copy and never needs the ink budget. It doesn't move on its own, so 2.2.2's timing doesn't apply, and it may stay under reduced motion.

### 6.3 Planets

- [F][S36] Planets look steady because their disks average out the twinkle. [F][S37] Peak brightness: Venus about −4.6 to −5, Jupiter about −2.9, Mars about −2.9 at favorable oppositions, Saturn about −0.55.
- [J] **Could:** one planet in the near layer, at a reviewed position along an implied ecliptic.
  - Alpha at the `STAR_ALPHA.peak` ceiling (0.78), so it never outshines the copy.
  - Twinkle 0, a slightly wider core and a warm-white tint, so it reads as the steadiest bright point in the sky.
  - It changes the composed sky, so it needs a review like any catalog change.

### 6.4 The extras, ranked

1. **Bursts** (2–4 meteors from one radiant within 2 s): could. True clusters are rare. About 8 have been reported, and orbit databases hold 16 candidates. Clusters come from meteoroids that broke up days before reaching Earth, for example 8 faint meteors plus a fireball within 2 s in 2016, and at least 22 meteors in 2022 [F][S26].
2. **Binary meteors** (two parallel meteors 0.1–0.2 s apart): could, as a variant of a burst. Many apparent pairs are chance coincidences (a Geminid pair study), and true pairs are rare [F][S49].
3. **Shower outbursts** (rate ×3 for 20–60 s): **won't** by default. Real examples are the Leonids at ZHR about 3,700 in 1999 and about 1,400–3,400 in 2001 [F][S27]. A sustained outburst is one long attention-grabbing event, so it needs the pause control from §9.4.
4. **Milky Way: won't.** A large diffuse glow behind the copy would eat the 0.064 headroom under the haze and compete with the haze pools.
5. **Zodiacal light: won't.** It is a faint cone along the ecliptic, seen after dusk in spring and before dawn in autumn from dark sites only [F][S38]. It would add little and conflicts with the haze.
6. **Aurora: won't.** It is large-area moving curtains: green O 557.7 nm at 100–250 km and red 630 nm at 200–500 km [F][S24]. That is a known vestibular trigger [S46], it would last more than 5 s, and it would cost contrast.
7. **Airplanes: won't.** They aren't space objects, their strobes would count as blinking, and NASA uses them only as the comparison [S28].
8. **ISS, Starlink trains, Iridium-style flares: won't.** The ISS would have to be brighter than the copy-level star ceiling for minutes. A Starlink train reads as a UI artifact, puts many points in motion and lasts more than 5 s. Glints are attention-grabbing flashes, and the original Iridium flares no longer occur.

---

## 7. Catalog of transient kinds

Where: **H** is the hero (launch gate at most 0.4 viewport heights), **N** narrow screens (640 px or less), **R** the reading scene, **E** the end bookend. "Clear sky only" means the whole path stays at least `QUIET.feather` from every padded quiet rect, the same `segmentTouches` test `planFlight` uses today. "Lease" means the single slot for one lit transient near copy (§8.4).

| Kind | Real-world behavior | Screen spec | Direction rule | Rate | Where | Veil and quiet copy | Priority |
|---|---|---|---|---|---|---|---|
| Ordinary meteor, sporadic | Six broad sources; 1–3/h evening, 4–10/h dawn [S5]; 5–8/h [S7]; 3–25°/s [S4]; usually under 1 s [S14] | Speed class per source (§5.8): 9/14/22°/s × image and range factors; 0.55–1.4 s; 40 px to 0.36 long sides; peak 0.6–0.85 (30% faint at 0.3–0.5); light curve peaks at 0.45; drag 0.06 | Radiant from one of 3 per-visit sources, σ 15°; elevation density ∝ sin h·cos h; window at 40°: about 77% fall, 13% sideways, 10% climb; no angle filter | One shared meteor clock: floor 4 s + Exp(8 s), cap 30 s, **mean 11.7 s** after the last flight ends; long-visit stretch up to ×3. N: floor 8 + Exp(14), cap 45 (mean 21 s), at most 6 per visit | H, N | Full veil checks; burn out only behind copy; needs the lease and the 40 s crossing cooldown, otherwise clear sky only; scroll cancel | **Must** |
| Ordinary meteor, shower | Parallel paths diverging from a radiant a few degrees wide [S12]; IMO 2026 ZHR and V∞ table [S1] | As above, with the visit's speed class | One radiant per visit, σ 1.5°, 40% of launches; 15% of visits put it on screen in clear sky | Shares the meteor clock | H, N | As above | **Must** (replaces today's single top-right radiant) |
| Near-radiant and stationary meteor | A head-on meteor is a point; ω → 0 as D → 0 [S11][S12] | Within about 10° of an on-screen radiant: 40–80 px and slow; within 1°: a point flash of 0.3–0.5 s, no wake, peak 0.7 at most | Radial from the on-screen radiant | Part of the shower share; at most 1 stationary per 60 s | H (desktop) | Clear sky only | Could |
| Fireball | Brighter than −4 [S13][S6]; one per ~20 h of observing (−4), per ~200 h (−6) [S6]; vivid colors [S6] | 1.8–3 s at 8–14°/s; peak 1, glow ×1.6; peaks at 0.6–0.7; terminal flare on 50%; exponential drag δ 0.3–0.5 (could); green-white if fast, yellow-orange if slow | From the visit's sources | 4% of launches, at least 120 s apart, not in the first 20 s (about one per 5 min) | H (desktop) | Clear sky only (today's rule) | **Should** (retune the existing kind) |
| Fragment sparks | Fragmentation and terminal flash of bolides [S6] | 1–3 tiny points shed in a fireball's last 15%, at 0.85–0.95 of the head's speed, fading in 0.15–0.3 s | Along the fireball's path | With fireballs (50%) | H (desktop) | Clear sky only | Could |
| Persistent train | 557.7 nm short trains fade within a minute; long ones last minutes [S23]; O(¹S) lifetime about 0.7 s [S24] | Today's `TRAIN`: mint, 2.4 s at most, widening 1→3 px | Along the path | 15–30% of fast flights and fast fireballs | H (desktop) | Clear sky only (today's rule) | **Should** (keep) |
| Burst or binary | Clusters are rare (about 8 reported, 16 candidates) and come from fragmentation in space [S26][S49] | 2–4 members from the shower radiant, staggered 0.35–1.2 s, total span 5 s at most; peaks 0.45–0.7; no flares or trains. Binary: 2 members 0.15 s or less apart, parallel, 15–40 px apart | Shower radiant | 5% of launches, at least 90 s apart, after 45 s | H (desktop) | **All members clear sky only**, or the leader takes the lease and the rest stay clear | Could |
| Earthgrazer | Low radiant; long, slow, shallow; flares for many seconds [S25] | At least 0.45 of the width, within 12° of horizontal, 4–6°/s, 2.5–3.5 s, warm, long thin wake | Near-horizontal, either way | 2.5% of launches, at least 180 s apart, after 60 s; skipped if no band fits | H (1280 px wide or more) | Clear sky only | Could |
| Shower outburst | Leonids 1999 ZHR about 3,700 [S27] | Rate ×3 for 20–60 s | Shower radiant | Once per visit at most | H | Collides with the lease and the cooldown | Won't (could with a pause control) |
| Satellite | 0.1–1.05°/s depending on elevation [C]; sunlit only near dusk and dawn [S28][C]; steady, no blinking [S28]; fades and reddens into shadow [S29]; magnitude 2.7–6.5 [S30] | Steady point, no twinkle, no wake; alpha 0.25–0.5; 1.2–2.5°/s straight and constant; fades in 0.8 s; 60% fade into shadow over 1.2–1.5 s turning pale orange; **4.8 s at most** (up to 20 s at 0.5–1°/s with a pause control) | Any straight line | Own clock: floor 40 s + Exp(50 s), cap 150 s (**mean about 88 s**); first after 30 s; one at a time | H (wider than 640 px) | Clear sky only; scroll cancel with a 0.3 s fade; never takes the lease | **Should** |
| ISS, Starlink train, glints | ISS about Venus-bright, minutes per pass [S28][C]; trains last days after launch [S31]; Iridium flares end by 2019 [S32] | n/a | n/a | n/a | n/a | Too bright, too long, or flashy | Won't |
| Comet (static) | Curved dust tail and straight anti-sunward ion tail [S34]; drifts slowly night to night [S35] | Static; coma alpha 0.25 at most; dust tail 90–150 px, curved, 0.06 at most; ion tail 120–180 px, straight, 0.03 at most, pale blue; tails point away from a Sun below the horizon | None | 1 visit in 10, one at most | H (desktop); fades with the hero | Near-layer star rules (keep 0 near copy); never takes the lease | Could |
| Planet (static) | Steady; brightest points in the sky [S36][S37] | Near layer at 0.78, twinkle 0, slightly wider core, warm white | None | Always, if adopted (part of the reviewed sky) | All scenes, as a star | Near-layer star rules | Could |
| Milky Way, zodiacal light, aurora, airplanes | §6.4 | n/a | n/a | n/a | n/a | Contrast, vestibular or not space | Won't |

Reading scene (R): no transients [J]. Readers scroll often, so scroll cancels would be frequent; the ink headroom over body text is the tightest; and motion beside text distracts some readers [S39][S46]. End bookend (E): **could** add up to 2 "farewell" meteors per visit once the end scene is at 0.9 or more and the visitor has rested 3 s, with floor 8 + Exp(14) s and the same veil rules (Contact and the footer are quiet copy).

---

## 8. Frequency model

### 8.1 The compression factor

[C] At a mean gap of 11.7 s plus about 0.9 s of flight, the hero shows about **4.7 meteors a minute (about 280 an hour)**. A real window of the same size (§3.2) shows about 2.3 an hour at dawn. That makes the hero **about 120–130× a dawn sporadic sky, about 500× an evening one, about 15–17× a Perseid peak and about 10× a Geminid peak.** Today's rate is about 37× dawn sporadics. In plain words, the hero becomes a time-lapse of a strong shower night played at about 10–20×, which is what people picture when they hear "shooting stars".

### 8.2 The model

- **Poisson arrivals with a refractory floor and a cap [J]:** gap = min(cap, floor + Exp(mean)) × stretch(t). Each gap is counted from the end of the previous flight, as today, so ordinary meteors never overlap.
- **Mean gap [C]:** floor + mean·(1 − e^(−(cap − floor)/mean)).
- **Desktop hero:** floor 4, mean 8, cap 30, so the mean gap is **11.7 s**. 22% of gaps fall within 2 s of the floor, so pairs of meteors close together happen naturally without any burst logic, and only 3.9% hit the cap.
- **Long visits:** stretch(t) = min(3, 1 + max(0, t − 120 s)/240 s). The rate is unchanged for 2 minutes, halves at 6 minutes and drops to a third (mean about 35 s) after 10 minutes. This replaces today's step to ×1.5 at 180 s.
- **Idle (R3 owns the timings):** halve the rate (×2 gaps) after 60 s without input, and keep the stop at the idle sleep. These choices are about battery and distraction; neither counts as a 2.2.2 mechanism (§9.1).
- **Kind odds per launch:** fireball 4% (at least 120 s apart, after 20 s), burst 5% (at least 90 s apart, after 45 s), earthgrazer 2.5% (at least 180 s apart, after 60 s), stationary meteor only when the radiant is on screen (at most 1 per 60 s). The rest are ordinary meteors, 30% of them faint.
- **Satellites:** their own clock, floor 40 + Exp(50), cap 150 (mean about 88 s), first after 30 s.
- **Comet:** decided once per visit. **Planet:** part of the static sky.
- **First minute [C]:** about 5 meteors, against 2 today. A fireball in the first minute has about a 12% chance, a satellite about 30–40%.
- **First launch:** keep 4.5–7 s after the reveal, or earlier only once the veil session's settled-layout fix guarantees the quiet rects have eased in.

### 8.3 Numbers by scene and screen [J]

| Scene and screen | Meteors | Other kinds | Per-visit cap |
|---|---|---|---|
| Hero, wider than 640 px | floor 4 + Exp(8), cap 30 (11.7 s) | fireball, burst, earthgrazer, satellite, comet, stationary | none, plus the long-visit stretch |
| Hero, 640 px or narrower | floor 8 + Exp(14), cap 45 (21 s) | none: ordinary meteors only, no fireballs (as today) | **6** (up from 2); planner failures back off as today |
| Reading | none | none | n/a |
| End bookend | could: floor 8 + Exp(14) | none | 2 |
| prefers-reduced-motion, or the pause control on | none | static comet and planet only | n/a |

### 8.4 Concurrency: constraints for the planner and the veil session

The veil's contrast budget is for **one** transient near copy [S50]: the `METEOR_VEIL` comment's 0.053 of white against 0.082 of headroom, 0.064 under the haze and 0.026 over a far star. So:

- **C1, the copy lease.** Exactly one transient may be planned near copy at any moment (`dimFrom < 1`, inside a feather). It holds the lease from launch until its last light (wake or train) is gone. While the lease is held, and during the 40 s crossing cooldown, every other transient is planned **clear-sky-only**.
- **C2, bursts.** All members are clear-sky-only (recommended). Alternatively the leader may take the lease while the followers stay clear. Members never flare, and the stagger is at least 0.35 s, which keeps flashes at 3 per second or fewer (§9.2).
- **C3, clear-sky kinds.** Satellites, earthgrazers, fireballs, fragments and stationary meteors are always clear-sky-only, so none of them ever needs the ink budget.
- **C4, static kinds.** The comet and planet follow the per-frame star veil with near-layer keeps (quietKeep 0, inkKeep 0), not the flight veil.
- **C5, scroll cancel.** Every moving kind obeys it: fade over 0.2–0.3 s once scrollY moves 16–24 px from launch. Implement it once for all kinds.
- **C6, the 5-second rule.** Each moving transient lasts 5 s or less from first light to last, including wake, train or fade, and a burst's whole span is 5 s or less. Assert this with a unit test over the config.
- **C7, frame budget (R3).** Active animation-frame time grows from about 2 s per minute today to about 7–8 s per minute for meteors, plus about 3 s per minute for satellites. Satellites move only 29–60 px/s, so R3 may draw them at 30 fps.

---

## 9. Accessibility

### 9.1 WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A) [F][S39]

- **Normative text:** "For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more than five seconds, and (3) is presented in parallel with other content, there is a mechanism for the user to pause, stop, or hide it unless the movement, blinking, or scrolling is part of an activity where it is essential".
- **Notes on the SC:**
  - "Since any content that does not meet this success criterion can interfere with a user's ability to use the whole page, all content on the web page (whether it is used to meet other success criteria or not) must meet this success criterion" (non-interference).
  - "An animation that occurs as part of a preload phase or similar situation can be considered essential if interaction cannot occur during that phase for all users".
- **Understanding document:**
  - "'starts automatically' broadly refers to animations/updates that are not the direct result of a user's intentional activation".
  - "'Moving, blinking and scrolling' refers to content in which the visible content conveys a sense of motion. Common examples include motion pictures, synchronized media presentations, animations, real-time games, and scrolling stock tickers."
  - "Five seconds was chosen because it is long enough to get a user's attention, but not so long that a user cannot wait out the distraction if necessary to use the page."
  - "Moving content can also be a severe distraction for some people."
  - An animation that stops only while it has focus is not a pause mechanism.
  - "While not normatively required, if a page contains more than one moving, blinking, scrolling, or auto-updating element, consider providing a single mechanism to pause, stop, hide … that affects all these elements at the same time."
  - Example: "An animation runs in the upper portion of the page but has a 'freeze animation' button".
  - The only exemption examples are loading screens and full-page ads that are *not* in parallel with other content.

**Do the sky's effects count?**

- **Continuous ambient drift (R1).** **Yes [J, well supported].** It is motion that starts automatically, lasts more than 5 s and runs alongside the copy. Being decorative doesn't exempt it. In w3c/wcag #3478 and #4921 the WG (Patrick H. Lauke) says decorative status "has no bearing on whether or not it must comply with pause/stop/hide" and has queued a normative erratum changing "information" to "content" (PR #4920, not yet merged) [S43].
- **Stopping on its own.** It meets the SC only if the motion stops within 5 s, which is condition (2) and the basis of the G11, SCR22 and F50 techniques for blinking [S42]. A 90 s idle fade does not count, because the motion has already lasted more than 5 s. This corrects the "or must stop on its own" in COORDINATION.md request 3.
- **Recurring transients** (each under 5 s). These pass under the per-instance reading, "applies to every occurrence", in which each autoplay of 5 s or less passes (mbgower, #4447) [S43]. That reading is not settled: a dissent argues repeated plays can count cumulatively (#4447), and the issue remains open. The veil session's "per animation" assumption matches the main reading.
- **Twinkle.** Luminance flicker without motion. It is not "blinking", which is defined as switching "between two visual states in a way that is meant to draw attention" [S39], so the risk is low. It would still be covered by a single pause control.
- **Hero-only motion and scrolling away do not count as "hide".** In #5029, Detlev Fischer: "I do not believe anyone would consider scrolling down to get rid of moving content an acceptable mechanism"; Patrick Lauke: "likely not going to be a consistently acceptable mechanism" [S43].
- **prefers-reduced-motion as the only mechanism is contested.** In #4319 (2025) Patrick Lauke wrote that the "current thinking is that yes, it's a valid mechanism". In #3766, others replied "the media query alone is not a sufficient technique for 2.2.2". Lauke himself said "for purely decorative/eye-candy things, just suppressing those based on the media query seems a good approach" but "the mechanism that actually makes this pass 2.2.2 is the play/pause button". Both issues are open [S43].

### 9.2 SC 2.3.1 Three Flashes or Below Threshold (Level A) [F][S40]

- **SC:** "Web pages do not contain anything that flashes more than three times in any one second period, or the flash is below the general flash and red flash thresholds."
- **Threshold definition:**
  - A flash passes if "there are no more than three general flashes and / or no more than three red flashes within any one-second period; or the combined area of flashes occurring concurrently occupies no more than a total of .006 steradians within any 10 degree visual field on the screen (25% of any 10 degree visual field on the screen)".
  - A general flash is "a pair of opposing changes in relative luminance of 10% or more of the maximum relative luminance (1.0) where the relative luminance of the darker image is below 0.80".
  - "using a 341 x 256 pixel rectangle anywhere on the displayed screen area when the content is viewed at 1024 x 768 pixels will provide a good estimate of a 10 degree visual field".
- **G176** gives the threshold as "any single flashing event … smaller than a contiguous area of 21,824 sq pixels (any shape), would pass". The Understanding document substitutes CSS pixels, so the 10° field is 341 × 256 CSS px (87,296 CSS px²) and the 25% limit is about **21,824 CSS px²**. Content "should be analyzed at the largest scale at which a user may view the content".
- **Saturated red:** R/(R+G+B) of 0.8 or more [S40].
- **Do bright flares count as flashes? [C]** Yes. A meteor's brightening and fading, and a flare, are each "a pair of opposing changes" on navy. But they are tiny and infrequent:
  - fireball glow: the area with a luminance change of 0.1 or more is about 100–130 px² (σ 3 px; peak glow alpha about 0.6, or about 1 during a flare);
  - core plus wake: about 140–600 px²;
  - train: up to about 1,900 px², but its change is a single slow rise and fall over about 2.4 s.

  Every transient is **at most about 2,000 CSS px², well under 10% of 21,824**, and each produces one or two flashes per flight. So both G19 (3 flashes per second or fewer) and G176 (small area) pass. Keep the burst stagger at 0.35 s or more with no flares in bursts, so even a 4-member burst stays at 3 flashes per second or fewer without relying on the area argument. Use no saturated reds.

### 9.3 SC 2.3.3 Animation from Interactions (Level AAA), reduced motion, vestibular guidance

- **SC** [F][S41]: "Motion animation triggered by interaction can be disabled, unless the animation is essential". Motion animation "does not include changes – such as changes of color or opacity – that do not alter the perceived size, shape, position, or distance/depth of the element". The Intent names **parallax scrolling** as often non-essential. It also says 2.3.3 covers animation a user's interaction starts, while 2.2.2 covers animation the page starts automatically. Its example of a fix is a site-wide control that turns off extra scroll animation. The sufficient techniques are C39 and SCR40 (prefers-reduced-motion in CSS and JavaScript) [S42].
- **MDN** [F][S44][S45]. `prefers-reduced-motion` detects "a setting on their device to minimize the amount of non-essential motion … removes, reduces, or replaces motion-based animations". "Animations such as scaling or panning large objects can be vestibular motion triggers." "Parallax effects can cause disorientation … ensure the user has a control to turn them off."
- **Val Head, A List Apart (2015)** [F][S46]. The triggers are the relative size of the movement, mismatched directions and speeds (parallax, background and foreground at different speeds) and the distance covered. Changes to opacity, color or blur alone are unlikely to cause problems.
- **The sky today:** scroll parallax is disabled under reduced motion, which already meets 2.3.3 for parallax.

### 9.4 Recommended compliance approach [J]

1. **Every moving transient lasts 5 s or less** (C6). That makes meteors, bursts and short-arc satellites pass 2.2.2 under the per-instance reading with no control needed.
2. **If any continuous motion ships (R1's drift), add one page-level "Pause sky animation" toggle.** It follows G186 ("a control in the web page that stops moving, blinking, or auto-updating content"; "the control is either at the top of the page or adjacent to the moving content"; "a single control may stop all moving or blinking content") and G4 (pause and restart) [S42].
   - It stops drift, twinkle and all transients at once, as the Understanding document recommends.
   - It sits in the navbar or at the top corner of the hero.
   - It has an accessible name, `aria-pressed`, keyboard access, a target of at least 24 × 24 px (2.5.8), icon contrast of 3:1 (1.4.11) and a visible focus ring.
   - The state persists per viewer (localStorage inside try/catch).
   - Its initial state is **paused when `prefers-reduced-motion: reduce`** (C39 and SCR40).
   - "Pause" means stop now: in-flight transients fade out over 200 ms or less (a frozen streak looks broken), and drift holds its position.
   - **Reasons:** decorative motion isn't exempt; stopping on its own counts only within 5 s; scrolling away isn't a hide mechanism; and reduced motion as the only mechanism is contested (§9.1).
   - It also unlocks realistic slow satellites and outbursts.
   - In the code it can reuse the existing `'reduced'` motion pipeline: `motion = forcedColors ? 'off' : reducedMotion || userPaused ? 'reduced' : 'full'`.
3. **Keep the current preference handling.** Reduced motion means no twinkle, parallax or transients; forced colors means the sky is hidden. The static planet and comet may stay, because fades are not motion animation under 2.3.3's definition [S41].
4. **Flashes:** 3 per second or fewer, small areas, no saturated red (§9.2).
5. **Keep hero-only transients, the scroll cancel, the idle stop and the long-visit slowdown** for contrast, distraction and battery, and document them as UX choices, not 2.2.2 mechanisms.

---

## 10. TypeScript sketches, in the codebase's style

These are illustrative. `src/lib/sky` imports only its own files, by relative path (AGENTS.md).

```ts
// src/lib/sky/config.ts (additions)

/**
 * The screen as a window on the sky, for the geometry of shooting stars and satellites: its longer side spans `fov`
 * degrees and its centre looks `elevation` degrees above a horizon just below the screen, so a 16:10 window spans about
 * 21-59° (twinkle already grows toward the bottom, TWINKLE_HORIZON_GAIN). Today's nominal speed, 0.2 long sides per
 * second, is 12°/s here, a medium meteor (IMO: typically 3-25°/s). Shooting stars glow about `meteorHeight` km up, so
 * lower in the window they are farther away: slower, shorter and dimmer.
 */
export const SKY_WINDOW = { fov: 60, elevation: 40, meteorHeight: 100, earthRadius: 6371 } as const

/**
 * Where a visit's shooting stars come from. One shower radiant, a spot about `showerScatter` degrees wide, sends
 * `showerShare` of them; the rest come from `sporadicSources` broad sporadic sources (helion, antihelion, apex and
 * toroidal), each `sporadicScatter` degrees wide. Elevations follow real rates (hourly rate ∝ sin h, so the density is
 * sin h cos h) and azimuths are uniform: about 3 in 4 fall, 1 in 8 cross sideways, 1 in 10 climb, half go each way. On
 * `onScreen` of visits the shower radiant lies on screen in clear sky, where its shooting stars are short and slow.
 */
export const RADIANTS = { showerShare: 0.4, showerScatter: 1.5, sporadicSources: 3, sporadicScatter: 15, onScreen: 0.15 } as const

interface SpeedClass {
	/** Angular speed 90° from the radiant at the window's centre (°/s). */
	angular: number
	/** Flight duration range (s). */
	duration: readonly [number, number]
	/** Wake colour the head cools to. */
	wake: 'warm' | 'white' | 'mint'
	/** Whether a persistent train is possible. */
	train: boolean
}

/**
 * Speed classes by entry speed (IMO: 11 km/s very slow, 40 medium, 72 very fast). The sporadic sources map onto them:
 * helion and antihelion about 30 km/s, toroidal 35-40, apex about 60. Fast meteors cool to mint (magnesium 517 nm,
 * oxygen 557.7 nm) and alone may leave a train; slow ones glow warm (sodium 589 nm, iron).
 */
export const SPEED_CLASSES = {
	slow: { angular: 9, duration: [1.1, 1.4], wake: 'warm', train: false },
	medium: { angular: 14, duration: [0.8, 1.1], wake: 'white', train: false },
	fast: { angular: 22, duration: [0.55, 0.8], wake: 'mint', train: true },
} as const satisfies Record<string, SpeedClass>

/**
 * Shooting-star launches. A dark rural site sees 1-3 sporadic meteors an hour in the evening and 4-10 before dawn
 * (AMS), and this window holds about 29% of an observer's 50°-radius field (IMO): a real window shows one every 25-100
 * minutes, or one every 2-4 minutes at a Perseid or Geminid peak. The hero compresses that about 120 times: gaps, from
 * the end of the last flight, are `floor` plus an exponential extra with mean `mean`, at most `cap` (Poisson arrivals
 * with a refractory floor and no droughts). From `slowFrom` s into a visit every gap stretches by
 * 1 + (t - slowFrom) / slowScale, at most `slowMax` times, so the sky never turns into a screensaver.
 */
export const METEOR_RATE = {
	hero: { floor: 4, mean: 8, cap: 30 },
	/** Phones: the copy fills the hero, so rarer and capped per visit. */
	narrow: { floor: 8, mean: 14, cap: 45, limit: 6 },
	slowFrom: 120,
	slowScale: 240,
	slowMax: 3,
	/** Least seconds between two flights that burn out behind quiet copy; meanwhile flights stay in clear sky. */
	crossingCooldown: 40,
} as const

/** Odds per launch, least seconds between two of a kind, and the earliest second after the reveal. */
export const METEOR_KINDS = {
	fireball: { chance: 0.04, spacing: 120, after: 20 },
	burst: { chance: 0.05, spacing: 90, after: 45, members: [2, 4], stagger: [0.35, 1.2] },
	earthgrazer: { chance: 0.025, spacing: 180, after: 60 },
} as const

/**
 * Satellites: steady points (no twinkle, no wake) gliding in a straight line, lit by a Sun below the horizon. Real low
 * orbits cross about 1°/s overhead and 0.2-0.3°/s low in the sky; these run `speed` °/s (2-3 times faster) so a whole
 * pass, fading in from an edge or out of Earth's shadow and fading into it while warming as real ones redden, stays
 * under `life` seconds (WCAG 2.2.2's 5 s). Clear sky only, one at a time, on their own clock.
 */
export const SATELLITE = {
	gap: { floor: 40, mean: 50, cap: 150 },
	after: 30,
	speed: [1.2, 2.5],
	alpha: [0.25, 0.5],
	life: 4.8,
	fadeIn: 0.8,
	fadeOut: [1.2, 1.5],
	shadowShare: 0.6,
} as const
```

```ts
// src/lib/sky/radiants.ts (new; worker-safe: no DOM, no React, own-folder imports only)
import { SKY_WINDOW } from './config'
import { between } from './random'

/** Radians per degree. */
const DEG = Math.PI / 180

/** A unit direction in the window's frame: x to the right, y down the screen, z through the screen into the sky. */
export interface SkyDirection {
	x: number
	y: number
	z: number
}

/** The screen as a pinhole window (gnomonic: straight paths stay straight and parallel paths meet at their radiant). */
export interface SkyWindow {
	cx: number
	cy: number
	/** CSS px per unit of the image plane: the longer side spans SKY_WINDOW.fov. */
	focal: number
	/** Elevation of the screen centre (radians). */
	pitch: number
}

/** The window for a viewport. */
export function skyWindow(width: number, height: number): SkyWindow {
	const focal = Math.max(width, height) / 2 / Math.tan((SKY_WINDOW.fov * DEG) / 2)
	return { cx: width / 2, cy: height / 2, focal, pitch: SKY_WINDOW.elevation * DEG }
}

/** The direction toward elevation `h` and azimuth `a` (radians; azimuth 0 is straight ahead, positive to the right). */
export function toward(view: SkyWindow, h: number, a: number): SkyDirection {
	const right = Math.cos(h) * Math.sin(a)
	const ahead = Math.cos(h) * Math.cos(a)
	const up = Math.sin(h)
	const cos = Math.cos(view.pitch)
	const sin = Math.sin(view.pitch)
	return { x: right, y: ahead * sin - up * cos, z: ahead * cos + up * sin }
}

/** A radiant weighted like real rates: hourly rates scale with sin h (IMO), so elevations have density sin h cos h. */
export function sampleRadiant(random: () => number, view: SkyWindow): SkyDirection {
	return toward(view, Math.asin(Math.sqrt(random())), between(random, -Math.PI, Math.PI))
}

/** How a shooting star from a radiant crosses one screen point. */
export interface RadiantMotion {
	/** Unit screen direction: away from the radiant's vanishing point (toward the antiradiant's when it is behind the viewer). */
	dirX: number
	dirY: number
	/**
	 * Screen speed in focal lengths per unit of entry speed over range: px/s = focal × V × rate / range. It is 1 at the
	 * centre 90° from the radiant, falls to 0 at the radiant (a head-on meteor stands still) and grows a little toward
	 * the edges.
	 */
	rate: number
}

/** The screen motion at (x, y) of a shooting star from `radiant`, or null at the radiant itself (a stationary meteor). */
export function radiantMotion(view: SkyWindow, radiant: SkyDirection, x: number, y: number): RadiantMotion | null {
	const u = (x - view.cx) / view.focal
	const v = (y - view.cy) / view.focal
	// A point moving along -radiant crosses the image along (u·rz - rx, v·rz - ry), whatever its depth
	const dx = u * radiant.z - radiant.x
	const dy = v * radiant.z - radiant.y
	const image = Math.hypot(dx, dy)
	if (image < 1e-6) return null
	return { dirX: dx / image, dirY: dy / image, rate: image * Math.hypot(u, v, 1) }
}

/** Elevation (radians) behind screen point (x, y). */
export function elevationAt(view: SkyWindow, x: number, y: number): number {
	const u = (x - view.cx) / view.focal
	const v = (y - view.cy) / view.focal
	return Math.asin((Math.sin(view.pitch) - v * Math.cos(view.pitch)) / Math.hypot(u, v, 1))
}

/** Range (km) to the meteor layer at elevation `h` (radians): 100 km overhead, about 172 km at 35° and 477 km at 10°. */
export function meteorRange(h: number): number {
	const ground = SKY_WINDOW.earthRadius
	const layer = ground + SKY_WINDOW.meteorHeight
	return Math.sqrt(layer * layer - (ground * Math.cos(h)) ** 2) - ground * Math.sin(h)
}
```

```ts
// Inside the veil session's planFlight, replacing the away/below filter (sketch for them to adopt)
const motion = radiantMotion(view, jittered, start.x, start.y)
if (!motion) continue
const range = meteorRange(elevationAt(view, start.x, start.y)) / meteorRange(view.pitch)
const speed = (SPEED_CLASSES[source.speed].angular * DEG * view.focal * motion.rate * jitter) / range
const duration = between(random, ...SPEED_CLASSES[source.speed].duration)
const length = Math.min(maxPath, speed * duration)
if (length < (nearOnScreenRadiant ? 40 : minPath)) continue
```

```ts
// src/lib/sky/meteors.ts: one gap function for every clock (meteors, satellites)
/** Seconds until the next launch: Poisson arrivals with a refractory floor and a cap, stretched on long visits. */
export function nextGap(random: () => number, gap: { floor: number; mean: number; cap: number }, secondsSinceReveal: number): number {
	const stretch = Math.min(METEOR_RATE.slowMax, 1 + Math.max(0, secondsSinceReveal - METEOR_RATE.slowFrom) / METEOR_RATE.slowScale)
	return Math.min(gap.cap, gap.floor - gap.mean * Math.log(1 - random())) * stretch
}
```

```ts
// src/components/sky/sky.worker.ts (sketch): one transient at a time may light up near quiet copy
let copyLeaseUntil = -Infinity
let lastCrossingAt = -Infinity

/** True when the next flight may be planned to burn out behind quiet copy (METEOR_VEIL's ink budget is for one). */
function mayCrossCopy(t: number): boolean {
	return t >= copyLeaseUntil && t - lastCrossingAt >= METEOR_RATE.crossingCooldown
}

// After planning with { nearCopy: mayCrossCopy(t) }: a flight that dims near copy holds the lease until its light is gone
if (plan.nearCopy) {
	copyLeaseUntil = t + meteorLifetime(plan)
	lastCrossingAt = t
}
```

---

## 11. Interface requests to the veil session

To merge after its commit lands, without changing `veiledFrom` or `METEOR_VEIL`:

1. **`planMeteor` and `planFlight` take a direction source instead of a radiant point:** `{ radiant: SkyDirection, scatter, speed }` plus the `SkyWindow`, and an option `nearCopy: boolean`. With `false`, the flight is clear-sky-only, the same path fireballs take today. The returned meteor reports `nearCopy`, meaning `dimFrom < 1`, so the worker can hold the lease.
2. **`meteorLight` gains an optional curve parameter later.** `veiledFrom` keeps calling the default curve, and non-default curves are used only for clear-sky flights.
3. **`travel` and `meteorPoint` gain optional exponential drag**, for fireballs only (clear sky), so the veil's sampling of veiled flights doesn't change.
4. **The scroll cancel is written once and shared by every moving kind:** `launchScrollY` plus a 0.2–0.3 s fade.
5. **Radiant stickiness.** The shower radiant is meant to be sticky for a visit. Re-pick it on resize or layout, or after N failed plans, which matches their sticky-radiant fix. Sporadic sources vary per meteor, so the sky never repeats one direction.

---

## Key recommendations

- **Population model first.** Replace the single far top-right radiant and its 18–42° right-to-left filter with a 60° pinhole window looking 40° above the horizon. Each visit gets one shower radiant (σ 1.5°, 40% of launches) and three sporadic sources (σ 15°, 60%) with slow, medium and fast speed classes. Radiants follow the real rate law (density ∝ sin h·cos h). The result is about 77% falling, 13% sideways and 10% climbing meteors, split evenly left and right, with real convergence and foreshortening, and no angle filter.
- **Put the radiant on screen on about 15% of visits.** Near it, meteors are short and slow, and a head-on one is a stationary flash. This is the strongest realism cue available.
- **Raise the rate about 3.5×.** Desktop hero gaps become floor 4 s + Exp(8 s), capped at 30 s: a mean of 11.7 s instead of 41.7 s, about 4.7 meteors a minute and about 5 in the first minute. That is an explicit compression of about 120–130× a dawn sporadic sky, or 10–20× a major-shower peak. The rate halves by 6 minutes and drops to a third after 10. Narrow screens: floor 8 + Exp(14), capped at 45 (21 s), at most 6 per visit. Reading: none.
- **Speed classes from real entry speeds:** 9, 14 and 22°/s with durations of 1.1–1.4, 0.8–1.1 and 0.55–0.8 s, warm, white and mint wakes, and trains only on fast meteors. Lower meteors are slower, shorter and dimmer by range (h/q). 30% of ordinary meteors are faint.
- **Keep today's light curve as the default.** Its peak at 0.45 (F about 0.47) is realistic for fragile cometary meteoroids, which tend toward symmetric curves; the classical late peak (F about 0.66–0.74) is for compact bodies. Use late-peaked curves with a terminal flare only on clear-sky fireballs. The cubic drag is fine for faint meteors; exponential (Whipple–Jacchia) drag with k = 4–5 is an optional refinement for fireballs only.
- **Fireballs** drop to 4% of launches, at least 120 s apart, late-peaked, colored by speed class, and clear-sky only.
- **Add short-arc satellites (should)** and, optionally, bursts, earthgrazers, a rare static comet and a steady planet (could):
  - satellites: steady, no twinkle, no wake, 1.2–2.5°/s, fading into Earth's shadow with a warm shift, 4.8 s or less, clear sky only, on their own clock with a mean of about 88 s;
  - bursts: all members clear-sky-only, staggered at least 0.35 s;
  - earthgrazers: clear-sky only;
  - comet: static, faint, tails pointing away from a Sun below the horizon, about 1 visit in 10;
  - planet: steady, at the 0.78 star ceiling, twinkle 0.

  Won't: outbursts (unless a pause control lands), the ISS, Starlink trains, glints, the Milky Way, zodiacal light, aurora and airplanes.
- **Honor the veil constraints with one mechanism.**
  - A single copy lease: one transient near copy at a time, held until its last light is gone.
  - A 40 s crossing cooldown, so crossings per minute stay at or below today's despite the higher rate (synthetic estimate: each meteor is about half as likely to cross).
  - Every moving kind uses the same veil checks and the same scroll cancel.
  - Static bodies use the near-layer star keeps.
- **WCAG.** Every moving transient lasts 5 s or less, including wake, train and fade, asserted by a test. Flashes stay at 3 per second or fewer and at most about 2,000 px², against a threshold of 21,824 px², with no saturated red. **Add one page-level "Pause sky animation" toggle (G186 and G4)** the moment any continuous drift ships: decorative motion isn't exempt, stopping on its own counts only within 5 s, scrolling away isn't a hide mechanism, and reduced motion as the only mechanism is contested. Its initial state is paused under `prefers-reduced-motion`, and it reuses the `'reduced'` pipeline.

## Risks and open questions

- **Crossing frequency was measured on a synthetic layout.** Real crossings per minute under the new mix need the veil session's harness on captured layouts. Their "prefer crossings" idea and this cooldown must be one knob.
- **Ink budget over far stars.** With 0.026 of headroom over a far star on the same pixel, even one veiled meteor can exceed the budget there. That is the veil session's problem, but every new kind is designed to need none of the budget, so only ordinary meteors compete for it.
- **Interface churn.** Direction sampling lives inside `planFlight`, which the veil session owns. The integration depends on their accepting a source plus `nearCopy` option. A per-meteor light curve or drag needs changes to the `meteorLight` and `travel` signatures, and both are used by `veiledFrom`.
- **Two 2.2.2 questions are not settled.** Whether recurring short transients count cumulatively (#4447 dissent), and whether reduced motion alone is a valid mechanism (#4319 and #3766). The "information" → "content" erratum (PR #4920) is pending. The plan stays conservative: 5 s per transient, plus a pause control once drift exists.
- **Satellites at 4.8 s** are 2–3× time-compressed and may read as slow meteors. The defenses are no wake, constant speed and steady light. The realistic version (0.5–1°/s, 20 s) needs the pause control.
- **Climbing meteors (about 10%)** are physically right but may look "wrong" to some viewers. Their share is tunable through the window elevation: 40° gives 10%, 55° gives 19%.
- **Fast meteors at 0.55–0.8 s** are realistic but shorter than today's floor of 0.9 s. If they feel missable, raise the fast floor to 0.7 s.
- **The 60° field of view and 40° pitch are design constants.** Real viewing distance is unknown, so "realism" means plausible angular rates, not a 1:1 map.
- **Narrow screens.** Raising the cap from 2 to 6 may not raise the count much, because the phone hero has almost no clear sky and planning fails often. Measure it.
- **Battery and frame time.** Active rAF time grows about 3–5× (C7). R3 should decide whether satellites draw at 30 fps and whether the idle stop moves.
- **Seasonal showers (could)** need the IMO activity windows checked against cal2026 Table 5 before encoding. Store only date windows and V∞, never ZHRs.
- **Comet naming.** Adding a real comet while the user calls meteors "the comet" may confuse at first. The plain-words section above is meant to head that off.
- **Source access.** Astronomy figures came from search extracts of the cited pages, not full reads, because only GitHub was reachable. The values most worth spot-checking before they go into code comments: the US Standard Atmosphere mesopause temperature (scale height), the IMO activity windows, and the AMS fireball-per-hours figures.

---

## Sources

WCAG, MDN and the GitHub issue threads were read in full from their sources. Everything else was read through web-search extracts (see the access note at the top).

- [S1] IMO 2026 Meteor Shower Calendar: https://www.imo.net/files/meteor-shower/cal2026.pdf
- [S2] IMO FAQ: https://www.imo.net/resources/faq/ · IMO, The Observation: https://www.imo.net/observations/methods/visual-observation/major/observation/
- [S3] IMO, IMC 2015, Molau, "Population index reloaded" (ZHR formula, γ = 1): https://www.imo.net/imcs/imc2015/2015-27-molau-final.pdf · IMC 2014, Molau: https://imo.net/imcs/imc2014/2014-28-molau-final.pdf
- [S4] IMO telescopic forms (velocity classes A–F, about 3°/s to over 25°/s): https://www.imo.net/observations/methods/telescopic-observation/form/ · IMO calendars (angular speeds typically 3–25°/s; 11 km/s very slow, 40 medium, 72 very fast): [S1]
- [S5] AMS Meteor Activity Outlooks, 2026 (sporadic rates): e.g. https://www.amsmeteors.org/2026/07/meteor-activity-outlook-for-july-18-24-2026/ · https://www.amsmeteors.org/2026/05/meteor-activity-outlook-for-may-9-15-2026/ · AMS FAQ: https://www.amsmeteors.org/faq/
- [S6] AMS Fireball FAQ: https://www.amsmeteors.org/fireballs/faqf/ · AMS Glossary: https://www.amsmeteors.org/glossary/
- [S7] NASA/TM-2019-220142, A Meteoroid Handbook for Aerospace Engineers and Managers: https://ntrs.nasa.gov/api/citations/20200000049/downloads/20200000049.pdf
- [S8] NASA Meteoroid Environment Office, Sporadic Meteoroid Environment: https://www.nasa.gov/meteoroid-environment-office/sporadic-meteoroid-environment/
- [S9] NASA MEM 3 report: https://ntrs.nasa.gov/api/citations/20200000996/downloads/20200000996.pdf
- [S10] Campbell-Brown (2005), The meteoroid environment: shower and sporadic meteors: https://www.lpi.usra.edu/meetings/dust2005/pdf/4040.pdf · Jones & Brown (1993), MNRAS 265, 524: https://ui.adsabs.harvard.edu/abs/1993MNRAS.265..524J/abstract · Campbell-Brown (2008), Icarus 196, 144: https://www.sciencedirect.com/science/article/abs/pii/S0019103508001085 · Arecibo radiant distribution (MNRAS 515, 2088): https://academic.oup.com/mnras/article/515/2/2088/6639883
- [S11] Development of a very faint meteor detection system… (ω = (180/π)·V∞·sin D / q): https://arxiv.org/pdf/2112.15507
- [S12] Sky & Telescope, How well defined is a meteor-shower radiant?: https://skyandtelescope.org/astronomy-resources/astronomy-questions-answers/how-well-defined-is-a-meteor-shower-radiant/
- [S13] IAU Commission F1, Definitions of terms in meteor astronomy: https://www.iau.org/common/Uploaded%20files/Definitions%20of%20terms%20in%20meteor%20astronomy_F1.pdf
- [S14] ESA Kids, Meteors: https://www.esa.int/kids/en/learn/Our_Universe/Comets_and_meteors/Meteors · ESA TV, meteor captured by ESA's fireball camera in Cáceres (an 8–10 s example): https://www.esa.int/esatv/Videos/2024/05/Stunning_meteor_captured_by_ESA_s_fireball_camera_in_Caceres_Spain/
- [S15] NASA Watch the Skies, How low can they go? (Perseid heights): https://www.nasa.gov/blogs/watch-the-skies/2010/08/12/how-low-can-they-go/
- [S16] Silber & Brown (2014), Optical observations of meteors generating infrasound I: https://arxiv.org/pdf/1407.6331
- [S17] Vida et al. (2020), Estimating trajectories of meteors: an observational Monte Carlo approach I, MNRAS 491, 2688: https://academic.oup.com/mnras/article/491/2/2688/5626361
- [S18] Properties of meteors with double-peaked light curves (MNRAS 2019): https://arxiv.org/abs/1902.05931
- [S19] Subasinghe, Campbell-Brown & Stokan (2016), MNRAS 457, 1289: https://academic.oup.com/mnras/article/457/2/1289/967237
- [S20] NASA Ames Leonid MAC, meteor colors: https://leonid.arc.nasa.gov/meteor.html · APOD 2023 July 24: https://apod.nasa.gov/apod/ap230724.html
- [S21] Meteor colorimetry with CMOS cameras: https://arxiv.org/pdf/2106.07403
- [S22] Meteors: Light from Comets and Asteroids (review; Borovička two-component spectra): https://arxiv.org/pdf/2007.04041
- [S23] Cordonnier et al. (2024), Not So Fast: A New Catalog of Meteor Persistent Trains, JGR Space Physics: https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2024JA032643 · https://arxiv.org/pdf/2407.18344
- [S24] Space Plasma Physics: A Review (O(¹S) lifetime about 0.7 s): https://arxiv.org/pdf/2209.14545 · NASA, Red and Green Aurora Australis: https://www.nasa.gov/image-article/red-green-aurora-australis/
- [S25] APOD 2009 March 2, Earthgrazer: https://science.nasa.gov/image-article/apod-2009-march-2-earthgrazer-the-great-daylight-fireball-of-1972/ · IMO, Viewing the Geminids 2022: https://www.imo.net/viewing-the-geminid-meteor-shower-in-2022/
- [S26] Meteor clusters: tracing meteoroid fragmentation in near-Earth space: https://arxiv.org/html/2604.07887v1 · Koten et al. (2017), A&A, September ε Perseid cluster: https://doi.org/10.1051/0004-6361/201630246 · A&A 2024, Scandinavian cluster: https://www.aanda.org/articles/aa/full_html/2024/03/aa48618-23/aa48618-23.html · A&A 2025, Towards a definition of a meteor cluster: https://www.aanda.org/articles/aa/full_html/2025/04/aa52445-24/aa52445-24.html
- [S27] IMO, Leonids 2001 updated profile: https://www.imo.net/leonids-2001-updated-profile/ · NASA Orbital Debris Quarterly News 7(2): https://orbitaldebris.jsc.nasa.gov/quarterly-news/pdfs/ODQNv7i2.pdf
- [S28] NASA, Spot the Station FAQ: https://www.nasa.gov/missions/station/spot-the-station-frequently-asked-questions/ · https://www.nasa.gov/spot-the-station/
- [S29] Sky & Telescope, Flight into Darkness: https://skyandtelescope.org/astronomy-news/flight-into-darkness-observe-the-iss-in-earths-shadow/
- [S30] Mallama (2021), VisorSat brightness: https://arxiv.org/pdf/2101.00374 · Mallama & Respler (2022): https://arxiv.org/pdf/2210.17268 · Starlink Mini brightness during orbit-raising: https://arxiv.org/pdf/2405.12007 · Mallama & Cole (2024), Extreme flaring: https://arxiv.org/pdf/2405.13091
- [S31] Space.com, Starlink satellite train: https://www.space.com/starlink-satellite-train-how-to-see-and-track-it · Sky & Telescope, The Starlink Situation: https://skyandtelescope.org/astronomy-news/starlink-satellites-astronomy/
- [S32] Spaceflight Now, Iridium flares: https://spaceflightnow.com/?p=21416
- [S33] Kuhn et al. (2025), Atmospheric scintillation in resident space object photometry (ESA SDC9): https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/344/SDC9-paper344.pdf
- [S34] NASA, Comets in depth: https://solarsystem.nasa.gov/asteroids-comets-and-meteors/comets/in-depth.amp · NASA/JPL Rosetta comet primer: https://rosetta.jpl.nasa.gov/science/comet-primer/anatomy-comet
- [S35] NASA Goddard, Comets and other small objects: https://pwg.gsfc.nasa.gov/stargaze/Scomets.htm · Sky & Telescope, Comets crawl…: https://skyandtelescope.org/astronomy-blogs/explore-night-bob-king/comets-crawl-through-the-skies-at-dawn-and-dusk/ · Sky & Telescope, Comet astrophotography (IRAS–Araki–Alcock): https://skyandtelescope.org/astronomy-blogs/imaging-foundations-richard-wright/comet-astrophotography/
- [S36] NASA Imagine the Universe, Ask an Astrophysicist (planets don't twinkle): https://imagine.gsfc.nasa.gov/ask_astro/night_sky.html
- [S37] Sky & Telescope, How bright are the planets?: https://skyandtelescope.org/observing/measuring-planet-magnitudes/
- [S38] NASA Night Sky Network, Night Lights: https://science.nasa.gov/solar-system/skywatching/night-sky-network/nsn-night-lights/ · Sky & Telescope, Fuzzy glows: https://skyandtelescope.org/astronomy-news/fuzzy-glows-of-the-season-zodiacal-light-gegenschein-airglow-and-aurorae/
- [S39] WCAG 2.2 SC 2.2.2 and Understanding: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html (source: https://raw.githubusercontent.com/w3c/wcag/main/understanding/20/pause-stop-hide.html, https://raw.githubusercontent.com/w3c/wcag/main/guidelines/sc/20/pause-stop-hide.html; "blinking": guidelines/terms/20/blinking.html)
- [S40] WCAG 2.2 SC 2.3.1, definitions and Understanding: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html (source: understanding/20/three-flashes-or-below-threshold.html, guidelines/terms/20/general-flash-and-red-flash-thresholds.html, guidelines/terms/20/flash.html)
- [S41] WCAG 2.2 SC 2.3.3, Understanding and the "motion animation" definition: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html (source: understanding/21/animation-from-interactions.html, guidelines/terms/21/motion-animation.html)
- [S42] WCAG techniques G4, G11, G19, G176, G186, F16, F50, C39, SCR40: https://www.w3.org/WAI/WCAG22/Techniques/ (source: https://github.com/w3c/wcag/tree/main/techniques; technique lists in understanding/understanding.11tydata.js)
- [S43] w3c/wcag issues: #3478 https://github.com/w3c/wcag/issues/3478 · #4921 https://github.com/w3c/wcag/issues/4921 · #4319 https://github.com/w3c/wcag/issues/4319 · #3766 https://github.com/w3c/wcag/issues/3766 · #4447 https://github.com/w3c/wcag/issues/4447 · #5029 https://github.com/w3c/wcag/issues/5029
- [S44] MDN, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion (source: mdn/content files/en-us/web/css/reference/at-rules/@media/prefers-reduced-motion/index.md)
- [S45] MDN, Seizure disorders guide: https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Seizure_disorders (source: mdn/content files/en-us/web/accessibility/guides/seizure_disorders/index.md)
- [S46] Val Head, Designing Safer Web Animation for Motion Sensitivity, A List Apart (2015): https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/ · Val Head, Designing With Reduced Motion for Motion Sensitivities, Smashing Magazine (2020): https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/ · W3C WAI GL wiki, Animation caused by user interaction: https://www.w3.org/WAI/GL/wiki/Animation_caused_by_user_interaction
- [S47] U.S. Standard Atmosphere, 1976: https://apps.dtic.mil/sti/html/tr/ADA035728/index.html
- [S48] Velocity distribution of larger meteoroids and small asteroids impacting Earth: https://arxiv.org/pdf/2011.07775
- [S49] Geminid pair statistics (Poisson versus Monte Carlo). Probably arXiv 2110.01324, the A&A 2021 paper at https://www.aanda.org/10.1051/0004-6361/202141809; verify the identification: https://arxiv.org/abs/2110.01324v1 · IMO, Exceptional multiple meteor over Brazil: https://www.imo.net/exceptional-multiple-meteor-over-brazil/
- [S50] Meteor-veil session constraints: /home/user/Portfolio/.claude/plans/sky-ambient-motion/COORDINATION.md
- [S51] Diurnal variation of sporadic meteor rates (maximum near 06 LT, minimum near 18 LT): https://koreascience.or.kr/article/CFKO200923859564416.pdf · Earth, Moon, and Planets: https://link.springer.com/article/10.1007/s11038-005-9007-0
