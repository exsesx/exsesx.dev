# Safari 26 chrome tinting: investigation and current implementation

**Date:** 2026-07-25
**Status:** implemented and verified on the preview branch
**WebKit source revision:** [`0b1757694dabeeb50887ecb95dc800f36ebddf79`](https://github.com/WebKit/WebKit/commit/0b1757694dabeeb50887ecb95dc800f36ebddf79)

This is the single technical record for the Safari 26 chrome tinting work in
this repository. It replaces the original plan, handoff, postmortem, overlay
investigation, and sampler visibility notes.

The short version is odd but simple: Safari needs to see an opaque fixed box at
the top edge, while the user must not see that box. The final implementation
uses an empty 11px box whose background is clipped to text. WebKit reads the
computed background color, but the paint pipeline has no glyphs to paint.

The evidence is split deliberately:

- WebKit source at the pinned revision supports claims about hit testing,
  candidate eligibility, color resolution, backdrop handling, and painting.
- Simulator, browser, automated, and real-device checks support claims about
  how this site behaves.
- The supplied field articles are supplemental. They helped choose
  experiments, but they do not override current WebKit source when the two
  disagree.

## Current result

The current implementation has these properties:

- Safari's top chrome follows light, dark, and system theme changes.
- Opening and closing the mobile table of contents drawer does not lose the
  tint.
- The sample element stays mounted, so drawer code does not need special
  lifecycle hooks.
- The 11px sample box is visually empty. It does not create a band, layout
  shift, or hit target.
- The workaround is active only on coarse touch WebKit. Its height is `0` in
  desktop browsers.
- The page still emits and updates `theme-color`, but the Safari 26 fix does not
  depend on it.
- The docked mobile table of contents button sits 8px from the visual viewport
  edge.

The preview branch was also tested on a real iPhone by the site owner, who
confirmed that it works.

## Timeline at a glance

This work spans three recorded stages:

- **2026-06-06:** the first long investigation landed in pull request 7. It
  identified the fixed header as Safari's top color source and used a 44px
  solid sample band.
- **2026-06-10:** device testing found the 11px empirical floor. Ten pixels
  failed; 11px kept the direct tint result while covering less content.
- **2026-07-25:** the table of contents drawer exposed the remaining lifecycle
  and visibility problems. The final session ran from the 16:26 reproduction to
  the 21:21 Simulator capture. Source tracing led to the permanent empty
  `background-clip: text` sampler, followed by the real-device preview check.

The work was spread across multiple weeks. The July 25 investigation was the
final intensive pass, not the beginning of the Safari problem.

## What Safari is doing

Safari 26 has a fixed-container edge color path in WebKit. A WebKit engineer
described its purpose as extending the solid background of a fixed or sticky
element into an obscured content inset so that scrolling does not expose a gap
beside browser chrome. The behavior matters more on iPhone because its browser
UI uses a softer blur. See [WebKit bug 301756, comment 2](https://bugs.webkit.org/show_bug.cgi?id=301756#c2).

This path is separate from the standardized [`theme-color` metadata](https://html.spec.whatwg.org/multipage/semantics.html#meta-theme-color).
`theme-color` is still useful metadata, so the site keeps it synchronized. It
is not the control surface for the Safari 26 result described here.

### The edge selection path

At the pinned WebKit revision, `LocalFrameView::fixedContainerEdges` does the
following:

1. It starts from the fixed-position layout rectangle and contracts it by 4px.
2. It computes one midpoint on each edge that Safari wants to inspect.
3. It performs a normal frontmost document hit test at that point.
4. The first pass ignores CSS `pointer-events`.
5. It walks the hit renderer's ancestors until it finds an eligible fixed or
   sticky element.
6. It resolves a color from computed style when possible. Otherwise it can
   sample rendered pixels or reuse a previous color.

The 4px margin, edge midpoint, and hit-test options are in
[`LocalFrameView.cpp`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2293-L2313)
and the
[`findFixedContainer` hit test](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2486-L2508).

This explains two details that trial and error alone did not:

- A candidate moved to `top: -9px` or `top: -11px` cannot reliably win. It no
  longer covers the probe point after WebKit applies its 4px inset.
- `pointer-events: none` is safe for page interaction but does not hide the
  element from Safari's first sampling hit test.

### Geometry and the 11px floor

For a top-edge element, WebKit compares its width with the viewport width. The
current thresholds are:

- below 90 percent: smaller;
- 90 percent through less than 105 percent: similar;
- 105 percent or more: larger.

The implementation therefore uses the full viewport width. See
[`compareWithViewportSize`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2330-L2362).

The empirical 11px minimum also has a source-level explanation. WebKit defines
`thinBorderWidth` as `10`, and `primaryBackgroundColorForRenderer` refuses the
direct computed-color path when either border-box dimension is `<= 10px`.
An 11px box stays on the direct path:

- [`thinBorderWidth`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2293-L2296)
- [`primaryBackgroundColorForRenderer`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2396-L2415)

A thinner box is not necessarily absent from the hit test, but it loses the
direct style-color shortcut. WebKit may then sample rendered pixels or reuse a
cached edge color. That is exactly the wrong path for an element whose paint is
intentionally empty.

### Eligibility and stacking

The candidate classifier requires a render layer and fixed or sticky
positioning. It rejects hidden or nearly transparent boxes. A negative
`z-index` can also reject a viewport-sized candidate. The relevant enum and
checks are in
[`containerEdgeCandidateResult`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2417-L2482).

Positive stacking still matters before those checks. WebKit receives one
frontmost hit at the probe. It does not search every eligible element under the
point. When the sampler and `.site-header` both used `z-index: 50`, the later
header could win by paint order. The sampler now uses `2147483647`, the largest
value chosen for this site's normal author stacking, and remains
non-interactive.

A native dialog or popover in the CSS top layer can still sit above ordinary
author stacking. The current Base UI drawer does not use that path. Any future
native top-layer component needs its own Safari check.

This corrects an early conclusion from the investigation. "Positive z-index is
not part of candidate classification" is true. "Stacking does not matter" is
false because stacking decides which renderer the hit test returns.

### Opacity, visibility, and backdrop filters

Current WebKit source explicitly rejects CSS opacity below `0.1`, zero opacity,
and hidden content:

- [`isHiddenOrNearlyTransparent`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2259-L2271)
- [`RenderLayer::isVisibilityHiddenOrOpacityZero`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L6142-L6149)

This conflicts with field reports that an `opacity: 0` fixed element can still
affect tinting. Those reports may describe an older Safari build, a different
renderer in the same overlay, or a different sampling path. For maintenance of
this implementation, the pinned source is the stronger evidence. We do not use
opacity or visibility to hide the sampler.

A qualifying lineage with `backdrop-filter` is handled differently. WebKit
records `foundBackdropFilter` and emits `PredominantColorType::Multiple`
instead of a solid edge color. See the
[`foundBackdropFilter` branch](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2661-L2675).
That can stop one element from contributing a simple color, but it does not
guarantee transparent browser chrome or clear a previously selected material.

### Why fixed overlays can change the result

Adding or removing viewport-constrained objects marks the fixed-container
edges for an update:

- [`WebPage::didAddOrRemoveViewportConstrainedObjects`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebKit/WebProcess/WebPage/WebPage.cpp#L10722-L10728)
- [`WebPage::willCommitMainFrameData`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebKit/WebProcess/WebPage/Cocoa/WebPageCocoa.mm#L2362-L2373)

WebKit bug 302272 reported that showing a fixed dialog or popover changed the
top and bottom tint. It was closed as a duplicate of bug 300965:

- [WebKit bug 302272](https://bugs.webkit.org/show_bug.cgi?id=302272)
- [WebKit bug 300965](https://bugs.webkit.org/show_bug.cgi?id=300965)

The fix in
[`2ae949b78743`](https://github.com/WebKit/WebKit/commit/2ae949b78743)
taught fixed-container edge sampling to recognize native backdrop renderers
and blend their background against the page background. Its regression test
checks edge colors before opening a dialog, while it is open, and after it
closes.

That patch fixes a specific backdrop case. It does not provide an author API
for pinning a tint, and it does not remove the general fact that fixed-layer
lifecycle changes cause a fresh edge computation.

## Why the sampler can be invisible

The final workaround relies on a split between style inspection and painting.

WebKit decides that the box has a background from its computed background color.
`ComputedStyle::hasBackground()` does not inspect `background-clip`:

- [`RenderElement::hasBackground`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L34-L46)
- [`ComputedStyle::hasBackground`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/style/computed/StyleComputedStyle%2BGettersInlines.h#L298-L304)

The fixed-edge code then reads `style().backgroundColor()` directly when the
box is large enough. It does not ask whether the final background paint has any
pixels.

Painting takes a different route. For `background-clip: text`,
`BackgroundPainter` creates a text mask and applies the background through that
mask:

- [`FillBox::Text` handling](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L383-L450)
- [`background color painting`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L481-L520)

`paintMaskForTextFillBox` paints only text into that mask. The sampler is a
truly empty `div`, so the mask contains no glyphs:

- [`RenderBoxModelObject::paintMaskForTextFillBox`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBoxModelObject.cpp#L704-L723)

The outcome is deliberate:

- the fixed-edge heuristic sees an opaque computed background;
- the normal paint pipeline clips that background to an empty text mask;
- the user sees no band.

The 11px and 12px heights are real geometry, but that geometry is paintless and
fixed, so it creates no layout shift.

## Implementation in this repository

### DOM

[`src/components/Header.tsx`](../src/components/Header.tsx) renders one permanent
empty element before the visual header:

```tsx
<div
  aria-hidden="true"
  className="safari-chrome-sample"
  data-safari-chrome-sample
/>
```

It is intentionally empty. No text, child element, or generated content may be
added.

### CSS

[`src/styles/globals.css`](../src/styles/globals.css) defines the sampler:

```css
.safari-chrome-sample {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2147483647;
  height: 0;
  border: 0;
  outline: 0;
  pointer-events: none;
  background-color: var(--safari-chrome-color);
  background-clip: text;
  -webkit-background-clip: text;
  box-shadow: none;
  transition: none;
}

@supports (-webkit-touch-callout: none) {
  @media (hover: none) and (pointer: coarse) {
    .safari-chrome-sample {
      height: 11px;
    }

    html[data-chrome-sample-refresh] .safari-chrome-sample {
      top: 0;
      height: 12px;
    }
  }
}

@media print {
  [data-safari-chrome-sample] {
    display: none;
  }
}
```

The WebKit feature query and coarse-pointer media query keep the 11px geometry
out of desktop layouts. The element remains mounted everywhere, but its default
height is zero.

Printing is a separate concern. WebKit can replace a text-clipped background
with a border-box background when print economy handling is active. Hiding the
sampler in print avoids depending on screen-only concealment. See
[`BackgroundPainter.cpp`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L251-L277).

### Theme bootstrap and refresh

[`src/lib/no-flash-script.ts`](../src/lib/no-flash-script.ts) runs before body
content paints. It:

- resolves the stored or system theme;
- updates `--background` and `--safari-chrome-color`;
- paints the root background and sets `color-scheme`;
- keeps one script-owned `theme-color` meta element synchronized;
- requests a sampler refresh;
- repeats the work for storage, theme, system-theme, and `pageshow` events.

A color-only change did not reliably invalidate Safari's cached edge in the
Simulator. `refreshSafariChromeSample()` therefore applies
`data-chrome-sample-refresh`, waits across two animation frames, and removes it.
That changes the sampler from 11px to 12px for a painted frame. Both sizes stay
above WebKit's 10px cutoff, and the empty text mask makes the pulse invisible.

The geometry pulse has support in WebKit's invalidation path. Geometry and
content updates on a viewport-constrained backing request a fixed-container
edge update:

- [`RenderLayerBacking` geometry update](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayerBacking.cpp#L1597-L1635)
- [`RenderLayerBacking::setContentsNeedDisplay`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayerBacking.cpp#L4043-L4084)

[`src/components/ThemeSwitcher.tsx`](../src/components/ThemeSwitcher.tsx)
updates the root, body, and sampler inline after React observes the resolved
theme. `persistThemeMode()` also dispatches `exsesx:theme-change`; the head
bootstrap listener uses that event to run the pulse.

There is still JavaScript, but it no longer mounts temporary sampling elements
or coordinates with drawer callbacks. One permanent node handles first paint,
theme changes, bfcache restoration, and later fixed-layer recomputes.

### Root color and viewport metadata

The site keeps explicit light and dark chrome colors in
[`src/lib/theme.ts`](../src/lib/theme.ts):

```ts
export const THEME_CHROME_COLORS = {
  light: "#eef2f8",
  dark: "#0a101c",
} as const;
```

These values must stay aligned with the corresponding CSS backgrounds.
`html`, `body`, and the sampler receive the resolved color so Safari has a
consistent page fallback as well as the explicit top candidate.

[`src/lib/metadata.ts`](../src/lib/metadata.ts) keeps
`viewportFit: "cover"`. Field testing and the two supplied articles both found
this important for Safari's bottom toolbar presentation:

- [Pavel Larionov's Safari 26 field notes](https://1ar.io/updates/safari-26-liquid-glass-web/)
- [Jahir Fiquitiva's toolbar investigation](https://jahir.dev/blog/safari-toolbar)

Those articles were useful for building the experiment matrix. The fixed-edge
mechanism and final concealment claim above come from WebKit source and local
device testing, not from either article.

## Investigation history

### 1. Server theme and `theme-color`

The first implementation stored the selected theme in a cookie and read it in
the root layout. That produced the expected first-load color, but it made
otherwise static routes dynamic and brought back an iOS navigation regression.
Theme changes also needed a reload.

The useful discovery was that the working part was the server-rendered page
background, not a dependable Safari 26 `theme-color` override. The cookie path
was removed and the pages returned to static rendering.

### 2. Client-side root and body colors

The no-flash script then painted `html` and `body` before hydration and updated
them on theme changes. The bottom toolbar followed the theme, but the top area
stayed light.

This isolated the problem. The root color path worked, but another fixed object
was winning the top edge.

### 3. Guessing at top-edge elements

Several approaches failed:

- a dedicated fixed strip at low and high positive z-index values;
- a transparent header with visual work moved to a pseudo-element;
- an absolute child inside a fixed parent;
- a solid-to-transparent `background-image` gradient;
- a short header based only on `env(safe-area-inset-top)`.

The gradient failed because the reliable direct path reads a resolved
`background-color`, not a background image. The safe-area value also collapsed
near zero in the tested Safari context, so the candidate was too short for the
direct color path.

### 4. Color diagnostics

The investigation stopped guessing and painted each plausible source a
different loud color. Safari's top chrome turned blue with `.site-header`; the
bottom chrome followed the body.

A 6px red header produced only a thin line. A 60px red header filled the top
area. A theme-colored 44px header therefore worked, but it created an
unacceptable solid surface over scrolling content.

Trial and error later found the useful boundary: 10px failed and 11px worked.
The source review eventually tied this to `thinBorderWidth = 10`.

### 5. Transient sampling and the drawer

To avoid a permanent band, the next design expanded the sample for a short
timer and collapsed it again. A later version flashed it after the table of
contents drawer closed.

That was fragile. Fixed overlays mount and unmount on their own schedule.
WebKit recomputes fixed-container edges when viewport-constrained objects
change. If the sample had already collapsed, the next recompute could resolve
the top edge to no useful color.

The Base UI investigation also corrected the original drawer hypothesis. The
closed drawer did not leave a stale opacity-zero backdrop in the DOM. Its
portal unmounted after the exit transition. The drawer was a reliable
recompute trigger, not the lingering color source.

This was verified against the installed Base UI v1.6.0 source.
`DialogPortal.js` defaults `keepMounted` to `false` and returns `null` when
`mounted || keepMounted` is false. `DrawerBackdrop.js` also applies `hidden`
when the drawer is not mounted. This repository does not pass `keepMounted` to
the portal.

One source investigation initially blamed a scroll gate in
`Page::updateFixedContainerEdges`. That conclusion was retracted after finding
the platform default. On small-screen iOS,
`defaultTopContentInsetBackgroundCanChangeAfterScrolling()` returns `true`, so
the top edge can be sampled after scrolling:

- [`Page::updateFixedContainerEdges`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/Page.cpp#L5444-L5503)
- [`defaultTopContentInsetBackgroundCanChangeAfterScrolling`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebKit/Shared/Cocoa/WebPreferencesDefaultValuesCocoa.mm#L155-L162)

This matters for future debugging. The drawer failure was not an iPhone
post-scroll sampling lockout.

### 6. Holding the band through the drawer lifecycle

A reference-counted controller briefly held the 11px band from before the
drawer portal mounted until its close transition completed. It fixed the tint
lifecycle, but the opaque band was visible over the article. Correct chrome
was not worth a persistent visual seam.

This version did prove that the sample had to remain eligible across fixed
overlay recomputes.

### 7. Moving the box offscreen

The next version kept an 11px box but moved most of it above the viewport:

- `top: -9px` left a small intersection;
- `top: -11px` hid it completely.

The fully hidden version retained the old dark tint after switching to light.
The partially hidden version still painted a visible strip.

The later source trace explained the result more precisely. The sampling probe
is not at the literal `y = 0` viewport edge. WebKit contracts its fixed rect by
4px, then hit-tests that edge. A box ending at `y = 2px` cannot receive the
probe.

### 8. Trying transparent chrome

Transparent browser chrome would have removed theme synchronization from the
problem, so it was tested directly:

- no qualifying top candidate;
- a 6px transparent candidate with
  `backdrop-filter: saturate(100%)`;
- a viewport-sized neutral backdrop-filter candidate.

None produced a safe invariant. A light page could retain a dark status area
after a theme change or reload in the iOS 26.5 Simulator. The
`foundBackdropFilter` path returns a non-solid result, but it does not promise
that Safari will clear an earlier native material.

The transparent route was therefore rejected. The final approach gives WebKit
an explicit current color while painting no document pixels.

### 9. Empty text clipping

`background-clip: text` finally separated the two requirements:

- keep the 11px opaque computed box WebKit wants;
- paint nothing the reader can see.

The first version still failed intermittently because the sampler shared
`z-index: 50` with the later visual header. Raising the empty sampler above all
fixed overlays made selection deterministic. This is the version that passed
the full Simulator matrix and the real-device preview check.

## Failed approaches and what they taught us

| Approach | Result | Reason or current interpretation |
| --- | --- | --- |
| Depend on `theme-color` | Did not control the target Safari 26 behavior | Fixed-container edge sampling was the active path |
| Cookie-driven SSR theme | Correct first load, wrong architecture | Forced static routes into dynamic rendering and did not solve live changes |
| Paint only `html` and `body` | Bottom worked, top did not | A fixed header won the top edge |
| Low or equal stacking sampler | Unreliable | WebKit takes one frontmost hit |
| Negative z-index sampler | Not viable | Current candidate classification can reject it |
| Pseudo-element or absolute-child source | Did not become the selected fixed candidate | The fixed-edge walk requires fixed or sticky renderers |
| Background gradient | No dependable tint | Direct color extraction reads `background-color` |
| `opacity: 0` or `visibility: hidden` | Not viable in pinned source | Explicit hidden and transparency rejection |
| `display: none` | Not viable | No renderer exists to hit |
| Empty `clip-path` | Not viable | Box hit-testing rejects a clip that excludes the probe |
| Move the whole box offscreen | Not viable | The box no longer contains the inset midpoint |
| 6px or 10px sample | Unreliable | Loses the direct computed-color path |
| 44px header band | Tinted correctly but looked wrong | It visibly covered the article edge |
| Timed 11px flash | Lost tint after later recomputes | The eligible box was absent when WebKit sampled again |
| Drawer-lifecycle hold | Correct but visibly intrusive | The opaque band stayed present during the drawer lifecycle |
| Transparent or neutral backdrop filter | Could retain the wrong material | Non-solid edge output did not force a clean transparent state |
| Empty text-clipped 11px box | Works | Computed style stays opaque while paint has no glyph mask |

Two source-plausible alternatives remain unneeded:

- a fully transparent CSS mask on the same 11px geometry;
- `filter: opacity(0)` rather than the CSS `opacity` property.

Neither has the same combination of source explanation, Simulator coverage,
and real-device confirmation as the empty text clip. They should remain
experiments, not silent fallbacks.

## Maintenance contract

The workaround is small, but each detail is load-bearing.

1. Keep the sampler structurally empty. Text, descendants, list markers, and
   generated `::before` or `::after` content can create mask pixels.
2. Keep `top: 0`, full viewport width, and at least 11px of height in the
   coarse-touch WebKit gate.
3. Keep both refresh geometries above 10px. The current values are 11px and
   12px.
4. Keep the sampler above every normal fixed layer in this site. A later
   header or drawer must not win the single edge hit. Test native dialogs and
   popovers separately because the CSS top layer outranks ordinary z-index.
5. Keep `pointer-events: none`. The sampler must never intercept page input.
6. Keep ordinary CSS `opacity: 1` and `visibility: visible`.
7. Do not add `clip-path`, transforms, `filter`, `backdrop-filter`, borders,
   outlines, shadows, or native appearance.
8. Keep `transition: none`. A running transition can make color sampling
   timing-dependent.
9. Keep `background-color` opaque and synchronized with the resolved page
   background.
10. Keep the geometry pulse for theme and `pageshow` changes unless device
    testing proves a future Safari no longer caches color-only updates.
11. Keep the element at zero height outside coarse touch WebKit.
12. Keep the print rule.
13. Keep `THEME_CHROME_COLORS`, CSS theme variables, root and body inline
    colors, sampler color, and the script-owned `theme-color` in agreement.
14. Treat every new fixed or sticky element near a viewport edge as a possible
    sampling competitor.

Do not put prose inside the sampler for debugging. Use an outline on a separate
temporary branch or inspect its computed style in Web Inspector.

## Verification record

### Real device

The site owner tested the preview branch on a real iPhone and reported that the
final implementation works perfectly.

### iOS Simulator

The iPhone 17 Pro Simulator running iOS 26.5 passed:

- cold light and dark loads;
- light to dark to light changes;
- theme changes at a deep article anchor;
- drawer open and close in both themes;
- a theme change after drawer close;
- device-theme changes while scrolled;
- both landscape orientations;
- return from landscape to portrait;
- no visible sample band.

The final pass also checked that the top chrome followed the page after each
transition and that the docked table of contents button remained close to
Safari's controls.

### Chrome and automated checks

Responsive Chrome at `390 x 844` confirmed:

- the docked table of contents offset resolves to 8px;
- no horizontal overflow.

Desktop Chrome at `1280 x 900` confirmed:

- the sampler height resolves to zero;
- the desktop table of contents remains active;
- the mobile shell remains absent.

The branch passed:

- 55 Playwright checks across mobile WebKit, mobile Chromium, and
  desktop Chromium;
- 196 unit tests;
- typecheck;
- Biome;
- production build;
- React Doctor on changed code.

The automated WebKit contract checks geometry, text emptiness, opacity,
visibility, clipping, filter state, z-index relative to the header, theme color
agreement, drawer recomputes, and the 8px mobile table of contents offset.

## Limits

This is a workaround for an internal Safari heuristic, not a web-platform API.
WebKit can change the fixed-edge algorithm without preserving this behavior.

The real-device confirmation covers the tested iPhone and preview build. iPad,
desktop Safari tab presentation, older iOS releases, and future Safari
revisions can differ. The source also gives iPhone a different post-scroll
setting from larger Apple device classes.

If the workaround breaks after a Safari update, check these in order:

1. whether the sampler still covers WebKit's actual probe point;
2. whether both dimensions still use the direct computed-color path;
3. which renderer wins the frontmost fixed-container hit;
4. whether background clipping has moved into candidate eligibility;
5. whether a color-only update now invalidates the edge without a pulse;
6. whether Safari has finally exposed a supported author control.

## Sources

### Primary sources

- [WebKit `LocalFrameView.cpp` at the pinned revision](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp)
- [WebKit `Page.cpp` at the pinned revision](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/Page.cpp)
- [WebKit `PageColorSampler.cpp` at the pinned revision](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/PageColorSampler.cpp)
- [WebKit `BackgroundPainter.cpp` at the pinned revision](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp)
- [WebKit `RenderBoxModelObject.cpp` at the pinned revision](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBoxModelObject.cpp)
- [WebKit bug 300965](https://bugs.webkit.org/show_bug.cgi?id=300965)
- [WebKit bug 302272](https://bugs.webkit.org/show_bug.cgi?id=302272)
- [WebKit bug 301756](https://bugs.webkit.org/show_bug.cgi?id=301756)
- [WebKit backdrop sampling fix `2ae949b78743`](https://github.com/WebKit/WebKit/commit/2ae949b78743)
- [WHATWG HTML `theme-color`](https://html.spec.whatwg.org/multipage/semantics.html#meta-theme-color)
- Installed Base UI v1.6.0:
  `node_modules/@base-ui/react/dialog/portal/DialogPortal.js` and
  `node_modules/@base-ui/react/drawer/backdrop/DrawerBackdrop.js`

### Supplemental field reports

- [Safari 26 Liquid Glass: toolbar tinting, white bars, viewport bugs](https://1ar.io/updates/safari-26-liquid-glass-web/)
- [How to correctly tint Safari's toolbar in iOS 26](https://jahir.dev/blog/safari-toolbar)
- [iOS 26 Safari theme color tab tinting with fixed-position elements](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)
- [andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [Safari color tinting test matrix](https://safari-color-tinting.pages.dev/?b=0088ff&f=ffcc33&m=0,363636)
