import Script from "next/script";
import { BlogFocusProvider } from "./blog/BlogFocusProvider";
import DocumentBootstrapScripts from "./DocumentBootstrapScripts";
import Header from "./Header";
import HotkeysLoader from "./HotkeysLoader";
import KineticBackdrop from "./KineticBackdrop";
import LiquidGlassLens from "./LiquidGlassLens";
import RouteMotionGuard from "./RouteMotionGuard";
import { TooltipProvider } from "./ui/tooltip";
import VersionTag from "./VersionTag";

const shouldLoadAnalytics = process.env.VERCEL_ENV === "production";
const umamiWebsiteId = "75a63c31-71fb-4712-9345-9b2e5a93445c";

type AppDocumentProps = Readonly<{
  children: React.ReactNode;
  lang: "en" | "uk";
}>;

export default function AppDocument({ children, lang }: AppDocumentProps) {
  const skipLinkLabel = lang === "uk" ? "Перейти до основного вмісту" : "Skip to main content";

  return (
    <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <DocumentBootstrapScripts />
      </head>
      <body>
        <TooltipProvider delay={450}>
          <a className="skip-to-content" href="#main-content">
            {skipLinkLabel}
          </a>
          <LiquidGlassLens />
          <RouteMotionGuard />
          <BlogFocusProvider>
            <KineticBackdrop />
            <Header />
            <HotkeysLoader />
            {children}
            <VersionTag />
          </BlogFocusProvider>
        </TooltipProvider>
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
