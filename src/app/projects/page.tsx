import { Layers3 } from "lucide-react";
import type { Metadata } from "next";
import Card from "../../components/Card";
import RouteFadeTransition from "../../components/RouteFadeTransition";
import { CardContent, Card as UiCard } from "../../components/ui/card";
import { createPageMetadata, projectsSocialImage } from "../../lib/metadata";
import { projects } from "../../lib/projects";

export const metadata: Metadata = createPageMetadata({
  title: "Oleh Vanin - Projects",
  description:
    "Featured product engineering work by Oleh Vanin across AI, enterprise IT, pricing, fintech, education, commerce, utilities, and digital asset products.",
  path: "/projects",
  image: projectsSocialImage,
});

export default function Projects() {
  return (
    <RouteFadeTransition>
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:pt-32">
        <section className="grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(18rem,0.32fr)] lg:items-end">
          <div className="motion-rise">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Featured projects</p>
            <h1 className="mt-3 max-w-4xl text-balance text-[clamp(2.75rem,6vw,5.75rem)] font-black leading-[0.9] tracking-tight text-foreground">
              Built across real constraints
            </h1>
          </div>

          <UiCard className="motion-rise motion-delay-1 w-full max-w-sm justify-self-start rounded-xl border-border/70 bg-card/45 py-0 shadow-none backdrop-blur-xl lg:justify-self-end">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-foreground"
              >
                <Layers3 size={17} strokeWidth={2.2} />
              </span>
              <p className="text-sm font-medium leading-6 text-muted-foreground">
                <span className="font-bold text-foreground">{projects.length} featured surfaces</span>, curated from a
                wider history across AI, enterprise IT, pricing, fintech, education, commerce, utilities, and crypto.
              </p>
            </CardContent>
          </UiCard>
        </section>

        <section className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <div key={project.id} className="motion-rise h-full">
              <Card
                project={project}
                density="compact"
                enableMediaTransition
                mediaLoading={index === 0 ? "eager" : "lazy"}
                mediaPriority={index === 0}
              />
            </div>
          ))}
        </section>
      </main>
    </RouteFadeTransition>
  );
}
