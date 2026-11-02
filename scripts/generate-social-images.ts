import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getAllBlogPosts } from "../src/content/blog/manifest";
import type { BlogPostSummary } from "../src/content/blog/types";
import { ASCII_GLYPHS, ecgHeight, glowFalloff, hashCell, smoothstep, traceGlyphFor } from "../src/lib/ascii-field";
import { BLOG_LOCALE_LABELS, BLOG_UI } from "../src/lib/blog";
import { type Project, projects } from "../src/lib/projects";
import { SITE_PROFILE } from "../src/lib/site-profile";

const width = 1200;
const height = 630;
const outDir = path.join(process.cwd(), "public/images/og");
const homeOut = path.join(process.cwd(), "public/images/social-preview.png");

const logoPath = "M84 84 168 96 256 334 344 96 428 84 298 430c-4 10-12 16-23 16h-38c-11 0-19-6-23-16Z";

// The site's light theme tokens (globals.css :root).
const colors = {
  background: "#eef2f8",
  foreground: "#0b1423",
  muted: "#51607a",
  accent: "#2440ff",
  card: "#fbfdff",
};

const accentColors: Record<Project["accent"], string> = {
  amber: "#845cf6",
  controlup: "#3887e8",
  mint: "#3a80e0",
  quicklizard: "#40a8c4",
  rose: "#e85068",
  steel: "#6096c4",
  violet: "#9660d6",
};

const marginX = 80;
const textColumnWidth = 600;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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

// Rough advance-width estimate for MonoLisaText at a given size (no font metrics in
// the SVG pipeline). Heavy weights render wider; callers pass a measureScale for that.
function approxTextWidth(value: string, fontSize: number) {
  const widths: Record<string, number> = { narrow: 0.34, normal: 0.56, wide: 0.78 };
  let units = 0;

  for (const char of value) {
    if (".,:;!|'i l".includes(char)) units += widths.narrow;
    else if ("mwMW—".includes(char)) units += widths.wide;
    else units += widths.normal;
  }

  return units * fontSize;
}

// A stable per-card seed, so a single-slug run draws the same field as a full run.
function seedFrom(value: string) {
  let seed = 0;

  for (const char of value) {
    seed = (Math.imul(seed, 31) + char.charCodeAt(0)) | 0;
  }

  return seed;
}

function textBlock(
  lines: string[],
  options: { x: number; y: number; fontSize: number; lineHeight: number; className: string },
) {
  return lines
    .map(
      (line, index) =>
        `<text x="${options.x}" y="${options.y + index * options.lineHeight}" class="${options.className}" font-size="${options.fontSize}">${escapeXml(line)}</text>`,
    )
    .join("");
}

/*
 * A still frame of the site's hero ASCII field: hashed glyphs that fade in from
 * the text column, with an ECG trace drawn in slope glyphs along `baselineY`
 * and a soft accent glow around it. Deterministic per `seed`, so regenerating
 * an unchanged card produces the same image.
 */
function asciiField(options: {
  seed: number;
  startX: number;
  baselineY: number;
  accent: string;
  traceStartX?: number;
  beatOffset?: number;
}) {
  const cellWidth = 18;
  const cellHeight = 26;
  const beatColumns = 15;
  const beatPeriod = 27;
  const beatAmplitude = 118;
  const glowRadius = 78;
  const rowOffset = options.baselineY % cellHeight;
  const firstColumn = Math.floor(options.startX / cellWidth);
  const lastColumn = Math.ceil(width / cellWidth);
  const rowCount = Math.ceil(height / cellHeight) + 1;
  const traceStartX = options.traceStartX ?? options.startX;
  // The trace may start left of the field (the home card continues the headline pulse).
  const firstTraceColumn = Math.min(firstColumn, Math.floor(traceStartX / cellWidth));
  const beatOffset = options.beatOffset ?? 0;
  const fadeInEnd = options.startX + 240;

  const traceY = (column: number) => {
    const x = column * cellWidth;

    if (x < traceStartX) {
      return null;
    }

    const beatPosition = (((column - firstTraceColumn + beatOffset) % beatPeriod) + beatPeriod) % beatPeriod;

    return options.baselineY - ecgHeight(beatPosition / beatColumns) * beatAmplitude;
  };

  const traceCells = new Map<string, string>();

  for (let column = firstTraceColumn; column <= lastColumn; column++) {
    const y = traceY(column);

    if (y === null) {
      continue;
    }

    const previous = traceY(column - 1) ?? y;
    const next = traceY(column + 1) ?? y;
    const row = Math.round((y - rowOffset) / cellHeight);
    traceCells.set(`${column}:${row}`, traceGlyphFor((next - previous) / (2 * cellWidth)));

    // Fill the near-vertical walls of the spike so the stroke stays continuous.
    const previousRow = Math.round((previous - rowOffset) / cellHeight);
    const step = Math.sign(row - previousRow);

    for (let fillRow = previousRow + step; step !== 0 && fillRow !== row; fillRow += step) {
      if (!traceCells.has(`${column}:${fillRow}`)) {
        traceCells.set(`${column}:${fillRow}`, "|");
      }
    }
  }

  const cells: string[] = [];

  for (let row = 0; row < rowCount; row++) {
    const y = row * cellHeight + rowOffset;

    for (let column = firstTraceColumn; column <= lastColumn; column++) {
      const x = column * cellWidth;
      const traceGlyph = traceCells.get(`${column}:${row}`);
      // Dashes sit at the font's math axis, a few px above the baseline.
      const textY = y + 5;

      if (traceGlyph) {
        const traceFade = x < options.startX ? 1 : Math.max(0.35, smoothstep(options.startX, fadeInEnd, x));

        cells.push(
          `<text x="${x}" y="${textY}" class="field-trace" fill="${options.accent}" fill-opacity="${traceFade.toFixed(2)}">${escapeXml(traceGlyph)}</text>`,
        );
        continue;
      }

      const cell = column * 1009 + row;

      if (hashCell(cell, options.seed) < 0.3) {
        continue;
      }

      const fade =
        smoothstep(options.startX, fadeInEnd, x) * smoothstep(0, 110, y) * smoothstep(height + 10, height - 120, y);
      const traceAtColumn = traceY(column);
      const glow = traceAtColumn === null ? 0 : glowFalloff(Math.abs(y - traceAtColumn), glowRadius);
      const opacity = fade * (0.15 + glow * 0.45);

      if (opacity < 0.02) {
        continue;
      }

      const glyph = ASCII_GLYPHS[Math.floor(hashCell(cell, options.seed + 1) * ASCII_GLYPHS.length)];
      const fill = glow > 0.18 ? options.accent : colors.foreground;

      cells.push(
        `<text x="${x}" y="${textY}" class="field" fill="${fill}" fill-opacity="${opacity.toFixed(2)}">${escapeXml(glyph)}</text>`,
      );
    }
  }

  return `<g>${cells.join("")}</g>`;
}

const TRACE_PATH = "M4 60 H56 Q63 46 72 60 H86 L94 68 L106 8 L118 70 L126 44 L134 60 H156 Q166 42 178 60 H236";

// The headline's PulseTrace, scaled so its baseline (y=60 of 72) lands on `baselineY`.
function pulseTrace(x: number, baselineY: number, traceWidth: number, stroke: string) {
  const scale = traceWidth / 240;
  const y = baselineY - 60 * scale;
  const base = `fill="none" stroke-linecap="round" stroke-linejoin="round" d="${TRACE_PATH}"`;

  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path ${base} stroke="${stroke}" stroke-width="${16 / scale}" opacity="0.16" filter="url(#trace-glow)"/>
    <path ${base} stroke="${stroke}" stroke-width="${6 / scale}"/>
  </g>`;
}

// The header lockup: the V mark in an ink disc, the name, and the page's address.
function brand(address: string) {
  const discSize = 60;
  const markSize = 38;
  const markOffset = (discSize - markSize) / 2;
  const markScale = markSize / 512;

  return `<g>
    <circle cx="${marginX + discSize / 2}" cy="${64 + discSize / 2}" r="${discSize / 2}" fill="${colors.foreground}"/>
    <g transform="translate(${marginX + markOffset} ${64 + markOffset + 2}) scale(${markScale})">
      <path d="${logoPath}" fill="${colors.card}"/>
    </g>
    <text x="${marginX + discSize + 18}" y="90" class="brand">${escapeXml(SITE_PROFILE.name)}</text>
    <text x="${marginX + discSize + 18}" y="117" class="address">${escapeXml(address)}</text>
  </g>`;
}

function baseSvg(inner: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="trace-glow" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="5"/>
    </filter>
  </defs>
  <style>
    .brand { font: 800 25px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.foreground}; }
    .address { font: 600 17px MonoLisaText, ui-sans-serif, system-ui, sans-serif; fill: ${colors.muted}; }
    .eyebrow { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 500; fill: ${colors.muted}; }
    .display { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 900; fill: ${colors.foreground}; letter-spacing: -0.02em; }
    .lede { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 400; fill: ${colors.muted}; }
    .tags { font-family: MonoLisaText, ui-sans-serif, system-ui, sans-serif; font-weight: 500; fill: ${colors.foreground}; }
    .field { font: 500 15px MonoLisaCode, ui-monospace, monospace; }
    .field-trace { font: 700 16px MonoLisaCode, ui-monospace, monospace; }
  </style>
  <rect width="${width}" height="${height}" fill="${colors.background}"/>
  ${inner}
</svg>`;
}

function homeSvg() {
  const headlineSize = 100;
  const lineHeight = 96;
  const firstBaseline = 252;
  const pulseBaseline = firstBaseline + lineHeight * 2;
  const pulseWordEnd = marginX + approxTextWidth("pulse", headlineSize) * 1.02;
  const traceX = pulseWordEnd + 14;
  const traceWidth = 170;
  const lede = fittedLines(SITE_PROFILE.summary, {
    maxWidth: 560,
    maxLines: 2,
    idealSize: 26,
    minSize: 22,
  });

  return baseSvg(`
    ${asciiField({
      seed: 2,
      startX: 640,
      baselineY: pulseBaseline,
      accent: colors.accent,
      traceStartX: traceX + traceWidth - 10,
      beatOffset: 18,
    })}
    ${brand(SITE_PROFILE.domain)}
    ${textBlock(["Software", "with a", "pulse"], {
      x: marginX - 4,
      y: firstBaseline,
      fontSize: headlineSize,
      lineHeight,
      className: "display",
    })}
    ${pulseTrace(traceX, pulseBaseline, traceWidth, colors.accent)}
    ${textBlock(lede.lines, { x: marginX, y: 520, fontSize: lede.fontSize, lineHeight: 36, className: "lede" })}
  `);
}

function projectsSvg() {
  const names = projects.map(project => project.name).join(", ");
  const lede = fittedLines("From IT operations to restaurant kitchens, and my part in each.", {
    maxWidth: textColumnWidth,
    maxLines: 2,
    idealSize: 28,
    minSize: 22,
  });
  const list = fittedLines(names, { maxWidth: 1040, maxLines: 1, idealSize: 20, minSize: 15 });

  return baseSvg(`
    ${asciiField({ seed: 3, startX: 780, baselineY: 330, accent: colors.accent, beatOffset: 6 })}
    ${brand(`${SITE_PROFILE.domain}/projects`)}
    ${textBlock(["Client work"], { x: marginX - 4, y: 320, fontSize: 112, lineHeight: 0, className: "display" })}
    ${textBlock(lede.lines, { x: marginX, y: 394, fontSize: lede.fontSize, lineHeight: 38, className: "lede" })}
    ${textBlock(list.lines, { x: marginX, y: 556, fontSize: list.fontSize, lineHeight: 0, className: "tags" })}
  `);
}

function projectSvg(project: Project) {
  const accent = accentColors[project.accent];
  const title = fittedLines(project.name, {
    maxWidth: textColumnWidth,
    maxLines: 1,
    idealSize: 96,
    minSize: 56,
    measureScale: 1.04,
  });
  const headline = fittedLines(project.detail.headline, {
    maxWidth: textColumnWidth,
    maxLines: 3,
    idealSize: 27,
    minSize: 21,
  });
  const eyebrow = fittedLines(`${project.period} · ${project.role}`, {
    maxWidth: textColumnWidth,
    maxLines: 1,
    idealSize: 22,
    minSize: 16,
    measureScale: 1.04,
  });
  // Keep the cap height a fixed distance under the eyebrow when long names shrink.
  const titleY = Math.round(250 + title.fontSize * 0.73);

  return baseSvg(`
    ${asciiField({ seed: seedFrom(project.slug), startX: 720, baselineY: 344, accent, beatOffset: seedFrom(project.slug) % 20 })}
    ${brand(`${SITE_PROFILE.domain}/project/${project.slug}`)}
    ${textBlock(eyebrow.lines, { x: marginX, y: 214, fontSize: eyebrow.fontSize, lineHeight: 0, className: "eyebrow" })}
    ${textBlock(title.lines, { x: marginX - 3, y: titleY, fontSize: title.fontSize, lineHeight: 0, className: "display" })}
    ${textBlock(headline.lines, { x: marginX, y: titleY + 70, fontSize: headline.fontSize, lineHeight: 37, className: "lede" })}
    ${textBlock([project.tags.slice(0, 3).join(", ")], { x: marginX, y: 556, fontSize: 20, lineHeight: 0, className: "tags" })}
  `);
}

function blogIndexSvg() {
  const copy = BLOG_UI.en;
  const title = fittedLines(copy.title, {
    maxWidth: 660,
    maxLines: 2,
    idealSize: 100,
    minSize: 72,
    measureScale: 1.04,
  });
  const lede = fittedLines(copy.description, {
    maxWidth: textColumnWidth,
    maxLines: 3,
    idealSize: 27,
    minSize: 22,
  });
  const titleLineHeight = Math.round(title.fontSize * 0.98);

  return baseSvg(`
    ${asciiField({ seed: 4, startX: 760, baselineY: 318, accent: colors.accent, beatOffset: 10 })}
    ${brand(`${SITE_PROFILE.domain}/blog`)}
    ${textBlock(title.lines, { x: marginX - 4, y: 264, fontSize: title.fontSize, lineHeight: titleLineHeight, className: "display" })}
    ${textBlock(lede.lines, {
      x: marginX,
      y: 264 + titleLineHeight * (title.lines.length - 1) + 74,
      fontSize: lede.fontSize,
      lineHeight: 37,
      className: "lede",
    })}
  `);
}

function blogArticleSvg(post: BlogPostSummary) {
  const title = fittedLines(post.title, {
    maxWidth: 680,
    maxLines: 3,
    idealSize: 72,
    minSize: 46,
    measureScale: 1.04,
  });
  const description = fittedLines(post.description, {
    maxWidth: 680,
    maxLines: title.lines.length >= 3 ? 2 : 3,
    idealSize: 25,
    minSize: 20,
  });
  const titleLineHeight = Math.round(title.fontSize * 1.04);
  const titleY = 236 + title.fontSize * 0.55;
  const descriptionY = titleY + titleLineHeight * (title.lines.length - 1) + 64;
  const tagsY = Math.min(590, Math.max(566, descriptionY + 34 * (description.lines.length - 1) + 52));

  return baseSvg(`
    ${asciiField({ seed: seedFrom(`${post.locale}/${post.slug}`), startX: 800, baselineY: 370, accent: colors.accent, beatOffset: seedFrom(post.slug) % 20 })}
    ${brand(`${SITE_PROFILE.domain}/blog/${post.locale}/${post.slug}`)}
    ${textBlock([`${post.publishedAt.slice(0, 10)} · ${BLOG_LOCALE_LABELS[post.locale]}`], {
      x: marginX,
      y: 206,
      fontSize: 22,
      lineHeight: 0,
      className: "eyebrow",
    })}
    ${textBlock(title.lines, { x: marginX - 3, y: titleY, fontSize: title.fontSize, lineHeight: titleLineHeight, className: "display" })}
    ${textBlock(description.lines, { x: marginX, y: descriptionY, fontSize: description.fontSize, lineHeight: 34, className: "lede" })}
    ${textBlock([post.tags.slice(0, 3).join(", ")], { x: marginX, y: tagsY, fontSize: 20, lineHeight: 0, className: "tags" })}
  `);
}

async function writePng(svg: string, outputPath: string) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(outputPath);
}

async function writeBlogArticle(post: BlogPostSummary) {
  const outputPath = path.join(process.cwd(), "public", post.socialImage.path.replace(/^\//, ""));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writePng(blogArticleSvg(post), outputPath);
}

async function main() {
  const slug = process.argv[2];
  if (slug) {
    const editions = getAllBlogPosts({ includeDrafts: true }).filter(post => post.slug === slug);
    if (editions.length === 0) throw new Error(`Unknown blog slug: ${slug}`);
    await Promise.all(editions.map(post => writeBlogArticle(post)));
    return;
  }

  await mkdir(outDir, { recursive: true });
  await writePng(homeSvg(), homeOut);
  await writePng(projectsSvg(), path.join(outDir, "projects.png"));
  await writePng(blogIndexSvg(), path.join(outDir, "blog.png"));

  await Promise.all([
    ...projects.map(project => writePng(projectSvg(project), path.join(outDir, `project-${project.slug}.png`))),
    ...getAllBlogPosts({ includeDrafts: false }).map(post => writeBlogArticle(post)),
  ]);
}

await main();
