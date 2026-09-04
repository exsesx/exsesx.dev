import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getBlogPost } from "@/content/blog/manifest";
import { createBlogArticleMetadata } from "@/lib/metadata";
import { buildBlogRss } from "@/lib/rss";
import { buildBlogPostingStructuredData } from "@/lib/structured-data";
import BlogTitle from "./BlogTitle";

describe("BlogTitle", () => {
  test("keeps plain titles unchanged", () => {
    expect(renderToStaticMarkup(<BlogTitle title="Why I replaced Fish with Nushell" />)).toBe(
      "Why I replaced Fish with Nushell",
    );
  });

  test("formats cn without matching the end of shadcn or losing whitespace", () => {
    const markup = renderToStaticMarkup(<BlogTitle title="I tried shadcn's new cn on my site" codeWords={["cn"]} />);
    expect(markup).toContain("I tried shadcn&#x27;s new <code ");
    expect(markup).toContain(">cn</code> on my site");
    expect(markup).toContain('class="font-mono text-[0.88em]"');
    expect(markup.match(/<code /g)).toHaveLength(1);
    expect(markup).not.toContain("`");
  });

  test("preserves Ukrainian text and escapes markup", () => {
    const markup = renderToStaticMarkup(<BlogTitle title="Новий cn від shadcn <script>" codeWords={["cn"]} />);
    expect(markup).toContain("Новий <code ");
    expect(markup).toContain(">cn</code> від shadcn &lt;script&gt;");
  });

  test("keeps code formatting out of SEO, social metadata, structured data and RSS", () => {
    for (const locale of ["en", "uk"] as const) {
      const article = getBlogPost(locale, "shadcn-cn-benchmarks", { includeDrafts: false });
      if (!article) throw new Error("Expected the published benchmark article");
      const metadata = createBlogArticleMetadata(article, ["en", "uk"]);
      expect(metadata.openGraph?.title).toBe(article.seoTitle);
      const machineText = JSON.stringify([
        metadata,
        buildBlogPostingStructuredData(article),
        buildBlogRss(locale, [article]),
      ]);
      expect(machineText).not.toContain("`");
      expect(machineText).not.toContain("<code");
    }
  });
});
