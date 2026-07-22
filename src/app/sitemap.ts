import type { MetadataRoute } from "next";
import { getAllBlogPosts, getBlogPosts, getPublishedBlogLocales } from "@/content/blog/manifest";
import { BLOG_LOCALES, getBlogIndexPath, getBlogPostPath } from "@/lib/blog";
import { siteUrl } from "@/lib/metadata";
import { getProjectPath, projects } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = getAllBlogPosts({ includeDrafts: false });
  const blogIndexes = BLOG_LOCALES.flatMap(locale => {
    const posts = getBlogPosts(locale, { includeDrafts: false });

    if (posts.length === 0) {
      return [];
    }

    return [
      {
        url: `${siteUrl}${getBlogIndexPath(locale)}`,
        lastModified: new Date(posts[0].updatedAt ?? posts[0].publishedAt),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      },
    ];
  });
  const blogEntries = blogPosts.map(post => {
    const locales = getPublishedBlogLocales(post.slug);
    const languages = Object.fromEntries(
      locales.map(locale => [locale, `${siteUrl}${getBlogPostPath(locale, post.slug)}`]),
    );
    const defaultLocale = locales.includes("en") ? "en" : post.locale;

    return {
      url: `${siteUrl}${getBlogPostPath(post.locale, post.slug)}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.85,
      alternates: {
        languages: {
          ...languages,
          "x-default": `${siteUrl}${getBlogPostPath(defaultLocale, post.slug)}`,
        },
      },
    };
  });

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/projects`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...projects.map(project => ({
      url: `${siteUrl}${getProjectPath(project)}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...blogIndexes,
    ...blogEntries,
    {
      url: `${siteUrl}/llms.txt`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
