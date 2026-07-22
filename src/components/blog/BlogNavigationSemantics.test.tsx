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

  test("keeps the mobile table of contents as a named navigation landmark", () => {
    const markup = renderToStaticMarkup(
      <ArticleToc headings={[{ depth: 2, id: "intro", text: "Introduction" }]} locale="en" mode="mobile" />,
    );

    expect(markup).toContain('<nav aria-label="On this page"');
    expect(markup).toContain('href="#intro"');
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

  test("surfaces the current section in the compact mobile summary", () => {
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

    expect(markup).toContain('<span class="blog-toc-current">Details</span>');
  });
});
