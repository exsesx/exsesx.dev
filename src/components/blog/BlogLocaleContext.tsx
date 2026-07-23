"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { BlogLocale } from "@/lib/blog";

const BlogLocaleContext = createContext<BlogLocale>("en");

type BlogLocaleProviderProps = {
  children: ReactNode;
  locale: BlogLocale;
};

export function BlogLocaleProvider({ children, locale }: BlogLocaleProviderProps) {
  return <BlogLocaleContext value={locale}>{children}</BlogLocaleContext>;
}

export function useBlogLocale() {
  return useContext(BlogLocaleContext);
}
