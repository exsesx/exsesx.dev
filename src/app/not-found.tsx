import { ArrowRight, Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import RouteFadeTransition from "../components/RouteFadeTransition";
import { buttonVariants } from "../components/ui/button-variants";
import { siteName } from "../lib/metadata";

export const metadata: Metadata = {
  title: `Page not found - ${siteName}`,
  description: "This page wandered off. The link may be old or the project was renamed.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <RouteFadeTransition>
      <main className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:pt-32">
        <section className="max-w-3xl">
          <p className="motion-rise flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-accent">
            Error 404
          </p>

          <h1 className="motion-rise motion-delay-1 mt-4 text-balance text-[clamp(3.25rem,8.2vw,8.9rem)] font-black leading-[0.88] tracking-tight text-foreground">
            Flatlined.
          </h1>

          {/* a flat "pulse" — the page has no heartbeat. echoes the site's pulse motif */}
          <svg
            aria-hidden="true"
            viewBox="0 0 420 40"
            preserveAspectRatio="none"
            className="motion-rise motion-delay-2 mt-4 h-12 w-full max-w-xl text-accent"
          >
            <polyline
              points="0,20 150,20 165,20 172,9 180,31 188,20 420,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <p className="motion-rise motion-delay-2 mt-8 max-w-xl text-pretty text-xl leading-8 text-muted-foreground sm:text-2xl sm:leading-10">
            This page wandered off. The link may be old, or a project was renamed. The work itself is still very much
            alive.
          </p>

          <div className="motion-rise motion-delay-3 mt-10 flex flex-wrap gap-3">
            <Link href="/" className={buttonVariants({ variant: "default", size: "lg" })}>
              <Home data-icon="inline-start" strokeWidth={2.5} />
              Back home
            </Link>
            <Link
              href="/projects"
              transitionTypes={["nav-forward"]}
              data-suppress-entry-motion
              className={buttonVariants({ variant: "glass", size: "lg" })}
            >
              See the work
              <ArrowRight
                data-icon="inline-end"
                strokeWidth={2.5}
                className="transition group-hover/button:translate-x-0.5"
              />
            </Link>
          </div>
        </section>
      </main>
    </RouteFadeTransition>
  );
}
