import { resolveBlogBackHref } from "./blog";
import { MOTION_ATTRIBUTES, MOTION_DATASET_KEYS, ROUTE_TRANSITION_TYPES } from "./motion-contract";
import { isProjectsIndexRoutePath } from "./routes";

const PREVIOUS_ROUTE_STORAGE_KEY = "exsesx.previousRoute";
const PENDING_SCROLL_RESTORE_STORAGE_KEY = "exsesx.pendingScrollRestore";
const FALLBACK_BACK_HREF = "/projects";

export type RouteHotkeyAction = "home" | "projects" | "blog";

type StoredRoute = {
  path: string;
  scrollY: number;
};

type RouteNavigationIntent = {
  href: string;
  scroll?: false;
  transitionTypes: string[];
};

type RouteIntentAnchor = Pick<HTMLAnchorElement, "hasAttribute">;

export function getCurrentRoutePath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function captureAnchorRouteIntent(anchor: RouteIntentAnchor) {
  recordCurrentRoute();
  setRouteNavigationSuppressed(anchor.hasAttribute(MOTION_ATTRIBUTES.suppressEntryMotion));
}

export function getBackNavigationIntent(): RouteNavigationIntent {
  const blogFallbackHref = resolveBlogBackHref(window.location.pathname);
  const fallbackHref = blogFallbackHref ?? FALLBACK_BACK_HREF;
  const fallbackTransitionTypes = blogFallbackHref ? [ROUTE_TRANSITION_TYPES.navBack] : getBackTransitionTypes();
  const storedPreviousRoute = readPreviousRoute({ allowCurrent: false });
  const previousRoute =
    blogFallbackHref && storedPreviousRoute && getPathname(storedPreviousRoute.path) !== blogFallbackHref
      ? null
      : storedPreviousRoute;

  setRouteNavigationSuppressed(true);

  if (!previousRoute) {
    return {
      href: fallbackHref,
      transitionTypes: fallbackTransitionTypes,
    };
  }

  queueScrollRestore(previousRoute);

  return {
    href: previousRoute.path,
    scroll: false,
    transitionTypes: blogFallbackHref
      ? [ROUTE_TRANSITION_TYPES.navBack]
      : isProjectsIndexRoutePath(previousRoute.path)
        ? fallbackTransitionTypes
        : [ROUTE_TRANSITION_TYPES.navBack],
  };
}

export function prepareHotkeyRouteNavigation(action: RouteHotkeyAction): RouteNavigationIntent {
  setRouteNavigationSuppressed(true);

  return {
    href: action === "home" ? "/" : action === "projects" ? FALLBACK_BACK_HREF : "/blog/en",
    transitionTypes: [],
  };
}

function getPathname(value: string) {
  try {
    return new URL(value, "https://exsesx.dev").pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}

export function queueBrowserBackScrollRestore() {
  const previousRoute = readPreviousRoute({ allowCurrent: true });

  if (previousRoute?.path === getCurrentRoutePath()) {
    queueScrollRestore(previousRoute);
  }
}

export function consumeQueuedScrollRestore(path: string) {
  const storedValue = getSessionStorageItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const pendingRestore = JSON.parse(storedValue) as StoredRoute;

    if (pendingRestore.path !== path || !Number.isFinite(pendingRestore.scrollY)) {
      return null;
    }

    removeSessionStorageItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);

    return pendingRestore.scrollY;
  } catch {
    removeSessionStorageItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);
    return null;
  }
}

function recordCurrentRoute() {
  const previousRoute: StoredRoute = {
    path: getCurrentRoutePath(),
    scrollY: window.scrollY,
  };

  setSessionStorageItem(PREVIOUS_ROUTE_STORAGE_KEY, JSON.stringify(previousRoute));
}

function readPreviousRoute({ allowCurrent }: { allowCurrent: boolean }) {
  const storedValue = getSessionStorageItem(PREVIOUS_ROUTE_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return normalizePreviousRoute(JSON.parse(storedValue) as StoredRoute, allowCurrent);
  } catch {
    return normalizePreviousRoute({ path: storedValue, scrollY: 0 }, allowCurrent);
  }
}

function normalizePreviousRoute(route: StoredRoute, allowCurrent: boolean) {
  if (
    !route.path?.startsWith("/") ||
    !Number.isFinite(route.scrollY) ||
    (!allowCurrent && route.path === getCurrentRoutePath())
  ) {
    return null;
  }

  return route;
}

function queueScrollRestore(route: StoredRoute) {
  setSessionStorageItem(PENDING_SCROLL_RESTORE_STORAGE_KEY, JSON.stringify(route));
}

function getSessionStorageItem(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionStorageItem(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Navigation still works when storage is blocked; only history polish degrades.
  }
}

function removeSessionStorageItem(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Treat a blocked store as already empty.
  }
}

function getBackTransitionTypes(): string[] {
  const projectTransitionType = document
    .querySelector(`main[${MOTION_ATTRIBUTES.backTransitionType}]`)
    ?.getAttribute(MOTION_ATTRIBUTES.backTransitionType);

  return projectTransitionType
    ? [ROUTE_TRANSITION_TYPES.navBack, projectTransitionType]
    : [ROUTE_TRANSITION_TYPES.navBack];
}

function setRouteNavigationSuppressed(isSuppressed: boolean) {
  if (isSuppressed) {
    document.documentElement.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated] = "true";
    return;
  }

  delete document.documentElement.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated];
}
