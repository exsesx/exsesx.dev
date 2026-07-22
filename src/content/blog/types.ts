import type { ComponentType } from "react";
import type { BlogLocale } from "@/lib/blog";
import type { ArticleHeading } from "./reading";

export type { BlogLocale } from "@/lib/blog";
export type BlogPostStatus = "draft" | "published";

export type BlogMdxModule = {
  default: ComponentType;
};

export type BlogEdition = {
  title: string;
  seoTitle?: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  status: BlogPostStatus;
  sourcePath: string;
  socialImage: {
    path: string;
    alt: string;
  };
  load: () => Promise<BlogMdxModule>;
};

export type BlogPost = {
  slug: string;
  tags: readonly string[];
  editions: { en: BlogEdition } & Partial<Record<BlogLocale, BlogEdition>>;
};

export type BlogPostSummary = Omit<BlogEdition, "load" | "sourcePath"> & {
  locale: BlogLocale;
  slug: string;
  tags: readonly string[];
};

export type BlogPostEntry = BlogEdition & {
  locale: BlogLocale;
  slug: string;
  tags: readonly string[];
};

export type AnalyzedBlogPostSummary = BlogPostSummary & {
  headings: ArticleHeading[];
  readingMinutes: number;
};

export function defineBlogPost<const TPost extends BlogPost>(post: TPost) {
  return post;
}
