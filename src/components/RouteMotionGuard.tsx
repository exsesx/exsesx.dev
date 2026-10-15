"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { MOTION_DATASET_KEYS } from "@/lib/motion-contract";
import {
  captureAnchorRouteIntent,
  consumeQueuedScrollRestore,
  queueBrowserBackScrollRestore,
} from "@/lib/route-intent";

function getRouteChangingAnchor(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return null;
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
    const scrollY = consumeQueuedScrollRestore(currentPath);

    if (scrollY === null) {
      return;
    }

    // html[data-smooth-scroll] scrolls smoothly; an animated restore would misalign the morph snapshot
    window.scrollTo({ behavior: "instant", left: 0, top: scrollY });
  }, [pathname]);

  useEffect(() => {
    let frame = 0;

    // WebKit stops holding the load-time #fragment position once loading completes.
    function enableSmoothScrolling() {
      frame = requestAnimationFrame(() => {
        document.documentElement.dataset[MOTION_DATASET_KEYS.smoothScroll] = "";
      });
    }

    if (document.readyState === "complete") {
      enableSmoothScrolling();
    } else {
      window.addEventListener("load", enableSmoothScrolling, { once: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", enableSmoothScrolling);
    };
  }, []);

  useEffect(() => {
    function markRouteNavigation(event: MouseEvent) {
      const anchor = getRouteChangingAnchor(event);

      if (!anchor) {
        return;
      }

      captureAnchorRouteIntent(anchor);
    }

    document.addEventListener("click", markRouteNavigation, { capture: true });

    return () => {
      document.removeEventListener("click", markRouteNavigation, { capture: true });
    };
  }, []);

  useEffect(() => {
    window.addEventListener("popstate", queueBrowserBackScrollRestore);

    return () => window.removeEventListener("popstate", queueBrowserBackScrollRestore);
  }, []);

  return null;
}
