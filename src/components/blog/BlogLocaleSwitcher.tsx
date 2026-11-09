"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BLOG_LOCALE_LABELS,
  BLOG_LOCALES,
  type BlogIndexPath,
  type BlogLocale,
  type BlogPostPath,
  getBlogIndexPath,
  getBlogPostPath,
} from "@/lib/blog";

type BlogLocaleSwitcherProps = {
  availableLocales?: readonly BlogLocale[];
  currentLocale: BlogLocale;
  slug?: string;
};

type LocaleLinkProps = {
  href: BlogIndexPath | BlogPostPath;
  isCurrent: boolean;
  locale: BlogLocale;
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
      {availableLocales.map(locale => (
        <LocaleLink
          key={locale}
          href={slug ? getBlogPostPath(locale, slug) : getBlogIndexPath(locale)}
          isCurrent={locale === currentLocale}
          locale={locale}
        />
      ))}
    </nav>
  );
}

// The other language is fetched on intent, not on sight: its payload carries that script's font hint, so a viewport
// prefetch made every English reader download the Cyrillic face. Hover, focus and the first touch all start it well
// before the click lands.
function LocaleLink({ href, isCurrent, locale }: LocaleLinkProps) {
  const [hasIntent, setHasIntent] = useState(false);
  const showIntent = isCurrent ? undefined : () => setHasIntent(true);

  return (
    <Link
      href={href}
      data-cuelume-press={isCurrent ? undefined : "select"}
      hrefLang={locale}
      lang={locale}
      prefetch={hasIntent}
      aria-current={isCurrent ? "page" : undefined}
      className="blog-locale-link"
      onFocus={showIntent}
      onMouseEnter={showIntent}
      onTouchStart={showIntent}
    >
      {BLOG_LOCALE_LABELS[locale]}
    </Link>
  );
}
