import { preload } from "react-dom";
import type { BlogLocale } from "./blog";

const BASIC_LATIN_FONT = "/fonts/monolisa-text/woff2/0-MonoLisaText-normal.woff2";
const CYRILLIC_FONT = "/fonts/monolisa-text/woff2/18-MonoLisaText-normal.woff2";
const CODE_FONT = "/fonts/monolisa-code/woff2/0-MonoLisaCode-normal.woff2";

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
    preloadFont(href);
  }
}

function preloadFont(href: string) {
  preload(href, { as: "font", crossOrigin: "anonymous", type: "font/woff2" });
}

// Articles set code in their first screens (the title's code words, inline code, code blocks), and the stylesheet
// only asks for the code face once layout reaches it. Elsewhere it is not needed that early, so only articles take
// the hint.
export function preloadArticleFonts() {
  preloadFont(CODE_FONT);
}
