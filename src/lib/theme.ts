export const THEME_CHANGE_EVENT = "exsesx:theme-change";
export const THEME_STORAGE_KEY = "exsesx:color-scheme";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);

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

export function getSystemTheme(): ResolvedTheme {
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
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(mode));
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
