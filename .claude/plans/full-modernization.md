# Portfolio Full Modernization Plan
## Vite SPA → Next.js 16 + React 19 + Tailwind CSS 4 + Motion + TS 6.0 + ESLint 10

---

## Phase 1: Project Scaffolding & Core Infrastructure

### 1.1 — Initialize Next.js 16 project
- Create a fresh Next.js 16 app with App Router, TypeScript 6.0, Tailwind CSS 4, and ESLint 10
- Use `npx create-next-app@latest` with flags: `--typescript --tailwind --eslint --app --src-dir`
- This gives us the correct Next.js 16 + React 19 + TS 6.0 + Tailwind 4 + ESLint 10 flat config scaffold out of the box
- Target output directory: temporary `next-portfolio/` to scaffold, then migrate files back

### 1.2 — Migrate package.json
**Remove (Vite-era dependencies):**
- `vite`, `@vitejs/plugin-react`, `file-loader`, `@svgr/webpack`
- `font-awesome` (v4.7.0 → replace with `@fortawesome/fontawesome-free` v6.x or `@fortawesome/react-fontawesome`)
- `web-vitals` (v2 → Next.js has built-in analytics)
- `classnames` (replaced by Tailwind's `cn()` utility pattern with `clsx` + `tailwind-merge`)

**Add (Next.js 16 era):**
- `next` (^16.x), `react` (^19.x), `react-dom` (^19.x)
- `motion` (^12.x) — formerly framer-motion
- `tailwindcss` (^4.x), `@tailwindcss/postcss`
- `clsx` + `tailwind-merge` (for `cn()` utility)
- `zustand` (keep ^5.x — already compatible)
- `lodash-es` (tree-shakeable replacement for `lodash`)
- `@fortawesome/fontawesome-svg-core` + `@fortawesome/free-solid-svg-icons` + `@fortawesome/react-fontawesome`

**Dev dependencies:**
- `typescript` (^6.0), `@types/react` (^19.x), `@types/react-dom` (^19.x)
- `eslint` (^10.x), `eslint-config-next`
- `@types/lodash-es`

### 1.3 — Configuration files
- **`next.config.ts`**: Configure images, metadata, redirects. Enable React Compiler if available.
- **`tsconfig.json`**: Next.js 16 generates this. Preserve existing path aliases (`@/*` → `./src/*` etc.)
- **`eslint.config.mjs`**: ESLint 10 flat config (replaces the `eslintConfig` in package.json)
- **`postcss.config.mjs`**: Required for Tailwind CSS 4 with Next.js
- **Remove**: `vite.config.ts`, `vite-env.d.ts`

### 1.4 — Project structure migration
```
Current (Vite SPA)              →  Next.js 16 App Router
─────────────────────────────────────────────────────────
index.html                      →  src/app/layout.tsx (metadata, fonts, scripts)
src/index.tsx                   →  REMOVED (Next.js handles root rendering)
src/App.tsx                     →  src/app/page.tsx (home page)
src/components/                 →  src/components/ (keep as-is, convert to Tailwind)
src/common/                     →  src/components/icons/ (SVG components)
src/store/                      →  src/store/ (Zustand works client-side)
src/services/                   →  src/lib/ (rename for Next.js convention)
src/css/                        →  REMOVED (replaced by Tailwind classes)
src/assets/                     →  public/ (images) + src/assets/ (imports)
src/types/                      →  src/types/
```

---

## Phase 2: Core Framework Migration (Next.js 16 + React 19)

### 2.1 — Create `src/app/layout.tsx`
- Root layout with `<html>`, `<body>`, metadata export
- Move SEO meta tags from `index.html` into Next.js metadata API
- Configure custom fonts (Fira Sans, Golos, Fira Code, STechMono) via `next/font/local`
- Import global Tailwind CSS (`@import "tailwindcss"` in `globals.css`)
- Add Font Awesome 6 Kit script or switch to react-fontawesome components

### 2.2 — Create `src/app/page.tsx`
- This is the home page, replacing `App.tsx`
- Mark as `"use client"` since it uses `useState`/`useEffect` for loading state
- Keep the same component composition: Background, Navbar, sidepanes, sections, footer
- Replace CSS animation loading with Motion `AnimatePresence` + `motion.div`

### 2.3 — React 19 upgrades across all components
- **Remove** `import React from 'react'` (no longer needed in React 19 with the new JSX transform)
- **Replace** `React.FC` type annotations with plain function return types
- **Replace** `useContext` → `use(Context)` where applicable (Zustand store doesn't use Context directly)
- **Remove** any `forwardRef` wrappers (ref is now a regular prop in React 19)
- **Leverage** React Compiler (automatic memoization — no manual `useMemo`/`useCallback` needed)

### 2.4 — Convert `.js` files to `.ts`
Files to convert:
- `src/services/elementObserver.js` → `src/lib/elementObserver.ts` (add types for sections, thresholdMap)
- `src/services/router.js` → `src/lib/router.ts` (add Route interface, type the sections)
- `src/reportWebVitals.js` → REMOVE (Next.js built-in)
- `src/setupTests.js` → REMOVE (or convert if testing is kept)
- `src/assets/Logo.jsx` → `src/components/icons/Logo.tsx`

---

## Phase 3: Tailwind CSS 4 Migration

### 3.1 — Setup Tailwind CSS 4
- Tailwind v4 uses CSS-first config: `@import "tailwindcss"` + `@theme { }` in `globals.css`
- **No** `tailwind.config.js` needed
- Define design tokens via `@theme` directive using existing CSS custom properties:
  ```css
  @import "tailwindcss";

  @theme {
    --color-navy: #0a192f;
    --color-light-navy: #112240;
    --color-dark-navy: #020c1b;
    --color-slate: #8892b0;
    --color-light-slate: #a8b2d1;
    --color-lightest-slate: #ccd6f6;
    --color-green: #64ffda;
    --color-green-tint: rgba(100, 255, 218, 0.1);
    --font-sans: 'Golos', 'FiraSans', Arial, Helvetica, sans-serif;
    --font-mono: 'firaCode', 'STechMono', 'Courier New', monospace;
    /* ... etc */
  }
  ```

### 3.2 — Create `cn()` utility
```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3.3 — Component-by-component CSS → Tailwind conversion
Each component gets its CSS converted to Tailwind utility classes inline. Order of conversion:

1. **Global styles** (`App.css` → `globals.css` with `@theme` + `@layer base {}`)
2. **Navbar** (`Navbar.css` → Tailwind classes on Navbar.tsx)
3. **HeroSection** (`HeroSection.css` → Introduction.tsx)
4. **AboutSection** (`AboutSection.css` → AboutMe.tsx)
5. **JobsSection** (`JobsSection.css` → Experience.tsx)
6. **ProjectsSection** (`ProjectsSection.css` → Projects.tsx + FeaturedProject.tsx)
7. **OtherProjectsSection** (`OtherProjectsSection.css` → OtherProjects.tsx + Card.tsx)
8. **ContactSection** (`ContactSection.css` → ContactMe.tsx)
9. **SidePanes** (`SidePanes.css` → LeftSidePane.tsx + RightSidePane.tsx)
10. **Background** (`Background.css` → Background.tsx)
11. **AppFooter** (`AppFooter.css` → AppFooter.tsx)
12. **Logo** (`Logo.css` → LoadingLogo.tsx + Logo.tsx)
13. **Animate** (`Animate.css` → Motion animations or Tailwind `@keyframes`)
14. **Fonts** (`Fonts.css` → `next/font/local` in layout.tsx)
15. **normalize.css** → REMOVE (Tailwind's preflight replaces it)

### 3.4 — Keep CSS custom properties for complex animations
Some animations (card gradient rotation, loading spinner, star background) are complex enough to keep as custom CSS in `globals.css` using `@layer components {}` or `@layer utilities {}`.

---

## Phase 4: Motion (formerly Framer Motion) Integration

### 4.1 — Install & configure Motion
- Import from `"motion/react"` (NOT `"framer-motion"`)
- All components using Motion must be `"use client"` components

### 4.2 — Replace CSS animations with Motion
- **Loading page**: `AnimatePresence` + `motion.div` fade-out instead of CSS `animation: fade-out`
- **Section reveal on scroll**: Replace IntersectionObserver CSS toggle with `motion.section` + `whileInView`
- **Hero section stagger**: Replace CSS `fadeup-enter` delays with Motion `staggerChildren`
- **Navbar show/hide on scroll**: `motion.header` with `animate` based on scroll direction
- **Mobile nav overlay**: `AnimatePresence` for open/close transitions
- **Card hover effects**: `motion.div` with `whileHover` scale/glow
- **Page transitions**: `AnimatePresence` wrapping route content

### 4.3 — Create reusable animation components
```tsx
// src/components/motion/FadeInSection.tsx - scroll-reveal wrapper
// src/components/motion/StaggerContainer.tsx - staggered children
// src/components/motion/PageTransition.tsx - page enter/exit
```

---

## Phase 5: ESLint 10 + TypeScript 6.0 + Tooling

### 5.1 — ESLint 10 flat config
- Create `eslint.config.mjs` using `defineConfig()` with `extends`
- Include: `eslint-config-next`, TypeScript-aware rules, React 19 rules
- Remove legacy `eslintConfig` from `package.json`
- Remove `browserslist` from `package.json` (not used by Next.js)

### 5.2 — TypeScript 6.0 settings
- Next.js 16 generates a compatible `tsconfig.json`
- Preserve path aliases: `@/*`, `@/components/*`, etc.
- Enable `strict: true`, `noUncheckedIndexedAccess: true`
- Set `moduleResolution: "bundler"` (Next.js default)

### 5.3 — Scripts update
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc --noEmit"
}
```

---

## Phase 6: Enhancements & Cleanup

### 6.1 — Font Awesome upgrade (4.7 → 6.x)
- Replace CDN `<script>` with `@fortawesome/react-fontawesome` components
- Or use `@fortawesome/fontawesome-free` v6 CSS if simpler
- Update icon class names: `fa` → `fa-solid`, etc.

### 6.2 — Image optimization
- Move images to `public/images/` or use Next.js `<Image>` component
- Replace `<img>` tags with `next/image` for automatic optimization, lazy loading, WebP/AVIF

### 6.3 — SEO enhancements
- Use Next.js Metadata API (`export const metadata` in layout.tsx)
- Add `robots.txt`, `sitemap.xml` via Next.js conventions
- Open Graph images with `opengraph-image.tsx`

### 6.4 — Remove dead code
- Remove `@svgr/webpack` (not needed — SVGs are already TSX components)
- Remove `file-loader` (Next.js handles assets)
- Remove `web-vitals` (Next.js built-in)
- Remove `reportWebVitals.js`, `setupTests.js`, `App.test.js`
- Remove all 16 CSS files after Tailwind migration is complete
- Remove `classnames` package (replaced by `cn()`)

### 6.5 — Node.js engine pinning
- Add `"engines": { "node": ">=22.0.0" }` to `package.json`
- Add `.nvmrc` with `22` (or `24` if team is ready)

---

## Execution Order (Suggested)

Given the scope, execute in this order to maintain a working app at each step:

1. **Phase 1** — Scaffold Next.js 16 project alongside, copy configs
2. **Phase 2.1-2.2** — Create layout.tsx + page.tsx, get app rendering
3. **Phase 2.3-2.4** — React 19 upgrades + JS→TS conversions
4. **Phase 3** — Tailwind CSS 4 migration (component by component)
5. **Phase 4** — Motion animations (after Tailwind is done, so we see the full picture)
6. **Phase 5** — ESLint 10 + tooling cleanup
7. **Phase 6** — Enhancements (Font Awesome 6, Image optimization, SEO, cleanup)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| CSS → Tailwind visual regressions | Convert one component at a time, visually verify each |
| `dangerouslySetInnerHTML` in FeaturedProject | Refactor to use React components instead of HTML string injection |
| `router.js` DOM manipulation | Convert to Next.js Link + scroll behavior or keep as client utility |
| `elementObserver.js` IntersectionObserver | Replace with Motion `whileInView` (cleaner, no manual observer) |
| Font loading flash | Use `next/font/local` with `display: swap` |
| Zustand store with SSR | Mark store consumers as `"use client"` — Zustand 5 handles this well |

---

## Files Created/Modified Summary

**New files (~15):**
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- `src/lib/utils.ts` (cn utility)
- `src/lib/router.ts`, `src/lib/elementObserver.ts` (converted from JS)
- `src/components/icons/Logo.tsx` (converted from JSX)
- `src/components/motion/FadeInSection.tsx`, `StaggerContainer.tsx`
- `.nvmrc`, `tailwind.css` (or inline in globals.css)

**Modified files (~25):**
- All 17 component `.tsx` files (React 19 updates + Tailwind classes)
- `src/store/portfolioStore.ts` (minor — add "use client" awareness)
- `src/lib/portfolioInformation.ts` (moved from services/)
- `src/lib/utils.ts` (merged with new cn utility)
- `package.json` (complete dependency overhaul)
- `tsconfig.json` (Next.js 16 compatible)

**Deleted files (~25):**
- All 16 CSS files in `src/css/`
- `vite.config.ts`, `index.html`
- `src/index.tsx`, `src/reportWebVitals.js`, `src/setupTests.js`, `src/App.test.js`
- `src/App.tsx` (replaced by `src/app/page.tsx`)
