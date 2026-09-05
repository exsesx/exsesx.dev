import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "shadcn-cn-benchmarks",
  tags: ["Tailwind CSS", "Performance", "Developer tools"],
  editions: {
    en: {
      title: "I tried shadcn's new cn on my site",
      titleCodeWords: ["cn"],
      seoTitle: "shadcn cn vs clsx and tailwind-merge: migration and benchmarks",
      description:
        "Local Node and Bun benchmarks show why shadcn's new cn was faster with repeated strings and slower with unique widths.",
      publishedAt: "2026-09-04T22:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/shadcn-cn-benchmarks/en.mdx",
      socialImage: {
        path: "/images/og/blog/shadcn-cn-benchmarks-en.png",
        alt: "Oleh Vanin's article about trying shadcn cn and comparing class-merging workloads",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Я спробував новий cn від shadcn на своєму сайті",
      titleCodeWords: ["cn"],
      seoTitle: "shadcn cn проти clsx і tailwind-merge: міграція та бенчмарки",
      description:
        "Порівняв новий cn із clsx і tailwind-merge у Node та Bun. На повторюваних рядках він швидший, але з унікальними значеннями програє.",
      publishedAt: "2026-09-04T22:00:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/shadcn-cn-benchmarks/uk.mdx",
      socialImage: {
        path: "/images/og/blog/shadcn-cn-benchmarks-uk.png",
        alt: "Стаття Олега Ваніна про новий shadcn cn і порівняння сценаріїв об'єднання класів",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
