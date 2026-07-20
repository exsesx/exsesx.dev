"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
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

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
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

    persistThemeMode(nextMode);
  }

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("dark", isDark);
    root.classList.toggle("light", !isDark);
    root.dataset.themeMode = mode;
    paintSafariChromeSamples(isDark);
    setMetaContent("theme-color", isDark ? THEME_CHROME_COLORS.dark : THEME_CHROME_COLORS.light);
  }, [isDark, mode]);

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
                <DropdownMenuRadioItem key={option.mode} value={option.mode} className="w-full">
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
