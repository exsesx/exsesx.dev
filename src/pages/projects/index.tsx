import { Code2, Layers3 } from "lucide-react";
import Head from "next/head";
import Card from "../../components/Card";
import { GithubIcon } from "../../components/icons/lucide-github";
import { buttonVariants } from "../../components/ui/button";
import { Card as UiCard, CardContent } from "../../components/ui/card";
import { projects } from "../../lib/projects";
import { cn } from "../../lib/utils";

export default function Projects() {
  return (
    <>
      <Head>
        <title>Oleh Vanin - Projects</title>
        <meta
          name="description"
          content="Selected product engineering work by Oleh Vanin across fintech, education, commerce, utilities, and digital asset products."
        />
      </Head>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <section className="grid gap-5 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
          <div className="motion-rise">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Project index</p>
            <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.75rem,6vw,5.75rem)] font-black leading-[0.9] tracking-tight text-foreground">
              Built across real constraints.
            </h1>
          </div>

          <UiCard className="motion-rise motion-delay-1 rounded-[1.5rem] border-border bg-card/75 py-0 shadow-panel backdrop-blur-2xl">
            <CardContent className="flex gap-3 px-4 py-4 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <Layers3 size={20} strokeWidth={2.4} />
              </span>
              <div>
                <p className="text-base font-black text-foreground">{projects.length} selected surfaces</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Commerce, education, banking, utilities, regulated crypto, and learning tools.
                </p>
              </div>
            </CardContent>
          </UiCard>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <div key={project.title} className="motion-rise h-full">
              <Card project={project} density="compact" />
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-[1.5rem] border border-border bg-primary p-5 text-primary-foreground shadow-project-cta sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] opacity-70">
                <Code2 size={15} strokeWidth={2.4} />
                Current appetite
              </p>
              <h2 className="mt-2 max-w-3xl text-2xl font-black tracking-tight sm:text-3xl">
                Useful interfaces with architecture underneath, not just shine on top.
              </h2>
            </div>
            <a
              href="https://github.com/exsesx"
              className={cn(buttonVariants({ variant: "inverse", size: "lg" }), "shrink-0")}
            >
              <GithubIcon data-icon="inline-start" strokeWidth={2.4} />
              More on GitHub
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
