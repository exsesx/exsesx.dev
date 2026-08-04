import type { ComponentType } from "react";
import type { BlogLocale } from "@/lib/blog";

export type BlogEdition = {
  title: string;
  seoTitle?: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  status: "draft" | "published";
  socialImage: {
    alt: string;
  };
  load: () => Promise<{ default: ComponentType }>;
};

export type BlogPost = {
  slug: string;
  tags: readonly string[];
  editions: { en: BlogEdition } & Partial<Record<BlogLocale, BlogEdition>>;
};

export type BlogPostSummary = Omit<BlogEdition, "load"> & {
  locale: BlogLocale;
  slug: string;
  tags: readonly string[];
};

export type BlogPostEntry = BlogEdition & {
  locale: BlogLocale;
  slug: string;
  tags: readonly string[];
};

export function defineBlogPost<const TPost extends BlogPost>(post: TPost) {
  return post;
}
