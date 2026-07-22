import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import AppDocument from "@/components/AppDocument";
import { BLOG_LOCALES, isBlogLocale } from "@/lib/blog";
import { rootMetadata, rootViewport } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

type BlogRootLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_LOCALES.map(locale => ({ locale }));
}

export default async function BlogRootLayout({ children, params }: BlogRootLayoutProps) {
  const { locale } = await params;

  if (!isBlogLocale(locale)) {
    notFound();
  }

  return <AppDocument lang={locale}>{children}</AppDocument>;
}
