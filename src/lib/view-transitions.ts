"use client";

import { useEffect, useState } from "react";

const desktopViewTransitionQuery = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function canUseDesktopViewTransitions() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(desktopViewTransitionQuery).matches && !window.matchMedia(reducedMotionQuery).matches;
}

export function useDesktopViewTransitions() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const desktopViewTransitionMedia = window.matchMedia(desktopViewTransitionQuery);
    const reducedMotionMedia = window.matchMedia(reducedMotionQuery);

    function updatePreference() {
      setIsEnabled(desktopViewTransitionMedia.matches && !reducedMotionMedia.matches);
    }

    updatePreference();
    desktopViewTransitionMedia.addEventListener("change", updatePreference);
    reducedMotionMedia.addEventListener("change", updatePreference);

    return () => {
      desktopViewTransitionMedia.removeEventListener("change", updatePreference);
      reducedMotionMedia.removeEventListener("change", updatePreference);
    };
  }, []);

  return isEnabled;
}
