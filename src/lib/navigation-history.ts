export const PREVIOUS_ROUTE_STORAGE_KEY = "exsesx.previousRoute";
const PENDING_SCROLL_RESTORE_STORAGE_KEY = "exsesx.pendingScrollRestore";

type StoredRoute = {
  path: string;
  scrollY: number;
};

export function getCurrentRoutePath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function recordPreviousRoute() {
  const previousRoute: StoredRoute = {
    path: getCurrentRoutePath(),
    scrollY: window.scrollY,
  };

  window.sessionStorage.setItem(PREVIOUS_ROUTE_STORAGE_KEY, JSON.stringify(previousRoute));
}

export function getPreviousRoute() {
  const storedValue = window.sessionStorage.getItem(PREVIOUS_ROUTE_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const previousRoute = JSON.parse(storedValue) as StoredRoute;

    if (
      !previousRoute.path ||
      previousRoute.path === getCurrentRoutePath() ||
      !previousRoute.path.startsWith("/") ||
      !Number.isFinite(previousRoute.scrollY)
    ) {
      return null;
    }

    return previousRoute;
  } catch {
    if (storedValue === getCurrentRoutePath() || !storedValue.startsWith("/")) {
      return null;
    }

    return {
      path: storedValue,
      scrollY: 0,
    };
  }
}

export function queueScrollRestore(route: StoredRoute) {
  window.sessionStorage.setItem(PENDING_SCROLL_RESTORE_STORAGE_KEY, JSON.stringify(route));
}

export function consumeScrollRestore(path: string) {
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
