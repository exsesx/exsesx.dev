"use client";

import { Activity, Pause, Volume2, VolumeX } from "lucide";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { MorphIcon } from "morphicons/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getServerSoundEffectsSnapshot,
  getSoundEffectsSnapshot,
  playInteractionSound,
  playPopupToggleSound,
  setSoundEffectsEnabled,
  subscribeToSoundEffects,
} from "@/lib/interaction-sounds";
import {
  getMotionSnapshot,
  getServerMotionSnapshot,
  setMotionEnabled,
  subscribeToMotion,
} from "@/lib/motion-preference";
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
import { cn } from "@/lib/utils";
import { useBlogFocus } from "./blog/BlogFocusProvider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');

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
  const { isFocusMode, isPassiveHeaderHidden } = useBlogFocus();
  const [isOpen, setIsOpen] = useState(false);
  const themeSnapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const soundEffectsEnabled = useSyncExternalStore(
    subscribeToSoundEffects,
    getSoundEffectsSnapshot,
    getServerSoundEffectsSnapshot,
  );
  const motionSetting = useSyncExternalStore(subscribeToMotion, getMotionSnapshot, getServerMotionSnapshot);
  const motionOn = motionSetting === "on";
  const motionReduced = motionSetting === "reduced";
  const { mode, resolvedTheme } = parseThemeSnapshot(themeSnapshot);
  const isDark = resolvedTheme === "dark";
  const activeOption = themeOptions.find(option => option.mode === mode) ?? systemThemeOption;
  const ActiveIcon = activeOption.icon;

  function selectThemeMode(nextMode: ThemeMode) {
    setIsOpen(false);

    if (nextMode === mode) {
      return;
    }

    playInteractionSound("toggle");
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
    if (isFocusMode || isPassiveHeaderHidden) {
      setIsOpen(false);
    }
  }, [isFocusMode, isPassiveHeaderHidden]);

  return (
    <DropdownMenu
      onOpenChange={(open, eventDetails) => {
        playPopupToggleSound(open, eventDetails.reason, eventDetails.event.target);
        setIsOpen(open);
      }}
      open={isOpen && !isFocusMode && !isPassiveHeaderHidden}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="nav"
            size="icon"
            className="relative cursor-pointer"
            aria-label={`Theme: ${activeOption.label}. Sound effects: ${soundEffectsEnabled ? "on" : "off"}. Motion: ${motionOn ? "on" : "off"}`}
          />
        }
      >
        <ActiveIcon strokeWidth={2.2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52" prewarm>
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
                  <span className={cn("min-w-0 flex-1 leading-none", isActive ? "font-bold" : "font-medium")}>
                    {option.label}
                  </span>
                  {isActive ? <Check data-icon="inline-end" strokeWidth={2.4} /> : <span aria-hidden="true" />}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={soundEffectsEnabled}
            closeOnClick={false}
            onCheckedChange={setSoundEffectsEnabled}
          >
            <MorphIcon
              icon={soundEffectsEnabled ? Volume2 : VolumeX}
              data-icon="inline-start"
              strokeWidth={2.2}
              spring="snappy"
              reducedMotion="user"
            />
            <span className="min-w-0 flex-1 font-bold leading-none">Sound effects</span>
            <span className="text-xs font-bold text-muted-foreground">{soundEffectsEnabled ? "On" : "Off"}</span>
          </DropdownMenuCheckboxItem>
          {/* The OS setting outranks this one: with reduced motion on, the item
              reports it and stays off. */}
          <DropdownMenuCheckboxItem
            checked={motionOn}
            closeOnClick={false}
            disabled={motionReduced}
            onCheckedChange={checked => {
              playInteractionSound("toggle");
              setMotionEnabled(checked);
            }}
          >
            <MorphIcon
              icon={motionOn ? Activity : Pause}
              data-icon="inline-start"
              strokeWidth={2.2}
              spring="snappy"
              reducedMotion="user"
            />
            <span className="min-w-0 flex-1 font-bold leading-none">Motion</span>
            <span className="text-xs font-bold text-muted-foreground">
              {motionReduced ? "Reduced" : motionOn ? "On" : "Off"}
            </span>
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
