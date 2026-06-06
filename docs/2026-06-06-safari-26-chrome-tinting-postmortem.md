# Safari 26 chrome tinting — investigation post-mortem

**Date:** 2026-06-06
**Branch:** `feat/client-safari-tinting` · **PR:** [#7](https://github.com/exsesx/exsesx.dev/pull/7)
**Outcome:** Solved. Top + bottom Safari chrome tint to the theme, update live on toggle,
pages stay static, glass header preserved.

This is a preserved record of a long, winding debugging session: the problem, the
research, every dead end (and *why* it died), the breakthrough, and the final fix.

---

## The problem

iOS 26 / Safari 26 ("Liquid Glass") changed how the browser tints its chrome (the top
status-bar area and the bottom toolbar). On a dark-themed page, the **top bar stayed
cream (light)** and didn't update when the in-app theme toggled. We wanted:

- Chrome (top **and** bottom) matches the site theme — dark `#101111` / light `#f8f1e7`.
- Retints **live on in-app theme toggle, no page refresh**.
- **Static pages** — no cookies, no SSR theme (so `/` and `/projects` stay `○ Static`
  and client navigation stays fast / first-tap).
- The frosted-glass floating nav stays visually intact.

## The single most important discovery

> **Safari 26 ignores the `theme-color` meta tag entirely.** It derives chrome tint from
> the **`background-color` of elements near the viewport edges**, via a live WebKit
> observer. We spent the first several attempts fighting `theme-color`, which does nothing
> on this platform.

And the discovery that actually unblocked the top bar:

> **Safari samples the `.site-header` (a `position: fixed; top: 0` element) for the TOP
> bar — and the sampled element must FILL the status-bar zone.** A short bar sits *below*
> the zone, so Safari samples the page behind/above it instead. Critically,
> **`env(safe-area-inset-top)` underreports to ~0 in this Safari context**, so any height
> keyed only to it collapses and fails.

---

## How Safari 26 actually samples chrome (consolidated from research)

Sources: [andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting),
[1ar.io](https://1ar.io/updates/safari-26-liquid-glass-web/),
[grooovinger](https://grooovinger.com/notes/2026-02-27-safari-26-header-background),
[Ben Frain](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/),
[Ben Nasedkin](https://nasedk.in/blog/ios26-safari-toolbar-colors/),
[Jahir Fiquitiva](https://jahir.dev/blog/safari-toolbar).

- `theme-color` meta: **ignored** in Safari 26 (kept only for older Safari / other browsers).
- Default tint source: **`<body>` background-color**, fallback **`<html>`**, else white/black.
- A qualifying **`position: fixed | sticky`** element with a background **takes priority
  over `<body>`** at its edge. Qualifying = within ~4px of the edge, ≥80% wide (iOS),
  **≥6px tall** (grooovinger; andesco said 3px — 6px is safer), **and it must cover the
  bar's sample zone**.
- **NOT sampled:** `position: absolute` children of fixed/sticky parents; `::before` /
  `::after` pseudo-elements; `display: none`; anything with `backdrop-filter`.
- Safari reliably samples a **solid `background-color`**, NOT `background-image` gradients.
- Hidden overlays must use `display: none`, never `opacity: 0` (opacity still tints).
- `viewport-fit=cover` is required for the **bottom** bar to tint.
- Live observer: on *this* device, inline `background-color` changes to the sampled
  element **do** retint chrome live (sources disagree on this; our device confirmed it —
  the bottom bar retinted live throughout).

---

## Timeline — what we tried, in order

All commits dated 2026-06-06. Earlier `main`-side cookie attempts are listed for context;
the client-side branch starts at `bc41acc`.

### Phase 0 — cookie / SSR theme-color (on `main`, later abandoned)
`6dbc123 → 2773d5c → ce8157d → 0628d21 → 9907f5e`
- Drove `theme-color` (and later `<html>`/`<body>` background) from a cookie read in
  `generateViewport` / `RootLayout`.
- **Worked** for correct chrome *on load* (after the resolved-scheme cookie fix), but:
  - Reading `cookies()` forced the route **dynamic** (`ƒ`), reintroducing the iOS
    double-tap-to-navigate regression.
  - Switching theme required a manual refresh.
  - `theme-color` is ignored by Safari 26 anyway — the on-load fix actually came from the
    SSR'd `<body>`/class background, not the meta tag.
- Decision: **abandon cookies**, go fully client-side + static on a feature branch.

### Phase 1 — client-side, static (the feature branch)
`bc41acc` — removed all cookie/SSR theme; pages back to `○ Static`. Painted
`<html>`/`<body>` background inline in the no-flash script on load + on `theme-change`.
- **Bottom bar: worked** (samples `<body>`). **Top bar: stayed cream.**

### Phase 2 — chasing the wrong element
- `6496c3a` drive `--background` inline so overlays update → top still cream.
- `b4f27a7` paint `.site-header` bg inline → (later proven correct direction, but here
  incomplete).
- `f3bab74` / `92b9232` dedicated invisible fixed "sample strip" at `z-0`, then `z-60`
  above the header → **header still won**; z-index is irrelevant to Safari's sampler.
- `376a69e` inset `.site-header::before` below the safe area to make the header
  "transparent" so `<body>` would win → top still cream. The header is sampled regardless.
- `e978bc2` paint `.site-header` with a `background-image` gradient (solid→transparent
  band) → top stayed cream. **Safari samples solid `background-color`, not gradients.**
  (Ben Frain reported the identical failure.)

### Phase 3 — diagnostics (stop guessing, look)
- `34d7e7b` / `ff0e65f` paint each top-edge candidate a unique color; read the bar.
  (First diagnostic had an invalid-CSS selector bug — `.-z-10` — fixed in `ff0e65f`.)
- `72b078a` clean 3-way diagnostic. **Result: TOP bar = BLUE → samples `.site-header`.
  BOTTOM = GREEN → samples `<body>`.** Definitive.

### Phase 4 — header as the sample source (right element, wrong size)
- `7f5b3b6` make `.site-header` a thin solid bar (`max(env, 6px)`), float the glass nav in
  an absolute child below it. **Top still cream.**
- `3c9dd42` force the header **RED** at `max(env, 6px)` → a **thin red line at the BOTTOM
  of the status-bar zone, cream above it.** → header paints, but sits *below* the sampled
  zone; `env(safe-area-inset-top)` collapsed it to 6px.
- `6365c94` force the header **RED** at fixed `height: 60px` → **RED FILLED THE ENTIRE
  STATUS BAR.** 🎯 **Breakthrough: the header IS sampled when it fills the zone.** Height
  was the whole problem; `env()` underreports here.

### Phase 5 — the fix
- `14c1016` restore the theme color, set `height: max(env(safe-area-inset-top), 44px)`.
  **Top bar tints correctly, on load and on toggle.** ✅ (Reported: "works now!")
- `ae25dff` the only remaining issue was the nav floating too low; reposition it to
  `var(--safari-sample-band) + 0.75rem` so it clears the bar with the original gap.

---

## What actually fixed it

`.site-header` **is** Safari's top-bar sample source, so make it carry the solid theme
color across the full status-bar zone — and float the visible glass nav below it.

**`src/styles/globals.css`**
```css
:root { --safari-chrome-color: #f8f1e7; }
.dark { --safari-chrome-color: #101111; }

.site-header {
  /* MUST fill the status-bar zone to be sampled. env(safe-area-inset-top)
     underreports here, so floor it. Color === page bg, so the band is invisible. */
  --safari-sample-band: max(env(safe-area-inset-top), 44px);
  height: var(--safari-sample-band);
  isolation: isolate;
  background-color: var(--safari-chrome-color);
  transition: none;                       /* observer needs an instant jump */
}
.site-header-nav-frame {                  /* the floating glass nav, below the bar */
  position: absolute;
  top: calc(var(--safari-sample-band) + 0.75rem);
  right: 1rem; left: 1rem;
}
.site-header::before { inset: var(--safari-sample-band) 0 -1.8rem; /* fade below bar */ }
```

**`src/components/Header.tsx`** — header marked `data-safari-chrome-sample`, padding
removed, nav wrapped in `.site-header-nav-frame`, `viewTransitionName` moved to the frame,
`suppressHydrationWarning` (the script mutates the header's inline bg pre-hydration).

**`src/app/layout.tsx`** — the no-flash script runs in `<head>` (so chrome is set before
Safari's first sample), sets `--background` + `--safari-chrome-color` + `<html>`/`<body>`
bg + every `[data-safari-chrome-sample]` inline, on load and on the `exsesx:theme-change`
event. The header is React-rendered, so a `DOMContentLoaded` re-run repaints it once present.

Bottom bar: unchanged — it samples `<body>`, which the same script paints inline.

---

## Key lessons (for the next person, or future-me)

1. **`theme-color` is dead on Safari 26.** Don't iterate on it. Tint comes from element
   `background-color`.
2. **Identify the sampled element empirically before fixing.** The color diagnostic
   (paint each candidate a unique color, read the bar) settled in one test what ~6 blind
   attempts couldn't. When stuck on "which element," *look*, don't theorize.
3. **The sampled element must FILL the bar's zone**, not just touch the edge. A 6px strip
   at the edge isn't enough if it doesn't cover where Safari reads.
4. **`env(safe-area-inset-top)` is unreliable in in-browser Safari here** — it underreported
   to ~0. Floor any safe-area-derived size (`max(env(...), 44px)`).
5. **Safari samples solid `background-color`, not gradients.** A `background-image`
   gradient won't tint.
6. **z-index does not influence Safari's sampler.** Stacking tricks don't beat the header.
7. **Cookies/SSR can fix on-load chrome but force dynamic rendering** (cookie read in the
   root layout), which broke navigation. Client-side + static was the right call.
8. **Make the sampled color === the page background** so the required opaque sample bar is
   invisible against the page.

## Known follow-ups / risks

- The 44px floor is tuned for the test device; if the nav looks off on other devices, the
  floor or the `+ 0.75rem` gap may need adjustment.
- If live retint ever stops firing on a future Safari, the fallback is a forced-resample
  nudge (perturb the bg hex by 1, then set the real color next frame).
- Many commits in this branch are **unsigned** (built in a remote session with 1Password
  locked). Re-sign before/at merge if signature history matters.
