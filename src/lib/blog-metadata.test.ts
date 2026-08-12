import { describe, expect, test } from "bun:test";
import { getBlogPost } from "@/content/blog/manifest";
import { createBlogArticleMetadata, createBlogIndexMetadata, createPageMetadata, rootMetadata } from "./metadata";

describe("Blog metadata", () => {
  test("formats document titles with the site name first without changing Blog social titles", () => {
    expect(rootMetadata.title).toEqual({
      default: "Oleh Vanin - Senior Full Stack Engineer / AI Engineer",
      template: "Oleh Vanin - %s",
    });

    const page = createPageMetadata({ title: "Projects", description: "Projects" });
    const blog = createBlogIndexMetadata("en", true);

    expect(page.title).toEqual({ absolute: "Oleh Vanin - Projects" });
    expect(page.openGraph).toMatchObject({ title: "Oleh Vanin - Projects" });
    expect(page.twitter).toMatchObject({ title: "Oleh Vanin - Projects" });
    expect(blog.title).toEqual({ absolute: "Oleh Vanin - Blog" });
    expect(blog.openGraph).toMatchObject({ title: "Blog" });
    expect(blog.twitter).toMatchObject({ title: "Blog" });
  });

  test("describes a published article with canonical, feed, and real-language alternates", () => {
    const article = getBlogPost("en", "codex-agents-v2", { includeDrafts: false });

    if (!article) {
      throw new Error("Expected the published English article fixture");
    }

    const metadata = createBlogArticleMetadata(article, ["en"]);

    expect(metadata.title).toEqual({
      absolute: "Oleh Vanin - Codex Agents V2 in 0.145.0: what changed and how to enable it",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
    });
    expect(metadata.twitter).toMatchObject({
      title: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
    });
    expect(metadata.alternates).toEqual({
      canonical: "https://exsesx.dev/blog/en/codex-agents-v2",
      languages: {
        en: "https://exsesx.dev/blog/en/codex-agents-v2",
        "x-default": "https://exsesx.dev/blog/en/codex-agents-v2",
      },
      types: {
        "application/rss+xml": "https://exsesx.dev/blog/en/rss.xml",
      },
    });
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      locale: "en_US",
      publishedTime: "2026-07-22T12:00:00+02:00",
      tags: ["Codex", "Agents V2", "AI engineering"],
      url: "https://exsesx.dev/blog/en/codex-agents-v2",
    });
  });

  test("keeps the empty Ukrainian index followable but out of search results", () => {
    const metadata = createBlogIndexMetadata("uk", false);

    expect(metadata.alternates?.canonical).toBe("https://exsesx.dev/blog/uk");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.types).toBeUndefined();
  });
});
