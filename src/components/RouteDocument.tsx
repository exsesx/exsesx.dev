"use client";

import { usePathname } from "next/navigation";
import { createContext, use } from "react";
import { type BlogLocale, getBlogLocaleFromPath } from "@/lib/blog";
import DocumentBootstrapScripts from "./DocumentBootstrapScripts";

const DocumentLangContext = createContext<BlogLocale>("en");

type RouteDocumentProps = Readonly<{
  afterBody?: React.ReactNode;
  children: React.ReactNode;
  lang?: BlogLocale;
}>;

/*
 * One root layout serves the site and both blog locales, so <html lang> follows
 * the route instead of the layout. usePathname resolves while each page is
 * prerendered, so the static HTML already carries the right lang, and a client
 * navigation between locales updates it in place. The no-flash script owns the
 * theme classes and inline styles on <html>; React only manages these props.
 */
export default function RouteDocument({ afterBody, children, lang: fixedLang }: RouteDocumentProps) {
  const pathname = usePathname();
  const lang = fixedLang ?? getBlogLocaleFromPath(pathname) ?? "en";

  return (
    <DocumentLangContext value={lang}>
      <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning>
        <head>
          <DocumentBootstrapScripts />
        </head>
        <body>{children}</body>
        {afterBody}
      </html>
    </DocumentLangContext>
  );
}

export function SkipToContentLink() {
  const lang = use(DocumentLangContext);

  return (
    <a className="skip-to-content" href="#main-content">
      {lang === "uk" ? "Перейти до основного вмісту" : "Skip to main content"}
    </a>
  );
}
