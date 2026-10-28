# Separation of concerns: gate round 10

## Scope

- **Role.** One of the four auditors the task calls for, scope "separation of concerns", gate round 10. I confirm that round 9's two SoC fixes landed (SOC9-1, SOC9-2), check what else the round 9 reviser changed for regressions in this lens, recheck the restructure, and sweep the rest of `PLAN.md`. I challenge a rejection only with new evidence.
- **Inputs.**
  - `PLAN.md` as revised after round 9 (3,655 lines, saved 00:16).
  - `HANDOFF.md`, `research/00-shared-brief.md`, `research/01-planning-brief.md`, and `COORDINATION.md` in full. Its "Committed: cf4d7b8", "Landed in the working tree" and "Answers to the planning session's questions" sections are authoritative.
  - `REVIEW-LOG.md` (the round 9 rows and the restructure log) and my round 9 report.
  - The code at cf4d7b8, read from the read-only checkout `.claude/worktrees/sky-baseline-cf4d7b8`.
  - `PLAN.before-r9.md` and `PLAN.before-restructure.md` in the session scratchpad, only to diff what changed.
- **What I audit.** Module boundaries and responsibilities:
  - pure model and policy in `src/lib/sky`, against effects in the worker (animation frames, timers, canvas), main-thread DOM in `mountSky`, and React UI in the pause control;
  - the protocol as the only contract between threads;
  - the scheduler, the kind specs, rendering and the veil kept apart, and config kept apart from logic;
  - the veil's code used through its exports and extended through options (8.4), never its private helpers;
  - leaky abstractions, a growing worker, import cycles and over-engineering.
- **Outputs.** This report and the structured findings.
- **Limits.** Planning only: no edit to `PLAN.md`, `REVIEW-LOG.md`, `src/`, configuration or either checkout. One throwaway script lives in the scratch folder `soc-gate-r10/` (`imports.mjs`, with the round 9 diff `r9diff.txt`). Only blocking or major problems are reported, plus minor ones that are cheap and clearly right.

## Method

1. Read the briefing files and `COORDINATION.md` in full, then all of `PLAN.md`.
2. Word-diffed `PLAN.before-r9.md` against `PLAN.md` (63 hunks) and checked each change through this lens.
3. Checked the SOC9-1 and SOC9-2 dispositions against the text.
4. Read cf4d7b8's `sky.worker.ts`, `renderSky.ts`, `scene.ts`, `meteors.ts`, `mountSky.ts` and `protocol.ts` in full, and the relevant parts of `config.ts`. I checked about 110 `file:line` citations, every one round 9 added among them.
5. Extracted the import lines of every sketch (`imports.mjs`) and checked the runtime import graph for cycles and against 5.2's list.
6. Compared the ownership statements (4.1, 4.2, 4.3, 5.1, 5.2, 8.4) with section 6, each phase's Files list, answer 1's symbol list and the pre-restructure hotspot table.
7. Traced each P12 kind that lives outside the scheduler's machinery (the comet) or adds a rule to it (farewell meteors) through the gate, the clock and the lifecycle events the scheduler gives every transient.

## Round 9's fixes: did they land?

| Finding | Landed? | Notes |
|---|---|---|
| SOC9-1 | Yes | `transients.ts` exports `leaseHeld(schedule)` (2191 to 2194); `inkLeaseFree` reads it (2196 to 2199), and so does step 2.2's D12 hold (2212). 4.2's InkLease row names both and adds "the comet's start rule" as a reader (245). `bodies.ts` owns the start rule as a pure function (332, 2755, 3317), the worker only feeds it, P12's step 1 checks both halves of the hold (3318), and 5.2 adds `./catalog` for `nearness` (350). One residue: the fact list the fix wrote for the start rule is not the launch gate's, and misses part of it (SOC10-1). |
| SOC9-2 | Yes | 8.4's rule names "P3's `frameMode` and `tick`" (3372). The `renderSky.ts` row lists `SkyFrame` whole with P1, P2, P4, P6, P8, P9, P11 and P12 (3384), as 5.1 does (336); the `tick` row lists P2, P3, P5, P6 and P8 (3385); the `frameAt` and `draw` row lists P1 to P8 and P12 (3386). |

## Round 9's other changes, through this lens

- **`LaunchGate.field()`** (2137 to 2138, 2332): the field is built lazily through a closure the worker fills, so `transients.ts` reads no worker state and the field is built only when a kind plans, as cf4d7b8 does (`sky.worker.ts:220-226`). Sound. P12's `room(field)` hold needs it one step earlier (noted below).
- **The sleeping timer** reads `meteorsAllowed(now)`, "the test the gate's `allowed` reads" (2336): one definition of that test.
- **The pointer guards** sit on both sides of the protocol (2794, 2796): the sender sends nothing before the canvas is sized, and the worker ignores a non-finite `at`. Validation at the trust boundary, not duplication.
- **Docs that move with their phase:** `PassOptions`, `planFlight` and `planMeteor` (2596) and `copyReader`'s caveat (3238). 5.1's and 8.4's `mountSky.ts` rows add P9 (338, 3390).
- **Farewell meteors** gain a `starts` option and a `clearOf` band on the planner, and a `room(field)` hold (2754, 3317, 3376). These extend the veil planner through options (8.4's rule), and the hold is a hold, never a failed plan.
- **Trimmed restatements** (6.9's lease paragraph and scroll-cancel bullets, `drawMeteor`'s I7 sentence): each fact survives once, in 4.2, deviation 8 or 8.3.

## The restructure, rechecked

- **Nothing stale.** No V, PF, CP-0, CP-3 to CP-5, 8.5 to 8.7, file-rule or integration-branch wording is left, beyond line 7 (the planning branch) and line 157 (why D10 and D11 are gone).
- **Re-grounded references.** Every one I checked matches cf4d7b8:
  - `sky.worker.ts:1-5`, `:8-13`, `:17-22`, `:24`, `:47`, `:57-58`, `:65-72`, `:92-98`, `:100-128`, `:111-113`, `:117`, `:135-152`, `:143-144`, `:154-160`, `:163-165`, `:167-209`, `:171-187`, `:183`, `:186`, `:190-193`, `:203`, `:212-238`, `:220-226`, `:221`, `:222`, `:226`, `:227-231`, `:233`, `:246-261`, `:264-272`, `:301`, `:305-326`, `:329-342`, `:354-357`, `:361`, `:368-379`, `:373`, `:411`, `:435`, `:436`, `:446`, `:467-493`, `:475-479`, `:486`, `:487`, `:503-509`, `:507`, `:510-524`, `:513`, `:514`, `:519`, `:521`, `:531`, `:533`, `:535`;
  - `renderSky.ts:13`, `:38`, `:39`, `:48`, `:64`, `:71-72`, `:90`, `:93`, `:100`, `:107`, `:113`, `:120`, `:121-125`, `:124`, `:127`, `:155`, `:237`;
  - `scene.ts:11-18`, `:20-23`, `:30`, `:36`, `:60-69`; `protocol.ts:32-38`;
  - `mountSky.ts:3`, `:17-27`, `:40-41`, `:52`, `:84-85`, `:92-97`, `:122-124`, `:211`, `:214`, `:310-314`, `:312`, `:316-326`, `:328-335`, `:332`;
  - `meteors.ts:39-40`, `:195-196`, `:203`, `:204-207`, `:206`, `:208-212`, `:213`, `:215-220`, `:216-217`, `:224`, `:226-228`, `:229`, `:236`;
  - `config.ts:58-59`, `:73`, `:78-80`, `:170`, `:171`, `:222`, `:223-237`, `:231-232`, `:247-250`, `:253`, `:262-271`, `:266`, `:281`, `:286-290`, `:299`, `:305`, `:313`, `:321`.
- **One thing lost.** The pre-restructure hotspot table tracked the worker's import lines as the veil's (`PLAN.before-restructure.md:3497`). 8.4 kept `renderSky.ts`'s imports but not the worker's (SOC10-3).
- **Boundaries.**
  - `imports.mjs` finds no runtime cycle among the sketches. Runtime edges: `transients` to `config`, `meteorKind`, `pacing`, `scene` and (P11) `satellites`; `meteorKind` to `config`, `meteors`, `random`; `satellites` to `config`, `gaps`, `quietIndex`, `radiants`, `random`; `quietIndex` and `presence` to `config` and `scene`. The unnamed `camera.ts`, `pacing.ts` and `radiants.ts` blocks add only `config`, `scene`, `meteors` and `random`, none of which imports back.
  - Kind modules import `./transients` as statement-level `import type` (2080, 2684).
  - The main thread imports only types and `color.ts` from `src/lib/sky`; `skyPause.ts` imports nothing from it (1727). The Navbar and the sky render only on `/` (cf4d7b8 `src/app/page.tsx:6-7`, `:31-32`), so the control's barrel imports never reach `/links`.
  - No sketch imports a veil private helper (`fitKeep`, `luminance`, `contrastRatio`, `segmentTouches`, or `quietEasing` outside the worker).

## Findings

| ID | Severity | Summary |
|---|---|---|
| SOC10-1 | minor | The comet's start rule takes a fact list of its own, not the launch gate, and the comet gets none of the scheduler's first delay or resize drop |
| SOC10-2 | minor | Farewell meteors' visit cap of 2 has no owner: no spec member or per-kind count reads it |
| SOC10-3 | minor | Two ownership labels disagree with answer 1: 4.1 calls `sameRects` ours, and 8.4 omits the worker's import lines |

### SOC10-1 (minor): the comet's start rule re-derives part of the launch gate, and the comet misses the scheduler's first delay and resize drop

**Section.** 6.12 (the static comet row); 5.1 (the `bodies.ts` row); 4.2 (`LaunchGate`, `SkyBody`); 6.9 (`LaunchGate`, `dropTransients`); P12 (Files per kind, Steps); AC-25.

**Problem.**

- **Two gates for one decision.** Every transient starts only through the launch gate the worker fills each tick: `allowed` (full motion, visible, revealed, the visitor present, the hero scene), `settled` (no scroll for `TRANSIENTS.scrollQuiet`), `narrow` and `sinceReveal`, after its spec's `firstDelay`. Round 9's SOC9-1 fix gave the comet's start rule an owner, but over a list of its own: "the visit's draw, the hero scene, a desktop width, full motion, the reveal, `leaseHeld`". That list is a subset of the gate and disagrees with it:
  - **No scroll quiet.** A comet can start mid-scroll. It takes that scroll as its launch scroll, so `scrollKept` retires it within 24 px, and "it is gone for the page view" while still fading in from 0: the visit's one comet is spent unseen.
  - **No presence.** A sleeping worker still ticks for a `layout` or `contrast` message (cf4d7b8 `sky.worker.ts:180-181`, `:537-548`). A comet that starts on such a tick while the visitor is idle fades in with no frames to show it, then appears at full brightness on the next input, against E11 ("nothing jumps").
  - **No first delay.** Every transient waits its spec's `firstDelay` after the reveal, "once the hero entrance and side rails have settled" (`config.ts:252-253`). The comet can start on the first eligible tick after the reveal. cf4d7b8 posts the reveal first (`mountSky.ts:343`) and only then finds and measures the quiet roots (`:346-352`, by a microtask, an observer callback or a timer); until that layout arrives, the worker's zones are init's empty list (`:218-219`, `:272`; `sky.worker.ts:47`). A comet placed on a tick in between is placed against no copy, and its first box test against the hero's rects can fade it out for the page view.
- **The scheduler's lifecycle doesn't reach it.** Hidden tabs and resizes drop every transient, "their paths belonged to the old layout" (2172 to 2173, 2334). The comet is not in `active`, and nothing says what a resize or a hidden tab does to it; P12's worker files name only its state, its pause time, `bodyShowing` and the hand-off (3317).
  - Its placement guards About's header row as computed from H (0.6 H plus About's padding, at `heroLaunchMaxScroll` plus 24 px of scroll). A resize that shrinks H without moving the scroll 24 px leaves that guard stale, and About is unmarked copy that the box test never sees.
  - A hidden tab leaves its fade-in running on the worker clock, so a return mid-fade-in jumps it: the leap P4's hidden-free `twinkleTime` exists to prevent for the twinkle (1667 to 1671).
- **Frames by coincidence.** `FrameDemand` is "what one part of the sky needs from the clock", and `fading` lists the dusk, the quiet ease, the motion ease and, from P6, the thin fade (1215, 3152). Nothing lists the comet's fades, so its 8 s fade-in is drawn only while the drift or the twinkle happens to ask for frames.
- **Why it matters for this lens.** Section 4 says each invariant has one place that enforces it, and 6.1 that the worker keeps only the mechanism. Here the "may a sky event start now" policy has two definitions that disagree, and the lifecycle rules the scheduler owns for transients have no owner for the comet. P12's step 1 checks only the box and the lease hold (3318); AC-25 has no start or resize item (3454).
- **Why minor.** The comet is a could kind, and D4's default is none. Quiet copy stays protected by the box test and `transientQuietFactor`; the costs are a lost or popping comet, and a resize exposure for About's header that depends on geometry.

**Evidence.**

- `PLAN.md`:
  - 2755 (6.12: the start rule "over facts the worker gathers: the visit's draw, the hero scene, a desktop width, full motion, the reveal, `leaseHeld`"; "fading in over at least 8 s"; "it may start to show anywhere up to `heroLaunchMaxScroll`"; "When `scrollKept` reaches 0 it is gone for the page view"; About's row "0.6 H plus About's top padding and header margin");
  - 2128 to 2141 (`LaunchGate`: `allowed`, `settled`, `narrow`, `sinceReveal`); 2109 (`METEOR_SPEC.firstDelay`); 2048 (`TransientSpec.firstDelay`);
  - 2172 to 2173 and 2334 (`dropTransients` on hidden and resize, transients only); 3317 (P12's worker files); 105 to 106 (2.2's hidden and resize rows);
  - 1040 to 1041, 1215 and 3152 (`fading`'s terms); 1667 to 1671 (the hidden-free twinkle clock);
  - 174 (section 4's rule), 832 (6.1's rule), 332 (5.1), 246 and 252 (4.2), 3318 (P12 step 1), 3454 (AC-25).
- cf4d7b8: `config.ts:252-253`; `mountSky.ts:218-219`, `:272`, `:343`, `:346-352`; `sky.worker.ts:47`, `:180-181`, `:537-548`.

**Fix.**

- In 6.12's comet row (and 5.1's `bodies.ts` row), the start rule reads the launch gate the worker already fills each tick instead of a list of its own: `allowed` (and `scene === 'hero'` once farewell meteors add the scene report), `settled`, `narrow` and `sinceReveal`, plus the visit's draw and `leaseHeld`. 4.2's `LaunchGate` row adds the comet's start rule to "Read by".
- It waits a first delay after the reveal (through the gate's `sinceReveal`), a key in the comet's config block whose doc gives the reason (the hero entrance and side rails have settled and been measured), so its placement and first box test see the reveal's zones.
- The worker's `resize` handler retires the comet beside `dropTransients`, since its placement and About guard were for the old viewport. A hidden tab keeps it, with its fade-in on the hidden-free `twinkleTime`.
- `demandNow`'s `fading` covers the comet's fade-in (one term from `bodies.ts`), as P6 adds the thin fade's, so its frames don't depend on the drift's.
- P12's Files gain the worker's `resize` line, and its step 1 checks that no comet starts before its delay, while unsettled or while idle, and that a resize retires it.

### SOC10-2 (minor): farewell meteors' visit cap has no owner

**Section.** 6.12 (the farewell meteors row); 6.9 (`TransientSpec`, `TransientSchedule`, step 2.2); P12 (Files per kind).

**Problem.**

- 6.12 caps farewell meteors at "Up to 2 meteors a visit" and gives that cap as one reason for their own registry entry ("With their own clock and visit cap"). P12 puts "the spec's gap law and visit cap in `config.ts`".
- Nothing reads that key:
  - `TransientSpec` has no cap member, and P12 adds only `clearSky(body)`, `scene` and `room(field)`;
  - `TransientSchedule.launched` counts every kind, for the narrow limit;
  - `nextAfter(body, random, sinceReveal, narrow)` sees no count, and `room(field)` sees only the field.
- So the only way left is a farewell `plan` that returns null once two have flown. Step 2.3 counts that as a failed plan: after `maxFailedPlans` the kind waits for a new layout, and every layout retries it. That turns "no room" into "done for the visit", the misuse step 2.2's holds exist to avoid ("a hold, never a failed plan").
- Section 4 says each invariant has one place that enforces it; this one has none. The same gap was noted, not raised, in my round 9 report; no round has raised or rejected it.
- **Why minor.** Farewell meteors are a could kind, and D4's default is none.

**Evidence.** `PLAN.md` 2754 (6.12: "Up to 2 meteors a visit"; "With their own clock and visit cap they get their own registry entry"); 3317 (P12: "the spec's gap law and visit cap in `config.ts`"); 2046 to 2065 (`TransientSpec`'s members); 327 (5.1: P12 adds `clearSky(body)`, `scene` and `room`); 2150 to 2151 (`launched`: "narrow screens stop at TRANSIENTS.narrowLimit"); 2209 (step 2.2's narrow-limit hold); 2214 (a null plan counts toward `maxFailedPlans`); 174 (section 4's rule). Round 9's note: `audit/separation-of-concerns-gate-r9.md:178`.

**Fix.** Give the cap one place, beside the narrow limit:

- `TransientSpec.limit?: number`, the launches of this kind a visit may have (farewell meteors 2, from their config block);
- a per-kind count in `TransientSchedule` (`launched` stays the total the narrow limit reads);
- step 2.2 holds a kind that has reached its limit: a hold, never a failed plan.

5.1's `transients.ts` row and P12's farewell files name the member and the count.

### SOC10-3 (minor): two ownership labels disagree with answer 1

**Section.** 4.1 (the module diagram); 8.4 (the `sky.worker.ts` rows).

**Problem.**

- **4.1 calls `sameRects` ours.** The diagram groups "`SceneLevels, sceneAt, sameRects` (ours)" against the veil's quiet math. But `sameRects` is answer 1's symbol, and answer 2 lets us move it only "as long as it keeps comparing `headroom`". 8.4 lists it as a veil symbol with that condition, as do 6.4 and P1. A reader of 4.1 alone would take it as free to change.
- **8.4 omits the worker's import lines.** 8.4 says "The symbols are answer 1's", and its `renderSky.ts` row lists "the imports". Answer 1 lists the worker's too ("the imports, `LayoutMessage`, `pendingLayout` and `launchScrollY`"), and P1 to P8 and P12 change them: P1's `sameRects` import, P2's camera, P3's pacing, P4's presence, P8 dropping the meteor imports the schedule takes over, P12's `bodies.ts`. No `sky.worker.ts` row names them. The pre-restructure hotspot table did ("merge the imports, theirs kept"), so this is a restructure loss. CP-1 rechecks 8.4's rows when a sky commit lands, so a follow-up that touches the worker's imports would find no row.
- **Why minor.** Labels: P1, 6.4 and 8.4 all state the `headroom` condition, and an import conflict is easy to resolve.

**Evidence.** `PLAN.md` 201 (4.1: "`scene.ts    SceneLevels, sceneAt, sameRects (ours)`"); 3387 (8.4: `sameRects` "moved to `scene.ts`, still comparing `headroom`"); 1495 (6.4) and 2968 (P1); 3372 ("The symbols are answer 1's"); 3384 (the `renderSky.ts` row: "the imports"); 3385 to 3389 (no worker row names them); 2976 (P1 changes the worker's imports); 400 (section 6: "the meteor imports P8's schedule takes over from the worker"). `COORDINATION.md`:177 to 179 (answer 1's worker list) and :189 (answer 2's condition). cf4d7b8 `sky.worker.ts:7-14` (the import lines). `PLAN.before-restructure.md:3497` (the dropped hotspot row).

**Fix.**

- 4.1: move `sameRects` to the veil column, for example "…, `scrollKept` and `sameRects`, moved here in P1 (veil)".
- 8.4: add "the imports" to a `sky.worker.ts` row: "they change with what each phase reads (5.1); P8 drops the meteor imports the schedule takes over", phases P1 to P8 and P12.

## Summary

**Verdict: pass.** No blocking or major finding in this scope.

Round 9's SoC fixes landed:

- the ink lease has one query (`leaseHeld`), read by `inkLeaseFree`, step 2.2 and the comet;
- the comet's start rule has an owner in `bodies.ts`;
- 8.4's Phase column now matches the phases' Files lists.

Round 9's other changes keep the boundaries:

- the lazy `field()` keeps worker state out of `transients.ts`;
- the pointer is validated on both sides of the protocol;
- the farewell guards extend the planner through options and hold instead of failing.

The restructure leaves nothing stale, and every citation I checked matches cf4d7b8. The sketches have no runtime import cycle and import no veil private helper.

Three cheap minors remain, two of them in P12's could kinds:

- SOC10-1: the comet's start rule should read the launch gate (presence, the scroll quiet), wait a first delay, and the comet needs a resize rule.
- SOC10-2: the farewell visit cap needs a reader.
- SOC10-3: two ownership labels (`sameRects` in 4.1, the worker's imports in 8.4) should follow answer 1.

## Noted, not raised

- **Farewell meteors' band, for the coordination lens.** 6.12 puts the band "above the highest quiet zone in the page's flow (Contact's first line)". The hero's rects are also in the page's flow: cf4d7b8 measures every flow root in document coordinates (`mountSky.ts:231`), and the field keeps them, shifted by the scroll (`scene.ts:60-69`, `sky.worker.ts:226`). Read literally, the rule picks the hero's first line, far above the screen in the end scene, and the band protects nothing. CA9-1's own wording was "the highest quiet zone on screen"; "the highest flow zone on screen" would say what is meant.
- **`field()`'s doc and P12's `room(field)`.** "The launch step calls it only when it plans" (2137) stops holding once step 2.2's farewell hold needs the field before planning. A wording change in P12.
- **`meteorsAllowed`** keeps a meteor name while, from P8, it gates every kind (2336). For the conventions lens.
- **The comet's placement reads `LEAN.reach`** (2755), which doesn't exist if D3 skips P7 ("If D3 skips the lean, none of them exists", 825).
- **Carried, outside `PLAN.md`.** `harness/README.md:3` still cites "`PLAN.md` 8.5 step 5" and checkpoint V; P9's verification already tells the implementer to follow its own list instead (3257).
