import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const FONT = "Inter, sans-serif";

type KineticTextProps = {
  text: string;
  from?: number;
  /** stagger between words, in frames */
  stagger?: number;
  fontSize?: number | string;
  weight?: number;
  color?: string;
  lineHeight?: number;
  letterSpacing?: string;
  /** unit of stagger: word (default) or char */
  by?: "word" | "char";
  style?: React.CSSProperties;
  /** spring stiffness — higher = snappier */
  stiffness?: number;
};

// Words/chars rise + fade in with a slight overshoot, mirroring the site's
// `.motion-rise` hero treatment but with per-unit stagger.
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  from = 0,
  stagger = 3,
  fontSize = 120,
  weight = 900,
  color = "#fff7e8",
  lineHeight = 0.9,
  letterSpacing = "-0.03em",
  by = "word",
  style,
  stiffness = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const units = by === "word" ? text.split(" ") : text.split("");

  return (
    <span
      style={{
        display: "inline-flex",
        flexWrap: "wrap",
        fontFamily: FONT,
        fontSize,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing,
        ...style,
      }}
    >
      {units.map((unit, i) => {
        const delay = from + i * stagger;
        const enter = spring({
          frame: frame - delay,
          fps,
          config: { damping: 14, mass: 0.7, stiffness },
        });
        const y = (1 - enter) * 70;
        return (
          <span
            // Units (chars/words) can repeat, so the index is required for a unique key.
            // biome-ignore lint/suspicious/noArrayIndexKey: static text, list never reorders
            key={`${unit}-${i}`}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px)`,
              opacity: enter,
              whiteSpace: "pre",
            }}
          >
            {unit}
            {by === "word" && i < units.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
};
