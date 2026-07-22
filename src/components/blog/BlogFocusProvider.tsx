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
  BLOG_ARTICLE_START_OFFSET,
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
  const [passiveVisibility, setPassiveVisibility] = useState({ hidden: false, pathname: "" });
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
    setPassiveVisibility({ hidden: false, pathname });
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
    const article = document.getElementById("article-content");
    const bootstrapElement = document.documentElement;

    function synchronizePassiveVisibility() {
      const scrollY = window.scrollY;
      const articleStart = article ? article.getBoundingClientRect().top + scrollY : Number.POSITIVE_INFINITY;
      const bootstrapStartsHidden = bootstrapElement.dataset[BLOG_FOCUS_BOOTSTRAP_ATTRIBUTE] === "hidden";
      const startsInsideArticle =
        isBlogArticle && (bootstrapStartsHidden || scrollY >= articleStart - BLOG_ARTICLE_START_OFFSET);

      passiveStateRef.current = createPassiveBlogHeaderState(scrollY, startsInsideArticle);
      setPassiveVisibility({ hidden: startsInsideArticle, pathname });
    }

    synchronizePassiveVisibility();
    window.addEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);

    if (!isBlogArticle || isFocusMode) {
      return () => window.removeEventListener(BLOG_FOCUS_BOOTSTRAP_EVENT, synchronizePassiveVisibility);
    }

    const headerFrame = document.querySelector<HTMLElement>(".site-header-nav-frame");
    let hasUserScrollIntent = false;
    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const articleStart = article ? article.getBoundingClientRect().top + scrollY : Number.POSITIVE_INFINITY;
        const activeElement = document.activeElement;
        const hasHeaderFocus = activeElement instanceof Node && Boolean(headerFrame?.contains(activeElement));
        const nextState = updatePassiveBlogHeader(passiveStateRef.current, {
          hasHeaderFocus,
          hasUserScrollIntent,
          isPastArticleStart: scrollY >= articleStart - BLOG_ARTICLE_START_OFFSET,
          scrollY,
        });

        passiveStateRef.current = nextState;
        setPassiveVisibility(current =>
          current.pathname === pathname && current.hidden === nextState.hidden
            ? current
            : { hidden: nextState.hidden, pathname },
        );
      });
    }

    function handleKeyboardIntent(event: KeyboardEvent) {
      if (event.key === "Tab") {
        revealHeader();
      }

      if (SCROLL_INTENT_KEYS.has(event.key)) {
        hasUserScrollIntent = true;
      }
    }

    function handleTouchMove() {
      hasUserScrollIntent = true;
    }

    function handlePointerDown(event: PointerEvent) {
      const isMiddleButton = event.button === 1;
      const isScrollbarLane = event.clientX >= document.documentElement.clientWidth - 1;

      if (isMiddleButton || isScrollbarLane) {
        hasUserScrollIntent = true;
      }
    }

    function handleWheel(event: WheelEvent) {
      if (event.deltaY !== 0) {
        hasUserScrollIntent = true;
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
