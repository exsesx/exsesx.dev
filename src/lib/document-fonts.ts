import { preload } from "react-dom";
import type { BlogLocale } from "./blog";

const BASIC_LATIN_FONT = "/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2";
const CYRILLIC_FONT = "/fonts/monolisa-text/woff2/18-MonoLisaText-normal.woff2";

// The Basic Latin face sets every page; Ukrainian pages also set Cyrillic in the first paint, so they fetch that
// subset up front instead of swapping to it once the stylesheet asks.
const FONT_PRELOADS: Record<BlogLocale, readonly string[]> = {
  en: [BASIC_LATIN_FONT],
  uk: [BASIC_LATIN_FONT, CYRILLIC_FONT],
};

// React emits each hint once in the head, from whichever layout asks; a hand-written <link> was also hoisted, so it
// shipped twice. On a client navigation the hint arrives with the RSC payload instead.
export function preloadDocumentFonts(lang: BlogLocale) {
  for (const href of FONT_PRELOADS[lang]) {
    preload(href, { as: "font", crossOrigin: "anonymous", type: "font/woff2" });
  }
}
