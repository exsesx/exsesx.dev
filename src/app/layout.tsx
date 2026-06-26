import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import Header from "../components/Header";
import Hotkeys from "../components/Hotkeys";
import KineticBackdrop from "../components/KineticBackdrop";
import LiquidGlassLens from "../components/LiquidGlassLens";
import RouteMotionGuard from "../components/RouteMotionGuard";
import VersionTag from "../components/VersionTag";
import { defaultSocialImage, siteName, siteUrl } from "../lib/metadata";
import { createNoFlashScript } from "../lib/no-flash-script";
import { THEME_CHROME_COLORS } from "../lib/theme";
import "../styles/globals.css";

const siteDescription =
  "Oleh Vanin is a senior full-stack engineer and AI engineer building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows.";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "swap",
});

const faviconVersion = "v=4";
const faviconAsset = (path: string) => `${path}?${faviconVersion}`;

const noFlashScript = createNoFlashScript(THEME_CHROME_COLORS.dark, THEME_CHROME_COLORS.light);
const shouldLoadAnalytics = process.env.VERCEL_ENV === "production";
const umamiWebsiteId = "75a63c31-71fb-4712-9345-9b2e5a93445c";

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
    siteName,
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [defaultSocialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oleh Vanin - Senior Full Stack Engineer",
    description:
      "Senior full-stack engineer and AI engineer building scalable product systems across frontend, backend, cloud, and LLM workflows.",
    images: [
      {
        url: defaultSocialImage.url,
        alt: defaultSocialImage.alt,
      },
    ],
  },
  verification: {
    google: "NlY8lg13Q1xV0C0JlIkIOnqfpfTWHHY7IwSn-rHdIAc",
  },
  icons: {
    icon: [
      {
        url: faviconAsset("/favicon/favicon-light.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: faviconAsset("/favicon/favicon-dark.svg"),
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
      { url: faviconAsset("/favicon/favicon-32x32.png"), sizes: "32x32", type: "image/png" },
      { url: faviconAsset("/favicon/favicon-16x16.png"), sizes: "16x16", type: "image/png" },
    ],
    shortcut: faviconAsset("/favicon.ico"),
    apple: [{ url: faviconAsset("/favicon/apple-touch-icon.png"), sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: faviconAsset("/favicon/safari-pinned-tab.svg"), color: "#0b1423" }],
  },
  manifest: faviconAsset("/favicon/site.webmanifest"),
};

// Static viewport — no cookie, no per-request render, so pages stay static.
// viewport-fit=cover is required for the bottom Safari bar to tint. themeColor is
// omitted on purpose: the no-flash script owns the theme-color meta (see
// syncThemeColorMeta) so React never tracks a node the script mutates.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap must run before Safari samples document chrome. */}
        <script id="noflash" dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <LiquidGlassLens />
        <Suspense>
          <RouteMotionGuard />
        </Suspense>
        <div className="relative isolate min-h-full w-full overflow-x-hidden text-foreground transition-colors duration-300">
          <KineticBackdrop />
          <Suspense>
            <Header />
          </Suspense>
          <Hotkeys />
          {children}
          <VersionTag />
        </div>
      </body>
      {shouldLoadAnalytics ? (
        <Script
          data-website-id={umamiWebsiteId}
          id="umami-analytics"
          src="https://cloud.umami.is/script.js"
          strategy="lazyOnload"
        />
      ) : null}
    </html>
  );
}
