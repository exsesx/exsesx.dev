"use client";

import { useLayoutEffect, useRef } from "react";
import { resolveIPhoneDisplayProgress } from "../../lib/iphone-display-progress";

const DRAW_IN_SETTLE_GRACE_MS = 60;

type ReadingProgressProps = {
  articleId: string;
};

export default function ReadingProgress({ articleId }: ReadingProgressProps) {
  const progressRootRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const article = document.getElementById(articleId);
    const progressRoot = progressRootRef.current;
    const progressBar = progressBarRef.current;
    const progressPath = progressPathRef.current;

    if (!article || !progressRoot || !progressBar || !progressPath) {
      return;
    }

    const articleElement = article;
    const progressRootElement = progressRoot;
    const progressBarElement = progressBar;
    const progressPathElement = progressPath;
    const progressSvgElement = progressPathElement.ownerSVGElement;
    const visualViewport = window.visualViewport;
    let frame = 0;
    let measurementFrame = 0;
    let drawInTimeout = 0;
    let articleTop = 0;
    let readableDistance = 1;
    let cssOwnsDashOffset = false;

    function renderProgress() {
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));

      progressBarElement.style.transform = `scaleX(${nextProgress})`;

      if (!cssOwnsDashOffset) {
        progressPathElement.style.strokeDashoffset = `${1 - nextProgress}`;
      }

      progressRootElement.hidden = nextProgress <= 0;
    }

    function endDeviceFrameDrawIn() {
      if (!cssOwnsDashOffset) {
        return;
      }

      window.clearTimeout(drawInTimeout);
      delete progressPathElement.dataset.drawing;
      cssOwnsDashOffset = false;
      renderProgress();
    }

    function restartDeviceFrameDrawIn() {
      const drawnProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));

      if (drawnProgress <= 0) {
        return;
      }

      window.clearTimeout(drawInTimeout);
      cssOwnsDashOffset = true;
      delete progressPathElement.dataset.drawing;
      progressPathElement.style.strokeDashoffset = "1";
      progressPathElement.getBoundingClientRect();

      progressPathElement.dataset.drawing = "true";
      const drawDuration = Number.parseFloat(getComputedStyle(progressPathElement).transitionDuration) * 1000;
      progressPathElement.style.strokeDashoffset = `${1 - drawnProgress}`;

      drawInTimeout = window.setTimeout(endDeviceFrameDrawIn, drawDuration + DRAW_IN_SETTLE_GRACE_MS);
    }

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderProgress);
    }

    function scheduleMeasure() {
      cancelAnimationFrame(measurementFrame);
      measurementFrame = requestAnimationFrame(measure);
    }

    function measure() {
      articleTop = window.scrollY + articleElement.getBoundingClientRect().top;
      readableDistance = Math.max(articleElement.offsetHeight - window.innerHeight, 1);
      const deviceProgress = resolveIPhoneDisplayProgress({
        devicePixelRatio: window.devicePixelRatio,
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        userAgent: window.navigator.userAgent,
        visualViewportHeight: visualViewport?.height ?? window.innerHeight,
        visualViewportOffsetLeft: visualViewport?.offsetLeft ?? 0,
        visualViewportOffsetTop: visualViewport?.offsetTop ?? 0,
        visualViewportScale: visualViewport?.scale ?? 1,
        visualViewportWidth: visualViewport?.width ?? window.innerWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      });

      const wasDeviceFrame = progressRootElement.dataset.deviceFrame === "iphone";

      if (deviceProgress && progressSvgElement) {
        const previousOrientation = progressRootElement.dataset.deviceOrientation;

        progressRootElement.dataset.deviceFrame = "iphone";
        progressRootElement.dataset.deviceOrientation = deviceProgress.orientation;
        progressRootElement.dataset.screenClass = deviceProgress.screenClass;
        progressRootElement.style.setProperty(
          "--blog-reading-progress-device-height",
          `${deviceProgress.pathHeight}px`,
        );
        progressSvgElement.setAttribute("viewBox", `0 0 ${deviceProgress.pathWidth} ${deviceProgress.pathHeight}`);
        progressPathElement.setAttribute("d", deviceProgress.path);

        if (!wasDeviceFrame || previousOrientation !== deviceProgress.orientation) {
          restartDeviceFrameDrawIn();
        }
      } else {
        delete progressRootElement.dataset.deviceFrame;
        delete progressRootElement.dataset.deviceOrientation;
        delete progressRootElement.dataset.screenClass;

        endDeviceFrameDrawIn();
      }

      renderProgress();
    }

    function handleDrawInEnd(event: TransitionEvent) {
      if (event.target === progressPathElement && event.propertyName === "stroke-dashoffset") {
        endDeviceFrameDrawIn();
      }
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(articleElement);
    progressPathElement.addEventListener("transitionend", handleDrawInEnd);
    progressPathElement.addEventListener("transitioncancel", handleDrawInEnd);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("scroll", scheduleMeasure, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurementFrame);
      window.clearTimeout(drawInTimeout);
      resizeObserver.disconnect();
      progressPathElement.removeEventListener("transitionend", handleDrawInEnd);
      progressPathElement.removeEventListener("transitioncancel", handleDrawInEnd);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", scheduleMeasure);
      visualViewport?.removeEventListener("resize", scheduleMeasure);
      visualViewport?.removeEventListener("scroll", scheduleMeasure);
    };
  }, [articleId]);

  return (
    <div ref={progressRootRef} className="blog-reading-progress" aria-hidden="true" hidden>
      <span ref={progressBarRef} />
      <div className="blog-reading-progress-device-shell">
        <svg className="blog-reading-progress-device" focusable="false">
          <title>Reading progress</title>
          <path ref={progressPathRef} pathLength="1" />
        </svg>
      </div>
    </div>
  );
}
