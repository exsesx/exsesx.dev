import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const bindMock = mock(() => {});
const playMock = mock((_sound: string) => {});
const setEnabledMock = mock((_enabled: boolean) => {});
const setVolumeMock = mock((_volume: number) => {});

mock.module("cuelume", () => ({
  bind: bindMock,
  play: playMock,
  setEnabled: setEnabledMock,
  setVolume: setVolumeMock,
  sounds: ["error", "loading", "press", "ready", "success", "tick", "toggle"],
}));

const {
  getPreparationCompletionSound,
  getServerSoundEffectsSnapshot,
  getSoundEffectsSnapshot,
  initializeInteractionSounds,
  INTERACTION_SOUND_VOLUME,
  persistSoundEffectsEnabled,
  playPopupToggleSound,
  setSoundEffectsEnabled,
  subscribeToSoundEffects,
} = await import("./interaction-sounds");

const appDocumentUrl = new URL("../components/AppDocument.tsx", import.meta.url);
const headerUrl = new URL("../components/Header.tsx", import.meta.url);
const interactionSoundsComponentUrl = new URL("../components/InteractionSounds.tsx", import.meta.url);
const originalWindow = globalThis.window;
const storageKey = "exsesx:sound-effects";

function installTestWindow({ blockStorage = false }: { blockStorage?: boolean } = {}) {
  const eventTarget = new EventTarget();
  const storedValues = new Map<string, string>();
  const localStorage = {
    getItem(key: string) {
      if (blockStorage) {
        throw new DOMException("Blocked", "SecurityError");
      }

      return storedValues.get(key) ?? null;
    },
    removeItem(key: string) {
      storedValues.delete(key);
    },
    setItem(key: string, value: string) {
      if (blockStorage) {
        throw new DOMException("Blocked", "SecurityError");
      }

      storedValues.set(key, value);
    },
  };
  const testWindow = {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    localStorage,
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: testWindow,
  });

  return { storedValues, testWindow };
}

beforeEach(() => {
  const { storedValues } = installTestWindow();

  // Normalize the module's in-memory fallback between tests, then expose an
  // empty storage state for assertions about the default.
  persistSoundEffectsEnabled(true);
  storedValues.clear();

  bindMock.mockClear();
  playMock.mockClear();
  setEnabledMock.mockClear();
  setVolumeMock.mockClear();
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("interaction sound preferences", () => {
  test("defaults to enabled and restores persisted false and true values", () => {
    expect(getServerSoundEffectsSnapshot()).toBe(true);
    expect(getSoundEffectsSnapshot()).toBe(true);

    window.localStorage.setItem(storageKey, "false");
    expect(getSoundEffectsSnapshot()).toBe(false);

    window.localStorage.setItem(storageKey, "true");
    expect(getSoundEffectsSnapshot()).toBe(true);

    window.localStorage.removeItem(storageKey);
    expect(getSoundEffectsSnapshot()).toBe(true);
  });

  test("keeps the preference usable when local storage is blocked", () => {
    installTestWindow({ blockStorage: true });

    expect(getSoundEffectsSnapshot()).toBe(true);
    expect(() => persistSoundEffectsEnabled(false)).not.toThrow();
    expect(getSoundEffectsSnapshot()).toBe(false);
    expect(() => persistSoundEffectsEnabled(true)).not.toThrow();
    expect(getSoundEffectsSnapshot()).toBe(true);
  });

  test("notifies subscribers for local changes and cross-tab storage changes", () => {
    let notifications = 0;
    const unsubscribe = subscribeToSoundEffects(() => {
      notifications += 1;
    });

    persistSoundEffectsEnabled(false);
    expect(notifications).toBe(1);

    window.dispatchEvent(new Event("storage"));
    expect(notifications).toBe(2);

    unsubscribe();
    persistSoundEffectsEnabled(true);
    window.dispatchEvent(new Event("storage"));
    expect(notifications).toBe(2);
  });

  test("initializes Cuelume at the noticeable 0.6 volume", () => {
    window.localStorage.setItem(storageKey, "false");

    initializeInteractionSounds();

    expect(INTERACTION_SOUND_VOLUME).toBe(0.6);
    expect(setVolumeMock).toHaveBeenCalledWith(0.6);
    expect(setEnabledMock).toHaveBeenCalledWith(false);
    expect(bindMock).toHaveBeenCalledTimes(1);
  });

  test("plays toggle before muting and after unmuting", () => {
    setSoundEffectsEnabled(false);

    expect(playMock).toHaveBeenCalledWith("toggle");
    expect(setEnabledMock).toHaveBeenCalledWith(false);
    expect(playMock.mock.invocationCallOrder[0]).toBeLessThan(setEnabledMock.mock.invocationCallOrder[0]);
    expect(getSoundEffectsSnapshot()).toBe(false);

    playMock.mockClear();
    setEnabledMock.mockClear();
    setSoundEffectsEnabled(true);

    expect(setEnabledMock).toHaveBeenCalledWith(true);
    expect(playMock).toHaveBeenCalledWith("toggle");
    expect(setEnabledMock.mock.invocationCallOrder[0]).toBeLessThan(playMock.mock.invocationCallOrder[0]);
    expect(getSoundEffectsSnapshot()).toBe(true);
  });
});

describe("popup sound decisions", () => {
  test("suppresses induced closes while sounding direct open and close actions", () => {
    for (const reason of ["focus-out", "imperative-action", "item-press", "none"]) {
      playPopupToggleSound(false, reason);
    }

    playPopupToggleSound(false, "outside-press", {
      closest: () => ({ soundOwner: true }),
    } as unknown as EventTarget);

    expect(playMock).not.toHaveBeenCalled();

    playPopupToggleSound(true, "trigger-press");
    playPopupToggleSound(false, "trigger-press");
    playPopupToggleSound(false, "escape-key");
    playPopupToggleSound(false, "outside-press");

    expect(playMock.mock.calls).toEqual([["toggle"], ["toggle"], ["toggle"], ["toggle"]]);
  });
});

describe("delayed preparation sounds", () => {
  test("uses the menu cue before loading and ready after it", () => {
    expect(getPreparationCompletionSound(false, "toggle")).toBe("toggle");
    expect(getPreparationCompletionSound(false, null)).toBeNull();
    expect(getPreparationCompletionSound(true, "toggle")).toBe("ready");
  });
});

describe("app-level sound wiring", () => {
  test("mounts one interaction sound controller with keyboard activation support", async () => {
    const [appDocument, header, interactionSoundsComponent] = await Promise.all([
      Bun.file(appDocumentUrl).text(),
      Bun.file(headerUrl).text(),
      Bun.file(interactionSoundsComponentUrl).text(),
    ]);

    expect(appDocument).toContain('import InteractionSounds from "./InteractionSounds";');
    expect(appDocument.match(/<InteractionSounds \/>/g)).toHaveLength(1);
    expect(header).toMatch(/href="\/"[\s\S]*?data-cuelume-press="scan"[\s\S]*?site-nav-brand-link/);
    expect(interactionSoundsComponent).toContain("useSyncExternalStore");
    expect(interactionSoundsComponent).toContain("initializeInteractionSounds");
    expect(interactionSoundsComponent).toMatch(/event\.detail !== 0/);
    expect(interactionSoundsComponent).toMatch(/document\.addEventListener\("click", handleKeyboardActivation, true\)/);
  });
});
