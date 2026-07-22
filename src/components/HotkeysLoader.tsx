"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shouldEnableHotkeys } from "@/lib/hotkeys";

const Hotkeys = dynamic(() => import("./Hotkeys"), {
  ssr: false,
});

export default function HotkeysLoader() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);

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

  return <Hotkeys allowBlogFocusShortcut={isDesktopViewport} showHint={isEnabled} />;
}
