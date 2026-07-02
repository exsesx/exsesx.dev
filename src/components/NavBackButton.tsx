"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent } from "react";
import { getPreviousRoute, queueScrollRestore } from "@/lib/navigation-history";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button-variants";

const FALLBACK_HREF: Route = "/projects";

type NavBackButtonProps = {
  active: boolean;
};

function shouldRestoreSharedProjectMedia(path: string) {
  return path === "/projects" || path.startsWith("/projects?") || path.startsWith("/projects#");
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
  );
}

/* The project page owns its shared-media morph type and publishes it on
   <main>; reading it at click time keeps the projects data out of the nav
   bundle, which loads on every route. */
function getFallbackTransitionTypes() {
  const transitionType = document
    .querySelector("main[data-back-transition-type]")
    ?.getAttribute("data-back-transition-type");

  return transitionType ? ["nav-back", transitionType] : ["nav-back"];
}

export default function NavBackButton({ active }: NavBackButtonProps) {
  const router = useRouter();

  function navigateBack() {
    const fallbackTransitionTypes = getFallbackTransitionTypes();
    const previousRoute = getPreviousRoute();
    document.documentElement.dataset.viewTransitionNavigated = "true";

    if (previousRoute) {
      queueScrollRestore(previousRoute);

      startTransition(() => {
        router.push(previousRoute.path as Route, {
          scroll: false,
          transitionTypes: shouldRestoreSharedProjectMedia(previousRoute.path) ? fallbackTransitionTypes : ["nav-back"],
        });
      });
      return;
    }

    startTransition(() => {
      router.push(FALLBACK_HREF, { transitionTypes: fallbackTransitionTypes });
    });
  }

  const handleEscapeKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.key !== "Escape" ||
      isEditableTarget(event.target) ||
      document.querySelector(".hotkeys-panel")
    ) {
      return;
    }

    event.preventDefault();
    navigateBack();
  });

  useEffect(() => {
    if (!active) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      handleEscapeKeyDown(event);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  return (
    <button
      type="button"
      aria-label="Back"
      aria-hidden={active ? undefined : "true"}
      disabled={!active}
      data-active={active ? "true" : "false"}
      className={cn(buttonVariants({ variant: "glass", size: "icon" }), "nav-back-button cursor-pointer")}
      onClick={navigateBack}
    >
      <ArrowLeft strokeWidth={2.4} />
    </button>
  );
}
