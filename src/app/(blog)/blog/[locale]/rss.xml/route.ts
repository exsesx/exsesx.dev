import { getBlogPosts } from "@/content/blog/manifest";
import { isBlogLocale } from "@/lib/blog";
import { buildBlogRss } from "@/lib/rss";

type BlogFeedRouteContext = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-static";

export async function GET(_request: Request, { params }: BlogFeedRouteContext) {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    return new Response("Not found", { status: 404 });
  }

  const posts = getBlogPosts(locale, { includeDrafts: false });

  if (posts.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildBlogRss(locale, posts), {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
