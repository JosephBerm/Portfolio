# Check r4: code grounding and feasibility

Checker: adversarial, lens "code grounding", round 4. Date: 2026-10-27.

## Scope

- **Role.** Find real problems in `PLAN.md` through one lens. Every file, function, type, message and constant it names must exist with that shape in the worktree (master 246c0aa), be an export of COORDINATION.md's "Confirmed veil interface (2026-10-27)" marked as arriving with the veil commit, or be marked new. `PLAN.md` must not import what the veil keeps private (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`). Its integration points must work with the worker state machine, the frame scheduler, the star cache, `mountSky` and the protocol, both before and after the veil commit. The AGENTS.md sky import rules must hold for every new or changed file, and no Cache Components API may appear. This round also confirms round 3's fixes in this lens and checks the veil reconciliation for regressions.
- **Inputs.** `PLAN.md` (3,646 lines, read in full, Check log included); `HANDOFF.md`; `COORDINATION.md` (all of it); `research/00-shared-brief.md` and `research/01-planning-brief.md`; my round-3 report; the worktree code (`src/` equals 246c0aa); the main checkout's uncommitted veil edits (`git diff`, read only), to see how the confirmed interface is taking shape; `node_modules/next/dist/docs`, TypeScript 6.0.3, Tailwind 4 and `@types/react` in the main checkout (read only).
- **Output.** This file, and the same findings returned to the workflow.
- **Limits.** Planning only. No edits to `PLAN.md`, `src/` or any configuration in either checkout. Throwaway scripts live in the session scratchpad (`check-r4-cg/`). Never POST to `/api/schedule/book`.

## Method

1. Read the four context files, then `PLAN.md` end to end, listing every code name, citation and sketch.
2. Listed every explicit `file:line` citation by script and checked each against the worktree, and every backticked identifier against the worktree source, COORDINATION.md and the plan's own sketches.
3. Built a type-check project from the main checkout's uncommitted `src/lib/sky`, `renderSky.ts` and `skyAssets.ts` (the "after V" baseline), added the plan's `camera.ts`, `pacing.ts`, `quietIndex.ts` (in its V form), `presence.ts`, every new config block, and P8's `transients.ts` (6.9's types verbatim, with bodies written from 6.9's prose), and ran TypeScript 6.0.3 under the repository's compiler options.
4. Re-ran H3's exactness check against the veil's one-pass `quietFactor` and `budgetKeeps`.
5. Traced P8's scheduler against the veil's `updateMeteor` and `planLaunch` for H7's oracle equality, and P3's frame mechanism against the veil's deferred layout.

## Verdict: revise

One major finding and seven minor ones, no blocking ones. The major one: the exhaustiveness check in `drawTransient` does not compile while the transient union has one member, which is every phase from P8 to P10, so P8's type-check fails as written.

| ID | Severity | Section | Problem in one line |
|---|---|---|---|
| CG4-1 | major | 6.9 "Drawing", P8 step 4, P11 | `const unknown: never = transient` is TS2322 while `Transient` has one kind (P8 to P10) |
| CG4-2 | minor | P8 steps 3 and 4 | step 3 removes `meteor` and `launchScrollY`, which the veil's `draw` still reads until step 4 |
| CG4-3 | minor | PF (7.3, 8.7), 8.3 I6, 6.9 | PF's "P8 to P12 read the same either way" is false in three places |
| CG4-4 | minor | deviation 8, 6.9, 8.6 | facts from the veil's uncommitted tree are presented as confirmed, and H7 depends on two of them |
| CG4-5 | minor | 4.4, 8.4 (CP-0), 8.6 | the pre-V overlaps are understated: `LAYERS`, `SceneLevels`, `SkyFrame` and a `renderSky.ts` import |
| CG4-6 | minor | T3, AC-24, 6.11 | "from a layout's first frame" ignores the veil's deferred layouts (up to 0.6 s) |
| CG4-7 | minor | D1 (a) and (b) | the control's `sr-only` name would add a second, invisible quiet rect inside a quiet root |
| CG4-8 | minor | 5.1, P8 files, P11 rollback | phase columns miss phases; a renamed key is filed under the wrong file; P11's rollback contradicts 7.2 |

## Round-3 fixes in this lens: verified

| Round-3 ID | Landed? | Where |
|---|---|---|
| CG3-1 | yes | 6.9 "In the worker (P8)": `resize`'s `radiant = null` (`sky.worker.ts:369`) becomes `forgetVisitSky`; P8's files ("resize only") and step 3; H7's resize and layout cases; `VisitMemory`'s doc. The reconciliation's removal of P9's layout call matches COORDINATION.md ("Layout does NOT re-pick it") and their tree: their `resize` still clears the radiant (main checkout `sky.worker.ts:421`) and their `layout` case never does. |
| CG3-2 | yes | M1, deviation 13, E11, the 6.1 worker notes, the 6.3 snap table, AC-9, AC-27, H13 case 3: the one settle is stated (at most 0.5 device px per axis, 0.71 diagonally, which `placePoint`'s floor-versus-round arithmetic confirms). |
| CG3-3 | yes, with a new residue | P3 steps 2 and 3, P4 step 2, P6 step 1 and P7 step 1 now order correctly. P8 has a new one: CG4-2. |
| CG3-4 | yes | `PlanContext.sinceReveal` (6.9, line 1937) and P10's files; it compiles in the P8-era build. |
| CG3-5 | yes, superseded | The confirmed `flights: 'long' \| 'short' \| 'both'` settles the pass shape; `planMeteorTransient`'s doc, P9 and H8 keep `planLaunch`'s order (long flights over every radiant before any short one). See CG4-4 for the draw order H7 needs. |
| CG3-6 | yes | 6.12's comet row, AC-25 and P12 step 1: the box is re-tested on every drawn frame. |

## Checked and consistent (no finding)

- **Citations.** All 79 explicit `file:line` citations, listed by script, match the worktree (for example `sky.worker.ts:61-66`, `:213-218`, `:220`, `:369`, `:463-470`, `mountSky.ts:265`, `renderSky.ts:113`, `:222`, `config.ts:246-255`, `styles.ts:7`, `globals.css:203`, `:273-278`, `Card.tsx:7`, `eslint.config.mjs:13`). The Next.js 16.4.2 doc lines (`05-server-and-client-components.md:178-180`, `preventing-flash-before-hydration.md:11`, `scripts.md:128`, `08-turbopack.md:130` and `:482`) say what the plan quotes.
- **Names.** Every backticked identifier is in the worktree, in COORDINATION.md, or defined or marked new in the plan, with the exceptions in CG4-4. Stale names (`clearSkyFactor`, `METEOR_VEIL.inkKeep`, `inkFrom`, `TRANSIENTS.scrollCancel`, `mayCrossCopy`) now appear only in the Check log.
- **Private helpers.** The plan imports none of `fitKeep`, `luminance` or `contrastRatio`; `segmentTouches` is used only if the veil session exports it (I6) or under PF (CG4-3).
- **Sketches against the veil's code** [computed, `check-r4-cg/tc/`]. With TypeScript 6.0.3 and the repository's options (`strict`, `noUncheckedIndexedAccess`, `isolatedModules`), against the main checkout's uncommitted `config.ts`, `scene.ts`, `meteors.ts` and `renderSky.ts`: `camera.ts`, `pacing.ts`, `presence.ts`, `quietIndex.ts` with `ZONE_REACH = QUIET_REACH - QUIET.padding`, every new config block from P1 to P11 (`DEPTH`, `CAMERA`, `DRIFT`, `PACING`, `STAR_PHASES`, `LEAN`, `FRAME.motionEase`, `TRANSIENTS`, `GapLaw`, `SKY_WINDOW`, `RADIANTS`, `SPEED_CLASSES`, `METEOR_RATE`, `METEOR_BRIGHTNESS`, `SATELLITE`, `METEOR_KINDS`), `nextGap`, and P8's `transients.ts` (the `planLaunch` port calling `planMeteor(random, field, radiant, now, { flights, ink, nearCopy })`, the launch step with the one `as Transient` cast, `scrollKept` inside `transientFade`) all compile. The only error is CG4-1.
- **The quiet index after V** [computed, `check-r4-cg/h3-veil.ts`]. Against the veil's one-pass `quietFactor` and `easedQuietFactor`, with random `headroom`, the three layers' keeps and two `budgetKeeps` (an `inkKeep` that reads the rect), at 1440 × 900, 3840 × 2160 and 390 × 844, 31 and 64 rects, settled and mid-ease, plus points exactly `QUIET.feather` from zone edges: 1,450,150 lookups, 0 differences (`Object.is`). Q1 holds as 6.4 argues.
- **Seams (8.1) against their tree.** Their `scroll` handler is unchanged and still reads `rafId` (falsy test), `timerId`, `noteInput`, `parallaxScroll`; their `layout` case reads `sameRects` and calls `retryMeteors`; `meteorsAllowed`, `holdMeteors`, `isIdle`, `noteInput` and the `init`, `motion` and `visible` handlers are untouched; `tick`, `schedule` and `frameMode` are untouched, so 8.6's first row holds. Their deferred layout applies inside `settleQuiet`, which P3's `tick` calls before the frame decision, and P3's quiet-ease fade line keeps the worker ticking until the ease ends, so a waiting layout is applied.
- **H7's oracle equality in P8** (beyond CG4-4's draw order). With `crossingCooldown` 0, `inkLeaseFree` is true whenever a meteor is planned (T7 holds launches while one is active, and the next attempt comes at least 30 s after a launch while a lifetime is at most duration + 2.4 s), so P8 always passes `nearCopy: true`, which is `planLaunch`'s default; T5 and T7 never bind; first delay, gap and retry draws come in the oracle's order; `transientFade` with no pause equals their `scrollKept(launchScrollY, scrollY)`.
- **Import boundaries (AGENTS.md).** Every new `src/lib/sky` file imports only siblings (`./config`, `./scene`, `./meteors`, `./pacing`, `./random`, `./protocol` types, `./radiants`, `./transients` types); no cycle (`radiants.ts` and `satellites.ts` import only types back). Worker files import `@/lib/sky/*` and each other. `mountSky.ts` keeps to types and `@/lib/sky/color`; `skyPause.ts` imports only `@/lib/utils`. `SkyPauseToggle.tsx` uses the `@/lib` and `@/components/icons` barrels, and renders only on `/` (`page.tsx:7`). TypeScript's `**` include skips dot folders, so the main checkout's type-check never sees `.claude/worktrees`.
- **No Cache Components API** (searched for `use cache`, `cacheLife`, `cacheTag`, `cacheComponents`, `instant`).
- **Tokens and types the UI needs exist**: `--color-green-tint` (`globals.css:17`), `inert?: boolean` in `@types/react` 19.3.0, `autoPort: true` in `.claude/launch.json`.

## Findings

### CG4-1 (major): `drawTransient`'s never check does not compile while there is one kind

- **Section.** 6.9 "Drawing" (lines 2163-2181); P8 step 4 (line 3041); P11 step 2 and rollback (lines 3121, 3130).
- **Problem.** The sketch ends the switch with `default: { const unknown: never = transient; return unknown }`, commented "Narrowed to never once every kind has its case; `transient.kind` would not compile here (TS2339)". TypeScript narrows an object by its discriminant only when its type is a union. In P8, P9 and P10, `TransientBodies` has only `meteor` (line 1882-1884; "P11 adds `satellite: SatellitePass`"), so `Transient = { [K in TransientKind]: TransientEnvelope<K> }[TransientKind]` is the single type `TransientEnvelope<'meteor'>`, never a union, and the default branch keeps it. P8's own verification ("Lint, type-check") therefore fails on code the plan gives, and so do P9 and P10. Satellites are a "should", so if P11 is skipped (or rolled back by removing the kind), the check never compiles. The comment's alternative, `transient.kind`, is the one that compiles with one kind but breaks with two, so an implementer following the comment trades one error for the other at P11.
- **Evidence.** [computed, `check-r4-cg/tc/`] The 6.9 types and `drawTransient` verbatim, appended to the veil tree's `renderSky.ts`, under TypeScript 6.0.3 with the repository's options: `renderSky.ts(271,10): error TS2322: Type 'TransientEnvelope<"meteor">' is not assignable to type 'never'.` Minimal pair (`check-r4-cg/never/one.ts`, `two.ts`): with one kind, `never = transient` fails (TS2322) and `never = transient.kind` compiles; with two kinds, `never = transient` compiles and `transient.kind` gives TS2339 ("Property 'kind' does not exist on type 'never'").
- **Fix.** Destructure, and check the kind: `const { kind, body } = transient; switch (kind) { case 'meteor': drawMeteor(ctx, assets, body, frame, fade); return; default: { const unknown: never = kind; return unknown } }`. It compiles with one kind and with two (TypeScript narrows destructured discriminated unions; `check-r4-cg/never/fix1.ts` and `fix2.ts` both pass), and a kind without a `case` still fails to compile, as P11 step 2 relies on. Correct 6.9's comment to say so.

### CG4-2 (minor): P8 step 3 is not green until step 4

- **Section.** P8 steps 3 and 4 (lines 3040-3041); P8's files (line 3032-3035); 7.0 ("one commit per numbered step, each green").
- **Problem.** Step 3, "the worker swap", replaces `meteor` and `launchScrollY` with `const transients = createSchedule()`. The veil commit's `draw` still reads both, and only step 4 replaces that call with `drawTransient`. Step 3 therefore fails type-check with "Cannot find name 'meteor'" (TS2304), the same class as round 3's CG3-3.
- **Evidence.** Their `draw`: `if (meteor) drawMeteor(ctx, assets, meteor, frame, scrollKept(launchScrollY, scrollY))` (main checkout `src/components/sky/sky.worker.ts:327`, uncommitted). P8 step 3 removes those names; step 4 is "`drawTransient` with `transientFade` in `draw`".
- **Fix.** In step 3, draw each active meteor with `drawMeteor(ctx, assets, transient.body, frame, transientFade(transient, t, scrollY))`, and let step 4 only introduce `drawTransient` (with CG4-1's check); or merge steps 3 and 4.

### CG4-3 (minor): PF's "P8 to P12 read the same either way" is false in three places

- **Section.** PF's files (line 3163: "Every name, signature and value is the confirmed interface's, so P8 to P12 read the same either way"); 8.7 item 4; 8.3 I6; 6.9 (`LaunchGate.ink`, `PlanContext.ink`, "In the worker (P8)").
- **Problem.**
  1. PF exports `segmentTouches` (I6, "Under PF we export it"), while the confirmed interface keeps it private ("Not exported: `segmentTouches`"). P11's clear-sky test is then `segmentTouches` under PF and `quietAt` sampled every 8 px after V: two code paths.
  2. P8's `launchGate` takes `ink` from the worker's `contrastLevels()`, which only the veil commit adds. PF's files don't touch `sky.worker.ts`, and `planLaunch`, which P8 ports, doesn't exist under PF either (H7 already says its order is rebuilt there).
  3. PF step 3 adds `PlanOptions.ink`, but today's `veiledFrom(zones, path)` (`meteors.ts:104-123`) takes no budget, and PF adds no `INK_BUDGET` or `budgetKeeps`, so under PF `ink` has nothing to scale, and `PlanContext.ink`'s doc ("Share of each rect's INK_BUDGET") doesn't hold.
- **Evidence.** COORDINATION.md "Changed shape": "Now private: `fitKeep`, `luminance`, `contrastRatio`. Not exported: `segmentTouches`"; PF files list (line 3163) without `sky.worker.ts`; P8 files (line 3033): "`launchGate` (with `ink` from `contrastLevels()`)".
- **Fix.** Say what differs under PF: add `contrastLevels()` to PF's worker edits (or let P8 read `contrastMore ? CONTRAST_MORE : CONTRAST_NORMAL`); state what `ink` does under PF (for example, scale `METEOR_VEIL.inkKeep` in `veiledFrom` as `drawMeteor` already scales it by `frame.meteorInk`); and either keep `segmentTouches` private under PF too, so P11 has one clear-sky test, or qualify the sentence.

### CG4-4 (minor): facts from the veil's uncommitted tree are presented as confirmed, and H7 depends on two of them

- **Section.** Deviation 8 ("Their commit evaluates it in `updateMeteor` and `draw`, not in the `scroll` handler"); 6.9 ("which `planLaunch` passes today"); 8.6's header "Theirs (confirmed)" and its `scroll`, `layout` and `color.ts` rows; `planMeteorTransient`'s doc; H7.
- **Problem.** These names and behaviors are not in COORDINATION.md's "Confirmed veil interface"; they come from the main checkout's uncommitted code: `pendingLayout` (8.6's layout row), `parseRgbColor`, `lightHeadroom` and `minimumContrast` (8.6's `color.ts` row), where `scrollKept` is evaluated (the interface names the helper and `launchScrollY`, not the call sites), and `planLaunch`'s body. Two of them matter to P8:
  - P8 promises to leave the `scroll` handler untouched (6.9, I3). That holds only if the landed commit keeps the cancel out of the handler, though COORDINATION.md's first reply planned to put it there ("The `scroll` handler: drops or fades a flight once scrollY moves about 16–24 px from launch", line 18).
  - H7 demands equal launches "for the same seed". Their `planLaunch` draws every fresh radiant before planning anything, even when the sticky radiant fits (`while (radiants.length < …) radiants.push(pickRadiant(…))`, then the passes). 6.9's doc ("tried on the visit's sticky radiant, then on up to METEOR.radiantTries fresh ones") reads naturally as a lazy port, which consumes random draws in another order and fails H7's equality on correct behavior.
- **Evidence.** COORDINATION.md lines 70-136 (no `pendingLayout`, no `color.ts` export, no call site for `scrollKept`); main checkout `sky.worker.ts:211`, `:242-243`, `:327`, `color.ts` (uncommitted).
- **Fix.** Label these "observed in their working tree on 2026-10-27; re-check against the landed diff (8.5 step 2)". In 8.6's `scroll` row, say what P8 does if the landed commit cancels in the handler after all (move that test into `updateTransients`; after V the handler is shared). In `planMeteorTransient`'s doc and H7, require the port to draw the fresh radiants up front, in their order, as the landed `planLaunch` does.

### CG4-5 (minor): the overlaps before V are understated

- **Section.** 4.4 ("Changed by both before V: `frameAt` ... and `sameRects`"); the CP-0 message (8.4: "Two functions both of us change before your commit lands"); CP-5; 8.6.
- **Problem.** Before V, both sides also edit:
  - the `LAYERS` literal and its doc: P2 removes `parallax` from the three lines where the veil sets `far.inkKeep` to 0, removes it from `LayerConfig`, and rewrites the doc the veil rewrites;
  - `SceneLevels`: P6 adds `drift` beside the veil's rewritten `meteors` doc;
  - `SkyFrame`: P1, P2, P4 and P6 change fields beside the veil's rewritten `quiet` and `meteorInk` docs;
  - `renderSky.ts`'s `@/lib/sky/scene` import: P1 stops `drawLayer` calling `easedQuietFactor` and the veil moves `drawMeteor` to `transientQuietFactor`, so after the rebase `easedQuietFactor` is imported and unused (`@typescript-eslint/no-unused-vars`, `eslint.config.mjs:13`).
  8.6 already resolves the first three, but 4.4 and the message to the veil session list only two, and CP-5 asks to tell that session "at once about any function both plans change". Its `LAYERS` lines are being edited in the main checkout now.
- **Evidence.** Main checkout `git diff -- src/lib/sky/config.ts` (the `LAYERS` hunk), `scene.ts` (the `SceneLevels` doc), `renderSky.ts` (the `SkyFrame` docs and the import line); P2's files (line 2830).
- **Fix.** Add `LAYERS` and `LayerConfig`, `SceneLevels` and `SkyFrame` to 4.4's list and to the CP-0 message, and the import line to 8.6 (drop `easedQuietFactor` from `renderSky.ts`'s import at the rebase).

### CG4-6 (minor): "from a layout's first frame" ignores the veil's deferred layouts

- **Section.** T3 (line 304: "so it adds no light inside any current padded rect, from a layout's first frame"); AC-24 (line 3372: "no light inside a current padded rect, from a layout's first frame"); 6.11 ("even if a layout changes mid-pass"); H7 and P11's check "no light inside a rect a layout adds mid-pass".
- **Problem.** The veil commit defers a layout that arrives while a quiet ease runs until that ease ends. Until then its rects are not in `quietBlend`, so `transientQuietFactor` cannot protect them: the guarantee holds from the frame the veil applies a layout, which can be up to `QUIET.ease` (0.6 s) after its message. A test that sends a layout mid-ease and checks the next frame would fail on correct code.
- **Evidence.** COORDINATION.md line 108: "a layout that arrives mid-ease waits for the ease to finish, and the newest one wins"; main checkout `settleQuiet` applies `pendingLayout` only once `t - layoutAt >= QUIET.ease`.
- **Fix.** Phrase T3, AC-24, 6.11 and P11's check as "from the frame the veil applies a layout (at most `QUIET.ease` after it arrives)", and build H7's layout events the same way. A satellite moves at most 0.6 × 54 = 32 px in that window.

### CG4-7 (minor): in D1's quiet-root alternatives, the control's `sr-only` name adds an invisible quiet rect

- **Section.** D1 alternatives (a) and (b) ("count it as one more quiet rect of the 64 (`mountSky.ts:37-40`)"); 6.8 "The control".
- **Problem.** The control names itself with `<span className="sr-only">Pause sky animation</span>`. Inside a `data-sky-quiet` root, `quietRects` walks every text node (`mountSky.ts:105-116`, `NodeFilter.SHOW_TEXT`, then `range.getClientRects()`). Tailwind 4's `sr-only` is `position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap`: the text still lays out on one line, overflowing the 1 px box, and `Range.getClientRects()` returns layout boxes, which overflow clipping and `clip-path` don't shrink (CSSOM View). So placements (a) and (b) add a second rect, as wide as the hidden name on one line, beside the control, dimming stars there and carrying the green text's headroom. No `sr-only` text exists in the codebase today, so nothing else hits this. The navbar default is not a quiet root and is unaffected.
- **Evidence.** `node_modules/tailwindcss/dist/lib.js`: `sr-only` = `position absolute, width 1px, height 1px, padding 0, margin -1px, overflow hidden, clip-path inset(50%), white-space nowrap, border-width 0`; `grep -rn sr-only src` finds nothing; https://drafts.csswg.org/cssom-view/#dom-range-getclientrects.
- **Fix.** For (a) and (b), name the button with `aria-label` (the glyph stays `aria-hidden`), so only the button box is measured; or ask the veil session to skip text inside `.sr-only` in `quietRects`. Then "one more quiet rect" holds.

### CG4-8 (minor): module-map phases and two file attributions are off

- **Section.** 5.1; P8's files; P11's rollback.
- **Problem.**
  - 5.1's `renderSky.ts` row lists P1, P2, P4, P6, P8 and P11, but P9 changes `drawMeteor`'s tint (`renderSky.ts:222`) and P12 adds a `drawMeteor` argument. The `catalog.ts` row omits P12 (the planet's catalog entry). The `transients.ts` row says P8 only, though P9, P10, P11 and P12 change it.
  - P8's files put the `heroMeteorMaxScroll` rename under `scene.ts`; the key lives in `config.ts:156` (read at `scene.ts:36`), and P8's `config.ts` entry doesn't mention it.
  - P11's rollback says to remove `'satellite'` "from `TRANSIENT_KINDS` and the registry". While `TransientBodies` keeps `satellite`, the registry's mapped type requires that key (TS2741), whereas 7.2's kill switch, removing it from `TRANSIENT_KINDS` alone, compiles and stops satellites. Removing the kind from `TransientBodies` too brings back CG4-1's single-member union.
- **Fix.** Complete the phase columns, list the rename under `config.ts` as well, and make P11's rollback match 7.2 (or remove the kind from `TransientBodies` with CG4-1's fix in place).

## Scratch evidence

In `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/check-r4-cg/` (not in the repository):

- `tc/`: the type-check project. It holds the main checkout's uncommitted `src/lib/sky`, `renderSky.ts` and `skyAssets.ts`, the plan's sketches and config blocks, and P8's `transients.ts` and `drawTransient`. The one error is CG4-1.
- `never/`: `one.ts` and `two.ts`, the minimal pair for CG4-1; `fix1.ts` and `fix2.ts`, the destructured check, which passes with one and two kinds; `corr.ts`, the union-call check behind the "Checked" notes.
- `h3-veil.ts`, with `ts-resolve.mjs` and `register.mjs` (the plan's 7.1 hook): H3 against the veil's math.
- `idents.py`: the identifier scan.

## Summary

Round 3's six code-grounding fixes all landed. The veil reconciliation holds up on its main points:

- every confirmed export the plan uses matches its confirmed signature and compiles against the veil's working tree;
- the quiet index stays exact against the one-pass `quietFactor` with per-rect keeps;
- P8 can still reproduce the veil commit's launches;
- no private helper is imported.

One major problem blocks a clean gate: `drawTransient`'s exhaustiveness check fails type-check in every single-kind phase (P8 to P10), and the plan's own comment points to the variant that breaks later. A destructured check on `kind` compiles in both cases.

The seven minor findings are:

- a step order in P8;
- PF's overstated sameness;
- facts from the uncommitted tree labeled as confirmed, including the radiant draw order H7 needs;
- the overlaps before V that CP-0 understates;
- the deferred-layout wording in T3 and AC-24;
- the `sr-only` rect in D1's alternatives;
- small module-map slips.
