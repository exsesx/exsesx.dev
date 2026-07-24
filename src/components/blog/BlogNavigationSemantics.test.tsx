import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import ArticleToc from "./ArticleToc";
import BlogLocaleSwitcher from "./BlogLocaleSwitcher";

describe("Blog navigation semantics", () => {
  test("localizes the language switcher landmark", () => {
    const markup = renderToStaticMarkup(<BlogLocaleSwitcher currentLocale="uk" />);

    expect(markup).toContain('aria-label="Мова блогу"');
    expect(markup).toContain(">EN</a>");
    expect(markup).toContain(">UA</a>");
    expect(markup).not.toContain("УКР");
    expect(markup).toContain('href="/blog/uk"');
  });

  test("exposes the mobile table of contents as a compact dialog trigger", () => {
    const markup = renderToStaticMarkup(
      <ArticleToc headings={[{ depth: 2, id: "intro", text: "Introduction" }]} locale="en" mode="mobile" />,
    );

    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-label="Open table of contents"');
    expect(markup).toContain('data-testid="mobile-toc-trigger"');
    expect(markup).toContain('class="blog-toc-mobile-face glass-frost"');
    expect(markup).toContain('<span class="blog-toc-mobile-label">On this page</span>');
  });

  test("marks only the current article section as the present location", () => {
    const markup = renderToStaticMarkup(
      <ArticleToc
        activeHeadingId="details"
        headings={[
          { depth: 2, id: "intro", text: "Introduction" },
          { depth: 3, id: "details", text: "Details" },
        ]}
        locale="en"
        mode="desktop"
      />,
    );

    expect(markup).toContain('href="#details" aria-current="location"');
    expect(markup).not.toContain('href="#intro" aria-current="location"');
    expect(markup).toContain('<span aria-hidden="true" class="blog-toc-tick"></span>');
    expect(markup).toContain('<span class="blog-toc-label">Details</span>');
  });

  test("keeps current-section context inside the mobile drawer", () => {
    const markup = renderToStaticMarkup(
      <ArticleToc
        activeHeadingId="details"
        headings={[
          { depth: 2, id: "intro", text: "Introduction" },
          { depth: 3, id: "details", text: "Details" },
        ]}
        locale="en"
        mode="mobile"
      />,
    );

    expect(markup).not.toContain("blog-toc-current");
    expect(markup).toContain('aria-label="Open table of contents"');
  });
});
