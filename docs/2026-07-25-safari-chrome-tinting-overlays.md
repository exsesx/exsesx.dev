# Safari 26 chrome tinting across overlay lifecycles — primary-source investigation

**Date:** 2026-07-25
**Scope:** Why opening/closing the mobile Blog table-of-contents drawer leaves the top Safari
chrome untinted, verified against WebKit source, Base UI source on disk, and WebKit Bugzilla.
**Prior work (treated as given):** `docs/2026-06-06-safari-26-chrome-tinting-postmortem.md`,
`docs/safari-tinting-handoff.md`, `docs/safari-tinting-plan.md`.

> **Method note.** Every core claim below is cited to WebKit C++ source, Base UI's compiled
> source in `node_modules/`, this repo's own files, or WebKit Bugzilla. No blog posts were used
> for any load-bearing claim. Where I am reasoning rather than quoting, the text says
> **INFERENCE** explicitly.

> **2026-07-25 implementation update.** The visible permanent-band recommendation below is
> superseded by
> [`2026-07-25-webkit-fixed-edge-sampler-visibility.md`](./2026-07-25-webkit-fixed-edge-sampler-visibility.md).
> The candidate must remain at `top: 0`: WebKit contracts the viewport by 4px before probing the
> top edge, so moving an 11px element to `top: -9px` or `top: -11px` misses the probe or falls
> back to pixel sampling. The implemented candidate stays 11/12px tall and full-width but uses
> `background-clip: text` on a structurally empty element. WebKit can read its computed opaque
> background while the empty text mask paints no band. It must also outrank the later fixed
> header and all overlays: WebKit takes one frontmost hit at the probe, so equal stacking levels
> can make an otherwise eligible sampler lose by DOM order.

---

## The question

On mobile Safari 26, opening the blog TOC drawer disrupts the top chrome tint. After the drawer
closes, the top chrome is transparent/untinted. The tint only returns when the scroll-driven
header logic re-shows the header.

Primary hypothesis to test: *a Base UI backdrop that stays mounted after close (opacity:0 /
data-ending-style / backdrop-filter) is still a valid Safari sample source at the top edge.*

---

## Executive summary

**The primary hypothesis is REFUTED.** Base UI unmounts the entire portal — backdrop included —
on close. Nothing is left at the top edge.

**The actual cause is a WebKit scroll gate, not the drawer's DOM.** iOS 26 tints chrome from
`Page::updateFixedContainerEdges`, and that function **refuses to re-sample the top edge once
the user has scrolled below the top edge or interacted with the page**
([`Page.cpp:5464-5469`](#f4)). The repo's fix flashes an 11px sample band for 1000 ms; on a blog
article the user has always already scrolled, so **the flash lands in a window where WebKit has
stopped sampling the top edge at all**. The drawer is a trigger, not the cause — it perturbs
fixed-container state and forces a recompute that resolves to "no fixed edge".

**This also explains the one previously unexplained empirical constant:** the 11px minimum height
is `thinBorderWidth = 10` in [`LocalFrameView.cpp:2295`](#f7) — WebKit rejects any fixed container
whose border box is `<= 10px` tall.

**Recommendation: make the 11px band permanent (option 4a), not event-driven (option 4c).** The
1000 ms flash is architecturally unable to win against a gate that is closed for the entire
post-scroll lifetime of the page. Option 4c was already implemented in commit `febb7a6` and
removed in `43d3674` — the git history is itself evidence that the flash approach did not hold.

---

## Q1 — Base UI backdrop state after close: VERDICT = **hypothesis refuted**

### Verified: the portal unmounts entirely

`node_modules/@base-ui/react/dialog/portal/DialogPortal.js:23-37` (Drawer's Portal is a direct
re-export — `drawer/portal/DrawerPortal.js:16`: `const DrawerPortal = DialogPortal`):

```js
const { keepMounted = false, ...portalProps } = props;
const mounted = store.useState('mounted');
const shouldRender = mounted || keepMounted;
if (!shouldRender) {
  return null;
}
```

`keepMounted` defaults to `false`. Verified that this repo never passes it: `DrawerPortal` in
`src/components/ui/drawer.tsx:59-61` forwards props but `DrawerContent` (line 110) renders
`<DrawerPortal>` with no `keepMounted`. **After the close transition completes, `mounted` goes
false and the portal subtree — backdrop, viewport, popup — is removed from the DOM.**

This is a hard refutation: there is no closed-but-mounted backdrop to be sampled.

### Verified: even while mounted, the backdrop is `hidden` when not mounted

`node_modules/@base-ui/react/drawer/backdrop/DrawerBackdrop.js:50-60`:

```js
props: [{
  role: 'presentation',
  hidden: !mounted,
  style: {
    pointerEvents: !open ? 'none' : undefined,
    ...
```

The HTML `hidden` attribute applies `display: none`. **INFERENCE (well-founded):** this satisfies
the "hidden overlays must use `display:none`, not `opacity:0`" rule from the prior docs — Base UI
already does the right thing.

### Verified: `data-ending-style` is transient, not terminal

`node_modules/@base-ui/react/internals/stateAttributesMapping.js:24-33` — `data-ending-style` is
emitted only while `transitionStatus === 'ending'`. It is not a resting state. The repo's
`data-ending-style:opacity-0` class (`src/components/ui/drawer.tsx:77`) therefore applies only
during the exit animation, after which the element is gone.

### Verified: the internal backdrop has no background

`node_modules/@base-ui/react/utils/InternalBackdrop.js:31-37` renders `position: fixed; inset: 0`
with **no `background`/`background-color`**. Per `isHiddenOrNearlyTransparent`
([`LocalFrameView.cpp:2259-2271`](#f6)), a box with `!hasBackground() && !hasBackdropFilter() &&
!firstChild()` is treated as hidden → not a candidate. And it only exists while `mounted`
(`DialogPortal.js:43`).

**Q1 verdict: the closed drawer leaves nothing at the top edge. The hypothesis is refuted.**

---

## Q2 — This repo's own backdrop/overlay styling

Verified in `src/components/ui/drawer.tsx:77`, the overlay carries `dialog-backdrop`, and
`src/styles/globals.css:1123-1126`:

```css
.dialog-backdrop {
  background: color-mix(in oklab, var(--background) 42%, transparent);
  backdrop-filter: blur(2px);
}
```

Two findings, both only relevant **while the drawer is open**:

1. **`backdrop-filter` disqualifies it as a color source but not as a container.** In
   [`LocalFrameView.cpp:2665-2668`](#f8), when a candidate has a backdrop filter WebKit sets
   `PredominantColorType::Multiple` — i.e. it becomes "no usable color" rather than falling
   through to the next candidate:
   ```cpp
   if (result.foundBackdropFilter) {
       edges.colors.setAt(side, PredominantColorType::Multiple);
       continue;
   }
   ```
   **INFERENCE:** while open, the drawer overlay is the top-edge fixed container and yields no
   color — a plausible mechanism for the tint being disrupted *during* the open state.

2. **`supports-[-webkit-touch-callout:none]:absolute`** (`drawer.tsx:77`) switches the overlay to
   `position: absolute` on WebKit. Per [`LocalFrameView.cpp:2436-2437`](#f7)
   (`!isFixedPositioned() && !isStickilyPositioned()` → `NotFixedOrSticky`), an absolute element
   is **not** a container candidate on iOS. **INFERENCE:** on iOS the overlay is likely already
   excluded, which further weakens any "overlay is the culprit" theory and points at the scroll
   gate instead.

No app CSS keeps the overlay mounted after close; the mount lifecycle is entirely Base UI's.

### Verified: `.site-header` is never hidden by the blog header logic

The blog focus/passive-hidden rules (`src/styles/globals.css:683-763`) target only
`.site-header-nav-frame` and `.site-header-fade` — **never `.site-header` itself**. So the top
sample band's presence is governed solely by `html[data-chrome-sample]`
(`src/styles/globals.css:622-631`), which the 1000 ms flash controls.

### Verified: the `exsesx:safari-chrome-sample` event no longer exists

The task brief cites `ArticleToc.tsx` line ~125 dispatching this event. **That line is gone from
`main`.** It was added in `febb7a6` ("fix: resample Safari chrome after drawer close") along with
a matching `window.addEventListener("exsesx:safari-chrome-sample", flashChromeSampleBand)` in
`no-flash-script.ts`, and **both were removed in `43d3674`** ("fix: simplify mobile Blog table of
contents"). Confirmed by `git show febb7a6` / `git show 43d3674` and by grepping `src/` and
`tests/` — zero matches for `safari-chrome-sample` today. **Option 4c has already been tried and
reverted.**

---

## Q3 — WebKit's actual mechanism, and whether the sample can be pinned

### Two different WebKit features — and iOS 26 uses the second one

| Feature | Source | Role |
| --- | --- | --- |
| `sampledPageTopColor` | `PageColorSampler::sampleTop` | Older whole-page top-color snapshot |
| **`FixedContainerEdges`** | **`Page::updateFixedContainerEdges` / `LocalFrameView::fixedContainerEdges`** | **The iOS 26 edge tint the prior docs reverse-engineered** |

WebKit engineer Wenson Hsieh, in [WebKit Bugzilla #301756](https://bugs.webkit.org/show_bug.cgi?id=301756)
("Clarification: Top bar tint in Safari is derived from page background"), states the top bar tint

> "is only needed in cases where there's a viewport-constrained (fixed or sticky) element near one
> of the edges of the viewport that borders an obscured content inset"

and the bug is resolved as **expected behavior**, not a defect. This is the authoritative
confirmation that the fixed/sticky-element edge mechanism — not `theme-color` — is the design.

<a id="f4"></a>
### VERIFIED — the top edge stops being sampled after the user scrolls or interacts

[`Source/WebCore/page/Page.cpp:5458-5481`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Page.cpp):

```cpp
auto [edges, elements] = frameView->fixedContainerEdges([&] {
    auto sidesToSample = sides;
    auto scrollOffset = frameView->scrollOffset();
    auto minimumOffset = frameView->minimumScrollOffset();
    ...
    bool canSampleTopEdge = settings().topContentInsetBackgroundCanChangeAfterScrolling()
        || (!frameView->wasEverScrolledExplicitlyByUserBelowTopEdge() && !m_userHasInteractedSinceLastPageLoadExcludingForcedUserGestures)
        || document->parsing();

    if (scrollOffset.y() < minimumOffset.y() || !canSampleTopEdge)
        sidesToSample.remove(BoxSide::Top);
    ...
```

**This is the crux.** Unless the `topContentInsetBackgroundCanChangeAfterScrolling` setting is
enabled, the top edge is removed from the sampled set as soon as **either**:

- `wasEverScrolledExplicitlyByUserBelowTopEdge()` — set permanently true on the first explicit
  user scroll below the top ([`LocalFrameView.cpp:5771-5775`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp)):
  ```cpp
  if (userScrollType == UserScrollType::Explicit) {
      m_wasEverScrolledExplicitlyByUser = true;
      if (scrollOffset().y() > minimumScrollOffset().y())
          m_wasEverScrolledExplicitlyByUserBelowTopEdge = true;
  }
  ```
  It is reset only on frame reset (`LocalFrameView.cpp:275`) — i.e. on navigation, not on scroll
  back to top.
- **or** `m_userHasInteractedSinceLastPageLoadExcludingForcedUserGestures` — any user interaction.

**INFERENCE (high confidence), and this is the core diagnosis:** on a blog article the reader has
by definition scrolled and tapped the TOC trigger before the drawer ever opens. Both latches are
therefore already true, so `canSampleTopEdge` is false and `BoxSide::Top` is dropped from
`sidesToSample`. **A 1000 ms band flash after drawer close cannot be sampled, because WebKit is no
longer sampling that edge.** The tint "returns when the scroll-driven header logic re-shows the
header" because that path repaints an already-established fixed container rather than requiring a
fresh top-edge sample.

<a id="f5"></a>
### VERIFIED — a stale edge is retained only if the element still exists and is visible

[`Page.cpp:5483-5501`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Page.cpp) —
when no fixed edge is found, WebKit tries to carry forward the previous element's color, but only
under conditions:

```cpp
for (auto side : sides) {
    if (!edges.hasFixedEdge(side) || (!edges.predominantColor(side).isVisible() && fixedContainerEdges().predominantColor(side).isVisible())) {
        WeakPtr lastElement = m_fixedContainerEdgesAndElements.second.at(side);
        if (!lastElement)
            continue;
        CheckedPtr renderer = lastElement->renderer();
        if (!renderer)
            continue;
        if (renderer->style().usedVisibility() != Visibility::Visible
            && (side != BoxSide::Top || !lastElement->hasTagName(HTMLNames::headerTag))
            && (side != BoxSide::Bottom || !lastElement->hasTagName(HTMLNames::footerTag)))
            continue;
        elements.setAt(side, WTF::move(lastElement));
        edges.colors.setAt(side, fixedContainerEdges().colors.at(side));
    }
}
```

Note the **explicit special case for `<header>` and `<footer>` tags**: a non-visible element is
normally skipped, *unless* it is a `<header>` at the top or `<footer>` at the bottom. The repo's
sampled element is `<header className="site-header">` (`src/components/Header.tsx:78`), which
lands squarely in this carve-out. **INFERENCE:** this is why the collapsed (`height: 0`) header
retains its tint at all in the current design — WebKit is holding the last known color for a
`<header>` element. That retention is what breaks when the drawer's mount/unmount forces a
recompute that produces a genuinely empty result.

<a id="f6"></a>
### VERIFIED — `opacity: 0` and `visibility: hidden` DO disqualify (correcting a prior doc claim)

[`LocalFrameView.cpp:2259-2271`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp):

```cpp
static bool isHiddenOrNearlyTransparent(const RenderBox& box)
{
    if (CheckedPtr layer = box.layer(); layer && layer->isVisibilityHiddenOrOpacityZero())
        return true;
    if (box.opacity() < PageColorSampler::nearlyTransparentAlphaThreshold)
        return true;
    if (!box.hasBackground() && !box.hasBackdropFilter() && !box.firstChild() && !is<RenderReplaced>(box))
        return true;
    return false;
}
```

**The prior docs' claim that "`opacity: 0` still tints, so hidden overlays must use
`display: none`" is not supported by current WebKit source** — `isVisibilityHiddenOrOpacityZero()`
explicitly disqualifies both. That guidance came from secondary sources. It is harmless (it
over-restricts), but it should not drive design decisions going forward.

<a id="f7"></a>
### VERIFIED — the 11px threshold is `thinBorderWidth = 10`

[`LocalFrameView.cpp:2293-2295`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalFrameView.cpp):

```cpp
static constexpr auto sampleRectThickness = 2;
static constexpr auto thinBorderWidth = 10;
```

and at `LocalFrameView.cpp:2401-2402`:

```cpp
if (box->borderBoxWidth() <= thinBorderWidth || box->borderBoxHeight() <= thinBorderWidth)
    return { };
```

`<= 10` is rejected. **This is the exact source of the empirical "10px fails, 11px works" finding
from 2026-06-10** — a satisfying independent confirmation that the on-device work found the real
constant. The 11px floor in `globals.css:628` is correct and should not be lowered.

Candidate classification (`LocalFrameView.cpp:2429-2470`) also confirms from source:
`NotFixedOrSticky` (absolute children excluded), `IsHiddenOrTransparent`, `TooSmall`, `TooLarge`,
`NegativeZIndex`. Note **`NegativeZIndex` is a rejection reason** — so the prior finding that
"z-index does not influence the sampler" is true for *positive* stacking, but negative z-index
does disqualify.

### VERIFIED — sampling itself bails on running animations and transitions

[`PageColorSampler.cpp:93-101`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/PageColorSampler.cpp):

```cpp
// Skip nodes with animations as the sample may get an odd color if the animation is in-progress.
if (styleable.hasRunningTransitions())
    return false;
if (auto* animations = styleable.animations()) {
    for (auto& animation : *animations) {
        if (animation->playState() == WebAnimation::PlayState::Running)
            return false;
    }
}
```

**INFERENCE:** the drawer's 450 ms overlay/popup transitions (`drawer.tsx:77`, `:123`) mean any
sample attempted during open or close is likely to be rejected outright. Combined with the
`transition: none` already set on `.site-header` (`globals.css:619`), this validates that existing
choice and argues for **not** animating anything near the top edge during the drawer lifecycle.

### ANSWER to Q3: there is no supported way to pin the sample

I found **no public API, meta tag, CSS property, or JS hook** to control or lock chrome sampling.
Verified absences:

- `Page::sampledPageTopColor()` / `computeSampledPageTopColorIfNecessary()` /
  `clearSampledPageTopColor()` (`Page.h:934, 1478-1479`) are internal C++ with no web-exposed
  surface.
- The only tuning knobs are WebKit *settings* (`sampledPageTopColorMaxDifference`,
  `sampledPageTopColorMinHeight`, `topContentInsetBackgroundCanChangeAfterScrolling`) — embedder
  preferences, not reachable from a web page.
- Bugzilla #301756 explicitly closes the topic as expected behavior with no author control offered.

**Report honestly: no supported mechanism exists.** Everything in this repo's approach is
reverse-engineered behavior, and is inherently fragile across Safari updates.

---

## Q4 — Recommended fix

### Evaluation of the three candidate options

**(a) Keep the 11px band permanently — RECOMMENDED.**

- Works *with* the scroll gate instead of against it. If the band is always present, WebKit
  establishes the top fixed container **before** the user's first scroll — i.e. while
  `canSampleTopEdge` is still true (`Page.cpp:5464`) — and the `<header>` carve-out at
  `Page.cpp:5493-5496` then retains that color for the life of the page.
- Removes the entire class of "the flash expired / the flash was mistimed" bugs, including this
  one, bfcache restores, and theme toggles.
- **What breaks:** per the existing docs, nothing visually — the band's color equals the page
  background (`--safari-chrome-color` mirrors `--background`), and at 11px it hides behind
  Safari's own status-bar glass. The handoff doc's warning is specifically about heights
  approaching 44px, which visibly blocked content scrolling; 11px was chosen precisely because it
  does not.
- **Real risks to check on device:** (i) an always-present 11px opaque strip could clip the top of
  content scrolling beneath it if Safari's chrome is hidden in some states; (ii) it must stay
  iOS-gated — invariant 5 in the handoff doc (on desktop it must be `0` or the nav floats too low)
  still applies; (iii) `.site-header` must not gain a transition (`globals.css:619` already sets
  `transition: none`).
- Implementation shape: drop the `html[data-chrome-sample]` predicate from the rule at
  `globals.css:624` so the iOS-gated block sets `--safari-sample-band` unconditionally. Note
  `src/lib/animation-style.test.ts:122-143` asserts the current selector and would need updating.

**(b) Make the drawer backdrop non-qualifying — NOT SUFFICIENT ALONE.**

Partly moot: on iOS the overlay is already `position: absolute` (`drawer.tsx:77`) and thus already
`NotFixedOrSticky`. It cannot explain the *post-close* symptom at all, since the element is
unmounted by then (Q1). Worth doing only as defense-in-depth for the *during-open* disruption,
where `foundBackdropFilter` → `PredominantColorType::Multiple` (`LocalFrameView.cpp:2665-2668`) is
a genuine mechanism. Lowest priority.

**(c) Event-driven re-flash on overlay close — NOT RECOMMENDED; already tried and reverted.**

This is exactly what `febb7a6` implemented and `43d3674` removed. Source-level reason it cannot
work reliably: after the user has scrolled, `canSampleTopEdge` is false
(`Page.cpp:5464-5469`), so no amount of well-timed flashing produces a top-edge sample. It also
races the drawer's 450 ms exit transition, during which `hasRunningTransitions()`
(`PageColorSampler.cpp:94`) rejects sampling anyway.

### Recommendation

**Adopt (a): make the 11px iOS sample band permanent.** Keep the iOS/coarse-touch gate, keep the
11px floor (now source-confirmed as `thinBorderWidth = 10` + 1), keep `transition: none`. Retire
the `flashChromeSampleBand` timer and the `data-chrome-sample` attribute along with it, which also
deletes the `pageshow`/theme-change timing coupling in `src/lib/no-flash-script.ts:24-30`.

Tradeoff accepted: a permanently present 11px opaque band on iOS instead of a transient one. Given
the band is background-colored and sits behind Safari's status-bar chrome, the visual cost is
expected to be nil — but this is the one thing that **must** be confirmed on device.

---

## Q5 — Safari 26.x changes after 2026-06-11

Checked WebKit's official release notes for any chrome-tinting, page-color-sampling,
`theme-color`, or fixed/sticky-edge changes:

- [WebKit Features for Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/) — no mention.
- [WebKit features for Safari 26.3](https://webkit.org/blog/17798/webkit-features-for-safari-26-3/) — no mention.
- [WebKit Features for Safari 26.4](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/) — no mention.
- [WebKit Features for Safari 26.5](https://webkit.org/blog/17938/webkit-features-for-safari-26-5/) — no mention.

**No documented behavior change affects the above.** The prior on-device findings from 2026-06-10
and 2026-06-11 remain applicable. (Caveat: release notes do not enumerate every internal change;
absence of a note is not proof of absence of a change.)

---

## Unverified / needs on-device confirmation

Everything here is reasoning from source that I could not execute on an iOS 26 device.

1. **That `canSampleTopEdge` is in fact false in the failing scenario.** This is the central
   diagnosis and it is an INFERENCE. It depends on the runtime default of
   `topContentInsetBackgroundCanChangeAfterScrolling`, which I could **not** locate in
   `Settings.yaml` or the WebKit preferences files I fetched. If that setting ships enabled in
   Safari 26, the scroll gate is open and this diagnosis is wrong — in which case the fallback
   explanation is the `Page.cpp:5483-5501` retention path failing because the recompute triggered
   by the drawer's unmount produces an empty result.
2. **That the permanent 11px band is visually invisible on device**, across notch/Dynamic Island
   and non-notch devices, in both themes, and while Safari's chrome auto-hides on scroll. This is
   the main risk of the recommendation and the reason to test before shipping.
3. **That making the band permanent actually fixes the symptom.** Source says it should establish
   the container pre-scroll; only the device can confirm the tint survives a drawer open/close.
4. **Whether the drawer overlay disrupts the tint while open** on iOS. I inferred it is likely
   already excluded via `position: absolute`, but `foundBackdropFilter` remains a live mechanism if
   any full-viewport fixed element with `backdrop-filter` reaches the top edge.
5. **Base UI's scroll lock as a secondary suspect.** Verified that `useScrollLock(open && modal === true, ...)`
   runs (`node_modules/@base-ui/react/dialog/root/useDialogRoot.js:89`) and that on iOS it takes
   the `preventScrollOverlayScrollbars` path (`node_modules/@base-ui/utils/useScrollLock.js:223`),
   setting `overflowY/X: hidden` on `<html>` or `<body>` and restoring on close. **INFERENCE:** this
   mutates the very elements that back the bottom-bar tint and could plausibly trigger the
   fixed-container recompute. Not confirmed as causal; worth ruling out on device if the
   recommendation does not fully resolve the issue.
6. **The `<header>` retention carve-out** (`Page.cpp:5493-5496`) is read from source but its
   practical effect on this page was not observed directly.

---

## Corrections to prior docs

Two claims in the earlier docs are not supported by current WebKit source and should not be
carried forward:

1. **"Hidden overlays must use `display: none` — `opacity: 0` still tints."** Refuted by
   `isHiddenOrNearlyTransparent` (`LocalFrameView.cpp:2259-2271`), which disqualifies both
   `visibility: hidden` and `opacity: 0`.
2. **"z-index does NOT influence the sampler."** True for positive stacking, but `NegativeZIndex`
   is an explicit rejection reason in `containerEdgeCandidateResult`
   (`LocalFrameView.cpp:2423`). Negative z-index does disqualify a candidate.

Conversely, one empirical finding is now **confirmed at source level**: the 11px minimum is
`thinBorderWidth = 10` (`LocalFrameView.cpp:2295, 2401-2402`).

---

## Primary sources

**WebKit source (github.com/WebKit/WebKit, `main`, fetched 2026-07-25)**
- `Source/WebCore/page/Page.cpp:5444-5513` — `updateFixedContainerEdges`, the scroll gate, the retention carve-out
- `Source/WebCore/page/Page.cpp:3671-3690` — `sampledPageTopColor`, `computeSampledPageTopColorIfNecessary`, `clearSampledPageTopColor`
- `Source/WebCore/page/Page.h:934, 1478-1479, 1781-1782` — declarations, `m_fixedContainerEdgesAndElements`
- `Source/WebCore/page/LocalFrameView.cpp:2259-2271` — `isHiddenOrNearlyTransparent`
- `Source/WebCore/page/LocalFrameView.cpp:2293-2295` — `sampleRectThickness`, `thinBorderWidth`
- `Source/WebCore/page/LocalFrameView.cpp:2396-2470` — candidate classification
- `Source/WebCore/page/LocalFrameView.cpp:2648-2700` — color resolution, backdrop-filter handling
- `Source/WebCore/page/LocalFrameView.cpp:5771-5775` — `m_wasEverScrolledExplicitlyByUserBelowTopEdge`
- `Source/WebCore/page/PageColorSampler.cpp:68-114, 170-199` — sample validity, bailouts

**WebKit Bugzilla**
- [#301756 — Clarification: Top bar tint in Safari is derived from page background](https://bugs.webkit.org/show_bug.cgi?id=301756)

**Base UI v1.6.0 (on disk, `node_modules/@base-ui/react`)**
- `dialog/portal/DialogPortal.js:23-48`, `drawer/portal/DrawerPortal.js:16`
- `drawer/backdrop/DrawerBackdrop.js:27-63`
- `internals/stateAttributesMapping.js:7-34`, `utils/popupStateMapping.js:84-97`
- `utils/InternalBackdrop.js:13-39`
- `dialog/root/useDialogRoot.js:89`, `node_modules/@base-ui/utils/useScrollLock.js:47-68, 223-231`

**This repo**
- `src/components/ui/drawer.tsx:59-61, 77, 110-123`
- `src/components/blog/ArticleToc.tsx:110-121, 145`
- `src/components/Header.tsx:78`
- `src/lib/no-flash-script.ts:24-30, 134-138`
- `src/styles/globals.css:605-631, 683-763, 1123-1126`
- Commits `febb7a6` (added event-driven re-flash) and `43d3674` (removed it)

**Safari release notes** — 26.2 / 26.3 / 26.4 / 26.5, all checked, none mention chrome tinting.

---
---

# Follow-up (2026-07-25, second pass): scroll-scoped band evaluated; primary diagnosis RETRACTED

Context for this section: option (a) (permanent 11px band) was **rejected by the user** on design
grounds — `.site-header` is `fixed top-0` full-width, so a permanent solid band fights
`.site-header-fade` (`globals.css:663`) and defeats the blog reading mode that hides the whole nav
frame (`globals.css:689`). The proposed reframe was a **scroll-scoped band**: present on load,
before the `canSampleTopEdge` latches trip, then collapsed to `0px` on first scroll, relying on the
`<header>` retention carve-out to hold the color.

I was asked two decisive questions. **Both fail, and the second one retracts my primary diagnosis
from the first pass.** Reporting that plainly, as instructed.

---

## Q2 first (it changes everything): `topContentInsetBackgroundCanChangeAfterScrolling` ships **ENABLED on iPhone**

I said in the first pass that I could not locate this default. I found it. The preferences file is
`Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml` (not the `WebPreferences*.yaml` names I
guessed the first time).

<a id="g1"></a>
**VERIFIED** — [`UnifiedWebPreferences.yaml:8999-9010`](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml):

```yaml
TopContentInsetBackgroundCanChangeAfterScrolling:
  type: bool
  status: internal
  humanReadableName: "Top Content Inset Background Can Change After Scrolling"
  humanReadableDescription: "Top content inset background can change after scrolling"
  defaultValue:
    WebKit:
      default: WebKit::defaultTopContentInsetBackgroundCanChangeAfterScrolling()
    WebKitLegacy:
      default: false
    WebCore:
      default: false
```

**VERIFIED** — `Source/WebKit/Shared/Cocoa/WebPreferencesDefaultValuesCocoa.mm:155-162`:

```cpp
SUPPRESS_NODELETE bool defaultTopContentInsetBackgroundCanChangeAfterScrolling()
{
#if PLATFORM(IOS_FAMILY)
    return PAL::currentUserInterfaceIdiomIsSmallScreen();
#else
    return false;
#endif
}
```

**VERIFIED** — `Source/WebCore/PAL/pal/system/ios/UserInterfaceIdiom.mm:105-109` maps
`UIUserInterfaceIdiomPhone` to `UserInterfaceIdiom::SmallScreen`:

```cpp
auto idiom = [[PAL::getUIDeviceClassSingleton() currentDevice] userInterfaceIdiom];
if (idiom == UIUserInterfaceIdiomPad || idiom == UIUserInterfaceIdiomMac)
    return UserInterfaceIdiom::Desktop;
if (idiom == UIUserInterfaceIdiomPhone || idiom == UIUserInterfaceIdiomWatch || shouldForceUserInterfaceIdiomSmallScreen(idiom))
    return UserInterfaceIdiom::SmallScreen;
```

### Consequence: my first-pass primary diagnosis was WRONG

On **iPhone**, `defaultTopContentInsetBackgroundCanChangeAfterScrolling()` returns `true`, so in
`Page.cpp:5464`:

```cpp
bool canSampleTopEdge = settings().topContentInsetBackgroundCanChangeAfterScrolling()  // ← true on iPhone
    || (...);
```

the short-circuit makes `canSampleTopEdge` unconditionally **true**. **The scroll gate is OPEN on
iPhone.** The top edge continues to be sampled after scrolling and after interaction.

**I retract the first-pass claim that "a 1000 ms band flash cannot be sampled because WebKit has
stopped sampling the top edge."** That reasoning applies to iPad/Mac, not to the iPhone this bug is
reported on. The scroll gate is not the cause. (Note the on-device work was done on iPhone; had it
been an iPad the first-pass diagnosis would have held.)

This also **removes the entire premise of the scroll-scoped band idea** — there are no latches to
race on iPhone, so "establish the color before the latch trips" describes a latch that never trips.

---

## Q1: retention does **NOT** survive the element becoming non-qualifying

Answering anyway, because it independently kills the scroll-scoped band and constrains any future
design.

### VERIFIED — the edge state is recomputed wholesale, not latched

`FixedContainerEdges` is stored on `Page` as `m_fixedContainerEdgesAndElements`
(`Page.h:1782`), but `Page::updateFixedContainerEdges` **reassigns it in full** on every run
(`Page.cpp:5503`):

```cpp
m_fixedContainerEdgesAndElements = std::make_pair(makeUniqueRef<FixedContainerEdges>(WTF::move(edges)), WTF::move(elements));
```

`edges` is a fresh local, populated from a live hit test each time
(`LocalFrameView.cpp:2486-2500`, `findFixedContainer` → `document->hitTest(...)` at the edge
midpoint). **There is no cache keyed to "a color was once established."**

### VERIFIED — the `<header>` carve-out requires the element to still be a live, laid-out renderer

Re-reading `Page.cpp:5483-5501` precisely, the retention path is guarded by three conditions before
the `<header>` exemption is even reached:

```cpp
WeakPtr lastElement = m_fixedContainerEdgesAndElements.second.at(side);
if (!lastElement)
    continue;                                   // (1) element must still exist
CheckedPtr renderer = lastElement->renderer();
if (!renderer)
    continue;                                   // (2) must still have a renderer
if (renderer->style().usedVisibility() != Visibility::Visible
    && (side != BoxSide::Top || !lastElement->hasTagName(HTMLNames::headerTag))
    && (...))
    continue;                                   // (3) <header> exemption — VISIBILITY only
```

The `<header>` exemption at (3) is **narrowly scoped to `usedVisibility()`** — i.e. it forgives
`visibility: hidden`, and nothing else. It does not forgive a zero height.

Critically, the retention branch only runs when `lastElement` is still recorded in
`m_fixedContainerEdgesAndElements.second`. That map is repopulated from the current hit test
(`containers.setAt(side, *result.container)`, `LocalFrameView.cpp:2661`). **INFERENCE (high
confidence):** a header collapsed to `height: 0` fails `containerEdgeCandidateResult` at
`LocalFrameView.cpp:2401-2402` (`borderBoxHeight() <= thinBorderWidth`) → `TooSmall`, and a
zero-height box is not hit at the edge midpoint at all, so it is never re-recorded as
`lastElement`. Once a *different* element (or none) occupies the top edge on a subsequent
recompute, the previous color is not carried forward.

### VERIFIED — recomputes are frequent, and the drawer forces one

`WebPage::willCommitMainFrameData` (`Source/WebKit/WebProcess/WebPage/Cocoa/WebPageCocoa.mm:2367-2370`):

```cpp
if (std::exchange(m_needsFixedContainerEdgesUpdate, false)) {
    page->updateFixedContainerEdges(sidesRequiringFixedContainerEdges());
    data.fixedContainerEdges = page->fixedContainerEdges();
}
```

and the flag is set by `WebPage::didAddOrRemoveViewportConstrainedObjects` (`WebPage.cpp:10722-10724`):

```cpp
void WebPage::didAddOrRemoveViewportConstrainedObjects()
{
    m_needsFixedContainerEdgesUpdate = true;
```

**This is the direct link to the drawer.** Base UI mounts and unmounts `position: fixed` elements
(the viewport and popup — `drawer.tsx:115, 123`) on every open/close. Each mount/unmount is an
add/remove of a viewport-constrained object → forces a full `updateFixedContainerEdges` recompute
on the next main-frame commit. **If `.site-header` is collapsed to `0px` at that moment (i.e. the
1000 ms flash has expired), the recompute finds nothing qualifying at the top edge and the tint is
lost.**

### Q1 verdict: **retention does NOT survive collapse. The scroll-scoped band is dead.**

A band that is present on load and collapses on first scroll would hold its color only until the
next recompute — which the drawer itself guarantees. Confirmed non-viable.

---

## Revised diagnosis of the reported symptom

Replacing the first-pass diagnosis. **INFERENCE**, but now consistent with all verified source:

1. The reader scrolls; the 1000 ms `data-chrome-sample` flash from load has long expired, so
   `--safari-sample-band` is `0px` and `.site-header` is a zero-height fixed element.
2. Until the drawer opens, the tint persists only because **no recompute has been forced** — the
   last computed `FixedContainerEdges` is simply still in `m_fixedContainerEdgesAndElements`.
3. Opening/closing the drawer mounts and unmounts fixed elements →
   `didAddOrRemoveViewportConstrainedObjects()` → `m_needsFixedContainerEdgesUpdate = true` →
   full recompute at the next commit (`WebPageCocoa.mm:2367`).
4. That recompute hit-tests the top edge midpoint. `.site-header` is `0px` → `TooSmall` /
   not hit. Nothing else qualifies → **top edge resolves to no color → chrome goes transparent.**
5. The tint returns when the scroll-driven header logic re-shows the header, because that restores
   a qualifying element at the top edge for the following recompute.

This explains every part of the report — including why the tint survives ordinary scrolling but
dies specifically on drawer close, which the scroll-gate theory did **not** explain.

**Note this makes the symptom a latent bug, not a drawer bug.** Any recompute trigger (rotation,
`resize`, viewport inset change, another fixed element mounting) would expose it identically. The
drawer is just the most reliable trigger.

---

## Revised recommendation

Neither the permanent band (rejected on design) nor the scroll-scoped band (dead per Q1) is right.
The honest framing: **the current design keeps a qualifying element at the top edge for only 1000 ms
per event, and relies on no recompute happening afterwards — which is not a guarantee WebKit
offers.** Two defensible paths:

**Option A — flash on recompute triggers, accepting it is heuristic.** Re-add an event-driven flash
(as `febb7a6` did) on drawer close, and also on `resize`/`orientationchange`. Unlike the first
pass, I now believe this *can* work on iPhone, because the scroll gate is open — the earlier
source-level objection to option (c) does not apply. **But it remains a heuristic**: it re-tints
*after* a visible transparent frame rather than preventing one, and it cannot enumerate every
recompute trigger. `43d3674` removed it once already; re-adding it should be a deliberate choice
with eyes open, not a re-litigation.

**Option B — accept the platform ceiling.** Asked directly whether "top-bar tint correct on load,
drifts after deep interaction, unpinnable by design" is the ceiling: **on the evidence, largely
yes.** Supporting facts, all verified: there is no web-exposed API to pin the sample (Q3, first
pass); WebKit closed [#301756](https://bugs.webkit.org/show_bug.cgi?id=301756) as expected
behavior; sampling requires a **live, qualifying, ≥11px, non-animating** element at the edge at
**every** recompute, and the design goal here is explicitly for that element to be *absent* most of
the time. **Those two requirements are in direct conflict.** The postmortem's ranked fallback #4
("accept top-bar limitation") is a legitimate engineering answer, not a defeat.

**My recommendation: Option B, with Option A only if the transparent-chrome flash is judged worse
than the band.** I am deliberately not manufacturing a third clever workaround; the conflict above
is structural, and any further trick would be another timing heuristic against an engine that
recomputes on its own schedule.

---

## Corrections to the first pass (this section supersedes)

1. **RETRACTED: "the scroll gate closes and the flash lands in a dead window."** False on iPhone —
   `topContentInsetBackgroundCanChangeAfterScrolling` defaults to `true` there
   (`WebPreferencesDefaultValuesCocoa.mm:155-162`), so `canSampleTopEdge` is always true. The
   first-pass reasoning holds only on iPad/Mac. This was flagged as the #1 unverified item and it
   did not survive verification.
2. **RESOLVED: the setting's default**, which the first pass could not locate — see [Q2](#g1).
3. **The first pass's Q4 recommendation (permanent band) rested on the retracted diagnosis** and is
   independently rejected on design grounds. Disregard it.

Unchanged and still verified from the first pass: Q1's refutation of the mounted-backdrop
hypothesis; `thinBorderWidth = 10` as the source of the 11px floor; `opacity: 0` and
`visibility: hidden` both disqualifying; negative z-index disqualifying; no pinning API existing.

---

## Still needs on-device confirmation

1. **That the drawer's fixed-element mount/unmount is what forces the recompute.** The code path is
   verified; that this specific drawer triggers it is inference. Testable: trigger any other
   fixed-element mount, or rotate the device, on a scrolled article — if the tint drops
   identically, the recompute theory is confirmed and the drawer is exonerated as a special case.
2. **That a zero-height `.site-header` fails the hit test at the edge midpoint** rather than being
   retained. Testable by temporarily pinning the band open and confirming the tint survives a
   drawer cycle.
3. **The iPad case is genuinely different.** On iPad the setting is `false`, so the first-pass
   scroll-gate analysis applies there and the top tint may behave differently after scrolling.
   Untested; worth knowing before treating any fix as universal.

## Additional primary sources (this section)

- `Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml:8999-9010` — the setting and its default wiring
- `Source/WebKit/Shared/Cocoa/WebPreferencesDefaultValuesCocoa.mm:155-162` — iPhone → `true`
- `Source/WebKit/Shared/WebPreferencesDefaultValues.cpp:486-491` — non-Cocoa → `false`
- `Source/WebCore/PAL/pal/system/ios/UserInterfaceIdiom.mm:62-67, 89-117` — `SmallScreen` == iPhone
- `Source/WebKit/WebProcess/WebPage/Cocoa/WebPageCocoa.mm:2367-2370` — recompute on main-frame commit
- `Source/WebKit/WebProcess/WebPage/Cocoa/WebPageCocoa.mm:1707-1740` — `sidesRequiringFixedContainerEdges`
- `Source/WebKit/WebProcess/WebPage/WebPage.cpp:10722-10724` — `didAddOrRemoveViewportConstrainedObjects`
- `Source/WebKit/WebProcess/WebPage/WebPage.h:2199, 3287` — the update flag
- `Source/WebCore/page/Page.cpp:5483-5503, 5515-5518` — retention path, wholesale reassignment
- `Source/WebCore/page/LocalFrameView.cpp:2364-2373, 2486-2500, 2661` — edge-midpoint hit test

---

# Implementation follow-up (2026-07-25): lifecycle-held sampling

The white cross-theme flash was judged more damaging than the residual platform risk, so the
implementation deliberately takes the refined form of Option A.

## Decision

The 11px band is not permanent and is not flashed only after close. Every shared Base UI Drawer
now acquires a reference-counted sampling hold before its fixed portal mounts, keeps the band
qualifying throughout the open and exit states, and releases it only from
`onOpenChangeComplete(false)`. Release leaves the existing 1000ms sampling tail.

This closes the visible-frame gap in the simpler close-only heuristic: the live, solid,
non-animating sample source is already present when WebKit observes both the fixed-object addition
and removal. Theme changes, `pageshow`, `resize`, and `orientationchange` use the same controller;
a timed flash cannot remove the band while any drawer still owns a hold.

The CSS gate remains coarse-touch WebKit-only, so desktop layout and the hidden reading header are
unchanged after the sampling tail. This is still not a supported Safari API and cannot promise
coverage for an unknown future WebKit recompute trigger.

## Simulator and automated verification

Verified on the iPhone 17 Pro Simulator with iOS 26.5 against `localhost:3000`:

- light and dark theme changes retinted the top chrome without a cross-theme flash;
- closing the TOC retained the correct tint after the drawer portal unmounted and after the 1000ms
  tail expired;
- portrait and both landscape orientations preserved the safe inline article geometry;
- the landscape drawer remained usable in the short viewport;
- the docked TOC launcher cleared the rounded corner and moved closer to Safari controls.

The docked launcher now uses a constant `bottom: 1.25rem`. The former
`max(1.25rem, env(safe-area-inset-bottom))` resolved to the iPhone's larger reported bottom inset
and lifted the launcher farther from Safari's compact controls. The landscape-aware left inset is
unchanged.

The mobile WebKit regression test asserts that the sample hold spans portal mount and unmount,
that the sampled background tracks the selected theme, and that the band returns to its dormant
state after the tail. The full mobile Safari contract suite also covers the short landscape
viewport and the 20px launcher offset.

---

# Second implementation follow-up (2026-07-25): crop the candidate, not the sample

The lifecycle-held pass fixed the drawer-close tint failure, but Simulator review exposed its
design cost: the whole 11px qualifying box was painted inside the page while the drawer was open
and throughout the close tail. That reads as a solid bar over the article, even though it does not
take layout space. The earlier implementation and its 20px TOC offset are superseded by this
follow-up.

## Decision

Safari's two relevant constants suggest a narrower compromise:

- `thinBorderWidth = 10` means the candidate's border box must remain at least 11px tall;
- `sampleRectThickness = 2` means only the two-pixel slice touching the viewport edge needs to
  contain the sample color.

The sampler is now a dedicated fixed element instead of the header shell. Its border box remains
11px tall, but `top: -9px` shifts nine pixels above the viewport so at most two pixels intersect the
visible page. The real navigation stays at `top: 0` and is no longer moved or resized for sampling.

The candidate remains mounted on coarse-touch WebKit. That removes the timer, drawer event,
reference counting, and guessed resize/orientation lifecycle list. Theme changes still update
`--safari-chrome-color`; every fixed-container recompute can find the same qualifying element.

Simulator probing found that changing only the candidate's background color does not invalidate
Safari's cached fixed edge. Theme changes therefore apply a one-painted-frame geometry pulse from
11px at `top: -9px` to 12px at `top: -10px`. Both states expose exactly two pixels, but the
one-pixel border-box change forces WebKit to resample the new color. `pageshow` uses the same
invisible pulse for bfcache restores.

This is still a reverse-engineered WebKit workaround. The key on-device question is whether a
partially offscreen 11px fixed box continues to qualify while covering the full two-pixel sample
rectangle. If a real device rejects it, the honest fallback is to remove the sampler and accept
Safari's native transparent chrome rather than restore the visible 11px band.

An 11px candidate at `top: -11px` was tested in the iOS 26.5 Simulator. It was completely
invisible, but Safari retained the previous dark tint after switching the page to light, including
after opening the drawer forced a fixed-container recompute. Merely touching the viewport edge is
not enough; the candidate must cover the two-pixel sample rectangle. `top: -9px` is therefore the
maximum concealment supported by the observed algorithm.

## TOC placement

The docked launcher now uses `bottom: 0.5rem` (8px). The previous 1.25rem value was technically
applied, but the resulting 20px CSS gap still read as roughly 32–40px against Safari's floating
toolbar in the Simulator screenshot. Eight pixels makes the move visible while preserving a clear
separation from the browser control.

## Regression contract

- the CSS candidate remains 11px tall on coarse-touch WebKit but begins at `top: -9px`;
- its refresh state becomes 12px tall at `top: -10px`, preserving the same two-pixel intersection;
- its visible intersection with the page is at most two pixels throughout drawer and theme
  lifecycles;
- the docked TOC launcher resolves to an 8px viewport offset;
- portrait and short-landscape drawer coverage remains unchanged.
