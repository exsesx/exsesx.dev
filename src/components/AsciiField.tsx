"use client";

import { useEffect, useRef } from "react";
import { glowFalloff, glyphFor, hashCell, smoothstep } from "@/lib/ascii-field";
import { cn } from "@/lib/utils";

/*
 * Interactive ASCII field behind the homepage hero. A dim grid of MonoLisa
 * glyphs shimmers slowly; the pointer lights a radius of cells in the accent
 * color, a click sends a ripple, and the "pulse" headline emits a heartbeat
 * ripple every few seconds. Plain Canvas 2D: one fillText per visible cell.
 *
 * Content marked [data-ascii-avoid] dims the cells around it so copy never
 * sits on busy glyphs. Colors, alpha and font come from CSS (.ascii-field in
 * globals.css), so theme switches only need a palette re-read.
 */

const FONT_SIZE = 13;
const ROW_HEIGHT = 20;
const MAX_DPR = 2;
const GLOW_RADIUS = 120;
const AVOID_PADDING = 56;
const AVOID_FLOOR = 0.12;
const ENERGY_HALF_LIFE_MS = 260;
const SHIMMER_INTERVAL_MS = 140;
const MEASURE_INTERVAL_MS = 1000;
const HEARTBEAT_INTERVAL_MS = 4800;
const RIPPLE_SPEED = 0.48; // px per ms
const RIPPLE_BAND = 22;
const RIPPLE_LIFE_MS = 1700;
const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, label, [role='button'], [data-ascii-ignore]";

type Ripple = { x: number; y: number; born: number; strength: number };
type Palette = { base: string; glow: string; baseAlpha: number; glowAlpha: number; fontFamily: string };

export default function AsciiField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    // The wrapper div positions the canvas; its parent holds the content to avoid.
    const host = canvas?.parentElement?.parentElement;

    if (!canvas || !context || !host) {
      return;
    }

    return startAsciiField(canvas, context, host);
  }, []);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none", className)}>
      <canvas ref={canvasRef} className="ascii-field block size-full" />
    </div>
  );
}

function startAsciiField(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, host: HTMLElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, active: false };
  let palette = readPalette(canvas);
  let width = 0;
  let height = 0;
  let cols = 0;
  let rows = 0;
  let cellWidth = 8;
  let offsetX = 0;
  let offsetY = 0;
  let energy = new Float32Array(0);
  let dim = new Float32Array(0);
  let ripples: Ripple[] = [];
  let raf = 0;
  let lastFrame = 0;
  let lastPaint = 0;
  let lastMeasure = 0;
  let nextHeartbeat = 0;
  let energized = false;
  let intersecting = true;
  let disposed = false;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);

    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.font = `500 ${FONT_SIZE}px ${palette.fontFamily}`;
    cellWidth = context.measureText("M").width + 3;
    cols = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / ROW_HEIGHT);
    offsetX = (width - cols * cellWidth) / 2;
    offsetY = (height - rows * ROW_HEIGHT) / 2;
    energy = new Float32Array(cols * rows);
    dim = new Float32Array(cols * rows);
    measureAvoid();
  }

  function measureAvoid() {
    const origin = canvas.getBoundingClientRect();
    dim.fill(1);

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
          dim[index] = Math.min(dim[index], AVOID_FLOOR + (1 - AVOID_FLOOR) * smoothstep(0, AVOID_PADDING, distance));
        }
      }
    }
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

  function step(now: number, elapsed: number) {
    const decay = 0.5 ** (elapsed / ENERGY_HALF_LIFE_MS);
    let peak = 0;

    for (let index = 0; index < energy.length; index++) {
      const value = energy[index] * decay;
      energy[index] = value < 0.01 ? 0 : value;
      peak = Math.max(peak, energy[index]);
    }

    if (pointer.active) {
      energize(pointer.x, pointer.y, GLOW_RADIUS, distance => glowFalloff(distance, GLOW_RADIUS));
      peak = 1;
    }

    ripples = ripples.filter(ripple => now - ripple.born < RIPPLE_LIFE_MS);

    for (const ripple of ripples) {
      const age = now - ripple.born;
      const radius = age * RIPPLE_SPEED;
      const fade = ripple.strength * (1 - age / RIPPLE_LIFE_MS) ** 1.5;

      energize(ripple.x, ripple.y, radius + RIPPLE_BAND, distance => {
        const offset = Math.abs(distance - radius);
        return offset < RIPPLE_BAND ? fade * (1 - offset / RIPPLE_BAND) : 0;
      });
      peak = 1;
    }

    energized = peak > 0;
  }

  function paint(now: number) {
    context.clearRect(0, 0, width, height);
    context.font = `500 ${FONT_SIZE}px ${palette.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Pass 1: the dim field. Each cell has its own change rate and opacity.
    context.fillStyle = palette.base;
    for (let index = 0; index < energy.length; index++) {
      if (energy[index] > 0.04) {
        continue;
      }

      const seed = hashCell(index, 7);
      const sparkle = hashCell(index, Math.floor(now / 900)) > 0.994 ? 3 : 1;
      const alpha = palette.baseAlpha * (0.35 + 0.65 * seed) * sparkle * dim[index];

      if (alpha < 0.012) {
        continue;
      }

      context.globalAlpha = Math.min(1, alpha);
      context.fillText(
        glyphFor(index, Math.floor(now / (1200 + seed * 4200))),
        offsetX + ((index % cols) + 0.5) * cellWidth,
        offsetY + (Math.floor(index / cols) + 0.5) * ROW_HEIGHT,
      );
    }

    // Pass 2: energized cells scramble fast in the accent color.
    context.fillStyle = palette.glow;
    for (let index = 0; index < energy.length; index++) {
      const value = energy[index];

      if (value <= 0.04) {
        continue;
      }

      context.globalAlpha = Math.min(1, value * palette.glowAlpha * (0.7 + 0.3 * dim[index]));
      context.fillText(
        glyphFor(index, Math.floor(now / 70)),
        offsetX + ((index % cols) + 0.5) * cellWidth,
        offsetY + (Math.floor(index / cols) + 0.5) * ROW_HEIGHT,
      );
    }

    context.globalAlpha = 1;
    lastPaint = now;
  }

  function heartbeat(now: number) {
    if (now < nextHeartbeat || document.hidden) {
      return;
    }

    nextHeartbeat = now + HEARTBEAT_INTERVAL_MS;
    const origin = host.querySelector("[data-ascii-pulse]");

    if (!origin) {
      return;
    }

    const rect = origin.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    ripples.push({
      x: rect.right - canvasRect.left - rect.height * 0.9,
      y: rect.top + rect.height * 0.55 - canvasRect.top,
      born: now,
      strength: 0.5,
    });
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const elapsed = lastFrame ? Math.min(64, now - lastFrame) : 16;
    lastFrame = now;

    if (now - lastMeasure > MEASURE_INTERVAL_MS) {
      measureAvoid();
      lastMeasure = now;
    }

    heartbeat(now);
    step(now, elapsed);

    // Idle field only needs a repaint when the shimmer ticks.
    if (energized || now - lastPaint >= SHIMMER_INTERVAL_MS) {
      paint(now);
    }
  };

  function drawStill() {
    energy.fill(0);
    ripples = [];
    paint(performance.now());
  }

  function schedule() {
    cancelAnimationFrame(raf);
    raf = 0;

    if (disposed || !intersecting || document.hidden) {
      return;
    }

    if (reducedMotion.matches) {
      drawStill();
      return;
    }

    lastFrame = 0;
    raf = requestAnimationFrame(frame);
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
    pointer.active = inside && !reducedMotion.matches;
  }

  function handlePointerDown(event: PointerEvent) {
    if (
      reducedMotion.matches ||
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest(INTERACTIVE_SELECTOR))
    ) {
      return;
    }

    const { x, y, inside } = toLocal(event);

    if (inside) {
      ripples.push({ x, y, born: performance.now(), strength: 1 });
    }
  }

  function handlePointerLeave() {
    pointer.active = false;
  }

  function handleThemeChange() {
    palette = readPalette(canvas);

    if (reducedMotion.matches) {
      drawStill();
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    schedule();
  });
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    schedule();
  });
  const themeObserver = new MutationObserver(handleThemeChange);

  resizeObserver.observe(canvas);
  intersectionObserver.observe(canvas);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  reducedMotion.addEventListener("change", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
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
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    themeObserver.disconnect();
    reducedMotion.removeEventListener("change", schedule);
    document.removeEventListener("visibilitychange", schedule);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerdown", handlePointerDown);
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
    baseAlpha: Number.parseFloat(read("--ascii-base-alpha")) || 0.1,
    glowAlpha: Number.parseFloat(read("--ascii-glow-alpha")) || 0.9,
    fontFamily: style.fontFamily,
  };
}
