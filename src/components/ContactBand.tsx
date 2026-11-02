import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { SITE_PROFILE } from "@/lib/site-profile";
import { GithubIcon } from "./icons/lucide-github";
import { LinkedinIcon } from "./icons/lucide-linkedin";
import { buttonVariants } from "./ui/button-variants";

/*
 * The close: a change of paper holding the one thing a visitor came to do.
 * Title, line and actions share one left edge, the way every masthead reads,
 * so nothing floats in a column of its own.
 */
export default function ContactBand({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="close-band mt-section">
      <div className="page-safe-inline mx-auto w-full max-w-7xl py-section-s">
        <h2 id={id} className="section-title max-w-[20ch]">
          {title}
        </h2>
        <p className="mt-6 max-w-[48ch] text-pretty text-lead text-muted-foreground">{children}</p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
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
      </div>
    </section>
  );
}
