import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "codex-agents-v2",
  tags: ["Codex", "Agents V2", "AI engineering"],
  editions: {
    en: {
      title: "Codex Agents V2 in 0.145.0",
      seoTitle: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
      description:
        "In Codex 0.145.0, enabling multi_agent_v2 forces V2 while model metadata can select it; V2 adds task trees and explicit context forking in one shared workspace.",
      publishedAt: "2026-07-22T12:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-agents-v2/en.mdx",
      socialImage: {
        path: "/images/og/blog/codex-agents-v2-en.png",
        alt: "Codex Agents V2 article by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Codex Agents V2 у версії 0.145.0",
      seoTitle: "Codex Agents V2 у версії 0.145.0: що змінилося та як їх увімкнути",
      description:
        "У Codex 0.145.0 V2 можна примусово вибрати через multi_agent_v2; Codex також може вибрати цей режим за метаданими моделі. V2 має дерево завдань, явне успадкування контексту й спільний робочий простір.",
      publishedAt: "2026-07-22T12:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-agents-v2/uk.mdx",
      socialImage: {
        path: "/images/og/blog/codex-agents-v2-uk.png",
        alt: "Стаття Олега Ваніна про Codex Agents V2",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
