"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import {
  consumeScrollRestore,
  getCurrentRoutePath,
  getPreviousRoute,
  queueScrollRestore,
  recordPreviousRoute,
} from "@/lib/navigation-history";

function getRouteChangingAnchor(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  const anchor = target.closest<HTMLAnchorElement>("a[href]");

  if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
    return null;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return null;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return null;
  }

  return anchor;
}

export default function RouteMotionGuard() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const currentPath = `${pathname}${window.location.search}${window.location.hash}`;
    const scrollY = consumeScrollRestore(currentPath);

    if (scrollY === null) {
      return;
    }

    window.scrollTo(0, scrollY);
  }, [pathname]);

  useEffect(() => {
    function markRouteNavigation(event: MouseEvent) {
      const anchor = getRouteChangingAnchor(event);

      if (!anchor) {
        return;
      }

      recordPreviousRoute();

      if (anchor.hasAttribute("data-suppress-entry-motion")) {
        document.documentElement.dataset.viewTransitionNavigated = "true";
      } else {
        delete document.documentElement.dataset.viewTransitionNavigated;
      }
    }

    document.addEventListener("click", markRouteNavigation, { capture: true });

    return () => document.removeEventListener("click", markRouteNavigation, { capture: true });
  }, []);

  useEffect(() => {
    function queueBrowserBackScrollRestore() {
      const previousRoute = getPreviousRoute();

      if (previousRoute?.path === getCurrentRoutePath()) {
        queueScrollRestore(previousRoute);
      }
    }

    window.addEventListener("popstate", queueBrowserBackScrollRestore);

    return () => window.removeEventListener("popstate", queueBrowserBackScrollRestore);
  }, []);

  return null;
}
