import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { LogoMark } from "../components/LogoMark";
import { heartbeat, PulseLine } from "../components/Pulse";
import { byShape, useShape } from "../layout";

export const LogoIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();

  const logoSize = byShape(shape, { wide: 260, tall: 300, square: 280 });

  // Logo draws (0..), heartbeat kicks in after the fill lands (~frame 34).
  const beat = frame > 34 ? heartbeat(frame, fps, 66, 0.06) : 1;

  // EKG pulse fires across the screen as the heartbeat lands.
  const pulseProgress = interpolate(frame, [30, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulseOpacity = interpolate(frame, [30, 40, 70, 88], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Wordmark resolves under the logo.
  const wordEnter = spring({ frame: frame - 44, fps, config: { damping: 16, mass: 0.7 } });
  const wordY = (1 - wordEnter) * 26;

  // Whole lockup eases out as we hand to the hero.
  const exit = interpolate(frame, [82, 96], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitScale = interpolate(frame, [82, 96], [1, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.42} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: exit,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* EKG pulse crossing behind the mark — pushed out of focus (blurred +
            dimmed) so the V is the single sharp focal point. */}
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            filter: "blur(7px)",
          }}
        >
          <PulseLine
            progress={pulseProgress}
            opacity={pulseOpacity * 0.28}
            color={palette.amber}
            height={byShape(shape, { wide: 200, tall: 240, square: 220 })}
            strokeWidth={1.5}
            glow={false}
          />
        </AbsoluteFill>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ transform: `scale(${beat})` }}>
            <LogoMark size={logoSize} from={0} color={palette.foreground} />
          </div>

          <div
            style={{
              transform: `translateY(${wordY}px)`,
              opacity: wordEnter,
              fontFamily: "Inter, sans-serif",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              fontSize: byShape(shape, { wide: 64, tall: 72, square: 66 }),
              color: palette.foreground,
              marginTop: -10,
            }}
          >
            exsesx
            <span style={{ color: palette.amber }}>.dev</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
