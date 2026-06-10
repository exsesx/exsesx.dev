"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent } from "react";
import { getPreviousRoute, queueScrollRestore } from "@/lib/navigation-history";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./ui/button-variants";

type ProjectBackButtonProps = {
  fallbackHref: Route;
  fallbackTransitionTypes: string[];
};

function shouldRestoreSharedProjectMedia(path: string) {
  return path === "/projects" || path.startsWith("/projects?") || path.startsWith("/projects#");
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']")
  );
}

export default function ProjectBackButton({ fallbackHref, fallbackTransitionTypes }: ProjectBackButtonProps) {
  const router = useRouter();

  function navigateBack() {
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
      router.push(fallbackHref, { transitionTypes: fallbackTransitionTypes });
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
    function handleKeyDown(event: KeyboardEvent) {
      handleEscapeKeyDown(event);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-fit cursor-pointer")}
      onClick={navigateBack}
    >
      <ArrowLeft data-icon="inline-start" strokeWidth={2.4} />
      Back
    </button>
  );
}
