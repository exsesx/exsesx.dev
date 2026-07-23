"use client";

import { Toast } from "@base-ui/react/toast";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BLOG_UI, getBlogLocaleFromPath } from "@/lib/blog";
import {
  BLOG_HEADER_HIDE_AFTER,
  BLOG_HEADER_REVEAL_DISTANCE,
  BLOG_HEADER_TOUCH_REVEAL_DISTANCE,
  createPassiveBlogHeaderState,
  revealPassiveBlogHeader,
  updatePassiveBlogHeader,
} from "@/lib/blog-focus";
import { BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE, BLOG_FOCUS_BOOTSTRAP_EVENT } from "@/lib/blog-focus-bootstrap";
import { isBlogPostPath } from "@/lib/routes";

const SCROLL_INTENT_KEYS = new Set(["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "]);
const BLOG_FOCUS_TOAST_ID = "blog-focus-mode";
const BLOG_FOCUS_TOAST_TIMEOUT = 2400;

type BlogFocusContextValue = {
  exitFocusMode: () => void;
  isBlogArticle: boolean;
  isFocusMode: boolean;
  isPassiveHeaderHidden: boolean;
  revealHeader: () => void;
  toggleFocusMode: () => void;
};

const BlogFocusContext = createContext<BlogFocusContextValue | null>(null);

type BlogFocusProviderProps = Readonly<{
  children: ReactNode;
}>;

type PassiveHeaderMotion = "animated" | "instant";

export function BlogFocusProvider({ children }: BlogFocusProviderProps) {
  return (
    <Toast.Provider limit={1} timeout={BLOG_FOCUS_TOAST_TIMEOUT}>
      <BlogFocusStateProvider>{children}</BlogFocusStateProvider>
    </Toast.Provider>
  );
}

function BlogFocusStateProvider({ children }: BlogFocusProviderProps) {
  const pathname = usePathname();
  const isBlogArticle = isBlogPostPath(pathname);
  const [focusState, setFocusState] = useState({ active: false, pathname });
  const [passiveVisibility, setPassiveVisibility] = useState<{
    hidden: boolean;
    motion: PassiveHeaderMotion;
    pathname: string;
  }>({ hidden: false, motion: "instant", pathname: "" });
  const { add: addToast, close: closeToast, toasts } = Toast.useToastManager();
  const passiveStateRef = useRef(createPassiveBlogHeaderState());
  const isFocusMode = isBlogArticle && focusState.pathname === pathname && focusState.active;
  const isPassiveHeaderHidden =
    isBlogArticle && !isFocusMode && passiveVisibility.pathname === pathname && passiveVisibility.hidden;
  const copy = BLOG_UI[getBlogLocaleFromPath(pathname) ?? "en"];

  useEffect(() => {
    closeToast(BLOG_FOCUS_TOAST_ID);
    setFocusState(current =>
      current.pathname === pathname && !current.active ? current : { active: false, pathname },
    );
  }, [closeToast, pathname]);

  const showFocusToast = useCallback(
    (title: string) => {
      addToast({
        id: BLOG_FOCUS_TOAST_ID,
        priority: "low",
        timeout: BLOG_FOCUS_TOAST_TIMEOUT,
        title,
      });
    },
    [addToast],
  );

  const revealHeader = useCallback(() => {
    passiveStateRef.current = revealPassiveBlogHeader(passiveStateRef.current, window.scrollY);
    setPassiveVisibility({ hidden: false, motion: "instant", pathname });
  }, [pathname]);

  const exitFocusMode = useCallback(() => {
    if (!isFocusMode) {
      return;
    }

    setFocusState({ active: false, pathname });
    showFocusToast(copy.focusModeOff);
  }, [copy.focusModeOff, isFocusMode, pathname, showFocusToast]);

  const toggleFocusMode = useCallback(() => {
    if (!isBlogArticle) {
      return;
    }

    if (isFocusMode) {
      exitFocusMode();
      return;
    }

    setFocusState({ active: true, pathname });
    showFocusToast(copy.focusModeOn);
  }, [copy.focusModeOn, exitFocusMode, isBlogArticle, isFocusMode, pathname, showFocusToast]);

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
    const revealDistance = window.matchMedia("(pointer: coarse)").matches
      ? BLOG_HEADER_TOUCH_REVEAL_DISTANCE
      : BLOG_HEADER_REVEAL_DISTANCE;
    let hasUserScrollIntent = false;
    let motion: PassiveHeaderMotion = "instant";
    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const activeElement = document.activeElement;
        const hasHeaderFocus = activeElement instanceof Node && Boolean(headerFrame?.contains(activeElement));
        const nextState = updatePassiveBlogHeader(passiveStateRef.current, {
          hasHeaderFocus,
          hasUserScrollIntent,
          revealDistance,
          shouldHideWithoutIntent: scrollY >= BLOG_HEADER_HIDE_AFTER,
          scrollY,
        });

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
        hasUserScrollIntent = true;
        motion = "instant";
      }
    }

    function handleTouchMove() {
      hasUserScrollIntent = true;
      motion = "animated";
    }

    function handlePointerDown(event: PointerEvent) {
      const isMiddleButton = event.button === 1;
      const isScrollbarLane = event.clientX >= document.documentElement.clientWidth - 1;

      if (isMiddleButton || isScrollbarLane) {
        hasUserScrollIntent = true;
        motion = "animated";
      }
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY !== 0) {
        hasUserScrollIntent = true;
        motion = "animated";
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("keydown", handleKeyboardIntent, { capture: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
      window.removeEventListener("scroll", update);
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove);
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

  const value = useMemo(
    () => ({
      exitFocusMode,
      isBlogArticle,
      isFocusMode,
      isPassiveHeaderHidden,
      revealHeader,
      toggleFocusMode,
    }),
    [exitFocusMode, isBlogArticle, isFocusMode, isPassiveHeaderHidden, revealHeader, toggleFocusMode],
  );

  return (
    <BlogFocusContext.Provider value={value}>
      <div
        className="relative isolate min-h-full w-full overflow-x-clip text-foreground transition-colors duration-300"
        data-blog-article={isBlogArticle ? "true" : undefined}
        data-blog-focus={isFocusMode ? "true" : undefined}
        data-blog-header-motion={
          isBlogArticle && passiveVisibility.pathname === pathname && passiveVisibility.motion === "instant"
            ? "instant"
            : undefined
        }
        data-blog-passive-hidden={isPassiveHeaderHidden ? "true" : undefined}
      >
        {children}
        <Toast.Portal>
          <Toast.Viewport className="blog-focus-toast-viewport">
            {toasts.map(toast => (
              <Toast.Root className="blog-focus-toast" key={toast.id} swipeDirection="down" toast={toast}>
                <Toast.Content className="blog-focus-toast-content">
                  <Toast.Title className="blog-focus-toast-title" />
                </Toast.Content>
              </Toast.Root>
            ))}
          </Toast.Viewport>
        </Toast.Portal>
      </div>
    </BlogFocusContext.Provider>
  );
}

export function useBlogFocus() {
  const context = useContext(BlogFocusContext);

  if (!context) {
    throw new Error("useBlogFocus must be used inside BlogFocusProvider");
  }

  return context;
}
