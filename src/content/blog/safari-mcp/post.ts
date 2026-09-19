import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "safari-mcp",
  tags: ["Safari", "WebKit", "AI"],
  editions: {
    en: {
      title: "I let my AI agent use Safari",
      seoTitle: "Safari 27's native MCP server for AI agents",
      description:
        "I tried Safari's built-in MCP server with Codex. A quick browsing test, the setup, and a few useful changes in Safari 27.",
      publishedAt: "2026-09-19T12:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/safari-mcp/en.mdx",
      socialImage: {
        path: "/images/og/blog/safari-mcp-en.png",
        alt: "I let my AI agent use Safari, by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Я дав AI-агенту доступ до Safari",
      seoTitle: "Вбудований MCP-сервер Safari 27 для AI-агентів",
      description:
        "Спробував вбудований MCP-сервер Safari з Codex. Невеликий тест, налаштування та кілька корисних змін у Safari 27.",
      publishedAt: "2026-09-19T12:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/safari-mcp/uk.mdx",
      socialImage: {
        path: "/images/og/blog/safari-mcp-uk.png",
        alt: "Я дав AI-агенту доступ до Safari, стаття Олега Ваніна",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
