import type { BlogPostSummary } from "@/content/blog/types";
import { type BlogLocale, getBlogIndexPath, getBlogPostPath } from "./blog";
import { siteUrl } from "./metadata";

export function buildBlogRss(locale: BlogLocale, posts: readonly BlogPostSummary[]) {
  const indexUrl = `${siteUrl}${getBlogIndexPath(locale)}`;
  const feedUrl = `${indexUrl}/rss.xml`;
  const visiblePosts = posts.slice(0, 20);
  const latestDate = visiblePosts[0]?.updatedAt ?? visiblePosts[0]?.publishedAt;
  const title = locale === "en" ? "Oleh Vanin's Blog" : "Блог Олега Ваніна";
  const description =
    locale === "en"
      ? "Technical writing about AI systems, product engineering, and developer tools."
      : "Технічні матеріали про AI-системи, продуктову інженерію та інструменти розробника.";
  const items = visiblePosts.map(post => buildItem(locale, post)).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(title)}</title>`,
    `    <link>${indexUrl}</link>`,
    `    <description>${escapeXml(description)}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>`,
    latestDate ? `    <lastBuildDate>${new Date(latestDate).toUTCString()}</lastBuildDate>` : null,
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function buildItem(locale: BlogLocale, post: BlogPostSummary) {
  const url = `${siteUrl}${getBlogPostPath(locale, post.slug)}`;
  const categories = post.tags.map(tag => `      <category>${escapeXml(tag)}</category>`).join("\n");

  return [
    "    <item>",
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${url}</link>`,
    `      <guid isPermaLink="true">${url}</guid>`,
    `      <description>${escapeXml(post.description)}</description>`,
    `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
    categories,
    "    </item>",
  ].join("\n");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
