"use client";

import { ArrowUp } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, useEffect, useLayoutEffect, useRef } from "react";
import { BLOG_UI, type BlogLocale } from "@/lib/blog";

const SCROLL_TOP_HIDE_VIEWPORT_RATIO = 0.25;
const SCROLL_TOP_SETTLED_Y = 1;
const SCROLL_TOP_FALLBACK_MS = 1200;

export type BlogScrollTopState = "hidden" | "visible";

type BlogScrollTopGeometry = {
  currentState: BlogScrollTopState;
  scrollY: number;
  viewportHeight: number;
};

export function resolveBlogScrollTopState({
  currentState,
  scrollY,
  viewportHeight,
}: BlogScrollTopGeometry): BlogScrollTopState {
  const safeScrollY = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  const safeViewportHeight = Number.isFinite(viewportHeight) ? Math.max(1, viewportHeight) : 1;

  if (currentState === "visible") {
    return safeScrollY <= safeViewportHeight * SCROLL_TOP_HIDE_VIEWPORT_RATIO ? "hidden" : "visible";
  }

  return safeScrollY >= safeViewportHeight ? "visible" : "hidden";
}

export default function BlogScrollToTop({ locale }: { locale: BlogLocale }) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const activationModalityRef = useRef<"keyboard" | "pointer" | null>(null);
  const pendingNavigationCleanupRef = useRef<(() => void) | null>(null);
  const previousPointerFocusRef = useRef<HTMLElement | null>(null);
  const copy = BLOG_UI[locale];

  useBlogScrollTopVisibility(buttonRef);

  useEffect(
    () => () => {
      pendingNavigationCleanupRef.current?.();
    },
    [],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      activationModalityRef.current = "keyboard";
      previousPointerFocusRef.current = null;
    }
  }

  function markPointerActivation() {
    activationModalityRef.current = "pointer";
    previousPointerFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    pendingNavigationCleanupRef.current?.();

    const button = event.currentTarget;
    const activationModality = activationModalityRef.current;
    const previousPointerFocus = previousPointerFocusRef.current;
    const shouldFocusMain = activationModality === "keyboard";
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    let fallbackTimer = 0;
    let settleFrame = 0;
    let finished = false;

    activationModalityRef.current = null;
    previousPointerFocusRef.current = null;

    if (shouldFocusMain || document.activeElement === button) {
      button.dataset.scrollTopFocusPending = "true";
    } else {
      delete button.dataset.scrollTopFocusPending;
    }

    function restorePointerFocus() {
      if (previousPointerFocus?.isConnected && previousPointerFocus !== button) {
        previousPointerFocus.focus({ preventScroll: true });
      }

      if (document.activeElement === button) {
        button.blur();
      }
    }

    function clearPendingSignals() {
      cancelAnimationFrame(settleFrame);
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("scrollend", finishNavigation);
    }

    function cancelNavigation() {
      if (finished) {
        return;
      }

      finished = true;
      clearPendingSignals();
      delete button.dataset.scrollTopFocusPending;
    }

    function finishNavigation() {
      if (finished) {
        return;
      }

      finished = true;
      clearPendingSignals();
      pendingNavigationCleanupRef.current = null;

      if (window.scrollY > SCROLL_TOP_SETTLED_Y) {
        if (shouldFocusMain) {
          if (button.dataset.scrollTopState === "hidden" && document.activeElement === button) {
            button.blur();
          }
        } else {
          restorePointerFocus();
        }

        delete button.dataset.scrollTopFocusPending;
        return;
      }

      if (shouldFocusMain) {
        const main = document.getElementById("main-content");

        if (main instanceof HTMLElement) {
          main.focus({ preventScroll: true });
        } else if (document.activeElement === button) {
          button.blur();
        }
      } else {
        restorePointerFocus();
      }

      delete button.dataset.scrollTopFocusPending;
    }

    pendingNavigationCleanupRef.current = cancelNavigation;

    if (behavior === "auto") {
      window.scrollTo({ behavior, top: 0 });
      settleFrame = requestAnimationFrame(finishNavigation);
      return;
    }

    window.addEventListener("scrollend", finishNavigation, { once: true });
    fallbackTimer = window.setTimeout(finishNavigation, SCROLL_TOP_FALLBACK_MS);
    window.scrollTo({ behavior, top: 0 });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={copy.scrollToTop}
      className="blog-toc-mobile-trigger blog-scroll-top"
      data-scroll-top-motion="instant"
      data-scroll-top-state="hidden"
      data-testid="blog-scroll-top"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseDown={markPointerActivation}
      onPointerCancel={() => {
        activationModalityRef.current = null;
        previousPointerFocusRef.current = null;
      }}
      onPointerDown={markPointerActivation}
      onTouchStart={markPointerActivation}
    >
      <span aria-hidden="true" className="blog-toc-mobile-face blog-scroll-top-face glass-frost">
        <ArrowUp className="blog-toc-mobile-icon blog-scroll-top-icon" size={18} strokeWidth={2.2} />
      </span>
    </button>
  );
}

function useBlogScrollTopVisibility(buttonRef: { current: HTMLButtonElement | null }) {
  useLayoutEffect(() => {
    const buttonElement = buttonRef.current;

    if (!buttonElement) {
      return;
    }

    const button: HTMLButtonElement = buttonElement;
    const visualViewport = window.visualViewport;
    let disposed = false;
    let updateFrame = 0;
    let firstMotionFrame = 0;
    let secondMotionFrame = 0;

    function update() {
      const currentState: BlogScrollTopState = button.dataset.scrollTopState === "visible" ? "visible" : "hidden";
      const nextState = resolveBlogScrollTopState({
        currentState,
        scrollY: window.scrollY,
        viewportHeight: visualViewport?.height ?? window.innerHeight,
      });

      if (currentState !== nextState) {
        button.dataset.scrollTopState = nextState;
      }
    }

    function scheduleUpdate() {
      if (disposed || updateFrame !== 0) {
        return;
      }

      updateFrame = requestAnimationFrame(() => {
        updateFrame = 0;
        update();
      });
    }

    function armMotionAfterStableLayout() {
      cancelAnimationFrame(firstMotionFrame);
      cancelAnimationFrame(secondMotionFrame);
      button.dataset.scrollTopMotion = "instant";
      firstMotionFrame = requestAnimationFrame(() => {
        secondMotionFrame = requestAnimationFrame(() => {
          button.dataset.scrollTopMotion = "animated";
        });
      });
    }

    function restoreScrollState() {
      armMotionAfterStableLayout();
      update();
    }

    restoreScrollState();
    window.addEventListener("hashchange", restoreScrollState);
    window.addEventListener("pageshow", restoreScrollState);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("resize", scheduleUpdate);

    return () => {
      disposed = true;
      cancelAnimationFrame(updateFrame);
      cancelAnimationFrame(firstMotionFrame);
      cancelAnimationFrame(secondMotionFrame);
      window.removeEventListener("hashchange", restoreScrollState);
      window.removeEventListener("pageshow", restoreScrollState);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      visualViewport?.removeEventListener("resize", scheduleUpdate);
    };
  }, [buttonRef]);
}
