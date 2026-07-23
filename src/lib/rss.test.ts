import { describe, expect, test } from "bun:test";
import { getBlogPosts } from "@/content/blog/manifest";
import { buildBlogRss } from "./rss";

describe("Blog RSS", () => {
  test("builds an excerpt-only localized feed with escaped XML", () => {
    const posts = getBlogPosts("en", { includeDrafts: false });
    const xml = buildBlogRss("en", [
      {
        ...posts[0],
        description: "Memories: local & inspectable <without another server>.",
      },
    ]);

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<atom:link href="https://exsesx.dev/blog/en/rss.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain("<language>en</language>");
    expect(xml).toContain("https://exsesx.dev/blog/en/codex-memories");
    expect(xml).toContain("Memories: local &amp; inspectable &lt;without another server&gt;.");
    expect(xml).toContain("<category>Codex</category>");
    expect(xml).not.toContain("<SourceLink");
  });
});
