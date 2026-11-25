import { defineBlogPost } from "../types";

export default defineBlogPost({
  slug: "macos-tiling-window-managers",
  tags: ["macOS", "Window managers", "Personal setup"],
  editions: {
    en: {
      title: "Six macOS tiling window managers, ranked",
      seoTitle: "macOS tiling window managers ranked: dinky, rift, Spaceman, AeroSpace, yabai",
      description:
        "I ran yabai, AeroSpace, rift, OmniWM, Spaceman, and dinky. Here is my tier list and how each one hides a workspace: native Spaces or off-screen parking.",
      publishedAt: "2026-11-25T19:00:00+01:00",
      status: "published",
      sourcePath: "src/content/blog/macos-tiling-window-managers/en.mdx",
      socialImage: {
        path: "/images/og/blog/macos-tiling-window-managers-en.png",
        alt: "Article by Oleh Vanin ranking six macOS tiling window managers",
      },
      load: () => import("./en.mdx"),
    },
    uk: {
      title: "Шість тайлінгових віконних менеджерів для macOS: мій рейтинг",
      seoTitle: "Рейтинг тайлінгових віконних менеджерів macOS: dinky, rift, Spaceman, AeroSpace, yabai",
      description:
        "Я попрацював з yabai, AeroSpace, rift, OmniWM, Spaceman і dinky. Ось мій тір-лист і те, як кожен ховає робочий простір: нативні Spaces або паркування за екраном.",
      publishedAt: "2026-11-25T19:00:00+01:00",
      status: "published",
      sourcePath: "src/content/blog/macos-tiling-window-managers/uk.mdx",
      socialImage: {
        path: "/images/og/blog/macos-tiling-window-managers-uk.png",
        alt: "Стаття Олега Ваніна з рейтингом шести тайлінгових віконних менеджерів для macOS",
      },
      load: () => import("./uk.mdx"),
    },
  },
});
