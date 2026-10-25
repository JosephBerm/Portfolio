# Shared brief: home-sky ambient motion and transients (planning only)

## The user's request (verbatim)

> When the screen is not being scrolled, the stars are very static, still, boring... It doesn't feel like they're "floating around" and just sitting still and there's no effect on the page. I would like for SOME movement at least, even when the screen is not being scrolled. In the previous implementation (before all changes) the stars were moving upward (although it was bad). They don't have to move upward in our new implementation, but I would like to see some physics happen! The background stars and foreground stars would move at different speeds according to physics though, right? I want you to research the physics of it, research the formulas and research in physics to make sure that we're able to get a realistic and clean effect for the background. I want this to feel modern, I want the implementation to follow best practices, and I want it to feel REAL and almost 3D. As if the screen had depth.
> Lastly, lets add more frequency to the comet. It can happen more often, and it can come from different directions, I just want it to be more realistic. Add more than just comets (shooting stars, and other space bodies, etc.)?

Note: what the user calls "the comet" is the existing shooting star (meteor). A real comet is a different object (see the meteors/space-bodies research).

User preferences: domain modeling first; work backwards from the end goal; DRY; separation of concerns; industry best practice backed by OFFICIAL documentation; defensive but not over-engineered; scalable, efficient, performant; FAANG-level solutions; explain complex ideas with simple analogies.

## Repository

- Root: `/home/user/Portfolio` (git; branch `claude/quirky-carson-btv2u4`, based on master 246c0aa). Next.js 16.4.2 (App Router, Turbopack), React 19.3 with React Compiler, TypeScript ~6.0, Tailwind 4, Motion 12. Runtime Node 24 LTS.
- READ FIRST: `AGENTS.md` and `CLAUDE.md` (conventions; strict import rules for the sky worker; `data-sky-quiet`; no Cache Components APIs; verify with `npm run lint` + `npm run type-check`). README.md has the layout.
- Next.js docs for the installed version: `node_modules/next/dist/docs/` (`npm ci` may still be running; if the folder is missing, wait a minute and retry).

### Sky system files
- `src/lib/sky/config.ts`: all worker tunables, heavily documented (layers, twinkle, scene, frame pacing, METEOR, METEOR_VEIL, METEOR_LIGHT, METEOR_LOOK, TRAIN).
- `src/lib/sky/catalog.ts`: deterministic star catalog per 256-px cell per layer (seeded), twinkle noise.
- `src/lib/sky/meteors.ts`: meteor path planning (radiant, angle filter, veil checks), light curve, drag, timing.
- `src/lib/sky/scene.ts`: scroll narrative (hero, reading, end), emergence, quiet zones (`quietAt`, `inkAt`, `quietFactor`, `easedQuietFactor`).
- `src/lib/sky/protocol.ts`: main-thread and worker message types. `random.ts`, `color.ts`: helpers.
- `src/components/sky/sky.worker.ts`: worker state machine and frame scheduler (`frameMode`: active/fade/twinkle/sleep), meteor lifecycle, adaptive quality, raster probe.
- `src/components/sky/renderSky.ts`: draws navy, haze, then three layers (`drawLayer`), and the meteor (`drawMeteor`).
- `src/components/sky/skyAssets.ts`: sprite atlas (Gaussian point-spread sprites per tint and shape), haze bitmap.
- `src/components/sky/mountSky.ts`: main-thread controller (canvas transfer, ResizeObserver, Motion `scroll()`, media queries, quiet-rect measurement).
- `src/components/sky/SkyCanvas.tsx`: the `'use client'` island. `src/components/Background.tsx` + `.module.css`: placement.

### Current behavior (summary; verify in code)
- Three depth layers by magnitude band: far (mag 4.5–6), mid (2.5–4.5), near (−0.5–2.5). Only vertical scroll parallax: each layer moves up by `parallax` × scrollY (far 0.02, mid 0.04, near 0.07).
- With no scrolling, stars are completely static except a slow log-normal twinkle drawn at 15 fps from a timer. Stars are snapped to device pixels (`Math.round`) so resting points stay crisp.
- rAF-driven frames only while a meteor flies or the page scrolls; timer frames for fades and twinkle; sleep otherwise. With no scroll for 90 s the twinkle fades out, meteors pause, and the worker sleeps.
- Scene: full sky in the hero; dimmer and still sky (twinkle 0) while reading; an end bookend.
- Meteors: hero only (scroll ≤ 0.4 viewport heights), one at a time, one radiant beyond the top-right (paths right-to-left, 18–42° below horizontal), first after 4.5–7 s, then gaps of 30 s + Exp(mean 12 s), capped at 75 s, stretched ×1.5 after 3 min. 8% fireballs, flares, persistent trains (under 5 s for WCAG 2.2.2). The narrow-screen limit is 2 per visit.
- The "veil": meteors must light up and peak in clear sky and may only burn out behind `data-sky-quiet` copy (contrast budget so slate body text keeps 4.5:1).
- prefers-reduced-motion: no twinkle, no parallax, no meteors (fades only). forced-colors: sky hidden. prefers-contrast: more: dimmer stars, no haze.
- The OLD implementation the user mentions ("stars moving upward, but bad") is in git history before commit d116918, for example `git show 7c176fb:src/components/Background.tsx`, `git show 7c176fb --stat`, and the removed `src/css/Background.css` (look at `git show 7c176fb^:src/css/Background.css` or find the commit that last had it with `git log --all --oneline -- src/css/Background.css`).

## Concurrent work in another session (coordinate, don't collide)

Another cloud session ("Stars and comment animation redesign", branch `master-r26syw`, not pushed yet) is fixing the **meteor veil**: its rules are too strict (dimming can't start until 65% of the flight), scrolling mid-flight voids the guarantees, star pops when the quiet rects are re-measured mid-ease, a sticky radiant direction, and quiet rects first measured mid-entrance. It is changing `meteors.ts` (`veiledFrom`, `planFlight`), `METEOR_VEIL`, and likely the quiet easing in `sky.worker.ts`/`scene.ts`/`mountSky.ts`. Treat the veil math as that session's. Our plan must work on top of it: flag every interaction (for example, more frequent meteors, several at once, new directions and new transient kinds all have to pass through whatever veil checks exist).

## Rules for every subagent
- PLANNING ONLY: do not modify, create or delete files in the repository. Write only to your output file in `/tmp/claude-0/-home-user-Portfolio/7c5a2177-d394-5f77-a272-2977e744ca02/scratchpad/research/`.
- Back every physics formula, astronomical number and web-platform claim with a primary or official source and its URL (W3C/WCAG Understanding docs, WHATWG HTML, MDN/browser-compat-data, Next.js docs in node_modules, Motion docs, IMO, AMS, NASA, ESA, peer-reviewed papers, textbooks such as HyperPhysics). Mark clearly what is verified fact and what is your judgment.
- Be concrete: numbers, units, formulas, and TypeScript sketches in the codebase's style (tabs, single quotes, no semicolons, `@/` imports, heavily documented config constants).
- End your output file with a "Key recommendations" section (bullets) and a "Risks and open questions" section.
- Your final message back must be a concise summary (at most about 700 words) of your conclusions and the path of your output file.
