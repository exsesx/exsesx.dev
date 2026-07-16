const desktopViewTransitionQuery = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export type NativeViewTransition = {
  finished: Promise<void>;
};

export type NativeViewTransitionDocument = {
  startViewTransition?: (updateCallback: () => void) => NativeViewTransition;
};

export function startDocumentViewTransition(target: NativeViewTransitionDocument, updateCallback: () => void) {
  const startViewTransition = target.startViewTransition;
  return startViewTransition?.call(target, updateCallback);
}

/**
 * Synchronous, SSR-safe check for whether desktop view transitions should run.
 *
 * This gates the *imperative* theme-sweep transition only (see ThemeSwitcher),
 * which is started inside a click handler where matchMedia can be read directly.
 *
 * Named project-media `<ViewTransition>` boundaries are NOT gated here. They
 * always render so shared pairs can form across navigation; their animations
 * are disabled on touch/mobile in CSS via the desktop media query.
 */
export function canUseDesktopViewTransitions() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(desktopViewTransitionQuery).matches && !window.matchMedia(reducedMotionQuery).matches;
}
