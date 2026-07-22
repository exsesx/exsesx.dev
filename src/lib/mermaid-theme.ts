import type { MermaidConfig } from "mermaid";

export const MERMAID_SITE_TOKENS = {
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
} as const;

export type RgbaColor = {
  a: number;
  b: number;
  g: number;
  r: number;
};

export type MermaidThemeTokens = {
  accent: RgbaColor;
  accentText: RgbaColor;
  background: RgbaColor;
  border: RgbaColor;
  card: RgbaColor;
  fontFamily: string;
  line: RgbaColor;
  muted: RgbaColor;
  secondary: RgbaColor;
  text: RgbaColor;
};

export type MermaidPalette = {
  accent: string;
  accentText: string;
  background: string;
  border: string;
  clusterSurface: string;
  fontFamily: string;
  line: string;
  nodeBorder: string;
  nodeSurface: string;
  noteBorder: string;
  secondarySurface: string;
  tertiarySurface: string;
  text: string;
};

export function getMermaidAccessibleLabel(source: string) {
  return /^\s*accTitle:\s*(.+?)\s*$/m.exec(source)?.[1]?.trim() || "Diagram illustrating this section";
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(color: RgbaColor) {
  return `#${[color.r, color.g, color.b].map(channel => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;
}

function composite(foreground: RgbaColor, background: RgbaColor): RgbaColor {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  const blendChannel = (foregroundChannel: number, backgroundChannel: number) =>
    alpha === 0
      ? 0
      : (foregroundChannel * foreground.a + backgroundChannel * background.a * (1 - foreground.a)) / alpha;

  return {
    a: alpha,
    b: blendChannel(foreground.b, background.b),
    g: blendChannel(foreground.g, background.g),
    r: blendChannel(foreground.r, background.r),
  };
}

function mix(foreground: RgbaColor, background: RgbaColor, foregroundWeight: number): RgbaColor {
  return {
    a: 1,
    b: foreground.b * foregroundWeight + background.b * (1 - foregroundWeight),
    g: foreground.g * foregroundWeight + background.g * (1 - foregroundWeight),
    r: foreground.r * foregroundWeight + background.r * (1 - foregroundWeight),
  };
}

export function createMermaidPalette(tokens: MermaidThemeTokens): MermaidPalette {
  const background = { ...tokens.background, a: 1 };
  const nodeSurface = composite(tokens.card, background);
  const border = composite(tokens.border, background);
  const mutedSurface = composite(tokens.muted, background);
  const secondarySurface = composite(tokens.secondary, background);

  return {
    accent: toHex(tokens.accent),
    accentText: toHex(tokens.accentText),
    background: toHex(background),
    border: toHex(border),
    clusterSurface: toHex(mutedSurface),
    fontFamily: tokens.fontFamily,
    line: toHex(tokens.line),
    nodeBorder: toHex(mix(tokens.accent, nodeSurface, 0.42)),
    nodeSurface: toHex(nodeSurface),
    noteBorder: toHex(mix(tokens.accent, nodeSurface, 0.68)),
    secondarySurface: toHex(secondarySurface),
    tertiarySurface: toHex(mutedSurface),
    text: toHex(tokens.text),
  };
}

function resolveCssColor(value: string, context: CanvasRenderingContext2D): RgbaColor {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = "rgba(0, 0, 0, 0)";
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);

  const [r = 0, g = 0, b = 0, alpha = 0] = context.getImageData(0, 0, 1, 1).data;

  return { a: alpha / 255, b, g, r };
}

export function readMermaidThemeTokens(): MermaidThemeTokens {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("The browser could not resolve the site theme for this diagram.");
  }

  const styles = getComputedStyle(document.documentElement);
  const readColor = (token: string) => resolveCssColor(styles.getPropertyValue(token).trim(), context);

  return {
    accent: readColor(MERMAID_SITE_TOKENS.accent),
    accentText: readColor(MERMAID_SITE_TOKENS.accentText),
    background: readColor(MERMAID_SITE_TOKENS.background),
    border: readColor(MERMAID_SITE_TOKENS.border),
    card: readColor(MERMAID_SITE_TOKENS.card),
    fontFamily: styles.getPropertyValue(MERMAID_SITE_TOKENS.fontFamily).trim(),
    line: readColor(MERMAID_SITE_TOKENS.line),
    muted: readColor(MERMAID_SITE_TOKENS.muted),
    secondary: readColor(MERMAID_SITE_TOKENS.secondary),
    text: readColor(MERMAID_SITE_TOKENS.text),
  };
}

export function getMermaidConfig(palette: MermaidPalette): MermaidConfig {
  return {
    flowchart: {
      curve: "basis",
      diagramPadding: 14,
      nodeSpacing: 42,
      rankSpacing: 50,
    },
    fontFamily: palette.fontFamily,
    htmlLabels: true,
    look: "classic",
    securityLevel: "strict",
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      arrowheadColor: palette.accent,
      background: palette.background,
      clusterBkg: palette.clusterSurface,
      clusterBorder: palette.border,
      edgeLabelBackground: palette.background,
      fontFamily: palette.fontFamily,
      lineColor: palette.line,
      mainBkg: palette.nodeSurface,
      nodeBkg: palette.nodeSurface,
      nodeBorder: palette.nodeBorder,
      noteBkgColor: palette.tertiarySurface,
      noteBorderColor: palette.noteBorder,
      noteTextColor: palette.text,
      primaryBorderColor: palette.nodeBorder,
      primaryColor: palette.nodeSurface,
      primaryTextColor: palette.text,
      secondaryBorderColor: palette.border,
      secondaryColor: palette.secondarySurface,
      secondaryTextColor: palette.text,
      tertiaryBorderColor: palette.border,
      tertiaryColor: palette.tertiarySurface,
      tertiaryTextColor: palette.text,
      textColor: palette.text,
      titleColor: palette.text,
    },
    themeCSS: `
      .node rect,
      .node polygon,
      .node circle,
      .node ellipse,
      .node path {
        rx: 10px;
        ry: 10px;
        stroke-width: 1.25px;
      }

      .nodeLabel,
      .nodeLabel p {
        color: ${palette.text} !important;
        font-family: ${palette.fontFamily};
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .flowchart-link {
        stroke: ${palette.line} !important;
        stroke-width: 1.5px;
        stroke-linecap: round;
        opacity: 0.86;
      }

      .marker {
        fill: ${palette.accent} !important;
        stroke: ${palette.accent} !important;
      }

      .edgeLabel {
        color: ${palette.text} !important;
        font-family: ${palette.fontFamily};
        font-size: 12px;
        font-weight: 650;
      }

      .edgeLabel .labelBkg {
        fill: ${palette.background} !important;
        rx: 6px;
        ry: 6px;
        opacity: 0.96;
      }

      .cluster rect {
        rx: 14px;
        ry: 14px;
        stroke-width: 1px;
        stroke-dasharray: 4 5;
      }

      .cluster-label {
        color: ${palette.text} !important;
        font-weight: 800;
        letter-spacing: 0.04em;
      }

      .note {
        rx: 10px;
        ry: 10px;
        stroke-width: 1.25px;
      }

      .node.focus rect,
      .node.focus polygon,
      .node.focus circle,
      .node.focus ellipse,
      .node.focus path {
        fill: ${palette.accent} !important;
        stroke: ${palette.accent} !important;
      }

      .node.focus .nodeLabel,
      .node.focus .nodeLabel p {
        color: ${palette.accentText} !important;
      }
    `,
  };
}
