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

  // Safari 26 ignores theme-color and tints its chrome from the background-color
  // of <body> (fallback <html>) via a live WebKit observer — UNLESS a fixed/sticky
  // element with a background sits at the edge, which then wins the sample. We keep
  // the fixed header transparent at the very top edge (see .site-header::before),
  // so BOTH bars sample <body>. Painting --background/<html>/<body> inline (no
  // transition) lets the observer retint both bars in real time. No SSR/cookies.
  function paintSafariChrome(darkMode) {
    var color = darkMode ? themeColorDark : themeColorLight;
    var scheme = darkMode ? "dark" : "light";

    element.style.setProperty("--background", color);
    element.style.backgroundColor = color;
    element.style.colorScheme = scheme;

    if (document.body) {
      document.body.style.backgroundColor = color;
      document.body.style.colorScheme = scheme;
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
  // <body> is the chrome sample source; at beforeInteractive it may not exist yet.
  // Repaint once it does so both bars get the inline background.
  if (!document.body) {
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
