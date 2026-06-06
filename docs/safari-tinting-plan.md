# Client-side Safari 26 chrome tinting — feature branch plan

Branch: `feat/client-safari-tinting`

## Goal

- **Static pages** (no cookies, no SSR theme → home route back to `○ static`, kills the dynamic-render double-tap nav).
- **Pure client-side Safari chrome logic** that updates **in real time on theme toggle** — no manual refresh — for **both** the top status bar AND the bottom toolbar.

## How Safari 26 actually works (source: github.com/andesco/safari-color-tinting)

- Safari 26 **ignores `theme-color`**. It derives chrome tint from `background-color`.
- Default source: **`<body>` background-color**, with **`<html>` as fallback**.
- **WebKit has a live observer** that updates the Safari UI in real time as the sampled `background-color` changes. ← this is what enables "no refresh".
- A qualifying **`position: fixed|sticky`** element with a background **takes priority over `<body>`**:
  - within 4px of top OR 3px of bottom (iOS) OR partially offscreen (bottom:-8px, min-height:12px)
  - ≥80% wide (iOS) / ≥90% (macOS); ≥3px tall
- **NOT sampled:** `position:absolute` children of fixed/sticky parents; `::before`/`::after` on fixed/sticky; `display:none`; anything with `backdrop-filter`.
- **`viewport-fit=cover` is REQUIRED for the bottom bar tint.**

## Current-page sample candidates

- `KineticBackdrop`: `fixed inset-0 -z-10 bg-background`, no backdrop-filter → **QUALIFIES**, likely the actual sample source (covers top+bottom edges, full width).
- Header glass: has `backdrop-filter` → disqualified (good).
- `VersionTag` (`fixed bottom-4 right-4`): has `backdrop-blur` + not full-width → disqualified.

## Hypotheses for "needs refresh" (to test on-device)

1. The live observer fires on `<body>`/`KineticBackdrop` bg change, but a **CSS `transition` on background** makes the change non-instant/unobservable → set sampled bg with `transition: none`.
2. The toggle updates `var(--background)` via class, but the **sampled element's computed bg doesn't change synchronously** → drive an explicit inline background on the sampled element on toggle.
3. **Bottom bar specifically** needs `viewport-fit=cover` (must be in the static viewport) AND a clean bottom sample.

## Plan

1. Remove cookie/SSR theme entirely (layout async→sync, drop `generateViewport` cookie read, drop both cookies, drop SSR class/bg). Pages static again.
2. Keep `viewport-fit=cover` in the static viewport.
3. Ensure the theme class flip updates `<body>` (or a dedicated clean sample element) background **instantly, no transition**, so the live observer retints both bars in real time.
4. Verify on-device (iOS 26): toggle → both bars retint with NO refresh; nav is first-tap; pages static in build output.

## Investigation log (iter 2)

Symptom: dark page, **top bar light**, bottom bar dark (even on toggle, not just refresh).

Sample-candidate inventory (andesco rules applied to actual DOM):
- `KineticBackdrop` `fixed inset-0`, full-width, no backdrop-filter → **qualifies, wins the top sample** (priority over `<body>`).
- BUT its child `page-top-fade` (`absolute inset-x-0 top-0 h-52`) paints **solid `var(--background)` at the very top edge** → Safari samples that composited pixel.
- `page-top-fade` bg is **class-driven `var(--background)`**; the live observer doesn't track it when we only set the backdrop's own inline backgroundColor → top bar stays at first-paint light.
- Bottom edge has no solid overlay → composites near the inline base → bottom bar worked.
- Header (`fixed top-0`): no background on container (glass child has backdrop-filter → disqualified) → not the source.

Fix attempt (iter 2): drive `--background` **inline on `<html>`** so EVERY `var(--background)` consumer (page-top-fade, backdrop, body) updates together and the live observer tracks it.

Status: needs on-device confirmation. If the top bar is still light, the sampled element is something else — use a diagnostic build (set the suspect element to a glaring color) to identify it visually.

## Verification gates

- `bun run build` shows `/` and `/projects` as `○ (Static)`.
- On iOS 26: toggle light↔dark → top AND bottom bars change instantly, no refresh.
- Nav (Home/Projects) works on first tap.
- Desktop unaffected; view-transition morph intact.
