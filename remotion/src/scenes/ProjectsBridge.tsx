import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { projects } from "../brand";
import { Caret, MONO, PromptCaretLead, PromptPrefix, term, useTyped } from "../components/terminal";
import { byShape, useShape } from "../layout";

// Bridge beat: a second command (`ls ./projects --featured`) types and resolves
// into a colorized directory listing of the real projects, each accent-tinted.
// Hands off to the cinematic montage right after.
export const ProjectsBridge: React.FC = () => {
  const frame = useCurrentFrame();
  const cmd = useTyped("ls ./projects --featured", 6, 32);
  const ran = frame >= 40;
  const listStart = 46;
  const shape = useShape();
  const base = byShape(shape, { wide: 30, tall: 25, square: 27 });
  const pad = byShape(shape, { wide: "44px 56px", tall: "40px 38px", square: "44px 48px" });

  const slugFor = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // fresh screen after the clear: fade + settle the prompt in
  const enter = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const enterShift = interpolate(frame, [0, 10], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
        opacity: enter,
        transform: `translateY(${enterShift}px)`,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <PromptPrefix fontSize={base} />
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
        <PromptCaretLead fontSize={base} />
        <span style={{ whiteSpace: "pre" }}>{cmd.shown}</span>
        {!ran && <Caret solid={!cmd.done} color={term.fg} />}
      </div>

      {ran && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ color: term.dim, fontSize: 25 }}>total {projects.length} · sorted by impact</div>
          {projects.map((p, i) => {
            const f = listStart + i * 6;
            const enter = interpolate(frame - f, [0, 7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={p.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  opacity: enter,
                  transform: `translateX(${(1 - enter) * -14}px)`,
                }}
              >
                <span style={{ color: term.green, fontSize: 26 }}>drwxr-xr-x</span>
                <span style={{ color: p.accent ? toTint(p.accent) : term.fg, fontWeight: 700 }}>
                  {slugFor(p.name)}/
                </span>
                <span style={{ color: term.dim, fontSize: 24 }}>{p.domain.toLowerCase()}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
            <PromptPrefix fontSize={base} />
            <div style={{ display: "flex", alignItems: "center" }}>
              <PromptCaretLead fontSize={base} />
              <Caret color={term.fg} />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Map project accent keys to a readable terminal tint.
function toTint(accent: string): string {
  const map: Record<string, string> = {
    controlup: "#8fc0ff",
    quicklizard: "#7fdcec",
    amber: "#c6b1ff",
    rose: "#ff9bab",
    mint: "#8fb8ff",
    steel: "#a9c8e6",
    violet: "#cdaaf0",
  };
  return map[accent] ?? term.fg;
}
