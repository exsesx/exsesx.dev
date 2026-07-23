export const BLOG_LOCALES = ["en", "uk"] as const;

export type BlogLocale = (typeof BLOG_LOCALES)[number];
export type BlogIndexPath = `/blog/${BlogLocale}`;
export type BlogPostPath = `/blog/${BlogLocale}/${string}`;

export const BLOG_UI = {
  en: {
    eyebrow: "Technical writing",
    title: "Notes from the workbench",
    description: "Source-audited writing about AI systems, product engineering, and the tools I use to build them.",
    featured: "Latest",
    allPosts: "All posts",
    emptyTitle: "Ukrainian writing is coming",
    emptyDescription: "The Blog is ready for Ukrainian editions. The first translation has not been published yet.",
    backToBlog: "Back to Blog",
    onThisPage: "On this page",
    onThisPageDescription: "Choose a section to continue reading.",
    closeTableOfContents: "Close table of contents",
    rssFeed: "RSS feed",
    minRead: "min read",
    published: "Published",
    updated: "Updated",
    readArticle: "Read article",
    focus: "Focus",
    exitFocus: "Exit focus",
    focusModeOn: "Focus mode activated",
    focusModeOff: "Focus mode deactivated",
    mermaid: {
      diagramUnavailable: "Diagram unavailable",
      keyboardInstructions:
        "Use plus and minus to zoom, arrow keys to move around the diagram when zoomed, and Home to reset.",
      resetZoom: "Reset diagram zoom",
      toolbar: "Diagram controls",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      zoomStatus: "Diagram zoom",
    },
  },
  uk: {
    eyebrow: "Технічні матеріали",
    title: "Нотатки з майстерні",
    description: "Матеріали з перевіреними джерелами про AI-системи, продуктову інженерію та робочі інструменти.",
    featured: "Нове",
    allPosts: "Усі матеріали",
    emptyTitle: "Українські матеріали вже готуються",
    emptyDescription: "Блог готовий до українських версій. Перший переклад ще не опубліковано.",
    backToBlog: "Назад до блогу",
    onThisPage: "На цій сторінці",
    onThisPageDescription: "Оберіть розділ, щоб продовжити читання.",
    closeTableOfContents: "Закрити зміст",
    rssFeed: "RSS-стрічка",
    minRead: "хв читання",
    published: "Опубліковано",
    updated: "Оновлено",
    readArticle: "Читати матеріал",
    focus: "Фокус",
    exitFocus: "Вийти з фокусу",
    focusModeOn: "Режим фокусу увімкнено",
    focusModeOff: "Режим фокусу вимкнено",
    mermaid: {
      diagramUnavailable: "Діаграма недоступна",
      keyboardInstructions:
        "Використовуйте плюс і мінус для масштабування, стрілки для навігації збільшеною діаграмою, а Home — для скидання.",
      resetZoom: "Скинути масштаб діаграми",
      toolbar: "Керування діаграмою",
      zoomIn: "Збільшити",
      zoomOut: "Зменшити",
      zoomStatus: "Масштаб діаграми",
    },
  },
} as const;

const BLOG_DATE_FORMATTERS: Record<BlogLocale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }),
  uk: new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Warsaw",
  }),
};

export function isBlogLocale(value: string): value is BlogLocale {
  return BLOG_LOCALES.some(locale => locale === value);
}

export function getBlogIndexPath(locale: BlogLocale): BlogIndexPath {
  return `/blog/${locale}`;
}

export function getBlogPostPath(locale: BlogLocale, slug: string): BlogPostPath {
  return `/blog/${locale}/${slug}`;
}

export function getBlogLocaleFromPath(pathname: string): BlogLocale | null {
  const [, section, locale] = getPathname(pathname).split("/");

  if (section === "blog" && locale && isBlogLocale(locale)) {
    return locale;
  }

  return null;
}

export function resolveBlogBackHref(pathname: string): BlogIndexPath | null {
  const segments = getPathname(pathname).split("/").filter(Boolean);
  const locale = segments[1];

  return segments[0] === "blog" && segments.length === 3 && isBlogLocale(locale) ? getBlogIndexPath(locale) : null;
}

export function formatBlogDate(value: string, locale: BlogLocale) {
  return BLOG_DATE_FORMATTERS[locale].format(new Date(value));
}

function getPathname(value: string) {
  try {
    return new URL(value, "https://exsesx.dev").pathname;
  } catch {
    return value.split(/[?#]/, 1)[0] ?? value;
  }
}
