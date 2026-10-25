# Planning brief: from the research to PLAN.md

Read in this order:

1. `00-shared-brief.md`: the user's request verbatim, the code map, the current behavior and the rules.
2. `../COORDINATION.md`: the meteor-veil session's hard constraints. These are non-negotiable.
3. `R1-physics-depth.md`, `R2-meteors-bodies.md`, `R3-rendering-engineering.md` and `R4-design-and-history.md`.
4. The code itself: `src/lib/sky/*`, `src/components/sky/*`, `AGENTS.md`, `CLAUDE.md`.

## What the plan is for

The user will hand `PLAN.md` to an implementing session, which may run on a different model or account. That session must be able to implement it phase by phase without re-deriving anything. So the plan must be concrete about:

- files and functions;
- new types and signatures;
- every new config constant, with its value, units and the documentation-comment content;
- the formulas;
- the order of work;
- verification for every phase;
- coordination checkpoints with the veil session.

It must also explain the core ideas in plain words, with analogies (the user's preference), and carry its sources (official documentation and primary physics or astronomy sources, as the research cites them).

## Settled defaults (start from these; deviate only with a stated reason)

### Depth and camera (R1 is primary)

- One camera, one law: `screen = world − q·C(t)`, with `C = C_scroll + C_drift (+ C_lean)`.
- Each star's nearness comes from its magnitude: `q(m) = min(1.6, 10^(−0.14·(m − 1.57)))`. This uses no new random draw.
- The drift is a pure function of a drift clock: epicycles with v₀ = 3 CSS px/s at q = 1, P = 180 s, ratios 1, −φ, 1+√2 and shares 1, 0.3, 0.12. It eases in over 3 s after the reveal, and the clock advances by at most 0.1 s per frame.
- The scroll part goes through a critically damped spring (ω = 10 rad/s), snaps on jumps larger than one viewport, and starts at the restored scroll position.
- Use exact closed-form integrators only.
- R3 proposed per-layer drift accumulators that wrap at 2^16 cells. R1's drift is bounded: the epicycles wander at most about 63.6·v₀·q px. Reconcile the two explicitly. The likely answer is a bounded closed-form drift plus a bounded scroll term, with no wrap needed. If so, say why, and keep the `wrapCell` key-range guard only if it is still needed defensively.
- Pointer lean is an optional, late phase: desktop with a fine pointer and hover, hero only, full motion only. reach = 12 px at q = 1, ω = 4. R4 suggested 2/4/7 px per layer; reconcile the two. Don't use device orientation.
- Skip sky rotation, dolly, depth-coded color and depth-dependent twinkle. The bokeh dust layer is not in v1.

### Scene, presence and idle (R1, R3, R4)

- `SCENE.*.drift`: hero 1, reading 0.35, end 0.8. Reading drift (0.35 versus 0) is a user decision; default 0.35, which R1 and R4 both recommend.
- One presence gate shared by twinkle and drift. Presence is scroll, plus pointer, keys and focus through a throttled `activity` message. After the 90 s idle window the drift eases out, the worker sleeps, and the camera keeps its position. Freeze everything under reduced motion.

### Rendering and pacing (R3 is primary)

- Use a `FrameClock` wrapper: rAF divided by a whole number k, `fps_need = max(20, v_max·dpr/0.5)`, and hysteresis.
- WebKit's unaligned 15 ms worker clock: detect it and draw every frame there. The main-thread relay is phase 2, decided by device tests.
- Use 4×4 phase sprites drawn at whole device pixels, painted by a separable painter. Under reduced motion, snap exactly as today.
- Add an exact per-tile quiet index for stars only, wrapping the veil session's `easedQuietFactor`. Meteors keep their exact checks.
- Replace the full cache clear with stamp-based cell eviction. Keep EDGE = 24.
- Drift caps: 30 fps on narrow screens and after ADAPT step 1; a CPU budget on software raster.

### Transients (R2 is primary; R3 for the architecture; R4 for the look)

- **Population model.** A 60° gnomonic window pitched 40° above the horizon. Each visit gets one shower radiant (40% of launches, σ 1.5°) and three sporadic sources (60%, σ 15°) with slow, medium and fast speed classes. Drop the 18–42° angle filter but keep the layout guards. About 15% of visits put the radiant on screen, where meteors are short and head-on ones are point flashes.
- **Rate.** Desktop hero: floor 4 s + Exp(8 s), capped at 30 s (mean about 11.7 s), with the long-visit stretch up to ×3. Narrow screens: 8 + Exp(14), capped at 45 s, at most 6 per visit. No transients in the reading scene. Two end-bookend "farewell" meteors are a "could".
- **Kinds by priority.**
  - Must: sporadic and shower meteors.
  - Should: retuned fireballs (4% of launches, at least 120 s apart, clear sky only), trains kept, satellites (steady, at most 4.8 s, clear sky only, on their own clock with a mean gap of about 88 s).
  - Could: bursts, earthgrazers, near-radiant stationary meteors, a static comet, a planet.
  - Won't: outbursts without a pause control, the ISS, Starlink trains, glints, the Milky Way, aurora, airplanes.
- **Invariants (COORDINATION.md).**
  - One ink lease at a time, plus a 40 s crossing cooldown.
  - Every moving kind uses the veil checks and the shared scroll cancel (`launchScrollY`).
  - Each transient lasts 5 s or less from first light to last light.
  - At most 3 flashes per second; no saturated red.
- **Architecture.** A discriminated `Transient` union with a per-kind spec registry, one scheduler, and rAF frames while any transient moves.

### Accessibility

WCAG 2.2.2 means continuous drift needs a pause mechanism. All four research reports agree.

- Recommend a page-level "Pause sky animation" toggle (G186/G4) that maps to the worker's existing `motion: 'reduced'`.
- It defaults to paused under prefers-reduced-motion and persists per viewer in localStorage, inside try/catch.
- Its placement (the navbar, a hero corner or the footer) and its visual design are user decisions. Give a recommended default and the alternatives.
- Its UI component must follow the codebase conventions: a client island, default export, the motion and Tailwind patterns already in the navbar.

### Ownership and sequencing with the veil session (COORDINATION.md)

- Don't edit `veiledFrom`, `METEOR_VEIL`, the quiet ease (`quietBlend`, `settleQuiet`, the `layout` handler) or the `scroll` handler until the veil commit lands. After it lands, rebase onto it.
- Order the phases so that everything independent of the veil lands first: the phase atlas, generalized `drawLayer`, the quiet index, the frame clock, pacing, the camera and drift, presence, and the pause control. The transient work comes after the veil commit.
- Spell out the interface requests to the veil session: `planMeteor` or `planFlight` accepting a direction source and a `nearCopy`/avoid-copy option, reporting `nearCopy`, a shared scroll cancel and a `QUIET_REACH` export. Give a fallback if they decline.

### Verification

- Every phase passes `npm run lint` and `npm run type-check` (AGENTS.md).
- While `next dev` runs, use its MCP endpoint (`get_errors`, `get_compilation_issues`).
- The repository has NO test runner. Don't silently add one. Propose dev-only verification instead: the R3 and R1 harness approach, run in a scratchpad and not committed, as acceptance evidence. Present adding a runner (for example Vitest, or `node --test` with type stripping) as an explicit user decision, with trade-offs.
- Use R4's acceptance checklist, mapped to phases.
- Never POST to `/api/schedule/book`.

## Required PLAN.md structure

1. **Title and status.** Planning only. List the inputs, the date, and the veil-session dependency.
2. **The end goal, worked backwards.** What the visitor sees and feels after 60 s on the hero, the reading scene, and under reduced motion. The plain-words explanation with analogies (train window, multiplane camera, ice-cube tray; meteor versus comet versus satellite).
3. **Decisions for the user.** Each with a recommended default and its alternatives. At least:
   - the pause control and its placement;
   - reading-scene drift;
   - pointer lean;
   - which "could" transients ship;
   - whether to add a test runner;
   - the v₀ speed;
   - the WebKit relay (deferred to device tests).
4. **Domain model.** The entities and their invariants: Star (with q), Layer, Camera and its components, DriftClock, Scene levels, Presence, FrameDemand and FrameClock, QuietIndex, Transient and its kinds, TransientSpec, Scheduler, InkLease, SkyWindow, Radiant/Source, SpeedClass. A diagram (ASCII or Mermaid) of which module owns what.
5. **Architecture and module map.** New and changed files, the import rules each one respects (AGENTS.md worker rules), and the main-thread/worker split.
6. **Detailed design per area.** Each area gets formulas, constants (full config blocks in codebase style, with documentation comments), types and signatures, and before/after behavior:
   - camera, depth and drift;
   - pacing and the frame clock;
   - sub-pixel phase sprites;
   - the quiet index;
   - the star-field cache;
   - presence and idle;
   - scene integration;
   - the pause control (UI, protocol, mountSky);
   - the transient system: union, specs, scheduler, lease, scroll cancel;
   - the meteor population model and speed classes;
   - satellites;
   - the "could" kinds, kept brief;
   - the protocol changes.
7. **Implementation phases.** Each phase: its goal, its files, its steps, what "no visible change" or "visible change" means, verification (commands plus checklist items), and a rollback note. Mark which phases are blocked on the veil commit.
8. **Coordination protocol.** Interface requests to the veil session, the rebase checkpoint, merge-conflict hotspots, and what to re-verify after the rebase.
9. **Acceptance checklist.** R4's checklist, trimmed and mapped to phases, with pass/fail criteria.
10. **Performance budget and battery.**
11. **Accessibility conformance summary.** WCAG 2.2.2, 2.3.1, 2.3.3, 1.4.3 (veil contrast), 2.5.8 and 1.4.11 for the toggle.
12. **Risks and open questions.**
13. **Sources.** The key ones, consolidated from the research reports.

Keep the plan self-contained but not bloated. Link to the research files for long derivations rather than copying them. Code sketches follow the codebase style: tabs, single quotes, no semicolons, `@/` imports in components, relative imports inside `src/lib/sky`, and documentation comments on every config constant.
