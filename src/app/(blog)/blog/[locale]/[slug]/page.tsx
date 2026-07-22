import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleWithToc } from "@/components/blog/ArticleWithToc";
import BlogLocaleSwitcher from "@/components/blog/BlogLocaleSwitcher";
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
      <main
        id="main-content"
        tabIndex={-1}
        className="blog-article mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:pt-32"
      >
        <header className="mx-auto max-w-4xl pb-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link className="blog-back-link" href={getBlogIndexPath(locale)}>
              <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.4} />
              {copy.backToBlog}
            </Link>
            <BlogLocaleSwitcher currentLocale={locale} availableLocales={availableLocales} slug={slug} />
          </div>
          <h1 className="mt-8 text-balance text-[clamp(2.75rem,6.4vw,5.75rem)] font-black leading-[0.94] tracking-tight text-foreground">
            {article.title}
          </h1>
          <p className="mt-6 max-w-3xl text-pretty text-xl leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
            {article.description}
          </p>
          <div className="blog-article-meta mt-7">
            <Link href="/">Oleh Vanin</Link>
            <span>
              <CalendarDays aria-hidden="true" size={15} />
              {copy.published} <time dateTime={article.publishedAt}>{formatBlogDate(article.publishedAt, locale)}</time>
            </span>
            {article.updatedAt ? (
              <span>
                {copy.updated} <time dateTime={article.updatedAt}>{formatBlogDate(article.updatedAt, locale)}</time>
              </span>
            ) : null}
            <span>
              <Clock3 aria-hidden="true" size={15} />
              {analysis.readingMinutes} {copy.minRead}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {article.tags.map(tag => (
              <span key={tag} className="blog-tag">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <ArticleWithToc headings={analysis.headings} locale={locale}>
          <Content />
        </ArticleWithToc>

        <footer className="mx-auto mt-14 flex max-w-4xl pt-8">
          <Link className="blog-back-link" href={getBlogIndexPath(locale)}>
            <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.4} />
            {copy.backToBlog}
          </Link>
        </footer>
      </main>
    </>
  );
}
