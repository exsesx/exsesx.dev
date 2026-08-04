"use client";

import { useMotionValueEvent, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  BLOG_HEADER_HIDE_AFTER,
  BLOG_HEADER_REVEAL_DISTANCE,
  BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND,
  BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
  createPassiveBlogHeaderState,
  updatePassiveBlogHeader,
} from "@/lib/blog-focus";
import { BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE, BLOG_FOCUS_BOOTSTRAP_EVENT } from "@/lib/blog-focus-bootstrap";

const SCROLL_INTENT_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);
const HEADER_SPRING_ACTIVE_ATTRIBUTE = "data-blog-header-spring";
const HEADER_SPRING_SETTLED_ATTRIBUTE = "data-blog-header-spring-settled";
const HEADER_SPRING_CONFIG = {
  damping: 52,
  mass: 0.7,
  restDelta: 0.25,
  restSpeed: 4,
  stiffness: 850,
};

type PassiveHeaderMotion = "animated" | "instant";

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

function readMaxScrollY() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

function readHiddenHeaderY(headerFrame: HTMLElement) {
  return -(headerFrame.getBoundingClientRect().height + Math.max(0, headerFrame.offsetTop) + 12);
}

function writeHeaderY(headerFrame: HTMLElement, y: number) {
  headerFrame.style.transform = `translate3d(0, ${y.toFixed(3)}px, 0) scale(1)`;
}

export function usePassiveBlogHeader({ isBlogArticle, isFocusMode, pathname }: PassiveBlogHeaderOptions) {
  const [passiveVisibility, setPassiveVisibility] = useState<PassiveVisibility>({
    hidden: false,
    motion: "instant",
    pathname: "",
  });
  const headerFrameRef = useRef<HTMLElement | null>(null);
  const headerHiddenTargetRef = useRef(false);
  const passiveStateRef = useRef(createPassiveBlogHeaderState());
  const tocNavigationIdRef = useRef<number | null>(null);
  const nextTocNavigationIdRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();
  const headerY = useSpring(0, HEADER_SPRING_CONFIG);
  const isPassiveHeaderHidden =
    isBlogArticle && !isFocusMode && passiveVisibility.pathname === pathname && passiveVisibility.hidden;

  useMotionValueEvent(headerY, "change", y => {
    const headerFrame = headerFrameRef.current;

    if (headerFrame) {
      writeHeaderY(headerFrame, y);
    }
  });

  useMotionValueEvent(headerY, "animationComplete", () => {
    const headerFrame = headerFrameRef.current;

    if (!headerFrame) {
      return;
    }

    const hiddenY = readHiddenHeaderY(headerFrame);
    const settledHidden = headerHiddenTargetRef.current && Math.abs(headerY.get() - hiddenY) < 1;
    headerFrame.toggleAttribute(HEADER_SPRING_SETTLED_ATTRIBUTE, settledHidden);
    headerFrame.style.removeProperty("will-change");
  });

  const setHeaderMotionTarget = useCallback(
    (hidden: boolean, motion: PassiveHeaderMotion) => {
      const headerFrame = headerFrameRef.current;

      if (!headerFrame?.hasAttribute(HEADER_SPRING_ACTIVE_ATTRIBUTE)) {
        return;
      }

      const targetY = hidden ? readHiddenHeaderY(headerFrame) : 0;
      headerHiddenTargetRef.current = hidden;
      headerFrame.inert = hidden;
      headerFrame.style.pointerEvents = hidden ? "none" : "";
      headerFrame.removeAttribute(HEADER_SPRING_SETTLED_ATTRIBUTE);

      if (motion === "instant" || prefersReducedMotion) {
        headerY.jump(targetY);
        writeHeaderY(headerFrame, targetY);
        headerFrame.toggleAttribute(HEADER_SPRING_SETTLED_ATTRIBUTE, hidden);
        headerFrame.style.removeProperty("will-change");
        return;
      }

      headerFrame.style.willChange = "transform";
      headerY.set(targetY);
    },
    [headerY, prefersReducedMotion],
  );

  const resetHeaderMotion = useCallback(() => {
    const headerFrame = headerFrameRef.current;
    headerFrameRef.current = null;
    headerHiddenTargetRef.current = false;
    headerY.jump(0);

    if (!headerFrame) {
      return;
    }

    headerFrame.inert = false;
    headerFrame.removeAttribute(HEADER_SPRING_ACTIVE_ATTRIBUTE);
    headerFrame.removeAttribute(HEADER_SPRING_SETTLED_ATTRIBUTE);
    headerFrame.style.removeProperty("pointer-events");
    headerFrame.style.removeProperty("transform");
    headerFrame.style.removeProperty("will-change");
  }, [headerY]);

  const revealHeader = useCallback(() => {
    passiveStateRef.current = createPassiveBlogHeaderState(window.scrollY, false, readMaxScrollY());
    setHeaderMotionTarget(false, "instant");
    setPassiveVisibility({ hidden: false, motion: "instant", pathname });
  }, [pathname, setHeaderMotionTarget]);

  const beginTocNavigation = useCallback(() => {
    const navigationId = nextTocNavigationIdRef.current + 1;
    nextTocNavigationIdRef.current = navigationId;
    tocNavigationIdRef.current = navigationId;

    const nextState = updatePassiveBlogHeader(passiveStateRef.current, {
      hasUserScrollIntent: false,
      maxScrollY: readMaxScrollY(),
      shouldHideWithoutIntent: isBlogArticle && !isFocusMode,
      scrollY: window.scrollY,
    });

    passiveStateRef.current = nextState;
    setHeaderMotionTarget(nextState.hidden, "animated");
    setPassiveVisibility({ hidden: nextState.hidden, motion: "animated", pathname });

    return {
      complete: () => {
        if (tocNavigationIdRef.current !== navigationId) {
          return;
        }

        tocNavigationIdRef.current = null;
        passiveStateRef.current = createPassiveBlogHeaderState(
          window.scrollY,
          passiveStateRef.current.hidden,
          readMaxScrollY(),
        );
      },
      isActive: () => tocNavigationIdRef.current === navigationId,
    };
  }, [isBlogArticle, isFocusMode, pathname, setHeaderMotionTarget]);

  useLayoutEffect(() => {
    const bootstrapElement = document.documentElement;

    function synchronizePassiveVisibility() {
      const scrollY = window.scrollY;
      const maxScrollY = readMaxScrollY();
      const bootstrapStartsHidden = bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE] === "hidden";
      const startsPastHidePoint = isBlogArticle && (bootstrapStartsHidden || scrollY >= BLOG_HEADER_HIDE_AFTER);

      passiveStateRef.current = createPassiveBlogHeaderState(scrollY, startsPastHidePoint, maxScrollY);
      setHeaderMotionTarget(startsPastHidePoint, "instant");
      setPassiveVisibility({ hidden: startsPastHidePoint, motion: "instant", pathname });
    }

    synchronizePassiveVisibility();
    window.addEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);

    if (!isBlogArticle || isFocusMode) {
      return () => window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
    }

    const headerFrame = document.querySelector<HTMLElement>(".site-header-nav-frame");
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const revealDistance = isCoarsePointer ? BLOG_HEADER_TOUCH_REVEAL_DISTANCE : BLOG_HEADER_REVEAL_DISTANCE;
    headerFrameRef.current = headerFrame;

    if (isCoarsePointer && headerFrame) {
      headerFrame.setAttribute(HEADER_SPRING_ACTIVE_ATTRIBUTE, "true");
      setHeaderMotionTarget(passiveStateRef.current.hidden, "instant");
    }

    tocNavigationIdRef.current = null;
    let motion: PassiveHeaderMotion = "instant";

    function beginAnimatedScroll() {
      tocNavigationIdRef.current = null;
      motion = "animated";
    }

    function update() {
      const scrollY = window.scrollY;
      const activeElement = document.activeElement;
      const hasHeaderFocus =
        activeElement instanceof Element &&
        activeElement.matches(":focus-visible") &&
        Boolean(headerFrame?.contains(activeElement));
      const previousState = passiveStateRef.current;
      const nextState = updatePassiveBlogHeader(previousState, {
        directionChangeDeadband: isCoarsePointer ? BLOG_HEADER_TOUCH_DIRECTION_CHANGE_DEADBAND : 0,
        hasHeaderFocus,
        hasUserScrollIntent: tocNavigationIdRef.current === null,
        maxScrollY: readMaxScrollY(),
        revealDistance,
        shouldHideWithoutIntent: tocNavigationIdRef.current !== null || scrollY >= BLOG_HEADER_HIDE_AFTER,
        scrollY,
      });

      passiveStateRef.current = nextState;

      if (previousState.hidden !== nextState.hidden) {
        setHeaderMotionTarget(nextState.hidden, motion);
        setPassiveVisibility({ hidden: nextState.hidden, motion, pathname });
      }
    }

    function handleKeyboardIntent(event: KeyboardEvent) {
      if (event.key === "Tab") {
        revealHeader();
      }

      if (SCROLL_INTENT_KEYS.has(event.key)) {
        tocNavigationIdRef.current = null;
        motion = "instant";
      }
    }

    function handleTouchStart() {
      beginAnimatedScroll();
    }

    function handleTouchMove() {
      beginAnimatedScroll();
    }

    function handlePointerDown(event: PointerEvent) {
      const isMiddleButton = event.button === 1;
      const isScrollbarLane = event.clientX >= document.documentElement.clientWidth - 1;

      if (isMiddleButton || isScrollbarLane) {
        beginAnimatedScroll();
      }
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY !== 0) {
        beginAnimatedScroll();
      }
    }

    const resizeObserver =
      isCoarsePointer && headerFrame && "ResizeObserver" in window
        ? new ResizeObserver(() => {
            if (headerHiddenTargetRef.current) {
              setHeaderMotionTarget(true, "instant");
            }
          })
        : null;

    if (headerFrame) {
      resizeObserver?.observe(headerFrame);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyboardIntent, { capture: true });

    return () => {
      resizeObserver?.disconnect();
      resetHeaderMotion();
      window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
      window.removeEventListener("scroll", update);
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyboardIntent, { capture: true });
    };
  }, [isBlogArticle, isFocusMode, pathname, resetHeaderMotion, revealHeader, setHeaderMotionTarget]);

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
