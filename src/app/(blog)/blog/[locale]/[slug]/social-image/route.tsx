import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPost } from "@/content/blog/manifest";
import { isBlogLocale } from "@/lib/blog";
import { buildBlogArticleSocialImageOptions, createSocialImage } from "@/lib/social-image";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBlogPosts({ includeDrafts: false }).map(({ locale, slug }) => ({ locale, slug }));
}

export async function GET(_request: Request, { params }: RouteContext<"/blog/[locale]/[slug]/social-image">) {
  const { locale, slug } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  const article = getBlogPost(locale, slug, { includeDrafts: false }) ?? notFound();

  return createSocialImage(buildBlogArticleSocialImageOptions(article));
}
