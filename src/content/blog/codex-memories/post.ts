import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "codex-memories",
  tags: ["Codex", "Memory", "AI engineering"],
  editions: {
    en: {
      title: "How I use Codex Memories between coding sessions",
      seoTitle: "How I use Codex Memories in 0.145.0: config, tools, and workflow",
      description:
        "My Codex Memories config, what each setting changes, and how memory fits into a source-checked coding workflow.",
      publishedAt: "2026-07-23T10:30:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-memories/en.mdx",
      socialImage: {
        path: "/images/og/blog/codex-memories-en.png",
        alt: "Codex Memories workflow article by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Як я використовую Codex Memories у роботі",
      seoTitle: "Як я використовую Codex Memories у версії 0.145.0: конфігурація, інструменти та робочий процес",
      description:
        "Моя конфігурація Codex Memories, призначення кожного параметра й місце пам’яті в роботі з перевіркою джерел.",
      publishedAt: "2026-07-23T10:30:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-memories/uk.mdx",
      socialImage: {
        path: "/images/og/blog/codex-memories-uk.png",
        alt: "Стаття Олега Ваніна про роботу з Codex Memories",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
