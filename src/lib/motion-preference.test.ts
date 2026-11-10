import { afterEach, describe, expect, test } from "bun:test";
import { getMotionSnapshot, isMotionReduced, setMotionEnabled } from "./motion-preference";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;

function setGlobal(name: "document" | "window", value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, value, writable: true });
}

function installTestWindow({ reduced }: { reduced: boolean }) {
  const eventTarget = new EventTarget();
  const storedValues = new Map<string, string>();
  const dataset: Record<string, string> = {};

  // Defined, not assigned: other test files redefine window as non-writable, and file order varies.
  setGlobal("window", {
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    localStorage: {
      getItem: (key: string) => storedValues.get(key) ?? null,
      setItem: (key: string, value: string) => storedValues.set(key, value),
    },
    matchMedia: () => ({ matches: reduced }),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  });
  setGlobal("document", { documentElement: { dataset } });

  return { dataset };
}

afterEach(() => {
  setGlobal("window", originalWindow);
  setGlobal("document", originalDocument);
});

describe("motion preference", () => {
  test("persists the visitor's setting", () => {
    installTestWindow({ reduced: false });

    expect(getMotionSnapshot()).toBe("on");

    setMotionEnabled(false);

    expect(getMotionSnapshot()).toBe("off");
  });

  test("marks the root at once so CSS treats Motion off as reduced motion", () => {
    const { dataset } = installTestWindow({ reduced: false });

    setMotionEnabled(false);

    expect(dataset.motion).toBe("off");
    expect(isMotionReduced()).toBe(true);

    setMotionEnabled(true);

    expect(dataset.motion).toBeUndefined();
    expect(isMotionReduced()).toBe(false);
  });

  test("lets the OS reduced-motion setting outrank it", () => {
    installTestWindow({ reduced: true });

    setMotionEnabled(true);

    expect(getMotionSnapshot()).toBe("reduced");
  });
});
