"use client";

import { useSyncExternalStore } from "react";

const desktopViewTransitionQuery = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function getDesktopViewTransitionSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(desktopViewTransitionQuery).matches && !window.matchMedia(reducedMotionQuery).matches;
}

export const canUseDesktopViewTransitions = getDesktopViewTransitionSnapshot;

function getServerDesktopViewTransitionSnapshot() {
  return false;
}

function subscribeToDesktopViewTransitions(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const desktopViewTransitionMedia = window.matchMedia(desktopViewTransitionQuery);
  const reducedMotionMedia = window.matchMedia(reducedMotionQuery);

  if ("addEventListener" in desktopViewTransitionMedia && "addEventListener" in reducedMotionMedia) {
    function updatePreference() {
      callback();
    }

    desktopViewTransitionMedia.addEventListener("change", updatePreference);
    reducedMotionMedia.addEventListener("change", updatePreference);

    return () => {
      desktopViewTransitionMedia.removeEventListener("change", updatePreference);
      reducedMotionMedia.removeEventListener("change", updatePreference);
    };
  }

  return () => {};
}

export function useDesktopViewTransitions() {
  return useSyncExternalStore(
    subscribeToDesktopViewTransitions,
    getDesktopViewTransitionSnapshot,
    getServerDesktopViewTransitionSnapshot,
  );
}
