"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  BLOG_HEADER_HIDE_AFTER,
  BLOG_HEADER_HIDE_DISTANCE,
  BLOG_HEADER_REVEAL_DISTANCE,
  BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
  BLOG_HEADER_TOUCH_HIDE_DISTANCE,
  BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
  createPassiveBlogHeaderState,
  revealPassiveBlogHeader,
  updatePassiveBlogHeader,
} from "@/lib/blog-focus";
import { BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE, BLOG_FOCUS_BOOTSTRAP_EVENT } from "@/lib/blog-focus-bootstrap";

const SCROLL_INTENT_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);
const TOUCH_SCROLL_SETTLE_DELAY = 160;

type PassiveHeaderMotion = "animated" | "instant";
type TouchScrollPhase = "active" | "idle" | "settling";

type PassiveVisibility = {
  hidden: boolean;
  motion: PassiveHeaderMotion;
  pathname: string;
};

type PassiveBlogHeaderOptions = {
  isBlogArticle: boolean;
  isFocusMode: boolean;
  pathname: string;
};

export type TocNavigationTransaction = {
  complete: () => void;
  isActive: () => boolean;
};

export function usePassiveBlogHeader({ isBlogArticle, isFocusMode, pathname }: PassiveBlogHeaderOptions) {
  const [passiveVisibility, setPassiveVisibility] = useState<PassiveVisibility>({
    hidden: false,
    motion: "instant",
    pathname: "",
  });
  const hasUserScrollIntentRef = useRef(false);
  const passiveStateRef = useRef(createPassiveBlogHeaderState());
  const touchScrollRef = useRef<{ blocksHide: boolean; phase: TouchScrollPhase }>({
    blocksHide: false,
    phase: "idle",
  });
  const touchSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tocNavigationIdRef = useRef<number | null>(null);
  const nextTocNavigationIdRef = useRef(0);
  const isPassiveHeaderHidden =
    isBlogArticle && !isFocusMode && passiveVisibility.pathname === pathname && passiveVisibility.hidden;

  const revealHeader = useCallback(() => {
    passiveStateRef.current = revealPassiveBlogHeader(passiveStateRef.current, window.scrollY);
    setPassiveVisibility({ hidden: false, motion: "instant", pathname });
  }, [pathname]);

  const beginTocNavigation = useCallback(() => {
    if (touchSettleTimerRef.current !== null) {
      clearTimeout(touchSettleTimerRef.current);
      touchSettleTimerRef.current = null;
    }

    touchScrollRef.current = { blocksHide: false, phase: "idle" };
    const navigationId = nextTocNavigationIdRef.current + 1;
    nextTocNavigationIdRef.current = navigationId;
    tocNavigationIdRef.current = navigationId;
    hasUserScrollIntentRef.current = false;

    const nextState = updatePassiveBlogHeader(passiveStateRef.current, {
      hasUserScrollIntent: false,
      shouldHideWithoutIntent: isBlogArticle && !isFocusMode,
      scrollY: window.scrollY,
    });

    passiveStateRef.current = nextState;
    setPassiveVisibility({ hidden: nextState.hidden, motion: "animated", pathname });

    return {
      complete: () => {
        if (tocNavigationIdRef.current !== navigationId) {
          return;
        }

        tocNavigationIdRef.current = null;
        hasUserScrollIntentRef.current = false;
        passiveStateRef.current = createPassiveBlogHeaderState(window.scrollY, passiveStateRef.current.hidden);
      },
      isActive: () => tocNavigationIdRef.current === navigationId,
    };
  }, [isBlogArticle, isFocusMode, pathname]);

  useLayoutEffect(() => {
    const bootstrapElement = document.documentElement;

    function synchronizePassiveVisibility() {
      const scrollY = window.scrollY;
      const bootstrapStartsHidden = bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE] === "hidden";
      const startsPastHidePoint = isBlogArticle && (bootstrapStartsHidden || scrollY >= BLOG_HEADER_HIDE_AFTER);

      passiveStateRef.current = createPassiveBlogHeaderState(scrollY, startsPastHidePoint);
      setPassiveVisibility({ hidden: startsPastHidePoint, motion: "instant", pathname });
    }

    synchronizePassiveVisibility();
    window.addEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);

    if (!isBlogArticle || isFocusMode) {
      return () => window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
    }

    const headerFrame = document.querySelector<HTMLElement>(".site-header-nav-frame");
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const hideDistance = isCoarsePointer ? BLOG_HEADER_TOUCH_HIDE_DISTANCE : BLOG_HEADER_HIDE_DISTANCE;
    const revealDistance = isCoarsePointer ? BLOG_HEADER_TOUCH_REVEAL_DISTANCE : BLOG_HEADER_REVEAL_DISTANCE;
    hasUserScrollIntentRef.current = false;
    tocNavigationIdRef.current = null;
    touchScrollRef.current = { blocksHide: false, phase: "idle" };
    let motion: PassiveHeaderMotion = "instant";
    let frame = 0;

    function cancelTouchSettle() {
      if (touchSettleTimerRef.current === null) {
        return;
      }

      clearTimeout(touchSettleTimerRef.current);
      touchSettleTimerRef.current = null;
    }

    function completeTouchScroll() {
      cancelTouchSettle();

      if (touchScrollRef.current.phase !== "settling") {
        return;
      }

      touchScrollRef.current = {
        ...touchScrollRef.current,
        phase: "idle",
      };
      hasUserScrollIntentRef.current = false;
      passiveStateRef.current = createPassiveBlogHeaderState(window.scrollY, passiveStateRef.current.hidden);
    }

    function scheduleTouchSettle() {
      cancelTouchSettle();
      touchSettleTimerRef.current = setTimeout(completeTouchScroll, TOUCH_SCROLL_SETTLE_DELAY);
    }

    function beginTouchScroll() {
      cancelTouchSettle();
      tocNavigationIdRef.current = null;
      hasUserScrollIntentRef.current = true;
      motion = "animated";
      touchScrollRef.current = { blocksHide: false, phase: "active" };
      passiveStateRef.current = createPassiveBlogHeaderState(window.scrollY, passiveStateRef.current.hidden);
    }

    function cancelTouchScroll() {
      cancelTouchSettle();
      touchScrollRef.current = { blocksHide: false, phase: "idle" };
    }

    function update() {
      if (touchScrollRef.current.phase === "settling") {
        scheduleTouchSettle();
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const activeElement = document.activeElement;
        const hasHeaderFocus = activeElement instanceof Node && Boolean(headerFrame?.contains(activeElement));
        const previousState = passiveStateRef.current;
        const nextState = updatePassiveBlogHeader(passiveStateRef.current, {
          allowHide: !touchScrollRef.current.blocksHide,
          directionChangeDeadband: isCoarsePointer ? BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND : 0,
          hasHeaderFocus,
          hasUserScrollIntent: tocNavigationIdRef.current === null && hasUserScrollIntentRef.current,
          hideDistance,
          revealDistance,
          shouldHideWithoutIntent: tocNavigationIdRef.current !== null || scrollY >= BLOG_HEADER_HIDE_AFTER,
          scrollY,
        });

        if (previousState.hidden && !nextState.hidden && touchScrollRef.current.phase !== "idle") {
          touchScrollRef.current.blocksHide = true;
        }

        passiveStateRef.current = nextState;
        setPassiveVisibility(current =>
          current.pathname === pathname && current.hidden === nextState.hidden
            ? current
            : { hidden: nextState.hidden, motion, pathname },
        );
      });
    }

    function handleKeyboardIntent(event: KeyboardEvent) {
      if (event.key === "Tab") {
        revealHeader();
      }

      if (SCROLL_INTENT_KEYS.has(event.key)) {
        cancelTouchScroll();
        tocNavigationIdRef.current = null;
        hasUserScrollIntentRef.current = true;
        motion = "instant";
      }
    }

    function handleTouchStart() {
      beginTouchScroll();
    }

    function handleTouchMove() {
      if (touchScrollRef.current.phase === "idle") {
        beginTouchScroll();
      }

      tocNavigationIdRef.current = null;
      hasUserScrollIntentRef.current = true;
      motion = "animated";
    }

    function handleTouchEnd() {
      if (touchScrollRef.current.phase !== "active") {
        return;
      }

      touchScrollRef.current = {
        ...touchScrollRef.current,
        phase: "settling",
      };
      scheduleTouchSettle();
    }

    function handleScrollEnd() {
      completeTouchScroll();
    }

    function handlePointerDown(event: PointerEvent) {
      const isMiddleButton = event.button === 1;
      const isScrollbarLane = event.clientX >= document.documentElement.clientWidth - 1;

      if (isMiddleButton || isScrollbarLane) {
        cancelTouchScroll();
        tocNavigationIdRef.current = null;
        hasUserScrollIntentRef.current = true;
        motion = "animated";
      }
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY !== 0) {
        cancelTouchScroll();
        tocNavigationIdRef.current = null;
        hasUserScrollIntentRef.current = true;
        motion = "animated";
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scrollend", handleScrollEnd);
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyboardIntent, { capture: true });

    return () => {
      cancelAnimationFrame(frame);
      cancelTouchSettle();
      window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
      window.removeEventListener("scroll", update);
      window.removeEventListener("scrollend", handleScrollEnd);
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyboardIntent, { capture: true });
    };
  }, [isBlogArticle, isFocusMode, pathname, revealHeader]);

  useLayoutEffect(() => {
    const bootstrapElement = document.documentElement;
    const bootstrapState = bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE];

    if (!bootstrapState || bootstrapState === "pending") {
      return;
    }

    if (!isBlogArticle) {
      delete bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE];
      return;
    }

    const hasSynchronizedState =
      passiveVisibility.pathname === pathname && (bootstrapState === "hidden") === passiveVisibility.hidden;

    if (hasSynchronizedState) {
      delete bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE];
    }
  }, [isBlogArticle, passiveVisibility, pathname]);

  return {
    beginTocNavigation,
    isPassiveHeaderHidden,
    passiveVisibility,
    revealHeader,
  };
}
