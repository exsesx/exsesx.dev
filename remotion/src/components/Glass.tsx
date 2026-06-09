import type React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

type GlassCardProps = {
  children?: React.ReactNode;
  from?: number;
  style?: React.CSSProperties;
  /** accent color for the top hairline gradient */
  accent?: string;
  radius?: number;
  padding?: number | string;
};

// Mirrors the site's `.liquid-glass` cards: translucent fill, soft border,
// a bright hairline across the top edge. Springs up on entrance.
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  from = 0,
  style,
  accent = "rgba(253,230,138,0.7)",
  radius = 28,
  padding = 28,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - from, fps, config: { damping: 16, mass: 0.8, stiffness: 110 } });
  const y = (1 - enter) * 48;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: radius,
        padding,
        background: "color-mix(in oklab, #18181b 76%, transparent)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 28px 80px rgba(0,0,0,0.34)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        overflow: "hidden",
        transform: `translateY(${y}px)`,
        opacity: enter,
        ...style,
      }}
    >
      {/* top hairline, like the cyan/amber line in the hero snapshot card */}
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          top: 0,
          height: 1.5,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
      {children}
    </div>
  );
};
