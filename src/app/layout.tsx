import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Header from "../components/Header";
import Hotkeys from "../components/Hotkeys";
import KineticBackdrop from "../components/KineticBackdrop";
import LiquidGlassLens from "../components/LiquidGlassLens";
import RouteMotionGuard from "../components/RouteMotionGuard";
import VersionTag from "../components/VersionTag";
import { defaultSocialImage, siteName, siteUrl } from "../lib/metadata";
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

const faviconVersion = "v=3";
const faviconAsset = (path: string) => `${path}?${faviconVersion}`;

const noFlashScript = String.raw`
(() => {
  var storageKey = "exsesx:color-scheme";
  var classNameDark = "dark";
  var classNameLight = "light";
  var themeColorDark = "${THEME_CHROME_COLORS.dark}";
  var themeColorLight = "${THEME_CHROME_COLORS.light}";
  var currentThemeColor = themeColorLight;
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var themeColorMeta = null;

  // Own the theme-color meta instead of touching React's: React hoists head
  // metas and mutating one it tracks breaks its deletion pass on navigation.
  function syncThemeColorMeta() {
    if (themeColorMeta === null || !themeColorMeta.isConnected) {
      themeColorMeta = document.querySelector('meta[name="theme-color"][data-exsesx-theme-color]');
    }

    if (themeColorMeta === null) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      themeColorMeta.setAttribute("data-exsesx-theme-color", "");
      document.head.appendChild(themeColorMeta);
    }

    if (themeColorMeta.content !== currentThemeColor) {
      themeColorMeta.content = currentThemeColor;
    }
  }

  // Safari 26 samples actual rendered background colors for its chrome. This
  // script runs in <head>, before <body> and the fixed header are parsed, so the
  // document starts with the resolved theme color instead of first painting cream.
  function paintSafariChrome(darkMode) {
    var color = darkMode ? themeColorDark : themeColorLight;
    var scheme = darkMode ? "dark" : "light";

    currentThemeColor = color;
    element.style.setProperty("--background", color);
    element.style.setProperty("--safari-chrome-color", color);
    element.style.backgroundColor = color;
    element.style.colorScheme = scheme;
    syncThemeColorMeta();
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

  // Chromium is the only engine that renders SVG filter references inside
  // backdrop-filter; everywhere else the whole backdrop-filter would be
  // dropped. navigator.userAgentData exists only in Chromium, so gate the
  // liquid-lens refraction behind it and let Safari/Firefox keep frosted glass.
  if (navigator.userAgentData) {
    element.classList.add("glass-lens");
  }

  setSeason();
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
    shortcut: faviconAsset("/favicon/favicon.ico"),
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
