"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MOTION_DATASET_KEYS } from "@/lib/motion-contract";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  isThemeMode,
  parseThemeSnapshot,
  persistThemeMode,
  subscribeToTheme,
  THEME_CHROME_COLORS,
  type ThemeMode,
} from "@/lib/theme";
import {
  canUseDesktopViewTransitions,
  type NativeViewTransitionDocument,
  startDocumentViewTransition,
} from "@/lib/view-transitions";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

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
const systemThemeOption = themeOptions.find(option => option.mode === "system") ?? themeOptions[0];

function setMetaContent(name: string, content: string) {
  let metas = Array.from(document.querySelectorAll<HTMLMetaElement>(`meta[name="${name}"]`));

  if (metas.length === 0) {
    if (name === "theme-color") {
      return;
    }

    const meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
    metas = [meta];
  }

  if (name === "theme-color") {
    for (const [index, meta] of metas.entries()) {
      if (index > 0) {
        meta.remove();
        continue;
      }

      if (meta.content !== content) {
        meta.content = content;
      }

      if (meta.hasAttribute("media")) {
        meta.removeAttribute("media");
      }
    }

    return;
  }

  for (const meta of metas) {
    if (meta.content !== content) {
      meta.content = content;
    }
  }
}

function paintSafariChromeSamples(isDark: boolean) {
  const color = isDark ? THEME_CHROME_COLORS.dark : THEME_CHROME_COLORS.light;
  const scheme = isDark ? "dark" : "light";
  const root = document.documentElement;

  root.style.setProperty("--background", color);
  root.style.setProperty("--safari-chrome-color", color);
  root.style.backgroundColor = color;
  root.style.colorScheme = scheme;
  document.body.style.backgroundColor = color;
  document.body.style.colorScheme = scheme;

  for (const sample of document.querySelectorAll<HTMLElement>("[data-safari-chrome-sample]")) {
    sample.style.backgroundColor = color;
    sample.style.colorScheme = scheme;
  }
}

function getThemeTransitionOrigin(element: HTMLElement | null) {
  const rect = element?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const radius = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 16;

  return { radius, x, y };
}

function shouldUseThemeViewTransition() {
  return (
    typeof document !== "undefined" &&
    typeof (document as NativeViewTransitionDocument).startViewTransition === "function" &&
    canUseDesktopViewTransitions() &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function persistThemeModeWithTransition(mode: ThemeMode, originElement: HTMLElement | null) {
  if (!shouldUseThemeViewTransition()) {
    persistThemeMode(mode);
    return;
  }

  const root = document.documentElement;
  const { radius, x, y } = getThemeTransitionOrigin(originElement);

  root.style.setProperty("--theme-transition-x", `${x}px`);
  root.style.setProperty("--theme-transition-y", `${y}px`);
  root.style.setProperty("--theme-transition-radius", `${radius}px`);
  root.dataset[MOTION_DATASET_KEYS.themeTransition] = "active";

  const cleanup = () => {
    delete root.dataset[MOTION_DATASET_KEYS.themeTransition];
    root.style.removeProperty("--theme-transition-x");
    root.style.removeProperty("--theme-transition-y");
    root.style.removeProperty("--theme-transition-radius");
  };
  let didPersistThemeMode = false;
  const persistThemeModeOnce = () => {
    if (didPersistThemeMode) {
      return;
    }

    didPersistThemeMode = true;
    persistThemeMode(mode);
  };

  try {
    const transition = startDocumentViewTransition(document as NativeViewTransitionDocument, persistThemeModeOnce);

    if (!transition) {
      cleanup();
      persistThemeModeOnce();
      return;
    }

    void transition.finished.then(cleanup, cleanup);
  } catch {
    cleanup();
    persistThemeModeOnce();
  }
}

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const themeFrameRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const { mode, resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const isDark = resolvedTheme === "dark";
  const activeOption = themeOptions.find(option => option.mode === mode) ?? systemThemeOption;
  const ActiveIcon = activeOption.icon;

  function selectThemeMode(nextMode: ThemeMode) {
    setIsOpen(false);

    if (nextMode === mode) {
      return;
    }

    if (themeFrameRef.current !== null) {
      window.cancelAnimationFrame(themeFrameRef.current);
    }

    themeFrameRef.current = window.requestAnimationFrame(() => {
      themeFrameRef.current = null;
      persistThemeModeWithTransition(nextMode, triggerRef.current);
    });
  }

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.dataset.themeMode = mode;
    paintSafariChromeSamples(isDark);
    setMetaContent("theme-color", isDark ? THEME_CHROME_COLORS.dark : THEME_CHROME_COLORS.light);
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
            ref={triggerRef}
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

      <DropdownMenuContent align="end" className="w-44">
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
