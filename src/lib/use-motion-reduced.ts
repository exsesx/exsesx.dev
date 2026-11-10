import { useSyncExternalStore } from "react";
import { getMotionSnapshot, subscribeToMotion } from "./motion-preference";

function getMotionReducedSnapshot() {
  return getMotionSnapshot() !== "on";
}

function getServerMotionReducedSnapshot() {
  return false;
}

/** React view of isMotionReduced(): the OS asks for reduced motion or the visitor turned Motion off. */
export function useMotionReduced() {
  return useSyncExternalStore(subscribeToMotion, getMotionReducedSnapshot, getServerMotionReducedSnapshot);
}
