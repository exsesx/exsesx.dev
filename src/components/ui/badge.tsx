import type * as React from "react";
import { cn } from "@/lib/utils";
import { type BadgeVariant, badgeVariants } from "./badge-variants";

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
