import type { Metadata, Viewport } from "next";
import AppDocument from "@/components/AppDocument";
import { rootMetadata, rootViewport } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

export default function SiteRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppDocument lang="en">{children}</AppDocument>;
}
