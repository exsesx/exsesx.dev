import type { Metadata, Viewport } from "next";
import type { BlogPostEntry } from "@/content/blog/types";
import { type BlogLocale, getBlogIndexPath, getBlogPostPath } from "./blog";
import { SITE_PROFILE } from "./site-profile";

export const siteUrl = SITE_PROFILE.url;
export const siteName = SITE_PROFILE.domain;

const socialPreviewPath = "/images/social-preview.png";
// Bump to force social platforms (Telegram, X, LinkedIn, Slack) to re-scrape
// cached previews — they cache og:image by URL.
const socialImageVersion = "4";
const previewDeploymentUrl = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
const socialImageOrigin =
  process.env.VERCEL_ENV === "preview" && previewDeploymentUrl ? `https://${previewDeploymentUrl}` : siteUrl;

function createSocialImage(path: string, alt: string) {
  return {
    url: `${socialImageOrigin}${path}?v=${socialImageVersion}`,
    width: 1200,
    height: 630,
    alt,
    type: "image/png",
  } as const;
}

export const defaultSocialImage = createSocialImage(
  socialPreviewPath,
  "Stylized website preview for Oleh Vanin's engineering portfolio",
);

export const projectsSocialImage = createSocialImage(
  "/images/og/projects.png",
  "Stylized projects preview for Oleh Vanin's engineering portfolio",
);

export const blogSocialImage = createSocialImage("/images/og/blog.png", "The exsesx.dev technical Blog by Oleh Vanin");

export function createProjectSocialImage(slug: string, name: string) {
  return createSocialImage(
    `/images/og/project-${slug}.png`,
    `Stylized social preview for the ${name} project by Oleh Vanin`,
  );
}

export function createBlogIndexMetadata(locale: BlogLocale, hasPublishedPosts: boolean): Metadata {
  const path = getBlogIndexPath(locale);
  const url = getCanonicalUrl(path);
  const isEnglish = locale === "en";
  const title = isEnglish ? "Blog" : "Блог";
  const description = isEnglish
    ? "Technical writing by Oleh Vanin about AI systems, product engineering, and developer tools."
    : "Технічні матеріали Олега Ваніна про AI-системи, продуктову інженерію та інструменти розробника.";

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hasPublishedPosts ? { [locale]: url, "x-default": `${siteUrl}/blog/en` } : undefined,
      types: hasPublishedPosts ? { "application/rss+xml": `${siteUrl}${path}/rss.xml` } : undefined,
    },
    robots: hasPublishedPosts ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: isEnglish ? "en_US" : "uk_UA",
      url,
      siteName,
      title,
      description,
      images: [blogSocialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: blogSocialImage.url, alt: blogSocialImage.alt }],
    },
  };
}

export function createBlogArticleMetadata(article: BlogPostEntry, availableLocales: readonly BlogLocale[]): Metadata {
  const path = getBlogPostPath(article.locale, article.slug);
  const url = getCanonicalUrl(path);
  const title = article.seoTitle ?? article.title;
  const image = createSocialImage(article.socialImage.path, article.socialImage.alt);
  const languageAlternates = Object.fromEntries(
    availableLocales.map(locale => [locale, getCanonicalUrl(getBlogPostPath(locale, article.slug))]),
  );
  const defaultLocale = availableLocales.includes("en") ? "en" : article.locale;

  return {
    title,
    description: article.description,
    authors: [{ name: SITE_PROFILE.name, url: siteUrl }],
    keywords: [...article.tags],
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        "x-default": getCanonicalUrl(getBlogPostPath(defaultLocale, article.slug)),
      },
      types: {
        "application/rss+xml": `${siteUrl}${getBlogIndexPath(article.locale)}/rss.xml`,
      },
    },
    openGraph: {
      type: "article",
      locale: article.locale === "en" ? "en_US" : "uk_UA",
      alternateLocale: availableLocales.flatMap(locale =>
        locale === article.locale ? [] : [locale === "en" ? "en_US" : "uk_UA"],
      ),
      url,
      siteName,
      title,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [siteUrl],
      tags: [...article.tags],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: article.description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

const faviconVersion = "v=4";
const faviconAsset = (path: string) => `${path}?${faviconVersion}`;

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_PROFILE.name} - ${SITE_PROFILE.role}`,
    template: `%s | ${SITE_PROFILE.name}`,
  },
  description: SITE_PROFILE.description,
  keywords: [
    "Oleh Vanin",
    "Senior Full Stack Engineer",
    "AI Engineer",
    "React",
    "Next.js",
    "Node.js",
    "Go",
    "MCP",
    "LLM",
  ],
  authors: [{ name: SITE_PROFILE.name }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [
      {
        url: defaultSocialImage.url,
        alt: defaultSocialImage.alt,
      },
    ],
  },
  verification: {
    google: "NlY8lg13Q1xV0C0JlIkIOnqfpfTWHHY7IwSn-rHdIAc",
  },
  icons: {
    icon: [
      {
        url: faviconAsset("/favicon/favicon-light.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: faviconAsset("/favicon/favicon-dark.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: faviconAsset("/favicon/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: faviconAsset("/favicon/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
    ],
    shortcut: faviconAsset("/favicon.ico"),
    apple: [{ url: faviconAsset("/favicon/apple-touch-icon.png"), sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: faviconAsset("/favicon/safari-pinned-tab.svg"), color: "#0b1423" }],
  },
  manifest: faviconAsset("/favicon/site.webmanifest"),
};

// The pre-hydration theme script owns theme-color so React never tracks a node
// that the script mutates while Safari samples the document chrome.
export const rootViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
};

function getCanonicalUrl(path = "/") {
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = defaultSocialImage,
}: {
  title: string;
  description: string;
  path?: string;
  image?: SocialImage;
}): Metadata {
  const url = getCanonicalUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: image.url,
          alt: image.alt,
        },
      ],
    },
  };
}
