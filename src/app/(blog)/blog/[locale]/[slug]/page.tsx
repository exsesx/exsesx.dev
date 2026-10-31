import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AsciiField from "@/components/AsciiField";
import { ArticleWithToc } from "@/components/blog/ArticleWithToc";
import BlogLocaleSwitcher from "@/components/blog/BlogLocaleSwitcher";
import BlogTags from "@/components/blog/BlogTags";
import BlogTitle from "@/components/blog/BlogTitle";
import ReadingProgress from "@/components/blog/ReadingProgress";
import { analyzeBlogPost, getAllBlogPosts, getBlogPost, getPublishedBlogLocales } from "@/content/blog/manifest";
import { BLOG_UI, formatBlogDate, getBlogIndexPath, isBlogLocale } from "@/lib/blog";
import { createBlogArticleMetadata } from "@/lib/metadata";
import { buildBlogPostingStructuredData, serializeStructuredData } from "@/lib/structured-data";

type BlogArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllBlogPosts().map(({ locale, slug }) => ({ locale, slug }));
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  const article = getBlogPost(locale, slug);

  if (!article) {
    notFound();
  }

  return createBlogArticleMetadata(article, getPublishedBlogLocales(slug));
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { locale, slug } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  const article = getBlogPost(locale, slug);

  if (!article) {
    notFound();
  }

  const [{ default: Content }, analysis] = await Promise.all([article.load(), analyzeBlogPost(article)]);
  const availableLocales = getPublishedBlogLocales(slug);
  const copy = BLOG_UI[locale];
  const structuredData = buildBlogPostingStructuredData(article);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from the typed local Blog manifest.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <ReadingProgress articleId="article-content" />
      <main id="main-content" tabIndex={-1} className="blog-article w-full pb-section-s pt-28 lg:pt-32">
        {/* The header sits on the site's ASCII field, which runs up to just below the nav's first
            64px and around the copy; the copy keeps it clear, and it stops once the reader scrolls
            into the text. On narrow screens the copy fills the width, so the field stays a band
            above the title. */}
        <div className="relative isolate pb-10 xl:pb-stack" data-ascii-host="">
          <AsciiField
            className="blog-article-field absolute inset-x-0 -top-12 -z-10 h-40 lg:-top-16 lg:bottom-0 lg:h-auto"
            placement="around"
          />
          <div className="page-safe-inline mx-auto w-full max-w-7xl">
            <header className="blog-article-header">
              <div className="flex flex-wrap items-center justify-between gap-4" data-ascii-avoid="">
                <Link className="blog-back-link" data-cuelume-press="" href={getBlogIndexPath(locale)}>
                  <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.4} />
                  {copy.backToBlog}
                </Link>
                <BlogLocaleSwitcher currentLocale={locale} availableLocales={availableLocales} slug={slug} />
              </div>
              <h1
                className="display-title mt-10 text-[clamp(2.25rem,2.4vw+1.4rem,3.75rem)] font-black leading-[1.08] text-foreground"
                data-ascii-avoid=""
              >
                <BlogTitle title={article.title} codeWords={article.titleCodeWords} />
              </h1>
              <p className="mt-6 max-w-[56ch] text-pretty text-lead text-muted-foreground" data-ascii-avoid="">
                {article.description}
              </p>
              {/* Byline and facts on one line: columns, not separators. */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4" data-ascii-avoid="">
                <p className="blog-article-meta">
                  {/* The byline takes its own line on phones; the date and reading time share the next. */}
                  <Link className="basis-full sm:basis-auto" href="/">
                    Oleh Vanin
                  </Link>
                  <span>
                    {copy.published}{" "}
                    <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt, locale)}</time>
                  </span>
                  {article.updatedAt ? (
                    <span>
                      {copy.updated}{" "}
                      <time dateTime={article.updatedAt}>{formatBlogDate(article.updatedAt, locale)}</time>
                    </span>
                  ) : null}
                  <span>
                    {analysis.readingMinutes} {copy.minRead}
                  </span>
                </p>
                <BlogTags label={copy.tags} tags={article.tags} />
              </div>
            </header>
          </div>
        </div>

        <div className="page-safe-inline mx-auto w-full max-w-7xl">
          <ArticleWithToc headings={analysis.headings} locale={locale}>
            <Content />
          </ArticleWithToc>

          <footer className="blog-article-footer mt-section-s">
            <div>
              <Link className="blog-back-link" data-cuelume-press="" href={getBlogIndexPath(locale)}>
                <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.4} />
                {copy.backToBlog}
              </Link>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
