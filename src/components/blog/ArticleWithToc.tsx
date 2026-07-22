"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { ArticleHeading } from "@/content/blog/reading";
import type { BlogLocale } from "@/lib/blog";
import { resolveActiveHeadingId } from "@/lib/blog-scroll-spy";
import ArticleToc from "./ArticleToc";

const ACTIVE_HEADING_OFFSET = 144;

type ArticleWithTocProps = {
  children: ReactNode;
  headings: readonly ArticleHeading[];
  locale: BlogLocale;
};

export function ArticleWithToc({ children, headings, locale }: ArticleWithTocProps) {
  const activeHeadingId = useActiveHeadingId(headings);

  return (
    <>
      <div className="blog-toc-mobile-shell mx-auto mt-8 max-w-4xl xl:hidden">
        <ArticleToc activeHeadingId={activeHeadingId} headings={headings} locale={locale} mode="mobile" />
      </div>

      <div className="blog-article-grid mx-auto mt-10">
        <aside className="hidden xl:block">
          <ArticleToc activeHeadingId={activeHeadingId} headings={headings} locale={locale} mode="desktop" />
        </aside>
        <article id="article-content" className="blog-prose min-w-0">
          {children}
        </article>
      </div>
    </>
  );
}

function useActiveHeadingId(headings: readonly ArticleHeading[]) {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useEffect(() => {
    const headingElements = headings.flatMap(heading => {
      const element = document.getElementById(heading.id);

      return element ? [{ element, id: heading.id }] : [];
    });

    if (headingElements.length === 0) {
      return;
    }

    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const positions = headingElements.map(({ element, id }) => ({
          id,
          top: element.getBoundingClientRect().top,
        }));
        const isAtDocumentEnd =
          Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;
        const nextHeadingId = resolveActiveHeadingId(positions, ACTIVE_HEADING_OFFSET, isAtDocumentEnd);

        setActiveHeadingId(currentHeadingId => (currentHeadingId === nextHeadingId ? currentHeadingId : nextHeadingId));
      });
    }

    const article = document.getElementById("article-content");
    const resizeObserver = new ResizeObserver(update);

    if (article) {
      resizeObserver.observe(article);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [headings]);

  return activeHeadingId;
}
