import { readFile } from "node:fs/promises";
import path from "node:path";
import { BLOG_LOCALES } from "@/lib/blog";
import codexAgentsV2 from "./codex-agents-v2/post";
import { analyzeMdxSource } from "./reading";
import type { AnalyzedBlogPostSummary, BlogLocale, BlogPost, BlogPostEntry, BlogPostSummary } from "./types";

const posts: readonly BlogPost[] = [codexAgentsV2];

type BlogPostQueryOptions = {
  includeDrafts?: boolean;
};

export function getBlogPosts(
  locale: BlogLocale,
  { includeDrafts = process.env.NODE_ENV === "development" }: BlogPostQueryOptions = {},
): BlogPostSummary[] {
  return posts
    .flatMap(post => {
      const entry = getBlogPost(locale, post.slug, { includeDrafts });

      if (!entry) {
        return [];
      }

      const { load: _load, sourcePath: _sourcePath, ...summary } = entry;

      return [summary];
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getBlogPost(
  locale: BlogLocale,
  slug: string,
  { includeDrafts = process.env.NODE_ENV === "development" }: BlogPostQueryOptions = {},
): BlogPostEntry | null {
  const post = posts.find(candidate => candidate.slug === slug);
  const edition = post?.editions[locale];

  if (!post || !edition || (!includeDrafts && edition.status !== "published")) {
    return null;
  }

  return {
    ...edition,
    locale,
    slug: post.slug,
    tags: post.tags,
  };
}

export function getPublishedBlogLocales(slug: string): BlogLocale[] {
  return BLOG_LOCALES.filter(locale => getBlogPost(locale, slug, { includeDrafts: false }) !== null);
}

export function getAllBlogPosts(options: BlogPostQueryOptions = {}): BlogPostSummary[] {
  return BLOG_LOCALES.flatMap(locale => getBlogPosts(locale, options)).sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

export async function analyzeBlogPost(article: BlogPostEntry) {
  const source = await readFile(path.join(process.cwd(), article.sourcePath), "utf8");

  return analyzeMdxSource(source);
}

export async function getBlogPostSummaries(
  locale: BlogLocale,
  options: BlogPostQueryOptions = {},
): Promise<AnalyzedBlogPostSummary[]> {
  return Promise.all(
    getBlogPosts(locale, options).map(async summary => {
      const article = getBlogPost(locale, summary.slug, options);

      if (!article) {
        throw new Error(`Missing Blog entry for ${locale}/${summary.slug}`);
      }

      return {
        ...summary,
        ...(await analyzeBlogPost(article)),
      };
    }),
  );
}

export { posts as blogManifest };
