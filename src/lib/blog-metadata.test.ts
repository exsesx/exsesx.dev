import { describe, expect, test } from "bun:test";
import { getBlogPost } from "@/content/blog/manifest";
import { createBlogArticleMetadata, createBlogIndexMetadata } from "./metadata";

describe("Blog metadata", () => {
  test("describes a published article with canonical, feed, and real-language alternates", () => {
    const article = getBlogPost("en", "codex-agents-v2", { includeDrafts: false });

    if (!article) {
      throw new Error("Expected the published English article fixture");
    }

    const metadata = createBlogArticleMetadata(article, ["en"]);

    expect(metadata.title).toBe("Codex Agents V2 in 0.145.0: what changed and how to enable it");
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
