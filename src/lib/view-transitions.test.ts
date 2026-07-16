import { afterEach, describe, expect, test } from "bun:test";
import * as viewTransitions from "./view-transitions";
import { canUseDesktopViewTransitions, startDocumentViewTransition } from "./view-transitions";

const originalWindow = globalThis.window;

function setMatchMedia(matchesByQuery: Record<string, boolean>) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      matchMedia(query: string) {
        return {
          matches: matchesByQuery[query] ?? false,
          addEventListener() {},
          removeEventListener() {},
        };
      },
    },
  });
}

const desktopQuery = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

describe("canUseDesktopViewTransitions", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  test("is synchronous (the theme switcher reads it inside a click handler)", () => {
    setMatchMedia({ [desktopQuery]: true, [reducedMotionQuery]: false });
    expect(canUseDesktopViewTransitions()).toBe(true);
  });

  test("returns false on non-desktop pointers so the theme sweep is skipped", () => {
    setMatchMedia({ [desktopQuery]: false, [reducedMotionQuery]: false });
    expect(canUseDesktopViewTransitions()).toBe(false);
  });

  test("returns false when reduced motion is requested", () => {
    setMatchMedia({ [desktopQuery]: true, [reducedMotionQuery]: true });
    expect(canUseDesktopViewTransitions()).toBe(false);
  });

  test("is SSR-safe when window is undefined", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: undefined });
    expect(canUseDesktopViewTransitions()).toBe(false);
  });

  test("does not export a render-gating hook (boundaries are gated in CSS, not JS)", () => {
    expect("useDesktopViewTransitions" in viewTransitions).toBe(false);
  });
});

describe("startDocumentViewTransition", () => {
  test("invokes the native API once with its document-like owner as the receiver", () => {
    let receivedThis: unknown;
    let updateCount = 0;
    const transition = { finished: Promise.resolve() };
    const target = {
      startViewTransition(this: unknown, updateCallback: () => void) {
        receivedThis = this;
        updateCallback();
        return transition;
      },
    };

    const result = startDocumentViewTransition(target, () => {
      updateCount += 1;
    });

    expect(receivedThis).toBe(target);
    expect(updateCount).toBe(1);
    expect(result).toBe(transition);
  });

  test("returns undefined without invoking the update when the API is absent", () => {
    let updateCount = 0;

    const result = startDocumentViewTransition({}, () => {
      updateCount += 1;
    });

    expect(result).toBeUndefined();
    expect(updateCount).toBe(0);
  });
});
