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

/*
 * The first AudioContext a browser process creates opens its audio output
 * synchronously, about 200-400ms of main thread in Chrome; every later one
 * takes about 1ms. Cuelume creates its context inside the first press, so that
 * cost froze the first tap. A throwaway context made while the page is idle
 * pays it off the gesture. With no sink it never sounds or claims audio, and it
 * is closed at once: the warmth belongs to the process, not the context.
 */
// Right after load, while the hero's entrance still runs on the compositor:
// the headline's mark starts drawing 640ms in and the field's first sweep
// follows it, both on the main thread, so a later warm-up would hitch them.
const AUDIO_WARMUP_IDLE_TIMEOUT_MS = 500;

let audioOutputWarmed = false;

type AudioContextConstructor = new (options?: AudioContextOptions & { sinkId?: { type: "none" } }) => AudioContext;

function warmAudioOutput() {
  if (audioOutputWarmed) {
    return;
  }

  audioOutputWarmed = true;

  const AudioContextClass = (window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext) as
    | AudioContextConstructor
    | undefined;

  if (!AudioContextClass) {
    return;
  }

  try {
    void new AudioContextClass({ sinkId: { type: "none" } }).close().catch(() => {});
  } catch {
    // No audio here; Cuelume stays silent on its own.
  }
}

export function scheduleAudioOutputWarmup(): () => void {
  if (audioOutputWarmed) {
    return () => {};
  }

  let idleHandle: number | null = null;
  let timeoutHandle: number | null = null;

  function schedule() {
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(warmAudioOutput, { timeout: AUDIO_WARMUP_IDLE_TIMEOUT_MS });

      return;
    }

    timeoutHandle = window.setTimeout(warmAudioOutput, 0);
  }

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);

    if (idleHandle !== null) {
      window.cancelIdleCallback(idleHandle);
    }

    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle);
    }
  };
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

/*
 * A popup's cue starts right after the frame that shows it. The first cue a
 * page plays builds Cuelume's audio graph (about 7ms of main thread, 30ms at
 * 4x CPU), and inside the press that cost held back the popup's first frame.
 * One frame later is still well inside the window where sound and sight read
 * as one event.
 */
function playAfterNextPaint(sound: SoundName) {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    playInteractionSound(sound);

    return;
  }

  window.requestAnimationFrame(() => window.setTimeout(() => playInteractionSound(sound), 0));
}

export function playPopupToggleSound(open: boolean, reason: string, eventTarget?: EventTarget | null) {
  if (!open && SILENT_POPUP_CLOSE_REASONS.has(reason)) {
    return;
  }

  if (!open && reason === "outside-press" && isSoundOwningControlTarget(eventTarget)) {
    return;
  }

  playAfterNextPaint("toggle");
}
