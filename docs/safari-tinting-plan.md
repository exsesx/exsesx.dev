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

## Investigation log (iter 3 — diagnostic + external research)

Color diagnostic (paint each candidate a unique color, read the bar):
- TOP bar = BLUE → Safari samples **`.site-header`** for the top bar. z-index strips never win (a `z-60` strip still showed blue) — Safari's sampler doesn't honor our stacking. `isolate` is a red herring.
- BOTTOM bar = GREEN → samples **`<body>`** (painted inline → works live).

External research (key sources):
- Ben Frain: tried exactly the "fixed element bg = tint + gradient for visible look" → "ineffective, made it worse". Matches our failed iter (e978bc2).
- Pavel (1ar.io) / Jahir: **the winning pattern is a TRANSPARENT fixed parent** — keep visuals in an absolute child / off the very top edge so Safari ignores the header and **falls through to `<body>`**. Plus: set explicit `<html>`/`<body>` bg, never rely on theme-color, `display:none` (not opacity:0) for hidden overlays.
- Safari 26.2 release notes: no chrome-tinting changes (not waiting for a platform fix).

Fix (iter 3): make `.site-header` transparent at the very top edge by insetting
`.site-header::before` to start below `env(safe-area-inset-top)`. The header then
contributes no sampled pixel at the top → Safari samples `<body>` (painted dark
inline, live-observed) for BOTH bars. Glass pill untouched.

## Consolidated research findings (all sources)

Sampling rules (union of andesco + grooovinger + nasedk.in + benfrain + 1ar.io):
- TOP bar samples the topmost qualifying **fixed/sticky element near top**, else `<body>`, else `<html>`, else white/black.
- A fixed element qualifies at: ≥**6px** tall (grooovinger; andesco said 3px — use 6px to be safe), ≥80% wide (iOS), within ~4px of the edge.
- NOT sampled: `position:absolute` children of fixed/sticky parents; `::before`/`::after` on them; `display:none`; anything with `backdrop-filter`.
- Hidden overlays must use `display:none`, never `opacity:0` (opacity still tints).
- theme-color is fully ignored in Safari 26.

Conflict on live-update:
- nasedk.in / benfrain: "sampling happens at render time; JS bg changes after paint don't update the toolbar."
- andesco: "WebKit has a live observer that updates as bg changes."
- **OUR DEVICE: bottom bar DOES retint live on toggle** (it's `<body>`-driven) → the live observer works here. So `<body>`-as-source should retint live for the top too once the header stops intercepting.

Ranked fallback strategies if iter 3 (transparent header) fails the top bar:
1. **Forced-resample nudge** (evan kirkiles): after setting bg, momentarily perturb it (e.g. toggle last hex digit) to force WebKit to re-read. Cheap, no DOM change.
2. **Dedicated 6px top sample element** (grooovinger): `position:fixed; top:0; height:6px; width:100%`, hidden on scroll via scroll-timeline; paint it inline. It must out-qualify the header (≥6px, at the exact edge).
3. **Transparent-parent + absolute-child header refactor** (1ar.io): move ALL header visuals into an `position:absolute` child so the fixed `.site-header` is truly transparent/ignored; the absolute child isn't sampled.
4. Accept top-bar limitation; ship bottom-bar tint only.

## Verification gates

- `bun run build` shows `/` and `/projects` as `○ (Static)`.
- On iOS 26: toggle light↔dark → top AND bottom bars change instantly, no refresh.
- Nav (Home/Projects) works on first tap.
- Desktop unaffected; view-transition morph intact.
