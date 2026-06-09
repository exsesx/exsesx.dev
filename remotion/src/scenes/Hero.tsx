import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { KineticText } from "../components/KineticText";
import { PulseLine } from "../components/Pulse";
import { byShape, useShape } from "../layout";

export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();

  // Eyebrow chip.
  const chipEnter = spring({ frame: frame - 4, fps, config: { damping: 16, mass: 0.7 } });

  const titleSize = byShape(shape, { wide: 168, tall: 158, square: 124 });
  const titleSize2 = byShape(shape, { wide: 168, tall: 158, square: 124 });

  // EKG runs under the headline, drawing as "pulse" lands.
  const pulseProgress = interpolate(frame, [34, 64], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subline + identity.
  const subEnter = spring({ frame: frame - 50, fps, config: { damping: 18, mass: 0.8 } });

  // Exit
  const exit = interpolate(frame, [108, 122], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitY = interpolate(frame, [108, 122], [0, -40], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const padInline = byShape(shape, { wide: 120, tall: 70, square: 80 });

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.5} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          paddingInline: padInline,
          // Portrait: bias up so the headline fills the upper-middle and clears
          // the footer chrome instead of floating dead-center.
          paddingBottom: byShape(shape, { wide: 0, tall: 200, square: 0 }),
          opacity: exit,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* eyebrow chip — matches the hero's liquid-glass pill */}
        <div
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: byShape(shape, { wide: 22, tall: 24, square: 22 }),
            letterSpacing: "0.16em",
            color: palette.muted,
            transform: `translateY(${(1 - chipEnter) * 20}px)`,
            opacity: chipEnter,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: palette.amber,
              boxShadow: `0 0 12px ${palette.amber}`,
            }}
          />
          Senior Full Stack · AI Engineer
        </div>

        {/* headline */}
        <div style={{ marginTop: 36, position: "relative" }}>
          <div>
            <KineticText
              text="Software"
              from={10}
              stagger={4}
              by="char"
              fontSize={titleSize}
              color={palette.foreground}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: byShape(shape, { wide: 28, tall: 20, square: 20 }),
            }}
          >
            <KineticText text="with a" from={26} stagger={4} by="char" fontSize={titleSize2} color={palette.muted} />
            <KineticText text="pulse" from={36} stagger={5} by="char" fontSize={titleSize2} color={palette.amber} />
          </div>

          {/* the literal pulse, threaded right under the word "pulse" */}
          <div style={{ marginTop: 6, width: byShape(shape, { wide: "78%", tall: "100%", square: "100%" }) }}>
            <PulseLine progress={pulseProgress} color={palette.amber} height={70} strokeWidth={2.5} />
          </div>
        </div>

        {/* identity line */}
        <div
          style={{
            marginTop: 30,
            maxWidth: byShape(shape, { wide: 880, tall: 760, square: 760 }),
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: byShape(shape, { wide: 30, tall: 32, square: 30 }),
            lineHeight: 1.45,
            color: palette.muted,
            transform: `translateY(${(1 - subEnter) * 24}px)`,
            opacity: subEnter,
          }}
        >
          I&apos;m <span style={{ color: palette.foreground, fontWeight: 800 }}>Oleh Vanin</span> — a Ukrainian engineer
          based in Poland, building practical AI systems, full-stack products, MCP servers, and developer tools.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
