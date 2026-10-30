"use client";

import { useEffect } from "react";
import { SITE_PROFILE } from "@/lib/site-profile";

/*
 * A note for whoever opens the devtools console: the site's pulse in ASCII,
 * signed, and where the keyboard shortcuts live. Printed once per page load
 * (the module flag survives client navigations and Strict Mode's second effect).
 */
const PULSE = String.raw`
            |\
            | \
   .-.      |  \      .--.
__/   \___  |   \  __/    \_______ ${SITE_PROFILE.domain}
          \_|    \/
`;

let printed = false;

export default function ConsoleSignature() {
  useEffect(() => {
    if (printed) {
      return;
    }

    printed = true;

    // The accent token follows the theme, and devtools usually follows it too.
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();

    console.log(`%c${PULSE}%c\nKeyboard shortcuts: ⌘/ or Ctrl+/.`, `color: ${accent}`, "");
  }, []);

  return null;
}
