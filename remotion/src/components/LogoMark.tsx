import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LOGO_PATH, palette, prideBands } from "../brand";

type LogoMarkProps = {
  size?: number;
  color?: string;
  /** frame at which the build-on animation begins */
  from?: number;
  /** show the pride-stripe easter-egg sweep */
  pride?: boolean;
  /** static (no entrance) — just render the mark */
  static?: boolean;
};

// The "V" lambda mark from src/components/LogoMark.tsx, animated:
// it draws its outline, fills, and gives one heartbeat overshoot.
export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 200,
  color = palette.foreground,
  from = 0,
  pride = false,
  static: isStatic = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - from;

  const draw = isStatic ? 1 : spring({ frame: local, fps, config: { damping: 200, mass: 0.6 }, durationInFrames: 28 });
  const fill = isStatic
    ? 1
    : interpolate(local, [16, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = isStatic ? 1 : spring({ frame: local - 22, fps, config: { damping: 9, mass: 0.5, stiffness: 140 } });
  const scale = 0.9 + pop * 0.1;

  const DASH = 1500;

  const clipId = "logo-pride-clip";
  const prideShift = pride ? -((local * 7) % 512) : 0;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      style={{ transform: `scale(${scale})`, overflow: "visible" }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={LOGO_PATH} />
        </clipPath>
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* solid fill that fades in */}
      <path d={LOGO_PATH} fill={color} fillOpacity={pride ? 0 : fill} style={{ filter: "url(#logo-glow)" }} />

      {/* drawing outline */}
      <path
        d={LOGO_PATH}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={DASH}
        strokeDashoffset={interpolate(draw, [0, 1], [DASH, 0])}
      />

      {pride && (
        <g clipPath={`url(#${clipId})`}>
          <g transform={`translate(0,${prideShift})`}>
            {[0, 1].map(period =>
              prideBands.map((c, i) => (
                <rect key={`${period}-${c}`} x={0} y={period * 512 + i * 64} width={512} height={64} fill={c} />
              )),
            )}
          </g>
        </g>
      )}
    </svg>
  );
};
