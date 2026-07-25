import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "safari-26-invisible-tint-sampler",
  tags: ["Safari", "WebKit", "CSS"],
  editions: {
    en: {
      title: "The invisible 11px element that fixed Safari 26 tinting",
      seoTitle: "Safari 26 toolbar tinting with an invisible 11px WebKit sampler",
      description:
        "How I traced Safari 26 toolbar tinting through WebKit and hid a reliable theme-aware sampler with background-clip: text.",
      publishedAt: "2026-07-25T21:21:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/safari-26-invisible-tint-sampler/en.mdx",
      socialImage: {
        path: "/images/og/blog/safari-26-invisible-tint-sampler-en.png",
        alt: "Safari 26 toolbar tinting article by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Невидимий 11-піксельний семплер для Safari 26",
      seoTitle: "Тонування панелей Safari 26 через невидимий 11-піксельний семплер WebKit",
      description:
        "Як я розібрав механізм тонування панелей Safari 26 у коді WebKit і сховав надійний семплер теми через background-clip: text.",
      publishedAt: "2026-07-25T21:21:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/safari-26-invisible-tint-sampler/uk.mdx",
      socialImage: {
        path: "/images/og/blog/safari-26-invisible-tint-sampler-uk.png",
        alt: "Стаття Олега Ваніна про тонування панелей Safari 26",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
