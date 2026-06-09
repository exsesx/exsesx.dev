import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { snapshotStats } from "../brand";
import { Caret, MONO, PromptCaretLead, PromptPrefix, term, useTyped } from "../components/terminal";
import { ProgressBar, Spinner, ThoughtLine } from "../components/thinking";
import { byShape, useShape } from "../layout";
import { CONSOLE_LEN } from "./terminal-timing";

// One continuous terminal session that types a command, an AI "thinks", then
// streams Oleh's profile as the generated answer. Runs inside <TerminalWindow>.
//
// Timeline (frames, local to this scene):
//   0    prompt visible, caret blinks
//   8    command types out (~`exsesx render --profile --format=reel`)
//   46   enter pressed, command echoes
//   54   "> thinking" + spinner appears
//   58.. reasoning tokens stream and resolve
//   118  spinner -> ✓ done (1.2s)
//   126  "▸ rendering profile…" + profile block streams
//   ...  identity + stat lines type, progress bars fill
export const Console: React.FC = () => {
  const frame = useCurrentFrame();

  const COMMAND = "exsesx render --profile --format=reel";
  const cmd = useTyped(COMMAND, 8, 30);

  // After command is typed (~frame 46), it "runs".
  const ran = frame >= 50;
  const thinkingStart = 56;

  // reasoning lines: [appearFrame, text, resolveFrame, tag]
  const thoughts: Array<[number, string, number, string]> = [
    [thinkingStart + 6, "parsing 9+ years of experience", thinkingStart + 22, "12 roles"],
    [thinkingStart + 20, "indexing 17 shipped projects", thinkingStart + 38, "7 featured"],
    [thinkingStart + 34, "ranking by impact + recency", thinkingStart + 52, ""],
    [thinkingStart + 48, "resolving stack: react · go · mcp · llm", thinkingStart + 64, ""],
  ];
  const doneAt = thinkingStart + 70; // spinner resolves
  const renderStart = doneAt + 10;

  // profile stream
  const idLine = useTyped("Oleh Vanin — Senior Full Stack / AI Engineer", renderStart + 6, 46);
  const locLine = useTyped("Ukrainian engineer · based in Poland · building with a pulse", renderStart + 20, 52);

  const spinnerResolved = frame >= doneAt;
  const elapsed = ((Math.min(frame, doneAt) - thinkingStart) / 30).toFixed(1);

  const shape = useShape();
  const base = byShape(shape, { wide: 30, tall: 25, square: 27 });
  const pad = byShape(shape, { wide: "44px 56px", tall: "40px 38px", square: "44px 48px" });

  // `clear`: in the last frames the whole buffer scrolls up and fades out,
  // like the screen being cleared before the next command.
  const clearOut = interpolate(frame, [CONSOLE_LEN - 14, CONSOLE_LEN], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clearShift = interpolate(frame, [CONSOLE_LEN - 14, CONSOLE_LEN], [0, -60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        padding: pad,
        fontFamily: MONO,
        color: term.fg,
        fontSize: base,
        lineHeight: 1.6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        opacity: clearOut,
        transform: `translateY(${clearShift}px)`,
      }}
    >
      {/* two-line Starship prompt: segment line, then ○ + typed command */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <PromptPrefix fontSize={base} />
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <PromptCaretLead fontSize={base} />
        <span style={{ color: term.fg, whiteSpace: "pre" }}>{cmd.shown}</span>
        {!ran && <Caret solid={!cmd.done} color={term.fg} />}
      </div>

      {/* thinking block */}
      {ran && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {spinnerResolved ? (
              <span style={{ color: term.green, textShadow: `0 0 10px ${term.green}` }}>✓</span>
            ) : (
              <Spinner />
            )}
            <span style={{ color: spinnerResolved ? term.green : term.amber, fontWeight: 700 }}>
              {spinnerResolved ? "done thinking" : "thinking"}
            </span>
            <span style={{ color: term.dim, fontSize: 25 }}>({elapsed}s)</span>
          </div>

          <div style={{ paddingLeft: 46, marginTop: 6, display: "flex", flexDirection: "column" }}>
            {thoughts.map(([f, text, r, tag]) => (
              <ThoughtLine key={text} from={f} text={text} resolveAt={r} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* rendering / profile output */}
      {frame >= renderStart && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: term.cyan, fontWeight: 700 }}>
            <span style={{ textShadow: `0 0 10px ${term.cyan}` }}>▸</span>
            rendering profile…
          </div>

          <div style={{ marginTop: 10, paddingLeft: 30 }}>
            <div
              style={{
                color: term.fg,
                whiteSpace: "pre",
                fontWeight: 700,
                fontSize: byShape(shape, { wide: 34, tall: 27, square: 30 }),
              }}
            >
              {idLine.shown}
              {!idLine.done && frame >= renderStart + 6 && <Caret solid color={term.amber} height={30} />}
            </div>
            <div
              style={{
                color: term.dim,
                whiteSpace: "pre",
                marginTop: 6,
                fontSize: byShape(shape, { wide: 27, tall: 22, square: 24 }),
              }}
            >
              {locLine.shown}
            </div>
          </div>

          {/* stat progress bars */}
          <div style={{ marginTop: 22, paddingLeft: 30, display: "flex", flexDirection: "column", gap: 12 }}>
            <StatBars from={renderStart + 38} barWidth={byShape(shape, { wide: 22, tall: 14, square: 18 })} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const StatBars: React.FC<{ from: number; barWidth: number }> = ({ from, barWidth }) => {
  const frame = useCurrentFrame();
  const labels = ["experience", "projects", "ai_systems", "full_stack"];
  return (
    <>
      {snapshotStats.map(([value, label], i) => {
        const f = from + i * 8;
        const visible = frame >= f;
        if (!visible) return <div key={label} style={{ height: 36 }} />;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProgressBar
              from={f}
              durationInFrames={20}
              width={barWidth}
              label={labels[i].padEnd(12, " ")}
              color={i === 2 ? term.amber : term.green}
            />
            <span style={{ fontFamily: MONO, fontSize: 24, color: term.fg, fontWeight: 700 }}>
              {value} <span style={{ color: term.dim, fontWeight: 400 }}>{label}</span>
            </span>
          </div>
        );
      })}
    </>
  );
};

// Fade the whole console out so the cinematic montage can take over.
export const ConsoleFade: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#070808", opacity: o, pointerEvents: "none" }} />;
};
