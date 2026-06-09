import { interpolate, useCurrentFrame } from "remotion";
import { palette } from "../brand";
import { useShape } from "../layout";
import { MONO, term } from "./terminal";

// Status-bar footer for the terminal window in the 9:16 cut: fills the portrait
// dead band with a monospace wordmark + a thin progress bar, styled like an
// editor/tmux status line. Renders nothing in wide/square.
export const TerminalFooter: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const shape = useShape();
  const frame = useCurrentFrame();

  if (shape !== "tall") {
    return null;
  }

  const progress = interpolate(frame, [0, totalFrames], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ padding: "26px 38px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* thin progress bar */}
      <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: palette.amber,
            boxShadow: `0 0 8px ${palette.amber}`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        <span style={{ color: term.teal }}>
          exsesx<span style={{ color: palette.amber }}>.dev</span>
        </span>
        <span style={{ color: term.dim, fontSize: 19, letterSpacing: "0.08em" }}>software with a pulse</span>
      </div>
    </div>
  );
};
