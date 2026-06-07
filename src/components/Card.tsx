import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { getProjectPath, getProjectTransitionType, type Project } from "../lib/projects";
import { HapticAnchor, HapticRouteLink } from "./HapticLink";
import { InteractiveCardShell } from "./InteractiveCardShell";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button-variants";
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

// Accents derive from each project's brand color, brightened so they read in light and dark.
// amber=This is Language #702AEC, controlup #071F3D, mint=CoinMENA #091E39,
// quicklizard #40798C, rose=TSO #EB1F28, steel=Clear Street, violet=Huddle #7241C3.
const accentClasses: Record<Project["accent"], string> = {
  amber: "from-[rgba(132,92,246,0.5)] via-[rgba(74,28,170,0.2)] to-transparent",
  controlup: "from-[rgba(56,135,232,0.5)] via-[rgba(16,60,120,0.22)] to-[rgba(251,176,59,0.1)]",
  cyan: "from-cyan-400/45 via-sky-950/20 to-transparent",
  mint: "from-[rgba(58,128,224,0.5)] via-[rgba(12,46,96,0.22)] to-transparent",
  neutral: "from-zinc-950/90 via-zinc-950/45 to-transparent",
  quicklizard: "from-[rgba(64,168,196,0.5)] via-[rgba(28,92,112,0.2)] to-[rgba(255,140,40,0.1)]",
  rose: "from-[rgba(232,80,104,0.5)] via-[rgba(176,24,40,0.2)] to-[rgba(235,120,70,0.1)]",
  steel: "from-[rgba(96,150,196,0.42)] via-[rgba(52,80,116,0.2)] to-transparent",
  violet: "from-[rgba(150,96,214,0.5)] via-[rgba(84,42,150,0.2)] to-[rgba(190,110,210,0.1)]",
};

const accentSurfaceClasses: Record<Project["accent"], string> = {
  amber:
    "border-[rgba(132,92,246,0.18)] shadow-[0_0_0_1px_rgba(132,92,246,0.10),0_28px_80px_rgba(112,42,236,0.16)] hover:border-[rgba(132,92,246,0.32)]",
  controlup:
    "border-[rgba(56,135,232,0.18)] shadow-[0_0_0_1px_rgba(56,135,232,0.10),0_28px_80px_rgba(7,31,61,0.22)] hover:border-[rgba(56,135,232,0.32)]",
  cyan: "border-cyan-200/15 shadow-[0_0_0_1px_rgba(165,243,252,0.07),0_28px_80px_rgba(14,165,233,0.08)] hover:border-cyan-200/25",
  mint: "border-[rgba(58,128,224,0.18)] shadow-[0_0_0_1px_rgba(58,128,224,0.10),0_28px_80px_rgba(9,30,57,0.22)] hover:border-[rgba(58,128,224,0.32)]",
  neutral: "",
  quicklizard:
    "border-[rgba(64,168,196,0.18)] shadow-[0_0_0_1px_rgba(64,168,196,0.10),0_28px_80px_rgba(64,121,140,0.16)] hover:border-[rgba(64,168,196,0.32)]",
  rose: "border-[rgba(232,80,104,0.18)] shadow-[0_0_0_1px_rgba(232,80,104,0.10),0_28px_80px_rgba(235,31,40,0.14)] hover:border-[rgba(232,80,104,0.32)]",
  steel:
    "border-[rgba(96,150,196,0.16)] shadow-[0_0_0_1px_rgba(96,150,196,0.08),0_28px_80px_rgba(52,80,116,0.14)] hover:border-[rgba(96,150,196,0.28)]",
  violet:
    "border-[rgba(150,96,214,0.18)] shadow-[0_0_0_1px_rgba(150,96,214,0.10),0_28px_80px_rgba(114,65,195,0.20)] hover:border-[rgba(150,96,214,0.32)]",
};

const accentTopLightClasses: Record<Project["accent"], string> = {
  amber: "bg-[linear-gradient(180deg,rgba(132,92,246,0.22),rgba(112,42,236,0.05)_48%,rgba(24,24,27,0))]",
  controlup: "bg-[linear-gradient(180deg,rgba(56,135,232,0.22),rgba(251,176,59,0.06)_48%,rgba(24,24,27,0))]",
  cyan: "bg-[linear-gradient(180deg,rgba(6,182,212,0.20),rgba(59,130,246,0.05)_48%,rgba(24,24,27,0))]",
  mint: "bg-[linear-gradient(180deg,rgba(58,128,224,0.22),rgba(12,46,96,0.05)_48%,rgba(24,24,27,0))]",
  neutral: "",
  quicklizard: "bg-[linear-gradient(180deg,rgba(64,168,196,0.22),rgba(255,140,40,0.06)_48%,rgba(24,24,27,0))]",
  rose: "bg-[linear-gradient(180deg,rgba(232,80,104,0.22),rgba(235,120,70,0.06)_48%,rgba(24,24,27,0))]",
  steel: "bg-[linear-gradient(180deg,rgba(96,150,196,0.18),rgba(52,80,116,0.05)_48%,rgba(24,24,27,0))]",
  violet: "bg-[linear-gradient(180deg,rgba(150,96,214,0.20),rgba(190,110,210,0.05)_55%,rgba(24,24,27,0))]",
};

const accentMediaShadowClasses: Record<Project["accent"], string> = {
  amber: "shadow-[0_0_0_1px_rgba(132,92,246,0.16),0_0_34px_rgba(112,42,236,0.14)]",
  controlup: "shadow-[0_0_0_1px_rgba(56,135,232,0.16),0_0_36px_rgba(56,135,232,0.14)]",
  cyan: "shadow-[0_0_0_1px_rgba(165,243,252,0.13),0_0_34px_rgba(14,165,233,0.11)]",
  mint: "shadow-[0_0_0_1px_rgba(58,128,224,0.16),0_0_34px_rgba(58,128,224,0.13)]",
  neutral: "",
  quicklizard: "shadow-[0_0_0_1px_rgba(64,168,196,0.16),0_0_34px_rgba(64,168,196,0.14)]",
  rose: "shadow-[0_0_0_1px_rgba(232,80,104,0.15),0_0_34px_rgba(235,31,40,0.13)]",
  steel: "shadow-[0_0_0_1px_rgba(96,150,196,0.13),0_0_34px_rgba(96,150,196,0.10)]",
  violet: "shadow-[0_0_0_1px_rgba(150,96,214,0.18),0_0_42px_rgba(114,65,195,0.18)]",
};

interface Props {
  project: Project;
  featured?: boolean;
  density?: "default" | "compact";
  enableMediaTransition?: boolean;
  mediaLoading?: "eager" | "lazy";
  mediaPlayback?: "poster" | "autoplay";
  mediaPriority?: boolean;
}

function ProjectMediaFrame({
  children,
  enableMediaTransition,
  projectId,
  transitionType,
}: {
  children: ReactNode;
  enableMediaTransition: boolean;
  projectId: string;
  transitionType: string;
}) {
  if (!enableMediaTransition) {
    return children;
  }

  return (
    <ViewTransition
      name={`project-media-${projectId}`}
      share={{ [transitionType]: "morph", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

export default function ProjectCard({
  project,
  featured = false,
  density = "default",
  enableMediaTransition = false,
  mediaLoading,
  mediaPlayback = "poster",
  mediaPriority = false,
}: Props) {
  const media = project.media;
  const isCompact = density === "compact";
  const projectPath = getProjectPath(project);
  const projectTransitionType = getProjectTransitionType(project);
  const visibleTags = isCompact ? project.tags.slice(0, 3) : project.tags;
  const mediaMinHeight = isCompact ? 144 : featured ? 288 : 220;
  const imageLoading = mediaLoading ?? (featured ? "eager" : "lazy");
  const shouldRenderVideo = media.type === "video" && mediaPlayback === "autoplay";
  const mediaSizes = isCompact
    ? "(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
    : featured
      ? "(min-width: 1024px) 48vw, 100vw"
      : "(min-width: 1024px) 33vw, 100vw";

  return (
    <InteractiveCardShell
      className={cn(
        "interactive-card group relative isolate overflow-hidden border-border bg-card/75 py-0 shadow-project-card backdrop-blur-xl hover:border-ring/30",
        accentSurfaceClasses[project.accent],
        isCompact ? "h-full rounded-[1.25rem]" : "h-full rounded-[1.75rem]",
        featured && !isCompact ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : "",
      )}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accentClasses[project.accent]} opacity-60`}
      />
      {accentTopLightClasses[project.accent] ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 -z-10 h-44",
            accentTopLightClasses[project.accent],
          )}
        />
      ) : null}
      <div
        className={cn(
          "relative overflow-hidden bg-zinc-950",
          isCompact ? "h-36 sm:h-40" : featured ? "h-64 sm:h-72 lg:h-auto lg:min-h-72" : "h-52 sm:h-56",
        )}
        style={{
          minHeight: mediaMinHeight,
          ...(media.type === "image" && media.backgroundColor ? { backgroundColor: media.backgroundColor } : {}),
        }}
      >
        <Link
          href={projectPath}
          transitionTypes={["nav-forward", projectTransitionType]}
          scroll
          data-suppress-entry-motion
          aria-label={`View ${project.name} project details`}
          className="absolute inset-0 z-10"
        />
        <ProjectMediaFrame
          enableMediaTransition={enableMediaTransition}
          projectId={project.id}
          transitionType={projectTransitionType}
        >
          <div
            className={cn(
              "project-media-frame absolute",
              accentMediaShadowClasses[project.accent],
              isCompact ? "inset-2 rounded-[1rem]" : "inset-3 rounded-[1.35rem]",
            )}
            style={media.type === "image" && media.backgroundColor ? { backgroundColor: media.backgroundColor } : {}}
          >
            {media.type === "image" || !shouldRenderVideo ? (
              <Image
                src={media.type === "image" ? media.src : media.poster}
                alt={media.type === "image" ? media.alt : media.label}
                fill
                sizes={mediaSizes}
                priority={mediaPriority}
                loading={mediaPriority ? undefined : imageLoading}
                className="shared-project-media object-cover opacity-95 saturate-[0.94]"
              />
            ) : (
              <video
                className="shared-project-media h-full w-full object-cover opacity-95 saturate-[0.94]"
                poster={media.poster}
                autoPlay
                preload="metadata"
                muted
                loop
                playsInline
                aria-label={media.label}
              >
                <source src={media.src} type="video/mp4" />
                {media.label}
              </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
          </div>
        </ProjectMediaFrame>
        <div
          className={cn(
            "absolute rounded-full border border-white/15 bg-zinc-950/45 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-xl",
            isCompact ? "left-3 top-3 px-2.5 py-1" : "left-4 top-4 px-3 py-1",
          )}
        >
          {project.period}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <CardHeader
          className={cn(
            "mb-1 flex flex-row items-start justify-between gap-4",
            isCompact ? "px-5 pt-5" : "px-6 pt-6 sm:px-7 sm:pt-7",
          )}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">{project.role}</p>
            <CardTitle
              className={cn("font-black tracking-tight text-foreground", isCompact ? "mt-2 text-xl" : "mt-3 text-2xl")}
            >
              <Link
                href={projectPath}
                transitionTypes={["nav-forward", projectTransitionType]}
                scroll
                data-suppress-entry-motion
                className="hover:text-accent"
              >
                {project.name}
              </Link>
            </CardTitle>
          </div>
          {project.href ? (
            <CardAction>
              <HapticAnchor
                href={project.href}
                className={buttonVariants({ variant: "default", size: "icon" })}
                aria-label={`Open ${project.name} website`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ArrowUpRight strokeWidth={2.5} className="magnetic-icon" />
              </HapticAnchor>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className={cn("flex flex-1 flex-col", isCompact ? "px-5 pb-5" : "px-6 pb-6 sm:px-7 sm:pb-7")}>
          <CardDescription
            className={cn("text-muted-foreground", isCompact ? "text-sm leading-6" : "text-base leading-7")}
          >
            {project.description}
          </CardDescription>
          <p
            className={cn(
              "border-l-2 border-border pl-4 text-sm font-bold leading-6 text-foreground",
              isCompact ? "mt-4" : "mt-5",
            )}
          >
            {project.impact}
          </p>
          <div className={cn("flex flex-wrap gap-2", isCompact ? "mt-5" : "mt-auto pt-5")}>
            {visibleTags.map(tag => (
              <Badge key={tag} variant="secondary" className="h-6 bg-secondary/75 px-2.5 text-[11px] font-bold">
                {tag}
              </Badge>
            ))}
          </div>
          <div className={cn(isCompact ? "mt-auto pt-5" : "pt-5")}>
            <HapticRouteLink
              href={projectPath}
              transitionTypes={["nav-forward", projectTransitionType]}
              scroll
              data-suppress-entry-motion
              className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-fit")}
            >
              View details
              <ArrowUpRight data-icon="inline-end" strokeWidth={2.4} />
            </HapticRouteLink>
          </div>
        </CardContent>
      </div>
    </InteractiveCardShell>
  );
}
