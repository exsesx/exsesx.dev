import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import AsciiField from "@/components/AsciiField";
import ContactBand from "@/components/ContactBand";
import CvMenu from "@/components/CvMenu";
import PulseTrace from "@/components/PulseTrace";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { createPageMetadata } from "@/lib/metadata";
import {
  getProjectRouteTransitionTypes,
  ROUTE_TRANSITION_TYPES,
  suppressEntryMotionProps,
} from "@/lib/motion-contract";
import { getProjectPath, getProjectTransitionType, type Project, projects, specialties } from "@/lib/projects";
import { PROFILE_SNAPSHOT_STATS, SITE_PROFILE } from "@/lib/site-profile";
import { buildHomeStructuredData, serializeStructuredData } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = createPageMetadata({
  title: "Software Engineer",
  description: SITE_PROFILE.description,
});

const experienceHighlights = [
  {
    company: "ControlUp",
    role: "Senior Full-Stack / AI Engineer, via Adaptiq",
    period: "2026",
    detail:
      "Moved MCP servers from the assistant's local runtime to cloud deployments. Matched the assistant's tools and instructions to each organization's license.",
  },
  {
    company: "Quicklizard",
    role: "Senior Full-Stack Developer, via Adaptiq",
    period: "2025 – 2026",
    detail:
      "Developed pricing activity and total exposure endpoints. Added Redis token caching and sessions across the Go gateway and Next.js UI.",
  },
  {
    company: "Tso Chinese",
    role: "Solution architecture and full-stack delivery",
    period: "2021 – 2026",
    detail:
      "Led Tso 3.0's technical direction and cross-functional team while staying hands-on. Built isolated branch previews so the CTO, QA, and PM could validate changes before merge.",
  },
  {
    company: "S-PRO",
    role: "Lead Software Engineer / Full-Stack Developer",
    period: "2018 – 2025",
    detail:
      "Managed and mentored up to 10 frontend engineers through development plans and one-on-ones. Ran TypeScript and backend workshops and supported hiring and presales.",
  },
];

/* How work moves from a question to production, with agents doing the typing and me owning the result. */
const agentWorkflow = [
  {
    title: "Research",
    detail: "Research the problem with ChatGPT and pull design context from Figma through MCP.",
  },
  {
    title: "Build",
    detail: "Deliver full-stack changes with Claude Code and Codex while I steer the architecture.",
  },
  {
    title: "Verify",
    detail: "Check results by hand and with browser automation, network traces, and Langfuse.",
  },
  {
    title: "Ship",
    detail: "Roll out behind feature flags or in stages, then act on monitoring and production feedback.",
  },
];

/*
 * Project media that morphs into the detail page's hero (same view-transition
 * name as ProjectCard). The overlay link is a duplicate of the title link, so
 * it stays out of the tab order and the accessibility tree.
 */
function ProjectMedia({ project, sizes, className }: { project: Project; sizes: string; className?: string }) {
  const media = project.media;
  const transitionType = getProjectTransitionType(project);
  const backgroundColor = media.type === "image" ? media.backgroundColor : undefined;

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)} style={{ backgroundColor }}>
      <Link
        href={getProjectPath(project)}
        transitionTypes={getProjectRouteTransitionTypes(ROUTE_TRANSITION_TYPES.navForward, transitionType)}
        scroll
        {...suppressEntryMotionProps}
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-10"
      />
      <ViewTransition
        name={`project-media-${project.id}`}
        share={{ [transitionType]: ROUTE_TRANSITION_TYPES.morph, default: "none" }}
        default="none"
      >
        <div className="project-media-frame absolute inset-0" style={{ backgroundColor }}>
          <Image
            src={media.type === "image" ? media.src : media.poster}
            alt={media.type === "image" ? media.alt : media.label}
            fill
            sizes={sizes}
            className="shared-project-media object-cover"
          />
        </div>
      </ViewTransition>
    </div>
  );
}

// Plain classes: cn() reads the custom text-title size as a color and drops it.
function ProjectTitle({ project }: { project: Project }) {
  return (
    <h3 className="cap-top text-title font-black text-foreground">
      <Link
        href={getProjectPath(project)}
        transitionTypes={getProjectRouteTransitionTypes(
          ROUTE_TRANSITION_TYPES.navForward,
          getProjectTransitionType(project),
        )}
        scroll
        {...suppressEntryMotionProps}
        data-cuelume-press=""
        className="rounded-sm transition-colors duration-200 ease-[var(--ease-out)] hover:text-accent"
      >
        {project.name}
      </Link>
    </h3>
  );
}

function ProjectTags({ project }: { project: Project }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label={`${project.name} focus`}>
      {project.tags.map(tag => (
        <li key={tag}>
          <Badge variant="outline" className="h-7 px-3 text-sm font-normal">
            {tag}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function ProjectWebsiteLink({ project }: { project: Project }) {
  if (!project.href) {
    return null;
  }

  return (
    <a
      href={project.href}
      data-cuelume-press=""
      className={cn(buttonVariants({ variant: "glass", size: "lg" }), "self-start")}
      rel="noopener noreferrer"
      target="_blank"
    >
      {project.name} website
      <ArrowUpRight data-icon="inline-end" strokeWidth={2.5} />
    </a>
  );
}

/* The one content width every section shares, so left edges line up from the nav down. */
function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("page-safe-inline mx-auto w-full max-w-7xl", className)}>{children}</div>;
}

export default function HomePage() {
  const [leadProject, ...moreProjects] = projects.slice(0, 3);
  const structuredData = buildHomeStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from static site data.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <main id="main-content" tabIndex={-1} className="flex w-full flex-col">
        {/* The same masthead as the other pages: the title sits under the header,
            the field beside it (a band above it on phones) starts below the
            header's first 64px, and the trace leaves the headline's pulse mark. */}
        <section aria-labelledby="hero-title" className="relative isolate" data-ascii-host="">
          <AsciiField className="absolute inset-x-0 top-16 bottom-0 -z-10" />
          <Container className="pb-section-s pt-52 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:pt-32">
            <div className="min-w-0 lg:col-span-7">
              <h1
                id="hero-title"
                className="display-title motion-rise text-display font-black text-foreground"
                data-ascii-avoid=""
              >
                Software with a{" "}
                <span className="whitespace-nowrap">
                  pulse
                  <PulseTrace />
                </span>
              </h1>

              <p
                className="motion-rise motion-delay-1 mt-8 max-w-[36ch] text-pretty text-lead text-muted-foreground"
                data-ascii-avoid=""
              >
                {SITE_PROFILE.summary}
              </p>

              <div className="motion-rise motion-delay-2 mt-10 flex flex-wrap items-center gap-3" data-ascii-avoid="">
                <Link
                  href="/projects"
                  transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
                  {...suppressEntryMotionProps}
                  data-cuelume-press=""
                  className={buttonVariants({ variant: "default", size: "lg" })}
                >
                  See the work
                  <ArrowRight data-icon="inline-end" strokeWidth={2.5} />
                </Link>
                <CvMenu />
              </div>
            </div>
          </Container>
        </section>

        <section aria-labelledby="work-title">
          <Container>
            <div className="scroll-rise flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <h2 id="work-title" className="section-title max-w-[24ch]">
                Client products and the parts I owned
              </h2>
              <Link
                href="/projects"
                transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
                {...suppressEntryMotionProps}
                data-cuelume-press=""
                className={cn(buttonVariants({ variant: "glass", size: "lg" }), "self-start sm:self-auto")}
              >
                All projects
                <ArrowRight data-icon="inline-end" strokeWidth={2.5} />
              </Link>
            </div>

            {/* One project opened as a case, then the next two beneath it. */}
            <article className="mt-stack grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-x-8">
              <ProjectMedia
                project={leadProject}
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="aspect-[40/21] lg:col-span-7"
              />
              <div className="flex min-w-0 flex-col gap-5 lg:col-span-5">
                <div>
                  <ProjectTitle project={leadProject} />
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    <span className="block">{leadProject.period}</span>
                    <span className="block">{leadProject.role}</span>
                  </p>
                </div>
                <p className="text-base leading-7 text-muted-foreground">{leadProject.description}</p>
                <p className="text-base font-bold leading-7 text-foreground">{leadProject.impact}</p>
                <ProjectTags project={leadProject} />
                <ProjectWebsiteLink project={leadProject} />
              </div>
            </article>

            <div className="mt-stack grid gap-x-8 gap-y-16 lg:grid-cols-12">
              {moreProjects.map((project, index) => (
                <article
                  key={project.id}
                  className={cn("flex min-w-0 flex-col gap-5", index === 0 ? "lg:col-span-7" : "lg:col-span-5")}
                >
                  <ProjectMedia
                    project={project}
                    sizes={index === 0 ? "(min-width: 1024px) 56vw, 100vw" : "(min-width: 1024px) 40vw, 100vw"}
                    className="aspect-[40/21] lg:aspect-auto lg:h-80"
                  />
                  <div>
                    <ProjectTitle project={project} />
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      <span className="block">{project.period}</span>
                      <span className="block">{project.role}</span>
                    </p>
                  </div>
                  <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">{project.description}</p>
                  <ProjectWebsiteLink project={project} />
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section aria-labelledby="profile-title" className="pt-section">
          <Container>
            <div className="flex items-center gap-4">
              <span className="relative block size-14 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                <Image
                  src="/images/me/oleh_portrait.jpg"
                  alt="Portrait of Oleh Vanin"
                  fill
                  sizes="56px"
                  className="object-cover object-[50%_34%]"
                />
              </span>
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="block font-bold text-foreground">{SITE_PROFILE.name}</span>
                <span className="block">{SITE_PROFILE.role}</span>
                <span className="block">{SITE_PROFILE.location}</span>
              </p>
            </div>

            <h2 id="profile-title" className="scroll-rise section-title mt-10 max-w-[30ch]">
              I've led engineering teams and stayed hands-on
            </h2>

            <div className="mt-stack grid gap-12 lg:grid-cols-12 lg:gap-x-8">
              <div className="flex flex-col gap-8 lg:col-span-5">
                <p className="text-pretty text-lead text-muted-foreground">{SITE_PROFILE.introduction}</p>
                <ul className="flex flex-wrap gap-2" aria-label="Specialties">
                  {specialties.map(specialty => (
                    <li key={specialty}>
                      <Badge variant="outline" className="h-7 px-3 text-sm font-normal">
                        {specialty}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              {/* A readout: the value first, what it measures beside it. */}
              <dl className="border-t border-border lg:col-span-6 lg:col-start-7">
                {PROFILE_SNAPSHOT_STATS.map(({ value, label }) => (
                  <div
                    key={label}
                    className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)] items-baseline gap-6 border-b border-border py-5"
                  >
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-title font-black tabular-nums text-foreground">{value}</dd>
                    <dd className="text-base leading-7 text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </section>

        <section aria-labelledby="experience-title" className="pt-section-s">
          <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-5">
              <h2 id="experience-title" className="section-title max-w-[22ch] lg:sticky lg:top-32">
                Recent roles and what I did in each
              </h2>
            </div>
            <ol className="border-t border-border lg:col-span-7">
              {experienceHighlights.map(item => (
                <li
                  key={item.company}
                  className="grid gap-3 border-b border-border py-8 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:items-baseline sm:gap-8"
                >
                  <div>
                    <h3 className="text-title font-black text-foreground">{item.company}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.role}</p>
                    <p className="mt-2 text-sm tabular-nums text-muted-foreground">{item.period}</p>
                  </div>
                  <p className="text-base leading-7 text-muted-foreground">{item.detail}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <section aria-labelledby="workflow-title" className="pt-section">
          <Container>
            <div className="scroll-rise grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-x-8">
              <h2 id="workflow-title" className="section-title max-w-[22ch] lg:col-span-7">
                How I build and verify with coding agents
              </h2>
              <p className="text-pretty text-lead text-muted-foreground lg:col-span-5">
                Coding agents do much of the typing. I review what they write and own the result in production.
              </p>
            </div>

            <ol className="workflow-steps mt-stack grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {agentWorkflow.map(item => (
                <li key={item.title} className="border-t border-border pt-6">
                  <h3 className="text-title font-black text-foreground">{item.title}</h3>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">{item.detail}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        <ContactBand id="contact-title" title="Tell me what you're building">
          Book a short call about the problem and your stack, and I'll say where I can help.
        </ContactBand>
      </main>
    </>
  );
}
