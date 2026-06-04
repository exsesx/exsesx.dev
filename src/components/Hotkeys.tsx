"use client";

import { Command, ExternalLink, HelpCircle } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createHotkeySequencer, getHotkeySequenceKey, shouldEnableHotkeys } from "@/lib/hotkeys";
import { cn } from "@/lib/utils";

type HotkeyAction = "home" | "projects" | "github";
type ModalState = "closed" | "open" | "closing";

const HOTKEY_MODAL_EXIT_MS = 160;
const HOTKEY_SEQUENCE_EXIT_MS = 120;
const HOTKEYS: Array<{
  sequence: readonly string[];
  label: string;
  action: HotkeyAction;
  description: string;
  opensNewTab?: boolean;
  external?: boolean;
}> = [
  { sequence: ["g", "h"], label: "g h", action: "home", description: "Home" },
  { sequence: ["g", "p"], label: "g p", action: "projects", description: "Projects" },
  { sequence: ["g", "g"], label: "g g", action: "github", description: "GitHub", opensNewTab: true, external: true },
];

export default function Hotkeys() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("closed");
  const [pendingSequence, setPendingSequence] = useState<string[]>([]);
  const [exitingSequence, setExitingSequence] = useState<string[]>([]);
  const sequencer = useMemo(() => createHotkeySequencer(HOTKEYS), []);
  const isModalRendered = modalState !== "closed";
  const visibleSequence = pendingSequence.length > 0 ? pendingSequence : exitingSequence;
  const isSequenceRendered = visibleSequence.length > 0;
  const isSequenceExiting = pendingSequence.length === 0 && exitingSequence.length > 0;
  const openHotkeyModal = useCallback(() => setModalState("open"), []);
  const closeHotkeyModal = useCallback(() => {
    setModalState(current => (current === "closed" ? current : "closing"));
  }, []);
  const exitPendingSequence = useCallback(() => {
    setPendingSequence(current => {
      if (current.length > 0) {
        setExitingSequence(current);
      }

      return [];
    });
  }, []);

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
        setModalState("closed");
        setPendingSequence([]);
        setExitingSequence([]);
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
  }, [sequencer]);

  useEffect(() => {
    if (modalState !== "closing") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setModalState("closed");
    }, HOTKEY_MODAL_EXIT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [modalState]);

  useEffect(() => {
    if (exitingSequence.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setExitingSequence([]);
    }, HOTKEY_SEQUENCE_EXIT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [exitingSequence]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape" && (isModalRendered || pendingSequence.length > 0)) {
        event.preventDefault();
        sequencer.reset();
        closeHotkeyModal();
        exitPendingSequence();
        return;
      }

      if (isHelpShortcut(event)) {
        event.preventDefault();
        sequencer.reset();
        setPendingSequence([]);
        setExitingSequence([]);
        if (isModalRendered) {
          closeHotkeyModal();
        } else {
          openHotkeyModal();
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const normalizedKey = normalizeSequenceKey(event.key);

      if (!normalizedKey) {
        return;
      }

      const result = sequencer.press(normalizedKey);

      if (result.state === "idle") {
        exitPendingSequence();
        return;
      }

      event.preventDefault();

      if (result.state === "pending") {
        setExitingSequence([]);
        setPendingSequence([normalizedKey]);
      }

      if (result.state === "matched") {
        setPendingSequence([]);
        setExitingSequence([]);
        setModalState("closed");
        runHotkeyAction(result.action, router);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    closeHotkeyModal,
    exitPendingSequence,
    isEnabled,
    isModalRendered,
    openHotkeyModal,
    pendingSequence.length,
    router,
    sequencer,
  ]);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label={isModalRendered ? "Close keyboard shortcuts" : "Open keyboard shortcuts"}
        className={cn(
          "hotkeys-corner-hint liquid-glass fixed bottom-4 left-4 z-40 hidden h-11 items-center rounded-full px-1.5 text-foreground shadow-menu transition-[opacity,transform] duration-150 hover:scale-[1.03] md:inline-flex",
          isModalRendered && "z-[80]",
          isSequenceRendered && "hotkeys-corner-hint-exit",
        )}
        onClick={() => {
          setPendingSequence([]);
          setExitingSequence([]);
          sequencer.reset();
          if (isModalRendered) {
            closeHotkeyModal();
          } else {
            openHotkeyModal();
          }
        }}
      >
        <kbd className="hotkeys-trigger-key">⌘.</kbd>
        <span aria-hidden="true" className="hotkeys-trigger-dots opacity-0">
          <span />
          <span />
          <span />
        </span>
      </button>

      {isSequenceRendered ? (
        <aside
          aria-live="polite"
          aria-label={`${visibleSequence.join(" ")} pressed; awaiting next shortcut key`}
          className={cn(
            "hotkeys-chord-panel hotkeys-chord-waiting liquid-glass fixed bottom-4 left-4 z-[65] hidden h-11 items-center gap-1.5 rounded-full px-1.5 text-foreground shadow-menu md:flex",
            isSequenceExiting && "hotkeys-chord-waiting-exit",
          )}
        >
          <span className="hotkeys-wait-sequence">
            {visibleSequence.map((key, index) => (
              <span
                key={getHotkeySequenceKey("pending", key, index)}
                className="hotkeys-trigger-key hotkeys-wait-key"
                style={{ animationDelay: isSequenceExiting ? "0ms" : `${88 + index * 38}ms` }}
              >
                <kbd className="relative z-10 font-mono text-xs font-black leading-none">{key}</kbd>
              </span>
            ))}
          </span>
          <span className="hotkeys-wait-body">
            <span aria-hidden="true" className="hotkeys-trigger-dots hotkeys-wait-dots">
              <span />
              <span />
              <span />
            </span>
          </span>
        </aside>
      ) : null}

      {isModalRendered ? (
        <div className="fixed inset-0 z-[70] px-4 py-6 sm:px-6" role="presentation">
          <button
            type="button"
            aria-label="Close keyboard shortcuts"
            className={cn(
              "hotkeys-modal-backdrop absolute inset-0 bg-background/42 backdrop-blur-[2px]",
              modalState === "closing" && "hotkeys-modal-backdrop-exit",
            )}
            onClick={closeHotkeyModal}
          />
          <section
            aria-label="Keyboard shortcuts"
            className={cn(
              "hotkeys-panel liquid-glass relative mx-auto mt-20 w-full max-w-xs rounded-2xl p-2 text-foreground shadow-menu sm:mt-24",
              modalState === "closing" && "hotkeys-panel-exit",
            )}
          >
            <div className="flex items-center justify-between gap-3 px-2.5 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Command size={16} strokeWidth={2.35} />
                </span>
                <h2 className="truncate text-xs font-black tracking-normal">Hotkeys</h2>
              </div>
              <button
                type="button"
                aria-label="Close keyboard shortcuts"
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                onClick={closeHotkeyModal}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  ×
                </span>
              </button>
            </div>

            <div className="mt-1 grid gap-0.5">
              {HOTKEYS.map(shortcut => (
                <div key={shortcut.action} className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {shortcut.opensNewTab || shortcut.external ? (
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.3} />
                    ) : (
                      <HelpCircle className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.3} />
                    )}
                    <span className="truncate text-xs font-bold">{shortcut.description}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.sequence.map((key, index) => (
                      <kbd
                        key={getHotkeySequenceKey(shortcut.action, key, index)}
                        className={cn(
                          "grid min-w-6 place-items-center rounded-md border border-border bg-secondary px-1.5 py-1",
                          "font-mono text-[10px] font-black leading-none text-secondary-foreground shadow-sm",
                        )}
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-1.5 border-t border-border px-2.5 py-2 text-[11px] font-bold text-muted-foreground">
              <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
                ⌘.
              </kbd>{" "}
              toggles this menu
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

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
  if (action === "github") {
    openInNewTab("https://github.com/exsesx");
    return;
  }

  const route: Route = action === "home" ? "/" : "/projects";
  router.push(route);
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
