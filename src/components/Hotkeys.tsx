"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BriefcaseBusiness,
  Command,
  Home,
  Monitor,
  SunMoon,
  X,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ElementType, useEffect, useEffectEvent, useRef, useState } from "react";
import { getHotkeyDecision, getHotkeySequenceKey, type HotkeyRouteAction, type HotkeyState } from "@/lib/hotkeys";
import { prepareHotkeyRouteNavigation } from "@/lib/route-intent";
import { SITE_PROFILE } from "@/lib/site-profile";
import { getThemeSnapshot, parseThemeSnapshot, persistThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { GithubIcon } from "./icons/lucide-github";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

type HotkeyAction = HotkeyRouteAction | "github" | "theme-toggle" | "theme-device";
type HotkeyIcon = ElementType<{ className?: string; strokeWidth?: number }>;

const HOTKEYS: Array<{
  sequence: readonly string[];
  action: HotkeyAction;
  description: string;
  icon: HotkeyIcon;
  repeatable?: boolean;
}> = [
  { sequence: ["g", "h"], action: "home", description: "Home", icon: Home, repeatable: true },
  { sequence: ["g", "p"], action: "projects", description: "Projects", icon: BriefcaseBusiness, repeatable: true },
  { sequence: ["g", "b"], action: "blog", description: "Blog", icon: BookOpenText, repeatable: true },
  { sequence: ["g", "t"], action: "theme-toggle", description: "Toggle theme", icon: SunMoon, repeatable: true },
  { sequence: ["g", "d"], action: "theme-device", description: "Device theme", icon: Monitor, repeatable: true },
  {
    sequence: ["g", "g"],
    action: "github",
    description: "GitHub",
    icon: GithubIcon,
  },
];
const NAVBAR_HOTKEYS: Array<{
  sequence: readonly string[];
  id: string;
  description: string;
  icon: HotkeyIcon;
}> = [
  { sequence: ["⇧", "h"], id: "navbar-left", description: "Navbar left", icon: ArrowLeft },
  { sequence: ["⇧", "l"], id: "navbar-right", description: "Navbar right", icon: ArrowRight },
];
const HOTKEY_MENU_ITEMS = [
  ...HOTKEYS.map(shortcut => ({
    sequence: shortcut.sequence,
    id: shortcut.action,
    description: shortcut.description,
    icon: shortcut.icon,
  })),
  ...NAVBAR_HOTKEYS,
];
const repeatableHotkeyActions = new Set<HotkeyAction>(
  HOTKEYS.flatMap(shortcut => (shortcut.repeatable ? [shortcut.action] : [])),
);

function createInitialHotkeyState(): HotkeyState<HotkeyAction> {
  return {
    isModalOpen: false,
    lastRepeatableAction: null,
    pendingSequence: [],
  };
}

function Hotkeys() {
  const router = useRouter();
  const [hotkeyState, setHotkeyState] = useState<HotkeyState<HotkeyAction>>(createInitialHotkeyState);
  const hotkeyStateRef = useRef(hotkeyState);
  const lastPendingSequenceRef = useRef<string[]>([]);
  const isModalOpen = hotkeyState.isModalOpen;
  const pendingSequence = hotkeyState.pendingSequence;
  const isSequenceRendered = pendingSequence.length > 0;
  const displayedPendingSequence = isSequenceRendered ? pendingSequence : lastPendingSequenceRef.current;

  function commitHotkeyState(nextState: HotkeyState<HotkeyAction>) {
    if (nextState.pendingSequence.length > 0) {
      lastPendingSequenceRef.current = nextState.pendingSequence;
    }

    hotkeyStateRef.current = nextState;
    setHotkeyState(current => (areHotkeyStatesEqual(current, nextState) ? current : nextState));
  }

  function setHotkeyModalOpen(isOpen: boolean) {
    commitHotkeyState({
      ...hotkeyStateRef.current,
      isModalOpen: isOpen,
      pendingSequence: [],
    });
  }

  const handleHotkeyKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const decision = getHotkeyDecision({
      input: {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        defaultPrevented: event.defaultPrevented,
        isEditableTarget: isEditableTarget(event.target),
        key: event.key,
        metaKey: event.metaKey,
        pathname: window.location.pathname,
        shiftKey: event.shiftKey,
      },
      repeatableActions: repeatableHotkeyActions,
      shortcuts: HOTKEYS,
      state: hotkeyStateRef.current,
    });

    if (decision.preventDefault) {
      event.preventDefault();
    }

    commitHotkeyState(decision.nextState);

    if (decision.action) {
      runHotkeyAction(decision.action, router);
    }
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      handleHotkeyKeyDown(event);
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  return (
    <Dialog open={isModalOpen} onOpenChange={setHotkeyModalOpen}>
      <HotkeyHint isSequenceRendered={isSequenceRendered} sequence={displayedPendingSequence} />
      <HotkeyModal />
    </Dialog>
  );
}

export default Hotkeys;

function HotkeyHint({ isSequenceRendered, sequence }: { isSequenceRendered: boolean; sequence: string[] }) {
  return (
    <div
      lang="en"
      className="hotkeys-corner-hint glass-frost fixed bottom-4 left-4 z-[80] hidden h-11 grid-cols-1 grid-rows-1 rounded-full text-foreground shadow-menu md:grid"
      data-pending={isSequenceRendered ? "true" : "false"}
    >
      <DialogTrigger
        type="button"
        aria-label="Toggle keyboard shortcuts"
        aria-hidden={isSequenceRendered}
        className="hotkeys-corner-state hotkeys-pointer-control col-start-1 row-start-1 flex h-11 items-center gap-2 rounded-full px-1.5"
        data-visible={isSequenceRendered ? "false" : "true"}
        tabIndex={isSequenceRendered ? -1 : undefined}
      >
        <kbd aria-label="Command period" className="hotkeys-trigger-key hotkeys-command-key">
          <Command aria-hidden="true" size={13} strokeWidth={2.5} />
          <span aria-hidden="true" className="hotkeys-command-period" />
        </kbd>
        <span className="hotkeys-state-label">Shortcuts</span>
      </DialogTrigger>

      <aside
        aria-hidden={isSequenceRendered ? undefined : "true"}
        aria-label={isSequenceRendered ? `${sequence.join(" ")} pressed; awaiting next shortcut key` : undefined}
        aria-live="polite"
        className="hotkeys-chord-panel hotkeys-chord-waiting hotkeys-corner-state col-start-1 row-start-1 flex h-11 items-center gap-2 rounded-full px-1.5"
        data-visible={isSequenceRendered ? "true" : "false"}
      >
        <span className="hotkeys-wait-sequence">
          {sequence.map((key, index) => (
            <span key={getHotkeySequenceKey("pending", key, index)} className="hotkeys-trigger-key">
              <kbd className="relative z-10 font-mono text-xs font-black leading-none">{key}</kbd>
            </span>
          ))}
        </span>
        <span className="hotkeys-state-label">Pending…</span>
      </aside>
    </div>
  );
}

function HotkeyModal() {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <DialogContent
      lang="en"
      initialFocus={closeButtonRef}
      className="hotkeys-panel glass-frost relative max-w-lg rounded-[1.75rem] p-3 text-foreground shadow-menu sm:p-4"
    >
      <div className="flex items-center justify-between gap-4 px-2.5 pt-0 pb-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Command size={24} strokeWidth={2.35} />
          </span>
          <DialogTitle className="truncate text-lg font-black tracking-normal">Keyboard shortcuts</DialogTitle>
        </div>
        <DialogClose
          ref={closeButtonRef}
          aria-label="Close keyboard shortcuts"
          className="hotkeys-pointer-control grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X aria-hidden="true" size={24} strokeWidth={2.5} />
        </DialogClose>
      </div>

      <div className="mt-2 grid gap-1">
        {HOTKEY_MENU_ITEMS.map(shortcut => {
          const Icon = shortcut.icon;

          return (
            <div key={shortcut.id} className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.3} />
                <span className="truncate text-base font-bold">{shortcut.description}</span>
              </div>
              <span className="flex shrink-0 items-center gap-1.5">
                {shortcut.sequence.map((key, index) => (
                  <kbd
                    key={getHotkeySequenceKey(shortcut.id, key, index)}
                    className={cn(
                      "grid min-w-8 place-items-center rounded-lg border border-border bg-secondary px-2 py-1.5",
                      "font-mono text-xs font-black leading-none text-secondary-foreground shadow-sm",
                    )}
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-border px-3 pt-3 pb-0 text-sm font-bold text-muted-foreground sm:px-4">
        <span className="flex h-8 min-w-0 items-center gap-2">
          <kbd className="grid place-items-center rounded-lg border border-border bg-secondary px-2 py-1 font-mono text-xs leading-none text-secondary-foreground">
            ⌘.
          </kbd>
          <span className="truncate leading-5">toggles this menu</span>
        </span>
        <span className="flex h-8 shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground/60">
          <kbd className="grid place-items-center rounded-md border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-secondary-foreground/70">
            .
          </kbd>
          <span className="hidden leading-none sm:inline">repeats last</span>
        </span>
      </div>
    </DialogContent>
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']") !== null
  );
}

function runHotkeyAction(action: HotkeyAction, router: ReturnType<typeof useRouter>) {
  if (action === "theme-toggle") {
    toggleThemeMode();
    return;
  }

  if (action === "theme-device") {
    persistThemeMode("system");
    return;
  }

  if (action === "github") {
    openInNewTab(SITE_PROFILE.links.github);
    return;
  }

  const { href, transitionTypes } = prepareHotkeyRouteNavigation(action);

  router.push(href as Route, { transitionTypes });
}

function areHotkeyStatesEqual(left: HotkeyState<HotkeyAction>, right: HotkeyState<HotkeyAction>) {
  return (
    left.isModalOpen === right.isModalOpen &&
    left.lastRepeatableAction === right.lastRepeatableAction &&
    left.pendingSequence.length === right.pendingSequence.length &&
    left.pendingSequence.every((key, index) => key === right.pendingSequence[index])
  );
}

function toggleThemeMode() {
  const { resolvedTheme } = parseThemeSnapshot(getThemeSnapshot());
  persistThemeMode(resolvedTheme === "dark" ? "light" : "dark");
}

function openInNewTab(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}
