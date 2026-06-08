import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { LogoMark } from "../components/LogoMark";
import { heartbeat, PulseLine } from "../components/Pulse";
import { byShape, useShape } from "../layout";

// Closing card: logo heartbeat, wordmark, the three CTAs from the site
// (Schedule a conversation / LinkedIn / GitHub), and a final pulse.
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();

  const beat = heartbeat(frame, fps, 66, 0.05);
  const wordEnter = spring({ frame: frame - 14, fps, config: { damping: 16, mass: 0.7 } });
  const ctaEnter = spring({ frame: frame - 28, fps, config: { damping: 18, mass: 0.8 } });
  const urlEnter = spring({ frame: frame - 44, fps, config: { damping: 18 } });

  const pulseProgress = interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ctas = [
    { label: "Schedule a conversation", primary: true },
    { label: "LinkedIn", primary: false },
    { label: "GitHub", primary: false },
  ];

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.5} colorA={palette.amber} colorB={palette.cyanBright} />

      {/* full-width pulse threading the closer — kept subtle/blurred as a
          background reference, not a focal element */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 0.32, filter: "blur(3px)" }}>
        <PulseLine
          progress={pulseProgress}
          color={palette.amber}
          height={byShape(shape, { wide: 320, tall: 360, square: 340 })}
          strokeWidth={1.5}
          glow={false}
          opacity={0.5}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 26,
          padding: byShape(shape, { wide: 120, tall: 70, square: 80 }),
          textAlign: "center",
        }}
      >
        <div style={{ transform: `scale(${beat})` }}>
          <LogoMark size={byShape(shape, { wide: 170, tall: 190, square: 180 })} from={0} color={palette.foreground} />
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: byShape(shape, { wide: 88, tall: 80, square: 72 }),
            letterSpacing: "-0.025em",
            color: palette.foreground,
            transform: `translateY(${(1 - wordEnter) * 24}px)`,
            opacity: wordEnter,
            lineHeight: 1,
          }}
        >
          Let&apos;s build something
          <br />
          with a <span style={{ color: palette.amber }}>pulse</span>.
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 14,
            opacity: ctaEnter,
            transform: `translateY(${(1 - ctaEnter) * 22}px)`,
          }}
        >
          {ctas.map(c => (
            <div
              key={c.label}
              style={{
                padding: "18px 32px",
                borderRadius: 999,
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: 28,
                background: c.primary ? palette.foreground : "rgba(255,255,255,0.05)",
                color: c.primary ? palette.background : palette.foreground,
                border: c.primary ? "none" : "1px solid rgba(255,255,255,0.16)",
                boxShadow: c.primary ? `0 18px 50px ${palette.amber}55` : "none",
              }}
            >
              {c.label}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: byShape(shape, { wide: 44, tall: 46, square: 42 }),
            letterSpacing: "-0.01em",
            color: palette.foreground,
            opacity: urlEnter,
            transform: `translateY(${(1 - urlEnter) * 18}px)`,
          }}
        >
          exsesx<span style={{ color: palette.amber }}>.dev</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
