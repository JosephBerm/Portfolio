# R1: Physics and perception of depth and ambient motion

Research agent R1 (planning only; nothing in the repository was changed). Scope: the physics, formulas and perception
science for a star field that drifts on its own and feels deep. Meteors and other bodies are R2's, rendering and
scheduling R3's, motion design and the old implementation R4's. My numbers that constrain theirs are collected in
section 9.

Legend used throughout:

- **[V]** verified against the cited source (official page, peer-reviewed abstract, or the installed library source).
- **[D]** derived here (math, or a computation you can rerun: scripts in
  `/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/r1calc/`).
- **[J]** my judgment.

Access note: this session's egress proxy refused direct fetches (w3.org, MDN, motion.dev, PubMed, publishers), and the
`motion` and `zod` MCP servers failed to connect. Sources were verified through search-engine abstracts and official
pages as indexed, and Motion's spring math was verified against the installed
`node_modules/motion-dom/dist/es/animation/generators/spring.mjs` (motion-dom 12.38.0). Where only a secondary
summary was reachable, the citation says so.

---

## 0. The core idea in plain words

Look out of a train window. The fence rushes by, the trees glide, the mountains crawl, and the Moon seems to ride
along with the train. Nothing is moving except you. Each thing's speed across the window is set by one rule: **the
farther away it is, the slower it slides** (twice as far, half as fast). Your brain reads those speed differences as
depth. That is motion parallax.

Real stars are like the Moon, only far more so. They are so far away that they ride along with you: from Earth, no
star shows any visible parallax, however you move. So "depth" in a night sky is an honest artistic conceit. We build a
**diorama**, like Disney's multiplane camera (1937), which slid layers of painted glass under a camera at different
speeds: we pretend the stars hang at modest distances, like the fence posts, trees and mountains, and move one camera
past them.

Three rules make it feel real rather than decorative:

1. **One camera, one law.** Whatever moves the camera (scrolling, the slow ambient float, leaning toward the pointer),
   each star moves on screen by `q × camera`, where `q` is its nearness (1 / distance). Scroll and drift can never
   disagree about which star is nearer.
2. **Brightness tells distance.** Picture a street of identical streetlights at night: the dimmer a light looks, the
   farther away it is (the inverse-square law). We read each star's distance from its magnitude the same way, so the
   bright stars are the near, fast ones and the faint dust of stars is far and slow. Every cue agrees: bright = big =
   fast = near.
3. **The camera floats; it does not travel.** Its path is a set of *epicycles* (Ptolemy's circles riding on circles)
   at golden-ratio frequencies: it always moves, never races, never stops dead, turns its heading a couple of degrees
   per second and never repeats. Scrolling hands the camera to a soft, critically damped spring (like a door closer:
   it settles in half a second without bouncing), so the stars glide to rest instead of stopping dead.

How fast? Slow enough to be calm, fast enough to see. The real sky turns at 0.25 arcmin/s, the speed at which the tip
of a wall clock's minute hand moves seen from across a room: invisible. A clock's second hand (about 18 arcmin/s) is
obvious. The near stars should move at about 4 arcmin/s and the faint ones at about 1 arcmin/s, right at the edge of
what you notice, so you see bright stars sliding over a nearly still background. That contrast *is* the 3D.

---

## 1. Motion parallax under a pinhole camera

### 1.1 The flow equations [D, decomposition per Longuet-Higgins & Prazdny 1980 [V]]

Camera coordinates: a static point P = (X, Y, Z) projects to x = f·X/Z, y = f·Y/Z (f = focal length in px). If the
camera translates with velocity T = (Tx, Ty, Tz) and rotates with angular velocity Ω = (Ωx, Ωy, Ωz), the point moves
relative to the camera with Ṗ = −T − Ω × P. Differentiating the projection:

```
u = ẋ = (−f·Tx + x·Tz) / Z  +  (x·y/f)·Ωx − (f + x²/f)·Ωy + y·Ωz
v = ẏ = (−f·Ty + y·Tz) / Z  +  (f + y²/f)·Ωx − (x·y/f)·Ωy − x·Ωz
        └──── translation: ∝ 1/Z ────┘   └──────── rotation: independent of Z ────────┘
```

This is the classic decomposition Longuet-Higgins and Prazdny (1980) used to show that a single moving eye can, in
principle, recover its own motion and the scene's layout from the flow field [V, abstract]. Only the translational
part carries depth; the rotational part depends only on image position.

### 1.2 The three cases

| Camera motion | Image motion | Depth information? |
|---|---|---|
| **Lateral translation** (truck/pedestal: Tz = 0, Ω = 0) | u = −f·Tx/Z, v = −f·Ty/Z: every point at depth Z shifts by the same amount, wherever it is on screen; **screen velocity = f·V/Z** | **Yes, the cleanest.** Speed ratios are inverse depth ratios (u₁/u₂ = Z₂/Z₁). A uniform per-depth offset is the *exact* pinhole result, with no perspective distortion, so per-star offsets `q·C` are physically correct [D]. |
| **Forward dolly** (Tz ≠ 0) | Radial flow from the focus of expansion: **v_r = r·Tz/Z**; zero at the FOE, fastest at the edges. Time to contact τ = Z/Tz = r/ṙ (Lee 1976 [V]). A point source's flux F ∝ 1/Z², so d(ln F)/dt = 2·Tz/Z = 2/τ: stars brighten as they approach; a resolved object's angular size grows ∝ 1/Z. | **Yes** (rate at a given radius ∝ 1/Z, plus looming and brightening), but it is the "warp drive / Windows starfield" signature, needs a 3D volume that recycles stars past the camera, and expanding flow is the classic vection stimulus. |
| **Pure rotation** (pan, tilt, roll; T = 0) | Depends only on (x, y) and Ω, not on Z. For small angles a pan is a uniform shift f·Ωy for **every** star. | **No.** Near and far stars move identically. |
| **Zoom** (change of f) | ẋ = x·ḟ/f: a uniform scale, independent of Z | **No.** A zoom is not a dolly (Hitchcock's dolly zoom shows the difference). |

Combined motions keep depth only in the translational part. Differences of flow between neighbouring points at
different depths cancel the rotational part, which is how differential motion isolates translation and depth edges
(Rieger & Lawton 1985 [V, abstract]).

### 1.3 What perception adds

- Motion parallax alone produces reliable, consistent, unambiguous relative depth in random-dot displays, whether the
  motion is produced by the observer's head movement or by the display (Rogers & Graham 1979 [V, abstract]). Gibson
  named the continuous gradient of image speeds with distance "motion perspective" and built optic-flow theory on it
  (Gibson 1950; Gibson, Olum & Rosenblatt 1955; history in Niehorster 2021 [V]).
- **Caveat for a passive viewer.** With the head and eyes still, the *sign* of depth from parallax (nearer or farther)
  needs an extra-retinal pursuit signal (Nawrot 2003 [V, via citing literature]); without it the sign can be ambiguous
  (Nadler et al. 2009, *Neuron*, PMC2735858 [V, as quoted in search results]). A web page is watched passively, so
  **other cues must agree on the order**. Three do, and our model makes them all agree:
  - lower contrast reads as farther (O'Shea, Blackburn & Ono 1994 [V]); on a dark sky, dimmer = lower contrast;
  - in transparent motion, slower surfaces are more often seen behind (Schütz 2011, *J. Vis.* [V, abstract]);
  - the surface that hides and reveals texture at an edge is in front (accretion and deletion, Kaplan 1969
    [V, via citing reviews]): stars fading behind the copy put the page in front of the sky.
- In the real world, motion perspective works in "action space" (up to about 30 m) and fades at vista distances,
  where occlusion, relative size and aerial perspective take over (Cutting & Vishton 1995 [V, via secondary
  summaries]). That is exactly why the real sky shows no parallax, and why our diorama moves the stars into "action
  space".

**Answer to Q1.** Lateral translation produces the strongest, cleanest depth; forward or backward translation
produces depth with looming but looks like a screensaver; rotation (pan, tilt, roll) and zoom produce none. For the
sky: translate only.

---

## 2. The real night sky, and the model we choose

### 2.1 What a real observer sees

| Effect | Rate | Visible? |
|---|---|---|
| Diurnal rotation about the celestial pole | 360° per conventional sidereal day 86164.0905 s [V, IERS/Paris Observatory constants]; Earth's nominal rate 7.292115×10⁻⁵ rad/s [V]. **15.041 arcsec/s = 0.251 arcmin/s** [D] | No. That is the speed of a wall clock's minute-hand tip (15 cm hand) seen from 3 m: 0.30 arcmin/s [D]. The second hand moves at 18 arcmin/s. |
| Annual stellar parallax | Largest: Proxima Centauri, **768.07 mas** (Gaia DR3) [V]: a yearly ellipse with a 0.77″ semi-major axis | No: about 80× below the eye's ~1′ resolution. Even New Horizons, 47 AU from the Sun in April 2020, saw Proxima shift by only 32.4″ and Wolf 359 by 15.7″ [V]. |
| Proper motion | Largest: Barnard's Star, **10.393″/yr** (Gaia DR3) [V]; 0.0012″ per hour [D] | No |
| Scintillation (twinkle) | Atmospheric; log-normal intensity statistics; millisecond time scales for small apertures (Dravins, Lindegren, Mezey & Young 1997 and companion papers [V, abstract and citing reviews]); stronger toward the horizon (more air); planets twinkle less because their disks average the turbulence [V, secondary] | Yes |

The existing twinkle model is physically grounded: log-normal (as Dravins et al. measured) and stronger toward the
bottom of the screen like airmass (`TWINKLE_HORIZON_GAIN`). Its 0.08 to 0.32 Hz rate is a deliberate calm
stylization; real twinkle is much faster [J].

**Honest conclusion.** From Earth the stars are at infinity: zero parallax, and the only real motion is a rotation
too slow to see. A spaceship would not help: after 7 billion km New Horizons saw the nearest star move half an
arcminute. "The screen has depth" is a conceit, and the user should hear it plainly (it can go in the PR description).

### 2.2 The model: a diorama (multiplane camera)

Disney's multiplane camera, first used on *The Old Mill* (1937, which won the Academy Award for animated short; the
camera team received a Scientific and Technical award), photographed layers of artwork moving at different speeds so
nearer layers appear to move faster [V, D23 / Lemelson-MIT]. Parallax-scrolling games use the same trick. Our version
replaces discrete glass plates with a volume of stars. Its laws:

- **L1. One camera, translation only.** No rotation, no zoom, no dolly (section 1: they add no depth or look wrong).
- **L2. One parallax law.** A star at nearness q = Z_ref/Z appears at `screen = world − q·C(t)`, where C is the camera
  position in CSS px for a star at q = 1. Scroll, drift and pointer all move C, never a layer directly.
- **L3. Depth from brightness (standard candles).** q ∝ 10^(−k·m). Identical lamps give k = 0.2 exactly (distance
  modulus m − M = 5·log₁₀(d / 10 pc)). We use k = 0.14, a depth "tone mapping" (section 3).
- **L4. Lateral motion does not change brightness or size.** A lateral move T changes the distance by about
  T²/(2Z), negligible, so alpha and sprite stay functions of magnitude only [D]. (A dolly would change them; we do not
  dolly.)
- **L5. Twinkle belongs to the air in front of the camera, not to depth.** Depth-independent, as now.
- **L6. The page is a pane in front of the diorama.** Scroll parallax p = Z_page/Z puts the near stars about 14 page
  depths behind the copy and the far ones about 50 (1/0.072 and 1/0.0205). During the drift the page stays put, like a
  cockpit window that moves with the camera; only the stars beyond it show parallax.

---

## 3. Layers, depths and the depth law

### 3.1 What the catalog holds [D]

From `MAGNITUDE` (slope 0.36, −0.5 to 6) and the layer bands:

| Layer | Band | Share of stars | Mean magnitude | Laptop 1512×982 | Phone 393×852 | 27″ 2560×1440 | Current parallax |
|---|---|---|---|---|---|---|---|
| near | −0.5 to 2.5 | 5.1% | 1.57 | 17 | 5 | 43 | 0.07 |
| mid | 2.5 to 4.5 | 23.5% | 3.76 | 80 | 24 | 199 | 0.04 |
| far | 4.5 to 6 | 71.5% | 5.40 | 244 | 72 | 606 | 0.02 |

About 2 stars on a laptop are brighter than magnitude 0.5, and about 7 brighter than 1.5.

### 3.2 What the current parallax values mean

Parallax ∝ 1/Z, so 0.07 / 0.04 / 0.02 put the layers at depths 1 : 1.75 : 3.5 [D]. Standard candles with these band
means would give 1 : 2.75 : 5.8 (p ratios 0.36 and 0.17) [D]. A least-squares fit of log p against band-mean magnitude
gives **k ≈ 0.14** (pairwise 0.11 and 0.18) [D]. So the reviewed values already *are* the inverse-square law,
compressed to about 70% of its depth range (k = 0.2·γ with γ ≈ 0.7).

Physics footnote [D]: for a homogeneous population of stars, the mean log-distance at apparent magnitude m is
0.2·m + constant whatever the luminosity function (each absolute-magnitude class contributes the same mix at every m),
so k = 0.2 is the true *mean* law. Real stars scatter widely around it because luminosities span many magnitudes. The
display already compresses brightness the same way: `STAR_ALPHA` maps a 6.5-magnitude (400:1) flux range onto 5:1 in
alpha, and perceived brightness of a point source grows only as about luminance^0.5 (Stevens' table [V, secondary]).
Brightness-depth inference is ordinal anyway (brighter = nearer); exact ratios do not matter perceptually [J].

**Recommendation: keep the endpoints, keep k ≈ 0.14** (call it depth tone mapping). Do not move to k = 0.2: faint
stars would drop to about 0.6 arcmin/s in the drift (invisible) and the brightest would move 2.6× faster than the
near-band mean, too fast to be calm [D].

### 3.3 Continuous depth (per star) instead of three sheets

Today each layer moves rigidly: three transparent sheets sliding at three speeds. Transparent dot fields moving at
different speeds segregate into separate surfaces in depth (Schütz 2011 [V]), which is the "three flat sheets" look
of the old CSS starfield. Giving every star its own nearness turns the sheets into a volume.

**It costs no random draw.** Depth can be a deterministic function of the magnitude each star already draws:

```
q(m) = min(Q_MAX, 10^(−K·(m − M_REF)))      K = 0.14, M_REF = 1.57 (near-band mean), Q_MAX = 1.6
```

| | q range in band | Band mean q | Scroll parallax 0.07·q (mean) | Today |
|---|---|---|---|---|
| near | 0.74 to 1.6 (capped above m ≈ 0.11) | 1.02 | 0.072 | 0.07 |
| mid | 0.39 to 0.74 | 0.50 | 0.035 | 0.04 |
| far | 0.24 to 0.39 | 0.29 | 0.0205 | 0.02 |

Brightest star: 0.112 of the scroll (cap); faintest: 0.017 [D]. The band means stay within 12% of the reviewed
values, the law is continuous across band edges (no speed inversion where near meets mid), and the depth range is
1.6/0.24 ≈ 6.7:1.

Cost and invariants:

- `cellStars` adds `q: nearness(m)` to each star: no extra draw from the `mulberry32` stream, so "every star consumes
  the same number of random draws" still holds, and **retuning the depth law never moves a star at rest** (scroll 0,
  camera 0). +8 bytes per cached star.
- `drawLayer` culls cells with the band's [q_min, q_max] (`[q(faintest), q(brightest)]`) instead of one parallax,
  which adds at most (q_max − q_min)·|C| / 256 cell rows (about one row on long pages), and does one multiply per star
  per axis.
- Optional jitter (a bright star sometimes farther than a faint one, as in the real sky) would need a separate seeded
  stream, e.g. `mulberry32(hashCell(cx, cy, SKY_SEED ^ DEPTH_SALT[layer]))`, drawn once per star in order, so the main
  stream stays untouched. **Not recommended**: it creates cue conflicts (bright but slow) for no visible gain [J].
- Per-layer constants remain a valid fallback for v1 if the team wants the smallest diff: `q_layer = parallax / 0.07`
  (1, 0.571, 0.286) in the same camera model.

### 3.4 A fourth, very near layer of "space dust" (bokeh motes)

A few faint, soft, out-of-focus motes moving fastest would anchor the foreground and stretch the nearest/farthest
speed ratio from about 3.5:1 (near-band mean to far-band mean) to about 8:1 (motes to far-band mean), a strong 3D
cue. Blur is itself a depth cue (Mather 1996; Held, Cooper, O'Brien & Banks 2010 [V]). But:

- **It cannot be physically consistent with calm speeds [D].** A camera focused at infinity blurs a point at nearness q
  by a circle ∝ q (the same 1/Z law as parallax). If stars up to q = 1.6 stay sharp (blur under about 0.3 px), motes
  blurred to σ ≈ 6 px would need q ≈ 30, moving about 30× faster than the near stars. The blur must be stylized
  ("macro bokeh").
- **Readability cost.** At a plausible q ≈ 2.4 the motes move about 7 px/s typical, about 9 arcmin/s on a laptop,
  10 px/s at peak: near the speed where peripheral motion starts to pull the eye while reading [D, J].
- If prototyped (phase 2, hero only): q ≈ 2.4, Gaussian σ 5 to 7 CSS px, peak alpha ≤ 0.04 (recheck the copy
  contrast budget), about 6 per CSS megapixel (about 9 on a laptop, none on narrow screens), `quietKeep` 0, no
  twinkle, its own seeded cells, scene level 0 outside the hero.

**Recommendation: not in v1.** Continuous depth already gives the bright stars the "near anchor" role at no cost.

---

## 4. The camera path: floating, rhythm-free, bounded

### 4.1 The physics of "floating", and the closed-form stand-in

A body floating in a fluid, nudged by gentle random forces and weakly tethered, follows a Langevin equation (a
Brownian oscillator): smooth, band-limited, wandering motion that never repeats [J]. Band-limited noise can be
represented as a sum of sinusoids with random phases (Rice 1944 [V, citation; representation from the paper's
standard treatment]). A few sinusoids at irrational frequency ratios give the same look deterministically, as a
**pure function of time**: no state to drift, exact at any frame rate, testable, and identical for every visitor
(seeded phases), matching the "reviewed sky" principle.

Two shapes were simulated over 2 hours [D]:

| Path | Speed range (× mean) | Stops? | Heading change | Max wander |
|---|---|---|---|---|
| Lissajous: 3 sinusoids per axis (ratios 1, φ, 1+√2, as `TWINKLE_HARMONICS`) | about 0 to 2.1× RMS; 7% of the time below 0.3× RMS | **Yes**: near-stops, then the heading flips | up to 12 to 18°/s while moving | 38 to 74 s × RMS speed |
| **Epicycles**: a main circle plus two smaller circles at −φ and 1+√2 times its frequency | **0.58 to 1.42×** (bounded both ways) | **Never** | mean 2.0°/s, max 4.3°/s (period 180 s) | 63.6 s × mean speed |

Perlin or value noise was rejected: gradient noise is zero at every integer lattice point (a hidden rhythm at the
lattice period) and it adds code for no gain [V, secondary; J].

**The epicycle path** (closed form, zero at τ = 0 so the visit starts on the reviewed composition):

```
C_drift(τ) = Σₖ Rₖ · ( cos(ωₖτ + φₖ) − cos φₖ ,  sin(ωₖτ + φₖ) − sin φₖ )
ω₁ = 2π / P,   ω₂ = −φ·ω₁ (counter-rotating),   ω₃ = (1 + √2)·ω₁,   φ = 1.618…
Rₖ = sₖ · v₀ / |ωₖ|,   s = (1, 0.3, 0.12)
speed |Ċ| ∈ [v₀·(1 − 0.3 − 0.12), v₀·(1 + 0.3 + 0.12)] = [0.58·v₀, 1.42·v₀]
```

The heading turns once per P on average; the epicycles modulate speed and turn rate at incommensurate beat periods
(P/2.618 ≈ 69 s and P/1.414 ≈ 127 s for P = 180 s), so the drift waxes and wanes irregularly and never repeats [D].

Ptolemy used epicycles to describe planets. It is a fitting nod in a night sky, and an easy analogy for the user.

### 4.2 How slow is calm, how fast is visible: thresholds

| Finding | Value | Source |
|---|---|---|
| Lower threshold of motion, central vision, with references | about 1 to 2 arcmin/s (Leibowitz and colleagues) | Harth et al. 2025, *Inventions* 10(3):33 [V, as summarized there] |
| Same study, 1-s exposures | nobody detects 0.2 arcmin/s; everybody detects about 47 arcmin/s | Harth et al. 2025 [V] |
| Displacement threshold | about 1.5′ in a structureless field, down to 0.3′ with reference rings; rises about 75% when luminance drops 3 log units | Legge & Campbell 1981 [V] |
| Differential (relative) motion threshold | below the minimum angle of resolution at every eccentricity tested; velocity discrimination about 6% | McKee & Nakayama 1984 [V] |
| Very slow motion | limited by spatial resolution; peripheral displacement thresholds limited by acuity below about 0.5°/s | Lappin, Tadin, Nyquist & Corn 2009 [V] |
| Ageing | older observers detect slow motion worse and need larger speed differences | Snowden & Kavanagh 2006 [V] |
| Attention | **motion onset** captures attention; ongoing motion does not | Abrams & Christ 2003 [V] |
| Attention | gradual changes go unnoticed without a disruption | Simons, Franconeri & Reimer 2000 [V] |
| Vection (illusory self-motion) | perceived self-rotation tracks full-field stimulus speed up to about 90 to 120°/s; the central 30° alone did not induce it. Our drift (about 0.07°/s) is three orders of magnitude slower [D] | Brandt, Dichgans & Koenig 1973 [V, abstract] |

Converting to CSS px. The CSS reference pixel is 0.0213° = 1.28 arcmin at 28 inches (CSS Values 4 [V]). Real devices
[D, from Apple's published pixel densities [V], OSHA's 50 to 100 cm monitor distance [V] and the measured 32.2 cm
phone web-browsing distance (Bababekova et al. 2011 [V])]:

| Device | arcmin per CSS px |
|---|---|
| MacBook Pro 14″ (254 ppi, 2×) at 50 / 60 cm | 1.38 / 1.15 |
| 24″ 1080p at 65 cm | 1.46 |
| 27″ 1440p (or 4K at 150%) at 70 cm | 1.15 |
| iPhone 15 (460 ppi, 3×) at 32 cm | 1.77 |
| Pixel-class Android at 32 cm | 1.66 |

So use **about 1.3′/px on desktop and about 1.8′/px on phones**: a phone's CSS px looks about 1.35× bigger.

**Design rule [J, from the table]:** the far band at about 1× threshold ("the mountains crawl": visible if you stare,
still if you don't), mid at about 2×, near at about 3 to 4×, the brightest few at most about 6 arcmin/s typical and
9 at peak. That stays well under drifting clouds overhead (about 17 arcmin/s for a 10 m/s wind at 2 km [D]) and well
under the old implementation's fastest layer (50 vh per 50 s ≈ 9.8 px/s ≈ 13 arcmin/s on a 982-px window [D]). Ease
the drift in and out (smoothstep over 3 s) so there is no onset event, and keep it continuous.

### 4.3 Recommended speeds [D]

Drift speed `v₀ = 3 CSS px/s` at q = 1 (hero, desktop). Narrow screens and the scenes scale the **drift clock rate**,
not the path radii, so crossing the 640-px breakpoint never makes the stars jump.

| Scene (rate) | Star | Speed range px/s (typical) | arcmin/s typical (max) | Moved in 10 s |
|---|---|---|---|---|
| **Desktop hero** (1.0) | brightest (q 1.6) | 2.8 to 6.8 (4.8) | 6.2 (8.9) | 48 px |
| | near mean (q 1.02) | 1.8 to 4.4 (3.1) | 4.0 (5.7) | 31 px |
| | mid mean (q 0.50) | 0.9 to 2.1 (1.5) | 2.0 (2.8) | 15 px |
| | far mean (q 0.29) | 0.5 to 1.3 (0.9) | 1.1 (1.6) | 9 px |
| | faintest (q 0.24) | 0.4 to 1.0 (0.7) | 0.9 (1.3) | 7 px |
| **Desktop reading** (0.35) | near mean | 0.6 to 1.5 (1.1) | 1.4 (2.0) | 11 px |
| | far mean | 0.2 to 0.4 (0.3) | 0.4 (0.6) | 3 px |
| **Desktop end** (0.8) | near mean | 1.4 to 3.5 (2.5) | 3.2 (4.5) | 25 px |
| **Narrow hero** (0.6) | brightest | 1.7 to 4.1 (2.9) | 5.1 (7.2) | 29 px |
| | near mean | 1.1 to 2.6 (1.8) | 3.3 (4.6) | 18 px |
| | far mean | 0.3 to 0.8 (0.5) | 0.9 (1.3) | 5 px |
| **Narrow reading** (0.21) | near mean | 0.4 to 0.9 (0.65) | 1.1 (1.6) | 6 px |

- Tuning knobs: `v₀` from 2.5 (subtler) to 4 px/s (more obvious; brightest about 12 arcmin/s at peak, the edge of
  "busy"). A smaller depth exponent K (for example 0.10) makes the far field move more at the cost of less depth
  contrast.
- Wander: at most 63.6·v₀·q px from the start over a full cycle (195 px for the near-band mean, 305 px for the
  brightest, 56 px for the far mean) [D]. A shorter period P = 150 s shrinks it about 17% and turns the heading 2.4°/s.
- Reading at 0.35 keeps the reading sky "alive if you look, still if you read": the near stars sit at the foveal
  threshold and the far ones are invisible. Rate 0 keeps today's fully still reading scene (R4 decides).
- Old implementation, physics view: its 1-px stars moved fastest and its 3-px stars slowest, an **inverted size-depth
  relation** (cue conflict), at constant velocity with an instant reversal every 50 s (a rhythm plus an
  infinite-acceleration event) [D from `git show 7c176fb^:src/css/Background.css`].

### 4.4 Frame rate and sub-pixel drawing (constraints for R3)

- Sampled motion looks continuous when sampling artifacts stay outside the "window of visibility"; the critical rate
  rises with velocity × spatial frequency (Watson, Ahumada & Farrell 1986 [V]). For hold-type displays a practical
  bound is a per-frame step at or below about 0.5 to 0.6 arcmin [J], so **fps_min ≈ 2 × v_max (arcmin/s)**. The
  fastest star at its peak (8.9′/s) moves 0.59′ per frame at the existing **15 fps twinkle cadence (fine)** and 0.89′
  at the 10 fps step-down (acceptable) [D]. Reading at 0.35× needs only 5 to 8 fps. For comparison, cinema's panning
  rule of thumb (no faster than one frame width per 7 s at 24 fps [V, RED]) allows steps about 25× larger.
- **Device-pixel snapping must go for moving stars** [D]. Today `Math.round(x * dpr)` snaps; at drift speeds
  (0.5 to 1.3 px/s) a far star would hop one device px every 0.4 to 1 s at 2× (0.65′ per hop) and every 0.8 to 2 s at
  1× (1.3′ per hop), above the 0.3′ displacement threshold: visible ticking. Draw at fractional positions
  (smoothing, or sub-pixel-phase sprites in the atlas; R3's choice).

---

## 5. Input coupling

### 5.1 Scroll momentum: a camera on a critically damped spring

Model: the camera's scroll coordinate s is a unit mass on a spring to the page's scroll position, critically damped
(c = 2√k, k = ω²):

```
s̈ = −ω²·(s − scrollY) − 2ω·ṡ          camera y (scroll part) = 0.07 · s
```

- **ω = 10 rad/s** [J]: in Motion's terms stiffness 100, damping 20, mass 1, `bounce: 0`, `visualDuration` ≈ 0.52 s
  (Motion maps ω = 2π / (1.2·visualDuration) [V, motion-dom 12.38.0 source]). 95% settled in 0.47 s, 99% in 0.66 s.
- While scrolling at 1000 page px/s the stars trail their target by 2V/ω: **14 px** for the near mean, 22 px for
  the brightest, 4 px for the far mean. When the page stops they glide that far over about half a second and settle
  **without overshoot** (proved for a ramp that stops: the error stays one-signed) [D].
- Why a spring rather than first-order smoothing: a first-order lag has a velocity kink at every discrete wheel
  notch or key press; the spring is C¹ smooth, adds "mass", and never overshoots [D].
- **Snap on jumps.** Home, End, find-in-page or a jump link can move scrollY by thousands of px in one message; a
  spring would sweep the near stars at up to 0.37·ω·Δ (about 1300 px/s for a 5000-px jump). Snap when |Δ| exceeds one
  viewport height [D, J].
- Initialize the spring at the restored scroll position (no glide on load or reload).
- Touch and trackpad scrolling already carry momentum; the spring adds about 0.2 s of lag (2/ω) on top [J].

### 5.2 Pointer lean (desktop only, optional)

- The camera leans toward the cursor: target = `reach × (pointer − center) / halfSize`, clamped to [−1, 1] per axis,
  so stars shift away from the cursor and nearer ones more [J]. Window-style head-coupled perspective would move them
  the other way; the *relative* motion between depths, which carries the depth, is identical either way [D]. Leaning
  keeps the absolute motion small and uses the same law as scrolling.
- **reach = 12 CSS px at q = 1** (brightest ±19, near ±12, mid ±6, far ±3.5 px). iOS motion-effect samples use ±10
  points (`UIInterpolatingMotionEffect` minimum/maximum relative values) [V].
- Spring **ω = 4 rad/s** (Motion `visualDuration` ≈ 1.3 s, 95% in 1.2 s): a languid follow, critically damped [J].
- Only for `(hover: hover) and (pointer: fine)`, full motion, hero scene; target 0 when the pointer leaves the window;
  pointer moves should count as input for the idle timer.
- Why it is worth it: self-produced parallax is the strongest form (observer-produced parallax, Rogers & Graham 1979
  [V]); in "fish tank VR", head-coupled perspective gave a stronger 3D impression than stereo (Ware, Arthur & Booth
  1993 [V]). A pointer is a weak proxy for the head, but it is self-produced and predictable [J].

### 5.3 Device orientation on mobile: recommend against

- iOS requires `DeviceOrientationEvent.requestPermission()`, called from a user gesture (transient activation), on
  HTTPS; the W3C spec added the method and `[SecureContext]` gating after privacy concerns, and Chromium plans to move
  motion sensors to "Ask" by default [V: MDN, W3C announcement, Chromium intent-to-ship].
- Apple's own Reduce Motion setting disables the tilt parallax of the wallpaper and icons [V], which suggests Apple
  treats tilt parallax as a motion-sensitivity trigger [J].
- A permission prompt for a decoration is poor UX; 60 Hz sensor events wake the main thread and cost battery [J].
  Phones get the ambient drift instead.

### 5.4 Frame-rate-independent integrators

The worker draws on a 15 fps timer (10 fps after the step-down) and on animation frames at 60 to 144 Hz, so dt varies
about 14× in normal use, and a stall or a hidden tab can make it arbitrary. Only exact solutions are safe:

```
Exponential approach (first order, time constant τ):
  x ← target + (x − target)·e^(−dt/τ)             i.e. α = 1 − e^(−dt/τ)

Critically damped spring (exact for a target held constant over the step; e = x − target, ω = √k):
  c  = v + ω·e
  x ← target + (e + c·dt)·e^(−ω·dt)
  v ← (v − ω·c·dt)·e^(−ω·dt)
  (from x(t) − target = (e₀ + (v₀ + ω·e₀)·t)·e^(−ωt))
```

Motion resolves critically damped springs with this closed form (`resolveSpring` in motion-dom's `spring.mjs`) [V].
Both updates compose exactly (two half steps equal one step), so the result does not depend on the frame rate.

Why explicit Euler is wrong here [D; stability region per LeVeque [V]]:

- Forward Euler is stable only for |1 + λ·dt| ≤ 1. The spring's eigenvalue is −ω (double), so it needs ω·dt ≤ 2.
  With ω = 10, a 200 ms frame is already the edge.
- At 15 fps (ω·dt = 0.67), after 4 frames the exact spring has covered 74.5% of a step; explicit Euler reports 88.9%,
  semi-implicit Euler 78.4%. At 10 fps (ω·dt = 1) explicit Euler degenerates (0, then 100) and semi-implicit Euler
  diverges (100, 200, −400).
- One 250 ms stall in a 60 Hz run makes explicit Euler overshoot the target by 27 to 33%, on a spring that must never
  overshoot; repeated 250 ms steps diverge (0, 625, −1250, 2969, …).
- A fixed lerp per frame (`x += (target − x)·0.1`) reaches 72% in 0.1 s at 120 Hz but 47% at 60 Hz.

dt policy [J]: springs take the true elapsed time (the exact form is stable for any dt). The drift clock advances by
at most 0.1 s per frame and stops while the tab is hidden, so a stall or a return never jumps the sky.

---

## 6. Depth cues beyond parallax

- **Inverse-square law (brightness).** F = L / 4πd², m − M = 5·log₁₀(d / 10 pc). Already encoded, because layers are
  magnitude bands and the depth law reads q from m. Contrast is an effective depth cue on its own: lower contrast reads
  as farther (O'Shea et al. 1994 [V]); what counts is contrast with the background, not absolute brightness (Farnè
  1977 [V]). On a uniform navy sky, brighter means higher contrast.
- **Size.** Stars are unresolved; their apparent size is the point-spread function, which grows with brightness
  (`STAR_SHAPES`). Consistent with depth for free [J].
- **Aerial perspective.** On Earth, airlight makes distant objects lower in contrast and bluer. Between stars there is
  no air; the physical analogue is interstellar extinction, which makes distant stars **dimmer and redder** (reddening,
  R_V ≈ 3.1 [V]). Perception pulls the other way: on dark backgrounds most observers see red as nearer than blue
  (chromostereopsis; about 80/20 in Kitaoka's surveys [V, secondary]). The two color cues conflict, so **do not color
  code depth**; dimness alone does the job [J]. Faint stars already render near-colorless.
- **Blur.** A real depth cue (Mather 1996; Held et al. 2010 [V]); relevant only to the optional dust layer (3.4).
- **Occlusion** is the strongest depth cue at every distance (Cutting & Vishton 1995 [V, secondary]). The quiet
  zones already make the copy softly occlude the sky. Once stars drift, they fade out and back in at the copy's edges
  (accretion and deletion, Kaplan 1969), which places the page in front of the sky: a free cue [J].
- **Twinkle.** Atmospheric, independent of a star's distance; extended sources (planets) twinkle less [V]. Do not tie
  twinkle to depth. The current per-layer twinkle share is perceptual (absolute modulation σ·L is larger for bright
  stars) and can stay [J].

Ranking by perceived-depth payoff per unit of complexity [J]:

| # | Cue | Payoff | Complexity | Status |
|---|---|---|---|---|
| 1 | Ambient drift under the same 1/Z law as scroll | very high | low to medium | new, core |
| 2 | Brightness-depth consistency, continuous q(m) | high (fixes the depth order for a passive viewer) | very low (no draw) | partly present; make continuous |
| 3 | Soft occlusion and accretion/deletion behind the copy | medium | zero (activated by motion) | present |
| 4 | Size-depth consistency | medium | zero | present |
| 5 | Pointer lean (self-produced parallax) | high on desktop | medium (events to worker) | optional |
| 6 | Scroll glide (inertia) | medium (physicality more than depth) | low | new |
| 7 | Near dust / bokeh layer | medium | medium, with readability risk | phase 2 at most |
| 8 | Dimmer far stars (contrast, aerial analogue) | low increment | zero | present |
| 9 | Color by depth | very low; physics and perception conflict | low | skip |
| 10 | Depth-dependent twinkle | none (unphysical) | low | skip |
| 11 | Forward dolly / looming | medium, but screensaver look and vection | high (3D recycling) | skip |
| 12 | Sky rotation | none; adds a cue conflict | low | skip (section 7) |

---

## 7. Optional slow sky rotation: recommend against

- Rotation adds no depth (section 1).
- The physical rate (0.25′/s) is invisible; making it visible needs 10 to 20× acceleration [D].
- About an off-screen pole at distance D, speed ∝ distance from the pole, so the field gets a speed gradient across
  the screen of about ±H/2D: ±16% for a pole 3000 px from the middle of a 982-px window, ±25% at 2000 px [D]. The
  visual system reads speed gradients as depth, so this would invent a depth gradient tied to screen position, not to
  brightness, contradicting L3, and it bends the paths.
- Combined with the translation, it would also shrink the speed contrast between near and far stars (the rotation
  adds the same velocity to all of them) [D].

If a nod to the turning sky is wanted, explain it in copy rather than motion [J].

---

## 8. Proposed camera model

### 8.1 Equations

```
Per star (fixed):   q = min(Q_MAX, 10^(−K·(m − M_REF)))                      nearness, from magnitude
Per frame:          C(t) = C_scroll + C_drift + C_lean                         CSS px at q = 1
                    screen(star) = world(star) − q·C(t)                        one law for every cause

C_scroll = (0, P_REF · s)              s: critically damped spring (ω_s) tracking scrollY; snap on jumps
C_drift  = E(τ) − E(0)                 epicycles (section 4.1) at mean speed v₀
τ̇        = rate(t) = scene.drift · idleLevel · reveal ease · (narrow ? 0.6 : 1) · (motion === 'full' ? 1 : 0)
                                       advanced by at most 0.1 s per frame, frozen while hidden
C_lean   = reach · (ℓx, ℓy)            ℓ: critically damped springs (ω_p) toward the normalized pointer offset

Alpha and sprite: unchanged (functions of magnitude only). Twinkle: unchanged (depth-independent).
Reduced motion: C frozen (no drift, no lean, no glide), as parallaxScroll is frozen today.
```

### 8.2 Constants

| Constant | Value | Units | Why |
|---|---|---|---|
| `CAMERA.scrollParallax` (P_REF) | 0.07 | share of scroll at q = 1 | keeps the reviewed near-layer parallax |
| `CAMERA.scrollOmega` | 10 | rad/s | 0.5 s glide, no overshoot (Motion visualDuration ≈ 0.52 s) |
| `CAMERA.snapViewports` | 1 | viewport heights per message | jumps snap instead of sweeping |
| `DEPTH.reference` (M_REF) | 1.57 | magnitude | near-band mean; better computed from the config |
| `DEPTH.compression` (K) | 0.14 | 1/mag | fit to the reviewed values; 70% of the inverse-square depth range |
| `DEPTH.maxNearness` (Q_MAX) | 1.6 | | the two or so brightest stars don't race |
| `DRIFT.speed` (v₀) | 3 (range 2.5 to 4) | CSS px/s at q = 1 | near ≈ 4′/s, far ≈ 1′/s on desktop |
| `DRIFT.period` (P) | 180 | s | heading turns about 2°/s |
| `DRIFT.epicycles` | ratios 1, −1.618, 2.414; shares 1, 0.3, 0.12; phases 0.9, 2.4, 4.7 | | speed within 0.58 to 1.42 × v₀, never repeats |
| `DRIFT.narrowRate` | 0.6 | | phones' CSS px look about 1.35× bigger |
| `DRIFT.ease` | 3 | s | no motion-onset event after the reveal |
| `DRIFT.maxStep` | 0.1 | s | no jump after a stall or a hidden tab |
| `SCENE.*.drift` | hero 1, reading 0.35 (or 0), end 0.8 | | reading stays nearly still |
| `POINTER.reach` | 12 | CSS px at q = 1 | iOS-like subtlety |
| `POINTER.omega` | 4 | rad/s | about 1.3 s lean |
| Frame rate | hero 15 fps (existing), reading at least 6 fps if it drifts | | per-frame step ≤ 0.6′ |

### 8.3 TypeScript sketch (codebase style; a plan, not a patch)

Config additions in `src/lib/sky/config.ts`:

```ts
/**
 * Depth: every star hangs at its own distance, read from its magnitude as if stars were identical lamps, so brighter
 * means nearer. Nearness q = Z_ref / Z is the share of the camera's motion a star shows on screen: 1 at magnitude
 * `reference` (the near band's mean). Identical lamps would give q = 10^(-0.2 (m - reference)), the inverse-square
 * law; `compression` 0.14 keeps 70% of that depth range, as STAR_ALPHA keeps a 400:1 flux range as 5:1, so the
 * faintest stars still move (q 0.24) and the brightest never race (at most `maxNearness`). Band means come out at
 * 0.072, 0.035 and 0.021 of the scroll, the reviewed parallax. Retuning it never moves a star at rest.
 */
export const DEPTH = { reference: 1.57, compression: 0.14, maxNearness: 1.6 } as const

/**
 * The camera the sky is seen through, in CSS px for a star at nearness 1. Scrolling moves it `scrollParallax` of the
 * scroll through a critically damped spring of `scrollOmega` rad/s, so the stars glide to rest about half a second
 * after the page stops and never overshoot (Motion: visualDuration 0.52 s, bounce 0). A jump of more than
 * `snapViewports` viewport heights in one message (Home, End, find in page) snaps instead of sweeping.
 */
export const CAMERA = { scrollParallax: 0.07, scrollOmega: 10, snapViewports: 1 } as const

/**
 * The floating drift, in CSS px for a star at nearness 1: epicycles, a main circle turning once every `period` seconds
 * with smaller circles riding on it at irrational frequency ratios (negative turns the other way), so the path never
 * repeats, the heading turns about 2° a second and the speed stays within `speed` × (1 ± 0.42): always moving, never
 * racing. On a laptop that is about 4′/s for the near stars and 1′/s for the faint ones, three times and once the
 * slowest motion people notice. Narrow screens run the drift clock at `narrowRate` (their CSS px look about 1.35×
 * bigger). The drift eases in over `ease` seconds after the reveal and out with the idle fade; `maxStep` caps one
 * frame's clock advance, so a stalled frame or a returning tab never jumps the sky.
 */
export const DRIFT = {
	speed: 3,
	period: 180,
	epicycles: [
		{ ratio: 1, share: 1, phase: 0.9 },
		{ ratio: -1.618, share: 0.3, phase: 2.4 },
		{ ratio: 2.414, share: 0.12, phase: 4.7 },
	],
	narrowRate: 0.6,
	ease: 3,
	maxStep: 0.1,
} as const

/**
 * Leaning toward the pointer (fine pointers with hover, hero only): the camera moves up to `reach` CSS px (at
 * nearness 1) toward a cursor at the viewport's edge, through critically damped springs of `omega` rad/s (about
 * 1.3 s), so the stars slide away from it, the bright ones farthest.
 */
export const POINTER = { reach: 12, omega: 4 } as const

// SCENE.hero / reading / end each gain `drift` (1, 0.35, 0.8), mixed by sceneAt like `twinkle`.
```

New pure module `src/lib/sky/camera.ts` (imports only its own files, so it may ship in the worker chunk):

```ts
import { CAMERA, DEPTH, DRIFT, LAYERS, type SkyLayer } from './config'

/** A camera position or screen offset in CSS px. */
export interface Vec {
	x: number
	y: number
}

/** One axis of a critically damped spring: position and velocity (per second). */
export interface Spring {
	x: number
	v: number
}

/** Nearness q = Z_ref / Z of a star of magnitude m: its share of the camera's motion (see DEPTH). */
export function nearness(m: number): number {
	return Math.min(DEPTH.maxNearness, 10 ** (-DEPTH.compression * (m - DEPTH.reference)))
}

/** Nearness range [faintest, brightest] of a layer's band, for culling its cells. */
export function layerNearness(layer: SkyLayer): readonly [number, number] {
	const [brightest, faintest] = LAYERS[layer].magnitude
	return [nearness(faintest), nearness(brightest)]
}

/** How far the floating camera has drifted at drift-clock time `clock` (s), CSS px at nearness 1; zero at 0. */
export function driftAt(clock: number): Vec {
	const main = (2 * Math.PI) / DRIFT.period
	let x = 0
	let y = 0
	for (const { ratio, share, phase } of DRIFT.epicycles) {
		const w = main * ratio
		const radius = (share * DRIFT.speed) / Math.abs(w)
		x += radius * (Math.cos(w * clock + phase) - Math.cos(phase))
		y += radius * (Math.sin(w * clock + phase) - Math.sin(phase))
	}
	return { x, y }
}

/**
 * Moves a critically damped spring toward `target` over `dt` seconds with the exact solution
 * x(t) = target + (e + (v + ωe)t)e^(-ωt): the same curve at any frame time (a 15 fps timer, a 120 Hz display, a frame
 * after a stall), never overshooting. motion-dom resolves critically damped springs with the same closed form.
 */
export function springStep(spring: Spring, target: number, omega: number, dt: number): Spring {
	const error = spring.x - target
	const slope = spring.v + omega * error
	const decay = Math.exp(-omega * dt)
	return { x: target + (error + slope * dt) * decay, v: (spring.v - omega * slope * dt) * decay }
}

/** Exponential approach to `target` with time constant `tau` (s), exact at any frame time (α = 1 - e^(-dt/τ)). */
export function approach(value: number, target: number, tau: number, dt: number): number {
	return target + (value - target) * Math.exp(-dt / tau)
}

/** The camera, CSS px at nearness 1: the smoothed scroll, the drift and the pointer lean, added. */
export function cameraAt(scroll: number, drift: Vec, lean: Vec): Vec {
	return { x: drift.x + lean.x, y: CAMERA.scrollParallax * scroll + drift.y + lean.y }
}
```

How the other files would use it (sketch):

```ts
// catalog.ts, in cellStars: depth comes from the magnitude already drawn (no new random draw)
stars.push({ x, y, alpha: magnitudeAlpha(m), q: nearness(m) /* … */ })

// renderSky.ts, in drawLayer: SkyFrame carries `camera: Vec` instead of `parallaxScroll`
const [qFar, qNear] = layerNearness(layer)
const { x: camX, y: camY } = frame.camera
const x0 = Math.floor((Math.min(camX * qFar, camX * qNear) - EDGE) / CELL_SIZE)
const x1 = Math.floor((Math.max(camX * qFar, camX * qNear) + frame.width + EDGE) / CELL_SIZE)
const y0 = Math.floor((Math.min(camY * qFar, camY * qNear) - EDGE) / CELL_SIZE)
const y1 = Math.floor((Math.max(camY * qFar, camY * qNear) + frame.height + EDGE) / CELL_SIZE)
// … per star, inline (no per-star object allocation):
const x = star.x - camX * star.q
const y = star.y - camY * star.q
// moving stars draw at fractional positions (R3: smoothing or sub-pixel-phase sprites)

// sky.worker.ts: camera state advanced once per drawn frame
let scrollSpring: Spring = { x: 0, v: 0 } // set to { x: scrollY, v: 0 } on init: no glide on load
let leanX: Spring = { x: 0, v: 0 }
let leanY: Spring = { x: 0, v: 0 }
let leanTarget: Vec = { x: 0, y: 0 } // from a new 'lean' message, normalized to [-1, 1]
let driftClock = 0
let cameraUpdatedAt: number | null = null // null after the tab was hidden: the next frame starts from dt 0

/** Advances the camera to `now` (ms): springs by the true elapsed time, the drift clock by at most DRIFT.maxStep. */
function updateCamera(now: number): Vec {
	const elapsed = cameraUpdatedAt === null ? 0 : Math.max(0, (now - cameraUpdatedAt) / 1000)
	cameraUpdatedAt = now
	scrollSpring =
		Math.abs(parallaxScroll - scrollSpring.x) > height * CAMERA.snapViewports
			? { x: parallaxScroll, v: 0 }
			: springStep(scrollSpring, parallaxScroll, CAMERA.scrollOmega, elapsed)
	leanX = springStep(leanX, leanTarget.x * POINTER.reach, POINTER.omega, elapsed)
	leanY = springStep(leanY, leanTarget.y * POINTER.reach, POINTER.omega, elapsed)
	driftClock += driftRate(now) * Math.min(elapsed, DRIFT.maxStep)
	return cameraAt(scrollSpring.x, driftAt(driftClock), { x: leanX.x, y: leanY.x })
}

/** Drift clock rate: scene level × idle fade × reveal ease × narrow-screen rate; 0 unless motion is full. */
function driftRate(now: number): number {
	if (motion !== 'full' || revealAt === null) return 0
	const narrow = width <= NARROW_MAX_WIDTH ? DRIFT.narrowRate : 1
	return sceneAt(scrollY, height, documentHeight).drift * idleTwinkle(now) * smoothstep(0, DRIFT.ease, now / 1000 - revealAt) * narrow
}
```

Notes for R3: `frameMode` must keep drawing while a spring is still settling (glide and lean), not only for
`FRAME.scrollSettleMs`; the drift itself fits the existing 15 fps twinkle cadence in the hero; reading needs a slow
cadence only if its drift level is above 0. `idleTwinkle` doubles as the drift's idle fade.

Unit-test candidates: `springStep` composes exactly (two half steps equal one step) and never overshoots from rest;
`driftAt(0)` is zero; sampled speed stays within 0.58 to 1.42 × `DRIFT.speed`; `nearness` is monotone and capped.

Checked [D]: `camera.ts` and the config block above type-check with the repo's TypeScript under `--strict
--noUncheckedIndexedAccess`, and a scratch run confirms all four properties (speed range 0.580 to 1.420; layer q ranges
far 0.240 to 0.389, mid 0.389 to 0.741, near 0.741 to 1.600). Files:
`/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/r1calc/tscheck/`.

---

## 9. Constraints for the other agents and the concurrent session

- **R2 (meteors, other bodies).** Meteors stay in screen space: during a normal flight and wake (about 1.8 s) the
  near stars drift about 5 to 9 px, and about 12 to 20 px over a fireball with its 2.4-s train (about 4 to 5 s), small
  against 160 to 640-px paths, so the veil math is untouched [D]. Long-lived bodies (a comet,
  a satellite, a planet) should declare a nearness and move with `−q·C`, or be explicitly screen-fixed, and pass the
  veil and quiet checks at their *drawn* position each frame. Their own apparent speeds should respect the same scale:
  the near stars drift at about 4′/s, while a real low-orbit satellite crosses at up to about 1°/s (60′/s), 15× faster,
  so it would dominate attention. Real comets show no visible motion in minutes.
- **R3 (rendering and scheduling).** Sub-pixel positions for moving stars (snapping ticks visibly); culling by
  `[q_min, q_max]·C` on both axes; exact integrators only; springs on true dt, drift clock on clamped dt and frozen
  while hidden; draw while springs settle; hero at the existing 15 fps (10 fps acceptable), reading at 5 to 8 fps if
  it drifts; pointer messages coalesced per animation frame and sent only when they change; pointer moves count as
  input for idle.
- **R4 (motion design).** Speed table in 4.3 with a tuning range; reading drift 0.35 or 0; epicycle direction and
  starting heading (phases) to review; pointer reach and whether lean stays hero-only; the WCAG 2.2.2 decision (risks);
  the old implementation's inverted size-speed relation and 50-s ping-pong explain much of why it felt bad.
- **Concurrent veil session.** The camera never moves quiet rects or meteor paths, and quiet factors are already
  evaluated per star per frame, so drifting stars fade smoothly through the feather (a near star at 3 px/s needs
  about 24 s to cross the 72-px padding plus feather). The overlap is in files (`scene.ts`, `sky.worker.ts`), not in
  logic: coordinate merges.

---

## Key recommendations

- Adopt **one camera with translation only** and **one law**: every star appears at `world − q·C(t)`; scroll, drift
  and pointer all move C. No rotation, zoom or dolly.
- **Depth from brightness**: q = min(1.6, 10^(−0.14·(m − 1.57))), a deterministic function of the magnitude already
  drawn (no new random draw, resting sky unchanged). This keeps the reviewed scroll parallax within 12%
  (0.072/0.035/0.021) and turns three rigid sheets into a volume. Keep k = 0.14 (inverse-square law compressed to
  70%); do not use k = 0.2.
- **Ambient drift = epicycles**: mean speed 3 CSS px/s at q = 1 (desktop hero), period 180 s, shares 1/0.3/0.12 at
  frequency ratios 1, −φ, 1+√2. Speed stays within 0.58 to 1.42×, the heading turns about 2°/s, it never stops,
  races or repeats, and it is a pure function of a drift clock.
- **Speeds**: near ≈ 4′/s, mid ≈ 2′/s, far ≈ 1′/s on desktop (3.1, 1.5, 0.9 px/s); narrow screens run the clock at
  0.6; reading at 0.35 (or 0); end at 0.8. Ease in over 3 s after the reveal and out with the idle fade.
- **Scroll glide**: critically damped spring, ω = 10 rad/s (Motion visualDuration ≈ 0.52 s, bounce 0); snap on jumps
  over one viewport; initialize at the restored scroll.
- **Pointer lean** (desktop, fine pointer, hero, full motion): reach 12 px at q = 1, ω = 4 rad/s. **No device
  orientation** on mobile.
- **Exact integrators only** (closed-form spring and exponential); never Euler or fixed per-frame lerps. Clamp and
  freeze only the drift clock.
- **Rendering constraints** (R3): sub-pixel star positions while moving; the 15 fps hero cadence is enough.
- **Skip** depth-coded color, depth-dependent twinkle, sky rotation and forward dolly. Treat the bokeh dust layer as a
  phase-2 experiment at most.
- Tell the user plainly that real stars show no parallax; the depth is a multiplane-camera conceit with consistent
  physics inside it.

## Risks and open questions

- **WCAG 2.2.2 Pause, Stop, Hide (Level A).** Motion that starts automatically, lasts more than 5 s and runs beside
  other content needs a way to pause, stop or hide it unless essential; the Understanding text has no decorative
  exemption [V]. A permanent drift (and arguably today's 90-s twinkle) falls under it on a conservative reading.
  Options: a visible "pause sky" control, or a documented judgment that the decorative sky is not "information".
  **Needs the user's or R4's decision.**
- **WCAG 2.3.3 (AAA).** The Understanding document names parallax scrolling as a vestibular trigger [V]. Glide and
  lean add interaction-driven motion: keep both off under `prefers-reduced-motion` (as all sky motion is today) and
  keep the amplitudes small.
- **Thresholds are lab numbers** for high-contrast targets. Faint stars on navy are low contrast, and older eyes need
  more [V]; tune `DRIFT.speed` by eye on a laptop, a phone and a 1× external monitor, ideally with an older viewer.
- **Composition wander.** Bright stars can move up to about 195 px (q = 1) or 305 px (q = 1.6) from the reviewed
  frame over a full cycle; the reviewed sky holds only at t = 0. Quiet zones keep the contrast guarantees; a 150-s
  period shrinks the wander about 17%.
- **Continuous depth changes the reading composition**: the brightest stars follow up to 11% of the scroll instead of
  7%. Re-review the reading scene.
- **Idle sleep.** After 90 s without input the drift stops with the twinkle; a visitor watching the hero may read
  that as "it stopped". Count pointer movement as input, or lengthen the hero's idle window (R3/R4).
- **Reading drift costs frames** (today the reading scene sleeps); rate 0 is the fallback.
- **Spring lag** of up to about 22 px for the brightest stars during fast scrolls may read as rubber-banding; ω = 12
  tightens it.
- **Sub-pixel drawing** may change the peak brightness of tiny sprites as they cross pixel boundaries (most visible at
  1× DPR); R3 should check it.
- **Sources.** Direct fetches were blocked, so some claims rest on abstracts or secondary summaries (marked). The
  often-quoted Aubert (1886) values (about 1 to 2′/s with a reference, 10 to 20′/s without) were not verified and are
  not used.
- **Open:** v₀ 3 or 4 px/s? Reading drift 0.35 or 0? Lean hero-only or everywhere? Epicycle direction and starting
  heading? Dust layer in phase 2? The WCAG 2.2.2 mechanism?

---

## Sources

Vision science and perception

- Rogers, B. & Graham, M. (1979). Motion parallax as an independent cue for depth perception. *Perception* 8(2):125–134. https://doi.org/10.1068/p080125
- Longuet-Higgins, H. C. & Prazdny, K. (1980). The interpretation of a moving retinal image. *Proc. R. Soc. Lond. B* 208:385–397. https://doi.org/10.1098/rspb.1980.0057
- Gibson, J. J. (1950). *The Perception of the Visual World*. Houghton Mifflin. Gibson, J. J., Olum, P. & Rosenblatt, F. (1955). Parallax and perspective during aircraft landings. *Am. J. Psychol.* 68:372–385. History: Niehorster, D. C. (2021). Optic flow: a history. *i-Perception*. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8652193/
- Rieger, J. H. & Lawton, D. T. (1985). Processing differential image motion. *JOSA A* 2(2):354. https://doi.org/10.1364/JOSAA.2.000354
- Nawrot, M. (2003). Eye movements provide the extra-retinal signal required for the perception of depth from motion parallax. *Vision Res.* 43:1553–1562. https://ndsu.edu/centers/cvcn/labs/nawrot/pdfs/Nawrot2003b.pdf ; depth-sign ambiguity without extra-retinal signals: https://pmc.ncbi.nlm.nih.gov/articles/PMC2735858
- Schütz, A. C. (2011). Motion transparency: depth ordering and smooth pursuit eye movements. *J. Vis.* https://jov.arvojournals.org/article.aspx?articleid=2121206
- Cutting, J. E. & Vishton, P. M. (1995). Perceiving layout and knowing distances. In Epstein & Rogers (eds.), *Perception of Space and Motion*, Academic Press, 69–117. Copy: http://wexler.free.fr/library/files/cutting%20(0)%20perceiving%20layout%20and%20knowing%20distances.%20the%20integration,%20relative%20potency,%20and%20contextual%20use%20of%20different%20information%20about%20depth.pdf
- O'Shea, R. P., Blackburn, S. G. & Ono, H. (1994). Contrast as a depth cue. *Vision Res.* 34(12):1595–1604. https://researchportal.murdoch.edu.au/esploro/outputs/journalArticle/Contrast-as-a-depth-cue/991005543080007891
- Farnè, M. (1977). Brightness as an indicator to distance. *Perception* 6:287–293. https://journals.sagepub.com/doi/10.1068/p060287
- Kaplan, G. A. (1969). Kinetic disruption of optical texture: the perception of depth at an edge. *Perception & Psychophysics* 6:193–198 (cited via reviews, e.g. https://kellmanlab.psych.ucla.edu/files/cunningham_shipley_kellman_1998_pp.pdf)
- Mather, G. (1996). Image blur as a pictorial depth cue. *Proc. R. Soc. B* 263:169–172. https://repository.lincoln.ac.uk/articles/journal_contribution/Image_blur_as_a_pictorial_depth_cue/24339169
- Held, R. T., Cooper, E. A., O'Brien, J. F. & Banks, M. S. (2010). Using blur to affect perceived distance and size. *ACM TOG* 29(2):19. https://doi.org/10.1145/1731047.1731057
- Ware, C., Arthur, K. & Booth, K. S. (1993). Fish tank virtual reality. *CHI '93*, 37–42. https://dx.doi.org/10.1145/169059.169066
- Lee, D. N. (1976). A theory of visual control of braking based on information about time-to-collision. *Perception* 5:437–459. https://journals.sagepub.com/doi/10.1068/p050437
- Legge, G. E. & Campbell, F. W. (1981). Displacement detection in human vision. *Vision Res.* 21:205–213. https://legge.psych.umn.edu/sites/legge.psych.umn.edu/files/files/media/legge81_displacement_detection_in_human_vision.pdf
- McKee, S. P. & Nakayama, K. (1984). The detection of motion in the peripheral visual field. *Vision Res.* 24(1):25–32. https://pubmed.ncbi.nlm.nih.gov/6695503/
- Lappin, J. S., Tadin, D., Nyquist, J. B. & Corn, A. L. (2009). Spatial and temporal limits of motion perception across variations in speed, eccentricity, and low vision. *J. Vis.* 9(1). https://cdn.vanderbilt.edu/t2-my/my-prd/wp-content/uploads/sites/762/2014/08/Lappin2009JoV.9130.pdf
- Harth et al. (2025). A novel characterization of the lower threshold of motion. *Inventions* 10(3):33. https://doi.org/10.3390/inventions10030033
- Snowden, R. J. & Kavanagh, E. (2006). Motion perception in the ageing visual system. *Perception* 35(1):9–24. https://pubmed.ncbi.nlm.nih.gov/16491704/
- Abrams, R. A. & Christ, S. E. (2003). Motion onset captures attention. *Psychol. Sci.* 14(5):427–432. https://pubmed.ncbi.nlm.nih.gov/12930472/
- Simons, D. J., Franconeri, S. L. & Reimer, R. L. (2000). Change blindness in the absence of a visual disruption. *Perception* 29:1143–1154. https://visualcognition.psych.northwestern.edu/publications/Simons_etal_gradual.pdf
- Watson, A. B., Ahumada, A. J. & Farrell, J. E. (1986). Window of visibility. *JOSA A* 3(3):300–307. https://ntrs.nasa.gov/citations/19860047713 ; NASA TP 2211: https://ntrs.nasa.gov/api/citations/19830025267/downloads/19830025267.pdf
- Brandt, T., Dichgans, J. & Koenig, E. (1973). Differential effects of central versus peripheral vision on egocentric and exocentric motion perception. *Exp. Brain Res.* 16:476–491. https://link.springer.com/doi/10.1007/BF00234474
- Stevens' brightness exponents (point source 0.5, 5° target 0.33), table: https://www.cis.rit.edu/people/faculty/montag/vandplite/pages/chap_6/ch6p10.html
- Chromostereopsis: Kitaoka (2015) reference entry https://www.psy.ritsumei.ac.jp/akitaoka/Kitaoka2015_ReferenceWorkEntry_Chromostereopsis.pdf ; Thompson, May & Stone (1993) https://www-users.york.ac.uk/~pt2/ThompsonMayStone1993.pdf

Astronomy

- IERS / Paris Observatory useful constants (sidereal day 86164.0905 s; ω = 7.292115×10⁻⁵ rad/s): https://hpiers.obspm.fr/eop-pc/models/constants.html
- Proxima Centauri parallax 768.07 mas (Gaia-based 10 pc sample): https://arxiv.org/pdf/2104.14972
- New Horizons parallax demonstration (2020; published 2025): https://arxiv.org/abs/2506.21666v1 ; NASA release via EarthSky: https://earthsky.org/space/new-horizons-parallax-for-proxima-centauri/
- Barnard's Star proper motion 10.393″/yr (ESA Gaia image of the week): https://www.cosmos.esa.int/web/gaia/iow_20250513 ; Hipparcos top 20: https://www.cosmos.esa.int/web/hipparcos/high-proper-motion
- Dravins, D., Lindegren, L., Mezey, E. & Young, A. T. (1997). Atmospheric intensity scintillation of stars I. *PASP* 109:173–207. https://doi.org/10.1086/133872
- Why planets twinkle less (popular summary): https://earthsky.org/space/why-dont-planets-twinkle-as-stars-do/
- Interstellar extinction and R_V ≈ 3.1 (Cardelli, Clayton & Mathis 1989; Fitzpatrick 1999): https://arxiv.org/pdf/astro-ph/9809387
- Disney multiplane camera: https://d23.com/a-to-z/multiplane-camera ; https://lemelson.mit.edu/resources/walt-disney

Web platform, devices, accessibility

- CSS Values and Units 4, reference pixel (0.0213°): https://www.w3.org/TR/css-values-4/#reference-pixel
- WCAG 2.2 Understanding 2.2.2 Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
- WCAG Understanding 2.3.3 Animation from Interactions (parallax example): https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions
- MDN, `DeviceOrientationEvent.requestPermission()`: https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static ; W3C review announcement (SecureContext, requestPermission): https://lists.w3.org/Archives/Public/public-review-announce/2024Nov/0009.html ; Chromium intent to ship: https://groups.google.com/a/chromium.org/g/Blink-dev/c/ckd2rFmT3PA
- Apple, Reduce screen motion (disables tilt parallax): https://support.apple.com/en-us/111781
- Apple, `UIInterpolatingMotionEffect`: https://developer.apple.com/documentation/uikit/uiinterpolatingmotioneffect ; sample code: https://developer.apple.com/library/archive/samplecode/sc1249/Listings/MotionEffects_BasicInterpolationVC_m.html
- Apple tech specs: iPhone 15 https://support.apple.com/en-us/111831 ; MacBook Pro 14″ https://support.apple.com/en-us/121552
- OSHA eTools, monitor distance 50–100 cm: https://www.osha.gov/etools/computer-workstations/components/monitors
- Bababekova, Y. et al. (2011). Font size and viewing distance of handheld smart phones. *Optom. Vis. Sci.* 88(7):795–797. https://pubmed.ncbi.nlm.nih.gov/21499163/
- RED, camera panning speed (7-second rule): https://www.red.com/red-101/camera-panning-speed

Numerics and libraries

- Motion spring implementation (critically damped closed form; visualDuration mapping ω = 2π / (1.2·visualDuration)): `node_modules/motion-dom/dist/es/animation/generators/spring.mjs` (motion-dom 12.38.0, installed). Docs: https://motion.dev/docs/spring
- LeVeque, R. J. (2007). *Finite Difference Methods for Ordinary and Partial Differential Equations*, ch. 7 (absolute stability of forward Euler, |1 + kλ| ≤ 1). Excerpt: https://www3.nd.edu/~zxu2/acms40390F14/OT98Chapter7.pdf
- Perlin, K. Improved noise reference implementation: https://cs.nyu.edu/~perlin/noise/ ; zero at lattice points: https://userpages.cs.umbc.edu/olano/papers/mNoise-slides.pdf
- Rice, S. O. (1944). Mathematical analysis of random noise. *Bell Syst. Tech. J.* 23:282–332. https://data-ww3.ifremer.fr/BIB/Rice_1944.pdf
