import type { Metadata, Viewport } from "next";
import AppDocument from "@/components/AppDocument";
import NotFoundContent from "@/components/NotFoundContent";
import { rootViewport } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Oleh Vanin - Page not found",
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
