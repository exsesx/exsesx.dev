import type { ThemeRegistration } from "shiki";

type CodePalette = Readonly<{
  /** Identifiers, functions, types and operators: the page's ink. */
  foreground: string;
  /** Comments and punctuation, which should recede. */
  muted: string;
  /** Keywords, storage and tags, in the theme's signal hue. */
  signal: string;
  /** Strings, numbers and literal constants: the one warm hue. */
  warm: string;
}>;

/* Code sits in the graphite palette instead of a stock editor theme: ink, its muted step, the signal and one warm
   literal hue. Every colour clears 4.5:1 on the code surface and on a highlighted line, in its own theme:
     light (surface #eeebe7, highlighted #dbdee9): ink 15.19/13.35, muted 5.74/5.05, cobalt 5.73/5.04, warm 5.46/4.80
     dark (surface #181818, highlighted #1f2923): ink 15.02/12.64, muted 7.03/5.92, phosphor 10.03/8.44, amber 9.70/8.17
   The light signal is a step deeper than the page's #1552fe, which drops to 4.25:1 on a highlighted line. */
const LIGHT_CODE_PALETTE: CodePalette = {
  foreground: "#1a1613",
  muted: "#605a54",
  signal: "#1148e6",
  warm: "#9c4410",
};

const DARK_CODE_PALETTE: CodePalette = {
  foreground: "#ececec",
  muted: "#a3a3a3",
  signal: "#6ad895",
  warm: "#e8b77a",
};

const MUTED_SCOPES = [
  "comment",
  "punctuation.definition.comment",
  "punctuation.separator",
  "punctuation.terminator",
  "punctuation.accessor",
  "punctuation.definition.block",
  "punctuation.definition.parameters",
  "punctuation.definition.array",
  "punctuation.definition.dictionary",
  "punctuation.section",
  "meta.brace",
];

const SIGNAL_SCOPES = [
  "keyword",
  "storage",
  "keyword.operator.new",
  "keyword.operator.expression",
  "entity.name.tag",
  "entity.name.section",
  "markup.heading",
  "markup.inserted",
];

const WARM_SCOPES = [
  "string",
  "punctuation.definition.string",
  "string.regexp",
  "constant.numeric",
  "keyword.other.unit",
  "constant.language",
  "constant.character",
  "constant.other",
  "support.constant",
  "markup.deleted",
];

// Generic operators stay in ink rather than inheriting the keyword hue; grammars that file an operator under a more
// specific keyword scope, such as Nushell's pipe, keep the signal.
const INK_SCOPES = ["keyword.operator", "keyword.operator.assignment"];

function createCodeTheme(name: string, type: "light" | "dark", palette: CodePalette): ThemeRegistration {
  return {
    name,
    type,
    fg: palette.foreground,
    bg: "transparent",
    colors: {
      "editor.foreground": palette.foreground,
      "editor.background": "transparent",
    },
    tokenColors: [
      { scope: MUTED_SCOPES, settings: { foreground: palette.muted } },
      { scope: SIGNAL_SCOPES, settings: { foreground: palette.signal } },
      { scope: WARM_SCOPES, settings: { foreground: palette.warm } },
      { scope: INK_SCOPES, settings: { foreground: palette.foreground } },
    ],
  };
}

export const graphiteCodeThemes = {
  dark: createCodeTheme("graphite-dark", "dark", DARK_CODE_PALETTE),
  light: createCodeTheme("graphite-light", "light", LIGHT_CODE_PALETTE),
};
