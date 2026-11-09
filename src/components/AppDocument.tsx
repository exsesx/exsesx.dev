import Script from "next/script";
import type { BlogLocale } from "@/lib/blog";
import { preloadDocumentFonts } from "@/lib/document-fonts";
import { BlogFocusProvider } from "./blog/BlogFocusProvider";
import ConsoleSignature from "./ConsoleSignature";
import Header from "./Header";
import HotkeysLoader from "./HotkeysLoader";
import InteractionSounds from "./InteractionSounds";
import KineticBackdrop from "./KineticBackdrop";
import RouteDocument, { SkipToContentLink } from "./RouteDocument";
import RouteMotionGuard from "./RouteMotionGuard";
import { TooltipProvider } from "./ui/tooltip";
import VersionTag from "./VersionTag";

const shouldLoadAnalytics = process.env.VERCEL_ENV === "production";
const umamiWebsiteId = "75a63c31-71fb-4712-9345-9b2e5a93445c";

type AppDocumentProps = Readonly<{
  children: React.ReactNode;
  // Pins the document language; without it the language follows the route.
  lang?: BlogLocale;
}>;

export default function AppDocument({ children, lang }: AppDocumentProps) {
  // Ukrainian blog layouts add the Cyrillic subset on top of this.
  preloadDocumentFonts(lang ?? "en");

  return (
    <RouteDocument
      lang={lang}
      afterBody={
        shouldLoadAnalytics ? (
          <Script
            data-website-id={umamiWebsiteId}
            id="umami-analytics"
            src="https://cloud.umami.is/script.js"
            strategy="lazyOnload"
          />
        ) : null
      }
    >
      <TooltipProvider delay={450}>
        <SkipToContentLink />
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
    </RouteDocument>
  );
}
