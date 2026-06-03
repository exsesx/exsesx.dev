import { Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Card from "../../components/Card";
import { Card as UiCard, CardContent } from "../../components/ui/card";
import { projects } from "../../lib/projects";

export const metadata: Metadata = {
  title: "Oleh Vanin - Projects",
  description:
    "Selected product engineering work by Oleh Vanin across fintech, education, commerce, utilities, and digital asset products.",
  alternates: {
    canonical: "https://exsesx.dev/projects",
  },
  openGraph: {
    url: "https://exsesx.dev/projects",
    title: "Oleh Vanin - Projects",
    description:
      "Selected product engineering work by Oleh Vanin across fintech, education, commerce, utilities, and digital asset products.",
  },
};

export default function Projects() {
  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:pt-28">
        <section className="grid gap-5 lg:grid-cols-[0.72fr_0.28fr] lg:items-end">
          <div className="motion-rise">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Project index</p>
            <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.75rem,6vw,5.75rem)] font-black leading-[0.9] tracking-tight text-foreground">
              Built across real constraints
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

        <section className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <div key={project.title} className="motion-rise h-full">
              <Card project={project} density="compact" />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
