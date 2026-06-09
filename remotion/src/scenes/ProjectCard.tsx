import { Video } from "@remotion/media";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { type Project, palette, projectAccents } from "../brand";
import { KineticText } from "../components/KineticText";
import { PulseLine } from "../components/Pulse";
import { byShape, useShape } from "../layout";

type ProjectCardProps = {
  project: Project;
  index: number;
  total: number;
  /** length of this card's own sub-sequence, in frames */
  durationInFrames: number;
  /** render already settled (no clip-wipe / spring entrance) — used when an
      external transition reveals the card, so it doesn't double-reveal */
  skipEntrance?: boolean;
};

// A single project, lit in its real brand accent. Media reveals with a clip
// wipe, copy springs in, the accent EKG draws under the name, then it all
// settles. Designed to be dropped into a <Sequence> per project.
export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  total,
  durationInFrames,
  skipEntrance = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shape = useShape();
  const accent = projectAccents[project.accent];

  // media reveal (skipEntrance -> already settled, no clip-wipe)
  const mediaEnter = skipEntrance ? 1 : spring({ frame, fps, config: { damping: 18, mass: 0.9 } });
  const mediaScale = interpolate(mediaEnter, [0, 1], [1.12, 1]);
  const clip = interpolate(mediaEnter, [0, 1], [100, 0]); // inset clip wipe %

  // copy
  const punchEnter = skipEntrance ? 1 : spring({ frame: frame - 22, fps, config: { damping: 18, mass: 0.8 } });
  const pulseProgress = skipEntrance
    ? 1
    : interpolate(frame, [12, 34], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // exit
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exitY = interpolate(frame, [durationInFrames - 12, durationInFrames - 2], [0, -36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Layout: wide -> media left / copy right. tall+square -> media top / copy bottom.
  const stacked = shape !== "wide";

  const Media = (
    <div
      style={{
        position: "relative",
        // Portrait: media takes the upper share but can shrink so the copy below
        // always fits the frame (long punch lines like Tso no longer overflow).
        flex: stacked ? "1 1 auto" : 1,
        width: stacked ? "100%" : undefined,
        minHeight: 0,
        maxHeight: stacked ? byShape(shape, { wide: 0, tall: 620, square: 460 }) : undefined,
        height: stacked ? "100%" : "100%",
        borderRadius: 28,
        overflow: "hidden",
        border: `1px solid ${accent.glow.replace(",1)", ",0.35)")}`,
        boxShadow: `0 0 0 1px ${accent.glow.replace(",1)", ",0.16)")}, 0 30px 90px ${accent.glow.replace(",1)", ",0.22)")}`,
        clipPath: `inset(${clip}% 0 0 0 round 28px)`,
        transform: `scale(${mediaScale})`,
      }}
    >
      {project.media.type === "video" ? (
        <Video
          src={staticFile(project.media.src)}
          style={{ width: "100%", height: "100%" }}
          objectFit="cover"
          muted
          loop
        />
      ) : (
        <Img src={staticFile(project.media.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      {/* accent gradient wash over the media, matching the site's card overlay */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(160deg, ${accent.glow.replace(",1)", ",0.28)")}, transparent 45%, ${accent.edge.replace(",1)", ",0.18)")})`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, transparent 55%, rgba(8,9,9,0.55))",
        }}
      />
      {/* index counter chip */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 22,
          padding: "8px 16px",
          borderRadius: 999,
          background: "rgba(8,9,9,0.6)",
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(10px)",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 20,
          color: palette.foreground,
          letterSpacing: "0.05em",
        }}
      >
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
    </div>
  );

  const Copy = (
    <div
      style={{
        // Portrait: copy takes its natural height (media flexes around it) so
        // nothing is pushed off-frame. Landscape: fill the column and center.
        flex: stacked ? "0 0 auto" : 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      {/* domain eyebrow */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          alignSelf: "flex-start",
          padding: "10px 18px",
          borderRadius: 999,
          background: `${accent.glow.replace(",1)", ",0.12)")}`,
          border: `1px solid ${accent.glow.replace(",1)", ",0.3)")}`,
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: "0.06em",
          color: accent.tint,
          opacity: punchEnter,
          transform: `translateY(${(1 - punchEnter) * 16}px)`,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: accent.tint,
            boxShadow: `0 0 10px ${accent.tint}`,
          }}
        />
        {project.domain}
      </div>

      {/* name — when settled, push `from` negative so every char is already
          revealed at frame 0 (no per-char kinetic reveal) */}
      <div style={{ marginTop: 22 }}>
        <KineticText
          text={project.name}
          from={skipEntrance ? -120 : 6}
          stagger={2.5}
          by="char"
          fontSize={byShape(shape, { wide: 92, tall: 78, square: 70 })}
          color={palette.foreground}
          letterSpacing="-0.025em"
          lineHeight={0.98}
        />
      </div>

      {/* accent pulse under the name */}
      <div style={{ marginTop: 10, width: "70%" }}>
        <PulseLine progress={pulseProgress} color={accent.tint} height={54} strokeWidth={2.2} />
      </div>

      {/* role */}
      <div
        style={{
          marginTop: 18,
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: byShape(shape, { wide: 28, tall: 27, square: 25 }),
          color: palette.muted,
          opacity: punchEnter,
          transform: `translateY(${(1 - punchEnter) * 16}px)`,
        }}
      >
        {project.role}
      </div>

      {/* punch line */}
      <div
        style={{
          marginTop: 16,
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          fontSize: byShape(shape, { wide: 30, tall: 29, square: 26 }),
          lineHeight: 1.42,
          color: palette.foreground,
          maxWidth: 640,
          opacity: punchEnter,
          transform: `translateY(${(1 - punchEnter) * 16}px)`,
        }}
      >
        {project.punch}
      </div>

      {/* tags */}
      <div style={{ marginTop: 26, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {project.tags.map((tag, i) => {
          const tagEnter = skipEntrance
            ? 1
            : spring({ frame: frame - 34 - i * 4, fps, config: { damping: 14, mass: 0.6 } });
          return (
            <div
              key={tag}
              style={{
                padding: "9px 18px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 21,
                color: palette.muted,
                opacity: tagEnter,
                transform: `scale(${0.8 + tagEnter * 0.2})`,
              }}
            >
              {tag}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        transform: `translateY(${exitY}px)`,
        padding: byShape(shape, { wide: 90, tall: 64, square: 70 }),
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: stacked ? "column" : "row",
          gap: byShape(shape, { wide: 64, tall: 44, square: 40 }),
          alignItems: stacked ? "stretch" : "center",
        }}
      >
        {Media}
        {Copy}
      </div>
    </AbsoluteFill>
  );
};
