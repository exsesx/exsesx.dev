"use client";

import { useLayoutEffect, useRef } from "react";
import { resolveIPhoneDisplayProgress } from "../../lib/iphone-display-progress";

const DRAW_IN_DURATION_MS = 450;
const DRAW_IN_REVEAL_MS = 90;
const DRAW_OUT_DURATION_MS = 280;

function easeOutDraw(progress: number) {
  return 1 - (1 - progress) ** 3;
}

function easeInOutDraw(progress: number) {
  return progress * progress * (3 - 2 * progress);
}

type DeviceFrameAnimation = "drawing-in" | "drawing-out" | "idle";

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
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let measurementFrame = 0;
    let deviceFrameAnimationFrame = 0;
    let articleTop = 0;
    let readableDistance = 1;
    let deviceFrameAnimation: DeviceFrameAnimation = "idle";

    function readProgress() {
      return Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));
    }

    function renderProgress() {
      const nextProgress = readProgress();

      progressBarElement.style.transform = `scaleX(${nextProgress})`;

      if (deviceFrameAnimation === "idle") {
        progressPathElement.style.strokeDashoffset = `${1 - nextProgress}`;
      }

      progressRootElement.hidden = nextProgress <= 0;
    }

    function endDeviceFrameAnimation(syncProgress = true) {
      cancelAnimationFrame(deviceFrameAnimationFrame);
      deviceFrameAnimationFrame = 0;
      delete progressPathElement.dataset.drawing;

      if (deviceFrameAnimation === "idle") {
        return;
      }

      deviceFrameAnimation = "idle";

      if (syncProgress) {
        renderProgress();
      }
    }

    function restartDeviceFrameDrawIn() {
      if (readProgress() <= 0 || prefersReducedMotion.matches) {
        endDeviceFrameAnimation();
        return;
      }

      cancelAnimationFrame(deviceFrameAnimationFrame);
      deviceFrameAnimation = "drawing-in";
      progressPathElement.dataset.drawing = "in";
      progressPathElement.style.strokeDashoffset = "1";

      const startedAt = performance.now();

      const advanceDraw = () => {
        const elapsed = performance.now() - startedAt - DRAW_IN_REVEAL_MS;
        const eased = easeOutDraw(Math.min(1, Math.max(0, elapsed) / DRAW_IN_DURATION_MS));

        progressPathElement.style.strokeDashoffset = `${1 - readProgress() * eased}`;

        if (eased < 1) {
          deviceFrameAnimationFrame = requestAnimationFrame(advanceDraw);
          return;
        }

        endDeviceFrameAnimation();
      };

      deviceFrameAnimationFrame = requestAnimationFrame(advanceDraw);
    }

    function restartDeviceFrameDrawOut() {
      if (readProgress() <= 0 || prefersReducedMotion.matches) {
        endDeviceFrameAnimation();
        return;
      }

      const startOffset = Math.min(
        1,
        Math.max(0, Number.parseFloat(progressPathElement.style.strokeDashoffset || "1")),
      );

      if (startOffset >= 1) {
        endDeviceFrameAnimation(false);
        return;
      }

      cancelAnimationFrame(deviceFrameAnimationFrame);
      deviceFrameAnimation = "drawing-out";
      progressPathElement.dataset.drawing = "out";

      const startedAt = performance.now();

      const retractDraw = () => {
        const elapsed = performance.now() - startedAt;
        const eased = easeInOutDraw(Math.min(1, elapsed / DRAW_OUT_DURATION_MS));

        progressPathElement.style.strokeDashoffset = `${startOffset + (1 - startOffset) * eased}`;

        if (eased < 1) {
          deviceFrameAnimationFrame = requestAnimationFrame(retractDraw);
          return;
        }

        progressPathElement.style.strokeDashoffset = "1";
        endDeviceFrameAnimation(false);
      };

      deviceFrameAnimationFrame = requestAnimationFrame(retractDraw);
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

        if (wasDeviceFrame) {
          restartDeviceFrameDrawOut();
        } else if (deviceFrameAnimation !== "drawing-out") {
          endDeviceFrameAnimation();
        }
      }

      renderProgress();
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(articleElement);
    const handleReducedMotionChange = () => {
      if (prefersReducedMotion.matches) {
        endDeviceFrameAnimation();
      }
    };

    prefersReducedMotion.addEventListener("change", handleReducedMotionChange);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("scroll", scheduleMeasure, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurementFrame);
      cancelAnimationFrame(deviceFrameAnimationFrame);
      resizeObserver.disconnect();
      prefersReducedMotion.removeEventListener("change", handleReducedMotionChange);
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
