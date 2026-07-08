import { ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import AutoPauseVideo from "../../../components/AutoPauseVideo";
import ProjectCard from "../../../components/Card";
import RouteFadeTransition from "../../../components/RouteFadeTransition";
import { Badge } from "../../../components/ui/badge";
import { buttonVariants } from "../../../components/ui/button-variants";
import { CardContent, CardDescription, CardHeader, CardTitle, Card as UiCard } from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";
import { createPageMetadata, createProjectSocialImage } from "../../../lib/metadata";
import {
  getBackTransitionTypeProps,
  getProjectRouteTransitionTypes,
  ROUTE_TRANSITION_TYPES,
  suppressEntryMotionProps,
} from "../../../lib/motion-contract";
import { getProjectAccentClasses } from "../../../lib/project-accents";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getProjectPath,
  getProjectTransitionType,
  type Project,
  projects,
} from "../../../lib/projects";
import { cn } from "../../../lib/utils";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(project => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const title = `Oleh Vanin - ${project.name}`;
  const description = `${project.name}: ${project.detail.headline}`;

  return createPageMetadata({
    title,
    description,
    path: getProjectPath(project),
    image: createProjectSocialImage(project.slug, project.name),
  });
}

function ProjectMedia({ project, priority = false }: { project: Project; priority?: boolean }) {
  const media = project.media;
  const projectTransitionType = getProjectTransitionType(project);

  return (
    <ViewTransition
      name={`project-media-${project.id}`}
      share={{ [projectTransitionType]: ROUTE_TRANSITION_TYPES.morph, default: "none" }}
      default="none"
    >
      <div
        className="project-media-frame relative h-full min-h-[18rem] rounded-[1.75rem] sm:min-h-[28rem] lg:min-h-[34rem]"
        style={media.type === "image" && media.backgroundColor ? { backgroundColor: media.backgroundColor } : {}}
      >
        {media.type === "image" ? (
          <Image
            src={media.src}
            alt={media.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={priority}
            className="shared-project-media object-cover opacity-95 saturate-[0.94]"
          />
        ) : (
          <AutoPauseVideo
            className="shared-project-media h-full min-h-[18rem] w-full object-cover opacity-95 saturate-[0.94] sm:min-h-[28rem] lg:min-h-[34rem]"
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
          </AutoPauseVideo>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
      </div>
    </ViewTransition>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const { previousProject, nextProject } = getAdjacentProjects(project);
  const projectTransitionType = getProjectTransitionType(project);
  const accentClasses = getProjectAccentClasses(project.accent);
  const adjacentProjects = [previousProject, nextProject].filter(
    (projectItem): projectItem is Project => projectItem !== undefined && projectItem.id !== project.id,
  );

  return (
    <RouteFadeTransition>
      <main
        className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28"
        {...getBackTransitionTypeProps(projectTransitionType)}
      >
        <section className="grid gap-8 lg:grid-cols-[0.48fr_0.52fr] lg:items-stretch">
          <div className="motion-rise flex flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">{project.role}</p>
              <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.75rem,6vw,5.75rem)] font-black leading-[0.9] tracking-tight text-foreground">
                {project.name}
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-xl leading-8 text-muted-foreground">
                {project.detail.headline}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="h-7 bg-secondary/75 px-3 text-sm font-bold">
                  {tag}
                </Badge>
              ))}
            </div>

            <UiCard className="surface-panel gap-0 rounded-[1.85rem] py-0 shadow-none">
              <CardHeader className="gap-3 px-7 pb-5 pt-7 sm:px-10 sm:pb-6 sm:pt-10">
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Project signal</CardTitle>
                <CardDescription className="max-w-3xl text-lg leading-8">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 px-7 pb-7 sm:gap-7 sm:px-10 sm:pb-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Context", project.period],
                    ["Role", project.role],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[1.45rem] border border-border bg-background/45 p-5 sm:p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                      <p className="mt-3 text-xl font-black text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                {project.href ? (
                  <a
                    href={project.href}
                    className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-fit")}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Visit product
                    <ArrowUpRight data-icon="inline-end" strokeWidth={2.4} />
                  </a>
                ) : null}
              </CardContent>
            </UiCard>
          </div>

          <aside
            className={cn(
              "motion-rise motion-delay-1 liquid-glass relative overflow-hidden rounded-[2rem] p-3",
              accentClasses.detailHero.surface,
            )}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClasses.gradient}`} />
            {accentClasses.topLight ? (
              <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-52", accentClasses.topLight)} />
            ) : null}
            <div className="relative h-full">
              <ProjectMedia project={project} priority />
            </div>
          </aside>
        </section>

        <Separator className="my-16 lg:my-18" />

        <section className="grid gap-6 lg:grid-cols-[0.34fr_0.66fr] lg:gap-8">
          <div className="motion-rise">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              <Layers3 size={15} strokeWidth={2.4} />
              Work shape
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              What mattered in the build
            </h2>
          </div>

          <div className="grid gap-6">
            <UiCard className="surface-panel gap-0 rounded-[1.85rem] py-0 shadow-none">
              <CardHeader className="px-7 pb-4 pt-7 sm:px-10 sm:pb-5 sm:pt-10">
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Context</CardTitle>
              </CardHeader>
              <CardContent className="px-7 pb-7 sm:px-10 sm:pb-8">
                <p className="text-lg leading-8 text-muted-foreground">{project.detail.context}</p>
              </CardContent>
            </UiCard>

            <UiCard className="surface-panel gap-0 rounded-[1.85rem] py-0 shadow-none">
              <CardHeader className="px-7 pb-4 pt-7 sm:px-10 sm:pb-5 sm:pt-10">
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Contribution</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 px-7 pb-7 sm:gap-5 sm:px-10 sm:pb-8">
                {project.detail.contribution.map(item => (
                  <div
                    key={item}
                    className="flex gap-5 rounded-[1.45rem] border border-border bg-background/45 p-5 sm:gap-6 sm:p-6"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-7 shrink-0 text-accent"
                      data-icon="inline-start"
                      strokeWidth={2.4}
                    />
                    <p className="text-lg leading-8 text-muted-foreground">{item}</p>
                  </div>
                ))}
              </CardContent>
            </UiCard>

            <UiCard className="surface-panel gap-0 rounded-[1.85rem] py-0 shadow-none">
              <CardHeader className="px-7 pb-4 pt-7 sm:px-10 sm:pb-5 sm:pt-10">
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">Outcome</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 px-7 pb-7 sm:px-10 sm:pb-8">
                <p className="text-lg leading-8 text-muted-foreground">{project.detail.outcome}</p>
                <div className="flex flex-wrap gap-2">
                  {project.detail.scope.map(item => (
                    <Badge key={item} variant="outline" className="h-7 bg-background/50 px-3 text-sm font-bold">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </UiCard>
          </div>
        </section>

        <Separator className="my-14" />

        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Keep exploring</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Adjacent project surfaces
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {previousProject ? (
                <Link
                  href={getProjectPath(previousProject)}
                  transitionTypes={getProjectRouteTransitionTypes(
                    ROUTE_TRANSITION_TYPES.navBack,
                    getProjectTransitionType(previousProject),
                  )}
                  {...suppressEntryMotionProps}
                  className={buttonVariants({ variant: "glass", size: "default" })}
                >
                  <ArrowLeft data-icon="inline-start" strokeWidth={2.4} />
                  Previous
                </Link>
              ) : null}
              {nextProject ? (
                <Link
                  href={getProjectPath(nextProject)}
                  transitionTypes={getProjectRouteTransitionTypes(
                    ROUTE_TRANSITION_TYPES.navForward,
                    getProjectTransitionType(nextProject),
                  )}
                  {...suppressEntryMotionProps}
                  className={buttonVariants({ variant: "default", size: "default" })}
                >
                  Next
                  <ArrowRight data-icon="inline-end" strokeWidth={2.4} />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            {adjacentProjects.map(projectItem => (
              <ProjectCard key={projectItem.id} project={projectItem} density="compact" enableMediaTransition />
            ))}
          </div>
        </section>
      </main>
    </RouteFadeTransition>
  );
}
