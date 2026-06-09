import type React from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { palette } from "../brand";
import { useShape } from "../layout";
import { monoFamily } from "../load-fonts";

// Horizontal scanline texture as a data-URI, rendered via <Img> (Remotion can't
// reliably capture CSS background-image during render).
const SCANLINE_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='1' fill='rgba(255,255,255,0.5)'/%3E%3C/svg%3E";

// Terminal palette — tuned to match the user's real Ghostty + Starship setup.
// Dir = teal, git branch = mint green, status flags = red.
export const term = {
  bg: "#0c0d0d",
  bgPanel: "#111313",
  fg: "#e9e3d4",
  dim: "#6b6f6a",
  green: "#5fd75f", // git branch (Starship mint)
  teal: "#5fd7d7", // directory segment
  amber: palette.amber,
  cyan: "#3fd0e0",
  red: "#ff6b6b", // git status flags [x!?]
  border: "rgba(255,255,255,0.08)",
} as const;

export const MONO = `${monoFamily}, ui-monospace, monospace`;

// Frame-driven typewriter: returns how many chars of `text` are visible at the
// current frame, given a start frame and chars-per-second speed.
export function useTyped(text: string, from: number, cps = 38): { shown: string; done: boolean; count: number } {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - from);
  const count = Math.min(text.length, Math.floor((elapsed / 30) * cps));
  return { shown: text.slice(0, count), done: count >= text.length, count };
}

// Blinking block caret. Blinks ~1.8Hz; can be forced solid (while typing).
export const Caret: React.FC<{ solid?: boolean; color?: string; height?: number }> = ({
  solid = false,
  color = term.green,
  height = 28,
}) => {
  const frame = useCurrentFrame();
  const on = solid ? 1 : Math.sin(frame * 0.34) > -0.2 ? 1 : 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: height * 0.52,
        height,
        background: color,
        opacity: on,
        transform: "translateY(4px)",
        marginLeft: 2,
        boxShadow: `0 0 10px ${color}`,
      }}
    />
  );
};

// The macOS-style window chrome around the whole terminal reel.
export const TerminalWindow: React.FC<{
  children: React.ReactNode;
  title?: string;
  from?: number;
  scanlines?: boolean;
  /** optional row pinned to the bottom of the window (used to fill the
      portrait dead band with brand chrome) */
  footer?: React.ReactNode;
}> = ({ children, title = "exsesx.dev", from = 0, scanlines = true, footer }) => {
  const frame = useCurrentFrame();
  const shape = useShape();
  const enter = interpolate(frame - from, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(enter, [0, 1], [0.96, 1]);
  // Portrait: tighter margins so the window fills more of the tall frame.
  const outerPad = shape === "tall" ? 28 : 56;

  return (
    <AbsoluteFill style={{ background: "#070808", alignItems: "center", justifyContent: "center", padding: outerPad }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          overflow: "hidden",
          background: term.bg,
          border: `1px solid ${term.border}`,
          boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          transform: `scale(${scale})`,
          opacity: enter,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* title bar */}
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 18,
            paddingInline: 24,
            background: term.bgPanel,
            borderBottom: `1px solid ${term.border}`,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <Dot color="#ff5f57" />
            <Dot color="#febc2e" />
            <Dot color="#28c840" />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: MONO,
              fontSize: 20,
              fontWeight: 500,
              color: term.dim,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </div>
          <div style={{ width: 60 }} />
        </div>

        {/* content */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>

        {/* optional footer chrome (portrait) */}
        {footer && (
          <div
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${term.border}`,
              background: term.bgPanel,
            }}
          >
            {footer}
          </div>
        )}

        {/* scanline + vignette overlay */}
        {scanlines && (
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <Img
              src={SCANLINE_SRC}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "fill",
                imageRendering: "pixelated",
                mixBlendMode: "overlay",
                opacity: 0.06,
              }}
            />
            <AbsoluteFill
              style={{
                background: "radial-gradient(120% 120% at 50% 40%, transparent 55%, rgba(0,0,0,0.5))",
              }}
            />
          </AbsoluteFill>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span style={{ width: 16, height: 16, borderRadius: 999, background: color }} />
);

// The user's Starship two-line prompt (clean state):
//   exsesx.dev on ⎇ main
//   ○ <command>
// Line 1 is the segment block; line 2 leads with the ○ prompt char, after which
// the typed command flows inline. The Nerd Font branch glyph () is swapped for
// ⎇ (U+2387), which JetBrains Mono renders in headless Chrome.
export const PromptPrefix: React.FC<{ fontSize?: number }> = ({ fontSize = 30 }) => (
  <span style={{ fontFamily: MONO, fontSize, fontWeight: 700, whiteSpace: "pre" }}>
    <span style={{ color: term.teal }}>exsesx.dev</span>
    <span style={{ color: term.dim, fontWeight: 400 }}> on </span>
    <span style={{ color: term.green }}>⎇ main</span>
  </span>
);

// Line-2 prompt character — the hollow mint circle, then the command/cursor.
export const PromptCaretLead: React.FC<{ fontSize?: number }> = ({ fontSize = 30 }) => (
  <span style={{ fontFamily: MONO, fontSize, color: term.green, whiteSpace: "pre" }}>○ </span>
);
