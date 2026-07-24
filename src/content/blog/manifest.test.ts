import { describe, expect, test } from "bun:test";
import { getBlogPost, getBlogPostSummaries, getBlogPosts, getPublishedBlogLocales } from "./manifest";

describe("Blog manifest", () => {
  test("publishes the English and Ukrainian article editions newest first", () => {
    expect(getBlogPosts("en", { includeDrafts: false })).toEqual([
      expect.objectContaining({
        locale: "en",
        slug: "umbra-light-dark-wallpapers",
        status: "published",
        title: "Two wallpapers brought me back to Light Mode",
        seoTitle: "Umbra: separate wallpapers for macOS Light and Dark Mode",
        description:
          "Why I chose Umbra over a Raycast workaround to keep one wallpaper for Light Mode and another for Dark Mode.",
      }),
      expect.objectContaining({
        locale: "en",
        slug: "codex-memories",
        status: "published",
        title: "How I use Codex Memories between coding sessions",
        seoTitle: "How I use Codex Memories in 0.145.0: config, tools, and workflow",
        description:
          "My Codex Memories config, what each setting changes, and how memory fits into a source-checked coding workflow.",
      }),
      expect.objectContaining({
        locale: "en",
        slug: "codex-agents-v2",
        status: "published",
        title: "Codex Agents V2 in 0.145.0",
        seoTitle: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
        description: "What changed from V1, how to enable it, and the configuration details worth knowing.",
      }),
    ]);
    expect(getBlogPosts("uk", { includeDrafts: false })).toEqual([
      expect.objectContaining({
        locale: "uk",
        slug: "umbra-light-dark-wallpapers",
        status: "published",
        title: "Дві шпалери, які повернули мене до світлої теми",
        seoTitle: "Umbra: окремі шпалери для світлої й темної теми macOS",
        description:
          "Чому я вибрав Umbra замість обхідної схеми з Raycast, щоб мати окремі шпалери для світлої й темної теми.",
      }),
      expect.objectContaining({
        locale: "uk",
        slug: "codex-memories",
        status: "published",
        title: "Як я використовую Codex Memories у роботі",
        seoTitle: "Як я використовую Codex Memories у версії 0.145.0: конфігурація, інструменти та робочий процес",
        description:
          "Моя конфігурація Codex Memories, призначення кожного параметра й місце пам’яті в роботі з перевіркою джерел.",
      }),
      expect.objectContaining({
        locale: "uk",
        slug: "codex-agents-v2",
        status: "published",
        title: "Codex Agents V2 у версії 0.145.0",
        seoTitle: "Codex Agents V2 у версії 0.145.0: що змінилося та як їх увімкнути",
        description: "Що змінилося порівняно з V1, як увімкнути V2 і які деталі конфігурації варто знати.",
      }),
    ]);
  });

  test("derives index reading details and the article table of contents from MDX", async () => {
    const [article] = await getBlogPostSummaries("en", { includeDrafts: false });

    expect(article.readingMinutes).toBeGreaterThanOrEqual(3);
    expect(article.headings).toContainEqual({ depth: 2, id: "the-pair-i-wanted", text: "The pair I wanted" });
    expect(article.headings.at(-1)).toEqual({ depth: 2, id: "sources", text: "Sources" });
  });

  test("keeps the Memories diagram free of WebKit-unstable Mermaid edge labels", async () => {
    const [english, ukrainian] = await Promise.all([
      Bun.file(new URL("./codex-memories/en.mdx", import.meta.url)).text(),
      Bun.file(new URL("./codex-memories/uk.mdx", import.meta.url)).text(),
    ]);

    expect(english).toContain('gate --> pipeline["Phase 1: extract tasks');
    expect(english).toContain('gate --> skip["Skip this pass"]');
    expect(english).not.toMatch(/gate -->\|(?:Yes|No)\|/);
    expect(ukrainian).toContain('gate --> pipeline["Фаза 1: виділити пам’ять');
    expect(ukrainian).toContain('gate --> skip["Пропустити запуск"]');
    expect(ukrainian).not.toMatch(/gate -->\|(?:Так|Ні)\|/);
  });

  test("looks up both editions and exposes their published translation alternates", () => {
    expect(getBlogPost("en", "umbra-light-dark-wallpapers", { includeDrafts: false })).toMatchObject({
      locale: "en",
      slug: "umbra-light-dark-wallpapers",
      status: "published",
    });
    expect(getBlogPost("uk", "umbra-light-dark-wallpapers", { includeDrafts: false })).toMatchObject({
      locale: "uk",
      slug: "umbra-light-dark-wallpapers",
      status: "published",
    });
    expect(getPublishedBlogLocales("umbra-light-dark-wallpapers")).toEqual(["en", "uk"]);
    expect(getBlogPost("en", "codex-memories", { includeDrafts: false })).toMatchObject({
      locale: "en",
      slug: "codex-memories",
      status: "published",
    });
    expect(getBlogPost("uk", "codex-memories", { includeDrafts: false })).toMatchObject({
      locale: "uk",
      slug: "codex-memories",
      status: "published",
    });
    expect(getPublishedBlogLocales("codex-memories")).toEqual(["en", "uk"]);
    expect(getBlogPost("en", "codex-agents-v2", { includeDrafts: false })).toMatchObject({
      locale: "en",
      slug: "codex-agents-v2",
      status: "published",
    });
    expect(getBlogPost("uk", "codex-agents-v2", { includeDrafts: false })).toMatchObject({
      locale: "uk",
      slug: "codex-agents-v2",
      status: "published",
    });
    expect(getPublishedBlogLocales("codex-agents-v2")).toEqual(["en", "uk"]);
  });

  test("ships deterministic social images for the Blog index and every published edition", async () => {
    const articles = [
      getBlogPost("en", "umbra-light-dark-wallpapers", { includeDrafts: false }),
      getBlogPost("uk", "umbra-light-dark-wallpapers", { includeDrafts: false }),
      getBlogPost("en", "codex-memories", { includeDrafts: false }),
      getBlogPost("uk", "codex-memories", { includeDrafts: false }),
      getBlogPost("en", "codex-agents-v2", { includeDrafts: false }),
      getBlogPost("uk", "codex-agents-v2", { includeDrafts: false }),
    ];

    if (articles.some(article => !article)) {
      throw new Error("Expected all published article fixtures");
    }

    expect(await Bun.file(new URL("../../../public/images/og/blog.png", import.meta.url)).exists()).toBe(true);

    for (const article of articles) {
      expect(await Bun.file(new URL(`../../../public${article?.socialImage.path}`, import.meta.url)).exists()).toBe(
        true,
      );
    }
  });
});
