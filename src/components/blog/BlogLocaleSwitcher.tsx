import Link from "next/link";
import { BLOG_LOCALES, type BlogLocale, getBlogIndexPath, getBlogPostPath } from "@/lib/blog";

type BlogLocaleSwitcherProps = {
  availableLocales?: readonly BlogLocale[];
  currentLocale: BlogLocale;
  slug?: string;
};

const labels: Record<BlogLocale, string> = {
  en: "EN",
  uk: "UA",
};

const navigationLabels: Record<BlogLocale, string> = {
  en: "Blog language",
  uk: "Мова блогу",
};

export default function BlogLocaleSwitcher({
  availableLocales = BLOG_LOCALES,
  currentLocale,
  slug,
}: BlogLocaleSwitcherProps) {
  return (
    <nav aria-label={navigationLabels[currentLocale]} className="blog-locale-switcher">
      {availableLocales.map(locale => {
        const href = slug ? getBlogPostPath(locale, slug) : getBlogIndexPath(locale);

        return (
          <Link
            key={locale}
            href={href}
            data-cuelume-press={locale === currentLocale ? undefined : "tick"}
            hrefLang={locale}
            lang={locale}
            prefetch
            aria-current={locale === currentLocale ? "page" : undefined}
            className="blog-locale-link"
          >
            {labels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
