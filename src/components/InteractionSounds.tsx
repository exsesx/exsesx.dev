"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getServerSoundEffectsSnapshot,
  getSoundEffectsSnapshot,
  initializeInteractionSounds,
  playInteractionSound,
  resolveInteractionSound,
  scheduleAudioOutputWarmup,
  subscribeToSoundEffects,
  syncInteractionSoundsEnabled,
  unlockInteractionAudio,
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
    if (!enabled) {
      return;
    }

    return scheduleAudioOutputWarmup();
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

      playInteractionSound(resolveInteractionSound(control.getAttribute("data-cuelume-press"), "tap"));
    }

    document.addEventListener("click", handleKeyboardActivation, true);

    return () => document.removeEventListener("click", handleKeyboardActivation, true);
  }, []);

  // Base UI opens a menu a frame after its mousedown, so the popup's own cue code runs outside the gesture.
  // Unlocking here, in the mousedown itself, is what WebKit counts. A tap dispatches the same mousedown.
  useEffect(() => {
    function handlePopupTriggerPress(event: MouseEvent) {
      if (event.button !== 0 || !(event.target instanceof Element) || !event.target.closest("[aria-haspopup]")) {
        return;
      }

      unlockInteractionAudio();
    }

    document.addEventListener("mousedown", handlePopupTriggerPress, true);

    return () => document.removeEventListener("mousedown", handlePopupTriggerPress, true);
  }, []);

  return null;
}
