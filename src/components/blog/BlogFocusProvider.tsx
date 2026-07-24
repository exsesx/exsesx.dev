"use client";

import { Toast } from "@base-ui/react/toast";
import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BLOG_UI, getBlogLocaleFromPath } from "@/lib/blog";
import { isBlogPostPath } from "@/lib/routes";
import { type TocNavigationTransaction, usePassiveBlogHeader } from "./usePassiveBlogHeader";

const BLOG_FOCUS_TOAST_ID = "blog-focus-mode";
const BLOG_FOCUS_TOAST_TIMEOUT = 2400;

type BlogFocusContextValue = {
  beginTocNavigation: () => TocNavigationTransaction;
  exitFocusMode: () => void;
  isBlogArticle: boolean;
  isFocusMode: boolean;
  isPassiveHeaderHidden: boolean;
  revealHeader: () => void;
  toggleFocusMode: () => void;
};

const BlogFocusContext = createContext<BlogFocusContextValue | null>(null);
const noopTocNavigation: TocNavigationTransaction = {
  complete: () => undefined,
  isActive: () => true,
};
const beginNoopTocNavigation = () => noopTocNavigation;

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
  const { add: addToast, close: closeToast, toasts } = Toast.useToastManager();
  const isFocusMode = isBlogArticle && focusState.pathname === pathname && focusState.active;
  const { beginTocNavigation, isPassiveHeaderHidden, passiveVisibility, revealHeader } = usePassiveBlogHeader({
    isBlogArticle,
    isFocusMode,
    pathname,
  });
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

  const value = useMemo(
    () => ({
      beginTocNavigation,
      exitFocusMode,
      isBlogArticle,
      isFocusMode,
      isPassiveHeaderHidden,
      revealHeader,
      toggleFocusMode,
    }),
    [
      beginTocNavigation,
      exitFocusMode,
      isBlogArticle,
      isFocusMode,
      isPassiveHeaderHidden,
      revealHeader,
      toggleFocusMode,
    ],
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

export function useBlogTocNavigation() {
  return useContext(BlogFocusContext)?.beginTocNavigation ?? beginNoopTocNavigation;
}
