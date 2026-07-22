import type { ArticleHeading } from "@/content/blog/reading";
import { BLOG_UI, type BlogLocale } from "@/lib/blog";

type ArticleTocProps = {
  activeHeadingId?: string | null;
  headings: readonly ArticleHeading[];
  locale: BlogLocale;
  mode: "desktop" | "mobile";
};

export default function ArticleToc({ activeHeadingId, headings, locale, mode }: ArticleTocProps) {
  const activeHeading = headings.find(heading => heading.id === activeHeadingId);
  const list = (
    <ol className="blog-toc-list">
      {headings.map(heading => (
        <li key={heading.id} data-depth={heading.depth}>
          <a href={`#${heading.id}`} aria-current={heading.id === activeHeadingId ? "location" : undefined}>
            <span aria-hidden="true" className="blog-toc-tick" />
            <span className="blog-toc-label">{heading.text}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (mode === "mobile") {
    return (
      <details className="blog-toc-mobile">
        <summary>
          <span>{BLOG_UI[locale].onThisPage}</span>
          {activeHeading ? <span className="blog-toc-current">{activeHeading.text}</span> : null}
        </summary>
        <nav aria-label={BLOG_UI[locale].onThisPage}>{list}</nav>
      </details>
    );
  }

  return (
    <nav className="blog-toc-desktop" aria-label={BLOG_UI[locale].onThisPage}>
      <p>{BLOG_UI[locale].onThisPage}</p>
      {list}
    </nav>
  );
}
