import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { PointerEvent, useState } from "react";
import { Project } from "../lib/projects";
import { Badge } from "./ui/badge";
import { buttonVariants } from "./ui/button";
import { Card as UiCard, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

const accentClasses: Record<Project["accent"], string> = {
  amber: "from-amber-300/70 via-orange-400/30 to-transparent",
  cyan: "from-cyan-300/70 via-sky-400/30 to-transparent",
  mint: "from-emerald-300/70 via-teal-400/30 to-transparent",
  rose: "from-rose-300/70 via-red-400/30 to-transparent",
  steel: "from-slate-300/70 via-cyan-500/20 to-transparent",
};

interface Props {
  project: Project;
  featured?: boolean;
  density?: "default" | "compact";
}

function updatePointerPosition(event: PointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();

  event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
  event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
}

function VideoPreview({
  media,
  shouldLoad,
}: {
  media: Extract<Project["media"], { type: "video" }>;
  shouldLoad: boolean;
}) {
  return (
    <video
      className="interactive-media h-full w-full object-cover opacity-90"
      poster={media.poster}
      preload="none"
      autoPlay={shouldLoad}
      muted
      loop
      playsInline
      aria-label={media.label}
    >
      {shouldLoad ? <source src={media.src} type="video/mp4" /> : null}
      {media.label}
    </video>
  );
}

export default function ProjectCard({ project, featured = false, density = "default" }: Props) {
  const media = project.media;
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const isCompact = density === "compact";
  const visibleTags = isCompact ? project.tags.slice(0, 3) : project.tags;

  function loadVideoPreview() {
    if (media.type === "video") {
      setShouldLoadVideo(true);
    }
  }

  return (
    <UiCard
      onPointerMove={updatePointerPosition}
      className={cn(
        "interactive-card group relative isolate overflow-hidden border-border bg-card/75 py-0 shadow-project-card backdrop-blur-xl hover:border-ring/30",
        isCompact ? "h-full rounded-[1.35rem]" : "rounded-[1.75rem]",
        featured && !isCompact ? "lg:grid lg:grid-cols-[1.05fr_0.95fr]" : "",
      )}
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${accentClasses[project.accent]} opacity-45`}
      />
      <div
        onPointerEnter={loadVideoPreview}
        onFocusCapture={loadVideoPreview}
        className={cn(
          "relative overflow-hidden bg-zinc-950",
          isCompact ? "aspect-[16/9] min-h-0" : featured ? "min-h-72 lg:min-h-full" : "aspect-[16/11] min-h-56",
        )}
        style={media.type === "image" && media.backgroundColor ? { backgroundColor: media.backgroundColor } : undefined}
      >
        <a href={project.href} aria-label={`Open ${project.title}`} className="absolute inset-0 z-10" />
        {media.type === "image" ? (
          <Image
            src={media.src}
            alt={media.alt}
            fill
            sizes={
              isCompact
                ? "(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                : featured
                  ? "(min-width: 1024px) 48vw, 100vw"
                  : "(min-width: 1024px) 33vw, 100vw"
            }
            loading={featured ? "eager" : "lazy"}
            className="interactive-media object-cover opacity-90 saturate-[0.92] group-hover:opacity-100 group-hover:saturate-100"
          />
        ) : (
          <VideoPreview media={media} shouldLoad={shouldLoadVideo} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
        <div
          className={cn(
            "absolute rounded-full border border-white/15 bg-zinc-950/45 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-xl",
            isCompact ? "left-3 top-3 px-2.5 py-1" : "left-4 top-4 px-3 py-1",
          )}
        >
          {project.period}
        </div>
      </div>

      <div className="flex min-h-full flex-col">
        <CardHeader
          className={cn(
            "mb-1 flex flex-row items-start justify-between gap-4",
            isCompact ? "px-4 pt-4 sm:px-5 sm:pt-5" : "px-6 pt-6 sm:px-7 sm:pt-7",
          )}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">{project.role}</p>
            <CardTitle
              className={cn("font-black tracking-tight text-foreground", isCompact ? "mt-2 text-xl" : "mt-3 text-2xl")}
            >
              {project.title}
            </CardTitle>
          </div>
          <CardAction>
            <a
              href={project.href}
              className={buttonVariants({ variant: "default", size: "icon" })}
              aria-label={`Open ${project.title}`}
            >
              <ArrowUpRight strokeWidth={2.5} className="magnetic-icon" />
            </a>
          </CardAction>
        </CardHeader>
        <CardContent
          className={cn("flex flex-1 flex-col", isCompact ? "px-4 pb-4 sm:px-5 sm:pb-5" : "px-6 pb-6 sm:px-7 sm:pb-7")}
        >
          <CardDescription
            className={cn(
              "text-muted-foreground",
              isCompact ? "line-clamp-3 text-sm leading-6" : "text-base leading-7",
            )}
          >
            {project.description}
          </CardDescription>
          <p
            className={cn(
              "border-l-2 border-border pl-4 text-sm font-bold leading-6 text-foreground",
              isCompact ? "mt-4 line-clamp-2" : "mt-5",
            )}
          >
            {project.impact}
          </p>
          <div className={cn("mt-auto flex flex-wrap gap-2", isCompact ? "pt-4" : "pt-7")}>
            {visibleTags.map(tag => (
              <Badge key={tag} variant="outline" className="bg-background/55 font-bold">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </div>
    </UiCard>
  );
}
