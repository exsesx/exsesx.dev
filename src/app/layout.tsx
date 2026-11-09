import type { Metadata, Viewport } from "next";
import AppDocument from "@/components/AppDocument";
import { rootMetadata, rootViewport } from "@/lib/metadata";
import "@/styles/monolisa.css";
import "@/styles/globals.css";

export const metadata: Metadata = rootMetadata;
export const viewport: Viewport = rootViewport;

// The only root layout: the site and the blog share one document, so moving between them is a client navigation.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppDocument>{children}</AppDocument>;
}
