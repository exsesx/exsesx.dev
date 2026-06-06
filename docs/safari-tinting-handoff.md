# Safari 26 top-bar tinting — implementation handoff (for Codex)

Branch: `feat/client-safari-tinting`. Read `docs/safari-tinting-plan.md` first for the
full investigation log; this doc is the actionable handoff with the agreed fix.

## The goal (unchanged)

- Top Safari status bar must match the theme (dark `#101111` / light `#f8f1e7`) AND
  retint **live on in-app theme toggle, no refresh**.
- No cookies, no SSR theme. Pages must stay static: `bun run build` shows `/` and
  `/projects` as `○ (Static)`.
- Bottom toolbar already works (samples `<body>`, painted inline). Only the TOP bar
  is broken: stays cream in dark mode, never updates on toggle.

## Root cause (proven by color diagnostic)

Safari 26 samples **`.site-header`** (the `fixed inset-x-0 top-0 z-50` header in
`src/components/Header.tsx`) for the TOP bar. Confirmed: forcing `.site-header`
background to a color drove the top bar to that color. `<body>`/`<html>`/`--background`
inline paints only fix the BOTTOM bar. A separate fixed strip (z-0 or z-60) does NOT
beat the header.

Safari reliably samples `background-color` (solid). It does NOT reliably sample
`background-image` gradients (our `e978bc2` gradient-on-header failed; Ben Frain
reported the same). So the sampled element must carry a **solid `background-color`**.

On THIS device the live observer works (bottom bar retints live), so an inline
`background-color` change to the sampled element updates chrome live.

## Dead ends — do NOT repeat

1. Inline paint `<body>`/`<html>`/`--background` only → bottom works, top stays cream.
2. Separate fixed sample strip (`z-index:0` or `60`) → header still wins.
3. Solid `background-color` on the WHOLE `.site-header` → top bar follows ✓ but a solid
   band covers the floating glass nav (visually unacceptable).
4. `background-image` linear-gradient (solid→transparent band) on `.site-header` → top
   stays cream (Safari doesn't sample gradients like solid bg).
5. Inset `.site-header::before` below `env(safe-area-inset-top)` so `<body>` wins → top
   still cream (HEAD `376a69e`). Header is sampled regardless of its ::before.

## The agreed fix (from Codex rescue) — NOT yet applied to the working tree

Make `.site-header` itself a thin **6px solid-color bar pinned to the very top edge**
(Safari samples its solid `background-color` → top bar tints, live), and move the
visible glass nav into an **absolutely-positioned child below the 6px zone** so the
6px solid is invisible in the status-bar area and the glass is untouched.

### `src/components/Header.tsx`
Wrap the nav in a positioned frame and mark the header as a sample target:
```tsx
<header className="site-header fixed inset-x-0 top-0 z-50" data-safari-chrome-sample>
  <div className="site-header-nav-frame" style={{ viewTransitionName: "persistent-nav" }}>
    <LazyMotion features={domAnimation}>
      <m.nav /* ...existing classes/props... */>
        {/* ...existing nav content... */}
      </m.nav>
    </LazyMotion>
  </div>
</header>
```
Notes:
- The `viewTransitionName: "persistent-nav"` moves from `<header>` to the frame (keep the
  morph working). Remove the `px-4 py-3 sm:px-6` padding from `<header>` (the frame now
  positions the nav). Verify the nav still lays out/animates correctly.

### `src/styles/globals.css`
Add a `--safari-chrome-color` var (mirrors `--background`) and restructure the header:
```css
:root  { --safari-chrome-color: #f8f1e7; }
.dark  { --safari-chrome-color: #101111; }

.site-header {
  height: 6px;                 /* the sampled bar; >=6px qualifies */
  overflow: visible;
  isolation: isolate;
  background-color: var(--safari-chrome-color);
  transition: none;            /* observer needs an instant jump */
}

.site-header::before {         /* keep the soft fade, now below the 6px bar */
  position: absolute;
  inset: 6px 0 -1.8rem;
  z-index: -1;
  pointer-events: none;
  content: "";
  background: linear-gradient(
    to bottom,
    color-mix(in oklab, var(--background) 86%, transparent),
    color-mix(in oklab, var(--background) 46%, transparent) 58%,
    transparent
  );
  mask-image: linear-gradient(to bottom, black 0 42%, transparent 100%);
}
.dark .site-header::before { /* keep existing dark variant, inset 6px too */ }

.site-header-nav-frame {
  position: absolute;
  top: 0.75rem;                /* was the header py-3; tune for safe-area */
  right: 1rem;
  left: 1rem;
}
@media (min-width: 640px) {
  .site-header-nav-frame { right: 1.5rem; left: 1.5rem; }
}
```
IMPORTANT visual check: `top: 0.75rem` likely needs `calc(env(safe-area-inset-top) + 0.75rem)`
so the nav clears the notch/status bar (the old header relied on padding + safe-area).
Verify on a notched iPhone.

### `src/app/layout.tsx` — `paintSafariChrome(darkMode)`
Also set `--safari-chrome-color` and paint any `[data-safari-chrome-sample]` inline:
```js
element.style.setProperty("--background", color);
element.style.setProperty("--safari-chrome-color", color);
element.style.backgroundColor = color;
element.style.colorScheme = scheme;
if (document.body) {
  document.body.style.backgroundColor = color;
  document.body.style.colorScheme = scheme;
}
document.querySelectorAll("[data-safari-chrome-sample]").forEach(function (sample) {
  sample.style.backgroundColor = color;
  sample.style.colorScheme = scheme;
});
```
The header is React-rendered, so keep the existing DOMContentLoaded re-run of
`applyTheme()` so the header gets painted once it exists.

## Open risks to watch

- **6px bar height vs. safe-area:** Safari paints the chrome over the safe-area; a 6px
  bar at `top:0` sits under the status bar. Confirm Safari samples it (it's at the exact
  top edge, full width, solid, no filter, >=6px → should qualify). If not, try making the
  header height = `max(env(safe-area-inset-top), 6px)`.
- **Nav vertical position:** must clear the notch — use safe-area in `--nav-frame top`.
- **CSS var on `.dark`:** ensure `--safari-chrome-color` is defined for both themes AND
  overridden inline by the script (inline wins; keep them equal).
- **Fallback if header-as-6px-bar still fails:** grooovinger's dedicated 6px fixed element
  hidden-on-scroll, or evan kirkiles' forced-resample nudge (perturb hex by 1, then back).

## Verify before commit

- `bunx tsc --noEmit` (ignore pre-existing `bun:test` errors in *.test.ts).
- `bun run check` clean.
- `bun run build` → `/` and `/projects` are `○ (Static)`.
- On iOS 26: top bar matches theme on load; retints live on toggle; glass nav looks
  right (no solid band, nav clears the notch); bottom bar still works; desktop unaffected.

Do not commit/push until the on-device check passes — leave changes in the working tree.
