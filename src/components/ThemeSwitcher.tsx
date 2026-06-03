"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "exsesx:color-scheme";
const THEME_CHANGE_EVENT = "exsesx:theme-change";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  {
    mode: "light",
    label: "Light",
    icon: Sun,
  },
  {
    mode: "dark",
    label: "Dark",
    icon: Moon,
  },
  {
    mode: "system",
    label: "Device",
    icon: Monitor,
  },
];

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

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

function getThemeSnapshot() {
  const mode = getStoredThemeMode();
  const resolvedTheme = mode === "system" ? getSystemTheme() : mode;

  return `${mode}:${resolvedTheme}`;
}

function subscribeToTheme(callback: () => void) {
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

function getServerThemeSnapshot() {
  return "system:light";
}

function persistThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mode));
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function setMetaContent(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
}

function parseThemeSnapshot(snapshot: string) {
  const [mode = "system", resolvedTheme = "light"] = snapshot.split(":");

  return {
    mode: isThemeMode(mode) ? mode : "system",
    resolvedTheme: resolvedTheme === "dark" ? "dark" : "light",
  } satisfies {
    mode: ThemeMode;
    resolvedTheme: ResolvedTheme;
  };
}

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { mode, resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const isDark = resolvedTheme === "dark";
  const activeOption = themeOptions.find(option => option.mode === mode) ?? themeOptions[2];
  const ActiveIcon = activeOption.icon;

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.dataset.themeMode = mode;
    setMetaContent("theme-color", isDark ? "#101111" : "#f8f1e7");
  }, [isDark, mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeOnOutsidePress(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="glass"
        size="icon"
        className="relative active:scale-[0.97]"
        aria-label={`Theme: ${activeOption.label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(current => !current)}
      >
        <ActiveIcon strokeWidth={2.2} />
      </Button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Choose color theme"
          className="theme-menu liquid-glass absolute right-0 top-12 z-50 w-44 rounded-2xl p-1.5 shadow-menu"
        >
          {themeOptions.map(option => {
            const Icon = option.icon;
            const isActive = option.mode === mode;

            return (
              <button
                key={option.mode}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                className={cn(
                  "theme-menu-item grid h-11 w-full grid-cols-[1.25rem_1fr_1.25rem] items-center gap-3 rounded-xl px-3 text-left text-sm transition-[background-color,color,transform] duration-150 ease-[var(--ease-weight)] active:scale-[0.97]",
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted hover:text-accent",
                )}
                onClick={() => {
                  persistThemeMode(option.mode);
                  setIsOpen(false);
                }}
              >
                <Icon data-icon="inline-start" strokeWidth={2.2} />
                <span className="min-w-0 flex-1 font-bold leading-none">{option.label}</span>
                {isActive ? <Check data-icon="inline-end" strokeWidth={2.4} /> : <span aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
