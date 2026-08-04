import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { getBlogPost } from "@/content/blog/manifest";
import { isBlogLocale } from "@/lib/blog";
import { buildBlogArticleSocialImageOptions, buildSocialImageMetadata, createSocialImage } from "@/lib/social-image";

type ArticleImageParams = Awaited<PageProps<"/blog/[locale]/[slug]">["params"]>;
type ArticleImageProps = PageProps<"/blog/[locale]/[slug]"> & { id: Promise<string | number> };

function getArticle({ locale, slug }: ArticleImageParams) {
  if (!isBlogLocale(locale)) {
    notFound();
  }

  return getBlogPost(locale, slug, { includeDrafts: false }) ?? notFound();
}

export function generateImageMetadata({ params }: { params?: Partial<ArticleImageParams> }) {
  if (!params?.locale || !params.slug) {
    return [];
  }

  const article = getArticle({ locale: params.locale, slug: params.slug });
  const id = createHash("sha256")
    .update(
      JSON.stringify([
        article.title,
        article.description,
        article.publishedAt,
        article.updatedAt,
        article.tags,
        article.socialImage.alt,
      ]),
    )
    .digest("hex")
    .slice(0, 12);

  return [
    buildSocialImageMetadata({
      id,
      alt: article.socialImage.alt,
    }),
  ];
}

export default async function OpenGraphImage({ params }: ArticleImageProps) {
  const article = getArticle(await params);

  return createSocialImage(buildBlogArticleSocialImageOptions(article));
}
