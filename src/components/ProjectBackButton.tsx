"use client";

import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
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

  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant: "glass", size: "sm" }), "w-fit")}
      onClick={navigateBack}
    >
      <ArrowLeft data-icon="inline-start" strokeWidth={2.4} />
      Back
    </button>
  );
}
