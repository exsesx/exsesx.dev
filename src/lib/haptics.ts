type HapticKind = "tap" | "selection" | "success";

type HapticOptions = {
  enabled?: boolean;
};

const hapticPatterns = {
  tap: 8,
  selection: 10,
  success: [8, 24, 12],
} satisfies Record<HapticKind, VibratePattern>;

function triggerHaptic(kind: HapticKind = "tap", { enabled = true }: HapticOptions = {}) {
  if (
    !enabled ||
    typeof navigator === "undefined" ||
    navigator.maxTouchPoints < 1 ||
    typeof navigator.vibrate !== "function"
  ) {
    return false;
  }

  try {
    return navigator.vibrate(hapticPatterns[kind]);
  } catch {
    return false;
  }
}

export type { HapticKind };
export { triggerHaptic };
