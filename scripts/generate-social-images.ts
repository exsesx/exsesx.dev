import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getAllBlogPosts } from "../src/content/blog/manifest";
import type { BlogPostSummary } from "../src/content/blog/types";
import { type Project, projects } from "../src/lib/projects";
import { PROFILE_SNAPSHOT_STATS } from "../src/lib/site-profile";

const width = 1200;
const height = 630;
const outDir = path.join(process.cwd(), "public/images/og");
const homeOut = path.join(process.cwd(), "public/images/social-preview.png");

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";

const colors = {
  ink: "#0b1423",
  night: "#0a101c",
  arctic: "#eef2f8",
  frost: "#f3f7fd",
  card: "#fbfdff",
  muted: "#51607a",
  ultramarine: "#2440ff",
  ultramarineBright: "#3d5afe",
};

const accentColors: Record<Project["accent"], { main: string; soft: string; text: string }> = {
  amber: { main: "#845cf6", soft: "#f4d06f", text: "#3b1d82" },
  controlup: { main: "#3887e8", soft: "#fbb03b", text: "#0f3d78" },
  mint: { main: "#3a80e0", soft: "#94f5d0", text: "#115e59" },
  quicklizard: { main: "#40a8c4", soft: "#ff8c28", text: "#155e75" },
  rose: { main: "#e85068", soft: "#eb7846", text: "#881337" },
  steel: { main: "#6096c4", soft: "#cbd5e1", text: "#334155" },
  violet: { main: "#9660d6", soft: "#be6ed2", text: "#581c87" },
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function splitLine(value: string, maxChars: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function wrapLinesByWidth(value: string, maxWidth: number, fontSize: number) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (current && approxTextWidth(next, fontSize) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function fitLineWithEllipsis(value: string, maxWidth: number, fontSize: number) {
  if (approxTextWidth(value, fontSize) <= maxWidth) {
    return value;
  }

  let next = value;

  while (next.length > 1 && approxTextWidth(`${next}…`, fontSize) > maxWidth) {
    next = next.slice(0, -1).trimEnd();
  }

  return `${next}…`;
}

function fittedLines(
  value: string,
  options: { maxWidth: number; maxLines: number; idealSize: number; minSize: number; measureScale?: number },
) {
  const measureScale = options.measureScale ?? 1;
  const measuredWidth = (line: string, fontSize: number) => approxTextWidth(line, fontSize) * measureScale;

  for (let fontSize = options.idealSize; fontSize >= options.minSize; fontSize -= 1) {
    const lines = wrapLinesByWidth(value, options.maxWidth / measureScale, fontSize);

    if (lines.length <= options.maxLines && lines.every(line => measuredWidth(line, fontSize) <= options.maxWidth)) {
      return { lines, fontSize };
    }
  }

  const wrapped = wrapLinesByWidth(value, options.maxWidth / measureScale, options.minSize);
  const lines = wrapped.slice(0, options.maxLines);
  const overflow = wrapped.slice(options.maxLines - 1).join(" ");
  lines[options.maxLines - 1] = fitLineWithEllipsis(overflow, options.maxWidth / measureScale, options.minSize);

  return { lines, fontSize: options.minSize };
}

// Rough advance-width estimate for MonoLisa at a given size (no font metrics in the
// SVG pipeline). Tuned for the weights used here; good enough to size pills so
// they hug their text instead of using fixed widths.
function approxTextWidth(value: string, fontSize: number, letterSpacing = 0) {
  const widths: Record<string, number> = { narrow: 0.34, normal: 0.56, wide: 0.78 };
  let units = 0;

  for (const char of value) {
    if (".,:;!|'i l".includes(char)) units += widths.narrow;
    else if ("mwMW—".includes(char)) units += widths.wide;
    else units += widths.normal;
  }

  return units * fontSize + Math.max(value.length - 1, 0) * letterSpacing;
}

// Auto-width pill that hugs its text with even horizontal padding.
function pill(
  x: number,
  y: number,
  text: string,
  options: {
    fill: string;
    stroke: string;
    textClass: string;
    fontSize: number;
    padX?: number;
    height?: number;
    minWidth?: number;
  },
) {
  const padX = options.padX ?? 22;
  const height = options.height ?? 40;
  const textWidth = approxTextWidth(text, options.fontSize);
  const width = Math.max(options.minWidth ?? 0, Math.round(textWidth + padX * 2));
  const textY = Math.round(y + height / 2 + options.fontSize * 0.34);
  const textX = Math.round(x + (width - textWidth) / 2);

  return {
    width,
    svg: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${options.fill}" stroke="${options.stroke}" stroke-opacity="0.28"/>
      <text x="${textX}" y="${textY}" class="${options.textClass}">${escapeXml(text)}</text>
    </g>`,
  };
}

function textLines(
  value: string,
  options: { x: number; y: number; maxChars: number; lineHeight: number; className: string },
) {
  return splitLine(value, options.maxChars)
    .slice(0, 4)
    .map(
      (line, index) =>
        `<text x="${options.x}" y="${options.y + index * options.lineHeight}" class="${options.className}">${escapeXml(line)}</text>`,
    )
    .join("");
}

function baseSvg(inner: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${colors.frost}"/>
      <stop offset="0.55" stop-color="${colors.arctic}"/>
      <stop offset="1" stop-color="#dce4f0"/>
    </linearGradient>
    <linearGradient id="dark-panel" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#141d30"/>
      <stop offset="1" stop-color="${colors.night}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${colors.card}" stop-opacity="0.92"/>
      <stop offset="1" stop-color="${colors.card}" stop-opacity="0.58"/>
    </linearGradient>
    <filter id="shadow" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="${colors.ink}" flood-opacity="0.14"/>
    </filter>
    <filter id="soft-shadow" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="${colors.ink}" flood-opacity="0.10"/>
    </filter>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="${colors.ink}" stroke-opacity="0.075" stroke-width="1"/>
    </pattern>
    <pattern id="grid-dark" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="${colors.frost}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
    <filter id="trace-glow" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>
  <style>
    .brand { font: 900 30px MonoLisaText, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${colors.ink}; }
    .eyebrow { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 18px; fill: ${colors.ultramarine}; letter-spacing: 2.2px; text-transform: uppercase; }
    .headline { font: 900 86px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; }
    .headline-small { font: 900 62px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; }
    .project-title { font: 900 58px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; }
    .body { font: 700 28px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
    .body-dark { font: 700 22px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.frost}; opacity: 0.88; }
    .label { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 850; font-size: 18px; fill: ${colors.ink}; }
    .snapshot-value { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 900; fill: ${colors.ink}; }
    .stat-label { font: 800 15px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
    .pill-text { font: 800 17px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; }
    .tiny { font: 800 16px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
  </style>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.62"/>
  <circle cx="220" cy="120" r="210" fill="${colors.ultramarineBright}" opacity="0.085"/>
  <circle cx="1030" cy="96" r="180" fill="${colors.ink}" opacity="0.045"/>
  ${inner}
</svg>`;
}

function logo(x: number, y: number, size: number, fill = colors.ink) {
  const scale = size / 512;

  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="${logoPath}" fill="${fill}"/>
  </g>`;
}

// A single stat tile inside the home snapshot panel: large value + 2-line label.
function snapshotTile(x: number, y: number, width: number, value: string, label: string) {
  // Shrink long word-values (e.g. "Full-stack") to fit; numbers stay large. The
  // value is 900-weight, which renders wider than the generic
  // estimate, so apply a heaviness factor (1.12) and a real right margin so it
  // never reaches the tile edge. Floor low enough that the longest value fits.
  const padX = 26;
  const available = width - padX - 24;
  // The value is 900-weight MonoLisa; it renders a bit wider than the generic
  // estimate, so apply a small heaviness factor so long words like "Full-stack"
  // sit inside the tile with margin while short numbers stay at full size.
  const estimatedAt50 = approxTextWidth(value, 50) * 1.18;
  const valueSize = Math.max(24, Math.min(50, (available / estimatedAt50) * 50));
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="118" rx="24" fill="${colors.card}" stroke="${colors.ink}" stroke-opacity="0.09"/>
    <text x="${x + padX}" y="${y + 54}" class="snapshot-value" font-size="${valueSize.toFixed(1)}">${escapeXml(value)}</text>
    ${textLines(label, { x: x + padX, y: y + 82, maxChars: 19, lineHeight: 19, className: "stat-label" })}
  </g>`;
}

const TRACE_PATH = "M4 60 H56 Q63 46 72 60 H86 L94 68 L106 8 L118 70 L126 44 L134 60 H156 Q166 42 178 60 H236";

function pulseTrace(
  x: number,
  y: number,
  w: number,
  options: {
    stroke: string;
    strokeWidth?: number;
    glow?: string;
    glowOpacity?: number;
    opacity?: number;
    maxHeight?: number;
  },
) {
  const scaleX = w / 240;
  const scaleY = options.maxHeight ? Math.min(scaleX, options.maxHeight / 72) : scaleX;
  const strokeWidth = (options.strokeWidth ?? 8) / Math.sqrt(scaleX * scaleY);
  const glow = options.glow ?? options.stroke;
  const transform = `translate(${x} ${y}) scale(${scaleX} ${scaleY})`;
  const base = `fill="none" stroke-linecap="round" stroke-linejoin="round" d="${TRACE_PATH}"`;

  return `<g transform="${transform}" opacity="${options.opacity ?? 1}">
    <path ${base} stroke="${glow}" stroke-width="${strokeWidth * 2.2}" opacity="${options.glowOpacity ?? 0.22}" filter="url(#trace-glow)"/>
    <path ${base} stroke="${options.stroke}" stroke-width="${strokeWidth}"/>
  </g>`;
}

function homeStatsPanel(x: number, y: number, w: number, h: number) {
  const stats = PROFILE_SNAPSHOT_STATS.map(({ value, socialLabel }) => [value, socialLabel] as const);
  const gap = 22;
  const colW = (w - 56 - gap) / 2;
  const rowY = y + 144;
  const rowGap = 130;

  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="40" fill="url(#glass)" stroke="${colors.ink}" stroke-opacity="0.1"/>
    <circle cx="${x + 30}" cy="${y + 44}" r="6" fill="${colors.ultramarine}"/>
    <text x="${x + 48}" y="${y + 50}" class="eyebrow" font-size="16">Professional snapshot</text>
    ${pulseTrace(x + 30, y + 60, w - 60, { stroke: colors.ultramarine, glow: colors.ultramarineBright, strokeWidth: 6, maxHeight: 56 })}
    ${snapshotTile(x + 28, rowY, colW, stats[0][0], stats[0][1])}
    ${snapshotTile(x + 28 + colW + gap, rowY, colW, stats[1][0], stats[1][1])}
    ${snapshotTile(x + 28, rowY + rowGap, colW, stats[2][0], stats[2][1])}
    ${snapshotTile(x + 28 + colW + gap, rowY + rowGap, colW, stats[3][0], stats[3][1])}
  </g>`;
}

function homeSvg() {
  const headlineX = 92;
  const bodyX = 96;
  const leftColumnWidth = 486;
  const headline = ["Software", "with a pulse"].map(line =>
    fittedLines(line, {
      maxWidth: leftColumnWidth,
      maxLines: 1,
      idealSize: 86,
      minSize: 66,
      measureScale: 1.08,
    }),
  );
  const body = fittedLines("Full-stack products, MCP servers, LLM workflows, and developer tools", {
    maxWidth: leftColumnWidth,
    maxLines: 2,
    idealSize: 28,
    minSize: 22,
    measureScale: 1.06,
  });

  return baseSvg(`
    <rect x="64" y="62" width="1072" height="506" rx="46" fill="${colors.card}" opacity="0.48" stroke="${colors.ink}" stroke-opacity="0.08"/>
    ${logo(92, 86, 72)}
    <text x="178" y="126" class="brand">Oleh Vanin</text>
    <text x="178" y="154" class="tiny">exsesx.dev</text>
    <text x="${headlineX}" y="242" class="eyebrow">Practical AI systems + product engineering</text>
    <text x="${headlineX}" y="332" class="headline" style="font-size:${headline[0].fontSize}px">${escapeXml(headline[0].lines[0])}</text>
    <text x="${headlineX}" y="414" class="headline" style="font-size:${headline[1].fontSize}px">${escapeXml(headline[1].lines[0])}</text>
    ${body.lines
      .map(
        (line, index) =>
          `<text x="${bodyX}" y="${468 + index * 32}" class="body" style="font-size:${body.fontSize}px">${escapeXml(line)}</text>`,
      )
      .join("")}
    ${homeStatsPanel(626, 92, 488, 446)}
  `);
}

function projectsSvg() {
  return baseSvg(`
    ${logo(82, 76, 74)}
    <text x="168" y="118" class="brand">Oleh Vanin</text>
    <text x="168" y="148" class="tiny">exsesx.dev/projects</text>
    <text x="82" y="248" class="eyebrow">Selected projects</text>
    <text x="82" y="326" class="headline-small">Built across</text>
    <text x="82" y="392" class="headline-small">real constraints</text>
    ${textLines("AI, enterprise IT, pricing, fintech, education, commerce, utilities, and digital assets", {
      x: 86,
      y: 448,
      maxChars: 42,
      lineHeight: 32,
      className: "body",
    })}
    ${projects
      .slice(0, 6)
      .map((project, index) => {
        const accent = accentColors[project.accent];
        const x = 628 + (index % 2) * 238;
        const y = 82 + Math.floor(index / 2) * 154;
        // Shrink the name to fit the card instead of truncating, with an 18px
        // ideal and a 13px floor so longer names (e.g. "Clear Street Bank")
        // stay readable and whole.
        const nameMaxWidth = 166;
        const nameSize = Math.max(13, Math.min(18, (nameMaxWidth / approxTextWidth(project.name, 18)) * 18));

        return `<g filter="url(#soft-shadow)">
          <rect x="${x}" y="${y}" width="214" height="126" rx="26" fill="${colors.card}" stroke="${accent.main}" stroke-opacity="0.26"/>
          <circle cx="${x + 34}" cy="${y + 34}" r="12" fill="${accent.main}"/>
          <rect x="${x + 56}" y="${y + 26}" width="112" height="12" rx="6" fill="${colors.ink}" opacity="0.2"/>
          <text x="${x + 24}" y="${y + 76}" class="label" font-size="${nameSize.toFixed(1)}">${escapeXml(project.name)}</text>
          <text x="${x + 24}" y="${y + 102}" class="tiny">${escapeXml(truncate(project.period, 24))}</text>
        </g>`;
      })
      .join("")}
    <rect x="628" y="550" width="452" height="2" rx="1" fill="${colors.ink}" opacity="0.12"/>
  `);
}

function projectSvg(project: Project) {
  const accent = accentColors[project.accent];
  const tags = project.tags.slice(0, 3);
  const textX = 614;
  const bodyX = 614;
  const columnRight = 1084;
  const columnWidth = columnRight - textX;
  const title = fittedLines(project.name, {
    maxWidth: columnWidth,
    maxLines: 2,
    idealSize: 56,
    minSize: 42,
    measureScale: 1.08,
  });
  const body = fittedLines(project.detail.headline, {
    maxWidth: columnWidth,
    maxLines: 2,
    idealSize: 27,
    minSize: 20,
    measureScale: 1.06,
  });
  const titleLineHeight = 58;
  const bodyLineHeight = 32;

  const contentTop = 224;
  const contentBottom = 512;

  const eyebrowToTitle = 62;
  const titleToBody = 56;

  const pillHeight = 40;
  const eyebrowY = contentTop + 16;
  const titleY = eyebrowY + eyebrowToTitle;
  const titleBlock = title.fontSize + (title.lines.length - 1) * titleLineHeight;
  const detailY = titleY + titleBlock - title.fontSize + titleToBody;
  const tagsY = contentBottom - pillHeight;

  const panelX = 112;
  const panelY = contentTop;
  const panelW = 438;
  const panelH = contentBottom - contentTop;
  const panelMidY = panelY + panelH / 2;

  const traceWidth = 380;
  const traceX = panelX + (panelW - traceWidth) / 2;
  const traceBaseline = panelMidY + 8;
  const traceY = traceBaseline - 60 * (traceWidth / 240);

  return baseSvg(`
    <rect x="54" y="50" width="1092" height="530" rx="46" fill="${colors.night}"/>
    <circle cx="1020" cy="90" r="240" fill="${accent.main}" opacity="0.18"/>
    <circle cx="760" cy="560" r="260" fill="${accent.soft}" opacity="0.10"/>
    <rect x="84" y="80" width="1032" height="470" rx="36" fill="${colors.frost}" opacity="0.98"/>
    ${logo(112, 112, 68, colors.ink)}
    <text x="194" y="154" class="brand">Oleh Vanin</text>
    <text x="194" y="184" class="tiny">exsesx.dev/project/${escapeXml(project.slug)}</text>
    <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="34" fill="${colors.night}"/>
    <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="34" fill="url(#grid-dark)"/>
    <circle cx="${panelX + panelW - 74}" cy="${panelY + 64}" r="120" fill="${accent.main}" opacity="0.22"/>
    <path d="M${traceX} ${traceBaseline} H${traceX + traceWidth}" stroke="${colors.frost}" stroke-width="2" opacity="0.12"/>
    ${pulseTrace(traceX, traceY, traceWidth, { stroke: accent.soft, glow: accent.main, strokeWidth: 7, glowOpacity: 0.3 })}
    <text x="${textX}" y="${eyebrowY}" class="eyebrow" fill="${accent.text}">${escapeXml(project.role)}</text>
    ${title.lines
      .map(
        (line, index) =>
          `<text x="${textX}" y="${titleY + index * titleLineHeight}" class="project-title" style="font-size:${title.fontSize}px">${escapeXml(line)}</text>`,
      )
      .join("")}
    ${body.lines
      .map(
        (line, index) =>
          `<text x="${bodyX}" y="${detailY + index * bodyLineHeight}" class="body" style="font-size:${body.fontSize}px">${escapeXml(line)}</text>`,
      )
      .join("")}
    ${(() => {
      let cursor = bodyX;
      return tags
        .map(tag => {
          const built = pill(cursor, tagsY, tag, {
            fill: colors.card,
            stroke: accent.main,
            textClass: "pill-text",
            fontSize: 17,
            minWidth: 108,
          });
          cursor += built.width + 14;
          return built.svg;
        })
        .join("");
    })()}
  `);
}

function blogIndexSvg() {
  return baseSvg(`
    ${logo(82, 76, 74)}
    <text x="168" y="118" class="brand">Oleh Vanin</text>
    <text x="168" y="148" class="tiny">exsesx.dev/blog/en</text>
    <text x="82" y="244" class="eyebrow">Technical writing</text>
    <text x="82" y="326" class="headline-small">Notes from</text>
    <text x="82" y="394" class="headline-small">the workbench</text>
    ${textLines("Source-audited field notes on AI systems, product engineering, and developer tools", {
      x: 86,
      y: 452,
      maxChars: 44,
      lineHeight: 32,
      className: "body",
    })}
    <g filter="url(#shadow)">
      <rect x="666" y="100" width="430" height="430" rx="38" fill="${colors.night}"/>
      <rect x="666" y="100" width="430" height="430" rx="38" fill="url(#grid-dark)"/>
      <circle cx="1024" cy="138" r="160" fill="${colors.ultramarineBright}" opacity="0.24"/>
      <text x="710" y="176" class="eyebrow" style="fill:${colors.frost}">Build • verify • write</text>
      ${pulseTrace(710, 214, 330, { stroke: colors.ultramarineBright, glow: colors.ultramarine, strokeWidth: 7 })}
      <text x="710" y="368" class="body-dark">Primary sources</text>
      <text x="710" y="408" class="body-dark">Runnable examples</text>
      <text x="710" y="448" class="body-dark">Practical caveats</text>
    </g>
  `);
}

function blogArticleSvg(post: BlogPostSummary) {
  const title = fittedLines(post.title, {
    maxWidth: 940,
    maxLines: 3,
    idealSize: 62,
    minSize: 44,
    measureScale: 1.08,
  });
  const description = fittedLines(post.description, {
    maxWidth: 900,
    maxLines: 2,
    idealSize: 24,
    minSize: 20,
    measureScale: 1.05,
  });
  const titleY = 248;
  const titleLineHeight = title.fontSize * 1.08;
  const descriptionY = titleY + title.lines.length * titleLineHeight + 38;
  const metadataY = 454;
  const publishedLabel = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  })
    .format(new Date(post.publishedAt))
    .toUpperCase();

  return baseSvg(`
    <rect x="54" y="50" width="1092" height="530" rx="46" fill="${colors.night}"/>
    <rect x="78" y="74" width="1044" height="482" rx="38" fill="${colors.frost}" opacity="0.98"/>
    <circle cx="1040" cy="88" r="220" fill="${colors.ultramarineBright}" opacity="0.13"/>
    ${logo(108, 102, 66)}
    <text x="188" y="142" class="brand">Oleh Vanin</text>
    <text x="188" y="172" class="tiny">exsesx.dev/blog/${escapeXml(post.locale)}/${escapeXml(post.slug)}</text>
    <text x="1040" y="142" text-anchor="end" class="eyebrow">${escapeXml(post.locale.toUpperCase())} • BLOG</text>
    ${title.lines
      .map(
        (line, index) =>
          `<text x="108" y="${titleY + index * titleLineHeight}" class="project-title" style="font-size:${title.fontSize}px">${escapeXml(line)}</text>`,
      )
      .join("")}
    ${description.lines
      .map(
        (line, index) =>
          `<text x="112" y="${descriptionY + index * 31}" class="body" style="font-size:${description.fontSize}px">${escapeXml(line)}</text>`,
      )
      .join("")}
    ${(() => {
      let cursor = 112;
      return post.tags
        .slice(0, 3)
        .map(tag => {
          const built = pill(cursor, metadataY, tag, {
            fill: colors.card,
            stroke: colors.ultramarine,
            textClass: "pill-text",
            fontSize: 17,
            height: 40,
            padX: 18,
          });
          cursor += built.width + 12;
          return built.svg;
        })
        .join("");
    })()}
    <text x="1040" y="480" text-anchor="end" class="tiny">${escapeXml(publishedLabel)}</text>
  `);
}

async function writePng(svg: string, outputPath: string) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPath);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await writePng(homeSvg(), homeOut);
  await writePng(projectsSvg(), path.join(outDir, "projects.png"));
  await writePng(blogIndexSvg(), path.join(outDir, "blog.png"));

  await Promise.all([
    ...projects.map(project => writePng(projectSvg(project), path.join(outDir, `project-${project.slug}.png`))),
    ...getAllBlogPosts({ includeDrafts: false }).map(async post => {
      const outputPath = path.join(process.cwd(), "public", post.socialImage.path.replace(/^\//, ""));

      await mkdir(path.dirname(outputPath), { recursive: true });
      await writePng(blogArticleSvg(post), outputPath);
    }),
  ]);
}

await main();
