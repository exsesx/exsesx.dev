"use client";

import { type ComponentProps, type ReactNode, ViewTransition } from "react";
import { useDesktopViewTransitions } from "@/lib/view-transitions";

type DesktopViewTransitionProps = ComponentProps<typeof ViewTransition> & {
  children: ReactNode;
  enabled?: boolean;
};

export function DesktopViewTransition({ children, enabled = true, ...props }: DesktopViewTransitionProps) {
  const shouldUseViewTransition = useDesktopViewTransitions();

  if (!enabled || !shouldUseViewTransition) {
    return <>{children}</>;
  }

  return <ViewTransition {...props}>{children}</ViewTransition>;
}
