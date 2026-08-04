import type * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "outline" | "secondary";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  outline: "border-border text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & { variant: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        badgeVariantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
