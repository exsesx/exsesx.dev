import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

// Unmatched URLs anywhere: rendered in the one root layout, so the document's lang still follows the path.
export const metadata: Metadata = {
  title: "Page not found",
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};

export default NotFoundContent;
