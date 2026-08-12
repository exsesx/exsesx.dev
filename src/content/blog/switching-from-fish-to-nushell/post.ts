import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "switching-from-fish-to-nushell",
  tags: ["Nushell", "Fish", "Developer tools"],
  editions: {
    en: {
      title: "Why I replaced Fish with Nushell",
      seoTitle: "Why I replaced Fish with Nushell for structured data",
      description:
        "I replaced Fish with Nushell as my daily shell for structured data and typed pipelines. I kept jq, yq, rg, and fd for focused tasks.",
      publishedAt: "2026-08-11T17:13:21+02:00",
      status: "published",
      sourcePath: "src/content/blog/switching-from-fish-to-nushell/en.mdx",
      socialImage: {
        path: "/images/og/blog/switching-from-fish-to-nushell-en.png",
        alt: "Article by Oleh Vanin about replacing Fish with Nushell",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Чому я замінив Fish на Nushell",
      seoTitle: "Чому я замінив Fish на Nushell заради структурованих даних",
      description:
        "Я замінив Fish на Nushell як щоденну оболонку заради структурованих даних і типізованих конвеєрів. Для окремих завдань залишив jq, yq, rg і fd.",
      publishedAt: "2026-08-11T17:13:21+02:00",
      status: "published",
      sourcePath: "src/content/blog/switching-from-fish-to-nushell/uk.mdx",
      socialImage: {
        path: "/images/og/blog/switching-from-fish-to-nushell-uk.png",
        alt: "Стаття Олега Ваніна про заміну Fish на Nushell",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
