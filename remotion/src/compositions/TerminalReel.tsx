import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { projects } from "../brand";
import { TerminalFooter } from "../components/TerminalFooter";
import { TerminalWindow } from "../components/terminal";
import { Console } from "../scenes/Console";
import { Outro } from "../scenes/Outro";
import { ProjectCard } from "../scenes/ProjectCard";
import { ProjectsBridge } from "../scenes/ProjectsBridge";
import { BRIDGE_LEN, CONSOLE_LEN } from "../scenes/terminal-timing";

// Bolder, dev-native cut: a live terminal session (typing + AI thinking +
// streamed profile) that boots into the cinematic project montage.
//
// Phase 1 — terminal (inside window chrome):
//   Console    : type command -> AI thinks -> profile streams        [0..)
//   Bridge     : `ls ./projects` -> colorized listing                 (after)
// Phase 2 — cinematic payoff (full-bleed, the glossy cards):
//   ProjectCard x7
//   Outro

const PROJECT_LEN = 84;
const OUTRO_LEN = 120;

const TERMINAL_LEN = CONSOLE_LEN + BRIDGE_LEN;

// Dip-to-black bridge. Black fades IN over the terminal, HOLDS while the swap
// happens underneath, then fades OUT to reveal the first card (which renders
// already-settled via skipEntrance, so there's no second self-reveal).
const FADE_IN = 8; // terminal -> black
const HOLD = 4; // fully black (covers the cut)
const FADE_OUT = 10; // black -> settled card
const BOOTFADE_LEN = FADE_IN + HOLD + FADE_OUT;

const BootFade: React.FC = () => {
  const frame = useCurrentFrame();
  const black = interpolate(frame, [0, FADE_IN, FADE_IN + HOLD, BOOTFADE_LEN], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ background: "#070808", opacity: black, pointerEvents: "none" }} />;
};

export const TerminalReel: React.FC = () => {
  let cursor = 0;
  const cinematicStart = TERMINAL_LEN;

  // The cut lands while the black is fully opaque: black fades in over the
  // terminal's last frames, the terminal ends + the cinematic begins under the
  // black, then the black lifts to reveal a settled card.
  const fadeStart = cinematicStart - FADE_IN - HOLD / 2;

  return (
    <AbsoluteFill style={{ background: "#070808" }}>
      {/* Phase 1: terminal window — ends exactly at the cut (no tail poking
          through the fade-out). */}
      <Sequence durationInFrames={cinematicStart}>
        <TerminalWindow footer={<TerminalFooter totalFrames={cinematicStart} />}>
          <Sequence durationInFrames={CONSOLE_LEN}>
            <Console />
          </Sequence>
          <Sequence from={CONSOLE_LEN} durationInFrames={BRIDGE_LEN + 8}>
            <ProjectsBridge />
          </Sequence>
        </TerminalWindow>
      </Sequence>

      {/* Phase 2: cinematic montage */}
      {(() => {
        cursor = cinematicStart;
        const nodes: React.ReactNode[] = [];
        projects.forEach((project, index) => {
          nodes.push(
            <Sequence key={project.name} from={cursor} durationInFrames={PROJECT_LEN}>
              <ProjectCard
                project={project}
                index={index}
                total={projects.length}
                durationInFrames={PROJECT_LEN}
                skipEntrance={index === 0}
              />
            </Sequence>,
          );
          cursor += PROJECT_LEN;
        });
        nodes.push(
          <Sequence key="outro" from={cursor} durationInFrames={OUTRO_LEN}>
            <Outro />
          </Sequence>,
        );
        return nodes;
      })()}

      {/* dip-to-black on top of everything — covers the swap, lifts to the
          settled card */}
      <Sequence from={fadeStart} durationInFrames={BOOTFADE_LEN}>
        <BootFade />
      </Sequence>
    </AbsoluteFill>
  );
};

export const TERMINAL_REEL_DURATION = TERMINAL_LEN + projects.length * PROJECT_LEN + OUTRO_LEN;
