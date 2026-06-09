import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { palette } from "../brand";
import { useShape } from "../layout";

// Persistent bottom chrome for the 9:16 cut: a wordmark + thin progress bar
// pinned to the footer. Fills the portrait dead band and ties every scene
// together. Renders nothing in wide/square.
export const VerticalFrame: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const shape = useShape();
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  if (shape !== "tall") {
    return null;
  }

  // intro/outro fade so the chrome doesn't fight the logo + outro scenes
  const fadeIn = interpolate(frame, [96, 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [totalFrames - 130, totalFrames - 110], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {/* bottom footer: wordmark + thin progress bar */}
      <div style={{ position: "absolute", bottom: 64, left: 64, right: 64 }}>
        <div
          style={{
            height: 3,
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              background: palette.amber,
              boxShadow: `0 0 10px ${palette.amber}`,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Inter, sans-serif",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: palette.foreground }}>
            exsesx<span style={{ color: palette.amber }}>.dev</span>
          </span>
          <span style={{ color: palette.muted, fontWeight: 700, fontSize: 24, letterSpacing: "0.14em" }}>
            SOFTWARE WITH A PULSE
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
