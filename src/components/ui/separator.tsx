import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

function Separator({ className, ...props }: Omit<SeparatorPrimitive.Props, "orientation">) {
  return (
    <SeparatorPrimitive
      {...props}
      data-slot="separator"
      orientation="horizontal"
      className={cn("h-px w-full shrink-0 bg-border", className)}
    />
  );
}

export { Separator };
