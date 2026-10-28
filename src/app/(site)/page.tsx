import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  FolderGit2,
  Rocket,
  ScanSearch,
  Search,
  Send,
  Sparkles,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AsciiField from "@/components/AsciiField";
import CvMenu from "@/components/CvMenu";
import { GithubIcon } from "@/components/icons/lucide-github";
import { LinkedinIcon } from "@/components/icons/lucide-linkedin";
import ProjectCard from "@/components/ProjectCard";
import PulseTrace from "@/components/PulseTrace";
import SnapshotSpecialtyRail from "@/components/SnapshotSpecialtyRail";
import { buttonVariants } from "@/components/ui/button-variants";
import { createPageMetadata } from "@/lib/metadata";
import { ROUTE_TRANSITION_TYPES, suppressEntryMotionProps } from "@/lib/motion-contract";
import { projects, specialties } from "@/lib/projects";
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
    role: "Senior Full-Stack / AI Engineer",
    period: "2026",
    detail:
      "Atlas, the AI assistant for enterprise IT operations at a $100M+ ARR company. Owned MCP architecture with a shared transport and authentication core, and shipped parallel, approval-gated actions for IT admins.",
  },
  {
    company: "Quicklizard",
    role: "Senior Full-Stack Developer",
    period: "2025 – 2026",
    detail:
      "Owned pricing dashboards, localization, authentication, and bulk overrides from scoping through feature-flagged rollout. Built the Go backend and Next.js frontend for an Operations Dashboard.",
  },
  {
    company: "Tso Chinese",
    role: "Solution architecture and full-stack delivery",
    period: "2021 – 2026",
    detail:
      "Led Tso 3.0's technical direction and designed its microservices architecture on Kubernetes with GraphQL gateways. It went live in September 2026 on that architecture.",
  },
  {
    company: "S-PRO",
    role: "Lead Software Engineer",
    period: "2018 – 2025",
    detail:
      "Managed and mentored up to 10 engineers, guided 17+ projects, and ran TypeScript and backend workshops while supporting hiring, discovery, and presales.",
  },
];

/* How work moves from a question to production, with agents doing the typing and me owning the result. */
const agentWorkflow = [
  {
    step: "01",
    title: "Research",
    detail: "Frame the problem with ChatGPT research and pull design context straight from Figma through MCP.",
    icon: Search,
  },
  {
    step: "02",
    title: "Build with agents",
    detail: "Ship full-stack changes with Claude Code and Codex, steering architecture and reviewing every diff.",
    icon: Bot,
  },
  {
    step: "03",
    title: "Verify",
    detail: "Check results by hand and with browser automation, network traces, Playwright, and Langfuse.",
    icon: ScanSearch,
  },
  {
    step: "04",
    title: "Ship and observe",
    detail: "Roll out behind feature flags and staged releases, then iterate on monitoring and production feedback.",
    icon: Rocket,
  },
];

export default function HomePage() {
  const featuredProjects = projects.slice(0, 3);
  const structuredData = buildHomeStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is generated from static site data.
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
      />
      <main
        id="main-content"
        tabIndex={-1}
        className="page-safe-inline mx-auto flex w-full max-w-7xl flex-col pb-28 pt-28 lg:pt-32"
      >
        {/*
          Copy holds the left column; the open right side belongs to the ASCII field.
          Below lg there is no open side, so a stage under the copy takes that role.
        */}
        <section className="hero-viewport relative isolate flex min-w-0 flex-col pb-10 lg:justify-center lg:pb-28">
          <AsciiField className="absolute -top-28 bottom-0 left-1/2 -z-10 w-screen -translate-x-1/2 lg:-top-32" />
          <div className="min-w-0 max-w-3xl">
            <div
              className="motion-rise glass-frost mb-8 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold tracking-[0.16em] text-muted-foreground"
              data-ascii-avoid=""
            >
              <Sparkles size={15} strokeWidth={2.4} className="text-accent" />
              {SITE_PROFILE.tagline}
            </div>

            <h1
              className="motion-rise motion-delay-1 text-balance text-[clamp(3.1rem,7.4vw,7.6rem)] font-black leading-[0.9] tracking-tight text-foreground"
              data-ascii-avoid=""
            >
              Software with a{" "}
              <span className="whitespace-nowrap">
                pulse
                <PulseTrace />
              </span>
            </h1>

            <p
              className="motion-rise motion-delay-2 mt-8 max-w-xl text-pretty text-lg leading-8 text-muted-foreground sm:mt-10 sm:text-[1.35rem] sm:leading-9"
              data-ascii-avoid=""
            >
              {SITE_PROFILE.introduction}
            </p>

            <div
              className="motion-rise motion-delay-3 mt-10 flex flex-wrap items-center gap-3 sm:mt-12"
              data-ascii-avoid=""
            >
              <Link
                href="/projects"
                transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
                {...suppressEntryMotionProps}
                data-cuelume-press=""
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                See the work
                <ArrowRight
                  data-icon="inline-end"
                  strokeWidth={2.5}
                  className="transition group-hover/button:translate-x-0.5"
                />
              </Link>
              <CvMenu />
              <a
                href={SITE_PROFILE.links.linkedin}
                data-cuelume-press=""
                aria-label="LinkedIn"
                className={buttonVariants({ variant: "glass", size: "icon" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                <LinkedinIcon strokeWidth={2.4} />
              </a>
              <a
                href={SITE_PROFILE.links.github}
                data-cuelume-press=""
                aria-label="GitHub"
                className={buttonVariants({ variant: "glass", size: "icon" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubIcon strokeWidth={2.4} />
              </a>
            </div>
          </div>
          <div aria-hidden="true" className="min-h-44 flex-1 lg:hidden" data-ascii-stage="" />
        </section>

        <div className="scroll-rise">
          <aside className="surface-panel hero-surface-panel relative min-w-0 overflow-hidden rounded-[1.55rem] p-5 sm:rounded-[2rem] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
            <div className="grid min-w-0 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
              <div className="flex min-w-0 items-start gap-5">
                <span className="relative block size-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-lg shadow-foreground/10 ring-4 ring-background/55 sm:size-20">
                  <Image
                    src="/images/me/oleh_portrait.jpg"
                    alt="Portrait of Oleh Vanin"
                    fill
                    sizes="(max-width: 639px) 64px, 80px"
                    className="object-cover object-[50%_34%]"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground">Professional snapshot</p>
                  <p className="mt-2 text-balance text-2xl font-black leading-[1.15] tracking-tight text-foreground sm:text-[1.7rem]">
                    Building AI-assisted product systems across frontend, backend, and cloud
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                {PROFILE_SNAPSHOT_STATS.map(({ value, label }) => (
                  <div key={label} className="min-w-0 border-l border-border pl-4">
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-[1.7rem] font-black leading-none text-foreground sm:text-3xl">{value}</dd>
                    <dd className="mt-2 text-xs font-bold leading-5 text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <SnapshotSpecialtyRail specialties={specialties} />
          </aside>
        </div>

        <section className="pt-24 sm:pt-32">
          <div className="scroll-rise mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-accent">
                <FolderGit2 size={15} strokeWidth={2.4} />
                Selected projects
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Real product surfaces, not just shiny screenshots
              </h2>
            </div>
            <Link
              href="/projects"
              transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
              {...suppressEntryMotionProps}
              data-cuelume-press=""
              className={buttonVariants({ variant: "glass", size: "default" })}
            >
              All projects
              <ArrowRight data-icon="inline-end" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {featuredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section className="pt-24 sm:pt-32">
          <div className="scroll-rise mb-12 flex flex-col gap-3">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-accent">
              <BriefcaseBusiness size={15} strokeWidth={2.4} />
              Experience
            </p>
            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Senior full-stack work across AI, product, and production systems
            </h2>
          </div>
          <ol className="border-y border-border">
            {experienceHighlights.map(item => (
              <li
                key={item.company}
                className="grid gap-3 border-b border-border py-8 last:border-b-0 sm:grid-cols-[0.34fr_0.66fr] sm:gap-8"
              >
                <div>
                  <h3 className="text-xl font-black text-foreground">{item.company}</h3>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">{item.role}</p>
                  <p className="mt-2 font-mono text-xs tabular-nums text-muted-foreground">{item.period}</p>
                </div>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="pt-24 sm:pt-32">
          <div className="scroll-rise mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-accent">
                <Workflow size={15} strokeWidth={2.4} />
                How I get things done
              </p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                AI-native, from research to production
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              Coding agents do much of the typing. I own the architecture, the review, and the result in production.
            </p>
          </div>

          <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {agentWorkflow.map(item => {
              const Icon = item.icon;

              return (
                <li key={item.title} className="border-t border-border pt-6">
                  <div className="flex items-center justify-between">
                    <Icon size={20} strokeWidth={2.4} className="text-accent" />
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{item.step}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="pt-24 sm:pt-32">
          <div className="scroll-rise flex flex-col items-start justify-between gap-8 border-t border-border pt-12 lg:flex-row lg:items-end">
            <div>
              <h2 className="max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Have a product that needs a senior engineer?
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Book a short call to talk through the problem, the stack, and where I can help.
              </p>
            </div>
            <a
              href={SITE_PROFILE.links.booking}
              data-cuelume-press=""
              className={cn(buttonVariants({ variant: "default", size: "lg" }), "shrink-0")}
            >
              Schedule a conversation
              <Send data-icon="inline-end" strokeWidth={2.4} />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
