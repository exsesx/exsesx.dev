import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};

export default NotFoundContent;
