import { describe, expect, test } from "bun:test";
import { BLOG_LOCALES } from "@/lib/blog";
import { getAllBlogPosts, getBlogPost, getBlogPostSummaries, getPublishedBlogLocales } from "./manifest";

const PUBLISHED_SLUGS = [
  "safari-26-invisible-tint-sampler",
  "umbra-light-dark-wallpapers",
  "codex-memories",
  "codex-agents-v2",
] as const;
const publishedPosts = getAllBlogPosts({ includeDrafts: false });

describe("Blog manifest", () => {
  test.each([...BLOG_LOCALES])("publishes the %s editions newest first", locale => {
    expect(publishedPosts.filter(post => post.locale === locale).map(post => post.slug)).toEqual([...PUBLISHED_SLUGS]);
  });

  test("derives index reading details and the article table of contents from MDX", async () => {
    const [article] = await getBlogPostSummaries("en", { includeDrafts: false });

    expect(article.readingMinutes).toBeGreaterThanOrEqual(5);
    expect(article.headings).toContainEqual({
      depth: 2,
      id: "safari-sampled-the-viewport-edge",
      text: "Safari sampled the viewport edge",
    });
    expect(article.headings.at(-1)).toEqual({ depth: 2, id: "sources", text: "Sources" });
  });

  test("keeps the Memories diagram free of WebKit-unstable Mermaid edge labels", async () => {
    const [english, ukrainian] = await Promise.all([
      Bun.file(new URL("./codex-memories/en.mdx", import.meta.url)).text(),
      Bun.file(new URL("./codex-memories/uk.mdx", import.meta.url)).text(),
    ]);

    expect(english).toContain('gate --> pipeline["Phase 1: extract task memories');
    expect(english).toContain('gate --> skip["Skip this pass"]');
    expect(english).not.toMatch(/gate -->\|(?:Yes|No)\|/);
    expect(ukrainian).toContain('gate --> pipeline["Фаза 1: сформувати записи пам’яті');
    expect(ukrainian).toContain('gate --> skip["Пропустити запуск"]');
    expect(ukrainian).not.toMatch(/gate -->\|(?:Так|Ні)\|/);
  });

  test.each(publishedPosts.map(({ locale, slug }) => [locale, slug] as const))(
    "looks up the published %s/%s edition",
    (locale, slug) => {
      expect(getBlogPost(locale, slug, { includeDrafts: false })).toMatchObject({
        locale,
        slug,
        status: "published",
      });
    },
  );

  test.each([...PUBLISHED_SLUGS])("exposes both published translations for %s", slug => {
    expect(getPublishedBlogLocales(slug)).toEqual([...BLOG_LOCALES]);
  });

  test.each(publishedPosts.map(({ locale, slug }) => [locale, slug] as const))(
    "provides accessible social-image text for %s/%s",
    (locale, slug) => {
      expect(getBlogPost(locale, slug, { includeDrafts: false })?.socialImage.alt.trim()).not.toBe("");
    },
  );
});
