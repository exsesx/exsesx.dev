import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import {
  getProjectRouteTransitionTypes,
  ROUTE_TRANSITION_TYPES,
  suppressEntryMotionProps,
} from "@/lib/motion-contract";
import { getProjectPath, getProjectTransitionType, type Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

function getProjectLinkProps(project: Project) {
  return {
    href: getProjectPath(project),
    transitionTypes: getProjectRouteTransitionTypes(
      ROUTE_TRANSITION_TYPES.navForward,
      getProjectTransitionType(project),
    ),
    scroll: true,
    ...suppressEntryMotionProps,
  };
}

/*
 * The project's picture as a link to its case page. The frame carries the
 * shared view-transition name, so it morphs into the case page's hero when the
 * navigation is tagged with this project's transition type. The container has
 * no overflow clip, so the link's focus ring stays visible around the frame.
 */
export function ProjectMediaLink({
  project,
  sizes,
  preload = false,
  className,
}: {
  project: Project;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  const media = project.media;
  const transitionType = getProjectTransitionType(project);
  const backgroundColor = media.type === "image" ? media.backgroundColor : undefined;

  return (
    <div className={cn("relative rounded-lg bg-muted", className)} style={{ backgroundColor }}>
      <ViewTransition
        name={`project-media-${project.id}`}
        share={{ [transitionType]: ROUTE_TRANSITION_TYPES.morph, default: "none" }}
        default="none"
      >
        <div className="project-media-frame absolute inset-0 rounded-lg" style={{ backgroundColor }}>
          <Image
            src={media.type === "image" ? media.src : media.poster}
            alt={media.type === "image" ? media.alt : media.label}
            fill
            sizes={sizes}
            preload={preload}
            className="shared-project-media object-cover"
          />
        </div>
      </ViewTransition>
      <Link
        {...getProjectLinkProps(project)}
        data-cuelume-press=""
        aria-label={`View ${project.name} project details`}
        className="absolute inset-0 z-10 rounded-lg"
      />
    </div>
  );
}

/* Classes stay out of cn(): its merge reads the custom text-title size as a text color and drops it. */
export function ProjectTitleLink({ project, as: Heading }: { project: Project; as: "h2" | "h3" }) {
  return (
    <Heading className="text-title font-black text-foreground">
      <Link
        {...getProjectLinkProps(project)}
        data-cuelume-press=""
        className="rounded-sm transition-colors duration-200 ease-[var(--ease-out)] hover:text-accent"
      >
        {project.name}
      </Link>
    </Heading>
  );
}

/*
 * The visible way into the case page, so the row's only underlined link is not
 * the one that leaves the site. Its name says which case it opens without
 * repeating the picture link's "View … project details".
 */
export function ProjectDetailsLink({ project }: { project: Project }) {
  return (
    <Link
      {...getProjectLinkProps(project)}
      data-cuelume-press=""
      className="-my-2 inline-flex min-h-11 items-center rounded-sm text-sm font-bold text-foreground underline decoration-border underline-offset-4 transition-colors duration-200 ease-[var(--ease-out)] hover:text-accent hover:decoration-current"
    >
      View details<span className="sr-only"> for {project.name}</span>
    </Link>
  );
}

/* Tags read as a quiet line of text, as on the blog index: nothing here is pressable. */
export function ProjectTags({ project }: { project: Project }) {
  return (
    <ul className="text-sm leading-6 text-muted-foreground" aria-label={`${project.name} focus`}>
      {project.tags.map((tag, index) => (
        <li key={tag} className="inline">
          {tag}
          {index < project.tags.length - 1 ? ", " : null}
        </li>
      ))}
    </ul>
  );
}

/* A compact entry: the picture, then the name and what the product is. */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex min-w-0 flex-col gap-5">
      <ProjectMediaLink project={project} sizes="(min-width: 768px) 40vw, 100vw" className="aspect-[16/10]" />
      <div>
        <ProjectTitleLink project={project} as="h3" />
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{project.period}</p>
      </div>
    </article>
  );
}
