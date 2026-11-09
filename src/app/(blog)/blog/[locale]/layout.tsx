import { notFound } from "next/navigation";
import { BLOG_LOCALES, isBlogLocale } from "@/lib/blog";
import { preloadDocumentFonts } from "@/lib/document-fonts";

type BlogLocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_LOCALES.map(locale => ({ locale }));
}

export default async function BlogLocaleLayout({ children, params }: BlogLocaleLayoutProps) {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  preloadDocumentFonts(locale);

  return children;
}
