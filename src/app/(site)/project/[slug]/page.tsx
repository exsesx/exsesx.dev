import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import AsciiField from "@/components/AsciiField";
import AutoPauseVideo from "@/components/AutoPauseVideo";
import ProjectCard from "@/components/ProjectCard";
import { buttonVariants } from "@/components/ui/button-variants";
import { createPageMetadata, createProjectSocialImage } from "@/lib/metadata";
import { getBackTransitionTypeProps, ROUTE_TRANSITION_TYPES, suppressEntryMotionProps } from "@/lib/motion-contract";
import {
  getAdjacentProjects,
  getProjectBySlug,
  getProjectPath,
  getProjectTransitionType,
  type Project,
  projects,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

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

  const title = project.name;
  const description = `${project.name}: ${project.detail.headline}`;

  return createPageMetadata({
    title,
    description,
    path: getProjectPath(project),
    image: createProjectSocialImage(project.slug, project.name),
  });
}

/* The one content width every section shares, so left edges line up from the nav down. */
function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("page-safe-inline mx-auto w-full max-w-7xl", className)}>{children}</div>;
}

/*
 * The case's hero picture. It shares its view-transition name with the
 * project's picture on the index and in the adjacent entries, so arriving from
 * either morphs the picture into place. The frame keeps the same 16:10 shape as
 * those entries, so the morph only scales and moves.
 */
function ProjectHeroMedia({ project }: { project: Project }) {
  const media = project.media;
  const transitionType = getProjectTransitionType(project);
  const backgroundColor = media.type === "image" ? media.backgroundColor : undefined;

  return (
    <div className="relative aspect-[16/10] rounded-lg bg-muted" style={{ backgroundColor }}>
      <ViewTransition
        name={`project-media-${project.id}`}
        share={{ [transitionType]: ROUTE_TRANSITION_TYPES.morph, default: "none" }}
        default="none"
      >
        <div className="project-media-frame absolute inset-0 rounded-lg" style={{ backgroundColor }}>
          {media.type === "image" ? (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              preload
              className="shared-project-media object-cover"
            />
          ) : (
            <AutoPauseVideo
              className="shared-project-media size-full object-cover"
              poster={media.poster}
              preload="metadata"
              muted
              loop
              playsInline
              label={media.label}
            >
              <source src={media.src} type="video/mp4" />
              {media.label}
            </AutoPauseVideo>
          )}
        </div>
      </ViewTransition>
    </div>
  );
}

/* A readout row: what is measured on the left, the value beside it. */
function ReadoutRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] items-baseline gap-6 border-b border-border py-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-base leading-7 text-foreground">{children}</dd>
    </div>
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

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex w-full flex-col"
      {...getBackTransitionTypeProps(projectTransitionType)}
    >
      {/* The case opens on its name across the page, set on the site's ASCII field. The field's box
          runs from just below the nav's first 64px to the foot of the name, so it ends above the
          picture and never sits under it; the headline and action start level with the picture. */}
      <section aria-labelledby="project-title" className="relative isolate" data-ascii-host="">
        <div className="relative pt-52 lg:pt-32">
          <AsciiField className="absolute inset-x-0 top-16 bottom-0 -z-10" placement="around" />
          <Container>
            <h1
              id="project-title"
              className="display-title motion-rise text-display font-black text-foreground"
              data-ascii-avoid=""
            >
              {project.name}
            </h1>
          </Container>
        </div>

        <Container>
          <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-x-8">
            <div
              className="motion-rise motion-delay-1 flex min-w-0 flex-col items-start gap-8 lg:col-span-4"
              data-ascii-avoid=""
            >
              <p className="max-w-[36ch] text-pretty text-lead text-muted-foreground">{project.detail.headline}</p>
              {project.href ? (
                <a
                  href={project.href}
                  data-cuelume-press=""
                  className={buttonVariants({ variant: "default", size: "lg" })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {project.name} website
                  <ArrowUpRight data-icon="inline-end" strokeWidth={2.4} />
                </a>
              ) : null}
            </div>
            <div className="motion-rise motion-delay-2 min-w-0 lg:col-span-8">
              <ProjectHeroMedia project={project} />
            </div>
          </div>
        </Container>
      </section>

      {/* The result first, then what the product is and the facts of the engagement. */}
      <section className="pt-section">
        <Container>
          <p className="scroll-rise min-w-0 max-w-[34ch] text-balance break-words text-title font-black tracking-[-0.025em] text-foreground sm:text-section">
            {project.impact}
          </p>

          <div className="mt-stack grid gap-12 lg:grid-cols-12 lg:gap-x-8">
            <div className="flex flex-col gap-6 lg:col-span-6">
              <p className="text-pretty text-lead text-foreground">{project.description}</p>
              <p className="max-w-[60ch] text-pretty text-base leading-7 text-muted-foreground">
                {project.detail.context}
              </p>
            </div>

            <dl className="border-t border-border lg:col-span-5 lg:col-start-8">
              <ReadoutRow label="Role">{project.role}</ReadoutRow>
              <ReadoutRow label="Product">{project.period}</ReadoutRow>
              <ReadoutRow label="Scope">
                <ul>
                  {project.detail.scope.map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </ReadoutRow>
              <ReadoutRow label="Focus">{project.tags.join(", ")}</ReadoutRow>
            </dl>
          </div>
        </Container>
      </section>

      {/* The contribution as numbered items beside a head that stays in view; the numerals and
          the space between items do the separating, so the list carries no rules. */}
      <section aria-labelledby="contribution-title" className="pt-section">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-5">
            <h2 id="contribution-title" className="section-title max-w-[16ch] lg:sticky lg:top-32">
              What I did at {project.name}
            </h2>
          </div>

          <div className="lg:col-span-7">
            <ol className="flex flex-col gap-y-8">
              {project.detail.contribution.map((item, index) => (
                <li
                  key={item}
                  className="grid grid-cols-[minmax(0,2.5rem)_minmax(0,1fr)] items-baseline gap-4 sm:gap-6"
                >
                  <span aria-hidden="true" className="text-title font-black tabular-nums text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-[60ch] text-base leading-7 text-foreground">{item}</p>
                </li>
              ))}
            </ol>
            <p className="mt-12 max-w-[48ch] text-pretty text-lead font-bold text-foreground">
              {project.detail.outcome}
            </p>
          </div>
        </Container>
      </section>

      {/* The close: a change of paper holding the way on through the work. Each neighbour is one
          card: its Previous or Next label pages on with direction only, while its picture and
          name open it with the picture morph. */}
      <section aria-labelledby="more-projects-title" className="close-band mt-section">
        <Container className="py-section-s">
          <h2 id="more-projects-title" className="section-title">
            More client work
          </h2>

          <div className="mt-stack grid gap-x-8 gap-y-12 md:grid-cols-2">
            {previousProject && previousProject.id !== project.id ? (
              <div className="flex min-w-0 flex-col gap-3">
                <Link
                  href={getProjectPath(previousProject)}
                  transitionTypes={[ROUTE_TRANSITION_TYPES.navBack]}
                  {...suppressEntryMotionProps}
                  data-cuelume-press=""
                  className="project-adjacent-link project-adjacent-link-previous -my-2 inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-sm font-bold text-muted-foreground transition-colors duration-200 ease-[var(--ease-out)] hover:text-foreground"
                >
                  <ArrowLeft className="project-adjacent-arrow size-4" strokeWidth={2.4} />
                  Previous
                </Link>
                <ProjectCard project={previousProject} />
              </div>
            ) : null}

            {nextProject && nextProject.id !== project.id ? (
              <div className="flex min-w-0 flex-col gap-3">
                <Link
                  href={getProjectPath(nextProject)}
                  transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
                  {...suppressEntryMotionProps}
                  data-cuelume-press=""
                  className="project-adjacent-link project-adjacent-link-next -my-2 inline-flex min-h-11 items-center gap-2 self-start rounded-sm text-sm font-bold text-muted-foreground transition-colors duration-200 ease-[var(--ease-out)] hover:text-foreground"
                >
                  Next
                  <ArrowRight className="project-adjacent-arrow size-4" strokeWidth={2.4} />
                </Link>
                <ProjectCard project={nextProject} />
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </main>
  );
}
