import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { LOGO_PATH, palette } from "../brand";
import { Backdrop } from "../components/Backdrop";

export const LOOP_DURATION = 210; // 7s @ 30fps

// --- Seamless heartbeat-monitor loop -------------------------------------
// One beat clock drives everything: a bright pulse wave travels left→right
// along the EKG, and when it crosses center (under the V mark) the logo beats
// — scale and glow together, the way a real signal reads. Everything is an
// exact integer over LOOP_DURATION so the last frame equals the first.

const BEATS = 5; // beats per loop (integer -> seamless)
const BEAT_LEN = LOOP_DURATION / BEATS; // 42 frames per beat
const CELL = 70; // px per cardiac complex (wider -> room for a real PQRST shape)
const CELLS = 28; // enough cells to fill 120% width + travel

// One realistic cardiac complex (PQRST) within a CELL-wide cell, baseline y=20:
//   flat -> P (small bump) -> flat -> Q dip -> R spike -> S dip -> flat -> T hump -> flat
const beatCell = (x: number) =>
  [
    `${x},20`, // baseline
    `${x + 8},20`,
    `${x + 11},16`, // P wave up
    `${x + 14},20`, // P down
    `${x + 22},20`, // PR segment (flat)
    `${x + 24},23`, // Q dip
    `${x + 27},4`, // R spike (tall, sharp)
    `${x + 30},30`, // S dip (deep)
    `${x + 33},20`, // back to baseline
    `${x + 42},20`, // ST segment
    `${x + 48},15`, // T wave (rounded hump)
    `${x + 52},14`,
    `${x + 56},20`, // T down
    `${x + CELL},20`, // baseline to next
  ].join(" ");

// A heartbeat envelope over 0..1 of the beat: a fast attack spike that decays
// slowly back to rest — real hearts spike fast and settle slow.
function beatEnvelope(t: number) {
  // primary contraction (sharp), then a smaller echo, then flat rest
  const attack = interpolate(t, [0, 0.08], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const decay = interpolate(t, [0.08, 0.42], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const echo = interpolate(t, [0.18, 0.24, 0.4], [0, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.max(attack * decay, echo);
}

export const LoopBanner: React.FC = () => {
  const frame = useCurrentFrame();

  // Beat clock: which beat we're in (0..1 within the current beat).
  const beatT = (frame % BEAT_LEN) / BEAT_LEN;
  const pulse = beatEnvelope(beatT); // 0..1, the "aliveness" right now

  // Spikes stream leftward by exactly one cell per beat, so the geometry tiles
  // seamlessly and a spike crosses center on every beat.
  const scroll = -(((frame / LOOP_DURATION) * BEATS * CELL) % CELL);

  // Logo beats with the same clock: scale + luminance together.
  const logoScale = 1 + pulse * 0.085;
  const glow = 6 + pulse * 22; // blur radius swells on the beat
  const logoBright = interpolate(pulse, [0, 1], [0.86, 1]); // mark brightens

  // The bright crest sits fixed at screen center (under the V mark) and pulses
  // in place — spikes stream through it, lighting up as they pass. Its glow
  // swells on the beat. viewBox is 0..420, so center x = 210.
  const crestCenter = 210;
  const crestRadius = 44 + pulse * 26; // hot zone widens on the beat

  return (
    <AbsoluteFill style={{ background: palette.background }}>
      <Backdrop intensity={0.4} grain loopFrames={LOOP_DURATION} />

      {/* EKG monitor trace */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg
          aria-hidden="true"
          viewBox="0 0 420 40"
          width="120%"
          height={300}
          preserveAspectRatio="none"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Screen-fixed hot zone at center. Spikes scroll through it and
                light up as they pass; it swells on the beat. */}
            <radialGradient
              id="crest"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform={`translate(${crestCenter} 20) scale(${crestRadius} ${crestRadius})`}
            >
              <stop offset="0" stopColor={palette.amber} stopOpacity="1" />
              <stop offset="0.55" stopColor={palette.amber} stopOpacity="0.45" />
              <stop offset="1" stopColor={palette.amber} stopOpacity="0" />
            </radialGradient>
            {/* faint medical graticule, like a real monitor */}
            <pattern id="graticule" width="14" height="10" patternUnits="userSpaceOnUse">
              <path d="M14 0V10M0 0H14" fill="none" stroke={palette.amber} strokeWidth="0.25" strokeOpacity="0.08" />
            </pattern>
          </defs>

          {/* graticule grid behind the trace (scrolls with it so it tiles) */}
          <g transform={`translate(${scroll % 14},0)`}>
            <rect x="-20" y="0" width="460" height="40" fill="url(#graticule)" />
          </g>

          {/* dim base trace — the resting signal, always present */}
          <g transform={`translate(${scroll},0)`}>
            <polyline
              points={buildStrip()}
              fill="none"
              stroke={palette.amber}
              strokeOpacity={0.2}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          {/* bright crest layer: same scrolling trace, but the stroke is the
              screen-fixed gradient, so only the segment under center is lit. */}
          <g transform={`translate(${scroll},0)`}>
            <polyline
              points={buildStrip()}
              fill="none"
              stroke="url(#crest)"
              strokeWidth={3 + pulse * 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 ${8 + pulse * 14}px ${palette.amber})` }}
            />
          </g>
        </svg>
      </AbsoluteFill>

      {/* Logo + wordmark */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22 }}>
        <div style={{ transform: `scale(${logoScale})` }}>
          <svg
            aria-hidden="true"
            viewBox="0 0 512 512"
            width={220}
            height={220}
            fill="none"
            style={{ overflow: "visible" }}
          >
            <defs>
              <filter id="loop-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation={glow} result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={LOGO_PATH}
              fill={palette.foreground}
              fillOpacity={logoBright}
              style={{ filter: "url(#loop-glow)" }}
            />
          </svg>
        </div>

        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: "-0.02em",
            color: palette.foreground,
          }}
        >
          Software with a <span style={{ color: palette.amber }}>pulse</span>
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: "0.04em",
            color: palette.muted,
          }}
        >
          exsesx<span style={{ color: palette.amber }}>.dev</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Wide tiling EKG polyline (built once; deterministic).
function buildStrip() {
  let pts = "";
  for (let i = -2; i < CELLS; i++) pts += `${beatCell(i * CELL)} `;
  return pts.trim();
}
