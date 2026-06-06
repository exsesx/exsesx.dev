import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Header from "../components/Header";
import Hotkeys from "../components/Hotkeys";
import KineticBackdrop from "../components/KineticBackdrop";
import RouteMotionGuard from "../components/RouteMotionGuard";
import VersionTag from "../components/VersionTag";
import { defaultSocialImage, siteName, siteUrl } from "../lib/metadata";
import { THEME_CHROME_COLORS } from "../lib/theme";
import "../styles/globals.css";

const siteDescription =
  "Oleh Vanin is a senior full-stack engineer and AI engineer building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows.";

const noFlashScript = String.raw`
(() => {
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var themeColorDark = "${THEME_CHROME_COLORS.dark}";
  var themeColorLight = "${THEME_CHROME_COLORS.light}";
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;

  // Safari 26 ignores theme-color and tints its chrome from a solid background-color
  // via a live WebKit observer. BOTTOM bar samples <body>; TOP bar samples the fixed
  // .site-header (a thin solid bar at the top edge — see globals.css). Paint <body>,
  // <html> and the header inline (no transition) so the observer retints both bars in
  // real time. No SSR/cookies.
  function paintSafariChrome(darkMode) {
    var color = darkMode ? themeColorDark : themeColorLight;
    var scheme = darkMode ? "dark" : "light";

    element.style.setProperty("--background", color);
    element.style.setProperty("--safari-chrome-color", color);
    element.style.backgroundColor = color;
    element.style.colorScheme = scheme;

    if (document.body) {
      document.body.style.backgroundColor = color;
      document.body.style.colorScheme = scheme;
    }

    // The header is the TOP-bar sample source (Safari samples its solid bg). Paint
    // it inline so the live observer retints the top bar. It's React-rendered, so
    // it may be absent on the first beforeInteractive run — the DOMContentLoaded
    // re-run below covers that.
    var samples = document.querySelectorAll("[data-safari-chrome-sample]");
    for (var i = 0; i < samples.length; i++) {
      // TEMP DIAGNOSTIC: force RED to test if THIS header structure is still
      // sampled for the top bar. Red top bar = sampled (color var issue);
      // cream/other = restructure broke header sampling. REMOVE after.
      samples[i].style.setProperty("background-color", "#ff0000", "important");
    }
  }

  function getStoredMode() {
    var localStorageTheme = null;

    try {
      localStorageTheme = localStorage.getItem(storageKey);
    } catch {}

    if (localStorageTheme !== null) {
      try {
        localStorageTheme = JSON.parse(localStorageTheme);
      } catch {}

      if (localStorageTheme === true) return "dark";
      if (localStorageTheme === false) return "light";
      if (localStorageTheme === "light" || localStorageTheme === "dark" || localStorageTheme === "system") {
        return localStorageTheme;
      }
    }

    return "system";
  }

  function setClassOnDocumentBody(darkMode, mode) {
    element.classList.add(darkMode ? classNameDark : classNameLight);
    element.classList.remove(darkMode ? classNameLight : classNameDark);
    element.dataset.themeMode = mode;
    paintSafariChrome(darkMode);

    // body may not exist yet at beforeInteractive; paint it once it does.
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", function () {
        paintSafariChrome(darkMode);
      }, { once: true });
    }
  }

  function setSeason() {
    var now = new Date();

    if (now.getMonth() === 5) {
      element.dataset.season = "pride";
    } else {
      delete element.dataset.season;
    }
  }

  function applyTheme() {
    var mode = getStoredMode();

    if (mode === "dark") {
      setClassOnDocumentBody(true, mode);
    } else if (mode === "light") {
      setClassOnDocumentBody(false, mode);
    } else if (supportsColorSchemeQuery) {
      setClassOnDocumentBody(mql.matches, mode);
    } else {
      setClassOnDocumentBody(element.classList.contains(classNameDark), mode);
    }
  }

  applyTheme();
  setSeason();
  // <body> and the React-rendered .site-header are the chrome sample sources; at
  // beforeInteractive they may not exist yet. Repaint once the DOM is parsed so both
  // bars (and the header bar) get their inline background.
  if (!document.body || !document.querySelector("[data-safari-chrome-sample]")) {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        applyTheme();
      },
      { once: true },
    );
  }
  window.setInterval(setSeason, 60 * 60 * 1000);
  window.addEventListener("storage", applyTheme);
  window.addEventListener("exsesx:theme-change", applyTheme);

  if (mql.addEventListener) {
    mql.addEventListener("change", applyTheme);
  } else if (mql.addListener) {
    mql.addListener(applyTheme);
  }
})();
`;

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
      { url: "/favicon/favicon-light.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-dark.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ rel: "mask-icon", url: "/favicon/safari-pinned-tab.svg", color: "#18181b" }],
  },
  manifest: "/favicon/site.webmanifest",
};

// Static viewport — no cookie, no per-request render, so pages stay static.
// viewport-fit=cover is required for the bottom Safari bar to tint. theme-color
// is kept only for non-Safari-26 browsers; Safari 26 ignores it and reads the
// <body> background that the no-flash script paints client-side.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_CHROME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_CHROME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Script id="noflash" strategy="beforeInteractive">
          {noFlashScript}
        </Script>
        <RouteMotionGuard />
        <div className="relative isolate min-h-full w-full overflow-x-hidden text-foreground transition-colors duration-300">
          <KineticBackdrop />
          <Header />
          <Hotkeys />
          {children}
          <VersionTag />
        </div>
      </body>
    </html>
  );
}
