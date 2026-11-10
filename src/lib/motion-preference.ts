import { MOTION_DATASET_KEYS, MOTION_OFF } from "./motion-contract";

/*
 * The visitor's Motion setting. Off counts as prefers-reduced-motion
 * everywhere: the no-flash script marks html[data-motion="off"] before the
 * first paint, CSS gates on it through the reduced-motion / full-motion
 * variants, and scripts ask isMotionReduced(). The OS setting outranks it: with
 * reduced motion on, motion is off and the toggle only reports that.
 */
export const MOTION_CHANGE_EVENT = "exsesx:motion-change";
export const MOTION_STORAGE_KEY = "exsesx:motion";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type MotionSetting = "on" | "off" | "reduced";

let volatileMotionEnabled: boolean | null = null;
let reducedMotionQuery: MediaQueryList | null = null;

function getStoredMotionEnabled() {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) !== "false";
  } catch {
    return volatileMotionEnabled ?? true;
  }
}

function getReducedMotionQuery() {
  reducedMotionQuery ??= window.matchMedia(REDUCED_MOTION_QUERY);

  return reducedMotionQuery;
}

export function getMotionSnapshot(): MotionSetting {
  if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return "reduced";
  }

  return getStoredMotionEnabled() ? "on" : "off";
}

export function getServerMotionSnapshot(): MotionSetting {
  return "on";
}

/**
 * Whether motion should be still right now: the OS asks for reduced motion or
 * the visitor turned Motion off. Cheap enough for an animation frame.
 */
export function isMotionReduced() {
  return getReducedMotionQuery().matches || document.documentElement.dataset[MOTION_DATASET_KEYS.motion] === MOTION_OFF;
}

export function subscribeToMotion(callback: () => void) {
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  window.addEventListener(MOTION_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  reducedMotion.addEventListener("change", callback);

  return () => {
    window.removeEventListener(MOTION_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
    reducedMotion.removeEventListener("change", callback);
  };
}

export function setMotionEnabled(enabled: boolean) {
  volatileMotionEnabled = enabled;

  try {
    window.localStorage.setItem(MOTION_STORAGE_KEY, String(enabled));
  } catch {
    // Restricted storage should not make the setting unusable.
  }

  // Applies at once: CSS reads the attribute, so nothing waits for a reload.
  const root = document.documentElement;

  if (enabled) {
    delete root.dataset[MOTION_DATASET_KEYS.motion];
  } else {
    root.dataset[MOTION_DATASET_KEYS.motion] = MOTION_OFF;
  }

  window.dispatchEvent(new Event(MOTION_CHANGE_EVENT));
}
