import type { Metadata } from "next";
import AppDocument from "@/components/AppDocument";
import NotFoundContent from "@/components/NotFoundContent";
import { siteName } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: `Page not found - ${siteName}`,
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <AppDocument lang="en">
      <NotFoundContent />
    </AppDocument>
  );
}
