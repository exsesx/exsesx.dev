import Script from "next/script";
import { createNoFlashScript } from "@/lib/no-flash-script";
import { THEME_CHROME_COLORS } from "@/lib/theme";
import Header from "./Header";
import HotkeysLoader from "./HotkeysLoader";
import KineticBackdrop from "./KineticBackdrop";
import LiquidGlassLens from "./LiquidGlassLens";
import RouteMotionGuard from "./RouteMotionGuard";
import VersionTag from "./VersionTag";

const noFlashScript = createNoFlashScript(THEME_CHROME_COLORS.dark, THEME_CHROME_COLORS.light);
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
        <Script id="noflash" strategy="beforeInteractive">
          {noFlashScript}
        </Script>
      </head>
      <body>
        <a className="skip-to-content" href="#main-content">
          {skipLinkLabel}
        </a>
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
