import { bind, type PlayOptions, play, type SoundName, setEnabled, setVolume, unlock } from "cuelume";

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
 * synchronously, 200-600ms of main thread in Chrome; every later one takes a
 * few milliseconds. Cuelume creates its context inside the first press, so that
 * cost froze the first tap. A throwaway context made ahead of the press pays it
 * off the gesture. With no sink it never sounds or claims audio, and it is
 * closed at once: the warmth belongs to the process, not the context.
 *
 * It waits for the first sign of intent rather than for idle after load: a
 * visitor who never touches the page never pays the long task, and a pointer
 * or key usually moves well before the first press lands. A pointer that moves
 * during the hero's entrance can hitch its main-thread drawing once, which
 * costs less than a long task on every visit.
 */
const AUDIO_WARMUP_INTENT_EVENTS = ["pointerdown", "pointermove", "touchstart", "keydown"] as const;
const AUDIO_WARMUP_LISTENER_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

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

  let frameHandle: number | null = null;
  let timeoutHandle: number | null = null;

  function removeIntentListeners() {
    for (const type of AUDIO_WARMUP_INTENT_EVENTS) {
      window.removeEventListener(type, handleIntent, AUDIO_WARMUP_LISTENER_OPTIONS);
    }
  }

  // After the frame that answers the intent, so a first key or touch paints its own feedback before the warm-up runs.
  function handleIntent() {
    removeIntentListeners();

    frameHandle = window.requestAnimationFrame(() => {
      frameHandle = null;
      timeoutHandle = window.setTimeout(warmAudioOutput, 0);
    });
  }

  for (const type of AUDIO_WARMUP_INTENT_EVENTS) {
    window.addEventListener(type, handleIntent, AUDIO_WARMUP_LISTENER_OPTIONS);
  }

  return () => {
    removeIntentListeners();

    if (frameHandle !== null) {
      window.cancelAnimationFrame(frameHandle);
    }

    if (timeoutHandle !== null) {
      window.clearTimeout(timeoutHandle);
    }
  };
}

/*
 * WebKit starts audio only from inside a user gesture, and a popup's cue plays
 * a frame later, outside it. Creating or resuming Cuelume's context while the
 * press is still on the stack keeps the first cue audible when opening a popup
 * is the visitor's first press. Only once the process is warm, though: a cold
 * first context would put the 200-600ms long task back inside the press. A
 * pointer moves or a finger lands before the press, so the warm-up has nearly
 * always run by then; when it has not, the cue creates its context late.
 */
export function unlockInteractionAudio() {
  if (!audioOutputWarmed || !getStoredSoundEffectsEnabled()) {
    return;
  }

  void unlock();
}

export function syncInteractionSoundsEnabled(enabled: boolean) {
  setEnabled(enabled);
}

export function playInteractionSound(sound: SoundName, options?: PlayOptions) {
  play(sound, options);
}

export function setSoundEffectsEnabled(enabled: boolean) {
  if (enabled) {
    setEnabled(true);
    persistSoundEffectsEnabled(true);
    // Starts audio inside the click that turns it on, as Cuelume recommends; it never rejects.
    void unlock();
    play("toggle");
    return;
  }

  play("toggle");
  setEnabled(false);
  persistSoundEffectsEnabled(false);
}

export function getPreparationCompletionSound(
  loadingPlayed: boolean,
  fastCompletionSound: "toggle" | null,
): "ready" | "toggle" | null {
  return loadingPlayed ? "ready" : fastCompletionSound;
}

const SILENT_POPUP_CLOSE_REASONS = new Set(["focus-out", "imperative-action", "item-press", "none"]);
const SOUND_OWNING_CONTROL_SELECTOR = [
  "button",
  "[role='button']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[data-cuelume-tap]",
  "[data-cuelume-select]",
  "[data-cuelume-toggle]",
  "[data-cuelume-open]",
  "[data-cuelume-close]",
  "[data-cuelume-navigate]",
].join(", ");

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
function playAfterNextPaint(sound: SoundName, options?: PlayOptions) {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    playInteractionSound(sound, options);

    return;
  }

  // Keyboard opens and shortcuts reach here inside their keydown or click; pointer opens are covered in InteractionSounds.
  unlockInteractionAudio();
  window.requestAnimationFrame(() => window.setTimeout(() => playInteractionSound(sound, options), 0));
}

/*
 * Cuelume's cues for a surface opening and closing: a menu or popover sits
 * close to its trigger and plays them subtly; a dialog or drawer takes over
 * more of the screen and plays them at full weight.
 */
export type PopupSurface = "menu" | "panel";

const POPUP_SURFACE_OPTIONS: Record<PopupSurface, PlayOptions | undefined> = {
  menu: { emphasis: "subtle" },
  panel: undefined,
};

export function playPopupToggleSound(
  open: boolean,
  reason: string,
  eventTarget?: EventTarget | null,
  surface: PopupSurface = "menu",
) {
  if (!open && SILENT_POPUP_CLOSE_REASONS.has(reason)) {
    return;
  }

  if (!open && reason === "outside-press" && isSoundOwningControlTarget(eventTarget)) {
    return;
  }

  playAfterNextPaint(open ? "open" : "close", POPUP_SURFACE_OPTIONS[surface]);
}
