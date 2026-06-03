import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "../components/Header";
import KineticBackdrop from "../components/KineticBackdrop";
import VersionTag from "../components/VersionTag";
import "../styles/globals.css";

const siteUrl = "https://exsesx.dev";
const siteDescription =
  "Oleh Vanin is a senior full-stack engineer and AI engineer building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Oleh Vanin - Senior Full Stack Engineer / AI Engineer",
    template: "%s | Oleh Vanin",
  },
  description: siteDescription,
  keywords: [
    "Oleh Vanin",
    "Senior Full Stack Engineer",
    "AI Engineer",
    "React",
    "Next.js",
    "Node.js",
    "Go",
    "MCP",
    "LLM",
  ],
  authors: [{ name: "Oleh Vanin" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "exsesx.dev",
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [
      {
        url: "/images/me/oleh_portrait.jpg",
        width: 1200,
        height: 1200,
        alt: "Portrait of Oleh Vanin",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [
      {
        url: "/images/me/oleh_portrait.jpg",
        alt: "Portrait of Oleh Vanin",
      },
    ],
  },
  verification: {
    google: "NlY8lg13Q1xV0C0JlIkIOnqfpfTWHHY7IwSn-rHdIAc",
  },
  icons: {
    icon: [
      { url: "/favicon/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/favicon/safari-pinned-tab.svg", color: "#18181b" }],
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#101111" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Script src="/scripts/noflash.js" strategy="beforeInteractive" />
        <div className="relative isolate min-h-full w-full overflow-x-hidden text-foreground transition-colors duration-300">
          <KineticBackdrop />
          <Header />
          {children}
          <VersionTag />
        </div>
      </body>
    </html>
  );
}
