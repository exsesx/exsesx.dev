import { bind, play, type SoundName, setEnabled, setVolume, sounds } from "cuelume";

const SOUND_EFFECTS_CHANGE_EVENT = "exsesx:sound-effects-change";
const SOUND_EFFECTS_STORAGE_KEY = "exsesx:sound-effects";

export const INTERACTION_SOUND_VOLUME = 0.6;

let volatileSoundEffectsEnabled: boolean | null = null;

function getStoredSoundEffectsEnabled() {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.localStorage.getItem(SOUND_EFFECTS_STORAGE_KEY) !== "false";
  } catch {
    return volatileSoundEffectsEnabled ?? true;
  }
}

export function getSoundEffectsSnapshot() {
  return getStoredSoundEffectsEnabled();
}

export function getServerSoundEffectsSnapshot() {
  return true;
}

export function subscribeToSoundEffects(callback: () => void) {
  window.addEventListener(SOUND_EFFECTS_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SOUND_EFFECTS_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function persistSoundEffectsEnabled(enabled: boolean) {
  volatileSoundEffectsEnabled = enabled;

  try {
    window.localStorage.setItem(SOUND_EFFECTS_STORAGE_KEY, String(enabled));
  } catch {
    // Restricted storage should not make the sound preference unusable.
  }

  window.dispatchEvent(new Event(SOUND_EFFECTS_CHANGE_EVENT));
}

export function initializeInteractionSounds() {
  setVolume(INTERACTION_SOUND_VOLUME);
  setEnabled(getStoredSoundEffectsEnabled());
  bind();
}

export function syncInteractionSoundsEnabled(enabled: boolean) {
  setEnabled(enabled);
}

export function playInteractionSound(sound: SoundName) {
  play(sound);
}

export function setSoundEffectsEnabled(enabled: boolean) {
  if (enabled) {
    setEnabled(true);
    persistSoundEffectsEnabled(true);
    play("toggle");
    return;
  }

  play("toggle");
  setEnabled(false);
  persistSoundEffectsEnabled(false);
}

export function resolveInteractionSound(value: string | null, fallback: SoundName): SoundName {
  return value && sounds.includes(value as SoundName) ? (value as SoundName) : fallback;
}

export function getPreparationCompletionSound(
  loadingPlayed: boolean,
  fastCompletionSound: "toggle" | null,
): "ready" | "toggle" | null {
  return loadingPlayed ? "ready" : fastCompletionSound;
}

const SILENT_POPUP_CLOSE_REASONS = new Set(["focus-out", "imperative-action", "item-press", "none"]);
const SOUND_OWNING_CONTROL_SELECTOR =
  "button, [role='button'], [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'], [data-cuelume-press], [data-cuelume-toggle]";

function isSoundOwningControlTarget(target: EventTarget | null | undefined) {
  const closest = (target as Partial<Element> | null)?.closest;

  return typeof closest === "function" && closest.call(target, SOUND_OWNING_CONTROL_SELECTOR) !== null;
}

export function playPopupToggleSound(open: boolean, reason: string, eventTarget?: EventTarget | null) {
  if (!open && SILENT_POPUP_CLOSE_REASONS.has(reason)) {
    return;
  }

  if (!open && reason === "outside-press" && isSoundOwningControlTarget(eventTarget)) {
    return;
  }

  playInteractionSound("toggle");
}
