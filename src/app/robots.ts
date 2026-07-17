import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/metadata";

const aiCrawlerUserAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }, ...aiCrawlerUserAgents.map(userAgent => ({ userAgent, allow: "/" }))],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
