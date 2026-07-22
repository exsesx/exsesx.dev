import { ArrowRight, BookOpenText, Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogLocaleSwitcher from "@/components/blog/BlogLocaleSwitcher";
import { getBlogPostSummaries, getBlogPosts } from "@/content/blog/manifest";
import { BLOG_UI, formatBlogDate, getBlogPostPath, isBlogLocale } from "@/lib/blog";
import { createBlogIndexMetadata } from "@/lib/metadata";
import { buildBlogIndexStructuredData, serializeStructuredData } from "@/lib/structured-data";

type BlogIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  const hasPublishedPosts = getBlogPosts(locale, { includeDrafts: false }).length > 0;

  return createBlogIndexMetadata(locale, hasPublishedPosts);
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  const posts = await getBlogPostSummaries(locale);
  const copy = BLOG_UI[locale];
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);
  const structuredData = buildBlogIndexStructuredData(locale, posts);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from the typed local Blog manifest.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="blog-index mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32"
      >
        <header className="motion-rise grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-accent">
              <BookOpenText size={15} strokeWidth={2.4} />
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-balance text-[clamp(3.25rem,7vw,6.75rem)] font-black leading-[0.9] tracking-tight text-foreground">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              {copy.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BlogLocaleSwitcher currentLocale={locale} />
            {posts.length > 0 ? (
              <a className="blog-rss-link" href={`/blog/${locale}/rss.xml`} aria-label={copy.rssFeed}>
                <Rss size={16} strokeWidth={2.4} />
              </a>
            ) : null}
          </div>
        </header>

        {featuredPost ? (
          <section className="py-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{copy.featured}</p>
            <article className="blog-featured-post mt-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
                <time dateTime={featuredPost.publishedAt}>{formatBlogDate(featuredPost.publishedAt, locale)}</time>
                <span aria-hidden="true">·</span>
                <span>
                  {featuredPost.readingMinutes} {copy.minRead}
                </span>
              </div>
              <h2 className="mt-5 max-w-4xl text-balance text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                <Link href={getBlogPostPath(locale, featuredPost.slug)}>{featuredPost.title}</Link>
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{featuredPost.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {featuredPost.tags.map(tag => (
                  <span key={tag} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <Link className="blog-read-link mt-8" href={getBlogPostPath(locale, featuredPost.slug)}>
                {copy.readArticle}
                <ArrowRight aria-hidden="true" size={17} strokeWidth={2.4} />
              </Link>
            </article>
          </section>
        ) : (
          <section className="blog-empty-state py-16">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyDescription}</p>
          </section>
        )}

        {remainingPosts.length > 0 ? (
          <section className="border-t border-border py-10">
            <h2 className="text-2xl font-black tracking-tight text-foreground">{copy.allPosts}</h2>
            <div className="mt-6 grid gap-4">
              {remainingPosts.map(post => (
                <article key={post.slug} className="blog-post-row">
                  <div>
                    <h3>
                      <Link href={getBlogPostPath(locale, post.slug)}>{post.title}</Link>
                    </h3>
                    <p>{post.description}</p>
                  </div>
                  <div className="blog-post-row-meta">
                    <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt, locale)}</time>
                    <span>
                      {post.readingMinutes} {copy.minRead}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
