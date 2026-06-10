// AI crawlers are explicitly allowed so the policy is documented, not implied.
const aiCrawlers = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google AI training (separate from Search indexing)
  "Google-Extended",
  // Apple Intelligence
  "Applebot-Extended",
  // Common Crawl
  "CCBot",
  // Meta AI
  "meta-externalagent",
];

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://exsesx.dev",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }, ...aiCrawlers.map(userAgent => ({ userAgent, allow: "/" }))],
  },
};
