/*
 * The visitor's Motion setting: whether ambient motion (the hero's field) may
 * run. The OS setting outranks it: with reduced motion on, motion is off and
 * the toggle only reports that.
 */
const MOTION_CHANGE_EVENT = "exsesx:motion-change";
const MOTION_STORAGE_KEY = "exsesx:motion";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type MotionSetting = "on" | "off" | "reduced";

let volatileMotionEnabled: boolean | null = null;

function getStoredMotionEnabled() {
  try {
    return window.localStorage.getItem(MOTION_STORAGE_KEY) !== "false";
  } catch {
    return volatileMotionEnabled ?? true;
  }
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

  window.dispatchEvent(new Event(MOTION_CHANGE_EVENT));
}
