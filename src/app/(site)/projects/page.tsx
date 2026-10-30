import { ArrowUpRight, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import AsciiField from "@/components/AsciiField";
import { GithubIcon } from "@/components/icons/lucide-github";
import { LinkedinIcon } from "@/components/icons/lucide-linkedin";
import { ProjectDetailsLink, ProjectMediaLink, ProjectTags, ProjectTitleLink } from "@/components/ProjectCard";
import { buttonVariants } from "@/components/ui/button-variants";
import { createPageMetadata, projectsSocialImage } from "@/lib/metadata";
import { type Project, projects } from "@/lib/projects";
import { SITE_PROFILE } from "@/lib/site-profile";
import { buildProjectsStructuredData, serializeStructuredData } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = createPageMetadata({
  title: "Projects",
  description:
    "Featured product engineering work by Oleh Vanin across AI, enterprise IT, pricing, fintech, education, commerce, utilities, and digital asset products.",
  path: "/projects",
  image: projectsSocialImage,
});

/* The one content width every section shares, so left edges line up from the nav down. */
function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("page-safe-inline mx-auto w-full max-w-7xl", className)}>{children}</div>;
}

/* The product's own address doubles as the link text, so the row says where it goes. */
function getWebsiteLabel(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

/*
 * One row of the index: the picture, then who the product is and my part in
 * it, then what I did. Three columns on wide screens; on tablets the picture
 * holds the left side while the two text blocks stack beside it. Rows carry no
 * rules: each one holds tight around its picture, so the gaps between rows do
 * the separating.
 */
function ProjectRow({ project, preloadMedia }: { project: Project; preloadMedia: boolean }) {
  return (
    <li className="grid gap-x-8 gap-y-5 md:grid-cols-12">
      <ProjectMediaLink
        project={project}
        sizes="(min-width: 1024px) 26vw, (min-width: 768px) 38vw, 100vw"
        preload={preloadMedia}
        className="aspect-[16/10] md:col-span-5 md:row-span-2 lg:col-span-4 lg:row-span-1"
      />

      <div className="flex min-w-0 flex-col items-start gap-2 md:col-span-7 lg:col-span-3">
        <ProjectTitleLink project={project} as="h2" />
        <p className="text-sm leading-6 text-muted-foreground">
          <span className="block">{project.period}</span>
          <span className="block">{project.role}</span>
        </p>
        <ProjectDetailsLink project={project} />
        {project.href ? (
          <a
            href={project.href}
            data-cuelume-press=""
            className="-my-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors duration-200 ease-[var(--ease-out)] hover:text-accent hover:decoration-current"
            rel="noopener noreferrer"
            target="_blank"
          >
            {getWebsiteLabel(project.href)}
            <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
          </a>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-5 md:col-span-7 lg:col-span-5">
        <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">{project.description}</p>
        <ProjectTags project={project} />
      </div>
    </li>
  );
}

export default function Projects() {
  const structuredData = buildProjectsStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from static site data.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <main id="main-content" tabIndex={-1} className="flex w-full flex-col">
        {/* The masthead sits on the site's ASCII field, like the blog index: the field fills the
            columns beside the title (a band above it on phones) and the copy keeps it clear. The
            title stays on one line so the first rows of the list still reach the fold. */}
        <header className="relative isolate" data-ascii-host="">
          <AsciiField className="absolute inset-0 -z-10" />
          <Container className="grid gap-8 pb-section-s pt-52 lg:grid-cols-12 lg:gap-x-8 lg:pt-32">
            <div className="min-w-0 lg:col-span-9">
              <div className="motion-rise" data-ascii-avoid="">
                <h1 id="projects-title" className="display-title text-display font-black text-foreground">
                  Client work
                </h1>
              </div>
              <p
                className="motion-rise motion-delay-1 mt-8 max-w-[48ch] text-pretty text-lead text-muted-foreground"
                data-ascii-avoid=""
              >
                From IT operations to restaurant kitchens, and my part in each.
              </p>
            </div>
          </Container>
        </header>

        <Container>
          <ol aria-label="Projects" className="motion-rise motion-delay-2 flex flex-col gap-y-14 sm:gap-y-16">
            {projects.map((project, index) => (
              <ProjectRow key={project.id} project={project} preloadMedia={index === 0} />
            ))}
          </ol>
        </Container>

        {/* The close: after the work, the one thing a visitor came to do. */}
        <section aria-labelledby="projects-contact-title" className="close-band mt-section">
          <Container className="grid gap-10 py-section-s lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <div className="lg:col-span-8">
              <h2 id="projects-contact-title" className="section-title max-w-[20ch]">
                Hiring for work like this?
              </h2>
              <p className="mt-6 max-w-[48ch] text-pretty text-lead text-muted-foreground">
                Book a short call about your product and team, and we'll see where I fit.
              </p>
            </div>

            <div className="flex flex-col items-start gap-6 lg:col-span-4 lg:items-end">
              <a
                href={SITE_PROFILE.links.booking}
                data-cuelume-press=""
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                <CalendarDays data-icon="inline-start" strokeWidth={2.4} />
                Schedule a conversation
              </a>
              <ul className="flex flex-wrap gap-3" aria-label="Elsewhere">
                <li>
                  <a
                    href={SITE_PROFILE.links.linkedin}
                    data-cuelume-press=""
                    className={buttonVariants({ variant: "glass", size: "lg" })}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <LinkedinIcon data-icon="inline-start" strokeWidth={2.4} />
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a
                    href={SITE_PROFILE.links.github}
                    data-cuelume-press=""
                    className={buttonVariants({ variant: "glass", size: "lg" })}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <GithubIcon data-icon="inline-start" strokeWidth={2.4} />
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
