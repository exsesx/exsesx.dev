# Safari 26 chrome tinting — final implemented state

Branch: `feat/client-safari-tinting` · PR [#7](https://github.com/exsesx/exsesx.dev/pull/7).

This doc describes **what the code actually does now** (as of `963fb79`). For the full
investigation — research, every dead end, the breakthrough — see
`docs/2026-06-06-safari-26-chrome-tinting-postmortem.md`. For the running log see
`docs/safari-tinting-plan.md`.

## What it achieves

- iOS 26 / Safari 26 chrome (top status bar **and** bottom toolbar) matches the theme and
  **retints live on in-app toggle, no refresh**.
- Pages stay **static** (`/` and `/projects` = `○`): no cookies, no SSR theme.
- Frosted-glass floating nav preserved; desktop layout unchanged.

## How it works (the mechanism)

Safari 26 ignores `theme-color` and tints chrome from element `background-color` near the
viewport edges (live WebKit observer). Two sample sources:

- **Bottom bar** samples `<body>` — painted inline by the bootstrap script.
- **Top bar** samples the fixed `.site-header`. On iOS the header is a **solid-color bar
  that fills the status-bar zone**; its color === the page background, so it's invisible,
  and the glass nav floats below it.

## The implementation (files)

### `src/styles/globals.css`
- `--safari-chrome-color` defined on `:root` (light) and `.dark` (dark), mirrors `--background`.
- `.site-header`:
  - `--safari-sample-band: 0px` by default → **desktop**: header collapses, nav at the
    original `0.75rem` gap. No sample bar on desktop.
  - Under `@supports (-webkit-touch-callout: none)` + `@media (hover: none) and (pointer:
    coarse)` → **iOS-touch only**: `--safari-sample-band: max(env(safe-area-inset-top),
    11px)`. (env underreports in this context, so the floor guarantees sampling. 11px is
    the empirical minimum — 10px breaks tinting; found on device 2026-06-10. The original
    44px floor also worked but visibly blocked content scrolling under the status bar;
    the 11px sliver hides behind the status bar itself, so content scrolls beneath
    Safari's own chrome glass and no feathering is needed.)
  - `height: var(--safari-sample-band)`, `background-color: var(--safari-chrome-color)`,
    `transition: none` (the live observer needs an instant jump).
- `.site-header-nav-frame`: `position: absolute; top: calc(env(safe-area-inset-top) +
  0.75rem)` on desktop; the iOS-touch block widens the gap to `1.4rem` so the nav stays
  clear of the 11px sample sliver. **Decoupled from the floored band** — it tracks the
  *real* status bar so the nav sits right. (Reusing the floored band here caused the
  "nav too low" bug in the 44px era.)
- `.site-header::before`: fade inset to `var(--safari-sample-band)` so it starts below the bar.

### `src/components/Header.tsx`
- `<header className="site-header fixed inset-x-0 top-0 z-50" data-safari-chrome-sample>` —
  no padding (the nav-frame positions the nav).
- Nav wrapped in `.site-header-nav-frame`; `viewTransitionName: "persistent-nav"` moved to
  the frame (keeps the morph). `suppressHydrationWarning` (script mutates inline bg pre-hydration).

### `src/components/AppDocument.tsx`
- Shared by the site root, localized Blog root, and global 404 document so the
  pre-paint theme and Safari chrome contract cannot drift between roots.
- Bootstrap script runs in `<head>` via `dangerouslySetInnerHTML` (so chrome is set before
  Safari's first sample). `paintSafariChrome(darkMode)` sets `--background`,
  `--safari-chrome-color`, `<html>` bg/colorScheme, and calls `syncThemeColorMeta()`.
- `syncThemeColorMeta()` + a `MutationObserver` on `<head>` keep exactly **one non-media**
  `theme-color` tag matching the theme (strips any media-keyed duplicates Next emits).
  Re-entrancy guarded; `window.MutationObserver` feature-checked.
- `src/lib/metadata.ts` exports the shared viewport with `viewportFit: "cover"`.
  The bootstrap script owns the single non-media `theme-color` tag because media-keyed
  metadata tags let iOS override the resolved JS value.

### `src/components/ThemeSwitcher.tsx`
- On theme change (post-hydration): `paintSafariChromeSamples(isDark)` paints `<html>`,
  `<body>`, and every `[data-safari-chrome-sample]` inline; `setMetaContent("theme-color",
  ...)` keeps the single tag in sync.

> ⚠️ **Two paint paths must stay in sync:** `paintSafariChrome` (inline `<head>` script)
> and `paintSafariChromeSamples` (ThemeSwitcher TS) do the same job in two languages. If
> you change the tinting logic, update both.

## Non-obvious invariants (don't regress these)

1. The sampled element must be tall enough to qualify: **≥11px** (10px breaks tinting —
   found empirically on device, 2026-06-10). `env(safe-area-inset-top)` underreports here
   → keep the 11px floor on the iOS bar. Don't raise it back toward 44px: anything taller
   than the status bar visibly blocks content scrolling beneath it.
2. Safari samples **solid `background-color`**, not `background-image` gradients.
3. z-index does **not** influence Safari's sampler — don't try to out-stack the header.
4. The sample bar's color must === the page background so the opaque band stays invisible.
5. Keep the bar iOS-gated; on desktop it must be 0 or the nav floats too low.
6. The nav offset uses real `env(safe-area-inset-top)`, NOT the floored band.

## Verify

- `bunx tsc --noEmit` (ignore pre-existing `bun:test` errors in *.test.ts).
- `bun run biome:check` clean.
- `bun run build` → `/` and `/projects` are `○ (Static)`.
- SSR emits exactly one `<meta name="theme-color">` (no media variants).
- iOS 26: top + bottom chrome tint on load + live on toggle; nav clears the status bar
  (not too low/high); glass intact. Desktop: nav at original position; view-transition morph
  intact.

## Follow-ups

- Many commits are **unsigned** (remote session, 1Password locked). Re-sign before/at merge
  if signature history matters. Squash-merge collapses the diagnostic commits.
- The 11px floor / `1.4rem` iOS nav gap are tuned to the test device; adjust if another
  device shows the nav off or loses tinting.
