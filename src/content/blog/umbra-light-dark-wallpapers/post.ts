import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "umbra-light-dark-wallpapers",
  tags: ["macOS", "Apps", "Personal setup"],
  editions: {
    en: {
      title: "Two wallpapers brought me back to Light Mode",
      seoTitle: "Umbra: separate wallpapers for macOS Light and Dark Mode",
      description:
        "Why I chose Umbra over a Raycast workaround to keep one wallpaper for Light Mode and another for Dark Mode.",
      publishedAt: "2026-07-24T14:15:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/umbra-light-dark-wallpapers/en.mdx",
      socialImage: {
        path: "/images/og/blog/umbra-light-dark-wallpapers-en.png",
        alt: "Umbra light and dark wallpaper article by Oleh Vanin",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Дві шпалери, які повернули мене до світлої теми",
      seoTitle: "Umbra: окремі шпалери для світлої й темної теми macOS",
      description:
        "Чому я вибрав Umbra замість обхідної схеми з Raycast, щоб мати окремі шпалери для світлої й темної теми.",
      publishedAt: "2026-07-24T14:15:00+02:00",
      status: "published",
      sourcePath: "src/content/blog/umbra-light-dark-wallpapers/uk.mdx",
      socialImage: {
        path: "/images/og/blog/umbra-light-dark-wallpapers-uk.png",
        alt: "Стаття Олега Ваніна про окремі шпалери для світлої й темної теми macOS",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
