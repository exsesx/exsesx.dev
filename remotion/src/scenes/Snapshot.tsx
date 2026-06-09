import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { palette, snapshotStats } from "../brand";
import { Backdrop } from "../components/Backdrop";
import { GlassCard } from "../components/Glass";
import { byShape, useShape } from "../layout";

const StatCard: React.FC<{ value: string; label: string; index: number; from: number }> = ({
  value,
  label,
  index,
  from,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - from - index * 5, fps, config: { damping: 16, mass: 0.7 } });

  // For purely numeric "9+" / "17+" values, count up.
  const numeric = value.match(/^(\d+)/);
  let display = value;
  if (numeric) {
    const target = parseInt(numeric[1], 10);
    const counted = Math.round(interpolate(enter, [0, 1], [0, target]));
    display = value.replace(/^\d+/, String(counted));
  }

  return (
    <div
      style={{
        borderRadius: 18,
        padding: "20px 22px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        transform: `translateY(${(1 - enter) * 26}px)`,
        opacity: enter,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 52,
          lineHeight: 1,
          color: palette.foreground,
        }}
      >
        {display}
      </div>
      <div
        style={{ marginTop: 10, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 19, color: palette.muted }}
      >
        {label}
      </div>
    </div>
  );
};

export const Snapshot: React.FC = () => {
  const frame = useCurrentFrame();
  const shape = useShape();

  const headerLabelOpacity = interpolate(frame, [4, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [108, 122], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const cardWidth = byShape(shape, { wide: 1180, tall: 940, square: 900 });
  const gridCols = byShape(shape, { wide: "1fr 1fr", tall: "1fr 1fr", square: "1fr 1fr" });

  return (
    <AbsoluteFill>
      <Backdrop intensity={0.4} colorA={palette.amber} colorB={palette.cyanBright} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exit, padding: 60 }}>
        <GlassCard
          from={2}
          accent="rgba(34,211,238,0.7)"
          radius={34}
          padding={byShape(shape, { wide: 48, tall: 40, square: 36 })}
          style={{ width: cardWidth, maxWidth: "100%" }}
        >
          {/* header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 28 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 19,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: palette.muted,
                  opacity: headerLabelOpacity,
                }}
              >
                Professional snapshot
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: byShape(shape, { wide: 46, tall: 42, square: 40 }),
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  color: palette.foreground,
                  maxWidth: 720,
                  opacity: headerLabelOpacity,
                }}
              >
                Building AI-assisted product systems across frontend, backend, and cloud
              </div>
            </div>
            <div
              style={{
                width: byShape(shape, { wide: 120, tall: 104, square: 100 }),
                height: byShape(shape, { wide: 120, tall: 104, square: 100 }),
                borderRadius: 999,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 0 0 6px rgba(16,17,17,0.55)",
                flexShrink: 0,
                opacity: headerLabelOpacity,
              }}
            >
              <Img
                src={staticFile("images/oleh_portrait.jpg")}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 34%" }}
              />
            </div>
          </div>

          {/* stat grid */}
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: gridCols, gap: 16 }}>
            {snapshotStats.map(([value, label], i) => (
              <StatCard key={label} value={value} label={label} index={i} from={20} />
            ))}
          </div>
        </GlassCard>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
