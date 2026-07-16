"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shouldEnableHotkeys } from "@/lib/hotkeys";

const Hotkeys = dynamic(() => import("./Hotkeys"), {
  ssr: false,
});

export default function HotkeysLoader() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    function handleChange() {
      setIsEnabled(
        shouldEnableHotkeys({
          hasHover: hoverQuery.matches,
          hasCoarsePointer: coarsePointerQuery.matches,
        }),
      );
    }

    handleChange();
    hoverQuery.addEventListener("change", handleChange);
    coarsePointerQuery.addEventListener("change", handleChange);

    return () => {
      hoverQuery.removeEventListener("change", handleChange);
      coarsePointerQuery.removeEventListener("change", handleChange);
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return <Hotkeys />;
}
