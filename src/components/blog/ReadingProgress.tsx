"use client";

import { useEffect, useRef } from "react";

type ReadingProgressProps = {
  articleId: string;
};

export default function ReadingProgress({ articleId }: ReadingProgressProps) {
  const progressBarRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const article = document.getElementById(articleId);
    const progressBar = progressBarRef.current;

    if (!article || !progressBar) {
      return;
    }

    const articleElement = article;
    const progressBarElement = progressBar;
    let frame = 0;
    let articleTop = 0;
    let readableDistance = 1;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / readableDistance));

        progressBarElement.style.transform = `scaleX(${nextProgress})`;
      });
    }

    function measure() {
      articleTop = window.scrollY + articleElement.getBoundingClientRect().top;
      readableDistance = Math.max(articleElement.offsetHeight - window.innerHeight, 1);
      update();
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
    <div className="blog-reading-progress" aria-hidden="true">
      <span ref={progressBarRef} />
    </div>
  );
}
