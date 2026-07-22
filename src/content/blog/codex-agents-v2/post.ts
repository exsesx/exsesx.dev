import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "codex-agents-v2",
  tags: ["Codex", "Agents V2", "AI engineering"],
  editions: {
    en: {
      title: "Codex Agents V2 in 0.145.0",
      seoTitle: "Codex Agents V2 in 0.145.0: what changed and how to enable it",
      description: "What changed from V1, how to enable it, and the configuration details worth knowing.",
      publishedAt: "2026-07-22T12:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/codex-agents-v2/en.mdx",
      socialImage: {
        path: "/images/og/blog/codex-agents-v2-en.png",
        alt: "Codex Agents V2 article by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
  },
});
