import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { palette } from "../brand";

// Fractal-noise grain as a data-URI. Rendered via <Img> (not CSS
// background-image, which Remotion can't reliably capture during render).
const GRAIN_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

type BackdropProps = {
  /** two accent colors for the drifting blobs */
  colorA?: string;
  colorB?: string;
  /** base fill */
  base?: string;
  /** intensity 0..1 of the glow blobs */
  intensity?: number;
  grain?: boolean;
  /**
   * When set, the drift is made perfectly periodic over this many frames so the
   * backdrop loops seamlessly (each glow completes a whole number of cycles).
   * Leave unset for one-shot scenes where the seam never matters.
   */
  loopFrames?: number;
};

// Ambient kinetic field: two large radial glows drift on slow sine paths over
// the near-black background, echoing the site's KineticBackdrop. Frame-driven
// (no CSS animation), so it renders deterministically.
export const Backdrop: React.FC<BackdropProps> = ({
  colorA = palette.amber,
  colorB = palette.cyanBright,
  base = palette.background,
  intensity = 0.5,
  grain = true,
  loopFrames,
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  // Free-running phase (open scenes) vs loop-locked phase (seamless loops).
  // In loop mode, phase = 2π · cycles · (frame / loopFrames), so each sine
  // closes exactly at the seam. Cycle counts are chosen near the original
  // free-running speeds to preserve the visual character.
  const loop = loopFrames !== undefined;
  const phase = (cyclesPerLoop: number, freeFreq: number) =>
    loop ? 2 * Math.PI * cyclesPerLoop * (frame / loopFrames) : t * freeFreq;

  const ax = 30 + Math.sin(phase(2, 0.32)) * 22;
  const ay = 28 + Math.cos(phase(2, 0.27)) * 18;
  const bx = 72 + Math.cos(phase(2, 0.24)) * 20;
  const by = 70 + Math.sin(phase(2, 0.3)) * 16;

  const breathe = interpolate(Math.sin(phase(4, 0.6)), [-1, 1], [0.85, 1.12]);

  return (
    <AbsoluteFill style={{ background: base }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(closest-side at ${ax}% ${ay}%, ${colorA}, transparent 70%)`,
          opacity: intensity * 0.55 * breathe,
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(closest-side at ${bx}% ${by}%, ${colorB}, transparent 70%)`,
          opacity: intensity * 0.4 * breathe,
          filter: "blur(50px)",
        }}
      />
      {/* subtle vignette so type stays readable */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(140% 120% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {grain && (
        <Img
          src={GRAIN_SRC}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.05,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
