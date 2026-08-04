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
import { useBlogFocus } from "./blog/BlogFocusProvider";
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

function setThemeColor(content: string) {
  const [meta, ...duplicates] = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    return;
  }

  for (const duplicate of duplicates) {
    duplicate.remove();
  }

  if (meta.content !== content) {
    meta.content = content;
  }

  meta.removeAttribute("media");
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
  const { isFocusMode } = useBlogFocus();
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
    setThemeColor(isDark ? THEME_CHROME_COLORS.dark : THEME_CHROME_COLORS.light);
  }, [isDark, mode]);

  useEffect(() => {
    if (isFocusMode) {
      setIsOpen(false);
    }
  }, [isFocusMode]);

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen && !isFocusMode}>
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

      <DropdownMenuContent className="w-44">
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
                <DropdownMenuRadioItem key={option.mode} value={option.mode}>
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
