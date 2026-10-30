import { Rss } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AsciiField from "@/components/AsciiField";
import BlogLocaleSwitcher from "@/components/blog/BlogLocaleSwitcher";
import BlogTags from "@/components/blog/BlogTags";
import BlogTitle from "@/components/blog/BlogTitle";
import { getBlogPostSummaries, getBlogPosts } from "@/content/blog/manifest";
import { BLOG_UI, formatBlogDateStamp, getBlogPostPath, isBlogLocale } from "@/lib/blog";
import { createBlogIndexMetadata } from "@/lib/metadata";
import { buildBlogIndexStructuredData, serializeStructuredData } from "@/lib/structured-data";

/* The newest entry is set a size up, in the same grid as the others. */
const INDEX_ROW_STYLES = {
  lead: {
    title: "section-title max-w-[24ch]",
    summary: "text-lead",
  },
  rest: {
    title: "text-balance text-title font-black text-foreground",
    summary: "text-base leading-7",
  },
} as const;

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
  const structuredData = buildBlogIndexStructuredData(locale, posts);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from the typed local Blog manifest.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <main id="main-content" tabIndex={-1} className="blog-index flex w-full flex-col pb-section-s">
        {/* The masthead sits on the site's ASCII field, which fills the columns beside the title
            (a band above it on phones); the copy keeps the field clear around its lines, and the
            field starts below the header's first 64px so the nav never rests on glyphs. */}
        <header className="relative isolate" data-ascii-host="">
          <AsciiField className="absolute inset-x-0 top-16 bottom-0 -z-10" />
          <div className="page-safe-inline mx-auto grid w-full max-w-7xl gap-8 pb-section-s pt-52 lg:grid-cols-12 lg:gap-x-8 lg:pt-32">
            <div className="min-w-0 lg:col-span-9">
              <h1 className="display-title motion-rise text-display font-black text-foreground" data-ascii-avoid="">
                {copy.title}
              </h1>
              <p
                className="motion-rise motion-delay-1 mt-8 max-w-[48ch] text-pretty text-lead text-muted-foreground"
                data-ascii-avoid=""
              >
                {copy.description}
              </p>
              <div className="motion-rise motion-delay-2 mt-8 flex items-center gap-3" data-ascii-avoid="">
                <BlogLocaleSwitcher currentLocale={locale} />
                {posts.length > 0 ? (
                  <a
                    className="blog-rss-link"
                    href={`/blog/${locale}/rss.xml`}
                    aria-label={copy.rssFeed}
                    data-cuelume-press=""
                  >
                    <Rss size={16} strokeWidth={2.4} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {posts.length > 0 ? (
          /* One index, newest first: the date column on the left, the post on the rest. Entries
             part by space alone; each holds tight around its title so the gaps do the separating. */
          <ol className="page-safe-inline mx-auto flex w-full max-w-7xl flex-col gap-y-14 sm:gap-y-16 lg:gap-y-20">
            {posts.map((post, index) => {
              const styles = INDEX_ROW_STYLES[index === 0 ? "lead" : "rest"];

              return (
                <li key={post.slug}>
                  <article className="grid gap-y-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-x-8 lg:grid-cols-12">
                    <p className="flex gap-x-6 text-sm leading-6 tabular-nums text-muted-foreground sm:flex-col lg:col-span-3">
                      <time dateTime={post.publishedAt}>{formatBlogDateStamp(post.publishedAt)}</time>
                      <span>
                        {post.readingMinutes} {copy.minRead}
                      </span>
                    </p>
                    <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
                      <h2 className={styles.title}>
                        <Link
                          className="blog-index-link"
                          data-cuelume-press="select"
                          href={getBlogPostPath(locale, post.slug)}
                        >
                          <BlogTitle title={post.title} codeWords={post.titleCodeWords} />
                        </Link>
                      </h2>
                      <p className={`max-w-[60ch] text-pretty text-muted-foreground ${styles.summary}`}>
                        {post.description}
                      </p>
                      <BlogTags label={copy.tags} tags={post.tags} />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <section className="blog-empty-state page-safe-inline mx-auto w-full max-w-7xl">
            <h2 className="section-title max-w-[24ch]">{copy.emptyTitle}</h2>
            <p className="mt-6 max-w-[48ch] text-pretty text-lead text-muted-foreground">{copy.emptyDescription}</p>
          </section>
        )}
      </main>
    </>
  );
}
