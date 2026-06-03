import {
  Activity,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  FileDown,
  Send,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ProjectCard from "../components/Card";
import { GithubIcon } from "../components/icons/lucide-github";
import { LinkedinIcon } from "../components/icons/lucide-linkedin";
import { Badge } from "../components/ui/badge";
import { buttonVariants } from "../components/ui/button-variants";
import { Card as UiCard, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { projects, specialties } from "../lib/projects";
import { cn } from "../lib/utils";

export const metadata: Metadata = {
  title: "Oleh Vanin - Software Engineer",
  description:
    "Oleh Vanin is a Ukrainian Senior Full Stack Engineer / AI Engineer based in Poland, building practical AI systems, full-stack products, MCP servers, LLM workflows, and developer tools.",
};

const snapshotStats = [
  ["9+", "years building web products"],
  ["17+", "projects supported as lead engineer"],
  ["AI", "assistant systems, MCP, LLM workflows"],
  ["Full-stack", "React, Next.js, Node.js, Go, cloud"],
];

const experienceHighlights = [
  {
    company: "ControlUp",
    role: "Senior Full Stack Engineer / AI Engineer",
    detail:
      "Building production AI assistant infrastructure with MCP servers, tool orchestration, human-in-the-loop flows, chat history, and full-stack LLM integrations.",
  },
  {
    company: "Quicklizard",
    role: "Senior Software Engineer",
    detail:
      "Delivered pricing and commerce features across Next.js, Go services, Redis, RabbitMQ, PostgreSQL, Kafka, AWS, and observability tooling.",
  },
  {
    company: "S-PRO",
    role: "Lead Software Engineer",
    detail:
      "Led frontend engineers, supported 17+ projects, contributed to discovery, hiring, estimations, workshops, and system architecture.",
  },
];

const workingPrinciples = [
  {
    title: "Practical AI",
    detail: "LLM features should be observable, debuggable, and useful inside real product workflows.",
    icon: BrainCircuit,
  },
  {
    title: "Product gravity",
    detail: "The point is not just clean code. It is helping people learn, work, decide, ship, and operate.",
    icon: Activity,
  },
  {
    title: "Tooling taste",
    detail: "Fast feedback loops, developer experience, automation, and terminal-native workflows matter.",
    icon: Terminal,
  },
  {
    title: "Maintainable systems",
    detail: "Clear ownership, simple abstractions, and production reliability beat cleverness for its own sake.",
    icon: Wrench,
  },
];

export default function HomePage() {
  const featuredProjects = projects.slice(0, 3);

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-col px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <section className="grid min-h-[calc(100svh-8rem)] items-center gap-10 py-8 lg:grid-cols-[1.04fr_0.96fr] lg:py-12">
          <div className="max-w-4xl">
            <div className="motion-rise liquid-glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold tracking-[0.16em] text-muted-foreground">
              <Sparkles size={15} strokeWidth={2.4} className="text-accent" />
              Senior Full Stack Engineer / AI Engineer
            </div>

            <h1 className="motion-rise motion-delay-1 max-w-5xl text-balance text-[clamp(3.25rem,8.2vw,8.9rem)] font-black leading-[0.88] tracking-tight text-foreground">
              Software with a pulse
            </h1>

            <p className="motion-rise motion-delay-2 mt-8 max-w-2xl text-pretty text-xl leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
              I am Oleh, a Ukrainian engineer based in Poland. I build practical AI systems, full-stack products, MCP
              servers, LLM workflows, and developer tools with TypeScript, React, Node.js, Go, and cloud infrastructure.
            </p>

            <div className="motion-rise motion-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                href="/projects"
                transitionTypes={["nav-forward"]}
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                See the work
                <ArrowRight
                  data-icon="inline-end"
                  strokeWidth={2.5}
                  className="transition group-hover/button:translate-x-0.5"
                />
              </Link>
              <Link
                href="/api/resume/pdf"
                className={buttonVariants({ variant: "glass", size: "lg" })}
                rel="noopener noreferrer"
              >
                <FileDown data-icon="inline-start" strokeWidth={2.4} />
                Download CV
              </Link>
              <a
                href="https://www.linkedin.com/in/exsesx/"
                className={buttonVariants({ variant: "glass", size: "lg" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                <LinkedinIcon data-icon="inline-start" strokeWidth={2.4} />
                LinkedIn
              </a>
              <a
                href="https://github.com/exsesx"
                className={buttonVariants({ variant: "glass", size: "lg" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                <GithubIcon data-icon="inline-start" strokeWidth={2.4} />
                GitHub
              </a>
            </div>
          </div>

          <aside className="motion-rise motion-delay-2 liquid-glass relative overflow-hidden rounded-[2rem] p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent dark:via-amber-200/70" />
            <UiCard className="liquid-glass gap-0 rounded-[1.45rem] py-0 shadow-none">
              <CardHeader className="flex flex-row items-start justify-between gap-4 px-5 pt-5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground">Professional snapshot</p>
                  <CardTitle className="mt-3 text-3xl font-black tracking-tight text-foreground">
                    Building AI-assisted product systems across frontend, backend, and cloud
                  </CardTitle>
                  <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/55 px-3 py-1.5 text-xs font-bold text-muted-foreground">
                    <BrainCircuit size={14} strokeWidth={2.4} className="text-accent" />
                    AI systems and product engineering
                  </span>
                </div>
                <span className="relative block size-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted shadow-lg shadow-foreground/10 ring-4 ring-background/55">
                  <Image
                    src="/images/me/oleh_portrait.jpg"
                    alt="Portrait of Oleh Vanin"
                    fill
                    sizes="80px"
                    className="object-cover object-[50%_34%]"
                    priority
                  />
                </span>
              </CardHeader>

              <CardContent className="px-5 pb-5">
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {snapshotStats.map(([value, label]) => (
                    <UiCard
                      key={label}
                      className="gap-0 rounded-2xl border-border bg-background/45 p-4 py-4 shadow-none"
                    >
                      <p className="text-3xl font-black text-foreground">{value}</p>
                      <p className="mt-2 text-xs font-bold leading-5 text-muted-foreground">{label}</p>
                    </UiCard>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {specialties.map(specialty => (
                    <Badge key={specialty} variant="outline" className="h-7 bg-background/50 px-3 text-sm font-bold">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </UiCard>

            <a
              href="https://cal.com/exsesx/personal"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-4 w-full justify-between rounded-[1.45rem] p-5",
              )}
            >
              <span className="font-black">Schedule a conversation</span>
              <Send data-icon="inline-end" strokeWidth={2.4} />
            </a>
          </aside>
        </section>

        <Separator />
        <section className="py-14">
          <div className="mb-8 flex flex-col gap-3">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-accent">
              <BriefcaseBusiness size={15} strokeWidth={2.4} />
              Experience
            </p>
            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Senior full-stack work across AI, product, and production systems
            </h2>
          </div>
          <div className="grid gap-3">
            {experienceHighlights.map(item => (
              <UiCard
                key={item.company}
                className="liquid-glass gap-0 rounded-[1.35rem] px-5 py-4 shadow-none sm:grid sm:grid-cols-[0.34fr_0.66fr] sm:gap-6 sm:px-6"
              >
                <div>
                  <h3 className="text-xl font-black text-foreground">{item.company}</h3>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">{item.role}</p>
                </div>
                <p className="mt-4 text-base leading-7 text-muted-foreground sm:mt-0">{item.detail}</p>
              </UiCard>
            ))}
          </div>
        </section>

        <Separator />
        <section className="py-14">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Operating style</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Useful software, fast feedback, fewer weird corners
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-muted-foreground">
              I like engineering that serves the product: observable systems, thoughtful automation, and tools that make
              teams faster without making the codebase stranger.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {workingPrinciples.map(item => {
              const Icon = item.icon;

              return (
                <UiCard key={item.title} className="liquid-glass gap-0 rounded-[1.35rem] p-5 shadow-none">
                  <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Icon size={19} strokeWidth={2.4} />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </UiCard>
              );
            })}
          </div>
        </section>

        <Separator />
        <section className="py-16">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Selected projects</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                Real product surfaces, not just shiny screenshots
              </h2>
            </div>
            <Link
              href="/projects"
              transitionTypes={["nav-forward"]}
              className={buttonVariants({ variant: "glass", size: "default" })}
            >
              All projects
              <ArrowRight data-icon="inline-end" strokeWidth={2.5} />
            </Link>
          </div>
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {featuredProjects.map(project => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
