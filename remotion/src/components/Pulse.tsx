import { interpolate, useCurrentFrame } from "remotion";
import { palette } from "../brand";

// The literal "pulse" — an EKG/heartbeat trace that draws itself across the
// frame. This is the through-line motif tying every scene to the tagline
// "Software with a pulse."

// A single heartbeat cell in a 0..100 x, 0..40 y box (y center = 20).
const beat = (x: number) => `${x},20 ${x + 6},20 ${x + 9},6 ${x + 13},36 ${x + 17},20 ${x + 40},20`;

// Build a long repeating EKG polyline.
function buildEkg(cells: number) {
  const gap = 46;
  let pts = "0,20 ";
  for (let i = 0; i < cells; i++) {
    pts += `${beat(20 + i * gap)} `;
  }
  pts += `${20 + cells * gap + 30},20`;
  return pts.trim();
}

const EKG_POINTS = buildEkg(8);
// Approximate path length for stroke-dash draw-on.
const EKG_LENGTH = 1900;

type PulseLineProps = {
  /** 0..1 draw progress */
  progress: number;
  color?: string;
  width?: number | string;
  height?: number;
  strokeWidth?: number;
  glow?: boolean;
  opacity?: number;
  /** continuously scroll the trace leftward for ambient motion */
  scroll?: boolean;
};

export const PulseLine: React.FC<PulseLineProps> = ({
  progress,
  color = palette.amber,
  width = "100%",
  height = 120,
  strokeWidth = 3,
  glow = true,
  opacity = 1,
  scroll = false,
}) => {
  const frame = useCurrentFrame();
  const dashOffset = interpolate(progress, [0, 1], [EKG_LENGTH, 0]);
  const scrollX = scroll ? -((frame * 1.4) % 92) : 0;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 420 40"
      width={width}
      height={height}
      preserveAspectRatio="none"
      style={{ display: "block", opacity, overflow: "visible" }}
    >
      <g transform={`translate(${scrollX},0)`}>
        <polyline
          points={EKG_POINTS}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={EKG_LENGTH}
          strokeDashoffset={scroll ? 0 : dashOffset}
          style={glow ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
        />
      </g>
    </svg>
  );
};

// A heartbeat scale value (1 -> overshoot -> 1) you can multiply into transforms
// to make any element literally "beat" twice, lub-dub style.
export function heartbeat(frame: number, fps: number, bpm = 60, amount = 0.04) {
  const period = (60 / bpm) * fps;
  const t = (frame % period) / period; // 0..1 each beat
  // Two quick pulses (lub-dub) early in the cycle, then rest.
  const lub = Math.max(0, Math.sin(t * Math.PI * 12)) * Math.exp(-t * 14);
  const dub = Math.max(0, Math.sin((t - 0.14) * Math.PI * 12)) * Math.exp(-(t - 0.14) * 14) * 0.6;
  return 1 + (lub + Math.max(0, dub)) * amount;
}
