import { afterEach, describe, expect, test } from "bun:test";
import { getMotionSnapshot, setMotionEnabled } from "./motion-preference";

const originalWindow = globalThis.window;

function installTestWindow({ reduced }: { reduced: boolean }) {
  const eventTarget = new EventTarget();
  const storedValues = new Map<string, string>();

  globalThis.window = {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    localStorage: {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => storedValues.set(key, value),
    },
    matchMedia: () => ({ matches: reduced }),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  } as unknown as Window & typeof globalThis;
}

afterEach(() => {
  globalThis.window = originalWindow;
});

describe("motion preference", () => {
  test("persists the visitor's setting", () => {
    installTestWindow({ reduced: false });

    expect(getMotionSnapshot()).toBe("on");

    setMotionEnabled(false);

    expect(getMotionSnapshot()).toBe("off");
  });

  test("lets the OS reduced-motion setting outrank it", () => {
    installTestWindow({ reduced: true });

    setMotionEnabled(true);

    expect(getMotionSnapshot()).toBe("reduced");
  });
});
