import { describe, expect, test } from "bun:test";
import { getBlogPosts } from "@/content/blog/manifest";
import { buildBlogRss } from "./rss";

describe("Blog RSS", () => {
  test("builds an excerpt-only localized feed with escaped XML", () => {
    const posts = getBlogPosts("en", { includeDrafts: false });
    const xml = buildBlogRss("en", [
      {
        ...posts[0],
        description: "Agents V2: stable & opt-in <without hype>.",
      },
    ]);

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<atom:link href="https://exsesx.dev/blog/en/rss.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("https://exsesx.dev/blog/en/codex-agents-v2");
    expect(xml).toContain("Agents V2: stable &amp; opt-in &lt;without hype&gt;.");
    expect(xml).toContain("<category>Codex</category>");
    expect(xml).not.toContain("<SourceLink");
  });
});
