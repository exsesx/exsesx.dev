import { afterEach, describe, expect, test } from "bun:test";
import { getThemeSnapshot, persistThemeMode } from "./theme";

const originalWindow = globalThis.window;

describe("theme storage fallback", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  });

  test("keeps theme selection usable when local storage is blocked", () => {
    let dispatchedEvent = "";

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem() {
            throw new DOMException("Blocked", "SecurityError");
          },
          setItem() {
            throw new DOMException("Blocked", "SecurityError");
          },
        },
        matchMedia() {
          return { matches: true };
        },
        dispatchEvent(event: Event) {
          dispatchedEvent = event.type;
          return true;
        },
      },
    });

    expect(getThemeSnapshot()).toBe("system:dark");
    expect(() => persistThemeMode("light")).not.toThrow();
    expect(getThemeSnapshot()).toBe("light:light");
    expect(dispatchedEvent).toBe("exsesx:theme-change");
  });
});
