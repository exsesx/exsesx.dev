import { AbsoluteFill, Sequence } from "remotion";
import { projects } from "../brand";
import { VerticalFrame } from "../components/VerticalFrame";
import { Hero } from "../scenes/Hero";
import { LogoIntro } from "../scenes/LogoIntro";
import { Outro } from "../scenes/Outro";
import { ProjectCard } from "../scenes/ProjectCard";
import { SectionTitle } from "../scenes/SectionTitle";
import { Snapshot } from "../scenes/Snapshot";
import { Specialties } from "../scenes/Specialties";

// Shared scene timing (frames). Reused for both the wide showreel and the
// vertical cut so the two stay in sync.
export const PROJECT_LEN = 92;

export const showreelScenes = (() => {
  const scenes: Array<{ from: number; len: number; node: React.ReactNode }> = [];
  let cursor = 0;
  const push = (len: number, node: React.ReactNode) => {
    scenes.push({ from: cursor, len, node });
    cursor += len;
  };

  push(96, <LogoIntro />);
  push(126, <Hero />);
  push(126, <Snapshot />);
  push(106, <Specialties />);
  push(56, <SectionTitle eyebrow="Selected work" title="Real product surfaces" />);
  projects.forEach((project, index) => {
    push(
      PROJECT_LEN,
      <ProjectCard project={project} index={index} total={projects.length} durationInFrames={PROJECT_LEN} />,
    );
  });
  push(120, <Outro />);

  return scenes;
})();

export const SHOWREEL_DURATION = showreelScenes.reduce((sum, s) => sum + s.len, 0);

export const Showreel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#101111" }}>
      {showreelScenes.map(scene => (
        <Sequence key={scene.from} from={scene.from} durationInFrames={scene.len}>
          {scene.node}
        </Sequence>
      ))}
      {/* 9:16-only chrome filling the portrait dead bands (no-op in 16:9) */}
      <VerticalFrame totalFrames={SHOWREEL_DURATION} />
    </AbsoluteFill>
  );
};
