import Script from "next/script";
import { preload } from "react-dom";
import { BlogFocusProvider } from "./blog/BlogFocusProvider";
import ConsoleSignature from "./ConsoleSignature";
import DocumentBootstrapScripts from "./DocumentBootstrapScripts";
import Header from "./Header";
import HotkeysLoader from "./HotkeysLoader";
import InteractionSounds from "./InteractionSounds";
import KineticBackdrop from "./KineticBackdrop";
import RouteMotionGuard from "./RouteMotionGuard";
import { TooltipProvider } from "./ui/tooltip";
import VersionTag from "./VersionTag";

// The Basic Latin face sets every page; Ukrainian pages also set Cyrillic in the first paint, so they fetch that
// subset up front instead of swapping to it once the stylesheet asks.
const FONT_PRELOADS: Record<AppDocumentProps["lang"], readonly string[]> = {
  en: ["/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2"],
  uk: [
    "/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2",
    "/fonts/monolisa-text/woff2/18-MonoLisaText-normal.woff2",
  ],
};

const shouldLoadAnalytics = process.env.VERCEL_ENV === "production";
const umamiWebsiteId = "75a63c31-71fb-4712-9345-9b2e5a93445c";

type AppDocumentProps = Readonly<{
  children: React.ReactNode;
  lang: "en" | "uk";
}>;

export default function AppDocument({ children, lang }: AppDocumentProps) {
  const skipLinkLabel = lang === "uk" ? "Перейти до основного вмісту" : "Skip to main content";

  // React emits each hint once in the head; a hand-written <link> here was also hoisted, so it shipped twice.
  for (const href of FONT_PRELOADS[lang]) {
    preload(href, { as: "font", crossOrigin: "anonymous", type: "font/woff2" });
  }

  return (
    <html lang={lang} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <DocumentBootstrapScripts />
      </head>
      <body>
        <TooltipProvider delay={450}>
          <a className="skip-to-content" href="#main-content">
            {skipLinkLabel}
          </a>
          <RouteMotionGuard />
          <InteractionSounds />
          <ConsoleSignature />
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
