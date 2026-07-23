import { describe, expect, test } from "bun:test";
import { BLOG_HEADER_HIDE_AFTER } from "./blog-focus";
import { BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE, createBlogFocusBootstrapScript } from "./blog-focus-bootstrap";

type BootstrapHarness = ReturnType<typeof createBootstrapHarness>;

function createBootstrapHarness(pathname: string) {
  const documentListeners = new Map<string, Array<() => void>>();
  const windowListeners = new Map<string, Array<() => void>>();
  const animationFrames: Array<() => void> = [];
  const dispatchedEvents: string[] = [];
  const documentElement = { dataset: {} as Record<string, string | undefined> };
  const windowObject = {
    location: { pathname },
    scrollY: 0,
    addEventListener(type: string, listener: () => void) {
      windowListeners.set(type, [...(windowListeners.get(type) ?? []), listener]);
    },
    dispatchEvent(event: Event) {
      dispatchedEvents.push(event.type);
      return true;
    },
    requestAnimationFrame(callback: () => void) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
  };
  const documentObject = {
    documentElement,
    readyState: "loading",
    addEventListener(type: string, listener: () => void) {
      documentListeners.set(type, [...(documentListeners.get(type) ?? []), listener]);
    },
  };

  Function("document", "window", "Event", createBlogFocusBootstrapScript())(documentObject, windowObject, Event);

  return {
    animationFrames,
    dispatchedEvents,
    documentElement,
    documentListeners,
    windowListeners,
    windowObject,
  };
}

function resolveInitialFrame(harness: BootstrapHarness) {
  for (const listener of harness.documentListeners.get("DOMContentLoaded") ?? []) {
    listener();
  }

  harness.animationFrames.shift()?.();
}

describe("Blog focus pre-paint bootstrap", () => {
  test("protects article chrome while restored scroll is unresolved, then starts hidden on a deep load", () => {
    const harness = createBootstrapHarness("/blog/en/codex-agents-v2");

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("pending");

    harness.windowObject.scrollY = 1600;
    resolveInitialFrame(harness);

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("hidden");
    expect(harness.dispatchedEvents).toEqual(["exsesx:blog-focus-bootstrap"]);
  });

  test("reveals a top-of-article load before its first resolved frame", () => {
    const harness = createBootstrapHarness("/blog/uk/codex-agents-v2");

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("pending");
    resolveInitialFrame(harness);

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("visible");
  });

  test("uses the same 120px hide boundary as the hydrated header", () => {
    expect(BLOG_HEADER_HIDE_AFTER).toBe(120);

    const beforeBoundary = createBootstrapHarness("/blog/en/codex-agents-v2");
    beforeBoundary.windowObject.scrollY = BLOG_HEADER_HIDE_AFTER - 1;
    resolveInitialFrame(beforeBoundary);

    expect(beforeBoundary.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("visible");

    const atBoundary = createBootstrapHarness("/blog/en/codex-agents-v2");
    atBoundary.windowObject.scrollY = BLOG_HEADER_HIDE_AFTER;
    resolveInitialFrame(atBoundary);

    expect(atBoundary.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("hidden");
  });

  test("recalculates the phase after a back-forward cache restore", () => {
    const harness = createBootstrapHarness("/blog/en/codex-agents-v2");
    resolveInitialFrame(harness);
    harness.windowObject.scrollY = BLOG_HEADER_HIDE_AFTER;

    for (const listener of harness.windowListeners.get("pageshow") ?? []) {
      (listener as unknown as (event: { persisted: boolean }) => void)({ persisted: true });
    }

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("pending");
    harness.animationFrames.shift()?.();
    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBe("hidden");
  });

  test("does nothing outside Blog article routes", () => {
    const harness = createBootstrapHarness("/blog/en");

    expect(harness.documentElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE]).toBeUndefined();
    expect(harness.documentListeners.size).toBe(0);
    expect(harness.windowListeners.size).toBe(0);
  });
});
