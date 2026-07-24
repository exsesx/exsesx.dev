"use client";

import { useLayoutEffect, useRef } from "react";

const COMPACT_ARTICLE_LAYOUT_QUERY = "(max-width: 79.999rem)";
const ARTICLE_END_CLEARANCE = 80;

export type MobileTocLauncherState = "inline" | "docked" | "hidden";

type MobileTocLauncherGeometry = {
  articleBottom: number;
  isCompactLayout: boolean;
  launcherBottom: number;
  viewportHeight: number;
};

export function resolveMobileTocLauncherState({
  articleBottom,
  isCompactLayout,
  launcherBottom,
  viewportHeight,
}: MobileTocLauncherGeometry): MobileTocLauncherState {
  if (!isCompactLayout || launcherBottom > 0) {
    return "inline";
  }

  return articleBottom <= viewportHeight - ARTICLE_END_CLEARANCE ? "hidden" : "docked";
}

export function useMobileTocLauncher() {
  const shellRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const shellElement = shellRef.current;
    const articleElement = document.getElementById("article-content");

    if (!shellElement || !articleElement) {
      return;
    }

    const shell: HTMLDivElement = shellElement;
    const article: HTMLElement = articleElement;
    const compactLayout = window.matchMedia(COMPACT_ARTICLE_LAYOUT_QUERY);
    const visualViewport = window.visualViewport;
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    let disposed = false;
    let updateFrame = 0;
    let firstMotionFrame = 0;
    let secondMotionFrame = 0;
    let entranceTimer = 0;

    function update() {
      const nextState = resolveMobileTocLauncherState({
        articleBottom: article.getBoundingClientRect().bottom,
        isCompactLayout: compactLayout.matches,
        launcherBottom: shell.getBoundingClientRect().bottom,
        viewportHeight: visualViewport?.height ?? window.innerHeight,
      });

      if (shell.dataset.tocLauncherState !== nextState) {
        window.clearTimeout(entranceTimer);
        delete shell.dataset.tocLauncherEntering;

        if (nextState === "docked" && shell.dataset.tocLauncherMotion === "animated") {
          shell.dataset.tocLauncherEntering = "true";
          entranceTimer = window.setTimeout(() => {
            delete shell.dataset.tocLauncherEntering;
          }, 180);
        }

        shell.dataset.tocLauncherState = nextState;
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
      shell.dataset.tocLauncherMotion = "instant";
      firstMotionFrame = requestAnimationFrame(() => {
        secondMotionFrame = requestAnimationFrame(() => {
          shell.dataset.tocLauncherMotion = "animated";
        });
      });
    }

    function restoreLayoutState() {
      armMotionAfterStableLayout();
      update();
    }

    restoreLayoutState();
    resizeObserver.observe(shell);
    resizeObserver.observe(article);
    compactLayout.addEventListener("change", restoreLayoutState);
    window.addEventListener("hashchange", restoreLayoutState);
    window.addEventListener("pageshow", restoreLayoutState);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    visualViewport?.addEventListener("resize", scheduleUpdate);

    return () => {
      disposed = true;
      cancelAnimationFrame(updateFrame);
      cancelAnimationFrame(firstMotionFrame);
      cancelAnimationFrame(secondMotionFrame);
      window.clearTimeout(entranceTimer);
      resizeObserver.disconnect();
      compactLayout.removeEventListener("change", restoreLayoutState);
      window.removeEventListener("hashchange", restoreLayoutState);
      window.removeEventListener("pageshow", restoreLayoutState);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      visualViewport?.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return shellRef;
}
