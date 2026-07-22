import { describe, expect, test } from "bun:test";
import { getBlogPost, getBlogPostSummaries, getBlogPosts, getPublishedBlogLocales } from "./manifest";

describe("Blog manifest", () => {
  test("publishes the first English article without inventing a Ukrainian edition", () => {
    expect(getBlogPosts("en", { includeDrafts: false })).toEqual([
      expect.objectContaining({
        locale: "en",
        slug: "codex-agents-v2",
        status: "published",
        title: "Codex Agents V2 in 0.145.0",
        seoTitle: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
        description: "What changed from V1, how to enable it, and the configuration details worth knowing.",
      }),
    ]);
    expect(getBlogPosts("uk", { includeDrafts: false })).toEqual([]);
  });

  test("derives index reading details and the article table of contents from MDX", async () => {
    const [article] = await getBlogPostSummaries("en", { includeDrafts: false });

    expect(article.readingMinutes).toBeGreaterThanOrEqual(5);
    expect(article.headings).toContainEqual({ depth: 2, id: "the-short-version", text: "The short version" });
    expect(article.headings.at(-1)).toEqual({ depth: 2, id: "sources", text: "Sources" });
  });

  test("looks up only real editions and exposes only published translation alternates", () => {
    expect(getBlogPost("en", "codex-agents-v2", { includeDrafts: false })).toMatchObject({
      locale: "en",
      slug: "codex-agents-v2",
      status: "published",
    });
    expect(getBlogPost("uk", "codex-agents-v2", { includeDrafts: false })).toBeNull();
    expect(getPublishedBlogLocales("codex-agents-v2")).toEqual(["en"]);
  });

  test("ships deterministic social images for the Blog index and every published edition", async () => {
    const article = getBlogPost("en", "codex-agents-v2", { includeDrafts: false });

    if (!article) {
      throw new Error("Expected the published English article fixture");
    }

    expect(await Bun.file(new URL("../../../public/images/og/blog.png", import.meta.url)).exists()).toBe(true);
    expect(await Bun.file(new URL(`../../../public${article.socialImage.path}`, import.meta.url)).exists()).toBe(true);
  });
});
