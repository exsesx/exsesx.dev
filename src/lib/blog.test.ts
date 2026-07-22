import { describe, expect, test } from "bun:test";
import {
  BLOG_UI,
  getBlogIndexPath,
  getBlogLocaleFromPath,
  getBlogPostPath,
  isBlogLocale,
  resolveBlogBackHref,
} from "./blog";

describe("Blog locale routes", () => {
  test("builds and resolves only the supported localized Blog routes", () => {
    expect(isBlogLocale("en")).toBe(true);
    expect(isBlogLocale("uk")).toBe(true);
    expect(isBlogLocale("ua")).toBe(false);
    expect(getBlogIndexPath("uk")).toBe("/blog/uk");
    expect(getBlogPostPath("en", "codex-agents-v2")).toBe("/blog/en/codex-agents-v2");
    expect(getBlogLocaleFromPath("/blog/uk/codex-agents-v2")).toBe("uk");
    expect(getBlogLocaleFromPath("/projects")).toBeNull();
  });

  test("falls back from an article to its matching locale index", () => {
    expect(resolveBlogBackHref("/blog/en/codex-agents-v2")).toBe("/blog/en");
    expect(resolveBlogBackHref("/blog/uk/codex-agents-v2")).toBe("/blog/uk");
    expect(resolveBlogBackHref("/blog/ua/not-valid")).toBeNull();
  });

  test("localizes icon-only feed controls", () => {
    expect(BLOG_UI.en.rssFeed).toBe("RSS feed");
    expect(BLOG_UI.uk.rssFeed).toBe("RSS-стрічка");
  });
});
