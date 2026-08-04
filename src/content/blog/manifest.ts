import { readFile } from "node:fs/promises";
import path from "node:path";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog";
import codexAgentsV2 from "./codex-agents-v2/post";
import codexMemories from "./codex-memories/post";
import { analyzeMdxSource } from "./reading";
import safari26InvisibleTintSampler from "./safari-26-invisible-tint-sampler/post";
import type { BlogPost, BlogPostEntry, BlogPostSummary } from "./types";
import umbraLightDarkWallpapers from "./umbra-light-dark-wallpapers/post";

const posts: readonly BlogPost[] = [
  safari26InvisibleTintSampler,
  umbraLightDarkWallpapers,
  codexMemories,
  codexAgentsV2,
];

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

      const { load: _load, ...summary } = entry;

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

export async function analyzeBlogPost({ locale, slug }: { locale: BlogLocale; slug: string }) {
  const source = await readFile(path.join(process.cwd(), "src/content/blog", slug, `${locale}.mdx`), "utf8");

  return analyzeMdxSource(source);
}

export async function getBlogPostSummaries(locale: BlogLocale, options: BlogPostQueryOptions = {}) {
  return Promise.all(
    getBlogPosts(locale, options).map(async summary => {
      return {
        ...summary,
        ...(await analyzeBlogPost(summary)),
      };
    }),
  );
}

export { posts as blogManifest };
