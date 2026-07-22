import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";
import { siteName } from "@/lib/metadata";

export const metadata: Metadata = {
  title: `Page not found - ${siteName}`,
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};

export default NotFoundContent;
