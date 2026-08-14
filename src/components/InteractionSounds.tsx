"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getServerSoundEffectsSnapshot,
  getSoundEffectsSnapshot,
  initializeInteractionSounds,
  playInteractionSound,
  resolveInteractionSound,
  subscribeToSoundEffects,
  syncInteractionSoundsEnabled,
} from "@/lib/interaction-sounds";

function isUnavailableControl(element: Element) {
  return element.matches(":disabled, [aria-disabled='true']") || element.closest("[inert]") !== null;
}

export default function InteractionSounds() {
  const enabled = useSyncExternalStore(subscribeToSoundEffects, getSoundEffectsSnapshot, getServerSoundEffectsSnapshot);

  useEffect(() => {
    initializeInteractionSounds();
  }, []);

  useEffect(() => {
    syncInteractionSoundsEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    function handleKeyboardActivation(event: MouseEvent) {
      if (event.detail !== 0 || !(event.target instanceof Element)) {
        return;
      }

      const control = event.target.closest("[data-cuelume-press]");

      if (!control || isUnavailableControl(control)) {
        return;
      }

      playInteractionSound(resolveInteractionSound(control.getAttribute("data-cuelume-press"), "press"));
    }

    document.addEventListener("click", handleKeyboardActivation, true);

    return () => document.removeEventListener("click", handleKeyboardActivation, true);
  }, []);

  return null;
}
