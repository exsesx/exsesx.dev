import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "../components/Header";
import HotkeysLoader from "../components/HotkeysLoader";
import KineticBackdrop from "../components/KineticBackdrop";
import LiquidGlassLens from "../components/LiquidGlassLens";
import RouteMotionGuard from "../components/RouteMotionGuard";
import VersionTag from "../components/VersionTag";
import { defaultSocialImage, siteName, siteUrl } from "../lib/metadata";
import { createNoFlashScript } from "../lib/no-flash-script";
import { SITE_PROFILE } from "../lib/site-profile";
import { THEME_CHROME_COLORS } from "../lib/theme";
// MonoLisa webfonts: official per-unicode-range subsets (variable weight 1–900,
// normal + italic) so the browser only fetches the glyph ranges a page actually
// renders. Family names "MonoLisaText" / "MonoLisaCode" are used in globals.css.
import "../styles/monolisa.css";
import "../styles/globals.css";

const faviconVersion = "v=4";
const faviconAsset = (path: string) => `${path}?${faviconVersion}`;

const noFlashScript = createNoFlashScript(THEME_CHROME_COLORS.dark, THEME_CHROME_COLORS.light);
const shouldLoadAnalytics = process.env.VERCEL_ENV === "production";
const umamiWebsiteId = "75a63c31-71fb-4712-9345-9b2e5a93445c";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_PROFILE.name} - ${SITE_PROFILE.role}`,
    template: `%s | ${SITE_PROFILE.name}`,
  },
  description: SITE_PROFILE.description,
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
  authors: [{ name: SITE_PROFILE.name }],
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap must run before Safari samples document chrome. */}
        <script id="noflash" dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>
        <LiquidGlassLens />
        <RouteMotionGuard />
        <div className="relative isolate min-h-full w-full overflow-x-clip text-foreground transition-colors duration-300">
          <KineticBackdrop />
          <Header />
          <HotkeysLoader />
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
