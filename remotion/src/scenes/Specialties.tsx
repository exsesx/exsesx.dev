import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { palette, specialties } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { byShape, useShape } from "../layout";

const Chip: React.FC<{ label: string; index: number }> = ({ label, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 18 - index * 4, fps, config: { damping: 13, mass: 0.6, stiffness: 130 } });
  const scale = 0.7 + enter * 0.3;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "16px 28px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontFamily: "Inter, sans-serif",
        fontWeight: 800,
        fontSize: 34,
        color: palette.foreground,
        transform: `scale(${scale})`,
        opacity: enter,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: palette.amber,
          boxShadow: `0 0 10px ${palette.amber}`,
        }}
      />
      {label}
    </div>
  );
};

export const Specialties: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();

  const titleEnter = spring({ frame: frame - 2, fps, config: { damping: 18 } });
  const exit = interpolate(frame, [86, 100], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.42} colorA={palette.cyanBright} colorB={palette.amber} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 50,
          opacity: exit,
          padding: byShape(shape, { wide: 120, tall: 70, square: 80 }),
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: palette.amber,
            transform: `translateY(${(1 - titleEnter) * 20}px)`,
            opacity: titleEnter,
          }}
        >
          The toolkit
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 18,
            maxWidth: byShape(shape, { wide: 1200, tall: 900, square: 880 }),
          }}
        >
          {specialties.map((s, i) => (
            <Chip key={s} label={s} index={i} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
