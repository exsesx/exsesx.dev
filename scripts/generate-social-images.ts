import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { type Project, projects } from "../src/lib/projects";

const width = 1200;
const height = 630;
const outDir = path.join(process.cwd(), "public/images/og");
const homeOut = path.join(process.cwd(), "public/images/social-preview.png");

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";

const colors = {
  ink: "#18181b",
  night: "#101111",
  cream: "#f8f1e7",
  creamSoft: "#fff7e8",
  card: "#fffaf1",
  muted: "#71717a",
  cyan: "#0e7490",
  cyanBright: "#0891b2",
  amber: "#fde68a",
  white: "#ffffff",
};

const accentColors: Record<Project["accent"], { main: string; soft: string; text: string }> = {
  amber: { main: "#845cf6", soft: "#f4d06f", text: "#3b1d82" },
  controlup: { main: "#3887e8", soft: "#fbb03b", text: "#0f3d78" },
  cyan: { main: "#0e7490", soft: "#67e8f9", text: "#155e75" },
  mint: { main: "#3a80e0", soft: "#94f5d0", text: "#115e59" },
  neutral: { main: "#52525b", soft: "#d4d4d8", text: "#27272a" },
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

// Rough advance-width estimate for Inter at a given size (no font metrics in the
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
  options: { fill: string; stroke: string; textClass: string; fontSize: number; padX?: number; height?: number },
) {
  const padX = options.padX ?? 22;
  const height = options.height ?? 40;
  const textWidth = approxTextWidth(text, options.fontSize);
  const width = Math.round(textWidth + padX * 2);
  const textY = Math.round(y + height / 2 + options.fontSize * 0.34);

  return {
    width,
    svg: `<g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${options.fill}" stroke="${options.stroke}" stroke-opacity="0.28"/>
      <text x="${x + padX}" y="${textY}" class="${options.textClass}">${escapeXml(text)}</text>
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
      <stop offset="0" stop-color="${colors.creamSoft}"/>
      <stop offset="0.55" stop-color="${colors.cream}"/>
      <stop offset="1" stop-color="#eee1d1"/>
    </linearGradient>
    <linearGradient id="dark-panel" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#202223"/>
      <stop offset="1" stop-color="${colors.night}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#fffaf1" stop-opacity="0.92"/>
      <stop offset="1" stop-color="#fffaf1" stop-opacity="0.58"/>
    </linearGradient>
    <filter id="shadow" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#18181b" flood-opacity="0.14"/>
    </filter>
    <filter id="soft-shadow" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#18181b" flood-opacity="0.10"/>
    </filter>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="${colors.ink}" stroke-opacity="0.075" stroke-width="1"/>
    </pattern>
  </defs>
  <style>
    .brand { font: 900 30px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: ${colors.ink}; letter-spacing: -0.4px; }
    .eyebrow { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 18px; fill: ${colors.cyan}; letter-spacing: 2.2px; text-transform: uppercase; }
    .headline { font: 950 86px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; letter-spacing: -3.8px; }
    .headline-small { font: 950 62px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; letter-spacing: -2.2px; }
    .project-title { font: 950 58px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; letter-spacing: -2px; }
    .body { font: 700 28px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; letter-spacing: -0.3px; }
    .body-dark { font: 700 22px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.creamSoft}; opacity: 0.88; }
    .label { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 850; font-size: 18px; fill: ${colors.ink}; letter-spacing: -0.2px; }
    .snapshot-value { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-weight: 950; fill: ${colors.ink}; letter-spacing: -2.4px; }
    .stat-label { font: 800 15px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; letter-spacing: -0.1px; }
    .pill-text { font: 800 17px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.ink}; letter-spacing: -0.1px; }
    .tiny { font: 800 16px Inter, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
  </style>
  <rect width="${width}" height="${height}" fill="url(#paper)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.62"/>
  <circle cx="220" cy="120" r="210" fill="${colors.cyanBright}" opacity="0.085"/>
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
  // value is 950-weight with tight tracking, which renders wider than the generic
  // estimate, so apply a heaviness factor (1.12) and a real right margin so it
  // never reaches the tile edge. Floor low enough that the longest value fits.
  const padX = 26;
  const available = width - padX - 24;
  // The value is 950-weight Inter; it renders a bit wider than the generic
  // estimate, so apply a small heaviness factor so long words like "Full-stack"
  // sit inside the tile with margin while short numbers stay at full size.
  const estimatedAt50 = approxTextWidth(value, 50) * 1.18;
  const valueSize = Math.max(24, Math.min(50, (available / estimatedAt50) * 50));
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="118" rx="24" fill="${colors.card}" stroke="${colors.ink}" stroke-opacity="0.09"/>
    <text x="${x + padX}" y="${y + 54}" class="snapshot-value" font-size="${valueSize.toFixed(1)}">${escapeXml(value)}</text>
    ${textLines(label, { x: x + padX, y: y + 82, maxChars: 24, lineHeight: 19, className: "stat-label" })}
  </g>`;
}

// Signature pulse waveform — the site's "with a pulse" motif, used as the
// connective accent across the top of the home snapshot panel.
function pulseWave(x: number, y: number, w: number) {
  const u = w / 4;
  return `<g>
    <path d="M${x} ${y} C${x + u * 0.6} ${y - 34} ${x + u * 1.2} ${y + 30} ${x + u * 1.9} ${y - 4}
      S${x + u * 3} ${y - 40} ${x + w} ${y - 18}"
      fill="none" stroke="${colors.amber}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${x + u * 1.18}" cy="${y + 12}" r="9" fill="${colors.cyanBright}"/>
    <circle cx="${x + u * 2.62}" cy="${y - 24}" r="9" fill="${colors.amber}"/>
  </g>`;
}

function homeStatsPanel(x: number, y: number, w: number, h: number) {
  const stats: Array<[string, string]> = [
    ["9+", "years building web products"],
    ["17+", "projects led as lead engineer"],
    ["AI", "assistant systems, MCP, LLM"],
    ["Full-stack", "React, Next, Node, Go, cloud"],
  ];
  const gap = 22;
  const colW = (w - 56 - gap) / 2;
  const rowY = y + 144;
  const rowGap = 130;

  return `<g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="40" fill="url(#glass)" stroke="${colors.ink}" stroke-opacity="0.1"/>
    <circle cx="${x + 30}" cy="${y + 44}" r="6" fill="${colors.cyan}"/>
    <text x="${x + 48}" y="${y + 50}" class="eyebrow" font-size="16">Professional snapshot</text>
    ${pulseWave(x + 30, y + 96, w - 60)}
    ${snapshotTile(x + 28, rowY, colW, stats[0][0], stats[0][1])}
    ${snapshotTile(x + 28 + colW + gap, rowY, colW, stats[1][0], stats[1][1])}
    ${snapshotTile(x + 28, rowY + rowGap, colW, stats[2][0], stats[2][1])}
    ${snapshotTile(x + 28 + colW + gap, rowY + rowGap, colW, stats[3][0], stats[3][1])}
  </g>`;
}

function homeSvg() {
  return baseSvg(`
    <rect x="64" y="62" width="1072" height="506" rx="46" fill="${colors.card}" opacity="0.48" stroke="${colors.ink}" stroke-opacity="0.08"/>
    ${logo(92, 86, 72)}
    <text x="178" y="126" class="brand">Oleh Vanin</text>
    <text x="178" y="154" class="tiny">exsesx.dev</text>
    <text x="92" y="242" class="eyebrow">Practical AI systems + product engineering</text>
    <text x="92" y="332" class="headline">Software</text>
    <text x="92" y="416" class="headline">with a pulse</text>
    ${textLines("Full-stack products, MCP servers, LLM workflows, and developer tools", {
      x: 96,
      y: 468,
      maxChars: 43,
      lineHeight: 34,
      className: "body",
    })}
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
  const projectTitleLines = splitLine(project.name, 17).slice(0, 2);
  const detailY = projectTitleLines.length > 1 ? 426 : 392;

  return baseSvg(`
    <rect x="54" y="50" width="1092" height="530" rx="46" fill="${colors.night}"/>
    <circle cx="1020" cy="90" r="240" fill="${accent.main}" opacity="0.18"/>
    <circle cx="760" cy="560" r="260" fill="${accent.soft}" opacity="0.10"/>
    <rect x="84" y="80" width="1032" height="470" rx="36" fill="${colors.creamSoft}" opacity="0.98"/>
    ${logo(112, 112, 68, colors.ink)}
    <text x="194" y="154" class="brand">Oleh Vanin</text>
    <text x="194" y="184" class="tiny">exsesx.dev/project/${escapeXml(project.slug)}</text>
    <rect x="112" y="232" width="438" height="238" rx="34" fill="${colors.night}"/>
    <circle cx="492" cy="284" r="118" fill="${accent.main}" opacity="0.22"/>
    <path d="M158 392 C220 316 296 438 364 356 S470 326 510 390" fill="none" stroke="${accent.soft}" stroke-width="7" stroke-linecap="round" opacity="0.92"/>
    <path d="M158 428 H498" stroke="${colors.creamSoft}" stroke-width="2" opacity="0.18"/>
    <path d="M158 330 H438" stroke="${colors.creamSoft}" stroke-width="2" opacity="0.14"/>
    <circle cx="224" cy="344" r="9" fill="${accent.main}"/>
    <circle cx="360" cy="374" r="9" fill="${accent.soft}"/>
    <circle cx="454" cy="336" r="9" fill="${colors.cyanBright}"/>
    <text x="600" y="250" class="eyebrow" fill="${accent.text}">${escapeXml(project.role)}</text>
    ${projectTitleLines
      .map((line, index) => `<text x="600" y="${334 + index * 62}" class="project-title">${escapeXml(line)}</text>`)
      .join("")}
    ${textLines(project.detail.headline, { x: 604, y: detailY, maxChars: 36, lineHeight: 30, className: "body" })}
    ${(() => {
      let cursor = 604;
      return tags
        .map(tag => {
          const built = pill(cursor, 482, tag, {
            fill: colors.card,
            stroke: accent.main,
            textClass: "pill-text",
            fontSize: 17,
          });
          cursor += built.width + 14;
          return built.svg;
        })
        .join("");
    })()}
  `);
}

async function writePng(svg: string, outputPath: string) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPath);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await writePng(homeSvg(), homeOut);
  await writePng(projectsSvg(), path.join(outDir, "projects.png"));

  await Promise.all(
    projects.map(project => writePng(projectSvg(project), path.join(outDir, `project-${project.slug}.png`))),
  );
}

await main();
