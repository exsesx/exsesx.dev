const THEME_CHANGE_EVENT = "exsesx:theme-change";
const THEME_STORAGE_KEY = "exsesx:color-scheme";
// Source of truth for the page + Safari 26 chrome colors. The no-flash script
// applies these inline to <html>/<body> so the WebKit live observer retints the
// browser chrome in real time. Keep in sync with --background in globals.css.
export const THEME_CHROME_COLORS = {
  light: "#eef2f8",
  dark: "#0a101c",
} as const;

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

let volatileThemeMode: ThemeMode | null = null;

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  let storedValue: string | null;

  try {
    storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return volatileThemeMode ?? "system";
  }

  if (storedValue === null) {
    return "system";
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);

    if (parsedValue === true) {
      return "dark";
    }

    if (parsedValue === false) {
      return "light";
    }

    if (isThemeMode(parsedValue)) {
      return parsedValue;
    }
  } catch {
    if (isThemeMode(storedValue)) {
      return storedValue;
    }
  }

  return "system";
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getThemeSnapshot() {
  const mode = getStoredThemeMode();
  const resolvedTheme = mode === "system" ? getSystemTheme() : mode;

  return `${mode}:${resolvedTheme}`;
}

export function getServerThemeSnapshot() {
  return "system:light";
}

export function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
    media.removeEventListener("change", callback);
  };
}

export function persistThemeMode(mode: ThemeMode) {
  volatileThemeMode = mode;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mode));
  } catch {
    // Restricted storage should not make the global theme control unusable.
  }

  // The no-flash script listens for this and repaints the Safari chrome inline,
  // which the WebKit live observer picks up in real time — no refresh needed.
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function parseThemeSnapshot(snapshot: string) {
  const [mode = "system", resolvedTheme = "light"] = snapshot.split(":");

  return {
    mode: isThemeMode(mode) ? mode : "system",
    resolvedTheme: resolvedTheme === "dark" ? "dark" : "light",
  } satisfies {
    mode: ThemeMode;
    resolvedTheme: ResolvedTheme;
  };
}
