"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
  const themeFrameRef = useRef<number | null>(null);
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { mode, resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const isDark = resolvedTheme === "dark";
  const activeOption = themeOptions.find(option => option.mode === mode) ?? themeOptions[2];
  const ActiveIcon = activeOption.icon;

  function selectThemeMode(nextMode: ThemeMode) {
    flushSync(() => setIsOpen(false));

    if (themeFrameRef.current !== null) {
      window.cancelAnimationFrame(themeFrameRef.current);
    }

    themeFrameRef.current = window.requestAnimationFrame(() => {
      themeFrameRef.current = null;
      persistThemeMode(nextMode);
    });
  }

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.dataset.themeMode = mode;
    setMetaContent("theme-color", isDark ? "#101111" : "#f8f1e7");
  }, [isDark, mode]);

  useEffect(() => {
    return () => {
      if (themeFrameRef.current !== null) {
        window.cancelAnimationFrame(themeFrameRef.current);
      }
    };
  }, []);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="glass"
            size="icon"
            className="relative cursor-pointer active:scale-[0.97]"
            aria-label={`Theme: ${activeOption.label}`}
          />
        }
      >
        <ActiveIcon strokeWidth={2.2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" aria-label="Choose color theme" className="w-44 origin-top-right">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={value => {
            if (isThemeMode(value)) {
              selectThemeMode(value);
            }
          }}
        >
          <DropdownMenuGroup>
            {themeOptions.map(option => {
              const Icon = option.icon;
              const isActive = option.mode === mode;

              return (
                <DropdownMenuRadioItem
                  key={option.mode}
                  value={option.mode}
                  className="w-full"
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectThemeMode(option.mode);
                    }
                  }}
                  onPointerDown={event => {
                    if (event.button === 0) {
                      selectThemeMode(option.mode);
                    }
                  }}
                >
                  <Icon data-icon="inline-start" strokeWidth={2.2} />
                  <span className="min-w-0 flex-1 font-bold leading-none">{option.label}</span>
                  {isActive ? <Check data-icon="inline-end" strokeWidth={2.4} /> : <span aria-hidden="true" />}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
