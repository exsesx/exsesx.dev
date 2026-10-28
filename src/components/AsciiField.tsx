"use client";

import { useEffect, useRef } from "react";
import { ASCII_GLYPHS, glowFalloff, glyphIndexFor, hashCell, smoothstep } from "@/lib/ascii-field";
import { cn } from "@/lib/utils";

/*
 * Quiet ASCII field in the open side of the homepage hero. A faint grid of
 * MonoLisa glyphs drifts slowly inside a soft spotlight; the pointer lights a
 * small radius of cells in the accent color and a click sends a ripple.
 *
 * Cost model, Canvas 2D:
 * - Glyphs are pre-rendered once into an atlas (base + accent rows), so every
 *   draw is a drawImage blit instead of fillText shaping.
 * - The faint base field lives on an offscreen layer repainted only on a slow
 *   shimmer tick (every SHIMMER_INTERVAL_MS) and only for cells inside the
 *   spotlight.
 * - requestAnimationFrame runs only while cells are lit (pointer moving or a
 *   ripple in flight); idle, a timer repaints the base layer and nothing else.
 * - Reduced motion gets one still frame.
 *
 * Content marked [data-ascii-avoid] clears the base field around it, so copy
 * never sits on glyphs. Colors and alpha come from CSS tokens (.ascii-field).
 *
 * Narrow layouts have no open side, so the hero renders a [data-ascii-stage]
 * block under the copy: the field is strongest there and keeps a faint texture
 * behind the copy. Without hover, a slow double beat ripples out of the
 * headline's ECG trace, and a finger lights cells while scrolling or tapping.
 */

const FONT_SIZE = 12;
const ROW_HEIGHT = 18;
const MAX_DPR = 2;
const GLOW_RADIUS = 96;
const AVOID_PADDING = 48;
const ENERGY_HALF_LIFE_MS = 220;
const POINTER_IDLE_MS = 900;
const SHIMMER_INTERVAL_MS = 400;
const SCRAMBLE_INTERVAL_MS = 90;
const RIPPLE_SPEED = 0.42; // px per ms
const RIPPLE_BAND = 18;
const HEARTBEAT_BAND = 30;
const RIPPLE_LIFE_MS = 1400;
const LIT_THRESHOLD = 0.03;
const HEARTBEAT_INTERVAL_MS = 5200;
const HEARTBEAT_FIRST_MS = 1400;
const HEARTBEAT_ECHO_MS = 200;
// Narrow layouts: share of the field kept behind copy, and the texture floor outside the stage.
const STAGE_CLEARANCE_FLOOR = 0.5;
const STAGE_AMBIENT = 0.6;
const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, label, [role='button'], [data-ascii-ignore]";

type Ripple = { x: number; y: number; born: number; strength: number; band: number };
type Palette = { base: string; glow: string; baseAlpha: number; glowAlpha: number; fontFamily: string };

export default function AsciiField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // The wrapper div positions the canvas; its parent holds the content to avoid.
    const host = canvas?.parentElement?.parentElement;
    // Offscreen surfaces: the glyph atlas and the slowly repainted base field.
    const atlas = document.createElement("canvas");
    const baseLayer = document.createElement("canvas");
    const atlasContext = atlas.getContext("2d");
    const baseContext = baseLayer.getContext("2d");

    if (!canvas || !context || !host || !atlasContext || !baseContext) {
      return;
    }

    return startAsciiField(canvas, context, host, atlasContext, baseContext);
  }, []);

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
  baseContext: CanvasRenderingContext2D,
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const atlas = atlasContext.canvas;
  const baseLayer = baseContext.canvas;

  const pointer = { x: 0, y: 0, inside: false, lastMove: 0 };
  let palette = readPalette(canvas);
  let dpr = 1;
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let cellWidth = 8;
  let offsetX = 0;
  let offsetY = 0;
  // Per cell: lit energy, base-field weight (spotlight x text clearance), glow weight.
  let energy = new Float32Array(0);
  let baseWeight = new Float32Array(0);
  let glowWeight = new Float32Array(0);
  let ripples: Ripple[] = [];
  let pulseOrigin = { x: 0, y: 0 };
  let raf = 0;
  let idleTimer = 0;
  let heartbeatTimer = 0;
  let lastFrame = 0;
  let lastBasePaint = 0;
  let intersecting = true;
  let disposed = false;

  const animated = () => !reducedMotion.matches;
  // Without hover nothing would ever light the field, so it beats on its own.
  const ambient = () => !finePointer.matches;
  const cellX = (index: number) => offsetX + (index % cols) * cellWidth;
  const cellY = (index: number) => offsetY + Math.floor(index / cols) * ROW_HEIGHT;

  function buildAtlas() {
    const glyphWidth = Math.round(cellWidth * dpr);
    const glyphHeight = Math.round(ROW_HEIGHT * dpr);

    atlas.width = glyphWidth * ASCII_GLYPHS.length;
    atlas.height = glyphHeight * 2;
    atlasContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    atlasContext.clearRect(0, 0, atlas.width, atlas.height);
    atlasContext.font = `500 ${FONT_SIZE}px ${palette.fontFamily}`;
    atlasContext.textAlign = "center";
    atlasContext.textBaseline = "middle";

    for (const [row, color] of [palette.base, palette.glow].entries()) {
      atlasContext.fillStyle = color;

      for (let index = 0; index < ASCII_GLYPHS.length; index++) {
        atlasContext.fillText(ASCII_GLYPHS[index], (index + 0.5) * cellWidth, (row + 0.5) * ROW_HEIGHT);
      }
    }
  }

  function blitGlyph(target: CanvasRenderingContext2D, glyph: number, row: number, x: number, y: number) {
    const sourceWidth = atlas.width / ASCII_GLYPHS.length;
    const sourceHeight = atlas.height / 2;
    target.drawImage(
      atlas,
      glyph * sourceWidth,
      row * sourceHeight,
      sourceWidth,
      sourceHeight,
      x,
      y,
      cellWidth,
      ROW_HEIGHT,
    );
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();

    dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;

    for (const surface of [canvas, baseLayer]) {
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `500 ${FONT_SIZE}px ${palette.fontFamily}`;
    cellWidth = Math.ceil(context.measureText("M").width + 3);
    cols = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / ROW_HEIGHT);
    offsetX = Math.floor((width - cols * cellWidth) / 2);
    offsetY = Math.floor((height - rows * ROW_HEIGHT) / 2);
    energy = new Float32Array(cols * rows);
    baseWeight = new Float32Array(cols * rows);
    glowWeight = new Float32Array(cols * rows);
    buildAtlas();
    measure();
  }

  /*
   * Spotlight on the open side of the hero, or on the [data-ascii-stage] block
   * when one is rendered; cleared around [data-ascii-avoid].
   */
  function measure() {
    const origin = canvas.getBoundingClientRect();
    const stageRect = host.querySelector("[data-ascii-stage]")?.getBoundingClientRect();
    const staged = Boolean(stageRect && stageRect.width > 0 && stageRect.height > 0);
    const clearance = new Float32Array(cols * rows).fill(1);
    let centerX = width * 0.76;
    let centerY = height * 0.48;
    let radiusX = width * 0.34;
    let radiusY = height * 0.5;

    if (stageRect && staged) {
      centerX = stageRect.left - origin.left + stageRect.width / 2;
      centerY = stageRect.top - origin.top + stageRect.height / 2;
      radiusX = Math.max(width * 0.7, stageRect.width * 0.8);
      radiusY = Math.max(160, stageRect.height * 1.1);
    }

    // Beats start at the headline's ECG spike when it is on screen.
    const traceRect = host.querySelector(".pulse-trace")?.getBoundingClientRect();
    pulseOrigin =
      traceRect && traceRect.width > 0
        ? {
            x: traceRect.left - origin.left + traceRect.width * 0.44,
            y: traceRect.top - origin.top + traceRect.height * 0.5,
          }
        : { x: centerX, y: centerY };

    for (const element of host.querySelectorAll("[data-ascii-avoid]")) {
      const rect = element.getBoundingClientRect();
      const left = rect.left - origin.left;
      const right = rect.right - origin.left;
      const top = rect.top - origin.top;
      const bottom = rect.bottom - origin.top;
      const colStart = Math.max(0, Math.floor((left - AVOID_PADDING - offsetX) / cellWidth));
      const colEnd = Math.min(cols - 1, Math.floor((right + AVOID_PADDING - offsetX) / cellWidth));
      const rowStart = Math.max(0, Math.floor((top - AVOID_PADDING - offsetY) / ROW_HEIGHT));
      const rowEnd = Math.min(rows - 1, Math.floor((bottom + AVOID_PADDING - offsetY) / ROW_HEIGHT));

      for (let row = rowStart; row <= rowEnd; row++) {
        for (let col = colStart; col <= colEnd; col++) {
          const x = offsetX + (col + 0.5) * cellWidth;
          const y = offsetY + (row + 0.5) * ROW_HEIGHT;
          const distance = Math.hypot(Math.max(left - x, 0, x - right), Math.max(top - y, 0, y - bottom));
          const index = row * cols + col;
          clearance[index] = Math.min(clearance[index], smoothstep(0, AVOID_PADDING, distance));
        }
      }
    }

    for (let index = 0; index < clearance.length; index++) {
      const x = cellX(index) + cellWidth / 2;
      const y = cellY(index) + ROW_HEIGHT / 2;
      const distance = Math.hypot((x - centerX) / radiusX, (y - centerY) / radiusY);

      if (staged) {
        // Fade under the header and at the hero's end; keep a texture behind the copy.
        const spot = Math.max(STAGE_AMBIENT, 1 - smoothstep(0.2, 1, distance));
        const edges = smoothstep(72, 160, y) * smoothstep(0, 64, height - y);
        const clear = STAGE_CLEARANCE_FLOOR + (1 - STAGE_CLEARANCE_FLOOR) * clearance[index];

        baseWeight[index] = spot * edges * clear;
        glowWeight[index] = (0.4 + 0.6 * clearance[index]) * edges;
      } else {
        const spot = 1 - smoothstep(0.3, 1, distance);
        const edges = smoothstep(0, height * 0.14, y) * smoothstep(0, height * 0.18, height - y);

        baseWeight[index] = spot * edges * clearance[index];
        glowWeight[index] = (0.3 + 0.7 * clearance[index]) * (0.45 + 0.55 * spot) * edges;
      }
    }
  }

  function paintBase(now: number) {
    baseContext.clearRect(0, 0, width, height);
    const sparkleTick = Math.floor(now / 1600);

    for (let index = 0; index < baseWeight.length; index++) {
      const weight = baseWeight[index];

      if (weight < 0.02) {
        continue;
      }

      const seed = hashCell(index, 7);
      const sparkle = hashCell(index, sparkleTick) > 0.996 ? 2.5 : 1;
      baseContext.globalAlpha = Math.min(1, palette.baseAlpha * (0.35 + 0.65 * seed) * sparkle * weight);
      blitGlyph(
        baseContext,
        glyphIndexFor(index, Math.floor(now / (2400 + seed * 6000))),
        0,
        cellX(index),
        cellY(index),
      );
    }

    baseContext.globalAlpha = 1;
    lastBasePaint = now;
  }

  function composite(now: number) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(baseLayer, 0, 0);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scrambleTick = Math.floor(now / SCRAMBLE_INTERVAL_MS);

    for (let index = 0; index < energy.length; index++) {
      const value = energy[index];

      if (value < LIT_THRESHOLD) {
        continue;
      }

      const x = cellX(index);
      const y = cellY(index);
      context.clearRect(x, y, cellWidth, ROW_HEIGHT);
      // Never dimmer than the base glyph it replaces, so a passing ripple can't punch holes.
      context.globalAlpha = Math.min(
        1,
        palette.baseAlpha * baseWeight[index] + value * palette.glowAlpha * glowWeight[index],
      );
      blitGlyph(context, glyphIndexFor(index, scrambleTick), 1, x, y);
    }

    context.globalAlpha = 1;
  }

  function energize(x: number, y: number, radius: number, amount: (distance: number) => number) {
    const colStart = Math.max(0, Math.floor((x - radius - offsetX) / cellWidth));
    const colEnd = Math.min(cols - 1, Math.floor((x + radius - offsetX) / cellWidth));
    const rowStart = Math.max(0, Math.floor((y - radius - offsetY) / ROW_HEIGHT));
    const rowEnd = Math.min(rows - 1, Math.floor((y + radius - offsetY) / ROW_HEIGHT));

    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const value = amount(Math.hypot(offsetX + (col + 0.5) * cellWidth - x, offsetY + (row + 0.5) * ROW_HEIGHT - y));

        if (value > 0) {
          const index = row * cols + col;
          energy[index] = Math.max(energy[index], value);
        }
      }
    }
  }

  /* Decays lit cells, deposits pointer glow and ripples; returns whether anything is still lit. */
  function step(now: number, elapsed: number) {
    const decay = 0.5 ** (elapsed / ENERGY_HALF_LIFE_MS);
    let lit = false;

    for (let index = 0; index < energy.length; index++) {
      const value = energy[index] * decay;
      energy[index] = value < LIT_THRESHOLD ? 0 : value;
      lit ||= energy[index] > 0;
    }

    // A resting cursor lets its glow fade, so the loop can stop.
    if (pointer.inside && now - pointer.lastMove < POINTER_IDLE_MS) {
      energize(pointer.x, pointer.y, GLOW_RADIUS, distance => glowFalloff(distance, GLOW_RADIUS));
      lit = true;
    }

    ripples = ripples.filter(ripple => now - ripple.born < RIPPLE_LIFE_MS);

    for (const ripple of ripples) {
      const age = now - ripple.born;

      // A scheduled echo beat waits its turn but keeps the loop alive.
      if (age < 0) {
        lit = true;
        continue;
      }

      const radius = age * RIPPLE_SPEED;
      const fade = ripple.strength * (1 - age / RIPPLE_LIFE_MS) ** 1.5;

      energize(ripple.x, ripple.y, radius + ripple.band, distance => {
        const offset = Math.abs(distance - radius);
        return offset < ripple.band ? fade * (1 - offset / ripple.band) : 0;
      });
      lit = true;
    }

    return lit;
  }

  const frame = (now: number) => {
    raf = 0;
    const elapsed = lastFrame ? Math.min(64, now - lastFrame) : 16;
    lastFrame = now;
    const lit = step(now, elapsed);

    if (now - lastBasePaint >= SHIMMER_INTERVAL_MS) {
      paintBase(now);
    }

    composite(now);

    if (lit) {
      raf = requestAnimationFrame(frame);
    } else {
      lastFrame = 0;
      scheduleIdle();
    }
  };

  const idleTick = () => {
    idleTimer = 0;
    const now = performance.now();
    paintBase(now);
    composite(now);
    scheduleIdle();
  };

  function scheduleIdle() {
    window.clearTimeout(idleTimer);
    idleTimer = running() && !raf ? window.setTimeout(idleTick, SHIMMER_INTERVAL_MS) : 0;
  }

  /* A double beat ("lub-dub") from the stage, echoing the pulse in the headline. */
  function beat() {
    heartbeatTimer = 0;

    if (!running() || !ambient()) {
      return;
    }

    const now = performance.now();
    ripples.push(
      { ...pulseOrigin, born: now, strength: 1, band: HEARTBEAT_BAND },
      { ...pulseOrigin, born: now + HEARTBEAT_ECHO_MS, strength: 0.6, band: HEARTBEAT_BAND },
    );
    wake();
    heartbeatTimer = window.setTimeout(beat, HEARTBEAT_INTERVAL_MS);
  }

  // Resizes reschedule often on mobile (toolbar collapse); keep a pending beat's rhythm.
  function scheduleHeartbeat(delay: number) {
    if (!heartbeatTimer && running() && ambient()) {
      heartbeatTimer = window.setTimeout(beat, delay);
    }
  }

  function running() {
    return !disposed && intersecting && !document.hidden && animated();
  }

  function wake() {
    if (running() && !raf) {
      window.clearTimeout(idleTimer);
      idleTimer = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function drawStill() {
    energy.fill(0);
    ripples = [];
    const now = performance.now();
    paintBase(now);
    composite(now);
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;
    window.clearTimeout(idleTimer);
    idleTimer = 0;

    if (disposed || width === 0) {
      return;
    }

    if (!animated()) {
      drawStill();
      return;
    }

    if (running()) {
      drawStill();
      scheduleIdle();
      scheduleHeartbeat(HEARTBEAT_FIRST_MS);
    }
  }

  function toLocal(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerType === "touch") {
      return;
    }

    const { x, y, inside } = toLocal(event);
    pointer.x = x;
    pointer.y = y;
    pointer.inside = inside;
    pointer.lastMove = performance.now();

    if (inside) {
      wake();
    }
  }

  /* A finger lights the cells under it while it scrolls past the hero. */
  function handleTouch(event: TouchEvent) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    pointer.x = touch.clientX - rect.left;
    pointer.y = touch.clientY - rect.top;
    pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    pointer.lastMove = performance.now();

    if (pointer.inside) {
      wake();
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR))) {
      return;
    }

    const { x, y, inside } = toLocal(event);

    if (inside && running()) {
      ripples.push({ x, y, born: performance.now(), strength: 0.7, band: RIPPLE_BAND });
      wake();
    }
  }

  function handlePointerLeave() {
    pointer.inside = false;
  }

  function refreshPalette() {
    palette = readPalette(canvas);
    buildAtlas();
    schedule();
  }

  function remeasure() {
    if (width > 0) {
      measure();
      schedule();
    }
  }

  const canvasObserver = new ResizeObserver(() => {
    resize();
    schedule();
  });
  // Content reflow inside the hero (fonts, wrapping) moves the clear zones.
  const hostObserver = new ResizeObserver(remeasure);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    schedule();
  });
  const themeObserver = new MutationObserver(refreshPalette);
  // Entry animations translate the copy; measure again once they settle.
  const settleTimer = window.setTimeout(remeasure, 1200);

  canvasObserver.observe(canvas);
  hostObserver.observe(host);
  intersectionObserver.observe(canvas);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  reducedMotion.addEventListener("change", schedule);
  finePointer.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  window.addEventListener("touchstart", handleTouch, { passive: true });
  window.addEventListener("touchmove", handleTouch, { passive: true });
  document.documentElement.addEventListener("pointerleave", handlePointerLeave);
  window.addEventListener("blur", handlePointerLeave);

  // MonoLisa changes the glyph metrics once it loads; rebuild the grid then.
  document.fonts?.ready.then(() => {
    if (!disposed) {
      palette = readPalette(canvas);
      resize();
      schedule();
    }
  });

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(idleTimer);
    window.clearTimeout(heartbeatTimer);
    window.clearTimeout(settleTimer);
    canvasObserver.disconnect();
    hostObserver.disconnect();
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    reducedMotion.removeEventListener("change", schedule);
    finePointer.removeEventListener("change", schedule);
    document.removeEventListener("visibilitychange", schedule);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerDown);
    window.removeEventListener("touchstart", handleTouch);
    window.removeEventListener("touchmove", handleTouch);
    document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("blur", handlePointerLeave);
  };
}

function readPalette(canvas: HTMLCanvasElement): Palette {
  const style = getComputedStyle(canvas);
  const read = (name: string) => style.getPropertyValue(name).trim();

  return {
    base: read("--ascii-base") || style.color,
    glow: read("--ascii-glow") || style.color,
    baseAlpha: Number.parseFloat(read("--ascii-base-alpha")) || 0.08,
    glowAlpha: Number.parseFloat(read("--ascii-glow-alpha")) || 0.8,
    fontFamily: style.fontFamily,
  };
}
