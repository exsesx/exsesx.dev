import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, ViewTransition } from "react";
import { cn } from "@/lib/utils";
import { getProjectPath, getProjectTransitionType, type Project } from "../lib/projects";
import { InteractiveCardShell } from "./InteractiveCardShell";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button-variants";
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const accentClasses: Record<Project["accent"], string> = {
  amber: "from-amber-300/70 via-orange-400/30 to-transparent",
  cyan: "from-cyan-300/70 via-sky-400/30 to-transparent",
  mint: "from-emerald-300/70 via-teal-400/30 to-transparent",
  neutral: "from-zinc-950/90 via-zinc-950/45 to-transparent",
  rose: "from-rose-300/70 via-red-400/30 to-transparent",
  steel: "from-slate-300/70 via-cyan-500/20 to-transparent",
  violet: "from-violet-400/45 via-purple-950/20 to-transparent",
};

interface Props {
  project: Project;
  featured?: boolean;
  density?: "default" | "compact";
  enableMediaTransition?: boolean;
  mediaLoading?: "eager" | "lazy";
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
}: Props) {
  const media = project.media;
  const isCompact = density === "compact";
  const projectPath = getProjectPath(project);
  const projectTransitionType = getProjectTransitionType(project);
  const visibleTags = isCompact ? project.tags.slice(0, 3) : project.tags;
  const mediaMinHeight = isCompact ? 144 : featured ? 288 : 220;
  const imageLoading = mediaLoading ?? (featured ? "eager" : "lazy");

  return (
    <InteractiveCardShell
      className={cn(
        "interactive-card group relative isolate overflow-hidden border-border bg-card/75 py-0 shadow-project-card backdrop-blur-xl hover:border-ring/30",
        project.accent === "violet"
          ? "border-violet-200/15 shadow-[0_0_0_1px_rgba(167,139,250,0.10),0_28px_80px_rgba(88,28,135,0.20)] hover:border-violet-200/25"
          : "",
        isCompact ? "h-full rounded-[1.25rem]" : "h-full rounded-[1.75rem]",
        featured && !isCompact ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : "",
      )}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accentClasses[project.accent]} opacity-45`}
      />
      {project.accent === "violet" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[linear-gradient(180deg,rgba(124,58,237,0.18),rgba(24,24,27,0.04)_55%,rgba(24,24,27,0))]" />
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
              project.accent === "violet"
                ? "shadow-[0_0_0_1px_rgba(167,139,250,0.16),0_0_42px_rgba(109,40,217,0.18)]"
                : "",
              isCompact ? "inset-2 rounded-[1rem]" : "inset-3 rounded-[1.35rem]",
            )}
            style={media.type === "image" && media.backgroundColor ? { backgroundColor: media.backgroundColor } : {}}
          >
            {media.type === "image" ? (
              <Image
                src={media.src}
                alt={media.alt}
                fill
                sizes={
                  isCompact
                    ? "(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    : featured
                      ? "(min-width: 1024px) 48vw, 100vw"
                      : "(min-width: 1024px) 33vw, 100vw"
                }
                loading={imageLoading}
                className="shared-project-media object-cover opacity-95 saturate-[0.94]"
              />
            ) : (
              <Image
                src={media.poster}
                alt={media.label}
                fill
                sizes={
                  isCompact
                    ? "(min-width: 1280px) 20vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    : featured
                      ? "(min-width: 1024px) 48vw, 100vw"
                      : "(min-width: 1024px) 33vw, 100vw"
                }
                loading={imageLoading}
                className="shared-project-media object-cover opacity-95 saturate-[0.94]"
              />
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
          <CardAction>
            <a
              href={project.href}
              className={buttonVariants({ variant: "default", size: "icon" })}
              aria-label={`Open ${project.name} website`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ArrowUpRight strokeWidth={2.5} className="magnetic-icon" />
            </a>
          </CardAction>
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
            <Link
              href={projectPath}
              transitionTypes={["nav-forward", projectTransitionType]}
              scroll
              data-suppress-entry-motion
              className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-fit")}
            >
              View details
              <ArrowUpRight data-icon="inline-end" strokeWidth={2.4} />
            </Link>
          </div>
        </CardContent>
      </div>
    </InteractiveCardShell>
  );
}
