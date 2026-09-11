import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "codex-usage-trackers",
  tags: ["Codex", "macOS", "Apps"],
  editions: {
    en: {
      title: "I found a Codex usage tracker I like",
      seoTitle: "Finding a Codex usage tracker: OpenUsage, CodeNotch, CodexBar",
      description:
        "I tried OpenUsage, CodeNotch, and CodexBar to find a Codex usage tracker that feels right on my Mac.",
      publishedAt: "2026-09-11T18:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-usage-trackers/en.mdx",
      socialImage: {
        path: "/images/og/blog/codex-usage-trackers-en.png",
        alt: "I found a Codex usage tracker I like, by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Знайшов зручний трекер лімітів Codex",
      seoTitle: "Шукаю трекер лімітів Codex: OpenUsage, CodeNotch і CodexBar",
      description:
        "Спробував OpenUsage, CodeNotch і CodexBar, щоб знайти зручну програму для перегляду лімітів Codex на моєму Mac.",
      publishedAt: "2026-09-11T18:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-usage-trackers/uk.mdx",
      socialImage: {
        path: "/images/og/blog/codex-usage-trackers-uk.png",
        alt: "Знайшов зручний трекер лімітів Codex, стаття Олега Ваніна",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
