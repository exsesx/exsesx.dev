import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import Header from "../components/Header";
import Hotkeys from "../components/Hotkeys";
import KineticBackdrop from "../components/KineticBackdrop";
import RouteMotionGuard from "../components/RouteMotionGuard";
import VersionTag from "../components/VersionTag";
import { defaultSocialImage, siteName, siteUrl } from "../lib/metadata";
import { isThemeMode, THEME_CHROME_COLORS, THEME_COOKIE_MAX_AGE, THEME_COOKIE_NAME } from "../lib/theme";
import "../styles/globals.css";

const siteDescription =
  "Oleh Vanin is a senior full-stack engineer and AI engineer building scalable product systems with React, Next.js, Node.js, Go, cloud infrastructure, and LLM workflows.";

const noFlashScript = String.raw`
(() => {
  var storageKey = "exsesx:color-scheme";
  var cookieKey = "${THEME_COOKIE_NAME}";
  var cookieMaxAge = ${THEME_COOKIE_MAX_AGE};
  var classNameDark = "dark";
  var classNameLight = "light";
  var element = document.documentElement;
  var preferDarkQuery = "(prefers-color-scheme: dark)";
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;

  function syncCookie(mode) {
    try {
      document.cookie = cookieKey + "=" + mode + "; path=/; max-age=" + cookieMaxAge + "; samesite=lax";
    } catch {}
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
    syncCookie(mode);
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

const baseViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

async function getCookieThemeMode() {
  const cookieStore = await cookies();
  const cookieMode = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return isThemeMode(cookieMode) ? cookieMode : "system";
}

// theme-color is for non-Safari-26 browsers (Safari 26 ignores it and tints from
// the <body> background instead — handled by the SSR'd class + inline bg below).
export async function generateViewport(): Promise<Viewport> {
  const mode = await getCookieThemeMode();

  if (mode === "light" || mode === "dark") {
    return {
      ...baseViewport,
      colorScheme: mode,
      themeColor: THEME_CHROME_COLORS[mode],
    };
  }

  return {
    ...baseViewport,
    colorScheme: "light dark",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: THEME_CHROME_COLORS.light },
      { media: "(prefers-color-scheme: dark)", color: THEME_CHROME_COLORS.dark },
    ],
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const mode = await getCookieThemeMode();
  // Safari 26 ignores theme-color and tints its chrome from the SSR'd <body>
  // background. So for an explicit choice we must render the class AND an inline
  // background server-side, before first paint. system/no-cookie stays unset and
  // is resolved client-side by the no-flash script (we can't know the OS here).
  const initialClassName = mode === "dark" ? "dark" : mode === "light" ? "light" : undefined;
  const initialBackground =
    mode === "dark" ? THEME_CHROME_COLORS.dark : mode === "light" ? THEME_CHROME_COLORS.light : undefined;
  const initialStyle = initialBackground ? { backgroundColor: initialBackground } : undefined;

  return (
    <html
      lang="en"
      className={initialClassName}
      data-scroll-behavior="smooth"
      style={initialStyle}
      suppressHydrationWarning
    >
      <body style={initialStyle}>
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
