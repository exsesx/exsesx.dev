"use client";

import { useLayoutEffect, useRef } from "react";

type ReadingProgressProps = {
  articleId: string;
};

export default function ReadingProgress({ articleId }: ReadingProgressProps) {
  const progressRootRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const article = document.getElementById(articleId);
    const progressRoot = progressRootRef.current;
    const progressBar = progressBarRef.current;

    if (!article || !progressRoot || !progressBar) {
      return;
    }

    const articleElement = article;
    const progressRootElement = progressRoot;
    const progressBarElement = progressBar;
    let frame = 0;
    let articleTop = 0;
    let readableDistance = 1;

    function renderProgress() {
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));

      progressBarElement.style.transform = `scaleX(${nextProgress})`;
      progressRootElement.hidden = nextProgress <= 0;
    }

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderProgress);
    }

    function measure() {
      articleTop = window.scrollY + articleElement.getBoundingClientRect().top;
      readableDistance = Math.max(articleElement.offsetHeight - window.innerHeight, 1);
      renderProgress();
    }

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(articleElement);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
    };
  }, [articleId]);

  return (
    <div ref={progressRootRef} className="blog-reading-progress" aria-hidden="true" hidden>
      <span ref={progressBarRef} />
    </div>
  );
}
