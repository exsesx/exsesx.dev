"use client";

import { useEffect, useRef } from "react";
import {
  ASCII_GLYPHS,
  DENSITY_RAMP,
  ecgHeight,
  fieldPixelRatio,
  glowFalloff,
  glyphIndexFor,
  hashCell,
  rippleProfile,
  smoothstep,
  traceGlyphFor,
} from "@/lib/ascii-field";
import { MOTION_DATASET_KEYS } from "@/lib/motion-contract";
import { cn } from "@/lib/utils";

/*
 * The homepage hero's instrument: a field of MonoLisa glyphs beside the copy,
 * read like a heart monitor. The beam leaves the headline's own pulse mark and
 * sweeps the trace across the field, phosphor fading behind it, and each
 * beat's R peak sends a soft splash through the glyphs (rings drawn as glyph
 * density, so they read as water, not noise). Then the field rests until the
 * next pulse: a short sweep every few seconds, the first one picking up where
 * the headline's mark finishes drawing. The cursor gets a lens that follows it
 * and stays where it rests; quick moves leave a wake, a click or a tap a
 * splash. Pulses run only while the hero is on screen and the tab is visible;
 * reduced motion gets one still frame.
 *
 * Cost model, Canvas 2D on a single canvas, at the display's refresh rate:
 * - The grid lives in device pixels with whole-pixel cells, so every cell owns
 *   an exact rectangle that can be cleared and redrawn on its own.
 * - Glyphs are pre-rendered once into an atlas (an ink row and an accent row);
 *   every draw is a drawImage blit, never fillText.
 * - A cell is redrawn only when its glyph, color or alpha step changes; splash
 *   rings visit only the cells in their annulus, not the bounding box.
 * - The backing store is capped at MAX_PIXELS, so very large screens trade a
 *   little resolution for tens of megabytes of canvas memory.
 * - Frames run only while something changes, and never off screen.
 *
 * Text inside [data-ascii-avoid] clears the field around its line boxes, so
 * copy never sits on glyphs. Colors and alpha come from CSS tokens.
 */

const FONT_SIZE = 12;
const ROW_HEIGHT = 18;
const MAX_DPR = 2;
const MAX_PIXELS = 8_000_000;
const WIDE_MIN_WIDTH = 1024;
const AVOID_PADDING = 24;
const SHIMMER_INTERVAL_MS = 400;
const SPARKLE_INTERVAL_MS = 1600;
const FADE_IN_MS = 600;
const SETTLE_FRAMES = 2;
const MIN_WEIGHT = 0.02;
const INK_ROW = 0;
const ACCENT_ROW = 1;
const BLANK_KEY = 3 << 16;
const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, label, [role='button'], [data-ascii-ignore]";

/* The cursor, in CSS px and ms: a lens on a critically damped spring per axis
   (no overshoot, settles in about LENS_RESPONSE_S), so it glides between cells
   instead of jumping; resting glyphs change only while the cursor moves. */
const LENS_RADIUS = 84;
const LENS_STRENGTH = 0.6;
const LENS_RESPONSE_S = 0.14;
const SPRING_STEP_MS = 8;
const LENS_IN_MS = 50;
const LENS_OUT_MS = 180;
const POINTER_ACTIVE_MS = 600;

/* The monitor, in CSS px and ms. */
const BEAT_SPACING = 320;
const BEAT_WIDTH_SHARE = 0.62;
// One sweep takes the same time on any screen; wider screens sweep faster.
const SWEEP_MS = 1400;
// Rest between the end of one pulse and the start of the next, and the delay
// before pulsing resumes when the hero comes back into view.
const PULSE_REST_MS = 4200;
const PULSE_RESUME_MS = 900;
const BEAM_RAMP_MS = 220;
const PHOSPHOR_MS = 450;
const PHOSPHOR_TAIL = 3;
const ERASE_GAP = 36;
const HEAD_BLOOM_RADIUS = 34;
const HEAD_BLOOM = 0.6;

/* Splashes, in CSS px and ms: a beat, a click or tap, and the cursor's wake. */
type SplashShape = { strength: number; speed: number; wavelength: number; decay: number; packet: number; life: number };

const SPLASHES: Record<"beat" | "click" | "wake", SplashShape> = {
  beat: { strength: 0.55, speed: 0.26, wavelength: 34, decay: 46, packet: 120, life: 1300 },
  click: { strength: 0.7, speed: 0.3, wavelength: 38, decay: 54, packet: 150, life: 1700 },
  wake: { strength: 0.28, speed: 0.22, wavelength: 26, decay: 30, packet: 80, life: 900 },
};
const SPLASH_SPREAD = 280;
const SPLASH_DISPERSION = 0.5;
const MAX_SPLASHES = 10;
const CREST_GAIN = 1.4;
const CREST_THRESHOLD = 0.16;
const WAKE_MIN_SPEED = 0.35;
const WAKE_INTERVAL_MS = 90;

/* The heart's rhythm: a beating trace, or the same monitor with no beat. */
export type AsciiFieldRhythm = "sinus" | "flatline";

/* Where the field lives beside its copy. "side": a stage to the right of the
   copy on wide screens (bleeding off the edge) and a band above it on narrow
   ones. "around": the field surrounds the copy, which the clear zones keep
   readable. Fractions of the canvas. */
export type AsciiFieldPlacement = "side" | "around";

type FieldLayout = {
  spot: { x: number; y: number; radiusX: number; radiusY: number };
  region: (x: number, y: number) => number;
  band: { y: number; from: number; to: number; amplitude: number };
};

const FIELD_LAYOUTS: Record<AsciiFieldPlacement, Record<"wide" | "narrow", FieldLayout>> = {
  side: {
    wide: {
      spot: { x: 0.77, y: 0.5, radiusX: 0.36, radiusY: 0.62 },
      region: x => smoothstep(0.44, 0.6, x),
      band: { y: 0.5, from: 0.5, to: 0.97, amplitude: 0.12 },
    },
    narrow: {
      spot: { x: 0.5, y: 0.28, radiusX: 0.85, radiusY: 0.3 },
      region: (_x, y) => 1 - smoothstep(0.48, 0.62, y),
      band: { y: 0.28, from: 0.03, to: 0.97, amplitude: 0.09 },
    },
  },
  around: {
    wide: {
      spot: { x: 0.55, y: 0.5, radiusX: 0.7, radiusY: 0.75 },
      region: () => 1,
      band: { y: 0.5, from: 0.03, to: 0.97, amplitude: 0.12 },
    },
    narrow: {
      spot: { x: 0.5, y: 0.45, radiusX: 1, radiusY: 0.7 },
      region: () => 1,
      band: { y: 0.3, from: 0.03, to: 0.97, amplitude: 0.09 },
    },
  },
};
const ANCHORED_MIN_SPAN = 0.25;

type Splash = Omit<SplashShape, "strength"> & { x: number; y: number; born: number; strength: number };
type Palette = {
  base: string;
  glow: string;
  baseAlpha: number;
  glowAlpha: number;
  traceAlpha: number;
  fontFamily: string;
  easeOut: string;
};

type FieldController = { dispose: () => void; setRhythm: (rhythm: AsciiFieldRhythm) => void };

/*
 * Place inside the element marked [data-ascii-host]; the field reads the
 * copy to keep clear ([data-ascii-avoid]) and the mark its trace continues
 * ([data-ascii-trace], with an optional data-ascii-baseline fraction) from
 * there. Changing `rhythm` re-draws the trace and sweeps it at once.
 */
export default function AsciiField({
  className,
  rhythm = "sinus",
  placement = "side",
}: {
  className?: string;
  rhythm?: AsciiFieldRhythm;
  placement?: AsciiFieldPlacement;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<FieldController | null>(null);
  const initial = useRef({ rhythm, placement });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const host = canvas?.closest<HTMLElement>("[data-ascii-host]");
    const atlasContext = document.createElement("canvas").getContext("2d");

    if (!canvas || !context || !host || !atlasContext) {
      return;
    }

    const controller = startAsciiField(canvas, context, host, atlasContext, initial.current);
    controllerRef.current = controller;

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setRhythm(rhythm);
  }, [rhythm]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <canvas ref={canvasRef} className="ascii-field block size-full" />
    </div>
  );
}

function startAsciiField(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  host: HTMLElement,
  atlasContext: CanvasRenderingContext2D,
  options: { rhythm: AsciiFieldRhythm; placement: AsciiFieldPlacement },
): FieldController {
  let rhythm = options.rhythm;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const atlas = atlasContext.canvas;
  const rampGlyphs = Array.from(DENSITY_RAMP, glyph => ASCII_GLYPHS.indexOf(glyph));
  const verticalGlyph = ASCII_GLYPHS.indexOf("|");
  // A route transition already moved the page into place; no entrance on top.
  const navigated = document.documentElement.dataset[MOTION_DATASET_KEYS.viewTransitionNavigated] === "true";

  const pointer = {
    clientX: -1,
    clientY: -1,
    x: 0,
    y: 0,
    lensX: 0,
    lensY: 0,
    lensVX: 0,
    lensVY: 0,
    inside: false,
    lastMove: 0,
    speed: 0,
  };
  let tap: { id: number; x: number; y: number; time: number } | null = null;
  let palette = readPalette(canvas);

  // Geometry, all in device pixels.
  let dpr = 1;
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let cellWidth = 0;
  let cellHeight = 0;
  let offsetX = 0;
  let offsetY = 0;

  // Per cell: resting ink alpha, field weight (0 on copy and outside the
  // field's region), glyph period and tick, sparkle, and what was last drawn.
  let baseAlpha = new Float32Array(0);
  let fieldWeight = new Float32Array(0);
  let period = new Float32Array(0);
  let glyphTick = new Int32Array(0);
  let sparkle = new Uint8Array(0);
  let drawnKey = new Int32Array(0);
  let shown = new Int32Array(0);

  // Per-pass buffers, valid only where their stamp is the current pass.
  let wave = new Float32Array(0);
  let waveFrame = new Uint32Array(0);
  let lens = new Float32Array(0);
  let lensFrame = new Uint32Array(0);
  let listedFrame = new Uint32Array(0);
  let current = new Int32Array(0);
  let previous = new Int32Array(0);
  let currentCount = 0;
  let previousCount = 0;
  let frameId = 1;

  // The trace, in beam order: cell, x, glyph and weight; R peaks for splashes.
  let traceSlot = new Int32Array(0);
  let traceCells = new Int32Array(0);
  let traceX = new Float32Array(0);
  let traceGlyph = new Uint8Array(0);
  let traceWeight = new Float32Array(0);
  let peaks: Array<{ x: number; y: number }> = [];
  let traceFrom = 0;
  let traceTo = 0;
  let traceY: (x: number) => number = () => 0;

  // The beam: the running sweep's start (or -1), the last one's, and whether
  // the trace already shows ahead of a sweep (after the first one, or when the
  // page arrives without an entrance).
  let sweepStart = -1;
  let lastSweepEnd = -1;
  let traceDrawn = navigated || reducedMotion.matches;
  let phosphorUntil = 0;
  let beamSpeed = 0;
  let beamHead = -1;
  let lastHead = -1;

  let splashes: Splash[] = [];
  let raf = 0;
  let pulseTimer = 0;
  let lastFrame = 0;
  let shimmerCursor = 0;
  let lensLevel = 0;
  let lastWake = 0;
  let idleFrames = 0;
  let intersecting = true;
  let faded = false;
  let disposed = false;

  const motionAllowed = () => !reducedMotion.matches;
  const running = () => !disposed && width > 0 && intersecting && !document.hidden && motionAllowed();

  function buildAtlas() {
    atlas.width = cellWidth * ASCII_GLYPHS.length;
    atlas.height = cellHeight * 2;
    atlasContext.clearRect(0, 0, atlas.width, atlas.height);
    atlasContext.font = `500 ${FONT_SIZE * dpr}px ${palette.fontFamily}`;
    atlasContext.textAlign = "center";
    atlasContext.textBaseline = "middle";

    for (const [row, color] of [palette.base, palette.glow].entries()) {
      atlasContext.fillStyle = color;

      for (let index = 0; index < ASCII_GLYPHS.length; index++) {
        atlasContext.fillText(ASCII_GLYPHS[index], (index + 0.5) * cellWidth, (row + 0.5) * cellHeight);
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();

    dpr = fieldPixelRatio(window.devicePixelRatio || 1, rect.width, rect.height, MAX_DPR, MAX_PIXELS);
    width = Math.round(rect.width * dpr);
    height = Math.round(rect.height * dpr);
    canvas.width = width;
    canvas.height = height;

    context.font = `500 ${FONT_SIZE * dpr}px ${palette.fontFamily}`;
    cellWidth = Math.ceil(context.measureText("M").width + 3 * dpr);
    cellHeight = Math.round(ROW_HEIGHT * dpr);
    cols = Math.ceil(width / cellWidth);
    // One spare row, so measure() can slide the grid to put a row on the trace.
    rows = Math.ceil(height / cellHeight) + 1;
    offsetX = Math.floor((width - cols * cellWidth) / 2);
    offsetY = 0;

    const cells = cols * rows;
    baseAlpha = new Float32Array(cells);
    fieldWeight = new Float32Array(cells);
    period = new Float32Array(cells);
    glyphTick = new Int32Array(cells);
    sparkle = new Uint8Array(cells);
    drawnKey = new Int32Array(cells).fill(-1);
    wave = new Float32Array(cells);
    waveFrame = new Uint32Array(cells);
    lens = new Float32Array(cells);
    lensFrame = new Uint32Array(cells);
    listedFrame = new Uint32Array(cells);
    current = new Int32Array(cells);
    previous = new Int32Array(cells);
    currentCount = 0;
    previousCount = 0;
    traceSlot = new Int32Array(cells).fill(-1);

    buildAtlas();
    measure();
  }

  /* Clearance around the line boxes of [data-ascii-avoid] content: 0 on the
     text, 1 past AVOID_PADDING. Line boxes, not element boxes, so the field
     can sit beside a short line instead of under the whole block. Given the
     pulse mark, its box is left out, so the trace can start flush against it. */
  function measureClearance(mark?: DOMRect) {
    const origin = canvas.getBoundingClientRect();
    const padding = AVOID_PADDING * dpr;
    const clearance = new Float32Array(cols * rows).fill(1);
    const range = document.createRange();

    for (const element of host.querySelectorAll("[data-ascii-avoid]")) {
      range.selectNodeContents(element);

      for (const rect of range.getClientRects()) {
        if (rect.width === 0 || rect.height === 0) {
          continue;
        }

        const onMarkLine = mark && rect.top <= mark.bottom && rect.bottom >= mark.top && rect.right >= mark.right - 1;

        // The mark itself, alone or at the end of its line box, stays clear for the trace.
        if (onMarkLine && rect.left >= mark.left - 1) {
          continue;
        }

        const left = (rect.left - origin.left) * dpr;
        const right = ((onMarkLine ? mark.left : rect.right) - origin.left) * dpr;
        const top = (rect.top - origin.top) * dpr;
        const bottom = (rect.bottom - origin.top) * dpr;
        const colStart = Math.max(0, Math.floor((left - padding - offsetX) / cellWidth));
        const colEnd = Math.min(cols - 1, Math.floor((right + padding - offsetX) / cellWidth));
        const rowStart = Math.max(0, Math.floor((top - padding - offsetY) / cellHeight));
        const rowEnd = Math.min(rows - 1, Math.floor((bottom + padding - offsetY) / cellHeight));

        for (let row = rowStart; row <= rowEnd; row++) {
          for (let col = colStart; col <= colEnd; col++) {
            const x = offsetX + (col + 0.5) * cellWidth;
            const y = offsetY + (row + 0.5) * cellHeight;
            const distance = Math.hypot(Math.max(left - x, 0, x - right), Math.max(top - y, 0, y - bottom));
            const index = row * cols + col;
            clearance[index] = Math.min(clearance[index], smoothstep(0, padding, distance));
          }
        }
      }
    }

    range.detach();

    return clearance;
  }

  /* Region, spotlight, clear zones, glyph timing and the trace, per cell. */
  function measure() {
    if (width === 0) {
      return;
    }

    const now = performance.now();
    const layout = FIELD_LAYOUTS[options.placement][width / dpr >= WIDE_MIN_WIDTH ? "wide" : "narrow"];
    const origin = canvas.getBoundingClientRect();
    const markElement = host.querySelector<HTMLElement>("[data-ascii-trace]");
    const mark = markElement?.getBoundingClientRect();
    const markBaseline = Number.parseFloat(markElement?.dataset.asciiBaseline ?? "") || 0.5;
    const markRight = mark ? (mark.right - origin.left) * dpr : 0;
    // "side" anchors on wide screens only (narrow ones get a band above the
    // copy); "around" anchors wherever enough width remains past the mark.
    const anchorable = options.placement === "around" || width / dpr >= WIDE_MIN_WIDTH;
    const anchored = mark && anchorable && (width - markRight) / width >= ANCHORED_MIN_SPAN;
    const anchor = anchored ? { right: markRight, amplitude: mark.height * 2 * dpr } : null;
    const baseline = anchored ? (mark.top - origin.top + mark.height * markBaseline) * dpr : height * layout.band.y;

    // Slide the grid so a row's center sits exactly on the trace's baseline,
    // and the field's line continues the headline's mark without a step.
    offsetY = Math.round((((baseline - cellHeight / 2) % cellHeight) + cellHeight) % cellHeight) - cellHeight;

    const clearance = measureClearance();
    const edges = (y: number) => smoothstep(0, height * 0.14, y) * smoothstep(0, height * 0.12, height - y);
    const shownCells: number[] = [];

    for (let index = 0; index < clearance.length; index++) {
      const x = offsetX + ((index % cols) + 0.5) * cellWidth;
      const y = offsetY + (Math.floor(index / cols) + 0.5) * cellHeight;
      const spotDistance = Math.hypot(
        (x - width * layout.spot.x) / (width * layout.spot.radiusX),
        (y - height * layout.spot.y) / (height * layout.spot.radiusY),
      );
      const spot = 1 - smoothstep(0.3, 1, spotDistance);
      const weight = clearance[index] * edges(y) * layout.region(x / width, y / height);
      const seed = hashCell(index, 7);

      fieldWeight[index] = weight;
      baseAlpha[index] = spot * weight < MIN_WEIGHT ? 0 : palette.baseAlpha * (0.35 + 0.65 * seed) * spot * weight;
      period[index] = 2400 + seed * 6000;
      glyphTick[index] = Math.floor(now / period[index]);
      sparkle[index] = 0;

      if (baseAlpha[index] > 0) {
        shownCells.push(index);
      }
    }

    shown = Int32Array.from(shownCells);
    shimmerCursor = 0;
    measureTrace(layout, mark ? measureClearance(mark) : clearance, edges, anchor, baseline);
  }

  /* Places the trace: leaving the headline's pulse mark when there is room
     beside it, otherwise across the layout's band. */
  function measureTrace(
    layout: FieldLayout,
    clearance: Float32Array,
    edges: (y: number) => number,
    anchor: { right: number; amplitude: number } | null,
    baseline: number,
  ) {
    const anchored = anchor !== null;
    const amplitude = anchor ? anchor.amplitude : height * layout.band.amplitude;

    traceFrom = anchor ? anchor.right : width * layout.band.from;
    traceTo = width * (anchor ? 0.98 : layout.band.to);

    const span = traceTo - traceFrom;
    const flat = rhythm === "flatline";
    const beats = Math.max(1, Math.round(span / (BEAT_SPACING * dpr)));

    beamSpeed = span / SWEEP_MS;
    const spacing = span / beats;
    const beatWidth = Math.min(spacing * BEAT_WIDTH_SHARE, 240 * dpr);
    const lead = (spacing - beatWidth) / 2;
    const fadeEnd = span * 0.1;
    const fadeStart = anchored ? 0 : span * 0.1;

    traceY = (x: number) => {
      const within = (x - traceFrom) % spacing;
      return flat ? baseline : baseline - amplitude * ecgHeight((within - lead) / beatWidth);
    };
    peaks = Array.from({ length: flat ? 0 : beats }, (_, beat) => ({
      x: traceFrom + beat * spacing + lead + 0.41 * beatWidth,
      y: baseline - amplitude,
    }));

    const cells: number[] = [];
    const positions: number[] = [];
    const glyphs: number[] = [];
    const weights: number[] = [];
    let previousRow = -1;

    traceSlot.fill(-1);

    for (let col = 0; col < cols; col++) {
      const x = offsetX + (col + 0.5) * cellWidth;

      if (x < traceFrom || x > traceTo) {
        previousRow = -1;
        continue;
      }

      const y = traceY(x);
      const slope = (traceY(x + cellWidth / 2) - traceY(x - cellWidth / 2)) / cellWidth;
      const row = Math.min(rows - 1, Math.max(0, Math.floor((y - offsetY) / cellHeight)));
      // Join this column to the last one so a spike stays a solid wall.
      const firstRow = previousRow < 0 ? row : Math.min(row, previousRow + 1);
      const lastRow = previousRow < 0 ? row : Math.max(row, previousRow - 1);
      const ends =
        (fadeStart > 0 ? smoothstep(traceFrom, traceFrom + fadeStart, x) : 1) *
        smoothstep(traceTo, traceTo - fadeEnd, x);

      for (let fillRow = firstRow; fillRow <= lastRow; fillRow++) {
        const index = fillRow * cols + col;
        const cellY = offsetY + (fillRow + 0.5) * cellHeight;
        const weight = ends * edges(cellY) * clearance[index];

        if (weight < MIN_WEIGHT || clearance[index] < 0.5) {
          continue;
        }

        traceSlot[index] = cells.length;
        cells.push(index);
        positions.push(x);
        glyphs.push(fillRow === row ? ASCII_GLYPHS.indexOf(traceGlyphFor(slope)) : verticalGlyph);
        weights.push(weight);
      }

      previousRow = row;
    }

    traceCells = Int32Array.from(cells);
    traceX = Float32Array.from(positions);
    traceGlyph = Uint8Array.from(glyphs);
    traceWeight = Float32Array.from(weights);
  }

  /* Queues the next pulse; a pending one is replaced. */
  function schedulePulse(delay: number) {
    window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      pulseTimer = 0;
      startSweep(performance.now());
    }, delay);
  }

  /* One sweep of the beam, from the headline's mark to the edge. */
  function startSweep(now: number) {
    if (sweepStart >= 0 || traceTo <= traceFrom || !running()) {
      return;
    }

    sweepStart = now;
    lastHead = traceFrom - 1;
    wake();
  }

  function updateBeam(now: number) {
    if (sweepStart < 0) {
      beamHead = -1;
      return;
    }

    // Eases up from rest, so the beam picks up the headline's mark (which ends
    // on an ease-in-out) without a kick, then runs at constant speed.
    const elapsed = now - sweepStart;
    const travelled = elapsed - BEAM_RAMP_MS * (1 - Math.exp(-elapsed / BEAM_RAMP_MS));
    const head = traceFrom + travelled * beamSpeed;

    if (head < traceTo) {
      beamHead = head;
      return;
    }

    // Swept: the trace now rests in place while the phosphor fades.
    lastSweepEnd = now;
    schedulePulse(PULSE_REST_MS);
    sweepStart = -1;
    beamHead = -1;
    traceDrawn = true;
    phosphorUntil = now + PHOSPHOR_MS * PHOSPHOR_TAIL;
  }

  /* The trace's alpha at a slot: bright where the beam just passed, resting
     elsewhere, and absent in the erase gap or before the first sweep. */
  function traceAlphaAt(slot: number, now: number) {
    const weight = traceWeight[slot];
    const rest = palette.traceAlpha * 0.55 * weight;
    let age: number;

    if (beamHead >= 0) {
      const ahead = traceX[slot] - beamHead;

      if (ahead > 0) {
        return ahead <= ERASE_GAP * dpr || !traceDrawn ? 0 : rest;
      }

      age = -ahead / beamSpeed;
    } else if (lastSweepEnd >= 0 && now < phosphorUntil) {
      age = now - lastSweepEnd + (traceTo - traceX[slot]) / beamSpeed;
    } else {
      return traceDrawn ? rest : 0;
    }

    return rest + (weight - rest) * Math.exp(-age / PHOSPHOR_MS);
  }

  function drawGlyph(key: number, index: number, glyph: number, row: number, alpha: number) {
    const x = offsetX + (index % cols) * cellWidth;
    const y = offsetY + Math.floor(index / cols) * cellHeight;

    drawnKey[index] = key;
    context.clearRect(x, y, cellWidth, cellHeight);

    if (key === BLANK_KEY) {
      return;
    }

    context.globalAlpha = alpha;
    context.drawImage(atlas, glyph * cellWidth, row * cellHeight, cellWidth, cellHeight, x, y, cellWidth, cellHeight);
  }

  /* Resolves what a cell shows (a splash crest, the trace, a lit glyph, the
     resting field or nothing) and redraws it only if that changed. */
  function paintCell(index: number, now: number) {
    const level = waveFrame[index] === frameId ? wave[index] : 0;
    const light = lensFrame[index] === frameId ? lens[index] : 0;
    const crest = Math.min(1, Math.max(0, level * CREST_GAIN));
    const trough = Math.min(1, Math.max(0, -level * CREST_GAIN));
    const slot = traceSlot[index];
    const trace = slot >= 0 ? traceAlphaAt(slot, now) : 0;
    let glyph = 0;
    let row = INK_ROW;
    let alpha = 0;

    if (crest >= CREST_THRESHOLD) {
      glyph = rampGlyphs[Math.min(rampGlyphs.length - 1, Math.floor(crest ** 1.3 * rampGlyphs.length))];
      row = ACCENT_ROW;
      alpha = Math.max(baseAlpha[index], crest * palette.glowAlpha);
    } else if (trace > 0) {
      glyph = traceGlyph[slot];
      row = ACCENT_ROW;
      alpha = Math.min(1, trace + light * 0.4);
    } else if (light * fieldWeight[index] >= 0.04) {
      glyph = glyphIndexFor(index, glyphTick[index]);
      row = ACCENT_ROW;
      alpha = Math.max(baseAlpha[index], light * palette.glowAlpha * fieldWeight[index]);
    } else if (baseAlpha[index] > 0) {
      glyph = glyphIndexFor(index, glyphTick[index]);
      alpha = baseAlpha[index] * (sparkle[index] ? 2.5 : 1) * (1 - trough);
    }

    const step = Math.round(Math.min(1, alpha) * 63);
    const key = step === 0 ? BLANK_KEY : (row << 16) | (glyph << 8) | step;

    if (key !== drawnKey[index]) {
      drawGlyph(key, index, glyph, row, step / 63);
    }
  }

  function listCell(index: number) {
    if (listedFrame[index] !== frameId) {
      listedFrame[index] = frameId;
      current[currentCount++] = index;
    }
  }

  function addWave(index: number, value: number) {
    if (waveFrame[index] !== frameId) {
      waveFrame[index] = frameId;
      wave[index] = 0;
      listCell(index);
    }

    wave[index] += value;
  }

  function addLight(index: number, value: number) {
    if (lensFrame[index] !== frameId) {
      lensFrame[index] = frameId;
      lens[index] = 0;
      listCell(index);
    }

    lens[index] = Math.max(lens[index], value);
  }

  function lightArea(x: number, y: number, radius: number, strength: number) {
    const colStart = Math.max(0, Math.floor((x - radius - offsetX) / cellWidth));
    const colEnd = Math.min(cols - 1, Math.floor((x + radius - offsetX) / cellWidth));
    const rowStart = Math.max(0, Math.floor((y - radius - offsetY) / cellHeight));
    const rowEnd = Math.min(rows - 1, Math.floor((y + radius - offsetY) / cellHeight));

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const distance = Math.hypot(offsetX + (col + 0.5) * cellWidth - x, offsetY + (row + 0.5) * cellHeight - y);
        const value = glowFalloff(distance, radius) * strength;

        if (value > 0) {
          addLight(row * cols + col, value);
        }
      }
    }
  }

  /* Adds one splash to the wave buffer, visiting only its annulus. */
  function depositSplash(splash: Splash, now: number) {
    const age = now - splash.born;
    const radius = age * splash.speed;
    // Rings spread apart as they travel, the way water disperses.
    const wavelength = splash.wavelength * (1 + (SPLASH_DISPERSION * age) / splash.life);
    const outer = radius + wavelength / 2;
    const inner = Math.max(0, radius - splash.packet);
    const fade = (1 - age / splash.life) ** 2 * splash.strength;
    const spread = SPLASH_SPREAD * dpr;
    const rowStart = Math.max(0, Math.floor((splash.y - outer - offsetY) / cellHeight));
    const rowEnd = Math.min(rows - 1, Math.floor((splash.y + outer - offsetY) / cellHeight));

    const depositSpan = (row: number, fromX: number, toX: number) => {
      const y = offsetY + (row + 0.5) * cellHeight;
      const colStart = Math.max(0, Math.floor((fromX - offsetX) / cellWidth));
      const colEnd = Math.min(cols - 1, Math.floor((toX - offsetX) / cellWidth));

      for (let col = colStart; col <= colEnd; col++) {
        const index = row * cols + col;

        if (fieldWeight[index] === 0) {
          continue;
        }

        const distance = Math.hypot(offsetX + (col + 0.5) * cellWidth - splash.x, y - splash.y);
        const profile = rippleProfile(radius - distance, wavelength, splash.decay, splash.packet);

        if (profile !== 0) {
          addWave(index, (profile * fade * fieldWeight[index]) / Math.sqrt(1 + distance / spread));
        }
      }
    };

    for (let row = rowStart; row <= rowEnd; row++) {
      const dy = offsetY + (row + 0.5) * cellHeight - splash.y;
      const outerSpan = Math.sqrt(Math.max(0, outer * outer - dy * dy));
      const innerSpan = Math.sqrt(Math.max(0, inner * inner - dy * dy));

      if (outerSpan === 0) {
        continue;
      }

      if (innerSpan === 0) {
        depositSpan(row, splash.x - outerSpan, splash.x + outerSpan);
      } else {
        depositSpan(row, splash.x - outerSpan, splash.x - innerSpan);
        depositSpan(row, splash.x + innerSpan, splash.x + outerSpan);
      }
    }
  }

  function addSplash(x: number, y: number, kind: keyof typeof SPLASHES, now: number, strength?: number) {
    const shape = SPLASHES[kind];

    splashes.push({
      x,
      y,
      born: now,
      strength: strength ?? shape.strength,
      speed: shape.speed * dpr,
      wavelength: shape.wavelength * dpr,
      decay: shape.decay * dpr,
      packet: shape.packet * dpr,
      life: shape.life,
    });

    // Over the cap, drop the faintest ring, never a young beat or click.
    if (splashes.length > MAX_SPLASHES) {
      let faintest = 0;
      let faintestEnergy = Number.POSITIVE_INFINITY;

      for (const [item, splash] of splashes.entries()) {
        const energy = (1 - (now - splash.born) / splash.life) ** 2 * splash.strength;

        if (energy < faintestEnergy) {
          faintestEnergy = energy;
          faintest = item;
        }
      }

      splashes.splice(faintest, 1);
    }
  }

  /* Splashes every R peak the beam crossed since the last frame. */
  function splashCrossedPeaks(now: number) {
    if (beamHead < 0) {
      lastHead = -1;
      return;
    }

    for (const peak of peaks) {
      if (peak.x > lastHead && peak.x <= beamHead) {
        addSplash(peak.x, peak.y, "beat", now);
      }
    }

    lastHead = beamHead;
  }

  /* Starts a pass: a fresh stamp, then everything lit this pass deposited. */
  function deposit(now: number) {
    frameId++;
    currentCount = 0;
    splashes = splashes.filter(splash => now - splash.born < splash.life);

    for (const splash of splashes) {
      depositSplash(splash, now);
    }

    // The lens stays where the cursor rests, not only while it moves.
    if (lensLevel > 0) {
      lightArea(pointer.lensX, pointer.lensY, LENS_RADIUS * dpr, LENS_STRENGTH * lensLevel);
    }

    if (beamHead >= 0) {
      // Behind the head, so the erase gap ahead of it stays dark.
      const bloomX = beamHead - HEAD_BLOOM_RADIUS * 0.5 * dpr;
      lightArea(bloomX, traceY(bloomX), HEAD_BLOOM_RADIUS * dpr, HEAD_BLOOM);
    }
  }

  /* Paints this pass: lit cells, cells lit last pass that fell dark, and the
     trace while it changes. Keyed redraws skip anything unchanged. */
  function paintPass(now: number, traceChanging: boolean) {
    for (let item = 0; item < currentCount; item++) {
      paintCell(current[item], now);
    }

    for (let item = 0; item < previousCount; item++) {
      const index = previous[item];

      if (listedFrame[index] !== frameId) {
        paintCell(index, now);
      }
    }

    if (traceChanging) {
      for (const index of traceCells) {
        paintCell(index, now);
      }
    }

    context.globalAlpha = 1;
    [previous, current] = [current, previous];
    previousCount = currentCount;
    currentCount = 0;
  }

  function paintAll(now: number) {
    updateBeam(now);
    deposit(now);
    drawnKey.fill(-1);
    context.globalAlpha = 1;
    context.clearRect(0, 0, width, height);

    for (const index of shown) {
      paintCell(index, now);
    }

    paintPass(now, true);
    fadeIn();
  }

  /* The first painted frame fades in instead of popping; opacity only. */
  function fadeIn() {
    if (faded) {
      return;
    }

    faded = true;

    if (motionAllowed() && !navigated) {
      canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE_IN_MS, easing: palette.easeOut });
    }
  }

  /* Advances resting glyphs whose period elapsed and flips sparkles, a slice
     per frame (a full pass per SHIMMER_INTERVAL_MS) so no frame carries the
     whole field. */
  function shimmer(now: number, elapsed: number) {
    const sparkleTick = Math.floor(now / SPARKLE_INTERVAL_MS);
    const slice = Math.ceil(shown.length * Math.min(1, elapsed / SHIMMER_INTERVAL_MS));
    const end = Math.min(shown.length, shimmerCursor + slice);

    for (let item = shimmerCursor; item < end; item++) {
      const index = shown[item];
      glyphTick[index] = Math.floor(now / period[index]);
      sparkle[index] = hashCell(index, sparkleTick) > 0.996 ? 1 : 0;
      paintCell(index, now);
    }

    shimmerCursor = end >= shown.length ? 0 : end;
  }

  /* Steps the lens's springs toward the pointer in small fixed substeps (stable
     at any frame rate); returns whether it is still moving. */
  function followLens(elapsed: number) {
    const omega = (Math.PI * 2) / LENS_RESPONSE_S;
    let remaining = elapsed;

    while (remaining > 0) {
      const dt = Math.min(remaining, SPRING_STEP_MS) / 1000;
      pointer.lensVX += (omega * omega * (pointer.x - pointer.lensX) - 2 * omega * pointer.lensVX) * dt;
      pointer.lensVY += (omega * omega * (pointer.y - pointer.lensY) - 2 * omega * pointer.lensVY) * dt;
      pointer.lensX += pointer.lensVX * dt;
      pointer.lensY += pointer.lensVY * dt;
      remaining -= SPRING_STEP_MS;
    }

    const near = Math.hypot(pointer.x - pointer.lensX, pointer.y - pointer.lensY) < 0.5 * dpr;
    const slow = Math.hypot(pointer.lensVX, pointer.lensVY) < 20 * dpr;

    if (near && slow) {
      pointer.lensX = pointer.x;
      pointer.lensY = pointer.y;
      pointer.lensVX = 0;
      pointer.lensVY = 0;
      return false;
    }

    return true;
  }

  const frame = (now: number) => {
    raf = 0;

    if (!running()) {
      lastFrame = 0;
      return;
    }

    const elapsed = lastFrame ? Math.min(64, now - lastFrame) : 16;
    const pointerActive = pointer.inside && now - pointer.lastMove < POINTER_ACTIVE_MS;
    const lensTarget = pointer.inside && finePointer.matches ? 1 : 0;

    // The lens fades in quickly and out slowly instead of switching.
    lensLevel +=
      (lensTarget - lensLevel) * (1 - Math.exp(-elapsed / (lensTarget > lensLevel ? LENS_IN_MS : LENS_OUT_MS)));

    if (Math.abs(lensTarget - lensLevel) < 0.01) {
      lensLevel = lensTarget;
    }

    const lensFading = lensLevel !== lensTarget;
    const lensMoving = lensLevel > 0 && followLens(elapsed);

    lastFrame = now;
    updateBeam(now);
    splashCrossedPeaks(now);

    // Moving fast through the field leaves a wake, like a finger through water.
    if (pointerActive && pointer.speed > WAKE_MIN_SPEED && now - lastWake > WAKE_INTERVAL_MS) {
      lastWake = now;
      addSplash(pointer.x, pointer.y, "wake", now, Math.min(SPLASHES.wake.strength, pointer.speed * 0.14));
    }

    deposit(now);

    // Resting glyphs only change while the field is touched or swept.
    if (pointerActive || sweepStart >= 0) {
      shimmer(now, elapsed);
    }

    const traceChanging = sweepStart >= 0 || now < phosphorUntil;
    paintPass(now, traceChanging);

    const busy = traceChanging || splashes.length > 0 || lensMoving || lensFading || pointerActive;

    // A couple of quiet frames after the last change let lit cells settle.
    if (busy || idleFrames < SETTLE_FRAMES) {
      idleFrames = busy ? 0 : idleFrames + 1;
      raf = requestAnimationFrame(frame);
    } else {
      lastFrame = 0;
    }
  };

  function wake() {
    idleFrames = 0;

    if (running() && !raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  /* When the mark finishes drawing in (its earliest-ending entrance), so the
     first sweep continues it. */
  function headlineDrawnAt(now: number) {
    const animations = host.querySelector("[data-ascii-trace]")?.getAnimations({ subtree: true }) ?? [];
    let drawnAt = Number.POSITIVE_INFINITY;

    for (const animation of animations) {
      const end = animation.effect?.getComputedTiming().endTime;
      const start = animation.startTime;

      if (animation.playState !== "finished" && typeof end === "number" && typeof start === "number") {
        drawnAt = Math.min(drawnAt, start + end - 350);
      }
    }

    return Number.isFinite(drawnAt) ? Math.max(now, drawnAt) : now;
  }

  /* Re-derives the frame from the current state: visibility, motion, size. */
  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;

    if (disposed || width === 0) {
      return;
    }

    if (!motionAllowed()) {
      splashes = [];
      sweepStart = -1;
      traceDrawn = true;
    }

    // Pulses wait while the hero is hidden and pick up again when it returns.
    if (!running()) {
      window.clearTimeout(pulseTimer);
      pulseTimer = 0;
    } else if (sweepStart < 0 && !pulseTimer) {
      schedulePulse(PULSE_RESUME_MS);
    }

    paintAll(performance.now());
    wake();
  }

  function toLocal(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    return { x: x * dpr, y: y * dpr, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  }

  /* A click or a tap sends a splash from where it landed. */
  function beatAt(clientX: number, clientY: number) {
    const { x, y, inside } = toLocal(clientX, clientY);

    if (!inside) {
      return;
    }

    const now = performance.now();
    addSplash(x, y, "click", now);
    wake();
  }

  function handlePointerMove(event: PointerEvent) {
    // Touch has no hover; a finger dragging is a scroll, not a light.
    if (event.pointerType === "touch" || !running()) {
      return;
    }

    const now = performance.now();
    const { x, y, inside } = toLocal(event.clientX, event.clientY);
    const elapsed = Math.max(1, now - pointer.lastMove);
    const speed = Math.hypot(x - pointer.x, y - pointer.y) / dpr / elapsed;

    // Entering the field puts the lens under the cursor instead of gliding in.
    if (inside && !pointer.inside) {
      pointer.lensX = x;
      pointer.lensY = y;
      pointer.lensVX = 0;
      pointer.lensVY = 0;
    }

    // Smoothed, and reset after a pause so the first move never reads as a jump.
    pointer.speed = elapsed > 120 ? 0 : pointer.speed * 0.6 + speed * 0.4;
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.x = x;
    pointer.y = y;
    pointer.inside = inside;
    pointer.lastMove = now;
    wake();
  }

  /* Scrolling moves the field under a resting cursor; keep the lens on it. */
  function handleScroll() {
    if (pointer.clientX < 0 || !running()) {
      return;
    }

    const { x, y, inside } = toLocal(pointer.clientX, pointer.clientY);

    if (inside && !pointer.inside) {
      pointer.lensX = x;
      pointer.lensY = y;
      pointer.lensVX = 0;
      pointer.lensVY = 0;
    }

    pointer.x = x;
    pointer.y = y;
    pointer.inside = inside;
    wake();
  }

  function handlePointerDown(event: PointerEvent) {
    const onControl = event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR);

    if (event.button !== 0 || onControl || !running()) {
      return;
    }

    // A touch only counts as a tap once it lifts without turning into a scroll.
    if (event.pointerType === "touch") {
      tap = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
      return;
    }

    beatAt(event.clientX, event.clientY);
  }

  function handlePointerUp(event: PointerEvent) {
    const start = tap;
    tap = null;

    if (!start || event.pointerId !== start.id || !running()) {
      return;
    }

    const quick = performance.now() - start.time <= 350;
    const still = Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 10;

    if (quick && still) {
      beatAt(event.clientX, event.clientY);
    }
  }

  function handlePointerCancel() {
    tap = null;
  }

  function handlePointerLeave() {
    pointer.inside = false;
    wake();
  }

  function refreshPalette() {
    const next = readPalette(canvas);

    if (next.base === palette.base && next.glow === palette.glow && next.baseAlpha === palette.baseAlpha) {
      return;
    }

    palette = next;

    if (width > 0) {
      resize();
      schedule();
    }
  }

  function remeasure() {
    if (width > 0) {
      measure();
      schedule();
    }
  }

  // The first pulse picks up where the headline's mark finishes drawing.
  if (!traceDrawn) {
    const now = performance.now();
    schedulePulse(headlineDrawnAt(now) - now);
  }

  const canvasObserver = new ResizeObserver(() => {
    resize();
    schedule();
  });
  // Content reflow inside the hero (fonts, wrapping) moves the clear zones.
  const hostObserver = new ResizeObserver(remeasure);
  const intersectionObserver = new IntersectionObserver(entries => {
    intersecting = entries[entries.length - 1].isIntersecting;
    schedule();
  });
  const themeObserver = new MutationObserver(refreshPalette);
  // Entry animations translate the copy; measure again once they finish.
  const entrances = Array.from(host.querySelectorAll("[data-ascii-avoid]"), element => element.getAnimations()).flat();

  Promise.allSettled(entrances.map(animation => animation.finished)).then(() => {
    if (!disposed) {
      remeasure();
    }
  });

  canvasObserver.observe(canvas);
  hostObserver.observe(host);
  intersectionObserver.observe(canvas);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  reducedMotion.addEventListener("change", schedule);
  finePointer.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  window.addEventListener("pointerup", handlePointerUp, { passive: true });
  window.addEventListener("pointercancel", handlePointerCancel, { passive: true });
  document.documentElement.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);

  // The field's mono face may not be requested by anything else on the page
  // (phones), so load it explicitly and rebuild the grid with its metrics.
  document.fonts?.load(`500 ${FONT_SIZE}px ${palette.fontFamily}`, ASCII_GLYPHS).then(() => {
    if (!disposed) {
      palette = readPalette(canvas);
      resize();
      schedule();
    }
  });

  /* A new rhythm re-draws the trace and shows it with an immediate sweep. */
  function setRhythm(next: AsciiFieldRhythm) {
    if (next === rhythm) {
      return;
    }

    rhythm = next;
    measure();
    schedule();
    window.clearTimeout(pulseTimer);
    pulseTimer = 0;
    startSweep(performance.now());
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(pulseTimer);
    canvasObserver.disconnect();
    hostObserver.disconnect();
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    reducedMotion.removeEventListener("change", schedule);
    finePointer.removeEventListener("change", schedule);
    document.removeEventListener("visibilitychange", schedule);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerCancel);
    document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("blur", handlePointerLeave);
  }

  return { dispose, setRhythm };
}

function readPalette(canvas: HTMLCanvasElement): Palette {
  const style = getComputedStyle(canvas);
  const read = (name: string) => style.getPropertyValue(name).trim();

  return {
    base: read("--ascii-base") || style.color,
    glow: read("--ascii-glow") || style.color,
    baseAlpha: Number.parseFloat(read("--ascii-base-alpha")) || 0.08,
    glowAlpha: Number.parseFloat(read("--ascii-glow-alpha")) || 0.8,
    traceAlpha: Number.parseFloat(read("--ascii-trace-alpha")) || 0.4,
    fontFamily: style.fontFamily,
    easeOut: read("--ease-out") || "ease-out",
  };
}
