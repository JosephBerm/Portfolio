# Check round 11: code grounding and feasibility

Checker: adversarial, lens "code-grounding". Date: 2026-10-28.

## Scope

- **Role.** Find real problems in `PLAN.md` through the code-grounding lens; no praise.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `PLAN.md`, `REVIEW-LOG.md` ("### Round 10" and "### Gate round 10"), round 10's report in this lens, and the round-10 gate reports for the fixes in this lens.
  - The archived veil harness (`harness/veil-confirm-final-1.tar.gz`, extracted into the scratchpad only).
  - The code at cf4d7b8: the worktree's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty), the baseline for every `file:line` below.
- **What the lens covers.**
  - Every existing file, function, type, message and constant `PLAN.md` names exists with that shape at cf4d7b8, is a veil export, or is marked new.
  - Nothing imports what the veil made private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, and answer 1's other private symbols).
  - Integration with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol works on cf4d7b8.
  - Sketches type-check in principle (TypeScript ~6.0); the AGENTS.md sky import rules hold for every new or changed file; no Cache Components API.
- **Outputs.** This file and the structured findings.
- **Limits.** Planning only: nothing in either checkout was edited. Scratch work is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/cg11/`.

## Method

1. **Round 10's revision.** Diffed `PLAN.md` against the copy round 10 checked (`scratchpad/PLAN.before-r10.md`, output `cg11/r10-diff.txt`, 539 lines) and read every hunk in this lens.
2. **References.** Reran round 9's resolver (`cg11/refs.mjs`) against the worktree's `src/` and read every hit on a line round 10 changed.
3. **Names.** Reran round 9's lister (`cg11/names.mjs`). Against round 10's list, the only new names are `kindLaunches` and `launchesAllowed` (declared new in P12 and P8) and `ROOT`, `HERE`, `ZONES` and `PLAN`. Those four are the archived harness's path constants (`lib.mjs:7-9`, `transpile.mjs:14-15`).
4. **Type check and lint.** tsc 6.0.3 with the repository's compiler options, and ESLint 10.13 with its config, on two trees:
   - `cg11/tc`: round 10's P10-state assembly (`cg10/tc9`) with round 10's code-level fixes applied by `cg11/apply-r10.mjs`:
     - `frameDue`'s `k <= 1`;
     - `DEG` removed;
     - `startArea` unclamped, with the clamp in the draw and in the probes;
     - the fallback pass's scaled minimum path;
     - `launchesAllowed`.
   - `cg11/tc12`: the same, plus P12's farewell contracts, assembled from 6.9, 6.10 and 6.12 by `cg11/apply-p12.mjs`:
     - `SceneLevels.launchScene` and `SCENE.endLaunchLevel`;
     - `TransientSpec.scene`, `limit` and `room`, `TransientSchedule.kindLaunches` and `LaunchGate.scene`;
     - step 2.2's holds, with the field built once and passed to the plan;
     - `planMeteorTransient`'s optional second argument, the `starts` option, and the band's edge from `field.quiet` without `field.pinned`;
     - `drawTransient`'s `'farewell'` case.
   - Nobody had type-checked these P12 contracts before.
5. **Runtime.** Under Node 24.14 type stripping with 7.1's resolve hook (`cg11/run/`):
   - `h-farewell-fireball.ts` plans farewell meteors on `tc12`;
   - `h-fireball-order-c.ts` plans launches with a decided fireball on `tc`, over the six desktop layouts captured in the archive.
6. **Harness.** Extracted the archive at HEAD into `cg11/harness-x/` and checked the files and lines P9's adaptation bullet names.
7. **Integration.** Read `sky.worker.ts`, `renderSky.ts`, `mountSky.ts`, `skyAssets.ts`, `meteors.ts`, `scene.ts`, `config.ts`, `protocol.ts`, `catalog.ts` and `random.ts` at cf4d7b8 against the integration bullets of 6.1 to 6.13 and P1 to P13.

## Previous round's findings in this lens

- **CG10-1: fixed, no regression.**
  - `frameDue` now returns `k <= 1 || now - lastDrawAt >= (k - 0.5) * interval` for a vsync demand, and its doc says so (`PLAN.md:1114-1123`).
  - That matches cf4d7b8's `'active'` mode, which draws on every animation frame (`sky.worker.ts:207`).
  - The fix leaves the other paths unchanged:
    - k ≥ 2 holds;
    - WebKit's capped drift: k = 3, so `frameDue` draws once 37.5 ms have passed, every third tick (deviation 5);
    - H4's timer-fallback k = 2 case: a draw once 25 ms have passed, on the timer armed 33.3 ms after the last draw.
  - H13's case 0 (`:2901`) and P3's trace check (`:3047`) now hold as written.
- **CG10-2: fixed.**
  - "Removed in P9" lists `DEG` (`:2448`; cf4d7b8 `meteors.ts:77-78`, read only at `:209` and `:212`).
  - ESLint on `cg11/tc` reports 0 warnings, where round 10's tree had one.
- **CG10-3: fixed.**
  - `startArea` is the unclamped box (`:2591`), and `planFlight` keeps cf4d7b8's draw (`:2593-2594`; `meteors.ts:204-207`).
  - The probes clamp the same way (`:2532`), and "Everything else" (`:2619`) and P9's step 2 (`:3238`) follow. The assembled version compiles.
- **Round 10's other edits in this lens hold.**
  - `launchesAllowed` (P8; `:2333`, `:2338`, `:3200`, `:3208`); P4's text keeps the old name.
  - The field built once per due kind (`:2138`, `:2214-2215`, `:2334`).
  - `TransientSpec.limit` and `kindLaunches` (`:2214`, `:2221`).
  - The farewell band's edge: `field.quiet` without `field.pinned` works by identity, because the gate pads the rails once for both lists (`:2334`; cf4d7b8 `scene.ts:60-69` makes new objects on each call).
  - The comet's start rule reads the launch gate.
  - P13 cancels its loop in `destroy` (cf4d7b8 `mountSky.ts:316-326` terminates the worker).
  - The scaled fallback minimum (`:2609`): 160 × 0.64 = 102.4 px and 110 × 0.64 = 70.4 px.
  - H5's three kill-switch rows (`:2893`) follow from the sketches:
    - `snapViewports = 0` makes every changed goal a jump, so `stepCamera` returns false with no drift or lean;
    - a scene drift of 0 gives `driftWanted` false and `driftRate` 0;
    - `LEAN.reach = 0` makes `settle` place both lean springs on their targets in one step (its scale is 0), so `leanWanted` turns false and the offset's lean term is 0.

## What held

- **References.**
  - Every `file:line` on a line round 10 changed resolves to the code its sentence means. That includes `sky.worker.ts:163-165`, `:183`, `:221`, `:222`, `:226`, `:435`, `:436`, `:455`, `:504`, `:507` and `:514`, `meteors.ts:77-78`, `:195-196` and `:204-207`, `mountSky.ts:231`, `scene.ts:60-69`, `components/styles.ts:7` and `globals.css:203`.
  - The resolver's only odd hits are the known Next.js-docs line numbers it pins to the wrong file.
- **Veil symbols.**
  - Every veil function the plan calls has cf4d7b8's signature: `planMeteor` and its `PlanOptions`, the private `planFlight` and `veiledFrom` (called inside `meteors.ts` only), `scrollKept`, `transientQuietFactor`, `easedQuietFactor`, `budgetKeeps`, `inkBudget`, `screenQuietZones`, `quietAt`, `drawMeteor(…, fade)`, `contrastLevels` and `quietEasing` (worker-local).
  - No sketch imports `fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, `zoneQuiet`, `zoneInk`, `CLEAR_SKY` or any other answer-1 private symbol. `clearOf` reuses `segmentTouches` inside `meteors.ts`.
- **Type check and lint.** Both trees pass tsc 6.0.3 and ESLint with no error and no warning.
  - In `tc12` the farewell contracts fit the P8 to P11 types with no cast beyond the existing `envelope as Transient`.
  - `drawTransient`'s destructured `kind` narrows `body` to `Meteor` for a combined `case 'meteor': case 'farewell':`.
- **Module graph and import rules.**
  - The new model files import only their siblings.
  - `transients.ts` imports kind specs; kind modules import its types with `import type`.
  - `meteorKind.ts`'s new `ZONE_REACH` value import comes from `quietIndex.ts`, which never imports `transients.ts`, so no temporal-dead-zone error can arise.
  - The worker files import `@/lib/sky/*` by file, and the main thread imports only types and `color.ts` from `src/lib/sky`.
  - `SkyPauseButton` takes `cn` from the `@/lib` barrel as `Navbar.tsx:8` does, and the Navbar renders only on `/` (`app/page.tsx`).
- **Worker state machine.** Traced `init`, `motion`, `visible`, `scroll`, `activity`, `pointer`, `layout` and `resize` through the assembled P8 to P11 worker:
  - `gather` runs before every gate read;
  - `probeRaster`, `resize` and `stepDown` draw through `frameAt`;
  - the star cache's stamps and the module-level quiet index survive the probe's off-screen `drawSky`;
  - the scheduler port draws its random numbers in `updateMeteor`'s and `planLaunch`'s order. On a plan that fails for the third time, no retry gap is drawn, as cf4d7b8 skips it (`sky.worker.ts:230`).
- **Next.js.** No Cache Components API anywhere.

## Findings

### CG11-1 (major): P10 never says how a decided fireball falls back, and the plainest build flies an ordinary short flight before any long one, against 8.4's ask 1

- **Section.**
  - P10 (files `:3263-3266`, the `METEOR_KINDS` doc `:3269-3274`, steps `:3280`, verification `:3282`).
  - 6.9 (`planMeteorTransient`'s doc and signature `:2097-2106`, `METEOR_SPEC.plan` `:2113`).
  - 6.10 (`PlanOptions.fireball` `:2585-2586`, the P10 note `:2595-2596`).
  - 8.4 (ask 1, `:3392`); 6.12 (the farewell row, `:2749`).
- **Problem.**
  - From P10 a launch commits to a fireball before planning (`:3265`), where cf4d7b8 draws one per candidate attempt (`meteors.ts:203`). The `METEOR_KINDS` doc promises "if no fireball path fits, an ordinary shooting star flies instead". Nothing says through which passes it flies.
  - Fireballs fly long flights only (cf4d7b8 `config.ts:313` and `meteors.ts:274-275`, kept by P9's doc rewrite at `:2457`). So `planMeteor` with `fireball: true` and `flights: 'short'` flies an ordinary short flight: its fallback pass clears the fireball.
  - The plainest P10 build adds the decided `fireball` to each `planMeteor` call in P9's loop: long flights over every steer, then short ones (`:2097-2104`). A fireball that fits nowhere is then followed by an ordinary short flight, and no ordinary long flight is ever tried.
  - That breaks the order 8.4's ask 1 keeps: long flights on every candidate direction before any short flight (`COORDINATION.md`, "keep C4's order"). Round 10's assembly in this lens (`cg10/tc9/src/lib/sky/meteorKind.ts:32-35`) is another natural build, and it also tries an ordinary short flight before any ordinary long one.
  - No check catches it. P10's verification checks fireball spacing, the earliest second and clear sky (`:3282`), and nothing measures the short-flight share after P10: P9's harness adaptation even drops `sim2.mjs`'s short-flight count (`:3252`).
  - The same gap makes 6.12's "never a fireball, since P10's decision is the meteor spec's" depend on a structure P10 never states, since `METEOR_SPEC.plan` is `planMeteorTransient` itself (`:2113`). DRY-R11-1 and SOC11-1 (this round's gate) raise that structure and the second argument's phase. Both call it minor, and DRY-R11-1 because "the plainest P10 build ... keeps the veil's pass order"; the numbers below show it doesn't. This finding adds the order and its numbers. The two fixes should land as one.
- **Evidence.**
  - [computed, `cg11/run/h-fireball-order-c.ts`] 2,000 launches with a decided fireball per layout, on the six archived desktop layouts (hero, scroll 0, `nearCopy` true), using round 10's assembled planner with round 10's fixes (`cg11/tc`). The table gives the share of those launches that end as an ordinary short flight:

    | Layout | Fireball flies | Plainest build | Ask-1 order |
    |---|---|---|---|
    | 1440 × 900 | 99.9% | 0.1% | 0.0% |
    | 1920 × 1080 | 100% | 0.0% | 0.0% |
    | 1280 × 800 | 93.9% | 6.0% | 0.1% |
    | 1366 × 768 | 95.3% | 4.7% | 0.1% |
    | 1280 × 720 | 81.2% | 18.5% | 0.0% |
    | 1024 × 768 | 60.6% | 36.9% | 15.8% |

    - Round 10's assembly gives the same short shares as the plainest build (18.6% at 1280 × 720, 37.8% at 1024 × 768).
    - Fireballs are decided on at most about 4% of desktop launches. That adds up to about 0.2 to 0.8 points of short flights per launch at the four smaller layouts, against the veil commit's 0.0 to 0.3% fallbacks per launch on desktop (`COORDINATION.md`, "Shorter fallbacks per launch").
  - [computed, `cg11/run/h-farewell-fireball.ts`] With the decision inside `planMeteorTransient`, as `METEOR_SPEC.plan` being that function implies, 64 of 3,808 farewell plans (1.7%) came out as fireballs, against 6.12. That ran on a synthetic end-scene field (Contact's two lines and the rails), with fresh visit memory per plan, so no spacing.
- **Fix.**
  - In P10's `meteorKind.ts` line (and `planMeteorTransient`'s doc), wherever the decision sits (DRY-R11-1 and SOC11-1 put it around the function, with the second argument in P10), state the order. "A decided fireball is tried on long flights over every steer, in clear sky, so its failure keeps the visit's sky. If none fits, the launch goes on in the ordinary order: long flights over every steer before any short one (8.4, ask 1). A short pass never carries `fireball`: `planMeteor`'s fallback clears it and would fly an ordinary short flight first."
  - Add to P10's verification, in H7's fireball cases: "a launch that decided a fireball and flies an ordinary short flight first tried ordinary long flights on every steer". That is a pass-order assertion on the recorded `planMeteor` calls, so it needs no sampling bar.

### CG11-2 (minor): P9's harness bullet calls `code-logic/lib.mjs` unarchived, but the archive has held it since 0950538

- **Section.** P9's verification, the archived-harness bullet (`PLAN.md:3252`).
- **Problem.**
  - The bullet takes `launch` from `live/alib.mjs` "in place of the unarchived `code-logic/lib.mjs`". The archive committed with round 10's fold holds `meteor3/code-logic/lib.mjs`.
  - `harness/README.md` lists the file, and its step 2, which the bullet keeps, has the implementer set that file's `HERE`, `PW` and `CHROME`.
  - So the bullet's reason is stale, and it sends the implementer to edit `check11/render3-canvas.mjs:12`'s import for nothing. Both `launch` functions are the same.
- **Evidence.**
  - `tar -tzf harness/veil-confirm-final-1.tar.gz` lists `meteor3/code-logic/lib.mjs` (entry 131 of 141).
  - Commit 0950538's message: "The harness archive gains the two shared lib files its scripts import". `harness/README.md`, Contents and step 2.
  - In the extracted copy:
    - `code-logic/lib.mjs:12` and `:16-17` define `GPU_ARGS = ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11']` and `launch(args = GPU_ARGS)`, as `live/alib.mjs:13` and `:17-18` do;
    - `check11/render3-canvas.mjs:12` imports `launch` from `'../../../code-logic/lib.mjs'`.
- **Fix.** Replace "in place of the unarchived `code-logic/lib.mjs`" with "or keep its import of `code-logic/lib.mjs`, archived with the rest, once README step 2 has set its `PW`, `CHROME` and `HERE`: both launch with the same GPU flags".

## Summary

- **Verdict: revise.** One major, one minor.
- **Round 10 in this lens.**
  - All three fixes landed: `frameDue`'s every-frame rule at k = 1, `DEG`, and the `startArea` contract. No regression.
  - Round 10's other edits in this lens hold, and their references resolve on cf4d7b8.
  - The assembled P10 tree, with round 10's fixes applied, compiles and lints clean, and so does a new P12 farewell assembly nobody had type-checked.
- **New.**
  - P10 commits to a fireball before planning but never says how a fireball that doesn't fit falls back (CG11-1). The plainest build turns it into an ordinary short flight without trying any long one, against the veil's ask 1. That happens to 5 to 19% of decided fireballs at 1280 × 800, 1366 × 768 and 1280 × 720, and 37% at 1024 × 768 (16% in the ask-1 order). It also makes 6.12's "never a fireball" depend on a structure P10 doesn't state. One sentence in P10 and one harness row fix it, together with this round's DRY-R11-1 and SOC11-1.
  - P9's harness bullet still calls an archived file unarchived (CG11-2).

## Verification

Skeptic pass, gate round 11, 2026-10-28. Re-checked against `PLAN.md` (6.9 `:2097-2122`; 6.10 `:2457`, `:2585-2600` and `:2611`; 6.12 `:2749`; H7 and H8 `:2895-2896`; P9 `:3229-3252`; P10 `:3259-3285`; 7.0 `:2817`; 8.4 `:3384` and `:3388-3392`), `COORDINATION.md` in full (above all the three P9 asks, `:225-230`, and the landed fallbacks, `:277`), the cf4d7b8 code in the worktree (`git diff cf4d7b8 HEAD -- src/` is empty: `meteors.ts:203`, `:228` and `:274-275`, `config.ts:313`, `sky.worker.ts:240-260`), round 10's assembly (`cg10/tc9/src/lib/sky/meteorKind.ts:24-45` and its `meteors.ts:294-295`) and my own extract of `harness/veil-confirm-final-1.tar.gz` (`sim2.mjs:28`). The reviewer's two scripts rerun to the same numbers (`repro-order-c.txt`, `repro-farewell.txt`). For an independent check, `patch-p10.mjs` applies P10's `fireball` option (6.10: it replaces `PassOptions.fireballs` and the per-attempt draw) to the round-10 skeptic's I2 patch of cf4d7b8's own `meteors.ts`, and `order.mjs` runs four pass orders on the eight archived desktop layouts with that skeptic's radiants (written from R2 §10) and a different generator, xoshiro128** (outputs `order-3steers.txt`, `order-4steers.txt` and `order-keep-3steers.txt`). All of it is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/skeptic-r11-cg/`. Result: confirmed as major, so this lens does not pass.

- **CG11-1: confirmed, major.** Every load-bearing fact holds. P10 decides a fireball once per launch (`:3265`) in place of cf4d7b8's draw per candidate (`meteors.ts:203`), where a fireball candidate that can't fit just gives way to the next, mostly ordinary, candidate of the same long pass; the plan then says only "if no fireball path fits, an ordinary shooting star flies instead" (`:3273`), never which passes a decided fireball takes, nor that `planMeteor`'s fallback pass clears `fireball` (6.10 says only that the option replaces `PassOptions.fireballs`, `:2595-2596`). My model gives the reviewer's pattern: with the decided `fireball` on every call of P9's loop and the fallback clearing it, as cf4d7b8's `fireballs: false` does, 5.7, 4.3, 15.6 and 35.8% of decided-fireball launches at 1280 × 800, 1366 × 768, 1280 × 720 and 1024 × 768 end as ordinary short flights with no ordinary long flight tried, against 0.0, 0.1, 0.2 and 14.2% in ask 1's order (3 steers; with 4 steers 3.3, 2.9, 11.2 and 29.1% against 0.0, 0.1, 0.1 and 11.4%); round 10's [fireball, ordinary] × [long, short] loop gives the same, and the other four desktop layouts stay at or under 0.5%. The other port is no better: if the fallback keeps `fireball`, fireballs fly on the short pass (1.6 to 17.6% of decided fireballs at those four layouts, against "long flights only", `:2457` and cf4d7b8 `config.ts:313`), and the one-flag build returns null on 2.8 to 20.4%, which clears the visit's sky and counts toward `maxFailedPlans`, against the `METEOR_KINDS` doc. So only a stated order is right. Each misbuild breaks what 8.4 says the port keeps ("`planMeteorTransient` ports `planLaunch` in its order", `:3384`) and `COORDINATION.md`'s ask 1 as cf4d7b8 documents it ("a shorter fallback only when none has room for a long one", `sky.worker.ts:242-243`); DRY-R11-1's premise that the plainest build keeps the pass order holds only literally (long passes still precede short ones). Nothing named would catch it: P10 checks spacing, the earliest second, clear sky and H10 (`:3282`); H8 launches in the pass order but runs in P9 (`:2896`); H7's oracle covers P8 only (`:2895`); and P9's adapted harness drops `sim2.mjs:28`'s short-flight count (`:3252`). Major, not blocking: P10 doesn't prescribe the wrong order ("long flights only" read with "an ordinary shooting star flies instead" gives the right one), and the cost is small: about 3% of P9's launches decide a fireball once the 120 s spacing binds (my estimate at 4.7 launches a minute), so about 0.1 to 0.6 extra points of short flights per launch at the four smaller layouts (0.2 to 0.8 at the reviewer's 4% bound), with no contrast or WCAG effect, since a short flight still passes the veil. Not minor: it sits in a required phase (`:2817`, `:3259`), the two plainest builds get it wrong (one of them round 10's own assembly), and no named check would stop it before merge. The fix is right and breaks no `COORDINATION.md` constraint: it restores ask 1's order and leaves `veiledFrom` and the guard values alone. Three refinements for the reviser: say in 6.10 that `planMeteor`'s fallback pass sets `fireball: false`, as cf4d7b8's `fireballs: false` does, since `PLAN.md` never states it; make the fireball try a `flights: 'long'` call through the second argument that DRY-R11-1 and SOC11-1 move into P10, so the three land as one edit; and record the `planMeteor` calls for the new H7 assertion with a 7.1-style resolve hook that wraps `./meteors`. The farewell half reproduces (64 of 3,808 plans, 1.7%) and is the structural gap DRY-R11-1 and SOC11-1 raise, minor on its own (P12, D4's default is none).
