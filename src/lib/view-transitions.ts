const desktopViewTransitionQuery = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Synchronous, SSR-safe check for whether desktop view transitions should run.
 *
 * This gates the *imperative* theme-sweep transition only (see ThemeSwitcher),
 * which is started inside a click handler where matchMedia can be read directly.
 *
 * React `<ViewTransition>` boundaries are NOT gated here. They are always rendered
 * so shared-element morphs can pair old↔new across a navigation; their animations
 * are disabled on touch/mobile purely in CSS via the desktop media query.
 */
export function canUseDesktopViewTransitions() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(desktopViewTransitionQuery).matches && !window.matchMedia(reducedMotionQuery).matches;
}
