"use client";

import { ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, useState } from "react";
import { ROUTE_TRANSITION_TYPES, suppressEntryMotionProps } from "@/lib/motion-contract";
import { cn } from "@/lib/utils";
import AsciiField from "./AsciiField";
import { buttonVariants } from "./ui/button-variants";

/*
 * The 404 as a patient monitor: the heading's flat line runs on across the
 * ASCII field. A click or tap on the field (or the button that appears on
 * keyboard focus) restarts the pulse: the field beats again, the mark gets its
 * beat back and the heading follows. The page itself stays missing. On
 * phones the copy sits low, as on the homepage, so the field's line runs clear
 * above the heading.
 */
const FLAT_PATH = "M4 60 H236";
const BEAT_PATH = "M4 60 H70 L80 68 L94 8 L108 70 L118 60 H236";
const CONTROL_SELECTOR = "a, button, input, textarea, select, label, [role='button']";

export default function NotFoundContent() {
  const [revived, setRevived] = useState(false);
  const tracePath = revived ? BEAT_PATH : FLAT_PATH;

  // Controls keep their own job, and selecting text is not a shock.
  function handleFieldClick(event: MouseEvent<HTMLElement>) {
    const onControl = event.target instanceof Element && event.target.closest(CONTROL_SELECTOR);
    const selecting = window.getSelection()?.isCollapsed === false;

    if (onControl || selecting) {
      return;
    }

    setRevived(true);
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Pointer shortcut only; the restart button below is the keyboard path.
    <main
      id="main-content"
      tabIndex={-1}
      lang="en"
      className="not-found-shell relative isolate flex min-h-svh w-full flex-col justify-end pb-20 pt-28 lg:justify-center lg:pt-32"
      data-ascii-host=""
      onClick={handleFieldClick}
    >
      <AsciiField className="absolute inset-0 -z-10" rhythm={revived ? "sinus" : "flatline"} placement="around" />

      <div className="page-safe-inline mx-auto w-full max-w-7xl">
        <h1
          className="not-found-title display-title motion-rise motion-delay-1 text-display font-black text-foreground"
          data-ascii-avoid=""
        >
          <span className="whitespace-nowrap">
            {revived ? "Stable." : "Flatlined."}
            <svg
              className="pulse-trace not-found-trace"
              viewBox="0 0 240 72"
              aria-hidden="true"
              focusable="false"
              // The field continues this line from its baseline (y=60 of 72).
              data-ascii-trace=""
              data-ascii-baseline={60 / 72}
            >
              <path className="pulse-trace-glow" pathLength={100} d={tracePath} />
              <path className="pulse-trace-path" pathLength={100} d={tracePath} />
            </svg>
          </span>
        </h1>

        <p
          className="not-found-label motion-rise motion-delay-2 mt-6 text-sm text-muted-foreground"
          data-ascii-avoid=""
        >
          Error 404
        </p>

        <p
          className="not-found-copy motion-rise motion-delay-2 mt-8 max-w-xl text-pretty text-lead text-muted-foreground"
          data-ascii-avoid=""
        >
          This page wandered off. The link may be old, or a project was renamed. The work itself is still very much
          alive.
        </p>

        <div className="not-found-actions motion-rise motion-delay-3 mt-10 flex flex-wrap gap-3" data-ascii-avoid="">
          <Link
            href="/"
            {...suppressEntryMotionProps}
            data-cuelume-press=""
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            <Home data-icon="inline-start" strokeWidth={2.5} />
            Back home
          </Link>
          <Link
            href="/projects"
            transitionTypes={[ROUTE_TRANSITION_TYPES.navForward]}
            {...suppressEntryMotionProps}
            data-cuelume-press=""
            className={buttonVariants({ variant: "glass", size: "lg" })}
          >
            See the work
            <ArrowRight data-icon="inline-end" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Hidden like the skip link until keyboard focus; it stays mounted after
          the restart so focus never drops. */}
      <button
        type="button"
        className={cn(buttonVariants({ variant: "glass", size: "lg" }), "not-found-revive")}
        aria-disabled={revived || undefined}
        onClick={() => setRevived(true)}
      >
        {revived ? "Pulse restored" : "Restart the pulse"}
      </button>

      <p className="sr-only" role="status">
        {revived ? "Pulse restored. This page is still missing." : ""}
      </p>
    </main>
  );
}
