import type { BlogPostEntry, BlogPostSummary } from "@/content/blog/types";
import { type BlogLocale, getBlogIndexPath, getBlogPostPath } from "./blog";
import { defaultSocialImage, siteName, siteUrl } from "./metadata";
import { getProjectPath, projects, specialties } from "./projects";
import { SITE_PROFILE } from "./site-profile";

type JsonObject = Record<string, unknown>;

function absoluteUrl(path: string) {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

export function serializeStructuredData(data: JsonObject) {
  return JSON.stringify(data).replaceAll("</", "<\\/");
}

export function buildHomeStructuredData() {
  const personId = `${siteUrl}/#person`;
  const websiteId = `${siteUrl}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profile`,
        url: siteUrl,
        name: "Oleh Vanin - Software Engineer",
        description: SITE_PROFILE.description,
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
      },
      {
        "@type": "Person",
        "@id": personId,
        name: SITE_PROFILE.name,
        url: siteUrl,
        image: absoluteUrl("/images/me/oleh_portrait.jpg"),
        jobTitle: SITE_PROFILE.role,
        nationality: {
          "@type": "Country",
          name: SITE_PROFILE.nationality,
        },
        homeLocation: {
          "@type": "Country",
          name: SITE_PROFILE.location,
        },
        knowsAbout: specialties,
        sameAs: [SITE_PROFILE.links.github, SITE_PROFILE.links.linkedin],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteName,
        url: siteUrl,
        description: "Personal portfolio of Oleh Vanin, a senior full-stack engineer and AI engineer based in Poland.",
        publisher: { "@id": personId },
        image: defaultSocialImage.url,
      },
    ],
  } as const;
}

export function buildProjectsStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/projects#itemlist`,
        name: "Featured projects",
        url: `${siteUrl}/projects`,
        numberOfItems: projects.length,
        itemListElement: projects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            "@id": `${siteUrl}${getProjectPath(project)}#project`,
            name: project.name,
            url: `${siteUrl}${getProjectPath(project)}`,
            description: project.description,
            about: project.tags,
          },
        })),
      },
    ],
  } as const;
}

export function buildBlogPostingStructuredData(article: BlogPostEntry) {
  const url = `${siteUrl}${getBlogPostPath(article.locale, article.slug)}`;
  const personId = `${siteUrl}/#person`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: article.seoTitle ?? article.title,
    description: article.description,
    inLanguage: article.locale,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    image: absoluteUrl(article.socialImage.path),
    keywords: article.tags,
    mainEntityOfPage: url,
    isPartOf: {
      "@type": "Blog",
      "@id": `${siteUrl}${getBlogIndexPath(article.locale)}#blog`,
    },
    author: {
      "@type": "Person",
      "@id": personId,
      name: SITE_PROFILE.name,
      url: siteUrl,
    },
    publisher: {
      "@type": "Person",
      "@id": personId,
      name: SITE_PROFILE.name,
      url: siteUrl,
    },
  } as const;
}

export function buildBlogIndexStructuredData(locale: BlogLocale, posts: readonly BlogPostSummary[]) {
  const indexUrl = `${siteUrl}${getBlogIndexPath(locale)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${indexUrl}#itemlist`,
        name: locale === "en" ? "Oleh Vanin's technical Blog" : "Технічний блог Олега Ваніна",
        url: indexUrl,
        numberOfItems: posts.length,
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "BlogPosting",
            "@id": `${siteUrl}${getBlogPostPath(locale, post.slug)}#article`,
            name: post.title,
            url: `${siteUrl}${getBlogPostPath(locale, post.slug)}`,
            description: post.description,
            inLanguage: locale,
          },
        })),
      },
    ],
  } as const;
}
