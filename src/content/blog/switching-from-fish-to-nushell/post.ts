import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "switching-from-fish-to-nushell",
  tags: ["Nushell", "Fish", "Developer tools"],
  editions: {
    en: {
      title: "Why I switched from Fish to Nushell",
      seoTitle: "Why I switched from Fish to Nushell for structured data",
      description:
        "How Nushell's typed pipelines changed my daily terminal while Starship, Neovim, jq, rg, and Fish stayed in my toolkit.",
      publishedAt: "2026-08-11T17:13:21+02:00",
      status: "published",
      sourcePath: "src/content/blog/switching-from-fish-to-nushell/en.mdx",
      socialImage: {
        path: "/images/og/blog/switching-from-fish-to-nushell-en.png",
        alt: "Article by Oleh Vanin about switching from Fish to Nushell",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Чому я перейшов із Fish на Nushell",
      seoTitle: "Чому я перейшов із Fish на Nushell заради структурованих даних",
      description:
        "Як типізовані конвеєри Nushell змінили мою роботу в терміналі, а Starship, Neovim, jq, rg і Fish залишилися в моєму наборі інструментів.",
      publishedAt: "2026-08-11T17:13:21+02:00",
      status: "published",
      sourcePath: "src/content/blog/switching-from-fish-to-nushell/uk.mdx",
      socialImage: {
        path: "/images/og/blog/switching-from-fish-to-nushell-uk.png",
        alt: "Стаття Олега Ваніна про перехід із Fish на Nushell",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
