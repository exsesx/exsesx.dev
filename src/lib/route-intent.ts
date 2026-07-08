import type { Route } from "next";
import { MOTION_ATTRIBUTES, MOTION_DATASET_KEYS, ROUTE_TRANSITION_TYPES } from "./motion-contract";
import { isProjectsIndexRoutePath } from "./routes";

const PREVIOUS_ROUTE_STORAGE_KEY = "exsesx.previousRoute";
const PENDING_SCROLL_RESTORE_STORAGE_KEY = "exsesx.pendingScrollRestore";
const FALLBACK_BACK_HREF = "/projects" as Route;

export type RouteHotkeyAction = "home" | "projects";

type StoredRoute = {
  path: string;
  scrollY: number;
};

type RouteNavigationIntent = {
  href: Route;
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
  const fallbackTransitionTypes = getBackTransitionTypes();
  const previousRoute = readPreviousRoute({ allowCurrent: false });

  setRouteNavigationSuppressed(true);

  if (!previousRoute) {
    return {
      href: FALLBACK_BACK_HREF,
      transitionTypes: fallbackTransitionTypes,
    };
  }

  queueScrollRestore(previousRoute);

  return {
    href: previousRoute.path as Route,
    scroll: false,
    transitionTypes: isProjectsIndexRoutePath(previousRoute.path)
      ? fallbackTransitionTypes
      : [ROUTE_TRANSITION_TYPES.navBack],
  };
}

export function prepareHotkeyRouteNavigation(action: RouteHotkeyAction): RouteNavigationIntent {
  setRouteNavigationSuppressed(true);

  return {
    href: action === "home" ? "/" : FALLBACK_BACK_HREF,
    transitionTypes: [],
  };
}

export function queueBrowserBackScrollRestore() {
  const previousRoute = readPreviousRoute({ allowCurrent: true });

  if (previousRoute?.path === getCurrentRoutePath()) {
    queueScrollRestore(previousRoute);
  }
}

export function consumeQueuedScrollRestore(path: string) {
  const storedValue = window.sessionStorage.getItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const pendingRestore = JSON.parse(storedValue) as StoredRoute;

    if (pendingRestore.path !== path || !Number.isFinite(pendingRestore.scrollY)) {
      return null;
    }

    window.sessionStorage.removeItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);

    return pendingRestore.scrollY;
  } catch {
    window.sessionStorage.removeItem(PENDING_SCROLL_RESTORE_STORAGE_KEY);
    return null;
  }
}

function recordCurrentRoute() {
  const previousRoute: StoredRoute = {
    path: getCurrentRoutePath(),
    scrollY: window.scrollY,
  };

  window.sessionStorage.setItem(PREVIOUS_ROUTE_STORAGE_KEY, JSON.stringify(previousRoute));
}

function readPreviousRoute({ allowCurrent }: { allowCurrent: boolean }) {
  const storedValue = window.sessionStorage.getItem(PREVIOUS_ROUTE_STORAGE_KEY);

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
  window.sessionStorage.setItem(PENDING_SCROLL_RESTORE_STORAGE_KEY, JSON.stringify(route));
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
