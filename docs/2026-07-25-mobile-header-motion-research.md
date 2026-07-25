# Mobile Blog header motion research

**Date:** 2026-07-25

## Recommendation

Use **one stiff, non-bouncy Motion spring** to move the header between exactly two
resting positions: fully shown and fully hidden. Simplify the input controller before
tuning the spring:

1. Treat document scroll position as the authoritative signal, including inertial
   scrolling after `touchend`.
2. Clamp Safari's rubber-band values to the real `0…maxScroll` range.
3. Confirm a direction change with a small deadband, then immediately retarget the
   same spring.
4. Never store scroll-linked partial visibility as a state. A partial position may
   exist only while the spring is moving between its two endpoints.
5. Keep the live position and velocity outside React state; React should own setup,
   cleanup, and semantic endpoint state only.

This is an inference from the current implementation in
[`usePassiveBlogHeader.ts`](../src/components/blog/usePassiveBlogHeader.ts): touch
phases, a proportional CSS custom-property offset, the scroll-direction accumulator,
and a separate CSS transition currently create multiple clocks that can disagree.
The animation library cannot repair that state model by itself.

Motion is the best fit if the goal is a rigid physical object. Its `useSpring` follows
the latest target, its motion values track velocity and update the DOM without React
renders, and its physics controls use stiffness, damping, and mass. Motion specifically
documents comparing the current and previous `scrollY` motion values as a sticky-header
direction detector
([Motion `useScroll`](https://motion.dev/docs/react-use-scroll),
[Motion values](https://motion.dev/docs/react-motion-value),
[Motion `useSpring`](https://motion.dev/docs/react-use-spring),
[spring physics](https://motion.dev/docs/spring)).

Start critically or slightly over-damped: high stiffness, low mass, enough damping for
no overshoot. Tune on the real iPhone. The important invariant is not a particular
parameter set; it is that changing direction changes the spring's target without
resetting its current position or velocity.

## Interaction model

The detector and actuator should be separate:

```text
clamped scrollY
  -> signed delta
  -> direction confirmation / hysteresis
  -> target: shown | hidden
  -> one interruptible spring
  -> transform: translate3d(...)
```

Recommended detector behavior:

- Clamp `scrollY` at both ends. Safari can report negative values at the top and values
  beyond the maximum during rubber-band overscroll
  ([MDN `scrollY`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY)).
- Ignore subpixel noise, then reset accumulated intent as soon as the delta sign
  changes. `scrollY` is subpixel precise, so equality with integer positions is not a
  robust direction rule
  ([MDN `scrollY`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY)).
- Keep a small reversal deadband, but do not map the full hide/reveal threshold to the
  header's visual offset. Thresholds decide the binary target; the spring owns every
  intermediate pixel.
- Force the shown target near the top of the page and while focus is inside the header.
- Do not wait for `touchend`, a settle timer, or `scrollend` to choose the target.
  Momentum scrolling continues after the finger lifts, so scroll position remains the
  useful signal.

Recommended actuator behavior:

- The only stable targets are `0` and `-headerHeight` (including the required safe-area
  clearance).
- Retarget the same spring on every confirmed direction change. Do not start parallel
  animations and do not clear a partially applied transform.
- Animate the complete `transform` value, not a CSS custom property that then feeds a
  transform. Motion notes that animating CSS variables triggers paint, while
  `transform` and `opacity` are the cheapest broadly supported properties
  ([Motion performance](https://motion.dev/docs/performance),
  [Motion animation](https://motion.dev/docs/react-animation)).
- Prefer transform alone. Opacity is optional; it creates another value that must remain
  synchronized with visibility and pointer-event semantics.
- Under `prefers-reduced-motion: reduce`, jump directly to the selected endpoint.
  The preference is specifically intended to reduce or replace non-essential movement
  ([MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion),
  [Motion `useReducedMotion`](https://motion.dev/docs/react-use-reduced-motion)).

## React integration

The per-scroll signal, target, spring position, and velocity should not be React state.
Motion values update the DOM without triggering a React render and batch visual updates
to animation frames
([Motion values](https://motion.dev/docs/react-motion-value)).

Use an Effect or layout Effect to subscribe to the external scroll/animation system and
mirror every setup action in cleanup. React explicitly treats browser event
subscriptions and animation libraries as external systems, and Strict Mode deliberately
runs an extra setup/cleanup cycle to expose missing cleanup
([React `useEffect`](https://react.dev/reference/react/useEffect),
[React effect synchronization](https://react.dev/learn/synchronizing-with-effects)).

Keep the scroll handler tiny. A basic `scroll` event cannot be canceled, so `passive`
does not change its behavior; any retained touch or wheel listeners should remain
passive so they cannot delay native scrolling
([MDN `addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)).
Do not describe `requestAnimationFrame` as scroll-event throttling: MDN notes that
`scroll` callbacks and animation-frame callbacks generally run at the same rate
([MDN `scroll` event](https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event)).
Motion's frame loop is still useful for batching the render work.

## Options compared

| Option | Interruption and physical behavior | Performance and cost | Fit here |
|---|---|---|---|
| CSS transition | A new transition starts from the current style, and the CSS Transitions specification defines shortened reverse transitions ([MDN CSS/JS animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance), [CSS Transitions Level 2](https://www.w3.org/TR/css-transitions-2/#faster-reversing)) | No dependency; transform can be composited | Good zero-cost endpoint animation, but easing is not a continuously velocity-aware spring and the controller can still leave conflicting inline/CSS state |
| Native WAAPI | `Animation` exposes play, reverse, cancel, current time, and playback-rate control; `updatePlaybackRate()` synchronizes with the current playback position to avoid a jump ([MDN WAAPI guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API), [MDN `updatePlaybackRate`](https://developer.mozilla.org/en-US/docs/Web/API/Animation/updatePlaybackRate)) | No dependency; WAAPI lets the browser optimize the animation and transform can run on the compositor ([MDN WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API)) | Best zero-dependency alternative if a reversible eased animation feels physical enough; a real continuously retargeted spring requires more code |
| Motion | Motion values automatically end an existing animation when a new one starts, retain value/velocity state, and `useSpring` follows the latest target ([Motion values](https://motion.dev/docs/motion-value), [Motion `useSpring`](https://motion.dev/docs/react-use-spring)) | Tree-shakeable package; official figures are 2.3 kB for mini `useAnimate`, 17 kB for hybrid `useAnimate`, about 34 kB for the full `motion` component, or under 4.6 kB initial render with `LazyMotion`. Mini does not include a spring by itself ([Motion bundle guide](https://motion.dev/docs/react-reduce-bundle-size), [Motion mini spring note](https://motion.dev/troubleshooting/mini-spring)) | **Recommended** because the interaction explicitly needs fast spring retargeting and velocity continuity. Measure the actual Next.js chunk delta for the chosen imports |
| react-spring | Physics-first; its imperative API is recommended for user-input animation and updates without React renders. Controllers can stop/cancel queued work ([react-spring imperative API](https://react-spring.dev/docs/concepts/imperative-api), [Controller](https://react-spring.dev/docs/advanced/controller)) | Official site lists the web target at 19.2 kB; current npm metadata lists five direct dependencies ([react-spring](https://react-spring.dev/), [npm package](https://www.npmjs.com/package/%40react-spring/web?activeTab=dependencies)) | Strong second choice, especially if the site adopts spring animation more broadly; more package surface than this single interaction needs |
| GSAP | `quickTo()` reuses and redirects a tween for frequently changing targets; ScrollTrigger exposes direction and velocity and synchronizes updates to refreshes ([GSAP `quickTo`](https://gsap.com/docs/v3/GSAP/gsap.quickTo%28%29/), [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)) | Current npm metadata lists zero dependencies, but core plus scroll tooling is broader than this header ([npm package](https://www.npmjs.com/package/gsap)) | Excellent for a site-wide motion system or complex scroll choreography; excessive for one binary header and primarily duration/easing-oriented |
| Anime.js | Provides controls plus spring-generated easing; its WAAPI layer can use springs and custom easings ([Anime.js animation methods](https://animejs.com/documentation/animation/animation-methods/), [Anime.js spring](https://animejs.com/documentation/easings/spring/)) | Official docs quote about 3 kB for the WAAPI build and 10 kB for the JS build; current npm metadata lists zero dependencies ([Anime.js WAAPI guidance](https://animejs.com/documentation/web-animation-api/when-to-use-waapi/), [npm package](https://www.npmjs.com/package/animejs)) | Lightweight, but its documentation is less explicit about preserving continuous velocity through rapid retargets than Motion's motion-value model |

The repository currently has React 19.2.8 and no general animation runtime
([`package.json`](../package.json)). Adding one dependency is reasonable only if it
replaces the touch-phase/partial-offset machinery rather than layering another animation
engine on top of it.

## Acceptance criteria

The implementation should be considered correct when:

- alternating fast up/down scroll input always retargets the same moving header;
- after input stops, the header reaches exactly shown or hidden and never rests between;
- the latest confirmed direction wins, including during inertial scrolling;
- Safari top and bottom rubber-band movement cannot invert the intended direction;
- no scroll-frame React renders are required;
- only the header's transform changes during motion;
- focus, TOC navigation, keyboard behavior, and reduced motion still force deterministic
  endpoints;
- WebKit tests include repeated direction reversals before the previous motion settles,
  followed by real-iOS verification.
