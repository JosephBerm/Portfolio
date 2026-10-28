# Fold check after round 12

Date: 2026-10-28.

## Scope

- **Role.** Fold checker after round 12. Round 12's reviewers raised no blocking or major finding, and the reviser then applied 11 minor fixes (7 from the checkers, 4 from the gate audits). Nobody had reviewed those edits. I diffed the plan as round 12 read it against the plan now, and checked every changed hunk through all eight lenses: physics and math, code grounding, coordination and accessibility, completeness, Next.js docs, conventions, DRY, and separation of concerns. I recomputed every number a hunk changed. Text the hunks didn't touch is out of scope.
- **Inputs.**
  - `HANDOFF.md`, `research/00-shared-brief.md`, `COORDINATION.md` (all of it) and `research/01-planning-brief.md`.
  - `scratchpad/PLAN.before-r12.md` against `PLAN.md`: 13 hunks, +27 and −17 lines, 60,054 to 60,168 words (the count `REVIEW-LOG.md` gives).
  - `REVIEW-LOG.md` ("Round 12" and "Gate round 12"), the four `drafts/check-r12-*.md` reports and the four `audit/*-gate-r12.md` reports.
  - The code at cf4d7b8: the worktree's `src/` (`git diff cf4d7b8 HEAD -- src/` is empty).
  - The Next.js 16.4.2 docs in the main checkout's `node_modules/next/dist/docs` (read only).
  - `harness/veil-confirm-final-1.tar.gz`, extracted afresh into my scratch folder and read only as data.
  - The code-grounding checker's P10 prototype and misbuilds (`scratchpad/cg12/p10`, `p10ctx`, `p10mis`, `run/`).
- **Outputs.** This file and the structured findings.
- **Limits.** Planning only. I edited nothing in `src/`, `PLAN.md`, `REVIEW-LOG.md`, `harness/` or either checkout. My scratch work is in `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/fold-r12/`, and the diff is `C:/Users/josep/AppData/Local/Temp/claude/S--Documents-repos-Portfolio/a0e9de06-a28e-4f61-8721-ce75a333fee7/scratchpad/r12-fold-diff.txt`.

## Method

1. Ran `git diff --no-index`, as a line diff and as a word diff, and mapped each hunk to the round-12 finding it answers:
   - C76 and DRY-R12-1;
   - NJ12-1;
   - SOC12-1 and CONV12-1;
   - CA12-1 and CA12-2;
   - CG12-1, CG12-2 and CG12-3 with C75.

   All 11 dispositions in `REVIEW-LOG.md` show up in the diff, and nothing else changed.
2. Read each hunk in its section and checked every name, `file:line` and claim:
   - code at cf4d7b8: `renderSky.ts:204-260`, `config.ts:147`, `:153` and `:384-392`, `scene.ts:56-189`, `meteors.ts:13-17`, `sky.worker.ts:218-232`, `mountSky.ts:82-87`;
   - the docs file `01-app/03-api-reference/08-turbopack.md`, lines 126-134 and 476-482;
   - the archive's `transpile.mjs`, `lib.mjs`, `sim2.mjs` and `check11/render3-canvas.mjs`, and `harness/README.md`.
3. Cross-read every other place the edits reach: T3, I9, H7, AC-30, 6.11, 6.12, 7.0, 7.2, P9 to P12, 5.1 and 8.4. I also checked the dependency claims for P12's comet against the names its row uses (`LaunchGate` at `PLAN.md:2138-2151`, `leaseHeld`, `DRIFT_REACH`, `zoneReaches`, `fadeOutAt`, `twinkleTime`, `TRANSIENTS.cancelFade`).
4. Recomputed P10's "12 and 32%" on the archived layouts with the code-grounding checker's P10 prototype. I used its own seeds and two fresh seed sets, and ran P10's revised assertion on the two misbuilds CG12-1 described (`fold-r12/run/h-order-seeds.ts`, output `fold-r12/run/fold-order.txt`).
5. Checked the edited code sketches against the conventions:
   - tabs, and lines of 120 columns or less (the widest new line is 120);
   - multi-line field docs, as cf4d7b8's `SkyRect.headroom` has (`protocol.ts:24-28`);
   - no em dashes in any added line;
   - no plan cross-reference beyond the sketches' usual phase tags.

## Hunk by hunk

| # | Where (`PLAN.md`) | Change | Answers | Verdict |
|---|---|---|---|---|
| 1 | T3 (`:300`) | The wake is now "veiled only at its gradient stops (`METEOR_LOOK.wakeStops`, cf4d7b8 `renderSky.ts:221-240`)", where it used to say "(6.12)". | C76, DRY-R12-1 | Holds. `renderSky.ts:221-227` builds `METEOR_LOOK.wakeStops` stops (9, `config.ts:392`). `:240` adds each stop as `stop.light * kept(stop.point)` to one linear gradient, so the veil is sampled only at the stops. The glow and core are sampled at the head (`:252`). The loop between T3 and 6.12 is gone. I9 (`:3380`) and AC-30 still agree with T3. |
| 2 | 5.2 Bundling (`:366`) | The doc path gains `01-app/`. | NJ12-1 | Holds. In `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md`, line 130 is the magic-comments sentence naming `new Worker()` expressions, and line 482 is `turbopackWorkerAssetPrefix` ("entrypoint + module chunks"). Section 13 (`:3601`) gives the same path. `mountSky.ts:84-85` is the worker entry. |
| 3 | `SkyField.pinned` doc (`:2002-2006`) | The rails are "the very objects `quiet` holds for the rails, so `quiet` without them is the copy in the page's flow", in a multi-line doc. | SOC12-1, CONV12-1 | Holds. The contract now sits on the boundary type that the worker writes and the farewell band (6.12, `:2765`) reads. It is true from P9, which builds the lists that way, and names no later phase. The format follows cf4d7b8's `SkyRect.headroom`. Lines are 115 and 116 columns. |
| 4 | 6.9 worker `field()` bullet (`:2343`) | From P9 the bullet pads the rails once and puts those objects in both lists, with a comment on identity. | SOC12-1 | The design holds. `screenQuietZones(zones, scrollY, pinned = [])` returns `[...zones padded by scrollY, ...pinned padded by 0]`, and `pad` makes new objects on every call (`scene.ts:60-69`). So `screenQuietZones([], scrollY, pinned)` gives exactly the padded rails, ready to share. `sky.worker.ts:226` is today's field. One citation drifted (FC12-1). |
| 5 | `PlanOptions.clearOf` doc (`:2592-2597`) | Rewrapped into a multi-line doc. | CONV12-1 | Holds. The words are unchanged (word diff), and lines are 111 to 116 columns. |
| 6 | `CLEAR_SKY_KEEPS` doc (`:2679-2684`) | The doc now says what the keeps give "a point of light ... sampled at its center and at most QUIET.padding in radius". | CA12-1 | Holds, in every lens; see "Physics of hunk 6" below. It names no kind and no later phase, so it is true from P11 and needs no edit in P12 (7.0, `:2836`). It promises nothing for burst or earthgrazer wakes, which T3 keeps apart through T7. Lines are 119 and 120 columns. |
| 7 | 6.11 satellite drawing (`:2755`) | Cuts the restatement of T3. | CA12-1 (cut) | Holds. The same sentence still multiplies the alpha by `transientFade` (condition b) and by `transientQuietFactor(..., CLEAR_SKY_KEEPS)` at the drawn position (condition a). |
| 8 | 6.12 variants paragraph (`:2771`) | Cuts "and T7, since all three are meteors, keeps them apart from a lease holder". | DRY-R12-1 | Holds. The paragraph still says that T7 keeps them from overlapping another meteor, and T3 says how they stay apart from a lease holder. Nothing is lost. |
| 9 | 7.2 P12 row (`:2949`) | "P10 (comet: P8; planet: P2)". | CG12-3, C75 | Holds. The meteor variants are `METEOR_KINDS` entries decided in P10's step, and farewell meteors call P10's second argument (`:2765`, `:3328`). The comet reads nothing from P9 or later (see the note under hunk 13). |
| 10 | P9 archived-harness bullet (`:3268`) | `PLAN` drops from the paths to point, `sourceOf` returns the working-tree file for every tree, and "`base` is now the same files". | CG12-2 | Holds against the archive. `transpile.mjs:15` `PLAN` is read only at `:30`, inside `sourceOf`, so once `sourceOf` returns the working tree nothing reads it, and nothing writes there. `:20-31` reads `git show HEAD:` for `base` always, and for `plan` and `before` when their folders lack the file. `:44` builds all four trees. `lib.mjs:17` loads `base` without condition. `sim2.mjs:79` loops over `['base', 'proto']` regardless of `TREES`, so its base rows must be dropped by hand, as the bullet says. `TREES` is read by `check11/render3-canvas.mjs:19`. P9 step 3 adds `gaps.ts` (`:3246`, `:3255`). |
| 11 | P10 verification (`:3298`) | Asserts `nearCopy` false on the decided fireball's try, and adds forced-decision runs on 1280 × 720 and 1024 × 768, "where 12 and 32% of decided fireballs find no path". | CG12-1 | Holds; recomputed below. `METEOR_KINDS.fireball.after` (20) exists (`:3292`), and `PlanContext.sinceReveal` is P10's (`:2048`, `:3280`). P9's bullet defines "a fresh `PlanContext` per launch" as a fresh `createMeteorMemory()` with `nearCopy` true (`:3268`), so the 120 s spacing never blocks a forced decision. |
| 12 | P10 rollback (`:3301`) | Adds "(P12's meteor kinds depend on it)". | C75 | Holds. P12's "Blocked on" spells out the meteor kinds it means (farewell meteors included), as 7.0 asks a rollback to do (`:2850`). |
| 13 | P12 "Blocked on" and verification (`:3327`, `:3331`); AC-30 (`:3471`) | "P10 for the meteor kinds (...), P8 for the comet; the planet, a star, could follow P2"; P12 names AC-30 for the point flash; AC-30's phases add P12. | CG12-3, C75, CA12-2 | Holds. 7.2's row and the "Blocked on" line agree. AC-30's pass rule already names the point flash, and P12 ships it. |

**The comet's dependency (hunks 9 and 13).** Everything the comet's row and P12's step 1 use lands in P8 or earlier:
- `LaunchGate.allowed`, `settled`, `narrow` and `sinceReveal` (`:2138-2151`, with no later phase tag);
- `leaseHeld` and `TRANSIENTS.cancelFade` (P8);
- `fadeOutAt` and `DRIFT_REACH` (P6, which P8 depends on, `:2945`);
- `twinkleTime` (P4), `demandNow`'s `fading` (P3), `zoneReaches` and `ZONE_REACH` (P1);
- `scrollKept`, `transientQuietFactor`, `METEOR.top` and `SCROLL_CANCEL` (cf4d7b8).

`LaunchGate.bodyShowing` and `bodies.ts` are its own. The lean applies only with P7, and `CLEAR_SKY_KEEPS` comes from P11 or the comet's own phase, as the row says. So "P8 for the comet" is complete.

## Physics of hunk 6

The doc says that a point of light drawn with `{ quietKeep: 0, inkKeep: 0 }`, sampled at its center, keeps none of its light inside a padded quiet rect, even mid-ease or when a layout changes under it. So it never shares a contrast budget with the transient that holds the lease. Checked against cf4d7b8:

- `quietFactor` with these keeps gives `1 − zoneQuiet`. That is 0 inside a padded zone and `smoothstep(0, 40, d)` at `d` px outside it (`scene.ts:72-77`, `:131-141`).
- `transientQuietFactor` takes the minimum of the eased factor and the factor of `to` while easing, and of `next` when one waits (`:156-160`). So the factor is 0 at a sample inside any padded rect of `to` or `next`, from the frame a layout arrives.
- A center outside every padded rect lies more than `QUIET.padding` (32 px) from the copy, so a sprite of radius at most 32 px adds no light on the copy. A center inside one keeps nothing. Either way it adds nothing to any rect's ink budget.

This is COORDINATION.md answer 3, condition a.

## Recomputed numbers

**P10's "12 and 32%" (hunk 11).** These runs use the code-grounding checker's prototype of P10 as planned: 4 steers; a decided fireball tried with `{ fireball: true, flights: 'long' }` on `{ ...context, nearCopy: false }`, then `planMeteorTransient(context)`. Each launch gets a fresh `createMeteorMemory()`, with `nearCopy` true, `sinceReveal` 100 and `METEOR_KINDS.fireball.chance` set to 1 in memory. Fields are built from the archived captures with the rails' objects shared by `quiet` and `pinned`. Output: `fold-r12/run/fold-order.txt`.

| Seeds | Decided fireballs with no path at 1280 × 720 | At 1024 × 768 | Order violations, as planned |
|---|---|---|---|
| The checker's (0x5eed + i), 2,000 | 11.7% | 32.2% | 0 on all six layouts |
| 1,000,000 + i, 5,000 | 12.4% | 32.2% | 0 |
| 7,777,777 + i, 5,000 | 12.4% | 30.0% | 0 |

The plan's "12 and 32%" is a fair reading: 12 to 12.4%, and 30 to 32% at 1024 × 768 across seeds. Both layouts make fireballs fail often enough for the order check to bite.

**The revised assertion catches both misbuilds.**

| Misbuild | Flagged launches |
|---|---|
| CG12-1's second misbuild (`p10ctx`): the fireball try on the context's own `nearCopy` | 2,000 of 2,000 on every layout (it passed P10's old check everywhere) |
| CG12-1's first misbuild (`p10mis`): CG11-1's plainest build, with `fireball` on every call of the pass loop and the context's `nearCopy` | 2,000 of 2,000 on every layout |

In `p10mis`, the `nearCopy` clause now flags it even where fireballs always fit. A variant that set `nearCopy` false but kept `flights: 'both'` would still fail on the two named layouts, through the long-only clause (CG12-1's own run: 234 and 645 of 2,000).

**Other figures.**
- Word count: 60,054 to 60,168, matching the log.
- The widest new doc line is 120 columns, against 218 for cf4d7b8's `utils.ts:4` (no `max-len` in `eslint.config.mjs`).

## Findings

One minor finding. No blocking or major one.

### FC12-1 (minor): the worker bullet cites 6.10 for `SkyField.pinned`'s doc, which is in 6.9

- **Section.** 6.9, "In the worker (P8)", the `field()` bullet (`PLAN.md:2343`).
- **Problem.**
  - SOC12-1's fix ends the bullet with "with a comment that readers tell the rails apart by identity (`SkyField.pinned`'s doc, 6.10)".
  - `SkyField.pinned`'s doc is in 6.9's "Types" block (`:2001-2008`), in the same section as the bullet. 6.10 has no `SkyField` doc, and it points back to 6.9 for the field (`:2628`: "the meteor kind passes the padded rails (`SkyField.pinned`, 6.9)").
  - The "6.10" is the old bullet's citation for the rails' role ("for both `quiet` and `pinned` (6.10)"), merged into the new parenthetical. A reader who follows it to 6.10 finds only a pointer back: the same 6.9 to 6.10 to 6.9 loop that C76 just took out of T3.
  - Nothing gets built differently: P9's files (`:3248`) cite 6.9, and the doc is 340 lines up in the same section.
- **Evidence.** The word diff of the bullet: `[-for-] {+and puts those objects in+}` ... `[-`pinned` (6.10).-] {+`pinned`, with a comment that readers tell the rails apart by identity (`SkyField.pinned`'s doc, 6.10).+}`. Also `PLAN.md:2001-2008` and `:2628`.
- **Fix.** Write "(`SkyField.pinned`'s doc above)", or "(`SkyField.pinned`'s doc in the types above; the rails as `clearOf`, 6.10)" to keep the pointer to the rails' rationale.

## Noted, not raised

- **The first clause of `CLEAR_SKY_KEEPS`' doc** ("Quiet keeps for transients that never take the ink lease") predates round 12. The static comet, which 6.12 calls "Not a transient", also draws with these keeps (6.12, `:2766`). The comet's row says so explicitly, and the new doc promises the comet nothing false, so nothing gets built wrong.
- **The unchanged wording "adds no light inside any padded rect"** for satellites and the point flash, in T3, H7, AC-30 and P11's verification, is the veil's own answer-3 wording. It is exact for the sample at the center. The footprint, up to 32 px, can put faint light into the padding band after a layout moves copy toward it, but never onto the copy.
  - The new `CLEAR_SKY_KEEPS` doc's "keeps none inside a padded quiet rect" is the more careful phrasing.
  - The checks H7 and P11 describe read the factor at the drawn position, so they pass as written.
- **README step 2** (`harness/README.md:37`) still lists `transpile.mjs`'s `PLAN` among the paths to edit. P9's bullet now leaves it alone, which is harmless: once `sourceOf` returns the working tree, nothing reads `PLAN`, and the script never writes there.
- **Outside this check's scope.** `HANDOFF.md`'s status lines still describe the work "through gate round 10" (`:3`, `:47`).

## Verdict

**Pass.** All 11 round-12 fixes landed as `REVIEW-LOG.md` describes them, and they agree with the code at cf4d7b8, the archived harness, the Next.js 16.4.2 docs and `COORDINATION.md`. The one changed number (12 and 32%) reproduces within seed noise, and the revised P10 check catches both misbuilds it targets. One minor cross-reference slip remains (FC12-1).
