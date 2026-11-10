import { afterEach, describe, expect, test } from "bun:test";
import { getThemeSnapshot, persistThemeMode, THEME_CHROME_COLORS } from "./theme";

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

describe("theme chrome colors", () => {
  // The no-flash script sets --background inline from these, so a token edited only in globals.css would never show.
  test("match the stylesheet's page background in both themes", async () => {
    const css = await Bun.file(new URL("../styles/globals.css", import.meta.url)).text();
    const lightBackground = /^:root \{.*?^  --background: (#[0-9a-f]{6});/ms.exec(css)?.[1];
    const darkBackground = /\.dark \{[^}]*?--background: (#[0-9a-f]{6});/s.exec(css)?.[1];

    expect({ light: lightBackground, dark: darkBackground }).toEqual({ ...THEME_CHROME_COLORS });
  });
});
