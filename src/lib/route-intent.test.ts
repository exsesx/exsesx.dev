import { afterEach, describe, expect, test } from "bun:test";
import { MOTION_ATTRIBUTES, MOTION_DATASET_KEYS, ROUTE_TRANSITION_TYPES } from "./motion-contract";
import {
  captureAnchorRouteIntent,
  consumeQueuedScrollRestore,
  getBackNavigationIntent,
  prepareHotkeyRouteNavigation,
  queueBrowserBackScrollRestore,
} from "./route-intent";

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

class MemoryStorage {
  #items = new Map<string, string>();

  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#items.set(key, value);
  }

  removeItem(key: string) {
    this.#items.delete(key);
  }
}

function installRouteRuntime({
  pathname = "/project/quicklizard",
  search = "",
  hash = "",
  scrollY = 0,
  backTransitionType = "project-transition-project-quicklizard",
}: {
  pathname?: string;
  search?: string;
  hash?: string;
  scrollY?: number;
  backTransitionType?: string | null;
} = {}) {
  const storage = new MemoryStorage();
  const dataset: Record<string, string | undefined> = {};
  const location = { pathname, search, hash };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location,
      scrollY,
      sessionStorage: storage,
    },
  });

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      documentElement: { dataset },
      querySelector(selector: string) {
        if (selector !== `main[${MOTION_ATTRIBUTES.backTransitionType}]` || backTransitionType === null) {
          return null;
        }

        return {
          getAttribute(name: string) {
            return name === MOTION_ATTRIBUTES.backTransitionType ? backTransitionType : null;
          },
        };
      },
    },
  });

  return {
    dataset,
    location,
    storage,
  };
}

function routeAnchor(suppressesEntryMotion: boolean) {
  return {
    hasAttribute(name: string) {
      return name === MOTION_ATTRIBUTES.suppressEntryMotion && suppressesEntryMotion;
    },
  };
}

describe("route intent", () => {
  afterEach(() => {
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
    Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
  });

  test("captures the current route for later back navigation and owns the route suppression flag", () => {
    const runtime = installRouteRuntime({
      pathname: "/projects",
      search: "?filter=ai",
      hash: "#selected",
      scrollY: 240,
    });

    captureAnchorRouteIntent(routeAnchor(true));

    runtime.location.pathname = "/project/quicklizard";
    runtime.location.search = "";
    runtime.location.hash = "";

    const intent = getBackNavigationIntent();

    expect(runtime.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated]).toBe("true");
    expect(intent).toEqual({
      href: "/projects?filter=ai#selected",
      scroll: false,
      transitionTypes: [ROUTE_TRANSITION_TYPES.navBack, "project-transition-project-quicklizard"],
    });
    expect(consumeQueuedScrollRestore("/projects?filter=ai#selected")).toBe(240);
  });

  test("clears route suppression when a captured anchor should allow entry motion", () => {
    const runtime = installRouteRuntime();
    runtime.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated] = "true";

    captureAnchorRouteIntent(routeAnchor(false));

    expect(runtime.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated]).toBeUndefined();
  });

  test("falls back to projects with the current page morph type when no previous route exists", () => {
    const runtime = installRouteRuntime({ backTransitionType: "project-transition-project-huddle" });

    const intent = getBackNavigationIntent();

    expect(runtime.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated]).toBe("true");
    expect(intent).toEqual({
      href: "/projects",
      transitionTypes: [ROUTE_TRANSITION_TYPES.navBack, "project-transition-project-huddle"],
    });
  });

  test("does not reuse the current page morph when returning to a non-projects-index route", () => {
    const runtime = installRouteRuntime({ pathname: "/", scrollY: 32 });
    captureAnchorRouteIntent(routeAnchor(true));
    runtime.location.pathname = "/project/quicklizard";

    expect(getBackNavigationIntent()).toEqual({
      href: "/",
      scroll: false,
      transitionTypes: [ROUTE_TRANSITION_TYPES.navBack],
    });
  });

  test("queues browser-back scroll restoration when the stored route is now current", () => {
    installRouteRuntime({ pathname: "/projects", scrollY: 180 });
    captureAnchorRouteIntent(routeAnchor(true));

    queueBrowserBackScrollRestore();

    expect(consumeQueuedScrollRestore("/projects")).toBe(180);
  });

  test("prepares hotkey route navigation as instant lateral navigation", () => {
    const runtime = installRouteRuntime();

    expect(prepareHotkeyRouteNavigation("home")).toEqual({
      href: "/",
      transitionTypes: [],
    });
    expect(prepareHotkeyRouteNavigation("projects")).toEqual({
      href: "/projects",
      transitionTypes: [],
    });
    expect(runtime.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated]).toBe("true");
  });
});
