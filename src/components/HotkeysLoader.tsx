"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import {
  getHotkeyDecision,
  getPlatformModifierKey,
  isEditableTarget,
  type QueuedHotkey,
  shouldEnableHotkeys,
} from "@/lib/hotkeys";
import { useBlogFocus } from "./blog/BlogFocusProvider";

const Hotkeys = dynamic(() => import("./Hotkeys"), {
  ssr: false,
});

const MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);
const OPEN_MENU_KEY: QueuedHotkey = { key: "/", ctrlKey: true };

/*
 * The shortcut dialog loads on intent: the first keydown outside a text field,
 * or a pointer or focus on the corner hint. Until then a keydown listener and a
 * static copy of the hint's resting face stand in. Keys pressed meanwhile are
 * queued and handed to the dialog when it mounts, so a first ⌘/ or g h works.
 */
export default function HotkeysLoader() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isHandedOff, setIsHandedOff] = useState(false);
  const { isFocusMode } = useBlogFocus();
  const queuedKeysRef = useRef<QueuedHotkey[]>([]);
  const isHandedOffRef = useRef(false);
  const standInRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    function handleChange() {
      setIsEnabled(
        shouldEnableHotkeys({
          hasHover: hoverQuery.matches,
          hasCoarsePointer: coarsePointerQuery.matches,
        }),
      );
      setIsDesktopViewport(desktopQuery.matches);
    }

    handleChange();
    hoverQuery.addEventListener("change", handleChange);
    coarsePointerQuery.addEventListener("change", handleChange);
    desktopQuery.addEventListener("change", handleChange);

    return () => {
      hoverQuery.removeEventListener("change", handleChange);
      coarsePointerQuery.removeEventListener("change", handleChange);
      desktopQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const queueKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isHandedOffRef.current || event.defaultPrevented || isEditableTarget(event.target)) {
      return;
    }

    setShouldLoad(true);

    if (MODIFIER_KEYS.has(event.key)) {
      return;
    }

    // Only the modifier and Escape shortcuts have browser defaults worth blocking, and
    // the dialog's decision for those does not depend on its shortcut list or state.
    const decision = getHotkeyDecision({
      input: {
        altKey: event.altKey,
        characterShortcutsEnabled: false,
        ctrlKey: event.ctrlKey,
        isBlogFocusActive: isFocusMode,
        isBlogFocusShortcutEnabled: isDesktopViewport,
        key: event.key,
        metaKey: event.metaKey,
        pathname: window.location.pathname,
        shiftKey: event.shiftKey,
      },
      repeatableActions: new Set<string>(),
      shortcuts: [],
      state: { isModalOpen: false, lastRepeatableAction: null, pendingSequence: [] },
    });

    if (decision.preventDefault) {
      event.preventDefault();
    }

    queuedKeysRef.current.push({
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      key: event.key,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });
  });

  useEffect(() => {
    if (isHandedOff) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      queueKeyDown(event);
    }

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isHandedOff]);

  // Called once by the dialog as it starts listening, so no key is handled twice.
  const takeQueuedKeys = useCallback(() => {
    const queuedKeys = queuedKeysRef.current;
    const standInHadFocus = standInRef.current !== null && standInRef.current === document.activeElement;

    queuedKeysRef.current = [];
    isHandedOffRef.current = true;
    setIsHandedOff(true);

    if (standInHadFocus) {
      document.querySelector<HTMLElement>(".hotkeys-corner-hint:not([data-hotkeys-stand-in])")?.focus();
    }

    return queuedKeys;
  }, []);

  function loadHotkeys() {
    setShouldLoad(true);
  }

  function openOnLoad() {
    const lastQueuedKey = queuedKeysRef.current.at(-1);
    const isMenuToggleQueued = lastQueuedKey?.key === "/" && Boolean(lastQueuedKey.ctrlKey || lastQueuedKey.metaKey);

    // The click asks for the menu open. A toggle already queued opens it; a second one would close it again on replay.
    if (!isMenuToggleQueued) {
      queuedKeysRef.current.push(OPEN_MENU_KEY);
    }

    loadHotkeys();
  }

  return (
    <>
      {isEnabled && !isHandedOff ? (
        <button
          ref={standInRef}
          lang="en"
          type="button"
          aria-label="Toggle keyboard shortcuts"
          aria-keyshortcuts="Meta+/ Control+/"
          // Same classes as the dialog trigger in Hotkeys.tsx, so the swap is invisible.
          className="hotkeys-corner-hint glass-frost hotkeys-pointer-control fixed bottom-4 left-4 z-[80] hidden h-9 cursor-pointer grid-cols-1 grid-rows-1 rounded-xl text-foreground md:grid"
          data-hotkeys-stand-in=""
          data-pending="false"
          onClick={openOnLoad}
          onFocus={loadHotkeys}
          onPointerEnter={loadHotkeys}
        >
          <span
            aria-hidden="true"
            className="hotkeys-corner-state col-start-1 row-start-1 flex h-9 items-center justify-center px-2"
            data-visible="true"
          >
            <span className="hotkeys-wait-sequence">
              <kbd className="hotkeys-trigger-key hotkeys-command-key">{getPlatformModifierKey().key}</kbd>
              <kbd className="hotkeys-trigger-key">/</kbd>
            </span>
          </span>
        </button>
      ) : null}

      {shouldLoad ? (
        <Hotkeys allowBlogFocusShortcut={isDesktopViewport} showHint={isEnabled} takeQueuedKeys={takeQueuedKeys} />
      ) : null}
    </>
  );
}
