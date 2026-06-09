import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { MONO, term } from "./terminal";

// Braille spinner frames — the classic CLI spinner.
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export const Spinner: React.FC<{ color?: string; size?: number }> = ({ color = term.amber, size = 30 }) => {
  const frame = useCurrentFrame();
  const ch = SPINNER[Math.floor(frame / 2) % SPINNER.length];
  return <span style={{ fontFamily: MONO, fontSize: size, color, textShadow: `0 0 12px ${color}` }}>{ch}</span>;
};

// A single streaming "reasoning" line: a dim bullet, then text that fades+slides
// in, optionally resolving to a green ✓ with a timing tag.
export const ThoughtLine: React.FC<{
  from: number;
  text: string;
  fontSize?: number;
  resolveAt?: number;
  tag?: string;
}> = ({ from, text, fontSize = 27, resolveAt, tag }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame - from, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const resolved = resolveAt !== undefined && frame >= resolveAt;
  const y = (1 - enter) * 12;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: MONO,
        fontSize,
        opacity: enter,
        transform: `translateY(${y}px)`,
        lineHeight: 1.7,
      }}
    >
      <span
        style={{
          color: resolved ? term.green : term.dim,
          width: fontSize,
          textShadow: resolved ? `0 0 10px ${term.green}` : undefined,
        }}
      >
        {resolved ? "✓" : "·"}
      </span>
      <span style={{ color: resolved ? term.fg : term.dim }}>{text}</span>
      {tag && resolved && <span style={{ color: term.dim, fontSize: fontSize * 0.85 }}>{tag}</span>}
    </div>
  );
};

// A CLI progress bar made of block glyphs that fills from 0→pct over a window.
export const ProgressBar: React.FC<{
  from: number;
  durationInFrames: number;
  width?: number;
  label?: string;
  color?: string;
  pct?: number;
}> = ({ from, durationInFrames, width = 28, label, color = term.green, pct = 100 }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - from, [0, durationInFrames], [0, pct / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const filled = Math.round(width * t);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const shownPct = Math.round(t * 100);

  return (
    <div style={{ fontFamily: MONO, fontSize: 26, display: "flex", gap: 16, alignItems: "center" }}>
      {label && <span style={{ color: term.fg, minWidth: 220, display: "inline-block" }}>{label}</span>}
      <span style={{ color, textShadow: `0 0 8px ${color}` }}>{bar}</span>
      <span style={{ color: term.dim }}>{String(shownPct).padStart(3, " ")}%</span>
    </div>
  );
};
