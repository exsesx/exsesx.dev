import { describe, expect, test } from "bun:test";
import { createMermaidPalette, getMermaidConfig, MERMAID_SITE_TOKENS, type MermaidThemeTokens } from "./mermaid-theme";

const lightTokens: MermaidThemeTokens = {
  accent: { a: 1, b: 255, g: 64, r: 36 },
  accentText: { a: 1, b: 253, g: 247, r: 243 },
  background: { a: 1, b: 248, g: 242, r: 238 },
  border: { a: 0.12, b: 35, g: 20, r: 11 },
  card: { a: 0.82, b: 255, g: 253, r: 251 },
  fontFamily: "MonoLisaCode, ui-monospace, monospace",
  line: { a: 1, b: 122, g: 96, r: 81 },
  muted: { a: 1, b: 248, g: 237, r: 230 },
  secondary: { a: 1, b: 255, g: 254, r: 253 },
  text: { a: 1, b: 35, g: 20, r: 11 },
};

const darkTokens: MermaidThemeTokens = {
  accent: { a: 1, b: 255, g: 225, r: 92 },
  accentText: { a: 1, b: 28, g: 16, r: 10 },
  background: { a: 1, b: 28, g: 16, r: 10 },
  border: { a: 0.12, b: 255, g: 255, r: 255 },
  card: { a: 0.76, b: 44, g: 26, r: 17 },
  fontFamily: "MonoLisaCode, ui-monospace, monospace",
  line: { a: 1, b: 184, g: 163, r: 148 },
  muted: { a: 0.07, b: 255, g: 255, r: 255 },
  secondary: { a: 0.08, b: 255, g: 255, r: 255 },
  text: { a: 1, b: 252, g: 242, r: 234 },
};

describe("Mermaid theme configuration", () => {
  test("derives its identity from the site's semantic CSS tokens", () => {
    expect(MERMAID_SITE_TOKENS).toEqual({
      accent: "--accent",
      accentText: "--accent-foreground",
      background: "--background",
      border: "--border",
      card: "--card",
      fontFamily: "--font-mono",
      line: "--muted-foreground",
      muted: "--muted",
      secondary: "--secondary",
      text: "--foreground",
    });

    const light = createMermaidPalette(lightTokens);
    const dark = createMermaidPalette(darkTokens);

    expect(light).toMatchObject({
      accent: "#2440ff",
      background: "#eef2f8",
      fontFamily: "MonoLisaCode, ui-monospace, monospace",
      line: "#51607a",
      nodeSurface: "#f9fbfe",
      text: "#0b1423",
    });
    expect(dark).toMatchObject({
      accent: "#5ce1ff",
      background: "#0a101c",
      fontFamily: "MonoLisaCode, ui-monospace, monospace",
      line: "#94a3b8",
      nodeSurface: "#0f1828",
      text: "#eaf2fc",
    });
    expect(light.nodeBorder).not.toBe(light.accent);
    expect(dark.nodeBorder).not.toBe(dark.accent);
  });

  test("uses calm branded flowchart geometry with an opt-in focus treatment", () => {
    const palette = createMermaidPalette(darkTokens);
    const config = getMermaidConfig(palette);

    expect(config).toMatchObject({
      fontFamily: "MonoLisaCode, ui-monospace, monospace",
      look: "classic",
      securityLevel: "strict",
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        arrowheadColor: palette.accent,
        background: palette.background,
        lineColor: palette.line,
        primaryBorderColor: palette.nodeBorder,
        primaryColor: palette.nodeSurface,
        primaryTextColor: palette.text,
      },
    });
    expect(config.flowchart).toMatchObject({
      curve: "basis",
      diagramPadding: 14,
      nodeSpacing: 42,
      rankSpacing: 50,
    });
    expect(config.themeCSS).toContain(".node.focus");
    expect(config.themeCSS).toContain("rx: 10px");
    expect(config.themeCSS).toContain("font-weight: 700");
  });
});
