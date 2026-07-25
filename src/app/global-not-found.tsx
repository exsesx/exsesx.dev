import type { Metadata, Viewport } from "next";
import AppDocument from "@/components/AppDocument";
import NotFoundContent from "@/components/NotFoundContent";
import { rootViewport, siteName } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: `Page not found - ${siteName}`,
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};
export const viewport: Viewport = rootViewport;

export default function GlobalNotFound() {
  return (
    <AppDocument lang="en">
      <NotFoundContent />
    </AppDocument>
  );
}
