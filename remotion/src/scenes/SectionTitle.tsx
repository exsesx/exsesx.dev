import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { KineticText } from "../components/KineticText";
import { byShape, useShape } from "../layout";

type SectionTitleProps = {
  eyebrow: string;
  title: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({ eyebrow, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();

  const eyebrowEnter = spring({ frame: frame - 2, fps, config: { damping: 18 } });
  const exit = interpolate(frame, [40, 52], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitScale = interpolate(frame, [40, 52], [1, 1.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.46} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 24,
          opacity: exit,
          transform: `scale(${exitScale})`,
          padding: byShape(shape, { wide: 120, tall: 70, square: 80 }),
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: palette.amber,
            opacity: eyebrowEnter,
            transform: `translateY(${(1 - eyebrowEnter) * 18}px)`,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ maxWidth: byShape(shape, { wide: 1300, tall: 900, square: 880 }) }}>
          <KineticText
            text={title}
            from={8}
            stagger={3}
            by="word"
            fontSize={byShape(shape, { wide: 110, tall: 88, square: 80 })}
            color={palette.foreground}
            lineHeight={1.02}
            style={{ justifyContent: "center" }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
