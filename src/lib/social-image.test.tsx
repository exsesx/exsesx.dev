import { describe, expect, test } from "bun:test";
import { generateImageMetadata as generateArticleImageMetadata } from "@/app/(blog)/blog/[locale]/[slug]/opengraph-image";
import {
  dynamicParams as articleRouteDynamicParams,
  generateStaticParams as generateArticleRouteStaticParams,
} from "@/app/(blog)/blog/[locale]/[slug]/social-image/route";
import { generateImageMetadata as generateBlogImageMetadata } from "@/app/(blog)/blog/[locale]/opengraph-image";
import { generateImageMetadata as generateProfileImageMetadata } from "@/app/(site)/opengraph-image";
import { generateImageMetadata as generateProjectImageMetadata } from "@/app/(site)/project/[slug]/opengraph-image";
import { generateImageMetadata as generateProjectsImageMetadata } from "@/app/(site)/projects/opengraph-image";
import { dynamic as profileRouteDynamic } from "@/app/(site)/social-image/route";
import { getAllBlogPosts, getBlogPost } from "@/content/blog/manifest";
import { buildBlogArticleSocialImageOptions } from "./social-image";
import { SOCIAL_IMAGE_VERSION, versionSocialImageId, versionSocialImageUrl } from "./social-image-version";

describe("social image versioning", () => {
  test("changes every generated Open Graph image id from one shared version", () => {
    const metadata = [
      ...generateProfileImageMetadata(),
      ...generateProjectsImageMetadata(),
      ...generateBlogImageMetadata(),
      ...generateProjectImageMetadata({ params: { slug: "controlup" } }),
      ...generateArticleImageMetadata({ params: { locale: "en", slug: "codex-agents-v2" } }),
    ];

    expect(metadata).toHaveLength(5);

    for (const image of metadata) {
      expect(image.id).toEndWith(`-v${SOCIAL_IMAGE_VERSION}`);
    }
  });

  test("versions explicit social image URLs without discarding an existing query", () => {
    expect(versionSocialImageId("profile")).toBe(`profile-v${SOCIAL_IMAGE_VERSION}`);
    expect(versionSocialImageUrl("https://exsesx.dev/social-image")).toBe(
      `https://exsesx.dev/social-image?v=${SOCIAL_IMAGE_VERSION}`,
    );
    expect(versionSocialImageUrl("https://exsesx.dev/social-image?locale=en")).toBe(
      `https://exsesx.dev/social-image?locale=en&v=${SOCIAL_IMAGE_VERSION}`,
    );
  });
});

describe("explicit social image routes", () => {
  test("prerenders only published article locale and slug combinations", () => {
    const expected = getAllBlogPosts({ includeDrafts: false }).map(({ locale, slug }) => ({ locale, slug }));

    expect(generateArticleRouteStaticParams()).toEqual(expected);
    expect(articleRouteDynamicParams).toBe(false);
    expect(profileRouteDynamic).toBe("force-static");
  });

  test("builds one shared article payload for Open Graph and explicit routes", () => {
    const article = getBlogPost("uk", "codex-agents-v2", { includeDrafts: false });

    if (!article) {
      throw new Error("Expected the published Ukrainian article fixture");
    }

    expect(buildBlogArticleSocialImageOptions(article)).toMatchObject({
      eyebrow: "UK • Blog",
      title: article.title,
      description: article.description,
      path: "exsesx.dev/blog/uk/codex-agents-v2",
      context: "uk • Blog",
      tags: article.tags,
    });
  });
});
