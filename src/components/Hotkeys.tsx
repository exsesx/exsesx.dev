"use client";

import { BriefcaseBusiness, Command, Home, Monitor, SunMoon, X } from "lucide-react";
import type { Variants } from "motion/react";
import { AnimatePresence, domAnimation, LazyMotion, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type ElementType, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createHotkeySequencer, getHotkeySequenceKey, shouldEnableHotkeys } from "@/lib/hotkeys";
import { getThemeSnapshot, parseThemeSnapshot, persistThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { GithubIcon } from "./icons/lucide-github";

type HotkeyAction = "home" | "projects" | "github" | "theme-toggle" | "theme-device";
type HotkeyIcon = ElementType<{ className?: string; strokeWidth?: number }>;

const motionEaseOut = [0.23, 1, 0.32, 1] as const;
const motionLinear = [0, 0, 1, 1] as const;
const HOTKEYS: Array<{
  sequence: readonly string[];
  label: string;
  action: HotkeyAction;
  description: string;
  icon: HotkeyIcon;
  opensNewTab?: boolean;
  external?: boolean;
}> = [
  { sequence: ["g", "h"], label: "g h", action: "home", description: "Home", icon: Home },
  { sequence: ["g", "p"], label: "g p", action: "projects", description: "Projects", icon: BriefcaseBusiness },
  { sequence: ["g", "t"], label: "g t", action: "theme-toggle", description: "Toggle theme", icon: SunMoon },
  { sequence: ["g", "d"], label: "g d", action: "theme-device", description: "Device theme", icon: Monitor },
  {
    sequence: ["g", "g"],
    label: "g g",
    action: "github",
    description: "GitHub",
    icon: GithubIcon,
    opensNewTab: true,
    external: true,
  },
];
const repeatableHotkeyActions = new Set<HotkeyAction>(
  HOTKEYS.filter(shortcut => !shortcut.external && !shortcut.opensNewTab).map(shortcut => shortcut.action),
);

const hintVariants = {
  idle: {
    opacity: 1,
    pointerEvents: "auto",
    transform: "translate3d(0, 0, 0) scale(1)",
    transition: { duration: 0.12, ease: motionEaseOut },
  },
  sequence: {
    opacity: 0,
    pointerEvents: "none",
    transform: "translate3d(0, 0.34rem, 0) scale(0.985)",
    transition: { duration: 0.1, ease: motionEaseOut },
  },
} satisfies Variants;

const reducedHintVariants = {
  idle: {
    opacity: 1,
    pointerEvents: "auto",
    transition: { duration: 0.1, ease: motionLinear },
  },
  sequence: {
    opacity: 0,
    pointerEvents: "none",
    transition: { duration: 0.08, ease: motionLinear },
  },
} satisfies Variants;

const sequencePanelVariants = {
  initial: {
    opacity: 0,
    transform: "translate3d(0, 0.28rem, 0) scale(0.985)",
  },
  animate: {
    opacity: 1,
    transform: "translate3d(0, 0, 0) scale(1)",
    transition: { duration: 0.13, ease: motionEaseOut, delayChildren: 0.05, staggerChildren: 0.035 },
  },
  exit: {
    opacity: 0,
    transform: "translate3d(0, 0.28rem, 0) scale(0.985)",
    transition: { duration: 0.1, ease: motionEaseOut },
  },
} satisfies Variants;

const reducedSequencePanelVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1, ease: motionLinear } },
  exit: { opacity: 0, transition: { duration: 0.08, ease: motionLinear } },
} satisfies Variants;

const sequenceChildVariants = {
  initial: {
    opacity: 0,
    transform: "translate3d(0, 0.2rem, 0) scale(0.96)",
  },
  animate: {
    opacity: 1,
    transform: "translate3d(0, 0, 0) scale(1)",
    transition: { duration: 0.12, ease: motionEaseOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: motionEaseOut },
  },
} satisfies Variants;

const reducedSequenceChildVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.08, ease: motionLinear } },
  exit: { opacity: 0, transition: { duration: 0.06, ease: motionLinear } },
} satisfies Variants;

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15, ease: motionEaseOut } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: motionEaseOut } },
} satisfies Variants;

const panelVariants = {
  initial: {
    opacity: 0,
    filter: "blur(2px)",
    transform: "translate3d(0, -0.375rem, 0) scale(0.965)",
  },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transform: "translate3d(0, 0, 0) scale(1)",
    transition: { duration: 0.17, ease: motionEaseOut, delayChildren: 0.04, staggerChildren: 0.028 },
  },
  exit: {
    opacity: 0,
    filter: "blur(1px)",
    transform: "translate3d(0, -0.25rem, 0) scale(0.975)",
    transition: { duration: 0.12, ease: motionEaseOut },
  },
} satisfies Variants;

const reducedPanelVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12, ease: motionLinear } },
  exit: { opacity: 0, transition: { duration: 0.1, ease: motionLinear } },
} satisfies Variants;

const modalChildVariants = {
  initial: {
    opacity: 0,
    transform: "translate3d(0, -0.18rem, 0)",
  },
  animate: {
    opacity: 1,
    transform: "translate3d(0, 0, 0)",
    transition: { duration: 0.13, ease: motionEaseOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: motionEaseOut },
  },
} satisfies Variants;

const reducedModalChildVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.08, ease: motionLinear } },
  exit: { opacity: 0, transition: { duration: 0.06, ease: motionLinear } },
} satisfies Variants;

const Hotkeys = memo(function Hotkeys() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingSequence, setPendingSequence] = useState<string[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const isModalOpenRef = useRef(false);
  const lastRepeatableActionRef = useRef<HotkeyAction | null>(null);
  const pendingSequenceRef = useRef<string[]>([]);
  const sequencer = useMemo(() => createHotkeySequencer(HOTKEYS), []);
  const isSequenceRendered = pendingSequence.length > 0;
  const commitModalOpen = useCallback((nextIsOpen: boolean) => {
    isModalOpenRef.current = nextIsOpen;
    setIsModalOpen(current => (current === nextIsOpen ? current : nextIsOpen));
  }, []);
  const commitPendingSequence = useCallback((nextSequence: string[]) => {
    pendingSequenceRef.current = nextSequence;
    setPendingSequence(current =>
      current.length === nextSequence.length && current.every((key, index) => key === nextSequence[index])
        ? current
        : nextSequence,
    );
  }, []);
  const clearPendingSequence = useCallback(() => {
    commitPendingSequence([]);
  }, [commitPendingSequence]);
  const toggleHotkeyModal = useCallback(() => {
    sequencer.reset();
    clearPendingSequence();
    commitModalOpen(!isModalOpenRef.current);
  }, [clearPendingSequence, commitModalOpen, sequencer]);
  const closeHotkeyModal = useCallback(() => {
    commitModalOpen(false);
  }, [commitModalOpen]);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  useEffect(() => {
    pendingSequenceRef.current = pendingSequence;
  }, [pendingSequence]);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    function syncEnabledState() {
      const nextIsEnabled = shouldEnableHotkeys({
        hasHover: hoverQuery.matches,
        hasCoarsePointer: coarsePointerQuery.matches,
      });

      setIsEnabled(nextIsEnabled);

      if (!nextIsEnabled) {
        commitModalOpen(false);
        clearPendingSequence();
        sequencer.reset();
      }
    }

    syncEnabledState();
    hoverQuery.addEventListener("change", syncEnabledState);
    coarsePointerQuery.addEventListener("change", syncEnabledState);

    return () => {
      hoverQuery.removeEventListener("change", syncEnabledState);
      coarsePointerQuery.removeEventListener("change", syncEnabledState);
    };
  }, [clearPendingSequence, commitModalOpen, sequencer]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape" && (isModalOpenRef.current || pendingSequenceRef.current.length > 0)) {
        event.preventDefault();
        sequencer.reset();
        closeHotkeyModal();
        clearPendingSequence();
        return;
      }

      if (isHelpShortcut(event)) {
        event.preventDefault();
        sequencer.reset();
        clearPendingSequence();
        commitModalOpen(!isModalOpenRef.current);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const normalizedKey = normalizeSequenceKey(event.key);

      if (!normalizedKey) {
        return;
      }

      if (normalizedKey === "." && pendingSequenceRef.current.length === 0) {
        if (lastRepeatableActionRef.current === null) {
          return;
        }

        event.preventDefault();
        sequencer.reset();
        clearPendingSequence();
        commitModalOpen(false);
        runHotkeyAction(lastRepeatableActionRef.current, router);
        return;
      }

      const result = sequencer.press(normalizedKey);

      if (result.state === "idle") {
        clearPendingSequence();
        return;
      }

      event.preventDefault();

      if (result.state === "pending") {
        commitPendingSequence([normalizedKey]);
      }

      if (result.state === "matched") {
        if (repeatableHotkeyActions.has(result.action)) {
          lastRepeatableActionRef.current = result.action;
        }

        clearPendingSequence();
        commitModalOpen(false);
        runHotkeyAction(result.action, router);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearPendingSequence, closeHotkeyModal, commitModalOpen, commitPendingSequence, isEnabled, router, sequencer]);

  if (!isEnabled) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <HotkeyHint
        isSequenceRendered={isSequenceRendered}
        reduceMotion={shouldReduceMotion}
        onToggle={toggleHotkeyModal}
      />

      <AnimatePresence initial={false}>
        {isSequenceRendered ? (
          <PendingSequence
            key={pendingSequence.join(" ")}
            reduceMotion={shouldReduceMotion}
            sequence={pendingSequence}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isModalOpen ? <HotkeyModal reduceMotion={shouldReduceMotion} onClose={closeHotkeyModal} /> : null}
      </AnimatePresence>
    </LazyMotion>
  );
});

export default Hotkeys;

const HotkeyHint = memo(function HotkeyHint({
  isSequenceRendered,
  reduceMotion,
  onToggle,
}: {
  isSequenceRendered: boolean;
  reduceMotion: boolean | null;
  onToggle: () => void;
}) {
  return (
    <m.button
      type="button"
      aria-label="Toggle keyboard shortcuts"
      animate={isSequenceRendered ? "sequence" : "idle"}
      className="hotkeys-corner-hint liquid-glass fixed bottom-4 left-4 z-[80] hidden h-11 items-center rounded-full px-1.5 text-foreground shadow-menu md:inline-flex"
      variants={reduceMotion ? reducedHintVariants : hintVariants}
      whileTap={reduceMotion ? undefined : { transform: "translate3d(0, 0, 0) scale(0.97)" }}
      onClick={onToggle}
    >
      <kbd aria-label="Command period" className="hotkeys-trigger-key hotkeys-command-key">
        <Command aria-hidden="true" size={13} strokeWidth={2.5} />
        <span aria-hidden="true" className="hotkeys-command-period" />
      </kbd>
      <span aria-hidden="true" className="hotkeys-trigger-dots opacity-0">
        <span />
        <span />
        <span />
      </span>
    </m.button>
  );
});

const PendingSequence = memo(function PendingSequence({
  reduceMotion,
  sequence,
}: {
  reduceMotion: boolean | null;
  sequence: string[];
}) {
  const panelMotion = reduceMotion ? reducedSequencePanelVariants : sequencePanelVariants;
  const childMotion = reduceMotion ? reducedSequenceChildVariants : sequenceChildVariants;

  return (
    <m.aside
      aria-live="polite"
      aria-label={`${sequence.join(" ")} pressed; awaiting next shortcut key`}
      className="hotkeys-chord-panel hotkeys-chord-waiting liquid-glass fixed bottom-4 left-4 z-[65] hidden h-11 items-center gap-1.5 rounded-full px-1.5 text-foreground shadow-menu md:flex"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={panelMotion}
    >
      <span className="hotkeys-wait-sequence">
        {sequence.map((key, index) => (
          <m.span
            key={getHotkeySequenceKey("pending", key, index)}
            className="hotkeys-trigger-key hotkeys-wait-key"
            variants={childMotion}
          >
            <kbd className="relative z-10 font-mono text-xs font-black leading-none">{key}</kbd>
          </m.span>
        ))}
      </span>
      <m.span className="hotkeys-wait-body" variants={childMotion}>
        <span aria-hidden="true" className="hotkeys-trigger-dots hotkeys-wait-dots">
          <span />
          <span />
          <span />
        </span>
      </m.span>
    </m.aside>
  );
});

const HotkeyModal = memo(function HotkeyModal({
  reduceMotion,
  onClose,
}: {
  reduceMotion: boolean | null;
  onClose: () => void;
}) {
  const activePanelVariants = reduceMotion ? reducedPanelVariants : panelVariants;
  const activeChildVariants = reduceMotion ? reducedModalChildVariants : modalChildVariants;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 sm:px-6" role="presentation">
      <m.button
        type="button"
        aria-label="Close keyboard shortcuts"
        className="hotkeys-modal-backdrop absolute inset-0 bg-background/42 backdrop-blur-[2px]"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={backdropVariants}
        onClick={onClose}
      />
      <m.section
        aria-label="Keyboard shortcuts"
        className="hotkeys-panel liquid-glass relative w-full max-w-lg rounded-[1.75rem] p-3 text-foreground shadow-menu sm:p-4"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={activePanelVariants}
      >
        <m.div
          className="flex items-center justify-between gap-4 px-2.5 pt-0 pb-2 sm:px-3"
          variants={activeChildVariants}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Command size={24} strokeWidth={2.35} />
            </span>
            <h2 className="truncate text-lg font-black tracking-normal">Hotkeys</h2>
          </div>
          <button
            type="button"
            aria-label="Close keyboard shortcuts"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            <X aria-hidden="true" size={24} strokeWidth={2.5} />
          </button>
        </m.div>

        <m.div className="mt-2 grid gap-1" variants={activeChildVariants}>
          {HOTKEYS.map(shortcut => {
            const Icon = shortcut.icon;

            return (
              <m.div
                key={shortcut.action}
                className="flex items-center justify-between gap-4 rounded-2xl px-3 py-3 sm:px-4"
                variants={activeChildVariants}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={2.3} />
                  <span className="truncate text-base font-bold">{shortcut.description}</span>
                </div>
                <span className="flex shrink-0 items-center gap-1.5">
                  {shortcut.sequence.map((key, index) => (
                    <kbd
                      key={getHotkeySequenceKey(shortcut.action, key, index)}
                      className={cn(
                        "grid min-w-8 place-items-center rounded-lg border border-border bg-secondary px-2 py-1.5",
                        "font-mono text-xs font-black leading-none text-secondary-foreground shadow-sm",
                      )}
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
              </m.div>
            );
          })}
        </m.div>

        <m.div
          className="mt-2 flex items-center justify-between gap-3 border-t border-border px-3 pt-3 pb-0 text-sm font-bold text-muted-foreground sm:px-4"
          variants={activeChildVariants}
        >
          <span className="flex h-8 min-w-0 items-center gap-2">
            <kbd className="grid place-items-center rounded-lg border border-border bg-secondary px-2 py-1 font-mono text-xs leading-none text-secondary-foreground">
              ⌘.
            </kbd>
            <span className="truncate leading-none">toggles this menu</span>
          </span>
          <span className="flex h-8 shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground/60">
            <kbd className="grid place-items-center rounded-md border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[0.6875rem] leading-none text-secondary-foreground/70">
              .
            </kbd>
            <span className="hidden leading-none sm:inline">repeats last</span>
          </span>
        </m.div>
      </m.section>
    </div>
  );
});

function normalizeSequenceKey(key: string) {
  return key.length === 1 ? key : undefined;
}

function isHelpShortcut(event: KeyboardEvent) {
  return event.metaKey && (event.key === "." || event.key === "?" || (event.key === "/" && event.shiftKey));
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
    openInNewTab("https://github.com/exsesx");
    return;
  }

  const route: Route = action === "home" ? "/" : "/projects";
  router.push(route);
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
