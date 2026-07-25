# WebKit fixed-edge sampler: fully hidden candidate research

**Date:** 2026-07-25
**Source revision:** WebKit
[`0b1757694dabeeb50887ecb95dc800f36ebddf79`](https://github.com/WebKit/WebKit/commit/0b1757694dabeeb50887ecb95dc800f36ebddf79)
(`main` when fetched)
**Scope:** Whether a fixed top-edge color candidate can be fully invisible while remaining
eligible for WebKit's fixed-container edge color selection. Only official WebKit source is used
for load-bearing conclusions; field reports are supplemental.

> **Evidence labels.** **VERIFIED** means the condition is explicit in current WebKit source.
> **INFERENCE** means the proposed CSS behavior follows from those conditions but still needs
> Safari device verification.

## Result

The strongest approach, now confirmed in the iOS 26.5 Simulator and explained by current WebKit
source, is a fixed, full-width, empty box that:

- remains geometrically over the sampled edge;
- stays above every overlapping fixed, sticky, and overlay layer in the hit-test stack;
- has a border box larger than 10px in both dimensions;
- has a resolved, visible `background-color`;
- stays at ordinary CSS `opacity: 1` and `visibility: visible`;
- uses `background-clip: text` while containing no text or generated content;
- uses `pointer-events: none`;
- optionally pulses between two heights that are both above 10px to force theme resampling.

A fully transparent candidate mask is the next source-backed experiment, followed by
`filter: opacity(0)`. The filter function is distinct from CSS `opacity: 0` in WebKit's style
model and is not consulted by the candidate rejection or hit-testing code.

Moving the element wholly offscreen, reducing its transform to zero, applying an empty
`clip-path`, setting CSS `opacity: 0`, or using `visibility: hidden` all conflict directly with
the current selection path.

## The selection path

### 1. WebKit hit-tests one point on each viewport edge

**VERIFIED.** `LocalFrameView::fixedContainerEdges` contracts the fixed-position layout rect by
4px and computes one midpoint per requested edge. `findFixedContainer` performs a document hit
test at that point with `ForFixedContainerSampling` and `IgnoreClipping`; the first pass also
ignores CSS `pointer-events`.

Sources:

- [`LocalFrameView.cpp:2293-2313`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2293-L2313)
- [`LocalFrameView.cpp:2364-2377`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2364-L2377)
- [`LocalFrameView.cpp:2486-2508`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2486-L2508)
- [`HitTestRequest.h:37-59`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/HitTestRequest.h#L37-L59)

**Consequence:** the candidate must still geometrically contain the edge hit point. An element
translated or positioned completely offscreen cannot be the hit result.

The hit test returns one frontmost renderer. Eligibility is therefore insufficient by itself:
another fixed or sticky layer at the probe can prevent WebKit from ever reaching the intended
candidate. A paintless sampler may safely sit at the maximum CSS `z-index` with
`pointer-events: none`; the sampling pass initially ignores CSS pointer events, while ordinary
interaction passes through it.

### 2. Candidate dimensions are compared with the transformed absolute bounding box

**VERIFIED.** `compareWithViewportSize` uses `renderer.absoluteBoundingBoxRect()`. That method
defaults to `useTransform = true` and builds its bounds from transformed absolute quads.

For each dimension, current thresholds are:

- below 90% of the viewport: `Smaller`;
- 90% through less than 105%: `Similar`;
- 105% or more: `Larger`.

For a top-edge bar, width is the edge dimension and height is the adjacent dimension. A useful
top candidate therefore needs a width of at least 90% of the viewport and must not be excessively
tall. A normal 11–16px-high, full-width bar is classified as `IsCandidate`.

Sources:

- [`LocalFrameView.cpp:2330-2362`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2330-L2362)
- [`LocalFrameView.cpp:2431-2482`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2431-L2482)
- [`RenderObject.h:841-845`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderObject.h#L841-L845)
- [`RenderObject.cpp:828-845`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderObject.cpp#L828-L845)

### 3. CSS opacity and visibility are explicit rejection conditions

**VERIFIED.** `isHiddenOrNearlyTransparent` rejects:

- a layer whose content is hidden or whose CSS opacity is zero;
- any box whose CSS opacity is below `0.1`;
- an empty box with no background, backdrop filter, child, or replaced content.

`RenderLayer::isVisibilityHiddenOrOpacityZero` checks visible content and the computed
`opacity` property. `RenderElement::opacity()` is the computed CSS opacity value; CSS filters are
represented separately by `hasFilter()`.

Sources:

- [`LocalFrameView.cpp:2259-2271`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2259-L2271)
- [`PageColorSampler.h:38-45`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/PageColorSampler.h#L38-L45)
- [`RenderLayer.cpp:6142-6149`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L6142-L6149)
- [`RenderElementStyleInlines.h:38-46`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L38-L46)

**Consequence:** `opacity: 0`, `visibility: hidden`, and `display: none` are not viable hiding
mechanisms. A transparent `background-color` also cannot supply a visible edge color.

### 4. The 10px rule controls whether WebKit reads computed style or rendered pixels

**VERIFIED.** `primaryBackgroundColorForRenderer` returns no direct color when either border-box
dimension is `<= 10px`. It also requires:

- a non-hidden box;
- a resolved computed background color;
- a candidate that is not `Smaller` along the target edge.

When these checks pass, `fixedContainerEdges` uses that computed color directly before invoking
`PageColorSampler::predominantColor`.

Sources:

- [`LocalFrameView.cpp:2293-2296`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2293-L2296)
- [`LocalFrameView.cpp:2396-2415`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2396-L2415)
- [`LocalFrameView.cpp:2679-2703`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2679-L2703)

**VERIFIED.** If no direct background color is available and the same element was the last
candidate, WebKit reuses the previous edge color before attempting a new pixel snapshot.

Source:

- [`LocalFrameView.cpp:2688-2691`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2688-L2691)

**VERIFIED.** The pixel-sampling path discards fully transparent pixels and returns no
predominant color if the distribution is empty.

Source:

- [`PageColorSampler.cpp:300-359`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/PageColorSampler.cpp#L300-L359)

**Consequence:** a masked or filtered strip that is only 1–10px tall is the wrong shape. Its
rendered pixels are transparent, and the same-element cache can freeze the old theme color. Keep
both border-box dimensions above 10px so WebKit uses the resolved background instead of rendered
pixels.

## Hiding strategies

### 1. `background-clip: text` on an empty box — recommended and Simulator-confirmed

**Empirical status:** a full-width fixed candidate at `top: 0`, with 11/12px geometry,
`background-color`, and `background-clip: text` on an empty `div`, passed all of the following in
the iOS 26.5 Simulator:

- cold dark-theme load;
- dark → light → dark theme changes;
- theme changes while genuinely scrolled to a deep article anchor;
- drawer open and close at both the page top and a deep article anchor;
- device-theme light → dark changes while scrolled;
- both landscape orientations;
- return from landscape to portrait;
- no painted sample band.

The final matrix also exposed a stacking requirement that geometry-only tests missed. With the
sampler and `.site-header` both at `z-index: 50`, the later header and its real fade layer could
win WebKit's single frontmost hit test. The candidate was therefore eligible in isolation but not
necessarily selected. Raising the paintless sampler above all visual overlays made the complete
theme/drawer sequence deterministic.

Pixel samples taken from the rendered Simulator screenshot remained aligned with the page in the
two scrolled states: dark chrome `[12, 17, 29]` versus page `[10, 18, 31]`, and light chrome
`[241, 240, 249]` versus page `[228, 233, 245]`. These are observation values, not exact-color
assertions: Safari applies its own material treatment.

Chrome supplied the cross-browser checks. At a 390 × 844 responsive viewport, the TOC launcher
remained docked 8px above the visual viewport with no horizontal overflow. At 1280 × 900, the
sampler collapsed to zero height, the desktop TOC remained active, and the mobile shell remained
absent.

The current WebKit source explains why this combination can be visually empty while remaining
eligible.

**VERIFIED.** `RenderElement::hasBackground()` delegates to
`ComputedStyle::hasBackground()`. That style-level predicate returns true when the computed
background color is visible or a background image exists. It does not consult
`background-clip`.

Sources:

- [`RenderElementStyleInlines.h:34-46`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L34-L46)
- [`StyleComputedStyle+GettersInlines.h:298-304`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/style/computed/StyleComputedStyle+GettersInlines.h#L298-L304)

**VERIFIED.** `BackgroundPainter` reads the background layer's clip separately. For
`FillBox::Text`, it builds a masking clip by calling
`RenderBoxModelObject::paintMaskForTextFillBox`, then applies `SourceIn` before filling the
background color.

Sources:

- [`BackgroundPainter.cpp:213-230`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L213-L230)
- [`BackgroundPainter.cpp:383-450`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L383-L450)
- [`BackgroundPainter.cpp:481-520`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L481-L520)

**VERIFIED.** The text mask is painted in `PaintPhase::TextClip` with
`PaintBehavior::ForceBlackText`. In the inline path it iterates only text boxes. In the block path
it paints the subtree in that text-only phase. A truly empty `div` therefore contributes no
glyphs to the clip.

Source:

- [`RenderBoxModelObject.cpp:704-723`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBoxModelObject.cpp#L704-L723)

**VERIFIED.** Candidate eligibility and color extraction are independent of that paint clip:

- the non-empty check sees `hasBackground() == true`;
- `primaryBackgroundColorForRenderer` reads the resolved style `backgroundColor()` directly;
- normal hit-testing checks box geometry, visibility, pointer events, visual overflow,
  `clip-path`, and border radius, not `background-clip`.

Sources:

- [`LocalFrameView.cpp:2259-2271`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2259-L2271)
- [`LocalFrameView.cpp:2396-2415`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2396-L2415)
- [`RenderBox.cpp:1727-1758`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBox.cpp#L1727-L1758)

That split is the mechanism: WebKit's fixed-edge heuristic sees a visible computed background,
while the paint pipeline clips that background to a text mask containing no pixels.

Suggested shape:

```css
.safari-chrome-sample {
  position: fixed;
  z-index: 2147483647;
  top: 0;
  inset-inline: 0;
  height: 11px;
  pointer-events: none;
  background-color: var(--safari-chrome-color);
  -webkit-background-clip: text;
  background-clip: text;
  border: 0;
  box-shadow: none;
  transition: none;
}

.safari-chrome-sample[data-refresh] {
  height: 12px;
}
```

#### Fallback and maintenance risks

1. **The element must remain truly empty.** Text, generated `::before`/`::after` content, a list
   marker, or text-bearing descendants can create mask pixels and make the background visible in
   glyph shapes.
2. **`color: transparent` is not a substitute for emptiness.** The text-mask phase explicitly
   uses `ForceBlackText`, so otherwise transparent text can still define the background clip.
3. **Both dimensions must stay above 10px and top-edge width must remain at least 90% of the
   viewport.** If the computed-background shortcut fails, WebKit falls back to rendered-pixel
   sampling; the empty text clip then yields no visible pixels, and the same-element cache can
   retain the previous theme color.
4. **Only the background is clipped.** Borders, outlines, shadows, native appearance, and other
   decorations are separate paint work. Keep the node an undecorated empty `div`.
   `RenderBox::paintBoxDecorations` paints shadows and borders outside the background painter
   ([`RenderBox.cpp:1824-1907`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBox.cpp#L1824-L1907)).
5. **Printing deliberately changes the behavior.** In print economy handling, WebKit converts a
   text-clipped background to `BorderBox`
   ([`BackgroundPainter.cpp:251-277`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/BackgroundPainter.cpp#L251-L277)).
   This does not affect normal Safari web rendering, but print/PDF output should not rely on the
   concealment.
6. **It remains an internal-heuristic workaround.** There is no web-platform contract requiring a
   browser's chrome sampler to use the unpainted computed background. The Simulator result is
   strong evidence for Safari 26.5, not a permanent API guarantee.

### 2. Fully transparent CSS mask — strong alternative

**VERIFIED source facts:**

- Candidate invisibility checks do not inspect `hasMask()`.
- Normal box hit-testing checks bounds, visibility, `pointer-events`, visual overflow,
  `clip-path`, and border radius. It has no corresponding mask-alpha test.
- `visibleToHitTesting` checks visibility, skipped content, and `pointer-events`; it does not
  inspect masks.
- The computed-background shortcut reads the unmasked style background.

Sources:

- [`RenderElementStyleInlines.h:38-46`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L38-L46)
- [`RenderElementStyleInlines.h:162-168`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L162-L168)
- [`RenderBox.cpp:1727-1758`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBox.cpp#L1727-L1758)
- [`LocalFrameView.cpp:2396-2415`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2396-L2415)

**INFERENCE, high confidence:** a fully transparent `mask-image` should remove every painted
pixel while leaving the box hit-testable and eligible. Because WebKit reads its resolved
background color directly when the box is larger than 10px, transparent raster output should not
matter.

Suggested experiment:

```css
.safari-chrome-sample {
  position: fixed;
  z-index: 2147483647;
  top: 0;
  inset-inline: 0;
  height: 12px;
  pointer-events: none;
  background-color: var(--safari-chrome-color);
  -webkit-mask-image: linear-gradient(transparent, transparent);
  mask-image: linear-gradient(transparent, transparent);
  transition: none;
}

.safari-chrome-sample[data-refresh] {
  height: 13px;
}
```

Keep the element outside transformed/filter-containing ancestors so it remains genuinely
viewport-constrained.

### 3. `filter: opacity(0)` — strong fallback

**VERIFIED source facts:**

- `RenderElement::hasFilter()` and `RenderElement::opacity()` are separate style properties.
- The candidate-hidden predicate checks CSS opacity, not the filter list.
- The fixed-container walk treats `backdrop-filter` specially, but does not reject an ordinary
  `filter`.
- The traced box hit-test path has no filter-opacity gate.

Sources:

- [`RenderElementStyleInlines.h:38-46`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderElementStyleInlines.h#L38-L46)
- [`LocalFrameView.cpp:2259-2271`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2259-L2271)
- [`LocalFrameView.cpp:2541-2579`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/LocalFrameView.cpp#L2541-L2579)
- [`RenderBox.cpp:1727-1758`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBox.cpp#L1727-L1758)

**INFERENCE, high confidence:** `filter: opacity(0)` should be visually equivalent to transparent
output without tripping the explicit CSS-opacity rejection. It still requires the same
larger-than-10px geometry and resolved background so WebKit never depends on the transparent
snapshot.

Do not write `opacity: 0`; only the filter function has this source-backed distinction.

### 4. `clip-path` — fully clipped is not viable

**VERIFIED.** `RenderLayer::hitTestLayer` explicitly calls `RenderBox::hitTestClipPath` before
collecting hit-test fragments. Basic-shape clip paths must contain the hit location or the layer
is rejected.

Sources:

- [`RenderLayer.cpp:4798-4805`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L4798-L4805)
- [`RenderBox.cpp:1684-1710`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderBox.cpp#L1684-L1710)

**Consequence:** `clip-path: inset(50%)`, an empty path, or any clip that excludes the edge
midpoint prevents selection. A microscopic clip that still contains the exact midpoint may remain
eligible, but it is brittle and is not guaranteed to be visually pixel-free.

### 5. Transform or positional offscreen hiding — not viable

**VERIFIED.**

- Candidate sizing uses transformed absolute bounds.
- Transformed layers map the hit-test point through the inverse transform.
- A non-invertible transform is not hit-tested.
- Selection starts from the element under the edge midpoint.

Sources:

- [`RenderObject.h:841-845`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderObject.h#L841-L845)
- [`RenderObject.cpp:828-845`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderObject.cpp#L828-L845)
- [`RenderLayer.cpp:4737-4754`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L4737-L4754)
- [`RenderLayer.cpp:4947-4974`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L4947-L4974)

**Consequence:** `translateX(-100%)`, `left: -100%`, `scale(0)`, and equivalent whole-box
offscreen tricks lose the hit. An oversized element could be shifted while still covering the
midpoint, but then it is not actually geometrically offscreen; it still needs a mask or filter to
be visually absent.

### 6. Covering the sampler with another layer — possible but fragile

**VERIFIED.** The sampler uses a normal frontmost hit test, not an all-elements-under-point query.
A covering fixed or sticky layer can therefore become the selected hit and prevent WebKit from
reaching the sampler behind it.

**VERIFIED.** For `ForFixedContainerSampling`, `RenderLayer::hitTestLayer` skips a layer only when
it has no viewport-constrained relationship: no viewport-constrained descendant, is not itself
viewport constrained, has no fixed ancestor, and has no sticky ancestor. It also skips a
composited scroller with no background.

Source:

- [`RenderLayer.cpp:4704-4735`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayer.cpp#L4704-L4735)

**INFERENCE:** a separately layered, non-fixed cover may be ignored by the sampler while still
painting over the candidate. This depends on layer creation, ancestry, scrolling, and paint order,
so it is much less secure than a mask or regular filter on the candidate itself. A fixed/sticky
cover is specifically unsafe because it remains in the sampling hit-test.

## Theme changes and cache invalidation

**VERIFIED.** A viewport-constrained composited layer requests a fixed-container edge update when
its geometry changes and when its contents need display.

Sources:

- [`RenderLayerBacking.cpp:1597-1635`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayerBacking.cpp#L1597-L1635)
- [`RenderLayerBacking.cpp:4043-4084`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayerBacking.cpp#L4043-L4084)
- [`RenderLayerBacking.cpp:5304-5310`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/rendering/RenderLayerBacking.cpp#L5304-L5310)

**VERIFIED.** `Page::updateFixedContainerEdges` replaces the stored edges after the new live hit
test, with limited fallback to the prior element/color.

Source:

- [`Page.cpp:5444-5503`](https://github.com/WebKit/WebKit/blob/0b1757694dabeeb50887ecb95dc800f36ebddf79/Source/WebCore/page/Page.cpp#L5444-L5503)

**INFERENCE:** retain the existing one-painted-frame geometry refresh for theme changes, but pulse
between two heights that are both above 10px (for example 11px and 12px). That forces a geometry
update while keeping the direct computed-background path active. An empty text clip, like a
transparent mask, makes this pulse visually inert. Avoid a transform pulse because transforms
participate in both the candidate bounds and the hit test.

## Ranking

1. **`background-clip: text` on an empty 11px+ fixed candidate** — current source explains the
   style/paint split, and the complete target lifecycle has passed in the iOS 26.5 Simulator.
2. **Transparent CSS mask on an 11px+ fixed candidate** — strong source match; fully transparent
   paint, hit geometry retained, direct computed background retained.
3. **`filter: opacity(0)` on the same geometry** — also source-plausible; explicitly distinct
   from CSS opacity, but depends on the filter pipeline not gaining a future special case.
4. **A non-fixed, separately layered visual cover** — highly dependent on layer-tree and
   scrolling details.
5. **A tiny `clip-path` that includes the exact edge hit point** — can remain eligible, but not
   securely invisible and sensitive to rounding.
6. **Whole-box offscreen positioning or transforms** — incompatible with the midpoint hit test.
7. **CSS `opacity: 0`, `visibility: hidden`, `display: none`, or transparent background** —
explicitly rejected or unable to provide a color.

## Transparent-chrome experiment

The transparent route was tested before retaining the predicted-color sampler:

- no qualifying candidate;
- a 6px top candidate with transparent background and neutral
  `backdrop-filter: saturate(100%)`;
- a viewport-sized version of the same neutral backdrop-filter candidate.

The backdrop-filter variants reach WebKit's `foundBackdropFilter` branch and return
`PredominantColorType::Multiple` instead of a solid sampled color. That is useful for preventing
an unwanted fixed element from contributing its own background, as the community test matrix
demonstrates. It does not guarantee that Safari clears or recomposites a previously selected
native material. In the iOS 26.5 Simulator, a Light page could retain a dark status area after a
theme change or reload. Removing the candidate entirely produced the same unsafe fallback.

This makes transparency a poor invariant for a site that supports live theme switching. The
paintless-but-opaque computed candidate is retained because it gives WebKit an explicit current
color without painting that color into the document.

## Supplemental field reports

These reports helped define the test matrix and identify Safari 26 behavior seen outside this
repository. They are not used to prove the implementation mechanism:

- [Ben Frain: iOS 26 Safari theme color tab tinting with fixed-position elements](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)
- [WebKit bug 302272](https://bugs.webkit.org/show_bug.cgi?id=302272)
- [WebKit bug 300965](https://bugs.webkit.org/show_bug.cgi?id=300965)
- [andesco/safari-color-tinting](https://github.com/andesco/safari-color-tinting)
- [1ar: Safari 26 Liquid Glass web](https://1ar.io/updates/safari-26-liquid-glass-web/)
- [Nikita Nasedkin: iOS 26 Safari toolbar colors](https://nasedk.in/blog/ios26-safari-toolbar-colors/)
- [Jahir Fiquitiva: Safari toolbar](https://jahir.dev/blog/safari-toolbar)
- [Safari color tinting test matrix](https://safari-color-tinting.pages.dev/?b=0088ff&f=ffcc33&m=0,363636)

Older advice centered on `theme-color` or
`apple-mobile-web-app-status-bar-style` does not control this normal Safari tab path. The latter
meta tag is for standalone/full-screen web apps, not ordinary Safari browsing.
The standardized `theme-color` metadata remains useful as a fallback for older Safari, Chromium,
and installed-web-app contexts, so this implementation retains it without treating it as the
Safari 26 mechanism.

## Device verification needed

The empty text-clip candidate has passed the iOS 26.5 Simulator and Chrome matrices above. WebKit
still has no web-platform contract promising this behavior. Remaining verification:

- a real iPhone, including theme switching after the initial sample and fixed overlay cycles;
- optional desktop Safari tab testing, which exercises a different chrome presentation from the
  iPhone toolbar.

The decisive success criteria are: zero painted pixels from the candidate, correct tint after
light/dark switches, and correct tint after a fixed-layer recompute.
