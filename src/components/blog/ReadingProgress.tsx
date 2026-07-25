"use client";

import { useLayoutEffect, useRef } from "react";
import { resolveIPhoneDisplayProgress } from "../../lib/iphone-display-progress";

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
    let articleTop = 0;
    let readableDistance = 1;

    function renderProgress() {
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));

      progressBarElement.style.transform = `scaleX(${nextProgress})`;
      progressPathElement.style.strokeDashoffset = `${1 - nextProgress}`;
      progressRootElement.hidden = nextProgress <= 0;
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

      if (deviceProgress && progressSvgElement) {
        progressRootElement.dataset.deviceFrame = "iphone";
        progressRootElement.dataset.deviceOrientation = deviceProgress.orientation;
        progressRootElement.dataset.screenClass = deviceProgress.screenClass;
        progressRootElement.style.setProperty("--blog-reading-progress-height", `${deviceProgress.pathHeight}px`);
        progressSvgElement.setAttribute("viewBox", `0 0 ${deviceProgress.pathWidth} ${deviceProgress.pathHeight}`);
        progressPathElement.setAttribute("d", deviceProgress.path);
      } else {
        delete progressRootElement.dataset.deviceFrame;
        delete progressRootElement.dataset.deviceOrientation;
        delete progressRootElement.dataset.screenClass;
        progressRootElement.style.removeProperty("--blog-reading-progress-height");
        progressSvgElement?.removeAttribute("viewBox");
        progressPathElement.removeAttribute("d");
      }

      renderProgress();
    }

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(articleElement);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("resize", scheduleMeasure);
    visualViewport?.addEventListener("scroll", scheduleMeasure, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measurementFrame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", scheduleMeasure);
      visualViewport?.removeEventListener("resize", scheduleMeasure);
      visualViewport?.removeEventListener("scroll", scheduleMeasure);
    };
  }, [articleId]);

  return (
    <div ref={progressRootRef} className="blog-reading-progress" aria-hidden="true" hidden>
      <span ref={progressBarRef} />
      <svg className="blog-reading-progress-device" focusable="false">
        <title>Reading progress</title>
        <path ref={progressPathRef} pathLength="1" />
      </svg>
    </div>
  );
}
